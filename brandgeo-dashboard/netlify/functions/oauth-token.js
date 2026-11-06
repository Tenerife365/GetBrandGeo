/**
 * oauth-token.js -- /oauth/token and /oauth/revoke of BrandGEO's own OAuth
 * authorization server (docs/arch/mcp-stage3-oauth.md sections 4.3 and 4.4).
 * netlify.toml rewrites both paths here; the original path (event.path) picks
 * the endpoint.
 *
 * BODY. application/x-www-form-urlencoded only; anything else is 415 (JSON is
 * refused on purpose). A parameter sent twice is invalid_request.
 *
 * CLIENT AUTHENTICATION. The Anthropic-held confidential client by
 * client_secret_basic or client_secret_post (sha256 compared in constant
 * time); a CIMD client by client_id alone (method none), from the row cached
 * at consent; this endpoint never fetches a document. A confidential client
 * without a secret is invalid_client (401).
 *
 * authorization_code. The code is claimed in one conditional update
 * (used_at is null, unexpired) that returns the row, so a second exchange
 * finds nothing; a replayed code also revokes the grant it produced. Then:
 * same client, same redirect_uri byte for byte, PKCE S256, resource absent or
 * ours, the user still a viewer of the same BrandGEO client. One live grant
 * per (user, OAuth client, BrandGEO client): a new consent replaces its scope;
 * an expired one is revoked and replaced.
 *
 * refresh_token. The presented token is claimed in one conditional update
 * (used_at is null); a token presented again after its rotation revokes the
 * whole grant and answers invalid_grant (reuse detection). The new pair is
 * inserted right after the claim. Not one database transaction (PostgREST has
 * none across statements): if the insert fails after the claim the client
 * gets server_error and must connect again, which fails closed. A requested
 * scope may narrow, never widen.
 *
 * Responses carry Cache-Control: no-store. Errors are RFC 6749 codes.
 * Revoke (RFC 7009) answers 200 for any token once the client authenticated,
 * known or not, so it never reveals which tokens exist.
 *
 * LOGGING. Never a token, code, verifier, secret, prefix, hash or the
 * Authorization header. Lines carry the grant type, the outcome code and,
 * after success, the BrandGEO client id.
 */
const { createClient } = require('@supabase/supabase-js')
const o = require('./_oauth')

const MAX_BODY = 16384
const BASE_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' }
const CODE_COLS = 'id, oauth_client_id, user_id, client_id, redirect_uri, code_challenge, scope_granted, resource, expires_at, used_at, code_hash, grant_id'
const GRANT_COLS = 'id, client_id, user_id, oauth_client_id, client_name, redirect_host, scope, created_at, last_used_at, revoked_at, expires_at'
const TOKEN_COLS = 'id, grant_id, kind, scope, expires_at, used_at, revoked_at'

class TokenError extends Error {
  constructor(code, description, status) { super(code); this.code = code; this.description = description; this.status = status || (code === 'invalid_client' ? 401 : 400) }
}

function header(event, name) {
  const h = event.headers || {}
  const want = name.toLowerCase()
  for (const k of Object.keys(h)) if (k.toLowerCase() === want) return h[k]
  return undefined
}

function scrub(msg) {
  return String(msg || '').replace(/bg(mcp|mat|mrt|ocs)_\S*/gi, '[redacted]').replace(/[a-f0-9]{48,}/gi, '[redacted]').replace(/[A-Za-z0-9_-]{43,}/g, '[redacted]')
}

/** Form body to a Map; throws TokenError on a repeated parameter. */
function parseForm(raw) {
  const sp = new URLSearchParams(raw)
  const out = new Map()
  for (const [k, v] of sp) {
    if (out.has(k)) throw new TokenError('invalid_request', `parameter ${k.slice(0, 40).replace(/[^a-z_]/gi, '')} sent more than once`)
    out.set(k, v)
  }
  return out
}

function endpointFor(event) {
  const p = String(event.path || event.rawUrl || '').split('?')[0].replace(/\/+$/, '')
  if (p.endsWith('/revoke')) return 'revoke'
  return 'token'
}

/** The user must still be a non-admin viewer of the grant's BrandGEO client. */
async function userStillMapped(sb, userId, clientId) {
  const { data, error } = await sb.from('user_profiles').select('role, client_id').eq('id', userId).maybeSingle()
  if (error) throw error
  return !!data && data.role !== 'admin' && data.client_id !== null && data.client_id !== undefined && String(data.client_id) === String(clientId)
}

