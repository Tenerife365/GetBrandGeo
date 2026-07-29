# BrandGEO data-card templates

Built 2026-07-29. Three parameterised generators that render social and blog
assets from BrandGEO's own measurements. A competitor cannot copy these, because
the shape is trivial and the data is not.

Everything here reads a JSON file. **No generator touches the database.** The
JSON was extracted with the read-only `SELECT` statements recorded below, run
against Supabase project `duiyifepitvugyulobqm` on 2026-07-29. Re-running a
render can never trigger a collection or spend API budget.

---

## Status, honestly

| # | Template | Usable today? |
|---|---|---|
| 1 | Engine comparison card | **Yes.** 3 real client datasets ship as samples. |
| 3 | Cross-city comparison | **Yes.** 17 of 20 US research cities, complete coverage. The richest real dataset in the product. |
| 2 | Score movement | **No. Blocked on data.** Renders an explicit awaiting-data card. Not a chart. |

Template 2 is the honest casualty. Details in
[What the data does not currently support](#what-the-data-does-not-currently-support).

---

## Running them

Requires Python 3.14 with Pillow 12.2 (both already installed). No matplotlib,
no cairo, no ImageMagick, none needed. Everything is composed in Pillow at 2x to
4x supersample and downsampled with LANCZOS, the technique proven in
`docs/growth/brand-identity-2026-07-29/v3/build/render_v3.py`.

```bash
cd docs/growth/data-templates-2026-07-29

python engine_comparison.py --all          # 3 datasets x 4 sizes
python city_comparison.py   --all          # 4 sizes
python score_movement.py    --all          # 4 sizes, all awaiting-data
```

Output lands in `out/`. Every run prints which font files were actually loaded,
so a sample can never be silently mistaken for a final Inter render.

### Parameters

**`engine_comparison.py`**

| Flag | Values | Default |
|---|---|---|
| `--dataset` | `bpr-2026-07-21`, `brandgeo-2026-07-22`, `edyta-2026-07-16` | first in file |
| `--size` | `og` `square` `portrait` `threads` `story` `wide` | `og` |
| `--all` | renders every dataset across the core 4 sizes | off |
| `--out` | output directory | `./out` |

**`city_comparison.py`**

| Flag | Values | Default |
|---|---|---|
| `--size` | as above | `portrait` |
| `--top N` | show only the N cities with the most distinct brands | all |
| `--include-partial` | include the 3 cities with incomplete 4x5 coverage | off |
| `--all` | portrait, square, og (top 8), story | off |

**`score_movement.py`**

| Flag | Values | Default |
|---|---|---|
| `--size` | as above | `og` |
| `--all` | core 4 sizes | off |

### Sizes

Taken from the deduplicated render matrix in
`docs/growth/channel-specs-2026-07-29.md`.

| Name | Pixels | Matrix | Feeds |
|---|---|---|---|
| `og` | 1200 x 630 | R3 | Blog OG card, Facebook link, LinkedIn unfurl, X card |
| `square` | 1080 x 1080 | R5 | LinkedIn, X, Instagram square |
| `portrait` | 1080 x 1350 | R2 | Instagram feed and carousel, LinkedIn portrait |
| `threads` | 1440 x 1800 | R2a | Threads and Facebook feed. Threads hard-caps at 1440 wide |
| `story` | 1080 x 1920 | R1 | Reels, TikTok, Shorts, Facebook Reels |
| `wide` | 1600 x 900 | R6 | X in-feed image, blog article hero |

`story` renders inside Meta's safe area: content is confined to the band between
14 percent and 65 percent of frame height, because Meta reserves the bottom
35 percent. The card is sized to its content and centred in that band rather
than stretched, so a 9:16 export is not mostly empty.

Rendered PNGs run 67 KB to 152 KB. That clears Google Business Profile's 10 KB
minimum, which a near-black card can otherwise fail, and sits far under every
platform maximum. **Instagram accepts JPEG only**, so convert before publishing
there and expect banding on the violet; see the channel-specs format matrix.

---

## Template 1. Engine comparison card

Which AI engines name this brand, and which do not.

Horizontal bars, one row per engine, sorted by mention rate. Bar length is
magnitude, bar colour is engine identity. Every row carries the engine name and
every bar carries both a count and a percent, so identity never rests on colour
alone. That direct labelling also supplies the secondary encoding the CVD rule
requires.

Zero renders as zero. `brandgeo-2026-07-22` is a real client with 0 of 24, and
it draws five empty tracks and five `0%` labels. No minimum-width bar, no
hidden row.

**Query**

```sql
SELECT c.name AS client, c.slug, r.checked_at::date AS day, r.llm,
       count(*)                                        AS answers,
       count(*) FILTER (WHERE r.brand_mentioned)        AS mentions,
       count(DISTINCT r.prompt_id)                      AS prompts
FROM ai_results r
JOIN clients c ON c.id = r.client_id
WHERE r.status = 'ok'
  AND r.client_id = :client_id
  AND r.checked_at::date = :day
GROUP BY c.name, c.slug, day, r.llm
ORDER BY r.llm;
```

**One collection day per card, always.** Pooling days would mix engine mixes,
which is the same defect that blocks template 2. The data file is keyed
`{slug}-{day}` to make that structural.

`answers` can exceed `prompts` when a prompt was collected more than once in a
day. Bucate pe Roate's Claude row is `5/7` for exactly that reason, and the card
shows the answer count because that is what was measured.

---

## Template 2. Score movement

**Blocked. Renders an awaiting-data card.**

The code is complete and the plotting path is tested. `comparable_days()`
accepts a day only if its set of `(prompt_id, llm)` pairs matches the others,
and `render()` refuses to plot fewer than two surviving days. That guard is
permanent, not scaffolding: it is what stops a coverage change being published
as brand movement once data does exist.

**Audit query**

```sql
-- collection days per client
SELECT c.id, c.name,
       count(DISTINCT date_trunc('day', r.checked_at)) AS collection_days
FROM clients c
LEFT JOIN ai_results r ON r.client_id = c.id AND r.status = 'ok'
GROUP BY c.id, c.name
ORDER BY collection_days DESC;

-- the decisive one: does any (prompt, engine) pair recur across days?
SELECT r.client_id, r.prompt_id, r.llm,
       count(DISTINCT r.checked_at::date) AS days
FROM ai_results r
WHERE r.status = 'ok'
GROUP BY r.client_id, r.prompt_id, r.llm
HAVING count(DISTINCT r.checked_at::date) > 1
ORDER BY days DESC;
```

**Series query, for when it unblocks**

```sql
SELECT r.checked_at::date AS day, r.prompt_id, r.llm, r.brand_mentioned
FROM ai_results r
WHERE r.status = 'ok' AND r.client_id = :client_id
ORDER BY day, r.prompt_id, r.llm;
```

Shape it into `data/score-movement.json` as
`series: [{ day, points: [{prompt_id, llm, brand_mentioned}] }]` and the
generator plots it with no code change.

---

## Template 3. Cross-city comparison

Ask five AI engines the same four buying questions in twenty US cities. Count
how many different companies get named.

Between 43 and 75 per city, from only 20 answers. The most-named brand in any
city appeared in **at most 4 of 20**. In Atlanta, 62 of 75 companies were named
exactly once. That is the product's argument rendered from its own data: these
categories have no incumbent in AI answers, and the answer set is unstable
enough that appearing in it is winnable.

Horizontal stacked bars, sorted by total. Cities are nominal so they are not
coloured by value. The two segments are a frequency order, which makes them
ordinal, so they use one hue at two lightness steps, dark-mode anchored, with
the more-repeated segment lighter. A legend is present because there are two
segments.

**Comparability is enforced by construction.** All 20 US research tenants share
four prompt intents: personal injury law, real estate agents, property
management, immigration law. Only those four are counted, so every city is
compared on identical questions. The remaining one to two prompts per city
differ and are excluded.

**Query**

> The `replace()` below strips a literal **em dash**, because `clients.name`
> genuinely stores `Research — London`. It is a data value, not prose, and it
> must byte-match or the query silently returns unstripped names. Do not
> "correct" it to a hyphen.

```sql
WITH us AS (
  SELECT id, replace(name, 'Research — ', '') AS city
  FROM clients
  WHERE category = 'research' AND default_market_id = 'US' AND id >= 28
),
shared AS (
  SELECT p.id AS prompt_id, p.client_id,
    CASE WHEN p.text ILIKE 'Best personal injury law firms%' THEN 'Personal injury law'
         WHEN p.text ILIKE 'Best real estate agents%'        THEN 'Real estate agents'
         WHEN p.text ILIKE 'Top-rated property management%'  THEN 'Property management'
         WHEN p.text ILIKE 'Best immigration lawyers%'       THEN 'Immigration law' END AS intent
  FROM prompts p JOIN us ON us.id = p.client_id
),
ans AS (
  SELECT us.city, r.id AS rid, r.competitors_mentioned AS cm
  FROM us
  JOIN shared s      ON s.client_id = us.id AND s.intent IS NOT NULL
  JOIN ai_results r  ON r.prompt_id = s.prompt_id AND r.status = 'ok'
),
br AS (
  SELECT a.city, a.rid, lower(btrim(e.v->>'name')) AS brand
  FROM ans a,
       LATERAL jsonb_array_elements(
         CASE WHEN a.cm ~ '^\s*\[' THEN a.cm::jsonb ELSE '[]'::jsonb END) AS e(v)
  WHERE btrim(coalesce(e.v->>'name','')) <> ''
),
per AS (SELECT city, brand, count(DISTINCT rid) AS appearances FROM br GROUP BY city, brand)
SELECT city,
       count(*)                              AS distinct_brands,
       sum(appearances)                      AS brand_slots,
       count(*) FILTER (WHERE appearances=1) AS named_once,
       max(appearances)                      AS top_brand_appearances
FROM per GROUP BY city ORDER BY distinct_brands DESC;
```

**Three cities are excluded by default** for incomplete coverage: Miami (3 of 4
intents), Minneapolis (17 of 20 answers), Seattle (4 of 5 engines). The footer
states the exclusion on every render. `--include-partial` overrides it, but then
the bars are not comparing equal question counts and the chart should say so.

**The 7 EU research tenants are not in this dataset.** London, Berlin, Madrid,
Paris, Rome, Dublin and the older New York tenant run a different 8-prompt set
spanning law, SaaS, fintech and wealth management. Pooling them with the US 20
would compare different questions and produce a fabricated comparison.

---

## Colour

The brief's two flagged defects are both real. I reproduced them rather than
taking them on trust, and found a third.

All figures below are Euclidean distance in OKLab x100 (ΔE_OK), computed with
the dataviz skill's `validate_palette.js` against dark surface `#101116`.
Target is CVD 8. The normal-vision floor of 15 is a hard gate.

### What is wrong with the current `planConfig.ts` palette

| Finding | Measured | Verdict |
|---|---|---|
| Google AI Overviews `#0f766e` vs Perplexity `#0891b2` | normal-vision **11.7** | **FAIL.** Matches the brief exactly. |
| Google AI Overviews `#0f766e` chroma | OKLCH C **0.086** | **FAIL**, below the 0.10 floor. Reads as grey, stops doing identity work. Not previously flagged. |
| DeepSeek `#6366f1` vs brand gradient stop 0 `#6366F1` | byte-identical | Never legal as a series colour near the mark. |
| The 5 live engines, all-pairs | CVD **6.1**, normal **15.4** | Passes, but CVD sits in the 6 to 8 floor band, legal only with secondary encoding, and normal-vision clears 15 by 0.4. |

### The palette this pipeline uses instead

Derived by constrained search: each slot confined to its own engine's hue
family so it still reads as that engine, then optimised for worst-case
separation.

| Engine | Proposed | `planConfig.ts` |
|---|---|---|
| ChatGPT | `#2aac00` | `#16a34a` |
| Gemini | `#0098ff` | `#2563eb` |
| Claude | `#b23900` | `#ea580c` |
| Perplexity | `#00a7a0` | `#0891b2` |
| Google AI Mode | `#b229ad` | `#db2777` |
| Meta AI (retired) | `#7d838f` de-emphasis grey | `#c026d3` |

```
all-pairs   CVD 12.3 (deutan)   normal-vision 16.1   PASS
adjacent    CVD 12.7 (deutan)   normal-vision 30.5   PASS
lightness band, chroma floor, contrast vs surface    PASS
```

That is CVD 6.1 to 12.3, roughly double the separation, with all five still
recognisable as their own engine.

**Meta is deliberately not a categorical slot.** It was retired 2026-07-16, so
it is context rather than identity and takes the de-emphasis grey. That is also
what keeps the live set at five, which is what makes the separation above
reachable at all.

**Two standing rules, both computed rather than asserted:**

1. **Never use the brand violet `#8b5cf6` as a series colour beside the engine
   palette.** Added as a sixth series it measures CVD **6.0** against Gemini
   `#0098ff`, a hard FAIL. Violet stays brand chrome, plus single-series fills
   where there is no second series to confuse it with. Template 3 is that case.
2. **Six or more categorical series will not pass all-pairs.** Best achievable
   across unconstrained hues was CVD 1.6 at six slots. If a sixth engine goes
   live, either fold one to grey, facet, or accept adjacent-only pairing on bar
   forms and drop all-pairs swatches.

Template 3's two-step violet ramp `#7c3aed` to `#a78bfa` was validated
separately as an ordinal ramp: monotone lightness, adjacent ΔL clears 0.06,
light end 3.31:1 against surface. PASS.

---

## Typeface, and why these samples are not final

**Inter is not installed on this machine and Pillow cannot load what is here.**
Checked 2026-07-29: 473 files in `C:\Windows\Fonts`, zero matching "inter"; no
per-user font directory; the only Inter in the repo is `.woff2` inside
`brandgeo-next` build output, and FreeType reads `ttf`/`otf`, not `woff2`.

Every sample in `out/` is set in **Segoe UI**, the closest neutral humanist sans
present on every Windows machine. Proportions are similar, but it is not Inter
and the samples are therefore **not typographically final**.

To fix without touching code: drop `Inter-Regular.ttf`, `Inter-Medium.ttf`,
`Inter-SemiBold.ttf` and `Inter-Bold.ttf` into `./fonts/` and re-run. The loader
prefers them automatically. Every run prints what it loaded and whether it was
Inter.

---

## What the data does not currently support

Read this before promising anyone a chart.

**1. There is no time series. Anywhere.**
33 of 35 clients with results have exactly **one** collection day. The two
exceptions are Bucate pe Roate (6 days) and BrandGEO (3 days), and neither is
plottable, because engine coverage and prompt sets changed between every pair of
days.

Worked example. Bucate pe Roate reads 50.0 percent on 2026-07-07 and 78.6
percent on 2026-07-21, which looks like a win and is not a measurement of the
brand. The first figure is 2 answers from Claude alone. The last is 28 answers
from five engines. The 25.0 percent trough on 2026-07-16 is 6 of its 8 answers
coming from Meta AI, which scored 0 of 6 and was retired that same day. Those
six points are a chart of BrandGEO's collection schedule.

In the entire database, only **three** `(prompt, engine)` pairs recur across
more than one day, all on one client, maximum 3 points, all inside a single
3-day window in early July. That is the complete longitudinal content of the
product.

Root cause: `clients.refresh_cadence` defaults to `manual`, so the hourly
`schedule-collections` cron is inert for every tenant. Nothing accumulates until
a cadence is set. **This is a product decision, not a rendering problem, and no
visual work can route around it.**

**2. Research tenants have no brand, so mention rate is meaningless for them.**
The 7 EU tenants carry the sentinel alias `brandgeo research probe zzqx`, which
is deliberately unmatchable; the 20 US tenants have `brand_aliases` set to NULL.
Every one reports `brand_mentioned = 0` across every row. Any chart plotting
research-tenant mention rate would be plotting a measurement artifact and
showing a flat zero. Template 3 therefore reads `competitors_mentioned`, which
is where the real signal lives, and never touches `brand_mentioned`.

**3. Cross-city results are one snapshot, not a pattern over time.**
The 20 US cities were collected on 2026-07-24 and 2026-07-25, once. The EU seven
on 2026-07-10, once. Nothing supports "cities are becoming more fragmented" or
any comparison across dates.

**4. Competitor names are regex-parsed and not deduplicated by entity.**
`competitors_mentioned` comes from `analyseResponse`'s numbered-list regex.
Distinct-brand counts are counts of distinct **strings** after lowercasing and
trimming. "Bay Property Management Group" and "Bay Property Management" would
count twice. The direction of that error is one-way: it **inflates** distinct
brand counts. The headline claim survives it, because "no brand appeared in more
than 4 of 20 answers" is computed from appearances of the most-repeated string
and merging near-duplicates could only raise that ceiling slightly. Treat the
absolute counts as an upper bound and the fragmentation conclusion as sound.

**5. Only 3 clients have enough live engine coverage for a full engine card.**
Bucate pe Roate, BrandGEO and Edyta Andrzejczak. Everyone else has 1 to 4
engines on their single day, mostly because of plan gating. A card for a
1-engine client is a single bar and should not be published as an engine
comparison.

**6. Sentiment, position and citations are untouched here.**
`brand_position` is NULL on every Gemini row in the sample day, so a position
chart would have holes it cannot explain. `citations` is populated too sparsely
to chart. Neither is in scope for these three templates, and neither is ready.

---

## Files

```
data-templates-2026-07-29/
  brandgeo_viz.py            shared tokens, fonts, supersampled canvas, chrome
  engine_comparison.py       template 1
  score_movement.py          template 2, awaiting data
  city_comparison.py         template 3
  data/
    engine-comparison.json   3 real client-days
    city-comparison.json     20 US cities, 17 complete
    score-movement.json      the absence audit, series: []
  out/                       20 rendered PNGs
```
