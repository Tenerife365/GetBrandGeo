# Phase 5 density review, batch 2 (Overview trend mark, AI Visibility engine strip, Fix this columns)

Date: 2026-11-10
Reviewer: bg-verify (read-only on source)
Verdict: **PASS WITH FINDINGS** (0 blocker, 0 major, 0 medium, 4 low, 6 info)

## Scope

Working tree diff against HEAD `d2fefcf` (equal to origin/main), lens limited to:

- `brandgeo-dashboard/src/pages/AIVisibility.tsx` (Block 3 Engines strip, Block 4 Fix this hub, the `showFixHub` default, the `fixCursor` state, the `ChevronRight` import, plus the prompt matrix locked header that rides in the same file)
- `brandgeo-dashboard/src/components/ui/Stat.tsx` (the sparkline)
- `brandgeo-dashboard/src/components/ui/ReadoutRow.tsx`

Spec: `docs/design/phase3-visual/phase5-density-spec-2026-11-10.md` (D-1 to D-38, A1 to A12).
The other seven files in the diff (`Layout.tsx`, `Card.tsx`, `Monogram.tsx`, `Notice.tsx`, `tableClasses.ts`, `Competitors.tsx`, `Recommendations.tsx`) belong to other lenses and were read only for guardrail 4.

Method: read the full diff of the three files and the surrounding source; grep for every identifier the change touches; read the Tailwind 3.4.19 core plugin source for the one negative utility; computed contrast in node from the token values in `src/index.css`; ran a dash, hex and palette scan on the 225 added lines of the three files with `rg` and a positive control. No build, no tsc, no browser, per the task limits. The orchestrator's tsc, test, build and browser figures are cited where used and marked as not reproduced.

## Guardrails

