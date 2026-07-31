-- ============================================================================
-- terms_acceptances — the evidence behind the contract gate
-- ROADMAP.md Stream C item C3. Applied 2026-07-31.
--
-- C3 requires that Stripe payment be unreachable until the buyer has accepted
-- the contract, "enforced server-side too, not only by a disabled button, or it
-- is decorative". accept-terms.js is what enforces it: it is the only thing that
-- knows a checkout URL, and it will not issue one unless it can first write a
-- row here. This table is therefore not a log of the gate, it IS the gate; a
-- failed insert fails the checkout closed.
--
-- Each row answers: who accepted, which version of the contract, for which plan,
-- when, and from where.
--
-- `reference` is handed to Stripe as client_reference_id on the payment link, so
-- the acceptance and the money it authorised can be matched afterwards from
-- Stripe's own dashboard without trusting anything the browser reports. It is a
-- UUID rather than the primary key so that a public URL never exposes how many
-- acceptances exist.
--
-- `email` is NULLABLE and is not currently collected. The gate deliberately asks
-- for a tick and nothing else: adding a field at the highest-intent moment in the
-- funnel buys friction, and Stripe collects the real address at checkout anyway.
-- The column exists so that a later change of mind costs no migration.
--
-- No IP is stored. `requester_ip_hash` is the same salted SHA-256 the audit
-- endpoints already use (_prospect_guard.js hashIp), which is enough to spot
-- abuse and cannot be reversed into a person (GDPR minimisation, SALES-ENGINE.md
-- §5).
-- ============================================================================

CREATE TABLE IF NOT EXISTS terms_acceptances (
  id                 bigserial PRIMARY KEY,
  reference          text NOT NULL UNIQUE,   -- passed to Stripe as client_reference_id
  terms_version      text NOT NULL,          -- the effective date shown on terms.html at acceptance time
  plan               text NOT NULL,
  period             text NOT NULL,          -- 'monthly' | 'annual'
  email              text,                   -- not collected today, see header
  requester_ip_hash  text,
  user_agent         text,
  origin             text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_reference ON terms_acceptances(reference);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_created   ON terms_acceptances(created_at DESC);

-- Deny-all by default, same posture as prospect_audits and prospect_leads: no
-- policy is created, so only the service key (server-side Netlify functions)
-- can read or write. Nothing in the browser has any business reading who else
-- accepted a contract.
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- DELIBERATELY NOT COVERED BY THE RETENTION JOB. purge-old-audits.js deletes
-- prospect_audits after 90 days and prospect_leads after 180. An acceptance is
-- the record of a contract someone entered into and must outlive both. If a
-- retention rule is ever wanted here it needs a legal decision, not a default.
