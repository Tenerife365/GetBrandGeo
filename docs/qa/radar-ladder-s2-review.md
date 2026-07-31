# bg-verify: independent review of `f71a9b1` (Radar tier + ruled ladder)

**VERDICT: PASS WITH FINDINGS.**

Reviewed 2026-07-31 against `docs/strategy/sprint-ladder-ruling.md`,
`docs/AUTONOMY.md`, `docs/AGENT-OS.md` and production. Already pushed and
deployed, so this is a fix-forward review, not a gate.

Nothing inside the diff is wrong. Every constant traces to a signed decision,
value for value. All five load-bearing claims hold as stated, and I tried to
break each. What the commit gets wrong is its **boundary**: eight more
plan-keyed structures exist outside the four reviewed files, none has `radar`,
the builder named four of them and missed four, and the single most expensive
one is not in its list at all.

Work tree note: the four reviewed files are byte-identical to `HEAD`
(`git diff HEAD -- <the four>` is empty), so this review is of deployed code.
`stripe-webhook.js`, `provision-account.js` and the `social-*.js` set are
modified in the work tree by another agent; I reviewed those at `HEAD`.

---

## 1. The five claims, each attacked

### Claim 1. "16 plan-keyed maps needed a radar key and all 16 got one"

**TRUE as scoped, MISLEADING as framed.**

All 16 verified by key-set assertion, not by reading: 10 in `planConfig.ts`,
3 in `_cost.js` (`PLAN_LIVE_ENGINES`, `PLAN_MONTHLY_API_BUDGET_EUR`,
`PLAN_COLLECTION_COOLDOWN_HOURS`, plus `PLAN_LIVE_ENGINE_COUNT` derived), 3 in
`_plans.js` (`PLAN_ORDER`, `PLAN_LABELS`, `PLAN_BLURB`). Harness sections A and
B, 17 checks, all pass.

But "16 maps needed a radar key" is only true of the four files in scope. A
repo-wide multiline scan for object literals keyed by plan
(`rg -U "\{[^{}]*\bfree\s*:[^{}]*\bessentials\s*:[^{}]*\}"`) plus an array scan
finds **eight more**, and not one of them has `radar`:

| # | Location | Structure | Named by builder? | What a Radar customer actually gets |
|---|---|---|---|---|
| 1 | `_package_checkout.js:63` | `SELF_SERVE_PLANS` | yes | **Paid checkout provisions nothing.** See F1. |
| 2 | `_terms_gate.js:136` | `SELF_SERVE_CHECKOUT_PLANS` | yes | Contract gate answers `unknown_plan`: "radar is not a self-serve plan". See F1. |
| 3 | `seo-crawl.js:16` | `CRAWL_PAGE_CAP` | yes | **1 page crawl they were not sold.** See F3. |
| 4 | `seo-draft.js:27` | `DRAFT_MONTHLY_CAP` | **no** | 0 drafts. Correct outcome by luck (`?? 0`). |
| 5 | `social-publish.js:27` | `PLAN_RANK` | yes | rank 0, AI Social blocked. Correct. |
| 6 | `social-publish.js:30` | `PLAN_SOCIAL_CHANNEL_LIMIT` | **no** | 0 channels. Correct. |
| 7 | `social-publish.js:31` | `PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH` | **no** | 0 posts. Correct. |
| 8 | `Account.tsx:38` | `PLAN_TIERS` | **no** | **Their own plan is invisible on their billing page.** See F4. |

Plus `_collect.js:317` `CHATGPT_MODEL_BY_PLAN`, which the builder named as a
gap. **It is not one.** Radar is `['gemini','claude']`, so that map is never
consulted for a Radar client, and its fallback is the cheap model anyway. The
builder flagged the one harmless omission and missed the one that costs EUR 29.

`scripts/stripe-create-catalogue.js:50-64` also carries a three-plan list with
no radar. That matters because it is the tool that would create the price that
triggers F1.

### Claim 2. "The budget cap now fails closed"

**TRUE. `free` is the right fallback. One residual weakness, one overstatement.**

`_auth.js:269` is `PLAN_MONTHLY_API_BUDGET_EUR[plan] ?? PLAN_MONTHLY_API_BUDGET_EUR.free`.
All eight mapped plans resolve unchanged (harness F, 8/8: 0.30, 4.35, 14.85,
44.85, 67.35, 225, 225, 1500). `free` is correct rather than 0 because 0.30 is
the **minimum on the ladder**, so the fallback can never be more permissive than
the value it stands in for, which is the property that actually matters. I also
assert the key sets of `PLAN_MONTHLY_API_BUDGET_EUR` and `PLAN_LIVE_ENGINES` are
now identical, which is the coupling whose absence created the bug.

