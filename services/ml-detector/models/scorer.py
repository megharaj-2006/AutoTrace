"""Rogue-edge detection: score an edge (u, v) observed in a window against A_base.

1. STRUCTURAL: edge absent from A_base -> rogue edge. Confidence 0.92-1.0, highest when
   the target is sensitive (payment-vault). This is what catches reviews-service ->
   payment-vault, whose payload is an empty GET (entropy 0.0) and so shows no other signal.
2. KNOWN edge: robust z-scores (median/MAD) of p99 latency and payload entropy, plus error rate.
   - latency / error anomalies are capped below the anomaly threshold: a slow or failing
     dependency is "degraded" (a root-cause problem), never a quarantine.
   - a high-entropy payload (compressed/encrypted, >5.5 bits/byte) on a known edge can reach
     ENTROPY_SCORE_CAP: possible data exfiltration.
   Components are fused with noisy-OR.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

from src import config as C

from .baseline import Baseline
from .features import EdgeFeatures


@dataclass
class EdgeVerdict:
    source: str
    target: str
    confidence: float
    is_anomalous: bool
    anomaly_type: str   # ROGUE_EDGE | ENTROPY_ANOMALY | DEGRADED | NONE
    severity: str       # CRITICAL | MEDIUM | LOW
    reason: str
    quarantine_target: str | None
    components: dict
    inference_ms: float


def _sat(z: float, half: float) -> float:
    """z >= 0 -> [0, 1), 0.5 at z == half. Ignores ordinary noise, saturates on gross outliers."""
    return 0.0 if z <= 0 else 1.0 - 0.5 ** ((z / half) ** 2)


def criticality(node: str) -> float:
    return C.NODE_CRITICALITY.get(node, C.NODE_CRITICALITY_DEFAULT)


def _latency_z(st, p99: float) -> float:
    return (p99 - st.lat_med) / max(st.lat_mad, 0.15 * st.lat_med, 1e-3)


def _entropy_z(st, ent: float) -> float:
    return abs(ent - st.ent_med) / max(st.ent_mad, 0.05 * max(st.ent_med, 1.0), 1e-3)


def _entropy_gate(ent: float) -> float:
    span = C.ENTROPY_GATE_FULL - C.ENTROPY_GATE_LOW
    return min(max((ent - C.ENTROPY_GATE_LOW) / span, 0.0), 1.0)


def edge_health_anomaly(base: Baseline, src: str, dst: str, f: EdgeFeatures) -> float:
    """0..1 'is this edge unhealthy' (latency / errors only); used by RCA."""
    st = base.edge_stats(src, dst)
    if st is None:
        return 0.0
    lat = _sat(_latency_z(st, f.p99_latency_ms), C.Z_LATENCY_HALF)
    err = min(0.8, 2.0 * max(0.0, f.error_rate - st.err_rate))
    return 1 - (1 - lat) * (1 - err)


def score_edge(base: Baseline, src: str, dst: str, f: EdgeFeatures) -> EdgeVerdict:
    t0 = time.perf_counter()
    crit = criticality(dst)
    n_windows = base.count(src, dst)
    lat_s = ent_s = err_s = structural = 0.0
    anomaly_type = "NONE"

    if n_windows == 0:
        structural = 1.0
        boost = min(max((f.payload_entropy - 5.0) / 3.0, 0.0), 1.0)
        confidence = min(1.0, 0.92 + 0.06 * crit + 0.02 * boost)
        anomaly_type = "ROGUE_EDGE"
        reason = f"Rogue edge {src} -> {dst} detected outside baseline topology A_base"
    else:
        st = base.edge_stats(src, dst)
        if n_windows < C.MIN_EDGE_SUPPORT:
            structural = 0.5 + 0.4 * (1 - n_windows / C.MIN_EDGE_SUPPORT)
        lat_s = min(C.LATENCY_SCORE_CAP, _sat(_latency_z(st, f.p99_latency_ms), C.Z_LATENCY_HALF))
        ent_s = min(C.ENTROPY_SCORE_CAP,
                    _sat(_entropy_z(st, f.payload_entropy), C.Z_ENTROPY_HALF)) * _entropy_gate(f.payload_entropy)
        err_s = min(0.5, 2.0 * max(0.0, f.error_rate - st.err_rate))
        confidence = 1 - (1 - structural) * (1 - lat_s) * (1 - ent_s) * (1 - err_s)

        parts = []
        if structural: parts.append(f"weakly-known edge (seen in {n_windows} baseline windows)")
        if lat_s > 0.2: parts.append(f"p99 latency anomaly ({lat_s:.2f})")
        if ent_s > 0.2: parts.append(f"payload entropy anomaly ({ent_s:.2f})")
        if err_s > 0.1: parts.append(f"elevated error rate ({f.error_rate:.2f})")
        reason = "; ".join(parts) if parts else "Within baseline envelope"
        if ent_s >= 0.5 and confidence >= C.ANOMALY_THRESHOLD:
            anomaly_type = "ENTROPY_ANOMALY"
        elif confidence >= C.DEGRADED_THRESHOLD:
            anomaly_type = "DEGRADED"

    confidence = float(min(max(confidence, 0.0), 1.0))
    anomalous = confidence >= C.ANOMALY_THRESHOLD
    if anomalous:
        severity = "CRITICAL"
    elif confidence >= C.DEGRADED_THRESHOLD:
        severity = "MEDIUM"
        anomaly_type = "DEGRADED" if anomaly_type == "NONE" else anomaly_type
    else:
        severity = "LOW"

    return EdgeVerdict(
        source=src, target=dst,
        confidence=round(confidence, 4),
        is_anomalous=anomalous,
        anomaly_type=anomaly_type,
        severity=severity,
        reason=reason,
        quarantine_target=src if anomalous else None,
        components={"structural": round(structural, 4), "latency": round(lat_s, 4),
                    "entropy": round(ent_s, 4), "errors": round(err_s, 4),
                    "target_criticality": crit},
        inference_ms=round((time.perf_counter() - t0) * 1000, 4),
    )
