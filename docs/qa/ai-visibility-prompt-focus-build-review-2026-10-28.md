FAIL

# AI Visibility prompt-first, release one: build review

- **Reviewer:** bg-verify (Opus), read-only. No reviewed file was edited. No git write, no collection, no engine call. SQL was SELECT only on `duiyifepitvugyulobqm`.
- **Date:** 2026-10-31. The review was requested against the 2026-10-28 spec.
- **Subject:** uncommitted bg-app build in `brandgeo-dashboard/`:
  - Modified: `src/pages/AIVisibility.tsx`, `src/lib/mockData.ts`
  - New: `src/components/PromptResultCell.tsx`, `src/lib/aiVisibilityCopy.ts`, `src/lib/promptPerformance.ts`, `tests/prompt_performance.test.js`
- **Binding references:**
  - `docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md` (section 13 is the checklist; section 14 is the scope)
  - `docs/design/ai-visibility-prompt-focus-2026-10-18.md` (rulings, section 8)

## Verdict in one paragraph

The build is close and mostly sound. Tests pass 50 of 50, the build exits 0, and it adds no new query, write or function call. The 375px layout does not scroll sideways. The four non-result states agree with real production rows, and on 69 production cells the new error state replaces a stale result that HEAD showed as current. I found no security finding.

It fails on two counts:

1. **Criterion 7 fails as written (F1, MEDIUM).** When every engine is `MISSING` but some engines have mentions, the P0 card prints a hard-coded "appears in 0 of N answers", which is not a real count. No production client hits this today, but nothing stops one from hitting it.
2. **The H3 headline button is a mislabelled destructive action (F2, MEDIUM).** An admin who clicks the violet primary "Run Collection" button actually runs `forceCollection`, which wipes the client's existing results. The spec requires that button to read "Force Refresh" for admins.

Both fixes are a few lines each. Re-review only needs those two rows.

## Calibration

1. `git diff --stat` on `brandgeo-dashboard/src` and `brandgeo-dashboard/tests`:
   - `mockData.ts` | 57 +
   - `AIVisibility.tsx` | 1345 changed
   - `Revenue.tsx` | 805 changed. This file belongs to another session and the caller placed it out of scope.

   The three new `src` files are untracked, and all three are in spec section 14's write scope. The new `tests/prompt_performance.test.js` is NOT in section 14's write scope (F4, INFO). The caller listed it as a subject file, so I treat it as accepted rather than as an automatic block.
2. Secret scan: 0 hits across the 2386 added lines (diff `+` lines plus the new files in full). No value was printed.
3. Criteria: all 15 in spec section 13 are objectively checkable. Criteria 2, 5, 6, 9, 12 and 13 need fixtures, a live collection or a theme switch that this review could only partly exercise. See the table and "What was not checked".
4. Baseline: this was not measured on HEAD separately. `npx tsc --noEmit` and `npm run build` both exit 0 on the working tree, so there is no failure to attribute in either direction.
5. Most sensitive function touched: `forceCollection` at `AIVisibility.tsx:376`, which calls `startCollection(..., true, ...)`. The client gate is `isAdmin` (`AIVisibility.tsx:1388`). Server side, `enqueue-collection.js:23` calls `requireAuth(event)`, line 37 refuses a non-admin acting on another client, and line 44 opens the non-admin branch. That server file is unchanged by this diff.
6. Write access: this one file only. No reviewed file was edited.

CALIBRATED

## Standard checks

| Check | Result |
|---|---|
| `node tests/prompt_performance.test.js` | exit 0, `50 passed, 0 failed` |
| `npx tsc --noEmit` | exit 0, 0 errors |
| `npm run build` (`tsc && vite build`) | exit 0, built in 7.26s. Only the pre-existing over-500 kB chunk warning (`index-DnHoomRi.js`, 1,696.50 kB) |
| Dash scan, `rg -n '\x{2014}\|\x{2013}'` over the added lines | 0 hits. The positive control file gave 2 hits, so the pattern fires |
| Secret scan over the added lines | 0 hits |
| Name scan | Fixtures use fictional businesses only (Harbor Fork Catering, Lantern Table Co, Cedar & Ash, Green Plate Kitchen, Sprout & Spoon, and others in the test). No person names, emails or URLs |
| `planConfig.ts`, `aiVisibilityScore.ts` | Unchanged in the diff |

