VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 2 medium, 3 low, 5 info)

# Multi-location feature: regression review for existing clients (bg-verify, read only)

Date: 2026-11-13. Lens: an existing client with one location must notice nothing beyond the changes listed in spec section 6.7. Method: read of the working files against `docs/arch/multi-location-collection.md`, `docs/design/multi-location-ui-2026-11-13.md` and `docs/qa/multi-location-orchestrator-record-2026-11-13.md`. No git (so no diff: the pre-change code was not seen, only described by the spec), no build, no browser, no database. Three node test files run (section 2). The frontend review (`multi-location-review-frontend-2026-11-13.md`) and the server review (`multi-location-review-server-2026-11-13.md`) of the same day were read for overlap; their findings are not repeated as new ones here.

No finding blocks shipping. Collection for every census group behaves as section 6.7 says, apart from one wording error in the spec itself (R7).

## 1. Findings

### R1. MEDIUM. Demo mode never loads locations: the sidebar block shows a skeleton forever and the synthetic primary of spec 7.5 is never built (owner: bg-app)

- Where: `src/lib/locationsContext.tsx:135` (`clientReady` requires `activeClient` non-null with the active id) and `:173-176` (the only load path is behind `clientReady`); `src/lib/clientContext.tsx:137` and `:239` return early in demo mode, so `activeClient` stays `null` (initial state at `:88`, no other demo setter found by grep).
- Scenario: `vite --mode demo`, any route. `status` stays `'loading'` for the life of the session. `Layout.tsx:232-240` renders the "Locations" title and two skeleton bars with `aria-busy="true"` forever and no Edit button; `AIVisibility.tsx:1720` renders no location badge in the header (the old page showed the browser market chip); `Account.tsx:188` shows its loading rows forever. No error and no network call from the new code (both `load` and `mutate` return before `fetch` in demo, `locationsContext.tsx:153-156`, `:206`), so item 4 of the task holds on "no error, no call", but the demo branch `demoList` (`:115-123`) is dead code and spec 7.5 ("one synthetic primary location built from the demo client's default, or WW") is not met. Consequence beyond the demo: the orchestrator measures design acceptance (T1 to T3) in demo mode in headless Chrome, and the Locations block can never be rendered there.
- Fix: in `LocationsProvider`, treat demo as ready without a client: `const clientReady = isDemoMode || (activeClient != null && activeClient.id === activeClientId)`, and let `demoList` read `activeClient?.default_market_id ?? null` (it already falls back to WW).

### R2. MEDIUM. A stored view filter survives a drop to one location (or a filter that covers every live location), leaving a hidden filter the user cannot clear (owner: bg-app)

- Where: `src/lib/locationsContext.tsx:142-148` (`adopt` drops archived ids but keeps the rest) and `:186-189` (`selected` is returned whenever `sel.ids` is non-empty, with no check of `isMulti`). The collapse "selecting every location is the same as none" exists only in `setSelected` (`:194-195`), not on read.
- Scenario: a client has Spain and France. A viewer clicks "Spain" in the sidebar (stored `[spainId]`), then France's prompts are archived and France is archived (by this viewer, `archive` at `:223-227` removes only France's id, or by anyone else, read back through `adopt`). The client now has one location, so the sidebar shows the static line (`Layout.tsx:274`) with no "All locations" row and no scope sentence anywhere, but `selected` is still `{spainId}`, so `resultsContext.tsx:127` filters. `locationPromptIds` then excludes every prompt of the archived location, and the Mentions feed (`Mentions.tsx:103-106`, and `mentionsView.ts:64` shows history of inactive prompts too), the Sentiment feed (`BrandSentiment.tsx:174-179`), the Competitors trend (`Competitors.tsx:267-268`) and the Overview window (`Dashboard.tsx:128-131`) silently lose all of France's past answers. The state persists in localStorage across reloads. Same mechanism, milder: a 3 to 2 drop that leaves `[A, B]` stored shows both rows pressed and "All locations" not pressed.
- Fix: normalise on read. In the `selected` memo return `EMPTY_SET` when `locations.length < 2` or when every live id is selected; apply the same rule in `adopt` and write the cleared value back with `writeStoredIds`.

