# Phase 4 fix round, batch 1: independent re-review

Date: 2026-11-10
Reviewer: bg-verify (read-only on source; this file is the only write)
Verdict: **PASS WITH FINDINGS**

## 1. Scope

The uncommitted working tree diff of `brandgeo-dashboard/src` against HEAD
`d2fefcf` (equal to origin/main), lens "Phase 4 fix round, batch 1":

- `src/components/ui/Notice.tsx`, `Monogram.tsx`, `tableClasses.ts`, `Card.tsx`
- `src/components/Layout.tsx`
- `src/pages/Recommendations.tsx`, `src/pages/Competitors.tsx`
- `src/pages/AIVisibility.tsx`, the D1 and D2 parts only (the locked engine
  header cell and the track constants). The density change in the same file
  belongs to the other reviewer; I only checked that it did not undo D1 or D2.

Judged against `docs/qa/phase4-polish-review-2026-11-10.md` (section 4
findings and section 7 routing) and
`docs/design/phase3-visual/phase4-fix-rulings-2026-11-10.md`.

Method: read the full diff of each lens file, read the surrounding source,
read Tailwind 3.4.19 in `node_modules`, read the built stylesheet
`dist/assets/index-Ca4arzIv.css` (written 08:47Z, after the last source
edit at 08:44Z, so it reflects the final state), recomputed contrast from the
token triplets in `src/index.css`, and ran the new `initialsOf` logic in node
on a set of names. No build, tsc, dev server or browser was run, per the
task limits.

## 2. Status of each item

| Id | Status | Evidence |
|---|---|---|
| D1 | Closed | `AIVisibility.tsx:2418` the line 1 span is `max-w-full text-meta leading-tight text-ink-2 text-center break-words line-clamp-2`; no `whitespace-nowrap` remains in the cell. Track constants `:1123` `LOCKED_COL_MIN_REM = 5.25`, `:1124` `minmax(${LOCKED_COL_MIN_REM}rem, 5.5rem)`. `:1126` grid minimum formula unchanged, so 5 active plus 2 locked gives 2.5 + 13 + 17.5 + 10.5 = 43.5rem (696 px), matching the ruling. |
| D2 | Closed | `AIVisibility.tsx:2418` line 1 now prints `ENGINE_META[id].label`; `:2419-2422` line 2 wrapper `inline-flex max-w-full items-center justify-center gap-1 text-meta leading-tight text-ink-3`, `<Lock size={10} aria-hidden="true" className="shrink-0" />`, plan span `min-w-0 text-center`. Link `:2410` `flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 py-1.5 rounded-md hover:bg-surface-3 min-w-0`. All seven class strings are character for character the ruling's table. `aria-label` (`:2408`) and `title` (`:2409`) unchanged. |
| D1/D2 after the density change | Not undone | The header cell at `:2404-2423` is the ruled markup in the final file; the density change touches the engine strip (`lockedStripEngines`) and the fix list, not this cell or the track constants. |
| D3 | Closed | `Recommendations.tsx:443` passes `glyph={<StatusGlyph kind={st.tone} size={12} />}` for pos, warn and neg tones. STATUS_STYLE (`:218-223`) only has pos on `actioned`, so "Actioned" now carries the filled triangle; accent and neutral get none, as the review asked. `StatusGlyph` was already imported (`:40`) and is `aria-hidden` (`StatusGlyph.tsx:27`). |
| D4 | Closed | `Monogram.tsx:11-19` takes, per whitespace token, the first character that matches `/\p{L}\|\p{N}/u` and skips tokens with none. Node run: "Cedar & Ash Events" gives CA, "Sprout & Spoon" gives SS, a quoted or bracketed first word gives its first letter, "", "   " and "&" give "?". `tsconfig.json` target ES2020 supports the `u` flag property escapes. |
| D5 | Closed | `Notice.tsx:15-17` RULE strings are exactly the ruling's three literals. Tailwind 3.4.19 `lib/corePlugins.js:2637` issues separate `matchUtilities` calls for `border-*`, `border-x/y` and the side utilities, each taking a new offset (`lib/lib/setupContextUtils.js:437`). Measured in the built CSS: `.hover\:border-line-2:hover` at byte 59150, the side rules `hover:border-b-line` 59263, `hover:border-l-accent-ink` 59381, `hover:border-l-neg` 59509, `hover:border-l-warn` 59623, `hover:border-r-line` 59739, `hover:border-t-line` 59856, all later at equal specificity, so each side wins. The `!` fallback is not needed. Card and Notice props unchanged. |
| L2 | Closed | `Layout.tsx:709` `label-caps px-1 mb-1.5`. The spec said `px-3 mb-1`, but the label sits inside a `px-3` container (`:708`), exactly like "Collection market" (`:862` `px-1` row inside `:861` `px-3`), so both labels now sit at the same 16 px inset in the same register, which is what L2 asked. The 2 px `mb` difference from the spec is noted, not a finding. |
| L5 | Closed | `Layout.tsx:617` is the ruled string `block mt-1 text-meta text-ink-2 underline decoration-line-2 underline-offset-2 hover:text-ink hover:decoration-ink-3`. `decoration-line-2`, `underline-offset-2` and `hover:decoration-ink-3` all exist in the built CSS (bytes 37285, 37349, 62716). See F1 on the underline's own contrast. |
| L6 | Closed | `tableClasses.ts:7` wrap is `overflow-x-auto lg:overflow-clip rounded-card ...`. Built CSS `.lg\:overflow-clip{overflow:clip}` inside the lg media block, later than the base, so at 1024 px and up both axes clip to the rounded border box. `overflow: clip` does not create a scroll container, so the sticky `th` still sticks to `main`. Only consumer is `Competitors.tsx:405`; the table has no popover or tooltip that would need to escape vertically. |
| I9 | Closed | `Card.tsx:2-5` comment rewritten; `Layout.tsx:552-554` comment now says the logo row is `h-12`, which matches `:530`. See F3 for one wording nit. |
| I12 | Closed | `Competitors.tsx:58` `title={name}` on the truncating span. |
| I17 | Closed | `Layout.tsx:696-697` both locks `ml-auto !text-ink-3`. Built rule `.\!text-ink-3{...color:rgb(var(--ink-3) / ...)!important}` (byte 33022) beats the non-important `.nav-item:hover svg` and `.nav-item.is-active svg` (byte 55656). |

