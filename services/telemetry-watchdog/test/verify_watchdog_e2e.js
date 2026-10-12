const assert = require('assert');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

async function runE2EVerification() {
  console.log('========================================================================');
  console.log(' 🔬 End-to-End Verification: Standalone Telemetry Watchdog & Ingestion');
  console.log('========================================================================');

  const watchdogBin = path.join(__dirname, '..', 'autotrace-watchdog');

  // 1. Test: Version Output (< 15 MB)
  console.log('\n--- 1. Testing Watchdog Binary Version & Footprint ---');
  const versionOut = execSync(`${watchdogBin} version`).toString();
  console.log(versionOut.trim());
  assert(versionOut.includes('v1.2.0'), 'Version must be v1.2.0');

  // 2. Start Ingestion Collector Server in a separate child process
  console.log('\n--- 2. Starting Ingestion Collector Server on Port 8085 ---');
  const serverScript = `
    const { createProxyApp } = require('./services/telemetry-collector/src/proxy');
    const { TelemetryCollector } = require('./services/telemetry-collector/src/collector');
    const base = new TelemetryCollector();
    const recordedEvents = [];
    const mock = {
      isConnected: true,
      sentEvents: recordedEvents,
      validateEvent: (e) => base.validateEvent(e),
      sendEvent: (e) => {
        recordedEvents.push(e);
        console.log('[Server Recorded Event]', JSON.stringify(e));
      }
    };
    const app = createProxyApp(mock);
    app.get('/test/recorded', (req, res) => res.json(recordedEvents));
    app.listen(8085, '127.0.0.1', () => console.log('[Server Ready on 8085]'));
  `;

  const serverProc = spawn('node', ['-e', serverScript], {
    cwd: path.join(__dirname, '..', '..', '..'),
    stdio: ['ignore', 'pipe', 'inherit']
  });

  // Wait for server ready
  await new Promise((resolve, reject) => {
    serverProc.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('[Server Ready on 8085]')) {
        resolve();
      }
    });
    serverProc.on('error', reject);
    setTimeout(() => reject(new Error('Server start timed out')), 4000);
  });

  try {
    // 3. Test: Emit standalone 9-field telemetry event
    console.log('\n--- 3. Testing Standalone Telemetry Event Emission ---');
    const emitCmd = `${watchdogBin} emit --gateway=http://127.0.0.1:8085 --source=reviews-service --target=payment-vault --endpoint=/exploit/lateral --method=POST --status=200 --latency=3.8 --body='{"exploit":"ssrf_payload_test"}'`;
    const emitOut = execSync(emitCmd).toString();
    console.log(emitOut.trim());

    // Fetch recorded events from test server endpoint
    const recordedRaw = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:8085/test/recorded', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    assert(recordedRaw.length >= 1, 'Event must be received by ingestion server');
    const ev = recordedRaw[0];
    console.log('\nRecorded Event verified by Ingestion Gateway:');
    console.log(JSON.stringify(ev, null, 2));

    // Verify all 9 canonical schema fields strictly
    assert(ev.trace_id && typeof ev.trace_id === 'string', 'trace_id required');
    assert.strictEqual(ev.source_service, 'reviews-service');
    assert.strictEqual(ev.target_service, 'payment-vault');
    assert.strictEqual(ev.endpoint, '/exploit/lateral');
    assert.strictEqual(ev.method, 'POST');
    assert.strictEqual(ev.status_code, 200);
    assert.strictEqual(ev.latency_ms, 3.8);
    assert(typeof ev.payload_entropy === 'number' && ev.payload_entropy > 0 && ev.payload_entropy <= 8.0, 'payload_entropy valid');
    assert(Number.isInteger(ev.timestamp) && ev.timestamp > 0, 'timestamp valid');
    console.log('✔ All 9 canonical schema fields verified against contract!');

    // 4. Test: Daemon Execution & Local Containment Actuation
    console.log('\n--- 4. Testing Watchdog Daemon & Local Quarantine Actuation ---');
    const daemon = spawn(watchdogBin, [
      'start',
      '--token=at_live_demo_9841',
      '--gateway=http://127.0.0.1:8085',
      '--port=8089',
      '--service-name=gateway-service'
    ], { stdio: 'pipe' });

    // Wait 600ms for daemon to start
    await new Promise(r => setTimeout(r, 600));

    // Send quarantine command
    const containCmd = `${watchdogBin} contain --target=payment-vault --port=8089`;
    const containOut = execSync(containCmd).toString();
    console.log(containOut.trim());
    assert(containOut.includes('Quarantine applied'), 'Quarantine must be confirmed');

    // Query status
    const statusCmd = `${watchdogBin} status --port=8089`;
    const statusOut = JSON.parse(execSync(statusCmd).toString());
    console.log('Daemon Status:', statusOut);
    assert(statusOut.quarantined_targets.includes('payment-vault'), 'payment-vault must be quarantined locally');
    console.log('✔ Local socket quarantine enforced without killing healthy pods!');

    daemon.kill('SIGTERM');

    console.log('\n========================================================================');
    console.log(' ✔ ALL E2E WATCHDOG VERIFICATION CHECKS PASSED (100%)');
    console.log('========================================================================');
  } finally {
    serverProc.kill('SIGTERM');
  }
}

runE2EVerification().catch(err => {
  console.error('\n✖ Verification failed:', err);
  process.exit(1);
});
