# 02. The hero sample report card

Patch spec for `section.hero > div.hero-split > div.hero-visual > div.preview-wrap`
in `brandgeo/web/index.html`.

Written 2026-07-29 against the **working tree**, not `HEAD`. Read section 0
before applying.

Owner's request: *"the entire sample report needs to be improved to give more
data and be similar to what we have actually on the dashboard"*.

---

## 0. Read this before applying

**Line numbers in this document are a snapshot and will drift.** `index.html`
was edited by a concurrent session while this spec was being written: the
`.pe-card` markup moved from line 2176 to 2186 between two reads twenty minutes
apart. Every patch in section 3 is therefore written as a **literal
find-and-replace on a unique string**, and the line numbers are given only as a
navigation aid. Apply by string, verify by string.

**The measurement in the brief is of the deployed build, not the working tree.**
The brief reports the card at 471 x 352 at a 1905 viewport, and it also reports
three engines in the card. Both are true of `HEAD`. The working tree already
differs: the card carries **five** engine cells, and the hero geometry changed
(`.hero` is now full bleed with `padding-inline: max(40px, calc((100% - 1160px) / 2))`
and `.hero-split` is `1.1fr .9fr` with `align-items: start`). The right column
computes to **496.8px**, not 471. Section 4 works from the working tree.

**Do not change `site.js`.** These identifiers are read by it and every one of
them survives this patch unchanged: `.preview-wrap` (`site.js:499`),
`.preview-card` (`:498`), `#previewCard` (`:70`, `:145`), `#scoreRingProgress`
with `data-target-offset="77"` (`:427`, `:452`), `#scoreNum` with
`data-target="64"` (`:436`, `:454`). The score group's SVG is byte-identical
after the patch.

---

## 1. What the card contains now

Markup, `brandgeo/web/index.html:2157` to `:2191` at time of reading:

| Line | Content |
|---|---|
| 2157 | `<div class="preview-card" id="previewCard">` |
| 2158 to 2160 | head row, a single right-aligned pill reading `Sample report` |
| 2161 to 2177 | score group: 88px ring, `64`, `/100` |
| 2178 to 2182 | score meta: `AI Visibility Score`, then `Improving, +8 pts vs last audit` |
| 2184 | `<div class="preview-engines-label">Engine split view</div>` |
| 2185 to 2191 | a five-column grid of `.pe-card` cells |
| 2186 | ChatGPT, `#2`, KNOW |
| 2187 | Gemini, `#1`, KNOW |
| 2188 | Claude, `#4`, PARTIAL |
| 2189 | Perplexity, `n/a`, MISSING |
| 2190 | Google AI, `n/a`, MISSING |

Supporting CSS: `:1009` to `:1016` (head), `:1017` to `:1037` (score group and
meta), `:1055` to `:1075` (engine label, grid, cells, status pills), and
`:1661` inside `@media(max-width: 640px)` which drops the grid to three columns.

Data content today: **two facts per engine** (a rank and a state word) across
five engines, plus one score and one trend claim. Ten engine datapoints in total.

---

## 2. What the real dashboard shows, and the gap

### 2.1 The engine card, `AIVisibility.tsx:816` to `:880`

The dashboard's engine card is a horizontal card carrying, in this order:

- a logo tile (`:846`, `e.logoUrl` from `ENGINE_META`)
- the engine label and a **status pill** whose vocabulary is exactly
  `KNOW | PARTIAL | MISSING | UNAVAILABLE` (`:444` to `:447`)
- a **mention rate percentage** as the largest number in the card (`:862`)
- `{mentioned}/{checked} prompts` (`:863`)
- `· best #{bestPos}` (`:865`)

The status thresholds are in `AIVisibility.tsx:447`:

```
s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
```

### 2.2 The engine list panel, `Dashboard.tsx:590` to `:601`

A second, denser treatment of the same data: one row per engine, each row being
`label | progress track | percentage`. No per-row border and no per-row
background. This is the closest existing product component to what a 497px hero
column can hold, and it is the shape section 3 adopts.

### 2.3 The score card, `Dashboard.tsx:400` to `:455` and `AIVisibility.tsx:699` to `:812`

Ring, numeral, the label `AI Visibility Score`, and a **band pill**:

```
aiScore >= 60 ? 'Strong' : aiScore >= 35 ? 'Developing' : 'Needs Work'
```

(`AIVisibility.tsx:786`). The score itself is a weighted mean of six dimensions,
`aiVisibilityScore.ts:144` to `:149`: Recognition 25, Knowledge 20, Sentiment 15,
Accuracy 15, Reach 15, Consistency 10. **Recognition is literally the mention
rate**, `aiVisibilityScore.ts:94`.

