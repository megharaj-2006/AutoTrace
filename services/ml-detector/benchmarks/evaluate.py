#!/usr/bin/env python3
"""Evaluation benchmark: false-positive rate, rogue-edge recall, RCA accuracy, latency.

Targets from the architecture doc: recall > 95% on injected rogue edges, low FPR on normal
traffic, inference < 20 ms. Exit code 1 if any target is missed (usable in CI).
"""
from __future__ import annotations

import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config as C  # noqa: E402
from app.baseline import build_baseline  # noqa: E402
from app.rca import analyse  # noqa: E402
from app.schemas import RcaRequest  # noqa: E402
from app.scorer import score_edge  # noqa: E402
from app.synth import NODES, benign_stream, chaos_window, rogue_stream  # noqa: E402

N_TRAIN, N_TEST_BENIGN, N_ROGUE = 5000, 20000, 2000


def main() -> int:
    base = build_baseline(benign_stream(N_TRAIN, seed=0))

    # ---- false positives on held-out benign traffic (different seed)
    benign = benign_stream(N_TEST_BENIGN, seed=123)
    res = [score_edge(base, o) for o in benign]
    fp = sum(r.verdict == "quarantine" for r in res)
    degraded = sum(r.verdict == "degraded" for r in res)
    fpr = fp / len(res)

    # ---- rogue-edge recall
    rogue = rogue_stream(N_ROGUE, seed=7)
    rres = [score_edge(base, o) for o in rogue]
    recall = sum(r.verdict == "quarantine" for r in rres) / len(rres)
    demo = score_edge(base, rogue[0])  # reviews -> payment-vault

    # ---- rogue detection when attacker REUSES an authorised edge but exfiltrates (entropy spike)
    from app.schemas import EdgeObservation
    exfil = [EdgeObservation(source="order-service", target="payment-vault",
                             latency_ms=45, status=200, entropy=7.9) for _ in range(500)]
    exfil_recall = sum(score_edge(base, o).verdict == "quarantine" for o in exfil) / len(exfil)

    # ---- chaos must NOT quarantine
    chaos_fp = 0
    chaos_total = 0
    for node in NODES:
        for seed in range(50):
            for o in chaos_window(node, seed=seed):
                chaos_total += 1
                chaos_fp += score_edge(base, o).verdict == "quarantine"

    # ---- RCA accuracy: does the single root cause equal the injected failing node?
    rca_cases = [("payment-vault", 200), ("reviews-service", 200), ("order-service", 200)]
    rca_hits = rca_total = 0
    for failing, n in rca_cases:
        for seed in range(n):
            out = analyse(base, RcaRequest(edges=chaos_window(failing, seed=seed)))
            rca_total += 1
            rca_hits += bool(out.root_causes) and out.root_causes[0].node == failing
    rca_acc = rca_hits / rca_total

    # ---- latency
    lat = []
    for o in benign[:5000]:
        t = time.perf_counter(); score_edge(base, o); lat.append((time.perf_counter() - t) * 1000)
    rlat = []
    for seed in range(500):
        t = time.perf_counter(); analyse(base, RcaRequest(edges=chaos_window("payment-vault", seed=seed)))
        rlat.append((time.perf_counter() - t) * 1000)
    p99 = lambda xs: sorted(xs)[int(len(xs) * 0.99) - 1]

    rows = [
        ("Benign false-quarantine rate", f"{fpr:.4%}", f"{fp}/{len(res)} (+{degraded} 'degraded')", fpr <= 0.001),
        ("Rogue-edge recall", f"{recall:.2%}", f"{int(recall*N_ROGUE)}/{N_ROGUE}  target >95%", recall > 0.95),
        ("Exfil on authorised edge recall", f"{exfil_recall:.2%}", "entropy spike, known edge", exfil_recall > 0.95),
        ("Chaos events wrongly quarantined", f"{chaos_fp}/{chaos_total}", "latency/5xx must stay 'degraded'", chaos_fp == 0),
        ("RCA top-1 root-cause accuracy", f"{rca_acc:.2%}", f"{rca_hits}/{rca_total}", rca_acc >= 0.95),
        ("score-edge p99 latency", f"{p99(lat):.3f} ms", f"mean {statistics.mean(lat):.3f} ms  target <20 ms", p99(lat) < 20),
        ("rca p99 latency", f"{p99(rlat):.3f} ms", f"mean {statistics.mean(rlat):.3f} ms  target <20 ms", p99(rlat) < 20),
    ]
    print(f"Demo attack reviews-service -> payment-vault: threat={demo.threat_score} verdict={demo.verdict}")
    print(f"Quarantine threshold: {C.QUARANTINE_THRESHOLD}\n")
    print(f"{'Metric':36} {'Result':>12}  Detail")
    for name, val, detail, ok in rows:
        print(f"{name:36} {val:>12}  {detail}  [{'PASS' if ok else 'FAIL'}]")
    return 0 if all(r[3] for r in rows) else 1


if __name__ == "__main__":
    sys.exit(main())
