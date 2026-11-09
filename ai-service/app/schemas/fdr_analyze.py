"""
app/schemas/fdr_analyze.py — Nidhi-Setu AI Microservice
=========================================================
Pydantic request/response contracts for Feature A:
  POST /api/v1/fdr/analyze

These are the CANONICAL JSON contracts shared with the Java backend developer.
The Java Spring Boot service must send multipart/form-data and expect the
FDRAnalyzeResponse JSON body described here.

Java → Python:  multipart/form-data  (file + form fields)
Python → Java:  application/json     (FDRAnalyzeResponse)
"""

from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


# =============================================================================
# Nested Models
# =============================================================================

class ExtractedFDRFields(BaseModel):
    """
    Fields extracted by Qwen2.5-VL from the scanned FDR document.
    All fields are Optional because OCR may fail on degraded scans.
    The Java backend must handle null values in every field.
    """

    issuing_bank: Optional[str] = Field(
        None,
        description="Full name of the issuing bank (e.g. 'State Bank of India').",
    )
    branch_name: Optional[str] = Field(
        None,
        description="Branch name or code printed on the FDR, if visible.",
    )
    customer_name: Optional[str] = Field(
        None,
        description="Full legal name of the depositor / institution.",
    )
    account_number: Optional[str] = Field(
        None,
        description="FDR certificate number or linked account number.",
    )
    principal_amount: Optional[float] = Field(
        None,
        ge=0,
        description=(
            "Deposited principal in INR as a plain float. "
            "The AI strips currency symbols and commas before returning this."
        ),
    )
    interest_rate_percent: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Annual interest rate as a percentage (e.g. 6.75 for 6.75%).",
    )
    compounding_frequency: Optional[
        Literal["monthly", "quarterly", "half-yearly", "yearly", "simple"]
    ] = Field(
        None,
        description=(
            "How interest is compounded. Defaults to 'quarterly' if not printed on the FDR "
            "but the math check requires it — the verifier will assume quarterly."
        ),
    )
    date_of_issue: Optional[date] = Field(
        None,
        description="Date the FDR was issued (ISO 8601: YYYY-MM-DD).",
    )
    date_of_maturity: Optional[date] = Field(
        None,
        description="Date the FDR matures (ISO 8601: YYYY-MM-DD).",
    )
    printed_maturity_amount: Optional[float] = Field(
        None,
        ge=0,
        description="Maturity value printed on the FDR document in INR.",
    )
    nominee_name: Optional[str] = Field(
        None,
        description="Nominee name if printed on the FDR.",
    )


class MathVerificationResult(BaseModel):
    """
    Result of the compound-interest math check against the printed maturity amount.

    If `is_mathematically_valid` is False and `flag_reason` contains
    'Insufficient data', the math check was skipped due to missing fields —
    this is NOT evidence of tampering, just an incomplete scan.

    If `is_mathematically_valid` is False and flag_reason contains 'deviates',
    the printed amount differs from the calculated amount beyond the tolerance
    threshold — this IS a potential fraud signal.
    """

    is_mathematically_valid: bool = Field(
        ...,
        description=(
            "True if the printed maturity amount matches the calculated value "
            "within the configured tolerance (default: ±0.5%)."
        ),
    )
    check_was_possible: bool = Field(
        ...,
        description=(
            "False if one or more required fields (principal, rate, dates) were "
            "null/missing. When False, is_mathematically_valid is also False "
            "but this does NOT indicate fraud — just an incomplete extraction."
        ),
    )
    expected_maturity_amount: Optional[float] = Field(
        None,
        description="Maturity amount calculated by the microservice using the formula.",
    )
    printed_maturity_amount: Optional[float] = Field(
        None,
        description="Maturity amount as read from the FDR document.",
    )
    discrepancy_amount: Optional[float] = Field(
        None,
        description="Difference in INR: printed - expected. Negative = under-reported.",
    )
    discrepancy_percent: Optional[float] = Field(
        None,
        description="Percentage deviation: (discrepancy / expected) * 100.",
    )
    tolerance_used_percent: float = Field(
        ...,
        description="The tolerance threshold used for this check (from server config).",
    )
    flag_reason: Optional[str] = Field(
        None,
        description=(
            "Human-readable explanation when is_mathematically_valid=False. "
            "Null when the check passes."
        ),
    )


class ExtractionConfidence(BaseModel):
    """
    Confidence metadata from the vision model's extraction pass.
    """

    overall_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Aggregate confidence score across all extracted fields (0.0–1.0).",
    )
    low_confidence_fields: list[str] = Field(
        default_factory=list,
        description=(
            "Names of fields where the model expressed uncertainty. "
            "Java backend may flag these for human review."
        ),
    )


# =============================================================================
# Top-Level Response — what Java receives
# =============================================================================

class FDRAnalyzeResponse(BaseModel):
    """
    Complete response for POST /api/v1/fdr/analyze.

    Java backend contract:
      - On status='failed': extracted_fields will contain all-null values.
      - On status='partial': some fields extracted, math check may have been skipped.
      - On status='success': all critical fields extracted and math check ran.
    """

    document_id: str = Field(..., description="Echoed back from the request.")
    status: Literal["success", "partial", "failed"] = Field(
        ...,
        description=(
            "'success' = all key fields extracted and math check ran. "
            "'partial' = some fields missing, math check may be skipped. "
            "'failed' = model returned no parseable output."
        ),
    )
    extracted_fields: ExtractedFDRFields
    math_verification: MathVerificationResult
    confidence: ExtractionConfidence
    processing_time_ms: int = Field(..., description="Total server-side processing time.")
    model_used: str = Field(default="Qwen2.5-VL-3B-Instruct-4bit-NF4")
