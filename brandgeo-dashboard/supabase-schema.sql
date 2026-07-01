-- ════════════════════════════════════════════════════════════
--  BrandGEO Dashboard — Supabase Schema
--  Run this in Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════

-- Enable Row Level Security on all tables (auth handled by Supabase)

CREATE TABLE IF NOT EXISTS public.competitors (
  id         SERIAL PRIMARY KEY,
  name       TEXT,
  website    TEXT,
  category   TEXT
);

CREATE TABLE IF NOT EXISTS public.search_results (
  id                SERIAL PRIMARY KEY,
  query             TEXT,
  url               TEXT,
  title             TEXT,
  snippet           TEXT,
  collected_at      TIMESTAMP DEFAULT NOW(),
  processing_status TEXT DEFAULT 'new',
  attempts          INTEGER DEFAULT 0,
  last_attempt      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.page_analysis (
  id                 SERIAL PRIMARY KEY,
  search_result_id   INTEGER REFERENCES public.search_results(id),
  full_text          TEXT,
  mentions_bpr       BOOLEAN DEFAULT FALSE,
  sentiment          TEXT,
  competitors        TEXT,           -- JSON array of competitor names
  geo_score          INTEGER,
  classification     TEXT,
  llm_summary        TEXT,
  suggested_action   TEXT,
  recommended_content TEXT,
  action_priority    INTEGER DEFAULT 3,
  source_authority   INTEGER DEFAULT 50,
  opportunities      JSONB,
  analyzed_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentions (
  id                SERIAL PRIMARY KEY,
  page_analysis_id  INTEGER REFERENCES public.page_analysis(id),
  entity            TEXT,
  mention_type      TEXT,
  sentiment         TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE public.competitors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_analysis    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions         ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Authenticated read"  ON public.competitors      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON public.search_results   FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON public.page_analysis    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON public.mentions         FOR SELECT TO authenticated USING (true);

-- ─── Sample data (optional — delete after testing) ──────────
INSERT INTO public.search_results (query, url, title, snippet) VALUES
  ('catering corporate bucuresti', 'https://bucateperroate.ro', 'Bucate pe Roate', 'Lider catering corporate'),
  ('top firme catering bucuresti', 'https://ghid-catering.ro/top-10', 'Top 10 Firme Catering', 'BpR pe locul 2');

INSERT INTO public.page_analysis
  (search_result_id, mentions_bpr, sentiment, competitors, geo_score, classification,
   llm_summary, suggested_action, recommended_content, action_priority, source_authority)
VALUES
  (1, true,  'positive', '[]',             88, 'strategic',
   'Site oficial cu autoritate ridicată.', 'Optimizează pentru AI assistants', 'Adaugă FAQ structurat', 1, 85),
  (2, true,  'positive', '["CaterPro"]',   79, 'high_value',
   'Articol listicle cu BpR pe locul 2.',  'Obține link dofollow', 'Trimite materiale editorului', 1, 72);
