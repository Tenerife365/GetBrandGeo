-- supabase-sitemap-pings-migration.sql
-- State store for ping-sitemap.js (the scheduled auto-notify job).
--
-- ping-sitemap.js fetches the live getbrandgeo.com sitemap daily, and pings any
-- new or changed URL to Google + IndexNow. This table is how it remembers what
-- it has already pinged, so a page is notified once per real update (its
-- <lastmod> changing), not every single day.
--
-- One row per URL. `lastmod` is the sitemap's <lastmod> value at the time we
-- last pinged it; the job re-pings only when the sitemap's lastmod differs.
--
-- RLS: enabled with ZERO policies = deny-all. Only the service_role key (the
-- Netlify function) can read/write it. Same locked-down posture as
-- assistant_events / signup_attempts / prospect_audits.
--
-- Safe to re-run (IF NOT EXISTS throughout).

CREATE TABLE IF NOT EXISTS public.sitemap_pings (
  url            text        PRIMARY KEY,
  lastmod        text        NOT NULL DEFAULT '',
  last_pinged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sitemap_pings ENABLE ROW LEVEL SECURITY;
-- (No policies on purpose: deny-all to anon/authenticated; service_role bypasses RLS.)

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Expect: rls_enabled = true, policy_count = 0
--
-- select c.relname,
--        c.relrowsecurity as rls_enabled,
--        (select count(*) from pg_policies p
--          where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname = 'sitemap_pings';
