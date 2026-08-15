-- ============================================================================
-- supabase-prospects-migration.sql
-- BrandGEO's own prospect CRM (data half). Packet: bg-backend building the
-- data side while bg-app builds the UI in parallel against this exact
-- contract, so the column names and stage values below are FIXED. Do not
-- rename a column or a stage value without saying so loudly, the other agent
-- is building against this at the same time.
--
-- WHY THIS EXISTS
--   108 audits across 70 domains (prospect_audits), a tiered prospect list on
--   Google Drive (docs/... no, it lives outside the repo:
--   G:\My Drive\CST Content\GetBrandGEO\7-Sales\2026-08-14-founder-led-prospecting\),
--   and a daily pipeline producing 20 more prospects a day, live in three
--   disconnected places with nothing joining them. This table is the join.
--
-- DO NOT TOUCH prospect_leads (supabase-prospect-audits-migration.sql).
--   It means "someone gave us their email", has a live writer
--   (unlock-audit-report.js) and email NOT NULL. This table is separate and
--   joins to it and to prospect_audits only by domain, never by FK, because
--   prospect_audits rows are anonymous/ephemeral audit runs and a prospects
--   row is a durable CRM record that outlives any single audit.
--
-- RLS: ADMIN ONLY, no exceptions. This table holds unreleased commercial data
-- about named companies (contact people, roles, internal qualification notes)
-- and no client viewer may ever read it. Pattern copied from
-- supabase-promotions-migration.sql / promotions-admin.js: public.is_admin()
-- (supabase-multitenant-migration.sql) gates every verb, and the Netlify
-- function additionally holds the service key behind
-- requireAuth({ adminOnly: true }) so these policies are defence in depth for
-- direct PostgREST access with a user JWT, not the primary gate.
--
-- Run this once in the Supabase SQL Editor for the brandgeo-dashboard project
-- (duiyifepitvugyulobqm). Safe to re-run (create ... if not exists / drop
-- policy if exists throughout).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at trigger (security definer, pinned search_path), same shape as
-- public.seo_set_updated_at() / public.social_set_updated_at().
-- ---------------------------------------------------------------------------
create or replace function public.prospects_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- prospects
--
--   domain               joins to prospect_audits.domain. Unique: one CRM
--                        row per company, even though a domain can carry
--                        many prospect_audits rows over time (re-audits).
--   contact_url          the contact route we VERIFIED returns 200, not a
--                        guessed /contact. Distinct from a generic website.
--   segment              free-text vertical (e.g. "legal practice management
--                        software"), usually carried straight from the
--                        latest ready prospect_audits.category.
--   tier                 1 qualified, 2 open, 3 removed. Null when a row was
--                        never run through the 4-check qualification bar at
--                        all (05-STANDING-CORRECTIONS-AND-RUNBOOK-V2.md).
--   stage                the CRM pipeline stage. CHECK constraint below so a
--                        typo cannot enter one nobody is filtering on.
--   audit_token / ai_score / competitor_count
--                        carried across from the LATEST ready prospect_audits
--                        row for this domain at backfill/refresh time. Not
--                        FK'd (prospect_audits rows are anonymous and can be
--                        purged on their own retention schedule per
--                        supabase-prospect-audits-migration.sql), so these
--                        are a point-in-time snapshot, refreshed by whatever
--                        job re-audits a domain later, not a live join.
--   source               'outbound' (default, our own researched target
--                        list) | 'inbound' (a real visitor ran their own
--                        public audit and we noticed) | others as the
--                        pipeline grows.
-- ---------------------------------------------------------------------------
create table if not exists public.prospects (
  id                   bigserial primary key,
  domain               text not null unique,
  company              text,
  contact_name         text,
  contact_role         text,
  contact_url          text,
  linkedin_url         text,
  segment              text,
  tier                 smallint,
  stage                text not null default 'new',
  disqualified_reason  text,
  audit_token          text,
  ai_score             integer,
  competitor_count     integer,
  source               text not null default 'outbound',
  owner                text,
  last_contacted_at    timestamptz,
  next_action_at       timestamptz,
  replied_at           timestamptz,
  reply_note           text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospects_stage_check') then
    alter table public.prospects
      add constraint prospects_stage_check
      check (stage in ('new','qualified','audited','contacted','replied','meeting','won','lost','disqualified'));
  end if;
end $$;

-- domain already has a unique index from the UNIQUE constraint above; the two
-- explicitly asked for beyond that are stage (list/filter by pipeline stage)
-- and next_action_at (the follow-up queue, nulls do not clutter the index).
create index if not exists idx_prospects_stage          on public.prospects(stage);
create index if not exists idx_prospects_next_action_at on public.prospects(next_action_at) where next_action_at is not null;

alter table public.prospects enable row level security;

drop policy if exists prospects_select on public.prospects;
create policy prospects_select on public.prospects
  for select to authenticated
  using (public.is_admin());

drop policy if exists prospects_insert on public.prospects;
create policy prospects_insert on public.prospects
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists prospects_update on public.prospects;
create policy prospects_update on public.prospects
  for update to authenticated
  using      (public.is_admin())
  with check (public.is_admin());

drop policy if exists prospects_delete on public.prospects;
create policy prospects_delete on public.prospects
  for delete to authenticated
  using (public.is_admin());

drop trigger if exists trg_prospects_updated_at on public.prospects;
create trigger trg_prospects_updated_at
  before update on public.prospects
  for each row execute function public.prospects_set_updated_at();

-- ============================================================================
-- VERIFICATION (run after applying):
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename = 'prospects' order by cmd;
--   -- Expect: RLS enabled, all four policies scoped to {authenticated}, all
--   -- USING/WITH CHECK calling public.is_admin(), no bare qual=true.
-- ============================================================================
