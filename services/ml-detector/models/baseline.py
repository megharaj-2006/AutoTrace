"""Baseline communication matrix A_base from steady-state benign traffic.

counts[i, j] is the number of benign WINDOWS in which service i called service j; the
boolean authorised-path matrix is counts >= MIN_EDGE_SUPPORT. Per-edge robust statistics
(median / MAD) of p99 latency and payload entropy let known edges be checked for
out-of-distribution behaviour.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

import numpy as np

from src import config as C

from .features import EdgeWindow

MAD_TO_SIGMA = 1.4826


@dataclass
class EdgeStats:
    windows: int
    lat_med: float
    lat_mad: float
    ent_med: float
    ent_mad: float
    err_rate: float


@dataclass
class Baseline:
    nodes: list[str]
    counts: np.ndarray
    stats: dict[str, EdgeStats] = field(default_factory=dict)  # key "src->dst"
    total_windows: int = 0

    @staticmethod
    def key(src: str, dst: str) -> str:
        return f"{src}->{dst}"

    def count(self, src: str, dst: str) -> int:
        if src not in self.nodes or dst not in self.nodes:
            return 0
        return int(self.counts[self.nodes.index(src), self.nodes.index(dst)])

    def edge_stats(self, src: str, dst: str) -> EdgeStats | None:
        return self.stats.get(self.key(src, dst))

    def adjacency(self) -> np.ndarray:
        return (self.counts >= C.MIN_EDGE_SUPPORT).astype(np.int8)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({
            "nodes": self.nodes,
            "counts": self.counts.tolist(),
            "stats": {k: vars(v) for k, v in self.stats.items()},
            "total_windows": self.total_windows,
        }, indent=2))

    @classmethod
    def load(cls, path: Path) -> "Baseline":
        data = json.loads(Path(path).read_text())
        return cls(
            nodes=data["nodes"],
            counts=np.array(data["counts"], dtype=np.int64),
            stats={k: EdgeStats(**v) for k, v in data["stats"].items()},
            total_windows=data.get("total_windows", 0),
        )


def _robust(x: np.ndarray) -> tuple[float, float]:
    med = float(np.median(x))
    return med, float(np.median(np.abs(x - med))) * MAD_TO_SIGMA


def build_baseline(windows: Iterable[EdgeWindow]) -> Baseline:
    wins = list(windows)
    if not wins:
        raise ValueError("cannot build a baseline from zero windows")

    nodes = sorted({w.source for w in wins} | {w.target for w in wins})
    idx = {n: i for i, n in enumerate(nodes)}
    counts = np.zeros((len(nodes), len(nodes)), dtype=np.int64)
    per_edge: dict[str, list[EdgeWindow]] = {}
    for w in wins:
        counts[idx[w.source], idx[w.target]] += 1
        per_edge.setdefault(Baseline.key(w.source, w.target), []).append(w)

    stats = {}
    for k, group in per_edge.items():
        lat_med, lat_mad = _robust(np.array([g.features.p99_latency_ms for g in group]))
        ent_med, ent_mad = _robust(np.array([g.features.payload_entropy for g in group]))
        err = float(np.mean([g.features.error_rate for g in group]))
        stats[k] = EdgeStats(len(group), lat_med, lat_mad, ent_med, ent_mad, err)

    return Baseline(nodes=nodes, counts=counts, stats=stats, total_windows=len(wins))
