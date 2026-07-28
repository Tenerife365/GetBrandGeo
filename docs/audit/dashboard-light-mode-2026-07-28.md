# BrandGEO Dashboard — Light Mode Audit

**Date:** 2026-07-28
**Auditor:** dashboard-auditor (read-only)
**Target:** `brandgeo-dashboard/` at `HEAD` = `0c6e740`; production `https://app.getbrandgeo.com`
**Scope:** light mode only (`html.light`), the theme the 2026-07-26 audit could not reach
**Artifact rule:** this file is the only write. No source file was modified.

---

## Verdict

**Light mode is not awful. It is the same UI as dark mode with three genuinely light-specific defects and one hard failure — the admin engine toggle, whose OFF state is a white knob on a near-white track inside an undefined-token border, all three cues under 1.5:1.** The owner's expectation ("it will look awful") is refuted by measurement: 97 of 99 cards carry a visible edge, all 52 keyboard stops carry a ≥4.79:1 focus ring, the nav divider clears 3:1, the scrollbar clears 3:1, mobile at 375 is clean, and text passes 4.5:1 almost everywhere. The prior audit's three headline dark-mode failures (side panel 1.07:1, active nav 1.24:1, time bar 1.39:1) were **fixed for both themes** by `75e1ede` and light mode inherits the fix.

| Lens | Score | One-sentence justification |
|---|---|---|
| **1. Functional correctness (a11y/contrast)** | **3** | Focus, scrollbar, mobile, nav divider and body text all pass measured; the failures are concentrated in one unreachable admin control, the muted-text token on tinted surfaces, and every 1px component border. |
| **2. Capability & navigation** | **4** | Not re-audited (Lens 2 is theme-independent and was covered 2026-07-26); nothing observed in light mode changes reachability, and the shell's state cues survive the theme flip on the rail rather than the fill. |
| **3. Visual & interaction craft** | **3** | Deliberate, token-driven and internally consistent — its own ledger in `dashboard-visual-system.md` is real work — but hover feedback collapses to 1.01:1, two Overview cards lost their elevation in the `rounded-card` migration, and the `--dark-600` border token is too weak to bound a control on white. |

**Scoring note.** A 3 is "category standard, unremarkable." Light mode here is a competent second theme, not a broken one. It is held off a 4 by the toggle (L-01) and by the boundary token (L-03), both of which are single-token fixes.

---

## Top 5 actions

Ranked by user impact ÷ effort.

| # | What | Where | Why it matters | Effort | Expected change |
|---|---|---|---|---|---|
| **1** | Give the OFF toggle a real track and a defined border token. | `AIVisibility.tsx:148-152` | The engine on/off switch is the only control in the app whose **state** is unreadable in light mode: knob-vs-track **1.43:1**, track-vs-card **1.43:1**, border **1.24:1**. Dark mode's same control is 10.35:1. An admin cannot tell which engines are enabled. | **S** | Three cues move from <1.5:1 to ≥3:1; WCAG 1.4.11 state requirement met. |
| **2** | Raise `--dark-600` in `html.light` from `#d8d6e6` to a value clearing 3:1 on white. | `index.css:70` | It is the border of **every** text input (1.43:1) and **every** engine chip button (1.34-1.43:1). One token bounds most controls in the app. Dark mode's equivalent is 1.72:1 — also failing, so one change can fix both. | **S** | ~15 measured controls gain a compliant boundary from a single line. |
| **3** | Stop mapping `text-slate-600` and `text-slate-500` to the same `#64748b`, or darken it. | `index.css:131-132` | `#64748b` clears 4.5:1 **only on pure white** (4.76). It measures **4.45** on the page canvas, **4.00** on the sidebar, **3.95** on tinted rows — and it is the app's default muted-text colour, so the failures are spread across every route. | **S** | Removes the single largest cluster of text failures; nothing else changes. |
| **4** | Restore card elevation for `rounded-card`. | `index.css:331`, `:339-344` | The elevation selectors key off `.rounded-xl` / `.border`. The `--card-radius` migration moved 3 call sites to `.rounded-card`, orphaning them. Overview's two largest cards (944×267, 944×201) render at **1.07:1 with no shadow and no border** — on the post-login landing page, in **both** themes. | **S** | 2 invisible cards on the highest-traffic route regain an edge. |
| **5** | Give `.nav-item:hover` and `.time-pill:hover` a light-mode background step. | `index.css:529`, `:582` | `rgb(var(--dark-700) / 0.55)` over the nav surface computes to **1.01:1** — the background half of the hover is literally nothing. The text-colour half still fires, so this is degraded, not absent, affordance. | **S** | Hover reads as hover instead of as a text-weight flicker. |

