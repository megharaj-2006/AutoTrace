"""
Unit tests for the SPIFFE/SPIRE identity revocation hook.
"""

from __future__ import annotations

import pytest

from pki.spiffe_revocation import SPIFFERevocationHook


class TestSPIFFERevocationHook:
    """Tests for zero-trust identity revocation logic."""

    def test_canonical_spiffe_id_generation(self):
        hook = SPIFFERevocationHook(trust_domain="autotrace.local")
        spiffe_id = hook.get_spiffe_id("reviews-service")
        assert spiffe_id == "spiffe://autotrace.local/ns/default/sa/reviews-service"

    def test_simulated_revocation_records_state(self):
        hook = SPIFFERevocationHook(spire_socket_path="/nonexistent/socket.sock")
        result = hook.revoke_workload_identity("reviews-service", reason="Rogue edge link detected")

        assert result["status"] == "REVOKED_SIMULATED"
        assert result["spiffe_id"] == "spiffe://autotrace.local/ns/default/sa/reviews-service"
        assert hook.is_identity_revoked("reviews-service") is True

    def test_unrevoked_service_returns_false(self):
        hook = SPIFFERevocationHook()
        assert hook.is_identity_revoked("order-service") is False
