-- supabase-assistant-events-migration.sql
-- ASSISTANT-SPEC.md — backing store for the PUBLIC site chat assistant
-- (assistant.js + assistant-lead.js).
--
-- Two jobs, one small table:
--   1) Rate limiting. assistant.js is unauthenticated and proxies Claude Haiku;
--      without a server-side cap it could be scripted as a free Claude proxy.
--      One row is written per visitor chat turn (kind='message'); the endpoint
--      counts rows for an ip_hash in the last 24h against DAILY_MSG_CAP (40).
--      assistant-lead.js caps captured leads per IP the same way (kind='lead').
--   2) Local lead backup. assistant-lead.js pushes each lead to HubSpot but
--      ALSO writes it here (kind='lead', full lead in `meta`) so a lead is never
--      lost if HubSpot is unconfigured or its API fails — the durable system of
--      record, mirroring _hubspot.js's degrade-to-local behaviour.
--
-- Privacy: we store ONLY sha256(ip + IP_HASH_PEPPER), never a raw IP — the same
-- GDPR-minimisation treatment used by prospect_audits / signup_attempts
-- (_prospect_guard.js hashIp). The hash is not reversible and is used solely for
-- rate limiting. `meta` holds the visitor-provided lead fields (name/email/need)
-- — no IP, no chat transcript.
--
-- RLS: enabled with ZERO policies = deny-all. Only the service_role key (used by
-- the Netlify functions) can read/write it. Same locked-down-by-default posture
-- as signup_attempts / prospect_audits / the archive.* tables.
--
-- Safe to re-run (IF NOT EXISTS throughout).

CREATE TABLE IF NOT EXISTS public.assistant_events (
  id          bigserial   PRIMARY KEY,
  ip_hash     text        NOT NULL,
  kind        text        NOT NULL,            -- 'message' | 'lead'
  meta        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- The only query this table serves for rate limiting: count rows for one
-- ip_hash of a given kind in the last 24h. Composite index matches that.
CREATE INDEX IF NOT EXISTS idx_assistant_events_ip_kind_created
  ON public.assistant_events (ip_hash, kind, created_at DESC);

-- Serves the lead-backlog read ("show me recent leads") without a full scan.
CREATE INDEX IF NOT EXISTS idx_assistant_events_kind_created
  ON public.assistant_events (kind, created_at DESC);

ALTER TABLE public.assistant_events ENABLE ROW LEVEL SECURITY;
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
-- where n.nspname = 'public' and c.relname = 'assistant_events';
