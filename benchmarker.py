"""
benchmarker.py — GEO/AEO Benchmarker for bucateperoate.ro
6 agents, all via OpenRouter (one free API key, no credit card needed).

─── Setup (one-time) ────────────────────────────────────────────────────────
1. Create free account at https://openrouter.ai  → Dashboard → API Keys → Create key
2. Paste the key in OPENROUTER_API_KEY below
3. Install packages:
       pip install aiohttp pandas gspread google-auth-oauthlib
4. Place credentials.json (Google OAuth Desktop app) in this folder
   → https://console.cloud.google.com → APIs & Services → Credentials
5. Update SHEET_ID with your Google Sheet ID
6. Run:  python benchmarker.py
   First run opens browser for Google OAuth → saves token.json for future runs
─────────────────────────────────────────────────────────────────────────────

Agents (GEO-accurate models — web search enabled where the API supports it):
  ChatGPT   → openai/gpt-4o-search-preview   ✅ web search (matches ChatGPT Plus)
  Claude    → anthropic/claude-3-5-sonnet     ⚠️  training data only (no web search API)
  Gemini    → google/gemini-2.0-flash-001     ⚠️  training data only (search grounding needs Google AI Studio)
  Perplexity→ perplexity/sonar-pro            ✅ web search (primary GEO signal)
  Copilot   → openai/gpt-4o-mini + Brave RAG  ✅ real-time search (Brave → gpt-4o-mini synthesis)
  Meta      → meta-llama/llama-4-maverick    ⚠️  training data only (Meta AI search not in API)
─────────────────────────────────────────────────────────────────────────────

Rotation: 233 questions ÷ 6 agents = ~39 per agent per run.
After 6 runs every agent has answered every question.
rotation_state.json tracks the current offset automatically.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import aiohttp
import time
import json
import math
import logging
import os
import pandas as pd
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# API KEYS — loaded from .env file
# ─────────────────────────────────────────────

OPENROUTER_API_KEY   = os.getenv("OPENROUTER_API_KEY", "")
BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY", "")
GEMINI_API_KEY       = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY    = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY", "")

# ─────────────────────────────────────────────
# GOOGLE SHEETS CONFIG  ← update SHEET_ID
# ─────────────────────────────────────────────

SHEET_ID    = "11LaodjR8Lu9gtul-WU7bloTnLBeXK1x-e099EZcZ2aU"   # BucatePeRoate GEO/AEO sheet
SOURCE_TAB  = "GEO Priority Matrix"
RESULTS_TAB = "GEO Results"

# ─────────────────────────────────────────────
# AGENT MODEL MAPPING
# Swap any model slug for a :free alternative from openrouter.ai/models
# ─────────────────────────────────────────────

AGENT_MODELS = {
    # ChatGPT — direct OpenAI API with gpt-4o-search-preview: native web search ✅
    "ChatGPT":    "gpt-4o-search-preview",
    # Claude — native Anthropic API with web_search tool ✅ (routed separately)
    "Claude":     "anthropic/claude-sonnet-4-6",
    # Gemini — Google AI API with google_search grounding ✅ (routed separately, free tier)
    "Gemini":     "google/gemini-2.0-flash-001",
    # Perplexity — Sonar Pro: real-time web search via Perplexity engine ✅
    "Perplexity": "perplexity/sonar",
    # Copilot — Brave Search RAG → OpenAI GPT-4o-mini direct ✅
    "Copilot":    "gpt-4o-mini",
    # Meta — Brave Search RAG → Llama 4 Maverick via OpenRouter ✅
    "Meta":       "meta-llama/llama-3.1-8b-instruct",
}

# ── Custom question allocation per agent ──────────────────────────────────────
# Weighted to balance cost: Gemini (free) and ChatGPT (cheap) get the most.
# Claude (expensive web search) gets fewest. Total must equal number of questions.
# At 233 questions: ChatGPT $0.18 | Claude $0.21 | Gemini $0.00 |
#                   Perplexity $0.28 | Copilot $0.24 | Meta $0.02 → ~$0.93/run
AGENT_QUESTION_COUNTS = {
    "ChatGPT":    80,   # gpt-4o-search-preview via OpenAI direct
    "Claude":      0,   # disabled: Anthropic web search beta 429s consistently — re-enable when stable
    "Gemini":      5,   # Google AI Studio FREE tier — auto-skips if quota hit
    "Perplexity": 60,   # sonar-pro — absorbing Claude's 10 questions
    "Copilot":    60,   # gpt-4o-mini + Brave RAG
    "Meta":       28,   # llama-4-maverick + Brave RAG
}
# Total: 233 questions/run  (80+10+5+50+60+28 = 233)
# Est. cost/run: ChatGPT $0.23 | Claude $0.21 | Gemini $0 |
#               Perplexity $0.28 | Copilot $0.02 | Meta $0.03 → ~$0.77 + 5.5% OR ≈ $0.81
# Rotation step: questions shift by this many positions each run so each
# agent progressively covers the full question bank over multiple weeks.
ROTATION_STEP = 39

# ─────────────────────────────────────────────
# BENCHMARK CONFIG
# ─────────────────────────────────────────────

NUM_CONCURRENT     = 2       # 2 parallel calls — all models now paid with high rate limits
MAX_RETRIES        = 3
RETRY_BACKOFF_BASE = 2.0     # exponential base — capped at MAX_BACKOFF
MAX_BACKOFF        = 60.0    # never wait more than 60s per retry
REQUEST_TIMEOUT    = 90      # seconds per call (sonar-pro can be slow with search)
CALL_DELAY         = 2.0     # OpenRouter paid models: no platform limit → 2s comfortable

# Per-agent delay overrides based on confirmed plan limits:
#   Claude → Anthropic Tier 1: 50 RPM, only 10 questions → 3s is plenty
#   Gemini → Google AI Studio free: 15 RPM + search grounding multiplies → 8s safe
#   Others → OpenRouter paid: no platform limit, upstream allows 50-500 RPM
AGENT_CALL_DELAY = {
    "Claude": 3.0,
    "Gemini": 15.0,   # free tier 15 RPM ÷ ~3 internal grounding requests = 5 usable/min → 15s safe
}
ROTATION_FILE      = "rotation_state.json"

# Agents that use Brave Search RAG (search first → inject results → model answers)
# Simulates Copilot (Bing-powered) and Meta AI (Bing-powered) behaviour
BRAVE_SEARCH_AGENTS = {"Copilot", "Meta"}
BRAVE_SEARCH_COUNT  = 5     # number of web results to inject as context

# Gemini uses Google AI API directly with Google Search grounding (not OpenRouter)
# Replicates what Google AI Overviews actually return
GEMINI_AGENTS = {"Gemini"}

# Claude uses Anthropic API directly with native web_search tool
# Replicates what Claude.ai users get when they ask a question today
CLAUDE_AGENTS = {"Claude"}

# ChatGPT uses OpenAI API directly with gpt-4o-search-preview (native web search)
CHATGPT_AGENTS  = {"ChatGPT"}
OPENAI_API_URL  = "https://api.openai.com/v1/chat/completions"

OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer":  "https://bucateperoate.ro",
    "X-Title":       "BpR GEO Benchmarker",
    "Content-Type":  "application/json",
}

ROMANIAN_SYSTEM_PROMPT = (
    "Ești un asistent util și precis. "
    "Răspunde EXCLUSIV în limba română, indiferent de limba în care este formulată întrebarea. "
    "Nu folosi nicio altă limbă. Fii concis, informativ și natural."
)

# System prompt for Brave Search RAG agents (Copilot, Meta)
# Instructs the model to answer using the injected web search results
BRAVE_RAG_SYSTEM_PROMPT = (
    "Ești un asistent util și precis. "
    "Răspunde EXCLUSIV în limba română. "
    "Vei primi rezultate de căutare web actuale ca și context. "
    "Bazează-ți răspunsul EXCLUSIV pe aceste rezultate — nu pe cunoștințele din antrenament. "
    "Dacă găsești furnizori, servicii sau companii relevante în rezultate, menționează-le explicit. "
    "Fii concis, informativ și natural."
)

# ─────────────────────────────────────────────
# ROTATION LOGIC
# ─────────────────────────────────────────────

def load_rotation() -> dict:
    if os.path.exists(ROTATION_FILE):
        with open(ROTATION_FILE) as f:
            return json.load(f)
    return {"run_count": 0, "offset": 0}


def save_rotation(state: dict):
    with open(ROTATION_FILE, "w") as f:
        json.dump(state, f, indent=2)


def assign_chunks_weighted(questions: list, agent_question_counts: dict, run_count: int) -> dict:
    """
    Assigns questions to agents using custom per-agent counts (not equal splits).
    The question list rotates by ROTATION_STEP each run so that over many weeks
    each agent progressively covers the full question bank.

    Example: Claude gets 10 questions/run → full coverage after ~24 runs (~6 months).
             Gemini gets 60 questions/run → full coverage after ~4 runs (~1 month).
    """
    total   = len(questions)
    shift   = (run_count * ROTATION_STEP) % total
    rotated = questions[shift:] + questions[:shift]

    assignment = {}
    pos = 0
    for agent, count in agent_question_counts.items():
        assignment[agent] = rotated[pos : pos + count]
        pos += count

    return assignment


# ─────────────────────────────────────────────
# GOOGLE SHEETS — AUTH
# ─────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def get_gspread_client():
    import gspread
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists("credentials.json"):
                raise FileNotFoundError(
                    "credentials.json not found.\n"
                    "Download from Google Cloud Console → APIs & Services → Credentials."
                )
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as f:
            f.write(creds.to_json())

    return gspread.authorize(creds)


# ─────────────────────────────────────────────
# GOOGLE SHEETS — READ QUESTIONS
# ─────────────────────────────────────────────

def load_questions_from_sheets() -> list:
    gc  = get_gspread_client()
    sh  = gc.open_by_key(SHEET_ID)
    ws  = sh.worksheet(SOURCE_TAB)
    rows = ws.get_all_records()

    QUESTION_KEYS = ["Question", "Întrebare", "Intrebare", "Query", "Interogare"]
    KEYWORD_KEYS  = ["Keywords", "Cuvinte cheie", "Cuvinte_cheie", "Keyword"]
    CATEGORY_KEYS = ["Category", "Categorie", "Tip"]
    PRIORITY_KEYS = ["Priority", "Prioritate", "Prio"]

    def pick(row, keys):
        for k in keys:
            if k in row and str(row[k]).strip():
                return str(row[k]).strip()
        return ""

    questions = []
    for i, row in enumerate(rows, start=1):
        q = pick(row, QUESTION_KEYS)
        if not q:
            q = max((str(v) for v in row.values() if isinstance(v, str)), key=len, default="")
        if not q or len(q) < 5:
            continue
        kw_raw   = pick(row, KEYWORD_KEYS)
        keywords = [k.strip() for k in kw_raw.split(",") if k.strip()] if kw_raw else []
        questions.append({
            "id":                i,
            "prompt":            q,
            "expected_keywords": keywords,
            "category":          pick(row, CATEGORY_KEYS),
            "priority":          pick(row, PRIORITY_KEYS),
        })

    logging.info(f"Loaded {len(questions)} questions from '{SOURCE_TAB}'")
    return questions


# ─────────────────────────────────────────────
# GOOGLE SHEETS — WRITE RESULTS
# ─────────────────────────────────────────────

def write_results_to_sheets(df: pd.DataFrame, agent_names: list, run_info: str):
    import gspread

    gc = get_gspread_client()
    sh = gc.open_by_key(SHEET_ID)

    try:
        ws        = sh.worksheet(RESULTS_TAB)
        existing  = ws.get_all_values()
        start_row = len(existing) + 2   # blank separator row between runs
    except gspread.exceptions.WorksheetNotFound:
        ws        = sh.add_worksheet(title=RESULTS_TAB, rows=5000, cols=60)
        start_row = 1

    rows_out = []
    for qid in sorted(df["Question_ID"].unique()):
        q_rows = df[df["Question_ID"] == qid]
        first  = q_rows.iloc[0]

        row = {
            "Run":         run_info,
            "Question_ID": int(qid),
            "Question":    first["Question"],
            "Category":    first.get("Category", ""),
            "Priority":    first.get("Priority", ""),
        }

        scores = []
        for agent in agent_names:
            a = q_rows[q_rows["Agent"] == agent]
            if not a.empty:
                ar = a.iloc[0]
                row[f"{agent}_Response"] = ar["Response"]
                row[f"{agent}_Score"]    = ar["KW_Score"]
                row[f"{agent}_Latency"]  = ar["Latency_Sec"]
                row[f"{agent}_Status"]   = ar["Status"]
                if ar["Status"] == "OK":
                    scores.append(float(ar["KW_Score"]))
            else:
                row[f"{agent}_Response"] = "not assigned this run"
                row[f"{agent}_Score"]    = ""
                row[f"{agent}_Latency"]  = ""
                row[f"{agent}_Status"]   = "skipped"

        row["Avg_KW_Score"] = round(sum(scores) / len(scores), 2) if scores else ""
        rows_out.append(row)

    wide_df = pd.DataFrame(rows_out)
    header  = list(wide_df.columns)
    values  = [header] + [
        [str(v) if v is not None else "" for v in r]
        for r in wide_df.fillna("").values.tolist()
    ]

    ws.update(values, f"A{start_row}")

    try:
        last_col = chr(ord("A") + min(len(header) - 1, 25))
        ws.format(f"A{start_row}:{last_col}{start_row}", {"textFormat": {"bold": True}})
    except Exception:
        pass

    logging.info(f"✓ Results written to '{RESULTS_TAB}' at row {start_row} ({len(rows_out)} rows)")


# ─────────────────────────────────────────────
# GOOGLE SHEETS — DASHBOARD TAB
# ─────────────────────────────────────────────

DASHBOARD_TAB = "GEO Dashboard"

# Brand colours for the dashboard
COLOR_HEADER  = {"red": 0.13, "green": 0.27, "blue": 0.53}   # dark blue
COLOR_WHITE   = {"red": 1.0,  "green": 1.0,  "blue": 1.0}
COLOR_GREEN   = {"red": 0.72, "green": 0.88, "blue": 0.72}   # score ≥ 50
COLOR_YELLOW  = {"red": 1.0,  "green": 0.95, "blue": 0.60}   # score 20–49
COLOR_RED     = {"red": 0.96, "green": 0.80, "blue": 0.80}   # score < 20
COLOR_TITLE   = {"red": 0.07, "green": 0.16, "blue": 0.36}   # near-black navy
COLOR_LIGHT   = {"red": 0.93, "green": 0.95, "blue": 0.98}   # alternating row tint


def score_color(score) -> dict:
    try:
        s = float(score)
        if s >= 50:  return COLOR_GREEN
        if s >= 20:  return COLOR_YELLOW
        return COLOR_RED
    except Exception:
        return COLOR_WHITE


def update_dashboard(df: pd.DataFrame, agent_names: list, run_number: int, run_date: str):
    """
    Appends one summary row per run to the GEO Dashboard tab.
    Creates + formats the tab on first run; subsequent runs just append a row.

    Layout:
      Row 1 : Title bar  "BpR GEO/AEO Daily Benchmark Dashboard"
      Row 2 : Column headers
      Row 3+: One row per daily run
    """
    import gspread

    gc = get_gspread_client()
    sh = gc.open_by_key(SHEET_ID)

    AGENT_COLS  = [f"{a} Avg%" for a in agent_names]
    HEADER_ROW  = ["Run #", "Date", "Qs Answered"] + AGENT_COLS + ["Overall Avg%", "Success%"]

    # ── Get or create tab ──────────────────────
    try:
        ws       = sh.worksheet(DASHBOARD_TAB)
        all_rows = ws.get_all_values()
        is_new   = len(all_rows) == 0
    except gspread.exceptions.WorksheetNotFound:
        ws     = sh.add_worksheet(title=DASHBOARD_TAB, rows=500, cols=len(HEADER_ROW) + 2)
        is_new = True

    # ── First-time setup: title + header ──────
    if is_new:
        # Title row
        ws.update([["BpR GEO/AEO Daily Benchmark Dashboard"]], "A1")
        ws.merge_cells(f"A1:{chr(ord('A') + len(HEADER_ROW) - 1)}1")
        ws.format("A1", {
            "backgroundColor": COLOR_TITLE,
            "textFormat": {
                "bold": True, "fontSize": 14,
                "foregroundColor": COLOR_WHITE,
            },
            "horizontalAlignment": "CENTER",
            "verticalAlignment": "MIDDLE",
        })
        ws.update([HEADER_ROW], "A2")
        last_h = chr(ord("A") + len(HEADER_ROW) - 1)
        ws.format(f"A2:{last_h}2", {
            "backgroundColor": COLOR_HEADER,
            "textFormat": {"bold": True, "foregroundColor": COLOR_WHITE},
            "horizontalAlignment": "CENTER",
        })
        # Freeze title + header
        ws.freeze(rows=2)
        all_rows = [["title"], HEADER_ROW]   # simulate existing rows for append logic

    # ── Build summary row ──────────────────────
    success_df = df[df["Status"] == "OK"]
    row_data   = [run_number, run_date, len(df)]

    agent_avgs = []
    for agent in agent_names:
        a_df = success_df[success_df["Agent"] == agent]
        avg  = round(a_df["KW_Score"].mean(), 1) if not a_df.empty else 0.0
        agent_avgs.append(avg)
        row_data.append(avg)

    overall_avg  = round(success_df["KW_Score"].mean(), 1) if not success_df.empty else 0.0
    success_pct  = round((df["Status"] == "OK").mean() * 100, 1)
    row_data    += [overall_avg, success_pct]

    next_row = len(all_rows) + 1   # 1-indexed; all_rows includes title + header
    ws.update([row_data], f"A{next_row}")

    # ── Colour-code each agent score cell ─────
    score_col_start = 4   # D column (Run#, Date, Qs = A B C)
    for col_offset, avg in enumerate(agent_avgs):
        col_letter = chr(ord("A") + score_col_start - 1 + col_offset)
        ws.format(f"{col_letter}{next_row}", {
            "backgroundColor": score_color(avg),
            "horizontalAlignment": "CENTER",
        })

    # Overall avg column
    overall_col = chr(ord("A") + score_col_start - 1 + len(agent_names))
    ws.format(f"{overall_col}{next_row}", {
        "backgroundColor": score_color(overall_avg),
        "textFormat": {"bold": True},
        "horizontalAlignment": "CENTER",
    })

    # Alternating light tint for readability on even rows
    if (next_row % 2) == 0:
        ws.format(f"A{next_row}:C{next_row}", {
            "backgroundColor": COLOR_LIGHT,
        })

    logging.info(
        f"✓ Dashboard updated — Run #{run_number} | "
        f"Overall avg: {overall_avg}% | Success: {success_pct}%"
    )


# ─────────────────────────────────────────────
# GEO SCORING
# Measures how prominently Bucate pe Roate appears as a result/recommendation.
# ─────────────────────────────────────────────

# All known brand name variants (case-insensitive)
BRAND_VARIANTS = [
    "bucate pe roate",
    "bucateperoate",
    "bucateperoate.ro",
    "carte blanche",        # premium sub-brand
    "carteblanche.ro",
]

# Words that signal a strong, active recommendation
RECOMMENDATION_SIGNALS = [
    # Romanian
    "recomand", "recomandat", "recomandăm", "recomandare",
    "cea mai bună opțiune", "cea mai buna optiune",
    "lider", "specialist", "expert", "profesionist",
    "contactați", "contactati", "apelați", "apelati",
    "vizitați", "vizitati", "accesați", "accesati",
    "furnizor de top", "furnizor recunoscut",
    "prima alegere", "alegere ideală", "alegere ideala",
    "numărul 1", "numarul 1",
    # English (some models may respond partly in EN even with RO prompt)
    "recommend", "top choice", "best option", "leading", "go-to",
    "contact them", "visit their", "check out",
]

# Words that show the mention is in a relevant catering/food context
CONTEXT_SIGNALS = [
    "catering", "livrare", "mâncare", "mancare", "eveniment",
    "nuntă", "nunta", "corporate", "prânz", "pranz",
    "meniu", "bucătărie", "bucatarie", "preparate",
    "food", "delivery", "lunch", "event",
]


def geo_score(response_text: str) -> float:
    """
    GEO/AEO visibility score for Bucate pe Roate.

    0   — brand not mentioned at all
    30  — brand name appears somewhere in the response
    60  — brand mentioned AND the response is in a relevant catering/food context
    100 — brand explicitly recommended, presented as top choice, or primary answer

    This is the only metric that matters for GEO: does the AI surface BpR?
    """
    if not response_text:
        return 0.0

    text = response_text.lower()

    # Step 1: is the brand mentioned at all?
    mentioned = any(variant in text for variant in BRAND_VARIANTS)
    if not mentioned:
        return 0.0

    # Step 2: is there an explicit recommendation signal?
    if any(sig in text for sig in RECOMMENDATION_SIGNALS):
        return 100.0

    # Step 3: mentioned in relevant context (catering / food / events)
    if any(ctx in text for ctx in CONTEXT_SIGNALS):
        return 60.0

    # Mentioned but context unclear
    return 30.0


# ─────────────────────────────────────────────
# API CALL — all agents use OpenRouter (OpenAI-compatible)
# ─────────────────────────────────────────────

async def call_openrouter(
    session:       aiohttp.ClientSession,
    agent_name:    str,
    model:         str,
    question:      str,
    system_prompt: str = None,
) -> tuple:
    """Returns (answer_text, status_string)."""
    if system_prompt is None:
        system_prompt = ROMANIAN_SYSTEM_PROMPT
    headers = {**OPENROUTER_HEADERS, "Authorization": f"Bearer {OPENROUTER_API_KEY}"}
    payload = {
        "model":      model,
        "max_tokens": 1024,   # cap to avoid HTTP 402 on low-credit accounts
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": question},
        ],
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    text = data["choices"][0]["message"]["content"]
                    return text, "OK"
                elif resp.status == 429:
                    wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
                    logging.warning(f"[{agent_name}] 429 rate-limit, waiting {wait:.0f}s…")
                    await asyncio.sleep(wait)
                elif resp.status == 402:
                    body = await resp.text()
                    logging.error(
                        f"[{agent_name}] HTTP 402 INSUFFICIENT CREDITS — add credits at "                        f"https://openrouter.ai/settings/credits  (balance too low for {model})"
                    )
                    return f"HTTP 402: insufficient OpenRouter credits", "Failed"
                else:
                    body = await resp.text()
                    logging.warning(f"[{agent_name}] HTTP {resp.status}: {body[:200]}")
                    return f"HTTP {resp.status}: {body[:300]}", "Failed"
        except asyncio.TimeoutError:
            wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
            logging.warning(f"[{agent_name}] timeout attempt {attempt}, waiting {wait:.0f}s…")
            await asyncio.sleep(wait)
        except Exception as exc:
            return f"Exception: {exc}", "Exception"

    return "Max retries exceeded", "Failed"


# ─────────────────────────────────────────────
# BRAVE SEARCH — fetch live web results as context
# ─────────────────────────────────────────────

async def brave_search(session: aiohttp.ClientSession, query: str) -> str:
    """
    Calls Brave Search API and returns formatted result snippets.
    Used by Copilot and Meta agents to simulate Bing-grounded responses.
    Returns empty string on failure (agent falls back to training data).
    """
    url     = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept":               "application/json",
        "Accept-Encoding":      "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
    }
    params = {
        "q":           query,
        "count":       BRAVE_SEARCH_COUNT,
        # country omitted: Romania (RO) is not in Brave's supported country enum — causes HTTP 422
        "search_lang": "ro",
    }
    try:
        async with session.get(
            url, headers=headers, params=params,
            timeout=aiohttp.ClientTimeout(total=15),
        ) as resp:
            if resp.status == 200:
                data    = await resp.json()
                results = data.get("web", {}).get("results", [])
                snippets = []
                for i, r in enumerate(results[:BRAVE_SEARCH_COUNT], 1):
                    title = r.get("title", "")
                    desc  = r.get("description", "")
                    link  = r.get("url", "")
                    snippets.append(f"{i}. {title}\n   {desc}\n   {link}")
                context = "\n\n".join(snippets)
                logging.debug(f"Brave Search returned {len(results)} results for: {query[:60]}")
                return context
            else:
                logging.warning(f"Brave Search HTTP {resp.status} for query: {query[:60]}")
                return ""
    except Exception as exc:
        logging.warning(f"Brave Search error: {exc}")
        return ""


# ─────────────────────────────────────────────
# GEMINI — Google AI API with Search grounding
# Replicates Google AI Overviews (real-time Google Search built in)
# ─────────────────────────────────────────────

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

async def call_gemini_with_search(
    session:    aiohttp.ClientSession,
    agent_name: str,
    question:   str,
) -> tuple:
    """
    Calls Gemini 2.0 Flash via Google AI API with google_search grounding tool.
    This is what Google AI Overviews actually use — real-time Google Search results
    grounded into the response. Most important signal for Romanian local GEO.
    """
    url     = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": question}]}
        ],
        "tools": [{"google_search": {}}],
        "system_instruction": {
            "parts": [{"text": ROMANIAN_SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature":     0.7,
            "maxOutputTokens": 1024,
        },
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.post(
                url, json=payload,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            ) as resp:
                if resp.status == 200:
                    data       = await resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text  = "".join(p.get("text", "") for p in parts)
                        return text, "OK"
                    return "No candidates in Gemini response", "Failed"
                elif resp.status == 429:
                    wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
                    logging.warning(f"[{agent_name}] Gemini 429, waiting {wait:.0f}s…")
                    await asyncio.sleep(wait)
                else:
                    body = await resp.text()
                    return f"HTTP {resp.status}: {body[:300]}", "Failed"
        except asyncio.TimeoutError:
            wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
            logging.warning(f"[{agent_name}] Gemini timeout attempt {attempt}, waiting {wait:.0f}s…")
            await asyncio.sleep(wait)
        except Exception as exc:
            return f"Exception: {exc}", "Exception"

    return "Max retries exceeded", "Failed"


# ─────────────────────────────────────────────
# CLAUDE — Anthropic API with native web search tool
# Replicates Claude.ai live search experience
# ─────────────────────────────────────────────

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_HEADERS = {
    "x-api-key":        ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-beta":   "web-search-2025-03-05",
    "content-type":     "application/json",
}



# ─────────────────────────────────────────────
# OPENAI DIRECT — ChatGPT with native web search
# ─────────────────────────────────────────────

async def call_openai_with_search(
    session:       aiohttp.ClientSession,
    agent_name:    str,
    model:         str,
    question:      str,
    system_prompt: str = None,
) -> tuple:
    """
    Calls OpenAI API directly.
    Used for ChatGPT (gpt-4o-search-preview) and Copilot/Meta RAG synthesis (gpt-4o-mini).
    """
    if system_prompt is None:
        system_prompt = ROMANIAN_SYSTEM_PROMPT
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":      model,
        "max_tokens": 1024,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": question},
        ],
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.post(
                OPENAI_API_URL, headers=headers, json=payload,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    text = data["choices"][0]["message"]["content"]
                    return text, "OK"
                elif resp.status == 429:
                    wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
                    logging.warning(f"[{agent_name}] OpenAI 429, waiting {wait:.0f}s...")
                    await asyncio.sleep(wait)
                elif resp.status == 402:
                    logging.error(f"[{agent_name}] HTTP 402 — insufficient OpenAI credits, add at platform.openai.com/settings/billing")
                    return "HTTP 402: insufficient OpenAI credits", "Failed"
                else:
                    body = await resp.text()
                    logging.warning(f"[{agent_name}] OpenAI HTTP {resp.status}: {body[:200]}")
                    return f"HTTP {resp.status}: {body[:300]}", "Failed"
        except asyncio.TimeoutError:
            wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
            logging.warning(f"[{agent_name}] OpenAI timeout attempt {attempt}, waiting {wait:.0f}s...")
            await asyncio.sleep(wait)
        except Exception as exc:
            return f"Exception: {exc}", "Exception"
    return "Max retries exceeded", "Failed"


async def call_claude_with_search(
    session:    aiohttp.ClientSession,
    agent_name: str,
    question:   str,
) -> tuple:
    """
    Calls claude-sonnet-4-6 via Anthropic API with the web_search_20250305 tool.
    Claude searches the live web and answers from today's results —
    exactly what a Claude.ai user gets when they ask a question.
    """
    payload = {
        "model":      "claude-sonnet-4-6",
        "max_tokens": 1024,
        "system":     ROMANIAN_SYSTEM_PROMPT,
        "tools": [
            {
                "type":     "web_search_20250305",
                "name":     "web_search",
                "max_uses": 5,
            }
        ],
        "messages": [
            {"role": "user", "content": question}
        ],
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.post(
                ANTHROPIC_API_URL,
                headers=ANTHROPIC_HEADERS,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            ) as resp:
                if resp.status == 200:
                    data    = await resp.json()
                    content = data.get("content", [])
                    # Extract only text blocks (skip tool_use / tool_result blocks)
                    text_parts = [
                        block.get("text", "")
                        for block in content
                        if block.get("type") == "text"
                    ]
                    text = "\n".join(text_parts).strip()
                    return text if text else "No text in Claude response", "OK"
                elif resp.status == 429:
                    wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
                    logging.warning(f"[{agent_name}] Anthropic 429, waiting {wait:.0f}s…")
                    await asyncio.sleep(wait)
                else:
                    body = await resp.text()
                    return f"HTTP {resp.status}: {body[:300]}", "Failed"
        except asyncio.TimeoutError:
            wait = min(RETRY_BACKOFF_BASE ** attempt, MAX_BACKOFF)
            logging.warning(f"[{agent_name}] Anthropic timeout attempt {attempt}, waiting {wait:.0f}s…")
            await asyncio.sleep(wait)
        except Exception as exc:
            return f"Exception: {exc}", "Exception"

    return "Max retries exceeded", "Failed"


# ─────────────────────────────────────────────
# AGENT DISPATCHER — routes to correct call path
# ─────────────────────────────────────────────

async def call_agent(
    session:    aiohttp.ClientSession,
    agent_name: str,
    model:      str,
    question:   str,
) -> tuple:
    """
    Dispatches to the right call path per agent:
    - CHATGPT_AGENTS:      OpenAI API direct + gpt-4o-search-preview (ChatGPT Plus experience)
    - CLAUDE_AGENTS:       Anthropic API + native web_search tool (claude.ai experience)
    - GEMINI_AGENTS:       Google AI API + Google Search grounding (AI Overviews)
    - BRAVE_SEARCH_AGENTS: Brave Search RAG -> inject results -> OpenAI gpt-4o-mini direct
    - All others:          OpenRouter fallback (unused currently)
    """
    if agent_name in CHATGPT_AGENTS:
        return await call_openai_with_search(session, agent_name, model, question)

    if agent_name in CLAUDE_AGENTS:
        return await call_claude_with_search(session, agent_name, question)

    if agent_name in GEMINI_AGENTS:
        return await call_gemini_with_search(session, agent_name, question)

    if agent_name in BRAVE_SEARCH_AGENTS:
        # Step 1 — search the web
        search_context = await brave_search(session, question)

        if search_context:
            # Step 2 — inject results as grounded context
            grounded_question = (
                f"Rezultate căutare web pentru întrebarea ta:\n\n"
                f"{search_context}\n\n"
                f"---\n"
                f"Întrebare: {question}"
            )
            system = BRAVE_RAG_SYSTEM_PROMPT
        else:
            # Fallback: no search results, use training data
            logging.warning(f"[{agent_name}] Brave Search returned no results — falling back to training data")
            grounded_question = question
            system = ROMANIAN_SYSTEM_PROMPT

        # Copilot: OpenAI gpt-4o-mini direct (cheaper, same model)
        # Meta: OpenRouter llama-4-maverick (needs OpenRouter for Llama)
        if agent_name == "Copilot":
            return await call_openai_with_search(session, agent_name, "gpt-4o-mini", grounded_question, system_prompt=system)
        else:
            return await call_openrouter(session, agent_name, model, grounded_question, system_prompt=system)

    else:
        # Perplexity and any remaining agents via OpenRouter
        return await call_openrouter(session, agent_name, model, question)


# ─────────────────────────────────────────────
# RUN-LEVEL AGENT SKIP TRACKER
# If an agent hits SKIP_AFTER_FAILURES consecutive failures it is
# automatically skipped for the rest of the run — no manual intervention needed.
# ─────────────────────────────────────────────

SKIP_AFTER_FAILURES = 1          # skip agent after first failed question (already retried MAX_RETRIES internally)
_agent_fail_count: dict = {}     # tracks consecutive failures per agent
_skipped_agents:   set  = set()  # agents dropped from this run


# ─────────────────────────────────────────────
# WORKER
# ─────────────────────────────────────────────

async def worker(
    session:    aiohttp.ClientSession,
    semaphore:  asyncio.Semaphore,
    agent_name: str,
    model:      str,
    item:       dict,
) -> dict:
    async with semaphore:

        # ── Auto-skip if agent already gave up this run ──
        if agent_name in _skipped_agents:
            return {
                "Question_ID": item["id"],
                "Question":    item["prompt"],
                "Category":    item.get("category", ""),
                "Priority":    item.get("priority", ""),
                "Agent":       agent_name,
                "Model":       model,
                "Status":      "Skipped",
                "Latency_Sec": 0.0,
                "Response":    "Agent auto-skipped — too many consecutive failures this run",
                "KW_Score":    0.0,
            }

        delay = AGENT_CALL_DELAY.get(agent_name, CALL_DELAY)
        await asyncio.sleep(delay)
        start          = time.perf_counter()
        answer, status = await call_agent(session, agent_name, model, item["prompt"])
        latency        = time.perf_counter() - start

        # ── Track failures; skip agent if threshold reached ──
        if status in ("Failed", "Exception"):
            _agent_fail_count[agent_name] = _agent_fail_count.get(agent_name, 0) + 1
            if _agent_fail_count[agent_name] >= SKIP_AFTER_FAILURES:
                _skipped_agents.add(agent_name)
                logging.warning(
                    f"⚠️  [{agent_name}] AUTO-SKIPPED for remainder of this run "
                    f"({SKIP_AFTER_FAILURES} consecutive failures). "
                    f"All remaining {agent_name} questions will be marked Skipped."
                )
        else:
            _agent_fail_count[agent_name] = 0   # reset on success

        return {
            "Question_ID": item["id"],
            "Question":    item["prompt"],
            "Category":    item.get("category", ""),
            "Priority":    item.get("priority", ""),
            "Agent":       agent_name,
            "Model":       model,
            "Status":      status,
            "Latency_Sec": round(latency, 3),
            "Response":    answer,
            "KW_Score":    geo_score(answer),
        }


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

async def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    run_start = datetime.now(timezone.utc).isoformat()
    logging.info(f"GEO/AEO Benchmarker  |  {run_start}")

    # Reset per-run skip tracker (in case script is run multiple times in same process)
    _agent_fail_count.clear()
    _skipped_agents.clear()

    if OPENROUTER_API_KEY.startswith("your_"):
        logging.error("OPENROUTER_API_KEY is not set. Get a free key at https://openrouter.ai")
        return

    agent_names = list(AGENT_MODELS.keys())
    logging.info(f"Agents ({len(agent_names)}): {', '.join(agent_names)}")

    # ── Load questions ────────────────────────
    logging.info("Loading questions from Google Sheets...")
    all_questions = load_questions_from_sheets()
    if not all_questions:
        logging.error("No questions found. Check SOURCE_TAB name and column headers.")
        return

    # ── Rotation ──────────────────────────────
    rot        = load_rotation()
    run_number = rot["run_count"] + 1
    run_info   = f"Run {run_number} | shift={(( run_number-1)*ROTATION_STEP)%len(all_questions)} | {run_start[:10]}"

    logging.info(
        f"Run #{run_number} | rotation shift={(( run_number-1)*ROTATION_STEP)%len(all_questions)} | "
        f"{len(all_questions)} questions total"
    )

    # ── Weighted question allocation ──────────
    assignment = assign_chunks_weighted(all_questions, AGENT_QUESTION_COUNTS, run_number - 1)
    for name, qs in assignment.items():
        logging.info(f"  {name:<12}: {len(qs)} questions")

    # ── Build flat task list ───────────────────
    tasks = []
    for agent_name, model in AGENT_MODELS.items():
        for item in assignment.get(agent_name, []):
            tasks.append((agent_name, model, item))

    logging.info(f"Total API calls planned: {len(tasks)}")

    # ── Run concurrently ───────────────────────
    semaphore = asyncio.Semaphore(NUM_CONCURRENT)
    connector = aiohttp.TCPConnector(limit=20)

    async with aiohttp.ClientSession(connector=connector) as session:
        coros = [worker(session, semaphore, agent, model, item)
                 for agent, model, item in tasks]
        results = await asyncio.gather(*coros, return_exceptions=True)

    # ── Filter exceptions ─────────────────────
    rows = []
    for r in results:
        if isinstance(r, Exception):
            logging.error(f"Task raised exception: {r}")
        elif r is not None:
            rows.append(r)

    if not rows:
        logging.error("No results collected. Nothing to write.")
        return

    # ── Build DataFrame ───────────────────────
    df = pd.DataFrame(rows)

    # Summary stats
    n_answered  = len(df[df["Status"] == "OK"])
    n_skipped   = len(df[df["Status"] == "Skipped"])
    n_failed    = len(df[df["Status"].isin(["Failed", "Exception"])])
    avg_score   = df[df["Status"] == "OK"]["KW_Score"].mean() if n_answered else 0.0
    logging.info(
        f"Results: {n_answered} OK | {n_skipped} skipped | {n_failed} failed | "
        f"avg GEO score {avg_score:.1f}"
    )

    # ── Write to Sheets ───────────────────────
    logging.info("Writing results to Google Sheets...")
    try:
        write_results_to_sheets(df, agent_names, run_info)
    except Exception as e:
        logging.error(f"Failed to write results: {e}")

    # ── Update Dashboard ──────────────────────
    logging.info("Updating dashboard...")
    try:
        update_dashboard(df, agent_names, run_number, run_start[:10])
    except Exception as e:
        logging.error(f"Failed to update dashboard: {e}")

    # ── Save rotation ─────────────────────────
    save_rotation({"run_count": run_number, "offset": (run_number * ROTATION_STEP) % len(all_questions)})

    # ── Done ──────────────────────────────────
    elapsed = (datetime.now(timezone.utc).timestamp() -
               datetime.fromisoformat(run_start).timestamp())
    logging.info(f"Run #{run_number} complete in {elapsed:.0f}s  |  {run_info}")


if __name__ == "__main__":
    asyncio.run(main())
