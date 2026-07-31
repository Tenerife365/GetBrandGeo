# SCALE-SPEC.md — Consumption Caps, Rate Limits & the Collection Queue

> **Date:** 2026-07-11 · **Owner:** `Master-StateOfProduct` (CLAUDE.md §12) — spec only.
> **Source of the problem:** `STATE-OF-PRODUCT.md` §1 items 4/5/6 and §4.
> **Constantin's decision (2026-07-11), which this spec implements:**
> *"The plan is paid monthly, so cost should be measured monthly at what maximum
> they can consume."* — i.e. **stop selling prompts × cadence and sell a monthly
> consumption cap.** Plus his constraint: **API cost ≤10% of revenue per client**,
> with the Free tier and prospecting spend absorbed inside that.
>
> **Status: nothing here is built.** Implementation is delegated (§6). The only
> thing already done is the DB fix from STATE-OF-PRODUCT §4.3 — indexes +
> `competitors` tenant-scoped uniqueness — **applied live 2026-07-11, verified.**

---

## 0. The core idea

Today a plan is sold as *"150 prompts, weekly/daily refresh."* That is an
**unbounded cost commitment** — the cost is `prompts × engines × however often
someone clicks refresh`, and nothing in the system caps the product of those
three. That's why Growth is 14.3% of revenue on weekly and 99% on daily.

Replace it with a **monthly check quota**:

> **1 check = 1 prompt, run once, across all the engines your plan includes.**

The client spends checks however they like — many prompts refreshed rarely, or few
prompts refreshed often. **The monthly cost is capped by construction**, whatever
they choose. The 10% rule stops being a hope and becomes an invariant.

This is also a familiar buying motion: AthenaHQ sells credits (3,600/mo at $295),
Rankscale is credit-based. It is not a downgrade to explain.

---

## 1. The budget model

**Per-paying-client API budget = 9% of that client's MRR.** The reserved 1% (to
reach the 10% ceiling) absorbs the Free tier and prospecting — see §1.3.

### 1.1 Cost per check — REPRICED 2026-07-11 against official published rates

> **The `Usage.tsx` `ENGINE_COST` table is wrong, and it is wrong in the dangerous
> direction — it is too LOW, not too high.** Invoice-division was ruled out
> (Constantin: the OpenAI key is shared across other work), so instead each engine
> was priced from its **official public rate card** against the **exact model and
> tool config in the code**, using the measured average response size from
> production (`response_text` avg = **2,598 chars ≈ 650 output tokens**, n=243).

**Config actually in the code** (grepped, not assumed): `gpt-5.5` + `web_search_preview`
(**no `max_output_tokens` set**) · `claude-sonnet-4-6`, `max_tokens: 1000`, +
`web_search_20250305` (`max_uses: 1`) · `gemini-2.5-flash` **with Google Search
grounding** · `perplexity/sonar` and `meta-llama/llama-3.1-70b-instruct` via OpenRouter.

| Engine | Published rate | Derivation | **Real €/call** | `Usage.tsx` | Gap |
|---|---|---|---:|---:|---:|
| **ChatGPT** (gpt-5.5) | $5/$30 per MTok + **$10 / 1k** web_search_preview calls | tool $0.010 + ~8.2k input tok $0.041 + output **uncapped** (reasoning tokens bill at $30/M) ~$0.030 | **≈ 0.075** | 0.040 | **2×** |
| **Claude** (Sonnet 4.6) | $3/$15 per MTok + **$10 / 1k** searches | tool $0.010 + ~7.7k input tok $0.023 + 650 output tok $0.010 | **≈ 0.040** | 0.018 | **2.4×** |
| **Gemini** (2.5 Flash + grounding) | **$35 / 1,000 grounded prompts** (1,500/day free) | grounding $0.035 + tokens ~$0.002 | **≈ 0.034** | 0.001 | 🔴 **35×** |
| Perplexity (sonar) | OpenRouter | ~$0.006 | ≈ 0.006 | 0.005 | ok |
| Meta (Llama 3.1 70B) | OpenRouter | ~$0.001 | ≈ 0.001 | 0.002 | ok |