## 3. Guardrails

| Guardrail | Met | Evidence |
|---|---|---|
| G1 visuals only | Met (lens files) | The diffs of Notice, Monogram, Card, tableClasses, Layout, Recommendations and Competitors touch only className strings, comments, a `title` attribute, a `glyph` prop value and the pure `initialsOf` helper. No query, fetch, effect, results context or billing line changed. In AIVisibility the D1/D2 part changes two layout constants and one cell's markup. `initialsOf` is display only (the element is `aria-hidden`). |
| G2 no props change on a shared component | Met | No `interface` or props type line in any lens file appears in the diff. Notice, Card and Monogram signatures are byte identical to HEAD. |
| G3 theme safety | Met | 246 added lines across the whole src diff scanned with rg: 0 hex values, 0 `slate-`, 0 `white/`, 0 `black/`. Every new class reads a token declared in both `:root` and `html.light` (`index.css:9-52`, `:181-220`). |
| G4 no motion in anything Layout imports | Met | No import line added or removed anywhere in the src diff. |
| No em or en dash in added lines | Met | rg for the em dash and en dash characters on the 246 added lines: 0. Positive control on a sample containing one dash: 1. |
| Tailwind class validity | Met | Every new class in the lens is a complete literal. Arbitrary value `min-h-[44px]` is well formed. The colour keys used (`line`, `line-2`, `ink-3`, `warn`, `neg`, `accent-ink`) exist in `tailwind.config.js:15-56`; each new utility was found in the built CSS. |
| Dead code | None found | Monogram drops `.filter(Boolean)`; empty tokens fall through `find` to undefined, so behaviour holds. No unused import, variable or state introduced in the lens files. |

## 4. Contrast, recomputed from `src/index.css` tokens

