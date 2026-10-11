"""
Pydantic models for the quarantine API request and response contracts.

These models enforce validation at the API boundary, preventing malformed
or malicious payloads from reaching the containment engine.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# --- Constants ---

# Strict allowlist for container_id / culprit_service naming.
# Prevents shell injection via crafted service names.
_SAFE_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$")


class ContainmentStatus(str, Enum):
    """Outcome status of a quarantine operation."""
    CONTAINED = "CONTAINED"
    FAILED = "FAILED"
    DRY_RUN = "DRY_RUN"
    ALREADY_CONTAINED = "ALREADY_CONTAINED"
    RELEASED = "RELEASED"


class ContainmentAction(str, Enum):
    """Type of containment action performed."""
    NETWORK_ISOLATION = "NETWORK_ISOLATION"
    NETWORK_RESTORE = "NETWORK_RESTORE"
    NONE = "NONE"


class QuarantineRequest(BaseModel):
    """
    Inbound quarantine request contract.

    Matches the documented API contract:
    {
        "culprit_service": "reviews-service",
        "container_id": "reviews-service",
        "target_service": "payment-vault",
        "reason": "Unauthorized lateral movement"
    }
    """
    culprit_service: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Name of the service exhibiting malicious behavior.",
    )
    container_id: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="Docker container name or ID to isolate. Defaults to culprit_service if omitted.",
    )
    target_service: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Name of the service being protected.",
    )
    reason: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Human-readable reason for containment.",
    )

    @model_validator(mode="before")
    @classmethod
    def populate_defaults(cls, data: Any) -> Any:
        """Handle field aliases and default container_id to culprit_service if omitted."""
        if isinstance(data, dict):
            if "culprit" in data and "culprit_service" not in data:
                data["culprit_service"] = data["culprit"]
            if "target" in data and "target_service" not in data:
                data["target_service"] = data["target"]
            if ("container_id" not in data or not data.get("container_id")) and "culprit_service" in data:
                data["container_id"] = data["culprit_service"]
        return data

    @field_validator("culprit_service", "target_service")
    @classmethod
    def validate_safe_name(cls, v: str) -> str:
        """Reject names that could be used for injection attacks."""
        if not _SAFE_NAME_PATTERN.match(v):
            raise ValueError(
                f"Invalid identifier '{v}': must match pattern "
                f"'{_SAFE_NAME_PATTERN.pattern}' (alphanumeric, dots, hyphens, underscores)."
            )
        return v

    @field_validator("container_id")
    @classmethod
    def validate_safe_container_id(cls, v: Optional[str]) -> Optional[str]:
        """Validate container ID if present."""
        if v is not None and not _SAFE_NAME_PATTERN.match(v):
            raise ValueError(
                f"Invalid container identifier '{v}': must match pattern "
                f"'{_SAFE_NAME_PATTERN.pattern}'."
            )
        return v


class ReleaseRequest(BaseModel):
    """Request to release / reconnect a quarantined container."""
    container_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Docker container name or ID to reconnect.",
    )
    network_name: Optional[str] = Field(
        default=None,
        description="Target Docker network. Defaults to configured network.",
    )

    @field_validator("container_id")
    @classmethod
    def validate_safe_name(cls, v: str) -> str:
        if not _SAFE_NAME_PATTERN.match(v):
            raise ValueError(
                f"Invalid identifier '{v}': must match pattern "
                f"'{_SAFE_NAME_PATTERN.pattern}'."
            )
        return v

    @field_validator("network_name")
    @classmethod
    def validate_safe_network(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not _SAFE_NAME_PATTERN.match(v):
            raise ValueError(
                f"Invalid network identifier '{v}': must match pattern "
                f"'{_SAFE_NAME_PATTERN.pattern}'."
            )
        return v


class AuditAction(str, Enum):
    """Actions recorded in security audit logs."""
    QUARANTINE_SUCCESS = "QUARANTINE_SUCCESS"
    QUARANTINE_REJECTED = "QUARANTINE_REJECTED"
    QUARANTINE_FAILED = "QUARANTINE_FAILED"
    RELEASE_SUCCESS = "RELEASE_SUCCESS"
    RELEASE_REJECTED = "RELEASE_REJECTED"
    RELEASE_FAILED = "RELEASE_FAILED"
    AUTH_FAILURE = "AUTH_FAILURE"
    RATE_LIMITED = "RATE_LIMITED"


class QuarantineResponse(BaseModel):
    """
    Response contract for a quarantine operation.

    Successful example:
    {
        "status": "CONTAINED",
        "action_taken": "NETWORK_ISOLATION",
        "execution_time_ms": 42
    }
    """
    status: ContainmentStatus
    action_taken: ContainmentAction
    execution_time_ms: float = Field(
        ...,
        ge=0,
        description="Actual measured execution time in milliseconds.",
    )
    culprit_service: str = ""
    container_id: str = ""
    target_service: str = ""
    reason: str = ""
    detail: str = ""
    docker_network: str = ""


class ErrorResponse(BaseModel):
    """Structured error response."""
    error: str
    detail: Optional[str] = None
    status_code: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str = "actuator-security"
    version: str = "0.1.0"
    dry_run: bool = True
    docker_available: bool = False
