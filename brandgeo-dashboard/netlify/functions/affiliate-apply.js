/**
 * affiliate-apply.js -- POST, public. The application form on
 * getbrandgeo.com/affiliates.html.
 *
 * POST { program, full_name, email, company?, website?, social_url?, country,
 *        promo_method, payout_method?, terms_accepted, privacy_accepted,
 *        website_url? (honeypot) }
 *   -> 201 { ok: true }            application stored, admin notified
 *   -> 200 { ok: true }            honeypot filled: looks like success, stores nothing
 *   -> 400 { error }               validation
 *   -> 404 { error }               program not open for applications
 *   -> 409 { error }               already applied / already a member
 *   -> 429 { error }               rate limited
 *
 * What it creates: ONE affiliate_applications row (status pending). It never
 * creates an affiliates row, a membership or a login; the admin's approve
 * action does that, so a public form cannot mint anything that earns money.
 *
 * Rate limits live in Postgres (affiliate_rate_check), keyed by a salted IP
 * hash: 5 applications per hour per IP, 3 per day per email. No raw IP stored.
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, err, hashIp, PUBLIC_ALLOWED_ORIGINS } = require('./_prospect_guard')
const core = require('./_affiliate_core')
const emails = require('./_affiliate_email')
const service = require('./_affiliate_service')

async function handle(event, { supabase = null } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  const headers = corsHeaders(origin)
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return err(403, 'Forbidden: origin not allowed', origin)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return err(400, 'Invalid JSON', origin) }

  // Honeypot: a bot that fills the hidden field gets a success shape and nothing stored.
  if (body.website_url) return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }

  const { errors, row } = core.validateApplication(body)
  if (errors.length) return { statusCode: 400, headers, body: JSON.stringify({ error: errors[0], errors }) }

  const db = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const program = await service.getProgramBySlug(db, String(body.program || '').toLowerCase())
  if (!program || program.status !== 'active' || !program.is_public) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'This program is not open for applications' }) }
  }

  const ipHash = hashIp(event)
  const { data: ipOk } = await db.rpc('affiliate_rate_check', { p_key: `apply:ip:${ipHash}`, p_limit: 5, p_window_seconds: 3600 })
  if (ipOk === false) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many applications from this connection. Please try again in an hour.' }) }
  const { data: emailOk } = await db.rpc('affiliate_rate_check', { p_key: `apply:email:${core.hashEmail(row.email)}`, p_limit: 3, p_window_seconds: 86400 })
  if (emailOk === false) return { statusCode: 429, headers, body: JSON.stringify({ error: 'This email has already applied today.' }) }

  // One pending application per email per program; an existing member is told so.
  const { data: existingApps } = await db.from('affiliate_applications').select('id, status').eq('program_id', program.id).eq('email', row.email).eq('status', 'pending').limit(1)
  if (existingApps && existingApps[0]) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'You already have an application in review for this program.' }) }
  }
  const { data: existingAff } = await db.from('affiliates').select('id').eq('email', row.email).limit(1)
  if (existingAff && existingAff[0]) {
    const { data: mem } = await db.from('affiliate_memberships').select('id, status').eq('affiliate_id', existingAff[0].id).eq('program_id', program.id).limit(1)
    if (mem && mem[0] && mem[0].status === 'active') {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'You are already an affiliate of this program. Sign in to your dashboard.' }) }
    }
  }

  const { data: application, error } = await db.from('affiliate_applications').insert({
    program_id: program.id,
    affiliate_id: existingAff && existingAff[0] ? existingAff[0].id : null,
    ...row,
    ip_hash: ipHash,
    user_agent: String(event.headers['user-agent'] || '').slice(0, 300),
  }).select('*').single()
  if (error) {
    console.error('[affiliate-apply] insert failed:', error.message)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'We could not save your application. Please try again.' }) }
  }

  await service.audit(db, { actor: { type: 'public', label: row.email }, action: 'application.submitted', entityType: 'application', entityId: application.id, programId: program.id })
  await emails.sendApplicationReceived({ application, program })
  await emails.notifyAdminNewApplication({ application, program })

  console.log(`[affiliate-apply] application ${application.id} for ${program.slug} from ${core.maskEmail(row.email)}`)
  return { statusCode: 201, headers, body: JSON.stringify({ ok: true }) }
}

exports.handler = (event) => handle(event)
exports.handle = handle
