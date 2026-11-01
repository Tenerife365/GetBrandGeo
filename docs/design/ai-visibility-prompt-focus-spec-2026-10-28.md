# AI Visibility, prompt-first: build spec for release one

```
INTENT: /ai-visibility prompt area, make the prompts that work lead and make every non-result honest
SCOPE: docs/design/ (write, this file only); brandgeo-dashboard/src/, docs/design/, docs/DESIGN-SYSTEM.md (read)
MODEL: opus  |  STOP AFTER: /build
```

**Status:** spec, ready for `bg-app`. Nothing in `src/` was edited to write it.
**Binding brief:** `docs/design/ai-visibility-prompt-focus-2026-10-18.md`, section 8 RULED 2026-10-28
by Constantin ("da, de acord"): default sort best performing first, locked engines as columns
(max two), "Not recommended yet" for zero mentions, release one = R1 to R5 plus R7 and R8, R6's
competitor block in and its rule-based guidance deferred. The OpenRouter outage is closed; R3 and R4
stay in scope because outages recur.
**Binding system:** `docs/design/dashboard-visual-system.md` (sections 5, 6, 10 to 13) and
`docs/DESIGN-SYSTEM.md`. This spec adds **no token, no colour, no dependency**. Every class named
below already exists in the codebase or in Tailwind's stock utilities on the existing palette.

**Copy:** every customer-visible string below is a placeholder written as `[copy: ...]`. Intent is
fixed; wording belongs to `bg-copy`. `bg-app` ships the placeholders' plain text (without the
`[copy: ]` wrapper) from one file, `src/lib/aiVisibilityCopy.ts` (section 10), so `bg-copy` edits one
file and nothing else.

**HUMAN CHECKPOINT note:** this changes what a paying customer sees on load. That change was ruled by
Constantin on 2026-10-28, so no new checkpoint is raised. No new token is proposed, no motion library
is needed, and every datum shown already exists in the single `ai_results` read the page makes today.

---

## 1. The one thing

On `/ai-visibility` the customer must first see **which of their prompts AI engines recommend them
for, ordered best first, in one sentence and one list**, and every other block on the page yields to
that list being honest about what was measured, what failed, and what was never checked.

---

## 2. The 10-second test

**Statement (falsifiable):** after 10 seconds on `/ai-visibility`, a first-time customer can say
(a) whether AI engines recommend their brand, and on which engine they do best, or, when they are
not recommended anywhere, which brands are named instead; and (b) which of their prompts work and
which do not; and (c) whether any engine failed to answer, and since when.

**Current page fails all three clauses.** Line numbers are `src/pages/AIVisibility.tsx` at HEAD
`6855db0`, approximate within a few lines.

| Clause | Result today | Where and why |
|---|---|---|
| (a) | FAIL | There is no takeaway sentence anywhere above the table. A zero-mention client gets the score band "Needs Work" (score card, about line 1100) and a table of red X cells (absent cell, about lines 1800 to 1830), so the page grades instead of informing. The competitors named instead sit in a collapsible card at the very bottom (about lines 1892 to 1931). |
| (b) | FAIL | Rows render in stored `position` order (`.order('position')` in `load()`, about line 422), so a working prompt can sit at row 9. The only per-prompt summary is a 9px chip reading `2/5 engines` (about line 1700). |
| (c) | FAIL | `load()` skips a prompt's newest row when it is an error and lets an older ok row fill the cell (about lines 457 to 465), so an outage renders as either a stale result shown as current or a grey "not checked" cell. The engine card says "Temporarily unavailable" with no date or cause (about line 1303). |

**Pass condition for this spec:** the headline sentence (section 5.2) answers (a); best-first sort
plus the two sections (sections 5.3 and 5.4) answer (b); the amber "error" cell with its "since" date
plus the dated engine card line (sections 6.2 and 5.8) answer (c).

---

## 3. Component tree

New pieces are marked **NEW**, changed ones **CHANGED**, everything else is untouched.

```
AIVisibility (page)                                      CHANGED, loader + layout
  PageTitle h1 + header actions                          unchanged
  Allowance row (viewer) / cost meter (admin)            unchanged
  Score card                                             CHANGED, R7 only (band label, n/a rows)
  Engine cards row                                       CHANGED, R4 copy and colour of failure lines
  Locked chip strip                                      CHANGED, shows only engines not given a column
  Fix This hub                                           CHANGED, R4 P0 count and de-duplication
  PromptArea  <section aria-labelledby>                  NEW wrapper around the existing table block
    SectionHeading h2  [copy: Your prompts]              NEW
    PromptHeadline  <p> + optional chips + optional CTA  NEW (R2)
    PromptToolbar                                        NEW
      CategoryChips                                      existing chips, moved into the toolbar
      SortControl  (segmented >= 640px, select < 640px)  NEW (R1)
      FrozenOrderNote (only while collecting)            NEW
    PromptSection "appear"   h3, open                    NEW (R2)
      ColumnHeaderRow (active engines + up to 2 locked)  CHANGED (R5)
      PromptRow (full grid) x n                          CHANGED, real <button>, new cells
        PromptResultCell x engines                       NEW component (R3)
        Expanded panel (Collapse)                        existing, opportunity box recoloured
    PromptSection "notYet"   h3, open                    NEW (R2)
      CalmRow x n                                        NEW
        Expanded: CellStrip + CompetitorBlock h4 + panel NEW (R6 block)
    PromptSection "unchecked" h3, collapsed              NEW (R2)
      UncheckedRow x n                                   NEW
        Expanded: CellStrip + panel                      NEW
    CategoryEmpty  (R8)                                  NEW, replaces t.aiv_noPrompts in-filter
    Legend                                               CHANGED (R3, R8)
    ViewerHint  [copy: Run Collection re-checks every prompt]   NEW (R8)
  Competitor insights (collapsible)                      unchanged, stays below the prompt area
  Category breakdown                                     unchanged
```

Pure logic goes to **NEW** `src/lib/promptPerformance.ts` (section 9.1). The cell goes to **NEW**
`src/components/PromptResultCell.tsx`. Copy goes to **NEW** `src/lib/aiVisibilityCopy.ts`.

