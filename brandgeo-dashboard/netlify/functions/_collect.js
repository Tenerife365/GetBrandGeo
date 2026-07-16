/**
 * _collect.js — shared collection engine core (SCALE-SPEC.md §3.3).
 *
 * Extracts the engine-calling + row-building logic that used to be copy-pasted
 * (with drift) across collect-prompt.js / collect-claude.js / collect-chatgpt.js
 * into ONE place, so the collection worker (collection-worker-background.js) can
 * run the engines DIRECTLY instead of HTTP-calling Netlify functions from inside
 * Netlify. The three HTTP endpoints stay (the manual "Refresh this prompt" button
 * still uses them) but become thin wrappers over this module — exactly the
 * _analysis.js extraction pattern that already worked, and the same shape as
 * _prospect_engines.js does for the Instant Audit Engine.
 *
 * Underscore prefix = Netlify does NOT expose this as a public endpoint.
 *
 * The engine callers below are the LIVE implementations, lifted verbatim from
 * the three collectors as of 2026-07-15 (post the §12.3 cost fixes + the §12.3b
 * Gemini revert + the #109 never-fail-silently rewrite):
 *   - callChatGPT  ← collect-chatgpt.js (gpt-5.5, reasoning:low, web_search_preview)
 *   - callClaude   ← collect-claude.js  (training-data mode, wall-clock time budget)
 *   - callGemini   ← collect-prompt.js  (2.5-flash + 3.1-flash-lite fallback,
 *                    per-attempt AbortController, never returns a null errorCode)
 *   - callOpenRouter (perplexity/sonar, meta llama) ← collect-prompt.js
 * Do NOT re-add web search to Claude or switch Gemini to a 3.x reasoning model
 * here without re-reading the cost/latency notes in those files (§12.3 / §12.3b).
 */

const { analyseResponse } = require('./_analysis')
const { classifyCompetitors } = require('./_competitor_filter')
const { costForRow } = require('./_cost')

