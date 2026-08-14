# Outbound: ICP, Evidence Machine, sequence, and the deliverability gate

> **NOTHING IN SECTION 3 MAY BE SENT TODAY. `trybrandgeo.com` returns NXDOMAIN
> as of 2026-08-14 (MEASURED, `nslookup -type=NS trybrandgeo.com 8.8.8.8`).
> Earliest legal first send: floor Wed 2026-08-19, planned Fri 2026-08-21, and
> only after mail-tester scores 9.0 or higher on both inboxes. No exception, no
> single test send, no warm intro through the tool.**

Written 2026-08-14 by `gtm-outbound`. Sprint 17 Day 2 (Day 1 = 2026-08-13,
Day 17 = 2026-08-29). Sits in the plan's "Days 4 to 9" block and gates the
"Days 10 to 17" sell block (`docs/growth/sprint17/PLAN-2026-08-13.md`).

Authorities this file sequences against and does not restate:
`docs/growth/outbound-infra.md` (the 738-line infrastructure build-out),
`docs/growth/GTM-TEAM.md`, `docs/AGENT-OS.md`,
`docs/audit/gtm-channel-audit-2026-08-13.md`.

Every claim below is tagged MEASURED (with the URL, file:line, SQL, or DNS
lookup that produced it, dated) or INFERRED. Reply rates are always INFERRED:
zero cold emails have ever been sent from this company, so there is no history
to infer from.

---

## 0. The dependency clock

What must be true, on what date, for a first send to happen inside the sprint.

Day of week is derived from `outbound-infra.md`'s own calendar, which labels
2026-08-06 as Thursday. So: 08-13 Thu (D1), **08-14 Fri (D2, today)**, 08-15
Sat, 08-16 Sun, 08-17 Mon (D5), 08-18 Tue (D6), 08-19 Wed (D7), 08-20 Thu (D8),
08-21 Fri (D9), 08-22 Sat, 08-23 Sun, 08-24 Mon (D12), 08-25 Tue, 08-26 Wed,
08-27 Thu, 08-28 Fri (D16), 08-29 Sat (D17).

| Date | Sprint day | What must be true | Owner | Cost of slipping |
|---|---|---|---|---|
| **Fri 08-14** | D2 | `trybrandgeo.com` registered (infra STEP 1), two Workspace inboxes live (STEP 2), six DNS records saved (STEP 3), root redirect set (STEP 4), Saleshandy warmup **ON** for both inboxes (STEP 5) | Constantin | **One day of slip = one day later first send, exactly. This is the only row on the clock with no slack.** |
| Fri 08-14, +15 min | D2 | Gate items 7.1 (four DNS lookups) and 7.2 (301 redirect) pass | Constantin | Warmup does not truly start until DKIM resolves |
| Sat 08-16 | D4 | ICP list at 250 sourced rows, section 1 fields filled except the audit columns | Constantin | The list, not the domain, becomes the blocker |
| Mon 08-17 | D5 | `INTERNAL_AUDIT_KEY` to hand; Evidence Machine dry run on three domains you own or have permission for | Constantin | First send has nothing to personalise against |
| **Tue 08-18** | D6 | **mail-tester run on both inboxes** (four days of warmup elapsed, infra 7.3) | Constantin | Gate slips, send slips |
| Wed 08-19 | D7 | **FLOOR first send.** Only if 08-18 scored 9.0+ on both inboxes | Constantin | If below 9.0: HOLD, diagnose, re-test. Never send under the threshold |
| Thu 08-20 | D8 | Evidence Machine batch for the first cohort, run the evening before each sending day | Constantin | Stale numbers in a live email |
| **Fri 08-21** | D9 | **PLANNED first send** (the seven-day reading of the warmup window) | Constantin | |
| Fri 08-28 | D16 | Last sending day inside the sprint (08-29 is a Saturday) | Constantin | |
| Sat 08-29 | D17 | Sprint ends. Touch 3 for the earliest cohort lands 2026-08-31, after the sprint. This is correct and is not compressed to fit | | |

### The warmup arithmetic, stated once

`outbound-infra.md` (line 8): a brand new domain needs **5 to 7 calendar days**
of warmup before it can carry real cold volume. The clock starts the day the
domain is registered *and* warmup is switched on, not the day it is registered.

- Registration 2026-08-14, plus 5 days = **2026-08-19**. This is the floor.
- Registration 2026-08-14, plus 7 days = **2026-08-21**. This is the plan.
- The mail-tester gate sits at four days of warmup (infra 7.3), so **2026-08-18**.

**Plan against 08-21 and treat 08-19 as best case.** The two days are cheap and
a burned domain is not recoverable inside a 17-day sprint. Thirteen days were
already lost to the domain sitting unregistered from 07-31 to 08-14; the
response to that is not to spend the buffer, it is to stop losing days.

### What the channel can actually deliver inside the sprint

Sending days, weekends excluded per the infra ramp table:

- Floor case, first send Wed 08-19: Wed 19, Thu 20, Fri 21, Mon 24, Tue 25,
  Wed 26, Thu 27, Fri 28. **Eight sending days.**
- Planned case, first send Fri 08-21: Fri 21, Mon 24, Tue 25, Wed 26, Thu 27,
  Fri 28. **Six sending days.**

Per-inbox ramp 10, 15, 20, then 25 as the ceiling, two inboxes:

- Floor case: 20 + 30 + 40 + 50 + 50 + 50 + 50 + 50 = **340 messages**
- Planned case: 20 + 30 + 40 + 50 + 50 + 50 = **240 messages**

Messages, not prospects: follow-ups count against the same cap. At a three
touch sequence that is roughly **140 to 200 distinct prospects first-touched**
inside the sprint.

**Expected replies: 1 to 10 inside the sprint. INFERRED**, from a 1 to 5
percent first-touch reply range that is an industry band and not a BrandGEO
measurement. Expected self-serve subscriptions attributable to cold email
inside the sprint: **0 to 2. INFERRED.** This matches the plan's own realistic
channel ceiling (`PLAN-2026-08-13.md` section 1) and is written down here so
nobody discovers it at the Day 17 retro.

### Two rulings that follow from the arithmetic

**1. Do not create inboxes 3 and 4.** `outbound-infra.md` STEP 5 asks for them
by Day 12 because the old 30-day plan reached 70 sends a day. This sprint never
exceeds 50 a day and only for three days. Two inboxes are sufficient. Saves two
Workspace seats and a week of babysitting.

**2. The Evidence Machine is not blocked on any of this, and that is the most
important line in this document.** It runs today, against a live production
endpoint, with no domain and no warmup (section 2). Its highest-value use
inside this sprint is **founder-led sales**, which the plan says carries G1:
Constantin can run it on ten named prospects this afternoon and put the result
in a LinkedIn message, a warm intro, or a call. Zero steps between the asset
and a real conversation, available on Day 2 rather than Day 9. Cold email is
the second-best use of the same asset and it arrives a week later.

---

## 1. The ICP, and how the list gets built

### 1.1 The three tests

A company is a target only if it passes all three. Two out of three is a
disqualification, not a maybe.

| Test | What it means | How it is observed from outside |
|---|---|---|
| **Pain** | AI answer engines do not name them when a buyer asks a question in their category | Measured, per company, by the Evidence Machine (section 2). This is the only test that is measured rather than judged |
| **Authority** | One person can approve EUR 29 to EUR 299 a month without a procurement process | Company shape on their own site: team page under roughly 50 people, no investor relations page, no careers page with 100+ open roles |
| **Already buying visibility** | They already spend money and attention on being found | Their own site: blog posts in the last 90 days, or a comparison / alternatives page, or a published pricing page. A company that does not care about being found does not feel this pain |

The third test is the one most easily skipped and the one that decides reply
rate. A measured zero shown to somebody who has never thought about search is
a curiosity. Shown to somebody who is already paying for SEO, it is a hole in
something they are already buying.

### 1.2 The segments, and the evidence that the problem exists in each