Two things the commit message does not say:

- **The chain terminates in a lookup on the same map.** If `free` were ever
  removed or renamed, `clientBudget` is `undefined` again and the original bug
  returns. A literal `?? 0.30` is strictly safer and costs nothing.
- **"Degrades the tier loudly without breaking it" is optimistic.** At EUR 0.30
  a Radar client is blocked after roughly four prompt-checks, about 7% of one
  weekly run. That is functionally an outage on a paid tier, just a slower one
  than 0 would be. Still the right direction; the comment oversells it.

**The class-of-bug hunt (the actual assignment).** I scanned every
`SOME_MAP[<plan expr>]` in `netlify/functions/` and `src/`, including
optional-chained and indirect forms. Every remaining dynamic plan lookup is
safe, and three that look unguarded are guarded by construction:

- `_auth.js:202` `PLAN_LIVE_ENGINE_COUNT[plan]` — no default, but
  `VALID_PLANS = Object.keys(PLAN_LIVE_ENGINE_COUNT)` at `_auth.js:28` and
  `plan` is coerced against `VALID_PLANS` at `:191`. Cannot miss.
- `set-client-plan.js:152` `PLAN_LABELS[plan]` — `isValidPlan(plan)` at `:118`.
- `_plans.js:98,:100` — `key` comes from `planUnlocks`'s own coercion.

Defaulted: `_cost.js:210,:469`, `_enqueue.js:246`, `seo-crawl.js:43`,
`seo-draft.js:171`, `social-publish.js:34,46,55,59`, `_collect.js:326`,
`stripe-webhook.js:334,750,751,823`, `Prompts.tsx:175,181`.
Type-safe `Record<Plan, …>`: `FeatureLocked.tsx:67,73`, `AIVisibility.tsx:1069`,
`getPlanLimits` (`planConfig.ts:624-632`, coerces to `free`).

**No unguarded plan-map lookup remains.** That is the honest answer to the
class-of-bug question, and it is a better result than the commit claims.

### Claim 3. "The cap is enforced"

**Both halves of `radar-unit-economics.md` confirmed against code. Quantified
with measured production costs, and the doc understates one of them.**

**(a) Checked once at enqueue, never re-checked.** `enqueue-collection.js:57`
calls `checkCollectionLimits` before creating the run. A repo-wide grep for
`checkCollectionLimits` returns `collect-chatgpt.js`, `collect-claude.js`,
`collect-prompt.js`, `enqueue-collection.js`, `schedule-collections.js` and
`_auth.js` itself. `collection-worker-background.js` is absent. Once a run is
admitted, every job in it executes.

**Overshoot, from 60 days of production `ai_results.cost_eur` rather than from
the fallback constants:**

| engine | rows | avg EUR | max EUR |
|---|---|---|---|
| gemini | 148 | 0.03389 | 0.03400 |
| claude | 146 | 0.01096 | 0.04014 |

- **Radar worst case:** 7 prompts x (0.03400 + 0.04014) = **EUR 0.5190** per
  full run. Against the EUR 4.35 cap that is an **11.9% overshoot**, settling at
  EUR 4.869. The doc says EUR 0.50498; it used the 0.032 *constant* for gemini
  where production meters 0.034, so it understates by 2.8%.
- **Structural worst case, all seven engines at measured maxima**
  (0.1234 + 0.0340 + 0.04014 + 0.0060 + 0.0150 + 0.13792 + 0.0920 = 0.44846 per
  prompt): Managed at its new 200-prompt cap is **EUR 89.69 in one admitted
  run, 39.9% over the EUR 225 cap.**
- **This commit enlarged that leak.** The overshoot scales with the prompt
  allowance, and the allowance just rose: Managed/pro 120 -> 200 (+67%),
  Growth PRO 35 -> 56 (+60%), Essentials 15 -> 18 (+20%). The economics doc
  treats the leak as a pre-existing general finding; it is, but this diff made
  it 67% bigger on the largest tier. Nobody has recorded that.
- Today's book bounds it in practice: the heaviest tenant has 8 active prompts,
  so the real overshoot right now is under EUR 4 on any plan. The number above
  is the bound as tenants fill their new allowances.

