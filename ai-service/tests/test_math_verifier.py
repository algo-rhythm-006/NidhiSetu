"""
tests/test_math_verifier.py — Nidhi-Setu AI Microservice
==========================================================
Unit tests for app/utils/math_verifier.py.

These tests run WITHOUT any GPU, model, or network dependencies.
Run with: pytest tests/test_math_verifier.py -v
"""

from __future__ import annotations

from datetime import date

import pytest

from app.utils.math_verifier import verify_fdr_maturity, _parse_amount, _parse_date


# =============================================================================
# Helper
# =============================================================================

def _check(**kwargs) -> object:
    """Shortcut with sensible defaults for a valid FDR."""
    defaults = dict(
        principal=500_000.0,
        rate_percent=6.75,
        issue_date=date(2024, 1, 15),
        maturity_date=date(2026, 1, 15),
        printed_amount=572_612.0,
        compounding="quarterly",
        tolerance_percent=0.5,
    )
    defaults.update(kwargs)
    return verify_fdr_maturity(**defaults)


# =============================================================================
# Happy path — valid FDR
# =============================================================================

class TestValidFDR:
    def test_passes_within_tolerance(self):
        """Quarterly compound interest should pass with a correct printed amount."""
        result = _check(printed_amount=572_612.0)
        assert result.check_was_possible is True
        assert result.is_valid is True
        assert result.flag_reason is None
        assert result.expected_amount is not None
        assert result.discrepancy_percent is not None
        assert abs(result.discrepancy_percent) <= 0.5

    def test_simple_interest(self):
        # A = 100000 * (1 + 0.07 * 2) = 114000
        result = _check(
            principal=100_000.0,
            rate_percent=7.0,
            issue_date=date(2022, 1, 1),
            maturity_date=date(2024, 1, 1),
            printed_amount=114_000.0,
            compounding="simple",
        )
        assert result.check_was_possible is True
        assert result.is_valid is True

    def test_monthly_compounding(self):
        result = _check(compounding="monthly", tolerance_percent=1.0)
        assert result.check_was_possible is True
        # Result validity depends on the expected vs printed — just confirm it ran
        assert result.expected_amount is not None

    def test_yearly_compounding(self):
        result = _check(compounding="yearly")
        assert result.check_was_possible is True
        assert result.expected_amount is not None


# =============================================================================
# Math failure — tamper signal
# =============================================================================

class TestMathFailure:
    def test_flags_inflated_amount(self):
        """Printed amount 10% higher than expected should be flagged."""
        result = _check(printed_amount=630_000.0)  # ~10% over expected
        assert result.check_was_possible is True
        assert result.is_valid is False
        assert result.flag_reason is not None
        assert "FAILED" in result.flag_reason
        assert result.discrepancy_percent > 0.5

    def test_flags_deflated_amount(self):
        """Printed amount 5% lower than expected should also be flagged."""
        result = _check(printed_amount=543_000.0)
        assert result.is_valid is False
        assert result.discrepancy_percent < 0.0

    def test_wider_tolerance_passes_edge_case(self):
        """With a 5% tolerance, a small discrepancy should pass."""
        result = _check(printed_amount=575_000.0, tolerance_percent=5.0)
        assert result.is_valid is True


# =============================================================================
# Missing fields — graceful degradation (NOT fraud)
# =============================================================================

class TestMissingFields:
    def test_none_principal(self):
        result = _check(principal=None)
        assert result.check_was_possible is False
        assert result.is_valid is False
        assert "principal_amount" in result.flag_reason
        assert "OCR limitation" in result.flag_reason  # NOT fraud language

    def test_none_rate(self):
        result = _check(rate_percent=None)
        assert result.check_was_possible is False
        assert "interest_rate_percent" in result.flag_reason

    def test_none_dates(self):
        result = _check(issue_date=None, maturity_date=None)
        assert result.check_was_possible is False
        assert "date_of_issue" in result.flag_reason

    def test_none_printed_amount(self):
        result = _check(printed_amount=None)
        assert result.check_was_possible is False

    def test_all_none(self):
        result = verify_fdr_maturity(
            principal=None, rate_percent=None, issue_date=None,
            maturity_date=None, printed_amount=None,
        )
        assert result.check_was_possible is False
        assert result.is_valid is False


# =============================================================================
# Edge cases — malformed / unusual inputs
# =============================================================================

class TestEdgeCases:
    def test_indian_comma_amount(self):
        """_parse_amount must handle '5,00,000' Indian comma format."""
        assert _parse_amount("5,00,000") == 500_000.0

    def test_currency_prefix(self):
        """_parse_amount must strip ₹ symbol."""
        assert _parse_amount("₹5,00,000.50") == pytest.approx(500_000.50)

    def test_lakh_notation(self):
        assert _parse_amount("5 lakh") == pytest.approx(500_000.0)
        assert _parse_amount("2.5 lakh") == pytest.approx(250_000.0)

    def test_crore_notation(self):
        assert _parse_amount("1 crore") == pytest.approx(10_000_000.0)

    def test_plain_float(self):
        assert _parse_amount(500000.0) == 500_000.0

    def test_empty_string_amount(self):
        assert _parse_amount("") is None

    def test_garbage_amount(self):
        assert _parse_amount("N/A") is None
        assert _parse_amount("null") is None

    def test_date_indian_format(self):
        """_parse_date must handle '15-01-2024' Indian style."""
        result = _parse_date("15-01-2024")
        assert result == date(2024, 1, 15)

    def test_date_slash_format(self):
        result = _parse_date("15/01/2024")
        assert result == date(2024, 1, 15)

    def test_date_written_month(self):
        result = _parse_date("January 15, 2024")
        assert result == date(2024, 1, 15)

    def test_date_iso(self):
        result = _parse_date("2024-01-15")
        assert result == date(2024, 1, 15)

    def test_date_object_passthrough(self):
        d = date(2024, 6, 1)
        assert _parse_date(d) == d

    def test_garbage_date(self):
        assert _parse_date("not-a-date") is None
        assert _parse_date(None) is None

    def test_maturity_before_issue(self):
        """Logically impossible date order → check_was_possible=False."""
        result = _check(
            issue_date=date(2026, 1, 1),
            maturity_date=date(2024, 1, 1),
        )
        assert result.check_was_possible is False
        assert "not after" in result.flag_reason

    def test_zero_principal(self):
        result = _check(principal=0.0)
        assert result.check_was_possible is False

    def test_negative_principal(self):
        result = _check(principal=-1000.0)
        # _parse_amount returns None for negatives via >0 guard
        # In this case the float is passed directly, so check logical guard
        assert result.check_was_possible is False

    def test_absurd_interest_rate(self):
        result = _check(rate_percent=150.0)
        assert result.check_was_possible is False
        assert "outside valid range" in result.flag_reason

    def test_compounding_alias_annual(self):
        """'annual' should map to yearly (n=1)."""
        result = _check(compounding="annual", tolerance_percent=2.0)
        assert result.check_was_possible is True
        assert result.expected_amount is not None

    def test_compounding_unknown_defaults_quarterly(self):
        """Unknown compounding string should default to quarterly without crash."""
        result = _check(compounding="bi-monthly", tolerance_percent=5.0)
        assert result.check_was_possible is True
