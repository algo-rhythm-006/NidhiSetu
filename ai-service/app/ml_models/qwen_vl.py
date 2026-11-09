"""
app/ml_models/qwen_vl.py — Nidhi-Setu AI Microservice
=======================================================
Qwen2.5-VL-3B-Instruct inference wrapper for FDR field extraction.

VRAM BUDGET ON RTX 2050 (4 GB)
-------------------------------
  Qwen2.5-VL-3B weights (4-bit NF4):  ~1.8 GB
  KV-cache + activations (fp16):       ~0.4 GB
  Image token tensors (448px tiles):   ~0.2 GB
  ─────────────────────────────────────────────
  Total peak:                          ~2.4 GB  ← safely under 4 GB

  The 4-bit loading is ENFORCED by this module — attempting to call
  run_qwen_extraction() with a non-quantised model will raise an assertion.

HOW THIS INTERACTS WITH ModelManager
-------------------------------------
  1. Router calls:  await model_manager.acquire_qwen()
  2. ModelManager loads the model with BitsAndBytesConfig(load_in_4bit=True)
  3. Router calls:  await run_qwen_extraction(bytes, model, processor)
                    (this file)
  4. Router calls:  model_manager.release()  (in finally block)

  This file never loads the model itself — it receives already-loaded
  `model` and `processor` objects from the ModelManager.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

import torch

logger = logging.getLogger(__name__)

# =============================================================================
# Extraction prompt
# =============================================================================

_EXTRACTION_PROMPT = """\
You are a financial document OCR specialist. Extract the following fields \
from this Fixed Deposit Receipt (FDR) image.

CRITICAL RULES:
1. Return ONLY a single valid JSON object — no markdown, no explanation, no preamble.
2. All monetary values must be plain numbers without currency symbols or commas.
   Example: "5,00,000.00" → 500000.0
3. All dates must be ISO 8601 format: YYYY-MM-DD.
   Example: "15 Jan 2024" → "2024-01-15"
4. If a field is not visible, illegible, or absent, use null (not "null" string).
5. interest_rate_percent must be a number, e.g. 6.75 not "6.75%".
6. compounding_frequency must be exactly one of: \
monthly, quarterly, half-yearly, yearly, simple — or null.

