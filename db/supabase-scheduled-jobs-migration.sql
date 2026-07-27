DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret') THEN
    RAISE EXCEPTION 'vault secret "cron_secret" is missing. Set it before applying this migration (arch doc section 9 item 2).';
  END IF;
END $$;

-- ============================================================================
-- supabase-scheduled-jobs-migration.sql
--
-- Moves the scheduler for BrandGEO's recurring jobs off Netlify and onto
-- Supabase pg_cron + pg_net, and adds the job_runs table that finally makes
-- "did the job run, and what did it do" answerable in SQL.
--
-- Design: docs/arch/scheduled-function-auth.md. Build packet: 010.
-- Subject: docs/qa/deploy-pipeline-netlify.md F1 (five scheduled Netlify
-- functions accepted an unauthenticated public POST and did real work).
--
-- Why the scheduler moved at all: Netlify's scheduler sends only a
-- {"next_run": "..."} body. That is not a credential and cannot be verified, so
-- an auth gate was impossible while Netlify remained the caller. pg_cron can
-- send a header, is already proven firing daily in this project (jobid 1, 12
-- consecutive successful runs), and its history is queryable — which the
-- Netlify scheduler's never was by anyone working in this repo.
--
-- ORDER MATTERS. Apply this file BEFORE deploying the code that adds the
-- X-Cron-Key gate, and only AFTER the secret exists in both Netlify and Vault.
-- The jobs then send a header nothing is checking yet, which exercises the new
-- path end to end before anything depends on it (arch doc §8). A fail-closed
-- gate deployed ahead of the secret breaks every job.
--
-- Prerequisites, all verified present on 2026-07-27 before this file was written:
--   * pg_cron   1.6.4   installed (schema pg_catalog)
--   * pg_net    0.20.3  installed (functions live in schema `net`, not `extensions`)
--   * supabase_vault 0.3.1 installed, holding a secret named 'cron_secret'
--
-- Idempotent — safe to re-run. cron.schedule() updates in place when a job of
-- the same name already exists (pg_cron >= 1.4), and the table DDL is guarded.
-- ============================================================================


-- ── 1. job_runs — one row per invocation of each surviving HTTP job. ──────────
-- cron.job_run_details proves the REQUEST was issued, not that the function did
-- its work: pg_net is asynchronous, so the cron row succeeds the moment the
-- request is queued. net._http_response records the eventual status but Supabase
-- prunes it on a short horizon, making it a debugging aid rather than a record.
-- So each function writes here itself, on both the success and the failure path,
-- carrying the summary it already computes and previously only logged.
--
-- The two pure-SQL jobs below need nothing: cron.job_run_details already records
-- their "DELETE n" return message in full.
CREATE TABLE IF NOT EXISTS public.job_runs (
  id      bigserial   PRIMARY KEY,
  job     text        NOT NULL,          -- the function name, e.g. 'ping-sitemap'
  ran_at  timestamptz NOT NULL DEFAULT now(),
  ok      boolean     NOT NULL,
  detail  jsonb                          -- the run summary; shape is per-job
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job_ran_at
  ON public.job_runs (job, ran_at DESC);

-- RLS enabled with ZERO policies = deny-all to anon and authenticated. Only the
-- service_role key (the Netlify functions) writes it, via its RLS bypass. Same
-- locked-down posture as sitemap_pings / assistant_events / prospect_audits.
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
-- (No policies on purpose.)


-- ── 2. Retention: prospect_audits + prospect_leads. ───────────────────────────
-- Was purge-old-audits.js, a Netlify function that held the service key and
-- issued two DELETEs. It needed nothing from Node, so it is deleted rather than
-- gated: the endpoint stops existing instead of being defended.
--
-- Windows are unchanged from that file (90 / 180 days) and are policy choices,
-- not law — the rationale is preserved here so it is not lost with the file.
-- prospect_audits and prospect_leads are anonymous prospecting data, not a
-- paying client's records. A captured lead email has had 6 months to be worked
-- or pushed to HubSpot by the 180-day mark. Tune the intervals here; no schema
-- change is needed to change them.
--
-- prospect_leads.audit_id is ON DELETE SET NULL, so the two deletes are
-- independent and neither orphans the other's retention clock.
SELECT cron.schedule(
  'purge-old-prospect-audits',
  '5 4 * * *',
  $job$
    DELETE FROM public.prospect_audits WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.prospect_leads  WHERE created_at < NOW() - INTERVAL '180 days';
  $job$
);


-- ── 3. The three surviving HTTP jobs. ─────────────────────────────────────────
-- Each keeps something Postgres cannot do: ping-sitemap does Google OAuth and an
-- external sitemap fetch, expire-plan-grants sends a Resend email, and
-- schedule-collections uses the shared budget-limit and enqueue helpers.
--
-- THE SECRET IS NEVER WRITTEN INTO A COMMAND. cron.job.command is plain text and
-- readable by anyone who can query this database — which is every agent in this
-- OS. The command holds a Vault LOOKUP; the value is resolved at run time.
--
-- Schema-qualify net.http_post: Supabase registers the pg_net EXTENSION in
-- `extensions` but its FUNCTIONS live in `net`, and a pg_cron job does not
-- necessarily inherit a search_path containing either.
--
-- timeout_milliseconds := 30000 rather than the 5000 default. Two of these three
-- are allowed 26 seconds by netlify.toml, so the default would log a pg_net
-- timeout against a function that in fact completed. This governs how long
-- pg_net WAITS for a response, not how long the function may run.
--
-- Times are UTC and are deliberately offset 10 minutes from the old Netlify
-- slots. The migration lands before the deploy that removes the Netlify
-- schedules, so for one window both callers may fire; offsetting them means the
-- same job never runs concurrently with itself. That is not hypothetical —
-- sitemap_pings recorded two ping-sitemap runs 15 seconds apart on 2026-07-19,
-- racing on the same changed set, and neither reached its cap as a result.

-- Daily 05:10 UTC (was 05:00 on Netlify).
SELECT cron.schedule(
  'ping-sitemap',
  '10 5 * * *',
  $job$
    SELECT net.http_post(
      url     := 'https://app.getbrandgeo.com/.netlify/functions/ping-sitemap',
      body    := '{}'::jsonb,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'X-Cron-Key',   (SELECT decrypted_secret
                                      FROM vault.decrypted_secrets
                                     WHERE name = 'cron_secret')),
      timeout_milliseconds := 30000
    );
  $job$
);

