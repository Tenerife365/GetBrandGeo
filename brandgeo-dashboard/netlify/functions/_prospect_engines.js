/**
 * _prospect_engines.js
 * Shared engine-calling + cost + geo-context helpers for the Instant Audit
 * Engine (SALES-ENGINE.md §2, CLAUDE.md §10 Component A).
 *
 * Deliberately self-contained rather than importing from collect-prompt.js /
 * collect-claude.js / collect-chatgpt.js: those functions are the core paid
 * product's collection pipeline, require an authenticated client_id/prompt_id
 * FK into `clients`/`prompts`, and this codebase has a well-documented history
 * of subtle accuracy bugs found via careful, isolated audits (see CLAUDE.md §8
 * Master-Reasoning). Reusing them unmodified for anonymous public traffic would
 * mean either faking auth for every visitor or touching that pipeline's risk
 * surface for an unrelated feature. Instead this module ports the same proven
 * API-calling patterns (same models, same request shapes) into a
 * client-config-free form suitable for auditing an arbitrary domain nobody has
 * configured as a client. `_analysis.js` (the response-scoring logic) IS reused
 * directly, unmodified — it's already pure/stateless and safe for this.
 *
 * The `_` prefix keeps Netlify from exposing this as an HTTP endpoint (§4.6).
 */

// ─── Geo context (simplified — no client-selected market for an anonymous
// domain, so this only has the TLD-inference fallback that collect-*.js
// already uses as ITS fallback path; ported verbatim for consistency). ───────

const TLD_MARKET_MAP = {
  ro: 'Romania',      uk: 'United Kingdom', de: 'Germany',    fr: 'France',
  es: 'Spain',        it: 'Italy',           nl: 'Netherlands', pl: 'Poland',
  au: 'Australia',    ca: 'Canada',          us: 'United States', pt: 'Portugal',
  be: 'Belgium',      ch: 'Switzerland',     at: 'Austria',    hu: 'Hungary',
  cz: 'Czech Republic', se: 'Sweden',        dk: 'Denmark',    fi: 'Finland',
}

function buildAuditContext(domain) {
  const tld = domain.split('.').pop()?.toLowerCase()
  const location = TLD_MARKET_MAP[tld] || 'the relevant market for this business'
  return (
    `You are a prospective buyer researching companies online. ` +
    `Answer as a real user would, using local context relevant to ${location} where applicable. ` +
    `Respond in the same language as the question.`
  )
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

// ─── Engine callers — same API shapes as collect-prompt.js/collect-claude.js/
// collect-chatgpt.js, minus client-specific geo targeting (an anonymous
// prospect hasn't told us their target market/region the way a real client
// does in Onboard.tsx — TLD inference above is the only signal available). ──

async function callChatGPT(prompt, ctx) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { text: null, errorCode: 'auth_error' }
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:        'gpt-5.5',
      instructions: ctx,
      tools:        [{ type: 'web_search_preview' }],
      input:        prompt,
      // Same cost fix as collect-chatgpt.js (SCALE-SPEC.md §1.1b, 2026-07-10):
      // gpt-5.5 bills reasoning tokens as OUTPUT ($30/MTok) and they were
      // uncapped. Do NOT add `max_output_tokens` (Responses API 400s on it for
      // reasoning models) and do NOT add `text.verbosity` (shortens the answer
      // and would truncate competitor listicles).
      reasoning:    { effort: 'low' },
    }),
  })
  const d = await r.json()
  if (d.error) {
    console.error('[Audit/ChatGPT]', JSON.stringify(d.error))
    const isQuota = r.status === 429 || r.status === 402 || d.error.code === 'insufficient_quota'
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
  }
  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')
  // #109: a null text with a null errorCode is silence — the caller can't tell a
  // failure from a real answer. Always name the failure.
  if (!text) return { text: null, errorCode: 'empty_response', detail: 'no output_text in response' }
  return { text, errorCode: null, detail: null }
}

// Gemini — #109: ported from collect-prompt.js's fixed callGemini.
//
// The old version here had the exact bug that made BpR collect ZERO gemini rows
// for weeks: it read only `parts[0].text` (a grounded/thinking response can put a
// thought part first and the real answer in parts[1..], which was then thrown
// away), and it returned a bare { text: null, errorCode: null } on four separate
// failure paths. In the audit pipeline that null is even more damaging than in
// the client collector: the caller drops the engine, and the scorecard then tells
// a PROSPECT that Gemini has never heard of them. Every exit now carries a real
// errorCode so the caller can mark the engine 'unavailable' instead of 'missing'.

