/**
 * _oauth.js -- the shared core of BrandGEO's own OAuth authorization server
 * for remote MCP (docs/arch/mcp-stage3-oauth.md, RULED 2026-11-06, every
 * default of section 9 applies).
 *
 * Used by oauth-metadata.js, oauth-authorize.js, oauth-token.js,
 * client-api-keys.js (create_anthropic_client) and mcp-server.js (the
 * bgmat_ access token branch).
 *
 * What lives here: PKCE S256 (RFC 7636), token and code minting, sha256
 * hashing, a constant-time secret compare, scope parsing and narrowing, the
 * redirect match of section 4.1 (exact, plus port-agnostic loopback), the
 * CIMD fetch with the release-one allowlist (ruling R4: host claude.ai only),
 * client resolution and authentication, and the lifetimes of ruling R5.
 *
 * SECRETS. Tokens, codes, request ids and client secrets are random and are
 * stored only as sha256 hex. Nothing in this module logs anything. Callers
 * never log a token, its prefix or its hash (section 5, Logs).
 */
const crypto = require('crypto')

// ── Fixed URLs (sections 3.1 to 3.3) ─────────────────────────────────────────
const ISSUER = 'https://app.getbrandgeo.com'
const RESOURCE = `${ISSUER}/mcp`
const PRM_URL = `${ISSUER}/.well-known/oauth-protected-resource/mcp`
const AUTHORIZATION_ENDPOINT = `${ISSUER}/oauth/authorize`
const TOKEN_ENDPOINT = `${ISSUER}/oauth/token`
const REVOCATION_ENDPOINT = `${ISSUER}/oauth/revoke`
const DOCS_URL = 'https://getbrandgeo.com/mcp.html'
// The one redirect of the Anthropic-held confidential client (section 4.1).
const ANTHROPIC_REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback'

// ── Scopes ───────────────────────────────────────────────────────────────────
const SCOPE_READ = 'mcp:read'
const SCOPE_WRITE = 'mcp:write'
const SCOPE_OFFLINE = 'offline_access'
// Canonical order; every scope string this server writes uses it.
const KNOWN_SCOPES = [SCOPE_READ, SCOPE_WRITE, SCOPE_OFFLINE]
const MCP_SCOPES = [SCOPE_READ, SCOPE_WRITE]

// ── Lifetimes (ruling R5) ────────────────────────────────────────────────────
const ACCESS_TTL_S = 3600
const REFRESH_TTL_S = 30 * 86400
const GRANT_IDLE_S = 90 * 86400
const CODE_TTL_S = 300
const PENDING_TTL_S = 300
const CIMD_CACHE_S = 86400

// ── CIMD fetch limits (section 4.1) ──────────────────────────────────────────
const CIMD_ALLOWED_HOSTS = new Set(['claude.ai'])
const CIMD_MAX_URL = 512
const CIMD_TIMEOUT_MS = 3000
const CIMD_MAX_BYTES = 8192
const CLIENT_NAME_MAX = 60
const MAX_REDIRECT_URIS = 10
const MAX_REDIRECT_URI_LEN = 512

// ── Formats ──────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_RE = /^bgmat_[a-f0-9]{48}$/
const REFRESH_TOKEN_RE = /^bgmrt_[a-f0-9]{64}$/
// 32 random bytes, base64url without padding: always 43 characters.
const CODE_RE = /^[A-Za-z0-9_-]{43}$/
const REQUEST_ID_RE = /^[A-Za-z0-9_-]{43}$/
const CONFIDENTIAL_CLIENT_ID_RE = /^bgoc_[a-f0-9]{24}$/
const CLIENT_SECRET_RE = /^bgocs_[a-f0-9]{64}$/
// RFC 7636 section 4.1 and 4.2: unreserved characters, 43 to 128 long.
const PKCE_RE = /^[A-Za-z0-9._~-]{43,128}$/
// Section 4.1 loopback form: http, localhost or 127.0.0.1, optional port,
// path exactly /callback, nothing after. Matched on the raw string, never on a
// URL object, so no normalisation can make two different strings equal.
const LOOPBACK_RE = /^http:\/\/(localhost|127\.0\.0\.1)(?::([0-9]{1,5}))?\/callback$/

