# Phase 2 results layer: binding spec

```
INTENT: one source of truth for results rows and metric definitions on the six customer results pages
SCOPE: docs/arch/ (write); brandgeo-dashboard/src, netlify/functions/_score.js, tests/, db/, live read-only SQL (read)
MODEL: opus  |  STOP AFTER: /build
```

Status: SPEC 2026-11-08, written by bg-architect against the plan
`docs/arch/phase2-dashboard-plan-2026-11-08.md`, whose four rulings Constantin accepted
with all defaults on 2026-11-08 ("Yes, defaults"):

1. Snapshot metrics use the newest non-error row per (prompt, engine), all time. Trends use
   the time window.
2. The results cache is our own `ResultsProvider` in `src/lib`. No new dependency.
3. A server RPC returns the latest rows.
4. CSV export ships in Phase 2.

Every claim about current code below carries the `path:line` it was read from on
2026-11-08 (paths relative to `brandgeo-dashboard/` unless they start with `db/` or
`docs/`). Live database facts are marked **[live]** and were read with SELECT or EXPLAIN only,
including probes run as a real viewer inside `begin; ... rollback;` with no write.

Builders implement this verbatim. Where this spec gives a name, a type or SQL, use it
exactly. Where it says "must", a deviation is a defect for bg-verify.

---

## 0. Current state, verified

### 0.1 How each page reads results today

| Page | Read | Population | Cap |
|---|---|---|---|
| Overview | `Dashboard.tsx:249-256`: `select('*, prompts(text, category)')`, non-error, time window, `.limit(1000)` | windowed rows, every engine (`LLMS`, `Dashboard.tsx:39`, `:374`) | **1,000**, and it feeds totals: Mention rate, Avg position and Checks (`Dashboard.tsx:98-117`, `:301-305`), the engine chart (`:374-384`). The plan's note that this read is "a list, not a total" (`phase2-dashboard-plan-2026-11-08.md:39`) is wrong. |
| Overview score | `Dashboard.tsx:269-277`: `readAllById`, non-error, all time | newest usable row per cell (`aiVisibilityScore.ts:207-242`) | none |
| Overview recs | `Dashboard.tsx:344-361`: `recommendation_runs` then `recommendations` | | 2 sequential steps |
| AI Visibility | `AIVisibility.tsx:502-505`: active prompts plus `readAllById(select('*'))` | every row, every status, all prompts including inactive | none, but `select('*')` ships `response_text` |
| AI Visibility budget meter | `AIVisibility.tsx:713-716`: `select('cost_eur')` for the month | month rows | **1,000**, feeds a sum |
| AI Visibility fix states | `AIVisibility.tsx:592-646` | | 3 sequential steps |
| Mentions | `Mentions.tsx:119-124`: `select('*, prompts(...)')`, `brand_mentioned = true`, no status filter | every mention row, every engine | **1,000** (client 1 has 1,928 mention rows **[live]**) |
| Brand Sentiment | `BrandSentiment.tsx:222-228`: mention rows in the window | windowed mention rows, active engines (`:239`) | **1,000** |
| Competitors | `Competitors.tsx:326-328`: no status filter, no order | every row, error rows included | **1,000, arbitrary subset** |
| Recommendations | `Recommendations.tsx:717-731`: ok rows ordered, error rows, prompts; then `loadHistory` (`:769`, which is itself `:680-701`, two steps) | every non-error row, no-answer rows included | **1,000** |

**[live] client 1:** 3,829 `ai_results` rows, 401 distinct (prompt, engine) cells, 58 prompts
of which 56 are active, 3 cells whose newest attempt is an error, 12 whose newest row is a
no-answer row. Client 54: 660 rows, 385 cells.

**[live] data invariants the spec relies on:** `ai_results.status` is only `'ok'` or
`'error'` (0 null); 0 rows have `status = 'error'` and a `[no_ai_overview]` snippet; 0 rows
whose `prompt_id` is missing or belongs to another client; no brand-mentioned row has a null
sentiment (mentioned rows: 762 positive, 1,271 neutral, 7 negative, platform wide);
`checked_at` is `timestamp without time zone`.

**[live] columns read by no page:** `response_text` (5,046 kB of client 1's 6,520 kB of row
data, `pg_column_size`), `citations`, `cost_eur` (budget meter only), `run_id`, `created_at`.
A grep of `src/pages` and `src/lib` for `response_text` returns 0 hits.

### 0.2 The pure modules that already define behaviour

- `aiVisibilityScore.ts:97-194` `computeAiVisibilityScore` over the population "active
  prompt x active engine with a usable row" (`:107-113`); `buildScoreResultMap` keeps the
  newest row by `checked_at`, drops error and no-answer rows (`:218-221`).
- `isNoAnswerRow` (`aiVisibilityScore.ts:75-78`): snippet starts with `[no_ai_overview]`.
- `fixItems.ts:51-88` `buildFixResultMap`: newest-first sort (`:59-60`), no-answer rows
  skipped (`:69`), first non-error row per cell kept, an error row met before it marks the
  engine (`:70-79`); `errorEngines` and `partialErrorEngines` (`:84-85`). Rows for inactive
  prompts stay in the map (`:47-49`), and `buildFixItems` reads them for its competitor and
  gap numbers (`:116-137`).
- `promptPerformance.ts:156-206` `buildCellViews`: `current` is the newest row whatever its
  status; an error cell carries `errorSince` (oldest error of the unbroken run that starts
  at the newest row) and `previousOk` (first non-error row after that run), via `errorRun`
  (`:127-141`). `engineErrorSince` (`:212-222`) does the same per engine across prompts.
- `mcp-server.js:566-567` keyset-reads every row of the client for the requested engines,
  with no prompt filter, then calls `buildFixResultMap` and `buildFixItems` (`:625`, `:635`).

### 0.3 Loading, reload and cache today

- No cache: each page reads on mount and on `lastCompletedAt` through `useCollectionLanded`
  (`useCollectionLanded.ts:13-21`), which ignores the value seen at mount (`:18`).
- `lastCompletedAt` bumps at most once per 25 s during a run
  (`collectionContext.tsx:113`), once at run end, and at 0, 15 and 40 s after a single
  prompt refresh (`collectionContext.tsx:447-449`).
- `isDemoMode` (`supabase.ts:15`) gates mock data from `mockData.ts`.
- Time filter: default `'7d'` (`timeFilterContext.tsx:20`); shown on `/`, `/sentiment`,
  `/usage` only (`Layout.tsx:416-417`).
- Loading states: content-shaped skeletons on Dashboard (`Dashboard.tsx:414`), AI
  Visibility (`AIVisibility.tsx:1139`) and Recommendations (`Recommendations.tsx:624`);
  pulsing text on Mentions (`Mentions.tsx:171`), Brand Sentiment (`BrandSentiment.tsx:264`)
  and Competitors (`Competitors.tsx:407`). `RouteSkeleton` (`components/RouteSkeleton.tsx`)
  and `LoadErrorCard` (`components/LoadErrorCard.tsx`, props `message`, `onRetry`,
  `retryLabel`, `className`) exist.

### 0.4 RLS and indexes on the read path [live]

- `ai_results` SELECT policies: `ai_results_client_read` (authenticated,
  `is_admin() OR has_client_access(client_id)`) and `ai_results_select` (public,
  `my_role() = 'admin' OR has_client_access(client_id)`). Both are evaluated per row.
- Indexes: `idx_ai_results_client_checked (client_id, checked_at DESC)`, `ai_results_pkey`,
  `idx_ai_results_prompt`, `idx_ai_results_checked_at`, `idx_ai_results_status`.
- `prompts`: `idx_prompts_client`, read policies of the same shape.

---

## 1. Metric definitions (Ruling 1)

### 1.1 Populations

- **Snapshot rows:** the rows the RPC of section 2 returns. Every page derives every
  snapshot number from them.
- **Usable cell:** for one (prompt, engine), the newest row (order `checked_at` desc, then
  `id` desc) with `status <> 'error'` and not `isNoAnswerRow`. This is exactly the row
  `buildFixResultMap` keeps (`fixItems.ts:59-79`) and `buildScoreResultMap` keeps
  (`aiVisibilityScore.ts:218-238`).
- **Population P:** one usable cell per (active prompt, active engine) pair that has one.
  Active prompts: `prompts.is_active = true` for the client, in `position, id` order. Active
  engines: `useClient().activeEngines` (`clientContext.tsx:107-109`), in that order. Cells
  in P are ordered prompt-major, then engine. P is identical to the `scoped` population of
  `aiVisibilityScore.ts:107-113`.
- **P_m:** the cells of P with `brand_mentioned = true`. `n(X)` is the number of cells in X.
- **History rows (trends and feeds only):** rows with `status <> 'error'` inside the time
  window, active engines, no-answer rows dropped, read through section 5.

**Error rows** never enter P, P_m or history. They feed only the non-result states: the
`error` cell state (`promptPerformance.ts:187-192`), engine health, `errorEngines` and
`partialErrorEngines` (`fixItems.ts:70-86`), and Recommendations' "no usable data" notice.
**No-answer rows** (`[no_ai_overview]`) never enter P, P_m or history. They feed only the
`no_answer` cell state (`promptPerformance.ts:193-194`) and the `noAnswers` count.

### 1.2 Definitions

