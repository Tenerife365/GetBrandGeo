-- ============================================================================
-- supabase-social-all-networks-migration.sql   (AI Social, 2026-07-20)
--
-- WHY. The original tables capped platform to the five networks the MVP focused
-- on ('instagram','facebook','linkedin','gbp','x'). Ayrshare supports THIRTEEN,
-- and a client is free to link any subset of them: one account, four, or all of
-- them. With the narrow constraint, a client who connected TikTok or YouTube
-- would break the accounts cache insert with a check-constraint violation, and
-- could never be targeted by a post. The product rule is that we impose no limit
-- on which or how many channels a client connects, so the DB must not either.
--
-- Internal ids match Ayrshare's own platform ids one-for-one EXCEPT the two the
-- provider already translates: gbp -> gmb and x -> twitter (kept as-is so no
-- existing row has to be rewritten).
--
-- SAFE TO RE-RUN. Widening a CHECK constraint cannot invalidate existing rows:
-- every currently-allowed value stays allowed.
-- Run in the Supabase SQL editor, project duiyifepitvugyulobqm.
-- ============================================================================

alter table public.social_accounts
  drop constraint if exists social_accounts_platform_check;
alter table public.social_accounts
  add constraint social_accounts_platform_check check (platform in (
    'instagram','facebook','linkedin','gbp','x',
    'bluesky','pinterest','reddit','snapchat','telegram','threads','tiktok','youtube'
  ));

alter table public.social_post_targets
  drop constraint if exists social_post_targets_platform_check;
alter table public.social_post_targets
  add constraint social_post_targets_platform_check check (platform in (
    'instagram','facebook','linkedin','gbp','x',
    'bluesky','pinterest','reddit','snapchat','telegram','threads','tiktok','youtube'
  ));

-- A client may legitimately connect SEVERAL accounts on one network (two Facebook
-- Pages, several Google Business locations). The unique index is on
-- (client_id, platform, external_id), which already permits that -- but Google
-- Business returns no account id, so external_id is NULL and NULL <> NULL means
-- the index never dedupes those rows. social-accounts.js therefore REPLACES a
-- client's cached rows on every refresh rather than upserting; this comment
-- records why that constraint is deliberately left alone.

-- ── Verification ────────────────────────────────────────────────────────────
--   select conrelid::regclass as tbl, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid in ('public.social_accounts'::regclass,
--                      'public.social_post_targets'::regclass)
--     and contype = 'c' and pg_get_constraintdef(oid) ilike '%platform%';
--   -- Expect both to list all 13 networks.
