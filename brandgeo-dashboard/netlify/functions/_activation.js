/**
 * _activation.js
 * First-run activation for a self-serve account: seed the client's prompts,
 * then enqueue their first collection.
 *
 * WHY THIS EXISTS. Two provisioning paths create a client, and until now only
 * one of them made the product show anything:
 *
 *   /onboard  (admin wizard)  -> collects prompts in step 4, then runs the first
 *                               collection through collectionContext. Works.
 *   /welcome  (self-serve)    -> provision-account.js created the clients row and
 *                               the user_profiles row and stopped. Zero prompts,
 *                               zero collection runs, so the customer landed on
 *                               an Overview that correctly said "Not measured
 *                               yet" and pointed them at /prompts to write buyer
 *                               questions themselves.
 *
 * The self-serve customer is the one who paid without a human in the loop, so
 * they were getting the worse of the two onboardings. This module closes that,
 * and it is deliberately a separate file rather than more code inside
 * provision-account.js: the seeding rules are worth testing on their own, and
 * the activation itself runs in a background function (see the timing note
 * below) so it cannot be inlined there anyway.
 *
 * WHERE THE PROMPTS COME FROM, in priority order:
 *
 *   1. The domain's own free public audit. Before signing up, most of these
 *      visitors typed their domain into the widget on getbrandgeo.com and
 *      watched a real score come back. audit-domain.js generated 6 buyer
 *      prompts for that domain and stored them on prospect_audits.
 *      getOrGenerateAuditPrompts() reuses the earliest such set for a domain,
 *      which is exactly what we want: the customer's dashboard then measures
 *      the same questions their public report measured, rather than a second,
 *      different set that would make the two numbers disagree for no reason
 *      the customer can see.
 *   2. No prior audit for that domain -> the same function generates a set,
 *      one gpt-4o-mini call grounded in a homepage fetch. Same generator the
 *      free audit uses, so a customer who never ran the public audit gets
 *      prompts of the same quality.
 *   3. No domain at all (a personal brand that supplied no link) -> nothing is
 *      seeded. There is no honest way to guess what a named person sells, and a
 *      wrong prompt set is worse than the empty state, which at least tells
 *      them what to do. This is stated rather than silently skipped, see
 *      reason: 'no_domain'.
 *
 * TIMING. Step 2 costs a homepage fetch (6s ceiling) plus an LLM call, and
 * provision-account.js runs on a 15s budget with a customer watching a spinner.
 * So activation is fired at activate-client-background.js, a Netlify Background
 * Function, and provisioning returns immediately. Activation failing must never
 * fail provisioning: the customer still has a working account, it is just as
 * empty as it was before this file existed.
 *
 * EVERY STEP IS IDEMPOTENT. Seeding refuses if the client already has a prompt;
 * collection refuses if the client already has an ai_results row. So a retried
 * or duplicated trigger cannot double-seed or double-spend.
 */

// The cap the database's own trigger applies to a plan it does not recognise
// (enforce_prompt_cap() in db/supabase-prompt-cap-migration.sql falls back to
// the free cap). Used here ONLY when the plan_prompt_caps read fails, so a
// broken read under-seeds rather than seeding past a cap. Deliberately NOT a
// copy of the plan ladder: planConfig.ts already warns that five copies exist,
// and a sixth that only ever matters on a failed read is not worth having.
const FALLBACK_PROMPT_CAP = 5

// A seeded prompt shorter than this is not a buyer question. Guards against a
// generator returning a stray fragment; nothing in production has, but the
// insert is unattended so it is checked rather than assumed.
const MIN_PROMPT_CHARS = 8
const MAX_PROMPT_CHARS = 300

// Below this length an alias is too short to test for safely: "it", "go" and
// the like match inside ordinary words and every English sentence, so a
// filter built on them would reject every prompt. Mirrors the reasoning
// behind GENERIC_LEAD_WORDS in _prospect_prompts.js without duplicating it.
const MIN_ALIAS_CHARS = 4

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * dropBrandNamingPrompts(texts, aliases) -> { kept, dropped }
 *
 * A prompt that names the brand guarantees a mention and measures nothing.
 * Both generators are instructed never to do it (_prospect_prompts.js's system
 * prompt, suggest-prompts.js rule 4), and the 2026-07-29 audit found one
 * paying account whose entire score came from a single prompt that did. This
 * is the net under that instruction, for a seeding path with no human review.
 *
 * WHY IT CAN GIVE UP. An alias list is brand data, not a curated stopword
 * list: a client called "Case Tempo" carries the alias "Case", and a filter
 * built on it would reject every prompt about legal software. So the caller
 * treats an empty `kept` as "this filter is wrong about this brand" and seeds
 * the unfiltered set (see seedInitialPrompts). The filter can then only ever
 * remove a genuinely brand-naming prompt from a set that has others; it can
 * never turn a working seed into an empty dashboard, which is the failure this
 * whole module exists to end.
 */