// ── Hashing and random values ────────────────────────────────────────────────

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex')
}

function makeAccessToken() { return `bgmat_${crypto.randomBytes(24).toString('hex')}` }
function makeRefreshToken() { return `bgmrt_${crypto.randomBytes(32).toString('hex')}` }
function makeCode() { return crypto.randomBytes(32).toString('base64url') }
function makeRequestId() { return crypto.randomBytes(32).toString('base64url') }
function makeConfidentialClientId() { return `bgoc_${crypto.randomBytes(12).toString('hex')}` }
function makeClientSecret() { return `bgocs_${crypto.randomBytes(32).toString('hex')}` }

/**
 * Constant-time compare of two strings of any length: both sides are hashed
 * first, so the compare runs over 32 bytes whatever was sent.
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest()
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest()
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length
}

/** A presented secret against a stored sha256 hex, in constant time. */
function secretMatchesHash(secret, storedHashHex) {
  if (typeof secret !== 'string' || typeof storedHashHex !== 'string' || !/^[a-f0-9]{64}$/.test(storedHashHex)) return false
  const presented = crypto.createHash('sha256').update(secret, 'utf8').digest()
  return crypto.timingSafeEqual(presented, Buffer.from(storedHashHex, 'hex'))
}

// ── PKCE (RFC 7636) ──────────────────────────────────────────────────────────

function pkceChallengeS256(verifier) {
  return crypto.createHash('sha256').update(String(verifier), 'ascii').digest('base64url')
}

function isValidChallenge(c) { return typeof c === 'string' && PKCE_RE.test(c) }

/** True only for a well-formed verifier whose S256 equals the stored challenge. */
function verifyPkce(verifier, challenge) {
  if (typeof verifier !== 'string' || !PKCE_RE.test(verifier)) return false
  if (typeof challenge !== 'string' || !PKCE_RE.test(challenge)) return false
  return safeEqual(pkceChallengeS256(verifier), challenge)
}

// ── Scopes ───────────────────────────────────────────────────────────────────

function scopeWords(s) {
  if (typeof s !== 'string') return []
  return s.split(' ').filter(Boolean)
}

/** Canonical scope string from any iterable of words; unknown words dropped. */
function scopeString(words) {
  const set = new Set(words)
  return KNOWN_SCOPES.filter((w) => set.has(w)).join(' ')
}

/**
 * Section 4.2 step 3: the requested scope, unknown scopes dropped, an empty
 * request read as mcp:read. Returns a Set of known scope words.
 */
function parseRequestedScope(s) {
  const words = scopeWords(s).filter((w) => KNOWN_SCOPES.includes(w))
  const set = new Set(words)
  if (!set.has(SCOPE_READ) && !set.has(SCOPE_WRITE)) set.add(SCOPE_READ)
  return set
}

/**
 * Section 4.2 step 7: mcp:read always; mcp:write only when it was requested
 * AND the user ticked the box (ruling R2); offline_access when requested.
 */
function grantedScope(requested, writeTicked) {
  const out = [SCOPE_READ]
  if (requested.has(SCOPE_WRITE) && writeTicked === true) out.push(SCOPE_WRITE)
  if (requested.has(SCOPE_OFFLINE)) out.push(SCOPE_OFFLINE)
  return scopeString(out)
}

/** Words present in both scope strings, canonical. */
function intersectScope(a, b) {
  const sb = new Set(scopeWords(b))
  return scopeString(scopeWords(a).filter((w) => sb.has(w)))
}

/**
 * Section 4.3 refresh: a requested scope may narrow, never widen. Returns
 * { scope }, or { error: 'invalid_scope' } only for a non-string scope. Absent means "the same". mcp:read
 * is always kept, so a narrowed token can still read.
 */
