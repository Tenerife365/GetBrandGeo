VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 1 medium, 3 low, 7 info)

# Glass layer review, rules compliance and correctness lens (2026-11-15)

Reviewer: bg-verify, read-only. Subject: UNCOMMITTED working-tree changes in
`brandgeo-dashboard/` to `src/index.css`, `tailwind.config.js`,
`tests/tokens_sync.test.js`, `src/pages/AIVisibility.tsx`,
`src/components/Layout.tsx`, `src/components/PromptResultCell.tsx`, plus the
untracked `src/components/GlowScoreDial.tsx`. I read the whole diff (6 files,
569 insertions, 112 deletions) and the new 76-line file. I edited no reviewed
file and ran no git command that changes state. I did not run a build, tsc,
vite or a browser, because the brief forbids them.

## Scope check

`git status --short -- src tests netlify tailwind.config.js` lists the six
files above, the new `GlowScoreDial.tsx`, and **one more file:
`netlify/functions/unlock-audit-report.js` (+39 lines)**. That file is not part
of this change. It is recorded in CLAUDE.md as dirty from another session.
It must stay out of this commit (see I5). `git diff --stat -- src/lib
src/components/ui` is empty.

## Binding rules table

| # | Rule | Result | Evidence |
|---|---|---|---|
| 1 | Colours from semantic tokens only; tokens_sync green | PASS | `node tests/tokens_sync.test.js` printed `169 passed, 0 failed`, exit 0. Every glass token is declared in `:root` (index.css:87-106) and in `html.light` (index.css:260-279). A scan of index.css from line 793 to the end for `rgb(<digit>` or a hex value returns nothing, so no class rule hard-codes a colour. A scan of the added TSX lines for `#hex`, `rgb(` or `[#` returns nothing. GlowScoreDial reads `rgb(var(--grad-*))`, `--glow` and `--surface-3` only. |
| 2 | Nothing Layout imports uses motion | PASS | Layout.tsx's import block (lines 1-33) has no diff. Every Layout change is a class string plus the `LOCATIONS_WELL` const. `PromptResultCell` (imported only by AIVisibility.tsx) and `GlowScoreDial` import nothing from `motion`. `AIVisibility` is `lazy()` at App.tsx:26. |
| 3 | No props change to a shared `ui/` component | PASS | `git diff --stat -- src/components/ui` is empty. The HeroAnswer glass comes from a wrapper descendant rule, not a prop. `GlowScoreDial` is a separate component. The only signature change in `PromptResultCell.tsx` is to the internal `Glyph` (adds `top`), and `PromptResultCell` is not under `ui/`; its `Props` interface is unchanged. |
| 4 | Never scrollIntoView | PASS | `grep scrollIntoView` over AIVisibility.tsx, GlowScoreDial.tsx, PromptResultCell.tsx and Layout.tsx finds nothing. |
| 5 | Euro budget admin only, never to a viewer, never in demo | PASS | Pill: AIVisibility.tsx:2026 `isAdmin && !isDemoMode && collectionAllowance.budgetCapEur > 0`. Fallback row for a client with no prompts: line 1919 `!isDemoMode && isAdmin && prompts.length === 0 && budgetCapEur > 0`. Viewer row: line 1929 `!isDemoMode && !isAdmin`. Section (c) below traces every case. |
| 6 | "Your prompts" may move down at most about 100 px | NOT CHECKED | A browser was forbidden. The builder's figures (+75 at 1440, +83 at 390, +71 and +79 with Fix this open) are inside the limit but were not reproduced. |
| 7 | backdrop-filter only on the sidebar or large surfaces, with a solid fallback; reduced motion respected | PASS | Blur is applied by `.glass-card` (index.css:803ff), by `.hero-ambient-mesh > .rounded-card` (843) and by `.matrix-head` (906). Every small card adds `.glass-lite`, which sets `backdrop-filter: none`. The sidebar has no blur. The `@supports not` block at 982-985 is unlayered and placed after the layered rules, so it wins at equal specificity. Reduced motion: index.css:987-990, `motion-reduce:transition-none` on the dial, `motion-reduce:animate-none` on the spinner, and `MotionConfig reducedMotion="user"` at App.tsx:267 for the engine card entrance. |
| 8 | No change to queries, resultsContext, metrics, billing, aiVisibilityScore, competitorFilter, fixPrompt, keysetRead; search client side only | PASS | Of those, only `src/lib` would be touched, and its diff is empty. The `+`/`-` lines of the AIVisibility diff contain no `supabase.`, `.from(`, `.rpc(`, `readAllById` or `computeAiVisibilityScore`. Search is the single `.filter` at AIVisibility.tsx:855 over `prompts` already in memory. |
| 9 | No em or en dash in added text; new strings marked `copy: pending bg-copy` | PASS | 645 added lines (the `+` lines of the diff plus GlowScoreDial.tsx) were scanned with `rg -n "[\x{2014}\x{2013}]"`: exit 1, no match. Positive control: a file holding one em dash and one en dash gave `rg -c` = 1, exit 0, so the pattern fires. The new strings "Search prompts", the placeholder, "Top fix:", "No prompts match", "Clear search", the sr-only count and "Not measured yet" each carry the marker. The design note was scanned too: no dashes. |
| 10 | Admin-only controls stay admin only | PASS | The engine refresh stays inside `{isAdmin && (<button` (AIVisibility.tsx:2145). Force refresh (`heroAction`, line 1714) is unchanged. No `isAdmin` or `isDemoMode` gate was removed without being re-added on the same path (diff lines listed in section c). |

