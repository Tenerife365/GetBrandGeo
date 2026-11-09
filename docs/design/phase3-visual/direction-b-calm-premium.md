# Direction B: Calm Premium

**Agent:** bg-design, direction B of the phase 3 visual pass
**Date:** 2026-11-09
**Status:** SPEC, blocked on HUMAN CHECKPOINT (section 0.3) before any build
**Surface:** `brandgeo-dashboard/src/`, the shell plus seven routes (`/`, `/ai-visibility`, `/sentiment`, `/mentions`, `/competitors`, `/recommendations`, `/prompts`), dark and light, 390 / 768 / 1280 / 1440
**Evidence:** the 28 screenshots in `docs/design/phase3-visual/current/` (all viewed), `src/index.css`, `tailwind.config.js`, `src/lib/chartTheme.ts`, `src/lib/planConfig.ts` ENGINE_META, `src/lib/color.ts`, `src/components/*`, `brandgeo/web/index.html` `:root` and `[data-theme="light"]`, `docs/DESIGN-SYSTEM.md`, `docs/DASHBOARD-UX-2026.md`, `docs/design/dashboard-visual-system.md`, `docs/audit/system-uiux-blueprint-2026-11-08.md` sections 3 and 6.
**Method:** every contrast ratio below is WCAG 2 relative luminance, computed. Every delta E is OKLab Euclidean x100. Categorical palettes were run through the `dataviz` skill validator (`scripts/validate_palette.js`, Machado 2009 CVD simulation, severity 1.0). Commands and verbatim results are in section 17.

No `.tsx`, `.css`, `.html` or `tailwind.config.js` was edited to produce this file.

---

## 0. Read this first

### 0.1 The direction in one paragraph

A business owner opens BrandGEO once a week. Every route answers one question with **one sentence and one number** at the top, on a quiet neutral canvas that is the same canvas as getbrandgeo.com. Everything else waits behind a disclosure or below the fold. Cards separate by elevation (a soft shadow and a hairline ring), not by drawn outlines. Colour is spent on three things only: the violet accent (actions and selection), engine identity (in charts and swatches), and status (as a small pill with a glyph and a word, never as a coloured headline number). Type is Inter at six sizes, weight capped at 600.

### 0.2 What is already true, so it is not rebuilt (measured, not inherited)

Several items in the `CLAUDE.md` "Product quality" backlog are **stale**. They were fixed by the 2026-07-27 `dashboard-visual-system.md` build and are live in the code read today:

| Backlog claim | Today, measured | Verdict |
|---|---|---|
| Side panel vs canvas 1.07:1 | Sidebar now `--surface-nav` `#13152b` with a solid `--border-nav` `#64748b` divider: 3.77:1 against the nav, 4.14:1 against the proposed canvas `#0a0b0e`; light 4.00:1 / 4.46:1 | CLOSED, keep |
| Active nav tab 1.24:1 | `.nav-item.is-active`: fill 1.56:1 vs rail (dark), plus a 3px rail `#a78bfa` at 4.23:1 on the active fill and 6.60:1 on the nav, plus 600 weight; light rail `#7c3aed` 5.70:1 | CLOSED, keep |
| Time filter 1.39:1 | `.time-pill.is-pressed` border `#a78bfa` 6.75:1 on `#0d1425`; light `#7c3aed` 5.08:1 | CLOSED, keep (restyled in 7.2) |
| Claude `#f97316` vs Meta `#f59e0b` dE 9.6 | ENGINE_META now Claude `#ea580c`, Meta `#c026d3`: dE **29.4** | CLOSED |
| Grok `#94a3b8` fails chroma | Grok `#a16207`, OKLCH C **0.121** (was 0.035) | CLOSED |
| `#10b981` = ChatGPT AND Positive | ChatGPT `#16a34a`; Positive is `--sentiment-positive` lime. dE 15.7 dark, 18.9 light | CLOSED |
| `#ef4444` = Google AI Mode AND Negative | Google AI `#db2777`; Negative `--sentiment-negative`. dE 14.3 dark, 15.1 light (sentiment floor is 8, J3 of the prior spec) | CLOSED |
| `Competitors.tsx` has its own palette | Still true: `COMPETITOR_SERIES_COLORS`, 8 hues, cycled. Validator: **FAIL**, worst pair dE 2.9 deutan | OPEN, fixed in 9.4 |
| Zero-data tenant sees 0% verdicts; `/sentiment` dead end | Partly fixed (`EmptyState.tsx` exists); Overview and AI Visibility still render a verdict label before data | OPEN, fixed in section 11 |
| Light mode on 92 `!important` overrides | Still true (`index.css:146-333`, `:388-513`, `:582-617`) | OPEN, fixed in section 4 |

`docs/DESIGN-SYSTEM.md` section 1 still lists the July engine hexes and is stale on the same point. Correction is amendment D-1 in section 15.

### 0.3 HUMAN CHECKPOINT (build waits on these)

Per my brief I stop the build at any palette change, any new token, and any change to what a paying customer sees on load. Six items need Constantin's word. Each has a default.

| # | Decision | Default if he says "go" |
|---|---|---|
| CP1 | Canvas and card surfaces move from navy slate (`#0a0f1e` / `#0f172a`) to the marketing site's neutral (`#0a0b0e` / `#121318`), light from `#f7f7fb` to `#f7f7fc`. Every customer sees it on next load. | Yes |
| CP2 | 23 new semantic tokens (amendments A-1 to A-23, section 4) with light pairs; three light status values move one Tailwind step darker (ok `#065f46`, warn `#92400e`, bad `#991b1b`). | Yes |
| CP3 | `text-white` becomes theme ink. Dark primary text softens from `#ffffff` to `#e8e9ed` (the marketing `--t`, chosen there against halation). | Yes |
| CP4 | Mobile bottom nav goes from 7 truncated items ("Overv...", "Comp...", "Reco...") to 4 items plus "More". | Yes, labels per 7.3, bg-copy may rename |
| CP5 | Competitor trend chart shows you plus the top 2 competitors (was up to 8, colours cycled). The full field stays in the table. | Yes |
| CP6 | Prompt category tags (Mid, Large, Very Large, General) lose their blue / purple / grey hue coding and become one neutral tag. | Yes |

No new npm dependency is proposed. No motion library change (Motion v12 already ships). No webfont is added: Inter is already loaded and is the marketing body face.

### 0.4 Non-design findings recorded, not fixed here

1. **Mojibake in demo data.** Romanian diacritics render as `BucureÅti`, `RomÃ¢nia` on every list route in both themes. Source is `src/lib/mockData.ts` encoding (UTF-8 read as Latin-1). Not a design matter; owner bg-app, one-line fix in the file's encoding.
2. **`/sentiment` demo feed contradiction.** The page states 10 positive mentions, then the signals filter reads "All (0)" and "No signals match this filter" (`sentiment-desktop-dark.png`). Data or filter bug, owner bg-app with bg-verify.
3. **`/prompts` demo reads "24 of 5 prompts used on Free".** Demo fixture vs plan limit mismatch. The design in 10.7 renders it honestly as over limit; the fixture is bg-app's.
4. **`/competitors` "Your brand: No sample prompt".** The tenant row never gets a sample prompt. Data, not design.

---

## 1. The one thing

**On every route, the first thing the user reads is one plain sentence that answers that route's question, carried by one large number; everything else on the page yields to that sentence and waits until the user asks for it.**

---

## 2. The 10-second test

> After 10 seconds on any of the seven routes, a first-time business owner can say, without scrolling and without hovering: **"I am on <page>, the answer is <sentence>, and the number that matters is <N>."**

Falsifiable: at 1440x900 and at 390x844, in both themes, the h1, the hero sentence and the hero number are all inside the first viewport, and nothing above them is larger than the hero number.

### 2.1 Current result, per route

| Route | Result | Where and why |
|---|---|---|
| `/` Overview | **PARTIAL** | Score 72 lands (`overview-desktop-dark.png`), but there is no sentence: "Here's your AI visibility snapshot." says nothing. Six equal dimension numbers compete with it. Mention rate is painted amber at the same weight as the score, so the eye splits (`Dashboard.tsx` KPI block). |
| `/ai-visibility` | **FAIL** | The best sentence in the product, "Your brand is recommended in 9 of 20 prompts, best on Gemini (#2).", sits at y=784 of 3034 (`ai-visibility-desktop-dark.png`), below the score card, the engine strip, the locked strip and the whole Fix This list. Page is 3034px desktop, over 6000px at 390. |
| `/sentiment` | **FAIL** | Four equal KPI cards (100/100, 10, 0, 0) plus a full-width bar that says the same thing a third time. The vertical chart's y-axis labels are clipped to ")%", "5%", "0%" (`sentiment-desktop-*.png`, both mobile shots). |
| `/mentions` | **PARTIAL** | Three equal stats, then two rows of 9 category chips before the first mention. No sentence. Content frame is 960px while Overview is 1152px, so the page jumps sideways between routes. |
| `/competitors` | **FAIL** | Four equal stat cards; "Top competitor" is painted red as if it were an error. Bar chart labels truncate ("Lantern T...") and collide at 390 ("Your brandLantern T..Cedar & A.."). Y-axis clipped. |
| `/recommendations` | **FAIL** | The page title badge "2 actions" collides with Refresh at 390 (`recommendations-mobile-*.png`). The first thing under the title is an engine card, then competitor chips, then a red alarm box, then an AI analysis prompt; the actions themselves start at y=612. |
| `/prompts` | **PARTIAL** | The list is clean, but the over-limit state is a full-width amber banner louder than the title, and row actions are invisible on desktop until hover. |

### 2.2 Pass condition

The test passes when, on all seven routes, the HeroAnswer block (section 6.4) is the first block after the PageHeader, is fully inside the first viewport at 390x844 and 1440x900, and every element above the fold belongs to the reading order in section 5.4.

---

## 3. Shared spine with getbrandgeo.com

Marketing and dashboard may differ in density and register, never in brand tokens. The spine, stated explicitly:

| Spine element | Marketing (`brandgeo/web/index.html`) | Dashboard after this spec |
|---|---|---|
| Canvas | `--bg` `#0a0b0e` / `#f7f7fc` | `--canvas` same values |
| Card | `--s` `#101116` / `#ffffff` | `--surface-1` `#121318` / `#ffffff` (one step lighter in dark so elevation reads without an outline) |
| Primary ink | `--t` `#e8e9ed` / `#09090f` | `--ink` `#e8e9ed` / `#0b0b12` |
| Accent fill | `--ac` `#8b5cf6` / `#7c3aed` | `--accent` same |
| Button fill | `--ac-strong` `#7c3aed` / `#6d28d9` | `--accent-strong` same |
| Accent text | `--ac-text` `#a78bfa` / `#6d28d9` | `--accent-text` same |
| Radius | `--r` 12px | `--radius-card` 12px |
| Type | Inter 400/500/600, weight cap 600 | Inter, weight cap 600 |
| Focus | 2px solid accent, offset 2px | 2px solid `--rail-active`, offset 2px (unchanged) |
| Easing | `--ease-soft` `cubic-bezier(.22,1,.36,1)` | `--ease-out` `cubic-bezier(0.16,1,0.3,1)` kept (already shipped, near-identical curve) |

Where the dashboard differs on purpose: the nav rail is brand-tinted (`--surface-nav`, prior ruling: "the nav is the only brand-tinted surface"), the type ramp tops out at 56px for a number not a headline, and light status text is one step darker than marketing because the dashboard paints it on tinted chips (section 4.4).

---

## 4. Tokens

### 4.1 Mechanism: light mode by construction

Today light mode is `html.light .text-white { color: ... !important }` and 91 more rules like it. A new utility is unthemed until someone writes another override. This spec replaces that with three layers, all owned by Lane 1:

