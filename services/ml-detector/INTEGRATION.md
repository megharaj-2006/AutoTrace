# ml-detector (Member 3) - integration guide

Owns `services/ml-detector/` only. No other directory is touched, so there are no file-level
merge conflicts. Everything below is about **contracts** - where the four members' code must agree.

## Run

```bash
cd services/ml-detector
uv pip install -e ".[dev]"            # or: pip install -e ".[dev]"
python scripts/generate_baseline.py --synthetic 5000     # or --input traces.jsonl
uvicorn app.main:app --port 8000
pytest && python benchmarks/evaluate.py
python scripts/export_openapi.py ../../shared/schemas/ml-detector-openapi.json
```
If `data/baseline.json` is missing the service starts with a synthetic baseline and logs a warning.

## API (port 8000)

### POST /api/v1/score-edge   (caller: Member 2)
```json
{"source":"reviews-service","target":"payment-vault","latency_ms":30,"status":200,"entropy":6.5}
```
`latency` is accepted as an alias for `latency_ms`; `status` may be int or string. Response:
```json
{"source":"reviews-service","target":"payment-vault","threat_score":0.99,
 "is_rogue_edge":true,"verdict":"quarantine","quarantine_target":"reviews-service",
 "reason":"unauthorised edge reviews-service -> payment-vault: not present in baseline A_base",
 "components":{"structural":1.0,"latency":0,"entropy":0,"status":0,"target_criticality":1.0},
 "inference_ms":0.06}
```
`verdict`: `allow` (<0.35), `degraded` (0.35-0.90, send to /rca), `quarantine` (>=0.90).

### POST /api/v1/rca   (caller: Member 2)
Body: `{"window_id":"w42","edges":[ <same edge objects as above> ]}`. Response has
`root_causes[]`, `victims[]`, `healthy[]`, `anomalous_edges[]`, `causal_paths[]`.

Also: `GET /health`, `GET /api/v1/baseline` (A_base for the UI), `POST /api/v1/baseline/reload`.

## What each member must do for this to merge cleanly

| Member | Needs to agree on | Action |
|---|---|---|
| **M1** | `shared/schemas/telemetry-event.json` field names | I only saw "(source, target, latency, status, entropy)". Send me the real schema; I accept `latency`/`latency_ms`/`latencyMs` and int/str `status` today. |
| **M1** | Service names | Must be exactly `gateway-service`, `order-service`, `reviews-service`, `payment-vault` in `source`/`target`. Anything else is treated as an unknown node and scored as rogue. |
| **M1** | Baseline traces | Dump benign `telemetry.events` to JSONL (1-2k events/edge, no attacks/chaos) so I can replace the synthetic baseline. |
| **M1** | Compose | Add this service to `infra/docker-compose.yml` (M1 owns that file): `ml-detector: {build: ../services/ml-detector, ports: ["8000:8000"], networks: [autotrace-mesh]}` |
| **M2** | Granularity | Send **per-event** observations to `/score-edge` (baseline is per-event). If you send 5s window averages, tell me and I will build the baseline from windows too. |
| **M2** | Who calls quarantine | The doc says M2 "dispatches breach alerts to Member 4". I only return a verdict; M2 should call `POST :8081/api/v1/quarantine` when `verdict == "quarantine"`. |
| **M2** | Timeouts | Use a ~100 ms client timeout; server time is <1 ms. On timeout, fail open (do not block ingestion). |
| **M2** | Dedup | Cache verdicts per `(source,target)` for a few seconds so a rogue edge does not fire hundreds of quarantines. |
| **M4** | Quarantine payload | Not defined in the doc. Proposed: `{"node":"reviews-service","reason":"...","threat_score":0.98,"edge":{"source":"...","target":"..."}}`. M4 confirm or change; M2 builds it from my response. |
| **M4** | Service vs container name | `quarantine_target` is the **service name**. M4 must map it to the container (compose service / `autotrace-mesh` IP). |
| **M4** | Attack realism | `trigger_lateral_exploit.sh` must call payment-vault **from reviews-service** so telemetry shows `reviews-service -> payment-vault`. Chaos scripts should add latency/5xx only (no new edges) so they land in RCA, not quarantine. |
| **M4** | Don't quarantine the victim | Quarantine only `quarantine_target` (the caller of the rogue edge), never the callee `payment-vault`. |
| All | Dashboard | M2 forwards `threat_score`, `verdict`, `root_causes` inside `TopologyFrame`; agree the frame field names with M2/M1/M4 before Sunday. |

## Detection behaviour (for the presentation)

- **Rogue edge**: pair absent from A_base -> threat 0.92-1.0 (highest into `payment-vault`).
- **Exfiltration on an allowed edge**: payload-entropy spike vs baseline (robust z-score) -> up to 0.97.
- **Latency / 5xx** on known edges: capped at 0.60, so chaos is `degraded`, never quarantined.
- **RCA**: anomalous-edge subgraph; sinks (callees with healthy downstream) are root causes, nodes above them are cascading victims. Chosen over a trained GAT: deterministic, needs no labelled failures, <1 ms.

## Honest limitations
- Benchmark numbers come from **synthetic** traffic that I generated; re-run on M1's real traces before claiming them.
- Rogue-edge recall is high partly by construction (any unseen pair is flagged). Real-world risk is false positives from legitimate new edges; the baseline must cover all normal paths.
- Baseline is static; `POST /api/v1/baseline/reload` after regenerating.
