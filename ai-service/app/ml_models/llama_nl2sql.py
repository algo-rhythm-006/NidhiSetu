"""
app/ml_models/llama_nl2sql.py — Nidhi-Setu AI Microservice
============================================================
Llama 3.2 3B NL2SQL inference via LangChain + Ollama.

ARCHITECTURE
------------
  This module does NOT load any model into Python memory.
  Llama 3.2 runs inside the Ollama daemon (a separate OS process).
  We call it via the LangChain Ollama integration over localhost HTTP.

  The ModelManager still acquires the GPU lock before calling this module
  because Ollama's Llama 3.2 (Q4_K_M) claims ~2.0 GB of the same 4 GB VRAM.
  We must ensure Qwen is fully evicted first.

PROMPT ENGINEERING STRATEGY
----------------------------
  The system prompt is a strict, minimal instruction set designed to produce
  deterministic, parseable output from a 3B model:
    1. Explicit output format: SQL on lines 1-N, "EXPLANATION:" on line N+1.
    2. Enumerated rules (numbered, not bulleted) — 3B models follow numbered
       lists more reliably than prose instructions.
    3. Schema context is injected verbatim — no summarisation.
    4. temperature=0.0 — greedy decoding for consistent SQL generation.

SAFETY
------
  This module performs a lexical safety check on the generated SQL before
  returning it. The check is defence-in-depth — the Java backend should
  also validate that it's executing a SELECT statement.
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any

logger = logging.getLogger(__name__)

# =============================================================================
# SQL Safety constants
# =============================================================================

# DML/DDL keywords that must never appear in a read-only query
_BANNED_KEYWORDS: list[str] = [
    "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE",
    "ALTER", "CREATE", "GRANT", "REVOKE", "EXECUTE",
    "EXEC", "CALL", "MERGE", "REPLACE",
]

# =============================================================================
# Prompt template (f-string — filled at call time)
# =============================================================================

_PROMPT_TEMPLATE = """\
You are an expert PostgreSQL query writer. Your only task is to write a single \
safe, read-only SELECT statement.

DATABASE SCHEMA:
{schema}

STRICT RULES (violating ANY rule makes your answer invalid):
1. Generate ONLY a SELECT statement. Absolutely no INSERT, UPDATE, DELETE, DROP, \
TRUNCATE, ALTER, CREATE, GRANT, EXECUTE, or any other DDL/DML statement.
2. Use only table and column names that appear in the schema above.
3. Add LIMIT {max_rows} at the end unless the question explicitly asks for all records.
4. Do not use semicolons inside sub-queries. Add exactly one semicolon at the very end.
5. Do not wrap the SQL in markdown code fences.
6. After the SQL, write "EXPLANATION:" on a new line, followed by one sentence \
describing what the query does in plain English.

USER QUESTION: {question}

