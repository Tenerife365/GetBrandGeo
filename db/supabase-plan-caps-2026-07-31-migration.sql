-- supabase-plan-caps-2026-07-31-migration.sql
-- Sprint task S2. Apply the ruled prompt ladder and add the `radar` tier to the
-- FIFTH copy of the ladder: public.plan_prompt_caps, the copy with teeth.
--
-- Source of truth: docs/strategy/sprint-ladder-ruling.md decisions 1, 2 and 3,
-- all signed by Constantin 2026-07-31.
--
-- ⚠️ NOT YET APPLIED. Run in the Supabase SQL editor for project
-- duiyifepitvugyulobqm, then run section 4 (verification) and check it against
-- the stated expectations. Safe to re-run: ADD COLUMN IF NOT EXISTS + ON CONFLICT.
--
-- ── WHY THIS MUST LAND IN THE SAME DEPLOY AS THE CONSTANTS ───────────────────
-- plan_prompt_caps backs trg_enforce_prompt_cap, a BEFORE INSERT OR UPDATE
-- trigger on public.prompts. It refuses the INSERT at the database, so it wins
-- over every constant in the application.
--
-- enforce_prompt_cap() falls back to the FREE cap for a plan it does not
-- recognise (supabase-prompt-cap-migration.sql, "Unknown/NULL plan falls back to
-- the FREE cap, never to unlimited"). So if `radar` goes live in code before this
-- row exists, a Radar customer who paid for 7 prompts is silently capped at 5 and
-- refused the sixth with a raw Postgres error. Equally, if this migration is
-- applied and the code is never deployed, the caps are simply more generous than
-- the app advertises, which is the harmless direction.
--
-- ORDER OF OPERATIONS: apply this migration FIRST, then deploy the code. The cap
-- is the permissive-on-arrival side of the pair.
--
-- ── NO CUSTOMER IS PUT INTO VIOLATION BY THIS CHANGE ─────────────────────────
-- Checked against production 2026-07-31 before writing, not assumed. Every cap
-- in this file HOLDS or RISES against the live values (free 5 held, essentials
-- 15 -> 18, growth 35 held, growth_pro 35 -> 56, managed/pro 120 -> 200,
-- enterprise held). The heaviest tenant in the book has 8 active prompts against
-- a cap of 15. A cap REDUCTION would be a customer-impacting migration under
-- docs/AUTONOMY.md; this is not one.
--
-- Live row counts by plan at the time of writing: pro 27, managed 3, free 2,
-- growth 2, essentials 1, growth_pro 1. No client is on a plan outside the eight
-- below, and there is no CHECK constraint on public.clients.plan (verified via
-- pg_constraint: only clients_category_check and clients_type_check exist), so
-- `radar` is assignable the moment set-client-plan.js accepts it.

begin;

-- ── 1. site_allowance: NEW COLUMN, and the ruling assumes it already exists ──
-- It does not. supabase-prompt-cap-migration.sql created plan_prompt_caps with
-- (plan, prompt_cap, updated_at) only, and the ruling's decision 3 SQL inserts a
-- third value into a column that has never been created. Adding it here is the
-- difference between this migration running and failing on line 1.
--
-- Nothing reads this column yet. D1 (multi-site tenancy) has not shipped, and
-- until it does the allowance is descriptive rather than enforced. It is seeded
-- now so the ladder is complete in one place and D1 does not have to re-derive
-- it, per ruling decision 3 ("MAX the site allowance", read from
-- plan_prompt_caps.site_allowance and ranked by PLAN_ORDER, never by comparing
-- allowance numbers, because essentials and growth share an allowance of 2).
--
-- DEFAULT 1 is the safe direction: a plan whose allowance was somehow missed
-- gets one website, not unlimited.
alter table public.plan_prompt_caps
  add column if not exists site_allowance integer not null default 1
  check (site_allowance >= 0);

comment on column public.plan_prompt_caps.site_allowance is
  'Websites (client rows) an account on this plan may hold. Ruling decision 3: pools are SUMmed across an account, this allowance is MAXed. Not enforced until D1 multi-site ships.';

-- ── 2. The ruled ladder ──────────────────────────────────────────────────────
-- 5, 7, 18, 35, 56, 200, 200, sentinel. Per-site figures are 5.00, 7.00, 9.00,
-- 17.50, 18.67, 20.00: strictly increasing at every boundary a customer can
-- cross, which is the property the ladder is shaped by. It closes two live
-- inversions: growth_pro delivered 11.67 per site against growth's 17.50, and
-- legacy `pro` delivered 6.00 per site against essentials' 7.50 on a paper
-- allowance of 20 websites in a feature that has not shipped.
--
-- enterprise 100000 is a SENTINEL, not a promise: at about EUR 0.97 a prompt the
-- EUR 1,500 budget stops collection near 1,541 prompts, so the budget is the
-- real cap. enterprise site_allowance 25 is PROVISIONAL (ruling open question
-- 2c, owned by D-3c); it satisfies monotonicity and does not block S2.
insert into public.plan_prompt_caps (plan, prompt_cap, site_allowance) values
  ('free',           5,  1),
  ('radar',          7,  1),
  ('essentials',    18,  2),
  ('growth',        35,  2),
  ('growth_pro',    56,  3),
  ('managed',      200, 10),
  ('pro',          200, 10),
  ('enterprise', 100000, 25)
on conflict (plan) do update
  set prompt_cap     = excluded.prompt_cap,
      site_allowance = excluded.site_allowance,
      updated_at     = now();

commit;

-- ── 3. DOWN PATH ─────────────────────────────────────────────────────────────
-- Required by docs/AUTONOMY.md section 2 ("every migration ships a down path, or
-- it is not night-safe"). This migration is NOT night-safe regardless: it is
-- billing, so it is day-only and monitored.
--
-- Restores the pre-2026-07-31 live state exactly as read from production that
-- day: 5, 15, 35, 35, 120, 120, 100000 with no radar row.
--
-- RUN THE DOWN PATH ONLY IF THE CODE IS ALSO ROLLED BACK. Reverting the caps
-- while planConfig.ts still advertises 18 or 56 prompts puts customers back into
-- the exact failure this migration exists to prevent: refused at the database
-- with a raw error, on an allowance they were sold.
--
-- CHECK FOR VIOLATIONS BEFORE REVERTING. The down path LOWERS caps, so unlike
-- the up path it can strand a customer above their allowance. It does not delete
-- their prompts (the trigger only fires on INSERT or UPDATE, so existing rows
-- survive and keep collecting), but the customer cannot add another until they
-- delete one. Run the third query in section 4 first and expect 0 rows.
--
--   begin;
--   delete from public.plan_prompt_caps where plan = 'radar';
--   update public.plan_prompt_caps set prompt_cap = 15,  updated_at = now() where plan = 'essentials';
--   update public.plan_prompt_caps set prompt_cap = 35,  updated_at = now() where plan = 'growth_pro';
--   update public.plan_prompt_caps set prompt_cap = 120, updated_at = now() where plan = 'managed';
--   update public.plan_prompt_caps set prompt_cap = 120, updated_at = now() where plan = 'pro';
--   -- free (5), growth (35) and enterprise (100000) are unchanged by the up path.
--   commit;
--
-- The site_allowance COLUMN is deliberately not dropped by the down path above.
-- It is additive, nothing reads it, and it holds the only record of decision 3's
-- allowances. To drop it as well (only if D1 has not started using it):
--
--   alter table public.plan_prompt_caps drop column if exists site_allowance;

-- ── 4. VERIFICATION ──────────────────────────────────────────────────────────
-- Run all three AFTER applying.
--
-- (a) The eight ruled rows. Expect exactly these values:
--       free 5/1, radar 7/1, essentials 18/2, growth 35/2, growth_pro 56/3,
--       managed 200/10, pro 200/10, enterprise 100000/25
--
--   select plan, prompt_cap, site_allowance from public.plan_prompt_caps
--    order by prompt_cap;
--
-- (b) The trigger is still attached and enabled. Expect 1 row,
--     trg_enforce_prompt_cap, tgenabled = 'O'.
--
--   select tgname, tgenabled from pg_trigger
--    where tgrelid = 'public.prompts'::regclass and not tgisinternal;
--
-- (c) No client is over its cap. Expect 0 rows.
--
--   select c.id, c.name, c.plan,
--          count(p.id) filter (where p.is_active) as used, k.prompt_cap
--     from public.clients c
--     left join public.prompts p on p.client_id = c.id
--     left join public.plan_prompt_caps k on k.plan = c.plan
--    group by c.id, c.name, c.plan, k.prompt_cap
--   having count(p.id) filter (where p.is_active) > coalesce(k.prompt_cap, 5)
--    order by used desc;
