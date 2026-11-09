/**
 * collect-claude.js
 * Dedicated HTTP endpoint for Claude-only collection — the manual
 * "Refresh this prompt" path still uses it.
 *
 * Now a THIN WRAPPER over _collect.js (SCALE-SPEC.md §3.3): the Claude caller
 * (web_search tool with max_uses 1, wall-clock time budget) + row building live in the shared
 * module so the collection worker runs the exact same code. This file keeps only
 * the HTTP concerns: auth, ownership, the plan gate, rate/budget limits, the
 * non-force monthly-skip check, and the insert.
 *
 * POST body:
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label? }
 *
 * Server-side gates (Phase 2, 2026-11-08), the same rules collect-prompt.js
 * applies to the fast engines:
 *   force: honoured for admins only (effectiveForce below). A non-admin's force
 *     is treated as false, so the monthly skip applies, and every 200 body
 *     carries force_ignored: true.
 *   plan: 'claude' must be in activeEnginesFor(plan, engines_enabled) for the
 *     client's live clients row, read here with the service key. Nothing in the
 *     body (client_config included) can grant the engine. A client whose plan
 *     does not carry Claude gets 200 { skipped: true, prompt_id, llm: 'claude',
 *     reason: 'no_engines_for_plan' }, the shape collect-prompt.js returns when
 *     it resolves no engine, and no engine call is made.
 *   prompt (2026-11-09, F1): prompt_id must be a prompts row of client_id,
 *     read with the service key before any spend (loadPromptForCollect below).
 *     A non-admin's prompt_text is ignored: the stored text goes to the engine.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { collectEngines } = require('./_collect')
const { withObservability, captureException } = require('./_observability')
const { activeEnginesFor } = require('./_cost')

const ENGINE = 'claude'

// Same rule as collect-prompt.js effectiveForce and enqueue-collection.js
// effectiveForceFor: only an admin's literal force: true is honoured. Defined
// here rather than required from another endpoint's module; the test
// tests/phase2_collector_gate.test.js asserts the three stay equal.
function effectiveForce(role, force) {
  return role === 'admin' && force === true
}

// Whether this endpoint's engine is in the client's live plan set. Uses the
// same activeEnginesFor the worker path and collect-prompt.js resolveEngines use.
function engineAllowed(plan, enginesEnabled) {
  return activeEnginesFor(plan, enginesEnabled).includes(ENGINE)
}

// F1, docs/qa/phase2-server-review-2026-11-08.md (2026-11-09). The prompts row
// is read with the service key BEFORE the plan gate, the limits check and any
// engine call. Until then prompt_id and prompt_text were taken from the body
// unchecked: a prompt_id that does not exist made the insert fail on
// ai_results_prompt_id_fkey AFTER the engine was billed, and every spend gate
// counts inserted rows only, so the calls were unbounded. Another client's
// prompt_id inserted a row under the caller's client_id.
//   no row                          -> 404 { error: 'Prompt not found' }
//   row of another client           -> 403, admins included (a row must never
//                                      pair a client with a foreign prompt)
//   lookup error                    -> 500, never falls through to collecting
//   non-admin, prompt not active    -> refused as { skip: 'prompt_inactive' }
//   non-admin                       -> the STORED text goes to the engine
//   admin                           -> the body text, as before
// The identical function sits in collect-chatgpt.js and collect-prompt.js;
// tests/phase2_prompt_ownership.test.js asserts the three agree.
// N1 of docs/qa/phase2-server-rereview-2026-11-09.md: the canonical ids come
// back from the ROW (promptId: data.id, clientId: data.client_id), and the
// handler uses only those for every later read, the limits check, the insert
// and the response body. No body value reaches an ai_results row.
async function loadPromptForCollect(supabase, { promptId, clientId, role, bodyText }) {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, text, client_id, is_active')
    .eq('id', promptId)
    .maybeSingle()
  if (error) return { status: 500, error: 'Prompt lookup failed', logMessage: error.message }
  if (!data) return { status: 404, error: 'Prompt not found' }
  if (String(data.client_id) !== String(clientId)) return { status: 403, error: 'Forbidden: prompt does not belong to this client' }
  const ids = { promptId: data.id, clientId: data.client_id }
  const isAdmin = role === 'admin'
  if (!isAdmin && data.is_active !== true) return { skip: 'prompt_inactive', ...ids }
  return { ok: true, text: isAdmin ? bodyText : data.text, ...ids }
}

// N1 (2026-11-09): an id from the body is accepted only as a positive safe
// integer (a JSON number) or as the canonical decimal string of one ("7").
// Anything else is null and the handler answers 400 { error: 'Invalid id' }
// before any read. postgrest-js stringifies filter values, so [7] used to find
// prompt 7 and pass the F1 check, then failed the insert as 22P02 AFTER the
// engine was billed, and every spend gate counts inserted rows only.
// Rejected on purpose: arrays, objects, booleans, 7.5, -1, 0, 1e21 and any
// unsafe integer, "7x", " 7", "+7", "7.0", and "07". A leading zero is refused
// so each id has one spelling; no caller sends one (collectionContext.tsx posts
// the numeric ids it read from Supabase). The identical function sits in
// collect-chatgpt.js and collect-prompt.js; tests/phase2_prompt_ownership.test.js
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

exports.handler = withObservability('collect-claude', async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  // I2 (2026-11-09): the body must be a JSON object. null used to throw on the
  // destructure below (an unhandled error instead of a 400); a number, string,
  // boolean or array is refused the same way, before anything is read.
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid body' }) }

  const { prompt_id: rawPromptId, prompt_text, client_id: rawClientId, client_config, market_label, region_label } = body

  if (!rawPromptId || !prompt_text || !rawClientId || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // N1: ids are integers or nothing, checked before any read (parseId above).
  const bodyPromptId = parseId(rawPromptId)
  const bodyClientId = parseId(rawClientId)
  if (bodyPromptId === null || bodyClientId === null) {
    console.warn(`[Claude/${invId}] user:${auth.user.id} refused 400: invalid id`)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid id' }) }
  }

  // Client ownership check
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(bodyClientId)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const force = effectiveForce(auth.profile.role, body.force)
  const forceIgnored = !!body.force && !force
  const forceFlag = forceIgnored ? { force_ignored: true } : {}

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // F1: the prompt must exist and belong to this client before anything costs money.
  const promptCheck = await loadPromptForCollect(supabase, {
    promptId: bodyPromptId, clientId: bodyClientId, role: auth.profile.role, bodyText: prompt_text,
  })
  if (promptCheck.status) {
    if (promptCheck.logMessage) console.error(`[Claude/${invId}] prompt lookup failed:`, promptCheck.logMessage)
    else console.warn(`[Claude/${invId}] user:${auth.user.id} prompt_id:${bodyPromptId} client_id:${bodyClientId} refused ${promptCheck.status}: ${promptCheck.error}`)
    return { statusCode: promptCheck.status, headers: auth.headers, body: JSON.stringify({ error: promptCheck.error }) }
  }
  // From here on only the canonical ids read from the prompts row are used.
  const prompt_id = promptCheck.promptId
  const client_id = promptCheck.clientId
  if (promptCheck.skip) {
    console.log(`[Claude/${invId}] prompt_id:${prompt_id} is not active, refused for a non-admin`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id, llm: ENGINE, reason: promptCheck.skip, ...forceFlag }) }
  }
  const promptText = promptCheck.text

  // Plan and engine overrides come from the clients row, never from the body.
  const { data: clientRow, error: clientErr } = await supabase
    .from('clients')
    .select('plan, engines_enabled')
    .eq('id', client_id)
    .maybeSingle()
  if (clientErr) {
    console.error(`[Claude/${invId}] client lookup failed:`, clientErr.message)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: 'Client lookup failed' }) }
  }
  if (!clientRow) {
    return { statusCode: 404, headers: auth.headers, body: JSON.stringify({ error: 'Client not found' }) }
  }
  if (!engineAllowed(clientRow.plan, clientRow.engines_enabled)) {
    console.log(`[Claude/${invId}] client_id:${client_id} plan:${clientRow.plan} does not include claude, refused`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, prompt_id, llm: ENGINE, reason: 'no_engines_for_plan', ...forceFlag }) }
  }

  // SCALE-SPEC.md §2 — see _auth.js's checkCollectionLimits doc comment.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  console.log(`[Claude/${invId}] user:${auth.user.id} prompt_id:${prompt_id} client_id:${client_id} force:${force}${forceIgnored ? ' (ignored for non-admin)' : ''}`)

  // For non-force: skip if Claude already has a successful result this month
  if (!force) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results').select('llm')
      .eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', ENGINE)
      .neq('status', 'error')
      .gte('checked_at', monthStart.toISOString())
    if (existing?.length > 0) {
      console.log(`[Claude/${invId}] already ran this month, skipping`)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, llm: ENGINE, ...forceFlag }) }
    }
  }

  // For force: this endpoint deletes nothing. collect-prompt.js deletes only the
  // fast engines it is about to rerun (its enginesForDelete), never Claude rows,
  // so an admin force here skips the monthly check and writes a new row beside
  // the older ones.
  const T0 = Date.now()
  const { rows } = await collectEngines([ENGINE], {
    prompt_id, prompt_text: promptText, client_id, client_config, market_label, region_label,
  })
  const row = rows[0]
  console.log(`[Claude/${invId}] call finished in ${Date.now() - T0}ms | status:${row.status}${row.status === 'error' ? ' ' + row.error_code : ''}`)

  // #109: always exactly one row — ok OR error, never silence.
  const { error: insErr } = await supabase.from('ai_results').insert([row])
  if (insErr) {
    // F4 (2026-11-09): the driver message stays in this log line and in the
    // captured exception. It used to be echoed as `detail` to any signed-in
    // caller (it named ai_results_prompt_id_fkey). collectionContext.tsx reads
    // only `reason`, the same shape collect-prompt.js already returns.
    console.error(`[Claude/${invId}] insert FAILED:`, insErr.message)
    await captureException(insErr, { fn: 'collect-claude', tags: { reason: 'insert_error', llm: ENGINE } })
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: ENGINE, reason: 'insert_error', ...forceFlag }) }
  }

  if (row.status === 'error') {
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: ENGINE, reason: row.error_code, ...forceFlag }) }
  }

  console.log(`[Claude/${invId}] saved | mentioned:${row.brand_mentioned} | position:${row.brand_position} | sentiment:${row.sentiment}`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, llm: ENGINE, summary: { brand_mentioned: row.brand_mentioned }, ...forceFlag }),
  }
})

exports.effectiveForce = effectiveForce
exports.engineAllowed = engineAllowed
exports.loadPromptForCollect = loadPromptForCollect
exports.parseId = parseId
exports.ENGINE = ENGINE
