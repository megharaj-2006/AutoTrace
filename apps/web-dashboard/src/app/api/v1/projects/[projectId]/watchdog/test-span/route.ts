import { NextRequest, NextResponse } from 'next/server';
import { recordTelemetryEvent, getWatchdogState } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // If empty body, generate a realistic test microservice span
  }

  const state = getWatchdogState(projectId);

  // Default sequential spans if body not specified
  const samplePairs = [
    { src: 'gateway-api', dst: 'auth-service', endpoint: '/v1/auth/verify', method: 'POST' as const, latency: 1.4 },
    { src: 'gateway-api', dst: 'order-processor', endpoint: '/v1/orders/create', method: 'POST' as const, latency: 2.8 },
    { src: 'order-processor', dst: 'inventory-vault', endpoint: '/v1/stock/reserve', method: 'PUT' as const, latency: 3.2 },
    { src: 'order-processor', dst: 'payment-relay', endpoint: '/v1/charge/execute', method: 'POST' as const, latency: 4.1 },
    { src: 'payment-relay', dst: 'ledger-db', endpoint: '/v1/ledger/record', method: 'POST' as const, latency: 1.9 },
  ];

  // Pick pair based on current discovered nodes count to build a coherent graph
  const pairIndex = state.discoveredNodes.length % samplePairs.length;
  const pair = samplePairs[pairIndex];

  const source_service = body.source_service || pair.src;
  const target_service = body.target_service || pair.dst;
  const endpoint = body.endpoint || pair.endpoint;
  const method = body.method || pair.method;
  const latency_ms = Number(body.latency_ms) || pair.latency;

  const event = {
    trace_id: `trc-test-${Math.random().toString(36).substring(2, 9)}`,
    source_service,
    target_service,
    endpoint,
    method,
    status_code: 200,
    latency_ms,
    payload_entropy: 0.18,
    timestamp: Date.now(),
    is_anomalous: false,
  };

  const updated = recordTelemetryEvent(projectId, event);

  return NextResponse.json({
    status: 'INGESTED',
    message: `Telemetry span received from watchdog: ${source_service} -> ${target_service} (${method} ${latency_ms}ms). Graph updated.`,
    event,
    nodesCount: updated?.discoveredNodes.length,
    edgesCount: updated?.discoveredEdges.length,
    nodes: updated?.discoveredNodes,
    edges: updated?.discoveredEdges,
  });
}
