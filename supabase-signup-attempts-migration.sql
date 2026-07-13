-- supabase-signup-attempts-migration.sql
-- SECURITY-AUDIT.md F2 — per-IP throttle for the PUBLIC signup endpoint.
--
-- signup-client.js is unauthenticated and creates Supabase Auth users + sends
-- email. Without a throttle it can be scripted to burn Auth quota and to
-- email-bomb an arbitrary address. This table backs the per-IP daily cap
-- (SIGNUPS_PER_IP_PER_DAY = 3 in signup-client.js).
--
-- Privacy: we store ONLY sha256(ip + IP_HASH_PEPPER), never a raw IP —
-- the same GDPR-minimisation treatment already used by prospect_audits
-- (_prospect_guard.js hashIp). The hash is not reversible to an IP and is
-- used solely for rate limiting.
--
-- RLS: enabled with ZERO policies = deny-all. Only the service_role key
-- (used by the Netlify functions) can read/write it. Same locked-down-by-
-- default posture as prospect_audits / the archive.* tables.
--
-- Safe to re-run (IF NOT EXISTS throughout).

CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id          bigserial PRIMARY KEY,
  ip_hash     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- The only query this table serves: count attempts for one ip_hash in the
-- last 24h. Composite index matches that access pattern exactly.
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_created
  ON public.signup_attempts (ip_hash, created_at DESC);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;
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
-- where n.nspname = 'public' and c.relname = 'signup_attempts';
