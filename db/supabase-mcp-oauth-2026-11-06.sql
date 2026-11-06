-- supabase-mcp-oauth-2026-11-06.sql
--
-- MCP stage 3: OAuth sign-in for the Claude connector directory.
-- Spec: docs/arch/mcp-stage3-oauth.md sections 5 and 6.2 (RULED 2026-11-06,
-- Constantin: "Defaults, build it"; every default of section 9 applies).
--
-- APPLIED BY CONSTANTIN in the Supabase SQL Editor, never by an agent.
-- Additive and re-runnable: four new tables, one new nullable column on
-- fix_states, one replaced trigger function. No existing row changes value.
-- Rollback at the end (section 10).
--
-- ORDER: apply BEFORE the dashboard push that ships oauth-*.js and the new
-- mcp-server.js. Without the tables the token and authorize endpoints answer
-- 500 and Connected apps lists nothing; keys keep working either way.
--
-- SECRETS. Tokens, codes, request ids and client secrets are stored only as
-- sha256 hex. Every write goes through the service role inside the Netlify
-- functions. RLS is on for all four tables. The browser may SELECT only the
-- named, non-secret columns of oauth_grants for its own client (admins: all).
-- No INSERT, UPDATE or DELETE policy for authenticated anywhere, and no DELETE
-- policy for anyone: revoke sets revoked_at. Only the optional pruning job in
-- section 7 deletes rows (expired tokens and old codes), as the service role.

-- 1. OAuth clients ------------------------------------------------------------
-- id: a confidential client's random id (bgoc_<24 hex>, minted by
-- client-api-keys.js create_anthropic_client), or a CIMD client's https URL.
-- kind confidential carries secret_hash; kind cimd never does, and carries the
-- cached document (metadata, fetched_at, refreshed after 24 h).
create table if not exists public.oauth_clients (
  id             text        primary key check (char_length(id) between 1 and 512),
  kind           text        not null check (kind in ('confidential', 'cimd')),
  name           text        not null default '' check (char_length(name) <= 200),
  redirect_uris  text[]      not null default '{}',
  secret_hash    text        check (secret_hash is null or secret_hash ~ '^[a-f0-9]{64}$'),
  metadata       jsonb,
  fetched_at     timestamptz,
  created_at     timestamptz not null default now(),
  disabled_at    timestamptz,
  constraint oauth_clients_secret_by_kind check ((kind = 'confidential') = (secret_hash is not null))
);

comment on table public.oauth_clients is
  'MCP stage 3 OAuth clients (docs/arch/mcp-stage3-oauth.md). confidential: the Anthropic-held client, secret stored as sha256 only. cimd: a cached Client ID Metadata Document. Service role only.';

-- 2. Grants: one consent of one user for one BrandGEO client and one OAuth client.
create table if not exists public.oauth_grants (
  id               uuid        primary key default gen_random_uuid(),
  client_id        integer     not null references public.clients(id) on delete cascade,
  user_id          uuid        not null,
  oauth_client_id  text        not null references public.oauth_clients(id),
  client_name      text        not null default '' check (char_length(client_name) <= 200),
  redirect_host    text        not null default '' check (char_length(redirect_host) <= 255),
  scope            text        not null default 'mcp:read'
                   check (scope ~ '^(mcp:read|mcp:write|offline_access)( (mcp:read|mcp:write|offline_access))*$'),
  created_at       timestamptz not null default now(),
  last_used_at     timestamptz,
  revoked_at       timestamptz,
  expires_at       timestamptz not null
);

comment on table public.oauth_grants is
  'MCP stage 3 OAuth grants. user_id has no FK (like client_api_keys.created_by) so deleting a login keeps the audit row. One live grant per (user_id, oauth_client_id, client_id). Revoke sets revoked_at; grants are kept for audit.';

create unique index if not exists oauth_grants_one_live
  on public.oauth_grants (user_id, oauth_client_id, client_id) where revoked_at is null;
create index if not exists idx_oauth_grants_client_live
  on public.oauth_grants (client_id) where revoked_at is null;

