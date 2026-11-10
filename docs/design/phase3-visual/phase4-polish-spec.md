# Phase 4 polish: the premium pass (delta on Phase 3)

Author: bg-design. Date: 2026-11-10. Base: `phase3-visual-spec.md` (shipped `733b6f7`), screenshots `after-r3/*.png`.
Builders: SHELL, SURFACES, TABLES, in disjoint file scopes (section D). Zero logic changes (guardrails G1 to G10 of the packet bind every line below).

## 0. The one thing, and the 10-second test

**The one thing.** On every route the eye lands on the hero answer and the KPI numbers first; the sidebar, tables and badges read as one quiet instrument panel that yields to them.

**10-second test (falsifiable).** After 10 seconds on `/` at 1440x900, a first-time user can say the score, the mention rate, and that a collection is or is not running, without reading any sentence twice.

Where Phase 3 fails it today (`after-r3/overview-desktop-dark.png`):
- KPI values render at the `value` role, 20 px (`ui/Stat.tsx:55`), the same size as the hero sentence, so "48" does not outrank the copy around it.
- Sparklines are 72x24 boxes beside the value (`ui/Stat.tsx:29-44`) and read as clutter, not trend.
- Collection status is a tinted alert box (`Layout.tsx:562-591`, `bg-accent-tint border-accent-ink/40`) that reads as a warning, not a system state.
- The sidebar still mixes legacy `border-dark-700/60`, `bg-dark-700`, `hover:bg-dark-600` with tokens (`Layout.tsx:530, 712, 790-1003`), and its rows use four different heights and paddings.
- The Competitors hero carries a 240 px floor with no visual (`ui/HeroAnswer.tsx:41`), leaving a half-empty card (`after-r3/competitors-desktop-dark.png`).

## 1. Amendments to the Phase 3 spec (recorded here, folded into `DESIGN-SYSTEM.md` by bg-design after the checkpoint)

| # | Phase 3 rule | Amended to | Reason |
|---|---|---|---|
| AM-1 | 5.1 "Sentence case everywhere, no uppercase tracked eyebrows" | Uppercase tracked micro-labels (`.label-caps`) in exactly four places: sidebar group headings, Stat labels, table header cells, the sidebar status line and time strip caption. Everything else stays sentence case. | The brief's "dense HUD" register; also fixes the Title Case stat labels (review L12) without touching i18n copy. |
| AM-2 | 5.1 type scale, `value` 20 for KPI values | New role `kpi`: 32 / 36, weight 600, tracking -0.02em. `value` 20 stays for ranks in rows. | KPIs must outrank the answer sentence. Amends AC-19 nothing (32 is above the floor). |
| AM-3 | C9 "No violet glows or gradients" | Two exceptions only: (a) the 1 px `.card-accent-top` hairline on the HeroAnswer card (one per route); (b) an 8 px accent-ink halo on the active nav rail and the mobile nav top bar. | The brief's "subtle glows such as a 1px top border highlight". Both are 1 to 2 px marks, not fills. |
| AM-4 | Section 10 cut "ambient pulse" | One pulse allowed: the running status dot. Job: shows that a process is live without a spinner. Static under reduced motion. | It replaces three spinners, so net motion goes down. |
| AM-5 | Section 10 stagger "first 4 blocks" via Motion | Same stagger by a CSS keyframe class `.reveal`, plus `.reveal-row` (opacity only) for the first 10 rows of a list or table. | Works in page chunks without importing motion, and for rows. |

HUMAN CHECKPOINT note for the orchestrator: AM-2 adds one type token. No colour token is added, no palette change, no new dependency.

## A. Shell (builder SHELL: `src/components/Layout.tsx`, `src/index.css`)

### A6 first: classes SHELL adds to `index.css` for everyone

Add inside the existing `@tailwind components` layer as `@layer components { ... }` (keyframes and the media block outside any layer). Exact bodies:

