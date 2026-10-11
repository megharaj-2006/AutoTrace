"""
AutoTrace-Sec: Security Hardening & Vulnerability Regression Tests.

This test suite explicitly verifies the mitigation of all confirmed vulnerabilities:
- Vuln-1: Confused Deputy / Container ID Authorization Bypass in Quarantine
- Vuln-2: Unconstrained Container & Network in Release Endpoint
- Vuln-3: Concurrency Race Conditions & Per-Container Serialization
- Vuln-4: Quarantine State Persistence & Reconciliation
- Vuln-6: Zero-Trust PKI SPIFFE/SPIRE Identity Revocation Integration
- Vuln-9: Sliding-Window Rate Limiting & DoS Protection
- Vuln-10: Correct Action Label on Release (NETWORK_RESTORE)
"""

import asyncio
import os
import pytest
from unittest.mock import MagicMock, patch
from httpx import ASGITransport, AsyncClient

from src.app import app, get_config, get_engine, _rate_limiter, log_audit_event
from src.config import ActuatorConfig
from src.containment import ContainmentEngine, ContainerNotFoundError, NetworkNotFoundError


@pytest.fixture
def test_config():
    """Isolated test configuration in dry-run mode with API key."""
    os.environ["ACTUATOR_DRY_RUN"] = "true"
    os.environ["ACTUATOR_API_KEY"] = "test-hardening-key"
    os.environ["ACTUATOR_ALLOWED_CULPRITS"] = "reviews-service,order-service,gateway-service"
    os.environ["ACTUATOR_ALLOWED_TARGETS"] = "payment-vault,order-service,gateway-service"
    os.environ["ACTUATOR_PROTECTED_SERVICES"] = "redpanda,redis,telemetry-collector,graph-engine,ml-detector,actuator-security,web-dashboard"
    os.environ["ACTUATOR_DOCKER_NETWORK"] = "autotrace-mesh"
    os.environ["ACTUATOR_RATE_LIMIT_ENABLED"] = "true"
    os.environ["ACTUATOR_RATE_LIMIT_REQUESTS"] = "50"
    os.environ["ACTUATOR_RATE_LIMIT_WINDOW_SEC"] = "1.0"
    _rate_limiter.reset()
    cfg = ActuatorConfig()
    return cfg


@pytest.fixture
def auth_headers():
    return {
        "X-API-Key": "test-hardening-key",
        "Content-Type": "application/json",
    }