1. **Semantic CSS variables** in `src/index.css`, declared as space-separated RGB triplets in `:root` (dark) and `html.light` (light). Names in 4.2 to 4.6.
2. **Semantic Tailwind colours** in `tailwind.config.js` `theme.extend.colors`, each `rgb(var(--token) / <alpha-value>)`, so `bg-surface-1`, `text-ink-2`, `bg-accent/15` work and theme themselves.
3. **A legacy bridge** in `tailwind.config.js` using Tailwind's per-utility keys (`textColor`, `backgroundColor`, `borderColor`, `ringColor`, `divideColor`, `placeholderColor`, `fill`, `stroke`, `gradientColorStops`) so that every existing `text-slate-400`, `bg-emerald-500/10`, `text-red-300`, `bg-brand-500` in every file, including the routes outside this spec (Social, SEO, Account, Revenue, Tickets, affiliate, auth), resolves to a semantic variable. Mapping in 4.7. Text and fill get different variables for the same class family, which is exactly what the 92 overrides were doing by hand.

After layer 3, every `html.light .<utility>` rule and every `!important` utility remap in `index.css` is deleted. The only `!important` left is `.skip-link:focus { position: fixed !important }`, which defends layout, not colour, and is exempt by name (acceptance AC-12).

`tailwind.config.js` keeps `darkMode: 'class'` untouched; `ThemeProvider` keeps toggling `html.light`. No `dark:` variants are introduced.

### 4.2 Surfaces and lines (amendments A-1 to A-7)

| # | Token | Dark hex | Dark OKLCH | Light hex | Light OKLCH | Job |
|---|---|---|---|---|---|---|
| A-1 | `--canvas` | `#0a0b0e` | oklch(15.0% 0.007 271) | `#f7f7fc` | oklch(97.8% 0.007 286) | page background (`body`, `<main>`) |
| A-2 | `--surface-1` | `#121318` | oklch(18.8% 0.010 276) | `#ffffff` | oklch(100% 0 0) | cards, hero |
| A-3 | `--surface-2` | `#191a21` | oklch(22.0% 0.014 279) | `#f4f4fb` | oklch(96.9% 0.009 286) | inset inside a card: input fill, table head, quote block, tooltip |
| A-4 | `--surface-3` | `#22232c` | oklch(25.9% 0.017 280) | `#ececf5` | oklch(94.6% 0.012 286) | hover row, skeleton block, segmented track |
| A-5 | `--line` | `#25262e` | oklch(27.1% 0.015 280) | `#e4e4ec` | oklch(92.1% 0.011 286) | decorative hairline: row dividers, chart grid. Never a component boundary. |
| A-6 | `--line-strong` | `#6b7080` | oklch(54.7% 0.026 272) | `#767685` | oklch(57.1% 0.023 286) | component boundary that must clear 3:1: inputs, secondary buttons, unselected checkbox |
| A-7 | `--scrim` | `#000000` at 60% | | `#0b0b12` at 40% | | modal and drawer backdrop |

Legacy aliases, kept so nothing breaks, redefined to read the new values (Lane 1, `index.css`):

| Legacy var | Now reads | Note |
|---|---|---|
| `--dark-900` | `--canvas` | |
| `--dark-800` | `--surface-1` | |
| `--dark-700` | dark `35 36 43` (`#23242b`, marketing `--bd`), light `228 228 236` | used both as border and as raised fill today; one value that works as both |
| `--dark-600` | dark `50 51 60` (`#32333c`, marketing `--bd2`), light `207 207 218` (`#cfcfda`, marketing light `--bd2`) | |
| `--text-base` | `--ink` | |
| `--text-secondary` | `--ink-2` | |

Shell tokens `--surface-nav`, `--border-nav`, `--surface-nav-active`, `--text-nav-active`, `--text-nav-idle`, `--rail-active` are **unchanged** (prior spec A1 to A6, measured in 0.2). `--surface-bar` is retired by 7.2.

### 4.3 Ink and accent (amendments A-8 to A-15)

| # | Token | Dark hex | Dark OKLCH | Light hex | Light OKLCH | Job |
|---|---|---|---|---|---|---|
| A-8 | `--ink` | `#e8e9ed` | oklch(93.4% 0.005 275) | `#0b0b12` | oklch(15.3% 0.015 285) | primary text, hero number |
| A-9 | `--ink-2` | `#a3a9b4` | oklch(73.3% 0.017 263) | `#4f4f5a` | oklch(43.2% 0.018 286) | secondary text, labels |
| A-10 | `--ink-3` | `#8a909c` | oklch(65.2% 0.019 264) | `#62626d` | oklch(50.0% 0.017 286) | captions, axis ticks, timestamps. Floor of the text ramp. |
| A-11 | `--accent` | `#8b5cf6` | oklch(60.6% 0.219 293) | `#7c3aed` | oklch(54.1% 0.247 293) | decorative accent fill: ring stroke, "you" series, progress fill. Never text, never a button fill with text. |
| A-12 | `--accent-strong` | `#7c3aed` | oklch(54.1% 0.247 293) | `#6d28d9` | oklch(49.1% 0.241 293) | primary button fill, selected solid chip |
| A-13 | `--accent-hover` | `#6d28d9` | oklch(49.1% 0.241 293) | `#5b21b6` | oklch(43.2% 0.211 293) | primary button hover (darken, never lighten) |
| A-14 | `--accent-text` | `#a78bfa` | oklch(70.9% 0.159 294) | `#6d28d9` | oklch(49.1% 0.241 293) | links, tertiary buttons, accent labels |
| A-15 | `--accent-soft` | `#1f1a33` | oklch(23.7% 0.047 292) | `#efeafd` | oklch(94.7% 0.026 298) | selected chip fill, active filter fill. Solid, not alpha. |
| | `--on-accent` | `#ffffff` | oklch(100% 0 0) | `#ffffff` | | text and icons on `--accent-strong`, `--accent-hover`, `--bad-fill` |

Every value here is either an existing marketing token or an existing Tailwind violet step. Hue stays 293 on every accent token. No teal anywhere.

### 4.4 Status (amendments A-16 to A-21)

Status is reserved: good, warning, bad. It ships as a pill with a glyph and a word (section 8.4), never as colour alone and never as the colour of a headline number.

| # | Token | Dark hex | Dark OKLCH | Light hex | Light OKLCH | Job |
|---|---|---|---|---|---|---|
| A-16 | `--ok` | `#34d399` | oklch(77.3% 0.153 163) | `#065f46` | oklch(43.2% 0.086 167) | status text and glyph, good |
| A-17 | `--ok-fill` | `#10b981` | oklch(69.6% 0.149 162) | `#059669` | oklch(59.6% 0.127 163) | tints (`/12`), progress fill. Never carries text. |
| A-18 | `--warn` | `#fbbf24` | oklch(83.7% 0.164 84) | `#92400e` | oklch(47.3% 0.125 46) | status text and glyph, warning |
| A-19 | `--warn-fill` | `#f59e0b` | oklch(76.9% 0.165 70) | `#d97706` | oklch(66.6% 0.157 58) | tints, progress fill. Never carries text. |
| A-20 | `--bad` | `#f87171` | oklch(71.1% 0.166 22) | `#991b1b` | oklch(44.4% 0.161 27) | status text and glyph, bad, error, destructive text |
| A-21 | `--bad-fill` | `#dc2626` | oklch(57.7% 0.215 27) | `#b91c1c` | oklch(50.5% 0.190 28) | tints, destructive solid button (with `--on-accent`) |

Why light status text sits on the 800 step: the measured worst case is text on its own tint at the heaviest alpha the codebase uses (`/25`) over `--canvas`. On the 700 step that fails for ok (4.30 at `/20`), cyan (4.22), orange (4.05), teal (4.32), pink (4.12 at `/25`) and red (3.93 at `/25`). On the 800 step every one clears: ok 5.70, warn 5.12, bad 5.05 (worst cases, full table 13.1). Marketing keeps its 700 values because it never paints status text on a tint.

Sentiment tokens (`--sentiment-positive`, `-neutral`, `-negative`) are **unchanged** in both themes (prior spec 8.5). They fill marks and dots only; sentiment text wears ink tokens.

### 4.5 Elevation (amendments A-22, A-23)

Two helper triplets carry the shadow ink so no shadow literal appears in a component:

| # | Token | Dark | Light |
|---|---|---|---|
| A-22 | `--shadow-ink` | `0 0 0` | `11 11 18` |
| A-23 | `--ring-ink` | `255 255 255` | `11 11 18` |

| Level | Name | Dark value | Light value | Used by |
|---|---|---|---|---|
| e0 | flat | none | none | sections that sit on the canvas (page header, hero sentence on mobile) |
| e1 | card | `0 0 0 1px rgb(var(--ring-ink)/.06), inset 0 1px 0 rgb(var(--ring-ink)/.04), 0 1px 2px rgb(var(--shadow-ink)/.40)` | `0 0 0 1px rgb(var(--ring-ink)/.06), 0 1px 2px rgb(var(--shadow-ink)/.04), 0 4px 12px rgb(var(--shadow-ink)/.05)` | every Card |
| e2 | raised | `0 0 0 1px rgb(var(--ring-ink)/.08), inset 0 1px 0 rgb(var(--ring-ink)/.05), 0 8px 24px rgb(var(--shadow-ink)/.45)` | `0 0 0 1px rgb(var(--ring-ink)/.06), 0 2px 4px rgb(var(--shadow-ink)/.04), 0 12px 32px rgb(var(--shadow-ink)/.08)` | HeroAnswer card, hovered clickable card, tooltip |
| e3 | overlay | `0 0 0 1px rgb(var(--ring-ink)/.10), 0 16px 48px rgb(var(--shadow-ink)/.60)` | `0 0 0 1px rgb(var(--ring-ink)/.08), 0 24px 64px rgb(var(--shadow-ink)/.16)` | menus, popovers, modals, mobile drawer |

Tailwind: `boxShadow: { e1: 'var(--elev-1)', e2: 'var(--elev-2)', e3: 'var(--elev-3)' }`, with `--elev-*` declared per theme in `index.css`. The auto-elevation selectors `.bg-dark-800.border.border-dark-700` and `.bg-dark-800.rounded-xl/.rounded-card` are **kept** (they elevate every out-of-scope card for free) but rewritten to `box-shadow: var(--elev-1)` with no `!important` and no `html.light` twin.

The 1px ring at 6% is decorative geometry, not a WCAG boundary; cards are not interactive components. Card vs canvas is 1.06:1 dark and 1.07:1 light by luminance, the same ratio Linear and the marketing site run; the separation is carried by the ring and the shadow, which is the "elevation instead of outlines" brief.

### 4.6 Type, space, radius

**Type scale.** Inter (already loaded), `font-feature-settings: 'cv01','ss03','zero'` (kept), `font-variant-numeric: tabular-nums` on every number. Weight cap 600. Six roles at desktop:

| Role | Tailwind name (Lane 1 adds to `fontSize`) | Size / line | Weight | Tracking | Mobile (<768) |
|---|---|---|---|---|---|
| Hero number | `text-hero` | 56 / 56 | 600 | -0.03em | 44 / 44 |
| Page title (h1) | `text-title` | 24 / 32 | 600 | -0.015em | 22 / 30 |
| Hero answer | `text-answer` | 20 / 30 | 500 | -0.01em | 18 / 27 |
| Section (h2) | `text-section` | 16 / 24 | 600 | 0 | same |
| Stat value | `text-stat` | 28 / 32 | 600 | -0.02em | 24 / 28 |
| Body | `text-body` | 14 / 22 | 400 | 0 | same |
| Prose (recommendation text, AI analysis) | `text-prose` | 15 / 24 | 400 | 0 | same |
| Label | `text-label` | 12 / 16 | 500 | 0.01em, **sentence case** | same |