| # | Metric | Formula over its population | Empty result |
|---|---|---|---|
| M1 | Mention rate | `pct = round(100 x n(P_m) / n(P))` | `pct = null` when `n(P) = 0` |
| M2 | Average position | mean of `brand_position` over cells of P_m with `brand_position != null`, rounded to 1 decimal (`round(x * 10) / 10`) | `null` when no such cell |
| M2b | Best position | min `brand_position` over the same cells | `null` |
| M3 | Sentiment score | `round((100 x positive + 50 x neutral) / n(P_m))`; any other sentiment value counts in `n(P_m)` with weight 0 | `null` when `n(P_m) = 0` |
| M3b | Sentiment breakdown | counts `positive`, `neutral`, `negative`, `other` over P_m; each `pct = round(100 x n / n(P_m))` | all 0, pct 0 |
| M4 | Engine coverage | `heardFrom` = active engines with at least one cell in P; `withMention` = those with at least one cell in P_m; `reachPct = round(100 x n(withMention) / n(heardFrom))` | `reachPct = null` when `heardFrom` is empty |
| M5 | Per-engine rate | for engine e: `checked` = cells of P for e, `mentioned` = cells of P_m for e, `rate = mentioned / checked` (unrounded fraction), `pct = round(100 x rate)`, `avgPosition` and `bestPosition` as M2 over e's cells | `rate = pct = null` when `checked = 0` |
| M5b | Per-engine band | `UNAVAILABLE` when e is in `errorEngines` and `checked = 0`; else `NOT_MEASURED` when `checked = 0`; else `KNOW` when `pct >= 50`, `PARTIAL` when `pct >= 25`, else `MISSING` | |
| M6 | Competitor appearances | `aggregateCompetitors(P cells, limit)` (`competitorFilter.ts:255`), unchanged; `totalMentions`, `rankedMentions`, `avgPos` (prose sentinel excluded), `byEngine`, `promptIds` come from it | `[]` |
| M6b | Competitor share by engine | for engine e and competitor c: `round(100 x c.byEngine[e] / checked_e)`; brand share for e is M5 `pct` | engines with `checked_e = 0` are omitted |
| M7 | Category rate | per prompt category over P: `checked`, `mentioned`, `rate = mentioned / checked`; sorted by `rate` ascending | `[]` |
| M8 | AI Visibility Score | `computeAiVisibilityScore(P.promptIds, results, P.engineIds)` unchanged (`aiVisibilityScore.ts:97`) | as today |
| M9 | Has any measurement | any snapshot row with `is_usable = true`, any engine, any prompt | `false` |
| M10 | Checks in window (trend) | count of history rows | 0 |

M1 equals the score's `recognition` dimension (`aiVisibilityScore.ts:115-118`) by
construction. M3 equals the score's `sentiment` dimension (`aiVisibilityScore.ts:130-139`)
except that the dimension falls back to 55 when `knowledge > 0` and no row is mentioned
(`:139`); that fallback stays inside the score, unchanged, and M3 shows `null`.

### 1.3 Divergent implementations today, and which one wins

| Metric | Current implementations | Winner |
|---|---|---|
| Mention rate | `aiVisibilityScore.ts:115-118` (P); `AIVisibility.tsx:735-739` per engine over active prompts; `AIVisibility.tsx:781-791` `totalChecked`/`gapCount` over every prompt in the map, inactive included; `Dashboard.tsx:98-117` windowed, capped at 1,000; `Dashboard.tsx:374-384` windowed per engine over every engine; `Competitors.tsx:65-78` every row including error and no-answer rows; `Recommendations.tsx:259-303` every non-error row including no-answer rows, capped; `fixItems.ts:103-107` per engine over active prompts | `aiVisibilityScore.ts:115-118` over P |
| Average position | `Dashboard.tsx:108-111` (1 decimal, windowed); `Mentions.tsx:157-163` (integer, every mention row, capped); `Competitors.tsx:88-93` (1 decimal, every row); `Recommendations.tsx:275-277` per engine and `:310-315` overall (1 decimal, every ok row) | the `Dashboard.tsx:108-111` formula over P_m |
| Sentiment | `BrandSentiment.tsx:56-78` over windowed mention rows; `aiVisibilityScore.ts:130-139` over P_m with the 55 fallback; `Mentions.tsx:164` positive count over every mention row | the `BrandSentiment.tsx:74-76` formula over P_m |
| Engine coverage | `aiVisibilityScore.ts:166-172` (heard from); `Dashboard.tsx:384` "engines with rows in the window" | `aiVisibilityScore.ts:166-172` over P |
| Per-engine band | `AIVisibility.tsx:801-804` and `fixItems.ts:142-145`: 50 and 25 percent; `netlify/functions/_score.js:136`: `rate === 0` missing, `>= 0.6` know, else partial (audit path) | **current behaviour kept on each surface.** The dashboard keeps 50/25 (M5b), the audit keeps 60. Merging the two fix systems, and with them the thresholds, is Phase 3. Do not touch `_score.js` or `fixItems.ts`. |
| Competitors | `AIVisibility.tsx:768-770` over every prompt in the map; `Competitors.tsx:86` over every row ever, error rows included, arbitrary 1,000; `Recommendations.tsx:307` over every ok row, capped; `fixItems.ts:116-118` over every prompt in the map | `aggregateCompetitors` over P (M6) on every page. **`buildFixItems` keeps its own all-prompts population** (`fixItems.ts:47-49`, `:116-137`) so the page and MCP `list_fixes` (`mcp-server.js:566-567`, `:625-635`) keep building the same list; with 2 inactive prompts of 58 on client 1 the fix card and the page list can differ in a rare tie. Recorded for Phase 3, not fixed. |
| Competitor share | `Competitors.tsx:253-268` over every row | M6b over P |
| Category rate | `Recommendations.tsx:283-301` over every ok row | M7 over P |

### 1.4 Acceptance

1.1 Every snapshot number on Overview, AI Visibility, Mentions, Brand Sentiment, Competitors
and Recommendations comes from a function of `src/lib/metrics.ts` (section 4) over P or P_m.
1.2 No page file computes a rate, an average, a sentiment score or a competitor count from
rows itself: a grep of the six page files for `brand_mentioned).length`, `reduce((s, r) => s + (r.brand_position` and `aggregateCompetitors(` returns 0 hits.
1.3 `metrics.mentionRate(P).pct` equals `computeAiVisibilityScore(...).dimensions.recognition` whenever `n(P) > 0` (test).
1.4 `fixItems.ts`, `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts`, `promptPerformance.ts` and `netlify/functions/_score.js` are unchanged.

---

## 2. The RPC contract

### 2.1 Ruling

One SQL function, `public.client_results_latest(p_client_id integer)`, returns **a subset of
real `ai_results` rows** for one client, every prompt (active and inactive) and every engine,
each row tagged with the roles it plays in its cell. A row appears once even when it plays
several roles. Per (prompt, engine) cell the subset is at most these five rows, usually one:

| Flag | Row |
|---|---|
| `is_latest` | the newest row whatever its status (`promptPerformance` `current`) |
| `is_usable` | the newest non-error, non-no-answer row (the score and fix row) |
| `is_last_nonerror` | the newest non-error row, no-answer rows included (`previousOk`, engine `lastOkAt`) |
| `is_newest_error` | the newest error row (drives `errorEngines` and `newestErrorAt`) |
| `is_run_start` | when the newest row is an error: the oldest error of the unbroken run that starts there (`errorSince`) |

Plus one per-engine value repeated on every row of that engine: `engine_error_since`, the
`engineErrorSince` of `promptPerformance.ts:212-222` computed over all of the engine's rows.

Reasoning in one line: returning real rows with role flags, instead of a new row shape,
lets the existing pure functions (`buildFixResultMap`, `buildCellViews`, `measureFix`,
`evaluateFix`) run unchanged on the RPC output and produce exactly what they produce on the
full history, which is provable by a parity test.

**Why the subset is exact.** For one cell, sorted newest first, the subset keeps the newest
row, the newest error, the oldest error of the leading error run, the first non-error row
and the first usable row. `buildCellViews` reads only `list[0]`, the error run and the first
non-error row after it (`promptPerformance.ts:127-141`, `:187-200`). `buildFixResultMap`
keeps the first usable row and marks the engine when any error precedes it
(`fixItems.ts:61-79`); the newest error is in the subset whenever any error precedes the
usable row. The engine-level error run crosses cells, so its start date is not derivable from
per-cell rows; that is why `engine_error_since` is computed in SQL and
`promptPerformance.engineErrorSince` must never be called on snapshot rows (section 4).

**All prompts, not active only.** Today AI Visibility reads every prompt's rows
(`AIVisibility.tsx:504`) and `buildFixItems` depends on inactive prompts' rows
(`fixItems.ts:47-49`), as does MCP (`mcp-server.js:566-567`). Pages restrict to active
prompts in `metrics.ts`. Prompts are never deleted, and **[live]** no row points at a missing
or foreign prompt.

**Columns.** Exactly what the six pages render or compute from: `id, prompt_id, llm, status,
error_code, brand_mentioned, brand_position, sentiment, response_snippet,
competitors_mentioned, checked_at, model`. Excluded: `response_text` (no page reads it),
`citations`, `cost_eur`, `run_id`, `created_at`, `client_id`. `response_snippet` is required
(no-answer marker, snippets on Sentiment, Mentions, Recommendations and the AI Visibility
error panel `AIVisibility.tsx:1465-1467`). `competitors_mentioned` is required (M6, cell
competitor blocks). `model` is carried for the CSV and future model judgement (CLAUDE.md
2026-10-31 entry); it costs one short text.

