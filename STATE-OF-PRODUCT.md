# STATE-OF-PRODUCT.md — Where BrandGEO Actually Stands

> **Session:** `Master-StateOfProduct` (CLAUDE.md §12) · **Date:** 2026-07-11
> **Model:** Opus 4.8 (cross-cutting synthesis + scalability judgment, per §0)
>
> **What this is:** a synthesis of the six existing audits (GTM, competitive,
> reasoning, design, content, security) plus **one genuinely new piece of work** —
> a real scalability audit against §4.1's 1,000-client rule, which no prior
> initiative had actually run (the rule was asserted, never tested).
>
> **What this is not:** a re-research of competitors, UI/UX, or reasoning
> accuracy. Those are done, with real evidence, in their own docs. Every claim
> below either cites one of those docs or is newly verified this session against
> live code / the live Supabase database (project `duiyifepitvugyulobqm`).
>
> **No invented percentages.** Where something is scored, the rubric is defined
> first (§2) and the evidence that pins each score is named.

---

## 1. The prioritized list — what to fix, in order

Ranked by **actual impact**, not by which initiative found it. The top three are
cheap; the next three are structural.

| # | Finding | Impact | Effort | Owner |
|:--:|---|---|---|---|
| **1** | 🔴 **The OpenAI API key has been out of quota since 2026-07-07.** 60 of 86 `chatgpt` rows in `ai_results` are `status='error', error_code='quota_exceeded'` — 69.8% failure rate, across 9 clients, still failing on the last run (2026-07-10). Every other engine is at **0%** errors. **ChatGPT is the only engine on the Free tier** — so the entire top of the product-led funnel is currently dead — and it is the engine the Instant Audit scorecard leads with, i.e. the outbound sales weapon is quoting prospects a score with its most credible engine missing. | Revenue + trust, **live right now** | **Minutes** — top up the OpenAI account, then add a balance alert | Constantin |
| **2** | 🔴 **The hottest query paths have no indexes.** `ai_results` has indexes only on `id` (PK) and `status` — **nothing on `client_id`, `checked_at`, or `prompt_id`**. `prompts` has nothing on `client_id`. The `_auth.js` rate-limit check runs `count(*) … WHERE client_id = ? AND checked_at >= ?` on **every single collect call** (3× per prompt), and every dashboard page filters on exactly those columns. Invisible at today's 362 rows; a sequential scan over a multi-million-row table at 1,000 clients — inside a 26s function budget. | Latent, then fatal | **5 minutes** — 4 `CREATE INDEX` statements (§4.3) | Supabase SQL |
| **3** | 🔴 **`competitors.name` is globally `UNIQUE` — twice.** The table has a `client_id` column, but carries two identical `UNIQUE (name)` constraints (`competitors_name_key`, `competitors_name_unique`). **Two clients cannot track the same competitor.** The second law firm to add "Clifford Chance" gets a constraint violation. A textbook §4.1 Scalability-Rule violation sitting in the schema. | Breaks on client #2 in any shared vertical | **5 minutes** — drop both, add `UNIQUE (client_id, name)` (§4.3) | Supabase SQL |
| **4** | 🟠 **The rate limit and the pricing sheet contradict each other.** `_auth.js` caps a client at **150 `ai_results` rows/hour**. A 5-engine client writes 5 rows per prompt → **30 prompts/hour, hard ceiling**. `PRICING-SPEC.md` sells Growth at **150 prompts** (≥5 hours of rate-limit windows for one refresh) and Enterprise at **"1,000+ prompts"** (≥33 hours). One of the two numbers is wrong. | Sold capacity the platform refuses to deliver | Half a day (decide, then re-derive the limit from the plan) | Master-Reasoning or a scoped task |
| **5** | 🟠 **Collection is browser-driven, sequential, and unscheduled.** `collectionContext.tsx` loops prompts **in the user's browser tab**, awaiting ~26s per prompt. Growth (150 prompts) ≈ **65 minutes with the tab open**; Enterprise (1,000 prompts) ≈ **7+ hours**. There is no scheduler (§2.8), so every "monthly / weekly / daily refresh" on the pricing page is, today, *a human clicking a button*. **This is the single architectural blocker to the 1,000-client rule** — and to every cadence promise already being sold. | Blocks the entire self-serve scale thesis | Multi-session (queue + worker, §4.2) | Master-DashboardDesign |
| **6** | 🟠 **Growth's "daily refresh" is gross-margin negative as priced.** 150 prompts × 5 engines × 30 days, at the codebase's own per-response cost table (`Usage.tsx`), = **€297/mo of raw API spend against a €299/mo price** — 0% gross margin before any overhead, **€445/mo** once the codebase's own 1.5× `OVERHEAD_MULTIPLIER` is applied. Weekly refresh at the same tier is fine (≈€64/mo, ~79% margin). | Every daily-refresh Growth client loses money | Hours — cap Growth at weekly, or reprice, or throttle | Master-GTM + Master-DashboardDesign |
| **7** | 🟡 **The self-serve signup landmine is still armed.** `signup-client.js` still writes `role: 'admin'`, and RLS treats admin as *global cross-tenant*. It's only safe because the function is broken (SECURITY-AUDIT F1). ✅ **Newly verified this session:** the Stripe path (`stripe-webhook.js`, built *after* that audit) correctly provisions `role: 'viewer'` — so the live self-serve revenue path is **not** carrying the bug. The landmine is confined to `signup-client.js`. | Catastrophic if someone "fixes" signup | Small — but must precede any signup work | Master-Security / whoever touches signup |
| **8** | 🟡 **No global spend ceiling on the paying-client pipeline.** The *prospect audit* path has a monthly budget cap (`PROSPECTING_MONTHLY_BUDGET_EUR`, €200), a global hourly limit (100), and a per-IP daily cap (3). The *client collection* path has only a per-client 150/hr limit and **no global ceiling of any kind** — 1,000 clients × 150 rows/hr is an unbounded API bill. The guardrail exists on the cheap path and is missing on the expensive one. | Cost blowout risk at scale | Hours | Master-DashboardDesign |
| **9** | 🟡 **Remaining accuracy gaps** (all already logged, none blocking): multilingual sentiment beyond RO/EN (1.1b), diacritic-folding false negatives ("Păunescu" vs "Paunescu"), round-4 competitor-extraction leakage, and no caching/dedup layer (§2.5). | Trust, at self-serve scale | Ongoing | Master-Reasoning |

