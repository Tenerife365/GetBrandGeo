-- supabase-mcp-fix-writes-2026-11-06.sql
--
-- MCP stage 2: per-key write scope and the MCP marker on fix_states.
-- Spec: docs/arch/mcp-stage2-fixes.md sections 4 and 9.2 (ruled 2026-11-06,
-- Constantin: "Defaults, build it").
--
-- Additive: two columns, one replaced trigger function, and one CHECK on
-- client_events.type widened by one value (step 4, the audit type section 5
-- needs). No row changes value: every existing key gets scope 'read' (the
-- default), every existing fix_states row gets marked_by_key null. Safe to
-- re-run. Rollback at the end.
--
-- APPLY BEFORE THE DASHBOARD PUSH. The page selects marked_by_key; without
-- the column its fix_states read fails and the hub falls back to all open.

-- 1. Write scope per MCP key (ruling 1). Existing keys stay read only.
alter table public.client_api_keys
  add column if not exists scope text not null default 'read';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_api_keys'::regclass
      and conname = 'client_api_keys_scope_check'
  ) then
    alter table public.client_api_keys
      add constraint client_api_keys_scope_check check (scope in ('read', 'read_write'));
  end if;
end $$;

-- client_api_keys grants SELECT to authenticated column by column (key_hash is
-- withheld by privilege); scope is safe to read, so it joins that list.
grant select (scope) on public.client_api_keys to authenticated;

-- 2. Which MCP key marked a fix. Null for every dashboard mark.
--
-- Plain reference (NO ACTION), as section 4 states, deliberately NOT
-- "on delete set null": the referential SET NULL is an UPDATE on fix_states,
-- and fix_states_guard() below pins marked_by_key to its old value on such an
-- update, so the row would keep pointing at a deleted key with no error (the
-- FK recheck is skipped when the column did not change). Keys are never
-- deleted by the product (revoke sets revoked_at). A client delete cascades to
-- both tables in one statement and the NO ACTION check runs at its end, when
-- the fix_states rows are already gone, so delete-client.js keeps working.
alter table public.fix_states
  add column if not exists marked_by_key uuid
  references public.client_api_keys(id);

-- 3. fix_states_guard(), amended. Identical to the 2026-11-06 version except
-- for marked_by_key:
--   * on the move into done or dismissed: when auth.uid() is null (service
--     role, the MCP path) keep new.marked_by_key and leave marked_by null;
--     when auth.uid() is set (a dashboard user) force marked_by_key to null.
--     So a browser can never claim an MCP key and MCP can never claim a user.
--   * on every other update marked_by_key is pinned to its old value.
--   * on insert of an open row it is null.

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
      end if;
    else
      new.marked_at := null;
      new.marked_by := null;
      new.marked_by_key := null;
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

  -- Every other update keeps the mark, the marker and the baseline as they were.
  new.marked_at      := old.marked_at;
  new.marked_by      := old.marked_by;
  new.marked_by_key  := old.marked_by_key;
  new.baseline_value := old.baseline_value;
  new.baseline_n     := old.baseline_n;

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

-- 4. The audit type (section 5). client_events carries a CHECK on type
-- (db/supabase-client-events-type-check-2026-07-31.sql, read live 2026-11-06:
-- eight values, no 'mcp_fix_marked'), so without this every mark_fix_done
-- audit insert would be refused. The constraint is rebuilt with the same eight
-- values plus the new one; no existing row changes. Re-runnable.
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
    'mcp_fix_marked'
  ));

-- 5. Read back after applying ---------------------------------------------------
--
--   select table_name, column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema = 'public'
--     and ((table_name = 'client_api_keys' and column_name = 'scope')
--       or (table_name = 'fix_states' and column_name = 'marked_by_key'));
--   -- EXPECT scope text NO 'read'::text; marked_by_key uuid YES null.
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conname in ('client_api_keys_scope_check', 'fix_states_marked_by_key_fkey');
--   -- EXPECT the CHECK (scope in read, read_write) and the FK
--   -- FOREIGN KEY (marked_by_key) REFERENCES client_api_keys(id), with no
--   -- ON DELETE clause.
--
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.client_events'::regclass
--     and conname = 'client_events_type_check';
--   -- EXPECT the eight earlier values plus 'mcp_fix_marked'.
--
--   select column_name, privilege_type from information_schema.column_privileges
--   where table_schema = 'public' and table_name = 'client_api_keys'
--     and grantee = 'authenticated' order by column_name;
--   -- EXPECT SELECT on nine columns (the eight from 2026-09-22 plus scope),
--   -- never key_hash.
--
--   select scope, count(*) from public.client_api_keys group by scope;
--   -- EXPECT every existing key on 'read'.
--
--   select count(*) filter (where marked_by_key is not null) from public.fix_states;
--   -- EXPECT 0.
--
--   select prosrc ~ 'marked_by_key' as amended,
--          has_function_privilege('authenticated', 'public.fix_states_guard()', 'execute') as auth_exec
--   from pg_proc where proname = 'fix_states_guard';
--   -- EXPECT amended true, auth_exec false.
--
--   select tgname, tgenabled from pg_trigger
--   where tgrelid = 'public.fix_states'::regclass and not tgisinternal;
--   -- EXPECT fix_states_guard_trg, O.