JSON SCHEMA (return exactly this structure):
{
  "issuing_bank": "string or null",
  "branch_name": "string or null",
  "customer_name": "string or null",
  "account_number": "string or null",
  "principal_amount": "number or null",
  "interest_rate_percent": "number or null",
  "compounding_frequency": "monthly|quarterly|half-yearly|yearly|simple or null",
  "date_of_issue": "YYYY-MM-DD or null",
  "date_of_maturity": "YYYY-MM-DD or null",
  "printed_maturity_amount": "number or null",
  "nominee_name": "string or null"
}"""

# JSON extraction regex — handles model wrapping output in ```json ... ``` fences
_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)
_BARE_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)

# ── 4-bit quantisation assertion ─────────────────────────────────────────────
# This guard ensures we never run Qwen in full precision on the RTX 2050.
# ModelManager always loads with BitsAndBytesConfig(load_in_4bit=True).
_QUANTISATION_ASSERT_MSG = (
    "SAFETY ABORT: Qwen model does not appear to be 4-bit quantised. "
    "Running full-precision Qwen2.5-VL-3B would require ~7 GB VRAM and crash "
    "the RTX 2050 (4 GB). Check ModelManager._load_qwen_sync() BitsAndBytesConfig."
)


# =============================================================================
# Public API
# =============================================================================

async def run_qwen_extraction(
    image_bytes: bytes,
    model: Any,
    processor: Any,
) -> dict[str, Any]:
    """
    Async entry point: runs Qwen2.5-VL inference and returns a parsed dict.

    Must be called while the ModelManager GPU lock is held (acquire_qwen).
    Runs the blocking GPU work in a thread pool to keep the event loop responsive.

    Args:
        image_bytes: Raw bytes of the preprocessed FDR image (post image_utils).
        model:       Qwen2VLForConditionalGeneration (4-bit, on CUDA).
        processor:   AutoProcessor for Qwen2.5-VL.

    Returns:
        Dict matching the JSON schema in _EXTRACTION_PROMPT, or {} on parse failure.
    """
    _assert_quantised(model)
    return await asyncio.to_thread(_run_inference_sync, image_bytes, model, processor)


# =============================================================================
# Private: synchronous GPU inference (runs in thread pool)
# =============================================================================

def _run_inference_sync(
    image_bytes: bytes,
    model: Any,
    processor: Any,
) -> dict[str, Any]:
    """
    Blocking inference function. Must run in asyncio.to_thread to avoid
    freezing the FastAPI event loop during GPU computation.
    """
    import io
    from PIL import Image

    # ── 1. Load image ─────────────────────────────────────────────────────────
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    logger.info(
        "[QwenVL] Running extraction on image: %dx%d px", pil_image.width, pil_image.height
    )

    # ── 2. Build chat message ─────────────────────────────────────────────────
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "image": pil_image,
                    # min/max pixels constrain Qwen's dynamic resolution — keeps VRAM in budget
                    "min_pixels": 224 * 224,
                    "max_pixels": 1024 * 1024,
                },
                {"type": "text", "text": _EXTRACTION_PROMPT},
            ],
        }
    ]

    # ── 3. Apply chat template ────────────────────────────────────────────────
    text_prompt = processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    # Process images for the model
    try:
        from qwen_vl_utils import process_vision_info
        image_inputs, video_inputs = process_vision_info(messages)
    except ImportError:
        # Fallback if qwen-vl-utils not installed — pass images directly
        image_inputs = [pil_image]
        video_inputs = None

    # ── 4. Tokenise ───────────────────────────────────────────────────────────
    inputs = processor(
        text=[text_prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    ).to("cuda")

    # ── 5. Generate ───────────────────────────────────────────────────────────
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=600,    # JSON output is ~400 tokens max
            do_sample=False,       # Greedy decoding — deterministic for financial data
            temperature=None,      # Must be None when do_sample=False
            top_p=None,            # Must be None when do_sample=False
            repetition_penalty=1.05,  # Mild penalty to prevent repeated JSON keys
        )

    # ── 6. Decode — trim the input prompt tokens ──────────────────────────────
    trimmed_ids = [
        out[len(inp):]
        for inp, out in zip(inputs["input_ids"], output_ids)
    ]
    raw_output = processor.batch_decode(
        trimmed_ids,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0]

    logger.debug("[QwenVL] Raw model output (first 500 chars): %s", raw_output[:500])

    # ── 7. Parse JSON from output ─────────────────────────────────────────────
    return _parse_json_output(raw_output)


def _parse_json_output(raw: str) -> dict[str, Any]:
    """
    Extracts and parses JSON from the model's raw text output.

    Strategy (in order):
      1. Try extracting from ```json ... ``` fence blocks.
      2. Try extracting the first {...} block in the text.
      3. Return empty dict and log a warning.
    """
    # Attempt 1: fenced code block
    fence_match = _JSON_FENCE_RE.search(raw)
    if fence_match:
        try:
            parsed = json.loads(fence_match.group(1))
            logger.info("[QwenVL] Parsed JSON from fenced block. Keys: %s", list(parsed.keys()))
            return parsed
        except json.JSONDecodeError:
            pass

    # Attempt 2: bare JSON object in text
    bare_match = _BARE_JSON_RE.search(raw)
    if bare_match:
        try:
            parsed = json.loads(bare_match.group())
            logger.info("[QwenVL] Parsed JSON from bare match. Keys: %s", list(parsed.keys()))
            return parsed
        except json.JSONDecodeError as exc:
            logger.warning("[QwenVL] JSON parse failed on bare match: %s", exc)

    # All attempts failed
    logger.warning(
        "[QwenVL] Could not extract JSON from model output. "
        "Returning empty dict. Raw (first 300 chars): %s",
        raw[:300],
    )
    return {}


# =============================================================================
# Safety assertion
# =============================================================================

def _assert_quantised(model: Any) -> None:
    """
    Verifies the model was loaded with 4-bit quantisation.

    Checks for the presence of bitsandbytes Linear4bit layers as evidence
    that BitsAndBytesConfig(load_in_4bit=True) was used at load time.
    Raises AssertionError — not RuntimeError — so it is never accidentally
    caught by broad except clauses in service code.
    """
    try:
        import bitsandbytes as bnb
        has_4bit = any(
            isinstance(module, bnb.nn.Linear4bit)
            for module in model.modules()
        )
        assert has_4bit, _QUANTISATION_ASSERT_MSG
    except ImportError:
        # bitsandbytes not installed (CPU-only dev environment)
        # Skip the assertion — developer is responsible for CPU-only testing
        logger.warning(
            "[QwenVL] bitsandbytes not importable — skipping quantisation assertion. "
            "This is only acceptable in CPU-only dev environments."
        )
