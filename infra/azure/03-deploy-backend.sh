#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec Azure VM Provisioning: Step 5 (Deploy Express Backend via PM2)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$HOME/autotrace-backend"
mkdir -p "$BACKEND_DIR"
cp -r "$SCRIPT_DIR/backend/"* "$BACKEND_DIR/"
cd "$BACKEND_DIR"

echo "Installing backend dependencies..."
npm install --omit=dev

# Install PM2 if not present
if ! command -v pm2 &>/dev/null; then
    echo "Installing PM2 process supervisor..."
    sudo npm install -g pm2
fi

echo "Starting Express backend via PM2 with memory cap 512MB..."
pm2 delete autotrace-backend 2>/dev/null || true

export PORT=8080
export KAFKA_BROKER="localhost:9092"
export NODE_OPTIONS="--max-old-space-size=512"

# If a local .env exists, export variables
if [ -f "$HOME/.autotrace.env" ]; then
    echo "Sourcing environment from ~/.autotrace.env..."
    set -a
    source "$HOME/.autotrace.env"
    set +a
fi

pm2 start server.js \
    --name autotrace-backend \
    --max-memory-restart 512M \
    --env PORT=8080 \
    --env KAFKA_BROKER=localhost:9092 \
    --node-args="--max-old-space-size=512"

pm2 save

echo "Waiting for backend to initialize..."
sleep 3

echo "Testing Express /health endpoint..."
curl -s http://localhost:8080/health | jq . || curl -s http://localhost:8080/health

echo "Express backend successfully deployed and running on port 8080."
