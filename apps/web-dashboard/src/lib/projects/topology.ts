export interface ServiceNode {
  id: string;
  name: string;
  role: string;
  port: number;
  status: 'HEALTHY' | 'ANOMALOUS' | 'QUARANTINED' | 'DEGRADED';
  p99LatencyMs: number;
  reqPerSec: number;
  cpuUsage: number;
  memoryUsage: number;
  isRootCause?: boolean;
  isVictim?: boolean;
  position?: { x: number; y: number };
}

export interface ServiceEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol?: string;
  latencyMs?: number;
}

export interface WatchdogAgentInfo {
  agentId: string;
  hostname: string;
  version: string;
  status: 'ACTIVE' | 'STANDBY' | 'HEALTHY';
  socketCount: number;
  eventsPerSec: number;
  token: string;
}

export interface AttackConfig {
  compromisedNodeId: string;
  targetNodeId: string;
  rogueEdgeLabel: string;
  alertId: string;
  alertDescription: string;
  rogueEndpoint: string;
}

export interface ChaosConfig {
  culpritNodeId: string;
  victimNodeIds: string[];
  culpritLatencyMs: number;
  victimLatencyMs: number;
  alertId: string;
  alertDescription: string;
  symptomEndpoint: string;
}

export interface ProjectTopologyConfig {
  projectId: string;
  projectName: string;
  environment: string;
  meshNetwork: string;
  watchdogToken: string;
  watchdogAgent: WatchdogAgentInfo;
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  defaultSelectedNodeId: string;
  endpoints: string[];
  attackConfig: AttackConfig;
  chaosConfig: ChaosConfig;
}

export interface CustomProjectStored {
  id: string;
  name: string;
  environment: string;
  nodesCount: number;
  ports: string;
  throughputEventsPerSec: number;
  status: 'ACTIVE' | 'DEGRADED' | 'STANDBY';
  baselineStatus: string;
  lastAnomaly: string;
}