All five are S. None requires a new dependency, a component rewrite, or a design decision beyond picking a value.

---

## What changed since the 2026-07-26 audit — read this before re-filing anything

`75e1ede` ("dashboard visual system") landed **2026-07-28 07:34**, after the audit this one follows, and it invalidates several premises in the brief. Verified against production (`index-CUv7bb9H.css`, `index-DxW86GWE.js` — every token and hex below confirmed present in the deployed bundles).

| Premise in the brief | Measured state today |
|---|---|
| "side panel vs canvas 1.07:1" | Surfaces are still 1.11:1 in light — **by design**. The boundary is now a solid 1px `--border-nav` `#64748b` divider measuring **4.00:1 vs nav / 4.45:1 vs canvas**. WCAG 1.4.11 is satisfied by the divider, not the fill. **Not a defect.** |
| "active nav tab 1.24:1" | Active fill vs idle fill is 1.19:1, but the state now carries on three cues: a 3px `--rail-active` rail at **5.70:1**, weight 600 vs 400, and text 17.85:1 vs 6.37:1. **Not a defect.** |
| "time-filter bar 1.39:1" | Bar surface vs canvas 1.05:1, but the pressed pill carries a `#7c3aed` border at **5.08:1** against the bar. **Not a defect.** |
| "Claude `#f97316` vs Meta `#f59e0b`, ΔE 9.6" | Both hexes are **gone**. `ENGINE_META.color`/`.bg` were deleted; the palette is nine new `chartColor` values. Claude is `#ea580c`, Meta `#c026d3`. **Superseded.** |
| "`#10b981` means ChatGPT AND Positive; `#ef4444` means Google AI Mode AND Negative" | Both hexes are gone. ChatGPT is `#16a34a`, sentiment-positive-light is `#4d7c0f` (ΔE 15.8); Google AI Mode is `#db2777`, sentiment-negative-light is `#9f1239` (ΔE 16.4). The collision is **reduced, not eliminated** — see L-08. |
| "~60 `!important` overrides, the shape of code that produces unreadable text" | The overrides are still there and they are the mechanism, but they are **mostly correct**. The measured text failures are 6 distinct colour/surface pairs, not sixty. |

**Do not re-file any of the first three rows.** They are fixed and I measured them fixed.

---

## Findings ledger

Severity per the standard ladder. `MEASURED` = observed in a running browser with computed styles; `SOURCE` = computed from the exact token values at a cited line, because the surface could not be rendered (reason given).

Ratios are WCAG 2.x relative luminance. ΔE is CIEDE2000. Colour-vision simulation is Machado et al. 2009 at severity 1.0.