**Nine-element ceiling (visual system 5.3).** Top-level blocks after this change: (1) allowance or
cost meter, (2) score card, (3) engine card row, counted as one block because it is one comparable
set, (4) locked chip strip, only when it has anything left to show, (5) Fix This, (6) prompt area,
(7) competitor insights, collapsed, (8) category breakdown. Eight, with the title row and filter
chips excluded per 5.3. **This spec adds zero top-level blocks**: the headline, the sort control and
the three sections all live inside the prompt block that already exists. Nothing may be added on top
of this without removing something.

---

## 4. Layout

### 4.1 Breakpoints

| Viewport | Prompt rows | Locked engines | Sort control | Table scroll |
|---|---|---|---|---|
| 375 (below 640px) | stacked cards, engine tiles in `grid grid-cols-4 gap-1.5` | chip strip only, all locked engines, no locked tiles | native `<select>`, full width | none, there is no table |
| 768 (640px to 1279px) | full grid rows | up to two locked columns, rest in the strip | segmented pills | `overflow-x-auto` with computed `minWidth`, as today |
| 1280 | full grid rows | same | segmented pills, right-aligned on the category chip row | fits; no scroll for up to 7 active plus 2 locked |

The switch point is Tailwind's `sm` (640px). Below it, `bg-app` renders the card layout; at and
above it, the grid. One component tree, two render branches inside `PromptRow`, `CalmRow` and
`UncheckedRow`; no duplicated data work.

### 4.2 Grid template (640px and up)

```
active columns  N = number of active engines (unchanged rule)
locked columns  L = 0, 1 or 2 (section 5.7)
template        2.5rem  minmax(13rem,1fr)  repeat(N, minmax(3.5rem,5.5rem))  repeat(L, minmax(2.75rem,3.5rem))
minWidth        (2.5 + 13 + N*3.5 + L*2.75) rem
```

`repeat(L, ...)` is omitted when L is 0. Column order: `#`, prompt, active engines in `ALL_ENGINES`
order (as today), then locked engines in the order picked by section 5.7.

### 4.3 Reading order inside the prompt area (DOM order equals visual order)

1. h2 `[copy: Your prompts]`
2. Headline sentence, its chips or its button
3. Toolbar: category chips, then sort control (the sort sits to the right at 768 and 1280 via
   `flex flex-wrap items-center justify-between gap-3`; below 640 it wraps under the chips)
4. Frozen order note, only while a collection runs
5. Section "appear", then "notYet", then "unchecked" (the "Needs work first" sort swaps the first
   two, section 5.3)
6. Legend
7. Viewer hint

Card padding, radius and the outer card wrapper of the prompt block stay exactly as the table card
uses them today.

---

## 5. Behaviour and visual treatment, per piece

### 5.1 Per-prompt state model (the input to everything below)

For each active prompt and each **active** engine, the loader yields one `CellView` (section 9.1):

| Cell state | Derived from the newest row for that prompt and engine | Counts in `answered` |
|---|---|---|
| `mentioned` | `status = 'ok'`, not a no-answer row, `brand_mentioned = true` | yes |
| `absent` | `status = 'ok'`, not a no-answer row, `brand_mentioned = false` | yes |
| `no_answer` | `status = 'ok'` and `isNoAnswerRow(row)` | no |
| `error` | `status = 'error'` | no |
| `pending` | no row at all | no |
| `locked` | engine is one of the two locked columns (section 5.7), never from data | no |

Per prompt: `mentions` = count of `mentioned`; `answered` = `mentioned` + `absent`;
`errors` = count of `error`; `bestPosition` = lowest non-null `brand_position` over `mentioned`
cells; `lastCheckedAt` = newest `checked_at` over all of the prompt's current cells (null when all
are `pending`).

**Section membership:**

| Section | Rule |
|---|---|
| `appear` | `mentions >= 1` |
| `notYet` | `mentions = 0` and `answered >= 1` |
| `unchecked` | `answered = 0` (any mix of `error`, `no_answer`, `pending`) |

