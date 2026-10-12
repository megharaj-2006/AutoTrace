import { ServiceNode, ServiceEdge, getProjectTopology, ProjectTopologyConfig } from '@/lib/projects/topology';
export { getProjectTopology };

export interface TelemetryEventRecord {
  trace_id: string;
  source_service: string;
  target_service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  status_code: number;
  latency_ms: number;
  payload_entropy: number;
  timestamp: number;
  is_anomalous?: boolean;
}

export interface WatchdogState {
  projectId: string;
  token: string;
  status: 'OFFLINE' | 'CONNECTED' | 'STREAMING';
  hostname?: string;
  version: string;
  serviceName?: string;
  lastHeartbeat?: number;
  eventsCaptured: number;
  eventsForwarded: number;
  quarantinedTargets: string[];
  discoveredNodes: ServiceNode[];
  discoveredEdges: ServiceEdge[];
  recentEvents: TelemetryEventRecord[];
  isRunnerActive: boolean;
  connectedAt?: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __autotrace_watchdog_store: Record<string, WatchdogState> | undefined;
  // eslint-disable-next-line no-var
  var __autotrace_watchdog_intervals: Record<string, NodeJS.Timeout> | undefined;
}

if (!globalThis.__autotrace_watchdog_store) {
  const initialStore: Record<string, WatchdogState> = {};

  // Pre-seed ONLY the testbed mock amazon cluster as running
  const mockAmazonTopo = getProjectTopology('mock-amazon-cluster');
  initialStore['mock-amazon-cluster'] = {
    projectId: 'mock-amazon-cluster',
    token: mockAmazonTopo.watchdogToken,
    status: 'STREAMING',
    hostname: 'node-mock-cluster-01',
    version: 'v1.2.0',
    serviceName: 'gateway-service',
    lastHeartbeat: Date.now(),
    connectedAt: Date.now(),
    eventsCaptured: 1420,
    eventsForwarded: 1420,
    quarantinedTargets: [],
    discoveredNodes: [...mockAmazonTopo.nodes],
    discoveredEdges: [...mockAmazonTopo.edges],
    recentEvents: [],
    isRunnerActive: true,
  };

  globalThis.__autotrace_watchdog_store = initialStore;
}

if (!globalThis.__autotrace_watchdog_intervals) {
  globalThis.__autotrace_watchdog_intervals = {};
}

const store = globalThis.__autotrace_watchdog_store!;

/**
 * Gets or initializes the watchdog state for a project.
 * By default, any non-testbed project starts as OFFLINE.
 */
export function getWatchdogState(projectId: string): WatchdogState {
  if (!store[projectId]) {
    const topo = getProjectTopology(projectId);
    store[projectId] = {
      projectId,
      token: topo.watchdogToken,
      status: 'OFFLINE',
      hostname: undefined,
      version: 'v1.2.0',
      serviceName: undefined,
      lastHeartbeat: undefined,
      eventsCaptured: 0,
      eventsForwarded: 0,
      quarantinedTargets: [],
      discoveredNodes: [],
      discoveredEdges: [],
      recentEvents: [],
      isRunnerActive: false,
    };
  }

  const record = store[projectId];

  // Check if heartbeat expired (> 60s without heartbeat and not runner)
  if (record.status !== 'OFFLINE' && record.lastHeartbeat && !record.isRunnerActive) {
    if (Date.now() - record.lastHeartbeat > 60000) {
      record.status = 'OFFLINE';
    }
  }

  return record;
}

/**
 * Records an incoming heartbeat from a watchdog agent.
 */
export function recordHeartbeat(
  projectId: string,
  data: {
    token?: string;
    hostname?: string;
    version?: string;
    service_name?: string;
    status?: string;
  }
): WatchdogState {
  const record = getWatchdogState(projectId);
  const topo = getProjectTopology(projectId);

  record.token = data.token || record.token;
  record.hostname = data.hostname || record.hostname || topo.watchdogAgent.hostname;
  record.version = data.version || record.version || 'v1.2.0';
  record.serviceName = data.service_name || record.serviceName || topo.nodes[0]?.name;
  record.status = 'CONNECTED';
  record.lastHeartbeat = Date.now();
  if (!record.connectedAt) {
    record.connectedAt = Date.now();
  }

  // Only bootstrap testbed nodes for the Mock Amazon cluster simulation
  if (record.discoveredNodes.length === 0 && projectId === 'mock-amazon-cluster') {
    record.discoveredNodes = [...topo.nodes];
    record.discoveredEdges = [...topo.edges];
    record.status = 'STREAMING';
  }

  return record;
}

/**
 * Records an ingested telemetry event from a watchdog.
 * Dynamically updates discovered nodes, directed edges, and latency metrics.
 */
