/**
 * _invite_link.js
 * BrandGEO's own 7 day invite link (docs/arch/invite-link-7-days.md,
 * sections 2 to 4 and 6.1). Shared by resend-invite.js and
 * _provision_client.js (admin wizard and lead import); invite-redeem.js uses
 * the token helpers and isAccepted.
 *
 * Why: Supabase's "Email OTP expiration" is 86400 s (24 hours, owner
 * statement 2026-11-13) and governs every email link. An invite must live 7
 * days while reset, magic and confirmation links keep 24 hours, so for viewer
 * logins BrandGEO issues its own token, stores only its sha256 in
 * public.client_invite_links, and emails the link itself through Resend. The
 * link opens the public /invite page; only a press of Continue there makes
 * invite-redeem mint a fresh Supabase invite token.
 *
 * Fallback: whenever this channel cannot complete (role not viewer, kill
 * switch INVITE_LINK_CHANNEL=supabase, no RESEND_API_KEY, table missing,
 * Resend refuses or times out) deliverInvite sends the Supabase invite
 * exactly as before (24 hours).
 *
 * Never logged, never returned except as stated: the token (only in the
 * email, and in inviteUrl for a copy delivery), its hash, the address, a
 * generateLink response, Resend's message text. Logs carry the row id, the
 * user id, an outcome word and an HTTP status or error code.
 *
 * CommonJS, requires only crypto and ./_email (no .ts file): it is also
 * loaded by the esbuild-bundled explee-import-background.js.
 */

const crypto = require('crypto')
const emailMod = require('./_email')

const INVITE_LINK_DAYS = 7
const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
// Bound on one Resend POST. The tests shorten it by assigning
// module.exports.SEND_TIMEOUT_MS; deliverInvite reads the export at call time.
const SEND_TIMEOUT_MS = 8000

const APP_URL = 'https://app.getbrandgeo.com'
const REDIRECT_TO = `${APP_URL}/reset-password`
const TABLE = 'client_invite_links'
const DAY_MS = 24 * 60 * 60 * 1000

function generateInviteToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashInviteToken(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex')
}

function buildInviteUrl(token) {
  return `${APP_URL}/invite#t=${token}`
}

/** Moved from resend-invite.js unchanged: confirmed, or has ever signed in. */
function isAccepted(u) {
  return !!(u && (u.email_confirmed_at || u.last_sign_in_at))
}

function channelEnabled() {
  return process.env.INVITE_LINK_CHANNEL !== 'supabase'
}

function resendKeyPresent() {
  const k = process.env.RESEND_API_KEY
  return typeof k === 'string' && k.trim() !== ''
}

/** A status or code for a log line, never a message (messages can carry data). */
function errTag(error) {
  if (!error) return 'n/a'
  return String(error.code || error.status || 'n/a')
}

/**
 * GoTrue's answer for an address that already accepted. Only email_exists or
 * the "already registered" wording counts; a bare 422 does not (re-read LOW-1).
 */
function isAcceptedError(error) {
  if (!error) return false
  if (error.code === 'email_exists') return true
  return /already.*(regist|exist|confirm)/i.test(String(error.message || ''))
}

function isRateLimitError(error) {
  if (!error) return false
  return error.status === 429 || /rate.?limit/i.test(String(error.message || ''))
}

/**
 * true only for a viewer, with the channel on, a Resend key, and a readable
 * client_invite_links table. Never throws.
 */
async function channelReady(supabase, role) {
  try {
    if (role !== 'viewer' || !channelEnabled() || !resendKeyPresent()) return false
    const { error } = await supabase.from(TABLE).select('id').limit(0)
    if (error) {
      console.error(`[invite-link] readiness read failed (${errTag(error)}); using the Supabase invite`)
      return false
    }
    return true
  } catch (e) {
    console.error('[invite-link] readiness read threw; using the Supabase invite')
    return false
  }
}

