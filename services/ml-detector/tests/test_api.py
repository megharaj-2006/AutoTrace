import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.synth import chaos_window


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_lateral_movement_is_quarantined(client):
    r = client.post("/api/v1/score-edge", json={
        "source": "reviews-service", "target": "payment-vault",
        "latency_ms": 30, "status": 200, "entropy": 6.5})
    body = r.json()
    assert r.status_code == 200
    assert body["is_rogue_edge"] is True
    assert body["threat_score"] > 0.90
    assert body["verdict"] == "quarantine"
    assert body["quarantine_target"] == "reviews-service"


def test_benign_edge_allowed(client):
    r = client.post("/api/v1/score-edge", json={
        "source": "order-service", "target": "payment-vault",
        "latency_ms": 41, "status": 200, "entropy": 4.9})
    assert r.json()["verdict"] == "allow"


def test_telemetry_aliases_accepted(client):
    # `latency` instead of `latency_ms`, status as string
    r = client.post("/api/v1/score-edge", json={
        "source": "gateway-service", "target": "order-service",
        "latency": 27, "status": "200", "entropy": 4.3})
    assert r.status_code == 200


def test_latency_spike_is_degraded_not_quarantine(client):
    r = client.post("/api/v1/score-edge", json={
        "source": "order-service", "target": "payment-vault",
        "latency_ms": 400, "status": 504, "entropy": 4.9})
    assert r.json()["verdict"] in {"degraded", "allow"}
    assert r.json()["threat_score"] < 0.90


def test_rca_finds_root_cause(client):
    edges = [e.model_dump() for e in chaos_window("payment-vault", seed=3)]
    r = client.post("/api/v1/rca", json={"window_id": "w1", "edges": edges})
    body = r.json()
    assert body["root_causes"][0]["node"] == "payment-vault"
    assert {v["node"] for v in body["victims"]} >= {"order-service"}
    assert body["window_id"] == "w1"


def test_rca_all_healthy(client):
    from app.synth import benign_stream
    edges = [e.model_dump() for e in benign_stream(4, seed=9)]
    body = client.post("/api/v1/rca", json={"edges": edges}).json()
    assert body["root_causes"] == []


def test_validation_error(client):
    assert client.post("/api/v1/score-edge", json={"source": "x"}).status_code == 422
