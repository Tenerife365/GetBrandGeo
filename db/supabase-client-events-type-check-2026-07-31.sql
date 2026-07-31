-- supabase-client-events-type-check-2026-07-31.sql
-- APPLIED 2026-07-31 to project duiyifepitvugyulobqm, on Constantin's approval.
-- Constrains public.client_events.type to the eight values the code can write.
--
-- ── READ THIS BEFORE ADDING A VALUE ──────────────────────────────────────────
-- Every writer of this table inserts BEST-EFFORT and swallows the error. That is
-- deliberate and correct: an audit row must never break a payment, because a
-- throw in stripe-webhook.js reaches the handler's catch, which deletes the
-- stripe_events idempotency row and returns 500, so Stripe redelivers and
-- re-runs provisioning.
--
-- The consequence is the whole risk of this constraint. A type missing from the
-- list below does NOT raise. It silently drops the audit row. So the failure
-- mode of getting this wrong is losing exactly the audit trail that this table
-- was hardened to provide, and losing it invisibly.
--
-- **Add a new value HERE, in the same change that introduces it in code.**
--
-- ── THE VALUES, AND HOW THEY WERE ESTABLISHED ────────────────────────────────
-- Not grepped. A grep for "type:" across netlify/functions/ returns twenty
-- values, most of which belong to admin_notifications, a different table with
-- its own type column. Each value below was traced to its actual insert site:
--
--   plan_change       set-client-plan.js:165   admin sets a plan outright
--   trial_grant       set-client-plan.js:165   grant_type = 'trial'
--   comp_grant        set-client-plan.js:165   grant_type = 'comp'
--   trial_expired     expire-plan-grants.js:199  grant lapsed, reverted to free
--   onboarded         onboard-client.js:211    admin wizard created the client
--   signup            provision-account.js:226  self-serve account created
--   stripe_change     stripe-webhook.js:499/764/864  a paid plan changed
--   stripe_provision  stripe-webhook.js:946    client row created by a payment
--
-- Two near-misses, both of which belong to admin_notifications and must NOT be
-- added here: `plan_expiry_held` (expire-plan-grants.js:144, via
-- recordAdminEvent) and `account_deleted` (delete-client.js:111, same).
--
-- ── VERIFICATION PERFORMED AT APPLY TIME ─────────────────────────────────────
-- 1. All eight inserted inside a DO block that then raised, so the transaction
--    rolled back:  "PROOF_OK: all 8 legitimate types accepted, rolling back"
-- 2. An unknown value was rejected by this constraint, caught as
--    check_violation: "PROOF_OK: unknown type rejected"
-- 3. Row count unchanged at 2 afterwards, so the proof left nothing behind.
-- 4. Existing rows (comp_grant, plan_change) both satisfy it, so ADD CONSTRAINT
--    validated without NOT VALID.

alter table public.client_events
  add constraint client_events_type_check
  check (type in (
    'plan_change',
    'trial_grant',
    'comp_grant',
    'trial_expired',
    'onboarded',
    'signup',
    'stripe_change',
    'stripe_provision'
  ));

-- ── DOWN PATH ────────────────────────────────────────────────────────────────
-- Required by docs/AUTONOMY.md section 2. Dropping the constraint is always
-- safe: it removes a restriction and strands no data.
--
--   alter table public.client_events drop constraint if exists client_events_type_check;
--
-- ── VERIFICATION QUERY ───────────────────────────────────────────────────────
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.client_events'::regclass
--      and conname = 'client_events_type_check';
--
-- ── STILL OPEN, AND THIS CONSTRAINT DOES NOT CLOSE IT ────────────────────────
-- A plan changed directly in the Supabase table editor or by raw SQL writes no
-- client_events row at all, because no application code runs. That is how
-- client 1 was restored by hand on 2026-07-31 and it is why that incident is
-- unrecoverable from the database. Closing it needs a trigger on public.clients,
-- which is a separate change.
