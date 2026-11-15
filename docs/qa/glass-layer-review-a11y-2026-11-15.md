VERDICT: PASS WITH FINDINGS (0 blocker, 1 major, 0 medium, 3 low, 9 info). M1 must be fixed and measured at 1024, 1180, 1280 and 1366 before this is committed.

# Glass layer review, lens: accessibility, visual regression, performance (2026-11-15)

Reviewer: `bg-verify`, read only on code. Subject: the uncommitted glass layer in
`brandgeo-dashboard` (`src/index.css`, `tailwind.config.js`,
`tests/tokens_sync.test.js`, `src/pages/AIVisibility.tsx`,
`src/components/Layout.tsx`, `src/components/PromptResultCell.tsx`, new
`src/components/GlowScoreDial.tsx`). Builder's note:
`docs/design/phase3-visual/glass-layer-2026-11-15.md`. No browser, build, `tsc`
or `vite` was run by this seat, by instruction. Every pixel claim below is
either arithmetic from the token values or read off the builder's own
screenshot `docs/design/phase3-visual/after-glass/glass-aivisibility-1440-dark.png`.

## Findings

| id | severity | file:line | finding | evidence | suggested fix |
|---|---|---|---|---|---|
| M1 | MAJOR | `src/pages/AIVisibility.tsx:2524`, `:2526` | The new search field makes the "Your prompts" toolbar overflow sideways inside `<main>` at every lg width below about 1256 px (one location), and below about 1434 px for a client with several locations. | The controls row is `flex flex-col gap-3 sm:flex-row sm:items-center` with no wrap. The search wrapper is `relative w-full sm:w-56`, a fixed 224 px width, so its min-content contribution to the row is 224 px. Measured off the builder's 1440 screenshot: search 560 to 784 (224), SegmentedControl 798 to 1286 (488), Export CSV 1297 to 1408 (111), so the row's minimum is 224+12+488+12+111 = 847 px. At 1440 the 1,136 px content box gave the chip group only 288 px (chips wrapped to three lines) and the search did NOT shrink, which shows the row cannot go below 847. At lg the outer container is `lg:flex-row`, chips plus controls: content width is `vw - 240 - 48` below 1280, so it needs 847 + widest chip (about 120) = 967, reached only at vw 1256. At 1024 the content box is 736 px, an overflow of about 231 px; before this change the row was 611 px and 611 + 120 = 731 fitted. With `isMulti` the "Split by location" button adds about 162 px: 1,129 needed, `vw - 240 - 64` at xl, so every width under about 1434 overflows (before: about 1181). The builder measured only 1440 and 390 (`after-glass/glass-measure.json`), the two widths where it fits. | Let the row wrap and let the field give way: `sm:flex-row sm:flex-wrap sm:justify-end` on the row, and on the field `sm:w-auto sm:flex-1 sm:min-w-[10rem] sm:max-w-[14rem]` (or put the search on its own line above the chips). Then measure `main.scrollWidth` against `clientWidth` with a real scroll attempt at 1024, 1180, 1280, 1366 and 1440, single and multi location, dark and light. |
| L1 | LOW | `src/pages/AIVisibility.tsx:2152` | The engine refresh button lost its disabled look. On a touch screen it shows at full opacity while disabled, so during a run it looks tappable and does nothing. | Old class carried `disabled:opacity-25`. New class: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 disabled:group-hover:opacity-25`. With `hover:none` there is no hover, so only the media variant applies: opacity 1 while `disabled={collecting \|\| refreshingEngine !== null}`. Admin only, so viewers never see it. | Add a disabled variant that wins on touch too, for example `[@media(hover:none)]:disabled:opacity-25` next to the existing one, keeping `opacity-100` for `refreshingEngine === e.id`. |
| L2 | LOW | `src/pages/AIVisibility.tsx:2139`; `src/index.css:820` | The hover lift never happens on the engine status cards, only on the locked ones; and the status cards, which are not interactive for anyone, now light up an accent border and glow on hover, which reads as clickable. | `glass-card-interactive` sits on the `motion.div` that also animates `y`. motion writes an inline `transform` that ends as `none` (`node_modules/motion-dom/dist/es/render/html/utils/build-styles.mjs:43-52`), and inline style beats `.glass-card-interactive:hover { transform: translateY(-2px) }`. Locked cards put the class on the inner `Link`, so they lift. A status card has no link; for a viewer it has no focusable child at all. | Drop `glass-card-interactive` from the status cards (keep the plain glass), or move it to an inner element if a lift is wanted; keep it on the locked `Link` cards, which are real links. |
| L3 | LOW | `src/index.css:843-851` | The score card pays `backdrop-filter: blur(20px) saturate(140%)` over a backdrop that is only its own smooth aura gradient, so the blur shows nothing and is recomputed as `<main>` scrolls. The builder's note gives exactly this reason for dropping the blur on the engine cards. | Behind the card sits only `.hero-ambient-mesh::before` (two radial gradients) and the flat canvas; nothing scrolls under it. My contrast figures below are computed with no blur and all pass, so removing it changes no ratio. | Remove the two backdrop-filter lines from `.hero-ambient-mesh > .rounded-card`, keeping the gradient fill. Persistent blurred elements on the page drop from 2 to 1 (the sticky matrix header). |
| I1 | INFO | `src/index.css:797` | The layer comment says backdrop-filter is paid by the score card, the matrix header "and the sidebar". The sidebar has none (`.sidebar-glass` at `:958` sets only background). The builder's note says the same correctly. | Read `:958-962`. | Correct the comment. |
| I2 | INFO | (contrast) | Three text pairs pass by thin margins on the score card in dark mode; under a worst case that stacks both aura gradients at full strength they dip just under AA. | ink-3 on the glass pill: 4.37 (stacked, saturate 140) / 4.71 (aura-b only, the pill's real position at the right) / 4.89 (no aura). ink-3 on a hovered dimension tile: 4.49 stacked / 4.69 aura-a only. ink-3 on the hero top fill: 4.69 stacked. All pass at the real geometry. | Optional headroom: `--aura-a` 0.20, or the pill label in `text-ink-2`. |
| I3 | INFO | `src/index.css:906-912` | Light mode, the sticky header is 82 percent opaque; when a #1 cell (strong violet) scrolls under it, the locked column's `text-ink-3` plan name falls to 4.11:1 unblurred. | Header over `--accent-strong` light: bg (219.7, 207.3, 244.9), ink-3 4.11. With the 12 px blur diluting the cell to about half coverage: 4.81. Transient, during scroll only. The `#` and `Prompt` header cells are solid `bg-surface-2`, so their labels are unaffected. | Accept, or raise `.matrix-head` to 0.9 opacity. |
| I4 | INFO | `src/index.css:969-979` | Active nav item: the rail falls from 6.09:1 to 3.35:1 (dark) against its surface, still above 3:1; the right end of the new gradient (0.05 accent) equals the hover fill (1.02:1). The state still has text `ink` vs `ink-2`, weight 500, a 2.07:1 ring and the rail. Left-end fill vs sidebar 1.27:1 dark (old spec measured 1.24:1), 1.39:1 light. | Script figures below. | None required. |
| I5 | INFO | `src/index.css:831-840` | The aura's `inset: -28px` reaches 12 px into the row above the score card (`mb-4` is 16 px) and paints over it, because the wrapper is positioned and so paints after in-flow siblings. Alpha there is at most about 0.10 at the far right, about 0.02 at the left; `pointer-events: none`. No contrast loss of note. | Geometry of the two radial gradients. | None, or `inset: -12px -8px -12px -8px`. |
| I6 | INFO | `tailwind.config.js` (new keys) | `grad.*`, `glow`, `shadow-glass` and `shadow-glow` are mapped but used nowhere in `src/`. Latent trap: `shadow-glow` would match both the `boxShadow` key and the `glow` colour, and Tailwind then emits both rules, so the glow would render through `--tw-shadow-color` at full alpha instead of `--glow-strength`. | `grep` for the class names returns no use. | Drop the unused keys, or rename the boxShadow key (`shadow-glow-soft`). |
| I7 | INFO | `src/pages/AIVisibility.tsx:2751-2753`, `:410-424` | `overflow-clip` is ignored by Safari before 16 (corners then show square row fills); and `matrixFits` starts `true`, so for one frame a table that does not fit renders clipped before the ResizeObserver switches on `overflow-x-auto`. | Code read. | Accept. |
| I8 | INFO | `src/pages/AIVisibility.tsx:2727-2741` | "What the symbols mean" has no entry for the new violet #1 cell. The cell prints "#1" and its `sr-only` label speaks the rank, so nothing depends on colour alone. | Legend array lists mentioned, absent, no_answer, error, pending, locked. | Optional legend row. |
| I9 | INFO, PRE-EXISTING | `src/pages/AIVisibility.tsx:2524` | Between 768 and about 860 px (md, column layout) the toolbar row already overflowed before this change (611 px of controls in a 480 px box at 768). The search adds about 54 px there (the field shrinks to about 42 px in a column) and stretches the range to about 950 px. | Same arithmetic as M1. | Closed by the M1 fix (wrapping). |

