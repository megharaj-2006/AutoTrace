"""Rogue-edge detection: score an observed edge (u, v) against A_base.

Decision logic (deliberately simple, explainable, and < 1 ms):

1. STRUCTURAL: edge absent from A_base (count == 0)  ->  rogue edge.
   threat = 0.92 + 0.06 * criticality(target) + 0.02 * entropy_boost, so an unauthorised
   call is always above the 0.90 quarantine line, and a call INTO payment-vault scores highest.
2. KNOWN edge: robust z-scores (median/MAD from baseline) for latency and payload entropy.
   - latency / error anomalies are capped (LATENCY_SCORE_CAP) so a slow dependency under
     chaos injection is classed "degraded" (a root-cause problem), never "quarantine".
   - an entropy spike on a known edge (encrypted / exfiltrated payload) can still reach
     ENTROPY_SCORE_CAP and trigger containment.
   - components are fused with noisy-OR.
"""
from __future__ import annotations

import time

from . import config as C
from .baseline import Baseline
from .schemas import EdgeObservation, ScoreComponents, ScoreEdgeResponse

DEGRADED_THRESHOLD = 0.35


def _sat(z: float, half: float) -> float:
    """Map z >= 0 to [0, 1) with value 0.5 at z == half.

    Weibull-style curve 1 - 0.5**((z/half)**2): ignores ordinary noise (z of 2-3 stays
    small) but saturates quickly for gross outliers (z of 2x half is already ~0.94).
    """
    if z <= 0:
        return 0.0
    return 1.0 - 0.5 ** ((z / half) ** 2)


def criticality(node: str) -> float:
    return C.NODE_CRITICALITY.get(node, C.NODE_CRITICALITY_DEFAULT)


def latency_z(base: Baseline, src: str, dst: str, latency_ms: float) -> float:
    st = base.edge_stats(src, dst)
    if st is None:
        return 0.0
    sigma = max(st.lat_mad, 0.15 * st.lat_med, 1e-3)
    return (latency_ms - st.lat_med) / sigma


def entropy_z(base: Baseline, src: str, dst: str, entropy: float) -> float:
    st = base.edge_stats(src, dst)
    if st is None:
        return 0.0
    sigma = max(st.ent_mad, 0.05 * max(st.ent_med, 1.0), 1e-3)
    return abs(entropy - st.ent_med) / sigma


def edge_anomaly(base: Baseline, obs: EdgeObservation) -> float:
    """Generic 0..1 'is this edge unhealthy' score used by RCA (ignores topology novelty)."""
    lat = _sat(latency_z(base, obs.source, obs.target, obs.latency_ms), C.Z_LATENCY_HALF)
    st = base.edge_stats(obs.source, obs.target)
    err = 0.0
    if not obs.ok and (st is None or st.err_rate < 0.05):
        err = 0.8
    return 1 - (1 - lat) * (1 - err)


def score_edge(base: Baseline, obs: EdgeObservation) -> ScoreEdgeResponse:
    t0 = time.perf_counter()
    src, dst = obs.source, obs.target
    crit = criticality(dst)
    count = base.count(src, dst)

    lat_s = ent_s = status_s = 0.0
    entropy_boost = min(max((obs.entropy - 5.0) / 3.0, 0.0), 1.0)

    if count == 0:
        structural = 1.0
        threat = min(1.0, 0.92 + 0.06 * crit + 0.02 * entropy_boost)
        reason = f"unauthorised edge {src} -> {dst}: not present in baseline A_base"
    else:
        st = base.edge_stats(src, dst)
        structural = 0.0
        if count < C.MIN_EDGE_SUPPORT:
            structural = 0.5 + 0.4 * (1 - count / C.MIN_EDGE_SUPPORT)

        lat_s = min(C.LATENCY_SCORE_CAP,
                    _sat(latency_z(base, src, dst, obs.latency_ms), C.Z_LATENCY_HALF))
        ent_s = min(C.ENTROPY_SCORE_CAP,
                    _sat(entropy_z(base, src, dst, obs.entropy), C.Z_ENTROPY_HALF))
        if not obs.ok and st.err_rate < 0.05:
            status_s = 0.5

        threat = 1 - (1 - structural) * (1 - lat_s) * (1 - ent_s) * (1 - status_s)
        parts = []
        if structural: parts.append(f"weakly-known edge (n={count})")
        if lat_s > 0.2: parts.append(f"latency anomaly ({lat_s:.2f})")
        if ent_s > 0.2: parts.append(f"payload entropy anomaly ({ent_s:.2f})")
        if status_s: parts.append("unexpected error status")
        reason = "; ".join(parts) if parts else "within baseline envelope"

    threat = float(min(max(threat, 0.0), 1.0))
    if threat >= C.QUARANTINE_THRESHOLD:
        verdict = "quarantine"
    elif threat >= DEGRADED_THRESHOLD:
        verdict = "degraded"
    else:
        verdict = "allow"

    return ScoreEdgeResponse(
        source=src,
        target=dst,
        threat_score=round(threat, 4),
        is_rogue_edge=(count == 0),
        verdict=verdict,
        quarantine_target=src if verdict == "quarantine" else None,
        reason=reason,
        components=ScoreComponents(
            structural=round(structural, 4),
            latency=round(lat_s, 4),
            entropy=round(ent_s, 4),
            status=round(status_s, 4),
            target_criticality=crit,
        ),
        inference_ms=round((time.perf_counter() - t0) * 1000, 4),
    )