| Plan | Engines | **€ / check (today's config)** |
|---|---|---:|
| Free | 1 (ChatGPT) | **0.075** |
| Essentials | 3 (ChatGPT, Gemini, Claude) | **0.149** |
| Growth / Managed / Pro / Enterprise | 5 (all live) | **≈ 0.156** |

**A 5-engine check costs ~2.4× what the codebase believed** (€0.156, not €0.066).
The quota table originally drafted here would have put Growth at **~19% of
revenue**, not 8.8%.

> **Confidence:** these are derived from published rate cards + the measured
> response size, not from an invoice. The token-count assumptions (esp. how many
> search-result tokens land in context, and how many reasoning tokens `gpt-5.5`
> burns) carry ±30% uncertainty. **They are far better grounded than the numbers
> they replace, and they are conservative in the right direction.** The
> `cost_eur` column in §2.1 exists precisely so this stops being guesswork —
> once it ships, actual cost is metered per row and the quotas can be trued up
> from real data.

### 1.1b Three config changes cut this ~45% — do these BEFORE fixing the quotas

None of these degrade the product. All three are cheap.

| # | Change | Saving | Why it's safe |
|:--:|---|---|---|
| **1** | **Use the Batch API** — OpenAI and Anthropic both bill batch at **50% off** tokens. | ChatGPT €0.075→€0.046, Claude €0.040→€0.027 | Collection **does not need to be real-time.** It only ever was because it ran in a browser tab. **The §3 queue unlocks this for free** — this is now the single strongest argument for building it. |
| **2** | **Switch Gemini to a 3.x model.** Gemini 2.5 grounds at **$35/1k**; Gemini **3.x** grounds at **$14/1k** with 5,000 free/month. | €0.034 → **€0.015** | A one-line model-string change in `collect-prompt.js` (`gemini-2.5-flash` → the current 3.x flash). Grounding still on; same behaviour. |
| **3** | **Cap `gpt-5.5`'s output.** No `max_output_tokens` is set today, and it is a *reasoning* model — reasoning tokens bill as **output at $30/M**, uncapped. Set a cap (~1,000, matching Claude) and low reasoning effort. | Included in #1's figure; removes the tail risk | Responses average 650 tokens. Nothing is being truncated — this just stops paying for unbounded reasoning. |

**Optimised cost per 5-engine check ≈ €0.085** (ChatGPT 0.046 + Claude 0.027 +
Gemini 0.015 + Perplexity 0.006 + Meta 0.001 ≈ $0.092 ≈ **€0.085**).
Essentials' 3-engine check ≈ **€0.079**.

Also available, not counted above: **prompt caching** on Claude (the system context
is identical on every call → cache reads cost 0.1× input) — a further small win.

### 1.1c "Let's switch ChatGPT and Claude" — the honest menu

*(Constantin, 2026-07-11. Answered with numbers rather than a yes/no, because the
two engines are expensive for **different** reasons and only one of them warrants
a model switch.)*

**First, the thing that is not a trade-off at all — Claude's web search is a bug.**

`CLAUDE.md` §1.2 says Claude runs in *"training-data mode (no web search)"*. Task
**#63** — *"Remove web search from Claude — use training data mode"* — is marked
**DONE**. But `collect-claude.js` still sends
`tools: [{ type: 'web_search_20250305', max_uses: 1 }]`. The reasoning audit
flagged this doc/code mismatch (§1.4) and nobody reconciled it. **That one tool is
~75% of Claude's cost:** $0.010 search fee + ~7k search-result tokens injected into
context. Deleting it *does what the task list already claims was done*:

| Claude config | Cost/call |
|---|---:|
| Today (Sonnet 4.6 + web search) | **€0.040** |
| Sonnet 4.6, **no web search** (the documented intent) | **€0.010** |
| Sonnet 4.6, no web search, **+ batch** | **€0.005** |
| Haiku 4.5 + web search | €0.021 |
| Haiku 4.5, no web search | €0.004 |

**Recommendation: remove the web-search tool, keep Sonnet 4.6.** −75% for free, no
downgrade, and it makes the code match its own documentation. A model switch to
Haiku buys almost nothing on top of that (€0.010 → €0.004) while measurably
changing what Claude says — not worth it.

**Second, ChatGPT — this one is a genuine product decision, not a free win.**

| ChatGPT config | Cost/call | What it costs you |
|---|---:|---|
| Today: `gpt-5.5` + web search, **uncapped output** | **€0.075** | — |
| `gpt-5.5`, output capped, low reasoning effort | €0.060 | Nothing. Responses average 650 tokens; you're just not paying for unbounded reasoning. |
| `gpt-5.5`, capped + **Batch API** | **€0.046** | Nothing — collection isn't real-time once the §3 queue exists. |
| **`gpt-5.4-mini`** ($0.75/$4.50) + web search, batched | **€0.015** | **Changes what you measure.** |
| `gpt-5.4-nano` ($0.20/$1.25) + web search, batched | €0.012 | Ditto, more so. |

Note the floor: the **$10/1,000 web-search fee is €0.009 of every ChatGPT call
regardless of model.** At `gpt-5.4-mini` the search fee is ~60% of the cost — so
past that point, switching models buys you very little more.

> **The line I'd hold, and why.** BrandGEO's entire claim is *"this is what ChatGPT
> tells your buyers."* Your own research (BG-009, and the whole city-research
> programme) argues that **model choice changes citation behaviour** — that is
> literally one of the product's findings. Measuring with a cheap model would make
> your research contradict your product, and it's the kind of thing a competitor or
> a sharp prospect can catch. **Changing billing mode and token caps is free.
> Changing which model answers is a product decision that has to be made
> deliberately and disclosed.**
>
> **If you do switch ChatGPT to `gpt-5.4-mini`, do it with eyes open:** state the
> model in the methodology, and consider running the **flagship on a lower-frequency
> deep sweep** (e.g. monthly) alongside the mini on the routine checks — you keep a
> credible flagship reading and pay mini prices for the tracking. That hybrid is
> the best of both and costs ≈€0.020/check blended.