| id | Sev | Title | Location | Evidence | Attribution |
|---|---|---|---|---|---|
| **L-01** | **S2** | Engine on/off toggle state is unreadable in light mode | `pages/AIVisibility.tsx:148-152` | `SOURCE`. OFF: knob `bg-white` vs track `bg-dark-600` (`#d8d6e6`) = **1.43:1**; track vs white card = **1.43:1**; `border-dark-500` is an **undefined Tailwind token** (config defines 900/800/700/600 only) so `border-2` falls back to Tailwind's default `#e5e7eb` = **1.24:1**. Dark mode same control: knob-vs-track **10.35:1**. Not renderable in demo mode — the Engine Configuration panel is `isAdmin`-gated. | **Light-specific.** Dark passes comfortably. |
| **L-02** | **S2** | Muted-text token fails 4.5:1 on every light surface except pure white | `index.css:131-132` | `MEASURED`. `#64748b` on card `#ffffff` **4.76** (pass); canvas `#f7f7fb` **4.45**; nav `#eceaf6` **4.00**; tinted row `#eae9f2` **3.95**; bar `#f2f1f8` 4.34. Live instances: "MARKET" 12px (`/`, all routes), "Edit" 11px, "— last checked 28 Jul" 14px (`/ai-visibility`), "LOCKED" 10px, "Mentioned" 12px, "Loading recommendations…" 14px, "Don't have an account? Sign up free" and the copyright line on `/login`. | **Light-specific.** The comment at `:132` says this value was chosen because slate-400 "failed contrast" — it was validated against white only. |
| **L-03** | **S2** | Every 1px component border fails 1.4.11 in light mode | `index.css:70` (`--dark-600`), `:165`, `:172` | `MEASURED`. Text inputs (`/account`, `/login`): border `#d8d6e6` vs white card **1.43:1**, vs own fill **1.34:1**. Engine chips (`components/EngineChip.tsx:67,79`, 15 instances on `/sentiment`): border **1.34-1.43:1**, and the chip's fill is identical to its surround (1.00:1), so the border is its **only** boundary. | **Shared, worse in light.** Dark measures 1.72:1 — also below 3:1. |
| **L-04** | **S3** | Two Overview cards have no shadow and no border | `index.css:331`, `:339-344`; `pages/Dashboard.tsx:400` | `MEASURED`. Census across 8 routes: **99 cards, 97 with a visible edge, 2 edgeless** — both on `/`, both `bg-dark-800 rounded-card`, 944×267 and 944×201, at **1.07:1** with `box-shadow: none` and `border-width: 0px`. Cause: the elevation selectors are `.bg-dark-800.rounded-xl` and `.bg-dark-800.border`; `rounded-card` matches neither. Source: 76 of 108 `bg-dark-800` sites still use `rounded-xl` (safe), 3 use `rounded-card` (orphaned). | **Both themes, identical 1.07:1.** A regression introduced by `75e1ede`'s own card-token migration. |
| **L-05** | **S3** | Text input fill is indistinguishable from the card it sits on | `index.css:167-173` | `MEASURED` on `/account` and `/login`. Input fill `#f7f7fb` vs white card **1.07:1**. Combined with L-03's 1.43:1 border, a light-mode input has no strong edge on either cue. Dark mode: fill-vs-card **1.22:1**, border 1.72:1. | **Shared, worse in light.** |
| **L-06** | **S3** | Placeholder text at 2.40:1 | `index.css:175-178` | `MEASURED`/computed. `#94a3b8` on the `#f7f7fb` input fill = **2.40:1** against a 4.5:1 requirement. Dark mode's `placeholder-slate-600` `#475569` on `#1e293b` = **1.93:1** — worse. | **Shared. Light is the better of two failures.** |
| **L-07** | **S3** | Hover feedback collapses to 1.01:1 | `index.css:529`, `:582` | Computed from the exact declarations. `.nav-item:hover` = `rgb(var(--dark-700) / 0.55)` → `#ebe9f4` over `#eceaf6` = **1.01:1**. `.time-pill:hover` = `#eeedf5` over `#f2f1f8` = **1.04:1**. Dark equivalents: **1.11:1** both. The paired `color` change to `--text-base` still fires (`#475569` → `#0f172a`), so the affordance is degraded, not absent. | **Shared, worse in light.** |
| **L-08** | **S3** | Engine hues sit ≥3:1 on white but drop below on the tinted light surfaces | `lib/planConfig.ts:126-134` | `MEASURED` swatch rendering + computed. ChatGPT `#16a34a`: card `#ffffff` **3.30** (observed live, 14 instances on `/sentiment`), canvas `#f7f7fb` **3.08** (observed live), nav `#eceaf6` **2.77**, bar `#f2f1f8` **2.94**, tinted row `#eae9f2` **2.74**. Claude `#ea580c`: nav **2.99**, tinted row **2.96**. The comment at `planConfig.ts:99-104` asserts every value "clears 3:1 against all three real surfaces" and enumerates exactly one light surface (`#ffffff`) — the app paints on at least four more. | **Light-specific.** The palette itself does not fork by theme (J1); the surfaces do. |
| **L-09** | **S3** | Light sentiment ramp: positive and neutral are 1.05:1 apart and adjacent in the same bar | `index.css:96-98` | `MEASURED` on `/sentiment`. The OVERALL BREAKDOWN bar renders `#4d7c0f` (582px) directly abutting `#64748b` (191px) in one 12px-tall bar. Luminance contrast between them **1.05:1**; ΔE2000 39.7 normal but **8.5 under tritanopia**. Dark ramp's same pair: **1.30:1**. `positive/negative` ΔE **11.4 under deuteranopia**. | **Light-specific.** The ramp forks by theme (`index.css:57-59` vs `:96-98`); light's is the weaker fork. |
| **L-10** | **S3** | Score-ring "%" glyph at 2.85:1 | `pages/Dashboard.tsx:434` | `MEASURED` on `/`. `fill={theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)'}` → light **2.85:1** at 14px/500 (not large text, so 4.5:1 applies); dark **6.09:1**. | **Light-specific**, and explicitly forked in the ternary — the light branch was simply set too pale. |
| **L-11** | **S3** | `border-dark-500` is an undefined token at 11 call sites | `tailwind.config.js:29-34` vs 11 `.tsx` lines | `SOURCE`. Config defines `dark.900/800/700/600`. `border-dark-500` appears at `AIVisibility.tsx:152,571,617,937`, `Layout.tsx:464,583,601`, `Prompts.tsx:404`, `Social.tsx:1017`, `Welcome.tsx:102`, `SocialAuthButtons.tsx:35`. Tailwind emits nothing, so these elements silently take the default border colour `#e5e7eb`, which **never themes** and measures **1.24:1** on a white card. | **Light-specific in effect** — a fixed light-grey border is invisible on light and merely wrong on dark. |
| **L-12** | **S4** | Score-ring arc gradient has a weak stop in both themes | `pages/Dashboard.tsx:406-409` | `MEASURED`/computed. Stops `#c4b5fd` → `#6d28d9`. On white: **1.85:1** and 7.10:1. On `#0f172a`: 9.67:1 and **2.51:1**. Each theme has one stop below 3:1, at opposite ends. The hero data mark on the landing page. | **Both themes.** |
| **L-13** | **S4** | Destructive Delete button renders dark navy text on red in light mode | `pages/Account.tsx:727` | Computed. `bg-red-500/90 text-white`; `index.css:126` maps `.text-white` → `#0f172a` and the exception at `:161-162` covers only `.bg-brand-500`/`.bg-brand-600`. Fill over a white card = `#f15757`. **Contrast is 5.31:1 — better than the intended white at 3.36:1.** So this is an identity/consistency defect, not an accessibility one. Same class of leak: `AIVisibility.tsx:156`, a `text-white` spinner inside a `bg-brand-500` toggle, 4.22:1 vs an intended 4.23:1. | **Light-specific**, cosmetic. |
| **L-14** | **S4** | Card elevation in light mode is at the faint end of perceptible | `index.css:339-344` | Computed. The hairline ring `rgba(15,23,42,0.05)` over white = **1.11:1**; ambient layers are 0.04 and 0.06 alpha. Within normal range for light SaaS, but it is the only edge those 97 cards have, since their fill is 1.07:1 from the canvas. | **Light-specific** (dark uses a different rule at `:327-333`). |

