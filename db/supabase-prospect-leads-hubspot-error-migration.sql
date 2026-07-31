-- ============================================================================
-- prospect_leads.hubspot_error — say WHY a lead did not reach HubSpot
-- docs/qa/acquisition-funnel-audit.md F6. Applied 2026-07-31.
--
-- The funnel has produced exactly one lead in 22 days and it sat at
-- hubspot_synced = false with no contact id and no error text, which is
-- indistinguishable at a glance from a lead that was never attempted, from one
-- rejected by the API, and from a deployment with no HUBSPOT_API_KEY set at all.
-- (It was the last of those: the key is not set on the dashboard site, confirmed
-- 2026-07-31.) A silent false is the defect, not just the missing sync.
--
-- Same shape as the job_runs.ok finding carried in CLAUDE.md: a boolean that
-- reports whether something was CONFIGURED rather than whether it WORKED.
--
-- _hubspot.js has always returned a reason alongside the boolean
-- ('not_configured', 'api_error', 'exception', 'already_exists');
-- unlock-audit-report.js discarded it. This column is where it now lands.
--
-- NULL on success, on purpose: the column reads as an exception log, so
-- `where hubspot_error is not null` is the backlog of leads needing a retry once
-- the key exists.
-- ============================================================================

ALTER TABLE prospect_leads ADD COLUMN IF NOT EXISTS hubspot_error text;

COMMENT ON COLUMN prospect_leads.hubspot_error IS
  'Why the HubSpot push did not land: not_configured | api_error | exception | unknown. NULL when hubspot_synced is true.';

-- The backlog this makes queryable:
--   select hubspot_error, count(*) from prospect_leads
--   where not hubspot_synced group by hubspot_error;
