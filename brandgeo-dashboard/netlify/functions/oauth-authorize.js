/**
 * oauth-authorize.js -- the server half of the consent page at /oauth/authorize
 * (docs/arch/mcp-stage3-oauth.md section 4.2; request and response shapes in
 * section 11). /oauth/authorize itself is an SPA route (OAuthAuthorize.tsx);
 * the page calls this function with the signed-in user's Supabase JWT.
 *
 * POST body, one of:
 *   { action: 'check', response_type, client_id, redirect_uri, scope, state,
 *     code_challenge, code_challenge_method, resource }
 *   { action: 'decide', request_id, allow: boolean, write: boolean }
 *
 * ORDER (section 4.2 step 3). Before the redirect is proven (client known or
 * CIMD resolvable, redirect allowed for that client) every failure is a page
 * error the page words itself; it never redirects. After the redirect is
 * proven, parameter failures go back to it as error=...&state=...: the
 * function answers { ok: false, error, redirect } and the page navigates.
 * Account failures (R6 admin, R8 plan gate, research) are page errors.
 *
 * BINDING. check stores the validated request server side as a pending
 * oauth_codes row (5 minutes) keyed by sha256(request_id) and returns
 * request_id. decide reads only that stored row, never the browser's copy:
 * the client and the redirect match are resolved again from it, the account
 * checks run again for the same user and BrandGEO client, and the row is
 * claimed in one conditional update (pending, unexpired, same user), so a
 * request is decided at most once. Allow turns it into a single-use code
 * (32 random bytes, stored hashed, 5 minutes); Cancel consumes it and sends
 * error=access_denied.
 *
 * SECRETS. The code and the request id exist only in this function's memory
 * and in its response. Nothing here logs a code, a request id, a hash or the
 * Authorization header.
 */
const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { RESEARCH_CATEGORY } = require('./_cost')
const { MCP_MIN_PLAN, PLAN_LABELS, mcpAllowedFor } = require('./_plans')
const o = require('./_oauth')

const MAX_STATE = 1024
const MAX_BODY = 16384
const UPGRADE_URL = 'https://app.getbrandgeo.com/account'
const PARAMS = ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'code_challenge', 'code_challenge_method', 'resource']
const PENDING_COLS = 'id, user_id, client_id, oauth_client_id, redirect_uri, code_challenge, scope_requested, resource, state, expires_at, used_at, code_hash'

const PAGE_STATUS = {
  invalid_request: 400,
  invalid_client: 400,
  client_metadata_unavailable: 503,
  invalid_redirect_uri: 400,
  request_expired: 400,
  admin_account: 403,
  no_account: 403,
  plan_required: 403,
  account_unavailable: 403,
  server_error: 500,
}

class PageError extends Error {
  constructor(code, extra) { super(code); this.code = code; this.extra = extra || {} }
}

/** A query parameter as the page sends it: a string, or absent (undefined or null). */
function param(body, name) {
  const v = body[name]
  if (v === undefined || v === null) return undefined
  return typeof v === 'string' ? v : false
}

/**
 * Section 4.2 step 4. The signed-in user must be a viewer of a BrandGEO
 * client (R6: admins are refused), the client must exist, pass the MCP plan
 * gate (R8, Radar and up) and not be a research client.
 */
async function accountFor(sb, profile, expectClientId = null) {
  if (!profile || profile.role === 'admin') throw new PageError('admin_account')
  if (profile.client_id === null || profile.client_id === undefined) throw new PageError('no_account')
  if (expectClientId !== null && String(profile.client_id) !== String(expectClientId)) throw new PageError('request_expired')
  const { data: client, error } = await sb.from('clients').select('id, name, plan, category').eq('id', profile.client_id).maybeSingle()
  if (error) throw error
  if (!client) throw new PageError('no_account')
  if (!mcpAllowedFor(client.plan)) {
    throw new PageError('plan_required', { required_plan: MCP_MIN_PLAN, required_plan_label: PLAN_LABELS[MCP_MIN_PLAN], current_plan: client.plan ?? null, upgrade_url: UPGRADE_URL })
  }
  if (client.category === RESEARCH_CATEGORY) throw new PageError('account_unavailable')
  return client
}

/** Client and redirect, the two checks before the redirect is proven. */
async function proveClientAndRedirect(sb, clientId, redirectUri, opts) {
  if (typeof clientId !== 'string' || !clientId) throw new PageError('invalid_client')
  let client
  try {
    client = await o.resolveClient(sb, clientId, opts)
  } catch (e) {
    if (e instanceof o.OAuthError) throw new PageError(e.code === 'client_metadata_unavailable' ? 'client_metadata_unavailable' : 'invalid_client')
    throw e
  }
  if (typeof redirectUri !== 'string' || !o.redirectAllowed(redirectUri, client.redirect_uris)) throw new PageError('invalid_redirect_uri')
  return client
}

