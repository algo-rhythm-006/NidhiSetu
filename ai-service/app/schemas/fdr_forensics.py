"""
app/schemas/fdr_forensics.py — Nidhi-Setu AI Microservice
===========================================================
Pydantic request/response contracts for Feature B:
  POST /api/v1/fdr/forensics

Java → Python:  multipart/form-data  (image file + form fields)
Python → Java:  application/json     (FDRForensicsResponse)

The React frontend uses `flagged_regions[].bounding_box` to draw
red overlay rectangles on the displayed FDR image.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class FlaggedRegion(BaseModel):
    """
    A single suspicious region identified by the ELA pipeline.
    Coordinates are in pixels relative to the original image dimensions.

    React usage:
        <rect x={bb[0]} y={bb[1]} width={bb[2]} height={bb[3]}
              stroke="red" strokeWidth={2} fill="none" fillOpacity={0.3 * confidence} />
    """

    region_id: int = Field(..., description="1-based index of this region.")
    bounding_box: list[int] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="[x, y, width, height] in pixels (top-left origin).",
    )
    anomaly_type: Literal[
        "compression_artifact",
        "copy_paste",
        "digital_alteration",
        "seal_overlay",
    ] = Field(
        ...,
        description=(
            "Heuristic classification of the anomaly:\n"
            "  compression_artifact — generic JPEG re-compression mismatch\n"
            "  copy_paste — region was copy-pasted from another document\n"
            "  digital_alteration — individual digits/text modified\n"
            "  seal_overlay — bank seal / stamp was digitally overlaid"
        ),
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence that this region is genuinely anomalous (0.0–1.0).",
    )
    description: str = Field(
        ...,
        description="Human-readable description of the anomaly for the UI tooltip.",
    )


class FDRForensicsResponse(BaseModel):
    """
    Complete response for POST /api/v1/fdr/forensics.

    Java backend contract:
      - status='clean'      → tamper_probability_score < 0.35
      - status='suspicious' → 0.35 ≤ score < 0.60 (flag for manual review)
      - status='tampered'   → score ≥ 0.60 (block and escalate)
      - status='failed'     → image could not be decoded (bad format or corrupt)

    When return_ela_image=true in the request, ela_image_base64 contains a
    base64-encoded JPEG colour heatmap of the ELA difference image.
    """

    document_id: str
    status: Literal["clean", "suspicious", "tampered", "failed"]
    tamper_probability_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Scalar score: 0.0 = definitively clean, 1.0 = definitively tampered.",
    )
    ela_amplification_factor: int = Field(
        ...,
        description="JPEG quality level used for ELA re-save (e.g. 90).",
    )
    flagged_regions: list[FlaggedRegion] = Field(
        default_factory=list,
        description="List of suspicious bounding boxes. Empty when status='clean'.",
    )
    ela_image_base64: Optional[str] = Field(
        None,
        description=(
            "Base64-encoded PNG heatmap of the ELA difference image. "
            "Null unless return_ela_image=true was sent in the request."
        ),
    )
    processing_time_ms: int