function narrowScope(current, requested) {
  if (requested === undefined || requested === null) return { scope: scopeString(scopeWords(current)) }
  if (typeof requested !== 'string') return { error: 'invalid_scope' }
  // Words the grant never held are dropped, not refused (RFC 6749 section
  // 3.3; review L1): a client that sends back the scope it first asked for,
  // with write left unticked, keeps refreshing read only.
  const have = new Set(scopeWords(current))
  const want = scopeWords(requested).filter((w) => have.has(w))
  return { scope: scopeString([SCOPE_READ, ...want]) }
}

function hasScope(scope, word) { return scopeWords(scope).includes(word) }

// ── Redirects (section 4.1) ──────────────────────────────────────────────────

function loopbackParts(uri) {
  if (typeof uri !== 'string') return null
  const m = LOOPBACK_RE.exec(uri)
  if (!m) return null
  if (m[2] !== undefined) {
    const port = Number(m[2])
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  }
  return { host: m[1], port: m[2] === undefined ? null : Number(m[2]) }
}

function isLoopbackRedirect(uri) { return loopbackParts(uri) !== null }

/**
 * A redirect we will ever send a browser to (review L2): the loopback form,
 * or an https URL with no userinfo, on clientHost when one is given. Never
 * javascript:, data: or any other scheme.
 */
function isSafeRedirectForm(uri, clientHost) {
  if (typeof uri !== 'string' || !uri) return false
  if (loopbackParts(uri)) return true
  let u
  try { u = new URL(uri) } catch { return false }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname) return false
  return clientHost ? u.hostname === clientHost : true
}

/**
 * A requested redirect against the client's registered list. Loopback: same
 * scheme (http), same host, path /callback, any port, when the list has the
 * same scheme, host and path with or without a port. Anything else: byte for
 * byte.
 */
function redirectAllowed(requested, registered) {
  if (typeof requested !== 'string' || !requested || requested.length > MAX_REDIRECT_URI_LEN) return false
  const list = Array.isArray(registered) ? registered.filter((r) => typeof r === 'string') : []
  if (!isSafeRedirectForm(requested)) return false
  if (list.includes(requested)) return true
  const want = loopbackParts(requested)
  if (!want) return false
  return list.some((r) => { const p = loopbackParts(r); return !!p && p.host === want.host })
}

/** The host shown on consent ("will be sent back to <host>"). */
function redirectHost(uri) {
  const lb = loopbackParts(uri)
  if (lb) return lb.host
  try { return new URL(uri).hostname } catch { return '' }
}

/** Appends OAuth response parameters to a proven redirect. */
function buildRedirect(redirectUri, params) {
  const u = new URL(redirectUri)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
  return u.toString()
}

// ── Client names ─────────────────────────────────────────────────────────────

/** Display name: control characters removed, trimmed, clipped to 60. Rendered as text. */
function cleanClientName(name) {
  if (typeof name !== 'string') return ''
  const kept = Array.from(name).filter((ch) => { const c = ch.codePointAt(0); return c >= 32 && c !== 127 && !(c >= 128 && c < 160) })
  return kept.join('').trim().slice(0, CLIENT_NAME_MAX).trim()
}

// ── CIMD (section 4.1, ruling R4) ────────────────────────────────────────────

class OAuthError extends Error {
  /** code: an OAuth or page error code; never carries a secret. */
  constructor(code, message) { super(message || code); this.code = code }
}

function looksLikeUrlClientId(id) { return typeof id === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(id) }

/**
 * Release-one rules for a CIMD client_id: https, no userinfo, no fragment, no
 * query, port 443 only, host on the allowlist, a path, at most 512 characters,
 * and in canonical form (the URL parser must give back the same string, so an
 * explicit :443, a trailing dot or an upper-case host is refused rather than
 * normalised). Returns the URL object or throws OAuthError('invalid_client').
 */
