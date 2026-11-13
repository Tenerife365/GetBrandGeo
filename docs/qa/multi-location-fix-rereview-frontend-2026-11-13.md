VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 0 medium, 3 low, 5 info). Earlier findings: 21 of 21 CLOSED (F1 to F15, R1 to R6).

# Multi-location fix round: frontend re-review (bg-verify, read only)

Date: 2026-11-13. Lens: FRONTEND. Subject: the uncommitted working tree after the fix round, judged against `docs/qa/multi-location-review-frontend-2026-11-13.md` (F1 to F15) and `docs/qa/multi-location-review-regression-2026-11-13.md` (R1 to R6). Method: every file in the lane read in its current state; the server files the wizard and the fix prompt depend on (`onboard-client.js`, `_provision_client.js`, `mcp-server.js`) read for the contract; four node test files run. No git, no tsc, no build, no browser, no database. The builders' reports were not used as evidence.

## 1. Earlier findings

| Id | State | Evidence |
|---|---|---|
| F1 | CLOSED | `Onboard.tsx:173-178` `overCap = promptRows > promptCap` for both shapes (`promptRows = prompts.length` with one location). `:672-690` the counter and the override checkbox render whenever `overCap`. `:693` Next disabled while over the cap and not ticked. `:358` `allow_over_cap: true` sent when `overCap && overrideCap`, whatever the shape. `:183-185` the tick clears itself once back under the cap. Traced: (a) one location within the cap: no counter, no checkbox, body `prompts: string[]` (`:356`), no `locations` key (`:357`), no `allow_over_cap`, the old shape; the server counts one row per string (`_provision_client.js:185-201, 207-209`) and accepts. (b) one location above the cap: counter plus checkbox shown; unticked, Next is disabled so the request is never sent; ticked, `allow_over_cap: true` goes with the string list and the server passes it (`_provision_client.js:278-283`), the insert runs as service role which the cap trigger lets through (`db/supabase-prompt-cap-bypass-fix-2026-11-09.sql:69`). (c) several locations above the cap: rows counted per effective key (`:174`), same gate, objects with `location_keys` (`:355`) and `locations` (`:357`). Non-admin: `onboard-client.js:80` is `requireAuth(..., { adminOnly: true })`, so no viewer reaches the flag; the only other `provision` caller (Explee import) never sets it (grep: `allow_over_cap` appears only in `onboard-client.js` and `_provision_client.js`). Residual, INFO I2 below |
| F2 | CLOSED | `Layout.tsx:268-271`: a market is hidden only when every region is a live pair; the `!liveIds.has('ALL')` clause is gone. Same rule as `Account.tsx:112-113` |
| F3 | CLOSED | `Prompts.tsx:150` and `:444` set `discoverAskIn` to `defaultAskIn()` when suggestions arrive; `:654-658` each "+" is disabled with the accessible name "Pick a location first to add this prompt" while the selection is empty; `:645-647` a visible line says why; `:640` Add all disabled the same way |
| F4 | CLOSED | `Recommendations.tsx:617-643`: every payload field comes from `snapshot.allRows` and `snapshot.allActivePrompts` (`allStats`, `allView`, `allSnippets`, `engines_with_errors`, `prompts`); the only branch is the early return. Null snapshot: `:548` memo returns null, `:617` guards `!snapshot`, `:564-566` loading and failure states, no dereference. `:744-746` the subtitle carries the scope line and, under a partial filter, "New advice always covers every location." See N2 for a gap the fix left |
| F5 | CLOSED | `MultiCombobox.tsx:40-43` optional `invalid` and `describedBy`; `:212-213` wired to `aria-describedby` (summary plus the caller's id) and `aria-invalid`; `:235` negative border. Callers: `Prompts.tsx:712-713` (Add form, error line id `prompts-ask-empty` at `:716`), `Prompts.tsx:636-637` (Discover, `:646`), `Onboard.tsx:651-652` (per prompt, `:655`). Focus after removal: `:106-111` picks the next chip, else the previous, else the input; `:90-96` focuses it after the new values render. `:185-187` Backspace or Delete on a focused chip removes it. `:176` chip list labelled "Selected: <label>". Phone: `:193` `max-md:h-8` (32 px) plus `max-md:after:-inset-y-1.5` (6 px each side) is 44 px, `max-md:min-w-[44px]`, and `:177` `max-md:gap-y-3` (12 px) so two rows' extensions meet but do not overlap |
| F6 | CLOSED | `Layout.tsx:410` "See plans" and `:382` "Open prompts" carry `max-md:after:[inset:-14px_-6px]` (16 + 28 = 44 px); `:262` Retry `after:[inset:-14px_-6px]` plus `max-md:min-h-[44px]`; `AIVisibility.tsx:2499` split row button `max-md:min-h-[44px]` |
| F7 | CLOSED | `Layout.tsx:205-223` and `Account.tsx:152-171`: the next archivable row's archive button is computed before the call and focused in a frame after success, else the Add input (`data-archive-id` at `Layout.tsx:363`, `acct-loc-add` at `Account.tsx:342`) |
| F8 | CLOSED | `Layout.tsx:378` and `Account.tsx:263` use `promptCountLabel` |
| F9 | CLOSED | `Layout.tsx:381` `onClick={() => { setSelected([l.id]); onNavigate() }}` |
| F10 | CLOSED | `locationsContext.tsx:114-140`: `ListRes`, `AddRes`, `ArchiveRes`, `PrimaryRes`, `ErrRes` and a typed `CallResult<T>`; no `any` left in the file (the remaining cast is `data as T` after `res.ok`) |
| F11 | CLOSED | `Onboard.tsx:484`, `:489` labels are `text-meta text-ink-2`; `:659` empty item `text-meta text-ink-3` |
| F12 | CLOSED | `locationsContext.tsx:81` key `brandgeo_location_filter_v2_<userId>_<clientId>`; `:84-85` and `:94-95` read and write return early with no user id, so nothing is persisted; `:165-176` the user id comes from the session and its change events (demo starts at null); `:186`, `:234`, `:237` the in-memory filter is scoped to user plus client |
| F13 | CLOSED | `Layout.tsx:294` and `:313`: every sidebar filter row carries `data-loc-filter` and `aria-pressed`, so AC-4's `[aria-pressed][data-loc-filter]` now matches real controls |
| F14 | CLOSED | `Competitors.tsx:346-348`: the first clause ends with a period before the scope sentence |
| F15 | CLOSED | `competitorsView.ts:176-195`: each competitor lists the distinct locations of its prompts, joined with "; ". `tests/views_a.test.js:166-180` is not vacuous: the fixture yields 2 competitors each named in prompts 1 and 2, which the test labels differently (measured below) |
| R1 | CLOSED | `locationsContext.tsx:179-180` demo counts as ready without a client; `:201-203` demo adopts `demoList` (one synthetic primary, `WW / ALL` when the demo client has no default, `:142-150`); no fetch in demo (`:201`, `:255`) |
| R2 | CLOSED | `normaliseIds` (`locationsContext.tsx:107-112`) clears a filter when fewer than two live locations exist and collapses a selection covering every live location to "all". Applied on adopt (`:190-196`, with write back), on read in the `selected` memo (`:236-241`) and on set (`:243-247`). No render loop: `adopt` returns `prev` when nothing changed (`:193`), the effect at `:221-224` runs only when `activeClientId`, `clientReady` or `load` change, and the `selected` memo sets no state. Client switch: `ready` needs `loaded.clientId === activeClientId` (`:226`) and the memo needs `sel.scope === scope` (`:237`), so neither the previous client's list nor its filter is exposed. Also closes I2 of the frontend review |
| R3 | CLOSED | `AIVisibility.tsx:896-904`: a prompt-scoped fix returns the prompt's own location label whether or not the client has several; a fix not tied to a prompt returns null for a one-location client and `:922` falls back to the default market label. MCP `mcp-server.js:684-690` does the same (prompt_gap id gives the prompt location label, else `market` from `default_market_id`); the label rules match (`locations.ts:29-38` against `mcp-server.js:423-432`), and only `prompt_gap` fixes carry a prompt metric key (`fixItems.ts:247`). One-location client on `RO / B`: prompt fix "Romania · Bucharest" on both surfaces, other fixes "Romania" on both. Parity holds because `prompts.location_id` is NOT NULL after the migration (`db/supabase-client-locations-2026-11-13.sql:160`); see I4 for the transient exception |
| R4 | CLOSED | `aiVisibilityView.ts:108-110` header gains Location only when asked; `:165` the cell only when `locationLabelOf` is given; `AIVisibility.tsx:857` and `:863` pass both only when `isMulti`. A one-location export is 12 columns, a one-location Competitors export 7 (`competitorsView.ts:197`). Pinned by `tests/views_a.test.js:82-85`, `:92-101`, `:103`, `:179` |
| R5 | CLOSED | `Account.tsx:181` `await refreshClients(activeClientId)` after a successful Make primary |
| R6 | CLOSED | `AIVisibility.tsx:1724-1735`: the single-location badge renders `locationLabel(only)`, the same function the sidebar line uses (`Layout.tsx:287`). For a research pair `US / AUS` both now read "USA (AUS)"; the builder's "truncated" referred to the `truncate` span with `max-w-[14rem]`, which is display only |

## 2. New findings

### N1. LOW. Onboard: the one-location over-cap message explains the cap with locations (owner: bg-app)

- Where: `Onboard.tsx:679-681` shows `COPY.overWhy` ("Each location of a question uses one prompt.", `:48`) whenever `overCap`, now including the one-location path the F1 fix opened.
- Scenario: admin, Essentials, one location, 20 prompts. Step 4 reads "20 prompts of 18 on Essentials." then "Each location of a question uses one prompt." The second sentence describes a cost that does not apply; the admin is left wondering which locations.
- Fix: render `overWhy` only when `isMultiWizard`; the counter line already says enough for one location.

### N2. LOW. Recommendations: Generate follows the location filter, although the advice no longer does (owner: bg-app)

- Where: `Recommendations.tsx:567` `hasResults` and `:727` `disabled={!hasResults}` come from the filtered `stats`; `:617` returns early when the filtered `stats.totalChecks === 0`; `:745` says "New advice always covers every location."
- Scenario: a client with Spain (answered) and a newly added France (nothing collected yet). The viewer filters to France: Generate is disabled with no reason, while the subtitle says advice covers every location and the whole account has data. Clearing the filter enables it.
- Fix: gate the button and the early return on the unfiltered totals (`snapshot.allRows` through the same `buildRecommendationsStats` used at `:621-622`, memoised), or give the disabled button a visible reason.

### N3. LOW. The R2 and F12 fixes have no automated test (owner: bg-app)

- Where: `normaliseIds`, `storageKey`, `readStoredIds` and `writeStoredIds` are module private in `locationsContext.tsx:81-112`, a `.tsx` file the node tests do not load. `tests/locations_view.test.js` still holds the same 22 checks as before the fix round.
- Scenario: a later edit that drops the `live.size < 2` rule or the user id from the key brings back the hidden filter (R2) or the shared filter (F12) with every test green.
- Fix: move the three pure helpers to `src/lib/locations.ts` (no React there) and pin: fewer than two live ids gives `[]`, a full selection gives `[]`, archived ids drop, no user id gives no key.

### INFO

- I1. `locationsContext.tsx:81`: the key moved from `_v1_<clientId>` to `_v2_<userId>_<clientId>`; old v1 entries stay in browsers unread. Harmless (no filter was ever stored in production before this deploy).
- I2. F1 residual: the wizard judges the cap from `PLAN_PROMPTS` (`Onboard.tsx:176`) while the server reads `plan_prompt_caps`. The values agree in the repository (`planConfig.ts:562-564` against `db/supabase-plan-caps-2026-07-31-migration.sql:86-94`); if they ever drift so the server cap is lower, the server's `prompt_cap_exceeded` sends the admin to step 4 with "tick the override" while no override is shown (`:364`, `:672`). Not reachable today by the files; the live table was not read.
- I3. `Prompts.tsx:113-120` and `:150`: `autoGeneratePrompts` runs from the closure of the render that opened Discover, so if locations were still loading then, the "Ask suggestions in" selection starts empty; the visible reason and disabled buttons from F3 cover it.
- I4. While locations are loading or failed, `locationOfPrompt` returns '' (`AIVisibility.tsx:370-374`), so a one-location client with a city primary copies the country label for a prompt fix (`:900-903`, `:922`) where MCP gives the city. Transient.
- I5. The AI Visibility header badge wrappers still carry `data-loc-filter` without `aria-pressed` (`AIVisibility.tsx:1728`, `:1739`, `:1752`). AC-4 is fine now (F13); a test that counts every `[data-loc-filter]` would also count these.

## 3. Attack list, results

1. F1 traced above, all three shapes, admin and non-admin.
2. R1, R2: demo builds one synthetic primary; a stored filter is cleared with fewer than two live locations, on read and on adopt; no state is set in a render path (`adopt` is called only from `load`, `load` only from the effect, `refresh` and `mutate`); a client switch exposes neither the previous list nor its filter.
3. R3: one-location client, prompt fix: the prompt's location label (country for `ALL`, "Country · City" for a city); other fix: the default market label. Identical to `mcp-server.js:684-690`.
4. R4, F15: 12 and 7 columns for a one-location client, pinned by tests.
5. F4: every payload field unfiltered; null snapshot safe. N2 is the remaining gap.
6. Guardrails: no `motion` or `framer-motion` import in `locationsContext.tsx`, `locations.ts`, `MultiCombobox.tsx`, `Combobox.tsx`, `comboboxFilter.ts`, `marketOptions.tsx`, `Badge.tsx`, `Button.tsx`, `SegmentedControl.tsx`, `skeletons.tsx`, `markets.ts`, `planConfig.ts`, `supabase.ts` (rg, no hit). `scrollIntoView`: one hit, `Prompts.tsx:209`, the pre-existing chat scroll; `MultiCombobox.tsx:74-83` uses `scrollTop`. `text-slate-*`: none on the location lines of `Onboard.tsx`, `Layout.tsx` `LocationsBlock`, `Account.tsx` `LocationsSection`, `Prompts.tsx`, `MultiCombobox.tsx`, `locationsContext.tsx`. Nothing new and tall above "Your prompts" (`AIVisibility.tsx:2375`) for a one-location client: the only addition there is the header badge, and the split control and table are gated on `isMulti` (`:2441`, `:2470`). DELETE on prompts: only `Prompts.tsx:292`, the pre-existing admin removal path; no new code deletes a prompt. Dash scan: every hit in the lane files is in a comment or the LLM system prompt (`Prompts.tsx:25-41`), none in location copy; the pattern fired on a positive control.
7. Hooks: in every component the fix round touched, all hooks precede the first component-level return: `Onboard.tsx` hooks end at `:188`, return at `:195`; `Prompts.tsx` `:209` and `:471`; `AIVisibility.tsx` `:1101` and `:1169`; `Competitors.tsx` `:177` and `:236`; `Layout.tsx` `LocationsBlock` `:145` and `:245`; `Account.tsx` `LocationsSection` `:119` and `:192`; `MultiCombobox.tsx` `:90` and `:169`; `Recommendations.tsx` has no early return in the page. No hook sits inside a condition.

## 4. Tests run (from `brandgeo-dashboard`, one at a time)

```
node tests/views_a.test.js          -> views_a: 40 passed, 0 failed (exit 0)
node tests/locations_view.test.js   -> locations_view: 22 passed, 0 failed (exit 0)
node tests/combobox_filter.test.js  -> combobox_filter: 14 passed, 0 failed (exit 0)
node tests/tokens_sync.test.js      -> 115 passed, 0 failed (exit 0)
```

Non-vacuity of the F15 check, measured with the same loader and fixture: `competitorStats` returns 2 competitors, each named in prompts 1 and 2, which the test labels "Loc odd" and "Loc even", so each row must end with both labels.

## 5. Not checked

- Nothing rendered: no browser, no phone, no screen reader, no light mode. Every hit size, focus move and label statement is read from code; the focus moves after archive and after chip removal depend on a frame or an effect running after the new list renders, which was not observed.
- No git: I could not see which lines the fix round changed, so "added lines" (slate classes, dashes) were judged by reading whole files. The one-location prompt list in `Onboard.tsx:662-670` uses `text-slate-*`; I took it as the pre-change list, not proven.
- No tsc, no build, no bundle inspection; the orchestrator's figures were not reproduced. Only four test files run.
- `refreshClients` side effects beyond `loading` (for example on view-as-user state) after Make primary were not traced; I confirmed only that `OnboardGate` does not unmount the page (`App.tsx:228-230`).
- The live `plan_prompt_caps` rows (I2) and every server function beyond the request contract.
- `Mentions.tsx`, `BrandSentiment.tsx`, `Dashboard.tsx` were outside this lane and were not re-read.
