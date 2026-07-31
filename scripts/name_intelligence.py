"""
name_intelligence.py — First client of our own platform.
Pipeline: Generate names -> Check domains -> Check brand conflicts -> Score -> Rank
"""
import os, json, asyncio, re
import aiohttp
import whois as whois_lib
from dotenv import load_dotenv

# Windows path to .env
load_dotenv(r"C:\Users\const\Desktop\BpR\.env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
BRAVE_API_KEY  = os.getenv("BRAVE_SEARCH_API_KEY")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
BRAVE_URL  = "https://api.search.brave.com/res/v1/web/search"


async def generate_names(session):
    print("Generating 200 candidate names via GPT-4o-mini...")
    prompt = (
        "You are a world-class brand naming expert specializing in B2B SaaS.\n\n"
        "Generate exactly 200 unique product name candidates for a platform called a "
        "'GEO Intelligence' or 'AI Visibility Intelligence' tool.\n\n"
        "What this product does:\n"
        "- Monitors how often and how prominently a brand appears in AI-generated answers\n"
        "  (ChatGPT, Perplexity, Gemini, Copilot, Claude)\n"
        "- Tracks whether AI engines recommend the brand when users ask relevant questions\n"
        "- Scores brand visibility in the generative AI era (GEO = Generative Engine Optimization)\n"
        "- Helps businesses understand and improve how AI engines perceive and cite them\n"
        "- Sold as a managed service to SMBs, restaurants, local businesses, agencies\n\n"
        "Naming criteria:\n"
        "- Short: 4-9 characters ideal, max 12\n"
        "- Easy to pronounce in English, French, German, Spanish, Romanian\n"
        "- Sounds credible, modern, premium — like a real intelligence/analytics brand\n"
        "- Avoids generic prefixes/suffixes: AI, Smart, Digital, Hub, Ly, Ify, Ize\n"
        "- Can be invented words, Latin/Greek roots, metaphors, portmanteaus\n"
        "- Must NOT copy existing tools: Semrush, Ahrefs, Profound, Otterly, Peec, Moz\n\n"
        "Thematic directions to explore (generate 30-45 names per direction):\n"
        "1. PERCEPTION & SIGNAL: how a brand is 'heard' or 'seen' by AI\n"
        "   (think: pulse, signal, echo, frequency, resonance, aura, imprint)\n"
        "2. LATIN/GREEK ROOTS: audire=hear, videre=see, lucere=shine, esse=be, nota=mark\n"
        "   (think: Auris, Vidar, Lucen, Notica, Essor, Vidor, Clarion)\n"
        "3. INTELLIGENCE & RADAR: the monitoring/scoring angle\n"
        "   (think: scope, lens, trace, scan, index, meter, atlas, cipher)\n"
        "4. INVENTED PORTMANTEAUS: combine two meaningful roots into something new\n"
        "   (think: Verilux, Scopera, Tracient, Audex, Novaura, Sentrix)\n"
        "5. PRESENCE & AUTHORITY: the 'being known to AI' angle\n"
        "   (think: meridian, zenith, apex, prism, beacon, lumis, radix)\n\n"
        'Return ONLY a JSON array of strings, no explanation:\n["name1", "name2", ...]'
    )
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.9,
        "max_tokens": 4000,
    }
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    async with session.post(OPENAI_URL, headers=headers, json=payload) as r:
        data = await r.json()
        if "choices" not in data:
            print(f"  API error: {json.dumps(data)[:300]}")
            return []
        content = data["choices"][0]["message"]["content"].strip()
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            names = json.loads(match.group())
            print(f"  Generated {len(names)} names.")
            return names
        print(f"  Could not parse JSON from: {content[:200]}")
        return []


def check_domain_whois(name, tld):
    domain = f"{name.lower()}.{tld}"
    try:
        w = whois_lib.whois(domain)
        if w.registrar or w.creation_date:
            return False
        return True
    except Exception:
        return None


