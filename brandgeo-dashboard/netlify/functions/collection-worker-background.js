/**
 * collection-worker-background.js  (SCALE-SPEC.md §3.3)
 *
 * Netlify Background Function — the `-background` filename suffix makes Netlify
 * run this asynchronously for up to 15 minutes (no netlify.toml timeout entry;
 * same mechanism as run-full-audit-background.js). This is what moves collection
 * OFF the user's browser tab: the tab enqueues jobs and closes; this worker does
 * the actual engine calls server-side.
 *
 * Flow:
 *   1. Claim a batch of pending collection_jobs via claim_collection_jobs()
 *      (FOR UPDATE SKIP LOCKED) — so two overlapping worker invocations never
 *      grab the same job, which is what makes self-chaining safe.
 *   2. Run each claimed job (its prompt across its engines) via _collect.js, the
 *      SAME code the HTTP endpoints use.
 *   3. Upsert ai_results (+ cost_eur + run_id), deduped on (run_id, prompt_id, llm)
 *      so a retried job never double-writes.
 *   4. Mark the job done (or retry/failed).
 *   5. Loop until the queue is drained or the time budget is near; if pending work
 *      remains, self-chain (fire-and-forget POST to this same function).
 *
 * Triggered by schedule-collections.js (hourly) and by enqueue-collection.js
 * (right after a manual "Run collection"), plus self-chaining. Not a public
 * endpoint in intent — gated by the shared internal key (INTERNAL_AUDIT_KEY,
 * the same secret run-full-audit-background.js already uses).
 */

const { createClient } = require('@supabase/supabase-js')
const { collectEngines } = require('./_collect')

const BATCH_SIZE     = 5                  // in-flight prompts per claim (SCALE-SPEC §3.3)
const TIME_BUDGET_MS = 13 * 60 * 1000     // stop before Netlify's 15-min hard limit, leave room to self-chain
const MAX_ATTEMPTS   = 3                   // per job, before it's marked failed

function checkInternalKey(event) {
  const configured = process.env.INTERNAL_AUDIT_KEY
  if (!configured) {
    console.warn('[Worker] INTERNAL_AUDIT_KEY not set — accepting unauthenticated trigger. Set this env var in Netlify.')
    return true
  }
  const provided = event.headers['x-internal-key'] || event.headers['X-Internal-Key']
  return provided === configured
}

async function processJob(supabase, job, invId) {
  const nowIso = () => new Date().toISOString()
  try {
    const engines = Array.isArray(job.engines) ? job.engines : []
    if (engines.length === 0) {
      await supabase.from('collection_jobs')
        .update({ status: 'done', finished_at: nowIso(), error: 'no engines' })
        .eq('id', job.id)
      return { id: job.id, status: 'done', rows: 0 }
    }

    const { rows, summary } = await collectEngines(engines, {
      prompt_id:     job.prompt_id,
      prompt_text:   job.prompt_text,
      client_id:     job.client_id,
      client_config: job.client_config,
      market_label:  job.market_label,
      region_label:  job.region_label,
      market_id:     job.market_id,
      run_id:        job.run_id,
      worker:        true,   // generous per-engine timeouts (15-min budget) — CLAUDE.md §12.6
    })

    if (rows.length > 0) {
      // Dedup on (run_id, prompt_id, llm): a retried job that already wrote some
      // rows won't double-write. run_id is always set here (worker path), so the
      // conflict target is always live.
      const { error: upErr } = await supabase
        .from('ai_results')
        .upsert(rows, { onConflict: 'run_id,prompt_id,llm', ignoreDuplicates: true })
      if (upErr) throw new Error(`upsert failed: ${upErr.message}`)
    }

    await supabase.from('collection_jobs')
      .update({ status: 'done', finished_at: nowIso(), error: null })
      .eq('id', job.id)

    console.log(`[Worker/${invId}] job ${job.id} done | client ${job.client_id} prompt ${job.prompt_id} | ` +
      Object.entries(summary).map(([e, s]) => `${e}=${s}`).join(' '))
    return { id: job.id, status: 'done', rows: rows.length }
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).slice(0, 500)
    // claim_collection_jobs already incremented attempts, so job.attempts is the
    // count INCLUDING this run. Retry until MAX_ATTEMPTS, then give up.
    if ((job.attempts || 0) >= MAX_ATTEMPTS) {
      await supabase.from('collection_jobs')
        .update({ status: 'failed', finished_at: nowIso(), error: msg })
        .eq('id', job.id)
      console.error(`[Worker/${invId}] job ${job.id} FAILED after ${job.attempts} attempts: ${msg}`)
      return { id: job.id, status: 'failed' }
    }
    // Requeue for another pass (a small delay avoids an instant hot-retry loop).
    const retryAt = new Date(Date.now() + 60_000).toISOString()
    await supabase.from('collection_jobs')
      .update({ status: 'pending', scheduled_for: retryAt, error: msg })
      .eq('id', job.id)
    console.warn(`[Worker/${invId}] job ${job.id} error (attempt ${job.attempts}), requeued: ${msg}`)
    return { id: job.id, status: 'retry' }
  }
}

async function selfChain() {
  try {
    const base = process.env.URL || 'https://app.getbrandgeo.com'
    await fetch(`${base}/.netlify/functions/collection-worker-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_AUDIT_KEY || '' },
      body: '{}',
    })
  } catch (e) {
    console.error('[Worker] self-chain trigger failed:', e.message)
  }
}

exports.handler = async (event) => {
  if (!checkInternalKey(event)) {
    console.warn('[Worker] rejected — bad or missing X-Internal-Key')
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()
  const deadline = Date.now() + TIME_BUDGET_MS

  let totalProcessed = 0
  let batches = 0

  while (Date.now() < deadline) {
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_collection_jobs', { batch_size: BATCH_SIZE })
    if (claimErr) {
      console.error(`[Worker/${invId}] claim failed:`, claimErr.message)
      break
    }
    if (!claimed || claimed.length === 0) break   // queue drained

    batches++
    await Promise.all(claimed.map(job => processJob(supabase, job, invId)))
    totalProcessed += claimed.length
  }

  // If work is still pending (we hit the time budget, or new jobs arrived while
  // running), hand off to a fresh invocation. SKIP LOCKED makes an overlap safe.
  let pending = 0
  const { count } = await supabase
    .from('collection_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
  pending = count || 0

  if (pending > 0) {
    console.log(`[Worker/${invId}] processed ${totalProcessed} in ${batches} batch(es); ${pending} still pending — self-chaining`)
    await selfChain()
  } else {
    console.log(`[Worker/${invId}] processed ${totalProcessed} in ${batches} batch(es); queue drained`)
  }

  return { statusCode: 200, body: JSON.stringify({ processed: totalProcessed, batches, pending }) }
}
