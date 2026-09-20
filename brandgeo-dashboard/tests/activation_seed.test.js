/**
 * activation_seed.test.js
 * Exercises _activation.js, the first-run activation for a self-serve account (seed prompts, then enqueue the first collection).
 * Run: `node tests/activation_seed.test.js`.
 *
 * WHY THIS EXISTS. This path runs unattended, for a customer nobody is watching,
 * and it both WRITES rows and SPENDS engine budget. The three things worth
 * proving are the three that would be invisible in production if they broke:
 *
 *   1. It reuses the prompts the domain's own free public audit generated, and
 *      says so (source: 'audit'), rather than quietly generating a second,
 *      different set that would make the customer's dashboard disagree with the
 *      public report they were sent.
 *   2. It never seeds past the plan's prompt cap. The database trigger that
 *      enforces that cap is BYPASSED by service_role, which is exactly what this
 *      code runs as, and the audit generates 6 prompts while Free allows 5. So
 *      the off-by-one here is the normal case, not an edge one, and nothing at
 *      the database would catch it.
 *   3. It is idempotent. A client that already has prompts is not re-seeded and
 *      a client that already has results is not re-collected, so a retried or
 *      duplicated trigger cannot double-spend.
 *
 * The fake Supabase below records every call and returns scripted results. It is
 * not a database and proves nothing about Postgres semantics, same disclaimer
 * and same shape as touches_record.test.js, which this borrows from. It has no
 * dependency on @supabase/supabase-js, so it runs in an environment with no
 * node_modules installed, which is why _activation.js requires _auth.js and
 * _enqueue.js lazily and accepts them as injected deps.
 */
const assert = require('assert')
const path = require('path')