// ─── Geographic / language context ───────────────────────────────────────────
// Identical across all three collectors. Without geo context, API calls from the
// US Netlify server return US-centric results; we replicate a local user by
// telling every LLM exactly where the end-user is searching from.
//   1. market_label / region_label from the caller (explicit, always correct)
//   2. TLD inference from brand_website (fallback only)
function buildSystemContext(cfg, marketLabel, regionLabel) {
  let location = 'the relevant local market'

  if (marketLabel) {
    const hasSpecificRegion =
      regionLabel &&
      !regionLabel.startsWith('All ') &&
      regionLabel !== 'All regions' &&
      regionLabel !== 'All states' &&
      regionLabel !== 'All provinces' &&
      regionLabel !== 'All emirates'
    location = hasSpecificRegion ? `${regionLabel}, ${marketLabel}` : marketLabel
  } else {
    const raw = (cfg.brand_website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const tld = raw.split('.').pop()?.toLowerCase()
    const tldMap = {
      ro: 'Romania',      uk: 'United Kingdom', de: 'Germany',    fr: 'France',
      es: 'Spain',        it: 'Italy',           nl: 'Netherlands', pl: 'Poland',
      au: 'Australia',    ca: 'Canada',          us: 'United States', pt: 'Portugal',
      be: 'Belgium',      ch: 'Switzerland',     at: 'Austria',    hu: 'Hungary',
      cz: 'Czech Republic', se: 'Sweden',        dk: 'Denmark',    fi: 'Finland',
    }
    location = tldMap[tld] || 'the relevant local market'
  }

  return (
    `You are a user based in ${location}. ` +
    `Answer as if you are that local user — use local context and knowledge relevant to ${location}. ` +
    `Respond in the same language as the question.`
  )
}

// ─── withTimeout ─────────────────────────────────────────────────────────────
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

// ─── Gemini — Google Search grounding + systemInstruction for geo context ──────
// (verbatim from collect-prompt.js — see the #109 / §12.3b notes there for why
// every exit carries an errorCode + detail and why the model list is what it is.)

// Grounded/thinking responses can split the answer across several parts and may
// put a non-text (thought/functionCall) part first — read every text part, skip
// thought parts (a thinking model's scratchpad must not reach analyseResponse).
function geminiText(d) {
  const parts = d?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null
  const t = parts
    .filter(p => p && p.thought !== true)
    .map(p => p?.text)
    .filter(s => typeof s === 'string' && s.length > 0)
    .join('\n')
    .trim()
  return t || null
}

function classifyGeminiError(httpStatus, err) {
  if (httpStatus === 429 || httpStatus === 402 ||
      err?.status === 'RESOURCE_EXHAUSTED' || err?.code === 429) return 'quota_exceeded'
  if (httpStatus === 401 || httpStatus === 403 ||
      err?.status === 'UNAUTHENTICATED' || err?.status === 'PERMISSION_DENIED') return 'auth_error'
  return 'api_error'
}

async function callGemini(prompt, ctx, opts) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('[Gemini] GEMINI_API_KEY not set — engine skipped')
    return { text: null, errorCode: 'auth_error', detail: 'GEMINI_API_KEY not set' }
  }

  // ⚠️ 3.5-flash was REVERTED 2026-07-13 (§12.3b — it timed out 10/10 grounded).
  // 2.0-flash was SHUT DOWN by Google 2026-06-01. Keep this list; re-attempt a
  // cheaper 3.x model only with thinking explicitly turned down AND measured
  // end-to-end against a real collection.
  const models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite']
  let last = { errorCode: 'api_error', detail: 'no model returned a response' }

  // Budgets default to the tight HTTP values (must fit Netlify's 26s wall on the
  // manual "Refresh this prompt" path), but the worker passes generous overrides
  // via opts since it has a 15-min window (SCALE-SPEC §3 / CLAUDE.md §12.6).
  const GEMINI_BUDGET_MS  = opts?.geminiBudgetMs  ?? 18000
  const GEMINI_ATTEMPT_MS = opts?.geminiAttemptMs ?? 9000
  const deadline = Date.now() + GEMINI_BUDGET_MS

  for (const model of models) {
    for (const grounded of [true, false]) {
      const tag = `${model}${grounded ? '' : '/ungrounded'}`

      const remaining = deadline - Date.now()
      if (remaining <= 500) {
        const detail = `${tag}: gemini budget exhausted (${GEMINI_BUDGET_MS}ms) before attempt`
        console.error(`[Gemini] ${detail}`)
        return { text: null, errorCode: 'timeout', detail }
      }
      const attemptMs = Math.min(GEMINI_ATTEMPT_MS, remaining)
      const ac = new AbortController()
      const attemptTimer = setTimeout(() => ac.abort(), attemptMs)

      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            signal: ac.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: ctx }] },
              contents:          [{ parts: [{ text: prompt }] }],
              ...(grounded ? { tools: [{ googleSearch: {} }] } : {}),
            }),
          }
        )
        const d = await r.json()
        clearTimeout(attemptTimer)

        const text = geminiText(d)
        if (text) {
          console.log(`[Gemini] ${tag} ok | len:`, text.length, '| preview:', text.slice(0, 200))
          return { text, errorCode: null, detail: null }
        }

        if (d.error) {
          const errorCode = classifyGeminiError(r.status, d.error)
          const detail = `${tag}: HTTP ${r.status} ${d.error.status || ''} ${d.error.message || ''}`.trim()
          console.error(`[Gemini] ${detail}`)
          last = { errorCode, detail }
          if (errorCode === 'quota_exceeded' || errorCode === 'auth_error') {
            return { text: null, ...last }
          }
          if (r.status === 404 || d.error.code === 404) break
          continue
        }

        const finishReason = d.candidates?.[0]?.finishReason ?? 'unknown'
        const blockReason  = d.promptFeedback?.blockReason
        const detail = `${tag}: empty response (finishReason=${finishReason}` +
          `${blockReason ? `, blockReason=${blockReason}` : ''})`
        console.warn(`[Gemini] ${detail}`)
        last = { errorCode: 'empty_response', detail }
        continue
      } catch (e) {
        clearTimeout(attemptTimer)
        const timedOut = e.name === 'AbortError'
        const detail = timedOut
          ? `${tag}: attempt timed out after ${attemptMs}ms`
          : `${tag}: threw ${e.message}`
        console.error(`[Gemini] ${detail}`)
        last = { errorCode: timedOut ? 'timeout' : 'api_error', detail }
        continue
      }
    }
  }

  return { text: null, ...last }
}

