"""
app/utils/image_utils.py — Nidhi-Setu AI Microservice
=======================================================
Image preprocessing utilities for the FDR analysis pipeline.

RESPONSIBILITIES
----------------
1. PDF → PIL Image rasterization using PyMuPDF (fitz).
   - Multi-page PDFs: extracts the FIRST page only for vision model input.
     FDR certificates are single-page by convention. If a multi-page PDF is
     received, pages 2+ are ignored (logged as a warning).
   - Reason for first-page-only: the vision model has a fixed context window
     for image tokens; stitching multiple pages would overflow it and degrade
     extraction quality on the actual FDR content.

2. Image normalisation — resizes large images to a safe resolution cap
   before passing to Qwen2.5-VL, preventing GPU OOM from very high-res scans.

3. Format detection — distinguishes PDF vs raster image from raw bytes.

DEPENDENCIES
------------
  PyMuPDF (fitz) — pip install PyMuPDF
  Pillow (PIL)   — pip install Pillow
  NO external system binaries required (unlike Poppler/pdf2image).
"""

from __future__ import annotations

import io
import logging
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)

# ── Resolution cap for Qwen2.5-VL vision input ───────────────────────────────
# Qwen2.5-VL-3B processes images at 448×448 or 896×896 tiles internally.
# Sending images larger than MAX_DIMENSION wastes memory without improving accuracy.
MAX_DIMENSION = 1600   # pixels — longest side capped here

# ── PDF rasterization DPI ─────────────────────────────────────────────────────
# 150 DPI is sufficient for OCR on A4 FDR documents.
# 300 DPI gives better accuracy on small/degraded text but uses ~4× the memory.
PDF_RENDER_DPI = 150

# ── PyMuPDF magic bytes for PDF detection ─────────────────────────────────────
_PDF_MAGIC = b"%PDF"


# =============================================================================
# Public API
# =============================================================================

def load_image_from_bytes(file_bytes: bytes, filename: str = "") -> Image.Image:
    """
    Main entry point: converts raw file bytes (PDF or image) → PIL Image.

    For PDFs:
        - Extracts and rasterizes page 1 only.
        - Logs a warning if the PDF has more than 1 page.

    For images (JPEG, PNG, TIFF, BMP, WEBP):
        - Decodes directly via Pillow.

    Args:
        file_bytes: Raw bytes from the UploadFile.read().
        filename:   Original filename (used only for logging context).

    Returns:
        PIL.Image.Image in RGB mode, resized to be within MAX_DIMENSION.

    Raises:
        ValueError: If the bytes cannot be decoded as either a PDF or image.
    """
    if not file_bytes:
        raise ValueError("File is empty — cannot process zero-byte input.")

    if _is_pdf(file_bytes):
        logger.info("[ImageUtils] Detected PDF input (%s). Rasterizing page 1…", filename)
        pil_image = _rasterize_pdf_first_page(file_bytes, filename)
    else:
        logger.info("[ImageUtils] Detected raster image (%s). Decoding…", filename)
        pil_image = _decode_raster_image(file_bytes, filename)

    # Normalise to RGB (handles RGBA PNGs, CMYK scans, grayscale, etc.)
    pil_image = _normalise_to_rgb(pil_image)

    # Cap resolution to prevent GPU OOM
    pil_image = _cap_resolution(pil_image)

    logger.info(
        "[ImageUtils] Final image: %dx%d px, mode=%s",
        pil_image.width,
        pil_image.height,
        pil_image.mode,
    )
    return pil_image


def image_to_bytes(image: Image.Image, fmt: str = "JPEG", quality: int = 95) -> bytes:
    """
    Converts a PIL Image back to bytes for ELA pipeline re-save step.

    Args:
        image:   PIL Image (must be RGB for JPEG).
        fmt:     Output format ("JPEG" or "PNG").
        quality: JPEG quality (ignored for PNG).

    Returns:
        Raw bytes of the encoded image.
    """
    buf = io.BytesIO()
    save_kwargs: dict = {"format": fmt}
    if fmt.upper() == "JPEG":
        save_kwargs["quality"] = quality
        save_kwargs["subsampling"] = 0   # Best chroma — reduces artefacts in ELA
    image.save(buf, **save_kwargs)
    buf.seek(0)
    return buf.read()


# =============================================================================
# Private helpers
# =============================================================================

def _is_pdf(data: bytes) -> bool:
    """Detects PDF by checking the %PDF magic bytes at the file header."""
    return data[:4] == _PDF_MAGIC


