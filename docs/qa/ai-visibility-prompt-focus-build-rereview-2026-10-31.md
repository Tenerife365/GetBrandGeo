VERDICT: FAIL. F8 MEDIUM (blocking), F6 MEDIUM, F7 LOW, F9 to F11 INFO, P3 PRE-EXISTING LOW.

# AI Visibility prompt-first build: narrow re-review, 2026-10-31

Reviewer: bg-verify (Opus). This is a read-only review. No reviewed file was edited, no git command wrote anything, no SQL write ran, and no collection or engine call was triggered. In the demo render, zero POST requests were observed.

Under review:
- the working tree for `brandgeo-dashboard/src/pages/AIVisibility.tsx`
- the new untracked files `src/lib/aiVisibilityCopy.ts`, `src/lib/promptPerformance.ts`, `src/components/PromptResultCell.tsx` and `tests/prompt_performance.test.js`
- the `mockData.ts` push
- the copy deck `docs/copy/ai-visibility-prompt-focus-copy-2026-10-31.md`

Prior review: `docs/qa/ai-visibility-prompt-focus-build-review-2026-10-28.md` (FAIL, F1 to F4). Spec: `docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md`.

## Summary

All four findings from the prior review are closed. F1 to F3 are fixed in code, and F4 passes with 50 of 50 tests green.

The copy pass introduced one new false claim. It is in a string that every viewer sees under the prompt table (F8), and that alone blocks. A pre-existing Fix hub title next to the reworked description now reads as a direct contradiction, and that is live on a paying client today (F6). One headline string is latent-false and ungrammatical (F7). Build and type checks are green.

## 1. Previous findings, re-checked

| Item | Result | Evidence |
|---|---|---|
| F1 / criterion 7: all-MISSING Fix hub copy | CLOSED | `AIVisibility.tsx:805-830`. `allMissing` requires every card to be `MISSING` (`:805`). The title and description branch on `totalMentioned === 0`: zero mentions prints `fixAllMissingTitle` / `fixAllMissingLine` with a true 0; otherwise it prints `fixAllLowTitle` "Named in under 25% of answers on every engine" with the real summed `mentioned`/`checked`. Both sums come from `llmStats` (`:621-625`), the same source as the engine cards, so the counts agree with the cards. "Under 25%" holds because `MISSING` means `Math.round(m/c*100) < 25` (`:624`, `:690`), so the true rate is below 24.5%. In the mixed case (some engines at 0, some above 0 but still MISSING) every engine is still under 25%, so the title stays true. `UNAVAILABLE` and `NOT_MEASURED` cards are not `MISSING`, so they block `allMissing`. That is correct: "every engine" cannot be claimed over an engine that was never measured. |
| F2 / spec 5.2: H3 headline button | CLOSED | Handler `:1392`: `if (isAdmin) forceCollection(); else runCollection()`. Button at `:2145-2163`. Admin gets the orange destructive outline, a RotateCcw icon, the text `AIV_COPY.actionForceRefresh`, and `aria-label` and `title` set to `actionForceRefreshAria` ("Force refresh: wipes existing results and re-runs all engines"). Viewer gets the primary style, a Play icon and `actionRunCollection`, disabled during cooldown, with `CooldownCountdown`. Each label matches its handler: `forceCollection` calls `startCollection(id, true)`, `runCollection` calls `startCollection(id, false)` (`:376-381`). In view-as-user mode, `isAdmin` is the presentation flag (`clientContext.tsx:38-46`, `:350-361`), so a real admin sees exactly the viewer button and hint. That is the correct impersonation behaviour, and no server check depends on it. The aria-label contains the visible text "Force Refresh", so WCAG 2.5.3 label-in-name passes. |
| F3: "Your prompts" and "Run Collection" literals | CLOSED | `AIVisibility.tsx:2095` renders `{AIV_COPY.promptsHeading}`, and the button text comes from `AIV_COPY.actionRunCollection` / `actionForceRefresh`. The remaining literals in the added lines ("Add prompts", "No prompts yet", "Force Refresh to retry", "Run Collection to retry", "AI Top Results", "Next run available in") all exist verbatim in `HEAD`. They were moved, not added. |
| F4: tests exist and pass | PASS, with a commit condition | `node tests/prompt_performance.test.js` prints `50 passed, 0 failed`, exit 0. The file is untracked, so it must be named explicitly in the commit pathspec. |

## 2. New findings, ranked

### F8, MEDIUM, BLOCKING: the viewer hint makes a false claim about what Run Collection does

- **What.** `aiVisibilityCopy.ts:57` `viewerHint: 'Run Collection checks all your prompts again.'` is rendered for every non-admin under the prompt table (`AIVisibility.tsx:2382`). This string is new; it does not exist in `HEAD`.
- **Why it is false.**
  - A viewer's Run Collection sends `force: false` (`AIVisibility.tsx:1392`, `enqueue-collection.js:33`, `:74`).
  - With `force` false, `_enqueue.js:189-200` skips every (prompt, engine) pair already collected ok this calendar month (`.neq('status','error').gte('checked_at', monthStartIso())`). When nothing is left, it answers "nothing to collect (already up to date)".
  - So a run checks only the prompts with no ok result this month. It never checks all of them again.
  - The spec placeholder ("re-checks every prompt") was equally false, so the defect started in the spec.
