/**
 * observability.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/observability.test.js
 *
 * Covers docs/arch/observability.md V1 for the server half (path B):
 *   - no network without a DSN, and none outside a wrapped invocation
 *   - envelope URL, headers and three-line body
 *   - every case of tests/fixtures/observability-pii.json scrubbed exactly,
 *     and the fixture's "patterns" block equal to PATTERNS
 *   - 5-event cap per invocation, independent across two concurrent ones
 *   - total send time capped at 2,000 ms with a fetch stub that hangs
 *   - no fetch at 700 ms remaining; a 500 ms abort deadline at 1,000 ms
 *   - a throwing handler still throws the same error after capture
 *   - near_timeout fires once
 *   - a non-Error PostgREST shape sends only message and pg_code
 *   - release survives the scrub
 *   - health.js: simulate with INTERNAL_AUDIT_KEY unset or empty is 403, a
 *     thrown error is exactly 500 {"error":"internal"}, healthy and
 *     degraded shapes
 *
 * Nothing here reaches the network: global fetch is replaced by a stub for
 * the whole run, the DSN points at sentry.example.com, and health.js gets a
 * fake Supabase client. The suite takes about 3 seconds because two cases
 * wait out a real 2,000 ms and 500 ms abort deadline.
 */
const assert = require('assert')
const path = require('path')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const fixture = require('./fixtures/observability-pii.json')
const obs = require(path.join(FN, '_observability.js'))
const health = require(path.join(FN, 'health.js'))

const { withObservability, captureException, captureMessage, scrubEvent, parseDsn, _internal } = obs

const FAKE_DSN = 'https://examplepublickey@sentry.example.com/42'
const HEX40 = '0123456789abcdef0123456789abcdef01234567'

// ── fetch stub ──────────────────────────────────────────────────────────────
const realFetch = global.fetch
const sent = []
let fetchMode = 'ok'        // 'ok' | 'hang' | 'reject' | 'status500'
global.fetch = (url, opts) => {
  const call = { url, opts, at: Date.now(), abortedAt: null }
  sent.push(call)
  if (fetchMode === 'reject') return Promise.reject(new Error('network down'))
  if (fetchMode === 'status500') return Promise.resolve({ ok: false, status: 500 })
  if (fetchMode === 'hang') {
    return new Promise((_, reject) => {
      const sig = opts && opts.signal
      if (sig) sig.addEventListener('abort', () => {
        call.abortedAt = Date.now()
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      })
    })
  }
  return Promise.resolve({ ok: true, status: 200 })
}

function resetFetch(mode) {
  sent.length = 0
  fetchMode = mode || 'ok'
}

