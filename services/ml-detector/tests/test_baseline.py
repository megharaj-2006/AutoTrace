import pytest

from models.baseline import Baseline, build_baseline
from models.synth import benign_windows
from models.windows import aggregate_events
from src import config as C


def test_adjacency_matches_testbed_topology():
    b = build_baseline(benign_windows(200))
    adj = b.adjacency()
    i = b.nodes.index
    assert adj[i("external-client"), i("gateway-service")] == 1
    assert adj[i("gateway-service"), i("order-service")] == 1
    assert adj[i("order-service"), i("payment-vault")] == 1
    assert adj.sum() == 3
    assert "reviews-service" not in b.nodes  # no benign traffic touches it


def test_roundtrip(tmp_path):
    b = build_baseline(benign_windows(100))
    b.save(tmp_path / "b.json")
    b2 = Baseline.load(tmp_path / "b.json")
    assert b2.nodes == b.nodes and (b2.counts == b.counts).all() and b2.stats.keys() == b.stats.keys()


def test_empty_baseline_rejected():
    with pytest.raises(ValueError):
        build_baseline([])


def _event(src, dst, ts, status=200, lat=15.0, ent=0.0):
    return {"trace_id": "t", "source_service": src, "target_service": dst, "endpoint": "/process",
            "method": "GET", "status_code": status, "latency_ms": lat, "payload_entropy": ent,
            "timestamp": ts}


def test_aggregate_events_into_5s_windows():
    base = 1_791_188_000_000
    events = [_event("gateway-service", "order-service", base + i * 1000, lat=10 + i) for i in range(5)]
    events += [_event("gateway-service", "order-service", base + 5000 + i * 1000, status=500) for i in range(2)]
    w = aggregate_events(events, window_seconds=5)
    assert len(w) == 2
    assert w[0].features.call_count == 5 and w[0].features.error_rate == 0.0
    assert w[0].features.p99_latency_ms == pytest.approx(13.96, abs=0.01)  # p99 of latencies 10..14
    assert w[1].features.error_rate == 1.0


def test_aggregate_skips_malformed_events():
    good = _event("a", "b", 1_000)
    assert len(aggregate_events([good, {"source_service": "a"}, {"timestamp": "x"}])) == 1


def test_fail_fast_without_baseline(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from src.main import app
    monkeypatch.setattr(C, "BASELINE_PATH", tmp_path / "missing.json")
    monkeypatch.setattr(C, "ALLOW_SYNTHETIC_BASELINE", False)
    with pytest.raises(RuntimeError, match="Baseline not found"):
        with TestClient(app):
            pass