## Contrast, computed from the tokens (WCAG relative luminance)

Method: sRGB linearised, `L = 0.2126 R + 0.7152 G + 0.0722 B`, ratio
`(Lmax + 0.05) / (Lmin + 0.05)`. Translucent fills are alpha-composited over the
layer beneath; `saturate(140%)` uses the filter-spec matrix. Values from the
`:root` and `html.light` blocks of `src/index.css`.

| theme | pair | background used | ratio | need |
|---|---|---|---|---|
| dark | ink-3 on `.glass-lite` top over canvas | (24.8, 25.8, 33.2) | 5.21 | 4.5 |
| dark | ink-3 on `.glass-lite` bottom | (13.8, 14.8, 19.1) | 5.75 | 4.5 |
| dark | ink-3 on score card top, aura stacked at strongest, saturate 140 | (35.0, 32.5, 57.8) | 4.69 | 4.5 |
| dark | ink-2 / ink on the same | same | 6.02 / 12.88 | 4.5 |
| dark | ink-3 on dimension tile, card bottom, stacked aura | (33.6, 29.9, 58.2) | 4.80 | 4.5 |
| dark | `.cell-top` white on accent-strong / accent-strong-hover | (124,58,237) / (109,40,217) | 5.70 / 7.10 | 4.5 |
| dark | `.cell-soft` ink word over surface / surface-2 / row-hover | pos 10% composited | 13.23 / 12.35 / 12.16 | 4.5 |
| dark | `.cell-soft` pos-ink glyph (non-text) | same | 8.12 / 7.59 / 7.46 | 3 |
| dark | placeholder ink-3 on `.glass-input` (surface-2) | (22, 23, 30) | 5.36 | 4.5 |
| dark | `.glass-input` border edge vs canvas | (10, 11, 14) | 3.64 | 3 |
| dark | sidebar ink-3 at top with aura / middle / bottom | (34.6,29.8,53.9) / (15.2,16.2,20.9) / (10,11,14) | 4.82 / 5.69 / 5.90 | 4.5 |
| dark | `.sidebar-well` ink-3 at top / middle / bottom | (27.0,23.2,42.1) / (11.8,12.6,16.3) / (7.8,8.6,10.9) | 5.23 / 5.84 / 5.99 | 4.5 |
| dark | active nav ink at left / right end | (42.4,32.8,70.4) / (21.4,20.0,32.1) | 12.32 / 15.01 | 4.5 |
| dark | sidebar divider edge vs sidebar top at the right edge (aura 0 there) | (20.3, 21.3, 27.8) | 3.40 | 3 |
| dark | matrix head ink-3 / ink-2 over a #1 cell (unblurred) | (40.4, 29.3, 67.3) | 4.66 / 5.98 | 4.5 |
| dark | gradient bar start / mid / end vs track surface-3 | (29, 30, 39) | 3.71 / 3.91 / 4.19 (old Meter 3.91) | 3 |
| dark | 1 px glow line start / mid / end vs line-2 | (50, 51, 60) | 2.81 / 2.96 / 3.17 | n/a, decorative, `aria-hidden`, value printed |
| dark | Fix this left bar grad-start vs callout | (24.8, 25.8, 33.2) | 3.89 | 3 |
| light | ink-3 on `.glass-lite` top / bottom | near white | 5.97 / 5.76 | 4.5 |
| light | ink-3 on score card bottom, aura stacked, saturate 140 | (241.6, 237.8, 255) | 5.28 | 4.5 |
| light | ink-3 on dimension tile hover | (236.1, 231.1, 251.3) | 5.00 | 4.5 |
| light | `.cell-top` white on accent-strong / accent-strong-hover | (109,40,217) / (91,33,182) | 7.10 / 8.98 | 4.5 |
| light | `.cell-soft` pos-ink glyph over surface-2 | (228.4, 233.1, 227.4) | 5.76 | 3 |
| light | placeholder ink-3 on surface-2 | (244, 244, 251) | 5.51 | 4.5 |
| light | `.glass-input` border edge vs canvas | (247, 247, 252) | 3.42 | 3 |
| light | sidebar ink-3 top with aura / `.sidebar-well` on top | (243.6,238.4,253.2) / (239.1,236.9,247.7) | 5.32 / 5.21 | 4.5 |
| light | active nav rail start / end vs active fill | (222.7, 208.2, 249.7) | 4.35 / 3.73 | 3 |
| light | matrix head ink-3 over a #1 cell (unblurred) | (219.7, 207.3, 244.9) | 4.11 (I3) | 4.5 |
| light | gradient bar start / mid / end vs track | (236, 236, 244) | 5.35 / 4.85 / 4.58 | 3 |