**Recommended order (each independently shippable):**

| Step | Change | 5-engine check |
|:--:|---|---:|
| — | Today | €0.156 |
| 1 | **Remove Claude's web search** (bug fix, #63) | €0.126 |
| 2 | **Gemini 2.5 → 3.x** grounding ($35→$14/1k) | €0.107 |
| 3 | **Cap `gpt-5.5` output** + reasoning effort | €0.092 |
| 4 | **Batch API** (unlocked by the §3 queue) | **€0.062** ⭐ |
| 5 | *(optional)* ChatGPT → `gpt-5.4-mini` | €0.031 |

**Steps 1–4 involve no model change, no capability loss, and land at €0.062 —
below the €0.066 the codebase originally (wrongly) assumed.** Step 5 is the only
one that trades credibility for cost, and after steps 1–4 you may not need it.

**Scenario C — quotas after steps 1–4 (€0.062/check, €0.057 Essentials):**

| Plan | Price | 9% budget | **Quota** | API cost | % of revenue |
|---|---:|---:|---:|---:|---:|
| Free | €0 | — | **5 checks** | €0.17 | *(absorbed)* |
| Essentials | €99 | €8.91 | **155 checks** | €8.84 | 8.9% |
| Growth | €299 | €26.91 | **430 checks** | €26.66 | 8.9% |
| Managed | €900 | €81.00 | **1,300 checks** | €80.60 | 9.0% |
| Pro | €1,500 | €135.00 | **2,150 checks** | €133.30 | 8.9% |
| Enterprise | from €10,000 | €900.00 | **14,500 checks** | €899.00 | 9.0% |

