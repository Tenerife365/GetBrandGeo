/**
 * enqueue_force_gate.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/enqueue_force_gate.test.js
 *
 * Defect (P3, docs/qa/ai-visibility-prompt-focus-build-rereview-2026-10-31.md):
 * enqueue-collection.js passed `!!force` straight into enqueueClientCollection,
 * so a viewer could send `force: true` for their own client from devtools and
 * run the destructive force path (delete, then recollect). The dashboard never
 * sends force for a viewer, so the gate is server side only.
 *
 * Rule under test: only an admin's `force: true` is honoured. A non-admin who
 * asks for force gets a normal run, and the 200 body carries
 * `force_ignored: true` so the client can tell.
 *
 * The handler is exercised end to end with _auth.js and _enqueue.js replaced
 * in require.cache BEFORE the handler is loaded, so nothing touches the
 * network: no Supabase read, no worker trigger, no engine call. The real
 * createClient is called with a placeholder URL, which builds a client object
 * and makes no request.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'

let failures = 0
let passes = 0
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

function installModule(file, exportsObj) {
  const p = require.resolve(path.join(FN, file))
  const m = new Module(p, null)
  m.filename = p
  m.loaded = true
  m.exports = exportsObj
  require.cache[p] = m
}

// Scripted identity per bearer token.
const PROFILES = {
  'tok-admin':  { role: 'admin',  client_id: null },
  'tok-viewer': { role: 'viewer', client_id: 42 },
}

const calls = { enqueue: [], trigger: 0, cooldown: 0 }
let enqueueResult = { runId: 7, totalJobs: 3 }

installModule('_auth.js', {
  ALLOWED_ORIGINS: ['https://app.getbrandgeo.com'],
  corsHeaders: () => ({ 'Content-Type': 'application/json' }),
  checkCollectionLimits: async () => ({ blocked: false }),
  async requireAuth(event) {
    const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : ''
    const profile = PROFILES[token]
    if (!profile) return { response: { statusCode: 401, headers: {}, body: JSON.stringify({ error: 'Unauthorized' }) } }
    return { user: { id: 'user-' + profile.role }, profile, supabase: {}, headers: { 'Content-Type': 'application/json' } }
  },
})

// COUNTRY_NAMES lives in _country_names.js since 2026-11-13 (_enqueue.js
// re-exports it); both are stubbed so nothing real is loaded for geo.
installModule('_country_names.js', { COUNTRY_NAMES: {} })
installModule('_enqueue.js', {
  COUNTRY_NAMES: {},
  async checkCollectionCooldown() { calls.cooldown++; return { blocked: false } },
  async enqueueClientCollection(_supabase, opts) { calls.enqueue.push(opts); return { ...enqueueResult } },
  async triggerWorker() { calls.trigger++ },
})

const fnModule = require(path.join(FN, 'enqueue-collection.js'))
const { handler, effectiveForceFor } = fnModule

function post(token, body) {
  return handler({
    httpMethod: 'POST',
    headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
    body: JSON.stringify(body),
  })
}

function reset() {
  calls.enqueue.length = 0
  calls.trigger = 0
  calls.cooldown = 0
  enqueueResult = { runId: 7, totalJobs: 3 }
}

;(async () => {
  console.log('effectiveForceFor (pure rule)')
  await check('admin + true is true', () => assert.strictEqual(effectiveForceFor('admin', true), true))
  await check('admin + false is false', () => assert.strictEqual(effectiveForceFor('admin', false), false))
  await check('viewer + true is false', () => assert.strictEqual(effectiveForceFor('viewer', true), false))
  await check('viewer + false is false', () => assert.strictEqual(effectiveForceFor('viewer', false), false))
  await check('unknown role + true is false', () => assert.strictEqual(effectiveForceFor(undefined, true), false))
  await check('admin + truthy non-boolean is false', () => {
    assert.strictEqual(effectiveForceFor('admin', 'true'), false)
    assert.strictEqual(effectiveForceFor('admin', 1), false)
  })

  console.log('handler, end to end with mocked _auth and _enqueue')

  await check('viewer + force true: enqueued with force false, force_ignored true', async () => {
    reset()
    const res = await post('tok-viewer', { client_id: 42, force: true })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(calls.enqueue.length, 1)
    assert.strictEqual(calls.enqueue[0].force, false)
    assert.strictEqual(calls.enqueue[0].clientId, 42)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(body.skipped, false)
    assert.strictEqual(body.run_id, 7)
    assert.strictEqual(calls.cooldown, 1, 'viewer still passes the cooldown check')
  })

  await check('admin + force true: enqueued with force true, no force_ignored', async () => {
    reset()
    const res = await post('tok-admin', { client_id: 42, force: true })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(calls.enqueue.length, 1)
    assert.strictEqual(calls.enqueue[0].force, true)
    const body = JSON.parse(res.body)
    assert.ok(!('force_ignored' in body), 'admin response carries no force_ignored key')
    assert.strictEqual(calls.cooldown, 0, 'admin bypasses the cooldown check, unchanged')
  })

  await check('viewer + force false: unchanged, no force_ignored', async () => {
    reset()
    const res = await post('tok-viewer', { client_id: 42, force: false })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(calls.enqueue[0].force, false)
    const body = JSON.parse(res.body)
    assert.ok(!('force_ignored' in body))
    assert.deepStrictEqual(Object.keys(body).sort(), ['run_id', 'skipped', 'total_jobs'])
  })

  await check('viewer with force omitted: unchanged, no force_ignored', async () => {
    reset()
    const res = await post('tok-viewer', { client_id: 42 })
    assert.strictEqual(calls.enqueue[0].force, false)
    assert.ok(!('force_ignored' in JSON.parse(res.body)))
  })

  await check('admin + force false: enqueued with force false', async () => {
    reset()
    await post('tok-admin', { client_id: 42, force: false })
    assert.strictEqual(calls.enqueue[0].force, false)
  })

  await check('viewer + force true on a skipped run: skipped body also carries force_ignored', async () => {
    reset()
    enqueueResult = { skipped: true, reason: 'nothing_due' }
    const res = await post('tok-viewer', { client_id: 42, force: true })
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(calls.enqueue[0].force, false)
    assert.strictEqual(calls.trigger, 0, 'no worker trigger on a skipped run')
  })

  await check('viewer for a foreign client is still 403 before any enqueue', async () => {
    reset()
    const res = await post('tok-viewer', { client_id: 99, force: true })
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(calls.enqueue.length, 0)
  })

  console.log('handler, multi-location (2026-11-13)')

  await check('body markets is accepted and ignored: enqueue gets market null', async () => {
    reset()
    const res = await post('tok-viewer', { client_id: 42, markets: [{ market: { id: 'US', label: 'USA' }, region: { id: 'NYC', label: 'New York' } }] })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(calls.enqueue[0].market, null)
  })

  await check('a non-object body is 400 before any enqueue', async () => {
    reset()
    for (const b of [null, [1], 7, 'x']) {
      const res = await post('tok-admin', b)
      assert.strictEqual(res.statusCode, 400)
    }
    assert.strictEqual(calls.enqueue.length, 0)
  })

  await check('a client_id that is not a positive int4 is 400', async () => {
    reset()
    for (const id of [0, -1, 1.5, '1e0', ' 1', 2147483648, true]) {
      const res = await post('tok-admin', { client_id: id })
      assert.strictEqual(res.statusCode, 400, `client_id ${JSON.stringify(id)}`)
    }
    assert.strictEqual(calls.enqueue.length, 0)
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures === 0 ? 0 : 1)
})().catch((e) => {
  console.error('test harness crashed:', e)
  process.exit(1)
})
