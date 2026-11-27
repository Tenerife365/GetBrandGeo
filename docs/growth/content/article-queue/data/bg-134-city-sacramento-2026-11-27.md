# BG-134 data record: AI visibility in Sacramento

- Queue key: `city-sacramento` (row 29, city study, third basis)
- Published: 2026-11-27 by the daily routine
- Database: `duiyifepitvugyulobqm`, read-only SQL run on 2026-11-27, plus a hand read of
  all 18 answers the same day
- No person's name is recorded here. Firms named after a person are counts only.

## Basis

Client 67 (Research: Sacramento), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash. Row ids 9562 to 9579.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Sacramento |
| 2 | Best real estate agents for buying a home in Sacramento |
| 3 | Top-rated property management companies in Sacramento |
| 4 | Best immigration lawyers in Sacramento |
| 5 | Best lobbying and government relations firms in Sacramento |
| 6 | Best agricultural and water rights law firms in Sacramento |

City cadence: second city study in the week of 23 to 29 November (BG-131 Nashville on
24 November); 26 November was not a city study.

## Query 1: per-engine shape

```sql
select r.llm, r.model, count(*) as answers,
       round(avg(length(r.response_text))) as avg_chars,
       max(length(r.response_text)) as max_chars,
       sum((select count(*) from regexp_matches(r.response_text,
            '\*\*([^*\n]{3,80})\*\*', 'g'))) as bold_spans,
       min(r.checked_at::date) as d1, max(r.checked_at::date) as d2
from ai_results r
where r.client_id = 67 and r.status = 'ok'
group by 1, 2 order by 1;
```

| Engine | Model | Answers | Average characters | Longest | Bold spans | Date |
|---|---|---|---|---|---|---|
| chatgpt | gpt-5.5 | 6 | 4,880 | 6,427 | 135 | 2026-11-06 |
| claude | claude-sonnet-4-6 | 6 | 2,995 | 3,273 | 87 | 2026-11-06 |
| gemini | gemini-2.5-flash | 6 | 3,927 | 5,811 | 96 | 2026-11-06 |

## Query 2: the brief's exact bold-name count

```sql
with b as (
  select r.prompt_id, r.llm,
         lower(regexp_replace(trim(both ' :.' from m[1]),
               ',? (llp|pllc|p\.a\.|pc|inc\.?|llc)$', '')) as name
  from ai_results r, regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g') m
  where r.client_id = 67 and r.status = 'ok' and m[1] !~ ':\s*$'),
d as (select distinct prompt_id, llm, name from b),
agg as (select prompt_id, name, count(distinct llm) as engines from d group by 1, 2)
select p.position, p.text, count(*) as bold_names,
       count(*) filter (where engines >= 2) as two_or_more,
       count(*) filter (where engines = 3) as all_three
from agg join prompts p on p.id = agg.prompt_id
group by 1, 2 order by 1;
```

| Position | Bold names | Named by 2 or more | Named by all 3 |
|---|---|---|---|
| 1 | 31 | 1 | 0 |
| 2 | 53 | 0 | 0 |
| 3 | 34 | 2 | 0 |
| 4 | 39 | 3 | 0 |
| 5 | 34 | 4 | 3 |
| 6 | 32 | 3 | 0 |
| Total | 223 | 13 | 3 |

Matches the 2026-11-06 pre-check (223, 13, 3).

## Query 3: the full text, read by hand

```sql
select r.id, p.position, r.llm, r.response_text
from ai_results r join prompts p on p.id = r.prompt_id
where r.client_id = 67 and r.status = 'ok'
order by p.position, r.llm;
```

## Hand read (2026-11-27)

A firm counts for an engine when the answer names it anywhere, in bold or in running
text. Ratings, directory and ranking names, brokerages named only as an agent's
affiliation, nonprofits and advice were removed. An individual lawyer or agent named
without a firm is not counted as a firm. In question 2 the unit is an agent or team.

Firms named per engine:

