-- ============================================================================
-- supabase-affiliate-migration-2026-09-12.sql
-- Owned, multi-program affiliate system (docs/affiliates/README.md).
--
-- STATUS: see the "APPLIED" line at the bottom of this header, kept current by
-- whoever runs it. Idempotent: every statement is guarded, safe to re-run.
--
-- WHAT THIS IS
--   Twelve tables under the affiliate_ prefix, two service-only RPCs and one
--   helper. It replaces the PromoteKit plan from 2026-08-02 with an owned
--   module: no per-month affiliate software, payouts done by hand from a CSV.
--
-- MONEY
--   Every amount is an integer in minor units (cents). Every rate is an integer
--   in basis points (2000 = 20.00%). No numeric or float column carries money,
--   so nothing here can round twice or drift. The currency is stored beside
--   every amount and is never converted.
--
-- NEVER HARD-DELETED
--   conversions, commissions, payout batches, payout items, attributions and
--   the audit log have no DELETE policy and the admin endpoint exposes no
--   delete action for them. Programs archive, affiliates suspend, commissions
--   reverse. Raw click rows (affiliate_visits) are the one exception: they are
--   tracking data with a 90-day retention (db/supabase-affiliate-cron-2026-09-12.sql)
--   and their counts survive on the membership row.
--
-- RLS
--   Every table has RLS on. Admin (public.is_admin()) reads and writes through
--   PostgREST as defence in depth; the Netlify functions hold the service key
--   behind their own auth gates and are the primary path. An affiliate can
--   SELECT only rows tied to their own affiliates.user_id. anon has nothing:
--   the public program list is served by a function, not by a policy.
--
-- DEPENDS ON public.is_admin() (supabase-multitenant-migration.sql), pgcrypto
-- (gen_random_uuid, digest) and pg_cron for the optional retention job.
--
-- APPLIED: 2026-09-12 to duiyifepitvugyulobqm (see CLAUDE.md CURRENT STATE).
-- ============================================================================

