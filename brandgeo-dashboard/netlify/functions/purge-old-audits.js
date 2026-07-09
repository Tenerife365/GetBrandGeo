/**
 * purge-old-audits.js
 * Scheduled Netlify function — runs daily at 04:00 UTC (offset an hour from
 * purge-old-results.js's 03:00 run so they don't overlap).
 *
 * GDPR minimal-retention support for the Instant Audit Engine
 * (SALES-ENGINE.md §5 "store only what you need", CLAUDE.md §10 Component A
 * item 6). Prospect audits are anonymous marketing/prospecting data, not a
 * paying client's records — there's no reason to keep them indefinitely:
 *   - prospect_audits older than 90 days: deleted outright.
 *   - prospect_leads older than 180 days: deleted outright (a captured email
 *     has had 6 months to be worked/pushed to HubSpot by then; longer
 *     retention of an unconverted lead's email isn't needed for the
 *     legitimate-interest basis this data was collected under).
 * Both windows are policy choices, not law — easy to tune here if Constantin
 * wants a different retention window; no migration needed to change these.
 */

const { createClient } = require('@supabase/supabase-js')

const AUDIT_RETENTION_DAYS = 90
const LEAD_RETENTION_DAYS  = 180

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const auditCutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 86_400_000).toISOString()
  const leadCutoff   = new Date(Date.now() - LEAD_RETENTION_DAYS  * 86_400_000).toISOString()

  const { error: auditErr, count: auditCount } = await supabase
    .from('prospect_audits').delete({ count: 'exact' }).lt('created_at', auditCutoff)

  if (auditErr) console.error('[PurgeAudits] prospect_audits delete failed:', auditErr.message)

  // Leads are ON DELETE SET NULL on audit_id, so this runs independently of
  // the audit purge above and never orphans a lead's own retention clock.
  const { error: leadErr, count: leadCount } = await supabase
    .from('prospect_leads').delete({ count: 'exact' }).lt('created_at', leadCutoff)

  if (leadErr) console.error('[PurgeAudits] prospect_leads delete failed:', leadErr.message)

  const summary = `Deleted ${auditCount ?? 0} prospect_audits (>${AUDIT_RETENTION_DAYS}d) and ${leadCount ?? 0} prospect_leads (>${LEAD_RETENTION_DAYS}d)`
  console.log(`[PurgeAudits] ${summary}`)

  if (auditErr || leadErr) return { statusCode: 500, body: summary }
  return { statusCode: 200, body: summary }
}
