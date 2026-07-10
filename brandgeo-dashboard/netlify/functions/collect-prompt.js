/**
 * collect-prompt.js
 * On-demand LLM collection for a single prompt across all 5 engines.
 *
 * POST body:
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label?, market_id? }
 *
 * market_label / region_label — human-readable geo context (e.g. "Romania", "Bucharest")
 * market_id — ISO 3166-1 alpha-2 country code (e.g. "RO", "DE", "GB").
 *   Used to set ChatGPT's user_location so web_search_preview actually searches
 *   from the client's market, not the US Netlify server.
 *
 * client_config: { brand_aliases, brand_website, known_competitors }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { analyseResponse } = require('./_analysis')

// ─── Geographic / language context ───────────────────────────────────────────
// Without geo context, API calls from our US Netlify server return US-centric
// results. Real users in e.g. Romania get location-aware results because
// search engines use their IP. We replicate this by telling every LLM exactly
// where the end-user is searching from.
//
// Priority:
//   1. market_label / region_label from POST body (explicit, always correct)
//   2. TLD inference from brand_website (fallback only — unreliable for
//      clients who target markets different from their domain's TLD)

function buildSystemContext(cfg, marketLabel, regionLabel) {
  let location = 'the relevant local market'

  if (marketLabel) {
    // Explicit market from dashboard — always correct, use as-is
    const hasSpecificRegion =
      regionLabel &&
      !regionLabel.startsWith('All ') &&
      regionLabel !== 'All regions' &&
      regionLabel !== 'All states' &&
      regionLabel !== 'All provinces' &&
      regionLabel !== 'All emirates'
    location = hasSpecificRegion ? `${regionLabel}, ${marketLabel}` : marketLabel
  } else {
    // Fallback: infer from brand_website TLD (last resort only)
    const raw = (cfg.brand_website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const tld  = raw.split('.').pop()?.toLowerCase()
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

// ─── LLM callers ─────────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

// ChatGPT — OpenAI Responses API with forced web_search_preview tool + geo context.
// user_location makes web_search_preview actually query from the client's country,
// not from the US Netlify server. marketId is ISO 3166-1 alpha-2 (e.g. "RO").
async function callChatGPT(prompt, ctx, marketId, regionLabel) {
  // Build user_location for truly geo-targeted search results.
  // Without this, the search runs from the US regardless of the system prompt.
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
    }),
  })
  const d = await r.json()
  if (d.error) { console.error('[ChatGPT]', JSON.stringify(d.error)); return null }
  // Responses API: output[] contains web_search_call and message blocks
  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')
  if (text) {
    console.log('[ChatGPT] location used:', userLocation || 'none (worldwide)', '| preview:', text.slice(0, 200))
  } else {
    console.warn('[ChatGPT] empty output — full response:', JSON.stringify(d).slice(0, 500))
  }
  return text || null
}

// Gemini — Google Search grounding + systemInstruction for geo context
async function callGemini(prompt, ctx) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
        const t = d.candidates[0].content.parts[0].text
        console.log(`[Gemini] ${model} ok | preview:`, t.slice(0, 200))
        return { text: t, errorCode: null }
      }
      if (r.status === 404 || d.error?.code === 404) continue
      if (d.error) {
        // Detect quota / resource exhaustion
        const isQuota = r.status === 429 || r.status === 402 ||
          d.error.status === 'RESOURCE_EXHAUSTED' || d.error.code === 429
        if (isQuota) {
          console.error(`[Gemini] ${model} quota exceeded:`, d.error.message)
          return { text: null, errorCode: 'quota_exceeded' }
        }
        console.warn(`[Gemini] ${model} search failed (${d.error.message}), retrying without grounding`)
        const r2 = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: ctx }] },
              contents:          [{ parts: [{ text: prompt }] }],
            }) }
        )
        const d2 = await r2.json()
        if (d2.candidates?.[0]?.content?.parts?.[0]?.text) {
          return { text: d2.candidates[0].content.parts[0].text, errorCode: null }
        }
        continue
      }
      break
    } catch (e) { console.error(`[Gemini] ${model}:`, e.message); continue }
  }
  return { text: null, errorCode: null }
}

// Claude — streaming API with early abort.
// Anthropic web search fetches Romanian pages before streaming starts (15-25s).
// We abort after 2500 chars — enough for brand detection — so we finish in 8-15s.
async function callClaude(prompt, ctx) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('[Claude] ANTHROPIC_API_KEY not set'); return null }
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
        max_tokens: 1000,   // cap output — less to generate = faster streaming start
        stream:     true,
        system:     ctx,
        tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!r.ok) {
      console.error('[Claude] HTTP error:', r.status)
      return null
    }

    const reader  = r.body.getReader()
    const decoder = new TextDecoder()
    let buf       = ''
    let text      = ''
    let stopReason = null
    let partial   = false
    const MAX_TEXT = 2500   // abort after this many chars — brand detection needs ~500-1000

    outer: while (true) {
      const { done, value } = await reader.read()
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
            if (text.length >= MAX_TEXT) {
              partial = true
              reader.cancel('enough').catch(() => {})
              break outer
            }
          }
          if (ev.type === 'message_delta') stopReason = ev.delta?.stop_reason ?? stopReason
          if (ev.type === 'error') console.error('[Claude] stream error:', JSON.stringify(ev.error))
        } catch { /* skip malformed SSE */ }
      }
    }

    if (text) {
      console.log('[Claude] ok | stop:', partial ? 'partial' : stopReason,
        '| len:', text.length, '| preview:', text.slice(0, 200))
      return text
    }
    console.warn('[Claude] stream done but no text | stop_reason:', stopReason)
    return null
  } catch (e) { console.error('[Claude] threw:', e.message); return null }
}

