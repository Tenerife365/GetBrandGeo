-- supabase-agency-accounts-2026-11-16.sql
--
-- NOT APPLIED. Written 2026-11-16 by bg-backend (Opus) for release P1 of
-- docs/arch/agency-multi-brand.md, revision 4. This file is steps 1 AND 2 of
-- section 13 of that spec, in ONE transaction (re-review N-L2), so no signup
-- can land between the account backfill and the membership trigger.
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new),
-- pasted as one batch, run as the editor's role (postgres). The expected ACL
-- strings in the read-back assume the objects are created by postgres.
--
-- What it does
--   Step 1 (spec 4.3, 4.7):
--     - public.accounts and public.account_members, RLS on, grants written out
--     - public.clients.account_id (FK to accounts, ON DELETE RESTRICT) and index
--     - three triggers on clients: ensure_client_account (BEFORE INSERT, creates
--       a direct account, refuses an insert that names account_id),
--       set_account_home (AFTER INSERT), cleanup_empty_account (AFTER DELETE)
--     - backfill: one direct account per client, home = the client; one
--       account_members owner row per profile on its default brand's account
--     - clients.account_id NOT NULL
--   Step 2 (spec 4.2, 4.4, 4.5, 4.6, 4.7, 5.2):
--     - user_clients gains role, created_by, grant_source; its DML is revoked
--       from anon and authenticated
--     - backfill: one user_clients row per profile ('owner', 'backfill'), and
--       the account_members backfill re-run, both insert ... on conflict do nothing
--     - sync_primary_membership (AFTER INSERT on user_profiles only)
--     - is_account_member, brand_account_kind, account_reconcile and every 4.6
--       function, the two SELECT policies of 5.2, every grant and revoke of 4.7
--
-- What it does NOT do
--   - It changes no existing RLS policy. Group B (36 policies) is step 3, in
--     db/supabase-agency-rls-group-b-2026-11-16.sql.
--   - It changes no limit, no plan, nothing Stripe reads.
--   - The 4.6 functions write a client_events row of type 'account_change',
--     which the live client_events_type_check does not allow until step 3 is
--     applied. So every 4.6 function FAILS (23514 on client_events) until the
--     step 3 file is applied. That is intended: nothing may call them before
--     step 3, and nothing does before the step 4 push.
--
-- ORDER RULE, NOT NEGOTIABLE
--   1. Apply this file. Run read-back R1 below and section R2 of
--      db/supabase-agency-readback-2026-11-16.sql. Every answer must match.
--   2. Apply db/supabase-agency-rls-group-b-2026-11-16.sql (step 3). Run its
--      read-back and section R3 of the readback file.
--   3. Apply db/supabase-agency-watchdog-2026-11-16.sql (needs this file).
--   4. Only then the dashboard push (step 4), on Constantin's go.
--   Never the reverse. A dashboard deploy before this file would call SQL
--   functions that do not exist (agency-admin.js answers 500 on every write)
--   and read accounts that do not exist; it would not widen access.
--
-- Safety of this file under the CURRENT (old) dashboard bundle
--   - The three client insert paths (provision-account.js:180-182,
--     _provision_client.js:331, stripe-webhook.js:1085-1088) name no
--     account_id; the BEFORE INSERT trigger fills it. Their rollbacks (insert
--     then delete) leave no clients and no accounts row (cleanup trigger).
--   - The five delete paths (provision-account.js:212, _provision_client.js:341,
--     stripe-webhook.js:658, :683, :692, delete-client.js:102) keep working for
--     every direct account. Only an AGENCY home brand refuses deletion (23514),
--     and no agency exists until step 5.
--   - has_client_access is not edited. After the backfill every user holds
--     exactly one user_clients row, on their own default brand, so its answer
--     is unchanged for every user and every brand (spec 5.5).
--
-- Re-run safety (spec 13, re-review 3 N3-I5)
--   create table if not exists, add column if not exists, create index if not
--   exists, create or replace function, drop trigger if exists before each
--   create trigger, drop policy if exists before each policy. Both backfills
--   are insert ... select ... on conflict do nothing, restricted to brands
--   whose account is DIRECT, so a re-run after an agency exists cannot hand a
--   guest or a removed staff member a row back. The file is never needed again
--   after step 5; re-running it then is harmless but pointless.
--
-- Operational caveat: a pg_dump DATA restore into a database that already has
-- this trigger inserts clients rows that name account_id, which the BEFORE
-- INSERT trigger refuses. Restore with triggers disabled (pg_restore
-- --disable-triggers, or session_replication_role = replica).
--
-- ============================================================================
-- PRE-APPLY CHECKS (read only). Run immediately before applying.
-- ============================================================================
--
-- P1: nothing of this file exists yet (first run), or all of it (re-run)
-- select to_regclass('public.accounts') as accounts, to_regclass('public.account_members') as members,
--        (select count(*) from information_schema.columns
--          where table_schema = 'public' and table_name = 'clients' and column_name = 'account_id') as account_id_col;
--   -- EXPECT first run: null, null, 0
--
-- P2: the helpers this file relies on exist, with the bodies read 2026-11-16
-- select proname, prosecdef, proconfig from pg_proc
--  where pronamespace = 'public'::regnamespace
--    and proname in ('is_admin', 'has_client_access', 'get_my_client_id');
--   -- EXPECT 3 rows, all prosecdef true, proconfig {"search_path=\"\""}
--
-- P3: shape census (2026-11-16: 72 clients, 36 profiles, 0 with null client_id,
-- 0 user_clients rows, 0 user triggers on clients or user_profiles)
-- select (select count(*) from public.clients) as clients,
--        (select count(*) from public.user_profiles) as profiles,
--        (select count(*) from public.user_profiles where client_id is null) as profiles_no_client,
--        (select count(*) from public.user_clients) as user_clients,
--        (select count(*) from pg_trigger
--          where tgrelid in ('public.clients'::regclass, 'public.user_profiles'::regclass)
--            and not tgisinternal) as user_triggers;
--   -- EXPECT on a first run: user_clients 0, user_triggers 0. Any user_clients
--   -- row present before this file STOPS the apply (spec 13: never hand-insert).
--
-- P4: no collection job is running (the transaction takes ACCESS EXCLUSIVE on
-- clients, user_profiles and user_clients; lock_timeout below aborts cleanly)
-- select count(*) from public.collection_jobs where status = 'running';   -- EXPECT 0
--
-- ============================================================================
-- READ-BACK R1 (read only). Run AFTER commit, before the step 3 file.
-- Then run section R2 of db/supabase-agency-readback-2026-11-16.sql (the
-- rolled-back insert-then-delete block and the privilege probes).
-- ============================================================================
--
-- R1.1  spec 5.5 #3
-- select count(*) from public.clients where account_id is null;                      -- EXPECT 0
--
-- R1.2  one direct account per client, each with a home that is in it
-- select (select count(*) from public.accounts) as accounts,
--        (select count(*) from public.clients) as clients,
--        (select count(*) from public.accounts where kind <> 'direct') as non_direct,
--        (select count(*) from public.accounts where home_client_id is null) as no_home,
--        (select count(*) from public.accounts a
--          where not exists (select 1 from public.clients c
--                             where c.id = a.home_client_id and c.account_id = a.id)) as home_outside;
--   -- EXPECT accounts = clients (72 on 2026-11-16), non_direct 0, no_home 0, home_outside 0
--
-- R1.3  account_members: one owner row per profile
-- select (select count(*) from public.account_members) as members,
--        (select count(*) from public.user_profiles where client_id is not null) as profiles,
--        (select count(*) from public.account_members where role <> 'owner') as non_owner;
--   -- EXPECT members = profiles (36 on 2026-11-16), non_owner 0
--
-- R1.4  spec 5.5 #1, #2, #4 (no widening for any existing viewer)
-- select count(*) from public.user_clients uc join public.user_profiles p on p.id = uc.user_id
--  where uc.client_id <> p.client_id;                                                -- EXPECT 0
-- select count(*) from public.user_profiles p
--   left join public.user_clients uc on uc.user_id = p.id and uc.client_id = p.client_id
--  where p.client_id is not null and uc.user_id is null;                              -- EXPECT 0
-- select count(*) from public.user_clients where grant_source in ('account', 'direct'); -- EXPECT 0
--
-- R1.5  every user_clients row is the backfill owner row
-- select grant_source, role, count(*) from public.user_clients group by 1, 2;
--   -- EXPECT one row: backfill, owner, 36 (= profiles)
--
-- R1.6  the three 4.4 checks
-- select count(*) from public.account_members am
--   join public.clients c on c.account_id = am.account_id
--   left join public.user_clients uc on uc.user_id = am.user_id and uc.client_id = c.id
--  where uc.user_id is null;                                                          -- EXPECT 0 (missing)
-- select count(*) from public.user_clients uc join public.clients c on c.id = uc.client_id
--  where uc.grant_source = 'account'
--    and not exists (select 1 from public.account_members am
--                     where am.user_id = uc.user_id and am.account_id = c.account_id); -- EXPECT 0 (stale)
-- select count(*) from public.user_clients uc
--   join public.clients c on c.id = uc.client_id
--   join public.accounts a on a.id = c.account_id and a.kind = 'agency'
--  where not exists (select 1 from public.account_members am
--                     where am.user_id = uc.user_id and am.account_id = a.id)
--    and not exists (select 1 from public.user_profiles p
--                     where p.id = uc.user_id and p.client_id = uc.client_id)
--    and uc.grant_source <> 'direct';                                                 -- EXPECT 0 (stray)
--
-- R1.7  relrowsecurity
-- select relname, relrowsecurity from pg_class
--  where oid in ('public.accounts'::regclass, 'public.account_members'::regclass, 'public.user_clients'::regclass)
--  order by relname;
--   -- EXPECT account_members t, accounts t, user_clients t
--
-- R1.8  relacl, compared against expected strings (aclitems sorted as text)
-- with exp(rel, acl) as (values
--   ('public.accounts',        '{authenticated=r/postgres,postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
--   ('public.account_members', '{authenticated=r/postgres,postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
--   ('public.user_clients',    '{anon=rxtm/postgres,authenticated=rxtm/postgres,postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
--   ('public.accounts_id_seq', '{postgres=rwU/postgres,service_role=rwU/postgres}'))
-- select e.rel, e.acl as expected,
--        (select array_agg(a::text order by a::text) from unnest(c.relacl) a)::text as got
--   from exp e join pg_class c on c.oid = e.rel::regclass
--  where (select array_agg(a::text order by a::text) from unnest(c.relacl) a)::text is distinct from e.acl;
--   -- EXPECT 0 rows. (user_clients keeps SELECT, REFERENCES, TRIGGER, MAINTAIN for
--   -- anon and authenticated: the spec revokes exactly INSERT, UPDATE, DELETE, TRUNCATE.)
--
-- R1.9  proacl, proconfig and SECURITY DEFINER of every function of this file
-- with exp(fn, acl) as (values
--   ('ensure_client_account',        '{postgres=X/postgres,service_role=X/postgres}'),
--   ('set_account_home',             '{postgres=X/postgres,service_role=X/postgres}'),
--   ('cleanup_empty_account',        '{postgres=X/postgres,service_role=X/postgres}'),
--   ('sync_primary_membership',      '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_reconcile',            '{postgres=X/postgres,service_role=X/postgres}'),
--   ('convert_to_agency',            '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_attach_brand',         '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_detach_brand',         '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_create_staff_profile', '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_create_guest_profile', '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_add_staff',           '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_remove_member',        '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_remove_guest',         '{postgres=X/postgres,service_role=X/postgres}'),
--   ('revert_agency_to_direct',      '{postgres=X/postgres,service_role=X/postgres}'),
--   ('repoint_default_brand',        '{postgres=X/postgres,service_role=X/postgres}'),
--   ('account_lock_brand',           '{postgres=X/postgres}'),
--   ('account_revoke_credentials',   '{postgres=X/postgres}'),
--   ('account_log_event',            '{postgres=X/postgres}'),
--   ('is_account_member',            '{authenticated=X/postgres,postgres=X/postgres,service_role=X/postgres}'),
--   ('brand_account_kind',           '{authenticated=X/postgres,postgres=X/postgres,service_role=X/postgres}'))
-- select e.fn, e.acl as expected_acl, g.acl as got_acl, g.cfg, g.secdef, g.n
--   from exp e
--   left join lateral (
--     select count(*) as n,
--            max((select array_agg(a::text order by a::text) from unnest(p.proacl) a)::text) as acl,
--            max(p.proconfig::text) as cfg,
--            bool_and(p.prosecdef) as secdef
--       from pg_proc p
--      where p.pronamespace = 'public'::regnamespace and p.proname = e.fn) g on true
--  where g.n <> 1
--     or g.acl is distinct from e.acl
--     or g.cfg is distinct from '{"search_path=\"\""}'
--     or g.secdef is distinct from true;
--   -- EXPECT 0 rows (one overload each, ACL as listed, search_path '', SECURITY DEFINER)
--
-- R1.10 triggers
-- select tgrelid::regclass, tgname, tgenabled from pg_trigger
--  where tgrelid in ('public.clients'::regclass, 'public.user_profiles'::regclass) and not tgisinternal
--  order by 1, 2;
--   -- EXPECT clients: trg_clients_cleanup_account, trg_clients_ensure_account,
--   --        trg_clients_set_account_home; user_profiles: trg_user_profiles_sync_membership; all 'O'
--
-- R1.11 policies on the new tables (the only two)
-- select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies
--  where schemaname = 'public' and tablename in ('accounts', 'account_members') order by 1, 2;
--   -- EXPECT 2 rows:
--   --   account_members_select SELECT {authenticated}
--   --     (is_admin() OR (user_id = auth.uid()) OR is_account_member(account_id))
--   --   accounts_select SELECT {authenticated} (is_admin() OR is_account_member(id))
--
-- R1.12 the user_clients policy is untouched
-- select policyname, cmd, qual from pg_policies where tablename = 'user_clients';
--   -- EXPECT 1 row: user_clients_own_read SELECT ((user_id = auth.uid()) OR is_admin())
--
-- R1.13 JWT expiry (spec 4.6): not readable from SQL. Read it in the Supabase
-- dashboard, Authentication, Sessions (or JWT settings), and record it in the
-- release record: it is how long a removed login's old token can still read RLS.
--
-- ============================================================================
-- ROLLBACK (by hand). Only BEFORE step 5, and only AFTER the step 3 rollback
-- and the dashboard revert. Invalid after step 8 (P4): deleting the backfill
-- rows then would lock every pre-existing customer out.
-- ============================================================================
--
-- begin;
-- -- step 2 half
-- drop policy if exists accounts_select on public.accounts;
-- drop policy if exists account_members_select on public.account_members;
-- drop trigger if exists trg_user_profiles_sync_membership on public.user_profiles;
-- drop function if exists public.repoint_default_brand(uuid, integer, uuid);
-- drop function if exists public.revert_agency_to_direct(integer, uuid);
-- drop function if exists public.account_remove_guest(integer, uuid, uuid);
-- drop function if exists public.account_remove_member(integer, uuid, uuid);
-- drop function if exists public.account_create_guest_profile(integer, uuid, uuid);
-- drop function if exists public.account_add_staff(integer, uuid, text, uuid);
-- drop function if exists public.account_create_staff_profile(integer, uuid, text, uuid);
-- drop function if exists public.account_detach_brand(integer, integer, uuid);
-- drop function if exists public.account_attach_brand(integer, integer, uuid[], uuid);
-- drop function if exists public.convert_to_agency(integer, uuid[], uuid);
-- drop function if exists public.account_log_event(integer, uuid, text, integer, integer, uuid);
-- drop function if exists public.account_revoke_credentials(uuid, integer[]);
-- drop function if exists public.account_lock_brand(integer);
-- drop function if exists public.sync_primary_membership();
-- drop function if exists public.account_reconcile(integer);
-- drop function if exists public.brand_account_kind(integer);
-- drop function if exists public.is_account_member(integer);
-- delete from public.user_clients where grant_source = 'backfill';
-- -- Leave the three user_clients columns and the DML revoke in place: nothing
-- -- writes user_clients from the browser, and has_client_access reads only
-- -- user_id and client_id. To remove the columns as well, only when no row is
-- -- left whose grant_source is not 'backfill':
-- --   alter table public.user_clients drop column if exists grant_source,
-- --     drop column if exists created_by, drop column if exists role;
-- --   drop index if exists public.idx_user_clients_client;
-- -- step 1 half
-- drop trigger if exists trg_clients_cleanup_account on public.clients;
-- drop trigger if exists trg_clients_set_account_home on public.clients;
-- drop trigger if exists trg_clients_ensure_account on public.clients;
-- drop function if exists public.cleanup_empty_account();
-- drop function if exists public.set_account_home();
-- drop function if exists public.ensure_client_account();
-- alter table public.clients alter column account_id drop not null;
-- alter table public.clients drop column if exists account_id;   -- drops the FK and idx_clients_account_id
-- drop table if exists public.account_members;
-- drop table if exists public.accounts;                            -- drops accounts_id_seq
-- commit;

begin;
set local lock_timeout = '5s';  -- on a timeout the whole transaction aborts cleanly; this file is safe to run again

-- ============================================================================
-- STEP 1
-- ============================================================================

-- 1.1 accounts and account_members (spec 4.3)
create table if not exists public.accounts (
  id             serial      primary key,
  name           text        not null,                                    -- display only
  kind           text        not null default 'direct'
                             constraint accounts_kind_check check (kind in ('direct', 'agency')),
  home_client_id integer     null references public.clients(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint agency_has_home check (kind = 'direct' or home_client_id is not null)
);
create unique index if not exists accounts_home_client_unique
  on public.accounts (home_client_id) where home_client_id is not null;

create table if not exists public.account_members (
  account_id integer     not null references public.accounts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)      on delete cascade,
  role       text        not null constraint account_members_role_check check (role in ('owner', 'manager')),
  created_by uuid        null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
create unique index if not exists account_members_one_account_per_user
  on public.account_members (user_id);                                     -- Q3: one account per login

-- 4.7, written out: project defaults grant arwdDxtm to anon and authenticated
alter table public.accounts        enable row level security;
alter table public.account_members enable row level security;
revoke all on public.accounts, public.account_members from anon, authenticated;
grant select on public.accounts, public.account_members to authenticated;
revoke all on sequence public.accounts_id_seq from anon, authenticated;     -- re-review N-I2

-- 1.2 clients.account_id, nullable until the backfill below
alter table public.clients
  add column if not exists account_id integer references public.accounts(id) on delete restrict;
create index if not exists idx_clients_account_id on public.clients (account_id);

-- 1.3 Internal helpers. Not callable by anyone but the function owner (no
-- grant to service_role): they run only inside the SECURITY DEFINER functions.

-- Takes the advisory lock of the account a brand belongs to and returns that
-- account id, re-reading the brand under the lock (spec 4.4, the
-- add_client_locations pattern, which uses hashtextextended).
create or replace function public.account_lock_brand(p_client_id integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc integer;
  v_now integer;
  i     integer;
begin
  select c.account_id into v_acc from public.clients c where c.id = p_client_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'client_not_found',
      detail = 'No client exists with this id.';
  end if;
  for i in 1..3 loop
    perform pg_advisory_xact_lock(hashtextextended('account:' || v_acc::text, 0));
    select c.account_id into v_now from public.clients c where c.id = p_client_id;
    if v_now is null then
      raise exception using errcode = 'P0001', message = 'client_not_found',
        detail = 'The client was deleted while this call waited.';
    end if;
    if v_now = v_acc then
      return v_acc;
    end if;
    v_acc := v_now;
  end loop;
  raise exception using errcode = '40001', message = 'concurrent_change',
    detail = 'The brand moved between accounts while this call waited; retry.';
end $f$;

-- One client_events row of type account_change, no email anywhere (spec 4.6).
create or replace function public.account_log_event(
  p_event_client_id integer, p_actor uuid, p_action text,
  p_account_id integer, p_brand_id integer, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $f$
begin
  insert into public.client_events (client_id, actor, type, meta)
  values (p_event_client_id, p_actor, 'account_change',
          jsonb_build_object('action',     p_action,
                             'actor',      p_actor,
                             'account_id', p_account_id,
                             'client_id',  p_brand_id,
                             'user_id',    p_user_id));
end $f$;

-- Closes every credential channel of a removed login (spec 4.6, 9.3): keys it
-- minted on the brands, OAuth grants on the brands (and their tokens, as
-- _oauth.js revokeGrant does), every unused OAuth code of the user (all
-- brands, N3-Md1), every open invite link of the user (N3-L3).
create or replace function public.account_revoke_credentials(p_user_id uuid, p_brands integer[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_keys    integer := 0;
  v_grants  uuid[];
  v_codes   integer := 0;
  v_invites integer := 0;
begin
  update public.client_api_keys k set revoked_at = now()
   where k.created_by = p_user_id and k.client_id = any (p_brands) and k.revoked_at is null;
  get diagnostics v_keys = row_count;

  with revoked as (
    update public.oauth_grants og set revoked_at = now()
     where og.user_id = p_user_id and og.client_id = any (p_brands) and og.revoked_at is null
    returning og.id
  )
  select coalesce(array_agg(r.id), '{}'::uuid[]) into v_grants from revoked r;

  update public.oauth_tokens t set revoked_at = now()
   where t.grant_id = any (v_grants) and t.revoked_at is null;

  update public.oauth_codes o set used_at = now()
   where o.user_id = p_user_id and o.used_at is null;
  get diagnostics v_codes = row_count;

  update public.client_invite_links l set revoked_at = now(), revoked_reason = 'revoked'
   where l.user_id = p_user_id and l.revoked_at is null;
  get diagnostics v_invites = row_count;

  return jsonb_build_object('keys_revoked',    v_keys,
                            'grants_revoked',  cardinality(v_grants),
                            'codes_used',      v_codes,
                            'invites_revoked', v_invites);
end $f$;

-- 1.4 The three triggers on clients (spec 4.3)
create or replace function public.ensure_client_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
begin
  if new.account_id is not null then
    raise exception using errcode = 'P0001', message = 'account_id_on_insert',
      detail = 'A new client always starts in its own direct account; account_attach_brand moves it.';
  end if;
  insert into public.accounts (name, kind) values (new.name, 'direct')
  returning id into new.account_id;
  return new;
end $f$;

create or replace function public.set_account_home()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
begin
  update public.accounts a set home_client_id = new.id
   where a.id = new.account_id and a.home_client_id is null;
  return null;
end $f$;

-- AFTER DELETE. Removes a direct account left empty; re-homes a direct account
-- that still holds brands when its home is null OR the deleted brand, so the
-- result does not depend on whether this fires before or after the foreign
-- key's set-null action (N3-I1). An agency home brand is refused (23514): by
-- agency_has_home when the set-null action fires first, by the explicit raise
-- below when this trigger fires first. Same SQLSTATE either way.
create or replace function public.cleanup_empty_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_kind text;
  v_home integer;
begin
  if old.account_id is null then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('account:' || old.account_id::text, 0));
  select a.kind, a.home_client_id into v_kind, v_home from public.accounts a where a.id = old.account_id;
  if not found then
    return null;
  end if;
  if v_kind = 'agency' then
    if v_home is null or v_home = old.id then
      raise exception using errcode = '23514', message = 'agency_has_home',
        detail = 'The home brand of an agency account cannot be deleted.';
    end if;
    return null;
  end if;
  if not exists (select 1 from public.clients c where c.account_id = old.account_id) then
    delete from public.accounts a where a.id = old.account_id;
  else
    update public.accounts a
       set home_client_id = (select min(c.id) from public.clients c where c.account_id = old.account_id)
     where a.id = old.account_id
       and (a.home_client_id is null or a.home_client_id = old.id);
  end if;
  return null;
end $f$;

-- 1.5 Backfill: one direct account per client, home = the client
with ins as (
  insert into public.accounts (name, kind, home_client_id)
  select c.name, 'direct', c.id
    from public.clients c
   where c.account_id is null
     and not exists (select 1 from public.accounts a where a.home_client_id = c.id)
  returning id, home_client_id
)
update public.clients c
   set account_id = ins.id
  from ins
 where c.id = ins.home_client_id;

-- repair pass, a no-op unless an earlier run was interrupted between the two halves
update public.clients c
   set account_id = a.id
  from public.accounts a
 where c.account_id is null
   and a.home_client_id = c.id;

-- 1.6 Backfill: account_members owners from user_profiles (review B Md2).
-- Direct accounts only, so a re-run never makes a guest an agency owner.
insert into public.account_members (account_id, user_id, role)
select c.account_id, p.id, 'owner'
  from public.user_profiles p
  join public.clients  c on c.id = p.client_id
  join public.accounts a on a.id = c.account_id and a.kind = 'direct'
on conflict do nothing;

-- 1.7 Triggers, created after the backfill (the backfill inserts no client)
drop trigger if exists trg_clients_ensure_account on public.clients;
create trigger trg_clients_ensure_account
  before insert on public.clients
  for each row execute function public.ensure_client_account();

drop trigger if exists trg_clients_set_account_home on public.clients;
create trigger trg_clients_set_account_home
  after insert on public.clients
  for each row execute function public.set_account_home();

drop trigger if exists trg_clients_cleanup_account on public.clients;
create trigger trg_clients_cleanup_account
  after delete on public.clients
  for each row execute function public.cleanup_empty_account();

-- 1.8 NOT NULL, the end of step 1
alter table public.clients alter column account_id set not null;

-- ============================================================================
-- STEP 2
-- ============================================================================

-- 2.1 user_clients columns (spec 4.2)
alter table public.user_clients
  add column if not exists role text not null default 'member'
    constraint user_clients_role_check check (role in ('owner', 'member'));
alter table public.user_clients
  add column if not exists created_by uuid null references auth.users(id) on delete set null;
alter table public.user_clients
  add column if not exists grant_source text not null default 'direct'
    constraint user_clients_grant_source_check
    check (grant_source in ('backfill', 'primary', 'account', 'direct'));
create index if not exists idx_user_clients_client on public.user_clients (client_id);

-- user_clients becomes THE authorization table (4.7, review B I6)
revoke insert, update, delete, truncate on public.user_clients from anon, authenticated;

-- 2.2 Backfill: one row per profile on its default brand, owner, backfill.
-- Over ALL profiles whose default brand's account is direct (all of them on a
-- first run), on conflict do nothing.
insert into public.user_clients (user_id, client_id, role, grant_source)
select p.id, p.client_id, 'owner', 'backfill'
  from public.user_profiles p
  join public.clients  c on c.id = p.client_id
  join public.accounts a on a.id = c.account_id and a.kind = 'direct'
on conflict do nothing;

-- the step 1 account_members backfill, re-run the same way (spec 13 step 2)
insert into public.account_members (account_id, user_id, role)
select c.account_id, p.id, 'owner'
  from public.user_profiles p
  join public.clients  c on c.id = p.client_id
  join public.accounts a on a.id = c.account_id and a.kind = 'direct'
on conflict do nothing;

-- 2.3 Read helpers (spec 5.2)
create or replace function public.is_account_member(p_account_id integer)
returns boolean
language sql
stable
security definer
set search_path = ''
as $f$
  select exists (select 1
                   from public.account_members m
                  where m.account_id = p_account_id
                    and m.user_id = auth.uid());
$f$;

create or replace function public.brand_account_kind(p_client_id integer)
returns text
language sql
stable
security definer
set search_path = ''
as $f$
  select a.kind
    from public.clients c
    join public.accounts a on a.id = c.account_id
   where c.id = p_client_id
     and (public.is_admin() or public.has_client_access(p_client_id));
$f$;

-- 2.4 The only policies on the new tables (spec 5.2). No write policy.
drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts
  for select to authenticated
  using (public.is_admin() or public.is_account_member(accounts.id));

drop policy if exists account_members_select on public.account_members;
create policy account_members_select on public.account_members
  for select to authenticated
  using (public.is_admin()
         or account_members.user_id = auth.uid()
         or public.is_account_member(account_members.account_id));

-- 2.5 The fan-out (spec 4.4). Inserts never overwrite (ON CONFLICT DO NOTHING);
-- deletes touch only grant_source = 'account' rows.
create or replace function public.account_reconcile(p_account_id integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_ins  integer := 0;
  v_del2 integer := 0;
  v_del3 integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));

  -- 1. every member times every brand of the account
  insert into public.user_clients (user_id, client_id, role, grant_source)
  select am.user_id, c.id,
         case when am.role = 'owner' then 'owner' else 'member' end,
         'account'
    from public.account_members am
    join public.clients c on c.account_id = am.account_id
   where am.account_id = p_account_id
  on conflict (user_id, client_id) do nothing;
  get diagnostics v_ins = row_count;

  -- 2. 'account' rows on this account's brands held by a non-member
  delete from public.user_clients uc
   using public.clients c
   where c.id = uc.client_id
     and c.account_id = p_account_id
     and uc.grant_source = 'account'
     and not exists (select 1 from public.account_members am
                      where am.account_id = p_account_id and am.user_id = uc.user_id);
  get diagnostics v_del2 = row_count;

  -- 3. 'account' rows of this account's members on brands no longer in it
  delete from public.user_clients uc
   using public.clients c
   where c.id = uc.client_id
     and c.account_id <> p_account_id
     and uc.grant_source = 'account'
     and exists (select 1 from public.account_members am
                  where am.account_id = p_account_id and am.user_id = uc.user_id);
  get diagnostics v_del3 = row_count;

  return jsonb_build_object('account_id', p_account_id,
                            'inserted',   v_ins,
                            'deleted',    v_del2 + v_del3);
end $f$;

-- 2.6 The membership trigger (spec 4.5), AFTER INSERT on user_profiles only
create or replace function public.sync_primary_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc  integer;
  v_kind text;
begin
  if new.client_id is null then
    return null;
  end if;
  -- the brand's account lock first, then read kind under it (4.4 lock order)
  v_acc := public.account_lock_brand(new.client_id);
  select a.kind into v_kind from public.accounts a where a.id = v_acc;

  insert into public.user_clients (user_id, client_id, role, grant_source)
  values (new.id, new.client_id,
          case when v_kind = 'agency' then 'member' else 'owner' end,
          'primary')
  on conflict (user_id, client_id) do nothing;

  if v_kind = 'direct' then
    -- a login already in another account is left out by the unique index
    insert into public.account_members (account_id, user_id, role)
    values (v_acc, new.id, 'owner')
    on conflict do nothing;
    perform public.account_reconcile(v_acc);
  end if;
  return null;
end $f$;

drop trigger if exists trg_user_profiles_sync_membership on public.user_profiles;
create trigger trg_user_profiles_sync_membership
  after insert on public.user_profiles
  for each row execute function public.sync_primary_membership();

-- ============================================================================
-- 2.7 Account write functions (spec 4.6). Each: SECURITY DEFINER, search_path
-- '', advisory lock first, one coded refusal per rule (errcode P0001, message
-- one snake_case token, detail plain text with no email), ends in
-- account_reconcile, writes one client_events 'account_change' row on the
-- account's home brand, returns jsonb.
-- ============================================================================

create or replace function public.convert_to_agency(
  p_account_id integer, p_confirm_user_ids uuid[], p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc         public.accounts%rowtype;
  v_brands      integer;
  v_home        integer;
  v_unconfirmed uuid[];
begin
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  if v_acc.kind = 'agency' then
    raise exception using errcode = 'P0001', message = 'account_already_agency',
      detail = 'The account is already an agency.';
  end if;
  select count(*), min(c.id) into v_brands, v_home
    from public.clients c where c.account_id = p_account_id;
  if v_brands = 0 then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'The account holds no brand.';
  end if;
  if v_brands > 1 then
    raise exception using errcode = 'P0001', message = 'account_has_several_brands',
      detail = format('The account holds %s brands; only a one-brand account can become an agency.', v_brands);
  end if;

  select coalesce(array_agg(u.uid order by u.uid), '{}'::uuid[]) into v_unconfirmed
    from (select p.id as uid from public.user_profiles p where p.client_id = v_home
          union
          select uc.user_id from public.user_clients uc where uc.client_id = v_home) u
   where not coalesce(u.uid = any (coalesce(p_confirm_user_ids, '{}'::uuid[])), false);
  if cardinality(v_unconfirmed) > 0 then
    raise exception using errcode = 'P0001', message = 'unconfirmed_users',
      detail = format('%s login(s) on the brand were not confirmed: %s',
                      cardinality(v_unconfirmed), array_to_string(v_unconfirmed, ', '));
  end if;

  update public.accounts a set kind = 'agency', home_client_id = v_home where a.id = p_account_id;

  -- Default-brand rows on the home brand become primary, role member: account
  -- owners manage the account through account_members, not a brand role.
  update public.user_clients uc
     set role = 'member',
         grant_source = case when uc.grant_source = 'backfill' then 'primary' else uc.grant_source end
   where uc.client_id = v_home
     and uc.grant_source in ('backfill', 'primary');

  perform public.account_reconcile(p_account_id);
  perform public.account_log_event(v_home, p_actor, 'convert_to_agency', p_account_id, v_home, null);
  return jsonb_build_object('account_id', p_account_id, 'home_client_id', v_home);
end $f$;

create or replace function public.account_attach_brand(
  p_account_id integer, p_client_id integer, p_confirm_user_ids uuid[], p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_src         integer;
  v_now         integer;
  v_ok          boolean := false;
  v_tgt         public.accounts%rowtype;
  v_name        text;
  v_category    text;
  v_stripe      boolean;
  v_src_kind    text;
  v_src_home    integer;
  v_src_brands  integer;
  v_unconfirmed uuid[];
  i             integer;
begin
  select c.account_id into v_src from public.clients c where c.id = p_client_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'client_not_found',
      detail = 'No client exists with this id.';
  end if;
  -- both accounts, ascending id order (4.4); re-read the brand under the locks
  for i in 1..3 loop
    perform pg_advisory_xact_lock(hashtextextended('account:' || least(v_src, p_account_id)::text, 0));
    if v_src <> p_account_id then
      perform pg_advisory_xact_lock(hashtextextended('account:' || greatest(v_src, p_account_id)::text, 0));
    end if;
    select c.account_id into v_now from public.clients c where c.id = p_client_id;
    if v_now is null then
      raise exception using errcode = 'P0001', message = 'client_not_found',
        detail = 'The client was deleted while this call waited.';
    end if;
    if v_now = v_src then
      v_ok := true;
      exit;
    end if;
    v_src := v_now;
  end loop;
  if not v_ok then
    raise exception using errcode = '40001', message = 'concurrent_change',
      detail = 'The brand moved between accounts while this call waited; retry.';
  end if;

  select * into v_tgt from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  if v_tgt.kind <> 'agency' then
    raise exception using errcode = 'P0001', message = 'account_not_agency',
      detail = 'Brands can be attached to an agency account only.';
  end if;

  select c.name, c.category, (c.stripe_customer_id is not null or c.stripe_subscription_id is not null)
    into v_name, v_category, v_stripe
    from public.clients c where c.id = p_client_id;
  if v_category in ('research', 'archived', 'test') then
    raise exception using errcode = 'P0001', message = 'brand_not_attachable',
      detail = format('A %s brand cannot be attached to an account.', v_category);
  end if;
  -- review F1: an agency brand never carries a Stripe customer or subscription
  -- (spec 8, guard 3). Attaching one would hand its billing portal to the
  -- agency's staff and keep billing the former customer. End the Stripe
  -- relation first, by hand, then attach.
  if v_stripe then
    raise exception using errcode = 'P0001', message = 'brand_has_stripe',
      detail = 'The brand carries a Stripe customer or subscription; end it before attaching the brand.';
  end if;

  select a.kind, a.home_client_id into v_src_kind, v_src_home from public.accounts a where a.id = v_src;
  if v_src_kind = 'agency' and v_src_home = p_client_id then
    raise exception using errcode = 'P0001', message = 'brand_is_agency_home',
      detail = 'The brand is the home brand of an agency account.';
  end if;
  select count(*) into v_src_brands from public.clients c where c.account_id = v_src;
  if v_src_brands > 1 then
    raise exception using errcode = 'P0001', message = 'brand_in_multi_brand_account',
      detail = 'The brand is already in an account that holds several brands.';
  end if;

  select coalesce(array_agg(u.uid order by u.uid), '{}'::uuid[]) into v_unconfirmed
    from (select p.id as uid from public.user_profiles p where p.client_id = p_client_id
          union
          select uc.user_id from public.user_clients uc where uc.client_id = p_client_id) u
   where not coalesce(u.uid = any (coalesce(p_confirm_user_ids, '{}'::uuid[])), false);
  if cardinality(v_unconfirmed) > 0 then
    raise exception using errcode = 'P0001', message = 'unconfirmed_users',
      detail = format('%s login(s) on the brand were not confirmed: %s',
                      cardinality(v_unconfirmed), array_to_string(v_unconfirmed, ', '));
  end if;

  -- move the brand
  update public.clients c set account_id = p_account_id where c.id = p_client_id;

  -- the former customer becomes a guest: role member, backfill becomes primary (N-Md3)
  update public.user_clients uc
     set role = 'member',
         grant_source = case when uc.grant_source = 'backfill' then 'primary' else uc.grant_source end
   where uc.client_id = p_client_id
     and uc.user_id = any (coalesce(p_confirm_user_ids, '{}'::uuid[]));

  -- out of the old direct account, which is then empty and goes
  delete from public.account_members m
   where m.account_id = v_src
     and m.user_id = any (coalesce(p_confirm_user_ids, '{}'::uuid[]));
  delete from public.accounts a
   where a.id = v_src
     and not exists (select 1 from public.clients c where c.account_id = v_src);

  perform public.account_reconcile(p_account_id);
  perform public.account_log_event(v_tgt.home_client_id, p_actor, 'attach_brand', p_account_id, p_client_id, null);
  return jsonb_build_object('account_id', p_account_id, 'client_id', p_client_id, 'brand_name', v_name);
end $f$;

create or replace function public.account_detach_brand(
  p_account_id integer, p_client_id integer, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc  public.accounts%rowtype;
  v_cur  integer;
  v_name text;
  v_new  integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  select c.account_id, c.name into v_cur, v_name from public.clients c where c.id = p_client_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'client_not_found',
      detail = 'No client exists with this id.';
  end if;
  if v_cur <> p_account_id then
    raise exception using errcode = 'P0001', message = 'brand_not_in_account',
      detail = 'The brand is not in this account.';
  end if;
  if v_acc.home_client_id = p_client_id then
    raise exception using errcode = 'P0001', message = 'brand_is_home',
      detail = 'The home brand of an account cannot be detached.';
  end if;

  -- a new direct account for the brand; its id is higher than p_account_id,
  -- so taking its lock now keeps the ascending order of 4.4
  insert into public.accounts (name, kind, home_client_id)
  values (v_name, 'direct', p_client_id)
  returning id into v_new;
  perform pg_advisory_xact_lock(hashtextextended('account:' || v_new::text, 0));

  update public.clients c set account_id = v_new where c.id = p_client_id;

  -- The reverse of attach: a login whose default brand is this brand and who
  -- still holds a row on it is owner of the brand and of the new account. A
  -- removed guest holds no row and stays removed.
  update public.user_clients uc
     set role = 'owner'
    from public.user_profiles p
   where p.id = uc.user_id
     and p.client_id = p_client_id
     and uc.client_id = p_client_id;
  insert into public.account_members (account_id, user_id, role, created_by)
  select v_new, p.id, 'owner', p_actor
    from public.user_profiles p
    join public.user_clients uc on uc.user_id = p.id and uc.client_id = p_client_id
   where p.client_id = p_client_id
  on conflict do nothing;

  perform public.account_reconcile(p_account_id);
  perform public.account_reconcile(v_new);
  perform public.account_log_event(v_acc.home_client_id, p_actor, 'detach_brand', p_account_id, p_client_id, null);
  return jsonb_build_object('account_id', v_new, 'client_id', p_client_id);
end $f$;

create or replace function public.account_create_staff_profile(
  p_account_id integer, p_user_id uuid, p_role text, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc public.accounts%rowtype;
begin
  if p_role is null or p_role not in ('owner', 'manager') then
    raise exception using errcode = 'P0001', message = 'invalid_role',
      detail = 'An account role is owner or manager.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  if v_acc.kind <> 'agency' then
    raise exception using errcode = 'P0001', message = 'account_not_agency',
      detail = 'Staff logins exist on agency accounts only.';
  end if;
  if exists (select 1 from public.user_profiles p where p.id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'profile_exists',
      detail = 'This login already has a profile.';
  end if;
  if exists (select 1 from public.account_members m where m.user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'user_in_account',
      detail = 'This login already belongs to an account.';
  end if;

  -- the 4.5 trigger writes the primary row on the home brand as member
  insert into public.user_profiles (id, client_id, role)
  values (p_user_id, v_acc.home_client_id, 'viewer');
  insert into public.account_members (account_id, user_id, role, created_by)
  values (p_account_id, p_user_id, p_role, p_actor);

  perform public.account_reconcile(p_account_id);
  perform public.account_log_event(v_acc.home_client_id, p_actor, 'create_staff_profile', p_account_id, v_acc.home_client_id, p_user_id);
  return jsonb_build_object('account_id', p_account_id, 'user_id', p_user_id, 'client_id', v_acc.home_client_id);
end $f$;

create or replace function public.account_add_staff(
  p_account_id integer, p_user_id uuid, p_role text, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc     public.accounts%rowtype;
  v_default integer;
begin
  if p_role is null or p_role not in ('owner', 'manager') then
    raise exception using errcode = 'P0001', message = 'invalid_role',
      detail = 'An account role is owner or manager.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  if v_acc.kind <> 'agency' then
    raise exception using errcode = 'P0001', message = 'account_not_agency',
      detail = 'Staff logins exist on agency accounts only.';
  end if;
  select p.client_id into v_default from public.user_profiles p where p.id = p_user_id;
  if v_default is distinct from v_acc.home_client_id then
    raise exception using errcode = 'P0001', message = 'not_home_default',
      detail = 'The login''s default brand is not this account''s home brand.';
  end if;
  if exists (select 1 from public.account_members m where m.user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'user_in_account',
      detail = 'This login already belongs to an account.';
  end if;

  insert into public.account_members (account_id, user_id, role, created_by)
  values (p_account_id, p_user_id, p_role, p_actor);

  perform public.account_reconcile(p_account_id);
  perform public.account_log_event(v_acc.home_client_id, p_actor, 'add_staff', p_account_id, v_acc.home_client_id, p_user_id);
  return jsonb_build_object('account_id', p_account_id, 'user_id', p_user_id);
end $f$;

-- Review F4: the guest login's profile, as ONE locked call (spec 9.1). The
-- brand's account lock is taken first, so a detach cannot commit between the
-- kind check and the insert. The 4.5 trigger then writes the primary row as
-- role member (the account is an agency) and no account_members row.
create or replace function public.account_create_guest_profile(
  p_client_id integer, p_user_id uuid, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc_id integer;
  v_acc    public.accounts%rowtype;
begin
  v_acc_id := public.account_lock_brand(p_client_id);           -- raises client_not_found
  select * into v_acc from public.accounts a where a.id = v_acc_id;
  if v_acc.kind is distinct from 'agency' then
    raise exception using errcode = 'P0001', message = 'brand_not_in_agency',
      detail = 'Guest logins exist on client brands of an agency account only.';
  end if;
  if v_acc.home_client_id = p_client_id then
    raise exception using errcode = 'P0001', message = 'brand_is_agency_home',
      detail = 'The home brand of an agency account takes staff logins, not guests.';
  end if;
  if exists (select 1 from public.user_profiles p where p.id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'profile_exists',
      detail = 'This login already has a profile.';
  end if;
  if exists (select 1 from public.account_members m where m.user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'user_in_account',
      detail = 'This login already belongs to an account.';
  end if;

  insert into public.user_profiles (id, client_id, role)
  values (p_user_id, p_client_id, 'viewer');

  perform public.account_reconcile(v_acc_id);
  perform public.account_log_event(coalesce(v_acc.home_client_id, p_client_id), p_actor, 'create_guest_profile', v_acc_id, p_client_id, p_user_id);
  return jsonb_build_object('account_id', v_acc_id, 'user_id', p_user_id, 'client_id', p_client_id);
end $f$;

create or replace function public.account_remove_member(
  p_account_id integer, p_user_id uuid, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc    public.accounts%rowtype;
  v_role   text;
  v_owners integer;
  v_brands integer[];
  v_rows   integer := 0;
  v_cred   jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  select m.role into v_role from public.account_members m
   where m.account_id = p_account_id and m.user_id = p_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'user_not_member',
      detail = 'This login is not a member of the account.';
  end if;
  if v_role = 'owner' then
    select count(*) into v_owners from public.account_members m
     where m.account_id = p_account_id and m.role = 'owner';
    if v_owners <= 1 then
      raise exception using errcode = 'P0001', message = 'last_owner',
        detail = 'The last owner of an account cannot be removed.';
    end if;
  end if;

  delete from public.account_members m where m.account_id = p_account_id and m.user_id = p_user_id;

  -- every row the user holds on every brand of the account, any grant_source (N-Md1, N-L5)
  v_brands := array(select c.id from public.clients c where c.account_id = p_account_id order by c.id);
  delete from public.user_clients uc where uc.user_id = p_user_id and uc.client_id = any (v_brands);
  get diagnostics v_rows = row_count;

  perform public.account_reconcile(p_account_id);
  v_cred := public.account_revoke_credentials(p_user_id, v_brands);
  perform public.account_log_event(coalesce(v_acc.home_client_id, v_brands[1]), p_actor, 'remove_member', p_account_id, null, p_user_id);

  return jsonb_build_object('ban_login',       true,
                            'account_id',      p_account_id,
                            'user_id',         p_user_id,
                            'rows_deleted',    v_rows,
                            'keys_revoked',    (v_cred ->> 'keys_revoked')::integer,
                            'grants_revoked',  (v_cred ->> 'grants_revoked')::integer,
                            'codes_used',      (v_cred ->> 'codes_used')::integer,
                            'invites_revoked', (v_cred ->> 'invites_revoked')::integer);
end $f$;

create or replace function public.account_remove_guest(
  p_client_id integer, p_user_id uuid, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc_id integer;
  v_acc    public.accounts%rowtype;
  v_rows   integer := 0;
  v_cred   jsonb;
begin
  v_acc_id := public.account_lock_brand(p_client_id);           -- raises client_not_found
  select * into v_acc from public.accounts a where a.id = v_acc_id;
  if v_acc.kind <> 'agency' then
    raise exception using errcode = 'P0001', message = 'brand_not_in_agency',
      detail = 'The brand is not in an agency account.';
  end if;
  if exists (select 1 from public.account_members m
              where m.account_id = v_acc_id and m.user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'user_is_account_member',
      detail = 'This login is a member of the account; use account_remove_member.';
  end if;
  if not exists (select 1 from public.user_clients uc where uc.user_id = p_user_id and uc.client_id = p_client_id)
     and not exists (select 1 from public.user_profiles p where p.id = p_user_id and p.client_id = p_client_id) then
    raise exception using errcode = 'P0001', message = 'user_not_member',
      detail = 'This login holds nothing on the brand.';
  end if;

  delete from public.user_clients uc where uc.user_id = p_user_id and uc.client_id = p_client_id;
  get diagnostics v_rows = row_count;

  perform public.account_reconcile(v_acc_id);
  v_cred := public.account_revoke_credentials(p_user_id, array[p_client_id]);
  perform public.account_log_event(coalesce(v_acc.home_client_id, p_client_id), p_actor, 'remove_guest', v_acc_id, p_client_id, p_user_id);

  return jsonb_build_object('ban_login',       true,
                            'account_id',      v_acc_id,
                            'user_id',         p_user_id,
                            'rows_deleted',    v_rows,
                            'keys_revoked',    (v_cred ->> 'keys_revoked')::integer,
                            'grants_revoked',  (v_cred ->> 'grants_revoked')::integer,
                            'codes_used',      (v_cred ->> 'codes_used')::integer,
                            'invites_revoked', (v_cred ->> 'invites_revoked')::integer);
end $f$;

create or replace function public.revert_agency_to_direct(p_account_id integer, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_acc public.accounts%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('account:' || p_account_id::text, 0));
  select * into v_acc from public.accounts a where a.id = p_account_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'account_not_found',
      detail = 'No account exists with this id.';
  end if;
  if v_acc.kind <> 'agency' then
    raise exception using errcode = 'P0001', message = 'account_not_agency',
      detail = 'The account is not an agency.';
  end if;
  if exists (select 1 from public.clients c
              where c.account_id = p_account_id and c.id <> v_acc.home_client_id) then
    raise exception using errcode = 'P0001', message = 'account_has_client_brands',
      detail = 'Detach every client brand before reverting the account.';
  end if;

  update public.accounts a set kind = 'direct' where a.id = p_account_id;

  -- account owners own the home brand again; every account_members row is kept
  update public.user_clients uc
     set role = 'owner'
   where uc.client_id = v_acc.home_client_id
     and uc.grant_source = 'primary'
     and exists (select 1 from public.account_members m
                  where m.account_id = p_account_id and m.user_id = uc.user_id and m.role = 'owner');

  perform public.account_reconcile(p_account_id);
  perform public.account_log_event(v_acc.home_client_id, p_actor, 'revert_agency_to_direct', p_account_id, v_acc.home_client_id, null);
  return jsonb_build_object('account_id', p_account_id);
end $f$;

create or replace function public.repoint_default_brand(
  p_user_id uuid, p_client_id integer, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_old     integer;
  v_old_acc integer;
  v_new_acc integer;
  v_home    integer;
begin
  select p.client_id into v_old from public.user_profiles p where p.id = p_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'user_not_member',
      detail = 'This login has no profile.';
  end if;
  select c.account_id into v_new_acc from public.clients c where c.id = p_client_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'client_not_found',
      detail = 'No client exists with this id.';
  end if;
  select c.account_id into v_old_acc from public.clients c where c.id = v_old;

  -- both accounts, ascending id order (4.4)
  if v_old_acc is null or v_new_acc <= v_old_acc then
    v_new_acc := public.account_lock_brand(p_client_id);
    if v_old is not null then v_old_acc := public.account_lock_brand(v_old); end if;
  else
    v_old_acc := public.account_lock_brand(v_old);
    v_new_acc := public.account_lock_brand(p_client_id);
  end if;

  if v_old is not distinct from p_client_id then
    return jsonb_build_object('user_id', p_user_id, 'client_id', p_client_id);
  end if;
  if not exists (select 1 from public.user_clients uc
                  where uc.user_id = p_user_id and uc.client_id = p_client_id) then
    raise exception using errcode = 'P0001', message = 'no_row_on_brand',
      detail = 'The login holds no membership row on the new brand.';
  end if;

  update public.user_profiles p set client_id = p_client_id where p.id = p_user_id;
  if v_old is not null then
    delete from public.user_clients uc
     where uc.user_id = p_user_id and uc.client_id = v_old
       and uc.grant_source in ('primary', 'backfill');
  end if;
  update public.user_clients uc set grant_source = 'primary'
   where uc.user_id = p_user_id and uc.client_id = p_client_id;

  if v_old_acc is not null then
    perform public.account_reconcile(v_old_acc);
  end if;
  if v_old_acc is distinct from v_new_acc then
    perform public.account_reconcile(v_new_acc);
  end if;
  select a.home_client_id into v_home from public.accounts a where a.id = v_new_acc;
  perform public.account_log_event(coalesce(v_home, p_client_id), p_actor, 'repoint_default_brand', v_new_acc, p_client_id, p_user_id);
  return jsonb_build_object('user_id', p_user_id, 'client_id', p_client_id);
end $f$;

-- ============================================================================
-- 2.8 Grants (spec 4.7, written out). CREATE FUNCTION grants EXECUTE to PUBLIC,
-- and the project's default privileges add anon, authenticated, service_role.
-- ============================================================================
revoke execute on function
  public.ensure_client_account(),
  public.set_account_home(),
  public.cleanup_empty_account(),
  public.sync_primary_membership(),
  public.account_reconcile(integer),
  public.convert_to_agency(integer, uuid[], uuid),
  public.account_attach_brand(integer, integer, uuid[], uuid),
  public.account_detach_brand(integer, integer, uuid),
  public.account_add_staff(integer, uuid, text, uuid),
  public.account_create_staff_profile(integer, uuid, text, uuid),
  public.account_create_guest_profile(integer, uuid, uuid),
  public.revert_agency_to_direct(integer, uuid),
  public.account_remove_member(integer, uuid, uuid),
  public.account_remove_guest(integer, uuid, uuid),
  public.repoint_default_brand(uuid, integer, uuid)
  from public, anon, authenticated;
grant execute on function
  public.ensure_client_account(),
  public.set_account_home(),
  public.cleanup_empty_account(),
  public.sync_primary_membership(),
  public.account_reconcile(integer),
  public.convert_to_agency(integer, uuid[], uuid),
  public.account_attach_brand(integer, integer, uuid[], uuid),
  public.account_detach_brand(integer, integer, uuid),
  public.account_add_staff(integer, uuid, text, uuid),
  public.account_create_staff_profile(integer, uuid, text, uuid),
  public.account_create_guest_profile(integer, uuid, uuid),
  public.revert_agency_to_direct(integer, uuid),
  public.account_remove_member(integer, uuid, uuid),
  public.account_remove_guest(integer, uuid, uuid),
  public.repoint_default_brand(uuid, integer, uuid)
  to service_role;

-- internal helpers: the function owner only
revoke execute on function
  public.account_lock_brand(integer),
  public.account_revoke_credentials(uuid, integer[]),
  public.account_log_event(integer, uuid, text, integer, integer, uuid)
  from public, anon, authenticated, service_role;

revoke execute on function public.is_account_member(integer), public.brand_account_kind(integer)
  from public, anon;
grant execute on function public.is_account_member(integer), public.brand_account_kind(integer)
  to authenticated, service_role;

commit;
