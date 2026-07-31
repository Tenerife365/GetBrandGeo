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

## Second pass, 2026-07-30: the rest of the pattern

The first pass fixed the 5/5 family and left two items open. Both turned out to be
live contradictions, and sweeping for the *pattern* rather than the instances found
the same defect in four more families. A machine rule now enforces all of it, see
"The rule" below.

### Collection dates: the whole basis for what is sayable

Three buckets, and **ordering exists only between buckets, never inside one**:

| Date | Cities |
|---|---|
| 2026-07-10 | London, Berlin, Madrid, New York, Paris, Rome, Dublin |
| 2026-07-24 | Atlanta, Boston, Chicago, Dallas, Denver, Detroit, Houston, Los Angeles, Miami, Minneapolis, Philadelphia, Phoenix, San Diego, San Francisco, Seattle, Washington DC |
| 2026-07-25 | Baltimore, Charlotte, San Antonio, Tampa |

### The European run was making the same claim twice

All six European pages plus New York are one collection day, and the run used
**four** engines (Claude, Gemini, Meta AI, Perplexity) because ChatGPT errored on
every prompt. A 4/4 there is not comparable to a 5/5 from the 5-engine US runs, so
ranking them against each other was never meaningful in the first place.

- **Madrid** claimed "the most unanimous result of any city tested so far" and "the
  strongest consensus of any category, any city". **False on its own cohort.** Its
  Hilton Madrid Airport result is *presence*, and only 3 of 4 engines per language
  (Gemini returned nothing in Spanish, Meta nothing in English). Paris, same day, is
  strictly stronger.
- **Paris** claimed the cleanest result "anywhere in this research program", four
  times. Qonto genuinely is **rank**-unanimous, 4 of 4 engines at #1 in French, and
  #1 again on both engines that extracted in English. Strongest in its run; not
  checkable against the 5-engine cohort. Scoped to the Paris dataset.
- **Berlin** said it was "the one city in this research program we asked in both
  languages". **False, and contradicted by Paris's own page**, which opens "Like
  Berlin and Madrid". Four cities were bilingual: Berlin, Madrid, Paris, Rome.
- **Rome** claimed the strongest language stability "anywhere in this program". Only
  four cities were ever asked in two languages, so that is the real denominator and
  the claim now names it. Its "worst extraction gap of any city" is gone: the honest
  version is 5 of 8 against New York's 4 of 8, collected the same day.
- **Dublin** claimed "the strongest full-consensus rate of any city ... so far" and
  called Rome "the previous city". Same day. Now scoped to the 2026-07-10 run.

### Detroit vs Minneapolis: RESOLVED, Detroit is right

Counted from the findings docs. Both 5-engine, both 2026-07-24, so it is a clean
comparison of counts.

- **Detroit, automotive and manufacturing law: seven firms at 3/5 or higher.**
- **Minneapolis, corporate law: five firms at 3/5 or higher.**

Detroit's claim stands and is now dated. Minneapolis's identical claim was false and
is corrected to name Detroit. Neither page may say "previous densest" or "surpasses",
because there is no ordering between them.

### The immigration-law tally was wrong on every page that published it

This is the clearest example of why a running tally must never be published. Phoenix
said "5 convergent now outnumber 4 fragmented"; Washington DC said "evening the tally
at 5 versus 5"; Boston said "convergent cities now outnumber fragmented ones across
the full 10-city program". Same collection day, three different answers, and **all
three were stale**, because six further cities tested the category afterwards.

Recounted from every findings doc, 2026-07-30:

- **Converged (3/5+ or 3/4+), 11:** Atlanta, Baltimore, Boston, Charlotte, Chicago,
  Denver, Miami, Philadelphia, Phoenix, San Antonio, Seattle.
- **Fragmented (2/5 or less), 10:** Dallas, Detroit, Houston, Los Angeles,
  Minneapolis, New York, San Diego, San Francisco, Tampa, Washington DC.
- **21 cities tested it.** It is close to an even split, not a majority pattern.

### The ordinal chain is gone

"The third city", "the fourth city", "the fifth city", "the sixth city" across
Philadelphia, Atlanta, Phoenix, Boston, Miami, Chicago, Charlotte and Tampa. The
first pass left these as "mutually consistent". They are not: every one of those
cities shares a collection date, so the sequence was invented, and Charlotte's read
"the fourth city" while naming only two priors. Tampa separately claimed to be "only
the second real estate team ever", which Charlotte's two teams falsify. All replaced
with counts or named sets.