def _rasterize_pdf_first_page(pdf_bytes: bytes, filename: str) -> Image.Image:
    """
    Uses PyMuPDF (fitz) to rasterize the first page of a PDF.

    MULTI-PAGE STRATEGY:
        FDR certificates are always single-page documents.
        If a multi-page PDF is received (e.g. a scan batch), we extract
        only page 0 (the first FDR page) and warn. The Java backend should
        split batches before calling this endpoint.

    Args:
        pdf_bytes: Raw PDF bytes.
        filename:  For logging.

    Returns:
        PIL Image of the first page at PDF_RENDER_DPI resolution.

    Raises:
        ValueError: If PyMuPDF cannot open the document.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise RuntimeError(
            "PyMuPDF is not installed. Run: pip install PyMuPDF"
        ) from e

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError(
            f"PyMuPDF could not open PDF '{filename}': {exc}"
        ) from exc

    total_pages = len(doc)
    if total_pages == 0:
        raise ValueError(f"PDF '{filename}' contains no pages.")

    if total_pages > 1:
        logger.warning(
            "[ImageUtils] PDF '%s' has %d pages. Only page 1 will be analysed. "
            "If this is a batch scan, ask the Java backend to split it first.",
            filename,
            total_pages,
        )

    # Rasterize page 0
    page = doc.load_page(0)

    # Build a transformation matrix for the target DPI
    # Default PyMuPDF DPI is 72; matrix scales to PDF_RENDER_DPI
    scale = PDF_RENDER_DPI / 72.0
    mat = fitz.Matrix(scale, scale)

    # Render to a Pixmap (RGBA)
    pixmap = page.get_pixmap(matrix=mat, alpha=False)
    doc.close()

    # Convert Pixmap → PIL Image via raw bytes (fastest path, no temp file)
    pil_image = Image.frombytes(
        mode="RGB",
        size=(pixmap.width, pixmap.height),
        data=pixmap.samples,
    )
    logger.info(
        "[ImageUtils] PDF page 1 rasterised: %dx%d px @ %d DPI",
        pixmap.width,
        pixmap.height,
        PDF_RENDER_DPI,
    )
    return pil_image


def _decode_raster_image(image_bytes: bytes, filename: str) -> Image.Image:
    """
    Decodes a raw raster image (JPEG, PNG, TIFF, BMP, WEBP) via Pillow.

    Args:
        image_bytes: Raw file bytes.
        filename:    For error messages.

    Returns:
        PIL Image (any mode — caller normalises to RGB).

    Raises:
        ValueError: If Pillow cannot identify or decode the image.
    """
    try:
        buf = io.BytesIO(image_bytes)
        image = Image.open(buf)
        image.load()   # Force full decode to catch truncated files early
        return image
    except Exception as exc:
        raise ValueError(
            f"Could not decode image '{filename}' as a valid raster format. "
            f"Supported: JPEG, PNG, TIFF, BMP, WEBP. Error: {exc}"
        ) from exc


def _normalise_to_rgb(image: Image.Image) -> Image.Image:
    """
    Converts the image to RGB mode, which is required by Qwen2.5-VL and
    the JPEG encoder in the ELA pipeline.

    Handles:
      - RGBA (PNG with transparency) → composited on white background
      - CMYK (professional scans) → converted via ICC-free conversion
      - L (grayscale) → replicated to 3 channels
      - P (palette) → converted via RGBA → RGB
    """
    if image.mode == "RGB":
        return image

    if image.mode == "RGBA":
        # Composite onto white background to flatten transparency
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        return background

    if image.mode == "P":
        # Palette mode — convert via RGBA to handle transparency correctly
        return _normalise_to_rgb(image.convert("RGBA"))

    # CMYK, L, LA, YCbCr, etc. — direct convert handles most cases
    return image.convert("RGB")


def _cap_resolution(image: Image.Image) -> Image.Image:
    """
    Resizes the image so its longest side is at most MAX_DIMENSION pixels.
    If the image is already within bounds, returns it unchanged.

    Uses LANCZOS resampling (best quality for downscaling documents).
    """
    w, h = image.size
    if max(w, h) <= MAX_DIMENSION:
        return image

    scale = MAX_DIMENSION / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = image.resize((new_w, new_h), Image.LANCZOS)
    logger.info(
        "[ImageUtils] Resized %dx%d → %dx%d (cap=%d px)",
        w, h, new_w, new_h, MAX_DIMENSION,
    )
    return resized
