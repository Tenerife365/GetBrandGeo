-- supabase-client-locations-2026-11-13.sql
--
-- APPLIED 2026-11-13 by the owner, by hand, in the Supabase dashboard, SQL
-- Editor, project duiyifepitvugyulobqm, and read back the same hour (66
-- locations, 66 primaries, 545 prompts all with a location). This file is
-- now the record of a migration already run; it is safe to run again.
-- Written 2026-11-13 by bg-backend (packet 1 of the multi-location feature).
--
-- Purpose (docs/arch/multi-location-collection.md sections 3 and 4): one
-- location per prompt. A client gets a server-side list of locations in
-- public.client_locations, exactly one live row of which is the primary
-- (clients.default_market_id and default_region_id stay as its mirror).
-- Every prompt carries a location_id that is set once and never changes; a
-- prompt inserted without one gets the client's primary from a trigger.
-- collection_jobs and ai_results gain nullable columns for the stamp of
-- where each answer was asked.
--
-- ORDER RULE, NOT NEGOTIABLE: apply this, run the read-back set below, and
-- only then push the dashboard. What a dashboard deploy BEFORE this migration
-- would do (corrected 2026-11-13 per I1 of
-- docs/qa/multi-location-review-server-2026-11-13.md), so the owner knows
-- what to look for if the order is ever broken:
--   - the three collectors (collect-prompt, collect-claude, collect-chatgpt)
--     select prompts.location_id when they load the prompt, so they answer
--     500 "Prompt lookup failed" BEFORE any engine call: nothing is billed
--     there, but every single cell refresh fails;
--   - _enqueue.js gets an error on the same prompts read, answers "no active
--     prompts", and schedule-collections.js then stamps last_refresh_at, so
--     every due scheduled client silently loses its cycle;
--   - jobs already pending from before the deploy reach the worker, whose
--     ai_results upsert fails on the unknown stamp columns after the engines
--     have answered; the worker retries each such job up to MAX_ATTEMPTS
--     (3 today, collection-worker-background.js), each attempt billing the
--     engines with nothing saved. This is where the money is lost.
-- This migration under the old bundle is safe: the old code never sends
-- location_id and the trigger fills the primary.
--
-- Additive, one transaction, idempotent: a second run changes nothing
-- (create if not exists, create or replace, add column if not exists, the FK
-- guarded by a pg_constraint check, the backfill only touches null rows).
-- No row is deleted. The only UPDATE is the prompts.location_id backfill.
--
-- Step 7 (added 2026-11-13 by packet 3) also widens the CHECK on
-- client_events.type by 'location_change', the type client-locations.js
-- writes for an admin add (the limit override) and a primary move (section
-- 5.3). It rebuilds the constraint with the ten values read live by the
-- orchestrator at 11:52 UTC on 2026-11-13 (after
-- db/supabase-client-events-invite-resent-2026-11-11.sql was applied by the
-- owner) plus 'location_change'. No row changes value. Re-read the live
-- constraint just before applying; if it carries an eleventh value this file
-- does not list, STOP and add it to step 7 first, or step 7 would drop it:
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.client_events'::regclass and conname = 'client_events_type_check';
--   -- EXPECT the ten values of step 7 without 'location_change'
--   -- (or with it, on a re-run).

