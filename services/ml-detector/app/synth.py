"""Synthetic telemetry for the 4-node testbed (used for tests, benchmarks and as a fallback
baseline until Member 1's real interceptor traces exist).

Replace with real traces: `python scripts/generate_baseline.py --input traces.jsonl`.
"""
from __future__ import annotations

import random

from .schemas import EdgeObservation

GATEWAY, ORDER, REVIEWS, VAULT = "gateway-service", "order-service", "reviews-service", "payment-vault"

# Benign call graph of the e-commerce testbed: (src, dst, latency_median_ms, entropy_mean, weight)
BENIGN_EDGES = [
    (GATEWAY, ORDER, 28.0, 4.3, 0.40),
    (GATEWAY, REVIEWS, 14.0, 4.6, 0.30),
    (ORDER, VAULT, 42.0, 4.9, 0.20),
    (ORDER, REVIEWS, 11.0, 4.5, 0.10),
]
NODES = [GATEWAY, ORDER, REVIEWS, VAULT]


def benign_obs(rng: random.Random, edge=None) -> EdgeObservation:
    src, dst, lat, ent, _ = edge or rng.choices(BENIGN_EDGES, weights=[e[4] for e in BENIGN_EDGES])[0]
    latency = lat * rng.lognormvariate(0, 0.18)
    entropy = max(0.0, rng.gauss(ent, 0.22))
    status = 200 if rng.random() > 0.004 else 500
    return EdgeObservation(source=src, target=dst, latency_ms=latency, status=status, entropy=entropy)


def benign_stream(n: int, seed: int = 0) -> list[EdgeObservation]:
    rng = random.Random(seed)
    return [benign_obs(rng) for _ in range(n)]


def rogue_obs(rng: random.Random, src: str, dst: str) -> EdgeObservation:
    """Unauthorised call: attacker-controlled timing and (often) high-entropy payload."""
    return EdgeObservation(
        source=src,
        target=dst,
        latency_ms=rng.uniform(8, 80),
        status=200,
        entropy=rng.uniform(3.5, 7.8),
    )


def rogue_stream(n: int, seed: int = 1) -> list[EdgeObservation]:
    """Every NODE pair that is NOT an authorised edge (incl. the headline reviews -> vault)."""
    rng = random.Random(seed)
    allowed = {(s, d) for s, d, *_ in BENIGN_EDGES}
    rogue_pairs = [(a, b) for a in NODES for b in NODES if a != b and (a, b) not in allowed]
    out = [rogue_obs(rng, REVIEWS, VAULT)]  # the demo attack always included
    out += [rogue_obs(rng, *rng.choice(rogue_pairs)) for _ in range(n - 1)]
    return out


def chaos_window(failing: str, seed: int = 2, severity: float = 8.0) -> list[EdgeObservation]:
    """One 5s window where `failing` is degraded; latency cascades up to its callers.

    Each upstream hop adds only a fraction of the delay, like a real timeout cascade.
    """
    rng = random.Random(seed)
    callers: dict[str, list] = {}
    for e in BENIGN_EDGES:
        callers.setdefault(e[1], []).append(e)

    degraded: dict[tuple[str, str], float] = {}
    frontier = [(failing, severity)]
    seen = set()
    while frontier:
        node, sev = frontier.pop()
        for src, dst, *_ in callers.get(node, []):
            if (src, dst) in seen:
                continue
            seen.add((src, dst))
            degraded[(src, dst)] = sev
            frontier.append((src, max(sev * 0.8, 3.0)))

    window = []
    for src, dst, lat, ent, _ in BENIGN_EDGES:
        mult = degraded.get((src, dst), 1.0)
        status = 504 if (src, dst) in degraded and rng.random() < 0.3 else 200
        window.append(EdgeObservation(
            source=src, target=dst,
            latency_ms=lat * mult * rng.lognormvariate(0, 0.1),
            status=status, entropy=max(0.0, rng.gauss(ent, 0.2)),
        ))
    return window