**Scenario C is better than the original withdrawn ladder** (155/430/1,300/2,150/
14,500 vs 150/400/1,200/2,000/12,000) — achieved with zero product compromise, just
by fixing a bug, updating one model string, capping one parameter, and batching.
**This is the target.**

### 1.2 The quota table — TWO scenarios, pick after §1.1b ships

Quota = `floor(0.09 × price ÷ cost-per-check)`, rounded down to a clean number.

**Scenario A — today's config (€0.156/check, €0.149 for Essentials' 3 engines):**

| Plan | Price/mo | 9% budget | **Quota** | API cost | % of revenue |
|---|---:|---:|---:|---:|---:|
| Free | €0 | — | **3 checks** | €0.23 | *(absorbed)* |
| Essentials | €99 | €8.91 | **60 checks** | €8.94 | 9.0% |
| Growth | €299 | €26.91 | **170 checks** | €26.52 | 8.9% |
| Managed | €900 | €81.00 | **500 checks** | €78.00 | 8.7% |
| Pro | €1,500 | €135.00 | **850 checks** | €132.60 | 8.8% |
| Enterprise | from €10,000 | €900.00 | **5,700 checks** | €889.20 | 8.9% |

**Scenario B — after the §1.1b optimisations (€0.085/check, €0.079 Essentials):** ⭐

| Plan | Price/mo | 9% budget | **Quota** | API cost | % of revenue |
|---|---:|---:|---:|---:|---:|
| Free | €0 | — | **5 checks** | €0.23 | *(absorbed)* |
| Essentials | €99 | €8.91 | **110 checks** | €8.69 | 8.8% |
| Growth | €299 | €26.91 | **310 checks** | €26.35 | 8.8% |
| Managed | €900 | €81.00 | **950 checks** | €80.75 | 9.0% |
| Pro | €1,500 | €135.00 | **1,550 checks** | €131.75 | 8.8% |
| Enterprise | from €10,000 | €900.00 | **10,500 checks** | €892.50 | 8.9% |

> **Recommendation: ship §1.1b first, then publish Scenario B.** Scenario A's
> numbers (60 checks on Essentials, 170 on Growth) are commercially weak and would
> have to be walked back the moment the optimisations land. The optimisations are
> days of work, not weeks, and #1 is a free side-effect of the queue you're
> building anyway.
>
> **The originally-drafted ladder (150 / 400 / 1,200 / 2,000 / 12,000) is
> withdrawn — it was computed from the wrong cost table.** Scenario B is ~25%
> below it.

**Annual plans get 12× the monthly quota, metered monthly** (no roll-over — a
roll-over would re-introduce an unbounded month).

### 1.3 The Free tier and prospecting fit inside the reserve

*(Scenario B numbers — post-optimisation, €0.046/ChatGPT-only check.)*

| | Cost/month |
|---|---:|
| 600 Free users × 5 checks × €0.046 | €138 |
| Prospecting audits (`PROSPECTING_MONTHLY_BUDGET_EUR`, already capped) | €200 |
| **Non-revenue total** | **€338** |

At the STATE-OF-PRODUCT §4.5 1,000-client mix (250 Essentials · 100 Growth ·
40 Managed · 10 Pro · 600 Free), **with every paying client consuming their full
quota**:

```
Essentials  250 × €8.69   =  €2,173
Growth      100 × €26.35  =  €2,635
Managed      40 × €80.75  =  €3,230
Pro          10 × €131.75 =  €1,318
Free        600 × €0.23   =    €138
Prospecting               =    €200
                            ─────────
Total API                   €9,694
Revenue                   €105,650
                            ─────────
                             = 9.2%   ✅ under 10%, worst case, everything included
```

**That is the whole rule, satisfied at maximum consumption**, not at expected
consumption. Real usage will sit well below it. *(Under Scenario A the same mix
lands at ~9.3% — the rule still holds; the quotas are just commercially weaker.)*

### 1.4 What the quotas mean in practice (for marketing copy)

