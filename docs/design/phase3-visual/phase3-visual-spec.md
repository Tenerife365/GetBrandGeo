# Phase 3 visual spec: the binding version

**Agent:** bg-design (senior, judge and synthesizer)
**Date:** 2026-11-09
**Status:** BINDING for `bg-app` Lane 1 and Lane 2, behind ONE HUMAN CHECKPOINT (section 2). Nothing is built until Constantin approves `phase3-summary-for-constantin.md`.
**Supersedes:** `direction-a-instrument.md` and `direction-b-calm-premium.md` (both stay on disk as the record of the two directions). Where this file and either direction disagree, this file wins.
**Surface:** `brandgeo-dashboard/src/`, the Layout shell plus `/`, `/ai-visibility`, `/sentiment`, `/mentions`, `/competitors`, `/recommendations`, `/prompts`, dark and light, at 390 / 768 / 1280 / 1440.
**Evidence:** all 28 screenshots in `docs/design/phase3-visual/current/` (viewed); `src/index.css` (956 lines, 92 `!important`); `tailwind.config.js`; `src/lib/chartTheme.ts`; `src/lib/planConfig.ts` ENGINE_META and `ALL_ENGINES`; `src/lib/color.ts`; `src/components/*`; `brandgeo/web/index.html` `:root` and `[data-theme="light"]`; blueprint `docs/audit/system-uiux-blueprint-2026-11-08.md` 3, 6.2, 6.3.
**Method:** every contrast ratio is WCAG 2 relative luminance; every deltaE is OKLab Euclidean x100 with Machado 2009 CVD simulation at severity 1.0. All numbers in this file were re-measured by me with the `dataviz` skill's `validate_palette.js` (its `contrast`, `validate` and internal `deltaE`); the harness is in section 19. No number is copied from either direction without being re-run.

No `.tsx`, `.css`, `.html` or `tailwind.config.js` was edited to produce this file.

---

## 0. The verdict

### 0.1 Scores (1 to 5)

| Criterion | A, Instrument | B, Calm premium | Reason in one line |
|---|---|---|---|
| Fixes the measured defects (contrast, palette, first run) | **5** | **3** | A caught the two live palette failures (ai_overview `#0f766e` chroma 0.086 FAIL, light sentiment positive vs negative deutan 2.76 FAIL); B validated only 9 of 10 engines (omitted ai_overview) and kept the failing sentiment pair. |
| Comprehension in 3 seconds for a non-technical owner | 4 | **5** | B's one-sentence answer on top of every route speaks plain English; A's number plus basis stamp is precise but reads like an instrument panel. |
| Consistency with the marketing site | **5** | 4 | A uses the marketing neutrals verbatim (`#101116` card, neutral sidebar); B keeps a violet-tinted nav and a card one step off the marketing `--s`. |
| Implementation risk, two builders in disjoint files | **4** | 2 | A touches only the 7 pages plus shared files; B's family-to-token bridge silently recolours 18 unreviewed routes and its two-frame, header-slot time control couples Layout to pages. |
| Light mode quality | 3 | 4 | B reaches zero `!important` by construction; A leaves the 92 remaps alive in a fenced block, which fails the brief's "zero remaps left". |
| Mobile at 390 | 4 | **5** | Both fix the 7-item truncated bottom nav and the header overlap; B also ends the three-row chip wall and always shows row actions. |
| **Total** | **25** | **23** | |

### 0.2 Winner and grafts

**Winner: Direction A, Instrument.** It is right about the data that is on screen today, it matches getbrandgeo.com token for token, and its file plan is the safer one for two builders. It loses on two things, and both are grafted from B:

| # | Graft from B | Why |
|---|---|---|
| G1 | **HeroAnswer**: every route opens with one number in ink plus one plain sentence built only from values the page already computes, and one action | the 3-second test for a business owner is a sentence, not a stamp; AI Visibility's best sentence ("recommended in 9 of 20 prompts") sits at y=784 today |
| G2 | **Light mode by construction with zero remaps left**, done as an *exact-value* bridge (section 4.6), not B's family-to-token bridge | meets the brief's hard constraint; exact values mean the 18 out-of-scope routes compute the same colours they do today, so nothing unreviewed moves |
| G3 | **Progressive disclosure**: on AI Visibility "Where you do not appear yet", "Could not be checked", the symbol legend and "Competitors and categories" collapse with a summary line; Competitors "By engine and over time" collapses | the documented complaint is heaviness; 3034 px of AI Visibility at 1440 |
| G4 | **Sentiment hero merges five blocks into one** (score, three counts and the overall bar become one card with a split bar and a direct legend) | four equal tiles plus a bar said the same thing three times |
| G5 | **Recommendations order**: priority actions directly under the hero, AI analysis after, competitor chips in a collapsed disclosure; the red alarm box becomes the hero's status badge | actions start at y=612 today, below four alarm signals |
| G6 | **Row actions always visible** at low emphasis, reachable by Tab (Prompts edit and archive, Competitors delete) | blueprint U5, WCAG 2.1.1 |
| G7 | **Mobile category filter becomes a native select below 768** on `/mentions` | 9 chips wrap to three rows at 390 |
| G8 | **Sentence-case labels**; uppercase tracked eyebrows retired | quieter, same information |
| G9 | `src/lib/tokens.ts` plus `tests/tokens_sync.test.js` asserting `chartTheme.ts` equals `index.css` | the July drift note in `chartTheme.ts:46-62` recurs without a guard |
| G10 | Y axis width 48 with a `%` tick formatter and ticks 0 / 50 / 100 | fixes the clipped ")%" ticks on `/sentiment` and `/competitors` |

### 0.3 Corrections to both directions (measured here, section 14)

1. **B is wrong that the engine ramp passes.** B ran 9 slots and left out `ai_overview`. With it, the 7 live engines fail the chroma floor on every surface (`#0f766e` C 0.086). A's `#1c7b5a` passes (C 0.101).
2. **B is wrong that the sentiment tokens can stay.** Light positive `#3f6212` vs negative `#9f1239` is deltaE **2.76 deutan**, a FAIL whenever neutral is 0% and the segments touch, which is the demo state on `/sentiment`.
3. **A overstates the dark neutral defect.** Shipped `#94a3b8` vs `#fb7185` is **8.88 protan** (passes the 8 target); the 3.0 A printed is `#878d99` vs `#fb7185`. A's change to `#666a75` is still adopted: it lifts protan to 11.71 and puts the neutral on the surfaces' hue family.
4. **Both missed that the engine set fails under all-pairs.** Worst normal `#1c7b5a` vs `#16a34a` 13.17 (hard FAIL below 15) and worst CVD `#a16207` vs `#ea580c` 4.0 protan. Consequence, rule C8: engine colours are only drawn in adjacent-order layouts, never as crossing lines or scatter.
5. **CLAUDE.md "Product quality" backlog is stale** on shell contrast and on the four engine palette items; all were fixed by the 2026-07-27 build (B 0.2 is correct on that). Only the Competitors palette and first run remain open, and this spec closes both.

---

## 1. The one thing, and the 10-second test

**The one thing.** On every route the eye lands first on one number printed in ink, with one plain sentence beside it that says what the number means; violet appears only where the user is (nav rail, selected control, focus), on the one primary action, and on the user's own brand in charts, and everything else yields to that.

**The 10-second test (falsifiable).** After 10 seconds on any of the 7 routes, at 1440x900 and at 390x844, in either theme, a first-time business owner can say without scrolling or hovering: (a) which page they are on, (b) the headline number and the sentence that explains it, (c) the one thing the page asks them to do next. The reviewer covers the screen at 10 s and asks the three; two wrong on any route is FAIL. Structural pass condition: the h1, the HeroAnswer number and its sentence are inside the first viewport at both sizes, and nothing above them is larger than the number.

**Current result: FAIL 7 of 7.**

| Route | Screenshot | Why it fails |
|---|---|---|
| `/` | `overview-desktop-dark.png` | Score 72 has a glow and no sentence; mention rate 48% is painted amber (`Dashboard.tsx` KPI tone) at the same weight, so the eye splits; score is all-time while KPIs are 7-day and nothing says so. |
| `/ai-visibility` | `ai-visibility-desktop-dark.png` | The answer sentence sits at y=784 of 3034; 10 top-level blocks; amber P1 titles, amber rule, red competitor chips and green cells compete. At 390 the page is 6000 px. |
| `/sentiment` | `sentiment-desktop-dark.png` | Four equal tiles plus a full-width lime bar repeat one fact; violet border makes the score tile look selected; y ticks clipped to ")%". |
| `/mentions` | `mentions-desktop-dark.png`, `-mobile-dark.png` | Three equal tiles in three icon colours; every rank is lime; category badges in blue and violet encode nothing; 9 chips wrap to 3 rows at 390. |
| `/competitors` | `competitors-desktop-dark.png`, `-mobile-dark.png` | "Top competitor" and every competitor count are red; x labels collide at 390 ("Your brandLantern T..Cedar"); y ticks clipped. |
| `/recommendations` | `recommendations-mobile-dark.png` | "2 actions" badge overlaps Refresh at 390; red banner, red chips and amber pills before the first action at y=612. |
| `/prompts` | `prompts-desktop-dark.png` | 24 separate bordered cards; the amber limit banner is the loudest object; row actions hidden until hover on desktop. |
| shell | `*-mobile-*.png` | Bottom nav truncates ("Overv...", "Comp...", "Reco...", "Prom..."), two items read "AI", order differs from the sidebar (blueprint U3). |

---

## 2. HUMAN CHECKPOINT (the build waits here)

The spec changes tokens, changes three live colour values, and changes what a paying customer sees on load. Constantin rules on the summary file; defaults apply if he says "go".

| # | Decision | Default |
|---|---|---|
| CP1 | Canvas and cards move from navy slate (`#0a0f1e` / `#0f172a`) to the marketing neutrals (`#0a0b0e` / `#101116`); light canvas `#f7f7fb` to `#f7f7fc`. The sidebar loses its violet tint and becomes the canvas with a 1 px divider; the active nav item becomes a neutral row with a violet rail. Applies to every route through the legacy aliases. | yes |
| CP2 | New semantic tokens (amendments P1 to P14, section 17) with light pairs. | yes |
| CP3 | Three live colour values change: engine `ai_overview` `#0f766e` to `#1c7b5a`; light sentiment positive mark `#3f6212` to `#58870f` (text stays `#3f6212`); sentiment neutral `#94a3b8` / `#64748b` to `#666a75` / `#71717a`. | yes |
| CP4 | Mobile bottom nav: 7 truncated items become 5 slots: Overview, Visibility, Sentiment, Mentions, More (opens the drawer). Alternative: replace Mentions with Recommendations, labelled `[label: Actions]` by bg-copy. | sidebar order |
| CP5 | Every page opens with a one-sentence answer built from numbers it already shows. Sentences ship as `[answer: ...]` templates until bg-copy rules on wording. | yes |
| CP6 | Weight cap 600 app-wide (`font-bold` and heavier render at 600), including out-of-scope pages. | yes |

**RULED 2026-11-09, Constantin: "Go, all defaults."** CP1 to CP6 take the default column; CP4 is sidebar order (Overview, Visibility, Sentiment, Mentions, More). Orchestrator note on CP5: the answer, context, summary and empty sentences render as plain sentences with no brackets or `[answer:` markers on screen; each carries a code comment `// copy: pending bg-copy` so the copy seat can find them.