Ranked by fit with a EUR 29 to EUR 299 self-serve offer.

---

#### Segment C1 (primary): vertical B2B SaaS, 2 to 50 people, USD/EUR 20 to 200 per seat, selling into a named niche

**Evidence the problem exists here. MEASURED 2026-08-14 by SQL against
`prospect_audits` (63 rows with `status = 'ready'`, window 2026-07-09 to
2026-08-08):**

- **31 of 63 audited domains scored exactly 0.** Neither Gemini nor Perplexity
  named them on any of four buyer questions. Nothing sits in the 1 to 24 band:
  a company is either absent or it is somewhere.
- The niche beats the horizontal, and it is not close. `legal practice
  management software`, n=5, three zeros, mean score **19.6**. `email marketing
  software`, n=11, two zeros, mean score **53.5**. Crowded horizontal
  categories have incumbents the engines have learned. Named verticals do not.
- **All 31 zero-score audits also carry at least one named competitor**
  (`competitor_flags`, mean 3.8 per audit, non-empty on 57 of 63). So for every
  single qualified prospect in this segment the sharpest sentence in the email
  is available and true: the engine named somebody, and it was not you.

**Caveat, stated because it changes how the number should be used.** Those 63
audits are 55 internal and 8 public across 41 distinct domains. It is not a
random sample of this segment, so **49 percent is a planning estimate, not a
population rate. INFERRED** from a MEASURED but non-random sample.

**Why the offer fits:** they already run content and SEO, so test 3 passes by
construction. One founder or one head of marketing decides. EUR 29 is below any
approval threshold that exists at that size. And the free audit speaks their
language on the first read, because "we are not in the answer" is a sentence
they already understand.

**Where the rows come from:** review-platform category pages read by a human in
a browser (company name and URL only), public conference and trade-show
exhibitor lists for the vertical, public industry association member
directories, and the "alternatives to X" pages published by the incumbents. The
last of those is the highest-yield source and the reason is structural: an
incumbent's alternatives page is a hand-curated list of smaller in-category
companies, which is exactly the shape of this segment.

---

#### Segment B1 (secondary, founder-led rather than sequenced): immigration and personal injury law firms in named US metros

**Evidence the problem exists here. MEASURED, BrandGEO's own published city
research, collection dates 2026-07-10 (EU) and 2026-07-24/25 (US):**

| Finding | City | Source |
|---|---|---|
| Immigration law: no cross-engine overlap at all, the most fragmented category measured | San Francisco | `brandgeo/web/ai-visibility-for-sanfrancisco.html:334` |
| Immigration law: no overlap at all, most fragmented | Tampa | `brandgeo/web/ai-visibility-for-tampa.html:332` |
| Immigration law: fragmented, maximum 2 of 4 engines | New York | `brandgeo/web/ai-visibility-for-newyork.html:341` |
| Personal injury law: fragmented, maximum 2 of 4 engines | New York | `brandgeo/web/ai-visibility-for-newyork.html:342` |
| "Institutions beat individuals" and "if you are an independent professional or boutique brand, expect a harder fight" | New York | `ai-visibility-for-newyork.html:352`, `:368-372` |

**Read that metric correctly and do not overstate it in an email.** Cross-engine
consensus fragmentation means the engines named *different* firms, not that
they named nobody. The honest reading, and the one the copy must use: the
category has no settled answer yet, so an individual firm is absent from most
engines most of the time, and the seat is still open.

**Why this is a founder-led list and not a sequenced one:** the budget is
there and the pain is real, but personal injury inboxes are among the most
solicited on the internet, and a cold sequence into them buys spam complaints
on a two-day-old domain. Immigration is materially less saturated and is the
half of this segment worth sequencing if any of it is.

---

#### Segment A1 (third, founder-led only): independent real estate brokerages and agent teams in named US metros

**Evidence the problem exists here. MEASURED, published city research:**

| Finding | Cities | Source |
|---|---|---|
| Real estate agents: **no cross-engine overlap at all, 0 of 5**, the most fragmented category measured | Dallas, Denver, Philadelphia, Seattle | `ai-visibility-for-dallas.html:334`, `-denver.html:333`, `-philadelphia.html:334`, `-seattle.html:333` |
| Real estate agents: 2 of 5, most fragmented in that city | Chicago, Detroit, Houston, Los Angeles, Minneapolis, San Diego, Washington DC, Phoenix, San Antonio, San Francisco | `ai-visibility-for-chicago.html:334` and the nine equivalents |
| Real estate brokers: 3 of 5 for the brand, **0 of 5 for any individual** | Miami | `ai-visibility-for-miami.html:334` |

This is the strongest published evidence BrandGEO owns for any segment. It is
ranked third anyway, because an independent agent is a weak fit for a
self-serve monthly SaaS subscription and the disqualification rate on tests 2
and 3 will be high. Hand it to Constantin as a founder-led list, not a
sequence.

---

### 1.3 Disqualifiers

Every one of these is checked before a domain is audited, except D4 which is
the audit result itself. Checking first saves EUR 0.224 per rejected row.

| # | Disqualifier | Why | Evidence |
|---|---|---|---|
| **D1** | Anyone in the AI-visibility or GEO tooling category | They are competitors, not prospects | MEASURED: category `AI visibility intelligence`, n=6, **all six scored 0**. Precedent: the SlateHQ competitor signup |
| **D2** | Brand name that is a common English word or a generic two-word phrase | `analyseResponse` matches aliases as substrings, so a generic name produces a false positive. A false "you were named" is as damaging as a false zero | `netlify/functions/_analysis.js`, `matchesAlias` |
| **D3** | No extractable brand name from the homepage | `buildProspectAliases` falls back to the bare domain root, which is the documented false-zero-score bug | `netlify/functions/audit-domain.js:85-97`. The row is flagged `low_confidence`; MEASURED, 3 of 63 audits carry it |
| **D4** | Evidence Machine score of 50 or above, **or** empty `competitor_flags` | There is no pain to show, and no competitor to name. Sending anyway turns a proof email into a pitch email | MEASURED: 23 of 63 audits scored 50 or above |
| **D5** | Enterprise shape | Procurement kills a EUR 29 decision, and they buy Profound or Peec instead | Their own site: IR page, 100+ open roles, "request a demo" with no published price |
| **D6** | No blog post in 90 days and no comparison or alternatives page | Test 3 fails. They are not buying visibility | Their own site |
| **D7** | Segments with **proven good** visibility | Leading with a problem claim into a company the engines already name unanimously destroys credibility on the first line | MEASURED, 5 of 5 unanimous: property management (Chicago, Baltimore, Boston, Minneapolis, San Diego), hospital systems (Houston, Boston, Philadelphia), logistics software (Atlanta), lobbying (Washington DC), startup accounting (San Francisco) |
| **D8** | No business contact address published on their **own** site | See 1.5. No address is invented, guessed, or bought | |
| **D9** | On the suppression list | | |

### 1.4 The row schema

One row per company. These field names are the merge tokens used verbatim in
section 3, so the list and the copy cannot drift apart.

