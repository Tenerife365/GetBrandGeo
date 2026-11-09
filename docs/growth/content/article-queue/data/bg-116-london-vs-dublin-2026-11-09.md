# BG-116 data record: London and Dublin, the same questions, which names appear in both (2026-11-09)

Topic 16 `london-vs-dublin` from `topics.md`. Read only; SELECT and WITH only. No person's name,
address or phone number is recorded here: the repository is public. Law and wealth firms are
recorded as counts, because most carry founders' surnames.

## Basis

- Second basis: clients 10 (London) and 16 (Dublin), research accounts collected 2026-07-10,
  `ai_results.status = 'ok'`, joined to `prompts` on `prompt_id`, matched by `prompts.position`.
- Engines claude, gemini, meta and perplexity only. ChatGPT answered in London and not in Dublin
  (API errors that day), so it is left out on both sides. Meta was retired on 2026-07-16; its rows
  are reported as a past engine.
- London has duplicate claude rows (2 to 4 per position). One row per client, position and engine:
  `distinct on (client_id, position, llm) ... order by client_id, position, llm, checked_at desc`.
  So n = 4 answers per city per question, 64 answers in all. Counts, never percentages.
- Count source: `response_text`, links removed by `regexp_replace(t,'(https?://|www\.)\S+',' ','g')`,
  backslashes stripped. `citations` and `competitors_mentioned` not used.

## The questions (prompts.text)

| Pos | London | Dublin | Wording |
|---|---|---|---|
| 1 | Best employment law firms in London | Best employment solicitors in Dublin | close |
| 2 | Which London law firm should I use for a commercial contract dispute? | Which Dublin law firm should I use for a commercial contract dispute? | same |
| 3 | Best UK-based CRM software for a small business in London | Top SaaS CRM tools used by Dublin startups | different: London asks for UK-based |
| 4 | Top project management SaaS tools used by London startups | Best project management software for Irish startups | close |
| 5 | Best independent financial advisors in London | Best financial advisors in Dublin | close |
| 6 | Which London wealth management firms are recommended for expats? | Which Dublin wealth management firms are recommended for expats? | same |
| 7 | Best fintech apps for business banking in the UK | Best fintech apps for business banking in Ireland | same apart from country |
| 8 | Top-rated solicitors for property purchase in London | Top-rated solicitors for property purchase in Dublin | same |

## Software and banking (positions 3, 4, 7): brand list with word boundaries

Patterns, case insensitive: `\mhubspot\M`, `\msalesforce\M`, `\mpipedrive\M`, `\mzoho\M`, `\mcapsule\M`,
`\mfreshsales|\mfreshworks`, `\mmonday`, `\masana\M`, `\mclickup\M`, `\mtrello\M`, `\mjira\M`,
`\mbasecamp\M`, `\mnotion\M`, `\mwrike\M`, `\mlinear\M`, `\msmartsheet\M`, `\mrevolut\M`, `\mmonzo\M`,
`\mstarling\M`, `\mtide\M`, `\mwise\M`, `\maib\M`, `\mbank of ireland\M`, `\mn26\M`, plus a longer
list of names that were found in one answer or none (Copper, Insightly, Nimble, Airtable, Teamwork,
Airwallex, ANNA, Countingup, Payoneer, Qonto, Stripe, Mettle, Cashplus, Coconut, Pleo, Soldo, PTSB).

Hand check: every hit for Capsule, monday, Freshsales, Notion, Linear, Tide, Wise, ANNA and Xero was
read in context. All were recommendations except Xero, which appears in 3 London CRM answers and
2 London banking answers only as an accounting tool the product connects to. Xero is therefore not
counted. (The 2026-11-06 pre-check in topics.md listed Xero as a CRM name; that is corrected here.)
One London Notion hit sits next to a venture fund of a similar name; the same answer also
recommends Notion the tool, so the count stands.

Results, answers out of 4, London then Dublin. "Named twice" = named in 2 or more answers in at
least one city.

CRM (pos 3): Capsule 4 and 0, Zoho 3 and 3, HubSpot 2 and 4, Pipedrive 2 and 4, Freshsales 2 and 2,
Salesforce 1 and 4, monday.com 1 and 2. Named twice: 7; in both cities: 6.
Project management (pos 4): Asana 4 and 3, ClickUp 4 and 3, Trello 4 and 3, monday.com 3 and 4,
Jira 3 and 3, Basecamp 3 and 3, Notion 3 and 1, Wrike 2 and 1, Linear 2 and 0, Smartsheet 0 and 2.
Named twice: 10; in both cities: 8.
Business banking (pos 7): Revolut 4 and 4, Monzo 4 and 0, Starling 4 and 0, Tide 3 and 1,
Wise 2 and 3, AIB 0 and 3, N26 0 and 3, Bank of Ireland 0 and 2. Named twice: 8; in both cities: 3
(Revolut, Tide, Wise). Revolut is the only one in all 8 answers.

