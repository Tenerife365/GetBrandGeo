/**
 * client-api-keys.js -- list, issue and revoke a client's MCP API keys.
 * Contract: docs/arch/mcp-access.md section 7.1, plus the write scope of
 * docs/arch/mcp-stage2-fixes.md section 9.3. Backend of the Account page
 * "MCP access" section.
 *
 * POST body, one of:
 *   { action: 'list', client_id }
 *     -> { keys: [{ id, key_prefix, label, scope, created_at, last_used_at }], max_keys: 5, allowed, required_plan }
 *   { action: 'issue', client_id, label?, scope? }
 *     -> { key: { id, key_prefix, label, scope, created_at }, secret: 'bgmcp_...' }   the secret is returned HERE ONLY
 *
 * SCOPE. 'read' (the default when absent) or 'read_write'; anything else is
 * 400 "Scope must be read or read_write.". read_write lets an agent call the
 * MCP write tool mark_fix_done. A key's scope never changes after issue: a
 * different scope means a new key. Every key row in list and issue carries it.
 * Until db/supabase-mcp-fix-writes-2026-11-06.sql is applied the column does
 * not exist: list reports every key as read, a read key is still issued, and a
 * read_write issue answers 503 "Read and write keys are not available yet.".
 *   { action: 'revoke', client_id, id }
 *     -> { ok: true, id }
 *
 * MCP stage 3 (docs/arch/mcp-stage3-oauth.md sections 6.1, 7 item 8, 11):
 *   { action: 'list_grants', client_id }
 *     -> { grants: [{ id, client_name, redirect_host, access, created_at, last_used_at }], available }
 *        live grants only (not revoked, not expired); not plan gated, like list.
 *   { action: 'revoke_grant', client_id, id }
 *     -> { ok: true, id }   the grant's revoked_at is the authority (mcp-server
 *        and the token endpoint read it on every use); its live tokens are
 *        revoked right after for the record. Same owner checks as revoke.
 *   { action: 'create_anthropic_client', name? }   ADMIN ONLY, no client_id
 *     -> { client: { id, name, redirect_uris, created_at }, client_secret }
 *        a confidential OAuth client whose only redirect is
 *        https://claude.ai/api/mcp/auth_callback. The secret is returned HERE
 *        ONLY and stored as sha256. Constantin runs it and pastes id and
 *        secret into the Claude directory portal; agents never run it.
 *
 * AUTH. requireAuth({ clientId: body.client_id }): admins act on any client,
 * viewers only on their own. Every write uses the service-role client.
 *
 * GATES. issue: mcpAllowedFor(plan) (403 below the gate), research clients
 * refused unless the caller is an admin (403), 5 active keys max (409), label
 * at most 60 characters (400). list and revoke are NOT plan gated, so a
 * downgraded client can still see and revoke old keys.
 *
 * SECRETS. The key exists only in the memory of the issue call and in its one
 * response. key_hash is never selected for output. Nothing here logs the key,
 * its prefix or its hash.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { RESEARCH_CATEGORY } = require('./_cost')
const { MCP_MIN_PLAN, PLAN_LABELS, mcpAllowedFor } = require('./_plans')
const { makeClientApiKey, hashClientApiKey, clientApiKeyPrefix } = require('./_client_api_key')
const oauth = require('./_oauth')

const GRANT_LIST_COLS = 'id, client_name, redirect_host, scope, created_at, last_used_at, expires_at'
const MAX_CLIENT_NAME = 60

const MAX_KEYS = 5
const MAX_LABEL = 60
const LIST_COLS = 'id, key_prefix, label, scope, created_at, last_used_at'
const LIST_COLS_NO_SCOPE = 'id, key_prefix, label, created_at, last_used_at'
const SCOPES = ['read', 'read_write']
const DEFAULT_SCOPE = 'read'

/** The stored scope as the API reports it; anything unexpected reads as read only. */
function scopeOf(v) { return v === 'read_write' ? 'read_write' : 'read' }

/** Postgres 42P01 = undefined_table: the migration has not been applied. */
function isMissingTable(error, table = 'client_api_keys') {
  return !!error && (error.code === '42P01' || new RegExp(`relation .*${table}.* does not exist`, 'i').test(error.message || ''))
}

/**
 * The scope column is missing: db/supabase-mcp-fix-writes-2026-11-06.sql is
 * not applied yet. A select names it 42703; an insert gets PostgREST's
 * PGRST204 (column not in the schema cache).
 */
function isMissingScope(error) {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  return /column .*scope.* does not exist|could not find the 'scope' column/i.test(error.message || '')
}