async function exchangeCode(sb, client, form, now, nowIso) {
  const code = form.get('code')
  const redirectUri = form.get('redirect_uri')
  const verifier = form.get('code_verifier')
  if (!code || !redirectUri || !verifier) throw new TokenError('invalid_request', 'code, redirect_uri and code_verifier are required')
  if (!o.CODE_RE.test(code)) throw new TokenError('invalid_grant', 'invalid code')
  const codeHash = o.sha256Hex(code)

  // Single use: the claim is the read.
  const claim = await sb.from('oauth_codes').update({ used_at: nowIso })
    .eq('code_hash', codeHash).is('used_at', null).gt('expires_at', nowIso)
    .select(CODE_COLS)
  if (claim.error) throw claim.error
  const row = Array.isArray(claim.data) && claim.data.length === 1 ? claim.data[0] : null
  if (!row) {
    // Replay: the code exists, was used, and produced a grant. Revoke it.
    const prev = await sb.from('oauth_codes').select('id, used_at, grant_id').eq('code_hash', codeHash).maybeSingle()
    if (prev.error) throw prev.error
    if (prev.data && prev.data.used_at && prev.data.grant_id) {
      await o.revokeGrant(sb, prev.data.grant_id, nowIso)
      console.warn('[oauth-token] authorization code replayed; its grant was revoked')
    }
    throw new TokenError('invalid_grant', 'invalid code')
  }
  if (row.oauth_client_id !== client.id) throw new TokenError('invalid_grant', 'code was issued to another client')
  if (row.redirect_uri !== redirectUri) throw new TokenError('invalid_grant', 'redirect_uri does not match')
  if (!o.verifyPkce(verifier, row.code_challenge)) throw new TokenError('invalid_grant', 'code_verifier does not match')
  const resource = form.get('resource')
  if (resource !== undefined && resource !== o.RESOURCE) throw new TokenError('invalid_target', 'unknown resource')
  if (row.resource !== null && row.resource !== undefined && row.resource !== o.RESOURCE) throw new TokenError('invalid_target', 'unknown resource')
  if (!(await userStillMapped(sb, row.user_id, row.client_id))) throw new TokenError('invalid_grant', 'the account no longer matches')

  const scope = o.scopeString(o.scopeWords(row.scope_granted))
  if (!o.hasScope(scope, o.SCOPE_READ)) throw new TokenError('invalid_grant', 'invalid code')
  const grant = await upsertGrant(sb, { client, row, scope, now, nowIso })

  const link = await sb.from('oauth_codes').update({ grant_id: grant.id }).eq('id', row.id)
  if (link && link.error) throw link.error

  const pair = o.mintTokenPair(grant.id, scope, now)
  const ins = await sb.from('oauth_tokens').insert(pair.rows)
  if (ins && ins.error) throw ins.error
  return { body: pair.body, clientId: row.client_id }
}

/**
 * One live grant per (user, OAuth client, BrandGEO client). A live, unexpired
 * grant is reused and its scope replaced by the new consent; an expired one
 * is revoked first. A concurrent first consent that loses the unique index
 * race re-reads and reuses the winner.
 */
async function upsertGrant(sb, { client, row, scope, now, nowIso }) {
  const redirectHost = o.redirectHost(row.redirect_uri)
  const patch = { scope, client_name: client.name || '', redirect_host: redirectHost, expires_at: o.isoAfter(now, o.GRANT_IDLE_S) }
  const findLive = () => sb.from('oauth_grants').select(GRANT_COLS)
    .eq('user_id', row.user_id).eq('oauth_client_id', client.id).eq('client_id', row.client_id).is('revoked_at', null)
    .maybeSingle()
  for (let attempt = 0; attempt < 2; attempt++) {
    const found = await findLive()
    if (found.error) throw found.error
    if (found.data && o.isLive(found.data.expires_at, now)) {
      const up = await sb.from('oauth_grants').update(patch).eq('id', found.data.id).is('revoked_at', null).select(GRANT_COLS)
      if (up.error) throw up.error
      if (Array.isArray(up.data) && up.data.length === 1) return up.data[0]
      continue
    }
    if (found.data) await o.revokeGrant(sb, found.data.id, nowIso)
    const ins = await sb.from('oauth_grants').insert({ client_id: row.client_id, user_id: row.user_id, oauth_client_id: client.id, last_used_at: null, revoked_at: null, ...patch }).select(GRANT_COLS).single()
    if (!ins.error) return ins.data
    if (ins.error.code !== '23505') throw ins.error
  }
  throw new Error('grant upsert did not settle')
}