Every text pair passes at the real geometry. The `@supports not (backdrop-filter)`
block (`src/index.css:982-985`, syntax checked) turns `.glass-card`, the score
card and the matrix header solid; since every ratio above is computed without a
blur, text contrast does not depend on the blur in either path.

## Keyboard and screen reader

- Search (`:2526-2539`): `<label htmlFor="aiv-prompt-search" className="sr-only">`, `type="search"`, Escape clears only when there is a query and calls `preventDefault`. Visible label is the placeholder plus the icon; acceptable with the programmatic label. 36 px tall, 44 px below 640.
- Result count (`:2658`): always mounted `role="status" aria-live="polite"`, says "N of M prompts shown" only while a query is set. The no-match state has its own text and a "Clear search" button.
- Fix this (`:2270`): `h2` with the count Badge inside, the same level and shape as `SectionHeader` (`ui/SectionHeader.tsx:14-21`, default level 2). Toggle keeps `aria-expanded` and `aria-label` "Show fixes"/"Hide fixes", which contains the visible word. The ` · ` separator is `aria-hidden`.
- Engine refresh (`:2152`): opacity 0 but focusable, revealed by `group-focus-within:opacity-100` (the card carries `group`); `aria-label` and `title` kept; hit area 20 px plus the 8 px `after` inset, 36 px. Still `isAdmin` only (`{isAdmin && (`).
- Dimension bars (`:2062-2071`): `role="progressbar"`, `aria-valuemin` 0, `aria-valuemax` 100, `aria-valuenow` rounded, `aria-label` the dimension, all omitted when the value is null. Same as `ui/Meter.tsx:30-36`. Meter's visible "n/a" is gone; the value column already prints "Not measured yet" or the not-applicable text.
- 1 px rate line (`:2176`): `aria-hidden="true"`.
- `GlowScoreDial`: `role="img"` with `aria-label`, SVG `aria-hidden`, the same pattern as `ui/ScoreDial.tsx:29-30`.
- Heading order on the page is unchanged (page h1, sr-only score h2, Engines h2, Fix this h2, Your prompts h2).
- Focus ring on the locked engine cards is now the global 2 px outline at 2 px offset (the old `focus-visible:-outline-offset-2` went with the old markup); the rail's `px-1 py-2` leaves exactly 4 px sideways, so it fits but touches the scroller edge on the first card.