## Acceptance criteria (spec section 13)

All runtime evidence comes from headless Chrome over CDP against `vite --mode demo` on port 5191, with real `scrollTo` and DOM reads. The Browser pane was not used. SQL evidence is SELECT only, last 60 days.

| # | Criterion (short) | Result | Evidence |
|---|---|---|---|
| 1 | Newest error row renders amber `error` with `since` = oldest of the unbroken error run; never `pending`, never the old ok row as current; card line shows the same date | PASS | Production: of 1842 active cells, 162 (16 clients) have an error as their newest row, and 69 of those have an earlier ok row that HEAD showed as current. In the demo at 1280, row 21's cell reads "error since 27 Jun". Its sr text reads "Gemini has not answered since 27 Jun, last result 20 Jun". The expanded panel shows "Not answering since 27 Jun" and "Last result, 20 Jun". The run-start logic is in `promptPerformance.ts` and covered by the 50 tests. |
| 2 | Zero mentions with an answered prompt gives H2 with `k` and up to 3 neutral chips; `notYet` rows have no red X; expand shows `absent` cells and at most 5 competitors | PARTIAL, not checked at runtime | The demo client has mentions, so H1 rendered ("recommended in 9 of 20 prompts, best on Gemini (#2)"). I verified H2 in code only. In the demo, `notYet` row 20 shows "Engines named Sprout & Spoon" and no red X. I did not exercise a zero-mention fixture in the browser. |
| 3 | Default `best`; pressed pill or select shows it; four options reorder with no network request; survives reload; corrupt storage falls back to `best`; `#` runs 1 to N | PASS | At 1280, "Best performing" has `aria-pressed=true`. Choosing needs_work stored `brandgeo_aiv_sort_<id>` with 0 network requests. "Recently checked" persisted across a reload. A corrupted value fell back to best. Numbering read `1,2,...,24` with no gap. |
| 4 | Greyscale: six states distinguishable by glyph and word | PASS (code) | `PromptResultCell.tsx` STATE_CLASS: every state carries its own glyph and word, plus a dashed border on `no_answer`. I did not run the achromatopsia emulation. The distinction does not depend on colour. |
| 5 | Growth fixture shows exactly 2 locked columns per 5.7, headers link to `/account`; under 640px no locked tile and the strip lists every locked engine | PARTIAL | The demo is on the Free plan. At 1280 it showed exactly 2 locked headers, "Claude, available on Radar. See plans" and "ChatGPT, available on Essentials. See plans", both `Link to="/account"`. I did not check a Growth-plan fixture, and I did not read the strip contents under 640px. |
| 6 | Zero mentions: Knowledge, Sentiment and Accuracy show n/a with no bar, a neutral placeholder band, real 0% on the other three | PASS (code), not checked at runtime | `zeroMention` branch: NEEDS_MENTION_DIMS render `AIV_COPY.dimNeedsMention` with no bar. I did not render it in the browser. |
| 7 | Fix This shows real counts in P0 items and exactly one P0 when every engine is MISSING | **FAIL** | One P0 is correct (`AIVisibility.tsx:805-811`), but its description is `fixAllMissingLine` (`aiVisibilityCopy.ts:161-163`), which hard-codes `0`. Per `AIVisibility.tsx:690`, MISSING means pct below 25, so mentions above 0 are possible. See F1. |
| 8 | Category filter with no match shows CategoryEmpty, and its button restores all | PASS (code) | CategoryEmpty with a "Show all" button resets the category. I did not click through it at runtime. |
| 9 | While collecting, order and membership are frozen with a note shown; re-sort once on completion | NOT CHECKED at runtime | No collection is allowed in this review. In code, `frozenRef` holds order while `collecting` and the frozen-order note renders. |
| 10 | 375px: no horizontal scroll (real `scrollTo`), rows are cards, sort is a select | PASS | clientWidth 375. `scrollTo(600,0)` left scrollX at 0. main scrollLeft is 0 and scrollWidth equals clientWidth. No element overflows. `select#aiv-sort` is visible and the pill group is hidden. 20 row buttons render as stacked cards; the table header renders only when wide. |
| 11 | Keyboard: every row, section header, sort control and locked header reachable with a focus ring; no `tabIndex` on a div; headings h1 to h4 with no skips | PASS | Rows, section headers and pills are `button`s; locked headers are `Link`s. No div or span carries tabindex. Tab focuses an element with a 2px solid rgb(167,139,250) outline and `:focus-visible` true. Heading order: H1, H2, H2, H3 x3, H3, with no skip. |
| 12 | Contrast of every 11.1 pair re-measured in the running page, both themes | PARTIAL | Computed from the token values for 14 pairs, all at least 4.5:1 dark (lowest is absent cell 5.92) and at least 4.65 in the light approximation. Table below. Not re-measured from computed styles in the running page, and light mode's translucent backgrounds were alpha-composited over white rather than read. |
| 13 | Reduced motion: reorders, collapses and chevron instant, spinner static | PASS (code), not checked at runtime | 27 elements carry `motion-reduce:` classes in the live DOM, including the chevron `motion-reduce:transition-none` and the spinner `motion-reduce:animate-none` (`AIVisibility.tsx:2129`). I did not emulate `prefers-reduced-motion`. |
| 14 | Build 0, no dashes, no real names, score and planConfig unchanged | PASS | See Standard checks. |
| 15 | One `prompts` and one `ai_results` read per load, no new writes or invocations | PASS | `AIVisibility.tsx:449-450` matches HEAD lines 436-437. The `collection_runs` and cost reads at 594-599 are pre-existing and unchanged. The diff adds no `.from(`, `.insert(`, `.update(` or `fetch(`. |