```css
@layer components {
  .label-caps { font-size: 12px; line-height: 16px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: rgb(var(--ink-3)); }
  .card-accent-top { position: relative; }
  .card-accent-top::before { content: ''; position: absolute; top: -1px; left: 16px; right: 16px; height: 1px; pointer-events: none;
    background: linear-gradient(90deg, rgb(var(--accent-ink) / 0) 0%, rgb(var(--accent-ink) / 0.9) 50%, rgb(var(--accent-ink) / 0) 100%); }
  .spark-fade { -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%); mask-image: linear-gradient(to bottom, black 0%, transparent 100%); }
  .table-head-sticky { position: sticky; top: 0; z-index: 2; background-color: rgb(var(--surface-2) / 0.85);
    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); box-shadow: inset 0 -1px 0 rgb(var(--line)); }
  .status-dot { position: relative; display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: currentColor; flex-shrink: 0; }
  .status-dot.is-live::after { content: ''; position: absolute; inset: -3px; border-radius: 9999px; border: 1px solid currentColor; opacity: 0;
    animation: status-ping 1600ms var(--ease-out) infinite; }
  .reveal { animation: reveal-up var(--motion-base) var(--ease-out) backwards; animation-delay: calc(var(--i, 0) * 40ms); }
  .reveal-row { animation: reveal-fade var(--motion-fast) var(--ease-out) backwards; animation-delay: calc(var(--i, 0) * 24ms); }
  .side-row { display: flex; align-items: center; gap: 12px; width: 100%; height: 36px; padding: 0 12px; border-radius: var(--radius-control);
    font-size: 14px; line-height: 20px; color: rgb(var(--ink-2));
    transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out); }
  .side-row:hover { background-color: rgb(var(--surface-2)); color: rgb(var(--ink)); }
  .side-row svg { color: rgb(var(--ink-3)); }
  .side-row:hover svg { color: rgb(var(--ink-2)); }
}
@keyframes status-ping { 0% { transform: scale(0.6); opacity: 0.7; } 100% { transform: scale(1.8); opacity: 0; } }
@keyframes reveal-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes reveal-fade { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 767px) { .side-row { height: 44px; } }
@media (prefers-reduced-motion: reduce) {
  .status-dot.is-live::after { animation: none; opacity: 0; }
  .reveal, .reveal-row { animation: none; }
}
```

Notes for consumers: `--radius-control` must be the existing variable name; SHELL greps `index.css` and uses whichever of `--radius-control` / `--control-radius` is declared in `:root`. `.card-accent-top` must not sit on an element with `overflow: hidden` (the hairline is drawn over the border at -1 px and would be clipped). `.reveal` and `.reveal-row` read `--i` from an inline style: `style={{ '--i': n } as React.CSSProperties}`. `fill-mode: backwards` means a finished reveal leaves no running animation.

### A1. Nav group micro-headings

Group label `div` (`Layout.tsx:678` and the two affiliate headings at 632, 650): `label-caps px-3 mb-1.5`. `nav` container: `flex-1 px-3 py-4 space-y-5 overflow-y-auto` (was `p-4 space-y-6`). Item stack: `space-y-0.5`.

### A2. Active and hover nav item (`.nav-item` in `index.css`)

Keep 36 px rows, 44 below 768 (rule at `index.css:632` unchanged). Edit only these declarations:

```css
.nav-item svg { color: rgb(var(--ink-3)); transition: color var(--motion-fast) var(--ease-out); }
.nav-item:hover svg { color: rgb(var(--ink-2)); }
.nav-item.is-active { background-color: rgb(var(--surface-3)); color: rgb(var(--ink)); font-weight: 500;
  box-shadow: inset 0 0 0 1px rgb(var(--line-2)); }
.nav-item.is-active svg { color: rgb(var(--accent-ink)); }
.nav-item.is-active::before { height: 20px; background-color: rgb(var(--accent-ink)); box-shadow: 0 0 8px 0 rgb(var(--accent-ink) / 0.45); }
```

Rail stays 2 px wide at `left: 0`, 20 px tall, centred. Idle: label ink-2, icon ink-3. Hover: `surface-2`, ink, icon ink-2. Active weight drops 600 to 500: the inset `line-2` ring plus rail carries selection, and a weight change shifts label width. Lock icons on locked rows stay `text-ink-3`.

### A3. Sidebar frame

| Part | Classes |
|---|---|
| `aside` | unchanged width 240, `bg-canvas`, right border `border-edge` (3:1 divider, AC-18 basis) |
| Logo row (`:530`) | `h-12 px-4 border-b border-line flex items-center justify-between flex-shrink-0`. 48 px so the hairline runs straight into the 48 px time strip on the right. |
| Every section divider (`:712, :840, :853, :977` and the market block) | `border-t border-line` replacing `border-dark-700/60` |
| Section padding | `px-3 py-3` (was `p-4`) |
| Section label ("Client", "Collection market") | `label-caps px-3 mb-1` |
| Client switcher button (`:726`) | `side-row font-medium text-ink` plus `aria-expanded` styling `aria-expanded:bg-surface-3`. No border, no `bg-surface-2` box. BrandLogo stays 20 px. |
| Bottom actions container (`:977`) | `px-3 py-3 border-t border-line space-y-0.5` |
| My Profile, Billing rows | `side-row` (drop `px-3 py-2.5 rounded-lg text-sm ... hover:bg-dark-700`) |
| Language trigger | `side-row flex-1 min-w-0` |
| Theme and sign out icon buttons | `w-9 h-9 max-md:w-11 max-md:h-11 flex items-center justify-center rounded-control text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-[180ms]`; sign out keeps `hover:text-neg` |
| Internal / Research trigger (`:799`) | `side-row text-meta` (12 px) |
| Group select (`:779`) | `flex-1 h-8 bg-surface-2 border border-edge rounded-control px-2 text-meta text-ink-2` |
| Every popover menu (clients, internal, language, add market) | panel `bg-surface border border-line-2 rounded-control shadow-raised overflow-hidden z-50`; tab strip `border-b border-line bg-surface-2`; item `text-ink-2 hover:bg-surface-2 hover:text-ink`; selected item `bg-accent-tint text-accent-ink`; internal sub-heading `label-caps px-3 pt-2 pb-1` (drops `bg-dark-800/40`) |
| Market chips (`:899`) | `bg-surface-2 rounded-control`; region select `bg-surface border-edge`; add market button `border border-dashed border-line-2 hover:border-edge hover:bg-surface-2 rounded-control` |

