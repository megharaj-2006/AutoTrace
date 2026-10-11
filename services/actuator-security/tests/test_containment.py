"""
Unit tests for the ContainmentEngine using mocked Docker SDK interactions.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.config import ActuatorConfig
from src.containment import (
    ContainmentEngine,
    ContainmentError,
    ContainerNotFoundError,
    DockerUnavailableError,
    NetworkNotFoundError,
    PermissionError as ContainmentPermissionError,
)


@pytest.fixture
def dry_run_engine():
    """Engine configured with dry-run=True."""
    cfg = ActuatorConfig()
    cfg.dry_run = True
    return ContainmentEngine(cfg)


@pytest.fixture
def live_engine():
    """Engine configured with dry-run=False."""
    cfg = ActuatorConfig()
    cfg.dry_run = False
    return ContainmentEngine(cfg)


class TestContainmentEngineDryRun:
    """Tests for safe dry-run mode."""

    def test_dry_run_quarantine_records_state(self, dry_run_engine: ContainmentEngine):
        result = dry_run_engine.quarantine("reviews-service", "autotrace-mesh")
        assert result.success is True
        assert result.action == "NETWORK_ISOLATION"
        assert result.execution_time_ms >= 0
        assert dry_run_engine.is_quarantined("reviews-service")

    def test_dry_run_duplicate_quarantine_is_idempotent(self, dry_run_engine: ContainmentEngine):
        res1 = dry_run_engine.quarantine("reviews-service", "autotrace-mesh")
        assert res1.already_contained is False

        res2 = dry_run_engine.quarantine("reviews-service", "autotrace-mesh")
        assert res2.already_contained is True
        assert res2.success is True

    def test_dry_run_release_clears_state(self, dry_run_engine: ContainmentEngine):
        dry_run_engine.quarantine("reviews-service", "autotrace-mesh")
        assert dry_run_engine.is_quarantined("reviews-service")

        res = dry_run_engine.release("reviews-service", "autotrace-mesh")
        assert res.success is True
        assert not dry_run_engine.is_quarantined("reviews-service")

    def test_release_unquarantined_returns_failure(self, dry_run_engine: ContainmentEngine):
        res = dry_run_engine.release("reviews-service", "autotrace-mesh")
        assert res.success is False
        assert "not currently quarantined" in res.detail


class TestContainmentEngineMockedDocker:
    """Tests for live mode containment logic with mocked Docker SDK."""

    def test_successful_docker_containment(self, live_engine: ContainmentEngine):
        mock_container = MagicMock()
        # Initial networks: connected to autotrace-mesh
        mock_container.attrs = {
            "NetworkSettings": {
                "Networks": {"autotrace-mesh": {}}
            }
        }

        mock_network = MagicMock()

        # When network.disconnect is called, simulate removal from NetworkSettings
        def mock_disconnect(c, force=True):
            mock_container.attrs = {"NetworkSettings": {"Networks": {}}}

        mock_network.disconnect.side_effect = mock_disconnect

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_client.networks.get.return_value = mock_network

        live_engine._docker_client = mock_client

        result = live_engine.quarantine("reviews-service", "autotrace-mesh")

        assert result.success is True
        assert result.action == "NETWORK_ISOLATION"
        assert result.execution_time_ms < 2000  # Latency target (< 2s)
        mock_network.disconnect.assert_called_once_with(mock_container, force=True)
        assert live_engine.is_quarantined("reviews-service")

    def test_container_not_found(self, live_engine: ContainmentEngine):
        mock_client = MagicMock()
        mock_client.containers.get.side_effect = Exception("404 Client Error: Not Found")
        live_engine._docker_client = mock_client

        with pytest.raises(ContainerNotFoundError):
            live_engine.quarantine("nonexistent-service", "autotrace-mesh")

    def test_network_not_found(self, live_engine: ContainmentEngine):
        mock_container = MagicMock()
        mock_container.attrs = {
            "NetworkSettings": {"Networks": {"missing-net": {}}}
        }
        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_client.networks.get.side_effect = Exception("404 Client Error: network not found")
        live_engine._docker_client = mock_client

        with pytest.raises(NetworkNotFoundError):
            live_engine.quarantine("reviews-service", "missing-net")

    def test_permission_denied(self, live_engine: ContainmentEngine):
        mock_container = MagicMock()
        mock_container.attrs = {
            "NetworkSettings": {"Networks": {"autotrace-mesh": {}}}
        }
        mock_network = MagicMock()
        mock_network.disconnect.side_effect = Exception("Permission denied to disconnect container")

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_client.networks.get.return_value = mock_network
        live_engine._docker_client = mock_client

        with pytest.raises(ContainmentPermissionError):
            live_engine.quarantine("reviews-service", "autotrace-mesh")

    def test_verification_failure_raises_containment_error(self, live_engine: ContainmentEngine):
        mock_container = MagicMock()
        # Container stays connected even after disconnect call
        mock_container.attrs = {
            "NetworkSettings": {"Networks": {"autotrace-mesh": {}}}
        }
        mock_network = MagicMock()

        mock_client = MagicMock()
        mock_client.containers.get.return_value = mock_container
        mock_client.networks.get.return_value = mock_network
        live_engine._docker_client = mock_client

        with pytest.raises(ContainmentError, match="not verified"):
            live_engine.quarantine("reviews-service", "autotrace-mesh")

    def test_docker_unavailable_raises_docker_unavailable_error(self, live_engine: ContainmentEngine):
        with patch("docker.from_env", side_effect=Exception("Docker socket unreachable")):
            live_engine._docker_client = None
            with pytest.raises(DockerUnavailableError):
                live_engine.quarantine("reviews-service", "autotrace-mesh")
