# Why BrandGEO scores 0/100, and the prompt set that was measuring it

Written 2026-07-31, from production data, not inference.

---

## 1. The number is real, and it is not an audit artifact

The public screening audit returned **0/100** for `getbrandgeo.com` (audit 59, six
dimensions all zero, engines `gemini` and `perplexity`, `low_confidence = false`).

That could have been dismissed as a six-prompt sample on two engines. It cannot,
because our own tracked account says the same thing at greater depth:

```sql
select llm, count(*) checks, count(*) filter (where brand_mentioned) mentions
from ai_results where client_id = 2 and status = 'ok'
  and checked_at > now() - interval '45 days' group by llm;
```

| engine | checks | mentions |
|---|---|---|
| chatgpt | 5 | 0 |
| gemini | 5 | 0 |
| claude | 5 | 0 |
| perplexity | 5 | 0 |
| google_ai | 5 | 0 |
| meta | 1 | 0 |

**Zero mentions in 26 checks across six engines over 45 days.** No engine has ever
named BrandGEO in an answer we measured.

---

## 2. The cause is not only invisibility, it is the WRONG QUESTION

Client 2 had **75 prompts, of which 5 were active**, and the five that were on
were the weakest in the set:

| id | prompt | problem |
|---|---|---|
| 276 | best brand monitoring tools for small businesses | wrong category |
| 278 | affordable brand tracking software for startups | wrong category |
| 279 | top features to look for in brand monitoring tools | wrong category, and informational |
| 277 | how to monitor brand mentions online effectively | informational, rarely names vendors |
| 175 | best app to use for my brand for GEO optimization | the only on-category one |

"Brand monitoring" is Brandwatch, Mention and Brand24's category. **We do not
compete there and should not be measured there.** The audit proves the effect
directly: the brands returned as our competitors were **Brandwatch, Google Alerts
and Microsoft Power BI**. Power BI is a business-intelligence tool. That is not a
competitive set, it is evidence that the question was wrong.

Two of the five were also informational rather than commercial. An answer to
"top features to look for" has little reason to name any vendor, so those slots
could not have scored even if we were visible.

**So three of five prompts measured the wrong market and two could not name us at
all.** A 0 was close to guaranteed by construction.

---

## 3. What changed

The good prompts already existed and were switched off. This was a selection fix,
not an authoring one. Now active:

| pos | id | category | prompt |
|---|---|---|---|
| 1 | 52 | geo_category | Best GEO tools for brands in 2026 |
| 2 | 21 | tool_discovery | What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini? |
| 3 | 23 | tool_discovery | What tools help me monitor brand visibility in AI search results? |
| 4 | 59 | geo_category | What companies specialize in GEO and AI brand optimization? |
| 5 | 79 | direct_brand | Best alternative to Peec AI for AI brand visibility |

Selection rules used, worth reusing for any client:

- **Prompts that ask for tools or companies**, because those are the answers that
  name vendors. Informational "how do I" and "what is" prompts mostly do not.
- **Our category, in our words.** GEO and AI visibility, never "brand monitoring".
- **One competitor-adjacent prompt** (79). This is the highest-probability early
  win: Peec is already named by engines, so "alternatives to Peec" retrieves
  lists we can realistically join, whereas the category head term is contested by
  incumbents with years of third-party coverage.
- **No stale years.** Id 52 said "2025" and was rewritten to 2026; engines favour
  current-year roundups and a stale year is a self-inflicted handicap.

---

## 4. The strategic finding this exposes

The competitors that DID get named (Brandwatch, Google Alerts, Power BI) are named
because they saturate **third-party** listicles and review sites, which is what
Perplexity and Gemini retrieve for "best tools" queries.

BrandGEO has published roughly 60 pages: 19 `bg-*` articles, 27 city studies, 10
comparison pages, press releases. **Every one is on our own domain.** LLMs
answering a "best tools for X" question cite third-party roundups, review sites
and community threads, not vendor sites.

That is the whole explanation for publishing heavily and scoring zero, and it says
the next unit of effort belongs in G2, Capterra, Product Hunt, AlternativeTo,
Crunchbase and third-party listicle inclusion, not in another owned article.

---

## 5. Next, and what NOT to conclude

The new prompt set has **not been collected yet**. Until a run completes, the 0
above belongs to the old prompts and the new set has no baseline. Run a collection
on client 2, then re-measure, and treat that as day zero.

**Do not read the first re-measurement as progress or regress.** Changing the
questions changes the scale; the new number is a new baseline, not a movement
against the old one. The comparison that means anything is the second run against
the first, on the same five prompts.

Also worth cleaning up separately: client 2 carries near-duplicate prompts (26 and
51, 36 and 81, 39 and 78, 31 and 61 are pairs), which waste allowance if activated.