**Not padded.** 14 rows, every one reproduced. Findings I looked for and did **not** find are listed under "Verified passing" below — they belong in the record as much as the failures do.

---

## Verified passing in light mode

Each of these was measured and cleared. Re-filing any of them wastes a build cycle.

| Check | Measurement |
|---|---|
| **Keyboard focus ring** | **52 consecutive tab stops** on `/prompts` (10 `<a>`, 42 `<button>`), every one `:focus-visible` matched, `2px solid #7c3aed`, offset 2px, **4.79:1** against the nav surface. Zero stops without a ≥3:1 indicator. `index.css:353-360`. |
| **Sidebar divider** | Solid 1px `#64748b`, **4.00:1 vs nav / 4.45:1 vs canvas**. Clears 1.4.11. |
| **Active nav state** | Rail `#7c3aed` **5.70:1** on the active fill; text 17.85:1 vs idle 6.37:1; weight 600 vs 400. Three independent cues. |
| **Pressed time-filter pill** | Border `#7c3aed` **5.08:1** against the bar; text 17.85:1 vs 6.75:1. |
| **Scrollbar** | Thumb `#64748b` on a transparent track: **4.76:1** on white, **4.45:1** on canvas, **4.00:1** on nav. Clears 3:1 on every light surface. `index.css:285-298`. |
| **Mobile 375×812** | Bottom-nav top border **4.03:1**; active rail **4.82:1**; active label 15.10:1 vs idle 6.41:1; `documentElement.scrollWidth === innerWidth === 375` (no horizontal overflow). |
| **Body text** | `--text-base` `#0f172a` on `--dark-900` `#f7f7fb` = 16.8:1. Headings, KPI values, table cells all ≥13:1. |
| **Card census** | 99 cards across 8 routes; **97 carry a visible edge**. Only L-04's 2 do not. |
| **Chart plot background** | Measured `#ffffff` on `/sentiment` and `/competitors`. All nine engine hexes clear **3:1** there (3.30 to 5.17). The brief's expectation that a light plot background would be "usually worse" is **not** borne out for chart series — only for chips on tinted chrome (L-08). |
| **Chart chrome themes correctly** | `lib/chartTheme.ts` is consumed by 8 modules; axis ink `#64748b` measured **4.76:1** on the white plot; gridlines `#eaeaf2` at 1.20:1 (decorative, exempt, and documented as such at `chartTheme.ts:27`). |
| **`text-white` leak audit** | Grepped all 108 `text-white` sites for pairings with a solid non-brand fill. Exactly **two** leak (L-13), both cosmetic. The remaining hits are on `bg-dark-*` surfaces, where the override is correct behaviour. |
| **Engine palette, live-collecting set, normal vision** | The five engines that actually produce chart series (`chatgpt/gemini/claude/perplexity/google_ai`) separate by **ΔE 22.8 to 82.2** — comfortably above the 15 floor. See the palette section for the colour-vision caveat. |
| **Reduced motion** | `index.css:416-432` covers `.card-hover-lift` and `.animate-pulse`; `MotionConfig reducedMotion="user"` at `App.tsx:88` covers the Motion-driven half. Not re-verified behaviourally this pass (theme-independent). |

