# Phase 4 fix round: bg-design rulings (2026-11-10)

Answers `docs/qa/phase4-polish-review-2026-11-10.md` section 7 item 2, plus the
design half of D1, D2 and D5. Binds bg-app for this round. Visuals only: no
props change on any shared component, tokens only, every class a complete
literal. Spec text corrections are recorded here; the spec file is not edited.

## D5. Notice keeps its tone rule on hover, and does not react

Ruling. A Notice is not interactive as a whole (its one action is the control),
so it does not answer the pointer at all: on hover the left rule stays in its
tone and the other three sides stay `line`. Card.tsx className does not change
(only its stale comment, I9). Card props and Notice props do not change. P4-14
is amended: "Every Card computes a 1 px `line` border and on hover `line-2`,
except Notice, whose border colours do not change on hover."

Edit in `src/components/ui/Notice.tsx`, the RULE map only:

| Tone | Complete literal RULE string |
|---|---|
| warn | `border-l-warn hover:border-l-warn hover:border-t-line hover:border-r-line hover:border-b-line` |
| neg | `border-l-neg hover:border-l-neg hover:border-t-line hover:border-r-line hover:border-b-line` |
| accent | `border-l-accent-ink hover:border-l-accent-ink hover:border-t-line hover:border-r-line hover:border-b-line` |

Why this wins without `!`. These and Card's `hover:border-line-2` are all one
class plus `:hover`, specificity (0,2,0), so stylesheet order decides. In
Tailwind 3.4.19 (`node_modules/tailwindcss/lib/corePlugins.js:2637`) the
`borderColor` plugin makes three separate `matchUtilities` calls: `border`,
then `border-x`/`border-y`, then `border-s/e/t/r/b/l`. Each call takes its own
increasing sort offset (`lib/lib/setupContextUtils.js:437`) and the same
`hover` variant applies to both, so every `hover:border-{t,r,b,l}-*` is emitted
after `hover:border-line-2` and wins on its own side; nothing is left for
`border-line-2` to paint. The same mechanism already lets `border-l-warn` beat
`border-line` at rest. Fallback only if bg-verify measures otherwise in the
built CSS: the important form `hover:!border-l-warn` (and `!` on the three
neutral sides).

## D1 and D2. Locked engine header cell (C3 as amended)

Problem: a 44 px minimum track cannot hold the plan label ("Growth PRO" about
66 to 70 px) plus a 10 px lock, and C3's `truncate` on the engine name would
cut "Google AI Mode" and "Google AI Overviews" to near identical stubs. Ruling:
the track minimum rises so the longest single word of line 2 plus the lock
always fits, the maximum matches the active engine columns, and both lines wrap
at word boundaries inside the track (no `whitespace-nowrap`, no `truncate`, no
mid-word breaking of a word that fits). No line can be wider than its track, so
nothing overprints a neighbour.

Track constants (`AIVisibility.tsx` about :1117-1118):

| Item | Was | Now |
|---|---|---|
| `LOCKED_COL_MIN_REM` | `2.75` (44 px) | `5.25` (84 px) |
| track max inside `lockedTemplate` | `4.5rem` (72 px) | `5.5rem` (88 px, same as the active engine max) |
| `lockedTemplate` track | `minmax(${LOCKED_COL_MIN_REM}rem, 4.5rem)` | `minmax(${LOCKED_COL_MIN_REM}rem, 5.5rem)` |

Grid minimum uses the existing formula unchanged:
`2.5 + 13 + active x 3.5 + locked x LOCKED_COL_MIN_REM` rem. Review case (5
active, 2 locked): was 40 + 208 + 280 + 88 = 616 px, now 40 + 208 + 280 + 168 =
696 px (43.5rem). Below that the existing `overflow-x-auto` scrolls with `#` and
Prompt sticky (P4-24 already requires that at 768). `pickLockedColumns` caps
locked columns at two, so the added width is at most 80 px.

Width check, content width = track minus `px-1` (8 px): 76 px at the minimum,
80 px at the maximum. Line 2 widest unbreakable unit: lock 10 + gap 4 +
"Essentials" about 59 = 73 px, fits. "Growth PRO" (about 84 px with the lock)
wraps to "Growth" / "PRO". Line 1: "Perplexity", "DeepSeek", "Grok", "Copilot"
fit on one line; "Google AI Mode" and "Google AI Overviews" wrap to two lines,
clamped at two (full name stays in `title` and `aria-label`).

