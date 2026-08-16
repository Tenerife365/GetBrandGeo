-- ============================================================================
-- supabase-prospect-contact-candidates-2026-08-16.sql
-- Adds public.prospect_contact_candidates, the staging table for the contact
-- route resolver (netlify/functions/resolve-contact-routes.js). Packet 019.
--
-- WHY THIS EXISTS
--   Measured 2026-08-16: all 43 prospects at stage='new' have ZERO contact
--   routes. 0 contact_email, 0 linkedin_url, 0 x_url. Meanwhile 43 of 43
--   carry an audit_token, 43 of 43 an ai_score, and 40 of 43 have named
--   competitors. The expensive half of the work is paid for and the cheap
--   half is missing, so there is nobody to contact tomorrow. The nine
--   prospects contacted on 2026-08-16 were the only rows in the table with a
--   route, and that research was done by hand, one company at a time, over
--   most of a session.
--
-- WHY A SEPARATE TABLE RATHER THAN WRITING prospects DIRECTLY
--   A resolver can find a string on a page. It cannot decide that the string
--   belongs to the person you mean. On 2026-08-15 three X accounts that
--   looked correct were impostors (x.com/intellibill is a Florida medical
--   biller, x.com/vibefam is a 2017 account called Vibe Clan,
--   x.com/Harry_Sabharwal is a Dublin consultant), and separately a confident
--   "this LinkedIn is the wrong John Powell" finding was itself later
--   overturned. So the resolver stages CANDIDATES here, with the exact URL
--   each literal string was seen at, and a human promotes one onto
--   prospects.contact_email / linkedin_url / x_url. resolve-contact-routes.js
--   never writes public.prospects at all.
--
--   Corollary: nothing in this file or that function may ever set
--   prospects.x_verified or prospects.linkedin_verified to true.
--
-- PROVENANCE IS THE POINT
--   source_url is NOT NULL by design. The standard set by
--   docs/growth/outbound/founder-batch-01-2026-08-15.md section A is that no
--   address was ever inferred from a pattern and every one carries the URL
--   where the literal string was seen. A candidate with no source is a guess
--   wearing a database column, which is worse than an empty field because it
--   later reads as fact. The column being NOT NULL makes that unrepresentable.
--
--   confidence describes HOW WELL SOURCED the string is, never whether a
--   profile belongs to a person. Those are different questions and only the
--   first one is mechanisable.
--
-- RLS: ADMIN ONLY, no exceptions, the same public.is_admin() pattern used by
-- public.prospects and public.prospect_touches. This table holds contact
-- details for named people at real companies; containment matters as much as
-- it does for prospects itself. resolve-contact-routes.js additionally holds
-- the service key behind requireAuth({ adminOnly: true }), so these policies
-- are defence in depth for direct PostgREST access with a user JWT.
--
-- ON DELETE RESTRICT, not CASCADE, for the same reason bg-verify finding S3
-- changed it on prospect_touches (docs/qa/prospect-channels-review-2026-08-15.md):
-- deleting a prospect must not silently destroy the research attached to it.
--
-- Run once in the Supabase SQL Editor for brandgeo-dashboard
-- (duiyifepitvugyulobqm). Safe to re-run throughout.
-- ============================================================================

create table if not exists public.prospect_contact_candidates (
  id          bigserial primary key,
  prospect_id bigint not null references public.prospects(id) on delete restrict,
  kind        text not null,
  value       text not null,
  source_url  text not null,
  email_kind  text,
  confidence  text not null,
  promoted    boolean not null default false,
  created_at  timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospect_contact_candidates_kind_check') then
    alter table public.prospect_contact_candidates
      add constraint prospect_contact_candidates_kind_check
      check (kind in ('email','linkedin','x'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospect_contact_candidates_email_kind_check') then
    alter table public.prospect_contact_candidates
      add constraint prospect_contact_candidates_email_kind_check
      check (email_kind in ('individual','role') or email_kind is null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prospect_contact_candidates_confidence_check') then
    alter table public.prospect_contact_candidates
      add constraint prospect_contact_candidates_confidence_check
      check (confidence in ('high','medium','low'));
  end if;
end $$;

-- Re-running the resolver over the same prospect must not multiply rows.
create unique index if not exists uq_prospect_contact_candidates_prospect_kind_value
  on public.prospect_contact_candidates(prospect_id, kind, value);

create index if not exists idx_prospect_contact_candidates_prospect_id
  on public.prospect_contact_candidates(prospect_id);

alter table public.prospect_contact_candidates enable row level security;

drop policy if exists prospect_contact_candidates_select on public.prospect_contact_candidates;
create policy prospect_contact_candidates_select on public.prospect_contact_candidates
  for select to authenticated
  using (public.is_admin());

drop policy if exists prospect_contact_candidates_insert on public.prospect_contact_candidates;
create policy prospect_contact_candidates_insert on public.prospect_contact_candidates
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists prospect_contact_candidates_update on public.prospect_contact_candidates;
create policy prospect_contact_candidates_update on public.prospect_contact_candidates
  for update to authenticated
  using      (public.is_admin())
  with check (public.is_admin());

drop policy if exists prospect_contact_candidates_delete on public.prospect_contact_candidates;
create policy prospect_contact_candidates_delete on public.prospect_contact_candidates
  for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- VERIFICATION (run after applying, do not assume from this file):
--   select column_name, data_type, is_nullable from information_schema.columns
--   where table_schema='public' and table_name='prospect_contact_candidates'
--   order by ordinal_position;
--   -- Expect 9 columns; source_url NOT NULL.
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.prospect_contact_candidates'::regclass;
--   -- Expect 3 CHECKs and an FK reading "... ON DELETE RESTRICT".
--
--   select policyname, cmd, roles from pg_policies
--   where tablename = 'prospect_contact_candidates' order by cmd;
--   -- Expect exactly 4, all {authenticated}, all calling public.is_admin().
--
--   select count(*) from public.prospects;          -- expect 71, unchanged
--   select count(*) from public.prospect_touches;   -- expect 9, unchanged
-- ============================================================================
