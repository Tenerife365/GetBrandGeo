# Phase 5 density spec: Overview tile trend mark, AI Visibility engine strip, Fix This columns

Author: bg-design, 2026-11-10. Binds bg-app. Builds on `phase3-visual-spec.md`,
`phase4-polish-spec.md` and `phase4-fix-rulings-2026-11-10.md`; every token named
here already exists in `src/index.css` and `tailwind.config.js`. No new token.

## 0. The one thing

On AI Visibility the user must reach "Your prompts" within the first screen and a
half; the Engines strip and a closed Fix This header are a short summary above it,
not destinations. On Overview the four readout tiles must read as one even row
where the number is the subject and the trend is a footnote.

## 1. The 10-second test (falsifiable)

After 10 seconds on AI Visibility at 1440 by 900, a first-time user can say "I
see my score, each engine's rate in one row, how many fixes are open, and the
start of my prompts table". Today it fails: hero about 310 px, Engines card about
320 px (`AIVisibility.tsx` Block 3, a `minmax(220px,1fr)` grid of cards inside a
card), Fix This open by default at about 780 px (`showFixHub` is `useState(true)`
at about line 374), so "Your prompts" starts about 1,580 px down. On Overview it
fails on evenness: three tiles draw a stretched area wedge (`Stat.tsx` `Spark`,
`viewBox 0 0 100 32`, `preserveAspectRatio="none"`), Active prompts draws none,
and `ReadoutRow` reserves `pb-10` for it.

## 2. Guardrails restated for builders

D-1. Visuals and layout only. Do not touch any query, fetch, existing
`useEffect`, `resultsContext`, `fixRows`, `fixBusy`, `fixNotice`, `markFix`,
`copyFix`, `checkFixNow`, `reopenFix`, `putFixRow`, `afterFixMoved`, or billing.
New local `useState` is allowed. No new `useEffect`; clamp indexes at render.

D-2. No props change on any shared component (`StatProps`, `ReadoutRow`, `Card`,
`Badge`, `Button`, `SectionHeader`, `Collapse`, `Disclosure`).

D-3. Colour only through existing semantic classes and `rgb(var(--ink-3))` style
variables in SVG. Type only `text-meta`, `text-body`, `text-heading`,
`text-title-sm`, `text-title`, `text-kpi`, `label-caps`. Weight cap 600.

D-4. Every class below is a complete literal string. Conditional classes use a
ternary between two complete literals, never concatenated fragments.

D-5. No em dash, no en dash. New user-facing strings carry `// copy: pending bg-copy`
(or `{/* copy: pending bg-copy */}` in JSX). `Stat.tsx` and `ReadoutRow.tsx`
import nothing from `motion`.

## 3. S1, Overview tile trend mark (builder A: `Stat.tsx`, `ReadoutRow.tsx` only)

Decision: keep a sparkline, but as a small fixed-size inline mark in the value row.
A trend line is the right mark for `number[]` with no axis; it fails today only
because it is stretched to the tile width and filled. A fixed pixel box keeps the
slope honest at any tile width.

D-6. Replace the body of `Spark` in `Stat.tsx`. Signature stays
`function Spark({ points }: { points: number[] })`. Return `null` when
`points.length < 3`.

D-7. Geometry. Box `W = 64`, `H = 24`, inner padding `P = 3` so the end dot and
the 1.5 px stroke are never clipped. `n = points.length`, `min`, `max` as today.
- `x(i) = P + i * (W - 2 * P) / (n - 1)` (3 to 61)
- if `max === min`: `y(i) = H / 2` for every point (a centred flat line)
- else: `y(i) = P + (1 - (p - min) / (max - min)) * (H - 2 * P)` (3 to 21, higher
  values sit higher)
- Round each coordinate to 2 decimals with `toFixed(2)`.

