"""
app/services/forensics_service.py — Nidhi-Setu AI Microservice
===============================================================
ELA (Error Level Analysis) pipeline for FDR tamper detection.

ALGORITHM OVERVIEW
------------------
ELA exploits a property of JPEG compression: each re-save at a given
quality level introduces a predictable, uniform error across the image.
If a region was modified AFTER the original scan, its compression history
differs from the surrounding pixels, making it appear brighter in the ELA
difference image.

PIPELINE STEPS
--------------
  1. Decode the input JPEG into a numpy array.
  2. Re-save at ELA_QUALITY (90) into a memory buffer (no temp files).
  3. Compute pixel-wise absolute difference (original − resaved).
  4. Amplify the difference by ELA_AMPLIFY factor for visibility.
  5. Compute a global tamper probability from the mean ELA brightness.
  6. Find high-ELA contours → classify → build FlaggedRegion list.
  7. Optionally encode a colourised ELA heatmap as base64 for the React UI.

LIMITATIONS
-----------
  - Works best on JPEG source material. PNG scans must be converted first.
  - Low-quality source scans (high initial JPEG compression) produce
    high baseline ELA and may inflate the tamper score falsely.
  - The heuristic region classifier (seal_overlay, digital_alteration, etc.)
    is a rule-based approximation — not a trained detector.

CPU-ONLY — this service never acquires the GPU lock.
"""

from __future__ import annotations

import base64
import io
import logging
import time
from typing import Optional

import cv2
import numpy as np
from PIL import Image

from app.schemas.fdr_forensics import FDRForensicsResponse, FlaggedRegion

logger = logging.getLogger(__name__)

# ── ELA pipeline constants ─────────────────────────────────────────────────────
_ELA_QUALITY = 90       # JPEG re-save quality (lower = more sensitive)
_ELA_AMPLIFY = 12       # Pixel difference amplification factor for visualisation
_MIN_CONTOUR_AREA = 400  # px² — ignore noise speckles below this area
_MAX_REGIONS = 15       # Return at most this many flagged regions

# ── Tamper score thresholds (derived from ELA mean brightness 0.0–1.0) ────────
_CLEAN_THRESHOLD = 0.30
_SUSPICIOUS_THRESHOLD = 0.55


# =============================================================================
# Public entry point
# =============================================================================

def run_ela_pipeline(
    *,
    image_bytes: bytes,
    document_id: str,
    return_ela_image: bool = False,
) -> FDRForensicsResponse:
    """
    Runs the complete ELA forensics pipeline on an image.

    This is a synchronous (blocking) function — the router wraps it in
    `await asyncio.to_thread(...)` to avoid blocking the event loop.

    Args:
        image_bytes:      Raw bytes of the FDR image (JPEG or PNG).
        document_id:      Echoed in the response.
        return_ela_image: If True, includes a base64 heatmap PNG in the response.

    Returns:
        FDRForensicsResponse — always, never raises.
    """
    t0 = time.perf_counter()

    # ── Step 1: Decode original image ────────────────────────────────────────
    original_bgr = _decode_image(image_bytes)
    if original_bgr is None:
        elapsed = int((time.perf_counter() - t0) * 1000)
        return FDRForensicsResponse(
            document_id=document_id,
            status="failed",
            tamper_probability_score=0.0,
            ela_amplification_factor=_ELA_QUALITY,
            flagged_regions=[],
            ela_image_base64=None,
            processing_time_ms=elapsed,
        )

    h_img, w_img = original_bgr.shape[:2]
    logger.info("[ELA] Processing image: %dx%d px | document_id=%s", w_img, h_img, document_id)

    # ── Step 2: Re-save at ELA quality and reload ─────────────────────────────
    resaved_bgr = _resave_jpeg(original_bgr, quality=_ELA_QUALITY)

    # ── Step 3: Compute ELA difference image ──────────────────────────────────
    ela_float = cv2.absdiff(
        original_bgr.astype(np.float32),
        resaved_bgr.astype(np.float32),
    )
    ela_amplified = np.clip(ela_float * _ELA_AMPLIFY, 0, 255).astype(np.uint8)
    ela_gray = cv2.cvtColor(ela_amplified, cv2.COLOR_BGR2GRAY)

    # ── Step 4: Global tamper probability ─────────────────────────────────────
    # Normalise mean ELA brightness to 0.0–1.0 range
    raw_mean = float(ela_gray.mean()) / 255.0
    # Apply a moderate scale so score reaches 1.0 for heavily tampered images
    tamper_score = round(min(1.0, raw_mean * 3.0), 4)

    if tamper_score < _CLEAN_THRESHOLD:
        status = "clean"
    elif tamper_score < _SUSPICIOUS_THRESHOLD:
        status = "suspicious"
    else:
        status = "tampered"

    logger.info(
        "[ELA] document_id=%s | raw_mean=%.4f | score=%.4f | status=%s",
        document_id, raw_mean, tamper_score, status,
    )

    # ── Step 5: Detect high-ELA regions ───────────────────────────────────────
    flagged_regions = _detect_regions(ela_gray, w_img, h_img)

    # ── Step 6: Optional ELA heatmap ─────────────────────────────────────────
    ela_b64: Optional[str] = None
    if return_ela_image:
        ela_b64 = _encode_ela_heatmap(ela_gray)

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    logger.info("[ELA] Completed in %dms | flagged_regions=%d", elapsed_ms, len(flagged_regions))

    return FDRForensicsResponse(
        document_id=document_id,
        status=status,
        tamper_probability_score=tamper_score,
        ela_amplification_factor=_ELA_QUALITY,
        flagged_regions=flagged_regions,
        ela_image_base64=ela_b64,
        processing_time_ms=elapsed_ms,
    )