No new npm dependency. No new web font (Inter is already loaded and is the marketing body face). No motion library change.

---

## 3. The shared spine with getbrandgeo.com

Density and register may differ; brand tokens may not. Identical between the two surfaces: canvas, card, inset, hairlines, primary ink, the violet trio, Inter, weight cap 600, the 12 px card radius, the 2 px focus outline at offset 2.

| Marketing token | Dashboard token | Dark | Light |
|---|---|---|---|
| `--bg` | `--canvas` | `#0a0b0e` | `#f7f7fc` |
| `--s` | `--surface` | `#101116` | `#ffffff` |
| `--s2` | `--surface-2` | `#16171e` | `#f4f4fb` |
| `--bd` | `--line` | `#23242b` | `#e2e2ea` |
| `--bd2` | `--line-2` | `#32333c` | `#cfcfda` |
| `--t` | `--ink` | `#e8e9ed` | `#09090f` |
| `--t2` | `--ink-2` | `#9ba1ac` | `#55555e` |
| `--ac` | `--accent` | `#8b5cf6` | `#7c3aed` |
| `--ac-strong` | `--accent-strong` | `#7c3aed` | `#6d28d9` |
| `--ac-text` | `--accent-ink` | `#a78bfa` | `#6d28d9` |
| `--r` | `--radius-card` | 12px | 12px |

Deliberate divergences, each with its reason: `--ink-3` is one step lighter than marketing `--t3` because the dashboard puts meta text on `--surface-3` (marketing `--t3` measures 4.35 there, under 4.5); status uses lime / rose / amber instead of marketing `--ok #047857` and `--warn #b45309`, because those sit deltaE 1.35 from `ai_overview` and 4.73 from `grok` and the dashboard plots engines; no Instrument Serif and no JetBrains Mono (about 60 KB on every app load for a display role the dashboard does not have).

---

## 4. Tokens (Lane 1)

### 4.1 Mechanism: light mode by construction

1. Every semantic token is an RGB triplet in `src/index.css` under `:root` (dark, default) and again under `html.light` (the switch in `src/lib/themeContext.tsx`, unchanged).
2. `tailwind.config.js` exposes each token as `rgb(var(--token) / <alpha-value>)`. A builder writes `bg-surface text-ink border-line` and it is themed in both modes. No `dark:` variant, no `html.light .utility` rule, no `!important`.
3. A **legacy bridge** (4.6) makes every legacy utility that today has a light remap read a per-theme variable carrying the exact colour it computes today, so the remap block can be deleted with zero visual change on the routes nobody is redesigning.
4. Recharts cannot read `var()`, so `chartTheme.ts` holds hex copies, guarded by `tests/tokens_sync.test.js` (AC-6).

### 4.2 Surface, line and ink

| Token | Role | Dark | Dark OKLCH | Light | Light OKLCH |
|---|---|---|---|---|---|
| `--canvas` | page, sidebar, top bar, time strip | `#0a0b0e` | 0.150 0.007 271 | `#f7f7fc` | 0.978 0.007 286 |
| `--surface` | cards, bottom nav, pressed segment, tooltip (light) | `#101116` | 0.179 0.010 276 | `#ffffff` | 1.000 0 |
| `--surface-2` | inset: table head, input fill, control track, row hover, tooltip (dark), quote block | `#16171e` | 0.207 0.014 279 | `#f4f4fb` | 0.969 0.009 286 |
| `--surface-3` | neutral selected: active nav row, neutral badge, skeleton, meter track, dial track | `#1d1e27` | 0.238 0.017 280 | `#ececf4` | 0.945 0.011 286 |
| `--line` | decorative hairline: card border, row divider, gridline (never a sole control boundary) | `#23242b` | 0.262 0.013 279 | `#e2e2ea` | 0.915 0.011 286 |
| `--line-2` | stronger hairline: hover border, tooltip border, disclosure divider | `#32333c` | 0.324 0.016 280 | `#cfcfda` | 0.858 0.015 286 |
| `--edge` | interactive boundary, always >= 3:1: input, select, secondary button, idle chip, pressed segment, sidebar divider | `#666a75` | 0.525 0.018 270 | `#85858f` | 0.620 0.015 286 |
| `--ink` | primary text and every number | `#e8e9ed` | 0.934 0.005 275 | `#09090f` | 0.143 0.013 285 |
| `--ink-2` | secondary text, idle nav label, answer context | `#9ba1ac` | 0.708 0.017 263 | `#55555e` | 0.453 0.015 286 |
| `--ink-3` | meta, axis ticks, idle icons, timestamps | `#878d99` | 0.642 0.019 264 | `#62626c` | 0.500 0.016 286 |

### 4.3 Accent (hue 293 to 295 in every step, no teal)

| Token | Role | Dark | Dark OKLCH | Light | Light OKLCH |
|---|---|---|---|---|---|
| `--accent` | fill only: dial arc, meter fill, "you" bar and line | `#8b5cf6` | 0.606 0.219 293 | `#7c3aed` | 0.541 0.247 293 |
| `--accent-strong` | primary button fill | `#7c3aed` | 0.541 0.247 293 | `#6d28d9` | 0.491 0.241 293 |
| `--accent-strong-hover` | primary hover (darken, never lighten) | `#6d28d9` | 0.491 0.241 293 | `#5b21b6` | 0.432 0.211 293 |
| `--accent-ink` | accent text, nav rail, focus ring, selected chip border, tertiary link | `#a78bfa` | 0.709 0.159 294 | `#6d28d9` | 0.491 0.241 293 |
| `--accent-tint` | selected chip fill, "you" table row | `#241d3a` | 0.254 0.054 293 | `#ede9fe` | 0.943 0.028 295 |
| `--on-accent` | text and icons on `--accent-strong` and its hover | `#ffffff` | 1.000 0 | `#ffffff` | 1.000 0 |

### 4.4 Polarity and status (sentiment and status are one family)

Each tone has a **mark** (fills, glyphs, chart segments; floor 3:1), an **ink** (text; floor 4.5:1) and a **tint** (badge and cell fill).

| Token | Dark | Dark OKLCH | Light | Light OKLCH | Note |
|---|---|---|---|---|---|
| `--pos` (mark) | `#84cc16` | 0.768 0.204 131 | `#58870f` | 0.568 0.148 130 | light value changes (CP3) |
| `--pos-ink` | `#84cc16` | 0.768 0.204 131 | `#3f6212` | 0.453 0.113 131 | text only |
| `--pos-tint` | `#202b16` | 0.272 0.040 131 | `#ecfccb` | 0.967 0.066 122 | |
| `--neu` (mark) | `#666a75` | 0.525 0.018 270 | `#71717a` | 0.552 0.014 286 | both change (CP3); never text |
| `--neg` (mark and ink) | `#fb7185` | 0.719 0.169 13 | `#9f1239` | 0.455 0.171 14 | unchanged |
| `--neg-tint` | `#311e26` | 0.262 0.032 353 | `#ffe4e6` | 0.941 0.030 13 | |
| `--warn` (mark and ink) | `#fbbf24` | 0.837 0.164 84 | `#713f12` | 0.421 0.090 58 | light new |
| `--warn-tint` | `#2c2618` | 0.271 0.026 87 | `#fef3c7` | 0.962 0.058 96 | |

The existing `--sentiment-positive`, `--sentiment-neutral`, `--sentiment-negative` variables are re-pointed: positive to `--pos`, neutral to `--neu`, negative to `--neg`. `TrendDelta.tsx` (the one text call site of `.text-sentiment-positive`) moves to `text-pos-ink`.

### 4.5 Engine colours (ENGINE_META, one value changes)

| Engine | Hex | OKLCH | Live | Status |
|---|---|---|---|---|
| chatgpt | `#16a34a` | 0.627 0.170 149 | yes | unchanged |
| gemini | `#2563eb` | 0.546 0.215 263 | yes | unchanged |
| claude | `#ea580c` | 0.646 0.194 41 | yes | unchanged |
| perplexity | `#0891b2` | 0.609 0.111 222 | yes | unchanged |
| google_ai | `#db2777` | 0.592 0.218 1 | yes | unchanged |
| **ai_overview** | **`#1c7b5a`** (was `#0f766e`) | 0.521 0.101 165 | yes | **changed** |
| meta | `#c026d3` | 0.591 0.257 323 | retired | unchanged |
| deepseek | `#6366f1` | 0.585 0.204 277 | coming soon | unchanged |
| grok | `#a16207` | 0.554 0.121 66 | yes | unchanged |
| copilot | `#0284c7` | 0.588 0.139 242 | coming soon | unchanged |

`ALL_ENGINES` order and `PLAN_ORDER` do not change. Lane 1 also replaces the ai_overview code comment (`planConfig.ts:278-285`, which cites a dE2000 check) with the validator result from section 14.

### 4.6 The legacy bridge, and how the 92 remaps die

Proven on the installed Tailwind 3.4.19: a colour key that contains a slash is matched exactly before the opacity modifier is parsed (`pluginUtils.js` `asColor`, line 141). The test in section 19 compiled `bg-emerald-500/20` to `var(--br-bg-emerald-500-20)` and `text-emerald-400/70` to `rgb(var(--br-text-emerald-400) / 0.7)`.

**Rule.** For every utility that `index.css` remaps today, Lane 1 adds one bridge entry in `tailwind.config.js` `theme.extend` (under `textColor`, `backgroundColor`, `borderColor` or `placeholderColor`, never under `colors`), pointing to a variable named `--br-<prop>-<family>-<step>[-<alpha>]`, declared in both themes in `index.css`:

- **dark value** = what the class computes today in dark (Tailwind default, or the dark remap where one exists: `text-slate-500` and `text-slate-600` read `148 163 184`);
- **light value** = the remap's colour today.

Text entries without alpha use `rgb(var(--x) / <alpha-value>)`; entries keyed with an alpha (`'400/70'`, `'500/20'`) hold the full colour (`rgb(16 185 129 / 0.2)` in dark, `#d1fae5` in light) and are referenced as `var(--x)`.

Text bridge, light values (dark values are the Tailwind defaults unless noted):

| Class | Light value |
|---|---|
| `text-white` | `15 23 42` |
| `text-slate-100` / `-200` / `-300` / `-400` | `15 23 42` / `30 41 59` / `51 65 85` / `71 85 105` |
| `text-slate-500` / `-600` (dark `148 163 184` both) | `85 100 121` / `71 85 105` |
| `text-slate-400/80` | `rgb(71 85 105)` |
| `text-brand-100` / `-200` | `15 23 42` |
| `text-brand-300` / `-400`, `text-violet-300` / `-400`, `text-purple-300` | `109 40 217` |
| `text-emerald-300` / `-400`; `-400/80`, `-500/70` | `4 120 87`; `#047857` |
| `text-red-300` / `-400`; `-400/70`, `-500/60`; `-300/70` | `185 28 28`; `#dc2626`; `#b91c1c` |
| `text-rose-300` / `-400` | `159 18 57` / `190 18 60` |
| `text-amber-100`; `-300` / `-400`; `-400/80`, `-500/70` | `146 64 14`; `180 83 9`; `#b45309` |
| `text-orange-200` / `-300` | `194 65 12` |
| `text-blue-300` / `-400` | `29 78 216` |
| `text-sky-300` / `-400` | `3 105 161` |
| `text-cyan-300` / `-400` | `14 116 144` |
| `text-teal-300`, `text-indigo-300`, `text-pink-300` | `15 118 110`, `67 56 202`, `190 24 93` |