**(b) `runSinglePrompt` reaches the collectors with no cooldown check.**
Confirmed. `collectionContext.tsx:145` posts directly to `collect-prompt`,
`collect-claude`, `collect-chatgpt`. Those three call `checkCollectionLimits`
(budget + hourly ceiling) but never `checkCollectionCooldown`, which exists only
in `enqueue-collection.js:45` and `_enqueue.js:244`. So the 168h cadence the
tier is designed around is enforced on one of two paths.

**One thing the doc does not name: a TOCTOU race on that path.**
`runSinglePrompt` fires up to three collectors in parallel. Each independently
sums `ai_results.cost_eur` for the month before any of them has written a row,
so all three are admitted on the same pre-write total. Granularity of the budget
check on the refresh path is therefore *one prompt across all engines*, not one
row. Small for Radar (2 rows); it is a whole prompt-row-set on Managed.

### Claim 4. "No customer is harmed by the migration"

**TRUE. Re-verified read-only against production `duiyifepitvugyulobqm`.**

Eight rows exact, matching the ruling value for value:

```
free 5/1 · radar 7/1 · essentials 18/2 · growth 35/2 · growth_pro 56/3
managed 200/10 · pro 200/10 · enterprise 100000/25   (all updated_at 2026-07-31 16:13:34Z)
```

Trigger attached and enabled:
`trg_enforce_prompt_cap BEFORE INSERT OR UPDATE ON public.prompts`, `tgenabled = 'O'`.

Zero clients over cap, by plan (max active prompts vs cap): essentials 1/18,
free 2/5, growth 8/35, growth_pro 6/56, managed 5/200, pro 8/200. No client is
on `radar`. No allowance was reduced against the pre-change values (harness H).

**The two things nobody had checked, both clean:**

- **`enforce_prompt_cap()` does not read `site_allowance`.** I pulled the live
  `pg_get_functiondef`. It selects `prompt_cap` only, falls back to the `free`
  row, then to a hardcoded 5. The new column is inert to the trigger, exactly as
  the migration claims.
- **The `NOT NULL DEFAULT 1` column is safe for positional writes.**
  `ADD COLUMN` appends, so `site_allowance` is last in ordinal position and a
  two- or three-value `INSERT … VALUES` without a column list still resolves.
  The only `select *` on this table is in a commented-out verification query
  (`supabase-prompt-cap-migration.sql:166`); the sole code reader is
  `Prompts.tsx:177-181`, which selects `prompt_cap` by name. RLS is on with one
  select policy. Nothing breaks.

### Claim 5. "ENGINE_UNLOCK_PLAN is now correct"

**TRUE for all nine engines, not just the four that changed.** Asserted
programmatically: for each engine, the declared plan must equal the first entry
of `PLAN_ORDER` whose `PLAN_ENGINES` includes it.

```
chatgpt     'essentials' == lowest carrier 'essentials'   PASS
gemini      'free'       == 'free'                        PASS
claude      'radar'      == 'radar'                       PASS
perplexity  'growth'     == 'growth'                      PASS
meta        no carrier (retired), declared 'growth'       inert
google_ai   'growth'     == 'growth'                      PASS
ai_overview 'growth_pro' == 'growth_pro'                  PASS
copilot     'pro'        == 'pro'                         PASS
deepseek    'pro'        == 'pro'                         PASS
grok        'growth_pro' == 'growth_pro'                  PASS
```

The `google_ai` correction the builder flagged as its own judgement call is
right: `PLAN_ENGINES.growth` has carried it since 2026-07-28, so `growth_pro`
was telling Essentials customers to spend EUR 150 more than necessary.

**A false finding I generated and then refuted, recorded so nobody re-files it.**
My first harness pass flagged `PLAN_ENGINES.pro/enterprise` as diverging from
`_cost.js PLAN_LIVE_ENGINES` (TS carries `copilot` and `deepseek`, `_cost.js`
does not). That is deliberate: `COMING_SOON_ENGINES = {meta, copilot, deepseek}`
(`planConfig.ts:113`) are reserved in `PLAN_ENGINES` so those tiers auto-unlock,
while `_cost.js` carries live engines only. Comparing `PLAN_ENGINES` minus
`COMING_SOON_ENGINES` against `PLAN_LIVE_ENGINES` passes for all eight plans.

---

## 2. The three extra checks