Result: zero `dark-` class names left in `Layout.tsx` (P4-3).

### A4. System status line (replaces `:562-591` and `:596-615`, same slot, same data)

Structure, both states share it:

```
<div class="relative px-4 py-2.5 border-b border-line bg-canvas flex-shrink-0" role="status" aria-live="polite">
  line 1: flex items-center gap-2
    <span class="status-dot {tone} {live?'is-live':''}" aria-hidden="true">
    <span class="label-caps text-ink-2">{word}</span>            // copy: pending bg-copy
    <span class="text-meta text-ink-2 truncate min-w-0">{progress.clientName}</span>
    right: action (Stop | dismiss)
  line 2 (running only): flex items-baseline justify-between mt-1
    <span class="font-mono tabular-nums text-meta text-ink">{progress.done}/{progress.total}</span>
    <span class="font-mono tabular-nums text-meta text-ink-3">{collectPct}%</span>
  hairline (running only):
    <div class="absolute inset-x-0 bottom-0 h-[2px] bg-line" aria-hidden="true">
      <div class="h-full bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${collectPct}%` }} />
```

`font-mono` is Tailwind's default mono stack (not overridden in `fontFamily`), so it is available.

| State | Condition (existing values only) | Dot | Word | Line 1 right | Line 2 / hairline |
|---|---|---|---|---|---|
| running | `collecting && progress` | `text-accent` + `is-live` | "Collecting" | Stop: `inline-flex items-center gap-1 h-6 px-2 rounded-badge text-meta text-ink-3 hover:text-neg hover:bg-surface-2` with `StopCircle size={12}` | yes |
| finished | `runNotice.kind === 'completed' && runNotice.failed === 0` | `text-pos` | "Done" | dismiss | none |
| finished with failures | `runNotice.kind === 'completed' && runNotice.failed > 0` | `text-warn` | "Done" | dismiss | none |
| stopped | `runNotice.kind === 'stopped'` | `text-ink-3` | "Stopped" | dismiss | none |

In the three ended states, line 1 shows the dot and the word, and line 2 becomes the existing NavLink with `describeRun(runNotice)` as `block mt-1 text-meta text-ink-2 hover:text-ink` (no underline, no accent). Dismiss: `w-6 h-6 max-md:w-11 max-md:h-11 -mr-1 flex items-center justify-center rounded-badge text-ink-3 hover:text-ink hover:bg-surface-2`, `X size={12}`, existing `aria-label`. The Loader2 at `:566` is removed (the dot replaces it). The word tokens are three new one-word labels, each with `// copy: pending bg-copy`.

The `sidebarNotice` error block (`:621`) is not a status; it stays a neg notice but drops the box look: `px-4 py-2.5 border-b border-line flex items-start gap-2`, a `status-dot text-neg mt-1.5`, text `text-meta text-neg`.

Mobile header indicator (`:1097-1101`): `ml-auto inline-flex items-center gap-2 h-7 px-2 rounded-badge border border-line bg-surface font-mono tabular-nums text-meta text-ink-2` containing `status-dot text-accent is-live` and `{progress.done}/{progress.total}`. Loader2 removed.

### A5. Top strip, mobile nav, hygiene

- Time strip (`:1113`): unchanged height 48 and `border-b border-line`; caption becomes `hidden md:inline label-caps`.
- Stale comment at `:1106-1112` citing `#0d1425`: rewrite to say the strip reads `bg-canvas` (Phase 3 spec 8). No hex in the comment.
- `.mobile-nav-item.is-active::before`: add `box-shadow: 0 0 8px 0 rgb(var(--accent-ink) / 0.45);` (same halo as the rail). Labels stay sentence case.
- Billing Loader2 (`:990`): `animate-spin motion-reduce:animate-none`. Any Loader2 left in `Layout.tsx` gets the same.
- `.time-pill` block (`index.css:636-676`): grep `src` for `time-pill`; measured today zero `.tsx` call sites, so delete the rule, its hover, pressed and mobile blocks.
- G5: none of the above imports `motion/react` or `src/lib/motion.ts`.

