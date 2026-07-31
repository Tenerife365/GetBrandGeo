-- Migration: store the raw AI response text on ai_results
-- Master-Reasoning competitor-extraction round 2 (CLAUDE.md §9.18 / §8).
--
-- Why: ai_results previously kept only response_snippet (~300 chars centred on the
-- first brand mention). When the London City-Research run (client_id 10, 2026-07-10)
-- exposed missed competitor extractions on Gemini/Perplexity, the raw responses were
-- unrecoverable — there was nothing to re-run the improved extractor against. This
-- column stores the full model answer (capped at 10,000 chars by the collectors) so
-- extraction gaps can be diagnosed and re-analysed after the fact.
--
-- Nullable, no default: existing rows stay NULL (their raw text is already lost);
-- only newly collected / force-refreshed rows populate it going forward.
-- 10k char cap is enforced in the three collectors (text.slice(0, 10000)); text is
-- unbounded here so the cap can be tuned in code without another migration.
--
-- Run once in the Supabase SQL Editor (project duiyifepitvugyulobqm).

ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS response_text TEXT DEFAULT NULL;

-- purge-old-results.js already deletes rows by checked_at date, so this larger
-- column is bounded by the same retention window — no extra cleanup needed.