## prefers-reduced-motion

| new motion | covered by |
|---|---|
| `.glass-card-interactive` lift and transitions | `src/index.css:988` (transform none, transition none) |
| `.glow-bar-fill` width, `.glass-tile`, `.glass-input`, `.matrix-row > button::before` | `src/index.css:989` |
| engine cards `motion.div` entrance (opacity, y 8, stagger) | `MotionConfig reducedMotion="user"` at `src/App.tsx:267` drops the y slide; opacity fade remains |
| `GlowScoreDial` arc draw-in | `motion-reduce:transition-none` on the arc |
| refresh icon spin | `motion-reduce:animate-none` (new) |
| mobile row border colour | `motion-reduce:transition-none` |
| refresh button opacity fade, 180 ms | not covered; opacity only, no movement, acceptable |

No uncovered transform or movement found.

## Horizontal overflow, 320 to 390 px

`<main>` is the scroll box (`overflow-auto`, `Layout.tsx`), the page gutter is
`px-4` (16 px, `ui/Page.tsx:6`). The aura bleeds 8 px sideways, the engine rail
`-mx-1` 4 px: both inside the gutter. The search is `w-full` in a column below
640. The Fix this callout is `flex-wrap` with `min-w-0 flex-1` and a truncating
line. The score card header row gained `flex-wrap`, so the admin budget pill
(min 140 px plus padding) wraps under the label. No overflow source found at
320 to 390. The overflow found is at lg widths, M1.