D-8. Markup, in this order:
```tsx
<svg aria-hidden="true" focusable="false" width={64} height={24} viewBox="0 0 64 24"
  className="pointer-events-none shrink-0 self-center ml-auto hidden sm:block lg:hidden xl:block">
  <path d={line} fill="none" stroke="rgb(var(--ink-3))" strokeWidth={1.5}
    strokeLinejoin="round" strokeLinecap="round" />
  <circle cx={lastX} cy={lastY} r={2} fill="rgb(var(--ink-2))" />
</svg>
```
No `preserveAspectRatio`, no area path, no `vectorEffect`, no `spark-fade`.
The visibility rule hides it on phones (2 tiles across at 390 leave about 130 px
of inner width) and at `lg` to below `xl` (4 tiles across at 1024 to 1279 leave
about 140 px, a `text-kpi` "100%" plus the warn glyph plus 64 px collides). It
shows at 640 to 1023 (2 across, wide tiles) and from 1280 up.

D-9. Placement. In `Stat`, the value row `div` keeps its classes
`mt-2 flex items-baseline gap-1 min-h-[36px]` and gains the spark as its LAST
child, after the empty or value `span`:
`{!empty && spark && <Spark points={spark} />}`. Delete the old line
`{!empty && spark && <Spark points={spark} />}` at the bottom of the root `div`.
The value `span` keeps `min-w-0`. `ml-auto` on the svg pushes it to the right
edge; `self-center` centres it on the 36 px row.

D-10. Update the `spark` JSDoc in `StatProps` to "Sparkline series, drawn as a
small fixed-size line at the right of the value." Comment only, no type change.

D-11. A tile without a series (Active prompts) renders nothing in that slot. No
placeholder. Height stays equal through D-12.

D-12. `ReadoutRow.tsx` cell class becomes exactly
`relative overflow-hidden bg-surface p-5 min-h-[120px] min-w-0`
(was `... p-5 pb-10 min-h-[136px] ...`). Grid classes unchanged. Grid rows
stretch, so the four cells are equal height by construction.

D-13. `.spark-fade` stays in `index.css`, unused. Not worth a stylesheet edit
in this batch; bg-app may delete it in a later CSS sweep.

D-14. Dashboard.tsx is not edited. `sparkNumbers(...)` and `avgPosSpark` are
consumed as they are. Note for the reviewer: the avg position series plots raw
values, so a better (lower) position draws lower. That is the existing data
contract and is out of scope; recorded as open question Q1.

## 4. S2, AI Visibility engine strip (builder B: `AIVisibility.tsx` Block 3)

D-15. Structure, replacing everything inside the Block 3 `motion.div`:
```
motion.div.mb-4 {...reveal(1)}           (unchanged wrapper)
  div  "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2"
    h2 "label-caps"  Engines              (existing string, keep its copy comment)
    [meta line, D-22]                      (only if coming soon or locked exist)
  Card pad="none" className="overflow-hidden"   (only if engineStatusCards.length > 0)
    div  strip (D-16)
      div  column per engine (D-17)
```
`SectionHeader` is dropped from this block: its fixed `mb-4` plus the card padding
cost about 60 px. The quiet `label-caps` heading matches the ReadoutRow family.
No card inside a card: columns are separated by 1 px `divide-line` rules.

D-16. Strip class, one literal for every count:
`flex divide-x divide-line overflow-x-auto snap-x snap-mandatory lg:snap-none`

D-17. Column class:
`relative flex flex-col gap-1 min-w-[46%] sm:min-w-[164px] lg:min-w-[132px] lg:max-w-[280px] flex-1 basis-0 p-3 snap-start`
Phone rule (below 640): horizontal scroll strip with snap, each column at least
46 % of the strip, so two show and the third peeks. Chosen over a 2-column grid
because 7 engines in a grid would be 4 rows, about 400 px, which defeats the
brief. The scroll lives inside the Card, so the page never scrolls sideways.

