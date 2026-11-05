# BG-112 data record: firm facts in AI answers (2026-11-05)

Topic 9 `credentials` from `topics.md`. Read only; SELECT and WITH only. No
person's name, firm name, address or phone number is recorded here: the
repository is public.

## Basis

- Clients 28 to 47 (20 US city research clients), `ai_results.status = 'ok'`,
  engines chatgpt, claude, gemini, google_ai, perplexity: 591 answers
  (chatgpt 120, claude 120, gemini 120, google_ai 111, perplexity 120).
- Prompt type by `row_number() over (partition by client_id order by id)`:
  1 personal injury, 2 real estate, 3 property management, 4 immigration,
  5 and 6 city-specific.
- Text column `response_text`, backslashes stripped first.
- Collection ran 2026-07-24 and 2026-07-25. Stored answer length after the
  backslash strip, median and maximum characters: chatgpt 4,722 and 10,000;
  claude 3,098 and 3,780; gemini 3,248 and 7,723; google_ai 9,742 and 9,949;
  perplexity 1,276 and 2,581.

## Method

Five families of plain fact, each read by hand in samples (about 250 matched
passages in total) and tightened. The patterns are in the query below; the
en dash in the price-range strip is passed as `chr(8211)` so this file holds
none.

- tenure = yrs (a number followed by "years", after stripping award streaks,
  ranking tables, filing deadlines and "last N years") or founded (founded,
  established or est. plus a year; or a tenure verb plus "since" and a year).
- track = dollars (a figure in millions or billions inside a result-word
  window, after stripping price ranges and median, budget and revenue
  figures) or volume (a count of units, doors, properties, homes,
  transactions, sales, closings, cases, clients, families, deals, verdicts).
- boardcert: "board certified", after stripping the checklist question
  "are you board certified".
- owned: family, locally, veteran, woman, women, Black, minority or employee
  owned, after stripping clients described as family-owned businesses.
- former: former prosecutor, judge, officer, adjuster, insurance, USCIS, INS,
  ICE, attorney general or clerk.
- Award names counted separately, not part of "any fact": AV rating, Million
  Dollar Advocates, "Top 100", Inc. 5000. "Top 1%" style claims also counted
  separately.

Hand-read precision before the final tightening: years 41 of 45, founding
"since" arm 18 of 20, board certified 18 of 20, ownership 19 of 20, dollars
18 of 24 (then tightened with the result-word window and the price-range
strip), counts 24 of 26, former officials 11 of 12, Top 100 9 of 12, AV
rating 10 of 10, top N% 10 of 10.

Dropped while tightening:

- `licensed` as a family: 11 of 20 read were credentials; the rest were
  advice to check a license (the subject of BG-111), licensed technicians or
  nurses.
- bare "since YYYY": caught honors (recognized, voted or listed since a year).
- "N years ranked", "N years in a row", "N years running": ranking tables
  and award streaks. "N years from", "N years to file": filing deadlines.
- Dollar figures outside a result-word window: the 20 read were lobbying
  revenue, price ranges and deal sizes, with two brokerage volume lists lost.
- A URL path containing "practice", a company name containing "Doors
  Property", and review counts of the form "rating from over N clients".

Not counted: vaguer wording such as "decades of experience" (79 answers used
it, 23 of them with no numeric years match). Known limits: Claude's stored
answers are cut short, Google AI Mode answers include text quoted from the
pages it cites, and no fact was checked for truth.

## Query

