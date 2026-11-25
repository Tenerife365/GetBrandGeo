-- supabase-internal-research-plan-source-2026-11-25.sql
--
-- NOT YET APPLIED. Written 2026-11-25 on branch
-- feat/internal-research-plan-source. Apply only on Constantin's go, in the
-- Supabase dashboard, SQL Editor, project duiyifepitvugyulobqm, or through
-- the connector's apply_migration (paste the body WITHOUT begin and commit).
--
-- What it does: gives BrandGEO's 37 internal city research workspaces their
-- own plan source, 'internal_research', so no report counts them as clients
-- or reads their plan as a compensated grant. Ruling, Constantin,
-- 2026-11-25: build a new plan source rather than only reuse
-- clients.category = 'research'. The category stays 'research'; the two
-- live side by side.
--
-- What it does NOT do:
--   * plan stays 'pro'. The plan decides which engines research collection
--     runs on; changing it would change the research datasets.
--   * no constraint change: public.clients has no CHECK on plan_source
--     (read 2026-11-25). Pre-check P3 proves it again before the update.
--   * no client_events row: client_events_type_check has no value for this
--     and widening it is out of scope. The migration file is the record.
--   * expire-plan-grants.js acts only on trial, comp and package, so it
--     ignores 'internal_research'. stripe-webhook.js never reads it.
--
-- Order, binding (agency P1 rule): apply this, read back R1 to R3, THEN push
-- the branch. The code on the branch also treats category 'research' as
-- internal research, so it is safe in either order, but the label
-- "Internal research" only appears on a row once this has run.
--
-- The 37 ids, read 2026-11-25 (list in _runs/2026-11-25_internal_research_accounts.md,
-- git-ignored): 10 to 16, 28 to 47, 58 to 67.

-- Pre-checks, read only. Run these first and compare. -------------------------
--
-- P1: the 37 rows, all research, all pro, plan_source null, no money.
--   select count(*) filter (where category = 'research')            as research,
--          count(*) filter (where plan = 'pro')                     as pro,
--          count(*) filter (where plan_source is null)              as source_null,
--          count(*) filter (where stripe_customer_id is not null)   as with_customer,
--          count(*) filter (where stripe_subscription_id is not null) as with_sub,
--          count(*) filter (where plan_grant_until is not null)     as with_grant
--   from public.clients
--   where id in (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,
--                41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67);
--   -- EXPECT research 37, pro 37, source_null 37, with_customer 0,
--   --        with_sub 0, with_grant 0.
--
-- P2: no research row outside the list, and no login on any of the 37.
--   select count(*) from public.clients where category = 'research'
--     and id not in (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,
--                    40,41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67);
--   -- EXPECT 0.
--   select count(*) from public.user_profiles where client_id in
--     (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,
--      41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67);
--   -- EXPECT 0.
--
-- P3: no CHECK constraint mentions plan_source.
--   select conname from pg_constraint
--   where conrelid = 'public.clients'::regclass and contype = 'c'
--     and pg_get_constraintdef(oid) ilike '%plan_source%';
--   -- EXPECT no rows.

-- The change -------------------------------------------------------------------
-- Guarded: refuses unless exactly 37 eligible rows exist, and refuses unless
-- exactly 37 rows changed. Either refusal rolls the whole migration back.

do $$
declare n int;
begin
  select count(*) into n from public.clients
  where id in (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,
               41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67)
    and category = 'research'
    and stripe_subscription_id is null
    and plan_source is null;
  if n <> 37 then
    raise exception 'internal_research precheck: expected 37 eligible rows, found %', n;
  end if;
end $$;

update public.clients
   set plan_source = 'internal_research'
 where id in (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,
              41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67)
   and category = 'research'
   and stripe_subscription_id is null;

do $$
declare n int;
begin
  select count(*) into n from public.clients where plan_source = 'internal_research';
  if n <> 37 then
    raise exception 'internal_research postcheck: expected 37 rows, found %', n;
  end if;
end $$;

-- Read back after applying -----------------------------------------------------
--
-- R1: exactly the 37, plan unchanged.
--   select plan_source, category, plan, count(*)
--   from public.clients group by 1, 2, 3 order by 1 nulls first, 2, 3;
--   -- EXPECT one row: internal_research | research | pro | 37.
--   -- Every other row unchanged from before (73 rows in total).
--
-- R2: no client row touched.
--   select count(*) from public.clients
--   where plan_source = 'internal_research' and category <> 'research';
--   -- EXPECT 0.
--
-- R3: census as the branch code reads it.
--   select case when plan_source = 'internal_research' or category = 'research'
--               then 'internal research' else 'clients' end as bucket,
--          count(*)
--   from public.clients group by 1 order by 1;
--   -- EXPECT clients 36, internal research 37.

-- Rollback, only if needed ---------------------------------------------------
--
--   update public.clients
--      set plan_source = null
--    where id in (10,11,12,13,14,15,16,28,29,30,31,32,33,34,35,36,37,38,39,40,
--                 41,42,43,44,45,46,47,58,59,60,61,62,63,64,65,66,67)
--      and plan_source = 'internal_research';
--   -- EXPECT 37 rows updated. Then R1 shows plan_source null on the 37.