**What does NOT change.** The score card, the engine card percentages and `computeAiVisibilityScore`
keep their current input: the newest **ok** row per prompt and engine (today's `resultMap`). That is
deliberate: the score is the last known measurement, and an outage on our side must not swing the
customer's score. The prompt area reads the **current** state. The two can disagree during an outage,
and the amber cell with its date is exactly what explains the disagreement.

### 5.2 Headline sentence (R2)

Computed over **all active prompts**, ignoring the category filter (it is the page's takeaway, not
the filtered view's). Rendered as one `<p>` directly under the h2.

| Variant | Condition | Text | Below the text |
|---|---|---|---|
| H1 | at least one prompt in `appear` | `[copy: Your brand is recommended in {a} of {n} prompts, best on {Engine} (#{pos}).]` | nothing |
| H2 | no prompt in `appear`, at least one in `notYet` | `[copy: Not yet recommended in any of the {n} prompts checked. AI engines named {k} other brands instead.]` | up to three competitor chips |
| H3 | every prompt in `unchecked`, not collecting | `[copy: No engine could be checked yet.]` then a reason line | one button |
| H4 | every prompt in `unchecked`, collecting | `[copy: Checking your prompts now.]` | spinner icon inline before the text |

Definitions:
- `n` = prompts with `answered >= 1`; `a` = prompts in `appear`.
- **Best engine** = active engine with the highest current mention rate (`mentioned / answered` over
  all prompts, engines with `answered = 0` excluded). Ties broken by lowest best `brand_position` on
  that engine (null last), then `ALL_ENGINES` order. Name from `ENGINE_META[id].label`.
- `(#{pos})` is that engine's best `brand_position`; the parenthesis is **omitted** when it is null.
- `k` = count of distinct competitors across all current `mentioned` and `absent` cells, using
  `isLikelyCompanyName` and `competitorKey` from `src/lib/competitorFilter.ts` (read only).
- Chips = the first three names of the page's existing `competitorFreq` aggregate, display form.
- H3 reason line: when any cell is `error`, `[copy: {Engine list} could not be reached since {date}.]`
  with the earliest engine `errorSince` (section 9.1); otherwise `[copy: Your first check has not run yet.]`
- H3 button: the page's existing collection action for the role (viewer "Run Collection", admin
  "Force Refresh"), same handler. While a cooldown blocks a viewer, the button is disabled and the
  existing `CooldownCountdown` text sits beside it.

Treatment:

```
sentence      text-base font-semibold text-white leading-snug   (light: .text-white remaps to slate-900)
numbers       inherit, tabular-nums
reason line   text-sm text-slate-400 mt-1
chips         span, not interactive: inline-flex items-center rounded-full border border-dark-600
              bg-dark-700 px-2.5 py-1 text-xs font-medium text-slate-200; gap-2; mt-2
H3 button     the page's existing primary button classes for that action, mt-3
H4 spinner    Loader2 14px, text-slate-400, animate-spin motion-reduce:animate-none, aria-hidden
spacing       mb-4 below the headline block
```

Chips are neutral on purpose: H2 is a starting point, not an alarm. No red appears in the headline
in any variant.

### 5.3 Sort control (R1)

Four options; the active one is persisted per client.

| Value | Label | Order inside each section |
|---|---|---|
| `best` (default) | `[copy: Best performing]` | `mentions/answered` desc; then `bestPosition` asc, null last; then `answered` desc; then stored `position` asc |
| `needs_work` | `[copy: Needs work first]` | the exact reverse of `best` on the first key (`mentions/answered` asc), same tiebreaks otherwise; **and** section `notYet` renders before `appear` |
| `position` | `[copy: Prompt order]` | stored `position` asc |
| `recent` | `[copy: Recently checked]` | `lastCheckedAt` desc, null last; then stored `position` asc |

Within `unchecked`, regardless of sort: prompts with at least one `error` first (oldest `errorSince`
first), then `no_answer` only, then `pending` only, each then by stored `position`.

The `#` column numbers rows **1 to N continuously across the rendered sections** in their rendered
order, counting only the rows visible under the current category filter. Collapsed sections still
consume their numbers, so `#` never jumps when a section is opened.

**Persistence.** `localStorage` key `brandgeo_aiv_sort_<clientId>`. Every read and write is wrapped
in `try/catch`. A missing, unknown or unreadable value means `best`. Changing the sort reorders in
place, with no reload and no new query.

**Frozen order during collection.** While `collecting` is true, the order (and section membership)
is frozen at the snapshot taken when collection started; cells still update in place. When
`collecting` flips false, the page re-sorts once. Reason: rows must not jump under the reader's
pointer every few seconds. While frozen, the toolbar shows
`[copy: Order updates when the check finishes.]` in `text-xs text-slate-400`.

**At 640px and up**, a segmented group:

```
wrapper   role="group" aria-label="[copy: Sort prompts]"
          inline-flex items-center gap-1 rounded-lg border border-dark-700 bg-dark-800 p-1
label     span text-xs text-slate-400 pl-1 pr-1   [copy: Sort]   (visible, outside the pills)
pills     <button type="button" class="time-pill" aria-pressed={active}>, plus class is-pressed
          when active. Reuses index.css .time-pill exactly: 32px tall, 44px tap area below 768px.
```

**Below 640px**, a native select:

```
<label> text-xs text-slate-400 block mb-1   [copy: Sort]
<select> w-full min-h-[44px] rounded-lg border border-dark-700 bg-dark-800 px-3 text-sm text-slate-200
```

### 5.4 The three sections (R2)

Each section renders only when it has at least one row after the category filter.

**Section header**, identical for all three:

```
<h3 class="m-0">
  <button type="button" aria-expanded aria-controls="aiv-section-{key}"
          class="flex w-full items-center gap-2 min-h-[44px] py-2 text-left">
    <span class="text-sm font-semibold text-slate-200">[copy: section title]</span>
    <span class="text-xs text-slate-400 tabular-nums">{count} [copy: prompt|prompts]</span>
    <span class="text-xs text-slate-400">{extra}</span>          (unchecked only, see below)
    <ChevronDown 16px text-slate-400 class="ml-auto" rotates 180deg when open />
  </button>
</h3>
body in <Collapse> (existing component), id="aiv-section-{key}"
```

| Key | Title | Default | Extra in header | Row type |
|---|---|---|---|---|
| `appear` | `[copy: Where you appear]` | open | none | `PromptRow`, full grid, with the column header row at the top of the body |
| `notYet` | `[copy: Where you do not appear yet]` | open | none | `CalmRow` |
| `unchecked` | `[copy: Could not be checked]` | collapsed; **open** when `appear` and `notYet` are both empty | when any row has an error: `[copy: oldest failure {date}]` | `UncheckedRow` |

Open or closed state lives in component state only, keyed by section, reset on client switch. Spacing:
`mt-6` between sections, `mt-2` between the header and its first row.

**Rows, shared rules.** Every row's toggle is a real `<button type="button">` with `aria-expanded`
and `aria-controls`; the existing `div role="button" tabIndex=0` pattern is removed (visual system
13: interactives are real buttons). Inside a button only `span` elements are used, styled `block`,
`flex` or `grid` as needed. The expanded panel sits **outside** the button, so admin refresh buttons
are never nested in it. Expanded state stays keyed by prompt id and survives a re-sort.

**`PromptRow` (section `appear`), 640px and up.** Exactly today's grid row with three changes: it is a
`<button>`; its cells are `PromptResultCell` (section 6); the ratio chip becomes
`{mentions} of {answered} engines` via `formatRatio`, rendered neutral:
`rounded-full bg-dark-700 px-2 py-0.5 text-xs text-slate-200 tabular-nums`. The coloured
emerald/amber/red ratio chip is removed: colour now lives in the cells, and amber means "could not
check" everywhere in the prompt area. The admin hint `expand to refresh per engine` stays as is.

**`CalmRow` (section `notYet`), 640px and up.** One line, no engine cells, no red:

```
<button class="grid w-full items-center gap-3 px-3 min-h-[44px] py-2 text-left
               grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] hover:bg-dark-700/40 rounded-lg">
  # (text-xs text-slate-400 tabular-nums)
  prompt (TruncatedText, text-sm text-slate-200) + category chip (existing getCatColor classes)
  meta: ratio chip "0 of {answered} engines" (neutral classes above)
        + "[copy: Engines named {Competitor}]" text-xs text-slate-400 truncate max-w-[14rem],
          hidden below md; omitted when the prompt has no parsed competitor
  ChevronDown 16px text-slate-400, rotates when expanded
```

`{Competitor}` is the first entry of the prompt's own competitor aggregate (section 5.6).

Expanded `CalmRow` body, in this order: the **cell strip** (the same grid row of `PromptResultCell`s
with a compact copy of the column header above it, so the red X cells appear only here), then the
**competitor block** (section 5.6), then the existing expanded panel content.

**`UncheckedRow` (section `unchecked`), 640px and up.** Same grid as `CalmRow`, with the meta slot
replaced by one reason chip:

| Prompt's cells | Chip | Classes |
|---|---|---|
| any `error` | `[copy: error since {date}]` | `rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400` |
| only `no_answer` (and `pending`) | `[copy: no answer]` | neutral chip classes above |
| only `pending` | `[copy: pending]` | neutral chip classes above |

`{date}` is the oldest `errorSince` among the prompt's error cells. Expanded body: the cell strip,
then the existing panel content.

**Below 640px, all three row types become cards:**

```
card   <button> block w-full text-left rounded-lg border border-dark-700 bg-dark-800 p-3 min-h-[44px]
line 1 # (text-xs text-slate-400) + prompt, TruncatedText clamped to 2 lines, text-sm text-slate-200
line 2 category chip + ratio chip (appear, notYet) or reason chip (unchecked), gap-2, mt-1.5
line 3 appear only: engine tiles, grid grid-cols-4 gap-1.5 mt-2 (PromptResultCell variant "tile")
       notYet: "[copy: Engines named {Competitor}]" text-xs text-slate-400 mt-1.5, no tiles
       unchecked: nothing
expanded (outside the button): tiles for notYet and unchecked, then competitor block (notYet), then panel
```

No locked tiles below 640px; locked engines are listed in the chip strip instead (section 5.7). No
horizontal scroll anywhere in the prompt area at 375px.

### 5.5 Category filter (R8)

The existing chips move into the toolbar unchanged in style (active `bg-brand-500 text-white
border-brand-600`, idle `bg-dark-800 text-slate-400 border-dark-700`). The filter applies to all
three sections and their counts. When the filter leaves zero rows in all three sections, the
sections are replaced by:

```
CategoryEmpty  rounded-lg border border-dashed border-dark-600 p-6 text-center
  text   [copy: No prompts in this category.]   text-sm text-slate-300
  button [copy: Show all prompts]   resets the filter; existing secondary button classes; mt-3
```

`t.aiv_noPrompts` ("add prompts" copy) is no longer used for this case. When the client has no
active prompts at all, the existing `SharedEmptyState` ("No prompts yet") stays exactly as it is.

### 5.6 Competitor block in the expanded panel (R6, release one part)

Shown in the expanded body of every `notYet` row (and only there in release one).

```
<h4 class="text-xs font-semibold text-slate-200 mb-2">[copy: Who the engines recommend for this question]</h4>
<ol class="space-y-1.5">
  per item: <li class="flex items-baseline gap-2">
    name          text-sm text-slate-200
    engine count  text-xs text-slate-400   "[copy: named by {k} of {answered} engines]"
    best rank     text-xs text-slate-400 tabular-nums   "#{pos}", omitted when no list position
  </li>
</ol>
then the existing opportunity sentence (t.aiv_opportunity / aiv_opportunityTip), recoloured, below
```

Data: for this prompt, the current `mentioned` and `absent` cells only. Parse each cell row's
`competitors_mentioned` with the page's existing `parseCompetitors`, keep names passing
`isLikelyCompanyName`, group by `competitorKey`, display with `toDisplayName`. Per name: `k` =
number of engines naming it; best rank = lowest `pos` below `PROSE_POSITION_SENTINEL`. Order: `k`
desc, best rank asc (none last), name asc. Show at most five.
Empty case: `[copy: The engines answered without naming a brand.]` in `text-sm text-slate-400`.

The rule-based guidance sentence of R6 is **deferred** (ruled). Release one keeps the existing
opportunity sentence.

**Opportunity box recolour (all rows):** from `bg-amber-500/10 border-amber-500/20` to
`bg-dark-700/40 border border-dark-600`, its icon to `text-slate-400`, its text unchanged. Reason:
inside the prompt area amber is reserved for "could not check".

### 5.7 Locked engine columns (R5)

**Pick.** Candidates are engines with `engineStates[e] === 'locked'` that are not in
`RETIRED_ENGINES`. Order by `PLAN_ORDER.indexOf(ENGINE_UNLOCK_PLAN[e])` ascending (the cheapest
upgrade first), ties by `ALL_ENGINES` index. The first two become columns; the rest stay in the chip
strip. `planConfig.ts` is read only; all four names already exist there.

**Header cell** (the only interactive part of the column):

```
<Link to="/account" aria-label="[copy: {Engine label}, available on {Plan label}. See plans]"
      title="{Engine label}"
      class="flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-md hover:bg-dark-700/40">
  engine logo 16px, class "grayscale" (as the chip strip does today), aria-hidden
  plan label  text-[10px] leading-none text-slate-400   PLAN_LABELS[ENGINE_UNLOCK_PLAN[e]]
</Link>
```

**Body cells:** `PromptResultCell` state `locked` (section 6), `aria-hidden="true"`, not focusable.

**Chip strip:** unchanged styling; at 640px and up it lists only locked engines **not** given a
column, and it is not rendered when that list is empty. Below 640px it lists every locked engine.

### 5.8 Engine cards, failure copy (R4)

Per engine the loader adds `errorSince` and keeps `lastErrorCode` (section 9.1).

| Card situation | Today | Release one |
|---|---|---|
| `UNAVAILABLE` (errors, no ok row) | badge "UNAVAIL", body "Temporarily unavailable ·" | badge text `[copy: NOT ANSWERING]`, same badge classes (`bg-slate-700/60 text-slate-400 border border-slate-600/40`); body line below |
| ok rows exist, newest attempt failed | `text-red-400` "Last run failed · {code}" | body line below |
| `PARTIAL` | `text-amber-400/80` "Some checks failed" | `[copy: Some checks failed on {date}]`, same class, `{date}` = newest error `checked_at` |

**Body line** (both failure situations), one line, `flex items-center gap-1.5 text-xs text-amber-400`,
`AlertTriangle` 12px aria-hidden, then:

| `lastErrorCode` | Text |
|---|---|
| `quota_exceeded` | `[copy: Not answering since {errorSince} (provider limit)]` |
| `auth_error` | `[copy: Not answering since {errorSince} (configuration)]` |
| `api_error` or anything else | `[copy: Last check failed on {errorSince}]` |

The red is removed from this line: a failed call is our failure, not the brand's result, and red in
this product means "absent". Admins additionally get `title="{lastErrorCode}"` on the line. The
action line under it is unchanged ("Force Refresh" for admins, "Run Collection to retry" or
"Next run available {date}" for viewers).

### 5.9 Fix This hub (R4 tail)

- P0 item for a `MISSING` engine: replace the hardcoded zero with the real counts,
  `[copy: {Brand} appears in {mentioned} of {checked} answers on {Engine}]`.
- When **every** active engine is `MISSING`, render one P0 item, `[copy: Not yet recommended on any engine]`,
  instead of one identical item per engine. All other items unchanged.

### 5.10 Score card (R7)

Condition `zeroMention` = `totalChecked > 0` and the sum of `llmStats[*].mentioned` is 0 (same input
as the score).

| Element | Normal | `zeroMention` |
|---|---|---|
| Ring | as today | as today, reads 0% (true) |
| Band pill | Strong / Developing / Needs Work, as today | `[copy: Not recommended yet]`, classes `bg-dark-700/60 text-slate-400 border border-dark-600` (the neutral treatment, not red, not amber) |
| Recognition, Reach, Consistency rows | as today | as today, real 0% with the bar |
| Knowledge, Sentiment, Accuracy rows | as today | value `n/a` in `text-sm font-medium text-slate-400`; description replaced by `[copy: needs a mention]` in `text-xs text-slate-400`; **no bar**, an empty `h-2` spacer keeps row height |

`Needs Work` remains for a client with at least one mention and a score under 35. `computeAiVisibilityScore`
is not touched. When `totalChecked === 0` the existing "Not measured" treatment stays.

### 5.11 Legend and viewer hint (R3, R8)

Under the sections, `mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400`.
Six items, each a 20px mini `PromptResultCell` (variant `legend`, glyph only, no word) followed by
its label:

1. `[copy: Mentioned, with rank]`  2. `[copy: Absent]`  3. `[copy: No answer]`
4. `[copy: Could not check]`  5. `[copy: Not checked yet]`  6. `[copy: Locked on your plan]`
(item 6 only when at least one locked column is rendered)

Viewer hint, viewers only, under the legend: `[copy: Run Collection re-checks every prompt.]`,
`mt-2 text-xs text-slate-400`. Admins keep their per-row hint and get no extra line.

---

## 6. `PromptResultCell` (R3), exact treatment

Props: `state`, `engineId`, `position?`, `errorSince?`, `previousOkAt?`, `variant: 'grid' | 'tile' | 'legend'`.

**Container, `grid`:** `flex flex-col items-center justify-center gap-0.5 rounded-md w-full min-h-[44px] py-1.5`
plus the state classes. **`tile`** adds the engine logo (16px, aria-hidden) above the glyph and
`min-h-[56px]`. **`legend`:** `h-5 w-5 rounded`, glyph 12px, no word.

| State | State classes | Glyph (lucide, 14px, aria-hidden) | Word, `text-[10px] leading-none font-medium` | Second line, `text-[10px] leading-none` |
|---|---|---|---|---|
| `mentioned` | `bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30` | `Check` | `#{position}`, or `[copy: mentioned]` when null | none |
| `absent` | `bg-red-500/10 text-red-400 ring-1 ring-red-500/25` | `X` | `[copy: absent]` | none |
| `no_answer` | `bg-dark-700/20 text-slate-500 border border-dashed border-dark-600` | `Minus` | `[copy: no answer]` | none |
| `error` | `bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30` | `AlertTriangle` | `[copy: error]` | `[copy: since {errorSince}]`, class `text-amber-400/80` |
| `pending` | `bg-dark-700/40 text-slate-500 ring-1 ring-dark-600/60` | `Clock` | `[copy: pending]` | none |
| `locked` | `bg-dark-700/20` | `Lock` 12px, `text-slate-500` | none | none |

Six distinct glyphs plus five distinct words: every state is identifiable without colour (visual
system 13.6, brief criterion 4). The `absent` cell drops today's 9px top-competitor line: the name
moves to the `CalmRow` meta and the competitor block, and the cell keeps a fixed, readable height.

**Replaces a no-op.** Today's no-answer cell uses `ring-dashed`, which is not a Tailwind utility and
renders nothing (a ring is a box shadow and cannot be dashed). `border border-dashed border-dark-600`
is real and is what makes the no-answer state visibly different from pending.

**Accessible text.** Each `grid` and `tile` cell carries an `sr-only` span, and `title` with the same
string:
- mentioned: `[copy: {Engine}: mentioned, rank {position}]` (rank part omitted when null)
- absent: `[copy: {Engine}: not mentioned]`
- no_answer: `[copy: {Engine}: gave no answer]`
- error: `[copy: {Engine} has not answered since {errorSince}]`, plus `[copy: , last result {previousOkAt}]` when a previous ok row exists
- pending: `[copy: {Engine}: not checked yet]`

The "last ok" date of R3 lives in that title and sr text and in the expanded panel's per-engine card
(section 6.1), not as a third visible line: at 3.5rem the cell fits two lines at 10px, and the
visible second line carries the outage start date, which is what criterion 1 asks for.

### 6.1 Expanded panel, per-engine card for an error cell

The existing per-engine card in the expanded panel, for a cell in `error`, renders on
`bg-dark-800` (not the sentiment tints) with: engine name, then one `text-xs text-amber-400` line
`[copy: Not answering since {errorSince}]`, then, when `previousOkAt` exists,
`[copy: Last result, {previousOkAt}:]` in `text-xs text-slate-400` followed by that previous ok row's
existing snippet and top results rendered exactly as today. Admin refresh buttons unchanged.

---

## 7. Token application

All colour comes from existing classes. Variable-backed surfaces (`dark-*`, `brand-*`, `--text-*`)
switch theme on their own. Fixed palette classes used here all have a light remap in
`src/index.css` already, except the three `ring-*` utilities, which are decorative (see 8.1).

| Role | Class | Dark value | Light value (index.css remap) |
|---|---|---|---|
| card surface | `bg-dark-800` | `--dark-800` 15 23 42 | 255 255 255 |
| chip, pending fill | `bg-dark-700`, `/40`, `/20` | `--dark-700` 30 41 59 at alpha | 234 233 242 at alpha |
| borders | `border-dark-600`, `border-dark-700` | `--dark-600`, `--dark-700` | 216 214 230, 234 233 242 |
| primary text | `text-white`, `text-slate-200` | white, slate-200 | 15 23 42, 30 41 59 |
| secondary text | `text-slate-400` | 148 163 184 (`--text-secondary`) | 71 85 105 |
| muted glyph, pending | `text-slate-500` | 148 163 184 (dark AA remap) | 85 100 121 |
| mentioned | `text-emerald-400`, `bg-emerald-500/15` | stock | 4 120 87, existing emerald fill remap |
| absent | `text-red-400`, `bg-red-500/10` | stock | 185 28 28, `#fef2f2` |
| could not check | `text-amber-400`, `/80`, `bg-amber-500/10`, `border-amber-500/20` | stock | 180 83 9, `#b45309`, `#fffbeb`, existing |
| pressed sort pill | `.time-pill.is-pressed` | `--surface-nav-active`, `--text-nav-active`, `--rail-active` | same tokens, light values |
| focus ring | `:focus-visible` global | `--rail-active` | `--rail-active` light |
| category chip active | `bg-brand-500 text-white` | brand-500 | `#7c3aed` fill, white text (existing rule) |

Spacing uses Tailwind's stock scale only (`gap-0.5` to `gap-6`, `p-1` to `p-6`, `mt-1` to `mt-6`).
Radius: `rounded-md` cells, `rounded-lg` rows and controls, `rounded-full` chips, the card wrapper
keeps `--card-radius`. Elevation: none added; rows are flat inside the existing card.

Font sizes: `text-[10px]` is the in-cell size (already used 106 times in `src/`), `text-xs`,
`text-sm`, `text-base` for the headline. Raw hex values in the table above are remap values already
present in `index.css`, quoted for the contrast check, not instructions to write hex.

---

## 8. Motion

Motion tokens from `src/lib/motion.ts` (`MOTION_FAST` 0.18s, `MOTION_BASE` 0.26s, `EASE_OUT`) and
the CSS `--motion-fast`, `--ease-out`. `App.tsx`'s `MotionConfig reducedMotion="user"` covers every
`motion.*` element; CSS animations add `motion-reduce:` variants.

| Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|
| Row reorder | sort change; collection finishing | transform via existing `motion.div layout="position"` | 260ms (`MOTION_BASE`) | `EASE_OUT` | none | keeps the eye on rows that moved, so the reader sees the same set reordered rather than a new list | instant (MotionConfig) |
| Section open and close | header click | height and opacity, existing `Collapse` | 260ms | `EASE_OUT` | none | confirms the disclosure and keeps spatial continuity | instant |
| Row expand | row click | existing `Collapse` | 260ms | `EASE_OUT` | none | unchanged | instant |
| Chevron | open state change | rotate 0 to 180deg | 180ms (`MOTION_FAST`) | `EASE_OUT` | none | state indicator in the place the eye already is | `motion-reduce:transition-none`, snaps |
| Sort pill pressed | click | background, colour, border (`.time-pill`) | 180ms | `--ease-out` | none | confirms the choice | colour change only, no movement, kept |
| Rows entering or leaving on category change | filter click | opacity only, existing AnimatePresence | 180ms | `EASE_OUT` | none | confirms the filter applied | instant |
| H4 spinner | collecting with nothing answered | rotation, `animate-spin` | continuous | linear | none | masks latency of the first check | `motion-reduce:animate-none`, static icon |
| Headline, cells, error state, legend | any | none | | | | no job, so no motion: no fade on the sentence, no pulse on error cells | n/a |
| Score card n/a rows | load | none (no bar to fill) | | | | | n/a |

The page entrance animation that exists today is unchanged. No ambient motion is added.

---

## 9. State inventory

| Component | Empty | Loading | Partial | Error | Locked by plan | Success |
|---|---|---|---|---|---|---|
| Prompt area (whole) | no active prompts: existing `SharedEmptyState`, unchanged | skeleton 9.2 | some cells `pending` or `error`: rendered as their states, sections computed from what answered | query failed: inline card `AlertTriangle` 16px `text-amber-400` + `[copy: Your results could not be loaded.]` `text-sm text-slate-200` + button `[copy: Try again]` calling `load()` | n/a | sections as specified |
| Headline | not rendered when there are no active prompts | skeleton line | H1 or H2 computed from answered prompts only | H3 with reason and button; H4 while collecting | n/a | H1 or H2 |
| Sort control | hidden when fewer than 2 rows in total | skeleton pill bar | works on what is loaded | n/a | n/a | active choice pressed |
| Section | not rendered when it has no rows | n/a (part of 9.2) | counts reflect the filter | n/a | n/a | open or collapsed per 5.4 |
| `PromptResultCell` | n/a | n/a | `pending` | `error` with since date | `locked` | `mentioned` or `absent` (`no_answer` is a result, shown as such) |
| Competitor block | `[copy: The engines answered without naming a brand.]` | n/a | lists from answered engines only | n/a | n/a | up to five names |
| Engine card | existing | existing | `PARTIAL` with dated line | dated, code-aware line (5.8) | existing chip strip and columns | existing |
| Score card | existing "Not measured" | existing | n/a | n/a | n/a | `zeroMention` variant 5.10 or normal |
| Category filter | `CategoryEmpty` (5.5) | n/a | n/a | n/a | n/a | filtered sections |

**First run.** Prompts exist, nothing ever collected: headline H3 with `[copy: Your first check has not run yet.]`
and the Run Collection button; one section, `unchecked`, rendered **open**, every row with the
`[copy: pending]` chip. While that first collection runs: H4, order frozen, cells flip to results in
place, re-sort once on completion.

### 9.1 Loader and pure logic (`src/lib/promptPerformance.ts`)

The query is unchanged (one `prompts` read, one `ai_results` read ordered by `checked_at` desc). The
existing walk over rows gains, per prompt and engine:

- `current`: the first row seen (newest), whatever its status.
- When `current` is an error: keep walking that prompt and engine; `errorSince` = `checked_at` of the
  oldest row in the unbroken run of error rows that starts at `current`; `previousOk` = the first
  `status = 'ok'` row after that run (null if none).
- `resultMap` (newest ok row per cell) is still built exactly as today for the score and engine cards.

Per engine (across all prompts, same walk): `errorSince` = oldest `checked_at` in the unbroken run of
error rows starting at that engine's newest row; `lastErrorCode` as today.

Exports (all pure, no React, no Supabase):

```
buildCellViews(rows, activeEngines)            -> Map<promptId, Map<engine, CellView>>
summarisePrompt(cells)                         -> { mentions, answered, errors, bestPosition, lastCheckedAt, section }
sortPrompts(prompts, summaries, mode)          -> ordered ids per section, section order
buildHeadline(summaries, cells, competitorFreq)-> { variant, a, n, k, engine, pos, chips, errorEngines, since }
pickLockedColumns(engineStates)                -> EngineId[] (max 2)
promptCompetitors(cells)                       -> { name, k, bestRank }[] (max 5)
engineErrorSince(rows)                         -> Record<engine, string | null>
```

### 9.2 Loading skeleton

Only the prompt block's skeleton changes; header, score and engine skeletons stay. Built from the
existing `Skeleton` primitive:

```
640px and up                                  below 640px
h-4 w-24 (h2)                                 same
h-5 w-2/3 mt-3 (headline)                     h-5 w-full, then h-5 w-1/2
toolbar: 4 x h-8 w-20 chips | h-10 w-80 sort  4 x h-8 w-20 chips, then h-11 w-full
h-5 w-48 mt-6 (section header)                same
5 rows h-14 w-full rounded-lg gap-2           3 cards h-28 w-full rounded-lg gap-2
```

Silent reloads (`useCollectionLanded`) never show the skeleton; rows stay and cells update.

---

## 10. Data legibility

| Datum | Format | Helper |
|---|---|---|
| Ratio per prompt | `2 of 5 engines`, never `2/5` | `formatRatio` |
| Headline counts | integers, `tabular-nums` | `formatCount` |
| Rank | `#2`; omitted when null; never `#0` | none |
| Dates | `6 Oct`, year only when it differs from the current year | `formatDate` |
| Undefined dimension | `n/a`, never `0%`, never a dash | none |
| Percentages (score card) | unchanged | `formatPercent` |
| Since date | oldest error of the current unbroken failure run | 9.1 |

**A chart that a sentence could replace is replaced:** the headline sentence is that replacement for
the per-prompt table's first read. No chart is added by this spec.

**Copy file.** `src/lib/aiVisibilityCopy.ts` exports one `AIV_COPY` object of English placeholder
strings and small functions for interpolated ones, for example
`headlineRecommended(a, n, engine, pos | null)`. Every `[copy: ...]` in this spec is one entry. No
`i18nContext.tsx` keys are added in release one (the page is already mixed; translation is a later
pass). Existing `t.*` keys that stay in use keep working.

---

## 11. Accessibility floor

### 11.1 Contrast, text and glyphs (computed 2026-10-28 with the WCAG formula over the composited background)

| Pair | Dark | Light | Floor |
|---|---|---|---|
| headline `text-white` on card | 17.0+ | 17.85 | 4.5 |
| `text-slate-200` on `--dark-800` | 14.48 | 14.63 | 4.5 |
| `text-slate-400` (secondary) on card | 6.96 | 7.58 | 4.5 |
| mentioned word `text-emerald-400` on `emerald-500/15` | 7.34 | 5.21 | 4.5 |
| absent word `text-red-400` on `red-500/10` | 5.94 | 5.91 | 4.5 |
| error word and since line `text-amber-400` / `/80` on `amber-500/10` | 9.18 | 4.84 | 4.5 |
| pending and no-answer `text-slate-500` on `dark-700/40` | 6.48 | 5.60 | 4.5 |
| no-answer `text-slate-500` on `dark-700/20` | 6.73 | 5.81 | 4.5 |
| error glyph `amber-400` vs card (non-text) | 10.69 | 5.02 | 3.0 |
| lock glyph `text-slate-500` vs card (non-text) | 6.96 | 5.0+ | 3.0 |
| pressed sort pill, `--text-nav-active` on `--surface-nav-active` | per visual system 4.4 table | per 4.4 | 4.5 |

### 11.2 Non-text

Cells are not controls, so 1.4.11's boundary rule does not apply to their rings; the rings
(`ring-emerald-500/30`, `ring-red-500/25`, `ring-amber-500/30`) are decorative and have no light
remap, by design. Identity is carried by glyph plus word (11.4).

### 11.3 Focus and hit targets

- Focus: the global `:focus-visible` ring (2px `--rail-active`, offset 2px) on every row button,
  section header button, sort pill, select, locked header link, Try again and Show all buttons. No
  `outline-none` anywhere in the new code.
- Targets: rows, section headers, the select and locked headers are `min-h-[44px]` at all widths;
  sort pills use `.time-pill` (32px visible, 44px tap area below 768px); the locked header column is
  at least 2.75rem (44px) wide.
- Order: tab order follows DOM order (4.3). Locked body cells and the legend's mini cells are
  `aria-hidden` and never focusable.

### 11.4 Semantics

- Headings: one h1 (existing); h2 `[copy: Your prompts]`; h3 per section; h4 in the competitor block.
  No level is skipped. The existing sr-only h2 on the score card stays.
- Sort: `role="group"` with `aria-label`, buttons with `aria-pressed`; below 640px a labelled select.
- Disclosure: `aria-expanded` and `aria-controls` on section headers and rows.
- Headline: a plain `<p>`, not a live region. When collection finishes and the order updates, the
  existing collection completion notice in the shell is the announcement; nothing new is announced.
- Identity never by colour alone: six glyphs, five words, plus sr text per cell.

---

## 12. Reference frames

| Block | Comparable | Attribute borrowed, as a constraint |
|---|---|---|
| Three sections | Linear, grouped issue list | group header = title + count + chevron on one line; rows inside a group are one calm line until opened; groups collapse without moving the page's other content |
| Failure states | Stripe dashboard payment status | every failure is a word plus a date ("Failed on 6 Oct"), never a bare colour or an undated "unavailable" |
| Cell glyph plus word | Vercel deployment list | a status is a shape plus a one-word label, readable in greyscale |
| Headline sentence | Mercury account overview | one plain sentence of fact above the detail; numbers inside the sentence, no adjectives |

---

## 13. Acceptance checklist for `bg-verify`

Run at 375, 768 and 1280 in both themes unless a line says otherwise. Use the demo build with the
fixture rows of section 14 (fictional brands only), and one read-only check against production data
for line 1.

1. A prompt and engine whose newest `ai_results` row is `status = 'error'` renders the amber
   `error` cell with `since {date}` equal to the oldest `checked_at` of that unbroken error run; it
   never renders `pending` and never renders the older ok result as current. The engine card shows
   the code-aware line with the same date.
2. A client with zero mentions and at least one answered prompt sees headline H2 with `k` and up to
   three neutral chips; section `notYet` rows show no red X; expanding one shows the cell strip with
   `absent` cells and the competitor block (at most five names, ordered per 5.6).
3. Default order is `best`; the pressed pill (or the select) shows the active choice; each of the
   four options reorders without a network request (check the network panel) and survives a reload;
   a corrupted `localStorage` value falls back to `best`; `#` reads 1 to N continuously.
4. In greyscale (devtools rendering, achromatopsia), all six cell states are distinguishable by
   glyph and word.
5. A Growth-plan fixture shows exactly two locked columns, chosen by 5.7, each header linking to
   `/account` with the plan label; below 640px no locked tile renders and the strip lists every
   locked engine.
6. With zero mentions, Knowledge, Sentiment and Accuracy show `n/a` with no bar; the band reads the
   "Not recommended yet" placeholder in neutral classes; Recognition, Reach and Consistency show their
   real 0%.
7. Fix This shows real counts in P0 items and exactly one P0 item when every engine is `MISSING`.
8. Category filter with no matches shows `CategoryEmpty` and its button restores all prompts.
9. While collecting, order and section membership do not change and the frozen note shows; on
   completion the page re-sorts once.
10. 375px: no horizontal scroll (attempt `window.scrollTo(600, 0)` and read `scrollX` back; do not
    trust `scrollWidth`), every row is a card, the sort is a select.
11. Keyboard only: every row, section header, sort control and locked header is reachable and shows
    the focus ring; no element with `tabIndex` on a `div`; heading outline is h1, h2, h3, h4 with no
    skips.
12. Contrast of every pair in 11.1 re-measured in the running page, both themes.
13. With `prefers-reduced-motion: reduce`, reorders, collapses and the chevron are instant and the
    spinner is static.
14. `npm run build` exit 0; zero em or en dashes in added lines (`rg -n '\x{2014}|\x{2013}'` with a
    positive control that fires; never `grep -P`); no real client or person names in fixtures or
    copy; `computeAiVisibilityScore` and `planConfig.ts` unchanged in the diff.
15. Scale note holds: one `prompts` read and one `ai_results` read per page load, as today; no new
    writes; no new function invocations.

---

## 14. Handoff packet to `bg-app`

**Agent:** `bg-app`, Sonnet. **Then:** `bg-copy` on `src/lib/aiVisibilityCopy.ts` only (can run in
parallel; the file's shape is fixed here). **Then:** `bg-verify` on Opus against section 13.

**Write scope (exact):**

| File | Change |
|---|---|
| `brandgeo-dashboard/src/pages/AIVisibility.tsx` | loader additions (9.1), prompt area (sections 3 to 6), R4 card lines, Fix This (5.9), R7 score card (5.10), skeleton (9.2), opportunity box recolour |
| `brandgeo-dashboard/src/lib/promptPerformance.ts` | NEW, pure functions of 9.1 |
| `brandgeo-dashboard/src/components/PromptResultCell.tsx` | NEW, section 6 |
| `brandgeo-dashboard/src/lib/aiVisibilityCopy.ts` | NEW, every placeholder string, English |
| `brandgeo-dashboard/src/lib/mockData.ts` | append demo rows only: one prompt with an error run on one engine and a previous ok row, one no-answer row, one never-checked prompt, one zero-mention prompt with competitors; fictional brand names only |

**Read only, do not edit:** `src/lib/planConfig.ts` (another session has uncommitted edits),
`src/lib/aiVisibilityScore.ts`, `src/lib/competitorFilter.ts`, `src/lib/format.ts`,
`src/lib/motion.ts`, `src/index.css`, `src/components/Collapse.tsx`,
`src/components/EmptyState.tsx`, `src/components/Typography.tsx`, `src/components/Skeleton.tsx`,
`tailwind.config.js`, `src/lib/i18nContext.tsx`.

**Out of scope:** R6 rule-based guidance; any Netlify function; any query change; translation of new
strings; the competitor insights and category breakdown cards.

**Commit:** one commit by pathspec on the five files above, pushed with `$env:BATCH_PUSH=1` when a
build is due (it spends one Netlify build).

**Open decisions:** none. Every choice the brief left open is fixed above; the list is in the
covering note to the orchestrator.
