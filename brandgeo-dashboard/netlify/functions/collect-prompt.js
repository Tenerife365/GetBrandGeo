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
 * market_label / region_label / market_id: accepted so an old tab does not
 *   400, and IGNORED since 2026-11-13. The prompt is asked from its own
 *   location, resolved on the server (resolvePromptGeo below), and every row
 *   carries that stamp (location_id, asked_market_id, asked_region_id).
 * client_config: { brand_aliases, brand_website, known_competitors }
 * active_engines: optional NARROWING of the fast engines to run. It can only
 *   narrow: the server computes the allowed set from the client's own plan and
 *   engines_enabled (resolveEngines below) and intersects the body with it.
 * force: honoured for admins only (effectiveForce below); a non-admin's force
 *   is treated as false and the 200 body carries force_ignored: true.
 * prompt (2026-11-09, F1): prompt_id must be a prompts row of client_id, read
 *   with the service key before any spend (loadPromptForCollect below). A
 *   non-admin's prompt_text is ignored: the stored text goes to the engines.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { collectEngines } = require('./_collect')
const { withObservability, captureException } = require('./_observability')
const { MONTHLY_CAPPED_ENGINES, MONTHLY_CAP_DAYS, activeEnginesFor } = require('./_cost')
const { loadLocationRow, resolveLocation, fallbackGeo } = require('./_locations')

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

// F1, docs/qa/phase2-server-review-2026-11-08.md (2026-11-09). The prompts row
// is read with the service key BEFORE the plan gate, the limits check and any
// engine call. Until then prompt_id and prompt_text were taken from the body
// unchecked: a prompt_id that does not exist made the insert fail on
// ai_results_prompt_id_fkey AFTER the engines were billed, and every spend
// gate counts inserted rows only, so the calls were unbounded. Another
// client's prompt_id inserted rows under the caller's client_id, and an admin
// force deleted rows by that foreign prompt_id.
//   no row                          -> 404 { error: 'Prompt not found' }
//   row of another client           -> 403, admins included (a row must never
//                                      pair a client with a foreign prompt)
//   lookup error                    -> 500, never falls through to collecting
//   non-admin, prompt not active    -> refused as { skip: 'prompt_inactive' }
//   non-admin                       -> the STORED text goes to the engines
//   admin                           -> the body text, as before
// The identical function sits in collect-claude.js and collect-chatgpt.js;
// tests/phase2_prompt_ownership.test.js asserts the three agree.
// N1 of docs/qa/phase2-server-rereview-2026-11-09.md: the canonical ids come
// back from the ROW (promptId: data.id, clientId: data.client_id), and the
// handler uses only those for every later read, the limits check, the force
// delete, the insert and the response body. No body value reaches a row.
async function loadPromptForCollect(supabase, { promptId, clientId, role, bodyText }) {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, text, client_id, is_active, location_id')
    .eq('id', promptId)
    .maybeSingle()
  if (error) return { status: 500, error: 'Prompt lookup failed', logMessage: error.message }
  if (!data) return { status: 404, error: 'Prompt not found' }
  if (String(data.client_id) !== String(clientId)) return { status: 403, error: 'Forbidden: prompt does not belong to this client' }
  const ids = { promptId: data.id, clientId: data.client_id }
  const isAdmin = role === 'admin'
  if (!isAdmin && data.is_active !== true) return { skip: 'prompt_inactive', ...ids }
  return { ok: true, text: isAdmin ? bodyText : data.text, ...ids, locationId: data.location_id ?? null }
}

// One location per prompt (docs/arch/multi-location-collection.md 6.2,
// 2026-11-13). The place a prompt is asked from is resolved HERE, on the
// server, from the prompt's own location_id and the client's id; the
// market_label, region_label and market_id of the body are ignored. A null
// location_id, or a row that is not returned for this client, is asked at the
// client's default country (fallbackGeo, the pre 2026-11-13 behaviour). A
// failed read refuses BEFORE any engine call, so no money is spent on an
// answer asked from the wrong place:
//   ok          -> { ok: true, geo: { location_id, market_id, region_id, market_label, region_label } }
//   read error  -> { status: 500, error: 'Location lookup failed', reason: 'location_read_failed', logMessage }
// The identical function sits in collect-claude.js and collect-chatgpt.js;
// tests/phase2_prompt_ownership.test.js asserts the three agree.
async function resolvePromptGeo(supabase, { clientId, locationId, clientRow }) {
  if (locationId == null) return { ok: true, geo: fallbackGeo(clientRow) }
  const res = await loadLocationRow(supabase, clientId, locationId)
  if (!res.ok) return { status: 500, error: 'Location lookup failed', reason: 'location_read_failed', logMessage: res.error }
  return { ok: true, geo: res.row ? resolveLocation(res.row) : fallbackGeo(clientRow) }
}