### Other false rankings found by sweeping rather than by reading

- **Dallas** titled itself "Real Estate Agents Are the Most Fragmented Category We've
  Measured", in `<title>`, `og:title` and JSON-LD. Dallas is 0/5, but so are Denver,
  Philadelphia and Seattle. A four-way tie, not a maximum. Retitled.
- **Los Angeles** advertised "the strongest cross-engine consensus we've measured" in
  its meta description while topping out at 4/5, which ten cities beat.
- **Chicago** claimed "the clearest single-rank agreement measured in this research
  program" for 4-of-4 structured engines on Kirkland & Ellis. Houston, Boston and San
  Francisco each have a brand rank-unanimous across 5 of 5. Scoped to Chicago.
- **Four separate pages** (Detroit, Houston, Philadelphia, San Francisco) each ran an
  advice box saying their incumbent bar was "the highest measured anywhere". Mutually
  exclusive by construction. All four scoped to their own city.
- **Baltimore** called itself "one of the strongest overall cities measured in this
  program" with "the densest multi-category strength seen in any city researched".
  Unverifiable against Boston's three 5/5 categories, which is a different metric.
- **blog.html** carried the whole set again as index-card hooks, including Minneapolis
  "the densest multi-brand result we've measured" sitting directly above Detroit
  "going even further". Two adjacent cards contradicting each other on the index page.

## The rule

`scripts/check_published_claims.py` now enforces this. It runs a **second surface
list**, `SUPERLATIVE_SURFACES`, which is the near-inverse of the pricing one: the
pricing rules skip research pages by design, and that exemption is exactly what hid
this for weeks.

Three rules: `corpus-superlative` (a ranking word near a program-scope phrase),
`city-ordinal` ("the Nth city"), and `ageing-superlative` ("so far", "to date",
"previous best").

Two escapes, both of which are the fix rather than the defect:

1. **Page-scoped.** "in the Baltimore dataset" / "in this dataset" names a
   denominator and cannot contradict another page.
2. **Dated.** "as of 2026-07-30" is checkable against this file and honest about
   ageing. Use this for a genuine program-wide count, then **add the finding here**.

Exemptions are documented inline in `SUPERLATIVE_EXEMPT` with a reason each. BG-017
is exempt because it is DOI-archived (Zenodo 10.5281/zenodo.21395598) and enumerates
its own seven-city corpus on the page, so its superlatives have a fixed denominator;
editing the live page would also desynchronise it from the archived record.

**The rule was negative-controlled**, not merely observed to pass: all six original
bad strings (Madrid's, Paris's, Chicago's JSON-LD one, Boston's, a synthetic ordinal
and a synthetic "so far") were injected into a real page one at a time and each was
confirmed to make the checker exit 1, with the file restored byte for byte after.
A green run means something only because the red run was demonstrated.

## Left in place deliberately

> The two items previously listed here as open, the immigration-law ordinals and
> Detroit vs Minneapolis, are both **resolved** in the second pass above. Neither was
> benign: the ordinals were a fabricated sequence inside one collection day, and
> Minneapolis's density claim was simply false against Detroit's seven firms.

- **Third-party-sourced industry claims** (BG-006, BG-008, BG-009, the healthcare and
  real-estate guides, llms-full.txt's law-firm line). "The highest of any industry
  measured" is Siftly's or Ahrefs' denominator, not this program's city corpus, so no
  city page can contradict it. Deleting them would falsify a correct citation.
- **BG-017**, for the reason above.
- **Historical engine lineups.** The 2026-07-10 pages record what Meta AI answered
  before it was retired. That is a dated measurement, not drift, and it stays.
- The per-city findings docs in `docs/` are staying exactly as written, by decision on
  2026-07-30. **Their measurements are accurate for the date they were generated and were
  verified against actual searches.** Nothing in them is being called into question here.
  What they could not have was a view of cities measured after them, so their
  *comparative* sentences ("the strongest measured so far", Dublin's "the mildest
  occurrence of this gap seen so far") were true against a partial picture and read as
  false now. Only the published pages were corrected, and that stays the rule. Trust this
  file over their comparative claims.
