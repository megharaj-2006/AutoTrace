"""
Containment Engine — Docker network isolation for quarantined services.

This module performs the actual containment operations:
1. Verify container exists and is on the target network.
2. Disconnect the container from the Docker network.
3. Verify disconnection succeeded.

Security properties:
- Only operates on explicitly allowlisted services and networks.
- Uses Docker SDK (no shell subprocess) to prevent command injection.
- Verifies container identity before acting.
- Tracks quarantine state to handle duplicate requests safely.
- Never auto-reconnects without explicit authorization.
"""

from __future__ import annotations

import json
import logging
import os
import threading
import time
from typing import Any, Optional

from .config import ActuatorConfig

try:
    from pki.spiffe_revocation import SPIFFERevocationHook
except ImportError:
    try:
        from ..pki.spiffe_revocation import SPIFFERevocationHook
    except ImportError:
        SPIFFERevocationHook = None  # type: ignore

logger = logging.getLogger("actuator-security.containment")


class ContainmentError(Exception):
    """Raised when a containment operation fails."""

    def __init__(self, message: str, recoverable: bool = False) -> None:
        super().__init__(message)
        self.recoverable = recoverable


class DockerUnavailableError(ContainmentError):
    """Raised when the Docker daemon is unreachable."""

    def __init__(self, message: str = "Docker daemon is not available") -> None:
        super().__init__(message, recoverable=False)


class ContainerNotFoundError(ContainmentError):
    """Raised when the target container does not exist."""

    def __init__(self, container_id: str) -> None:
        super().__init__(f"Container '{container_id}' not found", recoverable=False)


class NetworkNotFoundError(ContainmentError):
    """Raised when the target network does not exist."""

    def __init__(self, network_name: str) -> None:
        super().__init__(f"Network '{network_name}' not found", recoverable=False)


class PermissionError(ContainmentError):
    """Raised when the actuator lacks permissions for the operation."""

    def __init__(self, message: str = "Insufficient permissions for containment") -> None:
        super().__init__(message, recoverable=False)


class ContainmentResult:
    """Result of a containment operation."""

    def __init__(
        self,
        success: bool,
        action: str,
        execution_time_ms: float,
        detail: str = "",
        already_contained: bool = False,
        spiffe_revoked: bool = False,
    ) -> None:
        self.success = success
        self.action = action
        self.execution_time_ms = execution_time_ms
        self.detail = detail
        self.already_contained = already_contained
        self.spiffe_revoked = spiffe_revoked


