PASS WITH FINDINGS. Phase 4 (6a47971) holds all three guardrails and breaks
nothing that needs a revert, but five MEDIUM findings stand: the locked
engine header in the AI Visibility matrix collides below about 1150 px and
still misses P4-24, the "Actioned" badge misses P4-18, Monogram takes "&" as an
initial, and every Notice loses its tone rule on hover.

# Phase 4 visual polish: independent review

Date: 2026-11-10. Reviewer seat: bg-verify (read only). Builder: not this
seat. Spec: `docs/design/phase3-visual/phase4-polish-spec.md` (P4-1 to P4-30).

## 1. Scope and method

- Commit under review: `6a47971` "feat(app): Phase 4 visual polish of the
  dashboard shell, surfaces and tables", already pushed and live.
- Parent for dashboard code: `733b6f7` (Phase 3).
- Diff: `git diff 733b6f7 6a47971 -- brandgeo-dashboard`, 23 files, 372
  insertions, 247 deletions, saved as the 1665 line review diff. The saved
  diff was compared with `diff -q` against a fresh `git diff` and is
  identical, so the reviewed diff is the commit.
- Changed files: `src/components/{BrandLogo,EmptyState,EngineChip,Layout,
  PromptResultCell}.tsx`, `src/components/ui/{Badge,BarList,Card,DataList,
  HeroAnswer,Monogram (new),ReadoutRow,Stat,skeletons}.tsx`,
  `src/components/ui/tableClasses.ts`, `src/index.css`,
  `tailwind.config.js`, `src/pages/{AIVisibility,BrandSentiment,Competitors,
  Dashboard,Mentions,Recommendations}.tsx`.
- The working tree equals `6a47971` for every touched src file (byte
  identical, except `Recommendations.tsx`, which differs in line endings
  only: `git diff 6a47971 -- <file>` is empty). Line numbers below are from
  the current files.

Method: four read only lenses (guardrails, acceptance, accessibility and
theme, regression and layout), two skeptics who re-read every finding
against source and against `git show 733b6f7:<path>`, and one critic who
looked for what the lenses missed. The report writer reproduced every
critic finding and every severity disagreement from source before
including it.

