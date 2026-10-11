"""
AutoTrace-Sec Security Actuator — FastAPI Application.

Exposes the quarantine containment API on port 8081.
Validates requests, enforces authentication and allowlists,
delegates to the containment engine, and returns structured responses.
"""

from __future__ import annotations

import logging
import secrets
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.security import APIKeyHeader

from .config import ActuatorConfig
from .containment import (
    ContainmentEngine,
    ContainmentError,
    ContainerNotFoundError,
    DockerUnavailableError,
    NetworkNotFoundError,
    PermissionError as ContainmentPermissionError,
)
from .models import (
    ContainmentAction,
    ContainmentStatus,
    ErrorResponse,
    HealthResponse,
    QuarantineRequest,
    QuarantineResponse,
    ReleaseRequest,
)

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("actuator-security")
audit_logger = logging.getLogger("actuator-security.audit")


def log_audit_event(
    action: str,
    status: str,
    caller: str,
    client_ip: str | None = None,
    culprit_service: str | None = None,
    container_id: str | None = None,
    target_service: str | None = None,
    execution_time_ms: float | None = None,
    detail: str = "",
) -> None:
    """Emit a structured JSON audit event for security monitoring and forensics."""
    import json
    from datetime import datetime, timezone

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "SECURITY_AUDIT",
        "action": action,
        "status": status,
        "caller": caller,
        "client_ip": client_ip or "unknown",
        "culprit_service": culprit_service,
        "container_id": container_id,
        "target_service": target_service,
        "execution_time_ms": execution_time_ms,
        "detail": detail,
    }
    audit_logger.info(json.dumps(event))


# --- Rate Limiter ---
import time
import threading
from collections import defaultdict


class RateLimiter:
    """Thread-safe sliding-window rate limiter."""

    def __init__(self) -> None:
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, client_key: str, max_requests: int, window_sec: float) -> bool:
        """Return True if request is within limit, False if rate exceeded."""
        now = time.monotonic()
        with self._lock:
            history = [t for t in self._requests[client_key] if now - t < window_sec]
            if len(history) >= max_requests:
                self._requests[client_key] = history
                return False
            history.append(now)
            self._requests[client_key] = history
            return True

    def reset(self) -> None:
        """Clear rate limit history (useful in tests)."""
        with self._lock:
            self._requests.clear()


_rate_limiter = RateLimiter()

# --- Module-level singletons ---
_config: ActuatorConfig | None = None
_engine: ContainmentEngine | None = None


def get_config() -> ActuatorConfig:
    """Retrieve runtime configuration, instantiating defaults if not initialized."""
    global _config
    if _config is None:
        _config = ActuatorConfig()
    return _config


def get_engine() -> ContainmentEngine:
    """Retrieve containment engine singleton, instantiating if not initialized."""
    global _engine
    if _engine is None:
        _engine = ContainmentEngine(get_config())
    return _engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    global _config, _engine

    _config = ActuatorConfig()
    _engine = ContainmentEngine(_config)

    # Log configuration summary (never log secrets)
    logger.info("=" * 60)
    logger.info("AutoTrace-Sec Security Actuator starting")
    logger.info("  Port: %d", _config.port)
    logger.info("  Dry-run mode: %s", _config.dry_run)
    logger.info("  Docker network: %s", _config.docker_network)
    logger.info("  Allowed culprits: %s", sorted(_config.allowed_culprits))
    logger.info("  Allowed targets: %s", sorted(_config.allowed_targets))
    logger.info("  Protected services: %s", sorted(_config.protected_services))
    logger.info("  API key configured: %s", bool(_config.api_key))
    logger.info("  Docker available: %s", _engine.check_docker_available())
    logger.info(
        "  Containment latency target: <%dms",
        _config.containment_target_ms,
    )

    issues = _config.validate()
    for issue in issues:
        logger.warning("CONFIG WARNING: %s", issue)

    logger.info("=" * 60)

    yield

    logger.info("AutoTrace-Sec Security Actuator shutting down")


app = FastAPI(
    title="AutoTrace-Sec Security Actuator",
    description="Zero-trust containment daemon for automated network isolation.",
    version="0.1.0",
    lifespan=lifespan,
)

