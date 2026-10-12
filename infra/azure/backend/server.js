const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '8080', 10);
const REDPANDA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TOPIC_RAW = process.env.TELEMETRY_RAW_TOPIC || 'telemetry.raw';
const TOPIC_EVENTS = process.env.TELEMETRY_TOPIC || 'telemetry.events';

// -----------------------------------------------------------------------------
// 1. Relational Persistence: Cloud-Managed Supabase PostgreSQL
// -----------------------------------------------------------------------------
let pgPool = null;
let pgStatus = 'disconnected';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  try {
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
    pgPool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('[PostgreSQL] Supabase connection error:', err.message);
        pgStatus = 'error: ' + err.message;
      } else {
        console.log('[PostgreSQL] Connected to Supabase pooler at:', res.rows[0].now);
        pgStatus = 'connected';
        initDatabaseTables();
      }
    });
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize pool:', err.message);
    pgStatus = 'error: ' + err.message;
  }
} else {
  console.log('[PostgreSQL] No DATABASE_URL specified. Running in memory-only mode.');
}

async function initDatabaseTables() {
  if (!pgPool) return;
  const ddl = `
    CREATE TABLE IF NOT EXISTS telemetry_audit (
      id BIGSERIAL PRIMARY KEY,
      trace_id VARCHAR(64),
      source_service VARCHAR(128),
      target_service VARCHAR(128),
      endpoint VARCHAR(256),
      method VARCHAR(16),
      status_code INT,
      latency_ms NUMERIC,
      payload_entropy NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  try {
    await pgPool.query(ddl);
    console.log('[PostgreSQL] Telemetry audit schema initialized.');
  } catch (e) {
    console.warn('[PostgreSQL] Table init warning:', e.message);
  }
}

// -----------------------------------------------------------------------------
// 2. In-Memory Graph State
// -----------------------------------------------------------------------------
const inMemoryGraph = {
  nodes: new Map(),
  edges: new Map(),
};

function recordTelemetryEvent(event) {
  const src = event.source_service || event.source;
  const dst = event.target_service || event.target;
  if (!src || !dst) return;

  if (!inMemoryGraph.nodes.has(src)) inMemoryGraph.nodes.set(src, { id: src, label: src, role: 'microservice' });
  if (!inMemoryGraph.nodes.has(dst)) inMemoryGraph.nodes.set(dst, { id: dst, label: dst, role: 'microservice' });

  const edgeKey = `${src}->${dst}`;
  const existing = inMemoryGraph.edges.get(edgeKey) || {
    source: src,
    target: dst,
    calls: 0,
    lastSeen: Date.now(),
    avgLatency: 0,
    entropy: event.payload_entropy || 0,
  };
  existing.calls += 1;
  existing.lastSeen = Date.now();
  if (event.latency_ms) {
    existing.avgLatency = (existing.avgLatency + event.latency_ms) / 2;
  }
  if (event.payload_entropy) {
    existing.entropy = event.payload_entropy;
  }
  inMemoryGraph.edges.set(edgeKey, existing);

  // Asynchronously persist to Supabase PostgreSQL if pool is active
  if (pgPool && pgStatus === 'connected') {
    pgPool.query(
      `INSERT INTO telemetry_audit 
       (trace_id, source_service, target_service, endpoint, method, status_code, latency_ms, payload_entropy) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.trace_id || null,
        src,
        dst,
        event.endpoint || '/',
        event.method || 'GET',
        event.status_code || 200,
        event.latency_ms || 0,
        event.payload_entropy || 0,
      ]
    ).catch(() => {});
  }
}

// -----------------------------------------------------------------------------
// 3. Streaming Ingestion: Redpanda / Kafka Consumer & Producer
// -----------------------------------------------------------------------------
let kafkaStatus = 'disconnected';
const kafka = new Kafka({
  clientId: 'autotrace-azure-backend',
  brokers: [REDPANDA_BROKER],
  retry: { initialRetryTime: 300, retries: 5 },
});

const consumer = kafka.consumer({ groupId: 'autotrace-graph-engine-group' });

async function initKafka() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: [TOPIC_RAW, TOPIC_EVENTS], fromBeginning: false });
    kafkaStatus = 'connected';
    console.log(`[Redpanda] Subscribed to ${TOPIC_RAW} and ${TOPIC_EVENTS}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          recordTelemetryEvent(payload);
        } catch (e) {
          // ignore malformed raw packets
        }
      },
    });
  } catch (err) {
    kafkaStatus = 'offline: ' + err.message;
    console.warn('[Redpanda] Warning: Could not connect to broker at', REDPANDA_BROKER, '-', err.message);
  }
}

// -----------------------------------------------------------------------------
// 4. REST Endpoints
// -----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime_sec: Math.floor(process.uptime()),
    database: {
      provider: 'Supabase PostgreSQL',
      status: pgStatus,
    },
    streaming: {
      broker: REDPANDA_BROKER,
      status: kafkaStatus,
    },
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/telemetry', (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const evt of events) {
    recordTelemetryEvent(evt);
  }
  res.status(200).json({
    success: true,
    processed: events.length,
    graph: {
      nodes: inMemoryGraph.nodes.size,
      edges: inMemoryGraph.edges.size,
    },
  });
});

app.post('/api/v1/telemetry/record', (req, res) => {
  recordTelemetryEvent(req.body);
  res.status(200).json({ success: true, timestamp: Date.now() });
});

app.get('/api/graph', (req, res) => {
  res.status(200).json({
    nodes: Array.from(inMemoryGraph.nodes.values()),
    edges: Array.from(inMemoryGraph.edges.values()),
  });
});

app.post('/api/graph/reset', (req, res) => {
  inMemoryGraph.nodes.clear();
  inMemoryGraph.edges.clear();
  res.status(200).json({ success: true, message: 'Graph cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AutoTrace Azure Backend] Listening on port ${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/health`);
  console.log(`- REST Ingestion: http://localhost:${PORT}/api/telemetry`);
  console.log(`- Memory Limit: NODE_OPTIONS="--max-old-space-size=512"`);
  initKafka().catch(() => {});
});