export function recordTelemetryEvent(
  tokenOrProjectId: string,
  event: TelemetryEventRecord
): WatchdogState | null {
  // Find matching project
  let targetProjectId = tokenOrProjectId;
  let targetState: WatchdogState | undefined = store[tokenOrProjectId];

  if (!targetState) {
    for (const [pId, s] of Object.entries(store)) {
      if (s.token === tokenOrProjectId || pId === tokenOrProjectId) {
        targetProjectId = pId;
        targetState = s;
        break;
      }
    }
  }

  if (!targetState) {
    targetState = getWatchdogState(targetProjectId);
  }

  targetState.eventsCaptured += 1;
  targetState.eventsForwarded += 1;
  targetState.status = 'STREAMING';
  targetState.lastHeartbeat = Date.now();

  // Add event to recentEvents ring buffer (max 60)
  targetState.recentEvents = [event, ...targetState.recentEvents.slice(0, 59)];

  // Update discovered topology
  // 1. Ensure source node exists
  let srcNode = targetState.discoveredNodes.find(
    (n) => n.name === event.source_service || n.id === event.source_service
  );
  if (!srcNode) {
    const id = event.source_service.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const idx = targetState.discoveredNodes.length;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    srcNode = {
      id,
      name: event.source_service,
      role: 'Microservice Ingress',
      port: 8080 + idx,
      status: 'HEALTHY',
      p99LatencyMs: event.latency_ms,
      reqPerSec: 120,
      cpuUsage: 14.2,
      memoryUsage: 45,
      position: { x: 140 + col * 260, y: 150 + row * 160 + ((col % 2) * 35) },
    };
    targetState.discoveredNodes.push(srcNode);
  } else {
    srcNode.p99LatencyMs = Number(((srcNode.p99LatencyMs * 0.8) + (event.latency_ms * 0.2)).toFixed(1));
    srcNode.reqPerSec = Math.min(2500, srcNode.reqPerSec + 5);
  }

  // 2. Ensure target node exists
  let dstNode = targetState.discoveredNodes.find(
    (n) => n.name === event.target_service || n.id === event.target_service
  );
  if (!dstNode) {
    const id = event.target_service.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const idx = targetState.discoveredNodes.length;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    dstNode = {
      id,
      name: event.target_service,
      role: 'Backend Workload',
      port: 8080 + idx,
      status: 'HEALTHY',
      p99LatencyMs: event.latency_ms,
      reqPerSec: 90,
      cpuUsage: 18.5,
      memoryUsage: 55,
      position: { x: 140 + col * 260, y: 150 + row * 160 + ((col % 2) * 35) },
    };
    targetState.discoveredNodes.push(dstNode);
  }

  // 3. Ensure directed edge exists
  const edgeId = `e-${srcNode.id}-${dstNode.id}`;
  const existingEdge = targetState.discoveredEdges.find((e) => e.id === edgeId);
  if (!existingEdge) {
    targetState.discoveredEdges.push({
      id: edgeId,
      source: srcNode.id,
      target: dstNode.id,
      label: `${event.method} ${event.latency_ms}ms`,
      protocol: event.method,
      latencyMs: event.latency_ms,
    });
  } else {
    existingEdge.latencyMs = event.latency_ms;
    existingEdge.label = `${event.method} ${event.latency_ms}ms`;
  }

  return targetState;
}

/**
 * Starts the in-process watchdog runner for this project.
 * Automatically discovers the project's services and begins streaming live events.
 */
export function startWatchdogRunner(projectId: string): WatchdogState {
  const record = getWatchdogState(projectId);
  const topo = getProjectTopology(projectId);

  record.status = 'STREAMING';
  record.isRunnerActive = true;
  record.hostname = topo.watchdogAgent.hostname;
  record.lastHeartbeat = Date.now();
  record.connectedAt = Date.now();

  // ONLY the Mock Amazon cluster simulation seeds predefined testbed nodes & local traffic
  if (projectId === 'mock-amazon-cluster') {
    record.serviceName = 'gateway-service';
    record.discoveredNodes = [...topo.nodes];
    record.discoveredEdges = [...topo.edges];

    // Stop any previous runner interval
    if (globalThis.__autotrace_watchdog_intervals && globalThis.__autotrace_watchdog_intervals[projectId]) {
      clearInterval(globalThis.__autotrace_watchdog_intervals[projectId]);
    }

    const endpoints = topo.endpoints.length > 0 ? topo.endpoints : ['/api/v1/orders', '/health', '/api/v1/cart'];
    const methods: Array<'GET' | 'POST'> = ['GET', 'POST'];

    const intervalId = setInterval(() => {
      if (!record.isRunnerActive) {
        clearInterval(intervalId);
        return;
      }

      record.lastHeartbeat = Date.now();
      const nodes = record.discoveredNodes;
      if (nodes.length < 1) return;

      const src = nodes[Math.floor(Math.random() * nodes.length)];
      let dst = nodes[Math.floor(Math.random() * nodes.length)];
      if (dst.id === src.id && nodes.length > 1) {
        dst = nodes.find((n) => n.id !== src.id) || nodes[0];
      }

      const newEvt: TelemetryEventRecord = {
        trace_id: `trc-${Math.random().toString(36).substring(2, 9)}`,
        source_service: src.name,
        target_service: dst.name,
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        status_code: 200,
        latency_ms: Number((Math.random() * 2.5 + src.p99LatencyMs).toFixed(1)),
        payload_entropy: Number((Math.random() * 0.08 + 0.14).toFixed(2)),
        timestamp: Date.now(),
        is_anomalous: false,
      };

      recordTelemetryEvent(projectId, newEvt);
    }, 1400);

    if (globalThis.__autotrace_watchdog_intervals) {
      globalThis.__autotrace_watchdog_intervals[projectId] = intervalId;
    }
  } else {
    // For ALL custom/user projects: do NOT invent fake services or fake spans!
    // The graph strictly awaits incoming spans from the project's watchdog.
    record.serviceName = undefined;
    // Keep only already discovered nodes (if any)
  }

  return record;
}

/**
 * Stops the in-process watchdog runner for this project.
 */
export function stopWatchdogRunner(projectId: string): WatchdogState {
  const record = getWatchdogState(projectId);
  record.status = 'OFFLINE';
  record.isRunnerActive = false;
  record.lastHeartbeat = undefined;

  if (globalThis.__autotrace_watchdog_intervals && globalThis.__autotrace_watchdog_intervals[projectId]) {
    clearInterval(globalThis.__autotrace_watchdog_intervals[projectId]);
    delete globalThis.__autotrace_watchdog_intervals[projectId];
  }

  return record;
}
