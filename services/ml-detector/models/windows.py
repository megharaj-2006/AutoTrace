"""Turn raw telemetry events into per-edge window features.

Input events follow docs/event-contract.md (the 9-field telemetry.events message):
source_service, target_service, status_code, latency_ms, payload_entropy, timestamp (epoch ms).
The aggregation mirrors what graph-engine sends in `features`, so the baseline is built from
the same quantities the live service will be asked to score.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from typing import Iterable

import numpy as np

from .features import EdgeFeatures, EdgeWindow

log = logging.getLogger("ml-detector")

REQUIRED = ("source_service", "target_service", "status_code", "latency_ms", "timestamp")


def aggregate_events(events: Iterable[dict], window_seconds: int = 5) -> list[EdgeWindow]:
    buckets: dict[tuple[str, str, int], list[dict]] = defaultdict(list)
    skipped = 0
    width_ms = window_seconds * 1000
    for e in events:
        try:
            if any(k not in e for k in REQUIRED):
                raise KeyError("missing field")
            key = (str(e["source_service"]), str(e["target_service"]), int(e["timestamp"]) // width_ms)
            float(e["latency_ms"]), int(e["status_code"])
        except (KeyError, TypeError, ValueError):
            skipped += 1
            continue
        buckets[key].append(e)

    if skipped:
        log.warning("skipped %d malformed telemetry events while aggregating", skipped)

    out = []
    for (src, dst, _), group in sorted(buckets.items()):
        lat = np.array([float(g["latency_ms"]) for g in group])
        errors = [not (200 <= int(g["status_code"]) < 300) for g in group]
        ent = [float(g.get("payload_entropy", 0.0)) for g in group]
        out.append(EdgeWindow(src, dst, EdgeFeatures(
            call_count=len(group),
            p99_latency_ms=float(np.percentile(lat, 99)),
            error_rate=float(np.mean(errors)),
            payload_entropy=float(np.mean(ent)),
        )))
    return out