// Copy of section 9 (C-E1 to C-E6). No address, no token in any of it.
function inviteEmail(clientName, url) {
  const name = typeof clientName === 'string' ? clientName.trim() : ''
  return {
    subject: 'Your BrandGEO login is ready', // copy: pending bg-copy
    heading: 'Set up your BrandGEO login', // copy: pending bg-copy
    paragraphs: [
      name
        ? `You have been invited to see how AI engines describe ${name}.` // copy: pending bg-copy
        : 'You have been invited to BrandGEO, where you can see how AI engines describe your brand.', // copy: pending bg-copy
      'Choose a password to open your dashboard. This link works for 7 days.', // copy: pending bg-copy
    ],
    cta: { label: 'Set up my login', url }, // copy: pending bg-copy
    footerNote: 'If you did not expect this email, you can ignore it. Nothing happens until you choose a password.', // copy: pending bg-copy
  }
}

const MESSAGES = {
  busy: 'Another resend for this login is in progress. Refresh and try again.',
  link_unavailable: 'Invite links are not available right now. Use Resend to email the invite instead.',
  already_accepted: 'This person has already opened their invite and set up their login.',
  user_changed: 'The login changed while the invite was being sent.',
  email_rate_limited: 'Supabase is limiting invite emails right now. Wait a few minutes and try again.',
  invite_error: 'Supabase did not send the invite. Check the function logs and try again.',
}
const failure = (code) => ({ ok: false, code, message: MESSAGES[code] })

/**
 * Revoke the user's active row ('superseded'). -> { ok, error? }
 */
async function supersedeActive(supabase, userId, nowFn) {
  try {
    const { error } = await supabase.from(TABLE)
      .update({ revoked_at: nowFn().toISOString(), revoked_reason: 'superseded' })
      .eq('user_id', userId).is('revoked_at', null).is('accepted_at', null)
    return error ? { ok: false, error } : { ok: true }
  } catch (e) {
    return { ok: false, error: { code: 'threw' } }
  }
}

/** Insert one row; created_at and expires_at come from one clock read. */
async function insertRow(supabase, args, tokenHash, nowFn) {
  const t = nowFn()
  const createdAt = t.toISOString()
  const expiresAt = new Date(t.getTime() + INVITE_LINK_DAYS * DAY_MS).toISOString()
  try {
    const { data, error } = await supabase.from(TABLE).insert({
      user_id: args.user.id,
      client_id: args.clientId,
      token_hash: tokenHash,
      source: args.source,
      created_by: args.actor || null,
      created_at: createdAt,
      expires_at: expiresAt,
    }).select('id, created_at, expires_at').single()
    if (error) return { ok: false, error }
    return { ok: true, id: data.id, createdAt: data.created_at || createdAt, expiresAt: data.expires_at || expiresAt }
  } catch (e) {
    return { ok: false, error: { code: 'threw' } }
  }
}

/** Set fields on one row by id; errors are logged by code only. */
async function patchRow(supabase, rowId, patch, what) {
  try {
    const { error } = await supabase.from(TABLE).update(patch).eq('id', rowId)
    if (error) console.error(`[invite-link] link ${rowId}: could not mark ${what} (${errTag(error)})`)
    return !error
  } catch (e) {
    console.error(`[invite-link] link ${rowId}: marking ${what} threw`)
    return false
  }
}

/**
 * Step 4: rotate the user's Supabase invite token with generateLink (sends no
 * email), killing any earlier Supabase link and any token an earlier redeem
 * minted. The response is discarded and never logged.
 * -> { kind: 'ok' } | { kind: 'failed' } | { kind: 'accepted' } | { kind: 'changed', otherUser }
 */