## Findings

| id | severity | file:line | finding | evidence | suggested fix |
|---|---|---|---|---|---|
| M1 | MEDIUM | src/pages/AIVisibility.tsx:2801-2822 (with 855) | Search matches inside a collapsed "Not named yet" or "Not checked" section stay hidden. When the query filters every row out of the appear card, that card unmounts. If the match sits in the `notYet` section, all the user sees is that section's closed `Disclosure` header. The screen reader meanwhile announces "1 of N prompts shown". | `Disclosure` keeps its own `useState(defaultOpen)` (ui/Disclosure.tsx:20). Its key, `` `notYet-${activeClientId ?? ''}` ``, does not change with the query, so a section that is already mounted and closed stays closed. `setSectionOpen` is only ever reset (line 665) and is never written on toggle. Repro: a client with appear rows and notYet rows (notYet is closed by default per `sectionIsOpen`); type part of a notYet prompt's text. The first new feature a user tries can look like "no result". The category filter had the same shape before, but search makes it far easier to hit. | Do not change Disclosure's props (rule 3). Remount it while a query is active and open it when it has matches. For example, use `` key={`notYet-${activeClientId ?? ''}-${queryNorm ? 'q' : ''}`} `` with `defaultOpen={queryNorm !== '' \|\| sectionIsOpen('notYet')}`, and the same for `unchecked`. |
| L1 | LOW | src/pages/AIVisibility.tsx:2133-2139; src/index.css:820-826 | The 2px hover lift never happens on the engine status cards, and the CSS transform transition interferes with motion's entrance. The `glass-card-interactive` class sits on the `motion.div` itself. After the `y: 8 → 0` entrance, motion writes inline `style.transform = "none"`, and an inline style beats `.glass-card-interactive:hover { transform: translateY(-2px) }`. During the entrance, the class's `transition: transform var(--motion-fast)` re-eases each per-frame value motion writes, so the arrival lags. The locked-engine cards are not affected: their class is on the inner `Link`, not on the motion element. | `node_modules/motion-dom/dist/es/render/html/utils/build-transform.mjs:65-67`: `else if (transformIsDefault) { transformString = "none"; }`. The border-colour and glow hover still apply, so feedback is reduced, not lost. | Do what the locked cards do: keep the `motion.div` as an unstyled wrapper and put `glass-card glass-lite glass-card-interactive group ...` on an inner div. Alternatively, drop the CSS lift and use `whileHover={{ y: -2 }}` on the motion element. |
| L2 | LOW | src/pages/AIVisibility.tsx:2152 | On a touch screen a disabled admin refresh button looks enabled. The old `disabled:opacity-25` was removed. `[@media(hover:none)]:opacity-100` now forces opacity 1 even while `collecting` or another engine's refresh disables the button. Only `disabled:group-hover:opacity-25` dims it, and that needs hover. | Class string: `'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 disabled:group-hover:opacity-25'`. On a phone during a run, every engine card shows a full-strength refresh icon that does nothing when tapped (`cursor-not-allowed` has no meaning on touch). Admin only. | Add `disabled:opacity-25` after the media variant, or add `[@media(hover:none)]:disabled:opacity-25`. The running button keeps `opacity-100` because it is outside this branch. |
| L3 | LOW | src/pages/AIVisibility.tsx:407, 2525, 2658 | A search query outlives its input. The query resets only on a client switch, but the input renders only while `prompts.length >= 2`. Narrowing the sidebar location filter to a location with one prompt hides the field and keeps the filter active. If that prompt matches, nothing shows that a filter is on. The live region then reads "1 of 1 prompts shown". | `useEffect(() => { setPromptQuery('') }, [activeClientId])` covers only `activeClientId`. When nothing matches, the empty state's "Clear search" button is the only way out, so this is recoverable. | Also reset on a location-filter change, or render the input whenever `promptQuery !== '' \|\| prompts.length >= 2`. |
| I1 | INFO | tailwind.config.js:59-64, 89-90 | `grad.start/mid/end`, `glow`, `boxShadow.glass` and `boxShadow.glow` are mapped but unused. `rg` over src for `(bg\|text\|border\|from\|via\|to\|shadow)-grad-`, `-glow` and `shadow-glass` finds nothing. tokens_sync pins the four colour mappings, so this is dead config held in place by a test. | `rg ... src` exit 1. | Keep them if the layer will spread to other pages; otherwise drop the two shadow keys. |
| I2 | INFO | src/pages/AIVisibility.tsx:877-881 | CSV export now honours the search query as well as the category filter, but the comment still says only "category filter applied". A query left in the field silently narrows an export. | `exportCsv` maps over `renderPlan`, which carries the search filter (line 855). | Update the comment. Optionally name the filter in the button's title while a query is active. |
| I3 | INFO | src/pages/AIVisibility.tsx:2263-2265 | The "Top fix" preview always shows the first open item of the highest priority. If the user has stepped a column with Next (`fixCursor`), the hub opens on a different item. The design note says "the fix the hub would open on", which is not exact. | `openFixItems.find(i => i.priority === p)` ignores `fixCursor`. | Accept the wording, or read `fixCursor[p]` (clamped) for the preview. |
| I4 | INFO | src/pages/AIVisibility.tsx:2753-2755 | The sticky header works only when the matrix fits. When it does not fit, the wrapper becomes `overflow-x-auto`, which is a scroll container, so the header stops sticking. This is documented in the code comment. `overflow-clip` is `overflow: clip`, which Safari before 16 ignores, so the corners are not rounded there. | Line 2755: `className={isWide ? (matrixFits ? '' : 'overflow-x-auto') : ...}`. | None needed; recorded so nobody files it as a regression. |
| I5 | INFO | netlify/functions/unlock-audit-report.js | Another session's uncommitted edit sits in the same tree. | `git status --short` shows `M netlify/functions/unlock-audit-report.js`. | Commit this work by pathspec: the six files plus `src/components/GlowScoreDial.tsx`, plus the design note and this review if wanted. |
| I6 | INFO | src/components/PromptResultCell.tsx:125-129 | The rank #1 cell (`.cell-top`) is a new visual state that is missing from the "What the symbols mean" legend. The legend renders `mentioned` without a position, so it shows `.cell-soft`. | Legend at AIVisibility.tsx:2724-2745. | A `bg-copy`/`bg-design` call: add a "#1" legend entry or leave it as is. |
| I7 | INFO | src/index.css:913-923 | The row's left accent bar (`.matrix-row > button::before`, left 0) scrolls out of view when the matrix scrolls sideways, while the sticky # column stays. | Cosmetic; it only applies when `matrixFits` is false. | None, or put the accent on the sticky first cell instead. |

