PASS WITH FINDINGS

# Tactile layer, rules lens review (bg-verify, read-only), 2026-11-16

INTENT: review tactile layer (uncommitted)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify

Subject: working tree vs HEAD for `brandgeo-dashboard/src/index.css`,
`src/components/GlowScoreDial.tsx`, `src/pages/AIVisibility.tsx`,
`src/pages/Dashboard.tsx`, `tests/tokens_sync.test.js` (5 files, +326 / -72).
`Layout.tsx`, `Account.tsx`, `clientContext.tsx` belong to another session and
were not reviewed. Brief: `tactile-brief-2026-11-16.md` (side-session notes);
step 5 (sidebar) is not built, as intended.

Counts: 0 blocker, 0 major, 1 medium, 4 low, 4 info.

## 1. Checks run

| Check | Result |
|---|---|
| `npx tsc --noEmit` (brandgeo-dashboard) | exit 0 |
| `node tests/tokens_sync.test.js` | `225 passed, 0 failed` |
| Related node tests (`client_switch_guards`, `fix_items`, `no_answer_rows`, `page_sequencing`, `views_a`) | all pass |
| Dash scan, `rg` for U+2014 and U+2013 on added lines of the 5 files | 0 hits; positive control on a test string: 1 hit |
| Secret pattern scan on the diff | 14 hits, all the word "token" (`TACTILE_TOKENS`, "tactile token"); no secret |
| `npm run build` | not run (writes `dist/`; caller asked for no writes outside docs/qa) |
| Browser, layout measurement | not run (no server or browser allowed) |

## 2. Binding rules