-- ============================================================================
-- PRE-APPLY CHECKS (read only). Run immediately before applying. A different
-- answer than the 2026-11-13 live read in section 4.2 of the spec STOPS the
-- apply.
-- ============================================================================
--
-- P1: helper functions exist
-- select proname from pg_proc where pronamespace = 'public'::regnamespace
--   and proname in ('is_admin','has_client_access');                 -- EXPECT 2 rows
--
-- P2: every default_market_id fits the location shape (null is fine, it becomes WW)
-- select id, default_market_id from public.clients
--   where default_market_id is not null and default_market_id !~ '^[A-Z]{2}$';   -- EXPECT 0 rows
-- select id, default_region_id from public.clients
--   where default_region_id is not null and char_length(default_region_id) not between 1 and 40; -- EXPECT 0
--
-- P3: behaviour-change census (section 6.7), keep the output
-- select default_market_id, default_region_id, count(*) from public.clients
--   group by 1, 2 order by 3 desc;
--
-- P4: prompts table size, to judge the NOT NULL scan
-- select count(*) from public.prompts;
--
-- P5: no collection job is running (the transaction takes ACCESS EXCLUSIVE
-- locks on prompts, collection_jobs, ai_results and client_events; a running
-- worker would hold it up, and lock_timeout below would then abort the apply)
-- select count(*) from public.collection_jobs where status = 'running';   -- EXPECT 0 (wait and retry if not)
--
-- Live answers of 2026-11-13: P1 2 rows (plus my_client_id, all SECURITY
-- DEFINER); P2 0 and 0; P4 545 prompts (474 active), 68 clients, 66 with
-- prompts, 0 orphan prompts.

begin;
set local lock_timeout = '5s';  -- on a timeout the whole transaction aborts cleanly; this file is safe to run again

-- 1. Table
create table if not exists public.client_locations (
  id          bigint generated always as identity primary key,
  client_id   integer not null references public.clients(id) on delete cascade,
  market_id   text    not null check (market_id ~ '^[A-Z]{2}$'),
  region_id   text    not null default 'ALL' check (char_length(region_id) between 1 and 40),
  is_primary  boolean not null default false,
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  constraint client_locations_id_client_uq unique (id, client_id),
  constraint client_locations_primary_live check (not (is_primary and archived_at is not null))
);
create unique index if not exists uq_client_locations_live
  on public.client_locations (client_id, market_id, region_id) where archived_at is null;
create unique index if not exists uq_client_locations_primary
  on public.client_locations (client_id) where is_primary and archived_at is null;
create index if not exists idx_client_locations_client on public.client_locations (client_id);

alter table public.client_locations enable row level security;
revoke all on public.client_locations from anon, authenticated;
grant select on public.client_locations to authenticated;
grant select on public.client_locations to service_role;  -- explicit, not left to default privileges (S4)
drop policy if exists client_locations_read on public.client_locations;
create policy client_locations_read on public.client_locations
  for select to authenticated
  using (public.is_admin() or public.has_client_access(client_id));
-- No insert, update or delete policy. Only SECURITY DEFINER functions and the service role write.

-- 2. Primary resolver (creates the primary from the clients defaults when absent)
create or replace function public.ensure_primary_client_location(p_client_id integer)
returns bigint language plpgsql security definer set search_path = '' as $f$
declare v_id bigint; v_m text; v_r text;
begin
  select id into v_id from public.client_locations
   where client_id = p_client_id and is_primary and archived_at is null;
  if v_id is not null then return v_id; end if;
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  select id into v_id from public.client_locations
   where client_id = p_client_id and is_primary and archived_at is null;
  if v_id is not null then return v_id; end if;
  select coalesce(default_market_id, 'WW'), coalesce(nullif(default_region_id, ''), 'ALL')
    into v_m, v_r from public.clients where id = p_client_id;
  if not found then
    raise exception 'client_not_found: %', p_client_id using errcode = 'foreign_key_violation';
  end if;
  update public.client_locations set is_primary = true
   where client_id = p_client_id and market_id = v_m and region_id = v_r and archived_at is null
   returning id into v_id;
  if v_id is null then
    insert into public.client_locations (client_id, market_id, region_id, is_primary, position)
    values (p_client_id, v_m, v_r, true, 0) returning id into v_id;
  end if;
  return v_id;
end $f$;

-- 3. prompts.location_id, backfill, NOT NULL, FK
alter table public.prompts add column if not exists location_id bigint;

select public.ensure_primary_client_location(c.id)
  from public.clients c
 where exists (select 1 from public.prompts p where p.client_id = c.id);

