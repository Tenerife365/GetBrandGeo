# BG-118 data record: case types in personal injury answers (2026-11-11)

Topic 46 `pi-case-types` from `topics.md`. Read only; SELECT and WITH only. No person's
name, firm name, address or phone number is recorded here: the repository is public.
Answers are referred to by `ai_results.id` only.

## Basis

- Clients 28 to 47 (20 US city research clients), `ai_results.status = 'ok'`,
  `checked_at < '2026-11-01'` (the July collection, 2026-07-24 and 2026-07-25, read back).
- Personal injury only (rn = 1): 97 answers: chatgpt 19 (Los Angeles July rows deleted
  2026-11-06), claude 20, gemini 20, google_ai 18, perplexity 20.
- Prompt type by `row_number() over (partition by client_id order by id)` on `prompts`.
- Engine column is `ai_results.llm`. Text column: `response_text`, backslashes stripped
  (`chr(92)`). `citations` and `competitors_mentioned` not used.
- Stored text caps: claude about 3,800 characters, chatgpt and google_ai 10,000. Counts
  are lower bounds for those engines.

## Query 1: case types by engine

The car pattern was widened from the brief so "car/truck crashes" and "auto/trucking"
match (brief, 2026-11-10). Pedestrian or bicycle: "pedestrian" anywhere, or bicycle,
bike, cyclist followed by accident, crash, collision or injury.

```sql
with p as (select id, client_id, row_number() over (partition by client_id order by id) rn
           from prompts where client_id between 28 and 47),
r as (select a.id, a.llm, replace(a.response_text, chr(92), '') t
      from ai_results a join p on p.id = a.prompt_id
      where p.rn = 1 and a.client_id between 28 and 47 and a.status = 'ok'
        and a.checked_at < '2026-11-01'),
m as (select id, llm,
 t ~* '\m(car|auto|automobile|vehicle|motor vehicle)s?\M[ /-]{0,3}((and|or|&)?[ /]{0,3}(truck|motorcycle)s?[ /-]{0,3})?(accident|crash|collision|wreck)' as car,
 t ~* '\m(truck|trucking|18-wheeler|semi-truck|tractor-trailer)' as truck,
 t ~* '\mmotorcycle' as moto,
 t ~* '\mmedical (malpractice|negligence)' as medmal,
 t ~* '\mwrongful death' as wd,
 t ~* '\m(premises liability|slip[- ]and[- ]fall|slip & fall)' as prem,
 t ~* '\mdog bite' as dog,
 t ~* '\m(pedestrian|(bicycle|bike|cyclist)s?\M[ /-]{0,3}(accident|crash|collision|injur))' as ped,
 t ~* '\m(brain injur|tbi\M|spinal cord|catastrophic injur)' as cat,
 t ~* '\m(workers.? comp|workplace injur|workplace accident|construction (site )?(accident|injur))' as work,
 t ~* '\m(product liability|defective product)' as prod,
 t ~* '\mnursing home' as nh,
 t ~* '\m(rideshare|ride-share|uber|lyft)\M' as ride
 from r),
s as (select *, car::int+truck::int+moto::int+medmal::int+wd::int+prem::int+dog::int+ped::int
               +cat::int+work::int+prod::int+nh::int+ride::int k from m)
select coalesce(llm,'ALL') llm, count(*) n, sum(car::int) car, sum(truck::int) truck,
 sum(moto::int) moto, sum(medmal::int) medmal, sum(wd::int) wd, sum(prem::int) prem,
 sum(dog::int) dog, sum(ped::int) ped, sum(cat::int) cat, sum(work::int) work,
 sum(prod::int) prod, sum(nh::int) nh, sum(ride::int) ride,
 sum((k>=3)::int) three_plus, sum((k=0)::int) none, round(avg(k),1) avg_types
from s group by rollup(llm) order by llm;
```

| Engine | n | car | truck | moto | medmal | wd | prem | dog | ped | cat | work | prod | nh | ride | 3+ | none | avg |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 97 | 86 | 60 | 34 | 64 | 81 | 69 | 18 | 28 | 57 | 43 | 40 | 14 | 10 | 93 | 2 | 6.2 |
| chatgpt | 19 | 17 | 17 | 10 | 15 | 19 | 18 | 6 | 11 | 17 | 10 | 10 | 5 | 3 | 19 | 0 | 8.3 |
| claude | 20 | 18 | 13 | 6 | 16 | 15 | 13 | 5 | 4 | 7 | 12 | 10 | 3 | 2 | 20 | 0 | 6.2 |
| gemini | 20 | 14 | 7 | 9 | 10 | 12 | 9 | 3 | 3 | 10 | 8 | 8 | 1 | 0 | 17 | 1 | 4.7 |
| google_ai | 18 | 18 | 13 | 9 | 14 | 16 | 16 | 4 | 10 | 15 | 12 | 11 | 5 | 5 | 18 | 0 | 8.2 |
| perplexity | 20 | 19 | 10 | 0 | 9 | 19 | 13 | 0 | 0 | 8 | 1 | 1 | 0 | 0 | 19 | 1 | 4.0 |

