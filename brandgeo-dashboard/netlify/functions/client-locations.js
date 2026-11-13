/**
 * client-locations.js - the server-side list of a client's locations
 * (docs/arch/multi-location-collection.md section 5.3).
 *
 * POST, one JSON object:
 *   list        {action:'list', client_id}                         -> {locations, limit, used}
 *   add         {action:'add', client_id, market_id, region_ids}   -> {added, limit, used}
 *   archive     {action:'archive', client_id, location_id}         -> {archived: true, location_id}
 *   set_primary {action:'set_primary', client_id, location_id}     -> {primary_id}   (admin only)
 * Errors from this function: {error, code}. Errors from requireAuth: {error}.
 *
 * Security shape:
 *   - client_id is parsed BEFORE requireAuth and passed to it, so a viewer of
 *     another client is answered 403 "Forbidden: client mismatch" (the Phase 1
 *     pattern of get-subscription.js).
 *   - every location id is used ONLY together with that authorised client_id:
 *     the four SQL functions take p_client_id and match (id, client_id), so a
 *     viewer of client A passing a location id of client B gets not_found and
 *     nothing changes.
 *   - the plan behind `limit` comes from one service-key read of clients.plan,
 *     never from the body.
 *   - the service key is used only here, server side; client_locations has no
 *     write policy, only the SECURITY DEFINER functions write it.
 */
const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { validatePair, locationLimitFor, LOCATION_COLUMNS } = require('./_locations')

// Owner question 3 of section 14, unanswered on 2026-11-13. Default: viewers
// may add and archive within their limit. This constant is the one place.
const VIEWER_MAY_EDIT_LOCATIONS = true

const MAX_REGION_IDS = 25
const PG_INT_MAX = 2147483647
const ACTIONS = new Set(['list', 'add', 'archive', 'set_primary'])

// client_events.type for the two audit rows this function writes. Step 7 of
// db/supabase-client-locations-2026-11-13.sql adds 'location_change' to the
// CHECK on client_events.type, inside the same transaction as the table. So
// once the migration is applied, a refused audit insert in the logs is a real
// fault to investigate, not an expected outcome. The audit row stays
// non-fatal: a refused insert is logged and the request still answers 200
// (as in resend-invite.js).
const EVENT_TYPE = 'location_change'

const MESSAGES = {
  invalid_request:        'The request is not valid.',
  invalid_location:       'That location is not in the market list.',
  location_limit_reached: 'Your plan has reached its location limit.',
  location_exists:        'That location is already in the list.',
  location_in_use:        'This location still has active prompts. Archive them first.',
  location_is_primary:    'The primary location cannot be archived.',
  not_found:              'Location not found.',
  forbidden:              'You are not allowed to do this.',
  server_error:           'Something went wrong. Please try again.',
}
const STATUS = {
  invalid_request: 400, invalid_location: 400, location_limit_reached: 403, location_exists: 409,
  location_in_use: 409, location_is_primary: 409, not_found: 404, forbidden: 403, server_error: 500,
}

function parseId(v) {
  let n = null
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^[1-9][0-9]*$/.test(v)) n = Number(v)
  return Number.isSafeInteger(n) && n > 0 && n <= PG_INT_MAX ? n : null
}

