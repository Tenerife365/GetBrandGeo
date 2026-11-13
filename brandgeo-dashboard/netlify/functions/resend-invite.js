/**
 * resend-invite.js
 * Pending invites: lists the viewer logins and whether each accepted its
 * invite, and re-sends the invite to one that did not.
 * Admin only. Requires SUPABASE_SERVICE_KEY.
 *
 * Two channels (docs/arch/invite-link-7-days.md, 2026-11-13):
 *   - BrandGEO channel, for viewer logins: our own token, emailed through
 *     Resend by _invite_link.js deliverInvite. The link lives 7 days.
 *   - Supabase channel, everything else and every fallback: Supabase's own
 *     invite email. Its link lives 24 hours (the project's "Email OTP
 *     expiration" is 86400 s, owner statement 2026-11-13).
 * An earlier version of this comment said invite links expire after about one
 * hour; that was wrong. On 2026-11-11 ten leads were invited and none
 * completed, which is why the list exists.
 *
 * POST bodies (contract fixed with the frontend, 2026-11-11, extended
 * 2026-11-13; every addition is additive):
 *
 *   { action: 'list' }
 *     -> { invites: [...], counts: { total, pending, accepted }, link_ttl_minutes, invite_link_days }
 *     One entry per user_profiles row with role 'viewer' and a client_id.
 *     status: 'pending' | 'accepted' | 'not_invited' | 'missing_user'.
 *     Per entry also link_channel ('brandgeo' | 'supabase' | 'unknown'),
 *     link_expires_at and link_last_pressed_at. link_ttl_minutes now means
 *     the Supabase channel only.
 *
 *   { action: 'resend', user_id?: uuid, client_id?: int, delivery?: 'email' | 'copy' }
 *     -> { ok, user_id, client_id, email, invited_at, audit_logged, channel,
 *          delivery, link_expires_at, previous_link_revoked?, invite_url? }
 *     user_id is the key; client_id alone resolves the one pending viewer of
 *     that client; both together must agree. delivery 'copy' sends no email
 *     and returns the 7 day link once as invite_url (Cache-Control: no-store).
 *
 *   { email }  (legacy, no action; the Onboard wizard's last step)
 *     -> same body as resend. Any role. Resolved against EXISTING auth users
 *     only, so it can never create one. Email delivery only.
 *
 * Why the checks before the send: inviteUserByEmail CREATES a user for an
 * address GoTrue does not know. The old version of this function passed
 * whatever address it was given, so a typo would have created an orphan auth
 * user with no user_profiles row and emailed a stranger. Now the address is
 * always the one stored on an auth user we resolved ourselves, and the send is
 * refused unless that user has a profile, a client, an invite on record and no
 * acceptance. A race guard rolls back a user created between the check and
 * the call (see sendInvite).
 *
 * Errors: { error: '<sentence for an admin>', code } with codes bad_request,
 * not_found, already_accepted, not_invited, ambiguous, rate_limited,
 * invite_failed, read_failed, orphan_created, busy, link_unavailable. No error
 * sentence echoes an email address taken from the request body.
 *
 * Added 2026-07-09 (onboarding-gaps pass); list, guards and audit added
 * 2026-11-11 (pending invites); the 7 day link added 2026-11-13.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { isAccepted, deliverInvite, INVITE_LINK_DAYS } = require('./_invite_link')

// Supabase email link lifetime, the project's "Email OTP expiration": 86400 s
// (owner statement, 2026-11-13). Nothing reads the real value from Supabase,
// because reading it needs the Management API and a token this work must not
// ask for. INVITE_LINK_TTL_MINUTES stays an optional override; if the owner
// ever changes the Supabase setting, the override must follow it.
const SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440

// Race guard (docs/arch/invite-link-7-days.md section 4): a user GoTrue
// created during this request is removed only when its created_at parses, is
// no older than the request start minus this window, and it has no profile.
const RACE_WINDOW_MS = 60 * 1000

function linkTtlMinutes() {
  const n = Number(process.env.INVITE_LINK_TTL_MINUTES)
  return Number.isInteger(n) && n > 0 ? n : SUPABASE_EMAIL_LINK_TTL_MINUTES
}

/** invited_at plus the Supabase link lifetime, or null when it does not parse. */
function supabaseLinkExpiry(invitedAt) {
  const t = Date.parse(invitedAt || '')
  return Number.isFinite(t) ? new Date(t + linkTtlMinutes() * 60 * 1000).toISOString() : null
}

