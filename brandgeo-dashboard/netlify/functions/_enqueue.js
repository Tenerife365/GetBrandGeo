/**
 * _enqueue.js — shared "build a collection run + its jobs for one client"
 * helper (SCALE-SPEC.md §3). Used by BOTH enqueue-collection.js (manual "Run
 * collection" from the browser) and schedule-collections.js (the hourly cron),
 * so the job-building rules live in exactly one place.
 *
 * A run = one collection_runs row + N collection_jobs rows (one job per active
 * prompt, each carrying the engine set to run for that prompt). The worker then
 * drains the jobs. Nothing here calls an engine — it only reads state and writes
 * the queue.
 *
 * force / skip semantics, matching the old browser loop exactly:
 *   - force = true  (manual "Force Refresh", and every scheduled refresh):
 *       delete existing ai_results for (client, prompts, engines), then enqueue
 *       every active prompt across all active engines. This is the automated
 *       equivalent of a human clicking Force Refresh — which is precisely the
 *       button SCALE-SPEC §3 says the scheduler replaces.
 *   - force = false (manual "Run collection"):
 *       enqueue only the engines NOT already collected OK this calendar month,
 *       per prompt; skip prompts that are already complete. No delete.
 *
 * TREND-HISTORY NOTE (flagged, deliberate): scheduled runs delete+recollect like
 * a Force Refresh, so they do not accumulate a per-cycle trend history yet.
 * Preserving history across refresh cycles is a follow-up tied to fixing §14.6's
 * cross-run aggregation (some dashboard reads aggregate ALL rows, not
 * newest-per-(prompt,engine)); doing it now would inflate those aggregates.
 */

const { activeEnginesFor } = require('./_cost')

// ISO 3166-1 alpha-2 → country name, for scheduled runs that resolve geo from
// the client's default_market_id (manual runs pass full labels from the browser).
// Covers the markets seeded in marketContext.tsx; anything unmapped (incl. 'WW')
// yields no label, and buildSystemContext falls back to brand_website TLD.
const COUNTRY_NAMES = {
  RO: 'Romania', GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France',
  ES: 'Spain', IT: 'Italy', US: 'United States', NL: 'Netherlands', PL: 'Poland',
  AU: 'Australia', CA: 'Canada', PT: 'Portugal', BE: 'Belgium', CH: 'Switzerland',
  AT: 'Austria', HU: 'Hungary', CZ: 'Czechia', SE: 'Sweden', DK: 'Denmark', FI: 'Finland',
}

