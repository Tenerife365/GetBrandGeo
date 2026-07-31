-- supabase-client-billing-dates-migration.sql
-- Manual billing dates for the My Profile page.
--
-- Managed/Pro clients are frequently invoiced OUTSIDE Stripe self-serve (e.g.
-- Bucate pe Roate has no stripe_subscription_id), so get-subscription.js returns
-- nothing for them and the profile could not show when their engagement started
-- or how long they are paid for. These two nullable date columns hold that,
-- set by an admin via set-client-billing.js (service-role write, since the
-- clients table is RLS SELECT-only for the frontend).
--
--   subscription_started_at : when the paid engagement began. The UI falls back
--                             to clients.created_at when this is null.
--   paid_until              : the current paid-through date ("Paid until"). When
--                             null and a Stripe sub exists, the UI shows Stripe's
--                             current_period_end instead.
--
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscription_started_at date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS paid_until date;
