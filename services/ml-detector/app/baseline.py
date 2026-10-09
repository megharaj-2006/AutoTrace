"""Baseline communication matrix A_base built from steady-state benign telemetry.

A_base[i, j] = number of benign observations of calls i -> j (raw counts; the boolean
authorised-path matrix is counts >= MIN_EDGE_SUPPORT). Alongside the matrix we keep robust
per-edge statistics (median / MAD) of latency and entropy plus the error rate, so known
edges can be checked for out-of-distribution behaviour.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

import numpy as np

from .config import MIN_EDGE_SUPPORT
from .schemas import EdgeObservation

MAD_TO_SIGMA = 1.4826


@dataclass
class EdgeStats:
    count: int
    lat_med: float
    lat_mad: float
    ent_med: float
    ent_mad: float
    err_rate: float

    def to_dict(self) -> dict:
        return self.__dict__.copy()


@dataclass
class Baseline:
    nodes: list[str]
    counts: np.ndarray  # shape (n, n), A_base counts
    stats: dict[str, EdgeStats] = field(default_factory=dict)  # key "src->dst"
    total_observations: int = 0

    # ------------------------------------------------------------ lookups
    def index(self, node: str) -> int | None:
        try:
            return self.nodes.index(node)
        except ValueError:
            return None

    @staticmethod
    def key(src: str, dst: str) -> str:
        return f"{src}->{dst}"

    def count(self, src: str, dst: str) -> int:
        i, j = self.index(src), self.index(dst)
        if i is None or j is None:
            return 0
        return int(self.counts[i, j])

    def adjacency(self) -> np.ndarray:
        """Boolean authorised-path matrix."""
        return (self.counts >= MIN_EDGE_SUPPORT).astype(np.int8)

    def edge_stats(self, src: str, dst: str) -> EdgeStats | None:
        return self.stats.get(self.key(src, dst))

    # ------------------------------------------------------------ persistence
    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "nodes": self.nodes,
            "counts": self.counts.tolist(),
            "stats": {k: v.to_dict() for k, v in self.stats.items()},
            "total_observations": self.total_observations,
            "min_edge_support": MIN_EDGE_SUPPORT,
        }
        path.write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: Path) -> "Baseline":
        data = json.loads(Path(path).read_text())
        return cls(
            nodes=data["nodes"],
            counts=np.array(data["counts"], dtype=np.int64),
            stats={k: EdgeStats(**v) for k, v in data["stats"].items()},
            total_observations=data.get("total_observations", 0),
        )


def _robust(x: np.ndarray) -> tuple[float, float]:
    med = float(np.median(x))
    mad = float(np.median(np.abs(x - med))) * MAD_TO_SIGMA
    return med, mad


def build_baseline(observations: Iterable[EdgeObservation]) -> Baseline:
    obs = list(observations)
    if not obs:
        raise ValueError("cannot build a baseline from zero observations")

    nodes = sorted({o.source for o in obs} | {o.target for o in obs})
    idx = {n: i for i, n in enumerate(nodes)}
    counts = np.zeros((len(nodes), len(nodes)), dtype=np.int64)

    per_edge: dict[str, list[EdgeObservation]] = {}
    for o in obs:
        counts[idx[o.source], idx[o.target]] += 1
        per_edge.setdefault(Baseline.key(o.source, o.target), []).append(o)

    stats: dict[str, EdgeStats] = {}
    for k, group in per_edge.items():
        lat = np.array([g.latency_ms for g in group])
        ent = np.array([g.entropy for g in group])
        lat_med, lat_mad = _robust(lat)
        ent_med, ent_mad = _robust(ent)
        err = float(np.mean([0.0 if g.ok else 1.0 for g in group]))
        stats[k] = EdgeStats(len(group), lat_med, lat_mad, ent_med, ent_mad, err)

    return Baseline(nodes=nodes, counts=counts, stats=stats, total_observations=len(obs))
