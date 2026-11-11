# Daily article topic queue

Read by the scheduled routine `brandgeo-daily-article`, which publishes one article a
day from data BrandGEO has already collected. Ruled by Constantin on 2026-10-28
("Mergem pe varianta 1"): one article a day, committed and pushed automatically.

## How the routine uses this file

1. Take the first topic whose status is `ready` and whose `from` date, if it has one
   (`ready from YYYY-MM-DD`), is today or earlier. A topic with a later `from` date is
   skipped, not taken early.
   Order among eligible topics (added 2026-11-06, so every dated row keeps its day): a
   topic whose `from` date is exactly today goes first. Only when no topic is dated today
   take the first eligible topic in table order. So a dated row missed on its day (the
   app was closed) waits for the next day that has no row of its own, and never pushes a
   city study or another dated row off its date. A row marked `not after YYYY-MM-DD` that
   is still unpublished after that date is set to `held <date>: past its not-after date`
   and reported, not published.
   Cadence ruled by Constantin on 2026-11-06: at most 2 city studies (keys `city-*`, and
   since 2026-11-08 also `draft-city-*`, a city study written ahead as a draft) per
   week, Monday to Sunday, alternating with other kinds of article (trending topics,
   comparisons, research team suggestions). Never publish a third city study in the same
   week, and never a city study on the day after another one, even when its `from` date
   has passed.
   His words: "I want to do 2 cities maximum per week, and then we alternate with
   something else."
   **Ruling, Constantin, 2026-11-10: every site marked for articles publishes every
   day, 7 days out of 7** ("regula este ca toate conturile marcate cu articole,
   posteaza zilnic, 7/7"). An empty day is no longer acceptable. This replaces the
   2026-11-06 lines that said "if no other topic is eligible, publish nothing" and
   "do not add platform-data topics under STEP 2b". The 2 city studies a week limit
   stands. On a day with no dated row, take the first undated `ready` topic in table
   order (rule 1 as above); undated platform-data topics are the buffer for exactly
   those days.
   STEP 2b of the routine applies again, read this way: count only the `ready` rows
   with no `from` date (the buffer), not the drafts dated ahead. If fewer than 3 are
   in the buffer, add new platform-data topics the same run (they publish from the
   next day on). If a day still ends with nothing eligible, report it as a breach of
   the 7/7 rule under "Necesită acțiunea ta", never as a normal empty day.
2. Run its SQL, read-only, against `duiyifepitvugyulobqm`. Never collect, never call an engine.
3. If the numbers do not carry a clear finding, set the topic to `dropped` with one line
   saying why, and stop for the day. A dull day is better than a padded article.
4. Otherwise write the article, record the queries and numbers in
   `data/<slug>-<topic-key>-<date>.md`, set the status to `published <slug> <date>`.
5. Draft rows (key `draft-*`, added 2026-11-06 on Constantin's ruling that the non-city
   articles are written in a separate session, not by widening the routine). The article
   is already written, in `drafts/<YYYY-MM-DD>-<key>.md`, from sources that session read
   on the day it wrote it. For a draft row, steps 2 to 4 do not apply: no SQL, no new
   writing. Instead:
   a. Run the "Check before publishing" line in the draft (a curl status per source URL).
      A 404 or 410 on any source: set the row to `held <date>: source <n> gone` and
      publish nothing that day. Any other non-200 (403, timeout): note it in the report
      and go on, because some publishers refuse automated clients.
   b. Copy the draft's python block, unchanged, to the end of
      `scripts/articles_content_daily.py`. Replace every `bg-NNN` and `BG-NNN` with the
      day's slug, and set `date` and `date_label` to today. Change nothing else; if the
      publisher's validation rejects something, fix only that and say what in the report.
   c. Publish with the draft file in `--extra` in place of a data record (it lists the
      sources and figures, and is committed with the article), and set the row to
      `published <slug> <date>`.
   d. Never take a draft row early, and never copy a draft into
      `scripts/articles_content_daily.py` before its day: the routine's STEP 1 treats the
      last entry there as unfinished work and would publish it at once.
   The routine's own instructions (its SKILL.md, STEP 2 and STEP 4) allow finished drafts
   since 2026-11-06, approved by Constantin ("Yes, apply them"); the edits are recorded in
   `drafts/PROPOSED-SKILL-CHANGE-2026-11-06.md`.

## Rules every topic inherits

- Default basis: the 20 US city accounts, clients 28 to 47, 5 engines, `status = 'ok'`,
  591 answers. Prompt type is the prompt's order inside its client: 1 personal injury,
  2 real estate agents, 3 property management, 4 immigration, 5 and 6 city-specific.
- Default basis, correction 2026-11-06: it is now 585 ok answers, not 591. An admin
  engine-card refresh on Los Angeles (client 28) deleted its 6 July ChatGPT rows that
  day. Every published data record from BG-106 to BG-113 queries clients 28 to 47 on all
  engines, so its reproduction query now returns a denominator lower by up to 6 and a
  numerator lower wherever a deleted row matched. The published articles stay as they
  are; a new article says 585 and, if it compares with an older one, says why.
- Third basis, allowed since 2026-11-06 (Constantin: "Go, 3 engines", then new cities
  instead of re-running old ones): the November 2026 collection. Clients 58 to 67 (Austin,
  San Jose, Jacksonville, Columbus, Indianapolis, Nashville, Las Vegas, Portland Oregon,
  Orlando, Sacramento), 18 ok answers each, 180 in total, collected 2026-11-06, plus Los
  Angeles (client 28) rows with `checked_at >= '2026-11-01'`, 18 more. Engines chatgpt
  (gpt-5.5), claude (claude-sonnet-4-6) and gemini (gemini-2.5-flash), read from
  `ai_results.model`. Prompts 1 to 4 are the standard four word for word, 5 and 6 are
  city-specific. Never pool November with July into one percentage: the dates differ by
  four months, the July rows have no recorded model, and Claude's answers changed
  character (a 2026 year appears in 33 of 120 July Claude answers and 37 of 66 November
  ones), so a July to November difference may measure the instrument, not the market.
  Put the two side by side, dated, if at all. Bold markup (`**name**`) is reliable on
  this basis: all three engines use it (average 27, 16 and 16 bold spans per answer for
  chatgpt, claude and gemini), and the strings it carries are firm names, checked by
  hand on the all-three lists below; headings in bold end with a colon and are excluded.
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

Research team suggestions for the days without a city study (12 to 30 November) are in
`research-suggestions-2026-11-06.md`. Constantin ruled on 2026-11-06 that they are written
in a separate session. That session wrote 12 of the 13 as finished drafts in `drafts/`
(rows 33 to 45 below, rule 5 above); the 21 November brief failed its check and is
dropped. 21 November has no row, so it takes any eligible topic left over (rule 1).

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
| 11 | agents-vs-brokerages | published bg-114 2026-11-07 | Which national brokerage brands real estate answers name, and how that differs by engine |
| 12 | city-economy | dropped 2026-11-06: counting named businesses needs `competitors_mentioned` (unreliable) or bold markup, and google_ai answers carry no bold at all (0.0 per answer), so no count works across engines | Which city-specific questions produced the most and fewest named businesses |
| 13 | dates | published bg-115 2026-11-08 | How often answers mention a year or "as of", a sign of how current they claim to be |
| 14 | answer-length | dropped 2026-11-06: stored text is capped (chatgpt and google_ai at 10,000 characters, google_ai median 9,821; claude at about 3,800), so length measures the cap, not the answer; the list-length side needed topic 2, also dropped | Answer length by engine, and whether longer answers name more firms |
| 15 | bilingual-followup | held 2026-11-06: ruling owed by Constantin. 31 of 63 English questions were answered in the local language, which touches how BG-027 to BG-034 read; see the brief | A bilingual angle not covered by BG-027 to BG-034; read those first, drop if covered |
| 16 | london-vs-dublin | published bg-116 2026-11-09 | London and Dublin were asked the same 8 questions: where the engines named the same companies and where they did not |
| 17 | draft-immigration-languages | ready from 2026-11-21 (draft, rule 5; written 2026-11-08, hand read: 42 of 97 firm-level) | How often immigration answers say which languages a firm works in, by engine |
| 18 | aila | published bg-117 2026-11-10 | How often immigration answers name AILA, and whether as a credential or as a place to check a lawyer |
| 19 | free-consultation | dropped 2026-11-06: BG-110 already reports it (63 answers mention a free consultation); personal injury alone gives 61 of 98, no new angle | How often answers say the first consultation is free |
| 20 | disclaimers | dropped 2026-11-06: 1 answer of 591 carries a "not legal advice" style disclaimer, nothing to report | How often answers carry a legal or financial disclaimer |
| 21 | notario-warnings | dropped 2026-11-06: 9 of 98 immigration answers warn about notarios or scams, too few to split by engine | How often immigration answers warn about notario fraud |
| 22 | closing-offers | dropped 2026-11-06: 116 answers end with an offer to help further, but perplexity alone is 70 and gemini and google_ai are 0, the ends of capped answers are cut, and the perplexity side overlaps BG-107 | How often answers end by offering more help |
| 23 | legal-aid | dropped 2026-11-06: 22 immigration answers name legal aid or nonprofit options, partly reported in BG-109, too thin alone | How often immigration answers point to free or low cost legal help |
| 24 | draft-city-austin | ready from 2026-11-12 (draft, rule 5; city study, written 2026-11-08) | What ChatGPT, Claude and Gemini recommend in Austin, and which firms all three agree on |
| 25 | draft-city-portland | ready from 2026-11-14 (draft, rule 5; city study, written 2026-11-08) | What the three engines recommend in Portland, Oregon, and where they agree |
| 26 | draft-city-lasvegas | ready from 2026-11-17 (draft, rule 5; city study, written 2026-11-08) | What the three engines recommend in Las Vegas, and where they agree |
| 27 | draft-city-orlando | ready from 2026-11-20 (draft, rule 5; city study, written 2026-11-08) | What the three engines recommend in Orlando, and where they agree |
| 28 | city-nashville | ready from 2026-11-24 (pre-checked 2026-11-06, third basis) | What the three engines recommend in Nashville, and where they agree |
| 29 | city-sacramento | ready from 2026-11-27 (pre-checked 2026-11-06, third basis) | What the three engines recommend in Sacramento, and where they agree |
| 30 | city-later | held 2026-11-06 for December: Indianapolis, Columbus, Jacksonville, San Jose (fewest firms named by all three engines: 1, 1, 1 and 2), at the same cadence | City studies after November |
| 31 | agreement-by-trade | dropped 2026-11-06: on the November basis the 28 firms named by all three engines are 9 property managers, 6 home builders, 4 breweries and 3 lobbying firms against 6 law firms, but BG-016 already reports when engines agree and when they do not | Which kinds of business all three engines agree on |
| 32 | la-four-months | dropped 2026-11-06: same 6 Los Angeles questions in July and November, but bold markup differs between months (Gemini bolds no names on 2 July prompts and 2 November ones) and Claude's answers changed character, so a churn count would measure the instrument; ChatGPT's July rows were deleted | How much an engine's recommendations change in four months |
| 33 | draft-chatgpt-search-share | ready from 2026-11-13 (draft, rule 5) | What OpenAI's "a fifth of Google" claim does and does not tell a local business |
| 34 | draft-search-console-ai | ready from 2026-11-15, not after 2026-12-02 (draft, rule 5) | What Search Console's AI report shows today, before the UK deadline of 3 December |
| 35 | draft-engine-scorecard | ready from 2026-11-16 (draft, rule 5) | What each engine tells a buyer about a local firm, from BG-106 to BG-113 |
| 36 | draft-safegeo | ready from 2026-11-18 (draft, rule 5) | What the SafeGEO paper at EMNLP 2026 measured about gaming AI recommendations |
| 37 | draft-consumers-ask-ai | ready from 2026-11-19 (draft, rule 5) | 45% of US consumers ask AI for a local business, and almost all double check |
| 38 | draft-soci-index | dropped 2026-11-06: SOCi's own release gives only ChatGPT 1.2% and the 35.9% local 3-pack figure, with no definition of a recommendation; the Gemini 11% and Perplexity 7.4% rates could not be read at source (report PDF unreadable, Search Engine Land refused the request) | SOCi's 2026 Local Visibility Index next to our city data |
| 39 | draft-tool-agents | ready from 2026-11-22 (draft, rule 5) | What the agent features in Peec, Scrunch and Profound say they do |
| 40 | draft-geo-survey | ready from 2026-11-23 (draft, rule 5) | What a 2026 survey of 45 GEO studies finds well supported, and what thin |
| 41 | draft-aio-local-studies | ready from 2026-11-25 (draft, rule 5) | Why two studies put AI Overviews on 68% and 40% of local searches |
| 42 | draft-ai-mode-booking | ready from 2026-11-26 (draft, rule 5) | What a local business needs for Google AI Mode to book it |
| 43 | draft-tool-ownership | ready from 2026-11-28 (draft, rule 5) | Who owns the main AI visibility tools after the past year's deals |
| 44 | draft-roundup-oct-nov | ready from 2026-11-29 (draft, rule 5) | What changed in AI search from 1 October to 6 November 2026 |
| 45 | draft-year-end-checks | ready from 2026-11-30 (draft, rule 5) | Five things a local firm should check in AI answers before the new year |
| 46 | pi-case-types | published bg-118 2026-11-11 | Which case types AI engines attach to personal injury firms, and which engine names the fewest |
| 47 | pm-services | ready (pre-checked 2026-11-10, buffer) | Which services AI engines say local property managers offer: screening, rent, maintenance, evictions |
| 48 | immigration-case-types | ready (pre-checked 2026-11-11, buffer) | Which kinds of immigration case AI engines say a lawyer handles: family, work visas, asylum, removal, citizenship |
| 49 | agent-specialties | ready (pre-checked 2026-11-11, buffer) | What AI engines say local real estate agents specialize in: luxury, first-time buyers, relocation, investors, condos |

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
Published 2026-11-09 as BG-116. Correction from the hand read: Xero appears in London CRM
and banking answers only as an accounting tool the product connects to, so it is not
counted as a CRM name. Law and advice, read by hand: 4 firms in both cities across the
five questions, each named by one engine per city. Record:
`data/bg-116-london-vs-dublin-2026-11-09.md`.

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

### 24 to 29 city studies (third basis, one city per article)
Format: a BG article, not an `ai-visibility-for-<city>.html` page (the routine only
builds BG articles; none of these ten cities has a city page). Read
`ai-visibility-for-losangeles.html` and one more city page for the angle and headline
style ("AI Visibility in <City>: ..."), and BG-016 so the article does not repeat its
cross-engine argument: here the agreement is one city's evidence, not the thesis.
Basis: the city's 18 ok rows (6 questions x chatgpt, claude, gemini), collected
2026-11-06. Prompt order 1 personal injury, 2 real estate agents, 3 property management,
4 immigration, 5 and 6 city-specific (read the prompt text from `prompts`).
Measure: firms named in bold, normalised, counted per question by how many of the three
engines named them.

```sql
with b as (
  select r.prompt_id, r.llm,
         lower(regexp_replace(trim(both ' :.' from m[1]),
               ',? (llp|pllc|p\.a\.|pc|inc\.?|llc)$', '')) as name
  from ai_results r, regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g') m
  where r.client_id = <id> and r.status = 'ok' and m[1] !~ ':\s*$'),
d as (select distinct prompt_id, llm, name from b),
agg as (select prompt_id, name, count(distinct llm) as engines from d group by 1, 2)
select p.position, p.text, count(*) as bold_names,
       count(*) filter (where engines >= 2) as two_or_more,
       count(*) filter (where engines = 3) as all_three
from agg join prompts p on p.id = agg.prompt_id
group by 1, 2 order by 1;
```

`bold_names` also catches a few bold labels that are not firms (for example "free
consultation" without a colon), so read every answer by hand before stating how many
firms an engine named, and state counts of firms, not of bold spans. The `two_or_more`
and `all_three` lists are short; read each name. Naming: a company name may appear when
it is clearly a company (a brewery, a home builder, a management company); a firm named
after a person is reported as a count only. No person's name anywhere.
Pre-check 2026-11-06 (bold spans, before the hand read; all-three names checked as firms):

| # | City | client | bold names | named by 2 or more | named by all 3 | where all three agree |
|---|---|---|---|---|---|---|
| 24 | Austin | 58 | 280 | 23 | 6 | 6 home builders (question 6) |
| 25 | Portland, Oregon | 65 | 258 | 29 | 5 | 4 breweries (question 6), 1 property manager |
| 26 | Las Vegas | 64 | 244 | 23 | 3 | 2 property managers, 1 gaming law firm |
| 27 | Orlando | 66 | 281 | 19 | 3 | 2 property managers, 1 personal injury firm |
| 28 | Nashville | 63 | 233 | 20 | 3 | 1 personal injury firm, 1 property manager (a national brand, see BG-113), 1 music law firm |
| 29 | Sacramento | 67 | 223 | 13 | 3 | 3 lobbying firms (question 5) |

Clear enough for each city: of 200 to 280 bold names, at most 6 are named by all three
engines, and across the ten cities the 28 firms named by all three are mostly property managers,
home builders, breweries and lobbying firms (22), not law firms (6). Say what
a business in that city should do. Drop a city if the hand read leaves fewer than 2
firms named by all three. Never compare a city's numbers with a July city as a trend.
Since 2026-11-08 (hub ruling) these are written ahead as drafts in `drafts/` and published
by rule 5. The hand read changes the counts a lot: exact bold strings miss shortened names,
grouped bold lines and firms named in running text. Austin moved from 6 to 16 firms named by
all three, Portland from 5 to 14, Las Vegas from 3 to 12, Orlando from 3 to 6; each draft
carries its own queries and hand-read table.

### 33 to 45 drafts (non-city days, 13 to 30 November)
Written 2026-11-06 in a separate session from `research-suggestions-2026-11-06.md`. Each
draft file in `drafts/` carries its own source table (URL, grade, what was read, all read
on 2026-11-06), the curl check, and the finished `ARTICLES_DAILY.append(dict(...))` block
with `bg-NNN` placeholders. Publish by rule 5; do not rewrite. Briefs that needed one
check: 39 passed on the vendor's own launch post and docs (the GlobeNewswire release
refused automated reads); 40 passed on the arXiv abstract page (full text not read, the
article says so); 41 passed on both originals; 42 passed with Google's two pages
disagreeing on access, which the article reports; 43 passed on Sitecore's, HubSpot's and
Profound's own pages; 38 failed and is dropped. 44 covers 1 October to 6 November only;
a session, not the routine, refreshes it if the rest of November is wanted.

### 46 pi-case-types
Personal injury rows only (rn = 1), clients 28 to 47, July basis (`checked_at <
'2026-11-01'`, 97 answers: chatgpt 19, claude 20, gemini 20, google_ai 18, perplexity
20), from `response_text` with backslashes stripped. One pattern per case type, word
start boundary: car or auto or vehicle accident/crash/collision; truck, trucking,
18-wheeler; motorcycle; medical malpractice or negligence; wrongful death; premises
liability or slip and fall; dog bite; pedestrian or bicycle accident; brain injury, TBI,
spinal cord, catastrophic injury; workers comp, workplace injury, construction accident;
product liability or defective product; nursing home; rideshare, Uber, Lyft.
Pre-check 2026-11-10 (answers naming the type, of 97): car 82, wrongful death 81,
premises 67, medical malpractice 64, truck 60, catastrophic 57, product 40, workplace
39, motorcycle 34, dog bite 18, pedestrian 18, nursing home 14, rideshare 10. 92 of 97
name 3 or more types, 2 name none. The engine spread is the finding: Perplexity names
motorcycle, dog bite, pedestrian, nursing home and rideshare 0 times and workplace and
product once each, while ChatGPT and Google AI Mode name most types in most answers
(google_ai workplace 12 of 18, perplexity 1 of 20).
Read by hand 2026-11-10, 20 rows (ids 2569 to 2688): no false match, but two uses
exist. Most mentions attach a type to a named firm ("handles car accidents, truck
wrecks, medical malpractice"); some are generic advice ("best depends on whether your
case is a car crash, medical malpractice ...", Perplexity's "Case type: car accident,
truck crash, wrongful death"). The article must count the firm-attached use separately,
read by hand, at least for wrongful death, medical malpractice and truck. "car/truck
crashes" misses the car pattern; widen it before the final count. Not covered by BG-112
(credentials) or BG-110 (fees). Drop if the firm-attached count removes the engine
spread. Name no firm: most PI firms carry a person's name.

### 47 pm-services
Property management rows only (rn = 3), July basis (98 answers: chatgpt 19, claude 20,
gemini 20, google_ai 19, perplexity 20). Services: tenant screening; rent collection;
maintenance or repairs; eviction; HOA or community association; owner or tenant portal
or app; financial reporting or owner statements; 24/7 or emergency maintenance; leasing
or marketing the rental; short-term or vacation rental.
Pre-check 2026-11-10 (of 98): maintenance 80, leasing 69, screening 57, eviction 54,
reporting 49, rent collection 45, emergency 39, HOA 37, portal 20, short-term 17.
Perplexity names almost none (screening 2, maintenance 2, rent 0, portal 0) against
Gemini screening 19 of 20 and rent 16 of 20. Patterns are loose and NOT yet read by
hand: `maintenance|repairs` and `reporting` and `commercial` catch prose about the
buyer, not the firm. Read 20 rows by hand and tighten before writing; count the
firm-attached use separately as in 46. BG-113 counted national brands and BG-110 fees
on the same rows; do not repeat either. Drop if tightening removes the spread.

### 48 immigration-case-types
Added 2026-11-11 by the routine (STEP 2b: the undated buffer had 1 row after BG-118).
Immigration rows only (rn = 4), clients 28 to 47, July basis (`checked_at <
'2026-11-01'`, 97 answers: chatgpt 19, claude 20, gemini 20, google_ai 18, perplexity
20), `response_text` with backslashes stripped. Patterns, word start: family-based,
family immigration, marriage-based, spousal, green card; H-1B, employment-based,
business immigration, work visa, EB-n, PERM (whole word); asylum; deportation, removal
defense, removal proceedings, immigration court; citizenship, naturalization; DACA,
U visa, VAWA, T visa.
Pre-check 2026-11-11 (answers naming the type, of 97): removal 94, family 93,
citizenship 85, asylum 83, employment 68, humanitarian 36. The spread is employment and
humanitarian: Perplexity names employment cases in 4 of 20 and humanitarian in 1,
against ChatGPT 18 of 19 and 14 of 19. 10 rows read by hand (ids 2387 to 2478): no
false match, and the same two uses as BG-118 (attached to a firm, "Good fit for:
business immigration"; or advice, "a focus on the type of case you have: family-based,
employment-based"). Read 20 more by hand and count the firm-attached use separately for
employment and asylum, as BG-118 did. "green card" may be generic process text; check
it. Not covered by BG-117 (AILA) or row 17 (languages, draft for 2026-11-21). Drop if
the firm-attached count removes the spread. Name no firm.

### 49 agent-specialties
Added 2026-11-11 by the routine (STEP 2b). Real estate agent rows only (rn = 2), July
basis (97 answers: chatgpt 19, claude 20, gemini 20, google_ai 18, perplexity 20).
Patterns, word start: luxury; first-time buyer or first time home buyer; relocat;
investor or investment property; condo, condominium; new construction, new build.
Pre-check 2026-11-11 (of 97): luxury 63, first-time buyers 58, condo 42, investors 34,
relocation 30, new construction 18. The engines lean different ways: Claude names
luxury in 17 of 20 and first-time buyers in 7; ChatGPT first-time buyers in 18 of 19
and luxury in 11; Perplexity investors in 1 of 20. 10 luxury rows read by hand (ids
2399 to 2460): no false match, but uses differ: luxury as an agent's specialty, as a
brokerage description, and as a budget filter for the buyer ("starter home vs.
luxury"). Read 20 more by hand, count the agent-attached use separately, and keep
brokerage descriptions apart from agents (BG-114 counted brokerages; do not repeat it).
Agents are people: report counts only, name no agent and no team named after a person.
Drop if the agent-attached count removes the spread.
