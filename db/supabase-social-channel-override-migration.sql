-- supabase-social-channel-override-migration.sql
-- Per-client override for the AI Social channel allowance. 2026-08-02.
--
-- Run in the Supabase SQL editor for project duiyifepitvugyulobqm, then run the
-- verification block at the bottom. Safe to re-run (IF NOT EXISTS / idempotent
-- UPDATE). Down path is at the end of this file.
--
-- WHY
--   INV-35 (EUR 3,500, sent 2026-08-02) sells Bucate pe Roate, clients.id = 1,
--   "administrarea a 4 conturi de social media". PLAN_SOCIAL_CHANNEL_LIMIT
--   grants growth_pro THREE. The gap is a sold commitment the published
--   entitlement contradicts.
--
-- WHY AN OVERRIDE AND NOT A LADDER CHANGE
--   Ruled by Constantin 2026-08-02. The 4th channel is a bespoke term of a
--   EUR 3,500 ten-month package, not a property of the EUR 449 tier. Raising
--   PLAN_SOCIAL_CHANNEL_LIMIT.growth_pro to 4 would hand every future Growth
--   PRO subscriber a channel that was priced into one negotiated deal, and
--   would be invisible in the pricing ladder that S1 spent a session settling.
--   A nullable per-client column leaves the ladder alone and makes the
--   exception explicit and auditable on the row it applies to.
--
-- THE SHAPE IS clients.engines_enabled, DELIBERATELY
--   engines_enabled is the existing precedent for "this client differs from
--   their plan": sparse, nullable, plan is the fallback. This column follows
--   it. NULL means "no override, use the plan constant" — it never means zero.
--   Every reader must treat NULL and the plan value as the same thing, which
--   is why the check below allows >= 0 but the readers use `?? plan`.
--
-- WHAT THIS DOES NOT DO, AND THIS IS THE HONEST PART
--   Nothing currently REFUSES a 4th channel, so this fixes a stated
--   entitlement rather than unblocking a blocked delivery. Measured
--   2026-08-02, all four:
--     - social-publish.js enforceSocialLimits() is unreachable dead code. The
--       handler is requireAuth({ adminOnly: true }) and the call site is
--       additionally guarded by profile.role !== 'admin'.
--     - The constant gates per-POST platform count, not connected accounts.
--       No function caps how many accounts a client links.
--     - Social.tsx feeds it to AllowanceMeter, which is display only.
--   So the pre-migration symptom is a meter reading 4/3 in red, not a refusal.
--   The column matters the moment AI Social leaves admin-only, which is when
--   enforceSocialLimits becomes reachable and would start refusing a post BpR
--   has paid for.
--
-- SCALE NOTE (AUTONOMY.md section 2)
--   One nullable integer on a table with 37 rows. No new query: it rides the
--   existing CLIENT_SELECT and the existing single-row select in
--   enforceSocialLimits. At 10,000 subscribers this is 10,000 nullable ints,
--   ~40KB, zero additional reads, zero additional writes, zero external API
--   credit. No index: it is never a predicate, only ever projected alongside a
--   primary-key lookup.

-- ── 1. The column ────────────────────────────────────────────────────────────
alter table public.clients
  add column if not exists social_channel_limit integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.clients'::regclass
       and conname  = 'clients_social_channel_limit_check'
  ) then
    alter table public.clients
      add constraint clients_social_channel_limit_check
      check (social_channel_limit is null or social_channel_limit >= 0);
  end if;
end $$;

comment on column public.clients.social_channel_limit is
  'Per-client override for PLAN_SOCIAL_CHANNEL_LIMIT (src/lib/planConfig.ts). NULL = no override, use the plan constant. Set only for a negotiated package that sold a different allowance; record the reason in the sale document. Set for client 1 by INV-35, 2026-08-02.';

-- ── 2. The one client that has an override today ─────────────────────────────
-- Bucate pe Roate. INV-35 sells 4 accounts for 10 months to 2027-06-02.
update public.clients
   set social_channel_limit = 4
 where id = 1
   and social_channel_limit is distinct from 4;

-- ── 3. Verification ──────────────────────────────────────────────────────────
-- Expect exactly one row: id 1, Bucate pe Roate, growth_pro, 4.
--
--   select id, name, plan, social_channel_limit
--     from public.clients
--    where social_channel_limit is not null
--    order by id;
--
-- Expect the constraint to exist and reject a negative:
--
--   select conname from pg_constraint
--    where conrelid = 'public.clients'::regclass
--      and conname = 'clients_social_channel_limit_check';
--
-- Expect every other client to read NULL, i.e. unchanged behaviour:
--
--   select count(*) from public.clients where social_channel_limit is not null;
--   -- expect 1

-- ── 4. Down path ─────────────────────────────────────────────────────────────
-- Reverting the CODE alone is enough to restore pre-migration behaviour: every
-- reader falls back to the plan constant and an unread column is inert. Drop
-- the column only if the override approach is abandoned outright.
--
--   alter table public.clients
--     drop constraint if exists clients_social_channel_limit_check;
--   alter table public.clients
--     drop column if exists social_channel_limit;
--
-- To remove one client's override without touching the schema:
--
--   update public.clients set social_channel_limit = null where id = 1;
