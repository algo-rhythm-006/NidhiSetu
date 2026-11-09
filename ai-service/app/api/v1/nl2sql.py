"""
app/api/v1/nl2sql.py — Feature C
POST /api/v1/search/nl2sql

Accepts a natural language query + PostgreSQL schema from the Java backend.
Uses Llama 3.2 (via Ollama) to generate a safe, read-only SELECT statement.
Acquires GPU lock to ensure Qwen is evicted before Ollama claims VRAM.

Full implementation: see app/services/nl2sql_service.py
"""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, HTTPException

from app.ml_models.model_manager import model_manager
from app.schemas.nl2sql import NL2SQLRequest, NL2SQLResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/nl2sql",
    response_model=NL2SQLResponse,
    summary="Natural language → safe PostgreSQL SELECT",
    response_description="Generated SQL, plain-English explanation, and safety audit.",
)
async def natural_language_to_sql(request: NL2SQLRequest):
    """
    **Feature C — NL2SQL Administrative Copilot**

    1. Receives a natural language query and PostgreSQL DDL schema.
    2. Acquires GPU lock (evicts Qwen if loaded) to free VRAM for Ollama.
    3. Calls Llama 3.2 3B (via Ollama) with a strict read-only SQL prompt.
    4. Runs a safety audit on the generated SQL (rejects any non-SELECT).
    5. Returns the SQL and a plain-English explanation.

    **IMPORTANT**: This endpoint only *generates* SQL. The Java backend is
    responsible for executing it against PostgreSQL using parameterized queries.
    Never execute user-supplied SQL directly.
    """
    t_start = time.perf_counter()

    logger.info(
        "[/search/nl2sql] Query: '%s…' (first 80 chars)",
        request.query[:80],
    )

    # Acquire GPU lock — ensures Qwen is evicted from VRAM before Ollama starts
    await model_manager.acquire_llama()
    try:
        from app.services.nl2sql_service import run_nl2sql_chain

        result = await run_nl2sql_chain(request)
    finally:
        # Always release the GPU lock
        model_manager.release()

    if result["query_type"] == "UNSUPPORTED":
        logger.warning(
            "[/search/nl2sql] LLM generated unsafe SQL. Safety check failed. "
            "Returning error to Java backend."
        )
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Generated SQL failed safety check — non-SELECT statement detected.",
                "safety_check": result["safety_check"],
                "raw_sql": result["generated_sql"],
            },
        )

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    logger.info(
        "[/search/nl2sql] Completed in %dms | safe=%s",
        elapsed_ms,
        result["safety_check"]["passed"],
    )

    return NL2SQLResponse(
        original_query=request.query,
        generated_sql=result["generated_sql"],
        query_type=result["query_type"],
        explanation=result["explanation"],
        safety_check=result["safety_check"],
        model_used=result["model_used"],
        processing_time_ms=result["processing_time_ms"],
    )
