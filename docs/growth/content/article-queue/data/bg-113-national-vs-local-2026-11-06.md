# BG-113 data record: national brands in property management answers (2026-11-06)

Topic 10 `national-vs-local` from `topics.md`. Read only; SELECT and WITH only. No
person's name, address or phone number is recorded here: the repository is public.

## Basis

- Clients 28 to 47 (20 US city research clients), `ai_results.status = 'ok'`, prompt order 3
  (property management) by `row_number() over (partition by client_id order by id)`.
- 99 answers: chatgpt 20, claude 20, gemini 20, google_ai 19, perplexity 20.
- Collection ran 2026-07-24 and 2026-07-25. Count source: `response_text`, with links removed
  by `regexp_replace(t,'(https?://|www\.)\S+',' ','g')` and backslashes stripped.

## Pattern (word boundaries, case insensitive)

Seven brands counted: `\m(greystar|firstservice|mynd|evernest|real property management|renters warehouse)\M`
plus `\massocia\M` (excluding the one answer containing "marquis associa", a truncated name).
Invitation Homes and Progress Residential were searched and found in 0 answers. Belong was
searched and is excluded from every published count (it is also a site that publishes roundups).

## Hand read

45 passages read: 25 for Belong, Associa, FirstService, Greystar, Renters Warehouse (all
matches) and 20 random for Real Property Management, Mynd and Evernest. Result: 20 of 20
genuine recommendations of the brand as a manager. Two false hits removed: one google_ai
answer (Associa, truncated "Marquis Associa..."), one perplexity answer where Belong appears
only as a roundup source. Net: 66 raw matches became 63.

## Results

Answers naming at least one of the seven brands: 63 of 99.
By engine: chatgpt 10 of 20, claude 12 of 20, gemini 13 of 20, google_ai 13 of 19, perplexity 15 of 20.
Brands by answers: Real Property Management 42, Mynd 17, Evernest 17, FirstService 6, Greystar 3,
Renters Warehouse 2, Associa 1.
Real Property Management by engine: perplexity 12, google_ai 10, gemini 9, chatgpt 7, claude 4.
Mynd by engine: gemini 7, claude 4, google_ai 4, chatgpt 1, perplexity 1.
Evernest by engine: gemini 5, perplexity 5, google_ai 3, chatgpt 2, claude 2.
Number of distinct brands per answer: 0 in 36, 1 in 42, 2 in 17, 3 in 4.
Answers with none, by engine: chatgpt 10, claude 8, gemini 7, google_ai 6, perplexity 5.
Per city, answers (of 5) naming a brand: 5 in 4 cities, 4 in 7, 3 in 4, 2 in 1, 1 in 1, 0 in 3
(one city had 4 usable answers).

## Queries

```sql
with p as (select id, client_id, row_number() over (partition by client_id order by id) rn
           from prompts where client_id between 28 and 47),
r as (select a.id, a.client_id, a.llm,
        replace(regexp_replace(a.response_text,'(https?://|www\.)\S+',' ','g'), chr(92), '') t
      from ai_results a join p on p.id = a.prompt_id
      where a.client_id between 28 and 47 and a.status = 'ok' and p.rn = 3),
f as (select *, t ~* '\m(greystar|firstservice|mynd|evernest|real property management|renters warehouse|invitation homes|progress residential)\M'
                  or (t ~* '\massocia\M' and t !~* 'marquis associa') nat from r)
select coalesce(llm,'all') llm, count(*) n, sum(nat::int) nat from f group by rollup(llm) order by llm;
```

Per brand: the same CTE with `sum((t ~* '\m<brand>\M')::int)` per brand. Per city: group by
`client_id`. Brand count per answer: sum of the per-brand booleans cast to int.

## Not published

A count of national brand domains linked in raw text was dropped: the first pattern also
matched plain mentions, so it was not clean.
