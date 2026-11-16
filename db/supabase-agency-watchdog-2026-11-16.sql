-- supabase-agency-watchdog-2026-11-16.sql
--
-- NOT APPLIED. Written 2026-11-16 by bg-backend (Opus) for release P1 of
-- docs/arch/agency-multi-brand.md, revision 4: section 8 guard 3 (an agency
-- brand must never carry a Stripe id) and the three standing checks of
-- section 4.4 (missing, stale, stray membership rows), added to the hourly
-- watchdog of db/supabase-observability-watchdog-2026-10-28.sql.
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new),
-- pasted as one batch, run as the editor's role (postgres).
--
-- APPLY ONLY AFTER db/supabase-agency-accounts-2026-11-16.sql (steps 1 and 2)
-- has been applied and read back. ops.watchdog_findings() is LANGUAGE sql, so
-- PostgreSQL validates its body at CREATE: before that file, public.accounts,
-- public.account_members and user_clients.grant_source do not exist and this
-- file fails as a whole (nothing changes). Recommended order: step 1+2 file,
-- step 3 file (db/supabase-agency-rls-group-b-2026-11-16.sql), this file,
-- then the step 4 dashboard push.
--
-- What it does: CREATE OR REPLACE of ops.watchdog_findings(). Every existing
-- line of the function, from "create or replace" to the last line of the
-- collection_jobs_failed branch, is copied verbatim from the repository file
-- db/supabase-observability-watchdog-2026-10-28.sql (lines 88 to 276), whose
-- body was proven equal to the live body on 2026-11-16 (md5 below, carriage
-- returns removed: the live copy was pasted with Windows line endings). Four
-- branches are appended after it, each a "union all" of one row at most:
--
--   alert_key                             fires when
--   agency_stripe_id:clients              an agency brand has stripe_customer_id or stripe_subscription_id
--   account_fanout_missing:user_clients   4.4 check 1: a member lacks a row on a brand of their account
--   account_fanout_stale:user_clients     4.4 check 2: an 'account' row has no membership behind it
--   account_fanout_stray:user_clients     4.4 check 3: a row on an agency brand held by neither a member
--                                         nor a login whose default brand it is (direct rows excluded)
--
-- Summaries carry counts only; evidence carries counts and at most 20 integer
-- ids (account or client ids), never a name, an email or a user id, matching
-- the rule of the original file. ops.watchdog_run(), ops.alert_log,
-- ops.watch_expectations and the cron job are not touched: the new findings
-- reach the existing hourly digest by themselves. No watch_expectations row is
-- needed (these are state checks, not job checks).
--
-- What to do when one fires (to be added to docs/ops/alerting-runbook.md
-- section 2 by its owner; this file cannot edit that document):
--   agency_stripe_id: a staff member or guest paid a public payment link and
--     the webhook wrote a Stripe id on an agency brand (spec section 8). Read
--     the brand's client_events and admin_notifications; refund or re-home the
--     subscription by hand in Stripe; clear the id only after Stripe is settled.
--   account_fanout_missing / _stale / _stray: a membership row was written or
--     removed outside the 4.6 functions. Run the matching 4.4 query (in the
--     header of db/supabase-agency-accounts-2026-11-16.sql, R1.6), then
--     select public.account_reconcile(<account_id>); as postgres for missing
--     and stale. A stray row is removed with account_remove_guest, never by a
--     hand DELETE without recording why.
--
-- ============================================================================
-- PRE-APPLY CHECK (read only)
-- ============================================================================
-- W0: the live body is still the one this file copies
-- select md5(replace(prosrc, E'\r', '')) as md5, length(replace(prosrc, E'\r', '')) as len
--   from pg_proc where oid = 'ops.watchdog_findings()'::regprocedure;
--   -- EXPECT md5 0fc8dea647437615df5472c2952d29e6, len 7637 (read 2026-11-16).
--   -- A different answer STOPS the apply: someone changed the watchdog since,
--   -- and this file would drop that change.
--
-- ============================================================================
-- READ-BACK (read only), after commit
-- ============================================================================
-- W1: every existing check is byte for byte what it was (the first 7637
-- characters of the new body are the whole old body)
-- select md5(left(replace(prosrc, E'\r', ''), 7637)) = '0fc8dea647437615df5472c2952d29e6' as old_checks_unchanged,
--        length(replace(prosrc, E'\r', '')) > 7637 as new_checks_appended
--   from pg_proc where oid = 'ops.watchdog_findings()'::regprocedure;
--   -- EXPECT t, t
--
-- W2: grants and settings unchanged
-- select (select array_agg(a::text order by a::text) from unnest(proacl) a)::text as acl,
--        prosecdef, proconfig, provolatile
--   from pg_proc where oid = 'ops.watchdog_findings()'::regprocedure;
--   -- EXPECT {postgres=X/postgres}, f, {"search_path=\"\""}, s
--
-- W3: dry run, sends nothing
-- select alert_key, summary, evidence from ops.watchdog_findings()
--  where kind in ('agency_stripe_id', 'account_fanout_missing', 'account_fanout_stale', 'account_fanout_stray');
--   -- EXPECT 0 rows (no agency exists before step 5, and R1.6 answered 0)
-- select count(*) from ops.watchdog_findings();
--   -- EXPECT the same count as before this file (run it before applying too)
--
-- W4: V11, the finding really fires on a violating row: section R4 of
-- db/supabase-agency-readback-2026-11-16.sql (rolled back, writes nothing).
--
-- ============================================================================
-- ROLLBACK (by hand): re-run PART A's create or replace of
-- ops.watchdog_findings() from db/supabase-observability-watchdog-2026-10-28.sql
-- (lines 88 to 277), then check W0 answers md5 0fc8dea647437615df5472c2952d29e6.
-- Required BEFORE the step 1+2 rollback drops public.accounts: a LANGUAGE sql
-- function that reads a dropped table makes the hourly watchdog_run() fail.
-- ============================================================================