**`_plans.js` `planRank` vs `planConfig.ts` `PLAN_ORDER`.** Agrees for all
eight, index for index, and `_plans.PLAN_ORDER` is `JSON.stringify`-identical to
`planConfig.PLAN_ORDER`. `planUnlocks('radar')` returns label `Radar`, two engine
labels, and the Radar blurb, so the silent-degrade-to-Free path that once
announced a EUR 449 upgrade as a downgrade does not fire for the new tier.

**The ruling's own two named hazards, which the commit message does not claim to
have read.** Both read, both correct:
- `Layout.tsx:57` `c.plan === 'free'` — Radar is not free, so it buckets to
  `Active`. Right: a paying tier belongs with the subscribers.
- `set-client-plan.js:134` `plan === 'free'` — a trial or comp grant of Radar is
  permitted. Right: Radar is a paid plan.

**`PLAN_BLURB.radar`, claim by claim.** This string is sent to a customer at the
moment they are charged, per the file's own comment.

| Claim | Verified against | Verdict |
|---|---|---|
| "Two AI engines" | `PLAN_LIVE_ENGINES.radar.length === 2` | TRUE |
| "Gemini and Claude" | `['gemini','claude']` | TRUE |
| does not name ChatGPT | regex, absent | TRUE, and correct: Radar does not carry it |
| "seven buyer prompts" | `PLAN_PROMPTS.radar === 7`, `plan_prompt_caps.radar = 7` | TRUE, DB-enforced |
| "for one website" | `site_allowance = 1` | TRUE today (D1 has not shipped, so a client is one row) |
| **"checked weekly"** | `PLAN_COLLECTION_COOLDOWN_HOURS.radar === 168` | **constant TRUE, product FALSE. See F2.** |
| no em or en dash | `[\u2014\u2013]` | clean, and clean across all eight blurbs |

**Can `radar` charge anyone today? No, and the builder's reason is wrong.**
No customer-facing path exists: `_terms_gate.js:136` refuses it, no Stripe price
or checkout link references it, `brandgeo/web/` contains no `radar` plan
reference, and `provision-account.js` writes `plan: 'free'` on self-serve signup.
But "no UI offers it" is false: `Account.tsx:580` and `Onboard.tsx:246` both
render `PLAN_ORDER.map(...)`, so **Radar appeared in two admin plan pickers
automatically the moment `PLAN_ORDER` changed**, and `set-client-plan.js:118`
accepts it. An admin can put a client on Radar right now. That is assignment
without charge, the safe direction, but it makes F3 and F4 live rather than
latent.

**Secret scan across the diff:** 11 matches, all in the two markdown analyses,
all naming mechanisms (`service_role`, a `$ADMIN_JWT` placeholder, `max_tokens`).
No value. Clean.

**AI-tell scan on the diff's added lines:** 3 em dashes, all in `planConfig.ts`
code comments, none in rendered copy. Per the standing baseline, comment hits are
not findings.

---

## 3. Findings, ranked by what they cost

### F1 — HIGH. A paid Radar checkout will take the money and provision nothing.

`radar` is absent from `SELF_SERVE_PLANS` (`_package_checkout.js:63`) and
`SELF_SERVE_CHECKOUT_PLANS` (`_terms_gate.js:136`).

`stripe-webhook.js:242` and `:575` both gate on `!SELF_SERVE_PLANS.includes(plan)`
and, on failure, log `unresolved/non-self-serve plan … skipping provisioning`,
return 200 to Stripe, and stop. Money taken, no entitlement, no error raised
anywhere, no retry.

This is not hypothetical. The ruling instructs S2 to create two live Stripe
Radar prices (`sprint-ladder-ruling.md`, decision 1 constants block), and
`AUTONOMY.md` §2 grants an agent authority to write Stripe prices **without
asking**. So the gap opens on the next agent that follows the ruling.

The identical hazard was closed for `growth_pro` on 2026-07-28 by adding it to
this list *before* its prices existed, and `_package_checkout.js:47-58` records
why in its own words, ending: *"Do not create the Stripe prices without this
line."* The precedent was written down and not applied to the next tier.

`tests/package_provisioning.test.js:274-277` cannot catch this: it asserts
`SELF_SERVE_PLANS ⊆ PLAN_ORDER`, which is the direction that was never at risk.