async function rotateSupabaseToken(supabase, user, rowId, nowFn) {
  let res
  try {
    res = await supabase.auth.admin.generateLink({ type: 'invite', email: user.email })
  } catch (e) {
    console.error(`[invite-link] link ${rowId} user ${user.id}: rotation threw; previous link not revoked`)
    return { kind: 'failed' }
  }
  const error = res && res.error
  if (error) {
    if (isAcceptedError(error)) {
      await patchRow(supabase, rowId, { accepted_at: nowFn().toISOString() }, 'accepted')
      console.log(`[invite-link] link ${rowId} user ${user.id}: rotation found the login accepted`)
      return { kind: 'accepted' }
    }
    console.error(`[invite-link] link ${rowId} user ${user.id}: rotation failed (status ${error.status || 'n/a'}); previous link not revoked`)
    return { kind: 'failed' }
  }
  const other = res && res.data && res.data.user
  if (other && other.id && other.id !== user.id) {
    await patchRow(supabase, rowId, { revoked_at: nowFn().toISOString(), revoked_reason: 'revoked' }, 'revoked')
    console.error(`[invite-link] link ${rowId} user ${user.id}: rotation answered a different user ${other.id}`)
    return { kind: 'changed', otherUser: other }
  }
  return { kind: 'ok' }
}

/** Map a rotation outcome onto the result, or null to keep the brandgeo result. */
function rotationOverride(rot) {
  if (rot.kind === 'accepted') return failure('already_accepted')
  if (rot.kind === 'changed') return { ok: false, code: 'user_changed', otherUser: rot.otherUser, message: MESSAGES.user_changed }
  return null
}

/** Step 6's race: the send against the timer. -> { ok } | { category, status } */
async function sendWithTimeout(message) {
  const ms = Number(module.exports.SEND_TIMEOUT_MS) > 0 ? Number(module.exports.SEND_TIMEOUT_MS) : SEND_TIMEOUT_MS
  let timer = null
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve({ timedOut: true }), ms) })
  let sent
  try {
    sent = await Promise.race([
      Promise.resolve().then(() => emailMod.sendBrandedEmail(message)).catch(() => ({ ok: false, error: 'threw' })),
      timeout,
    ])
  } finally {
    clearTimeout(timer)
  }
  if (sent && sent.timedOut) return { ok: false, category: 'timeout', status: 'n/a' }
  if (sent && sent.ok) return { ok: true }
  // Only the HTTP status is kept; Resend's message text can name an address.
  const m = /HTTP (\d{3})/.exec(String((sent && sent.error) || ''))
  return { ok: false, category: sent && sent.skipped ? 'skipped' : 'refused', status: m ? m[1] : 'n/a' }
}

/** Step 7: today's Supabase invite email (24 hours). */
async function fallbackInvite(supabase, user, nowFn) {
  let res
  try {
    res = await supabase.auth.admin.inviteUserByEmail(user.email, { redirectTo: REDIRECT_TO })
  } catch (e) {
    console.error(`[invite-link] user ${user.id}: Supabase invite threw`)
    return failure('invite_error')
  }
  const error = res && res.error
  if (error) {
    console.error(`[invite-link] user ${user.id}: Supabase invite failed (status ${error.status || 'n/a'})`)
    if (isRateLimitError(error)) return failure('email_rate_limited')
    // Confirmed between the caller's check and this call: GoTrue answers
    // "already registered". resend-invite has always answered that 409
    // already_accepted, so it stays a distinct code (step 2 builder fix).
    if (isAcceptedError(error)) return failure('already_accepted')
    return failure('invite_error')
  }
  const supabaseUser = (res && res.data && res.data.user) || null
  const issuedAt = (supabaseUser && supabaseUser.invited_at) || nowFn().toISOString()
  console.log(`[invite-link] user ${user.id}: Supabase invite sent`)
  return { ok: true, channel: 'supabase', supabaseUser, issuedAt }
}

/**
 * Send (or, for 'copy', return) an invite for one login. The order is the
 * spec's (6.1 steps 1 to 7) and is load-bearing; see the step comments.
 */
