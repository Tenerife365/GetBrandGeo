VERDICT: FAIL (0 blocker, 1 major, 3 medium, 11 low, 6 info)

# Multi-location feature: frontend review (bg-verify, read only)

Date: 2026-11-13. Lens: FRONTEND, against `docs/arch/multi-location-collection.md` sections 7 and 8 and `docs/design/multi-location-ui-2026-11-13.md`. Subject: the uncommitted working tree files listed in the task. Method: every `src` file of the change read in the working tree (no git, so no diff: added lines were judged by reading the files against the spec), plus the server files the frontend calls (`onboard-client.js`, `_provision_client.js`, `client-locations.js`, `_locations.js`) where a contract had to be matched. One node test run (below). No build, no browser, no database.

Why FAIL and not PASS WITH FINDINGS: core flow 1(a) fails on one of its named branches (string prompts above the cap, F1), and the role rules do not let a failed criterion pass. Everything else in flows (a) to (e) works as written. F1 is a small fix in one file.

## 1. Findings

### F1. MAJOR. Onboard: a one-location wizard above the prompt cap reaches a dead end, and the error tells the admin to tick a box that is not there (owner: bg-app)

- Where: `src/pages/Onboard.tsx:177` (`overCap = isMultiWizard && promptRows > promptCap`), `:669-685` (counter and override checkbox render only when `isMultiWizard`), `:357` (`allow_over_cap` sent only when `overCap`), `:363` (on `prompt_cap_exceeded` it shows `COPY.errCap` and goes back to step 4); server `netlify/functions/_provision_client.js:270-281` counts string prompts too and refuses above the cap unless `allow_over_cap === true`.
- Scenario: admin onboards a client on Essentials with one location and types 20 prompts (cap 18). Step 4 shows no counter and Next is enabled. Submit answers 400 `prompt_cap_exceeded`; the wizard returns to step 4 with "Too many prompts for this plan. Remove some or tick the override." No override exists on the one-location path, so the only way through is deleting prompts. The owner default for question 4 ("refused unless the admin ticks an explicit override") is unreachable for every one-location onboarding, which is the common case. A second path to the same dead end: the wizard judges the cap from `PLAN_PROMPTS[plan]` (`:176`) while the server reads `plan_prompt_caps`, so if the two differ a multi wizard that shows "fits" can also be refused.
- Fix: compute `overCap = promptRows > promptCap` for both shapes (for strings `promptRows` is already `prompts.length`), render the counter line and the override checkbox whenever `overCap`, and send `allow_over_cap: true` when ticked regardless of `isMultiWizard`. Optionally read the cap from `plan_prompt_caps` as `Prompts.tsx:186-196` already does.

### F2. MEDIUM. Sidebar "Add location" hides every market that already has its whole-country row, so "Spain" plus "Spain, Madrid" cannot be added from the sidebar (owner: bg-app)

- Where: `src/components/Layout.tsx:255-258`: `return !m.regions.every(r => liveIds.has(r.id)) && !liveIds.has('ALL')`.
- Scenario: a client whose primary is `RO / ALL` (the most common live shape) opens Edit in the sidebar to add Bucharest. Romania is not in the picker at all. The design (section 5.4) drops a market "only when every one of its regions is already a live pair", and its own wireframe shows "Spain" and "Spain . Madrid" side by side. The server accepts the pair (unique index is on market plus region). The Account page does it right (`src/pages/Account.tsx:112`), so the two add surfaces disagree.
- Fix: delete `&& !liveIds.has('ALL')` at `Layout.tsx:257`; the region MultiCombobox already marks live regions "Added" (`:402-404`).

### F3. MEDIUM. Prompts, AI Discover: per-suggestion "+" does nothing, silently, for a multi-location client (owner: bg-app)