---

## Chart palette analysis

Full method: WCAG relative luminance for the 3:1 floor, CIEDE2000 for separation, Machado 2009 severity-1.0 simulation for protan/deutan/tritan. The ΔE floor of 15 is the project's own prior standard (cited in the brief and in `dashboard-visual-system.md` §17), not an invented benchmark.

### Engine marks vs light surfaces (1.4.11 floor 3.0)

| engine | hex | card `#ffffff` | canvas `#f7f7fb` | nav `#eceaf6` | bar `#f2f1f8` | tinted row `#eae9f2` |
|---|---|---|---|---|---|---|
| chatgpt | `#16a34a` | 3.30 | 3.08 | **2.77** | **2.94** | **2.74** |
| gemini | `#2563eb` | 5.17 | 4.84 | 4.35 | 4.61 | 4.29 |
| claude | `#ea580c` | 3.56 | 3.33 | **2.99** | 3.17 | **2.96** |
| perplexity | `#0891b2` | 3.68 | 3.45 | 3.10 | 3.28 | 3.06 |
| google_ai | `#db2777` | 4.60 | 4.30 | 3.87 | 4.10 | 3.82 |
| meta | `#c026d3` | 4.71 | 4.41 | 3.96 | 4.20 | 3.91 |
| deepseek | `#6366f1` | 4.47 | 4.18 | 3.76 | 3.98 | 3.71 |
| grok | `#a16207` | 4.92 | 4.61 | 4.14 | 4.39 | 4.09 |
| copilot | `#0284c7` | 4.10 | 3.83 | 3.45 | 3.65 | 3.40 |

Five cells fail. All are ChatGPT or Claude, and all are on tinted chrome rather than the white plot. This is **L-08**.

### Separation among the five engines that actually render series

| pair | normal | protan | deutan | tritan | worst |
|---|---|---|---|---|---|
| claude / google_ai | 33.0 | 39.9 | 22.5 | **6.6** | 6.6 |
| chatgpt / perplexity | 38.9 | 40.8 | 40.3 | **6.9** | 6.9 |
| chatgpt / claude | 62.2 | **12.6** | **11.2** | 66.5 | 11.2 |
| gemini / perplexity | 22.8 | 15.1 | **12.8** | **11.3** | 11.3 |
| chatgpt / google_ai | 82.2 | 42.4 | **12.8** | 68.8 | 12.8 |
| chatgpt / gemini | 56.0 | 58.1 | 55.4 | 17.8 | 17.8 |
| perplexity / google_ai | 62.1 | 18.7 | 26.7 | 62.6 | 18.7 |
| gemini / google_ai | 36.0 | 19.2 | 39.0 | 66.2 | 19.2 |
| claude / perplexity | 56.4 | 44.2 | 49.7 | 60.7 | 44.2 |
| gemini / claude | 51.9 | 60.0 | 67.1 | 65.8 | 51.9 |

**Normal vision: all ten pairs pass.** Five of ten fall below 15 under at least one simulated deficiency.

**This is not a light-mode finding and I am not filing it as one.** `ENGINE_META` deliberately does not fork by theme (`planConfig.ts:96-98`, judgement call J1), so these numbers are identical in dark mode. It belongs to whoever owns the palette, and the honest framing is that `75e1ede` **improved** the situation it inherited — the old Claude-vs-Meta pair was 9.6 at normal vision, which is a worse class of problem than 11-13 under simulation.

