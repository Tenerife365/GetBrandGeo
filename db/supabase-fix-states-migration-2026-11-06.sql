-- supabase-fix-states-migration-2026-11-06.sql
--
-- Done, verified, reopened and dismissed states for the Fix This hub on the
-- AI Visibility page. Design: docs/arch/fix-states.md (approved by Constantin
-- 2026-11-06, all five defaults).
--
-- Additive only: one new table, one trigger function, three policies. No
-- existing table or row is touched. Safe to re-run.
--
-- Apply ONLY on Constantin's go, then run the read-back at the end. The
-- dashboard push that uses this table must come AFTER the apply, or the first
-- "Mark as done" fails on a missing table.

-- 1. Table ---------------------------------------------------------------------

create table if not exists public.fix_states (
  id              bigint generated always as identity primary key,
  client_id       integer     not null references public.clients(id) on delete cascade,
  fix_id          text        not null
                  check (fix_id ~ '^[a-z_]{1,40}(:.{1,150})?$'),
  status          text        not null default 'open'
                  check (status in ('open','done','verified','reopened','dismissed')),
  title           text        check (title is null or char_length(title) <= 500),
  metric_key      text        check (metric_key is null or char_length(metric_key) <= 200),
  baseline_value  numeric,
  baseline_n      integer     check (baseline_n is null or baseline_n >= 0),
  marked_at       timestamptz,
  marked_by       uuid,
  checked_at      timestamptz,
  check_value     numeric,
  check_n         integer     check (check_n is null or check_n >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, fix_id)
);

comment on table public.fix_states is
  'One row per client and Fix This item. No row means open. fix_id is the stable id from src/lib/fixStates.ts. Stamps (marked_*, checked_at, updated_at) are set by trigger, never trusted from the browser. No DELETE policy: reopen sets status to open.';

create index if not exists idx_fix_states_client on public.fix_states (client_id);

-- 2. Trigger: server-side stamps and allowed transitions ----------------------
--
-- RLS cannot restrict columns or transitions, so this trigger does it:
--   * id, client_id, fix_id and created_at can never change after insert;
--   * marked_at / marked_by are stamped from now() and auth.uid() whenever the
--     row moves INTO done or dismissed, and are otherwise pinned;
--   * the baseline is writable only on the move into done, pinned otherwise;
--   * a verdict (verified, reopened) is allowed only from done, and only 7 days
--     or more after marked_at (the wait in design section 8, question 1);
--     checked_at is stamped from now();
--   * an insert may only start as open, done or dismissed.
-- Applies to service_role too (triggers are not bypassed by RLS bypass).

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
    else
      new.marked_at := null;
      new.marked_by := null;
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
    new.checked_at := null;
    new.check_value := null;
    new.check_n := null;
    if new.status <> 'done' then
      new.baseline_value := null;
      new.baseline_n := null;
    end if;
    return new;
  end if;

  -- Every other update keeps the mark and the baseline as they were.
  new.marked_at      := old.marked_at;
  new.marked_by      := old.marked_by;
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
      -- Same verdict written again: nothing about it may change.
      new.checked_at  := old.checked_at;
      new.check_value := old.check_value;
      new.check_n     := old.check_n;
    end if;
  elsif new.status = 'open' then
    -- Reopened by hand: keep the last verdict for the record.
    new.checked_at  := old.checked_at;
    new.check_value := old.check_value;
    new.check_n     := old.check_n;
  else
    -- done -> done or dismissed -> dismissed with other columns edited.
    new.checked_at  := old.checked_at;
    new.check_value := old.check_value;
    new.check_n     := old.check_n;
  end if;

  return new;
end;
$$;

revoke all on function public.fix_states_guard() from public, anon, authenticated;

drop trigger if exists fix_states_guard_trg on public.fix_states;
create trigger fix_states_guard_trg
  before insert or update on public.fix_states
  for each row execute function public.fix_states_guard();

-- 3. RLS -------------------------------------------------------------------------

alter table public.fix_states enable row level security;

drop policy if exists fix_states_select on public.fix_states;
drop policy if exists fix_states_insert on public.fix_states;
drop policy if exists fix_states_update on public.fix_states;

create policy fix_states_select on public.fix_states
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

create policy fix_states_insert on public.fix_states
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

-- UPDATE needs both clauses, so a row can never be moved into another tenant
-- (the trigger pins client_id as well; keep both).
create policy fix_states_update on public.fix_states
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

-- Deliberately no DELETE policy: what a client said they did is never erased
-- from the browser. Rows go only with their client (on delete cascade).

-- 4. Read back after applying -------------------------------------------------
--
--   select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'fix_states'
--   order by ordinal_position;
--   -- EXPECT 15 columns as above.
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.fix_states'::regclass order by conname;
--   -- EXPECT pkey, unique (client_id, fix_id), FK to clients on delete cascade,
--   -- and the fix_id, status, title, metric_key, baseline_n, check_n CHECKs.
--
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where tablename = 'fix_states' order by cmd;
--   -- EXPECT exactly 3 (INSERT, SELECT, UPDATE), roles {authenticated},
--   -- no DELETE policy, no qual = true.
--
--   select relrowsecurity from pg_class where oid = 'public.fix_states'::regclass;
--   -- EXPECT true.
--
--   select tgname, tgenabled from pg_trigger
--   where tgrelid = 'public.fix_states'::regclass and not tgisinternal;
--   -- EXPECT fix_states_guard_trg, O.