| Pair | Dark | Light |
|---|---|---|
| Locked header line 1 `ink-2` on `surface-2` | 6.88:1 | 6.74:1 |
| Locked header line 2 `ink-3` on `surface-2` | 5.36:1 | 5.51:1 |
| Line 2 `ink-3` on hover fill `surface-3` | 4.97:1 | 5.13:1 |
| End-of-run link `ink-2` on `canvas` | 7.58:1 | 6.91:1 |
| Its underline `line-2` on `canvas` (non-text cue) | 1.57:1 | 1.45:1 |
| Its hover underline `ink-3` on `canvas` | 5.90:1 | 5.65:1 |
| Sidebar "Client" `label-caps` (`ink-3`) on nav surface | 5.90:1 | 5.65:1 |
| Nav lock `ink-3` on nav surface | 5.90:1 | 5.65:1 |

All text pairs pass 4.5:1 in both themes.

## 5. Accessibility of what changed

- Locked header Link: still a single focusable Link with its full
  `aria-label`; focus uses the global 2 px outline with 2 px offset. Its hit
  area grows from at least 44 px wide to at least 84 px wide and stays 44 px
  minimum height. The matrix is desktop only (`isWide`), so phone target size
  does not apply.
- The new Lock and the Recommendations glyph are `aria-hidden`; the visible
  word carries the meaning.
- The end-of-run link keeps its accessible name (the run sentence); the
  underline adds a non-colour cue without changing the name.
- No new interactive element without a name; no `aria-expanded` surface in
  the lens changed.

## 6. Findings

No BLOCKER, no MAJOR, no MEDIUM.

**F1. LOW. The L5 underline is barely visible at rest.** Owner: bg-design.
`Layout.tsx:617` `decoration-line-2` on `bg-canvas` (`:598`) is 1.57:1 dark
and 1.45:1 light. The ruling chose it to mark the text as a link "without
accent"; at that contrast the cue is close to invisible, so L5's failure
("reads as a status, not a link") is only partly relieved for pointer users
at rest. Not a WCAG failure: the link is a standalone block, not a link inside
running text, so 1.4.1 does not bind. Fix direction: `decoration-ink-3` at
rest (5.90:1 dark, 5.65:1 light) with `hover:decoration-ink`, or accept the
quiet underline as ruled.

**F2. INFO. Monogram can render three letters for a German sharp s.**
`Monogram.tsx:18` uppercases after joining, and `"ß".toUpperCase()` is "SS",
so a name starting with that letter gives three characters in a 20 px box.
Node run confirms "ß x" gives "SSX". Customer names starting with that
letter are unlikely. Fix direction: uppercase each letter and keep only its
first code point.

**F3. INFO. Card's new comment overstates.** `Card.tsx:3-4` says "Every Card
steps its border on hover", but since D5 a Notice holds its border colours on
hover by design. Fix direction: add "(Notice holds its rule, see Notice.tsx)".

**F4. INFO. Two unreachable branches in the D3 glyph test.**
`Recommendations.tsx:443` tests for `warn` and `neg`, which STATUS_STYLE
never yields. Harmless and future-proof; no action needed.

## 7. What I did not check

- No browser pass. The ruling's width arithmetic (lock plus "Essentials" at
  about 73 px inside a 76 px content box, "Growth PRO" wrapping at the space,
  "Google AI Overviews" clamping to two lines) is reproduced from the ruling's
  estimates, not measured. The Growth plan matrix at 768 and 1024 px that
  review section 7 item 4 asks for, and P4-9, P4-13, P4-20, P4-27 and P4-29,
  are still owed in a browser.
- Rendering of `overflow: clip` with `border-radius` and of the sticky header
  under it was reasoned from the CSS specification, not observed.
- Firefox "zoom text only" and real screen reader output.
- tsc, the node test suite and the build were not re-run (task limit); I
  relied on the built stylesheet on disk, whose timestamp postdates every
  source edit, for rule order and class presence.
- The AIVisibility density change, ReadoutRow.tsx and Stat.tsx, which are the
  other reviewer's lens.
- Items routed to fix_later (L1, L3, L4, L7 to L11), to owner rulings (I5 to
  I8, I10, I11) and accepted items (I13, I14) were not re-judged.
- Light mode was checked by construction (tokens in both themes), not on
  screen.