/** Review M1: a refresh token presented again within this window is refused, not treated as theft. */
const REFRESH_REUSE_GRACE_MS = 30_000

async function refresh(sb, client, form, now, nowIso) {
  const token = form.get('refresh_token')
  if (!token) throw new TokenError('invalid_request', 'refresh_token is required')
  if (!o.REFRESH_TOKEN_RE.test(token)) throw new TokenError('invalid_grant', 'invalid refresh token')
  const t = await sb.from('oauth_tokens').select(TOKEN_COLS).eq('token_hash', o.sha256Hex(token)).eq('kind', 'refresh').maybeSingle()
  if (t.error) throw t.error
  const row = t.data
  if (!row) throw new TokenError('invalid_grant', 'invalid refresh token')
  const g = await sb.from('oauth_grants').select(GRANT_COLS).eq('id', row.grant_id).maybeSingle()
  if (g.error) throw g.error
  const grant = g.data
  if (!grant || grant.oauth_client_id !== client.id) throw new TokenError('invalid_grant', 'invalid refresh token')

  if (row.used_at) {
    // Review M1: inside the grace window a second presentation is a duplicate
    // (two Claude Code sessions, or a proactive and a reactive refresh at
    // once), not theft. Refuse it without revoking, so the winner's new pair
    // keeps working. Outside the window it is reuse: revoke the grant.
    if (now.getTime() - Date.parse(row.used_at) < REFRESH_REUSE_GRACE_MS) {
      console.warn(`[oauth-token] refresh_reuse_grace for client ${grant.client_id}; refused, grant kept`)
      throw new TokenError('invalid_grant', 'refresh token already used')
    }
    await o.revokeGrant(sb, grant.id, nowIso)
    console.warn(`[oauth-token] refresh token reused for client ${grant.client_id}; grant revoked`)
    throw new TokenError('invalid_grant', 'refresh token already used')
  }
  if (row.revoked_at || !o.isLive(row.expires_at, now) || grant.revoked_at || !o.isLive(grant.expires_at, now)) {
    throw new TokenError('invalid_grant', 'refresh token expired or revoked')
  }
  if (!(await userStillMapped(sb, grant.user_id, grant.client_id))) throw new TokenError('invalid_grant', 'the account no longer matches')

  const current = o.intersectScope(row.scope, grant.scope)
  const narrowed = o.narrowScope(current, form.has('scope') ? form.get('scope') : undefined)
  if (narrowed.error) throw new TokenError('invalid_scope', 'a refresh may narrow the scope, never widen it')

  const claim = await sb.from('oauth_tokens').update({ used_at: nowIso })
    .eq('id', row.id).is('used_at', null).is('revoked_at', null).select('id')
  if (claim.error) throw claim.error
  if (!Array.isArray(claim.data) || claim.data.length !== 1) {
    // Lost a race with another presentation of the same token. The other
    // presentation claimed it a moment ago, so this is inside the grace
    // window by construction (review M1): refuse without revoking. That holds
    // while this function's timeout stays under the 30 s window (the default
    // 10 s today; review N3): do not raise it past 30 s.
    console.warn(`[oauth-token] refresh_reuse_grace for client ${grant.client_id}; lost race, refused, grant kept`)
    throw new TokenError('invalid_grant', 'refresh token already used')
  }

  const pair = o.mintTokenPair(grant.id, narrowed.scope, now, row.id)
  const ins = await sb.from('oauth_tokens').insert(pair.rows)
  if (ins && ins.error) throw ins.error
  const bump = await sb.from('oauth_grants').update({ expires_at: o.isoAfter(now, o.GRANT_IDLE_S) }).eq('id', grant.id).is('revoked_at', null)
  if (bump && bump.error) console.warn(`[oauth-token] grant expiry bump failed for client ${grant.client_id}: ${scrub(bump.error.message)}`)
  return { body: pair.body, clientId: grant.client_id }
}

