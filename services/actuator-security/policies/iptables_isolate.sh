#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: In-Container iptables Isolation Policy (Mechanism B)
#
# Enforces egress packet drop rules directly within the compromised container's
# network namespace, blocking unauthorized lateral traversal.
#
# Usage:
#   ./iptables_isolate.sh isolate <container_name> <target_service_or_ip>
#   ./iptables_isolate.sh restore <container_name> <target_service_or_ip>
#   ./iptables_isolate.sh status <container_name>
# ==============================================================================

set -euo pipefail

ACTION="${1:-status}"
CONTAINER="${2:-reviews-service}"
TARGET="${3:-payment-vault}"

ALLOWED_CONTAINERS="reviews-service order-service gateway-service"
ALLOWED_TARGETS="payment-vault order-service gateway-service"

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

echo "========================================================================"
echo " 🛡️ AutoTrace-Sec: iptables Network Containment Policy"
echo " Action    : ${ACTION}"
echo " Container : ${CONTAINER}"
echo " Target    : ${TARGET}"
echo "========================================================================"

if ! is_allowed "${CONTAINER}" "${ALLOWED_CONTAINERS}"; then
  echo -e "\033[31m[ERROR] Container '${CONTAINER}' is not in the allowed quarantine list.\033[0m"
  echo "Allowed: ${ALLOWED_CONTAINERS}"
  exit 1
fi

# Check Docker availability
if ! command -v docker >/dev/null 2>&1; then
  echo -e "\033[33m[ERROR] Docker CLI not found. This script requires Docker to execute inside container.\033[0m"
  exit 2
fi

case "${ACTION}" in
  isolate)
    if ! is_allowed "${TARGET}" "${ALLOWED_TARGETS}"; then
      echo -e "\033[31m[ERROR] Target '${TARGET}' is not in the allowed targets list.\033[0m"
      exit 1
    fi

    echo "[*] Injecting egress DROP rule in container '${CONTAINER}' targeting '${TARGET}'..."
    START_TIME=$(date +%s%N 2>/dev/null || date +%s)

    # Inject rule via docker exec with CAP_NET_ADMIN
    docker exec --user root "${CONTAINER}" iptables -I OUTPUT -d "${TARGET}" -j DROP 2>/dev/null || {
      # Fallback: resolve all hostnames/IPs inside container then drop each IP
      TARGET_IPS=$(docker exec "${CONTAINER}" getent hosts "${TARGET}" 2>/dev/null | awk '{ print $1 }' | sort -u || echo "")
      if [ -n "${TARGET_IPS}" ]; then
        for ip in ${TARGET_IPS}; do
          echo "[*] Adding DROP rule for IP: ${ip}"
          docker exec --user root "${CONTAINER}" iptables -I OUTPUT -d "${ip}" -j DROP
        done
      else
        echo -e "\033[31m[ERROR] Failed to inject iptables rule in '${CONTAINER}'.\033[0m"
        echo "Prerequisites: Container must have 'CAP_NET_ADMIN' capability. If unavailable, use Mechanism A (Docker network disconnect)."
        exit 1
      fi
    }

    END_TIME=$(date +%s%N 2>/dev/null || date +%s)
    echo -e "\033[32m[✓] iptables isolation applied successfully.\033[0m"
    ;;

  restore)
    echo "[*] Removing egress DROP rules in container '${CONTAINER}' targeting '${TARGET}'..."
    # Attempt removal by name until none remain
    while docker exec --user root "${CONTAINER}" iptables -D OUTPUT -d "${TARGET}" -j DROP 2>/dev/null; do :; done
    # Attempt removal by all resolved IPs
    TARGET_IPS=$(docker exec "${CONTAINER}" getent hosts "${TARGET}" 2>/dev/null | awk '{ print $1 }' | sort -u || echo "")
    if [ -n "${TARGET_IPS}" ]; then
      for ip in ${TARGET_IPS}; do
        while docker exec --user root "${CONTAINER}" iptables -D OUTPUT -d "${ip}" -j DROP 2>/dev/null; do :; done
      done
    fi
    echo -e "\033[32m[✓] iptables rule removed (traffic restored).\033[0m"
    ;;

  status)
    echo "[*] Current iptables OUTPUT rules in '${CONTAINER}':"
    docker exec --user root "${CONTAINER}" iptables -L OUTPUT -v -n 2>/dev/null || {
      echo "[!] Unable to inspect iptables rules in '${CONTAINER}'."
      exit 1
    }
    ;;

  *)
    echo "Usage: $0 {isolate|restore|status} <container_name> [target_service]"
    exit 1
    ;;
esac