-- 3. Codes, including the pending consent request (code_hash null until Allow).
create table if not exists public.oauth_codes (
  id                uuid        primary key default gen_random_uuid(),
  code_hash         text        unique check (code_hash is null or code_hash ~ '^[a-f0-9]{64}$'),
  request_id_hash   text        not null unique check (request_id_hash ~ '^[a-f0-9]{64}$'),
  oauth_client_id   text        not null references public.oauth_clients(id),
  user_id           uuid        not null,
  client_id         integer     not null references public.clients(id) on delete cascade,
  redirect_uri      text        not null check (char_length(redirect_uri) <= 512),
  code_challenge    text        not null check (code_challenge ~ '^[A-Za-z0-9._~-]{43,128}$'),
  scope_requested   text        not null,
  scope_granted     text,
  resource          text,
  state             text        check (state is null or char_length(state) <= 1024),
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null,
  used_at           timestamptz,
  grant_id          uuid        references public.oauth_grants(id) on delete cascade
);

comment on table public.oauth_codes is
  'MCP stage 3 authorization codes and pending consent requests. Hashes only. Single use: used_at is set by the statement that reads the code. Service role only.';

create index if not exists idx_oauth_codes_created on public.oauth_codes (created_at);

-- 4. Tokens.
-- rotated_from points at the refresh token this pair replaced. ON DELETE SET
-- NULL so the pruning job can delete an old token that a newer one names.
create table if not exists public.oauth_tokens (
  id            uuid        primary key default gen_random_uuid(),
  grant_id      uuid        not null references public.oauth_grants(id) on delete cascade,
  kind          text        not null check (kind in ('access', 'refresh')),
  token_hash    text        not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  scope         text        not null
                check (scope ~ '^(mcp:read|mcp:write|offline_access)( (mcp:read|mcp:write|offline_access))*$'),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  used_at       timestamptz,
  revoked_at    timestamptz,
  rotated_from  uuid        references public.oauth_tokens(id) on delete set null
);

comment on table public.oauth_tokens is
  'MCP stage 3 OAuth tokens: bgmat_ access (1 h) and bgmrt_ refresh (30 d, rotating, reuse revokes the grant). sha256 only. Service role only.';

create index if not exists idx_oauth_tokens_grant on public.oauth_tokens (grant_id);
create index if not exists idx_oauth_tokens_expires on public.oauth_tokens (expires_at);

-- 5. RLS and privileges ---------------------------------------------------------
alter table public.oauth_clients enable row level security;
alter table public.oauth_grants  enable row level security;
alter table public.oauth_codes   enable row level security;
alter table public.oauth_tokens  enable row level security;

-- Supabase grants ALL on new public tables to anon and authenticated by
-- default. Take it all back; service_role is untouched.
revoke all on public.oauth_clients from anon, authenticated;
revoke all on public.oauth_grants  from anon, authenticated;
revoke all on public.oauth_codes   from anon, authenticated;
revoke all on public.oauth_tokens  from anon, authenticated;

-- The browser reads its own client's grants (Connected apps, and the hub's
-- "Marked done ... by Claude" line through fix_states.marked_by_grant).
-- Column list: no user_id. RLS cannot hide a column, so it is withheld by
-- privilege, as client_api_keys.key_hash is.
drop policy if exists oauth_grants_select on public.oauth_grants;
create policy oauth_grants_select on public.oauth_grants
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

grant select (id, client_id, oauth_client_id, client_name, redirect_host, scope, created_at, last_used_at, revoked_at, expires_at)
  on public.oauth_grants to authenticated;

-- No policy at all on oauth_clients, oauth_codes and oauth_tokens: with RLS on
-- and no privilege, authenticated and anon read and write nothing there.

-- 6. fix_states.marked_by_grant and the guard ------------------------------------
-- Which OAuth grant marked a fix. Null for every dashboard and key mark.
-- NO ACTION, for the reason stage 2 gave for marked_by_key: the guard pins
-- the column on update, so ON DELETE SET NULL would leave a row pointing at a
-- deleted grant. Grants are never deleted by the product; a client delete
-- cascades to grants and fix_states in one statement and the NO ACTION check
-- runs at its end, when the fix_states rows are already gone.
alter table public.fix_states
  add column if not exists marked_by_grant uuid
  references public.oauth_grants(id);