**Spec items outside section 13 that also failed:** spec 5.2 line 210 (H3 admin label, F2) and spec line 73/138 (strings only in `aiVisibilityCopy.ts`, F3).

## Findings, ranked

### F1, MEDIUM: the all-MISSING Fix This card prints a false zero

- **Where:**
  - `aiVisibilityCopy.ts:161-163` (`appears in 0 of ${checked} ...`)
  - Called from `AIVisibility.tsx:810`
  - The path is chosen at `AIVisibility.tsx:805`
  - The threshold is `AIVisibility.tsx:690` (`pct >= 25 ? 'PARTIAL' : 'MISSING'`)
- **How it breaks:** a client with 4 active engines, each mentioning the brand in 1 of 5 answers (20%), gets all four engines classed `MISSING`. `allMissing` is true, so the page shows "Not yet recommended on any engine" and "{brand} appears in 0 of 20 answers across 4 engines". Meanwhile the score card and engine cards on the same page count 4 mentions. The customer sees two numbers that contradict each other, and the P0 one is false.
- **Exposure:** latent. In production, 32 of 38 clients are all-MISSING today and none of them has a mention. The first client whose engines all sit between 1% and 24% reaches it.
- **Fix (bg-app):** pass the real sum, `engineStatusCards.reduce((a, e) => a + e.mentioned, 0)`, into a copy function that takes the mention count. Or take the all-missing path only when every engine has `mentioned === 0`, and otherwise fall through to the per-engine `fixAppearsLine` items. The title "Not yet recommended on any engine" is also false in that case. If the all-MISSING-with-mentions case needs its own wording, that goes to bg-copy.

### F2, MEDIUM: the admin "Run Collection" button in the H3 headline wipes results

- **Where:**
  - `AIVisibility.tsx:2145-2149`: the button label is hard-coded "Run Collection" with a Play icon, and it uses the brand primary fill.
  - Its handler `runHeadlineAction` at `AIVisibility.tsx:1388` calls `forceCollection()` for admins.
  - `forceCollection` at `AIVisibility.tsx:376-380` calls `startCollection(activeClientId, true, ...)`, which is the same destructive call as the toolbar's "Force Refresh". The toolbar button at `AIVisibility.tsx:1465-1479` carries an explicit orange warning and the title "wipes existing results and re-runs all engines".