| Field | Filled by | When | Notes |
|---|---|---|---|
| `company_name` | Constantin | sourcing | as the company writes it |
| `domain` | Constantin | sourcing | bare, no protocol, no www |
| `public_url` | Constantin | sourcing | their homepage |
| `segment` | Constantin | sourcing | C1, B1 or A1 |
| `qualifying_signal` | Constantin | sourcing | the observable that made them a candidate, in one clause |
| `signal_source_url` | Constantin | sourcing | **the exact page the signal was read from.** A row with no source URL is not a row |
| `named_role` | Constantin | sourcing | "Founder", "Head of Marketing". A role, from their own about or team page |
| `first_name` | Constantin | sourcing | only if published by the company itself, on its own site |
| `contact_address` | **Constantin only** | sourcing | see 1.5 |
| `contact_source_url` | **Constantin only** | sourcing | the exact page on their own site where that address is published |
| `audit_token` | Evidence Machine | batch | `prospect_audits.token` |
| `report_url` | Evidence Machine | batch | `https://app.getbrandgeo.com/audit/<token>` |
| `ai_score` | Evidence Machine | batch | `prospect_audits.ai_score` |
| `category` | Evidence Machine | batch | `prospect_audits.category`, the engine's own words for their business |
| `top_prompt` | Evidence Machine | batch | `competitor_flags[0].prompt` |
| `top_competitor` | Evidence Machine | batch | `competitor_flags[0].competitor_name` |
| `top_engine` | Evidence Machine | batch | `competitor_flags[0].engine`, rendered as Gemini or Perplexity |
| `run_date` | Evidence Machine | batch | the date the audit actually ran |
| `qualified` | computed | batch | `ai_score < 50` AND `competitor_flags` non-empty AND NOT `low_confidence` |
| `disqualified_reason` | computed | any | D1 to D9 |
| `suppressed` | Constantin | on reply | set the same day an opt out arrives |

### 1.5 The contact address rule, and it is absolute

**No agent, including this one, sources a contact address.** Rows carry a
company, a public URL, an observable signal, and a named role. That is the
whole of what an agent may compile (`GTM-TEAM.md` section 3, and this seat's
standing scope limit).

The address is filled by Constantin, from **the company's own published contact
page**, and the row records the exact URL where it was published. Not from a
third-party enrichment tool, not from a pattern guess, not from an email
verifier's suggestion, not assembled across sources.

Two consequences worth accepting rather than working around:

1. Some published addresses will be `info@` or `hello@`. `outbound-infra.md`
   STEP 2 notes those are filtered harder. That is a real cost and it is the
   correct trade against inventing a personal address.
2. A company with no published address is disqualified (D8). It will remove
   real prospects. Accept it.

The lawful basis for writing to a business address the business itself
published, with the sender's identity disclosed and a working opt out in every
message, is legitimate interest. **This is not legal advice.** If Constantin
wants certainty before the first send, that is a question for the accountant or
a lawyer, and it is cheap to ask this week.

### 1.6 List size and the sourcing order

The sprint needs roughly **140 to 200 qualified rows** first-touched. At a
measured-but-non-random 49 percent zero-score rate, and allowing for D1 to D9
attrition before the audit, source **300 to 350 candidate rows** to land there.

Build in this order, because the first two are free and already measured:

1. **The two warmest rows in the company.** MEASURED 2026-08-14: `prospect_leads`
   holds **2 rows** and `prospect_audits` holds **2 public audits with a captured
   email**. These people asked for an audit and gave an address. They are not
   cold and they must not enter this sequence. Hand them to Constantin as a
   founder-led follow-up today. Two is a small number and it is also the only
   inbound this company has ever had.
2. **The 180 competitor names already measured.** MEASURED 2026-08-14: 180
   distinct `competitor_name` values across the audits. These companies are
   **proven visible**, so they are disqualified as targets. Their value is as a
   category map and as the seed for source 3, because a visible incumbent's
   alternatives page lists the invisible ones.
3. Incumbent "alternatives to X" pages, for segment C1.
4. Review-platform category pages, read manually.
5. Trade-show exhibitor lists and association directories.

---

## 2. The Evidence Machine

**The concept:** the prospect receives a measurement of their own brand, not a
pitch. The number is theirs, it was really taken, and if it is wrong we say so.

### 2.1 The finding that matters most: it already exists

The Evidence Machine has been treated as unbuilt since 2026-07-31. It is not.
Every piece of it is in production today and **needs no new backend code and no
Netlify deploy.**

**MEASURED, verified externally 2026-08-14 with zero spend:**

```
$ curl -sS https://app.getbrandgeo.com/.netlify/functions/get-audit-report
{"error":"Missing token"}                        # HTTP 400, matches get-audit-report.js:29

$ curl -sS -o /dev/null -w "%{http_code}" \
    https://app.getbrandgeo.com/.netlify/functions/audit-domain
405                                              # matches audit-domain.js:47-49
```

**MEASURED by SQL 2026-08-14:** the internal path is not theoretical. It has
already run **55 internal audits** across 41 distinct domains, lifetime spend
EUR 15.31.

The three pieces:

| Piece | What it is | Where |
|---|---|---|
| **Generation** | `POST /.netlify/functions/audit-domain` with the `X-Internal-Key` header | `netlify/functions/audit-domain.js` |
| **Storage** | `prospect_audits`. An internally created row is written `unlocked: true` and `created_via: 'internal'` | `audit-domain.js:113-114` |
| **Rendering** | `https://app.getbrandgeo.com/audit/<token>`, public and unauthenticated, outside `PrivateRoute` | `src/App.tsx:106`, `src/pages/AuditReport.tsx` |

**Because internal rows are written `unlocked: true`, the report URL shows the
prospect the full breakdown with no email gate and no form.** That is the
delivery mechanism, and it already works.

An internal caller also bypasses the origin check, the 3-per-IP daily public
limit, and the 100-per-hour global circuit breaker (`audit-domain.js:66`,
`_prospect_guard.js:106-114`). It does **not** bypass the monthly budget
(`audit-domain.js:56`), which is correct and is the constraint in 2.4.

### 2.2 What is measured, and by which engines

Two depths exist and only two. There is no way to request a custom engine set.

| | Screening | Full |
|---|---|---|
| Engines | **Gemini, Perplexity** | ChatGPT, Gemini, Claude, Perplexity, Google AI Mode |
| Prompts | 4 | 6 |
| Calls | 8 | 30 |
| Runs | synchronously, inside 26s | background, poll for `ready` |
| **Cost written to budget** | **EUR 0.2240** | **EUR 1.1720** |

Cost is MEASURED from source arithmetic, not estimated:
`estimateAuditCost` (`_prospect_engines.js`) computes
`sum(ENGINE_COST_EUR) * prompts * 1.5 + 0.002`.
`ENGINE_COST_EUR` (`_cost.js:215`): gemini 0.032, perplexity 0.005, chatgpt
0.014, claude 0.033, google_ai 0.046.
Screening: `(0.032 + 0.005) * 4 * 1.5 + 0.002 = 0.2240`.
Full: `(0.014 + 0.032 + 0.033 + 0.005 + 0.046) * 6 * 1.5 + 0.002 = 1.1720`.
The screening figure reconciles with the roughly EUR 0.24 real run recorded for
S3 on 2026-07-31, which is the check that the arithmetic is right.

**RULING: cold outbound runs at screening depth. Full depth is reserved for
people who reply.** Full depth is 5.2x the cost and would consume the entire
EUR 200 monthly prospecting budget in under four days of sending. Screening is
the qualification step, full depth is the reward for engagement.

**Screening reliability, MEASURED 2026-08-14 across 62 screening audits: zero
`unavailable` engine states.** Gemini and Perplexity answered every time. The
Evidence Machine will not hand a prospect a broken report. Distribution: Gemini
35 missing / 20 know / 7 partial; Perplexity 33 missing / 19 partial / 10 know.

### 2.3 What the one-pager contains

The rendered page at `/audit/<token>` already shows all of this. The structure
below is a description of what exists, not a redesign.

| Block | Content | Field |
|---|---|---|
| Header | The domain, and the category in the engine's own words | `domain`, `category` |
| The number | AI visibility score, 0 to 100 | `ai_score` |
| Six dimensions | recognition 25%, knowledge 20%, sentiment 15%, accuracy 15%, reach 15%, consistency 10% | `dimensions`, `_score.js:84-91` |
| Per engine | know / partial / missing / **unavailable**, per engine | `engine_states` |
| The gaps | For each: the engine, the exact buyer question, and the competitor named instead | `top_gaps`, `competitor_flags` |
| The evidence | Per prompt and engine: mentioned or not, position, sentiment, and the response snippet | `engine_results` |