function validateCimdUrl(id, allowedHosts = CIMD_ALLOWED_HOSTS) {
  if (typeof id !== 'string' || id.length === 0 || id.length > CIMD_MAX_URL) throw new OAuthError('invalid_client', 'client_id URL too long or empty')
  if (!id.startsWith('https://')) throw new OAuthError('invalid_client', 'client_id must be https')
  if (id.includes('#') || id.includes('?')) throw new OAuthError('invalid_client', 'client_id must not carry a query or fragment')
  let u
  try { u = new URL(id) } catch { throw new OAuthError('invalid_client', 'client_id is not a URL') }
  if (u.protocol !== 'https:') throw new OAuthError('invalid_client', 'client_id must be https')
  if (u.username || u.password) throw new OAuthError('invalid_client', 'client_id must not carry userinfo')
  if (u.port !== '' && u.port !== '443') throw new OAuthError('invalid_client', 'client_id must use port 443')
  if (u.href !== id) throw new OAuthError('invalid_client', 'client_id is not in canonical form')
  if (!u.pathname || u.pathname === '/') throw new OAuthError('invalid_client', 'client_id needs a path')
  if (!allowedHosts.has(u.hostname)) throw new OAuthError('invalid_client', 'client_id host not allowed')
  return u
}

async function readCapped(res, maxBytes) {
  const lenHeader = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-length') : null
  if (lenHeader !== null && lenHeader !== undefined && Number(lenHeader) > maxBytes) throw new OAuthError('invalid_client', 'client metadata too large')
  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader()
    const chunks = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const buf = Buffer.from(value)
      total += buf.length
      if (total > maxBytes) {
        try { await reader.cancel() } catch { /* ignore */ }
        throw new OAuthError('invalid_client', 'client metadata too large')
      }
      chunks.push(buf)
    }
    return Buffer.concat(chunks).toString('utf8')
  }
  const text = await res.text()
  if (Buffer.byteLength(String(text), 'utf8') > maxBytes) throw new OAuthError('invalid_client', 'client metadata too large')
  return String(text)
}

/**
 * Fetches and validates one CIMD document. No redirect followed (a 3xx is a
 * failure), 3 s timeout over the whole fetch and body, 8 KB cap. The document
 * client_id must equal the URL. Returns { name, redirect_uris, metadata }.
 * Throws OAuthError: 'invalid_client' for a document that is wrong, and
 * 'client_metadata_unavailable' for a network failure, timeout or non-200.
 */
async function fetchCimd(url, { fetchImpl, timeoutMs = CIMD_TIMEOUT_MS, maxBytes = CIMD_MAX_BYTES } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!f) throw new OAuthError('client_metadata_unavailable', 'no fetch available')
  const ac = new AbortController()
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { ac.abort(); reject(new OAuthError('client_metadata_unavailable', 'client metadata fetch timed out')) }, timeoutMs)
  })
  let text
  try {
    text = await Promise.race([
      (async () => {
        let res
        try {
          res = await f(url, { method: 'GET', redirect: 'manual', signal: ac.signal, headers: { Accept: 'application/json' } })
        } catch (e) {
          if (e instanceof OAuthError) throw e
          throw new OAuthError('client_metadata_unavailable', 'client metadata fetch failed')
        }
        if (!res || res.status !== 200) throw new OAuthError('client_metadata_unavailable', `client metadata answered ${res ? res.status : 'nothing'}`)
        return readCapped(res, maxBytes)
      })(),
      timeout,
    ])
  } finally {
    clearTimeout(timer)
  }
  let doc
  try { doc = JSON.parse(text) } catch { throw new OAuthError('invalid_client', 'client metadata is not JSON') }
  return validateCimdDocument(doc, url)
}

