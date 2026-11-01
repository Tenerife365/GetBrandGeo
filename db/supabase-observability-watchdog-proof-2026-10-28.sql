-- ============================================================================
-- supabase-observability-watchdog-proof-2026-10-28.sql
--
-- Proof of the ops watchdog, docs/arch/observability.md section 12 V9, V9b,
-- V9d and the V10 grant checks. Run AFTER part A of
-- db/supabase-observability-watchdog-2026-10-28.sql and BEFORE part B.
--
-- Everything runs inside begin ... rollback. Nothing persists: the injected
-- job_runs, collection_jobs and alert_log rows, and the net.http_post queue
-- row that V9d creates, all roll back, so no email leaves.
--
-- How the result is shown: every check writes one line to a temporary table,
-- and the last block raises an exception whose message lists every line.
-- The SQL Editor always displays an error message, so the exception IS the
-- report; it also guarantees the rollback even if the final "rollback;" is
-- not reached. Read the message: it starts with "PROOF REPORT" and gives
-- PASS, FAIL or SKIPPED per check, then the before-counts to compare after.
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new).
--
-- After it, confirm nothing persisted (each is a SELECT):
--   select count(*) from public.job_runs;          -- equals job_runs_before
--   select count(*) from public.collection_jobs;   -- equals collection_jobs_before
--   select count(*) from ops.alert_log;            -- equals alert_log_before
-- ============================================================================

begin;

create temporary table proof_results (
  n      serial,
  check_name text not null,
  result text not null,          -- PASS, FAIL or SKIPPED
  note   text
) on commit drop;

create temporary table proof_before on commit drop as
select (select count(*) from public.job_runs)        as job_runs_before,
       (select count(*) from public.collection_jobs) as collection_jobs_before,
       (select count(*) from ops.alert_log)          as alert_log_before;


-- ----------------------------------------------------------------------------
-- V9: injected failures are found; no finding names obs-watchdog
-- ----------------------------------------------------------------------------
do $proof$
declare
  v_cj_inserted integer;
begin
  insert into public.job_runs (job, ok, detail)
  values ('expire-plan-grants', false, '{"note":"watchdog proof row"}'::jsonb);

  insert into public.collection_jobs
    (run_id, client_id, prompt_id, prompt_text, client_config, engines, status, finished_at)
  select j.run_id, j.client_id, j.prompt_id, 'watchdog proof row', j.client_config, j.engines,
         'failed', now()
    from public.collection_jobs j
   order by j.id desc
   limit 1;
  get diagnostics v_cj_inserted = row_count;

  insert into proof_results (check_name, result, note)
  select 'V9 job_failed:expire-plan-grants found',
         case when exists (select 1 from ops.watchdog_findings() f
                            where f.alert_key = 'job_failed:expire-plan-grants')
              then 'PASS' else 'FAIL' end,
         null;

  if v_cj_inserted = 1 then
    insert into proof_results (check_name, result, note)
    select 'V9 collection_jobs_failed found',
           case when exists (select 1 from ops.watchdog_findings() f
                              where f.alert_key = 'collection_jobs_failed:collection_jobs')
                then 'PASS' else 'FAIL' end,
           null;
  else
    insert into proof_results (check_name, result, note)
    values ('V9 collection_jobs_failed found', 'SKIPPED', 'no collection_jobs row to copy from');
  end if;

  insert into proof_results (check_name, result, note)
  select 'V9 no finding names obs-watchdog',
         case when not exists (select 1 from ops.watchdog_findings() f
                                where f.subject = 'obs-watchdog'
                                   or f.alert_key like '%obs-watchdog%')
              then 'PASS' else 'FAIL' end,
         null;

  insert into proof_results (check_name, result, note)
  select 'V9 alert_key unique within one call',
         case when (select count(*) from ops.watchdog_findings())
                 = (select count(distinct f.alert_key) from ops.watchdog_findings() f)
              then 'PASS' else 'FAIL' end,
         (select count(*)::text || ' findings in this transaction' from ops.watchdog_findings());
exception when others then
  insert into proof_results (check_name, result, note) values ('V9 block', 'FAIL', sqlerrm);
end
$proof$;


-- ----------------------------------------------------------------------------
-- V9b: ops.watchdog_prev_ok cases
-- ----------------------------------------------------------------------------
do $proof$
declare
  v_missing bigint;
  v_2xx     bigint;
  v_bad     bigint;