// ─── OpenRouter — Perplexity (web search built-in) and Meta (training data) ────
// (verbatim from collect-prompt.js)
async function callOpenRouter(model, prompt, ctx) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(`[OpenRouter:${model}] OPENROUTER_API_KEY not set — engine skipped`)
    return { text: null, errorCode: 'auth_error', detail: 'OPENROUTER_API_KEY not set' }
  }
  const messages = [
    { role: 'system', content: ctx },
    { role: 'user',   content: prompt },
  ]
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://getbrandgeo.com',
      'X-Title':      'BrandGEO Monitor',
    },
    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
  })
  const d = await r.json()
  if (d.error) {
    console.error(`[OpenRouter:${model}] error:`, JSON.stringify(d.error))
    const isQuota = r.status === 402 || r.status === 429 ||
      d.error.code === 402 || (d.error.message || '').toLowerCase().includes('credit')
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error', detail: `HTTP ${r.status} ${d.error.message || ''}`.trim() }
  }
  const text = d.choices?.[0]?.message?.content ?? null
  if (text) {
    console.log(`[OpenRouter:${model}] ok | preview:`, text.slice(0, 200))
  } else {
    console.warn(`[OpenRouter:${model}] empty response:`, JSON.stringify(d).slice(0, 300))
  }
  return { text, errorCode: text ? null : 'empty_response', detail: text ? null : 'empty response' }
}

// ─── ChatGPT — OpenAI Responses API, gpt-5.5, web_search_preview + geo ─────────
// (verbatim LIVE version from collect-chatgpt.js — reasoning:low cost cap; do NOT
// add max_output_tokens (400s the request) or text.verbosity (truncates lists).)
async function callChatGPT(prompt, ctx, marketId, regionLabel) {
  const isSpecificRegion = regionLabel &&
    !regionLabel.startsWith('All ') &&
    regionLabel !== 'All regions' &&
    regionLabel !== 'All states' &&
    regionLabel !== 'All provinces' &&
    regionLabel !== 'All emirates'
  const userLocation = (marketId && marketId !== 'WW')
    ? { type: 'approximate', country: marketId, ...(isSpecificRegion ? { city: regionLabel } : {}) }
    : null

  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model:        'gpt-5.5',
      instructions: ctx,
      tools:        [{ type: 'web_search_preview', ...(userLocation ? { user_location: userLocation } : {}) }],
      input:        prompt,
      reasoning:    { effort: 'low' },
    }),
  })
  const d = await r.json()
  if (d.error) {
    console.error('[ChatGPT] API error:', JSON.stringify(d.error))
    const isQuota = r.status === 429 || r.status === 402 || d.error.code === 'insufficient_quota'
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error', detail: `HTTP ${r.status} ${d.error.message || ''}`.trim() }
  }

  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')

  if (text) {
    console.log('[ChatGPT] location used:', userLocation || 'none (worldwide)', '| preview:', text.slice(0, 200))
  } else {
    console.warn('[ChatGPT] empty output — full response:', JSON.stringify(d).slice(0, 500))
  }
  return { text: text || null, errorCode: text ? null : 'empty_response', detail: text ? null : 'empty output from Responses API' }
}

