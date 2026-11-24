# BG-131 data record: AI visibility in Nashville

- Queue key: `city-nashville` (row 28, city study, third basis)
- Published: 2026-11-24 by the daily routine
- Database: `duiyifepitvugyulobqm`, read-only SQL run on 2026-11-24, plus a hand read of
  all 18 answers the same day
- No person's name is recorded here. Firms named after a person are counts only.

## Basis

Client 63 (Research: Nashville), `status = 'ok'`, 18 answers: 6 questions x 3 engines, all
collected 2026-11-06. Models read from `ai_results.model`: chatgpt gpt-5.5, claude
claude-sonnet-4-6, gemini gemini-2.5-flash. Row ids 9490 to 9507.

| Position | Question |
|---|---|
| 1 | Best personal injury law firms in Nashville |
| 2 | Best real estate agents for buying a home in Nashville |
| 3 | Top-rated property management companies in Nashville |
| 4 | Best immigration lawyers in Nashville |
| 5 | Best music industry and entertainment lawyers in Nashville |
| 6 | Best healthcare law firms in Nashville |

## Query 1: per-engine shape

```sql
select r.llm, r.model, count(*) as answers,
       round(avg(length(r.response_text))) as avg_chars,
       max(length(r.response_text)) as max_chars,
       sum((select count(*) from regexp_matches(r.response_text,
            '\*\*([^*\n]{3,80})\*\*', 'g'))) as bold_spans,
       min(r.checked_at::date) as d1, max(r.checked_at::date) as d2
from ai_results r
where r.client_id = 63 and r.status = 'ok'
group by 1, 2 order by 1;
```

| Engine | Model | Answers | Average characters | Longest | Bold spans | Date |
|---|---|---|---|---|---|---|
| chatgpt | gpt-5.5 | 6 | 4,476 | 6,983 | 170 | 2026-11-06 |
| claude | claude-sonnet-4-6 | 6 | 2,872 | 3,061 | 79 | 2026-11-06 |
| gemini | gemini-2.5-flash | 6 | 3,575 | 4,852 | 80 | 2026-11-06 |

## Query 2: the brief's exact bold-name count

```sql
with b as (
  select r.prompt_id, r.llm,
         lower(regexp_replace(trim(both ' :.' from m[1]),
               ',? (llp|pllc|p\.a\.|pc|inc\.?|llc)$', '')) as name
  from ai_results r, regexp_matches(r.response_text, '\*\*([^*\n]{3,80})\*\*', 'g') m
  where r.client_id = 63 and r.status = 'ok' and m[1] !~ ':\s*$'),
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
| 1 | 45 | 4 | 1 |
| 2 | 22 | 0 | 0 |
| 3 | 44 | 5 | 1 |
| 4 | 29 | 3 | 0 |
| 5 | 58 | 8 | 1 |
| 6 | 35 | 0 | 0 |
| Total | 233 | 20 | 3 |

Matches the 2026-11-06 pre-check (233, 20, 3).

## Query 3: the full text, read by hand

```sql
select r.id, p.position, r.llm, r.response_text
from ai_results r join prompts p on p.id = r.prompt_id
where r.client_id = 63 and r.status = 'ok'
order by p.position, r.llm;
```

## Hand read (2026-11-24)

A firm counts for an engine when the answer names it anywhere, in bold or in running
text. Ratings, directory and ranking names, referral services, nonprofits and advice were
removed. An individual lawyer named without a firm is not counted as a firm.

Firms named per engine:

| Question | ChatGPT | Claude | Gemini | Different firms in all three answers |
|---|---|---|---|---|
| 1 Personal injury | 8 | 9 | 8 | 16 |
| 2 Real estate agents (agents or teams) | 7 | 6 teams (7 agents, two in one team) | 11 | 21 |
| 3 Property management | 12 | 10 | 11 | 25 |
| 4 Immigration | 5 | 8 | 8 | 13 |
| 5 Music and entertainment law | 8 | 6 | 11 | 17 |
| 6 Healthcare law | 10 | 8 | 8 | 18 |
| Total | 50 | 47 | 57 | 110 |

Overlap:

| Question | All three | Two engines | One engine | Exact bold match, all three |
|---|---|---|---|---|
| 1 Personal injury | 2 | 5 | 9 | 1 |
| 2 Real estate agents | 0 | 3 | 18 | 0 |
| 3 Property management | 1 | 6 | 18 | 1 |
| 4 Immigration | 2 | 4 | 7 | 0 |
| 5 Music and entertainment law | 3 | 2 | 12 | 1 |
| 6 Healthcare law | 1 | 6 | 11 | 0 |
| Total | 9 | 26 | 75 | 3 |

Shares of 110: 8%, 24%, 68%.

Notes per question:

- 1: both firms on all three lists carry people's names or initials (counts only). One
  engine wrote the long form of one name, which the exact match missed. Gemini also listed
  individual attorneys in running text; those are not counted as firms.
- 2: no agent or team in all three. Two engines: Oak Street Real Estate Group (ChatGPT as
  a team, Claude through two of its agents) and two agents or teams named after people.
  One local brokerage, named after people, appears in all three answers as the affiliation
  of three different agents.
- 3: all three: Evernest (a national brand in BG-113). Two engines: HomeRiver Group
  (Claude wrote "Pure HomeRiver Group"), Mynd, Prime Rentals & Real Estate and Gemstone
  Solutions (Claude and Gemini), one person-named firm (Claude and Gemini) and one
  person-named firm (ChatGPT and Claude). One engine only: 10 ChatGPT, 3 Claude, 5 Gemini.
  ChatGPT alone listed commercial managers (4). ChatGPT and Gemini each listed one
  short-term rental manager, not the same one.
- 4: both firms on all three lists carry people's names. The exact match missed both:
  Gemini put the lawyer's name in bold with the firm in brackets. ChatGPT also named three
  nonprofit organisations, not counted.
- 5: three firms on all three lists, all large firms with a Nashville office, all carrying
  founders' names. Claude attached one of them to a lawyer with a dash. Three individual
  lawyers were named in all three answers. One-engine firms: 4 ChatGPT, 2 Claude, 6 Gemini.
- 6: one firm on all three lists; Claude wrote its five-name legal form and Gemini's bold
  span ended in a colon, which the brief's pattern excludes. Of the 6 firms named by two
  engines, 5 are ChatGPT and Claude. 6 of Gemini's 8 firms are in no other answer; one of
  them is described in ChatGPT's answer as absorbed into another firm on ChatGPT's list.
  Not checked against any outside source.

Claude: 5 of 6 stored answers end mid-list (positions 1, 2, 3, 4 and 6), so its counts are
lower bounds.

## What the article does not claim

No ranking, no reason why an engine named a firm, no comparison with any other city or
with the July collection.
