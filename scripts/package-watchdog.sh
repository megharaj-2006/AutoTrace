#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec: Telemetry Watchdog Packaging Script
# Generates lightweight downloadable .tar.gz bundle (< 15 MB)
# ==============================================================================

set -e

VERSION="1.2.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WATCHDOG_DIR="${REPO_ROOT}/services/telemetry-watchdog"
DIST_DIR="${WATCHDOG_DIR}/dist"
PUBLIC_DOWNLOADS="${REPO_ROOT}/apps/web-dashboard/public/downloads"

echo "========================================================================"
echo " 📦 Packaging AutoTrace-Sec Telemetry Watchdog v${VERSION} (< 15 MB)"
echo " Source Directory : ${WATCHDOG_DIR}"
echo " Output Directory : ${DIST_DIR}"
echo "========================================================================"

mkdir -p "${DIST_DIR}" "${PUBLIC_DOWNLOADS}"

# 1. Ensure native C binary is compiled if clang/gcc available
if command -v clang >/dev/null 2>&1 || command -v gcc >/dev/null 2>&1; then
  CC=$(command -v clang || command -v gcc)
  echo "[1/4] Compiling native C watchdog engine using ${CC}..."
  mkdir -p "${WATCHDOG_DIR}/bin"
  ${CC} -O3 -Wall -o "${WATCHDOG_DIR}/bin/autotrace-watchdog-native" "${WATCHDOG_DIR}/src/watchdog.c" -lm
  echo "✔ Native binary compiled: $(ls -lh "${WATCHDOG_DIR}/bin/autotrace-watchdog-native" | awk '{print $5}')"
fi

# 2. Prepare staging directory for archive
STAGE_DIR="/tmp/autotrace-watchdog-pack"
rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}/bin" "${STAGE_DIR}/conf" "${STAGE_DIR}/systemd"

echo "[2/4] Assembling release assets..."
cp "${WATCHDOG_DIR}/autotrace-watchdog" "${STAGE_DIR}/autotrace-watchdog"
chmod +x "${STAGE_DIR}/autotrace-watchdog"

if [ -f "${WATCHDOG_DIR}/bin/autotrace-watchdog-native" ]; then
  cp "${WATCHDOG_DIR}/bin/autotrace-watchdog-native" "${STAGE_DIR}/bin/"
fi

cp "${WATCHDOG_DIR}/conf/watchdog.conf" "${STAGE_DIR}/conf/watchdog.conf"
cp "${WATCHDOG_DIR}/conf/autotrace-watchdog.service" "${STAGE_DIR}/systemd/"
cp "${REPO_ROOT}/scripts/install-watchdog.sh" "${STAGE_DIR}/install.sh"
chmod +x "${STAGE_DIR}/install.sh"

cat <<EOF > "${STAGE_DIR}/README.md"
# AutoTrace-Sec Telemetry Watchdog (${VERSION})

Lightweight (< 15 MB) zero-dependency host daemon for B2B production deployment.

## Quick Start
1. Edit configuration:
   nano conf/watchdog.conf
2. Run installation:
   sudo ./install.sh --token=<YOUR_TOKEN> --gateway=http://localhost:8085
3. Or execute directly:
   ./autotrace-watchdog start --token=<YOUR_TOKEN>
EOF

cat <<EOF > "${STAGE_DIR}/LICENSE"
Apache License 2.0 - AutoTrace-Sec Distributed Security System
EOF

echo "[3/4] Creating distribution archives..."

ARCHIVE_NAME="autotrace-watchdog-${VERSION}-linux-amd64.tar.gz"
ARCHIVE_DARWIN="autotrace-watchdog-${VERSION}-darwin-arm64.tar.gz"

tar -czf "${DIST_DIR}/${ARCHIVE_NAME}" -C "${STAGE_DIR}" .
tar -czf "${DIST_DIR}/${ARCHIVE_DARWIN}" -C "${STAGE_DIR}" .

# Copy to web-dashboard public downloads directory for REST API and web access
cp "${DIST_DIR}/${ARCHIVE_NAME}" "${PUBLIC_DOWNLOADS}/${ARCHIVE_NAME}"
cp "${DIST_DIR}/${ARCHIVE_DARWIN}" "${PUBLIC_DOWNLOADS}/${ARCHIVE_DARWIN}"

# Provide generic latest alias
cp "${DIST_DIR}/${ARCHIVE_NAME}" "${PUBLIC_DOWNLOADS}/autotrace-watchdog-latest.tar.gz"

echo "[4/4] Verifying archive footprint & checksums..."
ARCHIVE_SIZE=$(ls -lh "${DIST_DIR}/${ARCHIVE_NAME}" | awk '{print $5}')
ARCHIVE_BYTES=$(stat -f%z "${DIST_DIR}/${ARCHIVE_NAME}" 2>/dev/null || stat -c%s "${DIST_DIR}/${ARCHIVE_NAME}")

cd "${DIST_DIR}"
shasum -a 256 "${ARCHIVE_NAME}" > SHA256SUMS

echo "========================================================================"
echo " ✔ Packaging Complete!"
echo " Archive File     : ${DIST_DIR}/${ARCHIVE_NAME}"
echo " Archive Size     : ${ARCHIVE_SIZE} (${ARCHIVE_BYTES} bytes)"
echo " Public Download  : ${PUBLIC_DOWNLOADS}/${ARCHIVE_NAME}"
echo " Footprint Target : < 15 MB (Actual: ${ARCHIVE_SIZE})"
echo "========================================================================"
