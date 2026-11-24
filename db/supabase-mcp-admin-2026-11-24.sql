-- =============================================================================
-- MCP admin tools: admin keys and the prompt write functions (2026-11-24)
-- Design: docs/arch/mcp-admin-tools.md sections 3, 6, 7 and 8.
--
-- Additive. Apply ONLY on Constantin's go, BEFORE the push that deploys
-- netlify/functions/mcp-admin.js (order rule: migration first, read back,
-- then push). Through the Supabase connector, apply_migration takes the body
-- between the begin and commit lines below without them.
--
-- What it adds:
--   1. public.admin_api_keys: the admin credential (sha256 hash and prefix
--      only, never the key). RLS on, no policy for any role, service_role may
--      select, insert and update; nobody may delete or truncate.
--   2. public.admin_add_prompts(...): validated insert of prompts for one
--      client, under a per client advisory lock, with the plan cap read the
--      same way as enforce_prompt_cap(), duplicate skipping, location
--      ownership checks and one client_events row, all in one transaction.
--   3. public.admin_archive_prompts(...): sets is_active = false on prompts of
--      one client. It contains no DELETE. Prompts are archived, never deleted.
--   4. public.admin_prompt_counts(...): active and archived counts per client
--      (PostgREST caps a select at 1,000 rows, a research client holds more).
--   5. client_events_type_check gains 'admin_prompt_change'. The pre-check
--      refuses to run if the live list is not the twelve values read on
--      2026-11-24, so a value added in between is never dropped.
--
-- Untouched on purpose: enforce_prompt_cap(), enforce_prompt_location(),
-- every policy on prompts, mcp-server.js and its client_api_keys table.
--
-- Known and recorded (design 6.4): a viewer adding a prompt from the
-- dashboard at the same second is not under the advisory lock, so the cap
-- can be overshot by one; the viewer's own trigger refuses their next add.
--
-- Rollback (nothing else depends on these objects):
--   drop function if exists public.admin_add_prompts(integer, jsonb, bigint[], text, boolean, uuid, uuid);
--   drop function if exists public.admin_archive_prompts(integer, bigint[], uuid, uuid);
--   drop function if exists public.admin_prompt_counts(integer[]);
--   drop table if exists public.admin_api_keys;
--   (and put client_events_type_check back to the twelve values, only after
--    deleting or retyping any 'admin_prompt_change' rows)
-- =============================================================================

begin;

set local lock_timeout = '5s';

-- -----------------------------------------------------------------------------
-- 0. Pre-check: the event type list is exactly what this file expects.
-- -----------------------------------------------------------------------------
-- The table lock comes first, so no other session can change the constraint
-- between this read and the drop and add below. The values are compared as a
-- set, parsed out of the definition, so formatting differences do not matter.
lock table public.client_events in access exclusive mode;

do $$
declare
  v_def      text;
  v_live     text[];
  v_twelve   constant text[] := array[
    'account_change', 'comp_grant', 'invite_resent', 'location_change',
    'mcp_fix_marked', 'onboarded', 'plan_change', 'signup',
    'stripe_change', 'stripe_provision', 'trial_expired', 'trial_grant'];
  v_thirteen text[];
begin
  v_thirteen := array(select x from unnest(v_twelve || 'admin_prompt_change'::text) as u(x) order by x);
  select pg_get_constraintdef(c.oid) into v_def
    from pg_constraint c
   where c.conname = 'client_events_type_check'
     and c.conrelid = 'public.client_events'::regclass;
  if v_def is null then
    raise exception 'precheck: client_events_type_check not found';
  end if;
  v_live := array(
    select distinct m[1]
      from regexp_matches(v_def, '''([^'']+)''', 'g') as m
     order by 1);
  if v_live = v_thirteen then
    raise notice 'precheck: client_events_type_check already carries admin_prompt_change';
  elsif v_live is distinct from v_twelve then
    raise exception 'precheck: client_events_type_check differs from the expected twelve values, read it and update this file: %', v_def;
  end if;
end $$;

