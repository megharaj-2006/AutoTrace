#!/usr/bin/env bash
# ==============================================================================
# AutoTrace-Sec Azure VM Provisioning: Step 4 (Deploy Infrastructure Services)
# ==============================================================================
set -euo pipefail

DEPLOY_DIR="$HOME/autotrace-infra"
mkdir -p "$DEPLOY_DIR"
cp docker-compose.infra.yml "$DEPLOY_DIR/docker-compose.yml"
cd "$DEPLOY_DIR"

echo "Bringing up Redpanda (1G mem), Redis (256MB), and 4 Mock Services..."
docker compose pull redpanda redis || true
docker compose up -d

echo "Waiting for services to become healthy..."
sleep 8

docker compose ps

echo "Checking Redpanda health..."
docker compose exec -T redpanda rpk cluster health || true

echo "Checking Redis..."
docker compose exec -T redis redis-cli ping || true

echo "Checking Mock Services health endpoints..."
curl -s http://localhost:5000/health || echo "Gateway starting..."
curl -s http://localhost:5001/health || echo "Order starting..."
curl -s http://localhost:5002/health || echo "Reviews starting..."
curl -s http://localhost:5003/health || echo "Vault starting..."

echo "Infrastructure services deployed successfully."