function validateCimdDocument(doc, url) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new OAuthError('invalid_client', 'client metadata is not an object')
  if (doc.client_id !== url) throw new OAuthError('invalid_client', 'client metadata client_id does not match its URL')
  const uris = doc.redirect_uris
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > MAX_REDIRECT_URIS) throw new OAuthError('invalid_client', 'client metadata redirect_uris missing or too many')
  for (const u of uris) {
    if (typeof u !== 'string' || !u || u.length > MAX_REDIRECT_URI_LEN) throw new OAuthError('invalid_client', 'client metadata redirect_uris invalid')
  }
  // Only loopback or https on the client_id's own host survive (review L2).
  const clientHost = new URL(url).hostname
  const safeUris = uris.filter((u) => isSafeRedirectForm(u, clientHost))
  if (safeUris.length === 0) throw new OAuthError('invalid_client', 'client metadata has no usable redirect_uris')
  const method = doc.token_endpoint_auth_method
  if (method !== undefined && method !== null && method !== 'none') throw new OAuthError('invalid_client', 'client metadata must use token_endpoint_auth_method none')
  if (doc.grant_types !== undefined && (!Array.isArray(doc.grant_types) || !doc.grant_types.includes('authorization_code'))) {
    throw new OAuthError('invalid_client', 'client metadata grant_types must include authorization_code')
  }
  if (doc.response_types !== undefined && (!Array.isArray(doc.response_types) || !doc.response_types.includes('code'))) {
    throw new OAuthError('invalid_client', 'client metadata response_types must include code')
  }
  let name = cleanClientName(doc.client_name)
  if (!name) { try { name = new URL(url).hostname } catch { name = '' } }
  return {
    name,
    redirect_uris: safeUris.slice(),
    metadata: {
      client_id: url,
      client_name: typeof doc.client_name === 'string' ? doc.client_name.slice(0, 200) : null,
      client_uri: typeof doc.client_uri === 'string' ? doc.client_uri.slice(0, 512) : null,
      redirect_uris: safeUris.slice(),
      token_endpoint_auth_method: 'none',
    },
  }
}

// ── Client resolution ────────────────────────────────────────────────────────

const CLIENT_COLS = 'id, kind, name, redirect_uris, secret_hash, fetched_at, disabled_at'

function publicClient(row) {
  return { id: row.id, kind: row.kind, name: row.name || '', redirect_uris: Array.isArray(row.redirect_uris) ? row.redirect_uris : [] }
}

/**
 * The OAuth client behind a client_id, for authorize (check and decide).
 * Confidential: the row must exist, kind confidential, not disabled. CIMD: the
 * URL must pass validateCimdUrl; a cached row younger than 24 h is used as
 * is; otherwise the document is fetched and the cache row upserted. A fetch
 * failure is never covered by a stale cache. A disabled CIMD row is refused.
 * Returns publicClient(row) or throws OAuthError.
 */
async function resolveClient(sb, clientId, { fetchImpl, now = new Date(), cimdTimeoutMs, cimdMaxBytes, allowedHosts } = {}) {
  if (typeof clientId !== 'string' || !clientId) throw new OAuthError('invalid_client', 'client_id missing')
  if (looksLikeUrlClientId(clientId)) {
    validateCimdUrl(clientId, allowedHosts)
    const { data: cached, error } = await sb.from('oauth_clients').select(CLIENT_COLS).eq('id', clientId).maybeSingle()
    if (error) throw error
    if (cached && cached.kind !== 'cimd') throw new OAuthError('invalid_client', 'client kind mismatch')
    if (cached && cached.disabled_at) throw new OAuthError('invalid_client', 'client disabled')
    const fresh = cached && cached.fetched_at && now.getTime() - Date.parse(cached.fetched_at) < CIMD_CACHE_S * 1000
    if (fresh) return publicClient(cached)
    const doc = await fetchCimd(clientId, { fetchImpl, timeoutMs: cimdTimeoutMs, maxBytes: cimdMaxBytes })
    const row = { id: clientId, kind: 'cimd', name: doc.name, redirect_uris: doc.redirect_uris, metadata: doc.metadata, fetched_at: now.toISOString() }
    const up = await sb.from('oauth_clients').upsert(row, { onConflict: 'id' }).select(CLIENT_COLS).single()
    if (up.error) throw up.error
    return publicClient(up.data)
  }
  if (!CONFIDENTIAL_CLIENT_ID_RE.test(clientId)) throw new OAuthError('invalid_client', 'unknown client')
  const { data, error } = await sb.from('oauth_clients').select(CLIENT_COLS).eq('id', clientId).maybeSingle()
  if (error) throw error
  if (!data || data.kind !== 'confidential' || data.disabled_at) throw new OAuthError('invalid_client', 'unknown client')
  return publicClient(data)
}