// ─── Claude — training-data mode, streaming with a wall-clock time budget ──────
// (verbatim LIVE version from collect-claude.js — NO web search, time budget not
// a char cap. See §8.4 finding 1.4 / §12.3 before touching this.)
async function callClaude(prompt, ctx, opts) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('[Claude] ANTHROPIC_API_KEY not set'); return { text: null, errorCode: 'auth_error', detail: 'ANTHROPIC_API_KEY not set' } }

  // Budget defaults to the tight HTTP value (must fit inside Netlify's 26s
  // function wall on the manual "Refresh this prompt" path); the worker passes
  // a generous override via opts.claudeBudgetMs (CLAUDE.md §12.6).
  const TIME_BUDGET_MS = opts?.claudeBudgetMs ?? 21000
  const deadline = Date.now() + TIME_BUDGET_MS

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        // Web search MUST stay on. It was removed by 8b7496c as a cost cut, which
        // silently made this engine answer from training data only — so it stopped
        // seeing web-present local businesses (BpR ranked #1 on 07-13 WITH search,
        // vanished on 07-15 WITHOUT it) while the client's own claude.ai (search on
        // by default) still ranks them top-3. That is measuring the wrong thing:
        // the product's whole premise is mirroring what a real user's engine says,
        // and a real user's Claude searches the web. Cost is controlled via
        // max_uses:1 + the time budget + collection frequency, never by blinding
        // the engine. (CLAUDE.md §1.2 / #63 / §12.3 — reconcile the cost math, do
        // NOT re-remove this.)
        'anthropic-beta':    'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,
        stream:     true,
        system:     ctx,
        tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!r.ok) {
      const errText = await r.text().catch(() => '')
      console.error('[Claude] HTTP error:', r.status, errText.slice(0, 200))
      const isQuota = r.status === 429 || r.status === 402
      return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error', detail: `HTTP ${r.status} ${errText.slice(0, 200)}`.trim() }
    }

    const reader   = r.body.getReader()
    const decoder  = new TextDecoder()
    let buf        = ''
    let text       = ''
    let stopReason = null
    let timedOut   = false

    while (true) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) {
        timedOut = true
        reader.cancel('time budget exceeded').catch(() => {})
        break
      }

      let timer
      let result
      try {
        result = await Promise.race([
          reader.read(),
          new Promise((resolve) => { timer = setTimeout(() => resolve('__timeout__'), remaining) }),
        ])
      } finally {
        clearTimeout(timer)
      }

      if (result === '__timeout__') {
        timedOut = true
        reader.cancel('time budget exceeded').catch(() => {})
        break
      }

      const { done, value } = result
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            text += ev.delta.text ?? ''
          }
          if (ev.type === 'message_delta') stopReason = ev.delta?.stop_reason ?? stopReason
          if (ev.type === 'error') console.error('[Claude] stream error:', JSON.stringify(ev.error))
        } catch { /* skip malformed SSE */ }
      }
    }

    if (text) {
      console.log('[Claude] ok | stop:', timedOut ? 'time_budget' : stopReason,
        '| len:', text.length, '| preview:', text.slice(0, 200))
      return { text, errorCode: null, detail: null }
    }
    console.warn('[Claude] stream done but no text | stop_reason:', timedOut ? 'time_budget' : stopReason)
    return { text: null, errorCode: 'empty_response', detail: `no text (stop_reason=${timedOut ? 'time_budget' : stopReason})` }
  } catch (e) {
    console.error('[Claude] threw:', e.message)
    return { text: null, errorCode: 'api_error', detail: `threw ${e.message}` }
  }
}