# --- Authentication ---

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    request: Request,
    api_key: str | None = Security(api_key_header),
    cfg: ActuatorConfig = Depends(get_config),
) -> str:
    """
    Verify the API key from the X-API-Key header.

    Authentication rules:
    - If ACTUATOR_API_KEY is set, requests must include a matching X-API-Key header.
    - If ACTUATOR_API_KEY is empty AND dry_run is True, authentication is bypassed
      (development convenience only).
    - If ACTUATOR_API_KEY is empty AND dry_run is False, all requests are rejected
      (fail-safe: refuse to run unauthenticated in non-dry-run mode).
    """
    client_ip = request.client.host if request.client else None

    if not cfg.api_key:
        if cfg.dry_run:
            return "dev-mode"
        log_audit_event(
            action="AUTH_FAILURE",
            status="DENIED",
            caller="anonymous",
            client_ip=client_ip,
            detail="ACTUATOR_API_KEY required when dry_run is disabled",
        )
        raise HTTPException(
            status_code=503,
            detail="Service misconfigured: ACTUATOR_API_KEY is required when dry-run is disabled.",
        )

    if not api_key:
        log_audit_event(
            action="AUTH_FAILURE",
            status="DENIED",
            caller="anonymous",
            client_ip=client_ip,
            detail="Missing X-API-Key header",
        )
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header.",
        )

    # Constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(api_key, cfg.api_key):
        logger.warning("Authentication failed: invalid API key provided")
        log_audit_event(
            action="AUTH_FAILURE",
            status="DENIED",
            caller="invalid_key",
            client_ip=client_ip,
            detail="Invalid API key provided",
        )
        raise HTTPException(
            status_code=403,
            detail="Invalid API key.",
        )

    return api_key


async def enforce_rate_limit(
    request: Request,
    cfg: ActuatorConfig = Depends(get_config),
    api_key: str = Depends(verify_api_key),
) -> None:
    """Enforce rate limits per client IP / API key."""
    if not cfg.rate_limit_enabled:
        return
    client_ip = request.client.host if request.client else "unknown"
    client_key = f"{client_ip}:{api_key}"
    if not _rate_limiter.is_allowed(client_key, cfg.rate_limit_requests, cfg.rate_limit_window_sec):
        log_audit_event(
            action="RATE_LIMITED",
            status="DENIED",
            caller=api_key,
            client_ip=client_ip,
            detail=f"Rate limit of {cfg.rate_limit_requests} req / {cfg.rate_limit_window_sec}s exceeded",
        )
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: maximum {cfg.rate_limit_requests} requests per {cfg.rate_limit_window_sec} second(s).",
        )


# --- Endpoints ---


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check(
    cfg: ActuatorConfig = Depends(get_config),
    eng: ContainmentEngine = Depends(get_engine),
) -> HealthResponse:
    """Liveness probe."""
    return HealthResponse(
        status="HEALTHY",
        service="actuator-security",
        version="0.1.0",
        dry_run=cfg.dry_run,
        docker_available=eng.check_docker_available(),
    )


@app.get("/ready", tags=["health"])
async def readiness_check(
    cfg: ActuatorConfig = Depends(get_config),
    eng: ContainmentEngine = Depends(get_engine),
) -> dict:
    """
    Readiness check — returns 503 if the actuator cannot perform containment.

    In dry-run mode, Docker availability is not required.
    """
    docker_ok = eng.check_docker_available()

    if not cfg.dry_run and not docker_ok:
        raise HTTPException(
            status_code=503,
            detail="Not ready: Docker daemon is not available and dry-run is disabled.",
        )

    return {
        "status": "READY",
        "dry_run": cfg.dry_run,
        "docker_available": docker_ok,
    }