The quota is the *cap*; the client picks the trade-off. Same €299 Growth plan
(Scenario B, 310 checks/month):

| If they want… | They can run… |
|---|---|
| Broad coverage, checked monthly | **310 prompts**, once a month |
| Balanced | **150 prompts**, every 2 weeks (325 checks — just over; 140 fits) |
| Tight and frequent | **70 prompts**, weekly (303 checks) |
| A focused core set, near-daily | **10 prompts**, every 2 days (150 checks) |

**Markets and brands consume checks, they don't need separate metering.** The same
prompt run in 2 markets = 2 checks. This is a real simplification — it removes the
double-metering problem in the current add-on model (§4).

### 1.5 Why "daily refresh" has to come off the pricing page

At the optimised €0.085/check (Scenario B), a *daily* full sweep costs
€2.55/prompt/month. Within a 9% budget:

| Plan | Prompts supportable on a **daily** full sweep |
|---|---:|
| Growth (€299) | **10** |
| Managed (€900) | **31** |
| Pro (€1,500) | **52** |
| Enterprise (€10k) | **352** |

Daily full-depth monitoring is not a Growth-tier product at these engine costs. It
is an Enterprise one. The quota model handles this gracefully — a Growth client
*can* run 10 prompts daily if that's what they want — but **"daily refresh" must
stop being advertised as a Growth feature.**

---

## 2. Rate limits, redesigned

Today: a flat `RATE_LIMIT_PER_HOUR = 150` rows/client in `_auth.js`. This is doing
two unrelated jobs badly — cost control *and* abuse control — and it fails at both
(a 5-engine client is capped at 30 prompts/hour, so a Growth client is 429'd
mid-refresh and can never complete one).

**Split it into three distinct controls.**

### 2.1 Monthly cost budget — the real cost control ⭐

Meter **euros, not rows.** This encodes Constantin's rule literally, and it
auto-adapts when engine prices change (which they will, and which is exactly why
the current row-based limit rotted).

**Schema change:**

```sql
-- Mirror what prospect_audits already does (it stores estimated_cost_eur).
ALTER TABLE public.ai_results
  ADD COLUMN IF NOT EXISTS cost_eur numeric(10,5);

CREATE INDEX IF NOT EXISTS idx_ai_results_client_cost_month
  ON public.ai_results (client_id, checked_at);   -- already added 2026-07-11 ✅
```

Every collector (and the worker in §3) writes `cost_eur` per row from a single
shared `ENGINE_COST` table — **which must move out of `Usage.tsx` into
`planConfig.ts`/`_analysis.js`-style shared config**, since it is currently
duplicated by hand in `Usage.tsx` *and* `_prospect_engines.js` (CLAUDE.md already
flags this as a keep-in-sync-by-hand hazard).

**Enforcement:** before enqueuing/running any check, sum `cost_eur` for the client
in the current calendar month; refuse if it would exceed
`PLAN_MONTHLY_API_BUDGET_EUR[plan]`.

```ts
// planConfig.ts
export const PLAN_MONTHLY_CHECKS: Record<Plan, number> = {
  free: 5, essentials: 150, growth: 400, managed: 1200, pro: 2000, enterprise: 12000,
}
export const PLAN_MONTHLY_API_BUDGET_EUR: Record<Plan, number> = {
  free: 0.25, essentials: 9, growth: 27, managed: 81, pro: 135, enterprise: 900,
}
```

Two caps, deliberately — checks is what the customer sees and buys; euros is what
actually protects the business if the cost estimates are wrong. **The euro cap is
the backstop; the check cap is the product.**

### 2.2 Hourly ceiling — abuse circuit-breaker only

Keep an hourly limit, but stop pretending it's a cost control. It exists to stop a
runaway loop (the real token-burn incident it was written for). Make it
plan-derived so it never blocks legitimate use:

```js
// _auth.js — replaces the flat 150
const hourlyRowCeiling = Math.max(150, activePromptCount * engineCount)
```