Two adjacent pairs in `ALL_ENGINES` display order are weak, both involving engines that never collect: `google_ai/meta` ΔE **14.7 tritan**, `meta/deepseek` ΔE **8.0 protan / 4.2 deutan**. `meta` is retired and `deepseek` is coming-soon, so these co-render as chips, never as chart series.

### Cross-semantic collisions in light mode

| engine | vs | ΔE2000 | co-render? |
|---|---|---|---|
| chatgpt `#16a34a` | sentiment.positive `#4d7c0f` | **15.8** | Yes — `/sentiment` renders engine chips and sentiment bars on the same screen |
| google_ai `#db2777` | sentiment.negative `#9f1239` | **16.4** | Yes, same screen |
| deepseek `#6366f1` | brand rail `#7c3aed` | **11.5** | Chips only |
| gemini `#2563eb` | sentiment.neutral `#64748b` | **13.5** | Yes |

The brief's "one hue, three meanings" problem is **reduced but not resolved**: green still means both ChatGPT and Positive, and pink/crimson still means both Google AI Mode and Negative. Both now sit just above the 15 floor rather than far below it. A product decision, not a defect — routed as `PRODUCT` below.

---

## Direction conformance

| Directive | Status | Evidence |
|---|---|---|
| Dark-mode first | **MET** | `:root` is dark; `html.light` is the override layer; `themeContext.tsx:15` defaults to `'dark'`. |
| Light mode as a supported second theme | **PARTIAL** | 12 of 14 findings are ≤S3 and 6 are shared with dark. Two — L-01 and L-11 — are light-only failures with no dark-mode analogue. |
| Zero dead-ends | **N/A this pass** | Theme-independent; covered by the 2026-07-26 census (52% reachable). Not re-run. |
| Cmd+K command palette | **ABSENT** | Not present. Theme-independent, out of scope, already on record. |
| Slide-over panels | **MET** | Sidebar is a fixed overlay below 768px; measured working at 375. |
| Deep-linking | **MET** | All 12 shell routes are real paths under `BrowserRouter`; SPA navigation preserved my injected instrumentation across 9 route changes, confirming no full reloads. |
| Glassmorphism | **PARTIAL** | `.bg-surface-nav-95` exists (`index.css:457`) but nothing on the measured routes used it; light-mode elevation is flat-shadow paper, not glass. Appropriate for light. |
| Micro-interactions | **PARTIAL** | Motion tokens and `.card-hover-lift` are real, but the nav/pill hover background step is 1.01:1 (L-07). |
| Spatial hierarchy | **PARTIAL** | Depth order nav (`#eceaf6`) < canvas (`#f7f7fb`) < card (`#ffffff`) is coherent and intentional, but the total range is 1.11:1 — the whole hierarchy rests on borders and shadows, so L-03 and L-04 cost more here than they would in a higher-contrast system. |
| React / Vite / react-router | **MET (differs, no user cost)** | Vite 5 + `react-router-dom` 6. Deep-linkable, no full reloads. Not a defect. |
| Tailwind | **MET** | v3.4.4, `darkMode: 'class'`. |
| Framer Motion | **MET** | Present as `motion` v12 — the current package name. Not missing. |
| Shadcn/ui | **ABSENT (not worth adding)** | Primitives are hand-rolled. `EngineChip.tsx:15-17` deliberately renders a real `<button>` so it inherits the app's focus ring, and 52 of 52 measured tab stops confirm that works. Composability is fine; adopting a library would cost a migration and buy nothing measured here. |
| Wagmi / Viem | **N/A** | No wallet or chain surface anywhere in the product. Stated once, not revisited. |

---

## Routed out

**`PRODUCT` — engine/sentiment hue overlap.** ChatGPT-green vs Positive-green (ΔE 15.8) and Google-AI-pink vs Negative-crimson (ΔE 16.4) both clear the floor but keep one hue family carrying two meanings on `/sentiment`. Resolving it means either moving an engine off its brand hue (the owner previously ruled that ChatGPT keeps green) or moving the sentiment ramp off green/red entirely. That is a brand decision, not a contrast fix, and it should not be ranked against the craft defects above.

---

## Method, and what it cost

