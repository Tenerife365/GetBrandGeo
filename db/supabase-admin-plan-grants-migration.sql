-- ============================================================================
-- supabase-admin-plan-grants-migration.sql   (Admin plan management, 2026-07-21)
--
-- WHY. Admins need to (a) change a client's plan/tier from the dashboard, (b)
-- grant one-off trials/comps (e.g. push Talentwelove free -> Managed at no fee
-- for a period), with a congratulatory notification to the client, and (c) have
-- those grants auto-expire back to Free. The clients table is service-role
-- write-only, so all writes go through admin-gated Netlify functions; this
-- migration adds the columns those functions need plus two tables:
--   * client_events        -- append-only audit log of every plan action (also
--                             the backbone the Pass-2 admin notification bell
--                             will read). Admin-readable, service-role-written.
--   * client_notifications -- CLIENT-facing in-dashboard banners ("You've
--                             unlocked Managed"). The owning client reads + can
--                             dismiss its own; admins read all; only the service
--                             role inserts.
--
-- DEPENDS ON the helper fns from supabase-multitenant-migration.sql:
--   public.is_admin(), public.get_my_client_id().  Already live.
--
-- SAFE TO RE-RUN (add column if not exists / create table if not exists / drop
-- policy if exists throughout). Run once in the Supabase SQL editor, project
-- duiyifepitvugyulobqm.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. clients: how the current plan was set, and the grant period (for comps).
-- ---------------------------------------------------------------------------
--   plan_source: 'stripe'  -> paid self-serve subscription (stripe-webhook.js)
--                'manual'  -> admin set it, treated as a normal paid/assigned plan
--                'trial'   -> time-limited grant, auto-expires to free
--                'comp'    -> complimentary grant, auto-expires to free
--                'signup'  -> the initial free signup default
--                'expired' -> was a grant that lapsed back to free
--                null      -> legacy / unknown (predates this migration)
-- plan_grant_until: the date a 'trial'/'comp' grant reverts to free (watched by
--   expire-plan-grants.js). NULL for paid/manual plans. Kept separate from
--   paid_until (a billing DISPLAY date) so auto-expiry only ever touches grants.
alter table public.clients add column if not exists plan_source     text;
alter table public.clients add column if not exists plan_grant_until date;
alter table public.clients add column if not exists plan_grant_note  text;

-- ---------------------------------------------------------------------------
-- 2. client_events -- append-only audit log of plan actions + system events.
-- ---------------------------------------------------------------------------
create table if not exists public.client_events (
  id          bigserial primary key,
  client_id   integer     not null references public.clients(id) on delete cascade,
  actor       uuid,                                   -- admin auth.users.id, null = system/auto
  type        text        not null,                   -- plan_change | trial_grant | comp_grant | trial_expired | signup | stripe_change
  from_plan   text,
  to_plan     text,
  meta        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_client_events_client  on public.client_events(client_id, created_at desc);
create index if not exists idx_client_events_created on public.client_events(created_at desc);

alter table public.client_events enable row level security;

-- Admins read the whole log (per-client history + the future global feed).
-- Inserts are service-role only (bypasses RLS); no insert/update/delete policy
-- exists, so authenticated users cannot write or tamper with the audit trail.
drop policy if exists client_events_select on public.client_events;
create policy client_events_select on public.client_events
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. client_notifications -- CLIENT-facing in-dashboard banners.
-- ---------------------------------------------------------------------------
create table if not exists public.client_notifications (
  id            bigserial primary key,
  client_id     integer     not null references public.clients(id) on delete cascade,
  kind          text        not null,                 -- plan_grant | plan_change | trial_expired
  title         text        not null,
  body          text        not null,
  meta          jsonb       not null default '{}'::jsonb,  -- { plan, unlocked:[], until, tone }
  cta_label     text,
  cta_url       text,
  created_at    timestamptz not null default now(),
  dismissed_at  timestamptz                            -- set when the client dismisses the banner
);

create index if not exists idx_client_notifications_client
  on public.client_notifications(client_id, created_at desc);

alter table public.client_notifications enable row level security;

-- The owning client (and admins) may READ these.
drop policy if exists client_notifications_select on public.client_notifications;
create policy client_notifications_select on public.client_notifications
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

-- The owning client (and admins) may UPDATE only to dismiss their own banner.
-- WITH CHECK keeps the row on the same client_id so a dismiss cannot reassign it.
drop policy if exists client_notifications_update on public.client_notifications;
create policy client_notifications_update on public.client_notifications
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

-- No insert/delete policy: notifications are created server-side (service role).

-- ── Verification ────────────────────────────────────────────────────────────
--   select column_name from information_schema.columns
--   where table_name='clients' and column_name like 'plan_%';       -- 3 rows
--   select tablename, policyname, cmd from pg_policies
--   where tablename in ('client_events','client_notifications') order by 1,3;
-- ============================================================================