-- ── 1. Programs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                      text NOT NULL UNIQUE,
  name                      text NOT NULL,
  tagline                   text,
  description               text,
  logo_url                  text,
  brand_color               text,
  destination_url           text NOT NULL,
  status                    text NOT NULL DEFAULT 'draft',
  is_public                 boolean NOT NULL DEFAULT true,
  currency                  text NOT NULL DEFAULT 'EUR',
  -- Commission rules. A program may pay for leads AND sales; each part is
  -- independent and zero means "not paid".
  lead_commission_cents     bigint NOT NULL DEFAULT 0,
  sale_commission_type      text NOT NULL DEFAULT 'percent',     -- none | fixed | percent
  sale_commission_cents     bigint NOT NULL DEFAULT 0,
  sale_commission_bps       integer NOT NULL DEFAULT 0,
  recurring_commission_bps  integer NOT NULL DEFAULT 0,           -- 0 = one-time only
  recurring_months          integer,                              -- NULL = for the life of the subscription
  attribution_days          integer NOT NULL DEFAULT 30,
  attribution_mode          text NOT NULL DEFAULT 'last_touch',   -- last_touch | first_touch
  approval_days             integer NOT NULL DEFAULT 30,
  min_payout_cents          bigint NOT NULL DEFAULT 5000,
  payout_schedule           text NOT NULL DEFAULT 'Monthly, within 15 days after month end',
  terms_md                  text,
  terms_url                 text,
  terms_version             text,
  api_key_hash              text,
  api_key_prefix            text,
  api_key_created_at        timestamptz,
  created_by                uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  archived_at               timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_slug_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_slug_check
      CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_status_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_status_check
      CHECK (status IN ('draft', 'active', 'paused', 'archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_sale_type_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_sale_type_check
      CHECK (sale_commission_type IN ('none', 'fixed', 'percent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_mode_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_mode_check
      CHECK (attribution_mode IN ('last_touch', 'first_touch'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_bps_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_bps_check
      CHECK (sale_commission_bps BETWEEN 0 AND 10000 AND recurring_commission_bps BETWEEN 0 AND 10000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_amounts_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_amounts_check
      CHECK (lead_commission_cents >= 0 AND sale_commission_cents >= 0 AND min_payout_cents >= 0
             AND attribution_days BETWEEN 0 AND 3650 AND approval_days BETWEEN 0 AND 365
             AND (recurring_months IS NULL OR recurring_months >= 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_programs_currency_check') THEN
    ALTER TABLE public.affiliate_programs ADD CONSTRAINT affiliate_programs_currency_check
      CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
END $$;

-- ── 2. Affiliates (one account, many programs) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email                 text NOT NULL,
  full_name             text NOT NULL,
  company               text,
  website               text,
  social_url            text,
  country               text,
  promo_method          text,
  status                text NOT NULL DEFAULT 'invited',   -- invited | pending | active | suspended | rejected
  payout_method         text,                               -- wise | revolut | paypal | bank | other
  payout_details        jsonb NOT NULL DEFAULT '{}'::jsonb, -- receive identifiers only (see README: never passwords, cards or API keys)
  terms_accepted_at     timestamptz,
  terms_version         text,
  privacy_accepted_at   timestamptz,
  invite_token_hash     text,
  invite_expires_at     timestamptz,
  invited_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at            timestamptz,
  suspended_at          timestamptz,
  suspended_reason      text,
  notes                 text,
  email_hash            text,                               -- sha256(lower(email)) for self-referral matching
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliates_email_lower_key ON public.affiliates (lower(email));
CREATE INDEX IF NOT EXISTS affiliates_status_idx ON public.affiliates (status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_status_check') THEN
    ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_status_check
      CHECK (status IN ('invited', 'pending', 'active', 'suspended', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_payout_method_check') THEN
    ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_payout_method_check
      CHECK (payout_method IS NULL OR payout_method IN ('wise', 'revolut', 'paypal', 'bank', 'other'));
  END IF;
END $$;

-- ── 2b. Helper: the affiliate row of the signed-in user ──────────────────────
-- Defined AFTER public.affiliates: Postgres validates a LANGUAGE sql body at
-- creation time (check_function_bodies), so it must see the table.
-- STABLE + SECURITY DEFINER so RLS policies can call it without granting the
-- caller any read on affiliates beyond their own id. It returns only the id of
-- the row whose user_id is auth.uid(), so a default EXECUTE grant is harmless.
CREATE OR REPLACE FUNCTION public.affiliate_my_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.affiliates WHERE user_id = auth.uid() LIMIT 1
$$;

-- ── 3. Memberships (affiliate x program, with its own approval) ──────────────
CREATE TABLE IF NOT EXISTS public.affiliate_memberships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id      uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  program_id        uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  status            text NOT NULL DEFAULT 'invited',   -- invited | pending | active | suspended | rejected
  custom_rules      jsonb,                              -- keys override the program's commission columns
  applied_at        timestamptz,
  approved_at       timestamptz,
  approved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_reason   text,
  clicks_total      bigint NOT NULL DEFAULT 0,
  clicks_last_at    timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, program_id)
);

CREATE INDEX IF NOT EXISTS affiliate_memberships_program_idx ON public.affiliate_memberships (program_id, status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_memberships_status_check') THEN
    ALTER TABLE public.affiliate_memberships ADD CONSTRAINT affiliate_memberships_status_check
      CHECK (status IN ('invited', 'pending', 'active', 'suspended', 'rejected'));
  END IF;
END $$;

-- ── 4. Applications (public form, reviewed by an admin) ──────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id                bigserial PRIMARY KEY,
  program_id        uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  affiliate_id      uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  membership_id     uuid REFERENCES public.affiliate_memberships(id) ON DELETE SET NULL,
  full_name         text NOT NULL,
  email             text NOT NULL,
  company           text,
  website           text,
  social_url        text,
  country           text,
  promo_method      text,
  payout_method     text,
  terms_accepted    boolean NOT NULL DEFAULT false,
  privacy_accepted  boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  review_note       text,
  ip_hash           text,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_applications_status_idx ON public.affiliate_applications (status, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_applications_status_check') THEN
    ALTER TABLE public.affiliate_applications ADD CONSTRAINT affiliate_applications_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- ── 5. Codes (link codes and coupon codes, unique per program) ───────────────
CREATE TABLE IF NOT EXISTS public.affiliate_codes (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  membership_id             uuid NOT NULL REFERENCES public.affiliate_memberships(id) ON DELETE RESTRICT,
  affiliate_id              uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  code                      text NOT NULL,
  kind                      text NOT NULL DEFAULT 'link',   -- link | coupon
  is_primary                boolean NOT NULL DEFAULT false,
  is_active                 boolean NOT NULL DEFAULT true,
  stripe_promotion_code_id  text,
  stripe_coupon_id          text,
  note                      text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_codes_program_code_key ON public.affiliate_codes (program_id, upper(code));
CREATE INDEX IF NOT EXISTS affiliate_codes_membership_idx ON public.affiliate_codes (membership_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_codes_kind_check') THEN
    ALTER TABLE public.affiliate_codes ADD CONSTRAINT affiliate_codes_kind_check CHECK (kind IN ('link', 'coupon'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_codes_format_check') THEN
    ALTER TABLE public.affiliate_codes ADD CONSTRAINT affiliate_codes_format_check CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$');
  END IF;
END $$;

-- ── 6. Visits (raw clicks, 90-day retention) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_visits (
  id              bigserial PRIMARY KEY,
  program_id      uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  membership_id   uuid NOT NULL REFERENCES public.affiliate_memberships(id) ON DELETE CASCADE,
  code_id         uuid REFERENCES public.affiliate_codes(id) ON DELETE SET NULL,
  visit_token     text NOT NULL UNIQUE,
  landing_path    text,
  referrer_host   text,
  utm             jsonb,
  ua_family       text,
  ip_hash         text,
  country         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_visits_membership_created_idx ON public.affiliate_visits (membership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_visits_ip_created_idx ON public.affiliate_visits (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_visits_created_idx ON public.affiliate_visits (created_at);

-- ── 7. Attributions (which affiliate owns a customer identity, per program) ──
CREATE TABLE IF NOT EXISTS public.affiliate_attributions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  membership_id           uuid NOT NULL REFERENCES public.affiliate_memberships(id) ON DELETE RESTRICT,
  external_customer_id    text NOT NULL,     -- client:<id> | stripe_customer:<cus_> | email:<sha256> | api-supplied
  customer_ref            text,              -- anonymised display label, never a full email
  source                  text NOT NULL,     -- link | coupon | form | api | stripe | manual
  visit_id                bigint REFERENCES public.affiliate_visits(id) ON DELETE SET NULL,
  visit_token             text,
  code_id                 uuid REFERENCES public.affiliate_codes(id) ON DELETE SET NULL,
  first_touch_at          timestamptz NOT NULL DEFAULT now(),
  last_touch_at           timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz,       -- attribution window end for a click-based touch
  converted_at            timestamptz,       -- first sale; the membership is locked from here
  first_sale_at           timestamptz,
  recurring_until         timestamptz,       -- NULL = unlimited (or no recurring rule)
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_ended_at   timestamptz,
  is_self_referral        boolean NOT NULL DEFAULT false,
  flags                   jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  manual_reason           text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, external_customer_id)
);

CREATE INDEX IF NOT EXISTS affiliate_attributions_membership_idx ON public.affiliate_attributions (membership_id);
CREATE INDEX IF NOT EXISTS affiliate_attributions_stripe_sub_idx ON public.affiliate_attributions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS affiliate_attributions_stripe_cus_idx ON public.affiliate_attributions (stripe_customer_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_attributions_source_check') THEN
    ALTER TABLE public.affiliate_attributions ADD CONSTRAINT affiliate_attributions_source_check
      CHECK (source IN ('link', 'coupon', 'form', 'api', 'stripe', 'manual'));
  END IF;
END $$;

-- ── 8. Conversions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                  uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  membership_id               uuid NOT NULL REFERENCES public.affiliate_memberships(id) ON DELETE RESTRICT,
  attribution_id              uuid REFERENCES public.affiliate_attributions(id) ON DELETE SET NULL,
  idempotency_key             text NOT NULL UNIQUE,
  external_id                 text,               -- order / invoice / lead id in the source system
  external_customer_id        text,
  customer_ref                text,
  conversion_type             text NOT NULL,      -- lead | qualified_lead | sale | recurring | custom
  amount_cents                bigint NOT NULL DEFAULT 0,
  currency                    text NOT NULL DEFAULT 'EUR',
  status                      text NOT NULL DEFAULT 'confirmed',   -- confirmed | refunded | cancelled
  source                      text NOT NULL,      -- link | coupon | form | api | stripe | manual
  occurred_at                 timestamptz NOT NULL DEFAULT now(),
  parent_conversion_id        uuid REFERENCES public.affiliate_conversions(id) ON DELETE SET NULL,
  stripe_checkout_session_id  text,
  stripe_invoice_id           text,
  stripe_payment_intent_id    text,
  stripe_charge_id            text,
  stripe_subscription_id      text,
  stripe_customer_id          text,
  is_self_referral            boolean NOT NULL DEFAULT false,
  flags                       jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  manual_reason               text,
  reversed_at                 timestamptz,
  reversal_reason             text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_conversions_program_occurred_idx ON public.affiliate_conversions (program_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_conversions_membership_idx ON public.affiliate_conversions (membership_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_conversions_external_idx ON public.affiliate_conversions (program_id, conversion_type, external_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_stripe_invoice_idx ON public.affiliate_conversions (stripe_invoice_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_stripe_pi_idx ON public.affiliate_conversions (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_stripe_charge_idx ON public.affiliate_conversions (stripe_charge_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_type_check') THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_type_check
      CHECK (conversion_type IN ('lead', 'qualified_lead', 'sale', 'recurring', 'custom'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_status_check') THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_status_check
      CHECK (status IN ('confirmed', 'refunded', 'cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_source_check') THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_source_check
      CHECK (source IN ('link', 'coupon', 'form', 'api', 'stripe', 'manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_conversions_amount_check') THEN
    ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_amount_check CHECK (amount_cents >= 0);
  END IF;
END $$;

-- ── 9. Commissions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id         uuid NOT NULL REFERENCES public.affiliate_conversions(id) ON DELETE RESTRICT,
  program_id            uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE RESTRICT,
  membership_id         uuid NOT NULL REFERENCES public.affiliate_memberships(id) ON DELETE RESTRICT,
  affiliate_id          uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  amount_cents          bigint NOT NULL,
  currency              text NOT NULL,
  rule_snapshot         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- the rule that produced amount_cents
  status                text NOT NULL DEFAULT 'pending',      -- pending | approved | payable | paid | rejected | reversed
  approve_after         timestamptz NOT NULL,
  approved_at           timestamptz,
  approved_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at               timestamptz,
  payout_item_id        uuid,
  rejected_reason       text,
  reversal_reason       text,
  reconciliation_flag   boolean NOT NULL DEFAULT false,       -- paid, then the sale was refunded
  reconciliation_note   text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_commissions_status_idx ON public.affiliate_commissions (status, approve_after);
CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_idx ON public.affiliate_commissions (affiliate_id, status);
CREATE INDEX IF NOT EXISTS affiliate_commissions_conversion_idx ON public.affiliate_commissions (conversion_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_commissions_status_check') THEN
    ALTER TABLE public.affiliate_commissions ADD CONSTRAINT affiliate_commissions_status_check
      CHECK (status IN ('pending', 'approved', 'payable', 'paid', 'rejected', 'reversed'));
  END IF;
END $$;

-- ── 10. Payout batches and items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_payout_batches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id        uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  currency            text NOT NULL,
  status              text NOT NULL DEFAULT 'draft',   -- draft | paid | cancelled
  total_cents         bigint NOT NULL DEFAULT 0,
  item_count          integer NOT NULL DEFAULT 0,
  payout_method       text,
  payout_details      jsonb NOT NULL DEFAULT '{}'::jsonb,   -- snapshot at batch time
  external_reference  text,
  note                text,
  documents           jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ name, path, size, kind, uploaded_by, uploaded_at }]
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz,
  paid_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at        timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_payout_batches_affiliate_idx ON public.affiliate_payout_batches (affiliate_id, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_payout_batches_status_check') THEN
    ALTER TABLE public.affiliate_payout_batches ADD CONSTRAINT affiliate_payout_batches_status_check
      CHECK (status IN ('draft', 'paid', 'cancelled'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.affiliate_payout_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        uuid NOT NULL REFERENCES public.affiliate_payout_batches(id) ON DELETE RESTRICT,
  commission_id   uuid NOT NULL UNIQUE REFERENCES public.affiliate_commissions(id) ON DELETE RESTRICT,
  amount_cents    bigint NOT NULL,
  currency        text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_payout_items_batch_idx ON public.affiliate_payout_items (batch_id);

-- ── 11. Resources (per program, shown to approved affiliates) ────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_resources (
  id            bigserial PRIMARY KEY,
  program_id    uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  title         text NOT NULL,
  kind          text NOT NULL DEFAULT 'link',   -- link | file | text
  url           text,
  body          text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_resources_kind_check') THEN
    ALTER TABLE public.affiliate_resources ADD CONSTRAINT affiliate_resources_kind_check CHECK (kind IN ('link', 'file', 'text'));
  END IF;
END $$;

-- ── 12. Audit log (append only) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_audit_log (
  id            bigserial PRIMARY KEY,
  actor_type    text NOT NULL,      -- admin | affiliate | system | stripe | api | public
  actor_id      text,
  actor_label   text,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text,
  program_id    uuid,
  affiliate_id  uuid,
  before        jsonb,
  after         jsonb,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_audit_log_entity_idx ON public.affiliate_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS affiliate_audit_log_created_idx ON public.affiliate_audit_log (created_at DESC);

-- ── 13. Rate limit counters for the public endpoints ─────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_rate_limits (
  key           text NOT NULL,
  window_start  timestamptz NOT NULL,
  count         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

-- ── 14. Link the checkout gate to a referral ─────────────────────────────────
-- accept-terms.js records the referral the tracking snippet hands it, so the
-- Stripe webhook can attribute a checkout that never went through signup.
ALTER TABLE public.terms_acceptances ADD COLUMN IF NOT EXISTS affiliate_code        text;
ALTER TABLE public.terms_acceptances ADD COLUMN IF NOT EXISTS affiliate_visit_token text;
ALTER TABLE public.terms_acceptances ADD COLUMN IF NOT EXISTS affiliate_program     text;

-- ── 15. updated_at triggers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.affiliate_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['affiliate_programs', 'affiliates', 'affiliate_memberships', 'affiliate_attributions',
                           'affiliate_conversions', 'affiliate_commissions', 'affiliate_payout_batches'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = t || '_touch_updated_at') THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.affiliate_touch_updated_at()',
                     t || '_touch_updated_at', t);
    END IF;
  END LOOP;
END $$;

-- ── 16. Service-only RPCs ────────────────────────────────────────────────────
-- affiliate_record_visit: one round trip for the redirect endpoint. Refuses to
-- COUNT (still redirects) when the same ip_hash exceeds p_rate_limit clicks in
-- the last 60 seconds, and increments the membership counters that survive the
-- 90-day purge of raw rows.
CREATE OR REPLACE FUNCTION public.affiliate_record_visit(
  p_program uuid, p_membership uuid, p_code uuid, p_token text,
  p_landing text, p_referrer text, p_utm jsonb, p_ua text, p_ip_hash text,
  p_rate_limit integer DEFAULT 30
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  recent integer;
  new_id bigint;
BEGIN
  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO recent FROM public.affiliate_visits
      WHERE ip_hash = p_ip_hash AND created_at > now() - interval '60 seconds';
    IF recent >= p_rate_limit THEN
      RETURN jsonb_build_object('recorded', false, 'reason', 'rate_limited');
    END IF;
  END IF;

  INSERT INTO public.affiliate_visits (program_id, membership_id, code_id, visit_token, landing_path, referrer_host, utm, ua_family, ip_hash)
    VALUES (p_program, p_membership, p_code, p_token, p_landing, p_referrer, p_utm, p_ua, p_ip_hash)
    RETURNING id INTO new_id;

  UPDATE public.affiliate_memberships
    SET clicks_total = clicks_total + 1, clicks_last_at = now()
    WHERE id = p_membership;

  RETURN jsonb_build_object('recorded', true, 'visit_id', new_id);
END $$;

REVOKE ALL ON FUNCTION public.affiliate_record_visit(uuid, uuid, uuid, text, text, text, jsonb, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_record_visit(uuid, uuid, uuid, text, text, text, jsonb, text, text, integer) TO service_role;

-- affiliate_rate_check: fixed-window counter for the public application
-- endpoint. Returns true when the call is allowed.
CREATE OR REPLACE FUNCTION public.affiliate_rate_check(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ws timestamptz := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  c integer;
BEGIN
  INSERT INTO public.affiliate_rate_limits (key, window_start, count) VALUES (p_key, ws, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = public.affiliate_rate_limits.count + 1
    RETURNING count INTO c;
  RETURN c <= p_limit;
END $$;

REVOKE ALL ON FUNCTION public.affiliate_rate_check(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_rate_check(text, integer, integer) TO service_role;

-- affiliate_mature_commissions: pending -> approved once the approval delay has
-- passed and the underlying conversion still stands. Called by the admin
-- endpoint on load and optionally by pg_cron (see the cron file).
CREATE OR REPLACE FUNCTION public.affiliate_mature_commissions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE n integer;
BEGIN
  WITH matured AS (
    UPDATE public.affiliate_commissions c
      SET status = 'approved', approved_at = now()
      FROM public.affiliate_conversions v
      WHERE c.conversion_id = v.id
        AND c.status = 'pending'
        AND c.approve_after <= now()
        AND v.status = 'confirmed'
      RETURNING c.id
  )
  SELECT count(*) INTO n FROM matured;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.affiliate_mature_commissions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_mature_commissions() TO service_role;

-- ── 17. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.affiliate_programs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_codes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_visits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_attributions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_resources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_rate_limits    ENABLE ROW LEVEL SECURITY;

-- Admin: select / insert / update everywhere, DELETE nowhere (archival only).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['affiliate_programs', 'affiliates', 'affiliate_memberships', 'affiliate_applications',
                           'affiliate_codes', 'affiliate_visits', 'affiliate_attributions', 'affiliate_conversions',
                           'affiliate_commissions', 'affiliate_payout_batches', 'affiliate_payout_items',
                           'affiliate_resources', 'affiliate_audit_log'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', t || '_admin_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t || '_admin_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_update', t);
  END LOOP;
END $$;

-- Affiliate: read own rows only. No insert or update through PostgREST; every
-- affiliate write goes through affiliate-portal.js, which validates the field.
DROP POLICY IF EXISTS affiliates_self_select ON public.affiliates;
CREATE POLICY affiliates_self_select ON public.affiliates
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS affiliate_memberships_self_select ON public.affiliate_memberships;
CREATE POLICY affiliate_memberships_self_select ON public.affiliate_memberships
  FOR SELECT TO authenticated USING (affiliate_id = public.affiliate_my_id());

DROP POLICY IF EXISTS affiliate_programs_member_select ON public.affiliate_programs;
CREATE POLICY affiliate_programs_member_select ON public.affiliate_programs
  FOR SELECT TO authenticated USING (
    id IN (SELECT program_id FROM public.affiliate_memberships WHERE affiliate_id = public.affiliate_my_id())
  );

DROP POLICY IF EXISTS affiliate_codes_self_select ON public.affiliate_codes;
CREATE POLICY affiliate_codes_self_select ON public.affiliate_codes
  FOR SELECT TO authenticated USING (affiliate_id = public.affiliate_my_id());

DROP POLICY IF EXISTS affiliate_conversions_self_select ON public.affiliate_conversions;
CREATE POLICY affiliate_conversions_self_select ON public.affiliate_conversions
  FOR SELECT TO authenticated USING (
    membership_id IN (SELECT id FROM public.affiliate_memberships WHERE affiliate_id = public.affiliate_my_id())
  );

DROP POLICY IF EXISTS affiliate_commissions_self_select ON public.affiliate_commissions;
CREATE POLICY affiliate_commissions_self_select ON public.affiliate_commissions
  FOR SELECT TO authenticated USING (affiliate_id = public.affiliate_my_id());

DROP POLICY IF EXISTS affiliate_payout_batches_self_select ON public.affiliate_payout_batches;
CREATE POLICY affiliate_payout_batches_self_select ON public.affiliate_payout_batches
  FOR SELECT TO authenticated USING (affiliate_id = public.affiliate_my_id());

DROP POLICY IF EXISTS affiliate_payout_items_self_select ON public.affiliate_payout_items;
CREATE POLICY affiliate_payout_items_self_select ON public.affiliate_payout_items
  FOR SELECT TO authenticated USING (
    batch_id IN (SELECT id FROM public.affiliate_payout_batches WHERE affiliate_id = public.affiliate_my_id())
  );

DROP POLICY IF EXISTS affiliate_resources_member_select ON public.affiliate_resources;
CREATE POLICY affiliate_resources_member_select ON public.affiliate_resources
  FOR SELECT TO authenticated USING (
    is_active AND program_id IN (
      SELECT program_id FROM public.affiliate_memberships
      WHERE affiliate_id = public.affiliate_my_id() AND status = 'active'
    )
  );

-- affiliate_visits, affiliate_attributions, affiliate_applications,
-- affiliate_audit_log and affiliate_rate_limits: admin and service key only.
-- (No affiliate policy on purpose: clicks are shown as counts from the
-- membership row, and attributions carry customer identifiers.)

-- ── 17b. Function hardening (Supabase advisor, applied 2026-09-12) ────────────
-- Pin search_path on every affiliate function (linter 0011) and keep the
-- SECURITY DEFINER helper away from anon: RLS policies evaluate it as the
-- signed-in role, so authenticated keeps EXECUTE; nobody else needs it.
ALTER FUNCTION public.affiliate_my_id() SET search_path = public;
ALTER FUNCTION public.affiliate_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.affiliate_record_visit(uuid, uuid, uuid, text, text, text, jsonb, text, text, integer) SET search_path = public;
ALTER FUNCTION public.affiliate_rate_check(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.affiliate_mature_commissions() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.affiliate_my_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.affiliate_my_id() TO authenticated, service_role;

-- ── 18. Private storage bucket for invoices and payout documents ─────────────
-- No storage policies are created: uploads and downloads go through signed
-- URLs minted by affiliate-portal.js / affiliate-admin.js with the service key.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('affiliate-documents', 'affiliate-documents', false)
  ON CONFLICT (id) DO NOTHING;
