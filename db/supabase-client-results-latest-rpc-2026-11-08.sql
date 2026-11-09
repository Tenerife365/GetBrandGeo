-- client_results_latest: the snapshot rows every customer results page reads.
-- 2026-11-08, Phase 2 (docs/arch/phase2-results-layer-spec.md section 2).
--
-- PURPOSE
-- Returns, for one client, a subset of real ai_results rows: per (prompt, engine)
-- the newest row, the newest usable row, the newest non-error row, the newest
-- error row and the start of the current error run, each flagged; plus the
-- engine level error-run start repeated on every row of that engine.
-- Replaces the plain `select ... from ai_results` reads that PostgREST caps at
-- 1,000 rows (client 1 holds 3,829 rows on 2026-11-08, so those reads were
-- truncated). Returns 589 rows for client 1 and 385 for client 54 (measured).
--
-- WHY SECURITY INVOKER
-- ai_results RLS applies to the caller, so a viewer reads only the clients RLS
-- lets them read (ai_results_client_read / ai_results_select, which call
-- is_admin(), my_role() and has_client_access()). A SECURITY DEFINER function
-- would run as the owner, bypass RLS and hand any authenticated caller every
-- client's rows for any p_client_id. No RLS policy is changed by this file.
--
-- GRANTS
-- Supabase's default privileges in schema public grant EXECUTE on every new
-- function to anon, authenticated and service_role (pg_default_acl, read
-- 2026-11-08). This file revokes it from PUBLIC and anon and grants it to
-- authenticated (the dashboard) and service_role (server functions) only.
-- Even if anon could call it, RLS would return 0 rows; the revoke keeps the
-- surface closed rather than relying on that.
--
-- INDEX
-- None, deliberately (spec section 2.1). As the table owner the planner picks a
-- seq scan for client 1 (63 percent of the table); as a viewer it already uses
-- idx_ai_results_client_checked (client_id, checked_at desc). The cost as a
-- viewer is the per-row RLS filter, not the scan. Do not add a join back to an
-- engine aggregate: a joined draft chose a nested loop and ran in 1,277.9 ms.
--
-- ONE CHANGE FROM THE SPEC TEXT OF 2.2: both window orders read
-- `checked_at desc nulls last` instead of `checked_at desc`. ai_results.checked_at
-- is nullable, Postgres puts NULLs FIRST under DESC, and the client side sorts
-- treat a null checked_at as the oldest value (promptPerformance.ts:113-117,
-- `a.checked_at ?? ''`). Without `nulls last` a row with a null checked_at would
-- become the "newest" row of its cell and of its engine. 0 such rows exist on
-- 2026-11-08, so today the output is identical either way.
--
-- ORDER, NOT NEGOTIABLE: apply this BEFORE the dashboard push that ships
-- src/lib/resultsContext.tsx. Without the function every results page shows its
-- load error card (PostgREST answers PGRST202).
--
-- Run ONCE in the Supabase SQL Editor, project brandgeo-dashboard
-- (duiyifepitvugyulobqm). Safe to re-run (create or replace; revoke and grant are
-- idempotent).
--
-- HOW TO VERIFY (read back afterwards, all read-only):
--   select count(*) from public.client_results_latest(1);                  -- 589 on 2026-11-08, grows with new cells
--   select count(*) from public.client_results_latest(1) where is_latest;  -- equals the cell count, 401 on 2026-11-08
--   select count(*) from public.client_results_latest(54);                 -- 385 on 2026-11-08
--   select grantee, privilege_type from information_schema.routine_privileges
--   where routine_schema = 'public' and routine_name = 'client_results_latest';
--   -- EXPECT authenticated and service_role (plus the owner), never anon or PUBLIC.
--   select security_type from information_schema.routines
--   where routine_schema = 'public' and routine_name = 'client_results_latest';
--   -- EXPECT INVOKER.
--   RLS probe, as a viewer of client 54 asking for client 1 (rolled back):
--   begin;
--   set local role authenticated;
--   select set_config('request.jwt.claims',
--     '{"sub":"<user_profiles.id of a viewer of client 54>","role":"authenticated"}', true);
--   select count(*) from public.client_results_latest(1);   -- EXPECT 0
--   select count(*) from public.client_results_latest(54);  -- EXPECT the client's own count
--   rollback;
--
-- ROLLBACK (only after the dashboard no longer calls it):
--   drop function if exists public.client_results_latest(integer);