- Where: `src/pages/Prompts.tsx:81` (`discoverAskIn` starts as `[]`), `:311` (`if (isMulti && locIds.length === 0) return false`), `:646-651` (the per-suggestion IconButton is not disabled and shows no reason). "Add all" is disabled (`:635`), the single "+" is not.
- Scenario: a viewer with three locations opens AI Discover, gets twelve suggestions and clicks "+" on one. No insert, no notice, no live text; the button looks broken. The design (7.6) defaults "Ask suggestions in" to the same default as the Add form (the filtered locations, else the primary).
- Fix: initialise `discoverAskIn` with `defaultAskIn()` when suggestions arrive (or when Discover opens), and disable each "+" with a visible reason while the selection is empty.

### F4. MEDIUM. Recommendations follows the location filter with nothing on the page saying so, and saves AI advice generated from a filtered scope as client-wide (owner: bg-app; Recommendations.tsx is in no build row, so this needs a scope decision)

- Where: `src/pages/Recommendations.tsx:544-556` (stats from the filtered `snapshot.rows` and `snapshot.activePrompts`), `:624-633` (the generate payload sends the filtered prompts and stats; the saved `recommendation_runs` row carries no scope).
- Scenario: the filter is persisted per client in localStorage (`locationsContext.tsx:79-95`). A user who chose "France" last week opens Recommendations today: the mention numbers and the generated advice are France only, the page says nothing, and "Generate" stores a run that every later viewer reads as advice for the whole account. Every other insight page carries the scope sentence (spec 7.2: "One line on each insight page says so").
- Fix: append `locationScopeLine(locations.length, selected.size)` to the Recommendations subtitle when `isMulti`, and either disable Generate while a filter is on (with a reason) or generate from `snapshot.allRows` and `snapshot.allActivePrompts`.

### F5. LOW. MultiCombobox departs from the design's accessibility contract (owner: bg-app)

- Where: `src/components/ui/MultiCombobox.tsx:20-40` (no `invalid` and no `describedBy` props), `:181` (`aria-describedby` is the summary only), `:85-89` (removing a chip moves focus to the input, which reopens the list, instead of to the next chip), chips have no Backspace or Delete handler, `:152` (the chip `ul` has no `aria-label` "Selected: ..."), `:159-163` (an `sm` chip is `h-6` plus an 8 px extension each side: 40 px tall on a phone, design asks 44 and `max-md:h-8`; two wrapped chip rows 4 px apart get overlapping extensions, which design 3.6 forbids).
- Scenario: Prompts and Onboard render "Pick at least one location" as a separate `role="alert"` (`Prompts.tsx:706`, `Onboard.tsx:652`) that is not tied to the field, so a screen reader user tabbing back to the field hears no error and no `aria-invalid`. On a 390 px phone the sidebar region chips are 40 px targets.
- Fix: add `invalid` and `describedBy` as specified in design 4.1 and wire both callers; use `max-md:h-8` with `max-md:after:-inset-y-1.5` and `max-md:gap-y-3` on the chip list; focus the next chip on removal; label the chip list.

### F6. LOW. New links and buttons below 44 px on a phone (owner: bg-app)

- Where: `Layout.tsx:387` "See plans" NavLink (no `after:` extension, about 16 px tall); `Layout.tsx:363` "Open prompts" link (same); `Layout.tsx:249` "Retry" (`after:[inset:-12px_-6px]` on a 16 px line gives 40 px); `AIVisibility.tsx:2499-2501` split table row button (no `min-h-[44px] md:min-h-0`, which design 9.4 asks for).
- Fix: add the 44 px phone extension pattern already used at `Layout.tsx:218`.

### F7. LOW. Focus falls to the page body after archiving a location (owner: bg-app)

- Where: `Layout.tsx:205-210`, `Account.tsx:151-159`. The archived row unmounts with the focused button in it.
- Fix: per design 5.4, move focus to the next row's archive button, else the Add input.

### F8. LOW. Copy: "Archive its 1 prompts first" (owner: bg-app)