update public.prompts p
   set location_id = l.id
  from public.client_locations l
 where p.location_id is null
   and l.client_id = p.client_id and l.is_primary and l.archived_at is null;

alter table public.prompts alter column location_id set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prompts_location_fk') then
    alter table public.prompts add constraint prompts_location_fk
      foreign key (location_id, client_id) references public.client_locations (id, client_id)
      on delete no action;
  end if;
end $$;
create index if not exists idx_prompts_location on public.prompts (location_id);
grant insert (location_id) on public.prompts to authenticated;   -- no update grant, on purpose

-- 4. Prompt trigger: default, immutability, live check (created AFTER the backfill)
create or replace function public.enforce_prompt_location()
returns trigger language plpgsql security definer set search_path = '' as $f$
declare v_archived timestamptz; v_client integer;
begin
  if tg_op = 'UPDATE' and old.location_id is not null
     and new.location_id is distinct from old.location_id then
    raise exception 'location_immutable: a prompt keeps its location; archive it and add a new one'
      using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' and new.location_id is null then
    new.location_id := public.ensure_primary_client_location(new.client_id);
  end if;
  if coalesce(new.is_active, true) is not true then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_active, true) is true
     and old.client_id is not distinct from new.client_id then
    return new;
  end if;
  select archived_at, client_id into v_archived, v_client
    from public.client_locations where id = new.location_id for share;
  if not found or v_client is distinct from new.client_id then
    raise exception 'location_invalid: location % does not belong to this client', new.location_id
      using errcode = 'foreign_key_violation';
  end if;
  if v_archived is not null then
    raise exception 'location_archived: this location is archived' using errcode = 'check_violation';
  end if;
  return new;
end $f$;
drop trigger if exists trg_prompt_location on public.prompts;
create trigger trg_prompt_location
  before insert or update of location_id, is_active, client_id on public.prompts
  for each row execute function public.enforce_prompt_location();

-- 5. Add (atomic limit), archive (race safe), set primary (flag move plus mirror)
create or replace function public.add_client_locations(
  p_client_id integer, p_pairs jsonb, p_limit integer, p_created_by uuid)
returns setof public.client_locations language plpgsql security definer set search_path = '' as $f$
declare v_used integer; v_new integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  perform public.ensure_primary_client_location(p_client_id);
  select count(*) into v_used from public.client_locations
   where client_id = p_client_id and archived_at is null;
  v_new := jsonb_array_length(p_pairs);
  if p_limit is not null and v_used + v_new > p_limit then
    raise exception 'location_limit_reached: % used, % requested, limit %', v_used, v_new, p_limit
      using errcode = 'check_violation';
  end if;
  return query
    insert into public.client_locations (client_id, market_id, region_id, position, created_by)
    select p_client_id, e ->> 'market_id', coalesce(e ->> 'region_id', 'ALL'), v_used + t.ord::int, p_created_by
      from jsonb_array_elements(p_pairs) with ordinality as t(e, ord)
    returning *;
end $f$;

create or replace function public.archive_client_location(p_client_id integer, p_location_id bigint)
returns text language plpgsql security definer set search_path = '' as $f$
declare v_row public.client_locations%rowtype;
begin
  select * into v_row from public.client_locations
   where id = p_location_id and client_id = p_client_id for update;
  if not found then return 'not_found'; end if;
  if v_row.archived_at is not null then return 'already_archived'; end if;
  if v_row.is_primary then return 'location_is_primary'; end if;
  -- New statement, new snapshot: sees any prompt committed while we waited for the row lock.
  if exists (select 1 from public.prompts where location_id = p_location_id and is_active) then
    return 'location_in_use';
  end if;
  update public.client_locations set archived_at = now() where id = p_location_id;
  return 'archived';
end $f$;

