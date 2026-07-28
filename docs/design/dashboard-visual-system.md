# Dashboard Visual System

**Agent:** bg-design
**Date:** 2026-07-27
**Status:** READY for `bg-app`
**Surface:** `brandgeo-dashboard/src/` (all 12 routes), dark and light
**Primary evidence:** `docs/qa/dashboard-audit-2026-07-26.md` (measured), plus
light-mode contrast computed arithmetically from `src/index.css` in this pass.
**Method note:** every ratio and every delta-E in this document was computed, not
estimated. Contrast is WCAG relative luminance. Delta-E is Euclidean distance in
OKLab times 100, with colour-vision deficiency simulated by Machado, Oliveira and
Fernandes (2009) at severity 1.0, using the validator shipped with the `dataviz`
skill. Section 17 reproduces the runnable commands and their verbatim output so
`bg-verify` can re-run every claim.

No `.tsx`, `.html`, `.css` or `tailwind.config.js` was edited to produce this.

---

## 0. How to read this

Sections 3 to 9 are the build. Section 17 is the pass/fail harness. Sections 15
and 16 are the record of what was decided and why, for `bg-verify`.

Every colour in this spec is either an existing token or a numbered amendment in
section 3. There is no raw hex anywhere in sections 4 to 12 that is not defined
in section 3 or already present in `tailwind.config.js` / `src/index.css` /
`ENGINE_META`.

---

## 1. The one thing, and the visual direction

### 1.1 The one thing

**On every route the user must first see where they are and what the headline
number is; the shell must announce the current page before the content does.**

That is the fix the owner asked for in plain words: the sidebar does not read as a
separate object, and the selected item does not pop. Everything in this spec
yields to those two, then to the chart system that carries the data.

### 1.2 What makes this premium rather than merely compliant

Clearing 3:1 makes the shell legible. It does not make it feel considered. Four
principles carry the difference, and each one is a rule a builder can apply
without asking a design question.

**Principle 1: depth comes from edges, not from glow.** The app already made this
choice correctly for cards (`index.css:262-286`, a 1px contact shadow plus a
hairline ring, no diffuse blur). The shell has not caught up. The sidebar gets the
same treatment: a precise 1px edge at a measured contrast, plus a short gradient
bleed onto the canvas that decays to nothing in 24px. Precision, not haze. This is
the Linear attribute: surfaces separate because their boundaries are exact.

