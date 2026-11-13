/**
 * resend-invite.js
 * Pending invites: lists the viewer logins and whether each accepted its
 * invite, and re-sends a Supabase Auth invite email to one that did not.
 * Admin only. Requires SUPABASE_SERVICE_KEY.
 *
 * Invite links expire after about ONE HOUR (the Supabase email link expiry,
 * mirrored by INVITE_LINK_TTL_MINUTES below). An earlier version of this
 * comment said 24 hours; that was wrong. On 2026-11-11 ten leads were invited
 * and none completed, which is why the list exists.
 *
 * POST bodies (contract fixed with the frontend, 2026-11-11):
 *
 *   { action: 'list' }
 *     -> { invites: [...], counts: { total, pending, accepted }, link_ttl_minutes }
 *     One entry per user_profiles row with role 'viewer' and a client_id.
 *     status: 'pending' | 'accepted' | 'not_invited' | 'missing_user'.
 *
 *   { action: 'resend', user_id?: uuid, client_id?: int }
 *     -> { ok, user_id, client_id, email, invited_at, audit_logged }
 *     user_id is the key; client_id alone resolves the one pending viewer of
 *     that client; both together must agree.
 *
 *   { email }  (legacy, no action; the Onboard wizard's last step)
 *     -> same body as resend. Any role. Resolved against EXISTING auth users
 *     only, so it can never create one.
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
 * invite_failed, read_failed, orphan_created. No error sentence echoes an
 * email address taken from the request body.
 *
 * Added 2026-07-09 (onboarding-gaps pass); list, guards and audit added
 * 2026-11-11 (pending invites).
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const APP_URL = 'https://app.getbrandgeo.com'
const REDIRECT_TO = `${APP_URL}/reset-password`

// Hand-kept mirror of the Supabase email link expiry (Auth settings, "Email
// OTP expiration"). Nothing reads the real value from Supabase; change both
// together. Shown to the admin so they know how long a fresh link lives.
function linkTtlMinutes() {
  const n = Number(process.env.INVITE_LINK_TTL_MINUTES)
  return Number.isInteger(n) && n > 0 ? n : 60
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

function isAccepted(u) {
  return !!(u && (u.email_confirmed_at || u.last_sign_in_at))
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
      const hasUser = body.user_id !== undefined && body.user_id !== null
      const hasClient = body.client_id !== undefined && body.client_id !== null
      if (!hasUser && !hasClient) return fail(400, 'bad_request', 'Send user_id, or client_id, of the invite to resend.')
      const userId = hasUser ? parseUuid(body.user_id) : null
      if (hasUser && !userId) return fail(400, 'bad_request', 'user_id must be a uuid.')
      const clientId = hasClient ? parsePositiveInt(body.client_id) : null
      if (hasClient && !clientId) return fail(400, 'bad_request', 'client_id must be a positive whole number.')
      if (userId) return await resendByUserId(supabase, auth, json, fail, userId, clientId)
      return await resendByClientId(supabase, auth, json, fail, clientId)
    }

    if (body.action !== undefined) return fail(400, 'bad_request', 'Unknown action. Use "list" or "resend".')

    // Legacy form: { email }.
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

  const invites = viewers.map((p) => {
    const u = byId.get(p.id) || null
    const c = clients.get(String(p.client_id)) || null
    const status = inviteStatus(u)
    return {
      user_id: p.id,
      client_id: p.client_id,
      client_name: c ? (c.name ?? null) : null,
      plan: c ? (c.plan ?? null) : null,
      category: c ? (c.category ?? null) : null,
      email: u ? (u.email ?? null) : null,
      role: p.role,
      first_invited_at: u ? (u.created_at ?? null) : null,
      invited_at: u ? (u.invited_at ?? null) : null,
      accepted: status === 'accepted',
      accepted_at: u ? (u.email_confirmed_at || u.last_sign_in_at || null) : null,
      status,
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
  console.log(`[resend-invite] list: ${counts.total} viewers, ${counts.pending} pending, ${pages} auth page(s)${truncated ? ', TRUNCATED at the page cap' : ''}`)
  const out = { invites, counts, link_ttl_minutes: linkTtlMinutes() }
  // Additive, present only when the page cap was hit: some profiles past the
  // cap then read as missing_user although their user exists.
  if (truncated) out.auth_users_truncated = true
  return json(200, out)
}

// ── resend ─────────────────────────────────────────────────────────────────

const NOT_FOUND = 'No pending invite was found for that login. Refresh the list and try again.'
const ALREADY = 'This person has already opened their invite and set up their login. If they cannot sign in, they should use "Forgot password" on the login screen.'
const NOT_INVITED = 'This login was created by a self-serve signup, not by an invite, so there is no invite to resend. The person should use "Forgot password" on the login screen.'

async function loadClient(supabase, clientId) {
  const { data, error } = await supabase.from('clients').select('id').eq('id', clientId).maybeSingle()
  if (error) throw new ReadError('clients', error)
  return data || null
}

async function resendByUserId(supabase, auth, json, fail, userId, clientId) {
  const { data: profile, error } = await supabase
    .from('user_profiles').select('id, client_id, role').eq('id', userId).maybeSingle()
  if (error) throw new ReadError('user_profiles', error)
  if (!profile || profile.role !== 'viewer' || profile.client_id === null || profile.client_id === undefined) {
    return fail(404, 'not_found', NOT_FOUND)
  }
  if (clientId !== null && String(profile.client_id) !== String(clientId)) return fail(404, 'not_found', NOT_FOUND)
  if (!(await loadClient(supabase, profile.client_id))) return fail(404, 'not_found', NOT_FOUND)
  const user = await getAuthUser(supabase, userId)
  return sendInvite(supabase, auth, json, fail, { user, profile, via: 'user_id' })
}

async function resendByClientId(supabase, auth, json, fail, clientId) {
  if (!(await loadClient(supabase, clientId))) return fail(404, 'not_found', NOT_FOUND)
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
  return sendInvite(supabase, auth, json, fail, { ...pending[0], via: 'client_id' })
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
  if (!(await loadClient(supabase, profile.client_id))) return fail(404, 'not_found', NOT_FOUND)
  return sendInvite(supabase, auth, json, fail, { user, profile, via: 'email' })
}

/**
 * The only path that calls inviteUserByEmail. `user` is the auth user we
 * resolved ourselves; its stored email is the one sent.
 */