**Fix, before any Stripe Radar price exists:**
1. `_package_checkout.js:63` -> `const SELF_SERVE_PLANS = ['radar', 'essentials', 'growth', 'growth_pro'];`
2. `_terms_gate.js:136` -> `const SELF_SERVE_CHECKOUT_PLANS = ['radar', 'essentials', 'growth', 'growth_pro'];`
3. Add a `radar` entry to `STRIPE_CHECKOUT_LINKS` in Netlify env in the same
   change, or `resolveCheckout` returns `no_link` and the buyer sees an outage
   rather than a bad request.
4. Add `radar` to `scripts/stripe-create-catalogue.js` and
   `scripts/check-contract-gate.sh:81,125`.
5. Add the missing test direction to `package_provisioning.test.js`: every
   self-serve-intended plan is a member, not only that every member is a plan.

**Check (must print `radar` twice before a price is created):**
```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard" && \
node -e "console.log('pkg:',require('./netlify/functions/_package_checkout').SELF_SERVE_PLANS.join(','));" && \
rg -n \"SELF_SERVE_CHECKOUT_PLANS = \" netlify/functions/_terms_gate.js
```

### F2 — HIGH. "Checked weekly" is a claim the product cannot currently keep.

`PLAN_BLURB.radar` (`_plans.js:66`) promises *"checked weekly"*. It is the only
blurb of the eight that makes a cadence promise, and per the ruling weekly
collection is the tier's defining difference from Free.

**Nothing in the repository ever writes `refresh_cadence`.** A repo-wide grep
outside `docs/` returns only readers (`schedule-collections.js:67,68,78`) and the
column DEFAULT (`supabase-collection-queue-migration.sql:85`). Not
`onboard-client.js`, not `stripe-webhook.js`, not `provision-account.js`, not
`set-client-plan.js`, and no admin control.

Production, 2026-07-31: **all 36 clients are `refresh_cadence = 'manual'`.**
`schedule-collections.js:68` selects only clients whose cadence is in
`CADENCE_DAYS`, and `isDue()` returns false for `manual`. Nothing collects
automatically for anybody, on any plan.

So a Radar customer paying EUR 29 for a weekly trend line gets one collection a
month unless they press Force Refresh themselves, and the 168h constant the
blurb is checked against controls only how often they are *allowed* to press it.
The constant is real; the promise is not.

**Fix, pick one:**
- (a) Set `refresh_cadence = 'weekly'` when a client is provisioned onto any
  paid plan, and give the admin a control for it. This is the option that makes
  the copy true, and it is a spend decision, so it needs Constantin.
- (b) Reword to what ships today: *"…that you can refresh weekly for one
  website."* Cheap, honest, and does not oversell.

**Check (must return zero rows once (a) ships, and the blurb must not say
"weekly" until it does):**
```sql
select plan, refresh_cadence, count(*) from public.clients
 where plan <> 'free' and coalesce(refresh_cadence,'manual') = 'manual'
 group by 1,2;
```

### F3 — MEDIUM. Radar and Essentials get an AI SEO crawl they were not sold.

`seo-crawl.js:16` `CRAWL_PAGE_CAP` has no `radar` key. Line 43 reads
`CRAWL_PAGE_CAP[client?.plan] ?? 1`, so Radar resolves to **1**, and the refusal
at `:44` (`if (maxPages <= 0)`) never fires. A Radar client POSTing to
`/.netlify/functions/seo-crawl` with their own `client_id` passes the ownership
check at `:32` and gets a real crawl, a `seo_crawls` row, and a background
worker run. Radar has zero SEO entitlement: `PLAN_SEO_PAGE_CAP.radar = 0` and
`FEATURE_MIN_PLAN.ai_seo = 'growth'`.

Two pre-existing defects in the same three lines, both worth closing in the same
edit:

- **PRE-EXISTING.** `essentials: 1` contradicts `PLAN_SEO_PAGE_CAP.essentials = 0`.
  The Essentials AI SEO gate exists in the UI only; the server grants a page.
  Given that a competitor has self-service signed up to evaluate the product, a
  direct POST is a realistic path, not a theoretical one.
- **PRE-EXISTING, copy.** The refusal at `:45` reads *"Upgrade to Essentials or
  higher to audit your pages"*, which points a Free customer at a tier that
  grants 0 pages per `planConfig.ts`. AI SEO is Growth and up.

`seo-draft.js:28` has the same shape but defaults to `?? 0`, so Radar is
correctly blocked there. Its `essentials: 2` carries the same drift (F9).

