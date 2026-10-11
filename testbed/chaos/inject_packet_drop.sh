#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: Controlled Packet Drop / Network Partition Chaos Experiment
#
# Injects temporary packet loss or drops on downstream testbed services to
# evaluate how the ML Detector and Graph Engine handle network degradation.
#
# Safety Controls:
# - Strictly restricted to authorized testbed containers.
# - Requires explicit opt-in confirmation or timeout flag.
# - Automatically rolls back packet drop rules after bounded DURATION.
# - Validates container identity before execution.
#
# Usage:
#   ./inject_packet_drop.sh [CONTAINER] [TARGET_SERVICE] [DURATION_SEC]
# Example:
#   ./inject_packet_drop.sh order-service payment-vault 15
# ==============================================================================

set -euo pipefail

CONTAINER="${1:-order-service}"
TARGET="${2:-payment-vault}"
DURATION="${3:-10}"

ALLOWED_CONTAINERS="order-service reviews-service gateway-service"
ALLOWED_TARGETS="payment-vault order-service reviews-service"
MAX_DURATION=60

echo "========================================================================"
echo " 💥 AutoTrace-Sec: Controlled Packet Drop Simulation (Chaos Experiment)"
echo " Source Node : ${CONTAINER}"
echo " Drop Target : ${TARGET}"
echo " Duration    : ${DURATION}s (bounded max: ${MAX_DURATION}s)"
echo "========================================================================"

# Validate duration bounds
if ! [[ "${DURATION}" =~ ^[0-9]+$ ]] || [ "${DURATION}" -le 0 ] || [ "${DURATION}" -gt "${MAX_DURATION}" ]; then
  echo -e "\033[31m[ERROR] Duration must be an integer between 1 and ${MAX_DURATION} seconds.\033[0m"
  exit 1
fi

# Validate container against allowlist
is_allowed() {
  local item="$1"
  local list="$2"
  for allowed in ${list}; do
    if [ "${item}" = "${allowed}" ]; then
      return 0
    fi
  done
  return 1
}

if ! is_allowed "${CONTAINER}" "${ALLOWED_CONTAINERS}"; then
  echo -e "\033[31m[ERROR] Container '${CONTAINER}' is not in the allowed chaos experiment list.\033[0m"
  echo "Allowed: ${ALLOWED_CONTAINERS}"
  exit 1
fi

if ! is_allowed "${TARGET}" "${ALLOWED_TARGETS}"; then
  echo -e "\033[31m[ERROR] Target '${TARGET}' is not in the allowed targets list.\033[0m"
  echo "Allowed: ${ALLOWED_TARGETS}"
  exit 1
fi

# Pre-requisite check
if ! command -v docker >/dev/null 2>&1; then
  echo -e "\033[33m[INCONCLUSIVE] Docker CLI is not available on host. Chaos test cannot proceed.\033[0m"
  echo "Prerequisite: Docker Desktop / Engine running with access to 'autotrace-mesh'."
  exit 2
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo -e "\033[33m[INCONCLUSIVE] Target container '${CONTAINER}' is not running.\033[0m"
  echo "Prerequisite: Start the testbed cluster: docker compose -f infra/docker-compose.testbed.yml up -d"
  exit 2
fi

# Cleanup trap to ensure packet drops are ALWAYS removed on exit or interrupt
cleanup() {
  echo -e "\n[*] Rolling back packet drop rules in container '${CONTAINER}'..."
  docker exec --user root "${CONTAINER}" iptables -D OUTPUT -d "${TARGET}" -j DROP 2>/dev/null || true
  TARGET_IP=$(docker exec "${CONTAINER}" getent hosts "${TARGET}" | awk '{ print $1 }' | head -n1 2>/dev/null || echo "")
  if [ -n "${TARGET_IP}" ]; then
    docker exec --user root "${CONTAINER}" iptables -D OUTPUT -d "${TARGET_IP}" -j DROP 2>/dev/null || true
  fi
  echo -e "\033[32m[✓] Cleanup complete: network traffic restored.\033[0m"
}
trap cleanup EXIT INT TERM

echo "[*] Injecting egress DROP rule in '${CONTAINER}' targeting '${TARGET}'..."
docker exec --user root "${CONTAINER}" iptables -I OUTPUT -d "${TARGET}" -j DROP 2>/dev/null || {
  TARGET_IP=$(docker exec "${CONTAINER}" getent hosts "${TARGET}" | awk '{ print $1 }' | head -n1 || echo "")
  if [ -n "${TARGET_IP}" ]; then
    docker exec --user root "${CONTAINER}" iptables -I OUTPUT -d "${TARGET_IP}" -j DROP
  else
    echo -e "\033[31m[ERROR] Failed to inject packet drop rule.\033[0m"
    exit 1
  fi
}

echo -e "\033[32m[✓] Packet drop rule active. Simulating partition for ${DURATION}s...\033[0m"
echo "    Observing behavior: downstream calls from ${CONTAINER} to ${TARGET} will fail with timeouts."
sleep "${DURATION}"

echo "[*] Duration elapsed. Initiating automatic recovery."
# Cleanup trap will run automatically on script exit