That permits exactly **one full sweep per hour** and nothing more. A Growth client
can force-refresh their whole prompt set; they cannot loop it.

### 2.3 Global platform ceiling — new, currently missing

The *prospect audit* path has a monthly budget ceiling. The *paying-client* path
has none — 1,000 clients × their limits is an unbounded platform bill if anything
goes wrong. Mirror it:

```
PLATFORM_MONTHLY_API_BUDGET_EUR   (env var, e.g. 12000)
```

Sum `cost_eur` across **all** clients for the month; hard-stop new collection and
alert when exceeded. This is the last line of defence and it costs one query.

---

## 3. The collection queue (the architecture fix)

The real blocker: `collectionContext.tsx` runs the collection loop **in the user's
browser tab**, one prompt at a time, ~26s each. Growth's prompt set ≈ 65 minutes
tab-open; Enterprise ≈ 7 hours. And there is **no scheduler at all** (§2.8), so
every refresh cadence sold on the pricing page is, today, a human clicking a
button. This cannot scale to 1,000 clients — not slowly, *at all*.

### 3.1 Target shape

```
  scheduler (cron, hourly)          worker (background fn, chained)
  ─────────────────────────         ────────────────────────────────
  for each active client:           claim a batch of pending jobs
    is a refresh due?                 (FOR UPDATE SKIP LOCKED)
    budget remaining?               run each: call engines directly
    → enqueue collection_jobs       write ai_results + cost_eur
                                    mark job done / retry on failure

  browser: polls collection_runs for progress. It watches. It is not the runtime.
```

### 3.2 Schema

```sql
CREATE TABLE public.collection_jobs (
  id            bigserial PRIMARY KEY,
  client_id     int  NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  prompt_id     int  NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  market_id     text,
  region_label  text,
  engines       text[] NOT NULL,
  status        text NOT NULL DEFAULT 'pending',   -- pending|running|done|failed
  attempts      int  NOT NULL DEFAULT 0,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  claimed_at    timestamptz,
  finished_at   timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_collection_jobs_claim
  ON public.collection_jobs (status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_collection_jobs_client ON public.collection_jobs (client_id, status);
ALTER TABLE public.collection_jobs ENABLE ROW LEVEL SECURITY;  -- deny-all; service_role only

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS refresh_cadence text DEFAULT 'weekly',  -- monthly|biweekly|weekly|custom
  ADD COLUMN IF NOT EXISTS last_refresh_at timestamptz;
```

Also add the missing dedup guard, which the browser-serialized loop was
accidentally providing and a concurrent worker will not:

```sql
-- prevents two workers double-writing the same (prompt, engine) in one run
ALTER TABLE public.ai_results
  ADD COLUMN IF NOT EXISTS run_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_results_run_prompt_llm
  ON public.ai_results (run_id, prompt_id, llm) WHERE run_id IS NOT NULL;
```

### 3.3 Functions

| Function | Type | Job |
|---|---|---|
| `schedule-collections.js` | scheduled, `0 * * * *` | For each active client: is a refresh due per `refresh_cadence`? Is there budget (§2.1) and quota left? → insert `collection_jobs` rows, **jittered across the hour** so 1,000 clients don't all fire at :00. |
| `collection-worker-background.js` | background (15 min) | Claim a batch, run each job, write `ai_results` + `cost_eur`, mark done. Self-chain if pending work remains. Concurrency ~5 in-flight prompts per invocation. |
| `_collect.js` | shared module (new) | **Refactor `collect-prompt`/`collect-claude`/`collect-chatgpt` into callable functions**, so the worker calls the engines directly instead of HTTP-calling Netlify functions from inside Netlify. The three HTTP endpoints stay (the manual "Refresh this prompt" button still uses them) but become thin wrappers over the shared module — exactly the `_analysis.js` extraction pattern that already worked. |

