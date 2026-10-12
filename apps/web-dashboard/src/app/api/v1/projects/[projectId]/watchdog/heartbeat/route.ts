import { NextRequest, NextResponse } from 'next/server';
import { getWatchdogState, recordHeartbeat } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = getWatchdogState(projectId);

  const isConnected = state.status !== 'OFFLINE';
  const ageMs = state.lastHeartbeat ? Date.now() - state.lastHeartbeat : null;

  return NextResponse.json({
    connected: isConnected,
    status: state.status,
    projectId,
    token: state.token,
    version: state.version,
    hostname: state.hostname || 'None (Awaiting connection)',
    service: state.serviceName || 'None',
    lastHeartbeat: state.lastHeartbeat || null,
    timeSinceHeartbeatMs: ageMs,
    eventsCaptured: state.eventsCaptured,
    eventsForwarded: state.eventsForwarded,
    discoveredNodesCount: state.discoveredNodes.length,
    message: isConnected
      ? `Watchdog agent active on ${state.hostname}`
      : 'No active watchdog connected for this project. Run watchdog command to discover microservices.',
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const state = recordHeartbeat(projectId, {
    token: body.token,
    hostname: body.hostname,
    version: body.version,
    service_name: body.service_name || body.service,
    status: body.status,
  });

  return NextResponse.json({
    status: 'ACK',
    connected: true,
    projectId,
    token: state.token,
    hostname: state.hostname,
    discoveredNodesCount: state.discoveredNodes.length,
    lastHeartbeat: state.lastHeartbeat,
  });
}