async function revoke(sb, client, form, nowIso) {
  const token = form.get('token')
  if (!token) throw new TokenError('invalid_request', 'token is required')
  let kind = null
  if (o.ACCESS_TOKEN_RE.test(token)) kind = 'access'
  else if (o.REFRESH_TOKEN_RE.test(token)) kind = 'refresh'
  if (!kind) return
  const t = await sb.from('oauth_tokens').select(TOKEN_COLS).eq('token_hash', o.sha256Hex(token)).eq('kind', kind).maybeSingle()
  if (t.error) throw t.error
  if (!t.data) return
  const g = await sb.from('oauth_grants').select('id, oauth_client_id').eq('id', t.data.grant_id).maybeSingle()
  if (g.error) throw g.error
  // A token of another client is left alone, and the answer is still 200.
  if (!g.data || g.data.oauth_client_id !== client.id) return
  if (kind === 'refresh') {
    await o.revokeGrant(sb, g.data.id, nowIso)
    return
  }
  const up = await sb.from('oauth_tokens').update({ revoked_at: nowIso }).eq('id', t.data.id).is('revoked_at', null)
  if (up && up.error) throw up.error
}

async function handle(event, context = {}, opts = {}) {
  const invId = String((context && context.awsRequestId) || '-').slice(0, 8)
  const endpoint = endpointFor(event)
  const out = (statusCode, obj, extra) => ({ statusCode, headers: { ...BASE_HEADERS, ...(extra || {}) }, body: obj === null ? '' : JSON.stringify(obj) })
  const fail = (e, usedBasic) => {
    const extra = e.status === 401 && usedBasic ? { 'WWW-Authenticate': 'Basic realm="brandgeo-oauth"' } : undefined
    console.log(`[oauth-token/${invId}] ${endpoint} outcome=${e.code}`)
    return out(e.status, { error: e.code, error_description: e.description || e.code }, extra)
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body: '' }
  const ctype = String(header(event, 'content-type') || '').toLowerCase()
  if (!/^application\/x-www-form-urlencoded(\s*;.*)?$/.test(ctype.trim())) {
    console.log(`[oauth-token/${invId}] ${endpoint} outcome=415`)
    return out(415, { error: 'invalid_request', error_description: 'Send the body as application/x-www-form-urlencoded.' })
  }
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : String(event.body || '')
  let usedBasic = false
  try {
    if (raw.length > MAX_BODY) throw new TokenError('invalid_request', 'body too large')
    const form = parseForm(raw)
    let basic = null
    try { basic = o.parseBasicAuth(header(event, 'authorization')) } catch (e) { usedBasic = true; throw new TokenError('invalid_client', 'client authentication failed') }
    usedBasic = !!basic
    const sb = opts.supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const now = (opts.now || (() => new Date()))()
    const nowIso = now.toISOString()

    let client
    try {
      client = await o.authenticateClient(sb, {
        basic,
        postId: form.has('client_id') ? form.get('client_id') : undefined,
        postSecret: form.has('client_secret') ? form.get('client_secret') : undefined,
      })
    } catch (e) {
      if (e instanceof o.OAuthError) throw new TokenError(e.code === 'invalid_request' ? 'invalid_request' : 'invalid_client', e.code === 'invalid_request' ? e.message : 'client authentication failed')
      throw e
    }

    if (endpoint === 'revoke') {
      await revoke(sb, client, form, nowIso)
      console.log(`[oauth-token/${invId}] revoke outcome=ok`)
      return out(200, null)
    }

    const grantType = form.get('grant_type')
    let result
    if (grantType === 'authorization_code') result = await exchangeCode(sb, client, form, now, nowIso)
    else if (grantType === 'refresh_token') result = await refresh(sb, client, form, now, nowIso)
    else if (!grantType) throw new TokenError('invalid_request', 'grant_type is required')
    else throw new TokenError('unsupported_grant_type', 'use authorization_code or refresh_token')
    console.log(`[oauth-token/${invId}] token grant=${grantType} client=${result.clientId} outcome=ok`)
    return out(200, result.body)
  } catch (e) {
    if (e instanceof TokenError) return fail(e, usedBasic)
    console.error(`[oauth-token/${invId}] ${endpoint} failed: ${scrub(e && e.message)}`)
    return out(500, { error: 'server_error', error_description: 'Something went wrong. Try again.' })
  }
}

exports.handler = (event, context) => handle(event, context)
exports.handle = handle
exports.endpointFor = endpointFor
