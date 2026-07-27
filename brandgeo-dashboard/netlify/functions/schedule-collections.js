/**
 * schedule-collections.js  (SCALE-SPEC.md §3.3)
 *
 * Hourly cron job. For every client whose refresh_cadence is due, checks budget
 * and enqueues a fresh collection run, then kicks the worker once. This is what
 * turns "every refresh cadence on the pricing page is a human clicking Force
 * Refresh" into something that happens on its own.
 *
 * Auth: X-Cron-Key shared secret (_cron_auth.js). Invoked by Supabase pg_cron
 * over pg_net at :10 past every hour (db/supabase-scheduled-jobs-migration.sql).
 * It previously took no auth at all while being URL-routable, which made it an
 * unauthenticated way to enqueue work that spends LLM budget — the sharper half
 * of docs/qa/deploy-pipeline-netlify.md F1. Idempotence (below) was the only
 * thing containing it, and idempotence is not authentication.
 *
 * Still naturally idempotent, which is what makes the cutover in
 * docs/arch/scheduled-function-auth.md §8.1 safe: it only touches clients whose
 * cadence is due, and stamps last_refresh_at when it enqueues, so a second
 * trigger in the same window finds nothing due. Budget (§2) caps spend anyway.
 *
 * SAFE DEFAULT: clients default to refresh_cadence='manual' (migration §4), so
 * this function does NOTHING until someone sets a real cadence per client. That
 * is deliberate — see the migration note (avoids surprise-spending every existing
 * client the moment this ships).
 */

const { createClient } = require('@supabase/supabase-js')
const { checkCollectionLimits } = require('./_auth')
const { enqueueClientCollection, triggerWorker } = require('./_enqueue')
const { requireCronAuth } = require('./_cron_auth')

const CADENCE_DAYS = { weekly: 7, biweekly: 14, monthly: 30 }

// One row per invocation, success or failure (arch doc §6.4). Wrapped so an
// observability write can never fail the job it is observing.
// Handles both failure shapes: supabase-js RETURNS { error } for a database-level
// failure (missing table, RLS denial) and only THROWS at the network layer.
// Catching just the throw would silently swallow this code being deployed ahead
// of the migration that creates the table.
async function recordJobRun(supabase, ok, detail) {
  try {
    const { error } = await supabase.from('job_runs').insert({ job: 'schedule-collections', ok, detail })
    if (error) console.error('[Scheduler] job_runs write failed:', error.message)
  } catch (err) {
    console.error('[Scheduler] job_runs write threw:', err.message)
  }
}

function isDue(cadence, lastRefreshAt) {
  const days = CADENCE_DAYS[cadence]
  if (!days) return false           // 'manual' / unknown → never auto-refresh
  if (!lastRefreshAt) return true   // never refreshed → due now
  const elapsedMs = Date.now() - new Date(lastRefreshAt).getTime()
  return elapsedMs >= days * 24 * 60 * 60 * 1000
}

exports.handler = async (event) => {
  const gate = requireCronAuth(event)
  if (gate) return gate.response

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  // Only clients that have opted into a cadence.
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, refresh_cadence, last_refresh_at')
    .in('refresh_cadence', Object.keys(CADENCE_DAYS))
  if (error) {
    console.error(`[Scheduler/${invId}] client load failed:`, error.message)
    await recordJobRun(supabase, false, { invId, error: error.message })
    return { statusCode: 500, body: error.message }
  }

  let enqueued = 0, skippedBudget = 0, skippedNoWork = 0, totalJobs = 0

  for (const client of (clients || [])) {
    if (!isDue(client.refresh_cadence, client.last_refresh_at)) continue

    // Budget gate — if the client is over its monthly budget / hourly ceiling, or
    // the platform is over its ceiling, skip WITHOUT stamping last_refresh_at so
    // it's retried next hour once budget frees up.
    const limit = await checkCollectionLimits(supabase, client.id)
    if (limit.blocked) {
      skippedBudget++
      console.warn(`[Scheduler/${invId}] client ${client.id} (${client.name}) over ${limit.reason} — skipping this cycle`)
      continue
    }

    const result = await enqueueClientCollection(supabase, {
      clientId:  client.id,
      force:     true,            // scheduled refresh = automated Force Refresh
      trigger:   'scheduled',
      createdBy: null,
    })

    // Stamp last_refresh_at for any non-budget outcome (enqueued OR nothing to do)
    // so we don't re-check this client every hour until its cadence elapses again.
    await supabase.from('clients').update({ last_refresh_at: new Date().toISOString() }).eq('id', client.id)

    if (result.skipped) {
      skippedNoWork++
      console.log(`[Scheduler/${invId}] client ${client.id} nothing enqueued: ${result.reason}`)
    } else {
      enqueued++
      totalJobs += result.totalJobs
      console.log(`[Scheduler/${invId}] client ${client.id} run ${result.runId} — ${result.totalJobs} jobs`)
    }
  }

  if (totalJobs > 0) await triggerWorker()

  console.log(`[Scheduler/${invId}] done | enqueued:${enqueued} jobs:${totalJobs} skippedBudget:${skippedBudget} skippedNoWork:${skippedNoWork}`)
  await recordJobRun(supabase, true, { invId, enqueued, totalJobs, skippedBudget, skippedNoWork })
  return { statusCode: 200, body: JSON.stringify({ enqueued, totalJobs, skippedBudget, skippedNoWork }) }
}