async function sendInvite(supabase, auth, json, fail, { user, profile, via }) {
  if (!user || typeof user.email !== 'string' || !user.email) return fail(404, 'not_found', NOT_FOUND)
  if (isAccepted(user)) return fail(409, 'already_accepted', ALREADY)
  if (!user.invited_at) return fail(409, 'not_invited', NOT_INVITED)

  const startedAt = Date.now()
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(user.email, { redirectTo: REDIRECT_TO })

  if (error) {
    const msg = error.message || ''
    console.error(`[resend-invite] invite for user ${user.id} failed (status ${error.status || 'n/a'}):`, msg)
    if (error.status === 429 || /rate.?limit/i.test(msg)) {
      return fail(429, 'rate_limited', 'Supabase is limiting invite emails right now. Wait a few minutes and try again.')
    }
    if (/already.*(regist|exist|confirm)/i.test(msg)) return fail(409, 'already_accepted', ALREADY)
    return fail(502, 'invite_failed', 'Supabase did not send the invite. Check the function logs and try again.')
  }

  const sent = (data && data.user) || null
  if (sent && sent.id && sent.id !== user.id) {
    // Race: the user we resolved vanished between the check and the call, so
    // GoTrue just CREATED a new user for that address. Roll it back (the
    // compensating delete onboard-client.js uses), unless that user plainly
    // predates this request, in which case it is somebody else's real login
    // and must not be deleted.
    const createdMs = Date.parse(sent.created_at || '')
    const fresh = !Number.isFinite(createdMs) || createdMs >= startedAt - 10 * 60 * 1000
    console.error(`[resend-invite] RACE: invite for user ${user.id} returned a different user ${sent.id} (fresh=${fresh})`)
    if (!fresh) {
      console.error(`[resend-invite] RACE: user ${sent.id} predates this request; NOT deleted`)
      return fail(409, 'not_found', NOT_FOUND)
    }
    let delErr = null
    try {
      const res = await supabase.auth.admin.deleteUser(sent.id)
      delErr = res && res.error ? res.error : null
    } catch (e) { delErr = e }
    if (delErr) {
      console.error(`[resend-invite] ORPHAN: could not roll back auth user ${sent.id}:`, delErr.message)
      return fail(500, 'orphan_created', 'An extra login was created and could not be removed. Check the function logs before retrying.')
    }
    console.error(`[resend-invite] RACE: rolled back auth user ${sent.id}`)
    return fail(409, 'not_found', NOT_FOUND)
  }

  const invitedAt = (sent && sent.invited_at) || new Date().toISOString()

  // Audit: LAST and NON-FATAL, same reasoning as onboard-client.js step 5. The
  // email has already gone; until db/supabase-client-events-invite-resent-
  // 2026-11-11.sql is applied the CHECK refuses this row. No email in meta.
  let auditLogged = false
  try {
    const { error: evErr } = await supabase.from('client_events').insert({
      client_id: profile.client_id,
      actor: auth.user.id,
      type: 'invite_resent',
      from_plan: null,
      to_plan: null,
      meta: { source: 'resend-invite', user_id: user.id, via },
    })
    if (evErr) console.error(`[resend-invite] audit row not written for client ${profile.client_id}:`, evErr.message)
    else auditLogged = true
  } catch (e) {
    console.error(`[resend-invite] audit row threw for client ${profile.client_id}:`, e && e.message)
  }

  return json(200, {
    ok: true,
    user_id: user.id,
    client_id: profile.client_id,
    email: user.email,
    invited_at: invitedAt,
    audit_logged: auditLogged,
  })
}

exports.PAGING = PAGING
exports.parseUuid = parseUuid
exports.parsePositiveInt = parsePositiveInt
exports.inviteStatus = inviteStatus