- **How it breaks:** an admin viewing a client whose prompts all sit in `unchecked` sees a primary button labelled with the non-destructive action. Clicking it deletes that client's existing rows, including the ok results that the 69 production error-newest cells still hold as "last result", and spends a full collection. Viewers are unaffected: they get `runCollection()`.
- **Spec:** section 5.2, line 210: "the page's existing collection action for the role (viewer "Run Collection", admin "Force Refresh"), same handler".
- **Fix (bg-app):** render the label and icon by role: admin gets "Force Refresh" with RotateCcw and the existing destructive styling. Both strings move into `aiVisibilityCopy.ts`.

### F3, LOW: strings outside `aiVisibilityCopy.ts`

- **Where:** `AIVisibility.tsx:2091` (`Your prompts`) and `AIVisibility.tsx:2149` (`Run Collection`) are new JSX literals in this build. Spec lines 73 and 138 put every new string in the copy file.
- **Fix:** move both into `AIV_COPY`. Other literals in the page were already present in HEAD and only moved, so they are not counted.

### F4, INFO: test file outside the section 14 write scope

- `tests/prompt_performance.test.js` is not in section 14's table. It is useful and should stay. Add it to the commit pathspec deliberately.

### F5, INFO: demo fixture mutates shared arrays

- `mockData.ts:219` (`mockPrompts.push(`) and `mockData.ts:247` (`mockAIResults.push(`) run at import time, so Mentions, Prompts, Dashboard and BrandSentiment also show the four new demo prompts in demo mode. This is demo only: `isDemoMode` is false in production. The new error rows carry `brand_mentioned: false`, and Dashboard's `buildScoreResultMap` skips error rows (`aiVisibilityScore.ts:219`), so Dashboard scores do not move.

### PRE-EXISTING (not blocking this release)

- **P1:** the `ai_results` read at `AIVisibility.tsx:450` is unbounded against PostgREST's 1000-row cap. One production client has 3543 rows in 60 days, so its oldest rows are cut, and with them potentially the true start of an error run (`since` could read later than reality for that client). This existed before this build. The new `since` logic inherits the truncation; it does not cause it. Owner bg-architect if paging is wanted.
- **P2:** the score-info button is an 11px hit target (measured at 375). It is unchanged by this build.

## Security

- No auth, RLS, billing or plan-gating code changed. No Netlify function, no `db/` file and no `_auth.js` is in the diff.
- `isRealAdmin` appears 0 times in both HEAD and the working tree, so it is not touched.
- The admin-only controls keep their gates. The panel buttons stay behind `isAdmin &&` with `stopPropagation`, and `handleRefreshEngine` (387) and `handleRefreshCell` (406) are unchanged in the diff.
- The new error-code text renders in the engine card's `title` for admins only.
- Server-side, `enqueue-collection.js` still gates on `requireAuth` and client ownership (lines 23 and 37). That file is unchanged.
- F2 is a UX safety defect in an admin-only path, not an authorization bypass.
- No secret appears in the added lines.

## Accessibility

**Contrast.** Each pair is listed with its dark-theme ratio and a light-theme approximation; the minimum target is 4.5:1.

| Pair | Dark | Light (approx.) |
|---|---|---|
| slate-400 on dark-800 | 6.96 | 7.58 |
| slate-400 on dark-900 | 7.45 | 7.09 |
| slate-400 on dark-700 | 5.71 | 6.29 |
| slate-200 chip on dark-700 | 11.87 | 12.15 |
| slate-200 on dark-900 | 15.49 | 13.69 |
| white on dark-900 | 19.09 | 16.71 |
| amber-400 card line on dark-800 | 10.69 | 5.02 |
| amber-400/80 since line | 7.16 | 5.02 |
| mentioned cell | 7.37 | 4.77 |
| absent cell | 5.92 | 5.66 |
| error cell | 9.14 | 4.65 |
| error since line | 6.35 | 4.65 |
| no_answer / pending cell | 6.49 | 5.60 |
| opportunity box | 6.49 | 7.04 |

Dark mode remaps `.text-slate-500/600` to rgb(148,163,184) (`index.css:151`), and the ratios above use that remap.

