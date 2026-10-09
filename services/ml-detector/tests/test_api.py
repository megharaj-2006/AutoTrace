import pytest
from fastapi.testclient import TestClient

from models.baseline import build_baseline
from models.synth import benign_windows, chaos_windows
from src import config as C
from src.main import app


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    path = tmp_path_factory.mktemp("b") / "baseline.json"
    build_baseline(benign_windows(200)).save(path)
    C.BASELINE_PATH = path
    with TestClient(app) as c:
        yield c


def _edge(src, dst, p99=16.0, err=0.0, ent=0.0, calls=5):
    return {"source": src, "target": dst, "features": {
        "call_count": calls, "p99_latency_ms": p99, "error_rate": err, "payload_entropy": ent}}


def test_health(client):
    body = client.get("/health").json()
    assert body["status"] == "HEALTHY" and "payment-vault" in body["nodes"]


def test_member2_contract_example_is_quarantined(client):
    # Exact request shape from docs/contracts/member2-backend-contract.md section 4.1
    r = client.post("/api/v1/score-edge", json={
        "source": "reviews-service", "target": "payment-vault",
        "features": {"call_count": 5, "p99_latency_ms": 18.5, "error_rate": 0.0, "payload_entropy": 2.45}})
    body = r.json()
    assert r.status_code == 200
    assert body["is_anomalous"] is True
    assert body["confidence"] >= 0.90
    assert body["anomaly_type"] == "ROGUE_EDGE"
    assert body["severity"] == "CRITICAL"
    assert body["quarantine_target"] == "reviews-service"
    assert "A_base" in body["reason"]


def test_real_exploit_with_empty_body_is_still_caught(client):
    # The testbed exploit is an empty GET: entropy 0.0, so only topology novelty gives it away.
    body = client.post("/api/v1/score-edge", json=_edge("reviews-service", "payment-vault", ent=0.0)).json()
    assert body["is_anomalous"] is True


def test_benign_edge_not_anomalous(client):
    body = client.post("/api/v1/score-edge", json=_edge("order-service", "payment-vault")).json()
    assert body["is_anomalous"] is False and body["severity"] == "LOW"


def test_slow_dependency_is_degraded_not_quarantined(client):
    body = client.post("/api/v1/score-edge", json=_edge("order-service", "payment-vault", p99=3016, err=0.4)).json()
    assert body["is_anomalous"] is False
    assert body["confidence"] < 0.90
    assert body["severity"] == "MEDIUM"


def test_high_entropy_on_known_edge_is_exfiltration(client):
    body = client.post("/api/v1/score-edge", json=_edge("order-service", "payment-vault", ent=7.9)).json()
    assert body["is_anomalous"] is True and body["anomaly_type"] == "ENTROPY_ANOMALY"


def test_legit_json_post_on_known_edge_is_not_flagged(client):
    body = client.post("/api/v1/score-edge", json=_edge("order-service", "payment-vault", ent=4.5)).json()
    assert body["is_anomalous"] is False


def test_unknown_fields_are_ignored(client):
    r = client.post("/api/v1/score-edge", json={**_edge("gateway-service", "order-service"), "extra": 1})
    assert r.status_code == 200


def test_invalid_input_rejected(client):
    assert client.post("/api/v1/score-edge", json={"source": "x"}).status_code == 422
    assert client.post("/api/v1/score-edge", json=_edge("a", "b", err=2.0)).status_code == 422


def test_deterministic(client):
    a = client.post("/api/v1/score-edge", json=_edge("reviews-service", "payment-vault")).json()
    b = client.post("/api/v1/score-edge", json=_edge("reviews-service", "payment-vault")).json()
    a.pop("inference_ms"), b.pop("inference_ms")
    assert a == b


@pytest.mark.parametrize("failing", ["payment-vault", "order-service", "gateway-service"])
def test_rca_finds_injected_root_cause(client, failing):
    edges = [{"source": w.source, "target": w.target, "features": vars(w.features)}
             for w in chaos_windows(failing, seed=3)]
    body = client.post("/api/v1/rca", json={"window_id": "w1", "edges": edges}).json()
    assert body["root_causes"][0]["node"] == failing
    assert body["window_id"] == "w1"


def test_rca_all_healthy(client):
    edges = [{"source": w.source, "target": w.target, "features": vars(w.features)}
             for w in benign_windows(1, seed=9)]
    assert client.post("/api/v1/rca", json={"edges": edges}).json()["root_causes"] == []