// 1. Mock Amazon Cluster (Testbed) — 4 Services
export const MOCK_AMAZON_TOPOLOGY: ProjectTopologyConfig = {
  projectId: 'mock-amazon-cluster',
  projectName: 'Mock Amazon Cluster (Testbed)',
  environment: 'Docker Compose (autotrace-mesh)',
  meshNetwork: 'autotrace-mesh',
  watchdogToken: 'at_live_demo_9841',
  watchdogAgent: {
    agentId: 'autotrace-watchdog-ebpf',
    hostname: 'node-mock-cluster-01',
    version: 'v1.2.0',
    status: 'ACTIVE',
    socketCount: 18,
    eventsPerSec: 1420,
    token: 'at_live_demo_9841',
  },
  defaultSelectedNodeId: 'gateway',
  endpoints: ['/api/v1/orders', '/health', '/api/v1/cart', '/api/v1/products', '/vault/token'],
  nodes: [
    {
      id: 'gateway',
      name: 'gateway-service',
      role: 'API Reverse Proxy',
      port: 5000,
      status: 'HEALTHY',
      p99LatencyMs: 1.1,
      reqPerSec: 1420,
      cpuUsage: 12.4,
      memoryUsage: 48,
      position: { x: 120, y: 220 },
    },
    {
      id: 'order',
      name: 'order-service',
      role: 'Business Logic Core',
      port: 5001,
      status: 'HEALTHY',
      p99LatencyMs: 2.8,
      reqPerSec: 1100,
      cpuUsage: 28.1,
      memoryUsage: 94,
      position: { x: 380, y: 140 },
    },
    {
      id: 'reviews',
      name: 'reviews-service',
      role: 'Vulnerable Public Ingress',
      port: 5003,
      status: 'HEALTHY',
      p99LatencyMs: 4.2,
      reqPerSec: 450,
      cpuUsage: 35.8,
      memoryUsage: 62,
      position: { x: 380, y: 320 },
    },
    {
      id: 'vault',
      name: 'payment-vault',
      role: 'PCI Isolated Data Store',
      port: 5002,
      status: 'HEALTHY',
      p99LatencyMs: 1.9,
      reqPerSec: 320,
      cpuUsage: 14.2,
      memoryUsage: 56,
      position: { x: 640, y: 220 },
    },
  ],
  edges: [
    {
      id: 'e-gateway-order',
      source: 'gateway',
      target: 'order',
      label: 'HTTP/REST 1.2ms',
      protocol: 'HTTP/REST',
      latencyMs: 1.2,
    },
    {
      id: 'e-order-reviews',
      source: 'order',
      target: 'reviews',
      label: 'HTTP/REST 2.4ms',
      protocol: 'HTTP/REST',
      latencyMs: 2.4,
    },
    {
      id: 'e-order-vault',
      source: 'order',
      target: 'vault',
      label: 'mTLS/gRPC 3.1ms',
      protocol: 'mTLS/gRPC',
      latencyMs: 3.1,
    },
  ],
  attackConfig: {
    compromisedNodeId: 'reviews',
    targetNodeId: 'vault',
    rogueEdgeLabel: 'ROGUE SSRF (0.984)',
    alertId: 'alt-7b91d24c-e832-491a',
    alertDescription: 'Patient Zero: reviews-service:5003 initiated direct unauthorized lateral connection to payment-vault:5002. Violates baseline adjacency matrix A_base.',
    rogueEndpoint: '/internal/pci/cardholders',
  },
  chaosConfig: {
    culpritNodeId: 'vault',
    victimNodeIds: ['gateway', 'order'],
    culpritLatencyMs: 3120.0,
    victimLatencyMs: 3280.0,
    alertId: 'alt-chaos-lat-883f',
    alertDescription: 'GAT RCA backward causal traversal identified leaf sink payment-vault:5002 as the root cause bottleneck (~3,120ms compute delay). gateway-service and order-service are cascading victims.',
    symptomEndpoint: '/api/v1/checkout',
  },
};

