/**
 * schedule-collections.js  (SCALE-SPEC.md §3.3)
 *
 * Hourly cron job. For every client whose refresh_cadence is due, checks budget
 * and enqueues a fresh collection run, then kicks the worker once. This is what
 * turns "every refresh cadence on the pricing page is a human clicking Force
 * Refresh" into something that happens on its own.
 *
 * A SCHEDULED REFRESH IS NOT A FORCE REFRESH, corrected 2026-08-14. It collects
 * the same breadth as one, but it ADDS to the client's history instead of
 * replacing it. See the enqueueClientCollection call below and the two-decisions
 * block at the top of _enqueue.js. The earlier wording here and in that file
 * ("scheduled refresh = automated Force Refresh") described the defect, not an
 * intent: it made every cycle delete the trend the paid tiers are sold on.
 *
 * Auth: X-Cron-Key shared secret (_cron_auth.js). Invoked by Supabase pg_cron
 * over pg_net at :10 past every hour (db/supabase-scheduled-jobs-migration.sql).
 * It previously took no auth at all while being URL-routable, which made it an
 * unauthenticated way to enqueue work that spends LLM budget - the sharper half
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
 * is deliberate - see the migration note (avoids surprise-spending every existing
 * client the moment this ships).
 *
 * WHAT CHANGED 2026-07-31, and what did NOT. The column now gets written: every
 * path that establishes a plan (provision-account, onboard-client,
 * stripe-webhook, set-client-plan, expire-plan-grants) writes refresh_cadence
 * derived from the tier via refreshCadenceFor() in _cost.js. So the safe default
 * above still holds for every row that already existed - no backfill was run and
 * all 36 production clients remain 'manual' - but a NEW client, or one whose plan
 * changes, arrives here with a real cadence. This function is unchanged apart
 * from the research guard below; the budget gate at line ~100 is what keeps that
 * safe, and it is checked before anything is enqueued.
 */

const { createClient } = require('@supabase/supabase-js')
const { checkCollectionLimits } = require('./_auth')
const { enqueueClientCollection, triggerWorker } = require('./_enqueue')
const { requireCronAuth } = require('./_cron_auth')
const { RESEARCH_CATEGORY } = require('./_cost')

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

