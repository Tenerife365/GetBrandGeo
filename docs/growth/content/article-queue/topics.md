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
- Second basis, allowed since 2026-11-06 (Constantin: "A and B"): the 2026-07-10 research
  accounts, clients 10 to 16, 255 ok answers. London (10), New York (13) and Dublin (16)
  ask 8 English questions each; London and Dublin ask the same 8. Berlin (11), Madrid (12),
  Paris (14) and Rome (15) are the bilingual pairs (odd `position` local language, even
  English). Engines: claude, gemini, meta, perplexity on all; chatgpt only on London (it
  errored everywhere else that day, so report it as absent, never as zero). Meta was
  retired on 2026-07-16; its rows stay and are reported as a past engine. Never pool this
  basis with clients 28 to 47 into one percentage: different date, engines and questions.
  Before using it, read BG-016, BG-017, the seven `ai-visibility-for-<city>.html` pages and
  BG-027 to BG-034; they already cover this data.
- Never use `competitors_mentioned` or `citations` (see topics 2 and 3). Count from
  `response_text` with a pattern you first check on 20 rows read by hand, and use word
  boundaries (`\m...\M`) so a brand like Associa does not match "association".
- Stored text is capped: chatgpt and google_ai at 10,000 characters (google_ai's median
  answer is 9,821, so most of its answers are cut), claude at about 3,800 (streamed and
  aborted). A count over text is a lower bound for those engines; say so.
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
| 2 | list-length | dropped 2026-10-29: competitors_mentioned is not a reliable firm count (stored lists are capped at 10, and 90 of 162 rows stored as empty carry 3 or more bold names, e.g. Gemini and Perplexity bullet lists the parser missed) | How many firms does each engine name per answer, by profession |
| 3 | sources | dropped 2026-10-30: `citations` is null on all 591 rows for all 5 engines; links inside `response_text` exist for only 2 engines (ChatGPT 119 of 120, Google AI Mode 111 of 111; Claude 7, Gemini 0, Perplexity 0), below the brief's three-engine floor | Which kinds of sites engines cite as sources: firm sites, directories, news, government |
| 4 | no-firm | published bg-107 2026-10-31 | How often an engine answers a "best X in city" question without naming a single firm |
| 5 | ratings | published bg-108 2026-11-01 | How often answers quote star ratings or review counts, by engine |
| 6 | nap | published bg-109 2026-11-02 | How often answers give a phone number, street address or website for the firms they name |
| 7 | fees | published bg-110 2026-11-03 | What fees engines quote: contingency percentages, management fees, commissions |
| 8 | hedges | published bg-111 2026-11-04 | How often answers tell the buyer to verify, check reviews or consult before choosing |
| 9 | credentials | published bg-112 2026-11-05 | Which credentials engines attach to firms: years in business, board certification, awards |
| 10 | national-vs-local | published bg-113 2026-11-06 | How often property management answers name a national brand next to local firms |
| 11 | agents-vs-brokerages | ready (brief reworked 2026-11-06 to count from text) | Which national brokerage brands real estate answers name, and how that differs by engine |
| 12 | city-economy | dropped 2026-11-06: counting named businesses needs `competitors_mentioned` (unreliable) or bold markup, and google_ai answers carry no bold at all (0.0 per answer), so no count works across engines | Which city-specific questions produced the most and fewest named businesses |
| 13 | dates | ready | How often answers mention a year or "as of", a sign of how current they claim to be |
| 14 | answer-length | dropped 2026-11-06: stored text is capped (chatgpt and google_ai at 10,000 characters, google_ai median 9,821; claude at about 3,800), so length measures the cap, not the answer; the list-length side needed topic 2, also dropped | Answer length by engine, and whether longer answers name more firms |
| 15 | bilingual-followup | held 2026-11-06: ruling owed by Constantin. 31 of 63 English questions were answered in the local language, which touches how BG-027 to BG-034 read; see the brief | A bilingual angle not covered by BG-027 to BG-034; read those first, drop if covered |
| 16 | london-vs-dublin | ready (pre-checked 2026-11-06, banking and software measured, law and advice still to read by hand) | London and Dublin were asked the same 8 questions: where the engines named the same companies and where they did not |
| 17 | immigration-languages | ready (pre-checked 2026-11-06) | How often immigration answers say which languages a firm works in, by engine |
| 18 | aila | ready (pre-checked 2026-11-06) | How often immigration answers name AILA, and whether as a credential or as a place to check a lawyer |
| 19 | free-consultation | dropped 2026-11-06: BG-110 already reports it (63 answers mention a free consultation); personal injury alone gives 61 of 98, no new angle | How often answers say the first consultation is free |
| 20 | disclaimers | dropped 2026-11-06: 1 answer of 591 carries a "not legal advice" style disclaimer, nothing to report | How often answers carry a legal or financial disclaimer |
| 21 | notario-warnings | dropped 2026-11-06: 9 of 98 immigration answers warn about notarios or scams, too few to split by engine | How often immigration answers warn about notario fraud |
| 22 | closing-offers | dropped 2026-11-06: 116 answers end with an offer to help further, but perplexity alone is 70 and gemini and google_ai are 0, the ends of capped answers are cut, and the perplexity side overlaps BG-107 | How often answers end by offering more help |
| 23 | legal-aid | dropped 2026-11-06: 22 immigration answers name legal aid or nonprofit options, partly reported in BG-109, too thin alone | How often immigration answers point to free or low cost legal help |

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
Warning found 2026-10-29 while dropping topic 2: of 162 rows with an empty
`competitors_mentioned`, 90 carry 3 or more bold names in `response_text`, so most
"empty" rows are parser misses. Topics 4, 10 and 14 must count firms from the text,
not from that field, or be dropped.
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
Reworked 2026-11-06: the old brief counted firms from `competitors_mentioned`, which is not
allowed. Property management rows only (rn = 3), counted from `response_text`.
Personal injury is out: its national firms are named after people, and the rule above
lets those be reported only as counts, which leaves nothing to say per brand.
Pattern, with word boundaries: `\m(greystar|firstservice|associa|mynd|evernest|real property management|renters warehouse|invitation homes|progress residential|belong)\M`.
Report per engine and per city: share of answers naming at least one national brand, and
which brands come up. Read 20 matching rows by hand to remove false hits (Associa against
"association", Belong against the verb, Pinnacle left out on purpose because the word is
common). Drop if fewer than a third of the answers name a national brand once the false
hits are removed.
Pre-check 2026-11-06, with word boundaries (read only, replaces the earlier first pass
of 77 of 99): 66 of 99 answers name at least one national brand. Per engine: chatgpt 10
of 20, claude 12 of 20, gemini 14 of 20, google_ai 14 of 19, perplexity 16 of 20. Brands
by answers: Real Property Management 42, Mynd 20, Evernest 17, Belong 10, FirstService 6,
Greystar 3, Associa 2, Renters Warehouse 2. Second finding: a national brand's own domain
is linked in 17 answers, 10 of them google_ai; belonghome.com or mynd.co in 10 (8 of them
google_ai). Clears the one third bar. Still owed by the routine: the 20 row hand read for
false hits, and the per city split. Rests on `response_text` only.

