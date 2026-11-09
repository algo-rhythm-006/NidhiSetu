# PRAMAAN-AI (Sovereign-FDR) · AI Microservice

> **Smart India Hackathon (SIH) 2026** — Problem Statement 1: AICTE Security Deposit / FDR Portal  
> **Component**: Python FastAPI AI/ML Microservice (`ai-service/`)  
> **Architecture**: Zero-Trust, Air-Gapped Financial Document Processing Engine  
> **Target Hardware**: NVIDIA GeForce RTX 2050 (4 GB VRAM) / Air-Gapped Edge Server

---

## 1. Project Overview

The **PRAMAAN-AI** microservice provides local, zero-trust artificial intelligence capabilities for the Sovereign-FDR enterprise platform. It serves the primary Java Spring Boot backend and React frontend without relying on external cloud APIs or public network access.

The service implements three specialized AI pipelines:

1. **Pipeline A — Zero-Trust Visual Extraction & Math Verification (`POST /api/v1/fdr/analyze`)**:
   - Ingests scanned Fixed Deposit Receipts (FDR) in PDF or raster image formats (JPEG, PNG, WebP, TIFF).
   - Utilizes `Qwen2.5-VL-3B-Instruct` quantized to 4-bit NF4 for spatial document understanding.
   - Extracts issuing bank, depositor name, principal, interest rate, issue/maturity dates, and printed maturity amount.
   - Automatically executes compound-interest mathematical validation ($A = P(1 + r/n)^{nt}$) to detect fraudulent or altered figures.

2. **Pipeline B — Visual Forensics via Error Level Analysis (`POST /api/v1/fdr/forensics`)**:
   - Executes an OpenCV Error Level Analysis (ELA) pipeline entirely on the host CPU.
   - Detects digital alterations, compression discontinuities, and copy-pasted bank stamps/seals.
   - Returns a global `tamper_probability_score` alongside pixel bounding boxes `[x, y, w, h]` for React UI overlay.

3. **Pipeline C — NL2SQL Administrative Copilot (`POST /api/v1/search/nl2sql`)**:
   - Translates natural language queries into strictly validated, read-only PostgreSQL `SELECT` statements using `Llama 3.2` hosted on a local Ollama instance.
   - Enforces a lexical safety boundary to reject DML/DDL commands (`DROP`, `DELETE`, `INSERT`, `UPDATE`).

---

## 2. Hardware Constraints & VRAM Architecture

> [!WARNING]
> **CRITICAL HARDWARE CONSTRAINT: 4 GB VRAM LIMITATION**  
> This service is engineered specifically to operate within a **4 GB VRAM envelope** (e.g., NVIDIA GeForce RTX 2050 mobile).

* `Qwen2.5-VL-3B` in 4-bit NF4 consumes **~2.2 GB VRAM**.
* `Llama 3.2 (3B)` in Ollama consumes **~2.0 GB VRAM**.
* **Both models CANNOT coexist in GPU memory simultaneously.** Doing so causes an immediate CUDA Out-Of-Memory (`CUDA OOM`) crash.

### Dynamic `ModelManager` VRAM Orchestrator
To solve this, the microservice employs an internal singleton `ModelManager` governed by an `asyncio.Lock`:
* **Mutual Exclusion**: Only one model is resident in VRAM at any time. If an extraction request arrives while Ollama is being queried, requests queue cleanly in FIFO order.
* **Warm Cache Retention**: `Qwen2.5-VL` remains in GPU memory across consecutive FDR extractions to avoid repeated loading overhead.
* **Lazy Eviction**: When an NL2SQL request arrives, `ModelManager` unloads Qwen, invokes garbage collection (`gc.collect()`), and flushes the PyTorch CUDA cache (`torch.cuda.empty_cache()`) before Ollama claims VRAM.
* **Warmup / Swap Latency**: First-time model loading or cross-pipeline swapping takes **5 to 10 seconds**. Subsequent queries to the already-warm model execute in ~1–3 seconds.
* **CPU Concurrency**: Pipeline B (ELA Forensics) runs purely on CPU via OpenCV and **never blocks or waits for the GPU lock**.

---

## 3. Prerequisites

Ensure your host environment satisfies the following requirements:

1. **Operating System**: Windows 10/11 (64-bit) or Linux (Ubuntu 22.04+ recommended for air-gapped servers).
2. **Python**: `3.10` or `3.11` (Python 3.11.6 recommended).
3. **NVIDIA Driver & CUDA Toolkit**:
   - NVIDIA Driver $\ge 535$
   - CUDA 12.1 runtime support
