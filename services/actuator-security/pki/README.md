# AutoTrace-Sec — Zero-Trust PKI & SPIFFE/SPIRE Revocation Hooks

This directory contains identity and PKI revocation hooks for Member 4's zero-trust containment workflow.

## Overview

In microservice meshes secured with mutual TLS (mTLS), services establish cryptographic identities via SPIFFE IDs (e.g. `spiffe://autotrace.local/ns/default/sa/reviews-service`).

When an anomalous edge is flagged by Member 3 (ML Detector) and Member 2 (Graph Engine) orders a quarantine:
1. **Network containment** severs the container's virtual bridge connection (`autotrace-mesh`).
2. **PKI revocation hook** revokes the workload's SPIFFE SVID in SPIRE, preventing any active TLS handshakes or credential re-issuance even if network connectivity were restored prematurely.

## Modules
- [spiffe_revocation.py](file:///c:/Cyber%20Project/services/actuator-security/pki/spiffe_revocation.py): SPIFFE/SPIRE hook class with simulated/audit mode fallback when SPIRE server socket is not present in development.