- Where: `Layout.tsx:362`, `Account.tsx:248`. Fix: use `promptCountLabel(l.active_prompts)`.

### F9. LOW. Sidebar "Open prompts" does not set the filter to that location (owner: bg-app)

- Where: `Layout.tsx:363`. Design 5.4 says the link "also sets the filter to that location"; Account does it (`Account.tsx:250`). Fix: `onClick={() => { setSelected([l.id]); onNavigate() }}`.

### F10. LOW. `any` in the new context (owner: bg-app)

- Where: `src/lib/locationsContext.tsx:100` and `:204` (`data: any`). CLAUDE.md 4.4 forbids `as any`; this is an annotation, not a cast, but it turns off checking on every server response the feature reads. Fix: type the four response shapes from spec 5.3 (`ListRes`, `AddRes`, `ArchiveRes`, `PrimaryRes`, `ErrRes`).

### F11. LOW. Raw colour classes in new or rewritten Onboard markup (owner: bg-app)

- Where: `Onboard.tsx:483` and `:488` (labels "Country" and "Region", `text-slate-400`), `:656` (new multi list empty item, `text-slate-600`). Design 3.3 and AC-16 allow semantic tokens only in new elements. Fix: `text-meta text-ink-2` and `text-meta text-ink-3`.

### F12. LOW. The persisted filter is per client, not per viewer (owner: bg-app)

- Where: `locationsContext.tsx:79` key `brandgeo_location_filter_v1_<clientId>`. Spec 7.2 says "per viewer per client". Scenario: an admin and a customer, or two staff logins, sharing one browser inherit each other's filter for the same client. No cross-client leak (the `sel.clientId` guard at `:187` holds). Fix: include the session user id in the key.

### F13. LOW. Design test hooks missing: AC-4 and AC-12 cannot detect a regression (owner: bg-app)

- Where: sidebar filter rows `Layout.tsx:278-316` carry no `data-loc-filter`; the only `data-loc-filter` is on the AI Visibility header badge wrapper (`AIVisibility.tsx:1725`, `:1741`, `:1754`), which has no `aria-pressed`. AC-4's selector `[aria-pressed][data-loc-filter]` therefore matches nothing in every state and passes vacuously. Fix: add `data-loc-filter` to each sidebar filter row button.

### F14. LOW. Competitors subtitle runs two sentences together (owner: bg-app)

- Where: `Competitors.tsx:346-348`: "Top competitors mentioned across 40 AI responses for Brand Combined across 3 locations, weighted by prompt count." Fix: end the first clause with a period before appending the scope line.

### F15. LOW. Competitors CSV labels each competitor with the location of one sample prompt (owner: bg-app)

- Where: `src/lib/views/competitorsView.ts:186`. A competitor named in Spain and in France is exported with one of the two. Fix: a semicolon list of the distinct locations of `c.promptIds`, or the scope label as on the brand row.

### INFO

- I1. `Layout.tsx:260`: four locations show all four rows with no "+1 more" (collapse starts at five). Reasonable; differs from design 5.3. The design's own AC-13 arithmetic is wrong too (six locations minus three shown is "+3 more", not "+2 more").
- I2. `locationsContext.tsx:195`: selecting every location is stored as "All"; the sidebar then announces "Showing 2 locations" (`Layout.tsx:179`) while the All row turns pressed. Harmless.
- I3. `aiVisibilityView.ts:101`: the AI Visibility CSV header now always has a Location column (empty for one-location clients); the Competitors CSV adds it only for multi clients. Two conventions.
- I4. `Onboard.tsx:229-239`: changing the primary to a listed pair drops the old primary from the set entirely; the live text says the new one "left the other locations" but not that the old primary is gone.
- I5. `Onboard.tsx:534` "Allowed because you are an admin; it is recorded." The event meta (`_provision_client.js:476`) records the locations list, not that the plan limit was exceeded. True only loosely.
- I6. While locations load, a persisted filter is not yet applied (`locationsContext.tsx:187`), so insight pages render combined numbers first and then the filtered ones. The scope sentence appears only once the list is ready, so the switch is labelled.

