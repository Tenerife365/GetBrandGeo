-- ════════════════════════════════════════════════════════════
--  BrandGEO Dashboard — Supabase Schema (current, July 2026)
--  Run in Supabase → SQL Editor on a fresh project.
--  Safe to re-run: uses IF NOT EXISTS throughout.
-- ════════════════════════════════════════════════════════════

-- ─── competitors ────────────────────────────────────────────
-- Catering brands tracked as competition.
-- Populated manually + auto-discovered from ai_results.
CREATE TABLE IF NOT EXISTS public.competitors (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  website     TEXT,
  category    TEXT,
  source      TEXT,                          -- 'manual' | 'ai_discovered'
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Prevent duplicate names (added via migration, safe to re-run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'competitors_name_unique'
  ) THEN
    ALTER TABLE public.competitors ADD CONSTRAINT competitors_name_unique UNIQUE (name);
  END IF;
END $$;

-- ─── prompts ────────────────────────────────────────────────
-- The 20 Romanian catering queries sent to each LLM each month.
-- Categories: mid_size_event | large_event | very_large_event | general
CREATE TABLE IF NOT EXISTS public.prompts (
  id          SERIAL PRIMARY KEY,
  text        TEXT NOT NULL,
  category    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  position    INTEGER,                       -- display / query order
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── ai_results ─────────────────────────────────────────────
-- One row per (prompt × LLM × month). The core dataset.
-- llm values: 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'meta'
CREATE TABLE IF NOT EXISTS public.ai_results (
  id                   SERIAL PRIMARY KEY,
  prompt_id            INTEGER REFERENCES public.prompts(id),
  llm                  TEXT NOT NULL,
  brand_mentioned      BOOLEAN DEFAULT FALSE,
  brand_position       INTEGER,              -- rank in numbered list (1 = first)
  response_snippet     TEXT,                 -- ~300 chars around brand mention
  sentiment            TEXT,                 -- 'positive' | 'neutral' | 'negative'
  competitors_mentioned TEXT,                -- JSON array of competitor names found
  checked_at           TIMESTAMP DEFAULT NOW(),
  created_at           TIMESTAMP DEFAULT NOW()
);

-- Index for the monthly deduplication check in collect_llm_responses.py
CREATE INDEX IF NOT EXISTS ai_results_prompt_llm_month_idx
  ON public.ai_results (prompt_id, llm, date_trunc('month', checked_at));

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE public.competitors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_results   ENABLE ROW LEVEL SECURITY;

-- Authenticated users (dashboard login) can read all tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_competitors') THEN
    CREATE POLICY "auth_read_competitors" ON public.competitors FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_prompts') THEN
    CREATE POLICY "auth_read_prompts"     ON public.prompts     FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'auth_read_ai_results') THEN
    CREATE POLICY "auth_read_ai_results"  ON public.ai_results  FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Service role (used by collect_llm_responses.py via SQLAlchemy) can INSERT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_insert_ai_results') THEN
    CREATE POLICY "service_insert_ai_results" ON public.ai_results FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END $$;

-- ─── Legacy tables (no longer used by dashboard) ─────────────
-- search_results, page_analysis, mentions — kept in DB but not queried.
-- Safe to DROP if you want to clean up:
--   DROP TABLE IF EXISTS public.mentions CASCADE;
--   DROP TABLE IF EXISTS public.page_analysis CASCADE;
--   DROP TABLE IF EXISTS public.search_results CASCADE;
