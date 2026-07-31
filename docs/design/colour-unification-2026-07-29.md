# Colour Unification: dashboard, marketing site, social assets

**Date:** 2026-07-29
**Author:** bg-design
**Status:** SPEC. Nothing in this document is built. It is the instruction set
for `bg-app` (dashboard) and `bg-web` (site).
**Write scope of this task:** this file only. No product code or site file was
edited in producing it.

---

## 0. How to read this

Section 1 states the measurement method and the two units involved, because a
unit mix-up is the single largest defect this audit found and you cannot follow
the rest without knowing which unit a number is in.

Section 2 is the findings ledger. Four backlog items are **refuted** and closed
with evidence. Five new defects are **confirmed** with evidence. Read this before
briefing anyone, because four of the items you may be carrying in `CLAUDE.md` are
already fixed in code and re-briefing them burns a cycle. That has happened twice
on this project already.

Sections 3 to 8 are the deliverable: token table, migration map, engine palette,
asset verdict, typeface decision, implementation order.

Every colour claim below was computed from a value read out of a named file at a
named line. No ratio is estimated and no deltaE is eyeballed. The harness is in
section 9 and is reproducible.

---

## 1. Method

### 1.1 The harness

Written for this audit, in Python, no dependencies beyond the standard library
and Pillow (asset sampling only). Source in section 9.

| Quantity | Model |
|---|---|
| Contrast | WCAG 2.1 relative luminance, sRGB IEC 61966-2-1 transfer curve |
| Perceptual coordinates | OKLab / OKLCH, Ottosson |
| Perceptual difference | **OKLab Euclidean distance times 100**, written `dE_OK` |
| Colour vision deficiency | **Brettel, Vienot and Mollon 1997**, two half plane projection on linear sRGB, severity 1.0, reference matrices from libDaltonLens |

### 1.2 Calibration against the existing spec

The harness was calibrated against numbers already published in
`docs/design/dashboard-visual-system.md` section 8.3, so that this document and
that one are commensurable. Reproduced exactly:

| Published claim | Harness result |
|---|---|
| adjacent worst normal, `#c026d3` vs `#db2777`, 15.8 | **15.8** |
| live five all pairs normal, `#db2777` vs `#ea580c`, 15.4 | **15.4** |
| live five all pairs deutan, `#db2777` vs `#16a34a`, 6.1 | **6.1** |
| `#16a34a` OKLCH 0.627 / 0.170 / 149 | **0.627 / 0.170 / 149.2** |
| `#16a34a` contrast on `#0a0f1e`, 5.79 | **5.79** |

Contrast, OKLCH and normal vision deltaE reproduce to the published precision.

### 1.3 The unit trap, which is load bearing

Two perceptual difference metrics are in circulation on this project and they are
**not interchangeable**. For the same pair of colours:

| Pair | `dE_OK` | CIEDE2000 |
|---|---|---|
| `#db2777` vs `#ea580c` | 15.4 | 33.0 |
| `#0891b2` vs `#0f766e` | **11.7** | **19.2** |
| `#2563eb` vs `#0891b2` | 16.3 | 22.8 |

**The floor of 15 used throughout this project is defined in `dE_OK`.** Any number
quoted in CIEDE2000 and compared against 15 is meaningless. Finding C1 in
section 2 is exactly this error, shipped.

### 1.4 One correction to the existing spec's method

`dashboard-visual-system.md` section 8.3 reports tritanopia figures that this
harness does not reproduce, and the harness is right. The published figure for
`#db2777` (pink) against `#16a34a` (green) under tritanopia is 2.7. The harness
measures **28.1**.

2.7 is not physically plausible. Tritanopia is a loss of the S cone, so it
degrades blue against yellow and **spares red against green**. Pink against green
is the discrimination tritanopia preserves best. A near total collapse there
would be a symptom of a single half plane projection applied unconditionally,
which is a known incorrect way to model tritanopia.

Validation of the replacement model, hue only separation with lightness excluded
so that confusion is actually visible:

| Pair | Normal | Under the relevant deficiency |
|---|---|---|
| pure red vs pure green | 46.2 | **3.6** (deuteranopia) |
| pure blue vs pure yellow | 51.2 | **11.1** (tritanopia) |

Both collapse in the correct direction. Simulated primaries also behave
correctly: under protan and deutan, red and green both converge on yellow and
blue is nearly unchanged; under tritan, blue maps to teal `#006288` and yellow
maps to near white `#ffeef1`.

**Consequence:** the tritan column of `dashboard-visual-system.md` section 8.3
should be disregarded and recomputed. The normal vision and deuteranopia columns
of that section stand and are confirmed.

---

## 2. Findings ledger

### 2.1 Refuted. Already fixed in code. Do not re-brief.

The `CLAUDE.md` "Product quality" backlog carries an item titled "Engine palette
is broken twice over". **All four of its claims are stale.** The palette was
rebuilt by `dashboard-visual-system.md` section 8 and the rebuild is in the
working tree.

| Backlog claim | Evidence it is closed |
|---|---|
| Claude `#f97316` vs Meta `#f59e0b`, dE 9.6 | Neither hex exists. `planConfig.ts:167` is `#ea580c`, `:179` is `#c026d3`. Measured separation now **33.5** normal, against a floor of 15. |
| Grok `#94a3b8` fails the chroma floor, reads as disabled | `planConfig.ts:181` is `#a16207`. OKLCH chroma **0.121**, clears the 0.10 floor. |
| `#10b981` means ChatGPT and Positive and a categorical series | `#10b981` appears nowhere. ChatGPT is `#16a34a` (`planConfig.ts:165`); the positive pole is lime `#84cc16` (`index.css:57`). Separation between them is **15.7**. The three meanings are now three colours. |
| `Competitors.tsx:258` carries a fourth palette assigned by array index | No such palette. `Competitors.tsx:276` reads `const colorForKey = (key) => key === brandName ? chart.railActive : chart.sentimentNeutral`, a lookup on the entity, not an index. |

