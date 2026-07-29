-- supabase-prompt-cap-migration.sql
-- Enforce PLAN_PROMPTS server-side. 2026-07-29.
--
-- ⚠️ NOT YET APPLIED. Run this in the Supabase SQL editor for project
-- duiyifepitvugyulobqm, then run the verification block at the bottom.
-- Safe to re-run (CREATE OR REPLACE / DROP ... IF EXISTS / ON CONFLICT).
--
-- THE PROBLEM
--   PLAN_PROMPTS existed in src/lib/planConfig.ts and was read in exactly one
--   place: a plan-summary object used for display. Nothing enforced it. A Free
--   tenant could add 500 prompts and the only thing that would eventually stop
--   them is the monthly EUR budget gate in _auth.js — which fires AFTER the
--   spend, as a collection failure, not as a limit they can understand.
--
-- WHY THIS LIVES IN THE DATABASE AND NOT IN A NETLIFY FUNCTION
--   Prompts are written client-side, straight to PostgREST, under the RLS
--   policies in supabase-prompts-own-client-writes-migration.sql. A check in
--   Prompts.tsx would be a UI suggestion, not a limit: anyone with their own
--   session token can POST /rest/v1/prompts directly and skip it. That is
--   exactly the shape of the AI Social gap found on 2026-07-29, where three
--   functions were "locked" by a client-side plan test and nothing else. The
--   storage layer is the only place a cap cannot be routed around.
--
-- THE CAP IS A TABLE, NOT A CONSTANT IN THE FUNCTION BODY
--   plan_prompt_caps is seeded from PLAN_PROMPTS. It is a table because this
--   ladder has changed twice in one week, and a table means the next change is
--   a one-row UPDATE rather than a redeployed function. It is also readable by
--   the frontend, so Prompts.tsx renders the SAME number the trigger enforces
--   instead of a fourth hand-copy of the ladder drifting away from it (see the
--   _plans.js C1-C4 defects for what that costs).
--
-- WHAT COUNTS AGAINST THE CAP
--   ACTIVE prompts only. An inactive prompt is never collected and therefore
--   costs nothing, so it does not consume an allowance that exists to bound
--   spend. The trigger covers UPDATE as well as INSERT so a row cannot be
--   parked inactive and then flipped back on over the cap.
--
-- WHO BYPASSES IT
--   service_role  — Netlify functions (onboard-client.js seeds initial prompts,
--                   admin tooling, the collection pipeline). Not a customer path.
--   is_admin()    — a BrandGEO admin may deliberately exceed a customer's cap,
--                   e.g. while setting up a Managed account or troubleshooting.
--                   Owner's decision, 2026-07-29: customers must delete a prompt
--                   to add one; admins are not blocked.

-- ── 1. The cap table ─────────────────────────────────────────────────────────
create table if not exists public.plan_prompt_caps (
  plan       text primary key,
  prompt_cap integer not null check (prompt_cap >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.plan_prompt_caps is
  'Max ACTIVE prompts per plan. Enforced by trigger enforce_prompt_cap() on public.prompts. Mirror of PLAN_PROMPTS in src/lib/planConfig.ts — this table is the enforced copy.';

-- Seeded from PLAN_PROMPTS as of 2026-07-29c. (A brief 29b revision cut
-- growth_pro to 70 and managed/pro to 230 to fit Grok under a 12%-of-price
-- spend ceiling; the ceiling was raised to 15% the same day, so the cut was
-- reverted. If you applied 29b, re-running this file corrects the rows.)
insert into public.plan_prompt_caps (plan, prompt_cap) values
  ('free',         5),
  ('essentials',  20),
  ('growth',      50),
  ('growth_pro',  75),
  ('managed',    250),
  ('pro',        250),
  ('enterprise', 100000)
on conflict (plan) do update
  set prompt_cap = excluded.prompt_cap,
      updated_at = now();

alter table public.plan_prompt_caps enable row level security;

-- Readable by any signed-in user so the dashboard can show "12 of 20 used"
-- without hardcoding 20. There is deliberately NO insert/update/delete policy:
-- only service_role (and the SQL editor) can change a cap.
drop policy if exists plan_prompt_caps_select on public.plan_prompt_caps;
create policy plan_prompt_caps_select on public.plan_prompt_caps
  for select to authenticated using (true);

-- ── 2. The trigger ───────────────────────────────────────────────────────────
create or replace function public.enforce_prompt_cap()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_plan text;
  v_cap  integer;
  v_used integer;
begin
  -- Inactive rows cost nothing and do not consume the allowance.
  if coalesce(new.is_active, true) is not true then
    return new;
  end if;

  -- On UPDATE, only re-check when the row is newly becoming active or is being
  -- moved to another client. Editing a prompt's text, category or position must
  -- never be blocked, including for a client already over cap (an admin can put
  -- them there, and they still need to be able to fix typos).
  if tg_op = 'UPDATE'
     and coalesce(old.is_active, true) is true
     and old.client_id is not distinct from new.client_id then
    return new;
  end if;

  -- Server-side callers bypass: Netlify functions run as service_role, and the
  -- SQL editor / migrations run as postgres.
  if current_user in ('service_role', 'postgres') then
    return new;
  end if;

  -- BrandGEO admins may deliberately exceed a customer's cap.
  if public.is_admin() then
    return new;
  end if;

  select plan into v_plan from public.clients where id = new.client_id;

  select prompt_cap into v_cap
    from public.plan_prompt_caps
   where plan = coalesce(v_plan, 'free');

  -- Unknown/NULL plan falls back to the FREE cap, never to "unlimited".
  -- Deliberately stricter than _cost.js activeEnginesFor(), which falls back to
  -- essentials: that fallback picks which engines to RUN, where being generous
  -- is harmless; this one bounds spend, where being generous is the bug.
  if v_cap is null then
    select prompt_cap into v_cap from public.plan_prompt_caps where plan = 'free';
  end if;
  if v_cap is null then
    v_cap := 5;
  end if;

  select count(*) into v_used
    from public.prompts
   where client_id = new.client_id
     and is_active is true
     and (tg_op = 'INSERT' or id <> new.id);

  if v_used >= v_cap then
    -- The literal token `prompt_cap_reached` is matched in Prompts.tsx to show
    -- the friendly message. Do not reword it without changing that check.
    raise exception
      'prompt_cap_reached: your % plan allows % active prompts. Delete one to add another, or upgrade.',
      coalesce(v_plan, 'free'), v_cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_prompt_cap on public.prompts;
create trigger trg_enforce_prompt_cap
  before insert or update on public.prompts
  for each row execute function public.enforce_prompt_cap();

-- ── 3. Verification ──────────────────────────────────────────────────────────
-- Run this AFTER applying. Expect: the caps table with 7 rows, one trigger, and
-- NO client currently over its cap (checked 2026-07-29: the heaviest tenant in
-- the book had 8 active prompts against a cap of 50, so this turns on without
-- putting anybody into violation).
--
--   select * from public.plan_prompt_caps order by prompt_cap;
--
--   select tgname, tgenabled from pg_trigger
--    where tgrelid = 'public.prompts'::regclass and not tgisinternal;
--
--   select c.id, c.name, c.plan, count(p.id) filter (where p.is_active) as used,
--          k.prompt_cap
--     from public.clients c
--     left join public.prompts p on p.client_id = c.id
--     left join public.plan_prompt_caps k on k.plan = c.plan
--    group by c.id, c.name, c.plan, k.prompt_cap
--   having count(p.id) filter (where p.is_active) > coalesce(k.prompt_cap, 5)
--    order by used desc;
--   -- expect 0 rows
