/**
 * platform_activity.test.js: the admin Platform activity function
 * (netlify/functions/platform-activity.js) against the in-memory Supabase
 * fake. Binding spec: docs/arch/platform-activity.md section 9.1.
 *
 * _auth.js is replaced through tests/helpers/affiliate_test_env.js
 * (installAuthMock), and this file adds sumCostEur and monthStartIso to the
 * mock BEFORE the handler is required. @supabase/supabase-js is replaced in
 * require.cache so createClient() returns the fake. The shared fake has no
 * range() and no query spy, so this file adds both on each query it hands
 * out, without touching tests/helpers/:
 *   - range(from, to): sorts by the query's order, skips `from` rows, keeps
 *     to - from + 1;
 *   - a spy that records per builder the table, every method called with its
 *     arguments, and any write (insert, update, upsert, delete);
 *   - every rpc name.
 * Auth users are put straight into db.usersById with their last_sign_in_at,
 * and listUsers pages them (pagedListUsers).
 *
 * Fixtures use invented company names and @example.com addresses only.
 *
 * Run: `node tests/platform_activity.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')

const { installAuthMock, post, parse } = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const { installFakeClock } = require('./helpers/fake_clock')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

// ── clock ───────────────────────────────────────────────────────────────────
let clock = new Date('2026-11-14T12:00:00.000Z')
installFakeClock(() => clock)
const NOW = () => clock.getTime()
const iso = (msv) => new Date(msv).toISOString()
const ago = (h) => iso(NOW() - h * 3600 * 1000)

// ── auth mock ───────────────────────────────────────────────────────────────
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const ADMIN_ID = uid(1)
const V1 = uid(2)       // viewer, client 10
const V2 = uid(3)       // viewer, client 11, signed in 30 h ago
const V3 = uid(4)       // viewer, client 15 (research)
const V4 = uid(5)       // viewer, client 12, never signed in
const NOPROF = uid(6)   // auth user with no profile
const STRANGER = uid(7) // actor with no profile and no auth user
const ALL_USER_IDS = [ADMIN_ID, V1, V2, V3, V4, NOPROF, STRANGER]

const mock = installAuthMock({
  tokens: {
    'admin-jwt': { role: 'admin', user: { id: ADMIN_ID, email: 'admin.person@example.com' }, client_id: 10 },
    'viewer-jwt': { role: 'viewer', user: { id: V1, email: 'viewer.person@example.com' }, client_id: 10 },
  },
})
mock.sumCostEur = async (sb, { since, clientId }) => {
  const { data, error } = await sb.rpc('sum_cost_eur', { p_since: since, p_client_id: clientId ?? null })
  return error ? { ok: false, reason: 'query_error', error: error.message } : { ok: true, sum: Number(data) }
}
mock.monthStartIso = () => {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}

// ── fake supabase with range() and a spy ────────────────────────────────────
let db = null
let queries = []
let rpcNames = []

function cmp(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  return a < b ? -1 : 1
}

function instrument(d) {
  const realFrom = d.from.bind(d)
  d.from = (table) => {
    const q = realFrom(table)
    const rec = { table, calls: [], writes: [] }
    queries.push(rec)
    for (const m of ['select', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt', 'lte', 'order', 'limit', 'single', 'maybeSingle']) {
      const orig = q[m].bind(q)
      q[m] = (...args) => { rec.calls.push([m, ...args]); return orig(...args) }
    }
    for (const m of ['insert', 'update', 'upsert', 'delete']) {
      const orig = q[m].bind(q)
      q[m] = (...args) => { rec.writes.push(m); return orig(...args) }
    }
    q.range = (from, to) => {
      rec.calls.push(['range', from, to])
      q._offset = from
      q.lim = to - from + 1
      return q
    }
    const origFinish = q._finishRows.bind(q)
    q._finishRows = (rows) => {
      if (!q._offset) return origFinish(rows)
      let out = rows
      for (const [c, asc] of q.orders.slice().reverse()) out = out.slice().sort((a, b) => (asc ? 1 : -1) * cmp(a[c], b[c]))
      q.orders = []
      return origFinish(out.slice(q._offset))
    }
    return q
  }
  const realRpc = d.rpc.bind(d)
  d.rpc = (name, args) => { rpcNames.push(name); return realRpc(name, args) }
  return d
}

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient() { return db } })

const mod = require(path.join(FN, 'platform-activity.js'))
const { PLAN_MONTHLY_API_BUDGET_EUR } = require(path.join(FN, '_cost.js'))

// ── harness ─────────────────────────────────────────────────────────────────
let passed = 0
const ok = (n) => { passed++; process.stdout.write(`  ok - ${n}\n`) }
const section = (n) => process.stdout.write(`\n${n}\n`)

let logs = []
async function call(body, opts = {}) {
  const orig = { log: console.log, warn: console.warn, error: console.error }
  const cap = (...a) => logs.push(a.map((x) => (x instanceof Error ? x.message : String(x))).join(' '))
  console.log = cap; console.warn = cap; console.error = cap
  try {
    const ev = opts.event || post(body, { token: opts.token === undefined ? 'admin-jwt' : opts.token, origin: opts.origin === undefined ? 'https://app.getbrandgeo.com' : opts.origin })
    return parse(await mod.handler(ev))
  } finally { Object.assign(console, orig) }
}

function addUsers(d, list) {
  for (const u of list) d.usersById.set(u.id, Object.assign({ aud: 'authenticated', role: 'authenticated', phone: '', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Test Person' } }, u))
}

function newDb() {
  queries = []
  rpcNames = []
  logs = []
  db = instrument(createFakeSupabase({ now: () => clock, sumCostEur: true, pagedListUsers: true }))
  return db
}

const CLIENTS = [
  { id: 10, name: 'Acme Widgets Test', plan: 'growth', category: 'active', engines_enabled: null },
  { id: 11, name: 'Borealis Bakery Test', plan: 'radar', category: 'active', engines_enabled: {} },
  { id: 12, name: 'someone@example.com', plan: 'free', category: 'free', engines_enabled: null },
  { id: 13, name: 'Cobalt Clinic Test', plan: 'mystery_plan', category: 'active', engines_enabled: null },
  { id: 15, name: 'Foxtrot Freight Test', plan: 'radar', category: 'research', engines_enabled: null },
  { id: 16, name: 'Gamma Garden Test', plan: 'essentials', category: 'active', engines_enabled: { claude: false } },
]
const PROFILES = [
  { id: ADMIN_ID, role: 'admin', client_id: 10 },
  { id: V1, role: 'viewer', client_id: 10 },
  { id: V2, role: 'viewer', client_id: 11 },
  { id: V3, role: 'viewer', client_id: 15 },
  { id: V4, role: 'viewer', client_id: 12 },
]

const JOB_ERROR_TEXT = 'engine timeout while mailing ops.person@example.com'
const NOTE_TEXT = 'paid by boss.person@example.com'

function seedBase() {
  newDb()
  db.seed('clients', CLIENTS)
  db.seed('user_profiles', PROFILES)
  addUsers(db, [
    { id: ADMIN_ID, email: 'admin.person@example.com', last_sign_in_at: ago(1) },
    { id: V1, email: 'viewer.one@example.com', last_sign_in_at: ago(2) },
    { id: V2, email: 'viewer.two@example.com', last_sign_in_at: ago(30) },
    { id: V3, email: 'viewer.three@example.com', last_sign_in_at: ago(3) },
    { id: V4, email: 'viewer.four@example.com', last_sign_in_at: null },
    { id: NOPROF, email: 'partner.person@example.com', last_sign_in_at: ago(1) },
  ])
  db.seed('ai_results', [
    { id: 1, client_id: 10, llm: 'chatgpt', status: 'ok', error_code: null, cost_eur: 20.00, checked_at: '2026-11-05T10:00:00.000Z' },
    { id: 2, client_id: 10, llm: 'gemini', status: 'ok', error_code: null, cost_eur: 15.88, checked_at: '2026-11-14T08:00:00.000Z' },
    { id: 3, client_id: 10, llm: 'claude', status: 'error', error_code: 'api_error', cost_eur: null, checked_at: '2026-11-12T10:00:00.000Z' },
    { id: 4, client_id: 11, llm: 'perplexity', status: 'ok', error_code: null, cost_eur: 3.915, checked_at: '2026-11-13T08:00:00.000Z' },
    { id: 5, client_id: 12, llm: 'gemini', status: 'ok', error_code: null, cost_eur: 0.30, checked_at: '2026-11-03T08:00:00.000Z' },
    { id: 6, client_id: 13, llm: 'chatgpt', status: 'ok', error_code: null, cost_eur: 1.485, checked_at: '2026-11-07T08:00:00.000Z' },
    { id: 7, client_id: 13, llm: 'gemini', status: 'error', error_code: 'quota_exceeded', cost_eur: null, checked_at: '2026-11-14T03:00:00.000Z' },
    { id: 8, client_id: 15, llm: 'chatgpt', status: 'ok', error_code: null, cost_eur: 50.00, checked_at: '2026-11-14T09:00:00.000Z' },
    { id: 9, client_id: 10, llm: 'chatgpt', status: 'ok', error_code: null, cost_eur: 9.99, checked_at: '2026-10-20T09:00:00.000Z' },
  ])
  db.seed('collection_runs', [
    { id: 101, client_id: 10, trigger: 'manual', force: false, total_jobs: 6, created_by: V1, created_at: '2026-11-14T11:30:00.000Z' },
    { id: 102, client_id: 10, trigger: 'manual', force: true, total_jobs: 6, created_by: ADMIN_ID, created_at: '2026-11-14T11:45:00.000Z' },
    { id: 103, client_id: 11, trigger: 'scheduled', force: false, total_jobs: 3, created_by: null, created_at: '2026-11-14T06:00:00.000Z' },
    { id: 104, client_id: 15, trigger: 'manual', force: false, total_jobs: 4, created_by: V3, created_at: '2026-11-14T07:00:00.000Z' },
    { id: 105, client_id: 10, trigger: 'manual', force: false, total_jobs: 6, created_by: V1, created_at: '2026-11-13T10:00:00.000Z' },
  ])
  db.seed('collection_jobs', [
    { id: 201, client_id: 10, status: 'failed', attempts: 3, engines: ['chatgpt', 'claude'], error: JOB_ERROR_TEXT, finished_at: '2026-11-14T05:00:00.000Z' },
    { id: 202, client_id: 10, status: 'done', attempts: 1, engines: ['gemini'], error: null, finished_at: '2026-11-14T05:10:00.000Z' },
  ])
  db.seed('admin_notifications', [
    { id: 301, type: 'account_deleted', client_id: 99, title: 'Deleted gone.person@example.com', body: 'gone.person@example.com', meta: { email: 'gone.person@example.com' }, created_at: '2026-11-14T02:00:00.000Z' },
    { id: 302, type: 'new_signup', client_id: 16, title: 'new.person@example.com', created_at: '2026-11-14T02:30:00.000Z' },
  ])
  const at = (h) => `2026-11-14T${String(h).padStart(2, '0')}:00:00.000Z`
  db.seed('client_events', [
    { id: 1, client_id: 10, actor: ADMIN_ID, type: 'plan_change', from_plan: 'free', to_plan: 'growth', meta: { grant_until: '2027-01-15', note: NOTE_TEXT, notified: true, refresh_cadence: 'weekly' }, created_at: at(1) },
    { id: 2, client_id: 11, actor: ADMIN_ID, type: 'trial_grant', from_plan: 'free', to_plan: 'radar', meta: { grant_until: '2026-12-01', note: 'trial note text' }, created_at: at(2) },
    { id: 3, client_id: 16, actor: ADMIN_ID, type: 'comp_grant', from_plan: 'free', to_plan: 'essentials', meta: { grant_until: null }, created_at: at(3) },
    { id: 4, client_id: 12, actor: null, type: 'trial_expired', from_plan: 'radar', to_plan: 'free', meta: { was: 'trial', ended: '2026-11-13' }, created_at: at(4) },
    { id: 5, client_id: 13, actor: ADMIN_ID, type: 'onboarded', from_plan: null, to_plan: 'growth', meta: { source: 'wizard', slug: 'cobalt-clinic', prompts_created: 5, locations_created: 2, invite_channel: 'brandgeo', default_market_id: 'US', role: 'viewer' }, created_at: at(5) },
    { id: 6, client_id: 16, actor: STRANGER, type: 'signup', from_plan: null, to_plan: 'free', meta: { source: 'signup', account_type: 'company', slug: 'gamma-garden', brand_website: 'https://gamma-garden.example.com', email: 'owner.person@example.com', role: 'viewer' }, created_at: at(6) },
    { id: 7, client_id: 11, actor: null, type: 'stripe_change', from_plan: 'radar', to_plan: 'growth', meta: { source: 'stripe', reason: 'upgrade', stripe_customer_id: 'cus_TESTONLY123', name: 'buyer.person@example.com' }, created_at: at(7) },
    { id: 8, client_id: 12, actor: null, type: 'stripe_provision', from_plan: null, to_plan: 'radar', meta: { source: 'stripe', stripe_subscription_id: 'sub_TESTONLY456', reason: 'new' }, created_at: at(8) },
    { id: 9, client_id: 10, actor: V1, type: 'mcp_fix_marked', from_plan: null, to_plan: null, meta: { grant_id: 'g-test-1', fix_id: 'F'.repeat(80), note: 'done by viewer.one@example.com' }, created_at: at(9) },
    { id: 10, client_id: 10, actor: ADMIN_ID, type: 'invite_resent', from_plan: null, to_plan: null, meta: { source: 'panel', user_id: V1, via: 'panel', channel: 'brandgeo', delivery: 'email', invite_link_id: 'lnk-test-1' }, created_at: at(10) },
    { id: 11, client_id: 10, actor: V1, type: 'location_change', from_plan: null, to_plan: null, meta: { action: 'add', by: V1, limit_override: true, over_limit: true, pairs: [{ market_id: 'US' }, { market_id: 'GB' }] }, created_at: '2026-11-14T10:30:00.000Z' },
    { id: 12, client_id: 10, actor: ADMIN_ID, type: 'mystery_type', from_plan: null, to_plan: null, meta: { note: 'x' }, created_at: '2026-11-14T10:40:00.000Z' },
  ])
}

const FORBIDDEN = ['@', 'example.com', 'gamma-garden', 'cus_TESTONLY', 'sub_TESTONLY', 'lnk-test-1', 'g-test-1', NOTE_TEXT, 'trial note text', JOB_ERROR_TEXT, 'engine timeout', ...ALL_USER_IDS]
function assertNoLeak(label, body) {
  const s = JSON.stringify(body)
  for (const f of FORBIDDEN) assert.ok(!s.includes(f), `${label}: response contains ${f}`)
}
function assertLogsClean(label) {
  for (const l of logs) {
    assert.ok(!l.includes('@'), `${label}: log line holds an address: ${l}`)
    for (const id of ALL_USER_IDS) assert.ok(!l.includes(id), `${label}: log line holds a user id`)
  }
}

const sameKeys = (obj, keys, label) => assert.deepStrictEqual(Object.keys(obj).sort(), keys.slice().sort(), `${label} keys`)

async function main() {
  // ── 1. envelope ───────────────────────────────────────────────────────────
  section('1. auth and envelope')
  seedBase()
  let r = await call({ action: 'summary' }, { token: null })
  assert.strictEqual(r.status, 401); ok('no token: 401')
  r = await call({ action: 'summary' }, { token: 'viewer-jwt' })
  assert.strictEqual(r.status, 403); ok('viewer token: 403')
  r = await call({ action: 'summary' }, { origin: 'https://evil.invalid' })
  assert.strictEqual(r.status, 403); ok('foreign origin: 403')
  r = await call(null, { event: Object.assign(post({ action: 'summary' }, { token: 'admin-jwt' }), { httpMethod: 'GET' }) })
  assert.strictEqual(r.status, 405); assert.strictEqual(r.body.code, 'method_not_allowed'); ok('GET with admin token: 405 method_not_allowed')
  for (const raw of ['[]', '"x"', 'not json', 'null', '']) {
    r = await call(raw)
    assert.strictEqual(r.status, 400, raw); assert.strictEqual(r.body.code, 'bad_request')
  }
  ok('array, string, invalid JSON, null and empty bodies: 400 bad_request')
  r = await call({ action: 'export' })
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body.code, 'bad_request')
  assert.strictEqual(r.body.error, 'Unknown action. Use "summary" or "feed".'); ok('unknown action: 400 with the fixed sentence')
  assert.strictEqual(queries.length, 0, 'no query before a valid action'); ok('no Supabase query on any rejected call')

  // ── 2. shapes ─────────────────────────────────────────────────────────────
  section('2. response shapes')
  seedBase()
  const sum = await call({ action: 'summary' })
  assert.strictEqual(sum.status, 200)
  const S = sum.body
  sameKeys(S, ['generated_at', 'windows', 'tiles', 'clients', 'spend_check', 'truncated', 'warnings'], 'summary')
  sameKeys(S.windows, ['day_start_utc', 'month_start', 'last_24h_start', 'read_since'], 'windows')
  sameKeys(S.tiles, ['active_users_24h', 'runs_today', 'engine_health_24h', 'budget_watch'], 'tiles')
  sameKeys(S.tiles.active_users_24h, ['viewers', 'clients'], 'active_users_24h')
  sameKeys(S.tiles.runs_today, ['customer', 'research', 'manual', 'scheduled', 'engine_calls'], 'runs_today')
  sameKeys(S.tiles.engine_health_24h, ['calls', 'ok', 'errors', 'error_rate', 'by_llm', 'level', 'reason', 'outage_llms'], 'engine_health_24h')
  sameKeys(S.tiles.budget_watch, ['customers_measured', 'over_80', 'over_90', 'over_100'], 'budget_watch')
  sameKeys(S.spend_check, ['paged_total_eur', 'rpc_total_eur', 'delta_eur', 'null_cost_rows'], 'spend_check')
  sameKeys(S.truncated, ['ai_results_month', 'auth_users', 'clients', 'profiles', 'collection_runs'], 'summary truncated')
  assert.ok(Array.isArray(S.warnings) && Array.isArray(S.clients))
  assert.strictEqual(S.generated_at, '2026-11-14T12:00:00.000Z')
  assert.strictEqual(S.windows.day_start_utc, '2026-11-14T00:00:00.000Z')
  assert.strictEqual(S.windows.month_start, '2026-11-01T00:00:00.000Z')
  assert.strictEqual(S.windows.last_24h_start, '2026-11-13T12:00:00.000Z')
  assert.strictEqual(S.windows.read_since, '2026-11-01T00:00:00.000Z')
  const ROW_KEYS = ['client_id', 'name', 'plan', 'plan_known', 'is_research', 'requests_month', 'errors_month', 'spent_eur', 'budget_eur', 'budget_pct', 'budget_level', 'engines_used', 'engines_entitled', 'viewers', 'last_sign_in_at', 'last_manual_run_at', 'last_active_at', 'last_active_source', 'last_result_at']
  for (const row of S.clients) {
    sameKeys(row, ROW_KEYS, `client ${row.client_id}`)
    assert.strictEqual(typeof row.client_id, 'number'); assert.strictEqual(typeof row.name, 'string')
    assert.strictEqual(typeof row.plan_known, 'boolean'); assert.ok(Array.isArray(row.engines_used) && Array.isArray(row.engines_entitled))
    assert.ok(['ok', 'warn', 'bad'].includes(row.budget_level))
  }
  ok('summary carries every key of SummaryResponse with the documented types and windows')

  const feed = await call({ action: 'feed' })
  assert.strictEqual(feed.status, 200)
  const F = feed.body
  sameKeys(F, ['rows', 'cursor', 'server_time', 'window', 'truncated', 'warnings'], 'feed')
  sameKeys(F.window, ['since', 'until'], 'feed window')
  sameKeys(F.truncated, ['client_events', 'collection_runs', 'collection_jobs', 'engine_errors', 'account_deleted', 'logins', 'merged'], 'feed truncated')
  for (const row of F.rows) sameKeys(row, ['id', 'at', 'badge', 'tone', 'client_id', 'client_name', 'is_research', 'actor_role', 'detail'], `feed row ${row.id}`)
  assert.strictEqual(F.window.since, '2026-11-13T12:00:00.000Z')
  assert.strictEqual(F.window.until, '2026-11-14T12:00:00.000Z')
  ok('feed carries every key of FeedResponse; default window is the last 24 h')

  // ── 3. privacy ────────────────────────────────────────────────────────────
  section('3. no address anywhere')
  assertNoLeak('summary', S); ok('summary body: no @, domain, website, note, Stripe id, job error text or user id')
  assertNoLeak('feed', F); ok('feed body: no @, domain, website, note, Stripe id, job error text or user id')
  assertLogsClean('summary and feed'); ok('captured log lines hold no @ and no user id')
  assert.strictEqual(S.clients.find((c) => c.client_id === 12).name, 'Client 12'); ok('a client named with an address renders as Client <id> in the table')
  assert.ok(F.rows.filter((x) => x.client_id === 12).every((x) => x.client_name === 'Client 12')); ok('and in the feed')

  // ── 4. bounded queries ────────────────────────────────────────────────────
  section('4. every query bounded, nothing written')
  const TIME_COL = { ai_results: 'checked_at', client_events: 'created_at', collection_runs: 'created_at', collection_jobs: 'finished_at', admin_notifications: 'created_at' }
  const tablesSeen = new Set(queries.map((q) => q.table))
  for (const t of Object.keys(TIME_COL).concat(['clients', 'user_profiles'])) assert.ok(tablesSeen.has(t), `table ${t} was read`)
  for (const q of queries) {
    const has = (m, col) => q.calls.some((c) => c[0] === m && (col === undefined || c[1] === col))
    if (TIME_COL[q.table]) {
      const col = TIME_COL[q.table]
      assert.ok(has('gt', col) || has('gte', col), `${q.table}: lower bound on ${col}`)
      assert.ok(has('lte', col), `${q.table}: upper bound on ${col}`)
      assert.ok(has('limit') || has('range'), `${q.table}: limit or range`)
    } else if (q.table === 'clients' || q.table === 'user_profiles') {
      assert.ok(has('limit'), `${q.table}: limit`)
    } else {
      assert.fail(`unexpected table read: ${q.table}`)
    }
    assert.deepStrictEqual(q.writes, [], `${q.table}: no write`)
  }
  ok(`${queries.length} recorded builders: time tables bounded below and above with limit or range, clients and profiles capped`)
  assert.ok(queries.every((q) => q.writes.length === 0)); ok('no insert, update, upsert or delete on any builder')
  assert.deepStrictEqual(Array.from(new Set(rpcNames)), ['sum_cost_eur']); ok('the only rpc is sum_cost_eur')
  const ar = queries.filter((q) => q.table === 'ai_results' && q.calls.some((c) => c[0] === 'range'))
  assert.ok(ar.length >= 1 && ar.every((q) => q.calls.some((c) => c[0] === 'select' && !String(c[1]).includes('response'))))
  ok('the month read is paged with range and selects no answer text')
  const evq = queries.find((q) => q.table === 'admin_notifications')
  assert.ok(evq.calls.some((c) => c[0] === 'select' && c[1] === 'id, client_id, created_at')); ok('admin_notifications selects id, client_id, created_at only')

  // ── 5. badge mapping ──────────────────────────────────────────────────────
  section('5. badge mapping')
  const byId = new Map(F.rows.map((x) => [x.id, x]))
  const expect = [
    ['ev:1', 'PLAN_CHANGE', 'info', ['kind', 'from_plan', 'to_plan', 'grant_until'], 'plan'],
    ['ev:2', 'TRIAL_GRANT', 'ok', ['kind', 'from_plan', 'to_plan', 'grant_until'], 'plan'],
    ['ev:3', 'COMP_GRANT', 'ok', ['kind', 'from_plan', 'to_plan', 'grant_until'], 'plan'],
    ['ev:4', 'TRIAL_EXPIRED', 'warn', ['kind', 'from_plan', 'to_plan', 'was'], 'trial_expired'],
    ['ev:5', 'ONBOARDED', 'ok', ['kind', 'to_plan', 'prompts_created', 'locations_created', 'invite_channel'], 'onboarded'],
    ['ev:6', 'SIGNUP', 'ok', ['kind', 'to_plan', 'account_type'], 'signup'],
    ['ev:7', 'STRIPE_CHANGE', 'info', ['kind', 'from_plan', 'to_plan', 'reason'], 'stripe'],
    ['ev:8', 'STRIPE_PROVISION', 'ok', ['kind', 'from_plan', 'to_plan', 'reason'], 'stripe'],
    ['ev:9', 'MCP_FIX_MARKED', 'ok', ['kind', 'fix_id', 'via'], 'mcp_fix'],
    ['ev:10', 'INVITE_RESENT', 'neutral', ['kind', 'channel', 'delivery'], 'invite'],
    ['ev:11', 'LOCATION_CHANGE', 'info', ['kind', 'action', 'over_limit', 'count'], 'location'],
    ['run:101', 'RUN_STARTED', 'info', ['kind', 'trigger', 'force', 'total_jobs'], 'run'],
    ['job:201', 'JOB_FAILED', 'bad', ['kind', 'attempts', 'engines', 'has_error_text'], 'job_failed'],
    ['err:7', 'ENGINE_ERROR', 'warn', ['kind', 'llm', 'error_code'], 'engine_error'],
    ['del:301', 'ACCOUNT_DELETED', 'warn', ['kind'], 'account_deleted'],
  ]
  for (const [id, badge, tone, keys, kind] of expect) {
    const row = byId.get(id)
    assert.ok(row, `row ${id} present`)
    assert.strictEqual(row.badge, badge, id); assert.strictEqual(row.tone, tone, id)
    sameKeys(row.detail, keys, id); assert.strictEqual(row.detail.kind, kind, id)
  }
  ok('every source and each of the 11 event types maps to its badge, tone and exact detail keys')
  assert.deepStrictEqual(byId.get('ev:1').detail, { kind: 'plan', from_plan: 'free', to_plan: 'growth', grant_until: '2027-01-15' })
  assert.deepStrictEqual(byId.get('ev:3').detail.grant_until, null)
  assert.deepStrictEqual(byId.get('ev:4').detail, { kind: 'trial_expired', from_plan: 'radar', to_plan: 'free', was: 'trial' })
  assert.deepStrictEqual(byId.get('ev:5').detail, { kind: 'onboarded', to_plan: 'growth', prompts_created: 5, locations_created: 2, invite_channel: 'brandgeo' })
  assert.deepStrictEqual(byId.get('ev:6').detail, { kind: 'signup', to_plan: 'free', account_type: 'company' })
  assert.deepStrictEqual(byId.get('ev:7').detail, { kind: 'stripe', from_plan: 'radar', to_plan: 'growth', reason: 'upgrade' })
  assert.deepStrictEqual(byId.get('ev:8').detail, { kind: 'stripe', from_plan: null, to_plan: 'radar', reason: null })
  assert.deepStrictEqual(byId.get('ev:9').detail, { kind: 'mcp_fix', fix_id: 'F'.repeat(64), via: 'oauth' })
  assert.deepStrictEqual(byId.get('ev:10').detail, { kind: 'invite', channel: 'brandgeo', delivery: 'email' })
  assert.deepStrictEqual(byId.get('ev:11').detail, { kind: 'location', action: 'add', over_limit: true, count: 2 })
  assert.deepStrictEqual(byId.get('run:102').detail, { kind: 'run', trigger: 'manual', force: true, total_jobs: 6 })
  assert.deepStrictEqual(byId.get('run:103').detail, { kind: 'run', trigger: 'scheduled', force: false, total_jobs: 3 })
  assert.deepStrictEqual(byId.get('job:201').detail, { kind: 'job_failed', attempts: 3, engines: ['chatgpt', 'claude'], has_error_text: true })
  assert.deepStrictEqual(byId.get('err:7').detail, { kind: 'engine_error', llm: 'gemini', error_code: 'quota_exceeded' })
  ok('detail values: whitelisted fields only, fix_id cut to 64, via oauth, has_error_text without the text')
  assert.strictEqual(byId.get('ev:1').actor_role, 'admin'); assert.strictEqual(byId.get('ev:9').actor_role, 'viewer')
  assert.strictEqual(byId.get('ev:4').actor_role, 'system'); assert.strictEqual(byId.get('ev:6').actor_role, null)
  assert.strictEqual(byId.get('run:101').actor_role, null)
  ok('actor_role: admin, viewer, system for a null actor, null for an unknown actor and non event rows')
  assert.ok(!byId.has('ev:12')); assert.ok(F.warnings.includes('1 events of an unknown type were skipped.')); ok('an unknown event type is skipped with the warning')
  assert.ok(!byId.has('job:202') && !F.rows.some((x) => x.id === 'del:302')); ok('a done job and a non deletion notification are not listed')
  assert.strictEqual(byId.get('del:301').client_name, null); assert.strictEqual(byId.get('del:301').client_id, 99); ok('a deleted client has client_name null')
  assert.ok(!byId.has('run:105') && !byId.has('err:3')); ok('rows older than the window are not listed')
  assert.strictEqual(byId.get('run:104').is_research, true); assert.strictEqual(byId.get('run:101').is_research, false); ok('research rows carry is_research')
  const fixMeta = { grant_id: null, key_id: 'k1', fix_id: 'f1' }
  db.seed('client_events', [{ id: 50, client_id: 10, actor: null, type: 'mcp_fix_marked', meta: fixMeta, created_at: '2026-11-14T11:00:00.000Z' }, { id: 51, client_id: 10, actor: null, type: 'location_change', meta: { action: 'rename', pairs: 'x' }, created_at: '2026-11-14T11:01:00.000Z' }, { id: 52, client_id: 10, actor: null, type: 'invite_resent', meta: { channel: 'x@example.com', delivery: 'email' }, created_at: '2026-11-14T11:02:00.000Z' }])
  const F2 = (await call({ action: 'feed', limit: 100 })).body
  const m2 = new Map(F2.rows.map((x) => [x.id, x]))
  assert.deepStrictEqual(m2.get('ev:50').detail, { kind: 'mcp_fix', fix_id: 'f1', via: 'key' })
  assert.deepStrictEqual(m2.get('ev:51').detail, { kind: 'location', action: null, over_limit: false, count: null })
  assert.deepStrictEqual(m2.get('ev:52').detail, { kind: 'invite', channel: null, delivery: 'email' })
  ok('via key, an unlisted location action reads null, an address in a detail field reads null')

  // ── 6. LOGIN ──────────────────────────────────────────────────────────────
  section('6. LOGIN')
  const logins = F.rows.filter((x) => x.badge === 'LOGIN')
  assert.strictEqual(logins.length, 2, 'V1 and the research viewer V3')
  for (const l of logins) {
    assert.ok(/^login:[0-9a-f]{12}:\d+$/.test(l.id), l.id)
    for (const u of ALL_USER_IDS) assert.ok(!l.id.includes(u))
    assert.deepStrictEqual(l.detail, { kind: 'login' }); assert.strictEqual(l.tone, 'neutral')
  }
  const l1 = logins.find((x) => x.client_id === 10)
  assert.ok(l1 && l1.at === ago(2) && l1.id.endsWith(`:${Date.parse(ago(2))}`))
  assert.ok(logins.find((x) => x.client_id === 15).is_research)
  ok('one LOGIN per viewer inside the window, opaque id, no user id')
  assert.ok(!logins.some((x) => x.at === ago(1))); ok('the admin sign in and the profile-less user sign in yield no LOGIN row')

  // ── 7. cursor ─────────────────────────────────────────────────────────────
  section('7. cursor and parameters')
  newDb()
  db.seed('clients', CLIENTS)
  db.seed('user_profiles', PROFILES)
  const SINCE = '2026-11-14T11:00:00.000Z'
  const UNTIL = '2026-11-14T12:00:00.000Z'
  db.seed('client_events', [
    { id: 1, client_id: 10, actor: null, type: 'signup', to_plan: 'free', meta: {}, created_at: SINCE },
    { id: 2, client_id: 10, actor: null, type: 'signup', to_plan: 'free', meta: {}, created_at: '2026-11-14T11:30:00.000Z' },
    { id: 3, client_id: 10, actor: null, type: 'signup', to_plan: 'free', meta: {}, created_at: '2026-11-14T11:59:30.000Z' },
    { id: 4, client_id: 10, actor: null, type: 'signup', to_plan: 'free', meta: {}, created_at: UNTIL },
    { id: 5, client_id: 10, actor: null, type: 'signup', to_plan: 'free', meta: {}, created_at: '2026-11-14T12:00:01.000Z' },
  ])
  addUsers(db, [{ id: V1, email: 'viewer.one@example.com', last_sign_in_at: SINCE }, { id: V2, email: 'viewer.two@example.com', last_sign_in_at: UNTIL }])
  const c1 = (await call({ action: 'feed', since: SINCE })).body
  assert.strictEqual(c1.cursor, c1.window.until); assert.strictEqual(c1.window.until, UNTIL); assert.strictEqual(c1.window.since, SINCE)
  ok('cursor equals window.until')
  const ids1 = c1.rows.map((x) => x.id)
  assert.deepStrictEqual(ids1.filter((x) => x.startsWith('ev:')), ['ev:4', 'ev:3', 'ev:2'])
  assert.ok(ids1.some((x) => x.startsWith('login:') && x.endsWith(`:${Date.parse(UNTIL)}`)))
  assert.ok(!ids1.some((x) => x.endsWith(`:${Date.parse(SINCE)}`)))
  ok('rows exactly at since are excluded and rows at until included (events and sign ins)')
  const c2 = (await call({ action: 'feed', since: iso(Date.parse(c1.cursor) - 60000) })).body
  const ids2 = c2.rows.map((x) => x.id)
  assert.deepStrictEqual(ids2.slice().sort(), ids1.filter((x) => x === 'ev:4' || x === 'ev:3' || x.startsWith('login:')).sort())
  ok('a second call with since = cursor minus 60 s returns the overlap rows with identical ids')
  const c3 = (await call({ action: 'feed', since: iso(NOW() - 10 * 24 * 3600 * 1000) })).body
  assert.strictEqual(c3.window.since, iso(NOW() - 7 * 24 * 3600 * 1000)); ok('since older than 7 days is clamped to now minus 7 days')
  const c4 = (await call({ action: 'feed', since: iso(NOW() + 3600 * 1000) })).body
  assert.strictEqual(c4.window.since, UNTIL); ok('a future since is clamped to now')
  for (const bad of ['yesterday', 12345, true, {}]) {
    const x = await call({ action: 'feed', since: bad })
    assert.strictEqual(x.status, 400); assert.strictEqual(x.body.error, 'since must be an ISO date.')
  }
  ok('a non date since is 400')
  for (const bad of [0, 101, 1.5, '01', true, '1.5', -3, 'ten']) {
    const x = await call({ action: 'feed', limit: bad })
    assert.strictEqual(x.status, 400, String(bad)); assert.strictEqual(x.body.error, 'limit must be a whole number from 1 to 100.')
  }
  ok('limit 0, 101, 1.5, "01", true and other non integers are 400')
  assert.strictEqual((await call({ action: 'feed', limit: '2' })).body.rows.length, 2)
  assert.strictEqual((await call({ action: 'feed', limit: 100, since: null })).status, 200)
  ok('a digit string limit and since null are accepted')

  // ── 8. truncation ─────────────────────────────────────────────────────────
  section('8. truncation')
  newDb()
  db.seed('clients', CLIENTS)
  db.seed('user_profiles', PROFILES)
  const jobs = []
  for (let i = 0; i < 51; i++) jobs.push({ id: 1000 + i, client_id: 10, status: 'failed', attempts: 3, engines: ['chatgpt'], error: '', finished_at: iso(NOW() - (i + 1) * 60000) })
  db.seed('collection_jobs', jobs)
  let t = (await call({ action: 'feed', limit: 100 })).body
  assert.strictEqual(t.truncated.collection_jobs, true)
  assert.strictEqual(t.rows.filter((x) => x.badge === 'JOB_FAILED').length, 50)
  assert.ok(t.rows.every((x) => x.detail.has_error_text === false)); assert.strictEqual(t.truncated.merged, false)
  ok('51 failed jobs: truncated.collection_jobs true and 50 job rows; an empty error is has_error_text false')
  newDb()
  db.seed('clients', CLIENTS)
  const runs30 = []
  for (let i = 0; i < 30; i++) runs30.push({ id: 2000 + i, client_id: 11, trigger: 'scheduled', force: false, total_jobs: 1, created_by: null, created_at: iso(NOW() - (i + 1) * 60000) })
  db.seed('collection_runs', runs30)
  t = (await call({ action: 'feed', limit: 10 })).body
  assert.strictEqual(t.truncated.merged, true); assert.strictEqual(t.rows.length, 10)
  assert.deepStrictEqual(t.rows.map((x) => x.id), runs30.slice(0, 10).map((x) => `run:${x.id}`))
  assert.strictEqual(t.truncated.collection_runs, false)
  ok('limit 10 over 30 rows: truncated.merged true, 10 rows newest first')

  const monthRows = (n) => {
    const out = []
    for (let i = 0; i < n; i++) out.push({ id: 5000 + i, client_id: 11, llm: 'gemini', status: 'ok', error_code: null, cost_eur: 0.001, checked_at: iso(Date.parse('2026-11-02T00:00:00.000Z') + i * 1000) })
    return out
  }
  mod.AI_RESULTS_MAX_PAGES = 1
  try {
    newDb(); db.seed('clients', CLIENTS); db.seed('ai_results', monthRows(1500))
    let s = (await call({ action: 'summary' })).body
    assert.strictEqual(s.truncated.ai_results_month, true)
    assert.ok(s.warnings.includes('More than 1000 engine calls this month; per client figures cover only the first 1000 and are incomplete.'))
    assert.strictEqual(s.clients.find((c) => c.client_id === 11).requests_month, 1000)
    assert.strictEqual(queries.filter((q) => q.table === 'ai_results').length, 1)
    ok('AI_RESULTS_MAX_PAGES 1 and 1500 month rows: truncated, warning present, one page read')
    newDb(); db.seed('clients', CLIENTS); db.seed('ai_results', monthRows(999))
    s = (await call({ action: 'summary' })).body
    assert.strictEqual(s.truncated.ai_results_month, false)
    assert.ok(!s.warnings.some((w) => w.startsWith('More than')))
    ok('999 month rows: not truncated, no warning')
  } finally { mod.AI_RESULTS_MAX_PAGES = 20 }
  newDb(); db.seed('clients', CLIENTS); db.seed('ai_results', monthRows(2500))
  let s2 = (await call({ action: 'summary' })).body
  assert.strictEqual(s2.truncated.ai_results_month, false)
  assert.strictEqual(s2.clients.find((c) => c.client_id === 11).requests_month, 2500)
  assert.strictEqual(queries.filter((q) => q.table === 'ai_results').length, 3)
  ok('2500 rows at the default ceiling: three pages, every row counted once')
  assert.strictEqual(mod.AI_RESULTS_MAX_PAGES * mod.PAGE_SIZE, 20000); ok('the default ceiling is 20000 rows')

  // ── 9. spend and budget ───────────────────────────────────────────────────
  section('9. spend and budget')
  const row = (id) => S.clients.find((c) => c.client_id === id)
  assert.strictEqual(row(10).spent_eur, 35.88)
  assert.strictEqual(row(10).requests_month, 3); assert.strictEqual(row(10).errors_month, 1)
  assert.strictEqual(S.spend_check.null_cost_rows, 2)
  ok('spent_eur sums cost_eur with null as 0 and the previous month left out; null_cost_rows counts the nulls')
  assert.strictEqual(row(10).budget_eur, PLAN_MONTHLY_API_BUDGET_EUR.growth)
  assert.strictEqual(row(11).budget_eur, PLAN_MONTHLY_API_BUDGET_EUR.radar)
  assert.strictEqual(row(12).budget_eur, PLAN_MONTHLY_API_BUDGET_EUR.free)
  assert.strictEqual(row(13).budget_eur, PLAN_MONTHLY_API_BUDGET_EUR.essentials); assert.strictEqual(row(13).plan_known, false); assert.strictEqual(row(13).plan, 'mystery_plan')
  ok('budget_eur comes from PLAN_MONTHLY_API_BUDGET_EUR; an unknown plan gets the essentials budget')
  assert.strictEqual(row(10).budget_pct, 80); assert.strictEqual(row(10).budget_level, 'warn')
  assert.strictEqual(row(11).budget_pct, 90); assert.strictEqual(row(11).budget_level, 'bad')
  assert.strictEqual(row(12).budget_pct, 100); assert.strictEqual(row(12).budget_level, 'bad')
  assert.strictEqual(row(13).budget_pct, 10); assert.strictEqual(row(13).budget_level, 'ok')
  assert.strictEqual(row(16).budget_pct, 0); assert.strictEqual(row(16).budget_level, 'ok')
  ok('budget_level warn at 80.0 and bad at 90.0')

  assert.deepStrictEqual(S.tiles.budget_watch, { customers_measured: 5, over_80: 3, over_90: 2, over_100: 1 }); ok('budget_watch counts customers only')
  assert.deepStrictEqual(row(10).engines_used, ['chatgpt', 'gemini'])
  assert.deepStrictEqual(row(16).engines_entitled, require(path.join(FN, '_cost.js')).activeEnginesFor('essentials', { claude: false }))
  assert.ok(!row(16).engines_entitled.includes('claude'))
  ok('engines_used is the ok engines this month, engines_entitled follows activeEnginesFor with overrides')
  assert.ok(Math.abs(S.spend_check.paged_total_eur - 91.58) < 1e-9)
  assert.ok(Math.abs(S.spend_check.rpc_total_eur - 91.58) < 1e-9)
  assert.ok(Math.abs(S.spend_check.delta_eur) < 0.001)
  assert.ok(!S.warnings.some((w) => w.startsWith('Paged spend')))
  ok('rpc_total_eur equals the fake RPC and the paged total; no delta warning')
  seedBase()
  db.seed('ai_results', [{ id: 90, client_id: 11, llm: 'gemini', status: 'ok', error_code: null, cost_eur: 5, checked_at: '2026-11-14T13:00:00.000Z' }])
  let sp = (await call({ action: 'summary' })).body
  assert.strictEqual(sp.spend_check.delta_eur, 5)
  assert.ok(sp.warnings.includes('Paged spend and the budget gate total differ by EUR 5.00.'))
  ok('a delta above EUR 1.00 adds the warning')
  seedBase()
  db.rpcFaults = { sum_cost_eur: { message: 'statement timeout for ops.person@example.com' } }
  sp = await call({ action: 'summary' })
  assert.strictEqual(sp.status, 200)
  assert.strictEqual(sp.body.spend_check.rpc_total_eur, null); assert.strictEqual(sp.body.spend_check.delta_eur, null)
  assert.ok(sp.body.warnings.length >= 1)
  assertLogsClean('rpc failure')
  ok('an RPC error leaves the call 200 with rpc_total_eur null, a warning and a scrubbed log')

  // ── 10. research and roles ────────────────────────────────────────────────
  section('10. research and roles')
  assert.deepStrictEqual(S.tiles.active_users_24h, { viewers: 1, clients: 1 })
  ok('active_users_24h counts V1 only: not the admin, not the 30 h sign in, not the research viewer, not the profile-less user')
  assert.deepStrictEqual(S.tiles.runs_today, { customer: 3, research: 1, manual: 2, scheduled: 1, engine_calls: 2 })
  ok('runs_today: research run counted apart, research engine call excluded')
  assert.strictEqual(S.tiles.engine_health_24h.calls, 2); ok('engine_health_24h leaves out the research engine call')
  const research = S.clients.filter((c) => c.is_research)
  assert.deepStrictEqual(research.map((c) => c.client_id), [15])
  assert.strictEqual(S.clients[S.clients.length - 1].client_id, 15)
  assert.deepStrictEqual(S.clients.map((c) => c.client_id), [12, 11, 10, 13, 16, 15])
  ok('research clients are listed with is_research true, sorted after customers; customers by budget_pct desc')
  assert.strictEqual(row(10).viewers, 1); assert.strictEqual(row(10).last_sign_in_at, ago(2))
  assert.strictEqual(row(10).last_manual_run_at, '2026-11-14T11:30:00.000Z')
  assert.strictEqual(row(10).last_active_at, '2026-11-14T11:30:00.000Z'); assert.strictEqual(row(10).last_active_source, 'manual_run')
  assert.strictEqual(row(10).last_result_at, '2026-11-14T08:00:00.000Z')
  assert.strictEqual(row(11).last_active_source, 'sign_in'); assert.strictEqual(row(11).last_manual_run_at, null)
  assert.strictEqual(row(12).last_active_at, null); assert.strictEqual(row(12).last_active_source, null)
  ok('last activity: the admin forced run is not user activity; sign in and manual run by an own viewer are')

  // ── 11. health levels ─────────────────────────────────────────────────────
  section('11. engine health levels')
  async function health(rows) {
    newDb(); db.seed('clients', CLIENTS)
    db.seed('ai_results', rows.map((r, i) => Object.assign({ id: 7000 + i, client_id: 10, error_code: null, cost_eur: 0, checked_at: ago(1) }, r)))
    return (await call({ action: 'summary' })).body.tiles.engine_health_24h
  }
  const mk = (llm, n, errors, extra = {}) => Array.from({ length: n }, (_, i) => Object.assign({ llm, status: i < errors ? 'error' : 'ok' }, extra))
  let h = await health([...mk('chatgpt', 7, 1), ...mk('gemini', 7, 0), ...mk('claude', 6, 0)])
  assert.strictEqual(h.calls, 20); assert.strictEqual(h.level, 'warn'); assert.strictEqual(h.reason, 'rate'); assert.strictEqual(h.error_rate, 0.05)
  h = await health([...mk('chatgpt', 34, 1), ...mk('gemini', 33, 1), ...mk('claude', 33, 1)])
  assert.strictEqual(h.error_rate, 0.03); assert.strictEqual(h.level, 'warn')
  ok('warn by rate: 1 of 20, and exactly 0.03 at 100 calls')
  h = await health([...mk('chatgpt', 10, 1), ...mk('gemini', 10, 1)])
  assert.strictEqual(h.level, 'bad'); assert.strictEqual(h.reason, 'rate'); assert.strictEqual(h.error_rate, 0.1)
  ok('bad by rate: 0.10 at 20 calls')
  h = await health([...mk('chatgpt', 4, 4), ...mk('gemini', 4, 2), ...mk('claude', 4, 2), ...mk('perplexity', 4, 1), ...mk('grok', 3, 1), ...mk('chatgpt', 20, 20, { client_id: 15 })])
  assert.strictEqual(h.calls, 19); assert.strictEqual(h.errors, 10); assert.strictEqual(h.level, 'ok'); assert.strictEqual(h.reason, null)
  assert.deepStrictEqual(h.outage_llms, [])
  ok('ok at 19 calls with 10 errors and no engine at 5 calls; research errors excluded')
  h = await health([...mk('perplexity', 5, 5), ...mk('chatgpt', 100, 0)])
  assert.strictEqual(h.level, 'bad'); assert.strictEqual(h.reason, 'engine_outage'); assert.deepStrictEqual(h.outage_llms, ['perplexity'])
  assert.deepStrictEqual(h.by_llm[0], { llm: 'perplexity', calls: 5, errors: 5 })
  ok('bad by engine_outage: one engine 5 of 5 errors, listed first in by_llm')
  h = await health([])
  assert.strictEqual(h.calls, 0); assert.strictEqual(h.error_rate, null); assert.strictEqual(h.level, 'ok')
  ok('no calls: error_rate null, level ok')

  // ── 12. month boundary ────────────────────────────────────────────────────
  section('12. month boundary')
  clock = new Date('2026-12-01T06:00:00.000Z')
  try {
    newDb(); db.seed('clients', CLIENTS)
    db.seed('ai_results', [{ id: 1, client_id: 10, llm: 'chatgpt', status: 'ok', error_code: null, cost_eur: 2, checked_at: '2026-11-30T22:00:00.000Z' }])
    const mb = (await call({ action: 'summary' })).body
    assert.strictEqual(mb.windows.month_start, '2026-12-01T00:00:00.000Z')
    assert.strictEqual(mb.windows.read_since, '2026-11-30T06:00:00.000Z')
    assert.strictEqual(mb.tiles.engine_health_24h.calls, 1)
    assert.ok(mb.clients.every((c) => c.requests_month === 0 && c.spent_eur === 0))
    assert.strictEqual(mb.spend_check.paged_total_eur, 0)
    ok('first day 06:00Z: last evening counts in engine health and in no month figure')
  } finally { clock = new Date('2026-11-14T12:00:00.000Z') }

  // ── 13. read failure ──────────────────────────────────────────────────────
  section('13. read failure')
  seedBase()
  db.faults.push({ table: 'client_events', error: { message: 'connection reset for ops.person@example.com' } })
  r = await call({ action: 'feed' })
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.code, 'read_failed')
  assert.strictEqual(r.body.error, 'Could not read platform activity. Check the function logs and try again.')
  assert.ok(logs.some((l) => /^\[platform-activity\/[0-9a-f]+\] read_failed at client_events: connection reset for \[redacted\]$/.test(l)))
  assertLogsClean('read failure')
  ok('a failing client_events read is 500 read_failed with the fixed sentence and a scrubbed log line')
  seedBase()
  db.authBehaviour = { onListUsers: async () => { throw new Error('gotrue down for admin.person@example.com') } }
  r = await call({ action: 'summary' })
  assert.strictEqual(r.status, 500); assert.ok(logs.some((l) => l.includes('read_failed at auth_users')))
  assertLogsClean('auth failure')
  ok('a failing listUsers is 500 read_failed at auth_users')

  // ── helpers ───────────────────────────────────────────────────────────────
  section('14. scrub helpers')
  assert.strictEqual(mod.scrubDetail(5), null); assert.strictEqual(mod.scrubDetail('a@b'), null); assert.strictEqual(mod.scrubDetail('fine'), 'fine')
  assert.strictEqual(mod.scrubClientName('x@y.example', 7), 'Client 7'); assert.strictEqual(mod.scrubClientName(null, 8), 'Client 8')
  assert.strictEqual(mod.scrubLog('failed for a@b.example at  step 2'), 'failed for [redacted] at  step 2')
  ok('scrubDetail, scrubClientName and scrubLog behave per section 3.5')

  // Review L8: a plan named like a prototype key must not select a function.
  seedBase(); db.seed('clients', [{ id: 90, name: 'Proto Plan Test', plan: 'toString', category: 'active', engines_enabled: null }])
  const rProto = await call({ action: 'summary' })
  assert.strictEqual(rProto.status, 200)
  const sProto = rProto.body
  const protoRow = sProto.clients.find((c) => c.client_id === 90)
  assert.strictEqual(protoRow.plan_known, false)
  assert.strictEqual(protoRow.budget_eur, PLAN_MONTHLY_API_BUDGET_EUR.essentials)
  assert.ok(Array.isArray(protoRow.engines_entitled) && protoRow.engines_entitled.length > 0)
  ok('a plan named "toString" is unknown, gets the essentials budget and engines, and does not fail the summary')

  console.log(`\nplatform_activity: ${passed} checks passed`)
}

main().catch((e) => { console.error(e); process.exit(1) })
