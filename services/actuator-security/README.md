# AutoTrace-Sec — Security Actuator & Containment Daemon

> **Role Ownership:** Member 4 — Cybersecurity & Containment Engineer<br>
> **Service Port:** `8081` (Frozen Port Allocation)<br>
> **Target Network:** `autotrace-mesh`<br>
> **Containment Latency Target:** `< 2000ms` (< 2 seconds)

---

## 1. Overview & Architectural Role

The **Security Actuator** (`services/actuator-security/`) is the autonomous response component of the AutoTrace-Sec distributed security platform. When an anomalous or unauthorized communication path is detected by Member 3 (ML Detector) and dispatched by Member 2 (Graph Engine), the Security Actuator executes deterministic, verified network containment on the affected container within two seconds.

```text
[Telemetry Stream] ──► [Graph Engine (8080)] ──► [ML Detector (8000)]
                              │ (Anomalous Threat Flagged)
                              ▼
                 [Security Actuator (8081)]  POST /api/v1/quarantine
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   Mechanism A (Primary)           Mechanism B / C (Policies)
   Docker Network Disconnect       iptables / eBPF socket drop
   (`autotrace-mesh`)              (In-container / cgroup egress)
```

---

## 2. Directory Structure

```text
services/actuator-security/
├── Dockerfile                  # Container image definition (Python 3.11-slim)
├── requirements.txt            # Python dependencies (FastAPI, uvicorn, pydantic, docker, pytest)
├── pytest.ini                  # Pytest configuration
├── README.md                   # This specification document
├── src/
│   ├── __init__.py
│   ├── app.py                  # FastAPI application with endpoints & auth
│   ├── config.py               # Environment configuration & validation
│   ├── containment.py          # Docker network isolation engine (SDK, no shell)
│   ├── main.py                 # Service entry point (uvicorn runner)
│   └── models.py               # Pydantic schemas, validation & injection checks
├── policies/
│   ├── README.md               # Containment mechanisms guide
│   ├── iptables_isolate.sh     # Mechanism B: In-container egress DROP rule
│   └── socket_drop.bpf.c       # Mechanism C: eBPF cgroup egress filter
├── pki/
│   ├── README.md               # Zero-trust PKI & SPIFFE/SPIRE documentation
│   └── spiffe_revocation.py    # Workload identity revocation hook
└── tests/
    ├── __init__.py
    ├── test_api.py             # 14 API, auth, validation & lifecycle tests
    ├── test_attack_simulation.py # 7 lateral exploit decision tests
    ├── test_chaos.py           # 6 chaos safety & boundary tests
    ├── test_containment.py     # 10 ContainmentEngine mock & live tests
    └── test_pki.py             # 3 SPIFFE revocation hook tests
```

---

## 3. API Specification

### Base URL: `http://localhost:8081`

### 3.1 Liveness Probe: `GET /health`
Returns system health, dry-run mode status, and Docker daemon availability.

**Response (HTTP 200):**
```json
{
  "status": "HEALTHY",
  "service": "actuator-security",
  "version": "0.1.0",
  "dry_run": true,
  "docker_available": false
}
```

### 3.2 Readiness Probe: `GET /ready`
Returns HTTP 200 if ready to perform containment; returns HTTP 503 if non-dry-run mode is active and Docker daemon is unreachable.