function dropBrandNamingPrompts(texts, aliases) {
  const tokens = (Array.isArray(aliases) ? aliases : [])
    .map((a) => String(a || '').trim())
    .filter((a) => a.length >= MIN_ALIAS_CHARS)
  if (tokens.length === 0) return { kept: texts.slice(), dropped: [] }

  const re = new RegExp(`\\b(?:${tokens.map(escapeRegex).join('|')})\\b`, 'i')
  const kept = []
  const dropped = []
  for (const t of texts) (re.test(t) ? dropped : kept).push(t)
  return { kept, dropped }
}

/**
 * normalizeSeedPrompts(raw, { cap, brandAliases }) -> string[]
 *
 * Pure. Trim, bound, de-duplicate case-insensitively, drop brand-naming
 * prompts (unless that would drop everything), then cap. The cap matters:
 * plan_prompt_caps is enforced by a database trigger that service_role
 * BYPASSES, so a service-key insert can silently put a free client at 6 of 5
 * prompts, where the Prompts page then refuses to let them add one and shows a
 * number over its own limit. The audit generates exactly 6 and free allows 5,
 * so this is the normal case, not an edge one.
 */
function normalizeSeedPrompts(raw, { cap, brandAliases } = {}) {
  const seen = new Set()
  const cleaned = []
  for (const item of Array.isArray(raw) ? raw : []) {
    const text = String(typeof item === 'string' ? item : (item && item.text) || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_PROMPT_CHARS)
    if (text.length < MIN_PROMPT_CHARS) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    cleaned.push(text)
  }

  const { kept } = dropBrandNamingPrompts(cleaned, brandAliases)
  const usable = kept.length > 0 ? kept : cleaned

  const limit = Number.isInteger(cap) && cap > 0 ? cap : usable.length
  return usable.slice(0, limit)
}

/**
 * promptCapFor(supabase, plan) -> number
 *
 * Reads the enforced copy of the ladder (public.plan_prompt_caps), never a
 * constant in this repo. A missing row or a failed read falls back to
 * FALLBACK_PROMPT_CAP, matching what the database trigger itself does for a
 * plan it does not know.
 */
async function promptCapFor(supabase, plan) {
  try {
    const { data, error } = await supabase
      .from('plan_prompt_caps')
      .select('prompt_cap')
      .eq('plan', plan)
      .maybeSingle()
    if (error) {
      console.warn(`[Activate] plan_prompt_caps read failed (${error.message}); capping at ${FALLBACK_PROMPT_CAP}`)
      return FALLBACK_PROMPT_CAP
    }
    const cap = data && Number(data.prompt_cap)
    return Number.isInteger(cap) && cap > 0 ? cap : FALLBACK_PROMPT_CAP
  } catch (e) {
    console.warn(`[Activate] plan_prompt_caps read threw (${e.message}); capping at ${FALLBACK_PROMPT_CAP}`)
    return FALLBACK_PROMPT_CAP
  }
}

/**
 * seedInitialPrompts(supabase, opts, deps)
 *   -> { seeded, source, reason?, prompts }
 *
 * opts: { clientId, plan, domain, brandAliases }
 * deps: { getPrompts } defaults to getOrGenerateAuditPrompts. It is injected so the
 *       test can exercise the seeding rules without a network or an API key.
 *
 * source is 'audit' when the prompts came from this domain's existing public
 * audit and 'generated' when they were made now. It is reported, logged and
 * written onto the client_events row, because "did the customer's dashboard
 * inherit their public report's questions" is the one thing about this path
 * that is worth being able to answer later from the database.
 */