### 2.4 The gaps, ranked by how much they cost

| # | Gap | Severity |
|---|---|---|
| G1 | **The card shows five engines. Seven are live.** `planConfig.ts:69` puts `grok` and `ai_overview` on Growth PRO and above, both shipped 2026-07-29. `LIVE_ENGINES` (`planConfig.ts:120`) resolves to seven. The hero omits the two engines Growth PRO exists to sell. | Factual defect |
| G2 | **The metric is wrong.** The card leads with a rank (`#2`). The dashboard leads with a mention rate (`AIVisibility.tsx:862`). Rank appears in the product only as a secondary `· best #N`. The hero is reporting a number the product does not lead with, so a visitor who converts sees a different headline metric on day one. | High |
| G3 | **`Improving, +8 pts vs last audit` is a state the product has never rendered for anyone.** `TrendDelta.tsx` refuses to draw a delta with fewer than two distinct collection days and prints `First measurement` instead, and `CLAUDE.md` records that no client of any kind has more than one distinct collection day in `ai_results`. The one sentence in the card that reads as evidence is the one thing in it that no customer could have seen. | Integrity |
| G4 | **No band label.** The dashboard converts 64 into `Strong`; the hero leaves a bare numeral. Two of five engine cells also print `n/a` where the dashboard would print `0%`. | Medium |
| G5 | **`Google AI` is not a product name.** `ENGINE_META` calls it `Google AI Mode`, and there is now a separate `Google AI Overviews`. The abbreviation was harmless when there was one Google engine and is ambiguous now. | Medium |
| G6 | **A shipped light-mode AA failure.** `.pe-status.partial` renders `--part` `#b45309` on `rgba(251,146,60,.12)` layered over `.pe-card.partial`'s `rgba(251,146,60,.04)` over `--s` `#ffffff`. Computed: **4.44:1. Below 4.5, fails AA.** Dark mode is fine at 6.50:1. See section 5. | Medium, pre-existing |

---

## 3. The patch

Seven blocks. Four CSS, three markup. Each `FIND` string is unique in the file
and reproduced with exact indentation (four spaces for CSS, ten to twelve for the
markup inside `.preview-card`). No tabs anywhere, no trailing whitespace.

### 3.1 The sample dataset, and why these numbers

Twelve prompts, seven engines, 84 answers. Every figure in the card derives from
this one table, so the card cannot contradict itself.

| Engine (`ENGINE_META.label`) | Mentioned | Rate | Status at `pct >= 50 / >= 25` |
|---|---|---|---|
| ChatGPT | 9 of 12 | 75% | KNOW |
| Gemini | 10 of 12 | 83% | KNOW |
| Claude | 5 of 12 | 42% | PARTIAL |
| Perplexity | 7 of 12 | 58% | KNOW |
| Google AI Mode | 3 of 12 | 25% | PARTIAL |
| Google AI Overviews | 2 of 12 | 17% | MISSING |
| Grok | 0 of 12 | 0% | MISSING |
| **Total** | **36 of 84** | **43%** | |

Consistency checks, all of which hold:

- 36 / 84 = 42.86, rounds to the **43%** printed beside the ring.
- 43% is Recognition, the 25% weighted dimension. Score 64 requires the other
  five dimensions to average (64 - 0.25 x 43) / 0.75 = **71.0**. Reachable, so
  64 and 43% can coexist without either being fabricated to fit.
- 64 >= 60, so the band pill reads **Strong**, per `AIVisibility.tsx:786`.
- Score 64 keeps `data-target="64"` and `data-target-offset="77"` unchanged
  (213.63 x (1 - 0.64) = 76.9), so `site.js` is untouched.

Rows are in `ALL_ENGINES` order (`planConfig.ts:105`) filtered to
`LIVE_ENGINES`, which is the order the dashboard's own engine grid uses. Sorting
descending by rate would read better but would be a divergence from the product,
and fidelity is what was asked for.

The story this dataset tells is deliberate: a **Strong** headline sitting on top
of three engines the brand is partial or absent on. That tension is the product's
actual insight and it is what the engine split exists to reveal. A row of seven
green bars would be a worse advertisement.

### 3.2 PATCH 1, CSS, card head

Near `index.html:1009`.

FIND:
```
    .preview-card-head { display: flex; justify-content: flex-end; margin-bottom: 10px; }
    .preview-sample {
      font-size: 0.875rem;
      color: var(--t2);
      border: 1px solid var(--bd);
      border-radius: 20px;
      padding: 2px 10px;
    }
```

