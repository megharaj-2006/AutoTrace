export interface TelemetryEvent {
  // Canonical schema fields (matching shared/schemas/telemetry-event.json)
  trace_id?: string;
  source_service?: string;
  target_service?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  latency_ms?: number;
  payload_entropy?: number;
  timestamp?: string | number;

  // Backward-compatible aliases
  traceId?: string;
  spanId?: string;
  source?: string;
  target?: string;
  httpStatus?: number;
  latencyMs?: number;
  protocol?: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  firstSeen: string;
  lastSeen: string;
  requestCount: number;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  callCount: number;
  firstSeen: string;
  lastSeen: string;
  avgLatencyMs?: number;
  lastHttpStatus?: number;
}

export interface DependencyGraph {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
}