// One paged pass over auth.users. perPage 1000 is the GoTrue maximum; the page
// cap bounds the loop at 20,000 users so it can never spin forever. Exported
// so the test can shrink both; nothing else writes it.
const PAGING = { perPage: 1000, maxPages: 20 }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const INT4_MAX = 2147483647

/** A uuid string, lower-cased, or null. Anything else (number, array) is null. */
function parseUuid(v) {
  return typeof v === 'string' && UUID_RE.test(v) ? v.toLowerCase() : null
}

/**
 * A positive int4, or null. Accepts an integer number or a plain digit string
 * with no leading zero; rejects true, [1], "1e0", " 1 ", "01", 0, 1.5.
 */
function parsePositiveInt(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v > 0 && v <= INT4_MAX ? v : null
  if (typeof v === 'string' && /^[1-9][0-9]{0,9}$/.test(v)) {
    const n = Number(v)
    return n <= INT4_MAX ? n : null
  }
  return null
}

/** status of one profile given its auth user (or null). */
function inviteStatus(u) {
  if (!u) return 'missing_user'
  if (isAccepted(u)) return 'accepted'
  return u.invited_at ? 'pending' : 'not_invited'
}

class ReadError extends Error {
  constructor(code, cause) { super(cause && cause.message ? cause.message : String(cause)); this.code = code }
}

/**
 * Every auth user, keyed by id, in one paged pass.
 * -> { byId: Map, truncated: boolean, pages: number }
 */
async function loadAuthUsers(supabase) {
  const byId = new Map()
  const { perPage, maxPages } = PAGING
  let pages = 0
  let truncated = false
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    pages++
    if (error) throw new ReadError('auth_users', error)
    const users = (data && data.users) || []
    for (const u of users) if (u && u.id) byId.set(u.id, u)
    if (users.length < perPage) return { byId, truncated, pages }
    if (page === maxPages) truncated = true
  }
  console.error(`[resend-invite] auth user listing hit the page cap (${maxPages} pages of ${perPage}); profiles beyond it read as missing_user`)
  return { byId, truncated, pages }
}

/** One auth user by id, or null when GoTrue says it does not exist. */
async function getAuthUser(supabase, id) {
  const { data, error } = await supabase.auth.admin.getUserById(id)
  if (error) {
    if (error.status === 404 || /not.?found/i.test(error.message || '')) return null
    throw new ReadError('auth_user', error)
  }
  return (data && data.user) || null
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })
  const fail = (statusCode, code, error) => json(statusCode, { error, code })
  const readFailed = (where, err) => {
    console.error(`[resend-invite] read_failed at ${where}:`, err && err.message)
    return fail(500, 'read_failed', 'Could not read the invite records. Check the function logs and try again.')
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers, body: 'Invalid JSON' } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'bad_request', 'The request body must be a JSON object.')
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    if (body.action === 'list') return await listInvites(supabase, json, readFailed)

    if (body.action === 'resend') {
      const delivery = body.delivery === undefined ? 'email' : body.delivery
      if (delivery !== 'email' && delivery !== 'copy') return fail(400, 'bad_request', 'delivery must be "email" or "copy".')
      const hasUser = body.user_id !== undefined && body.user_id !== null
      const hasClient = body.client_id !== undefined && body.client_id !== null
      if (!hasUser && !hasClient) return fail(400, 'bad_request', 'Send user_id, or client_id, of the invite to resend.')
      const userId = hasUser ? parseUuid(body.user_id) : null
      if (hasUser && !userId) return fail(400, 'bad_request', 'user_id must be a uuid.')
      const clientId = hasClient ? parsePositiveInt(body.client_id) : null
      if (hasClient && !clientId) return fail(400, 'bad_request', 'client_id must be a positive whole number.')
      if (userId) return await resendByUserId(supabase, auth, json, fail, userId, clientId, delivery)
      return await resendByClientId(supabase, auth, json, fail, clientId, delivery)
    }

    if (body.action !== undefined) return fail(400, 'bad_request', 'Unknown action. Use "list" or "resend".')

    // Legacy form: { email }. Email delivery only: a copied link is offered
    // from the panel rows (user_id or client_id), never for a typed address.
    if (body.delivery !== undefined && body.delivery !== 'email') {
      return fail(400, 'bad_request', 'Copy link needs user_id or client_id, not an email address.')
    }
    const raw = body.email
    if (typeof raw !== 'string' || !raw.trim()) return fail(400, 'bad_request', 'Missing required field: email.')
    const wanted = raw.trim().toLowerCase()
    if (wanted.length > 320 || !wanted.includes('@')) return fail(400, 'bad_request', 'That is not a valid email address.')
    return await resendByEmail(supabase, auth, json, fail, wanted)
  } catch (err) {
    if (err instanceof ReadError) return readFailed(err.code, err)
    console.error('[resend-invite] unexpected error:', err && err.message)
    return readFailed('unexpected', err)
  }
}

