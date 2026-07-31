"""
test_apis.py -- BpR GEO Benchmarker API Diagnostic
Tests every API with one call before running the full benchmarker.

Run:  python test_apis.py

OK  = API key valid, model available, response received
ERR = shows exact HTTP status + error so you know what to fix
"""

import asyncio
import aiohttp
import sys

sys.path.insert(0, ".")
from benchmarker import (
    OPENROUTER_API_KEY, OPENROUTER_URL, OPENROUTER_HEADERS, ROMANIAN_SYSTEM_PROMPT,
    BRAVE_SEARCH_API_KEY, GEMINI_API_KEY, GEMINI_API_URL,
    ANTHROPIC_API_KEY, ANTHROPIC_API_URL, ANTHROPIC_HEADERS,
    OPENAI_API_KEY, OPENAI_API_URL,
    AGENT_MODELS,
)

TEST_PROMPT = "Raspunde cu un singur cuvant: Salut."
BRAVE_QUERY = "catering Bucharest Romania"


async def test_openai(session, name, model):
    """Test ChatGPT via direct OpenAI API with gpt-4o-search-preview."""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":      model,
        "max_tokens": 30,
        "messages": [
            {"role": "system", "content": ROMANIAN_SYSTEM_PROMPT},
            {"role": "user",   "content": TEST_PROMPT},
        ],
    }
    try:
        async with session.post(
            OPENAI_API_URL, headers=headers, json=payload,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                text = data["choices"][0]["message"]["content"].strip()[:80]
                print(f"  OK   {name:<12} -> \"{text}\"")
                return True
            else:
                body = await resp.text()
                print(f"  ERR  {name:<12} -> HTTP {resp.status}: {body[:250]}")
                return False
    except Exception as e:
        print(f"  ERR  {name:<12} -> Exception: {e}")
        return False


async def test_openrouter(session, name, model):
    """Test Perplexity, Copilot, Meta via OpenRouter."""
    headers = {**OPENROUTER_HEADERS, "Authorization": f"Bearer {OPENROUTER_API_KEY}"}
    payload = {
        "model":      model,
        "max_tokens": 30,
        "messages": [
            {"role": "system", "content": ROMANIAN_SYSTEM_PROMPT},
            {"role": "user",   "content": TEST_PROMPT},
        ],
    }
    try:
        async with session.post(
            OPENROUTER_URL, headers=headers, json=payload,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                text = data["choices"][0]["message"]["content"].strip()[:80]
                print(f"  OK   {name:<12} -> \"{text}\"")
                return True
            else:
                body = await resp.text()
                print(f"  ERR  {name:<12} -> HTTP {resp.status}: {body[:250]}")
                return False
    except Exception as e:
        print(f"  ERR  {name:<12} -> Exception: {e}")
        return False


async def test_brave(session):
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept":               "application/json",
        "Accept-Encoding":      "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
    }
    # country omitted: Romania (RO) not in Brave's supported enum -- causes HTTP 422
    params = {"q": BRAVE_QUERY, "count": 2, "search_lang": "en"}
    try:
        async with session.get(
            url, headers=headers, params=params,
            timeout=aiohttp.ClientTimeout(total=15),
        ) as resp:
            if resp.status == 200:
                data    = await resp.json()
                results = data.get("web", {}).get("results", [])
                first   = results[0].get("title", "--") if results else "no results"
                print(f"  OK   Brave Search  -> {len(results)} results | \"{first[:70]}\"")
                return True
            else:
                body = await resp.text()
                print(f"  ERR  Brave Search  -> HTTP {resp.status}: {body[:250]}")
                return False
    except Exception as e:
        print(f"  ERR  Brave Search  -> Exception: {e}")
        return False


async def test_gemini(session):
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    payload = {
        "contents":           [{"role": "user", "parts": [{"text": TEST_PROMPT}]}],
        "tools":              [{"google_search": {}}],
        "system_instruction": {"parts": [{"text": ROMANIAN_SYSTEM_PROMPT}]},
        "generationConfig":   {"maxOutputTokens": 30},
    }
    try:
        async with session.post(
            url, json=payload,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status == 200:
                data       = await resp.json()
                candidates = data.get("candidates", [])
                text       = ""
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    text  = "".join(p.get("text", "") for p in parts).strip()[:80]
                print(f"  OK   Gemini        -> \"{text}\"")
                return True
            else:
                body = await resp.text()
                print(f"  ERR  Gemini        -> HTTP {resp.status}: {body[:250]}")
                return False
    except Exception as e:
        print(f"  ERR  Gemini        -> Exception: {e}")
        return False


async def test_claude(session):
    payload = {
        "model":      "claude-sonnet-4-6",
        "max_tokens": 30,
        "system":     ROMANIAN_SYSTEM_PROMPT,
        "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 1}],
        "messages": [{"role": "user", "content": TEST_PROMPT}],
    }
    try:
        async with session.post(
            ANTHROPIC_API_URL, headers=ANTHROPIC_HEADERS, json=payload,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status == 200:
                data    = await resp.json()
                content = data.get("content", [])
                text    = " ".join(
                    b.get("text", "") for b in content if b.get("type") == "text"
                ).strip()[:80]
                print(f"  OK   Claude        -> \"{text}\"")
                return True
            else:
                body = await resp.text()
                print(f"  ERR  Claude        -> HTTP {resp.status}: {body[:250]}")
                return False
    except Exception as e:
        print(f"  ERR  Claude        -> Exception: {e}")
        return False


async def main():
    print("\n" + "=" * 52)
    print("  BpR GEO Benchmarker -- API Diagnostic")
    print("=" * 52 + "\n")

    results = {}

    async with aiohttp.ClientSession() as session:

        print("OpenAI (ChatGPT direct):")
        results["ChatGPT"] = await test_openai(session, "ChatGPT", "gpt-4o-search-preview")
        await asyncio.sleep(2)

        print("\nOpenRouter (Perplexity, Copilot, Meta):")
        or_agents = {k: v for k, v in AGENT_MODELS.items() if k not in ("Claude", "Gemini", "ChatGPT")}
        for name, model in or_agents.items():
            ok = await test_openrouter(session, name, model)
            results[name] = ok
            await asyncio.sleep(2)

        print("\nBrave Search (used by Copilot + Meta):")
        results["Brave"] = await test_brave(session)

        print("\nGoogle AI (Gemini + search grounding):")
        results["Gemini"] = await test_gemini(session)

        print("\nAnthropic (Claude + web search):")
        results["Claude"] = await test_claude(session)

    print("\n" + "=" * 52)
    passed = [k for k, v in results.items() if v]
    failed = [k for k, v in results.items() if not v]
    print(f"  PASSED ({len(passed)}): {', '.join(passed) or 'none'}")
    print(f"  FAILED ({len(failed)}): {', '.join(failed) or 'none'}")
    print("=" * 52 + "\n")

    if failed:
        print("Fix the failed APIs before running benchmarker.py\n")
    else:
        print("All APIs healthy -- safe to run benchmarker.py\n")


if __name__ == "__main__":
    asyncio.run(main())
