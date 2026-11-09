# Phase 2 plan: dashboard only

Status: PLAN 2026-11-08, rulings owed (section "Rulings owed"), nothing built. Written by
the dashboard master session; the claims below were checked against the code and the
production database the same day. Scope ruled by
Constantin the same day: dashboard only, following the optimization brief and the
blueprint (`docs/audit/system-uiux-blueprint-2026-11-08.md`, section 6). Phase 1 shipped
as `9560027` (blueprint quick wins 1 to 8, structural item 2, and most of item 6).

## What Phase 1 left open (from blueprint section 6)

| Blueprint item | State after Phase 1 |
|---|---|
| P1 every page re-reads `ai_results` its own way, no shared cache | open |
| P2 reload storm | closed (25 s throttle) |
| P3 1,000 row truncation | closed for Overview score and budget sums; Sentiment, Competitors, Recommendations still select unpaginated |
| P4 code splitting | closed |
| P5 sequential fetch waterfalls (Recommendations 3 steps, Dashboard recs 2, AI Visibility fix_states then keys then grants) | open |
| U1 the same metric means different things on different pages | open |
| U2 two "what to fix" systems | open, needs a product ruling |
| U3 controls that look global but are not | market half closed; time filter still shown on 3 routes, read by 2 |
| U4 failures read as "no data" | closed |
| U5 no export, uneven i18n and loading states | open |
| Structural 3: split `AIVisibility.tsx` (2,550 line function) | open, after the data layer |
| Structural 5: light mode on tokens, not 92 `!important` overrides | open |
| Structural 6: `collect-claude.js` and `collect-chatgpt.js` accept force and engines from viewers; no reaper for jobs stuck in `running` | open |

## Measured 2026-11-08: the truncation is live, not latent

Supabase returns at most 1,000 rows to a plain select. Client 1 already has 3,829
`ai_results` rows (2,775 non-error, 1,928 with a brand mention) and only 401 distinct
(prompt, engine) cells. So today, for that client:

- Brand Sentiment (`BrandSentiment.tsx:222`) and Mentions (`Mentions.tsx:120`) read the
  1,000 newest of 1,928 mention rows; older mentions are missing from counts and trends.
- Recommendations (`Recommendations.tsx:718`) reads the 1,000 newest of 2,775 ok rows.
- Competitors (`Competitors.tsx:326`) has no `order`, so it reads an arbitrary 1,000 of
  3,829 rows; the numbers can change between two loads with no new data.
- Dashboard's recent activity list (`Dashboard.tsx:250`) is a list, not a total; fine.
- Revenue (`Revenue.tsx:923`) sums `cost_eur` unpaginated, admin only; the same cap
  applies platform wide. Out of the customer scope, but a one-line fix to the
  `sum_cost_eur` RPC from Phase 1.

Client 54 has 660 rows and will cross the line within weeks. This moves the cap fix to the
front of Phase 2. A latest-per-cell read returns 401 rows instead of 3,829, so the fix also
cuts the transfer about ninefold.

Also confirmed: `collect-claude.js:35-55` takes `force` from the body with no admin check
(`collect-chatgpt.js` the same shape), unlike `collect-prompt.js` since `9560027`.

## Proposed Phase 2: one source of truth for results

Goal: every customer page reads the same rows, computed by the same definitions, once per
client, with no silent truncation and no waterfalls. This is the foundation the later
UI work (splitting AI Visibility, merging the fix systems, a redesign) depends on.

### 2A Server, small, ships first (bg-backend, Opus; bg-verify)

1. `collect-claude.js` and `collect-chatgpt.js`: same rule as `collect-prompt.js` now has:
   force only for admins (`force_ignored` otherwise), engine checked against
   `activeEnginesFor(plan, engines_enabled)`.
2. Reaper for `collection_jobs` stuck in `running` (pg_cron SQL, re-queue or fail after
   N minutes; the watchdog already alerts at 2 h).
3. One read RPC, `client_results_latest(p_client_id int)`, SECURITY INVOKER so RLS still
   applies to a viewer: the newest non-error row per (prompt, engine) for the client's
   active prompts, with exactly the columns the pages use. Replaces the browser keyset
   download of every row for the snapshot views. Migration before deploy.

### 2B Frontend data layer (bg-architect spec, then bg-app)

1. `src/lib/metrics.ts`: ONE definition each for mention rate, average position, sentiment
   score, and engine coverage, over a stated population. Existing exported signatures in
   `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts` stay as they
   are (bundled into `mcp-server.js`).
2. A per-client results cache shared by all pages (default: a small `ResultsProvider` in
   `src/lib`, no new dependency; alternative: TanStack Query). Loads the latest-rows RPC
   once per client and per landed collection; pages derive from it.
3. History for trends stays a separate windowed read, paginated (`readAllById`), used only by
   the trend charts on Sentiment, Competitors and Overview.
4. Remove the waterfalls (P5): run independent reads with `Promise.all`.
5. Migrate Overview, AI Visibility, Sentiment, Mentions, Competitors, Recommendations to the cache and
   the shared definitions, one page per builder pass, each with a parity test that the
   page's numbers equal the definitions on a fixture.
6. Time filter honesty (U3): shown only where it changes a number (trend charts), labelled
   as such.

### 2C Small UX completions (bg-app)

1. CSV export of the results table on AI Visibility and Competitors (U5).
2. One loading pattern: the skeleton from Phase 1 on every results page.

### Deferred to Phase 3 (each needs 2B first or a ruling)

- Split `AIVisibility.tsx` into sections with their own hooks.
- Merge AI recommendations and Fix This into one Actions model (product ruling).
- Light mode on semantic tokens.
- i18n coverage on the five pages.

## Rulings owed (defaults apply if silent)

1. Which population a snapshot metric uses. Default: newest non-error row per (prompt,
   engine), all time, as AI Visibility and the score already do. Trends use the time window.
2. Results cache: own `ResultsProvider` (default) or TanStack Query (one dependency).
3. Server RPC for latest rows (default yes) or keep the browser keyset read.
4. CSV export in Phase 2 (default yes) or later.

## Rulings made 2026-11-09 (Constantin, during the build)

1. Viewer prompt delete race (server re-review N2): **archive, not delete.** For viewers the
   Prompts page Delete becomes Archive (`is_active = false`); the `prompts_delete` RLS policy
   becomes admin only; admins keep hard delete. The RLS change is applied on his go.
2. Re-queued stuck jobs (server review F2): **the hourly `schedule-collections` run also
   starts the worker whenever pending jobs are due.** Code only, no new secret.

## Order and builds

2A (one migration, then one Netlify build) -> 2B spec -> 2B build page by page -> 2C ->
bg-verify on the whole -> one Netlify build. Concurrency at most 2 agents (RAM), no build
inside agents.
