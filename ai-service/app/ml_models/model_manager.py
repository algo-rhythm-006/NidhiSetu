"""
app/ml_models/model_manager.py — Nidhi-Setu AI Microservice
=============================================================
Dynamic VRAM Orchestrator for NVIDIA RTX 2050 (4 GB VRAM).

PROBLEM BEING SOLVED
--------------------
Qwen2.5-VL-3B (4-bit) consumes ~2.5 GB VRAM during inference.
Ollama's Llama 3.2 3B (Q4_K_M) consumes ~2.0 GB VRAM.
Running both simultaneously = ~4.5 GB → OOM crash on 4 GB card.

SOLUTION: One-model-at-a-time policy enforced by asyncio.Lock.
Only one endpoint can hold the GPU at any moment; all others queue.

STATE MACHINE
-------------
  IDLE
   │─── acquire_qwen() ──────► QWEN_LOADING ──► QWEN_ACTIVE
   │                                                  │
   │                                             release() ──► VRAM_CLEARED ──► IDLE
   │
   │─── acquire_llama() ─────► unload Qwen if needed ──► LLAMA_READY
   │                                                           │
   │                                                      release() ──► IDLE
   │
   (ELA/forensics uses CPU — never acquires this lock)

USAGE PATTERN (in every router that needs GPU)
----------------------------------------------
    await model_manager.acquire_qwen()
    try:
        result = run_inference(model_manager.qwen_model, model_manager.qwen_processor)
    finally:
        model_manager.release()         # ALWAYS in finally — prevents deadlock

CONCURRENCY GUARANTEE
---------------------
asyncio.Lock is fair (FIFO). If /fdr/analyze and /search/nl2sql arrive
simultaneously, one waits until the other fully releases, including VRAM teardown.
"""

from __future__ import annotations

import asyncio
import gc
import logging
import time
from enum import Enum
from typing import Any, Optional

import torch

logger = logging.getLogger(__name__)


# ── Enum: which model is currently resident in VRAM ──────────────────────────

class ActiveModel(str, Enum):
    NONE = "none"
    QWEN_VL = "qwen_vl"
    LLAMA_READY = "llama_ready"  # Ollama owns its own VRAM; we just track state


# =============================================================================
# ModelManager — Singleton
# =============================================================================

