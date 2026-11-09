"""
tests/test_nl2sql.py — Nidhi-Setu AI Microservice
===================================================
Unit tests for the NL2SQL safety layer (app/ml_models/llama_nl2sql.py).

These tests use monkeypatching to mock Ollama — no running Ollama instance
or GPU is required. They verify:
  1. SQL safety parsing (_run_safety_check)
  2. Output parsing (_parse_output)
  3. Router-level input validation (NL2SQLRequest Pydantic validator)
  4. Chain invocation (mocked — verifies integration wiring)

Run with: pytest tests/test_nl2sql.py -v
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError


# =============================================================================
# Safety check tests (no mocking needed — pure logic)
# =============================================================================

class TestSafetyCheck:
    """Tests for _run_safety_check in llama_nl2sql.py."""

    def _check(self, sql: str) -> dict:
        from app.ml_models.llama_nl2sql import _run_safety_check
        return _run_safety_check(sql)

    def test_valid_select_passes(self):
        sql = "SELECT id, bank_name FROM fdrs WHERE state = 'West Bengal' LIMIT 50;"
        result = self._check(sql)
        assert result["passed"] is True
        assert result["is_read_only"] is True
        assert result["contains_delete"] is False

    def test_insert_fails(self):
        sql = "INSERT INTO fdrs (id) VALUES ('abc');"
        result = self._check(sql)
        assert result["passed"] is False
        assert result["contains_insert"] is True

    def test_drop_fails(self):
        sql = "DROP TABLE fdrs;"
        result = self._check(sql)
        assert result["passed"] is False
        assert result["contains_drop"] is True

    def test_delete_fails(self):
        result = self._check("DELETE FROM fdrs WHERE id = '123';")
        assert result["passed"] is False
        assert result["contains_delete"] is True

    def test_update_fails(self):
        result = self._check("UPDATE fdrs SET status = 'closed';")
        assert result["passed"] is False
        assert result["contains_update"] is True

    def test_truncate_fails(self):
        result = self._check("TRUNCATE TABLE fdrs;")
        assert result["passed"] is False
        assert result["contains_truncate"] is True

    def test_case_insensitive_detection(self):
        """Safety check must be case-insensitive."""
        result = self._check("delete from fdrs;")
        assert result["passed"] is False

    def test_select_with_subquery_passes(self):
        sql = """
        SELECT f.id, f.principal, f.maturity_date
        FROM fdrs f
        WHERE f.state = 'West Bengal'
          AND f.maturity_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        ORDER BY f.maturity_date ASC
        LIMIT 100;
        """
        result = self._check(sql)
        assert result["passed"] is True

    def test_create_fails(self):
        result = self._check("CREATE TABLE hack (id INT);")
        assert result["passed"] is False

    def test_execute_fails(self):
        result = self._check("EXECUTE sp_dangerous;")
        assert result["passed"] is False

    def test_partial_word_not_matched(self):
        """'RECREATE' contains 'CREATE' but as substring, not whole word."""
        # Our regex uses \b word boundaries — RECREATE should not trigger
        sql = "SELECT id FROM recreate_log;"  # column-like name
        result = self._check(sql)
        # 'recreate_log' does not match \bCREATE\b because 'RE' precedes it
        # This is correct — we shouldn't flag table names that happen to contain keywords
        assert result["passed"] is True


# =============================================================================
# Output parser tests
# =============================================================================

class TestOutputParser:
    def _parse(self, raw: str):
        from app.ml_models.llama_nl2sql import _parse_output
        return _parse_output(raw)

    def test_standard_format(self):
        raw = (
            "SELECT id FROM fdrs LIMIT 10;\n"
            "EXPLANATION: Returns the first 10 FDR IDs."
        )
        sql, expl = self._parse(raw)
        assert sql == "SELECT id FROM fdrs LIMIT 10;"
        assert "first 10" in expl

    def test_missing_explanation_uses_default(self):
        raw = "SELECT * FROM fdrs;"
        sql, expl = self._parse(raw)
        assert sql == "SELECT * FROM fdrs;"
        assert len(expl) > 0  # Default explanation provided

    def test_strips_markdown_fences(self):
        raw = "```sql\nSELECT id FROM fdrs;\n```\nEXPLANATION: Gets all IDs."
        sql, expl = self._parse(raw)
        assert "```" not in sql
        assert sql == "SELECT id FROM fdrs;"

    def test_normalises_trailing_semicolon(self):
        # Multiple semicolons should be normalised to one
        raw = "SELECT id FROM fdrs;;;\nEXPLANATION: Test."
        sql, _ = self._parse(raw)
        assert sql.endswith(";")
        assert sql.count(";") == 1

    def test_explanation_case_insensitive(self):
        raw = "SELECT id FROM fdrs;\nexplanation: lowercase variant."
        _, expl = self._parse(raw)
        assert "lowercase" in expl


# =============================================================================
# Pydantic request validator tests
# =============================================================================

class TestNL2SQLRequestValidation:
    def _make_request(self, **kwargs):
        from app.schemas.nl2sql import NL2SQLRequest
        defaults = dict(
            query="Show FDRs expiring this month",
            schema_context="CREATE TABLE fdrs (id UUID, maturity_date DATE);",
        )
        defaults.update(kwargs)
        return NL2SQLRequest(**defaults)

    def test_valid_request(self):
        req = self._make_request()
        assert req.query == "Show FDRs expiring this month"
        assert req.max_rows_hint == 100  # Default

    def test_custom_max_rows(self):
        req = self._make_request(max_rows_hint=50)
        assert req.max_rows_hint == 50

    def test_query_too_short(self):
        with pytest.raises(ValidationError):
            self._make_request(query="hi")

    def test_query_too_long(self):
        with pytest.raises(ValidationError):
            self._make_request(query="a" * 1001)

    def test_prompt_injection_blocked(self):
        """SQL keywords in the natural language query should be rejected."""
        with pytest.raises(ValidationError):
            self._make_request(query="drop table fdrs and show me results")

    def test_delete_in_query_blocked(self):
        with pytest.raises(ValidationError):
            self._make_request(query="delete from fdrs where id=1")

    def test_insert_in_query_blocked(self):
        with pytest.raises(ValidationError):
            self._make_request(query="insert into fdrs values (1)")

    def test_query_stripped(self):
        """Leading/trailing whitespace should be stripped."""
        req = self._make_request(query="  Show all FDRs  ")
        assert req.query == "Show all FDRs"

    def test_max_rows_upper_bound(self):
        with pytest.raises(ValidationError):
            self._make_request(max_rows_hint=9999)

    def test_max_rows_lower_bound(self):
        with pytest.raises(ValidationError):
            self._make_request(max_rows_hint=0)


# =============================================================================
# Mocked chain invocation test
# =============================================================================

class TestNL2SQLChainMocked:
    """Tests that mock Ollama's HTTP response — no Ollama server needed."""

    def test_run_nl2sql_inference_success(self, monkeypatch):
        """Mock the LangChain chain to return a known SQL string."""
        from app.ml_models import llama_nl2sql

        mock_output = (
            "SELECT id, bank_name, maturity_date FROM fdrs "
            "WHERE state = 'West Bengal' "
            "AND maturity_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' "
            "ORDER BY maturity_date ASC LIMIT 50;\n"
            "EXPLANATION: Returns FDRs in West Bengal expiring in the next 30 days."
        )

        # Mock: replace the chain's invoke so it returns our known string
        class MockChain:
            def invoke(self, _):
                return mock_output

        result = llama_nl2sql.run_nl2sql_inference(
            chain=MockChain(),
            question="Show FDRs expiring in 30 days in West Bengal",
            schema="CREATE TABLE fdrs (id UUID, state TEXT, maturity_date DATE);",
            max_rows=50,
        )

        assert result["query_type"] == "SELECT"
        assert result["safety_check"]["passed"] is True
        assert "West Bengal" in result["generated_sql"]
        assert "30 days" in result["explanation"].lower() or "west bengal" in result["explanation"].lower()
        assert result["processing_time_ms"] >= 0

    def test_run_nl2sql_inference_unsafe_sql(self, monkeypatch):
        """Mock a malicious model output — safety check should catch it."""
        from app.ml_models import llama_nl2sql

        class MockChain:
            def invoke(self, _):
                return "DROP TABLE fdrs;\nEXPLANATION: Deletes all FDR records."

        result = llama_nl2sql.run_nl2sql_inference(
            chain=MockChain(),
            question="whatever",
            schema="CREATE TABLE fdrs (id UUID);",
            max_rows=10,
        )

        assert result["query_type"] == "UNSUPPORTED"
        assert result["safety_check"]["passed"] is False
        assert result["safety_check"]["contains_drop"] is True

    def test_ollama_connection_error_raises(self, monkeypatch):
        """If Ollama is unreachable, the service should raise RuntimeError."""
        from app.ml_models import llama_nl2sql

        class BrokenChain:
            def invoke(self, _):
                raise ConnectionError("Connection refused: Ollama is not running")

        with pytest.raises((ConnectionError, RuntimeError)):
            llama_nl2sql.run_nl2sql_inference(
                chain=BrokenChain(),
                question="test",
                schema="CREATE TABLE t (id INT);",
                max_rows=10,
            )