## B. Surfaces (builder SURFACES)

### B1. Card (`ui/Card.tsx`)

Base string becomes `bg-surface border border-line rounded-card shadow-card transition-colors duration-[180ms] ease-out hover:border-line-2 motion-reduce:transition-none`. `interactive` adds only `hover:bg-surface-2`. Dark keeps no shadow (`--shadow-card` is `none`). Accent treatment: `card-accent-top` is applied inside `HeroAnswer.tsx` to its Card (both the data and empty branches, not the skeleton), and nowhere else. One per route by construction.

### B2. KPI Stat (`ui/Stat.tsx`, `tailwind.config.js`)

`tailwind.config.js` `fontSize` adds exactly: `kpi: ['32px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '600' }]` (AM-2).

| Part | Classes |
|---|---|
| Root | `min-w-0` (no `relative`; the cell is the positioning parent, B3) |
| Label row | `flex items-center gap-1.5 label-caps`; icon `size={13}` `text-ink-3` |
| Value | `text-title md:text-kpi text-ink tabular-nums` inside `mt-2 flex items-baseline gap-1 min-h-[36px]` |
| Unit | `text-meta text-ink-3`; when `unit === '%'`, the wrapper uses `gap-0.5` (fixes the "48 %" gap, L12) |
| Tone glyph | unchanged, `self-center ml-1` |
| Delta | `mt-1.5` |
| Sub | `mt-1 text-meta text-ink-3` |
| Empty | `text-body text-ink-3`, same `min-h-[36px]` row |

### B3. Integrated sparkline and HUD cells

Replace the local `Spark` in `Stat.tsx` (same `spark` prop, same `< 2 points` guard):

```
<svg aria-hidden="true" viewBox="0 0 100 32" preserveAspectRatio="none"
     className="spark-fade pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full">
  <path d={area} fill="rgb(var(--ink-3) / 0.14)" />
  <path d={line} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.5} vectorEffect="non-scaling-stroke"
        strokeLinejoin="round" strokeLinecap="round" />
</svg>
```

x = `i / (n - 1) * 100`; y = `30 - ((p - min) / span) * 24` (top margin 6, bottom 2); `line` = `M x0,y0 L ...`; `area` = `line + ' L100,32 L0,32 Z'`. No end dot (it would distort under `preserveAspectRatio="none"`). Neutral ink, not accent (C9: the four KPIs are not all "you").

`ui/ReadoutRow.tsx` cell: `relative overflow-hidden bg-surface p-5 pb-10 min-h-[136px] min-w-0`. Grid stays `grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-card overflow-hidden`. `skeletons.tsx` `SkeletonReadout` cell takes the same classes; `SkeletonStat` blocks become `h-3 w-24`, `h-9 w-20`, `h-3 w-32` so the box matches (AC-28). SURFACES greps for `<Stat` with `spark` outside a ReadoutRow; any hit gets a `relative overflow-hidden` wrapper in that page if the page is in SURFACES scope, else it is reported.

### B4. HeroAnswer

- `min-h-[280px] md:min-h-[240px]` applies only when `visual` is present (data branch) or in the empty branch. Without a visual the card is content height. This removes the empty band on Competitors, Mentions and Recommendations.
- Loading without a visual: render a local helper inside `HeroAnswer.tsx` (Card `pad="feature"` with `SkeletonBlock` lines `h-10 w-28`, `h-6 w-full max-w-[56ch]`, `h-4 w-2/3 max-w-[40ch]`), not `SkeletonHero` (which carries the 160 dial). With a visual, `SkeletonHero` as today. No prop change.
- Line 47: remove the `aria-label` from the `p` (`aria-label` on a generic role is unreliable and concatenated "10mentions"). Insert `<span className="sr-only">{' '}</span>` between the value span and the unit span. Same `%` rule as B2 for the visual gap.
- Value span: `text-display-sm md:text-display text-ink tabular-nums`; badge sits after it, unchanged.

### B5. Badge

Keep 20 px high, `px-1.5`, `rounded-badge`, `text-meta`. Add a 1 px inset ring per tone for crispness:

| Tone | Classes |
|---|---|
| neutral | `bg-surface-3 text-ink-2 ring-1 ring-inset ring-line-2` |
| accent | `bg-accent-tint text-accent-ink ring-1 ring-inset ring-accent-ink/25` |
| pos | `bg-pos-tint text-pos-ink ring-1 ring-inset ring-pos-ink/25` |
| warn | `bg-warn-tint text-warn ring-1 ring-inset ring-warn/25` |
| neg | `bg-neg-tint text-neg ring-1 ring-inset ring-neg/25` |