- **How it breaks.** A viewer on a weekly plan whose prompts all have this month's results reads the hint, presses Run Collection, and gets nothing new. The page promised a fresh check of every prompt. On a product whose whole value is measured truth, that is a false claim in new customer-facing copy.
- **Demo observation.** At 1280 and 375, the rendered text is "Run Collection checks all your prompts again." (headless Chrome, demo mode, viewer path).
- **Fix (bg-copy, string only).** State what the code does, for example "Run Collection checks any prompt that has no result yet this month." If the product intends a full re-check, that is a bg-backend change to `force` semantics, which needs a ruling, not a copy edit.

### F6, MEDIUM, live on a paying client: "Not found in X" next to "appears in N of M answers"

- **What.** In the not-all-MISSING branch, every `MISSING` engine with `checked > 0` gets a P0 item. Its title is still the pre-existing `` `Not found in ${e.label}` `` (`AIVisibility.tsx:821`, unchanged from `HEAD:687`). The reworked description is `fixAppearsLine(brand, e.mentioned, e.checked, e.label)`, which states the true count.
- **Why it is false.** `MISSING` covers rates from 0 up to just under 25%. For an engine with mentions above 0, the title claims absence while the text under it says the brand appears. Before this build, the description said "appears in 0 of N ... You have no presence here", which was false in the same case. The build made the description honest and left the contradiction in the title.
- **Production, read-only SELECT 2026-10-31.**
  - Method: ok rows per engine per client, approximated by the plan's engines, ignoring `engines_enabled` and the 1000-row page cap.
  - One client is affected today, client 54. Its per-engine ok rows are chatgpt 9/55 (16%), claude 3/55, gemini 15/55 (27%, PARTIAL), google_ai 1/55, grok 3/55, perplexity 4/55 and ai_overview 0/51.
  - Its Fix hub would show five P0 items, four of them titled "Not found in ChatGPT / Claude / Google AI Mode / Grok / Perplexity" while their descriptions say the brand appears.
  - Zero clients are all-MISSING with mentions, so the F1 path has no live victim either way.
- **Fix (bg-app, wording from bg-copy).** Branch the title on `e.mentioned`:
  - at 0, keep the absence title;
  - above 0, use a copy-file title such as "Rarely named on ChatGPT (under 25% of answers)".
  - Both titles should move into `aiVisibilityCopy.ts`.

### F7, LOW, latent: H3 title claims no engine ever answered, and the reason line is ungrammatical

- **What.**
  - `aiVisibilityCopy.ts:14` `headlineUncheckedTitle: 'No engine has answered yet.'` shows for the unchecked headline variant.
  - The unchecked variant (`promptPerformance.ts` `buildHeadline`) is chosen from the newest cell per prompt and engine, including error cells. So a client whose engines answered earlier and are now all erroring (the 2026-10-06 OpenRouter outage pattern) gets "No engine has answered yet." That contradicts their own history.
  - The paired reason `headlineUncheckedReason` (`:104`) renders "X did not answer since DATE". English needs "has not answered since".
- **Production.** Zero clients are in H3 with earlier answers today, so this is latent.
- **Fix (bg-copy).** Use "No engine is answering right now." when earlier ok rows exist, and keep "No engine has answered yet." when none exist. Reword the reason to "X has not answered since DATE." Distinguishing the two cases needs a `previousOk` flag from bg-app, which `promptPerformance.ts` already computes per cell.

### INFO

- **F9.** `aiVisibilityCopy.ts:12` `headlineNotYetTail` has 0 uses outside its definition. Delete it, or use it.
- **F10.** `aiVisibilityCopy.ts:64` `fixAllLowTitle` is indented four spaces where its siblings use two. Cosmetic.
- **F11.** The build left untracked artifacts in `brandgeo-dashboard/`: `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo`, `vite.config.js` and `vite.config.d.ts`. They must stay out of the commit pathspec. `vite.config.js` beside `vite.config.ts` could shadow the real config on a later build if committed.

## 3. Security

- **No new finding in the diff.** The page changes are presentation only:
  - no new Supabase write path;
  - no new function call shape (it still uses `startCollection` with the same two `force` values);
  - no token handling.
- **Plan gating.** `isRealAdmin` is not weakened, and every server decision still rests on the real JWT (`enqueue-collection.js` runs `requireAuth`, the ownership check for non-admins, the cooldown for non-admins and `checkCollectionLimits`).
- **Unauthenticated callers.** They get 401 from `requireAuth` before any read. Not re-probed live this pass, since the function is unchanged since `610552c`.
- **Secret scan.** Run over the added lines plus the four new files with `api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role`: 0 hits.
- **P3, PRE-EXISTING LOW, not in this diff.** `enqueue-collection.js:33` accepts `force: true` from a viewer for their own client. Only the cooldown and limits gate it. With `force` true and a manual trigger, `_enqueue.js` deletes existing rows (`replaceExisting`). So a viewer can wipe their own client's history from devtools.
  - Not cross-tenant: the ownership check holds.
  - Fix (bg-backend): coerce `force` to false for non-admins server-side.