alter table public.client_events drop constraint if exists client_events_type_check;
alter table public.client_events add constraint client_events_type_check
  check (type = any (array[
    'plan_change', 'trial_grant', 'comp_grant', 'trial_expired',
    'onboarded', 'signup', 'stripe_change', 'stripe_provision',
    'mcp_fix_marked', 'invite_resent', 'location_change', 'account_change',
    'admin_prompt_change'
  ]::text[]));

-- -----------------------------------------------------------------------------
-- 1. public.admin_api_keys
-- -----------------------------------------------------------------------------
create table if not exists public.admin_api_keys (
  id           uuid primary key default gen_random_uuid(),
  key_hash     text not null,
  key_prefix   text not null,
  label        text not null default '',
  scope        text not null default 'prompts_write',
  created_by   uuid not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '90 days'),
  last_used_at timestamptz,
  revoked_at   timestamptz,
  constraint admin_api_keys_scope_check check (scope in ('read', 'prompts_write')),
  constraint admin_api_keys_hash_check check (key_hash ~ '^[a-f0-9]{64}$'),
  constraint admin_api_keys_prefix_check check (key_prefix ~ '^bgadm_[a-f0-9]{6}$'),
  constraint admin_api_keys_label_check check (char_length(label) <= 80),
  constraint admin_api_keys_expiry_check check (
    expires_at > created_at and expires_at <= created_at + interval '366 days'
  )
);

create unique index if not exists admin_api_keys_key_hash_key on public.admin_api_keys (key_hash);
create index if not exists admin_api_keys_created_by_idx on public.admin_api_keys (created_by);

alter table public.admin_api_keys enable row level security;
-- No policy for any role, on purpose: only the service key reads this table.

revoke all on table public.admin_api_keys from public, anon, authenticated, service_role;
grant select, insert, update on table public.admin_api_keys to service_role;