Glyphs (L8): on Dashboard, BrandSentiment and Recommendations, every status badge (pos, warn, neg tone) passes `glyph={<StatusGlyph kind=... size={12} />}`; neutral and accent badges carry none. Priority chips "P0 / P1 / P2" on Recommendations are `neutral` (P0 may be `accent`), never coloured text. Title Case labels on stat cards are resolved by `label-caps`; any other Title Case string that is a literal in a SURFACES page (not i18n) is changed to sentence case, i18n keys are left and reported.

### B6. EmptyState, Skeleton, Collapse

- EmptyState icon tile: `w-10 h-10 rounded-control bg-surface-2 ring-1 ring-inset ring-line flex items-center justify-center mb-3`. `variant="page"` adds `border border-dashed border-line-2 rounded-card`; `inline` stays plain (it already sits in a card).
- Skeleton: keep the opacity pulse (no gradient shimmer: a moving gradient is a second animation for the same job). Unchanged.
- Collapse: unchanged motion (260 ms height and opacity, Motion, page chunk only).
- SectionHeader: count Badge as B5; `description` stays `text-meta text-ink-2`. Title unchanged.

### B7. Motion in SURFACES pages

- Top-level blocks: on Dashboard, BrandSentiment, Mentions, Recommendations, the first four children of `Page` after PageHeader get `className="reveal"` and `style={{ '--i': 0..3 }}`. Later blocks get nothing.
- Rows: DataList and list rows rendered in those pages: first 10 rows get `reveal-row` with `--i` = index; rows 10 and up get no class.
- Hover: cards change border only (B1); rows change background to `surface-2`. No translate, no scale. `MotionCard` `hoverLift` default stays false; where a page passes `hoverLift`, keep it (y -2 is under the 1.01 scale ceiling in effect and already ruled).
- Durations: `--motion-fast` 180, `--motion-base` 260, `--ease-out`. Reduced motion: `.reveal` and `.reveal-row` removed by the A6 media block; transitions by the existing global rule and `motion-reduce:`.

## C. Tables and grids (builder TABLES)

### C1. `ui/tableClasses.ts`

| Key | Value |
|---|---|
| `wrap` | `overflow-x-auto lg:overflow-x-clip lg:overflow-y-visible rounded-card border border-line bg-surface shadow-card` |
| `thead` | `` (empty: stickiness lives on the cells) |
| `th` | `table-head-sticky h-9 px-4 text-left label-caps whitespace-nowrap` |
| `thRight` | `table-head-sticky h-9 px-4 text-right label-caps whitespace-nowrap` |
| `tr` | `border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors duration-[180ms] ease-out motion-reduce:transition-none` |
| `td` | `h-11 px-4 align-middle text-body text-ink` |
| `tdRight` | `h-11 px-4 align-middle text-body text-ink text-right tabular-nums` |
| `tdMuted` | `h-11 px-4 align-middle text-body text-ink-2` |

Why it sticks: `<main>` is the vertical scroll container. Below `lg` the wrap scrolls horizontally, which makes it a scroll container and the header does not stick vertically (accepted: the table is short on phones and the mobile DataList replaces it below 768). From `lg` up, `overflow-x: clip` clips the rounded corners without creating a scroll container, so `position: sticky; top: 0` on each `th` sticks to `main`. Precondition: every table using `wrap` fits its column at `lg` (Competitors uses `min-w-[720px]`, column is 976 at 1280). TABLES greps every `tableClasses.wrap` user; a table wider than its column at `lg` keeps `overflow-x-auto` by appending `lg:overflow-x-auto` at that call site. Rows 44 high (denser, was 48). Zebra none. Numbers right with `tabular-nums`, text left.

### C2. Visual anchors

**Monogram** (new file `src/components/ui/Monogram.tsx`, TABLES; not exported from `ui/index.ts`, imported by path):
- Props: `name: string`, `size?: 20 | 24` (default 24), `you?: boolean`.
- Initial: first letter of the first word, plus the first letter of the second word when there are two or more words, uppercased; `?` when empty. Deterministic, no network, no per-name colour.
- Classes: `inline-flex shrink-0 items-center justify-center rounded-badge text-meta font-semibold select-none ring-1 ring-inset`, size `w-6 h-6` or `w-5 h-5`; competitor `bg-surface-3 text-ink-2 ring-line-2`; `you` `bg-accent-tint text-accent-ink ring-accent-ink/30`. `aria-hidden="true"` (the name is beside it).

Used in: Competitors table first column (`flex items-center gap-2.5`), the Competitors mobile DataList row, and the Share of mentions BarList rows. BarList keeps its props: the page maps rows at render time, `label: <span className="inline-flex items-center gap-2 min-w-0"><Monogram name={...} size={20} you={row.isYou} /><span className="truncate">{name}</span></span>`, without touching any memo.