async function seedInitialPrompts(supabase, { clientId, plan, domain, brandAliases }, deps = {}) {
  const none = (reason) => ({ seeded: 0, source: null, reason, prompts: [] })

  // Idempotency, and the reason a retry is safe. `head: true` so this costs a
  // count and not a row read.
  const { count: existing, error: countErr } = await supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
  if (countErr) return none(`prompt_count_failed: ${countErr.message}`)
  if ((existing || 0) > 0) return none('prompts_exist')

  if (!domain) return none('no_domain')

  const getPrompts = deps.getPrompts
    || ((sb, d) => require('./_prospect_prompts').getOrGenerateAuditPrompts(sb, d))

  let generated
  try {
    generated = await getPrompts(supabase, domain)
  } catch (e) {
    return none(`prompt_generation_failed: ${e.message}`)
  }

  const cap = await promptCapFor(supabase, plan)
  const texts = normalizeSeedPrompts(generated && generated.prompts, { cap, brandAliases })
  if (texts.length === 0) return none('no_usable_prompts')

  // One INSERT statement, so it is atomic on its own, the same reasoning
  // onboard-client.js states for its own prompt seeding.
  const rows = texts.map((text, idx) => ({
    client_id: clientId,
    text,
    // The audit's own `category` describes the BUSINESS ("email marketing
    // software"), not the prompt. prompts.category is a different vocabulary
    // that the Prompts page filters on, so seeded rows land on 'general',
    // exactly as the admin wizard's do.
    category: 'general',
    is_active: true,
    position: idx + 1,
  }))

  const { error: insErr } = await supabase.from('prompts').insert(rows)
  if (insErr) return none(`prompt_insert_failed: ${insErr.message}`)

  return {
    seeded: rows.length,
    source: generated && generated.reused ? 'audit' : 'generated',
    prompts: texts,
  }
}

/**
 * activateClient(supabase, opts, deps) -> summary object
 *
 * opts: { clientId, plan, domain, brandAliases, createdBy }
 *
 * Seeds prompts, then enqueues the first collection. Never throws: every
 * outcome is a field on the returned summary, because the only caller is a
 * background function whose return value nobody reads and whose failure must
 * stay invisible to the customer's already-working account.
 */
async function activateClient(supabase, { clientId, plan, domain, brandAliases, createdBy }, deps = {}) {
  const summary = { client_id: clientId, seeded: 0, source: null, seed_reason: null, run_id: null, jobs: 0, collection_reason: null }

  const seed = await seedInitialPrompts(supabase, { clientId, plan, domain, brandAliases }, deps)
  summary.seeded = seed.seeded
  summary.source = seed.source
  summary.seed_reason = seed.reason || null

  // Collect only for a client that has never been measured. Combined with the
  // seeding guard above this makes the whole function replayable: a second
  // trigger for the same client seeds nothing and spends nothing.
  const { count: priorRows, error: rowsErr } = await supabase
    .from('ai_results')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
  if (rowsErr) { summary.collection_reason = `results_count_failed: ${rowsErr.message}`; return summary }
  if ((priorRows || 0) > 0) { summary.collection_reason = 'already_collected'; return summary }

  const { checkCollectionLimits } = deps.auth || require('./_auth')
  const limits = await checkCollectionLimits(supabase, clientId)
  if (limits.blocked) { summary.collection_reason = `blocked: ${limits.reason}`; return summary }

  const { enqueueClientCollection, triggerWorker } = deps.enqueue || require('./_enqueue')

  const result = await enqueueClientCollection(supabase, {
    clientId,
    // Not force: on a client with no ai_results at all these are the same set
    // of jobs, and the non-force branch cannot delete anything.
    force: false,
    // A THIRD trigger value, alongside 'manual' and 'scheduled'. The column is
    // plain text with no CHECK, and the distinction earns its keep twice:
    //   - checkCollectionCooldown() and AIVisibility.tsx's countdown both read
    //     trigger = 'manual'. Free's cooldown is 720h, so labelling the signup
    //     run 'manual' would spend the customer's one manual refresh before
    //     they had seen the dashboard, and lock the button for a month.
    //   - _enqueue.js's replaceExisting defaults to `force && trigger ===
    //     'manual'`, so this run can never be the destructive kind.
    trigger: 'signup',
    createdBy: createdBy || null,
    // Geo resolves from the client's default_market_id ('WW' for a self-serve
    // account), the same way a scheduled run does.
    market: null,
    activeEngines: null,
  })

  if (result.skipped) { summary.collection_reason = result.reason || 'skipped'; return summary }

  summary.run_id = result.runId
  summary.jobs = result.totalJobs

  // Start the worker now rather than waiting for the hourly cron, so the
  // customer's first results land while they are still looking at the tab.
  await triggerWorker()
  return summary
}

module.exports = {
  activateClient,
  seedInitialPrompts,
  normalizeSeedPrompts,
  dropBrandNamingPrompts,
  promptCapFor,
  FALLBACK_PROMPT_CAP,
  MIN_PROMPT_CHARS,
  MAX_PROMPT_CHARS,
}