REPLACE:
```
    /* Two integrity markers, not one. This pass moved the card closer to a real
       dashboard screenshot, so the "this is not a customer" signal has to get
       stronger, not stay level. Both are 0.875rem, so neither is excluded by the
       three-second test's 14px rule (homepage-hook.md 2.3). */
    .preview-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .preview-head-title { font-size: 0.875rem; color: var(--t); font-weight: 700; }
    .preview-sample {
      font-size: 0.875rem;
      color: var(--t2);
      border: 1px solid var(--bd);
      border-radius: 20px;
      padding: 2px 10px;
      white-space: nowrap;
    }
```

### 3.3 PATCH 2, CSS, score meta

Near `index.html:1037`. This deletes `.improving`, whose only use in the file is
the line PATCH 6 removes.

FIND:
```
    .preview-score-meta .improving { color: var(--ac2); font-weight: 600; display: block; }
```

REPLACE:
```
    /* Replaces `.improving`. The old copy read "Improving, +8 pts vs last audit"
       and depicted a state the product has never rendered: TrendDelta.tsx
       refuses to draw a delta with fewer than two distinct collection days and
       prints "First measurement" instead, and no client has two. What replaces
       it is the dashboard's real band pill (AIVisibility.tsx:786) plus one
       aggregate that the seven rows below actually add up to. */
    .preview-score-meta .psm-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 8px;
      margin-top: 4px;
    }
    .preview-score-meta .psm-band {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--ok);
      border: 1px solid rgba(52,211,153,.35);
      border-radius: 20px;
      padding: 1px 9px;
      white-space: nowrap;
    }
    .preview-score-meta .psm-rate { color: var(--t2); font-variant-numeric: tabular-nums; }
```

### 3.4 PATCH 3, CSS, the engine split

Near `index.html:1055` to `:1075`. This is the large one. It replaces the
five-cell grid, the three `.pe-card` variants, `.pe-pos`, and the three filled
status pills.

FIND:
```
    .preview-engines-label { font-size: 0.875rem; color: var(--t2); text-transform: uppercase; letter-spacing: .07em; font-weight: 600; margin-bottom: 10px; }
    .preview-engines-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .pe-card {
      background: var(--s2);
      border: 1px solid var(--bd);
      border-radius: 8px;
      padding: 12px 6px;
      text-align: center;
    }
    .pe-card.know { border-color: rgba(139,92,246,.3); background: rgba(139,92,246,.04); }
    .pe-card.partial { border-color: rgba(251,146,60,.3); background: rgba(251,146,60,.04); }
    .pe-card.missing { border-color: rgba(248,113,113,.25); background: rgba(248,113,113,.03); }
    /* The engine name was 10.4px and the rank 17.6px, so the largest thing in
       the cell was the number a visitor cannot interpret and the smallest was
       the word that gives it meaning. */
    .pe-name { font-size: 0.875rem; color: var(--t); margin-bottom: 5px; font-weight: 600; }
    .pe-pos { font-size: 1.1rem; font-weight: 900; line-height: 1; margin-bottom: 5px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
    .pe-status { font-size: 0.875rem; font-weight: 600; padding: 1px 6px; border-radius: 3px; }
    .pe-status.know { color: var(--info); background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.3); }
    .pe-status.partial { color: var(--part); background: rgba(251,146,60,.12); border: 1px solid rgba(251,146,60,.2); }
    .pe-status.missing { color: var(--bad); background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.18); }
```

