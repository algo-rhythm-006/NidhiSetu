"""
app/utils/math_verifier.py — Nidhi-Setu AI Microservice
=========================================================
FDR Compound Interest Math Verification.

PURPOSE
-------
After Qwen2.5-VL extracts FDR fields, this module calculates the *expected*
maturity amount using standard banking formulas and compares it to the
*printed* amount. A significant discrepancy is a fraud signal.

FORMULAS
--------
Compound interest (most Indian banks):
    A = P × (1 + r/n) ^ (n × t)

    where:
        P = principal amount (INR)
        r = annual interest rate as a decimal (e.g. 0.0675 for 6.75%)
        n = compounding frequency per year (quarterly=4, monthly=12, etc.)
        t = tenure in fractional years (computed from actual dates)

Simple interest (rare — some co-operative banks):
    A = P × (1 + r × t)

EDGE CASES HANDLED
------------------
  1. Missing fields — any None/null from Qwen → returns MathCheckResult with
     check_was_possible=False. NOT a fraud signal, just incomplete OCR.

  2. Malformed amount strings — Qwen may return "5,00,000" or "₹5 lakh".
     We sanitise via _parse_amount() before the numeric check.

  3. Malformed dates — Qwen may return "15-01-2024" or "January 15, 2024".
     We parse via _parse_date() using multiple common Indian date formats.

  4. Zero / negative principal — hard validation, returns error flag.

  5. Maturity date before issue date — logically impossible, flagged as error.

  6. Floating-point rounding — banks use different day-count conventions.
     We use actual/365.25 (handles leap years). A ±0.5% tolerance window
     absorbs any residual rounding differences.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import date
from typing import Optional

logger = logging.getLogger(__name__)

# ── Compounding frequency → periods per year mapping ─────────────────────────
_FREQ_MAP: dict[str, int] = {
    "monthly": 12,
    "quarterly": 4,
    "half-yearly": 2,
    "yearly": 1,
    "annual": 1,
    "annually": 1,
    "simple": 0,   # Sentinel — triggers simple interest formula
}

# ── Date formats Qwen commonly outputs ───────────────────────────────────────
_DATE_FORMATS: list[str] = [
    "%Y-%m-%d",       # ISO 8601 — preferred
    "%d-%m-%Y",       # Indian style: 15-01-2024
    "%d/%m/%Y",       # Indian style: 15/01/2024
    "%d.%m.%Y",       # European: 15.01.2024
    "%B %d, %Y",      # January 15, 2024
    "%d %B %Y",       # 15 January 2024
    "%b %d, %Y",      # Jan 15, 2024
    "%d-%b-%Y",       # 15-Jan-2024
]

# ── Lakh/crore word patterns ──────────────────────────────────────────────────
_LAKH_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s*(?:lakh|lac)", re.IGNORECASE)
_CRORE_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s*crore", re.IGNORECASE)


# =============================================================================
# Public return type
# =============================================================================

@dataclass
class MathCheckResult:
    """
    Always returned — never raises. The caller converts this to the
    MathVerificationResult Pydantic schema.
    """
    check_was_possible: bool
    is_valid: bool
    expected_amount: Optional[float]
    printed_amount: Optional[float]
    discrepancy_amount: Optional[float]
    discrepancy_percent: Optional[float]
    tolerance_used_percent: float
    flag_reason: Optional[str]


# =============================================================================
# Main entry point
# =============================================================================

def verify_fdr_maturity(
    *,
    principal: object,                    # Accept any type from Qwen output
    rate_percent: object,
    issue_date: object,
    maturity_date: object,
    printed_amount: object,
    compounding: object = "quarterly",
    tolerance_percent: float = 0.5,
) -> MathCheckResult:
    """
    Validates FDR maturity amount against the compound interest formula.

    Args are typed as `object` (not float/date) intentionally so callers can
    pass raw Qwen output without pre-validation — this function handles all
    parsing and graceful degradation internally.

    Returns:
        MathCheckResult — always populated, never raises.
    """

    # ── Step 1: Parse and sanitise each field ─────────────────────────────────
    p_val = _parse_amount(principal)
    r_val = _parse_float(rate_percent)
    d_issue = _parse_date(issue_date)
    d_mat = _parse_date(maturity_date)
    a_val = _parse_amount(printed_amount)
    comp_str = _normalise_compounding(compounding)

    # ── Step 2: Check if we have enough data to run the math ─────────────────
    missing: list[str] = []
    if p_val is None:
        missing.append("principal_amount")
    if r_val is None:
        missing.append("interest_rate_percent")
    if d_issue is None:
        missing.append("date_of_issue")
    if d_mat is None:
        missing.append("date_of_maturity")
    if a_val is None:
        missing.append("printed_maturity_amount")

    if missing:
        reason = (
            f"Insufficient data for math verification. "
            f"Qwen could not extract: {', '.join(missing)}. "
            f"This is an OCR limitation, NOT a fraud indicator."
        )
        logger.info("[MathVerifier] Check skipped — missing fields: %s", missing)
        return MathCheckResult(
            check_was_possible=False,
            is_valid=False,
            expected_amount=None,
            printed_amount=a_val,
            discrepancy_amount=None,
            discrepancy_percent=None,
            tolerance_used_percent=tolerance_percent,
            flag_reason=reason,
        )

    # ── Step 3: Logical sanity checks ─────────────────────────────────────────
    if p_val <= 0:
        return _error_result(
            a_val, tolerance_percent,
            f"Principal amount ₹{p_val:,.2f} is zero or negative — logically invalid.",
        )

    if d_mat <= d_issue:
        return _error_result(
            a_val, tolerance_percent,
            f"Maturity date ({d_mat}) is not after issue date ({d_issue}) — impossible.",
        )

    if not (0.0 < r_val < 100.0):
        return _error_result(
            a_val, tolerance_percent,
            f"Interest rate {r_val}% is outside valid range (0–100%).",
        )

    # ── Step 4: Calculate expected maturity amount ────────────────────────────
    r_decimal = r_val / 100.0
    # Use actual day count / 365.25 — handles leap years properly
    t_years = (d_mat - d_issue).days / 365.25

    n = _FREQ_MAP.get(comp_str, 4)  # Default to quarterly if unrecognised

    if n == 0:  # Simple interest
        expected = round(p_val * (1 + r_decimal * t_years), 2)
    else:       # Compound interest
        expected = round(p_val * ((1 + r_decimal / n) ** (n * t_years)), 2)

    # ── Step 5: Compare printed vs expected ───────────────────────────────────
    discrepancy = round(a_val - expected, 2)
    disc_pct = round((discrepancy / expected) * 100, 4) if expected != 0 else 0.0
    is_valid = abs(disc_pct) <= tolerance_percent

    flag_reason: Optional[str] = None
    if not is_valid:
        direction = "over-reported" if discrepancy > 0 else "under-reported"
        flag_reason = (
            f"⚠ Math check FAILED: Printed maturity ₹{a_val:,.2f} is {direction} "
            f"by ₹{abs(discrepancy):,.2f} ({disc_pct:+.3f}%) vs calculated ₹{expected:,.2f}. "
            f"Tolerance: ±{tolerance_percent}%. "
            f"Inputs: P=₹{p_val:,.2f}, r={r_val}%, t={t_years:.4f}y, freq={comp_str}."
        )
        logger.warning("[MathVerifier] %s", flag_reason)
    else:
        logger.info(
            "[MathVerifier] PASSED — printed=₹%.2f, expected=₹%.2f, deviation=%.4f%%",
            a_val, expected, disc_pct,
        )

    return MathCheckResult(
        check_was_possible=True,
        is_valid=is_valid,
        expected_amount=expected,
        printed_amount=a_val,
        discrepancy_amount=discrepancy,
        discrepancy_percent=disc_pct,
        tolerance_used_percent=tolerance_percent,
        flag_reason=flag_reason,
    )


# =============================================================================
# Private parsing helpers
# =============================================================================

def _parse_amount(value: object) -> Optional[float]:
    """
    Converts Qwen's raw amount output to a float.

    Handles:
      - Already a float/int: 500000 → 500000.0
      - Indian comma-separated: "5,00,000" → 500000.0
      - Currency prefix: "₹5,00,000.00" → 500000.0
      - Lakh notation: "5 lakh" → 500000.0
      - Crore notation: "0.5 crore" → 5000000.0
      - None / empty string → None
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value) if value > 0 else None

    text = str(value).strip()
    if not text:
        return None

    # Try lakh/crore word forms first
    m = _CRORE_RE.search(text)
    if m:
        try:
            return float(m.group(1).replace(",", "")) * 1e7
        except ValueError:
            pass

    m = _LAKH_RE.search(text)
    if m:
        try:
            return float(m.group(1).replace(",", "")) * 1e5
        except ValueError:
            pass

    # Strip currency symbols, spaces, and commas
    # Covers ₹ (Unicode), Rs., Rs, INR, $, €, £ prefixes
    cleaned = re.sub(r"(?i)\brs\.?\b|inr", "", text)   # Remove Rs./Rs/INR word forms
    cleaned = re.sub(r"[₹$€£,\s]", "", cleaned)         # Remove Unicode symbols and formatting
    try:
        result = float(cleaned)
        return result if result > 0 else None
    except ValueError:
        logger.debug("[MathVerifier] Could not parse amount: '%s'", value)
        return None