## backdrop-filter count

Persistent: 2 (`.hero-ambient-mesh > .rounded-card` blur 20 px saturate 140;
`.matrix-head` blur 12 px, sticky). Engine cards and the callout use
`.glass-lite` (none); tiles, pill, wells and the sidebar have none. Plus the
pre-existing modal scrim (`AIVisibility.tsx:229`) only while open. L3 recommends
dropping the first.

## Regression surface

- `git diff --quiet -- src/components/ui` exits 0: no shared ui component touched; `ScoreDial` and therefore Overview's dial (through `ScoreBadge`) are unchanged.
- `PromptResultCell` is imported only by `AIVisibility.tsx` (`grep -rln`), so `.cell-top` and `.cell-soft` reach no other page.
- The only global rule change is the unlayered `.nav-item.is-active` block (`index.css:969-979`): every route's sidebar, desktop and phone drawer. `.nav-item` is used only through `Layout.tsx:724`. `.mobile-nav-item` untouched. Override order is right: it is unlayered and later than the unlayered shell rule at `:672`, same specificity.
- Every other new selector is scoped to a new class. `.hero-ambient-mesh > .rounded-card` (0,2,0) beats Card's `bg-surface` utility by specificity; its hover rule (0,3,0) beats `hover:border-line-2`.
- Row hover: `.matrix-row > button:hover > .sticky` is 0,3,1 and beats `group-hover:bg-surface-2` (0,3,0) on odd rows, so sticky cells match the row; no seam.
- Layout: the two `bg-canvas` removals are on status rows inside the `<aside>` (`Layout.tsx:923`, `:955`), so they now show the sidebar fill, as intended.
- `Layout.tsx` imports (lines 1 to 33) include no `motion`; `GlowScoreDial.tsx` and `PromptResultCell.tsx` import no `motion`.

