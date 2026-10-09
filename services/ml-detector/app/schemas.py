"""Request/response models for the ML detector API.

The telemetry event shape (shared/schemas/telemetry-event.json) is owned by Member 1 and
was NOT included in the architecture doc. The doc only says events carry
(source, target, latency, status, entropy). Field aliases below accept the likely spellings
so Member 2 can forward events without renaming anything. CONFIRM with Member 1.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


def _status_ok(status) -> bool:
    """HTTP code or string -> True when the call succeeded."""
    if isinstance(status, int):
        return status < 400
    s = str(status).strip().lower()
    if s.isdigit():
        return int(s) < 400
    return s in {"ok", "success", "200", "up", "healthy"}


class EdgeObservation(BaseModel):
    """One observed call (or a 5s-window aggregate) between two services."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    source: str
    target: str
    latency_ms: float = Field(validation_alias=AliasChoices("latency_ms", "latency", "latencyMs"))
    status: int | str = 200
    entropy: float = 0.0  # Shannon entropy of payload, bits/byte (0..8)
    timestamp: Optional[float | str] = None
    window_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("window_id", "windowId"))

    @field_validator("latency_ms")
    @classmethod
    def _nonneg(cls, v: float) -> float:
        if v < 0:
            raise ValueError("latency must be >= 0")
        return v

    @property
    def ok(self) -> bool:
        return _status_ok(self.status)


# ---------------------------------------------------------------- /api/v1/score-edge
class ScoreEdgeRequest(EdgeObservation):
    pass


class ScoreComponents(BaseModel):
    structural: float = Field(description="1.0 if edge absent from A_base, else 0..1 rarity")
    latency: float
    entropy: float
    status: float
    target_criticality: float


class ScoreEdgeResponse(BaseModel):
    source: str
    target: str
    threat_score: float = Field(ge=0.0, le=1.0)
    is_rogue_edge: bool
    verdict: Literal["allow", "degraded", "quarantine"]
    # Node Member 4 should isolate when verdict == "quarantine" (the caller of the rogue edge).
    quarantine_target: Optional[str] = None
    reason: str
    components: ScoreComponents
    inference_ms: float


# ---------------------------------------------------------------- /api/v1/rca
class RcaRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    window_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("window_id", "windowId"))
    edges: list[EdgeObservation] = Field(min_length=1)


class RankedNode(BaseModel):
    node: str
    score: float
    role: Literal["root_cause", "victim", "healthy"]


class RcaResponse(BaseModel):
    window_id: Optional[str] = None
    root_causes: list[RankedNode]
    victims: list[RankedNode]
    healthy: list[str]
    anomalous_edges: list[dict]
    causal_paths: list[list[str]]
    inference_ms: float