- Production parity was confirmed **before** any finding was written: `index-CUv7bb9H.css` and `index-DxW86GWE.js` were downloaded from `app.getbrandgeo.com` and checked for all 22 tokens, hexes and class names the findings depend on. Every one is present. Findings apply to the live app.
- The live app is auth-gated and I have no credentials, so measurement ran against a **local dev server in demo mode** (`npx vite --port 5199` with `VITE_SUPABASE_URL` forced to a placeholder, triggering `isDemoMode` at `supabase.ts:15`). Same source tree as `HEAD`, same CSS as production.
- Light mode was set via `localStorage['brandgeo-theme']` on `localhost:5199` only. **The user's real preference on `app.getbrandgeo.com` was not touched** — that is the constraint that blocked the 2026-07-26 audit, and it is satisfied by measuring a different origin.
- Contrast was computed from `getComputedStyle`, compositing alpha up the ancestor chain to a real opaque backdrop rather than assuming one.
- **One measurement artifact caught and discarded.** The first reading showed `body` at `rgb(10,15,30)` — the dark value — with `html.className === "light"` and `--dark-900` correctly resolved to `247 247 251`. That looked like a catastrophic bug. It was not: the Browser pane was not compositing frames, so `body`'s `transition: background-color 0.2s` (`index.css:113`) never advanced past its start value. Injecting `*{transition:none}` returned the correct `rgb(247,247,251)`. **Light mode applies correctly.** This is recorded because reporting that non-bug would have been the worst outcome of the audit.

---

## What was not audited

- **The admin Engine Configuration panel was never rendered.** L-01 is the single highest-severity finding and it is `SOURCE`-derived, not observed — the panel is `isAdmin`-gated and demo mode provisions a viewer. The numbers come from the exact token values at `AIVisibility.tsx:148-152` and `tailwind.config.js:29-34`, and the `border-dark-500` fallback depends on Tailwind's default border colour, which I did not confirm in the built stylesheet. **Someone with an admin login should eyeball this before the fix is scoped.**
- **`/usage` was not reached** — no sidebar link renders for it in demo mode (`NOLINK /usage`). Admin-only. Unmeasured.
- **`/onboard`, `/welcome`, `/signup`, `/reset-password`, `/audit`, `/audit/:token`** — not visited. `/signup` and `/welcome` are the first authenticated surfaces a new customer sees and they share the input styling that produced L-03, L-05 and L-06, so they are likely to inherit those three; that is an inference, not a measurement, and it is not filed as a finding.
- **Multi-engine chip adjacency was never observed.** The demo tenant has only ChatGPT active, so every one of the 15 chips I measured was the same green. L-08's cross-engine numbers are computed, not seen side by side. A tenant on Growth or above would render five.
- **Charts with populated series were not measured.** Recharts surfaces on `/sentiment` and `/competitors` rendered gridlines and axes only under demo data; the data-bearing bars on those pages turned out to be div-based and were measured, but no Recharts `<Bar>`/`<Line>` fill was observed against the light plot. The plot background (`#ffffff`) and the palette-vs-surface math are solid; the rendered series are not.
- **Hover was computed, not triggered.** L-07's 1.01:1 comes from the exact declaration at `index.css:529` composited over the measured nav surface. The pane could not composite frames, so no real `:hover` was captured.
- **Tooltips, modals, toasts, and the client-switcher / market-picker overlays** were not opened.
- **Print styles, forced-colors / Windows High Contrast, and zoom to 200%** — not tested.
- **Lens 2 (navigation, dead-end census) was not re-run.** It is theme-independent and was covered on 2026-07-26. The Lens 2 score above is carried forward, not re-earned.
- **No rewrite is warranted.** Every finding is a token value or a selector, and the design system underneath them is sound. I say this once, here, so it is on the record: the light theme does not need rebuilding.

---

## Fix specs

```
FIX L-01
FILE:     brandgeo-dashboard/src/pages/AIVisibility.tsx (lines 148-152)
CHANGE:   Replace the OFF-state classes `bg-dark-600 border-dark-500` with a track
          fill and border that each clear 3:1 against a white card in light mode
          AND against #0f172a in dark. `border-dark-500` must go regardless — it is
          an undefined token (see FIX L-11). The ON state (bg-brand-500) already
          measures 4.23:1 and needs no change.
ACCEPT:   With html.light applied and an admin session: computed knob-vs-track >= 3.0,
          track-vs-card >= 3.0, and border-vs-card >= 3.0. Same three >= 3.0 with
          html.light removed. A reviewer can tell ON from OFF at a glance in both themes.
RISK:     The toggle is the only control using this pattern, so blast radius is one
          component. Re-check the disabled state (`disabled:opacity-50`) still reads
          as disabled once the track is darker — opacity 0.5 on a 3:1 track may land
          near 1.7:1.
EFFORT:   S
```