@app.post(
    "/api/v1/quarantine",
    response_model=QuarantineResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["containment"],
)
async def quarantine_service(
    request: QuarantineRequest,
    http_req: Request,
    _api_key: str = Depends(verify_api_key),
    _rate_limit: None = Depends(enforce_rate_limit),
    cfg: ActuatorConfig = Depends(get_config),
    eng: ContainmentEngine = Depends(get_engine),
) -> QuarantineResponse:
    """
    Quarantine a compromised service by disconnecting it from the Docker network.

    Validates the request against allowlists, performs containment,
    and returns the actual outcome with measured execution time.
    """
    container_to_isolate = request.container_id or request.culprit_service
    client_ip = http_req.client.host if http_req.client else None

    logger.info(
        "QUARANTINE REQUEST: culprit='%s' container='%s' target='%s' reason='%s'",
        request.culprit_service,
        container_to_isolate,
        request.target_service,
        request.reason,
    )

    # --- Strict Dual-Subject Authorization & Allowlist enforcement ---

    # 1. Check BOTH culprit_service and container_to_isolate against protected infrastructure
    if request.culprit_service in cfg.protected_services:
        log_audit_event(
            action="QUARANTINE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            target_service=request.target_service,
            detail=f"Service '{request.culprit_service}' is protected",
        )
        raise HTTPException(
            status_code=403,
            detail=f"Service '{request.culprit_service}' is a protected infrastructure service and cannot be quarantined.",
        )

    if container_to_isolate in cfg.protected_services:
        log_audit_event(
            action="QUARANTINE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            target_service=request.target_service,
            detail=f"Container '{container_to_isolate}' targets protected infrastructure",
        )
        raise HTTPException(
            status_code=403,
            detail=f"Container '{container_to_isolate}' is a protected infrastructure service and cannot be quarantined.",
        )

    # 2. Check BOTH culprit_service and container_to_isolate against allowed culprits
    if request.culprit_service not in cfg.allowed_culprits:
        log_audit_event(
            action="QUARANTINE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            target_service=request.target_service,
            detail=f"Culprit '{request.culprit_service}' not allowed",
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Service '{request.culprit_service}' is not in the allowed "
                f"culprits list. Allowed: {sorted(cfg.allowed_culprits)}"
            ),
        )

    if container_to_isolate not in cfg.allowed_culprits:
        log_audit_event(
            action="QUARANTINE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            target_service=request.target_service,
            detail=f"Container '{container_to_isolate}' not in allowed culprits",
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Container '{container_to_isolate}' is not in the allowed "
                f"culprits list. Allowed: {sorted(cfg.allowed_culprits)}"
            ),
        )

    # 3. Check target_service against allowed targets
    if request.target_service not in cfg.allowed_targets:
        log_audit_event(
            action="QUARANTINE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            target_service=request.target_service,
            detail=f"Target '{request.target_service}' not allowed",
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Service '{request.target_service}' is not in the allowed "
                f"targets list. Allowed: {sorted(cfg.allowed_targets)}"
            ),
        )

    # --- Execute containment ---

    try:
        result = eng.quarantine(
            container_id=container_to_isolate,
            network_name=cfg.docker_network,
            culprit_service=request.culprit_service,
        )
    except DockerUnavailableError as exc:
        log_audit_event(
            action="QUARANTINE_FAILED",
            status="ERROR",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            detail=str(exc),
        )
        raise HTTPException(status_code=503, detail=str(exc))
    except ContainerNotFoundError as exc:
        log_audit_event(
            action="QUARANTINE_FAILED",
            status="NOT_FOUND",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            detail=str(exc),
        )
        raise HTTPException(status_code=404, detail=str(exc))
    except NetworkNotFoundError as exc:
        log_audit_event(
            action="QUARANTINE_FAILED",
            status="NOT_FOUND",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            detail=str(exc),
        )
        raise HTTPException(status_code=404, detail=str(exc))
    except ContainmentPermissionError as exc:
        log_audit_event(
            action="QUARANTINE_FAILED",
            status="FORBIDDEN",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            detail=str(exc),
        )
        raise HTTPException(status_code=403, detail=str(exc))
    except ContainmentError as exc:
        log_audit_event(
            action="QUARANTINE_FAILED",
            status="ERROR",
            caller=_api_key,
            client_ip=client_ip,
            culprit_service=request.culprit_service,
            container_id=container_to_isolate,
            detail=str(exc),
        )
        raise HTTPException(status_code=500, detail=str(exc))

    # --- Determine response status ---

    if result.already_contained:
        status = ContainmentStatus.ALREADY_CONTAINED
    elif cfg.dry_run:
        status = ContainmentStatus.DRY_RUN
    elif result.success:
        status = ContainmentStatus.CONTAINED
    else:
        status = ContainmentStatus.FAILED

    log_audit_event(
        action="QUARANTINE_SUCCESS",
        status=status.value,
        caller=_api_key,
        client_ip=client_ip,
        culprit_service=request.culprit_service,
        container_id=container_to_isolate,
        target_service=request.target_service,
        execution_time_ms=result.execution_time_ms,
        detail=result.detail,
    )

    return QuarantineResponse(
        status=status,
        action_taken=ContainmentAction.NETWORK_ISOLATION if result.action == "NETWORK_ISOLATION" else ContainmentAction.NONE,
        execution_time_ms=result.execution_time_ms,
        culprit_service=request.culprit_service,
        container_id=container_to_isolate,
        target_service=request.target_service,
        reason=request.reason,
        detail=result.detail,
        docker_network=cfg.docker_network,
    )