// 2. FinTech Checkout & Vault Mesh — 8 Services
export const FINTECH_PAYMENT_TOPOLOGY: ProjectTopologyConfig = {
  projectId: 'fintech-payment-pipeline',
  projectName: 'FinTech Checkout & Vault Mesh',
  environment: 'Kubernetes Cluster (Production)',
  meshNetwork: 'fintech-k8s-mesh',
  watchdogToken: 'atk_live_fintech_payment_pipeline_7421',
  watchdogAgent: {
    agentId: 'autotrace-k8s-daemonset',
    hostname: 'k8s-worker-fintech-03',
    version: 'v1.2.0',
    status: 'ACTIVE',
    socketCount: 46,
    eventsPerSec: 2850,
    token: 'atk_live_fintech_payment_pipeline_7421',
  },
  defaultSelectedNodeId: 'api-gw',
  endpoints: [
    '/v1/auth/verify',
    '/v1/checkout/session',
    '/v1/fraud/risk-eval',
    '/v1/token/card-hsm',
    '/v1/ledger/transact',
    '/v1/stripe/relay-charge',
    '/v1/notifications/push'
  ],
  nodes: [
    {
      id: 'api-gw',
      name: 'api-gateway',
      role: 'TLS Edge Ingress',
      port: 8443,
      status: 'HEALTHY',
      p99LatencyMs: 0.8,
      reqPerSec: 2850,
      cpuUsage: 18.5,
      memoryUsage: 64,
      position: { x: 80, y: 220 },
    },
    {
      id: 'auth',
      name: 'auth-service',
      role: 'OAuth2 & JWT Verification',
      port: 9000,
      status: 'HEALTHY',
      p99LatencyMs: 1.2,
      reqPerSec: 2400,
      cpuUsage: 22.1,
      memoryUsage: 78,
      position: { x: 260, y: 110 },
    },
    {
      id: 'checkout',
      name: 'checkout-orchestrator',
      role: 'Checkout Saga Coordinator',
      port: 9080,
      status: 'HEALTHY',
      p99LatencyMs: 2.1,
      reqPerSec: 2150,
      cpuUsage: 34.6,
      memoryUsage: 112,
      position: { x: 260, y: 330 },
    },
    {
      id: 'fraud',
      name: 'fraud-evaluator',
      role: 'ML Risk Scoring Engine',
      port: 8001,
      status: 'HEALTHY',
      p99LatencyMs: 3.4,
      reqPerSec: 1850,
      cpuUsage: 45.2,
      memoryUsage: 140,
      position: { x: 480, y: 110 },
    },
    {
      id: 'token-vault',
      name: 'token-vault',
      role: 'PCI HSM Tokenizer',
      port: 9443,
      status: 'HEALTHY',
      p99LatencyMs: 1.7,
      reqPerSec: 1620,
      cpuUsage: 19.8,
      memoryUsage: 86,
      position: { x: 480, y: 240 },
    },
    {
      id: 'stripe-relay',
      name: 'stripe-relay',
      role: 'Outbound Payment Gateway Relay',
      port: 8088,
      status: 'HEALTHY',
      p99LatencyMs: 22.4,
      reqPerSec: 1400,
      cpuUsage: 26.3,
      memoryUsage: 72,
      position: { x: 480, y: 370 },
    },
    {
      id: 'ledger',
      name: 'ledger-db',
      role: 'Immutable Double-Entry Ledger',
      port: 5432,
      status: 'HEALTHY',
      p99LatencyMs: 2.4,
      reqPerSec: 1950,
      cpuUsage: 31.7,
      memoryUsage: 180,
      position: { x: 700, y: 180 },
    },
    {
      id: 'notif',
      name: 'notification-queue',
      role: 'Kafka Event Notifier',
      port: 9093,
      status: 'HEALTHY',
      p99LatencyMs: 0.9,
      reqPerSec: 1200,
      cpuUsage: 14.2,
      memoryUsage: 54,
      position: { x: 700, y: 340 },
    },
  ],
  edges: [
    {
      id: 'e-gw-auth',
      source: 'api-gw',
      target: 'auth',
      label: 'gRPC/Verify 0.9ms',
      protocol: 'gRPC',
      latencyMs: 0.9,
    },
    {
      id: 'e-gw-checkout',
      source: 'api-gw',
      target: 'checkout',
      label: 'HTTP/2 1.4ms',
      protocol: 'HTTP/2',
      latencyMs: 1.4,
    },
    {
      id: 'e-chk-fraud',
      source: 'checkout',
      target: 'fraud',
      label: 'gRPC/Risk 3.2ms',
      protocol: 'gRPC',
      latencyMs: 3.2,
    },
    {
      id: 'e-chk-token',
      source: 'checkout',
      target: 'token-vault',
      label: 'mTLS/Token 2.1ms',
      protocol: 'mTLS',
      latencyMs: 2.1,
    },
    {
      id: 'e-chk-stripe',
      source: 'checkout',
      target: 'stripe-relay',
      label: 'HTTPS/Relay 24.5ms',
      protocol: 'HTTPS',
      latencyMs: 24.5,
    },
    {
      id: 'e-token-ledger',
      source: 'token-vault',
      target: 'ledger',
      label: 'PG Wire 1.8ms',
      protocol: 'Postgres Wire',
      latencyMs: 1.8,
    },
    {
      id: 'e-fraud-ledger',
      source: 'fraud',
      target: 'ledger',
      label: 'Audit Log 1.2ms',
      protocol: 'Audit/Log',
      latencyMs: 1.2,
    },
    {
      id: 'e-chk-notif',
      source: 'checkout',
      target: 'notif',
      label: 'Kafka Produce 0.7ms',
      protocol: 'Kafka Wire',
      latencyMs: 0.7,
    },
  ],
  attackConfig: {
    compromisedNodeId: 'stripe-relay',
    targetNodeId: 'ledger',
    rogueEdgeLabel: 'ROGUE SQL DUMP (0.991)',
    alertId: 'alt-fintech-sec-482a',
    alertDescription: 'Patient Zero: stripe-relay:8088 initiated direct unauthorized SQL lateral connection to ledger-db:5432. Violates baseline PCI segregation matrix A_base.',
    rogueEndpoint: '/db/financial_records/dump',
  },
  chaosConfig: {
    culpritNodeId: 'ledger',
    victimNodeIds: ['api-gw', 'checkout'],
    culpritLatencyMs: 2850.0,
    victimLatencyMs: 3150.0,
    alertId: 'alt-fintech-lat-991c',
    alertDescription: 'GAT RCA backward causal traversal identified ledger-db:5432 as the root cause bottleneck (row lock contention ~2,850ms). api-gateway and checkout-orchestrator are cascading victims.',
    symptomEndpoint: '/v1/checkout/session',
  },
};