### R3. LOW. MCP and the dashboard now give different "Copy as AI prompt" market lines for a one-location client whose primary is a city (owner: bg-app)

- Where: `netlify/functions/mcp-server.js:683-690` passes the prompt's location label for a `prompt_gap` fix on every client; `src/pages/AIVisibility.tsx:893-894` returns `null` when `!isMulti`, so `:919` falls back to the default market label.
- Scenario: one of the census clients on `RO / B` (one location). For a `prompt_gap` fix the MCP `list_fixes` prompt now reads "Market: Romania · Bucharest", while the page's copy button reads "Market: Romania". Before this change both read "Romania" (`tests/mcp_server.test.js:770` and `:813` still pin the default market for other fixes). So the MCP output for a one-location client changed beyond the added `location` field (task item 7), and the two surfaces that were built for byte parity diverge. Country `ALL` primaries are unaffected (both give the market label).
- Fix: spec 7.4 and 5.5 both say "the label of the fixed prompt's location", with no one-location exception, so make `fixLocationLabel` return the prompt's location label for a `prompt` scoped fix whatever `isMulti` is (keep the filtered-locations join for multi only). If the owner prefers one-location clients unchanged, change MCP instead; either way the two must agree.

### R4. LOW. AI Visibility CSV of a one-location client gains an empty 13th column, while the Competitors CSV keeps its old shape (owner: bg-app)

- Where: `src/lib/views/aiVisibilityView.ts:98-102` puts `'Location'` in the fixed header and `:157` writes `''` when no label function is given; `src/pages/AIVisibility.tsx:863` passes `locationLabelOf` only when `isMulti`. Contrast `src/lib/views/competitorsView.ts:151-156, 189`, which adds the column only for a multi-location client ("so its file is unchanged").
- Scenario: any existing one-location client exports AI Visibility: the file now has 13 columns, the last one titled "Location" and empty on every row. A spreadsheet or script that reads the export by column count, or that compares two exports, sees a changed file. Not covered by design T2 or spec 6.7.
- Fix: follow the Competitors rule (header and cell only when a label function is passed), or always fill the column with the prompt's location label so it is never empty. `tests/views_a.test.js:78-98` pins the current behaviour and moves with the fix.

### R5. LOW. Make primary leaves `activeClient` defaults stale in the session (owner: bg-app)

- Where: `src/pages/Account.tsx:164` calls `setPrimary` and refreshes the location list only; `clientContext.tsx:58, 136` exposes `refreshClients`, which design 8.3 says to call when it exists.
- Server side is consistent: `set_primary_client_location` updates `clients.default_market_id` and `default_region_id` in the same function (`db/supabase-client-locations-2026-11-13.sql:239`), and no other post-creation writer of those columns exists (grep over `netlify/functions` and `src`: only the creation paths `_provision_client.js:316-317, 472`, `explee-import-background.js:1033-1034`, `provision-account.js:190`, `stripe-webhook.js:1110`).
- Scenario: an admin makes Spain primary over Romania, then archives Romania so one location is left. In the same session the AI Visibility fix prompt for a non-prompt fix uses `activeClient.default_market_id` (`AIVisibility.tsx:919`) and still names Romania; the sidebar error fallback (`Layout.tsx:151-153, 246`) would also show Romania. Correct after a reload.
- Fix: after a successful `setPrimary`, `await refreshClients(activeClientId)`.

### R6. INFO. The single-location AI Visibility badge composes its own label (owner: bg-app)

`AIVisibility.tsx:1729-1733` builds "market id · region label" itself instead of `locationLabel` (design 3.8 "never compose a label in a page"). For a research workspace whose region id is not in `markets.ts` (for example `US / AUS`) it shows "US · AUS", the sidebar shows "USA (AUS)", and the old badge showed "US" (spec 5.2: the old context resolved an unknown region to none). Admin-only workspaces; cosmetic.