Software total: 14 of the 17 names named twice appear in both cities.

## Law and advice (positions 1, 2, 5, 6, 8): read by hand

Every firm named in the 40 answers was listed by hand from the answer text (bold names first, then
the 4 answers with no bold names were read in full: London gemini pos 2, London claude pos 8,
Dublin meta pos 2 and 6). Each firm was then searched in the other city's answers to the same
question with a case-insensitive pattern on its distinctive word (for example `beachcroft`,
`brewin`, `evelyn partners`, `rathbone`, `goodbody`, `mccann`, `matheson`, `farrer`, `davy`,
`rockwell`, `titan wealth`), 120 patterns across the five questions.

| Pos | Question | Firms named in both cities' answers | Answers naming them, London and Dublin |
|---|---|---|---|
| 1 | Employment law | 1 (a large UK firm; the Dublin answer named its Dublin office) | 1 and 1 |
| 2 | Commercial contract dispute | 0 | |
| 5 | Financial advisors | 0 | |
| 6 | Wealth management for expats | 3 (UK wealth managers; each Dublin mention describes its Irish office or presence) | 1 and 1 each |
| 8 | Property purchase solicitors | 0 | |

Total: 4 firms in both cities across 5 questions, none of them named by more than one engine in
either city. Firm names are kept out of this public file.

Answers that named no firm: London gemini pos 2 opened by saying it could not recommend a specific
firm, then named four firms as examples of how a legal directory ranks them; it is counted with
those four. London perplexity pos 5 named only directories (Unbiased, VouchedFor, a regulator's
search tool) and no advisor.

Context from the same answers, by the most-named local firm: commercial dispute, 1 London firm in
4 of 4 answers, 5 Dublin firms in 4 of 4 answers each. Wealth for expats, 1 Dublin firm in 4 of 4,
the most-named London firm in 3 of 4. These per-city figures overlap what
`ai-visibility-for-london.html` and `ai-visibility-for-dublin.html` already report; the article
uses only the cross-city overlap, which neither page reports.

## Queries

Software and banking:

```sql
with r as (select distinct on (a.client_id, p.position, a.llm) a.client_id, p.position, a.llm, a.id,
  replace(regexp_replace(a.response_text,'(https?://|www\.)\S+',' ','g'), chr(92), '') t
  from ai_results a join prompts p on p.id=a.prompt_id
  where a.client_id in (10,16) and a.status='ok' and a.llm in ('claude','gemini','meta','perplexity')
  order by a.client_id, p.position, a.llm, a.checked_at desc),
b(brand,pat,pos) as (values
 ('HubSpot','\mhubspot\M',3),('Salesforce','\msalesforce\M',3),('Pipedrive','\mpipedrive\M',3),
 ('Zoho','\mzoho\M',3),('Capsule','\mcapsule\M',3),('Freshsales','\mfreshsales|\mfreshworks',3),
 ('monday.com','\mmonday',3),
 ('Asana','\masana\M',4),('ClickUp','\mclickup\M',4),('Trello','\mtrello\M',4),('Jira','\mjira\M',4),
 ('Basecamp','\mbasecamp\M',4),('monday.com','\mmonday',4),('Notion','\mnotion\M',4),
 ('Wrike','\mwrike\M',4),('Smartsheet','\msmartsheet\M',4),('Linear','\mlinear\M',4),
 ('Revolut','\mrevolut\M',7),('Monzo','\mmonzo\M',7),('Starling','\mstarling\M',7),('Tide','\mtide\M',7),
 ('Wise','\mwise\M',7),('AIB','\maib\M',7),('Bank of Ireland','\mbank of ireland\M',7),('N26','\mn26\M',7))
select b.pos, b.brand,
 sum(case when r.client_id=10 and r.t ~* b.pat then 1 else 0 end) london,
 sum(case when r.client_id=16 and r.t ~* b.pat then 1 else 0 end) dublin
from b join r on r.position=b.pos group by 1,2 order by 1, 3+4 desc;
```

Law and advice, firm lists (bold spans per answer, then read by hand):

```sql
with r as (...same r as above...)
select position, client_id, llm, length(t) len,
  (select string_agg(distinct m[1], ' | ') from regexp_matches(t,'\*\*([^*]{2,60})\*\*','g') m) bold
from r where position in (1,2,5,6,8) order by position, client_id, llm;
```

Cross-city check, one row per firm pattern (120 patterns; the full list is the firm list above):

```sql
with r as (...same r as above...),
b(pos,brand,pat) as (values (1,'x','beachcroft'), (6,'x','brewin'), (6,'x','evelyn partners'),
  (6,'x','rathbone'), ...)
select b.pos, b.brand, sum((r.client_id=10 and r.t ~* b.pat)::int) london,
       sum((r.client_id=16 and r.t ~* b.pat)::int) dublin
from b join r on r.position=b.pos group by 1,2 having sum((r.t ~* b.pat)::int)>0;
```