// 3. Edge IoT Telemetry Gateway — 2 Services
export const EDGE_IOT_TOPOLOGY: ProjectTopologyConfig = {
  projectId: 'edge-iot-telemetry-gateway',
  projectName: 'Edge Ingress Collector Mesh',
  environment: 'Bare-Metal Linux (systemd)',
  meshNetwork: 'edge-loopback-mesh',
  watchdogToken: 'atk_live_edge_iot_telemetry_gateway_3914',
  watchdogAgent: {
    agentId: 'autotrace-embedded-bpf',
    hostname: 'edge-gw-rpi5-field',
    version: 'v1.2.0',
    status: 'ACTIVE',
    socketCount: 8,
    eventsPerSec: 180,
    token: 'atk_live_edge_iot_telemetry_gateway_3914',
  },
  defaultSelectedNodeId: 'mqtt-ingress',
  endpoints: ['/mqtt/telemetry', '/stream/ringbuf', '/sensors/v2/stream', '/health/ping'],
  nodes: [
    {
      id: 'mqtt-ingress',
      name: 'mqtt-ingress',
      role: 'High-Throughput MQTT Ingest',
      port: 8080,
      status: 'HEALTHY',
      p99LatencyMs: 0.4,
      reqPerSec: 180,
      cpuUsage: 9.2,
      memoryUsage: 38,
      position: { x: 220, y: 240 },
    },
    {
      id: 'stream-forwarder',
      name: 'stream-forwarder',
      role: 'eBPF RingBuffer Forwarder',
      port: 8088,
      status: 'HEALTHY',
      p99LatencyMs: 0.6,
      reqPerSec: 180,
      cpuUsage: 14.1,
      memoryUsage: 42,
      position: { x: 560, y: 240 },
    },
  ],
  edges: [
    {
      id: 'e-mqtt-forwarder',
      source: 'mqtt-ingress',
      target: 'stream-forwarder',
      label: 'UNIX Socket 0.2ms',
      protocol: 'UNIX Domain Socket',
      latencyMs: 0.2,
    },
  ],
  attackConfig: {
    compromisedNodeId: 'mqtt-ingress',
    targetNodeId: 'stream-forwarder',
    rogueEdgeLabel: 'ROGUE BUFFER EXFIL (0.978)',
    alertId: 'alt-edge-iot-381b',
    alertDescription: 'Patient Zero: mqtt-ingress:8080 attempted unauthorized direct socket tap to stream-forwarder:8088 ringbuffer without mTLS handshake.',
    rogueEndpoint: '/internal/raw_bpf_map',
  },
  chaosConfig: {
    culpritNodeId: 'stream-forwarder',
    victimNodeIds: ['mqtt-ingress'],
    culpritLatencyMs: 1420.0,
    victimLatencyMs: 1650.0,
    alertId: 'alt-edge-chaos-672d',
    alertDescription: 'GAT RCA backward traversal identified stream-forwarder:8088 as root bottleneck (backpressure delay 1,420ms). mqtt-ingress is stalled waiting on kernel ringbuffer.',
    symptomEndpoint: '/mqtt/telemetry',
  },
};