// ── list ───────────────────────────────────────────────────────────────────

/**
 * The active 7 day link rows (neither revoked nor accepted, expired ones
 * included), keyed by user id, newest first wins. -> Map | null on a read error.
 * Reads every active row and keeps the listed viewers in memory: at most one
 * active row exists per user, and no id list goes into a URL.
 */
async function loadActiveLinks(supabase, viewerIds) {
  const wanted = new Set(viewerIds.map(String))
  const byUser = new Map()
  if (!wanted.size) return byUser
  let res
  try {
    res = await supabase.from('client_invite_links')
      .select('id, user_id, created_at, expires_at, last_redeemed_at')
      .is('revoked_at', null).is('accepted_at', null)
  } catch (e) {
    console.error('[resend-invite] invite link read threw; link state unknown')
    return null
  }
  if (res.error) {
    console.error(`[resend-invite] invite link read failed (${res.error.code || res.error.status || 'n/a'}); link state unknown`)
    return null
  }
  for (const r of res.data || []) {
    const key = String(r.user_id)
    if (!wanted.has(key)) continue
    const prev = byUser.get(key)
    if (!prev || String(r.created_at) > String(prev.created_at)) byUser.set(key, r)
  }
  return byUser
}

async function listInvites(supabase, json, readFailed) {
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles').select('id, client_id, role').eq('role', 'viewer')
  if (profErr) return readFailed('user_profiles', profErr)
  const viewers = (profiles || []).filter((p) => p.client_id !== null && p.client_id !== undefined)

  const clientIds = Array.from(new Set(viewers.map((p) => p.client_id)))
  const clients = new Map()
  if (clientIds.length) {
    const { data: rows, error: cErr } = await supabase
      .from('clients').select('id, name, plan, category').in('id', clientIds)
    if (cErr) return readFailed('clients', cErr)
    for (const c of rows || []) clients.set(String(c.id), c)
  }

  const { byId, truncated, pages } = await loadAuthUsers(supabase)
  const links = await loadActiveLinks(supabase, viewers.map((p) => p.id))

  const invites = viewers.map((p) => {
    const u = byId.get(p.id) || null
    const c = clients.get(String(p.client_id)) || null
    const status = inviteStatus(u)
    let invitedAt = u ? (u.invited_at ?? null) : null
    let linkChannel = 'unknown'
    let linkExpiresAt = null
    let linkLastPressedAt = null
    if (links) {
      const row = links.get(String(p.id))
      if (row) {
        // GoTrue moves invited_at at every mint and every rotation, so with
        // an active row the row's own send time and expiry win.
        linkChannel = 'brandgeo'
        linkExpiresAt = row.expires_at ?? null
        linkLastPressedAt = row.last_redeemed_at ?? null
        invitedAt = row.created_at ?? invitedAt
      } else {
        linkChannel = 'supabase'
        linkExpiresAt = supabaseLinkExpiry(invitedAt)
      }
    }
    return {
      user_id: p.id,
      client_id: p.client_id,
      client_name: c ? (c.name ?? null) : null,
      plan: c ? (c.plan ?? null) : null,
      category: c ? (c.category ?? null) : null,
      email: u ? (u.email ?? null) : null,
      role: p.role,
      first_invited_at: u ? (u.created_at ?? null) : null,
      invited_at: invitedAt,
      accepted: status === 'accepted',
      accepted_at: u ? (u.email_confirmed_at || u.last_sign_in_at || null) : null,
      status,
      link_channel: linkChannel,
      link_expires_at: linkExpiresAt,
      link_last_pressed_at: linkLastPressedAt,
    }
  })

  invites.sort((a, b) => {
    const pa = a.status === 'pending' ? 0 : 1
    const pb = b.status === 'pending' ? 0 : 1
    if (pa !== pb) return pa - pb
    if (a.invited_at !== b.invited_at) {
      if (!a.invited_at) return 1
      if (!b.invited_at) return -1
      return a.invited_at < b.invited_at ? 1 : -1
    }
    return String(a.user_id) < String(b.user_id) ? -1 : 1
  })

  const counts = {
    total: invites.length,
    pending: invites.filter((i) => i.status === 'pending').length,
    accepted: invites.filter((i) => i.accepted).length,
  }
  console.log(`[resend-invite] list: ${counts.total} viewers, ${counts.pending} pending, ${pages} auth page(s)${truncated ? ', TRUNCATED at the page cap' : ''}${links ? '' : ', link state unknown'}`)
  const out = { invites, counts, link_ttl_minutes: linkTtlMinutes(), invite_link_days: INVITE_LINK_DAYS }
  // Additive, present only when the page cap was hit: some profiles past the
  // cap then read as missing_user although their user exists.
  if (truncated) out.auth_users_truncated = true
  return json(200, out)
}

