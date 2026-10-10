"""FastAPI inference service for the ML Detector (frozen port 8000)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from models.baseline import Baseline, build_baseline
from models.features import EdgeWindow
from models.rca import analyse
from models.scorer import score_edge
from models.synth import benign_windows
from src import config as C
from src.schemas import RcaRequest, RcaResponse, ScoreEdgeRequest, ScoreEdgeResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("ml-detector")

_state: dict = {"baseline": None, "source": "none"}


def _load_baseline() -> None:
    """Load A_base once at startup. Fail fast when it is missing (AGENTS.md section 20)."""
    if C.BASELINE_PATH.exists():
        _state["baseline"] = Baseline.load(C.BASELINE_PATH)
        _state["source"] = str(C.BASELINE_PATH.name)
    elif C.ALLOW_SYNTHETIC_BASELINE:
        log.warning("baseline file missing; using SYNTHETIC baseline (ML_ALLOW_SYNTHETIC_BASELINE=true)")
        _state["baseline"] = build_baseline(benign_windows(200))
        _state["source"] = "synthetic"
    else:
        raise RuntimeError(
            f"Baseline not found at {C.BASELINE_PATH}. Generate it with "
            "scripts/generate_baseline.py or set ML_BASELINE_PATH.")
    b = _state["baseline"]
    log.info("baseline loaded (%s): nodes=%s authorised_edges=%d threshold=%.2f",
             _state["source"], b.nodes, int(b.adjacency().sum()), C.ANOMALY_THRESHOLD)


@asynccontextmanager
async def lifespan(_: FastAPI):
    _load_baseline()
    yield


app = FastAPI(title="AutoTrace-Sec ML Detector", version="0.2.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
    log.exception("unhandled error")  # details stay in the log, never in the response
    return JSONResponse(status_code=500, content={"error": "internal_error"})


def _base() -> Baseline:
    if _state["baseline"] is None:
        raise HTTPException(status_code=503, detail="baseline not loaded")
    return _state["baseline"]


@app.get("/health")
def health() -> dict:
    b = _base()
    return {"status": "HEALTHY", "service": "ml-detector", "baseline": _state["source"],
            "nodes": b.nodes}


@app.post("/api/v1/score-edge", response_model=ScoreEdgeResponse)
def score_edge_endpoint(req: ScoreEdgeRequest) -> ScoreEdgeResponse:
    v = score_edge(_base(), req.source, req.target, req.features.to_model())
    if v.is_anomalous:
        log.warning("ANOMALY %s -> %s type=%s confidence=%.2f (%.3f ms)",
                    v.source, v.target, v.anomaly_type, v.confidence, v.inference_ms)
    else:
        log.debug("%s -> %s confidence=%.2f", v.source, v.target, v.confidence)
    return ScoreEdgeResponse(**vars(v))


@app.post("/api/v1/rca", response_model=RcaResponse)
def rca_endpoint(req: RcaRequest) -> RcaResponse:
    windows = [EdgeWindow(e.source, e.target, e.features.to_model()) for e in req.edges]
    result = analyse(_base(), windows, req.window_id)
    log.info("RCA window=%s roots=%s", req.window_id, [r["node"] for r in result["root_causes"]])
    return RcaResponse(**result)
