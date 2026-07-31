-- supabase-stripe-webhook-migration.sql
-- Adds Stripe billing columns + an idempotency table so the new
-- stripe-webhook.js function can auto-provision self-serve subscribers
-- (STRIPE-WEBHOOK-SPEC.md §4, CLAUDE.md §10, Master-DashboardDesign, 2026-07-09).
--
-- Why these columns live on `clients`, not a new table:
-- the webhook needs to map a Stripe customer/subscription back to an existing
-- client on later events (upgrade/downgrade/cancel) WITHOUT re-looking-up by
-- email each time. Storing the Stripe ids on the client row is the natural key
-- for `customer.subscription.updated` / `.deleted`, which only carry the
-- customer id (`cus_...`), not an email.
--
-- Run this once in the Supabase SQL Editor for the `brandgeo-dashboard` project
-- (duiyifepitvugyulobqm, per CLAUDE.md §6.4 step 7 / §11.1) — per the project's
-- execution-delegation rule, Constantin runs this himself, BEFORE deploying the
-- function (an event arriving before the columns exist would error).

-- 1. Stripe id columns on clients (nullable — existing/manually-onboarded
--    clients simply have no Stripe subscription and keep NULLs here).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Fast lookup for customer.subscription.updated/deleted, which resolve a client
-- by stripe_customer_id.
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer
  ON clients(stripe_customer_id);

-- 2. Idempotency table — Stripe retries any non-2xx and can deliver duplicates.
--    stripe-webhook.js inserts event.id first; a unique-violation (23505) means
--    "already handled" → return 200 without re-processing. On a processing
--    failure the function deletes the row again so a Stripe retry re-runs it.
CREATE TABLE IF NOT EXISTS stripe_events (
  id          text PRIMARY KEY,          -- Stripe event.id (evt_...)
  type        text,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies added on purpose — RLS enabled + zero policies = deny-all to the
-- anon/authenticated Supabase clients; only the service-role key (used inside
-- Netlify functions, never shipped to the browser) can read/write this table.
-- Same posture as prospect_audits / prospect_leads and the other
-- service-key-only tables in this schema.
