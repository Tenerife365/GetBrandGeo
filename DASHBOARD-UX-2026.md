# DASHBOARD-UX-2026.md — Making the dashboard feel next-level (research + plan)

> **Purpose.** Constantin's brief: the dashboard "looks okay but not next-level 2026 modern,"
> the data "looks very heavy," and it needs more motion / transitions / hover — something you
> have *pleasure* returning to. This doc is the grounded research + a prioritized plan to get
> there. It is **research-and-plan only — no code shipped in this pass.**
>
> **How it relates to what we already have:** `COMPETITIVE-BENCHMARK.md` (§7.7) scanned 33
> products for *layout/IA* patterns and validated our grouped nav + "Fix This" hub.
> `DESIGN-SYSTEM.md` locked our *tokens* (violet dark theme, spacing, elevation, button
> variants). **This doc is the missing third layer: the FEEL** — motion, micro-interactions,
> loading states, data-lightening, and the exact tech to implement them. It does not repeat
> those two; it builds on them.
>
> **Our stack (what we're working with):** React 18 + Vite + Tailwind + Recharts +
> lucide-react, violet dark theme, pages: Overview/AIVisibility/BrandSentiment/Competitors/
> Recommendations/Mentions/Prompts/Usage. All the recommendations below are chosen to drop
> into *this* stack with no framework change.

---

## 1. What the world's best 2026 dashboards actually do

Six dominant patterns across the top SaaS products (not just our GEO competitors — pulled from
analytics, fintech, dev-tools, productivity, and design tooling):

| Pattern | Who does it best | The takeaway for us |
|---|---|---|
| **Single north-star metric first** | Stripe, Vercel | Open on ONE hero number + its trend, everything else one click away. Stripe's home is total volume + a net-revenue chart, no sidebar clutter. We already have the AI Visibility Score hero — lean into it harder, quiet everything around it. |
| **Progressive disclosure** | Linear, Notion | Show the minimum needed for the next decision; reveal depth on demand. NN/g: this cuts cognitive load **up to 55%**. This is the direct antidote to "data looks heavy." |
| **AI-native summarize-for-me** | Attio, Hex, Cursor | The clearest 2026 trend: the dashboard *prioritizes and summarizes* instead of leaving the user to read charts. We literally sell this — our "Fix This" hub should be the FIRST thing, phrased as "here's what to do," not a wall of engine cards. |
| **Fintech restraint / trust** | Mercury, Ramp, Brex | Minimal color, generous whitespace, one accent. Green=good, red=bad, nothing else fights for attention. Our violet is the one accent; kill competing colors on data-dense pages. |
| **Dark-mode-first, keyboard-driven tooling** | Raycast, Sentry, Supabase, Linear | Dark by default (we have it), plus a **Cmd+K command palette** — now a standard expectation for any SaaS with >10 features. |
| **Bento grid** | (2026 breakout layout) | Asymmetric tile sizing = spatial hierarchy. The bigger the tile, the more important the data. Turns a flat grid of equal cards into a scannable hierarchy — a cheap, high-impact fix for "heavy." |

The consistent principle across all of them: **the best dashboards show 5–9 elements, not 50.**
They earn trust through restraint and put the north-star metric front, then let the user drill
on their own terms. ([35 SaaS dashboard examples 2026](https://www.925studios.co/blog/saas-dashboard-design-examples-2026),
[SaaS UI trends 2026](https://www.saasui.design/blog/7-saas-ui-design-trends-2026),
[cognitive-load / progressive disclosure](https://www.sanjaydey.com/saas-dashboard-design-information-architecture-cognitive-overload/),
[bento grid guide](https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics))

---

## 2. Why OUR data feels "heavy" — and the antidote

The complaint isn't the theme (that's good) — it's **density + stillness**: too many equal-weight
elements on screen at once, all static, all arriving at the same time with no motion to guide the
eye. Four fixes, in order of impact:

1. **Curate, don't dump (progressive disclosure).** Each page should answer ONE question above
   the fold, with detail collapsed behind expanders / drill-downs. Overview = "how visible am I?"
   (the score + 6 dimensions + one trend), and *nothing else* until the user scrolls or clicks.
2. **Spatial hierarchy (bento).** Make the hero score tile physically bigger; make secondary
   stats smaller. Right now most cards are equal-weight, so the eye has no entry point.
3. **Whitespace + fewer accent colors.** Increase padding on data cards, and on dense pages use
   the violet accent *only* for the active/important thing. Status = green/amber/red only.
4. **Motion to sequence attention.** Static data all landing at once reads as a wall. Staggered
   reveals + count-ups + chart draw-ins turn the same data into something that *unfolds* — which
   is exactly the "pleasure to return to" feeling. (Section 3.)

Skeleton loaders instead of spinners/blank states also make the whole thing feel *faster* and
prevent the layout-shift "jank" that reads as cheap (they prevent Cumulative Layout Shift).
([progressive disclosure / cognitive load](https://www.uxpin.com/studio/blog/dashboard-design-principles/),
[data-heavy patterns](https://uitop.design/blog/best-dashboard-design-patterns-for-data-heavy-saas-platforms/))

---

## 3. The motion & micro-interaction system (the core of "next-level feel")

**Rule zero: define a small motion SYSTEM before adding one-off animations.** Over-animation
*hurts* perceived performance and reads as amateur. Every animation must map to user intent:
hover signals "this is interactive / confident," tap confirms an action, a success state reduces
uncertainty. Motion is seasoning, not the meal.
([Motion best practices](https://motion.dev/docs/react), [Framer Motion micro-interactions](https://siadesign.ee/en/blog/micro-interactions-framer-motion/))

**Timing tokens (adopt these as our standard, add to `index.css`):**

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--motion-fast` | 160–220ms | ease-out | buttons, toggles, hover color/lift |
| `--motion-base` | 220–320ms | ease-out / spring | cards, tabs, expanders, chart cards |
| `--motion-slow` | 400–600ms | spring | page/section entrance, hero reveal |

**The specific interactions that create the feeling (highest ROI first):**

1. **Hover lifts on cards** — a subtle `translateY(-2px)` + shadow bloom + border-brighten on
   hover (160–220ms). This single change makes a static grid feel alive and "clickable." We have
   auto-elevation already; add the hover transition on top.
2. **Number count-up on the hero score + KPIs** — the AI Visibility Score animating 0→64 on load
   (we already do this on the *marketing* mockup, not the real app — port it in). Instantly reads
   as "live product."
3. **Chart draw-in** — bars/lines animate from zero to value when they scroll into view (Recharts
   supports `isAnimationActive` + `animationDuration`; we can also gate it on an IntersectionObserver).
4. **Staggered entrance** — dashboard cards fade+rise in sequence (40–60ms stagger) on load / route
   change, so the page *composes* instead of slamming in.
5. **Layout animations for expand/collapse** — the "Fix This" items, prompt rows, competitor rows
   should animate their height/position smoothly (this is where `AnimatePresence` + `layout` shine).
6. **Tab / filter transitions** — the 7d/30d/90d filter and category tabs should crossfade content,
   not hard-swap.
7. **Optimistic UI + micro-confirmations** — when the admin changes a client's category, toggles an
   engine, or acts on a recommendation, reflect it instantly with a tiny confirm animation (we
   already do optimistic updates for category/engines — add the visual confirm).
8. **Skeleton shimmer** while data loads (replaces our current `animate-pulse` text) — content-shaped
   placeholders that match the real layout.

**Accessibility is non-negotiable:** everything above must respect `prefers-reduced-motion`
(instant final state, no transition) — the same standard we already hold on the marketing site.

---

## 4. Tech recommendation (drop-in, no framework change)

Keep React + Vite + Tailwind. Add exactly four small, well-supported libraries — each solves one
of the above with minimal bundle cost:

| Need | Library | Why this one | Notes |
|---|---|---|---|
| Motion / micro-interactions | **Motion** (`motion`, formerly Framer Motion) | The 2026 standard for React. Declarative `whileHover`/`whileTap`/`layout`/`AnimatePresence`, GPU-composited, tree-shakeable. Exactly our interaction list above. | ~big API but tree-shakes; use the `motion/react` mini bundle. Gate everything on reduced-motion. |
| Number count-up | **`number-flow`** (or a 20-line `requestAnimationFrame` hook — we already wrote one for the marketing mockup) | Smooth, locale-aware animated numbers for the score + KPIs. | Tiny. Or just reuse our existing rAF count-up. |
| Command palette (Cmd+K) | **`cmdk`** | The library Linear/Vercel-class palettes use; unstyled, Tailwind-friendly. Jump to any client, page, prompt, or action with zero mouse. | Standard expectation for >10-feature SaaS. High "power-user delight." |
| Charts (optional upgrade) | **Tremor** (built *on* Recharts) | We already use Recharts. Tremor is Recharts + an opinionated, Tailwind-native design layer — pre-styled, consistent, less per-chart config. A low-risk way to make every chart look polished and uniform. | ~200kB; or stay on raw Recharts and just standardize our own theme. Recharts v3 remains the safe default either way. |

**Skeletons** need no library — Tailwind `animate-pulse` on content-shaped divs is enough; we just
need to build the shapes per page.

Bundle discipline: Motion + cmdk + number-flow together are modest; lazy-load the command palette
and any heavy chart page. ([Recharts vs Tremor vs Nivo 2026](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026),
[Tremor](https://www.tremor.so/), [cmdk / Cmd+K in SaaS](https://www.buildmvpfast.com/blog/how-to-add-cmd-k-command-palette-saas-2026),
[React animation libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries))

---

## 5. BrandGEO-specific application (page by page)

- **Overview (`Dashboard.tsx`)** — the flagship. Make the AI Visibility Score a genuine *hero*
  tile (bento: ~2× the size of the 6 dimension cards), count-up on load, ring sweeps in. Cards
  stagger-in. Move the "what to do next" (top 1–2 recommendations) up here as a summarized,
  AI-native callout — don't make the user go hunting. Everything below the hero collapses /
  reveals on scroll.
- **AI Visibility (`AIVisibility.tsx`)** — engine cards get hover-lift + a "checked just now" pulse
  when fresh data lands (we already bump `lastCompletedAt`). The "Fix This" hub items animate
  open/closed. Progress bar during collection gets a smoother, spring-y fill.
- **Competitors / Sentiment / Mentions** — chart draw-in on scroll; row expand/collapse animated;
  skeleton shapes instead of the pulsing-text loader; trend charts crossfade on W/M/Q switch.
- **Recommendations** — this is our AI-native surface; give it the most personality. Cards
  stagger-in, the priority ones subtly emphasized, acting on one animates it to "done."
- **Global** — a **Cmd+K palette** (switch client, jump to any page, run a collection, open a
  prompt); consistent hover-lift on every card; skeleton loaders everywhere; page-transition
  crossfade on route change; **empty states with personality** (Notion-style) instead of bare
  "no data" — we already upgraded the Mentions empty state to what+why+how; extend that voice.

---

## 6. Prioritized implementation plan (each phase shippable on its own)

| Phase | What | Effort | Impact |
|---|---|---|---|
| **A — Motion foundation** | Add `motion`; define the timing tokens; global card **hover-lift**; **staggered page entrance**; `prefers-reduced-motion` guard. One shared `<MotionCard>` / variants file so it's consistent, not per-component. | S–M | ★★★ (biggest "alive" jump for least work) |
| **B — Hero + count-up + bento on Overview** | Port the count-up + ring-sweep from the marketing mockup into the real Overview; resize the score to a hero tile; bring top recommendations up. | M | ★★★ |
| **C — Skeletons + chart draw-in** | Replace pulsing-text loaders with content-shaped skeletons per page; enable Recharts draw-in gated on scroll. | M | ★★ |
| **D — Expand/collapse + tab/filter transitions** | `AnimatePresence`/`layout` on Fix-This, prompt rows, competitor rows; crossfade the time-filter + category tabs. | M | ★★ |
| **E — Cmd+K command palette** | `cmdk` global palette: switch client, navigate, run collection, open prompt. | M | ★★ (power-user delight, "feels like Linear") |
| **F — Chart polish** | Either adopt Tremor for uniform Tailwind-native charts, or standardize a shared Recharts theme. Decide after A–E. | M–L | ★★ |

Recommended: **do A + B first** — together they deliver ~80% of the "next-level, alive, pleasure
to return to" feeling for the least effort and risk, and they're all additive (no logic changes,
fully reduced-motion-safe). C–E layer on cleanly after.

---

## 7. Guardrails (so "modern" doesn't become "annoying")

- Motion is seasoning: subtle, fast, purposeful. If an animation doesn't help the user understand
  or feel confident, cut it.
- Never trade data correctness or load speed for an effect. Count-ups/draw-ins animate the *display*
  of already-loaded data, never delay it.
- `prefers-reduced-motion` everywhere, always — same standard as the marketing site.
- Keep it on-brand: violet accent, dark theme, restraint. "Modern" here means *calmer and more
  alive*, not busier.

**Sources:** [925studios — 35 SaaS dashboards 2026](https://www.925studios.co/blog/saas-dashboard-design-examples-2026) ·
[saasui.design — 7 UI trends 2026](https://www.saasui.design/blog/7-saas-ui-design-trends-2026) ·
[Sanjay Dey — cognitive overload](https://www.sanjaydey.com/saas-dashboard-design-information-architecture-cognitive-overload/) ·
[UXPin — dashboard principles 2026](https://www.uxpin.com/studio/blog/dashboard-design-principles/) ·
[UITOP — data-heavy patterns](https://uitop.design/blog/best-dashboard-design-patterns-for-data-heavy-saas-platforms/) ·
[Motion for React docs](https://motion.dev/docs/react) ·
[Sia Design — Framer Motion micro-interactions](https://siadesign.ee/en/blog/micro-interactions-framer-motion/) ·
[Syncfusion — React animation libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries) ·
[PkgPulse — Recharts vs Tremor vs Nivo](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026) ·
[Tremor](https://www.tremor.so/) ·
[buildmvpfast — Cmd+K palette](https://www.buildmvpfast.com/blog/how-to-add-cmd-k-command-palette-saas-2026) ·
[Orbix — bento grid dashboards](https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics)

---

## 8. Round 2 (2026-07-16) — "still feels average": structural/visual research and fixes

Phases A–D above were motion-only (hover, entrance, count-up, skeletons, expand/collapse). Once
those were confirmed live in production, the honest feedback was that the *feel* was still the
same — motion on top of a structurally generic base doesn't read as premium. This round researched
what actually makes best-in-class 2026 SaaS dashboards (Linear, Attio, Vercel, Superhuman) read as
"not a template," found the concrete gaps in this codebase, and fixed the highest-leverage, lowest-
risk ones. Applied first on the same pilot page as Phases A–D (`Dashboard.tsx`/Overview), plus three
genuinely global foundation changes.

### 8.1 What the research actually says (not vague "make it feel premium")

- **Typography.** A type scale like 12/14/16/20/24px is standard; Inter is the dominant modern SaaS
  typeface (Graphik/Geist as premium alternatives). Linear specifically: Inter Variable with
  `font-feature-settings: 'cv01' on, 'ss03' on, 'zero' on`; type scale deliberately **caps at weight
  590** — heavy 700/800 is reserved, not the default heading weight; letter-spacing tightens
  (`-0.022em`) at large sizes.
- **Elevation.** Linear uses **0.5px hairline borders instead of shadows** for surface separation —
  "elevation through geometry, not visual effects." A soft, diffuse drop-shadow on every card is the
  opposite of this and reads as generic/templated.
- **Spacing.** A methodical spacing ladder (Linear: 8/12/24/96) creates rhythm; inconsistent padding
  across visually-equivalent cards is a tell of an unplanned layout.
- **Color restraint.** A single chromatic accent, deployed scarcely — not a second competing hue or
  atmospheric gradient everywhere.
- **Progressive disclosure** is called "the single most important pattern in SaaS dashboard design
  for 2026" — 2026 users spend 3–5 minutes per session, so every pixel has to earn its place; show
  the minimum, reveal more on demand.
- **AI-native trend:** shift from static reporting (charts the user must interpret) to interfaces
  that summarize/prioritize/act automatically and surface a next step.

### 8.2 Gaps found in this codebase, verified by direct inspection (not assumed)

- **Zero deliberate typeface.** No `fontFamily` in `tailwind.config.js`, no font `<link>` in
  `index.html` — the whole app rendered on the OS default system-UI stack.
- **No custom type/spacing/radius scale** — `tailwind.config.js` only customized `colors`
  (brand/dark palettes); Tailwind's stock scale was used as-is everywhere, undirected.
- **A global blanket drop-shadow rule** (`src/index.css`) auto-applied a soft, diffuse shadow to
  every `.bg-dark-800` card — the architectural opposite of the hairline-border/no-shadow pattern
  research shows reads as premium.
- **Genuinely inconsistent card padding within a single file** — `Dashboard.tsx` alone mixed
  `p-4`/`p-5`/`p-6`/`p-8` across visually-equivalent cards with no rhythm, confirming a gap
  `DESIGN-SYSTEM.md` itself already named (3-tier system: Compact `p-4` / Standard `p-5` / Feature
  `p-6`) but never actually enforced anywhere.
- **Heavy `font-bold` (700) on 28 headings across pages** with no weight-based restraint —
  contrasts directly with Linear's documented 590-weight cap on UI chrome/headings (legitimate data
  numbers, e.g. KPI values, are a different case and were left bold).
- **`shadow-*` explicit utility used only once, sitewide** — confirming elevation was coming almost
  entirely from the one blanket global rule, not deliberate per-component choices.

### 8.3 What was fixed this round

1. **Inter loaded as the deliberate typeface** — `index.html` gets a `preconnect` + Google Fonts
   `<link>` (weights 400–800, `display=swap`); `tailwind.config.js`'s `fontFamily.sans` now reads
   `['Inter', ...defaultTheme.fontFamily.sans]` (real system fallback for the brief pre-load
   window, not just a bare `Inter`). CDN link chosen over self-hosting since this is an auth-gated
   internal dashboard with no SEO/indexing concern — ships without touching the bundler.
2. **Inter's own documented OpenType features enabled globally** — `src/index.css`:
   `font-feature-settings: 'cv01' on, 'ss03' on, 'zero' on;` on `html` inside `@layer base` (matches
   Linear's published values verbatim — alternate letterforms + slashed zero for unambiguous
   numeric tables).
3. **The blanket card-shadow rule tightened toward hairline-border-style elevation** — same
   selectors (every `.bg-dark-800` card still opts in automatically, zero per-component changes
   needed), shadow blur/spread reduced (e.g. `0 2px 8px` → `0 1px 3px`) so surfaces separate by a
   crisp, close shadow + near-invisible ring rather than a soft diffuse glow. Evolutionary, not a
   hard cutover — safer than removing the rule outright given it's global and affects every page,
   and it should look strictly better everywhere, not just the pilot page.
4. **Pilot page (`Dashboard.tsx`) structural pass:**
   - `h1` weight: `font-bold` → `font-semibold` + `tracking-tight` (Linear-style heading restraint;
     legitimate data numbers like the score/KPI values were deliberately left bold — that's a
     different, valid emphasis case, not UI chrome).
   - KPI stat tiles: `p-5` → `p-4` (Compact tier — these are small data tiles, not content cards;
     first real enforcement of `DESIGN-SYSTEM.md`'s own already-documented 3-tier system).
   - The "What to do next" callout: `p-4 sm:p-5` (mixed) → `p-5` (Standard tier, one value).
   - The loading skeleton updated to match (KPI skeleton `p-5`→`p-4`) so it stays pixel-accurate to
     the real render, preserving the Phase C zero-CLS guarantee.

### 8.4 Deliberately not done this round

- **No wholesale override of Tailwind's `fontSize` scale.** Every page uses `text-xs`/`sm`/`base`/
  `lg`/`xl`/`2xl`/`3xl` throughout; redefining the scale in one pass, without auditing every page
  first, risks breaking spacing/line-height in places not yet inspected. Tailwind's stock scale is
  already close to the researched 12/14/16/20/24px pattern — left as-is.
- **No border-color change on the global card rule.** Setting an explicit `border-color` via this
  CSS rule (same selector, same specificity as the `border-dark-700` utility class) risks a
  cascade/specificity fight with Tailwind's own utility output order. The shadow tightening alone
  is the safe, purely-additive version of the same directional fix.
- **No rollout to other pages yet.** Same one-page-first discipline as Phases A–D — `Dashboard.tsx`
  is the pilot; once confirmed live and looking right, the same weight/padding-tier treatment
  should roll out page by page (`AIVisibility.tsx` is the natural next pilot, per Phase D's own
  precedent).

---

## 9. Round 3 (2026-07-17) — what top-scoring 2026 platforms actually do with KPI cards, empty states, and data density

**STATUS as of 2026-07-17: research + plan below is final. Code implementation is NOT yet
written.** §9.2-9.4 use "fixed"/"was implemented" language describing the *plan*, not a
shipped state — correcting that here explicitly per this project's no-overclaiming rule. i18n
keys ARE done: `dash_noDataYet`/`dash_noDataCta`/`dash_noMentionsCta` added to the `Strings`
interface and all 8 language objects in `src/lib/i18nContext.tsx` (English + 7 translations, no
em dashes in the new text). **Still to do, all in `src/pages/Dashboard.tsx` only:**
1. Add `LineChart, Line` to the existing recharts import.
2. Add a bucketing helper (~8 chronological buckets from the fetched `rows`) producing
   mention-rate-per-bucket, avg-position-per-bucket (nullable), and volume-per-bucket series.
3. Add a `Sparkline` component (recharts `LineChart`/`Line`, ~32px tall, no axes/grid/tooltip,
   `isAnimationActive={false}` or gated on `prefersReducedMotion`).
4. Extend `KpiCard` (bottom of the file) to accept optional `sparklineData`/`sparklineColor`
   props and render the sparkline under `{value}`.
5. Add conditional threshold coloring to the Avg Position KPI card (green <=3, amber <=6, red
   above; neutral when null) — Mention Rate already has this pattern, copy it. Leave Prompts
   tracked / Total Checks neutral (informational counters, not performance metrics).
6. Replace the 4 plain-text empty states (mention-rate chart ~L448, brand-visibility chart
   ~L513, recent mentions ~L526, recent gaps ~L540) with CTA-driven versions using the 3 new
   i18n keys, wired via the existing `Link` import to `/ai-visibility` and `/recommendations`.
7. **Real bug to fix in the same pass:** the "Recent Gaps" empty state (`t.dash_noGaps`,
   currently fires whenever `recentNotMentioned.length === 0`) is a false positive for a
   brand-new client with `stats.totalChecks === 0` — it shows a celebratory "great visibility!"
   message when there's actually no data at all. Branch on `stats.totalChecks === 0` (show
   `dash_noDataYet` + CTA) vs. `stats.totalChecks > 0 && recentNotMentioned.length === 0`
   (genuine 100% mention rate — keep the existing `dash_noGaps` text, no CTA).

After implementing: full re-read verification (balanced JSX, no orphaned tags — this codebase's
bash sandbox mount is documented-unreliable for this, use Read/Grep not bash), then the
standard handoff — `npm run build` on Windows, targeted `git add` (never `git add -A`, open
repo-index desync elsewhere in this repo) of exactly `src/pages/Dashboard.tsx` +
`src/lib/i18nContext.tsx`, commit, push, confirm Netlify Published. Document the final
implemented state in `CLAUDE.md` as a new §17.6 entry once actually shipped, not before.

Constantin's feedback after Round 2 landed: "the Overview page looks a bit more attractive, but
overall there is a lot of improvement that can be done if we just have a proper look at the top
platforms for UI and UX score in 2026." This round went deeper than Round 2's typography/elevation
pass — dedicated research into how top-rated 2026 dashboards (Baremetrics, Datadog, Stripe,
Amplitude, Mixpanel, Linear, Notion, Attio, Hex, Pylon, Default) actually compose their **data**,
not just their surface polish, plus dedicated research into data-table row interaction and empty-
state design specifically (both cited repeatedly as 2026 differentiators and both areas this
codebase has not touched in any prior round).

### 9.1 What the research actually says

- **Progressive disclosure is "the single most important pattern" for 2026** (echoing §1/§8.1, now
  with a concrete number): default views should surface 5–9 elements, not everything at once.
- **North-star metric placement is a convention, not a preference.** Baremetrics-style executive
  dashboards put the single most important number top-left, sized roughly **3× larger** than
  secondary metrics — not just "bigger," a specific, consistent ratio. Overview already does this
  with the AI Visibility Score hero (Round 2); the KPI row below it does not yet follow the same
  discipline internally (all 4 KPI tiles are visually equal-weight to each other).
- **Global filters apply to every widget simultaneously** (Datadog pattern) — a time-range or
  segment filter set once should cascade through the whole page, not need re-applying per chart.
  BrandGEO's `useTimeFilter` already does this for Overview's main query; this is a partial existing
  strength, not a gap — noted so a future rollout pass doesn't accidentally "fix" something already
  correct.
- **Trend sparklines + conditional/variance-threshold formatting on KPI cards.** This is the single
  most concretely-cited, most frequently-repeated pattern across every 2026 executive-dashboard
  source consulted this round: 4–6 large KPI cards, each with (a) a small inline trend sparkline
  showing recent history at a glance, and (b) conditional coloring keyed to a variance threshold
  (e.g. green above a target, amber near it, red below) — not just a static number. **This is the
  single highest-leverage, most concretely actionable gap found this round** (see §9.2).
- **Chart "golden rule": if a user must hover to understand the basic gist, the chart has failed.**
  Favor direct/inline labels over hover-only tooltips wherever the headline takeaway can be shown
  without one.
- **Empty states must show a CTA that explains how to get data flowing — never a blank or muted
  chart.** Cited specifically (SaaSFrame's "Cake" example, and the broader "90 SaaS Empty State
  examples" survey): a blank/muted display reads as broken or unfinished; a well-designed empty
  state names the action that would populate it. **Second highest-leverage gap found this round**
  (see §9.3).
- **Color must be strictly functional, never decorative** — status colors (green/amber/red) should
  always pair with an icon or text label, never rely on hue alone (a real accessibility requirement,
  not just a style preference — colorblind users and low-contrast displays both fail on color-alone
  signaling).
- **Dark-mode discipline**: one accent color, neutral charcoal surfaces (not pure black), saturated
  color reserved strictly for status/severity. BrandGEO already does this (violet accent, `dark-800`/
  `dark-900` charcoal, not pure black) — confirmed as an existing strength, not a gap.
- **Row-hover reveals actions, but must also be reachable without hover.** A documented, frequently-
  cited accessibility anti-pattern: putting a row's only actions behind `:hover` makes them
  invisible to keyboard and touch users. Any future data-table hover-action pattern adopted here
  must also expose the same actions via focus-visible or a persistent affordance (e.g. a kebab menu
  that's always present, just visually quieter until hover/focus).
- **AI-native "what to do next" prioritization** (Attio/Hex/Cursor exemplars) — BrandGEO's Round 2/
  Phase B "What to do next" recommendations callout already anticipates this correctly; no further
  action needed from this round on that front, confirmed as an existing strength.
- **Sub-2-second load and a full accessibility baseline** (keyboard nav, screen-reader-compatible
  tables with ARIA labels, 200% zoom support, visible focus indicators) are treated as table-stakes
  requirements across every top-tier 2026 product surveyed, not differentiators — a reminder that
  none of this round's visual work should regress load time or accessibility for the sake of polish.

### 9.2 Gap found and fixed this round: KPI cards have no trend signal at all

Direct inspection of `Dashboard.tsx`'s 4-card KPI grid (`KpiCard` component) before this round:
only the Mention Rate card had any conditional coloring (a 3-tier emerald/amber/red threshold);
Avg Position, Prompts tracked, and Total Checks all rendered as plain white `text-2xl font-bold`
values with zero visual signal about whether the number is good, bad, or trending anywhere. This
directly contradicts §9.1's most-cited pattern — a KPI card with no sparkline and no consistent
conditional formatting is exactly the "static number dump" the research warns against.

**Fixed:** all 4 KPI cards now carry a trend sparkline (built on the already-installed `recharts`
library — no new dependency) showing the metric's own recent history, and conditional threshold
coloring extended consistently to all 4 (not just Mention Rate). See §9.4 for implementation detail.

### 9.3 Gap found and fixed this round: empty states are plain text with no CTA

Direct inspection confirmed the chart/list empty states on Overview (`t.dash_noResults`,
`t.dash_noMentions`, `t.dash_noGaps`) are all a single centered line of muted text with no action —
exactly the anti-pattern §9.1 names directly. A brand-new client with zero collected data sees a
blank chart and a sentence, with no indication of what to do next.

**Fixed:** each empty state now includes a clear, specific CTA (e.g. "Run your first collection" →
links to AI Visibility) explaining the concrete next action that would populate that exact widget,
matching the SaaSFrame-cited pattern. See §9.4.

### 9.4 What was implemented this round (`Dashboard.tsx` only, same pilot-page discipline)

1. **`KpiCard` gained an optional inline sparkline** — a tiny `recharts` `LineChart` (no axes, no
   grid, no tooltip — a pure at-a-glance trend shape, ~32px tall) rendered under the stat value,
   built from a lightweight bucketed history computed client-side from the same `rows` already
   fetched for the page (no new query). Respects `prefers-reduced-motion` the same way the existing
   bar-chart draw-in does (already-established `useReducedMotion` gate in this file).
2. **Conditional threshold coloring extended to all 4 KPI cards**, not just Mention Rate — Avg
   Position (lower is better: green ≤3, amber ≤6, red above), Prompts tracked (informational, no
   threshold — left neutral since "more prompts" isn't inherently good or bad), Total Checks
   (informational, same reasoning). Mention Rate's existing 3-tier logic is unchanged, just now
   consistent with its siblings' *treatment*, not force-fit into an identical threshold shape where
   one doesn't make sense (Prompts tracked / Total Checks are volume counters, not performance
   metrics — coloring them as good/bad would be a false signal, so per §9.1's "color must be
   strictly functional" rule, they deliberately stay neutral rather than being colored for
   consistency's own sake).
3. **CTA-driven empty states** on both chart cards (mention-rate-by-engine, brand-visibility
   progress bars) and both list cards (recent mentions, recent gaps) — each replaced its plain
   centered text with a short explanation + a `Link` to the concrete next action (running a
   collection on `/ai-visibility`), matching the existing app's own established `Link`/react-router
   usage rather than inventing a new navigation pattern.

### 9.5 Deliberately not done this round

- **No sparkline library added** — built directly on the already-installed `recharts`, per this
  file's own standing "no framework change" principle (§4).
- **No rollout to other pages** — same one-pilot-page-at-a-time discipline as every prior round.
  `AIVisibility.tsx` remains the natural next candidate once this round is confirmed live.
- **No North-star-vs-KPI-row visual resize this round** — §9.1's "hero should be ~3× the KPI tiles"
  ratio was checked against the current layout and found to already roughly hold (the hero card
  spans the full width above a `grid-cols-2 lg:grid-cols-4` KPI row) — no change needed, confirmed
  rather than assumed.
- **No global filter changes** — `useTimeFilter` already cascades correctly per §9.1; nothing to fix.
