import { NextRequest, NextResponse } from 'next/server';
import { getWatchdogState } from '@/lib/watchdog/store';
import { getProjectTopology } from '@/lib/projects/topology';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = getWatchdogState(projectId);
  const fallbackTopo = getProjectTopology(projectId);

  const isConnected = state.status !== 'OFFLINE';

  return NextResponse.json({
    connected: isConnected,
    status: state.status,
    projectId,
    token: state.token,
    hostname: state.hostname || null,
    meshNetwork: fallbackTopo.meshNetwork,
    environment: fallbackTopo.environment,
    nodes: state.discoveredNodes,
    edges: state.discoveredEdges,
    defaultSelectedNodeId: state.discoveredNodes[0]?.id || fallbackTopo.defaultSelectedNodeId,
    attackConfig: fallbackTopo.attackConfig,
    chaosConfig: fallbackTopo.chaosConfig,
    lastHeartbeat: state.lastHeartbeat || null,
    message: isConnected
      ? `Dependency graph actively constructed from watchdog telemetry on ${state.hostname}`
      : 'Watchdog agent is offline. Awaiting socket telemetry discovery.',
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = getWatchdogState(projectId);

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (Array.isArray(body.nodes)) {
    state.discoveredNodes = body.nodes;
  }
  if (Array.isArray(body.edges)) {
    state.discoveredEdges = body.edges;
  }
  state.status = 'STREAMING';
  state.lastHeartbeat = Date.now();

  return NextResponse.json({
    status: 'ACK',
    connected: true,
    nodesCount: state.discoveredNodes.length,
    edgesCount: state.discoveredEdges.length,
  });
}
