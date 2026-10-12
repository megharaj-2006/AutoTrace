import { NextRequest, NextResponse } from 'next/server';
import { recordTelemetryEvent, TelemetryEventRecord } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = request.headers.get('X-Project-Token') || request.headers.get('x-project-token');

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const projectToken = token || body.token || body.project_id || 'mock-amazon-cluster';

  if (!body.source_service || !body.target_service) {
    return NextResponse.json(
      { error: 'Missing canonical source_service or target_service' },
      { status: 400 }
    );
  }

  const event: TelemetryEventRecord = {
    trace_id: body.trace_id || `trc-${Math.random().toString(36).substring(2, 9)}`,
    source_service: body.source_service,
    target_service: body.target_service,
    endpoint: body.endpoint || '/',
    method: body.method || 'POST',
    status_code: body.status_code || 200,
    latency_ms: body.latency_ms || 10.0,
    payload_entropy: body.payload_entropy !== undefined ? body.payload_entropy : 0.18,
    timestamp: body.timestamp || Date.now(),
    is_anomalous: Boolean(body.is_anomalous),
  };

  const updatedState = recordTelemetryEvent(projectToken, event);

  return NextResponse.json({
    status: 'INGESTED',
    event,
    project_id: updatedState?.projectId,
    nodes_count: updatedState?.discoveredNodes.length,
    edges_count: updatedState?.discoveredEdges.length,
  });
}