## Detail on the lens items

### (a) CSS cascade

Tailwind 3.4.19 (read from `node_modules/tailwindcss/package.json`). `@layer
components` rules are emitted at `@tailwind components` (index.css:2),
before utilities. Unlayered rules stay in source order, after utilities.

- **HeroAnswer Card**: the rule is `.hero-ambient-mesh > .rounded-card`,
  specificity (0,2,0). The Card's utilities are `bg-surface`, `border-line`,
  `rounded-card` and `shadow-card` (Card.tsx:28), each (0,1,0), so the glass
  rule wins on specificity even though it comes earlier in the sheet. On hover
  the utility `.hover\:border-line-2:hover` (0,2,0) ties with the base glass
  rule and wins because it comes later. The explicit
  `.hero-ambient-mesh > .rounded-card:hover` (0,3,0, index.css:852) then beats
  that utility. **Correct.** The Card is the direct child in both branches:
  HeroAnswer returns `<Card>` at HeroAnswer.tsx:45 and :52, and the
  `motion.div` at AIVisibility.tsx:1968 is its parent.
- **`.nav-item.is-active` override**: the old rule is unlayered at
  index.css:672 and the new one is unlayered at 969. Both are (0,2,0), and the
  later one wins. `.nav-item:hover` (0,2,0, line 655) is earlier, so an active
  item keeps its gradient on hover. **Correct**, and the code comment's
  reasoning is accurate.