// ── WORKER KICK FOR DUE PENDING JOBS (ruling 2 of 2026-11-09) ───────────────
// F2 of docs/qa/phase2-server-review-2026-11-08.md. The worker used to be
// started here only when THIS run enqueued work. A job left 'pending' and due
// by anything else (the stuck-job reaper's requeue, which sets
// scheduled_for = now(); the worker's own retry at now + 60 s on its last
// batch, which its self-chain does not count) waited for the next manual
// enqueue, so its run never closed and the dashboard poll spun. Now every
// hourly run reads whether ANY pending job is due and starts the worker if so.
//
// Once per run: the trigger fires at most once whether the reason is new work,
// due leftovers, or both. Best effort: a failed read or a failed trigger is
// logged and recorded in job_runs.detail, never thrown, so the scheduling work
// above it is never reported as failed because of it. Reuses triggerWorker
// from _enqueue.js (the same call enqueue-collection.js makes), so the key
// handling lives in one place. No new secret, zero model calls; one read on
// the partial index idx_collection_jobs_claim (status, scheduled_for) where
// status = 'pending'. A redundant trigger is harmless: the worker claims with
// SKIP LOCKED and exits when there is nothing to claim.
async function hasDuePendingJobs(supabase, nowIso) {
  const { data, error } = await supabase
    .from('collection_jobs')
    .select('id')
    .eq('status', 'pending')
    .lte('scheduled_for', nowIso)
    .limit(1)
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

async function kickWorkerIfNeeded(supabase, { totalJobs, invId, trigger = triggerWorker, now = () => new Date() }) {
  let duePending = null
  try {
    duePending = await hasDuePendingJobs(supabase, now().toISOString())
  } catch (err) {
    console.error(`[Scheduler/${invId}] due pending jobs read failed:`, err && err.message)
  }

  const reason = totalJobs > 0 ? 'enqueued' : (duePending ? 'due_pending' : null)
  if (!reason) return { triggered: false, reason: null, duePending }

  try {
    await trigger()
    console.log(`[Scheduler/${invId}] worker triggered (${reason})`)
    return { triggered: true, reason, duePending }
  } catch (err) {
    console.error(`[Scheduler/${invId}] worker trigger failed (${reason}):`, err && err.message)
    return { triggered: false, reason, duePending, error: (err && err.message) || String(err) }
  }
}

exports.handler = async (event) => {
  const gate = requireCronAuth(event)
  if (gate) return gate.response

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  // Only clients that have opted into a cadence.
  //
  // ── SECOND, INDEPENDENT RESEARCH GUARD. DO NOT REMOVE AS A TIDY-UP. ────────
  // refreshCadenceFor() in _cost.js already refuses to WRITE a cadence for a
  // research client. This refuses to ACT on one, whatever the column says, which
  // covers every route the first guard cannot see: a hand-run UPDATE, a restored
  // backup, a client provisioned as 'active' and re-categorised later, or a
  // future sixth plan-writing path that forgets to call the helper.
  //
  // WHAT IT PROTECTS, measured 2026-07-31: 27 of the 36 clients in production are
  // BrandGEO's own city-research studies and ALL 27 sit on plan 'pro', whose
  // per-client monthly budget ceiling is EUR 225. Acting on them automatically
  // would switch on EUR 6,075 a month of ceiling for rows that are not customers
  // and do not pay, and about EUR 171 a month of real modelled spend at their
  // current 176 active prompts. They are collected when a study is deliberately
  // run, and never otherwise. It is one .neq() against the largest single cost
  // exposure this function has.
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, refresh_cadence, last_refresh_at')
    .in('refresh_cadence', Object.keys(CADENCE_DAYS))
    .neq('category', RESEARCH_CATEGORY)
  if (error) {
    console.error(`[Scheduler/${invId}] client load failed:`, error.message)
    await recordJobRun(supabase, false, { invId, error: error.message })
    return { statusCode: 500, body: error.message }
  }

  let enqueued = 0, skippedBudget = 0, skippedNoWork = 0, skippedTransient = 0, totalJobs = 0

  for (const client of (clients || [])) {
    if (!isDue(client.refresh_cadence, client.last_refresh_at)) continue

    // Budget gate - if the client is over its monthly budget / hourly ceiling, or
    // the platform is over its ceiling, skip WITHOUT stamping last_refresh_at so
    // it's retried next hour once budget frees up.
    const limit = await checkCollectionLimits(supabase, client.id)
    if (limit.blocked) {
      skippedBudget++
      console.warn(`[Scheduler/${invId}] client ${client.id} (${client.name}) over ${limit.reason} - skipping this cycle`)
      continue
    }

    const result = await enqueueClientCollection(supabase, {
      clientId:  client.id,
      // force = COLLECT EVERYTHING. Required, and not interchangeable with
      // force:false: the non-force path skips any (prompt, engine) already
      // collected OK this calendar month, so a weekly run would find everything
      // done and collect nothing from the second week of every month onward.
      // Weekly refresh would silently stop working rather than fail.
      force:     true,
      // replaceExisting = DO NOT DELETE WHAT IS ALREADY THERE. This is the whole
      // fix. Until 2026-08-14 `force: true` also triggered an unfiltered DELETE
      // of every prior ai_results row for these prompts and engines, so each
      // scheduled cycle wiped the client's entire history and the trend the paid
      // tiers are sold on could never accumulate. It is passed explicitly even
      // though _enqueue.js now defaults scheduled triggers to false, so the
      // intent is legible at the call site and a future refactor of that default
      // cannot quietly re-arm the delete here.
      replaceExisting: false,
      trigger:   'scheduled',
      createdBy: null,
    })

    // A transient refusal (a read failed, see _enqueue.js) is treated like the
    // budget skip: NOT stamped, so the next hourly run retries this client
    // instead of it losing a whole cycle. L1 of
    // docs/qa/multi-location-review-server-2026-11-13.md.
    if (result.skipped && result.transient) {
      skippedTransient++
      console.warn(`[Scheduler/${invId}] client ${client.id} (${client.name}) refused for a transient reason (${result.reason}), not stamped, retried next hour`)
      continue
    }

    // Stamp last_refresh_at for any other outcome (enqueued OR nothing to do)
    // so we don't re-check this client every hour until its cadence elapses again.
    await supabase.from('clients').update({ last_refresh_at: new Date().toISOString() }).eq('id', client.id)

    if (result.skipped) {
      skippedNoWork++
      console.log(`[Scheduler/${invId}] client ${client.id} nothing enqueued: ${result.reason}`)
    } else {
      enqueued++
      totalJobs += result.totalJobs
      console.log(`[Scheduler/${invId}] client ${client.id} run ${result.runId} - ${result.totalJobs} jobs`)
    }
  }

  // After the cadence work, once per run: new work OR any due pending job
  // starts the worker (see kickWorkerIfNeeded above). Never throws.
  const kick = await kickWorkerIfNeeded(supabase, { totalJobs, invId })
  const worker = { triggered: kick.triggered, reason: kick.reason, duePending: kick.duePending }
  if (kick.error) worker.error = kick.error

  console.log(`[Scheduler/${invId}] done | enqueued:${enqueued} jobs:${totalJobs} skippedBudget:${skippedBudget} skippedNoWork:${skippedNoWork} skippedTransient:${skippedTransient} worker:${kick.triggered ? kick.reason : 'no'}`)
  await recordJobRun(supabase, true, { invId, enqueued, totalJobs, skippedBudget, skippedNoWork, skippedTransient, worker })
  return { statusCode: 200, body: JSON.stringify({ enqueued, totalJobs, skippedBudget, skippedNoWork, skippedTransient, workerTriggered: kick.triggered }) }
}

exports.kickWorkerIfNeeded = kickWorkerIfNeeded
exports.hasDuePendingJobs = hasDuePendingJobs