I confirmed the old Claude and Meta pair does measure 9.6 normal vision, so the
original finding was correct when written. It is simply no longer true.

### 2.2 Confirmed. New defects.

**C1. `ai_overview` was validated in the wrong unit and fails the gate it claims to pass. Severity: high.**

`planConfig.ts:170-177` justifies the `#0f766e` slot with: "worst normal-vision
separation is 19.2 (vs perplexity `#0891b2`), above the 15 floor". Two adjacent
claims in the same comment block cite 39.8 and 51.6.

All three reproduce **exactly in CIEDE2000** and none reproduces in `dE_OK`:

| Claim in the comment | CIEDE2000 | `dE_OK` (the unit the floor is in) |
|---|---|---|
| 19.2 vs perplexity | 19.2 | **11.7** |
| 39.8 vs meta | 39.8 | 33.5 |
| 51.6 vs google_ai | 51.6 | 31.4 |

In the correct unit `ai_overview` measures **11.7 against Perplexity**, below the
15 floor, and it is the worst pair in the live set. Its OKLCH chroma is **0.086**,
which also fails the 0.10 chroma floor the same system applies. The comment
asserts the slot "was validated with CIEDE2000 before being chosen, not picked by
eye". It was validated, in a unit that does not match the gate.

**C2. Seven engines are live and the categorical channel is saturated. Severity: high, structural.**

`LIVE_ENGINES` (`planConfig.ts:118`) now resolves to seven: chatgpt, gemini,
claude, perplexity, google_ai, ai_overview, grok. `grok` and `ai_overview` both
shipped on 2026-07-29.

All pairs over those seven, on the current hexes:

| Check | Worst pair | Value | Floor | Verdict |
|---|---|---|---|---|
| Normal vision | perplexity / ai_overview | 11.7 | 15 | FAIL |
| Protanopia | claude / grok | 3.5 | 8 | FAIL |
| Deuteranopia | chatgpt / google_ai | 6.1 | 8 | WARN |
| Tritanopia | chatgpt / perplexity | 3.8 | 8 | FAIL |

Across all ten rendered slots the all pairs worst is **5.6**.

This is not a hue picking mistake and it cannot be fixed by picking better hues. I
searched the sRGB gamut exhaustively for replacement values for the two free slots
(`ai_overview` and `grok`), holding the five owner locked brand hues fixed and
requiring lightness band, chroma floor and 3:1 on all five surfaces. Results:

| Search | Best achievable min, all pairs normal |
|---|---|
| Both slots free, ignore retired engines | 15.4 |
| Both slots free, also 15 clear of meta / deepseek / copilot | 14.6 |
| `ai_overview` only, `grok` held | 14.8 |

**15.4 is the ceiling, and it is the owner locked pair claude / google_ai, not
anything the search controls.** The categorical channel is full.

`dashboard-visual-system.md` section 8.7 predicted this and prescribed the remedy:
"the charts must fold to a top five plus Other series set, or to small multiples,
one engine per panel. Do not solve it by adding hues." It set the trigger at
eight live engines. The trigger is reached at seven. **Section 8.7 is now due, not
hypothetical.**

**C3. The brand mark ramp collides with four engine colours, one of them exactly. Severity: medium.**

The mark rebuilt today (`docs/growth/brand-identity-2026-07-29/v3/icon-mark.svg`,
gradient stops at lines 15 to 17) ramps `#6366F1` to `#8B5CF6` to `#7C3AED`.

`planConfig.ts:180` sets `deepseek` to `#6366f1`. **That is the same hex as the
brand ramp's first stop**, `dE_OK` 0.0.

Separation of each engine from its nearest brand ramp stop:

| Engine | Hex | Min vs ramp | Verdict |
|---|---|---|---|
| deepseek | `#6366f1` | **0.0** | identical hex |
| gemini | `#2563eb` | 6.6 | collides |
| copilot | `#0284c7` | 12.1 | collides |
| meta | `#c026d3` | 13.0 | collides |
| perplexity | `#0891b2` | 17.0 | clear |
| others | | 23.5 to 32.4 | clear |

This breaks rule 3 of `dashboard-visual-system.md` section 8.6, "brand violet is
chrome, not data", in the direction that rule did not anticipate: the rule stops
chrome from taking a data colour, and here a data colour has taken the chrome
colour. Only `deepseek` is urgent, and it is cheap because `deepseek` is in
`COMING_SOON_ENGINES` (`planConfig.ts:85`) and never renders as live data.

**C4. The dashboard canvas is blue tinted, which mutes the violet accent. Severity: medium.**

This is the same defect the site fixed on 2026-07-28, still live in the dashboard.
Note 2 of the site's own token block (`brandgeo/web/index.html:130-137`) records
that surfaces carrying chroma near the accent's chroma prevent the accent reading
as an isolated element.

| Surface | Source | OKLCH chroma | Hue |
|---|---|---|---|
| `--bg` `#0a0b0e` | `index.html:166` | 0.007 | 271.0 |
| `--s` `#101116` | `index.html:167` | 0.010 | 276.4 |
| `--dark-900` `#0a0f1e` | `index.css:7` | **0.032** | 268.9 |
| `--dark-800` `#0f172a` | `index.css:8` | **0.040** | 265.8 |
| `--ac` `#8b5cf6` | `index.html:174` | 0.219 | 292.7 |

On the site the accent carries **22 times** the chroma of the surface beside it.
On the dashboard it carries **5.5 times**. Same accent, different result, entirely
because of what sits behind it.

**Light mode is not affected and is already converged.** `--dark-900` `#f7f7fb`
against `--bg` `#f7f7fc` is `dE_OK` **0.1**; `--dark-800` and `--s` are both
`#ffffff`, `dE_OK` **0.0**.

**C5. The marketing site is not on one typeface, and it is mostly Inter. Severity: medium.**