### R7. INFO. Spec 6.7 says research workspaces run "from the prompt's city"; for those whose region id is not in `markets.ts` they run at country level (owner of the doc: bg-architect)

`_locations.js:95-100` resolves an unknown region id to `region_label null` with a warning, so the ten workspaces of `db/supabase-research-cities-batch2-2026-11-06.sql:19-55` (`AUS`, `SJC`, ...) are asked as "United States" with ChatGPT `user_location { country: 'US' }` and no city. That is what spec 5.2 says and what they got before (their city lives in the prompt text). Only the 6.7 table row is wrong; `tests/enqueue_locations.test.js` ("an unknown research region resolves to country level") pins the code.

### R8. INFO. Old manual answers asked from a browser selection are attributed to the primary with nothing to say so on a one-location client

Before this change a manual run and a single cell refresh asked from the browser's first sidebar selection (spec section 2), which could differ from `clients.default_market_id`. The backfill puts every existing prompt in the primary, old rows carry no stamp, and "Location not recorded" is shown only when `isMulti` (`Mentions.tsx:296-299`, `BrandSentiment.tsx:449-454`). So for a client whose admin ran by hand from, say, a city while the stored default is the country, the trend now mixes city answers (before) and country answers (after) under one prompt with no marker. Spec 7.3 accepts this in general; recorded so nobody reads the deploy-day step as a defect.

### R9. INFO. Test changes: no assertion found weakened; two notes

- `tests/provision_client.test.js:179-183` deletes `locations_created` from both bodies before the before/after comparison. Justified: section 2 pins it at `0` and pins "no rpc at all" and "no `location_id` key" (`:212-216`). Note this file runs `git show` itself (`:68`), so I did not run it.
- `tests/explee_import.test.js` runs the real `_enqueue.js` on the in-memory fake, which has no prompt trigger, so it exercises the fallback geo (client default at country level). In production the trigger gives every Explee prompt the `WW / ALL` or `XX / ALL` primary, so a WW Explee client gets the neutral worldwide text there, not the TLD fallback the test sees. The test still proves the job shape; it does not prove the production geo.

### R10. INFO. New hard dependencies on the migration for every client, not only multi-location ones

Even a one-location client now needs the new columns and table: Mentions and Brand Sentiment always request `asked_market_id, asked_region_id` (`Mentions.tsx:30`, `BrandSentiment.tsx:54`); every MCP prompt and fix tool reads `client_locations` and throws on a read error (`mcp-server.js:439-445`); the Explee import and the wizard read `plan_prompt_caps` before any write and refuse on a read error (`_provision_client.js:232-277`). Spec 4.5's list of "deploy before migration" consequences does not name the two feeds or MCP. The order rule (migration first, read back, then push) covers all of it; recorded so the owner knows a reversed order would break these two pages and MCP for every client.

## 2. Confirmed

### 2.1 Collection, per census group (spec 6.7), traced through `_enqueue.js:131-152, 249-264`, `_locations.js:91-135`, `_collect.js:53-87, 349-357, 609-610, 767-777`, `collection-worker-background.js:83-99`

| Group | Scheduled before (spec 2 and 6.7) | Scheduled and manual after | Listed in 6.7 |
|---|---|---|---|
| Country `ALL` (RO, DK, SE, US, NL, IS, CA, IT, IL) | `COUNTRY_NAMES` label, region null, ChatGPT `{country}`, `gl` country | identical: `resolveLocation` gives the same label, `region_label` null for `ALL`, same `market_id` | yes, "none" |
| City primary (`RO / B`, `ES / TF`) | country level | "Bucharest, Romania" / "Tenerife, Spain"; ChatGPT gains `city`; ai_overview gains `location`; google_ai `gl` unchanged | yes, (b) |
| `WW` with null region (6) and `WW / ALL` (1) | `market_label` null, so the website TLD fallback | `WW / ALL` primary, label "Worldwide", neutral text (`WORLDWIDE_NEUTRAL` true, `_collect.js:49, 64-65`); no `user_location`, no `gl` | yes, (c) |
| `WW` continent (`OCE`, `NA`, `APAC`, `EU`) | TLD fallback | "Oceania, Worldwide" and so on; no `user_location`; ai_overview `location` = continent, no `gl` | yes, (d) |
| Research, region not in `markets.ts` | manual only | country level (see R7) | wording wrong, behaviour as 5.2 |