**Index.** None. Evidence, EXPLAIN ANALYZE on client 1, 2026-11-08 **[live]**:

- As the table owner: seq scan of 3,829 of 6,119 rows (client 1 is 63 percent of the table,
  so the planner is right), three window sorts in memory, 589 rows out, **67.8 ms**.
- As a real viewer of client 1 (`set local role authenticated`, JWT claims, rolled back):
  index scan on `idx_ai_results_client_checked`, **507.6 ms**, of which the RLS filter
  (`my_role()`, `has_client_access()` twice, `is_admin()` per row) is almost all; 16,736
  buffer hits. The current single `select *` of the same rows as the same viewer measures
  **466.5 ms** and spills its sort to disk (2,544 kB). The window work adds about 40 ms.
- A first draft that joined an engine aggregate back to the rows chose a nested loop and ran
  in 1,277.9 ms; the all-window form below avoids the join. Do not reintroduce a join.
- A viewer of client 54 selecting client 1's rows reads **0** rows; RLS applies before the
  window functions, so the function cannot leak another client's rows.

The RLS cost is per row and pre-existing. Rewriting the `ai_results` policies to evaluate
`is_admin()` once (`(select public.is_admin())`) is a separate artifact, see section 11.

**Body validated [live]:** the exact function body of 2.2, run as a plain read-only query
with `p_client_id` replaced by 1, returns 589 rows: 401 `is_latest` (one per cell), 400
`is_usable`, 177 `is_newest_error`, 3 `is_run_start`, and `checked_at` typed
`timestamp without time zone`. The function itself was not created (no write from this seat).

**Size [live]:** 589 rows, 293 kB of JSON for the twelve data columns, against 10,199 kB for
`select *` of all 3,829 rows. For client 54: 385 rows out of 660.

**Row cap.** PostgREST's 1,000 row cap applies to function results too. 589 rows today, but a
client with more than 200 cells can exceed it. The provider therefore reads the RPC through
`readAllById` (keyset on `id`), which PostgREST supports on a table function. The function
must return its rows in `id desc` order.

### 2.2 Migration text (verbatim)

File: `db/supabase-client-results-latest-rpc-2026-11-08.sql`. Owner: the 2A server lane
(bg-backend, plan section 2A item 3), not a frontend builder. Content, exactly:

```sql
-- client_results_latest: the snapshot rows every customer results page reads.
-- 2026-11-08, Phase 2 (docs/arch/phase2-results-layer-spec.md section 2).
--
-- Returns, for one client, a subset of real ai_results rows: per (prompt, engine)
-- the newest row, the newest usable row, the newest non-error row, the newest
-- error row and the start of the current error run, each flagged; plus the
-- engine level error-run start repeated on every row of that engine.
--
-- SECURITY INVOKER: ai_results RLS applies to the caller, so a viewer reads only
-- the clients RLS lets them read. No RLS policy is changed by this file.
--
-- ORDER, NOT NEGOTIABLE: apply this BEFORE the dashboard push that ships
-- src/lib/resultsContext.tsx. Without the function every results page shows its
-- load error card.
--
-- Run ONCE in the Supabase SQL Editor, project brandgeo-dashboard
-- (duiyifepitvugyulobqm). Safe to re-run (create or replace).
--
-- Read back afterwards:
--   select count(*) from public.client_results_latest(1);          -- about 589 on 2026-11-08
--   select count(*) from public.client_results_latest(1) where is_latest;  -- equals the cell count
--   select grantee, privilege_type from information_schema.routine_privileges
--   where routine_schema = 'public' and routine_name = 'client_results_latest';
--   -- EXPECT authenticated and service_role (plus the owner), never anon or PUBLIC.
--
-- Rollback (only after the dashboard no longer calls it):
--   drop function if exists public.client_results_latest(integer);

create or replace function public.client_results_latest(p_client_id integer)
returns table (
  id                    integer,
  prompt_id             integer,
  llm                   text,
  status                text,
  error_code            text,
  brand_mentioned       boolean,
  brand_position        integer,
  sentiment             text,
  response_snippet      text,
  competitors_mentioned text,
  checked_at            timestamp,
  model                 text,
  is_latest             boolean,
  is_usable             boolean,
  is_last_nonerror      boolean,
  is_newest_error       boolean,
  is_run_start          boolean,
  engine_error_since    timestamp
)
language sql
stable
security invoker
set search_path = public
as $$
  with o as (
    select a.id, a.prompt_id, a.llm, a.status, a.error_code, a.brand_mentioned,
           a.brand_position, a.sentiment, a.response_snippet, a.competitors_mentioned,
           a.checked_at, a.model,
           coalesce(a.status = 'error', false)                                 as is_err,
           coalesce(starts_with(a.response_snippet, '[no_ai_overview]'), false) as is_noans,
           row_number() over w_cell as rn_cell,
           row_number() over w_eng  as rn_eng
    from public.ai_results a
    where a.client_id = p_client_id
    window w_cell as (partition by a.prompt_id, a.llm order by a.checked_at desc nulls last, a.id desc),
           w_eng  as (partition by a.llm order by a.checked_at desc nulls last, a.id desc)
    -- nulls last added 2026-11-09 (server review F5): checked_at is nullable and Postgres
    -- sorts NULL first under DESC; the client treats a null as the oldest value.
  ),
  k as (
    select o.*,
           min(o.rn_cell) filter (where not o.is_err)                     over pc as k_nonerr,
           min(o.rn_cell) filter (where not o.is_err and not o.is_noans)  over pc as k_usable,
           min(o.rn_cell) filter (where o.is_err)                         over pc as k_err,
           count(*)                                                        over pc as n_cell,
           min(o.rn_eng)  filter (where not o.is_err)                     over pe as k_eng_nonerr,
           count(*)                                                        over pe as n_eng
    from o
    window pc as (partition by o.prompt_id, o.llm),
           pe as (partition by o.llm)
  ),
  s as (
    select k.*,
           min(k.checked_at) filter (where k.rn_eng < coalesce(k.k_eng_nonerr, k.n_eng + 1))
             over (partition by k.llm) as eng_since
    from k
  )
  select s.id, s.prompt_id, s.llm, s.status, s.error_code, s.brand_mentioned,
         s.brand_position, s.sentiment, s.response_snippet, s.competitors_mentioned,
         s.checked_at, s.model,
         (s.rn_cell = 1)                                       as is_latest,
         (s.rn_cell is not distinct from s.k_usable)           as is_usable,
         (s.rn_cell is not distinct from s.k_nonerr)           as is_last_nonerror,
         (s.rn_cell is not distinct from s.k_err)              as is_newest_error,
         (s.rn_cell = coalesce(s.k_nonerr, s.n_cell + 1) - 1)  as is_run_start,
         s.eng_since                                           as engine_error_since
  from s
  where s.rn_cell = 1
     or s.rn_cell = s.k_usable
     or s.rn_cell = s.k_nonerr
     or s.rn_cell = s.k_err
     or s.rn_cell = coalesce(s.k_nonerr, s.n_cell + 1) - 1
  order by s.id desc
$$;

revoke execute on function public.client_results_latest(integer) from public, anon;
grant execute on function public.client_results_latest(integer) to authenticated, service_role;
```

Notes binding on reviewers:

- `checked_at` and `engine_error_since` are `timestamp` (without time zone), the column's own
  type, so PostgREST serialises them in the same string form as a plain select and the
  existing string comparisons (`fixItems.ts:59-60`, `promptPerformance.ts:113-117`) keep
  working on a mix of RPC and history rows.
- `is_run_start` is true only when the newest row is an error: when `k_nonerr = 1` the target
  is 0 and matches nothing.
- When an engine's newest row is not an error, `engine_error_since` is null, as
  `errorRun` returns `since: null` (`promptPerformance.ts:128`).

### 2.3 Wire type (TypeScript, the spec of what the browser receives)

```ts
// src/lib/metrics.ts
import type { AIResult } from '../types'

/** One row of public.client_results_latest. Extends AIResult so buildFixResultMap,
 *  buildCellViews, measureFix and evaluateFix accept it with no cast. */
export interface ResultRow extends AIResult {
  status: 'ok' | 'error'
  error_code: string | null
  competitors_mentioned: string | null
  model: string | null
  is_latest: boolean
  is_usable: boolean
  is_last_nonerror: boolean
  is_newest_error: boolean
  is_run_start: boolean
  engine_error_since: string | null
}
```

Error shape: the supabase-js `{ data: null, error: PostgrestError }`, surfaced by
`readAllById` as `{ rows, truncated: false, error }` (`keysetRead.ts:32-52`). Empty: `[]`
(a client with no rows). A missing function answers PGRST202; the provider treats it as a
load error like any other.

### 2.4 Acceptance