```sql
with p as (
  select id, client_id, row_number() over (partition by client_id order by id) rn
  from prompts where client_id between 28 and 47
), r as (
  select a.id, a.llm, a.client_id, p.rn, replace(a.response_text, chr(92), '') t
  from ai_results a join p on p.id = a.prompt_id
  where a.client_id between 28 and 47 and a.status = 'ok'
), f as (
  select id, llm, client_id, least(rn,5) q,
   regexp_replace(t, '(last|past|next|within|recogni[sz]ed for|voted[^.\n]{0,60}for)\s+\d+\s?\+?\s*years|\d+\s?\+?\s*years\s+(ranked|in a row|running|straight|consecutive|from|by\M|to file)', ' ', 'gi') ~* '\d+\s?\+?\s*years' yrs,
   (t ~* '(founded|established|\mest\.?)\s+(since\s+)?(in\s+)?(1[89]|20)\d\d'
     or regexp_replace(t, '(recognition|recogni[sz]ed)\s+since', ' ', 'gi') ~* '(serving|served|operating|operated|in business|\mpractic\w+|assisting|helping|representing|represented|working|been around|open|active)[^.\n/)]{0,60}since\s+(1[89]|20)\d\d') founded,
   (regexp_replace(t, '\$\s?\d[\d,.]*\s?[km]?\s?(-|' || chr(8211) || '|to)\s?\$\s?\d[\d,.]*\s?[km]\+?|(median|average|avg|priced?|prices|price range|budget|revenue|under|above|below)[^.\n$]{0,30}\$\s?\d[\d,.]*\s?(million|billion|m\M|b\M)', ' ', 'gi')
      ~* ('(recover\w*|won\M|wins?\M|winning|secur\w+|obtain\w*|verdicts?|settlements?|award(ed)?\M|sold\M|sales\M|volume|closed|netted|results)[^\n]{0,80}\$\s?\d[\d,.]*\s?\+?\s?(million|billion|m\M|b\M|mm\M)'
        || '|\$\s?\d[\d,.]*\s?\+?\s?(million|billion|m\M|b\M|mm\M)\+?[^\n]{0,50}(recover\w*|won\M|verdicts?|settlements?|sold\M|sales\M|volume|closed)')) dollars,
   regexp_replace(t, '(rating from|reviews from|displaying)\s+(over\s+|more than\s+)?\d[\d,]*|\d+ doors property', ' ', 'gi') ~* '(?<![\d,.$])(?!20[12]\d\s)\d[\d,]+\+?\s*(rental\s+|buyer\s+|closed\s+|residential\s+|successful\s+|homes\s+)?(units|doors|properties|homes|transactions|sales|closings|cases|clients|families|deals|verdicts|bought)' volume,
   regexp_replace(t, '(are|is)\s+(you|they|the (lawyer|attorney))\W{0,6}board[- ]certified', ' ', 'gi') ~* 'board[- ]certified' boardcert,
   regexp_replace(t, 'family[- ]owned (businesses|companies|business owners)', ' ', 'gi') ~* '(family|locally|veteran|woman|women|black|minority|employee)[- ]owned' owned,
   t ~* 'former (\w+ ){0,3}(prosecutors?|judges?|officers?|adjusters?|insurance|uscis|ins\M|ice\M|attorney general|clerk)' former,
   t ~* 'av[- ]?preeminent|av[- ]rated|av rating' avp,
   t ~* 'million dollar advocates' mda,
   t ~* 'top 100' top100,
   t ~* 'inc\.? ?5000' inc5000,
   t ~* 'top\s+(1|1\.5|2|3|5)\s?%' toppct
  from r
), g as (
  select *, (yrs or founded) tenure, (dollars or volume) track, (avp or mda or top100 or inc5000) badges,
    ((yrs or founded)::int + (dollars or volume)::int + boardcert::int + owned::int + former::int) nfam
  from f
)
select grouping(q) gq, grouping(llm) gl, q, llm, count(*) n,
 sum(yrs::int) yrs, sum(founded::int) founded, sum(tenure::int) tenure,
 sum(dollars::int) dollars, sum(volume::int) volume, sum(track::int) track,
 sum(boardcert::int) boardcert, sum(owned::int) owned, sum(former::int) former,
 sum(avp::int) avp, sum(mda::int) mda, sum(top100::int) top100, sum(inc5000::int) inc5000, sum(badges::int) badges, sum(toppct::int) toppct,
 sum((nfam>=1)::int) any_fact, sum((nfam>=2)::int) two_plus, sum((nfam>=3)::int) three_plus,
 sum((badges and nfam=0)::int) badge_only,
 count(distinct client_id) filter (where tenure) tenure_cities,
 count(distinct client_id) filter (where nfam>=1) any_cities
from g group by grouping sets ((q),(llm),()) order by 1,2,3,4;
```

## Results, all 591 answers

| Measure | Answers |
|---|---|
| Any fact (at least one of the five families) | 329 |
| Two or more families | 162 |
| Three or more families | 31 |
| Tenure | 269 (in all 20 cities) |
| of which a number of years | 239 |
| of which a founding or "since" year | 110 |
| Track record | 145 |
| of which a dollar figure | 88 |
| of which a count | 93 |
| Ownership | 58 |
| Board certified | 42 |
| Former official | 11 |
| AV rating | 20 |
| "Top 100" | 21 |
| Million Dollar Advocates | 8 |
| Inc. 5000 | 2 |
| Any of the four award names | 45 |
| An award name with no fact from the five families | 7 |
| "Top 1%" style claim | 34 |

