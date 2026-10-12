import { NextRequest, NextResponse } from 'next/server';
import { startWatchdogRunner } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = startWatchdogRunner(projectId);

  return NextResponse.json({
    status: 'STARTED',
    connected: true,
    projectId,
    token: state.token,
    hostname: state.hostname,
    nodesCount: state.discoveredNodes.length,
    edgesCount: state.discoveredEdges.length,
    message: `Watchdog daemon attached for project ${projectId}. Microservice sockets intercepted.`,
  });
}
