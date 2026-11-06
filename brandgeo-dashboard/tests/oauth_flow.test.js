/**
 * oauth_flow.test.js: MCP stage 3 end to end against the in-memory Supabase
 * fake (docs/arch/mcp-stage3-oauth.md sections 3 to 6 and 8). No network: the
 * CIMD fetch is injected.
 *
 * Covers: the three metadata documents (oauth-metadata.js); authorize check
 * and decide (oauth-authorize.js) with every check of 4.2 in order, page
 * errors before the redirect is proven and redirect-borne errors after it,
 * R6, R8 and research refusals, the pending request bound to its user;
 * the token endpoint (oauth-token.js) with form-only bodies, client auth,
 * single-use codes and replay revocation, PKCE, redirect and resource checks,
 * one live grant per user, refresh rotation with reuse detection and scope
 * narrowing; revoke (RFC 7009, always 200); and an issued bgmat_ token used
 * on mcp-server.js. Ends with the no-secret log check.
 *
 * _auth.js is replaced in require.cache with a scripted requireAuth (204
 * preflight, 403 foreign origin, 401 without or with an unknown JWT, returns
 * { user, profile, headers }), as tests/client_api_keys.test.js does.
 *
 * Run: `node tests/oauth_flow.test.js` from brandgeo-dashboard/.
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

require('./helpers/ts_require')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const FN = path.join(__dirname, '..', 'netlify', 'functions')
const ALLOWED_ORIGINS = ['https://app.getbrandgeo.com', 'http://localhost:5173', 'http://localhost:3000']
const cors = (origin) => ({ 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], 'Content-Type': 'application/json' })

// Fictional people and brands only; numeric ids.
const U = {
  viewer: 'bbbbbbbb-0000-4000-8000-000000000011',
  viewer2: 'bbbbbbbb-0000-4000-8000-000000000012',
  admin: 'bbbbbbbb-0000-4000-8000-000000000001',
  free: 'bbbbbbbb-0000-4000-8000-000000000021',
  research: 'bbbbbbbb-0000-4000-8000-000000000031',
  noclient: 'bbbbbbbb-0000-4000-8000-000000000041',
  other: 'bbbbbbbb-0000-4000-8000-000000000051',
}
const JWT = {
  'viewer-jwt': { user: { id: U.viewer }, profile: { role: 'viewer', client_id: 11 } },
  'viewer2-jwt': { user: { id: U.viewer2 }, profile: { role: 'viewer', client_id: 11 } },
  'admin-jwt': { user: { id: U.admin }, profile: { role: 'admin', client_id: null } },
  'free-jwt': { user: { id: U.free }, profile: { role: 'viewer', client_id: 12 } },
  'research-jwt': { user: { id: U.research }, profile: { role: 'viewer', client_id: 13 } },
  'noclient-jwt': { user: { id: U.noclient }, profile: { role: 'viewer', client_id: null } },
  'other-jwt': { user: { id: U.other }, profile: { role: 'viewer', client_id: 14 } },
}
const authMock = {
  ALLOWED_ORIGINS,
  corsHeaders: cors,
  checkCollectionLimits: async () => ({ blocked: false }),
  async requireAuth(event) {
    const origin = event.headers.origin || ''
    const headers = cors(origin)
    const reject = (statusCode, error) => ({ response: { statusCode, headers, body: JSON.stringify({ error }) } })
    if (event.httpMethod === 'OPTIONS') return { response: { statusCode: 204, headers, body: '' } }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return reject(403, 'Forbidden: origin not allowed')
    const h = event.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
    if (!token) return reject(401, 'Unauthorized: missing token')
    const entry = JWT[token]
    if (!entry) return reject(401, 'Unauthorized: invalid or expired token')
    // The real requireAuth reads the live profile; the mock reads the fake's row when present.
    return { user: entry.user, profile: entry.profile, headers }
  },
}
const authPath = require.resolve(path.join(FN, '_auth.js'))
const am = new Module(authPath, null)
am.filename = authPath; am.loaded = true; am.exports = authMock
require.cache[authPath] = am

const o = require(path.join(FN, '_oauth.js'))
const meta = require(path.join(FN, 'oauth-metadata.js'))
const authz = require(path.join(FN, 'oauth-authorize.js'))
const tokenFn = require(path.join(FN, 'oauth-token.js'))
const mcp = require(path.join(FN, 'mcp-server.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

let clock = new Date('2026-11-10T10:00:00Z')
const db = createFakeSupabase({ now: () => clock })
db.seed('clients', [
  { id: 11, name: 'Ardent Kite', plan: 'growth', category: 'active', brand_aliases: [], brand_website: null, engines_enabled: null, known_competitors: [] },
  { id: 12, name: 'Pebble Row', plan: 'free', category: 'active', brand_aliases: [], brand_website: null, engines_enabled: null, known_competitors: [] },
  { id: 13, name: 'Study Set', plan: 'pro', category: 'research', brand_aliases: [], brand_website: null, engines_enabled: null, known_competitors: [] },
  { id: 14, name: 'Copper Finch', plan: 'radar', category: 'active', brand_aliases: [], brand_website: null, engines_enabled: null, known_competitors: [] },
])
db.seed('user_profiles', [
  { id: U.viewer, role: 'viewer', client_id: 11 }, { id: U.viewer2, role: 'viewer', client_id: 11 },
  { id: U.admin, role: 'admin', client_id: null }, { id: U.free, role: 'viewer', client_id: 12 },
  { id: U.research, role: 'viewer', client_id: 13 }, { id: U.other, role: 'viewer', client_id: 14 },
])
const CONF_ID = o.makeConfidentialClientId()
const CONF_SECRET = o.makeClientSecret()
db.seed('oauth_clients', [{ id: CONF_ID, kind: 'confidential', name: 'Claude', redirect_uris: [o.ANTHROPIC_REDIRECT_URI], secret_hash: o.sha256Hex(CONF_SECRET) }])
const CC_URL = 'https://claude.ai/oauth/claude-code-client-metadata'
const CC_DOC = { client_id: CC_URL, client_name: 'Claude Code', redirect_uris: ['http://localhost/callback', 'http://127.0.0.1/callback'], token_endpoint_auth_method: 'none' }
let fetchCalls = 0
let fetchImpl = async () => { fetchCalls++; return new Response(JSON.stringify(CC_DOC), { status: 200 }) }

const SECRETS = [CONF_SECRET]          // every secret, token, code and request id seen, for the log check
const remember = (s) => { if (s) SECRETS.push(s); return s }

function jparse(s) { try { return s ? JSON.parse(s) : null } catch { return s } }

async function authorize(body, { jwt = 'viewer-jwt', origin = 'https://app.getbrandgeo.com', method = 'POST' } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  if (jwt) headers.authorization = `Bearer ${jwt}`
  const res = await authz.handle({ httpMethod: method, headers, body: typeof body === 'string' ? body : JSON.stringify(body) }, { supabase: db, now: () => clock, fetchImpl, cimdTimeoutMs: 50 })
  const parsed = jparse(res.body)
  if (parsed && parsed.request_id) remember(parsed.request_id)
  if (parsed && parsed.redirect) { const c = new URL(parsed.redirect).searchParams.get('code'); if (c) remember(c) }
  return { status: res.statusCode, headers: res.headers || {}, body: parsed }
}

let reqN = 0
async function token(form, { basic = null, ctype = 'application/x-www-form-urlencoded', path: p = '/oauth/token', raw = null, method = 'POST' } = {}) {
  const headers = { 'content-type': ctype }
  if (basic) headers.authorization = `Basic ${Buffer.from(`${encodeURIComponent(basic[0])}:${encodeURIComponent(basic[1])}`).toString('base64')}`
  const body = raw !== null ? raw : new URLSearchParams(form).toString()
  const res = await tokenFn.handle({ httpMethod: method, path: p, headers, body }, { awsRequestId: `tok${++reqN}-xxxx` }, { supabase: db, now: () => clock })
  const parsed = jparse(res.body)
  if (parsed && parsed.access_token) remember(parsed.access_token)
  if (parsed && parsed.refresh_token) remember(parsed.refresh_token)
  return { status: res.statusCode, headers: res.headers || {}, body: parsed }
}

function pkce() {
  const verifier = remember(crypto.randomBytes(32).toString('base64url'))
  return { verifier, challenge: o.pkceChallengeS256(verifier) }
}

const CONF_AUTH = { basic: [CONF_ID, CONF_SECRET] }
function checkParams({ client = CONF_ID, redirect = o.ANTHROPIC_REDIRECT_URI, scope = 'mcp:read mcp:write offline_access', state = 'st-1', challenge, method = 'S256', resource = o.RESOURCE, responseType = 'code' } = {}) {
  return { action: 'check', response_type: responseType, client_id: client, redirect_uri: redirect, scope, state, code_challenge: challenge, code_challenge_method: method, resource }
}

/** Full consent: check then decide(allow). Returns the code, verifier and redirect. */
async function consent({ client = CONF_ID, redirect = o.ANTHROPIC_REDIRECT_URI, scope = 'mcp:read mcp:write offline_access', write = false, jwt = 'viewer-jwt', state = 'st-1' } = {}) {
  const p = pkce()
  const c = await authorize(checkParams({ client, redirect, scope, challenge: p.challenge, state }), { jwt })
  assert.strictEqual(c.status, 200, JSON.stringify(c.body)); assert.strictEqual(c.body.ok, true, JSON.stringify(c.body))
  const d = await authorize({ action: 'decide', request_id: c.body.request_id, allow: true, write }, { jwt })
  assert.strictEqual(d.status, 200, JSON.stringify(d.body))
  const u = new URL(d.body.redirect)
  return { code: u.searchParams.get('code'), state: u.searchParams.get('state'), redirect: d.body.redirect, ...p, check: c.body }
}