function envelopeEvent(call) {
  const lines = String(call.opts.body).split('\n')
  return JSON.parse(lines[2])
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ctxWith = (ms) => ({ getRemainingTimeInMillis: () => ms })

// Quiet the module's own warn and error lines; they are asserted nowhere.
const realWarn = console.warn
const realError = console.error
console.warn = () => {}
console.error = () => {}

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

// ── fake Supabase for health.js ─────────────────────────────────────────────
function fakeSupabase({ other, watchdog, fail = false, hang = false }) {
  return {
    rpc: async () => ({ data: true, error: null }),
    from() {
      const state = { job: null, neq: null }
      const chain = {
        select() { return chain },
        neq(_c, v) { state.neq = v; return chain },
        eq(_c, v) { state.job = v; return chain },
        order() { return chain },
        limit() { return chain },
        abortSignal() { return chain },
        then(resolve, reject) {
          if (hang) return new Promise(() => {}).then(resolve, reject)
          if (fail) return Promise.resolve({ data: null, error: { message: 'boom' } }).then(resolve, reject)
          const rows = state.job === 'obs-watchdog' ? watchdog : other
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
        },
      }
      return chain
    },
  }
}

;(async () => {
  console.log('fixture and patterns')

  await check('fixture patterns block equals PATTERNS', () => {
    const want = Object.keys(fixture.patterns).sort()
    const have = Object.keys(_internal.PATTERNS).sort()
    assert.deepStrictEqual(have, want)
    for (const k of want) {
      assert.strictEqual(_internal.PATTERNS[k].source, fixture.patterns[k].source, `source of ${k}`)
      assert.strictEqual(_internal.PATTERNS[k].flags, fixture.patterns[k].flags, `flags of ${k}`)
    }
  })

  for (const c of fixture.cases) {
    await check(`scrub: ${c.name}`, () => assert.deepStrictEqual(scrubEvent(c.input), c.expected))
  }

  await check('scrub does not mutate its input', () => {
    const input = { message: 'to ops@example.com', user: { id: 1 } }
    scrubEvent(input)
    assert.deepStrictEqual(input, { message: 'to ops@example.com', user: { id: 1 } })
  })

  await check('release survives the scrub (40-hex sha)', () => {
    assert.strictEqual(scrubEvent({ release: HEX40, message: HEX40 }).release, HEX40)
    assert.strictEqual(scrubEvent({ release: HEX40, message: HEX40 }).message, '[secret]')
  })

  console.log('DSN')

  await check('parseDsn accepts a well formed DSN and rejects junk', () => {
    assert.deepStrictEqual(parseDsn(FAKE_DSN), { origin: 'https://sentry.example.com', projectId: '42', publicKey: 'examplepublickey' })
    for (const bad of [undefined, null, '', '   ', 'not a url', 'https://sentry.example.com/42', 'https://k@sentry.example.com/abc', 'ftp://k@sentry.example.com/42']) {
      assert.strictEqual(parseDsn(bad), null, `should reject ${JSON.stringify(bad)}`)
    }
  })

  console.log('wrapper and sending')

  await check('no DSN: a wrapped capture makes no network call', async () => {
    resetFetch('ok')
    delete process.env.SENTRY_DSN
    const h = withObservability('t-nodsn', async () => {
      await captureException(new Error('x'), { fn: 't-nodsn' })
      await captureMessage('m', 'error', { fn: 't-nodsn' })
      return { statusCode: 200 }
    })
    const r = await h({}, ctxWith(10000))
    assert.strictEqual(r.statusCode, 200)
    assert.strictEqual(sent.length, 0)
  })

  await check('unparseable DSN: no network call', async () => {
    resetFetch('ok')
    process.env.SENTRY_DSN = 'garbage'
    const h = withObservability('t-bad', async () => { await captureException(new Error('x'), { fn: 't-bad' }); return 1 })
    await h({}, ctxWith(10000))
    assert.strictEqual(sent.length, 0)
  })

  process.env.SENTRY_DSN = FAKE_DSN

  await check('capture outside a wrapped invocation sends nothing', async () => {
    resetFetch('ok')
    await captureException(new Error('x'), { fn: 'loose' })
    await captureMessage('x', 'error', { fn: 'loose' })
    assert.strictEqual(sent.length, 0)
  })

  await check('envelope: URL, headers and the three-line body', async () => {
    resetFetch('ok')
    const h = withObservability('t-env', async () => {
      await captureException(new Error('insert failed for ops@example.com'), { fn: 't-env', tags: { reason: 'insert_error', llm: 'claude' }, extra: { count: 2, obj: { no: 1 } } })
      return 1
    })
    await h({ body: 'REQUEST BODY MUST NOT LEAK', headers: { authorization: 'Bearer abc' } }, ctxWith(10000))
    assert.strictEqual(sent.length, 1)
    const call = sent[0]
    assert.strictEqual(call.url, 'https://sentry.example.com/api/42/envelope/')
    assert.strictEqual(call.opts.method, 'POST')
    assert.strictEqual(call.opts.headers['Content-Type'], 'application/x-sentry-envelope')
    assert.strictEqual(call.opts.headers['X-Sentry-Auth'], 'Sentry sentry_version=7, sentry_key=examplepublickey, sentry_client=brandgeo-obs/1')
    const lines = String(call.opts.body).split('\n')
    assert.strictEqual(lines.length, 3)
    const head = JSON.parse(lines[0])
    const item = JSON.parse(lines[1])
    const ev = JSON.parse(lines[2])
    assert.strictEqual(item.type, 'event')
    assert.strictEqual(head.event_id, ev.event_id)
    assert.ok(/^[0-9a-f]{32}$/.test(ev.event_id))
    assert.ok(typeof head.sent_at === 'string')
    assert.strictEqual(ev.platform, 'node')
    assert.strictEqual(ev.level, 'error')
    assert.strictEqual(ev.environment, 'production')
    assert.ok(ev.release === null || /^[0-9a-f]{40}$/.test(ev.release))
    assert.deepStrictEqual(ev.tags, { reason: 'insert_error', llm: 'claude', fn: 't-env' })
    assert.deepStrictEqual(ev.extra, { count: 2 })
    assert.strictEqual(ev.exception.values[0].type, 'Error')
    assert.strictEqual(ev.exception.values[0].value, 'insert failed for [email]')
    assert.ok(Array.isArray(ev.exception.values[0].stacktrace.frames))
    assert.ok(!String(call.opts.body).includes('REQUEST BODY MUST NOT LEAK'))
    assert.ok(!String(call.opts.body).includes('Bearer abc'))
  })

  await check('captureMessage: warning stays warning, anything else is error', async () => {
    resetFetch('ok')
    const h = withObservability('t-lvl', async () => {
      await captureMessage('w', 'warning', { fn: 't-lvl' })
      await captureMessage('e', 'info', { fn: 't-lvl' })
      return 1
    })
    await h({}, ctxWith(10000))
    assert.deepStrictEqual(sent.map((c) => envelopeEvent(c).level), ['warning', 'error'])
  })

  await check('5-event cap per invocation', async () => {
    resetFetch('ok')
    const h = withObservability('t-cap', async () => {
      for (let i = 0; i < 8; i++) await captureMessage(`m${i}`, 'error', { fn: 't-cap' })
      return 1
    })
    await h({}, ctxWith(10000))
    assert.strictEqual(sent.length, 5)
  })

  await check('two concurrent invocations each get their own 5-event cap', async () => {
    resetFetch('ok')
    const mk = (name) => withObservability(name, async () => {
      for (let i = 0; i < 7; i++) {
        await captureMessage(`m${i}`, 'error', { fn: name })
        await sleep(1)
      }
      return 1
    })
    await Promise.all([mk('t-a')({}, ctxWith(10000)), mk('t-b')({}, ctxWith(10000))])
    const byFn = sent.reduce((acc, c) => { const f = envelopeEvent(c).tags.fn; acc[f] = (acc[f] || 0) + 1; return acc }, {})
    assert.deepStrictEqual(byFn, { 't-a': 5, 't-b': 5 })
  })

  await check('a send that rejects or answers 500 never breaks the caller', async () => {
    for (const mode of ['reject', 'status500']) {
      resetFetch(mode)
      const h = withObservability('t-rej', async () => { await captureMessage('x', 'error', { fn: 't-rej' }); return 'fine' })
      assert.strictEqual(await h({}, ctxWith(10000)), 'fine')
      assert.strictEqual(sent.length, 1)
    }
  })

  await check('700 ms remaining: no fetch (deadline 200 ms, under the 300 ms floor)', async () => {
    resetFetch('ok')
    const h = withObservability('t-700', async () => { await captureException(new Error('x'), { fn: 't-700' }); return 1 })
    await h({}, ctxWith(700))
    assert.strictEqual(sent.length, 0)
    assert.strictEqual(_internal.computeDeadline({ remaining: () => 700, send_ms_spent: 0 }), 200)
  })

  await check('1,000 ms remaining: sends with a 500 ms abort deadline', async () => {
    resetFetch('hang')
    assert.strictEqual(_internal.computeDeadline({ remaining: () => 1000, send_ms_spent: 0 }), 500)
    const h = withObservability('t-1000', async () => { await captureException(new Error('x'), { fn: 't-1000' }); return 1 })
    const t0 = Date.now()
    await h({}, ctxWith(1000))
    const took = Date.now() - t0
    assert.strictEqual(sent.length, 1)
    assert.ok(sent[0].abortedAt !== null, 'the request was aborted')
    const abortAfter = sent[0].abortedAt - sent[0].at
    assert.ok(abortAfter >= 450 && abortAfter < 900, `aborted after ${abortAfter} ms`)
    assert.ok(took < 1000, `invocation took ${took} ms`)
  })

  await check('hanging fetch: total send time per invocation never exceeds 2,000 ms', async () => {
    resetFetch('hang')
    const seq = withObservability('t-seq', async () => {
      for (let i = 0; i < 4; i++) await captureMessage(`m${i}`, 'error', { fn: 't-seq' })
      return 1
    })
    const par = withObservability('t-par', async () => {
      await Promise.all([0, 1, 2, 3].map((i) => captureMessage(`p${i}`, 'error', { fn: 't-par' })))
      return 1
    })
    const t0 = Date.now()
    await Promise.all([seq({}, ctxWith(60000)), par({}, ctxWith(60000))])
    const took = Date.now() - t0
    const byFn = sent.reduce((acc, c) => { const f = envelopeEvent(c).tags.fn; acc[f] = (acc[f] || 0) + 1; return acc }, {})
    assert.deepStrictEqual(byFn, { 't-seq': 1, 't-par': 1 }, 'the first send reserves the whole 2,000 ms, the rest are skipped')
    assert.ok(took >= 1900 && took < 2600, `took ${took} ms`)
    for (const c of sent) assert.ok(c.abortedAt - c.at <= 2100, 'each abort lands by the 2,000 ms cap')
  })

  await check('a throwing handler still throws the same error after capture', async () => {
    resetFetch('ok')
    const boom = new Error('boom')
    const h = withObservability('t-throw', async () => { throw boom })
    let caught = null
    try { await h({}, ctxWith(10000)) } catch (e) { caught = e }
    assert.strictEqual(caught, boom)
    assert.strictEqual(sent.length, 1)
    const ev = envelopeEvent(sent[0])
    assert.strictEqual(ev.tags.reason, 'unhandled')
    assert.strictEqual(ev.tags.fn, 't-throw')
    assert.strictEqual(ev.exception.values[0].value, 'boom')
  })

  await check('a throwing handler with no DSN still throws the same error', async () => {
    resetFetch('ok')
    delete process.env.SENTRY_DSN
    const boom = new Error('boom')
    const h = withObservability('t-throw2', async () => { throw boom })
    let caught = null
    try { await h({}, ctxWith(10000)) } catch (e) { caught = e }
    process.env.SENTRY_DSN = FAKE_DSN
    assert.strictEqual(caught, boom)
    assert.strictEqual(sent.length, 0)
  })

  await check('near_timeout fires once, as a warning', async () => {
    resetFetch('ok')
    // remaining 1,700 ms: the timer fires at 200 ms; the handler runs 600 ms.
    const h = withObservability('t-near', async () => { await sleep(600); return 1 })
    await h({}, ctxWith(1700))
    assert.strictEqual(sent.length, 1)
    const ev = envelopeEvent(sent[0])
    assert.strictEqual(ev.message, 'near_timeout')
    assert.strictEqual(ev.level, 'warning')
    assert.strictEqual(ev.tags.fn, 't-near')
  })

  await check('near_timeout does not fire when the handler finishes first', async () => {
    resetFetch('ok')
    const h = withObservability('t-fast', async () => 1)
    await h({}, ctxWith(1700))
    await sleep(300)
    assert.strictEqual(sent.length, 0)
  })

  for (const c of fixture.server_capture_cases) {
    await check(`non-Error capture: ${c.name}`, async () => {
      resetFetch('ok')
      const h = withObservability('t-pg', async () => { await captureException(c.input, { fn: 't-pg' }); return 1 })
      await h({}, ctxWith(10000))
      assert.strictEqual(sent.length, 1)
      const ev = envelopeEvent(sent[0])
      assert.deepStrictEqual(ev.exception.values[0], c.expected.exception)
      if (c.expected.pg_code === null) assert.ok(!('pg_code' in ev.tags))
      else assert.strictEqual(ev.tags.pg_code, c.expected.pg_code)
      const raw = String(sent[0].opts.body)
      for (const s of c.must_not_contain) assert.ok(!raw.includes(s), `body must not contain ${s}`)
      assert.ok(!('extra' in ev), 'nothing from the error object reaches extra')
    })
  }

  console.log('health.js')

  delete process.env.IP_HASH_PEPPER
  const now = new Date('2026-11-01T12:00:00Z')
  const fresh = '2026-11-01T11:30:00Z'
  const stale = '2026-11-01T06:00:00Z'
  const deps = (sb) => ({ getSupabase: () => sb, now: () => now, sleep: async () => {} })
  const get = (q, headers) => ({ httpMethod: 'GET', queryStringParameters: q || {}, headers: headers || {} })

  await check('simulate=error with INTERNAL_AUDIT_KEY unset answers 403', async () => {
    delete process.env.INTERNAL_AUDIT_KEY
    const r = await health.handle(get({ simulate: 'error' }, { 'x-internal-key': 'anything' }), deps(fakeSupabase({ other: [], watchdog: [] })))
    assert.strictEqual(r.statusCode, 403)
    assert.strictEqual(r.body, JSON.stringify({ error: 'forbidden' }))
  })

  await check('simulate=error with INTERNAL_AUDIT_KEY empty answers 403', async () => {
    process.env.INTERNAL_AUDIT_KEY = ''
    for (const key of ['', 'anything', undefined]) {
      const r = await health.handle(get({ simulate: 'error' }, key === undefined ? {} : { 'x-internal-key': key }), deps(fakeSupabase({ other: [], watchdog: [] })))
      assert.strictEqual(r.statusCode, 403)
    }
  })

  await check('simulate with a wrong key answers 403', async () => {
    process.env.INTERNAL_AUDIT_KEY = 'test-internal-key-placeholder'
    const r = await health.handle(get({ simulate: 'timeout' }, { 'x-internal-key': 'wrong' }), deps(fakeSupabase({ other: [], watchdog: [] })))
    assert.strictEqual(r.statusCode, 403)
  })

  await check('simulate=error with the right key: exactly 500 {"error":"internal"}', async () => {
    process.env.INTERNAL_AUDIT_KEY = 'test-internal-key-placeholder'
    const r = await health.handle(get({ simulate: 'error' }, { 'X-Internal-Key': 'test-internal-key-placeholder' }), deps(fakeSupabase({ other: [], watchdog: [] })))
    assert.strictEqual(r.statusCode, 500)
    assert.strictEqual(r.body, '{"error":"internal"}')
  })

  await check('a thrown error inside health.js answers exactly 500 {"error":"internal"}', async () => {
    const r = await health.handle(get(), { getSupabase: () => { throw new Error('postgres://user:pw@host/db') }, now: () => now })
    assert.strictEqual(r.statusCode, 500)
    assert.strictEqual(r.body, '{"error":"internal"}')
    assert.strictEqual(r.headers['Cache-Control'], 'no-store')
  })

  await check('a thrown error through the wrapped handler is also 500 and is reported once', async () => {
    resetFetch('ok')
    process.env.INTERNAL_AUDIT_KEY = 'test-internal-key-placeholder'
    // The exported handler uses the real Supabase factory; the simulate gate
    // throws before any query, and the rate check is skipped (no pepper).
    process.env.SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
    const r = await health.handler(get({ simulate: 'error' }, { 'x-internal-key': 'test-internal-key-placeholder' }), ctxWith(10000))
    assert.strictEqual(r.statusCode, 500)
    assert.strictEqual(r.body, '{"error":"internal"}')
    assert.strictEqual(sent.length, 1)
    assert.strictEqual(envelopeEvent(sent[0]).tags.reason, 'internal')
  })

  await check('POST answers 405 with Allow: GET, HEAD', async () => {
    const r = await health.handle({ httpMethod: 'POST', headers: {} }, deps(fakeSupabase({ other: [], watchdog: [] })))
    assert.strictEqual(r.statusCode, 405)
    assert.strictEqual(r.headers.Allow, 'GET, HEAD')
  })

  await check('healthy: 200 ok with the three checks; no watchdog row reads null', async () => {
    const r = await health.handle(get(), deps(fakeSupabase({ other: [{ ran_at: fresh }], watchdog: [] })))
    assert.strictEqual(r.statusCode, 200)
    const b = JSON.parse(r.body)
    assert.strictEqual(b.status, 'ok')
    assert.strictEqual(b.time, now.toISOString())
    assert.ok('commit' in b && 'built_at' in b)
    assert.strictEqual(b.checks.supabase.ok, true)
    assert.deepStrictEqual(b.checks.jobs, { ok: true, newest_age_s: 1800, max_age_s: 10800 })
    assert.deepStrictEqual(b.checks.watchdog, { ok: null, age_s: null, max_age_s: 10800 })
  })

  await check('degraded: a stale job and a failed watchdog answer 503', async () => {
    const r = await health.handle(get(), deps(fakeSupabase({ other: [{ ran_at: stale }], watchdog: [{ ran_at: fresh, ok: false }] })))
    assert.strictEqual(r.statusCode, 503)
    const b = JSON.parse(r.body)
    assert.strictEqual(b.status, 'degraded')
    assert.strictEqual(b.checks.jobs.ok, false)
    assert.strictEqual(b.checks.watchdog.ok, false)
  })

  await check('degraded: a Supabase error answers 503 with no driver message', async () => {
    const r = await health.handle(get(), deps(fakeSupabase({ fail: true })))
    assert.strictEqual(r.statusCode, 503)
    assert.ok(!r.body.includes('boom'))
    assert.deepStrictEqual(JSON.parse(r.body).checks.supabase, { ok: false, ms: null })
  })

  await check('HEAD answers with an empty body', async () => {
    const r = await health.handle({ httpMethod: 'HEAD', headers: {} }, deps(fakeSupabase({ other: [{ ran_at: fresh }], watchdog: [] })))
    assert.strictEqual(r.statusCode, 200)
    assert.strictEqual(r.body, '')
  })

  global.fetch = realFetch
  console.warn = realWarn
  console.error = realError
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures === 0 ? 0 : 1)
})().catch((e) => {
  console.warn = realWarn
  console.error = realError
  console.error('test harness crashed:', e)
  process.exit(1)
})
