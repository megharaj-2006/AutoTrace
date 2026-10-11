# AutoTrace-Sec — Chaos Engineering & Failure Injection

This directory contains chaos-testing and fault-injection scripts owned by Member 4 (Cybersecurity & Containment Engineer).

## Overview

Chaos experiments simulate real-world service degradation and network anomalies to evaluate:
1. Telemetry capture accuracy (Member 1).
2. Live dependency graph state latency attribution (Member 2).
3. Root-cause analysis (GAT RCA) and anomaly detection (Member 3).
4. Autonomous containment triggering (Member 4).

## Chaos Scripts

### 1. Cascading Latency Injection (`inject_latency.sh`)
- **File:** [inject_latency.sh](file:///c:/Cyber%20Project/testbed/chaos/inject_latency.sh)
- **Goal:** Injects artificial computation delay (`delay` query param) propagating down the dependency chain: `gateway-service (5000)` → `order-service (5001)` → `payment-vault (5003)`.
- **Usage:**
  ```bash
  ./inject_latency.sh http://localhost:5000/process 2500
  ```
- **Bounds:** Delay bounded between 1ms and 10,000ms.

### 2. Packet Drop / Network Partition (`inject_packet_drop.sh`)
- **File:** [inject_packet_drop.sh](file:///c:/Cyber%20Project/testbed/chaos/inject_packet_drop.sh)
- **Goal:** Injects temporary iptables drop rules within a container's network namespace to simulate network partitions.
- **Safety:** Automatic rollback trap on exit, bounded duration (max 60 seconds), strictly restricted to allowlisted testbed containers.
- **Usage:**
  ```bash
  ./inject_packet_drop.sh order-service payment-vault 15
  ```

### 3. Cascading Downstream Failure (`simulate_downstream_failure.sh`)
- **File:** [simulate_downstream_failure.sh](file:///c:/Cyber%20Project/testbed/chaos/simulate_downstream_failure.sh)
- **Goal:** Triggers downstream timeouts (>5000ms threshold) or rapid bursts to simulate leaf node exhaustion.
- **Usage:**
  ```bash
  ./simulate_downstream_failure.sh http://localhost:5000/process timeout 5
  ```

## Safety & Isolation Rules
- Experiments are **opt-in only** and never execute during standard unit test runs.
- Restricted strictly to the local Docker testbed on the `autotrace-mesh` network.
- Never modify host firewall tables or external network interfaces.
- Always include automatic rollback/cleanup routines.