Seven names, six sizes (16 and 15 sit together but have different jobs). The floor is 12px. The only exception is the mobile bottom-nav label at 11px / 600. Uppercase tracked labels ("RECOGNITION", "AI MENTION COUNT", "OVERALL BREAKDOWN") are retired: sentence case at 12/500 `--ink-2` reads quieter and loses nothing. `StatLabel` in `Typography.tsx` changes accordingly.

**Space.** 4px base, Tailwind default steps only, with these semantic uses:

| Use | Value at 390 | at 768 | at 1280+ |
|---|---|---|---|
| Page gutter | 16 | 24 | 40 |
| Gap between page blocks | 24 | 32 | 40 |
| Card padding | 20 | 24 | 24 |
| Hero card padding | 20 | 32 | 32 |
| Gap inside a card | 16 | 16 | 16 |
| Grid gap | 12 | 16 | 24 |

Lane 1 replaces `--card-pad-compact/standard/feature` with `--pad-card` (20 / 24) and `--pad-hero` (20 / 32) in `index.css`, and keeps the old `p-card-*` utilities pointing at the new values until no call site remains.

**Radius.** `--radius-card` 12px (= marketing `--r`), `--radius-hero` 16px, `--radius-control` 8px, `--radius-pill` 9999px. `rounded-card` and `rounded-control` keep their names.

**Page frames.** Two widths, one per job, replacing today's five (`max-w-4xl`, `5xl`, `6xl`, `7xl`, mixed paddings):

| Frame | Max width | Routes |
|---|---|---|
| `frame-wide` | 1200px (= marketing `.wrap`) | `/`, `/ai-visibility`, `/sentiment`, `/competitors` |
| `frame-read` | 960px | `/mentions`, `/recommendations`, `/prompts` |

Both left-aligned to the same x within `<main>` at 1280+ (`margin-inline: auto` inside a `max-width: 1200px` outer wrapper with the read frame `margin-inline-start: 0`), so the h1 never jumps sideways between routes. Today it jumps between x=304, 312, 368 and 432 (`*-desktop-dark.png`).

### 4.7 The legacy bridge (Lane 1, `tailwind.config.js`)

Text and fill take different variables for the same family. All values below are existing Tailwind steps or the tokens above; nothing is invented.

| Family | `textColor` / `placeholderColor` steps 50 to 900 | `backgroundColor`, `borderColor`, `ringColor`, `divideColor`, `fill`, `stroke`, `gradientColorStops` steps 50 to 900 |
|---|---|---|
| `white` (textColor only) | `--ink` | unchanged (`#fff`, 3 call sites are logo plates and a toggle knob) |
| `slate` | 50 to 300 → `--ink`; 400 → `--ink-2`; 500 to 900 → `--ink-3` | bg: 50 to 300 → `--ink-3`, 400 to 500 → `--ink-3`, 600 → `--line-strong`, 700 → `--surface-3`, 800 → `--surface-2`, 900 to 950 → `--surface-1`. border: 400 to 600 → `--line-strong`, 700 to 950 → `--line` |
| `brand`, `violet`, `purple` | 50 to 400 → `--accent-text`; 500 to 900 → `--accent-text` | 50 to 200 → `--accent-soft`; 300 to 400 → `--accent-hover`; 500 → `--accent-strong`; 600 → `--accent-strong`; 700 to 950 → `--accent-hover`. ring: 300 to 600 → `--rail-active` |
| `emerald`, `green` | `--ok` | `--ok-fill` |
| `amber`, `yellow` | `--warn` | `--warn-fill` |
| `red`, `rose` | `--bad` | `--bad-fill` |
| `blue`, `sky`, `cyan`, `orange`, `pink`, `teal`, `indigo` | new per-family pair `--deco-<fam>-fg`: dark = family-300, light = family-800 | `--deco-<fam>-fill`: dark = family-500, light = family-600 |

`bg-brand-400` mapping to `--accent-hover` is deliberate: every `hover:bg-brand-400` in the app (13 call sites outside these routes) becomes a darken-on-hover by construction, which is what the `!important` rule at `index.css:234` did by hand. `bg-brand-500` mapping to `--accent-strong` makes every legacy primary button 5.70:1 / 7.10:1 with white text, which is what `index.css:233` did by hand.

Decorative family values, both themes (13.1 has their contrast on tints):

| Family | dark fg (300) | light fg (800) | dark fill (500) | light fill (600) |
|---|---|---|---|---|
| blue | `#93c5fd` | `#1e40af` | `#3b82f6` | `#2563eb` |
| sky | `#7dd3fc` | `#075985` | `#0ea5e9` | `#0284c7` |
| cyan | `#67e8f9` | `#155e75` | `#06b6d4` | `#0891b2` |
| orange | `#fdba74` | `#9a3412` | `#f97316` | `#ea580c` |
| pink | `#f9a8d4` | `#9d174d` | `#ec4899` | `#db2777` |
| teal | `#5eead4` | `#115e59` | `#14b8a6` | `#0d9488` |
| indigo | `#a5b4fc` | `#3730a3` | `#6366f1` | `#4f46e5` |

**The one thing the bridge cannot do:** `text-white` on a solid accent or status fill must stay white, and the bridge turns it into ink. Measured consequence if missed: ink on `--accent-strong` is 4.70:1 dark (passes by 0.2) and **2.76:1 light (fails)**. So the 40 call sites that put `text-white` on a solid fill (grep in section 17, V7) migrate to `text-on-accent` in the same build. Lane 1 owns the ones in `src/components/` and `App.tsx`; Lane 2 owns the ones in `src/pages/`. AC-13 is the grep that proves zero remain.

Bridge lifetime: it stays until a grep finds zero legacy family classes in `src/`. That is a later cleanup, not this build.

---

## 5. Layout

### 5.1 Grid and breakpoints

| Breakpoint | Shell | Content columns | Notes |
|---|---|---|---|
| 390 (base) | top bar 56px, bottom nav 64px + safe area, sidebar is a drawer | 1 column, 16px gutter | no horizontal scroll, ever (AC-15) |
| 768 (`md`) | sidebar 248px fixed | 6-column grid, 24px gutter | hero splits ring / sentence |
| 1280 (`xl`) | sidebar 248px | 12-column grid inside `frame-wide`, 40px gutter | |
| 1440 | same as 1280 | frame caps at 1200px | extra width becomes canvas, never stretched cards |

### 5.2 Bento sizing encodes importance

One rule: **the hero spans the full frame; nothing else is ever as tall as the hero or as wide in the same row.** Ratios at 1280:

| Tile | Columns of 12 | Height | Ratio vs hero area |
|---|---|---|---|
| HeroAnswer | 12 | 220 to 260px | 1.0 |
| Secondary block (chart, list) | 12 or 7 + 5 | content | about 0.5 |
| Stat | 3 (four in a row) inside one card, no card per stat | 96px | 0.1 each |

Four stats live inside one card with no dividers between them (today `overview-desktop-dark.png` already does this for Key metrics; `/sentiment`, `/mentions`, `/competitors` give each stat its own outlined card, which is what makes them read as four equal claims).

### 5.3 Element budget per route (maximum 9, target 6)

| Route | Blocks in reading order | Count |
|---|---|---|
| `/` | PageHeader, HeroAnswer (ring + sentence + dimensions), Next action, Key metrics, Disclosure "Engine breakdown and recent activity" | 5 |
| `/ai-visibility` | PageHeader, HeroAnswer, Engines strip, Fix This (top 3), Prompts (toolbar + "Where you appear"), Disclosure "Not appearing yet", Disclosure "Could not be checked", Disclosure "Competitors and categories" | 8 |
| `/sentiment` | PageHeader, HeroAnswer (score + split bar), Sentiment by engine, Trend, Signals | 5 |
| `/mentions` | PageHeader, HeroAnswer, Filter row, Mentions list | 4 |
| `/competitors` | PageHeader, HeroAnswer, Share of mentions, Competitor table, Disclosure "By engine and over time", Your tracked competitors | 6 |
| `/recommendations` | PageHeader, HeroAnswer, Priority actions, AI analysis, Disclosure "Who AI names instead" | 5 |
| `/prompts` | PageHeader (with allowance), Limit notice (only when at or over limit), Filter row, Prompt list | 4 |

### 5.4 Reading order (all routes)

1. h1 page title (and the time range control where the route has one, right-aligned on the same line).
2. HeroAnswer: number, then sentence, then context line.
3. The one action the hero implies (if any).
4. The block that explains the number.
5. Everything else, behind disclosures, in descending decision value.

DOM order equals visual order at every breakpoint (no CSS `order` reshuffles), so a screen reader hears the same sequence.

---

## 6. Component anatomy (Lane 1 builds, Lane 2 consumes)

All new primitives live in `src/components/ui/`. Existing shared components keep their paths and are restyled in place.

### 6.1 `Card`

```
<Card as="section" tone="default|inset" pad="default|hero" interactive?>
```
- `default`: `bg-surface-1 rounded-card shadow-e1`, padding `--pad-card`. No `border` class.
- `hero`: `rounded-[16px] shadow-e2`, padding `--pad-hero`.
- `inset`: `bg-surface-2 rounded-control`, no shadow, padding 16. For quote blocks ("Why this matters"), table heads, recommended-fix boxes.
- `interactive`: adds hover e1 → e2 and `translateY(-2px)` (motion 12.4). Only for cards that navigate or expand. Static cards never lift (today every MotionCard lifts, which reads as noise on non-clickable stats).
- A Card may carry an optional header row: `SectionHeader` left, actions right.

### 6.2 `Button`

| Variant | Fill | Text | Boundary | Height | Use |
|---|---|---|---|---|---|
| `primary` | `bg-accent-strong`, hover `bg-accent-hover` | `text-on-accent` 14/20 600 | none (fill is the boundary: `--accent-strong` vs `--surface-1` 3.26:1 dark, 7.10:1 light; 13.2) | 40 (36 `sm`) | one per view: Run collection, Generate insights, empty-state CTA |
| `secondary` | `bg-surface-2`, hover `bg-surface-3` | `text-ink` 14/20 500 | `ring-1 ring-inset ring-line-strong` (3.51:1 dark on s2, 4.08:1 light) | 40 / 36 | Refresh, Reload, Export CSV, Add prompt |
| `tertiary` | none | `text-accent-text` 14/20 500, underline on hover | none (text identifies it) | 36 | "View full breakdown", "Show all 12 actions" |
| `danger` | `bg-bad-fill` | `text-on-accent` | none | 40 | confirm delete or archive only |

Icon-only buttons: 36x36 visible, 44x44 hit area below 768 (`after:absolute after:-inset-1`), `aria-label` required, `secondary` styling. Spinner: `Loader2` 16px `animate-spin` replaces the leading icon, label stays (no width jump).

### 6.3 `Badge` family

| Component | Anatomy | Tokens |
|---|---|---|
| `StatusPill tone="ok|warn|bad|neutral"` | glyph 12px + word, h 22, px 8, radius pill, 12/16 500 | bg `<tone>-fill/12` (neutral: `surface-3`), text and glyph `<tone>` (neutral: `ink-2`). Glyphs: ok `CircleCheck`, warn `TriangleAlert`, bad `CircleX`, neutral `Circle` |
| `CountBadge` | number only, h 20, px 6, 12/16 600 tabular | `bg-surface-3 text-ink-2` |
| `Tag` (replaces coloured category badges, CP6) | text only, h 20, px 8, radius 6, 12/16 500 | `bg-surface-2 text-ink-2` |
| `PriorityTag` (P1, P2 on Fix This) | text only | P1: `bg-accent-soft text-accent-text`; P2: `Tag` |
| `EngineChip` (exists) | 8px swatch in `ENGINE_META[id].chartColor` + name | idle `text-ink-2`; selected per `Segmented` below. Keep `hexToRgba` only for the swatch ring. |