Manual runs: `enqueue-collection.js:60, 99-106` passes `market: null` and `_enqueue.js:83` ignores it; `collectionContext.tsx:226-230` no longer sends `markets`; the single cell refresh payload (`:363-370`) carries no labels and the collectors resolve the prompt's own location (`collect-prompt.js:97, 121-124, 238-240, 316-317`, `ctx_geo` from resolved labels at `:339-340`). For a client whose sidebar selection differed from its stored default, manual runs and single cell refreshes now ask from the primary (the stored default for every backfilled prompt), so the sidebar choice stops mattering; this is spec case (a), and see R8 for the history consequence. Old queued jobs at deploy time keep their browser labels and get a stamp with a null `location_id` (`collection-worker-background.js:96-99`). New failure mode, already reported by the server review (L1): a failed `client_locations` read refuses the whole run (`_enqueue.js:144-147`).

### 2.2 One-location client, every difference found, each allowed

- Sidebar: title "Locations" (was "Collection market"), one static line from the primary (`Layout.tsx:274`), Edit now manages server-side locations with a plan counter or "Location limit reached" (design 5.4, owner question 3 default), two skeleton lines while the list loads after each client switch (design 5.5). The "Add location" market list hides a market once its `ALL` row is live (`Layout.tsx:255-258`), which differs from Account (`Account.tsx:112`); this is the frontend review's F2, not counted again.
- AI Visibility: header badge from the primary instead of the browser selection, hidden while locations load (`:1720-1738`); no scope line, chip, split or group label (`isMulti` gates at `:822, 863, 894, 905, 1148, 1156, 1515, 1766, 2443, 2472`).
- Overview, Brand Sentiment, Mentions, Competitors: subtitle or scope sentence only when `isMulti` (`Dashboard.tsx:224`, `BrandSentiment.tsx:219`, `Mentions.tsx:191`, `Competitors.tsx:348`). Competitors CSV unchanged (`competitorsView.ts:189`). AI Visibility CSV changed (R4).
- Prompts: no badge, filter, "Ask in" or edit line (`Prompts.tsx:475, 555, 622, 691, 775`); the insert sends no `location_id` key (`:310, 332`), the same row shape as before; one extra list refresh after add or remove.
- Account: a new Locations section (design 8).
- Request bodies: `markets` and the three label fields are no longer sent (spec 7.6).
- Results numbers: with no filter `applyLocationFilter` returns `rows === allRows` and `activePrompts === allActivePrompts` (`locations.ts:141-143`), so every aggregate is computed from the same arrays as before. The snapshot object is rebuilt once when the primary id arrives; every effect keyed on the snapshot keys on `version`, not identity (`AIVisibility.tsx:552-562, 1098-1105, 1084`), and the memos it re-runs make no request.

### 2.3 Old data

No aggregate reads the stamp columns: `client_results_latest`, `metrics.ts` and the views take rows by `prompt_id`. "Location not recorded" appears only in the Mentions feed (`Mentions.tsx:296-299`) and the Sentiment feed (`BrandSentiment.tsx:449-454`), and only when `isMulti`. The split table rate uses `mentionRate` over a `buildSnapshotView` population and prints "Not checked yet" for a location with no answered row; the scope sentence takes `n = locations.length`, which is at least 2 whenever it renders. No division by a stamp-derived count exists.

### 2.4 Readers of `default_market_id` and `default_region_id` after the change

