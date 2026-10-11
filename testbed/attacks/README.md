# AutoTrace-Sec — Lateral Movement Attack Demonstration

This directory contains the lateral movement attack simulation scripts owned by Member 4 (Cybersecurity & Containment Engineer).

## Attack Scenario

In a zero-trust e-commerce microservice topology:
- **Normal Flow:** `gateway-service:5000` → `order-service:5001` → `payment-vault:5003`
- **Isolated Node:** `reviews-service:5002` (handles public user reviews; has **zero legitimate need** to communicate directly with `payment-vault:5003`).

### Threat Vector
An attacker exploits a vulnerability (e.g. Server-Side Request Forgery or remote command injection) in `reviews-service:5002` and attempts an unauthorized egress call to `http://payment-vault:5003/process`.

## Demonstration Workflow (`trigger_lateral_exploit.sh`)

[trigger_lateral_exploit.sh](file:///c:/Cyber%20Project/testbed/attacks/trigger_lateral_exploit.sh) executes a 4-step verification sequence:

```text
1. Pre-flight Check       -> Verifies reviews-service (5002), payment-vault (5003), and actuator (8081) are online
2. Pre-containment Call   -> POST /exploit/lateral -> reaches payment-vault:5003 (HTTP 200)
3. Autonomous Containment -> POST http://localhost:8081/api/v1/quarantine (disconnects reviews-service)
4. Post-containment Retry -> POST /exploit/lateral -> connection severed (HTTP 502 / 504 / Connection Refused)
```

## Running the Demonstration

### Prerequisites
1. Testbed cluster running:
   ```bash
   docker compose -f infra/docker-compose.testbed.yml up -d
   ```
2. Security Actuator daemon running:
   ```bash
   cd services/actuator-security
   python -m src.main
   ```

### Execution
```bash
./trigger_lateral_exploit.sh
```

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `REVIEWS_URL` | `http://localhost:5002/exploit/lateral` | Exploit hook on reviews-service |
| `VAULT_TARGET` | `http://payment-vault:5003/process` | Protected payment vault endpoint |
| `ACTUATOR_URL` | `http://localhost:8081/api/v1/quarantine` | Security Actuator quarantine endpoint |
| `ACTUATOR_API_KEY` | `""` | Optional API key if authentication is configured |

### Output Verdicts
- **`[✓] DEMONSTRATION PASSED` (Exit 0):** Pre-containment succeeded (200), post-containment was blocked (502/504).
- **`[!] DEMONSTRATION FAILED` (Exit 1):** Post-containment still succeeded (200) or actuator rejected order.
- **`[INCONCLUSIVE]` (Exit 2):** Prerequisite services offline or pre-containment request failed.