// Join every text part — never read parts[0] alone.
function geminiText(d) {
  const parts = d?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null
  const t = parts
    // Skip THOUGHT parts — Gemini 3.x is a thinking model and a thought part
    // carries its internal reasoning in `.text`. Joining it in would extract
    // competitors/brand mentions from the model's scratchpad instead of its
    // answer — and on this path that lands on a PROSPECT'S scorecard.
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

async function callGemini(prompt, ctx) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { text: null, errorCode: 'auth_error', detail: 'GEMINI_API_KEY not set' }

  // ⚠️ REVERTED 2026-07-13 — `gemini-3.5-flash` was primary here too (§12.3), and it
  // is a reasoning-first model that thinks by default. Grounded, it does not return
  // inside the timeout. In collect-prompt.js this produced 10/10 `timeout` rows for a
  // paying client. HERE IT IS WORSE: gemini is 1 of only 2 SCREENING_ENGINES, so a
  // Gemini timeout blanks HALF of every public prospect scorecard — the outbound sales
  // asset. Correctness beats the cost saving; re-attempt 3.x only with its thinking
  // level explicitly turned down AND measured against a real audit.
  //
  // `gemini-2.0-flash` removed: Google SHUT IT DOWN on 2026-06-01. Dead fallback.
  const models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite']
  let last = { errorCode: 'api_error', detail: 'no model returned a response' }

  // ⚠️ THE REAL BUG: there was no per-attempt timeout, only the caller's single
  // withTimeout() around the whole engine. One slow model ate the entire budget and
  // the fallback chain — which the comment above promised — never ran even once.
  const GEMINI_BUDGET_MS  = 18000
  const GEMINI_ATTEMPT_MS = 9000
  const deadline = Date.now() + GEMINI_BUDGET_MS

  for (const model of models) {
    // grounded first, then ungrounded for the same model before moving on
    for (const grounded of [true, false]) {
      const tag = `${model}${grounded ? '' : '/ungrounded'}`

      const remaining = deadline - Date.now()
      if (remaining <= 500) {
        const detail = `${tag}: gemini budget exhausted (${GEMINI_BUDGET_MS}ms) before attempt`
        console.error(`[Audit/Gemini] ${detail}`)
        return { text: null, errorCode: 'timeout', detail }
      }
      const attemptMs = Math.min(GEMINI_ATTEMPT_MS, remaining)
      const ac = new AbortController()
      const attemptTimer = setTimeout(() => ac.abort(), attemptMs)

      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        if (text) return { text, errorCode: null, detail: null }

        if (d.error) {
          const errorCode = classifyGeminiError(r.status, d.error)
          const detail = `${tag}: HTTP ${r.status} ${d.error.status || ''} ${d.error.message || ''}`.trim()
          console.error(`[Audit/Gemini] ${detail}`)
          last = { errorCode, detail }
          // Account-level failure — no other model or retry will fix it.
          if (errorCode === 'quota_exceeded' || errorCode === 'auth_error') {
            return { text: null, ...last }
          }
          if (r.status === 404 || d.error.code === 404) break   // model retired → next model
          continue                                              // else retry ungrounded
        }

        // HTTP 200 with no usable text: safety block, RECITATION, empty candidate.
        // The old code `break`ed here, so the fallback chain never ran.
        const finishReason = d.candidates?.[0]?.finishReason ?? 'unknown'
        const blockReason  = d.promptFeedback?.blockReason
        const detail = `${tag}: empty response (finishReason=${finishReason}` +
          `${blockReason ? `, blockReason=${blockReason}` : ''})`
        console.warn(`[Audit/Gemini] ${detail}`)
        last = { errorCode: 'empty_response', detail }
        continue
      } catch (e) {
        clearTimeout(attemptTimer)
        // An aborted attempt means THIS MODEL is too slow — not that the engine failed.
        // Record it and let the chain move on. That is the point of the per-attempt deadline.
        const timedOut = e.name === 'AbortError'
        const detail = timedOut
          ? `${tag}: attempt timed out after ${attemptMs}ms`
          : `${tag}: threw ${e.message}`
        console.error(`[Audit/Gemini] ${detail}`)
        last = { errorCode: timedOut ? 'timeout' : 'api_error', detail }
        continue
      }
    }
  }

  return { text: null, ...last }
}

async function callOpenRouter(model, prompt, ctx) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { text: null, errorCode: 'auth_error' }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://getbrandgeo.com',
      'X-Title':      'BrandGEO Instant Audit',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: ctx }, { role: 'user', content: prompt }],
      max_tokens: 1000,
    }),
  })
  const d = await r.json()
  if (d.error) {
    const isQuota = r.status === 402 || r.status === 429 ||
      d.error.code === 402 || (d.error.message || '').toLowerCase().includes('credit')
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
  }
  const text = d.choices?.[0]?.message?.content ?? null
  // #109: never return null text with a null errorCode — see callChatGPT above.
  if (!text) return { text: null, errorCode: 'empty_response', detail: `${model}: no message content` }
  return { text, errorCode: null, detail: null }
}

