# LinkedIn distribution schedule, BG-027 series plus BG-021

Nine research pieces, four assets each, one per week. Every asset is written and
lives in this folder, in the subfolder named for its article.

> **To actually schedule the series, use `SCHEDULING-SHEET.md`.** It is the
> operational list: what to queue now, what has to be done live, which image goes
> with which post, and the full date table. This file explains the reasoning
> behind the plan; that one is the checklist.

## The four assets, and why each exists

| # | Asset | Channel | When | Purpose |
|---|---|---|---|---|
| 01 | Feed post | **Company page** | Monday am | Reach. Link in first comment so LinkedIn does not throttle it. |
| 02 | Article | **Company page**, native Article composer | Wednesday am | Depth, on-platform. Native Articles are not throttled for keeping readers on LinkedIn. |
| 03 | Article announcement post | **Company page** | Wednesday, right after 02 goes live | An Article does not reach the feed by itself. This is what puts it there. |
| 04 | Founder repost | **Constantin's personal profile** | Wednesday, immediately after 03 | Personal network distribution. Different voice: first person, why I care, not a summary. |

Assets 02, 03 and 04 all fire on the same Wednesday. Publish the Article first,
because 03 and 04 both need its live URL.

## Why the founder repost is a separate asset and not a reshare

A bare reshare adds nothing to the feed and LinkedIn treats it as low-value. 04 is
written as a **repost with commentary**, in a voice the company page cannot use:
first person, a reason for caring, and an opinion. It should never read as a
second copy of 03.

## Schedule

Dates are real weekdays. Morning slot means 08:00 to 09:30 CET, which is when this
audience is on LinkedIn.

| Week | Mon: feed post | Wed: article + announcement + founder repost | Article |
|---|---|---|---|
| 0 | **2026-08-02, POSTED** | **2026-08-05** | BG-027, the umbrella study |
| 1 | 2026-08-10 | 2026-08-12 | BG-028, Berlin, German vs English |
| 2 | 2026-08-17 | 2026-08-19 | BG-029, Madrid, the smallest gap |
| 3 | 2026-08-24 | 2026-08-26 | BG-030, Paris, independents vs global banks |
| 4 | 2026-08-31 | 2026-09-02 | BG-031, Rome, trattoria vs three-star |
| 5 | 2026-09-07 | 2026-09-09 | BG-032, which engine changes most |
| 6 | 2026-09-14 | 2026-09-16 | BG-033, how to test your own brand |
| 7 | 2026-09-21 | 2026-09-23 | BG-034, the nine-item checklist |
| 8 | 2026-09-28 | 2026-09-30 | BG-021, retrieval, not engine count |

**The order is deliberate and should not be shuffled casually.** BG-027 is the
umbrella study every other piece refers back to, so it goes first. BG-028 to
BG-031 are the four city cases, strongest gap first (Berlin 8.9%) and mildest
last (Madrid 23.2% is the counter-example that proves the rule, so it reads
better second than fourth). BG-032 generalises across engines. BG-033 and BG-034
convert the research into something the reader can do, which is where the audit
CTA earns most. BG-021 is the one piece that is not part of the bilingual series
at all, which is why it sits at the end: it is a standalone product-positioning
piece and it is the safe one to move if a week slips.

## If a week slips

Move BG-021, not a city. The four city pieces reference each other and BG-027,
and BG-033 and BG-034 assume the reader has met the finding. BG-021 references
nothing in this series.

## Rules that apply to every asset here

- **Link in first comment for feed posts (01), not in the body.** Costs the
  preview card, buys reach. Attach the OG card natively instead.
- **Article covers.** The OG cards are 1200x630, LinkedIn Article covers want
  1920x1080. They upload fine but crop about 7% off the width. Check the preview
  for text near the edges. BG-021 is the exception: its hero is 1600x900, ratio
  1.778, which is exactly LinkedIn's cover ratio, so it crops nothing. All nine
  images were measured on 2026-08-02 and all nine exist.
- **No em dashes, no en dashes, no AI-tell vocabulary.** Every file here has been
  checked programmatically.
- **CTAs point at `https://getbrandgeo.com/#free-audit`**, the instant audit. Not
  `/#contact`, which is the 48-hour manual form. The nine older kits in
  `brandgeo/BG-0NN-linkedin-asset.md` still use the old CTA and need correcting
  before any of them is reposted.
- **Every figure comes from the published article.** Nothing in these assets was
  recalculated. Each file carries a verification note saying where its numbers
  came from.

## Asset locations

Everything for week N lives in `docs/growth/linkedin-series-2026-08/BG-0NN/`.

BG-027 is the exception, because it was written before this folder existed:

- 01 feed post: `brandgeo/BG-027-linkedin-asset.md` (already posted 2026-08-02)
- 02 article: `docs/linkedin-article-bg-027-2026-08-02.md`
- 03 and 04: in `BG-027/` here, with the rest.

## Status

All 36 assets are written and verified. Verified means, for every file: read as
UTF-8 and checked for em and en dashes outside the line-1 internal title (0
violations across 34 files), CTA target checked (no `/#contact` anywhere), and
headline figures grepped back against the source article in `brandgeo/web/`.

| Article | 01 post | 02 article | 03 announcement | 04 founder repost |
|---|---|---|---|---|
| BG-027 | written, **POSTED 2026-08-02** | written, **PUBLISHED** | written | written |
| BG-028 | written | written | written | written |
| BG-029 | written | written | written | written |
| BG-030 | written | written | written | written |
| BG-031 | written | written | written | written |
| BG-032 | written | written | written | written |
| BG-033 | written | written | written | written |
| BG-034 | written | written | written | written |
| BG-021 | written | written | written | written |

## Two corrections applied on review, do not undo them

**BG-032 asset 04** said "none of the four engines we could rank". Three were
ranked, not four. `bg-032.html` states Gemini returned parseable names in only
three comparable pairs against 16 each for Claude and Perplexity, and that "three
pairs is not enough to rank an engine, so its figure is published but not
ranked". Ranked: Claude, Perplexity, Meta AI. Four **answered**, three were
**rankable**, and every other file in this series uses those two words correctly.

**BG-021 assets 01 and 02** originally reproduced the plan ladder as published,
including "Free: ChatGPT". That has been false since 31 July 2026, when ruling
1b moved the free tier to Gemini. The ladder in asset 02 is now taken from
`planConfig.ts` instead, and Radar is added because it did not exist when the
article was written. This is the only place in this folder where an asset
deliberately departs from its source article, and the reason is that the source
article is wrong.

## Open site defect this surfaced

`brandgeo/web/bg-021-retrieval-not-engine-count.html` contradicts itself. Its
visible body still reads "Free: ChatGPT"; its own JSON-LD already reads "Free
includes Gemini; Radar includes Gemini and Claude; Essentials includes ChatGPT,
Gemini and Claude." It is the **only** page on the marketing site with the stale
claim in visible text, and no page carries it in structured data. Until the
visible ladder is corrected, do not quote that section anywhere.