**Keyboard.** Every new interactive element is a native `button`, `select` or `Link`. Pressing Tab shows the violet 2px `:focus-visible` outline. No div or span carries `tabindex`.

**Headings.** H1, then H2 (Score, Your prompts), then H3 (three sections plus Category Breakdown). Nothing is skipped.

**Hit targets.** Section headers, category chips (under 640px), the sort select and the H3 button are all at least 44px. The one small target is P2, which is pre-existing.

**Screen reader text.** Each cell word is `aria-hidden` and has an sr-only sentence instead. Row 21 reads correctly: "Gemini has not answered since 27 Jun, last result 20 Jun".

**375px.** No horizontal scroll (Criterion 10).

## Regression surface (by grep)

- **The new modules:** `promptPerformance.ts`, `aiVisibilityCopy.ts` and `PromptResultCell.tsx` are imported only by `AIVisibility.tsx`, `PromptResultCell.tsx` and the test.
- **`mockData.ts`:** `mockPrompts` and `mockAIResults` are consumed by `Mentions.tsx`, `Prompts.tsx`, `Dashboard.tsx` and `BrandSentiment.tsx`, all in demo mode only (F5). Give the demo Prompts and Mentions pages a manual look before the next demo screenshot set.
- **`AIVisibility.tsx` handlers:** `forceCollection`, `handleRefreshEngine`, `handleRefreshCell`, the collection notices (`lastBlockReason`, `lastRunOutcome`) and `useCollectionLanded` reload are unchanged in the diff. The `if (loading) return` at line 875 comes after every hook; an awk scan found no hook below it.
- **Paths that need a manual look with a real admin login:** the H3 button (F2) and the per-cell and per-engine refresh in the expanded panel.

## Data and claim integrity

- **Headline numbers** ("9 of 20 prompts", "best on Gemini (#2)") come from the same loaded rows via `promptPerformance.ts`, and the counts match the section sizes (appear 9 open, notYet 11).
- **`brand_position` in production:** 0 rows hold 0 and 0 rows hold 99 or more, so there is no `#0` or sentinel rank risk. 682 mentioned rows hold a null position; these render without a rank.
- **Error codes in production, last 60 days:** quota_exceeded 1282, api_error 60, timeout 12. The code-aware card line handles each of these.
- **`model` column:** only 5 rows carry it, and the build does not depend on it.
- **F1** is the one untraceable number: the hard-coded 0.
- **New copy:** it makes no factual claim beyond counts and dates computed from the client's own rows.

## What was not checked

- **Light theme in the running page:** contrast was computed, not measured from computed styles. Light remaps of the translucent backgrounds were approximated.
- **768px viewport:** only 375 and 1280 were measured.
- **`prefers-reduced-motion` emulation at runtime:** code and class presence only.
- **Greyscale (achromatopsia) emulation:** code only.
- **Zero-mention client (H2, criterion 2, criterion 6) and a Growth-plan locked-column fixture (criterion 5):** neither was rendered.
- **The strip contents under 640px**, for criterion 5.
- **Frozen order during a live collection (criterion 9):** no collection is permitted from this seat.
- **A real admin and a real viewer session against production:** no agent holds admin credentials. `isAdmin` paths were checked in code only.
- **Screen reader output:** the sr text was read from the DOM; no screen reader was run.
- **Server enforcement of `force` for non-admins** in `enqueue-collection.js` beyond lines 23, 37 and 44: that file is unchanged.
- **The per-cell refresh and per-engine refresh at runtime:** they would call engines.
- **CDP stdout mojibake:** Romanian prompt text appeared as mojibake in the CDP output. I attribute it to the Windows console codepage of the probe output, not the page, but I did not verify that against a screenshot of those rows.

## Required to reach PASS

1. **F1:** use the real mention count, or route the all-MISSING-with-mentions case away from the zero line (bg-app, plus bg-copy if new wording is needed).
2. **F2:** in the H3 button, admins get the "Force Refresh" label, icon and destructive styling (bg-app).
3. **F3:** move the two new literals into `aiVisibilityCopy.ts` (bg-app, same pass).

Then re-run bg-verify on criterion 7, spec 5.2, and the dash and build rows only.