// ── resend ─────────────────────────────────────────────────────────────────

const NOT_FOUND = 'No pending invite was found for that login. Refresh the list and try again.'
const ALREADY = 'This person has already opened their invite and set up their login. If they cannot sign in, they should use "Forgot password" on the login screen.'
const NOT_INVITED = 'This login was created by a self-serve signup, not by an invite, so there is no invite to resend. The person should use "Forgot password" on the login screen.'
const BUSY = 'Another resend for this login is in progress. Refresh and try again.'
const LINK_UNAVAILABLE = 'Invite links are not available right now. Use Resend to email the invite instead.'
const RATE_LIMITED = 'Supabase is limiting invite emails right now. Wait a few minutes and try again.'
const INVITE_FAILED = 'Supabase did not send the invite. Check the function logs and try again.'

/** The client row ({ id, name }) or null. */
async function loadClient(supabase, clientId) {
  const { data, error } = await supabase.from('clients').select('id, name').eq('id', clientId).maybeSingle()
  if (error) throw new ReadError('clients', error)
  return data || null
}

async function resendByUserId(supabase, auth, json, fail, userId, clientId, delivery) {
  const { data: profile, error } = await supabase
    .from('user_profiles').select('id, client_id, role').eq('id', userId).maybeSingle()
  if (error) throw new ReadError('user_profiles', error)
  if (!profile || profile.role !== 'viewer' || profile.client_id === null || profile.client_id === undefined) {
    return fail(404, 'not_found', NOT_FOUND)
  }
  if (clientId !== null && String(profile.client_id) !== String(clientId)) return fail(404, 'not_found', NOT_FOUND)
  const client = await loadClient(supabase, profile.client_id)
  if (!client) return fail(404, 'not_found', NOT_FOUND)
  const user = await getAuthUser(supabase, userId)
  return sendInvite(supabase, auth, json, fail, { user, profile, client, via: 'user_id', delivery })
}