REPLACE:
```
    /* ── ENGINE SPLIT, rebuilt 2026-07-29 ──
       One box, seven rows, three text columns and a decorative bar. It was five
       bordered cells in a grid, which is five perceptual objects competing in
       the first 50ms; a table of aligned rows is one object by Gestalt
       similarity and continuity, so this carries more data at LOWER visual
       complexity, not higher.

       The row is Dashboard.tsx:590 to :601 (label, track, percentage), and the
       status vocabulary and its thresholds are AIVisibility.tsx:447. The metric
       is now the mention rate, which is what the product leads with; the rank it
       replaced appears in the dashboard only as a secondary "best #N".

       NO ENGINE IDENTITY COLOURS HERE, deliberately. The corrected palette in
       docs/growth/data-templates-2026-07-29/ carries a computed rule: six or
       more categorical series will not pass all-pairs separation (best
       achievable at six slots was CVD 1.6). There are seven live engines. A
       seven-hue rainbow is not derivable, and it would collide with the
       status colours this card already uses. One colour system, status, and the
       status word is always present so colour is never alone. */
    .preview-engines-box {
      background: var(--s2);
      border: 1px solid var(--bd);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .preview-engines-label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 2px 12px;
      font-size: 0.875rem;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: .07em;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .preview-engines-label .pel-scope {
      text-transform: none;
      letter-spacing: 0;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .preview-engines-list { display: flex; flex-direction: column; gap: 6px; }
    /* 84px on the status column is not a round number, it is the measured width
       of "MISSING" at 0.875rem/700 with .03em tracking plus padding and border.
       At 74px it clipped. */
    .pe-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 96px 44px 84px;
      align-items: center;
      gap: 10px;
    }
    .pe-name { font-size: 0.875rem; color: var(--t); font-weight: 600; min-width: 0; }
    .pe-bar { height: 6px; border-radius: 3px; background: var(--bd); overflow: hidden; }
    .pe-fill { display: block; height: 100%; border-radius: 3px; }
    .pe-fill.know    { background: var(--info); }
    .pe-fill.partial { background: var(--part); }
    .pe-fill.missing { background: var(--bad); }
    /* Zero renders as zero: an empty track and a printed 0%, no minimum-width
       bar and no hidden row. Same rule as the engine comparison template in
       docs/growth/data-templates-2026-07-29/. */
    .pe-pct { font-size: 0.875rem; font-weight: 700; color: var(--t); text-align: right; font-variant-numeric: tabular-nums; }
    /* No background fill. The shipped filled pill measured 4.44:1 for PARTIAL in
       LIGHT mode (--part #b45309 on rgba(251,146,60,.12) over rgba(251,146,60,.04)
       over #ffffff) and failed AA. No alpha fixes it: --part on pure white is
       only 5.02:1, so any orange tint drops it under 4.5. The word on the card
       surface measures 4.59:1 and passes. Dark mode improves too, 6.50 to 7.89. */
    .pe-status {
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: .03em;
      text-align: center;
      padding: 1px 6px;
      border-radius: 4px;
      background: none;
    }
    .pe-status.know    { color: var(--info); border: 1px solid rgba(139,92,246,.35); }
    .pe-status.partial { color: var(--part); border: 1px solid rgba(251,146,60,.35); }
    .pe-status.missing { color: var(--bad);  border: 1px solid rgba(248,113,113,.35); }
```

### 3.5 PATCH 4, CSS, the 640px breakpoint

Near `index.html:1661`, inside `@media(max-width: 640px)`. The old rule targets
a grid that no longer exists.

FIND:
```
      .preview-engines-grid { grid-template-columns: repeat(3, 1fr); }
```

REPLACE:
```
      /* Below 640 the card is 261px of inner width. Three things give way, and
         each of them is recoverable from something still on screen, so nothing
         is misrepresented:
         1. the bar, because the percentage beside it is the same number;
         2. the aggregate rate line, because the group label still prints
            "7 engines, 12 prompts, 84 answers" and the seven rows add to it;
         3. the status pill's tracking and padding, so "MISSING" fits in 76px
            and the engine name keeps 99px, enough for "Google AI Mode" on one
            line. Only "Google AI Overviews" wraps, to two lines, once.
         Dropping (2) is what keeps the score box at exactly its current height
         on mobile, which is the thing the fold budget actually depends on. */
      .preview-card { padding: 16px; }
      .preview-engines-box { padding: 12px 12px; }
      .preview-score-meta .psm-rate { display: none; }
      .pe-row { grid-template-columns: minmax(0, 1fr) 44px 76px; gap: 8px; }
      .pe-bar { display: none; }
      .pe-status { letter-spacing: 0; padding: 1px 4px; }
```

### 3.6 PATCH 5, markup, card head

Near `index.html:2158`.

FIND:
```
          <div class="preview-card-head">
            <span class="preview-sample">Sample report</span>
          </div>
```

REPLACE:
```
          <div class="preview-card-head">
            <span class="preview-head-title">Sample report</span>
            <span class="preview-sample">Illustrative figures</span>
          </div>
```

### 3.7 PATCH 6, markup, score meta

Near `index.html:2178`.

FIND:
```
            <div class="preview-score-meta">
              <span class="psm-label">AI Visibility Score</span>
              <span class="improving">Improving, +8 pts vs last audit</span>
            </div>
```