**`unavailable` is deliberately not `missing`.** One means we could not reach
the engine, the other means the engine answered and did not name them. The
distinction is enforced in code and commented as such
(`AuditReport.tsx:44-47`). Never collapse the two in copy.

### 2.4 Shown free, and held

**Shown, in full, with no gate:** everything measured. The score, all six
dimensions, both engines, every gap, every competitor named, and the raw
snippets. A prospect who never replies keeps the whole measurement.

**Held, because it is the product and not the measurement:**

1. **Five of the seven engines.** Screening asks Gemini and Perplexity. ChatGPT,
   Claude, Google AI Mode, Google AI Overviews and Grok were not asked.
   And they disagree: **MEASURED 2026-08-14, Gemini and Perplexity returned
   different engine states on 18 of 62 screening audits, 29.0 percent.** Five
   were invisible to Gemini but not Perplexity, three the reverse. So "the two
   I asked" genuinely does not settle it, and that sentence is measured.
2. **Direction.** One run is one day. Whether the number is moving is the
   product, and a single audit cannot show it.
3. **Their own questions.** The four prompts are generated from their homepage,
   not chosen by them.
4. **The fix list.**

### 2.5 The honesty rule

Non-negotiable, and it is the rule this whole channel lives or dies on.

1. **The number shown is that prospect's real measured result, or nothing is
   shown.** No sample report, no illustrative score, no "companies like yours
   typically". If the audit fails, the prospect is dropped from the batch.
2. **If every engine failed, publish nothing.** Already enforced in code:
   `audit-domain.js:240-250` refuses to write a 0/100 scorecard on zero data
   and returns 503, with the comment naming this exact failure.
3. **A `low_confidence` row is never sent.** It means the brand name could not
   be extracted and the score may be a false zero (D3).
4. **The date and the engines are stated in the email itself**, every time. A
   measurement without its window and its instrument is a claim.
5. **Say the limits before the prospect finds them.** One day, two engines, four
   questions we wrote. Volunteering that is what makes the number believable.
6. **If a prospect says the result is wrong, agree publicly and check.** The
   answer is "you may be right, engines move, here is what we asked", never a
   defence of the number.

### 2.6 The operating procedure

Runs the evening before each sending day. Batch size equals the next day's new
first touches, never the whole list.

1. Take the next N unaudited rows where `qualified` is not yet computed.
2. For each, `POST /.netlify/functions/audit-domain` with header
   `X-Internal-Key: $INTERNAL_AUDIT_KEY` and body `{"domain": "<domain>"}`.
   Depth defaults to screening, which is what is wanted. Space the calls a few
   seconds apart. Each returns `{token, status: "ready", teaser}` synchronously.
3. `GET /.netlify/functions/get-audit-report?token=<token>` with the same header
   and record `ai_score`, `category`, `competitor_flags[0]`, `low_confidence`.
4. Apply D3 and D4. Drop the rest of the batch.
5. Write `report_url = https://app.getbrandgeo.com/audit/<token>` and the run
   date onto the row.
6. Reconcile spend: `SELECT round(sum(estimated_cost_eur)::numeric,2)
   FROM prospect_audits WHERE created_at >= date_trunc('month', now());`

**Budget guardrail. MEASURED: `PROSPECTING_MONTHLY_BUDGET_EUR` defaults to
EUR 200 (`_prospect_guard.js:130`), and it is shared with the public free audit
on the homepage.** Cap outbound Evidence Machine spend at **EUR 100 for August**,
which is roughly 440 screening audits, and leave the other EUR 100 for public
traffic. Exceeding the budget does not fail quietly: it returns 429 to the
homepage widget and takes the free audit down for every visitor. That is the
worst possible way to spend the last euro.

Sprint cost at the planned volume: 300 to 350 audits, **EUR 67 to EUR 78**.

### 2.7 What is missing, and who owns it

Three gaps. None blocks the first send. The first is the only one a prospect
would notice.

**G-EM-1, engine labels. `google_ai` and `grok` render as raw strings on a
prospect-facing page.** `ENGINE_LABEL` in `AuditReport.tsx:57` covers chatgpt,
gemini, claude, perplexity and the retired meta, and the lookup falls back to
the raw key (`:248`, `:269`, `:288`). A full-depth report therefore prints
`google_ai: MISSING`. Invisible at screening depth (Gemini and Perplexity are
both labelled), so it does not block the cold sequence, but it will be visible
the first time a reply earns a full-depth run. Owner **`bg-app`**, scope
`brandgeo-dashboard/src/pages/AuditReport.tsx`. Two lines. Add
`google_ai: 'Google AI Mode'` and `grok: 'Grok'`.

**G-EM-2, no batch runner.** Steps 1 to 5 of 2.6 are hand-run curl calls today,
which is entirely workable for 30 a night and needs no deploy, no credits, and
no agent. A script would help at volume. Spec in the packet at section 5. Owner
**`bg-backend`**, with a scope question flagged there.

**G-EM-3, UTM attribution is specified and not built. MEASURED 2026-08-14: zero
occurrences of `utm_source` in `brandgeo/web/site.js`**, against
`docs/growth/channel-attribution-spec.md` which specifies the capture.
**Do not wait for it and do not add UTM parameters to the outbound links.** The
audit token is already unique per prospect and already in the database, so
outbound attribution is one query and needs nothing built:

```sql
SELECT domain, ai_score, created_at
FROM prospect_audits
WHERE created_via = 'internal' AND created_at >= '2026-08-18'
ORDER BY created_at;
```

Adding a tracked query string to a link on a two-day-old sending domain costs
deliverability and buys nothing that this query does not already give.

---

## 3. The sequence

> **HOLD. Not sendable on 2026-08-14. Earliest legal first send Wed 2026-08-19
> (floor) or Fri 2026-08-21 (planned), and only after the section 4 gate passes
> with mail-tester 9.0 or higher on both inboxes.**

### 3.1 Shape

Three touches. Day 0, day +3, day +7, calendar days, shifted to the next
business day if they land on a weekend. Send Tuesday to Thursday where the
choice exists.

**The sequence outlives the sprint and is not compressed to fit it.** The
earliest cohort, first-touched Fri 2026-08-21, receives touch 2 on Tue 08-25
and touch 3 on **Mon 2026-08-31**, two days after Day 17. Later cohorts receive
one or two touches inside the sprint. Squeezing three touches into six days to
make a scoreboard read better is the timing version of raising the daily cap to
hit a number, and `outbound-infra.md`'s standing rule 2 forbids it.

**The cap is total messages per inbox per day, follow-ups included, and
follow-ups take priority over new first touches.** Configure that in the
sending tool. When the cap binds, fewer new prospects enter, not more messages
go out.

### 3.2 Merge tokens, and where each comes from

Every token maps to a field in 1.4. There are no invented tokens and no token
that could render empty into a live message.

| Token | Source | If it is empty |
|---|---|---|
| `{{first_name}}` | published by the company on its own site | **fall back to no name at all**, see 3.3 |
| `{{company}}` | `company_name` | row is not sendable |
| `{{domain}}` | `domain` | row is not sendable |
| `{{category}}` | `prospect_audits.category` | row is not sendable |
| `{{top_engine}}` | `competitor_flags[0].engine`, as "Gemini" or "Perplexity" | row is disqualified under D4 |
| `{{top_prompt}}` | `competitor_flags[0].prompt`, verbatim | row is disqualified under D4 |
| `{{top_competitor}}` | `competitor_flags[0].competitor_name` | row is disqualified under D4 |
| `{{report_url}}` | `https://app.getbrandgeo.com/audit/<token>` | row is not sendable |
| `{{run_date}}` | the date the audit ran, written as "12 August" | row is not sendable |
| `{{t1_date}}` | the date touch 1 was sent | touch 2 is not sent |

**No token is ever guessed to keep a row in the batch.** A row missing a token
is dropped from that send, not patched.