@app.post(
    "/api/v1/release",
    response_model=QuarantineResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["containment"],
)
async def release_service(
    request: ReleaseRequest,
    http_req: Request,
    _api_key: str = Depends(verify_api_key),
    _rate_limit: None = Depends(enforce_rate_limit),
    cfg: ActuatorConfig = Depends(get_config),
    eng: ContainmentEngine = Depends(get_engine),
) -> QuarantineResponse:
    """
    Release / reconnect a quarantined container back to the authorized network.

    This recovery operation requires authentication and strict scope validation.
    """
    client_ip = http_req.client.host if http_req.client else None
    target_network = request.network_name or cfg.docker_network

    logger.info(
        "RELEASE REQUEST: container='%s' network='%s'",
        request.container_id,
        target_network,
    )

    # 1. Deny-list: check container_id against protected_services
    if request.container_id in cfg.protected_services:
        log_audit_event(
            action="RELEASE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail="Protected service cannot be released or modified",
        )
        raise HTTPException(
            status_code=403,
            detail=f"Service '{request.container_id}' is a protected infrastructure service and cannot be modified via release.",
        )

    # 2. Allow-list: check container_id against allowed_culprits
    if request.container_id not in cfg.allowed_culprits:
        log_audit_event(
            action="RELEASE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=f"Container '{request.container_id}' is not in allowed culprits list",
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Container '{request.container_id}' is not in the allowed "
                f"culprits list. Allowed: {sorted(cfg.allowed_culprits)}"
            ),
        )

    # 3. Allow-list: check network_name against allowed_networks
    if target_network not in cfg.allowed_networks or target_network != cfg.docker_network:
        log_audit_event(
            action="RELEASE_REJECTED",
            status="DENIED",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=f"Network '{target_network}' is not authorized for release",
        )
        raise HTTPException(
            status_code=403,
            detail=f"Target network '{target_network}' is not permitted. Only '{cfg.docker_network}' is authorized.",
        )

    try:
        result = eng.release(
            container_id=request.container_id,
            network_name=target_network,
        )
    except ContainerNotFoundError as exc:
        log_audit_event(
            action="RELEASE_FAILED",
            status="NOT_FOUND",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=str(exc),
        )
        raise HTTPException(status_code=404, detail=str(exc))
    except NetworkNotFoundError as exc:
        log_audit_event(
            action="RELEASE_FAILED",
            status="NOT_FOUND",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=str(exc),
        )
        raise HTTPException(status_code=404, detail=str(exc))
    except DockerUnavailableError as exc:
        log_audit_event(
            action="RELEASE_FAILED",
            status="UNAVAILABLE",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=str(exc),
        )
        raise HTTPException(status_code=503, detail=str(exc))
    except ContainmentPermissionError as exc:
        log_audit_event(
            action="RELEASE_FAILED",
            status="FORBIDDEN",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=str(exc),
        )
        raise HTTPException(status_code=403, detail=str(exc))
    except ContainmentError as exc:
        log_audit_event(
            action="RELEASE_FAILED",
            status="ERROR",
            caller=_api_key,
            client_ip=client_ip,
            container_id=request.container_id,
            detail=str(exc),
        )
        raise HTTPException(status_code=500, detail=str(exc))

    log_audit_event(
        action="RELEASE_SUCCESS",
        status="RELEASED" if result.success else "FAILED",
        caller=_api_key,
        client_ip=client_ip,
        container_id=request.container_id,
        execution_time_ms=result.execution_time_ms,
        detail=result.detail,
    )

    return QuarantineResponse(
        status=ContainmentStatus.RELEASED if result.success else ContainmentStatus.FAILED,
        action_taken=ContainmentAction.NETWORK_RESTORE if result.success else ContainmentAction.NONE,
        execution_time_ms=result.execution_time_ms,
        culprit_service=request.container_id,
        container_id=request.container_id,
        detail=result.detail,
        docker_network=target_network,
    )


@app.get(
    "/api/v1/quarantine/status",
    tags=["containment"],
)
async def quarantine_status(
    _api_key: str = Depends(verify_api_key),
    eng: ContainmentEngine = Depends(get_engine),
) -> dict:
    """List currently quarantined services."""
    return {
        "quarantined_services": eng.get_quarantined_services(),
        "count": len(eng.get_quarantined_services()),
    }