create or replace function public.set_primary_client_location(p_client_id integer, p_location_id bigint)
returns text language plpgsql security definer set search_path = '' as $f$
declare v_row public.client_locations%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  perform public.ensure_primary_client_location(p_client_id);
  select * into v_row from public.client_locations
   where id = p_location_id and client_id = p_client_id and archived_at is null for update;
  if not found then return 'not_found'; end if;
  if v_row.is_primary then return 'already_primary'; end if;
  update public.client_locations set is_primary = false
   where client_id = p_client_id and is_primary and archived_at is null;
  update public.client_locations set is_primary = true where id = p_location_id;
  update public.clients set default_market_id = v_row.market_id, default_region_id = v_row.region_id
   where id = p_client_id;
  return 'primary_set';
end $f$;

revoke all on function public.ensure_primary_client_location(integer) from public, anon, authenticated;
revoke all on function public.add_client_locations(integer, jsonb, integer, uuid) from public, anon, authenticated;
revoke all on function public.archive_client_location(integer, bigint) from public, anon, authenticated;
revoke all on function public.set_primary_client_location(integer, bigint) from public, anon, authenticated;
revoke all on function public.enforce_prompt_location() from public, anon, authenticated;
grant execute on function public.ensure_primary_client_location(integer) to service_role;
grant execute on function public.add_client_locations(integer, jsonb, integer, uuid) to service_role;
grant execute on function public.archive_client_location(integer, bigint) to service_role;
grant execute on function public.set_primary_client_location(integer, bigint) to service_role;

-- 6. Stamps and job columns (nullable, no default: metadata only, no rewrite)
alter table public.collection_jobs add column if not exists location_id bigint;
alter table public.collection_jobs add column if not exists region_id   text;
alter table public.ai_results      add column if not exists location_id     bigint;
alter table public.ai_results      add column if not exists asked_market_id text;
alter table public.ai_results      add column if not exists asked_region_id text;

-- 7. Audit type 'location_change' on client_events (same pattern as
-- db/supabase-client-events-invite-resent-2026-11-11.sql). The ten values
-- are the live constraint of 2026-11-13 11:52 UTC; the eleventh is new.
-- Earlier changes to the same constraint:
--   db/supabase-client-events-type-check-2026-07-31.sql (the eight originals)
--   db/supabase-mcp-fix-writes-2026-11-06.sql step 4 ('mcp_fix_marked')
--   db/supabase-client-events-invite-resent-2026-11-11.sql ('invite_resent')
alter table public.client_events drop constraint if exists client_events_type_check;
alter table public.client_events
  add constraint client_events_type_check
  check (type in (
    'plan_change',
    'trial_grant',
    'comp_grant',
    'trial_expired',
    'onboarded',
    'signup',
    'stripe_change',
    'stripe_provision',
    'mcp_fix_marked',
    'invite_resent',
    'location_change'
  ));

commit;