Cell DOM. The Link keeps its `aria-label` and `title` exactly as now:

| Element | Exact classes |
|---|---|
| Link | `flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 py-1.5 rounded-md hover:bg-surface-3 min-w-0` |
| logo tile (unchanged) | `w-6 h-6 rounded-badge bg-surface ring-1 ring-inset ring-line flex items-center justify-center` |
| img (unchanged) | `w-4 h-4 object-contain grayscale opacity-70` |
| line 1: span holding `{ENGINE_META[id].label}` | `max-w-full text-meta leading-tight text-ink-2 text-center break-words line-clamp-2` |
| line 2: wrapper span | `inline-flex max-w-full items-center justify-center gap-1 text-meta leading-tight text-ink-3` |
| line 2: lock | `<Lock size={10} aria-hidden="true" className="shrink-0" />` (Lock is already imported) |
| line 2: span holding `{PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]}` | `min-w-0 text-center` |

The Link's `aria-label` already names engine and plan, so the visible lines need
no extra ARIA. No new copy: both strings already exist. P4-24 is amended:
"locked columns show the engine name (up to two lines) and a lock with the plan
(wrapping at the space when needed); no header label overlaps a neighbouring
column at any width from 768 up."

## Lower findings, for the record

| Id | Ruling | Note |
|---|---|---|
| L1 | fix_later | Give the non-visual HeroAnswer skeleton the empty branch floor (`min-h-[240px]`) in the next SURFACES batch, with a CLS re-measure. |
| L3 | fix_later | One persistent `role="status"` region always mounted, text swapped in place, counter with an sr-only unit; markup restructure for the next shell batch. |
| L4 | fix_later | `.side-row` takes `min-height` instead of `height` (36 px, 44 px under 767 px); index.css edit, batched with L11. |
| L5 | fix_now_trivial | `Layout.tsx:617` className becomes `block mt-1 text-meta text-ink-2 underline decoration-line-2 underline-offset-2 hover:text-ink hover:decoration-ink-3`; a quiet underline marks it as a link without accent (overrides A4's "no underline"). |
| L7 | fix_later | Move the client name to line 2 of the running status line so it gets the full row width; layout change for the shell batch. |
| L8 | fix_later | Uppercase stays; revisit in the i18n pass, with the full label in a `title` inside Stat (no props change). |
| L9 | fix_later | Apply `reveal-row` on first mount only (a mounted ref in the parent list); that is logic, not a className, so it is its own item. |
| L10 | fix_later | Map the sparkline into y 6 to 26 of 32 and end the mask at 35% alpha instead of near zero, so the minimum and a flat series stay visible; B3 amendment travels with it. |
| L11 | fix_later | `.side-row` gap returns to 8 px; same index.css edit as L4. |
| I13 | accept | The page EmptyState variant stays as a ready primitive without a caller; P4-19's page half is checked when a caller exists. |
| I14 | accept | Static Cards keep the quiet `line` to `line-2` hover as P4-14 specifies (no fill change, no lift); Notice is exempt per D5. |
| I17 | fix_now_trivial | `Layout.tsx:697` Lock className becomes `ml-auto !text-ink-3`; the lock is plan status, not a nav icon, so it stays ink-3 on hover and active as A2 says. |

## Spec sentences corrected (spec file not edited)

| Item | Where | Corrected sentence |
|---|---|---|
| I1 | P4-3 | `rg "dark-[0-9]|\bslate-|white/|black/" src/components/Layout.tsx` returns 0 (the word boundary stops `translate-` from matching). |
| I2 | AM-1 and P4-4 | Uppercase tracked micro-labels (`.label-caps`) appear only in: sidebar group headings and sidebar section labels (A1, A3, including "Client" and "Collection market"), Stat labels, table header cells (`tableClasses` th and the prompt matrix `#` and Prompt cells, C3), the sidebar status word and the time strip caption. Everything else stays sentence case. |
| I3 | P4-15 and B1 | At most one `.card-accent-top` per route, on the HeroAnswer card and nowhere else; a route without a HeroAnswer (for example /prompts) has none. |