Hover variants (`hover:text-rose-300`, `hover:text-slate-300`, `hover:text-red-400`, `hover:text-brand-300`) are covered by the same entries because Tailwind generates them from `textColor`. Known loss: `hover:text-brand-300` light was `76 29 149`; it now equals resting `109 40 217`. Accepted (one call site class, still 7.10:1).

Background and border bridge, light values (dark = today's Tailwind composite):

| Class | Light value |
|---|---|
| `bg-brand-500/8`, `/10`, `/15`; `bg-brand-500/20` | `#ede9fe`; `#ddd6fe` |
| `bg-emerald-500/5` and every other emerald, red, amber tint listed at `index.css:296-317` | the exact `#hex` on that line |
| `bg-blue-500/20`, `purple`, `sky`, `pink`, `teal`, `indigo`, `violet`, `cyan`, `orange`, `slate` `-500/20` | `#dbeafe`, `#f3e8ff`, `#e0f2fe`, `#fce7f3`, `#ccfbf1`, `#e0e7ff`, `#ede9fe`, `#cffafe`, `#ffedd5`, `#e2e8f0` |
| `bg-slate-700/50`, `/60`; `bg-slate-800` | `rgb(226 232 240)`; `rgb(241 245 249)` |
| `border-slate-600/50`, `/40`, `/30`, `border-slate-700/30` | `rgb(203 213 225)` |
| `placeholder-slate-*` (every step in use) | `rgb(var(--ink-3))` both themes |

**What the bridge cannot do, and the sweep that closes it.** Three remaps are compound selectors: `.bg-brand-500.text-white` (fill forced to `#7c3aed`, both themes), `.text-white.hover:bg-brand-400:hover` (forced `#6d28d9`), and `html.light .bg-brand-500.text-white, .bg-brand-600.text-white` (text forced white). Once the bridge makes `text-white` dark in light mode, every `text-white` on a solid fill must become `text-on-accent`, and every `bg-brand-500` button must become `bg-accent-strong`. Measured consequence if one is missed: ink on `--accent-strong` is 2.76:1 in light (FAIL). The sweep (Lane 1 in components, Lane 2 in pages, section 16) applies exactly these replacements on the same element:

1. `bg-brand-500 ... text-white` or `bg-brand-600 ... text-white` becomes `bg-accent-strong ... text-on-accent`; `hover:bg-brand-400` or `hover:bg-brand-500` on that element becomes `hover:bg-accent-strong-hover`.
2. `text-white` on any other solid fill (`bg-<family>-<500..900>` without `/NN`) becomes `text-on-accent`.
3. Conditional or composed class strings count (`AIVisibility.tsx:2489`, `Prospects.tsx:1255`, `:1261`); the builder checks each ternary by hand.

**Delete list (Lane 1 commit B, after the sweep is in).** Every rule in `index.css` whose selector starts `html.light .` and targets a utility class; the dark remaps at `:152` and `:163`; `:233-234`; `:241`; `:248-249`; the light placeholder rule at `:262-266`; `.score-ring-number` and `.score-ring-label` (zero call sites outside `index.css`, measured); the `!important` on the light card shadow (`:614-617`), rewritten as `box-shadow: var(--shadow-card)` with no theme fork. Kept: `.skip-link:focus { position: fixed !important }` (layout, not colour, exempt by name). `html.light input, textarea, select` becomes an `@layer base` rule reading `--surface-2`, `--ink`, `--edge` with no theme selector. `html.light aside` is deleted (the sidebar reads `bg-canvas`).

**Legacy variable aliases** (so every out-of-scope `bg-dark-*` card adopts the new surfaces): `--dark-900` = canvas, `--dark-800` = surface, `--dark-700` = surface-3, `--dark-600` = line-2, `--text-base` = ink, `--text-secondary` = ink-2, `--surface-nav` = canvas, `--border-nav` = edge, `--surface-nav-active` = surface-3, `--text-nav-active` = ink, `--text-nav-idle` = ink-2, `--rail-active` = accent-ink, `--surface-bar` = canvas, `--grid-line` = line, `--axis-ink` = ink-3. Declared as the same triplets, not as nested `var()`, so `tests/tokens_sync.test.js` can parse them.

### 4.7 Elevation, radius, focus

| Token | Dark | Light | Used by |
|---|---|---|---|
| `--shadow-card` | `none` | `0 1px 2px rgb(9 9 15 / 0.04), 0 4px 12px rgb(9 9 15 / 0.05)` | Card |
| `--shadow-raised` | `0 8px 24px -8px rgb(0 0 0 / 0.6)` | `0 8px 24px -8px rgb(9 9 15 / 0.14)` | tooltip, menu, popover, pressed segment, drawer |
| `--radius-card` | 12px | 12px | Card, Notice, tooltip, hero |
| `--radius-control` | 8px | 8px | Button, input, segmented track, nav row, chip |
| `--radius-badge` | 6px | 6px | Badge, result cell |
| focus | `outline: 2px solid rgb(var(--accent-ink)); outline-offset: 2px` | same | every focusable element, `:focus-visible` in `@layer base` |

Cards separate by a 1 px `--line` border plus `--shadow-card`; dark has no card shadow (invisible on `#0a0b0e`). Card vs canvas is 1.04 dark and 1.07 light by luminance: decorative, and never the boundary of a control.

### 4.8 Tailwind mapping (Lane 1, `tailwind.config.js`)

```
theme.extend.colors:
  canvas, surface: { DEFAULT, 2, 3 }, line: { DEFAULT, 2 }, edge,
  ink: { DEFAULT, 2, 3 },
  accent: { DEFAULT, strong, 'strong-hover', ink, tint }, 'on-accent',
  pos: { DEFAULT, ink, tint }, neu, neg: { DEFAULT, tint }, warn: { DEFAULT, tint }
  (each 'rgb(var(--<token>) / <alpha-value>)')
theme.extend.textColor / backgroundColor / borderColor / placeholderColor: the bridge of 4.6
theme.extend.boxShadow: { card: 'var(--shadow-card)', raised: 'var(--shadow-raised)' }
theme.extend.borderRadius: { card: '12px', control: '8px', badge: '6px' }
theme.extend.fontWeight: { bold: '600', extrabold: '600', black: '600' }
theme.extend.fontSize: the six roles of 5.1, each [size, { lineHeight, letterSpacing, fontWeight }]
```

`brand` and `dark` stay for legacy files. `darkMode: 'class'` stays.

---

## 5. Type, space, layout

### 5.1 Six sizes, weight cap 600

Inter, `font-feature-settings: 'cv01','ss03','zero'` kept; every number gets `tabular-nums`.

| Role (`text-*`) | Size / line at >= 768 | At < 768 | Weight | Tracking | Ink | Use |
|---|---|---|---|---|---|---|
| `display` | 48 / 52 | 40 / 44 | 600 | -0.02em | ink | the one hero number per route |
| `title` | 24 / 32 | 22 / 30 | 600 | -0.01em | ink | h1 |
| `value` | 20 / 28 | 20 / 28 | 600 | -0.01em | ink | KPI value, rank in a row |
| `answer` | 20 / 28 | 18 / 26 | 500 | -0.01em | ink | the hero sentence (shares the 20 size with `value`) |
| `heading` | 15 / 22 | 15 / 22 | 600 | 0 | ink | h2, card title, row title |
| `body` | 14 / 20 | 14 / 20 | 400 (500 controls) | 0 | ink or ink-2 | text, table cells, buttons, nav |
| `meta` | 12 / 16 | 12 / 16 | 500 | 0.01em | ink-3 or ink-2 | labels, badges, chips, ticks, stamps, bottom nav labels |

Sentence case everywhere ("Mention rate", not "MENTION RATE"); no uppercase tracked eyebrows. No text below 12 px in scope (today `text-[9px]`, `text-[10px]` in `AIVisibility.tsx` and `Dashboard.tsx:666`). Long-form prose (recommendation "Why this matters", AI analysis) is `body` at 15 / 24 with `max-w-[72ch]`; that is the `heading` size at regular weight, so the size count stays six.

### 5.2 Spacing

4 px base; allowed steps 4, 8, 12, 16, 20, 24, 32, 48. Card padding: compact 16, standard 20, feature 24 (390: 20). Gap between top-level blocks 24 (390: 16). Gap inside a card 16. Stats inside one card are separated by 1 px `--line` rules, 0 gap.

### 5.3 Breakpoints and grid

| Viewport | Shell | Grid | Page padding | Notes |
|---|---|---|---|---|
| < 768 (390) | top bar 56, bottom nav 64 plus safe area, sidebar is a drawer | 1 column | 16 | no horizontal page scroll, ever |
| 768 to 1279 | sidebar 240 fixed | 6 columns | 24 | content column 528 at 768 |
| >= 1280 | sidebar 240 | 12 columns | 32 | |

### 5.4 One page frame

`<Page>`: `mx-auto w-full max-w-[1200px] px-4 md:px-6 xl:px-8 pt-6 md:pt-8 pb-24 md:pb-12`. Inner column 1136 at 1440 on all 7 routes (today: 1072, 1088, 960, 832). Prose capped at 72ch inside it.

**Reading order, DOM equals visual:** PageHeader (h1, optional badge, actions), at most one Notice, HeroAnswer, the block that explains the number, the next block, disclosures. **Ceiling: nine top-level blocks per route** (children of `Page`, PageHeader excluded); per-route counts in section 11.

---

## 6. Colour rules (both lanes, binding)

- **C1 Numbers wear ink.** Scores, counts, percentages, ranks. Threshold or polarity is a StatusGlyph plus Badge beside the number, never a recoloured number (ends the amber 48%, lime ranks, red counts, violet 10).
- **C2 Competitors are neutral.** Names, counts and chips are ink / ink-2 on neutral badges. Never red.
- **C3 Categories are neutral.** Mid, Large, Very Large, General, Tool Discovery, GEO / AIO, Problem-based, Direct Brand: Badge `neutral`; the word identifies it.
- **C4 Engine swatches sit on `--surface` or `--canvas` only.** ChatGPT `#16a34a` is 2.80:1 on light `--surface-3` and 2.78:1 on light `--accent-tint`. A selected engine chip keeps the surface fill and shows selection by border and check glyph.
- **C5 You vs the field.** The user's brand is the only violet series (`--accent`). Competitors share `--neu` and are told apart by dash pattern and direct label. `COMPETITOR_SERIES_COLORS` (`Competitors.tsx:132`, cycled, validator FAIL 2.9 deutan) is deleted.
- **C6 Threshold meters** use status marks with the value printed in ink beside them (logic unchanged; colour source changes).
- **C7 One alarm per screen.** At most one Notice per route; elsewhere warn and neg appear only as glyph or badge, never as a coloured title, left rule or card border.
- **C8 Engine colours only in adjacent-order layouts** (grouped and stacked bars in `ALL_ENGINES` order, tiles, chips, legends). Never as crossing lines or scatter: the 7 live engines fail all-pairs (normal 13.17, CVD 4.0). A multi-engine trend becomes small multiples.
- **C9 Violet appears in five places only:** nav rail, selected control, focus ring, primary button, the user's own series (dial arc, meter fill, "you" bar and line). No violet card borders, icons, glows or gradients.

---

## 7. Components (Lane 1 builds, Lane 2 consumes)

New primitives live in `src/components/ui/`, exported from `src/components/ui/index.ts`. Props below are the frozen contract.

### 7.1 Frame and headers

| Component | Props | Anatomy |
|---|---|---|
| `Page` | `children` | section 5.4 |
| `PageHeader` | `title`, `badge?`, `subtitle?`, `actions?` | h1 `title` with `badge` inline on the same baseline (wraps as a unit, never overlaps); subtitle `body` ink-2, 72ch, omitted when the HeroAnswer says the same thing; actions right at >= 640, below 640 a full-width row under the title (one action full width, two as a 2-column grid). At most one primary. |
| `SectionHeader` | `title`, `count?`, `description?`, `actions?`, `level?: 2 \| 3` | h2 `heading` ink, `count` as Badge neutral, description `meta` ink-2, actions right; 16 below. Replaces `SectionHeading` and every uppercase card title. |
| `Notice` | `tone: 'warn' \| 'neg' \| 'accent'`, `title`, `children?`, `action?` | Card standard, 3 px left rule in the tone mark, StatusGlyph 16, title `heading` ink, body `body` ink-2, one action (secondary or tertiary). |

### 7.2 HeroAnswer (graft G1)

```
>= 768, Card pad=feature:
+---------------------------------------------------------------+
| [visual 160]  | VALUE unit  [Badge with glyph]                |
|               | Answer sentence, answer role, max 56ch        |
|               | context line, meta ink-3                      |
|               | [primary or secondary action] [tertiary link] |
|---------------------------------------------------------------|
| children: dimension rows, split bar, engine line (optional)   |
+---------------------------------------------------------------+
< 768: visual centred at 136, then value + badge, sentence, context, action full width, children.
```

Props: `value?`, `unit?`, `badge?: { label, tone }`, `answer`, `context?`, `visual?`, `action?`, `secondaryAction?`, `children?`, `loading?`, `empty?: EmptyStateProps`.

- `value`: `display` ink tabular. Unit: 20/28 500 ink-2 on the baseline (`%`, `/100`, `actions`). When `visual` is a ScoreDial the number is inside the dial and not printed twice; the right column starts with the badge and the sentence.
- `answer`: `answer` role, ink, wraps, never truncates. Built only from values the page already computes, shipped as the `[answer: ...]` template text with slots filled until bg-copy rules. No template adds a claim the page does not already make.
- `context`: `meta` ink-3: window and freshness, from existing values.
- `empty`: renders EmptyState inside the same box at the same min height (240 at >= 768, 280 at 390); no number, no badge.
- `loading`: SkeletonHero, same box.
- Heading order: the hero has no heading; the number is a `<p>` with `aria-label` joining number and unit ("72 out of 100").

### 7.3 Data

| Component | Props | Anatomy |
|---|---|---|
| `ScoreDial` | `score: number \| null`, `size?: 'lg' \| 'md'` | SVG 160 (md 136), stroke 8, round caps, track `--surface-3`, arc `--accent` (3.91 dark, 4.85 light against the track). No gradient, glow or shadow. Centre: number `display` ink tabular, `%` in `meta` ink-3 on the baseline (not a superscript). `null`: track only, centre "Not measured yet" `body` ink-2. Replaces the raw hex at `Dashboard.tsx:316-317,340,349` and `AIVisibility.tsx:1139,1148,1840-1841`; `ScoreBadge.tsx` `GeoScoreRing` re-exports it. |
| `Stat` | `label`, `icon?`, `value`, `unit?`, `sub?`, `tone?: 'neutral' \| 'warn' \| 'alert'`, `delta?`, `spark?`, `pending?`, `emptyLabel?` | label row: icon 14 ink-3 + `meta` ink-2. Value `value` ink tabular; unit `meta` ink-3. `tone` adds a StatusGlyph after the value and never recolours it. `sub` `meta` ink-3. `spark`: 24 high, 1.5 px `--ink-3` stroke, no fill, last point 4 px dot ink. `pending`: SkeletonStat. Empty: `emptyLabel` `body` ink-3, height kept. No card of its own. |
| `ReadoutRow` | `children: Stat[]` | one Card `pad='none'`, stats in a grid with 1 px `--line` rules (4-up at >= 1024, 2 x 2 below), each cell padded 20. |
| `Meter` | `value: number \| null`, `tone?: 'accent' \| 'pos' \| 'warn' \| 'neg'`, `label?`, `valueLabel?` | track 4 high (6 on AI Visibility dimensions), radius 2, `--surface-3`; fill in the tone mark. `null`: track only and "n/a" ink-3. |
| `SplitBar` | `segments: { key: 'pos' \| 'neu' \| 'neg', count, pct }[]` | one 100% bar, 12 high, radius 4 on the outer ends, 2 px `--surface` gaps between segments, fixed order pos, neu, neg; direct legend under it: glyph + word + count + pct, `meta` ink-2, counts tabular. A 0% segment renders nothing but stays in the legend. |
| `BarList` | `rows: { label, value, isYou?, swatch? }[]`, `format` | horizontal bar per row: label `body` ink left (wraps, 112 px column at < 640, 200 at >= 640), bar 8 high (`--accent` for `isYou`, else `--neu`), value `body` 600 ink tabular right. No axes. |
| `StatusGlyph` | `kind: 'pos' \| 'neu' \| 'neg' \| 'warn' \| 'info'`, `size?` | lucide-react: pos `TriangleUp` filled, neu `Circle` filled, neg `TriangleDown` filled, warn `TriangleAlert`, info `Info`; fill the kind's mark; `aria-hidden` (the adjacent word carries meaning). |
| `tableClasses` (export) | | Card `pad='none'`. Head row 36, `--surface-2`, `meta` ink-2 sentence case, bottom `--line`. Body rows min 48, dividers `--line`, numbers right-aligned tabular, rank column 32 `meta` ink-3, row hover `--surface-2`. Real `<table>` with `<th scope="col">`; below 768 the same data as DataList rows. |
| `DataList` | `rows`, `renderRow` | rows on one Card, `divide-y divide-line`, padding 12 / 16, min height 56, hover `--surface-2`. Slots: leading, title (`body` ink, 2-line clamp, full text on expand), meta line, trailing. Row actions always present at ink-3, ink on row hover or focus-within (graft G6). |

### 7.4 Controls

| Component | Props | Anatomy and states |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'tertiary' \| 'danger'`, `size?: 'md' \| 'sm'`, `icon?`, `loading?` | md 36 high, padding-x 14, `body` 500, radius 8, icon 16 gap 8; sm 28, `meta` 500. Below 768 min 44 via padding. **primary**: `bg-accent-strong text-on-accent`, hover `bg-accent-strong-hover`; never placed on `--surface-3` (2.91 dark). **secondary**: `bg-surface-2`, 1 px `--edge`, ink, hover `bg-surface-3`. **ghost**: no fill, ink-2, hover `bg-surface-2` ink. **tertiary**: no fill, `accent-ink` text, underline on hover. **danger**: secondary skin with `neg` text and glyph (no new fill token). Disabled 50% opacity, label kept. Loading: 16 px spinner replaces the icon, width fixed. |
| `IconButton` | `label`, `icon`, `variant?` | 32 visible, 44 hit below 768 (`after:absolute after:-inset-1.5`), `aria-label` required, secondary or ghost skin. |
| `Badge` | `tone: 'neutral' \| 'accent' \| 'pos' \| 'warn' \| 'neg'`, `glyph?` | 20 high, padding-x 6, radius 6, `meta`. neutral `bg-surface-3 text-ink-2`; accent `bg-accent-tint text-accent-ink`; pos `bg-pos-tint text-pos-ink`; warn `bg-warn-tint text-warn`; neg `bg-neg-tint text-neg`. No border. Status badges always carry a glyph and a word. |
| `Chip` | `selected`, `count?`, `swatch?`, `onClick`, `disabled?` | 28 high (32 below 768, row gap 8), padding-x 10, radius 8, `meta` 500. Idle `bg-surface-2`, 1 px `--edge`, ink-2. Selected `bg-accent-tint`, 1 px `--accent-ink`, `accent-ink` 600, leading check 12. With `swatch` (engines): 8 px circle, selected keeps `bg-surface` (C4). `aria-pressed`. Counts tabular. |
| `ChipGroup` | `label`, `children` | a `meta` ink-3 label then the chips; wraps to at most 2 rows; never scrolls the page. |
| `SegmentedControl` | `options`, `value`, `onChange`, `ariaLabel` | track `bg-surface-2`, 1 px `--line`, radius 8, padding 2. Segment 28 high (44 hit below 768), padding-x 12, `body` 500 ink-2. Pressed: `bg-surface`, 1 px `--edge`, ink 600, `shadow-raised`. `role="radiogroup"`, arrow keys. Used for the time strip, W / M / Q, and Sort. |
| `Select` | native `<select>` | 40 high, `bg-surface-2`, 1 px `--edge`, radius 8, `body` ink. Used for the Mentions category filter below 768 (graft G7). |
| `Disclosure` | `title`, `count?`, `summary`, `defaultOpen?`, `children` | trigger is a full-width `<button>` inside an h2: title `heading` + count Badge + summary `meta` ink-3 + chevron 16 ink-3, min 48, `aria-expanded`, `aria-controls`. Body uses the existing `Collapse.tsx` (restyled). |

### 7.5 States

| Component | Anatomy |
|---|---|
| `EmptyState` (existing file, restyled) | `variant: 'page' \| 'inline'`, `tone?: 'error'`. Icon 20 ink-3 in a 40 square `bg-surface-3` radius 8; title `heading` ink; body `body` ink-2 max 48ch; one Button (primary only when it is the route's only action). `inline` min height 160. `tone="error"`: icon `neg`, button Retry. |
| `LoadErrorCard` (existing) | Card standard, StatusGlyph neg 16, title `heading`, body ink-2, Retry secondary; border `--line` (no red border). |
| Skeletons (`Skeleton.tsx` extended, `ui/skeletons.tsx`) | `SkeletonBlock`, `SkeletonText lines`, `SkeletonStat`, `SkeletonReadout n`, `SkeletonHero`, `SkeletonDial`, `SkeletonTable rows cols`, `SkeletonList rows`, `SkeletonChart h`. Fill `bg-surface-3`, radius matching the element; each the exact box of its final element. |
| `RouteSkeleton` | PageHeader bar + SkeletonHero + SkeletonReadout 4, inside `Page`. |
| `FeatureLocked` | Card standard, lock ink-3, title `heading`, body ink-2, one primary upgrade action (existing copy). |
| `PromptResultCell` | 40 x 40 (grid), radius 6. Mentioned: `bg-pos-tint`, check `pos`, rank `meta` 600 ink. Answered not mentioned: `bg-surface-2`, x 12 `neg`. No answer: `bg-surface-2`, minus ink-3. Could not check: `bg-surface-2`, `TriangleAlert` warn. Not checked yet: `bg-surface-2`, clock ink-3. Locked: transparent, lock ink-3. A zero-mention tenant sees a quiet grey grid, not a wall of red. |
| `EngineChip` | swatch 8 on surface + label `meta` ink-2; selected per C4. |
| `TrendDelta` | glyph (pos up, neg down) + signed number `meta` ink-2 tabular; number never coloured. |
| `ChartTooltip`, `ChartLegend` | section 8. |

**Old exports stay compiling:** `Typography.tsx` `PageTitle`, `SectionHeading`, `StatLabel`, `StatValue` become thin wrappers over the new primitives; `MotionCard` keeps its entrance and loses hover lift unless `interactive`; `ClassificationBadge` is dead (#72 audit), left alone.

---

## 8. Shell (`Layout.tsx`, Lane 1)

**Sidebar (>= 768).** Width 240, `bg-canvas`, right border 1 px `--edge` (3.64 dark, 3.42 light vs canvas). Order unchanged: logo row 56 (Demo badge becomes Badge neutral, was amber), admin row, collection progress, nav groups, client card, collection market, bottom actions. Group headers sentence case ("Insights", "Strategy", "Manage") `meta` ink-3, 24 above, 8 below. "COLLECTION MARKET" becomes "Collection market".

**Nav row.** 36 high (44 below 768 in the drawer), radius 8, padding-x 12, gap 12, icon 16. Idle: label `body` 500 ink-2, icon ink-3. Hover: `bg-surface-2`, ink. Active: `bg-surface-3`, label 600 ink, icon ink, plus a 2 px rail at the left edge (inset 8 top and bottom, radius 2, `--accent-ink`: 6.09 dark / 6.05 light on surface-3, 7.23 / 6.65 on canvas). Locked items: lock ink-3, unchanged meaning.

**Time strip** (only `TIME_FILTER_ROUTES`, unchanged). 48 high, `bg-canvas`, bottom 1 px `--line`. Caption kept at >= 768 (`meta` ink-3, existing copy), hidden below 768 and kept as the control's `aria-label`. Control: SegmentedControl, full width below 768 (fixes the two-line "7 days" pills at 390).

**Mobile top bar (< 768).** 56, `bg-canvas`, bottom `--line`, hamburger IconButton 44, logo, Demo badge.

**Mobile bottom nav (< 768).** 64 plus safe area, `bg-surface`, top 1 px `--line`. Five slots in sidebar order: Overview, Visibility, Sentiment, Mentions, More (CP4). Each slot 78 x 64 hit area, icon 20 over `meta` label (no truncation at 390), active = ink plus 2 px `--accent-ink` bar on the top edge, idle ink-3 (5.66 dark / 6.03 light on surface). More opens the existing drawer and reads active on Competitors, Recommendations and Prompts. Replaces the 7-item array at `Layout.tsx:262-270`.

**Canvas.** `<main>` `bg-canvas`. `.canvas-bleed` is removed (decoration on the canvas, no job).

---

## 9. Charts (`chartTheme.ts`, Lane 1; use, Lane 2)

### 9.1 Theme object

| Key | Dark | Light | Source |
|---|---|---|---|
| `gridLine` | `#23242b` | `#e2e2ea` | line |
| `axisInk` | `#878d99` | `#62626c` | ink-3 (5.66 / 6.03 on surface) |
| `tooltipSurface` | `#16171e` | `#ffffff` | surface-2 / surface |
| `tooltipBorder` | `#32333c` | `#cfcfda` | line-2 |
| `tooltipInk` | `#e8e9ed` | `#09090f` | ink |
| `cardSurface` | `#101116` | `#ffffff` | surface |
| `sentimentPositive` | `#84cc16` | `#58870f` | pos |
| `sentimentNeutral` | `#666a75` | `#71717a` | neu |
| `sentimentNegative` | `#fb7185` | `#9f1239` | neg |
| `you` (new) | `#8b5cf6` | `#7c3aed` | accent |
| `field` (new) | `#666a75` | `#71717a` | neu |
| `track` (new) | `#1d1e27` | `#ececf4` | surface-3 |
| `railActive` (kept for compatibility) | `#a78bfa` | `#6d28d9` | accent-ink |

Helpers exported from `chartTheme.ts`: `gridProps` (`vertical={false}`, 1 px), `axisProps` (no axis line, no tick line, 12 px `axisInk`), `yPercentAxis` (`width={48} domain={[0,100]} ticks={[0,50,100]} tickFormatter={v => v + '%'}`), `barProps` (`radius={[4,4,0,0]}`, `maxBarSize={24}`, `stroke={cardSurface} strokeWidth={2}`), `lineProps` (`strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: cardSurface }}`), `fieldDash = ['0', '6 3', '2 3']`.

### 9.2 Marks

Horizontal gridlines only. Tick labels `meta` 12 tabular. Bars max 24 single, 16 grouped, 4 px rounded data end, square baseline, 2 px surface gap. Lines 2 px, last point 4 px dot plus a direct label at the line end (`meta` ink-2). Tooltip: `tooltipSurface`, 1 px `tooltipBorder`, radius 12, `shadow-raised`, padding 8 x 12; label `meta` ink-3; rows swatch 8 + name `meta` ink-2 + value `meta` 600 ink right-aligned. Legend above the plot for >= 2 series; none for one. Text in charts wears ink tokens, never the series colour.

### 9.3 When a chart becomes something else

| Condition | Becomes |
|---|---|
| Proportions of a whole (sentiment split) | `SplitBar` with direct legend |
| Nominal categories with names over 10 characters, or more than 5 bars below 640 | `BarList` (fixes the "Lantern T..." truncation and the 390 collision) |
| One category axis value only (one engine has data) | a `BarList` or Meter list, one row per series, no axes |
| Fewer than 2 time buckets | `EmptyState inline` at the final chart height with the existing "Not enough data yet" copy |
| More than 3 competitor lines | you plus the top 3 by mentions in the window; the table carries the rest |
| A multi-engine time series | small multiples, one per engine (C8) |

---

## 10. Motion

Tokens unchanged (`--motion-fast` 180, `--motion-base` 260, `--motion-slow` 500, `--ease-out` `cubic-bezier(0.16,1,0.3,1)`; `src/lib/motion.ts` not edited). `MotionConfig reducedMotion="user"` covers Motion components; `index.css` keeps one `@media (prefers-reduced-motion: reduce)` block for CSS transitions.

| Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|
| First 4 blocks in reading order | first data paint per route visit | opacity 0 to 1, y 8 to 0 | 260 | ease-out | 40, rest at once | guide the eye from the hero down | final state, no transform |
| ScoreDial arc | first data paint only | stroke-dashoffset | 500 | ease-out | none | land the eye on the number first | drawn at value |
| Hero number | none | no count-up | | | | a counting number is unreadable for 500 ms | |
| SegmentedControl indicator | value change | position (Motion `layoutId`) | 180 | ease-out | none | confirm the new window | jumps |
| Chip, nav row, Card `interactive` | hover, select, route change | background, border colour; rail opacity | 180 | ease-out | none | confirm the action or the location | instant |
| Button | hover, press | background; press scale 0.98 | 180 / 100 | ease-out | none | confirm the press | colour only |
| Disclosure | toggle | height, content opacity; chevron rotate 180 | 260 / 180 | ease-out | none | keep the user's place while content opens | instant |
| Chart series | data or filter change | Recharts tween | 300 | ease-out | none | show what changed | `isAnimationActive={false}` |
| Content under a range change | value change | opacity 1 to 0.5 to 1 on the affected block | 180 + 180 | ease-out | none | mask recompute latency | swap |
| Skeleton | loading | opacity 0.55 to 1 loop | 1200 | ease-in-out | none | say "working" | static 0.7 |
| Tooltip | hover | opacity | 120 | ease-out | none | track the pointer | instant |

Cut: ring glow and gradient, `.card-hover-lift` on non-interactive cards, ambient pulse, count-up numbers.

---

## 11. Pages (Lane 2), in priority order, with first-run states

Every route uses `Page`, `PageHeader`, `HeroAnswer`. Every number comes from a value the page already computes; `src/lib/metrics.ts`, `resultsContext`, `src/lib/views/**`, `resultsGuards.ts`, `resultsLoader.ts` are not touched. If a layout change cannot land without editing one of those, the builder stops and returns NEEDS_HUMAN. Errors use LoadErrorCard where the page already receives an error from the shared results layer; where it does not, the builder records NEEDS_HUMAN rather than adding a query.

### 11.1 Overview, `Dashboard.tsx` (5 blocks)

Blocks: PageHeader, HeroAnswer, What to do next, Key metrics, Disclosure.

1. **HeroAnswer with ScoreDial** (`overview-desktop-*`): dial lg; badge = the score label the page already derives; answer `[answer: Your brand is named in {mentionRate}% of AI answers checked in the {range} window.]`; context `[context: score from {totalChecks} checks, all time]` (fixes the hidden basis); children = six dimensions as a 3 x 2 grid (2 x 3 at 390): label `meta` ink-2, value `value` ink, Meter 4 accent; undefined dimensions read "n/a" (existing `dimNotApplicable`). "View full breakdown" becomes a tertiary Button. Subtitle "Here's your AI visibility snapshot." removed.
2. **Mention rate value in ink** (`overview-*-dark/light`): `Stat tone="warn"` keeps the threshold logic and renders a glyph.
3. **What to do next** (exists, `Dashboard.tsx:372`): one `Card interactive` under the hero with the single top action and one tertiary link.
4. **Key metrics**: one ReadoutRow of the four existing stats; sparklines ink-3; mixed-window note (`Dashboard.tsx:582-592`) stays as `meta` ink-3 under it.
5. **Disclosure** "Show engine breakdown and recent activity" (existing label, sentence-cased) with a summary line; inside, engine bars per C8 and rows using EngineChip and StatusGlyph (replaces the 10 px coloured text at `:666`).
6. Refresh is a secondary Button.

**First run (zero ok rows):** hero `empty`: icon `Radar`, title "Not measured yet" (existing), body `[empty: Your first collection checks every prompt on every engine in your plan.]`, action = the existing first-run branch (to `/prompts` or Run collection). Dimensions read "Not measured yet"; Key metrics and the disclosure hidden. No 0%, no score label, no "Needs work".

### 11.2 AI Visibility, `AIVisibility.tsx` (7 blocks, was 10)

Blocks: PageHeader, HeroAnswer, Engines, Fix this, Your prompts, Disclosure "Could not be checked", Disclosure "Competitors and categories".

1. **PageHeader**: title + market Badge neutral inline; actions Run collection (the page's only primary) and Reload (secondary); full-width row at 390 (fixes the wrapped two-line button in `ai-visibility-mobile-dark.png`).
2. **HeroAnswer** (graft G1, moves y=784 to the top): ScoreDial md; badge "Strong" etc. as Badge pos / warn / neg with glyph; answer = the existing sentence "Your brand is recommended in {n} of {m} prompts, best on {engine} (#{rank})."; context "last checked {date}" (existing); children = six dimension rows: name `body` 500 ink, description `meta` ink-3, value `body` 600 tabular, Meter 6 accent.
3. **Engines**: one Card merging engine status cards, coming-soon cards and the locked strip. Active engine tile (min width 220, so "Gemini" never truncates): logo 24, name `heading`, rate `value` ink, "10 of 21 prompts, best #2" `meta` ink-2, Badge warn "Partial" with glyph. Coming soon collapses to one `meta` ink-3 line naming them. Locked engines stay as chips with lock and the existing "Unlock on {plan}" text, under a "Locked on your plan" label.
4. **Fix this**: SectionHeader + count; each item a DataList row: priority Badge (P1 accent, P2 neutral), title `heading` ink (no amber or orange), reason `body` ink-2, recommended fix in an inset (`bg-surface-2` radius 8 padding 12); actions: Copy as AI prompt (secondary sm), Mark as done (secondary sm with check), Not for us (ghost). Amber left rule removed. Shows 3, then "Show all {n} actions" tertiary (existing). Below 768 actions sit in a row under the fix text.
5. **Your prompts**: SectionHeader; toolbar: ChipGroup "Category" and SegmentedControl "Sort" on one row at >= 1024, stacked below, Export CSV secondary sm; "Where you appear" as a real table (DataList below 768) with PromptResultCell (7.5); category tags Badge neutral; inside the same card a collapsed Disclosure "Where you do not appear yet" with summary `[summary: {n} prompts, no engine named your brand]`; a collapsed tertiary Disclosure "What the symbols mean" holds the legend.
6. **Disclosure "Could not be checked"**, collapsed, summary carries "first failed {date}" (existing value).
7. **Disclosure "Competitors and categories"**, collapsed, summary `[summary: {k} competitors named, weakest category {name} at {n}%]`: top competitors as Badge neutral with "avg #{n}" `meta` ink-3 (no red chips); category breakdown as Meter rows by the existing thresholds (C6).

**First run:** hero `empty` with primary Run collection (the real control); engines show Badge neutral "Not checked yet"; Fix this hidden; prompts table shows prompts with "Not checked yet" cells; no prompts at all: EmptyState with primary "Add prompts" to `/prompts`.

### 11.3 Brand Sentiment, `BrandSentiment.tsx` (5 blocks, was 7)

Blocks: PageHeader, HeroAnswer, By engine, Over time, Recent signals.

1. **HeroAnswer replaces four tiles and the overall bar** (graft G4, `sentiment-desktop-*`): value = score, unit "/100"; badge = existing label (Mostly positive pos, Mixed neutral, Needs attention warn, Mostly negative neg) with glyph; answer `[answer: {positivePct}% of the {n} AI answers that mention your brand are positive.]`; children = SplitBar with "Positive 10 (100%)  Neutral 0 (0%)  Negative 0 (0%)". The violet border on the score tile is gone.
2. **By engine**: BarList-style rows, one per engine with data: EngineChip left, a 100% stacked horizontal bar (sentiment marks, 2 px gaps), n right. One engine renders one row, not a 300 px chart with clipped ticks.
3. **Over time**: SectionHeader with W / M / Q SegmentedControl; fewer than 2 buckets: EmptyState inline at 240 with existing copy.
4. **Recent signals**: SectionHeader; ChipGroup "Sentiment" and ChipGroup "Engine" (one row each); feed as DataList; filtered-to-nothing: EmptyState inline.
5. Remove the market badge from the header (blueprint 6.3 item 5: it implies a filter that does not exist).

**First run (the 0-links dead end):** hero `empty`, title "Not measured yet", body `[empty: Sentiment appears once an AI answer mentions your brand.]`, secondary action "See where you appear" to `/ai-visibility`. Every other block hidden, none zeroed.

### 11.4 AI Mentions, `Mentions.tsx` (4 blocks)

Blocks: PageHeader, HeroAnswer, Filters, Mentions list.

1. **HeroAnswer replaces three tiles** (`mentions-desktop-dark.png`): value = total mentions; answer `[answer: AI engines named your brand {n} times, at an average position of #{avg}.]`; context `[context: {k} of them positive]`. No green, amber or blue icons.
2. **Filters**: ChipGroup "Engine" (EngineChip swatches); ChipGroup "Category" at >= 768, native Select below 768 (graft G7). The existing note "Latest answer per prompt and engine..." under the filters as `meta` ink-3.
3. **List**: one Card, DataList rows (not 10 cards): leading rank `value` ink "#2" with `meta` ink-3 "pos" under it (no lime); title the prompt, 2-line clamp at 390, 1 line at >= 768; meta line EngineChip, category Badge neutral, sentiment glyph + word ink-2; trailing chevron; expanded snippet in a `bg-surface-2` inset.
4. Moves into `Page` (was 960 centred).

**First run:** hero `empty`, body `[empty: No AI answer has named your brand yet.]`, secondary "See the prompts" to `/ai-visibility`; filters hidden.

### 11.5 Competitors, `Competitors.tsx` (6 blocks)

Blocks: PageHeader, HeroAnswer, Share of mentions, Competitor table, Disclosure "By engine and over time", Your tracked competitors.

1. **HeroAnswer** (`competitors-desktop-*`): value = your AI mentions; answer `[answer: AI engines named your brand {you} times; the most named competitor, {top}, {k} times.]`; context "across {responses} AI responses, {engines} engine" (existing values). "Top competitor" stops being red. "Add manually" is a secondary PageHeader action.
2. **Share of mentions** replaces the vertical "AI mention count" chart: BarList, you first in `--accent`, then the top competitors in `--neu`, names wrap (fixes truncation and the 390 collision).
3. **Competitor table** at >= 768 (Competitor, AI mentions, Avg position, Engines, Sample prompt); header `meta` ink-2; your row first with `bg-accent-tint` and Badge accent "you"; counts and positions ink tabular (not red, not green); down-trend glyph `neg` with `aria-label`. Below 768 a DataList: name (wraps, never 3-line stacks: name column min 140 at >= 768), "{n} mention, avg #{p}" meta, sample prompt on expand. Export CSV in the SectionHeader actions.
4. **Disclosure "By engine and over time"**, collapsed (graft G3): visibility by engine as a BarList per engine when one engine has data, grouped bars (you `--accent`, field `--neu`) when two or more; performance over time with you solid `--accent` and the top 3 in `--neu` with `fieldDash` patterns, direct end labels and legend; fewer than 2 buckets: EmptyState inline at final height.
5. **Your tracked competitors**: DataList with the delete IconButton always visible (`Competitors.tsx:636` hover-only fix), `aria-label="Remove {name}"`.
6. Delete `COMPETITOR_SERIES_COLORS` and `buildCompetitorColors`; read `chart.you` and `chart.field`.

**First run:** hero `empty`, body `[empty: Competitors appear when AI answers name other companies for your prompts.]`, primary "Add a competitor" (opens the existing manual add); table and charts hidden; the manual list shows if not empty.

### 11.6 Recommendations, `Recommendations.tsx` (5 blocks)

Blocks: PageHeader, HeroAnswer, Priority actions, AI analysis, Disclosure "Who AI names instead".

1. **PageHeader**: "Recommendations" + Badge neutral "2 actions" inline; Refresh secondary drops to its own row below 640 (fixes the overlap in `recommendations-mobile-*.png`). Moves into `Page` (was 832).
2. **HeroAnswer** (graft G5): value = count of priority actions, unit "actions"; badge from the existing engine status ("1 engine below 50%" as Badge warn with glyph); answer `[answer: Start with: {title of the first priority action}.]`; context = the existing subtitle "Generated from {n} successful AI checks"; children = one row per engine with EngineChip, rate ink, Badge neg "Low" with glyph (absorbs the standalone engine card and the red banner: the route keeps zero Notices unless an error).
3. **Priority actions** directly under the hero; first item open. Item: impact Badge neutral with bolt glyph (impact is not status), effort `meta` ink-3 with clock (not amber), title `heading` ink, EngineChip; on expand "Why this matters" in a `bg-surface-2` inset at 15 / 24 prose, numbered steps with 20 px `bg-surface-3` circles `meta` ink-2.
4. **AI analysis**: SectionHeader with Claude Badge neutral and "Generate insights" primary (the route's one primary); the dashed prompt box becomes EmptyState inline (solid, no dashes).
5. **Disclosure "Who AI names instead"**, collapsed: competitor Badges neutral (not red).

**First run:** hero `empty`, body `[empty: Actions are generated after your first collection.]`, primary "Run first collection" to `/ai-visibility`; AI analysis shown with Generate disabled and its existing reason.

### 11.7 Prompts, `Prompts.tsx` (4 blocks)

Blocks: PageHeader, Notice (only at or over limit), Filters, Prompt list. No HeroAnswer on this route: it is a management list, and the allowance meter is its number.

1. **PageHeader**: "Monitored prompts"; subtitle replaced by the existing `AllowanceMeter` restyled: Meter 4 (`--accent`, `--warn` at or over limit) + "{used} of {limit} prompts used on {plan}" `meta` ink-2 tabular; actions AI Discover (secondary) and Add prompt (primary when allowed; disabled with lock when at limit).
2. **Limit banner becomes `Notice tone="warn"`** with "Upgrade" tertiary (no longer louder than the title).
3. **Filters**: ChipGroup "Category" with counts.
4. **List**: one table Card (fixes 24 cards in `prompts-desktop-dark.png`): # (32, ink-3 tabular), Category (Badge neutral in a fixed 112 column so prompt text aligns), Prompt (`body` ink, wraps), actions edit and archive IconButtons always visible (graft G6). Below 768: line 1 "# prompt", line 2 category Badge left, actions right (fixes the ragged text start in `prompts-mobile-dark.png`). AI Discover chat: user bubble `bg-accent-tint text-ink`, assistant `bg-surface-2 text-ink`.

**First run:** EmptyState page, primary Add prompt, secondary AI Discover.

---

## 12. Data legibility

1. Percentages whole (`48%`); between 0 and 1 prints `<1%`; never `.0`; no space before `%`.
2. Average position one decimal with `#` (`#2.9`); ranks without decimal (`#2`).
3. Counts with the locale's thousands separator, `tabular-nums` always.
4. Score integer out of 100; the dial's `%` is a unit at `meta`, not a superscript.
5. Deltas signed (`+4 pts`), the glyph carries direction, the number is ink-2.
6. Undefined is "n/a"; "Not measured yet" replaces any 0% that means "no data".
7. Dates `1 Jul`; year only when not the current year; windows `1 Jul to 7 Jul`.
8. Every headline number carries its basis (checks, window) in its context line.
9. A chart a sentence, SplitBar or BarList can replace is replaced (9.3).
10. Units once per table column header, not per cell.

---

## 13. Accessibility floor (measured, section 19 run R1)

### 13.1 Text contrast (floor 4.5:1)

| Text | Dark on canvas / surface / surface-2 / surface-3 | Light on canvas / surface / surface-2 / surface-3 |
|---|---|---|
| ink | 16.22 / 15.54 / 14.73 / 13.66 | 18.59 / 19.86 / 18.14 / 16.90 |
| ink-2 | 7.58 / 7.26 / 6.88 / 6.38 | 6.91 / 7.38 / 6.74 / 6.28 |
| ink-3 | 5.90 / 5.66 / 5.36 / 4.97 | 5.65 / 6.03 / 5.51 / 5.13 |
| accent-ink | 7.23 / 6.93 / 6.56 / 6.09 | 6.65 / 7.10 / 6.49 / 6.05 |
| pos-ink | 9.96 / 9.54 / 9.04 / 8.39 | 6.63 / 7.08 / 6.46 / 6.02 |
| neg | 7.31 / 7.01 / 6.64 / 6.16 | 7.51 / 8.02 / 7.32 / 6.82 |
| warn | 11.79 / 11.29 / 10.70 / 9.93 | 8.12 / 8.67 / 7.92 / 7.38 |

| Pair | Dark | Light |
|---|---|---|
| on-accent on accent-strong / on hover | 5.70 / 7.10 | 7.10 / 8.98 |
| accent-ink on accent-tint (selected chip) | 5.88 | 5.98 |
| ink on accent-tint ("you" row) / ink-2 on accent-tint | 13.19 / 6.16 | 16.72 / 6.21 |
| Badge pos: pos-ink on pos-tint | 7.49 | 6.52 |
| Badge neg: neg on neg-tint | 5.80 | 6.68 |
| Badge warn: warn on warn-tint | 9.00 | 7.79 |
| Badge neutral: ink-2 on surface-3 | 6.38 | 6.28 |
| ink on pos-tint / neg-tint / warn-tint | 12.20 / 12.88 / 12.39 | 18.30 / 16.54 / 17.83 |
| axis ink-3 on surface | 5.66 | 6.03 |
| bottom nav idle ink-3 on surface | 5.66 | 6.03 |
| Bridge, unchanged from today: `text-slate-500` light `#556479` on white; `#b45309` on `#fef3c7`; `#047857` on `#d1fae5` | | 6.03; 4.51; 4.84 |

Forbidden as text: `--neu` (light 4.11 on surface-3), `--pos` mark in light (4.30 on surface, 3.66 on surface-3), `--accent` (dark 4.45 on surface).

### 13.2 Non-text contrast, WCAG 1.4.11 (floor 3:1)

| Element | Dark | Light |
|---|---|---|
| `--edge` on canvas / surface / surface-2 / surface-3 (inputs, secondary buttons, idle chips, pressed segment, sidebar divider) | 3.64 / 3.49 / 3.30 / 3.06 | 3.42 / 3.65 / 3.34 / 3.11 |
| Primary fill `--accent-strong` vs surface / surface-2 (never on surface-3: 2.91 dark) | 3.31 / 3.14 | 7.10 / 6.49 |
| Nav rail `--accent-ink` on surface-3 (active row) / canvas | 6.09 / 7.23 | 6.05 / 6.65 |
| Focus ring `--accent-ink` on canvas / surface / surface-3 | 7.23 / 6.93 / 6.09 | 6.65 / 7.10 / 6.05 |
| Selected chip border `--accent-ink` on surface | 6.93 | 7.10 |
| Dial arc and meter fill `--accent` on track `--surface-3` | 3.91 | 4.85 |
| Sentiment marks on surface: pos / neu / neg | 9.54 / 3.49 / 7.01 | 4.30 / 4.83 / 8.02 |
| Status glyphs on result cells: pos on pos-tint; neg / warn on surface-2 | 7.49; 6.64 / 10.70 | 3.96; 7.32 / 7.92 |
| Engine marks, min of the 7 live on canvas / surface | 3.78 / 3.62 | 3.09 / 3.30 |
| `--line`, `--line-2` on surface (decorative only, never a sole control boundary) | 1.22, 1.50 | 1.29, 1.55 |
| Card vs canvas (not a component) | 1.04 | 1.07 |

### 13.3 Focus, targets, headings, identity

- `:focus-visible` 2 px `--accent-ink` outline, offset 2, in `@layer base`; never removed; inputs keep it.
- Targets >= 24 x 24 at >= 768 (WCAG 2.5.8); >= 44 x 44 below 768 for every control (pseudo-element extension where the visible control is smaller).
- One h1 per route (PageHeader); every Card title and Disclosure trigger an h2; sub-blocks h3; no skipped level; the hero has no heading.
- Identity never by colour alone: engine = swatch + name (+ logo); sentiment = glyph + word; status = glyph + word; selection = fill + weight + border; competitor lines = dash + direct label + legend.
- Every chart has a text equivalent (the hero, the BarList, or a visually hidden table).

---

## 14. DeltaE ledger (measured, section 19 run R2)

| Set | Dark | Light | Gate | Verdict |
|---|---|---|---|---|
| 7 live engines, shipped (`#0f766e`), adjacent | chroma FAIL (0.086); CVD 6.9 protan; normal 18.5 | same | chroma >= 0.10 | **FAIL today** |
| 7 live engines, proposed (`#1c7b5a`), adjacent, on canvas and surface | chroma PASS; CVD 7.7 protan (`#a16207` vs `#1c7b5a`, warn band, legal with logo + label + legend); normal 17.1; contrast PASS | same on `#ffffff` and `#f7f7fc` | CVD >= 6 with secondary encoding, normal >= 15 | PASS |
| 10 engines in `ALL_ENGINES` order, proposed, adjacent | CVD 6.5 deutan (`#6366f1` vs `#c026d3`), normal 18.6 | same | | PASS (warn band) |
| 7 live engines, all pairs | normal 13.17 (`#1c7b5a` vs `#16a34a`), CVD 4.0 protan (`#a16207` vs `#ea580c`) | same | | FAIL, hence rule C8 |
| Sentiment triad, adjacent | pos/neu 32.7, neu/neg 26.1 normal; worst CVD 11.71 protan | pos/neu 16.17, neu/neg 19.69 normal; worst CVD 10.81 deutan | CVD >= 8, normal >= 15 | PASS |
| pos vs neg touching (neutral 0%) | 10.26 deutan | 11.71 deutan | CVD >= 8 | PASS |
| Shipped light pos `#3f6212` vs neg `#9f1239` | | **2.76 deutan** | | FAIL today |
| Shipped dark neu `#94a3b8` vs neg | 8.88 protan | | | passes; changed for margin |
| You vs field (bars and lines) | 21.81 normal, 19.87 deutan | 23.31 normal, 20.54 deutan | >= 15 / >= 8 | PASS |
| `COMPETITOR_SERIES_COLORS` shipped, all pairs | CVD 2.9 deutan; `#e07b00` L 0.682 outside band | | | FAIL, deleted |
| pos vs chatgpt (chips side by side, glyph shape differs) | 15.69 | 8.17 normal, 6.39 deutan | >= 8 normal | PASS, never co-plotted |
| pos vs ai_overview | 28.09 | 9.84 | >= 8 | PASS |
| neg vs google_ai / claude | 14.32 / 11.62 | 15.14 / 21.14 | >= 8 | PASS |
| warn vs grok | 28.98 | 13.73 | >= 8 | PASS |
| accent vs deepseek | 6.26 normal, 0.79 protan | 8.72 | not gated: accent is never a series beside engines; deepseek not live | risk R2 |
| Marketing light `--ok #047857` vs ai_overview; `--warn #b45309` vs grok | | 1.35; 4.73 | | why the dashboard does not reuse them |

---

## 15. Acceptance criteria (bg-verify measures each)

**Tokens and theming**
- **AC-1** `src/index.css` declares every token in 4.2 to 4.4 and 4.7 under `:root` and `html.light` with exactly the values in this file (script diff against the tables).
- **AC-2** `tailwind.config.js` exposes the names in 4.8 as `rgb(var(--x) / <alpha-value>)`, and the bridge entries of 4.6.
- **AC-3** `ENGINE_META.ai_overview.chartColor === '#1c7b5a'`; `git diff` of `planConfig.ts` touches only that value and its comment; `PLAN_ORDER` and `ALL_ENGINES` byte-identical.
- **AC-4** Validator: the 7 live engines in `ALL_ENGINES` order exit 0 on `#0a0b0e`, `#101116` (dark) and `#ffffff`, `#f7f7fc` (light), worst adjacent normal >= 17.0, worst adjacent CVD >= 7.5.
- **AC-5** Sentiment triad `#84cc16,#666a75,#fb7185` (dark) and `#58870f,#71717a,#9f1239` (light): worst adjacent CVD >= 10.5 and pos vs neg CVD >= 10.0 in both modes.
- **AC-6** `tests/tokens_sync.test.js` passes: every hex in `chartTheme.ts` and `tokens.ts` equals its `index.css` triplet in the same theme.

**Zero remaps**
- **AC-7** `rg -c "!important" src/index.css` returns exactly 1 (`.skip-link:focus`).
- **AC-8** `rg -n "html\.light \." src/index.css` returns 0 (the `html.light {` variable block is the only `html.light` selector).
- **AC-9** Bridge parity: on the 18 routes outside the 7 (Account, Prospects, Revenue, Affiliates admin and portal, Onboard, Social, SEO, Tickets, Audit report and request, auth screens, OAuth), in both themes at 1280, a computed-style snapshot taken before Lane 1 and after commit B shows identical `color` on every text element (tolerance 1 per channel) and identical `background-color` on every element carrying a bridged `bg-*/NN` class; the only allowed differences are elements in the sweep, which must compute `#ffffff` text on a fill that clears 4.5:1, and surfaces from the `--dark-*` aliases.
- **AC-10** `rg -n "text-white" src | rg "bg-(brand|violet|purple|red|emerald|amber|rose|green|blue|indigo|sky|orange|pink|teal|cyan|slate)-[5-9]00([^/0-9]|$)"` returns 0; ternary class strings at `AIVisibility.tsx:2489` and `Prospects.tsx:1255,1261` checked by hand and listed in the review.
- **AC-11** A throwaway element with `text-slate-400 bg-emerald-500/20 border-slate-600/50` in light mode computes `rgb(71 85 105)`, `#d1fae5`, `rgb(203 213 225)` with no CSS beyond the config (proves "themed by construction"), then is removed.

**Contrast and colour rules**
- **AC-12** axe `color-contrast` and `non-text-contrast` 0 violations on the 7 routes, both themes, at 1440 and 390, demo mode.
- **AC-13** Every pair in 13.1 and 13.2, re-measured from computed styles in the running app, matches this file within 0.05.
- **AC-14** In the 7 page files and `src/components/**`: zero `#[0-9a-fA-F]{6}` literals outside `chartTheme.ts`, `tokens.ts` and ENGINE_META (comments excluded); zero legacy palette classes `(text|bg|border)-(white|slate|brand|violet|purple|emerald|red|rose|amber|orange|blue|sky|cyan|teal|indigo|pink)` (only token classes).
- **AC-15** Numbers are ink: the Overview mention rate, Mentions ranks, Competitors counts, Sentiment hero value and every HeroAnswer value compute to `--ink`.
- **AC-16** `COMPETITOR_SERIES_COLORS` and `buildCompetitorColors` absent from `src/`; competitor lines use `field` with distinct `strokeDasharray`.
- **AC-17** No violet border on any content card that is not selected or focused (computed border equals `--line` or `--line-2`).
- **AC-18** Active nav row: rail colour equals `--accent-ink` and measures >= 3:1 against both its row and the canvas in both themes.

**Type and layout**
- **AC-19** No element in scope computes `font-weight` above 600 or `font-size` below 12 px.
- **AC-20** At 390, 768, 1280 and 1440, on all 7 routes, both themes: after `window.scrollTo(600, 0)`, `scrollX === 0` (real scroll via headless Chrome over CDP, not `scrollWidth`).
- **AC-21** At 1440 the `h1` left edge and the `Page` inner width are identical (within 1 px) on all 7 routes.
- **AC-22** Top-level block counts equal section 11 (5, 7, 5, 4, 6, 5, 4) and none exceeds 9.
- **AC-23** The 10-second structural test: at 1440x900 and 390x844 the h1, HeroAnswer number and sentence are inside the first viewport on the 6 routes with a hero, and on `/prompts` the h1, allowance and first row are.
- **AC-24** At 390: Recommendations header badge and Refresh bounding boxes do not intersect; no chart category label overlaps another; bottom nav has 5 slots, each label `scrollWidth <= clientWidth`, order equal to the sidebar.
- **AC-25** No y-axis tick is clipped: every `.recharts-cartesian-axis-tick-value` has `getBBox().x >= 0` within its SVG.
- **AC-26** Row actions on `/prompts` and the delete on `/competitors` are visible without hover and reachable by Tab; every control below 768 has a hit area >= 44 x 44.

**States and motion**
- **AC-27** With an empty demo fixture (prompts, zero ok rows), each of the 7 routes shows no "0%", no score label, no "Needs work", and at least one focusable control that navigates or acts.
- **AC-28** RouteSkeleton to content: cumulative layout shift < 0.05 per route.
- **AC-29** With `prefers-reduced-motion: reduce` emulated, `document.getAnimations()` is empty after load and no transform transitions run; skeletons are static.
- **AC-30** Every focusable element in scope shows a 2 px `--accent-ink` outline on keyboard focus.

**Guardrails**
- **AC-31** `src/lib/metrics.ts`, `resultsContext.tsx`, `resultsLoader.ts`, `resultsGuards.ts`, `src/lib/views/**`, `src/lib/motion.ts` byte-identical to HEAD; `npm run build` and `tsc` exit 0; no new dependency in `package.json`.
- **AC-32** No em dash and no en dash in any added line (`rg` with a positive control; never `grep -P` on Git Bash).

---

## 16. Lanes, files, order

Both lanes run on Sonnet (presentation only, no auth, billing or RLS); bg-verify on Opus after both, with headless Chrome over CDP for AC-9, AC-20, AC-24, AC-25. One Netlify build for the whole set, pushed with `$env:BATCH_PUSH=1` on Constantin's go. Nothing starts before section 2 is ruled.

### 16.1 Order

1. **Lane 1 commit A**: tokens, legacy aliases, bridge, primitives, shell, `chartTheme.ts`, `tokens.ts`, ENGINE_META value, sweep inside its own files. The remaps stay in place, so every route still renders as today in light.
2. **Lane 2** (may be written in parallel against the frozen props in section 7, merged after commit A): the 7 pages, then the class sweep in the 17 out-of-scope page files.
3. **Lane 1 commit B**: delete the remaps per 4.6 once Lane 2's AC-10 grep returns 0.
4. bg-verify on the combined diff; then the one push.

### 16.2 Lane 1, foundation (`bg-app`)

**Write scope, exact:**
- `brandgeo-dashboard/tailwind.config.js`
- `brandgeo-dashboard/src/index.css`
- `brandgeo-dashboard/src/lib/chartTheme.ts`
- `brandgeo-dashboard/src/lib/tokens.ts` (new)
- `brandgeo-dashboard/src/lib/planConfig.ts` (ENGINE_META `ai_overview.chartColor` and its comment only)
- `brandgeo-dashboard/src/lib/color.ts` (unchanged unless a builder needs `mix()`; `hexToRgba` stays)
- `brandgeo-dashboard/src/components/Layout.tsx`
- `brandgeo-dashboard/src/components/*.tsx` (all existing shared components: `AdminBell`, `AllowanceMeter`, `ChartLegend`, `ChartTooltip`, `ClientBanner`, `Collapse`, `CooldownCountdown`, `EmptyState`, `EngineChip`, `FeatureLocked`, `LoadErrorCard`, `McpAccessSection`, `MotionCard`, `PromotionsPanel`, `PromptResultCell`, `RouteSkeleton`, `ScoreBadge`, `Skeleton`, `SupportWidget`, `TrendDelta`, `TruncatedText`, `Typography`)
- `brandgeo-dashboard/src/components/ui/` (new): `index.ts`, `Page.tsx`, `PageHeader.tsx`, `SectionHeader.tsx`, `Notice.tsx`, `HeroAnswer.tsx`, `Card.tsx`, `ScoreDial.tsx`, `Stat.tsx`, `ReadoutRow.tsx`, `Meter.tsx`, `SplitBar.tsx`, `BarList.tsx`, `StatusGlyph.tsx`, `Badge.tsx`, `Button.tsx`, `IconButton.tsx`, `Chip.tsx`, `ChipGroup.tsx`, `SegmentedControl.tsx`, `Select.tsx`, `Disclosure.tsx`, `DataList.tsx`, `tableClasses.ts`, `skeletons.tsx`
- `brandgeo-dashboard/src/App.tsx` (the class string at `:142` only)
- `brandgeo-dashboard/tests/tokens_sync.test.js` (new)

**Do:** sections 4, 5, 6, 7, 8, 9.1, 10 (CSS side), 13.3; the sweep of 4.6 inside these files; commit B after Lane 2.
**Do not:** touch any file in `src/pages/`, the Phase 2 files of AC-31, `PLAN_ORDER`, `ALL_ENGINES`, `motion.ts`, `netlify/**`, any route, any copy meaning; add a dependency; run git beyond a pathspec commit if asked.
**Acceptance:** AC-1 to AC-8, AC-11, AC-13 (shell), AC-14 (components), AC-18, AC-19, AC-26 (shell), AC-29 to AC-32.

### 16.3 Lane 2, pages (`bg-app`)

**Write scope, exact:**
- Redesign: `brandgeo-dashboard/src/pages/Dashboard.tsx`, `AIVisibility.tsx`, `BrandSentiment.tsx`, `Mentions.tsx`, `Competitors.tsx`, `Recommendations.tsx`, `Prompts.tsx`
- Class sweep only (4.6 items 1 to 3, nothing else): `src/pages/Account.tsx`, `AffiliatesAdmin.tsx`, `AuditReport.tsx`, `AuditRequest.tsx`, `Login.tsx`, `OAuthAuthorize.tsx`, `Onboard.tsx`, `Prospects.tsx`, `ResetPassword.tsx`, `SEO.tsx`, `Signup.tsx`, `Social.tsx`, `Tickets.tsx`, `Welcome.tsx`, `affiliate/AffiliateJoin.tsx`, `affiliate/AffiliateLogin.tsx`, `affiliate/AffiliatePortal.tsx`

**Do:** section 11 in the listed order per route, sections 6, 9.2, 9.3, 12, using only Lane 1 primitives and token classes; `[answer: ...]`, `[context: ...]`, `[summary: ...]`, `[empty: ...]` templates shipped verbatim with slots filled until bg-copy rules.
**Do not:** edit any Lane 1 file; change any query, view, derived metric, route, sort logic or label meaning; touch the sweep files beyond the three replacements.
**Acceptance:** AC-9, AC-10, AC-12 to AC-17, AC-20 to AC-28, AC-31, AC-32.

---

## 17. Amendments to `docs/DESIGN-SYSTEM.md` (applied by bg-design after the checkpoint, not by this file)

- **P1** Surface, line, edge and ink tokens (4.2) with light pairs. **P2** Accent trio plus tint and on-accent (4.3). **P3** Polarity and status mark / ink / tint (4.4), replacing the sentiment ramp values. **P4** ENGINE_META table to the live values with `ai_overview #1c7b5a`. **P5** Elevation, radius, focus (4.7). **P6** Six type roles, weight cap 600, sentence case (5.1). **P7** One page frame and the nine-block ceiling (5.4). **P8** Colour rules C1 to C9. **P9** "Light mode by construction": never write `html.light .<utility>`; new legacy remaps are forbidden; the bridge is frozen and shrinks only. **P10** Chart theme keys and helpers (9.1). **P11** Motion table (10). **P12** HeroAnswer as the first block on every insight route. **P13** CLAUDE.md "Product quality" backlog: mark shell contrast and the four engine palette items CLOSED (fixed 2026-07-27); Competitors palette, first run and light remaps CLOSED when this build ships; section 4.3 "dark-mode only" is stale. **P14** `DASHBOARD-UX-2026.md`: hover lift on interactive cards only.

---

## 18. Findings outside design, risks, reference frames

**Findings (not design; owners named):**
- F1 Demo prompts render mojibake (the Romanian diacritics in "Bucuresti" and "Romania" show as two-byte garbage) on every list route: `src/lib/mockData.ts` encoding, UTF-8 bytes read as Latin-1. Owner bg-app; never rewrite it with PowerShell.
- F2 `/sentiment` demo: Positive 10, but every signal chip reads (0) and the feed says "No signals match this filter". KPI source and feed disagree. Owner bg-app with bg-verify.
- F3 `/prompts` demo reads "24 of 5 prompts used on Free". Fixture mismatch.
- F4 `/competitors` "Your brand" row: "No sample prompt". Data, not design.
- F5 Blueprint U4: Dashboard, Sentiment, Competitors and Recommendations fall through to empty states on query errors. This spec renders errors only where the shared results layer already exposes them; closing U4 fully is a logic task.

**Risks:**
- R1 The 7-engine adjacent CVD sits at 7.7 (warn band): legal only while every engine mark keeps logo, label and legend.
- R2 `--accent` vs deepseek is 0.79 protan in dark. Harmless while deepseek is not live and violet is never a series beside engines; when deepseek ships, re-run R2 and fold charts to the top five plus Other.
- R3 Bridge parity depends on the snapshot in AC-9 being taken BEFORE Lane 1 lands. bg-verify takes it first.
- R4 `AIVisibility.tsx` is 2,800 lines; the restructure is presentation only but large. NEEDS_HUMAN if it requires a Phase 2 file.
- R5 The 5-slot bottom nav adds one tap to Competitors, Recommendations and Prompts on mobile.
- R6 Hero sentences are templates; singular and plural and one-engine wording need a bg-copy pass before they read naturally with real tenant data.
- R7 CP6 (weight cap) and the `--dark-*` aliases change out-of-scope routes visually; bg-verify screenshots Account and Prospects in both themes.

**Reference frames (constraints, not mood):**

| Block | Comparable | Attribute borrowed |
|---|---|---|
| Whole surface | getbrandgeo.com Live Instrument | same neutrals, violet trio, six sizes, 600 cap, readout row with hairline rules |
| HeroAnswer | Mercury account home | one number in ink, one sentence of context, nothing louder above it |
| Shell | Linear | neutral sidebar on the canvas, one exact divider, active row raised with a thin accent rail |
| KPI readouts, tables | Mercury | tabular numerals, labels smaller than values, rules instead of boxes |
| Disclosures on AI Visibility | Linear issue groups | sections collapse to a count and a summary; rows, not cards |
| SplitBar, BarList | Stripe dashboard, Vercel analytics | one proportional bar or a labelled bar list instead of axes |
| Segmented control, chips | Raycast | the pressed segment is a raised object with an edge, not a tint |
| Empty states | Linear | one icon, one sentence, one action, inside the box it replaces |

---

## 19. Reproduction

Validator: `dataviz` skill `scripts/validate_palette.js` (bundled at `C:\Users\const\AppData\Local\Temp\claude\bundled-skills\2.1.317\c184ba83a3e1818a904a9620a9a367a5\dataviz\scripts\`). Harness used for every number above: `C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\m\measure.mjs`, importing a copy of the validator with `deltaE`, `oklch` and `okhue` exported.

- **R1 contrast**: `contrast(a, b)` for every token on canvas, surface, surface-2, surface-3 in both modes, plus the pairs listed in 13.1 and 13.2.
- **R2 palettes**: `validate([...], { mode, surface, pairs })` for the shipped and proposed 7-engine sets on `#0a0b0e`, `#101116`, `#ffffff`, `#f7f7fc`; the 10-engine set; all-pairs; the sentiment triads; `COMPETITOR_SERIES_COLORS`; and `deltaE(a, b, kind)` for the pair rows of section 14.
- **R3 bridge compile**: Tailwind 3.4.19 CLI on a config with `backgroundColor: { emerald: { '500/20': 'var(--br-bg-emerald-500-20)' } }` and `textColor: { emerald: { 400: 'rgb(var(--br-text-emerald-400) / <alpha-value>)' } }` emitted `.bg-emerald-500\/20 { background-color: var(--br-bg-emerald-500-20) }` and `.text-emerald-400\/70 { color: rgb(var(--br-text-emerald-400) / 0.7) }`, while `bg-emerald-500/10` kept the default composite. Scratchpad folder `tw\`.