-- -----------------------------------------------------------------------------
-- 2. public.admin_add_prompts
-- -----------------------------------------------------------------------------
create or replace function public.admin_add_prompts(
  p_client_id      integer,
  p_texts          jsonb,
  p_location_ids   bigint[],
  p_category       text,
  p_allow_over_cap boolean,
  p_actor          uuid,
  p_key_id         uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan      text;
  v_cap       integer;
  v_active    integer;
  v_locs      bigint[];
  v_loc       bigint;
  v_loc_owner integer;
  v_loc_arch  timestamptz;
  v_texts     text[] := '{}';
  v_t         text;
  v_raw       jsonb;
  v_seen      text[] := '{}';
  v_key       text;
  v_ins_text  text[] := '{}';
  v_ins_loc   bigint[] := '{}';
  v_skipped   jsonb := '[]'::jsonb;
  v_created   jsonb := '[]'::jsonb;
  v_ids       integer[] := '{}';
  v_new_id    integer;
  v_pos       integer;
  v_n         integer;
  v_over      boolean;
  i           integer;
begin
  if p_client_id is null then
    raise exception 'client_not_found: null' using errcode = 'foreign_key_violation';
  end if;
  if p_actor is null or p_key_id is null then
    raise exception 'invalid_actor: actor and key id are required' using errcode = 'check_violation';
  end if;

  if p_category is null or p_category not in (
    'general', 'mid', 'large', 'very_large', 'tool_discovery',
    'geo_category', 'problem_based', 'direct_brand'
  ) then
    raise exception 'invalid_category: %', coalesce(p_category, 'null') using errcode = 'check_violation';
  end if;

  if p_texts is null or jsonb_typeof(p_texts) <> 'array'
     or jsonb_array_length(p_texts) < 1 or jsonb_array_length(p_texts) > 25 then
    raise exception 'invalid_text: texts must be an array of 1 to 25 strings' using errcode = 'check_violation';
  end if;

  -- Normalise exactly as mcp-admin.js does (trim, collapse inner whitespace),
  -- then re-validate, so the SQL is safe even if a caller skips the JS checks.
  for v_raw in select e.value from jsonb_array_elements(p_texts) as e(value) loop
    if jsonb_typeof(v_raw) <> 'string' then
      raise exception 'invalid_text: every text must be a string' using errcode = 'check_violation';
    end if;
    v_t := regexp_replace(btrim(v_raw #>> '{}'), '\s+', ' ', 'g');
    if char_length(v_t) < 5 or char_length(v_t) > 500 then
      raise exception 'invalid_text: each text must be 5 to 500 characters' using errcode = 'check_violation';
    end if;
    if v_t ~ '[[:cntrl:]]' then
      raise exception 'invalid_text: control characters are not allowed' using errcode = 'check_violation';
    end if;
    v_texts := v_texts || v_t;
  end loop;

  -- One admin write per client at a time: the cap count and the insert below
  -- share this lock.
  perform pg_advisory_xact_lock(hashtextextended('prompts_cap:' || p_client_id::text, 0));

  select c.plan into v_plan from public.clients c where c.id = p_client_id;
  if not found then
    raise exception 'client_not_found: %', p_client_id using errcode = 'foreign_key_violation';
  end if;

  -- Locations: none given means the primary (created from the client's
  -- default market when missing, as the prompt trigger would do).
  if p_location_ids is null or cardinality(p_location_ids) = 0 then
    v_locs := array[public.ensure_primary_client_location(p_client_id)];
  else
    if cardinality(p_location_ids) > 10 or array_position(p_location_ids, null) is not null then
      raise exception 'location_invalid: 1 to 10 location ids' using errcode = 'check_violation';
    end if;
    select array_agg(s.x order by s.o) into v_locs
      from (select u.x, min(u.o) as o
              from unnest(p_location_ids) with ordinality as u(x, o)
             group by u.x) s;
  end if;

  foreach v_loc in array v_locs loop
    select l.client_id, l.archived_at into v_loc_owner, v_loc_arch
      from public.client_locations l
     where l.id = v_loc
       for share;
    if not found or v_loc_owner is distinct from p_client_id then
      raise exception 'location_invalid: location % does not belong to this client', v_loc
        using errcode = 'foreign_key_violation';
    end if;
    if v_loc_arch is not null then
      raise exception 'location_archived: location % is archived', v_loc using errcode = 'check_violation';
    end if;
  end loop;

  if cardinality(v_texts) * cardinality(v_locs) > 100 then
    raise exception 'too_many_rows: % texts times % locations is more than 100 prompts in one call',
      cardinality(v_texts), cardinality(v_locs) using errcode = 'check_violation';
  end if;

  -- Duplicates: equal (case insensitive) to an ACTIVE prompt of this client at
  -- the same location, or repeated inside this call. Skipped and reported.
  foreach v_loc in array v_locs loop
    foreach v_t in array v_texts loop
      v_key := lower(v_t) || chr(31) || v_loc::text;
      if v_key = any(v_seen) or exists (
        select 1 from public.prompts p
         where p.client_id = p_client_id
           and p.location_id = v_loc
           and p.is_active is true
           and lower(regexp_replace(btrim(p.text), '\s+', ' ', 'g')) = lower(v_t)
      ) then
        v_skipped := v_skipped || jsonb_build_object('text', v_t, 'location_id', v_loc);
      else
        v_seen := v_seen || v_key;
        v_ins_text := v_ins_text || v_t;
        v_ins_loc := v_ins_loc || v_loc;
      end if;
    end loop;
  end loop;

  -- Cap, read exactly as enforce_prompt_cap() reads it: plan, then free, then 5.
  select pc.prompt_cap into v_cap from public.plan_prompt_caps pc where pc.plan = coalesce(v_plan, 'free');
  if v_cap is null then
    select pc.prompt_cap into v_cap from public.plan_prompt_caps pc where pc.plan = 'free';
  end if;
  if v_cap is null then
    v_cap := 5;
  end if;

  select count(*)::integer into v_active
    from public.prompts p
   where p.client_id = p_client_id
     and p.is_active is true;

  v_n := cardinality(v_ins_text);
  v_over := v_active + v_n > v_cap;

  if v_n = 0 then
    return jsonb_build_object(
      'client_id', p_client_id, 'created', '[]'::jsonb, 'skipped_duplicates', v_skipped,
      'active_prompts', v_active, 'prompt_cap', v_cap, 'over_cap', v_active > v_cap,
      'location_ids', to_jsonb(v_locs));
  end if;

  if v_over and coalesce(p_allow_over_cap, false) is not true then
    raise exception 'prompt_cap_reached: the % plan allows % active prompts; % are active and % would be added',
      coalesce(v_plan, 'free'), v_cap, v_active, v_n using errcode = 'check_violation';
  end if;

  select coalesce(max(p.position), 0) into v_pos from public.prompts p where p.client_id = p_client_id;

  for i in 1 .. v_n loop
    v_pos := v_pos + 1;
    insert into public.prompts (client_id, text, category, is_active, position, location_id)
    values (p_client_id, v_ins_text[i], p_category, true, v_pos, v_ins_loc[i])
    returning id into v_new_id;
    v_ids := v_ids || v_new_id;
    v_created := v_created || jsonb_build_object(
      'prompt_id', v_new_id, 'text', v_ins_text[i], 'location_id', v_ins_loc[i]);
  end loop;

  insert into public.client_events (client_id, actor, type, meta)
  values (p_client_id, p_actor, 'admin_prompt_change', jsonb_build_object(
    'via', 'mcp_admin',
    'key_id', p_key_id,
    'action', 'add',
    'prompt_ids', to_jsonb(v_ids),
    'count', v_n,
    'location_ids', to_jsonb(v_locs),
    'category', p_category,
    'allow_over_cap', coalesce(p_allow_over_cap, false),
    'over_cap', v_over,
    'skipped_duplicates', jsonb_array_length(v_skipped)
  ));

  return jsonb_build_object(
    'client_id', p_client_id,
    'created', v_created,
    'skipped_duplicates', v_skipped,
    'active_prompts', v_active + v_n,
    'prompt_cap', v_cap,
    'over_cap', v_over,
    'location_ids', to_jsonb(v_locs));
end $$;

-- -----------------------------------------------------------------------------
-- 3. public.admin_archive_prompts (no DELETE anywhere in this function)
-- -----------------------------------------------------------------------------
create or replace function public.admin_archive_prompts(
  p_client_id  integer,
  p_prompt_ids bigint[],
  p_actor      uuid,
  p_key_id     uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids      bigint[];
  v_archived integer[];
  v_already  integer[];
  v_nf       bigint[];
  v_active   integer;
begin
  if p_client_id is null then
    raise exception 'client_not_found: null' using errcode = 'foreign_key_violation';
  end if;
  if p_actor is null or p_key_id is null then
    raise exception 'invalid_actor: actor and key id are required' using errcode = 'check_violation';
  end if;
  if p_prompt_ids is null or cardinality(p_prompt_ids) < 1 or cardinality(p_prompt_ids) > 50
     or array_position(p_prompt_ids, null) is not null then
    raise exception 'invalid_ids: 1 to 50 prompt ids' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('prompts_cap:' || p_client_id::text, 0));

  perform 1 from public.clients c where c.id = p_client_id;
  if not found then
    raise exception 'client_not_found: %', p_client_id using errcode = 'foreign_key_violation';
  end if;

  select array_agg(distinct x order by x) into v_ids from unnest(p_prompt_ids) as u(x);

  -- is_active is nullable: a null row is not counted as active by the cap,
  -- but it is archived here (is not false), so it ends as a clear false.
  with upd as (
    update public.prompts p
       set is_active = false
     where p.client_id = p_client_id
       and p.id = any(v_ids)
       and p.is_active is not false
    returning p.id
  )
  select coalesce(array_agg(upd.id order by upd.id), '{}') into v_archived from upd;

  select coalesce(array_agg(p.id order by p.id), '{}') into v_already
    from public.prompts p
   where p.client_id = p_client_id
     and p.id = any(v_ids)
     and not (p.id = any(v_archived));

  select coalesce(array_agg(x order by x), '{}') into v_nf
    from unnest(v_ids) as u(x)
   where not (x = any(v_archived)) and not (x = any(v_already));

  select count(*)::integer into v_active
    from public.prompts p
   where p.client_id = p_client_id
     and p.is_active is true;

  if cardinality(v_archived) > 0 then
    insert into public.client_events (client_id, actor, type, meta)
    values (p_client_id, p_actor, 'admin_prompt_change', jsonb_build_object(
      'via', 'mcp_admin',
      'key_id', p_key_id,
      'action', 'archive',
      'prompt_ids', to_jsonb(v_archived),
      'count', cardinality(v_archived)
    ));
  end if;

  return jsonb_build_object(
    'client_id', p_client_id,
    'archived', to_jsonb(v_archived),
    'already_archived', to_jsonb(v_already),
    'not_found', to_jsonb(v_nf),
    'active_prompts', v_active);
end $$;

-- -----------------------------------------------------------------------------
-- 4. public.admin_prompt_counts (read only; invoker rights, service_role
--    bypasses RLS, so no SECURITY DEFINER is needed)
-- -----------------------------------------------------------------------------
create or replace function public.admin_prompt_counts(p_client_ids integer[])
returns table (client_id integer, active integer, archived integer)
language sql
stable
set search_path = ''
as $$
  select c.id,
         (count(p.id) filter (where p.is_active is true))::integer,
         (count(p.id) filter (where p.is_active is false))::integer
    from (select distinct x as id from unnest(p_client_ids[1:200]) as u(x) where x is not null) c
    left join public.prompts p on p.client_id = c.id
   group by c.id
$$;

-- -----------------------------------------------------------------------------
-- 5. Grants: the default PUBLIC execute on new functions is revoked explicitly.
-- -----------------------------------------------------------------------------
revoke all on function public.admin_add_prompts(integer, jsonb, bigint[], text, boolean, uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_archive_prompts(integer, bigint[], uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_prompt_counts(integer[]) from public, anon, authenticated;
grant execute on function public.admin_add_prompts(integer, jsonb, bigint[], text, boolean, uuid, uuid) to service_role;
grant execute on function public.admin_archive_prompts(integer, bigint[], uuid, uuid) to service_role;
grant execute on function public.admin_prompt_counts(integer[]) to service_role;

commit;

-- =============================================================================
-- READ BACK after applying (run each separately; none of them writes).
-- =============================================================================
-- R1 table, RLS, policies, grants. Must return exactly one row with
-- rls true, policies 0, service_grants 'INSERT,SELECT,UPDATE', other_grants 0,
-- columns 10:
--   select c.relrowsecurity as rls,
--          (select count(*) from pg_policies
--            where schemaname = 'public' and tablename = 'admin_api_keys') as policies,
--          (select string_agg(privilege_type, ',' order by privilege_type)
--             from information_schema.role_table_grants
--            where table_schema = 'public' and table_name = 'admin_api_keys'
--              and grantee = 'service_role') as service_grants,
--          (select count(*) from information_schema.role_table_grants
--            where table_schema = 'public' and table_name = 'admin_api_keys'
--              and grantee not in ('service_role', 'postgres')) as other_grants,
--          (select count(*) from information_schema.columns
--            where table_schema = 'public' and table_name = 'admin_api_keys') as columns
--     from pg_class c where c.oid = 'public.admin_api_keys'::regclass;
--
-- R2 functions. Must return exactly three rows:
--   select p.proname, p.prosecdef, p.proconfig,
--          has_function_privilege('anon', p.oid, 'execute') as anon_x,
--          has_function_privilege('authenticated', p.oid, 'execute') as auth_x,
--          has_function_privilege('service_role', p.oid, 'execute') as service_x
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('admin_add_prompts', 'admin_archive_prompts', 'admin_prompt_counts');
--   expected: add and archive prosecdef true, counts false; proconfig {search_path=""};
--   anon_x false, auth_x false, service_x true for all three.
--
-- R3 type check. Must return one row listing thirteen values, the last
-- admin_prompt_change:
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'client_events_type_check';
--
-- R4 dry run of both write functions, as numbered cases. It always ends in an
-- error, so nothing commits. Expected final message: 'R4 PASS, rolled back'.
-- Any other message names the case that failed. Uses client 2.
--   do $$
--   declare
--     a jsonb; b jsonb; c jsonb; d jsonb; v_texts jsonb;
--     v_admin uuid; v_key uuid := gen_random_uuid(); v_key2 uuid := gen_random_uuid(); v_ids bigint[];
--     v_other bigint; v_err text; v_events integer;
--     v_cap integer; v_active integer; v_n integer; v_arch_client integer; v_arch_loc bigint;
--   begin
--     select id into v_admin from public.user_profiles where role = 'admin' limit 1;
--     -- 1. add with one duplicate inside the call and whitespace to collapse:
--     --    2 created, 1 skipped.
--     a := public.admin_add_prompts(2, '["R4 dry run prompt one", "R4 dry run prompt one", "  R4   dry run prompt two "]'::jsonb,
--            null, 'general', true, v_admin, v_key);
--     if jsonb_array_length(a->'created') <> 2 or jsonb_array_length(a->'skipped_duplicates') <> 1 then
--       raise exception 'R4 case 1 failed: %', a; end if;
--     select array_agg((e->>'prompt_id')::bigint) into v_ids from jsonb_array_elements(a->'created') e;
--     -- 2. the same texts again: 0 created, 3 skipped, no event.
--     d := public.admin_add_prompts(2, '["R4 dry run prompt one", "R4 dry run prompt two", "r4 DRY run prompt one"]'::jsonb,
--            null, 'general', true, v_admin, v_key);
--     if jsonb_array_length(d->'created') <> 0 or jsonb_array_length(d->'skipped_duplicates') <> 3 then
--       raise exception 'R4 case 2 failed: %', d; end if;
--     -- 3. a location of another client is refused with location_invalid.
--     select l.id into v_other from public.client_locations l where l.client_id <> 2 limit 1;
--     begin
--       perform public.admin_add_prompts(2, '["R4 dry run prompt three"]'::jsonb, array[v_other], 'general', true, v_admin, v_key);
--       raise exception 'R4 case 3 failed: no error';
--     exception when others then v_err := sqlerrm; end;
--     if v_err not like 'location_invalid:%' then raise exception 'R4 case 3 failed: %', v_err; end if;
--     -- 4. an unknown category is refused with invalid_category.
--     begin
--       perform public.admin_add_prompts(2, '["R4 dry run prompt three"]'::jsonb, null, 'nope', true, v_admin, v_key);
--       raise exception 'R4 case 4 failed: no error';
--     exception when others then v_err := sqlerrm; end;
--     if v_err not like 'invalid_category:%' then raise exception 'R4 case 4 failed: %', v_err; end if;
--     -- 5. archive the two plus an unknown id: 2 archived, the unknown one not found.
--     b := public.admin_archive_prompts(2, v_ids || 2147483000::bigint, v_admin, v_key);
--     if jsonb_array_length(b->'archived') <> 2 or b->'not_found' <> '[2147483000]'::jsonb then
--       raise exception 'R4 case 5 failed: %', b; end if;
--     -- 6. archive again: nothing archived, both already archived, rows still exist.
--     c := public.admin_archive_prompts(2, v_ids, v_admin, v_key);
--     if jsonb_array_length(c->'archived') <> 0 or jsonb_array_length(c->'already_archived') <> 2 then
--       raise exception 'R4 case 6 failed: %', c; end if;
--     if (select count(*) from public.prompts where id = any(v_ids)) <> 2 then
--       raise exception 'R4 case 6 failed: archived rows are gone'; end if;
--     -- 7. exactly two events with this key: the add of case 1 and the archive of case 5.
--     select count(*) into v_events from public.client_events
--      where type = 'admin_prompt_change' and meta->>'key_id' = v_key::text;
--     if v_events <> 2 then raise exception 'R4 case 7 failed: % events', v_events; end if;
--     -- 8. cap cases on client 53 (free plan, no location row as of 2026-11-24).
--     --    Add exactly up to the cap with no location: ok, over_cap false, and
--     --    every row lands on the primary the call created.
--     select coalesce((select pc.prompt_cap from public.plan_prompt_caps pc
--                       where pc.plan = coalesce(cl.plan, 'free')), 5)
--       into v_cap from public.clients cl where cl.id = 53;
--     select count(*)::integer into v_active from public.prompts p
--      where p.client_id = 53 and p.is_active is true;
--     v_n := v_cap - v_active;
--     if v_n between 1 and 24 then
--       select jsonb_agg('R4 cap probe ' || g) into v_texts from generate_series(1, v_n) g;
--       a := public.admin_add_prompts(53, v_texts, null, 'general', false, v_admin, v_key2);
--       if jsonb_array_length(a->'created') <> v_n or (a->>'over_cap')::boolean then
--         raise exception 'R4 case 8 failed: %', a; end if;
--       if exists (select 1 from jsonb_array_elements(a->'created') e
--                   where (e->>'location_id')::bigint is distinct from
--                         (select l.id from public.client_locations l
--                           where l.client_id = 53 and l.is_primary and l.archived_at is null)) then
--         raise exception 'R4 case 8 failed: a row is not on the primary'; end if;
--       -- 9. one more without allow_over_cap: prompt_cap_reached, nothing inserted.
--       begin
--         perform public.admin_add_prompts(53, '["R4 cap probe over"]'::jsonb, null, 'general', false, v_admin, v_key2);
--         raise exception 'R4 case 9 failed: no error';
--       exception when others then v_err := sqlerrm; end;
--       if v_err not like 'prompt_cap_reached:%' then raise exception 'R4 case 9 failed: %', v_err; end if;
--       if (select count(*) from public.prompts where client_id = 53 and is_active is true) <> v_cap then
--         raise exception 'R4 case 9 failed: the refused add inserted rows'; end if;
--       -- 10. the same with allow_over_cap: ok, over_cap true, and its audit row says so.
--       a := public.admin_add_prompts(53, '["R4 cap probe over"]'::jsonb, null, 'general', true, v_admin, v_key2);
--       if jsonb_array_length(a->'created') <> 1 or not (a->>'over_cap')::boolean then
--         raise exception 'R4 case 10 failed: %', a; end if;
--       if (select count(*) from public.client_events where type = 'admin_prompt_change'
--             and meta->>'key_id' = v_key2::text) <> 2
--          or not exists (select 1 from public.client_events where type = 'admin_prompt_change'
--             and meta->>'key_id' = v_key2::text and (meta->>'over_cap')::boolean) then
--         raise exception 'R4 case 10 failed: audit rows'; end if;
--     else
--       raise notice 'R4 cases 8 to 10 skipped: client 53 has % of % active prompts', v_active, v_cap;
--     end if;
--     -- 11. an archived location, when one exists, is refused with location_archived.
--     select l.client_id, l.id into v_arch_client, v_arch_loc from public.client_locations l
--      where l.archived_at is not null limit 1;
--     if v_arch_loc is not null then
--       begin
--         perform public.admin_add_prompts(v_arch_client, '["R4 dry run prompt four"]'::jsonb,
--                   array[v_arch_loc], 'general', true, v_admin, v_key2);
--         raise exception 'R4 case 11 failed: no error';
--       exception when others then v_err := sqlerrm; end;
--       if v_err not like 'location_archived:%' then raise exception 'R4 case 11 failed: %', v_err; end if;
--     else
--       raise notice 'R4 case 11 skipped: no archived location exists';
--     end if;
--     raise exception 'R4 PASS, rolled back';
--   end $$;
-- Too many rows (more than 100) and the type check guard are covered by the
-- static and unit tests in tests/mcp_admin.test.js; a 101 row case needs a
-- client with five live locations, which none has today.
