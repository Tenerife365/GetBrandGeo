-- =============================================================================
-- supabase-collection-jobs-reaper-2026-11-08.sql
--
-- Phase 2 (docs/arch/phase2-dashboard-plan-2026-11-08.md). NOT APPLIED. Written
-- by bg-backend, to be run by Constantin in the Supabase dashboard, SQL Editor,
-- project duiyifepitvugyulobqm. Idempotent: every statement can be re-run.
--
-- THE GAP. claim_collection_jobs(batch_size) (db/supabase-collection-queue-
-- migration.sql section 5, read back live 2026-11-08 with pg_get_functiondef)
-- flips a pending job to 'running', stamps claimed_at and increments attempts.
-- Only the worker ever moves a job out of 'running' again
-- (collection-worker-background.js processJob: 'done', 'failed', or back to
-- 'pending'). If the worker invocation dies while a job is running (Netlify's
-- 15 minute hard kill of a background function, a crash, a platform restart),
-- nothing ever touches that job again: it stays 'running' forever, its run
-- never reaches total_jobs done or failed, and the dashboard poll
-- (src/lib/collectionContext.tsx, the tick that counts status in
-- ('done','failed') against total_jobs) spins until the tab closes. The
-- ops watchdog only reports it, as `stuck`, 2 hours later.
--
-- MEASURED 2026-11-08 (read only): collection_jobs holds 1,583 rows, all
-- 'done', max attempts 2, newest claim 2026-11-07 04:17Z. Nothing is stuck
-- today, so applying this changes no row now; it is insurance.
--
-- SCHEMA FACTS THIS FILE RELIES ON (all read live 2026-11-08):
--   collection_jobs: id bigint, run_id bigint not null, status text not null
--     default 'pending' (no CHECK constraint; the values in use are
--     pending|running|done|failed per the queue migration's column comment),
--     attempts int not null default 0, scheduled_for timestamptz not null,
--     claimed_at timestamptz null, finished_at timestamptz null, error text,
--     created_at timestamptz not null.
--   collection_runs: id, client_id, trigger, force, total_jobs, created_by,
--     created_at. THERE IS NO status OR completed_at COLUMN. A run is complete
--     when every one of its jobs is 'done' or 'failed'; the dashboard derives
--     it, nothing writes it. So "closing" a run means making its last live job
--     terminal, which this function does; it writes nothing to collection_runs,
--     exactly as a normal run completes.
--   Both tables: RLS on, one SELECT policy each for authenticated, owned by
--     postgres, which has BYPASSRLS. pg_cron runs jobs as postgres (cron.job
--     username for obs-watchdog), so the function does NOT need SECURITY
--     DEFINER and is created SECURITY INVOKER.
--
-- THRESHOLD, 30 MINUTES, AND WHY. A job can only be legitimately 'running'
-- while the invocation that claimed it is alive. collection-worker-background.js
-- runs as a Netlify background function, 15 minutes hard limit (file header,
-- line 5), and stops claiming at TIME_BUDGET_MS = 13 minutes (line 34). The
-- claim happens after the invocation started, so claimed_at to kill is at most
-- 15 minutes. Inside that, one job is one collectEngines call whose slowest
-- per-engine worker timeout is chatgpt at 90 s (_collect.js
-- ENGINE_TIMEOUT_MS_WORKER), plus one upsert and one update. So a job still
-- 'running' 15 minutes after claimed_at belongs to a dead invocation. 30
-- minutes is twice that ceiling, so a reap can never race a live worker even
-- with clock skew or a slow final write, and is still far inside the
-- watchdog's 2 hour `stuck` window. The function refuses any value under 16
-- minutes.
--
-- MAX ATTEMPTS, 3, AND WHERE IT COMES FROM. The claim function enforces NO
-- maximum: it increments attempts and nothing else. The limit lives in the
-- worker, MAX_ATTEMPTS = 3 (collection-worker-background.js line 35), applied
-- in processJob's catch: attempts already counts the current run, so
-- attempts >= 3 means failed, otherwise back to pending. This function
-- applies the same comparison to the same column, so a job gets at most three
-- claims whether its earlier attempts ended in an error or in a dead
-- invocation. If MAX_ATTEMPTS ever changes in the worker, change the default
-- here in the same commit.
--
-- REQUEUE DETAIL. A requeued job gets status 'pending' and
-- scheduled_for = now(), so the next worker invocation claims it at once (the
-- worker's own requeue waits 60 s because it retries immediately after an
-- error; a reaped job has already waited 30 minutes). claimed_at is left as
-- it was, as the worker's requeue path leaves it; the next claim overwrites it.
--
-- WHAT THIS DOES NOT DO, STATED SO IT IS NOT ASSUMED: it does not start a
-- worker itself. A requeued job is claimed by the next worker invocation.
-- UPDATED 2026-11-09 (ruling 2, closes F2 of
-- docs/qa/phase2-server-review-2026-11-08.md): schedule-collections.js now
-- starts the worker on every hourly run (minute 10) whenever ANY pending job
-- has scheduled_for <= now() (kickWorkerIfNeeded), not only when that run
-- enqueued work. So a job this function requeues at minute 25 is picked up by
-- the next hourly run, at most about 45 minutes later, or sooner by a new
-- enqueue (enqueue-collection.js) or the worker's own self-chain. The requeue
-- sets scheduled_for = now(), which also resets the watchdog's 2 hour `stuck`
-- clock for that job, so the wait does not raise a false alert. Triggering the
-- worker from SQL was not chosen: it would need INTERNAL_AUDIT_KEY in Vault, a
-- new secret. See the follow-up note at the end of this file.
--
-- COST: zero model calls. One indexed read of status = 'running' rows
-- (idx_collection_jobs_client leads with client_id, status; the planner used it
-- in EXPLAIN on 2026-11-08), at most a handful of updates, one job_runs insert
-- per run of the job.
-- =============================================================================


-- =============================================================================
-- PART A. The function. Safe to run at any time; it schedules nothing.
-- =============================================================================

create or replace function public.reap_stuck_collection_jobs(
  stale_after  interval default interval '30 minutes',
  max_attempts integer  default 3,
  log_run      boolean  default true
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_requeued       integer  := 0;
  v_failed         integer  := 0;
  v_run_ids        bigint[] := '{}';
  v_runs_completed integer  := 0;
  v_result         jsonb;
begin
  if stale_after is null or stale_after < interval '16 minutes' then
    raise exception 'reap_stuck_collection_jobs: stale_after must be at least 16 minutes (the worker can legitimately hold a job for up to 15), got %', stale_after;
  end if;
  if max_attempts is null or max_attempts < 1 then
    raise exception 'reap_stuck_collection_jobs: max_attempts must be at least 1, got %', max_attempts;
  end if;

  -- SKIP LOCKED: a row another transaction holds (a worker finishing it right
  -- now) is left for the next pass instead of being waited on or overwritten.
  -- The UPDATE re-checks status = 'running' so a row that changed between the
  -- lock and the write is never touched.
  with stale as (
    select j.id, j.attempts
      from public.collection_jobs j
     where j.status = 'running'
       and coalesce(j.claimed_at, j.created_at) < now() - stale_after
     order by j.id
       for update skip locked
  ), upd as (
    update public.collection_jobs j
       set status        = case when s.attempts >= max_attempts then 'failed' else 'pending' end,
           finished_at   = case when s.attempts >= max_attempts then now() else j.finished_at end,
           scheduled_for = case when s.attempts >= max_attempts then j.scheduled_for else now() end,
           error         = left(format(
                             'reaped: still running %s min after claim, worker invocation presumed ended (attempt %s of %s), %s',
                             floor(extract(epoch from (now() - coalesce(j.claimed_at, j.created_at))) / 60)::bigint,
                             s.attempts,
                             max_attempts,
                             case when s.attempts >= max_attempts then 'marked failed' else 'requeued' end
                           ), 500)
      from stale s
     where j.id = s.id
       and j.status = 'running'
    returning j.status, j.run_id
  )
  select coalesce(count(*) filter (where u.status = 'pending'), 0)::integer,
         coalesce(count(*) filter (where u.status = 'failed'), 0)::integer,
         coalesce(array_agg(distinct u.run_id), '{}'::bigint[])
    into v_requeued, v_failed, v_run_ids
    from upd u;

  -- A touched run is complete when it has no pending or running job left,
  -- the same condition the dashboard reads (done + failed = total_jobs).
  -- Only a run whose last live job was failed above can complete here; a
  -- requeued job keeps its run open until a worker finishes it.
  select count(*)::integer
    into v_runs_completed
    from unnest(v_run_ids) as r(run_id)
   where not exists (
     select 1 from public.collection_jobs j
      where j.run_id = r.run_id
        and j.status in ('pending', 'running')
   );

  v_result := jsonb_build_object(
    'requeued',       v_requeued,
    'failed',         v_failed,
    'runs_touched',   coalesce(array_length(v_run_ids, 1), 0),
    'runs_completed', v_runs_completed,
    'run_ids',        to_jsonb(v_run_ids),
    'stale_after',    stale_after::text,
    'max_attempts',   max_attempts
  );

  -- One heartbeat row per run, ok = true, so the ops watchdog can watch this
  -- job for silence the same way it watches schedule-collections (part B adds
  -- the expectation). An exception above rolls the whole call back, writes no
  -- row, and cron.job_run_details records the failure.
  if log_run then
    insert into public.job_runs (job, ok, detail)
    values ('reap-stuck-collection-jobs', true, v_result);
  end if;

  return v_result;
end;
$$;

comment on function public.reap_stuck_collection_jobs(interval, integer, boolean) is
  'Requeues collection_jobs stuck in running longer than stale_after (default 30 min, worker hard limit is 15) or marks them failed at max_attempts (default 3, mirrors MAX_ATTEMPTS in collection-worker-background.js). Writes one job_runs row unless log_run is false. db/supabase-collection-jobs-reaper-2026-11-08.sql';

-- Supabase grants EXECUTE on new public functions to anon and authenticated by
-- default privileges. Nobody but postgres (pg_cron) and service_role needs it.
revoke all on function public.reap_stuck_collection_jobs(interval, integer, boolean) from public;
revoke all on function public.reap_stuck_collection_jobs(interval, integer, boolean) from anon;
revoke all on function public.reap_stuck_collection_jobs(interval, integer, boolean) from authenticated;
grant execute on function public.reap_stuck_collection_jobs(interval, integer, boolean) to service_role;


-- =============================================================================
-- PART B. Schedule it. COMMENTED OUT. Run only after part A is read back.
--
-- Minute 25 of every hour. Minutes already used by cron.job (read 2026-11-08):
-- 0 (purge-old-ai-results, 03:00), 5 (purge-old-prospect-audits, 04:05),
-- 10 (ping-sitemap 05:10, expire-plan-grants 06:10, schedule-collections
-- hourly), 35 (affiliate-retention 04:35), 40 (affiliate-mature 04:40),
-- 50 (obs-watchdog hourly). 25 sits between schedule-collections at :10 and
-- the watchdog at :50, so a reap lands before the watchdog's hourly read.
-- Worst case a dead job is reaped 30 + 60 = 90 minutes after its claim,
-- inside the watchdog's 2 hour `stuck` window, which stays as the backstop.
--
-- cron.schedule with an existing job name replaces that job (pg_cron 1.6), so
-- this is safe to re-run. The watch_expectations row makes the watchdog alert
-- if the reaper itself goes silent for 2 hours.
-- =============================================================================

-- select cron.schedule(
--   'reap-stuck-collection-jobs',
--   '25 * * * *',
--   $$ select public.reap_stuck_collection_jobs(); $$
-- );
--
-- insert into ops.watch_expectations (job, source, max_silence, consecutive, enabled, note)
-- values ('reap-stuck-collection-jobs', 'job_runs', interval '2 hours', 1, true,
--         'db/supabase-collection-jobs-reaper-2026-11-08.sql')
-- on conflict (job) do nothing;


-- =============================================================================
-- VERIFY (read only, after part A, and again after part B)
-- =============================================================================
-- 1. The function exists, is not SECURITY DEFINER, pins search_path, and is
--    not executable by anon or authenticated:
--
-- select p.oid::regprocedure                                   as sig,
--        p.prosecdef                                           as security_definer,   -- expect false
--        p.proconfig                                           as config,             -- expect {search_path=""}
--        has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_exec,      -- expect false
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,      -- expect false
--        has_function_privilege('service_role',  p.oid, 'EXECUTE') as service_exec    -- expect true
--   from pg_proc p
--  where p.oid = 'public.reap_stuck_collection_jobs(interval, integer, boolean)'::regprocedure;
--
-- 2. What the next reap would touch (no write):
--
-- select id, run_id, client_id, attempts, claimed_at, now() - claimed_at as running_for,
--        case when attempts >= 3 then 'would fail' else 'would requeue' end as action
--   from public.collection_jobs
--  where status = 'running'
--    and coalesce(claimed_at, created_at) < now() - interval '30 minutes'
--  order by id;
--
-- 3. After part B: the schedule and its heartbeat rows.
--
-- select jobid, jobname, schedule, active, username from cron.job where jobname = 'reap-stuck-collection-jobs';
-- select ran_at, ok, detail from public.job_runs where job = 'reap-stuck-collection-jobs' order by ran_at desc limit 3;
-- select status, return_message, start_time from cron.job_run_details
--  where jobid = (select jobid from cron.job where jobname = 'reap-stuck-collection-jobs')
--  order by start_time desc limit 3;


-- =============================================================================
-- ROLLBACK, in this order
-- =============================================================================
-- Pause without deleting (keeps the row and its history):
--   select cron.alter_job(job_id => (select jobid from cron.job where jobname = 'reap-stuck-collection-jobs'), active => false);
--
-- Remove entirely:
--   select cron.unschedule('reap-stuck-collection-jobs');
--   delete from ops.watch_expectations where job = 'reap-stuck-collection-jobs';
--   drop function if exists public.reap_stuck_collection_jobs(interval, integer, boolean);
--
-- The job_runs rows it wrote stay as history, as the obs-watchdog rows do.
-- A job it already requeued or failed is not reverted: requeued jobs are
-- claimed normally, and a failed job is exactly what the worker would have
-- written at max attempts.


-- =============================================================================
-- FOLLOW-UP, NOT IN THIS FILE. RESOLVED 2026-11-09 by ruling 2: the first
-- option below was taken. schedule-collections.js calls triggerWorker once
-- per hourly run whenever any pending job is due, so re-queued jobs (this
-- reaper's, and the worker's own last-batch retries) are picked up by the
-- next hourly run. Covered by tests/phase2_schedule_worker_trigger.test.js.
-- The text below is the original note, kept as the record of the gap.
-- =============================================================================
-- A requeued job waits for the next worker invocation. Until 2026-11-09 that came only
-- from a new enqueue or from schedule-collections when it enqueued work
-- (schedule-collections.js line 160 calls triggerWorker only when
-- totalJobs > 0). The same gap exists for the worker's OWN requeue: it sets
-- scheduled_for = now() + 60 s, and its end-of-invocation pending count only
-- counts scheduled_for <= now() (collection-worker-background.js lines 122 and
-- 176), so a job retried on the last batch of an invocation can sit pending
-- with no worker coming. Closing both needs a trigger that runs when stale
-- pending work exists: either schedule-collections calls triggerWorker when
-- any pending job is due, or this reaper posts to the worker through pg_net
-- with INTERNAL_AUDIT_KEY in Vault. Both are owed a decision.