| Guardrail | Result | Evidence |
|---|---|---|
| G1 visuals only, no query, fetch, effect, results context or billing change | Met | Grep of the AIVisibility diff for `supabase`, `useEffect`, `fetch(`, `.from(`, `rpc(`, `markFix`, `putFixRow`, `afterFixMoved`, `reopenFix`, `checkFixNow`, `buildFixItems`, `useResults` returns only the two `markFix(item, 'done')` and `markFix(item, 'dismissed')` calls, identical before and after (`AIVisibility.tsx:2127`, `:2137`). `fixItems`, `openFixItems` (`:846`) and `engineStatusCards` (`:701` to `:714`) are untouched. `Dashboard.tsx` has no diff. New state: `fixCursor` (`:365`), a UI cursor only. `showAllFixes` removed. |
| G2 no props change on a shared component | Met | `StatProps` diff is a JSDoc line only (`Stat.tsx:20`). `ReadoutRow` signature unchanged. `Badge` receives `className`, an existing prop (`Badge.tsx:12`). `Button` receives `className` and `aria-label` through `ButtonHTMLAttributes` (`Button.tsx:8`). |
| G3 theme through tokens | Met | `rg` for raw hex, `slate-`, `violet-`, `gray-`, `zinc-` on the 225 added lines: no hit. Spark uses `rgb(var(--ink-3))` stroke and `rgb(var(--ink-2))` dot (`Stat.tsx:51`, `:52`). Every new pair computed below passes 4.5:1 in both themes. |
| G4 no motion in anything Layout imports | Met | `Stat.tsx` and `ReadoutRow.tsx` import nothing from `motion`. Layout's import list (`Layout.tsx:1` to `:26`) pulls `Badge` and `SegmentedControl` from `ui/`, neither in this diff. The only "motion" text in the changed ui files is the Tailwind class `motion-reduce:transition-none` in `Card.tsx:28`. |
| No em or en dash in added lines | Met | `rg -c` with a character class holding U+2014 and U+2013 over the 225 added lines: no match (exit 1); a positive control line holding U+2014: 1 match. |
| Tailwind classes literal and valid | Met | Every new class is a complete literal or a ternary between two literals (refresh failed line; toggle `variant`). Arbitrary values well formed: `flex-[2_1_0%]`, `min-w-[46%]`, `min-w-[164px]`, `lg:max-w-[280px]`, `max-h-[176px]`, `min-h-[120px]`. `focus-visible:-outline-offset-2` is valid: `outlineOffset` is registered with `supportsNegativeValues: true` in `node_modules/tailwindcss/lib/corePlugins.js:3791` to `:3805` (v3.4.19), and its selector (0,2,0) outranks the global `:focus-visible` rule (0,1,0) at `index.css:427`. |
| Dead code | Met | `lockedChipEngines`, `showAllFixes`, `setShowAllFixes`: no reference left. `isWide` is still read by the prompt matrix (`:1187`, `:1423`, `:2372` to `:2389`). `SectionHeader`, `Lock`, `Clock`, `ChevronRight` all still used. `pickLockedColumns` still feeds `lockedColumns` for the matrix (`:774`, `:2404`). `.spark-fade` at `index.css:712` is now unused (accepted by D-13). |

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | Overview 1440: four equal tiles at most 120 px, no wedge, 64 by 24 line with end dot right of value, Active prompts empty slot | Met in code; height not reproduced | `ReadoutRow.tsx:11` cell is `relative overflow-hidden bg-surface p-5 min-h-[120px] min-w-0`; grid rows stretch. The area path, `preserveAspectRatio` and absolute positioning are gone; the svg is `width={64} height={24} viewBox="0 0 64 24"`, last child of the value row, `ml-auto self-center` (`Stat.tsx:44` to `:49`, `:77`). End `circle` at the last point (`Stat.tsx:52`). Active prompts passes no `spark` (`Dashboard.tsx:320`), so nothing renders. Content sum 16 + 8 + 36 + 4 + 16 plus 40 padding is 120 px; the orchestrator measured 120 px, not reproduced. |
| A2 | No spark at 1024 and 390, shown at 768 | Met in code | `hidden sm:block lg:hidden xl:block` (`Stat.tsx:49`): hidden below 640, shown 640 to 1023, hidden 1024 to 1279, shown from 1280. Overlap not checked in a browser. |
| A3 | Flat series centred, fewer than 3 points draws nothing | Met | `points.length < 3` returns null (`Stat.tsx:28`); `max === min` gives `y = H / 2` for every point (`Stat.tsx:37`). Coordinates rounded with `toFixed(2)`. |
| A4 | Your prompts at or above 760 px at 1440 with Fix this closed | Not reproduced; code supports | Hub closed by default (`:374`); the Engines block lost `SectionHeader` and the card padding. Orchestrator measured 682 px; I did not run a browser. |
| A5 | Engines card at most 130 px, one row, 1 and 7 engines | Partly superseded by the deviation; not reproduced | One flex row, no wrap (`:1892`). Active column stack: 12 + 20 + 4 + 28 + 4 + 16 + 4 + 16 + 12 = 116 px. Locked column 60 px at xl, about 108 px worst case between lg and xl when both labels wrap to two lines, so the row stays at 116. A warn line adds up to 36 px. The 7 active engine case (admin client) was not measured by anyone. |
| A6 | Every engine state still visible | Met | Unavailable: warn badge plus `engineNotAnsweringLine` plus retry meta text (`:1905` to `:1925`). Not measured: neutral badge plus sentence (`:1923`). Last attempt failed and partial keep the old conditions (`isMeasured && lastAttemptFailed`, then `isMeasured && !lastAttemptFailed && partialErrorEngines.has`, `:1903` to `:1909`), so precedence matches the old branch. Admin error code still reachable via `title` (`:1914`). Refresh failed line kept. Last checked date kept as the `mt-auto` footer. Admin refresh button unchanged with `after:-inset-[8px]`, 20 + 16 = 36 px hit area. The admin Engine Configuration modal (`:230`) is outside this block and untouched. Nothing lost its home. |
| A7 | Coming soon and locked on one meta line, locked links to /account, hit height 24 desktop, 44 phone | Superseded by the deviation, judged acceptable | Coming soon stays a meta line on the heading row (`:1883` to `:1888`). Locked engines are full-height columns in the strip, each a `Link to="/account"` with `aria-label` "ENGINE: unlock on PLAN" and a `title` (`:1997` to `:2016`). The hit area is the whole column: at least 124 px wide below lg, 96 px from lg, at least 60 px high, so it clears 44 px on phones. Visible text (engine name, plan name) is contained in the accessible name (WCAG 2.5.3). The focus ring is drawn inside with `-outline-offset-2`, so neither the `overflow-hidden` card nor the scroller can clip it. Q2 is moot. |
| A8 | Fix this starts closed, summary "2 P0, 5 P1, 5 P2", aria-expanded false, three columns at lg, stacked below | Met | `useState(false)` (`:374`). `fixSummary` drops zero counts and joins with ", " (`:848` to `:852`); the description switches on `showFixHub` and falls back to `FIX_COPY.allDone` (`:2031` to `:2033`). Toggle `aria-expanded={showFixHub}` (`:2041`), variant `secondary` when closed. Grid `grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line`. |
| A9 | Next advances and wraps, hidden at one item, focus stays; marking done brings the next | Met | `idx = Math.min(fixCursor[p], list.length - 1)` (`:2060`), so the cursor never points past the end; Next sets `(idx + 1) % list.length` from the clamped index (`:2080`) and renders only when `list.length > 1`. Next lives in the section header keyed by `p`, while only the item `div` is keyed by `item.id`, so Next keeps focus. A fixed item leaves `openFixItems`, so the same index shows the next one; `afterFixMoved` still sets `fixAnnounce` and moves focus to the always-mounted toggle (`:871` to `:874`). `FixItem.priority` is exactly `'P0' | 'P1' | 'P2'` (`src/lib/fixItems.ts:24`), so the three filters partition `openFixItems`: no item dropped, none duplicated. |
| A10 | Buttons pinned to column bottom; long fix scrolls and is reachable by Tab | Met (see L2) | Item `div` is `flex flex-col flex-1`, buttons `mt-auto pt-3`; fix box `max-h-[176px] overflow-y-auto` with `tabIndex={0}` (`:2100` to `:2102`). |
| A11 | No horizontal page scroll at 390 and 1440, strip scrolls inside its card | Not reproduced; code supports | Strip `overflow-x-auto` inside `Card className="overflow-hidden"` (`:1891`, `:1892`). Orchestrator reported no page scroll at 1024, 1280 and 1440; I did not run a browser. |
| A12 | Dark and light, no raw hex, no slate or violet, no dash, copy comments, tsc 0 | Met by construction; tsc not reproduced | Scans above. Contrast table below. All five new strings carry `copy: pending bg-copy`. tsc exit 0 is the orchestrator's figure; I was barred from running it. |

