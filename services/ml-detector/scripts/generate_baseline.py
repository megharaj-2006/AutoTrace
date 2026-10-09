#!/usr/bin/env python3
"""Baseline generator: benign telemetry -> A_base (data/baseline.json).

  # real traces: telemetry.events messages, one JSON object per line. Capture with e.g.
  #   rpk topic consume telemetry.events -n 3000 -f '%v\n' > benign.jsonl
  # while ONLY legitimate traffic runs (testbed/cluster-simulation/traffic-generator.sh).
  python scripts/generate_baseline.py --input benign.jsonl

  # no traces yet: synthetic windows for the testbed topology
  python scripts/generate_baseline.py --synthetic 200
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.baseline import build_baseline  # noqa: E402
from models.synth import benign_windows  # noqa: E402
from models.windows import aggregate_events  # noqa: E402
from src import config as C  # noqa: E402


def _read_events(path: Path) -> list[dict]:
    events = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        if isinstance(obj.get("value"), str):  # rpk JSON envelope
            obj = json.loads(obj["value"])
        events.append(obj)
    return events


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, help="JSONL of benign telemetry.events messages")
    ap.add_argument("--synthetic", type=int, metavar="N", help="N synthetic windows per edge")
    ap.add_argument("--window-seconds", type=int, default=5, help="must match graph-engine's window")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--output", type=Path, default=C.BASELINE_PATH)
    args = ap.parse_args()

    if args.input:
        windows = aggregate_events(_read_events(args.input), args.window_seconds)
    elif args.synthetic:
        windows = benign_windows(args.synthetic, args.seed)
    else:
        ap.error("give --input or --synthetic N")

    base = build_baseline(windows)
    base.save(args.output)

    print(f"baseline written to {args.output} ({base.total_windows} windows)")
    adj = base.adjacency()
    for i, s in enumerate(base.nodes):
        for j, d in enumerate(base.nodes):
            if base.counts[i, j]:
                st = base.edge_stats(s, d)
                tag = "authorised" if adj[i, j] else f"WEAK (<{C.MIN_EDGE_SUPPORT} windows)"
                print(f"  {s} -> {d}: windows={st.windows} p99~{st.lat_med:.1f}ms "
                      f"entropy~{st.ent_med:.2f} [{tag}]")


if __name__ == "__main__":
    main()