**Capacity check:** the 1,000-client mix needs ~124,000 prompt-runs/month ≈ 172/hour.
At ~26s each with 5 concurrent in a 15-min background invocation, one invocation
handles ~170 prompts. **~1–2 worker invocations per hour covers the entire
1,000-client load.** This is comfortably feasible — the problem is architectural,
not a capacity wall.

> ⚠️ **Unmeasured:** Netlify's account-level concurrent-function limit. Check it
> before finalising the worker's concurrency, since it becomes the binding
> constraint the moment collection moves server-side.

### 3.4 Frontend change

`collectionContext.tsx` stops being the runtime. `runCollection()` becomes
"enqueue jobs + poll progress." The existing progress UI (`collecting`,
`progress`, `lastCompletedAt`) can be kept nearly as-is — it just reads job counts
from Supabase instead of counting its own `fetch` calls. **The user can close the
tab.** That alone is the single biggest UX improvement in this spec.

---

## 4. What this breaks upstream (the fan-out)

Moving to a check quota is not just a `planConfig.ts` change. Every surface that
states a prompt count or a cadence has to move with it, or we recreate exactly the
terms.html-vs-index.html inconsistency this project already had to fix once.

| # | Surface | Change | Owner |
|---|---|---|---|
| 1 | `PRICING-SPEC.md` | Rewrite §1/§2 in checks, not prompts×cadence. This doc's §1.2 table is the new source of truth. | Master-GTM |
| 2 | `brandgeo/web/index.html` | Pricing cards: "150 prompts / weekly" → "400 checks/month". **Remove "daily refresh" from Growth** (§1.5). Add the "1 check = 1 prompt across your engines" explainer. | Master-SiteDesign |
| 3 | `brandgeo/web/faq.html` | The 3 pricing Q&As + `FAQPage` JSON-LD. Add "what is a check?". | Master-SiteDesign |
| 4 | `brandgeo/web/terms.html` | Plan table + the pricing sections. | Master-SiteDesign |
| 5 | `planConfig.ts` | `PLAN_MONTHLY_CHECKS` + `PLAN_MONTHLY_API_BUDGET_EUR`; move `ENGINE_COST` here from `Usage.tsx`. | Master-DashboardDesign |
| 6 | `_auth.js` | §2.1–2.3 (budget check, plan-derived hourly, global ceiling). | Master-DashboardDesign |
| 7 | Dashboard UI | A **quota meter** ("312 / 400 checks used this month") — this is now a first-class product surface, not an admin curiosity. `Usage.tsx` is the natural home. | Master-DashboardDesign |
| 8 | **Stripe add-ons** | ⚠️ **The current add-on prices break the 10% rule.** "Prompt Pack +100 prompts, €200/mo" — if those 100 prompts run weekly, that's 433 checks = €28.60 API on €200 = **14.3%**. Restate as **"+250 checks, €200/mo"** (€16.50 = 8.3% ✅). The *Additional Market* / *Additional Brand* add-ons can then be simplified — under a check model they unlock capability and consume checks from the quota, so they don't need their own metering. | Master-Billing |

---

## 5. Risks & open questions (named, not buried)

1. 🟠 **The costs in §1.1 are derived, not invoiced.** Invoice-division was ruled
   out (the OpenAI key is shared with other work), so they come from official rate
   cards applied to the exact model/tool config, with ±30% uncertainty on the
   token-count assumptions (search-result tokens in context; `gpt-5.5` reasoning
   tokens). They are **much** better grounded than the numbers they replace, and
   they err conservative. **The `cost_eur` column (§2.1) is the permanent fix** —
   once it ships, cost is metered per row and quotas can be trued up from real
   data instead of re-litigated.
2. 🟠 **The competitive optics of a check quota need thought — I am not going to
   pretend this is a pure win.** Peec advertises ~100 prompts with daily refresh at
   $199 (≈3,000 runs/month); Growth at ~310 checks/month will look smaller on a
   spec-sheet comparison. Three possible explanations, and it matters which is
   true: (a) our per-call costs are genuinely higher — **and §1.1 now says they
   are**: we run 5 engines by default including the two most expensive, *both with
   web search on*, where Peec sells extra engines as €20–30 add-ons; (b) they run
   cheaper configs (no grounding, smaller models); or (c) they are VC-subsidised.
   **Master-GTM should decide the positioning before Master-SiteDesign writes the
   copy.** The honest framing is "5 engines, all with live web search, included —
   no engine add-ons": **depth per check, not count of checks.**
