import { NextRequest, NextResponse } from 'next/server';
import { getWatchdogState, recordTelemetryEvent, TelemetryEventRecord } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = getWatchdogState(projectId);

  return NextResponse.json({
    connected: state.status !== 'OFFLINE',
    status: state.status,
    projectId,
    token: state.token,
    events: state.recentEvents,
    eventsCaptured: state.eventsCaptured,
    eventsForwarded: state.eventsForwarded,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  let event: Partial<TelemetryEventRecord> = {};
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!event.source_service || !event.target_service) {
    return NextResponse.json(
      { error: 'Missing source_service or target_service' },
      { status: 400 }
    );
  }

  const completeEvent: TelemetryEventRecord = {
    trace_id: event.trace_id || `trc-${Math.random().toString(36).substring(2, 9)}`,
    source_service: event.source_service,
    target_service: event.target_service,
    endpoint: event.endpoint || '/',
    method: (event.method as any) || 'GET',
    status_code: event.status_code || 200,
    latency_ms: event.latency_ms || 10.0,
    payload_entropy: event.payload_entropy !== undefined ? event.payload_entropy : 0.18,
    timestamp: event.timestamp || Date.now(),
    is_anomalous: Boolean(event.is_anomalous),
  };

  const updatedState = recordTelemetryEvent(projectId, completeEvent);

  return NextResponse.json({
    status: 'RECORDED',
    event: completeEvent,
    nodesCount: updatedState?.discoveredNodes.length,
    edgesCount: updatedState?.discoveredEdges.length,
  });
}