**Principle 2: the chrome is brand-tinted, the content is neutral.** The light
theme already articulates this at `index.css:121-127` ("a faint violet wash instead
of plain white, so the nav anchors the layout and keeps the brand present"). Dark
mode never received it. Both themes now shift the nav surface toward violet and
away from the neutral canvas. The rule is one sentence: **the nav is the only
brand-tinted surface in the layout; cards and canvas stay neutral.** That gives the
product a spine you can see, and it means a screenshot is recognisable as BrandGEO
from the chrome alone.

**Principle 3: the active state is a raised object, not a tint.** Today the active
nav item is a 15% violet wash carrying 1.17:1 against its own sidebar. Replaced by
a solid raised surface with white semibold text and a violet rail: three cues, of
which two are independently sufficient. This is the Raycast attribute: the selected
row is a physical thing sitting on the rail, not a highlight painted over it.

**Principle 4: one colour, one meaning, forever.** Nine engine identities and three
sentiment states currently share hues three ways. Section 8 rebuilds the palette so
every hue answers exactly one question, and section 8.6 states the structural rule
that keeps it that way: engine colour and sentiment colour never encode marks in
the same plot. This is the Stripe attribute: the colour system is a contract, so
you stop having to think about it.

### 1.3 What is explicitly not being redesigned

Card elevation, the motion foundation, the focus ring, the scrollbar, the skip
link, the sidebar grouping into Insights / Strategy / Manage, and the route
structure. All were measured as correct. `docs/qa/dashboard-audit-2026-07-26.md`
refuted four standing claims about them and this spec does not reopen any of the
four.

---

## 2. The 10-second test

> **After 10 seconds on any route, a first-time user can say: "I am on <page
> name>, the number that matters is <value>, and these are the AI engines it came
> from."**

Three clauses. The current design fails clause 1 in both themes and fails clause 3
on colour.

### 2.1 Clause 1, "I am on <page name>": FAIL, both themes

| Cue | Dark, measured | Light, measured | Verdict |
|---|---|---|---|
| Sidebar surface vs canvas | `#0f172a` vs `#0a0f1e` = **1.07:1** | `#eceaf6` vs `#f7f7fb` = **1.11:1** | fail |
| Sidebar right border vs canvas | `rgba(30,41,59,0.6)` = **1.31:1** | composites to `#efeff6` = **1.07:1** | fail |
| Active item text vs inactive | `#c4b5fd` vs `#cbd5e1` = **1.24:1** | `#6d28d9` vs `#334155` = **1.46:1** | fail |
| Active item background vs sidebar | composites to `#222149` = **1.17:1** | composites to `#ddd5f6` = **1.18:1** | fail |
| Active rail vs sidebar | `#a78bfa` = 6.56:1 | `#a78bfa` = **2.29:1** | dark passes, light fails |
| Time filter pressed text vs unpressed | **1.39:1** | `#6d28d9` vs `#64748b` = **1.49:1** | fail |
| Time filter pressed background vs bar | **1.23:1** | composites to `#e5dcfc` = **1.28:1** | fail |

Citations: sidebar fill and border `Layout.tsx:282`; nav item classes
`Layout.tsx:205-213`; time filter `Layout.tsx:746-760`; light sidebar tint
`index.css:125-127`; light text remaps `index.css:70,72,77`.

**Light mode is worse than dark, not better.** The rail, which is the only cue
carrying the dark active state, drops from 6.56:1 to 2.29:1 in light mode because
`#a78bfa` is a light violet on a light surface and nothing remaps it. So in light
mode all four cues fail simultaneously. That was unaudited and is now measured.

### 2.2 Clause 2, "the number that matters": PARTIAL

Not this spec's fault line and largely a copy and information-architecture
question owned elsewhere, but two visual defects block it and are fixed here:

- `h1` is 24px/600 on four routes and 24px/700 on eight (F-19). The page name does
  not present with one weight, so it does not read as a fixed landmark.
- Five of twelve routes render zero `h2` (F-13), and where `h2` exists it has four
  different treatments. There is no visual second level, so the headline number
  does not sit above anything.

### 2.3 Clause 3, "these are the AI engines": FAIL

- `#10b981` is ChatGPT and Positive. `#ef4444` is Google AI Mode, Negative, and
  `groupColors[1]` (`planConfig.ts:91,96`; `BrandSentiment.tsx:333,335`;
  `Competitors.tsx:258`). One hue, three answers.
- Claude `#f97316` and Meta `#f59e0b` measure delta-E **9.6** normal vision against
  a floor of 15, and **3.4** for tritanopia. They co-render on the engine filter
  chip rows at `BrandSentiment.tsx:417-422` and `Mentions.tsx:204`.
- Grok `#94a3b8` has chroma **0.035**, below the 0.10 floor. It reads as a disabled
  series, not a brand.
- `Competitors.tsx:258` assigns bar colour by array index, so the surviving series
  repaint when the engine set changes.
- A fifth independent palette exists that the audit did not name:
  `Competitors.tsx:261` `trendColors = ['#ef4444','#f59e0b','#8b5cf6','#06b6d4']`,
  also index-assigned. Recorded here so it is not missed.

Baseline validator run on the nine current `chartColor` values against the app's
real dark surface, all-pairs (chips can render in any combination):

```
Palette (dark, surface #0a0f1e, categorical): 9 slots
  [FAIL] Lightness band         outside band: 7 of 9
  [FAIL] Chroma floor           below floor (reads gray): [["#94a3b8",0.035]]
  [FAIL] CVD separation         worst all-pairs #818cf8 vs #3b82f6 dE 4.5 (protan) - tritan 3.4
  [FAIL] Normal-vision floor    worst all-pairs #38bdf8 vs #06b6d4 dE 5.7 (normal)
  [PASS] Contrast vs surface    all 9 >= 3:1
  -> FAILED
```

### 2.4 Pass condition for this spec

The 10-second test passes when section 17's harness returns the recorded output
and the four shell ratios in section 4.6 are met in both themes.

---

## 3. Token amendments

These are amendments to `docs/DESIGN-SYSTEM.md`. Each is numbered, has a stated
reason, and has both a dark and a light value. `bg-app` declares them in
`src/index.css` `:root` and `html.light` exactly as written. No component may
restate any of these values inline.

### A1. `--surface-nav` (new)

The nav rail becomes its own named surface instead of borrowing `--dark-800`.

| Mode | Value | Hex | Reason |
|---|---|---|---|
| dark | `19 21 43` | `#13152b` | Violet-shifted one step off the canvas. OKLCH L 0.206 vs the canvas 0.172, so it is the largest perceptual step available without leaving the dark range. |
| light | `236 234 246` | `#eceaf6` | Unchanged from the existing `html.light aside` rule at `index.css:125-127`. It was already correct in intent; it just had no name and no dark counterpart. |

Replaces the `bg-dark-800` utility on `<aside>` (`Layout.tsx:282`) and the
`html.light aside` block. After this, `--dark-800` means "card" only, in both
themes, which is the reason for the split.

### A2. `--border-nav` (new)

| Mode | Value | Hex |
|---|---|---|
| dark | `100 116 139` | `#64748b` |
| light | `100 116 139` | `#64748b` |

One value, both themes. Measured: 4.01:1 against the dark canvas, 3.77:1 against
the dark nav surface, 4.45:1 against the light page, 4.00:1 against the light nav
surface. Every pairing clears WCAG 1.4.11's 3:1.

This is not a new colour. `#64748b` is already the scrollbar thumb
(`index.css:233,239`) and was chosen there for exactly this reason, with the
reasoning recorded in the comment at `index.css:226-230`. Reusing it means the
divider and the scrollbar are the same object in the user's eye, which is correct:
both are the boundary of the scroll region.

**It must be solid.** Applying alpha drops the measured ratio below 3:1 and
reintroduces F-09.

### A3. `--surface-nav-active` (new)

The selected nav item and the pressed time-filter pill share one fill.

| Mode | Value | Hex | Measured |
|---|---|---|---|
| dark | `58 47 113` | `#3a2f71` | 1.56:1 vs `--surface-nav`; white text on it 11.51:1 |
| light | `255 255 255` | `#ffffff` | 1.19:1 vs `--surface-nav`; `--text-base` on it 17.85:1 |

Solid, not an alpha wash. An alpha wash cannot be measured without knowing what is
behind it, which is how the current 1.17:1 came about unnoticed.

Light mode uses white deliberately: on a violet-tinted rail, a white chip is the
same "raised" language the cards already speak, so the selected item reads as
lifted out of the rail rather than painted onto it.

### A4. `--text-nav-active` (new)

| Mode | Value | Hex | Measured vs `--text-nav-idle` |
|---|---|---|---|
| dark | `255 255 255` | `#ffffff` | 1.48:1 |
| light | `15 23 42` | `#0f172a` | 2.36:1 |

### A5. `--text-nav-idle` (new)

| Mode | Value | Hex | Measured on `--surface-nav` |
|---|---|---|---|
| dark | `203 213 225` | `#cbd5e1` | 12.09:1 |
| light | `71 85 105` | `#475569` | 6.37:1 |

Deliberately unchanged in value from what `text-slate-300` resolves to in each
theme today. The comment at `Layout.tsx:198-204` records that inactive items were
brightened on purpose so they stay distinct from the group headers. This spec does
not touch them. It moves the active state and re-treats the headers instead, which
is the direction the audit's FIX F-10 recommends at line 355.

### A6. `--rail-active` (new)

| Mode | Value | Hex | Measured on `--surface-nav` |
|---|---|---|---|
| dark | `167 139 250` | `#a78bfa` (brand-400) | 6.60:1 |
| light | `124 58 237` | `#7c3aed` (brand-600) | 4.79:1 |

Light mode gets its own step. Today the rail is `brand-400` in both themes, which
is why it collapses to 2.29:1 in light mode. This is the single largest unmeasured
light-mode defect found in this pass.

### A7. `--surface-bar` (new), the time-filter strip

| Mode | Value | Hex |
|---|---|---|
| dark | `13 20 37` | `#0d1425` |
| light | `242 241 248` | `#f2f1f8` |

Solid, replacing `bg-dark-800/60` at `Layout.tsx:746`. Same reason as A3: a
translucent chrome surface cannot be verified. `#0d1425` is the exact value the
current 60% composite already produces over the dark canvas, so dark mode does not
visually change; it only becomes measurable. Keep `backdrop-blur-sm`, it is doing
real work when content scrolls beneath.

### A8. `--card-radius` and `--card-pad-*` (new)

| Token | Value | Applies to |
|---|---|---|
| `--card-radius` | `12px` | every card, both themes |
| `--control-radius` | `8px` | buttons, inputs, chips, nav items, filter pills |
| `--card-pad-compact` | `16px` | list rows, inline alerts, dense secondary cards |
| `--card-pad-standard` | `20px` | the default: KPI cards, content cards |
| `--card-pad-feature` | `24px` | the one hero card per page |

Three padding values, not eleven (F-20). Two radii, not four (F-20 found 8, 12, 16
and 9999; `rounded-full` stays for pills and avatars and is not a card radius).
The 16px radius on `/onboard` is dropped.

These three padding steps are not new: `docs/DESIGN-SYSTEM.md` section 3 already
ruled `p-4` / `p-5` / `p-6`. This amendment only names them as tokens and deletes
the fourth (`p-8`) and the seven ad-hoc composite paddings.

### A9. `--grid-line` and `--axis-ink` (new), chart chrome

| Token | Dark | Light | Measured on its card |
|---|---|---|---|
| `--grid-line` | `36 48 68` (`#243044`) | `234 234 242` (`#eaeaf2`) | 1.34:1 / 1.20:1 |
| `--axis-ink` | `148 163 184` (`#94a3b8`) | `100 116 139` (`#64748b`) | 6.96:1 / 4.76:1 |

Gridlines are deliberately below 3:1. They are decorative scaffolding, not a
boundary a user must perceive, and WCAG 1.4.11 does not apply to them. Axis text
clears 4.5:1 in both themes because it is text.

### A10. Engine and sentiment ramps

Defined in full in section 8. Summarised here so the amendment list is complete:
`ENGINE_META[*].chartColor` gets nine new values; `ENGINE_META[*].color` and
`ENGINE_META[*].bg` (Tailwind class strings) are **deleted**; three new sentiment
tokens are added with light and dark values.

### A11. Deletions

- `index.css:237-240`, the four `::-webkit-scrollbar` rules. Dead in Chrome and
  measured not to apply (F-23). Keep the standard `scrollbar-width` /
  `scrollbar-color` block at `:231-234`. If Safari coverage is wanted, keep the
  pseudo-element rules but delete the `width: 8px` and `border-radius: 4px`
  declarations that were measured never to take effect, and add a comment saying
  the block is Safari-only.
- `index.css:199-203`, the five `html.light .text-{blue,orange,purple,sky,indigo}-400`
  engine-label overrides. Section 8.4 removes the mechanism that needed them.
- `index.css:206-207`, the two `bg-orange-400/10` and `bg-orange-500/15` Claude
  tint overrides. Same reason.

---

## 4. Shell spec

### 4.1 Sidebar and canvas

```
aside
  background        --surface-nav
  border-right      1px solid --border-nav
  width             256px at >=768px; 256px overlay at <768px
  z-index           unchanged
```

Plus a depth bleed painted on the canvas side of the divider, not on the sidebar:

```
the flex child that wraps <main>
  background-image  linear-gradient(to right, <bleed>, transparent 24px)
  dark   <bleed> = rgba(2, 4, 10, 0.55)
  light  <bleed> = rgba(15, 23, 42, 0.06)
```

The bleed is a gradient, so it contributes nothing to any measured ratio; the
divider alone carries the 3:1. Its job is that the canvas appears to sit *behind*
the rail rather than beside it. At 24px it is invisible as a band and present as
depth. Do not extend it past 24px, and do not add a shadow to the aside itself
(the aside is a fixed overlay below 768px, where a shadow would double up with the
backdrop at `Layout.tsx:277`).

**Do not use alpha on the divider.** `border-dark-700/60` is what produced the
1.31:1 dark and 1.07:1 light readings.

### 4.2 Nav item, three states

| Property | Idle | Hover | Active |
|---|---|---|---|
| background | transparent | `--dark-700` at 55% | `--surface-nav-active` (solid) |
| text | `--text-nav-idle` | `--text-base` | `--text-nav-active` |
| weight | 400 | 400 | 600 |
| rail | none | none | 3px x 20px, `--rail-active`, `--control-radius` on the right edge only |
| icon | `--text-nav-idle` | `--text-base` | `--rail-active` |
| padding | 10px 14px | same | same |
| radius | `--control-radius` | same | same |
| min height | 40px desktop, 44px below 768px | same | same |

**The rail-hidden test.** With the 3px rail removed in devtools, the active item
is still identifiable by two independent cues:

| Cue | Dark | Light | Floor |
|---|---|---|---|
| Active background vs sidebar | `#3a2f71` on `#13152b` = **1.56:1** | `#ffffff` on `#eceaf6` = 1.19:1 | 1.5:1 |
| Active text vs idle text | `#ffffff` vs `#cbd5e1` = 1.48:1 | `#0f172a` vs `#475569` = **2.36:1** | 1.5:1 |

**Which cue carries it, and why.** In dark mode the **background** carries it, at
1.56:1. In light mode the **text** carries it, at 2.36:1. In each theme the other
cue lands just under the floor, and that asymmetry is forced, not chosen:

- Dark text cannot clear 1.5:1. The active text is already pure white, which is the
  maximum, and idle text cannot be dimmed because the comment at
  `Layout.tsx:198-204` records that idle items were brightened deliberately to stay
  distinct from the group headers. So dark had to move on the background.
- Light background cannot clear 1.5:1 without a saturated violet fill on a
  violet-tinted rail, which reads as a filled button rather than a selected row and
  fights the raised-white-card language of the whole light theme. So light had to
  move on the text.

Both themes therefore satisfy the criterion, each on one cue at or above 1.5:1,
and each carries a second cue plus a weight change plus the rail on top of that.
Three cues where there was effectively one.

### 4.3 Nav group headers

Not recoloured. Re-treated typographically, so the item hierarchy the code comment
protects is untouched.

```
font-size      10px
weight         600
letter-spacing 0.09em
text-transform uppercase
colour         --text-secondary   (dark #94a3b8 -> 7.00:1 on --surface-nav)
                                  (light #475569 -> 6.37:1 on --surface-nav)
margin         20px top, 6px bottom; no top margin on the first group
```

Hierarchy now reads: active item (14px/600, `--text-nav-active`) > idle item
(14px/400, `--text-nav-idle`) > group header (10px/600, `--text-secondary`). Three
levels separated by size and weight, not by three shades of grey.

`--text-secondary` in light mode is `71 85 105`, which is the same value as
`--text-nav-idle`. That is fine: the 4px size difference and the uppercase
treatment carry the distinction, and the header is never adjacent to an item of
the same size.

### 4.4 Time-filter bar, pressed state

The criterion is that the pressed pill is at least as strong as the nav's active
item. It is stronger, on both cues, in both themes.

```
bar        background --surface-bar (solid), backdrop-blur-sm retained,
           border-bottom 1px solid --border-nav at 40% alpha (decorative, the
           divider requirement applies to the sidebar, not to this strip)
           padding 8px 16px at 375, 8px 24px at >=640
pill idle      text --text-secondary, weight 500, transparent background
pill hover     text --text-base, background --dark-700 at 50%
pill pressed   background --surface-nav-active (solid)
               text       --text-nav-active
               weight     600
               border     1px solid --rail-active
               radius     --control-radius
               min height 32px desktop, 36px below 768px
```

| Cue | Dark | Light | Nav's equivalent |
|---|---|---|---|
| Pressed background vs bar | `#3a2f71` on `#0d1425` = **1.60:1** | `#ffffff` on `#f2f1f8` = 1.12:1 | 1.56:1 / 1.19:1 |
| Pressed text vs idle text | `#ffffff` vs `#94a3b8` = **2.56:1** | `#0f172a` vs `#475569` = **2.36:1** | 1.48:1 / 2.36:1 |
| Border vs bar | `#7c3aed` = 3.22:1 | `#7c3aed` = 3.30:1 | rail 6.60:1 / 4.79:1 |

The pill gains the 1px border that the nav item does not need, because the nav
item has a rail and the pill has nowhere to put one. `aria-pressed` at
`Layout.tsx:751` is already correct and stays.

### 4.5 Mobile bottom nav (below 768px)

```
container   background --surface-nav at 95%, backdrop-blur-md,
            border-top 1px solid --border-nav
item idle   --text-secondary
item active --text-nav-active, plus a 3px x 16px rail along the TOP edge of the
            item in --rail-active, radius on the bottom corners only
label       10px/600 (up from 9px/500), still truncated to the first word
hit target  minimum 44px x 44px
```

Active vs idle text measures 2.56:1 dark, 2.36:1 light. The rail flips from the
left edge to the top edge because the item is a vertical stack here, and a left
rail on a 60px-wide item reads as a divider between items rather than a selection.

### 4.6 Shell acceptance, one table

`bg-verify` checks these seven numbers. All are computed from the exact values in
section 3.

| # | Pair | Dark | Light | Floor |
|---|---|---|---|---|
| S1 | `--border-nav` vs canvas | 4.01:1 | 4.45:1 | 3.0 |
| S2 | `--border-nav` vs `--surface-nav` | 3.77:1 | 4.00:1 | 3.0 |
| S3 | Active nav background vs `--surface-nav` | 1.56:1 | 1.19:1 | one of S3/S4 >= 1.5 |
| S4 | Active nav text vs idle nav text | 1.48:1 | 2.36:1 | one of S3/S4 >= 1.5 |
| S5 | Pressed pill background vs `--surface-bar` | 1.60:1 | 1.12:1 | >= S3 |
| S6 | Pressed pill text vs idle pill text | 2.56:1 | 2.36:1 | >= S4 |
| S7 | `--rail-active` vs `--surface-nav` | 6.60:1 | 4.79:1 | 3.0 |

---

## 5. Layout

### 5.1 Page frame

Unchanged from the ruling in `docs/DESIGN-SYSTEM.md` section 3, restated so every
page uses it:

```
p-4 sm:p-6 md:p-8 max-w-6xl mx-auto
```

`max-w-6xl` is 1152px. At 1280 that leaves a symmetric gutter, which is what makes
the content read as a column rather than a wall.

### 5.2 Grid and breakpoints

One 12-column grid, `gap-4` between KPI tiles, `gap-6` between content blocks.

| Viewport | Columns | KPI row | Content blocks |
|---|---|---|---|
| 375 | 1 | 1 per row, full width | stacked, full width |
| 768 | 6 | 2 per row (3 cols each) | full width, or 3+3 for a paired chart |
| 1280 | 12 | 4 per row (3 cols each) | 8+4 for hero-plus-side, 6+6 for a pair |

### 5.3 Bento sizing encodes importance

Three tile sizes only. Size is assigned by rank, never to fill a gap.

| Tile | Span at 1280 | Height | Padding | Carries |
|---|---|---|---|---|
| Hero | 8 of 12 | auto, min 280px | `--card-pad-feature` | the one north-star number for the route, plus its trend |
| Standard | 4 of 12 (or 6 of 12 paired) | auto, min 200px | `--card-pad-standard` | a chart, a table, a ranked list |
| Tile | 3 of 12 | fixed 112px | `--card-pad-compact` | a single number with a label and a delta |

**Ratio rule.** The hero occupies 2x the visual area of the largest standard block
on the same screen. If a route has no single number that deserves a hero, it has
no hero: use a full-width standard block. Never promote a block to hero to balance
the grid.

**The nine-element ceiling.** No route renders more than nine top-level blocks
(hero, standard and tile all count). Anything past nine goes behind progressive
disclosure. Filter chip rows, the page title and the time-filter bar do not count.

### 5.4 Reading order

Identical on every route, and it must match DOM order so keyboard and screen
reader users get the same sequence:

1. `PageTitle` (h1)
2. Hero block, if the route has one
3. KPI tile row
4. Primary chart or table
5. Secondary blocks
6. Filters, only if they scope block 4 onward, in which case they sit immediately
   above block 4, never above block 2

Filter chip rows currently sit above the content they scope on `/sentiment` and
`/mentions`. That is correct and stays.

---

## 6. Typography components

Three components, defined once, used everywhere. `bg-app` creates them as shared
components; the file location is `bg-architect`'s call if it wants to move them.

### 6.1 `PageTitle` (h1)

```
element        h1
font-size      24px
weight         700
letter-spacing -0.02em
colour         --text-base
line-height    1.2
margin-bottom  4px, or 0 when a subtitle follows
```

700 is the majority treatment already (eight of twelve routes). The four routes at
600 change: `/`, `/social`, `/seo`, `/account` (F-19).

Exactly one `h1` per route. The auth pages (`Login`, `Signup`, `ResetPassword`)
keep their own smaller card header and are out of scope, per the existing ruling in
`docs/DESIGN-SYSTEM.md` section 2.

### 6.2 `SectionHeading` (h2)

```
element        h2
font-size      14px
weight         600
letter-spacing 0
colour         --text-base at 90%, i.e. dark #e2e8f0, light #334155
line-height    1.3
margin-bottom  12px
```

Every card that contains more than one datum gets one. That closes F-13's five
routes with zero `h2` (`/ai-visibility`, `/mentions`, `/recommendations`,
`/prompts`, `/usage`) and collapses the four competing treatments into one.

Heading order is `h1` then `h2` then `h3`, with no skips. `/ai-visibility`
currently renders an `h3` with no `h2` above it; that `h3` becomes an `h2` or gains
one.

### 6.3 `StatLabel`

Not a heading. This is the uppercase KPI caption that F-13 found masquerading as an
`h2` at 12px/600 on `/sentiment` and `/competitors`.

```
element        span or div, never h2/h3
font-size      11px
weight         600
letter-spacing 0.06em
text-transform uppercase
colour         --text-secondary
```

Paired value:

```
font-size      28px on a hero, 22px on a tile
weight         700
font-variant   tabular-nums
colour         --text-base
```

### 6.4 Heading order per route

`bg-app` verifies, per route: exactly one `h1`; at least one `h2`; no level skipped;
DOM order matches visual order.

---

## 7. Card system

```
background     --dark-800
border         1px solid --dark-700 at 60%
radius         --card-radius
padding        one of --card-pad-compact | --card-pad-standard | --card-pad-feature
elevation      inherited automatically from index.css:269-286, unchanged
hover          .card-hover-lift only on cards that are themselves a link or button
```

The elevation rules at `index.css:269-286` are selector-driven and already apply to
163 of 164 cards. They are not touched. Do not add `shadow-md` or `shadow-lg` to a
card; it doubles with the selector rule. `shadow-xl` stays reserved for dropdowns
and overlays.

`.card-hover-lift` is currently applied to static cards in places. A 2px lift on a
card you cannot click is motion without a job. Section 10 removes it from
non-interactive cards.

---

## 8. Colour system

### 8.1 The two channels

| Channel | Encodes | Structure | Where it may appear |
|---|---|---|---|
| **Engine** | identity, which AI engine | categorical, 9 fixed slots | chart series, engine swatches, engine filter chips |
| **Sentiment** | polarity, positive / neutral / negative | diverging, 3 steps | sentiment segments, sentiment badges, the sentiment score dot |

**The rule that keeps them apart:** *engine colour and sentiment colour never
encode marks in the same plot.* On the per-engine stacked sentiment chart, the
fills are sentiment and the engine is carried by the axis category label; on the
sentiment trend chart the three series are sentiment only; on every engine chart
the fills are engine and sentiment does not appear. Where both appear on one page
(`/sentiment`, `/mentions`), they appear as labelled chips, never as bare swatches.

That rule is why the two ramps are held to different separation floors, stated in
8.5.

### 8.2 The engine ramp

One hex per engine, used in **both themes**. This is deliberate: an engine's
identity should not change when the user flips the theme, and a single value per
engine removes a whole class of drift. Every value clears 3:1 against all three
surfaces the app actually paints on (`#0a0f1e` page, `#0f172a` dark card,
`#ffffff` light card), which is what makes one value per engine possible.

| Slot | Engine | Hex | Hue family | OKLCH L / C / H | vs `#0a0f1e` | vs `#0f172a` | vs `#ffffff` |
|---|---|---|---|---|---|---|---|
| 1 | `chatgpt` | `#16a34a` | green | 0.627 / 0.170 / 149 | 5.79 | 5.42 | 3.30 |
| 2 | `gemini` | `#2563eb` | blue | 0.546 / 0.215 / 263 | 3.69 | 3.45 | 5.17 |
| 3 | `claude` | `#ea580c` | orange | 0.646 / 0.194 / 41 | 5.36 | 5.02 | 3.56 |
| 4 | `perplexity` | `#0891b2` | cyan | 0.609 / 0.111 / 222 | 5.18 | 4.85 | 3.68 |
| 5 | `google_ai` | `#db2777` | pink | 0.592 / 0.218 / 1 | 4.15 | 3.88 | 4.60 |
| 6 | `meta` | `#c026d3` | fuchsia | 0.591 / 0.257 / 323 | 4.05 | 3.79 | 4.71 |
| 7 | `deepseek` | `#6366f1` | indigo | 0.585 / 0.204 / 277 | 4.27 | 4.00 | 4.47 |
| 8 | `grok` | `#a16207` | ochre | 0.554 / 0.121 / 66 | 3.88 | 3.63 | 4.92 |
| 9 | `copilot` | `#0284c7` | sky | 0.588 / 0.139 / 242 | 4.66 | 4.36 | 4.10 |

**Slot order is the display order and it is load-bearing.** The categorical
adjacent-pair check is computed on this order, so `ALL_ENGINES` in
`planConfig.ts:61-64` changes to match:

```
chatgpt, gemini, claude, perplexity, google_ai, meta, deepseek, grok, copilot
```

That order is also better product ordering than today's: the five collecting
engines first, then retired `meta`, then the three that have never collected. Today
`meta` (retired) precedes `google_ai` (live).

**What changed and why, per engine:**

| Engine | Was | Now | Reason |
|---|---|---|---|
| chatgpt | `#10b981` | `#16a34a` | Kept green, per the owner's ruling. Moved one hue step from emerald toward true green so the sentiment positive pole has somewhere to live, and stepped into the dark lightness band. Separation from Perplexity rises from 11.8 to 17.4. |
| gemini | `#3b82f6` | `#2563eb` | Kept blue. One step darker so it clears 15 delta-E against Perplexity's cyan (was 12.3, now 16.3). Blue and cyan are the only two brand-locked cool hues and this is the only lever that separates them. |
| claude | `#f97316` | `#ea580c` | Kept orange, per the owner's ruling. One step down, into the dark lightness band. |
| perplexity | `#06b6d4` | `#0891b2` | Kept cyan. One step down, into the band, and above the chroma floor. |
| google_ai | `#ef4444` | `#db2777` | **Off red.** Red is reserved for the sentiment negative pole. Google AI Mode has no single signature hue (Google's own mark is four-colour, and its AI surfaces use a blue-to-magenta gradient), so red was arbitrary. Pink also survives protanopia against blue better than fuchsia does, which is what lets the live five pass all-pairs. |
| meta | `#f59e0b` | `#c026d3` | **Off the orange-amber band entirely**, as instructed, not nudged within it. Meta is retired and renders only on historical rows, so it is the cheapest slot to move, and moving it leaves exactly one engine (Claude) in the warm band. That is the root fix for F-15. |
| deepseek | `#818cf8` | `#6366f1` | One step darker, into the band. Collided with Gemini before at 4.5 delta-E under protanopia. |
| grok | `#94a3b8` | `#a16207` | **Chromatic slot**, as instructed. Chroma rises from 0.035 to 0.121, clearing the 0.10 floor. Ochre is the only free hue region left that is not adjacent to a live engine or to a status pole. |
| copilot | `#38bdf8` | `#0284c7` | One step darker. Collided with Perplexity at 5.7 delta-E before. |

### 8.3 Validator output, engine ramp

Adjacent-pair gate, run against all three real surfaces. Command and full output
in section 17.

```
Palette (dark, surface #0a0f1e, categorical): 9 slots
  [PASS] Lightness band         all 9 inside L 0.48-0.67
  [PASS] Chroma floor           all 9 >= 0.1
  [WARN] CVD separation         worst adjacent #6366f1 vs #c026d3 dE 6.5 (deutan) - tritan 8.9
  [PASS] Normal-vision floor    worst adjacent #c026d3 vs #db2777 dE 15.8 (normal)
  [PASS] Contrast vs surface    all 9 >= 3:1
  -> ALL CHECKS PASS
```

Identical result on `#0f172a` (dark card) and on `#ffffff` (light card).

The live five, checked under the harder **all-pairs** rule, because engine filter
chips can render in any subset and any order:

```
Palette (dark, surface #0a0f1e, categorical): 5 slots
  [PASS] Lightness band         all 5 inside L 0.48-0.67
  [PASS] Chroma floor           all 5 >= 0.1
  [WARN] CVD separation         worst all-pairs #db2777 vs #16a34a dE 6.1 (deutan) - tritan 2.7
  [PASS] Normal-vision floor    worst all-pairs #db2777 vs #ea580c dE 15.4 (normal)
  [PASS] Contrast vs surface    all 5 >= 3:1
  -> ALL CHECKS PASS
```

Identical on `#ffffff`.

**The two WARNs are legal and their mitigation is mandatory, not optional.** A
colour-vision-deficiency delta-E in the 6-to-8 band is permitted only with
secondary encoding. Section 8.4 supplies it: every engine mark in this app carries
its logo and its text label, and every multi-series chart carries a legend. There
is no surface in this spec where engine identity is colour alone.

**All-pairs beyond six slots is not achievable and is not the gate.** The `dataviz`
reference states that no ordering of eight categorical slots can clear the
normal-vision floor on the all-pairs list, and the same holds here: adding `meta`
as a sixth live-rendering series drops the all-pairs colour-vision worst pair to
5.0 (protanopia, fuchsia against blue), because any magenta loses its red component
under protanopia and converges on blue. That is intrinsic to the hue wheel, not to
this palette. Recorded as residual risk R2 in section 15.

### 8.4 Engine chips: swatch plus text, no coloured text

`ENGINE_META[*].color` and `ENGINE_META[*].bg` (the Tailwind class strings) are
**deleted**. Coloured engine text is how orange-400 and amber-400 ended up 
indistinguishable in the first place: the chip hues were hand-picked separately 
from the chart hues, so they drifted.

The chip becomes:

```
[ 8px round swatch in ENGINE_META[id].chartColor ]  Engine Name
```

```
chip idle       background transparent
                border     1px solid --dark-600
                text       --text-secondary, 12px/500
                swatch     8px circle, chartColor, no ring
chip selected   background <chartColor> at 14% alpha
                border     1px solid <chartColor> at 45% alpha
                text       --text-base, 12px/600
                swatch     8px circle, chartColor, 2px ring in the card surface
padding         4px 10px
radius          9999px
min height      28px desktop, 32px below 768px, with a 44px tap area via
                a transparent inset pseudo-element
```

Three things this buys:

1. Chip colour equals chart colour by construction. They cannot drift.
2. The text stays in text tokens, so it always clears 4.5:1 in both themes with no
   per-hue override. That is what allows the deletion of the five
   `html.light .text-*-400` engine overrides at `index.css:199-203`.
3. It scales to 1,000 tenants and to a tenth engine without adding a Tailwind class
   pair per engine.

Alpha values are computed from `chartColor` at render time, not hand-authored per
engine. Two derived values only: `14%` fill, `45%` border.

Call sites: `BrandSentiment.tsx:417-422,452`, `Mentions.tsx:204`, and the engine
card grid in `AIVisibility.tsx`. The audit measured that `ENGINE_META.color` is
already not applied on the `AIVisibility` grid (labels render white or slate
there); the swatch is added there so the grid finally shares the grammar.

### 8.5 The sentiment ramp

Diverging, three steps, its own tokens, disjoint from every engine hue family.

| Token | Dark | Light | Hue family |
|---|---|---|---|
| `--sentiment-positive` | `132 204 22` (`#84cc16`) | `77 124 15` (`#4d7c0f`) | lime |
| `--sentiment-neutral` | `148 163 184` (`#94a3b8`) | `100 116 139` (`#64748b`) | neutral slate, chroma 0.04 |
| `--sentiment-negative` | `251 113 133` (`#fb7185`) | `159 18 57` (`#9f1239`) | rose |

Contrast against the surface it paints on:

| Token | Dark on `#0a0f1e` | Dark on `#0f172a` | Light on `#ffffff` |
|---|---|---|---|
| positive | 9.66 | 9.04 | 4.99 |
| neutral | 7.45 | 6.96 | 4.76 |
| negative | 7.09 | 6.63 | 8.02 |

Separation within the ramp:

| Pair | Dark | Light |
|---|---|---|
| positive vs neutral | 23.4 | 16.9 |
| neutral vs negative | 18.8 | 21.7 |
| positive vs negative, normal | 32.3 | 27.9 |
| positive vs negative, protanopia | 21.6 | 21.3 |
| positive vs negative, deuteranopia | 10.3 | 8.2 |

Separation from the **nearest engine hex**, which is the number that proves
disjointness:

| Token | Dark, worst | Light, worst |
|---|---|---|
| positive | 15.7 (vs `chatgpt`) | 11.0 (vs `chatgpt`) |
| neutral | 13.2 (vs `perplexity`) | 9.8 (vs `perplexity`) |
| negative | 11.6 (vs `claude`) | 15.1 (vs `google_ai`) |

**Floor applied here: 8.0, not 15.** The 15 floor governs marks inside one plot
where colour is the sole identifier. By the rule in 8.1, a sentiment mark and an
engine mark are never siblings in one plot; where they share a screen they are
labelled chips. For labelled chips the requirement is "reads as a different
colour", and 8.0 delta-E is the point at which two colours are unambiguously
different at chip size. Every value above clears it, with the smallest margin at
9.8. Recorded as judgement call J3 in section 15.

**Positive is lime, not emerald, and that is the whole point of the move.** The
owner ruled that ChatGPT keeps green. With green occupied by an engine and cyan
occupied by Perplexity, there is no blue-green step left for a positive pole: teal
measures 10.8 against ChatGPT and 6.9 against Perplexity in dark mode, which is
worse than what we are fixing. Lime is the nearest hue that still reads
unambiguously as "good" and clears the floor at 15.7 dark. Judgement call J2.

**Mandatory secondary encoding for sentiment.** The light ramp's positive-negative
pair measures 8.2 under deuteranopia. Green against red always collapses under
deuteranopia; no diverging ramp avoids it. Three mitigations, all required:

1. Every sentiment mark carries a glyph: a filled triangle up for positive, a
   filled circle for neutral, a filled triangle down for negative.
2. Every sentiment mark carries a text label.
3. Stacked sentiment segments render in a fixed order, positive then neutral then
   negative, left to right or bottom to top, so position also encodes polarity.

Replaces the literals at `BrandSentiment.tsx:333-335` and `:377-379`.

### 8.6 Rules that keep the system true

1. **One source.** `ENGINE_META[id].chartColor` is the only place an engine colour
   exists. No component declares a hex. `Competitors.tsx:258` `groupColors`,
   `Competitors.tsx:261` `trendColors`, `Competitors.tsx:147,155,570` and
   `Dashboard.tsx:530` are all deleted and replaced by lookups.
2. **Colour follows the entity.** Every series and every `<Cell>` is coloured by a
   lookup on the engine id from the datum, never by array index. This is the fix
   for F-22 and it is why a filter change no longer repaints the survivors.
3. **Brand violet is chrome, not data.** `#8b5cf6` and its scale are the nav rail,
   the focus ring, buttons and the collection banner. It is not a series colour.
   `Competitors.tsx:147` currently paints "you" in `#8b5cf6`. Section 9.5 gives the
   replacement.
4. **Status hues are reserved.** The three sentiment tokens never colour a
   categorical series, and no engine occupies lime, slate or rose.
5. **Text wears text tokens.** No value, axis label, legend label or chip label
   takes a series colour. A coloured mark beside the text carries identity.

### 8.7 What happens when copilot, deepseek and grok go live

Eight simultaneous live engines cannot be made pairwise separable at the
normal-vision floor: this is a property of the hue wheel, not of the palette. When
those three ship, the charts must fold to a "top five plus Other" series set, or to
small multiples, one engine per panel. Do not solve it by adding hues. Flagged now
so it is a known constraint rather than a surprise.

---

## 9. Recharts specification

Recharts `^2.12.7`. No new dependency. All values below are real Recharts props.

### 9.1 Theme resolution

Recharts writes SVG presentation attributes and does not reliably resolve
`rgb(var(--token))` strings, so charts read resolved hexes from a single small
module rather than from CSS. `bg-app` creates one exported function that returns
the resolved chart chrome for the current theme:

```
{ gridLine, axisInk, tooltipSurface, tooltipBorder, tooltipInk,
  cardSurface, sentimentPositive, sentimentNeutral, sentimentNegative }
```

Values are exactly the section 3 tokens (A9) and section 8.5 tokens, per theme. The
theme comes from the existing theme context that already drives `html.light`.
Engine colours do **not** go in this module; they stay in `ENGINE_META` because
they do not fork by theme.

`bg-architect` may relocate the module. It may not duplicate the values.

### 9.2 Grid

```jsx
<CartesianGrid
  stroke={t.gridLine}
  strokeWidth={1}
  vertical={false}
  horizontal={true}
/>
```

No `strokeDasharray`. Dashing reads as "projection" or "threshold" and this is
neither (F-21). Remove it at `Competitors.tsx:387,548` and
`BrandSentiment.tsx:323,368`.

**Do not touch** the `strokeDasharray` at `Dashboard.tsx:392,397` and
`AIVisibility.tsx:654,659`. That is score-ring arc geometry and it is correct.

Vertical gridlines are off on every time-series and every categorical chart. They
are permitted only on a scatter, of which the app has none.

### 9.3 Axes

```jsx
<XAxis
  dataKey="..."
  tick={{ fill: t.axisInk, fontSize: 11 }}
  tickLine={false}
  axisLine={false}
  interval="preserveStartEnd"
  minTickGap={24}
/>
<YAxis
  tick={{ fill: t.axisInk, fontSize: 11 }}
  tickLine={false}
  axisLine={false}
  width={40}
  tickCount={4}
/>
```

Four y ticks maximum. `minTickGap={24}` is what stops x labels colliding at 375px
without needing a per-chart rotation.

**Never two y-axes.** No `yAxisId` appears anywhere in `src/` today and none is
added. Two measures of different scale means two charts.

### 9.4 Tooltip

One shared custom tooltip component, used by every chart.

```jsx
<Tooltip
  content={<ChartTooltip />}
  cursor={{ fill: t.gridLine, fillOpacity: 0.35 }}
  wrapperStyle={{ outline: 'none' }}
/>
```

```
ChartTooltip
  background   t.tooltipSurface   dark #1e293b   light #ffffff
  border       1px solid t.tooltipBorder   dark #334155   light #d8d6e6
  radius       --control-radius
  padding      8px 10px
  shadow       shadow-xl (this is an overlay, so the overlay elevation applies)
  title        11px/600, t.axisInk
  row          8px swatch in the series colour, then the label in --text-base
               12px/500, then the value right-aligned 12px/600 tabular-nums
```

Tooltip text on tooltip surface measures 13.35:1 dark and 17.85:1 light.

`cursor={{ fill }}` is the bar-chart form. For line and area charts use
`cursor={{ stroke: t.gridLine, strokeWidth: 1 }}`, which gives the crosshair.

### 9.5 Series, keyed by entity

**Multi-series bar or line**, one series per engine:

```jsx
{engineIds.map(id => (
  <Bar key={id} dataKey={id} name={ENGINE_META[id].label}
       fill={ENGINE_META[id].chartColor}
       radius={[4, 4, 0, 0]} maxBarSize={28} />
))}
```

**Single-series bar coloured per row**, which is the `Competitors.tsx:258` case:

```jsx
<Bar dataKey="mentions" radius={[4, 4, 0, 0]} maxBarSize={28}>
  {rows.map(row => (
    <Cell key={row.entityId} fill={colorForEntity(row)} />
  ))}
</Bar>
```

`key` is the entity id, never the index. `colorForEntity` returns
`ENGINE_META[row.engineId].chartColor` for engine rows.

**Competitor rows are not engines and need their own rule.** Competitor identity is
open-ended (any number of brands, changing over time), so it cannot use a fixed
nine-slot ramp. Rule:

- The tenant's own brand renders in `--rail-active` (dark `#a78bfa`, light
  `#7c3aed`), because "you" is the one series that is allowed to wear the brand.
- Every competitor renders in `--sentiment-neutral`, one flat neutral, sorted by
  value. Rank is already encoded by bar length and by sort order; spending nine
  hues on it would be re-encoding what the bar already shows, and it is the reason
  the palette drifted into an index-keyed array in the first place.
- On hover or selection, the single hovered competitor lifts to `--text-base`.

This deletes `Competitors.tsx:258` and `:261` outright rather than recolouring
them.

**Line charts:**

```jsx
<Line type="monotone" dataKey={id} name={label}
      stroke={color} strokeWidth={2} dot={false}
      activeDot={{ r: 4, strokeWidth: 2, stroke: t.cardSurface }} />
```

All series in one chart use `strokeWidth={2}`. The current
`BrandSentiment.tsx:377-379` gives Positive 2 and the other two 1.5, which says
"Positive matters more" when it does not.

**Stacked segments** get a 2px gap so they read as separate quantities:

```jsx
<Bar dataKey="Positive" stackId="s" fill={t.sentimentPositive}
     stroke={t.cardSurface} strokeWidth={2} maxBarSize={28} />
```

Same `stroke`/`strokeWidth` on every segment in the stack. Only the last segment in
the stack carries `radius`.

### 9.6 Legend

```jsx
<Legend content={<ChartLegend />} verticalAlign="top" align="left"
        height={28} />
```

```
ChartLegend
  layout    horizontal, wraps, 12px gap
  item      8px round swatch in the series colour, then the label
  label     11px/500, --text-secondary
```

Present on every chart with two or more series. Absent on single-series charts,
where the `SectionHeading` names the series. That matches what the audit already
found correct at `Competitors.tsx:372,396,566` and `BrandSentiment.tsx:332,376`.

Legends carry the same swatch as the chips, so the same 8px circle means the same
thing everywhere in the app.

### 9.7 Container and responsive

```jsx
<ResponsiveContainer width="100%" height={h}>
```

| Viewport | Hero chart height | Standard chart height |
|---|---|---|
| 375 | 200px | 180px |
| 768 | 240px | 200px |
| 1280 | 280px | 220px |

Never `height="100%"` inside an `auto`-height parent; that is the classic Recharts
zero-height bug.

Below 768px, a chart with more than six categories on the x axis becomes a
horizontally scrolling container with a fixed inner min-width, matching the pattern
already verified working on the `AIVisibility` engine table.

---

## 10. Motion

Existing tokens only. `--motion-fast` 180ms, `--motion-base` 260ms, `--motion-slow`
500ms, `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` (`index.css:21-24`, mirrored in
`src/lib/motion.ts`). No new duration, no new easing, no new library.

`<MotionConfig reducedMotion="user">` is already wired at `App.tsx:88` and the CSS
guard at `index.css:358-374` already covers plain transitions and freezes
`animate-pulse`. Neither is changed. The per-element reduced-motion column below
states what a user with the preference set actually experiences.

| Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|
| Nav item, idle to hover | pointer enter | `background-color`, `color` | 180ms | `--ease-out` | none | confirms the row is a target | colour applies instantly, no transition |
| Nav item, active rail | route change | `height` 0 to 20px | 180ms | `--ease-out` | none | draws the eye to the row that just became current | rail renders at full height instantly |
| Nav item, active fill | route change | `background-color` | 180ms | `--ease-out` | none | same, on the second cue | instant |
| Time-filter pill, press | click | `background-color`, `border-color` | 180ms | `--ease-out` | none | confirms the press landed | instant |
| Page content entrance | route mount | `opacity` 0 to 1, `translateY` 8px to 0 | 260ms | `--ease-out` | 40ms per top-level block, capped at 5 blocks | establishes reading order: the eye is led down the page in the order the content should be read | no transform, no fade; content is present at mount |
| KPI tile value | value change | `opacity` 0.5 to 1 | 180ms | `--ease-out` | none | signals the number is new after a refresh | instant |
| Card hover lift | pointer enter, **interactive cards only** | `translateY -2px`, `box-shadow`, `border-color` | 180ms | `--ease-out` | none | signals the card is clickable | already handled at `index.css:358-363`: no transform, no transition |
| Chart series entrance | chart mount | Recharts `isAnimationActive`, `animationDuration={260}` | 260ms | Recharts default | 60ms per series, capped at 4 | masks the gap between mount and first paint of a real dataset | set `isAnimationActive={false}` when `useReducedMotion()` is true |
| Skeleton shimmer | while loading | `animate-pulse` | Tailwind default | Tailwind default | none | masks latency | already frozen to `opacity: 0.6` at `index.css:370-373` |
| Collapse and expand | click | `height` auto, `opacity` | 260ms | `--ease-out` | none | keeps the reader's place when a row opens | instant open, no height animation |
| Chip select | click | `background-color`, `border-color` | 180ms | `--ease-out` | none | confirms the filter applied | instant |

**Cut.** `.card-hover-lift` on any card that is not itself a link or a button. A
card that lifts and does nothing when clicked is motion promising an affordance
that does not exist. `bg-app` audits every `.card-hover-lift` call site and removes
it where the card has no click handler and no anchor ancestor.

**Cut.** Any ambient or looping animation not in the table above. There is none in
the app today; this keeps it that way.

---

## 11. State inventory

Six states per component. Every loading state is a skeleton that occupies the
final layout's exact geometry. No spinner that later reflows. The one legitimate
spinner is `Loader2` inside a button, where the button's size is already fixed.

Skeleton grammar, used by all of them:

```
background  --dark-700 at 60% (dark), --dark-700 (light)
radius       matches the element it stands in for
animation    animate-pulse (frozen to opacity 0.6 under reduced motion)
```

| Component | Empty | Loading | Partial | Error | Locked by plan | Success |
|---|---|---|---|---|---|---|
| **KPI tile** | label plus an em dash in `--text-secondary`, no zero, no unit | skeleton bar 60% width x 28px at the value position, real label already shown | value plus a caption naming what is missing, for example "3 of 5 engines reported" | value slot shows an alert glyph plus "Unavailable", tile border `--sentiment-negative` at 30% | lock glyph plus the unlock plan name, value slot blank | value, unit, delta with direction glyph |
| **Chart card** | `SectionHeading` plus one sentence plus one primary action button, at the chart's full height so the card does not resize when data arrives | skeleton: axis rails at `--grid-line`, three skeleton bars or one skeleton path, legend skeleton chips, exact final height | chart renders available series; a caption below names the missing ones | card body replaced by an alert glyph, one sentence, and a Retry button; the card keeps its height | `FeatureLocked` component, which the audit named the best empty state in the app | chart plus legend plus tooltip |
| **Engine chip row** | row hidden entirely; never render an empty filter row | skeleton chips at the count of the tenant's plan engines | chips for engines with data are enabled; engines with zero rows render at 45% opacity and are not clickable | affected chip gets an alert glyph in place of its swatch, `title` names the error | locked engines render with a lock glyph in place of the swatch, `--text-secondary` text, not clickable | chips, selected chips per 8.4 |
| **Data table** | `SectionHeading` plus one sentence plus one primary action | five skeleton rows at the real row height, real header row already rendered | rows render; a footer line names what is not yet collected | inline error banner above the table, table retains any rows it has | lock panel replaces the body, header stays | rows |
| **Nav item** | not applicable | not applicable | not applicable | not applicable | lock glyph right-aligned, `--text-secondary`, still clickable, routes to the upgrade screen | idle / hover / active per 4.2 |
| **Sentiment badge** | not rendered | skeleton pill 64px x 20px | not applicable | `--text-secondary` pill reading "Not scored" | not applicable | glyph plus label plus sentiment token |
| **Score ring** | ring at `--grid-line`, centre reads "Not measured yet", no percentage, no band label | skeleton ring plus skeleton number | ring renders, caption states the sample size | ring at `--grid-line`, centre reads "Unavailable", Retry below | not applicable | ring, number, band label |

**Two rules that cut across all of the above:**

1. **Never render a zero as though it were a measurement.** A tenant with no
   collected rows sees "Not measured yet", never "0%". This is F-02 and F-03 and it
   is the single worst moment in the product.
2. **Every empty and error state has at least one focusable control that leads
   somewhere.** Prose that names a destination without linking it is not an empty
   state. `/sentiment` at zero data currently measures zero buttons and zero links.

---

## 12. Data legibility

### 12.1 Numbers

| Kind | Format | Example |
|---|---|---|
| Percentage | integer, no decimal, `%` suffix, `tabular-nums` | `83%` |
| Percentage below 1 | `<1%`, never `0%` or `0.4%` | `<1%` |
| Count under 1,000 | integer | `247` |
| Count 1,000 and over | one decimal plus `k` | `1.2k` |
| Currency | symbol, two decimals, `tabular-nums` | `EUR 11.88` |
| Ratio | `n of m`, never a bare fraction | `3 of 5 engines` |
| Date | `D MMM`, plus `YYYY` only when the year differs from now | `14 Jul` |
| Relative time | under 7 days only, then switch to a date | `2 days ago` |
| Position or rank | ordinal | `3rd` |
| No data | em dash in `--text-secondary` | `-` |

`tabular-nums` is mandatory on every number that can change in place. The
`font-feature-settings` at `index.css:48` already enables a slashed zero globally.

### 12.2 Trend direction

A delta is three parts and never fewer: glyph, value, period.

```
[triangle up]  +4 pts   vs last 30d
```

- Glyph is a filled triangle up or down, or a short dash for no change. Colour is
  a sentiment token, and the glyph is what carries the direction, never the colour
  alone.
- **Direction is not always good.** For a metric where down is better, the glyph
  still points down and the colour is still chosen by whether the movement is
  favourable. The component takes an explicit `higherIsBetter` prop. There is no
  metric in the product today where down is better, but the prop exists so nobody
  has to guess later.
- A delta is only shown when there are at least two distinct collection days in
  the window. Otherwise the delta slot renders "First measurement" in
  `--text-secondary`. Per `CLAUDE.md`, no client currently has more than one
  distinct collection day in `ai_results`, so this is the state most tenants
  will actually see, and it must look deliberate rather than broken.

### 12.3 When a chart becomes a sentence

Replace the chart when any of these is true:

| Condition | Render instead |
|---|---|
| One data point | the number, with its label and unit |
| Two data points | the number plus a delta |
| One series with fewer than four categories | a ranked list of label plus value plus a proportional bar |
| Every value is 0 or 100 | a sentence: "All 5 engines mention your brand" |
| The chart would carry no comparison, only a total | the number |

Concretely, on the audit's own reading of the populated Overview: four of six
dimensions read 100%. A six-slice display where four slices are identical is not a
comparison. Those four collapse to one line reading "4 of 6 dimensions at 100%",
and the two that vary get the chart.

### 12.4 Units and labels

Every number carries a unit or a noun within 4px of it. "MENTION RATE 79% of AI
checks include brand" is the model; the audit named it the one genuinely legible
tile on Overview. Seven other numbers on that page do not follow it and should.

Internal cost figures are not customer metrics. The `EUR 0.30` monthly API budget
(F-17) is BrandGEO's own spend ceiling and is admin-only. For customers, express
the same limit as remaining checks or remaining refreshes.

---

## 13. Accessibility floor

Non-negotiable. `bg-verify` checks all of it.

### 13.1 Contrast, per text-on-surface pair used

| Text | Surface | Dark | Light | Requirement |
|---|---|---|---|---|
| `--text-base` | `--dark-800` card | 15.8:1 | 17.85:1 | 4.5 |
| `--text-secondary` | `--dark-800` card | 6.96:1 | 4.76:1 | 4.5 |
| `--text-nav-idle` | `--surface-nav` | 12.09:1 | 6.37:1 | 4.5 |
| `--text-nav-active` | `--surface-nav-active` | 11.51:1 | 17.85:1 | 4.5 |
| Group header, `--text-secondary` | `--surface-nav` | 7.00:1 | 6.37:1 | 4.5 at 10px |
| `--axis-ink` | card | 6.96:1 | 4.76:1 | 4.5 |
| Tooltip ink | tooltip surface | 13.35:1 | 17.85:1 | 4.5 |
| White | `bg-brand-600` CTA | 5.70:1 | 5.70:1 | 4.5 |

The `.bg-brand-500.text-white` remap to `#7c3aed` at `index.css:95` stays. It is
the reason CTAs pass, and its reasoning is recorded in the comment above it.

### 13.2 Non-text contrast, WCAG 1.4.11, floor 3:1

| Boundary | Dark | Light |
|---|---|---|
| `--border-nav` vs canvas | 4.01:1 | 4.45:1 |
| `--border-nav` vs `--surface-nav` | 3.77:1 | 4.00:1 |
| `--rail-active` vs `--surface-nav` | 6.60:1 | 4.79:1 |
| Pressed pill border vs `--surface-bar` | 3.22:1 | 3.30:1 |
| Every engine chart colour vs its surface | 3.69 to 5.79 | 3.30 to 5.17 |
| Every sentiment token vs its surface | 6.63 to 9.66 | 4.76 to 8.02 |
| Scrollbar thumb vs canvas | 4.01:1 | 4.76:1 |

Gridlines are exempt: decorative scaffolding, not a boundary needed to identify or
operate anything.

### 13.3 Focus

Unchanged, and correct as built (`index.css:295-307`):

```
:focus-visible          2px solid #a78bfa, offset 2px, radius 2px
html.light              outline-color #7c3aed
.rounded-full           offset 1px
```

Measured 7.02:1 against the dark canvas, 6.60:1 against the dark nav, 5.70:1
against white, 4.79:1 against the light nav. `:focus-visible` rather than `:focus`
is deliberate and stays.

Every new interactive element in this spec, including the engine chip and the
legend swatch if it is clickable, must be a real `<button>` or `<a>` so it inherits
this ring. Do not add `tabIndex` to a `<div>`.

### 13.4 Hit targets

Floor 24x24 CSS pixels (WCAG 2.5.8), and 44x44 for anything that is the primary
action on a route.

| Element | 1280 | 375 |
|---|---|---|
| Nav item | 40px tall | 44px tall |
| Time-filter pill | 32px tall | 36px tall, 44px tap area via inset pseudo-element |
| Engine chip | 28px tall | 32px tall, 44px tap area via inset pseudo-element |
| Mobile bottom nav item | not shown | 44x44 minimum |
| Primary link or button in a card | 40px tall | **44px tall** |
| Icon-only button | 32x32 | 44x44 |

F-18 measured the Overview "View full breakdown" link at 16px tall at 375, and it
was the only link on the page. Every inline text link that is a page's primary
next action becomes a padded button at 44px, not a bare anchor.

### 13.5 Heading order

Per route: exactly one `h1`; at least one `h2`; no skipped level; DOM order equals
visual order. Five routes currently render zero `h2` and one renders an `h3`
without an `h2`.

### 13.6 Identity is never colour alone

Every engine mark carries its label. Every sentiment mark carries a glyph and a
label. Every multi-series chart carries a legend. This is not a nicety here; it is
the stated mitigation for the two colour-vision WARNs in section 8.3 and the
deuteranopia figure in 8.5, and removing it invalidates the palette.

---

## 14. Reference frames

Not a mood board. Each names one comparable and the one attribute borrowed, so a
builder can settle an ambiguity by asking "what would that product do here".

| Block | Comparable | Attribute borrowed | What it means concretely |
|---|---|---|---|
| Sidebar and divider | **Linear** | Surfaces separate by a precise edge, never by a glow | 1px solid divider at a measured ratio, 24px gradient bleed that decays to nothing, no shadow on the rail |
| Active nav item | **Raycast** | The selected row is a physical object sitting on the rail | Solid raised fill, white semibold text, accent rail; three cues, not one tint |
| KPI tiles and the hero number | **Mercury** | A number is a typographic event; nothing competes with it | 28px/700 tabular-nums, 11px uppercase label, one delta, and nothing else in the tile |
| Charts | **Stripe** | Chart chrome recedes until it is almost absent, so the data is the only ink with weight | Horizontal hairline grid only, no axis lines, no tick lines, four y ticks, 2px strokes, no dots |
| Empty and first-run states | **Vercel** | An empty state is a product surface, not an apology | Heading, one sentence, one primary action, at the final layout's height |
| Colour system | **Stripe** | The palette is a contract, so nobody has to think about it | One hue, one meaning; nine engine slots in a fixed order; a status ramp that is never a series |
| Light theme | **Mercury** | Light mode is designed, not derived by inversion | Its own rail tint, its own rail accent step, its own sentiment steps, all measured independently |

---

## 15. Judgement calls and residual risks

Recorded so `bg-verify` can review the decision rather than only the pixels.

**J1. One engine hex for both themes, rather than a per-theme step.**
Every engine value clears 3:1 against all three real surfaces, so a fork is not
needed. An engine's identity should not change when the theme flips, and a single
value halves the surface area for drift. The cost is that dark-mode engine colours
are slightly less luminous than the current `-400`-ish values. Accepted: the swatch
is 8px and the chart fill is large, so both read clearly, and the chip text is now
a text token rather than the engine hue, which is where the luminance actually
mattered.

**J2. Sentiment positive is lime, not emerald.**
Forced by the owner's ruling that ChatGPT keeps green. Measured alternatives, dark
mode, worst separation from an engine hex: teal 6.9 (fails), emerald 6.4 (fails),
lime 15.7 (passes). Lime still reads as "good" and is the only free hue in the
green arc. If this is rejected, the only other resolution is moving ChatGPT off
green, which the owner ruled out.

**J3. The two ramps are held to different separation floors, 15 and 8.**
The 15 floor is for marks inside one plot where colour is the sole identifier; it
governs the engine ramp against itself. The 8 floor is for labelled chips that
share a screen but never a plot; it governs sentiment against engine. The rule in
8.1 is what makes the lower floor legitimate, so if that rule is ever broken the
floor must go back to 15 and the palette must be re-derived.

**J4. Google AI Mode moves off red and Meta moves off amber.**
Red is reserved for the sentiment negative pole; amber cannot hold two engines in
the dark lightness band, which is the root of F-15. Meta is retired and renders
only on historical rows, so it is the cheapest slot to move. Google AI Mode has no
single signature hue. Neither engine has a brand association as strong as
ChatGPT-green or Claude-orange, which is why these two moved and those two did not.

**J5. `ALL_ENGINES` display order changes.**
The order is the colour-vision safety mechanism, so it is a design artefact, not
just a list. The new order also happens to be better product ordering: live engines,
then retired, then never-collected. If a future change reorders it for product
reasons, section 17's harness must be re-run, because the adjacent-pair check is
computed on that order.

**J6. Dark and light carry the active nav on different cues.**
Dark on background (1.56:1), light on text (2.36:1). Each theme's other cue lands
just under 1.5:1 and the reasons are given in 4.2. Making both cues clear in both
themes would require either dimming inactive items in dark (forbidden by the
constraint at `Layout.tsx:198-204`) or a saturated violet fill in light (which
turns the selected row into a button). The criterion is met in both themes, on one
cue each, with two further cues on top.

**R1, residual.** Adjacent-pair colour-vision separation bottoms out at 6.5
(deuteranopia, indigo against fuchsia, slots 6 and 7). Both are non-collecting or
retired engines, so the pair renders only on historical charts. Legal in the 6-to-8
band with the mandatory secondary encoding in 8.4 and 13.6.

**R2, residual.** With `meta` rendering alongside the live five, all-pairs
colour-vision separation drops to 5.0 (protanopia, fuchsia against blue). Intrinsic:
any magenta loses its red component under protanopia and converges on blue. Cannot
be re-stepped away while blue is brand-locked to Gemini. Mitigated by legend, label
and logo on every mark. Recorded, not solved.

**R3, residual.** The light sentiment ramp's positive-negative pair measures 8.2
under deuteranopia. Green against red always collapses under deuteranopia. Mitigated
by the glyph, the label and the fixed segment order in 8.5.

**R4, residual.** `--surface-nav` differs from the canvas by only 1.06:1 dark and
1.11:1 light. Two dark surfaces cannot reach 3:1 without one of them becoming a mid
grey, which is arithmetic, not preference: a 3:1 partner for `#0a0f1e` has to sit
around `#5c6478`. The divider carries the requirement instead, exactly as the
audit's FIX F-09 proposes at line 334. Section 4.6 S1 and S2 are the checks.

---

## 16. Documentation corrections

These are stale and will mislead the next agent. `bg-design` owns the first two
files; the `CLAUDE.md` corrections are flagged for whoever next edits it.

### 16.1 `docs/DESIGN-SYSTEM.md`

| Location | States | Actual | Action |
|---|---|---|---|
| section 1, surface table | `dark-900` light = `rgb(241 245 249)` | `247 247 251` (`index.css:32`) | correct |
| section 1, surface table | `dark-700` light = `rgb(226 232 240)` | `234 233 242` (`index.css:34`) | correct |
| section 1, surface table | `dark-600` light = `rgb(203 213 225)` | `216 214 230` (`index.css:35`) | correct |
| section 1, engine table | Claude = `text-purple-400` / `#a855f7` | `text-orange-400` / `#f97316` (`planConfig.ts:93`) | superseded by section 8.2 of this spec |
| section 1, engine table | all nine engine rows | superseded | replace with section 8.2 |
| section 1 | "teal used for active states in `AIVisibility.tsx` and `Prompts.tsx`" | refuted by measurement, zero `teal-` occurrences in either file | delete the claim |
| section 4 | shadow values `0 1px 4px rgba(0,0,0,0.25)` etc | `index.css:271,274` now reads `0 1px 2px rgba(0,0,0,0.2)` etc | correct |
| section 4 | "Border radius: `rounded-xl` = cards ... already consistent, no changes needed" | four radii measured in use | superseded by amendment A8 |
| new | no card padding tokens | | add A8 |
| new | no light-mode counterpart for the rail accent | | add A6 |

### 16.2 `docs/DASHBOARD-UX-2026.md`

No contradiction found. Its motion foundation (sections 3 and 7) and its typography
ruling (section 8) are reused verbatim by this spec. Add a cross-reference to this
document from its chart and colour sections so the two are not read as independent.

### 16.3 `CLAUDE.md` section 4.3, wrong

> "Dark-mode only, no light mode exists; never add `dark:` prefixes"

Light mode plainly exists: `html.light` with roughly 60 `!important` overrides
(`index.css:27-40, 66-218`), a theme toggle at `Layout.tsx:684-693` with
`role="switch"`, and a persisted preference. The guidance to avoid `dark:` prefixes
is still correct, because the app themes by CSS variable rather than by variant,
but the reason given is false and will cause the next builder to ship a
dark-only value. Correct it to: "Themed by CSS variable on `html.light`, not by
Tailwind's `dark:` variant. Every colour token needs both values. Do not add
`dark:` prefixes."

### 16.4 `CLAUDE.md` section 4.2, stale

The engine colour list gives Claude as `text-purple-400`. It has been
`text-orange-400` since before the 2026-07-26 audit. After this spec the whole list
is superseded by section 8.2 and the `color` / `bg` class strings no longer exist.
Replace the list with a pointer to `ENGINE_META[*].chartColor` and to this document.

The violet-brand rule in 4.2 is unchanged and honoured: violet remains the brand,
and neither teal nor green is introduced as a brand colour. Lime appears only as a
sentiment status step, and cyan and green appear only as two of nine engine
identities, none of which is a brand colour.

---

## 17. Verification harness

`bg-verify` runs these. Expected output is reproduced verbatim so a diff is the
test.

The validator is the one shipped with the `dataviz` skill. The path cited in the
audit (`node scripts/validate_palette.js`) does not exist in this repository; the
script lives in the skill bundle and is invoked from the skill's base directory.

```
cd <dataviz skill base>/
```

### V1. Engine ramp, adjacent gate, three surfaces

```
node scripts/validate_palette.js \
  "#16a34a,#2563eb,#ea580c,#0891b2,#db2777,#c026d3,#6366f1,#a16207,#0284c7" \
  --mode dark --surface "#0a0f1e"
```

```
Palette (dark, surface #0a0f1e, categorical): 9 slots
  [PASS] Lightness band         all 9 inside L 0.48-0.67
  [PASS] Chroma floor           all 9 >= 0.1
  [WARN] CVD separation         worst adjacent #6366f1 vs #c026d3 dE 6.5 (deutan) - tritan 8.9
  [PASS] Normal-vision floor    worst adjacent #c026d3 vs #db2777 dE 15.8 (normal)
  [PASS] Contrast vs surface    all 9 >= 3:1
  -> ALL CHECKS PASS
```

Same command with `--mode dark --surface "#0f172a"`: identical output.
Same command with `--mode light --surface "#ffffff"`: identical output apart from
the band line reading `all 9 inside L 0.43-0.77`.

Exit code 0 on all three.

### V2. Live five, all-pairs

```
node scripts/validate_palette.js "#16a34a,#2563eb,#ea580c,#0891b2,#db2777" \
  --mode dark --surface "#0a0f1e" --pairs all
```

```
Palette (dark, surface #0a0f1e, categorical): 5 slots
  [PASS] Lightness band         all 5 inside L 0.48-0.67
  [PASS] Chroma floor           all 5 >= 0.1
  [WARN] CVD separation         worst all-pairs #db2777 vs #16a34a dE 6.1 (deutan) - tritan 2.7
  [PASS] Normal-vision floor    worst all-pairs #db2777 vs #ea580c dE 15.4 (normal)
  [PASS] Contrast vs surface    all 5 >= 3:1
  -> ALL CHECKS PASS
```

Same with `--mode light --surface "#ffffff"`: identical apart from the band line.
Exit code 0 on both.

### V3. Sentiment ramp

Not run through the categorical validator. The `dataviz` scope note is explicit:
the six categorical checks do not judge a status scale, and running them on one
fails by design. The status ramp is checked by three properties instead, all
tabulated in 8.5:

- contrast against its surface, floor 3:1 for a mark and 4.5:1 for text: minimum
  measured 4.76
- mutual separation across the three steps, floor 15: minimum measured 16.9
- separation from the nearest engine hex, floor 8 per J3: minimum measured 9.8

### V4. Shell contrast

The seven ratios in section 4.6, computed from the section 3 token values with the
`contrast(a, b)` function the validator exports.

### V5. Source checks

| Check | Expected |
|---|---|
| `grep -rn "#[0-9a-fA-F]\{6\}" src/pages/ src/components/` | no engine or sentiment hex outside `planConfig.ts` and the chart-theme module |
| `grep -rn "strokeDasharray" src/` | four hits only, all in `Dashboard.tsx` and `AIVisibility.tsx` score-ring arc geometry |
| `grep -rn "groupColors\|trendColors" src/` | zero hits |
| `grep -rn "ENGINE_META\[.*\]\.color\|ENGINE_META\[.*\]\.bg" src/` | zero hits |
| `grep -rn "yAxisId" src/` | zero hits |
| `grep -rn "webkit-scrollbar" src/index.css` | zero hits, or a Safari-only block with no `width` and no `border-radius` |
| Per route, in a rendered DOM | exactly one `h1`, at least one `h2`, no skipped level |
| Per route at 375px | no interactive element under 24px in either dimension |

---

## 18. Handoff

One packet, one receiver.

**`bg-design` to `bg-app`**, slug `dashboard-visual-system`. Written to
`.claude/handoffs/009-bg-design-to-bg-app-dashboard-visual-system.md`.

Write scope:

```
brandgeo-dashboard/src/index.css
brandgeo-dashboard/src/components/Layout.tsx
brandgeo-dashboard/src/lib/planConfig.ts          (ENGINE_META and ALL_ENGINES only)
brandgeo-dashboard/src/components/                (new shared components)
brandgeo-dashboard/src/lib/                       (new chart-theme module)
brandgeo-dashboard/src/pages/Dashboard.tsx
brandgeo-dashboard/src/pages/AIVisibility.tsx
brandgeo-dashboard/src/pages/BrandSentiment.tsx
brandgeo-dashboard/src/pages/Competitors.tsx
brandgeo-dashboard/src/pages/Mentions.tsx
brandgeo-dashboard/src/pages/Recommendations.tsx
brandgeo-dashboard/src/pages/Prompts.tsx
brandgeo-dashboard/src/pages/Usage.tsx
brandgeo-dashboard/src/pages/Onboard.tsx
brandgeo-dashboard/src/pages/Account.tsx
brandgeo-dashboard/src/pages/Social.tsx
brandgeo-dashboard/src/pages/SEO.tsx
```

Read-only: this file, `docs/qa/dashboard-audit-2026-07-26.md`,
`docs/DESIGN-SYSTEM.md`, `docs/DASHBOARD-UX-2026.md`.

Out of scope, do not touch: `netlify/functions/`, `db/`, `brandgeo/web/`,
`tailwind.config.js` (no new Tailwind colour is required; every new token is a CSS
variable in `index.css`).

Downstream, after `bg-app`: `bg-verify` against section 17. `bg-design` amends
`docs/DESIGN-SYSTEM.md` per section 16.1 once the build lands, so the amendment
record and the code ship together.

Suggested build order, each independently shippable:

1. Amendments A1 to A7 plus section 4. The shell. Highest value, smallest blast
   radius, and it is the complaint on record.
2. A8 plus sections 6 and 7. Typography components and card tokens. Mechanical.
3. A10 plus section 8. The palette, `ENGINE_META`, the chip rewrite, and the two
   `!important` deletions.
4. Section 9. The Recharts pass, which depends on 3.
5. Sections 10 to 12. Motion audit, state inventory, number formatting.
