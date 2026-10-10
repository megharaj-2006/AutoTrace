"""HTTP request/response models.

The /score-edge request and the is_anomalous / confidence / reason response fields follow
docs/contracts/member2-backend-contract.md section 4.1. Fields beyond those three
(anomaly_type, severity, quarantine_target, components, inference_ms) are additive; the
graph-engine record ignores unknown properties.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from models.features import EdgeFeatures


class Features(BaseModel):
    model_config = ConfigDict(extra="ignore")

    call_count: int = Field(default=1, ge=0)
    p99_latency_ms: float = Field(ge=0)
    error_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    payload_entropy: float = Field(default=0.0, ge=0.0, le=8.0)

    def to_model(self) -> EdgeFeatures:
        return EdgeFeatures(self.call_count, self.p99_latency_ms, self.error_rate, self.payload_entropy)


class ScoreEdgeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source: str = Field(min_length=1)
    target: str = Field(min_length=1)
    features: Features


class ScoreEdgeResponse(BaseModel):
    source: str
    target: str
    is_anomalous: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    anomaly_type: Literal["ROGUE_EDGE", "ENTROPY_ANOMALY", "DEGRADED", "NONE"]
    severity: Literal["CRITICAL", "MEDIUM", "LOW"]
    quarantine_target: Optional[str] = None
    components: dict
    inference_ms: float


class RcaEdge(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source: str = Field(min_length=1)
    target: str = Field(min_length=1)
    features: Features


class RcaRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    window_id: Optional[str] = None
    edges: list[RcaEdge] = Field(min_length=1)


class RankedNode(BaseModel):
    node: str
    score: float
    role: Literal["root_cause", "victim"]


class RcaResponse(BaseModel):
    window_id: Optional[str] = None
    root_causes: list[RankedNode]
    victims: list[RankedNode]
    healthy: list[str]
    anomalous_edges: list[dict]
    causal_paths: list[list[str]]
    inference_ms: float
