# Direction A: Instrument

**Agent:** bg-design
**Date:** 2026-11-09
**Status:** READY for `bg-app` (two lanes), behind one HUMAN CHECKPOINT (section 17)
**Surface:** `brandgeo-dashboard/src/`, the Layout shell plus 7 routes (`/`, `/ai-visibility`, `/sentiment`, `/mentions`, `/competitors`, `/recommendations`, `/prompts`), dark and light, 390 / 768 / 1280+.
**Evidence looked at first:** all 28 screenshots in `docs/design/phase3-visual/current/` (7 pages x 1440 and 390 x dark and light).
**Read:** `docs/audit/system-uiux-blueprint-2026-11-08.md` sections 3, 6.2, 6.3; `CLAUDE.md` Product quality backlog, section 4.2, section 7, the 2026-07-28 colour entry; `brandgeo/web/index.html` `:root` and `[data-theme="light"]`; `tailwind.config.js`; `src/index.css`; `src/lib/chartTheme.ts`; `src/lib/planConfig.ts` ENGINE_META; `src/lib/color.ts`; `docs/design/dashboard-visual-system.md` (the 2026-07-27 ruling this spec amends, not replaces).
**Method:** every contrast ratio is WCAG 2 relative luminance. Every deltaE is Euclidean OKLab x 100, CVD simulated with Machado, Oliveira and Fernandes 2009 at severity 1.0, computed with the `dataviz` skill's `scripts/validate_palette.js` (its own `contrast()` export for ratios). Commands to reproduce are in section 16. Nothing in this document is estimated.
**Not edited:** no `.tsx`, `.css`, `.html`, `tailwind.config.js` or `DESIGN-SYSTEM.md`. Section 4 is written as numbered amendments to `docs/DESIGN-SYSTEM.md`, to be applied when the checkpoint in section 17 is passed.

---

## 1. The one thing

**On every route the eye lands first on one number, printed in ink with its basis stamped beside it (how many checks, which window); violet appears only where the user is (nav rail, selected control) or where the user's own brand is plotted, and everything else yields to those two.**

## 2. The 10-second test

**Falsifiable statement.** After 10 seconds on any of the 7 routes, at 1440 and at 390, in either theme, a first-time user can say: (a) which page they are on, (b) the single headline number and what it is based on, (c) the one thing the page asks them to do next. A reviewer runs it by covering the screen after 10 s and asking those three questions; two of three wrong on any route is a FAIL.

**Current result: FAIL on 7 of 7 routes.** Where and why:

