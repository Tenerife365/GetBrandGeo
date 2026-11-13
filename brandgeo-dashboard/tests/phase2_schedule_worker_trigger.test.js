/**
 * phase2_schedule_worker_trigger.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/phase2_schedule_worker_trigger.test.js
 *
 * Ruling 2 of 2026-11-09 (docs/arch/phase2-dashboard-plan-2026-11-08.md), F2 of
 * docs/qa/phase2-server-review-2026-11-08.md. schedule-collections.js used to
 * start the worker only when its own run enqueued work, so a job the reaper
 * requeued (or one the worker retried on its last batch) sat 'pending' and due
 * with no worker coming. Now the hourly run starts the worker whenever any
 * pending job is due. This suite pins, through the real handler with fakes:
 *
 *   1. a due pending job and no client due: the trigger fires exactly once.
 *   2. no due pending job (done, running, failed, pending in the future): 0.
 *   3. new work AND due leftovers: still exactly once per run.
 *   4. the trigger throws: the run still answers 200 and job_runs reads ok.
 *   5. the collection_jobs read fails: no throw, 200, no trigger when nothing
 *      was enqueued, and the trigger still fires when work was enqueued.
 *   6. the cron gate still runs first: no key is 401 with no read at all.
 *   7. kickWorkerIfNeeded unit checks with an injected trigger and clock.
 *
 * Fakes: @supabase/supabase-js (the in-memory DB in tests/helpers), _enqueue.js
 * (triggerWorker counted, enqueueClientCollection scripted), _auth.js
 * (checkCollectionLimits never blocks). _cron_auth.js and _cost.js are real.
 * Fixtures name no real person.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = process.env.SCHEDULE_FN_DIR || path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
process.env.CRON_SECRET = 'test-cron-secret-placeholder'
delete process.env.SENTRY_DSN

let passes = 0
let failures = 0
async function check(name, fn) {
  try {
    await fn()
    passes++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL ${name}`)
    console.log(`       ${e && e.message ? e.message : e}`)
  }
}

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}

// ── Fakes ───────────────────────────────────────────────────────────────────
let db = null
let failJobsRead = false
const reads = []
function erroring() {
  const b = {
    select() { return b }, eq() { return b }, lte() { return b }, limit() { return b },
    then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated collection_jobs read failure' } }).then(res, rej) },
  }
  return b
}
function client() {
  return {
    from(table) {
      reads.push(table)
      if (table === 'collection_jobs' && failJobsRead) return erroring()
      return db.from(table)
    },
  }
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient() { return client() } })

// COUNTRY_NAMES lives in _country_names.js since 2026-11-13 (_enqueue.js
// re-exports it); stubbed here as well as on the _enqueue.js stub below.
installModule(require.resolve(path.join(FN, '_country_names.js')), { COUNTRY_NAMES: {} })

const triggerCalls = { n: 0 }
let triggerThrows = false
let enqueueJobs = 0
let enqueueResult = null   // when set, enqueueClientCollection answers exactly this
installModule(require.resolve(path.join(FN, '_enqueue.js')), {
  async triggerWorker() {
    triggerCalls.n++
    if (triggerThrows) throw new Error('simulated trigger failure')
  },
  async enqueueClientCollection(_sb, { clientId }) {
    if (enqueueResult) return { ...enqueueResult }
    if (!enqueueJobs) return { skipped: true, reason: 'no_active_prompts' }
    return { runId: 900 + clientId, totalJobs: enqueueJobs, skipped: false }
  },
  async checkCollectionCooldown() { return { blocked: false } },
  COUNTRY_NAMES: {},
})
installModule(require.resolve(path.join(FN, '_auth.js')), {
  async checkCollectionLimits() { return { blocked: false } },
  async requireAuth() { throw new Error('requireAuth must not be called by a cron job') },
})

const realLog = console.log
console.log = (...args) => { if (String(args[0] || '').startsWith('[')) return; realLog(...args) }
console.warn = () => {}
console.error = () => {}

const sched = require(path.join(FN, 'schedule-collections.js'))

// ── Fixtures ────────────────────────────────────────────────────────────────
const MIN = 60 * 1000
const iso = (msFromNow) => new Date(Date.now() + msFromNow).toISOString()

function freshDb({ jobs = [], dueClient = false } = {}) {
  db = createFakeSupabase()
  failJobsRead = false
  triggerThrows = false
  enqueueJobs = 0
  enqueueResult = null
  triggerCalls.n = 0
  reads.length = 0
  db.seed('clients', dueClient
    ? [{ id: 42, name: 'Acme Example', refresh_cadence: 'weekly', last_refresh_at: null, category: 'active' }]
    : [{ id: 42, name: 'Acme Example', refresh_cadence: 'weekly', last_refresh_at: iso(-1 * 24 * 60 * MIN), category: 'active' }])
  db.seed('collection_jobs', jobs)
  db.seed('job_runs', [])
}
const job = (id, status, scheduledFor) => ({ id, run_id: 1, client_id: 42, prompt_id: 7, status, attempts: 1, scheduled_for: scheduledFor })

function run(headers = { 'x-cron-key': process.env.CRON_SECRET }) {
  return sched.handler({ httpMethod: 'POST', headers, body: '{"next_run":"ignored"}' })
}
const lastJobRun = () => { const r = db.rows('job_runs'); return r[r.length - 1] }

;(async () => {
  console.log('schedule-collections handler, worker kick for due pending jobs')

  await check('a due pending job (reaper requeue) and no client due: trigger fires exactly once', async () => {
    freshDb({ jobs: [job(1, 'pending', iso(-1 * MIN))] })
    const res = await run()
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(triggerCalls.n, 1)
    assert.strictEqual(JSON.parse(res.body).totalJobs, 0)
    assert.strictEqual(JSON.parse(res.body).workerTriggered, true)
    const jr = lastJobRun()
    assert.strictEqual(jr.ok, true)
    assert.deepStrictEqual(jr.detail.worker, { triggered: true, reason: 'due_pending', duePending: true })
  })

  await check('a pending job due exactly now counts as due', async () => {
    const fixed = new Date()
    freshDb({ jobs: [job(1, 'pending', fixed.toISOString())] })
    let n = 0
    const out = await sched.kickWorkerIfNeeded(client(), { totalJobs: 0, invId: 'T', trigger: async () => { n++ }, now: () => fixed })
    assert.strictEqual(n, 1)
    assert.strictEqual(out.reason, 'due_pending')
  })

  await check('no due pending job (done, running, failed, pending later): trigger fires 0 times', async () => {
    freshDb({ jobs: [
      job(1, 'done', iso(-60 * MIN)), job(2, 'running', iso(-60 * MIN)),
      job(3, 'failed', iso(-60 * MIN)), job(4, 'pending', iso(+5 * MIN)),
    ] })
    const res = await run()
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(triggerCalls.n, 0)
    assert.strictEqual(JSON.parse(res.body).workerTriggered, false)
    assert.deepStrictEqual(lastJobRun().detail.worker, { triggered: false, reason: null, duePending: false })
  })

  await check('empty queue: trigger fires 0 times', async () => {
    freshDb()
    await run()
    assert.strictEqual(triggerCalls.n, 0)
  })

  await check('new work AND due leftovers: still exactly once per run', async () => {
    freshDb({ jobs: [job(1, 'pending', iso(-30 * MIN))], dueClient: true })
    enqueueJobs = 3
    const res = await run()
    const body = JSON.parse(res.body)
    assert.strictEqual(body.totalJobs, 3)
    assert.strictEqual(triggerCalls.n, 1)
    assert.strictEqual(lastJobRun().detail.worker.reason, 'enqueued')
  })

  await check('new work only (queue read empty): trigger fires once, as before the ruling', async () => {
    freshDb({ dueClient: true })
    enqueueJobs = 2
    await run()
    assert.strictEqual(triggerCalls.n, 1)
  })

  await check('trigger throws: the run still answers 200 and job_runs reads ok with the error', async () => {
    freshDb({ jobs: [job(1, 'pending', iso(-1 * MIN))] })
    triggerThrows = true
    let res
    try { res = await run() } catch (e) { throw new Error('handler threw: ' + e.message) }
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(triggerCalls.n, 1)
    const jr = lastJobRun()
    assert.strictEqual(jr.ok, true)
    assert.strictEqual(jr.detail.worker.triggered, false)
    assert.strictEqual(jr.detail.worker.reason, 'due_pending')
    assert.match(jr.detail.worker.error, /simulated trigger failure/)
  })

  await check('collection_jobs read fails, nothing enqueued: 200, no trigger, no throw', async () => {
    freshDb({ jobs: [job(1, 'pending', iso(-1 * MIN))] })
    failJobsRead = true
    const res = await run()
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(triggerCalls.n, 0)
    const jr = lastJobRun()
    assert.strictEqual(jr.ok, true)
    assert.deepStrictEqual(jr.detail.worker, { triggered: false, reason: null, duePending: null })
  })

  await check('collection_jobs read fails, work enqueued: the trigger still fires once', async () => {
    freshDb({ dueClient: true })
    failJobsRead = true
    enqueueJobs = 4
    await run()
    assert.strictEqual(triggerCalls.n, 1)
  })

  // L1 of docs/qa/multi-location-review-server-2026-11-13.md: a transient
  // refusal (the client_locations read failed inside _enqueue.js) must NOT
  // stamp last_refresh_at, so the next hourly run retries the client.
  const stampOf42 = () => db.rows('clients').find(c => c.id === 42).last_refresh_at

  await check('a transient refusal from enqueue: last_refresh_at not stamped, counted as skippedTransient', async () => {
    freshDb({ dueClient: true })
    enqueueResult = { runId: null, totalJobs: 0, skipped: true, reason: 'location read failed', transient: true }
    const res = await run()
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(stampOf42(), null, 'the client stays due, so the next hour retries it')
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skippedTransient, 1); assert.strictEqual(body.skippedNoWork, 0)
    const jr = lastJobRun()
    assert.strictEqual(jr.ok, true)
    assert.strictEqual(jr.detail.skippedTransient, 1); assert.strictEqual(jr.detail.skippedNoWork, 0)
  })

  await check('the client stays due: a second run after a transient refusal asks enqueue again', async () => {
    freshDb({ dueClient: true })
    enqueueResult = { runId: null, totalJobs: 0, skipped: true, reason: 'location read failed', transient: true }
    await run()
    enqueueResult = null
    enqueueJobs = 2
    const res = await run()
    assert.strictEqual(JSON.parse(res.body).enqueued, 1)
    assert.ok(stampOf42(), 'stamped once work was enqueued')
  })

  await check('a non-transient skip is still stamped (unchanged behaviour)', async () => {
    freshDb({ dueClient: true })
    enqueueResult = { runId: null, totalJobs: 0, skipped: true, reason: 'no active prompts' }
    const res = await run()
    assert.ok(stampOf42(), 'stamped as before')
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skippedNoWork, 1); assert.strictEqual(body.skippedTransient, 0)
  })

  await check('cron gate first: no key is 401, no read, no trigger', async () => {
    freshDb({ jobs: [job(1, 'pending', iso(-1 * MIN))] })
    const res = await run({})
    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(reads, [])
    assert.strictEqual(triggerCalls.n, 0)
  })

  await check('the due read filters on status pending and scheduled_for <= now, one row', async () => {
    freshDb()
    const calls = []
    const spy = {
      from(t) {
        const b = {
          select(c) { calls.push(['select', t, c]); return b },
          eq(c, v) { calls.push(['eq', c, v]); return b },
          lte(c, v) { calls.push(['lte', c, v]); return b },
          limit(n) { calls.push(['limit', n]); return b },
          then(res, rej) { return Promise.resolve({ data: [], error: null }).then(res, rej) },
        }
        return b
      },
    }
    const fixed = new Date('2026-11-09T10:10:00.000Z')
    const due = await sched.hasDuePendingJobs(spy, fixed.toISOString())
    assert.strictEqual(due, false)
    assert.deepStrictEqual(calls, [
      ['select', 'collection_jobs', 'id'], ['eq', 'status', 'pending'],
      ['lte', 'scheduled_for', '2026-11-09T10:10:00.000Z'], ['limit', 1],
    ])
  })

  console.log = realLog
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  console.log = realLog
  realLog('suite crashed:', e)
  process.exit(1)
})