### Contrast, new text-on-surface pairs (computed from `index.css` tokens)

| Pair | Dark | Light |
|---|---|---|
| `label-caps` (ink-3) Engines heading on canvas | 5.90 | 5.65 |
| Coming soon meta, ink-3 on canvas | 5.90 | 5.65 |
| Locked name, ink-2 on surface / on surface-2 (hover) | 7.26 / 6.88 | 7.38 / 6.74 |
| Locked plan, ink-3 on surface / surface-2 | 5.66 / 5.36 | 6.03 / 5.51 |
| Engine meta line, ink-2 on surface | 7.26 | 7.38 |
| Warn line, warn on surface | 11.29 | 8.67 |
| Refresh failed, neg on surface | 7.01 | 8.02 |
| Fix counter and empty column, ink-3 on surface | 5.66 | 6.03 |
| Fix box text, ink-2 on surface-2 | 6.88 | 6.74 |

The sparkline is `aria-hidden` and `focusable="false"`, so 1.4.11 does not apply.

## The orchestrator's deviation (locked engines as strip columns)

Judged on its merits: **accepted**. It answers the request (all engines on one line) better than the spec's chip line, which the orchestrator measured at 234 px and 486 px. Checks made:

- Class validity: all literals; `flex-1 basis-0` is redundant (`flex-1` already sets a 0% basis) but harmless. `group` with `group-hover:text-ink` is valid.
- Link semantics: a real `react-router` `Link` to `/account`, one tab stop per locked engine, the accessible name carries the verb ("unlock on"), the title explains the plan.
- Focus: the negative offset keeps the 2 px ring inside the column; nothing clips it.
- `lockedCandidates` and `pickLockedColumns` (`src/lib/promptPerformance.ts:498` to `:507`) are unchanged; the strip uses the full list, the matrix still uses the first two. Consequence recorded as I2.
- Height: locked columns stretch to the active column height, so the strip stays one row of about 116 px in the common state.