D-18. Column content, DOM order:
1. Row 1 `div` `flex items-center gap-2 min-w-0`: the existing `img` (classes
   change to `w-5 h-5 shrink-0 object-contain` plus the existing
   `grayscale opacity-60` ternary), name `span` `text-body font-semibold text-ink truncate`
   with `title={e.label}`, then the existing admin refresh `button` unchanged
   (handler, disabled, title, aria-label, `after:-inset-[8px]` hit area).
2. Row 2 `div` `flex items-center gap-2 min-h-[28px]`: the value slot, then the
   status `Badge` with `className="ml-auto shrink-0"` (`className` is an
   existing `Badge` prop, so no interface change). Badge tone, glyph and label exactly as today
   (`statusBadge`).
   Value slot by state:
   - measured: `span` `text-title-sm text-ink tabular-nums leading-none` with `{e.pct}%`
   - `NOT_MEASURED`: nothing (the Badge "Not checked yet" carries the state)
   - unavailable: nothing (the Badge `AIV_COPY.engineNotAnswering` carries it)
3. Row 3, one meta line `div` `text-meta text-ink-2 truncate`, with `title` equal
   to its own full text:
   - measured: existing text `{e.mentioned} of {e.checked} prompts` plus
     `, best #N` when `bestPos !== null`
   - `NOT_MEASURED`: existing sentence
     `Not measured yet · run a collection to check this engine`
   - unavailable: the existing retry hint ternary (`Force Refresh to retry`,
     `Next run available ...`, `Run Collection to retry`)
4. Row 4, warn line, at most one, priority order: unavailable sentence, then
   `lastAttemptFailed`, then partial. Class
   `flex items-start gap-1 text-meta text-warn` with the `AlertTriangle size={12}`
   icon `shrink-0 mt-0.5`, and the sentence inside `span` `line-clamp-2 min-w-0`.
   The `div` `title` becomes the sentence text itself for non-admins and
   `` `${sentence} (${e.lastErrorCode})` `` for admins when a code exists, so the
   admin still sees the error code. Partial keeps its existing longer title
   strings. Sentences come from `engineNotAnsweringLine` and `enginePartialLine`
   unchanged.
5. Row 5, refresh failed (only when `engineRefreshFailed === e.id`): existing
   content and `text-neg` / `text-warn` ternary, class gains `truncate` and
   `title` with the full text.
6. Footer `div` `mt-auto text-meta text-ink-3 tabular-nums truncate`: the
   existing `formatRelativeOrDate(e.lastOkAt)` with its existing `title`, shown
   when `e.lastOkAt && !e.isUnavailable`. Omit the footer `div` otherwise.

D-19. Width and truncation at 1440 (content about 1,150 px):
- 1 engine: one column capped at 280 px, left aligned; the rest of the card is
  empty surface. Nothing truncates.
- 3 engines: 3 columns of 280 px. Nothing truncates.
- 5 engines: 5 columns of about 230 px. Nothing truncates in normal data.
- 7 engines: 7 columns of about 164 px. Name truncates only for long labels
  ("Google AI Mode" fits, about 110 px in `text-body`); the meta line
  "12 of 24 prompts, best #3" may truncate to an ellipsis, full text in `title`;
  warn sentences clamp at 2 lines.
- At 1024 to 1279 with 7 engines the columns hit their 132 px floor and the strip
  scrolls inside the card. Accepted.

D-20. Height target: Card at most 130 px for 1 to 7 engines in the common state
(rows 1, 2, 3, 6: padding 12, row 20, gap 4, row 28, gap 4, row 16, gap 4,
footer 16, padding 12, about 116 px).
A warn line adds up to 36 px in that one column; every column stretches to it.

D-21. `motion` stays only on the existing wrapper. No new motion.

D-22. Coming soon and locked, ONE quiet meta line at the right of the heading
row (it wraps under the heading on narrow screens). Container
`flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-3`. Order:
- if `comingSoonEngines.length > 0`: `span` `inline-flex items-center gap-1`
  with `Clock size={11}` and the existing
  `` `Coming soon: ${joinEngineLabels(...)}` `` string.