| Question | ChatGPT | Claude | Gemini | Different firms in all three answers |
|---|---|---|---|---|
| 1 Personal injury | 7 | 10 | 13 | 20 |
| 2 Real estate agents (agents or teams) | 5 | 10 | 12 | 22 |
| 3 Property management | 8 | 10 | 15 | 17 |
| 4 Immigration | 5 | 9 | 7 | 16 |
| 5 Lobbying and government relations | 10 | 6 | 19 | 27 |
| 6 Agricultural and water rights law | 10 | 5 | 8 | 14 |
| Total | 45 | 50 | 74 | 116 |

Overlap:

| Question | All three | Two engines | One engine | Exact bold match, all three |
|---|---|---|---|---|
| 1 Personal injury | 3 | 4 | 13 | 0 |
| 2 Real estate agents | 0 | 5 | 17 | 0 |
| 3 Property management | 5 | 6 | 6 | 0 |
| 4 Immigration | 0 | 5 | 11 | 0 |
| 5 Lobbying | 3 | 2 | 22 | 3 |
| 6 Agricultural and water law | 3 | 3 | 8 | 0 |
| Total | 14 | 25 | 77 | 3 |

Shares of 116: 12%, 22%, 66%. Check: 45 + 50 + 74 = 169 = 14 x 3 + 25 x 2 + 77.

Notes per question:

- 1: all three firms on all three lists carry people's names (counts only). One of them
  appears in ChatGPT and Gemini under one three-name form and in Claude under a form in
  which one of the three names differs; counted as one firm because two names are shared.
  This is a judgement, not checked against any outside source. Two engines: 4 (ChatGPT and
  Claude 1, ChatGPT and Gemini 2, Claude and Gemini 1). One engine only: ChatGPT 1, Claude
  5, Gemini 7. Gemini also named one individual lawyer with no firm, not counted. Claude's
  answer ends mid-entry on its tenth firm.
- 2: no agent or team in all three. Two engines: 5 (Claude and Gemini 4, ChatGPT and
  Claude 1). ChatGPT also named "Redfin Sacramento agents", a brokerage, not counted.
  Claude's tenth entry is a pair of agents at a property management group, counted as one
  team.
- 3: all three: Utopia Management, Keyrenter Sacramento, Real Property Management Select
  (a national brand in BG-113's pattern), Sacramento Delta Property Management, River
  Valley Property Management. Two engines: Tower Bridge, Cornerstone, Titan (ChatGPT and
  Gemini for Tower Bridge and Titan, ChatGPT and Claude for Cornerstone), Peak
  Residential, M&M Property Services & Management, Ziprent (Claude and Gemini). One engine
  only: ChatGPT 0, Claude 1 (person-named), Gemini 5. The exact match found none on all
  three lists because every Gemini bold span in this answer ends in a colon, which the
  brief's pattern excludes as a heading.
- 4: no firm in all three. Two engines: 5 (Claude and Gemini 4, ChatGPT and Gemini 1).
  ChatGPT named, as an individual without a firm, the lawyer who leads one firm that
  Claude and Gemini both named; under the rule this is two engines. Gemini named two more
  individuals without a firm, not counted. Claude's answer ends mid-entry on its tenth
  name ("Atwal" and nothing more), not counted.
- 5: all three: Capitol Advocacy, Governmental Advocates and one firm carrying founders'
  names. Two engines: California Strategies (ChatGPT and Gemini) and one firm (Claude and
  Gemini). One engine only: ChatGPT 6, Claude 2, Gemini 14. ChatGPT's "Axiom Advisors"
  and Gemini's "Axiom Strategies" are counted as two names.
- 6: all three firms on all three lists carry founders' names. Two engines: 3 (ChatGPT and
  Gemini 2, ChatGPT and Claude 1). One engine only: ChatGPT 4, Claude 1, Gemini 3. The
  exact match missed all three: suffixes and "Sacramento" after a dash differ between
  answers.

Claude: 2 of 6 stored answers end mid-list (positions 1 and 4), so its counts there are
lower bounds.

## What the article does not claim

No ranking, no reason why an engine named a firm, no comparison with any other city or
with the July collection.