### 6.4 `HeroAnswer` (new, the core of this direction)

```
desktop (md+), inside Card pad="hero":
+-------------------------------------------------------------------+
| [visual 160x160, optional: score ring]  | NUMBER  unit   [Status] |
|                                          | Answer sentence, max 56ch|
|                                          | Context line (ink-3)     |
|                                          | [primary action]  [link] |
+-------------------------------------------------------------------+

mobile (<768): visual on top centred at 136x136, then number + pill,
sentence, context line, action full width.
```

Props: `value` (string, already formatted), `unit?`, `status?` (`StatusPill` props), `answer` (ReactNode), `context?`, `visual?`, `action?`, `secondaryAction?`, `loading`, `empty?` (`EmptyState` props, renders instead of the number when there is no data).

- Number: `text-hero text-ink tabular-nums`. **Always ink.** Never status-coloured (today `48%` is amber, `100` is lime, `10` is violet: three meanings of colour on three routes).
- Unit: 24/24 500 `text-ink-2`, baseline-aligned (`%`, `/100`, `of 20`).
- Answer: `text-answer text-ink`, `max-w-[56ch]`, wraps, never truncates.
- Context: `text-label text-ink-3`, carries window and freshness ("Last 7 days, checked 1 Jul").
- If `visual` is a ring, the ring carries the number inside it and the right column starts with the answer (the number is not printed twice).

### 6.5 `Stat`

```
[icon 14 ink-3]  Label (text-label ink-2)
VALUE (text-stat ink tabular)   [StatusPill or TrendDelta]
qualifier (text-label ink-3)
[sparkline 32px, optional]
```
No card of its own. Groups of 2 to 4 sit inside one `Card` in a grid (`grid-cols-2 xl:grid-cols-4`, gap 24, no dividers). Sparkline: Recharts `Line`, stroke `--ink-3` at 1.5px, `dot={false}`, no axes, `isAnimationActive` per 12.6. Status lives in the pill beside the value, which ends the amber `48%`.

### 6.6 `SectionHeader`

`<h2>` in `text-section text-ink`, optional `CountBadge` after it, optional description in `text-body text-ink-2` below (one line, 8px gap), actions right-aligned. Replaces `SectionHeading` and every uppercase card title. `Typography.tsx` keeps exporting `SectionHeading` as an alias for one release.

### 6.7 `PageHeader`

`h1` (`text-title text-ink`), optional `CountBadge`, optional subtitle (`text-body text-ink-2`, one line, omitted when the HeroAnswer says the same thing), actions right. Below 768 the actions drop to their own row under the title, full width if one action, a 2-column grid if two. This is the fix for `recommendations-mobile-*.png`, where "2 actions" sits under "Refresh". Title never truncates; it wraps.

### 6.8 `Segmented` (filter chips, W/M/Q, time range, sort)

| State | Fill | Text | Boundary |
|---|---|---|---|
| idle | none | `text-ink-2` 13/20 500 | none (text identifies the option) |
| hover | `bg-surface-3` | `text-ink` | none |
| selected | `bg-accent-soft` | `text-ink` 600 | `ring-1 ring-inset ring-accent-text`: 6.15:1 dark / 6.04:1 light on its own fill, 6.82:1 / 7.10:1 on the card |
| focus-visible | + 2px `--rail-active` outline, offset 2 | | |

Height 32, hit area 44 below 768, padding 0 12, radius pill, gap 4. One row; when it overflows at 390 it scrolls horizontally **inside its own container** with a 16px fade mask at the right edge, never wrapping into a second and third row (today the Mentions category chips wrap to three rows at 390). `role="radiogroup"` for single choice, `aria-pressed` for multi. Selected and idle differ by fill, text weight and a 3:1+ ring, so state is never colour alone.

### 6.9 `Input` and `Select`

h 40, `bg-surface-2`, `ring-1 ring-inset ring-line-strong`, radius 8, text `text-body text-ink`, placeholder `text-ink-3` (5.41:1 dark on s2, 5.50:1 light). Focus: ring becomes 2px `--rail-active`. `Select` is a native `<select>` with the same skin (used for the category filter on `/mentions` below 768).

### 6.10 `Disclosure` (restyle of `Collapse.tsx` plus a trigger)

Trigger is a full-width row: `SectionHeader` title + `CountBadge` + one-line summary in `text-ink-3` + chevron 16 `text-ink-3`, min height 48, `aria-expanded`, `aria-controls`. Collapsed state shows the summary, so the user knows what is inside without opening it ("11 prompts, 0 of 11 engines named you").

### 6.11 `DataList` (rows, replacing `div` grids and row-cards)

Rows on one card, separated by `--line` hairlines (`divide-y divide-line`), not one card per row. Row padding 12 / 16, min height 56, hover `bg-surface-2`. Leading slot, title (`text-body text-ink`, wraps to 2 lines then clamps with full text in `title` and on expand), meta line (`text-label text-ink-3`), trailing slot. Row actions are **always present** at `text-ink-3` and brighten to `text-ink` on row hover or focus-within, so they are reachable by keyboard and touch (fixes hover-only actions on `/prompts` desktop and the Competitors delete button, blueprint U5). When a list is tabular data with column headers, render a real `<table>` with `<th scope="col">` on md+ and the DataList row layout below 768.

### 6.12 `EmptyState` (exists, restyled)

