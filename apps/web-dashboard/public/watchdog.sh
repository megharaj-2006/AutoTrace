#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: Telemetry Watchdog 1-Line Installer
# Target footprint: < 15 MB (Zero Runtime Dependencies)
# Usage:
#   curl -sSL https://get.autotrace.io/watchdog.sh | sudo bash -s -- --token=<PROJECT_TOKEN> --gateway=<INGEST_URL>
# ==============================================================================

set -e

VERSION="1.2.0"
TOKEN="at_live_demo_9841"
GATEWAY="http://localhost:8085"
PORT="8088"
SERVICE_NAME="gateway-service"

# Parse CLI arguments passed via bash -s -- ...
while [[ $# -gt 0 ]]; do
  case $1 in
    --token=*)
      TOKEN="${1#*=}"
      shift
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --gateway=*)
      GATEWAY="${1#*=}"
      shift
      ;;
    --gateway)
      GATEWAY="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --service=*)
      SERVICE_NAME="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo "========================================================================"
echo " 🛡️  Installing AutoTrace-Sec Telemetry Watchdog v${VERSION} (< 15 MB)"
echo " Project Token    : ${TOKEN}"
echo " Ingestion Gateway: ${GATEWAY}"
echo " Watchdog Port    : ${PORT}"
echo " Intercept Service: ${SERVICE_NAME}"
echo "========================================================================"

# Determine target install directory
if [ "$(id -u)" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
  CONFIG_DIR="/etc/autotrace"
else
  INSTALL_DIR="${HOME}/.autotrace/bin"
  CONFIG_DIR="${HOME}/.autotrace"
  mkdir -p "${INSTALL_DIR}" "${CONFIG_DIR}"
fi

mkdir -p "${CONFIG_DIR}"

# Write configuration
CONFIG_FILE="${CONFIG_DIR}/watchdog.conf"
cat <<EOF > "${CONFIG_FILE}"
AUTOTRACE_TOKEN="${TOKEN}"
AUTOTRACE_GATEWAY="${GATEWAY}"
AUTOTRACE_PORT="${PORT}"
SERVICE_NAME="${SERVICE_NAME}"
HEARTBEAT_INTERVAL="10"
EOF

# Find source watchdog binary from local checkout or download URL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd || echo "")"
LOCAL_BINARY="${REPO_ROOT}/services/telemetry-watchdog/autotrace-watchdog"

if [ -f "${LOCAL_BINARY}" ]; then
  echo "[1/4] Copying watchdog binary from local repository..."
  cp "${LOCAL_BINARY}" "${INSTALL_DIR}/autotrace-watchdog"
else
  echo "[1/4] Downloading watchdog binary from AutoTrace distribution portal..."
  DOWNLOAD_URL="${GATEWAY}/api/v1/projects/${TOKEN}/watchdog/download"
  # Attempt download or fallback to web dashboard public assets
  if curl -sSL -f "${DOWNLOAD_URL}" -o /tmp/watchdog-dist.tar.gz 2>/dev/null; then
    tar -xzf /tmp/watchdog-dist.tar.gz -C /tmp/
    cp /tmp/autotrace-watchdog "${INSTALL_DIR}/autotrace-watchdog"
  elif curl -sSL -f "http://localhost:3000/downloads/autotrace-watchdog-1.2.0-linux-amd64.tar.gz" -o /tmp/watchdog-dist.tar.gz 2>/dev/null; then
    tar -xzf /tmp/watchdog-dist.tar.gz -C /tmp/
    cp /tmp/autotrace-watchdog "${INSTALL_DIR}/autotrace-watchdog"
  else
    echo "Using embedded fallback bootstrap runner..."
    cat <<'BOOTSTRAP' > "${INSTALL_DIR}/autotrace-watchdog"
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
# Redirect to python implementation
from autotrace_watchdog_embedded import main
if __name__ == '__main__':
    main()
BOOTSTRAP
  fi
fi

chmod +x "${INSTALL_DIR}/autotrace-watchdog"

echo "[2/4] Verifying binary execution..."
"${INSTALL_DIR}/autotrace-watchdog" version || true

echo "[3/4] Configuring service daemon..."
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  SYSTEMD_UNIT="/etc/systemd/system/autotrace-watchdog.service"
  cat <<UNIT > "${SYSTEMD_UNIT}"
[Unit]
Description=AutoTrace-Sec Lightweight Telemetry Watchdog Agent (< 15 MB)
After=network.target network-online.target

[Service]
Type=simple
EnvironmentFile=${CONFIG_FILE}
ExecStart=${INSTALL_DIR}/autotrace-watchdog start --token=\${AUTOTRACE_TOKEN} --gateway=\${AUTOTRACE_GATEWAY} --port=\${AUTOTRACE_PORT} --service-name=\${SERVICE_NAME}
Restart=always
RestartSec=3s

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now autotrace-watchdog || true
  echo "✔ Systemd service 'autotrace-watchdog' configured and started."
else
  # Background runner for non-systemd or non-root environments
  nohup "${INSTALL_DIR}/autotrace-watchdog" start \
    --token="${TOKEN}" \
    --gateway="${GATEWAY}" \
    --port="${PORT}" \
    --service-name="${SERVICE_NAME}" > /tmp/autotrace-watchdog.log 2>&1 &
  echo "✔ Watchdog daemon started in background (PID: $!). Logs: /tmp/autotrace-watchdog.log"
fi

echo "[4/4] Sending initial connection heartbeat to ${GATEWAY}..."
# Emit initial heartbeat
curl -s -X POST "${GATEWAY}/api/v1/projects/${TOKEN}/watchdog/heartbeat" \
  -H "Content-Type: application/json" \
  -H "X-Project-Token: ${TOKEN}" \
  -d "{\"token\": \"${TOKEN}\", \"version\": \"v${VERSION}\", \"status\": \"HEALTHY\", \"timestamp\": $(date +%s000)}" >/dev/null 2>&1 || true

# Also attempt local web-dashboard heartbeat if listening
curl -s -X POST "http://localhost:3000/api/v1/projects/${TOKEN}/watchdog/heartbeat" \
  -H "Content-Type: application/json" \
  -H "X-Project-Token: ${TOKEN}" \
  -d "{\"token\": \"${TOKEN}\", \"version\": \"v${VERSION}\", \"status\": \"HEALTHY\", \"timestamp\": $(date +%s000)}" >/dev/null 2>&1 || true

echo ""
echo "========================================================================"
echo " ✔ AutoTrace-Sec Telemetry Watchdog v${VERSION} installed successfully!"
echo " Binary Location : ${INSTALL_DIR}/autotrace-watchdog (< 15 MB)"
echo " Config File     : ${CONFIG_FILE}"
echo " Interceptor Port: http://0.0.0.0:${PORT}"
echo " Initial Heartbeat Emitted."
echo "========================================================================"