## Findings

Ranked most severe first. None blocks the commit.

**L1, LOW, accessibility. Next swaps the fix silently for a screen reader user.** `AIVisibility.tsx:2071` to `:2083`. Focus stays on Next (good), but the counter `span` and the item are not in a live region, so after activating Next nothing is spoken; the user must navigate away to learn what changed. Fix direction (bg-app): `aria-live="polite"` on the counter span, or announce the new item title through the existing `fixAnnounce` region.

**L2, LOW, accessibility. The Recommended fix scroll box is named but has no role.** `AIVisibility.tsx:2099` to `:2105`. A `div` with `tabIndex={0}` and `aria-label` and no role is a generic element; ARIA 1.2 prohibits naming the generic role, so screen readers may announce only the text, or nothing, on focus. It also adds a tab stop per column even when the text does not overflow. The builder followed D-31 exactly, so this goes to bg-design first. Fix direction: `role="region"` with the existing `aria-label`, and optionally set `tabIndex` only when the content overflows.

**L3, LOW, content on phones. The engine meta line truncates retry guidance on touch screens.** `AIVisibility.tsx:1957`. Below 640 px a column is 46 percent of the strip, about 160 px wide less 24 px padding, so about 136 px of 12 px text. "Next run available" plus a date is about 30 characters, roughly 190 px, so it truncates, and the full text sits only in `title`, which touch users cannot reach. The same applies to "Not measured yet · run a collection to check this engine" and to long "N of M prompts, best #K" lines. Arithmetic only, not measured. Fix direction: `line-clamp-2` instead of `truncate` on this one line, or `line-clamp-2` below `sm` only.

**L4, LOW, accessibility, made more visible by this change. The hub toggle is named only "Show" or "Hide".** `AIVisibility.tsx:2035` to `:2044`. The label is pre-existing, but the hub now starts closed, so this button is the only way into Fix this, and a button list reads "Show, collapsed". Fix direction: an `aria-label` such as "Show fixes" or "Hide fixes" (copy: pending bg-copy), keeping "Show" visible.

**I1, INFO, undisclosed scope. The prompt matrix locked columns also changed.** `AIVisibility.tsx:1123` to `:1124` and the header at about `:2405` to `:2420`. `LOCKED_COL_MIN_REM` went from 2.75 to 5.25, the max width from 4.5rem to 5.5rem, and the header now shows the engine name, a lock and the plan. Visual only, and the accessible name ("ENGINE, available on PLAN. See plans") still contains the visible text, but with two locked columns `tableMinWidth` grows by 5rem, so the matrix starts scrolling sideways at a wider viewport than before. Not named in the task brief and not measured by me. Owner: the orchestrator, to confirm it was intended.

**I2, INFO. On wide screens the two matrix locked engines now appear twice.** Previously the chips excluded `lockedColumns` when `isWide`; now the strip shows every locked engine and the matrix still shows two. Deliberate per the brief; recorded so it is not re-filed.