/**
 * Client authentication at /oauth/token and /oauth/revoke (section 4.3).
 * credentials = { basic: { id, secret } | null, postId, postSecret }.
 * Confidential: Basic or post secret, compared to secret_hash in constant
 * time; no secret is invalid_client. CIMD: client_id only, no secret, and the
 * cached row must exist (it was written at consent) and not be disabled; the
 * token endpoint never fetches. Returns publicClient(row) plus `method`, or
 * throws OAuthError('invalid_client' | 'invalid_request').
 */
async function authenticateClient(sb, credentials) {
  const { basic, postId, postSecret } = credentials
  if (basic && postSecret !== undefined) throw new OAuthError('invalid_request', 'use one client authentication method')
  if (basic && postId !== undefined && postId !== basic.id) throw new OAuthError('invalid_request', 'client_id does not match the Authorization header')
  const id = basic ? basic.id : postId
  const secret = basic ? basic.secret : postSecret
  if (typeof id !== 'string' || !id) throw new OAuthError('invalid_client', 'client_id missing')
  if (looksLikeUrlClientId(id)) {
    if (secret !== undefined && secret !== '') throw new OAuthError('invalid_client', 'a public client sends no secret')
    try { validateCimdUrl(id) } catch { throw new OAuthError('invalid_client', 'unknown client') }
    const { data, error } = await sb.from('oauth_clients').select(CLIENT_COLS).eq('id', id).maybeSingle()
    if (error) throw error
    if (!data || data.kind !== 'cimd' || data.disabled_at) throw new OAuthError('invalid_client', 'unknown client')
    return { ...publicClient(data), method: 'none' }
  }
  if (!CONFIDENTIAL_CLIENT_ID_RE.test(id)) throw new OAuthError('invalid_client', 'unknown client')
  const { data, error } = await sb.from('oauth_clients').select(CLIENT_COLS).eq('id', id).maybeSingle()
  if (error) throw error
  // Compare even when the row is missing, so timing does not tell which ids exist.
  const ok = secretMatchesHash(typeof secret === 'string' ? secret : '', data && data.secret_hash ? data.secret_hash : '0'.repeat(64))
  if (!data || data.kind !== 'confidential' || data.disabled_at || typeof secret !== 'string' || !secret || !ok) {
    throw new OAuthError('invalid_client', 'client authentication failed')
  }
  return { ...publicClient(data), method: basic ? 'client_secret_basic' : 'client_secret_post' }
}

/**
 * RFC 6749 section 2.3.1: Basic credentials are form-urlencoded before base64.
 * Returns { id, secret } or null when the header is absent or not Basic;
 * throws OAuthError('invalid_client') when it is Basic but malformed.
 */
function parseBasicAuth(headerValue) {
  if (typeof headerValue !== 'string') return null
  const m = /^basic +(.+)$/i.exec(headerValue.trim())
  if (!m) return null
  let decoded
  try { decoded = Buffer.from(m[1].trim(), 'base64').toString('utf8') } catch { throw new OAuthError('invalid_client', 'malformed Basic credentials') }
  const i = decoded.indexOf(':')
  if (i < 0) throw new OAuthError('invalid_client', 'malformed Basic credentials')
  const dec = (s) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')) } catch { throw new OAuthError('invalid_client', 'malformed Basic credentials') } }
  return { id: dec(decoded.slice(0, i)), secret: dec(decoded.slice(i + 1)) }
}

// ── Grants and tokens ────────────────────────────────────────────────────────

function isoAfter(now, seconds) { return new Date(now.getTime() + seconds * 1000).toISOString() }
function isLive(expiresAt, now) { return !!expiresAt && Date.parse(expiresAt) > now.getTime() }

/**
 * Revokes a grant and every live token under it. The grant update is the
 * authority: mcp-server.js and the token endpoint read the grant's revoked_at
 * on every use, so once that one statement lands nothing under it works,
 * whatever happens to the token update after it. Returns true when the grant
 * was live and is now revoked.
 */
async function revokeGrant(sb, grantId, nowIso) {
  const g = await sb.from('oauth_grants').update({ revoked_at: nowIso }).eq('id', grantId).is('revoked_at', null).select('id')
  if (g.error) throw g.error
  const t = await sb.from('oauth_tokens').update({ revoked_at: nowIso }).eq('grant_id', grantId).is('revoked_at', null)
  if (t && t.error) throw t.error
  return Array.isArray(g.data) && g.data.length > 0
}