Checks run by the lenses, with results:

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` in `brandgeo-dashboard` | exit 0, no output |
| `node tests/tokens_sync.test.js` | 115 passed, 0 failed |
| the other 49 `tests/*.test.js`, run one by one | 49 pass, 0 fail (50 of 50 green) |
| `git diff --stat 733b6f7 6a47971 -- brandgeo-dashboard` | 23 files, matches the declared list |
| diff grep for hooks, queries, context, handlers, routes, keys, sort, filter, rounding | no change; handler lines appear only as moved, unchanged lines |
| per component compare of export and prop lines, parent vs commit | only Badge TONE values and tableClasses values changed; Monogram and page local ShareLabel are new |
| `rg -n "time-pill" src` | 0 hits |
| `rg -n "#0d1425" src/components/Layout.tsx` | 0 hits |
| `rg -n "dark-[0-9]\|slate-\|white/\|black/" src/components/Layout.tsx` | 1 hit, line 526, false positive on `translate-` (I1) |
| dash scan of added lines with `rg`, with a positive control | 0 added dashes; control fired |
| `git diff --stat 733b6f7 6a47971 -- package.json package-lock.json` | empty, no dependency change |
| Tailwind version in node_modules | 3.4.19 (supports `aria-expanded:`, `overflow-x-clip`, `min-h-8`) |
| contrast script on the index.css token triplets | 56 pairs per theme plus 8 alpha composites, all text pairs at or above 4.5:1 (section 4, I10) |
| screenshots opened | all 28 in `docs/design/phase3-visual/after-p4/` |
| pixel read of `competitors-desktop-dark.png` at x 270 to 281, y 766 to 775 | header fill outside the rounded border (L6) |

Not run, by instruction: `npm run build`, vite, a dev server, any browser,
any production query.

Screenshot timing: `ai-visibility` shots are 06:52Z and `competitors` shots
06:53Z, after the other routes (06:48 to 06:49Z) and before the 06:59Z
commit, so they probably include the two late fixes. Source was treated as
authoritative throughout.

## 2. Guardrails

**G1 Visuals only: HELD.** No Supabase query, data fetch, `useEffect`,
`useMemo`, `useCallback`, `useState`, results context or billing line was
added, removed or changed. The Layout status line renders the same data
(`progress.clientName`, `done`, `total`, `collectPct`,
`describeRun(runNotice)`) with the same handlers (`stopCollection`,
`dismissRunNotice`, `closeSidebar`); the new dot tone reads the existing
`runNotice.kind` and `runNotice.failed`. HeroAnswer's new loading branch
picks a skeleton by the existing `visual` prop. New `role="status"` and
`aria-live` attributes are markup, not logic (they are judged as findings
L3 and I4, not as a guardrail breach).

**G2 Component signatures: HELD.** No existing props interface or default
changed. Badge (glyph prop already existed), Stat (same `spark` prop and
`< 2` guard), HeroAnswer (badge type `{label, tone, glyph?}` unchanged),
EngineChip, EmptyState, DataList, Card (className and style through its
existing rest props) and BarList (`label: ReactNode` already) keep their
interfaces. `tableClasses.thead` is now `''` with its name kept (I16).
`Monogram` is new and not exported from `ui/index.ts`.

**G3 Theme safety: HELD.** Every added colour reads a token except
`.scrim { background-color: rgb(0 0 0 / 0.6); }` (`src/index.css:739`),
which replaces `bg-black/60` with the same theme independent value (I8),
and the `.spark-fade` mask, which uses only alpha. Light and dark contrast
of every new text pair was computed from the token triplets and passes
(section 4).

## 3. Acceptance table

Count: 22 MET, 3 PARTIAL, 5 NOT VERIFIABLE (need a browser or a build),
0 NOT MET in full.

| Id | Status | Evidence |
|---|---|---|
| P4-1 | MET | `src/index.css:706-734`: the A6 block inside `@layer components` (label-caps :708, card-accent-top :709-711, spark-fade :712, table-head-sticky :713-714, status-dot :715-717, reveal and reveal-row :718-719, side-row :720-725), keyframes, the 767 px side-row rule and the reduced-motion block :731-734. `rg "time-pill" src` returns nothing. |
| P4-2 | MET | `index.css:621-634`: `.nav-item.is-active` surface-3, weight 500, inset ring line-2; `::before` 2 px by 20 px accent-ink with glow; svg ink-3. Visible in `overview-desktop-dark.png` and `prompts-desktop-light.png`. Computed values not measured. |
| P4-3 | MET | The regex returns only `Layout.tsx:526` `'-translate-x-full md:translate-x-0'`, a false positive on `tran-slate-`. No legacy colour class remains; `bg-black/60` became `.scrim` (`Layout.tsx:504`). Criterion regex is defective (I1). |
| P4-4 | MET | `.label-caps` (12 px, 500, 0.06em, uppercase) on group headings (`Layout.tsx:644, 662, 685`), Stat label (`Stat.tsx:53`), th and thRight (`tableClasses.ts:10-11`), status words (`Layout.tsx:570, 605`), time strip caption (`Layout.tsx:1121`). Also on places A3 and C3 ask for, which conflicts with the "exactly four places" wording (I2). Not applied to "Client" (L2). |
| P4-5 | MET | Logo row `Layout.tsx:530` `h-12 ... border-b border-line` and time strip `Layout.tsx:1118` `h-12 border-b border-line`: both hairlines at y 47 in `overview-desktop-dark.png`. The admin view-as-user banner breaks the alignment when shown; outside the default state. |
| P4-6 | MET | `.side-row` on profile `:987`, billing `:996`, language `:1013`, client switcher `:723`, internal `:807`, "Back to BrandGEO" `:673`. See L4 and L11 for consequences of the fixed geometry. |
| P4-7 | MET | `Layout.tsx:566-591`: one `role="status" aria-live="polite"` line on bg-canvas with `status-dot text-accent is-live` (:568), mono counter (:582), 2 px hairline (:585-590) and Stop. No Loader2 in the slot. No screenshot of a running collection exists; checked from source. |
| P4-8 | MET | `Layout.tsx:598-620`: dot tone `stopped` ink-3, `failed > 0` warn, else pos; same `dismissRunNotice` and same NavLink `onClick` with `describeRun(runNotice)`. |
| P4-9 | NOT VERIFIABLE | Import half met: `Layout.tsx:1-26` imports no `motion/react` or `lib/motion`, nor do its direct UI imports. Entry chunk size half needs `vite build`, not run. The builder's +223 bytes is not reproduced. |
| P4-10 | MET | Only Loader2 is `Layout.tsx:998` `animate-spin motion-reduce:animate-none`; no `#0d1425`. |
| P4-11 | MET | `tailwind.config.js:99` `kpi: ['32px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '600' }]`, the only fontSize line added. |
| P4-12 | MET | `Stat.tsx:62` `text-title md:text-kpi`; `Stat.tsx:36-44` full width `spark-fade ... absolute inset-x-0 bottom-0 h-8 w-full`; ReadoutRow cells `relative overflow-hidden` (`ReadoutRow.tsx:11`). Side effect L10. |
| P4-13 | NOT VERIFIABLE | Static half met: `ReadoutRow.tsx:11` and `skeletons.tsx:38` share `relative overflow-hidden bg-surface p-5 pb-10 min-h-[136px] min-w-0`; Dashboard uses SkeletonReadout (:200). CLS below 0.05 needs a browser. |
| P4-14 | MET | `Card.tsx:28` base `... transition-colors duration-[180ms] ease-out hover:border-line-2 motion-reduce:transition-none`. Built as specified, but it erases Notice's tone rule on hover (D5) and makes static cards react (I14). |
| P4-15 | PARTIAL | `card-accent-top` only in `HeroAnswer.tsx:45, 52`, so routes with a hero show exactly one. `/prompts` has no HeroAnswer and shows 0. The builder followed B1 ("nowhere else"); the criterion contradicts the spec (I3). |
| P4-16 | MET | `HeroAnswer.tsx:52` min height only when `visual` is passed. |
| P4-17 | MET | `HeroAnswer.tsx:59-63`: no `aria-label` on the value `p`, `<span className="sr-only">{' '}</span>` between value and unit. |
| P4-18 | PARTIAL | Rings (`Badge.tsx:16-20`) and the % gap met; glyphs added on Dashboard (:242, :404), BrandSentiment (:233-241), Recommendations hero (:793) and tier badges (:811). Not met: `Recommendations.tsx:443` "Actioned" pos badge has no glyph (D3). |
| P4-19 | MET | `EmptyState.tsx:62` tile ring; `:52-54` page variant dashed. No caller uses the page variant (I13). |
| P4-20 | NOT VERIFIABLE | `tableClasses.ts:7` wrap `overflow-x-auto lg:overflow-x-clip lg:overflow-y-visible`, th `table-head-sticky`; the 720 px Competitors table fits the 736 px column at 1024. Real sticking and page scroll at 390, 768, 1280 need a browser. Corner defect L6 found by pixel read. |
| P4-21 | MET | `tableClasses.ts:13-15` td `h-11`, tdRight `text-right tabular-nums`; 44 px row pitch in `competitors-desktop-dark.png`. |
| P4-22 | MET | Monograms on table (`Competitors.tsx:428, 444`), phone list (:483) and share list (:57); `you` accent; text only, no image or fetch. The initials rule is defective (D4). |
| P4-23 | MET | `EngineChip.tsx:64` non-interactive span without chip border, background or hover. |
| P4-24 | PARTIAL | Logo tiles met (`AIVisibility.tsx:2382, 2396`); sticky columns present in source, not verified at 768. Not met: locked header (:2388-2400) shows tile plus plan only, no engine name, no lock (D2), and the late nowrap causes a collision (D1). |
| P4-25 | MET | `PromptResultCell.tsx:132` `font-semibold` plus `text-ink` when mentioned. |
| P4-26 | MET | `AIVisibility.tsx:1824` 12 px glyph with `after:-inset-[10px] max-md:after:-inset-4`: 32 px desktop, 44 px below 768. Not measured. |
| P4-27 | NOT VERIFIABLE | Four `.reveal` blocks per route on Dashboard, BrandSentiment, Mentions, Recommendations, Competitors; `.reveal-row` capped at 10 rows (`DataList.tsx:25`, `AIVisibility.tsx:1396`, `BrandSentiment.tsx:278`, `Recommendations.tsx:806`); reduced-motion overrides at `index.css:731-734`. `document.getAnimations()` needs a browser. Replay defect L9. |
| P4-28 | MET | No added `hover:scale`, `hover:translate`, `whileHover` or `hoverLift`; the only transform is `@keyframes status-ping`. |
| P4-29 | NOT VERIFIABLE | Phase 3 AC-12/14/18/19/20/29/30 need computed styles in a browser. Token level contrast passes (section 4). |
| P4-30 | MET | No added or removed hook, query, handler or props line beyond the new MonogramProps and type imports; added line dash scan 0 with control. |

## 4. Findings

Counts: 0 BLOCKER, 0 MAJOR, 5 MEDIUM, 11 LOW, 17 INFO. 1 refuted.
Pre-existing (identical at `733b6f7`): D2, D3, I1, I11 and part of I17. D2
and D3 are counted against Phase 4 because its spec required the fix.

Contrast summary (computed from the `index.css` `:root` and `html.light`
triplets, WCAG relative luminance): label-caps ink-3 on canvas, surface,
surface-2, surface-3 is 5.90, 5.66, 5.36, 4.97 dark and 5.65, 6.03, 5.51,
5.13 light; badges 5.80 to 9.00 dark, 6.28 to 7.79 light; monogram 6.38 and
5.88 dark, 6.28 and 5.98 light; focus ring accent-ink 5.88 to 7.23 dark,
5.98 to 7.10 light; status dots 4.65 to 11.79 dark, 4.02 (pos, a non-text
dot) to 8.12 light. No new text pair fails 4.5:1.

### MEDIUM

**D1. Locked engine header labels are `whitespace-nowrap` and overflow
their track, so adjacent labels collide below about 1150 px.** Introduced.
Owner: bg-app.
`brandgeo-dashboard/src/pages/AIVisibility.tsx:2399`

```
<span className="text-meta leading-none text-ink-2 whitespace-nowrap">{PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]}</span>
```

The track is `minmax(${LOCKED_COL_MIN_REM}rem, 4.5rem)` with
`LOCKED_COL_MIN_REM = 2.75` (:1117-1118), so 44 to 72 px, and the Link
(:2394) is `min-w-0` with no clip. At `733b6f7` the same span had no
`whitespace-nowrap`, so a long label wrapped inside its track. For a Growth
client, `pickLockedColumns` puts ai_overview and grok first and both map to
`growth_pro`, so "Growth PRO" prints twice side by side. Grid minimum:
40 + 208 + 5 x 56 + 2 x 44 = 616 px. Below roughly 1080 to 1150 px viewport
the locked tracks sit near 44 px while "Growth PRO" at 12 px is estimated at
66 to 70 px wide (estimate from glyph widths, not measured; "Essentials" was
measured at about 59 px in a crop). Failure: a Growth customer on a tablet
or a narrow window sees the two locked headers overprint each other at the
right edge of the matrix. The 1440 screenshots cannot show it because every
track reaches 72 px there. Fix: drop `whitespace-nowrap` (or allow two
lines with `text-center break-words`), and fold the fix into D2.

**D2. Locked engine column header shows only the plan name: no visible
engine name and no lock (P4-24 not met).** Pre-existing, required by the
spec. Owner: bg-app. Merges F1, F9, F22.
`brandgeo-dashboard/src/pages/AIVisibility.tsx:2396-2399`

```
<span className="w-6 h-6 rounded-badge bg-surface ring-1 ring-inset ring-line ...">
  <img ... className="w-4 h-4 object-contain grayscale opacity-70" />
</span>
<span className="text-meta leading-none text-ink-2 whitespace-nowrap">{PLAN_LABELS[ENGINE_UNLOCK_PLAN[id]]}</span>
```

Spec C3 asks for line 1 the engine name (`text-meta text-ink-2 truncate
max-w-full`) and line 2 `Lock size={10}` plus the plan, and says this
"Replaces the bare plan name under the icon". The engine name exists only
in `aria-label` (:2392) and `title` (:2393). `ai-visibility-desktop-dark.png`
and `-light.png` show columns headed "Radar" and "Essentials" under grey
logos. Failure: a Free or Radar user cannot tell which engine a locked
column stands for unless they recognise a greyed logo, and "Radar" reads
like an engine name. `opacity-70` itself is what C3 asks for and is not a
defect. Fix: build C3 as written; D1 is solved in the same edit.

**D3. Recommendations "Actioned" status badge is pos tone with no glyph
(P4-18 not met).** Pre-existing, required by the spec. Owner: bg-app.
Merges F2, F10, F25. The skeptics split MEDIUM and LOW; the report writer
rules MEDIUM because a numbered acceptance criterion fails.
`brandgeo-dashboard/src/pages/Recommendations.tsx:443`

```
<Badge tone={st.tone}>{st.label}</Badge>
```

with `actioned: { tone: 'pos', label: 'Actioned' }` at :221. The hero badge
(:793) and tier badges (:811) got glyphs; this one was missed. Identical at
`733b6f7:441`. Failure: after "Mark actioned", the card shows a green pill
without the check glyph, inconsistent with every other status badge on the
page. The word carries the meaning, so this is not a WCAG 1.4.1 failure.
Fix: pass `glyph={<StatusGlyph kind=... size={12} />}` for pos, warn and neg
tones of STATUS_STYLE.

**D4. Monogram takes the first character of the second token, so names
with "&" render "C&" and "S&".** Introduced (new component). Owner: bg-app.
Merges F11, F26, F34. The skeptics split MEDIUM and LOW; the report writer
rules MEDIUM because it contradicts the spec's own rule on a new component
and shows on three surfaces of one route in the shipped demo.
`brandgeo-dashboard/src/components/ui/Monogram.tsx:15`

```
const second = words.length >= 2 ? (Array.from(words[1])[0] ?? '') : ''
```

after `name.trim().split(/\s+/).filter(Boolean)` (:12). Spec C2: "first
letter of the second word". Demo data "Cedar & Ash Events" and "Sprout &
Spoon" give "C&" and "S&", visible in `competitors-desktop-dark.png`,
`competitors-desktop-light.png` and both mobile Competitors shots (share
list, table, phone list). A leading bracket or quote also becomes an
initial. The element is `aria-hidden`, so screen reader output is
unaffected. Fix: take the first letter of each word by a Unicode letter
test (`/\p{L}|\p{N}/u`) and skip tokens that contain none.

**D5. Every Notice loses its warn, neg or accent left rule while hovered:
the new base `hover:border-line-2` on Card repaints all four sides.**
Introduced. Found by the critic, reproduced by the report writer. Owner:
bg-app, with a bg-design ruling on whether P4-14 should exempt Notice.
`brandgeo-dashboard/src/components/ui/Card.tsx:28`

```
'bg-surface border border-line rounded-card shadow-card transition-colors duration-[180ms] ease-out hover:border-line-2 motion-reduce:transition-none',
```

At `733b6f7` the hover border applied only when `interactive` was set.
`src/components/ui/Notice.tsx` (untouched) renders `<Card ...
className={cx('border-l-[3px] ...', RULE[tone])}>` with RULE `border-l-warn`,
`border-l-neg`, `border-l-accent-ink`. `.hover\:border-line-2:hover` sets
`border-color` at specificity (0,2,0) and beats `.border-l-warn`
`border-left-color` at (0,1,0), so on hover the 3 px tone rule fades to
line-2 grey over 180 ms. Callers: `Prompts.tsx:446` (neg cap error) and
`:453` (warn or accent plan limit notice), `Competitors.tsx:343` (neg),
`Recommendations.tsx:756` (warn). Failure: a customer at their prompt cap
moves the pointer toward the Upgrade action and the amber rule turns grey
for as long as the pointer is on the notice; the glyph remains. Derived
from Tailwind specificity, not observed in a browser. Fix: in Notice add
`hover:border-l-{tone}` alongside RULE, or exempt Notice from the base hover
through a Card option decided by bg-design (a props change would need the
G2 ruling).

### LOW

**L1. HeroAnswer loading skeleton without a visual is shorter than the
content it replaces, so Recommendations and empty Mentions jump on load.**
Introduced (shape prescribed by spec B4). Owner: bg-design.
`brandgeo-dashboard/src/components/ui/HeroAnswer.tsx:30-41`: the non-visual
loading branch is a content height card with `h-10`, `h-6`, `h-4` blocks,
about 152 px plus border at md. Callers `Recommendations.tsx:517`
(`<HeroAnswer loading answer="" />`) and `Mentions.tsx:179-180`. The real
Recommendations hero is about 217 px with one engine row and grows about
37 px per engine; the empty branch is `min-h-[240px]`. Before Phase 4 the
skeleton was SkeletonHero with the same 240 px floor. Failure: the block
below the hero shifts down 60 to 290 px after first paint. Downgraded from
MEDIUM by skeptic 1 because the shape is spec verbatim and P4-13 concerns
ReadoutRow, not HeroAnswer.

**L2. Sidebar "Client" section label was not converted to label-caps while
its sibling "Collection market" was.** Introduced. Owner: bg-app. Merges
F13, F39. `brandgeo-dashboard/src/components/Layout.tsx:709`
`<div className="text-meta text-ink-3 px-1 mb-1.5">{t.sidebar_client}</div>`
against :864 `<span className="label-caps">Collection market</span>`. Spec
A3 sets both to `label-caps px-3 mb-1`. Failure: an admin sees two sibling
section labels in two registers in one panel.

**L3. The new status live regions mount together with their content and
announce a bare counter.** Introduced. Owner: bg-design.
`brandgeo-dashboard/src/components/Layout.tsx:566` and :598 are
conditionally mounted `role="status" aria-live="polite"` regions, so the
end-of-run text arrives in a freshly inserted region, which assistive
technology does not announce reliably. The running region holds
`{progress.done}/{progress.total}` and `{collectPct}%` (:582-583), which
change every tick. On phones, :1106 `role="status"` holds only an
`aria-hidden` dot and `{progress.done}/{progress.total}`, so the
announcement is "3/20" with no word. At `733b6f7` there was no live region
at all. Failure: a screen reader user hears unlabelled counts and may never
hear "Done". Fix: keep one persistent region mounted and change its text;
add "prompts" as sr-only text to the counter.

**L4. `.side-row` uses a fixed `height`, so the label overflows under a
text only zoom.** Introduced (rule from spec A6). Owner: bg-design.
`brandgeo-dashboard/src/index.css:720` `height: 36px; padding: 0 12px;
font-size: 14px; line-height: 20px` and the 767 px rule `height: 44px`;
`.nav-item` uses `min-height`. Failure: Firefox "Zoom text only" at 200%
puts a 40 px line box in a 36 px row and the label spills into the next
row over the 2 px gap (WCAG 1.4.4). Full page zoom is unaffected. Fix:
`min-height` instead of `height`.

**L5. The end-of-run link now looks like plain status text.** Introduced
(spec A4 asked for "no underline, no accent"). Owner: bg-design.
`brandgeo-dashboard/src/components/Layout.tsx:617`
`className="block mt-1 text-meta text-ink-2 hover:text-ink"`, previously
`text-xs text-accent-ink font-medium hover:underline`. Failure: a pointer
user reads "Collection complete: 20 prompts checked" as a status and does
not know it opens AI Visibility. Not a WCAG failure; a design call.

**L6. Competitors table at 1024 px and up paints the sticky header fill in
square corners outside the rounded card border.** Introduced. Owner:
bg-app. `brandgeo-dashboard/src/components/ui/tableClasses.ts:7`
`wrap: 'overflow-x-auto lg:overflow-x-clip lg:overflow-y-visible rounded-card ...'`.
With clip on one axis and visible on the other the wrap no longer clips to
its radius. Pixel read of `competitors-desktop-dark.png`: x 273 to 278,
y 769 to 774 read 16171d (header fill) against canvas 0a0b0e while the
border starts curving at x 279; in light the difference is nearly
invisible. Fix: `lg:overflow-clip` on both axes (still not a scroll
container, so the th still sticks to `main`), or round the first and last
th.

**L7. While collecting, the client name gets about 35 px and truncates to
a few letters.** Introduced. Owner: bg-design.
`brandgeo-dashboard/src/components/Layout.tsx:568-579`: dot, `label-caps`
"Collecting", `truncate min-w-0` client name and the `ml-auto` Stop button
on one row in a 240 px aside with `px-4`. Estimate, not measured: about 208
px of content minus about 85 (label), 58 (Stop) and 30 (dot and gaps)
leaves about 35 px. At `733b6f7` the name had up to 120 px. Failure: an
admin cannot see which client is running. No screenshot shows this state.

**L8. Uppercase tracked KPI labels truncate in longer locales at 390 and
1024 px.** Introduced (uppercase mandated by P4-4). Owner: bg-design.
`brandgeo-dashboard/src/components/ui/Stat.tsx:53`
`<div className="flex items-center gap-1.5 label-caps">` with
`<span className="truncate">`. A two column ReadoutRow cell at 390 leaves
about 118 px for the label. i18n labels "Tasa de menciones", "Rata de
mentionare", "Verifications totales" exceed that in uppercase tracked form.
"Verificaciones totales" probably truncated in sentence case too, so that
one is not new. Widths are estimates from a screenshot anchor.

**L9. `.reveal-row` replays when a row gains the class after mount (AI
Visibility re-sort and DataList filters).** Introduced. Owner: bg-design
ruling, then bg-app. Merges F38 and critic C2.
`brandgeo-dashboard/src/pages/AIVisibility.tsx:1396`
`const revealCls = num <= 10 ? ' reveal-row' : ''` is keyed to the current
rank; rows render in `<motion.div key={prompt.id} layout="position">`.
`brandgeo-dashboard/src/components/ui/DataList.tsx:25` adds `reveal-row`
when `i < 10`, and consumers key by id (`Prompts.tsx:593`,
`Mentions.tsx:241`, `BrandSentiment.tsx:406`) over filtered arrays
(`Prompts.tsx:200`). A keyed element that gains the class starts the
animation (`backwards` fill drops it to opacity 0 first). Failure: during a
collection, rows that move into the top 10 blink and fade; on /prompts,
/mentions and /sentiment a filter click makes the rows that move under
index 10 fade in while their neighbours stay solid. Reduced motion is
guarded. Replay on a plain keyed DOM move was not verified. Fix: apply the
class only on first mount (for example a mounted flag in the parent).

**L10. The sparkline mask hides each series' minimum and makes a steady
series near invisible.** Introduced (follows spec B3). Owner: bg-design.
`brandgeo-dashboard/src/components/ui/Stat.tsx:31-32` maps the minimum to
y 30 of 32 and a constant series (`span || 1`) to y 30 everywhere; the
`.spark-fade` mask runs opaque to transparent top to bottom
(`index.css:712`), so those points draw at about 6% alpha. Failure: a
steady metric shows no trend line, and a falling metric's latest low point
fades out. Upgraded from INFO by skeptic 2 because it misleads rather than
just looks plain.

**L11. The 12 px side-row gap narrows the language and client switcher
labels.** Introduced (gap from spec A6 verbatim). Found by the critic,
reproduced by the report writer for the class change only. Owner:
bg-design. `brandgeo-dashboard/src/index.css:720` `.side-row { ... gap:
12px; ... }`; the language trigger (`Layout.tsx:1013`) was `flex
items-center gap-2 ... px-3 py-2` at `733b6f7` (8 px gap). Estimate from
classes, not measured: the label span drops from about 62 to 54 px on
desktop and from 46 to 38 px on a phone, so "Nederlands" and "Português"
truncate earlier; the client switcher loses about 6 px the same way.

### INFO

**I1. The P4-3 regex gives a false positive on `translate-`.**
Pre-existing line. Owner: bg-design (criterion text). Merges F8, F15, F31,
F41. `Layout.tsx:526` `'-translate-x-full md:translate-x-0'` matches
`slate-`. Use `\bslate-` in the criterion.

**I2. Spec conflict: AM-1 and P4-4 say uppercase in "exactly four places",
but A3 and C3 add more** (`AIVisibility.tsx:2378-2379`, `Layout.tsx:821,
864`). The code follows the detailed sections. Owner: bg-design.

**I3. Spec conflict: P4-15 "exactly one hairline per route" cannot hold on
/prompts**, which has no HeroAnswer, while B1 says "nowhere else". Owner:
bg-design.

**I4. The mobile collection chip gained `role="status"` beyond spec A4**
(`Layout.tsx:1106`). It mirrors the desktop region, and the closed drawer
is `inert`, so it is the only live region on phones. Wording issue in L3.

**I5. BarList phone label column widened `w-28` to `w-36`**
(`BarList.tsx:23`), the late overlap fix; reaches `Dashboard.tsx:344` and
`Competitors.tsx:512` too, so phone bars are 32 px shorter there. Spec C4
said "label column as today". Owner ruling. Merges F6, F17.

**I6. Locked matrix column max widened 3.5rem to 4.5rem**
(`AIVisibility.tsx:1118`), part of the late header fix; `tableMinWidth`
unchanged. Owner ruling.

**I7. BrandLogo fallback weight `font-bold` to `font-semibold`**
(`BrandLogo.tsx:56`), not named by the spec, consistent with the 600 cap.
Owner ruling.

**I8. `.scrim` carries a literal colour and the sidebar notice dismiss
changed `text-neg/70 hover:text-neg` to `text-neg hover:text-ink`**
(`index.css:739`, `Layout.tsx:504`). Same scrim value as before; no G3
breach. Owner ruling. Merges F20, F28.

**I9. Stale comments**: `Card.tsx:3-4` still says only `interactive`
reacts to the pointer; `Layout.tsx:553-554` says the header is 72 px tall
while the logo row is now `h-12`. Owner: bg-app. Merges F5, F21.

**I10. Worst case contrast of the sticky th while rows scroll under it.**
`index.css:713` `rgb(var(--surface-2) / 0.85)` with ink-3 text: 5.41:1
dark and 5.60:1 light over surface, about 3.6:1 dark and 3.97:1 light if
full ink sat directly behind. Tokens: dark surface-2 22,23,30, ink
232,233,237, ink-3 135,141,153; light surface-2 244,244,251, ink 9,9,15,
ink-3 98,98,108. The 4 px blur keeps the real value near the plain case.
Computed, not observed. Owner ruling.

**I11. The infinite status-dot pulse has no pause control (WCAG 2.2.2).**
Pre-existing in kind: `733b6f7` had an infinite `Loader2 animate-spin`
without a motion guard in the same slot; Phase 4 is an improvement
(`index.css:716`, static under reduced motion). Owner ruling.

**I12. Share list names truncate at 640 px and up with no `title`**
(`Competitors.tsx:58` `min-w-0 break-words sm:truncate`); the full name is
in the table below. Owner: bg-app.

**I13. EmptyState page variant has no caller**, so B6 and the P4-19 page
half have no visible reach (`EmptyState.tsx:52`). Owner: bg-design.

**I14. Every Card now changes border on hover, including static panels**
(`Card.tsx:28`), as P4-14 specifies; hints clickability. See D5 for the
Notice regression. Owner: bg-design.

**I15. End-of-run Dismiss now precedes the link in tab order**
(`Layout.tsx:607`, link :614-620), per spec A4. Nothing breaks.

**I16. `tableClasses.thead` is now `''`** (`tableClasses.ts:9`), name
kept; the only consumer (`Competitors.tsx:415`) gets its background from
the sticky th. G2 not violated.

**I17. Lock icons on locked nav rows turn violet when active and ink-2 on
hover, against spec A2 ("stay text-ink-3").** `index.css:634`
`.nav-item.is-active svg { color: rgb(var(--accent-ink)); }` (unchanged,
pre-existing) and the new `:633` `.nav-item:hover svg` override
`Lock size={12} className="ml-auto text-ink-3"` at `Layout.tsx:696-697`.
Only the hover recolour is new. Found by the critic, reproduced by the
report writer. Owner: bg-design ruling.

## 5. Refuted or corrected claims

| Claim | Outcome | Reason |
|---|---|---|
| F3: the counter is announced twice when the phone drawer is open | REFUTED | The mobile header sits in the wrapper at `Layout.tsx:1066-1073` with `inert={isMobile && sidebarOpen ? '' : undefined}`; with the drawer closed the aside is inert (:521). The two regions are never exposed together. |
| F22: the `opacity-70` on the locked logo is a defect | CORRECTED | Spec C3 asks for `grayscale opacity-70`. |
| F2: the Actioned badge was introduced by Phase 4 | CORRECTED | Identical at `733b6f7:441`; pre-existing, required by the spec (D3). |
| F10: the Actioned badge fails WCAG 1.4.1 | CORRECTED | The word "Actioned" carries the status in text. |
| F33: violates P4-13 | CORRECTED | P4-13 concerns ReadoutRow; L1 stands as a polish gap. |
| F37: all listed labels fitted before uppercase | CORRECTED | "Verificaciones totales" probably truncated in sentence case too. |
| F5, F6, F8, F9, F14 duplicate entries, F26, F28, F31, F39, F41 | MERGED | Duplicates folded into D2, D3, D4, L2, L3, I1, I5, I8, I9. |

Ruled items not re-opened: M7 (32 px visual, 44 px hit area), M11 (two
denominators, bg-architect), L13 (tritan in the sentiment gate), L16 (W, M,
Q accessible names, pending ruling), placeholder copy wording (bg-copy).

## 6. Not checked

- Nothing was rendered in a browser: no computed styles, no sticky
  behaviour while scrolling (P4-20, the AI Visibility sticky columns at
  768), no CLS (P4-13), no `document.getAnimations()` under reduced motion
  (P4-27), no hit area or focus ring measurement, no horizontal scroll
  check at 320, 768 or 1024.
- `npm run build` and the entry chunk size against HEAD (P4-9 size half);
  the builder's +223 bytes is not reproduced.
- Whether the sticky `z-[1]` cells in the AI Visibility matrix paint over
  the focus outline of neighbouring row buttons.
- No screen reader run: L3 and I4 are reasoned from markup.
- No screenshot shows a running collection, the Done or Stopped line, the
  error notice, a loading skeleton, a 768, 1024 or 320 width, a Growth plan
  matrix (D1), the admin client switcher, or any hover state (D5, I14).
- Widths in D1, L7, L8 and L11 are estimates from glyph advances and class
  arithmetic, not DOM measurements.
- Light mode in a real browser beyond the screenshots; Safari versions
  without `overflow-x: clip` (the Competitors header would then not stick).
- The live dashboard signed in with a real account, any viewer session,
  production data; admin and partner pages (AffiliatesAdmin, Prospects,
  Tickets, AffiliatePortal) were checked by grep for shared primitives
  only.
- Other locales at narrow widths beyond the label estimate in L8.

## 7. Revert, hotfix and routing

No revert and no hotfix. No BLOCKER or MAJOR, no guardrail broken, and the
live build loses no data or function. D1 is the most visible defect (a
paying Growth customer on a window under about 1150 px) and should ride
the next dashboard batch, not a build of its own.

Next round:

1. bg-app, one batch: D1 and D2 together (build C3 as written), D3, D4, D5
   (once bg-design rules on the Notice exemption), L2, L6, I9, I12.
2. bg-design: rule on D5, L1, L3, L4, L5, L7, L8, L9 (class on first mount),
   L10, L11, I13, I14, I17; correct the spec text for I1, I2 and I3.
3. Owner ruling: I5, I6, I7, I8, I10, I11 (accept or revert the
   unspecified scope changes).
4. bg-verify re-review on the fix diff, with a browser pass for P4-9,
   P4-13, P4-20, P4-27 and P4-29 and a Growth plan matrix at 768 and 1024.