function parseClientId(v) {
  const n = typeof v === 'string' && /^[0-9]+$/.test(v) ? Number(v) : v
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

async function handle(event, { supabase = null, now = () => new Date() } = {}) {
  // Body first, so the ownership check in requireAuth sees the target client.
  let body = null
  try { body = JSON.parse(event.body || '{}') } catch { body = null }
  const rawClientId = body && typeof body === 'object' ? body.client_id : undefined
  const clientId = parseClientId(rawClientId)

  // A missing or malformed client_id is passed through as null ONLY to get the
  // CORS headers; the request is refused right after auth, before any read.
  const auth = await requireAuth(event, { clientId: clientId === null ? null : clientId })
  if (auth.response) return auth.response
  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { error: 'Invalid JSON' })

  const role = auth.profile && auth.profile.role
  const isAdmin = role === 'admin'
  const sb = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // ── create_anthropic_client (admin only, not tied to a BrandGEO client) ────
  if (body.action === 'create_anthropic_client') {
    if (!isAdmin) return json(403, { error: 'Forbidden: admin access required' })
    if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') return json(400, { error: 'Name must be text.' })
    const name = oauth.cleanClientName(typeof body.name === 'string' ? body.name : '') || 'Claude'
    if (typeof body.name === 'string' && body.name.trim().length > MAX_CLIENT_NAME) return json(400, { error: `Name must be ${MAX_CLIENT_NAME} characters or fewer.` })
    const id = oauth.makeConfidentialClientId()
    const secret = oauth.makeClientSecret()
    const { data, error } = await sb.from('oauth_clients').insert({
      id,
      kind: 'confidential',
      name,
      redirect_uris: [oauth.ANTHROPIC_REDIRECT_URI],
      secret_hash: oauth.sha256Hex(secret),
      metadata: null,
      fetched_at: null,
    }).select('id, name, redirect_uris, created_at').single()
    if (error) {
      if (isMissingTable(error, 'oauth_clients')) {
        console.log('[client-api-keys] oauth_clients table missing; migration not applied yet')
        return json(503, { error: 'OAuth clients are not available yet.' })
      }
      console.error(`[client-api-keys] create_anthropic_client failed: ${error.message}`)
      return json(500, { error: 'Could not create the OAuth client.' })
    }
    console.log(`[client-api-keys] created confidential OAuth client ${data.id} by ${auth.user.id}`)
    return json(200, { client: { id: data.id, name: data.name, redirect_uris: data.redirect_uris, created_at: data.created_at }, client_secret: secret })
  }

  if (clientId === null) return json(400, { error: 'Missing or invalid client_id.' })
  const unavailable = () => json(503, { error: 'MCP keys are not available yet.' })
  const fail = (what, error) => {
    if (isMissingTable(error)) {
      console.log('[client-api-keys] client_api_keys table missing; migration not applied yet')
      return unavailable()
    }
    console.error(`[client-api-keys] ${what} failed for client ${clientId}: ${error && error.message}`)
    return json(500, { error: `Could not ${what} MCP keys.` })
  }

  const loadClient = async () => {
    const { data, error } = await sb.from('clients').select('id, plan, category').eq('id', clientId).maybeSingle()
    return { client: data, error }
  }

  // ── list ──────────────────────────────────────────────────────────────────
  if (body.action === 'list') {
    const { client, error: cErr } = await loadClient()
    if (cErr) return fail('list', cErr)
    if (!client) return json(404, { error: 'Client not found.' })
    const listKeys = (cols) => sb.from('client_api_keys').select(cols)
      .eq('client_id', clientId).is('revoked_at', null)
      .order('created_at', { ascending: false })
    let { data, error } = await listKeys(LIST_COLS)
    // Before the scope migration every key is read only; the list still answers.
    if (error && isMissingScope(error)) {
      console.log('[client-api-keys] client_api_keys.scope missing; migration not applied yet, keys listed as read')
      ;({ data, error } = await listKeys(LIST_COLS_NO_SCOPE))
    }
    if (error) return fail('list', error)
    return json(200, {
      keys: (data || []).map((k) => ({ id: k.id, key_prefix: k.key_prefix, label: k.label, scope: scopeOf(k.scope), created_at: k.created_at, last_used_at: k.last_used_at ?? null })),
      max_keys: MAX_KEYS,
      allowed: mcpAllowedFor(client.plan),
      required_plan: MCP_MIN_PLAN,
    })
  }

  // ── issue ─────────────────────────────────────────────────────────────────
  if (body.action === 'issue') {
    if (body.label !== undefined && body.label !== null && typeof body.label !== 'string') {
      return json(400, { error: 'Label must be text.' })
    }
    let label = typeof body.label === 'string' ? body.label.trim() : ''
    if (label.length > MAX_LABEL) return json(400, { error: `Label must be ${MAX_LABEL} characters or fewer.` })
    const scope = body.scope === undefined || body.scope === null ? DEFAULT_SCOPE : body.scope
    if (!SCOPES.includes(scope)) return json(400, { error: 'Scope must be read or read_write.' })

    const { client, error: cErr } = await loadClient()
    if (cErr) return fail('issue', cErr)
    if (!client) return json(404, { error: 'Client not found.' })
    if (!mcpAllowedFor(client.plan)) {
      return json(403, { error: `MCP access needs the ${PLAN_LABELS[MCP_MIN_PLAN]} plan or higher.`, required_plan: MCP_MIN_PLAN })
    }
    if (client.category === RESEARCH_CATEGORY && !isAdmin) {
      return json(403, { error: 'MCP keys for this account can only be issued by BrandGEO.' })
    }

    const { count, error: nErr } = await sb.from('client_api_keys').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).is('revoked_at', null)
    if (nErr) return fail('issue', nErr)
    // Not atomic with the insert: two simultaneous issues can create a sixth key. Accepted (7.1).
    if ((count || 0) >= MAX_KEYS) return json(409, { error: 'Revoke a key to issue a new one.', max_keys: MAX_KEYS })
    if (!label) label = `Key ${(count || 0) + 1}`

    const secret = makeClientApiKey(clientId)
    const keyRow = {
      client_id: clientId,
      key_hash: hashClientApiKey(secret),
      key_prefix: clientApiKeyPrefix(secret),
      label,
      created_by: auth.user.id,
    }
    let { data, error } = await sb.from('client_api_keys').insert({ ...keyRow, scope })
      .select('id, key_prefix, label, scope, created_at').single()
    if (error && isMissingScope(error)) {
      // Before the scope migration only a read key can exist. Nothing was
      // inserted (the statement failed as a whole), so the retry is the only row.
      if (scope !== 'read') {
        console.log('[client-api-keys] client_api_keys.scope missing; a read_write key cannot be issued yet')
        return json(503, { error: 'Read and write keys are not available yet.' })
      }
      ;({ data, error } = await sb.from('client_api_keys').insert(keyRow)
        .select('id, key_prefix, label, created_at').single())
    }
    if (error) return fail('issue', error)

    console.log(`[client-api-keys] issued key row ${data.id} (${scopeOf(data.scope)}) for client ${clientId} by ${auth.user.id}`)
    return json(200, { key: { id: data.id, key_prefix: data.key_prefix, label: data.label, scope: scopeOf(data.scope), created_at: data.created_at }, secret })
  }

  // ── revoke ────────────────────────────────────────────────────────────────
  if (body.action === 'revoke') {
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json(404, { error: 'No active key with that id.' })
    const { data, error } = await sb.from('client_api_keys')
      .update({ revoked_at: now().toISOString() })
      .eq('id', id).eq('client_id', clientId).is('revoked_at', null)
      .select('id')
    if (error) return fail('revoke', error)
    if (!data || data.length === 0) return json(404, { error: 'No active key with that id.' })
    console.log(`[client-api-keys] revoked key row ${id} for client ${clientId} by ${auth.user.id}`)
    return json(200, { ok: true, id })
  }

  // ── list_grants (stage 3, Connected apps) ─────────────────────────────────
  if (body.action === 'list_grants') {
    const { client, error: cErr } = await loadClient()
    if (cErr) return fail('list', cErr)
    if (!client) return json(404, { error: 'Client not found.' })
    const { data, error } = await sb.from('oauth_grants').select(GRANT_LIST_COLS)
      .eq('client_id', clientId).is('revoked_at', null)
      .order('created_at', { ascending: false })
    if (error) {
      // Before db/supabase-mcp-oauth-2026-11-06.sql: nothing can be connected yet.
      if (isMissingTable(error, 'oauth_grants')) {
        console.log('[client-api-keys] oauth_grants table missing; migration not applied yet')
        return json(200, { grants: [], available: false })
      }
      console.error(`[client-api-keys] list_grants failed for client ${clientId}: ${error.message}`)
      return json(500, { error: 'Could not list connected apps.' })
    }
    const nowMs = now().getTime()
    const live = (data || []).filter((g) => g.expires_at && Date.parse(g.expires_at) > nowMs)
    return json(200, {
      grants: live.map((g) => ({
        id: g.id,
        client_name: g.client_name || '',
        redirect_host: g.redirect_host || '',
        access: oauth.hasScope(g.scope, oauth.SCOPE_WRITE) ? 'read_write' : 'read',
        created_at: g.created_at,
        last_used_at: g.last_used_at ?? null,
      })),
      available: true,
    })
  }

  // ── revoke_grant (stage 3, Disconnect) ────────────────────────────────────
  if (body.action === 'revoke_grant') {
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json(404, { error: 'No connected app with that id.' })
    const nowIso = now().toISOString()
    // The grant row is the authority; the token update below is for the record.
    const { data, error } = await sb.from('oauth_grants')
      .update({ revoked_at: nowIso })
      .eq('id', id).eq('client_id', clientId).is('revoked_at', null)
      .select('id')
    if (error) {
      if (isMissingTable(error, 'oauth_grants')) return json(404, { error: 'No connected app with that id.' })
      console.error(`[client-api-keys] revoke_grant failed for client ${clientId}: ${error.message}`)
      return json(500, { error: 'Could not disconnect the app.' })
    }
    if (!data || data.length === 0) return json(404, { error: 'No connected app with that id.' })
    const t = await sb.from('oauth_tokens').update({ revoked_at: nowIso }).eq('grant_id', id).is('revoked_at', null)
    if (t && t.error) console.error(`[client-api-keys] token revoke after grant ${id} failed for client ${clientId}: ${t.error.message}`)
    console.log(`[client-api-keys] revoked grant ${id} for client ${clientId} by ${auth.user.id}`)
    return json(200, { ok: true, id })
  }

  return json(400, { error: 'Unknown action.' })
}

exports.handler = (event) => handle(event)
exports.handle = handle
