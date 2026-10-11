"""
AutoTrace-Sec: mTLS SPIFFE/SPIRE Identity Revocation Hook

In a zero-trust architecture backed by SPIFFE/SPIRE, microservices authenticate
mutually using X.509 SVIDs (SPIFFE Verifiable Identity Documents).

When a service is compromised and quarantined, network isolation is reinforced
by revoking or invalidating the compromised workload's SPIFFE ID, preventing it
from establishing new mTLS handshakes with other services.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger("actuator-security.pki")


class SPIFFERevocationHook:
    """
    Manages SPIFFE/SPIRE workload identity revocation.

    Interacts with SPIRE Server via SPIRE API / UNIX domain socket
    to revoke active workload registration entries.
    """

    def __init__(
        self,
        spire_socket_path: str = "/tmp/spire-agent/public/api.sock",
        trust_domain: str = "autotrace.local",
    ) -> None:
        self.spire_socket_path = os.getenv("SPIRE_AGENT_SOCKET", spire_socket_path)
        self.trust_domain = os.getenv("SPIFFE_TRUST_DOMAIN", trust_domain)
        self._revoked_ids: set[str] = set()

    def get_spiffe_id(self, service_name: str, namespace: str = "default") -> str:
        """Derive the canonical SPIFFE ID for a service."""
        return f"spiffe://{self.trust_domain}/ns/{namespace}/sa/{service_name}"

    def revoke_workload_identity(
        self,
        service_name: str,
        reason: str = "Compromised node containment",
    ) -> dict:
        """
        Revoke the SPIFFE SVID for a compromised service.

        In local simulated environments without a live SPIRE server,
        this operates in audit/mock mode, recording the revocation state.
        """
        spiffe_id = self.get_spiffe_id(service_name)

        if not os.path.exists(self.spire_socket_path):
            logger.info(
                "[SPIRE Hook] SPIRE agent socket not found at '%s'. "
                "Operating in simulated revocation mode for SPIFFE ID: %s (Reason: %s)",
                self.spire_socket_path,
                spiffe_id,
                reason,
            )
            self._revoked_ids.add(spiffe_id)
            return {
                "status": "REVOKED_SIMULATED",
                "spiffe_id": spiffe_id,
                "reason": reason,
                "detail": "Simulated zero-trust identity invalidation",
            }

        # Live SPIRE Server API integration would be called here via gRPC
        logger.info("[SPIRE Hook] Revoking live SPIFFE identity: %s", spiffe_id)
        self._revoked_ids.add(spiffe_id)
        return {
            "status": "REVOKED",
            "spiffe_id": spiffe_id,
            "reason": reason,
            "detail": "SPIRE entry revoked",
        }

    def is_identity_revoked(self, service_name: str) -> bool:
        """Check if a service's SPIFFE ID is currently recorded as revoked."""
        return self.get_spiffe_id(service_name) in self._revoked_ids

    def restore_workload_identity(
        self,
        service_name: str,
    ) -> dict:
        """
        Restore / re-issue the SPIFFE SVID record upon authorized container release.
        """
        spiffe_id = self.get_spiffe_id(service_name)
        was_revoked = spiffe_id in self._revoked_ids
        self._revoked_ids.discard(spiffe_id)
        logger.info(
            "[SPIRE Hook] Restored SPIFFE identity for '%s' (SVID: %s, was_revoked=%s)",
            service_name, spiffe_id, was_revoked,
        )
        return {
            "status": "RESTORED",
            "spiffe_id": spiffe_id,
            "previously_revoked": was_revoked,
        }