class ModelManager:
    """
    Singleton that serialises all GPU inference through a single asyncio.Lock.

    Import the module-level `model_manager` instance — do NOT instantiate this
    class directly. The singleton is created once at import time.
    """

    _instance: Optional[ModelManager] = None

    # ── Singleton constructor ─────────────────────────────────────────────────

    def __new__(cls) -> ModelManager:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False
        return cls._instance

    def __init__(self) -> None:
        # __init__ is called every time ModelManager() is called, but we guard
        # against re-initialisation with a flag set only on the first call.
        if self._initialised:
            return
        self._initialised = True

        # The single GPU lock — the heart of the VRAM management strategy.
        # asyncio.Lock is non-reentrant; a coroutine must not call acquire twice
        # without releasing in between.
        self._gpu_lock: asyncio.Lock = asyncio.Lock()

        # Current model state
        self._active_model: ActiveModel = ActiveModel.NONE

        # Qwen model objects — set by _load_qwen_sync(), cleared by _evict_sync()
        self._qwen_model: Any = None        # Qwen2VLForConditionalGeneration
        self._qwen_processor: Any = None    # AutoProcessor

        # Timing telemetry
        self._load_durations: dict[str, float] = {}

        logger.info(
            "[ModelManager] Initialised. CUDA available: %s | Device: %s",
            torch.cuda.is_available(),
            torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A",
        )

    # =========================================================================
    # Public API — called by routers
    # =========================================================================

    async def acquire_qwen(self) -> None:
        """
        Acquire the GPU lock and ensure Qwen2.5-VL-3B is loaded into VRAM.

        This coroutine blocks until the lock is available. The caller MUST call
        `release()` in a `finally` block to prevent deadlock.

        Sequence:
          1. await asyncio.Lock.acquire()   → blocks until free
          2. If wrong model is in VRAM → evict it
          3. If QWEN not already loaded → load it (blocking, offloaded to thread)
        """
        logger.debug("[ModelManager] acquire_qwen: waiting for GPU lock…")
        await self._gpu_lock.acquire()
        logger.debug("[ModelManager] acquire_qwen: GPU lock acquired.")

        try:
            if self._active_model != ActiveModel.QWEN_VL:
                # Evict whatever is currently in VRAM (Llama state or stale Qwen)
                await self._evict_current()
                # Load Qwen in a thread so we don't block the event loop
                await asyncio.to_thread(self._load_qwen_sync)
        except Exception:
            # On any failure during load, release the lock so we don't deadlock
            logger.exception("[ModelManager] Failed to load Qwen. Releasing GPU lock.")
            self._gpu_lock.release()
            raise

    async def acquire_llama(self) -> None:
        """
        Acquire the GPU lock and ensure Qwen is evicted from VRAM.

        Llama 3.2 runs inside Ollama (a separate OS process) so we don't load
        any HuggingFace model here. We still acquire the lock and evict Qwen
        because Ollama will claim ~2 GB of the same 4 GB VRAM, which would OOM
        if Qwen is simultaneously resident.

        The caller MUST call `release()` in a `finally` block.
        """
        logger.debug("[ModelManager] acquire_llama: waiting for GPU lock…")
        await self._gpu_lock.acquire()
        logger.debug("[ModelManager] acquire_llama: GPU lock acquired.")

        try:
            if self._active_model == ActiveModel.QWEN_VL:
                # Qwen must be fully evicted before Ollama can claim VRAM
                await self._evict_current()

            self._active_model = ActiveModel.LLAMA_READY
            logger.info(
                "[ModelManager] State → LLAMA_READY | VRAM: %s",
                self._fmt_vram(),
            )
        except Exception:
            logger.exception("[ModelManager] Failed during Llama acquisition. Releasing lock.")
            self._gpu_lock.release()
            raise

    def release(self) -> None:
        """
        Release the GPU lock.

        Must be called in a `finally` block after every `acquire_*()` call.
        Safe to call even if the lock was never acquired (no-op guard).

        NOTE: We do NOT evict the model on release.  Keeping Qwen warm between
        back-to-back /fdr/analyze requests avoids a costly ~15-second reload.
        The model is evicted lazily in the next acquire_* call if a different
        model is needed, or at shutdown.
        """
        if self._gpu_lock.locked():
            self._gpu_lock.release()
            logger.debug(
                "[ModelManager] GPU lock released. Active model: %s | VRAM: %s",
                self._active_model.value,
                self._fmt_vram(),
            )
        else:
            logger.warning(
                "[ModelManager] release() called but lock was not held — possible logic error."
            )

    async def shutdown(self) -> None:
        """
        Gracefully evict all models from VRAM at service shutdown.
        Called from the FastAPI lifespan context manager.
        """
        logger.info("[ModelManager] Shutdown: evicting all models from VRAM…")
        async with self._gpu_lock:
            await self._evict_current()
        logger.info("[ModelManager] Shutdown complete.")

    # =========================================================================
    # Properties — read model objects after acquire_qwen()
    # =========================================================================

    @property
    def qwen_model(self) -> Any:
        """
        The loaded Qwen2VLForConditionalGeneration model.
        Only valid after a successful acquire_qwen() call.
        """
        if self._qwen_model is None:
            raise RuntimeError(
                "qwen_model accessed before acquire_qwen() was called. "
                "Always call await model_manager.acquire_qwen() first."
            )
        return self._qwen_model

    @property
    def qwen_processor(self) -> Any:
        """
        The loaded AutoProcessor for Qwen2.5-VL.
        Only valid after a successful acquire_qwen() call.
        """
        if self._qwen_processor is None:
            raise RuntimeError(
                "qwen_processor accessed before acquire_qwen() was called."
            )
        return self._qwen_processor

    @property
    def active_model(self) -> ActiveModel:
        """Current VRAM state (read-only)."""
        return self._active_model

    # =========================================================================
    # Diagnostics
    # =========================================================================

    def get_vram_stats(self) -> dict:
        """
        Returns a dict of CUDA memory stats.
        Safe to call at any time without holding the lock (read-only).
        """
        if not torch.cuda.is_available():
            return {"cuda_available": False, "note": "Running on CPU only."}

        props = torch.cuda.get_device_properties(0)
        allocated_bytes = torch.cuda.memory_allocated(0)
        reserved_bytes = torch.cuda.memory_reserved(0)
        total_bytes = props.total_memory

        return {
            "cuda_available": True,
            "device_name": props.name,
            "total_gb": round(total_bytes / 1024**3, 3),
            "reserved_gb": round(reserved_bytes / 1024**3, 3),
            "allocated_gb": round(allocated_bytes / 1024**3, 3),
            "free_gb": round((total_bytes - reserved_bytes) / 1024**3, 3),
            "active_model": self._active_model.value,
            "load_durations_sec": self._load_durations,
        }

    # =========================================================================
    # Private — Blocking Operations (run via asyncio.to_thread)
    # =========================================================================

    def _load_qwen_sync(self) -> None:
        """
        BLOCKING — loads Qwen2.5-VL-3B-Instruct into VRAM with 4-bit NF4.

        Must be run via `await asyncio.to_thread(self._load_qwen_sync)` to
        avoid freezing the event loop during the ~15-second model load.

        Quantisation config:
          - load_in_4bit=True        : weights stored as 4-bit integers
          - bnb_4bit_quant_type=nf4  : NormalFloat4 — best quality for LLMs
          - bnb_4bit_compute_dtype=float16 : activations computed in fp16
          - bnb_4bit_use_double_quant=True : QLoRA-style nested quant
                                             saves ~0.4 GB extra vs single quant
        """
        from transformers import AutoProcessor, BitsAndBytesConfig

        try:
            from transformers import Qwen2_5_VLForConditionalGeneration as QwenVLModel
        except ImportError:
            try:
                from transformers import AutoModelForVision2Seq as QwenVLModel
            except ImportError:
                from transformers import Qwen2VLForConditionalGeneration as QwenVLModel

        from app.config import settings  # Import here to avoid circular at module load

        model_id = settings.qwen_model_id
        logger.info(
            "[ModelManager] Loading %s with 4-bit NF4 quantisation…",
            model_id,
        )
        t0 = time.perf_counter()

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        # Load processor first (fast, CPU-only)
        self._qwen_processor = AutoProcessor.from_pretrained(
            model_id,
            trust_remote_code=True,
        )

        # Load model weights into GPU with quantisation
        self._qwen_model = QwenVLModel.from_pretrained(
            model_id,
            quantization_config=bnb_config,
            device_map="cuda:0",          # Pin to first GPU (RTX 2050)
            trust_remote_code=True,
            torch_dtype=torch.float16,    # fp16 compute for faster inference
        )
        self._qwen_model.eval()           # Disable dropout/training mode

        elapsed = time.perf_counter() - t0
        self._load_durations["qwen"] = round(elapsed, 2)
        self._active_model = ActiveModel.QWEN_VL

        logger.info(
            "[ModelManager] Qwen2.5-VL-3B loaded in %.1fs | VRAM: %s",
            elapsed,
            self._fmt_vram(),
        )

    def _evict_sync(self) -> None:
        """
        BLOCKING — deletes model references and flushes CUDA cache.

        The sequence matters:
          1. del model objects       → Python reference count → 0
          2. gc.collect()            → CPython finaliser runs, frees CPU memory
          3. torch.cuda.empty_cache()→ PyTorch releases cached CUDA allocations
                                       back to the CUDA driver
          4. torch.cuda.synchronize()→ Wait for all CUDA kernels to finish
                                       before reporting VRAM stats
        """
        if self._active_model == ActiveModel.NONE:
            return

        logger.info(
            "[ModelManager] Evicting %s from VRAM… (current: %s)",
            self._active_model.value,
            self._fmt_vram(),
        )

        # Delete Qwen objects if they exist
        if self._qwen_model is not None:
            del self._qwen_model
            self._qwen_model = None
        if self._qwen_processor is not None:
            del self._qwen_processor
            self._qwen_processor = None

        # For Llama/Ollama: we don't own the process, no Python objects to delete.
        # The VRAM used by Ollama is freed by Ollama itself between requests.

        # Force Python garbage collection
        gc.collect()

        # Return cached CUDA memory to the driver
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()

        self._active_model = ActiveModel.NONE
        logger.info(
            "[ModelManager] Eviction complete. VRAM after: %s",
            self._fmt_vram(),
        )

    # ── Async wrappers for the blocking private methods ───────────────────────

    async def _evict_current(self) -> None:
        """Async wrapper: runs _evict_sync in a thread pool."""
        await asyncio.to_thread(self._evict_sync)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _fmt_vram(self) -> str:
        """One-line VRAM summary for log messages."""
        if not torch.cuda.is_available():
            return "N/A (CPU mode)"
        alloc = torch.cuda.memory_allocated(0) / 1024**3
        total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        return f"{alloc:.2f} GB / {total:.2f} GB"


# =============================================================================
# Module-level singleton
# =============================================================================
# Import this everywhere instead of instantiating ModelManager() directly:
#
#   from app.ml_models.model_manager import model_manager
#
model_manager = ModelManager()