begin;

create or replace function ops.watchdog_findings()
returns table (alert_key text, kind text, subject text, summary text, evidence jsonb)
language sql
stable
security invoker
set search_path = ''
as $fn$
  with
  exp as (
    select e.job, e.source, e.max_silence, e.consecutive
      from ops.watch_expectations e
     where e.enabled
       and e.job <> 'obs-watchdog'
  ),

  -- job_failed, job_runs source: the newest `consecutive` rows all fail.
  -- A row fails on ok = false, on detail ? 'error', or (ping-sitemap only)
  -- when it attempted submissions and IndexNow accepted none. The numeric
  -- casts are guarded so one malformed detail cannot abort the whole run.
  jr_recent as (
    select x.job, x.consecutive, r.rn, r.ok, r.detail,
           (   r.ok = false
            or r.detail ? 'error'
            or (    x.job = 'ping-sitemap'
                and (case when r.detail->>'attempted' ~ '^[0-9]+$'
                          then (r.detail->>'attempted')::int else 0 end) > 0
                and (case when r.detail->>'indexnowOk' ~ '^[0-9]+$'
                          then (r.detail->>'indexnowOk')::int else 0 end) = 0)
           ) as failed
      from exp x
      cross join lateral (
        select j.ok, j.detail,
               row_number() over (order by j.ran_at desc, j.id desc) as rn
          from public.job_runs j
         where j.job = x.job
         order by j.ran_at desc, j.id desc
         limit greatest(x.consecutive, 2)
      ) r
     where x.source = 'job_runs'
  ),
  jr_failed as (
    select a.job,
           a.consecutive,
           count(*) filter (where a.rn <= a.consecutive)                 as rows_read,
           bool_and(a.failed) filter (where a.rn <= a.consecutive)       as all_failed,
           -- ping-sitemap second clause, its own count of 2 whatever consecutive says
           (a.job = 'ping-sitemap'
            and count(*) filter (where a.rn <= 2) = 2
            and bool_and(coalesce(a.detail->>'note', '') = 'no urls parsed')
                  filter (where a.rn <= 2))                              as no_urls_twice
      from jr_recent a
     group by a.job, a.consecutive
  ),

  -- job_failed, cron source: the latest cron.job_run_details row did not succeed.
  cron_latest as (
    select x.job, d.status, d.start_time
      from exp x
      join cron.job c on c.jobname = x.job
      cross join lateral (
        select jd.status, jd.start_time
          from cron.job_run_details jd
         where jd.jobid = c.jobid
         order by jd.start_time desc nulls last, jd.runid desc
         limit 1
      ) d
     where x.source = 'cron'
  ),

  -- job_silent: no run newer than now() - max_silence.
  last_seen as (
    select x.job, x.max_silence,
           case x.source
             when 'job_runs' then (select max(j.ran_at) from public.job_runs j where j.job = x.job)
             else (select max(jd.start_time)
                     from cron.job_run_details jd
                     join cron.job c on c.jobid = jd.jobid
                    where c.jobname = x.job)
           end as newest
      from exp x
  ),

  -- engine rules over the trailing 24 hours. checked_at is timestamp WITHOUT
  -- time zone, written in UTC, so the window is computed in UTC.
  eng as (
    select r.llm,
           count(*)                                   as total,
           count(*) filter (where r.status = 'ok')    as ok_rows,
           count(*) filter (where r.status = 'error') as error_rows
      from public.ai_results r
     where r.checked_at > (now() at time zone 'utc') - interval '24 hours'
     group by r.llm
  ),

  cj as (
    select count(*) filter (where j.status = 'failed'
                              and j.finished_at > now() - interval '24 hours')        as failed_24h,
           count(*) filter (where j.status not in ('done', 'failed')
                              and coalesce(j.scheduled_for, j.created_at)
                                  < now() - interval '2 hours')                       as stuck
      from public.collection_jobs j
  )

  -- job_failed (job_runs)
  select 'job_failed:' || f.job, 'job_failed', f.job,
         case when coalesce(f.all_failed, false) and f.rows_read = f.consecutive
              then 'The last ' || f.consecutive || ' run(s) of ' || f.job || ' failed.'
              else 'The last 2 runs of ' || f.job || ' parsed no URLs from the sitemap.'
         end,
         jsonb_build_object('source', 'job_runs',
                            'consecutive', f.consecutive,
                            'all_failed', coalesce(f.all_failed, false) and f.rows_read = f.consecutive,
                            'no_urls_twice', coalesce(f.no_urls_twice, false))
    from jr_failed f
   where (coalesce(f.all_failed, false) and f.rows_read = f.consecutive)
      or coalesce(f.no_urls_twice, false)

  union all

  -- job_failed (cron)
  select 'job_failed:' || c.job, 'job_failed', c.job,
         'The latest run of cron job ' || c.job || ' ended with status ' || coalesce(c.status, 'unknown') || '.',
         jsonb_build_object('source', 'cron', 'status', c.status, 'start_time', c.start_time)
    from cron_latest c
   where c.status not in ('succeeded', 'starting', 'running', 'connecting', 'sending')   -- in-progress runs are not failures

  union all

  -- job_silent
  select 'job_silent:' || s.job, 'job_silent', s.job,
         s.job || ' has not run within ' || s.max_silence::text || '.',
         jsonb_build_object('newest', s.newest, 'max_silence', s.max_silence::text)
    from last_seen s
   where s.newest is null
      or s.newest < now() - s.max_silence

  union all

  -- job_unscheduled: enabled expectation with no active cron.job row
  select 'job_unscheduled:' || x.job, 'job_unscheduled', x.job,
         x.job || ' is expected but has no active cron job.',
         jsonb_build_object('cron_row', c.jobid is not null, 'active', c.active)
    from exp x
    left join cron.job c on c.jobname = x.job
   where c.jobid is null
      or c.active = false

  union all

  -- job_unwatched: active cron job with no expectation row, enabled or not
  select 'job_unwatched:' || coalesce(c.jobname, 'jobid-' || c.jobid::text), 'job_unwatched',
         coalesce(c.jobname, 'jobid-' || c.jobid::text),
         'Cron job ' || coalesce(c.jobname, 'jobid-' || c.jobid::text) || ' is active but nothing watches it.',
         jsonb_build_object('jobid', c.jobid, 'schedule', c.schedule)
    from cron.job c
   where c.active
     and coalesce(c.jobname, '') <> 'obs-watchdog'
     and not exists (select 1 from ops.watch_expectations e where e.job = c.jobname)

  union all

  -- engine_down: 2 or more error rows and no ok row in 24 hours
  select 'engine_down:' || g.llm, 'engine_down', g.llm,
         'Engine ' || g.llm || ' returned ' || g.error_rows || ' errors and no successful answer in 24 hours.',
         jsonb_build_object('total', g.total, 'ok', g.ok_rows, 'error', g.error_rows)
    from eng g
   where g.error_rows >= 2
     and g.ok_rows = 0

  union all

  -- engine_degraded: 10 or more rows, at least 1 ok, error share 50% or more
  select 'engine_degraded:' || g.llm, 'engine_degraded', g.llm,
         'Engine ' || g.llm || ' failed ' || g.error_rows || ' of ' || g.total || ' calls in 24 hours.',
         jsonb_build_object('total', g.total, 'ok', g.ok_rows, 'error', g.error_rows)
    from eng g
   where g.total >= 10
     and g.ok_rows >= 1
     and g.error_rows * 2 >= g.total

  union all

  -- collection_jobs_failed
  select 'collection_jobs_failed:collection_jobs', 'collection_jobs_failed', 'collection_jobs',
         q.failed_24h || ' collection job(s) failed in 24 hours and ' || q.stuck || ' are stuck for over 2 hours.',
         jsonb_build_object('failed_24h', q.failed_24h, 'stuck', q.stuck)
    from cj q
   where q.failed_24h > 0
      or q.stuck > 0

  union all

  -- agency_stripe_id: an agency brand carries a Stripe id
  -- (docs/arch/agency-multi-brand.md section 8, guard 3). Agency brands are
  -- invoiced by hand in release P1.
  select 'agency_stripe_id:clients', 'agency_stripe_id', 'clients',
         s.n || ' agency brand(s) carry a Stripe customer or subscription id.',
         jsonb_build_object('count', s.n, 'client_ids', s.ids)
    from (select count(*) as n,
                 (array_agg(c.id order by c.id))[1:20] as ids
            from public.clients c
            join public.accounts a on a.id = c.account_id
           where a.kind = 'agency'
             and (c.stripe_customer_id is not null or c.stripe_subscription_id is not null)) s
   where s.n > 0

  union all

  -- account_fanout_missing: an account member without a membership row on a
  -- brand of their account (agency spec 4.4, check 1)
  select 'account_fanout_missing:user_clients', 'account_fanout_missing', 'user_clients',
         m.n || ' account member row(s) lack a membership row on a brand of their account.',
         jsonb_build_object('count', m.n, 'account_ids', m.ids)
    from (select count(*) as n,
                 (array_agg(distinct am.account_id order by am.account_id))[1:20] as ids
            from public.account_members am
            join public.clients c on c.account_id = am.account_id
            left join public.user_clients uc on uc.user_id = am.user_id and uc.client_id = c.id
           where uc.user_id is null) m
   where m.n > 0

  union all

  -- account_fanout_stale: an 'account' membership row with no account
  -- membership behind it (agency spec 4.4, check 2)
  select 'account_fanout_stale:user_clients', 'account_fanout_stale', 'user_clients',
         t.n || ' account membership row(s) have no account member behind them.',
         jsonb_build_object('count', t.n, 'client_ids', t.ids)
    from (select count(*) as n,
                 (array_agg(distinct uc.client_id order by uc.client_id))[1:20] as ids
            from public.user_clients uc
            join public.clients c on c.id = uc.client_id
           where uc.grant_source = 'account'
             and not exists (select 1 from public.account_members am
                              where am.user_id = uc.user_id and am.account_id = c.account_id)) t
   where t.n > 0

  union all

  -- account_fanout_stray: a row on an agency brand held by neither a member of
  -- that account nor a login whose default brand it is; direct rows are P3's
  -- (agency spec 4.4, check 3)
  select 'account_fanout_stray:user_clients', 'account_fanout_stray', 'user_clients',
         r.n || ' membership row(s) on agency brands belong to no member and no default login.',
         jsonb_build_object('count', r.n, 'client_ids', r.ids)
    from (select count(*) as n,
                 (array_agg(distinct uc.client_id order by uc.client_id))[1:20] as ids
            from public.user_clients uc
            join public.clients c on c.id = uc.client_id
            join public.accounts a on a.id = c.account_id and a.kind = 'agency'
           where not exists (select 1 from public.account_members am
                              where am.user_id = uc.user_id and am.account_id = a.id)
             and not exists (select 1 from public.user_profiles p
                              where p.id = uc.user_id and p.client_id = uc.client_id)
             and uc.grant_source <> 'direct') r
   where r.n > 0
$fn$;

-- the same revoke as db/supabase-observability-watchdog-2026-10-28.sql
-- (CREATE OR REPLACE keeps the existing grants; this restates them)
revoke execute on function ops.watchdog_findings()                      from public, anon, authenticated;

commit;
