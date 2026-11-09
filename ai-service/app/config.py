"""
app/config.py — Nidhi-Setu AI Microservice
============================================
Central configuration loaded from environment variables / .env file.
All modules should import `settings` from here — never call os.getenv directly.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Pydantic Settings auto-reads from environment variables (case-insensitive)
    and from a .env file in the working directory.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Silently ignore unknown env vars
    )

    # ── Zero-Trust Internal Auth ──────────────────────────────────────────────
    internal_api_token: str = Field(
        default="change-me-before-deploying-a-very-long-secret-key",
        description="Shared secret sent by Java backend in X-Internal-Token header.",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: list[str] = Field(
        default=["http://localhost:8080"],
        description="Origins allowed to call this service (Java backend host:port).",
    )

    # ── Ollama / Llama 3.2 ────────────────────────────────────────────────────
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="Base URL of the locally running Ollama server.",
    )
    llama_model_name: str = Field(
        default="llama3.2",
        description="Ollama model tag for the NL2SQL LLM.",
    )

    # ── Qwen2.5-VL ───────────────────────────────────────────────────────────
    qwen_model_id: str = Field(
        default="Qwen/Qwen2.5-VL-3B-Instruct",
        description=(
            "HuggingFace model ID for visual extraction. "
            "3B variant keeps VRAM under 2.5 GB on RTX 2050."
        ),
    )

    # ── Business Logic ────────────────────────────────────────────────────────
    math_tolerance_percent: float = Field(
        default=0.5,
        ge=0.0,
        le=10.0,
        description="Flag FDR if printed maturity deviates from calculated by more than this %.",
    )
    ela_quality: int = Field(
        default=90,
        ge=50,
        le=99,
        description="JPEG re-save quality level for ELA delta computation.",
    )


# Module-level singleton — import `settings` everywhere
settings = Settings()
