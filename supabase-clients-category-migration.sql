-- ============================================================================
-- Admin client-switcher grouping (Master-DashboardDesign, 2026-07-16).
-- Applied live via the Supabase connector; this file is the record.
--
-- Adds a mutually-exclusive `category` to clients so the admin sidebar client
-- switcher can group into tabs: Active / Free / Test / Research (+ Archived).
-- The grouped switcher buckets each client with precedence:
--   test > research > archived > free (category='free' OR plan='free') > active
-- so a free-plan test account shows under Test only, and a real free-plan
-- signup lands in Free automatically without needing category='free' set.
-- ============================================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'active';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_category_check') THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_category_check
      CHECK (category IN ('active','free','test','research','archived'));
  END IF;
END $$;

-- Backfill the current clients per Constantin's grouping (2026-07-16):
UPDATE public.clients SET category = 'active'   WHERE id IN (1, 2, 5, 19);  -- BpR, BrandGEO, Paunescu, Talentwelove (19 falls into Free via plan='free')
UPDATE public.clients SET category = 'free'     WHERE id = 3;               -- Lodgify (essentials plan, manual override into Free)
UPDATE public.clients SET category = 'test'     WHERE id = 17;              -- test client (Test wins over its free plan)
UPDATE public.clients SET category = 'research' WHERE id IN (10,11,12,13,14,15,16);
UPDATE public.clients SET category = 'archived' WHERE id = 6;               -- Workfully (hidden from the switcher, NOT deleted)