- **Matrix row hover against the sticky cells**: the rule is
  `.matrix-row > button:hover > .sticky` (0,3,1). It competes with
  `.bg-surface` and `.bg-surface-2` (0,1,0) and with
  `.group:hover .group-hover\:bg-surface-2` (0,3,0, from `stickyBg` at line
  1534). (0,3,1) beats (0,3,0), so the sticky cells take the same opaque
  `--row-hover` as the rest of the row. **Correct.**
- **`.cell-top` and `.cell-soft` against STATE_CLASS**: `cell-top` replaces
  STATE_CLASS entirely (`top ? 'cell-top' : STATE_CLASS[state]`), so no
  background utility competes with it. Its children carry `text-on-accent`
  explicitly. `cell-soft` is paired only with `text-pos-ink`, and no
  background utility sits on the same element. **Correct.**
- **`.glass-input`** has no competing border or background utility on the
  input, and the base `input` rules are element selectors in
  `@layer base`. **Correct.**
- **@supports fallback**: unlayered and later than the layered glass rules,
  at equal or higher specificity. **Correct.**

### (b) React

- The new hooks `promptQuery`, the reset effect, `matrixWrapEl`, `matrixFits`
  and the ResizeObserver effect are at lines 406-424, before the early returns
  at 1195 and 1202. **Rules of hooks hold.**
- ResizeObserver: the callback ref is the stable `useState` setter. It is
  attached only when `isWide`, gets `null` on unmount or when `isWide` turns
  false, and the effect disconnects in its cleanup. It observes both the
  wrapper and the `min-width` child, so a change of engine count resizes the
  child and re-runs the check. The class change does not change `clientWidth`,
  so there is no feedback loop. On the first frame of a too-wide table,
  `matrixFits` starts `true`; the overflow is clipped by the Card's
  `overflow-clip`, so no page scroll results. **Correct.**
- Search reset on client switch: line 407. Correct; see L3 for the location
  case.
- renderPlan numbering: the search is one more `.filter` before `num: ++n`, so
  numbering stays 1..N over the visible rows, as the category filter already
  does. `reveal-row` can newly apply to a row that moves into the top 10 while
  typing (a short fade). Cosmetic, and the category filter already does the
  same.
- CSV export and empty states: export follows `renderPlan` (I2), and the
  button is disabled at `visibleCount === 0`. The empty state branches on
  `queryNorm` and clears the search first. When search and categories together
  match nothing, clearing the search falls back to the category empty state.
  **Correct.**
- Fix this: `fixTitleOf` (line 933) is declared before the early return. In
  the IIFE, `topFix` is `undefined` when nothing is open, which is guarded at
  2276 and 2280. The heading level (h2) and the toggle's `aria-expanded` and
  `aria-label` are kept from SectionHeader.
- GlowScoreDial: under React 18.3.1, `useId()` gives `:r1:`, which becomes
  `r1`, a valid SVG id. If React is ever upgraded to 19, re-check that the
  `replace` still yields a valid `url(#...)` reference.

### (c) Budget pill gate, case by case

| Case | Before | After |
|---|---|---|
| Admin, prompts > 0, cap > 0 | Row meter | Pill in the score header (line 2026), no row |
| Admin, prompts = 0, cap > 0 | Row meter | Row meter (line 1919); the empty-state hero has no header, so no pill |
| Admin, cap = 0 | Empty row div | Nothing |
| Viewer (including admin "view as user", where `isAdmin` is false) | Cooldown, Included runs, Prompts in use | Same three, same order (line 1929) |
| Demo | Nothing (`!isDemoMode`) | Nothing: both gates carry `!isDemoMode`, and demo never sets `isAdmin` |

No case shows the euro figure to a viewer or in demo, and no case shows it twice.

### (d) Refresh button visibility

- Mouse: shown on card hover. Disabled and hovered: 0.25 (0,4,0 beats 0,3,0).
- Keyboard: the button stays focusable while at opacity 0, and
  `group-focus-within:opacity-100` reveals it with the global focus ring.
  Disabled buttons are not focusable.
- Running: `opacity-100` with the spinner, and no spin under reduced motion.
- Touch: always shown, but a disabled button is not dimmed (L2).
- The admin gate is unchanged.

### (e) Tests

