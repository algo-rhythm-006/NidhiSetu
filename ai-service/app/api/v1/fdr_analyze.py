"""
app/api/v1/fdr_analyze.py — Feature A
POST /api/v1/fdr/analyze

Receives an FDR image/PDF from the Java backend, runs Qwen2.5-VL-3B
visual extraction, then validates the maturity math. Returns structured JSON.

Full implementation: see app/services/fdr_analyzer.py
"""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.ml_models.model_manager import model_manager
from app.schemas.fdr_analyze import FDRAnalyzeResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/analyze",
    response_model=FDRAnalyzeResponse,
    summary="Visual FDR extraction + math verification",
    response_description="Extracted fields, math check result, and confidence scores.",
)
async def analyze_fdr(
    file: UploadFile = File(..., description="FDR image (JPEG/PNG) or PDF"),
    document_id: str = Form(..., description="Unique document identifier from Java backend"),
    requested_by: str = Form(default="system", description="Requesting user's email or ID"),
):
    """
    **Feature A — Zero-Trust Visual Extraction & Math Verification**

    1. Accepts a scanned FDR image or PDF via multipart/form-data.
    2. Acquires the GPU lock and loads Qwen2.5-VL-3B into VRAM.
    3. Runs visual extraction to identify all key FDR fields.
    4. Verifies the printed maturity amount against compound interest formula.
    5. Returns structured JSON including a tamper flag if math fails.
    """
    t_start = time.perf_counter()

    # Read file bytes
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    logger.info(
        "[/fdr/analyze] Received document_id=%s | file=%s | size=%d bytes | by=%s",
        document_id,
        file.filename,
        len(file_bytes),
        requested_by,
    )

    # Acquire GPU lock — blocks if NL2SQL is currently using GPU
    await model_manager.acquire_qwen()
    try:
        from app.services.fdr_analyzer import run_fdr_analysis

        response = await run_fdr_analysis(
            file_bytes=file_bytes,
            filename=file.filename or "upload",
            document_id=document_id,
            model=model_manager.qwen_model,
            processor=model_manager.qwen_processor,
        )
    finally:
        # ALWAYS release — even on exception — to prevent GPU deadlock
        model_manager.release()

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    logger.info(
        "[/fdr/analyze] Completed document_id=%s in %dms | status=%s",
        document_id,
        elapsed_ms,
        response.status,
    )
    return response