// ─── Google AI Mode — via SerpApi ─────────────────────────────────────────────
// The only way to capture Google's REAL AI Mode surface: Google has no public API
// for it, and the Gemini API is a different surface. Endpoint
// https://serpapi.com/search?engine=google_ai_mode. The response's top-level
// `reconstructed_markdown` is the full AI Mode answer as markdown (ideal for
// analyseResponse — it has the lists/rankings we parse); text_blocks[] is the
// structured fallback. Geo is via `gl` (country) — the LLM system prompt (`ctx`)
// doesn't apply here, SerpApi isn't a model we can steer.
function flattenAiModeBlocks(blocks) {
  const out = []
  const walk = (arr) => {
    for (const b of (Array.isArray(arr) ? arr : [])) {
      if (b && typeof b.snippet === 'string' && b.snippet) out.push(b.snippet)
      if (Array.isArray(b?.list)) walk(b.list)
    }
  }
  walk(blocks)
  return out.join('\n').trim()
}

async function callGoogleAiMode(prompt, _ctx, opts) {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    console.error('[GoogleAIMode] SERPAPI_KEY not set — engine skipped')
    return { text: null, errorCode: 'auth_error', detail: 'SERPAPI_KEY not set' }
  }
  const params = new URLSearchParams({ engine: 'google_ai_mode', q: prompt, api_key: key })
  const marketId = opts?.marketId
  if (marketId && marketId !== 'WW') params.set('gl', String(marketId).toLowerCase())

  try {
    const r = await fetch(`https://serpapi.com/search?${params.toString()}`)
    let d
    try { d = await r.json() } catch { return { text: null, errorCode: 'api_error', detail: `HTTP ${r.status} non-JSON response` } }

    if (d.error) {
      const msg = String(d.error)
      const lower = msg.toLowerCase()
      const isAuth  = r.status === 401 || lower.includes('invalid api key') || lower.includes('unauthorized')
      const isQuota = r.status === 429 || lower.includes('run out of searches') || lower.includes('exceeded') || lower.includes('rate limit')
      const isEmpty = lower.includes("hasn't returned") || lower.includes('no results') || lower.includes('not found')
      const errorCode = isAuth ? 'auth_error' : isQuota ? 'quota_exceeded' : isEmpty ? 'empty_response' : 'api_error'
      console.error('[GoogleAIMode] error:', msg)
      return { text: null, errorCode, detail: `HTTP ${r.status} ${msg}`.slice(0, 300) }
    }

    let text = typeof d.reconstructed_markdown === 'string' ? d.reconstructed_markdown.trim() : ''
    if (!text) text = flattenAiModeBlocks(d.text_blocks)
    if (!text) {
      console.warn('[GoogleAIMode] no text_blocks / reconstructed_markdown')
      return { text: null, errorCode: 'empty_response', detail: 'no AI Mode answer in response' }
    }
    console.log('[GoogleAIMode] ok | len:', text.length, '| preview:', text.slice(0, 200))
    return { text, errorCode: null, detail: null }
  } catch (e) {
    if (e.name === 'AbortError') return { text: null, errorCode: 'timeout', detail: 'aborted' }
    console.error('[GoogleAIMode] threw:', e.message)
    return { text: null, errorCode: 'api_error', detail: `threw ${e.message}` }
  }
}

// ─── Engine registry ──────────────────────────────────────────────────────────
// Normalized caller map: every engine is (promptText, ctx, opts) => { text, errorCode, detail }.
// opts carries { marketId, regionLabel } (ChatGPT + Google AI Mode use them).
const ENGINE_CALLERS = {
  chatgpt:    (p, ctx, o) => callChatGPT(p, ctx, o?.marketId, o?.regionLabel),
  gemini:     (p, ctx, o) => callGemini(p, ctx, o),
  claude:     (p, ctx, o) => callClaude(p, ctx, o),
  perplexity: (p, ctx)    => callOpenRouter('perplexity/sonar', p, ctx),
  meta:       (p, ctx)    => callOpenRouter('meta-llama/llama-3.1-70b-instruct', p, ctx),
  google_ai:  (p, ctx, o) => callGoogleAiMode(p, ctx, o),
}