- if `lockedChipEngines.length > 0`: `span` `inline-flex items-center gap-1`
  with `Lock size={11}` and the existing "Locked on your plan" string, text
  unchanged. Then each locked engine as the existing `Link to="/account"` with the existing
  `aria-label` and `title`, class
  `inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[24px] px-1.5 rounded-badge text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors`,
  content: `img` `w-4 h-4 object-contain grayscale opacity-70`, then
  `span` `text-meta` with `{meta.label}`, then `span` `text-meta text-ink-3`
  with the existing `Unlock on {planLabel}`.

D-23. If `engineStatusCards.length === 0` but coming soon or locked exist, the
heading row renders alone with its meta line and no Card.

## 5. S3, Fix This closed by default (builder B, same file)

D-24. `const [showFixHub, setShowFixHub] = useState(false)`. Update the comment
above it to say the hub starts closed. `fixHubToggleRef`, `aria-expanded` and the
`Button` stay mounted in both states, so `afterFixMoved` keeps a focus target.

D-25. Closed summary. Compute at render, no state:
`const fixCounts = { P0: n0, P1: n1, P2: n2 }` from `openFixItems` by
`priority`. Summary string: the non-zero parts joined by ", ", each part
`` `${n} ${p}` ``, for example "2 P0, 5 P1, 5 P2" // copy: pending bg-copy.

D-26. `SectionHeader` props: `title`, `count` unchanged;
`description={showFixHub ? <existing sentence> : fixSummary}` where
`fixSummary` is the D-25 string, or `FIX_COPY.allDone` when
`openFixItems.length === 0`. So the existing description line shows only when
open; the summary takes its place when closed.

