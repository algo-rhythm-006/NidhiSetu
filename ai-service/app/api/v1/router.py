"""app/api/v1/router.py — Nidhi-Setu AI Microservice
Aggregates all v1 sub-routers under the /api/v1 prefix.
Individual feature routers are imported here so main.py stays clean.
"""
from fastapi import APIRouter

# Feature routers — imported here, implemented in their own files
from app.api.v1 import fdr_analyze, fdr_forensics, nl2sql

v1_router = APIRouter()

# POST /api/v1/fdr/analyze   — Feature A: Visual Extraction + Math Verification
v1_router.include_router(
    fdr_analyze.router,
    prefix="/fdr",
    tags=["FDR Analysis — Visual Extraction"],
)

# POST /api/v1/fdr/forensics — Feature B: ELA Visual Forensics
v1_router.include_router(
    fdr_forensics.router,
    prefix="/fdr",
    tags=["FDR Forensics — ELA Tamper Detection"],
)

# POST /api/v1/search/nl2sql — Feature C: NL2SQL Administrative Copilot
v1_router.include_router(
    nl2sql.router,
    prefix="/search",
    tags=["NL2SQL — Administrative Copilot"],
)
