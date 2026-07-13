/**
 * collect-claude.js
 * Dedicated Netlify function for Claude-only collection.
 *
 * Runs in parallel with collect-prompt.js (fast engines).
 * Having its own function gives Claude the full 26s Netlify window instead of
 * sharing it with 4 other engines.
 *
 * POST body (same shape as collect-prompt.js):
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label? }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { analyseResponse } = require('./_analysis')
const { costForRow } = require('./_cost')

// ─── Geo context ──────────────────────────────────────────────────────────────

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

// ─── Claude — training-data mode, streaming with a wall-clock time budget ────
//
// WEB SEARCH REMOVED 2026-07-10 (SCALE-SPEC.md §1.1c). This function used to
// send `tools: [{ type: 'web_search_20250305', max_uses: 1 }]` + the
// `anthropic-beta: web-search-2025-03-05` header — despite CLAUDE.md §1.2
// documenting Claude as "training-data mode (no web search)" and task #63
// ("Remove web search from Claude") being marked DONE. The task was never
// actually applied; the reasoning audit (§8.4 finding 1.4) spotted the
// doc/code mismatch and nobody reconciled it.
//
// That single tool was ~75% of Claude's cost: a $0.010/call search fee plus
// ~7k search-result tokens injected into context. Removing it takes Claude
// from ≈€0.040 to ≈€0.010 per call with NO model downgrade — it simply makes
// the code do what the task list already claimed it did.
//
// Side benefit: the 15-25s search wait that motivated the old character-cap
// hack is gone entirely, so the time budget below now almost never fires.
//
// The full 26s Netlify window is dedicated to this function alone.
//
// Historical note — why the time budget below exists at all. A fixed 2500-char
// cap used to abort the stream (reasoning-audit-findings.md §1.4 / CLAUDE.md
// §8.4 finding 1.4): a numbered list of competitors routinely runs past 2500
// chars, so any brand ranked ~#7-10 got silently cut off mid-list and recorded
// as "not mentioned" — a false negative on the flagship metric, not a real
// absence. It was replaced by a wall-clock deadline for the whole call, so the
// response finishes naturally and the full ranked list gets analysed. Keep the
// deadline: it still guards against a stalled connection before Netlify's hard
// 26s kill. Do not reintroduce a character cap.

async function callClaude(prompt, ctx) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('[Claude] ANTHROPIC_API_KEY not set'); return { text: null, errorCode: 'auth_error' } }

  // Budget for the whole call (fetch/search wait + streaming). Netlify kills
  // this function at 26s total; reserve ~5s for analyseResponse + the
  // Supabase insert + building the response after callClaude returns.
  const TIME_BUDGET_MS = 21000
  const deadline = Date.now() + TIME_BUDGET_MS

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        // NOTE: the 'anthropic-beta: web-search-2025-03-05' header and the
        // web_search tool were REMOVED 2026-07-10 — see the block comment above.
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1000,   // less to generate = faster streaming start
        stream:     true,
        system:     ctx,
        // No `tools` — training-data mode, deliberately. Do NOT re-add
        // web_search here without re-reading the cost note above.
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    if (!r.ok) {
      const errText = await r.text().catch(() => '')
      console.error('[Claude] HTTP error:', r.status, errText.slice(0, 200))
      const isQuota = r.status === 429 || r.status === 402
      return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
    }

    const reader   = r.body.getReader()
    const decoder  = new TextDecoder()
    let buf        = ''
    let text       = ''
    let stopReason = null
    let timedOut   = false

    outer: while (true) {
      const remaining = deadline - Date.now()
      if (remaining <= 0) {
        timedOut = true
        reader.cancel('time budget exceeded').catch(() => {})
        break
      }

      // Race the next chunk against the remaining time budget — reader.read()
      // itself has no timeout option, so a pending read that never resolves
      // (e.g. a stalled connection) must be bounded explicitly here too.
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
      return { text, errorCode: null }
    }
    console.warn('[Claude] stream done but no text | stop_reason:', timedOut ? 'time_budget' : stopReason)
    return { text: null, errorCode: null }
  } catch (e) { console.error('[Claude] threw:', e.message); return { text: null, errorCode: null } }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label } = body

  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // Client ownership check
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[Claude/${invId}] user:${auth.user.id} prompt_id:${prompt_id} client_id:${client_id} force:${force}`)

  // For non-force: skip if Claude already has a successful result this month
  if (!force) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results').select('llm')
      .eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', 'claude')
      .neq('status', 'error')
      .gte('checked_at', monthStart.toISOString())
    if (existing?.length > 0) {
      console.log(`[Claude/${invId}] already ran this month — skipping`)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, llm: 'claude' }) }
    }
  }

  // For force: collect-prompt.js has already deleted all rows for this prompt.
  // No need to delete here — just run and insert.

  const ctx  = buildSystemContext(client_config, market_label, region_label)
  const T0   = Date.now()
  const { text, errorCode } = await callClaude(prompt_text, ctx)

  const elapsed = Date.now() - T0
  console.log(`[Claude/${invId}] call finished in ${elapsed}ms`)

  if (errorCode) {
    console.warn(`[Claude/${invId}] API error: ${errorCode} — storing error state`)
    await supabase.from('ai_results').insert([{
      prompt_id, llm: 'claude', client_id,
      status: 'error', error_code: errorCode,
      brand_mentioned: false, checked_at: new Date().toISOString(),
      cost_eur: costForRow('claude', errorCode),
    }])
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: errorCode }) }
  }

  if (!text) {
    console.warn(`[Claude/${invId}] no text — nothing saved`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: 'no_response' }) }
  }

  let analysis
  try { analysis = analyseResponse(text, client_config) }
  catch (e) {
    console.error(`[Claude/${invId}] analyseResponse threw:`, e.message)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: 'analysis_error' }) }
  }

  const { error: insErr } = await supabase.from('ai_results').insert([{
    prompt_id,
    llm:                   'claude',
    client_id,
    status:                'ok',
    brand_mentioned:       analysis.brand_mentioned,
    brand_position:        analysis.brand_position,
    sentiment:             analysis.sentiment,
    response_snippet:      analysis.response_snippet,
    competitors_mentioned: analysis.competitors_mentioned,
    response_text:         typeof text === 'string' ? text.slice(0, 10000) : null,
    checked_at:            new Date().toISOString(),
    cost_eur:              costForRow('claude', null),
  }])

  if (insErr) {
    console.error(`[Claude/${invId}] insert FAILED:`, insErr.message)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: 'insert_error', detail: insErr.message }) }
  }

  console.log(`[Claude/${invId}] saved | mentioned:${analysis.brand_mentioned} | position:${analysis.brand_position} | sentiment:${analysis.sentiment}`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, llm: 'claude', summary: { brand_mentioned: analysis.brand_mentioned } }),
  }
}