// N1 (2026-11-09): an id from the body is accepted only as a positive safe
// integer (a JSON number) or as the canonical decimal string of one ("7").
// Anything else is null and the handler answers 400 { error: 'Invalid id' }
// before any read. postgrest-js stringifies filter values, so [7] used to find
// prompt 7 and pass the F1 check, then failed the insert as 22P02 AFTER the
// engines were billed, and every spend gate counts inserted rows only.
// Rejected on purpose: arrays, objects, booleans, 7.5, -1, 0, 1e21 and any
// unsafe integer, "7x", " 7", "+7", "7.0", and "07". A leading zero is refused
// so each id has one spelling; no caller sends one (collectionContext.tsx posts
// the numeric ids it read from Supabase). The identical function sits in
// collect-claude.js and collect-chatgpt.js; tests/phase2_prompt_ownership.test.js
// asserts the three agree.
//
// I1 (2026-11-09, docs/qa/phase2-server-final-2026-11-09.md): prompts.id,
// prompts.client_id, ai_results.prompt_id and ai_results.client_id are all
// int4, so an id above 2147483647 is refused here too. It used to pass as a
// safe integer, then the prompts lookup raised 22003 (out of range) and the
// handler answered 500 with an error-level log line on demand.
const PG_INT_MAX = 2147483647
function parseId(v) {
  let n = null
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^[1-9][0-9]*$/.test(v)) n = Number(v)
  return Number.isSafeInteger(n) && n > 0 && n <= PG_INT_MAX ? n : null
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

  // I2 (2026-11-09): the body must be a JSON object. null used to throw on the
  // destructure below (an unhandled error instead of a 400); a number, string,
  // boolean or array is refused the same way, before anything is read.
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid body' }) }

  // market_label, region_label and market_id of the body are not read: the
  // place is resolved from the prompt's location (resolvePromptGeo above).
  const { prompt_id: rawPromptId, prompt_text, client_id: rawClientId, client_config, active_engines } = body
  if (!rawPromptId || !prompt_text || !rawClientId || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // N1: ids are integers or nothing, checked before any read (parseId above).
  const bodyPromptId = parseId(rawPromptId)
  const bodyClientId = parseId(rawClientId)
  if (bodyPromptId === null || bodyClientId === null) {
    console.warn(`[${invId}] user:${auth.user.id} refused 400: invalid id`)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid id' }) }
  }

  // Viewers may only collect for their own client
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(bodyClientId)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const force = effectiveForce(auth.profile.role, body.force)
  const forceIgnored = !!body.force && !force
  const forceFlag = forceIgnored ? { force_ignored: true } : {}

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // F1: the prompt must exist and belong to this client before anything costs
  // money, and before an admin force can delete anything by this prompt_id.
  const promptCheck = await loadPromptForCollect(supabase, {
    promptId: bodyPromptId, clientId: bodyClientId, role: auth.profile.role, bodyText: prompt_text,
  })
  if (promptCheck.status) {
    if (promptCheck.logMessage) console.error(`[${invId}] prompt lookup failed:`, promptCheck.logMessage)
    else console.warn(`[${invId}] user:${auth.user.id} prompt_id:${bodyPromptId} client_id:${bodyClientId} refused ${promptCheck.status}: ${promptCheck.error}`)
    return { statusCode: promptCheck.status, headers: auth.headers, body: JSON.stringify({ error: promptCheck.error }) }
  }
  // From here on only the canonical ids read from the prompts row are used.
  const prompt_id = promptCheck.promptId
  const client_id = promptCheck.clientId
  if (promptCheck.skip) {
    console.log(`[${invId}] prompt_id:${prompt_id} is not active, refused for a non-admin`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id, reason: promptCheck.skip, ...forceFlag }) }
  }
  const promptText = promptCheck.text

  // Plan and engine overrides come from the clients row, never from the body.
  const { data: clientRow, error: clientErr } = await supabase
    .from('clients')
    .select('plan, engines_enabled, default_market_id')
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

  // Where this prompt is asked from, resolved before the limits check, the
  // force delete and any engine call (resolvePromptGeo above).
  const geoCheck = await resolvePromptGeo(supabase, { clientId: client_id, locationId: promptCheck.locationId, clientRow })
  if (geoCheck.status) {
    console.error(`[${invId}] prompt_id:${prompt_id} client_id:${client_id} location ${promptCheck.locationId} lookup failed, refused before any engine call:`, geoCheck.logMessage)
    return { statusCode: geoCheck.status, headers: auth.headers, body: JSON.stringify({ error: geoCheck.error, reason: geoCheck.reason, ...forceFlag }) }
  }
  const geo = geoCheck.geo

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
    prompt_id, prompt_text: promptText, client_id, client_config,
    market_label: geo.market_label, region_label: geo.region_label, market_id: geo.market_id,
    asked: { location_id: geo.location_id, market_id: geo.market_id, region_id: geo.region_id },
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

  // ctx_geo: what location was actually used, helps debug collection results.
  // Built from the server-resolved labels only, never from the body (S11).
  const ctxGeo = geo.market_label
    ? (geo.region_label && !geo.region_label.startsWith('All ') ? `${geo.region_label}, ${geo.market_label}` : geo.market_label)
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
exports.loadPromptForCollect = loadPromptForCollect
exports.resolvePromptGeo = resolvePromptGeo
exports.parseId = parseId
exports.FAST_ENGINES = FAST_ENGINES