// Per-engine outer timeout (ms), CONTEXT-AWARE (CLAUDE.md §12.6).
//
// HTTP path (the manual "Refresh this prompt" button → collect-*.js): tight
// values that must fit Netlify's 26s function wall. gemini/perplexity/meta keep
// collect-prompt's 20s FAST_TIMEOUT; claude/chatgpt self-bound internally and
// these caps only backstop an infinite hang — on the 26s HTTP path Netlify's own
// kill fires first, so they never actually fire there.
const ENGINE_TIMEOUT_MS = {
  gemini:     20000,
  perplexity: 20000,
  meta:       20000,
  claude:     24000,
  chatgpt:    40000,
  google_ai:  22000,   // SerpApi AI Mode scrape; a touch over the fast engines
}

// WORKER path (collection-worker-background.js): the whole reason the queue
// exists is to escape the 26s wall (SCALE-SPEC §2.2) — a background function gets
// 15 minutes. gpt-5.5 (reasoning + web search) legitimately runs 45-60s on some
// prompts, so the old 40s cap was firing as a false `timeout` the moment ChatGPT
// came back online (CLAUDE.md §12.6). These generous caps let slow prompts finish
// instead of erroring; they're still far inside the 13-min worker budget.
const ENGINE_TIMEOUT_MS_WORKER = {
  gemini:     45000,   // outer cap; gemini's own internal budget (below) is 40s
  perplexity: 40000,
  meta:       40000,
  claude:     60000,
  chatgpt:    90000,
  google_ai:  45000,   // SerpApi AI Mode can be slow; generous in the 15-min worker
}

// Gemini's internal model-fallback budget is separate from the outer timeout
// above (it lives inside callGemini). The worker passes these generous values so
// the 2.5-flash → 3.1-flash-lite chain isn't cut off at 18s.
const GEMINI_BUDGET_WORKER_MS  = 40000
const GEMINI_ATTEMPT_WORKER_MS = 20000

// Claude's own wall-clock streaming budget (inside callClaude) is likewise
// separate from the ENGINE_TIMEOUT_MS_WORKER.claude outer cap above — without
// this override callClaude falls back to its 21000ms default internally and
// never actually uses the worker's more generous 60s allowance. 5s margin
// under the 60000ms outer cap so the internal budget always resolves first.
const CLAUDE_BUDGET_WORKER_MS = 55000

// ─── Row builder ──────────────────────────────────────────────────────────────
// Turns one engine result into exactly one ai_results row — ok or error, NEVER
// silence (#109 / CLAUDE.md §8.13-14). Centralizes the row shape so the worker
// and the three HTTP endpoints agree byte-for-byte. run_id is set only when the
// caller passes one (the queue worker does; the manual endpoints leave it null,
// keeping their rows out of the uq_ai_results_run_prompt_llm partial index).
function buildResultRow({ engine, prompt_id, client_id, run_id = null, text, errorCode, detail, client_config }) {
  const base = { prompt_id, llm: engine, client_id, checked_at: new Date().toISOString() }
  if (run_id != null) base.run_id = run_id

  if (errorCode) {
    return {
      ...base,
      status: 'error',
      error_code: errorCode,
      brand_mentioned: false,
      response_text: detail ? String(detail).slice(0, 10000) : null,
      cost_eur: costForRow(engine, errorCode),
    }
  }

  if (!text) {
    return {
      ...base,
      status: 'error',
      error_code: 'no_response',
      brand_mentioned: false,
      response_text: 'engine returned no text and no error code',
      cost_eur: costForRow(engine, 'no_response'),
    }
  }

  let analysis
  try {
    analysis = analyseResponse(text, client_config)
  } catch (e) {
    return {
      ...base,
      status: 'error',
      error_code: 'analysis_error',
      brand_mentioned: false,
      response_text: `${e.message}\n---\n${text}`.slice(0, 10000),
      cost_eur: costForRow(engine, 'analysis_error'),
    }
  }

  return {
    ...base,
    status: 'ok',
    brand_mentioned:       analysis.brand_mentioned,
    brand_position:        analysis.brand_position,
    sentiment:             analysis.sentiment,
    response_snippet:      analysis.response_snippet,
    competitors_mentioned: analysis.competitors_mentioned,
    response_text:         typeof text === 'string' ? text.slice(0, 10000) : null,
    cost_eur:              costForRow(engine, null),
  }
}