2.1 The migration file holds exactly the SQL of 2.2.
2.2 Read back after applying: `information_schema.routine_privileges` lists `authenticated`
and `service_role` and neither `anon` nor `PUBLIC`; `security_type` is `INVOKER`.
2.3 As a viewer of client 54 (`begin; set local role authenticated; set local request.jwt.claims ...; ... rollback;`), `select count(*) from public.client_results_latest(1)` returns 0.
2.4 For clients 1 and 54, the set of `(id, is_latest, is_usable, is_last_nonerror, is_newest_error, is_run_start, engine_error_since)` from the RPC equals `metrics.deriveLatestRows` (section 4) applied to a full `readAllById` export of the same client (bg-verify, with the service key on Constantin's machine; no agent holds it).
2.5 `EXPLAIN ANALYZE` as a viewer of client 1 stays under 700 ms (section 6.4).

---

## 3. ResultsProvider

### 3.1 Files

- `src/lib/resultsLoader.ts`: the pure load controller (no React), so sequencing, the stale
  guard and coalescing are testable in node.
- `src/lib/resultsContext.tsx`: the React provider and hook over it.

### 3.2 Types and API

```ts
// src/lib/resultsLoader.ts
import type { Prompt } from '../types'
import type { ResultRow } from './metrics'

export const RESULTS_MAX_AGE_MS = 60_000

export interface ResultsSnapshot {
  /** `${userId}:${clientId}`. A snapshot is never shown under another key. */
  key: string
  clientId: number
  /** Every RPC row, in the order readAllById returned them (id desc). */
  rows: ResultRow[]
  /** Every prompt of the client, active and inactive, ordered position then id. */
  prompts: Prompt[]
  /** prompts.filter(p => p.is_active), same order. */
  activePrompts: Prompt[]
  /** Date.now() when committed. */
  loadedAt: number
  /** +1 on every commit, across clients. Pages key memo and effects on it. */
  version: number
  /** readAllById hit its ceiling (50,000 rows). Logged, not shown. */
  truncated: boolean
}

export type ResultsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ResultsState {
  snapshot: ResultsSnapshot | null
  status: ResultsStatus
  /** The newest load failed. snapshot may still hold the last good one for the SAME key. */
  loadError: boolean
}

export interface SnapshotFetch {
  (clientId: number): Promise<{ rows: ResultRow[]; prompts: Prompt[]; truncated: boolean; error: unknown }>
}

export interface ResultsLoader {
  getState(): ResultsState
  subscribe(listener: (s: ResultsState) => void): () => void
  /** Start a load for key/clientId. quiet keeps the current snapshot on screen. */
  request(key: string, clientId: number, opts?: { quiet?: boolean; promptsOnly?: boolean }): Promise<boolean>
  /** Drop everything (sign out, user change). */
  clear(): void
}

export function createResultsLoader(fetchSnapshot: SnapshotFetch,
  fetchPrompts: (clientId: number) => Promise<{ prompts: Prompt[]; error: unknown }>,
  now?: () => number): ResultsLoader
```

```ts
// src/lib/resultsContext.tsx
export interface ResultsContextValue extends ResultsState {
  /** Reload for the active client. Resolves true when a load committed without error. */
  reload(opts?: { quiet?: boolean }): Promise<boolean>
}
export function ResultsProvider({ children }: { children: React.ReactNode }): JSX.Element
/** Registers interest while mounted; returns the shared state. */
export function useResults(): ResultsContextValue
```

### 3.3 Behaviour (binding)

1. **Fetch.** `fetchSnapshot(cid)` runs, in one `Promise.all`:
   `readAllById<ResultRow>(() => supabase.rpc('client_results_latest', { p_client_id: cid }))`
   and `supabase.from('prompts').select('*').eq('client_id', cid).order('position').order('id')`.
   Error if either fails. `fetchPrompts` is the second read alone.
2. **Interest gating.** The provider loads nothing until at least one `useResults()` consumer
   is mounted (a ref counter incremented in the hook's mount effect, decremented on unmount).
   So `/login`, `/prompts`, admin and affiliate routes never call the RPC.
3. **Client readiness.** Outside demo mode, a load starts only when `useClient().activeClient`
   is non-null and `activeClient.id === activeClientId`, and not while `useClient().loading`
   is true before it first settled (same rule as `OnboardGate`, `App.tsx:217-226`).
4. **Key.** `key = ${session.user.id}:${activeClientId}`, the user id from
   `supabase.auth.getSession()`. The provider subscribes to `supabase.auth.onAuthStateChange`
   and calls `clear()` on `SIGNED_OUT` and whenever the session user id changes. A snapshot
   whose key differs from the current key is never exposed: `useResults().snapshot` is `null`
   then.
5. **Client change.** When the key changes, the snapshot is dropped immediately (status
   `loading`, snapshot `null`) and a non-quiet load starts. Another client's numbers are never
   on screen, even for one frame.
6. **Consumer mount (revalidate).** When a consumer mounts and a snapshot exists for the
   current key: if `now - loadedAt >= RESULTS_MAX_AGE_MS` or the provider was marked dirty,
   start a quiet full load; otherwise start a quiet `promptsOnly` load (prompts edited on
   `/prompts` show up on the next results page). With no snapshot, a non-quiet full load.
7. **Landed collections.** The provider calls
   `useCollectionLanded(lastCompletedAt, () => ...)` once. With interest > 0 it starts a quiet
   full load; with interest 0 it only marks the provider dirty. It adds no throttle of its
   own: `collectionContext.tsx:113` already limits mid-run bumps to one per 25 s and the
   final bump must never be dropped (`useCollectionLanded.ts:7-12`).
8. **Coalescing.** At most one fetch in flight per key. A request arriving while one is in
   flight for the same key sets a `rerun` flag; when the in-flight load settles, exactly one
   more full quiet load runs. A `promptsOnly` request while a full load is in flight is
   dropped (the full load reads prompts).
9. **Stale-response guard.** Every request takes `seq = ++seqRef`. A response commits only if
   `seq === seqRef` at settle time and its key equals the current key. Otherwise it is
   dropped silently.
10. **Errors.** A failed non-quiet load: `status 'error'`, `snapshot null`, `loadError true`.
    A failed quiet load: snapshot kept, `status 'ready'`, `loadError true`. A later success
    clears `loadError`.
11. **Commit.** `rows` kept in `readAllById` order; `prompts` as read; `activePrompts`
    filtered; `version` incremented; `status 'ready'`. `truncated` logs one `console.warn`.
12. **Demo mode** (`isDemoMode`, `supabase.ts:15`): never calls `supabase`. On the first
    interest it loads `./mockData` with a dynamic `import()` (keeps mock data out of the main
    chunk), builds `rows = deriveLatestRows(mockAIResults)` and `prompts = mockPrompts`, key
    `demo:${activeClientId}`, and commits `ready`.
13. **Mount point.** `App.tsx`, directly inside `<CollectionProvider>` and around
    `<TimeFilterProvider>` (today `App.tsx:265-266`):
    `<CollectionProvider><ResultsProvider><TimeFilterProvider> ... </TimeFilterProvider></ResultsProvider></CollectionProvider>`.
    It needs `useClient` (ClientProvider is above, `App.tsx:263`) and `useCollection`.

### 3.4 How pages consume it (the only allowed pattern)

```ts
const { snapshot, status, loadError, reload } = useResults()
const showSkeleton  = snapshot === null && status !== 'error'
const showFullError = snapshot === null && status === 'error'      // <LoadErrorCard onRetry={() => reload()} />
const showStaleNote = snapshot !== null && loadError                // <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />
```

Pages delete their own `ai_results` snapshot reads and their own `useCollectionLanded` for
them. A page keeps `useCollectionLanded` only for its page-local history read (section 5).

### 3.5 Acceptance

3.1 `tests/results_loader.test.js`: a response for an old seq is dropped; a response for a
previous key is dropped; three requests during one flight cause exactly two fetches; a
quiet failure keeps the snapshot and sets `loadError`; a non-quiet failure clears it;
`clear()` empties state; `promptsOnly` replaces prompts and keeps rows and `version + 1`.
3.2 With no consumer mounted, no `rpc` call is made (test with a counting fake).
3.3 Navigating Overview, AI Visibility, Sentiment within 60 s makes one RPC call and three
prompts reads (bg-verify, network panel).
3.4 Switching client never renders the previous client's numbers (bg-verify, admin switch).
3.5 Demo mode makes zero network requests to Supabase on the six pages.

---

## 4. `src/lib/metrics.ts`

Pure: no React, no `supabase.ts` (it uses `import.meta.env`, `supabase.ts:3-4`, which node
cannot load), no browser globals. Imports only `import type` from `../types` and relative
`./aiVisibilityScore`, `./competitorFilter`, `./fixItems`, so node tests load it through
`tests/helpers/ts_require.js` as `fix_items.test.js` does.

```ts
import type { AIResult, LLMName, Prompt } from '../types'
import { computeAiVisibilityScore, isNoAnswerRow, type AiVisibilityDimensions } from './aiVisibilityScore'
import { aggregateCompetitors, type CompetitorAggregate } from './competitorFilter'
import { buildFixResultMap, type FixResultMap } from './fixItems'

export interface ResultRow extends AIResult { /* section 2.3 */ }

/** checked_at desc (string compare, as fixItems.ts:59-60), then id desc. */
export function compareNewestFirst(a: { checked_at: string; id: number }, b: { checked_at: string; id: number }): number

/** Reference implementation of client_results_latest over a client's full history.
 *  Used by demo mode and by the parity tests. Output order: id desc. */
export function deriveLatestRows(rows: AIResult[]): ResultRow[]

export interface Population {
  promptIds: number[]          // active prompts, provider order
  engineIds: string[]          // active engines, activeEngines order
  cells: AIResult[]            // usable cell per (promptId, engineId) that has one, prompt-major
}

export interface SnapshotView {
  results: FixResultMap        // buildFixResultMap(rows sorted compareNewestFirst, activeEngines)
  errorEngines: Set<LLMName>
  partialErrorEngines: Set<LLMName>
  latestChecked: string | null
  population: Population
}
export function buildSnapshotView(rows: ResultRow[], activePromptIds: number[], activeEngines: readonly string[]): SnapshotView

export interface RateStat { checked: number; mentioned: number; pct: number | null }
export function mentionRate(p: Population): RateStat                                    // M1
export function averagePosition(cells: ReadonlyArray<{ brand_mentioned: boolean; brand_position: number | null }>): number | null  // M2
export function bestPosition(cells: ReadonlyArray<{ brand_mentioned: boolean; brand_position: number | null }>): number | null     // M2b

export interface SentimentSummary {
  total: number; positive: number; neutral: number; negative: number; other: number
  score: number | null
  pct: { positive: number; neutral: number; negative: number }
}
export function sentimentSummary(cells: ReadonlyArray<AIResult>): SentimentSummary      // M3, M3b; pass P_m or P (it filters brand_mentioned)
export function sentimentByEngine(p: Population): Record<string, SentimentSummary>      // engines with >= 1 mentioned cell

export type EngineBand = 'KNOW' | 'PARTIAL' | 'MISSING' | 'UNAVAILABLE' | 'NOT_MEASURED'
export interface EngineRate {
  engine: string; checked: number; mentioned: number
  rate: number | null; pct: number | null
  avgPosition: number | null; bestPosition: number | null
  band: EngineBand
}
export function engineRates(p: Population, errorEngines: ReadonlySet<string>): EngineRate[]   // M5, M5b; one per p.engineIds, in order

export interface EngineCoverage { active: string[]; heardFrom: string[]; withMention: string[]; reachPct: number | null }
export function engineCoverage(p: Population): EngineCoverage                           // M4

export function competitorStats(p: Population, limit: number): CompetitorAggregate[]    // M6 = aggregateCompetitors(p.cells, limit)
export interface EngineShareRow { engine: string; brandPct: number; competitorPct: Record<string, number> }
export function competitorEngineShare(p: Population, competitors: CompetitorAggregate[]): EngineShareRow[]  // M6b

export interface CategoryRate { category: string; checked: number; mentioned: number; rate: number }
export function categoryRates(p: Population, prompts: ReadonlyArray<Prompt>): CategoryRate[]   // M7

export function visibilityScore(p: Population, results: FixResultMap): { dimensions: AiVisibilityDimensions; aiScore: number }  // M8
export function hasAnyMeasurement(rows: ReadonlyArray<ResultRow>): boolean               // M9

/** Rows for engine-level views: active engines, ALL prompts (as AIVisibility.tsx:555 today). */
export function engineLevelRows(rows: ReadonlyArray<ResultRow>, activeEngines: readonly string[]): ResultRow[]
/** Rows for buildCellViews: active engines AND active prompts. */
export function cellViewRows(rows: ReadonlyArray<ResultRow>, activePromptIds: readonly number[], activeEngines: readonly string[]): ResultRow[]

export interface EngineHealth { lastAttemptAt: string | null; lastAttemptFailed: boolean; lastErrorCode: string | null; lastOkAt: string | null }
/** Same output as the walk at AIVisibility.tsx:533-554 over full history. */
export function engineHealth(rows: ReadonlyArray<ResultRow>, activeEngines: readonly string[]): Map<string, EngineHealth>
/** engine -> engine_error_since. Replaces promptPerformance.engineErrorSince for snapshot rows. */
export function engineErrorSinceByEngine(rows: ReadonlyArray<ResultRow>): Record<string, string | null>
/** Same output as AIVisibility.tsx:877-883 over full history (is_newest_error rows). */
export function newestErrorAtByEngine(rows: ReadonlyArray<ResultRow>, activeEngines: readonly string[]): Record<string, string>
/** Active engines with no non-error row at all; count = cells whose newest attempt is an error. */
export function engineErrorCells(rows: ReadonlyArray<ResultRow>, activeEngines: readonly string[]): { engine: string; count: number }[]

/** '#2.4', or null. One decimal everywhere a position average is printed. */
export function formatAvgPosition(n: number | null): string | null
```

Rules:

- `buildSnapshotView` must sort with `compareNewestFirst` before `buildFixResultMap`, which
  reproduces the input order AI Visibility uses today (`AIVisibility.tsx:507-508`).
- `promptPerformance.engineErrorSince` must never be called with snapshot rows: on a subset
  it returns a later date than the truth. Use `engineErrorSinceByEngine`.
- `engineHealth`: `lastAttempt*` from the `is_latest` row that sorts first under
  `compareNewestFirst`; `lastOkAt` from the newest `is_last_nonerror` row.
- `engineErrorCells` keeps the payload shape `{ engine, count }` that Recommendations sends as
  `engines_with_errors` (`Recommendations.tsx:820`); `count` now means failed prompt checks,
  not failed calls (Builder B updates the copy at `Recommendations.tsx:966`).
- No function returns `NaN`; every empty population returns the "empty result" of 1.2.

### 4.1 Acceptance (`tests/metrics.test.js`, fixture `tests/fixtures/results-fixture.js`)

4.1 Fixture (fictional brands only) covers: a cell whose newest row is an error after an ok
row; an error run of three rows; a cell with only errors; a cell whose newest row is a
no-answer row above an ok row; a no-answer row above an error above an ok row; two rows with
equal `checked_at`; an inactive prompt with rows; a row for an engine not active; a
mentioned row without position; sentiments positive, neutral, negative.
4.2 `deriveLatestRows(full)` flags are as hand-listed in the test for every fixture cell.
4.3 Parity on the fixture, each with deep equality: `buildFixResultMap(full)` vs
`buildSnapshotView(deriveLatestRows(full)).results` plus `errorEngines`,
`partialErrorEngines`, `latestChecked`; `buildCellViews(full filtered to active prompts and engines)` vs
`buildCellViews(cellViewRows(derived))`; `engineErrorSince(full)` vs
`engineErrorSinceByEngine(derived)`; the AIVisibility.tsx:533-554 walk reimplemented in the
test vs `engineHealth(derived)`; `measureFix` and `evaluateFix` on both maps.
4.4 Every M1 to M9 value on the fixture equals a hand-computed literal in the test.
4.5 `mentionRate(p).pct === visibilityScore(p, results).dimensions.recognition`.

---

## 5. History reads for trends and feeds

### 5.1 Helper

```ts
// src/lib/historyRead.ts
import type { SupabaseClient } from '@supabase/supabase-js'
export interface HistoryQuery {
  clientId: number
  /** getStartDate()?.toISOString() ?? null (timeFilterContext.tsx:22-27); null = all time. */
  sinceIso: string | null
  /** Must include id and checked_at. */
  columns: string
  mentionedOnly?: boolean
}
export interface HistoryResult<Row> { rows: Row[]; truncated: boolean; error: unknown }
export function readResultHistory<Row extends { id: number; checked_at: string }>(
  sb: Pick<SupabaseClient, 'from'>, q: HistoryQuery): Promise<HistoryResult<Row>>
```

It calls `readAllById` (no 1,000 cap) with a builder that applies
`.select(columns).eq('client_id', clientId).neq('status', 'error')`, then
`.eq('brand_mentioned', true)` when `mentionedOnly`, then `.gte('checked_at', sinceIso)` when
set; it returns rows sorted with `compareNewestFirst`. Engine filtering and no-answer
dropping happen in the view modules, not in the query.

### 5.2 Which pages read history

| Page | Window | Columns | Used for |
|---|---|---|---|
| Overview | time filter | `id, prompt_id, llm, brand_mentioned, brand_position, checked_at, response_snippet` | M10 Checks, KPI sparklines (`Dashboard.tsx:131-159`, unchanged formula), recent mentioned and not mentioned lists (5 each) |
| Brand Sentiment | time filter, `mentionedOnly` | `id, prompt_id, llm, sentiment, brand_position, response_snippet, checked_at` | trend chart (`BrandSentiment.tsx:95-126`, unchanged formula), the "Recent Sentiment Signals" feed and its chip counts |
| Competitors | time filter | `id, prompt_id, llm, brand_mentioned, competitors_mentioned, checked_at` | trend chart (`Competitors.tsx:104-140`, unchanged formula) |
| Mentions | all time (no time filter on this route), `mentionedOnly` | `id, prompt_id, llm, brand_position, sentiment, response_snippet, checked_at` | the mention feed and its engine chips |
| AI Visibility | none | | |
| Recommendations | none | | |

Prompt text and category for history rows come from `snapshot.prompts` (all prompts, so a
feed row of an inactive prompt keeps its text). The embedded `prompts(...)` selects at
`Dashboard.tsx:251`, `Mentions.tsx:121`, `BrandSentiment.tsx:223` are removed.

History rows in every view are filtered to active engines and have no-answer rows dropped
(1.1). This is a stated change for Overview, whose windowed read today keeps every engine
(`Dashboard.tsx:374`) and whose sparklines keep no-answer rows (`Dashboard.tsx:393`), and for
Mentions, whose feed keeps every engine (`Mentions.tsx:166`).

The one other page-local `ai_results` read, AI Visibility's monthly cost sum
(`AIVisibility.tsx:713-716`), becomes `readAllById` over
`select('id, cost_eur').eq('client_id', cid).gte('checked_at', monthStart)`. It keeps error
rows on purpose: error rows are metered.

### 5.3 Acceptance

5.1 `tests/history_read.test.js` with a recording fake: filters applied in the order above;
`neq('status','error')` always; `gte` only when `sinceIso` is set; pages past 1,000 rows
through `lt('id', ...)`.
5.2 A grep for `from('ai_results')` in `Dashboard.tsx`, `Mentions.tsx`,
`BrandSentiment.tsx`, `Competitors.tsx`, `Recommendations.tsx` returns 0 hits; in
`AIVisibility.tsx` exactly 1, inside a `readAllById` call (the cost sum).
5.3 Each history consumer reloads its history on `useCollectionLanded` and on a time window
change, quietly when the client is unchanged, with its own sequence guard (as
`Dashboard.tsx:212-215`, `:280-281`).

---

## 6. Waterfalls and performance

### 6.1 Sequential chains today and their target

| Chain | Today | Target |
|---|---|---|
| Overview recs | `Dashboard.tsx:344-350` runs, then `:355-361` items | one read: `supabase.from('recommendation_runs').select('id, generated_at, recommendations(id, title, priority, status, position)').eq('client_id', cid).order('generated_at', { ascending: false }).limit(1)`; filter `status !== 'dismissed'`, sort by `position`, take 2, client side. FK `recommendations_run_id_fkey` exists **[live]**. |
| Overview main | `Dashboard.tsx:258-278` already one `Promise.all` | snapshot from the provider; history alone |
| AI Visibility load | `AIVisibility.tsx:502-505` `Promise.all` | removed (provider) |
| AI Visibility fix states | `AIVisibility.tsx:592-601` `fix_states` (with its 42703 step-down loop), then `:625-633` `client_api_keys`, then `:638-646` `oauth_grants` | one `Promise.all`: the `fix_states` read with its step-down loop unchanged; `client_api_keys.select('id, label').eq('client_id', cid)`; `oauth_grants.select('id, client_name').eq('client_id', cid)`. Both side tables are readable by `client_id` (`db/supabase-mcp-oauth-2026-11-06.sql:135-140` for grants; keys as today). The two side reads run unconditionally; they are tiny. |
| AI Visibility allowance | `AIVisibility.tsx:706-717` `Promise.all` | unchanged shape, cost read paged (5.2) |
| Recommendations | `Recommendations.tsx:716-731` `Promise.all`, then `:769` `loadHistory`, itself `:680-688` runs then `:690-698` items | snapshot from the provider; one embedded read `recommendation_runs.select('id, generated_at, model, rec_count, recommendations(id, run_id, position, title, insight, action, engines, priority, status, actioned_at, notes)').eq('client_id', cid).order('generated_at', { ascending: false }).limit(20)`, flattened and sorted by `position`. The re-reads after a generate (`:857`) and a status write (`:885`) call the same single read. |
| Competitors | `Competitors.tsx:320-331` `Promise.all` | `Promise.all([history, manual competitors])` |
| Provider | | `Promise.all([rpc, prompts])` |

### 6.2 Request count per route (client 1, cold, after Phase 2)

| Route | Requests | Sequential depth |
|---|---|---|
| Overview | RPC 1, prompts 1, history 1 (7d window), recs 1 = 4 | 1 |
| AI Visibility | RPC 1, prompts 1, fix trio 3, collection_runs 1, cost 1 = 7 | 1 (today: 10 requests, depth 4: four keyset pages, then the fix chain of 3) |
| Brand Sentiment | RPC 1, prompts 1, history 1 = 3 | 1 |
| Competitors | RPC 1, prompts 1, history 1, manual 1 = 4 | 1 |
| Mentions | RPC 1, prompts 1, history 2 pages (1,928 mention rows) = 4 | 2 |
| Recommendations | RPC 1, prompts 1, history 1 = 3 (today 4 plus 2, depth 3) | 1 |

Warm navigation inside 60 s: 0 RPC calls, 1 prompts read, plus the page-local reads.

### 6.3 Budgets

| Budget | Number | Evidence or how measured |
|---|---|---|
| New dependencies | 0 | rule 2 |
| Main chunk delta | at most +1.5 KB gzip (`resultsContext.tsx`, `resultsLoader.ts`, `keysetRead.ts` move into it) | current size unknown in this pass; bg-verify compares `npm run build` output before and after on Constantin's machine |
| Total JS delta | at most +6 KB gzip | same |
| Snapshot payload, client 1 | at most 450 kB JSON | measured 293 kB for the data columns of 589 rows **[live]**; today 10,199 kB on AI Visibility |
| RPC server time, client 1, viewer RLS | at most 700 ms | measured 507.6 ms **[live]** |
| Supabase sequential depth on any results page | at most 2 | table 6.2 |
| First meaningful paint, warm navigation | snapshot numbers render with 0 `ai_results` round trips | bg-verify in a real browser; no browser was run for this spec |
| First meaningful paint, cold | one RPC round trip with prompts in parallel | bg-verify; not measured here |

### 6.4 Acceptance

6.1 No `await` on a Supabase read is followed by another independent Supabase read in the
six pages (review of the diff).
6.2 Request counts and depths of 6.2 hold in the network panel (bg-verify).
6.3 Budgets of 6.3 hold, or bg-verify reports the miss as a finding.

---

## 7. Time filter honesty

After Phase 2 the filter changes a number on exactly these routes:

| Route | What it changes |
|---|---|
| `/` | Checks (M10), KPI sparklines, recent activity lists |
| `/sentiment` | trend chart, signals feed and its chip counts |
| `/competitors` | trend chart |
| `/usage` | Revenue page (admin), unchanged |

Builder A changes `Layout.tsx:416` to
`const TIME_FILTER_ROUTES = ['/', '/sentiment', '/competitors', '/usage']`, updates the
comment at `Layout.tsx:408-415` to say why, and renders a visible label before the pills
(`Layout.tsx:1094-1106`):

```ts
const TIME_FILTER_LABEL: Record<string, string> = {
  '/': 'Trends and activity',
  '/sentiment': 'Trends and signals',
  '/competitors': 'Trend',
  '/usage': 'Period',
}
```

The label is a `<span id="time-filter-label">` with `text-xs text-slate-400`, and the pill
row gets `role="group"` and `aria-labelledby="time-filter-label"`. Snapshot numbers never
read the filter. Dashboard's "No checks in the last N days" line (`Dashboard.tsx:633-643`)
stays and now sits only under the Checks tile.

Acceptance: 7.1 the bar renders on the four routes and nowhere else; 7.2 changing the window
on `/competitors` changes only the trend chart; 7.3 on `/` the score, Mention rate, Avg
position and the engine chart do not change with the window (bg-verify).

---

## 8. CSV export

### 8.1 `src/lib/csv.ts`

```ts
export type CsvCell = string | number | null | undefined
/** null/undefined -> ''. number -> String(n). A string starting with = + - @ TAB or CR gets a leading
 *  single quote. Then, if the value contains " , CR or LF, it is wrapped in double quotes with
 *  every " doubled (RFC 4180). */
export function csvEscapeCell(v: CsvCell): string
/** '﻿' + header line + one line per row, every line ending in CRLF. */
export function toCsv(header: readonly string[], rows: ReadonlyArray<ReadonlyArray<CsvCell>>): string
/** brandgeo-<kind>-<slug>-<YYYY-MM-DD>.csv; slug lowercased, runs of [^a-z0-9] -> '-', trimmed,
 *  at most 40 chars, fallback `client-<id>`; date from date.toISOString().slice(0, 10). */
export function csvFilename(kind: 'ai-visibility' | 'competitors', clientSlug: string | null | undefined, clientId: number, date: Date): string
/** Browser only: Blob type 'text/csv;charset=utf-8', object URL, temporary <a download>, revoke. */
export function downloadCsv(filename: string, csv: string): void
```

Numbers are never guarded (a negative number is data); only strings are. `downloadCsv` is the
only function that touches `document`; the rest are node-testable.

### 8.2 AI Visibility results table

One row per (visible prompt, active engine): prompts in the rendered order and honouring the
category filter (`AIVisibility.tsx:892-903`, collapsed sections included), engines in
`activeEngines` order. Locked engines are not exported. Header, exactly:

`Prompt ID, Prompt, Category, Engine, Result, Brand mentioned, Position, Sentiment, Competitors named, Checked at, Last answer at, Not answering since`

| Column | Value |
|---|---|
| Result | `CellView.state`: `mentioned` -> `Mentioned`, `absent` -> `Not mentioned`, `no_answer` -> `No answer`, `error` -> `Error`, `pending` -> `Not checked` |
| Brand mentioned | `yes` / `no` for mentioned and absent, else empty |
| Position | `CellView.position` when mentioned, else empty |
| Sentiment | `current.sentiment` when mentioned, else empty |
| Competitors named | for mentioned and absent: `parseRankedCompetitors(current.competitors_mentioned)` filtered by `isLikelyCompanyName`, `toDisplayName`, joined with `; ` |
| Checked at | `current.checked_at` as stored, empty when pending |
| Last answer at | `checked_at` of the cell's usable row in `results`, else empty |
| Not answering since | `errorSince` for an error cell, else empty |
| Engine | `ENGINE_META[e].label` |

Builder A builds the rows in `src/lib/views/aiVisibilityView.ts`
(`buildAiVisibilityCsv`). Button: in the prompt list toolbar beside the sort control, a
ghost button with the lucide `Download` icon and visible text `Export CSV`,
`aria-label="Export AI Visibility results as CSV"`, `type="button"`, minimum 44 px target;
when no prompt is visible it is `disabled` with `title="Nothing to export yet"`. Filename
`csvFilename('ai-visibility', activeClient?.slug, activeClientId, new Date())`.

### 8.3 Competitors table

Rows: the brand first, then `competitorStats(P, 100)` in its order (the on-screen table is the
first 5 of the same list; the export carries up to 100). Header, exactly:

`Name, Is you, AI mentions, Ranked mentions, Avg position, Engines, Sample prompt`

| Column | Brand row | Competitor row |
|---|---|---|
| Name | brand name | `c.name` |
| Is you | `yes` | `no` |
| AI mentions | `n(P_m)` | `c.totalMentions` |
| Ranked mentions | cells of P_m with a position | `c.rankedMentions` |
| Avg position | M2 over P_m, empty when null | `c.avgPos`, empty when null |
| Engines | labels of active engines with a mention, `; ` joined | labels of engines in `c.byEngine` that are active, `; ` joined |
| Sample prompt | empty | full text of the first active prompt in `c.promptIds`, empty if none |

Manually tracked competitors are not exported. Builder B builds the rows in
`src/lib/views/competitorsView.ts` (`buildCompetitorsCsv`). Button: right aligned above the
table (`Competitors.tsx:589`), same styling, text `Export CSV`,
`aria-label="Export competitors as CSV"`, disabled with the same title when P is empty.
Filename `csvFilename('competitors', ...)`.

### 8.4 Acceptance

8.1 `tests/csv.test.js`: `=SUM(A1)` -> `'=SUM(A1)`; `+1`, `-1`, `@x`, `\tx`, `\rx` guarded;
`-1` as number unguarded; `a,b` -> `"a,b"`; `say "hi"` -> `"say ""hi"""`; line break quoted;
output starts with `﻿` and every line ends `\r\n`; filename for slug `Bucate pe Roate!`
on 2026-11-08 is `brandgeo-ai-visibility-bucate-pe-roate-2026-11-08.csv` (a fictional slug in
the test is fine; use one).
8.2 `tests/views_a.test.js` and `tests/views_b.test.js` assert the exact header strings and one
row per state on the fixture.
8.3 The exported file opens in a spreadsheet with accents intact (bg-verify, manual).

---

## 9. Loading pattern

| Page | While `snapshot === null` and not error | Full error | Stale note |
|---|---|---|---|
| Overview | its existing skeleton (`Dashboard.tsx:414-468`) | `LoadErrorCard` under the title, as `Dashboard.tsx:470-477` | as `Dashboard.tsx:491` |
| AI Visibility | its existing skeleton (`AIVisibility.tsx:1139-1202`) | the existing prompt area retry (`AIVisibility.tsx:2473`) fed by `loadError` | same |
| Recommendations | `RecommendationsSkeleton` (`Recommendations.tsx:624`) | `LoadErrorCard` | `LoadErrorCard` stale message |
| Mentions | `<RouteSkeleton />` replaces `Mentions.tsx:171` | `LoadErrorCard` (Mentions has none today) | stale message |
| Brand Sentiment | `<RouteSkeleton />` replaces `BrandSentiment.tsx:264` | as `BrandSentiment.tsx:266-273` | as `:307` |
| Competitors | `<RouteSkeleton />` replaces `Competitors.tsx:407` | as `Competitors.tsx:409-416` | as `:458` |

A page-local history read does not hold the whole page: the trend card or feed shows a
`<Skeleton className="h-[220px] w-full rounded-lg" />` (`components/Skeleton.tsx`) until its
history arrives, and a failed history read shows a `LoadErrorCard` inside that card only.

Acceptance: 9.1 no `animate-pulse` loading text remains in the six pages (grep for
`text-sm animate-pulse` returns 0 in them); 9.2 a quiet reload never shows a skeleton.

---

## 10. Builder scopes (disjoint) and per-page instructions

### 10.1 Why the scopes differ slightly from the packet

The packet asks for a parity test that "the page's numbers equal metrics.ts on a fixture".
A page `.tsx` cannot be loaded in node: every page imports `../lib/supabase`, which uses
`import.meta.env` (`supabase.ts:3-4`), a syntax error in the CommonJS that the test loader
emits (`tests/helpers/ts_require.js`). So each builder also owns one pure view module per
page under `src/lib/views/`, and the page renders only what that module returns. These are
new files, one owner each, so disjointness holds. Builder A keeps `Layout.tsx`. The migration
file belongs to the 2A server lane.

### 10.2 Scopes

**Server lane (bg-backend, Opus, plan 2A item 3)**
- `db/supabase-client-results-latest-rpc-2026-11-08.sql` (new): section 2.2 verbatim.

**Foundation builder (bg-app, Sonnet), runs first**
- `src/lib/metrics.ts` (new): section 4.
- `src/lib/resultsLoader.ts` (new): section 3.2 and 3.3 controller.
- `src/lib/resultsContext.tsx` (new): provider and `useResults`.
- `src/lib/historyRead.ts` (new): section 5.1.
- `src/lib/csv.ts` (new): section 8.1.
- `src/App.tsx` (modify): mount `ResultsProvider` (3.3 item 13). Nothing else in the file.
- `tests/fixtures/results-fixture.js` (new): fixture of 4.1, fictional names, exported rows,
  prompts and active engines. Read only for Builders A and B.
- `tests/metrics.test.js`, `tests/results_loader.test.js`, `tests/history_read.test.js`,
  `tests/csv.test.js` (new).

**Builder A (bg-app, Sonnet), after Foundation**
- `src/pages/Dashboard.tsx`, `src/pages/AIVisibility.tsx`, `src/pages/Mentions.tsx` (modify).
- `src/components/Layout.tsx` (modify): section 7 only.
- `src/lib/views/dashboardView.ts`, `src/lib/views/aiVisibilityView.ts`,
  `src/lib/views/mentionsView.ts` (new).
- `tests/views_a.test.js` (new).

**Builder B (bg-app, Sonnet), after Foundation, in parallel with A**
- `src/pages/BrandSentiment.tsx`, `src/pages/Competitors.tsx`, `src/pages/Recommendations.tsx` (modify).
- `src/lib/views/sentimentView.ts`, `src/lib/views/competitorsView.ts`,
  `src/lib/views/recommendationsView.ts` (new).
- `tests/views_b.test.js` (new).

**Disjointness proof.** The four lists share no path: the server lane is the only writer under
`db/`; Foundation is the only writer of `src/App.tsx` and of `src/lib/*.ts(x)` outside
`views/`; A and B write different named files under `src/lib/views/` and different page
files; the four test files of Foundation and the two of A and B have distinct names;
`Layout.tsx` belongs to A alone. No builder modifies a file in another's list, and nobody
touches the do-not-touch set (`unlock-audit-report.js`, `planConfig.ts` `PLAN_ORDER`,
`_plans.js`, `_cost.js` `PLAN_LIVE_ENGINES`, `stripe-webhook.js`, `accept-terms.js`,
`_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`, `supabase-schema.sql`,
`db/supabase-multitenant-migration.sql`, `brandgeo/web/`, `docs/growth/`) or the modules of
1.4 item 1.4. Gates for every builder: `node tests/<own files>.test.js` and
`npx tsc --noEmit`; no build, no git.

### 10.3 Per page

Each view module exports one `build<Page>View(input)` taking `{ snapshot rows, prompts or
activePrompts, activeEngines, history?, brandName? }` and returning plain data; the page holds
no row arithmetic. Each test compares every number the view returns with direct `metrics.ts`
calls on the shared fixture.

**Overview (`Dashboard.tsx`, A).**
- Remove: the windowed read `:249-256`; the score read `:269-277`; `computeStats` `:98-117`;
  `llmData` `:374-384`; the two-step recs read `:344-361`; the demo branch `:221-243`.
- Replace with: `useResults()`; `buildDashboardView` in `dashboardView.ts` returning `score`
  (M8, or null when there are no active prompts), `hasAnyMeasurement` (M9), `promptCount`
  (`activePrompts.length`), `mention` (M1), `avgPosition` (M2, shown with
  `formatAvgPosition`), `engineBars` (M5 `pct` for active engines with `checked > 0`, colour
  `ENGINE_META[e].chartColor`), and `window` (M10 checks, `buildKpiSparklines` moved into the
  view unchanged, recent mentioned and not mentioned lists of 5, prompt text from
  `snapshot.prompts`); history via `readResultHistory` (5.2); recs via the single embedded
  read (6.1). The Mention rate tile shows `null` when `mention.checked === 0`; the
  overall bar at `:736-746` uses `mention.pct`. The Checks tile's sub line reads
  `In the selected window`.
- Parity test: `mention`, `avgPosition`, `engineBars`, `score` equal `metrics` on the fixture;
  `window.checks` equals the fixture's history count after the active engine and no-answer
  filters.

**AI Visibility (`AIVisibility.tsx`, A).**
- Remove: the load body `:498-563` (reads, `buildFixResultMap` call, health walk, `rawRows`);
  the demo branch `:482-496`; `newestErrorAtByEngine` `:877-883`; the `engineErrorSince(rawRows)`
  call at `:876`; `llmStats` `:735-739`; `competitorFreq` `:768-779`; `totalChecked` and
  `gapCount` `:781-791`; the fix chain `:592-646` (rewritten as one `Promise.all`, 6.1); the
  unpaginated cost read `:713-716`.
- Replace with: `buildAiVisibilityData` in `aiVisibilityView.ts` returning `results`,
  `errorEngines`, `partialErrorEngines`, `latestChecked` (from `buildSnapshotView`),
  `engineHealth`, `errorSinceByEngine` (`engineErrorSinceByEngine`), `newestErrorAtByEngine`,
  `cellRows` (`cellViewRows`, fed to `buildCellViews`), `rates` (M5, replacing `llmStats`;
  `engineStatusCards` keeps its shape and reads `rates`), `score` (M8), `competitorFreq`
  (`competitorStats(P, 8)` mapped as today), `totalChecked = n(P)`, `gapCount = n(P) - n(P_m)`.
  `prompts` is `snapshot.activePrompts`. `resultsKey` (`:1040`) becomes
  `${snapshot.version}:${lastChecked ?? ''}`. `resultsClientId` becomes `snapshot.clientId`.
  Every former `load({ silent: true })` call (`:421`, `:428`, `:448`, `:465`, `:1096`) becomes
  `reload({ quiet: true })`; the Reload button calls `reload({ quiet: true })` and flashes
  "Refreshed!" when it resolves `true`. `buildFixItems` still receives `results` over all
  prompts (1.3). The `clearBlockReason` and refresh-flag resets of `:571-581` stay, keyed on
  the client and engines.
- Stated change: the headline (`promptPerformance.buildHeadline`) no longer counts inactive
  prompts, because `cellRows` is restricted to active prompts, which is what its own comment
  says it covers (`promptPerformance.ts:414-418`).
- CSV: section 8.2.
- Parity test: on the fixture, `buildCellViews(cellRows)` equals `buildCellViews` over the
  full rows filtered to active prompts and engines; `rates`, `score`, `competitorFreq`,
  `totalChecked`, `gapCount` equal `metrics`; the fix list from `buildFixItems` is identical
  when fed `results` from the snapshot and from the full rows.

**Mentions (`Mentions.tsx`, A).**
- Remove: the read `:119-124`, the summary arithmetic `:155-169`, the demo branch `:96-116`,
  the pulsing loading text `:171`.
- Replace with: `buildMentionsView` in `mentionsView.ts`: `summary` = `{ mentions: n(P_m),
  avgPosition: M2, positive: M3b positive }` (snapshot), `feed` (history, all time, mentioned
  only, active engines, prompt text and category from `snapshot.prompts`), `engineCounts`
  (counts over `feed`). A caption under the summary cards reads
  `Latest answer per prompt and engine. The list below is every mention on record.`
- Parity test: `summary` equals `metrics` on the fixture; `engineCounts` sums to `feed.length`.

**Brand Sentiment (`BrandSentiment.tsx`, B).**
- Remove: the read `:222-228`, `computeStats` use for the summary, `buildEngineSentimentData`
  input, the demo branch `:192-214` (the position-derived demo sentiment is dropped; demo shows
  the mock rows as they are), the pulsing text `:264`.
- Replace with: `buildSentimentView` in `sentimentView.ts`: `summary` (M3, M3b over P_m),
  `byEngine` (`sentimentByEngine`, rendered through the existing chart shape of
  `BrandSentiment.tsx:145-160`), `trend` (`computeTrend` moved into the view unchanged, over
  history), `feed` (history) and `feedCounts` (counts over `feed`, used by the chip labels at
  `:493`, so `All (N)` equals the list length). The header sentence (`:300-303`) uses
  `summary.total`.
- Parity test: `summary`, `byEngine` equal `metrics`; `feedCounts.all === feed.length`.

**Competitors (`Competitors.tsx`, B).**
- Remove: the `ai_results` and `prompts` reads `:326-329`, `computeData` `:65-98`,
  `buildEngineGroupData` input `:253-268`, the demo branch `:304-318`, the pulsing text `:407`.
- Replace with: `buildCompetitorsView` in `competitorsView.ts`: `topCompetitors`
  (`competitorStats(P, 5)`), `brandMentions = n(P_m)`, `brandAvgPos` (M2), `rates` (M5),
  `engineGroup` (M6b for the top 3, same row shape as today), `totalResponses = n(P)`,
  `promptText` map from `snapshot.activePrompts`, `trend` (`computeTrend` moved unchanged, over
  history, top 4 names from `topCompetitors`). Manual competitors stay a page-local read,
  in `Promise.all` with history. CSV: section 8.3.
- Parity test: every field equals `metrics` on the fixture.

**Recommendations (`Recommendations.tsx`, B).**
- Remove: the three reads `:716-731`, `loadHistory`'s two steps `:680-701`, `computeStats`
  `:259-320` (moved), the `okEngines` and `errCount` block `:755-762`.
- Replace with: `buildRecommendationsStats` in `recommendationsView.ts` returning the same
  shape `computeStats` returns today (`{ llmStats, catStats, competitors, avgBrandPos,
  totalChecks, totalMentioned, overallRate, brandName }`, with `LLMStat` and `CatStat` moved
  into the view module) computed from M5 (`rate` as fraction, engines with `checked > 0`),
  M7, `competitorStats(P, 6)`, M2, `n(P)`, `n(P_m)`, `n(P_m) / n(P)`; `engineErrors =
  engineErrorCells(rows, activeEngines)`; snippets for the AI payload (`:795-815`) from P
  sorted `compareNewestFirst`. `generateRecs` stays in the page, unchanged. History is the
  single embedded read of 6.1. The copy at `:966` says `failed prompt checks`.
- Parity test: the returned stats equal `metrics` on the fixture; `generateRecs` output on the
  fixture is the same for the view stats and for stats built from `metrics` directly.

### 10.4 Acceptance

10.1 Each builder's `git diff --name-only` (run by the orchestrator, not the builder) is a
subset of its list. 10.2 `npx tsc --noEmit` exits 0 after each lane. 10.3 every test file
named here passes with `node tests/<file>`. 10.4 every existing test under `tests/` still
passes (`fix_items`, `prompt_performance`, `no_answer_rows`, `keyset_read`, `mcp_server`,
`reach_parity`, `competitor_aggregate`).

---

## 11. Migration sequence and rollback

| Step | What | Who | Shippable alone | Rollback |
|---|---|---|---|---|
| V0 | bg-verify reads section 2 SQL before it is applied: invoker, grants, the viewer probe of 2.4 item 2.3 | bg-verify (Opus) | yes | none needed |
| 1 | Write the migration file (2.2) | server lane | yes, file only | delete the file |
| 2 | **HUMAN CHECKPOINT:** Constantin applies it in the SQL Editor and runs the read-backs. Additive function, no table or policy change, no data touched. | Constantin | yes: nothing calls it yet | `drop function if exists public.client_results_latest(integer);` only while no deployed bundle calls it |
| 3 | Foundation lane | bg-app | yes: the provider loads only with a consumer, and none exists yet | revert the commit |
| 4 | Builders A and B in parallel (concurrency 2) | bg-app x 2 | together only, see below | revert both commits |
| 5 | bg-verify on the combined diff, then one Netlify build with `BATCH_PUSH=1` on Constantin's go | | | revert the commits, one build |

**Window of inconsistency.** If A's pages and B's pages were deployed in separate builds, for
that interval Overview and AI Visibility would show snapshot numbers while Sentiment,
Competitors and Recommendations still showed truncated history numbers: two definitions on
screen at once. Steps 3 and 4 therefore ship in **one** Netlify build. The second ordering
constraint: a bundle containing step 3 or 4 deployed before step 2 shows the load error card
on every results page (PGRST202). Step 2 first, always.

Rollback of steps 3 to 5 is a code revert only; no data is written by any part of Phase 2
except the existing fix state writes, which are unchanged.

---

## 12. Out of scope, recorded

- `Revenue.tsx:923-960` sums `cost_eur` from an unpaginated select (admin, platform wide);
  the same 1,000 cap applies. One-line fix to use `sum_cost_eur`
  (`db/supabase-sum-cost-eur-rpc-2026-11-08.sql`), which today only `service_role` may execute,
  so it needs either a server call or a grant decision. Separate task, bg-backend.
- **RLS cost on `ai_results` reads.** Both SELECT policies evaluate functions per row; as a
  viewer, reading client 1's 3,829 rows costs about 0.46 s of policy work **[live]**, on the
  RPC and on every existing select alike. Rewriting the policies with the initPlan form
  (`(select public.is_admin())`, and a client list subquery) and dropping the duplicate
  `ai_results_select` policy is an RLS change: separate artifact
  `docs/arch/ai-results-rls-initplan.md` (not written), bg-verify before build.
- The `max_rows` value of this project is still unverified (`keysetRead.ts:4-8` assumes 1,000);
  if it were lower, `readAllById` would stop early and silently. Read it from the PostgREST
  config in the 2A pass.
- Phase 3: split `AIVisibility.tsx`; merge the two fix systems (including the 50/25 versus 60
  threshold split of 1.3 and `buildFixItems`' all-prompts population); light mode on tokens;
  i18n coverage (new strings in this phase are English literals, as most of the six pages
  already are).
- `collect-claude.js` and `collect-chatgpt.js` force gating and the stuck-job reaper (plan 2A
  items 1 and 2) are their own packet.

No open questions: every decision above follows from the code, the rulings, or a live
measurement cited in place.