The premise that the site runs Geist holds for the homepage only.

| Loaded webfont | Pages | Evidence |
|---|---|---|
| Geist | **1** | `brandgeo/web/index.html:110` |
| Inter | **53** | `family=Inter` in 53 of 79 files |
| none | **25** | `bg-001` through `bg-019`, `blog`, `glossary`, `privacy`, `cookies`, `thanks`, `article-builder` |

Declared stacks across all 79 pages: `'Inter', system-ui, sans-serif` 56 times,
`'Segoe UI', system-ui, sans-serif` 24 times, `'Geist', system-ui, sans-serif` 8
times (all inside `index.html`).

The 24 `Segoe UI` pages are a real defect independent of any unification decision.
`Segoe UI` is a Windows system font. On macOS, iOS and Android those pages fall
through to `system-ui`, so every research article renders in a different typeface
depending on the reader's operating system. `bg-001.html` is one of them.

### 2.3 Minor, recorded, not worth a build of their own

- **`--ac` contrast is described ambiguously and the ambiguity has propagated.**
  `index.html:172-173` reads "`--ac` is 4.65:1 and is a FILL behind white button
  text". 4.65:1 is `--ac` against `--bg`. White on `--ac` is **4.23:1**, which
  fails AA at button label sizes. `index.css:150-152` states the 4.23 figure
  correctly and remaps the fill to `#7c3aed` at 5.70:1. The dashboard is right.
  The site comment should be reworded before someone reads 4.65 as the button
  figure. It already has been read that way once, in the brief that commissioned
  this document.
- **`ENGINE_META`'s own comment is stale.** `planConfig.ts:139` says "Nine hexes,
  one per engine". There are ten, since `ai_overview` was added at `:178`.
- **Two `Instrument Serif` comments survive a reverted change.**
  `index.html:103` and `:482`. I checked whether this was a live defect and it is
  not: the same block at `:493-496` records the revert and sets Geist weight 800,
  and no `font-family` anywhere on the site names Instrument Serif. Comments only.

---

## 3. The unified token table

One set of names, adopted by both properties. **The site's names win**, because
the site's values were derived by measurement (`docs/research/competitive-and-conversion-2026-07-28.md`)
and the dashboard's `--dark-*` names describe a colour rather than a role, which
is why `--dark-700` currently has to serve both "elevated surface" and "border".

Every ratio below is computed, not asserted.

### 3.1 Dark theme

| Token | Value | Role | vs `--bg` | vs `--s` | vs `--s2` |
|---|---|---|---|---|---|
| `--bg` | `#0a0b0e` | page canvas | | | |
| `--s` | `#101116` | card surface | | | |
| `--s2` | `#16171e` | elevated surface, input wells | | | |
| `--bd` | `#23242b` | hairline border | 1.27 | | |
| `--bd2` | `#32333c` | stronger border, control outline | 1.57 | | |
| `--t` | `#e8e9ed` | primary text | **16.22** | 15.54 | 14.73 |
| `--t2` | `#9ba1ac` | secondary text | **7.58** | 7.26 | 6.88 |
| `--t3` | `#7d838f` | muted text, smallest legal size 14px | **5.17** | 4.95 | **4.69** |
| `--ac` | `#8b5cf6` | accent FILL only | 4.65 | 4.45 | 4.22 |
| `--ac-text` | `#a78bfa` | accent WORDS, focus ring | **7.23** | 6.93 | 6.56 |
| `--ac-strong` | `#7c3aed` | button fill under white text | 3.45 | 3.31 | 3.14 |
| `--ok` / `--ac2` | `#34d399` | success, positive status | 10.24 | 9.81 | 9.29 |
| `--warn` | `#fbbf24` | risk, loss | 11.79 | 11.29 | 10.70 |
| `--part` | `#fb923c` | partial | 8.70 | 8.33 | 7.89 |
| `--bad` | `#f87171` | failure | 7.11 | 6.82 | 6.46 |
| `--info` | `#c4b5fd` | informational, badge text | 10.66 | 10.21 | 9.68 |

Non text pairs, WCAG 1.4.11 floor 3:1:

| Pair | Ratio | Verdict |
|---|---|---|
| white on `--ac-strong` `#7c3aed` | **5.70** | passes as text |
| white on `--ac` `#8b5cf6` | **4.23** | **fails 4.5 at label sizes.** `--ac` is a fill for non text only |
| `--bd` on `--bg` | 1.27 | decorative hairline, exempt |
| `--bd2` on `--bg` | 1.57 | decorative, **not usable as a control boundary** |

The `--bd2` row is a real constraint the implementer must respect: a control whose
only boundary is `--bd2` does not meet 1.4.11. Controls need `--ac`, `--t3` or an
explicit 3:1 border. The dashboard already solves this with `--border-nav`
`#64748b` (`index.css:33`), which measures 3.75:1 on `#0f172a` and 4.76:1 on
white. **Carry `--border-nav` into the unified set unchanged**, renamed `--bd-ui`.

### 3.2 Light theme

| Token | Value | vs `--bg` `#f7f7fc` | vs `--s` `#ffffff` | vs `--s2` `#f4f4fb` |
|---|---|---|---|---|
| `--t` | `#09090f` | **18.59** | 19.86 | 18.14 |
| `--t2` | `#55555e` | **6.91** | 7.38 | 6.74 |
| `--t3` | `#6b6b75` | **4.93** | 5.27 | 4.81 |
| `--ac` | `#7c3aed` | 5.34 | 5.70 | 5.20 |
| `--ac-text` | `#6d28d9` | **6.65** | 7.10 | 6.49 |
| `--ok` / `--ac2` | `#047857` | 5.14 | 5.48 | 5.01 |
| `--warn` / `--part` | `#b45309` | 4.70 | 5.02 | 4.59 |
| `--bad` | `#b91c1c` | 6.06 | 6.47 | 5.91 |
| `--info` | `#6d28d9` | 6.65 | 7.10 | 6.49 |