**Read the top three as one item:** they are ~15 minutes of total work and they are
the difference between a product that is quietly broken and one that isn't.
Everything below them is real engineering.

---

## 2. Rubric (defined before scoring — no percentages)

Each dimension is placed on a 4-level maturity scale. The levels are defined by
**checkable criteria**, and each score below names the specific evidence that
pins it there.

| Level | Definition |
|:--:|---|
| **L0 — Not built** | The capability does not exist. |
| **L1 — Works by hand** | Works for today's handful of clients, with a human in the loop for each one. Breaks or stalls beyond that. |
| **L2 — Works for a cohort** | Runs unattended for tens of clients. Ceilings are known and documented but not yet hit. |
| **L3 — Scales** | Meets §4.1's 1,000-client rule with headroom. No per-client human step. Costs and limits verified, not assumed. |

---

## 3. Dimension by dimension

### 3.1 Market fit & positioning — **L2**
*Source: `GTM-STRATEGY.md`, `COMPETITIVE-BENCHMARK.md`. Not re-researched.*

The category is validated (<10% of brands monitor AI visibility; 89% of B2B
buyers research via AI) and the wedge is real and defensible: **done-for-you**, in
a category that is ~90% self-serve dashboards, sold worldwide with geo/multi-language
as a *capability* rather than a geographic ceiling.

What holds it at L2 rather than L3 is honest and already named in GTM-STRATEGY §4.4:
a handful of clients, several founder-adjacent — **early PMF, pre-repeatability**.
The plan correctly front-loads *finding* the repeatable motion (Phase B) over
scaling it.

