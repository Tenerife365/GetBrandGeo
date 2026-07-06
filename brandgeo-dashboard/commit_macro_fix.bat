@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add netlify/functions/collect-prompt.js
git commit -m "fix: macro overhaul of collect-prompt — geo context + proper API endpoints

Root causes fixed:
1. Geographic context: buildSystemContext() infers country from brand_website
   TLD (.ro→Romania, .de→Germany, etc) and injects it as a system message
   into EVERY caller. API calls now tell LLMs where the user is searching
   from — matching what real users get via browser IP geolocation.

2. All 5 callers updated:
   - ChatGPT: Responses API (/v1/responses) with instructions + web_search_preview
   - Gemini:  systemInstruction field + googleSearch grounding
   - Claude:  system field + web_search_20250305 beta tool
   - Perplexity: system message for geo context (web search already built-in)
   - Meta: system message (training data, but at least market-aware)

3. Timeout fixed: 30s→22s per LLM so results are saved before Netlify's
   26s function timeout fires and kills the process.

4. LLM_CALLERS moved inside handler so ctx closure works correctly.

5. summary now includes failure reason and ctx_country for debug visibility."
git push