Every light mode text token clears AA 4.5:1 on all three surfaces. Lowest margin
is `--warn` at 4.59 on `--s2`.

### 3.3 Tokens the dashboard owns that the site has no equivalent for

Keep these. They are dashboard only, already measured in
`dashboard-visual-system.md` section 3, and nothing on the site needs them.

`--surface-nav`, `--bd-ui` (was `--border-nav`), `--surface-nav-active`,
`--text-nav-active`, `--text-nav-idle`, `--rail-active`, `--surface-bar`,
`--grid-line`, `--axis-ink`, `--card-radius`, `--control-radius`,
`--card-pad-*`, `--sentiment-*`.

Note `--rail-active` is `#a78bfa` in dark (`index.css:37`) and `#7c3aed` in light
(`:84`). These are exactly `--ac-text` dark and `--ac` light. **Alias them** rather
than carrying a second value that can drift.

---

## 4. Migration map, dashboard to unified

### 4.1 The Tailwind constraint, read this first

`tailwind.config.js:31-34` declares `dark.900` through `dark.600` as
`rgb(var(--dark-900) / <alpha-value>)`. That syntax requires the variable to hold
**space separated RGB channels with no `rgb()` wrapper and no commas**:

```
--dark-900: 10 15 30;      /* correct, supports bg-dark-900/40 */
--dark-900: #0a0f1e;       /* breaks every opacity utility silently */
```

The dashboard uses opacity variants heavily, for example `border-dark-700/60` in
the card elevation selector at `index.css:262`. **Every dashboard token must stay
in space separated RGB.** The site's tokens are hexes and must stay hexes, since
the site does not use Tailwind.

This means the two properties share **values and names, not literal declarations**.
That is the correct outcome and should not be treated as incomplete unification.
Write the hex in a trailing comment on every dashboard line so the two files can
be diffed by eye.

### 4.2 Dark theme map

| Current dashboard | Current value | Unified name | New value | Declaration to write | `dE_OK` shift |
|---|---|---|---|---|---|
| `--dark-900` | `10 15 30` | `--bg` | `#0a0b0e` | `--bg: 10 11 14;` | 3.4 |
| `--dark-800` | `15 23 42` | `--s` | `#101116` | `--s: 16 17 22;` | 4.1 |
| `--dark-700`, as a **surface** | `30 41 59` | `--s2` | `#16171e` | `--s2: 22 23 30;` | 6.6 |
| `--dark-700`, as a **border** | `30 41 59` | `--bd` | `#23242b` | `--bd: 35 36 43;` | 3.0 |
| `--dark-600` | `51 65 85` | `--bd2` | `#32333c` | `--bd2: 50 51 60;` | 5.4 |
| `--text-base` | `241 245 249` | `--t` | `#e8e9ed` | `--t: 232 233 237;` | 3.4 |
| `--text-secondary` | `148 163 184` | `--t2` | `#9ba1ac` | `--t2: 155 161 172;` | 1.8 |
| `--text-muted` | `100 116 139` | `--t3` | `#7d838f` | `--t3: 125 131 143;` | 5.9 |

**`--dark-700` is the one split that needs judgement, so here is the rule, not a
judgement call.** It is used 249 times. Split strictly by utility prefix:

| Utility | Count | Maps to |
|---|---|---|
| `bg-dark-700` | 146 | `--s2` |
| `border-dark-700` | 97 | `--bd` |
| `divide-dark-700` | 2 | `--bd` |

Same rule for `--dark-600`: `bg-dark-600` (28) maps to `--s2`,
`border-dark-600` (86) maps to `--bd2`.

`--text-muted` gains 1.16 points of contrast in this migration, from **4.01:1** on
the old canvas to **5.17:1** on the new. `index.css:126-127` currently remaps
`.text-slate-500` and `.text-slate-600` to `148 163 184` **because** 4.01 failed
AA. After this migration that remap is no longer load bearing for
`--text-muted` itself, but leave it in place: it also catches raw Tailwind
`text-slate-500` call sites that do not read the token at all.

### 4.3 Light theme map

Light mode is already converged. These are the full deltas:

| Token | Current | Target | `dE_OK` | Action |
|---|---|---|---|---|
| `--dark-900` | `#f7f7fb` | `#f7f7fc` | **0.1** | change for name parity only |
| `--dark-800` | `#ffffff` | `#ffffff` | **0.0** | no change |
| `--dark-700` | `#eae9f2` | `#e2e2ea` | 2.2 | change |
| `--dark-600` | `#d8d6e6` | `#cfcfda` | 2.6 | change |
| `--text-base` | `#0f172a` | `#09090f` | 7.0 | change |
| `--text-secondary` | `#475569` | `#55555e` | 2.7 | change |
| `--text-muted` | `#64748b` | `#6b6b75` | 3.6 | change |

No light mode value moves far enough to disturb any ratio in section 3.2.

### 4.4 What the migration does NOT change

Verified rather than assumed, so nobody re-validates it for free:

**The engine ramp does not need re-validation for contrast.** Minimum contrast
across all ten engine hexes:

| Surface | Min across 10 engines | Floor |
|---|---|---|
| `#0a0f1e` (old canvas) | 3.49 | 3.0 |
| `#0a0b0e` (new canvas) | **3.60** | 3.0 |
| `#0f172a` (old card) | 3.26 | 3.0 |
| `#101116` (new card) | **3.44** | 3.0 |
| `#16171e` (new elevated) | 3.26 | 3.0 |

Every engine clears 3:1 on every proposed surface, and the new canvas is
marginally **better** than the old one. Section 5's defects are separation
defects, not contrast defects, and this migration neither causes nor fixes them.

