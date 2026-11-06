/**
 * oauth_core.test.js: netlify/functions/_oauth.js, the shared core of the MCP
 * stage 3 authorization server (docs/arch/mcp-stage3-oauth.md sections 4 and
 * 8, unit tests). No network: every CIMD fetch is an injected function.
 *
 * Covers: PKCE S256 with the RFC 7636 appendix B vector, token and code
 * formats, the constant-time compares, scope parsing, granting and narrowing,
 * the loopback redirect match table, CIMD URL validation (allowlist R4),
 * the CIMD fetch (mismatch, oversize, redirect not followed, timeout, bad
 * JSON, auth method), client resolution with the 24 h cache, client
 * authentication at the token endpoint, Basic parsing, and the metadata
 * documents and 401 header of section 3.
 *
 * Run: `node tests/oauth_core.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const o = require(path.join(__dirname, '..', 'netlify', 'functions', '_oauth.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

const CC_URL = 'https://claude.ai/oauth/claude-code-client-metadata'
const CC_DOC = { client_id: CC_URL, client_name: 'Claude Code', redirect_uris: ['http://localhost/callback', 'http://127.0.0.1/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }
const jsonFetch = (doc, { status = 200, calls = [] } = {}) => async (url, init) => { calls.push({ url, init }); return new Response(typeof doc === 'string' ? doc : JSON.stringify(doc), { status, headers: { 'content-type': 'application/json' } }) }

async function rejects(p, code) {
  try { await p } catch (e) { assert.ok(e instanceof o.OAuthError, `expected OAuthError, got ${e && e.message}`); assert.strictEqual(e.code, code, e.message); return e }
  assert.fail(`expected OAuthError ${code}`)
}

async function main() {
  section('1. PKCE (RFC 7636)')
  const V = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const C = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  assert.strictEqual(o.pkceChallengeS256(V), C)
  assert.strictEqual(o.verifyPkce(V, C), true)
  ok('appendix B: S256 of the verifier equals the published challenge, and verifyPkce accepts it')
  assert.strictEqual(o.verifyPkce(V.slice(0, -1) + 'l', C), false)
  assert.strictEqual(o.verifyPkce(V, C.slice(0, -1) + 'N'), false)
  assert.strictEqual(o.verifyPkce('short', o.pkceChallengeS256('short')), false, 'verifier under 43 characters')
  assert.strictEqual(o.verifyPkce('a'.repeat(129), o.pkceChallengeS256('a'.repeat(129))), false, 'verifier over 128')
  assert.strictEqual(o.verifyPkce(V + '!', o.pkceChallengeS256(V + '!')), false, 'character outside the unreserved set')
  assert.strictEqual(o.verifyPkce(V, V), false, 'plain method is never accepted: challenge equal to the verifier')
  assert.strictEqual(o.verifyPkce(undefined, C), false)
  assert.strictEqual(o.isValidChallenge(C), true)
  assert.strictEqual(o.isValidChallenge('a'.repeat(42)), false)
  assert.strictEqual(o.isValidChallenge('a'.repeat(128)), true)
  assert.strictEqual(o.isValidChallenge('a'.repeat(129)), false)
  ok('a wrong verifier, a wrong challenge, a short, long or out-of-alphabet verifier and the plain method all fail; challenge length 43 to 128')

  section('2. formats and compares')
  const at = o.makeAccessToken(); const rt = o.makeRefreshToken(); const code = o.makeCode(); const rid = o.makeRequestId()
  assert.match(at, o.ACCESS_TOKEN_RE); assert.match(rt, o.REFRESH_TOKEN_RE)
  assert.strictEqual(at.length, 6 + 48); assert.strictEqual(rt.length, 6 + 64)
  assert.match(code, o.CODE_RE); assert.strictEqual(Buffer.from(code, 'base64url').length, 32)
  assert.match(rid, o.REQUEST_ID_RE)
  assert.ok(!o.ACCESS_TOKEN_RE.test(rt) && !o.REFRESH_TOKEN_RE.test(at), 'the two token shapes never match each other')
  assert.ok(!o.ACCESS_TOKEN_RE.test(at.toUpperCase()))
  assert.notStrictEqual(o.makeAccessToken(), at)
  assert.match(o.makeConfidentialClientId(), o.CONFIDENTIAL_CLIENT_ID_RE); assert.match(o.makeClientSecret(), o.CLIENT_SECRET_RE)
  assert.strictEqual(o.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  ok('bgmat_ 48 hex, bgmrt_ 64 hex, codes and request ids 32 random bytes base64url, bgoc_ and bgocs_; sha256 hex (FIPS 180 "abc" vector)')
  assert.strictEqual(o.safeEqual('a', 'a'), true); assert.strictEqual(o.safeEqual('a', 'b'), false); assert.strictEqual(o.safeEqual('a', 'aa'), false); assert.strictEqual(o.safeEqual('a', undefined), false)
  const sec = o.makeClientSecret()
  assert.strictEqual(o.secretMatchesHash(sec, o.sha256Hex(sec)), true)
  assert.strictEqual(o.secretMatchesHash(sec + 'x', o.sha256Hex(sec)), false)
  assert.strictEqual(o.secretMatchesHash(sec, 'nothex'), false)
  ok('safeEqual and secretMatchesHash: equal only for equal input; a malformed stored hash never matches')

  section('3. scopes')
  const s = (x) => o.scopeString(o.parseRequestedScope(x))
  assert.strictEqual(s(undefined), 'mcp:read'); assert.strictEqual(s(''), 'mcp:read')
  assert.strictEqual(s('mcp:read mcp:write'), 'mcp:read mcp:write')
  assert.strictEqual(s('mcp:write'), 'mcp:write')
  assert.strictEqual(s('offline_access mcp:write mcp:read admin openid'), 'mcp:read mcp:write offline_access')
  assert.strictEqual(s('offline_access'), 'mcp:read offline_access')
  assert.strictEqual(s('openid email'), 'mcp:read')
  ok('requested scope: unknown words dropped, empty or no mcp scope means mcp:read, canonical order')
  const g = (req, tick) => o.grantedScope(o.parseRequestedScope(req), tick)
  assert.strictEqual(g('mcp:read mcp:write offline_access', true), 'mcp:read mcp:write offline_access')
  assert.strictEqual(g('mcp:read mcp:write offline_access', false), 'mcp:read offline_access')
  assert.strictEqual(g('mcp:read mcp:write', 'yes'), 'mcp:read', 'only boolean true ticks the box')
  assert.strictEqual(g('mcp:read', true), 'mcp:read', 'write is never granted unless requested (R2)')
  assert.strictEqual(g('mcp:write', true), 'mcp:read mcp:write')
  ok('granted scope: mcp:read always; mcp:write only when requested AND ticked; offline_access when requested')
  assert.deepStrictEqual(o.narrowScope('mcp:read mcp:write offline_access', undefined), { scope: 'mcp:read mcp:write offline_access' })
  assert.deepStrictEqual(o.narrowScope('mcp:read mcp:write offline_access', 'mcp:read offline_access'), { scope: 'mcp:read offline_access' })
  assert.deepStrictEqual(o.narrowScope('mcp:read mcp:write offline_access', 'offline_access'), { scope: 'mcp:read offline_access' })
  assert.deepStrictEqual(o.narrowScope('mcp:read offline_access', 'mcp:read mcp:write offline_access'), { scope: 'mcp:read offline_access' })
  assert.deepStrictEqual(o.narrowScope('mcp:read', 'admin'), { scope: 'mcp:read' })
  assert.deepStrictEqual(o.narrowScope('mcp:read', 42), { error: 'invalid_scope' })
  assert.strictEqual(o.intersectScope('mcp:read mcp:write offline_access', 'mcp:read offline_access'), 'mcp:read offline_access')
  // Review L2: only https on the client's own host, or the loopback form, are ever a redirect.
  assert.strictEqual(o.isSafeRedirectForm('https://claude.ai/api/mcp/auth_callback', 'claude.ai'), true)
  assert.strictEqual(o.isSafeRedirectForm('http://localhost/callback'), true)
  assert.strictEqual(o.isSafeRedirectForm('http://127.0.0.1:3118/callback'), true)
  for (const bad of ['javascript:alert(1)//', 'javascript://claude.ai/%0aalert(1)', 'data:text/html,x', 'http://claude.ai/cb', 'https://evil.example/cb', 'https://u:p@claude.ai/cb', 'http://localhost/other']) {
    assert.strictEqual(o.isSafeRedirectForm(bad, 'claude.ai'), false, bad)
  }
  assert.strictEqual(o.redirectAllowed('javascript:alert(1)//', ['javascript:alert(1)//']), false)
  ok('narrowing: absent keeps the scope, a subset narrows (mcp:read kept), words never granted are dropped (never widened); redirects only https on the client host or loopback, never javascript: or data:')

  section('4. redirect match (section 4.1)')
  const CC = CC_DOC.redirect_uris
  const table = [
    ['http://localhost/callback', CC, true],
    ['http://localhost:3118/callback', CC, true],
    ['http://127.0.0.1:65535/callback', CC, true],
    ['http://127.0.0.1:1/callback', CC, true],
    ['http://127.0.0.1:0/callback', CC, false],
    ['http://127.0.0.1:65536/callback', CC, false],
    ['http://localhost:3118/callback/', CC, false],
    ['http://localhost:3118/callback?x=1', CC, false],
    ['http://localhost:3118/callback#f', CC, false],
    ['http://localhost:3118/other', CC, false],
    ['https://localhost:3118/callback', CC, false],
    ['http://LOCALHOST:3118/callback', CC, false],
    ['http://localhost.evil.example:3118/callback', CC, false],
    ['http://user@localhost:3118/callback', CC, false],
    ['http://[::1]:3118/callback', CC, false],
    ['http://127.0.0.2:3118/callback', CC, false],
    ['http://127.0.0.1:3118/callback', ['http://localhost/callback'], false],
    ['http://localhost:3118/callback', ['http://localhost:5000/callback'], true],
    ['https://claude.ai/api/mcp/auth_callback', [o.ANTHROPIC_REDIRECT_URI], true],
    ['https://claude.ai/api/mcp/auth_callback/', [o.ANTHROPIC_REDIRECT_URI], false],
    ['https://claude.ai/api/mcp/auth_callback?x', [o.ANTHROPIC_REDIRECT_URI], false],
    ['https://CLAUDE.ai/api/mcp/auth_callback', [o.ANTHROPIC_REDIRECT_URI], false],
    ['https://claude.ai:443/api/mcp/auth_callback', [o.ANTHROPIC_REDIRECT_URI], false],
    ['http://localhost:3118/callback', [o.ANTHROPIC_REDIRECT_URI], false],
    ['', CC, false],
    [undefined, CC, false],
  ]
  for (const [req, reg, want] of table) assert.strictEqual(o.redirectAllowed(req, reg), want, `${req} vs ${JSON.stringify(reg)}`)
  ok(`${table.length} rows: loopback port-agnostic on the same host and path only; everything else byte for byte`)
  assert.strictEqual(o.redirectHost('http://localhost:3118/callback'), 'localhost')
  assert.strictEqual(o.redirectHost(o.ANTHROPIC_REDIRECT_URI), 'claude.ai')
  assert.strictEqual(o.isLoopbackRedirect('http://127.0.0.1:9/callback'), true)
  assert.strictEqual(o.isLoopbackRedirect(o.ANTHROPIC_REDIRECT_URI), false)
  assert.strictEqual(o.buildRedirect('http://localhost:3118/callback', { code: 'abc', state: 'x y&z' }), 'http://localhost:3118/callback?code=abc&state=x+y%26z')
  assert.strictEqual(o.buildRedirect(o.ANTHROPIC_REDIRECT_URI, { error: 'access_denied', state: undefined }), `${o.ANTHROPIC_REDIRECT_URI}?error=access_denied`)
  ok('redirect host and loopback flag for consent; response parameters are URL-encoded, an absent state is left out')

  section('5. CIMD URL validation (ruling R4)')
  assert.strictEqual(o.validateCimdUrl(CC_URL).hostname, 'claude.ai')
  for (const bad of [
    'http://claude.ai/oauth/x', 'https://claude.ai', 'https://claude.ai/', 'https://evil.example/oauth/x',
    'https://claude.ai.evil.example/x', 'https://sub.claude.ai/x', 'https://user@claude.ai/x', 'https://claude.ai:8443/x',
    'https://claude.ai:443/x', 'https://claude.ai/x#frag', 'https://claude.ai/x?y=1', 'https://CLAUDE.AI/x',
    `https://claude.ai/${'a'.repeat(500)}`, '', 'claude.ai/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest',
  ]) {
    assert.throws(() => o.validateCimdUrl(bad), (e) => e instanceof o.OAuthError && e.code === 'invalid_client', bad)
  }
  ok('only https://claude.ai/<path>, canonical form, no userinfo, query or fragment, port 443 implied, at most 512 characters')

  section('6. CIMD fetch')
  const calls = []
  let doc = await o.fetchCimd(CC_URL, { fetchImpl: jsonFetch(CC_DOC, { calls }) })
  assert.strictEqual(doc.name, 'Claude Code')
  assert.deepStrictEqual(doc.redirect_uris, CC_DOC.redirect_uris)
  assert.strictEqual(calls[0].init.redirect, 'manual', 'redirects are never followed')
  assert.ok(calls[0].init.signal, 'the fetch carries an abort signal')
  ok('a valid document resolves; the fetch uses redirect manual and an abort signal')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, client_id: 'https://claude.ai/oauth/other' }) }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, redirect_uris: [] }) }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, redirect_uris: Array(11).fill('http://localhost/callback') }) }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, token_endpoint_auth_method: 'private_key_jwt' }) }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, grant_types: ['client_credentials'] }) }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch('not json') }), 'invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch([CC_DOC]) }), 'invalid_client')
  ok('client_id mismatch, no or too many redirect_uris, a non-none auth method, no authorization_code grant, non-JSON and a non-object: invalid_client')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, pad: 'x'.repeat(9000) }) }), 'invalid_client')
  const big = { status: 200, headers: { get: (h) => (h === 'content-length' ? '9000' : null) }, text: async () => { throw new Error('body must not be read') } }
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: async () => big }), 'invalid_client')
  const plain = { status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ ...CC_DOC, pad: 'x'.repeat(9000) }) }
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: async () => plain }), 'invalid_client')
  ok('8 KB cap: a streamed body over it, a Content-Length over it (body never read) and a text() body over it are refused')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: async () => new Response('', { status: 302, headers: { location: 'http://169.254.169.254/' } }) }), 'client_metadata_unavailable')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: jsonFetch(CC_DOC, { status: 404 }) }), 'client_metadata_unavailable')
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: async () => { throw new Error('ECONNREFUSED') } }), 'client_metadata_unavailable')
  let aborted = false
  const hang = (url, init) => new Promise((resolve, reject) => { init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) }) })
  const t0 = Date.now()
  await rejects(o.fetchCimd(CC_URL, { fetchImpl: hang, timeoutMs: 60 }), 'client_metadata_unavailable')
  assert.ok(Date.now() - t0 < 1000 && aborted, 'the timeout aborts the fetch')
  assert.strictEqual(o.CIMD_TIMEOUT_MS, 3000); assert.strictEqual(o.CIMD_MAX_BYTES, 8192)
  ok('a 3xx (not followed), a 404, a network error and a timeout (fetch aborted) are client_metadata_unavailable; defaults 3 s and 8 KB')
  doc = await o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, client_name: 'A\u0007<b>' + 'n'.repeat(80) }) })
  assert.ok(doc.name.length <= 60 && !doc.name.includes('\u0007') && doc.name.startsWith('A<b>'))
  doc = await o.fetchCimd(CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, client_name: undefined }) })
  assert.strictEqual(doc.name, 'claude.ai')
  ok('client_name: control characters removed, clipped to 60, kept as text (no HTML handling here); missing reads the host')

  section('7. client resolution (authorize) and the 24 h cache')
  let clock = new Date('2026-11-06T10:00:00Z')
  const db = createFakeSupabase({ now: () => clock })
  const fcalls = []
  let c = await o.resolveClient(db, CC_URL, { fetchImpl: jsonFetch(CC_DOC, { calls: fcalls }), now: clock })
  assert.deepStrictEqual(c, { id: CC_URL, kind: 'cimd', name: 'Claude Code', redirect_uris: CC_DOC.redirect_uris })
  assert.strictEqual(db.rows('oauth_clients').length, 1); assert.strictEqual(db.rows('oauth_clients')[0].fetched_at, clock.toISOString())
  assert.strictEqual(db.rows('oauth_clients')[0].secret_hash, null)
  clock = new Date('2026-11-07T09:59:00Z')
  c = await o.resolveClient(db, CC_URL, { fetchImpl: async () => { throw new Error('must not fetch') }, now: clock })
  assert.strictEqual(fcalls.length, 1)
  ok('first resolve fetches and caches the document (kind cimd, no secret); within 24 h the cache is used without a fetch')
  clock = new Date('2026-11-07T10:00:01Z')
  await rejects(o.resolveClient(db, CC_URL, { fetchImpl: async () => { throw new Error('down') }, now: clock }), 'client_metadata_unavailable')
  c = await o.resolveClient(db, CC_URL, { fetchImpl: jsonFetch({ ...CC_DOC, client_name: 'Claude Code 2' }), now: clock })
  assert.strictEqual(c.name, 'Claude Code 2'); assert.strictEqual(db.rows('oauth_clients').length, 1)
  ok('after 24 h it refetches: a failure is refused (a stale cache is not used), a success refreshes the one row')
  db.rows('oauth_clients')[0].disabled_at = clock.toISOString()
  await rejects(o.resolveClient(db, CC_URL, { fetchImpl: jsonFetch(CC_DOC), now: clock }), 'invalid_client')
  db.rows('oauth_clients')[0].disabled_at = null
  await rejects(o.resolveClient(db, 'https://evil.example/meta', { fetchImpl: async () => { throw new Error('must not fetch a refused host') }, now: clock }), 'invalid_client')
  const confId = o.makeConfidentialClientId(); const confSecret = o.makeClientSecret()
  db.seed('oauth_clients', [{ id: confId, kind: 'confidential', name: 'Claude', redirect_uris: [o.ANTHROPIC_REDIRECT_URI], secret_hash: o.sha256Hex(confSecret) }])
  c = await o.resolveClient(db, confId, { now: clock })
  assert.deepStrictEqual(c, { id: confId, kind: 'confidential', name: 'Claude', redirect_uris: [o.ANTHROPIC_REDIRECT_URI] })
  assert.ok(!('secret_hash' in c), 'the resolved client never carries the hash')
  await rejects(o.resolveClient(db, o.makeConfidentialClientId(), { now: clock }), 'invalid_client')
  await rejects(o.resolveClient(db, 'random-id', { now: clock }), 'invalid_client')
  await rejects(o.resolveClient(db, '', { now: clock }), 'invalid_client')
  ok('a disabled client, a refused host (never fetched), an unknown or malformed id are invalid_client; a confidential client resolves without its hash')

  section('8. client authentication (token endpoint)')
  let a = await o.authenticateClient(db, { basic: { id: confId, secret: confSecret } })
  assert.strictEqual(a.method, 'client_secret_basic'); assert.strictEqual(a.id, confId)
  a = await o.authenticateClient(db, { basic: null, postId: confId, postSecret: confSecret })
  assert.strictEqual(a.method, 'client_secret_post')
  a = await o.authenticateClient(db, { basic: null, postId: CC_URL })
  assert.strictEqual(a.method, 'none'); assert.strictEqual(a.kind, 'cimd')
  ok('confidential by Basic or post secret, CIMD by client_id alone (from the cached row)')
  await rejects(o.authenticateClient(db, { basic: null, postId: confId }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: null, postId: confId, postSecret: confSecret + 'x' }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: { id: confId, secret: '' } }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: null, postId: CC_URL, postSecret: 'anything' }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: null, postId: 'https://claude.ai/oauth/never-cached' }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: null }), 'invalid_client')
  await rejects(o.authenticateClient(db, { basic: { id: confId, secret: confSecret }, postSecret: confSecret }), 'invalid_request')
  await rejects(o.authenticateClient(db, { basic: { id: confId, secret: confSecret }, postId: CC_URL }), 'invalid_request')
  db.rows('oauth_clients').find((r) => r.id === confId).disabled_at = clock.toISOString()
  await rejects(o.authenticateClient(db, { basic: { id: confId, secret: confSecret } }), 'invalid_client')
  db.rows('oauth_clients').find((r) => r.id === confId).disabled_at = null
  ok('no secret, a wrong or empty secret, a public client sending a secret, an uncached CIMD id, no id and a disabled client: invalid_client; two methods at once: invalid_request')
  const enc = (s) => Buffer.from(s).toString('base64')
  assert.deepStrictEqual(o.parseBasicAuth(`Basic ${enc(`${confId}:${confSecret}`)}`), { id: confId, secret: confSecret })
  assert.deepStrictEqual(o.parseBasicAuth(`basic ${enc('a%3Ab:c%20d')}`), { id: 'a:b', secret: 'c d' })
  assert.strictEqual(o.parseBasicAuth('Bearer x'), null); assert.strictEqual(o.parseBasicAuth(undefined), null)
  assert.throws(() => o.parseBasicAuth(`Basic ${enc('nocolon')}`), (e) => e.code === 'invalid_client')
  assert.throws(() => o.parseBasicAuth(`Basic ${enc('%E0%A4%A:x')}`), (e) => e.code === 'invalid_client')
  ok('Basic: form-decoded id and secret (RFC 6749 2.3.1), case-insensitive scheme; malformed Basic is invalid_client; another scheme is ignored')

  section('9. metadata documents and the 401 header (section 3)')
  assert.deepStrictEqual(JSON.parse(JSON.stringify(o.PROTECTED_RESOURCE_METADATA)), {
    resource: 'https://app.getbrandgeo.com/mcp',
    authorization_servers: ['https://app.getbrandgeo.com'],
    scopes_supported: ['mcp:read', 'mcp:write'],
    bearer_methods_supported: ['header'],
    resource_name: 'BrandGEO',
    resource_documentation: 'https://getbrandgeo.com/mcp.html',
  })
  assert.deepStrictEqual(JSON.parse(JSON.stringify(o.AUTHORIZATION_SERVER_METADATA)), {
    issuer: 'https://app.getbrandgeo.com',
    authorization_endpoint: 'https://app.getbrandgeo.com/oauth/authorize',
    token_endpoint: 'https://app.getbrandgeo.com/oauth/token',
    revocation_endpoint: 'https://app.getbrandgeo.com/oauth/revoke',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
    client_id_metadata_document_supported: true,
    scopes_supported: ['mcp:read', 'mcp:write', 'offline_access'],
    service_documentation: 'https://getbrandgeo.com/mcp.html',
  })
  assert.ok(!('registration_endpoint' in o.AUTHORIZATION_SERVER_METADATA), 'DCR off (R3)')
  assert.strictEqual(o.wwwAuthenticate(), 'Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write"')
  assert.strictEqual(o.wwwAuthenticate(true), 'Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write", error="invalid_token"')
  assert.deepStrictEqual([o.ACCESS_TTL_S, o.REFRESH_TTL_S, o.GRANT_IDLE_S, o.CODE_TTL_S, o.PENDING_TTL_S], [3600, 30 * 86400, 90 * 86400, 300, 300])
  ok('PRM and AS metadata are exactly the documents of 3.2 and 3.3 (no registration_endpoint); the 401 header of 3.1; lifetimes of R5')

  console.log(`\n${passed} passed`)
}

main().catch((err) => { console.error('FAILED:', err && err.message); console.error(err && err.stack && err.stack.split('\n').slice(1, 4).join('\n')); process.exit(1) })
