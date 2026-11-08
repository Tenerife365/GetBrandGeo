/**
 * phase1_server_hardening.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/phase1_server_hardening.test.js
 *
 * Phase 1, part A (2026-11-08). Covers:
 *   1. get-subscription.js: requireAuth now receives the body's client_id, so
 *      a viewer can no longer read another client's subscription (IDOR).
 *   2. collect-prompt.js: engines come from the clients row (plan plus
 *      engines_enabled), the body can only narrow them, and force is honoured
 *      for admins only (force_ignored: true otherwise).
 *   3. collection-worker-background.js and run-full-audit-background.js: the
 *      internal key check fails CLOSED (503 unset, 401 missing or wrong) and
 *      the handler returns before any database client is even created.
 *   4. _auth.js: the monthly cost_eur sums are one rpc('sum_cost_eur') call
 *      each (no row cap, no page ceiling), an error or a null or non-numeric
 *      result blocks with 'budget_unverifiable' instead of reading as zero
 *      spend, and a caller-supplied platformSpent skips the platform query.
 *
 * Nothing touches the network: @supabase/supabase-js and _collect.js are
 * replaced in require.cache BEFORE any function module is loaded.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN
delete process.env.STRIPE_SECRET_KEY
delete process.env.INTERNAL_AUDIT_KEY

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

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}

// ── Fake Supabase: a thenable builder that records every query ──────────────
// dbHandler(state) answers a query. state = { table, op, cols, head, filters,
// range, single }. The handler is swapped per test.
let dbHandler = () => ({ data: null, error: null })
const dbLog = []
const createClientCalls = { n: 0 }
const AUTH_USERS = {
  'tok-admin':  { id: 'user-admin' },
  'tok-viewer': { id: 'user-viewer' },
}
const PROFILES = {
  'user-admin':  { role: 'admin',  client_id: null },
  'user-viewer': { role: 'viewer', client_id: 42 },
}

function makeBuilder(table) {
  const st = { table, op: 'select', cols: null, head: false, filters: [], range: null, single: false }
  const b = {
    select(cols, opts) { st.cols = cols; st.head = !!(opts && opts.head); return b },
    delete() { st.op = 'delete'; return b },
    insert(rows) { st.op = 'insert'; st.rows = rows; return b },
    upsert(rows) { st.op = 'upsert'; st.rows = rows; return b },
    update(v) { st.op = 'update'; st.values = v; return b },
    eq(k, v) { st.filters.push(['eq', k, v]); return b },
    neq(k, v) { st.filters.push(['neq', k, v]); return b },
    gte(k, v) { st.filters.push(['gte', k, v]); return b },
    lte(k, v) { st.filters.push(['lte', k, v]); return b },
    in(k, v) { st.filters.push(['in', k, v]); return b },
    order(k, o) { st.order = [k, o]; return b },
    range(a, z) { st.range = [a, z]; return b },
    single() { st.single = true; return b },
    maybeSingle() { st.single = true; return b },
    then(res, rej) {
      dbLog.push(st)
      return Promise.resolve().then(() => dbHandler(st)).then(res, rej)
    },
  }
  return b
}

function fakeDb() {
  return {
    from: (table) => {
      if (table === 'user_profiles') {
        // requireAuth's profile read, keyed by the eq('id', ...) filter.
        const b = makeBuilder(table)
        b.eq = (k, v) => {
          b.then = (res, rej) => Promise.resolve({ data: PROFILES[v] || null, error: null }).then(res, rej)
          return b
        }
        return b
      }
      return makeBuilder(table)
    },
    // rpc calls go through the same handler, as { rpc: name, args }.
    rpc: (fn, args) => {
      const st = { table: null, rpc: fn, args, op: 'rpc', filters: [] }
      dbLog.push(st)
      return Promise.resolve().then(() => dbHandler(st))
    },
    auth: {
      async getUser(token) {
        const user = AUTH_USERS[token]
        return user ? { data: { user }, error: null } : { data: { user: null }, error: { message: 'invalid' } }
      },
    },
  }
}

const supabasePath = require.resolve('@supabase/supabase-js', { paths: [FN] })
installModule(supabasePath, {
  createClient() { createClientCalls.n++; return fakeDb() },
})

const collectCalls = []
installModule(require.resolve(path.join(FN, '_collect.js')), {
  async collectEngines(engines, opts) {
    collectCalls.push({ engines: engines.slice(), opts })
    const rows = engines.map(llm => ({ llm, prompt_id: opts.prompt_id, client_id: opts.client_id, status: 'ok' }))
    const summary = Object.fromEntries(engines.map(e => [e, 'ok']))
    return { rows, summary, ctx: 'You are a user based in Testland.' }
  },
})

// Real modules under test that must see the REAL _auth.js.
const realAuth = require(path.join(FN, '_auth.js'))
const { sumCostEur, checkCollectionLimits, monthStartIso } = realAuth
const { PLAN_MONTHLY_API_BUDGET_EUR, activeEnginesFor } = require(path.join(FN, '_cost.js'))
const getSubscription = require(path.join(FN, 'get-subscription.js'))
const worker = require(path.join(FN, 'collection-worker-background.js'))
const fullAudit = require(path.join(FN, 'run-full-audit-background.js'))
const seoCrawl = require(path.join(FN, 'seo-crawl-background.js'))

// collect-prompt gets a scripted requireAuth (no JWT round trip) and an open
// limits gate; its own server-side plan lookup goes through the fake DB.
installModule(require.resolve(path.join(FN, '_auth.js')), {
  ...realAuth,
  checkCollectionLimits: async () => ({ blocked: false }),
  async requireAuth(event) {
    const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : ''
    const user = AUTH_USERS[token]
    if (!user) return { response: { statusCode: 401, headers: {}, body: JSON.stringify({ error: 'Unauthorized' }) } }
    return { user, profile: PROFILES[user.id], supabase: fakeDb(), headers: { 'Content-Type': 'application/json' } }
  },
})
const collectPrompt = require(path.join(FN, 'collect-prompt.js'))

// Quiet the functions' own console.warn / console.error during the run.
const realWarn = console.warn
const realError = console.error
const realLogFn = console.log
const quiet = () => { console.warn = () => {}; console.error = () => {} }
const loud = () => { console.warn = realWarn; console.error = realError }

function resetDb(handler) {
  dbHandler = handler
  dbLog.length = 0
  collectCalls.length = 0
}

function filterVal(st, op, key) {
  const f = st.filters.find(x => x[0] === op && x[1] === key)
  return f ? f[2] : undefined
}


;(async () => {
  quiet()
  // Function logs use console.log too; keep ours, drop theirs by prefix.
  console.log = (...args) => {
    const first = String(args[0] || '')
    if (/^\s{2}(ok|FAIL)\s/.test(first) || /^\s{7}/.test(first) || !first.startsWith('[')) realLogFn(...args)
  }

  // ════════════════════════════════════════════════════════════════════════
  console.log('collect-prompt resolveEngines (pure)')
  const { resolveEngines, effectiveForce, FAST_ENGINES } = collectPrompt

  await check('no body engines: the plan set, fast engines only (free)', () => {
    assert.deepStrictEqual(resolveEngines('free', null, undefined), ['gemini'])
  })
  await check('no body engines: growth plan fast set, never chatgpt or claude', () => {
    const got = resolveEngines('growth', null, undefined)
    assert.deepStrictEqual(got, ['gemini', 'perplexity', 'google_ai'])
    const expected = FAST_ENGINES.filter(e => activeEnginesFor('growth', null).includes(e))
    assert.deepStrictEqual(got, expected)
  })
  await check('empty body array behaves like no body engines', () => {
    assert.deepStrictEqual(resolveEngines('growth', null, []), ['gemini', 'perplexity', 'google_ai'])
  })
  await check('body narrows: growth with [perplexity] -> [perplexity]', () => {
    assert.deepStrictEqual(resolveEngines('growth', null, ['perplexity']), ['perplexity'])
  })
  await check('body cannot widen: free asking google_ai, grok, perplexity -> []', () => {
    assert.deepStrictEqual(resolveEngines('free', null, ['google_ai', 'grok', 'perplexity']), [])
  })
  await check('body intersection keeps only allowed: free asking gemini + google_ai -> [gemini]', () => {
    assert.deepStrictEqual(resolveEngines('free', null, ['google_ai', 'gemini']), ['gemini'])
  })
  await check('engines_enabled false removes an engine (empty set for free)', () => {
    assert.deepStrictEqual(resolveEngines('free', { gemini: false }, undefined), [])
    assert.deepStrictEqual(resolveEngines('growth', { google_ai: false }, undefined), ['gemini', 'perplexity'])
  })
  await check('engines_enabled true cannot add an engine beyond the plan', () => {
    assert.deepStrictEqual(resolveEngines('free', { perplexity: true }, undefined), ['gemini'])
  })
  await check('retired meta is never resolved even when the body asks', () => {
    assert.deepStrictEqual(resolveEngines('enterprise', null, ['meta']), [])
  })
  await check('non-array body value is ignored (plan set)', () => {
    assert.deepStrictEqual(resolveEngines('free', null, 'google_ai'), ['gemini'])
  })

  console.log('collect-prompt effectiveForce (pure)')
  await check('admin + true -> true', () => assert.strictEqual(effectiveForce('admin', true), true))
  await check('admin + false / undefined -> false', () => {
    assert.strictEqual(effectiveForce('admin', false), false)
    assert.strictEqual(effectiveForce('admin', undefined), false)
  })
  await check('viewer + true -> false', () => assert.strictEqual(effectiveForce('viewer', true), false))
  await check('admin + truthy non-boolean -> false', () => {
    assert.strictEqual(effectiveForce('admin', 'true'), false)
    assert.strictEqual(effectiveForce('admin', 1), false)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('collect-prompt handler, end to end with fake DB')
  const basePayload = {
    prompt_id: 7, prompt_text: 'best dentist near me', client_id: 42,
    client_config: { brand_aliases: ['Acme'], brand_website: 'acme.example', known_competitors: [] },
  }
  function postPrompt(token, extra) {
    return collectPrompt.handler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify({ ...basePayload, ...extra }),
    }, {})
  }
  // clientsRow: the clients lookup answer. alreadyRan: llm ids with an ok row this month.
  function promptDb({ clientsRow, alreadyRan = [], clientErr = null }) {
    return (st) => {
      if (st.table === 'clients') return { data: clientsRow, error: clientErr }
      if (st.table === 'ai_results' && st.op === 'select') {
        if (filterVal(st, 'in', 'llm')) return { data: [], error: null }  // monthly cap read
        return { data: alreadyRan.map(llm => ({ llm })), error: null }     // non-force skip read
      }
      if (st.table === 'ai_results' && st.op === 'delete') return { error: null }
      if (st.table === 'ai_results' && st.op === 'insert') return { error: null }
      return { data: null, error: null }
    }
  }

  await check('no body engines on growth: runs the plan fast set, not all six', async () => {
    resetDb(promptDb({ clientsRow: { plan: 'growth', engines_enabled: null } }))
    const res = await postPrompt('tok-viewer', {})
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(collectCalls.length, 1)
    assert.deepStrictEqual(collectCalls[0].engines, ['gemini', 'perplexity', 'google_ai'])
    assert.strictEqual(JSON.parse(res.body).done, true)
  })

  await check('free client asking google_ai: skipped no_engines_for_plan, no engine, no ai_results read', async () => {
    resetDb(promptDb({ clientsRow: { plan: 'free', engines_enabled: null } }))
    const res = await postPrompt('tok-viewer', { active_engines: ['google_ai'] })
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.reason, 'no_engines_for_plan')
    assert.strictEqual(body.prompt_id, 7)
    assert.strictEqual(collectCalls.length, 0)
    assert.strictEqual(dbLog.filter(s => s.table === 'ai_results').length, 0)
  })

  await check('missing client row: 404, no engine', async () => {
    resetDb(promptDb({ clientsRow: null }))
    const res = await postPrompt('tok-admin', {})
    assert.strictEqual(res.statusCode, 404)
    assert.strictEqual(collectCalls.length, 0)
  })

  await check('client lookup error: 500, no engine (never falls back to all engines)', async () => {
    resetDb(promptDb({ clientsRow: null, clientErr: { message: 'boom' } }))
    const res = await postPrompt('tok-admin', {})
    assert.strictEqual(res.statusCode, 500)
    assert.strictEqual(collectCalls.length, 0)
  })

  await check('viewer + force on a cell that already ran: no delete, skipped, force_ignored', async () => {
    resetDb(promptDb({ clientsRow: { plan: 'growth', engines_enabled: null }, alreadyRan: ['perplexity'] }))
    const res = await postPrompt('tok-viewer', { force: true, active_engines: ['perplexity'] })
    assert.strictEqual(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.skipped, true)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(dbLog.filter(s => s.op === 'delete').length, 0, 'no delete for a viewer')
    assert.strictEqual(collectCalls.length, 0)
  })

  await check('viewer + force on a fresh cell: runs normally, force_ignored on the done body', async () => {
    resetDb(promptDb({ clientsRow: { plan: 'growth', engines_enabled: null } }))
    const res = await postPrompt('tok-viewer', { force: true, active_engines: ['gemini'] })
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, true)
    assert.strictEqual(body.force_ignored, true)
    assert.strictEqual(dbLog.filter(s => s.op === 'delete').length, 0)
    assert.deepStrictEqual(collectCalls[0].engines, ['gemini'])
  })

  await check('admin + force: deletes and reruns only the server-allowed set', async () => {
    resetDb(promptDb({ clientsRow: { plan: 'growth', engines_enabled: null }, alreadyRan: ['perplexity'] }))
    const res = await postPrompt('tok-admin', { force: true, active_engines: ['perplexity', 'grok'] })
    const body = JSON.parse(res.body)
    assert.strictEqual(body.done, true)
    assert.ok(!('force_ignored' in body))
    const dels = dbLog.filter(s => s.op === 'delete')
    assert.strictEqual(dels.length, 1)
    assert.deepStrictEqual(filterVal(dels[0], 'in', 'llm'), ['perplexity'], 'grok is not on growth, never deleted')
    assert.deepStrictEqual(collectCalls[0].engines, ['perplexity'])
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('get-subscription ownership (real requireAuth over the fake DB)')
  function postSub(token, body, method = 'POST') {
    return getSubscription.handler({
      httpMethod: method,
      headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }
  const subDb = (st) => {
    if (st.table === 'clients') return { data: { stripe_subscription_id: null, plan: 'growth' }, error: null }
    return { data: null, error: null }
  }

  await check('viewer reading ANOTHER client: 403 client mismatch, clients never read', async () => {
    resetDb(subDb)
    const res = await postSub('tok-viewer', { client_id: 99 })
    assert.strictEqual(res.statusCode, 403)
    assert.match(JSON.parse(res.body).error, /client mismatch/)
    assert.strictEqual(dbLog.filter(s => s.table === 'clients').length, 0)
  })
  await check('viewer reading OWN client: 200, unchanged shape', async () => {
    resetDb(subDb)
    const res = await postSub('tok-viewer', { client_id: 42 })
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { active: false, plan: 'growth' })
  })
  await check('admin reading any client: 200', async () => {
    resetDb(subDb)
    const res = await postSub('tok-admin', { client_id: 99 })
    assert.strictEqual(res.statusCode, 200)
  })
  await check('no token: 401', async () => {
    resetDb(subDb)
    const res = await postSub('nope', { client_id: 42 })
    assert.strictEqual(res.statusCode, 401)
  })
  await check('OPTIONS preflight: 204', async () => {
    const res = await postSub('', '', 'OPTIONS')
    assert.strictEqual(res.statusCode, 204)
  })
  await check('GET: 405; bad JSON: 400; missing client_id: 400', async () => {
    assert.strictEqual((await postSub('tok-viewer', '', 'GET')).statusCode, 405)
    assert.strictEqual((await postSub('tok-viewer', '{not json')).statusCode, 400)
    assert.strictEqual((await postSub('tok-viewer', {})).statusCode, 400)
    assert.strictEqual((await postSub('tok-viewer', 'null')).statusCode, 400)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('_auth.js sumCostEur over rpc(sum_cost_eur)')
  function rpcDb(answer) {
    const calls = []
    return {
      calls,
      sb: { rpc: (fn, args) => { calls.push([fn, args]); return typeof answer === 'function' ? answer(fn, args) : Promise.resolve(answer) } },
    }
  }
  const SINCE = '2026-11-01T00:00:00.000Z'

  await check('client sum: one rpc call, exact name and args, numeric result', async () => {
    const { sb, calls } = rpcDb({ data: 880.75, error: null })
    const res = await sumCostEur(sb, { since: SINCE, clientId: 42 })
    assert.deepStrictEqual(res, { ok: true, sum: 880.75 })
    assert.deepStrictEqual(calls, [['sum_cost_eur', { p_since: SINCE, p_client_id: 42 }]])
  })
  await check('platform sum: p_client_id is null (omitted and explicit null)', async () => {
    const a = rpcDb({ data: 1, error: null })
    await sumCostEur(a.sb, { since: SINCE })
    const b = rpcDb({ data: 1, error: null })
    await sumCostEur(b.sb, { since: SINCE, clientId: null })
    assert.deepStrictEqual(a.calls[0][1], { p_since: SINCE, p_client_id: null })
    assert.deepStrictEqual(b.calls[0][1], { p_since: SINCE, p_client_id: null })
  })
  await check('numeric string result (Postgres numeric) is parsed', async () => {
    const { sb } = rpcDb({ data: '12.3456', error: null })
    assert.deepStrictEqual(await sumCostEur(sb, { since: SINCE }), { ok: true, sum: 12.3456 })
  })
  await check('zero is a real answer, not an error', async () => {
    const { sb } = rpcDb({ data: 0, error: null })
    assert.deepStrictEqual(await sumCostEur(sb, { since: SINCE }), { ok: true, sum: 0 })
  })
  await check('rpc error (for example the function is missing): query_error, never zero', async () => {
    const { sb } = rpcDb({ data: null, error: { message: 'Could not find the function public.sum_cost_eur' } })
    const res = await sumCostEur(sb, { since: SINCE })
    assert.strictEqual(res.ok, false)
    assert.strictEqual(res.reason, 'query_error')
    assert.ok(/sum_cost_eur/.test(res.error))
  })
  await check('null, empty string, non-numeric, boolean and array results are errors', async () => {
    for (const data of [null, undefined, '', '  ', 'abc', true, [], [1], {}, NaN, Infinity]) {
      const { sb } = rpcDb({ data, error: null })
      const res = await sumCostEur(sb, { since: SINCE })
      assert.strictEqual(res.ok, false, `data ${String(data)} must not read as spend`)
      assert.strictEqual(res.reason, 'query_error')
    }
  })
  await check('a throwing or rejecting rpc is a query_error', async () => {
    const t = rpcDb(() => { throw new Error('network down') })
    assert.strictEqual((await sumCostEur(t.sb, { since: SINCE })).reason, 'query_error')
    const r = rpcDb(() => Promise.reject(new Error('socket hang up')))
    assert.strictEqual((await sumCostEur(r.sb, { since: SINCE })).reason, 'query_error')
  })
  await check('the pager and its 50 page ceiling are gone', async () => {
    assert.strictEqual(realAuth.COST_PAGE_SIZE, undefined)
    assert.strictEqual(realAuth.COST_MAX_PAGES, undefined)
    const src = require('fs').readFileSync(path.join(FN, '_auth.js'), 'utf8')
    const code = src.replace(/\/\/.*$/gm, '')
    assert.ok(!/page_ceiling/.test(code), 'no page_ceiling reason left in _auth.js code')
    assert.ok(!/cost_eur\.sum\(\)/.test(code), 'no PostgREST aggregate in code')
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('_auth.js checkCollectionLimits over the fake DB')
  const ESS_BUDGET = PLAN_MONTHLY_API_BUDGET_EUR.essentials
  const PLATFORM_BUDGET = Number(process.env.PLATFORM_MONTHLY_API_BUDGET_EUR || 12000)
  // limitsDb: the two monthly sums are rpc('sum_cost_eur') answers, keyed by
  // whether p_client_id is set.
  function limitsDb({ plan = 'essentials', prompts = 5, hourly = 0, clientSum = 0, platformSum = 0, clientErr = false, platformErr = false }) {
    return (st) => {
      if (st.table === 'clients') return { data: { plan }, error: null }
      if (st.table === 'prompts') return { count: prompts, error: null }
      if (st.table === 'ai_results' && st.head) return { count: hourly, error: null }
      if (st.rpc === 'sum_cost_eur') {
        const isClient = st.args && st.args.p_client_id != null
        if (isClient && clientErr) return { data: null, error: { message: 'statement timeout' } }
        if (!isClient && platformErr) return { data: null, error: { message: 'statement timeout' } }
        return { data: isClient ? clientSum : platformSum, error: null }
      }
      return { data: null, error: null }
    }
  }
  const sb = fakeDb()
  const sumCalls = () => dbLog.filter(s => s.rpc === 'sum_cost_eur')

  await check('client over budget: blocked monthly_budget', async () => {
    resetDb(limitsDb({ clientSum: ESS_BUDGET + 0.01, platformSum: 10 }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'monthly_budget')
  })
  await check('healthy client: not blocked, two rpc calls, client then platform, same month start', async () => {
    resetDb(limitsDb({ clientSum: 2.5, platformSum: 880.75 }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, false)
    assert.strictEqual(res.detail.clientSpent, 2.5)
    assert.strictEqual(res.detail.platformSpent, 880.75)
    const calls = sumCalls()
    assert.strictEqual(calls.length, 2)
    assert.deepStrictEqual(calls[0].args, { p_since: monthStartIso(), p_client_id: 42 })
    assert.deepStrictEqual(calls[1].args, { p_since: monthStartIso(), p_client_id: null })
    assert.strictEqual(dbLog.filter(s => s.table === 'ai_results' && !s.head).length, 0, 'no row reads of ai_results')
  })
  await check('just under the platform ceiling, any row count: not blocked (no page ceiling)', async () => {
    resetDb(limitsDb({ clientSum: 1, platformSum: PLATFORM_BUDGET - 0.01 }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, false)
  })
  await check('platform at its ceiling: blocked platform_budget', async () => {
    resetDb(limitsDb({ clientSum: 1, platformSum: PLATFORM_BUDGET }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'platform_budget')
  })
  await check('client sum error: blocked budget_unverifiable, message carries no euro figure', async () => {
    resetDb(limitsDb({ clientErr: true }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'budget_unverifiable')
    assert.ok(!/EUR|€|\d/.test(res.message), 'no currency and no number in the customer message')
  })
  await check('platform sum error: blocked budget_unverifiable', async () => {
    resetDb(limitsDb({ platformErr: true }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'budget_unverifiable')
  })
  await check('platform sum null: blocked budget_unverifiable, not zero spend', async () => {
    resetDb(limitsDb({ platformSum: null }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'budget_unverifiable')
  })
  await check('platformSpent supplied: platform rpc skipped, client rpc still runs', async () => {
    resetDb(limitsDb({ clientSum: 2.5, platformErr: true }))
    const res = await checkCollectionLimits(sb, 42, { platformSpent: 123.5 })
    assert.strictEqual(res.blocked, false)
    assert.strictEqual(res.detail.platformSpent, 123.5)
    const calls = sumCalls()
    assert.strictEqual(calls.length, 1)
    assert.strictEqual(calls[0].args.p_client_id, 42)
  })
  await check('platformSpent supplied at the ceiling: blocked platform_budget', async () => {
    resetDb(limitsDb({ clientSum: 1 }))
    const res = await checkCollectionLimits(sb, 42, { platformSpent: PLATFORM_BUDGET })
    assert.strictEqual(res.reason, 'platform_budget')
  })
  await check('a bad platformSpent never opens the gate: falls back to querying', async () => {
    for (const bad of [NaN, Infinity, '5', null, undefined, -Infinity]) {
      resetDb(limitsDb({ clientSum: 1, platformErr: true }))
      const res = await checkCollectionLimits(sb, 42, { platformSpent: bad })
      assert.strictEqual(res.reason, 'budget_unverifiable', `platformSpent ${String(bad)} must re-query`)
      assert.strictEqual(sumCalls().length, 2)
    }
  })
  await check('hourly ceiling unchanged: reason, message and short circuit before any sum', async () => {
    resetDb(limitsDb({ prompts: 1, hourly: 150 }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.blocked, true)
    assert.strictEqual(res.reason, 'hourly_ceiling')
    assert.strictEqual(res.message, 'Rate limit exceeded: max 150 LLM calls/hour for this plan. Try again later.')
    assert.strictEqual(sumCalls().length, 0)
  })
  await check('monthly_budget message unchanged in shape', async () => {
    resetDb(limitsDb({ clientSum: ESS_BUDGET }))
    const res = await checkCollectionLimits(sb, 42)
    assert.strictEqual(res.reason, 'monthly_budget')
    assert.strictEqual(res.message, `Monthly API budget exceeded for this plan (EUR ${ESS_BUDGET.toFixed(2)} of EUR ${ESS_BUDGET.toFixed(2)}). Contact support to raise this limit.`)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('internal key gate, worker and full audit')
  const KEY = 'k'.repeat(48)
  const ev = (headers) => ({ httpMethod: 'POST', headers, body: JSON.stringify({ audit_id: 'a1' }) })

  for (const [name, mod] of [['worker', worker], ['full audit', fullAudit], ['seo crawl', seoCrawl]]) {
    await check(`${name}: key unset -> 503, handler returns before createClient`, async () => {
      delete process.env.INTERNAL_AUDIT_KEY
      const before = createClientCalls.n
      dbLog.length = 0
      const res = await mod.handler(ev({ 'x-internal-key': KEY }), {})
      assert.strictEqual(res.statusCode, 503)
      assert.deepStrictEqual(JSON.parse(res.body), { error: 'internal auth not configured' })
      assert.strictEqual(createClientCalls.n, before, 'no Supabase client created')
      assert.strictEqual(dbLog.length, 0)
    })
    await check(`${name}: key empty string -> 503`, async () => {
      process.env.INTERNAL_AUDIT_KEY = ''
      assert.strictEqual(mod.checkInternalKey(ev({ 'x-internal-key': '' })).statusCode, 503)
    })
    await check(`${name}: header missing -> 401`, async () => {
      process.env.INTERNAL_AUDIT_KEY = KEY
      const before = createClientCalls.n
      const res = await mod.handler(ev({}), {})
      assert.strictEqual(res.statusCode, 401)
      assert.strictEqual(createClientCalls.n, before)
    })
    await check(`${name}: wrong key same length -> 401, before createClient`, async () => {
      process.env.INTERNAL_AUDIT_KEY = KEY
      const before = createClientCalls.n
      const res = await mod.handler(ev({ 'x-internal-key': 'j'.repeat(48) }), {})
      assert.strictEqual(res.statusCode, 401)
      assert.strictEqual(createClientCalls.n, before)
    })
    await check(`${name}: wrong key different length -> 401 (no throw)`, async () => {
      process.env.INTERNAL_AUDIT_KEY = KEY
      assert.strictEqual(mod.checkInternalKey(ev({ 'x-internal-key': 'short' })).statusCode, 401)
    })
    await check(`${name}: right key passes (both header casings)`, async () => {
      process.env.INTERNAL_AUDIT_KEY = KEY
      assert.strictEqual(mod.checkInternalKey(ev({ 'x-internal-key': KEY })), null)
      assert.strictEqual(mod.checkInternalKey(ev({ 'X-Internal-Key': KEY })), null)
    })
  }
  delete process.env.INTERNAL_AUDIT_KEY

  loud()
  console.log = realLogFn
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  loud()
  console.log = realLogFn
  console.log('test harness crashed:', e && e.stack ? e.stack : e)
  process.exit(1)
})
