#!/usr/bin/env python3
"""Evaluation benchmark: false positives, rogue-edge recall, RCA accuracy, latency.

Targets (project doc): recall > 95% on injected rogue edges, low false-positive rate on normal
traffic, inference < 20 ms. Exit code 1 if a target is missed. Uses SYNTHETIC windows shaped
like the real testbed; re-run on real traces (scripts/generate_baseline.py --input) before
quoting these numbers.
"""
from __future__ import annotations

import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.baseline import build_baseline  # noqa: E402
from models.features import EdgeFeatures, EdgeWindow  # noqa: E402
from models.rca import analyse  # noqa: E402
from models.scorer import score_edge  # noqa: E402
from models.synth import VAULT, ORDER, GATEWAY, benign_windows, chaos_windows, rogue_windows  # noqa: E402
from src import config as C  # noqa: E402


def score(base, w: EdgeWindow):
    return score_edge(base, w.source, w.target, w.features)


def main() -> int:
    base = build_baseline(benign_windows(300, seed=0))

    benign = benign_windows(5000, seed=123)
    res = [score(base, w) for w in benign]
    fp = sum(r.is_anomalous for r in res)
    degraded = sum(r.severity == "MEDIUM" for r in res)

    rogue = rogue_windows(2000, seed=7)
    rres = [score(base, w) for w in rogue]
    recall = sum(r.is_anomalous for r in rres) / len(rres)
    demo = score(base, rogue[0])

    exfil = [EdgeWindow(ORDER, VAULT, EdgeFeatures(5, 16.0, 0.0, 7.9)) for _ in range(500)]
    exfil_recall = sum(score(base, w).is_anomalous for w in exfil) / len(exfil)

    chaos_fp = chaos_total = 0
    for node in (VAULT, ORDER, GATEWAY):
        for seed in range(100):
            for w in chaos_windows(node, seed=seed):
                chaos_total += 1
                chaos_fp += score(base, w).is_anomalous

    rca_hits = rca_total = 0
    for node in (VAULT, ORDER, GATEWAY):
        for seed in range(200):
            out = analyse(base, chaos_windows(node, seed=seed))
            rca_total += 1
            rca_hits += bool(out["root_causes"]) and out["root_causes"][0]["node"] == node

    lat = []
    for w in benign[:3000]:
        t = time.perf_counter(); score(base, w); lat.append((time.perf_counter() - t) * 1000)
    rlat = []
    for seed in range(500):
        ws = chaos_windows(VAULT, seed=seed)
        t = time.perf_counter(); analyse(base, ws); rlat.append((time.perf_counter() - t) * 1000)
    p99 = lambda xs: sorted(xs)[int(len(xs) * 0.99) - 1]

    rows = [
        ("Benign windows wrongly flagged", f"{fp/len(res):.4%}", f"{fp}/{len(res)} (+{degraded} 'degraded')", fp / len(res) <= 0.001),
        ("Rogue-edge recall", f"{recall:.2%}", f"{int(recall*len(rogue))}/{len(rogue)}  target >95%", recall > 0.95),
        ("Exfiltration on known edge", f"{exfil_recall:.2%}", "entropy 7.9 on order->vault", exfil_recall > 0.95),
        ("Chaos windows wrongly flagged", f"{chaos_fp}/{chaos_total}", "slow/failing must stay 'degraded'", chaos_fp == 0),
        ("RCA top-1 accuracy", f"{rca_hits/rca_total:.2%}", f"{rca_hits}/{rca_total}", rca_hits / rca_total >= 0.95),
        ("score-edge p99 latency", f"{p99(lat):.3f} ms", f"mean {statistics.mean(lat):.3f} ms  target <20 ms", p99(lat) < 20),
        ("rca p99 latency", f"{p99(rlat):.3f} ms", f"mean {statistics.mean(rlat):.3f} ms  target <20 ms", p99(rlat) < 20),
    ]
    print(f"Demo attack reviews-service -> payment-vault: confidence={demo.confidence} anomalous={demo.is_anomalous}")
    print(f"Anomaly threshold: {C.ANOMALY_THRESHOLD}\n")
    print(f"{'Metric':34} {'Result':>11}  Detail")
    for name, val, detail, ok in rows:
        print(f"{name:34} {val:>11}  {detail}  [{'PASS' if ok else 'FAIL'}]")
    return 0 if all(r[3] for r in rows) else 1


if __name__ == "__main__":
    sys.exit(main())
