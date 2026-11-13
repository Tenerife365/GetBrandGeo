/**
 * enqueue-collection.js  (SCALE-SPEC.md §3.4)
 *
 * The manual "Run collection" / "Force Refresh" entry point, replacing the old
 * browser-side collection loop. The dashboard POSTs here; this endpoint creates a
 * collection_runs row + collection_jobs, kicks the background worker, and returns
 * the run_id. The browser then POLLS collection_jobs/collection_runs for progress
 * (per-client SELECT RLS) and can close the tab — the worker finishes server-side.
 *
 * POST body:
 *   { client_id, force?, markets?, active_engines? }
 *     client_id: a positive int4.
 *     markets: ACCEPTED AND IGNORED since 2026-11-13 (an old tab must not
 *       400). Every prompt is asked from its own location, resolved on the
 *       server in _enqueue.js (docs/arch/multi-location-collection.md 6.1).
 *     active_engines: the client's plan-active engine ids (browser-computed,
 *       re-gated against the plan in _enqueue.js).
 *
 * Returns: { run_id, total_jobs, skipped, reason? }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { enqueueClientCollection, triggerWorker, checkCollectionCooldown } = require('./_enqueue')

// Only an admin may run the destructive force path (delete, then recollect).
// A non-admin's force flag is ignored, never honoured, and the response says so
// with force_ignored: true. The dashboard never sends force for a viewer; this
// closes the devtools route (docs/qa/ai-visibility-prompt-focus-build-rereview-2026-10-31.md P3).
function effectiveForceFor(role, force) {
  return role === 'admin' && force === true
}

// clients.id is int4: a positive integer (or its plain decimal string) up to
// 2147483647, nothing else. Same rule as parseId in collect-prompt.js.
const PG_INT_MAX = 2147483647
function parseId(v) {
  let n = null
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^[1-9][0-9]*$/.test(v)) n = Number(v)
  return Number.isSafeInteger(n) && n > 0 && n <= PG_INT_MAX ? n : null
}

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  // The body must be a JSON object; null, an array or a scalar is refused
  // before anything is read.
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid body' }) }

  // body.markets is read by nothing (see the header): geo is per prompt.
  const { client_id: rawClientId, force = false, active_engines } = body
  if (rawClientId === undefined || rawClientId === null || rawClientId === '')
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing client_id' }) }
  const client_id = parseId(rawClientId)
  if (client_id === null)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid client_id' }) }

  // Ownership — viewers may only enqueue for their own client
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const effectiveForce = effectiveForceFor(auth.profile.role, force)
  const forceIgnored = !!force && !effectiveForce

  // PRICING-STRATEGY-2026-07 §6 — Run-Collection cooldown (per-plan frequency
  // limit). Admins bypass (support / testing / managed done-for-you). Applies to
  // manual runs incl. Force Refresh, so the countdown can't be bypassed.
  if (auth.profile.role !== 'admin') {
    const cd = await checkCollectionCooldown(auth.supabase, client_id)
    if (cd.blocked) {
      return { statusCode: 429, headers: auth.headers, body: JSON.stringify({
        error: cd.message, reason: 'cooldown',
        retry_after_hours: cd.hoursRemaining, next_available_at: cd.nextAvailableAt,
      }) }
    }
  }

  // SCALE-SPEC §2 — refuse to enqueue if the client is over its hourly ceiling or
  // monthly budget, or the platform is over its ceiling. Checked here at enqueue
  // time (not per-job in the worker) so an over-budget run never gets created.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // market: null. Geo is resolved per prompt from prompts.location_id inside
  // _enqueue.js; browser labels never reach the engines.
  const result = await enqueueClientCollection(supabase, {
    clientId:      client_id,
    force:         effectiveForce,
    trigger:       'manual',
    createdBy:     auth.user.id,
    market:        null,
    activeEngines: Array.isArray(active_engines) && active_engines.length > 0 ? active_engines : null,
  })

  if (result.skipped) {
    console.log(`[Enqueue] client ${client_id} skipped: ${result.reason}`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ run_id: null, total_jobs: 0, skipped: true, reason: result.reason, ...(forceIgnored ? { force_ignored: true } : {}) }) }
  }

  // Kick the worker so it starts now instead of waiting for the hourly cron.
  await triggerWorker()

  console.log(`[Enqueue] client ${client_id} run ${result.runId}: ${result.totalJobs} jobs (force=${effectiveForce}${forceIgnored ? ', requested force ignored' : ''})`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ run_id: result.runId, total_jobs: result.totalJobs, skipped: false, ...(forceIgnored ? { force_ignored: true } : {}) }),
  }
}

exports.effectiveForceFor = effectiveForceFor
