"""Root-cause localisation by backward causal graph traversal.

Failure propagation in an RPC graph runs against call direction: if payment-vault is slow,
order-service (its caller) looks slow, and so does gateway-service (order's caller). Every
one of those caller->callee edges looks anomalous, but only one node is the cause.

Algorithm
  1. Score every observed edge 0..1 with edge_anomaly() against the baseline; keep the worst
     observation per (src, dst) in the window.
  2. Keep edges with anomaly >= threshold -> anomalous subgraph H (caller -> callee).
  3. Walk H *backwards from the symptom* (callers) *forwards to the cause* (callees): a node
     whose own downstream calls are all healthy (a sink of H, or a sink SCC if H has a cycle)
     is a ROOT CAUSE. Every other node in H is a cascading VICTIM.
  4. Root score = noisy-OR over incoming anomalous edges, nudged up by how many upstream
     victims it explains. Victim score = how strongly it is itself degraded (discounted 0.5).
"""
from __future__ import annotations

import time

import networkx as nx

from . import config as C
from .baseline import Baseline
from .schemas import RankedNode, RcaResponse, RcaRequest
from .scorer import edge_anomaly


def analyse(base: Baseline, req: RcaRequest) -> RcaResponse:
    t0 = time.perf_counter()

    worst: dict[tuple[str, str], tuple[float, object]] = {}
    nodes: set[str] = set()
    for o in req.edges:
        nodes.update((o.source, o.target))
        a = edge_anomaly(base, o)
        k = (o.source, o.target)
        if k not in worst or a > worst[k][0]:
            worst[k] = (a, o)

    H = nx.DiGraph()
    for (u, v), (a, o) in worst.items():
        if a >= C.RCA_EDGE_ANOMALY_THRESHOLD:
            H.add_edge(u, v, w=a)

    roots: list[RankedNode] = []
    victims: list[RankedNode] = []

    if H.number_of_edges():
        cond = nx.condensation(H)
        root_nodes: set[str] = set()
        for scc_id in cond.nodes:
            if cond.out_degree(scc_id) == 0:
                root_nodes.update(cond.nodes[scc_id]["members"])

        for n in H.nodes:
            if n in root_nodes:
                inc = [H[u][n]["w"] for u in H.predecessors(n)]
                s = 1.0
                for w in inc:
                    s *= (1 - w)
                s = 1 - s
                explained = len(nx.ancestors(H, n) - {n})
                s = min(1.0, s + 0.05 * explained)
                roots.append(RankedNode(node=n, score=round(s, 4), role="root_cause"))
            else:
                inc = [H[u][n]["w"] for u in H.predecessors(n)]
                out = [H[n][v]["w"] for v in H.successors(n)]
                s = 0.5 * (max(inc) if inc else max(out))
                victims.append(RankedNode(node=n, score=round(s, 4), role="victim"))

        paths: list[list[str]] = []
        entries = [n for n in H.nodes if H.in_degree(n) == 0 and n not in root_nodes]
        for r in root_nodes:
            for e in entries or []:
                if nx.has_path(H, e, r):
                    for p in nx.all_simple_paths(H, e, r):
                        paths.append(p)
                        if len(paths) >= 10:
                            break
            if not entries and H.in_degree(r):
                paths.append([*sorted(H.predecessors(r)), r])
    else:
        root_nodes, paths = set(), []

    roots.sort(key=lambda x: -x.score)
    victims.sort(key=lambda x: -x.score)
    healthy = sorted(nodes - set(H.nodes))

    anomalous_edges = [
        {
            "source": u,
            "target": v,
            "anomaly": round(a, 4),
            "latency_ms": o.latency_ms,
            "status": o.status,
        }
        for (u, v), (a, o) in sorted(worst.items(), key=lambda kv: -kv[1][0])
        if a >= C.RCA_EDGE_ANOMALY_THRESHOLD
    ]

    return RcaResponse(
        window_id=req.window_id,
        root_causes=roots,
        victims=victims,
        healthy=healthy,
        anomalous_edges=anomalous_edges,
        causal_paths=paths,
        inference_ms=round((time.perf_counter() - t0) * 1000, 4),
    )