### 3.3 Autonomous Quarantine: `POST /api/v1/quarantine`
Executes verified network isolation on the culprit service.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: <token>` *(Required when `ACTUATOR_DRY_RUN=false` and `ACTUATOR_API_KEY` is set)*

**Request Payload:**
```json
{
  "culprit_service": "reviews-service",
  "container_id": "reviews-service",
  "target_service": "payment-vault",
  "reason": "Unauthorized lateral movement"
}
```

**Success Response (HTTP 200):**
```json
{
  "status": "CONTAINED",
  "action_taken": "NETWORK_ISOLATION",
  "execution_time_ms": 38.45,
  "culprit_service": "reviews-service",
  "container_id": "reviews-service",
  "target_service": "payment-vault",
  "reason": "Unauthorized lateral movement",
  "detail": "Container 'reviews-service' disconnected from 'autotrace-mesh'",
  "docker_network": "autotrace-mesh"
}
```

**Duplicate Request Response (HTTP 200 — Idempotent):**
```json
{
  "status": "ALREADY_CONTAINED",
  "action_taken": "NETWORK_ISOLATION",
  "execution_time_ms": 0.12,
  "detail": "Container 'reviews-service' was already quarantined"
}
```

**Error Responses:**
- `400 Bad Request`: Culprit or target not in allowlist.
- `401 Unauthorized`: Missing `X-API-Key` header.
- `403 Forbidden`: Invalid API key OR attempt to quarantine protected infrastructure (e.g. `redis`, `redpanda`, `actuator-security`).
- `404 Not Found`: Container or Docker network not found.
- `422 Unprocessable Entity`: Request fails injection prevention pattern (alphanumeric, dots, dashes only).
- `503 Service Unavailable`: Docker daemon unreachable when dry-run is disabled.

### 3.4 Service Release / Recovery: `POST /api/v1/release`
Explicit, authenticated operation to reconnect a previously quarantined container.

**Request Payload:**
```json
{
  "container_id": "reviews-service",
  "network_name": "autotrace-mesh"
}
```

### 3.5 Quarantine Status: `GET /api/v1/quarantine/status`
Lists currently quarantined services and count.

---

## 4. Configuration & Environment Variables

All settings use safe defaults:

| Variable | Default | Purpose |
|---|---|---|
| `ACTUATOR_SECURITY_PORT` | `8081` | Service listen port (frozen) |
| `ACTUATOR_HOST` | `0.0.0.0` | Bind host address |
| `ACTUATOR_DRY_RUN` | `true` | When true, logs containment without executing Docker calls |
| `ACTUATOR_API_KEY` | `""` | API key required when dry-run is false |
| `ACTUATOR_DOCKER_NETWORK` | `autotrace-mesh` | Target virtual bridge network |
| `ACTUATOR_ALLOWED_CULPRITS` | `reviews-service,order-service,gateway-service` | Strict allowlist of quarantinable services |
| `ACTUATOR_ALLOWED_TARGETS` | `payment-vault,order-service,gateway-service` | Strict allowlist of valid target services |
| `ACTUATOR_PROTECTED_SERVICES` | `redpanda,redis,telemetry-collector,graph-engine,ml-detector,actuator-security,web-dashboard` | Critical infrastructure protected from quarantine |
| `ACTUATOR_CONTAINMENT_TARGET_MS` | `2000` | Containment latency benchmark (2 seconds) |

---

## 5. Security Architecture & Hardening

1. **No Subprocess Shell Execution:** Containment uses the official Python Docker SDK (`docker.from_env()`). No `shell=True` or raw shell strings are executed, eliminating command injection vulnerabilities.
2. **Regex Input Sanitization:** Container and service names are strictly validated against `^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$`, rejecting semicolon chaining, backticks, and subshells.
3. **Allowlist Scoping:** Only explicitly allowlisted testbed containers may be quarantined.
4. **Infrastructure Protection:** Hard-coded deny-list prevents accidental or malicious isolation of pipeline infrastructure.
5. **Constant-Time Authentication:** API keys are compared using `secrets.compare_digest` to prevent timing side-channel attacks.
6. **No Secret Logging:** Tokens, keys, and authorization headers are never written to logs.
7. **Idempotency & Concurrency:** Thread-safe lock protects quarantine state tracking under concurrent requests.

---

## 6. Running and Testing Locally

### 6.1 Installation
```bash
cd services/actuator-security
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 6.2 Running the Unit Test Suite
```bash
# Run all 40 automated tests
pytest tests/ -v
```
**Observed Test Results:**
- 40 tests passed in 1.03s (100% pass rate).
- Tests run completely independently without requiring Docker daemon, graph engine, ML detector, or frontend.

### 6.3 Starting the Actuator Daemon
```bash
# Development mode (Dry-run enabled by default)
python -m src.main
```

---

## 7. Lateral Movement Attack & Containment Verification

- **Script:** [testbed/attacks/trigger_lateral_exploit.sh](file:///c:/Cyber%20Project/testbed/attacks/trigger_lateral_exploit.sh)
- **Scenario:** `reviews-service:5002` attempts unauthorized request to `payment-vault:5003/process`.
- **Workflow:**
  1. Verifies testbed and actuator health.
  2. Baseline exploit succeeds (HTTP 200).
  3. Dispatches quarantine request to Security Actuator (8081).
  4. Retries exploit — verifies request fails (HTTP 502/504/timeout).
  5. Outputs clear `[✓] DEMONSTRATION PASSED`.

---

## 8. Chaos Engineering Scenarios

Located in `testbed/chaos/`:
1. [inject_latency.sh](file:///c:/Cyber%20Project/testbed/chaos/inject_latency.sh): Injects bounded computation delay (1–10,000ms) down the call chain (`gateway` → `order` → `vault`).
2. [inject_packet_drop.sh](file:///c:/Cyber%20Project/testbed/chaos/inject_packet_drop.sh): Injects iptables egress DROP rules in a container with automatic timeout rollback.
3. [simulate_downstream_failure.sh](file:///c:/Cyber%20Project/testbed/chaos/simulate_downstream_failure.sh): Simulates leaf-node exhaustion triggering HTTP 500/504 cascades for Member 3's GAT RCA.

---

## 9. Future Integration Roadmap

When other members complete their modules:
1. **Member 2 (Graph Engine):** Dispatches HTTP POST `/api/v1/quarantine` upon receiving an anomaly confidence score > 0.90 from Member 3.
2. **Member 3 (ML Detector):** Flags rogue edge `reviews-service -> payment-vault` with `is_anomalous: true`.
3. **Frontend Dashboard (`apps/web-dashboard/`):**
   - **Quarantine Status Banner:** Displays live quarantined containers polled from `GET /api/v1/quarantine/status` or streamed via WebSocket.
   - **Containment Event Log:** Visual timeline of isolated services and execution times (`execution_time_ms`).
   - **Attack Trigger Panel:** Buttons to trigger `trigger_lateral_exploit.sh` and chaos scripts from the dashboard.
