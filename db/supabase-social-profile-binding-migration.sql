-- ============================================================================
-- supabase-social-profile-binding-migration.sql   (AI Social, 2026-07-20)
--
-- WHAT / WHY
--   Ayrshare runs one User Profile per client, each addressed by its own
--   Profile-Key header. Until now nothing ever WROTE social_profiles.profile_key,
--   so every client resolved to null -> the header was omitted -> Ayrshare fell
--   back to the account's PRIMARY profile. On a multi-profile account that means
--   a post composed for client A would publish to whichever brand owns the
--   primary profile, silently and with a success response.
--
--   This migration supports the binding UI (social-profile.js):
--     1. adds profile_title  -- human label of the bound Ayrshare profile, shown
--        in the dashboard so an admin can confirm the right workspace at a glance
--        (Ayrshare's GET /profiles gives title + refId but NEVER the key).
--     2. revokes column-level SELECT on profile_key from the browser roles.
--
-- ON (2): profile_key is a CREDENTIAL. The table's RLS lets a client read its
--   own social_profiles row, which would have exposed that row's key to the
--   browser via the anon client. Nothing in the frontend needs it -- only the
--   Netlify functions do, and they use the service key, which bypasses both RLS
--   and these column grants. Postgres supports column-level privileges, so the
--   fix is precise: the row stays readable, that one column does not.
--
-- SAFE TO RE-RUN (add column if not exists / revoke is idempotent).
-- Run in the Supabase SQL editor, project duiyifepitvugyulobqm.
-- Prerequisite: supabase-social-migration.sql (already applied 2026-07-20).
-- ============================================================================

alter table public.social_profiles
  add column if not exists profile_title text;

comment on column public.social_profiles.profile_title is
  'Human label of the bound provider workspace (Ayrshare profile title). Display only.';

comment on column public.social_profiles.profile_key is
  'CREDENTIAL. Ayrshare Profile-Key for this client. Service-key access only: column-level SELECT is revoked from anon/authenticated. Ayrshare discloses a key only at profile creation, so losing this value strands the profile.';

-- Lock the credential column away from the browser roles. Explicitly re-grant
-- the other columns, because a bare REVOKE on one column leaves any pre-existing
-- table-wide SELECT grant in force -- the revoke alone would not actually bite.
revoke select on public.social_profiles from anon, authenticated;

grant select (client_id, provider, ref_id, profile_title, brand_voice, created_at, updated_at)
  on public.social_profiles to anon, authenticated;

-- ── Verification ────────────────────────────────────────────────────────────
-- 1. profile_title exists:
--      select column_name from information_schema.columns
--      where table_name = 'social_profiles' order by ordinal_position;
--
-- 2. profile_key is NOT selectable by the browser roles (expect NO row for
--    profile_key, and one row per other column):
--      select grantee, column_name, privilege_type
--      from information_schema.column_privileges
--      where table_name = 'social_profiles'
--        and grantee in ('anon','authenticated')
--        and privilege_type = 'SELECT'
--      order by grantee, column_name;
--
-- 3. Prove it end to end (should ERROR with "permission denied for column
--    profile_key"), run as an authenticated user, not the service key:
--      select profile_key from public.social_profiles limit 1;
