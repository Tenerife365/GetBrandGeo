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

// ─── Claude — streaming with early abort ─────────────────────────────────────
// The full 26s Netlify window is dedicated to this function alone.
// Web search for some markets (e.g. Romanian catering) takes 24-26s before text
// starts streaming. The early abort at MAX_TEXT chars avoids waiting for the
// full response once we have enough to detect brand mentions.

async function callClaude(prompt, ctx) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('[Claude] ANTHROPIC_API_KEY not set'); return { text: null, errorCode: 'auth_error' } }
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
        max_tokens: 1000,   // less to generate = faster streaming start
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
      return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
    }

    const reader   = r.body.getReader()
    const decoder  = new TextDecoder()
    let buf        = ''
    let text       = ''
    let stopReason = null
    let partial    = false
    const MAX_TEXT = 2500   // abort once we have enough for brand detection (~500-1000 chars needed)

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
      return { text, errorCode: null }
    }
    console.warn('[Claude] stream done but no text | stop_reason:', stopReason)
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
    checked_at:            new Date().toISOString(),
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