## 4. Accessibility

- **Contrast.** No new colour pairs beyond those measured in the prior review. The orange destructive outline and the brand primary reuse the toolbar's existing classes. The viewer hint is `text-slate-400` at 12px on `bg-dark` canvas, the same pair the prior review measured as passing.
- **Label-in-name.** Passes for the admin H3 button (see F2).
- **Hit targets.** The demo headline-area Run Collection button measured 145 x 38 at 1280 and 128 x 58 at 375 (wrapping). The 38px height at 1280 is under 44, but it is the toolbar button already in `HEAD`, not new.
- **Keyboard.** The H3 button is a native `<button>`, so it is reachable.
- **Heading order.** Rendered as H1 "AI Visibility", H2 "AI Visibility Score", H2 "Your prompts", H3 for the sections, H3 "Category Breakdown". No skipped level.
- **Horizontal scroll.** None at 375. A real `window.scrollTo(600,0)` left `scrollX` at 0, `main.scrollLeft` stayed 0, and 0 non-fixed elements extended past the viewport. The longest row chip, "not answering since 27 Jun", ends at x=291 of 375.

## 5. Regression surface (grep)

- `aiVisibilityCopy.ts`, `promptPerformance.ts` and `PromptResultCell.tsx` are imported only by `AIVisibility.tsx` and the test file. No other page imports them.
- `mockData.ts` is read by every demo page. Its push adds rows only, and the demo renders AI Visibility with 0 page exceptions.
- `startCollection` / `collectionContext.tsx` is unchanged.
- Manual look owed:
  - `AIVisibility.tsx` as an admin, both the H3 state and the toolbar, because demo never sets `isAdmin`;
  - the light theme.

## 6. Data and claim integrity

- "Under 25%" traces to the `MISSING` threshold (`AIVisibility.tsx:690`) and `Math.round` (`:624`). True.
- The all-low counts trace to the `llmStats` sums. They match the engine cards.
- The demo headline "Your brand is recommended in 9 of 20 prompts, best on Gemini (#2)." agrees with the section count "Where you appear 9 prompts" on the same render.
- `viewerHint` is untraceable to the code's behaviour, and contradicted by `_enqueue.js:189-200`: F8.
- The "Not found in X" title is contradicted by its own description when mentions are above 0: F6.
- The other changed strings were checked against the code and are honest:
  - `competitorHeading` and `competitorEmpty`;
  - `legendAbsent`;
  - `dimNeedsMention`;
  - `promptsLoadError`: a failed read keeps the screen and changes no data;
  - `sectionUncheckedExtra`;
  - the `engineNotAnsweringLine` codes.
- Every interpolated variable in every copy function is used.

## 7. Standard checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0, built in 6.40s. The only warning is the pre-existing chunk over 500 kB (`index-BNDCyyC1.js` 1,697.57 kB). |
| Dash scan (`rg -n '\x{2014}\|\x{2013}'`) | 0 hits in `aiVisibilityCopy.ts`, `promptPerformance.ts`, `PromptResultCell.tsx`, the test file and the copy deck. `AIVisibility.tsx` has 25 hits, all in comments, and `HEAD` also has 25. The added lines have 0 (rg exit 1). The positive control fired (1 hit, exit 0). |
| Tests | `tests/prompt_performance.test.js`: 50 passed, 0 failed |
| Demo render (vite `--mode demo`, port 5197, headless Chrome over CDP, 1280 and 375) | Viewer path renders. 0 page exceptions and 0 app console errors. The only errors are 4 from the third-party askmywebsiteai widget refusing a localhost origin, which is expected and pre-existing. 0 POST requests. |

## 8. What was not checked

- **The admin path at runtime.** Demo never sets `isAdmin`, and no agent holds an admin login. So the H3 Force Refresh button, its destructive style and its aria label were verified from source only.
- **The H3 headline state in the browser.** Demo data lands in the "recommended" variant, so the H3 button was checked from source only.
- **The light theme, and 768px.**
- **Server-side `force` behaviour.** No collection was run by design, so the F8 semantics come from reading `_enqueue.js`, not from execution.
- **The production SELECT for F6 and F7 is an approximation.** It assumed plan engines without `engines_enabled` overrides and ignored the page's 1000-row cap.
- **Non-ASCII rendering.** The probe output showed Romanian diacritics as mojibake, a console-encoding artefact of the probe, not checked in a real browser.
- **Contrast of any pair not new in this build.**

## 9. Required to reach PASS

1. **F8:** bg-copy rewords `viewerHint` to match the code (or Constantin rules that Run Collection should re-check everything, and bg-backend builds it).
2. **F6:** bg-app branches the per-engine P0 title on `e.mentioned`, with both titles in `aiVisibilityCopy.ts` worded by bg-copy.
3. **F7:** bg-copy fixes the reason grammar. The split title is recommended alongside it, and can follow as LOW.
4. **Commit:** the pathspec names `tests/prompt_performance.test.js` and the three new `src/` files, and excludes the four build artifacts (F11).
