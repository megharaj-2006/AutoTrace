"""Root-cause localisation by backward causal graph traversal.

Failure propagates against call direction: if payment-vault is slow, order-service (its
caller) looks slow, and so does gateway-service. Every caller->callee edge on that chain looks
anomalous, but only one node is the cause.

  1. Score each edge's health anomaly 0..1 against the baseline (worst window per edge).
  2. Keep edges >= RCA_EDGE_THRESHOLD: anomalous subgraph H (caller -> callee).
  3. A node in H whose own downstream calls are all healthy (a sink of H; a sink SCC if H has
     a cycle) is a ROOT CAUSE; every other node in H is a cascading VICTIM.
  4. Root score = noisy-OR over its incoming anomalous edges, nudged up by how many upstream
     victims it explains. Victim score = its own degradation, discounted by 0.5.
"""
from __future__ import annotations

import time

import networkx as nx

from src import config as C

from .baseline import Baseline
from .features import EdgeWindow
from .scorer import edge_health_anomaly


def analyse(base: Baseline, windows: list[EdgeWindow], window_id: str | None = None) -> dict:
    t0 = time.perf_counter()

    worst: dict[tuple[str, str], tuple[float, EdgeWindow]] = {}
    nodes: set[str] = set()
    for w in windows:
        nodes.update((w.source, w.target))
        a = edge_health_anomaly(base, w.source, w.target, w.features)
        if (w.source, w.target) not in worst or a > worst[(w.source, w.target)][0]:
            worst[(w.source, w.target)] = (a, w)

    H = nx.DiGraph()
    for (u, v), (a, _) in worst.items():
        if a >= C.RCA_EDGE_THRESHOLD:
            H.add_edge(u, v, w=a)

    roots, victims, paths = [], [], []
    root_nodes: set[str] = set()
    if H.number_of_edges():
        cond = nx.condensation(H)
        for scc in cond.nodes:
            if cond.out_degree(scc) == 0:
                root_nodes.update(cond.nodes[scc]["members"])

        for n in H.nodes:
            inc = [H[u][n]["w"] for u in H.predecessors(n)]
            if n in root_nodes:
                s = 1.0
                for w in inc:
                    s *= 1 - w
                s = min(1.0, (1 - s) + 0.05 * len(nx.ancestors(H, n)))
                roots.append({"node": n, "score": round(s, 4), "role": "root_cause"})
            else:
                out = [H[n][v]["w"] for v in H.successors(n)]
                s = 0.5 * (max(inc) if inc else max(out))
                victims.append({"node": n, "score": round(s, 4), "role": "victim"})

        entries = [n for n in H.nodes if H.in_degree(n) == 0 and n not in root_nodes]
        for r in sorted(root_nodes):
            for e in sorted(entries):
                if nx.has_path(H, e, r):
                    paths.extend(list(nx.all_simple_paths(H, e, r))[:5])

    roots.sort(key=lambda x: -x["score"])
    victims.sort(key=lambda x: -x["score"])

    return {
        "window_id": window_id,
        "root_causes": roots,
        "victims": victims,
        "healthy": sorted(nodes - set(H.nodes)),
        "anomalous_edges": [
            {"source": u, "target": v, "anomaly": round(a, 4),
             "p99_latency_ms": w.features.p99_latency_ms, "error_rate": w.features.error_rate}
            for (u, v), (a, w) in sorted(worst.items(), key=lambda kv: -kv[1][0])
            if a >= C.RCA_EDGE_THRESHOLD
        ],
        "causal_paths": paths[:10],
        "inference_ms": round((time.perf_counter() - t0) * 1000, 4),
    }