Since that doc was written, the pricing decisions were made and shipped (6-tier
ladder, Growth €299, Managed €900, terms.html reconciled). The pricing surface is
now internally consistent across site / FAQ / terms / `planConfig.ts` / Stripe.
**One new contradiction arrived with it** — the rate-limit-vs-prompt-cap clash
(§1 item 4) and the Growth daily-refresh margin (§1 item 6). Pricing was set
against the *market*, correctly, but never against the *platform's own capacity*.

### 3.2 Reasoning & functionality — **L2**
*Source: `reasoning-audit-findings.md` + CLAUDE.md §8.4–§8.11. Not re-audited.*

This is the most improved area in the project. All **five Tier-1 accuracy
findings are fixed and live**: sentiment now scores the brand's own clause (not
"does the word 'best' appear anywhere in the listicle"), mention detection is
boundary-anchored (no more matching "bpr" inside "subprocess"), `brand_position`
holds only genuine list ranks, Claude's stream is time-bounded instead of cut at
2,500 chars mid-list, and `analyseResponse` lives in one shared `_analysis.js`
with a 47-assertion fixture guarding it. Three further rounds of
competitor-extraction hardening shipped on top.

Held at L2 by: multilingual sentiment still RO/EN-only, diacritic-sensitivity,
one known round-4 extraction leak, and no caching layer. Each is logged and
non-blocking.

**One thing the accuracy work cannot fix, and which the data now shows:** the
pipeline's biggest correctness problem today isn't the analysis — it's that
**ChatGPT has been returning `quota_exceeded` for four days** (§1 item 1). No
amount of parsing improvement matters when the engine never answers.

### 3.3 Presentation & conversion — **L2 (site) / L2 (dashboard)**
*Sources: `COMPETITIVE-BENCHMARK.md`, `DESIGN-SYSTEM.md`, `content-audit-findings.md`, CLAUDE.md §7 / §9.*

The strongest area, and genuinely ahead of the category in places:

- **Dashboard:** the benchmark's verdict was *"nothing in Phases 0–3 needs to be
  redone."* The grouped sidebar (Insights/Strategy/Manage) is **more structured
  than peec.ai's own flat nav**; the "Fix This" hub is the category-standard
  pattern (Peec's "Act on Insights," AthenaHQ's "Action Center"). Phase 5
  (accessibility, focus states, empty states) has since shipped.
- **Marketing site:** far ahead of where a company this size normally is —
  15 research articles, 9 competitor comparison pages, 10 industry pages, 7
  city-research pages backed by *original pipeline data*, a glossary with
  `DefinedTerm` schema, full JSON-LD, canonicals, correct robots.txt. The
  content-audit's entire priority list is done.
- **Conversion:** the Instant Audit Engine (Component A) is live and
  smoke-tested end-to-end on both depths, and the homepage widget (Component D)
  is wired against it. **No competitor in the 9-name set has this** — the
  product doubling as the prospecting weapon is a real, unusual asset.

**The gap:** the audit widget is the conversion mechanism, and it currently runs
ChatGPT — which errors ~70% of the time (§1 item 1). The best-engineered part of
the funnel is being fed by the broken part of the pipeline.

### 3.4 Scalability — **L1** ⚠️ *(the new work — see §4 in full)*

**This is the weakest dimension by a wide margin, and the only one that fails
its own stated rule (§4.1: "every solution must scale to 1,000 clients").**

Collection today is: a human logs in, picks a client, clicks a button, and keeps
a browser tab open while ~26 seconds per prompt tick by, one prompt at a time.
There is no scheduler, no queue, no worker, no server-side fan-out. That is L1 by
definition — *works by hand* — and it does not degrade gracefully into L2; it
simply stops.

### 3.5 Security & billing readiness — **L2**
*Source: `SECURITY-AUDIT.md` + new verification this session.*

The multi-tenant isolation model held up under audit: RLS on every table, no
`qual: true` leaks remaining, no role self-escalation, no committed secrets,
admin-only functions correctly gated. Billing is live end-to-end (4 Stripe
Payment Links, webhook auto-provisioning, Customer Portal), and the €10k
Enterprise ceiling is reachable via the add-on ladder.