// ─── collectEngines ───────────────────────────────────────────────────────────
// The single callable unit the worker (and the HTTP wrappers) use: run a set of
// engines for one prompt, in parallel with per-engine timeouts, and return the
// ready-to-insert ai_results rows (exactly one per requested engine). Does NO
// DB work — the caller handles reads/skip/delete/insert, so the endpoints keep
// their own force/skip semantics and the worker does its own upsert+dedup.
//
// Returns { rows, summary, ctx }.
async function collectEngines(engines, {
  prompt_id, prompt_text, client_id, client_config,
  market_label, region_label, market_id, run_id = null, worker = false,
}) {
  const ctx  = buildSystemContext(client_config, market_label, region_label)
  // Context-aware timeouts (CLAUDE.md §12.6): the worker gets generous budgets
  // (15-min window); the HTTP endpoints keep the tight 26s-wall values.
  const timeouts = worker ? ENGINE_TIMEOUT_MS_WORKER : ENGINE_TIMEOUT_MS
  const defaultTimeout = worker ? 45000 : 20000
  const opts = {
    marketId: market_id,
    regionLabel: region_label,
    ...(worker ? {
      geminiBudgetMs:  GEMINI_BUDGET_WORKER_MS,
      geminiAttemptMs: GEMINI_ATTEMPT_WORKER_MS,
      claudeBudgetMs:  CLAUDE_BUDGET_WORKER_MS,
    } : {}),
  }

  const settled = await Promise.allSettled(
    engines.map((engine) => {
      const caller = ENGINE_CALLERS[engine]
      if (!caller) return Promise.reject(new Error(`unknown engine: ${engine}`))
      return withTimeout(caller(prompt_text, ctx, opts), timeouts[engine] ?? defaultTimeout)
    })
  )

  const rows = []
  const summary = {}
  for (let i = 0; i < engines.length; i++) {
    const engine = engines[i]
    const s = settled[i]

    if (s.status === 'rejected') {
      const detail = s.reason?.message || 'unknown'
      rows.push(buildResultRow({ engine, prompt_id, client_id, run_id, text: null, errorCode: 'timeout', detail, client_config }))
      summary[engine] = `timeout: ${detail}`
      continue
    }

    const { text, errorCode, detail } = s.value ?? { text: null, errorCode: null }
    const row = buildResultRow({ engine, prompt_id, client_id, run_id, text, errorCode, detail, client_config })
    rows.push(row)
    summary[engine] = row.status === 'error' ? row.error_code : (row.brand_mentioned ? 'mentioned' : 'not_mentioned')
  }

  // Semantic competitor gate (Master-Reasoning 2026-07-13): the structural extraction in
  // _analysis.js still leaks non-companies that no denylist can converge on (certifications,
  // section nouns, events/awards, the brand's own references). Filter each ok row's
  // competitor list through one Haiku call, all engines in parallel. FAIL-OPEN: any
  // failure leaves the structural list untouched, so this is never worse than before.
  await Promise.all(rows.map(async (row) => {
    if (row.status !== 'ok' || !row.competitors_mentioned) return
    let cands
    try { cands = JSON.parse(row.competitors_mentioned) } catch { return }
    const kept = await classifyCompetitors(cands, { cfg: client_config, snippet: row.response_snippet })
    row.competitors_mentioned = kept.length ? JSON.stringify(kept) : null
  }))

  return { rows, summary, ctx }
}

module.exports = {
  buildSystemContext,
  withTimeout,
  ENGINE_CALLERS,
  ENGINE_TIMEOUT_MS,
  buildResultRow,
  collectEngines,
  // exported individually too, for any caller that wants one engine directly
  callChatGPT, callClaude, callGemini, callOpenRouter,
}