/** Mints an access token and, when offline_access is in scope, a refresh token. */
function mintTokenPair(grantId, scope, now, rotatedFrom = null) {
  const access = makeAccessToken()
  const rows = [{ grant_id: grantId, kind: 'access', token_hash: sha256Hex(access), scope, expires_at: isoAfter(now, ACCESS_TTL_S), rotated_from: rotatedFrom }]
  let refresh = null
  if (hasScope(scope, SCOPE_OFFLINE)) {
    refresh = makeRefreshToken()
    rows.push({ grant_id: grantId, kind: 'refresh', token_hash: sha256Hex(refresh), scope, expires_at: isoAfter(now, REFRESH_TTL_S), rotated_from: rotatedFrom })
  }
  const body = { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL_S }
  if (refresh) body.refresh_token = refresh
  body.scope = scope
  return { rows, body }
}

// ── Metadata documents (sections 3.2 and 3.3) ────────────────────────────────

const PROTECTED_RESOURCE_METADATA = Object.freeze({
  resource: RESOURCE,
  authorization_servers: [ISSUER],
  scopes_supported: MCP_SCOPES.slice(),
  bearer_methods_supported: ['header'],
  resource_name: 'BrandGEO',
  resource_documentation: DOCS_URL,
})

const AUTHORIZATION_SERVER_METADATA = Object.freeze({
  issuer: ISSUER,
  authorization_endpoint: AUTHORIZATION_ENDPOINT,
  token_endpoint: TOKEN_ENDPOINT,
  revocation_endpoint: REVOCATION_ENDPOINT,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
  client_id_metadata_document_supported: true,
  scopes_supported: KNOWN_SCOPES.slice(),
  service_documentation: DOCS_URL,
})

/** The 401 header of section 3.1; invalidToken adds error="invalid_token". */
function wwwAuthenticate(invalidToken = false) {
  const base = `Bearer resource_metadata="${PRM_URL}", scope="${MCP_SCOPES.join(' ')}"`
  return invalidToken ? `${base}, error="invalid_token"` : base
}

module.exports = {
  ISSUER, RESOURCE, PRM_URL, AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT, REVOCATION_ENDPOINT, DOCS_URL, ANTHROPIC_REDIRECT_URI,
  SCOPE_READ, SCOPE_WRITE, SCOPE_OFFLINE, KNOWN_SCOPES, MCP_SCOPES,
  ACCESS_TTL_S, REFRESH_TTL_S, GRANT_IDLE_S, CODE_TTL_S, PENDING_TTL_S, CIMD_CACHE_S,
  CIMD_ALLOWED_HOSTS, CIMD_MAX_URL, CIMD_TIMEOUT_MS, CIMD_MAX_BYTES, CLIENT_NAME_MAX,
  ACCESS_TOKEN_RE, REFRESH_TOKEN_RE, CODE_RE, REQUEST_ID_RE, CONFIDENTIAL_CLIENT_ID_RE, CLIENT_SECRET_RE, PKCE_RE, LOOPBACK_RE,
  sha256Hex, makeAccessToken, makeRefreshToken, makeCode, makeRequestId, makeConfidentialClientId, makeClientSecret,
  safeEqual, secretMatchesHash,
  pkceChallengeS256, isValidChallenge, verifyPkce,
  scopeWords, scopeString, parseRequestedScope, grantedScope, intersectScope, narrowScope, hasScope,
  isLoopbackRedirect, isSafeRedirectForm, redirectAllowed, redirectHost, buildRedirect,
  cleanClientName, OAuthError, looksLikeUrlClientId, validateCimdUrl, fetchCimd, validateCimdDocument,
  CLIENT_COLS, resolveClient, authenticateClient, parseBasicAuth,
  isoAfter, isLive, revokeGrant, mintTokenPair,
  PROTECTED_RESOURCE_METADATA, AUTHORIZATION_SERVER_METADATA, wwwAuthenticate,
}
