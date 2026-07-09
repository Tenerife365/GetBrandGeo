/**
 * unlock-audit-report.js
 * Email-gate for the Instant Audit Engine's full report (SALES-ENGINE.md
 * §2.4 "gate the full report behind an email... straight into HubSpot as a
 * lead"). POST { token, email, honeypot? } -> marks the audit unlocked,
 * upserts a prospect_leads row, and best-effort pushes to HubSpot (see
 * _hubspot.js — degrades gracefully if HUBSPOT_API_KEY isn't set yet).
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, err, PUBLIC_ALLOWED_ORIGINS } = require('./_prospect_guard')
const { pushLeadToHubSpot } = require('./_hubspot')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(origin), body: 'Method Not Allowed' }
  if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return err(403, 'Forbidden: origin not allowed', origin)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return err(400, 'Invalid JSON', origin) }

  if (body.honeypot) {
    // Bot-guard (same convention as _prospect_guard.js's guardPublicRequest) —
    // pretend success rather than reveal the check to a bot form-filler.
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true }) }
  }

  const token = body.token
  const email = String(body.email || '').trim().toLowerCase()
  if (!token) return err(400, 'Missing token', origin)
  if (!EMAIL_RE.test(email)) return err(400, 'Please enter a valid email address', origin)

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: audit, error: fetchErr } = await supabase.from('prospect_audits').select('*').eq('token', token).single()
  if (fetchErr || !audit) return err(404, 'Audit not found', origin)

  const nowIso = new Date().toISOString()
  const { error: updErr } = await supabase.from('prospect_audits').update({
    unlocked: true, email, email_captured_at: nowIso, updated_at: nowIso,
  }).eq('id', audit.id)
  if (updErr) {
    console.error('[Unlock] update failed:', updErr.message)
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Could not unlock report. Please try again.' }) }
  }

  const hubspotResult = await pushLeadToHubSpot({
    email, domain: audit.domain, auditToken: token, score: audit.ai_score, category: audit.category,
  })

  await supabase.from('prospect_leads').insert([{
    audit_id: audit.id, domain: audit.domain, email,
    source: 'instant_audit',
    hubspot_synced: hubspotResult.synced,
    hubspot_contact_id: hubspotResult.contactId,
    created_at: nowIso,
  }])

  console.log(`[Unlock] audit:${audit.id} email:${email} hubspot_synced:${hubspotResult.synced}`)

  return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true, token }) }
}
