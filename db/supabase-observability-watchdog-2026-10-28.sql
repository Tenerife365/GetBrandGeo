-- ============================================================================
-- supabase-observability-watchdog-2026-10-28.sql
--
-- The ops watchdog: a pg_cron job that reads job_runs, cron, ai_results and
-- collection_jobs once an hour and emails new findings through Resend.
-- Binding design: docs/arch/observability.md section 3.6 (predicates, the
-- prev_ok rule, the run steps) and section 11 steps 7 to 9 (order).
-- Operator steps: docs/ops/alerting-runbook.md steps 5, 8 and 9.
--
-- TWO PARTS. Run PART A alone, read it back, run the dry run and the proof
-- email (section 11 steps 7 and 8). Only then run PART B, which is the single
-- cron.schedule statement at the end of this file. PART B is commented out so
-- that pasting the whole file cannot schedule the job by accident; run it by
-- copying the one statement without the leading "-- ".
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new).
--
-- Prerequisites: pg_cron and pg_net are enabled (they are); Vault holds
-- resend_api_key and alert_email (runbook step 5). PART A works without the
-- secrets; watchdog_send_test() and a run with findings need them.
--
-- Additive only. Touches no existing table, column, policy or job.
--
-- Rollback, in this order:
--   select cron.unschedule('obs-watchdog');      -- only if PART B was run
--   drop schema ops cascade;
--   delete from vault.secrets where name in ('resend_api_key', 'alert_email');
-- The obs-watchdog rows already written to public.job_runs stay as history.
-- ============================================================================


-- ============================================================================
-- PART A: objects, no schedule
-- ============================================================================

create schema if not exists ops;                       -- not in PostgREST exposed schemas
revoke all on schema ops from public, anon, authenticated;

create table if not exists ops.watch_expectations (
  job          text primary key,                       -- cron.job.jobname, or a job_runs.job value
  source       text not null check (source in ('job_runs', 'cron')),
  max_silence  interval not null,                      -- 2x the schedule interval
  consecutive  integer not null default 1 check (consecutive between 1 and 5),
  enabled      boolean not null default true,
  note         text
);

-- Nine rows. Every active cron job in production (read 2026-10-28) has a row,
-- so job_unwatched reports nothing on the first run. The obs-watchdog row
-- exists only so job_unwatched does not report the watchdog's own cron job;
-- it is also excluded from every job_* kind by name in watchdog_findings(),
-- so flipping enabled cannot make it alert on itself.
insert into ops.watch_expectations (job, source, max_silence, consecutive, enabled, note) values
  ('schedule-collections',      'job_runs', interval '2 hours',  2, true,  null),
  ('ping-sitemap',              'job_runs', interval '48 hours', 1, true,  null),
  ('expire-plan-grants',        'job_runs', interval '48 hours', 1, true,  null),
  ('purge-old-ai-results',      'cron',     interval '48 hours', 1, true,  null),
  ('purge-old-prospect-audits', 'cron',     interval '48 hours', 1, true,  null),
  ('affiliate-retention',       'cron',     interval '48 hours', 1, true,  null),
  ('affiliate-mature',          'cron',     interval '48 hours', 1, true,  null),
  ('obs-watchdog',              'job_runs', interval '3 hours',  1, false,
     'self: never alerted on by itself; health.js reads job_runs directly'),
  ('poll-inbound-replies',      'job_runs', interval '2 hours',  1, false,
     'not scheduled, needs GMAIL_* first')
on conflict (job) do nothing;                          -- re-run safe: never overwrites an edited row

create table if not exists ops.alert_log (
  alert_key   text not null,                            -- e.g. 'job_failed:ping-sitemap'
  day         date not null default (now() at time zone 'utc')::date,
  sent_at     timestamptz not null default now(),
  request_id  bigint,                                   -- net.http_post id
  finding     jsonb not null,                           -- counts and names only, section 7
  primary key (alert_key, day)
);

alter table ops.watch_expectations enable row level security;   -- no policies
alter table ops.alert_log          enable row level security;   -- no policies
revoke all on ops.watch_expectations, ops.alert_log from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- ops.watchdog_findings(): every current finding, side-effect free.
-- One row per alert_key, so alert_log's primary key can never collide within
-- one run. Summaries carry counts and job or engine names only: no client,
-- no prompt text, no address.
-- ----------------------------------------------------------------------------
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
$fn$;