4. **Local Ollama Daemon**:
   - Install Ollama from [ollama.ai](https://ollama.ai)
   - Ensure the daemon is running locally (`ollama serve`)
   - Pull the required Llama 3.2 model:
     ```bash
     ollama pull llama3.2
     ```

---

## 4. Setup & Installation Instructions

Follow these exact steps from within your terminal:

### Step 1: Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS (Bash):**
```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
```

### Step 2: Install PyTorch with CUDA 12.1 Wheels
Install PyTorch and TorchVision targeting the CUDA 12.1 index:

```bash
pip install torch==2.4.1+cu121 torchvision==0.19.1+cu121 --index-url https://download.pytorch.org/whl/cu121
```

### Step 3: Install Core Dependencies
Install the remaining packages pinned in `requirements.txt`:

```bash
pip install -r requirements.txt
```

> [!NOTE]
> On Windows, install `bitsandbytes` directly:
> ```bash
> pip install bitsandbytes
> ```
> Ensure `transformers==4.49.0` is used (pinned in `requirements.txt`) to guarantee full `Qwen2_5_VLForConditionalGeneration` compatibility with PyTorch 2.4.1.

### Step 4: Configure Environment Variables
Copy the template and verify your secrets:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Inspect `.env` and configure your shared internal authentication token:
```env
INTERNAL_API_TOKEN=change-me-before-deploying-a-very-long-secret-key
ALLOWED_ORIGINS=["http://localhost:8080","http://localhost:3000"]
OLLAMA_BASE_URL=http://localhost:11434
LLAMA_MODEL_NAME=llama3.2
QWEN_MODEL_ID=Qwen/Qwen2.5-VL-3B-Instruct
MATH_TOLERANCE_PERCENT=0.5
ELA_QUALITY=90
```

---

## 5. Running the Service

Start the FastAPI application via Uvicorn.

> [!IMPORTANT]
> **Use `--workers 1` exclusively.** The GPU VRAM orchestrator is an in-process singleton. Running multiple Uvicorn worker processes will spawn competing CUDA contexts and trigger Out-Of-Memory errors on a 4 GB card.

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

Expected startup logs:
```
============================================================
  Nidhi-Setu AI Microservice — STARTING UP
============================================================
[Startup] GPU: NVIDIA GeForce RTX 2050 | Total VRAM: 4.00 GB
[Startup] Ollama reachable at http://localhost:11434 ✓  (model: llama3.2)
[Startup] Ready to accept requests.
------------------------------------------------------------
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 6. Verification with `tester.html`

Before connecting the Java Spring Boot backend, teammates should verify all three pipelines using the bundled test dashboard:

1. Ensure the Uvicorn server is running on port `8000`.
2. Open your browser and navigate to:
   ```
   http://localhost:8000/tester
   ```
   *(Alternatively, double-click `tester.html` in the root of the folder).*
3. **Verify Health**: Click the **Health** button in the header. The status indicator should turn green.
4. **Test Module A (Extraction & Math)**: Upload a sample FDR document (`.png`, `.jpg`, `.pdf`, `.webp`) and click **Run Visual Extraction**. Verify that extracted fields and compound interest checks populate.
5. **Test Module B (Forensics)**: Upload an image file and click **Run ELA Forensics**. Verify the tamper probability score and bounding box overlays appear.
6. **Test Module C (NL2SQL)**: Select a quick preset (e.g., *Expiring in WB*) and click **Generate SQL**. Verify the safe PostgreSQL statement and explanation are returned.

---

## 7. Project Layout

```
ai-service/
├── app/
│   ├── api/
│   │   ├── deps.py              # Shared API dependencies
│   │   └── v1/
│   │       ├── router.py        # Aggregates /api/v1 routes
│   │       ├── fdr_analyze.py   # Endpoint: POST /api/v1/fdr/analyze
│   │       ├── fdr_forensics.py # Endpoint: POST /api/v1/fdr/forensics
│   │       └── nl2sql.py        # Endpoint: POST /api/v1/search/nl2sql
│   ├── ml_models/
│   │   ├── model_manager.py     # 🔑 Dynamic VRAM orchestrator (asyncio.Lock)
│   │   ├── qwen_vl.py           # Qwen2.5-VL-3B inference & 4-bit enforcement
│   │   └── llama_nl2sql.py      # LangChain + Ollama Llama 3.2 integration
│   ├── schemas/
│   │   ├── fdr_analyze.py       # Pydantic contracts for extraction & math
│   │   ├── fdr_forensics.py     # Pydantic contracts for ELA forensics
│   │   └── nl2sql.py            # Pydantic contracts for NL2SQL
│   ├── services/
│   │   ├── fdr_analyzer.py      # Pipeline A business logic orchestrator
│   │   ├── forensics_service.py # Pipeline B OpenCV ELA algorithm
│   │   └── nl2sql_service.py    # Pipeline C query translation with tenacity retry
│   ├── utils/
│   │   ├── image_utils.py       # PyMuPDF rasterization & dimension scaling
│   │   ├── math_verifier.py     # Compound interest banking formula verification
│   │   └── security.py          # Zero-trust X-Internal-Token authentication
│   ├── config.py                # Pydantic BaseSettings environment loader
│   └── main.py                  # FastAPI application entry point
├── tests/
│   ├── test_fdr_forensics.py    # Synthetic image forensics unit tests
│   ├── test_math_verifier.py    # Banking math & currency edge case tests
│   └── test_nl2sql.py           # SQL safety audit & query parsing unit tests
├── .env.example                 # Environment configuration template
├── architecture.md              # Detailed API contracts for Java Spring Boot team
├── requirements.txt             # Pinned Python package dependencies
├── tester.html                  # Standalone interactive test dashboard
└── README.md                    # This document
```

---

## 8. Troubleshooting

| Issue | Cause | Resolution |
|---|---|---|
| `HTTP 401 Unauthorized` | Missing or mismatched `X-Internal-Token` | Set header to value matching `INTERNAL_API_TOKEN` in `.env`. |
| `HTTP 500 "RuntimeError: normal_kernel_cpu..."` | Transformers version mismatch | Ensure `transformers==4.49.0` is installed and `Qwen2_5_VLForConditionalGeneration` is used. |
| `Ollama ResponseError: model not found (404)` | Missing Ollama model | Run `ollama pull llama3.2` and verify with `ollama list`. |
| `CUDA out of memory` | Multiple worker processes or concurrent model loads | Verify Uvicorn is running with `--workers 1` and no other GPU processes occupy VRAM. |
