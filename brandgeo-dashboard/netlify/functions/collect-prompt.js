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
 * active_engines: optional NARROWING of the fast engines to run. It can only
 *   narrow: the server computes the allowed set from the client's own plan and
 *   engines_enabled (resolveEngines below) and intersects the body with it.
 * force: honoured for admins only (effectiveForce below); a non-admin's force
 *   is treated as false and the 200 body carries force_ignored: true.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { collectEngines } = require('./_collect')
const { withObservability, captureException } = require('./_observability')
const { MONTHLY_CAPPED_ENGINES, MONTHLY_CAP_DAYS, activeEnginesFor } = require('./_cost')

// Engines this endpoint owns. Claude → collect-claude.js, ChatGPT → collect-chatgpt.js.
// google_ai (Google AI Mode via SerpApi) is handled here too — it's a fast HTTP
// call that fits the 26s window. `meta` is retired but kept in the list so an old
// meta request wouldn't error (no plan includes it anymore, so it won't be sent).
// ai_overview (Google AI Overviews via SerpApi) is handled here too, for the
// same reason google_ai is: it is an HTTP scrape that fits the 26s window. It
// can make TWO sequential SerpApi calls when Google defers the overview behind
// a page_token, which is why its ENGINE_TIMEOUT_MS in _collect.js is higher
// than google_ai's.
const FAST_ENGINES = ['gemini', 'perplexity', 'meta', 'google_ai', 'grok', 'ai_overview']

// The engines this call may run, computed on the server. Until 2026-11-08 the
// endpoint trusted body.active_engines and, when the body sent none, ran ALL
// fast engines, so a free client could call google_ai or perplexity from
// devtools. Now: the client's plan set (activeEnginesFor over the clients row,
// the same function the worker path uses) intersected with FAST_ENGINES, then
// intersected with the body's active_engines when it sends a non-empty array.
// The body can only narrow, never widen. Order follows FAST_ENGINES.
function resolveEngines(plan, enginesEnabled, requested) {
  const planSet = new Set(activeEnginesFor(plan, enginesEnabled))
  let allowed = FAST_ENGINES.filter(e => planSet.has(e))
  if (Array.isArray(requested) && requested.length > 0) {
    const req = new Set(requested)
    allowed = allowed.filter(e => req.has(e))
  }
  return allowed
}

// Same rule as enqueue-collection.js effectiveForceFor: only an admin's
// force: true runs the destructive path (delete, then recollect).
function effectiveForce(role, force) {
  return role === 'admin' && force === true
}