| # | Rule | Verdict | Evidence |
|---|---|---|---|
| 1 | Visuals only, no shared props change | PASS | Diff touches no query, effect, context or billing line. `git diff --stat -- src/components/ui` is empty. `GlowScoreDialProps` unchanged; its one `useEffect` unchanged, ticks derive from existing `drawn` state. `className` passed to `Button` and `SegmentedControl`, both already accept it (`Button.tsx:41`, `SegmentedControl.tsx:26`). |
| 2 | Semantic tokens only, both themes, test enforced | PASS (see F2) | 17 tactile tokens declared in `:root` (`index.css:108-130`) and `html.light` (`:305-323`); test asserts presence and triplet shape per theme. Every new class body reads `var(--...)`, `currentColor` or `transparent`; no raw colour in a class body. |
| 3 | No `motion` in Layout's imports, no `scrollIntoView` | PASS | No added line matches `scrollIntoView`, `from 'motion` or `whileHover`. Layout imports neither `GlowScoreDial` nor `AIVisibility`. The brief's `motion.div whileHover` was not built. |
| 4 | No new blur | PASS | No added line contains `backdrop`. The brief's 20px blur on `.glass-card` was not applied; engine cards keep `glass-lite`. |
| 5 | `ui/ScoreDial` unchanged, no gradient or glow on Overview | PASS | `src/components/ui` has no diff. Overview's only change is a `className` on its refresh button (`Dashboard.tsx:189`). |
| 6 | Copy unchanged | PASS | Badge words still "Often named", "Sometimes named", "Rarely named" (`AIVisibility.tsx:2125-2127`). No new visible string; added text is comments and `aria-hidden` decoration. |
| 7 | Budget pill admin only, never in demo | PASS | Gate line `isAdmin && !isDemoMode && collectionAllowance.budgetCapEur > 0` is unchanged context in the diff (`AIVisibility.tsx:2049`); only the frame class changed. |
| 8 | No em or en dash in added lines | PASS | Scan above. |
| 9 | Engines one row, prompts early | PASS for the row, NOT MEASURED for the position (F4) | Rail `flex gap-3 overflow-x-auto snap-x` unchanged (`AIVisibility.tsx:2121`); the brief's `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` was not built. |

## 3. Findings

**F1, MEDIUM. The cited spec does not exist.**
`index.css:108`, `index.css:1013`, `GlowScoreDial.tsx:5` and
`tokens_sync.test.js:159` cite `docs/design/phase3-visual/tactile-layer-2026-11-16.md`;
`ls docs/design/phase3-visual/` has no such file, tracked or untracked. Every
earlier visual pass (glass layer, Phase 4, density) shipped with its spec and
record, and the rulings taken here (no grid, no `whileHover`, no blur, #1 stays
violet, brief literals turned into tokens, sidebar deferred) exist only in the
builder's head. A public repo comment pointing at nothing is also the stale
reference pattern this project keeps paying for.
Fix: bg-design writes the spec and record (token table both themes, class list,
"where the brief and a rule disagreed", what was deferred, measurements) before
the commit, in the same commit. Otherwise change the four citations to the
brief's own location.

**F2, LOW. The brief literal check misses the brief's most likely leak path.**
`tokens_sync.test.js:197-208`. Positive controls run against the regex: it
fires on `shadow-[0_0_10px_rgba(99,102,241,0.45)]`, the emerald rgba,
`#818CF8`, `rgb(6 8 15)`. It does NOT fire on the brief's palette classes
`from-indigo-500 via-violet-500 to-purple-400`, on `rgb(79 70 229)` (the
brief's keycap bottom stop), on `rgba(246, 246, 251` (light glass), or on the
slate base in space syntax `rgb(15 23 42 / 0.06)`. A builder following step 2
of the brief literally would pass the test.
Fix: add `79 70 229` and `246,\s*246,\s*251` to the regex, accept both comma
and space syntax for `15 23 42`, and add a scoped check that `AIVisibility.tsx`,
`GlowScoreDial.tsx`, `PromptResultCell.tsx` and `Dashboard.tsx` contain no
`(from|via|to|bg|text|ring|shadow)-(indigo|violet|purple|emerald)-\d+`
(palette classes are used elsewhere in `src/`, pre-existing, so scope it to
these files).

**F3, LOW. The unlayered check guards one class of eight.**
`tokens_sync.test.js:209-216` measures brace depth only before
`.tactile-btn-primary {`. If `.tactile-btn-secondary` were moved into
`@layer components`, Tailwind 3.4 (`package.json`) hoists it ahead of the
utilities and Button's `bg-surface-2` / `hover:bg-surface-3` would win the
background colour. The reasoning in the test is right (Tailwind 3 `@layer` is
hoisting, not native layers, so "unlayered and after `@tailwind utilities`" is
the correct property); only its coverage is narrow.
Fix: loop the depth check over `.tactile-btn-primary`, `.tactile-btn-secondary`,
`.recessed-well`, `.recessed-input`, `.recessed-channel`, `.seg-well`.

**F4, LOW. The prompts position was not measured.**
Rule 9 and every pass since 2026-11-10 record where "Your prompts" starts
(baseline after `2a5af74`: 757 px at 1440, 867 px at 1024, 1,259 px at 390,
Fix this closed). This diff makes each engine card taller (squircle 28 to 32 px
at `AIVisibility.tsx:2173`; the 1 px trace line becomes a 6 px groove inside a
new `mt-auto` stack with a 6 px gap) and each dimension track 6 to 8 px
(`AIVisibility.tsx:2086`). By arithmetic roughly 10 to 15 px; also the LED adds
15 px of width to the percentage and badge row, which may wrap more often on a
164 px card. Not measured by builder or reviewer.
Fix: before the push, measure the heading at 1440, 1024, 390, dark and light,
Fix this closed and open, plus no sideways scroll of the window or `<main>`,
in headless Chrome over CDP, demo mode.

**F5, LOW. The glass layer spec still lists the five removed classes as live.**
`docs/design/phase3-visual/glass-layer-2026-11-15.md:41-43` names
`.glow-bar-track`, `.glow-line`, `.glass-pill`, `.glass-squircle`,
`.glass-input`. Removal itself is clean: `rg` over `src/` and `tests/` returns
0 uses of any of the five, and the reduced motion block was updated with them.
Fix: one amendment line in that spec pointing at the tactile spec (F1).

**F6, INFO. `.recessed-pill-active` is dead on arrival.**
Defined at `index.css:1058`, used nowhere in `src/`; `.seg-well ... [aria-checked="true"]`
(`index.css:1076`) repeats its body. Keep it only if the deferred sidebar step
will use it, and say so in the spec; otherwise drop it.

**F7, INFO. Keeping #1 on the violet pair is the right call.**
`PromptResultCell.tsx:50` renders "mentioned" as `cell-soft text-pos-ink`, a
pos tint (`index.css` `.cell-soft`, `rgb(var(--pos) / 0.1)`). The brief's
emerald `#1` bezel (`bg-pos-tint text-pos-ink ring-1 ...`) is the same hue
family and the same tint, so #1 would differ from an ordinary mention only by a
ring and a shadow: a weaker cue than today, and one a colour vision deficient
viewer loses first. The violet fill with white text keeps a hue and a luminance
step (white on `--accent-strong` 5.7:1, test-checked). The legend key reuses
`.cell-top` (`PromptResultCell.tsx:80-84`), so key and cell cannot drift. The
new `.cell-top` shadow reads only tokens (`--key-shade`, `--accent-strong`,
`--glow`).

**F8, INFO. Precedence of the unlayered block, checked and clean.**
`.recessed-input:focus { outline: none }` (`index.css:1091`, specificity
0,2,0) loses to `input:focus-visible:focus-visible` (0,2,1, `index.css:534`),
so the 2 px focus outline survives. Focus everywhere is outline based
(`index.css:432`, `:522`), so the keycap and pill `box-shadow` overrides never
erase a focus ring. `disabled:pointer-events-none` in `buttonClasses`
(`Button.tsx:20`) stops the hover lift on a disabled Run collection. The admin
Force Refresh keeps `text-neg` on the keycap (7.01:1 dark, 7.17:1 light). The
unlayered `transition` and `:active transform` deliberately replace Button's
`transition-colors` and `active:scale-[0.98]`.

**F9, INFO. Hover brightness dips below 4.5:1 only where there is no text.**
`.tactile-btn-primary:hover` adds `filter: brightness(1.07)`. Computed from the
tokens: white on the dark top stop goes 4.95 to 4.45:1 at the very top edge,
4.80:1 at 25 percent of the height and 5.11:1 at mid height; light stays at
5.11:1 or more. The glyph band passes; the test asserts the rest state only.
Optional: 1.05, or add the hover case to the test.

Token pairs computed for the new surfaces (rest state), all above threshold:
pill `--edge` against well 3.70 dark / 3.06 light (the selected segment's 3:1
cue, light is tight); `--ink-2` on well 7.71 / 6.18; `--ink-3` (search
placeholder) on well 6.00 / 5.05; `--ink-2` on keycap 7.26 / 6.60.

## 4. Regression surface (by grep)

`GlowScoreDial` is imported only by `AIVisibility.tsx`. The removed classes
have no importer. The new classes are used only in `AIVisibility.tsx`,
`GlowScoreDial.tsx` and one button in `Dashboard.tsx` (16 uses). `.cell-top`
is shared by every #1 cell and the legend key through `PromptResultCell.tsx`.
`.glow-bar-fill` is now drawn inside `.recessed-channel` in two places (score
dimensions, engine card foot). Manual look owed: AI Visibility (score card,
engine row, sort control desktop and the phone `<select>`), Overview refresh
button.

## 5. Not checked

- Any rendering: no browser was started, so no pixel, overflow, wrap or
  heading position figure in this report is measured (F4).
- `npm run build` and the entry chunk size.
- The phone `<select>` with a gradient `background-image` on iOS Safari and
  Android Chrome (native arrow rendering).
- A screen reader, Firefox, a real phone, a seven engine client, the signed in
  admin view (budget pill in its new well).
- The accessibility lens (hit targets, keyboard paths, contrast of every box)
  beyond the token pairs computed above.

## Amendment (orchestrator seat, 2026-11-16, not a second review)

- F1 closed: `docs/design/phase3-visual/tactile-layer-2026-11-16.md` was
  written while this review ran; it records the tokens, the classes, the
  eleven places the brief lost to a rule, and the measurements.
- F2 closed: the raw value check in `tests/tokens_sync.test.js` now matches
  comma or space separated `rgb()` and `rgba()` (adds `79 70 229`,
  `246 246 251`, the slate value with spaces, `#4f46e5`), and a scoped check
  bans `from-indigo-500`, `via-violet-500`, `to-purple-400` and
  `ring-pos-ink/40` in the four touched components. Positive controls run:
  a probe with `rgb(79 70 229)`, one with `rgba(246, 246, 251, 0.88)` and a
  palette class appended to `Dashboard.tsx` each failed the test, then were
  removed.
- F3 closed: the unlayered check loops over all ten tactile selectors.
- F4 closed by measurement in headless Chrome over CDP, demo mode, against
  HEAD served from a detached worktree with the same script: "Your prompts"
  moved +15 px at 1440 (757 to 772) and 1024 (867 to 882) and +21 px at 390
  (1,315 to 1,336 including the 56 px top bar), both themes. No sideways
  scroll of the window or `<main>`; no engine card element spills.
- F5 closed: `glass-layer-2026-11-15.md` now notes the five removed classes.
- F6 closed: `.recessed-pill-active` and the `.seg-well` selected segment
  share one rule.
- F7 to F9: no change.
Re-run after the fixes: `tsc` exit 0, all node test files pass
(`tokens_sync` 237 checks), build exit 0.
