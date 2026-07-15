/**
 * collect-chatgpt.js
 * Dedicated Netlify function for ChatGPT-only collection.
 *
 * Runs in parallel with collect-prompt.js (fast engines) and collect-claude.js.
 * Having its own function gives ChatGPT the full 26s Netlify window -- gpt-5.5
 * with web_search_preview typically needs 20-25s for Romanian market queries.
 *
 * POST body (same shape as collect-prompt.js):
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label?, market_id? }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { analyseResponse } = require('./_analysis')
const { costForRow } = require('./_cost')

// --- Geo context ------------------------------------------------------------------

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
    `Answer as if you are that local user -- use local context and knowledge relevant to ${location}. ` +
    `Respond in the same language as the question.`
  )
}

// --- ChatGPT -- OpenAI Responses API with web_search_preview + geo ---------------
// gpt-5.5 with web search needs 20-25s for some markets. Dedicated 26s function
// gives it the full budget without racing against Gemini/Perplexity/Meta.

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
      // Cost control (SCALE-SPEC.md §1.1b step 3, 2026-07-10). gpt-5.5 is a
      // REASONING model: reasoning tokens bill as OUTPUT ($30/MTok) and were
      // completely uncapped here — the single biggest unbounded cost in the
      // whole pipeline. 'low' effort cuts them without touching the answer.
      //
      // Two things SCALE-SPEC suggested that are NOT done here, on purpose:
      //  - `max_output_tokens`: gpt-5.5 on the Responses API REJECTS it with a
      //    400 Bad Request. Setting it would break every ChatGPT call.
      //  - `text: { verbosity: 'low' }`: shortens the ANSWER, which would
      //    truncate long competitor listicles and drop brands ranked ~#7+ —
      //    the exact false-negative bug already fixed for Claude (§8.4 1.4).
      //    Never trade answer length for cost in this product.
      reasoning:    { effort: 'low' },
    }),
  })
  const d = await r.json()
  if (d.error) {
    console.error('[ChatGPT] API error:', JSON.stringify(d.error))
    const isQuota = r.status === 429 || r.status === 402 || d.error.code === 'insufficient_quota'
    return { text: null, errorCode: isQuota ? 'quota_exceeded' : 'api_error' }
  }

  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')

  if (text) {
    console.log('[ChatGPT] location used:', userLocation || 'none (worldwide)', '| preview:', text.slice(0, 200))
  } else {
    console.warn('[ChatGPT] empty output -- full response:', JSON.stringify(d).slice(0, 500))
  }
  return { text: text || null, errorCode: null }
}

// --- Handler ----------------------------------------------------------------------

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label, market_id } = body

  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // Client ownership check
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  // SCALE-SPEC.md §2 — see collect-prompt.js / _auth.js's checkCollectionLimits
  // doc comment for the full rationale.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[ChatGPT/${invId}] user:${auth.user.id} prompt_id:${prompt_id} client_id:${client_id} force:${force}`)

  // For non-force: skip if ChatGPT already has a successful result this month
  if (!force) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results').select('llm')
      .eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', 'chatgpt')
      .neq('status', 'error')
      .gte('checked_at', monthStart.toISOString())
    if (existing?.length > 0) {
      console.log(`[ChatGPT/${invId}] already ran this month -- skipping`)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, llm: 'chatgpt' }) }
    }
  }

  // For force: collect-prompt.js has already deleted all rows for this prompt.
  // Just run and insert.

  const ctx = buildSystemContext(client_config, market_label, region_label)
  const T0  = Date.now()
  const { text, errorCode } = await callChatGPT(prompt_text, ctx, market_id, region_label)

  const elapsed = Date.now() - T0
  console.log(`[ChatGPT/${invId}] call finished in ${elapsed}ms`)

  if (errorCode) {
    console.warn(`[ChatGPT/${invId}] API error: ${errorCode} — storing error state`)
    await supabase.from('ai_results').insert([{
      prompt_id, llm: 'chatgpt', client_id,
      status: 'error', error_code: errorCode,
      brand_mentioned: false, checked_at: new Date().toISOString(),
      cost_eur: costForRow('chatgpt', errorCode),
    }])
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: errorCode }) }
  }

  if (!text) {
    console.warn(`[ChatGPT/${invId}] no text -- nothing saved`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'no_response' }) }
  }

  let analysis
  try { analysis = analyseResponse(text, client_config) }
  catch (e) {
    console.error(`[ChatGPT/${invId}] analyseResponse threw:`, e.message)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'analysis_error' }) }
  }

  const { error: insErr } = await supabase.from('ai_results').insert([{
    prompt_id,
    llm:                   'chatgpt',
    client_id,
    status:                'ok',
    brand_mentioned:       analysis.brand_mentioned,
    brand_position:        analysis.brand_position,
    sentiment:             analysis.sentiment,
    response_snippet:      analysis.response_snippet,
    competitors_mentioned: analysis.competitors_mentioned,
    response_text:         typeof text === 'string' ? text.slice(0, 10000) : null,
    checked_at:            new Date().toISOString(),
    cost_eur:              costForRow('chatgpt', null),
  }])

  if (insErr) {
    console.error(`[ChatGPT/${invId}] insert FAILED:`, insErr.message)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'insert_error', detail: insErr.message }) }
  }

  console.log(`[ChatGPT/${invId}] saved | mentioned:${analysis.brand_mentioned} | position:${analysis.brand_position} | sentiment:${analysis.sentiment}`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, llm: 'chatgpt', summary: { brand_mentioned: analysis.brand_mentioned } }),
  }
}