// Map of predefined configurations (Only the Testbed cluster is pre-populated)
const PREDEFINED_TOPOLOGIES: Record<string, ProjectTopologyConfig> = {
  'mock-amazon-cluster': MOCK_AMAZON_TOPOLOGY,
};

/**
 * Generates an initial clean topology for any custom or non-testbed project.
 * Nodes and edges start as strictly EMPTY until genuine watchdog telemetry is ingested.
 */
export function generateDynamicTopology(
  projectId: string,
  projectName?: string,
  environment?: string
): ProjectTopologyConfig {
  const sanitizedId = projectId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const displayName = projectName || projectId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const env = environment || 'Docker Compose (autotrace-mesh)';
  const meshNet = `${sanitizedId.replace(/-mesh$/, '')}-mesh`;

  // Deterministic token generation
  const hash = Math.abs(
    projectId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  );
  const watchdogToken = `atk_live_${sanitizedId.replace(/-/g, '_')}_${(hash % 9000) + 1000}`;
  const hostname = `node-${sanitizedId.slice(0, 14)}-01`;

  // STRICTLY EMPTY: Nodes and edges must be built ONLY from ingested watchdog spans!
  const nodes: ServiceNode[] = [];
  const edges: ServiceEdge[] = [];

  return {
    projectId,
    projectName: displayName,
    environment: env,
    meshNetwork: meshNet,
    watchdogToken,
    watchdogAgent: {
      agentId: `autotrace-watchdog-${sanitizedId.slice(0, 8)}`,
      hostname,
      version: 'v1.2.0',
      status: 'STANDBY',
      socketCount: 0,
      eventsPerSec: 0,
      token: watchdogToken,
    },
    defaultSelectedNodeId: '',
    endpoints: [],
    nodes,
    edges,
    attackConfig: {
      compromisedNodeId: '',
      targetNodeId: '',
      rogueEdgeLabel: 'ROGUE DIRECT CALL (0.975)',
      alertId: `alt-${sanitizedId.slice(0, 6)}-sec-${hash % 1000}`,
      alertDescription: 'Awaiting microservice spans to establish baseline matrix A_base.',
      rogueEndpoint: '/internal/unauthorized_tap',
    },
    chaosConfig: {
      culpritNodeId: '',
      victimNodeIds: [],
      culpritLatencyMs: 0,
      victimLatencyMs: 0,
      alertId: `alt-${sanitizedId.slice(0, 6)}-chaos-${hash % 1000}`,
      alertDescription: 'Awaiting microservice spans for GAT causal traversal.',
      symptomEndpoint: '',
    },
  };
}

/**
 * Returns the topology configuration for a given projectId.
 * Prioritizes predefined testbed, then checks custom projects stored in localStorage or store,
 * and falls back to a clean dynamic project topology.
 */
export function getProjectTopology(projectId: string): ProjectTopologyConfig {
  if (PREDEFINED_TOPOLOGIES[projectId]) {
    return PREDEFINED_TOPOLOGIES[projectId];
  }

  // Check localStorage if available in browser
  if (typeof window !== 'undefined') {
    try {
      const storedJson = localStorage.getItem('autotrace_custom_projects');
      if (storedJson) {
        const storedProjects: CustomProjectStored[] = JSON.parse(storedJson);
        const match = storedProjects.find(
          (p) => p.id === projectId || p.name.toLowerCase().replace(/\s+/g, '-') === projectId
        );
        if (match) {
          return generateDynamicTopology(
            match.id,
            match.name,
            match.environment
          );
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Clean fallback (0 nodes, awaiting watchdog)
  return generateDynamicTopology(projectId);
}