// Claude — same wall-clock-budget streaming approach as collect-claude.js
// (CLAUDE.md §8.9 finding 1.4 fix), ported verbatim minus client_config.
async function callClaude(prompt, ctx) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { text: null, errorCode: 'auth_error' }

  const TIME_BUDGET_MS = 21000
  const deadline = Date.now() + TIME_BUDGET_MS

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        // Web search RE-ENABLED 2026-07-15 (was removed 2026-07-10 as a cost cut).
        // On this PUBLIC prospect scorecard the removal is even worse than on the
        // client pipeline: training-data-only Claude misses web-present businesses,
        // so a prospect whose real Claude ranks them well would be shown Claude as
        // MISSING them — a false, discouraging result on the exact asset used to
        // open a sale. Keep this in lockstep with _collect.js's callClaude.
        'anthropic-beta':    'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,
        stream:     true,
        system:     ctx,
        // Web search is what makes this mirror a real user's Claude. Cost is bounded
        // by max_uses:1 + the time budget, not by blinding the engine. Do NOT
        // re-remove without reconciling CLAUDE.md §1.2 / §12.3 — it silently breaks
        // results for web-present brands.
        tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!r.ok) {
      const isQuota = r.status === 429 || r.status === 402
      return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
    }

    const reader  = r.body.getReader()
    const decoder = new TextDecoder()
    let buf = '', text = ''

    outer: while (true) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) { reader.cancel('time budget exceeded').catch(() => {}); break }

      let timer, result
      try {
        result = await Promise.race([
          reader.read(),
          new Promise((resolve) => { timer = setTimeout(() => resolve('__timeout__'), remaining) }),
        ])
      } finally { clearTimeout(timer) }

      if (result === '__timeout__') { reader.cancel('time budget exceeded').catch(() => {}); break }
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
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') text += ev.delta.text ?? ''
        } catch { /* skip malformed SSE */ }
      }
    }
    // #109: never return null text with a null errorCode — see callChatGPT above.
    if (!text) return { text: null, errorCode: 'empty_response', detail: 'stream produced no text' }
    return { text, errorCode: null, detail: null }
  } catch (e) {
    console.error('[Audit/Claude] threw:', e.message)
    return { text: null, errorCode: 'api_error', detail: `threw ${e.message}` }
  }
}

// ─── Engine registry ──────────────────────────────────────────────────────────
// SCREENING = fast + cheap only (gemini/perplexity already proven to share one
// 26s window together in collect-prompt.js production use, §2.2). FULL = all
// 5 live engines, matching PLAN_ENGINES' 'growth'/'managed'/'pro' set in
// planConfig.ts — kept in sync by hand, same duplication-tradeoff already
// accepted elsewhere in this codebase (DESIGN-SYSTEM.md §1).
const ALL_CALLERS = {
  chatgpt:    (p, ctx) => callChatGPT(p, ctx),
  gemini:     (p, ctx) => callGemini(p, ctx),
  claude:     (p, ctx) => callClaude(p, ctx),
  perplexity: (p, ctx) => callOpenRouter('perplexity/sonar', p, ctx),
  meta:       (p, ctx) => callOpenRouter('meta-llama/llama-3.1-70b-instruct', p, ctx),
}

const SCREENING_ENGINES = ['gemini', 'perplexity']
const FULL_ENGINES       = ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta']

// ─── Cost estimation ──────────────────────────────────────────────────────────
// SCALE-SPEC.md §2.1 (2026-07-13) consolidated the previously hand-duplicated
// cost table — this file, src/pages/Usage.tsx, and now the ai_results
// collectors too — into ONE server-side copy: ./_cost.js. This file requires
// it instead of declaring its own, closing exactly the duplication SCALE-SPEC
// called out by name.
//
// ⚠️ This mattered MORE here than on the dashboard, because these numbers are
// not just displayed — `estimateAuditCost()` below writes them to
// `prospect_audits.estimated_cost_eur`, and `_prospect_guard.js`'s
// checkMonthlyBudget() sums that column against PROSPECTING_MONTHLY_BUDGET_EUR
// (default €200). A stale local copy here previously under-priced Gemini 20x
// and let real spend outrun the €200 cap — see _cost.js for the full
// derivation/confidence notes and keep this file pointed at it, not a local copy.
const { ENGINE_COST_EUR } = require('./_cost')
const OVERHEAD_MULTIPLIER = 1.5
const PROMPT_GEN_COST_EUR = 0.002   // one gpt-4o-mini call for category+prompt generation

function estimateAuditCost(engines, promptCount) {
  const perPromptCost = engines.reduce((sum, e) => sum + (ENGINE_COST_EUR[e] ?? 0), 0)
  return Number((perPromptCost * promptCount * OVERHEAD_MULTIPLIER + PROMPT_GEN_COST_EUR).toFixed(4))
}

module.exports = {
  buildAuditContext,
  withTimeout,
  ALL_CALLERS,
  SCREENING_ENGINES,
  FULL_ENGINES,
  estimateAuditCost,
  ENGINE_COST_EUR,
  OVERHEAD_MULTIPLIER,
  PROMPT_GEN_COST_EUR,
}
