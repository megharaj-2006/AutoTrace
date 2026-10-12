#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TMP_TAR="/tmp/autotrace-azure-deploy-$$.tar.gz"
OUTPUT_TAR="infra/azure/autotrace-azure-deploy.tar.gz"
echo "Packaging Azure deployment tarball: $OUTPUT_TAR..."

tar -czf "$TMP_TAR" \
    --exclude='*.git*' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.tar.gz' \
    infra/azure \
    services/telemetry-watchdog

mv "$TMP_TAR" "$OUTPUT_TAR"
echo "Package ready: $(ls -lh $OUTPUT_TAR | awk '{print $5, $9}')"