@pytest.mark.asyncio
class TestVuln1ConfusedDeputyBypass:
    """Regression tests for Vuln-1: Container ID Authorization Bypass in Quarantine."""

    async def test_protected_container_id_with_valid_culprit_is_rejected(self, test_config, auth_headers):
        """Attacker passes valid culprit 'reviews-service' but targets protected 'redpanda'."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/quarantine",
                headers=auth_headers,
                json={
                    "culprit_service": "reviews-service",
                    "container_id": "redpanda",
                    "target_service": "payment-vault",
                    "reason": "Bypass attempt",
                },
            )

        assert resp.status_code == 403
        data = resp.json()
        assert "protected infrastructure service" in data["detail"].lower()

    async def test_protected_container_id_redis_is_rejected(self, test_config, auth_headers):
        """Verify redis cannot be targeted via container_id."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/quarantine",
                headers=auth_headers,
                json={
                    "culprit_service": "reviews-service",
                    "container_id": "redis",
                    "target_service": "payment-vault",
                    "reason": "Redis targeting",
                },
            )

        assert resp.status_code == 403

    async def test_unauthorized_container_id_not_in_allowlist_is_rejected(self, test_config, auth_headers):
        """Attacker passes valid culprit but unlisted container_id."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/quarantine",
                headers=auth_headers,
                json={
                    "culprit_service": "reviews-service",
                    "container_id": "arbitrary-container-xyz",
                    "target_service": "payment-vault",
                    "reason": "Unlisted container",
                },
            )

        assert resp.status_code == 400
        assert "not in the allowed culprits list" in resp.json()["detail"]


@pytest.mark.asyncio
class TestVuln2ReleaseEndpointHardening:
    """Regression tests for Vuln-2: Release Endpoint Restrictions."""

    async def test_release_protected_service_rejected(self, test_config, auth_headers):
        """Attempting to release a protected infrastructure container is forbidden."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/release",
                headers=auth_headers,
                json={"container_id": "redpanda"},
            )

        assert resp.status_code == 403
        assert "protected infrastructure service" in resp.json()["detail"].lower()

    async def test_release_unauthorized_container_rejected(self, test_config, auth_headers):
        """Releasing an unapproved container name is rejected."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/release",
                headers=auth_headers,
                json={"container_id": "rogue-service-123"},
            )

        assert resp.status_code == 400
        assert "not in the allowed culprits list" in resp.json()["detail"]

    async def test_release_to_unauthorized_network_rejected(self, test_config, auth_headers):
        """Releasing to an unauthorized network (e.g. host network) is blocked."""
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/release",
                headers=auth_headers,
                json={
                    "container_id": "reviews-service",
                    "network_name": "host",
                },
            )

        assert resp.status_code == 403
        assert "not permitted" in resp.json()["detail"].lower()

    async def test_release_invalid_network_pattern_rejected(self, test_config, auth_headers):
        """Command injection in network_name is rejected by Pydantic schema."""
        app.dependency_overrides[get_config] = lambda: test_config

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/release",
                headers=auth_headers,
                json={
                    "container_id": "reviews-service",
                    "network_name": "mesh; rm -rf /",
                },
            )

        assert resp.status_code == 422


@pytest.mark.asyncio
class TestVuln3ConcurrencySafety:
    """Regression tests for Vuln-3: Concurrency Safety and Mutex Locking."""

    async def test_concurrent_quarantine_requests_are_serialized_and_idempotent(self, test_config, auth_headers):
        """Fire 10 simultaneous quarantine requests for the same container; ensure zero race crashes."""
        engine = ContainmentEngine(test_config)
        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: engine

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            tasks = [
                client.post(
                    "/api/v1/quarantine",
                    headers=auth_headers,
                    json={
                        "culprit_service": "reviews-service",
                        "container_id": "reviews-service",
                        "target_service": "payment-vault",
                        "reason": f"Concurrent test {i}",
                    },
                )
                for i in range(10)
            ]
            responses = await asyncio.gather(*tasks)

        # All 10 requests must succeed with HTTP 200
        for resp in responses:
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] in ("DRY_RUN", "ALREADY_CONTAINED")

        # Container is definitively quarantined
        assert engine.is_quarantined("reviews-service")


class TestVuln6PKIRevocationIntegration:
    """Regression tests for Vuln-6: SPIFFE/SPIRE PKI Revocation Integration."""

    def test_quarantine_triggers_spiffe_revocation(self, test_config):
        """Quarantining a container invokes SPIFFE workload SVID revocation."""
        engine = ContainmentEngine(test_config)
        assert engine._spiffe_hook is not None
        assert not engine._spiffe_hook.is_identity_revoked("reviews-service")

        res = engine.quarantine("reviews-service", "autotrace-mesh", culprit_service="reviews-service")
        assert res.success is True
        assert res.spiffe_revoked is True
        assert engine._spiffe_hook.is_identity_revoked("reviews-service")

    def test_release_restores_spiffe_identity(self, test_config):
        """Releasing a quarantined container restores its SPIFFE workload identity."""
        engine = ContainmentEngine(test_config)
        engine.quarantine("reviews-service", "autotrace-mesh")
        assert engine._spiffe_hook.is_identity_revoked("reviews-service")

        rel_res = engine.release("reviews-service", "autotrace-mesh")
        assert rel_res.success is True
        assert rel_res.action == "NETWORK_RESTORE"
        assert not engine._spiffe_hook.is_identity_revoked("reviews-service")


@pytest.mark.asyncio
class TestVuln9RateLimiting:
    """Regression tests for Vuln-9: Rate Limiting & DoS Protection."""

    async def test_exceeding_rate_limit_returns_429(self, test_config, auth_headers):
        """When requests exceed rate_limit_requests in window, 429 Too Many Requests is returned."""
        # Set strict limit: 3 requests per second
        test_config.rate_limit_requests = 3
        test_config.rate_limit_window_sec = 2.0
        _rate_limiter.reset()

        app.dependency_overrides[get_config] = lambda: test_config
        app.dependency_overrides[get_engine] = lambda: ContainmentEngine(test_config)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            statuses = []
            for _ in range(5):
                resp = await client.post(
                    "/api/v1/quarantine",
                    headers=auth_headers,
                    json={
                        "culprit_service": "reviews-service",
                        "target_service": "payment-vault",
                        "reason": "Rate limit probe",
                    },
                )
                statuses.append(resp.status_code)

        assert 200 in statuses
        assert 429 in statuses
        assert statuses[-1] == 429


class TestVuln10ActionLabelAndExceptionMapping:
    """Regression tests for Action Labels and 404 Exception Mapping."""

    def test_release_action_label_is_network_restore(self, test_config):
        """Engine release must return action='NETWORK_RESTORE', not 'NETWORK_ISOLATION'."""
        engine = ContainmentEngine(test_config)
        engine.quarantine("order-service", "autotrace-mesh")

        rel = engine.release("order-service", "autotrace-mesh")
        assert rel.success is True
        assert rel.action == "NETWORK_RESTORE"

    def test_release_missing_container_raises_container_not_found(self, test_config):
        """Simulating missing container on release raises ContainerNotFoundError."""
        test_config.dry_run = False
        engine = ContainmentEngine(test_config)
        with engine._lock:
            engine._quarantined.add("order-service")

        mock_client = MagicMock()
        mock_client.networks.get.return_value = MagicMock()
        mock_client.containers.get.side_effect = Exception("404 Container not found")

        with patch.object(engine, "_get_docker_client", return_value=mock_client):
            with pytest.raises(ContainerNotFoundError):
                engine.release("order-service", "autotrace-mesh")

    def test_release_missing_network_raises_network_not_found(self, test_config):
        """Simulating missing network on release raises NetworkNotFoundError."""
        test_config.dry_run = False
        engine = ContainmentEngine(test_config)
        with engine._lock:
            engine._quarantined.add("order-service")

        mock_client = MagicMock()
        mock_client.networks.get.side_effect = Exception("404 Network not found")

        with patch.object(engine, "_get_docker_client", return_value=mock_client):
            with pytest.raises(NetworkNotFoundError):
                engine.release("order-service", "autotrace-mesh")


class TestAuditLoggingAndStateReconciliation:
    """Regression tests for audit logging emission and state reconciliation."""

    def test_audit_event_logging_structure(self, caplog):
        """Verify structured JSON audit log emission."""
        import logging
        import json

        with caplog.at_level(logging.INFO, logger="actuator-security.audit"):
            log_audit_event(
                action="QUARANTINE_SUCCESS",
                status="CONTAINED",
                caller="test-key",
                client_ip="127.0.0.1",
                culprit_service="reviews-service",
                container_id="reviews-service",
                target_service="payment-vault",
                execution_time_ms=42.5,
                detail="UnitTest containment",
            )

        assert len(caplog.records) >= 1
        record = caplog.records[-1]
        data = json.loads(record.message)
        assert data["event_type"] == "SECURITY_AUDIT"
        assert data["action"] == "QUARANTINE_SUCCESS"
        assert data["status"] == "CONTAINED"
        assert data["culprit_service"] == "reviews-service"
        assert data["execution_time_ms"] == 42.5

    def test_state_reconciliation_offline(self, test_config):
        """Offline or dry-run state reconciliation gracefully returns status dict."""
        engine = ContainmentEngine(test_config)
        res = engine.reconcile_state()
        assert res["status"] == "SKIPPED"
        assert "quarantined" in res