SQL QUERY:"""


# =============================================================================
# Public API
# =============================================================================

def build_nl2sql_chain(
    ollama_base_url: str,
    model_name: str,
) -> Any:
    """
    Builds and returns a LangChain LCEL chain:
        PromptTemplate | OllamaLLM | StrOutputParser

    The chain is lightweight — no model is loaded here.
    Ollama handles the actual inference in its own process.

    Args:
        ollama_base_url: e.g. "http://localhost:11434"
        model_name:      e.g. "llama3.2:3b-instruct-q4_K_M"

    Returns:
        A runnable LangChain chain (invoke with dict of variables).
    """
    from langchain_ollama import OllamaLLM
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import PromptTemplate

    prompt = PromptTemplate(
        input_variables=["schema", "question", "max_rows"],
        template=_PROMPT_TEMPLATE,
    )

    llm = OllamaLLM(
        model=model_name,
        base_url=ollama_base_url,
        temperature=0.0,           # Deterministic — critical for reproducible SQL
        num_predict=512,           # Enough for complex SELECT + EXPLANATION
        # Prevent the model from continuing into a second question/answer
        stop=["USER QUESTION:", "---", "Note:", "Warning:"],
    )

    return prompt | llm | StrOutputParser()


def run_nl2sql_inference(
    chain: Any,
    question: str,
    schema: str,
    max_rows: int,
    model_name: Optional[str] = None,
) -> dict[str, Any]:
    """
    Executes the LangChain chain and parses the output.

    Args:
        chain:      Built by build_nl2sql_chain().
        question:   Natural language question from the admin user.
        schema:     PostgreSQL DDL string.
        max_rows:   LIMIT hint for the LLM.
        model_name: Optional model tag string.

    Returns:
        Dict with keys: generated_sql, explanation, safety_check,
                        query_type, model_used, processing_time_ms.
    """
    t0 = time.perf_counter()

    if not model_name:
        try:
            from app.config import settings
            model_name = settings.llama_model_name
        except Exception:
            model_name = "llama3.2"

    logger.info("[LlamaNL2SQL] Sending query to Ollama: '%s…'", question[:80])

    try:
        raw_output: str = chain.invoke({
            "schema": schema,
            "question": question,
            "max_rows": max_rows,
        })
    except Exception as exc:
        logger.error("[LlamaNL2SQL] Ollama inference failed: %s", exc)
        raise RuntimeError(
            f"Ollama inference failed. Is Ollama running at the configured URL? "
            f"Run: ollama serve. Error: {exc}"
        ) from exc

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    logger.debug("[LlamaNL2SQL] Raw output (first 400 chars): %s", raw_output[:400])

    sql, explanation = _parse_output(raw_output)
    safety = _run_safety_check(sql)
    query_type = "SELECT" if safety["passed"] else "UNSUPPORTED"

    logger.info(
        "[LlamaNL2SQL] Generated SQL (%dms) | safe=%s | SQL: %s…",
        elapsed_ms,
        safety["passed"],
        sql[:100],
    )

    return {
        "generated_sql": sql,
        "explanation": explanation,
        "safety_check": safety,
        "query_type": query_type,
        "model_used": model_name,
        "processing_time_ms": elapsed_ms,
    }


# =============================================================================
# Private helpers
# =============================================================================

def _parse_output(raw: str) -> tuple[str, str]:
    """
    Splits the model output into SQL and explanation.

    Expected format from the model:
        SELECT ... FROM ... WHERE ... LIMIT N;
        EXPLANATION: One sentence describing the query.

    Fallback: if "EXPLANATION:" is absent, use the entire output as SQL
    and generate a generic explanation.
    """
    # Split on EXPLANATION: marker
    parts = re.split(r"\bEXPLANATION\s*:", raw, maxsplit=1, flags=re.IGNORECASE)

    sql_raw = parts[0].strip()
    explanation = parts[1].strip() if len(parts) > 1 else "Query generated successfully."

    # Strip any accidental markdown code fences
    sql_raw = re.sub(r"```sql|```", "", sql_raw, flags=re.IGNORECASE).strip()

    # Normalise trailing semicolon — always add exactly one
    sql = sql_raw.rstrip(";").strip() + ";"

    return sql, explanation


def _run_safety_check(sql: str) -> dict[str, Any]:
    """
    Lexical safety audit on the generated SQL.

    Checks:
      1. Starts with SELECT (case-insensitive, ignoring leading whitespace/comments)
      2. Does not contain any banned DML/DDL keywords as whole words

    Returns a dict matching the SQLSafetyAudit Pydantic schema.
    """
    sql_upper = sql.upper()

    # Check each banned keyword as a whole word (e.g. "CREATE" but not "RECREATE")
    keyword_flags: dict[str, bool] = {}
    for kw in _BANNED_KEYWORDS:
        pattern = rf"\b{re.escape(kw)}\b"
        keyword_flags[f"contains_{kw.lower()}"] = bool(re.search(pattern, sql_upper))

    # Strip leading SQL comments (-- ... or /* ... */) before checking SELECT
    sql_stripped = re.sub(r"(--[^\n]*|/\*.*?\*/)", "", sql_upper, flags=re.DOTALL).strip()
    starts_with_select = sql_stripped.startswith("SELECT")

    any_banned = any(keyword_flags.values())
    is_read_only = starts_with_select and not any_banned
    passed = is_read_only

    return {
        "is_read_only": is_read_only,
        **keyword_flags,
        "passed": passed,
    }