begin
  select coalesce(max(h.id), 0) + 1000000 into v_missing from net._http_response h;
  select h.id into v_2xx from net._http_response h
   where h.status_code between 200 and 299 order by h.id desc limit 1;
  select h.id into v_bad from net._http_response h
   where h.status_code is null or h.status_code not between 200 and 299
   order by h.id desc limit 1;

  insert into proof_results (check_name, result, note) values
    ('V9b (null, null) is true',
     case when ops.watchdog_prev_ok(null, null) is true then 'PASS' else 'FAIL' end, null),
    ('V9b (now - 1h, null) is true',
     case when ops.watchdog_prev_ok(now() - interval '1 hour', null) is true then 'PASS' else 'FAIL' end, null),
    ('V9b (now - 6h, any id) is true',
     case when ops.watchdog_prev_ok(now() - interval '6 hours', v_missing) is true then 'PASS' else 'FAIL' end, null),
    ('V9b (now - 1h, id with no response row) is false',
     case when ops.watchdog_prev_ok(now() - interval '1 hour', v_missing) is false then 'PASS' else 'FAIL' end,
     'id ' || v_missing),
    ('V9b (now - 5min, id with no response row) is true',
     case when ops.watchdog_prev_ok(now() - interval '5 minutes', v_missing) is true then 'PASS' else 'FAIL' end, null);

  if v_2xx is not null then
    insert into proof_results (check_name, result, note)
    values ('V9b real 2xx id is true',
            case when ops.watchdog_prev_ok(now() - interval '30 minutes', v_2xx) is true then 'PASS' else 'FAIL' end,
            'id ' || v_2xx);
  else
    insert into proof_results (check_name, result, note)
    values ('V9b real 2xx id is true', 'SKIPPED', 'no 2xx row in net._http_response (pg_net.ttl 6h)');
  end if;

  if v_bad is not null then
    insert into proof_results (check_name, result, note)
    values ('V9b real non-2xx id is false',
            case when ops.watchdog_prev_ok(now() - interval '30 minutes', v_bad) is false then 'PASS' else 'FAIL' end,
            'id ' || v_bad);
  else
    insert into proof_results (check_name, result, note)
    values ('V9b real non-2xx id is false', 'SKIPPED', 'no non-2xx row in net._http_response');
  end if;
exception when others then
  insert into proof_results (check_name, result, note) values ('V9b block', 'FAIL', sqlerrm);
end
$proof$;


-- ----------------------------------------------------------------------------
-- V9d: lost-mail resend branch (N2)
-- Uses the failing expire-plan-grants row injected by V9 as the finding.
-- ----------------------------------------------------------------------------
do $proof$
declare
  v_bad       bigint;
  v_ran_at    timestamptz;
  v_injected  bigint;
  v_newest    bigint;
  v_ret       integer;
  v_secrets   integer;
  v_new_req   bigint;
  v_last_ok   boolean;
  v_last_err  text;
begin
  select count(*) into v_secrets
    from vault.decrypted_secrets s
   where s.name in ('resend_api_key', 'alert_email')
     and coalesce(s.decrypted_secret, '') <> '';

  if v_secrets < 2 then
    insert into proof_results (check_name, result, note)
    values ('V9d resend branch', 'SKIPPED',
            'Vault secrets resend_api_key and alert_email not both set (runbook step 5); run again after');
    return;
  end if;

  select h.id into v_bad from net._http_response h
   where h.status_code is null or h.status_code not between 200 and 299
   order by h.id desc limit 1;

  if v_bad is not null then
    v_ran_at := now() - interval '30 minutes';
  else
    select coalesce(max(h.id), 0) + 1000000 into v_bad from net._http_response h;
    v_ran_at := now() - interval '1 hour';
  end if;

  insert into public.job_runs (job, ran_at, ok, detail)
  values ('obs-watchdog', v_ran_at, true,
          jsonb_build_object('findings', 1, 'sent', 1, 'request_id', v_bad, 'prev_unjudged', false))
  returning id into v_injected;

  select j.id into v_newest from public.job_runs j
   where j.job = 'obs-watchdog' order by j.ran_at desc, j.id desc limit 1;

  if v_newest is distinct from v_injected then
    insert into proof_results (check_name, result, note)
    values ('V9d resend branch', 'SKIPPED',
            'a real obs-watchdog row is newer than the injected one; run this proof before part B');
    return;
  end if;

  insert into ops.alert_log (alert_key, day, request_id, finding)
  values ('job_failed:expire-plan-grants', (now() at time zone 'utc')::date, v_bad,
          '{"proof":true}'::jsonb);

  v_ret := ops.watchdog_run();

  select a.request_id into v_new_req from ops.alert_log a
   where a.alert_key = 'job_failed:expire-plan-grants'
     and a.day = (now() at time zone 'utc')::date;

  select j.ok, j.detail->>'error' into v_last_ok, v_last_err from public.job_runs j
   where j.job = 'obs-watchdog' order by j.ran_at desc, j.id desc limit 1;

  insert into proof_results (check_name, result, note) values
    ('V9d return value is 1 or more',
     case when v_ret >= 1 then 'PASS' else 'FAIL' end, 'returned ' || v_ret),
    ('V9d old alert_log row with the lost request id is gone',
     case when not exists (select 1 from ops.alert_log a where a.request_id = v_bad)
          then 'PASS' else 'FAIL' end, 'lost id ' || v_bad),
    ('V9d new alert_log row for the same key carries a new request id',
     case when v_new_req is not null and v_new_req <> v_bad then 'PASS' else 'FAIL' end,
     'new id ' || coalesce(v_new_req::text, 'none')),
    ('V9d newest obs-watchdog row reads ok = false',
     case when v_last_ok is false then 'PASS' else 'FAIL' end,
     coalesce('error ' || v_last_err, 'no error field'));
