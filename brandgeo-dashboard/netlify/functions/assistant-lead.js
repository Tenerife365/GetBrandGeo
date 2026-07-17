/**
 * assistant-lead.js — PUBLIC lead capture from the site chat assistant
 * (ASSISTANT-SPEC.md §4). Collects the minimum — name, work email, a one-line
 * "what do you need" — plus an optional company domain, and:
 *   1) pushes the lead into HubSpot as a contact, tagged source `assistant`
 *      (system of record — same private-app-token pattern as _hubspot.js), and
 *   2) always logs a local backup row in `assistant_events` (kind='lead') so a
 *      lead is never lost even if HubSpot is unconfigured or the API fails
 *      (mirrors _hubspot.js's degrade-to-local-storage behaviour).
 *
 * PUBLIC + UNAUTHENTICATED (marketing-site visitors). Reuses the public guard
 * helpers for CORS + per-IP hashing. GDPR: only a salted IP hash is stored,
 * never a raw IP (CLAUDE.md §11).
 *
 * CONTRACT
 *   POST /.netlify/functions/assistant-lead
 *   Body: { name, email, need?, reason?, domain?, honeypot? }
 *   200:  { ok: true }         — lead accepted (HubSpot push is best-effort)
 *   400:  { error }            — missing/invalid name or email
 *   429:  { error }            — per-IP daily lead cap hit
 */

const { createClient } = require('@supabase/supabase-js')
const {
  corsHeaders, preflight, hashIp, isPlausibleDomain, normalizeDomain,
} = require('./_prospect_guard')

const DAILY_LEAD_CAP = 10   // per-IP/day — abuse guard on the lead endpoint
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Push an assistant lead into HubSpot as a contact. Degrades gracefully. */
async function pushAssistantLead({ name, email, domain, need, reason }) {
  const apiKey = process.env.HUBSPOT_API_KEY
  if (!apiKey) {
    console.log('[Assistant-Lead] HUBSPOT_API_KEY not set — logged locally only')
    return { synced: false, reason: 'not_configured' }
  }
  try {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        properties: {
          email,
          firstname: name || undefined,
          website: domain || undefined,
          lifecyclestage: 'lead',
          hs_lead_status: 'NEW',
          // Custom properties — HubSpot silently drops any it doesn't recognise,
          // so these are safe to send before the fields exist in the portal
          // (they simply won't populate until created). The full lead is also
          // stored in assistant_events regardless, so nothing is lost.
          brandgeo_lead_source: 'assistant',
          brandgeo_lead_reason: reason || undefined,
          brandgeo_lead_message: need || undefined,
        },
      }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      if (r.status === 409) {
        console.log('[Assistant-Lead] contact already exists for', email)
        return { synced: true, reason: 'already_exists' }
      }
      console.error('[Assistant-Lead] HubSpot push failed:', r.status, JSON.stringify(d).slice(0, 300))
      return { synced: false, reason: 'api_error' }
    }
    console.log('[Assistant-Lead] contact created:', d.id)
    return { synced: true, contactId: d.id, reason: null }
  } catch (e) {
    console.error('[Assistant-Lead] HubSpot threw:', e.message)
    return { synced: false, reason: 'exception' }
  }
}

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  const headers = corsHeaders(origin)

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }

  // Honeypot: silently accept so a bot doesn't learn it was rejected.
  if (body.honeypot) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : ''
  const need = typeof body.need === 'string' ? body.need.trim().slice(0, 1000) : ''
  const reasonRaw = typeof body.reason === 'string' ? body.reason.trim().toLowerCase() : 'sales'
  const reason = ['sales', 'audit', 'support'].includes(reasonRaw) ? reasonRaw : 'sales'
  const domain = body.domain && isPlausibleDomain(normalizeDomain(body.domain))
    ? normalizeDomain(body.domain) : ''

  if (!name || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please share your name and a valid email.' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const ipHash = hashIp(event)

  // Per-IP daily lead cap.
  try {
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
    const { count } = await supabase
      .from('assistant_events')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('kind', 'lead')
      .gte('created_at', dayAgo)
    if (count !== null && count >= DAILY_LEAD_CAP) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: "You've reached today's submission limit. Please email us at support@getbrandgeo.com." }) }
    }
  } catch (e) {
    console.warn('[Assistant-Lead] rate-limit check failed (continuing):', e.message)
  }

  // Local backup — the durable system of record, independent of HubSpot.
  const { error: logErr } = await supabase.from('assistant_events').insert([{
    ip_hash: ipHash,
    kind: 'lead',
    meta: { name, email, need, reason, domain: domain || null },
  }])
  if (logErr) console.error('[Assistant-Lead] local log failed:', logErr.message)

  const hs = await pushAssistantLead({ name, email, domain, need, reason })
  console.log(`[Assistant-Lead] ${email} reason:${reason} hubspot:${hs.synced ? 'synced' : 'local-only:' + hs.reason}`)

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
}

module.exports.pushAssistantLead = pushAssistantLead