## Results by question type

| Question | n | tenure | dollars | counts | track | board cert | owned | former | any fact | 2+ |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 personal injury | 98 | 58 | 51 | 14 | 53 | 14 | 4 | 2 | 67 | 48 |
| 2 real estate | 98 | 40 | 32 | 46 | 54 | 1 | 5 | 0 | 63 | 34 |
| 3 property management | 99 | 55 | 0 | 28 | 28 | 0 | 32 | 0 | 67 | 39 |
| 4 immigration | 98 | 53 | 0 | 1 | 1 | 24 | 3 | 6 | 59 | 24 |
| 5 and 6 city-specific | 198 | 63 | 5 | 4 | 9 | 3 | 14 | 3 | 73 | 17 |
| ALL | 591 | 269 | 88 | 93 | 145 | 42 | 58 | 11 | 329 | 162 |

Award names by question: personal injury AV 15, Million Dollar Advocates 8,
Top 100 9, Inc. 5000 1 (any 27); real estate Top 100 2, Inc. 5000 1 (any 3),
top N% 25; property management Top 100 3; immigration AV 4, top N% 5;
city-specific AV 1, Top 100 7 (any 8), top N% 2.

## Results by engine

| Engine | n | yrs | founded | tenure | dollars | counts | track | board cert | owned | former | awards | top N% | any fact | 2+ | 3+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude | 120 | 69 | 35 | 80 | 31 | 27 | 46 | 11 | 9 | 3 | 14 | 21 | 96 | 45 | 7 |
| google_ai | 111 | 68 | 34 | 73 | 26 | 20 | 37 | 11 | 23 | 2 | 15 | 5 | 87 | 46 | 12 |
| gemini | 120 | 75 | 34 | 84 | 20 | 29 | 40 | 10 | 16 | 4 | 13 | 6 | 89 | 53 | 11 |
| chatgpt | 120 | 21 | 7 | 26 | 9 | 16 | 19 | 10 | 9 | 2 | 2 | 2 | 48 | 17 | 1 |
| perplexity | 120 | 6 | 0 | 6 | 2 | 1 | 3 | 0 | 1 | 0 | 1 | 0 | 9 | 1 | 0 |

Any fact on the four professional questions (types 1 to 4): claude 75 of 80,
gemini 71 of 80, google_ai 63 of 73, chatgpt 38 of 80, perplexity 9 of 80.
On the city-specific questions: google_ai 24 of 38, claude 21 of 40, gemini
18 of 40, chatgpt 10 of 40, perplexity 0 of 40.

Personal injury dollar figures by engine: claude 18 of 20, google_ai 15 of
18, gemini 13 of 20, chatgpt 3 of 20, perplexity 2 of 20 (51). 29 of the 51
included a figure in billions.

Real estate counts by engine: claude 15 of 20, gemini 13 of 20, chatgpt 9 of
20, google_ai 9 of 18, perplexity 0 of 20 (46). Real estate top N% by
engine: claude 12, gemini 6, google_ai 5, chatgpt 2 (25).

## Supporting queries (same CTEs and patterns)

Year figures, from
`regexp_matches(<stripped text>, '(\d+)\s?\+?\s*years', 'gi')`, distinct
(answer, number) pairs: 458 pairs in 239 answers, median 30. Under 10: 9.
10 to 19: 73. 20 to 29: 130. 30 to 49: 165. 50 and over: 81. 100 and over:
29 figures in 28 answers, 22 of which also contain "combined" or
"collective". Answers with "combined" or "collective" within 40 characters
of a years figure: 48.

Board certified by city (42 answers, 9 cities): Houston 8, Dallas 7, San
Antonio 7, Miami 6, Tampa 5, Charlotte 5, San Diego 2, Atlanta 1, Washington
DC 1. The study's Texas cities are Houston, Dallas and San Antonio; its
Florida cities are Miami and Tampa: 33 of 42. Board certified answers that
also contain "Texas Board of Legal Specialization": 13 (Houston 6, Dallas 5,
San Antonio 2). That also contain "Florida Bar": 8 (Miami 4, Tampa 4).

Property management ownership wording (32 answers): family owned 17,
locally owned 13, veteran owned 5, woman, women, Black or minority owned 4.
An answer can carry more than one.

Cross references used in the article: Super Lawyers in 125 answers and a
third-party platform in 390 of 591 answers (BG-106 record); chatgpt vetting
advice in 83 of 120 answers and perplexity "no search results" in 19 answers
(BG-111 record).

No fact was checked for truth.
