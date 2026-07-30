# Cross-city 5/5 consensus inventory

Established 2026-07-30 from the per-city findings docs in `docs/*-research-findings.md`
and the published consensus tables in `brandgeo/web/ai-visibility-for-*.html`.

## Why this file exists

Three published pages made mutually contradictory superlative claims about the same
dataset. Chicago claimed "the first fully unanimous result (5 of 5 engines) measured
anywhere in this research program" in four places; Boston claimed to be "the most
5/5-dense city"; Los Angeles repeated Chicago's claim in a cross-link. Chicago, Boston,
Atlanta and six other cities were **all collected 2026-07-24**, so no ordering exists
among them and "first" was not available to any of them.

The root cause was structural, not careless, and it was not a data problem: each city
page was written against its own findings doc, and each findings doc could only compare
itself to the cities measured before it. Every one of those comparisons was true when
written. Published copy is read in the present, though, so a run of locally-true "strongest
yet" claims accumulates into a set that contradicts itself, with nothing to check it
against. This file is that check. **Consult it before writing any cross-program
superlative, and add to it when a new city lands.**

## Counting rule (a naive grep for "5/5" overcounts)

Classify every `5/5` by *what it counts* before comparing pages:

- **Engine consensus** is the only thing comparable here: five engines, one brand, one
  category, one city.
- `ai-visibility-for-rome.html` reads "5/5 Restaurants Meta AI named, in the exact same
  order, in both Italian and English". That is five *restaurants* from *one* engine
  across two languages. It is **not** in this inventory.
- Distinguish **presence** unanimity (all five name the brand) from **rank** unanimity
  (all five also agree on its exact position). Rank unanimity is strictly stronger and
  far rarer. Conflating the two is what made San Francisco's claim false.

## Inventory

Ten cities have produced a full 5/5 engine-consensus result.

| City | Collected | Brand(s) at 5/5 | Category | Presence or rank |
|---|---|---|---|---|
| Atlanta | 2026-07-24 | Manhattan Associates | Logistics/supply chain software | Presence (#1 on 4 of 5) |
| Boston | 2026-07-24 | Mass General Brigham | Hospital systems | **Rank** |
| Boston | 2026-07-24 | Green Ocean Property Management | Property management | Presence |
| Boston | 2026-07-24 | Ropes & Gray LLP | Biotech/life sciences law | Presence |
| Chicago | 2026-07-24 | Landmark Property Management | Property management | Presence (#1 to #4 spread) |
| Houston | 2026-07-24 | Houston Methodist | Hospital systems | **Rank** |
| Minneapolis | 2026-07-24 | Kleinman Property Management | Property management | Presence |
| Philadelphia | 2026-07-24 | Penn Medicine + Jefferson Health | Hospital systems | Presence (Penn #1 on all 5) |
| San Diego | 2026-07-24 | Good Life Property Management | Property management | Presence |
| San Francisco | 2026-07-24 | Kruze Consulting | Startup accounting/tax | **Rank** |
| Washington DC | 2026-07-24 | Brownstein Hyatt Farber Schreck + BGR | Lobbying/government relations | Presence (4 of 5 on rank) |
| Baltimore | 2026-07-25 | Bay Property Management Group | Property management | Presence |

Baltimore's hospital category is deliberately excluded: the findings doc records Johns
Hopkins as "effectively 5/5" via a subsidiary named by the fifth engine, and the
published table reports the category as "4-5/5 each". That is not a clean 5/5 and must
not be counted as one.

## What is and is not sayable

**Not available to any page.** "First", "previous best", "prior", "surpassing", or any
ordinal ("the third city to...") across the 2026-07-24 cohort. Eleven of the twelve rows
above share one collection date. Day-granularity dates are all the record has.

**True as of 2026-07-30, and safe to publish:**

- **Boston is the most 5/5-dense city.** Three brands across three distinct categories.
  Every other city reached 5/5 in exactly one category. Philadelphia and DC each got two
  brands, but both inside a single category. This is a count, not an ordering, so it
  holds. It is the one superlative in this family that survived checking.
- **Three brands reached rank unanimity**, the tightest shape the program measures:
  Houston Methodist, Mass General Brigham, Kruze Consulting.
- **Kruze Consulting is the only rank-unanimous 5/5 outside healthcare.** The "#1"
  qualifier is what makes this true. San Francisco's page had dropped it in the hero and
  findings bar, leaving a claim that Chicago, Boston, Atlanta, Minneapolis, San Diego and
  Baltimore all falsify.
- **Philadelphia and DC are the only two cities** where two brands reached 5/5 in the
  same category, and they tie. DC arguably edges it, with 4 of 5 engines also agreeing on
  rank.
- Anything scoped to a single city's own dataset ("the strongest result in the Phoenix
  dataset") is fine and was left alone.

## Left in place deliberately

- **Immigration-law convergence ordinals** ("the third city where that category broke its
  usual fragmentation", Atlanta's "fourth city (after Chicago, Miami, and Philadelphia)",
  Boston's "sixth city"). These are ordering-dependent in the same way, but unlike the
  5/5 superlatives they are mutually **consistent** and read naturally as counts. Not a
  live contradiction. Worth revisiting if one ever conflicts with another.
- **Detroit vs Minneapolis** both claim the densest *multi-firm* 3/5-and-above cluster
  ("the densest result measured in this program" / "the densest multi-firm consensus
  measured in this program"). This is a different metric from 5/5 consensus and was not
  in scope, but the two pages cannot both be right. **Unresolved, worth its own check.**
- The per-city findings docs in `docs/` are staying exactly as written, by decision on
  2026-07-30. **Their measurements are accurate for the date they were generated and were
  verified against actual searches.** Nothing in them is being called into question here.
  What they could not have was a view of cities measured after them, so their
  *comparative* sentences ("the strongest measured so far") were true against a partial
  picture and read as false now. Only the published pages were corrected. Trust this file
  over their comparative
  claims.
