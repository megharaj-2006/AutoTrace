"""Synthetic edge windows for tests, benchmarks and demo baselines.

Mirrors the REAL testbed (infra/docker-compose.testbed.yml): traffic enters at
gateway-service and flows external-client -> gateway-service -> order-service ->
payment-vault, each hop adding ~15 ms. reviews-service has no benign traffic. Benign
requests are empty GETs, so payload entropy is 0.0.

Replace with real traces: scripts/generate_baseline.py --input events.jsonl
"""
from __future__ import annotations

import random

from .features import EdgeFeatures, EdgeWindow

EXTERNAL, GATEWAY, ORDER, REVIEWS, VAULT = (
    "external-client", "gateway-service", "order-service", "reviews-service", "payment-vault")
NODES = [EXTERNAL, GATEWAY, ORDER, REVIEWS, VAULT]

# Benign chain, in call order: (source, target, typical p99 ms).
CHAIN = [(EXTERNAL, GATEWAY, 46.0), (GATEWAY, ORDER, 31.0), (ORDER, VAULT, 16.0)]
BENIGN_EDGES = {(s, d) for s, d, _ in CHAIN}


def _benign_features(rng: random.Random, p99: float) -> EdgeFeatures:
    # ~3% of windows carry a small JSON POST body (entropy ~4.5) to exercise the entropy gate.
    ent = rng.gauss(4.5, 0.3) if rng.random() < 0.03 else 0.0
    return EdgeFeatures(
        call_count=rng.randint(3, 6),
        p99_latency_ms=max(1.0, p99 * rng.lognormvariate(0, 0.10)),
        error_rate=0.0 if rng.random() > 0.01 else 0.2,
        payload_entropy=max(0.0, ent),
    )


def benign_windows(n_per_edge: int, seed: int = 0) -> list[EdgeWindow]:
    rng = random.Random(seed)
    return [EdgeWindow(s, d, _benign_features(rng, p99))
            for _ in range(n_per_edge) for s, d, p99 in CHAIN]


def rogue_windows(n: int, seed: int = 1) -> list[EdgeWindow]:
    """Unauthorised edges: every node pair outside the benign chain, incl. the headline
    reviews-service -> payment-vault. Half carry empty bodies (entropy 0.0), like the real exploit."""
    rng = random.Random(seed)
    pairs = [(a, b) for a in NODES for b in NODES if a != b and (a, b) not in BENIGN_EDGES]
    out = [EdgeWindow(REVIEWS, VAULT, EdgeFeatures(1, 16.8, 0.0, 0.0))]
    for _ in range(n - 1):
        s, d = rng.choice(pairs)
        ent = 0.0 if rng.random() < 0.5 else rng.uniform(3.5, 7.8)
        out.append(EdgeWindow(s, d, EdgeFeatures(rng.randint(1, 5), rng.uniform(8, 80), 0.0, ent)))
    return out


def chaos_windows(failing: str, seed: int = 2, delay_ms: float = 3000.0) -> list[EdgeWindow]:
    """One window where `failing` is slow. The delay surfaces on its inbound edge and on every
    edge upstream of it (callers wait on callees), exactly as testbed/chaos/inject_latency.sh does."""
    rng = random.Random(seed)
    failing_idx = next(i for i, (_, d, _) in enumerate(CHAIN) if d == failing)
    out = []
    for i, (s, d, p99) in enumerate(CHAIN):
        affected = i <= failing_idx
        out.append(EdgeWindow(s, d, EdgeFeatures(
            call_count=rng.randint(1, 3),
            p99_latency_ms=(p99 + delay_ms) * rng.lognormvariate(0, 0.05) if affected else p99 * rng.lognormvariate(0, 0.08),
            error_rate=0.3 if affected and rng.random() < 0.4 else 0.0,
            payload_entropy=0.0,
        )))
    return out
