/**
 * client_api_keys.test.js: MCP key management (netlify/functions/client-api-keys.js)
 * against the in-memory Supabase fake. Contract: docs/arch/mcp-access.md
 * sections 7.1 and 10, plus the per-key write scope of
 * docs/arch/mcp-stage2-fixes.md section 9.3 (section 7 below).
 *
 * _auth.js is replaced in require.cache with a scripted requireAuth that keeps
 * the real contract this handler depends on: 204 preflight, 403 foreign
 * origin, 401 without or with an unknown token, and the client ownership
 * check (a viewer may only act on their own client_id, an admin on any), and
 * returns { user, profile, headers }.
 *
 * Run: `node tests/client_api_keys.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const crypto = require('crypto')

const captured = []
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  const orig = console[level].bind(console)
  console[level] = (...a) => { captured.push(a.map(String).join(' ')); orig(...a) }
}

const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const FN = path.join(__dirname, '..', 'netlify', 'functions')
const ALLOWED_ORIGINS = ['https://app.getbrandgeo.com', 'http://localhost:5173', 'http://localhost:3000']
const cors = (origin) => ({ 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], 'Content-Type': 'application/json' })

// token -> { user, profile }
const TOKENS = {
  'admin-jwt': { user: { id: 'u-admin' }, profile: { role: 'admin', client_id: null } },
  'viewer-a-jwt': { user: { id: 'u-viewer-a' }, profile: { role: 'viewer', client_id: 1 } },
  'viewer-b-jwt': { user: { id: 'u-viewer-b' }, profile: { role: 'viewer', client_id: 2 } },
  'viewer-free-jwt': { user: { id: 'u-viewer-f' }, profile: { role: 'viewer', client_id: 3 } },
  'viewer-research-jwt': { user: { id: 'u-viewer-r' }, profile: { role: 'viewer', client_id: 4 } },
}
const authCalls = []
const authMock = {
  ALLOWED_ORIGINS,
  corsHeaders: cors,
  checkCollectionLimits: async () => ({ blocked: false }),
  async requireAuth(event, { adminOnly = false, clientId = null } = {}) {
    authCalls.push({ clientId })
    const origin = event.headers.origin || ''
    const headers = cors(origin)
    const reject = (statusCode, error) => ({ response: { statusCode, headers, body: JSON.stringify({ error }) } })
    if (event.httpMethod === 'OPTIONS') return { response: { statusCode: 204, headers, body: '' } }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return reject(403, 'Forbidden: origin not allowed')
    const h = event.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
    if (!token) return reject(401, 'Unauthorized: missing token')
    const entry = TOKENS[token]
    if (!entry) return reject(401, 'Unauthorized: invalid or expired token')
    if (adminOnly && entry.profile.role !== 'admin') return reject(403, 'Forbidden: admin access required')
    if (clientId !== null && entry.profile.role !== 'admin' && String(entry.profile.client_id) !== String(clientId)) return reject(403, 'Forbidden: client mismatch')
    return { user: entry.user, profile: entry.profile, headers }
  },
}
const authPath = require.resolve(path.join(FN, '_auth.js'))
const am = new Module(authPath, null)
am.filename = authPath; am.loaded = true; am.exports = authMock
require.cache[authPath] = am

const handler = require(path.join(FN, 'client-api-keys.js'))
const { CLIENT_API_KEY_RE, hashClientApiKey, clientApiKeyPrefix } = require(path.join(FN, '_client_api_key.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

let clock = new Date('2026-09-22T10:00:00Z')
const db = createFakeSupabase({ now: () => clock })
db.seed('clients', [
  { id: 1, name: 'Alpha', plan: 'growth', category: 'active' },
  { id: 2, name: 'Bravo', plan: 'radar', category: 'active' },
  { id: 3, name: 'Freebie', plan: 'free', category: 'active' },
  { id: 4, name: 'Study', plan: 'pro', category: 'research' },
])

async function call(body, { token = 'viewer-a-jwt', method = 'POST', origin = 'https://app.getbrandgeo.com', supabase = db } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  if (token) headers.authorization = `Bearer ${token}`
  const res = await handler.handle({ httpMethod: method, headers, body: typeof body === 'string' ? body : JSON.stringify(body) }, { supabase, now: () => clock })
  let parsed = null
  try { parsed = res.body ? JSON.parse(res.body) : null } catch { parsed = res.body }
  return { status: res.statusCode, body: parsed, raw: res.body || '' }
}

async function main() {
  section('1. issue')
  let r = await call({ action: 'issue', client_id: 1, label: '  Cursor, laptop  ' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  const secret = r.body.secret
  assert.match(secret, CLIENT_API_KEY_RE)
  assert.ok(secret.startsWith('bgmcp_1_'))
  assert.deepStrictEqual(Object.keys(r.body.key).sort(), ['created_at', 'id', 'key_prefix', 'label', 'scope'])
  assert.strictEqual(r.body.key.label, 'Cursor, laptop')
  assert.strictEqual(r.body.key.key_prefix, clientApiKeyPrefix(secret))
  const stored = db.rows('client_api_keys').find((k) => k.id === r.body.key.id)
  assert.strictEqual(stored.key_hash, hashClientApiKey(secret))
  assert.strictEqual(stored.key_prefix, secret.slice(0, 'bgmcp_1_'.length + 6))
  assert.strictEqual(stored.created_by, 'u-viewer-a')
  assert.strictEqual(stored.client_id, 1)
  assert.ok(!JSON.stringify(db.rows('client_api_keys')).includes(secret), 'the secret must not be stored')
  assert.ok(!JSON.stringify(db.rows('client_api_keys')).includes(secret.slice(-48)), 'the secret part must not be stored')
  assert.deepStrictEqual(authCalls[authCalls.length - 1], { clientId: 1 })
  ok('issue returns the secret once, matching CLIENT_API_KEY_RE; the row holds its sha256 and prefix, not the secret; requireAuth got client_id')
  const firstId = r.body.key.id
  r = await call({ action: 'issue', client_id: 1 })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.key.label, 'Key 2')
  assert.notStrictEqual(r.body.secret, secret)
  ok('an empty label defaults to "Key <n>"; each issue mints a new secret')
  r = await call({ action: 'issue', client_id: 1, label: 'x'.repeat(61) })
  assert.strictEqual(r.status, 400)
  r = await call({ action: 'issue', client_id: 1, label: 42 })
  assert.strictEqual(r.status, 400)
  ok('label over 60 characters or not text: 400')

  section('2. list')
  r = await call({ action: 'list', client_id: 1 })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.keys.length, 2)
  assert.strictEqual(r.body.max_keys, 5); assert.strictEqual(r.body.allowed, true); assert.strictEqual(r.body.required_plan, 'radar')
  for (const k of r.body.keys) assert.deepStrictEqual(Object.keys(k).sort(), ['created_at', 'id', 'key_prefix', 'label', 'last_used_at', 'scope'])
  assert.ok(!r.raw.includes('key_hash') && !r.raw.includes(hashClientApiKey(secret)) && !r.raw.includes(secret))
  ok('list returns named columns only: no key_hash, no hash value, no secret')

  section('3. revoke')
  r = await call({ action: 'revoke', client_id: 1, id: firstId })
  assert.deepStrictEqual(r.body, { ok: true, id: firstId })
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === firstId).revoked_at, clock.toISOString())
  r = await call({ action: 'revoke', client_id: 1, id: firstId })
  assert.strictEqual(r.status, 404)
  r = await call({ action: 'list', client_id: 1 })
  assert.strictEqual(r.body.keys.length, 1); assert.ok(!r.body.keys.some((k) => k.id === firstId))
  assert.strictEqual(db.rows('client_api_keys').length, 2, 'revoke never deletes the row')
  ok('revoke sets revoked_at; a second revoke 404s; list omits revoked keys; the row is kept')
  r = await call({ action: 'issue', client_id: 2, label: 'B key' }, { token: 'viewer-b-jwt' })
  const bKeyId = r.body.key.id
  r = await call({ action: 'revoke', client_id: 1, id: bKeyId })
  assert.strictEqual(r.status, 404)
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === bKeyId).revoked_at, null)
  r = await call({ action: 'revoke', client_id: 1, id: 'not-a-uuid' })
  assert.strictEqual(r.status, 404)
  ok("another client's key id 404s and stays active; a malformed id 404s")

  section('4. refusals')
  r = await call({ action: 'issue', client_id: 3 }, { token: 'viewer-free-jwt' })
  assert.strictEqual(r.status, 403); assert.strictEqual(r.body.required_plan, 'radar')
  assert.strictEqual(r.body.error, 'MCP access needs the Radar plan or higher.')
  r = await call({ action: 'list', client_id: 3 }, { token: 'viewer-free-jwt' })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.allowed, false)
  ok('free: issue refused 403 with required_plan radar; list still answers (allowed: false)')
  // Downgrade: old keys stay listable and revocable.
  r = await call({ action: 'issue', client_id: 2, label: 'before downgrade' }, { token: 'viewer-b-jwt' })
  const downKey = r.body.key.id
  db.rows('clients').find((c) => c.id === 2).plan = 'free'
  r = await call({ action: 'list', client_id: 2 }, { token: 'viewer-b-jwt' })
  assert.ok(r.body.keys.some((k) => k.id === downKey)); assert.strictEqual(r.body.allowed, false)
  r = await call({ action: 'revoke', client_id: 2, id: downKey }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200)
  db.rows('clients').find((c) => c.id === 2).plan = 'radar'
  ok('a downgraded client can still list and revoke its old keys (not plan gated)')
  r = await call({ action: 'issue', client_id: 4 }, { token: 'viewer-research-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'issue', client_id: 4, label: 'study' }, { token: 'admin-jwt' })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === r.body.key.id).created_by, 'u-admin')
  ok('research client: viewer refused 403, admin allowed (created_by = admin)')
  for (let i = 0; i < 3; i++) { r = await call({ action: 'issue', client_id: 1 }); assert.strictEqual(r.status, 200) }
  r = await call({ action: 'list', client_id: 1 })
  assert.strictEqual(r.body.keys.length, 4)
  r = await call({ action: 'issue', client_id: 1 })
  assert.strictEqual(r.status, 200)
  r = await call({ action: 'issue', client_id: 1 })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.error, 'Revoke a key to issue a new one.')
  ok('the sixth active key is refused 409 (revoked keys do not count)')

  section('5. ownership (requireAuth)')
  const before = db.rows('client_api_keys').length
  r = await call({ action: 'list', client_id: 2 }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'issue', client_id: 2 }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'revoke', client_id: 2, id: bKeyId }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'revoke', client_id: '2', id: bKeyId }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  assert.strictEqual(db.rows('client_api_keys').length, before)
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === bKeyId).revoked_at, null)
  r = await call({ action: 'list', client_id: 2 }, { token: 'admin-jwt' })
  assert.strictEqual(r.status, 200)
  ok("viewer of client A cannot list, issue or revoke on client B; an admin can act on any client")
  r = await call({ action: 'list' }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 400)
  r = await call({ action: 'list', client_id: 'abc' }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 400)
  r = await call('{nope', { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 400)
  r = await call({ action: 'list', client_id: 1 }, { token: null })
  assert.strictEqual(r.status, 401)
  r = await call({ action: 'list', client_id: 1 }, { method: 'GET' })
  assert.strictEqual(r.status, 405)
  r = await call('', { method: 'OPTIONS' })
  assert.strictEqual(r.status, 204)
  r = await call({ action: 'explode', client_id: 1 })
  assert.strictEqual(r.status, 400)
  ok('missing or malformed client_id and bad JSON 400; no token 401; GET 405; OPTIONS 204 preflight; unknown action 400')

  section('6. migration not applied')
  const missing = createFakeSupabase({ now: () => clock })
  missing.seed('clients', [{ id: 1, plan: 'growth', category: 'active' }])
  const origFrom = missing.from.bind(missing)
  missing.from = (t) => { const q = origFrom(t); if (t === 'client_api_keys') q._run = async () => ({ data: null, error: { code: '42P01', message: 'relation "public.client_api_keys" does not exist' } }); return q }
  for (const body of [{ action: 'list', client_id: 1 }, { action: 'issue', client_id: 1 }, { action: 'revoke', client_id: 1, id: crypto.randomUUID() }]) {
    r = await call(body, { supabase: missing })
    assert.strictEqual(r.status, 503, body.action); assert.strictEqual(r.body.error, 'MCP keys are not available yet.')
  }
  ok('42P01 answers 503 "MCP keys are not available yet" on list, issue and revoke')

  section('7. write scope (mcp-stage2-fixes.md 9.3)')
  // Client 2 (radar) has one active key here; viewer B acts on its own client.
  r = await call({ action: 'issue', client_id: 2, label: 'default scope' }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.key.scope, 'read')
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === r.body.key.id).scope, 'read')
  const readKeyId = r.body.key.id
  r = await call({ action: 'issue', client_id: 2, label: 'explicit read', scope: 'read' }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.key.scope, 'read')
  r = await call({ action: 'issue', client_id: 2, label: 'null scope', scope: null }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.key.scope, 'read')
  ok('issue without scope, with "read" and with null: scope read, in the response and on the row')
  r = await call({ action: 'issue', client_id: 2, label: 'agent', scope: 'read_write' }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.key.scope, 'read_write')
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === r.body.key.id).scope, 'read_write')
  const rwKeyId = r.body.key.id
  ok('issue with scope read_write: the key row and the response carry read_write')
  const rowsBefore = db.rows('client_api_keys').length
  for (const bad of ['write', 'READ', 'read write', '', 1, true, ['read'], { scope: 'read' }]) {
    r = await call({ action: 'issue', client_id: 2, label: 'bad', scope: bad }, { token: 'viewer-b-jwt' })
    assert.strictEqual(r.status, 400, JSON.stringify(bad))
    assert.deepStrictEqual(r.body, { error: 'Scope must be read or read_write.' })
  }
  assert.strictEqual(db.rows('client_api_keys').length, rowsBefore, 'a refused scope writes no row')
  ok('any other scope (other words, wrong case, empty, number, boolean, array, object): 400 "Scope must be read or read_write.", no row written')
  r = await call({ action: 'list', client_id: 2 }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200)
  assert.ok(r.body.keys.length >= 4)
  for (const k of r.body.keys) assert.ok(k.scope === 'read' || k.scope === 'read_write', JSON.stringify(k))
  assert.strictEqual(r.body.keys.find((k) => k.id === rwKeyId).scope, 'read_write')
  assert.strictEqual(r.body.keys.find((k) => k.id === readKeyId).scope, 'read')
  assert.strictEqual(r.body.keys.find((k) => k.id === bKeyId).scope, 'read', 'a key issued before scope existed reads read')
  ok('list carries scope on every key row; older keys read "read"')
  // A key row without the column value (a pre-migration row in the fake) reads as read only.
  db.rows('client_api_keys').find((k) => k.id === bKeyId).scope = undefined
  r = await call({ action: 'list', client_id: 2 }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.body.keys.find((k) => k.id === bKeyId).scope, 'read')
  db.rows('client_api_keys').find((k) => k.id === bKeyId).scope = 'read'
  ok('a missing or unexpected stored scope is reported as read, never as read_write')
  // Before the scope migration: the select names the column 42703, the
  // insert gets PGRST204. List and read keys keep working; read_write is 503.
  const premig = createFakeSupabase({ now: () => clock })
  premig.seed('clients', [{ id: 1, plan: 'growth', category: 'active' }])
  premig.seed('client_api_keys', [{ id: crypto.randomUUID(), client_id: 1, key_hash: 'h'.repeat(64), key_prefix: 'bgmcp_1_aaaaaa', label: 'old', created_by: 'u-viewer-a' }])
  for (const row of premig.rows('client_api_keys')) delete row.scope
  const premigFrom = premig.from.bind(premig)
  premig.from = (t) => {
    const q = premigFrom(t)
    if (t !== 'client_api_keys') return q
    const run = q._run.bind(q)
    q._run = async () => {
      if (q.op === 'insert' && q.payload.some((x) => 'scope' in x)) return { data: null, error: { code: 'PGRST204', message: "Could not find the 'scope' column of 'client_api_keys' in the schema cache" } }
      if (/\bscope\b/.test(String(q.cols))) return { data: null, error: { code: '42703', message: 'column client_api_keys.scope does not exist' } }
      return run()
    }
    return q
  }
  r = await call({ action: 'list', client_id: 1 }, { supabase: premig })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.deepStrictEqual(r.body.keys.map((k) => [k.label, k.scope]), [['old', 'read']])
  r = await call({ action: 'issue', client_id: 1, label: 'new read' }, { supabase: premig })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body)); assert.strictEqual(r.body.key.scope, 'read')
  const premigCount = premig.rows('client_api_keys').length
  assert.strictEqual(premigCount, 2)
  r = await call({ action: 'issue', client_id: 1, label: 'agent', scope: 'read_write' }, { supabase: premig })
  assert.strictEqual(r.status, 503); assert.deepStrictEqual(r.body, { error: 'Read and write keys are not available yet.' })
  assert.strictEqual(premig.rows('client_api_keys').length, premigCount, 'no row for a refused read_write issue')
  ok('before the scope migration: list answers with every key read, a read key is still issued, a read_write issue is 503 and writes no row')

  section('9. stage 3: Connected apps and the Anthropic-held client (mcp-stage3-oauth.md 6.1, 7 item 8)')
  const oauthLib = require(path.join(FN, '_oauth.js'))
  // create_anthropic_client: admin only, no client_id needed.
  r = await call({ action: 'create_anthropic_client' }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  assert.strictEqual(db.rows('oauth_clients').length, 0)
  r = await call({ action: 'create_anthropic_client', name: 42 }, { token: 'admin-jwt' })
  assert.strictEqual(r.status, 400)
  r = await call({ action: 'create_anthropic_client', name: 'n'.repeat(61) }, { token: 'admin-jwt' })
  assert.strictEqual(r.status, 400)
  r = await call({ action: 'create_anthropic_client' }, { token: 'admin-jwt' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.deepStrictEqual(Object.keys(r.body).sort(), ['client', 'client_secret'])
  assert.match(r.body.client.id, oauthLib.CONFIDENTIAL_CLIENT_ID_RE)
  assert.match(r.body.client_secret, oauthLib.CLIENT_SECRET_RE)
  assert.deepStrictEqual([r.body.client.name, r.body.client.redirect_uris], ['Claude', ['https://claude.ai/api/mcp/auth_callback']])
  const oc = db.rows('oauth_clients').find((x) => x.id === r.body.client.id)
  assert.deepStrictEqual([oc.kind, oc.secret_hash], ['confidential', oauthLib.sha256Hex(r.body.client_secret)])
  assert.ok(!JSON.stringify(db.tables).includes(r.body.client_secret), 'the client secret is stored hashed only')
  const createdSecret = r.body.client_secret
  ok('create_anthropic_client: viewers 403; admin gets a bgoc_ id and a bgocs_ secret once, redirect exactly the claude.ai callback, the row holds sha256 only; bad names 400')
  const authed = await oauthLib.authenticateClient(db, { basic: { id: r.body.client.id, secret: createdSecret } })
  assert.strictEqual(authed.kind, 'confidential')
  ok('the minted client authenticates at the token endpoint with its secret')

  // list_grants and revoke_grant.
  const ago = (d) => new Date(clock.getTime() - d * 86400_000).toISOString()
  const ahead = (d) => new Date(clock.getTime() + d * 86400_000).toISOString()
  const mk = (o) => Object.assign({ id: crypto.randomUUID(), client_id: 1, user_id: 'u-viewer-a', oauth_client_id: r.body.client.id, client_name: 'Claude', redirect_host: 'claude.ai', scope: 'mcp:read offline_access', created_at: ago(3), last_used_at: null, revoked_at: null, expires_at: ahead(80) }, o)
  const gLive = mk({ scope: 'mcp:read mcp:write offline_access', last_used_at: ago(1) })
  const gCode = mk({ oauth_client_id: 'https://claude.ai/oauth/claude-code-client-metadata', client_name: 'Claude Code', redirect_host: 'localhost', created_at: ago(1), user_id: 'u-viewer-a2' })
  const gRevoked = mk({ revoked_at: ago(1), user_id: 'u-viewer-a3' })
  const gExpired = mk({ expires_at: ago(1), user_id: 'u-viewer-a4' })
  const gOther = mk({ client_id: 2, user_id: 'u-viewer-b' })
  db.seed('oauth_grants', [gLive, gCode, gRevoked, gExpired, gOther])
  db.seed('oauth_tokens', [
    { id: crypto.randomUUID(), grant_id: gLive.id, kind: 'access', token_hash: 'a'.repeat(64), scope: gLive.scope, expires_at: ahead(1) },
    { id: crypto.randomUUID(), grant_id: gLive.id, kind: 'refresh', token_hash: 'b'.repeat(64), scope: gLive.scope, expires_at: ahead(30) },
    { id: crypto.randomUUID(), grant_id: gOther.id, kind: 'access', token_hash: 'c'.repeat(64), scope: gOther.scope, expires_at: ahead(1) },
  ])
  r = await call({ action: 'list_grants', client_id: 1 })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.available, true)
  assert.deepStrictEqual(r.body.grants.map((g) => g.id), [gCode.id, gLive.id], 'live only, newest first')
  for (const g of r.body.grants) assert.deepStrictEqual(Object.keys(g).sort(), ['access', 'client_name', 'created_at', 'id', 'last_used_at', 'redirect_host'])
  assert.deepStrictEqual(r.body.grants.map((g) => [g.client_name, g.redirect_host, g.access]), [['Claude Code', 'localhost', 'read'], ['Claude', 'claude.ai', 'read_write']])
  assert.ok(!r.raw.includes('user_id') && !r.raw.includes('oauth_client_id') && !r.raw.includes('token_hash'))
  ok('list_grants: live grants of this client only (revoked, expired and other clients left out), newest first, with name, redirect host, access, connected and last used; no user id or token data')
  r = await call({ action: 'list_grants', client_id: 2 }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'list_grants', client_id: 2 }, { token: 'admin-jwt' })
  assert.deepStrictEqual(r.body.grants.map((g) => g.id), [gOther.id])
  db.rows('clients').find((c) => c.id === 2).plan = 'free'
  r = await call({ action: 'list_grants', client_id: 2 }, { token: 'viewer-b-jwt' })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.grants.length, 1)
  db.rows('clients').find((c) => c.id === 2).plan = 'radar'
  ok("list_grants: a viewer of another client 403, an admin sees any client's, a downgraded client still lists (not plan gated)")
  r = await call({ action: 'revoke_grant', client_id: 1, id: gOther.id })
  assert.strictEqual(r.status, 404)
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === gOther.id).revoked_at, null)
  r = await call({ action: 'revoke_grant', client_id: 2, id: gOther.id }, { token: 'viewer-a-jwt' })
  assert.strictEqual(r.status, 403)
  r = await call({ action: 'revoke_grant', client_id: 1, id: 'nope' })
  assert.strictEqual(r.status, 404)
  r = await call({ action: 'revoke_grant', client_id: 1, id: gLive.id })
  assert.deepStrictEqual(r.body, { ok: true, id: gLive.id })
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === gLive.id).revoked_at, clock.toISOString())
  assert.ok(db.rows('oauth_tokens').filter((t) => t.grant_id === gLive.id).every((t) => t.revoked_at === clock.toISOString()))
  assert.strictEqual(db.rows('oauth_tokens').find((t) => t.grant_id === gOther.id).revoked_at, null)
  r = await call({ action: 'revoke_grant', client_id: 1, id: gLive.id })
  assert.strictEqual(r.status, 404)
  r = await call({ action: 'list_grants', client_id: 1 })
  assert.deepStrictEqual(r.body.grants.map((g) => g.id), [gCode.id])
  assert.ok(db.rows('oauth_grants').some((g) => g.id === gLive.id), 'revoke never deletes the grant')
  ok("revoke_grant: another client's grant 404 (untouched), a foreign client_id 403, a malformed id 404; the owner's revoke sets revoked_at on the grant and every live token, a second revoke 404s, the row is kept")
  const noGrants = createFakeSupabase({ now: () => clock })
  noGrants.seed('clients', [{ id: 1, plan: 'growth', category: 'active' }])
  const ngFrom = noGrants.from.bind(noGrants)
  noGrants.from = (t) => { const q = ngFrom(t); if (t.startsWith('oauth_')) q._run = async () => ({ data: null, error: { code: '42P01', message: `relation "public.${t}" does not exist` } }); return q }
  r = await call({ action: 'list_grants', client_id: 1 }, { supabase: noGrants })
  assert.deepStrictEqual([r.status, r.body], [200, { grants: [], available: false }])
  r = await call({ action: 'revoke_grant', client_id: 1, id: crypto.randomUUID() }, { supabase: noGrants })
  assert.strictEqual(r.status, 404)
  r = await call({ action: 'create_anthropic_client' }, { token: 'admin-jwt', supabase: noGrants })
  assert.deepStrictEqual([r.status, r.body], [503, { error: 'OAuth clients are not available yet.' }])
  ok('before the OAuth migration: list_grants answers 200 { grants: [], available: false }, revoke_grant 404, create_anthropic_client 503')

  section('8. logging')
  const secrets = db.rows('client_api_keys').map((k) => k.key_hash)
  // Server output only: the test's own "ok -" lines name the prefix on purpose.
  for (const l of captured.filter((x) => !x.startsWith('  ok - '))) {
    assert.ok(!l.includes(createdSecret) && !l.includes(oauthLib.sha256Hex(createdSecret)) && !/bgocs_/i.test(l), `a log line contains the OAuth client secret or its hash: ${l.slice(0, 80)}`)
  }
  for (const l of captured) {
    assert.ok(!l.includes('bgmcp_'), 'a log line contains bgmcp_')
    for (const h of secrets) assert.ok(!l.includes(h), 'a log line contains a key hash')
  }
  ok(`${captured.length} captured log lines: no bgmcp_ and no key hash`)

  console.log(`\n${passed} passed`)
}

main().catch((err) => { console.error('FAILED:', err && err.message); process.exit(1) })