**Engines.** `EngineChip` with `interactive={false}` (L17): render the span as `inline-flex items-center gap-1.5 text-meta text-ink-2` with the 8 px swatch; no `engine-chip` class, no border, no background, no hover. Interactive chips unchanged. Engine names in table cells and engine lists in TABLES pages use this non-interactive chip where the row data already carries engine ids; where only a joined label string exists, leave the text.

### C3. Prompt matrix (`AIVisibility.tsx` around `:2366-2396`, rows from `rowsOf`)

- Header row: `grid border-b border-line bg-surface-2` stays (no vertical sticky, section E). `#` and Prompt cells: `label-caps`.
- Active engine header cell: `px-1 py-2 flex flex-col items-center gap-1`; logo in a tile `w-6 h-6 rounded-badge bg-surface ring-1 ring-inset ring-line flex items-center justify-center` holding the existing `img` at `w-4 h-4`; name `text-meta font-medium text-ink-2 text-center leading-tight`.
- Locked engine header cell (Link, `min-h-[44px]`, `hover:bg-surface-3`, `aria-label` unchanged): same logo tile with `grayscale opacity-70`; line 1 engine name `text-meta text-ink-2 truncate max-w-full`; line 2 `inline-flex items-center gap-1 text-meta text-ink-3` with `Lock size={10}` and the plan label. Replaces the bare plan name under the icon.
- Sticky first columns on horizontal scroll (template starts `2.5rem`, so the offset is fixed): in the header and in every wide row, the `#` cell gets `sticky left-0 z-[1] bg-surface-2` (header) or `sticky left-0 z-[1] bg-surface group-hover:bg-surface-2` (rows), the prompt cell gets `sticky left-10 z-[1]` with the same backgrounds plus `shadow-[1px_0_0_rgb(var(--line))]`. Each wide row element gets `group` if it lacks it. If a row's hover background is set on an inner element rather than the row, TABLES matches that element instead and reports it.
- Cells centred; numbers in cells tabular.
- `PromptResultCell.tsx`: in the `mentioned` state the word span (`#N`) adds `text-ink` (L9); the glyph keeps the pos ink through `STATE_CLASS`. Contrast: ink on pos-tint is far above 4.5 in both themes (bg-verify measures).
- Score info button (`:1820`): `after:-inset-[10px] max-md:after:-inset-4` replacing `after:-inset-[7px]`; hit area 32 desktop, 44 below 768 around the 12 px glyph. Classes only.
- Rows: first 10 visible rows get `reveal-row` with `--i`.

### C4. Competitors page

- Hero: HeroAnswer change in B4 removes the empty band; nothing page-side.
- Share of mentions: BarList inside a `Card pad="standard"`; BarList itself: bar `h-1.5` (was `h-2`), row `min-h-8`, value `text-body font-semibold text-ink tabular-nums`, label column as today. Monograms per C2.
- Table: `tableClasses` per C1; the brand row keeps `bg-accent-tint` and adds `shadow-[inset_2px_0_0_rgb(var(--accent-ink))]` (a 2 px left rail, the same grammar as the nav); its "you" mark becomes `<Badge tone="accent">you</Badge>`; the trend glyph beside names stays ink-3.
- Mobile list (DataList below 768): monogram, name `text-body text-ink`, counts right `tabular-nums`; brand row `bg-accent-tint`.
- Top-level blocks: first four get `reveal` with `--i`.

### C5. Prompts page

Rows follow DataList (C1 hover, 56 min, row actions ink-3 to ink); header labels `label-caps`; category stays a neutral Badge; first 10 rows `reveal-row`. No delete behaviour changes, no new anchors (a prompt has no natural mark).

## Data legibility (unchanged rules, restated where this pass touches them)

KPI values: integers for percentages (`48%`), positions one decimal with `#` (`#2.9`), counts plain integers; `tabular-nums` on every number; numbers wear ink (C1). A sparkline with fewer than 2 points renders nothing (no flat line). Units at `meta` ink-3.

## Accessibility floor for this pass (bg-verify measures, values below are expected, not measured)

| Pair | Expected |
|---|---|
| `.label-caps` ink-3 on canvas, surface, surface-2, both themes | >= 4.5 (Phase 3 13.1: ink-3 on surface 5.66 dark, 6.03 light) |
| Monogram ink-2 on surface-3; accent-ink on accent-tint | >= 4.5 both themes |
| `#N` ink on pos-tint | >= 4.5 both themes |
| Status dot pos, warn, accent on canvas | >= 3:1 non-text both themes |
| Active nav rail accent-ink vs surface-3 and canvas | >= 3:1 (AC-18 stands) |
| Status line dismiss and Stop | 24 px desktop, 44 px below 768 |
| Focus | existing 2 px accent-ink outline on every new focusable element |

Heading order unchanged: one h1 per route, SectionHeader h2.

## Reference frames