```
FIX L-02
FILE:     brandgeo-dashboard/src/index.css (lines 131-132)
CHANGE:   `.text-slate-500` and `.text-slate-600` currently both resolve to #64748b in
          light mode. Pick a value that clears 4.5:1 against the WEAKEST surface muted
          text is painted on, which is the tinted table row #eae9f2 — not #ffffff.
          Consider splitting them again so slate-500 and slate-600 are not forced to
          share one value.
ACCEPT:   Sweep every route with html.light: zero text elements below 4.5:1 (or 3:1 at
          >=24px, or >=18.66px bold). Specifically "MARKET", "Edit", "LOCKED",
          "Mentioned", "— last checked", "Loading recommendations…", and the /login
          footer all report >= 4.5.
RISK:     Darkening the muted token flattens the hierarchy against --text-secondary
          (#475569). Check that muted text still reads as secondary next to body text
          on /prompts and /mentions, where the two sit adjacent in table rows.
EFFORT:   S
```

```
FIX L-03
FILE:     brandgeo-dashboard/src/index.css (line 70, --dark-600 in html.light;
          and lines 165, 172 which hardcode the same #d8d6e6)
CHANGE:   Raise the light-mode --dark-600 so it clears 3:1 against #ffffff. Update the
          two hardcoded `rgb(216 214 230)` literals at :165 and :172 to read the token
          instead of restating it, so this cannot drift again. Consider whether dark
          mode's --dark-600 (#334155, 1.72:1 on #0f172a) should move in the same pass —
          it fails the same criterion.
ACCEPT:   Computed border-vs-card >= 3.0 for: any <input> on /account and /login, and
          any .engine-chip on /sentiment. Verify in both themes.
RISK:     --dark-600 is also a background (`bg-dark-600`) and the OFF toggle track.
          Darkening it as a BORDER may over-darken it as a FILL. If so, split into two
          tokens (--border-strong and --surface-raised) rather than compromising one.
          Re-check /prompts and /onboard, which use bg-dark-600 heavily.
EFFORT:   S
```

```
FIX L-04
FILE:     brandgeo-dashboard/src/index.css (lines 327-333 dark, 339-344 light)
CHANGE:   The elevation selectors key off `.rounded-xl` and `.border`. Add `.rounded-card`
          to both rule sets, or invert the mechanism so elevation attaches to a single
          explicit `.card` class that every surface opts into. The latter is the durable
          fix — the current selectors will break again the next time a radius utility
          is renamed.
ACCEPT:   Card census across /, /ai-visibility, /competitors, /mentions, /prompts,
          /account, /social: every element matching [class*="bg-dark-800"] with width
          > 80px and height > 40px has either a computed box-shadow !== 'none' or a
          border whose contrast against the canvas is >= 1.3. Count of edgeless cards
          drops from 2 to 0. Verify in both themes — both currently measure 1.07:1.
RISK:     Adding .rounded-card to the selector will also apply elevation to the third
          rounded-card call site, which may not want it. Check all 3 sites (grep
          "rounded-card") render as intended before shipping.
EFFORT:   S
```

```
FIX L-07
FILE:     brandgeo-dashboard/src/index.css (line 529 .nav-item:hover,
          line 582 .time-pill:hover)
CHANGE:   `rgb(var(--dark-700) / 0.55)` is nearly the nav surface itself in light mode.
          Give the hover state a background that steps a measurable amount away from the
          rest surface in BOTH themes — either a theme-forked hover token, or a value
          chosen against the nav surface rather than borrowed from --dark-700.
ACCEPT:   Computed hover-fill vs rest-surface >= 1.2 in light and >= 1.2 in dark, for
          both .nav-item and .time-pill. (1.2 is a perceptibility floor for a hover
          affordance, not a WCAG threshold — hover is not a 1.4.11 state.)
RISK:     The hover fill must not approach the active fill (#ffffff light /
          #3a2f71 dark), or hover will read as selected. Check a hovered inactive item
          against the active item side by side.
EFFORT:   S
```

Specs for L-05, L-06, L-08 through L-14 follow the same shape and can be expanded on request via `/fix-spec <id>`.

---

*Audited read-only. No file outside `docs/audit/` was created or modified. The dev server started for measurement was stopped on completion.*