**Fix:** `const CRAWL_PAGE_CAP = { free: 0, radar: 0, essentials: 0, growth: 10, growth_pro: 30, managed: 100, pro: 100, enterprise: 500 };`
and reword the refusal to name Growth. Better still, derive both from
`planConfig.PLAN_SEO_PAGE_CAP` rather than restating it.

**Check:**
```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard" && \
rg -n "CRAWL_PAGE_CAP = |DRAFT_MONTHLY_CAP = " -A2 netlify/functions/seo-crawl.js netlify/functions/seo-draft.js
```
Every plan in `PLAN_ORDER` must appear, and `radar` and `essentials` must be `0`.

### F4 — MEDIUM. A Radar customer's own billing page shows no plan and no CTA.

`Account.tsx:38-45` `PLAN_TIERS` has no `radar` row. `:335` computes
`currentIdx = displayedTiers.findIndex(p => p.id === activeClient?.plan)`, which
is `-1`, and `:500` computes `isUpgrade = currentIdx >= 0 && i > currentIdx`,
which is then false for every tier. The `:332` special case exists for exactly
this problem and covers only `pro`.

Result: no tier is marked as theirs, no tier offers an upgrade, and Free renders
as the cheapest available option to someone paying EUR 29.

Live today, not latent: `Account.tsx:580` and `Onboard.tsx:246` both enumerate
`PLAN_ORDER`, so an admin can already assign Radar.

**Fix:** insert `{ id: 'radar', label: 'Radar', price: '€29 / mo' }` after `free`
in `PLAN_TIERS`. Note the price string is a **launch** price with a list price of
EUR 39 behind it, so whoever writes it should decide which one a customer sees
and record that decision next to `PLAN_MONTHLY_API_BUDGET_EUR.radar`, which
carries the same two-prices-one-slot problem.

**Check:**
```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard" && \
node -e "const s=require('fs').readFileSync('src/pages/Account.tsx','utf8');const m=s.slice(s.indexOf('const PLAN_TIERS'),s.indexOf('const PRO_TIER_LEGACY'));for(const p of ['free','radar','essentials','growth','growth_pro','managed','enterprise'])if(!m.includes(\"'\"+p+\"'\"))console.log('MISSING',p)"
```

### F5 — MEDIUM, general, and this commit made it 67% larger.

The monthly EUR cap is checked once at enqueue and never re-checked per job, so
the effective cap is `budget + one full run`. Confirmed against code and
quantified with measured production costs in claim 3 above: Radar
**EUR 0.519 (11.9%)**, Managed structurally **EUR 89.69 (39.9%)**.

The new observation is that this diff raised the multiplier: Managed and legacy
pro went 120 -> 200 prompts (+67%), Growth PRO 35 -> 56 (+60%). The leak scales
with the allowance. Neither the commit message nor `radar-unit-economics.md`
records that the ladder change enlarged it.

Add to it the TOCTOU on the per-prompt refresh path (claim 3b): three collectors
fire in parallel and all read the spend total before any writes.

**Fix direction, not a fix:** the cheap half is a per-job budget re-check in
`collection-worker-background.js` between jobs, which turns the leak from one
run into one job. The expensive half is the missing cooldown on
`runSinglePrompt`; as `radar-unit-economics.md` §7 argues, reusing the 168h
cadence there would make the Refresh button useless, so this needs a deliberate
shorter per-prompt cooldown and is a **product decision, not a fix**. Both are
`bg-backend` on Opus with a ruling first.

**Check:**
```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard" && \
rg -c "checkCollectionLimits" netlify/functions/collection-worker-background.js && \
rg -c "checkCollectionCooldown" netlify/functions/collect-claude.js
```
Both should print a non-zero count once closed. Both print nothing today.

### F6 — LOW. `_auth.js` carries its fail-closed rationale twice.

`_auth.js:230-253` and `:254-268` are two independent drafts of the same
explanation, both kept. Harmless at runtime, but it has a second-order effect:
it shifted the code down ~39 lines, and `radar-unit-economics.md` cites
`_auth.js:230-239`, `:232` and `:237` for the budget comparison, which now
resolve to comment text. The comparison is at `:269-271`. Same drift on
`_cost.js:529-532` and `:530`, cited for the Radar cooldown, which is at
`:566-568`.

The doc landed in the same commit as the code it cites, so this is recoverable
only by reading. Under `AUTONOMY.md` §1 a citation that does not resolve is not
evidence. Delete one comment block and re-derive the doc's line numbers.

### F7 — LOW. The applied migration still says it has not been applied.

