"""Runtime configuration, read from environment variables with safe defaults.

Document any new variable in infra/env.example (owned by Member 1).
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BASELINE_PATH = Path(os.getenv("ML_BASELINE_PATH", ROOT / "data" / "baseline.json"))

# Demo/dev escape hatch. Default is fail-fast: a missing baseline stops the service at startup.
ALLOW_SYNTHETIC_BASELINE = os.getenv("ML_ALLOW_SYNTHETIC_BASELINE", "false").lower() == "true"

# Confidence at or above which is_anomalous is true (graph-engine then calls the actuator).
ANOMALY_THRESHOLD = float(os.getenv("ML_ANOMALY_THRESHOLD", "0.90"))
DEGRADED_THRESHOLD = float(os.getenv("ML_DEGRADED_THRESHOLD", "0.35"))

# An edge seen in fewer baseline windows than this is only "weakly known".
MIN_EDGE_SUPPORT = int(os.getenv("ML_MIN_EDGE_SUPPORT", "30"))

# Edge anomaly (0..1) at which RCA treats an edge as unhealthy.
RCA_EDGE_THRESHOLD = float(os.getenv("ML_RCA_EDGE_THRESHOLD", "0.35"))

# Sensitivity of each node (0..1): a rogue edge INTO a sensitive node scores higher.
NODE_CRITICALITY = {
    "payment-vault": 1.0,
    "order-service": 0.6,
    "gateway-service": 0.3,
    "reviews-service": 0.2,
    "external-client": 0.1,
}
NODE_CRITICALITY_DEFAULT = 0.5

# Statistical scoring of edges that ARE in the baseline.
Z_LATENCY_HALF = 6.0      # robust z at which the latency anomaly score reaches 0.5
Z_ENTROPY_HALF = 5.0
LATENCY_SCORE_CAP = 0.60  # slowness alone is a root-cause problem, never a quarantine
ENTROPY_SCORE_CAP = 0.97
# Payload entropy only counts as exfiltration-like above these absolute levels (bits/byte).
# JSON/text is ~4-5; compressed or encrypted data is ~7.5+. Stops a legitimate new POST
# body on a known edge (baseline entropy 0.0 for empty GETs) from being quarantined.
ENTROPY_GATE_LOW = 5.5
ENTROPY_GATE_FULL = 7.0