-- ----------------------------------------------------------------------------
-- ops.watchdog_prev_ok(prev_ran_at, prev_request_id): the whole definition of
-- the watchdog's ok. Reads net._http_response only.
-- pg_net.ttl is 6 hours (read 2026-10-28); a previous run older than 5 hours
-- is unjudged (true) because its response row may already be purged.
-- ----------------------------------------------------------------------------
create or replace function ops.watchdog_prev_ok(prev_ran_at timestamptz, prev_request_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $fn$
  select case
    when prev_ran_at is null then true
    when prev_request_id is null then true
    when prev_ran_at < now() - interval '5 hours' then true
    when exists (select 1 from net._http_response h where h.id = prev_request_id)
      then coalesce((select h.status_code between 200 and 299
                       from net._http_response h
                      where h.id = prev_request_id), false)
    when now() - prev_ran_at > interval '10 minutes' then false
    else true
  end
$fn$;


-- ----------------------------------------------------------------------------
-- ops.watchdog_run(): one hourly pass. Returns the number of findings emailed.
--   0. judge the previous run's mail; if it was lost, clear its alert_log rows
--      so those findings are sent again now
--   1. findings minus the keys already sent today (UTC)
--   2. one Resend call for whatever remains; alert_log rows carry its id
--   3. one job_runs row: job 'obs-watchdog', ok, detail
--      {findings, sent, request_id, prev_unjudged}
-- Missing Vault secrets with findings to send: nothing is sent, nothing is
-- logged as sent (so the findings retry next hour), and the job_runs row reads
-- ok = false with detail.error 'vault_secret_missing', which turns health.js
-- red. Without this the gap would be silent: no request id means the next run
-- reads ok = true.
-- ----------------------------------------------------------------------------
create or replace function ops.watchdog_run()
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $fn$
declare
  v_prev_ran_at  timestamptz;
  v_prev_req_txt text;
  v_prev_req     bigint;
  v_ok           boolean;
  v_unjudged     boolean;
  v_total        integer;
  v_new          jsonb;
  v_sent         integer := 0;
  v_req          bigint;
  v_key          text;
  v_to           text;
  v_subject      text;
  v_body         text;
  v_error        text;
  v_today        date := (now() at time zone 'utc')::date;
begin
  -- Step 0. job_runs has no request_id column; the id lives only in detail,
  -- so it is bound once here and used for both the judgement and the delete.
  select j.ran_at, j.detail->>'request_id'
    into v_prev_ran_at, v_prev_req_txt
    from public.job_runs j
   where j.job = 'obs-watchdog'
   order by j.ran_at desc, j.id desc
   limit 1;

  v_prev_req := case when v_prev_req_txt ~ '^[0-9]+$' then v_prev_req_txt::bigint end;
  v_ok       := ops.watchdog_prev_ok(v_prev_ran_at, v_prev_req);
  v_unjudged := v_prev_ran_at is not null
                and v_prev_req is not null
                and v_prev_ran_at < now() - interval '5 hours';

  if not v_ok then
    delete from ops.alert_log a where a.request_id = v_prev_req;
  end if;

  -- Step 1.
  select count(*) into v_total from ops.watchdog_findings();

  select coalesce(jsonb_agg(to_jsonb(f) order by f.alert_key), '[]'::jsonb)
    into v_new
    from ops.watchdog_findings() f
   where not exists (select 1
                       from ops.alert_log a
                      where a.alert_key = f.alert_key
                        and a.day = v_today);

  -- Step 2.
  if jsonb_array_length(v_new) > 0 then
    select s.decrypted_secret into v_key
      from vault.decrypted_secrets s where s.name = 'resend_api_key';
    select s.decrypted_secret into v_to
      from vault.decrypted_secrets s where s.name = 'alert_email';

    if coalesce(v_key, '') = '' or coalesce(v_to, '') = '' then
      v_error := 'vault_secret_missing';
      v_ok    := false;
    else
      select '[BrandGEO alert] ' || jsonb_array_length(v_new) || ' new: '
               || string_agg(e->>'alert_key', ', ' order by e->>'alert_key'),
             string_agg((e->>'alert_key') || ': ' || (e->>'summary'), chr(10) order by e->>'alert_key')
               || chr(10) || chr(10)
               || 'Runbook: docs/ops/alerting-runbook.md'
        into v_subject, v_body
        from jsonb_array_elements(v_new) e;

      v_req := net.http_post(
        url                  := 'https://api.resend.com/emails',
        body                 := jsonb_build_object(
                                  'from',    'BrandGEO <noreply@mail.getbrandgeo.com>',
                                  'to',      jsonb_build_array(v_to),
                                  'subject', v_subject,
                                  'text',    v_body),
        params               := '{}'::jsonb,
        headers              := jsonb_build_object(
                                  'Content-Type',  'application/json',
                                  'Authorization', 'Bearer ' || v_key),
        timeout_milliseconds := 10000
      );

      insert into ops.alert_log (alert_key, day, request_id, finding)
      select e->>'alert_key', v_today, v_req, e
        from jsonb_array_elements(v_new) e
      on conflict (alert_key, day) do nothing;

      v_sent := jsonb_array_length(v_new);
    end if;
  end if;

  -- Step 3.
  insert into public.job_runs (job, ok, detail)
  values ('obs-watchdog', v_ok,
          jsonb_build_object('findings',      v_total,
                             'sent',          v_sent,
                             'request_id',    v_req,
                             'prev_unjudged', v_unjudged)
          || case when v_error is null then '{}'::jsonb
                  else jsonb_build_object('error', v_error) end);

  return v_sent;
end
$fn$;


-- ----------------------------------------------------------------------------
-- ops.watchdog_send_test(): one email through the same path, for the runbook
-- proof (step 8). Not deduplicated; writes no job_runs row and no alert_log
-- row, so it never affects ok. Returns the net.http_post request id; read the
-- answer with
--   select id, status_code, content from net._http_response where id = <id>;
-- ----------------------------------------------------------------------------
create or replace function ops.watchdog_send_test()
returns bigint
language plpgsql
volatile
security invoker
set search_path = ''
as $fn$
declare
  v_key text;
  v_to  text;
begin
  select s.decrypted_secret into v_key
    from vault.decrypted_secrets s where s.name = 'resend_api_key';
  select s.decrypted_secret into v_to
    from vault.decrypted_secrets s where s.name = 'alert_email';

  if coalesce(v_key, '') = '' or coalesce(v_to, '') = '' then
    raise exception 'watchdog_send_test: Vault secret resend_api_key or alert_email is missing (runbook step 5)';
  end if;

  return net.http_post(
    url                  := 'https://api.resend.com/emails',
    body                 := jsonb_build_object(
                              'from',    'BrandGEO <noreply@mail.getbrandgeo.com>',
                              'to',      jsonb_build_array(v_to),
                              'subject', '[BrandGEO alert] test',
                              'text',    'Test message from ops.watchdog_send_test(). No action needed.'
                                         || chr(10) || 'Runbook: docs/ops/alerting-runbook.md'),
    params               := '{}'::jsonb,
    headers              := jsonb_build_object(
                              'Content-Type',  'application/json',
                              'Authorization', 'Bearer ' || v_key),
    timeout_milliseconds := 10000
  );
end
$fn$;


revoke execute on function ops.watchdog_findings()                      from public, anon, authenticated;
revoke execute on function ops.watchdog_prev_ok(timestamptz, bigint)     from public, anon, authenticated;
revoke execute on function ops.watchdog_run()                           from public, anon, authenticated;
revoke execute on function ops.watchdog_send_test()                     from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- PART A read-back (run after PART A, each is a SELECT):
--
--   select job, source, max_silence, consecutive, enabled from ops.watch_expectations order by job;
--     -> nine rows; obs-watchdog and poll-inbound-replies read enabled = false
--
--   select p.proname, p.prosecdef, p.proconfig
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'ops' order by p.proname;
--     -> four rows, prosecdef false, proconfig {search_path=""}
--
--   select relname, relrowsecurity from pg_class
--    where relnamespace = 'ops'::regnamespace and relkind = 'r';
--     -> two rows, relrowsecurity true
--
--   select has_schema_privilege('anon', 'ops', 'usage'),
--          has_schema_privilege('authenticated', 'ops', 'usage'),
--          has_function_privilege('anon', 'ops.watchdog_run()', 'execute'),
--          has_function_privilege('authenticated', 'ops.watchdog_run()', 'execute');
--     -> false, false, false, false
--
--   select * from ops.watchdog_findings();      -- the dry run, sends nothing
--   select ops.watchdog_send_test();            -- step 8, sends one email
-- ----------------------------------------------------------------------------


-- ============================================================================
-- PART B: schedule. Run ONLY after PART A is read back, the dry run has been
-- reviewed, and the test email arrived. Copy the one statement below without
-- the leading "-- " and run it alone. Minute 50 is free (read 2026-10-28).
-- ============================================================================

-- select cron.schedule('obs-watchdog', '50 * * * *', $$ select ops.watchdog_run(); $$);

-- PART B read-back:
--   select jobid, jobname, schedule, active from cron.job where jobname = 'obs-watchdog';
-- After two runs (section 12 V9c):
--   select ran_at, ok, detail from public.job_runs where job = 'obs-watchdog' order by ran_at desc limit 2;
-- Pause:  select cron.alter_job(job_id => (select jobid from cron.job where jobname = 'obs-watchdog'), active => false);
-- Remove: select cron.unschedule('obs-watchdog');