class ContainmentEngine:
    """
    Executes network isolation containment against Docker containers.

    Thread-safe quarantine state tracking prevents duplicate operations
    and ensures predictable behavior under concurrent requests.
    """

    def __init__(self, config: ActuatorConfig) -> None:
        self._config = config
        self._docker_client = None
        self._quarantined: set[str] = set()
        self._lock = threading.Lock()
        self._container_locks: dict[str, threading.Lock] = {}
        self._spiffe_hook = SPIFFERevocationHook() if SPIFFERevocationHook else None
        self._load_state()
        if not self._config.dry_run and self.check_docker_available():
            self.reconcile_state()

    def _get_container_lock(self, container_id: str) -> threading.Lock:
        """Retrieve or create a fine-grained mutex for this container."""
        with self._lock:
            if container_id not in self._container_locks:
                self._container_locks[container_id] = threading.Lock()
            return self._container_locks[container_id]

    def _save_state(self) -> None:
        """Persist tracked quarantine state to file if configured."""
        if not self._config.state_file_path:
            return
        try:
            with self._lock:
                items = list(self._quarantined)
            with open(self._config.state_file_path, "w", encoding="utf-8") as f:
                json.dump({"quarantined": items}, f, indent=2)
        except Exception as exc:
            logger.warning("Failed to persist quarantine state journal: %s", exc)

    def _load_state(self) -> None:
        """Load persisted quarantine state from journal file if configured and exists."""
        if not self._config.state_file_path:
            return
        try:
            if os.path.exists(self._config.state_file_path):
                with open(self._config.state_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    with self._lock:
                        self._quarantined.update(data.get("quarantined", []))
                logger.info("Loaded persisted quarantine state: %s", list(self._quarantined))
        except Exception as exc:
            logger.warning("Failed to load quarantine state journal: %s", exc)

    def reconcile_state(self) -> dict[str, Any]:
        """
        Reconcile tracked quarantine state with actual Docker network reality.
        Detects if allowlisted culprits are running but detached from docker_network.
        """
        if self._config.dry_run or not self.check_docker_available():
            with self._lock:
                return {
                    "status": "SKIPPED",
                    "mode": "DRY_RUN_OR_OFFLINE",
                    "quarantined": list(self._quarantined),
                }

        reconciled_added: list[str] = []
        try:
            client = self._get_docker_client()
            for culprit in self._config.allowed_culprits:
                try:
                    c = client.containers.get(culprit)
                    c.reload()
                    nets = c.attrs.get("NetworkSettings", {}).get("Networks", {})
                    if self._config.docker_network not in nets:
                        with self._lock:
                            if culprit not in self._quarantined:
                                self._quarantined.add(culprit)
                                reconciled_added.append(culprit)
                except Exception:
                    pass
            self._save_state()
            with self._lock:
                return {
                    "status": "RECONCILED",
                    "reconciled_added": reconciled_added,
                    "quarantined": list(self._quarantined),
                }
        except Exception as exc:
            logger.warning("State reconciliation encountered error: %s", exc)
            with self._lock:
                return {"status": "ERROR", "detail": str(exc), "quarantined": list(self._quarantined)}

    def _get_docker_client(self):
        """Lazily initialize the Docker client. Raises DockerUnavailableError on failure."""
        if self._docker_client is None:
            try:
                import docker
                self._docker_client = docker.from_env()
                # Verify connectivity
                self._docker_client.ping()
            except ImportError:
                raise DockerUnavailableError(
                    "Docker SDK (pip install docker) is not installed"
                )
            except Exception as exc:
                self._docker_client = None
                raise DockerUnavailableError(
                    f"Cannot connect to Docker daemon: {exc}"
                )
        return self._docker_client

    def check_docker_available(self) -> bool:
        """Check if Docker is reachable without raising."""
        try:
            self._get_docker_client()
            return True
        except DockerUnavailableError:
            return False

    def is_quarantined(self, container_id: str) -> bool:
        """Check if a container is currently tracked as quarantined."""
        with self._lock:
            return container_id in self._quarantined

    def get_quarantined_services(self) -> list[str]:
        """Return a snapshot of currently quarantined container IDs."""
        with self._lock:
            return list(self._quarantined)

    def quarantine(
        self,
        container_id: str,
        network_name: str,
        culprit_service: Optional[str] = None,
    ) -> ContainmentResult:
        """
        Disconnect a container from the specified Docker network.

        Steps:
        1. Acquire per-container lock to prevent concurrent TOCTOU races.
        2. Check if already quarantined (idempotent handling).
        3. Verify container exists and is on the target network.
        4. Disconnect the container.
        5. Verify disconnection.
        6. Revoke workload SPIFFE/SPIRE identity.
        7. Track quarantine state and persist.

        Returns ContainmentResult with measured execution time.
        """
        start_ns = time.perf_counter_ns()
        service_label = culprit_service or container_id
        c_lock = self._get_container_lock(container_id)

        with c_lock:
            # Check duplicate quarantine
            with self._lock:
                if container_id in self._quarantined:
                    elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                    logger.info(
                        "Container '%s' is already quarantined on network '%s'",
                        container_id, network_name,
                    )
                    return ContainmentResult(
                        success=True,
                        action="NETWORK_ISOLATION",
                        execution_time_ms=round(elapsed_ms, 2),
                        detail=f"Container '{container_id}' was already quarantined",
                        already_contained=True,
                        spiffe_revoked=self._spiffe_hook.is_identity_revoked(service_label) if self._spiffe_hook else False,
                    )

            if self._config.dry_run:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                with self._lock:
                    self._quarantined.add(container_id)
                self._save_state()
                if self._spiffe_hook:
                    self._spiffe_hook.revoke_workload_identity(service_label, reason="Dry-run containment")
                logger.info(
                    "[DRY-RUN] Would disconnect container '%s' from network '%s'",
                    container_id, network_name,
                )
                return ContainmentResult(
                    success=True,
                    action="NETWORK_ISOLATION",
                    execution_time_ms=round(elapsed_ms, 2),
                    detail=f"[DRY-RUN] Container '{container_id}' would be disconnected from '{network_name}'",
                    spiffe_revoked=True if self._spiffe_hook else False,
                )

            # Real containment via Docker SDK
            try:
                client = self._get_docker_client()
            except DockerUnavailableError:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                raise DockerUnavailableError(
                    f"Cannot perform containment: Docker daemon unreachable (elapsed {round(elapsed_ms, 2)}ms)"
                )

            # Step 2: Verify container exists
            try:
                container = client.containers.get(container_id)
            except Exception as exc:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                if "404" in str(exc) or "not found" in str(exc).lower():
                    raise ContainerNotFoundError(container_id)
                raise ContainmentError(
                    f"Error accessing container '{container_id}': {exc}"
                )

            # Step 3: Verify container is on the target network
            container.reload()
            container_networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
            if network_name not in container_networks:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                logger.warning(
                    "Container '%s' is not connected to network '%s'. "
                    "Connected networks: %s",
                    container_id, network_name,
                    list(container_networks.keys()),
                )
                with self._lock:
                    self._quarantined.add(container_id)
                self._save_state()
                if self._spiffe_hook:
                    self._spiffe_hook.revoke_workload_identity(service_label, reason="Already disconnected")
                return ContainmentResult(
                    success=True,
                    action="NETWORK_ISOLATION",
                    execution_time_ms=round(elapsed_ms, 2),
                    detail=(
                        f"Container '{container_id}' is already disconnected from "
                        f"'{network_name}'. Connected to: {list(container_networks.keys())}"
                    ),
                    already_contained=True,
                    spiffe_revoked=True if self._spiffe_hook else False,
                )

            # Step 4: Get the network object and disconnect
            try:
                network = client.networks.get(network_name)
            except Exception as exc:
                if "404" in str(exc) or "not found" in str(exc).lower():
                    raise NetworkNotFoundError(network_name)
                raise ContainmentError(f"Error accessing network '{network_name}': {exc}")

            try:
                network.disconnect(container, force=True)
            except Exception as exc:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                error_str = str(exc).lower()
                if "permission" in error_str or "denied" in error_str:
                    raise PermissionError(
                        f"Permission denied disconnecting '{container_id}' from '{network_name}': {exc}"
                    )
                raise ContainmentError(
                    f"Failed to disconnect container '{container_id}' from "
                    f"network '{network_name}': {exc}"
                )

            # Step 5: Verify disconnection
            container.reload()
            post_networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
            verified = network_name not in post_networks

            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000

            if verified:
                with self._lock:
                    self._quarantined.add(container_id)
                self._save_state()
                if self._spiffe_hook:
                    self._spiffe_hook.revoke_workload_identity(service_label, reason="Network disconnection verified")
                logger.info(
                    "CONTAINMENT SUCCESS: Container '%s' disconnected from '%s' in %.2fms",
                    container_id, network_name, elapsed_ms,
                )
                return ContainmentResult(
                    success=True,
                    action="NETWORK_ISOLATION",
                    execution_time_ms=round(elapsed_ms, 2),
                    detail=f"Container '{container_id}' disconnected from '{network_name}'",
                    spiffe_revoked=True if self._spiffe_hook else False,
                )
            else:
                logger.error(
                    "CONTAINMENT VERIFICATION FAILED: Container '%s' still on '%s' after disconnect (%.2fms)",
                    container_id, network_name, elapsed_ms,
                )
                raise ContainmentError(
                    f"Disconnection of '{container_id}' from '{network_name}' was not "
                    f"verified — container still appears connected after {round(elapsed_ms, 2)}ms"
                )

    def release(self, container_id: str, network_name: str) -> ContainmentResult:
        """
        Reconnect a previously quarantined container to the network.

        This is an explicit recovery action — never performed automatically.
        """
        start_ns = time.perf_counter_ns()
        c_lock = self._get_container_lock(container_id)

        with c_lock:
            with self._lock:
                if container_id not in self._quarantined:
                    elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                    return ContainmentResult(
                        success=False,
                        action="NONE",
                        execution_time_ms=round(elapsed_ms, 2),
                        detail=f"Container '{container_id}' is not currently quarantined",
                    )

            if self._config.dry_run:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                with self._lock:
                    self._quarantined.discard(container_id)
                self._save_state()
                if self._spiffe_hook:
                    self._spiffe_hook.restore_workload_identity(container_id)
                logger.info(
                    "[DRY-RUN] Would reconnect container '%s' to network '%s'",
                    container_id, network_name,
                )
                return ContainmentResult(
                    success=True,
                    action="NETWORK_RESTORE",
                    execution_time_ms=round(elapsed_ms, 2),
                    detail=f"[DRY-RUN] Container '{container_id}' would be reconnected to '{network_name}'",
                )

            try:
                client = self._get_docker_client()
            except DockerUnavailableError:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                raise DockerUnavailableError(
                    f"Cannot perform release: Docker daemon unreachable (elapsed {round(elapsed_ms, 2)}ms)"
                )

            try:
                network = client.networks.get(network_name)
            except Exception as exc:
                if "404" in str(exc) or "not found" in str(exc).lower():
                    raise NetworkNotFoundError(network_name)
                raise ContainmentError(f"Error accessing network '{network_name}': {exc}")

            try:
                container = client.containers.get(container_id)
            except Exception as exc:
                if "404" in str(exc) or "not found" in str(exc).lower():
                    raise ContainerNotFoundError(container_id)
                raise ContainmentError(f"Error accessing container '{container_id}': {exc}")

            try:
                network.connect(container)
            except Exception as exc:
                elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
                raise ContainmentError(
                    f"Failed to reconnect '{container_id}' to '{network_name}': {exc}"
                )

            with self._lock:
                self._quarantined.discard(container_id)
            self._save_state()
            if self._spiffe_hook:
                self._spiffe_hook.restore_workload_identity(container_id)

            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000
            logger.info(
                "RELEASE SUCCESS: Container '%s' reconnected to '%s' in %.2fms",
                container_id, network_name, elapsed_ms,
            )
            return ContainmentResult(
                success=True,
                action="NETWORK_RESTORE",
                execution_time_ms=round(elapsed_ms, 2),
                detail=f"Container '{container_id}' reconnected to '{network_name}'",
            )