**New this session (the security audit predates the Stripe webhook, so nobody had
checked this):** `stripe-webhook.js` provisions self-serve customers with
`role: 'viewer'` — **it does not inherit the F1 admin landmine.** The live
revenue path is safe. F1 remains confined to the broken `signup-client.js`.

Still open, unchanged: F1 (before any signup work), F2 (signup throttle), F3
(`search_path` pin on the 4 `SECURITY DEFINER` RLS helpers — 5 minutes of SQL),
and the Canary-Islands VAT/IGIC configuration, which is a genuine tax-compliance
decision needing an advisor, not a toggle.

---

## 4. The scalability audit (new work)

Everything in this section was verified this session against live code and the
live database. Assumptions are stated explicitly wherever a projection is made.

### 4.1 The binding constraint: collection is a human activity

`collectionContext.tsx` (`runCollection`) does this, in the browser:

```
for each prompt:                       ← sequential, in the user's tab
    fire collect-prompt + collect-claude + collect-chatgpt   ← parallel (3)
    await all three                    ← up to ~26s (the Netlify function ceiling)
```

Consequences, all direct arithmetic from that loop and from `PRICING-SPEC.md`'s
own prompt caps:

| Tier | Prompts sold | Wall-clock for one full refresh | Requires |
|---|:--:|---|---|
| Free | 5 | ~2 min | tab open |
| Essentials | 30 | ~13 min | tab open |
| **Growth** | **150** | **~65 min** | tab open |
| Managed | "larger coverage" | — | tab open |
| **Enterprise** | **"1,000+"** | **~7+ hours** | tab open |

And there is **no scheduler** (CLAUDE.md §2.8 — the only scheduled functions are
the two purge jobs). So the refresh cadences printed on the pricing page —
monthly (Free), weekly (Essentials), **daily/weekly (Growth)**, weekly + managed
(Managed) — are not implemented anywhere. They are, today, a person clicking.

At 1,000 clients this is not "slow," it is **not a thing that can happen.**

### 4.2 What L3 would actually require

Not a tweak — a different shape. The honest version:

1. **Move collection server-side.** A job queue (`collection_jobs` table, or
   Supabase pg_cron + a worker) that enqueues one row per (client, prompt,
   engine) and a worker that drains it. The browser then only *watches* progress
   instead of *being* the runtime.
2. **A real scheduler** that enqueues each client's due refresh at its plan's
   cadence, spread across the window (not a thundering herd at 00:00).
3. **Re-derive the rate limit from the plan**, not a flat 150/hr (§4.4).
4. **A global spend ceiling** for the client pipeline, matching the one the
   prospect-audit path already has.