# =============================================================================
# Private helpers
# =============================================================================

def _decode_image(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Decodes image bytes to a BGR numpy array via OpenCV.
    Falls back to Pillow for formats OpenCV struggles with (e.g. 16-bit TIFF).
    Returns None if decoding fails.
    """
    # Primary path: OpenCV (fast, supports JPEG / PNG / BMP)
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is not None:
        return bgr

    # Fallback: Pillow → convert to BGR numpy
    try:
        pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    except Exception as exc:
        logger.error("[ELA] Image decode failed: %s", exc)
        return None


def _resave_jpeg(bgr: np.ndarray, quality: int) -> np.ndarray:
    """
    Re-encodes the image as JPEG at `quality` and decodes it back.
    Uses in-memory buffer — no temp files on disk.
    """
    pil_original = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    buf = io.BytesIO()
    # subsampling=0 preserves chroma detail, making ELA differences more precise
    pil_original.save(buf, format="JPEG", quality=quality, subsampling=0)
    buf.seek(0)
    pil_resaved = Image.open(buf).convert("RGB")
    return cv2.cvtColor(np.array(pil_resaved), cv2.COLOR_RGB2BGR)


def _detect_regions(
    ela_gray: np.ndarray,
    img_w: int,
    img_h: int,
) -> list[FlaggedRegion]:
    """
    Finds high-ELA contours in the grayscale ELA image and classifies them.

    Returns up to _MAX_REGIONS FlaggedRegion objects, sorted by area descending.
    """
    # Adaptive threshold — more robust than a fixed value across different scan qualities
    _, thresh = cv2.threshold(ela_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Morphological dilation merges nearby suspicious pixels into coherent regions
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    regions: list[FlaggedRegion] = []
    region_id = 1

    # Sort by area descending — most significant regions first
    for cnt in sorted(contours, key=cv2.contourArea, reverse=True):
        if len(regions) >= _MAX_REGIONS:
            break

        area = cv2.contourArea(cnt)
        if area < _MIN_CONTOUR_AREA:
            continue

        x, y, w, h = cv2.boundingRect(cnt)

        # Confidence: mean ELA brightness inside this region, scaled to 0.0–1.0
        region_ela = ela_gray[y : y + h, x : x + w]
        region_mean = float(region_ela.mean()) / 255.0
        # Scale so a mean of 0.33 → confidence 1.0 (very bright ELA = very suspicious)
        confidence = round(min(1.0, region_mean * 3.0), 3)

        anomaly_type, description = _classify_region(x, y, w, h, img_w, img_h)

        regions.append(
            FlaggedRegion(
                region_id=region_id,
                bounding_box=[x, y, w, h],
                anomaly_type=anomaly_type,
                confidence=confidence,
                description=description,
            )
        )
        region_id += 1

    return regions


def _classify_region(
    x: int, y: int, w: int, h: int,
    img_w: int, img_h: int,
) -> tuple[str, str]:
    """
    Heuristically classifies an anomalous region based on its position and shape.

    Heuristics:
      - Top-left corner (≤20% width, ≤20% height): likely a bank stamp/seal overlay
      - Very wide but short (w > 3×h): likely a single line of text was altered
      - Otherwise: generic copy-paste artifact

    Returns: (anomaly_type_str, human_description_str)
    """
    # Normalised position of region centre
    cx = (x + w / 2) / img_w
    cy = (y + h / 2) / img_h

    position_label = (
        "top-left"    if cx < 0.5 and cy < 0.5 else
        "top-right"   if cx >= 0.5 and cy < 0.5 else
        "bottom-left" if cx < 0.5 else
        "bottom-right"
    )

    # Seal overlay: typically in corners, roughly square/circular
    if (x < img_w * 0.25 and y < img_h * 0.25) or (x > img_w * 0.65 and y < img_h * 0.25):
        return (
            "seal_overlay",
            f"Bank seal/stamp in {position_label} area shows inconsistent compression — "
            "may be digitally overlaid rather than physically printed.",
        )

    # Text-line alteration: very wide, shallow bounding box
    if w > h * 3 and h < img_h * 0.08:
        return (
            "digital_alteration",
            f"Horizontal band in {position_label} area has elevated ELA residual — "
            "consistent with individual digit or date modification.",
        )

    # Generic
    return (
        "copy_paste",
        f"Region in {position_label} shows compression signature mismatch — "
        "consistent with copy-paste from another source document.",
    )


def _encode_ela_heatmap(ela_gray: np.ndarray) -> str:
    """
    Applies a JET colour map to the grayscale ELA image and encodes as base64 PNG.
    The warm colours (red/yellow) indicate high-ELA (suspicious) areas.
    """
    heatmap_bgr = cv2.applyColorMap(ela_gray, cv2.COLORMAP_JET)
    success, png_buf = cv2.imencode(".png", heatmap_bgr)
    if not success:
        logger.warning("[ELA] Failed to encode ELA heatmap PNG.")
        return ""
    return base64.b64encode(png_buf.tobytes()).decode("utf-8")