**The first-name rule.** A wrong first name is a worse tell than no first name,
and a first name that was not published by the company is a data-sourcing
violation (1.5). Where `first_name` is empty, the greeting is simply `Hello,`
and nothing else changes. Two greetings, one template.

### 3.3 Touch 1, day 0

**Subject:** `{{top_competitor}} came up, {{company}} did not`

```
Hi {{first_name}},

I run BrandGEO. We measure whether AI answer engines name a company when
someone asks a buying question in its category.

On {{run_date}} I put four buyer questions about {{category}} to Gemini and
Perplexity. One of them was:

  "{{top_prompt}}"

{{top_engine}} answered with a list. {{top_competitor}} was on it. {{company}}
was not, on that question or on the other three.

Your full result is here. Nothing to fill in, no account:
{{report_url}}

It shows which of the two engines named you, where you sat when one did, and
which companies came up instead of you.

Two things it cannot tell you, and I would rather say them than have you find
them. It is one day, and engines change their answers. And it is two engines
of the seven your buyers actually use.

If the result looks wrong to you, reply and tell me. I will check it and say
so either way.

Constantin

Constantin Goane
BrandGEO
https://getbrandgeo.com

If you would rather not hear from me, reply with "no thanks" and I will not
write again.
```

### 3.4 Touch 2, day +3

**Subject:** `the other five engines`

```
Hi {{first_name}},

Following up on the check I sent you on {{t1_date}}. Your result is still
here: {{report_url}}

The part that number does not cover. I asked two engines, Gemini and
Perplexity, on one day. Across the audits we have run, those two disagreed
with each other on 29 percent of the domains we measured: one engine had
never heard of the company and the other had. ChatGPT, Claude and Google's
AI Mode were not asked at all.

The other thing one day cannot show you is direction. Whether you are named
more often than last month or less is the number that tells you whether
anything you publish is working. A single reading cannot have a direction.

That is what the product is. Your own buyer questions, put to the engines
again every week, with the answers kept so the line can move.

Radar is EUR 29 a month: Gemini and Claude, weekly, seven of your questions,
one site. The ladder goes up from there if you want the other engines.

If AI answers are not a priority for you this quarter, say so and I will stop.

Constantin

Constantin Goane
BrandGEO
https://getbrandgeo.com

If you would rather not hear from me, reply with "no thanks" and I will not
write again.
```

**Source for the 29 percent, so it can be defended if challenged:** MEASURED
2026-08-14, SQL against `prospect_audits`, 18 of 62 screening audits returned a
different `engine_states` value for Gemini than for Perplexity. **This number
must be re-run before the first send** and the copy updated to whatever it then
says. The instruction is in the section 4 checklist.

### 3.5 Touch 3, day +7

**Subject:** `last one from me`

```
Hi {{first_name}},

Two things and then I will stop writing.

Your result stays where it is: {{report_url}}. Keep it, forward it, or ignore
it. It cost me a few cents and it is yours either way.

If AI answers are not something {{company}} is worried about, tell me and I
will close the file properly. If they are and the timing is wrong, tell me
when and I will come back then instead of guessing.

Constantin

Constantin Goane
BrandGEO
https://getbrandgeo.com

If you would rather not hear from me, reply with "no thanks" and I will not
write again.
```

### 3.6 What the copy may never say

Checked against `GTM-TEAM.md` section 5 and `AGENT-OS.md` section 7.3. Nothing
above breaches any of these, and no future edit may.

- No customer counts, logos, testimonials, "trusted by", "companies like
  yours". BrandGEO has **one** paying client, anonymised on the homepage, and
  zero self-serve subscriptions.
- No "cheapest". Otterly Lite is USD 29 with 15 prompts and four engines
  including ChatGPT.
- No "most engines per euro". False against Peec at EUR 85.
- No engine-count superlative. AthenaHQ publishes nine.
- No trial language. No trial mechanism exists in the product.
- No deadline or scarcity. The Radar launch price is explicitly not
  time-limited, by ruling.
- No em dashes, no en dashes.
- Banned vocabulary: delve, leverage as a verb, seamless, robust, unlock,
  elevate, game-changing, cutting-edge, revolutionize, "in today's fast-paced".
- **No number in any email that is not that prospect's own measurement or a
  BrandGEO measurement with a source in this file.**