REPLACE:
```
            <div class="preview-score-meta">
              <span class="psm-label">AI Visibility Score</span>
              <span class="psm-row">
                <span class="psm-band">Strong</span>
                <span class="psm-rate">Mentioned in 43% of 84 answers</span>
              </span>
            </div>
```

`Strong` is not a copywriting choice. 64 >= 60, and `AIVisibility.tsx:786` maps
that to `Strong`. If the sample score ever changes, the band must be recomputed
against `>= 60 Strong / >= 35 Developing / else Needs Work`.

### 3.8 PATCH 7, markup, the engine split

Near `index.html:2184` to `:2191`.

FIND:
```
          <div class="preview-engines-label">Engine split view</div>
          <div class="preview-engines-grid">
            <div class="pe-card know"><div class="pe-name">ChatGPT</div><div class="pe-pos" style="color:var(--ok)">#2</div><span class="pe-status know">KNOW</span></div>
            <div class="pe-card know"><div class="pe-name">Gemini</div><div class="pe-pos" style="color:var(--ok)">#1</div><span class="pe-status know">KNOW</span></div>
            <div class="pe-card partial"><div class="pe-name">Claude</div><div class="pe-pos" style="color:var(--part)">#4</div><span class="pe-status partial">PARTIAL</span></div>
            <div class="pe-card missing"><div class="pe-name">Perplexity</div><div class="pe-pos" style="color:var(--bad)">n/a</div><span class="pe-status missing">MISSING</span></div>
            <div class="pe-card missing"><div class="pe-name">Google AI</div><div class="pe-pos" style="color:var(--bad)">n/a</div><span class="pe-status missing">MISSING</span></div>
          </div>
```

REPLACE:
```
          <!-- Seven rows because seven engines collect. planConfig.ts:120
               LIVE_ENGINES resolves to chatgpt, gemini, claude, perplexity,
               google_ai, ai_overview, grok. grok and ai_overview both shipped
               2026-07-29 on Growth PRO and above, and the card previously showed
               neither, so the hero omitted the two engines that tier exists to
               sell. `meta` is RETIRED and must never appear here as live.
               Row order is ALL_ENGINES order (planConfig.ts:105), which is the
               order the dashboard's own engine grid uses.
               Every figure derives from one table: 12 prompts x 7 engines = 84
               answers, 36 of them mentioning the brand, 36/84 = 43%. -->
          <div class="preview-engines-box">
            <div class="preview-engines-label">
              <span>Engine split</span>
              <span class="pel-scope">7 engines &middot; 12 prompts &middot; 84 answers</span>
            </div>
            <div class="preview-engines-list">
              <div class="pe-row">
                <span class="pe-name">ChatGPT</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill know" style="width:75%"></span></span>
                <span class="pe-pct">75%</span>
                <span class="pe-status know">KNOW</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Gemini</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill know" style="width:83%"></span></span>
                <span class="pe-pct">83%</span>
                <span class="pe-status know">KNOW</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Claude</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill partial" style="width:42%"></span></span>
                <span class="pe-pct">42%</span>
                <span class="pe-status partial">PARTIAL</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Perplexity</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill know" style="width:58%"></span></span>
                <span class="pe-pct">58%</span>
                <span class="pe-status know">KNOW</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Google AI Mode</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill partial" style="width:25%"></span></span>
                <span class="pe-pct">25%</span>
                <span class="pe-status partial">PARTIAL</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Google AI Overviews</span>
                <span class="pe-bar" aria-hidden="true"><span class="pe-fill missing" style="width:17%"></span></span>
                <span class="pe-pct">17%</span>
                <span class="pe-status missing">MISSING</span>
              </div>
              <div class="pe-row">
                <span class="pe-name">Grok</span>
                <span class="pe-bar" aria-hidden="true"></span>
                <span class="pe-pct">0%</span>
                <span class="pe-status missing">MISSING</span>
              </div>
            </div>
          </div>
```

Screen readers announce each row as "ChatGPT 75% KNOW". The bar is
`aria-hidden` because it duplicates the percentage.

---

## 4. Predicted geometry

Widths are exact and derived from the cascade. Heights are computed from the
declared box model with Inter metrics at 14px, and are estimates to about
plus or minus 5%. The one claim that is exact rather than estimated, and the one
the fold depends on, is stated at 4.4.

### 4.1 Widths

`.hero` sets `padding-inline: max(40px, calc((100% - 1160px) / 2))`, so for any
body width at or above 1240px the content box is **exactly 1160px**. `.hero-split`
is `1.1fr .9fr` with a 56px gap, so the free space is 1104 and the right column
is `1104 x 0.45 = 496.8px` at **every** viewport from 1240 upward.

