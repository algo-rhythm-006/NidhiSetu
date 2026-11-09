"""
app/api/v1/fdr_forensics.py — Feature B
POST /api/v1/fdr/forensics

Receives an FDR image and runs the OpenCV Error Level Analysis (ELA)
pipeline entirely on CPU. Returns tamper probability + bounding boxes.
No GPU lock required — can run concurrently with other requests.

Full implementation: see app/services/forensics_service.py
"""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.fdr_forensics import FDRForensicsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/forensics",
    response_model=FDRForensicsResponse,
    summary="ELA visual forensics — tamper detection",
    response_description="Tamper score, flagged bounding boxes, and optional ELA heatmap.",
)
async def forensics_fdr(
    file: UploadFile = File(..., description="FDR image (JPEG or PNG). PDFs not supported for ELA."),
    document_id: str = Form(..., description="Unique document identifier from Java backend"),
    return_ela_image: bool = Form(
        default=False,
        description="If true, returns base64 PNG of the ELA heatmap for React frontend overlay.",
    ),
):
    """
    **Feature B — Visual Forensics (Error Level Analysis)**

    1. Accepts a scanned FDR image via multipart/form-data.
    2. Re-saves the image at a known JPEG quality (ELA_QUALITY from .env).
    3. Computes the pixel-wise difference — bright areas = tampered regions.
    4. Finds contours of high-ELA regions and classifies anomaly types.
    5. Returns `tamper_probability_score` + bounding boxes for React overlay.

    **Runs entirely on CPU (OpenCV) — no GPU lock, true concurrency.**
    """
    t_start = time.perf_counter()

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    content_type = file.content_type or ""
    if "pdf" in content_type.lower():
        raise HTTPException(
            status_code=415,
            detail=(
                "ELA forensics requires a raster image (JPEG or PNG). "
                "PDFs must be rasterized first via /fdr/analyze which accepts PDFs."
            ),
        )

    logger.info(
        "[/fdr/forensics] Received document_id=%s | file=%s | size=%d bytes",
        document_id,
        file.filename,
        len(file_bytes),
    )

    # CPU-only — import service and run directly (no GPU lock)
    import asyncio

    from app.services.forensics_service import run_ela_pipeline

    # Run blocking OpenCV work in thread pool to keep event loop free
    response = await asyncio.to_thread(
        run_ela_pipeline,
        image_bytes=file_bytes,
        document_id=document_id,
        return_ela_image=return_ela_image,
    )

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    logger.info(
        "[/fdr/forensics] Completed document_id=%s in %dms | status=%s | score=%.3f",
        document_id,
        elapsed_ms,
        response.status,
        response.tamper_probability_score,
    )
    return response