`db/supabase-plan-caps-2026-07-31-migration.sql:8` reads
`⚠️ NOT YET APPLIED`. It was applied 2026-07-31 16:13:34Z and I verified all
eight rows. Safe to re-run (`ADD COLUMN IF NOT EXISTS` + `ON CONFLICT`), so the
risk is a future session's confusion, not damage. The 2026-07-29 wasted cycle
recorded in `AUTONOMY.md` §1 came from exactly this kind of stale prose.

### F8 — LOW, informational, and it is good news.

`_cost.js:415-417` states Radar's marginal cash is *"about EUR 1.00 per client
per month"* for Claude. That is derived from the 0.033 **fallback constant**.
146 measured Claude rows average **EUR 0.01096**, so the real figure is
7 x 0.01096 x 4.333 = **EUR 0.33 per client per month**. Radar's margin is
better than the ruling claims, not worse. Worth truing up before the number is
reused in a costing.

### F9 — LOW, PRE-EXISTING. `seo-draft.js:28` `essentials: 2` vs `PLAN_SEO_DRAFTS_PER_MONTH.essentials = 0`.

Same drift class as F3, same fix. Radar is correctly blocked here already.

---

## 4. Refuted, so nobody re-files them

- **`_collect.js` `CHATGPT_MODEL_BY_PLAN` missing `radar`.** Named by the
  builder as a gap. Unreachable: Radar carries no `chatgpt` engine, and the
  fallback is the cheap model. Not a finding.
- **`social-publish.js` PLAN_RANK and the two limit maps missing `radar`.**
  `?? 0` gives rank 0, below `AI_SOCIAL_MIN_RANK = 2`, so AI Social is refused.
  Correct outcome. All eleven `social-*.js` functions are `adminOnly` besides.
- **`PLAN_ENGINES` vs `PLAN_LIVE_ENGINES` diverging on `pro`/`enterprise`.**
  Deliberate: `COMING_SOON_ENGINES` are reserved so those tiers auto-unlock.
  My own harness raised this and it is wrong.
- **`_auth.js:202` `PLAN_LIVE_ENGINE_COUNT[plan]` unguarded.** Safe by
  construction: `VALID_PLANS` is `Object.keys` of that exact map.
- **`set-client-plan.js:152` `PLAN_LABELS[plan]` unguarded.** `isValidPlan` at
  `:118`.
- **The ruling's two named equality hazards.** `Layout.tsx:57` and
  `set-client-plan.js:134` both classify Radar correctly.

---

## 5. Checks actually run, with output