5. **A caching/dedup layer** (§2.5) — at 1,000 clients in a handful of verticals,
   identical prompt+market pairs will recur across clients constantly, and each
   one currently pays full API price. *(Lever, not a measured number — the
   overlap rate can't be estimated from 12 clients.)*

Netlify's account-level concurrent-function limit was **not measured this
session**; it becomes the binding constraint the moment collection moves
server-side, and should be checked before (1) is designed.

### 4.3 Database: the schema is not ready, and the fixes are trivial

Verified against `pg_indexes` / `pg_constraint` on the live project:

**Missing indexes — every one of these is a sequential scan today:**

```sql
-- ai_results has ONLY: PK(id), idx_ai_results_status. Nothing else.
CREATE INDEX IF NOT EXISTS idx_ai_results_client_checked
  ON public.ai_results (client_id, checked_at DESC);   -- the _auth.js rate-limit
                                                       -- count + every dashboard read
CREATE INDEX IF NOT EXISTS idx_ai_results_prompt
  ON public.ai_results (prompt_id);                    -- unindexed FK
CREATE INDEX IF NOT EXISTS idx_ai_results_checked_at
  ON public.ai_results (checked_at);                   -- purge-old-results' daily DELETE
CREATE INDEX IF NOT EXISTS idx_prompts_client
  ON public.prompts (client_id);                       -- unindexed FK; every run + page load
```

**The multi-tenancy bug:**

```sql
-- competitors currently carries TWO identical global-unique constraints on name,
-- despite having a client_id column. Two clients cannot track the same competitor.
ALTER TABLE public.competitors DROP CONSTRAINT competitors_name_key;
ALTER TABLE public.competitors DROP CONSTRAINT competitors_name_unique;
ALTER TABLE public.competitors ADD  CONSTRAINT competitors_client_name_unique
  UNIQUE (client_id, name);
CREATE INDEX IF NOT EXISTS idx_competitors_client ON public.competitors (client_id);
```

*(Run these in the Supabase SQL Editor, project `duiyifepitvugyulobqm`. The
`competitors` change should be checked against existing rows first —
`SELECT client_id, name, count(*) FROM competitors GROUP BY 1,2 HAVING count(*) > 1;`
— it should return nothing, since global uniqueness has been enforcing this all
along.)*

**Storage projection** (stated assumptions): `response_text` averages **2,598
chars** across the 243 rows that have it (measured). At the §4.4 mix below —
~620k rows/month — that is **~1.6 GB/month of response text alone**, ~19 GB/year,
~39 GB at the 24-month retention line. That is a real Supabase storage line item
worth planning for, not a crisis.

### 4.4 Rate limit vs. pricing: the two numbers disagree

`_auth.js`: `RATE_LIMIT_PER_HOUR = 150` **`ai_results` rows** per client per hour.
Each prompt run on a 5-engine plan writes **5 rows** (one per engine — verified in
`collect-prompt.js`'s insert loop). Therefore:

> **150 rows/hr ÷ 5 engines = 30 prompts per hour. Hard ceiling, per client.**

Against what is sold:

| Tier | Prompts | Engines | Rows per full refresh | Hours of rate-limit window needed |
|---|:--:|:--:|:--:|:--:|
| Essentials | 30 | 3 | 90 | under 1 ✅ |
| **Growth** | **150** | **5** | **750** | **5** ❌ |
| **Enterprise** | **"1,000+"** | **5** | **5,000+** | **33+** ❌ |

A Growth client who clicks "Run Collection" will be **429'd at roughly prompt 30**
and cannot complete a single full refresh in an hour — let alone a *daily* one.
The limit was set (correctly, and for good reason — it stopped a real token-burn
incident) when the biggest plan had far fewer prompts. It was never revisited when
the pricing ladder grew. **Either the limit becomes plan-derived, or the prompt
caps come down.** This is a decision, not a bug fix.

### 4.5 Unit economics: the aggregate is healthy, one tier is not

Using the codebase's **own** per-response cost estimates (`Usage.tsx`
`ENGINE_COST`: chatgpt €0.040, claude €0.018, perplexity €0.005, meta €0.002,
gemini €0.001 → **€0.066 per 5-engine prompt run**) and its own
`OVERHEAD_MULTIPLIER = 1.5`. *These are the repo's estimates, not measured
invoices — treat them as the planning figures they are.*

**Assumed 1,000-client mix** (stated, not derived from data — 1,000 clients only
happens via self-serve, so the mix is skewed accordingly): 600 Free · 250
Essentials · 100 Growth · 40 Managed · 10 Pro/Enterprise, all on **weekly**
refresh (4.33 runs/month).

| | Rows/month | Raw API €/month |
|---|---:|---:|
| Free (600 × 5p × 1e × monthly) | 3,000 | 120 |
| Essentials (250 × 30p × 3e × weekly) | 97,425 | 1,916 |
| Growth (100 × 150p × 5e × weekly) | 324,750 | 4,287 |
| Managed (40 × ~100p × 5e × weekly) | 86,600 | 1,143 |
| Pro/Ent (10 × ~500p × 5e × weekly) | 108,250 | 1,429 |
| **Total** | **~620,000** | **~€8,900** |

Revenue at that mix ≈ **€105,650/mo**. API cost ≈ **8.4% of revenue.**
**The unit economics work.** That is the good news, and it is worth saying plainly:
nothing about this business model is structurally unprofitable at scale.

**Except one cell.** Growth on *daily* refresh — which the pricing page offers:

```
150 prompts × €0.066 × 30 days   = €297/mo raw API   vs.  €299/mo price
                        × 1.5     = €445/mo loaded    →   NEGATIVE gross margin
```

Weekly Growth is fine (€64/mo, ~79% margin). **Daily Growth loses money on every
client.** Cap it, throttle it, or reprice it — but don't sell it as-is.

### 4.6 Reliability: single points of failure

- 🔴 **OpenAI (ChatGPT)** — *currently failing*, `quota_exceeded`, since
  2026-07-07. Sole Free-tier engine; highest-cost, highest-credibility engine in
  every audit and scorecard. **Nothing in the product surfaces or alerts on this**
  — error rows are written correctly (the #95–#97 error-state work does its job),
  but no page or job watches them. The city-research write-ups repeatedly recorded
  "ChatGPT errored on all 8 prompts" as a *collection quirk*; it was never
  root-caused to a billing problem. It is one. *(Whether OpenAI-side balance
  alerting is configured on the account itself was not checkable from here — worth
  confirming.)*
- 🟠 **OpenRouter** — Perplexity *and* Meta both route through it (§2.7). One
  expired card takes out 2 of the 5 engines simultaneously.
- 🟠 **No global spend ceiling** on the client pipeline (§1 item 8).
- 🟡 **No unique constraint** on `(prompt_id, llm)` — dedup is done in application
  code ("skip if a row exists this month"), which is race-prone. Harmless with a
  browser-serialized loop; a real duplicate source the moment a queue/worker
  exists.

---

## 5. Honest summary

**BrandGEO is a well-built product with a well-researched go-to-market, sitting on
an operations layer that has never been tested and a billing account that ran dry
four days ago.**

The parts that get the most attention — design, content, accuracy, competitive
positioning — are in genuinely good shape, several of them ahead of the funded
competition. The parts that get none — the API balance, the database indexes, the
schema's tenant constraints, the gap between what the pricing page sells and what
the platform can physically produce — are where all the risk is.

The good news is how *cheap* the top of the list is. Items 1–3 are a top-up and
six SQL statements. Items 4–6 are decisions more than they are engineering. The
one genuinely hard thing — moving collection off the browser and onto a queue
(§4.2) — is also the one thing that unlocks the entire self-serve thesis, and it
is not urgent **until** the managed motion is proven (GTM-STRATEGY's own
sequencing: managed-first for revenue, self-serve scale second). That sequencing
is right. It just needs to be *chosen*, not defaulted into.

**One meta-observation worth acting on:** BrandGEO now has ten strategy and audit
documents and no dashboard for its own operational health. A 69.8% failure rate on
its flagship engine ran for four days across nine clients and surfaced only because
someone finally queried the table. `Usage.tsx` already renders per-engine
counts — surfacing `status='error'` next to them, with an alert, would have caught
this on day one.

---

## 6. Sources

Internal, all in this repo: `GTM-STRATEGY.md`, `COMPETITIVE-BENCHMARK.md`,
`reasoning-audit-findings.md`, `DESIGN-SYSTEM.md`, `content-audit-findings.md`,
`SALES-ENGINE.md`, `PRICING-SPEC.md`, `BILLING-IMPLEMENTATION.md`,
`SECURITY-AUDIT.md`, `CLAUDE.md` §1 / §2 / §4.1 / §7–§11.

Newly verified this session (not from any doc): live Supabase project
`duiyifepitvugyulobqm` (`pg_indexes`, `pg_constraint`, `ai_results` error rates by
engine, `response_text` size distribution, client/prompt/result counts);
`netlify/functions/_auth.js`, `_prospect_guard.js`, `_prospect_engines.js`,
`collect-prompt.js`, `stripe-webhook.js`; `src/lib/collectionContext.tsx`,
`src/lib/planConfig.ts`, `src/pages/Usage.tsx`; `netlify.toml`.
