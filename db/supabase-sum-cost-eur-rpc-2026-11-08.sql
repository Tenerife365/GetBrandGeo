-- sum_cost_eur: one-round-trip monthly spend sum for the collection budget gate.
-- 2026-11-08, Phase 1 hardening.
--
-- Why: _auth.js checkCollectionLimits used to select every ai_results row of the
-- month and sum cost_eur in JavaScript. PostgREST caps a select at 1,000 rows,
-- and the platform already passed 1,000 rows this month, so the per-client and
-- platform-wide budget gates silently under-counted. PostgREST aggregates are
-- off on this project, so the sum runs here instead.
--
-- ORDER, NOT NEGOTIABLE: apply this BEFORE the dashboard push that ships the new
-- _auth.js. The new gate fails closed: until this function exists, every
-- collection call answers 429 budget_unverifiable.
--
-- Run ONCE in the Supabase SQL Editor, project brandgeo-dashboard
-- (duiyifepitvugyulobqm). Safe to re-run (create or replace).
--
-- Read back afterwards, both must return a number (0 is a valid answer):
--   select public.sum_cost_eur(date_trunc('month', now()), null);
--   select public.sum_cost_eur(date_trunc('month', now()), 1);
-- and confirm only service_role can execute it:
--   select grantee, privilege_type from information_schema.routine_privileges
--   where routine_schema = 'public' and routine_name = 'sum_cost_eur';
--
-- Both reads are index range scans (idx_ai_results_checked_at,
-- idx_ai_results_client_checked).

create or replace function public.sum_cost_eur(p_since timestamptz, p_client_id integer default null)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(cost_eur), 0)
  from public.ai_results
  where checked_at >= p_since
    and (p_client_id is null or client_id = p_client_id)
$$;

revoke execute on function public.sum_cost_eur(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.sum_cost_eur(timestamptz, integer) to service_role;