exports.handler = withObservability('collect-prompt', async (event) => {
  // Auth: verify JWT + origin (client ownership checked after body parse)
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  // Unique ID per invocation — disambiguates interleaved logs from warm-start container reuse
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const { prompt_id, prompt_text, client_id, client_config, market_label, region_label, market_id, active_engines } = body
  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // Viewers may only collect for their own client
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const force = effectiveForce(auth.profile.role, body.force)
  const forceIgnored = !!body.force && !force
  const forceFlag = forceIgnored ? { force_ignored: true } : {}

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Plan and engine overrides come from the clients row, never from the body.
  const { data: clientRow, error: clientErr } = await supabase
    .from('clients')
    .select('plan, engines_enabled')
    .eq('id', client_id)
    .maybeSingle()
  if (clientErr) {
    console.error(`[${invId}] client lookup failed:`, clientErr.message)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: 'Client lookup failed' }) }
  }
  if (!clientRow) {
    return { statusCode: 404, headers: auth.headers, body: JSON.stringify({ error: 'Client not found' }) }
  }

  const allowed = resolveEngines(clientRow.plan, clientRow.engines_enabled, active_engines)
  if (allowed.length === 0) {
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id, reason: 'no_engines_for_plan', ...forceFlag }) }
  }

  // SCALE-SPEC.md §2 — hourly ceiling + monthly EUR budget + platform-wide
  // ceiling, scoped to the CONFIRMED target client. See _auth.js's
  // checkCollectionLimits doc comment for why this isn't in requireAuth() itself.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  console.log(`[${invId}] prompt_id:${prompt_id} client_id:${client_id} force:${force}${forceIgnored ? ' (ignored for non-admin)' : ''} engines:${allowed.join(',')} user:${auth.user.id}`)

  // Monthly cap (e.g. google_ai/SerpApi): if a capped engine already ran for this
  // (client, prompt) within MONTHLY_CAP_DAYS, it's excluded here — from BOTH the
  // run and the force-delete — so force can't bypass the cap or wipe the row it
  // relies on. Computed before the delete below.
  const isCapped = (llm) => MONTHLY_CAPPED_ENGINES.includes(llm)
  let cappedRecent = new Set()
  if (FAST_ENGINES.some(isCapped)) {
    const capWindow = new Date(Date.now() - MONTHLY_CAP_DAYS * 86400000).toISOString()
    const { data: recentCapped } = await supabase
      .from('ai_results')
      .select('llm')
      .eq('prompt_id', prompt_id)
      .eq('client_id', client_id)
      .in('llm', MONTHLY_CAPPED_ENGINES)
      .gte('checked_at', capWindow)
    cappedRecent = new Set((recentCapped || []).map(r => r.llm))
  }
  const cappedNow = (llm) => isCapped(llm) && cappedRecent.has(llm)

  let toRun

  if (force) {
    // On force, only delete rows for the engines we're about to re-run — never a
    // capped engine that already ran this week (excluded from delete AND run).
    const enginesForDelete = allowed.filter(e => !cappedNow(e))
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
    toRun = allowed.filter(llm => {
      if (done.has(llm)) return false
      if (cappedNow(llm)) return false   // monthly cap (SerpApi) already ran this month
      return true
    })
    if (toRun.length === 0)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id, ...forceFlag }) }
  }

  // Run the fast engines via the shared module. It returns exactly one row per
  // engine — ok OR error, never silence (#109). No run_id → these manual rows
  // stay out of the queue's uq_ai_results_run_prompt_llm dedup index.
  const { rows, summary, ctx } = await collectEngines(toRun, {
    prompt_id, prompt_text, client_id, client_config, market_label, region_label, market_id,
  })

  console.log(`[${invId}] summary:`, Object.entries(summary).map(([e, s]) => `${e}=${s}`).join(' | '))

  let insertFailed = false
  if (rows.length > 0) {
    console.log('[Insert] saving:', rows.map(r => r.llm).join(', '))
    const { error } = await supabase.from('ai_results').insert(rows)
    if (error) {
      console.error('[Insert] FAILED:', error.message)
      await captureException(error, { fn: 'collect-prompt', tags: { reason: 'insert_error' } })
      insertFailed = true
    } else {
      console.log('[Insert] saved', rows.length, 'row(s)')
    }
  } else {
    console.warn('[Insert] nothing to save')
  }

  // ctx_geo: what location was actually used — helps debug collection results
  const ctxGeo = market_label
    ? (region_label && !region_label.startsWith('All ') ? `${region_label}, ${market_label}` : market_label)
    : ctx.split('from ')[1]?.split('.')[0] ?? 'unknown'

  // The engines ran and were billed, but nothing was saved, so the row the
  // client is about to reload for will never appear. Until 2026-09-03 this
  // still answered { done: true } and the single-cell refresh reported success
  // for a result that did not exist. Same shape as collect-claude.js and
  // collect-chatgpt.js (done: false, reason: 'insert_error'), minus their
  // `detail`: the driver message stays in the function log, not in a body an
  // authenticated viewer can read.
  if (insertFailed) {
    return {
      statusCode: 200,
      headers: auth.headers,
      body: JSON.stringify({ done: false, prompt_id, reason: 'insert_error', summary, ctx_geo: ctxGeo, ...forceFlag }),
    }
  }

  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, prompt_id, summary, ctx_geo: ctxGeo, ...forceFlag }),
  }
})

exports.resolveEngines = resolveEngines
exports.effectiveForce = effectiveForce
exports.FAST_ENGINES = FAST_ENGINES