The `brand-*` Tailwind scale (`tailwind.config.js:16-28`) is unchanged.
`brand-500` `#8b5cf6` equals `--ac`, `brand-600` `#7c3aed` equals `--ac-strong`,
`brand-400` `#a78bfa` equals `--ac-text`. The scale is already the site's accent
set under different names, so nothing needs to move. Usage is 198, 5 and 72 call
sites respectively.

---

## 5. The engine palette, resolved

### 5.1 What is already correct and must not be reopened

The nine slot rebuild in `dashboard-visual-system.md` section 8.2 stands. It fixed
every backlog claim in section 2.1 above. Its mechanism, `chartColor` as the only
place an engine colour exists plus a swatch and text chip (section 8.4), is the
reason chip colour cannot drift from chart colour again. Keep all of it.

### 5.2 The two channels, restated with the collision resolved

The backlog item asked to "resolve the one hue three meanings collision by
separating identity colour from status colour". **That separation already
exists** and this spec ratifies it rather than redoing it:

| Channel | Encodes | Tokens | Floor |
|---|---|---|---|
| **Identity** | which engine | `ENGINE_META[id].chartColor`, ten slots | 15 within a plot, 8 for a labelled chip |
| **Status** | positive / neutral / negative | `--sentiment-*`, `index.css:57-59` | 15 within the ramp, 8 from the nearest engine |
| **Chrome** | brand, navigation, focus, CTA | `--ac`, `--ac-text`, `--ac-strong`, `--rail-active` | never a data colour |

The measured separation of the status ramp from its nearest engine is 15.7
(positive), 13.2 (neutral), 11.6 (negative) in dark. All clear the 8 floor.

**One rule needs adding to section 8.6, because C3 found the gap:** the brand ramp
is part of the chrome channel and no engine may occupy it. That rule is currently
violated by `deepseek`.

### 5.3 Required changes

**R1. Move `deepseek` off the brand ramp.** `planConfig.ts:180` is `#6366f1`,
identical to the brand mark's first gradient stop. `deepseek` is in
`COMING_SOON_ENGINES` (`planConfig.ts:85`) and has never collected, so it renders
only on locked plan cards. This is the cheapest slot on the board to move, exactly
as `meta` was in the previous rebuild.

**R2. Fix `ai_overview`'s chroma floor failure.** `#0f766e` measures OKLCH chroma
0.086 against a floor of 0.10. This one is unambiguous and cheap.

**R3. Do NOT chase a new hue for `ai_overview` on separation grounds.** The
exhaustive search in C2 shows the ceiling is 15.4 and the realistic best is 14.6
to 14.8, against a current 11.7. Spending a build cycle to gain three points and
still fail the floor is not worth it, and both best candidates land either in the
warm band next to Claude or in a plum next to the brand violet. Section 8.6 rule
"do not solve it by adding hues" applies.

**R4. Trigger `dashboard-visual-system.md` section 8.7 now.** This is the actual
fix for C2 and it is a charting change, not a colour change.

- Any chart that would render more than **five** engine series folds to the five
  with the most rows plus an `Other` series in `--sentiment-neutral`.
- Alternatively, small multiples, one engine per panel, where the page has room.
- `Other` is never coloured by identity and is always directly labelled.
- The all pairs 15 floor then applies only to the at most five co rendered series.

**R5. Recompute the tritan column** of `dashboard-visual-system.md` section 8.3
with the model in section 1.4. Documentation correction, no code.

### 5.4 The gate, restated so it can be tested

| Surface | Rule | Floor | Currently |
|---|---|---|---|
| Chart series, colour is the sole identifier | all pairs over co rendered series, capped at 5 by R4 | 15 normal | 15.4 after R4 |
| Engine chip, carries swatch and logo and text | all pairs over the live set | 8 normal | 11.7, passes |
| Any engine vs any status token | pairwise | 8 | 11.6, passes |
| Any engine vs any brand ramp stop | pairwise | 15 | **0.0**, fails, see R1 |
| Every engine vs every surface | contrast | 3:1 | 3.26 min, passes |

Colour vision deficiency figures stay below 8 on several pairs and that remains
**legal only because secondary encoding is mandatory and already built**: every
engine mark carries a logo and a text label per section 8.4, and every multi
series chart carries a legend. There is no surface where engine identity is
colour alone. If anyone proposes a bare swatch chart, this gate fails.

---

## 6. Social and marketing asset verdict

Method: each PNG downsampled, median cut quantised to six colours, the top four
by area matched by `dE_OK` against the current palette and against the retired
values named in `index.html:211-216`. Generator scripts read directly where they
exist, which is stronger evidence than pixel sampling.

### 6.1 Verdict table

| Cohort | Files | Canvas measured | Verdict |
|---|---|---|---|
| `marketing/linkedin-company-2026-07-15/` | 5 | `#0a0a10`, `dE_OK` **1.0** from `--bg` | **ON PALETTE.** Keep. |
| `marketing/offsite-2026-07/` | 3 | `#08080f`, `dE_OK` **1.4** from `--bg` | **NEAR PALETTE.** Keep. Regenerate only if touched. |
| `marketing/google-business-profile-2026-07-15/` | 5 | `#0a0a0f`, `dE_OK` **1.0** from `--bg` | **STALE ACCENTS.** Regenerate. |
| `marketing/` root, pre 2026-07-15 | 16 | `#000412` to `#02061d` | **STALE.** Regenerate. |

### 6.2 Evidence, google-business-profile

Canvas is fine. The generator is not. `gen.py` hardcodes exactly four hexes:

| Hex in `gen.py` | Status |
|---|---|
| `#8B5CF6` | current `--ac`. Correct. |
| `#0a0a0f` | canvas, `dE_OK` 1.0 from `--bg`. Acceptable. |
| `#3B82F6` | **retired.** The pre rebuild Gemini blue, replaced by `#2563eb`. Not in any current token set. |
| `#00d4aa` | **retired.** Named at `index.html:211` as the old `--ac2` that measured 1.79:1 in light mode and was replaced by `#047857` / `#34d399`. |

