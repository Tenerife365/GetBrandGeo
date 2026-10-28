# BG-106 data record: third-party platforms named in AI answers

Re-run 2026-10-28 against production (`duiyifepitvugyulobqm`), read-only.
No person's name is recorded here: the repository is public.

## Basis

- Clients 28 to 47: the 20 US city research accounts, collected 2026-07-24 and 2026-07-25.
- Six prompts per city. Prompt type comes from the prompt's order inside its client:
  1 personal injury lawyer, 2 real estate agents, 3 property management,
  4 immigration lawyer, 5 and 6 city-specific.
- Five engines: chatgpt, claude, gemini, perplexity, google_ai.
- Only `status = 'ok'` rows: 591 answers.
- Text searched: `response_text` plus `citations` as text, lowercased. A link to the
  platform in an engine's stored sources counts as a mention.
- U.S. News is excluded: a text match cannot separate its legal rankings from
  other uses of the word "news".

## Headline query (reproduces 390 of 591)

```sql
with p as (
  select id, client_id, row_number() over (partition by client_id order by id) rn
  from prompts where client_id between 28 and 47
), r as (
  select r.llm,
    case p.rn when 1 then 'personal_injury' when 2 then 'real_estate'
              when 3 then 'property_mgmt' when 4 then 'immigration'
              else 'city_specific' end qtype,
    lower(coalesce(r.response_text,'') || ' ' || coalesce(r.citations::text,'')) t
  from ai_results r join p on p.id = r.prompt_id
  where r.client_id between 28 and 47 and r.status = 'ok'
)
select qtype, count(*) answers,
  count(*) filter (where t ~ '(zillow|realtor\.com|redfin|homelight|fastexpert|realtrends|avvo|justia|super ?lawyers|best lawyers|bestlawyers|martindale|findlaw|(^|[^a-z])lawyers\.com|chambers and partners|chambers usa|\maila\M|american immigration lawyers association|yelp|google review|\mbbb\M|better business bureau|expertise\.com|thumbtack|houzz|reddit|narpm|healthgrades|tripadvisor|clutch\.co|\mangi\M)') named
from r group by rollup(qtype) order by 1 nulls last;
```

Swap `qtype` for `llm` in the select and group to get the engine split.
Per-platform counts use one `count(*) filter (where t ~ '<one platform pattern>')`
per platform, plus `count(distinct client_id)` and `count(distinct llm)` for the
city and engine columns.

## Results

| Question type | Answers | Named a platform | Share |
|---|---|---|---|
| Immigration lawyer | 98 | 93 | 95% |
| Personal injury lawyer | 98 | 80 | 82% |
| Real estate agents | 98 | 70 | 71% |
| Property management | 99 | 67 | 68% |
| City-specific | 198 | 80 | 40% |
| All | 591 | 390 | 66% |

| Engine | Answers | Named a platform | Share |
|---|---|---|---|
| Google AI Mode | 111 | 88 | 79% |
| ChatGPT | 120 | 91 | 76% |
| Claude | 120 | 85 | 71% |
| Gemini | 120 | 68 | 57% |
| Perplexity | 120 | 58 | 48% |

| Platform | Answers |
|---|---|
| Super Lawyers | 125 |
| Best Lawyers | 101 |
| Avvo | 89 |
| Expertise.com | 72 |
| Yelp | 71 |
| Justia | 65 |
| Chambers | 59 |
| Zillow | 49 |
| AILA | 44 |
| Google reviews | 43 |
| Reddit | 41 |
| BBB | 35 |
| Martindale | 22 |
| RealTrends | 20 |
| FastExpert | 19 |
| HomeLight | 18 |
| Redfin | 16 |
| Realtor.com | 13 |
| NARPM | 11 |
| Thumbtack | 9 |
| FindLaw | 5 |

## Claims checked and corrected before publishing

- An earlier count of 410 included the U.S. News terms. 390 is the published number.
- "Expertise.com appears mostly as a cited link" was refuted: only 19 of its 72
  mentions are link-only. The article states the verified fact instead:
  57 of 72 mentions came from ChatGPT.
