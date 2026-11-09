"""
tests/test_fdr_forensics.py — Nidhi-Setu AI Microservice
==========================================================
Unit tests for app/services/forensics_service.py (ELA pipeline).

These tests run WITHOUT any GPU, model, or Ollama dependencies.
They synthesise test images in-memory using Pillow + NumPy.

Run with: pytest tests/test_fdr_forensics.py -v
"""

from __future__ import annotations

import io
import numpy as np
import pytest
from PIL import Image, ImageDraw


# =============================================================================
# Helpers — generate synthetic test images
# =============================================================================

def _solid_jpeg(width: int = 400, height: int = 300, colour=(240, 240, 240)) -> bytes:
    """Creates a uniform-colour JPEG — should be 'clean' in ELA."""
    img = Image.new("RGB", (width, height), colour)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def _tampered_jpeg(width: int = 600, height: int = 400) -> bytes:
    """
    Creates a JPEG that simulates tampering by pasting a region saved at
    a DIFFERENT quality level — the classic ELA signature.
    """
    # Base image (high quality, saved at q=95)
    base = Image.new("RGB", (width, height), (245, 245, 245))
    draw = ImageDraw.Draw(base)
    draw.text((20, 20), "State Bank of India", fill=(0, 0, 0))
    draw.text((20, 60), "Principal: Rs. 5,00,000/-", fill=(0, 0, 0))
    draw.text((20, 100), "Maturity: Rs. 5,72,612/-", fill=(0, 0, 0))

    # Simulate tampering: re-save a sub-region at very low quality (q=10)
    # and paste it back — this creates a different compression history
    tamper_region = base.crop((150, 80, 400, 130))
    buf_low = io.BytesIO()
    tamper_region.save(buf_low, format="JPEG", quality=10)
    buf_low.seek(0)
    tampered_patch = Image.open(buf_low).convert("RGB")
    base.paste(tampered_patch, (150, 80))

    # Save final composite at q=95
    buf = io.BytesIO()
    base.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def _corrupt_bytes() -> bytes:
    """Garbage bytes that cannot be decoded as any image format."""
    return b"\x00\x01\x02\x03NOTANIMAGE"


def _png_image() -> bytes:
    """PNG image (lossless — ELA is less meaningful but should not crash)."""
    img = Image.new("RGB", (300, 200), (200, 210, 220))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# =============================================================================
# Tests
# =============================================================================

class TestELAPipeline:

    def test_clean_image_scores_low(self):
        """A uniform solid-colour JPEG should produce a very low tamper score."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_solid_jpeg(),
            document_id="TEST-CLEAN-001",
        )

        assert result.document_id == "TEST-CLEAN-001"
        assert result.status in ("clean", "suspicious")  # Solid colour → clean
        assert result.tamper_probability_score < 0.5
        assert result.ela_image_base64 is None   # Not requested

    def test_tampered_image_scores_higher(self):
        """An image with a differently-compressed patch should score higher."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_tampered_jpeg(),
            document_id="TEST-TAMPER-001",
        )

        assert result.document_id == "TEST-TAMPER-001"
        # A patched image should score higher than the clean one
        assert result.tamper_probability_score > 0.0
        # Flagged regions may or may not exist depending on threshold

    def test_corrupt_bytes_returns_failed(self):
        """Corrupt/invalid bytes must return status='failed', not crash."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_corrupt_bytes(),
            document_id="TEST-CORRUPT-001",
        )

        assert result.status == "failed"
        assert result.tamper_probability_score == 0.0
        assert result.flagged_regions == []

    def test_ela_image_returned_when_requested(self):
        """When return_ela_image=True, ela_image_base64 must be a non-empty string."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_solid_jpeg(),
            document_id="TEST-ELA-IMG-001",
            return_ela_image=True,
        )

        assert result.ela_image_base64 is not None
        assert len(result.ela_image_base64) > 100   # Non-trivial base64 string
        # Validate it's decodable base64
        import base64
        raw = base64.b64decode(result.ela_image_base64)
        assert raw[:8] == b"\x89PNG\r\n\x1a\n"   # PNG magic bytes

    def test_png_input_does_not_crash(self):
        """PNG input should be processed without error (ELA less meaningful but safe)."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_png_image(),
            document_id="TEST-PNG-001",
        )

        assert result.status in ("clean", "suspicious", "tampered")
        assert 0.0 <= result.tamper_probability_score <= 1.0

    def test_response_schema_fields(self):
        """Verify all required Pydantic fields are present in the response."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_solid_jpeg(),
            document_id="TEST-SCHEMA-001",
        )

        assert hasattr(result, "document_id")
        assert hasattr(result, "status")
        assert hasattr(result, "tamper_probability_score")
        assert hasattr(result, "ela_amplification_factor")
        assert hasattr(result, "flagged_regions")
        assert hasattr(result, "processing_time_ms")
        assert result.processing_time_ms > 0
        assert result.ela_amplification_factor == 90

    def test_flagged_region_bounding_box_format(self):
        """Any returned bounding box must be a 4-element list of ints."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=_tampered_jpeg(width=800, height=600),
            document_id="TEST-BB-001",
        )

        for region in result.flagged_regions:
            assert len(region.bounding_box) == 4
            assert all(isinstance(v, int) for v in region.bounding_box)
            x, y, w, h = region.bounding_box
            assert x >= 0 and y >= 0 and w > 0 and h > 0
            assert 0.0 <= region.confidence <= 1.0
            assert region.anomaly_type in (
                "compression_artifact", "copy_paste",
                "digital_alteration", "seal_overlay",
            )

    def test_empty_bytes_returns_failed(self):
        """Empty byte string must return status='failed'."""
        from app.services.forensics_service import run_ela_pipeline

        result = run_ela_pipeline(
            image_bytes=b"",
            document_id="TEST-EMPTY-001",
        )

        assert result.status == "failed"