**I3, INFO, copy.** The admin partial warn title still says "Use the refresh icon on this card" (`warnTitle`, about `:1910`); it is now a column. bg-copy.

**I4, INFO, copy.** The locked column dropped the visible word "Unlock" and the "Locked on your plan" label; the lock glyph and the plan name carry the meaning, and the link affordance is hover only. The accessible name is fine. bg-copy may want a visible verb.

**I5, INFO, data contract (spec Q1, still open).** Avg position plots raw values, so a better position draws lower. Also `avgPosSpark` gates on 2 or more points (`Dashboard.tsx:168`) while `Spark` now needs 3, so a 2-point series passes the gate and draws nothing. Harmless.

**I6, INFO.** `.spark-fade` (`index.css:712`) is now unused; D-13 accepted leaving it for a later CSS sweep.

## Strings marked copy: pending bg-copy (spec section 11)

| String | Location |
|---|---|
| Closed summary, `{n} {priority}` joined by ", " | `AIVisibility.tsx:848` to `:852` (`fixSummary`) |
| Column aria-label `{priority} fixes` | `AIVisibility.tsx:2067` |
| Counter `{index} of {total}` | `AIVisibility.tsx:2071` |
| Button `Next` and aria-label `Next {priority} fix` | `AIVisibility.tsx:2079` (aria-label), `:2082` (visible text) |
| `Nothing open at this priority` | `AIVisibility.tsx:2087` |

Existing strings in the same block that also carry the marker: the `Engines` heading (`:1882`) and `Coming soon: ...` (`:1886`).

## What I did not check

- Any browser measurement: tile heights, the 682 px and 1,142 px Your prompts positions, strip height, horizontal page scroll at 390, 1024, 1280 and 1440, sparkline overlap at 768. Cited from the orchestrator, not reproduced.
- The 7 active engine case on a real admin client (nobody measured it).
- Dark and light visually; only computed contrast from tokens.
- tsc, the node test suite and the build (barred by the task); the orchestrator's figures are cited, not reproduced.
- Screen reader behaviour of the strip, the Next button and the scroll box (L1 and L2 come from the ARIA rules, not a live screen reader).
- Whether the compiled stylesheet contains every new arbitrary class (no build run); validity was judged from the source literals and the Tailwind plugin source.
- The seven other files in the diff, beyond the motion import check for guardrail 4.
- Focus ring contrast of `--accent-ink` on the locked column hover surface (pre-existing token, not new).

## Amendment 2026-11-10, written from the orchestrator seat, not by the reviewer

After this review returned, a separate `bg-app` builder closed four LOW findings of this report and one of `docs/qa/phase4-fix-rereview-2026-11-10.md`. The orchestrator re-checked each in source and re-measured in demo mode. No second `bg-verify` run was made on these edits.

- L1, closed: the "N of M" counter in each Fix this column carries `aria-live="polite"` and `aria-atomic="true"`.
- L2, closed: the Recommended fix scroll box carries `role="region"` beside its `tabIndex` and `aria-label`.
- L3, closed: the engine meta line wraps to two lines on a phone (`line-clamp-2`) instead of being cut off; from 640 px it truncates with a `title` as before.
- L4, closed: the Fix this toggle carries `aria-expanded` and an `aria-label` of "Show fixes" or "Hide fixes"; the visible text is unchanged.
- F3 of the Phase 4 re-review, closed: the header comment in `Card.tsx` now states that every Card steps its border on hover and that Notice holds its own rule colours.

One figure in this report moved because of L3: on a 390 px phone "Your prompts" starts at 1,158 px, not 1,142 px, since the engine meta line now takes two lines. Desktop is unchanged at 682 px.

Checks on the final state, run by the orchestrator: `tsc` exit 0, 50 of 50 node test files pass, build exit 0, entry chunk `index-BW7QRgZx.js` 569.49 kB as printed by Vite.