-- fix_states_guard(), amended. Identical to the version in
-- db/supabase-mcp-fix-writes-2026-11-06.sql except that marked_by_grant is
-- treated exactly as marked_by_key:
--   * on the move into done or dismissed: kept when auth.uid() is null (the
--     service role, the MCP path), forced to null for a dashboard user;
--   * on every other update: pinned to its old value;
--   * on insert of an open row: null.
create or replace function public.fix_states_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('open','done','dismissed') then
      raise exception 'fix_states: a new row must start as open, done or dismissed';
    end if;
    new.created_at := now();
    new.updated_at := now();
    new.checked_at := null;
    new.check_value := null;
    new.check_n := null;
    if new.status in ('done','dismissed') then
      new.marked_at := now();
      new.marked_by := auth.uid();
      if auth.uid() is not null then
        new.marked_by_key := null;
        new.marked_by_grant := null;
      end if;
    else
      new.marked_at := null;
      new.marked_by := null;
      new.marked_by_key := null;
      new.marked_by_grant := null;
    end if;
    if new.status <> 'done' then
      new.baseline_value := null;
      new.baseline_n := null;
    end if;
    return new;
  end if;

  -- UPDATE
  new.id         := old.id;
  new.client_id  := old.client_id;
  new.fix_id     := old.fix_id;
  new.created_at := old.created_at;
  new.updated_at := now();

  if new.status is distinct from old.status
     and new.status in ('done','dismissed') then
    new.marked_at := now();
    new.marked_by := auth.uid();
    if auth.uid() is not null then
      new.marked_by_key := null;
      new.marked_by_grant := null;
    end if;
    new.checked_at := null;
    new.check_value := null;
    new.check_n := null;
    if new.status <> 'done' then
      new.baseline_value := null;
      new.baseline_n := null;
    end if;
    return new;
  end if;

  -- Every other update keeps the mark, the markers and the baseline as they were.
  new.marked_at       := old.marked_at;
  new.marked_by       := old.marked_by;
  new.marked_by_key   := old.marked_by_key;
  new.marked_by_grant := old.marked_by_grant;
  new.baseline_value  := old.baseline_value;
  new.baseline_n      := old.baseline_n;

  if new.status in ('verified','reopened') then
    if new.status is distinct from old.status then
      if old.status <> 'done' then
        raise exception 'fix_states: a verdict can only follow done';
      end if;
      if old.marked_at is null or now() < old.marked_at + interval '7 days' then
        raise exception 'fix_states: a verdict needs 7 days after marked_at';
      end if;
      new.checked_at := now();
    else
      new.checked_at  := old.checked_at;
      new.check_value := old.check_value;
      new.check_n     := old.check_n;
    end if;
  else
    -- open (reopened by hand), or done/dismissed edited in place: keep the
    -- last verdict for the record.
    new.checked_at  := old.checked_at;
    new.check_value := old.check_value;
    new.check_n     := old.check_n;
  end if;

  return new;
end;
$$;

revoke all on function public.fix_states_guard() from public, anon, authenticated;

-- The trigger itself is unchanged (fix_states_guard_trg, before insert or
-- update, for each row); create or replace of the function is enough.
-- client_events_type_check is unchanged: the audit type stays mcp_fix_marked,
-- with grant_id in meta instead of key_id.

-- 7. OPTIONAL: pruning job (ruling R9). RUN ONLY ON CONSTANTIN'S GO -------------
--
-- One live connection refreshing hourly writes about 48 token rows a day.
-- This deletes tokens whose expires_at is more than 7 days past and codes
-- (and pending requests) older than a day. Grants are never deleted. The
-- scheduler pattern of 2026-09-12 (affiliate cron): one job, 04:45 UTC, after
-- the affiliate jobs at 04:35 and 04:40. Uncomment and run on its own.
--
--   select cron.schedule('mcp-oauth-prune', '45 4 * * *', $job$
--     delete from public.oauth_tokens where expires_at < now() - interval '7 days';
--     delete from public.oauth_codes  where created_at < now() - interval '1 day';
--   $job$);
--
--   -- Read back:
--   select jobid, jobname, schedule, active from cron.job where jobname = 'mcp-oauth-prune';
--   -- To pause: select cron.alter_job(job_id => <jobid>, active => false);
--   -- To remove: select cron.unschedule('mcp-oauth-prune');