Icon tile 40x40 `bg-surface-3 rounded-full`, icon `text-ink-3`; title `text-section text-ink`; body `text-body text-ink-2 max-w-[44ch]`; one `Button` (primary when it is the page's only action, secondary otherwise). `tone="error"` swaps the tile to `bg-bad-fill/12`, icon `text-bad`, and the button to Retry. Keep the `minHeight` prop.

### 6.13 Skeletons

`Skeleton` block: `bg-surface-3 rounded-[6px]`. New compositions in `src/components/ui/skeletons.tsx`, each the exact box of its final component so nothing reflows:

| Skeleton | Shape |
|---|---|
| `SkeletonHero` | Card hero; 136/160 circle; 2 lines at 56px and 2 at 20px |
| `SkeletonStatGroup n` | Card; n columns of label 12px x 40%, value 28px x 60% |
| `SkeletonList rows` | Card; rows of 56px with leading 32px square and two text bars |
| `SkeletonChart h` | Card; header bar 16px x 30%, plot block at height h |

`RouteSkeleton.tsx` becomes `PageHeader` bar + `SkeletonHero` + `SkeletonStatGroup 4`, which is the first screen of four of the seven routes.

### 6.14 `TimeRangeControl` (Lane 1, used by Layout)

A `Segmented` with the four existing options (7 days, 30 days, 90 days, All time). The caption to its left ("Trends and activity", "Trends and signals", "Trend") is removed: it varies per route and names nothing. The control alone says what it does; its accessible name is `aria-label="Time range"` (copy placeholder `[label: time range]`, bg-copy).

---

## 7. Shell (`Layout.tsx`, Lane 1)

### 7.1 Sidebar

Keep the structure, tokens and states shipped by the prior spec (0.2). Changes:

1. Group headers "INSIGHTS / STRATEGY / MANAGE": sentence case ("Insights"), `text-label text-ink-3`, 600, no tracking. 5.60:1 dark, 5.07:1 light on the nav.
2. "COLLECTION MARKET" block: same treatment; the uppercase heading becomes "Collection market".
3. Width 248px (was 256); nav item min height 40 (44 below 768), unchanged.
4. Locked items (AI Social, AI SEO): lock icon `text-ink-3` 14px, label stays `text-nav-idle`. Unchanged meaning.

### 7.2 Time range strip

Today: a 48px bar with its own fill (`--surface-bar`) and a bottom border across the whole canvas on three routes, with a different caption on each (`overview-desktop-dark.png`, `sentiment-*`, `competitors-*`). It is the most "admin panel" element on screen.

New: no bar. `TimeRangeControl` renders inside the page frame, right-aligned on the h1 row at md+, and as its own full-width row under the h1 below 768 (inside the `Segmented` scroll container). Layout passes it through a `headerSlot` context that `PageHeader` reads, so pages do not import it and the three-route allowlist stays in `Layout.tsx` (`TIME_FILTER_ROUTES`). `--surface-bar` and `.time-pill` are removed once nothing references them.

### 7.3 Mobile bottom nav (CP4)

7 items at 390 truncate to "Overv...", "Comp...", "Reco...", "Prom..." (`overview-mobile-dark.png`). New: 5 slots, each 78px wide, label never truncated.

| Slot | Destination | Label (copy placeholder for bg-copy) |
|---|---|---|
| 1 | `/` | `[label: Overview]` |
| 2 | `/ai-visibility` | `[label: Visibility]` |
| 3 | `/sentiment` | `[label: Sentiment]` |
| 4 | `/recommendations` | `[label: Actions]` |
| 5 | opens the existing drawer | `[label: More]` |

Mentions, Competitors and Prompts stay one tap away in the drawer, in sidebar order. Active state unchanged (top rail 3px `--rail-active`, ink label). Label 11/14 600. Bar `bg-surface-nav/95` with `backdrop-blur-sm`, top hairline `--line`.

### 7.4 Canvas and main

`<main>` background `--canvas`. The `.canvas-bleed` gradient is kept (it shades the canvas edge, contributes no ratio). The mobile top bar: 56px, `bg-canvas/90` with blur, hairline `--line` bottom.

---

## 8. Colour rules (both lanes)

### 8.1 What colour may do

1. **Accent** (`--accent*`): primary actions, selection, links, focus, the score ring, the "you" series. Nothing else.
2. **Engine** (`ENGINE_META[id].chartColor`, unchanged): chart marks and 8px swatches. Never text.
3. **Sentiment** (`--sentiment-*`, unchanged): sentiment marks and dots. Never text.
4. **Status** (`--ok/--warn/--bad`): `StatusPill`, inline glyphs, progress fills. Never a headline number, never a card border, never a full-width banner fill above the hero.
5. **Ink** for every number and every word.

### 8.2 The engine ramp: unchanged, re-validated on the new surfaces

ENGINE_META values stay exactly as shipped. Validator, adjacent pairs, 9 slots in `ALL_ENGINES` order, run on `#0a0b0e`, `#121318`, `#191a21`, `#ffffff`, `#f7f7fc`: identical result on all five, ALL CHECKS PASS, worst adjacent normal-vision dE **15.8** (`#c026d3` vs `#db2777`), worst adjacent CVD dE **6.5** deutan (`#6366f1` vs `#c026d3`, WARN band, legal with the secondary encoding the app already carries: logo + text label on every engine mark, legend on every multi-series chart). Live five under all-pairs: worst normal **15.4**, worst CVD **6.1** deutan (`#db2777` vs `#16a34a`), PASS with the same mitigation. Every engine hex clears 3:1 on every surface. Verbatim output in 17.

### 8.3 Competitor series: replaced (CP5)

The current `COMPETITOR_SERIES_COLORS` (8 hues, cycled past eight) fails the validator: dE **2.9** deutan (`#d6409f` vs `#1f9e89`), and `#e07b00` is outside the dark lightness band. Cycling also breaks "never cycled".

New, three slots only, moved to `chartTheme.ts` as `competitorSeries` and resolved per theme:

| Slot | Meaning | Dark | Light | Contrast dark s1 / canvas | Light s1 / canvas |
|---|---|---|---|---|---|
| 1 | You | `#8b5cf6` (`--accent`) | `#7c3aed` (`--accent`) | 4.38 / 4.65 | 5.70 / 5.34 |
| 2 | Top competitor | `#d97706` oklch(66.6% 0.157 58) | `#c2410c` oklch(55.3% 0.174 38) | 5.82 / 6.18 | 5.18 / 4.85 |
| 3 | Second competitor | `#0d9488` oklch(60.0% 0.104 185) | `#0d9488` | 4.95 / 5.26 | 3.74 / 3.51 |

Validator, `--pairs all` (lines cross, so every pair can touch): dark ALL CHECKS PASS, worst CVD **12.5** protan, worst normal **24.3**; light ALL CHECKS PASS, worst CVD **13.7** deutan, worst normal **27.1**. Competitors are assigned by rank at render time from the already-sorted list, top 2 only; colour follows the competitor for the life of the view (a range change re-ranks and may recolour, which is correct here because the slots mean "top" and "second", and the legend names them). The bar list in 10.5 uses one neutral hue for every competitor (nominal bars, one series, `--ink-3`), only "you" in accent.

Why not the brand-400 `#a78bfa` for "you": it sits at OKLCH L 0.709, outside the dark categorical band 0.48 to 0.67, and the validator fails it. `chartTheme.railActive` stays for non-series uses only.

### 8.4 Status pill, the only place status colour appears at size

| Tone | Dark: text on tint (12% over s1) | Light: text on tint (12% over s1) |
|---|---|---|
| ok | `#34d399` 8.14 | `#065f46` 6.63 |
| warn | `#fbbf24` 9.15 | `#92400e` 6.25 |
| bad | `#f87171` 6.22 | `#991b1b` 6.80 |

Each pill carries a glyph and a word, so polarity never rests on hue.

---

## 9. Charts (`chartTheme.ts`, Lane 1; usage, Lane 2)

### 9.1 Theme object

`chartTheme.ts` keeps its shape and adds keys; hex values equal the token table (Recharts presentation attributes cannot read `var()`):

| Key | Dark | Light | Source |
|---|---|---|---|
| `gridLine` | `#25262e` | `#e4e4ec` | `--line` |
| `axisInk` | `#8a909c` | `#62626d` | `--ink-3` (5.79 / 6.02 on s1) |
| `tooltipSurface` | `#191a21` | `#ffffff` | `--surface-2` / `--surface-1` |
| `tooltipBorder` | `#32333c` | `#cfcfda` | legacy `--dark-600` (decorative, e2 shadow carries the edge) |
| `tooltipInk` | `#e8e9ed` | `#0b0b12` | `--ink` |
| `cardSurface` | `#121318` | `#ffffff` | `--surface-1` (segment gaps, activeDot ring) |
| `brandSeries` (new) | `#8b5cf6` | `#7c3aed` | `--accent` |
| `competitorSeries` (new) | `['#d97706','#0d9488']` | `['#c2410c','#0d9488']` | 8.3 |
| `fieldSeries` (new) | `#8a909c` | `#62626d` | `--ink-3`, every non-you competitor bar |
| `sentiment*`, `railActive` | unchanged | unchanged | |

Lane 1 adds `src/lib/tokens.ts` exporting the same hex table for both themes and `tests/tokens_sync.test.js` that parses `index.css` and asserts every `chartTheme` and `tokens.ts` value equals its CSS triplet (the drift the July note at `chartTheme.ts:46-62` describes).

### 9.2 Shared props (helpers exported from `chartTheme.ts`)

- `gridProps`: `stroke={gridLine} strokeWidth={1} vertical={false}`.
- `axisProps`: `tick={{ fill: axisInk, fontSize: 12 }} axisLine={false} tickLine={false}`.
- `yPercentAxis`: `width={48} domain={[0,100]} ticks={[0,50,100]} tickFormatter={v => v + '%'}`. This is the clipped ")%" fix: today `width={40}` with a `%` unit loses the first glyph of "100%" (`sentiment-desktop-*.png`, `competitors-desktop-*.png`, both mobile shots).
- `barProps`: `radius={[4,4,0,0]}`, `maxBarSize={32}`, `stroke={cardSurface} strokeWidth={2}` (2px surface gap between adjacent bars).
- `lineProps`: `strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: cardSurface }}`.
- `tooltipProps`: `<ChartTooltip>` with `bg tooltipSurface`, `shadow-e2`, radius 8, padding 8 12, `text-label`.
- Category axis labels never truncate with an ellipsis mid-word in a chart; if labels do not fit, the chart is the wrong form and becomes a horizontal bar list (9.3).

### 9.3 When a chart becomes something else

| Condition | Replace with |
|---|---|
| One series, one category (e.g. one engine) | a sentence plus the number |
| Nominal categories with names longer than 10 characters, or more than 5 bars at 390 | horizontal bar list: name left (wraps), bar, value right, all direct-labelled, no axes |
| Proportions of a whole (sentiment split) | one 100% stacked horizontal bar, 12px tall, segments in fixed order positive, neutral, negative, 2px surface gaps, with a direct legend that carries counts and percents |
| Fewer than 3 time buckets | the existing "Not enough data yet" EmptyState, sized to the final chart height |
| Multi-series line | legend always present, plus a direct end-label on each line at 1280+ |

---

## 10. Pages (Lane 2), in priority order per route

Every route uses `PageHeader`, `HeroAnswer`, `Card` and the frame from 4.6. Every number comes from the value the page already computes (Phase 2 `metrics.ts`, `resultsContext`, `views/*`, guards are not touched). Sentences are `[answer: ...]` templates over existing values; bg-copy owns final wording, and until it rules, builders ship the template text verbatim with the slots filled. No template adds a claim the page does not already make.

### 10.1 Overview (`Dashboard.tsx`, `frame-wide`) fixes `overview-desktop-*`, `overview-mobile-*`

1. **Hero becomes HeroAnswer with the ring as its visual.** Number = the AI Visibility Score (inside the ring, 56px, ink). Status pill = the score label the page already derives (e.g. "Strong"). Answer = `[answer: Your brand is named in {mentionRate}% of AI answers checked in the {range} window.]` (mention rate is already on the page). Context = `[context: {totalChecks} checks, last checked {date}]`. Subtitle "Here's your AI visibility snapshot." is removed (the hero says it).
2. **The six dimensions** move under the sentence inside the hero, as a 3x2 (md+) or 2x3 (390) list: label `text-label text-ink-2`, value `text-section text-ink` 600, no uppercase. "View full breakdown" becomes a `tertiary` Button.
3. **What to do next** (exists, `Dashboard.tsx:372`) sits directly under the hero as one `Card interactive` showing the single top action title and one `tertiary` link. Not a list.
4. **Key metrics**: one Card, four `Stat`s. Mention rate value turns ink; its threshold colour becomes a `StatusPill` (ok at the same thresholds the code already uses, warn, bad). Avg position keeps its threshold pill per `DASHBOARD-UX-2026.md` 9.4. Sparklines in `--ink-3`.
5. **Disclosure** "Engine breakdown and recent activity" restyled as 6.10 with a summary line.
6. Ring gradient: `stop-color` from `--accent-text` to `--accent-strong` via `style={{ stopColor: 'rgb(var(--accent-text))' }}`; ring track `--surface-3`; ring number and `%` use `fill-ink` and `fill-ink-3` utilities. Deletes the raw hex at `Dashboard.tsx:316-317,340,349`.
7. Greeting h1 stays ("Good morning, {brand}") at `text-title`; Refresh is a `secondary` Button.

### 10.2 AI Visibility (`AIVisibility.tsx`, `frame-wide`) fixes `ai-visibility-desktop-*`, `ai-visibility-mobile-*`

1. **Move the existing sentence to the hero.** "Your brand is recommended in 9 of 20 prompts, best on Gemini (#2)." becomes the HeroAnswer answer. Number = the score in the ring, as on Overview, with the same pill and the same ring component (shared, Lane 1 `ScoreRing` in `src/components/ui/`). Context = "last checked {date}" (exists in the subtitle today). The subtitle line under the h1 is removed. Run collection (`primary`) and Reload (`secondary`) stay in PageHeader actions.
2. **Dimension bars** (Recognition 48%, Knowledge 62%...) stay in the hero as a 2-column list of label + value + 4px bar. Bar fill `--accent`, track `--surface-3`; values ink. Today they are 8px violet bars that read as six progress meters competing with the ring.
3. **Engines strip**: one Card. Active engine tiles (Gemini PARTIAL) as compact rows: logo, name, `48%` ink, `StatusPill warn "Partial"`, caption "10 of 21 prompts, best #2". Coming-soon engines (DeepSeek, Copilot) collapse into one line "Coming soon: DeepSeek, Copilot" in `text-ink-3`. Locked engines stay as the existing chip row under a "Locked on your plan" label, chips in `Tag` style with lock glyph. This removes the three empty-looking engine cards at y=258.
4. **Fix This**: Card with SectionHeader "Fix this" + `CountBadge 12`. Each item: `PriorityTag`, title `text-section`, one-line reason `text-body text-ink-2`, then the recommended fix in a `Card tone="inset"`. The amber left rule on P1 is removed; priority is the tag. Actions column: "Copy as AI prompt" `secondary sm`, "Mark as done" `secondary sm` with ok glyph, "Not for us" `tertiary`. Shows 3, then "Show all 12 actions" `tertiary`. Below 768 the action buttons sit in a row under the fix text, not stacked in a right column.
5. **Prompts block**: SectionHeader "Your prompts". Category filter and Sort become two `Segmented` controls on one toolbar row with Export CSV (`secondary sm`) right-aligned; at 390 the toolbar is two scroll rows. "Where you appear" is a real `<table>` at md+ (rank, prompt, engine result cells), DataList below 768. Engine result cell (`PromptResultCell.tsx`, Lane 1): mentioned = `bg-ok-fill/12` with ok check glyph and rank "#2" in ink; locked = lock glyph `text-ink-3` on `surface-2`. Category badges become `Tag` (CP6).
6. **"Where you do not appear yet"**: Disclosure, **collapsed by default**, summary "11 prompts, no engine named your brand". Same for **"Could not be checked"** (collapsed, summary carries "first failed {date}").
7. **Legend** ("Mentioned, with rank / Answered, not mentioned / ...") moves into a `tertiary` "What the symbols mean" Disclosure directly above the table, collapsed.
8. **Top competitors** and **Category breakdown**: one Disclosure "Competitors and categories", collapsed, summary "4 competitors named, weakest category {name} at {n}%". Competitor chips lose the red fill (they are not errors): `Tag` with name and "avg #1" in `text-ink-3`. Category bars: fill by status threshold already in code, rendered as 4px bars with values in ink.
9. Delete the raw ring hex (`AIVisibility.tsx:1139,1148,1840-1841`) via the shared `ScoreRing`. Replace teal or emerald selected-state classes, if any remain after the bridge, with `Segmented`.

### 10.3 Brand Sentiment (`BrandSentiment.tsx`, `frame-wide`) fixes `sentiment-*`

1. **HeroAnswer**: number = sentiment score with unit "/100"; pill = existing label ("Mostly positive", ok tone; "Mixed" neutral; "Needs attention" warn; "Mostly negative" bad). Answer = `[answer: {positivePct}% of the {n} AI answers that mention your brand are positive.]` Visual = none; instead the 100% stacked split bar (9.3) sits under the sentence with a direct legend: "Positive 10 (100%)  Neutral 0 (0%)  Negative 0 (0%)", each with its sentiment glyph (triangle up, circle, triangle down; prior spec 8.5). This replaces **four KPI cards and the Overall breakdown card** (five blocks become one).
2. **Sentiment by engine**: horizontal 100% stacked bars, one row per engine (engine swatch + name left, bar, n right). With one engine (demo) it renders one row, not a 300px chart with one column and a clipped axis. Same data as `buildEngineSentimentData`.
3. **Sentiment over time**: Card with SectionHeader and the W/M/Q `Segmented` right-aligned. Fewer than 3 buckets → EmptyState at the chart's final height (240px), body `[empty: The trend appears after three collections.]`, secondary action "Go to AI Visibility".
4. **Recent signals**: SectionHeader + one filter row: sentiment `Segmented` and engine `Segmented` on the same line at md+ (two scroll rows at 390). Feed as DataList, 10 rows then "Show more" `tertiary` (pagination is presentation only, the data is already loaded).
5. Remove the market badge from the header (blueprint 6.3 item 5: it implies a filter that does not exist).

### 10.4 AI Mentions (`Mentions.tsx`, `frame-read`) fixes `mentions-*`

1. **HeroAnswer**: number = total mentions; answer = `[answer: AI engines named your brand {n} times, at an average position of #{avg}.]`; the positive-sentiment count moves to the context line ("{k} of them positive"). Three equal stat cards become one hero.
2. **Filters**: engine `Segmented` and category on one row. At md+ category is a `Segmented`; below 768 category is the native `Select` (6.9), ending the three-row chip wall. The note "Latest answer per prompt and engine. The list below is every mention on record." moves under the filter row as `text-label text-ink-3`.
3. **List**: one Card, DataList rows. Leading: rank "#2" in `text-section text-ink` 600 (not lime). Title: the prompt, 2 lines then clamp. Meta: EngineChip (swatch + name), `Tag` category, sentiment dot + word. Trailing: chevron. Expanding a row reveals the response snippet in `Card tone="inset"`. Rows are no longer separate outlined cards.

### 10.5 Competitors (`Competitors.tsx`, `frame-wide`) fixes `competitors-*`

1. **HeroAnswer**: number = your AI mentions; unit none; answer = `[answer: AI engines named your brand {you} times; the most named competitor, {top}, {k} times.]`; context = "across {responses} AI responses, {engines} engine". "Add manually" is a `secondary` PageHeader action. "Top competitor" stops being red.
2. **Share of mentions** (replaces the vertical "AI mention count" chart): horizontal bar list (9.3), you first in `brandSeries`, then the top 5 competitors in `fieldSeries`, names wrap, values direct-labelled. Fixes the truncation and the 390 label collision.
3. **Competitor table**: real `<table>` at md+ (Competitor, AI mentions, Avg position, Engines, Sample prompt), header `text-label text-ink-2`, rows on `divide-line`. Your row first with `bg-accent-soft` and a "You" `Tag`. Mention counts in ink (not red). Down-trend arrow glyph stays, `text-bad` with `aria-label`. Below 768 it becomes DataList: name, then "1 mention, avg #1" meta, sample prompt on expand. Export CSV in the SectionHeader actions.
4. **Disclosure "By engine and over time"**, collapsed, holding: the grouped "Visibility by engine" chart, rendered only when 2 or more engines have data (one engine → sentence "Only {engine} has answers so far."), and the "Performance over time" line chart with `brandSeries` + `competitorSeries` (top 2) and a legend. Fewer than 3 buckets → EmptyState at final height.
5. **Your tracked competitors** (manual list): DataList with the delete action always visible at `text-ink-3`, `aria-label="Remove {name}"` (fixes the hover-only `opacity-0 group-hover:opacity-100` at `Competitors.tsx:636`).
6. Delete `COMPETITOR_SERIES_COLORS` and `buildCompetitorColors` from the page; read `chart.competitorSeries`.

### 10.6 Recommendations (`Recommendations.tsx`, `frame-read`) fixes `recommendations-*`

1. **PageHeader**: "Recommendations" + `CountBadge 2`; Refresh `secondary`. Below 768 Refresh drops to its own row (6.7), which removes the badge collision.
2. **HeroAnswer**: number = count of priority actions; unit = "actions"; answer = `[answer: Start with: {title of the first priority action}.]`; status pill from the existing engine status banner ("1 engine below 50%" → warn pill "Below 50% on 1 engine"); context = "Generated from {n} successful AI checks" (the existing subtitle). This absorbs the red alarm box and the standalone engine card (Gemini 48% Low becomes one line in the context).
3. **Priority actions** move up to directly under the hero (today they start at y=612 below AI analysis). First item expanded, others collapsed. Item anatomy: impact tag (`StatusPill warn` for "High impact" is wrong, impact is not status: use `Tag` with a lightning glyph), effort as `text-label text-ink-3` with clock glyph, title `text-section`, engine chips, then on expand "Why this matters" in `Card tone="inset"` with `text-prose`, and numbered "Action steps" with number circles `bg-surface-3 text-ink-2`.
4. **AI analysis** follows the actions: SectionHeader with the "Claude" `Tag`, `primary` "Generate insights" (it is the page's one primary action). The dashed-border prompt box becomes a plain `Card tone="inset"` with `text-prose text-ink-2`.
5. **Disclosure "Who AI names instead"**, collapsed, holds the competitor chips (`Tag` style, not red).
6. `h1` stays `text-title` (fixes the old `text-xl` deviation for good).

### 10.7 Prompts (`Prompts.tsx`, `frame-read`) fixes `prompts-*`

1. **PageHeader**: "Monitored prompts"; subtitle replaced by the allowance as a compact meter right under the title: `text-label text-ink-2` "{active} of {limit} prompts on {plan}" plus a 4px bar (`--accent` fill, `--warn-fill` at or over limit, track `--surface-3`). Actions: "AI Discover" `secondary`, "Add prompt" `primary` (disabled with lock glyph when at limit, `aria-disabled` and a tooltip-free inline reason, since the notice below says why).
2. **Limit notice** only when at or over limit: inline `Card tone="inset"` with warn glyph, one sentence and "Upgrade" `tertiary`. Not a full-width amber banner; it no longer outshouts the title.
3. **Filters**: one `Segmented` with counts ("All 24", "Mid 7"...).
4. **List**: one Card, DataList. Leading: index `text-label text-ink-3` tabular, then `Tag` category. Title wraps to 2 lines. Trailing: edit and archive icon buttons always visible at `text-ink-3`, `aria-label`s present (today invisible on desktop until hover, visible on mobile). Inline edit uses `Input`.
5. The AI Discover chat bubbles (`Prompts.tsx:531`): user bubble `bg-accent-soft text-ink`, assistant bubble `bg-surface-2 text-ink`.

### 10.8 Mechanical class migration outside the seven routes (Lane 2, no visual redesign)

For every file in `src/pages/**` not listed above, Lane 2 changes only class strings:

1. `text-white` that shares an element with a solid fill (`bg-brand-*`, `bg-violet-*`, `bg-red-*`, `bg-emerald-*`, `bg-amber-*`, `bg-rose-*` at step 500 or above without a `/NN` alpha, or `bg-accent-strong`) → `text-on-accent`. Conditional class strings count (e.g. `AIVisibility.tsx:2489`, `Prospects.tsx:1255,1261`).
2. Nothing else. The bridge themes the rest.

---

## 11. State inventory

Rule for all: loading is a skeleton of the final box (6.13), never a spinner that reflows; error is `LoadErrorCard` or `EmptyState tone="error"` with Retry and never the empty state; locked is `FeatureLocked` restyled with `Tag` + `secondary` upgrade link; zero data never renders 0% as a verdict.

### 11.1 Per component

| Component | Empty | Loading | Partial | Error | Locked by plan | Success |
|---|---|---|---|---|---|---|
| HeroAnswer | `empty` prop: EmptyState inside the hero card, same height, no number, no pill | `SkeletonHero` | number + pill "Partial" (warn) + context names what is missing ("2 of 5 engines failed on 1 Jul") | `EmptyState tone="error"` in the hero box, Retry | hero shows what the plan includes; never blank | number count-up, pill, sentence |
| Stat | value "Not measured yet" in `text-body text-ink-3`, no pill, no sparkline | `SkeletonStatGroup` | value + caption "from {n} of {m} checks" | parent card error | `Tag` "Upgrade to see" with lock | value, pill, sparkline |
| Chart card | EmptyState at final chart height | `SkeletonChart h` | chart + caption naming excluded engines | EmptyState error, Retry | FeatureLocked inside card | draw-in once |
| DataList / table | EmptyState with the action that fills it | `SkeletonList 5` | rows + footer note "{k} could not be checked" | LoadErrorCard above the list | locked cells show lock glyph, never empty | rows |
| Segmented | hidden when only one option | disabled at 50% opacity, no pulse | | | locked option shows lock glyph, `aria-disabled` | selected ring |
| Button | | spinner replaces icon, label stays, width fixed | | label unchanged, error shown by the surrounding block | lock glyph + upgrade route | brief ok glyph swap 1200ms for "Mark as done" |
| StatusPill | not rendered | not rendered | warn "Partial" | bad "Could not check" | neutral "Locked" | ok / warn / bad |
| Disclosure | trigger shows "None" and is not expandable | trigger skeleton bar | summary counts | summary "Could not load" + Retry inside | | |

### 11.2 First-run (zero data) per route

| Route | Zero-data screen |
|---|---|
| `/` | Hero empty: icon `Radar`, title `[empty: No results yet]`, body `[empty: Your first collection checks every prompt on every engine in your plan.]`, primary "Run first collection" → `/ai-visibility`. Dimensions list shows "Not measured yet" per row. Key metrics card hidden (no zeros). Disclosure hidden. No score label, no "Needs work". |
| `/ai-visibility` | Hero empty with primary "Run collection" (the real control, not a link). Engines strip shows engines as "Not checked yet" `StatusPill neutral`. Fix This hidden. Prompts table shows the prompts with "Not checked yet" cells. If there are no prompts: EmptyState with primary "Add prompts" → `/prompts`. |
| `/sentiment` | Hero empty, body `[empty: Sentiment appears once an AI answer mentions your brand.]`, secondary "See where you appear" → `/ai-visibility`. All other blocks hidden. (Today this route had 0 links at zero data; the prior fix added one; this keeps it and removes the four zero cards.) |
| `/mentions` | Hero empty, body `[empty: No AI answer has named your brand yet.]`, secondary "See the prompts" → `/ai-visibility`. Filters hidden. |
| `/competitors` | Hero empty, body `[empty: Competitors appear when AI answers name other companies for your prompts.]`, primary "Add a competitor" (opens the existing manual add). Table hidden; manual list shown if non-empty. |
| `/recommendations` | Hero empty, body `[empty: Actions are generated after your first collection.]`, primary "Run first collection" → `/ai-visibility`. AI analysis block shown with Generate disabled and its existing reason. |
| `/prompts` | Hero not used on this route; list EmptyState: title `[empty: No prompts yet]`, primary "Add prompt", secondary "AI Discover". |

---

## 12. Motion

Every animation has a job. `MotionConfig reducedMotion="user"` covers Motion-driven ones; the `prefers-reduced-motion` block in `index.css` covers CSS ones. Tokens: `--motion-fast` 180ms, `--motion-base` 260ms, `--motion-slow` 500ms, `--ease-out` `cubic-bezier(0.16,1,0.3,1)` (all existing).

| # | Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|---|
| 12.1 | Page blocks (first 4 in reading order only) | route data ready | opacity 0→1, y 8→0 | 260ms | ease-out | 40ms | guide the eye down the reading order: hero first | instant, no transform |
| 12.2 | Hero number | first data load per route per session (not on refresh, not on range change) | count-up 0→value | 900ms | ease-out (existing `useCountUp`) | | confirm the number is live data | final value immediately |
| 12.3 | Score ring | with 12.2 | stroke-dashoffset | 900ms | ease-out | | ties the ring to the number | static final arc |
| 12.4 | Interactive Card | hover, focus-within | translateY 0→-2, shadow e1→e2 | 180ms | ease-out | | confirm clickability | shadow change only, no transform |
| 12.5 | Disclosure | toggle | height auto, opacity of content 0→1; chevron rotate 0→180 | 260ms; chevron 180ms | ease-out | | show where the content came from | instant |
| 12.6 | Bars and lines | first render of a chart in view | Recharts draw-in (`isAnimationActive` true once, false on re-render) | 500ms | ease-out | | mask the paint, show direction of change | `isAnimationActive={false}` |
| 12.7 | Segmented selection | select | background and ring colour | 180ms | ease-out | | confirm the choice | instant |
| 12.8 | Content under a range or filter change | value change | opacity 1→0.4→1 on the affected block only | 180ms out, 180ms in | ease-out | | mask latency while recomputing | none, swap |
| 12.9 | Skeleton → content | data ready | crossfade opacity | 180ms | ease-out | | mask latency without layout shift | instant |
| 12.10 | Skeleton pulse | while loading | opacity 0.55↔1 | 1200ms loop | ease-in-out | | show work is in progress | static 0.7 (existing rule) |
| 12.11 | "Mark as done" | click | icon swap with scale 0.8→1 | 180ms | ease-out | | confirm the action | swap only |
| 12.12 | Collection progress bar | progress tick | width | 260ms | ease-out | | show progress, smooth jumpy ticks | width set directly |

Cut: hover lift on non-interactive cards (today every `MotionCard` lifts), any glow, any ambient pulse, sliding pill indicators, page-wide stagger beyond four blocks.

---

## 13. Accessibility floor (checked by bg-verify)

### 13.1 Text contrast, every pair used (floor 4.5:1; hero number and title are large text but held to 4.5 anyway)

Dark:

| Text | on canvas `#0a0b0e` | on surface-1 `#121318` | on surface-2 `#191a21` | on surface-3 `#22232c` | on accent-soft `#1f1a33` | on nav `#13152b` |
|---|---|---|---|---|---|---|
| ink `#e8e9ed` | 16.22 | 15.29 | 14.29 | 12.87 | 13.81 | 14.80 |
| ink-2 `#a3a9b4` | 8.33 | 7.85 | 7.34 | 6.61 | 7.09 | 7.60 |
| ink-3 `#8a909c` | 6.14 | 5.79 | 5.41 | 4.87 | 5.22 | 5.60 |
| accent-text `#a78bfa` | 7.23 | 6.82 | 6.37 | 5.74 | 6.15 | 6.60 |
| ok `#34d399` | 10.24 | 9.65 | 9.02 | 8.12 | | |
| warn `#fbbf24` | 11.79 | 11.11 | 10.39 | 9.35 | | |
| bad `#f87171` | 7.11 | 6.71 | 6.27 | 5.65 | | |
| on-accent `#ffffff` on accent-strong `#7c3aed` | 5.70 | | | | | |
| on-accent on accent-hover `#6d28d9` | 7.10 | | | | | |
| on-accent on bad-fill `#dc2626` | 4.83 | | | | | |

Light:

| Text | on canvas `#f7f7fc` | on surface-1 `#ffffff` | on surface-2 `#f4f4fb` | on surface-3 `#ececf5` | on accent-soft `#efeafd` | on nav `#eceaf6` |
|---|---|---|---|---|---|---|
| ink `#0b0b12` | 18.36 | 19.61 | 17.91 | 16.70 | 16.68 | 16.50 |
| ink-2 `#4f4f5a` | 7.57 | 8.08 | 7.38 | 6.88 | 6.87 | 6.80 |
| ink-3 `#62626d` | 5.64 | 6.02 | 5.50 | 5.13 | 5.12 | 5.07 |
| accent-text `#6d28d9` | 6.65 | 7.10 | 6.49 | 6.05 | 6.04 | 5.98 |
| ok `#065f46` | 7.20 | 7.68 | 7.02 | 6.54 | | |
| warn `#92400e` | 6.64 | 7.09 | 6.48 | 6.04 | | |
| bad `#991b1b` | 7.78 | 8.31 | 7.59 | 7.08 | | |
| on-accent on accent-strong `#6d28d9` | 7.10 | | | | | |
| on-accent on accent-hover `#5b21b6` | 8.98 | | | | | |
| on-accent on bad-fill `#b91c1c` | 6.47 | | | | | |

Status and decorative text on its own tint, worst case per family (tint = fill at the given alpha composited on the surface):

| Family | Dark fg on 25% tint over s1 | Light fg on 25% tint over canvas |
|---|---|---|
| ok | 6.28 | 5.70 (20%) |
| warn | 6.85 | 5.12 |
| bad | 5.42 | 5.05 |
| accent | 5.12 | 4.58 |
| blue | 7.41 | 5.77 |
| sky | 7.44 | 5.52 (20%) |
| cyan | 8.24 | 5.41 (20%) |
| orange | 7.47 | 5.37 (20%) |
| pink | 7.49 | 5.08 |
| teal | 8.16 | 5.62 (20%) |
| indigo | 7.04 | 6.37 |

Sentiment tokens are marks only; as marks on the new surfaces: dark positive 9.39, neutral 7.23, negative 6.89 on s1; light positive 7.08, neutral 4.76, negative 8.02 on s1 (all over the 3:1 non-text floor). Light neutral `#64748b` stays forbidden as text (4.35 on s2).

### 13.2 Non-text contrast, WCAG 1.4.11 (floor 3:1)

| Element | Dark | Light |
|---|---|---|
| `--line-strong` input / secondary button boundary on s1 / s2 / s3 | 3.76 / 3.51 / 3.16 | 4.47 / 4.08 / 3.80 |
| Segmented selected ring (`--accent-text`) on accent-soft / s1 | 6.15 / 6.82 | 6.04 / 7.10 |
| Primary button fill `--accent-strong` vs s1 / canvas | 3.26 / 3.45 | 7.10 / 6.65 |
| Focus ring `--rail-active` on canvas / s1 / s3 | 7.23 / 6.82 / 5.74 | 5.34 / 5.70 / 4.85 |
| Sidebar divider `--border-nav` vs nav / canvas | 3.77 / 4.14 | 4.00 / 4.46 |
| Active nav rail on active fill / nav | 4.23 / 6.60 | 5.70 / 4.79 |
| Engine marks (all 9) on every surface | ≥ 3.0 (validator) | ≥ 3.0 |
| Competitor series on s1 | 4.38 / 5.82 / 4.95 | 5.70 / 5.18 / 3.74 |
| Score ring arc `--accent` on track `--surface-3` | 3.69 | 4.85 |
| Chart gridlines `--line` on s1 | 1.23 (decorative, exempt) | 1.17 (exempt) |
| Card vs canvas | 1.06 (not a component, exempt) | 1.07 (exempt) |

Light `--line-strong` `#767685` also measures 4.18 on canvas.

### 13.3 Focus

`:focus-visible { outline: 2px solid rgb(var(--rail-active)); outline-offset: 2px }`, unchanged. Inputs swap their 1px ring for the 2px focus ring. Never `outline: none` without a replacement. Focus moves to `<main>` on route change (existing). Disclosures and Segmented are keyboard operable (Enter, Space; arrow keys inside a radiogroup).

### 13.4 Hit targets

44x44 minimum below 768 for every control (pseudo-element extension where the visible control is smaller: Segmented 32 → 44, icon buttons 36 → 44, EngineChip 32 → 44). 24x24 minimum at 768+ (WCAG 2.5.8); every control in this spec is at least 32 visible.

### 13.5 Heading order

Every route: exactly one `h1` (PageHeader). HeroAnswer has no heading (its sentence is a `<p>`, the number is a `<p>` with an `aria-label` combining number and unit, e.g. "72 out of 100"). Every Card title is `h2`. Inside a card, sub-blocks are `h3`. `StatLabel` stays a `<span>`. Disclosure triggers are `<button>` inside an `h2`.

### 13.6 Identity is never colour alone

Engine: swatch + name (+ logo where present). Sentiment: glyph + word. Status: glyph + word. Selection: fill + weight + ring. Competitor series: legend + end label at 1280+.

---

## 14. Reference frames

| Block | Comparable | Attribute borrowed (a constraint, not a mood) |
|---|---|---|
| HeroAnswer | **Mercury** account home | one balance, one sentence of context, no chart above it, the number in ink not colour |
| Cards and elevation | **Linear** | separation by a hairline ring and a close shadow; no outlined boxes |
| Sentiment split, share of mentions | **Stripe** dashboard | one proportional bar with direct labels instead of a chart with axes |
| AI Visibility prompt table with disclosures | **Linear** issue list | grouped sections that collapse to a count; rows not cards |
| Competitors share list | **Vercel** analytics | horizontal bar list, names left, values right, no axes |
| Prompts list and row actions | **Raycast** | quiet rows, actions always present at low emphasis, brighten on focus |
| Recommendations reading | **Linear** issue detail | 15px prose at a 64ch measure, numbered steps, nothing beside the text |
| Shell | **Linear** sidebar | the only tinted surface, sentence-case group labels |

---

## 15. Documentation amendments (applied by bg-design after Constantin rules on 0.3; not applied by this file)

| # | File | Change |
|---|---|---|
| D-1 | `docs/DESIGN-SYSTEM.md` section 1 | Engine table to ENGINE_META's live values (chatgpt `#16a34a` ... copilot `#0284c7`); delete the `text-*-400` column (A11 of the prior spec removed it). |
| D-2 | `docs/DESIGN-SYSTEM.md` sections 1 to 7 | Replace with a pointer to this spec's section 4 token tables and 6 component anatomy; the `bg-dark-800 border border-dark-700` card recipe and the uppercase label recipe are superseded. |
| D-3 | `docs/DESIGN-SYSTEM.md` new section | "Light mode by construction": the three layers of 4.1 and the rule "never write `html.light .<utility>`". |
| D-4 | `CLAUDE.md` Product quality backlog | Mark the contrast and engine palette items CLOSED with the measurements in 0.2; keep Competitors palette and first-run until this build ships. |
| D-5 | `docs/DASHBOARD-UX-2026.md` section 3 | Hover lift applies to interactive cards only (12.4). |

---

## 16. Acceptance criteria (bg-verify, measured)

| # | Criterion | How to measure |
|---|---|---|
| AC-1 | Every text-on-surface pair in 13.1 measures at or above its stated value in both themes | computed style of each pair on the 7 routes, WCAG ratio |
| AC-2 | Every non-text pair in 13.2 ≥ 3:1 (except the rows marked exempt) | same |
| AC-3 | Engine palette: validator on `#0a0b0e`, `#121318`, `#191a21`, `#ffffff`, `#f7f7fc` passes with worst adjacent normal dE ≥ 15.8 and CVD ≥ 6.5; live five all-pairs normal ≥ 15.4 | `node validate_palette.js` per 17 V1 |
| AC-4 | Competitor series: validator `--pairs all` passes in both modes, worst CVD ≥ 12.5 dark and ≥ 13.7 light | 17 V2 |
| AC-5 | `COMPETITOR_SERIES_COLORS` no longer exists in `src/` | grep returns 0 |
| AC-6 | Raw hex in the seven pages: 0 (comments excluded) | `rg -n "#[0-9a-fA-F]{6}" src/pages/{Dashboard,AIVisibility,BrandSentiment,Mentions,Competitors,Recommendations,Prompts}.tsx` minus comment lines |
| AC-7 | The 10-second test (2.2) passes on all 7 routes at 1440x900 and 390x844, both themes | screenshots, hero inside first viewport |
| AC-8 | No route renders more than 9 top-level blocks; counts match 5.3 | DOM count of direct children of the page frame |
| AC-9 | h1 left edge identical (±1px) across the 7 routes at 1440 | `getBoundingClientRect().left` of `h1` |
| AC-10 | No y-axis tick is clipped: every `.recharts-cartesian-axis-tick-value` has `getBBox().x ≥ 0` relative to its SVG | headless Chrome |
| AC-11 | No text-bearing element in the 7 routes is smaller than 12px except `.mobile-nav-label` (11px) | computed `font-size` sweep |
| AC-12 | `index.css` contains zero `html.light .` selectors that target a utility class and zero `!important` other than `.skip-link:focus` | `rg -n "!important" src/index.css` returns exactly 1 line; `rg -n "html\.light \.(text|bg|border|hover)" src/index.css` returns 0 |
| AC-13 | Zero elements with a solid fill and `text-white`; `text-on-accent` used instead | `rg -n "text-white" src` lines that also match `bg-(brand|violet|red|emerald|amber|rose)-[5-9]00([^/]|$)` or `bg-accent-strong` return 0 |
| AC-14 | Light mode by construction: add a throwaway element with `text-slate-400 bg-emerald-500/10 border-slate-600` in light mode; it computes to `--ink-2`, `--ok-fill` at 10%, `--line-strong` with no extra CSS | dev check, then remove |
| AC-15 | No horizontal scroll at 390 on any of the 7 routes, both themes | `window.scrollTo(600,0)` then `scrollX === 0` (real scroll, not `scrollWidth`) via headless Chrome over CDP (the Browser pane cannot measure layout) |
| AC-16 | Every control below 768 has a hit area ≥ 44x44 | bounding box of control plus its `::after` |
| AC-17 | With `prefers-reduced-motion: reduce`, no element has a running transform transition or animation other than the static skeleton | `document.getAnimations()` empty after load, CSS transition durations 0 on transform |
| AC-18 | Zero-data states: with a tenant with prompts and 0 `ai_results`, no route shows "0%", "Needs work" or any score label; every route shows at least one focusable control that leads somewhere | demo or a test client |
| AC-19 | Row and delete actions on `/prompts` and `/competitors` are visible without hover and reachable by Tab | keyboard walk |
| AC-20 | `tests/tokens_sync.test.js` passes: every `chartTheme.ts` and `tokens.ts` hex equals its `index.css` triplet | `node tests/tokens_sync.test.js` |
| AC-21 | `npm run build` exit 0, `tsc` exit 0; `src/lib/metrics.ts`, `resultsContext.tsx`, `src/lib/views/**`, `resultsGuards.ts` byte-identical to HEAD | `git diff --stat` on those paths is empty |
| AC-22 | No em dash or en dash in any added line | `rg` with a positive control, never `grep -P` on Git Bash |
| AC-23 | Bottom nav labels at 390 are never truncated (`scrollWidth <= clientWidth` on every `.mobile-nav-label`) | headless Chrome |

---

## 17. Verification harness (verbatim)

Validator: `dataviz` skill, `scripts/validate_palette.js`, copied to the scratchpad and run with Node 24.

**V1, engine ramp, adjacent, 9 slots** (`#16a34a,#2563eb,#ea580c,#0891b2,#db2777,#c026d3,#6366f1,#a16207,#0284c7`), identical on `--mode dark --surface #0a0b0e`, `#121318`, `#191a21` and `--mode light --surface #ffffff`, `#f7f7fc`:

```
  [PASS] Lightness band         all 9 inside L 0.48 to 0.67   (light: 0.43 to 0.77)
  [PASS] Chroma floor           all 9 >= 0.1
  [WARN] CVD separation         worst adjacent #6366f1↔#c026d3 ΔE 6.5 (deutan) · tritan 8.9
  [PASS] Normal-vision floor    worst adjacent #c026d3↔#db2777 ΔE 15.8 (normal)
  [PASS] Contrast vs surface    all 9 >= 3:1
  → ALL CHECKS PASS
```

**V1b, live five, `--pairs all`** (`#16a34a,#2563eb,#ea580c,#0891b2,#db2777`), dark `#121318` and light `#ffffff`:

```
  [WARN] CVD separation         worst all-pairs #db2777↔#16a34a ΔE 6.1 (deutan) · tritan 2.7
  [PASS] Normal-vision floor    worst all-pairs #db2777↔#ea580c ΔE 15.4 (normal)
  → ALL CHECKS PASS
```

**V2, competitor series, `--pairs all`.** Current palette `#8b5cf6,#e07b00,#1f9e89,#d6409f` dark `#121318`:

```
  [FAIL] Lightness band         outside band: [["#e07b00",0.682]]
  [FAIL] CVD separation         worst all-pairs #d6409f↔#1f9e89 ΔE 2.9 (deutan) · tritan 8.2
  → FAILED
```

Proposed dark `#8b5cf6,#d97706,#0d9488` on `#121318` and `#0a0b0e`:

```
  [PASS] Lightness band         all 3 inside L 0.48 to 0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #0d9488↔#d97706 ΔE 12.5 (protan) · tritan 10.4
  [PASS] Normal-vision floor    worst all-pairs #0d9488↔#d97706 ΔE 24.3 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
```

Proposed light `#7c3aed,#c2410c,#0d9488` on `#ffffff` and `#f7f7fc`:

```
  [PASS] Lightness band         all 3 inside L 0.43 to 0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #0d9488↔#c2410c ΔE 13.7 (deutan) · tritan 13.6
  [PASS] Normal-vision floor    worst all-pairs #0d9488↔#c2410c ΔE 27.1 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
```

Rejected along the way, recorded so nobody re-tries them: `#d97706` in light (2.98:1 on `#f7f7fc`, WARN); `#b45309` in light (passes, but it is the marketing warn status value, reserved); 4-slot sets with magenta or blue next to violet (CVD 3.8 to 5.8, or normal 14.9).

**V3, delta E pairs (OKLab x100):** claude/meta old `#f97316`/`#f59e0b` 9.6, now `#ea580c`/`#c026d3` 29.4; chatgpt vs sentiment positive 15.7 dark, 18.9 light; google_ai vs sentiment negative 14.3 dark, 15.1 light; grok vs sentiment neutral 22.1; Segmented selected ring vs idle `--line-strong` 21.2 dark, 24.2 light; competitor slot 2 vs warn status 18.6 dark, 9.6 light (different jobs, never in one plot).

**V4, contrast:** sections 13.1 and 13.2 were produced by `contrast()` exported from the same validator file.

**V5 to V7, source greps for bg-verify:**

```
rg -c "!important" brandgeo-dashboard/src/index.css            # today 92+, target 1
rg -n "html\.light \.(text|bg|border|hover)" brandgeo-dashboard/src/index.css   # target 0
rg -n "text-white" brandgeo-dashboard/src | rg "bg-(brand|violet|red|emerald|amber|rose)-[5-9]00([^/]|$)"   # today 38+, target 0
```

---

## 18. Handoff packets

Both lanes run on **Sonnet** (presentation only, no auth, billing or RLS). bg-verify on **Opus** after both, with headless Chrome over CDP for AC-10, AC-15, AC-23. One Netlify build for both lanes together, pushed with `BATCH_PUSH=1` on Constantin's go. Nothing starts before section 0.3 is ruled.

### 18.1 Sequencing (disjoint files, serial dependency)

1. **Lane 1 commit A** (tokens, bridge, primitives, shell, `text-on-accent` in components). The app must look correct in dark and light with **every** route still on old class names, because the bridge themes them. Lane 1 does not delete the `index.css` overrides yet.
2. **Lane 2** builds the seven routes on Lane 1's primitives and runs the mechanical sweep (10.8).
3. **Lane 1 commit B** deletes every `html.light .<utility>` rule and every `!important` except `.skip-link:focus`, after Lane 2's AC-13 grep returns 0.
4. bg-verify on the combined diff.

### 18.2 Packet: Lane 1, foundation (`bg-app`)

**Write scope (exact):**
- `brandgeo-dashboard/tailwind.config.js`
- `brandgeo-dashboard/src/index.css`
- `brandgeo-dashboard/src/lib/chartTheme.ts`
- `brandgeo-dashboard/src/lib/planConfig.ts` (comments only around ENGINE_META; **values unchanged**, `PLAN_ORDER` and everything else untouched)
- `brandgeo-dashboard/src/lib/color.ts`
- `brandgeo-dashboard/src/lib/tokens.ts` (new)
- `brandgeo-dashboard/src/components/**` (all, including new `src/components/ui/`: `Card.tsx`, `Button.tsx`, `Badge.tsx` (StatusPill, CountBadge, Tag, PriorityTag), `Stat.tsx`, `SectionHeader.tsx`, `PageHeader.tsx`, `HeroAnswer.tsx`, `ScoreRing.tsx`, `Segmented.tsx`, `Input.tsx`, `Select.tsx`, `Disclosure.tsx`, `DataList.tsx`, `skeletons.tsx`, `TimeRangeControl.tsx`; restyle `EmptyState.tsx`, `Skeleton.tsx`, `RouteSkeleton.tsx`, `LoadErrorCard.tsx`, `MotionCard.tsx`, `ScoreBadge.tsx`, `Typography.tsx`, `EngineChip.tsx`, `PromptResultCell.tsx`, `ChartTooltip.tsx`, `ChartLegend.tsx`, `Collapse.tsx`, `TrendDelta.tsx`, `FeatureLocked.tsx`, `Layout.tsx`)
- `brandgeo-dashboard/src/App.tsx` (class strings at `:142` only)
- `brandgeo-dashboard/tests/tokens_sync.test.js` (new)

**Do:** sections 4, 6, 7, 9.1, 9.2, 12 (CSS side), 11.1 for components; legacy aliases in 4.2; bridge in 4.7; `text-on-accent` migration in components; commit B per 18.1.
**Do not:** touch any file in `src/pages/`, `src/lib/metrics.ts`, `src/lib/resultsContext.tsx`, `src/lib/views/**`, `src/lib/resultsGuards.ts`, `src/lib/resultsLoader.ts`, `netlify/**`; add any npm dependency; change ENGINE_META values or `ALL_ENGINES` order; run git beyond a pathspec commit if asked.
**Acceptance:** AC-1, 2, 3, 11 (shell), 12 (after commit B), 13 (components), 14, 16 (shell), 17, 20, 21, 22, 23.

### 18.3 Packet: Lane 2, pages (`bg-app`)

**Write scope (exact):**
- `brandgeo-dashboard/src/pages/Dashboard.tsx`
- `brandgeo-dashboard/src/pages/AIVisibility.tsx`
- `brandgeo-dashboard/src/pages/BrandSentiment.tsx`
- `brandgeo-dashboard/src/pages/Mentions.tsx`
- `brandgeo-dashboard/src/pages/Competitors.tsx`
- `brandgeo-dashboard/src/pages/Recommendations.tsx`
- `brandgeo-dashboard/src/pages/Prompts.tsx`
- mechanical class strings only (10.8) in: `src/pages/Social.tsx`, `Onboard.tsx`, `AffiliatesAdmin.tsx`, `affiliate/AffiliatePortal.tsx`, `affiliate/AffiliateJoin.tsx`, `affiliate/AffiliateLogin.tsx`, `AuditReport.tsx`, `AuditRequest.tsx`, `SEO.tsx`, `Prospects.tsx`, `Revenue.tsx`, `ResetPassword.tsx`, `Login.tsx`, `Welcome.tsx`, `Signup.tsx`, `OAuthAuthorize.tsx`, `Tickets.tsx`, `Account.tsx`

**Do:** section 10 in the listed order per route; 11.2 zero-data states; 9.3 form substitutions; the motion uses in 12 via existing `motion.ts` helpers.
**Do not:** edit `src/components/**`, `src/index.css`, `tailwind.config.js`, `src/lib/**`; change any query, metric, route, or the meaning of any label; write final copy beyond the `[answer: ...]` / `[empty: ...]` templates (ship the template text with slots filled until bg-copy rules); add a dependency.
**Acceptance:** AC-4, 5, 6, 7, 8, 9, 10, 11, 13 (pages), 15, 16, 18, 19, 21, 22.

### 18.4 After the build

bg-copy pass on the `[answer: ...]`, `[empty: ...]`, `[label: ...]` placeholders (none blocks the build). bg-verify writes `docs/qa/phase3-visual-direction-b-review.md`. bg-design applies D-1 to D-5.