async function deliverInvite(supabase, args) {
  const a = args || {}
  const user = a.user
  const nowFn = typeof a.now === 'function' ? a.now : () => new Date()
  const copy = a.delivery === 'copy'
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string' || !user.email
      || (a.delivery !== 'email' && a.delivery !== 'copy')) {
    console.error('[invite-link] deliverInvite called without a resolved user or a known delivery')
    return failure('invite_error')
  }

  // Step 1: who may use the channel at all.
  if (a.role !== 'viewer') {
    if (copy) return failure('link_unavailable')
    return fallbackInvite(supabase, user, nowFn)
  }
  if (!channelEnabled() || (!copy && !resendKeyPresent())) {
    if (copy) return failure('link_unavailable')
    // A forwarded 7 day link is still cut off while the channel is off.
    const sup = await supersedeActive(supabase, user.id, nowFn)
    if (!sup.ok) console.error(`[invite-link] user ${user.id}: best effort supersede failed (${errTag(sup.error)})`)
    return fallbackInvite(supabase, user, nowFn)
  }

  // Steps 2 and 3, with one retry of both on a unique violation.
  let row = null
  let token = null
  for (let attempt = 1; attempt <= 2 && !row; attempt++) {
    const sup = await supersedeActive(supabase, user.id, nowFn)
    if (!sup.ok) {
      console.error(`[invite-link] user ${user.id}: supersede failed (${errTag(sup.error)})`)
      if (copy) return failure('link_unavailable')
      return fallbackInvite(supabase, user, nowFn)
    }
    token = generateInviteToken()
    const ins = await insertRow(supabase, a, hashInviteToken(token), nowFn)
    if (ins.ok) { row = ins; break }
    if (ins.error && ins.error.code === '23505') {
      console.error(`[invite-link] user ${user.id}: active link clash (attempt ${attempt})`)
      if (attempt === 2) return failure('busy')
      continue
    }
    console.error(`[invite-link] user ${user.id}: link insert failed (${errTag(ins.error)})`)
    if (copy) return failure('link_unavailable')
    return fallbackInvite(supabase, user, nowFn)
  }

  const brandgeo = (previousLinkRevoked) => ({
    ok: true,
    channel: 'brandgeo',
    linkId: row.id,
    expiresAt: row.expiresAt,
    issuedAt: row.createdAt,
    previousLinkRevoked,
  })

  // Step 5: copy delivery. Rotation (step 4) just before the return.
  if (copy) {
    let revoked = true
    if (a.rotate) {
      const rot = await rotateSupabaseToken(supabase, user, row.id, nowFn)
      const over = rotationOverride(rot)
      if (over) return over
      revoked = rot.kind === 'ok'
    }
    console.log(`[invite-link] link ${row.id} user ${user.id}: issued for copy`)
    return Object.assign(brandgeo(revoked), { inviteUrl: buildInviteUrl(token) })
  }

  // Step 6: our email, raced against the timer.
  const sent = await sendWithTimeout(Object.assign({ to: user.email, kind: 'transactional' }, inviteEmail(a.clientName, buildInviteUrl(token))))
  if (sent.ok) {
    let revoked = true
    if (a.rotate) {
      // After Resend accepted the email, never before: a refused email must
      // leave the person's earlier Supabase link alive.
      const rot = await rotateSupabaseToken(supabase, user, row.id, nowFn)
      const over = rotationOverride(rot)
      if (over) return over
      revoked = rot.kind === 'ok'
    }
    console.log(`[invite-link] link ${row.id} user ${user.id}: emailed`)
    return brandgeo(revoked)
  }
  console.error(`[invite-link] link ${row.id} user ${user.id}: email not sent (${sent.category}, status ${sent.status}); using the Supabase invite`)
  // If this write fails the row stays active and the panel shows a 7 day
  // link nobody received (accepted, re-read INFO); the fallback still runs.
  await patchRow(supabase, row.id, { revoked_at: nowFn().toISOString(), revoked_reason: 'send_failed' }, 'send_failed')
  // Step 7. No rotation by us on this path: a successful fallback rotates
  // the token itself, a failed one leaves the person's earlier link alive.
  return fallbackInvite(supabase, user, nowFn)
}

module.exports = {
  INVITE_LINK_DAYS,
  INVITE_TOKEN_RE,
  SEND_TIMEOUT_MS,
  generateInviteToken,
  hashInviteToken,
  buildInviteUrl,
  isAccepted,
  channelEnabled,
  channelReady,
  deliverInvite,
}