-- 8. Read back after applying -------------------------------------------------------
--
--   select table_name, relrowsecurity
--   from information_schema.tables t join pg_class c on c.relname = t.table_name
--   where t.table_schema = 'public' and t.table_name like 'oauth\_%' order by 1;
--   -- EXPECT four rows, relrowsecurity true on each.
--
--   select tablename, policyname, cmd, roles, qual from pg_policies
--   where tablename like 'oauth\_%' order by 1, 2;
--   -- EXPECT exactly one row: oauth_grants_select, SELECT, {authenticated},
--   -- (is_admin() OR (client_id = get_my_client_id())). No DELETE policy anywhere.
--
--   select table_name, column_name, privilege_type from information_schema.column_privileges
--   where table_schema = 'public' and table_name like 'oauth\_%'
--     and grantee in ('anon', 'authenticated') order by 1, 2;
--   -- EXPECT only oauth_grants, grantee authenticated, SELECT on ten columns:
--   -- client_id, client_name, created_at, expires_at, id, last_used_at,
--   -- oauth_client_id, redirect_host, revoked_at, scope. Never user_id, and
--   -- nothing on oauth_clients, oauth_codes or oauth_tokens.
--
--   select has_table_privilege('authenticated', 'public.oauth_tokens', 'select') as tok,
--          has_table_privilege('authenticated', 'public.oauth_codes', 'select') as codes,
--          has_table_privilege('authenticated', 'public.oauth_clients', 'select') as clients,
--          has_table_privilege('anon', 'public.oauth_grants', 'select') as anon_grants,
--          has_column_privilege('authenticated', 'public.oauth_grants', 'user_id', 'select') as grant_user;
--   -- EXPECT all five false.
--
--   select indexname, indexdef from pg_indexes
--   where schemaname = 'public' and tablename like 'oauth\_%' order by 1;
--   -- EXPECT among them oauth_grants_one_live, UNIQUE on
--   -- (user_id, oauth_client_id, client_id) WHERE (revoked_at IS NULL).
--
--   select column_name, data_type, is_nullable from information_schema.columns
--   where table_schema = 'public' and table_name = 'fix_states' and column_name = 'marked_by_grant';
--   -- EXPECT marked_by_grant uuid YES.
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'fix_states_marked_by_grant_fkey';
--   -- EXPECT FOREIGN KEY (marked_by_grant) REFERENCES oauth_grants(id), no ON DELETE clause.
--
--   select prosrc ~ 'marked_by_grant' as amended,
--          has_function_privilege('authenticated', 'public.fix_states_guard()', 'execute') as auth_exec
--   from pg_proc where proname = 'fix_states_guard';
--   -- EXPECT amended true, auth_exec false.
--
--   select count(*) from public.fix_states where marked_by_grant is not null;
--   -- EXPECT 0.

