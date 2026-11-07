# BG-114 data record: national brokerage brands in real estate answers (2026-11-07)

Topic 11 `agents-vs-brokerages` from `topics.md`. Read only; SELECT and WITH only. No agent
name, address or phone number is recorded here: the repository is public.

## Basis

- Clients 28 to 47 (20 US city research clients), `ai_results.status = 'ok'`, prompt order 2
  (real estate agents) by `row_number() over (partition by client_id order by id)`.
- Restricted to `checked_at < '2026-11-01'`, so the July collection only. Without the filter the
  count is 100, because Los Angeles (client 28) also carries November rows; those are a different
  date and are not pooled.
- 97 answers: chatgpt 19, claude 20, gemini 20, google_ai 18, perplexity 20. (The topic brief said
  98; the 6 July ChatGPT rows of client 28 were deleted on 2026-11-06, see topics.md.)
- Collection ran 2026-07-24 and 2026-07-25. Count source: `response_text`, links removed by
  `regexp_replace(t,'(https?://|www\.)\S+',' ','g')`, backslashes stripped.

## Pattern (word boundaries, case insensitive)

Ten brands: `\mcompass\M`, `\mkeller williams\M`, `\mcoldwell banker\M`, `\mre/?max\M`, `\msotheby`,
`\mexp realty\M`, `\mredfin\M`, `\mberkshire hathaway\M`, `\mcentury 21\M`, `\mdouglas elliman\M`.
Howard Hanna and Weichert were searched: 0 answers. The bare word "exp" was dropped from the
first pass because it is looser than "exp realty" (eXp 19 became 17).
Listing portals: `\m(zillow|realtor\.com|trulia|homes\.com|apartments\.com)`.

## Hand read

22 passages drawn at random (order by md5 of the row id), across all five engines. All 22: the
brand is the company a named agent works under (Compass, Keller Williams, RE/MAX, eXp,
Sotheby's), or Redfin recommended as a brokerage. No false hit found. No name is recorded here.

## Results

Answers naming at least one of the ten brands: 77 of 97.
By engine: gemini 20 of 20, claude 19 of 20, chatgpt 18 of 19, google_ai 16 of 18, perplexity 4 of 20.
Brands by answers: Compass 38, Keller Williams 37, RE/MAX 19, eXp Realty 17, Coldwell Banker 16,
Sotheby's 16, Redfin 15, Berkshire Hathaway 12, Douglas Elliman 7, Century 21 2.
Compass by engine: google_ai 11, claude 9, gemini 9, chatgpt 7, perplexity 2.
Keller Williams by engine: gemini 11, google_ai 10, chatgpt 8, claude 8, perplexity 0.
Redfin by engine: chatgpt 10, gemini 4, google_ai 1, claude 0, perplexity 0.
Distinct brands per answer: 0 in 20, 1 in 25, 2 in 24, 3 in 18, 4 in 2, 5 in 4, 6 in 4
(3 or more: 28). Three or more by engine: gemini 11, google_ai 7, chatgpt 6, claude 4, perplexity 0.
Per city, answers naming a brand: 5 in 2 cities, 4 in 13, 3 in 5, none lower (20 cities, 97 answers,
so some cities have 4 usable answers).
Listing portal named in 36 of 97 answers (overlaps BG-106; mentioned only).

## Queries

```sql
with p as (select id, client_id, row_number() over (partition by client_id order by id) rn
           from prompts where client_id between 28 and 47),
r as (select a.id, a.client_id, a.llm, a.checked_at,
        replace(regexp_replace(a.response_text,'(https?://|www\.)\S+',' ','g'), chr(92), '') t
      from ai_results a join p on p.id = a.prompt_id
      where a.client_id between 28 and 47 and a.status = 'ok' and p.rn = 2
        and a.checked_at < '2026-11-01'),
f as (select *,
  (t ~* '\mcompass\M') compass, (t ~* '\mkeller williams\M') kw, (t ~* '\mcoldwell banker\M') cb,
  (t ~* '\mre/?max\M') remax, (t ~* '\msotheby') sir, (t ~* '\mexp realty\M') exp,
  (t ~* '\mredfin\M') redfin, (t ~* '\mberkshire hathaway\M') bh, (t ~* '\mcentury 21\M') c21,
  (t ~* '\mdouglas elliman\M') de from r),
g as (select *, (compass or kw or cb or remax or sir or exp or redfin or bh or c21 or de) nat from f)
select coalesce(llm,'all') llm, count(*) n, sum(nat::int) nat, sum(compass::int) compass,
       sum(kw::int) kw, sum(cb::int) cb, sum(remax::int) remax, sum(sir::int) sir,
       sum(exp::int) exp, sum(redfin::int) redfin, sum(bh::int) bh, sum(c21::int) c21, sum(de::int) de
from g group by rollup(llm) order by llm;
```

Per answer brand count: sum of the ten booleans cast to int. Per city: group by `client_id`.
