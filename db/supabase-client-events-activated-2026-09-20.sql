-- supabase-client-events-activated-2026-09-20.sql
-- NOT YET APPLIED. Adds a ninth value, 'activated', to
-- public.client_events.type, for the self-serve first-run activation written by
-- netlify/functions/activate-client-background.js.
--
-- ── WHY ──────────────────────────────────────────────────────────────────────
-- Until 2026-09-20 the self-serve path (provision-account.js, behind /welcome)
-- created a clients row and a user_profiles row and stopped: no prompts, no
-- first collection. The customer landed on an Overview that said "Not measured
-- yet". The admin wizard at /onboard did both, so the customer who paid without
-- a human in the loop got the worse onboarding. activate-client-background.js
-- closes that, and this row is how it is auditable afterwards:
--
--   meta.source      'activate-client-background'
--   meta.seeded      how many prompts were seeded
--   meta.source      'audit'      -> reused the prompts this domain's own free
--                                   public audit already generated, so the
--                                   dashboard measures the same questions the
--                                   public report did
--                    'generated'  -> no prior audit for the domain, a fresh set
--   meta.seed_reason why nothing was seeded, when nothing was
--   meta.run_id      the collection run that was enqueued, or null
--   meta.jobs        how many jobs that run holds
--   meta.collection_reason  why no run was enqueued, when none was
--
-- This is a plan-neutral event: nothing in activation writes a plan, so
-- from_plan and to_plan both name the plan the client is already on, and the
-- null-from_plan convention that marks a CREATION (see the 2026-07-31 file)
-- stays reserved for the rows that really do create a plan.
--
-- ── READ THIS BEFORE ADDING A VALUE ──────────────────────────────────────────
-- Repeated from supabase-client-events-type-check-2026-07-31.sql because it is
-- the whole risk of this constraint: every writer of this table inserts
-- best-effort and swallows the error, so a type missing from the list does NOT
-- raise. It silently drops the audit row. Add a new value here, in the same
-- change that introduces it in code.
--
-- ── DEPLOY ORDER, AND WHY IT IS NOT URGENT ───────────────────────────────────
-- Applying this before the deploy is tidier, but either order is safe and
-- nothing breaks if it is never applied at all: the insert is wrapped in a
-- try/catch that logs and continues, so an unapplied constraint costs the audit
-- row and nothing else. Activation itself (the prompts and the collection, the
-- part the customer sees) does not touch this table.
--
-- Idempotent: drops the constraint by name first, so re-running is safe.

alter table public.client_events
  drop constraint if exists client_events_type_check;

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
    'stripe_provision',
    'activated'
  ));

-- ── DOWN PATH ────────────────────────────────────────────────────────────────
-- Required by docs/AUTONOMY.md section 2. Re-apply the eight-value constraint
-- from supabase-client-events-type-check-2026-07-31.sql. Note this FAILS if any
-- 'activated' row already exists, which is correct: it refuses rather than
-- stranding rows that violate it.
--
--   alter table public.client_events drop constraint if exists client_events_type_check;
--   alter table public.client_events
--     add constraint client_events_type_check
--     check (type in ('plan_change','trial_grant','comp_grant','trial_expired',
--                     'onboarded','signup','stripe_change','stripe_provision'));
--
-- ── VERIFICATION QUERY ───────────────────────────────────────────────────────
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.client_events'::regclass
--      and conname = 'client_events_type_check';
--
-- Expect the definition to list nine values, ending with 'activated'.