-- Daily 06:10 UTC (was 06:00 on Netlify).
SELECT cron.schedule(
  'expire-plan-grants',
  '10 6 * * *',
  $job$
    SELECT net.http_post(
      url     := 'https://app.getbrandgeo.com/.netlify/functions/expire-plan-grants',
      body    := '{}'::jsonb,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'X-Cron-Key',   (SELECT decrypted_secret
                                      FROM vault.decrypted_secrets
                                     WHERE name = 'cron_secret')),
      timeout_milliseconds := 30000
    );
  $job$
);

-- Hourly at :10 (was :00 on Netlify). Inert while every client is on
-- refresh_cadence='manual', which all 36 currently are.
SELECT cron.schedule(
  'schedule-collections',
  '10 * * * *',
  $job$
    SELECT net.http_post(
      url     := 'https://app.getbrandgeo.com/.netlify/functions/schedule-collections',
      body    := '{}'::jsonb,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'X-Cron-Key',   (SELECT decrypted_secret
                                      FROM vault.decrypted_secrets
                                     WHERE name = 'cron_secret')),
      timeout_milliseconds := 30000
    );
  $job$
);


-- ── 4. NOT created here, on purpose: purge-old-ai-results (jobid 1). ──────────
-- It already exists, runs '0 3 * * *', and has succeeded every day since at
-- least 2026-07-16. Its command is:
--
--   DELETE FROM public.ai_results WHERE checked_at < NOW() - INTERVAL '24 months';
--
-- which is what purge-old-results.js was ALSO doing, on the same schedule,
-- against the same table. Two independent schedulers were running the same
-- retention job and nobody knew; it stayed harmless only because both delete
-- zero rows (no data on the platform is 24 months old yet). Packet 010 deletes
-- the Node copy and leaves this one alone.
--
-- Do not add a job for it here. Re-creating it under a second name would
-- reintroduce exactly the duplication this migration removes.


-- ── Verify ────────────────────────────────────────────────────────────────────
-- Expect FIVE active jobs: jobid 1 (pre-existing) plus the four created above.
--
-- select jobid, jobname, schedule, active from cron.job order by jobid;
--
-- No command may contain a secret literal — expect zero rows:
--
-- select jobid, jobname from cron.job
--  where command ilike '%X-Cron-Key%' and command not ilike '%decrypted_secrets%';
--
-- job_runs is locked down — expect rls_enabled = true, policy_count = 0:
--
-- select c.relname,
--        c.relrowsecurity as rls_enabled,
--        (select count(*) from pg_policies p
--          where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relname = 'job_runs';
--
-- After one full cycle of each job — every row should read 'succeeded':
--
-- select j.jobname, d.status, d.start_time, d.return_message
--   from cron.job_run_details d join cron.job j using (jobid)
--  order by d.start_time desc limit 20;
--
-- And what the functions themselves report (this is the part cron cannot tell
-- you, because pg_net succeeds the moment the request is queued):
--
-- select job, ran_at, ok, detail from public.job_runs order by ran_at desc limit 20;