| Block | Comparable | Attribute borrowed |
|---|---|---|
| Sidebar | Linear | uppercase 12 px group labels, one row height, active row as a quiet inset fill plus a hairline |
| Status line | Vercel deployment row | a dot plus a word plus a mono counter, no alert box |
| KPI row | Stripe dashboard | big tabular numbers, the trend as a faint area under the number, cells split by 1 px rules |
| Tables | Attio | sticky blurred header, dense 44 px rows, monogram anchors |
| Hero highlight | Raycast | a single luminous 1 px edge on the featured surface, nothing else lit |

## D. At a glance, and ownership

What changes at a glance (check the screenshots):
1. KPI numbers at 32 px with faint full-width trend areas along the bottom of each cell.
2. Uppercase tracked micro-labels on nav groups, stat labels and table headers.
3. Active nav row: inset hairline, violet rail with a soft halo, violet icon.
4. Sidebar rows all 36 px, flush, no boxed client switcher, no legacy greys.
5. Collection status as a one or two line status bar with a pulsing dot, mono counter and a 2 px progress hairline.
6. Hero card on every route carries a 1 px violet top highlight; no empty band under short heroes.
7. Badges have crisp tone rings and status glyphs.
8. Tables: sticky blurred header from 1024 up, 44 px rows, monograms beside competitors, the brand row with a violet rail.
9. Prompt matrix: engine logos in tiles, locked columns named by engine with a lock and plan, sticky prompt column, ink ranks.
10. Blocks and the first rows fade in with a short stagger (none under reduced motion).

| Builder | Files (exclusive) |
|---|---|
| SHELL | `src/components/Layout.tsx`, `src/index.css` |
| SURFACES | `src/components/ui/{Card,Stat,ReadoutRow,HeroAnswer,Badge,SectionHeader,skeletons,Notice,Meter,ScoreDial}.tsx`, `src/components/{MotionCard,EmptyState,Skeleton,Collapse,ScoreBadge,TrendDelta}.tsx`, `tailwind.config.js`, `src/pages/{Dashboard,BrandSentiment,Mentions,Recommendations}.tsx` |
| TABLES | `src/components/ui/{tableClasses.ts,DataList.tsx,BarList.tsx,Chip.tsx,ChipGroup.tsx,Monogram.tsx (new)}`, `src/components/{PromptResultCell,EngineChip,BrandLogo}.tsx`, `src/pages/{Competitors,AIVisibility,Prompts}.tsx` |

No file moves between builders. `src/lib/tokens.ts` is not needed (no colour token added) and is owned by nobody this round. `ui/index.ts` is owned by nobody: Monogram is imported by path. `Notice`, `Meter`, `ScoreDial`, `ScoreBadge`, `TrendDelta`, `MotionCard`, `Collapse`, `Skeleton`, `BrandLogo`, `Chip`, `ChipGroup` need no change unless a sweep in this spec reaches them; they stay in scope so a builder may fix a stale class found there.

Cross-builder contract: SHELL defines `.label-caps`, `.card-accent-top`, `.spark-fade`, `.table-head-sticky`, `.reveal`, `.reveal-row`, `.status-dot`, `.side-row`; SURFACES defines Tailwind `text-kpi`. The others only reference the names. Builds are green only once all three land; the orchestrator builds after the last.

## Acceptance criteria

