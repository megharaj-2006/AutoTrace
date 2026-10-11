#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: Cascading Latency Injection (Chaos Simulation)
#
# Injects high compute delay to simulate leaf node exhaustion and cascading latency
# for Member 3's Root Cause Analysis (GAT RCA) engine.
#
# Usage:
#   ./inject_latency.sh [TARGET_URL] [DELAY_MS]
# Example:
#   ./inject_latency.sh http://localhost:5000/process 3000
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-http://localhost:5000/process}"
DELAY_MS="${2:-3000}"
MAX_DELAY_MS=10000

echo "========================================================================"
echo " ⚡ AutoTrace-Sec: Cascading Latency Injection (Chaos Experiment)"
echo " Ingress Target  : ${TARGET_URL}"
echo " Injected Delay  : ${DELAY_MS}ms (bounded max: ${MAX_DELAY_MS}ms)"
echo " Simulation Goal : Test cascading slowdown across call graph"
echo "                   gateway-service -> order-service -> payment-vault"
echo "========================================================================"

# Validate parameters
if ! [[ "${DELAY_MS}" =~ ^[0-9]+$ ]] || [ "${DELAY_MS}" -le 0 ] || [ "${DELAY_MS}" -gt "${MAX_DELAY_MS}" ]; then
  echo -e "\033[31m[ERROR] DELAY_MS must be an integer between 1 and ${MAX_DELAY_MS} milliseconds.\033[0m"
  exit 1
fi

# Pre-requisite check
if ! curl -s -f -m 3 "http://localhost:5000/health" >/dev/null 2>&1; then
  echo -e "\033[33m[INCONCLUSIVE] Ingress target service is not reachable.\033[0m"
  echo "Prerequisite: Start the testbed cluster: docker compose -f infra/docker-compose.testbed.yml up -d"
  exit 2
fi

echo -e "\n[*] Sending latency injection request..."
TEMP_RESPONSE_FILE=$(mktemp)

RESPONSE_META=$(curl -s -w "%{http_code} %{time_total}" -o "${TEMP_RESPONSE_FILE}" "${TARGET_URL}?delay=${DELAY_MS}") || {
  echo -e "\033[31m[ERROR] curl request failed.\033[0m"
  rm -f "${TEMP_RESPONSE_FILE}"
  exit 1
}

HTTP_CODE=$(echo "${RESPONSE_META}" | awk '{print $1}')
TIME_SEC=$(echo "${RESPONSE_META}" | awk '{print $2}')
ELAPSED_MS=$(awk "BEGIN {printf \"%.1f\", ${TIME_SEC} * 1000}")

BODY=$(cat "${TEMP_RESPONSE_FILE}")
rm -f "${TEMP_RESPONSE_FILE}"

echo -e "HTTP Status Code : ${HTTP_CODE}"
echo "Total Wall Time  : ${ELAPSED_MS}ms"
echo -e "\nResponse Payload:"

if command -v jq >/dev/null 2>&1; then
  echo "${BODY}" | jq .
elif command -v python3 >/dev/null 2>&1; then
  echo "${BODY}" | python3 -m json.tool 2>/dev/null || echo "${BODY}"
else
  echo "${BODY}"
fi

echo -e "\n------------------------------------------------------------------------"
if [ "${HTTP_CODE}" = "200" ]; then
  echo -e "\033[32m[✓] LATENCY INJECTION COMPLETED SUCCESSFULLY\033[0m"
  echo "    Cascading delay (${DELAY_MS}ms) propagated through downstream dependency chain."
  echo "    Expected Behavior: Member 3's GAT RCA (/rca) model should isolate"
  echo "    the root cause node based on anomalous latency attribution."
  exit 0
elif [ "${HTTP_CODE}" = "500" ]; then
  echo -e "\033[31m[!] CASCADING FAILURE INDUCED (HTTP 500)\033[0m"
  echo "    Downstream timeout exceeded (5000ms threshold reached in axios client)."
  exit 0
else
  echo -e "\033[33m[?] Unexpected status: ${HTTP_CODE}\033[0m"
  exit 1
fi
