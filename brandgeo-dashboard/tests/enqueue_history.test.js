/**
 * enqueue_history.test.js guards the line between "collect everything again"
 * and "delete what is already there". Run: `node tests/enqueue_history.test.js`
 * (exits non-zero on failure).
 *
 * WHY THIS EXISTS. _enqueue.js used to control both decisions with one `force`
 * flag, and schedule-collections.js passed `force: true` for every scheduled
 * refresh with the comment "scheduled refresh = automated Force Refresh". The
 * force branch ran an ai_results DELETE with no date filter, so every scheduled
 * cycle erased the client's entire prior history for those prompts and engines.
 * Trend over time is what the paid tiers sell, so the scheduler was deleting the
 * product's core value on a timer, silently, with nothing failing.
 *
 * Measured against production 2026-08-14 before the fix: client 1 held 277 rows
 * over 8 distinct collection days across 5 runs, all of them manual; client 52,
 * the only client already on weekly, held 6 rows over 1 day. The second number
 * is what this defect looks like from the outside once the cadence is on.
 *
 * THE TRAP THIS FILE ALSO GUARDS, and the reason the obvious one-word fix is
 * wrong: you cannot repair this by flipping scheduled runs to `force: false`.
 * The non-force path skips every (prompt, engine) already collected OK this
 * calendar month, so from the second week of any month a weekly run would find
 * everything done and collect nothing. Weekly refresh would stop working and
 * report success. Section 5 below asserts exactly that, so nobody re-derives it.
 *
 * The four required properties, one section each:
 *   1. a SCHEDULED run preserves prior rows and adds new ones
 *   2. a MANUAL force refresh still deletes and recollects
 *   3. the monthly cap still binds, and still survives a force refresh
 *   4. the non-force manual path still skips completed prompts
 *
 * Runs entirely against an in-memory fake of the supabase client below. No
 * network, no database, no engine call, no spend.
 *
 * MODULE UNDER TEST is resolvable via BG_FN_DIR so the same file can be pointed
 * at a pre-fix copy of netlify/functions to demonstrate that it fails there.
 * Default is the real directory.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const FN_DIR = process.env.BG_FN_DIR
  ? path.resolve(process.env.BG_FN_DIR)
  : path.join(__dirname, '..', 'netlify', 'functions')

const { enqueueClientCollection } = require(path.join(FN_DIR, '_enqueue'))
const { MONTHLY_CAPPED_ENGINES, MONTHLY_CAP_DAYS, activeEnginesFor } = require(path.join(FN_DIR, '_cost'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

const DAY = 86400000
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString()
const thisMonthIso = () => {
  const d = new Date(); d.setDate(1); d.setHours(1, 0, 0, 0)
  return d.toISOString()
}

// ── In-memory supabase double ────────────────────────────────────────────────
// Implements exactly the chain shapes _enqueue.js uses: select/insert/delete
// with eq / neq / in / gte / order / single. Anything else throws rather than
// silently returning empty, so a future query added to _enqueue.js cannot pass
// this suite by accident.

function makeDb(seed) {
  const state = {
    clients:          seed.clients || [],
    prompts:          seed.prompts || [],
    ai_results:       (seed.ai_results || []).map((r, i) => ({ id: i + 1, status: 'ok', ...r })),
    collection_runs:  [],
    collection_jobs:  [],
    _nextRunId:       1,
    _deleted:         [],   // every row any delete removed, for assertions
  }

  const cmp = {
    eq:  (c, v) => (r) => String(r[c]) === String(v),
    neq: (c, v) => (r) => String(r[c]) !== String(v),
    in:  (c, v) => { const s = new Set(v.map(String)); return (r) => s.has(String(r[c])) },
    gte: (c, v) => (r) => new Date(r[c]).getTime() >= new Date(v).getTime(),
  }

  function builder(table) {
    const filters = []
    let op = null, payload = null, wantSingle = false, wantSelect = false

    const resolve = () => {
      if (!state[table]) throw new Error(`fake db: unknown table ${table}`)
      const match = (r) => filters.every(f => f(r))

      if (op === 'delete') {
        const hit = state[table].filter(match)
        state._deleted.push(...hit.map(r => ({ table, ...r })))
        state[table] = state[table].filter(r => !match(r))
        return { data: wantSelect ? hit : null, error: null }
      }

      if (op === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload]).map(r => {
          const row = { ...r }
          if (table === 'collection_runs') row.id = state._nextRunId++
          if (table === 'collection_jobs') row.id = state.collection_jobs.length + 1
          if (table === 'ai_results')      row.id = state.ai_results.length + 1
          return row
        })
        state[table].push(...rows)
        if (!wantSelect) return { data: null, error: null }
        return { data: wantSingle ? rows[0] : rows, error: null }
      }

      const rows = state[table].filter(match)
      return { data: wantSingle ? (rows[0] ?? null) : rows, error: null }
    }

    const q = {
      select(){ wantSelect = true; if (!op) op = 'select'; return q },
      insert(p){ op = 'insert'; payload = p; return q },
      delete(){ op = 'delete'; return q },
      order(){ return q },
      limit(){ return q },
      single(){ wantSingle = true; return q },
      maybeSingle(){ wantSingle = true; return q },
      then(res, rej){ return Promise.resolve().then(resolve).then(res, rej) },
    }
    for (const k of Object.keys(cmp)) q[k] = (c, v) => { filters.push(cmp[k](c, v)); return q }
    return q
  }

  return { state, from: (t) => builder(t) }
}

// ── Shared fixtures ──────────────────────────────────────────────────────────
// Two active prompts, one foreign client whose rows must never be touched.

const CLIENT = { id: 1, name: 'Fixture Co', plan: 'radar', engines_enabled: null,
  brand_aliases: ['Fixture'], brand_website: 'fixture.example', known_competitors: [],
  default_market_id: 'RO', default_region_id: null }

const PROMPTS = [
  { id: 101, client_id: 1, text: 'best catering bucharest', is_active: true,  position: 1 },
  { id: 102, client_id: 1, text: 'top event caterers',      is_active: true,  position: 2 },
  { id: 103, client_id: 1, text: 'retired prompt',          is_active: false, position: 3 },
]

// radar = gemini + claude, and neither is monthly-capped. Asserted, not assumed:
// if the ladder changes under this file the failure should be legible.
assert.deepStrictEqual(activeEnginesFor('radar', null), ['gemini', 'claude'],
  'fixture assumes radar = [gemini, claude]; re-cost this test if the ladder moved')
assert.ok(!MONTHLY_CAPPED_ENGINES.includes('gemini') && !MONTHLY_CAPPED_ENGINES.includes('claude'),
  'fixture assumes radar carries no monthly-capped engine')

const FOREIGN_ROW = { client_id: 2, prompt_id: 999, llm: 'gemini', checked_at: daysAgo(3), brand_mentioned: true }

// Week one, already collected: both prompts x both engines.
const weekOneRows = (when) => [
  { client_id: 1, prompt_id: 101, llm: 'gemini', checked_at: when, run_id: 900, brand_mentioned: true },
  { client_id: 1, prompt_id: 101, llm: 'claude', checked_at: when, run_id: 900, brand_mentioned: false },
  { client_id: 1, prompt_id: 102, llm: 'gemini', checked_at: when, run_id: 900, brand_mentioned: true },
  { client_id: 1, prompt_id: 102, llm: 'claude', checked_at: when, run_id: 900, brand_mentioned: true },
]

const engineCalls = (db) => db.state.collection_jobs.reduce((n, j) => n + j.engines.length, 0)
const jobFor = (db, pid) => db.state.collection_jobs.find(j => j.prompt_id === pid)

// ─────────────────────────────────────────────────────────────────────────────
async function main() {

console.log('\n1. a SCHEDULED run PRESERVES prior rows and adds new ones')
{
  const prior = daysAgo(7)
  const db = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: [...weekOneRows(prior), FOREIGN_ROW] })

  const res = await (enqueueClientCollection(db, {
    clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled', createdBy: null,
  }))

  // THE ASSERTION THIS WHOLE FILE EXISTS FOR. Hand-calculated: 4 week-one rows
  // for client 1, none of them touched, plus the 1 foreign row = 5 still present
  // and 0 deleted. Against the pre-fix code this reads 1 and 4.
  assert.strictEqual(db.state._deleted.length, 0, 'a scheduled run must delete nothing')
  ok('0 rows deleted')

  const mine = db.state.ai_results.filter(r => r.client_id === 1)
  assert.strictEqual(mine.length, 4, 'all four week-one rows must survive')
  ok('4 of 4 prior rows preserved')

  // And it still collects the full breadth: 2 prompts x 2 engines = 4 calls.
  assert.strictEqual(res.skipped, false)
  assert.strictEqual(db.state.collection_jobs.length, 2, 'one job per active prompt (103 is inactive)')
  assert.strictEqual(engineCalls(db), 4, 'full breadth: 2 prompts x 2 engines')
  ok('4 engine calls enqueued (2 prompts x 2 engines), inactive prompt excluded')

  // The new run has its own run_id, which is what makes accumulation safe against
  // uq_ai_results_run_prompt_llm (run_id, prompt_id, llm).
  const newRun = db.state.collection_runs[0]
  assert.ok(newRun && newRun.id !== 900, 'the run must mint a fresh run_id')
  assert.strictEqual(newRun.trigger, 'scheduled')
  ok('fresh run_id minted, so week N+1 rows cannot collide with week N')

  // Simulate the worker writing this run's rows, the way
  // collection-worker-background.js upserts them, and count the history.
  for (const j of db.state.collection_jobs) {
    for (const e of j.engines) {
      db.state.ai_results.push({ client_id: 1, prompt_id: j.prompt_id, llm: e,
        checked_at: new Date().toISOString(), run_id: newRun.id, status: 'ok' })
    }
  }
  const after = db.state.ai_results.filter(r => r.client_id === 1)
  assert.strictEqual(after.length, 8, 'hand-calculated: 4 preserved + 4 new = 8')
  assert.strictEqual(new Set(after.map(r => r.run_id)).size, 2, 'two distinct runs of history')
  ok('history accumulates: 4 + 4 = 8 rows across 2 runs')

  assert.strictEqual(res.replaced, false, 'the result must report that nothing was replaced')
  ok('result reports replaced:false')
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. a MANUAL force refresh still DELETES and recollects')
{
  const db = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: [...weekOneRows(daysAgo(7)), FOREIGN_ROW] })

  const res = await (enqueueClientCollection(db, {
    clientId: 1, force: true, trigger: 'manual', createdBy: 'user-uuid',
  }))

  assert.strictEqual(db.state._deleted.length, 4, 'all four of this client\'s rows must go')
  assert.strictEqual(db.state.ai_results.filter(r => r.client_id === 1).length, 0)
  ok('4 stale rows deleted, as the user asked for')

  // Scope: the delete is keyed to (client, prompts, engines) and must not reach
  // another tenant. A regression here would be a cross-tenant data loss incident,
  // not a bug, so it is asserted even though it is unchanged by this fix.
  assert.strictEqual(db.state.ai_results.filter(r => r.client_id === 2).length, 1,
    'another client\'s rows must never be inside the blast radius')
  ok('foreign client row untouched')

  assert.strictEqual(engineCalls(db), 4, 'and it recollects the full breadth')
  assert.strictEqual(res.replaced, true)
  ok('4 engine calls re-enqueued, result reports replaced:true')

  // The default is what carries this: a manual force refresh that passes no
  // replaceExisting must still be destructive, or the button loses its meaning.
  ok('default for trigger=manual + force=true is destructive (exercised above)')
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. the MONTHLY CAP still binds, and still survives a force refresh')
{
  // growth carries google_ai, which is monthly-capped. Asserted, not assumed.
  const growthEngines = activeEnginesFor('growth', null)
  assert.ok(growthEngines.includes('google_ai'), 'fixture assumes growth carries google_ai')
  const capped = growthEngines.filter(e => MONTHLY_CAPPED_ENGINES.includes(e))
  assert.strictEqual(capped.length, 1, 'fixture assumes exactly one capped engine on growth')
  const N = growthEngines.length

  const growthClient = { ...CLIENT, plan: 'growth' }
  const seedCap = (whenDays) => makeDb({
    clients: [growthClient], prompts: PROMPTS,
    ai_results: [
      // prompt 101 ran the capped engine recently; 102 never has.
      { client_id: 1, prompt_id: 101, llm: 'google_ai', checked_at: daysAgo(whenDays), run_id: 900 },
      ...weekOneRows(daysAgo(7)),
    ],
  })

  // 3a. Inside the window, on a scheduled run.
  {
    const db = seedCap(5)
    await (enqueueClientCollection(db, {
      clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled', createdBy: null,
    }))
    assert.strictEqual(jobFor(db, 101).engines.includes('google_ai'), false,
      'prompt 101 ran the capped engine 5 days ago and must not run it again')
    assert.strictEqual(jobFor(db, 102).engines.includes('google_ai'), true,
      'prompt 102 has never run it and must')
    assert.strictEqual(engineCalls(db), (N - 1) + N,
      `hand-calculated: prompt 101 gets ${N - 1} engines, prompt 102 gets ${N}`)
    ok(`cap binds on a scheduled run: ${(N - 1) + N} engine calls, not ${2 * N}`)
  }

  // 3b. Outside the window the cap must release, or the engine would never run
  // again. MONTHLY_CAP_DAYS + 5 is unambiguously outside.
  {
    const db = seedCap(MONTHLY_CAP_DAYS + 5)
    await (enqueueClientCollection(db, {
      clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled', createdBy: null,
    }))
    assert.strictEqual(jobFor(db, 101).engines.includes('google_ai'), true,
      `a capped run ${MONTHLY_CAP_DAYS + 5} days old is outside the window and must not bind`)
    assert.strictEqual(engineCalls(db), 2 * N)
    ok(`cap releases outside ${MONTHLY_CAP_DAYS} days: ${2 * N} engine calls`)
  }

  // 3c. THE ORDERING PROPERTY. The cap query runs BEFORE the delete, and capped
  // engines are excluded from the delete, so a manual force refresh can neither
  // erase the evidence the cap reads nor bypass the cap. This is the property the
  // fix had to preserve while moving the delete out of the force branch.
  {
    const db = seedCap(5)
    await (enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'manual', createdBy: 'u' }))
    assert.strictEqual(jobFor(db, 101).engines.includes('google_ai'), false,
      'a force refresh must not bypass the cap')
    const survivor = db.state.ai_results.find(r => r.llm === 'google_ai' && r.prompt_id === 101)
    assert.ok(survivor, 'the capped row must survive the force-delete, it is the cap\'s evidence')
    assert.strictEqual(db.state._deleted.some(r => r.llm === 'google_ai'), false)
    ok('force refresh neither bypasses the cap nor deletes the row it reads')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. the NON-FORCE manual path still skips completed prompts')
{
  const inMonth = thisMonthIso()
  const db = makeDb({
    clients: [CLIENT], prompts: PROMPTS,
    ai_results: [
      // 101 complete this month; 102 has gemini only, and an ERROR row for claude.
      { client_id: 1, prompt_id: 101, llm: 'gemini', checked_at: inMonth, status: 'ok' },
      { client_id: 1, prompt_id: 101, llm: 'claude', checked_at: inMonth, status: 'ok' },
      { client_id: 1, prompt_id: 102, llm: 'gemini', checked_at: inMonth, status: 'ok' },
      { client_id: 1, prompt_id: 102, llm: 'claude', checked_at: inMonth, status: 'error', error_code: 'api_error' },
    ],
  })

  const res = await (enqueueClientCollection(db, { clientId: 1, force: false, trigger: 'manual', createdBy: 'u' }))

  assert.strictEqual(db.state._deleted.length, 0, 'the non-force path must never delete')
  assert.strictEqual(res.replaced, false)
  ok('nothing deleted on the non-force path')

  assert.strictEqual(db.state.collection_jobs.length, 1, 'only prompt 102 has work left')
  assert.strictEqual(jobFor(db, 101), undefined, 'prompt 101 is complete this month and must be skipped')
  assert.deepStrictEqual(jobFor(db, 102).engines, ['claude'],
    'an error row does not count as collected, so claude must be retried')
  assert.strictEqual(engineCalls(db), 1)
  ok('1 engine call: prompt 101 skipped entirely, prompt 102 retries claude only')

  // And when there is genuinely nothing left, it says so rather than enqueueing.
  const full = makeDb({
    clients: [CLIENT], prompts: PROMPTS,
    ai_results: weekOneRows(inMonth),
  })
  const none = await (enqueueClientCollection(full, { clientId: 1, force: false, trigger: 'manual', createdBy: 'u' }))
  assert.strictEqual(none.skipped, true)
  assert.match(none.reason, /already up to date/)
  assert.strictEqual(full.state.collection_jobs.length, 0)
  ok('a fully-collected month returns skipped:"already up to date", 0 jobs')
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. THE TRAP: force:false is NOT a valid fix for the scheduler')
{
  // Everything already collected earlier THIS calendar month, which is the normal
  // state of a weekly client from week two onward.
  const inMonth = thisMonthIso()

  const cheat = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: weekOneRows(inMonth) })
  const cheatRes = await (enqueueClientCollection(cheat, {
    clientId: 1, force: false, replaceExisting: false, trigger: 'scheduled', createdBy: null,
  }))
  assert.strictEqual(cheatRes.skipped, true, 'force:false collects NOTHING in the same month')
  assert.strictEqual(engineCalls(cheat), 0)
  ok('force:false on a scheduled run enqueues 0 engine calls, so weekly would silently stop')

  const real = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: weekOneRows(inMonth) })
  await (enqueueClientCollection(real, {
    clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled', createdBy: null,
  }))
  assert.strictEqual(engineCalls(real), 4, 'force:true + replaceExisting:false collects the full breadth')
  assert.strictEqual(real.state._deleted.length, 0, 'and still deletes nothing')
  ok('force:true + replaceExisting:false enqueues 4 and deletes 0, the only correct combination')
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. the DEFAULT fails toward keeping data')
{
  // A scheduled caller that forgets replaceExisting must still accumulate. This
  // is the guard against the defect coming back through a new call site.
  const db = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: weekOneRows(daysAgo(7)) })
  const res = await (enqueueClientCollection(db, {
    clientId: 1, force: true, trigger: 'scheduled', createdBy: null,   // no replaceExisting
  }))
  assert.strictEqual(db.state._deleted.length, 0,
    'trigger=scheduled must default to non-destructive even with force:true and no explicit flag')
  assert.strictEqual(res.replaced, false)
  assert.strictEqual(engineCalls(db), 4)
  ok('scheduled + force, flag omitted -> accumulates anyway')

  // The opposite direction is also available: an explicit replace on a scheduled
  // trigger is honoured, because a deliberate operator-run rebuild is a real need.
  const forced = makeDb({ clients: [CLIENT], prompts: PROMPTS, ai_results: weekOneRows(daysAgo(7)) })
  await (enqueueClientCollection(forced, {
    clientId: 1, force: true, replaceExisting: true, trigger: 'scheduled', createdBy: null,
  }))
  assert.strictEqual(forced.state._deleted.length, 4, 'an explicit replaceExisting:true is honoured')
  ok('explicit replaceExisting:true on a scheduled trigger still replaces')
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. the scheduler call site is pinned in source')
{
  // Behaviour above proves _enqueue.js. This proves the caller that matters
  // actually asks for it, since the whole defect was one wrong argument.
  const src = fs.readFileSync(path.join(FN_DIR, 'schedule-collections.js'), 'utf8')
  const call = src.slice(src.indexOf('enqueueClientCollection(supabase'))
  assert.ok(call.length > 0, 'schedule-collections.js must call enqueueClientCollection')

  assert.match(call.slice(0, 1200), /replaceExisting:\s*false/,
    'schedule-collections.js MUST pass replaceExisting:false explicitly')
  ok('schedule-collections.js passes replaceExisting: false')

  assert.doesNotMatch(src, /force:\s*true,\s*\/\/ scheduled refresh = automated Force Refresh/,
    'the old conflating comment must be gone')
  ok('the "scheduled refresh = automated Force Refresh" line is gone')

  // The delete must not sit inside the force branch any more.
  const enq = fs.readFileSync(path.join(FN_DIR, '_enqueue.js'), 'utf8')
  const deleteIdx = enq.indexOf(".from('ai_results')\n        .delete()")
  assert.ok(deleteIdx > 0, 'expected the ai_results delete to still exist for the manual path')
  const guard = enq.slice(0, deleteIdx)
  assert.match(guard.slice(-600), /if \(replace\)/,
    'the ai_results delete must be guarded by `replace`, not by `force`')
  ok('the ai_results delete is guarded by `replace`')
}

console.log(`\nPASS: ${passed} assertions\n`)
}

main().catch((e) => {
  console.error(`\nFAIL: ${e.message}`)
  if (process.env.BG_TEST_STACK) console.error(e.stack)
  process.exit(1)
})