Server: `_enqueue.js:93` (fallback geo only), the three collectors' client reads (`collect-prompt.js:220` and copies, fallback only), `mcp-server.js:678` (fix market for non-prompt fixes), `_locations.js:116`. Frontend: `Layout.tsx:151-153, 246` (error fallback), `AIVisibility.tsx:919` (fix fallback), `locationsContext.tsx:133-134` (demo only). Make primary keeps them equal to the primary on the server; the client copy goes stale until reload (R5).

### 2.5 Demo mode

No new network call: `locationsContext.tsx:153-156, 206`, history pages branch on `isDemoMode` (`Mentions.tsx:77`, `BrandSentiment.tsx:82`), results come from mock data. No error path found. But see R1.

### 2.6 Modified tests, read

`enqueue_history` (fixtures gain `location_id`, a `client_locations` table and section 8, `:437-449`; count 23 on 2026-11-09, 24 now), `enqueue_force_gate` (stub moved to `_country_names.js`, `:76-78`, new section at `:184`; 13 then, 16 now), `phase2_schedule_worker_trigger` (stub moved, `:83-85`; 11 then and now), `provision_client` (R9; 51 then and now, new assertions inside existing checks), `phase2_prompt_ownership` (body geo now asserted ignored, `:251, 515-560, 616-625, 744-745`; 99 then, 126 now), `mcp_server` (oracle gains the location label for `prompt_gap` only, `:771-784`, default market still pinned at `:813`; 83 then, 85 now), `views_a` (header pinned with `Location`, empty when no label, `:78-100`; 37 then, 38 now), `helpers/fake_supabase_mem.js` (the four location RPCs are opt-in behind `clientLocations: true`, `:357-367, 429-432`; no existing branch or default changed that I could see). No assertion found removed or loosened, judged by reading; without a diff this cannot be proven, and counts that only rise are supporting evidence, not proof.

Run here, from `brandgeo-dashboard`, one at a time:

```
node tests/locations_view.test.js   -> locations_view: 22 passed, 0 failed
node tests/views_a.test.js          -> views_a: 38 passed, 0 failed (EXIT 0)
node tests/enqueue_locations.test.js -> enqueue_locations: 16 passed, 0 failed
```

### 2.7 MCP and Explee for a one-location client

MCP `list_prompts` and `get_prompt_results` only add `location` per prompt (`mcp-server.js:470, 501`); metric tools unchanged. `list_fixes` changes for city primaries (R3). Explee: `resolveMarket` (`_explee_rules.js:440-450`) always yields a valid pair (`XX / first region` or `WW / null`), so `planLocations` never refuses an Explee lead; string prompts map to the primary with no `location_id` key and no RPC (`_provision_client.js:216-226`); the new cap check reads `plan_prompt_caps` for `free` before any write.

## 3. Not checked

- The pre-change source of any file (no git allowed): every "before" in this report is the spec's description, not code I read. In particular the exact label strings the old browser path sent for manual runs (for example whether it sent "USA" from `markets.ts` or "United States" from `COUNTRY_NAMES`), so a wording change in the manual-run system text for US and UK clients is neither confirmed nor ruled out. Whether Mentions, Brand Sentiment and Overview had a subtitle before this change.
- No browser, no screenshot, no phone width, no light mode, no screen reader: every pixel statement is from code.
- No database: the live `plan_prompt_caps` row for `free` (if it is below the 5 prompts the Explee importer generates, every Explee lead is now refused with `prompt_cap_exceeded`); the census itself; whether any live client has a stored browser filter (none can yet).
- Tests not run by me: `phase2_prompt_ownership`, `mcp_server`, `provision_client` (runs git), `enqueue_force_gate`, `phase2_schedule_worker_trigger`, `enqueue_history`, `explee_import`; their counts are the orchestrator's.
- `Onboard.tsx`, `Recommendations.tsx`, `MultiCombobox.tsx` behaviour, `i18nContext.tsx`: left to the frontend review.
- SerpApi acceptance of "Tenerife" and of continent names as `location`.
- `schedule-collections.js` and `delete-client.js` were not re-read.
