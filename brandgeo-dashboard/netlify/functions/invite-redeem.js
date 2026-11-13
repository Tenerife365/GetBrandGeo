/**
 * invite-redeem.js -- POST, public, no JWT. The Continue button of /invite
 * (docs/arch/invite-link-7-days.md sections 3, 4 and 6.2).
 *
 * POST { token }   token: the 43 character link token from the email
 *   -> 200 { ok: true, token_hash, type }   a FRESH Supabase invite token
 *   -> 400 { ok: false, code: 'bad_request' }
 *   -> 404 { ok: false, code: 'invalid' }    one indistinguishable answer for
 *                                            unknown, revoked, send_failed,
 *                                            table missing, user gone, profile
 *                                            mismatch, race guard
 *   -> 410 { ok: false, code: 'replaced' | 'used' | 'expired' }
 *   -> 429 { ok: false, code: 'rate_limited' }
 *   -> 503 { ok: false, code: 'unavailable' }  the person may retry
 *   -> 403 { error } foreign Origin; 405 not POST
 *
 * The emailed token is checked against sha256 in public.client_invite_links
 * and is NOT consumed here: it dies on acceptance, 7 days, a newer issue or a
 * revoke. Each press mints a new Supabase token with
 * auth.admin.generateLink({ type: 'invite' }) for the auth user the row is
 * bound to, using that user's STORED address, never anything from the
 * request. Redeem never creates a user (see the race guard).
 *
 * Kill switch: INVITE_REDEEM_DISABLED=1 answers 503 after the shape check,
 * before any read.
 *
 * Logs: "[invite-redeem] link <row id> user <uuid>: <outcome>" or
 * "[invite-redeem] unknown token". Never the token, the hash, an address, the
 * body or a generateLink response.
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, ALLOWED_ORIGINS } = require('./_auth')
const { hashIp } = require('./_prospect_guard')
const { INVITE_TOKEN_RE, hashInviteToken, isAccepted } = require('./_invite_link')

const TABLE = 'client_invite_links'
// Same literal as src/lib/authLinkState.ts TOKEN_HASH_RE (a .ts file cannot
// be required from here).
const TOKEN_HASH_RE = /^[A-Za-z0-9_-]{16,256}$/
const RACE_WINDOW_MS = 60 * 1000
const LIMITS = { ip: 20, token: 10, windowSeconds: 3600 }

function isTableMissing(error) {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  return /schema cache|does not exist/i.test(String(error.message || ''))
}

function isAcceptedError(error) {
  if (!error) return false
  if (error.code === 'email_exists') return true
  return /already.*(regist|exist|confirm)/i.test(String(error.message || ''))
}

function isRateLimitError(error) {
  if (!error) return false
  return error.status === 429 || /rate.?limit/i.test(String(error.message || ''))
}

function tag(error) {
  return error ? String(error.code || error.status || 'n/a') : 'n/a'
}

async function handle(event, { supabase = null, now = () => new Date() } = {}) {
  const hdrs = event.headers || {}
  const origin = hdrs['origin'] || hdrs['Origin'] || ''
  const headers = Object.assign({}, corsHeaders(origin), {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  })
  const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) })
  const fail = (statusCode, code) => reply(statusCode, { ok: false, code })

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: 'Forbidden: origin not allowed' })

  let body
  try { body = JSON.parse(event.body || '') } catch { return fail(400, 'bad_request') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'bad_request')
  const token = body.token
  if (typeof token !== 'string' || !INVITE_TOKEN_RE.test(token)) return fail(400, 'bad_request')

  if (process.env.INVITE_REDEEM_DISABLED === '1') return fail(503, 'unavailable')

  const db = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const tokenHash = hashInviteToken(token)

  // Rate limits, both BEFORE the row lookup. An RPC error fails open (logged):
  // the security rests on 256 bits of token entropy.
  const limited = async (key, limit) => {
    try {
      const { data, error } = await db.rpc('affiliate_rate_check', { p_key: key, p_limit: limit, p_window_seconds: LIMITS.windowSeconds })
      if (error) { console.error(`[invite-redeem] rate check failed (${tag(error)}); proceeding`); return false }
      return data === false
    } catch (e) {
      console.error('[invite-redeem] rate check threw; proceeding')
      return false
    }
  }
  if (await limited(`invite:ip:${hashIp(event)}`, LIMITS.ip)) return fail(429, 'rate_limited')
  if (await limited(`invite:tok:${tokenHash.slice(0, 16)}`, LIMITS.token)) return fail(429, 'rate_limited')

  const readRow = async (q) => {
    const { data, error } = await q.maybeSingle()
    return { row: data || null, error: error || null }
  }
  const cols = 'id, user_id, client_id, expires_at, revoked_at, revoked_reason, accepted_at, redeem_count'

  let found
  try {
    found = await readRow(db.from(TABLE).select(cols).eq('token_hash', tokenHash))
  } catch (e) {
    console.error('[invite-redeem] link lookup threw')
    return fail(503, 'unavailable')
  }
  if (found.error) {
    if (isTableMissing(found.error)) { console.error('[invite-redeem] link table missing'); return fail(404, 'invalid') }
    console.error(`[invite-redeem] link lookup failed (${tag(found.error)})`)
    return fail(503, 'unavailable')
  }
  const row = found.row
  if (!row) { console.log('[invite-redeem] unknown token'); return fail(404, 'invalid') }
  const log = (outcome) => console.log(`[invite-redeem] link ${row.id} user ${row.user_id}: ${outcome}`)

  // A row's own state answers first. Superseded is checked before expiry.
  const stateAnswer = (r) => {
    if (r.revoked_reason === 'superseded') return { status: 410, code: 'replaced' }
    if (r.revoked_at) return { status: 404, code: 'invalid' }
    if (r.accepted_at) return { status: 410, code: 'used' }
    return null
  }
  const early = stateAnswer(row)
  if (early) { log(early.code); return fail(early.status, early.code) }
  const expiresMs = Date.parse(row.expires_at || '')
  if (!Number.isFinite(expiresMs) || now().getTime() >= expiresMs) { log('expired'); return fail(410, 'expired') }

  const stampAccepted = async () => {
    try {
      const { error } = await db.from(TABLE).update({ accepted_at: now().toISOString() }).eq('id', row.id).is('accepted_at', null)
      if (error) console.error(`[invite-redeem] link ${row.id}: accepted_at not stamped (${tag(error)})`)
    } catch (e) {
      console.error(`[invite-redeem] link ${row.id}: stamping accepted_at threw`)
    }
  }

  // The bound auth user, by id.
  const loadUser = async () => {
    const { data, error } = await db.auth.admin.getUserById(row.user_id)
    if (error) {
      if (error.status === 404 || /not.?found/i.test(String(error.message || ''))) return { user: null, error: null }
      return { user: null, error }
    }
    return { user: (data && data.user) || null, error: null }
  }
  let user
  try {
    const got = await loadUser()
    if (got.error) { log(`user read failed (${tag(got.error)})`); return fail(503, 'unavailable') }
    user = got.user
  } catch (e) {
    log('user read threw')
    return fail(503, 'unavailable')
  }
  if (!user || typeof user.email !== 'string' || !user.email) { log('user gone'); return fail(404, 'invalid') }

  let profile
  try {
    const { data, error } = await db.from('user_profiles').select('id, client_id, role').eq('id', user.id).maybeSingle()
    if (error) { log(`profile read failed (${tag(error)})`); return fail(503, 'unavailable') }
    profile = data || null
  } catch (e) {
    log('profile read threw')
    return fail(503, 'unavailable')
  }
  if (!profile || profile.role !== 'viewer' || profile.client_id === null || profile.client_id === undefined
      || String(profile.client_id) !== String(row.client_id)) {
    log('profile mismatch')
    return fail(404, 'invalid')
  }

  if (isAccepted(user)) {
    await stampAccepted()
    log('used')
    return fail(410, 'used')
  }

  // Race guard: generateLink CREATES a user for an address GoTrue does not
  // know. If it answers a user other than the bound one, the bound user
  // vanished; delete the new one only when it is plainly ours (created within
  // 60 s of this request and no profile). -> true when it ran.
  const startedAt = now().getTime()
  const guardOtherUser = async (other) => {
    if (!other || !other.id || other.id === user.id) return false
    const createdMs = Date.parse(other.created_at || '')
    const fresh = Number.isFinite(createdMs) && createdMs >= startedAt - RACE_WINDOW_MS
    let hasProfile = true
    try {
      const { data, error } = await db.from('user_profiles').select('id').eq('id', other.id).maybeSingle()
      hasProfile = !!(error || data)
    } catch (e) { hasProfile = true }
    if (!fresh || hasProfile) {
      log(`RACE: generateLink answered user ${other.id}; NOT deleted (fresh=${fresh}, profile=${hasProfile})`)
      return true
    }
    try {
      const res = await db.auth.admin.deleteUser(other.id)
      if (res && res.error) log(`ORPHAN: could not delete user ${other.id} (${tag(res.error)})`)
      else log(`RACE: deleted user ${other.id}`)
    } catch (e) {
      log(`ORPHAN: deleting user ${other.id} threw`)
    }
    return true
  }

  let minted
  try {
    minted = await db.auth.admin.generateLink({ type: 'invite', email: user.email })
  } catch (e) {
    log('generateLink threw')
    return fail(503, 'unavailable')
  }
  if (minted && minted.error) {
    const error = minted.error
    if (isAcceptedError(error)) {
      // Re-read before stamping: only a confirmed login makes the row used.
      let again
      try { again = await loadUser() } catch (e) { again = { user: null, error: { code: 'threw' } } }
      if (again.error) { log(`re-read failed (${tag(again.error)})`); return fail(503, 'unavailable') }
      if (again.user && isAccepted(again.user)) {
        await stampAccepted()
        log('used')
        return fail(410, 'used')
      }
      log(`generateLink refused (status ${error.status || 'n/a'}) but the login is not accepted`)
      return fail(503, 'unavailable')
    }
    if (isRateLimitError(error)) { log('generateLink rate limited'); return fail(429, 'rate_limited') }
    log(`generateLink failed (status ${error.status || 'n/a'})`)
    return fail(503, 'unavailable')
  }
  const data = (minted && minted.data) || {}
  if (data.user && data.user.id && data.user.id !== user.id) {
    await guardOtherUser(data.user)
    return fail(404, 'invalid')
  }
  const props = data.properties || {}
  const type = props.verification_type
  const hashed = props.hashed_token
  if (type !== 'invite' && type !== 'signup') { log('unexpected verification type'); return fail(503, 'unavailable') }
  if (typeof hashed !== 'string' || !TOKEN_HASH_RE.test(hashed)) { log('unexpected token shape'); return fail(503, 'unavailable') }

  // Conditional stamp. PostgREST cannot write redeem_count + 1 in SQL, so the
  // count is read-modify-write; two presses at the same instant may count
  // once. The state conditions are what make this safe.
  let stamped
  try {
    const { data: upd, error } = await db.from(TABLE)
      .update({ last_redeemed_at: now().toISOString(), redeem_count: (Number(row.redeem_count) || 0) + 1 })
      .eq('id', row.id).is('revoked_at', null).is('accepted_at', null)
      .select('id')
    if (error) { log(`redeem stamp failed (${tag(error)})`); stamped = null } else stamped = Array.isArray(upd) ? upd.length : 0
  } catch (e) {
    log('redeem stamp threw')
    stamped = null
  }

  if (stamped === 1) {
    log('minted')
    return reply(200, { ok: true, token_hash: hashed, type })
  }

  // Zero rows (or the write failed): a supersede, revoke or acceptance raced
  // this press. Re-read first; rotate the just minted token away only while
  // the row still exists. The minted hash is never returned.
  let again
  try {
    again = await readRow(db.from(TABLE).select(cols).eq('id', row.id))
  } catch (e) {
    again = { row: null, error: { code: 'threw' } }
  }
  if (again.error) { log(`re-read failed (${tag(again.error)})`); return fail(503, 'unavailable') }
  if (!again.row) { log('row gone'); return fail(404, 'invalid') }
  try {
    const second = await db.auth.admin.generateLink({ type: 'invite', email: user.email })
    if (second && second.error) log(`second generateLink failed (status ${second.error.status || 'n/a'})`)
    else if (second && second.data && second.data.user && second.data.user.id !== user.id) await guardOtherUser(second.data.user)
  } catch (e) {
    log('second generateLink threw')
  }
  const late = stateAnswer(again.row)
  if (late) { log(`${late.code} after mint`); return fail(late.status, late.code) }
  log(stamped === null ? 'redeem stamp failed after mint' : 'zero-row stamp on an active row')
  return fail(503, 'unavailable')
}

exports.handler = (event) => handle(event)
exports.handle = handle
