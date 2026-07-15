/**
 * collect-prompt.js
 * HTTP endpoint for the 3 FAST engines (gemini / perplexity / meta) for a single
 * prompt — the manual "Run collection" / "Refresh this prompt" path still uses it
 * (Claude and ChatGPT have their own dedicated endpoints for the full 26s window).
 *
 * Now a THIN WRAPPER over _collect.js (SCALE-SPEC.md §3.3): the engine callers +
 * row building live in the shared module so the collection worker runs the exact
 * same code. This file keeps only the HTTP concerns — auth, ownership,
 * rate/budget limits, the force-delete / non-force monthly-skip logic, the
 * active_engines filter, and the insert.
 *
 * POST body:
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label?, market_id?, active_engines? }
 *
 * market_label / region_label — human-readable geo context (e.g. "Romania", "Bucharest")
 * market_id — ISO 3166-1 alpha-2 country code (unused by the 3 fast engines here,
 *   accepted for payload symmetry with the ChatGPT endpoint).
 * client_config: { brand_aliases, brand_website, known_competitors }
 * active_engines — subset of {gemini, perplexity, meta} to run for this client.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { collectEngines } = require('./_collect')

// Engines this endpoint owns. Claude → collect-claude.js, ChatGPT → collect-chatgpt.js.
const FAST_ENGINES = ['gemini', 'perplexity', 'meta']

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

  // SCALE-SPEC.md §2 — hourly ceiling + monthly EUR budget + platform-wide
  // ceiling, scoped to the CONFIRMED target client. See _auth.js's
  // checkCollectionLimits doc comment for why this isn't in requireAuth() itself.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[${invId}] prompt_id:${prompt_id} client_id:${client_id} force:${force} user:${auth.user.id}`)

  // active_engines filters which of the 3 fast engines this call should run.
  // If not provided, run all 3 (backwards-compatible with direct API calls).
  const allowedEngines = Array.isArray(active_engines) && active_engines.length > 0
    ? new Set(active_engines)
    : null   // null = all allowed

  let toRun

  if (force) {
    // On force, only delete rows for the engines we're about to re-run
    const enginesForDelete = allowedEngines
      ? FAST_ENGINES.filter(e => allowedEngines.has(e))
      : FAST_ENGINES.slice()
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
    toRun = FAST_ENGINES.filter(llm => {
      if (done.has(llm)) return false
      if (allowedEngines && !allowedEngines.has(llm)) return false
      return true
    })
    if (toRun.length === 0)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id }) }
  }

  // Run the fast engines via the shared module. It returns exactly one row per
  // engine — ok OR error, never silence (#109). No run_id → these manual rows
  // stay out of the queue's uq_ai_results_run_prompt_llm dedup index.
  const { rows, summary, ctx } = await collectEngines(toRun, {
    prompt_id, prompt_text, client_id, client_config, market_label, region_label, market_id,
  })

  console.log(`[${invId}] summary:`, Object.entries(summary).map(([e, s]) => `${e}=${s}`).join(' | '))

  if (rows.length > 0) {
    console.log('[Insert] saving:', rows.map(r => r.llm).join(', '))
    const { error } = await supabase.from('ai_results').insert(rows)
    if (error) console.error('[Insert] FAILED:', error.message)
    else console.log('[Insert] saved', rows.length, 'row(s)')
  } else {
    console.warn('[Insert] nothing to save')
  }

  // ctx_geo: what location was actually used — helps debug collection results
  const ctxGeo = market_label
    ? (region_label && !region_label.startsWith('All ') ? `${region_label}, ${market_label}` : market_label)
    : ctx.split('from ')[1]?.split('.')[0] ?? 'unknown'

  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, prompt_id, summary, ctx_geo: ctxGeo }),
  }
}