async def check_brand_conflict(session, name):
    try:
        params = {"q": f'"{name}" software OR platform OR app OR SaaS', "count": 5}
        headers = {"X-Subscription-Token": BRAVE_API_KEY, "Accept": "application/json"}
        async with session.get(BRAVE_URL, params=params, headers=headers,
                               timeout=aiohttp.ClientTimeout(total=8)) as r:
            if r.status != 200:
                return {"conflict_score": 50, "notes": f"Brave error {r.status}"}
            data = await r.json()
            results = data.get("web", {}).get("results", [])
            if not results:
                return {"conflict_score": 0, "notes": "No results - clear"}
            conflict_keywords = ["software", "platform", "saas", "app", "tool", "analytics", "monitoring"]
            top_titles = " ".join([x.get("title", "").lower() for x in results[:3]])
            top_urls   = " ".join([x.get("url",   "").lower() for x in results[:3]])
            score = 0
            if any(k in top_titles for k in conflict_keywords): score += 60
            if name.lower() in top_urls: score += 40
            note = f"{len(results)} results | {results[0].get('title','')[:55]}"
            return {"conflict_score": min(score, 100), "notes": note}
    except Exception as e:
        return {"conflict_score": 50, "notes": str(e)[:50]}


def score_name(name, com_avail, ai_avail, brand):
    score = 50
    l = len(name)
    if 4 <= l <= 8:    score += 15
    elif 9 <= l <= 11: score += 5
    else:              score -= 10
    if com_avail is True:    score += 20
    elif com_avail is False: score -= 25
    if ai_avail is True:     score += 10
    score -= int(brand.get("conflict_score", 50) * 0.3)
    if any(c.isdigit() or c == '-' for c in name): score -= 10
    consec = max_c = 0
    for c in name.lower():
        if c in "bcdfghjklmnpqrstvwxyz":
            consec += 1
            max_c = max(max_c, consec)
        else:
            consec = 0
    if max_c <= 2: score += 5
    if max_c >= 4: score -= 10
    return max(0, min(100, score))


async def main():
    results = []
    async with aiohttp.ClientSession() as session:
        names = await generate_names(session)
        if not names:
            print("Failed to generate names. Exiting.")
            return

        print(f"\nChecking {len(names)} names (domains + brand conflicts)...\n")
        for i, name in enumerate(names):
            if i % 20 == 0:
                print(f"  Progress: {i}/{len(names)}...")
            com_avail = check_domain_whois(name, "com")
            ai_avail  = check_domain_whois(name, "ai")
            brand     = await check_brand_conflict(session, name)
            await asyncio.sleep(0.25)
            results.append({
                "name":     name,
                "score":    score_name(name, com_avail, ai_avail, brand),
                "com":      "YES" if com_avail is True else ("NO" if com_avail is False else "?"),
                "ai":       "YES" if ai_avail  is True else ("NO" if ai_avail  is False else "?"),
                "conflict": brand.get("conflict_score", "?"),
                "notes":    brand.get("notes", ""),
            })

        results.sort(key=lambda x: x["score"], reverse=True)

        print("\n" + "="*90)
        print(f"{'RANK':<5} {'NAME':<14} {'SCORE':<7} {'.COM':<6} {'.AI':<6} {'CONFLICT':<10} NOTES")
        print("="*90)
        for i, r in enumerate(results[:30], 1):
            print(f"{i:<5} {r['name']:<14} {r['score']:<7} {r['com']:<6} {r['ai']:<6} {r['conflict']:<10} {r['notes'][:42]}")

        out_path = r"C:\Users\const\Desktop\BpR\name_results.json"
        with open(out_path, "w") as f:
            json.dump(results, f, indent=2)

        print("\nTop 5:")
        for r in results[:5]:
            print(f"  {r['name']} (score: {r['score']}, .com: {r['com']}, .ai: {r['ai']})")


if __name__ == "__main__":
    asyncio.run(main())