Reproduced against a **clean `git archive` of `f71a9b1`** (not the work tree,
which carries another agent's in-flight edits), with the repo's `node_modules`
junctioned in:

```
npx tsc --noEmit                            TSC_EXIT=0
vite build                                  BUILD_EXIT=0, built in 7.45s
tests/package_provisioning.test.js          63 checks passed, exit 0
tests/engine_routing.test.js                5 checks passed, exit 0
ladder audit harness (this review, below)   144 passed, 8 failed, exit 1
```

The 8 failures are section D2, one per external map from claim 1's table. They
are findings, not harness errors.

Production, read-only, project `duiyifepitvugyulobqm`:
`plan_prompt_caps` 8 rows exact; `trg_enforce_prompt_cap` present, `tgenabled='O'`;
zero clients over cap; `enforce_prompt_cap()` does not reference `site_allowance`;
all 36 clients `refresh_cadence='manual'`; 60-day per-engine `cost_eur` table
reproduced in claim 3.

### The harness, and its mutation matrix

Written for this review and mutation-tested, because this repo has recorded
source-regex assertions being defeated by commenting a line out and
deletion-only mutation missing it twice. Section D2 strips `//` and `/* */`
before matching for that reason. Every mutation produces at least one failure
the baseline does not:

| mutation | result | vs baseline 144/8 |
|---|---|---|
| none (baseline) | 144 passed, 8 failed | — |
| `drop-radar-prompts` (delete `PLAN_PROMPTS.radar`) | 139 / 13 | +5 |
| `unlock-wrong` (`ENGINE_UNLOCK_PLAN.claude='essentials'`) | 143 / 9 | +1 |
| `rank-drift` (remove `radar` from `_plans.PLAN_ORDER`) | 132 / 20 | +12 |
| `budget-drift` (`radar` budget 4.35 -> 99) | 143 / 9 | +1 |
| `engines-drift` (`PLAN_LIVE_ENGINES.radar=['gemini']`) | 140 / 12 | +4 |
| `persite-inversion` (`growth_pro` 56 -> 30) | 141 / 11 | +3 |

`budget-drift` initially produced **zero** extra failures, because the first
draft asserted only that the fallback was inert, never that 4.35 was the right
number. Section L was added to pin every ruled constant to
`sprint-ladder-ruling.md` value for value. That is the mutation test earning its
keep, and it is worth saying plainly: without it this review would have passed a
wrong price.

To rebuild it:

```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard"
./node_modules/.bin/esbuild src/lib/planConfig.ts --format=cjs --platform=node \
  --outfile=/tmp/planConfig.cjs
# then require /tmp/planConfig.cjs, netlify/functions/_cost.js and _plans.js and assert:
#  A  every Record<Plan,…> in planConfig has exactly PLAN_ORDER's keys
#  B  _cost.js and _plans.js mirrors carry the same 8 keys
#  C  planRank(p) === PLAN_ORDER.indexOf(p) for all 8
#  D  PLAN_ENGINES minus COMING_SOON_ENGINES === PLAN_LIVE_ENGINES, per plan
#  D2 the 8 external maps in claim 1's table each contain 'radar' (comments stripped)
#  E  ENGINE_UNLOCK_PLAN[e] === first PLAN_ORDER entry carrying e, all 9 engines
#  F  budget[p] ?? budget.free === budget[p] for all 8; unmapped resolves to 0.30
#  G  PLAN_PROMPTS[p]/site_allowance[p] strictly increases across the ladder
#  H  no allowance below the pre-change values 5,15,35,35,120,120,100000
#  I  PLAN_BLURB.radar claim by claim; no em/en dash in any blurb
#  L  every ruled constant pinned to sprint-ladder-ruling.md, value for value
```

---

## 6. What was NOT checked

- **Stripe.** I did not query or write Stripe. Whether a Radar price already
  exists is unverified; I confirmed only that no repo artifact creates or
  references one. **F1 assumes no price exists yet. Confirm that in the Stripe
  dashboard before treating F1 as merely a hazard rather than a live one.**
- **F3 is reasoned from source, not exercised.** I did not POST to
  `/.netlify/functions/seo-crawl` as a Radar or Essentials viewer, because that
  spends crawl budget against a live surface and `AUTONOMY.md` §2 withholds
  spending authority. The path is read end to end; it is not demonstrated.
- **`npm ci` was not run.** `tsc` and `vite build` ran against a clean archive of
  `f71a9b1` with the existing `node_modules` junctioned in, so a dependency drift
  between `HEAD` and the installed tree would not show.
- **The migration DOWN path was not executed.** Read only.
- **No runtime test of the budget fallback.** Sections F and L prove the eight
  mapped plans resolve unchanged and that an unmapped key resolves to 0.30, by
  evaluating the real map. I did not drive a real collection through
  `checkCollectionLimits` with a corrupt plan.
- **Section D2 is still a source scan.** It strips comments, so commenting a key
  out will not fool it, but it will be fooled by a key introduced via spread, a
  computed property name, or a map moved to another file. It proves those eight
  maps lack `radar` today; it cannot prove no ninth map exists.
- **No accessibility or visual review.** No UI file changed in this commit. F4
  is a data-completeness defect found by reading, not a rendered observation; I
  did not load the Account page as a Radar client, and no such client exists.
- **`docs/arch/client-notifications.md`** (1,459 lines, same commit) was not
  reviewed. Out of scope for this packet; it changes no code.
- **Whether EUR 29 is the right price.** That is a signed decision, not a review
  question. I verified only that every number in the diff matches it.

---

## 7. Recommended order

1. **F1** before any Stripe Radar price is created. This is the only one that
   takes money and returns nothing, and the action that triggers it is
   pre-authorised by `AUTONOMY.md`.
2. **F2**, and it needs Constantin, not a builder. Option (a) is a spend
   decision; option (b) is a copy edit. Until one lands, do not sell Radar.
3. **F3** and **F4** together, one `bg-backend` and one `bg-app` pass.
4. **F5** needs a ruling before a build.
5. **F6, F7, F8, F9** are hygiene and can ride along with anything above.

Nothing here justifies reverting `f71a9b1`. The ladder, the migration, the
fail-closed budget and the corrected unlock labels are all right, and the
migration-before-code sequencing was the correct call and was actually followed.