-- 6. RLS and trigger probe (section 4 step 4), one transaction, ROLLED BACK ------
--
-- Fill the three placeholders from read-only selects first: a viewer's
-- user_profiles.id, that viewer's client_id, and the id of any key row of that
-- client. Nothing survives the rollback.
--
--   begin;
--   set local role authenticated;
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<VIEWER_UUID>', 'role', 'authenticated')::text, true);
--
--   -- a) a viewer inserting a done row cannot claim a key
--   insert into public.fix_states (client_id, fix_id, status, marked_by_key)
--   values (<CLIENT_ID>, 'probe:marked_by_key', 'done', '<KEY_ID>')
--   returning marked_by, marked_by_key;
--   -- EXPECT marked_by = <VIEWER_UUID>, marked_by_key null
--
--   -- b) nor by editing the row in place
--   update public.fix_states set marked_by_key = '<KEY_ID>', title = 'probe'
--   where client_id = <CLIENT_ID> and fix_id = 'probe:marked_by_key'
--   returning marked_by_key;
--   -- EXPECT null
--
--   -- c) nor on a fresh move into done
--   update public.fix_states set status = 'open'
--   where client_id = <CLIENT_ID> and fix_id = 'probe:marked_by_key';
--   update public.fix_states set status = 'done', marked_by_key = '<KEY_ID>'
--   where client_id = <CLIENT_ID> and fix_id = 'probe:marked_by_key'
--   returning marked_by, marked_by_key;
--   -- EXPECT marked_by = <VIEWER_UUID>, marked_by_key null
--
--   -- d) the viewer cannot touch another client's rows (repeats the 2026-11-06 probe)
--   update public.fix_states set title = 'probe' where client_id <> <CLIENT_ID>
--   returning id;
--   -- EXPECT 0 rows
--
--   -- e) the service role path (auth.uid() null) keeps the key and no user
--   reset role;
--   select set_config('request.jwt.claims', '', true);
--   update public.fix_states set status = 'open'
--   where client_id = <CLIENT_ID> and fix_id = 'probe:marked_by_key';
--   update public.fix_states set status = 'done', marked_by_key = '<KEY_ID>'
--   where client_id = <CLIENT_ID> and fix_id = 'probe:marked_by_key'
--   returning marked_by, marked_by_key;
--   -- EXPECT marked_by null, marked_by_key = <KEY_ID>
--
--   -- f) the new audit type is accepted
--   insert into public.client_events (client_id, type, meta)
--   values (<CLIENT_ID>, 'mcp_fix_marked', '{}'::jsonb) returning id;
--   -- EXPECT one id
--
--   rollback;

-- 7. Rollback (run by hand only if stage 2 is withdrawn) -------------------------
--
-- Run in this order. The guard goes back FIRST: plpgsql resolves columns at
-- run time, so with the column dropped and the amended body still in place,
-- the next fix_states write would fail on marked_by_key. Dropping the column
-- loses which key marked each fix; the marks themselves stay. The dashboard
-- push that selects marked_by_key must be reverted before step a, or its
-- fix_states read fails (the hub then falls back to all open).
--
--   -- a) restore the 2026-11-06 guard: run section 2 of
--   --    db/supabase-fix-states-migration-2026-11-06.sql (create or replace
--   --    function ... plus its revoke).
--   alter table public.fix_states drop column if exists marked_by_key;
--   revoke select (scope) on public.client_api_keys from authenticated;
--   alter table public.client_api_keys drop constraint if exists client_api_keys_scope_check;
--   alter table public.client_api_keys drop column if exists scope;
--   -- b) only when no 'mcp_fix_marked' row exists (else delete them first or
--   --    keep the wider check): rebuild the eight-value check from
--   --    db/supabase-client-events-type-check-2026-07-31.sql after
--   --    alter table public.client_events drop constraint client_events_type_check;
