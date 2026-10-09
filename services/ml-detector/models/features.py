"""Framework-free data types shared by the model code."""
from dataclasses import dataclass


@dataclass(frozen=True)
class EdgeFeatures:
    """Aggregated behaviour of one edge over a window (matches graph-engine's `features`)."""

    call_count: int = 1
    p99_latency_ms: float = 0.0
    error_rate: float = 0.0       # share of non-2xx responses, 0..1
    payload_entropy: float = 0.0  # mean Shannon entropy, bits/byte, 0..8


@dataclass(frozen=True)
class EdgeWindow:
    source: str
    target: str
    features: EdgeFeatures