### 11 agents-vs-brokerages
Reworked 2026-11-06 to count from `response_text`. Real estate rows only (rn = 2).
Pattern, with word boundaries, one count per brand: Compass, Keller Williams, Coldwell
Banker, RE/MAX (`re/?max`), Sotheby, eXp Realty, Redfin, Berkshire Hathaway, Century 21,
Douglas Elliman, Howard Hanna, Weichert. Report per engine: share of answers naming at
least one national brokerage brand, and the brands. Read 20 rows by hand: "compass" can be
an ordinary word, and the check must confirm the brand is recommended, not just mentioned.
Never print an agent's name; agent teams named after people are counted, not named.
First pass 2026-11-06, without word boundaries and not yet checked by hand: 78 of 98
answers named at least one; chatgpt 18 of 20, claude 19, gemini 20, google_ai 17,
perplexity only 4 of 20. That engine gap is the likely headline, if it survives the hand
read. Drop if it does not.
Pre-check 2026-11-06, with word boundaries: 77 of 98 answers name at least one national
brokerage brand. Per engine: chatgpt 18 of 20, claude 19 of 20, gemini 20 of 20,
google_ai 16 of 18, perplexity 4 of 20. Brands by answers: Compass 38, Keller Williams 37,
RE/MAX 19, eXp 17, Coldwell Banker 16, Sotheby's 16, Redfin 15, Berkshire Hathaway 12,
Douglas Elliman 7, Century 21 2. Compass was read by hand: always the brokerage, usually
as the affiliation of a named agent, so the article says "named as an agent's brokerage"
where that is what the text shows. The perplexity gap comes from short answers and
refusals, the BG-107 finding; cite BG-107 for it rather than restating it as new. Listing
platforms (Zillow and similar) appear in 51 answers, which overlaps BG-106; mention, do not
headline. Clear enough to publish. Rests on `response_text` only.

