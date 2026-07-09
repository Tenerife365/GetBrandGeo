/**
 * _hubspot.js
 * Push a captured Instant Audit lead into HubSpot as a contact
 * (SALES-ENGINE.md §2.4 "Email → straight into HubSpot as a lead").
 *
 * Not wired up to any Claude/Cowork connector — this runs inside a deployed
 * Netlify function at request time, completely independent of any chat
 * session, so it must use HubSpot's own REST API with a private-app token
 * (HUBSPOT_API_KEY env var), the same way #106 wired Resend for transactional
 * email. If HUBSPOT_API_KEY isn't set yet (HubSpot connection was still "in
 * progress, Constantin confirming" as of SALES-ENGINE.md §6 item 4), this
 * degrades gracefully: the lead is still saved to `prospect_leads` with
 * hubspot_synced=false, and a future batch job (not built yet, flagged in
 * CLAUDE.md §10) can push the backlog once the token exists.
 */

async function pushLeadToHubSpot({ email, domain, auditToken, score, category }) {
  const apiKey = process.env.HUBSPOT_API_KEY
  if (!apiKey) {
    console.log('[HubSpot] HUBSPOT_API_KEY not set — lead saved locally only, not pushed')
    return { synced: false, contactId: null, reason: 'not_configured' }
  }

  try {
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        properties: {
          email,
          website: domain,
          lifecyclestage: 'lead',
          hs_lead_status: 'NEW',
          // Custom properties (brandgeo_audit_score / brandgeo_audit_category /
          // brandgeo_audit_token) must exist in HubSpot's contact property
          // schema before this fills reliably — HubSpot silently drops
          // properties it doesn't recognise rather than erroring, so this is
          // safe to send even before those custom fields are created; they
          // just won't populate until they exist. Flagged in CLAUDE.md §10.
          brandgeo_audit_score: score != null ? String(score) : undefined,
          brandgeo_audit_category: category || undefined,
          brandgeo_audit_token: auditToken,
          brandgeo_lead_source: 'instant_audit',
        },
      }),
    })
    const d = await r.json()
    if (!r.ok) {
      // 409 = contact already exists with this email — treat as a soft
      // success (they're already a HubSpot contact, nothing more to do here).
      if (r.status === 409) {
        console.log('[HubSpot] contact already exists for', email)
        return { synced: true, contactId: d.message?.match(/Existing ID:\s*(\d+)/)?.[1] || null, reason: 'already_exists' }
      }
      console.error('[HubSpot] push failed:', r.status, JSON.stringify(d).slice(0, 300))
      return { synced: false, contactId: null, reason: 'api_error' }
    }
    console.log('[HubSpot] contact created:', d.id)
    return { synced: true, contactId: d.id, reason: null }
  } catch (e) {
    console.error('[HubSpot] threw:', e.message)
    return { synced: false, contactId: null, reason: 'exception' }
  }
}

module.exports = { pushLeadToHubSpot }
