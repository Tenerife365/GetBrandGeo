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
  return { text: text || null, errorCode: null }
}

async function callGemini(prompt, ctx) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { text: null, errorCode: 'auth_error' }
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: ctx }] },
            contents:          [{ parts: [{ text: prompt }] }],
            tools:             [{ googleSearch: {} }],
          }),
        }
      )
      const d = await r.json()
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { text: d.candidates[0].content.parts[0].text, errorCode: null }
      }
      if (r.status === 404 || d.error?.code === 404) continue
      if (d.error) {
        const isQuota = r.status === 429 || r.status === 402 ||
          d.error.status === 'RESOURCE_EXHAUSTED' || d.error.code === 429
        if (isQuota) return { text: null, errorCode: 'quota_exceeded' }
        continue
      }
      break
    } catch (e) { console.error(`[Audit/Gemini] ${model}:`, e.message); continue }
  }
  return { text: null, errorCode: null }
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
  return { text: d.choices?.[0]?.message?.content ?? null, errorCode: null }
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
    return { text: text || null, errorCode: null }
  } catch (e) {
    console.error('[Audit/Claude] threw:', e.message)
    return { text: null, errorCode: null }
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
// Mirrors src/pages/Usage.tsx's ENGINE_COST + OVERHEAD_MULTIPLIER exactly (same
// figures, kept in sync by hand — Netlify functions run as plain CommonJS and
// can't import a Vite-bundled .tsx file, so this is a deliberate, documented
// duplication rather than an oversight; update both places together).
const ENGINE_COST_EUR = { claude: 0.018, chatgpt: 0.040, gemini: 0.001, perplexity: 0.005, meta: 0.002 }
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
