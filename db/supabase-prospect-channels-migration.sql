-- ============================================================================
-- supabase-prospect-channels-migration.sql
-- Extends BrandGEO's prospect CRM (public.prospects,
-- supabase-prospects-migration.sql) from one implicit channel to three:
-- email, LinkedIn, X. Packet: bg-backend building this data half while
-- bg-app builds the UI in parallel against the exact same contract, so the
-- column names, the channel/direction values, and the table shape below are
-- FIXED. Do not rename a column or a value without saying so loudly, the
-- other agent is building against this at the same time.
--
-- WHY THIS EXISTS
--   Constantin runs outreach across three channels. prospects today has only
--   contact_url and linkedin_url, no email column, no X column, and no way
--   to record that LinkedIn was tried Monday and email Thursday. On a list
--   of nine named founders that is the difference between founder led sales
--   and double touching (or losing track of) a real person.
--
-- PART 1: new columns on prospects
--   contact_email          text, no format constraint (research-supplied,
--                           not user input from a form).
--   contact_email_source    the URL where the email was found, never a
--                           guess. Free text, not FK'd to anything.
--   contact_email_kind      'individual' | 'role' | null. info@ reaches a
--                           queue, an individual address reaches a person;
--                           the CHECK below enforces exactly those two
--                           values or null (not yet researched).
--   x_url                   profile URL on X, same shape as linkedin_url.
--   x_verified               false by default. LinkedIn returns HTTP 999 to
--   linkedin_verified        automated clients, so an unverified profile URL
--                           is neither confirmed nor denied -- it must never
--                           render as fact until a human or a successful
--                           fetch confirms it. Both default false, both
--                           NOT NULL (a URL with no verification attempt yet
--                           is false, not unknown-as-null).
--
-- PART 2: new table prospect_touches
--   One prospect, many touches, across any of the three channels, in either
--   direction. This is what makes three channels workable instead of a
--   single last_contacted_at date with no history.
--
-- RLS: ADMIN ONLY, no exceptions, same pattern as public.prospects itself --
-- public.is_admin() gates every verb, and prospects-admin.js additionally
-- holds the service key behind requireAuth({ adminOnly: true }), so these
-- policies are defence in depth for direct PostgREST access with a user JWT,
-- not the primary gate. This table holds the BODIES of real messages to
-- named people at real companies -- containment matters at least as much as
-- it does for prospects itself.
--
-- Run this once in the Supabase SQL Editor for the brandgeo-dashboard project
-- (duiyifepitvugyulobqm). Safe to re-run (add column if not exists, create
-- table if not exists, drop policy if exists throughout).
--
-- AMENDED 2026-08-15 by supabase-prospect-touches-restrict-2026-08-15.sql:
-- prospect_id's FK was originally "on delete cascade" (bg-verify finding S3,
-- docs/qa/prospect-channels-review-2026-08-15.md) and is now
-- "on delete restrict" below, so a fresh apply of this file on a clean
-- database creates the corrected constraint directly. Production, which had
-- already applied the old CASCADE version, needed the separate amendment
-- file because CREATE TABLE IF NOT EXISTS does not alter an existing table.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: prospects gains six columns
-- ---------------------------------------------------------------------------
alter table public.prospects add column if not exists contact_email        text;
alter table public.prospects add column if not exists contact_email_source text;
alter table public.prospects add column if not exists contact_email_kind   text;
alter table public.prospects add column if not exists x_url                text;
alter table public.prospects add column if not exists x_verified           boolean not null default false;
alter table public.prospects add column if not exists linkedin_verified    boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospects_contact_email_kind_check') then
    alter table public.prospects
      add constraint prospects_contact_email_kind_check
      check (contact_email_kind in ('individual','role') or contact_email_kind is null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Part 2: prospect_touches
--
--   channel      'email' | 'linkedin' | 'x', CHECK enforced below.
--   direction    'out' | 'in', CHECK enforced below.
--   occurred_at  when the touch happened, defaults to now() for a touch
--                logged as it happens, overridable for backfilling a touch
--                that already happened (e.g. importing a LinkedIn thread).
--   subject/body/note  all nullable free text. subject is meaningful for
--                email, generally null for linkedin/x; body is the message
--                content when captured, note is a human annotation
--                ("left voicemail", "liked the reply") that is not itself
--                the message.
-- ---------------------------------------------------------------------------
create table if not exists public.prospect_touches (
  id           bigserial primary key,
  prospect_id  bigint not null references public.prospects(id) on delete restrict,
  channel      text not null,
  direction    text not null,
  occurred_at  timestamptz not null default now(),
  subject      text,
  body         text,
  note         text,
  created_at   timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospect_touches_channel_check') then
    alter table public.prospect_touches
      add constraint prospect_touches_channel_check
      check (channel in ('email','linkedin','x'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospect_touches_direction_check') then
    alter table public.prospect_touches
      add constraint prospect_touches_direction_check
      check (direction in ('out','in'));
  end if;
end $$;

create index if not exists idx_prospect_touches_prospect_id  on public.prospect_touches(prospect_id);
create index if not exists idx_prospect_touches_occurred_at  on public.prospect_touches(occurred_at);

alter table public.prospect_touches enable row level security;

drop policy if exists prospect_touches_select on public.prospect_touches;
create policy prospect_touches_select on public.prospect_touches
  for select to authenticated
  using (public.is_admin());

drop policy if exists prospect_touches_insert on public.prospect_touches;
create policy prospect_touches_insert on public.prospect_touches
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists prospect_touches_update on public.prospect_touches;
create policy prospect_touches_update on public.prospect_touches
  for update to authenticated
  using      (public.is_admin())
  with check (public.is_admin());

drop policy if exists prospect_touches_delete on public.prospect_touches;
create policy prospect_touches_delete on public.prospect_touches
  for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- VERIFICATION (run after applying):
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='prospects'
--     and column_name in ('contact_email','contact_email_source',
--       'contact_email_kind','x_url','x_verified','linkedin_verified');
--   -- Expect: all 6 rows present.
--
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename = 'prospect_touches' order by cmd;
--   -- Expect: RLS enabled, all four policies scoped to {authenticated}, all
--   -- USING/WITH CHECK calling public.is_admin(), no bare qual=true.
-- ============================================================================
