# Daily article topic queue

Read by the scheduled routine `brandgeo-daily-article`, which publishes one article a
day from data BrandGEO has already collected. Ruled by Constantin on 2026-10-28
("Mergem pe varianta 1"): one article a day, committed and pushed automatically.

## How the routine uses this file

1. Take the first topic whose status is `ready`.
2. Run its SQL, read-only, against `duiyifepitvugyulobqm`. Never collect, never call an engine.
3. If the numbers do not carry a clear finding, set the topic to `dropped` with one line
   saying why, and stop for the day. A dull day is better than a padded article.
4. Otherwise write the article, record the queries and numbers in
   `data/<slug>-<topic-key>-<date>.md`, set the status to `published <slug> <date>`.

## Rules every topic inherits

- Default basis: the 20 US city accounts, clients 28 to 47, 5 engines, `status = 'ok'`,
  591 answers. Prompt type is the prompt's order inside its client: 1 personal injury,
  2 real estate agents, 3 property management, 4 immigration, 5 and 6 city-specific.
- Text is `response_text`; sources are `citations` (jsonb). Say which one a count used.
- Count what engines said. Never claim why they chose it or that it is a ranking factor.
- Superlatives across cities or across the program must pass
  `docs/research/cross-city-consensus-inventory-2026-07-30.md`. The cities were collected
  as a cohort, so "first" is never available.
- No person's name in any article or committed file. Firms named after people are
  reported as counts, not by name. Name a company only when it is clearly a company
  and the finding needs it.
- No em or en dashes. No AI buzzwords. No hand-copied HTML.
- Check the topic is not already covered: BG-016 (cross-engine consensus),
  BG-020 (cross-city consensus), BG-027 to BG-034 (bilingual series), BG-106 (platforms).

## Queue

| # | Key | Status | Question the article answers |
|---|---|---|---|
| 1 | platforms | published bg-106 2026-10-28 | Which third-party platforms engines name for local professionals |
| 2 | list-length | ready | How many firms does each engine name per answer, by profession |
| 3 | sources | ready | Which kinds of sites engines cite as sources: firm sites, directories, news, government |
| 4 | no-firm | ready | How often an engine answers a "best X in city" question without naming a single firm |
| 5 | ratings | ready | How often answers quote star ratings or review counts, by engine |
| 6 | nap | ready | How often answers give a phone number, street address or website for the firms they name |
| 7 | fees | ready | What fees engines quote: contingency percentages, management fees, commissions |
| 8 | hedges | ready | How often answers tell the buyer to verify, check reviews or consult before choosing |
| 9 | credentials | ready | Which credentials engines attach to firms: years in business, board certification, awards |
| 10 | national-vs-local | ready | National brands versus local firms in property management and personal injury answers |
| 11 | agents-vs-brokerages | ready | Whether real estate answers recommend individual agents or brokerages |
| 12 | city-economy | ready | Which city-specific questions produced the most and fewest named businesses |
| 13 | dates | ready | How often answers mention a year or "as of", a sign of how current they claim to be |
| 14 | answer-length | ready | Answer length by engine, and whether longer answers name more firms |
| 15 | bilingual-followup | needs-check | A bilingual angle not covered by BG-027 to BG-034; read those first, drop if covered |

## Briefs

### 2 list-length
`competitors_mentioned` is a JSON string of `[{pos, name}]`. Count array length per row:
`coalesce(jsonb_array_length(nullif(competitors_mentioned,'')::jsonb),0)`. Report
average and median per engine and per question type. Caveat: the parser reads numbered
lists, so prose-only answers undercount. Say so in the method callout.

### 3 sources
`citations` is null for engines that store no sources. First count non-null citations
per engine and report the scope honestly. Classify cited domains with a CASE on the host:
directory (the BG-106 platform list), government (`.gov`), news, the firm's own site
(everything else). Report shares per engine. Drop if fewer than three engines carry citations.

### 4 no-firm
Rows where `competitors_mentioned` is empty or `[]`. Read 10 of them by hand before
publishing to check they are real non-answers and not parser misses; record what you
found in the data note.

### 5 ratings
Regex on `response_text`: `\d(\.\d)?\s*(stars?|/5|out of 5)` and `\d[\d,]*\+?\s*reviews`.
Per engine and question type.

### 6 nap
Regex for US phone numbers `\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}`, street addresses
`\d+ [A-Za-z0-9 .]+ (st|street|ave|avenue|blvd|road|rd|suite)\M`, and bare websites.
Per engine. Never print a phone number or address in the article.

### 7 fees
Regex for percentages near fee words: `(contingenc|fee|commission|management)[^.]{0,60}\d{1,2}(\.\d)?\s?%`.
Report the ranges engines quote per profession. Do not judge whether a quoted fee is
correct unless a public source is cited in the article.

### 8 hedges
Regex: `verify|check (their )?reviews|consult|do your own research|schedule a consultation|interview`.
Per engine.

### 9 credentials
Regex families: years in business (`\d+\+? years`), board certified, AV Preeminent,
Million Dollar Advocates, Top 100, Inc. 5000, licensed. Per question type.

### 10 national-vs-local
Count how many cities each named firm appears in, from `competitors_mentioned`.
A firm in 5 or more cities is national. Report the share of named firms that are
national per question type. Name a national firm only if it is clearly a company brand.

### 11 agents-vs-brokerages
Real estate rows only (rn = 2). Classify named entries: contains Realty, Realtors,
Group, Team, Properties, Homes, Compass, Keller Williams, Coldwell, RE/MAX, Sotheby,
eXp as brokerage or team; the rest as individual. Read 20 by hand to check the split.
Never print an agent's name.

### 12 city-economy
rn 5 and 6. Count named businesses per prompt; rank the prompts. Prompt text may be
quoted, city names may be used.

### 13 dates
Regex `\m20(1\d|2[0-6])\M` and `as of`. Per engine. Report the most common years.

### 14 answer-length
`length(response_text)` per engine, then correlation with list length from topic 2.
Caveat: Claude collection streamed and aborted at about 2,500 characters, so its
lengths are capped. Check `max(length)` per engine and state the cap.

### 15 bilingual-followup
The bilingual dataset is described in the BG-027 to BG-034 sources in
`scripts/articles_content.py`. Read all eight articles first. Publish only an angle
none of them covers.