function monthStartIso() {
  const d = new Date()
  d.setDate(1); d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * enqueueClientCollection(supabase, opts) -> { runId, totalJobs, skipped, reason? }
 *
 * opts:
 *   clientId      (int, required)
 *   force         (bool)                       — see force/skip semantics above
 *   trigger       ('manual' | 'scheduled')
 *   createdBy     (uuid | null)                — auth.users.id for manual; null for cron
 *   market        ({ market_id, market_label, region_label } | null)
 *                                              — explicit geo (manual); null → resolve from client default
 *   activeEngines (string[] | null)            — explicit engine set (manual); null → derive from plan
 */
async function enqueueClientCollection(supabase, {
  clientId, force = false, trigger = 'manual', createdBy = null, market = null, activeEngines = null,
}) {
  // 1. Client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, plan, engines_enabled, brand_aliases, brand_website, known_competitors, default_market_id, default_region_id')
    .eq('id', clientId)
    .single()
  if (!client) return { runId: null, totalJobs: 0, skipped: true, reason: 'client not found' }

  // 2. Engines
  const engines = Array.isArray(activeEngines) && activeEngines.length > 0
    ? activeEngines
    : activeEnginesFor(client.plan, client.engines_enabled)
  if (!engines || engines.length === 0)
    return { runId: null, totalJobs: 0, skipped: true, reason: 'no active engines' }

  // 3. Active prompts
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, text')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('position')
  if (!prompts || prompts.length === 0)
    return { runId: null, totalJobs: 0, skipped: true, reason: 'no active prompts' }

  const clientConfig = {
    brand_aliases:     client.brand_aliases     ?? [],
    brand_website:     client.brand_website     ?? '',
    known_competitors: client.known_competitors ?? [],
  }

  // 4. Geo — explicit (manual) or resolved from the client default (scheduled)
  let market_id, market_label, region_label
  if (market) {
    market_id    = market.market_id ?? null
    market_label = market.market_label ?? null
    region_label = market.region_label ?? null
  } else {
    market_id    = client.default_market_id ?? null
    market_label = market_id ? (COUNTRY_NAMES[market_id] ?? null) : null
    region_label = null   // country-level for scheduled runs; region is a manual refinement
  }

  // 5. Decide each prompt's engine subset (force vs skip)
  const promptIds = prompts.map(p => p.id)
  let perPromptEngines  // Map<prompt_id, string[]>

  if (force) {
    // Delete existing rows for the engines we're about to re-run, then enqueue all.
    const { error: delErr } = await supabase
      .from('ai_results')
      .delete()
      .eq('client_id', clientId)
      .in('prompt_id', promptIds)
      .in('llm', engines)
    if (delErr) console.error('[Enqueue] force-delete failed:', delErr.message)
    perPromptEngines = new Map(prompts.map(p => [p.id, engines.slice()]))
  } else {
    // Skip (prompt, engine) pairs already collected OK this month.
    const { data: existing } = await supabase
      .from('ai_results')
      .select('prompt_id, llm')
      .eq('client_id', clientId)
      .in('prompt_id', promptIds)
      .neq('status', 'error')
      .gte('checked_at', monthStartIso())
    const doneSet = new Set((existing || []).map(r => `${r.prompt_id}:${r.llm}`))
    perPromptEngines = new Map()
    for (const p of prompts) {
      const remaining = engines.filter(e => !doneSet.has(`${p.id}:${e}`))
      if (remaining.length > 0) perPromptEngines.set(p.id, remaining)
    }
  }

  const promptById = new Map(prompts.map(p => [p.id, p]))
  const jobPrompts = [...perPromptEngines.keys()]
  if (jobPrompts.length === 0)
    return { runId: null, totalJobs: 0, skipped: true, reason: 'nothing to collect (all done this month)' }

  // 6. Create the run
  const { data: run, error: runErr } = await supabase
    .from('collection_runs')
    .insert([{ client_id: clientId, trigger, force, total_jobs: jobPrompts.length, created_by: createdBy }])
    .select('id')
    .single()
  if (runErr || !run) return { runId: null, totalJobs: 0, skipped: true, reason: `run insert failed: ${runErr?.message}` }

  // 7. Insert the jobs
  const jobRows = jobPrompts.map(pid => ({
    run_id:        run.id,
    client_id:     clientId,
    prompt_id:     pid,
    prompt_text:   promptById.get(pid).text,
    client_config: clientConfig,
    market_id,
    market_label,
    region_label,
    engines:       perPromptEngines.get(pid),
  }))

  const { error: jobsErr } = await supabase.from('collection_jobs').insert(jobRows)
  if (jobsErr) {
    // Roll back the run so we don't leave an orphan claiming total_jobs it never got.
    await supabase.from('collection_runs').delete().eq('id', run.id)
    return { runId: null, totalJobs: 0, skipped: true, reason: `jobs insert failed: ${jobsErr.message}` }
  }

  return { runId: run.id, totalJobs: jobRows.length, skipped: false }
}

/**
 * triggerWorker() — fire-and-forget kick of collection-worker-background.js so a
 * freshly-enqueued run starts draining immediately instead of waiting for the
 * next hourly cron. Safe to over-call: SKIP LOCKED means a redundant invocation
 * just claims nothing and exits. Uses the shared internal key.
 */
async function triggerWorker() {
  try {
    const base = process.env.URL || 'https://app.getbrandgeo.com'
    await fetch(`${base}/.netlify/functions/collection-worker-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_AUDIT_KEY || '' },
      body: '{}',
    })
  } catch (e) {
    console.error('[Enqueue] triggerWorker failed:', e.message)
  }
}

module.exports = { enqueueClientCollection, triggerWorker, COUNTRY_NAMES }