The first run used the looser `(pedestrian|bicycle|cyclist)` form for ped; the stricter
form shown gives the same per-engine counts (11, 4, 3, 10, 0), so every column, and the
average (the sum of the columns over n), is the same under either form.

## Query 2: answer length (context)

```sql
-- same p and r as Query 1
select coalesce(llm,'ALL') llm, count(*) n, round(avg(length(t))) avg_len,
 percentile_cont(0.5) within group (order by length(t))::int med_len
from r group by rollup(llm) order by llm;
```

| Engine | n | avg length | median length |
|---|---|---|---|
| ALL | 97 | 4,173 | 3,216 |
| chatgpt | 19 | 4,389 | 4,283 |
| claude | 20 | 3,044 | 3,042 |
| gemini | 20 | 3,203 | 3,134 |
| google_ai | 18 | 9,338 | 9,884 |
| perplexity | 20 | 1,419 | 1,454 |

## Query 3: passages read by hand

For each of wrongful death, medical malpractice and truck, every matching answer was
listed with up to three passages (about 100 characters before the match), and the total
number of matches. An answer counts as firm-attached when at least one passage attaches
the case type to a named firm or a named lawyer at a firm (a firm description, a "best
fit" line, a case result, or a "case type: firm" pairing). Generic mentions are advice to
the buyer: "depends on whether your case is", "compare firms on case type", "I can narrow
this to the best firms for". Where all listed passages were generic, the answer had no
further match (match count checked).

```sql
with p as (...same...),
r as (select a.id, a.llm, regexp_replace(replace(a.response_text, chr(92), ''), '\s+', ' ', 'g') t
      from ai_results a join p on p.id = a.prompt_id
      where p.rn = 1 and a.client_id between 28 and 47 and a.status = 'ok'
        and a.checked_at < '2026-11-01')
select llm, id,
 (select count(*) from regexp_matches(t, 'wrongful death', 'gi')) nm,
 (select string_agg(x[1], ' || ') from (select regexp_matches(t,
   '(.{0,100}\mwrongful death.{0,20})', 'gi') x limit 3) q) s
from r where t ~* '\mwrongful death' order by llm, id;
-- the same for '\mmedical (malpractice|negligence)' and
-- '\m(truck|trucking|18-wheeler|semi-truck|tractor-trailer)'
```

| Engine | Wrongful death | Medical malpractice | Truck |
|---|---|---|---|
| chatgpt | 16 of 19 | 11 of 15 | 14 of 17 |
| claude | 15 of 15 | 15 of 16 | 12 of 13 |
| gemini | 12 of 12 | 10 of 10 | 6 of 7 |
| google_ai | 16 of 16 | 13 of 14 | 13 of 13 |
| perplexity | 1 of 19 | 2 of 9 | 2 of 10 |
| ALL | 60 of 81 | 51 of 64 | 47 of 60 |

Generic only (not firm-attached), by id:
- Wrongful death: chatgpt 2778, 2898, 2963; perplexity every id except 2671.
- Medical malpractice: chatgpt 2568, 2713, 2778, 2898; claude 2715; google_ai 2967
  (a heading introducing specialists, counted generic to be conservative); perplexity
  every id except 2671 and 2881.
- Truck: chatgpt 2568, 2608, 2778; claude 2485; gemini 2389; perplexity every id except
  2571 and 2691.

Perplexity answers with any of the three attached to a firm: 2571, 2671, 2691, 2881 (4 of
20). Its 18 generic wrongful death answers use the case type in a "compare firms on" list
or an offer to narrow the list.

Four engines without Perplexity: wrongful death 59 of 62, medical malpractice 49 of 55,
truck 45 of 50.

## Drop condition

Brief: drop if the firm-attached count removes the engine spread. It does not: the
spread widens (Perplexity 1 of 19 against 59 of 62 for the other four on wrongful death).