`gbp-logo-720-transparent.png` and `gbp-logo-720-white-bg.png` are the **old blue
mark**, not the mark rebuilt today. Sampling finds 3.3% of pixels near `#6366f1`
and 1.7% near retired `#3b82f6`, and only **0.1%** near `#8b5cf6`. Both must be
re-exported from `docs/growth/brand-identity-2026-07-29/v3/`.

### 6.3 Evidence, root level assets

Sixteen files: `brandgeo article post*.png` (7), `linkedin banner*.png` (4),
`linkedn banner personal*.png` (2), `one-off.png`, `post.png`,
`profile linkedin.png`, plus `logo.png` and `logo only symbol.png`.

Their canvases are a **blue black**, not the near neutral canvas:

| Colour | Source | OKLCH chroma | Hue |
|---|---|---|---|
| `#000412` | sampled, `linkedin banner.png` | **0.039** | 257.1 |
| `#02061d` | sampled, `linkedin banner 4.png` | **0.052** | 266.5 |
| `--bg` `#0a0b0e` | `index.html:166` | 0.007 | 271.0 |

Chroma five to seven times the current canvas. This is the identical defect as C4
in the dashboard, from the same era, and it is why these assets look like a
different brand next to a current page.

`logo.png` and `logo only symbol.png` are the **old blue mark**. `logo only
symbol.png` samples 9.3% near `#6366f1` and 4.9% near retired `#3b82f6`, against
**0.2%** near `#8b5cf6`. The old mark is indigo weighted; the new mark is violet
weighted. These two files are the highest priority regeneration on this list
because they are the brand mark itself.

### 6.4 Blocker on regeneration, must be resolved first

`docs/growth/brand-identity-2026-07-29/v3/logo-full.svg:6-11` carries its own
warning: the wordmark is **live text, not outlined paths**, so it renders in a
fallback face anywhere Geist is missing. Its own note says the only missing input
is a Geist TTF or OTF, which is not in the repo.

**Do not regenerate any asset containing the wordmark until that font file is
obtained and the paths are outlined.** `icon-mark.svg` is pure geometry and is
safe to use now. This blocker also interacts with section 7: if the owner rules
for Inter, the wordmark should be outlined in Inter and the font problem
disappears, since Inter is already loaded on 53 site pages.

---

## 7. The typeface decision. Owner's call, not mine.

### 7.1 What the brief assumed, and what is actually true

The brief framed this as Geist on the site against Inter in the dashboard.
Measurement (finding C5) says otherwise:

| Face | Site pages loading it | Dashboard |
|---|---|---|
| Inter | **53** | yes, `index.html:30` |
| Geist | **1** (`index.html`) | no |
| none loaded, declares `Segoe UI` | **25** | no |

**The site is already 53 to 1 in favour of Inter.** The single Geist page is the
homepage. This is not two properties disagreeing, it is one property disagreeing
with itself, and the dashboard already matches the site's majority.

### 7.2 What the documented prior decision actually says

`docs/DASHBOARD-UX-2026.md` section 8.1 records the Inter decision and its
evidence: Inter is the dominant modern SaaS typeface, Linear ships Inter Variable
with `font-feature-settings: 'cv01' on, 'ss03' on, 'zero' on`, weight capped at
590. Section 8.3 records the implementation.

Two things worth stating plainly. **First, that document names Geist itself as an
acceptable alternative**, in the same sentence: "Inter is the dominant modern SaaS
typeface (Graphik/Geist as premium alternatives)". Choosing Geist would not
contradict the research the decision rests on. It would contradict the
implementation choice made from it. **Second, moving the dashboard to Geist has a
concrete technical cost that is easy to miss:** `index.css:107` sets
`font-feature-settings: 'cv01' on, 'ss03' on, 'zero' on`. Those are Inter specific
OpenType feature tags, taken from Linear's published values. They do not carry
over to another family unchanged and would have to be removed or re-derived, or
they will silently do nothing.

### 7.3 The three options, with costs

| Option | Site changes | Dashboard changes | Cost |
|---|---|---|---|
| **A. Unify on Inter** | 1 page (`index.html`), plus 25 pages fixed off `Segoe UI` | **none** | Lowest. Also closes the `Segoe UI` cross platform defect. Loses the homepage's deliberate Geist voice. |
| **B. Unify on Geist** | 78 pages | font link, Tailwind `fontFamily`, and re-derive `font-feature-settings` at `index.css:107` | Highest. Overrides a documented decision. Also the harder path for outlining the wordmark, since no Geist font file is in the repo (section 6.4). |
| **C. Split by property** | 25 `Segoe UI` pages only | none | Lowest of all, but leaves the brand reading as two products, which is the thing this spec was commissioned to end. |

### 7.4 My recommendation, and it is only a recommendation

**Option A, unify on Inter.** Reasoning, in order of weight:

1. It is where the estate already is. 53 pages plus the whole dashboard against
   1 page. Unifying on Geist means changing 78 pages to match one.
2. It closes the `Segoe UI` defect as a side effect, which is a live cross
   platform rendering bug on all 19 research articles, the blog and the legal
   pages. That defect is worse than any Inter versus Geist difference.
3. It preserves the documented `font-feature-settings` work rather than forcing a
   re-derivation on a family we have no published values for.
4. It unblocks section 6.4. Outlining the wordmark needs a font file we do not
   have for Geist and effectively already have for Inter.

**What Option A costs, stated honestly:** the homepage's type pairing was a
deliberate 2026-07-28 differentiation move, and the reasoning at
`index.html:100-108` is sound. Geist has genuine tabular figures used at
`index.html:672`, `:961`, `:978` and `:999` for the score readouts. Inter supports
tabular figures too, via `font-variant-numeric: tabular-nums`, which the dashboard
already uses in seven components, so the score readouts are not at risk. What is
lost is a real and defensible piece of homepage character.