### 12 city-economy
Dropped 2026-11-06, see the queue table.

### 13 dates
Regex `\m20(1\d|2[0-6])\M` and `as of`. Per engine. Report the most common years.
Pre-check 2026-11-06 (strip URLs first with
`regexp_replace(t,'(https?://|www\.)\S+',' ','g')` so years inside links do not count):
a year appears in 296 of 591 answers. A year in the first 400 characters: claude 37 of
120, against chatgpt 10, gemini 4, google_ai 9, perplexity 13. Claude opens with a
"2025 to 2026" style range in 12 answers; the other engines do so in 0 or 1. Claude cites
2025 in 61 answers, while chatgpt and google_ai cite 2026 in 59 and 60, mostly as "2026"
rankings or lists. "as of" appears in 11 answers. Warnings that the information may be out
of date: 0. Clear enough to publish. Do not claim why Claude differs (it had a web search
tool with one search per answer, `_collect.js:465`, so training data is not the whole
story). Award years ("2025 Best Lawyers") overlap BG-112; count them, do not headline
them. Claude text is capped at about 3,800 characters, so its counts are lower bounds.
Rests on `response_text` only.

### 14 answer-length
Dropped 2026-11-06, see the queue table. Measured that day on clients 28 to 47:
max length chatgpt 10,000, google_ai 10,000 (median 9,821), claude 3,780, gemini 7,723,
perplexity 2,581.

### 15 bilingual-followup
The bilingual dataset is described in the BG-027 to BG-034 sources in
`scripts/articles_content.py`. Read all eight articles first. Publish only an angle
none of them covers. Basis: clients 11, 12, 14 and 15 under the second-basis rule above.
Candidate angles to test, each dropped if an article above already says it: whether the
local-language answer is longer or shorter than the English one for the same question,
and whether the local-language answer quotes prices, addresses or ratings more often
(reuse the patterns from topics 5 to 7). Pairs count only when both sides are `ok`.
Held 2026-11-06, pre-check result: 31 of 63 English questions in the bilingual pairs were
answered in the local language (claude 13 of 16, gemini 6 of 16, meta 3 of 15, perplexity
9 of 16), although the collector's system prompt says "Respond in the same language as
the question" and places the user in the city. This bears on how BG-027 to BG-034 read,
because some of their "English" answers are not in English. Constantin rules whether this
becomes an article, a correction note on that series, or both. Other angles measured the
same day: length is not a finding (local 2,276 against English 2,462 characters on
average, local longer in only 24 of 63 pairs, and the cap applies); the ratings angle is
invalid (the stars found are hotel categories and Michelin stars, not review ratings).
Do not reuse the first price counts from that day: the local side was matched case
sensitive and the English side was not.

