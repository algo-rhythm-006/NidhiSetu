"""
app/utils/security.py — Nidhi-Setu AI Microservice
====================================================
Zero-trust internal authentication middleware.

The Java Spring Boot backend attaches a shared secret to every request:
    X-Internal-Token: <value from INTERNAL_API_TOKEN env var>

This middleware rejects any request missing or carrying a wrong token.
`secrets.compare_digest` is used intentionally to prevent timing attacks.

Whitelisted paths (no token required):
  - /health          → Java readiness probe
  - /docs            → Swagger UI (disable in production)
  - /redoc           → ReDoc UI (disable in production)
  - /openapi.json    → OpenAPI schema fetch
"""

from __future__ import annotations

import logging
import secrets

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# Paths that bypass authentication (must be exact matches)
_WHITELISTED_PATHS: frozenset[str] = frozenset(
    {
        "/health",
        "/tester",        # HTML test UI — served without token so browser can load it
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    }
)


class InternalTokenMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that validates the X-Internal-Token header
    on every non-whitelisted request.

    Args:
        app:   The ASGI application (passed automatically by FastAPI).
        token: The expected token value (from settings.internal_api_token).
    """

    def __init__(self, app, token: str) -> None:
        super().__init__(app)
        self._expected_token: str = token

    async def dispatch(self, request: Request, call_next):
        # Allow whitelisted paths through without auth
        if request.url.path in _WHITELISTED_PATHS:
            return await call_next(request)

        # Extract token from header
        provided_token: str = request.headers.get("X-Internal-Token", "")

        # Constant-time comparison — prevents timing-based token enumeration
        token_valid = secrets.compare_digest(
            provided_token.encode("utf-8"),
            self._expected_token.encode("utf-8"),
        )

        if not token_valid:
            logger.warning(
                "[Auth] Rejected request to %s — invalid or missing X-Internal-Token.",
                request.url.path,
            )
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "Unauthorized: invalid or missing X-Internal-Token header.",
                    "hint": "Java backend must include X-Internal-Token matching INTERNAL_API_TOKEN env var.",
                },
            )

        return await call_next(request)
