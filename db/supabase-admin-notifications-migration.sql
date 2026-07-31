-- ============================================================================
-- supabase-admin-notifications-migration.sql   (Admin notification bell, 2026-07-21)
--
-- WHY. Today a new signup (e.g. "Slatehq") or a Stripe subscription change only
-- surfaces in a console.log and, eventually, as a new row in the admin client
-- switcher. There is no proactive signal. This adds the feed behind an in-dashboard
-- notification bell: server-side (service role) rows written by signup-client.js,
-- stripe-webhook.js and expire-plan-grants.js; admins read them + mark them read.
--
-- Read state is a single shared read_at (the admin team is small; one admin
-- marking read marks for all). If per-admin read is ever needed, add a
-- reads(notification_id, user_id) table -- the feed rows stay as-is.
--
-- DEPENDS ON public.is_admin() (supabase-multitenant-migration.sql). Live.
-- SAFE TO RE-RUN. Run once in the Supabase SQL editor, project duiyifepitvugyulobqm.
-- ============================================================================

create table if not exists public.admin_notifications (
  id          bigserial primary key,
  type        text        not null,   -- new_signup | subscription_new | subscription_changed | subscription_canceled | trial_expired
  client_id   integer     references public.clients(id) on delete set null,
  title       text        not null,
  body        text        not null default '',
  meta        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  read_at     timestamptz              -- null = unread
);

create index if not exists idx_admin_notifications_created on public.admin_notifications(created_at desc);
create index if not exists idx_admin_notifications_unread  on public.admin_notifications(read_at) where read_at is null;

alter table public.admin_notifications enable row level security;

-- Admins read the whole feed and mark items read. Inserts are service-role only
-- (no insert policy), so only the backend can create notifications.
drop policy if exists admin_notifications_select on public.admin_notifications;
create policy admin_notifications_select on public.admin_notifications
  for select to authenticated
  using (public.is_admin());

drop policy if exists admin_notifications_update on public.admin_notifications;
create policy admin_notifications_update on public.admin_notifications
  for update to authenticated
  using      (public.is_admin())
  with check (public.is_admin());

-- ── Verification ────────────────────────────────────────────────────────────
--   select policyname, cmd from pg_policies where tablename='admin_notifications';
-- ============================================================================
