"""
app/schemas/nl2sql.py — Nidhi-Setu AI Microservice
====================================================
Pydantic request/response contracts for Feature C:
  POST /api/v1/search/nl2sql

Java → Python:  application/json  (NL2SQLRequest)
Python → Java:  application/json  (NL2SQLResponse)

SECURITY NOTE FOR JAVA DEVELOPER:
  This microservice ONLY generates SQL — it never executes it.
  The Java backend must execute the `generated_sql` string using
  a PreparedStatement / JPA named query with parameterized inputs.
  Never concatenate user text directly into the SQL string.
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class NL2SQLRequest(BaseModel):
    """
    Request body sent by the Java backend to generate SQL.

    Example Java (using RestTemplate):
        Map<String, Object> body = Map.of(
            "query", "Show FDRs expiring in 30 days in West Bengal",
            "schema_context", "CREATE TABLE fdrs (...);",
            "max_rows_hint", 50
        );
        restTemplate.postForObject(AI_SERVICE_URL + "/api/v1/search/nl2sql", body, String.class);
    """

    query: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Natural language question from the admin user (English only).",
    )
    schema_context: str = Field(
        ...,
        min_length=10,
        description=(
            "PostgreSQL DDL (CREATE TABLE statements) of tables the query may reference. "
            "Include only relevant tables to reduce prompt length and improve accuracy."
        ),
    )
    max_rows_hint: int = Field(
        default=100,
        ge=1,
        le=1000,
        description=(
            "Hint to the LLM to add a LIMIT clause. "
            "Java backend should also enforce its own LIMIT as a safety net."
        ),
    )

    @field_validator("query")
    @classmethod
    def query_must_be_question_or_command(cls, v: str) -> str:
        """Reject obviously malicious prompt-injection attempts."""
        dangerous = ["drop table", "delete from", "insert into", "update set", "truncate"]
        if any(kw in v.lower() for kw in dangerous):
            raise ValueError(
                "Query contains prohibited SQL keywords. "
                "This endpoint accepts natural language only."
            )
        return v.strip()


class SQLSafetyAudit(BaseModel):
    """
    Automated safety audit run on the generated SQL before returning it.
    All `contains_*` fields must be False for `passed` to be True.
    """

    is_read_only: bool
    contains_insert: bool
    contains_update: bool
    contains_delete: bool
    contains_drop: bool
    contains_truncate: bool
    contains_alter: bool
    contains_create: bool
    contains_grant: bool
    contains_execute: bool
    passed: bool = Field(
        ...,
        description="True only when is_read_only=True and all contains_* are False.",
    )


class NL2SQLResponse(BaseModel):
    """
    Complete response for POST /api/v1/search/nl2sql.

    Java backend contract:
      - Always check safety_check.passed before executing generated_sql.
      - If query_type='UNSUPPORTED', the endpoint returns HTTP 422 (not this model).
      - Execute generated_sql as a read-only PreparedStatement.
    """

    original_query: str = Field(..., description="The natural language query echoed back.")
    generated_sql: str = Field(
        ...,
        description="Safe, read-only PostgreSQL SELECT statement ready for execution.",
    )
    query_type: Literal["SELECT", "UNSUPPORTED"] = Field(
        ...,
        description="'SELECT' if safe; 'UNSUPPORTED' if safety check failed (triggers HTTP 422).",
    )
    explanation: str = Field(
        ...,
        description="Plain-English sentence describing what the SQL does.",
    )
    safety_check: SQLSafetyAudit
    model_used: str = Field(default="llama3.2")
    processing_time_ms: int
