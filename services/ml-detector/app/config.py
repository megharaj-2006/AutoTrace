"""Central configuration. Override with environment variables (prefix ML_)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BASELINE_PATH = Path(os.getenv("ML_BASELINE_PATH", ROOT / "data" / "baseline.json"))

# Threat score above which Member 2 should call Member 4's /api/v1/quarantine.
# Taken from the architecture doc: "Threat Score > 0.90".
QUARANTINE_THRESHOLD = float(os.getenv("ML_QUARANTINE_THRESHOLD", "0.90"))

# Edges seen fewer than this many times in the baseline are treated as "weakly known".
MIN_EDGE_SUPPORT = int(os.getenv("ML_MIN_EDGE_SUPPORT", "30"))

# Per-node sensitivity (0..1). A rogue edge INTO a sensitive node scores higher.
# Unknown nodes default to NODE_CRITICALITY_DEFAULT.
NODE_CRITICALITY = {
    "payment-vault": 1.0,
    "order-service": 0.6,
    "gateway-service": 0.3,
    "reviews-service": 0.2,
}
NODE_CRITICALITY_DEFAULT = 0.5

# Statistical (known-edge) scoring.
Z_LATENCY_HALF = 6.0    # robust z at which latency anomaly score reaches 0.5
Z_ENTROPY_HALF = 5.0    # robust z at which entropy anomaly score reaches 0.5
LATENCY_SCORE_CAP = 0.60  # degradation alone must never trigger quarantine (it is a RCA case)
ENTROPY_SCORE_CAP = 0.97  # high-entropy payload on a known edge is a possible exfil signal

# RCA.
RCA_EDGE_ANOMALY_THRESHOLD = float(os.getenv("ML_RCA_EDGE_THRESHOLD", "0.35"))
