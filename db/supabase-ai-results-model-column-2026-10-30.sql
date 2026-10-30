-- ai_results.model: which model produced each row.
--
-- Added 2026-10-30 so a model change (Claude sonnet-4-6 to claude-sonnet-5-5)
-- can be judged on rows that name their model, not on dates, which mix
-- clients and prompts. Written by buildResultRow in
-- brandgeo-dashboard/netlify/functions/_collect.js for every engine.
--
-- Nullable, no default: every row before this migration stays null, which
-- reads as "not recorded". Additive only, no data is touched, RLS unchanged.
--
-- ORDER: apply BEFORE the dashboard push that carries the _collect.js change,
-- or every insert into ai_results fails on an unknown column.

alter table public.ai_results add column if not exists model text;

comment on column public.ai_results.model is
  'Model id that produced the row (e.g. claude-sonnet-5-5, gemini-2.5-flash/ungrounded, perplexity/sonar). Null before 2026-10-30 or when the engine did not report one.';