## 2. Acceptance table (the lens criteria of the task)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1a | Onboard request matches onboard-client.js: field names, key format, string shape, allow_over_cap | FAIL (F1) | Names and keys match: `Onboard.tsx:341-358` sends `default_market_id`, `default_region_id`, `prompts` as `string[]` with one location (`:355`) or `{text, location_keys}` with `'primary'` or `'MARKET:REGION'` (`:30`, `:354`), `locations: {market_id, region_ids}[]` grouped by market (`:301-309`); server parses the same (`_provision_client.js:153-205`, `onboard-client.js:94`, `:169`), error codes `invalid_location` and `prompt_cap_exceeded` with a `code` field (`onboard-client.js:179-181`, `:220-224`) are the ones the wizard branches on (`Onboard.tsx:362-363`). Fails on the one-location over-cap branch, F1 |
| 1b | Customer adds a location (sidebar, Account), adds one question in three locations: one insert, three rows, right location_id, cap, error tokens | PASS WITH F2, F3 | Sidebar add `Layout.tsx:184-203` and Account add `Account.tsx:122-149` call `add(market, regionIds)` (`locationsContext.tsx:220-221`); one insert of K rows each with `location_id: locIds[i]` (`Prompts.tsx:327-337`); one-location client sends no `location_id` key (`:332`); viewer cap: `maxSelected` (`:702`) plus `remaining < k` guard (`:316`), admin unlimited; `location_archived` and `location_invalid` mapped and list refreshed (`:339-346`); `prompt_cap_reached` branch kept (`:354-360`) |
| 1c | View filter: chosen in sidebar, applied once in resultsContext, followed by every insight page incl. Recommendations, reset on client switch, never another client's, persisted safely | PASS WITH F4, F12 | Applied once: `resultsContext.tsx:124-133` via `applyLocationFilter` (`locations.ts:138-157`); pages read `snapshot` (AI Visibility `:351-357`, Competitors `:106-111`, Sentiment `:161-166`, Dashboard `:134-143`, Mentions `:117-125`, Recommendations `:544-556`); history pages filter by `locationPromptIds` (Mentions `:103-107`, Dashboard `:128-132`, Sentiment `:174-180`, Competitors `:267-269`); other client never shown: `selected` is empty unless `sel.clientId === activeClientId` and the list is ready (`locationsContext.tsx:186-189`), list exposed only when `loaded.clientId === activeClientId` (`:178-180`); storage wrapped in try/catch (`:81-95`); stale ids dropped on read (`:140-148`) and on archive (`:223-227`). `node tests/locations_view.test.js`: "locations_view: 22 passed, 0 failed" |
| 1d | Split by location reads the unfiltered arrays | PASS | `AIVisibility.tsx:1156-1164` uses `snapshot.allActivePrompts` and `snapshot.allRows`; fix baselines and verdicts use `resultsAll` and `fixPromptIdsAll` (`:360-368`, `:962`, `:1040`) |
| 1e | Archive and Make primary | PASS WITH F7, F8 | Archive with active prompts is `aria-disabled`, focusable, sends no request (`Layout.tsx:344-357`, `Account.tsx:234-243`); Make primary admin only (`Account.tsx:223`), inline confirm, Escape closes and returns focus (`:253-270`, `:172-175`), list refetch after success (`locationsContext.tsx:208-211`) |
| 2 | State and effects | PASS | No refetch loop: `load` depends on `adopt`, `defaultMarket`, `defaultRegion`, `planLimit` only (`locationsContext.tsx:169`); out-of-order responses dropped by `seq` (`:152`, `:158`); AI Visibility memo keys on `filterKey` as well as `snapshot` (`AIVisibility.tsx:356`, `:365`, `:1084`); filter never holds archived ids (above); while locations load or fail the pages render as one location (`AIVisibility.tsx:348`), collection never reads locations (`collectionContext.tsx:190-231`, `:332-370`); demo makes no network call (`locationsContext.tsx:153-156`, `:206`) |
| 3 | Guardrails | PASS WITH F10, F11 | Combobox not touched by the callers' props (`Layout.tsx:424-433`, `Account.tsx:326-335`, `Onboard.tsx:484-499` use existing props; file not read for a diff, see section 6); no motion in `locationsContext.tsx`, `locations.ts`, `MultiCombobox.tsx` (rg); no `scrollIntoView` in them (the one in `Prompts.tsx:208` is pre-existing chat code); `MultiCombobox.tsx:70-79` uses `scrollTop`; no mock data on a production path (`demoList` only under `isDemoMode`); new code archives prompts, never deletes (the admin delete in `Prompts.tsx:289-291` is pre-existing); nothing tall above "Your prompts" (scope sentence in the subtitle `:1766-1768`, split table inside the section `:2472`) |
| 4 | Accessibility of MultiCombobox and the sidebar | PASS WITH F5, F6, F7, F13 | Combobox role, `aria-expanded`, `aria-controls`, `aria-activedescendant`, listbox `aria-multiselectable`, option `aria-selected` and `aria-disabled` (`MultiCombobox.tsx:176-252`); Escape stops propagation only when open (`:134-140`); live region (`:150`); sidebar rows are buttons with `aria-pressed` in a labelled group (`Layout.tsx:277-316`), rows `h-8 max-md:min-h-[44px]`; input `max-md:min-h-[44px] max-md:text-base` (16 px) |
| 5 | Copy truth | PASS WITH F1, F8, F14 | See section 4 |
| 6 | Design asked, build missing; build added, nobody asked | see section 5 | |

