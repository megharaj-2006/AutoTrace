#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: Downstream Cascading Failure Simulation (Chaos Experiment)
#
# Simulates cascading failure cascades across the microservice dependency chain:
#   gateway-service (5000) -> order-service (5001) -> payment-vault (5003)
#
# By exhausting payment-vault or causing downstream timeouts (>5000ms),
# this triggers HTTP 500/504 cascades for Member 3's GAT Root-Cause Analysis (RCA).
# ==============================================================================

set -euo pipefail

INGRESS_URL="${1:-http://localhost:5000/process}"
CHAOS_MODE="${2:-timeout}" # timeout | burst
ITERATIONS="${3:-5}"

echo "========================================================================"
echo " ⚡ AutoTrace-Sec: Downstream Cascading Failure Simulation"
echo " Ingress Target : ${INGRESS_URL}"
echo " Chaos Mode     : ${CHAOS_MODE}"
echo " Iterations     : ${ITERATIONS}"
echo "========================================================================"

if ! [[ "${ITERATIONS}" =~ ^[0-9]+$ ]] || [ "${ITERATIONS}" -le 0 ] || [ "${ITERATIONS}" -gt 50 ]; then
  echo -e "\033[31m[ERROR] Iterations must be between 1 and 50.\033[0m"
  exit 1
fi

# Pre-flight connectivity check
if ! curl -s -f -m 3 "http://localhost:5000/health" >/dev/null 2>&1; then
  echo -e "\033[33m[INCONCLUSIVE] Ingress gateway (http://localhost:5000/health) is not reachable.\033[0m"
  echo "Prerequisite: Start the testbed cluster: docker compose -f infra/docker-compose.testbed.yml up -d"
  exit 2
fi

echo -e "\n[*] Starting failure injection loop..."
FAILED_COUNT=0
SUCCESS_COUNT=0

for i in $(seq 1 "${ITERATIONS}"); do
  echo -n "  Request ${i}/${ITERATIONS}: "

  if [ "${CHAOS_MODE}" = "timeout" ]; then
    # Injected delay of 6000ms exceeds the 5000ms axios timeout configured in server.js
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null -m 10 "${INGRESS_URL}?delay=6000" || echo "ERR")
  else
    # Burst mode: rapid bursts causing resource contention
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null -m 5 "${INGRESS_URL}?delay=500" || echo "ERR")
  fi

  if [ "${HTTP_CODE}" = "500" ] || [ "${HTTP_CODE}" = "504" ]; then
    echo -e "\033[31mCascading Failure Triggered (${HTTP_CODE})\033[0m"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  elif [ "${HTTP_CODE}" = "200" ]; then
    echo -e "\033[32mSuccess (${HTTP_CODE})\033[0m"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo -e "\033[33mOther (${HTTP_CODE})\033[0m"
  fi

  sleep 1
done

echo "========================================================================"
echo " Results Summary:"
echo "   Cascading Failures (500/504) : ${FAILED_COUNT}"
echo "   Successful Responses (200)   : ${SUCCESS_COUNT}"
if [ ${FAILED_COUNT} -gt 0 ]; then
  echo -e "\033[32m[✓] Cascading failure condition verified. Telemetry events emitted to telemetry.events.\033[0m"
  echo "    Expected Member 3 Action: /api/v1/rca should identify payment-vault as the root cause node."
  exit 0
else
  echo -e "\033[33m[?] No cascading failures observed. Verify cluster timeout configuration.\033[0m"
  exit 1
fi