async function handle(event, opts = {}) {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response
  const headers = { ...auth.headers, 'Cache-Control': 'no-store' }
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })
  const page = (code, extra) => json(PAGE_STATUS[code] || 400, { ok: false, error: code, ...(extra || {}) })

  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' })
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : String(event.body || '')
  if (rawBody.length > MAX_BODY) return page('invalid_request')
  let body
  try { body = JSON.parse(rawBody || '{}') } catch { return page('invalid_request') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return page('invalid_request')

  const sb = opts.supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const now = (opts.now || (() => new Date()))()
  const nowIso = now.toISOString()
  const resolveOpts = { fetchImpl: opts.fetchImpl, now, cimdTimeoutMs: opts.cimdTimeoutMs, cimdMaxBytes: opts.cimdMaxBytes }
  const userId = auth.user && auth.user.id

  try {
    // ── check ───────────────────────────────────────────────────────────────
    if (body.action === 'check') {
      const p = {}
      for (const name of PARAMS) p[name] = param(body, name)

      // Before the redirect is proven: page errors only.
      const client = await proveClientAndRedirect(sb, p.client_id, p.redirect_uri, resolveOpts)
      const redirectUri = p.redirect_uri

      // After: errors go back to the redirect.
      const stateOk = p.state === undefined || (typeof p.state === 'string' && p.state.length <= MAX_STATE)
      const state = stateOk && typeof p.state === 'string' ? p.state : undefined
      const back = (error) => json(200, { ok: false, error, redirect: o.buildRedirect(redirectUri, { error, state }) })
      if (!stateOk) return back('invalid_request')
      if (p.response_type !== 'code') return back('unsupported_response_type')
      if (p.code_challenge_method !== 'S256' || !o.isValidChallenge(p.code_challenge)) return back('invalid_request')
      if (p.resource !== undefined && p.resource !== o.RESOURCE) return back('invalid_target')
      if (p.scope === false) return back('invalid_scope')
      const requested = o.parseRequestedScope(p.scope)

      const account = await accountFor(sb, auth.profile)

      const requestId = o.makeRequestId()
      const ins = await sb.from('oauth_codes').insert({
        request_id_hash: o.sha256Hex(requestId),
        code_hash: null,
        oauth_client_id: client.id,
        user_id: userId,
        client_id: Number(account.id),
        redirect_uri: redirectUri,
        code_challenge: p.code_challenge,
        scope_requested: o.scopeString(requested),
        scope_granted: null,
        resource: p.resource === undefined ? null : p.resource,
        state: state === undefined ? null : state,
        expires_at: o.isoAfter(now, o.PENDING_TTL_S),
      })
      if (ins.error) throw ins.error
      console.log(`[oauth-authorize] check ok: client ${account.id}, oauth client kind ${client.kind}, loopback ${o.isLoopbackRedirect(redirectUri)}`)
      return json(200, {
        ok: true,
        request_id: requestId,
        client_name: client.name,
        client_kind: client.kind,
        redirect_host: o.redirectHost(redirectUri),
        loopback: o.isLoopbackRedirect(redirectUri),
        brand_name: account.name || '',
        write_requested: requested.has(o.SCOPE_WRITE),
        offline_requested: requested.has(o.SCOPE_OFFLINE),
        expires_at: o.isoAfter(now, o.PENDING_TTL_S),
      })
    }

    // ── decide ──────────────────────────────────────────────────────────────
    if (body.action === 'decide') {
      if (typeof body.request_id !== 'string' || !o.REQUEST_ID_RE.test(body.request_id)) return page('request_expired')
      if (typeof body.allow !== 'boolean') return page('invalid_request')
      if (body.write !== undefined && body.write !== null && typeof body.write !== 'boolean') return page('invalid_request')
      const write = body.write === true

      const { data: row, error } = await sb.from('oauth_codes').select(PENDING_COLS).eq('request_id_hash', o.sha256Hex(body.request_id)).maybeSingle()
      if (error) throw error
      if (!row || row.user_id !== userId || row.code_hash !== null || row.used_at !== null || !o.isLive(row.expires_at, now)) return page('request_expired')

      // The same two checks as check, from the stored request only.
      await proveClientAndRedirect(sb, row.oauth_client_id, row.redirect_uri, resolveOpts)
      await accountFor(sb, auth.profile, row.client_id)

      const claim = (patch) => sb.from('oauth_codes').update(patch)
        .eq('id', row.id).eq('user_id', userId).is('code_hash', null).is('used_at', null).gt('expires_at', nowIso)
        .select('id')
      const state = row.state === null || row.state === undefined ? undefined : row.state

      if (!body.allow) {
        const c = await claim({ used_at: nowIso })
        if (c.error) throw c.error
        if (!c.data || c.data.length !== 1) return page('request_expired')
        console.log(`[oauth-authorize] decide deny: client ${row.client_id}`)
        return json(200, { ok: true, redirect: o.buildRedirect(row.redirect_uri, { error: 'access_denied', state }) })
      }

      const requested = o.parseRequestedScope(row.scope_requested)
      const scope = o.grantedScope(requested, write)
      const code = o.makeCode()
      const c = await claim({ code_hash: o.sha256Hex(code), scope_granted: scope, expires_at: o.isoAfter(now, o.CODE_TTL_S) })
      if (c.error) throw c.error
      if (!c.data || c.data.length !== 1) return page('request_expired')
      console.log(`[oauth-authorize] decide allow: client ${row.client_id}, scope ${scope}`)
      return json(200, { ok: true, redirect: o.buildRedirect(row.redirect_uri, { code, state }) })
    }

    return page('invalid_request')
  } catch (e) {
    if (e instanceof PageError) return page(e.code, e.extra)
    console.error(`[oauth-authorize] failed: ${scrub(e && e.message)}`)
    return page('server_error')
  }
}

/** Removes anything token- or hash-shaped from an error message before it is logged. */
function scrub(msg) {
  return String(msg || '').replace(/bg(mcp|mat|mrt|ocs)_\S*/gi, '[redacted]').replace(/[a-f0-9]{48,}/gi, '[redacted]')
}

exports.handler = (event) => handle(event)
exports.handle = handle
exports.PAGE_STATUS = PAGE_STATUS
