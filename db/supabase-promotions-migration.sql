-- ============================================================================
-- supabase-promotions-migration.sql
-- Platform-wide promotion codes (PRICING-STRATEGY-2026-07.md §8, §12 T3).
--
-- ⚠️ NOT YET APPLIED to the live project. Unlike most files in db/, this one is
-- the migration to run, not a record of one already run. Apply it before the
-- admin Promotions panel will do anything (until then promotions-admin.js
-- returns 404-equivalent errors and the panel shows its "not available yet"
-- state by design).
--
-- DEPENDS ON public.is_admin() (supabase-multitenant-migration.sql). Already live.
--
-- WHAT THIS IS
--   A promotion is platform-wide, not per-tenant: one code applies across
--   signups and renewals for whichever plans it targets. That is why there is
--   no client_id column and no get_my_client_id() in any policy here.
--
-- SCOPE, DELIBERATELY NARROW
--   This table is the record of which promotions exist and which plans they
--   target. It does NOT price anything and it does NOT discount anything on its
--   own. Stripe coupon creation and redemption are a separate piece of work
--   (PRICING-STRATEGY-2026-07.md §8) with a real external dependency, and are
--   intentionally not wired here. Nothing reads this table on the checkout path
--   yet, so applying this migration cannot change what any customer is charged.
--
-- RLS
--   Admin-only for every verb. promotions-admin.js uses the service key (which
--   bypasses RLS) behind requireAuth({ adminOnly: true }), so these policies are
--   defence in depth for any direct PostgREST access with a user JWT, not the
--   primary gate. `anon` is excluded by scoping to `authenticated`.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id            bigserial PRIMARY KEY,
  label         text NOT NULL,
  code          text NOT NULL,
  discount_type text NOT NULL,
  value         numeric(10,2) NOT NULL,
  plans         text[] NOT NULL DEFAULT '{}',
  starts_at     timestamptz,
  ends_at       timestamptz,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Codes are matched case-insensitively at redemption time, so uniqueness has to
-- be case-insensitive too. promotions-admin.js also upper-cases on write, but a
-- direct SQL insert must not be able to create LAUNCH20 alongside launch20.
CREATE UNIQUE INDEX IF NOT EXISTS promotions_code_lower_key
  ON public.promotions (lower(code));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_discount_type_check') THEN
    ALTER TABLE public.promotions
      ADD CONSTRAINT promotions_discount_type_check
      CHECK (discount_type IN ('percent', 'fixed'));
  END IF;

  -- A percent promo above 100 is a negative price, not a discount. A fixed promo
  -- is capped only by being non-negative; the euro amount is checked in the
  -- function against nothing here on purpose, since plan prices live in
  -- planConfig.ts and this table must not duplicate them.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_value_check') THEN
    ALTER TABLE public.promotions
      ADD CONSTRAINT promotions_value_check
      CHECK (value >= 0 AND (discount_type <> 'percent' OR value <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_window_check') THEN
    ALTER TABLE public.promotions
      ADD CONSTRAINT promotions_window_check
      CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at);
  END IF;
END $$;

-- Listing is newest-first and the panel shows active state prominently.
CREATE INDEX IF NOT EXISTS promotions_active_created_idx
  ON public.promotions (active, created_at DESC);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotions_select ON public.promotions;
DROP POLICY IF EXISTS promotions_insert ON public.promotions;
DROP POLICY IF EXISTS promotions_update ON public.promotions;
DROP POLICY IF EXISTS promotions_delete ON public.promotions;

CREATE POLICY promotions_select ON public.promotions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY promotions_insert ON public.promotions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY promotions_update ON public.promotions
  FOR UPDATE TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- No DELETE policy on purpose. Promotions are deactivated, never removed, so a
-- code that was honoured stays auditable. promotions-admin.js exposes no delete
-- action to match.