D-27. Toggle: `variant={showFixHub ? 'ghost' : 'secondary'}` (two literals), so
the closed header carries a bordered control and reads as clickable. Icon and
"Show" / "Hide" labels unchanged. Closed block height is about 60 px
(heading 20, description 18, the section's `mb-6`).

## 6. S4, Fix This open as priority columns (builder B, same file)

D-28. New local state beside `showAllFixes`:
`const [fixCursor, setFixCursor] = useState<{ P0: number; P1: number; P2: number }>({ P0: 0, P1: 0, P2: 0 })`.
Priority keys typed from `FixItem['priority']`.

D-29. Inside `<Collapse open={showFixHub}>`, the `Card pad="none" className="overflow-hidden"`
contains, in DOM order:
1. if `openFixItems.length === 0`: the existing all-done `div`, unchanged, and no
   columns.
2. else the columns grid `div`:
   `grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line`
3. the explainer `p`, moved below the columns, class
   `m-0 px-4 py-2.5 text-meta text-ink-2 bg-surface-2 border-t border-line`
   (was `border-b`). Text `FIX_COPY.explainer` unchanged.
4. the done-fixes block (`doneFixRows.length > 0`), unchanged.

D-30. One column per priority in the fixed order `(['P0', 'P1', 'P2'] as const)`.
For priority `p`:
- `list = openFixItems.filter(i => i.priority === p)` (keeps `openFixItems` order)
- `idx = list.length === 0 ? 0 : Math.min(fixCursor[p], list.length - 1)`
- `item = list[idx]`
When an item is marked done or dismissed it leaves `openFixItems`, so the same
`idx` now points at the next item; at the end `Math.min` falls back to the last.
That is the "next P0 comes up by itself" behaviour with no effect.

D-31. Column element:
`<section aria-label={`${p} fixes`} className="flex flex-col min-w-0 p-4">`
// copy: pending bg-copy (the aria-label).
Children in order:
1. Header `div` `flex items-center gap-2 mb-3 min-h-[28px]`:
   `Badge` with the existing tone mapping (`P0` neg, `P1` accent, else neutral)
   showing `p`; then, when `list.length > 0`, `span` `text-meta text-ink-3 tabular-nums`
   `` `${idx + 1} of ${list.length}` `` // copy: pending bg-copy; then, when
   `list.length > 1`, the Next button:
   `<Button variant="ghost" size="sm" icon={ChevronRight} className="ml-auto" aria-label={`Next ${p} fix`} onClick={() => setFixCursor(c => ({ ...c, [p]: (idx + 1) % list.length }))}>Next</Button>`
   with both strings marked copy: pending bg-copy. Add `ChevronRight` to the
   existing `lucide-react` import. Wrap around via the modulo. Focus stays on the
   button because the column and its header never unmount while `list.length > 1`.
2. Empty column (`list.length === 0`): `p` `m-0 text-meta text-ink-3`
   "Nothing open at this priority" // copy: pending bg-copy. Nothing else.
3. Current item, `div key={item.id} className="flex flex-col flex-1 min-w-0"`
   (the key remounts per item so button loading states never leak):
   - title `div` `text-heading text-ink line-clamp-2 break-words`, `title={item.title}`
   - description `div` `text-body text-ink-2 mt-1 line-clamp-4`, `title={item.description}`
   - `reopenedLine` box, unchanged markup and classes
   - Recommended fix box, class
     `mt-3 rounded-control bg-surface-2 p-3 text-body text-ink-2 max-h-[176px] overflow-y-auto`,
     with `tabIndex={0}` and `aria-label="Recommended fix"` (existing string), so
     keyboard users can scroll it. Inner label `span` unchanged. It scrolls, it
     does not clamp, because the fix text is the actionable content and the Copy
     prompt button copies a prompt, not this text.
   - `fixNotice` line, unchanged
   - buttons `div` `mt-auto pt-3 flex flex-row flex-wrap items-center gap-2`
     (was `mt-3 ...`): the three existing Buttons with unchanged props, handlers,
     labels and aria-labels.
Equal height: grid rows stretch, each column is `flex flex-col`, the item `div`
is `flex-1`, and `mt-auto` pins the buttons to the column bottom.

D-32. Below `lg` the three columns stack vertically in P0, P1, P2 order, divided by
`divide-y divide-line`, each still showing one item and its own Next control.

D-33. Remove from the DOM: the old `ul` over
`(showAllFixes ? openFixItems : openFixItems.slice(0, 3))` and the
"Show all N actions" / "Show fewer" block. `tsconfig.json` has
`"noUnusedLocals": false`, so `showAllFixes` and `setShowAllFixes` may stay
declared without a tsc error; delete the declaration anyway, with its two comment
lines, to keep the file honest. Nothing else reads it (grep shows lines 366,
2067, 2135, 2136 only).

D-34. Accessibility: the sr-only `fixAnnounce` live region stays exactly where it
is. The Fix This `motion.section` keeps `aria-label="Fix this"`. Heading order is
unchanged: page h1, then h2 for Engines (D-15) and Fix this, columns are labelled
regions without headings.

D-35. Contrast floor, all existing pairs already measured in Phase 3 and 4:
`text-ink` and `text-ink-2` on `bg-surface` and `bg-surface-2` at 4.5:1 or more
in both themes; `text-ink-3` is used only for meta text (`text-meta`), as in
Phase 4; the sparkline (`--ink-3` stroke, `--ink-2` dot) is decorative and
`aria-hidden`, so 1.4.11 does not apply. Focus rings come from `Button` and the
global focus style; the new scroll box gets the global `:focus-visible` ring.

## 7. Motion

D-36. No new motion anywhere. The Fix This open and close keeps the existing
`Collapse` (which already honours reduced motion). Next swaps the item without
animation: the job is reading, and a slide would delay it. Stat and ReadoutRow
gain no motion.

## 8. State inventory (what changes, per component)

| Component | Empty | Loading | Partial | Error | Locked by plan | Success |
|---|---|---|---|---|---|---|
| Stat tile | `emptyLabel`, no spark (unchanged) | `SkeletonStat` (unchanged) | spark hidden below 3 points | as empty | n/a | value plus 64 by 24 line |
| Engine column | `NOT_MEASURED`: Badge plus sentence | page skeleton (unchanged) | warn line row 4 | unavailable: Badge plus sentence plus retry hint | meta line link to `/account` | pct, counts, Badge, date |
| Fix columns | per column "Nothing open at this priority"; all zero: `FIX_COPY.allDone` | hub hidden until `fixRowsLoaded` (unchanged) | n/a | `fixNotice` inline (unchanged) | n/a | one item per priority with Next |

## 9. Handoff packets

D-37. Builder A (bg-app, Sonnet): `brandgeo-dashboard/src/components/ui/Stat.tsx`,
`brandgeo-dashboard/src/components/ui/ReadoutRow.tsx`. Sections 3 and 8 row 1.

D-38. Builder B (bg-app, Sonnet): `brandgeo-dashboard/src/pages/AIVisibility.tsx`
only, Blocks 3 and 4 plus the `showFixHub` default, the `fixCursor` state, and the
`ChevronRight` import. Sections 4 to 8.

Scopes are disjoint. Neither builder runs git, a build or a browser.

## 10. S5, acceptance checklist (bg-verify)

- [ ] A1. Overview at 1440: four tiles equal height, at most 120 px each plus
      borders; no wedge at the bottom of any tile; Mention rate, Avg position and
      Total checks show a 64 by 24 line with an end dot at the right of the value,
      vertically centred; Active prompts shows nothing there.
- [ ] A2. Overview at 1024 and 390: no sparkline shown, value never overlaps
      anything; at 768: sparklines shown, no overlap.
- [ ] A3. A series with all-equal points draws a flat centred line; fewer than 3
      points draws nothing.
- [ ] A4. AI Visibility demo at 1440 with Fix This closed: top of "Your prompts"
      at or above 760 px from the page top.
- [ ] A5. Engines Card at most 130 px tall with 1 engine (demo) and with 7 engines
      (admin client with all engines), all columns on one line at 1440.
- [ ] A6. Every engine state still visible: unavailable, not measured, partial,
      last attempt failed, refresh failed, status Badge, last checked date, admin
      refresh button with its 36 px hit area.
- [ ] A7. Coming soon and locked appear on one meta line; locked links go to
      `/account`, hit height at least 24 px desktop, 44 px at 390.
- [ ] A8. Fix This starts closed, summary reads like "2 P0, 5 P1, 5 P2", toggle
      shows `aria-expanded="false"`; opening shows three columns at lg and up,
      stacked below.
- [ ] A9. Next advances and wraps; hidden when a column has one item; focus stays
      on Next. Marking the current item done shows the next one at the same
      priority; focus moves to the hub toggle and `fixAnnounce` speaks (unchanged).
- [ ] A10. Buttons pinned to the column bottom; long Recommended fix scrolls and
      is reachable by Tab.
- [ ] A11. No horizontal page scroll at 390 and 1440 (real `scrollTo(600,0)` then
      read `scrollX`); the engine strip scrolls inside its card at 390.
- [ ] A12. Dark and light both checked; no raw hex, no slate or violet class, no
      em or en dash in the diff (rg with a positive control); every new string has
      its copy comment; `tsc` exit 0.

## 11. New user-facing strings (all copy: pending bg-copy)

- Fix summary pattern `{n} {priority}` joined by ", " (for example "2 P0, 5 P1, 5 P2")
- Column aria-label `{priority} fixes`
- Column counter `{index} of {total}`
- Button `Next`, aria-label `Next {priority} fix`
- `Nothing open at this priority`

## 12. Open questions

Q1. The Avg position sparkline draws a better (lower) position lower on the box.
Inverting it is a data-contract change in `Dashboard.tsx` or a new prop, both out
of this batch's guardrails. Owner `bg-architect` or a later ruling.
Q2. Whether "Locked on your plan" should read "Locked on your plan:" before the
links, for scanning, is a bg-copy call; kept unchanged here.