### 16 london-vs-dublin
Basis: clients 10 (London) and 16 (Dublin), which were asked the same 8 English questions
on 2026-07-10 (employment law, commercial disputes, CRM, project management software,
financial advisors, expat wealth management, business banking apps, property
solicitors). Compare engines claude, gemini, meta and perplexity only, because chatgpt
answered for London and not for Dublin. Per question, count brand names found in both
cities' answers from `response_text`: for the software and banking questions
(positions 3, 4, 7) use a brand list (HubSpot, Salesforce, Pipedrive, Zoho, monday.com,
Asana, Trello, ClickUp, Notion, Jira, Revolut, Wise, Starling, Monzo, Tide, Xero) with
word boundaries and a hand check; for the law and advice questions read the answers by
hand and count companies named in both cities. Expected shape, not yet measured: the
software questions share names across the two cities, the professional services ones
almost none. Read BG-016, BG-017, `ai-visibility-for-london.html` and
`ai-visibility-for-dublin.html` first: BG-017 already says the two cities used the same
eight prompts. Drop if any of them already reports this overlap. Firms named after people
are counted, not named.
Pre-check 2026-11-06. London has duplicate claude rows (3 or 4 per position), so keep one
row per client, position and engine:
`distinct on (client_id, position, llm) ... order by client_id, position, llm, checked_at desc`.
Then n is 4 engines per city per question. The existing pages report only per city
unanimity, not this overlap, so the topic is open. Measured, London against Dublin, in
answers out of 4: banking, Monzo 4 and 0, Starling 4 and 0, Revolut 4 and 4, Tide 3 and 1,
AIB 0 and 3, Bank of Ireland 0 and 2. Project management software is largely shared:
Asana 4 and 3, ClickUp 4 and 3, Trello 4 and 3, Jira 3 and 3, Basecamp 3 and 3,
monday.com 3 and 4. CRM: Zoho 3 and 3, HubSpot 2 and 4, Pipedrive 2 and 4, Salesforce 1
and 4; Xero shows up in London CRM answers (3 and 0). Banking is the clearest split: the
same question gets UK challenger banks in London and Irish banks in Dublin, with Revolut
the only name in both everywhere. Still owed: the law and advice questions read by hand.
Small n (4 engines), so report counts, never percentages. Rests on `response_text` only.

### 17 immigration-languages
Immigration rows only (rn = 4), clients 28 to 47, from `response_text`. Pattern for a
language a firm serves in, with word boundaries:
`\m(spanish|espa[nñ]ol|bilingual|multilingual|mandarin|chinese|cantonese|vietnamese|korean|tagalog|hindi|arabic|russian|portuguese|french|creole|polish)\M`.
Pre-check 2026-11-06: 46 of 98 answers say which language a firm works in. Per engine:
google_ai 16 of 18, perplexity 10 of 20, gemini 9 of 20, claude 8 of 20, chatgpt 3 of 20.
Spanish in 40 answers; another language in 20. A hand sample read the same day was
genuine (a firm described as Spanish speaking or bilingual, not a passing word). Not
covered by BG-112, which counts credentials. Clear enough to publish; headline is the
engine spread, google_ai most often and chatgpt least. Read 20 rows by hand again before
publishing and record it. google_ai text is capped, so its count is a lower bound.

### 18 aila
Immigration rows only (rn = 4), clients 28 to 47, from `response_text`. Pattern
`\maila\M` or `american immigration lawyers association`; also count `\muscis\M` and
`\meoir\M` as context.
Pre-check 2026-11-06: AILA appears in 44 of 98 answers. Per engine: chatgpt 20 of 20,
claude 13 of 20, gemini 8 of 20, google_ai 3 of 18, perplexity 0 of 20. USCIS in 22
answers, EOIR in 3. ChatGPT uses AILA two ways: as a firm's membership credential, and as
a place to check a lawyer ("AILA Lawyer Search" to cross check). The article must count
the two uses separately, read by hand; the second use sits next to BG-111 (verify before
hiring), so cite it. Not in BG-112. Clear enough to publish; the headline is chatgpt 20
of 20 against perplexity 0 of 20.

### 19 to 23
Dropped 2026-11-06, see the queue table.