**This is the owner's call.** Choosing Option B is legitimate and the research
behind the original Inter decision does not forbid it. But it should be chosen
knowingly, as a 78 page change that overrides a documented decision and creates a
font file dependency, not slipped in as a tidy up.

**Whatever is chosen, the 25 `Segoe UI` pages get fixed.** That part is not a
matter of taste and should not wait on this decision.

---

## 8. Implementation order

Ranked by exposure and by cost to reverse. Each item is independently shippable.

| # | Item | Owner | Blocking? | Why here |
|---|---|---|---|---|
| 1 | Fix the 25 `Segoe UI` pages to load and declare a real webfont | `bg-web` | no | Live cross platform defect on every research article. Independent of section 7. |
| 2 | R1, move `deepseek` off `#6366f1` | `bg-app` | no | One hex in `planConfig.ts:180`. Removes an exact collision with the brand mark. |
| 3 | R2, raise `ai_overview` chroma above 0.10 | `bg-app` | no | One hex. Unambiguous gate failure. |
| 4 | Correct the stale comments: `planConfig.ts:139` "nine hexes", `planConfig.ts:170-177` unit error, `index.html:172` `--ac` ratio | `bg-app`, `bg-web` | no | Comments only. These are what caused C1. Cheapest item on the list. |
| 5 | R4, fold charts to five series plus `Other` | `bg-app` | **blocks nothing, but C2 is live now** | The real fix for seven live engines. Charting change, not colour. Largest single item here. |
| 6 | C4, migrate dashboard dark surfaces per section 4.2 | `bg-app` | no | 8 token lines plus the `--dark-700` split across 249 call sites. Mechanical but wide. |
| 7 | Migrate dashboard light surfaces per section 4.3 | `bg-app` | after 6 | Nearly a no op, `dE_OK` 0.0 to 7.0. Do it with 6 to keep the file coherent. |
| 8 | Regenerate `logo.png` and `logo only symbol.png` from v3 | `bg-web` | **blocked by 6.4** | The brand mark itself is wrong in the two files most likely to be reused. |
| 9 | Regenerate `google-business-profile-2026-07-15` assets, drop `#00d4aa` and `#3B82F6` from `gen.py` | `bg-web` | **blocked by 6.4** for the logo files | Published to Google Business Profile, so externally visible. |
| 10 | Regenerate the 16 root level `marketing/` assets | `bg-web` | **blocked by 6.4** | Highest volume, lowest per file exposure. |
| 11 | R5, recompute the tritan column of `dashboard-visual-system.md` 8.3 | `bg-design` | no | Documentation correction. |
| 12 | Section 7 typeface decision, then execute | owner, then `bg-web` or `bg-app` | **needs a ruling** | Do not start until ruled. |

**Not on this list on purpose:** re-picking `ai_overview`'s hue for separation
(R3 says do not), and any change to the nine slot rebuild in
`dashboard-visual-system.md` section 8.2, which is correct.

---

## 9. Verification harness

The dataviz skill validator cited in `dashboard-visual-system.md` section 17 is
**not present on this machine**. I searched `C:\Users\const` to depth 7 for
`validate_palette.js` and for a `dataviz` directory and found neither. Anyone
re-running section 17 will need to locate the skill bundle first. The harness
below is self contained and needs only Python plus Pillow.

Source: `colour.py`, reproduced in full below so this document is standalone.

```python
import math, itertools
def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def rgb2hex(r):
    return '#'+''.join('%02x'%max(0,min(255,round(c*255))) for c in r)
def lin(c):  return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def unlin(c):return c*12.92 if c<=0.0031308 else 1.055*(c**(1/2.4))-0.055

def contrast(a,b):
    def L(h):
        r,g,bl=(lin(c) for c in hex2rgb(h))
        return 0.2126*r+0.7152*g+0.0722*bl
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb)
    return (hi+0.05)/(lo+0.05)

def oklab(h):
    r,g,bl=(lin(c) for c in hex2rgb(h))
    l=0.4122214708*r+0.5363325363*g+0.0514459929*bl
    m=0.2119034982*r+0.6806995451*g+0.1073969566*bl
    s=0.0883024619*r+0.2817188376*g+0.6299787005*bl
    l_,m_,s_=l**(1/3),m**(1/3),s**(1/3)
    return (0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
            1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
            0.0259040371*l_+0.7827717662*m_-0.8086757660*s_)

def hex2oklch(h):
    L,A,B=oklab(h)
    return (L, math.hypot(A,B), math.degrees(math.atan2(B,A))%360)

def dEok(a,b):
    A,B=oklab(a),oklab(b)
    return 100*math.sqrt(sum((A[i]-B[i])**2 for i in range(3)))

# Brettel, Vienot & Mollon 1997. Reference matrices, libDaltonLens (public domain).
BRETTEL={
 'protan':((0.14980,1.19548,-0.34528,0.10764,0.84864,0.04372,0.00384,-0.00540,1.00156),
           (0.14570,1.16172,-0.30742,0.10816,0.85291,0.03892,0.00386,-0.00524,1.00139),
           (0.00048,0.00393,-0.00441)),
 'deutan':((0.36477,0.86381,-0.22858,0.26294,0.64245,0.09462,-0.02006,0.02728,0.99278),
           (0.37298,0.88166,-0.25464,0.25954,0.63506,0.10540,-0.01980,0.02784,0.99196),
           (-0.00281,-0.00611,0.00892)),
 'tritan':((1.01277,0.13548,-0.14826,-0.01243,0.86812,0.14431,0.07589,0.80500,0.11911),
           (0.93678,0.18979,-0.12657,0.06154,0.81526,0.12320,-0.37562,1.12767,0.24796),
           (0.03901,-0.02788,-0.01113)),
}
def cvd(h,kind):
    if kind=='normal': return h
    m1,m2,n=BRETTEL[kind]
    r,g,b=(lin(c) for c in hex2rgb(h))
    m = m1 if (r*n[0]+g*n[1]+b*n[2])>=0 else m2
    out=(m[0]*r+m[1]*g+m[2]*b, m[3]*r+m[4]*g+m[5]*b, m[6]*r+m[7]*g+m[8]*b)
    return rgb2hex(tuple(unlin(min(1.0,max(0.0,c))) for c in out))

def sep(a,b,kind='normal'):
    return dEok(cvd(a,kind),cvd(b,kind))
```