**And a specific one for this channel, found while writing it.** The industry
research pages are **not** a source for outbound copy. A survey of all ten on
2026-08-14 found that **every headline statistic on them is third-party**, two
pages carry no source attribution at all
(`ai-visibility-for-law-firms.html:253`, `ai-visibility-for-real-estate.html:234`
and `:252`), and two misattribute third-party numbers to BrandGEO
(`ai-visibility-for-healthcare.html:234` and `:252-253`, which is Siftly's
number per `bg-008.html:314`; `ai-visibility-for-home-services.html:246-247`,
which is SOCi's per `bg-008.html:305`). Citing any of them in a cold email puts
an unsourced claim in front of a named company. **The citable BrandGEO
measurements are the city pages, the BG-027 to BG-034 bilingual series, and the
Zenodo paper, DOI `10.5281/zenodo.21395598`, CC BY 4.0
(`brandgeo/web/bg-017.html:317`).** Flagged separately to `gtm-verify` and
`bg-copy` in section 5, because it is a live public-site problem and not only
an outbound one.

### 3.7 Reply branches

**Constantin handles every one of these. This seat never replies to a
prospect.** The branches exist so he does not have to compose from scratch at
speed.

| Reply | Branch |
|---|---|
| "no thanks", "unsubscribe", "remove me", or anything of that shape | Set `suppressed`, add to the sending tool blocklist, **the same day**. Send one short acknowledgement and nothing else, ever. See 3.8 |
| "this is wrong, we do show up" | Agree first. Run a **full depth** audit (5 engines, 6 prompts, EUR 1.172) and send the result whatever it says. If it contradicts the screening result, say so plainly. This branch is worth the cost: a prospect arguing about their own number is a prospect who cares about their own number |
| "interesting, how does it work" | The free audit on the homepage, then Radar at EUR 29. No discount, no deadline. Offer to run it live on their domain on a call, which is the plan's own founder-led motion and the one that has closed |
| "how much" | Radar EUR 29 (Gemini and Claude, weekly, 7 prompts, 1 site), Growth EUR 299. Name the engines per tier. Never imply Radar covers Perplexity: the screening report shows Perplexity and **Radar does not include it** (`planConfig.ts:68`, radar is gemini and claude). This is the single easiest honest mistake to make in this channel |
| "who are you / is this GDPR compliant" | Answer directly: BrandGEO, EU-based, the address came from their own published contact page at `contact_source_url`, here is how to be removed. Then remove them if they ask |
| Out of office | Suppress until the return date, then resume at the touch that was due |
| Hard bounce | Remove the row. Two hard bounces from one source pattern means the sourcing method is wrong, stop and re-check it |
| Anything angry | Suppress, apologise in one line, do not defend the send |

### 3.8 Opt out

Reply-based, per `outbound-infra.md` STEP 5, and it is the mechanism, not a
convenience. A tracked unsubscribe link adds a redirect on a domain with no
reputation and buys nothing here.

The line is in every email, in every touch, exactly as the infra file specifies:

```
If you would rather not hear from me, reply with "no thanks" and I will not
write again.
```

Handling, all of it Constantin's:

1. Honour **the same day**. Not the same week.
2. Add the address to the sending tool blocklist and set `suppressed` on the row.
3. Send one acknowledgement, one line, then nothing.
4. If they ask for erasure rather than suppression, the audit row goes too:
   `DELETE FROM prospect_audits WHERE token = '<token>';`. Suppression keeps
   the address so it is never mailed again; erasure removes the record. They
   are different requests and the second one needs the SQL above.

---

## 4. The deliverability gate

Constantin executes every line. This seat runs none of it and cannot: no agent
registers a domain, creates an inbox, logs into a sending tool, or sends mail.

### 4.1 Verdict as of today

```
HOLD. Failing item: the sending domain does not exist.
trybrandgeo.com returns NXDOMAIN (MEASURED 2026-08-14, nslookup -type=NS,
-type=A and -type=MX against 8.8.8.8, all three "Non-existent domain").
Every subsequent item is therefore untestable, not failed.
```

### 4.2 Current state of each record

| # | Item | State 2026-08-14 | How it was checked |
|---|---|---|---|
| 1 | Domain registered | **NXDOMAIN** | `nslookup -type=NS trybrandgeo.com 8.8.8.8` |
| 2 | MX `smtp.google.com` | untestable | |
| 3 | SPF, exactly one `v=spf1` record | untestable | |
| 4 | DKIM at `google._domainkey` | untestable | |
| 5 | DMARC at `_dmarc`, `p=none` to start | untestable | |
| 6 | Root redirect 301 to `https://getbrandgeo.com` | untestable | |
| 7 | Custom tracking domain | **N/A by design.** Open and link tracking are OFF (`outbound-infra.md` STEP 5.3), so there is no tracking domain to warm or to get wrong. The scoreboard counts replies, not opens | |
| 8 | mail-tester, both inboxes | **not run**, and cannot be until 2026-08-18 | |

**Two things re-verified today rather than inherited, because both are load
bearing and both were last measured on 2026-07-31:**

- `_dmarc.getbrandgeo.com` returns `v=DMARC1; p=none; rua=mailto:constantin@talentwelove.com`.
  **Still `p=none`, still no `sp=` tag.** So a sending subdomain would inherit
  `none` under RFC 7489 and could not be moved to `p=quarantine` on its own.
  The separate-domain ruling holds, unchanged.
- `getbrandgeo.com` A record is **91.200.121.45**, so the cPanel IP in infra
  STEP 3 record 5 and STEP 4 is still correct.

**And the rule that follows from the first bullet: never send cold from
`getbrandgeo.com`.** It carries the company's Workspace mail and the app's
transactional mail, including password resets for paying customers. Not one
message, not a test, not one warm intro through the tool.

### 4.3 The checklist

Every line has a pass condition that is an observed output, not a judgement.
Paste the output of each command back into the chat. Nothing here is a self
report.

**Today, Fri 2026-08-14. These five start the clock and nothing else does.**

- [ ] **1.** Register `trybrandgeo.com` at CyberFolks. WHOIS privacy ON, auto
      renew ON, default nameservers, no bundled email add-on.
      `outbound-infra.md` STEP 1. About EUR 12. **Report the domain you actually
      registered before touching step 3, because every DNS record contains it.**
- [ ] **2.** Two Google Workspace Business Starter seats on a **new, separate**
      subscription: `constantin@trybrandgeo.com` and `c.goane@trybrandgeo.com`.
      Plus the `dmarc@` alias. Photo and plain-text signature on both. IMAP on.
      STEP 2. 14 day free trial, EUR 0 today.
- [ ] **3.** The six DNS records, and generate the DKIM key in the Admin console
      first (STEP 3c) because the value is account-specific. STEP 3. Watch the
      four named failure modes: one SPF record only, host fields that append the
      domain, the 255-character split on the DKIM value, and `rua` staying on
      this domain.
- [ ] **4.** cPanel: create the domain with its **own** document root, then a
      permanent 301 to `https://getbrandgeo.com`, with and without www, no
      wildcard. STEP 4. Do not share the document root.
- [ ] **5.** Saleshandy Outreach Starter, 7 day free trial, no card. Connect both
      mailboxes by Google OAuth. Warmup **ON**, 5 a day rising by 5 every 2 days
      to 30, reply rate 30 percent, weekends on. **Open tracking OFF. Link
      tracking OFF.** Delay 60 to 180 seconds. Stop on reply ON. STEP 5.
      Daily campaign send limit **0** until 08-19 at the earliest.

**Today plus 15 minutes.**

- [ ] **6.** `nslookup -type=MX trybrandgeo.com 8.8.8.8`
      → pass: returns `smtp.google.com`.
- [ ] **7.** `nslookup -type=TXT trybrandgeo.com 8.8.8.8`
      → pass: **exactly one** `v=spf1` line. Two is a permanent silent fail.
- [ ] **8.** `nslookup -type=TXT google._domainkey.trybrandgeo.com 8.8.8.8`
      → pass: a `v=DKIM1` line. Then and only then click **Start
      authentication** in the Admin console.
- [ ] **9.** `nslookup -type=TXT _dmarc.trybrandgeo.com 8.8.8.8`
      → pass: the `v=DMARC1` line.
- [ ] **10.** `curl -sSI https://trybrandgeo.com | head -5`
      → pass: `HTTP/... 301` and `location: https://getbrandgeo.com`.

**Sat 08-16 to Mon 08-17, in parallel, blocking nothing.**

- [ ] **11.** ICP list to 250 sourced rows per section 1.4. No addresses from
      anywhere but the companies' own published contact pages.
- [ ] **12.** Evidence Machine dry run on three domains you own or have
      permission for, per 2.6. Confirm the report renders at
      `https://app.getbrandgeo.com/audit/<token>` in a logged-out private window.
- [ ] **13.** Re-run the engine-disagreement query and update the number in
      touch 2 (3.4) to whatever it says on the day:
      ```sql
      SELECT count(*) AS n,
             count(*) FILTER (WHERE engine_states::jsonb->>'gemini'
                    IS DISTINCT FROM engine_states::jsonb->>'perplexity') AS disagree
      FROM prospect_audits
      WHERE status='ready' AND depth='screening' AND engine_states IS NOT NULL;
      ```

**Tue 2026-08-18, after four days of warmup. This is the gate.**

- [ ] **14.** mail-tester on `constantin@trybrandgeo.com`. Open
      `https://www.mail-tester.com/`, copy the address, and send it a
      **realistic** message from the Gmail web interface: roughly the length and
      shape of touch 1, with a real subject and the real signature. A message
      reading "test" scores badly for reasons that will not apply to real mail
      and burns the single-use address.
- [ ] **15.** mail-tester on `c.goane@trybrandgeo.com`, on a **fresh** address.
- [ ] **16.** Saleshandy per-account deliverability panel: SPF, DKIM and DMARC
      green on both. Screenshot both.
- [ ] **17.** Saleshandy warmup tab: inbox placement at or above 90 percent on
      both. This is a health signal, not a gate. Below 90 means extend warmup.
- [ ] **18.** Optional, 10 minutes, free: add the domain to Google Postmaster
      Tools. It is the only first-party view of how Gmail actually sees you.

**The pass condition, and it is the whole of it:**

```
mail-tester 9.0 or higher out of 10 on BOTH inboxes,
AND items 6 to 10 all passing,
AND item 16 green on both accounts.
```

Paste both scores and the SPF, DKIM and DMARC lines from each report.

**If either inbox scores below 9.0: HOLD.** Do not send on 08-19. Paste the full
report, fix the named item, re-test. `SPRINT-100-PLAN-30D.md` already binds the
fallback and this file does not soften it: cold volume waits and DM volume rises
instead. There is no version of this sprint where a burned domain is the better
trade, because recovery takes longer than the sprint has left.

### 4.4 Then, and only then

- [ ] **19.** Wed 08-19 (floor) or Fri 08-21 (planned): set the daily campaign
      send limit to **10 per inbox**. Not 25. The ramp is 10, 15, 20, 25.
- [ ] **20.** Load only rows where `qualified = true`. A row without a
      `report_url` is not loaded.
- [ ] **21.** Fri 2026-08-29 or on 14 days of clean DMARC reports, whichever is
      later: move `p=none` to `p=quarantine`. Leaving a sending domain at
      `p=none` permanently is a handicap at Google and Microsoft.

### 4.5 Standing rules for the whole channel

1. **The primary domain never sends cold mail.** Not once.
2. **Volume never rises to hit a scoreboard number.** The cap table is a
   ceiling, not a target. A number missed is a number missed.
3. **Every opt out is honoured the same day**, manually, and the address goes on
   the blocklist.
4. **If mail-tester drops below 9 at any point, stop sending that day and
   diagnose.** It leads; reply rate lags.
5. **No email carries an unmeasured number.**

### 4.6 Money

| Line | Amount | When |
|---|---|---|
| `trybrandgeo.com` registration | about EUR 12 | today, once |
| Google Workspace, 2 seats | EUR 0 to 2026-08-28 (14 day trial), then EUR 3.40 per seat promo | trial today |
| Saleshandy Outreach Starter | EUR 0 to 2026-08-21 (7 day trial), then about EUR 23 | trial today, pays exactly when real sending starts |
| Evidence Machine API, 300 to 350 screening audits | **EUR 67 to EUR 78** | as batches run, capped at EUR 100 for August |
| **Due today** | **about EUR 12** | |
| **Total inside the sprint** | **about EUR 109** | |

Inboxes 3 and 4 are **not** created (section 0), which saves two seats against
what `outbound-infra.md` planned for the longer sprint.

---

## 5. Handoff packets, and what needs a human

### 5.1 Why the packets are printed here rather than written

The task authorises exactly one file, and `.claude/handoffs/` is
`bg-orchestrator`'s scope. Packet ids are allocated when a packet is written and
are never reserved inside an artifact: two packets already collided on id `006`
for exactly that reason. So the contents are below, ready to paste, and
`bg-orchestrator` assigns the number and the filename.

### 5.2 Packet, `gtm-outbound` to `bg-app`: engine labels on the prospect-facing report

```markdown
---
id: <assigned by bg-orchestrator>
from: gtm-outbound
to: bg-app
status: READY
scope_write: brandgeo-dashboard/src/pages/AuditReport.tsx
scope_read: brandgeo-dashboard/src/lib/planConfig.ts (ENGINE_META),
            docs/growth/outbound/icp-evidence-machine-and-sequence-2026-08-14.md
model: sonnet
---

## Decision
ENGINE_LABEL at AuditReport.tsx:57 is missing google_ai and grok, and the
lookup falls back to the raw key at :248, :269 and :288. A full-depth report
therefore prints "google_ai: MISSING" on a page shown to a named prospect.
Screening depth is unaffected, so this does not block the cold sequence, but
it becomes visible the first time a reply earns a full-depth audit.

## Do
1. Add `google_ai: 'Google AI Mode'` and `grok: 'Grok'` to ENGINE_LABEL.
2. Spell them exactly as ENGINE_META in planConfig.ts spells them. Google AI
   Mode and Google AI Overviews are two different products.
3. Leave the `?? engine` fallbacks in place. They are correct as a last resort.

## Do not
- Do not remove `meta: 'Meta AI'`. Historical rows still render it.
- Do not touch any other file. This rides the next batched deploy.

## Acceptance criteria
- A full-depth report renders "Google AI Mode", never "google_ai".
- No raw engine key appears in the rendered output for any engine in
  FULL_ENGINES.
```

### 5.3 Packet, `gtm-outbound` to `bg-backend`: Evidence Machine batch runner

```markdown
---
id: <assigned by bg-orchestrator>
from: gtm-outbound
to: bg-backend
status: NEEDS_HUMAN
scope_write: scripts/run-evidence-batch.js  (SCOPE QUESTION, see below)
scope_read: brandgeo-dashboard/netlify/functions/audit-domain.js,
            get-audit-report.js, _prospect_guard.js, _prospect_engines.js,
            docs/growth/outbound/icp-evidence-machine-and-sequence-2026-08-14.md
model: sonnet
---

## Decision
The Evidence Machine needs no new backend. It is audit-domain.js with
X-Internal-Key plus get-audit-report.js plus the public /audit/:token page,
all live and verified externally 2026-08-14. What is missing is a batch
runner, and it is a convenience rather than a blocker: 30 hand-run curl
calls a night work today with no deploy and no credits.

## Do
1. Read a CSV with the columns in section 1.4 of the artifact.
2. For each unaudited row, POST audit-domain with header X-Internal-Key from
   the environment and body {"domain": <domain>}. Screening depth, which is
   the default. Serial, with a 3 to 5 second gap. Never parallel.
3. GET get-audit-report?token=<token> with the same header. Record ai_score,
   category, low_confidence, competitor_flags[0].{engine,prompt,competitor_name},
   token.
4. Write report_url = https://app.getbrandgeo.com/audit/<token> and run_date.
5. Compute qualified = ai_score < 50 AND competitor_flags non-empty AND NOT
   low_confidence. Write disqualified_reason D3 or D4 otherwise.
6. Before starting, sum estimated_cost_eur for the current month and REFUSE to
   run if the batch would take it past EUR 100. Print the projected spend and
   require an explicit --confirm flag.
7. Write the CSV back. Never overwrite the input in place.

## Do not
- Do not put INTERNAL_AUDIT_KEY in the file, in a default, in a log line, or
  in a commit. Environment variable only. The repo is public.
- Do not request depth "full". That is 5.2x the cost and is reserved for
  prospects who reply.
- Do not retry a failed audit automatically. A failure is a dropped row, and
  a retry loop against a budget-guarded endpoint is how the EUR 200 monthly
  cap gets spent in an afternoon.
- Do not send anything. This script writes a CSV and nothing else.

## Acceptance criteria
- A dry run with --confirm absent prints the projected spend and exits 0
  without making a single API call.
- A 3-row real run produces 3 tokens whose /audit/<token> pages render.
- Rows over the D3 or D4 threshold come back qualified=false with a reason.
- grep for the key name in the script returns only the process.env reference.

## Open questions for Constantin
1. SCOPE. scripts/ is not assigned to any seat in AGENT-OS section 1.
   bg-backend owns netlify/functions/ and db/. scripts/ already holds
   comparable files (send-free-plan-update.js, stripe-create-catalogue.js).
   Confirm bg-backend may write scripts/run-evidence-batch.js, or route it
   elsewhere.
2. Is this worth building at all this sprint? At 30 audits a night the curl
   loop is fine, and the sprint has 6 to 8 sending days left. Building it may
   be the wrong use of the seat.
```

### 5.4 Note to `gtm-verify` and `bg-copy`, not a packet

Found while sourcing citable evidence for the sequence, and out of this seat's
scope to fix. It is a **live public-site** problem, not only an outbound one.

1. `brandgeo/web/ai-visibility-for-real-estate.html:252` cites a "FlyDragon"
   study (12,400 AI responses, 8.2 million queries, 8.4 percent of agents,
   47 percent citation share) with no link and no date window. The string
   "FlyDragon" appears nowhere else in the repo. The 91 percent at `:234` has
   no source at all. Highest-risk claim found.
2. `ai-visibility-for-law-firms.html:253` claims "77-78 percent ... the highest
   rate of any industry vertical measured" with no source line, no link and no
   sample size. The page carries zero external links.
3. Two third-party numbers are attributed to BrandGEO. Healthcare's 24 percent
   (`ai-visibility-for-healthcare.html:234` and `:252-253`) is Siftly's per
   `bg-008.html:314`. Home services' "the most AI-invisible category BrandGEO
   has measured" (`ai-visibility-for-home-services.html:246-247`) is SOCi's per
   `bg-008.html:305`. **BrandGEO has never published a metric of that form.**
4. `bg-008.html` is the citation anchor for four industry pages and has zero
   external links.

`ai-visibility-for-restaurants.html` and `ai-visibility-for-education.html`
are the two pages that do this correctly and are the model for the rest.

### 5.5 Human checkpoints

```
=== HUMAN CHECKPOINT 1 ===
NEED:      Register trybrandgeo.com today, 2026-08-14?
WHY:       The warmup clock is the only thing on the critical path that cannot
           be compressed. Registration today puts the floor first-send at
           2026-08-19 and the planned first send at 2026-08-21. Every day of
           delay moves both by exactly one day. Thirteen days were already lost
           between 2026-07-31 and today.
OPTIONS:   A) Register today -> first send 08-19 floor, 08-21 planned, 6 to 8
              sending days inside the sprint, about 240 to 340 messages.
           B) Register 08-18 -> first send 08-25 at best, 4 sending days, about
              140 messages, and touch 2 barely lands inside the sprint.
           C) Do not register -> the cold channel does not exist this sprint.
              Sections 1 and 2 still pay for themselves through founder-led
              sales, which is where G1 lives anyway.
DEFAULT:   Nothing happens. NXDOMAIN persists and option C arrives by inaction,
           which is what happened for the last 13 days.
TO RUN:    https://www.cyberfolks.ro/ , sign in, search trybrandgeo.com, add to
           cart, WHOIS privacy ON, auto renew ON, keep ns1 to ns4.cyberfolks.ro,
           decline every email and SSL add-on. About EUR 12.
           Then outbound-infra.md STEP 2, STEP 3, STEP 4, STEP 5, in that order.
TO VERIFY: nslookup -type=NS trybrandgeo.com 8.8.8.8
           Pass: it returns nameservers instead of "Non-existent domain".
=== END CHECKPOINT ===
```

```
=== HUMAN CHECKPOINT 2 ===
NEED:      Spend up to EUR 100 of the EUR 200 monthly prospecting budget on
           Evidence Machine audits for the outbound list?
WHY:       PROSPECTING_MONTHLY_BUDGET_EUR (_prospect_guard.js:130) is shared
           with the public free audit on the homepage. Crossing it returns 429
           to the homepage widget and takes the free audit down for every
           visitor. That is the worst possible way to spend the last euro, so
           the split has to be a decision and not an accident.
OPTIONS:   A) Cap outbound at EUR 100 -> roughly 440 screening audits, well
              past the 300 to 350 this sprint needs, EUR 100 left for public
              traffic.
           B) Cap at EUR 50 -> roughly 220 audits, enough for about 150
              qualified rows, tighter but sufficient for 6 sending days.
           C) Raise PROSPECTING_MONTHLY_BUDGET_EUR above 200 -> more room, more
              real money, and it is a Netlify env change plus a redeploy.
DEFAULT:   A. Lifetime spend on this table is EUR 15.31, so August has
           essentially the whole EUR 200 unspent, and the public audit is
           running at well under one a day.
TO RUN:    Nothing to change for option A or B. It is a discipline, enforced by
           the runner in packet 5.3 and by the reconciliation query in 2.6.
TO VERIFY: SELECT round(sum(estimated_cost_eur)::numeric,2)
           FROM prospect_audits WHERE created_at >= date_trunc('month', now());
=== END CHECKPOINT ===
```

```
=== HUMAN CHECKPOINT 3 ===
NEED:      Use the Evidence Machine for founder-led sales this week, before the
           domain is warm?
WHY:       It runs today against a live endpoint. Cold email cannot start
           before 08-19 at the earliest, but a LinkedIn message, a warm intro
           or a call can start this afternoon, and founder-led sales is the
           only motion that has ever closed at BrandGEO. This is the largest
           gap between an asset and a real send in this document, and it is
           closable today.
OPTIONS:   A) Run 10 audits on named segment B1 or A1 prospects today, use the
              report in a founder-led conversation. Cost EUR 2.24. Carries G1.
           B) Wait for the cold channel. Costs 5 to 7 days for no reason.
DEFAULT:   B, by inaction.
TO RUN:    Section 2.6, steps 1 to 3, with the domains you already want to
           talk to. Ten curl calls.
TO VERIFY: Each returns a token; https://app.getbrandgeo.com/audit/<token>
           renders the full report in a logged-out private window.
=== END CHECKPOINT ===
```

---

## 6. Evidence log

Everything asserted in this file, with what produced it. Nothing here was
inherited from a prior session without being re-checked.

| Claim | Tag | Source, dated 2026-08-14 unless stated |
|---|---|---|
| `trybrandgeo.com` does not exist | MEASURED | `nslookup -type=NS/-type=A/-type=MX ... 8.8.8.8`, all NXDOMAIN |
| `getbrandgeo.com` is at DMARC `p=none`, no `sp=` | MEASURED | `nslookup -type=TXT _dmarc.getbrandgeo.com 8.8.8.8` |
| cPanel IP 91.200.121.45 | MEASURED | `nslookup -type=A getbrandgeo.com 8.8.8.8` |
| `get-audit-report` live, returns 400 with no token | MEASURED | `curl`, HTTP 400 `{"error":"Missing token"}` |
| `audit-domain` live, rejects GET | MEASURED | `curl`, HTTP 405 |
| 63 ready audits, 8 public, 55 internal, 41 distinct domains, EUR 15.31 lifetime | MEASURED | SQL, `prospect_audits` |
| 31 of 63 scored exactly 0; nothing in the 1 to 24 band | MEASURED | SQL, score-band aggregation |
| All 31 zero-score audits carry a named competitor; 57 of 63 overall; mean 3.8 | MEASURED | SQL, `competitor_flags` |
| Gemini and Perplexity disagree on 18 of 62 screening audits, 29.0 percent | MEASURED | SQL, `engine_states` |
| Zero `unavailable` engine states across 62 screening audits | MEASURED | SQL, `engine_states` |
| `legal practice management software` n=5, 3 zeros, mean 19.6; `email marketing software` n=11, mean 53.5 | MEASURED | SQL, grouped by `category` |
| `AI visibility intelligence` n=6, all six scored 0 | MEASURED | SQL |
| 2 `prospect_leads` rows, 2 public audits with an email, 180 distinct competitor names | MEASURED | SQL |
| Screening EUR 0.2240, full EUR 1.1720 | MEASURED | `_cost.js:215` values through `estimateAuditCost` in `_prospect_engines.js` |
| Monthly prospecting budget EUR 200, shared with the public audit | MEASURED | `_prospect_guard.js:130` |
| Internal callers bypass origin, per-IP and hourly limits, not the budget | MEASURED | `audit-domain.js:56`, `:66`; `_prospect_guard.js:106-114` |
| Internal rows are written `unlocked: true` | MEASURED | `audit-domain.js:113-114` |
| `/audit/:token` is public and unauthenticated | MEASURED | `src/App.tsx:106`, outside `PrivateRoute` |
| `google_ai` and `grok` render as raw keys | MEASURED | `AuditReport.tsx:57`, `:248`, `:269`, `:288` |
| UTM capture is unbuilt | MEASURED | zero `utm_source` occurrences in `brandgeo/web/site.js` |
| Radar is Gemini and Claude, 7 prompts, weekly, 1 site, EUR 29 | MEASURED | `planConfig.ts:68` `PLAN_ENGINES.radar`, `:541` `PLAN_PROMPTS` |
| Real estate agents 0 of 5 in Dallas, Denver, Philadelphia, Seattle | MEASURED | the four city pages, lines cited in 1.2 |
| Immigration law no overlap in San Francisco and Tampa | MEASURED | `-sanfrancisco.html:334`, `-tampa.html:332` |
| Property management, hospital systems, logistics software, lobbying, startup accounting all 5 of 5 | MEASURED | city pages cited under D7 |
| DOI `10.5281/zenodo.21395598`, CC BY 4.0 | MEASURED | `bg-017.html:317` |
| Every industry-page headline stat is third-party; two pages unsourced; two misattributed | MEASURED | survey of all ten pages, citations in 3.6 and 5.4 |
| 49 percent zero-score rate as a planning input | INFERRED | measured on a non-random sample of 63 |
| 1 to 5 percent first-touch reply rate | INFERRED | industry band. Zero cold emails have ever been sent from this company |
| 0 to 2 self-serve subscriptions from cold email inside the sprint | INFERRED | from the two rows above and the 240 to 340 message ceiling |
| Warmup 5 to 7 days, floor 08-19, planned 08-21 | MEASURED then computed | `outbound-infra.md:8`, plus registration on 2026-08-14 |