exception when others then
  insert into proof_results (check_name, result, note) values ('V9d block', 'FAIL', sqlerrm);
end
$proof$;


-- ----------------------------------------------------------------------------
-- V10 (the part a SQL session can check): grants and function hygiene
-- ----------------------------------------------------------------------------
do $proof$
begin
  insert into proof_results (check_name, result, note)
  select 'V10 anon and authenticated have no usage on schema ops',
         case when not has_schema_privilege('anon', 'ops', 'usage')
               and not has_schema_privilege('authenticated', 'ops', 'usage')
              then 'PASS' else 'FAIL' end, null;

  insert into proof_results (check_name, result, note)
  select 'V10 anon and authenticated cannot select ops tables',
         case when not has_table_privilege('anon', 'ops.alert_log', 'select')
               and not has_table_privilege('authenticated', 'ops.alert_log', 'select')
               and not has_table_privilege('anon', 'ops.watch_expectations', 'select')
               and not has_table_privilege('authenticated', 'ops.watch_expectations', 'select')
              then 'PASS' else 'FAIL' end, null;

  insert into proof_results (check_name, result, note)
  select 'V10 anon and authenticated cannot execute the four functions',
         case when bool_and(not has_function_privilege('anon', p.oid, 'execute')
                            and not has_function_privilege('authenticated', p.oid, 'execute'))
              then 'PASS' else 'FAIL' end,
         count(*)::text || ' functions checked'
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'ops';

  insert into proof_results (check_name, result, note)
  select 'V10 four functions: security invoker, search_path empty',
         case when count(*) = 4
               and bool_and(not p.prosecdef)
               and bool_and(p.proconfig @> array['search_path=""'])
              then 'PASS' else 'FAIL' end,
         string_agg(p.proname || ' ' || coalesce(array_to_string(p.proconfig, ','), 'no config'), '; ')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'ops';

  insert into proof_results (check_name, result, note)
  select 'V10 RLS on both ops tables',
         case when count(*) = 2 and bool_and(c.relrowsecurity) then 'PASS' else 'FAIL' end, null
    from pg_class c
   where c.relnamespace = 'ops'::regnamespace and c.relkind = 'r';
exception when others then
  insert into proof_results (check_name, result, note) values ('V10 block', 'FAIL', sqlerrm);
end
$proof$;


-- ----------------------------------------------------------------------------
-- Report. Raising here shows every line in the editor and aborts the
-- transaction, so nothing above can persist.
-- ----------------------------------------------------------------------------
do $proof$
declare
  v_report text;
begin
  select 'PROOF REPORT (rolled back): '
           || count(*) filter (where r.result = 'PASS')    || ' pass, '
           || count(*) filter (where r.result = 'FAIL')    || ' fail, '
           || count(*) filter (where r.result = 'SKIPPED') || ' skipped'
           || chr(10)
           || string_agg(r.result || '  ' || r.check_name || coalesce('  (' || r.note || ')', ''),
                         chr(10) order by r.n)
    into v_report
    from proof_results r;

  select v_report || chr(10) || 'before: job_runs ' || b.job_runs_before
           || ', collection_jobs ' || b.collection_jobs_before
           || ', alert_log ' || b.alert_log_before
    into v_report
    from proof_before b;

  raise exception '%', v_report;
end
$proof$;

rollback;