async function resendByClientId(supabase, auth, json, fail, clientId, delivery) {
  const client = await loadClient(supabase, clientId)
  if (!client) return fail(404, 'not_found', NOT_FOUND)
  const { data: profiles, error } = await supabase
    .from('user_profiles').select('id, client_id, role').eq('client_id', clientId).eq('role', 'viewer')
  if (error) throw new ReadError('user_profiles', error)
  const rows = profiles || []
  // Usually one viewer per client, so one getUserById each beats a full listing.
  const resolved = []
  for (const p of rows) resolved.push({ profile: p, user: await getAuthUser(supabase, p.id) })
  const pending = resolved.filter((r) => inviteStatus(r.user) === 'pending')
  if (pending.length > 1) {
    return fail(409, 'ambiguous', 'This client has more than one pending invite. Resend from the row of the person you mean.')
  }
  if (pending.length === 0) {
    if (resolved.length && resolved.every((r) => isAccepted(r.user))) return fail(409, 'already_accepted', ALREADY)
    return fail(404, 'not_found', NOT_FOUND)
  }
  return sendInvite(supabase, auth, json, fail, { ...pending[0], client, via: 'client_id', delivery })
}

async function resendByEmail(supabase, auth, json, fail, wanted) {
  const { byId } = await loadAuthUsers(supabase)
  let user = null
  for (const u of byId.values()) {
    if (typeof u.email === 'string' && u.email.trim().toLowerCase() === wanted) { user = u; break }
  }
  if (!user) return fail(404, 'not_found', 'No login exists for that address. Onboard the client first; this form never creates a login.')
  const { data: profile, error } = await supabase
    .from('user_profiles').select('id, client_id, role').eq('id', user.id).maybeSingle()
  if (error) throw new ReadError('user_profiles', error)
  if (!profile || profile.client_id === null || profile.client_id === undefined) return fail(404, 'not_found', NOT_FOUND)
  const client = await loadClient(supabase, profile.client_id)
  if (!client) return fail(404, 'not_found', NOT_FOUND)
  return sendInvite(supabase, auth, json, fail, { user, profile, client, via: 'email', delivery: 'email' })
}

/**
 * Race guard (docs/arch/invite-link-7-days.md section 4, closes pending
 * invites review L1): `other` is a user GoTrue answered with although we sent
 * the address of `user`, so `user` vanished between the check and the call and
 * GoTrue CREATED a new user for that address. Roll it back (the compensating
 * delete onboard-client.js uses) only when its created_at parses, is no older
 * than startedAt minus 60 s, and it has no user_profiles row. Otherwise it is
 * somebody else's real login and is never deleted. Always a non-200 answer.
 */
async function raceGuard(supabase, fail, user, other, startedAt) {
  const createdMs = Date.parse(other.created_at || '')
  const recent = Number.isFinite(createdMs) && createdMs >= startedAt - RACE_WINDOW_MS
  let hasProfile = true
  if (recent) {
    try {
      const { data, error } = await supabase.from('user_profiles').select('id').eq('id', other.id).maybeSingle()
      // A read error counts as "has a profile": never delete on a guess.
      hasProfile = !!error || !!data
      if (error) console.error(`[resend-invite] RACE: profile read for user ${other.id} failed; NOT deleted`)
    } catch (e) {
      hasProfile = true
      console.error(`[resend-invite] RACE: profile read for user ${other.id} threw; NOT deleted`)
    }
  }
  const fresh = recent && !hasProfile
  console.error(`[resend-invite] RACE: invite for user ${user.id} returned a different user ${other.id} (fresh=${fresh})`)
  if (!fresh) {
    console.error(`[resend-invite] RACE: user ${other.id} is not one this request created; NOT deleted`)
    return fail(409, 'not_found', NOT_FOUND)
  }
  let delErr = null
  try {
    const res = await supabase.auth.admin.deleteUser(other.id)
    delErr = res && res.error ? res.error : null
  } catch (e) { delErr = e }
  if (delErr) {
    console.error(`[resend-invite] ORPHAN: could not roll back auth user ${other.id}:`, delErr.message)
    return fail(500, 'orphan_created', 'An extra login was created and could not be removed. Check the function logs before retrying.')
  }
  console.error(`[resend-invite] RACE: rolled back auth user ${other.id}`)
  return fail(409, 'not_found', NOT_FOUND)
}