| Viewport | Body width | `.hero` content | Right column | Card inner (minus 2px border, 40px padding) |
|---|---|---|---|---|
| 1905 | 1890 (15px scrollbar) | 1160 | **496.8** | 454.8 |
| 1280 | 1265 | 1160 | **496.8** | 454.8 |
| 375 | 375 | 295 (padding clamps at 40) | 295 (`.hero-visual` max-width 470 does not bind) | 261 with PATCH 4's 16px padding |

Column budget inside `.preview-engines-box` at desktop: inner 454.8 minus 32
padding minus 2 border = 420.8. Grid takes 96 + 44 + 84 plus three 10px gaps =
254, leaving **166.8px for the engine name**. `Google AI Overviews` measures
about 133px at 0.875rem/600. Fits with 34px to spare, no wrap at desktop.

At 375: inner 261 minus 24 padding minus 2 border = 235. Grid takes 44 + 76 plus
two 8px gaps = 136, leaving **99px** for the name. `Google AI Mode` is about
98px and holds one line. `Google AI Overviews` wraps to two, once, adding about
18px. Everything else fits.

### 4.2 Card height

| Band | Now | After | Delta |
|---|---|---|---|
| Border and padding, top and bottom | 42 | 42 | 0 |
| Head row | 34 | 36 | +2 |
| Score box including its 12px margin | 134 | 134 | **0** |
| Engine group | about 142 (two rows of cells at 640, one row of five at desktop: about 96) | 262 | +166 |
| **Desktop total** | **about 352 measured on the deployed build** | **about 474** | **+122** |

At 375, with PATCH 4 applied: 17 + 36 + 134 + 276 + 17 = **about 480**, against
roughly 400 today.

### 4.3 Why the desktop growth is free

The diff comment on `.hero-split` records the measured column heights that
forced `align-items: start`: **copy column 522, widget 352**. The right column is
the shorter one by 170px. Growing the card to 474 keeps it under the copy column,
so `.hero-split` does not get taller and the hero does not move. At 1280 x 800:
`.hero` has `min-height: min(100svh, 900px)` = 800 and centres its content, the
content measures about 554 including 60px of block padding, so it spans roughly
y=199 to y=753 with the fold at 800. The card runs 199 to 673. **127px of
clearance.** Verify this in a browser; it is the one number worth re-measuring.

If the copy column is ever shortened below 474 the card becomes the taller
column and starts driving hero height. Whoever edits the headline should know
that.

### 4.4 375, and the exact claim

The hero at 375 is already taller than the fold: the copy stack (badge, three
line headline at the 2.2rem clamp floor, four line paragraph, stacked search
field, trust row, payment chips) measures roughly 530px, which puts the card top
near y=660 with the fold at 812. The score box's lower edge already sits within a
few pixels of the fold **before this patch**. That is a property of the copy
stack, not of this change.

**The exact claim, and it is the reason PATCH 4 is shaped the way it is: every
pixel this patch adds lands below the score box.** The head grows by 2px. The
score box grows by **zero** at every width, because `.psm-rate` is hidden below
640 and the remaining label plus band pill measure about 66px against the 88px
the ring already reserves. So this change cannot push the score, its label, or
its band below the fold at any viewport. It can only push more engine rows below
it.

At 375 that means roughly the first row and a half of the engine split are
visible and five sit below the fold. `homepage-hook.md` 3.4 already rules on this
case: *"A partially visible block is the scroll affordance, and it costs
nothing."* The fold cutting through a list of engine rows is a better scroll cue
than the fold landing on empty card padding, which is what happens today.

---

## 5. Contrast, computed

sRGB relative luminance, WCAG 2.x, computed against both `:root` blocks. Card
surface is `--s` (`#101116` dark, `#ffffff` light); the engine box and score box
surface is `--s2` (`#16171e` dark, `#f4f4fb` light). All text below is 14px, so
the 4.5:1 threshold applies to every row and the 3:1 large-text exemption applies
to none of it.

### 5.1 Text

