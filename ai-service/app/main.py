"""
app/main.py — Nidhi-Setu AI Microservice
==========================================
FastAPI application factory.

Responsibilities:
  - App creation with title, version, and OpenAPI metadata
  - Lifespan context: startup health checks (Ollama, CUDA) + graceful shutdown
  - Middleware: CORS and X-Internal-Token zero-trust auth
  - Router mounting: /api/v1/*
  - /health probe endpoint (used by Java backend's readiness check)

Run locally:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Run in production (air-gapped server):
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
    (IMPORTANT: use exactly 1 worker — the ModelManager singleton is
     not safe across multiple OS processes sharing the same GPU)
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import httpx
import structlog
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.ml_models.model_manager import model_manager
from app.utils.security import InternalTokenMiddleware

# =============================================================================
# Logging — structured JSON output for production log aggregators
# =============================================================================

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",   # structlog already formats the full line
)
logger = logging.getLogger(__name__)


# =============================================================================
# Lifespan — startup / shutdown logic
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager (replaces deprecated @app.on_event).

    STARTUP:
      1. Log CUDA / VRAM availability so the team knows the GPU is visible.
      2. Ping Ollama to confirm it is running before accepting traffic.
         (NL2SQL requests will fail hard if Ollama is down.)

    SHUTDOWN:
      1. Gracefully evict any resident model from VRAM.
         Prevents CUDA context leaks if the process is restarted quickly.
    """

    # ── STARTUP ──────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("  Nidhi-Setu AI Microservice — STARTING UP")
    logger.info("=" * 60)

    # 1. CUDA / VRAM diagnostics
    vram = model_manager.get_vram_stats()
    if vram.get("cuda_available"):
        logger.info(
            "[Startup] GPU: %s | Total VRAM: %.2f GB",
            vram.get("device_name"),
            vram.get("total_gb"),
        )
    else:
        logger.warning(
            "[Startup] CUDA not available — running on CPU. "
            "Qwen2.5-VL inference will be extremely slow."
        )

    # 2. Ollama connectivity check
    ollama_ok = await _check_ollama(settings.ollama_base_url)
    if ollama_ok:
        logger.info(
            "[Startup] Ollama reachable at %s ✓  (model: %s)",
            settings.ollama_base_url,
            settings.llama_model_name,
        )
    else:
        logger.warning(
            "[Startup] ⚠ Ollama NOT reachable at %s. "
            "POST /api/v1/search/nl2sql will fail until Ollama is started.",
            settings.ollama_base_url,
        )

    logger.info("[Startup] Ready to accept requests.")
    logger.info("-" * 60)

    # ── Hand control to FastAPI (runs the application) ──────────────────────
    yield

    # ── SHUTDOWN ─────────────────────────────────────────────────────────────
    logger.info("[Shutdown] Nidhi-Setu AI Microservice shutting down…")
    await model_manager.shutdown()
    logger.info("[Shutdown] Complete. Goodbye.")


async def _check_ollama(base_url: str) -> bool:
    """
    Async health-check for Ollama. Returns True if reachable, False otherwise.
    Uses a short 5-second timeout so startup is not blocked if Ollama is down.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{base_url}/api/tags")
            response.raise_for_status()
            return True
    except Exception:
        return False


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="Nidhi-Setu AI Microservice",
    description=(
        "Zero-trust AI/ML service for FDR (Fixed Deposit Receipt) document processing. "
        "Features: Visual Extraction (Qwen2.5-VL-3B), ELA Forensics (OpenCV), "
        "NL2SQL Copilot (Llama 3.2 via Ollama). "
        "Built for Smart India Hackathon 2026 — AICTE FDR Portal."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # OpenAPI endpoints (disable in production if air-gapped)
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# =============================================================================
# Middleware (order matters — applied bottom-up in FastAPI/Starlette)
# =============================================================================

# 1. CORS — must be outermost to handle preflight OPTIONS requests correctly
# allow_origins="*" for local development/testing (tester.html opens from file:// or localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Open for dev — restrict to settings.allowed_origins in production
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 2. Zero-trust internal auth — applied after CORS
#    Rejects any request without a valid X-Internal-Token header.
#    Health endpoint is whitelisted so Java readiness probes work without auth.
app.add_middleware(
    InternalTokenMiddleware,
    token=settings.internal_api_token,
)


# =============================================================================
# Routers
# =============================================================================

# Import here (after app creation) to avoid circular imports
from app.api.v1.router import v1_router  # noqa: E402

app.include_router(v1_router, prefix="/api/v1")


# =============================================================================
# Tester UI — serve tester.html at http://localhost:8000/tester
# =============================================================================

@app.get(
    "/tester",
    include_in_schema=False,  # Hide from Swagger docs
)
async def serve_tester():
    """Serves the standalone HTML test UI from the project root or ai-service root."""
    import pathlib
    # Check inside ai-service/ first, then fall back to parent directory
    base_dir = pathlib.Path(__file__).parent.parent
    candidates = [
        base_dir / "tester.html",
        base_dir.parent / "tester.html",
    ]
    for p in candidates:
        if p.exists():
            return FileResponse(p, media_type="text/html")

    from fastapi import HTTPException
    raise HTTPException(
        status_code=404,
        detail="tester.html not found in ai-service/ or repository root.",
    )


# =============================================================================
# Health / Readiness Probe
# =============================================================================

@app.get(
    "/health",
    summary="Health & readiness probe",
    tags=["Infrastructure"],
    response_description="Service status and current VRAM state.",
)
async def health_check():
    """
    Lightweight health probe used by:
      - Java Spring Boot backend (readiness check before routing traffic)
      - Docker / Kubernetes liveness probes
      - Load balancers

    Does NOT require X-Internal-Token (whitelisted in InternalTokenMiddleware).
    Returns HTTP 200 if the service is running (even if models aren't loaded yet).
    """
    vram = model_manager.get_vram_stats()
    ollama_ok = await _check_ollama(settings.ollama_base_url)

    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "service": "Nidhi-Setu AI Microservice",
            "version": "1.0.0",
            "gpu": vram,
            "ollama_reachable": ollama_ok,
        },
    )
