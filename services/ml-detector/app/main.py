"""FastAPI inference service. Port 8000 (fixed by the integration contract)."""
from __future__ import annotations

import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from . import config as C
from .baseline import Baseline, build_baseline
from .rca import analyse
from .schemas import RcaRequest, RcaResponse, ScoreEdgeRequest, ScoreEdgeResponse
from .scorer import score_edge
from .synth import benign_stream

log = logging.getLogger("ml-detector")


class State:
    baseline: Baseline | None = None
    lock = threading.Lock()
    source = "none"


state = State()


def load_baseline() -> None:
    with state.lock:
        if C.BASELINE_PATH.exists():
            state.baseline = Baseline.load(C.BASELINE_PATH)
            state.source = str(C.BASELINE_PATH)
        else:
            log.warning("no baseline at %s - using SYNTHETIC fallback. Run scripts/generate_baseline.py",
                        C.BASELINE_PATH)
            state.baseline = build_baseline(benign_stream(5000))
            state.source = "synthetic-fallback"


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_baseline()
    yield


app = FastAPI(title="AutoTrace-Sec ML Detector", version="0.1.0", lifespan=lifespan)


def _base() -> Baseline:
    if state.baseline is None:
        raise HTTPException(503, "baseline not loaded")
    return state.baseline


@app.get("/health")
def health() -> dict:
    b = _base()
    return {
        "status": "ok",
        "baseline_source": state.source,
        "nodes": b.nodes,
        "authorised_edges": int(b.adjacency().sum()),
        "quarantine_threshold": C.QUARANTINE_THRESHOLD,
    }


@app.post("/api/v1/score-edge", response_model=ScoreEdgeResponse)
def score_edge_endpoint(req: ScoreEdgeRequest) -> ScoreEdgeResponse:
    return score_edge(_base(), req)


@app.post("/api/v1/rca", response_model=RcaResponse)
def rca_endpoint(req: RcaRequest) -> RcaResponse:
    return analyse(_base(), req)


@app.get("/api/v1/baseline")
def baseline_matrix() -> dict:
    """A_base for the dashboard / debugging (Member 2 may use it to pre-draw authorised edges)."""
    b = _base()
    return {"nodes": b.nodes, "adjacency": b.adjacency().tolist(), "counts": b.counts.tolist()}


@app.post("/api/v1/baseline/reload")
def reload_baseline() -> dict:
    load_baseline()
    return {"status": "reloaded", "source": state.source}