## Rule checks

| rule | result | evidence |
|---|---|---|
| 1 tokens only, tokens_sync green | pass | `node tests/tokens_sync.test.js`: `169 passed, 0 failed`; no 6-digit hex in added lines outside comments |
| 2 no motion in Layout's imports | pass | import list above |
| 3 no props change to ui/ | pass | `git diff --quiet -- src/components/ui` exit 0 |
| 4 no scrollIntoView | pass | 0 hits in added lines |
| 5 euro budget admin only, never demo | pass | pill gated `isAdmin && !isDemoMode && budgetCapEur > 0` (`:2026`); fallback row `!isDemoMode && isAdmin && prompts.length === 0` (`:1918`); `isAdmin` is `isAdmin && !viewingAsUser` (`clientContext.tsx:358`) |
| 6 density within about 100 px | builder's figure only | `glass-measure.json`: promptsTop 757 at 1440 and 1241 at 390, against the 682 and 1,158 recorded on 2026-11-10; not re-measured here |
| 7 blur only on large surfaces, fallback, reduced motion | pass, with L3 | sections above |
| 8 no query, context or lib change; search client side | pass | diff touches only the six listed files; filter is `normalizeForSearch(p.text).includes(queryNorm)` in `renderPlan` |
| 9 no em or en dash; copy marked | pass | `rg -c` with a class of U+2014 and U+2013 on all added lines plus `GlowScoreDial.tsx`: 0, positive control 1; new strings carry `copy: pending bg-copy` |
| 10 admin controls stay admin | pass | refresh still inside `{isAdmin && (` |
| full node suite | pass | 70 of 70 test files exit 0 |

## Not checked

- Nothing was rendered by this seat: no browser, no screen reader, no Firefox, no Safari, no real phone, no build, no `tsc`. M1 is arithmetic plus the builder's 1440 screenshot; it needs a measured confirmation.
- Widths other than the builder's 1440 and 390 (M1 is exactly this gap).
- The live GPU cost of the two blurs while `<main>` scrolls; L3 is reasoned, not profiled.
- The actual blur dilution under the sticky header (I3 uses a 50 percent assumption).
- Tailwind's emitted order for the stacked `disabled:group-hover:` variant against `group-hover:` (L1 does not depend on it).
- A client with seven active engines, a client with many categories, the admin view of the budget pill, the no-prompts admin row.
- Windows High Contrast / forced colours: gradients and glows vanish there; the active nav would rely on its text and the ring.


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
| M1 | CLOSED | Toolbar row `sm:flex-wrap sm:justify-end`; search field `sm:w-auto sm:flex-1 sm:min-w-[10rem] sm:max-w-[14rem]`. Measured as above at the five widths you asked for, single location and with the simulated Split by location button. |
| L1 | CLOSED | `[@media(hover:none)]:disabled:opacity-25` added. |
| L2 | CLOSED | Status cards lift through an inner box with `glass-card-lift` (border step, no accent glow); only the locked cards, which are links, keep the accent glow. |
| L3 | CLOSED | Blur removed from the score card; the only persistent blur on the page is the sticky matrix header. The `@supports` fallback now targets `.glass-card` only. |
| I1 | CLOSED | Layer comment corrected. |
| I2 | CLOSED | `--aura-a` dark 0.24 to 0.20 for headroom. |
| I3 | CLOSED | `.matrix-head` 0.82 to 0.9 opacity. |
| I4 | ACCEPTED | |
| I5 | CLOSED | Aura top inset -28px to -12px. |
| I6 | CLOSED | Unused boxShadow keys removed. |
| I7 | ACCEPTED | |
| I8 | OPEN | Legend row for #1, a bg-design or bg-copy call. |
| I9 | CLOSED | By the M1 wrap. |
