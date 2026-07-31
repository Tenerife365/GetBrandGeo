-- supabase-prospect-audits-migration.sql
-- Adds anonymous "Instant Audit Engine" tables (SALES-ENGINE.md §2, CLAUDE.md §10
-- Component A, Master-DashboardDesign, 2026-07-09).
--
-- IMPORTANT — why these are separate tables, not rows in `clients`/`prompts`:
-- Prospect audits are NOT paying clients. Reusing `clients`/`prompts`/`ai_results`
-- (all designed around a real Supabase-authenticated user + a `user_profiles` row,
-- per CLAUDE.md §1.6/§4.1) would either require fabricating fake auth users for
-- every anonymous domain someone audits, or would pollute the real client list
-- Constantin sees in the dashboard client switcher. Keeping prospect data in its
-- own tables, touched only by the service key (never RLS-exposed to anon/authed
-- browser sessions), preserves the existing multi-tenant model untouched.
--
-- Run this once in the Supabase SQL Editor for the `brandgeo-dashboard` project
-- (duiyifepitvugyulobqm, per CLAUDE.md §6.4 step 7 / §11.1) — per the project's
-- execution-delegation rule, Constantin runs this himself.

CREATE TABLE IF NOT EXISTS prospect_audits (
  id                  bigserial PRIMARY KEY,
  token               text UNIQUE NOT NULL,               -- public share token (32-char random)
  domain              text NOT NULL,                       -- normalized: no protocol/www/path
  category            text,                                 -- LLM-detected category (filled after prompt-gen)
  depth               text NOT NULL DEFAULT 'screening',    -- 'screening' | 'full'
  status              text NOT NULL DEFAULT 'pending',      -- 'pending' | 'generating_prompts' | 'collecting' | 'ready' | 'error'
  error_message       text,
  created_via         text NOT NULL DEFAULT 'public',       -- 'public' | 'internal' (Radar/site-widget bypass path)
  low_confidence      boolean NOT NULL DEFAULT false,        -- true if homepage fetch failed and category/prompts are a domain-name-only guess
  unlocked            boolean NOT NULL DEFAULT false,        -- true once email captured, or created_via='internal'
  email               text,
  email_captured_at   timestamptz,
  generated_prompts   jsonb,                                 -- [{ id, text }]
  engines_used        text[],                                -- e.g. {gemini,perplexity}
  ai_score            integer,
  dimensions          jsonb,                                 -- { recognition, knowledge, sentiment, accuracy, reach, consistency } — same shape as aiVisibilityScore.ts
  engine_states       jsonb,                                 -- { chatgpt: 'know'|'partial'|'missing', ... }
  engine_results      jsonb,                                 -- [{ prompt_id, engine, brand_mentioned, brand_position, sentiment, competitors_mentioned, snippet }]
  top_gaps            jsonb,                                 -- up to 3: [{ engine, prompt, issue, competitor_named }]
  competitor_flags    jsonb,                                 -- [{ engine, prompt, competitor_name }] -- "named instead of you"
  estimated_cost_eur  numeric(10,4) NOT NULL DEFAULT 0,
  requester_ip_hash   text,                                   -- sha256(ip + IP_HASH_PEPPER) — rate-limiting only, not real IP
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_audits_token       ON prospect_audits(token);
CREATE INDEX IF NOT EXISTS idx_prospect_audits_ip_created         ON prospect_audits(requester_ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_prospect_audits_created            ON prospect_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_prospect_audits_domain             ON prospect_audits(domain);

ALTER TABLE prospect_audits ENABLE ROW LEVEL SECURITY;
-- No policies added on purpose — RLS enabled + zero policies = deny-all to the
-- anon/authenticated Supabase clients; only the service-role key (used inside
-- Netlify functions, never shipped to the browser) can read/write this table.
-- Same pattern as every other service-key-only table in this schema.

CREATE TABLE IF NOT EXISTS prospect_leads (
  id                  bigserial PRIMARY KEY,
  audit_id            bigint REFERENCES prospect_audits(id) ON DELETE SET NULL,
  domain              text NOT NULL,
  email               text NOT NULL,
  source              text NOT NULL DEFAULT 'instant_audit',  -- room for future lead sources (Radar, widget, etc.)
  hubspot_synced      boolean NOT NULL DEFAULT false,
  hubspot_contact_id  text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_leads_email   ON prospect_leads(email);
CREATE INDEX IF NOT EXISTS idx_prospect_leads_synced  ON prospect_leads(hubspot_synced);

ALTER TABLE prospect_leads ENABLE ROW LEVEL SECURITY;
-- Same deny-all-by-default posture as prospect_audits above.

-- GDPR minimal-retention support (SALES-ENGINE.md §5 "store only what you need"):
-- purge-old-audits.js (scheduled function, see netlify.toml) deletes prospect_audits
-- older than 90 days and prospect_leads older than 180 days. This migration just
-- creates the tables; the retention job is separate application code, not a DB trigger,
-- so the retention window can be changed without a migration.