const {
  activateClient, seedInitialPrompts, normalizeSeedPrompts, dropBrandNamingPrompts, promptCapFor,
} = require(path.join(__dirname, '..', 'netlify', 'functions', '_activation.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

/**
 * fakeSupabase(handler). handler(state, mode) -> { data, error, count }.
 * state carries { table, op, eq, in, rows, selectCols, selectOpts }.
 */
function fakeSupabase(handler) {
  const calls = []
  return {
    calls,
    from(table) {
      const st = { table, eq: [], in: [] }
      calls.push(st)
      const chain = {
        select(cols, opts) { st.op = st.op || 'select'; st.selectCols = cols; st.selectOpts = opts; return chain },
        insert(rows) { st.op = 'insert'; st.rows = rows; return chain },
        eq(k, v) { st.eq.push([k, v]); return chain },
        in(k, v) { st.in.push([k, v]); return chain },
        maybeSingle() { return Promise.resolve(handler(st, 'maybeSingle')) },
        single() { return Promise.resolve(handler(st, 'single')) },
        then(a, b) { return Promise.resolve(handler(st, 'many')).then(a, b) },
      }
      return chain
    },
  }
}

/** A backend where the client is empty and the cap is whatever is passed in. */
function emptyClientBackend({ cap = 5, promptCount = 0, resultCount = 0, insertError = null } = {}) {
  return (st) => {
    if (st.table === 'prompts' && st.op === 'select') return { data: null, error: null, count: promptCount }
    if (st.table === 'prompts' && st.op === 'insert') return { data: null, error: insertError }
    if (st.table === 'ai_results' && st.op === 'select') return { data: null, error: null, count: resultCount }
    if (st.table === 'plan_prompt_caps') return { data: cap === null ? null : { prompt_cap: cap }, error: null }
    if (st.table === 'client_events') return { data: null, error: null }
    throw new Error(`unexpected table ${st.table} op ${st.op}`)
  }
}

const AUDIT_SIX = [
  'best legal practice management software for small firms',
  'top case management tools for solo attorneys',
  'affordable billing software for law firms',
  'which legal CRM integrates with Outlook',
  'law firm document automation tools compared',
  'best client intake software for lawyers',
]

const auditPrompts = (prompts, reused) => async () => ({ prompts, reused, category: 'legal software' })

// ── 1. Pure helpers ───────────────────────────────────────────────────────────
section('normalizeSeedPrompts')
{
  const out = normalizeSeedPrompts(AUDIT_SIX, { cap: 5 })
  assert.strictEqual(out.length, 5, 'caps at 5')
  assert.deepStrictEqual(out, AUDIT_SIX.slice(0, 5), 'keeps the first five in order')
  ok('caps a 6-prompt audit set at the free plan cap of 5')

  assert.strictEqual(normalizeSeedPrompts(AUDIT_SIX, { cap: 35 }).length, 6, 'a higher cap keeps all six')
  ok('a cap above the set size keeps everything')

  const dupes = ['best crm for agencies', 'Best CRM For Agencies', '  best crm for agencies  ']
  assert.deepStrictEqual(normalizeSeedPrompts(dupes, { cap: 10 }), ['best crm for agencies'])
  ok('de-duplicates case-insensitively and trims')

  const junk = ['ok', '', '   ', null, undefined, 42, { text: 'best crm for agencies' }]
  assert.deepStrictEqual(normalizeSeedPrompts(junk, { cap: 10 }), ['best crm for agencies'])
  ok('drops fragments, blanks and non-strings, and accepts { text } objects')

  const long = 'x'.repeat(500)
  assert.strictEqual(normalizeSeedPrompts([long], { cap: 10 })[0].length, 300)
  ok('bounds a prompt at 300 characters')

  assert.deepStrictEqual(normalizeSeedPrompts([], { cap: 5 }), [])
  assert.deepStrictEqual(normalizeSeedPrompts(null, { cap: 5 }), [])
  ok('an empty or missing set yields nothing rather than throwing')
}

section('dropBrandNamingPrompts')
{
  const texts = ['best crm for agencies', 'is Acme Analytics any good', 'top reporting tools']
  const { kept, dropped } = dropBrandNamingPrompts(texts, ['Acme Analytics', 'Acme'])
  assert.deepStrictEqual(dropped, ['is Acme Analytics any good'])
  assert.strictEqual(kept.length, 2)
  ok('drops a prompt that names the brand, since it guarantees a mention')

  // The alias list is brand data, not a curated stopword list.
  const short = dropBrandNamingPrompts(['best go kart tracks near me'], ['go', 'it', 'my'])
  assert.strictEqual(short.kept.length, 1, 'aliases under 4 characters are not tested')
  ok('ignores aliases too short to test safely')

  const partial = dropBrandNamingPrompts(['best acmetech alternatives'], ['acme'])
  assert.strictEqual(partial.kept.length, 1, 'matches whole words only')
  ok('does not match an alias inside a longer word')

  const regexy = dropBrandNamingPrompts(['best c++ linters', 'best linters'], ['c++'])
  assert.strictEqual(regexy.kept.length, 2, 'regex metacharacters in an alias are escaped')
  ok('an alias containing regex metacharacters cannot break the filter')

  // A brand whose alias is an ordinary category word ("Case Tempo" -> "Case")
  // would otherwise reject every prompt in its own category.
  const all = normalizeSeedPrompts(
    ['best case management software', 'top case tracking tools'],
    { cap: 5, brandAliases: ['Case Tempo', 'Case'] },
  )
  assert.strictEqual(all.length, 2)
  ok('gives up rather than seeding nothing when the filter would drop every prompt')
}

// ── 2. Cap resolution and seeding ─────────────────────────────────────────────
;(async () => {
  section('promptCapFor')
  {
    const sb = fakeSupabase(emptyClientBackend({ cap: 35 }))
    assert.strictEqual(await promptCapFor(sb, 'growth'), 35)
    ok('reads the cap from plan_prompt_caps, the enforced copy of the ladder')

    const broken = fakeSupabase((st) => {
      if (st.table === 'plan_prompt_caps') return { data: null, error: { message: 'boom' } }
      throw new Error('unexpected')
    })
    assert.strictEqual(await promptCapFor(broken, 'growth'), 5,
      'a failed read under-seeds rather than over-seeding')
    ok('falls back to the free cap when plan_prompt_caps cannot be read')
  }

  section('seedInitialPrompts')
  {
    const sb = fakeSupabase(emptyClientBackend({ cap: 5 }))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: 'caselaw.example', brandAliases: ['Caselaw'] },
      { getPrompts: auditPrompts(AUDIT_SIX, true) },
    )
    assert.strictEqual(r.seeded, 5)
    assert.strictEqual(r.source, 'audit', 'a reused set is reported as coming from the audit')
    const insert = sb.calls.find(c => c.table === 'prompts' && c.op === 'insert')
    assert.ok(insert, 'it inserted')
    assert.strictEqual(insert.rows.length, 5, 'ONE insert statement carrying all five rows')
    assert.deepStrictEqual(insert.rows.map(x => x.position), [1, 2, 3, 4, 5])
    assert.ok(insert.rows.every(x => x.client_id === 7 && x.is_active === true && x.category === 'general'))
    ok('seeds the public audit\'s own prompts, capped, active, positioned, in one statement')
  }
  {
    const sb = fakeSupabase(emptyClientBackend({ cap: 5 }))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: 'new.example' },
      { getPrompts: auditPrompts(AUDIT_SIX, false) },
    )
    assert.strictEqual(r.source, 'generated', 'a fresh set is reported as generated')
    ok('reports source: generated when the domain had no prior audit')
  }
  {
    const sb = fakeSupabase(emptyClientBackend({ promptCount: 3 }))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: 'caselaw.example' },
      { getPrompts: auditPrompts(AUDIT_SIX, true) },
    )
    assert.strictEqual(r.seeded, 0)
    assert.strictEqual(r.reason, 'prompts_exist')
    assert.ok(!sb.calls.some(c => c.op === 'insert'), 'nothing was written')
    ok('never re-seeds a client that already has prompts')
  }
  {
    const sb = fakeSupabase(emptyClientBackend({}))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: '' },
      { getPrompts: auditPrompts(AUDIT_SIX, true) },
    )
    assert.strictEqual(r.reason, 'no_domain', 'a personal brand with no link seeds nothing, and says so')
    assert.ok(!sb.calls.some(c => c.op === 'insert'))
    ok('seeds nothing, explicitly, when there is no domain to work from')
  }
  {
    const sb = fakeSupabase(emptyClientBackend({}))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: 'x.example' },
      { getPrompts: async () => { throw new Error('openai down') } },
    )
    assert.ok(r.reason.startsWith('prompt_generation_failed'), 'reports rather than throws')
    ok('a failed generation is reported, never thrown at the caller')
  }
  {
    const sb = fakeSupabase(emptyClientBackend({ insertError: { message: 'rls' } }))
    const r = await seedInitialPrompts(
      sb, { clientId: 7, plan: 'free', domain: 'x.example' },
      { getPrompts: auditPrompts(AUDIT_SIX, true) },
    )
    assert.strictEqual(r.seeded, 0)
    assert.ok(r.reason.startsWith('prompt_insert_failed'))
    ok('a failed insert is reported as zero seeded, not as success')
  }

  // ── 3. Activation end to end ────────────────────────────────────────────────
  section('activateClient')

  const stubEnqueue = (record) => ({
    enqueueClientCollection: async (_sb, opts) => { record.enqueue = opts; return { runId: 91, totalJobs: 5, skipped: false } },
    triggerWorker: async () => { record.worker = true },
  })
  const stubAuth = (blocked) => ({ checkCollectionLimits: async () => (blocked ? { blocked: true, reason: 'monthly_budget' } : { blocked: false }) })

  {
    const rec = {}
    const sb = fakeSupabase(emptyClientBackend({ cap: 5 }))
    const s = await activateClient(
      sb, { clientId: 7, plan: 'free', domain: 'caselaw.example', brandAliases: ['Caselaw'], createdBy: 'u-1' },
      { getPrompts: auditPrompts(AUDIT_SIX, true), enqueue: stubEnqueue(rec), auth: stubAuth(false) },
    )
    assert.strictEqual(s.seeded, 5)
    assert.strictEqual(s.source, 'audit')
    assert.strictEqual(s.run_id, 91)
    assert.strictEqual(s.jobs, 5)
    assert.strictEqual(rec.worker, true, 'the worker is kicked so results land now, not on the next cron')
    ok('seeds and enqueues, then starts the worker')

    // The three enqueue arguments that are load bearing, each for its own reason.
    assert.strictEqual(rec.enqueue.trigger, 'signup',
      "NOT 'manual': that would spend the customer's one manual refresh (free's cooldown is 720h) before they had seen the dashboard")
    assert.strictEqual(rec.enqueue.force, false,
      'force is pointless on a client with no rows, and false can never reach the delete branch')
    assert.strictEqual(rec.enqueue.activeEngines, null,
      'engines are derived from the plan server-side, never passed in')
    ok("enqueues as trigger 'signup', non-force, with plan-derived engines")
  }
  {
    const rec = {}
    const sb = fakeSupabase(emptyClientBackend({ cap: 5, resultCount: 12 }))
    const s = await activateClient(
      sb, { clientId: 7, plan: 'free', domain: 'caselaw.example' },
      { getPrompts: auditPrompts(AUDIT_SIX, true), enqueue: stubEnqueue(rec), auth: stubAuth(false) },
    )
    assert.strictEqual(s.collection_reason, 'already_collected')
    assert.strictEqual(s.run_id, null)
    assert.ok(!rec.enqueue, 'nothing was enqueued')
    ok('a client that has already been measured is never re-collected')
  }
  {
    const rec = {}
    const sb = fakeSupabase(emptyClientBackend({ cap: 5 }))
    const s = await activateClient(
      sb, { clientId: 7, plan: 'free', domain: 'caselaw.example' },
      { getPrompts: auditPrompts(AUDIT_SIX, true), enqueue: stubEnqueue(rec), auth: stubAuth(true) },
    )
    assert.strictEqual(s.seeded, 5, 'the prompts are still seeded')
    assert.strictEqual(s.collection_reason, 'blocked: monthly_budget')
    assert.ok(!rec.enqueue, 'no run was created over budget')
    ok('respects the budget and ceiling checks, and still leaves the customer their prompts')
  }
  {
    // A personal brand that supplied no link: nothing is seeded, so _enqueue.js
    // finds no active prompt and skips. Mirrored here rather than asserted
    // against the stub's happy path, because the point of the case is that the
    // run is NOT created.
    const rec = {}
    const enqueue = {
      enqueueClientCollection: async (_sb, opts) => { rec.enqueue = opts; return { runId: null, totalJobs: 0, skipped: true, reason: 'no active prompts' } },
      triggerWorker: async () => { rec.worker = true },
    }
    const sb = fakeSupabase(emptyClientBackend({}))
    const s = await activateClient(
      sb, { clientId: 7, plan: 'free', domain: '' },
      { getPrompts: auditPrompts(AUDIT_SIX, true), enqueue, auth: stubAuth(false) },
    )
    assert.strictEqual(s.seed_reason, 'no_domain')
    assert.strictEqual(s.collection_reason, 'no active prompts')
    assert.strictEqual(s.run_id, null)
    assert.ok(!rec.worker, 'no worker kick for a run that was never created')
    ok('a client with nothing to measure reports why, creates no run, and does not throw')
  }

  console.log(`\n${passed} checks passed`)
})().catch((e) => { console.error('\nFAILED:', e.message); process.exit(1) })
