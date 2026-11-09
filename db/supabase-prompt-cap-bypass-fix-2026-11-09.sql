-- =============================================================================
-- supabase-prompt-cap-bypass-fix-2026-11-09.sql
--
-- NOT APPLIED. Run by Constantin on his go in the Supabase dashboard, SQL
-- Editor, project duiyifepitvugyulobqm. Idempotent (create or replace).
--
-- WHAT IT FIXES. docs/qa/phase2-server-n7-closure-2026-11-09.md, finding P1
-- (major, pre-existing, live, not exploited). public.enforce_prompt_cap() is
-- SECURITY DEFINER and owned by postgres, so inside it current_user is always
-- postgres and the server bypass `if current_user in ('service_role',
-- 'postgres')` fired for every caller. The plan prompt cap never applied to
-- anyone. Proven by the reviewer in a rolled-back probe: a real viewer on a
-- growth_pro client at 55 of 56 active prompts inserted 5 more (60 active).
-- Why it matters: _enqueue.js reads every active prompt with no limit and the
-- budget is checked once per enqueue, so the cap is what bounds a run's spend.
--
-- THE CHANGE. The bypass now reads the caller's JWT role instead of
-- current_user:
--   * role claim 'service_role' (Netlify functions with the service key)
--     -> bypass, as intended;
--   * no JWT claims at all and the session is not PostgREST's 'authenticator'
--     (SQL Editor, migrations, pg_cron) -> bypass, as intended;
--   * anything else ('authenticated', 'anon') -> the cap applies, unless
--     is_admin() as before.
-- The error text says "Archive one" (viewers archive since ruling 1 of
-- 2026-11-09); the token prompt_cap_reached that Prompts.tsx matches is kept.
-- Everything else in the function body is unchanged.
--
-- LIVE STATE CHECKED 2026-11-09: no client is over its cap today (reviewer
-- read 0 rows), so applying this blocks nothing that exists.
--
-- PROVEN in a rolled-back DO block, see the bottom of this file.
-- COST: zero model calls, no data touched.
-- =============================================================================

create or replace function public.enforce_prompt_cap()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_plan text;
  v_cap  integer;
  v_used integer;
  v_claims text;
  v_role text;
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

  -- Server-side callers bypass. NOT current_user: this function is SECURITY
  -- DEFINER, so current_user is always its owner (postgres) here. Read the
  -- caller's JWT role instead.
  v_claims := nullif(current_setting('request.jwt.claims', true), '');
  v_role := coalesce(v_claims::jsonb ->> 'role', '');
  if v_role = 'service_role' then
    return new;
  end if;
  if v_claims is null and session_user <> 'authenticator' then
    -- SQL Editor, migrations, pg_cron: no API request in flight.
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
      'prompt_cap_reached: your % plan allows % active prompts. Archive one to add another, or upgrade.',
      coalesce(v_plan, 'free'), v_cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$function$;

-- Read back:
-- select position('request.jwt.claims' in pg_get_functiondef('public.enforce_prompt_cap'::regproc)) > 0 as fixed;

-- PROVEN 2026-11-09, one DO block applying this function plus PART A of
-- supabase-prompts-delete-admin-only-2026-11-09.sql, then raising to roll back.
-- Client 54 (cap 56, 55 active), its real viewer, the admin, service_role and a
-- claims-less session:
--   viewer insert with explicit id        -> 42501 (column grant, P2)
--   viewer insert to 56 of 56             -> ok
--   viewer insert past the cap            -> 23514 prompt_cap_reached
--   viewer insert inactive past the cap   -> ok
--   viewer re-activate past the cap       -> 23514
--   viewer edit text at the cap           -> 1 row
--   viewer archive                        -> 1 row
--   admin insert past the cap             -> ok
--   service_role insert past the cap      -> ok
--   no JWT claims (SQL Editor) past cap   -> ok
-- Read back after: live function still the old one, policies unchanged, client
-- 54 still at 55 active, 0 probe rows. The default inserts used a few
-- prompts_id_seq values (sequences do not roll back), leaving a harmless gap.

-- ROLLBACK: re-create the function from pg_get_functiondef as read on
-- 2026-11-09 (identical except the bypass read `if current_user in
-- ('service_role', 'postgres') then return new; end if;` and the message said
-- "Delete one to add another"). Rolling back reopens P1.
