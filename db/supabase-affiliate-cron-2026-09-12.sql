-- ============================================================================
-- supabase-affiliate-cron-2026-09-12.sql
-- Optional pg_cron jobs for the affiliate module. Requires
-- db/supabase-affiliate-migration-2026-09-12.sql. Idempotent: each job is
-- unscheduled by name before it is scheduled, so re-running replaces it.
--
-- Two jobs, both pure SQL, no HTTP, no secrets:
--
--   affiliate-retention (04:35 UTC daily)
--     Deletes raw click rows older than 90 days and rate-limit counters older
--     than a day. Clicks are tracking data (GDPR minimisation, README section
--     "Privacy"); the counts that matter live on affiliate_memberships
--     (clicks_total, clicks_last_at) and are untouched. An attribution that
--     pointed at a purged visit keeps its visit_token and gets visit_id NULL
--     (ON DELETE SET NULL), so nothing financial changes.
--
--   affiliate-mature (04:40 UTC daily)
--     Moves pending commissions whose approval delay has passed to approved,
--     when the conversion is still confirmed. The admin overview runs the same
--     function on every load, so this job only matters on days nobody opens
--     the admin page; it exists so approval dates are not gated on a login.
--
-- Minutes 35 and 40 avoid :10 (schedule-collections) and :20 (the inbound
-- reply poller). Never call cron.unschedule on a job you want to pause; use
-- cron.alter_job(job_id => <id>, active => false), which keeps the row.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'affiliate-retention') THEN
    PERFORM cron.unschedule('affiliate-retention');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'affiliate-mature') THEN
    PERFORM cron.unschedule('affiliate-mature');
  END IF;
END $$;

SELECT cron.schedule(
  'affiliate-retention',
  '35 4 * * *',
  $job$
    DELETE FROM public.affiliate_visits      WHERE created_at   < now() - interval '90 days';
    DELETE FROM public.affiliate_rate_limits WHERE window_start < now() - interval '1 day';
  $job$
);

SELECT cron.schedule(
  'affiliate-mature',
  '40 4 * * *',
  $job$ SELECT public.affiliate_mature_commissions(); $job$
);

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname LIKE 'affiliate-%';
-- SELECT jobid, status, start_time, return_message FROM cron.job_run_details
--   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'affiliate-%')
--   ORDER BY start_time DESC LIMIT 10;