| Route | Screenshot | Fails clause | Why |
|---|---|---|---|
| Overview | `overview-desktop-dark.png` | b | Two headline colours compete: the 72 ring carries a violet glow and the 48% mention rate is painted amber (`Dashboard.tsx:719`, `tone === 'warn' ? 'text-amber-400'`). The score has no basis stamp: the user cannot tell it is all-time while the KPIs are 7-day. |
| AI Visibility | `ai-visibility-desktop-dark.png` | b, c | 10 top-level blocks above and around the prompt table (score, engine cards, coming-soon cards, locked strip, Fix This, prompt summary, two prompt tables, could-not-check, legend, competitors, category breakdown), past the nine-element ceiling. Three amber accents (P1 rule, P1 title, Partial pill), one green pill, green result cells and red competitor chips share the first 1200 px. |
| Sentiment | `sentiment-desktop-dark.png` | b | The score tile wears a violet border, so it reads as a selected control, not a number. A full-width lime bar is the brightest object on the page. Y-axis ticks are clipped to "%" and ")%" (`YAxis` width too small). |
| Mentions | `mentions-desktop-dark.png` | b | Three equal KPI tiles with three icon colours (green, amber, blue). Every rank (#2, #3) is lime, the sentiment-positive hue used as a rank colour, so 10 green numbers compete. Category badges carry blue and violet fills that encode nothing. |
| Competitors | `competitors-desktop-dark.png` | b | "Lantern Table Co" is red, competitor counts are red, the brand's own count is green: red reads "bad" for a neutral fact. On 390 the x-axis labels collide (`competitors-mobile-dark.png`, "Your brandLantern T..Cedar"). |
| Recommendations | `recommendations-desktop-dark.png` | b, c | A red banner, red competitor chips and two amber pills per card: four alarm signals before any action. On 390 the "2 actions" badge overlaps the Refresh button (`recommendations-mobile-dark.png`). Container is 832 px while other routes are 960 to 1088. |
| Prompts | `prompts-desktop-dark.png` | b, c | 24 separate bordered cards; the amber plan banner is the only strong object, so it reads as the page's subject. |
| Shell, all | `*-mobile-*.png` | a | Bottom nav labels truncate ("Overv...", "Comp...", "Reco...", "Prom...") and two items both read "AI" (AI Visibility and AI Mentions). Bottom nav order differs from the sidebar (blueprint 3.2). |

**Pass condition for this spec:** acceptance criteria AC-1 to AC-30 in section 14.

## 3. Direction A, "Instrument": the rules

The marketing homepage is the Live Instrument (`brandgeo/web/index.html`, spec `docs/design/landing-instrument-spec-2026-08-07.md`). The dashboard must feel like the same product seen from inside. Seven rules, each one checkable:

1. **One container, one grid.** Every route uses the same `Page` frame (section 5.4). Today there are four widths (Overview 1072, Sentiment and Competitors 1088, Mentions and Prompts 960, Recommendations 832).
2. **Six type sizes, weight cap 600.** Exactly the six roles in section 5.1. `font-bold` and heavier resolve to 600 by configuration, so a builder cannot exceed it.
3. **Numbers are ink, never status colour.** Every value renders in `ink` with tabular figures. Status, polarity and threshold are carried by a glyph and a badge beside the number, never by repainting the number.
4. **Violet is signal, not decoration.** Violet appears in exactly five places: the nav rail, the selected state of a control, the focus ring, the primary button, and the series that is the user's own brand (score arc, "you" bar, "you" line). No violet borders on content cards, no violet icons, no violet glow.
5. **Near-neutral surfaces with real separation.** The surfaces are the marketing site's measured neutrals (hue 271 to 286, chroma 0.007 to 0.017). Content separates by exact 1 px edges, not by glow or tint. Interactive boundaries clear 3:1; decorative hairlines are allowed below it.
6. **One meaning per hue.** Engines own nine hues, sentiment and status own lime, rose and amber, the brand owns violet, and category labels own none (neutral badges).
7. **Motion only with a job.** Section 8. Ambient glow, pulse on content, hover lift on non-interactive cards are cut.

**Shared spine with marketing (identical tokens, density differs):** `--canvas`, `--surface`, `--surface-2`, `--line`, `--line-2`, `--ink`, `--ink-2`, the violet trio `#8b5cf6` / `#7c3aed` / `#a78bfa` (dark) and `#7c3aed` / `#6d28d9` (light), Inter, the 12 px radius, the 2 px focus outline at offset 2. **Where the dashboard deliberately diverges:** status colours (the marketing light `--ok #047857` measures deltaE 3.9 against the AI Overviews engine and `--warn #b45309` 4.7 against Grok, so they cannot exist in a product that plots engines), a larger third ink step for denser surfaces, no Instrument Serif and no JetBrains Mono (one line: a second and third web font cost about 60 KB on every app load for a display role the dashboard does not have; Inter `tnum` carries the numeric register).

---

## 4. Token system (amendments I1 to I12 to `docs/DESIGN-SYSTEM.md`)

### 4.1 Architecture: light mode by construction

- Every semantic token is declared in `src/index.css` as an RGB triplet under `:root` (dark, the default) and again under `html.light` (the existing switch in `src/lib/themeContext.tsx:23-26`, unchanged).
- `tailwind.config.js` maps each token as `rgb(var(--token) / <alpha-value>)`. A builder writes `bg-surface text-ink border-line` and the class is themed in both modes with no override. That is the whole mechanism; no `!important` is involved.
- Engine colours stay one hex per engine in `ENGINE_META` (both themes, ruling J1 of the 2026-07-27 spec, kept). Charts read them and the sentiment tokens through `chartTheme.ts` because Recharts writes SVG attributes and cannot resolve `var()`.
- **Legacy aliases (I11).** The old variables are re-pointed at the new values so the 18 out-of-scope routes (Account, Prospects, Revenue, Affiliates, Onboard, Social, SEO, Tickets, auth screens) adopt the new surfaces in the same build without a code change: `--dark-900 = --canvas`, `--dark-800 = --surface`, `--dark-700 = --surface-3`, `--dark-600 = --line-2`, `--text-base = --ink`, `--text-secondary = --ink-2`, `--surface-nav = --canvas`, `--surface-nav-active = --surface-3`, `--text-nav-active = --ink`, `--text-nav-idle = --ink-2`, `--rail-active = --accent-ink`, `--surface-bar = --canvas`, `--grid-line = --line`, `--axis-ink = --ink-3`.
- **The 92 `!important` remaps (I12).** They move, unchanged, into one fenced block at the end of `index.css` headed `LEGACY REMAPS: serve files outside Lane 1 and Lane 2 only; delete when the last call site migrates`. No file in Lane 1 or Lane 2 may depend on any of them (AC-22, AC-23). Literal deletion of the block is not reachable inside the two lanes: 18 page files outside both lanes still carry `text-white`, `text-slate-*` and `bg-*-500/NN` classes, and deleting the remaps would put dark ink on dark-mode-tuned tints in light mode on those pages. The block is deleted by a follow-up Lane 3 packet (section 15.3) that migrates those 18 files to the same tokens. Lane 1 prunes any remap with zero remaining call sites in the same pass (grep, then delete).

### 4.2 Surface, line and ink tokens (I1 to I4)

| Token | Role | Dark hex | Dark OKLCH | Light hex | Light OKLCH |
|---|---|---|---|---|---|
| `--canvas` | page background and sidebar | `#0a0b0e` | 0.150 0.007 271 | `#f7f7fc` | 0.978 0.007 286 |
| `--surface` | cards, tooltips (light), pressed segment | `#101116` | 0.179 0.010 276 | `#ffffff` | 1.000 0.000 n/a |
| `--surface-2` | inset: table header, input fill, control track, row hover, tooltip (dark) | `#16171e` | 0.207 0.014 279 | `#f4f4fb` | 0.969 0.009 286 |
| `--surface-3` | neutral selected: active nav item, neutral badge, skeleton block, meter track | `#1d1e27` | 0.238 0.017 280 | `#ececf4` | 0.945 0.011 286 |
| `--line` | decorative hairline: card border, row divider, gridline | `#23242b` | 0.262 0.013 279 | `#e2e2ea` | 0.915 0.011 286 |
| `--line-2` | stronger hairline: card hover border, tooltip border, disclosure divider | `#32333c` | 0.324 0.016 280 | `#cfcfda` | 0.858 0.015 286 |
| `--edge` | **interactive boundary**, always >= 3:1: input, select, secondary button, idle chip, pressed segment, sidebar divider | `#666a75` | 0.525 0.018 270 | `#85858f` | 0.620 0.015 286 |
| `--ink` | primary text and every number | `#e8e9ed` | 0.934 0.005 275 | `#09090f` | 0.143 0.013 285 |
| `--ink-2` | secondary text, idle nav label, sub-lines | `#9ba1ac` | 0.708 0.017 263 | `#55555e` | 0.453 0.015 286 |
| `--ink-3` | meta text, eyebrows, axis ticks, idle icons | `#878d99` | 0.642 0.019 264 | `#62626c` | 0.500 0.016 286 |

`--ink-3` is lifted one step from the marketing `--t3` (`#7d838f` / `#6b6b75`) because those measure 4.35 and 4.48 on `--surface-3`, under the 4.5 floor; the dashboard draws meta text on `--surface-3` (badges, active nav) and marketing does not.

### 4.3 Accent tokens (I5)

| Token | Role | Dark | Light |
|---|---|---|---|
| `--accent` | fill only: score arc, meter fill, "you" bar | `#8b5cf6` oklch(0.606 0.219 293) | `#7c3aed` oklch(0.541 0.247 293) |
| `--accent-strong` | primary button fill | `#7c3aed` oklch(0.541 0.247 293) | `#6d28d9` oklch(0.491 0.241 293) |
| `--accent-strong-hover` | primary button hover (darken, never lighten) | `#6d28d9` | `#5b21b6` oklch(0.432 0.211 293) |
| `--accent-ink` | accent text, nav rail, focus ring, selected-control border, "you" line | `#a78bfa` oklch(0.709 0.159 294) | `#6d28d9` |
| `--accent-tint` | selected-control fill | `#241d3a` oklch(0.254 0.054 293) | `#ede9fe` oklch(0.943 0.028 295) |
| `--on-accent` | text on `--accent-strong` | `#ffffff` | `#ffffff` |

Hue stays 293 to 295 in every step. No teal anywhere (CLAUDE.md 4.2).

### 4.4 Polarity and status tokens (I6, I7)

Sentiment and status are one family: good, neutral, bad, plus warning. Each has a **mark** value (fills, glyphs, chart segments; floor 3:1), an **ink** value (text; floor 4.5:1) and a **tint** (badge fill). Where mark and ink are equal it is stated.

| Token | Dark | Light | Notes |
|---|---|---|---|
| `--pos` (mark) | `#84cc16` oklch(0.768 0.204 131) | `#58870f` oklch(0.568 0.148 130) | **Light value changes** from `#3f6212` (I7, reason below) |
| `--pos-ink` | `#84cc16` | `#3f6212` oklch(0.453 0.113 131) | text only |
| `--pos-tint` | `#202b16` | `#ecfccb` | |
| `--neu` (mark) | `#666a75` oklch(0.525 0.018 270) | `#71717a` oklch(0.552 0.014 286) | **Both values change** (I7) |
| `--neg` (mark and ink) | `#fb7185` oklch(0.719 0.169 13) | `#9f1239` oklch(0.455 0.171 14) | unchanged |
| `--neg-tint` | `#311e26` | `#ffe4e6` | |
| `--warn` (mark and ink) | `#fbbf24` oklch(0.837 0.164 84) | `#713f12` oklch(0.421 0.090 58) | light is new; marketing `#b45309` collides with Grok |
| `--warn-tint` | `#2c2618` | `#fef3c7` | |

**Why I7 changes three live values.** Measured today with the validator, the shipped light pair `#3f6212` (positive) against `#9f1239` (negative) is **deltaE 2.8 under deuteranopia, FAIL** whenever neutral is 0% and the two segments touch, which is exactly the demo state on `/sentiment`. The 2026-07-30 text-contrast fix moved positive from `#4d7c0f` to `#3f6212` and the chart value followed it (`chartTheme.ts` LIGHT), so the fix for text regressed the chart. Splitting mark from ink fixes both: `#58870f` against `#9f1239` is 11.7 deutan PASS, while text keeps `#3f6212` at 7.08:1. In dark mode the shipped neutral `#94a3b8` against negative `#fb7185` is **3.0 under protanopia** (rose loses red and converges on grey); `#666a75` separates by lightness and measures 11.7 protan PASS. Light neutral `#64748b` is replaced by `#71717a` only to stay on the neutral hue family of the surfaces (16.0 normal, 10.8 deutan, both PASS).

### 4.5 Engine colours (I8): one value changes

ENGINE_META keeps every hex except one:

| Engine | Hex | OKLCH | Status |
|---|---|---|---|
| chatgpt | `#16a34a` | 0.627 0.170 149 | unchanged |
| gemini | `#2563eb` | 0.546 0.215 263 | unchanged |
| claude | `#ea580c` | 0.646 0.194 41 | unchanged |
| perplexity | `#0891b2` | 0.609 0.111 222 | unchanged |
| google_ai | `#db2777` | 0.592 0.218 1 | unchanged |
| **ai_overview** | **`#1c7b5a`** (was `#0f766e`) | 0.521 0.101 165 | **changed** |
| meta | `#c026d3` | 0.591 0.257 323 | unchanged (retired) |
| deepseek | `#6366f1` | 0.585 0.204 277 | unchanged (not live) |
| grok | `#a16207` | 0.554 0.121 66 | unchanged |
| copilot | `#0284c7` | 0.588 0.139 242 | unchanged (not live) |

**Why.** The seven live engines in display order (chatgpt, gemini, claude, perplexity, google_ai, ai_overview, grok) **FAIL the validator today** on every surface: `#0f766e` is chroma 0.086, under the 0.10 floor (reads grey), and sits next to pink at CVD 6.9 protan. `#1c7b5a` passes on all four surfaces with the order unchanged (section 16, run R3). The CLAUDE.md backlog entry "engine palette broken twice over" (Claude vs Meta 9.6, Grok grey, `#10b981` and `#ef4444` double meanings) is **stale**: those were fixed by the 2026-07-27 spec and are not re-opened here.

Alternative recorded, not chosen: `#11886d` with grok and ai_overview swapped in `ALL_ENGINES` lifts worst adjacent CVD from 7.7 to 10.1, but changes a constant beyond "colours only" in `planConfig.ts`. Owner's call; the chosen value is legal because every engine mark already ships with logo, label and legend (secondary encoding).

### 4.6 Elevation, radius, focus (I9)

| Token | Dark | Light | Used by |
|---|---|---|---|
| `--shadow-card` | `none` | `0 1px 2px rgb(9 9 15 / 0.04)` | Card |
| `--shadow-raised` | `0 8px 24px -8px rgb(0 0 0 / 0.6)` | `0 8px 24px -8px rgb(9 9 15 / 0.14)` | tooltip, popover, menu, pressed segment (with `--edge` border) |
| `--radius-card` | 12px | 12px | Card, Notice, tooltip |
| `--radius-control` | 8px | 8px | Button, input, segmented track, nav item, chip |
| `--radius-badge` | 6px | 6px | Badge, result cell |
| focus ring | `outline: 2px solid rgb(var(--accent-ink)); outline-offset: 2px` | same token | every focusable element, via `:focus-visible` in `@layer base` |

Depth is edges plus one shadow token; dark mode has no card shadow because a shadow on `#0a0b0e` is invisible and costs paint.

### 4.7 Tailwind mapping (I10), Lane 1

`theme.extend.colors`:

```
canvas, surface: { DEFAULT, 2, 3 }, line: { DEFAULT, 2 }, edge,
ink: { DEFAULT, 2, 3 },
accent: { DEFAULT, strong, 'strong-hover', ink, tint, on },
pos: { DEFAULT, ink, tint }, neu: { DEFAULT }, neg: { DEFAULT, tint }, warn: { DEFAULT, tint }
```

each value `rgb(var(--<token>) / <alpha-value>)`. Keep `brand` and `dark` for legacy files. `theme.extend.boxShadow`: `card: 'var(--shadow-card)'`, `raised: 'var(--shadow-raised)'`. `theme.extend.borderRadius`: `card: '12px'`, `control: '8px'`, `badge: '6px'`. `theme.extend.fontWeight`: `bold: '600'`, `extrabold: '600'`, `black: '600'` (the weight cap, app-wide). `theme.extend.fontSize`: the six roles of 5.1.

---

## 5. Type, spacing, layout

### 5.1 Type scale: six roles

Inter, `font-feature-settings: 'cv01', 'ss03', 'zero'` kept; numbers add `tnum` through the `tabular-nums` utility, which every primitive that prints a number applies.

| Role (Tailwind `text-*`) | Size / line | Weight | Ink | Used for |
|---|---|---|---|---|
| `display` | 40 / 44 (390: 36 / 40) | 600, tracking -0.02em | ink | the one hero number per route (score) |
| `title` | 24 / 32 (390: 20 / 28) | 600, tracking -0.01em | ink | h1 page title |
| `value` | 20 / 28 | 600 | ink | KPI values, rank in a list row |
| `heading` | 15 / 22 | 600 | ink | h2 card and section headings, list row title |
| `body` | 14 / 20 | 400 (500 for controls) | ink or ink-2 | body, table cells, buttons, nav labels |
| `meta` | 12 / 16 | 500 | ink-3 or ink-2 | eyebrows (uppercase, tracking 0.08em), badges, chips, axis ticks, stamps |

No 9, 10 or 11 px text anywhere in scope (today: `text-[9px]` and `text-[10px]` in `AIVisibility.tsx` and `Dashboard.tsx:666`).

### 5.2 Spacing

4 px base. Allowed steps: 4, 8, 12, 16, 20, 24, 32, 48. Card padding: `compact` 16, `standard` 20, `feature` 24 (the existing `--card-pad-*`, kept). Gap between top-level blocks: 24 (390: 16). Gap inside a card between groups: 16. KPI tiles inside a readout: 0 gap, separated by 1 px `--line` rules.

### 5.3 Breakpoints and grid

| Viewport | Sidebar | Grid | Page padding | KPI readout | Content blocks |
|---|---|---|---|---|---|
| 390 (< 768) | drawer + top bar 56 + bottom bar 64 | 1 column (KPI 2-up) | 16 | 2 x 2 with rules | stacked, full width |
| 768 to 1279 | 240 fixed | 6 columns | 24 | 4-up if >= 640 content width, else 2 x 2 | full width or 3 + 3 |
| 1280+ | 240 fixed | 12 columns | 32 | 4-up | 12, or 8 + 4, or 6 + 6 |

Sidebar narrows from 256 to 240 so 768 keeps a 528 px content column.

### 5.4 The `Page` frame

`<Page>`: `mx-auto w-full max-w-[1200px] px-4 md:px-6 xl:px-8 pt-6 md:pt-8 pb-24 md:pb-12` (the 96 bottom padding at 390 clears the 64 bottom nav). At 1440 the inner column is 1136 px on every route. Reading prose inside a card is capped at 72ch.

Reading order on every route, DOM order equals visual order: PageHeader (h1, subtitle, actions), Notice (max one), hero or KPI readout, primary block, filters for what follows, secondary blocks, disclosures.

**Nine-element ceiling:** max nine top-level blocks per route; PageHeader and the time strip do not count.

---

## 6. Colour application rules (binding on both lanes)

1. **Numbers wear `ink`.** Ranks, counts, percentages, scores. Polarity is a `StatusGlyph` (filled triangle up `pos`, filled circle `neu`, filled triangle down `neg`, triangle-alert `warn`) at 10 px beside the number, plus a Badge when a word exists in the current copy.
2. **Competitors are never red.** A competitor is a neutral fact. Competitor names, counts and chips are `ink` / `ink-2` on neutral badges.
3. **Categories are neutral.** Prompt category badges (Mid, Large, Very Large, General, Tool Discovery, GEO / AIO, Problem-based, Direct Brand) are all Badge `neutral`. Category is identified by its word.
4. **Engine swatches sit on `surface` or `canvas` only.** Measured: ChatGPT `#16a34a` is 2.80:1 on light `--surface-3` and 2.78:1 on light `--accent-tint`. A selected EngineChip therefore keeps `surface` fill and shows selection with an `--accent-ink` border and a check glyph, never a tint fill.
5. **"You vs the field."** The user's brand is the only violet series (`--accent` fill, `--accent-ink` line). Competitors share `--neu` and are told apart by dash pattern and direct label, never by a borrowed hue. Replaces `COMPETITOR_SERIES_COLORS` (`Competitors.tsx:133-142`), which cycles past eight and reuses Claude's orange and ChatGPT's green.
6. **Threshold bars use status marks with a label.** Category breakdown and dimension meters: `>= 50` `pos`, `>= 25` `warn`, else `neg`, with the percentage printed in `ink` beside the bar (logic unchanged; colour source changes only).
7. **One alarm per screen.** At most one `Notice` per route; inside cards, `warn` and `neg` appear only as a glyph or a badge, never as a coloured title or left border.

---

## 7. Component anatomy (Lane 1 primitives)

New files live in `src/components/ui/`, exported from `src/components/ui/index.ts`. Existing shared components keep their file names and props; their internals move to tokens. Props below are the frozen contract Lane 2 builds against.

### 7.1 Shell (`Layout.tsx`)

**Sidebar (>= 768).** Width 240, fill `canvas`, right border 1 px `edge` (3.64:1 dark / 3.42:1 light against canvas). Order: logo row (56 high, logo + "Demo" Badge `neutral`, was amber), admin row, collection progress, nav groups, client card, market block, bottom actions. Group header: `meta` uppercase ink-3, 24 above, 8 below.

**Nav item.** Height 36, radius 8, padding-x 12, gap 12, icon 16. Idle: no fill, label `body` 500 `ink-2`, icon `ink-3`. Hover: `surface-2` fill, label `ink`. Active: `surface-3` fill, label `body` 600 `ink`, icon `ink`, plus a 2 px rail on the left edge (inset 8 px top and bottom, radius 2, `accent-ink`: 7.23:1 dark, 6.65:1 light on canvas). The rail is the 3:1 state cue; the old solid violet chip (`--surface-nav-active #3a2f71`) is retired. Lock glyph `ink-3`.

**Time strip** (only on `TIME_FILTER_ROUTES`, unchanged). Height 48, fill `canvas`, bottom 1 px `line`. Left: label `meta` ink-3 (hidden below 768, kept as the control's `aria-label`). Right at >= 768, full width at 390: `SegmentedControl`.

**Mobile top bar (< 768).** Height 56, `canvas`, bottom `line`, hamburger (44 x 44 hit), logo, Demo badge.

**Mobile bottom bar (< 768).** Height 64 plus safe area, fill `surface`, top 1 px `line`. **Five slots in sidebar order:** Overview, Visibility, Sentiment, Mentions, More. Labels are tightenings of the sidebar labels (no new meaning). "More" opens the same drawer the hamburger opens and shows active when the route is Competitors, Recommendations or Prompts. Slot: icon 20 over `meta` label, hit area full slot (78 x 64), active = `ink` + 2 px `accent-ink` bar on the top edge, idle = `ink-3`. Replaces the 7-item array at `Layout.tsx:262-270` whose order differs from the sidebar.

### 7.2 Page primitives

| Component | Props | Anatomy |
|---|---|---|
| `Page` | `children` | section 5.4 frame |
| `PageHeader` | `title`, `subtitle?`, `badge?: ReactNode`, `actions?: ReactNode` | h1 `title` + badge inline on the same baseline (wraps as a unit, never overlaps); subtitle `body` ink-2, max 72ch; actions right-aligned at >= 640, a full-width row under the subtitle below 640 with buttons `flex-1`. Max one primary button. |
| `Card` | `pad?: 'compact' \| 'standard' \| 'feature' \| 'none'`, `as?`, `interactive?` | `surface` fill, 1 px `line` border, radius 12, `shadow-card`. `interactive`: hover border `line-2` and fill `surface-2`, 180 ms; focus ring. No hover lift. |
| `SectionHeader` | `title`, `description?`, `actions?`, `level?: 2 \| 3` | h2 `heading` ink; description `meta` ink-3 normal case; actions right. 16 below. |
| `Notice` | `tone: 'warn' \| 'neg' \| 'accent'`, `title`, `children?`, `action?` | Card with a 3 px left rule in the tone mark, StatusGlyph 16 in the tone, title `heading` ink, body `body` ink-2. Replaces the red and amber bordered banners. |

### 7.3 Data primitives

| Component | Props | Anatomy |
|---|---|---|
| `Stat` | `label`, `icon?`, `value`, `unit?`, `sub?`, `tone?: 'neutral' \| 'warn' \| 'alert'`, `delta?`, `spark?`, `pending?`, `emptyLabel?`, `size?: 'tile' \| 'hero'` | label row: icon 14 ink-3 + `meta` uppercase ink-3. Value `value` (hero: `display`) ink `tabular-nums`; unit `meta` ink-3 on the baseline, never superscript. `tone` renders a StatusGlyph after the value (`warn` triangle-alert, `alert` triangle-down) and never recolours the value. `sub` `meta` ink-2. `spark` 24 high, 1.5 px `ink-2` stroke, no fill, last point 4 px dot `ink`. `pending`: SkeletonStat. Empty: `emptyLabel` in `body` ink-3, value slot keeps its height. |
| `ReadoutRow` | `children: Stat[]` | one Card, `pad='none'`, Stats in a grid with 1 px `line` rules between cells (`divide-x` at 4-up, a 2 x 2 grid with both rules at 390), each cell padded 20. This is the Live Instrument readout. |
| `Meter` | `value: number \| null`, `tone?: 'accent' \| 'pos' \| 'warn' \| 'neg'`, `label?`, `showValue?` | track 4 high (6 on AI Visibility dimensions), radius 2, `surface-3`; fill in the tone mark (accent vs track: 3.91:1 dark, 4.85:1 light). `null` renders the track only and `n/a` in ink-3. |
| `ScoreDial` | `score: number \| null`, `checks?`, `windowLabel?`, `band?: { label, tone }`, `size?: 'lg' \| 'md'` | SVG 160 (md 136), stroke 8, round caps, track `surface-3`, arc `accent`. No gradient, no glow, no drop shadow. Centre: number `display` ink tabular + `%` in `meta` ink-3 on the baseline. Under the dial: eyebrow `meta` uppercase ink-3, then the stamp `meta` ink-3 tabular built from existing values ("{checks} checks, {windowLabel}"). Band: Badge in its tone with glyph, only when `score !== null`. `null`: track only, centre "Not measured yet" `body` ink-2 (existing copy). |
| `StatusGlyph` | `kind: 'pos' \| 'neu' \| 'neg' \| 'warn' \| 'info'`, `size?` | lucide-react icon (no new dependency), fill the kind's mark, `aria-hidden`; the adjacent text carries meaning. |
| `DataTable` styles | `tableClasses` export | Card `pad='none'`. Header row 36 high, `surface-2`, `meta` uppercase ink-3, bottom `line`. Body rows min 48, `body` ink, dividers `line`. Numeric cells right-aligned `tabular-nums`. Rank column 32 wide `meta` ink-3. Interactive row hover `surface-2`. Real `<table>` semantics, or `role="table"` / `row` / `cell` where a grid is unavoidable. |

### 7.4 Control primitives

| Component | Props | Anatomy and states |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost'`, `size?: 'md' \| 'sm'`, `icon?`, `loading?` | md: height 36, padding-x 14, `body` 500, radius 8, icon 16 gap 8. sm: height 28, `meta` 500. Below 768 every button gets min height 44 via padding. Primary: `accent-strong` fill, `on-accent` (5.70:1 dark, 7.10:1 light), hover `accent-strong-hover` (7.10, 8.98). Secondary: `surface-2` fill, 1 px `edge` border (3.30:1 dark, 3.34:1 light on surface-2), `ink`, hover `surface-3`. Ghost: no fill, `ink-2`, hover `surface-2` and `ink`. Disabled: 50% opacity, `cursor-not-allowed`, keeps its label. Loading: label kept, a 16 px spinner replaces the icon, width does not change. |
| `Badge` | `tone: 'neutral' \| 'accent' \| 'pos' \| 'warn' \| 'neg'`, `glyph?: boolean` | height 20, padding-x 6, radius 6, `meta`. neutral: `surface-3` + ink-2 (6.38 / 6.28). accent: `accent-tint` + `accent-ink` (5.88 / 5.98). pos: `pos-tint` + `pos-ink` (7.49 / 6.52). warn: `warn-tint` + `warn` (9.00 / 7.79). neg: `neg-tint` + `neg` (5.80 / 6.68). No border. |
| `Chip` (filter) | `selected`, `count?`, `swatch?: string`, `onClick` | height 28 (390: 32, row gap 8, satisfies WCAG 2.5.8), padding-x 10, radius 8, `meta` 500. Idle: `surface-2` fill, 1 px `edge` border, `ink-2`. Selected: `accent-tint` fill, 1 px `accent-ink` border (6.93:1 dark, 7.10:1 light on surface), `accent-ink` text 600, leading check 12. With `swatch` (engines): swatch 8 px circle, and selected keeps `surface` fill (rule 6.4). Count `tabular-nums`. `aria-pressed`. |
| `ChipGroup` | `label`, `children` | a row with a `meta` ink-3 label ("Engine", "Category", "Sentiment") so two chip rows never read as one. Wraps; no horizontal scroll. |
| `SegmentedControl` | `options`, `value`, `onChange`, `ariaLabel` | track `surface-2`, 1 px `line`, radius 8, padding 2. Segment height 28, padding-x 12, `body` 500 ink-2. Pressed: `surface` fill, 1 px `edge` border (3.30 / 3.34 against the track), `ink` 600, `shadow-raised`. The pressed indicator slides (section 8). `role="radiogroup"`, arrow keys move. Used for the time strip and the W / M / Q trend toggles. |

### 7.5 States primitives

| Component | Anatomy |
|---|---|
| `EmptyState` (existing file, restyled) | `variant: 'page' \| 'inline'`. Icon 20 ink-3 in a 40 square `surface-3` radius 8; title `heading` ink; body `body` ink-2 max 48ch; at most one action (Button). `inline` min height 160 inside its card (today 300 to 400 px of blank, `competitors-desktop-dark.png` bottom). |
| `LoadErrorCard` (existing) | Card standard; StatusGlyph `neg` 16; title `heading`; body ink-2; Retry secondary. Border stays `line` (no red border). |
| `Skeleton` set (existing file, extended) | `SkeletonBlock`, `SkeletonText lines`, `SkeletonStat`, `SkeletonReadout count`, `SkeletonDial`, `SkeletonTable rows cols`, `SkeletonChart height`. Block fill `surface-3`, radius matches the element it stands for. Each mirrors the final element's box exactly so nothing reflows. |
| `RouteSkeleton` (existing) | PageHeader skeleton + SkeletonReadout(4) + two SkeletonChart(240) cards inside `Page`. |
| `FeatureLocked` (existing) | Card standard; lock glyph ink-3; title `heading`; body ink-2; one primary "upgrade" button (existing copy). |
| `PromptResultCell` (existing) | radius 6, 40 x 40 (grid) / 32 (tile). Mentioned: `pos-tint` fill, check glyph `pos`, rank `meta` 600 ink tabular. Answered not mentioned: `surface-2`, x glyph `neg` 12. No answer: `surface-2`, minus glyph ink-3. Could not check: `surface-2`, triangle-alert `warn`. Not checked yet: `surface-2`, clock ink-3. Locked: transparent, lock ink-3. A zero-mention tenant sees a grey grid with small glyphs, not a wall of red. |
| `EngineChip` (existing) | swatch 8 on `surface`; label `meta` ink-2; selected per rule 6.4. |
| `TrendDelta` (existing) | glyph (triangle up `pos` / down `neg`) + signed number `meta` ink-2 tabular + unit. Number never coloured. |
| `ChartTooltip`, `ChartLegend` (existing) | section 9. |

### 7.6 Mapping the old primitives

`Typography.tsx` `PageTitle` becomes `PageHeader`'s h1; `SectionHeading` becomes `SectionHeader`; `StatLabel` and `StatValue` become `Stat` internals (keep the old exports as thin wrappers so out-of-scope pages compile). `MotionCard` keeps its entrance variant and loses hover lift on non-interactive use. `ScoreBadge.tsx` `GeoScoreRing` re-exports `ScoreDial`; `ClassificationBadge` is dead per the #72 audit, leave it.

---

## 8. Motion spec

Every row has a job. Durations are the existing tokens (`--motion-fast` 180, `--motion-base` 260, `--motion-slow` 500, `--ease-out` cubic-bezier(0.16, 1, 0.3, 1)); `src/lib/motion.ts` is not edited. `MotionConfig reducedMotion="user"` (App.tsx) covers Motion components; CSS transitions get an explicit `@media (prefers-reduced-motion: reduce)` rule in `index.css`.

| Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|
| Top-level blocks on a route | first data paint per route visit | opacity 0 to 1, translateY 8 to 0 | 260 | ease-out | 40 ms, max 6 blocks, rest at once | guides the eye down the reading order from the hero | appear at final state |
| ScoreDial arc | first data paint only, not on refetch | stroke-dashoffset from empty to value | 500 | ease-out | none | points the eye at the one number first | drawn at value |
| ScoreDial number | same | none (no count-up) | n/a | n/a | n/a | a counting number is unreadable for 500 ms | n/a |
| SegmentedControl indicator | value change | layout position (Motion `layoutId`) | 180 | ease-out | none | confirms the new window | jumps |
| Chip select | click | background and border colour | 180 | ease-out | none | confirms the action | instant |
| Button hover / press | hover, active | background colour; press scale 0.98 | 180 / 100 | ease-out | none | confirms the press | colour only, no scale |
| Card interactive hover | hover | border and background colour | 180 | ease-out | none | shows it is clickable | instant |
| Nav item | hover / route change | background colour; rail opacity 0 to 1 | 180 | ease-out | none | confirms where you went | instant |
| Disclosure (`Collapse`) | toggle | height, opacity | 260 | ease-out | none | keeps the user's place while content opens | instant |
| Chart series | data change | Recharts tween | 300 | ease-out | none | shows what changed on a filter or window change | `isAnimationActive={false}` |
| Skeleton | loading | opacity 0.55 to 1 to 0.55 | 1200 loop | ease-in-out | none | masks latency, signals "working" | static at 0.7 |
| Tooltip | hover | opacity | 120 | ease-out | none | tracks the pointer without lag | instant |
| Notice | mount | opacity | 180 | ease-out | none | arrives without shifting content | instant |

**Cut:** score ring glow and gradient (`overview-desktop-dark.png`), `.card-hover-lift` on non-interactive cards, any pulse on content that is not a skeleton, count-up numbers.

---

## 9. Charts

### 9.1 `chartTheme.ts` values (Lane 1)

| Key | Dark | Light |
|---|---|---|
| `gridLine` | `#23242b` (line) | `#e2e2ea` |
| `axisInk` | `#878d99` (ink-3, 5.66:1 on surface) | `#62626c` (6.03:1) |
| `tooltipSurface` | `#16171e` | `#ffffff` |
| `tooltipBorder` | `#32333c` | `#cfcfda` |
| `tooltipInk` | `#e8e9ed` | `#09090f` |
| `cardSurface` | `#101116` | `#ffffff` |
| `sentimentPositive` | `#84cc16` | `#58870f` (changed, I7) |
| `sentimentNeutral` | `#666a75` (changed) | `#71717a` (changed) |
| `sentimentNegative` | `#fb7185` | `#9f1239` |
| `railActive` (rename allowed: `you`) | `#8b5cf6` fill / `#a78bfa` line | `#7c3aed` |
| new `field` | `#666a75` | `#71717a` |
| new `track` | `#1d1e27` | `#ececf4` |

### 9.2 Marks

- Grid: horizontal lines only, 1 px `gridLine`, no vertical grid, no dashes.
- Axes: no axis line, no ticks; tick labels `meta` 12 `axisInk` tabular. **YAxis width 44** (fixes the clipped "%" ticks on `/sentiment` and `/competitors`). X labels truncate at 12 characters with the full name in the tooltip.
- Bars: max width 24 single series, 16 grouped; radius 4 on the data end only, square at the baseline; 2 px gap between adjacent bars and stacked segments via `stroke={cardSurface}` width 2.
- Lines: 2 px, no dots except the last point (4 px); `activeDot` 6 px with a 2 px `cardSurface` ring. Competitor field lines: dash patterns `0` (solid), `6 3`, `2 3` for competitors 1 to 3, all in `field`; the user's line solid `you`. Each line direct-labelled at its last point (`meta` ink-2), plus the legend.
- Tooltip: `tooltipSurface`, 1 px `tooltipBorder`, radius 12, `shadow-raised`, padding 8 x 12; label `meta` ink-3; rows swatch 8 + name `meta` ink-2 + value `meta` 600 ink tabular right-aligned.
- Legend: above the plot, left-aligned, swatch 8 + `meta` ink-2; for >= 2 series always present.
- Sentiment stacks: fixed order positive, neutral, negative; each segment carries its glyph in the legend and tooltip.

### 9.3 When a chart becomes a number or a list

| Condition | Replace with |
|---|---|
| A category axis with one category (one engine with data) | A Meter list: one row per series, name `body` ink, Meter, value `body` ink tabular. Applies to Sentiment "by engine" and Competitors "visibility by engine" in the demo state. |
| A time series with fewer than 2 buckets | `EmptyState inline` with the existing copy "Not enough data yet" / "Trend fills in as collections accumulate", min height 160. |
| More than 4 categories on a vertical bar chart at < 640 px | The same data as a horizontal bar chart (`layout="vertical"`), category labels left in a 112 px column. Fixes `competitors-mobile-dark.png` label collision. |
| A 100% stacked bar where one segment is 100% | Keep the bar at 8 px height, add the sentence of segment labels beneath (already present). |
| More than 3 competitor lines | Plot the top 3 by mentions in the window plus the user; the table carries the rest. |

---

## 10. State inventory

| Component | Empty | Loading | Partial | Error | Locked by plan | Success |
|---|---|---|---|---|---|---|
| ScoreDial | track only, "Not measured yet", no band | SkeletonDial (same box) | score shown; stamp counts only ok checks; Badge warn "Partial" if the page already exposes partial | parent shows LoadErrorCard | n/a | arc + number + stamp + band |
| Stat / ReadoutRow | `emptyLabel`, height kept | SkeletonStat per cell | value + `sub` | parent LoadErrorCard | value replaced by lock glyph + "Unlock on {plan}" Badge (existing copy) | value |
| Meter | track + `n/a` | SkeletonBlock 4 high | fill to value | n/a | track + lock | fill |
| Chart card | EmptyState inline 160 | SkeletonChart, same height as the chart | renders available series; a meta line names what is missing | LoadErrorCard inside the card | FeatureLocked inline | chart |
| DataTable | EmptyState inline in the body | SkeletonTable with final column widths | rows + a meta footer "N of M shown" (existing where present) | LoadErrorCard | locked columns show lock cells | rows |
| PromptResultCell | "Not checked yet" | SkeletonBlock 40 | per-cell state | "Could not check" | lock | mentioned / not mentioned |
| Chip / ChipGroup | hidden when there is one option and it is "All" | SkeletonBlock row | counts may read (0) | n/a | locked chip disabled + lock glyph | selectable |
| Button | n/a | `loading` spinner, width fixed | n/a | n/a | disabled + lock + reason in `title` and visible sub-text | enabled |
| Notice | not rendered | not rendered | warn tone | neg tone | accent tone with upgrade action | not rendered |
| Layout shell | n/a | logo + nav render immediately; content area shows RouteSkeleton | collection progress row in sidebar | n/a | locked nav items with lock glyph | normal |

---

## 11. Per-page specs (Lane 2)

Each list is in priority order; the screenshot it fixes is named. All use `Page` and `PageHeader`.

### 11.1 Overview, `src/pages/Dashboard.tsx`

Layout at 1280: Hero Card `feature` 12 columns, inside a 4 + 8 grid: ScoreDial left, a 3 x 2 dimension readout right. Then ReadoutRow of 4 KPIs. Then the existing disclosure. At 390: dial centred, dimensions 2 x 3, ReadoutRow 2 x 2.

1. **Hero becomes ScoreDial** with stamp ("{checks} checks, all time" from existing values) and band Badge; glow and gradient removed. Fixes `overview-desktop-dark.png` ring glow and the missing basis.
2. **Mention rate value in ink.** `Stat tone="warn"` keeps its logic, renders a glyph, no amber value. Fixes `overview-desktop-dark.png` and `-light` (orange 48%).
3. **Key metrics** become one ReadoutRow; sparklines `ink-2`, 24 high, not full-width rules under every stat.
4. **Dimension readout:** label `meta` uppercase ink-3, value `value` ink tabular, Meter 4 px accent under each. Undefined dimensions read `n/a` (existing `dimNotApplicable`).
5. Disclosure "Show engine breakdown & recent activity": Button secondary, full width at 390. Inside: engine chart per section 9; recent mention / gap rows use `EngineChip` and StatusGlyph (replaces `Dashboard.tsx:666` 10 px coloured text).
6. Mixed-window note (`Dashboard.tsx:582-592`) stays, as `meta` ink-3 under the ReadoutRow.

**First run** (no ok rows): Hero Card holds EmptyState `page` with the existing "Not measured yet" title and the existing first-run action (to `/prompts` or Run collection, whichever the current branch chooses); KPI cells show `emptyLabel`; no 0% anywhere, no band.

### 11.2 AI Visibility, `src/pages/AIVisibility.tsx`

Target: 6 top-level blocks (was 10): PageHeader, Score, Engines, Fix This, Your prompts, Breakdown.

1. **PageHeader:** title + market Badge `neutral` inline; actions Run Collection (the page's only primary) and Reload (secondary). At 390 actions go full width under the subtitle (fixes the two-line wrapped button in `ai-visibility-mobile-dark.png`).
2. **Score card:** ScoreDial md left; six dimension rows right (name `body` 500 ink, description `meta` ink-3, value `body` 600 tabular, Meter 6). "Strong" pill becomes Badge `pos` with glyph.
3. **Engines card** merges engine status cards, coming-soon cards and the locked strip into one Card: a responsive grid of engine tiles (min width 220 so "Gemini" never truncates, fixes "Gem..." in `ai-visibility-desktop-dark.png`), tile = logo 24 + name `heading` + rate `value` tabular + "10/21 prompts, best #2" `meta` ink-2 + state Badge (Partial `warn`, Soon `neutral`, Locked `neutral` with lock and the existing "Unlock on {plan}" text). Order follows `ALL_ENGINES`.
4. **Fix This:** each item is a row, not a bordered card: priority Badge (P1 `warn`, P2 `neutral`), title `heading` ink (no amber or orange title), body ink-2, "Recommended fix" inset `surface-2` radius 8 padding 12. Actions all secondary/ghost: Copy as AI prompt (secondary), Mark as done (secondary with check), Not for us (ghost). Left amber rule removed. Done state: Badge `pos`.
5. **Your prompts:** summary sentence `heading`; ChipGroup "Category" and SegmentedControl "Sort" on one row at >= 1024, stacked at 390; Export CSV ghost. Both tables use DataTable styles; PromptResultCell per 7.5; the legend moves into the table card footer (`meta`). "Where you do not appear yet" and "Could not be checked" stay as SectionHeaders inside the same card, separated by `line-2`.
6. **Breakdown** (one `Collapse`, closed by default on 390, open at >= 1280): "Top competitors" as neutral Badges with rank `meta` (no red chips) and Category breakdown as Meter rows (rule 6.6).

**First run:** existing "Not measured yet" ring and per-engine "Not measured yet, run a collection" lines kept; result cells "Not checked yet"; Fix This hidden until items exist; Breakdown hidden.

### 11.3 Brand Sentiment, `src/pages/BrandSentiment.tsx`

1. **KPI ReadoutRow** of four: score (value + `/100` unit, `sub` = band label in ink-2 with glyph), Positive, Neutral, Negative (each label carries its StatusGlyph; values ink). Remove the violet border from the score tile (`sentiment-desktop-dark.png`).
2. **Overall breakdown:** bar 8 px with 2 px gaps, segment order fixed, legend with glyphs.
3. **By engine:** when one engine has data, omit this chart (it repeats the overall bar); with >= 2, stacked horizontal bars per engine, YAxis 112 px category column. Fixes the clipped ticks.
4. **Over time:** SegmentedControl W / M / Q; with < 2 buckets, EmptyState inline 160.
5. **Signals:** ChipGroup "Sentiment" and ChipGroup "Engine"; feed rows in one Card with dividers; empty filter result EmptyState inline.
6. Market badge (blueprint U3) shown as `meta` "Collection market: {name}" only if it stays; no filter semantics.

**First run (backlog: 0 buttons, 0 links dead end):** EmptyState `page`, title existing "Not measured yet", one action Button to `/ai-visibility` labelled `[copy: run your first collection]` (bg-copy owns the words). KPIs hidden, not zeroed.

### 11.4 AI Mentions, `src/pages/Mentions.tsx`

1. **ReadoutRow** of three; icons ink-3 (no green, amber, blue icons) (`mentions-desktop-dark.png`).
2. **Filters:** ChipGroup "Engine" (EngineChip swatches) and ChipGroup "Category" (neutral). Explanatory line `meta` ink-3 above.
3. **List:** one Card, rows with dividers (not 10 separate cards). Row: rank column 56 (`value` ink tabular "#2", `meta` ink-3 "pos" under it; no lime), then EngineChip + category Badge neutral + sentiment glyph with `meta` label ink-2, then prompt `body` ink (2-line clamp at 390, 1 line at >= 768), chevron ink-3; expanded snippet in `surface-2` inset.
4. Container moves to `Page` (was 960 centred).

**First run:** EmptyState `page` with action to `/ai-visibility` (`[copy: run your first collection]`).

### 11.5 Competitors, `src/pages/Competitors.tsx`

1. **ReadoutRow** of four. "Top competitor" value is the name in `heading` ink, `sub` "1 AI mentions" ink-2. No red, no green (`competitors-desktop-dark.png`).
2. **AI mention count:** you bar `accent`, competitors `field`; at < 640 horizontal (section 9.3).
3. **Visibility by engine:** one engine with data, Meter list (you + competitors); >= 2, grouped bars keyed by brand, you `accent`, field `field`.
4. **Table:** real table semantics; you row `accent-tint` background + Badge `accent` "you"; counts and positions ink tabular; trend glyph per row in `neg`/`pos` only as a glyph; delete button always visible as ghost icon button 32 (hit 44 at 390), not hover-only (`Competitors.tsx:636`). At 390: columns Competitor, Mentions, Avg position; names wrap to 2 lines max with no 3-line "Green / Plate / Kitchen" stack (name column min 140).
5. **Performance over time:** lines per rule 6.5; empty state inline 160.
6. "Add manually" becomes secondary (the page has no primary).

**First run:** ReadoutRow `emptyLabel`; charts hidden; table EmptyState inline with "Add manually" as its action.

### 11.6 Recommendations, `src/pages/Recommendations.tsx`

1. **PageHeader** with "2 actions" Badge `neutral` inline after the title and Refresh secondary; at 390 the badge stays with the title and Refresh drops to its own row (fixes the overlap in `recommendations-mobile-dark.png`).
2. Container moves to `Page` (was 832).
3. **Engine summary:** engine tiles as in 11.2 item 3; "Low" Badge `neg` with glyph.
4. **Competitors in AI responses:** neutral Badges, rank `meta` (no red chips).
5. **Status banner** becomes the route's single `Notice tone="neg"`.
6. **AI Analysis:** SectionHeader with Claude Badge `neutral` and "Generate insights" secondary; the dashed prompt box becomes EmptyState inline (solid card, no dashes).
7. **Priority actions:** Card per action; impact Badge `warn` with bolt glyph; effort `meta` ink-3 with clock (not amber); title `heading` ink; EngineChip; expanded "Why this matters" inset `surface-2`; steps numbered with 20 px `surface-3` circles `meta` ink-2 tabular.

**First run:** EmptyState `page`, action to `/ai-visibility`; Generate insights disabled with the existing reason text.

### 11.7 Prompts, `src/pages/Prompts.tsx`

1. **PageHeader** subtitle carries the allowance as `AllowanceMeter` (Meter + "{used} of {limit} prompts used on {plan}" ink-2 tabular); actions Add prompt (primary when allowed, disabled with lock when at limit) and AI Discover (secondary).
2. **Limit banner** becomes `Notice tone="warn"`.
3. **Filters:** ChipGroup "Category" with counts.
4. **List:** one DataTable Card (fixes 24 separate cards in `prompts-desktop-dark.png`). Columns: # (32, ink-3 tabular), Category (Badge neutral, fixed 112 column so prompt text aligns), Prompt (`body` ink, wraps), actions (edit, archive ghost icon buttons 32, always visible). At 390: row = "# + prompt" line, then a second line with the category Badge left and actions right (fixes ragged text start in `prompts-mobile-dark.png`).

**First run:** EmptyState `page`, primary Add prompt, secondary AI Discover.

---

## 12. Data legibility rules

1. Percentages: whole numbers (`48%`); below 1 and above 0 prints `<1%`; never a trailing `.0`. No space before `%`.
2. Average position: one decimal with `#` prefix (`#2.9`); integer ranks without decimal (`#2`).
3. Counts: thousands separator from the active locale (`3,829`); `tabular-nums` always.
4. Score: integer out of 100; the `%` on the dial is a unit at `meta` size, not a superscript.
5. Deltas: signed (`+4 pts`, `-2 pts`), glyph carries direction, number in ink-2.
6. Undefined values: `n/a`. Never a dash glyph, never `0%` for "not measured".
7. Dates: `1 Jul`; add the year only when it is not the current year; windows as `1 Jul to 7 Jul`.
8. Every headline number carries its basis (checks count, window) within one line of it.
9. A chart that a sentence or a single Meter list can replace is replaced (section 9.3).
10. Units are printed once per column header in tables, not per cell.

---

## 13. Accessibility floor

### 13.1 Contrast ledger (measured)

| Pair | Dark | Light | Floor |
|---|---|---|---|
| ink on canvas / surface / surface-2 / surface-3 | 16.22 / 15.54 / 14.73 / 13.66 | 18.59 / 19.86 / 18.14 / 16.90 | 4.5 |
| ink-2 on the same four | 7.58 / 7.26 / 6.88 / 6.38 | 6.91 / 7.38 / 6.74 / 6.28 | 4.5 |
| ink-3 on the same four | 5.90 / 5.66 / 5.36 / 4.97 | 5.65 / 6.03 / 5.51 / 5.13 | 4.5 |
| accent-ink on the same four | 7.23 / 6.93 / 6.56 / 6.09 | 6.65 / 7.10 / 6.49 / 6.05 | 4.5 |
| accent-ink on accent-tint (selected chip text) | 5.88 | 5.98 | 4.5 |
| on-accent on accent-strong / hover | 5.70 / 7.10 | 7.10 / 8.98 | 4.5 |
| accent-strong vs surface (button boundary) | 3.31 | 7.10 | 3.0 |
| edge on canvas / surface / surface-2 / surface-3 | 3.64 / 3.49 / 3.30 / 3.06 | 3.42 / 3.65 / 3.34 / 3.11 | 3.0 |
| nav rail (accent-ink) on canvas | 7.23 | 6.65 | 3.0 |
| focus ring (accent-ink) on surface | 6.93 | 7.10 | 3.0 |
| accent arc / meter fill on track (surface-3) | 3.91 | 4.85 | 3.0 |
| pos-ink on pos-tint | 7.49 | 6.52 | 4.5 |
| neg on neg-tint | 5.80 | 6.68 | 4.5 |
| warn on warn-tint | 9.00 | 7.79 | 4.5 |
| ink-2 on surface-3 (neutral badge) | 6.38 | 6.28 | 4.5 |
| pos mark on surface | 9.54 | 4.30 | 3.0 |
| neu mark on surface | 3.49 | 4.83 | 3.0 |
| neg mark on surface | 7.01 | 8.02 | 3.0 |
| axis ink (ink-3) on surface | 5.66 | 6.03 | 4.5 |
| engine marks on canvas / surface (min of 7 live) | 3.78 / 3.62 (ai_overview), gemini 3.81 / 3.65 | white 3.30 (chatgpt), canvas 3.09 (chatgpt) | 3.0 |
| line, line-2 (decorative only) | 1.22, 1.50 on surface | 1.29, 1.55 on surface | exempt, never a sole boundary of a control |

### 13.2 DeltaE ledger (measured)

| Set | Dark | Light | Gate |
|---|---|---|---|
| 7 live engines, adjacent, current order, with `#1c7b5a` | CVD worst 7.7 (WARN, legal with logo + label + legend), normal worst 17.1 | identical | normal >= 15 PASS, chroma PASS, band PASS, 3:1 PASS |
| 7 live engines, all pairs, normal vision | min 13.2 (chatgpt vs ai_overview) | same | >= 8 for labelled chips PASS |
| sentiment triad pos / neu / neg | PASS, CVD 11.7 protan, normal 26.1 | PASS, CVD 10.8 deutan, normal 16.2 | CVD >= 8, normal >= 15 |
| pos vs neg touching (neutral 0%) | 10.3 deutan PASS | 11.7 deutan PASS (was 2.8 FAIL) | CVD >= 8 |
| you vs field | 15.7 normal, 13.8 deutan | 23.3 normal, 20.5 deutan | >= 15 / >= 8 |
| pos vs chatgpt | 15.7 | 8.2 | >= 8 (never co-plotted, chips only) |
| neg vs claude / google_ai | 11.6 / 14.3 | 21.1 / 15.1 | >= 8 |
| warn vs grok / claude | 29.0 / 23.4 | 13.7 / 25.1 | >= 8 |
| accent vs deepseek | 6.3 | 8.7 | not gated: accent is never a series; deepseek is not live (recorded risk) |

### 13.3 Focus, targets, headings

- Focus: `:focus-visible` outline 2 px `accent-ink`, offset 2, in `@layer base`; never removed; inputs keep it (not `outline-none`).
- Targets: >= 24 x 24 everywhere (WCAG 2.5.8); >= 44 x 44 for bottom nav slots, hamburger, and every button below 768.
- Headings: one h1 per route (PageHeader), h2 for each top-level block (SectionHeader), h3 inside. No skipped level. Eyebrows are not headings.
- Every chart has a text equivalent: the ReadoutRow or Meter list above it, or a visually hidden table.
- Identity is never colour alone: engines carry logo + label; sentiment carries glyph + label; status carries glyph + badge text.

---

## 14. Acceptance criteria (measurable, for `bg-verify`)

**Tokens and theming**
- **AC-1** `src/index.css` declares every token in 4.2 to 4.6 under `:root` and `html.light` with the exact values in this spec (diff check against the tables).
- **AC-2** `tailwind.config.js` exposes the names in 4.7, each as `rgb(var(--x) / <alpha-value>)`.
- **AC-3** `ENGINE_META.ai_overview.chartColor === '#1c7b5a'`; no other key in `planConfig.ts` changed (`git diff` touches one line).
- **AC-4** Validator run R3 (section 16) exits 0 on all four surfaces.
- **AC-5** Validator run R5 (sentiment triad) exits 0 in both modes; run R6 (light pos vs neg) reports CVD >= 8.
- **AC-6** `chartTheme.ts` DARK and LIGHT equal the table in 9.1.

**Contrast (axe-core plus the ledger)**
- **AC-7** axe `color-contrast` reports 0 violations on all 7 routes, both themes, at 1440 and 390, demo mode.
- **AC-8** Every pair in 13.1 re-measured from computed styles in the running app matches the ledger within 0.05.
- **AC-9** Active nav item: rail computed colour equals `--accent-ink`, and rail vs canvas >= 3:1 in both themes.
- **AC-10** Time strip pressed segment border vs track >= 3:1 in both themes (3.30 / 3.34).
- **AC-11** Every input, select, secondary button and idle chip has a computed border colour equal to `--edge`.

**Type and colour rules**
- **AC-12** In the 7 page files and `src/components/**`: zero matches for `text-\[(9|10|11)px\]`, `font-(bold|extrabold|black)` is allowed only because it resolves to 600 (computed weight check: no element in scope has `font-weight > 600`).
- **AC-13** In the 7 page files: zero `#[0-9a-fA-F]{6}` literals (colours come from tokens, ENGINE_META or chartTheme).
- **AC-14** Zero elements in scope whose text colour is a status or engine colour while the text is a number (spot check: Overview mention rate, Mentions ranks, Competitors counts, Sentiment values compute to `--ink`).
- **AC-15** Zero `COMPETITOR_SERIES_COLORS`; competitor lines use `field` with distinct `strokeDasharray`.
- **AC-16** No violet border on any non-selected, non-focused content card (computed border = `--line` or `--line-2`).

**Layout**
- **AC-17** At 390, 768, 1280 and 1440, on all 7 routes, both themes: `window.scrollTo(600, 0)` leaves `scrollX === 0` (real scroll, not `scrollWidth`; headless Chrome over CDP per memory `preview-pane-cannot-measure-layout`).
- **AC-18** At 1440 the main content column's left edge and width are identical on all 7 routes (one `Page`).
- **AC-19** No route renders more than nine top-level blocks (count children of `Page` excluding PageHeader).
- **AC-20** At 390 the Recommendations header badge and Refresh button bounding boxes do not intersect; Competitors x-axis labels do not intersect (horizontal layout).
- **AC-21** Bottom nav: 5 slots, labels untruncated (`scrollWidth <= clientWidth` per label), order matches the sidebar.

**Legacy remaps**
- **AC-22** Zero `!important` in `index.css` outside the fenced `LEGACY REMAPS` block.
- **AC-23** A grep of `src/components/**` and the 7 page files for every class selector inside the LEGACY block returns zero matches (script: extract selectors from the block, `rg -F` each across the in-scope files).
- **AC-24** With the LEGACY block removed in the browser (devtools or a test build), the 7 routes in light mode still pass AC-7. This proves light mode works on tokens.
- **AC-25** The LEGACY block contains no selector with zero call sites anywhere in `src/` (dead remaps pruned).

**States and motion**
- **AC-26** Each of the 7 routes, with an empty demo fixture (zero ok rows), renders no `0%`, no "Needs Work", and at least one focusable action (fixes the `/sentiment` dead end).
- **AC-27** RouteSkeleton to content swap: cumulative layout shift < 0.05 per route (Lighthouse CLS or a PerformanceObserver).
- **AC-28** With `prefers-reduced-motion: reduce` emulated, no element animates transform; skeletons are static.
- **AC-29** Every focusable element in scope shows a 2 px `--accent-ink` outline on keyboard focus (tab through each route).
- **AC-30** No em dash or en dash in any added line (`rg` with a positive control, per CLAUDE.md measurement trap).

---

## 15. Handoff packets

### 15.1 Lane 1, foundation (`bg-app`, Sonnet; files disjoint from Lane 2)

**Write scope:**
- `brandgeo-dashboard/tailwind.config.js`
- `brandgeo-dashboard/src/index.css`
- `brandgeo-dashboard/src/lib/chartTheme.ts`
- `brandgeo-dashboard/src/lib/planConfig.ts` (ENGINE_META `ai_overview.chartColor` only)
- `brandgeo-dashboard/src/lib/color.ts` (add `mix(hex, hex, t)` only if a builder needs a runtime tint; otherwise untouched)
- `brandgeo-dashboard/src/components/Layout.tsx`
- `brandgeo-dashboard/src/components/*.tsx` (every existing component: migrate off legacy classes to tokens; restyle per 7.5)
- NEW `brandgeo-dashboard/src/components/ui/{index.ts, Page.tsx, PageHeader.tsx, Card.tsx, SectionHeader.tsx, Notice.tsx, Stat.tsx, ReadoutRow.tsx, Meter.tsx, ScoreDial.tsx, StatusGlyph.tsx, Badge.tsx, Button.tsx, Chip.tsx, ChipGroup.tsx, SegmentedControl.tsx, tableClasses.ts}`

**Do:** sections 4, 5, 7, 8 (CSS side), 9.1, 10, 13.3. Keep old exports compiling (7.6). Move remaps into the fenced block; prune dead ones.
**Do not:** touch the 7 page files, `src/lib/metrics.ts`, `resultsContext.tsx`, `resultsLoader.ts`, `resultsGuards.ts`, `src/lib/views/*`, `PLAN_ORDER`, `ALL_ENGINES`, `motion.ts`, any route, any copy meaning.
**Done when:** AC-1 to AC-6, AC-9 to AC-11, AC-22, AC-25, AC-28, AC-29, AC-30 pass; `npm run build` exit 0; out-of-scope routes still render in both themes (smoke: Account, Prospects).

### 15.2 Lane 2, pages (`bg-app`, Sonnet)

**Write scope:** `brandgeo-dashboard/src/pages/{Dashboard, AIVisibility, BrandSentiment, Mentions, Competitors, Recommendations, Prompts}.tsx` only.
**Do:** section 11 in its priority order per page, sections 6, 9.2, 9.3, 12, using only Lane 1 primitives and token classes.
**Do not:** edit any file in Lane 1's scope, change any query, view, derived metric, route, sort logic or string meaning. New strings only where marked `[copy: ...]`, routed to `bg-copy`.
**Sequencing:** Lane 2 can be written in parallel against the frozen props in section 7, and is merged after Lane 1. Both land in **one** Netlify build (`$env:BATCH_PUSH=1`), per the deploy batching rule.
**Done when:** AC-7, AC-8, AC-12 to AC-21, AC-23, AC-24, AC-26, AC-27 pass.

### 15.3 Follow-up, Lane 3 (not in this build)

Migrate the 18 out-of-scope page files to tokens and delete the LEGACY REMAPS block; then AC-22 tightens to "zero `!important` in `index.css`". Owner `bg-app`, reviewer `bg-verify`.

---

## 16. Reproduction (validator runs)

Validator: `C:\Users\const\AppData\Local\Temp\claude\bundled-skills\2.1.317\c184ba83a3e1818a904a9620a9a367a5\dataviz\scripts\validate_palette.js` (bundled with the `dataviz` skill; any copy of the skill's script gives the same output).

- **R1** (shipped engines, fails today): `node validate_palette.js "#16a34a,#2563eb,#ea580c,#0891b2,#db2777,#0f766e,#a16207" --mode dark --surface "#0a0b0e"` gives `[FAIL] Chroma floor [["#0f766e",0.086]]`, `[WARN] CVD 6.9 (protan)`. Same on `#101116`, `#ffffff`, `#f7f7fc`.
- **R3** (proposed engines): the same list with `#1c7b5a` in slot 6, on `dark #0a0b0e`, `dark #101116`, `light #ffffff`, `light #f7f7fc`: band PASS, chroma PASS, CVD WARN 7.7 (legal with secondary encoding), normal 17.1 PASS, contrast PASS, exit 0.
- **R4** (shipped light sentiment): `"#3f6212,#9f1239" --mode light --surface "#ffffff"` gives `CVD fail 2.8 (deutan)`.
- **R5** (proposed triads): `"#84cc16,#666a75,#fb7185" --mode dark --surface "#101116"` CVD 11.7 protan PASS, normal 26.1; `"#58870f,#71717a,#9f1239" --mode light --surface "#ffffff"` CVD 10.8 deutan PASS, normal 16.2. (Band and chroma checks flag the grey midpoint by design: a diverging midpoint is grey; those two checks apply to categorical palettes only.)
- **R6**: `"#58870f,#9f1239" --mode light --surface "#ffffff"` CVD 11.7 PASS; `"#84cc16,#fb7185" --mode dark --surface "#101116"` CVD 10.3 PASS.
- **R7** (you vs field): `"#a78bfa,#878d99" --mode dark --surface "#101116"` CVD 13.8, normal 15.7; `"#7c3aed,#71717a" --mode light --surface "#ffffff"` CVD 20.5, normal 23.3.
- Contrast ratios: the script's exported `contrast(a, b)`; the measurement scripts used for 13.1 are in the session scratchpad and recompute from the hex values in this document.

---

## 17. HUMAN CHECKPOINT, findings outside design, risks

**HUMAN CHECKPOINT (required before Lane 1 starts).** This spec (a) introduces new tokens and changes four live colour values (`ai_overview` engine, light positive mark, both neutral marks), and (b) changes what a paying customer sees on load (surfaces move from navy slate `#0a0f1e` / `#0f172a` to the marketing neutrals `#0a0b0e` / `#101116`; the active nav state moves from a solid violet chip to a neutral chip with a violet rail; the bottom nav drops to five slots with "More"). Constantin decides: approve as written, or choose the `ALL_ENGINES` swap alternative in 4.5, or keep the seven-slot bottom nav. On approval, amendments I1 to I12 are copied into `docs/DESIGN-SYSTEM.md` by bg-design.

**Findings recorded, not design matters:**
- F1. Mojibake in demo prompts (Romanian diacritics in "Bucuresti" and "Romania" render as two-byte garbage) on every screenshot: `src/lib/mockData.ts` encoding (UTF-8 bytes read as Latin-1). Owner `bg-app`; do not rewrite that file with PowerShell (memory `never-rewrite-source-with-powershell`).
- F2. `/sentiment` demo shows Positive 10 but every signal chip reads (0) and the feed says "No signals match this filter" (`sentiment-desktop-dark.png`): a data or filter mismatch between the KPI source and the feed. Owner `bg-app`, verify with `bg-verify`.
- F3. `/prompts` demo reads "24 of 5 prompts used on Free": fixture plan does not match fixture prompt count. Owner `bg-app` (mockData).
- F4. CLAUDE.md Product quality backlog entry on the engine palette is stale (fixed 2026-07-27); CLAUDE.md 4.3 "dark-mode only, no light mode" is stale.

**Risks:**
- R1. The 7-engine adjacent CVD worst pair stays in the 6 to 8 warn band (7.7). Legal only while every engine mark keeps logo, label and legend; a future chart that drops the legend breaks it.
- R2. `--accent` vs deepseek is deltaE 6.3 in dark. Harmless while deepseek is not live and violet is never a series; when deepseek ships, re-run R3 with nine engines and fold charts to top five plus Other (2026-07-27 spec 8.7 still binds).
- R3. The LEGACY block survives this build; light mode on the 18 out-of-scope routes still depends on it until Lane 3.
- R4. Lane 2's AIVisibility.tsx is 2,800 lines in one function; restructuring to six blocks is presentation-only but large. If it cannot land without touching `views/aiVisibilityView.ts`, the builder stops and returns NEEDS_HUMAN rather than editing a Phase 2 file.
- R5. Five-slot bottom nav adds one tap to Competitors, Recommendations and Prompts on mobile.

## 18. Reference frames

| Block | Comparable | Attribute borrowed, as a constraint |
|---|---|---|
| Whole surface | BrandGEO Live Instrument homepage | the same neutrals, violet trio, six-size discipline, weight cap 600, readout row with hairline rules |
| Shell and nav | Linear | neutral sidebar on the canvas, one exact 1 px divider, active item as a raised neutral row with a thin accent rail |
| Overview hero | Stripe Dashboard home | one number, printed large in ink, with its basis and window stamped directly beneath it |
| KPI readouts and tables | Mercury | quiet tabular numerals, labels smaller than values, rules instead of boxes |
| Segmented control and chips | Raycast | pressed segment is a raised object with an edge, not a tint |
| Charts | Vercel Analytics | one accent series, recessive horizontal grid, no axis lines, tooltip as a small raised card |
| Empty states | Linear | one icon, one sentence, one action, inside the card it replaces, no illustration |