- **P4-1** `index.css` contains the A6 block with these exact class names and keyframes; `rg "time-pill" src` returns 0.
- **P4-2** `.nav-item.is-active` computes the inset `line-2` ring, rail `accent-ink` 2 x 20 px with the halo; idle icon computes ink-3; rows 36 px at 1280, 44 px at 390.
- **P4-3** `rg "dark-[0-9]|slate-|white/|black/" src/components/Layout.tsx` returns 0.
- **P4-4** Sidebar group headings, Stat labels, every `th` from `tableClasses`, the status word and the time strip caption compute `text-transform: uppercase`, 12 px, 500, letter-spacing 0.72 px. No other element in scope gains uppercase.
- **P4-5** Logo row is 48 px and its bottom border aligns (within 1 px) with the time strip bottom border at 1280.
- **P4-6** Every sidebar action row (profile, billing, language, client switcher, internal) is 36 px at 1280 and 44 px at 390, with no border and `surface-2` on hover.
- **P4-7** While collecting: one status line with a `.status-dot.is-live`, a `font-mono` counter, a 2 px hairline whose child width equals `collectPct`%, and a Stop control; no `bg-accent-tint` in that slot; no Loader2 in it or in the mobile header.
- **P4-8** After a run: completed, completed with failures and stopped render pos, warn and ink-3 dots respectively, the `describeRun` text, and a dismiss; no data, handler or context line differs from HEAD (diff shows className and markup only).
- **P4-9** `Layout.tsx` and anything it imports statically contain no import of `motion/react` or `lib/motion`; entry chunk size within 1 kB of HEAD.
- **P4-10** Every Loader2 left in `Layout.tsx` carries `motion-reduce:animate-none`; the `#0d1425` comment is gone.
- **P4-11** `tailwind.config.js` `fontSize.kpi` equals `['32px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '600' }]` and no other font size is added.
- **P4-12** Overview KPI values compute 32 px at 1280 and 24 px at 390; the sparkline SVG spans the cell's full width, sits at its bottom edge, carries `preserveAspectRatio="none"` and `pointer-events: none`, and no SVG of 72 x 24 remains.
- **P4-13** ReadoutRow cells are >= 136 px tall, `overflow: hidden`, separated by 1 px `line`; SkeletonReadout to content CLS < 0.05.
- **P4-14** Every Card computes a 1 px `line` border and on hover `line-2`; no Card computes a box-shadow in dark.
- **P4-15** Exactly one `.card-accent-top` per route (the HeroAnswer card), measured on the 7 Phase 3 routes, both themes; the hairline is visible (not clipped).
- **P4-16** HeroAnswer without a visual has no min-height; Competitors, Mentions and Recommendations hero cards at 1440 have no inner empty band taller than 24 px below the last line of content.
- **P4-17** The HeroAnswer value paragraph has no `aria-label`; its accessible text reads value, a space, unit.
- **P4-18** Badges compute a 1 px inset ring in their tone; every pos, warn or neg badge on Dashboard, BrandSentiment and Recommendations contains a glyph; no stat shows a space-width gap before `%` larger than 2 px.
- **P4-19** EmptyState icon tiles compute `surface-2` with a 1 px `line` ring; page variant has a dashed `line-2` border.
- **P4-20** `tableClasses.th` cells stick to the top of `<main>` while scrolling at 1280 (Competitors table), computing `position: sticky`, `backdrop-filter: blur(4px)` and an 85% `surface-2` background; no horizontal page scroll at 390, 768, 1280 (AC-20 method).
- **P4-21** Table body rows are 44 px; numeric cells right aligned with `tabular-nums`; text cells left.
- **P4-22** Competitor names in the table, the mobile list and the share BarList each have a Monogram; the brand row's monogram is the accent variant; zero network requests are added by monograms (network log diff).
- **P4-23** Non-interactive EngineChip computes no border, no background, no hover change, and is not focusable.
- **P4-24** Prompt matrix headers show engine logo tiles; locked columns show engine name, a lock and the plan as two lines; the `#` and prompt columns stay visible while the matrix scrolls horizontally at 768.
- **P4-25** In mentioned cells the `#N` text computes `--ink`.
- **P4-26** The score info button hit area measures >= 32 x 32 at 1280 and >= 44 x 44 at 390.
- **P4-27** With `prefers-reduced-motion: reduce`, `document.getAnimations()` is empty after load on the 7 routes and during a collection (status dot static); without it, `.reveal` appears on at most 4 blocks and `.reveal-row` on at most 10 rows per list.
- **P4-28** No hover transform above `scale(1.01)` or `translateY(-2px)` anywhere in scope.
- **P4-29** AC-12, AC-14, AC-18, AC-19, AC-20, AC-29, AC-30 of the Phase 3 spec still pass in both themes.
- **P4-30** The diff touches no query, hook, context, memo, handler, route, billing code or `PLAN_ORDER`; no props interface of an existing shared component changes (Monogram is new); no em or en dash in any added line.

## E. Ruled out from the brief

- **Glassmorphism on cards and panels**: the brief itself excludes it; the only blur is the sticky table header, where it keeps rows legible behind it.
- **Brand violet as a card border or icon colour on non-selected items**: breaks C9 and the "sparingly" instruction; violet stays on rail, selection, primary CTA, the hero hairline and "you".
- **`text-[10px]` micro-headings**: below the 12 px floor (G4); `label-caps` at 12 px with 0.06em tracking gives the same register.
- **Brief's raw classes (`bg-white/5`, `border-white/5`, `text-slate-*`, `#0d1425`)**: translated to `surface-2`, `line`, `ink-*`, `canvas`.
- **Vertical sticky header on the prompt matrix**: it is a CSS grid inside a horizontal scroller with a Card that clips; making it stick would need a scroll region or JS. Horizontal sticky columns are delivered instead.
- **Count-up numbers and animated sparklines**: unreadable while moving; Phase 3 already cut count-up.
- **Accent-coloured sparklines on every KPI**: four violet areas would make violet decorative; the trend stays neutral.
- **A motion library in the shell**: G5; the status pulse and reveals are CSS.
- **Gradient shimmer skeletons**: a second animation for the job the opacity pulse already does.
- **Per-competitor avatar colours or remote logos for competitors**: no new colours, and no network request per row.
