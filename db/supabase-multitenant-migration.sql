-- ════════════════════════════════════════════════════════════
--  BrandGEO — Multi-tenant migration
--  Run in Supabase → SQL Editor
--  Safe to re-run (IF NOT EXISTS / ON CONFLICT throughout)
-- ════════════════════════════════════════════════════════════

-- ─── 1. clients table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  brand_aliases  TEXT[],     -- variants used for detection
  brand_website  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Insert the two clients
INSERT INTO public.clients (id, name, slug, brand_aliases, brand_website) VALUES
  (1, 'Bucate pe Roate', 'bpr',      ARRAY['bucate pe roate','bpr','bucateperoate'], 'bucateperoate.ro'),
  (2, 'BrandGEO',        'brandgeo', ARRAY['brandgeo','brand geo','getbrandgeo'],    'getbrandgeo.com')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. user_profiles table ─────────────────────────────────
-- Maps each Supabase auth user to a client + role
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  INTEGER REFERENCES public.clients(id),  -- NULL = admin (sees all)
  role       TEXT NOT NULL DEFAULT 'viewer',          -- 'admin' | 'viewer'
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── 3. Add client_id to existing tables ────────────────────
ALTER TABLE public.prompts     ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES public.clients(id);
ALTER TABLE public.ai_results  ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES public.clients(id);
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES public.clients(id);

-- ─── 4. Tag all existing data as BpR (client 1) ─────────────
UPDATE public.prompts     SET client_id = 1 WHERE client_id IS NULL;
UPDATE public.ai_results  SET client_id = 1 WHERE client_id IS NULL;
UPDATE public.competitors SET client_id = 1 WHERE client_id IS NULL;

-- ─── 5. RLS helper functions ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS INTEGER LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT client_id FROM public.user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid()),
    false
  )
$$;

-- ─── 6. RLS on new tables ────────────────────────────────────
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- clients: all authenticated users can read (just metadata)
DROP POLICY IF EXISTS "clients_read" ON public.clients;
CREATE POLICY "clients_read" ON public.clients
  FOR SELECT TO authenticated USING (true);

-- user_profiles: each user reads only their own row
DROP POLICY IF EXISTS "profiles_read_own" ON public.user_profiles;
CREATE POLICY "profiles_read_own" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- ─── 7. Update RLS on data tables ────────────────────────────
-- prompts
DROP POLICY IF EXISTS "Authenticated read" ON public.prompts;
DROP POLICY IF EXISTS "prompts_client_read" ON public.prompts;
CREATE POLICY "prompts_client_read" ON public.prompts
  FOR SELECT TO authenticated
  USING (client_id = get_my_client_id() OR is_admin());

-- ai_results
DROP POLICY IF EXISTS "Authenticated read" ON public.ai_results;
DROP POLICY IF EXISTS "ai_results_client_read" ON public.ai_results;
CREATE POLICY "ai_results_client_read" ON public.ai_results
  FOR SELECT TO authenticated
  USING (client_id = get_my_client_id() OR is_admin());

-- service_role INSERT for collector script (unchanged)
DROP POLICY IF EXISTS "service_insert_ai_results" ON public.ai_results;
CREATE POLICY "service_insert_ai_results" ON public.ai_results
  FOR INSERT TO service_role WITH CHECK (true);

-- competitors
DROP POLICY IF EXISTS "Authenticated read" ON public.competitors;
DROP POLICY IF EXISTS "competitors_client_read" ON public.competitors;
CREATE POLICY "competitors_client_read" ON public.competitors
  FOR SELECT TO authenticated
  USING (client_id = get_my_client_id() OR is_admin());

-- ─── 8. Create Constantin's admin profile ────────────────────
-- Find your UUID first:
--   SELECT id FROM auth.users WHERE email = 'constantin@workfully.com';
-- Then replace the UUID below and run:

-- INSERT INTO public.user_profiles (id, client_id, role)
-- VALUES ('PASTE-YOUR-UUID-HERE', 1, 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', client_id = 1;

-- NOTE: client_id=1 means you see BpR data by default.
-- When the client switcher is built in the dashboard,
-- admin users will be able to switch between all clients.

-- ─── 9. BpR client user (create NEXT WEEK before giving access) ─
-- 1. Go to Supabase → Authentication → Users → Invite user
-- 2. Enter BpR's email, they set their own password
-- 3. Run:
-- INSERT INTO public.user_profiles (id, client_id, role)
-- VALUES ('<BPR-USER-UUID>', 1, 'viewer')
-- ON CONFLICT (id) DO NOTHING;
