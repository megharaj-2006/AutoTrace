"""
Configuration for the AutoTrace-Sec Security Actuator.

All runtime configuration is driven by environment variables with safe defaults.
No secrets are hardcoded. See infra/env.example for the template.
"""

import os
from typing import FrozenSet


class ActuatorConfig:
    """Immutable runtime configuration loaded from environment variables."""

    def __init__(self) -> None:
        # --- Service identity ---
        self.host: str = os.getenv("ACTUATOR_HOST", "0.0.0.0")
        self.port: int = int(os.getenv("ACTUATOR_SECURITY_PORT", "8081"))

        # --- Authentication ---
        # API key for quarantine endpoint protection.
        # If empty, the service refuses to start in production mode.
        self.api_key: str = os.getenv("ACTUATOR_API_KEY", "")

        # --- Dry-run mode ---
        # When True, containment actions are logged but not executed.
        # Safe default for development and testing.
        self.dry_run: bool = os.getenv("ACTUATOR_DRY_RUN", "true").lower() in (
            "true", "1", "yes",
        )

        # --- Docker network for containment ---
        self.docker_network: str = os.getenv(
            "ACTUATOR_DOCKER_NETWORK", "autotrace-mesh",
        )

        # --- Allowlists (explicit scope enforcement) ---
        # Only these services may be quarantined (culprit_service values).
        self.allowed_culprits: FrozenSet[str] = frozenset(
            s.strip()
            for s in os.getenv(
                "ACTUATOR_ALLOWED_CULPRITS",
                "reviews-service,order-service,gateway-service",
            ).split(",")
            if s.strip()
        )

        # Only these services may appear as protected targets.
        self.allowed_targets: FrozenSet[str] = frozenset(
            s.strip()
            for s in os.getenv(
                "ACTUATOR_ALLOWED_TARGETS",
                "payment-vault,order-service,gateway-service",
            ).split(",")
            if s.strip()
        )

        # Critical infrastructure that must NEVER be quarantined.
        self.protected_services: FrozenSet[str] = frozenset(
            s.strip()
            for s in os.getenv(
                "ACTUATOR_PROTECTED_SERVICES",
                "redpanda,redis,telemetry-collector,graph-engine,ml-detector,actuator-security,web-dashboard",
            ).split(",")
            if s.strip()
        )

        # --- Containment target latency (informational) ---
        self.containment_target_ms: int = int(
            os.getenv("ACTUATOR_CONTAINMENT_TARGET_MS", "2000"),
        )

        # --- Allowed networks for release / containment ---
        self.allowed_networks: FrozenSet[str] = frozenset(
            s.strip()
            for s in os.getenv(
                "ACTUATOR_ALLOWED_NETWORKS",
                self.docker_network,
            ).split(",")
            if s.strip()
        )

        # --- Rate Limiting ---
        self.rate_limit_enabled: bool = os.getenv("ACTUATOR_RATE_LIMIT_ENABLED", "true").lower() in (
            "true", "1", "yes",
        )
        self.rate_limit_requests: int = int(os.getenv("ACTUATOR_RATE_LIMIT_REQUESTS", "20"))
        self.rate_limit_window_sec: float = float(os.getenv("ACTUATOR_RATE_LIMIT_WINDOW_SEC", "1.0"))

        # --- Durable State Journal ---
        self.state_file_path: str = os.getenv("ACTUATOR_STATE_FILE", "")

    def validate(self) -> list[str]:
        """Return a list of configuration warnings/errors."""
        issues: list[str] = []
        if not self.api_key and not self.dry_run:
            issues.append(
                "ACTUATOR_API_KEY is not set and ACTUATOR_DRY_RUN is false. "
                "The service will reject all requests without authentication."
            )
        if not self.allowed_culprits:
            issues.append("ACTUATOR_ALLOWED_CULPRITS is empty — no services can be quarantined.")
        if not self.allowed_targets:
            issues.append("ACTUATOR_ALLOWED_TARGETS is empty — no targets are protected.")
        return issues
