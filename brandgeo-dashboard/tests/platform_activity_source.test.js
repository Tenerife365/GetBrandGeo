/**
 * platform_activity_source.test.js: the polled ActivitySource and the detail
 * line formatter of src/lib/platformActivity.ts (spec 9.2). Injected timers,
 * visibility and fetch, so nothing here waits on a real clock.
 */
const assert = require('assert')
require('./helpers/ts_require')
const lib = require('../src/lib/platformActivity.ts')

let passed = 0
let failed = 0
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name) }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)) }
}
const DASH = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']')
const flush = () => new Promise((r) => setImmediate(r))

function harness(over = {}) {
  const h = {
    timers: [], cleared: 0, hidden: false, visCb: null, clock: 1_000_000,
    calls: [], responses: [], status: [], batches: [],
  }
  h.setTimer = (fn, ms) => { const t = { fn, ms, live: true }; h.timers.push(t); return t }
  h.clearTimer = (t) => { if (t && t.live) { t.live = false; h.cleared++ } }
  h.liveTimer = () => [...h.timers].reverse().find((t) => t.live)
  h.fire = async () => { const t = h.liveTimer(); t.live = false; t.fn(); await flush() }
  h.fetchFeed = async (since) => {
    h.calls.push(since)
    const r = h.responses.shift()
    if (r instanceof Error) throw r
    return r
  }
  h.source = lib.createPollingActivitySource({
    fetchFeed: h.fetchFeed, intervalMs: 15000, overlapMs: 60000, maxBackoffMs: 120000,
    seenCap: 3, isHidden: () => h.hidden,
    onVisibilityChange: (cb) => { h.visCb = cb; return () => { h.visCb = null } },
    setTimer: h.setTimer, clearTimer: h.clearTimer, now: () => h.clock, ...over,
  })
  h.sub = () => h.source.subscribe((b) => h.batches.push(b), (s) => h.status.push(s))
  return h
}
const row = (id, at = '2026-11-14T10:00:00.000Z') => ({
  id, at, badge: 'LOGIN', tone: 'neutral', client_id: 1, client_name: 'Acme', is_research: false,
  actor_role: 'viewer', detail: { kind: 'login' },
})
const ok = (rows, cursor = '2026-11-14T10:00:00.000Z', truncated = {}) => ({
  status: 200, data: { rows, cursor, server_time: cursor, window: {}, truncated, warnings: [] },
})