-- 9. RLS and trigger probe, one transaction, ROLLED BACK ------------------------
--
-- Fill the four placeholders from read-only selects first: a viewer's
-- user_profiles.id, that viewer's client_id, another client's id, and any
-- free fix id string. Nothing survives the rollback.
--
--   begin;
--   -- As the service role (the SQL editor's default): seed one client, two
--   -- grants (own and foreign), a code and a token.
--   insert into public.oauth_clients (id, kind, name, redirect_uris, secret_hash)
--   values ('bgoc_000000000000000000000000', 'confidential', 'Probe',
--           array['https://claude.ai/api/mcp/auth_callback'], repeat('0', 64));
--   insert into public.oauth_grants (id, client_id, user_id, oauth_client_id, client_name, redirect_host, scope, expires_at)
--   values ('00000000-0000-4000-8000-0000000000a1', <CLIENT_ID>, '<VIEWER_UUID>', 'bgoc_000000000000000000000000', 'Probe', 'claude.ai', 'mcp:read mcp:write', now() + interval '90 days'),
--          ('00000000-0000-4000-8000-0000000000a2', <OTHER_CLIENT_ID>, '<VIEWER_UUID>', 'bgoc_000000000000000000000000', 'Probe', 'claude.ai', 'mcp:read', now() + interval '90 days');
--   insert into public.oauth_tokens (grant_id, kind, token_hash, scope, expires_at)
--   values ('00000000-0000-4000-8000-0000000000a1', 'access', repeat('1', 64), 'mcp:read', now() + interval '1 hour');
--   insert into public.oauth_codes (request_id_hash, oauth_client_id, user_id, client_id, redirect_uri, code_challenge, scope_requested, expires_at)
--   values (repeat('2', 64), 'bgoc_000000000000000000000000', '<VIEWER_UUID>', <CLIENT_ID>, 'https://claude.ai/api/mcp/auth_callback', repeat('a', 43), 'mcp:read', now() + interval '5 minutes');
--
--   -- a) the browser side: a viewer sees only its own client's grant
--   set local role authenticated;
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<VIEWER_UUID>', 'role', 'authenticated')::text, true);
--   select id, client_id, client_name, redirect_host, scope from public.oauth_grants order by id;
--   -- EXPECT one row, ...a1, <CLIENT_ID>. Not ...a2.
--
--   -- b) never a code, token, client or secret hash, never user_id:
--   select has_table_privilege('public.oauth_tokens', 'select') as tok,
--          has_table_privilege('public.oauth_codes', 'select') as codes,
--          has_table_privilege('public.oauth_clients', 'select') as clients,
--          has_column_privilege('public.oauth_grants', 'user_id', 'select') as grant_user,
--          has_table_privilege('public.oauth_grants', 'insert') as ins,
--          has_table_privilege('public.oauth_grants', 'update') as upd,
--          has_table_privilege('public.oauth_grants', 'delete') as del;
--   -- EXPECT all seven false. (Selecting those tables directly would raise
--   -- "permission denied" and abort this transaction, so the probe asks the
--   -- privilege functions instead.)
--
--   -- c) a viewer cannot claim a grant on fix_states, on insert ...
--   insert into public.fix_states (client_id, fix_id, status, marked_by_grant)
--   values (<CLIENT_ID>, '<FIX_ID>', 'done', '00000000-0000-4000-8000-0000000000a1')
--   returning marked_by, marked_by_key, marked_by_grant;
--   -- EXPECT marked_by = <VIEWER_UUID>, marked_by_key null, marked_by_grant null
--
--   -- ... nor by editing the row in place ...
--   update public.fix_states set marked_by_grant = '00000000-0000-4000-8000-0000000000a1', title = 'probe'
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>'
--   returning marked_by_grant;
--   -- EXPECT null
--
--   -- ... nor on a fresh move into done.
--   update public.fix_states set status = 'open'
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>';
--   update public.fix_states set status = 'done', marked_by_grant = '00000000-0000-4000-8000-0000000000a1'
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>'
--   returning marked_by, marked_by_grant;
--   -- EXPECT marked_by = <VIEWER_UUID>, marked_by_grant null
--
--   -- d) the service role path (auth.uid() null) keeps the grant and no user
--   reset role;
--   select set_config('request.jwt.claims', '', true);
--   update public.fix_states set status = 'open'
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>';
--   update public.fix_states set status = 'done', marked_by_key = null,
--          marked_by_grant = '00000000-0000-4000-8000-0000000000a1'
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>'
--   returning marked_by, marked_by_key, marked_by_grant;
--   -- EXPECT marked_by null, marked_by_key null, marked_by_grant ...a1
--
--   -- e) and pins it on a later in-place edit
--   update public.fix_states set title = 'probe 2', marked_by_grant = null
--   where client_id = <CLIENT_ID> and fix_id = '<FIX_ID>'
--   returning marked_by_grant;
--   -- EXPECT ...a1
--
--   -- f) one live grant per (user, OAuth client, BrandGEO client). The DO
--   --    block catches the expected error itself, so the editor's batch
--   --    does not abort; any other outcome raises and stops the probe.
--   do $probe$
--   begin
--     insert into public.oauth_grants (client_id, user_id, oauth_client_id, scope, expires_at)
--     values (<CLIENT_ID>, '<VIEWER_UUID>', 'bgoc_000000000000000000000000', 'mcp:read', now() + interval '1 day');
--     raise exception 'probe f FAILED: a second live grant was accepted';
--   exception when unique_violation then
--     raise notice 'probe f ok: oauth_grants_one_live refused a second live grant';
--   end
--   $probe$;
--   -- EXPECT NOTICE probe f ok
--
--   rollback;

-- 10. Rollback (run by hand only if stage 3 is withdrawn) ------------------------
--
-- Order matters. The guard goes back FIRST: plpgsql resolves columns at run
-- time, so with marked_by_grant dropped and the amended body in place, the
-- next fix_states write fails. Revert the dashboard push that ships
-- oauth-*.js and the new mcp-server.js before step b, or every OAuth call
-- answers 500 (keys keep working: their path never reads these tables).
-- Dropping the tables disconnects every Claude connection and loses which
-- grant marked each fix; the marks themselves stay.
--
--   -- a) restore the stage 2 guard: run section 3 of
--   --    db/supabase-mcp-fix-writes-2026-11-06.sql (create or replace
--   --    function ... plus its revoke).
--   -- b) then:
--   select cron.unschedule('mcp-oauth-prune');   -- only if section 7 was run
--   alter table public.fix_states drop column if exists marked_by_grant;
--   drop table if exists public.oauth_tokens;
--   drop table if exists public.oauth_codes;
--   drop table if exists public.oauth_grants;
--   drop table if exists public.oauth_clients;
