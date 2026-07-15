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
 *     markets — the browser's MarketSelection[]; markets[0] is the primary geo.
 *     active_engines — the client's plan-active engine ids (browser-computed).
 *
 * Returns: { run_id, total_jobs, skipped, reason? }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { enqueueClientCollection, triggerWorker } = require('./_enqueue')

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const { client_id, force = false, markets, active_engines } = body
  if (!client_id) return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing client_id' }) }

  // Ownership — viewers may only enqueue for their own client
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  // SCALE-SPEC §2 — refuse to enqueue if the client is over its hourly ceiling or
  // monthly budget, or the platform is over its ceiling. Checked here at enqueue
  // time (not per-job in the worker) so an over-budget run never gets created.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Resolve primary geo from the browser's MarketSelection[].
  const primary = Array.isArray(markets) && markets.length > 0 ? markets[0] : null
  const market = primary ? {
    market_id:    primary.market?.id ?? null,
    market_label: primary.market?.label ?? null,
    region_label: primary.region?.label ?? null,
  } : null

  const result = await enqueueClientCollection(supabase, {
    clientId:      client_id,
    force:         !!force,
    trigger:       'manual',
    createdBy:     auth.user.id,
    market,
    activeEngines: Array.isArray(active_engines) && active_engines.length > 0 ? active_engines : null,
  })

  if (result.skipped) {
    console.log(`[Enqueue] client ${client_id} skipped: ${result.reason}`)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ run_id: null, total_jobs: 0, skipped: true, reason: result.reason }) }
  }

  // Kick the worker so it starts now instead of waiting for the hourly cron.
  await triggerWorker()

  console.log(`[Enqueue] client ${client_id} run ${result.runId} — ${result.totalJobs} jobs (force=${!!force})`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ run_id: result.runId, total_jobs: result.totalJobs, skipped: false }),
  }
}
