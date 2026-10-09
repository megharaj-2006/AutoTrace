#!/usr/bin/env python3
"""Baseline generator: benign telemetry traces -> A_base (data/baseline.json).

Usage
  # from Member 1's captured traces (one JSON event per line, e.g. dumped from telemetry.events)
  python scripts/generate_baseline.py --input traces.jsonl

  # no traces yet: synthetic benign traffic for the 4-node testbed
  python scripts/generate_baseline.py --synthetic 5000
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config as C  # noqa: E402
from app.baseline import build_baseline  # noqa: E402
from app.schemas import EdgeObservation  # noqa: E402
from app.synth import benign_stream  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, help="JSONL file of benign telemetry events")
    ap.add_argument("--synthetic", type=int, help="generate N synthetic benign events instead")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--output", type=Path, default=C.BASELINE_PATH)
    args = ap.parse_args()

    if args.input:
        obs = [EdgeObservation.model_validate(json.loads(line))
               for line in args.input.read_text().splitlines() if line.strip()]
    elif args.synthetic:
        obs = benign_stream(args.synthetic, args.seed)
    else:
        ap.error("give --input or --synthetic N")

    base = build_baseline(obs)
    base.save(args.output)

    print(f"baseline written to {args.output}  ({base.total_observations} observations)")
    print("nodes:", base.nodes)
    adj = base.adjacency()
    for i, s in enumerate(base.nodes):
        for j, d in enumerate(base.nodes):
            if adj[i, j]:
                st = base.edge_stats(s, d)
                print(f"  {s} -> {d}: n={st.count} lat~{st.lat_med:.1f}ms ent~{st.ent_med:.2f}")


if __name__ == "__main__":
    main()