/**
 * The only path that sends an invite. `user` is the auth user we resolved
 * ourselves; its stored email is the one used. deliverInvite picks the
 * channel (6.1) and, with rotate true, kills the earlier link.
 */
async function sendInvite(supabase, auth, json, fail, { user, profile, client, via, delivery }) {
  if (!user || typeof user.email !== 'string' || !user.email) return fail(404, 'not_found', NOT_FOUND)
  if (isAccepted(user)) return fail(409, 'already_accepted', ALREADY)
  if (!user.invited_at) return fail(409, 'not_invited', NOT_INVITED)

  const startedAt = Date.now()
  const res = await deliverInvite(supabase, {
    user: { id: user.id, email: user.email },
    clientId: profile.client_id,
    clientName: client && typeof client.name === 'string' ? client.name : null,
    role: profile.role,
    source: 'resend-invite',
    actor: auth.user.id,
    delivery,
    rotate: true,
  })

  if (!res.ok) {
    console.error(`[resend-invite] invite for user ${user.id} not sent (${res.code})`)
    switch (res.code) {
      case 'user_changed': return raceGuard(supabase, fail, user, res.otherUser || {}, startedAt)
      case 'busy': return fail(409, 'busy', BUSY)
      case 'link_unavailable': return fail(503, 'link_unavailable', LINK_UNAVAILABLE)
      case 'already_accepted': return fail(409, 'already_accepted', ALREADY)
      case 'email_rate_limited': return fail(429, 'rate_limited', RATE_LIMITED)
      default: return fail(502, 'invite_failed', INVITE_FAILED)
    }
  }

  if (res.channel === 'supabase') {
    const sent = res.supabaseUser || null
    if (sent && sent.id && sent.id !== user.id) return raceGuard(supabase, fail, user, sent, startedAt)
  }

  const brandgeo = res.channel === 'brandgeo'
  const invitedAt = res.issuedAt || new Date().toISOString()
  const linkExpiresAt = brandgeo ? (res.expiresAt || null) : supabaseLinkExpiry(invitedAt)

  // Audit: LAST and NON-FATAL, same reasoning as onboard-client.js step 5. The
  // email has already gone; until db/supabase-client-events-invite-resent-
  // 2026-11-11.sql is applied the CHECK refuses this row. No email, no token,
  // no hash in meta.
  let auditLogged = false
  try {
    const meta = { source: 'resend-invite', user_id: user.id, via, channel: res.channel, delivery }
    if (brandgeo) meta.invite_link_id = res.linkId
    const { error: evErr } = await supabase.from('client_events').insert({
      client_id: profile.client_id,
      actor: auth.user.id,
      type: 'invite_resent',
      from_plan: null,
      to_plan: null,
      meta,
    })
    if (evErr) console.error(`[resend-invite] audit row not written for client ${profile.client_id}:`, evErr.message)
    else auditLogged = true
  } catch (e) {
    console.error(`[resend-invite] audit row threw for client ${profile.client_id}:`, e && e.message)
  }

  const out = {
    ok: true,
    user_id: user.id,
    client_id: profile.client_id,
    email: user.email,
    invited_at: invitedAt,
    audit_logged: auditLogged,
    channel: res.channel,
    delivery,
    link_expires_at: linkExpiresAt,
  }
  if (brandgeo) out.previous_link_revoked = res.previousLinkRevoked === true
  if (delivery === 'copy' && brandgeo && res.inviteUrl) {
    // The link is a bearer credential for this login: never cached.
    out.invite_url = res.inviteUrl
    return { statusCode: 200, headers: Object.assign({}, auth.headers, { 'Cache-Control': 'no-store' }), body: JSON.stringify(out) }
  }
  return json(200, out)
}

exports.PAGING = PAGING
exports.parseUuid = parseUuid
exports.parsePositiveInt = parsePositiveInt
exports.inviteStatus = inviteStatus
exports.SUPABASE_EMAIL_LINK_TTL_MINUTES = SUPABASE_EMAIL_LINK_TTL_MINUTES