create or replace function public.client_results_latest(p_client_id integer)
returns table (
  id                    integer,
  prompt_id             integer,
  llm                   text,
  status                text,
  error_code            text,
  brand_mentioned       boolean,
  brand_position        integer,
  sentiment             text,
  response_snippet      text,
  competitors_mentioned text,
  checked_at            timestamp,
  model                 text,
  is_latest             boolean,
  is_usable             boolean,
  is_last_nonerror      boolean,
  is_newest_error       boolean,
  is_run_start          boolean,
  engine_error_since    timestamp
)
language sql
stable
security invoker
set search_path = public
as $$
  with o as (
    select a.id, a.prompt_id, a.llm, a.status, a.error_code, a.brand_mentioned,
           a.brand_position, a.sentiment, a.response_snippet, a.competitors_mentioned,
           a.checked_at, a.model,
           coalesce(a.status = 'error', false)                                 as is_err,
           coalesce(starts_with(a.response_snippet, '[no_ai_overview]'), false) as is_noans,
           row_number() over w_cell as rn_cell,
           row_number() over w_eng  as rn_eng
    from public.ai_results a
    where a.client_id = p_client_id
    window w_cell as (partition by a.prompt_id, a.llm order by a.checked_at desc nulls last, a.id desc),
           w_eng  as (partition by a.llm order by a.checked_at desc nulls last, a.id desc)
  ),
  k as (
    select o.*,
           min(o.rn_cell) filter (where not o.is_err)                     over pc as k_nonerr,
           min(o.rn_cell) filter (where not o.is_err and not o.is_noans)  over pc as k_usable,
           min(o.rn_cell) filter (where o.is_err)                         over pc as k_err,
           count(*)                                                        over pc as n_cell,
           min(o.rn_eng)  filter (where not o.is_err)                     over pe as k_eng_nonerr,
           count(*)                                                        over pe as n_eng
    from o
    window pc as (partition by o.prompt_id, o.llm),
           pe as (partition by o.llm)
  ),
  s as (
    select k.*,
           min(k.checked_at) filter (where k.rn_eng < coalesce(k.k_eng_nonerr, k.n_eng + 1))
             over (partition by k.llm) as eng_since
    from k
  )
  select s.id, s.prompt_id, s.llm, s.status, s.error_code, s.brand_mentioned,
         s.brand_position, s.sentiment, s.response_snippet, s.competitors_mentioned,
         s.checked_at, s.model,
         (s.rn_cell = 1)                                       as is_latest,
         (s.rn_cell is not distinct from s.k_usable)           as is_usable,
         (s.rn_cell is not distinct from s.k_nonerr)           as is_last_nonerror,
         (s.rn_cell is not distinct from s.k_err)              as is_newest_error,
         (s.rn_cell = coalesce(s.k_nonerr, s.n_cell + 1) - 1)  as is_run_start,
         s.eng_since                                           as engine_error_since
  from s
  where s.rn_cell = 1
     or s.rn_cell = s.k_usable
     or s.rn_cell = s.k_nonerr
     or s.rn_cell = s.k_err
     or s.rn_cell = coalesce(s.k_nonerr, s.n_cell + 1) - 1
  order by s.id desc
$$;

revoke execute on function public.client_results_latest(integer) from public, anon;
grant execute on function public.client_results_latest(integer) to authenticated, service_role;
