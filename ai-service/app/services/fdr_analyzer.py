"""
app/services/fdr_analyzer.py — Nidhi-Setu AI Microservice
===========================================================
Business logic orchestrator for Feature A: FDR Visual Extraction.

CALL CHAIN
----------
  Router (fdr_analyze.py)
    └─► run_fdr_analysis()                   ← this file
          ├─► image_utils.load_image_from_bytes()   ← PDF/image → PIL
          ├─► image_utils.image_to_bytes()          ← PIL → bytes for Qwen
          ├─► qwen_vl.run_qwen_extraction()         ← GPU inference
          ├─► _build_extracted_fields()             ← raw dict → Pydantic schema
          ├─► math_verifier.verify_fdr_maturity()   ← compound interest check
          └─► _build_response()                     ← assemble FDRAnalyzeResponse

ERROR HANDLING PHILOSOPHY
--------------------------
  This function NEVER raises. It always returns a valid FDRAnalyzeResponse.
  - If the file cannot be decoded → status='failed', all fields null.
  - If Qwen returns empty JSON  → status='failed'.
  - If some fields extracted    → status='partial', math check attempted.
  - If all critical fields OK   → status='success', math check ran.
  The Java backend should check `status` before trusting any extracted fields.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

from app.schemas.fdr_analyze import (
    ExtractedFDRFields,
    ExtractionConfidence,
    FDRAnalyzeResponse,
    MathVerificationResult,
)
from app.utils.math_verifier import verify_fdr_maturity

logger = logging.getLogger(__name__)

# Fields that are considered "critical" — missing any one triggers status='partial'
_CRITICAL_FIELDS = {
    "issuing_bank",
    "customer_name",
    "principal_amount",
    "interest_rate_percent",
    "date_of_issue",
    "date_of_maturity",
    "printed_maturity_amount",
}


# =============================================================================
# Public entry point
# =============================================================================

async def run_fdr_analysis(
    *,
    file_bytes: bytes,
    filename: str,
    document_id: str,
    model: Any,
    processor: Any,
) -> FDRAnalyzeResponse:
    """
    Orchestrates the full FDR analysis pipeline.

    Args:
        file_bytes:   Raw bytes from UploadFile (PDF or image).
        filename:     Original filename for logging context.
        document_id:  Java-assigned document ID, echoed in the response.
        model:        Qwen model (already loaded by ModelManager — 4-bit CUDA).
        processor:    Qwen AutoProcessor.

    Returns:
        FDRAnalyzeResponse — always, never raises.
    """
    t_start = time.perf_counter()
    from app.config import settings

    # ── Step 1: Decode file (PDF or image) ───────────────────────────────────
    try:
        from app.utils.image_utils import load_image_from_bytes, image_to_bytes

        pil_image = load_image_from_bytes(file_bytes, filename)
        # Re-encode to JPEG bytes for Qwen input (normalised, capped resolution)
        preprocessed_bytes = image_to_bytes(pil_image, fmt="JPEG", quality=95)
    except Exception as exc:
        logger.error("[FDRAnalyzer] File decode failed for '%s': %s", filename, exc)
        return _failed_response(document_id, f"File could not be decoded: {exc}", t_start)

    # ── Step 2: Run Qwen2.5-VL visual extraction ──────────────────────────────
    try:
        from app.ml_models.qwen_vl import run_qwen_extraction

        raw_fields: dict[str, Any] = await run_qwen_extraction(
            image_bytes=preprocessed_bytes,
            model=model,
            processor=processor,
        )
    except AssertionError as exc:
        # 4-bit quantisation assertion failed — surface immediately, don't swallow
        logger.critical("[FDRAnalyzer] Quantisation guard triggered: %s", exc)
        raise
    except Exception as exc:
        logger.error("[FDRAnalyzer] Qwen inference failed: %s", exc)
        return _failed_response(document_id, f"Vision model inference error: {exc}", t_start)

    if not raw_fields:
        logger.warning("[FDRAnalyzer] Qwen returned empty output for '%s'.", filename)
        return _failed_response(document_id, "Vision model returned no parseable output.", t_start)

    # ── Step 3: Build typed ExtractedFDRFields ────────────────────────────────
    extracted, confidence = _build_extracted_fields(raw_fields)

    # ── Step 4: Math verification ─────────────────────────────────────────────
    math_result = verify_fdr_maturity(
        principal=raw_fields.get("principal_amount"),
        rate_percent=raw_fields.get("interest_rate_percent"),
        issue_date=raw_fields.get("date_of_issue"),
        maturity_date=raw_fields.get("date_of_maturity"),
        printed_amount=raw_fields.get("printed_maturity_amount"),
        compounding=raw_fields.get("compounding_frequency"),
        tolerance_percent=settings.math_tolerance_percent,
    )

    math_schema = MathVerificationResult(
        is_mathematically_valid=math_result.is_valid,
        check_was_possible=math_result.check_was_possible,
        expected_maturity_amount=math_result.expected_amount,
        printed_maturity_amount=math_result.printed_amount,
        discrepancy_amount=math_result.discrepancy_amount,
        discrepancy_percent=math_result.discrepancy_percent,
        tolerance_used_percent=math_result.tolerance_used_percent,
        flag_reason=math_result.flag_reason,
    )

    # ── Step 5: Determine overall status ─────────────────────────────────────
    missing_critical = [
        f for f in _CRITICAL_FIELDS
        if getattr(extracted, f, None) is None
    ]
    if missing_critical:
        status = "partial"
        logger.info(
            "[FDRAnalyzer] Status=partial for '%s'. Missing critical fields: %s",
            filename, missing_critical,
        )
    else:
        status = "success"
        logger.info("[FDRAnalyzer] Status=success for '%s'.", filename)

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)

    return FDRAnalyzeResponse(
        document_id=document_id,
        status=status,
        extracted_fields=extracted,
        math_verification=math_schema,
        confidence=confidence,
        processing_time_ms=elapsed_ms,
    )


# =============================================================================
# Private helpers
# =============================================================================

def _build_extracted_fields(
    raw: dict[str, Any],
) -> tuple[ExtractedFDRFields, ExtractionConfidence]:
    """
    Converts the raw Qwen JSON dict into typed Pydantic models.
    Handles type coercion failures gracefully — bad values become None.
    Also scores confidence based on how many fields were successfully extracted.
    """
    def safe_get(key: str) -> Optional[Any]:
        val = raw.get(key)
        # Treat empty strings, "null", "N/A" as None
        if val in (None, "", "null", "N/A", "n/a", "NA"):
            return None
        return val

    low_confidence: list[str] = []

    # Build the fields model — Pydantic will coerce types where possible
    # and will catch obvious mismatches; we wrap in try/except per-field
    field_values: dict[str, Any] = {}

    for field in ExtractedFDRFields.model_fields:
        raw_val = safe_get(field)
        field_values[field] = raw_val
        if raw_val is None:
            low_confidence.append(field)

    # Attempt to construct; Pydantic validates types
    try:
        extracted = ExtractedFDRFields(**field_values)
    except Exception as exc:
        logger.warning("[FDRAnalyzer] Pydantic coercion had issues: %s. Retrying field-by-field.", exc)
        # Fallback: try each field individually, null-out failures
        safe_values: dict[str, Any] = {}
        for field in ExtractedFDRFields.model_fields:
            try:
                safe_values[field] = field_values.get(field)
            except Exception:
                safe_values[field] = None
                if field not in low_confidence:
                    low_confidence.append(field)
        extracted = ExtractedFDRFields(**safe_values)

    total = len(ExtractedFDRFields.model_fields)
    extracted_count = total - len(low_confidence)
    overall_score = round(extracted_count / total, 3)

    confidence = ExtractionConfidence(
        overall_score=overall_score,
        low_confidence_fields=low_confidence,
    )

    return extracted, confidence


def _failed_response(
    document_id: str,
    reason: str,
    t_start: float,
) -> FDRAnalyzeResponse:
    """Constructs a standardised failed response payload."""
    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    return FDRAnalyzeResponse(
        document_id=document_id,
        status="failed",
        extracted_fields=ExtractedFDRFields(),
        math_verification=MathVerificationResult(
            is_mathematically_valid=False,
            check_was_possible=False,
            expected_maturity_amount=None,
            printed_maturity_amount=None,
            discrepancy_amount=None,
            discrepancy_percent=None,
            tolerance_used_percent=0.5,
            flag_reason=reason,
        ),
        confidence=ExtractionConfidence(
            overall_score=0.0,
            low_confidence_fields=list(ExtractedFDRFields.model_fields.keys()),
        ),
        processing_time_ms=elapsed_ms,
    )