async function exchange(c, { auth = CONF_AUTH, redirect = o.ANTHROPIC_REDIRECT_URI, extra = {} } = {}) {
  const form = { grant_type: 'authorization_code', code: c.code, redirect_uri: redirect, code_verifier: c.verifier, ...extra }
  return token(form, auth)
}

async function mcpCall(method, params, accessToken, id = 1) {
  const res = await mcp.handle({ httpMethod: 'POST', path: '/mcp', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}`, 'MCP-Protocol-Version': '2025-06-18' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) }) }, { awsRequestId: `mcp${++reqN}-xx` }, { supabase: db, now: () => clock, config: { perKeyPerMinute: 1000, perClientPerDay: 100000 } })
  return { status: res.statusCode, headers: res.headers || {}, body: jparse(res.body) }
}

async function main() {
  section('1. metadata (oauth-metadata.js, sections 3.2 and 3.3)')
  for (const [p, want] of [
    ['/.well-known/oauth-protected-resource/mcp', o.PROTECTED_RESOURCE_METADATA],
    ['/.well-known/oauth-protected-resource', o.PROTECTED_RESOURCE_METADATA],
    ['/.well-known/oauth-authorization-server', o.AUTHORIZATION_SERVER_METADATA],
  ]) {
    const res = await meta.handle({ httpMethod: 'GET', path: p, headers: {} })
    assert.strictEqual(res.statusCode, 200, p)
    assert.strictEqual(res.headers['Content-Type'], 'application/json')
    assert.strictEqual(res.headers['Cache-Control'], 'public, max-age=3600')
    assert.deepStrictEqual(JSON.parse(res.body), JSON.parse(JSON.stringify(want)))
  }
  assert.strictEqual(JSON.parse((await meta.handle({ httpMethod: 'GET', path: '/.well-known/oauth-protected-resource/mcp', headers: {} })).body).resource, 'https://app.getbrandgeo.com/mcp')
  ok('both PRM paths and the AS path answer the exact JSON documents, application/json, public max-age 3600; resource byte-equal to the MCP URL')
  let res = await meta.handle({ httpMethod: 'GET', path: '/.well-known/openid-configuration', headers: {} })
  assert.strictEqual(res.statusCode, 404)
  res = await meta.handle({ httpMethod: 'POST', path: '/.well-known/oauth-authorization-server', headers: {} })
  assert.strictEqual(res.statusCode, 405)
  res = await meta.handle({ httpMethod: 'HEAD', path: '/.well-known/oauth-authorization-server', headers: {} })
  assert.strictEqual(res.statusCode, 200); assert.strictEqual(res.body, '')
  res = await meta.handle({ httpMethod: 'OPTIONS', path: '/.well-known/oauth-authorization-server', headers: {} })
  assert.strictEqual(res.statusCode, 204)
  ok('an unknown well-known path 404; POST 405; HEAD 200 empty; OPTIONS 204')

  section('2. authorize check: before the redirect is proven (page errors, never a redirect)')
  const p0 = pkce()
  const pageErr = async (body, code, status, opts) => {
    const r = await authorize(body, opts)
    assert.strictEqual(r.status, status, `${code}: ${JSON.stringify(r.body)}`)
    assert.strictEqual(r.body.ok, false); assert.strictEqual(r.body.error, code)
    assert.ok(!('redirect' in r.body), `${code} must not redirect`)
    return r
  }
  const pendingBefore = db.rows('oauth_codes').length
  await pageErr(checkParams({ client: null, challenge: p0.challenge }), 'invalid_client', 400)
  await pageErr(checkParams({ client: o.makeConfidentialClientId(), challenge: p0.challenge }), 'invalid_client', 400)
  await pageErr(checkParams({ client: 'https://evil.example/client.json', challenge: p0.challenge }), 'invalid_client', 400)
  await pageErr(checkParams({ client: CONF_ID, redirect: 'https://evil.example/cb', challenge: p0.challenge }), 'invalid_redirect_uri', 400)
  await pageErr(checkParams({ client: CONF_ID, redirect: 'http://localhost:4000/callback', challenge: p0.challenge }), 'invalid_redirect_uri', 400)
  await pageErr(checkParams({ client: CONF_ID, redirect: null, challenge: p0.challenge }), 'invalid_redirect_uri', 400)
  // A bad redirect also beats every later check: the response_type here is wrong too.
  await pageErr(checkParams({ client: CONF_ID, redirect: 'https://evil.example/cb', challenge: 'x', responseType: 'token' }), 'invalid_redirect_uri', 400)
  const savedFetch = fetchImpl
  fetchImpl = async () => { throw new Error('down') }
  await pageErr(checkParams({ client: CC_URL, redirect: 'http://localhost:4000/callback', challenge: p0.challenge }), 'client_metadata_unavailable', 503)
  fetchImpl = savedFetch
  assert.strictEqual(db.rows('oauth_codes').length, pendingBefore, 'no pending row for a refused request')
  ok('missing, unknown or refused client, a redirect not registered for the client (also when other params are wrong) and an unreachable CIMD document: page errors, no redirect, nothing stored')

  section('3. authorize check: after the redirect is proven (errors go back to it)')
  const back = async (params, error, { withState = true } = {}) => {
    const r = await authorize(params)
    assert.strictEqual(r.status, 200, JSON.stringify(r.body)); assert.strictEqual(r.body.ok, false); assert.strictEqual(r.body.error, error)
    const u = new URL(r.body.redirect)
    assert.strictEqual(`${u.origin}${u.pathname}`, o.ANTHROPIC_REDIRECT_URI)
    assert.strictEqual(u.searchParams.get('error'), error)
    assert.strictEqual(u.searchParams.get('state'), withState ? 'st-1' : null)
    assert.strictEqual(u.searchParams.get('code'), null)
  }
  await back(checkParams({ challenge: p0.challenge, responseType: 'token' }), 'unsupported_response_type')
  await back(checkParams({ challenge: p0.challenge, method: 'plain' }), 'invalid_request')
  await back(checkParams({ challenge: p0.challenge, method: null }), 'invalid_request')
  await back(checkParams({ challenge: 'tooshort' }), 'invalid_request')
  await back(checkParams({ challenge: undefined }), 'invalid_request')
  await back(checkParams({ challenge: p0.challenge, resource: 'https://app.getbrandgeo.com/mcp/' }), 'invalid_target')
  await back(checkParams({ challenge: p0.challenge, resource: 'https://evil.example/mcp' }), 'invalid_target')
  await back({ ...checkParams({ challenge: p0.challenge }), state: 'x'.repeat(1025) }, 'invalid_request', { withState: false })
  assert.strictEqual(db.rows('oauth_codes').length, pendingBefore)
  ok('response_type not code, a method other than S256, a missing or short challenge, a foreign resource and an over-long state: error=... (and state) on the proven redirect, no code, nothing stored')

  section('4. authorize check: account (R6, R8, research)')
  await pageErr(checkParams({ challenge: p0.challenge }), 'admin_account', 403, { jwt: 'admin-jwt' })
  await pageErr(checkParams({ challenge: p0.challenge }), 'no_account', 403, { jwt: 'noclient-jwt' })
  const pr = await pageErr(checkParams({ challenge: p0.challenge }), 'plan_required', 403, { jwt: 'free-jwt' })
  assert.deepStrictEqual({ ...pr.body }, { ok: false, error: 'plan_required', required_plan: 'radar', required_plan_label: 'Radar', current_plan: 'free', upgrade_url: 'https://app.getbrandgeo.com/account' })
  await pageErr(checkParams({ challenge: p0.challenge }), 'account_unavailable', 403, { jwt: 'research-jwt' })
  let r = await authorize(checkParams({ challenge: p0.challenge }), { jwt: null })
  assert.strictEqual(r.status, 401)
  r = await authorize(checkParams({ challenge: p0.challenge }), { origin: 'https://evil.example' })
  assert.strictEqual(r.status, 403)
  r = await authorize('{nope')
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error, 'invalid_request')
  r = await authorize({ action: 'explode' })
  assert.strictEqual(r.body.error, 'invalid_request')
  assert.strictEqual(db.rows('oauth_codes').length, pendingBefore)
  ok('admin (R6), no client, Free (R8, with the plan fields), research: page errors; no JWT 401; foreign origin 403; bad JSON or action: invalid_request; nothing stored')

  section('5. authorize check: success')
  r = await authorize(checkParams({ challenge: p0.challenge, scope: 'mcp:read mcp:write offline_access openid' }))
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  const keys = Object.keys(r.body).sort()
  assert.deepStrictEqual(keys, ['brand_name', 'client_kind', 'client_name', 'expires_at', 'loopback', 'offline_requested', 'ok', 'redirect_host', 'request_id', 'write_requested'])
  assert.deepStrictEqual({ ...r.body, request_id: 'x' }, { ok: true, request_id: 'x', client_name: 'Claude', client_kind: 'confidential', redirect_host: 'claude.ai', loopback: false, brand_name: 'Ardent Kite', write_requested: true, offline_requested: true, expires_at: new Date(clock.getTime() + 300000).toISOString() })
  assert.match(r.body.request_id, o.REQUEST_ID_RE)
  const pend = db.rows('oauth_codes').slice(-1)[0]
  assert.strictEqual(pend.request_id_hash, o.sha256Hex(r.body.request_id)); assert.strictEqual(pend.code_hash, null)
  assert.ok(!JSON.stringify(db.rows('oauth_codes')).includes(r.body.request_id), 'the request id is stored hashed only')
  assert.deepStrictEqual([pend.user_id, pend.client_id, pend.oauth_client_id, pend.scope_requested, pend.resource, pend.state], [U.viewer, 11, CONF_ID, 'mcp:read mcp:write offline_access', o.RESOURCE, 'st-1'])
  ok('check returns what consent shows (client name and kind, redirect host, loopback, brand, write and offline requested) and a request id stored only as sha256; unknown scopes dropped')
  const rCC = await authorize(checkParams({ client: CC_URL, redirect: 'http://127.0.0.1:53111/callback', challenge: p0.challenge, scope: 'mcp:read', resource: null, state: null }))
  assert.strictEqual(rCC.status, 200, JSON.stringify(rCC.body))
  assert.deepStrictEqual([rCC.body.client_name, rCC.body.client_kind, rCC.body.redirect_host, rCC.body.loopback, rCC.body.write_requested, rCC.body.offline_requested], ['Claude Code', 'cimd', '127.0.0.1', true, false, false])
  assert.strictEqual(fetchCalls, 1)
  ok('a CIMD client (Claude Code) on a loopback port: fetched once, loopback true for the warning; no resource and no state accepted')

  section('6. authorize decide')
  // Deny.
  r = await authorize(checkParams({ challenge: p0.challenge }))
  let d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: false })
  assert.strictEqual(d.status, 200); assert.strictEqual(d.body.redirect, `${o.ANTHROPIC_REDIRECT_URI}?error=access_denied&state=st-1`)
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true })
  assert.strictEqual(d.body.error, 'request_expired')
  ok('Cancel: redirect with error=access_denied and the state; the request is consumed (a later Allow is request_expired)')
  // Bound to the user, single decision, expiry.
  r = await authorize(checkParams({ challenge: p0.challenge }))
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true }, { jwt: 'viewer2-jwt' })
  assert.strictEqual(d.body.error, 'request_expired')
  d = await authorize({ action: 'decide', request_id: 'A'.repeat(43), allow: true })
  assert.strictEqual(d.body.error, 'request_expired')
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: 'yes' })
  assert.strictEqual(d.body.error, 'invalid_request')
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true, write: 'on' })
  assert.strictEqual(d.body.error, 'invalid_request')
  clock = new Date(clock.getTime() + 301000)
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true })
  assert.strictEqual(d.body.error, 'request_expired')
  ok('another user, an unknown id and an expired (5 min) request: request_expired; a non-boolean allow or write: invalid_request')
  // Re-checks at decide from the stored request.
  r = await authorize(checkParams({ challenge: p0.challenge }))
  db.rows('clients').find((c) => c.id === 11).plan = 'free'
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true })
  assert.strictEqual(d.body.error, 'plan_required')
  db.rows('clients').find((c) => c.id === 11).plan = 'growth'
  db.rows('oauth_clients').find((c) => c.id === CONF_ID).disabled_at = clock.toISOString()
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true })
  assert.strictEqual(d.body.error, 'invalid_client')
  db.rows('oauth_clients').find((c) => c.id === CONF_ID).disabled_at = null
  JWT['viewer-jwt'].profile.client_id = 14
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true })
  assert.strictEqual(d.body.error, 'request_expired')
  JWT['viewer-jwt'].profile.client_id = 11
  ok('decide re-runs the checks from the stored request: a downgrade, a disabled client and a user moved to another client are refused')
  // Allow, write requested but not ticked.
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true, write: false })
  assert.strictEqual(d.status, 200, JSON.stringify(d.body))
  const u = new URL(d.body.redirect)
  assert.strictEqual(`${u.origin}${u.pathname}`, o.ANTHROPIC_REDIRECT_URI); assert.strictEqual(u.searchParams.get('state'), 'st-1')
  const code1 = u.searchParams.get('code')
  assert.match(code1, o.CODE_RE)
  const issued = db.rows('oauth_codes').find((x) => x.code_hash === o.sha256Hex(code1))
  assert.ok(issued); assert.strictEqual(issued.scope_granted, 'mcp:read offline_access')
  assert.strictEqual(issued.expires_at, new Date(clock.getTime() + 300000).toISOString())
  assert.ok(!JSON.stringify(db.rows('oauth_codes')).includes(code1))
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true, write: true })
  assert.strictEqual(d.body.error, 'request_expired')
  ok('Allow: a 32-byte code stored hashed, 5 minutes from issue, scope mcp:read offline_access when write was requested but not ticked (R2); a second decision is refused')
  r = await authorize(checkParams({ challenge: p0.challenge, scope: 'mcp:read' }))
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true, write: true })
  assert.strictEqual(db.rows('oauth_codes').find((x) => x.code_hash === o.sha256Hex(new URL(d.body.redirect).searchParams.get('code'))).scope_granted, 'mcp:read')
  ok('ticking write without the client requesting mcp:write grants no write')

  section('7. token endpoint: transport and client authentication')
  let t = await token({ grant_type: 'authorization_code' }, { ctype: 'application/json', raw: JSON.stringify({ grant_type: 'authorization_code' }) })
  assert.strictEqual(t.status, 415); assert.strictEqual(t.body.error, 'invalid_request')
  t = await token({}, { method: 'GET' })
  assert.strictEqual(t.status, 405)
  t = await token({ grant_type: 'authorization_code', code: 'x' }, { ctype: 'application/x-www-form-urlencoded; charset=UTF-8', basic: [CONF_ID, CONF_SECRET] })
  assert.strictEqual(t.status, 400); assert.strictEqual(t.body.error, 'invalid_request')
  t = await token(null, { raw: 'grant_type=refresh_token&grant_type=authorization_code', basic: [CONF_ID, CONF_SECRET] })
  assert.strictEqual(t.body.error, 'invalid_request')
  t = await token({ grant_type: 'client_credentials' }, CONF_AUTH)
  assert.strictEqual(t.body.error, 'unsupported_grant_type')
  t = await token({}, CONF_AUTH)
  assert.strictEqual(t.body.error, 'invalid_request')
  ok('JSON body 415; GET 405; form with a charset accepted; a repeated parameter and a missing parameter: invalid_request; client_credentials: unsupported_grant_type')
  t = await token({ grant_type: 'authorization_code', client_id: CONF_ID })
  assert.strictEqual(t.status, 401); assert.strictEqual(t.body.error, 'invalid_client'); assert.strictEqual(t.headers['WWW-Authenticate'], undefined)
  t = await token({ grant_type: 'authorization_code' }, { basic: [CONF_ID, CONF_SECRET + 'x'] })
  assert.strictEqual(t.status, 401); assert.strictEqual(t.body.error, 'invalid_client'); assert.strictEqual(t.headers['WWW-Authenticate'], 'Basic realm="brandgeo-oauth"')
  t = await token({ grant_type: 'authorization_code', client_id: 'https://claude.ai/oauth/unknown-doc' })
  assert.strictEqual(t.status, 401)
  for (const x of [t]) assert.strictEqual(x.headers['Cache-Control'], 'no-store')
  ok('a confidential client without a secret, a wrong Basic secret (with WWW-Authenticate Basic) and an uncached CIMD id: 401 invalid_client; every answer no-store')

  section('8. token endpoint: authorization_code')
  const c1 = await consent({ write: true })
  t = await exchange(c1)
  assert.strictEqual(t.status, 200, JSON.stringify(t.body))
  assert.strictEqual(t.headers['Cache-Control'], 'no-store')
  assert.deepStrictEqual(Object.keys(t.body).sort(), ['access_token', 'expires_in', 'refresh_token', 'scope', 'token_type'])
  assert.match(t.body.access_token, o.ACCESS_TOKEN_RE); assert.match(t.body.refresh_token, o.REFRESH_TOKEN_RE)
  assert.deepStrictEqual([t.body.token_type, t.body.expires_in, t.body.scope], ['Bearer', 3600, 'mcp:read mcp:write offline_access'])
  const g1 = db.rows('oauth_grants').filter((g) => g.user_id === U.viewer && g.revoked_at === null)
  assert.strictEqual(g1.length, 1)
  assert.deepStrictEqual([g1[0].client_id, g1[0].oauth_client_id, g1[0].client_name, g1[0].redirect_host, g1[0].scope, g1[0].expires_at], [11, CONF_ID, 'Claude', 'claude.ai', 'mcp:read mcp:write offline_access', new Date(clock.getTime() + 90 * 86400000).toISOString()])
  const toks = db.rows('oauth_tokens').filter((x) => x.grant_id === g1[0].id)
  assert.deepStrictEqual(toks.map((x) => [x.kind, x.scope]).sort(), [['access', 'mcp:read mcp:write offline_access'], ['refresh', 'mcp:read mcp:write offline_access']])
  assert.deepStrictEqual(toks.map((x) => x.token_hash).sort(), [o.sha256Hex(t.body.access_token), o.sha256Hex(t.body.refresh_token)].sort())
  assert.ok(!JSON.stringify(db.tables).includes(t.body.access_token) && !JSON.stringify(db.tables).includes(t.body.refresh_token), 'tokens are stored hashed only')
  assert.strictEqual(db.rows('oauth_codes').find((x) => x.code_hash === o.sha256Hex(c1.code)).grant_id, g1[0].id)
  const AT1 = t.body.access_token
  const RT1 = t.body.refresh_token
  ok('a valid exchange: Bearer access token (1 h) and refresh token, scope as granted, no-store; one grant (client name, redirect host, 90-day idle expiry); tokens and code stored as sha256 only')
  // Replay revokes the grant.
  t = await exchange(c1)
  assert.strictEqual(t.status, 400); assert.strictEqual(t.body.error, 'invalid_grant')
  assert.ok(db.rows('oauth_grants').find((g) => g.id === g1[0].id).revoked_at, 'the replay revoked the grant')
  assert.ok(db.rows('oauth_tokens').filter((x) => x.grant_id === g1[0].id).every((x) => x.revoked_at), 'and every token under it')
  let m = await mcpCall('tools/list', {}, AT1)
  assert.strictEqual(m.status, 401); assert.strictEqual(m.headers['WWW-Authenticate'], o.wwwAuthenticate(true))
  ok('a replayed code: invalid_grant, and the grant it produced plus its tokens are revoked; the access token then gets 401 invalid_token on /mcp')
  // Checks that burn the code.
  const bad = [
    [{ verifier: pkce().verifier }, 'invalid_grant', 'wrong verifier'],
    [{ redirect: `${o.ANTHROPIC_REDIRECT_URI}/` }, 'invalid_grant', 'redirect_uri not byte-equal'],
    [{ extra: { resource: 'https://evil.example/mcp' } }, 'invalid_target', 'foreign resource'],
  ]
  for (const [mod, err, label] of bad) {
    const c = await consent()
    t = await exchange({ ...c, ...(mod.verifier ? { verifier: mod.verifier } : {}) }, { redirect: mod.redirect || o.ANTHROPIC_REDIRECT_URI, extra: mod.extra || {} })
    assert.strictEqual(t.body.error, err, label)
    t = await exchange(c)
    assert.strictEqual(t.body.error, 'invalid_grant', `${label}: the code is spent after a failed attempt`)
  }
  ok('a wrong verifier, a redirect_uri that differs by one byte and a foreign resource are refused, and each spends the code (no retry)')
  // Foreign client: the CIMD client presents the confidential client's code.
  await authorize(checkParams({ client: CC_URL, redirect: 'http://localhost:5000/callback', challenge: p0.challenge }))
  let c = await consent()
  t = await exchange(c, { auth: { basic: null }, extra: { client_id: CC_URL } })
  assert.strictEqual(t.body.error, 'invalid_grant')
  c = await consent()
  clock = new Date(clock.getTime() + 301000)
  t = await exchange(c)
  assert.strictEqual(t.body.error, 'invalid_grant')
  t = await exchange({ code: 'not-a-code', verifier: c.verifier })
  assert.strictEqual(t.body.error, 'invalid_grant')
  ok("a code presented by another client, an expired code (5 min) and a malformed code: invalid_grant")
  // A user moved to another client between consent and exchange.
  c = await consent()
  db.rows('user_profiles').find((x) => x.id === U.viewer).client_id = 14
  t = await exchange(c)
  assert.strictEqual(t.body.error, 'invalid_grant')
  db.rows('user_profiles').find((x) => x.id === U.viewer).client_id = 11
  ok('a user no longer a viewer of the consented client: invalid_grant')

  section('9. one live grant per user, OAuth client and BrandGEO client')
  c = await consent({ write: true })
  t = await exchange(c)
  const AT2 = t.body.access_token
  const RT2 = t.body.refresh_token
  let live = db.rows('oauth_grants').filter((g) => g.user_id === U.viewer && g.oauth_client_id === CONF_ID && g.revoked_at === null)
  assert.strictEqual(live.length, 1); const G2 = live[0].id
  assert.strictEqual(live[0].scope, 'mcp:read mcp:write offline_access')
  c = await consent({ write: false })
  t = await exchange(c)
  live = db.rows('oauth_grants').filter((g) => g.user_id === U.viewer && g.oauth_client_id === CONF_ID && g.revoked_at === null)
  assert.strictEqual(live.length, 1); assert.strictEqual(live[0].id, G2)
  assert.strictEqual(live[0].scope, 'mcp:read offline_access')
  const AT3 = t.body.access_token
  const RT3 = t.body.refresh_token
  ok('a second consent reuses the live grant and replaces its scope (here: write dropped)')
  m = await mcpCall('tools/list', {}, AT2)
  assert.strictEqual(m.status, 200); assert.ok(!m.body.result.tools.some((x) => x.name === 'mark_fix_done'), 'the older write token is narrowed by the grant at once')
  ok('a token minted with mcp:write before the narrowing consent no longer lists mark_fix_done: the grant scope bounds every token')
  // Another user of the same client gets a separate grant.
  c = await consent({ jwt: 'viewer2-jwt' })
  t = await exchange(c)
  assert.strictEqual(t.status, 200)
  assert.strictEqual(db.rows('oauth_grants').filter((g) => g.client_id === 11 && g.revoked_at === null).length, 2)
  ok('another viewer of the same client gets their own grant')

  section('10. refresh: rotation, reuse detection, narrowing')
  t = await token({ grant_type: 'refresh_token', refresh_token: RT3 }, CONF_AUTH)
  assert.strictEqual(t.status, 200, JSON.stringify(t.body))
  assert.notStrictEqual(t.body.refresh_token, RT3); assert.match(t.body.refresh_token, o.REFRESH_TOKEN_RE)
  assert.strictEqual(t.body.scope, 'mcp:read offline_access')
  const RT4 = t.body.refresh_token
  const rt3row = db.rows('oauth_tokens').find((x) => x.token_hash === o.sha256Hex(RT3))
  assert.ok(rt3row.used_at)
  assert.strictEqual(db.rows('oauth_tokens').find((x) => x.token_hash === o.sha256Hex(RT4)).rotated_from, rt3row.id)
  ok('a refresh rotates: a new pair in the same response, the old refresh token marked used, rotated_from set')
  // Asking back for a scope the grant never held (write left unticked) drops
  // it instead of failing (review L1).
  t = await token({ grant_type: 'refresh_token', refresh_token: RT4, scope: 'mcp:read mcp:write offline_access' }, CONF_AUTH)
  assert.strictEqual(t.status, 200, JSON.stringify(t.body)); assert.strictEqual(t.body.scope, 'mcp:read offline_access')
  const RT5 = t.body.refresh_token
  ok('a refresh asking for a scope never granted keeps refreshing with the granted scope (write dropped, never widened)')
  // Grace (review M1): RT4 presented again 10 s later is refused, the grant lives, RT5 still works.
  clock = new Date(clock.getTime() + 10000)
  t = await token({ grant_type: 'refresh_token', refresh_token: RT4 }, CONF_AUTH)
  assert.strictEqual(t.status, 400); assert.strictEqual(t.body.error, 'invalid_grant')
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === G2).revoked_at, null, 'a duplicate inside the grace window does not revoke')
  assert.ok(captured.some((l) => l.includes('[oauth-token] refresh_reuse_grace for client 11; refused, grant kept')), 'the grace refusal is logged on its own line')
  ok('a refresh token presented again within 30 s: invalid_grant, no new tokens, grant not revoked, a refresh_reuse_grace log line')
  t = await token({ grant_type: 'refresh_token', refresh_token: RT5, scope: 'mcp:read' }, CONF_AUTH)
  assert.strictEqual(t.status, 200); assert.strictEqual(t.body.scope, 'mcp:read'); assert.ok(!('refresh_token' in t.body), 'narrowed past offline_access: no refresh token')
  ok('a refresh may narrow (dropping offline_access ends the refresh chain)')
  // Reuse outside the grace window: present RT3 again 31 s after it was rotated.
  clock = new Date(clock.getTime() + 31000)
  t = await token({ grant_type: 'refresh_token', refresh_token: RT3 }, CONF_AUTH)
  assert.strictEqual(t.status, 400); assert.strictEqual(t.body.error, 'invalid_grant')
  assert.ok(db.rows('oauth_grants').find((g) => g.id === G2).revoked_at, 'reuse revoked the grant')
  m = await mcpCall('tools/list', {}, AT3)
  assert.strictEqual(m.status, 401); assert.strictEqual(m.headers['WWW-Authenticate'], o.wwwAuthenticate(true))
  ok('a rotated refresh token presented again: invalid_grant and the whole grant is revoked; its access tokens get 401 invalid_token')
  // Expiry, foreign client.
  c = await consent()
  t = await exchange(c)
  const RT6 = t.body.refresh_token
  t = await token({ grant_type: 'refresh_token', refresh_token: RT6, client_id: CC_URL })
  assert.strictEqual(t.body.error, 'invalid_grant')
  assert.strictEqual(db.rows('oauth_tokens').find((x) => x.token_hash === o.sha256Hex(RT6)).used_at, null, 'a foreign client does not spend the token')
  clock = new Date(clock.getTime() + 31 * 86400000)
  t = await token({ grant_type: 'refresh_token', refresh_token: RT6 }, CONF_AUTH)
  assert.strictEqual(t.body.error, 'invalid_grant')
  t = await token({ grant_type: 'refresh_token', refresh_token: 'bgmrt_' + 'a'.repeat(64) }, CONF_AUTH)
  assert.strictEqual(t.body.error, 'invalid_grant')
  t = await token({ grant_type: 'refresh_token', refresh_token: AT2 }, CONF_AUTH)
  assert.strictEqual(t.body.error, 'invalid_grant')
  ok('a refresh token presented by another client (not spent), one past 30 days, an unknown one and an access token: invalid_grant')

  section('11. CIMD client end to end (Claude Code, loopback, public client)')
  const p = pkce()
  r = await authorize(checkParams({ client: CC_URL, redirect: 'http://localhost:61234/callback', challenge: p.challenge, scope: 'mcp:read mcp:write offline_access' }))
  assert.strictEqual(r.body.loopback, true)
  d = await authorize({ action: 'decide', request_id: r.body.request_id, allow: true, write: true })
  const ccCode = new URL(d.body.redirect).searchParams.get('code')
  assert.ok(d.body.redirect.startsWith('http://localhost:61234/callback?code='))
  t = await token({ grant_type: 'authorization_code', code: ccCode, redirect_uri: 'http://localhost:61234/callback', code_verifier: p.verifier, client_id: CC_URL })
  assert.strictEqual(t.status, 200, JSON.stringify(t.body))
  assert.strictEqual(t.body.scope, 'mcp:read mcp:write offline_access')
  const ccGrant = db.rows('oauth_grants').find((g) => g.oauth_client_id === CC_URL && g.revoked_at === null)
  assert.deepStrictEqual([ccGrant.client_name, ccGrant.redirect_host], ['Claude Code', 'localhost'])
  const CC_AT = t.body.access_token
  const CC_RT = t.body.refresh_token
  t = await token({ grant_type: 'refresh_token', refresh_token: CC_RT, client_id: CC_URL, client_secret: 'x' })
  assert.strictEqual(t.status, 401)
  t = await token({ grant_type: 'refresh_token', refresh_token: CC_RT, client_id: CC_URL })
  assert.strictEqual(t.status, 200)
  const CC_AT2 = t.body.access_token
  ok('the loopback port differs and still matches; the public client exchanges and refreshes by client_id alone (a secret is refused); grant named from the CIMD document')

  section('12. the issued token on /mcp')
  m = await mcpCall('initialize', { protocolVersion: '2025-06-18' }, CC_AT2)
  assert.strictEqual(m.status, 200); assert.ok(m.body.result.instructions.includes('This connection can also mark a fix done'))
  m = await mcpCall('tools/list', {}, CC_AT2)
  assert.ok(m.body.result.tools.some((x) => x.name === 'mark_fix_done'))
  m = await mcpCall('tools/call', { name: 'get_brand_overview', arguments: {} }, CC_AT2)
  assert.strictEqual(m.body.result.structuredContent.client_id, 11)
  assert.ok(db.rows('affiliate_rate_limits').some((x) => x.key === `mcp:grant:${ccGrant.id}`), 'per-grant minute counter')
  assert.ok(db.rows('affiliate_rate_limits').some((x) => x.key === 'mcp:client:11:day'), 'shared daily counter')
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === ccGrant.id).last_used_at, clock.toISOString())
  ok('a read and write connection: OAuth instructions, mark_fix_done listed, tools answer for the grant client; counters mcp:grant:<id> and mcp:client:11:day; grant last_used_at stamped')
  m = await mcpCall('tools/list', {}, CC_AT)
  assert.strictEqual(m.status, 200, 'the first access token is still live after a refresh (no revocation of siblings)')
  // Review L3: a viewer promoted to admin loses the connection on the next call.
  const ccProfile = db.rows('user_profiles').find((x) => x.id === db.rows('oauth_grants').find((g) => g.id === ccGrant.id).user_id)
  ccProfile.role = 'admin'
  m = await mcpCall('tools/list', {}, CC_AT2)
  assert.strictEqual(m.status, 401, 'an admin profile is refused on /mcp')
  assert.strictEqual(m.headers['WWW-Authenticate'], o.wwwAuthenticate(true))
  ccProfile.role = 'viewer'
  m = await mcpCall('tools/list', {}, CC_AT2)
  assert.strictEqual(m.status, 200, 'back to viewer, the token works again')
  ok('R6 on every /mcp call: a profile promoted to admin gets 401 invalid_token at once')
  clock = new Date(clock.getTime() + 3601000)
  m = await mcpCall('tools/list', {}, CC_AT2)
  assert.strictEqual(m.status, 401); assert.strictEqual(m.headers['WWW-Authenticate'], o.wwwAuthenticate(true))
  assert.deepStrictEqual(m.body.error, { code: -32001, message: 'Invalid or missing BrandGEO credentials.' })
  ok('after one hour the access token answers 401 with error="invalid_token" and the shared message')

  section('13. revoke (RFC 7009)')
  const fresh = await consent()
  t = await exchange(fresh)
  const RV_AT = t.body.access_token
  const RV_RT = t.body.refresh_token
  const rvGrant = db.rows('oauth_tokens').find((x) => x.token_hash === o.sha256Hex(RV_AT)).grant_id
  let rv = await token({ token: 'bgmat_' + 'c'.repeat(48) }, { ...CONF_AUTH, path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 200); assert.strictEqual(rv.headers['Cache-Control'], 'no-store')
  rv = await token({ token: 'garbage' }, { ...CONF_AUTH, path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 200)
  rv = await token({ token: RV_AT, token_type_hint: 'access_token' }, { ...CONF_AUTH, path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 200)
  m = await mcpCall('tools/list', {}, RV_AT)
  assert.strictEqual(m.status, 401)
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === rvGrant).revoked_at, null, 'an access token revoke leaves the grant')
  ok('unknown and malformed tokens: 200; a known access token: 200 and it is dead on /mcp; the grant stays')
  rv = await token({ token: RV_RT, client_id: CC_URL }, { path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 200)
  assert.strictEqual(db.rows('oauth_grants').find((g) => g.id === rvGrant).revoked_at, null, "another client's token is left alone, still 200")
  rv = await token({ token: RV_RT }, { ...CONF_AUTH, path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 200)
  assert.ok(db.rows('oauth_grants').find((g) => g.id === rvGrant).revoked_at, 'a refresh token revoke revokes the grant')
  t = await token({ grant_type: 'refresh_token', refresh_token: RV_RT }, CONF_AUTH)
  assert.strictEqual(t.body.error, 'invalid_grant')
  rv = await token({ token: RV_RT }, { basic: [CONF_ID, 'wrong'], path: '/oauth/revoke' })
  assert.strictEqual(rv.status, 401)
  rv = await token({ token: RV_RT }, { ...CONF_AUTH, path: '/oauth/revoke', ctype: 'application/json', raw: '{}' })
  assert.strictEqual(rv.status, 415)
  ok("another client's refresh token: 200 and untouched; the owner's refresh token: 200 and the grant is revoked (refresh then invalid_grant); bad client auth 401; JSON 415")

  section('14. logs')
  const hashes = SECRETS.map(o.sha256Hex)
  for (const l of captured.filter((x) => !x.startsWith('  ok - '))) {
    for (const s of SECRETS) assert.ok(!l.includes(s), `a log line contains a secret: ${l.slice(0, 80)}`)
    for (const h of hashes) assert.ok(!l.includes(h), 'a log line contains a hash')
    assert.ok(!/bgmat_|bgmrt_|bgocs_/i.test(l), `a log line contains a token prefix: ${l.slice(0, 80)}`)
  }
  assert.ok(captured.some((l) => / cred=oauth method=tools\/list /.test(l)), 'mcp lines carry cred=oauth')
  ok(`${captured.length} captured lines: no token, code, verifier, request id, client secret, hash or token prefix; mcp lines carry cred=oauth`)

  console.log(`\n${passed} passed`)
}

main().catch((err) => { console.error('FAILED:', err && err.message); console.error(err && err.stack && err.stack.split('\n').slice(1, 4).join('\n')); process.exit(1) })