### V1. Calibration, must pass before trusting anything else

```python
assert round(sep('#c026d3','#db2777'),1)==15.8
assert round(sep('#db2777','#ea580c'),1)==15.4
assert round(sep('#db2777','#16a34a','deutan'),1)==6.1
assert round(contrast('#16a34a','#0a0f1e'),2)==5.79
```

### V2. CVD model sanity, must pass or the model is wrong

Hue only separation, lightness excluded, so confusion is visible:

```python
def hue_sep(a,b,k):
    A,B=oklab(cvd(a,k)),oklab(cvd(b,k))
    return 100*math.hypot(A[1]-B[1],A[2]-B[2])
# red vs green collapses under deuteranopia
assert hue_sep('#ff0000','#00ff00','normal') > 40   # 46.2
assert hue_sep('#ff0000','#00ff00','deutan') <  6   #  3.6
# blue vs yellow collapses under tritanopia
assert hue_sep('#0000ff','#ffff00','normal') > 40   # 51.2
assert hue_sep('#0000ff','#ffff00','tritan') < 15   # 11.1
```

### V3. Post fix gates

| Check | Expected after items 2, 3 and 5 |
|---|---|
| every engine vs every brand ramp stop, `dE_OK` | all >= 15 (currently `deepseek` 0.0) |
| every engine OKLCH chroma | all >= 0.10 (currently `ai_overview` 0.086) |
| all pairs over any five co rendered series | >= 15 normal |
| every engine vs `#0a0b0e`, `#101116`, `#16171e`, `#ffffff`, `#f7f7fc` | >= 3.0 |
| every text token in section 3.1 and 3.2 on its surfaces | >= 4.5 |

### V4. Source checks

| Check | Expected |
|---|---|
| `grep -c "family=Geist\|family=Inter" brandgeo/web/*.html` | one face across all 79 pages, after item 12 |
| `grep -rn "Segoe UI" brandgeo/web/` | zero hits after item 1 |
| `grep -rn "#00d4aa\|#3B82F6" marketing/` | zero hits after item 9 |
| `grep -rn "rgb(var(--" brandgeo-dashboard/src/index.css` | every dashboard token still space separated RGB, per 4.1 |
| `grep -rn "#6366f1" brandgeo-dashboard/src/lib/planConfig.ts` | zero hits after item 2 |

---

## 10. Judgement calls and residual risks

**J1. The site's names win over the dashboard's.** `--dark-700` currently has to
mean both "elevated surface" and "border", which is why 249 call sites need a
split rule in section 4.2. Role names do not have that problem. Cost: 249 call
sites change prefix meaning. Benefit: the ambiguity cannot recur.

**J2. Values unify, declarations do not.** Section 4.1. The dashboard keeps space
separated RGB because Tailwind's `<alpha-value>` requires it; the site keeps
hexes. Anyone auditing for literal identity between the two files will find a
difference and should not treat it as a defect.

**J3. I did not re-pick `ai_overview`'s hue.** R3. The exhaustive search says the
gain is three points and still fails. I would rather ship R4 than a hue that
looks like a fix and is not. If the owner prefers a visible change, the best
candidate found was `#874e99` at 14.7, and it should be understood as cosmetic.

**J4. I ratified the existing engine rebuild rather than redoing it.** Sections
5.1 and 5.2. It is correct, it is measured, and redoing it would burn a cycle to
land in the same place.

**R1 (risk). Seven live engines is the real constraint and item 5 is the only
thing that addresses it.** If item 5 slips, every chart with more than five
series is showing colours that are not reliably distinguishable, and the four
failing pairs in C2 are load bearing on `/sentiment` and `/mentions` where filter
chip rows co render. Secondary encoding is what makes this legal today. It is not
optional and it must survive any redesign.

**R2 (risk). Asset regeneration is blocked on a font file this repo does not
have.** Section 6.4. Items 8, 9 and 10 cannot complete until that is resolved, and
the resolution differs depending on the section 7 ruling. If the owner rules for
Inter, the blocker largely disappears.

**R3 (risk). `logo.png` and `logo only symbol.png` carry the old blue mark and sit
at `marketing/` root**, which is the most reachable place in the estate. Every
reuse of them re-publishes a retired identity. Until item 8 lands, they should be
treated as unusable rather than merely stale.

---

## 11. Handoff

Three receivers, disjoint write scopes, no ordering dependency between them except
where section 8 states one.

**`bg-app`**, items 2, 3, 5, 6, 7 and half of 4. Write scope:
`brandgeo-dashboard/src/index.css`, `brandgeo-dashboard/src/lib/planConfig.ts`,
`brandgeo-dashboard/src/lib/chartTheme.ts`, `brandgeo-dashboard/src/pages/`,
`brandgeo-dashboard/src/components/`. Do not touch `tailwind.config.js`; the
`brand-*` scale is already correct per section 4.4.

**`bg-web`**, items 1, 8, 9, 10 and half of 4. Write scope: `brandgeo/web/`,
`marketing/`. Note another workstream was active in `brandgeo/web/` and
`docs/growth/` on 2026-07-29; confirm it has landed before starting item 1.

**`bg-design`**, item 11, plus adding the brand ramp rule from section 5.2 to
`dashboard-visual-system.md` section 8.6.

**Owner**, item 12, the section 7 ruling. Nothing in section 8 blocks on it except
item 12 itself.

Downstream of all of it: `bg-verify` against section 9.