3. 🟠 **Do not "solve" cost by downgrading the engines.** The product's core claim
   is *"this is what the real ChatGPT/Gemini tells your buyers."* Measuring it with
   a model nobody uses, or with web search turned off, invalidates the metric —
   that's not a cost optimisation, it's a different (worthless) product. Everything
   in §1.1b is safe precisely because it changes *billing mode and token limits*,
   not *which model answers* or *whether it searches the web*. Hold that line.
4. 🟡 **Existing clients.** The 12 current clients (incl. 7 internal city-research
   ones) have no quota today. Grandfathering is not needed — per PRICING-SPEC §5
   item 6 there's no grandfathering policy anyway — but the internal research
   clients (ids 10–16, plan `pro`) will start consuming a real quota, so give them
   an `enterprise`-level or unmetered internal flag.
5. 🟡 **No roll-over.** Unused checks expire monthly, by design (roll-over
   re-creates the unbounded month this spec exists to kill). Say so in the terms.

---

## 6. Build order

**Revised 2026-07-11 after the §1.1 repricing.** Step 1 is no longer "read the
invoices" (ruled out — shared key); it is now "make the engines cheaper," because
the optimisations in §1.1b are what make the quota ladder commercially viable.

| # | Step | Owner | Blocking? |
|:--:|---|---|---|
| 0 | ✅ **DONE 2026-07-11** — indexes + `competitors` tenant-scoped uniqueness (STATE-OF-PRODUCT §4.3), applied live and verified. | — | — |
| 1 | Top up the OpenAI account (STATE-OF-PRODUCT §1 item 1 — 69.8% of ChatGPT calls failing since 2026-07-07). | Constantin | Yes |
| 2 | **Engine cost optimisations (§1.1b) — the two cheap ones now:** switch Gemini to a 3.x grounded model ($35→$14 per 1k), and cap `gpt-5.5`'s `max_output_tokens` + reasoning effort. **Also correct `ENGINE_COST` to the §1.1 figures.** ~1 hour of work, ~35% cost cut. | Master-DashboardDesign | **Yes — the quotas key off it** |
| 3 | `planConfig.ts` quotas (Scenario B) + shared `ENGINE_COST`; `_auth.js` §2.1–2.3; `cost_eur` column, written on every row. **Kills the Growth 429 immediately, and starts metering real cost.** | Master-DashboardDesign | No |
| 4 | The queue + scheduler + worker (§3) — **and switch the collectors to the Batch API while you're in there** (§1.1b #1; the queue is what makes batch possible). `collectionContext.tsx` becomes a poller. | Master-DashboardDesign | No |
| 5 | **True up the quotas from `cost_eur`** after ~2 weeks of real data. This is the step that ends the guessing permanently. | Master-DashboardDesign | No |
| 6 | Quota meter in the dashboard (§4 row 7). | Master-DashboardDesign | No |
| 7 | Pricing surfaces: PRICING-SPEC, index/faq/terms, Stripe add-on correction (§4). **Publish Scenario B, not the withdrawn ladder.** | Master-GTM → Master-SiteDesign → Master-Billing | No |

Steps 2, 3 and 4 are the same chat's scope but should be **three commits** — 2 and
3 are small, contained, and independently valuable; 4 is the big one.

**Suggested kickoff for step 4+5:**
`Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
Master-DashboardDesign per SCALE-SPEC.md §2 and §3 — implement the plan-derived
rate limits + monthly euro budget first (step 4, its own commit), then the
collection queue/scheduler/worker (step 5). Scope: brandgeo-dashboard/ only.`
