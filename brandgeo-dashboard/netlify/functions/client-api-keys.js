/**
 * client-api-keys.js -- list, issue and revoke a client's MCP API keys.
 * Contract: docs/arch/mcp-access.md section 7.1. Backend of the Account page
 * "MCP access" section.
 *
 * POST body, one of:
 *   { action: 'list', client_id }
 *     -> { keys: [{ id, key_prefix, label, created_at, last_used_at }], max_keys: 5, allowed, required_plan }
 *   { action: 'issue', client_id, label? }
 *     -> { key: { id, key_prefix, label, created_at }, secret: 'bgmcp_...' }   the secret is returned HERE ONLY
 *   { action: 'revoke', client_id, id }
 *     -> { ok: true, id }
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

const MAX_KEYS = 5
const MAX_LABEL = 60
const LIST_COLS = 'id, key_prefix, label, created_at, last_used_at'

/** Postgres 42P01 = undefined_table: the migration has not been applied. */
function isMissingTable(error) {
  return !!error && (error.code === '42P01' || /relation .*client_api_keys.* does not exist/i.test(error.message || ''))
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
  if (clientId === null) return json(400, { error: 'Missing or invalid client_id.' })

  const role = auth.profile && auth.profile.role
  const isAdmin = role === 'admin'
  const sb = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
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
    const { data, error } = await sb.from('client_api_keys').select(LIST_COLS)
      .eq('client_id', clientId).is('revoked_at', null)
      .order('created_at', { ascending: false })
    if (error) return fail('list', error)
    return json(200, {
      keys: (data || []).map((k) => ({ id: k.id, key_prefix: k.key_prefix, label: k.label, created_at: k.created_at, last_used_at: k.last_used_at ?? null })),
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
    const { data, error } = await sb.from('client_api_keys').insert({
      client_id: clientId,
      key_hash: hashClientApiKey(secret),
      key_prefix: clientApiKeyPrefix(secret),
      label,
      created_by: auth.user.id,
    }).select('id, key_prefix, label, created_at').single()
    if (error) return fail('issue', error)

    console.log(`[client-api-keys] issued key row ${data.id} for client ${clientId} by ${auth.user.id}`)
    return json(200, { key: { id: data.id, key_prefix: data.key_prefix, label: data.label, created_at: data.created_at }, secret })
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

  return json(400, { error: 'Unknown action.' })
}

exports.handler = (event) => handle(event)
exports.handle = handle