## 3. Security observations (frontend lens)

No security finding. Location ids are only ever sent with the active `client_id` (`locationsContext.tsx:207`) and the server authorises each id against it (`client-locations.js`, read for the contract only; the orchestrator record section 4 proves the RPC side as a real viewer). The view filter is a presentation choice: it never reaches a write. Make primary is hidden for a viewer and refused by the server (`forbidden`).

## 4. Data and claim integrity

| Sentence | Where | Made true by | Verdict |
|---|---|---|---|
| "New prompts will be asked from X by default. Existing prompts keep their location." | `Account.tsx:261` | Prompts default "Ask in" is the primary (`Prompts.tsx:224-229`); the trigger fills the primary for inserts with no `location_id`; `set_primary` moves a flag, `location_immutable` forbids moving a prompt | true |
| "Each location makes its own copy and uses one prompt of your plan." | `Prompts.tsx:709` | K rows per insert (`:327`), cap trigger counts rows | true |
| "Uses N of R prompts left on your plan." | `Prompts.tsx:714` | `remaining = cap - used` (`:207`) | true |
| "Combined across N locations, weighted by prompt count." | `locations.ts:171` | metrics pool every cell of every active prompt | true |
| "Archive its N prompts first. A location is removed only when it is empty." | `Layout.tsx:362`, `Account.tsx:248` | `location_in_use` while any active prompt | true, plural defect F8 |
| "Too many prompts for this plan. Remove some or tick the override." | `Onboard.tsx:52` | the override exists only with two or more locations | FALSE on the one-location path, F1 |
| "N locations, above the L on Plan. Allowed because you are an admin; it is recorded." | `Onboard.tsx:534` | `p_limit = null` for admin; the event records the locations, not the excess | loose, I5 |
| "U of L on Plan. Admin can add more." | `Layout.tsx:380`, `Account.tsx:288` | `p_limit: isAdmin ? null : limit` (`client-locations.js:250`) | true |
| "Not checked yet" (split) | `AIVisibility.tsx:2517` | `rate.pct === null` | true |
| Numbers in the sidebar counts | `Layout.tsx:288`, `:312` | `active_prompts` from `client-locations` list | traced to server |