;(async () => {
  console.log('platform_activity_source')

  await check('first fetch sends since null, next sends cursor minus 60 s', async () => {
    const h = harness()
    h.responses.push(ok([row('a')]), ok([]))
    h.sub(); await flush()
    assert.strictEqual(h.calls[0], null)
    assert.strictEqual(h.liveTimer().ms, 15000)
    await h.fire()
    assert.strictEqual(h.calls[1], '2026-11-14T09:59:00.000Z')
  })

  await check('first batch is marked initial, later ones are not', async () => {
    const h = harness()
    h.responses.push(ok([row('a')]), ok([row('b')]))
    h.sub(); await flush(); await h.fire()
    assert.strictEqual(h.batches[0].initial, true)
    assert.strictEqual(h.batches[1].initial, false)
  })

  await check('a repeated id is not re-emitted and an empty batch is not emitted', async () => {
    const h = harness()
    h.responses.push(ok([row('a')]), ok([row('a')]), ok([]))
    h.sub(); await flush(); await h.fire(); await h.fire()
    assert.strictEqual(h.batches.length, 1)
    assert.deepStrictEqual(h.batches[0].rows.map((r) => r.id), ['a'])
  })

  await check('truncated flag is carried on the batch', async () => {
    const h = harness()
    h.responses.push(ok([row('a')], undefined, { merged: true }))
    h.sub(); await flush()
    assert.strictEqual(h.batches[0].truncated, true)
  })

  await check('no fetch while hidden, immediate fetch on becoming visible after the interval', async () => {
    const h = harness()
    h.responses.push(ok([row('a')]), ok([row('b')]))
    h.sub(); await flush()
    assert.strictEqual(h.calls.length, 1)
    h.hidden = true
    await h.fire()
    assert.strictEqual(h.calls.length, 1)
    assert.strictEqual(h.status[h.status.length - 1], 'paused')
    h.hidden = false
    h.clock += 20000
    h.visCb(); await flush()
    assert.strictEqual(h.calls.length, 2)
    assert.strictEqual(h.status[h.status.length - 1], 'live')
  })

  await check('backoff doubles to the 120 s cap and resets after a success', async () => {
    const h = harness()
    h.responses.push({ status: 500, data: null }, { status: 500, data: null }, { status: 500, data: null },
      { status: 500, data: null }, { status: 500, data: null }, ok([row('a')]))
    h.sub(); await flush()
    const delays = [h.liveTimer().ms]
    for (let i = 0; i < 4; i++) { await h.fire(); delays.push(h.liveTimer().ms) }
    assert.deepStrictEqual(delays, [30000, 60000, 120000, 120000, 120000])
    assert.strictEqual(h.status[h.status.length - 1], 'retrying')
    await h.fire()
    assert.strictEqual(h.liveTimer().ms, 15000)
    assert.strictEqual(h.status[h.status.length - 1], 'live')
  })

  await check('a thrown fetch counts as a failure', async () => {
    const h = harness()
    h.responses.push(new Error('network'))
    h.sub(); await flush()
    assert.strictEqual(h.status[h.status.length - 1], 'retrying')
    assert.strictEqual(h.liveTimer().ms, 30000)
  })

  await check('401 stops the source and schedules nothing', async () => {
    const h = harness()
    h.responses.push({ status: 401, data: null })
    h.sub(); await flush()
    assert.strictEqual(h.status[h.status.length - 1], 'stopped')
    assert.strictEqual(h.liveTimer(), undefined)
  })

  await check('403 also stops the source', async () => {
    const h = harness()
    h.responses.push({ status: 403, data: null })
    h.sub(); await flush()
    assert.strictEqual(h.status[h.status.length - 1], 'stopped')
    assert.strictEqual(h.liveTimer(), undefined)
  })

  await check('unsubscribe clears the timer and the visibility listener', async () => {
    const h = harness()
    h.responses.push(ok([row('a')]))
    const off = h.sub(); await flush()
    assert.ok(h.liveTimer())
    off()
    assert.strictEqual(h.liveTimer(), undefined)
    assert.strictEqual(h.visCb, null)
    assert.ok(h.cleared >= 1)
  })

  await check('the seen set evicts the oldest beyond seenCap', async () => {
    const h = harness()
    h.responses.push(ok([row('1'), row('2'), row('3'), row('4')]), ok([row('1'), row('4')]))
    h.sub(); await flush(); await h.fire()
    // cap 3: '1' was evicted, so it is emitted again; '4' is still known
    assert.strictEqual(h.batches.length, 2)
    assert.deepStrictEqual(h.batches[1].rows.map((r) => r.id), ['1'])
  })

  await check('detail formatter returns no em or en dash for every kind', async () => {
    const details = [
      { kind: 'login' },
      { kind: 'run', trigger: 'manual', force: true, total_jobs: 12 },
      { kind: 'run', trigger: 'scheduled', force: false, total_jobs: null },
      { kind: 'job_failed', attempts: 3, engines: ['perplexity', 'grok'], has_error_text: true },
      { kind: 'engine_error', llm: 'claude', error_code: 'quota_exceeded' },
      { kind: 'engine_error', llm: 'zzz', error_code: null },
      { kind: 'account_deleted' },
      { kind: 'plan', from_plan: 'radar', to_plan: 'growth', grant_until: '2026-12-01T00:00:00Z' },
      { kind: 'plan', from_plan: null, to_plan: null, grant_until: null },
      { kind: 'trial_expired', from_plan: 'growth', to_plan: 'free', was: 'trial' },
      { kind: 'onboarded', to_plan: 'essentials', prompts_created: 5, locations_created: 2, invite_channel: 'email' },
      { kind: 'signup', to_plan: 'free', account_type: 'company' },
      { kind: 'stripe', from_plan: 'radar', to_plan: 'growth', reason: 'upgrade' },
      { kind: 'mcp_fix', fix_id: 'f1', via: 'oauth' },
      { kind: 'invite', channel: 'email', delivery: 'sent' },
      { kind: 'location', action: 'add', over_limit: true, count: 3 },
    ]
    const badges = ['LOGIN', 'RUN_STARTED', 'JOB_FAILED', 'ENGINE_ERROR', 'ACCOUNT_DELETED', 'PLAN_CHANGE',
      'TRIAL_GRANT', 'COMP_GRANT', 'STRIPE_PROVISION']
    for (const d of details) {
      for (const b of badges) {
        const s = lib.formatDetail({ badge: b, detail: d, client_id: 7 })
        assert.ok(typeof s === 'string' && s.length > 0, JSON.stringify(d))
        assert.ok(!DASH.test(s), 'dash in: ' + s)
      }
    }
    for (const b of Object.values(lib.BADGE_TEXT)) assert.ok(!DASH.test(b))
  })

  await check('detail line never prints email-like text', async () => {
    const s = lib.formatDetail({ badge: 'INVITE_RESENT', detail: { kind: 'invite', channel: 'email', delivery: 'sent' }, client_id: 1 })
    assert.ok(!/@/.test(s))
  })

  await check('relativeTime words', async () => {
    const now = Date.parse('2026-11-14T12:00:00Z')
    assert.strictEqual(lib.relativeTime(null, now), 'Never')
    assert.strictEqual(lib.relativeTime('2026-11-14T11:59:40Z', now), 'just now')
    assert.strictEqual(lib.relativeTime('2026-11-14T11:30:00Z', now), '30 min ago')
    assert.strictEqual(lib.relativeTime('2026-11-14T09:00:00Z', now), '3 h ago')
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})()