| Element | Colour on surface | Dark | Light |
|---|---|---|---|
| `.preview-head-title` `Sample report` | `--t` on `--s` | 15.54 | 19.86 |
| `.preview-sample` `Illustrative figures` | `--t2` on `--s` | 7.26 | 7.38 |
| `.psm-label` | `--t` on `--s2` | 14.73 | 18.14 |
| `.psm-band` `Strong` | `--ok` on `--s2` | 9.29 | 5.01 |
| `.psm-rate` | `--t2` on `--s2` | 6.88 | 6.74 |
| `.preview-engines-label` | `--t2` on `--s2` | 6.88 | 6.74 |
| `.pel-scope` | `--t2` on `--s2` | 6.88 | 6.74 |
| `.pe-name` | `--t` on `--s2` | 14.73 | 18.14 |
| `.pe-pct` | `--t` on `--s2` | 14.73 | 18.14 |
| `.pe-status.know` | `--info` on `--s2` | 9.68 | 6.49 |
| `.pe-status.partial` | `--part` on `--s2` | 7.89 | **4.59** |
| `.pe-status.missing` | `--bad` on `--s2` | 6.46 | 5.91 |

Every value clears 4.5:1. The thinnest is `PARTIAL` in light at 4.59, a margin of
0.09. **That is the first thing in this card that breaks if `--part` is ever
changed in the light `:root` block.** It is recorded here so the next person
knows.

### 5.2 Non-text, WCAG 1.4.11, threshold 3:1

| Graphic | Dark | Light |
|---|---|---|
| `.pe-fill.know` `--info` against track `--bd` | 8.37 | 5.51 |
| `.pe-fill.partial` `--part` against track `--bd` | 6.83 | 3.90 |
| `.pe-fill.missing` `--bad` against track `--bd` | 5.59 | 5.02 |

The empty track itself is `--bd` on `--s2` at 1.16 dark and 1.18 light, well
under 3:1. That is intentional and compliant: the track carries no information,
the **fill against the track** encodes the value, and the value is printed as a
number in the adjacent column regardless. The all-zero Grok row is a bare track
with `0%` beside it, so it is legible with no graphic at all.

### 5.3 The failure this removes

| | Dark | Light |
|---|---|---|
| Shipped `.pe-status.partial` (filled pill over `.pe-card.partial` tint over `--s`) | 6.50 PASS | **4.44 FAIL** |
| After this patch (no fill, on `--s2`) | 7.89 PASS | 4.59 PASS |

No alpha value fixes the shipped version: light `--part` `#b45309` on pure white
is only 5.02:1, so every orange tint drops it below 4.5. Removing the fill is the
only fix inside this card that does not touch a global token.

The three 35% alpha borders are decoration in both themes; the meaning is
carried by the token-coloured word, which is measured above.

---

## 6. Where this stays deliberately simpler than the dashboard

Seven things the dashboard has that this card does not, and the reason for each.

1. **No engine identity colours.** The corrected palette in
   `docs/growth/data-templates-2026-07-29/` carries a computed standing rule:
   *"Six or more categorical series will not pass all-pairs. Best achievable
   across unconstrained hues was CVD 1.6 at six slots."* There are seven live
   engines. A passing seven-hue palette does not exist to copy. The escape hatch
   in that rule (adjacent-only pairing on bar forms) would technically permit it
   here, since every row is directly labelled, but a seven-hue rainbow in a
   497px box is the opposite of what the 50ms complexity finding wants, and it
   would put a second colour system next to the status system the card already
   uses. One system, status, with the status word always present so colour is
   never alone.
   The `planConfig.ts` palette should not be copied here in any case: Google AI
   Overviews `#0f766e` measures 11.7 against Perplexity `#0891b2`, below the 15
   floor, and its OKLCH chroma of 0.086 is below the 0.10 floor. DeepSeek
   `#6366f1` is byte-identical to the brand mark's gradient stop 0 and must never
   appear near the logo, which in the hero is 40px away.

2. **No engine logo tiles**, which the dashboard card leads with
   (`AIVisibility.tsx:846`). The CSP does permit them (`img-src 'self' data:
   https:`), so this is not a policy limit. It is a budget one: seven
   cross-origin favicon fetches from `google.com/s2/favicons` inside the LCP
   element, against a 2.5s LCP target and a documented 7% conversion drop per
   second, to convey nothing the engine name does not already convey.

3. **No six dimension bars.** `homepage-hook.md` 3.5 deliberately moved them out
   of this card to proof block 2, removing 18 leaves that rendered below 14px.
   Putting them back would undo a decision that was measured, not guessed. The
   score's composition is still honestly represented, because the mention rate
   printed beside the ring **is** Recognition, the heaviest of the six.

4. **No trend, no sparkline, no delta.** `TrendDelta.tsx` will not draw one with
   fewer than two distinct collection days and no client has two. Removing the
   fabricated `+8 pts` is the single highest-integrity change in this patch, and
   nothing replaces it, because nothing honestly can yet. When real trend data
   exists this is the obvious slot for it.