def _parse_float(value: object) -> Optional[float]:
    """Converts rate or numeric field to float. Returns None on failure."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip().rstrip("%"))
    except ValueError:
        logger.debug("[MathVerifier] Could not parse float: '%s'", value)
        return None


def _parse_date(value: object) -> Optional[date]:
    """
    Parses a date from Qwen's output. Tries multiple common formats.
    Returns None if all formats fail — caller handles this gracefully.
    """
    if value is None:
        return None
    if isinstance(value, date):
        return value

    text = str(value).strip()
    if not text:
        return None

    from datetime import datetime
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue

    logger.debug("[MathVerifier] Could not parse date: '%s'", value)
    return None


def _normalise_compounding(value: object) -> str:
    """Maps various compounding strings to a canonical key in _FREQ_MAP."""
    if value is None:
        return "quarterly"
    text = str(value).strip().lower().replace(" ", "-")
    # Direct match
    if text in _FREQ_MAP:
        return text
    # Fuzzy aliases
    if "month" in text:
        return "monthly"
    if "quarter" in text:
        return "quarterly"
    if "half" in text or "semi" in text or "bi-annual" in text:
        return "half-yearly"
    if "year" in text or "annual" in text:
        return "yearly"
    if "simple" in text:
        return "simple"
    logger.debug("[MathVerifier] Unrecognised compounding '%s', defaulting to quarterly.", value)
    return "quarterly"


def _error_result(
    printed_amount: Optional[float],
    tolerance: float,
    reason: str,
) -> MathCheckResult:
    """Convenience constructor for logical-error results."""
    logger.warning("[MathVerifier] Logical error: %s", reason)
    return MathCheckResult(
        check_was_possible=False,
        is_valid=False,
        expected_amount=None,
        printed_amount=printed_amount,
        discrepancy_amount=None,
        discrepancy_percent=None,
        tolerance_used_percent=tolerance,
        flag_reason=reason,
    )