## 5. Design versus build

Asked by the design and not built: F2 (sidebar market rule), F3 (Discover default), F5 (`invalid`, `describedBy`, chip focus model, chip sizes, chip list label), F6 (44 px links), F7 (focus after archive), F9 (Open prompts sets the filter), F13 (`data-loc-filter`); the "+N" chip count collapses at `maxChips` (3 by default) rather than "only when values.length > 3 and closed" (same effect); leading check boxes in options replaced by a trailing check (selection still exposed by `aria-selected`); design 7.3 subtitle with the meter shown is unchanged as designed.

Built and asked by neither document: the Prompts edit note and the Onboard counter are as designed; nothing material beyond I1 and I3.

## 6. Regression surface (by grep)

- `useMarket` has one consumer left, `AIVisibility.tsx:316`, which passes `selections` to `startCollection` and `runSinglePrompt`; both now ignore it (`collectionContext.tsx:195`, `:337`). Manual look: none needed beyond that.
- `useLocations` consumers: `Layout.tsx`, `resultsContext.tsx`, `marketContext.tsx`, `Prompts.tsx`, `Account.tsx`, `AIVisibility.tsx`, `Competitors.tsx`, `Mentions.tsx`, `BrandSentiment.tsx`, `Dashboard.tsx`. Provider order in `App.tsx:265-270`: Client, Locations, Market, Collection, Results, as required.
- `snapshot` consumers outside the change that now see filtered data: `Recommendations.tsx` (F4), `views/dashboardView.ts`, `views/mentionsView.ts` (covered by the filter, intended).
- History reads now select `asked_market_id`, `asked_region_id` (`Mentions.tsx:30`, `BrandSentiment.tsx:54`): they fail if the dashboard deploys before the migration (spec 4.5 order).
- Manual look owed: Recommendations under a filter, Onboard step 4 one-location over cap, sidebar Add for a `RO / ALL` client.

## 7. Confirmed

- The filter is applied in exactly one place and every insight page reads it (table row 1c).
- Unfiltered, `rows === allRows` and `activePrompts === allActivePrompts` (same references, `locations.ts:141-143`), so a one-location client sees today's numbers.
- A multi-location prompt insert always sends `location_id`, a one-location insert never does.
- Demo mode makes no `client-locations` call and has no Retry state.
- No dash character in the five new or rewritten frontend files scanned (rg with a positive control that fired); dashes found in `Account.tsx` are in pre-existing comments.
- `node tests/locations_view.test.js` from `brandgeo-dashboard`: 22 passed, 0 failed.

## 8. Not checked

- Nothing rendered: no browser, no headless Chrome, so design AC-1 to AC-18 (scroll, "Your prompts" position, hit boxes by sampling, list placement, contrast by axe, 16 px computed size) are unmeasured; hit target statements above are read from the classes only.
- No `tsc`, no build, no bundle inspection (AC-15 entry chunk content); the orchestrator's figures were not reproduced.
- Only one test file run; the other 64 were not re-run by me.
- No git: I could not see which lines are new, so "added lines" checks (tokens, dashes, `as any`) were done on whole files and judged by reading. `Combobox.tsx` was not diffed; that its props are unchanged is inferred from the callers compiling as reported, not checked.
- `src/lib/i18nContext.tsx`, `src/types/index.ts` beyond `location_id` (line 79), `views/aiVisibilityView.ts` and `views/competitorsView.ts` beyond the location lines, `tests/views_a.test.js`.
- The backend of the change (collectors, worker, enqueue, MCP, migration) beyond the request and response contracts named above: that is another lens.
- Real screen reader output, Firefox, a real phone, light mode.
- The calibration steps that need git (diff stat, secret scan over the diff) were not run: the workflow forbids git for this review.
