# AutoTrace-Sec — Network Containment Policies

This directory contains low-level network isolation policies and rules used by Member 4 (Cybersecurity & Containment Engineer) for autonomous threat containment.

## Containment Mechanisms

AutoTrace-Sec implements a multi-tier containment strategy designed to meet the strict sub-2-second (<2000ms) isolation target:

| Mechanism | Layer | Implementation | Speed | Scope |
|---|---|---|---|---|
| **Mechanism A (Primary)** | Docker Network | `docker network disconnect autotrace-mesh <container>` | ~15–50ms | Completely removes container from the virtual bridge network |
| **Mechanism B (Firewall)** | Linux Netfilter | `iptables -I OUTPUT -d <target_ip> -j DROP` | ~5–15ms | Blocks targeted egress packets inside the compromised container |
| **Mechanism C (Kernel)** | eBPF Socket Filter | eBPF `sock_ops` / cgroup egress packet drop | <1ms | Kernel-level instant packet severance without container rebuild |

---

## Mechanism Details

### Mechanism A: Docker Network Disconnection (Primary)
- **Engine:** Python Docker SDK (`docker.from_env()`) via `services/actuator-security/src/containment.py`
- **Action:** Calls Docker daemon endpoint `POST /networks/{id}/disconnect` with `force=True`.
- **Verification:** Queries container network inspection to confirm `autotrace-mesh` is severed.
- **Safety:** Scoped strictly to allowlisted testbed containers (`reviews-service`, `order-service`, `gateway-service`). Never disconnects core infrastructure (`redpanda`, `redis`, `telemetry-collector`, `graph-engine`, `ml-detector`, `actuator-security`).

### Mechanism B: In-Container iptables Packet Filter
- **Script:** [iptables_isolate.sh](file:///c:/Cyber%20Project/services/actuator-security/policies/iptables_isolate.sh)
- **Usage:** Injected into a container to block specific egress traffic:
  ```bash
  # Isolate egress to payment-vault
  ./iptables_isolate.sh isolate reviews-service payment-vault
  # Restore connectivity
  ./iptables_isolate.sh restore reviews-service payment-vault
  ```
- **Prerequisites:** Container requires `NET_ADMIN` capability.

### Mechanism C: eBPF Socket Filter
- **Source:** [socket_drop.bpf.c](file:///c:/Cyber%20Project/services/actuator-security/policies/socket_drop.bpf.c)
- **Usage:** Attached to container cgroup egress hook to drop packets destined for protected port (e.g. 5003).
- **Prerequisites:** Linux kernel 5.8+, `BPF` and `NET_ADMIN` capabilities, `clang` and `llvm` for compilation.
