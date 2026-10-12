import { NextRequest, NextResponse } from 'next/server';
import { recordHeartbeat, getWatchdogState } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const projectId = body.project_id || body.projectId || 'mock-amazon-cluster';
  const updatedState = recordHeartbeat(projectId, {
    token: body.token,
    hostname: body.hostname,
    version: body.version,
    service_name: body.service_name,
    status: body.status,
  });

  return NextResponse.json({
    status: 'ACK',
    connected: true,
    projectId,
    state: updatedState,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || 'mock-amazon-cluster';
  const state = getWatchdogState(projectId);

  return NextResponse.json({
    connected: state.status !== 'OFFLINE',
    status: state.status,
    projectId: state.projectId,
    hostname: state.hostname || null,
    lastHeartbeat: state.lastHeartbeat || null,
  });
}