function json(statusCode, headers, obj) {
  return { statusCode, headers: headers || { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
}

function fail(headers, code) {
  return json(STATUS[code], headers, { error: MESSAGES[code], code })
}

function shape(row, activeByLocation) {
  return {
    id: Number(row.id),
    market_id: row.market_id,
    region_id: row.region_id,
    is_primary: !!row.is_primary,
    position: row.position ?? 0,
    archived_at: row.archived_at ?? null,
    active_prompts: (activeByLocation && activeByLocation.get(Number(row.id))) || 0,
  }
}

function sortLocations(list) {
  return list.slice().sort((a, b) =>
    (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1) ||
    ((a.position ?? 0) - (b.position ?? 0)) ||
    (a.id - b.id))
}

/** A Postgres error raised by one of the SQL functions, mapped to a code. */
function rpcErrorCode(error) {
  if (!error) return null
  const msg = String(error.message || '')
  if (/location_limit_reached/.test(msg)) return 'location_limit_reached'
  if (error.code === '23505' || /duplicate key/i.test(msg)) return 'location_exists'
  if (/client_not_found/.test(msg)) return 'not_found'
  return null
}

async function readPlan(supabase, clientId) {
  const { data, error } = await supabase.from('clients').select('plan').eq('id', clientId).maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, notFound: true }
  return { ok: true, plan: data.plan ?? null }
}

async function countLive(supabase, clientId) {
  const { count, error } = await supabase
    .from('client_locations')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .is('archived_at', null)
  if (error) return { ok: false, error: error.message }
  return { ok: true, used: count || 0 }
}

async function writeEvent(supabase, invId, row) {
  try {
    const { error } = await supabase.from('client_events').insert(row)
    if (error) console.error(`[ClientLocations/${invId}] audit row refused for client ${row.client_id}: ${error.message}`)
  } catch (e) {
    console.error(`[ClientLocations/${invId}] audit row threw for client ${row.client_id}: ${e && e.message}`)
  }
}

exports.handler = async (event) => {
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  // A CORS preflight goes to requireAuth, which answers it before any token
  // check. Everything else must be a POST.
  if (event.httpMethod === 'OPTIONS') {
    const pre = await requireAuth(event)
    return pre.response
  }
  if (event.httpMethod !== 'POST') return json(405, null, { error: 'Method Not Allowed', code: 'invalid_request' })

  // The body is parsed BEFORE auth so the target client is known when
  // requireAuth runs.
  let body
  try { body = JSON.parse(event.body || '') } catch { return fail(null, 'invalid_request') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(null, 'invalid_request')
  const clientId = parseId(body.client_id)
  if (clientId === null) return fail(null, 'invalid_request')

  const auth = await requireAuth(event, { clientId })
  if (auth.response) return auth.response
  const headers = auth.headers
  const isAdmin = auth.profile && auth.profile.role === 'admin'

  const action = body.action
  if (typeof action !== 'string' || !ACTIONS.has(action)) return fail(headers, 'invalid_request')

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    if (action === 'list') return await listAction(supabase, headers, invId, clientId)
    if (action === 'add') return await addAction(supabase, headers, invId, clientId, body, auth, isAdmin)
    if (action === 'archive') return await archiveAction(supabase, headers, invId, clientId, body, auth, isAdmin)
    return await setPrimaryAction(supabase, headers, invId, clientId, body, auth, isAdmin)
  } catch (e) {
    console.error(`[ClientLocations/${invId}] ${action} for client ${clientId} threw: ${e && e.message}`)
    return fail(headers, 'server_error')
  }
}

async function listAction(supabase, headers, invId, clientId) {
  // A client provisioned by Stripe or self signup may have no primary row yet;
  // this creates it from the clients defaults, so the list always has one.
  const ens = await supabase.rpc('ensure_primary_client_location', { p_client_id: clientId })
  if (ens.error) {
    const code = rpcErrorCode(ens.error)
    if (code === 'not_found') return fail(headers, 'not_found')
    console.error(`[ClientLocations/${invId}] ensure primary failed for client ${clientId}: ${ens.error.message}`)
    return fail(headers, 'server_error')
  }

  const plan = await readPlan(supabase, clientId)
  if (!plan.ok) {
    if (plan.notFound) return fail(headers, 'not_found')
    console.error(`[ClientLocations/${invId}] plan read failed for client ${clientId}: ${plan.error}`)
    return fail(headers, 'server_error')
  }

  const { data: rows, error: rowsErr } = await supabase
    .from('client_locations')
    .select(LOCATION_COLUMNS)
    .eq('client_id', clientId)
    .is('archived_at', null)
  if (rowsErr) {
    console.error(`[ClientLocations/${invId}] list read failed for client ${clientId}: ${rowsErr.message}`)
    return fail(headers, 'server_error')
  }

  // One read of the client's active prompts, counted per location here. The
  // prompt cap bounds it (at most a few hundred rows).
  const { data: prompts, error: pErr } = await supabase
    .from('prompts')
    .select('location_id')
    .eq('client_id', clientId)
    .eq('is_active', true)
  if (pErr) {
    console.error(`[ClientLocations/${invId}] prompt count read failed for client ${clientId}: ${pErr.message}`)
    return fail(headers, 'server_error')
  }
  const active = new Map()
  for (const p of prompts || []) {
    if (p.location_id == null) continue
    const k = Number(p.location_id)
    active.set(k, (active.get(k) || 0) + 1)
  }

  const locations = sortLocations((rows || []).map((r) => shape(r, active)))
  return json(200, headers, { locations, limit: locationLimitFor(plan.plan), used: locations.length })
}

async function addAction(supabase, headers, invId, clientId, body, auth, isAdmin) {
  if (!isAdmin && !VIEWER_MAY_EDIT_LOCATIONS) return fail(headers, 'forbidden')

  const regionIds = body.region_ids
  if (!Array.isArray(regionIds) || regionIds.length < 1 || regionIds.length > MAX_REGION_IDS) return fail(headers, 'invalid_request')
  if (!regionIds.every((r) => typeof r === 'string' && r.length > 0)) return fail(headers, 'invalid_request')
  if (new Set(regionIds).size !== regionIds.length) return fail(headers, 'invalid_request')
  if (typeof body.market_id !== 'string') return fail(headers, 'invalid_location')
  if (regionIds.includes('ALL') && regionIds.length > 1) return fail(headers, 'invalid_location')
  const pairs = []
  for (const r of regionIds) {
    const v = validatePair(body.market_id, r)
    if (!v.ok) return fail(headers, 'invalid_location')
    pairs.push({ market_id: v.market_id, region_id: v.region_id })
  }

  const plan = await readPlan(supabase, clientId)
  if (!plan.ok) {
    if (plan.notFound) return fail(headers, 'not_found')
    console.error(`[ClientLocations/${invId}] plan read failed for client ${clientId}: ${plan.error}`)
    return fail(headers, 'server_error')
  }
  const limit = locationLimitFor(plan.plan)

  // An admin passes no limit (an admin may exceed it, like the prompt cap's
  // admin bypass); the override is recorded below. A viewer's limit is
  // enforced atomically inside add_client_locations under a per-client lock.
  const { data: added, error: addErr } = await supabase.rpc('add_client_locations', {
    p_client_id: clientId,
    p_pairs: pairs,
    p_limit: isAdmin ? null : limit,
    p_created_by: auth.user && auth.user.id ? auth.user.id : null,
  })
  if (addErr) {
    const code = rpcErrorCode(addErr)
    if (code) {
      console.warn(`[ClientLocations/${invId}] add for client ${clientId} refused: ${code}`)
      return fail(headers, code)
    }
    console.error(`[ClientLocations/${invId}] add failed for client ${clientId}: ${addErr.message}`)
    return fail(headers, 'server_error')
  }

  const live = await countLive(supabase, clientId)
  if (!live.ok) {
    console.error(`[ClientLocations/${invId}] count read failed for client ${clientId} after add: ${live.error}`)
    return fail(headers, 'server_error')
  }

  if (isAdmin) {
    await writeEvent(supabase, invId, {
      client_id: clientId,
      actor: auth.user.id,
      type: EVENT_TYPE,
      meta: {
        action: 'add',
        by: 'admin',
        // true only when this add took the client past its plan limit, so a
        // count of overrides in client_events is not inflated by ordinary adds.
        limit_override: live.used > limit,
        over_limit: live.used > limit,
        limit,
        used_after: live.used,
        pairs,
      },
    })
  }

  const rows = Array.isArray(added) ? added : (added ? [added] : [])
  console.log(`[ClientLocations/${invId}] client ${clientId}: ${rows.length} location(s) added by ${isAdmin ? 'admin' : 'viewer'}, ${live.used} of ${limit} used`)
  return json(200, headers, { added: rows.map((r) => shape(r, null)), limit, used: live.used })
}

async function archiveAction(supabase, headers, invId, clientId, body, auth, isAdmin) {
  if (!isAdmin && !VIEWER_MAY_EDIT_LOCATIONS) return fail(headers, 'forbidden')
  const locationId = parseId(body.location_id)
  if (locationId === null) return fail(headers, 'invalid_request')

  const { data: outcome, error } = await supabase.rpc('archive_client_location', { p_client_id: clientId, p_location_id: locationId })
  if (error) {
    console.error(`[ClientLocations/${invId}] archive failed for client ${clientId} location ${locationId}: ${error.message}`)
    return fail(headers, 'server_error')
  }
  if (outcome === 'archived' || outcome === 'already_archived') {
    console.log(`[ClientLocations/${invId}] client ${clientId}: location ${locationId} ${outcome}`)
    return json(200, headers, { archived: true, location_id: locationId })
  }
  if (outcome === 'not_found' || outcome === 'location_in_use' || outcome === 'location_is_primary') return fail(headers, outcome)
  console.error(`[ClientLocations/${invId}] archive for client ${clientId} location ${locationId} returned an unknown outcome: ${String(outcome)}`)
  return fail(headers, 'server_error')
}

async function setPrimaryAction(supabase, headers, invId, clientId, body, auth, isAdmin) {
  if (!isAdmin) return fail(headers, 'forbidden')
  const locationId = parseId(body.location_id)
  if (locationId === null) return fail(headers, 'invalid_request')

  // The old primary, read before the move, for the audit row.
  const { data: before } = await supabase
    .from('client_locations')
    .select(LOCATION_COLUMNS)
    .eq('client_id', clientId)
    .eq('is_primary', true)
    .is('archived_at', null)
    .maybeSingle()

  const { data: outcome, error } = await supabase.rpc('set_primary_client_location', { p_client_id: clientId, p_location_id: locationId })
  if (error) {
    console.error(`[ClientLocations/${invId}] set_primary failed for client ${clientId} location ${locationId}: ${error.message}`)
    return fail(headers, 'server_error')
  }
  if (outcome === 'already_primary') return json(200, headers, { primary_id: locationId })
  if (outcome === 'not_found') return fail(headers, 'not_found')
  if (outcome !== 'primary_set') {
    console.error(`[ClientLocations/${invId}] set_primary for client ${clientId} returned an unknown outcome: ${String(outcome)}`)
    return fail(headers, 'server_error')
  }

  const { data: after } = await supabase
    .from('client_locations')
    .select(LOCATION_COLUMNS)
    .eq('client_id', clientId)
    .eq('id', locationId)
    .maybeSingle()
  await writeEvent(supabase, invId, {
    client_id: clientId,
    actor: auth.user.id,
    type: EVENT_TYPE,
    meta: {
      action: 'set_primary',
      from: before ? { id: Number(before.id), market_id: before.market_id, region_id: before.region_id } : null,
      to: after ? { id: Number(after.id), market_id: after.market_id, region_id: after.region_id } : { id: locationId },
    },
  })
  console.log(`[ClientLocations/${invId}] client ${clientId}: primary moved to location ${locationId}`)
  return json(200, headers, { primary_id: locationId })
}

exports.VIEWER_MAY_EDIT_LOCATIONS = VIEWER_MAY_EDIT_LOCATIONS
exports.EVENT_TYPE = EVENT_TYPE