- `node tests/tokens_sync.test.js`: 169 passed, 0 failed, exit 0.
- Tests that reference these files or helpers: `client_switch_guards` 14/0,
  `combobox_filter` 14/0, `fix_items` 24/0, `no_answer_rows` "All checks
  passed", `page_sequencing` 29/0, `views_a` 40/0, all exit 0.
- Full suite, every `tests/*.test.js` under a 60 s timeout each: **70 passed,
  0 failed**.

### (f) Dead code and unused imports

`ScoreDial` was removed from the import cleanly. `Card`, `Meter` (line 2644),
`SectionHeader` (line 2484), `Search`, `normalizeForSearch`, `GlowScoreDial`,
`AnimatePresence` and `MOTION_BASE` are all still used. Every new CSS class is
used at least once outside index.css. The unused Tailwind mappings are listed
as I1. `GlowScoreDial`'s `size: 'md'` branch has no caller; it is kept for
parity with ScoreDial, which is harmless.

### (g) Dash scan

Covered in rule 9 above: clean, with a positive control that fired.

## What was not checked

- Any rendering: the pixel figures for density (rule 6), the dial, the glow,
  light mode, contrast of the new text-on-surface pairs (`--row-hover`,
  `cell-soft`, the sidebar wells, the `nav-item.is-active` gradient), hit
  targets, and horizontal scroll at 390. The brief forbids a browser, so all
  of these are the builder's measurements only.
- `tsc --noEmit` and `npm run build` (forbidden). Type correctness and the
  entry chunk size (builder reports 602,542 against 602,628 bytes) are
  unverified.
- That Tailwind 3.4 actually emits the arbitrary variant
  `[@media(hover:none)]:opacity-100` after `.opacity-0`. I inferred it from
  Tailwind's variant ordering and did not see it in a built stylesheet.
- Behaviour on real touch hardware, a screen reader's reading of the new
  live region, Safari or Firefox (`overflow: clip`, `backdrop-filter`
  fallback).
- The accessibility, density and visual-quality lenses. They belong to other
  reviewers in this run.


## Amendment, 2026-11-15: findings closed from the orchestrator seat

Closed by the builder after this review and re-checked from the orchestrator
seat, not by a second bg-verify run.

Re-check after the fixes: `tsc` exit 0, 70 of 70 node test files pass,
`npm run build` exit 0, entry chunk 602,542 bytes (602,628 before the glass
layer). Headless Chrome over CDP, demo mode, dark and light: a real scroll of
`<main>` and of the window moves 0 px at 1024, 1180, 1280, 1366, 1440 and 390,
both as shipped and with a 162 px "Split by location" button injected into the
toolbar (at 1024 the toolbar row is 489 px wide and ends 34 px inside `<main>`).
Text contrast sampled against the rendered background with text hidden: 0 below
AA in 211 and 117 text boxes (Fix this closed) and 204 and 144 (open), at 1440
and 390, both themes. "Your prompts" starts at 757 px (1440, was 682) and
1,241 px (390, was 1,158); with Fix this open 1,200 and 2,308 (were 1,129 and
2,229). It starts at 849 px at 1024.

| id | status | what changed |
|---|---|---|
| M1 | CLOSED | `notYet` and `unchecked` Disclosures open while a search is active: `defaultOpen={queryNorm !== '' \|\| sectionIsOpen(...)}` and a key that gains `-q` while searching, so they remount open. Disclosure props unchanged. |
| L1 | CLOSED | Engine status card: the motion wrapper only sizes and animates; the glass and the lift sit on an inner box (`glass-card-lift`, a lift without the accent glow because the card is not a link). Locked cards keep `glass-card-interactive` on their Link. |
| L2 | CLOSED | Refresh button adds `[@media(hover:none)]:disabled:opacity-25`. |
| L3 | CLOSED | Search field renders while `prompts.length >= 2 \|\| promptQuery !== ''`. |
| I1 | CLOSED | Unused `shadow-glass` and `shadow-glow` keys removed from tailwind.config.js. The four colour mappings stay (the brief asked for them, tokens_sync pins them). |
| I2 | CLOSED | CSV export comment says search applies. |
| I3 | ACCEPTED | The preview names the first open fix at the highest priority, the one the hub opens on before any Next press. |
| I4, I7 | ACCEPTED | Recorded. |
| I5 | NOTED | Commit is by pathspec, seven files of this change plus the design note and the two reviews. |
| I6 | OPEN | A legend row for the #1 cell is a bg-design or bg-copy call; the cell prints "#1" and speaks the rank, so nothing depends on colour. |
