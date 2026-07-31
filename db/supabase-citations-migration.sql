-- supabase-citations-migration.sql
-- Store the sources an AI engine cited when it answered. 2026-07-29.
--
-- ⚠️ NOT YET APPLIED. Run this in the Supabase SQL editor for project
-- duiyifepitvugyulobqm. Safe to re-run (IF NOT EXISTS throughout).
--
-- WHY THIS COLUMN EXISTS
--   BrandGEO measures whether a brand appears in AI answers. WHICH SOURCES the
--   engine used to build that answer is the other half of the same question, and
--   it is the more actionable half: "you are missing from Google AI Overviews"
--   is a diagnosis, "Google built that overview from these four pages, none of
--   which are yours" is a task list.
--
--   Google AI Overviews returns this on every call, in ai_overview.references.
--   Until this column existed the data was fetched, logged, and thrown away on
--   every single collection.
--
-- WHY IT IS NOT jammed INTO response_text
--   response_text is the exact string analyseResponse() parses. Appending
--   "Sources: ..." would feed citation titles and domains straight into
--   competitor extraction, so a cited publisher would start appearing in the
--   customer's competitor list. A separate column is the only correct home.
--
-- SHAPE
--   jsonb array, each element { title, link, source, index }, nullable. Null
--   means the engine returned no citation data (every engine except
--   ai_overview today). An empty array means the engine ran and cited nothing,
--   which is a different and meaningful result.
--
-- FORWARD-LOOKING, deliberately not ai_overview-specific: Perplexity and
-- ChatGPT both return citation structures we currently discard, and Gemini
-- grounding returns groundingMetadata. This column is where those go next
-- without another migration.

alter table public.ai_results
  add column if not exists citations jsonb;

comment on column public.ai_results.citations is
  'Sources the engine cited when producing this answer. jsonb array of {title, link, source, index}. NULL = engine returned no citation data; [] = engine ran and cited nothing. Populated for ai_overview since 2026-07-29.';

-- Partial index: only rows that actually carry citations. The overwhelming
-- majority of ai_results rows are NULL here (six of seven engines return
-- nothing), so a full index would be mostly dead weight.
create index if not exists idx_ai_results_citations
  on public.ai_results using gin (citations)
  where citations is not null;

-- ── Verification ─────────────────────────────────────────────────────────────
--   select column_name, data_type from information_schema.columns
--    where table_schema='public' and table_name='ai_results' and column_name='citations';
--   -- expect one row, jsonb
--
--   select count(*) filter (where citations is not null) as with_citations,
--          count(*) as total
--     from public.ai_results;
--   -- expect with_citations = 0 immediately after applying, then rising once
--   -- the next Growth PRO collection runs
--
-- Most useful query this unlocks, once data exists: who Google cites in a
-- category where the client is absent.
--   select c.name,
--          jsonb_array_elements(r.citations)->>'source' as cited_source,
--          count(*)
--     from public.ai_results r
--     join public.clients c on c.id = r.client_id
--    where r.llm = 'ai_overview' and r.citations is not null
--      and r.brand_mentioned = false
--    group by 1, 2
--    order by 3 desc;