// OpenRouter — Perplexity (web search built-in) and Meta (training data only)
async function callOpenRouter(model, prompt, ctx) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(`[OpenRouter:${model}] OPENROUTER_API_KEY not set — engine skipped`)
    return { text: null, errorCode: 'auth_error' }
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
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
  }
  const text = d.choices?.[0]?.message?.content ?? null
  if (text) {
    console.log(`[OpenRouter:${model}] ok | preview:`, text.slice(0, 200))
  } else {
    console.warn(`[OpenRouter:${model}] empty response:`, JSON.stringify(d).slice(0, 300))
  }
  return { text, errorCode: null }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Auth: verify JWT + origin (client ownership checked after body parse)
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  // Unique ID per invocation — disambiguates interleaved logs from warm-start container reuse
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label, market_id, active_engines } = body
  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // Viewers may only collect for their own client
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[${invId}] prompt_id:${prompt_id} client_id:${client_id} force:${force} user:${auth.user.id}`)

  // Build geo context — explicit market takes priority over TLD inference
  const ctx = buildSystemContext(client_config, market_label, region_label)

  // LLM_CALLERS defined here so ctx is captured in closure.
  // Claude runs in collect-claude.js (dedicated 26s function).
  // ChatGPT runs in collect-chatgpt.js (dedicated 26s function -- gpt-5.5 needs 20-25s).
  // This function handles the 3 fast engines only.
  const LLM_CALLERS = {
    gemini:     p => callGemini(p, ctx),                              // web search via Google
    perplexity: p => callOpenRouter('perplexity/sonar', p, ctx),      // web search built-in
    meta:       p => callOpenRouter('meta-llama/llama-3.1-70b-instruct', p, ctx),  // training data
  }

  // active_engines filters which engines this function should run.
  // It contains only the subset of {gemini, perplexity, meta} that are active for this client.
  // If not provided, run all (backwards-compatible with direct API calls).
  const allowedEngines = Array.isArray(active_engines) && active_engines.length > 0
    ? new Set(active_engines)
    : null   // null = all allowed

  let toRun

  if (force) {
    // On force, only delete rows for the engines we're about to re-run
    const enginesForDelete = allowedEngines
      ? Object.keys(LLM_CALLERS).filter(e => allowedEngines.has(e))
      : Object.keys(LLM_CALLERS)
    if (enginesForDelete.length > 0) {
      const { error: delErr } = await supabase
        .from('ai_results')
        .delete()
        .eq('prompt_id', prompt_id)
        .eq('client_id', client_id)
        .in('llm', enginesForDelete)
      if (delErr) console.error('[Delete] failed:', delErr.message)
      else console.log('[Delete] cleared', enginesForDelete.join(', '), 'for prompt', prompt_id)
    }
    toRun = enginesForDelete
  } else {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results')
      .select('llm')
      .eq('prompt_id', prompt_id)
      .eq('client_id', client_id)
      .neq('status', 'error')
      .gte('checked_at', monthStart.toISOString())
    const done = new Set((existing || []).map(r => r.llm))
    toRun = Object.keys(LLM_CALLERS).filter(llm => {
      if (done.has(llm)) return false
      if (allowedEngines && !allowedEngines.has(llm)) return false
      return true
    })
    if (toRun.length === 0)
      return { statusCode: 200, body: JSON.stringify({ skipped: true, prompt_id }) }
  }

  // Run 3 fast engines in parallel (Claude and ChatGPT have their own dedicated functions).
  // 20s timeout: Meta/Llama via OpenRouter can be slow on some prompts; 20s fits
  // within the 26s function limit since we save immediately after (< 1s overhead).
  const FAST_TIMEOUT = 20000
  const settled = await Promise.allSettled(
    toRun.map(llm => withTimeout(LLM_CALLERS[llm](prompt_text), FAST_TIMEOUT))
  )

  console.log(`[${invId}] settled:`,
    settled.map((r, i) => `${toRun[i]}=${r.status === 'fulfilled' ? (r.value ? 'ok' : 'null') : 'TIMEOUT'}`).join(' | '))

  const summary = {}
  const inserts = []
  for (let i = 0; i < toRun.length; i++) {
    const llm    = toRun[i]
    const result = settled[i]

    // Timeout — transient, don't store
    if (result.status === 'rejected') {
      summary[llm] = `timeout: ${result.reason?.message || 'unknown'}`
      continue
    }

    const { text, errorCode } = result.value ?? { text: null, errorCode: null }

    // API/quota error — store error row so dashboard can show "unavailable"
    if (errorCode) {
      summary[llm] = errorCode
      inserts.push({
        prompt_id, llm, client_id,
        status: 'error', error_code: errorCode,
        brand_mentioned: false,
        checked_at: new Date().toISOString(),
      })
      continue
    }

    if (!text) {
      summary[llm] = 'no_response'
      continue
    }

    let analysis
    try { analysis = analyseResponse(text, client_config) }
    catch (e) {
      console.error(`[${llm}] analyseResponse threw:`, e.message)
      summary[llm] = 'analysis_error'
      continue
    }
    inserts.push({
      prompt_id, llm, client_id,
      status:                'ok',
      brand_mentioned:       analysis.brand_mentioned,
      brand_position:        analysis.brand_position,
      sentiment:             analysis.sentiment,
      response_snippet:      analysis.response_snippet,
      competitors_mentioned: analysis.competitors_mentioned,
      response_text:         typeof text === 'string' ? text.slice(0, 10000) : null,
      checked_at:            new Date().toISOString(),
    })
    summary[llm] = analysis.brand_mentioned ? 'mentioned' : 'not_mentioned'
  }

  if (inserts.length > 0) {
    console.log('[Insert] saving:', inserts.map(r => r.llm).join(', '))
    const { error } = await supabase.from('ai_results').insert(inserts)
    if (error) console.error('[Insert] FAILED:', error.message)
    else console.log('[Insert] saved', inserts.length, 'row(s)')
  } else {
    console.warn('[Insert] nothing to save')
  }

  // ctx_geo: what location was actually used — helps debug collection results
  const ctxGeo = market_label
    ? (region_label && !region_label.startsWith('All ') ? `${region_label}, ${market_label}` : market_label)
    : ctx.split('from ')[1]?.split('.')[0] ?? 'unknown'

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true, prompt_id, summary, ctx_geo: ctxGeo }),
  }
}
