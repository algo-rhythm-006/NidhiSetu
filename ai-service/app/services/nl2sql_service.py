"""
app/services/nl2sql_service.py — Nidhi-Setu AI Microservice
=============================================================
Business logic orchestrator for Feature C: NL2SQL Administrative Copilot.

CALL CHAIN
----------
  Router (nl2sql.py)
    └─► run_nl2sql_chain()                         ← this file
          ├─► llama_nl2sql.build_nl2sql_chain()    ← builds LangChain chain
          ├─► llama_nl2sql.run_nl2sql_inference()  ← calls Ollama
          └─► returns dict for router to wrap in NL2SQLResponse

TENACITY RETRY STRATEGY
------------------------
  Ollama is a local server. On first call after a long idle, it may take
  2–5 seconds to load the model into memory. We use tenacity to retry up to
  3 times with exponential backoff before giving up and returning HTTP 503.

  The retry decorator targets ConnectionError and httpx.ReadTimeout — both
  are transient Ollama startup symptoms, not logic errors.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from app.schemas.nl2sql import NL2SQLRequest

logger = logging.getLogger(__name__)


# =============================================================================
# Public entry point (called from async router)
# =============================================================================

async def run_nl2sql_chain(request: NL2SQLRequest) -> dict[str, Any]:
    """
    Async entry point: runs NL2SQL inference via Ollama in a thread pool.

    The actual LangChain → Ollama call is blocking (synchronous HTTP under
    the hood). We wrap it in asyncio.to_thread so the FastAPI event loop
    remains responsive to other concurrent requests (e.g. ELA forensics).

    Args:
        request: NL2SQLRequest Pydantic model from the router.

    Returns:
        Dict matching NL2SQLResponse fields (minus original_query).

    Raises:
        RuntimeError: If Ollama is unreachable after all retries.
    """
    return await asyncio.to_thread(_run_sync, request)


# =============================================================================
# Private: synchronous inference (runs in thread pool)
# =============================================================================

def _run_sync(request: NL2SQLRequest) -> dict[str, Any]:
    """
    Builds the LangChain chain and invokes it synchronously.
    Wrapped by tenacity for Ollama cold-start resilience.
    """
    from app.config import settings
    from app.ml_models.llama_nl2sql import build_nl2sql_chain, run_nl2sql_inference

    chain = build_nl2sql_chain(
        ollama_base_url=settings.ollama_base_url,
        model_name=settings.llama_model_name,
    )

    result = _invoke_with_retry(chain, request)
    return result


@retry(
    retry=retry_if_exception_type((ConnectionError, OSError, RuntimeError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def _invoke_with_retry(chain: Any, request: NL2SQLRequest) -> dict[str, Any]:
    """
    Calls Ollama via LangChain with tenacity retry on transient errors.

    Retry triggers on:
      - ConnectionError → Ollama not started yet
      - OSError         → Socket-level failure
      - RuntimeError    → Raised by run_nl2sql_inference on Ollama HTTP error

    Does NOT retry on:
      - ValueError      → Bad input (e.g. prompt injection caught by validator)
      - AssertionError  → Logic error in our code
    """
    from app.config import settings
    from app.ml_models.llama_nl2sql import run_nl2sql_inference

    return run_nl2sql_inference(
        chain=chain,
        question=request.query,
        schema=request.schema_context,
        max_rows=request.max_rows_hint,
        model_name=settings.llama_model_name,
    )