5. **No `best #N` per row.** The dashboard prints it (`AIVisibility.tsx:865`). It
   would be a fifth column at 14px in a 497px box, and a rank next to a
   percentage in the same row makes the reader decide which number matters. The
   percentage is the one the product leads with.

6. **No `mentioned/checked` per row.** The dashboard prints `9/12 prompts` on
   every card. Here the counts are aggregated once into the group label
   (`7 engines, 12 prompts, 84 answers`), because printing them seven times
   restates arithmetic the percentage already contains. This is the difference
   between more data and more ink.

7. **No admin chrome**: no per-engine force-refresh, no allowance meter, no
   coming-soon or locked rows for `meta`, `deepseek` and `copilot`. The card
   shows what collects.

---

## 7. My actual reading, since it was asked for

**Do this patch, but understand which part of it earns its keep.**

The request was "more data". Only about a third of the value here is data
volume. The rest is correctness and honesty, and I would ship those two even if
the owner had asked for a simpler card:

- The card advertises five engines while the product bills for seven, and the
  two missing ones are precisely the two that justify the 449 EUR tier over the
  299 EUR tier. That is a revenue defect sitting in the most-viewed element on
  the site.
- The card's only evidence-shaped sentence, `Improving, +8 pts vs last audit`,
  describes a state the product has never produced for any customer. On a
  company that sells measurement, that is the worst possible sentence to have
  invented.
- The card leads with a rank; the product leads with a rate. Every converting
  visitor sees a different headline metric on day one than the one that sold
  them.

On the actual data-volume question, the research is genuinely in tension with the
request and I am not going to pretend otherwise. `competitive-and-conversion-2026-07-28.md`
4.2 records a measured **12% lift in visit-to-lead** from reducing animation and
clarifying hierarchy, and 4.5 records that a clear value proposition measures 35
to 40% better than a vague one. Both point at less, not more. What makes this
patch survivable is that it **raises datapoint count from 10 to 22 while lowering
perceptual object count**: five bordered cells become one bordered box, and seven
aligned rows read as a single table rather than seven things. If the patch is
applied and the card instead reads as busier, the correct response is to cut
rows 5 to 7 from the visible set and label the group `7 engines measured`, not to
revert to a rank based five-cell grid, which is wrong on the facts.

**Two things I would not do, and would push back on if asked:**

- Do not replace this card with a real dashboard screenshot, even though 4.5 of
  the research says screenshots beat illustrations for SaaS. The dashboard's real
  engine grid is a four-column layout of 12px labels; scaled into a 497px column
  it renders below the 14px exclusion threshold on nearly every leaf and fails
  the three-second test outright. The research's actual recommendation is a
  *stylised* screenshot with the key feature highlighted, and a hand-built card
  that uses the product's real components, vocabulary, thresholds and metric **is
  that stylised screenshot**. The finding is satisfied by structural fidelity,
  not by a PNG.
- Do not make the numbers look more like evidence. Two independent markers say
  the figures are illustrative, both at 14px, both in the head row where they are
  read first. If the card ever gets a brand name, a logo, or a date, it stops
  being a sample and starts being a claim.

---

## 8. Out of scope, found while reading, for whoever owns it

Not touched by this patch and not in this agent's write scope.

1. **`index.html` proof block 2 has corrupted markup, and it is committed.** At
   `HEAD:brandgeo/web/index.html:2268` and in the working tree:
   ```
   <div class="preview-dims-label">6 dimensions <div class="preview-dims-label">6 dimensions &middot; sample scores</div>middot; sample scores</div>
   ```
   A nested duplicate opening tag with a stray `middot;` in the text. It renders
   as visible garbage on the live homepage. This predates today's work and is a
   one line fix.

2. **The sample card and the live audit result have diverged further.**
   `homepage-hook.md` 3.6 recorded that *"the same 88px geometry is used by the
   result renderer in site.js, so the sample and the real answer are the same
   object."* That was already only true of the ring: `site.js:227` onward renders
   a completely different body (headline, domain, gap sentence, email row) with
   no engine split at all. This patch keeps the ring identical, so the stated
   invariant still holds exactly as far as it ever did, but a visitor who runs
   the audit now goes from a seven engine split to a single number. Worth a
   decision separately.

3. **`ENGINE_META.chartColor` has two computed failures** recorded in
   `docs/growth/data-templates-2026-07-29/README.md` and not yet fixed in
   `planConfig.ts`. This patch avoids them by not using engine colours at all,
   but the dashboard still ships them.