-- ============================================================================
-- READ-BACK SET (read only). Run after commit, BEFORE the dashboard push.
-- ============================================================================
--
-- select column_name, data_type, is_nullable from information_schema.columns
--  where table_schema = 'public' and table_name in ('client_locations','prompts','collection_jobs','ai_results')
--    and column_name in ('location_id','region_id','asked_market_id','asked_region_id','is_primary','market_id','archived_at')
--  order by table_name, column_name;                              -- prompts.location_id NOT NULL
-- select count(*) from public.prompts where location_id is null;   -- EXPECT 0
-- select count(*) from public.clients c
--  where exists (select 1 from public.prompts p where p.client_id = c.id)
--    and not exists (select 1 from public.client_locations l where l.client_id = c.id and l.is_primary and l.archived_at is null); -- EXPECT 0
-- select count(*) from public.prompts p join public.client_locations l on l.id = p.location_id
--  where l.client_id <> p.client_id;                               -- EXPECT 0
-- select policyname, cmd, qual from pg_policies where tablename = 'client_locations';   -- EXPECT 1 row, SELECT
-- select privilege_type, column_name from information_schema.column_privileges
--  where table_name = 'prompts' and grantee = 'authenticated'
--    and privilege_type in ('INSERT','UPDATE') order by 1, 2;
--    -- INSERT: category, client_id, is_active, location_id, position, text; UPDATE: category, is_active, position, text
-- select tgname from pg_trigger where tgrelid = 'public.prompts'::regclass and not tgisinternal; -- includes both triggers
-- select proname, prosecdef, proconfig from pg_proc
--  where proname in ('ensure_primary_client_location','add_client_locations','archive_client_location',
--                    'set_primary_client_location','enforce_prompt_location');      -- all prosecdef true
-- select routine_name, grantee from information_schema.routine_privileges
--  where routine_name like '%client_location%';
--    -- EXPECT the owner role and service_role only; no anon, authenticated or PUBLIC.
--    -- (After the revoke from public and the explicit grant, PostgreSQL lists the
--    -- owner's own EXECUTE as a grantee too; that row is expected.)
-- select routine_name, grantee from information_schema.routine_privileges
--  where routine_name like '%client_location%'
--    and grantee in ('anon', 'authenticated', 'PUBLIC');           -- EXPECT 0 rows
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.prompts'::regclass and conname = 'prompts_location_fk';
--    -- EXPECT 1 row: FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id)
-- select indexname, indexdef from pg_indexes
--  where schemaname = 'public' and tablename = 'client_locations' order by 1;
--    -- EXPECT client_locations_pkey, client_locations_id_client_uq,
--    -- idx_client_locations_client, and the two partial unique indexes
--    -- uq_client_locations_live (... WHERE (archived_at IS NULL)) and
--    -- uq_client_locations_primary (... WHERE (is_primary AND (archived_at IS NULL)))
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_schema = 'public' and table_name = 'client_locations' order by 1, 2;
--    -- authenticated SELECT only, no anon row, the owner role and service_role rows are expected
-- select pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.client_events'::regclass and conname = 'client_events_type_check';
--    -- EXPECT the ten values of 2026-11-13 11:52 UTC plus 'location_change' (eleven)
--
-- Expected by the 2026-11-13 census: 66 rows in client_locations (one primary
-- per client with prompts), 545 prompts all with a location_id.
-- The rolled-back probe block (viewer and admin, section 4.4) is bg-verify's.

-- ============================================================================
-- ROLLBACK (by hand, only AFTER the dashboard code is reverted)
-- ============================================================================
-- Loses every stamp and the location of every non-primary prompt (those
-- prompts silently become primary prompts). Archive non-primary prompts
-- first if their answers must not be read as primary.
--
-- begin;
-- drop trigger if exists trg_prompt_location on public.prompts;
-- drop function if exists public.enforce_prompt_location();
-- drop function if exists public.set_primary_client_location(integer, bigint);
-- drop function if exists public.archive_client_location(integer, bigint);
-- drop function if exists public.add_client_locations(integer, jsonb, integer, uuid);
-- revoke insert (location_id) on public.prompts from authenticated;
-- alter table public.prompts drop constraint if exists prompts_location_fk;
-- alter table public.prompts drop column if exists location_id;
-- drop function if exists public.ensure_primary_client_location(integer);
-- alter table public.ai_results drop column if exists location_id, drop column if exists asked_market_id, drop column if exists asked_region_id;
-- alter table public.collection_jobs drop column if exists location_id, drop column if exists region_id;
-- drop table if exists public.client_locations;
-- commit;
--
-- Step 7 rollback, in its own statement and only when no 'location_change'
-- row exists (check first: select count(*) from public.client_events where
-- type = 'location_change'; EXPECT 0). With such rows present keep the wider
-- check, since rebuilding without the value would fail on validation. This
-- restores exactly the ten value list of 2026-11-13 11:52 UTC:
--
-- alter table public.client_events drop constraint if exists client_events_type_check;
-- alter table public.client_events
--   add constraint client_events_type_check
--   check (type in (
--     'plan_change', 'trial_grant', 'comp_grant', 'trial_expired', 'onboarded',
--     'signup', 'stripe_change', 'stripe_provision', 'mcp_fix_marked',
--     'invite_resent'
--   ));
