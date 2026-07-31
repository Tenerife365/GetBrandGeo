# PASS WITH FINDINGS

Independent review of the uncommitted plan-limit drift fix (`_plans.js` PLAN_LIMITS
+ `planLimit()`, and the three functions that stopped hand-writing the ladder).
Reviewed by `bg-verify` (Opus) on 2026-07-31 against the worktree
`C:\Users\const\Constantin Daniel Goane\BrandGEO\.claude\worktrees\gracious-lichterman-481fb4`.

**Safe to commit.** Nothing this change introduces is unsafe. Every claim the
builder made was tested against the code or production and all five survived. The
findings below are one live pre-existing entitlement exposure that predates this
change and is unaffected by it, one revenue gap created by the S1 ladder commits,
and one design contradiction inside this change that needs a one-line ruling and
not a rebuild.

One HUMAN CHECKPOINT is raised (F1). It does not block this commit.

---

## 0. Calibration (bg-verify SYSTEM VERIFICATION)

**1. `git diff --stat`, and does every changed file sit inside a packet `scope_write`?**

```
 brandgeo-dashboard/netlify/functions/_plans.js     | 80 +++++++++++++++++++++-
 brandgeo-dashboard/netlify/functions/seo-crawl.js  | 20 ++++--
 brandgeo-dashboard/netlify/functions/seo-draft.js  | 16 ++---
 .../netlify/functions/social-publish.js            | 36 ++++++----
 4 files changed, 122 insertions(+), 30 deletions(-)
?? brandgeo-dashboard/tests/plan_limits_drift.test.js
```

**There is no packet.** `.claude/handoffs/` runs `001` to `013` and
`grep -rl "seo-crawl\|PLAN_LIMITS\|plan_limits" .claude/handoffs/` returns nothing.
So no `scope_write` exists to measure the five changed paths against. This is a
deviation from AGENT-OS section 4, recorded as **F8**. It is not an automatic BLOCK,
because the task message supplied five falsifiable claims (a) to (e) which I have
used as the acceptance criteria and which are objectively checkable (see section 3).
All five changed paths are inside `bg-backend`'s standing write scope
(`brandgeo-dashboard/netlify/functions/`) per the AGENT-OS section 1 roster, plus
one new test file. No file outside that scope was touched.

**2. Secret scan across the diff (count only, no values):**

```
$ git diff -U0 | grep -ciE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role"
0
```

Zero hits. No secret, key or connection string appears in the diff in any form.

**3. Acceptance criteria, verbatim, and whether each is objectively checkable.**
Taken from the task message, since there is no packet:

> a. No paid tier's allowance changed. Only radar (crawl 1 -> 0) and essentials
>    (crawl 1 -> 0, drafts 2 -> 0) lose access, and neither was ever entitled.
>    Nothing changes what any customer is CHARGED.
> b. AI Social's allow/deny outcome is IDENTICAL for all eight plans before and
>    after, despite every rank shifting by one.
> c. planLimit fails closed for every unknown/malformed plan input.
> d. No behavioural regression in the three handlers beyond (a).
> e. The load-time assertion cannot fire on runtime/tenant data. It reads only two
>    constants in the same file.

All five are objectively checkable. (a), (b) and (c) are decidable by executing the
old and new logic over the full plan domain. (d) is decidable by reading the three
handlers. (e) is decidable by reading `_plans.js:103` to `:134`. None is written in
a way that requires judgement. **No criterion is unverifiable as written.**

**4. tsc and build baseline before this change.**
Neither can be run in this worktree and that is environmental, not a regression:

```
$ ls -d node_modules
NO node_modules

$ npx --no-install tsc --noEmit
                This is not the tsc command you are looking for
```

`npm run build` is likewise unrunnable. `tsconfig.json` has `"include": ["src"]` and
no `.ts` or `.tsx` file is in the diff, so neither tool would read a changed file
even if installed. The baseline that IS establishable is the node test suite,
run below in section 2, where two failures are proven environmental.

**5. The auth check guarding the most sensitive function touched.**
`social-publish.js:82`, `const auth = await requireAuth(event);` with **no**
`{ adminOnly: true }`. Client ownership is enforced separately at
`social-publish.js:93`. This is load-bearing and is finding **F1**: it contradicts
`src/lib/planConfig.ts:417` to `:419`, which asserts in writing that all eleven
`social-*.js` functions carry `requireAuth({ adminOnly: true })`. Seven of eleven
do not (measured, section 4).

**6. Write access.** I wrote exactly one file, `docs/qa/plan-limits-drift-fix.md`,
plus one scratch script outside the repo. I edited no file under review, ran no
mutating git command (`status`, `diff` only), and executed only `SELECT` statements
against Supabase.

**CALIBRATED** (with the packet gap recorded as F8).

---

## 1. What I did not inherit

The builder asked to be refuted rather than confirmed. Two things moved as a result.

- I built an independent differential of the **deleted** logic against the **new**
  logic over the whole plan domain, rather than reading the new code and agreeing
  with it. That is what proves (b) rather than asserting it. Output in section 3.
- I formed a HIGH finding that the new module-load throw newly endangers
  `stripe-webhook.js`, then **refuted my own finding**: `_plans.js:19` already
  requires `_cost.js`, which has carried a module-load throw since before this
  change, so `stripe-webhook.js` was already exposed to that failure mode. The
  finding survives only in the weaker form recorded as **F3**.

---

## 2. Standard checks

**The new test, reproduced independently (not the builder's run):**

```
$ node --version
v24.16.0
$ cd brandgeo-dashboard && node tests/plan_limits_drift.test.js

1. The mirror matches planConfig.ts, value for value
  ok  every PLAN_LIMITS table is covered here (5)
  ok  seoPages matches PLAN_SEO_PAGE_CAP for all 8 plans
  ok  seoAuditsPerWeek matches PLAN_SEO_AUDITS_PER_WEEK for all 8 plans
  ok  seoDraftsPerMonth matches PLAN_SEO_DRAFTS_PER_MONTH for all 8 plans
  ok  socialChannels matches PLAN_SOCIAL_CHANNEL_LIMIT for all 8 plans
  ok  socialPostsPerChannel matches PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH for all 8 plans

2. The ladder itself, and the specific values the ruling fixed
  ok  PLAN_ORDER matches index for index (free < radar < essentials < growth < growth_pro < managed < pro < enterprise)
  ok  radar gets 0 SEO pages and 0 drafts (sprint-ladder-ruling.md decision 1)
  ok  essentials gets 0 SEO pages and 0 drafts (AI SEO moved to Growth+ 2026-07-29)
  ok  the paid SEO tiers are unchanged: growth 10, growth_pro 30
  ok  radar ranks below growth and gets 0 social channels

3. planLimit() fails closed, which is the actual defect
  ok  an unknown, empty, mistyped or non-string plan gets 0 on every limit
  ok  an unknown limit name throws instead of silently returning 0
  ok  every plan in PLAN_ORDER is priced in every limit table

4. No function hand-writes the ladder any more
  ok  seo-crawl.js carries no per-plan literal and reads _plans.js
  ok  seo-draft.js carries no per-plan literal and reads _plans.js
  ok  social-publish.js carries no per-plan literal and reads _plans.js
  ok  seo-crawl.js no longer defaults an unpriced plan to 1 page

18 checks passed.
EXIT=0
```

18 checks, exit 0. The test is honest about its own limit in its footer (no DB, no
HTTP), and I closed that gap separately in section 5.

**Full node test suite:**

```
tests/analysis.test.js                     PASS
tests/competitor_aggregate.test.js         FAIL: Error: Cannot find module 'typescript'
tests/competitor_filter.test.js            PASS
tests/engine_routing.test.js               PASS
tests/no_answer_rows.test.js               FAIL: Error: Cannot find module 'typescript'
tests/package_provisioning.test.js         PASS
tests/plan_limits_drift.test.js            PASS
```

**The builder's "environmental" reading of the two failures is CONFIRMED**, and on
stronger evidence than "neither references `_plans.js`":

```
tests/competitor_aggregate.test.js:17:const ts = require('typescript')
tests/no_answer_rows.test.js:30:const ts = require('typescript')
```

Both fail at `require('typescript')`, a devDependency absent because `node_modules`
is not installed in this worktree. Neither file appears in `git diff --stat`. The
failure is the missing package, not the change.

**Module-load smoke test of the whole `_plans.js` blast radius** (this is the check
that proves the new throw is not firing):

```
set-client-plan          loads OK
expire-plan-grants       loads OK
stripe-webhook           Error: Cannot find module 'stripe'
_package_checkout        loads OK
seo-crawl                loads OK
seo-draft                loads OK
social-publish           loads OK
```

`stripe-webhook` fails on `require('stripe')` at `stripe-webhook.js:45`, before
`require('./_plans')` at `:48`. `grep -c "_plans"` over its stack trace returns `0`.
Environmental, not the assertion.

**AI-tell scan on the changed files:**

```
$ rg -n "[—–]" <the five changed files>
tests/plan_limits_drift.test.js:2,21,42,64,158   (block comments)
netlify/functions/seo-draft.js:126,164           (pre-existing, unchanged by this diff)
```

No em dash or en dash in any string a customer can read. The new customer-facing
string at `seo-crawl.js:55` is clean. `seo-draft.js:126` is `deDash()`, which exists
to strip them. The five hits in the new test file are code comments, matching
existing practice in this codebase; recorded as informational, not a finding.

---

## 3. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| a1 | No paid tier's allowance changed | **PASS** | Differential below: `growth` 10/10, `growth_pro` 30/30, `managed` 100/60, `pro` 100/60, `enterprise` 500/200 all identical old to new. Only `radar`, `essentials` and unknown values move. |
| a2 | radar crawl 1 -> 0, essentials crawl 1 -> 0 and drafts 2 -> 0 | **PASS** | Differential below marks exactly those rows CHANGED. Old `radar` value of 1 comes from the `?? 1` fallback at the deleted `seo-crawl.js` line, not from a table row. |
| a3 | Neither was ever entitled | **PASS** | `planConfig.ts:560-563` `PLAN_SEO_PAGE_CAP` = 0 for both; `:572-575` `PLAN_SEO_DRAFTS_PER_MONTH` = 0 for both; `:431-434` `FEATURE_MIN_PLAN.ai_seo = 'growth'`, and `radar` (rank 1) and `essentials` (rank 2) both sort below `growth` (rank 3). |
| a4 | Nothing changes what any customer is CHARGED | **PASS** | No price constant is in the diff. `PLAN_MONTHLY_API_BUDGET_EUR` (`_cost.js:540-548`) untouched; no Stripe file in `git diff --stat`. |
| a5 | No live customer loses something they were using | **PASS (checked against production, beyond the builder's own stated limit)** | Section 5. One `essentials` client exists (id 27) with `crawls_ever=0`, `seo_pages=0`, `briefs_ever=0`, `drafts_ever=0`, `social_targets=0`. Zero `radar` clients. |
| b | AI Social allow/deny identical for all plans | **PASS** | Differential: `compared 96 (plan,channel) pairs across 12 plan values; differences: 0`. |
| c | `planLimit` fails closed for unknown/malformed plans | **PASS** | Test section 3 covers `'radar_plus'`, `'legacy_gold'`, `''`, `'FREE'`, `'growth '`, `null`, `undefined`, `0`, `{}`, all returning 0. Mechanism at `_plans.js:163`: `isValidPlan(plan) ? table[plan] : 0`, and `isValidPlan` (`:136-138`) requires `typeof p === 'string'` and `PLAN_ORDER.includes(p)`, so prototype keys (`constructor`, `__proto__`) also return 0. |
| d | No behavioural regression beyond (a) | **PASS** | `seo-crawl.js` read line for line: only line 50 and the line 55 string changed; the cooldown at `:66-80`, the running-crawl guard at `:58-64`, the worker kick at `:88-98` are untouched. `seo-draft.js`: only `:171`. `social-publish.js`: only `:35-36`, `:39-44`, `:52`, `:61`, `:65`. Cap comparison operators unchanged (`>= cap` at `seo-draft.js:177`, `> limit` at `social-publish.js:62`), so a 0 cap denies rather than divides by zero. |
| e | The load-time assertion cannot fire on runtime/tenant data | **PASS** | `_plans.js:122-134` iterates `Object.entries(PLAN_LIMITS)` (module constant, `:103`) crossed with `PLAN_ORDER` (module constant, `:30`). No parameter, no `process.env`, no I/O. It is deterministic per deploy. See F3 for the separate question of whether the throw belongs on this require chain. |
| f | The mirror equals `planConfig.ts` value for value | **PASS** | Test section 1, all 5 tables x 8 plans, plus a key-set equality assert at `plan_limits_drift.test.js:79-82` that would catch a plan priced upstream and missing downstream, which is the `radar` defect exactly. |
| g | No function still hand-writes a per-plan SEO/social map | **PASS** | Test section 4, plus my own independent grep in section 4 of this report, which searched wider than the test does. |
| h | The copy change is correct and belongs here | **PASS** | Section 6. |
| i | The frontend needs no matching change | **PASS** | Section 6. |
| j | Secret hygiene | **PASS** | Calibration answer 2, count 0. |
| k | tsc | **NOT CHECKED** | Not runnable (no `node_modules`). No `.ts` file changed and `tsconfig.json` includes only `src`, so it would not read a changed file. Stated, not claimed. |
| l | `npm run build` | **NOT CHECKED** | Same cause. Stated, not claimed. |

**The differential (my own, reconstructing the deleted logic from the diff's `-`
lines and running it against the new code):**

```
AI SOCIAL: compared 96 (plan,channel) pairs across 12 plan values; differences: 0

plan          crawl OLD->NEW   drafts OLD->NEW
free            0 ->   0          0 ->   0
radar           1 ->   0          0 ->   0   <-- CHANGED
essentials      1 ->   0          2 ->   0   <-- CHANGED
growth         10 ->  10         10 ->  10
growth_pro     30 ->  30         30 ->  30
managed       100 -> 100         60 ->  60
pro           100 -> 100         60 ->  60
enterprise    500 -> 500        200 -> 200
gold            1 ->   0          0 ->   0   <-- CHANGED
null            1 ->   0          0 ->   0   <-- CHANGED
undefined       1 ->   0          0 ->   0   <-- CHANGED
                1 ->   0          0 ->   0   <-- CHANGED
```

The 96 AI Social pairs cover 12 plan values (the 8 real ones plus `gold`, `null`,
`undefined`, `''`) against 8 channels including the two add-on channels and three
managed-only ones. Zero differences. The rank shift is genuinely absorbed: old
`AI_SOCIAL_MIN_RANK` 2 and `MANAGED` 4 against new 3 and 5 preserve every
comparison, because `radar` was inserted below both thresholds.

The `null` / `undefined` / `gold` rows are the only outcomes the builder did not
name. They are the intended fail-closed direction, and section 5 proves no such row
exists in production, so nobody is stranded by them.

---

## 4. Regression surface (by grep, not intuition)

**Who requires the changed module:**

```
$ grep -ln "require('./_plans')" netlify/functions/*.js
_package_checkout.js
expire-plan-grants.js
seo-crawl.js
seo-draft.js
set-client-plan.js
social-publish.js
stripe-webhook.js
```

Seven functions, four of them not in this diff. What each imports:

| File:line | Imports | Touched by the new throw? |
|---|---|---|
| `set-client-plan.js:25` | `isValidPlan, planRank, planUnlocks, PLAN_LABELS, PLAN_ORDER` | Yes, at module load only |
| `expire-plan-grants.js:31` | `PLAN_LABELS` | Yes, at module load only |
| `stripe-webhook.js:48` | `PLAN_LABELS` | Yes, at module load only. See F3. |
| `_package_checkout.js:45` | `isValidPlan` | Yes, at module load only |

None of the four reads `planLimit` or `PLAN_LIMITS`, so their behaviour is unchanged
for every input. Verified: `grep -rn "PLAN_LIMITS\|planLimit"` over `netlify`, `src`
and `tests` returns only the three changed handlers, `_plans.js` itself, the new
test, and unrelated `getPlanLimits` calls in `src/pages/AIVisibility.tsx` (a
different, frontend-only function).

**Does anything else still hand-write a per-plan SEO or social map?** I searched
wider than the test does, on both `growth_pro:` and `(essentials|radar):<number>`
across the whole dashboard:

```
_cost.js:447   PLAN_LIVE_ENGINES        (engines, deliberate separate mirror, not a limit table)
_cost.js:545   budget EUR               (deliberate, documented, out of scope here)
_cost.js:567   cooldown hours           (deliberate, documented, out of scope here)
_collect.js:320                         (model id per plan, not an entitlement limit)
_package_checkout.js:63  SELF_SERVE_PLANS   -> see F2
_terms_gate.js:136       SELF_SERVE_CHECKOUT_PLANS -> see F2
_plans.js:103-109        PLAN_LIMITS (the new single mirror)
```

**Confirmed: the builder found all of them for SEO and social entitlement.** No
fourth copy survives. The `_cost.js` entries are a different, separately documented
mirror (engines, budget, cooldown) and are correctly out of scope. The two
`SELF_SERVE` lists are plan membership lists for checkout, not limit tables, and
carry their own finding (F2).

**Frontend consumers of the three endpoints:**

```
src/pages/SEO.tsx:409     invokes 'seo-crawl'
src/pages/SEO.tsx:319     invokes 'seo-draft'
src/pages/Social.tsx:631  invokes 'social-publish'
```

Plus display mirrors at `src/pages/SEO.tsx:459` and `src/pages/Social.tsx:1375,1430`
(both via `getPlanLimits`, which reads `planConfig.ts` directly, so they cannot
disagree with the new server mirror by construction), and
`src/components/CooldownCountdown.tsx:8`.

**Paths that need a manual look before or after commit:** none for this change.
`src/pages/SEO.tsx` and `src/pages/Social.tsx` were read and require no edit
(section 6). `stripe-webhook.js`, `set-client-plan.js`, `expire-plan-grants.js` and
`_package_checkout.js` need no edit but are named in F3 as the blast radius of the
new throw.

**Auth posture of every sibling endpoint on the two surfaces** (measured, and this
is where F1 and F4 come from):

```
social-accounts.js    requireAuth(event)
social-boost.js       requireAuth(event, { adminOnly: true })
social-brandkit.js    requireAuth(event, { adminOnly: true })
social-delete.js      requireAuth(event)
social-generate.js    requireAuth(event, { adminOnly: true })
social-image.js       requireAuth(event)
social-link.js        requireAuth(event)
social-profile.js     requireAuth(event, { adminOnly: true })
social-publish.js     requireAuth(event)
social-queue.js       requireAuth(event)
social-status.js      requireAuth(event)

seo-audit-page.js     requireAuth(event)
seo-crawl.js          requireAuth(event)
seo-draft.js          requireAuth(event)
seo-opportunities.js  requireAuth(event)
seo-crawl-background.js   (no requireAuth; shared-key gate, see F5)
```

---

## 5. Production check (the gap the builder declared)

The builder stated: "No DB or HTTP check was performed against a live
Radar/Essentials tenant." I closed the DB half with read-only `SELECT`s.

```sql
SELECT COALESCE(plan,'(NULL)') AS plan, count(*) FROM public.clients GROUP BY 1 ORDER BY 2 DESC;
```
```
pro 27 | managed 3 | free 2 | growth 2 | essentials 1 | growth_pro 1
```

Three things follow, and all three matter to the verdict:

1. **Zero `radar` clients exist.** The tier was created today. So the crawl
   revocation for `radar` is theoretical, not customer-impacting.
2. **Exactly one `essentials` client exists, and it has never touched AI SEO.**
   ```
   id 27 | plan essentials | crawls_ever 0 | last_crawl NULL | seo_pages 0
         | briefs_ever 0 | drafts_ever 0 | last_draft NULL | social_targets 0
   ```
   Nobody loses a capability they were exercising. This upgrades criterion (a) from
   "correct in principle" to "safe in fact", and it is the check that would have
   found a customer-impacting migration under `docs/AUTONOMY.md` if one existed.
3. **No client row has a NULL or unrecognised plan.** Every value in the table is a
   member of `PLAN_ORDER`. This is the one risk the fail-closed change carried:
   under the old `?? 1`, a NULL-plan client got a 1-page crawl; under the new code
   they get 0 and a "not included on this plan" message. There are no such rows, so
   the risk does not materialise. Legacy `pro` (27 clients, the largest cohort) IS
   in `PLAN_ORDER` at rank 6 and keeps `seoPages` 100 / `seoDraftsPerMonth` 60,
   unchanged.

---

## 6. Data and claim integrity

Every user-facing number produced by the changed code, traced to source:

| String or value the customer sees | Source | Traced |
|---|---|---|
| `max_pages` in the `seo-crawl` response (`seo-crawl.js:100`) | `planLimit('seoPages', ...)` -> `_plans.js:104` -> `planConfig.ts:560-563` `PLAN_SEO_PAGE_CAP` | Yes |
| "monthly draft limit (`${cap}`)" (`seo-draft.js:180`) | `planLimit('seoDraftsPerMonth', ...)` -> `_plans.js:106` -> `planConfig.ts:572-575` | Yes |
| "allows `${limit}` social channel(s) per post" (`social-publish.js:63`) | `planLimit('socialChannels', ...)` -> `_plans.js:107` -> `planConfig.ts:578-581` | Yes |
| "post limit (`${cap}` per channel)" (`social-publish.js:76`) | `planLimit('socialPostsPerChannel', ...)` -> `_plans.js:108` -> `planConfig.ts:584-587` | Yes |
| All 40 constants in `PLAN_LIMITS` | asserted equal to the five `planConfig.ts` tables by `tests/plan_limits_drift.test.js`, run independently above | Yes |

**No untraceable number.** The upstream tables themselves trace to
`docs/strategy/sprint-ladder-ruling.md`, which carries Constantin's
`DECIDED 2026-07-31` lines.

**The copy change, judged on its own (`seo-crawl.js:55`).**
Old: "Upgrade to Essentials or higher to audit your pages."
New: "Upgrade to Growth or higher to audit your pages."

*Is it correct?* Yes. `planConfig.ts:433` sets `FEATURE_MIN_PLAN.ai_seo = 'growth'`
and `planConfig.ts:561` sets `PLAN_SEO_PAGE_CAP.essentials = 0`. The old sentence
told a Free or Radar customer to spend EUR 99 on Essentials for a feature Essentials
does not include. That is not a style preference, it is a false statement made at
the moment of an upsell.

*Did it belong in this change?* Yes, and this is the stronger argument. The same
gate already speaks to the customer through a second surface:
`src/components/FeatureLocked.tsx:67` renders "AI SEO is included on the
{PLAN_LABELS[plan]} plan" where `plan = featureUnlockPlan('ai_seo')` = `growth`
(`planConfig.ts:665-667`). So the UI already said Growth while the server said
Essentials. The edit removes a contradiction between two renderings of one gate
rather than introducing new copy. Leaving it would have shipped a commit that
corrects the number and knowingly keeps the sentence about it wrong.

*Caveat, honestly stated:* it is still a customer-facing string edited inside a
backend change, and `docs/copy/` is `bg-copy`'s scope under AGENT-OS section 1.
Recommend telling `bg-copy` after the commit rather than reverting it. Both
sentences are free of em dashes, en dashes and every banned word in AGENT-OS
section 7.3.

**Does the frontend need a matching change? No, verified rather than assumed.**
`src/pages/SEO.tsx:452` gates on `hasFeature(plan, 'ai_seo')`, which is
`planRank(plan) >= planRank('growth')` (`planConfig.ts:655-658`). With `radar` at
index 1 and `growth` at index 3, `radar` and `essentials` are already excluded with
no edit, exactly as `planConfig.ts:37-41` predicted when `radar` was positioned.
`src/pages/Social.tsx:793` gates on `hasFeature(plan, 'ai_social')`, which returns
false for every plan because of `ADMIN_ONLY_FEATURES` (`planConfig.ts:422`). The
display caps at `SEO.tsx:459` and `Social.tsx:1375,1430` come from `getPlanLimits`,
which reads `planConfig.ts` directly. **Claim confirmed.**

---

## 7. Security findings

Ranked by severity. Each one is demonstrable; nothing speculative is listed.

### F1. HIGH, PRE-EXISTING, LIVE. `social-publish.js` admits paying customers to a feature no plan sells, and `planConfig.ts` documents the opposite as fact.

**What.** `ADMIN_ONLY_FEATURES` contains `ai_social` (`planConfig.ts:422`), so
`hasFeature(plan, 'ai_social')` returns false for every plan and every customer sees
a coming-soon screen with no purchase path (`Social.tsx:793` ->
`FeatureLocked.tsx:35-57`, "Nothing to buy today"). The server disagrees:
`social-publish.js:82` calls `requireAuth(event)` with no `adminOnly`, and
`enforceSocialLimits` admits any plan at or above `growth`
(`social-publish.js:52`).

**Where.** `brandgeo-dashboard/netlify/functions/social-publish.js:82` and `:99-102`.
The false claim is at `brandgeo-dashboard/src/lib/planConfig.ts:417-419`:

> "The real gate is requireAuth({ adminOnly: true }) on ALL ELEVEN social-*.js
> functions (2026-07-30...)"

Measured, **seven of the eleven are not**: `social-accounts`, `social-delete`,
`social-image`, `social-link`, `social-publish`, `social-queue`, `social-status`.
Only `social-boost`, `social-brandkit`, `social-generate` and `social-profile` carry
it. That sentence sits in the source of truth and is the reason this stays open: a
reader checking the posture is told it is already handled.

**Concrete exploit path.** A non-admin viewer on a Growth or higher client, using
their own valid dashboard JWT, POSTs to `/.netlify/functions/social-publish` with
`{ client_id: <their own>, base_text: "...", targets: [{ platform: "linkedin" }] }`:

1. `requireAuth(event)` passes. Not admin-gated.
2. `:93` ownership check passes. It is their own `client_id`.
3. `:99` gate is entered (non-admin, no `post_id`, targets present).
4. `enforceSocialLimits`: `planRank('growth')` = 3 >= `AI_SOCIAL_MIN_RANK` = 3.
   `linkedin` is in `INCLUDED_CHANNELS`. 1 platform <= `socialChannels` 1. Existing
   count 0 < `socialPostsPerChannel` 12.
5. `requireBoundProfile` passes if the client's Ayrshare profile key is set.
6. The post publishes to the customer's real LinkedIn and consumes Ayrshare quota.

**This is reachable today, not in principle.** Production shows the profile bound
for `client_id 24` (plan `growth`) and `client_id 1` (plan `growth_pro`), and
`user_profiles` holds 2 viewers on `growth` and 1 viewer on `growth_pro`. A
competitor holding a self-service account is on record in this project's memory,
which raises the cost of leaving a documented-as-closed hole open.

**Severity reasoning, honestly bounded.** This is an entitlement and cost exposure,
not a data-confidentiality breach: `:93` still confines the caller to their own
`client_id`, so no cross-tenant read or write is possible. That is why it is HIGH
and not a stop-everything exposure.

**Not caused by this change, and not worsened by it.** The 96-pair differential
shows the allow/deny outcome is byte-identical before and after. The builder's
decision to defer is **correct**: fixing it revokes a capability from live accounts
and needs Constantin's ruling.

**Fix (for whoever gets the ruling).** Either (a) add `{ adminOnly: true }` to
`social-publish.js:82` and the six other ungated `social-*.js` files, matching what
`planConfig.ts:417` already claims, or (b) if customer self-serve is intended,
remove `ai_social` from `ADMIN_ONLY_FEATURES` and set a real `FEATURE_MIN_PLAN`.
Whichever is chosen, `planConfig.ts:417-419` must be corrected in the same commit,
because it is currently false either way.

### F2. MEDIUM, PRE-EXISTING (created by the S1 ladder commits, not this one). Radar cannot be bought self-serve and cannot be auto-provisioned.

**What.** `radar` shipped into `PLAN_ORDER`, `PLAN_ENGINES`, `_cost.js` and
`_plans.js` on 2026-07-31, but not into the two lists that decide what can be sold.

**Where.** `netlify/functions/_package_checkout.js:63`
`const SELF_SERVE_PLANS = ['essentials', 'growth', 'growth_pro'];` and
`netlify/functions/_terms_gate.js:136`
`const SELF_SERVE_CHECKOUT_PLANS = ['essentials', 'growth', 'growth_pro'];`

**Concrete failure path.** `_terms_gate.js:185` refuses to issue a checkout link for
any plan outside its list, so `accept-terms.js` cannot hand a buyer a Radar link.
And if a Radar subscription reached Stripe by any other route,
`_package_checkout.js:109` fails the membership test and, by that file's own
description at `:54-57`, would "provision nothing, money taken, no entitlement, no
error raised anywhere."

**Why the omission is not covered by the existing comment.** `_terms_gate.js:44-47`
documents an exclusion, but only for `managed` and `enterprise`, "both sales-assisted
and have no self-serve link by design". Radar is the opposite: a EUR 29 launch tier
whose entire purpose per `sprint-ladder-ruling.md` is a cheap self-serve entry
point. Its absence is an omission, not the documented decision.
`tests/package_provisioning.test.js` passes because it asserts every listed plan is
in `PLAN_ORDER`, which is membership, not coverage, so it cannot catch this.

**This is the Growth PRO C1 defect repeating on a new tier**, one week later.

**Fix.** Add `'radar'` to both lists, in the safe order the `_package_checkout.js`
comment already prescribes (list entry first, Stripe price second), and extend
`tests/package_provisioning.test.js` with a coverage assertion: every plan in
`PLAN_ORDER` is either in `SELF_SERVE_PLANS` or on an explicit sales-assisted
exclusion list. Owner: `bg-backend`, needs `bg-strategy` to confirm Radar is
self-serve. Do not fold into this commit.

### F3. MEDIUM, INTRODUCED BY THIS CHANGE. The new module-load throw contradicts a ruling written into this repo the same day, on the same require chain.

**What.** `_plans.js:122-134` throws at module load if any `PLAN_ORDER` member is
unpriced in any `PLAN_LIMITS` table. `_plans.js` is required by seven functions
including `stripe-webhook.js:48`, so a future editor who adds a plan to `PLAN_ORDER`
without pricing it takes down Stripe webhook processing along with the SEO and
social gates.

**Where.** `netlify/functions/_plans.js:122-134`, against
`netlify/functions/_package_checkout.js:59-62`, which rules on exactly this:

> "Every entry MUST also be a member of `_plans.js`'s `PLAN_ORDER`. That is asserted
> by `tests/package_provisioning.test.js` **rather than at module load, because a
> throw here would take the whole webhook down and stop provisioning working
> subscriptions too**, the failure mode this file exists to prevent."

Two conventions now sit on one require chain, one of which argues against the other.

**What I refuted about my own finding.** My first draft called this HIGH on the
grounds that it newly exposes `stripe-webhook.js` to a module-load throw. That is
wrong. `_plans.js:19` requires `_cost.js`, and `_cost.js:629-638` has carried a
module-load throw since before this change, so `stripe-webhook.js` was already
transitively exposed. The blast radius is **not new**. What the change does is widen
the **trigger surface** on that same radius: previously only a
`MONTHLY_CAPPED_ENGINES` edit could break the chain, now a `PLAN_ORDER` /
`PLAN_LIMITS` mismatch can too, and that mismatch is precisely the mistake this
change exists to catch, so it is the likely one.

**One factual correction to the builder's rationale.** The comment at `_plans.js:118`
says the throw breaks things "loudly and at deploy time". Netlify does not execute a
function at build time, so a bad constant surfaces at the **first invocation** of
each function. For `stripe-webhook.js` that first invocation is a customer paying.

**Severity bounded.** It cannot fire on the current constants: all five tables are
complete for all eight plans, proven by the test and by the module-load smoke test
where six of seven functions load and the seventh fails on a missing npm package.
This is a trap for the next editor, not a live defect.

**Fix, for a one-line ruling rather than a rebuild. Two options:**
(a) Keep the throw and record the ruling, amending `_package_checkout.js:59-62` so
the repo does not hold two contradictory conventions. Cheapest, and defensible given
`_cost.js` set the precedent.
(b) Move the guarantee into `planLimit()` so a missing value throws only for the
caller that reads it, leaving `stripe-webhook.js` and `set-client-plan.js` unaffected,
and demote the load-time loop to `console.error`. Keeps the test as the hard gate.
My recommendation is (b), because it puts the failure where the entitlement decision
is made and keeps billing off the blast radius. Either is acceptable. **Not a
blocker.**

### F4. MEDIUM, PRE-EXISTING. Two of the four AI SEO endpoints have no plan gate at all.

**What.** The AI SEO surface is four endpoints. This change hardened the two that had
a gate. The other two never had one.

**Where.** `netlify/functions/seo-audit-page.js` and
`netlify/functions/seo-opportunities.js`. `grep -n "plan"` over both returns nothing.
Both call `requireAuth(event)` (`seo-audit-page.js:73`, `seo-opportunities.js:25`)
and enforce client ownership (`:82-83`, `:36`), then do the work for any plan.

**Concrete path.** `seo-audit-page.js:59` posts to the Anthropic API with
`ANTHROPIC_API_KEY`. A viewer on any plan, including `free` or `radar`, can POST
`{ client_id, page_id }` directly and spend Claude tokens auditing a page, with no
plan check anywhere in the file. `seo-opportunities.js` similarly upserts
`seo_briefs` rows for any plan (no LLM spend in that file).

**Bounded, and this change makes it strictly less reachable.** Both operate on rows
that only exist after a crawl. Production shows the single `essentials` client has
`seo_pages = 0`, so there is nothing to audit today, and the crawl that would create
rows is now correctly denied. The residual exposure is a client who accumulated pages
under the old `essentials: 1` behaviour, and there is none.

**Fix.** Add the same `planLimit('seoPages', plan) <= 0` refusal to both files, so
the entitlement lives at every door rather than one. Owner: `bg-backend`, separate
packet.

### F5. LOW, PRE-EXISTING, LATENT. `seo-crawl-background.js` fails open, and its own default contradicts the entitlement table.

**Where.** `netlify/functions/seo-crawl-background.js:17-20`:

```js
const configured = process.env.INTERNAL_AUDIT_KEY;
if (!configured) {
  console.warn('[SeoCrawlBg] INTERNAL_AUDIT_KEY not set — accepting unauthenticated trigger. ...');
  return true;
}
```

**Path.** If `INTERNAL_AUDIT_KEY` is ever unset in Netlify, an anonymous POST to
`/.netlify/functions/seo-crawl-background` with `{ client_id, crawl_id, domain,
max_pages }` runs a crawl and writes `seo_pages` rows with the service key,
bypassing the entire `seo-crawl.js` gate this change just fixed. Compounding it,
`:38` reads `Math.max(1, Math.min(Number(max_pages) || 25, 300))`, so a `max_pages`
of 0 becomes **25**: a second fallback that grants an allowance, the same defect
class as the `?? 1` this change removed.

**Same class as the open R1 finding on `collection-worker-background.js:35-43`.**
`CLAUDE.md` records Constantin confirming `INTERNAL_AUDIT_KEY` IS set (2026-07-28),
so this is latent, not live. Not a blocker.

**Fix.** Fail closed on an unset key (return 401 rather than `true`), and change the
`|| 25` default to a refusal.

### F6. LOW, INTRODUCED BY THIS CHANGE. `seoAuditsPerWeek` is mirrored but nothing reads it.

**Where.** `_plans.js:105`. Confirmed unconsumed: no `planLimit('seoAuditsPerWeek'`
call exists anywhere, and `seo-crawl.js:23` still enforces a flat
`CRAWL_COOLDOWN_DAYS = 7` for every plan, which under-serves `managed` and `pro`
(3 per week) and `enterprise` (7). `src/pages/SEO.tsx:16-21` already documents that
constant as "aspirational until seo-crawl.js is updated to key off it", matching
`docs/qa/prompts-seo-audit-2026-07-29.md` B3.

**Judgement asked for: is an unconsumed table a liability?** Mildly, and in one
specific way the builder did not name. Mirroring the numbers is harmless and buys
drift protection for free. But the new load-time assertion now **throws on behalf of
a value nothing reads**: adding a plan and forgetting `seoAuditsPerWeek` alone would
take down all seven functions over a constant with no consumer. That is the F3 trap
with the weakest possible justification.

**Fix.** Either consume it (key `seo-crawl.js`'s cooldown off
`planLimit('seoAuditsPerWeek', plan)`, which also closes the `managed`/`enterprise`
under-service) or drop the row. Keeping it and asserting on it is the one option that
carries the cost with no benefit. Recommend consuming it, in a separate packet.

### F7. LOW, PRE-EXISTING, UNCHANGED. The retry path skips the fair-use gate entirely.

**Where.** `social-publish.js:99`:
`if (profile.role !== 'admin' && !post_id && Array.isArray(body.targets) ...)`.

A POST carrying `post_id` never calls `enforceSocialLimits`, so the monthly
per-channel cap is not re-counted on a retry, and a target set an admin composed for
a client on channels beyond that client's plan can be re-sent by the client's own
viewer (ownership is still enforced at `:93` and `:128`).

**Answering the builder's specific question:** `planRank()` is a safe drop-in at
every `PLAN_RANK` call site, including `channelAllowedForPlan` (verified by the
96-pair differential, which exercises that function directly for all 12 plan values
and 8 channels). The retry path is unaffected because **it calls neither `planRank`
nor `planLimit`**, which is the finding rather than a reassurance. Unchanged by this
diff, so not a blocker.

### F8. INFORMATIONAL, PROCESS. No handoff packet exists for this change.

`.claude/handoffs/` holds `001` to `013` and none of them mentions this work. Under
AGENT-OS section 4 the packet is the only state that crosses a session boundary, and
this review had to reconstruct the acceptance criteria from a chat message. That is
the same gap that produced the false "B1 was skipped" claim recorded in `CLAUDE.md`.
Write the packet retrospectively before the commit, or accept that a cold session
cannot reconstruct why these five files changed together.

---

## 8. Accessibility findings

**No new interactive element and no new text-on-surface pair exists in this change.**
The diff is five server-side CommonJS files plus one test. It introduces no
component, no route, no colour token, no focusable control and no heading. The
`grep` of frontend consumers in section 4 shows `src/` is untouched.

What that means for each required lens, stated rather than skipped:

| Lens | Result |
|---|---|
| Contrast ratios for new text-on-surface pairs | **N/A, none exist.** The one new user-visible string (`seo-crawl.js:55`) is rendered by an existing, previously audited error surface in `src/pages/SEO.tsx`, in the same element as the string it replaces. |
| Keyboard reachability of new interactive elements | **N/A, none added.** |
| Focus visibility | **N/A, no new focusable element.** |
| Heading order | **N/A, no heading added or moved.** |
| Hit targets | **N/A, no new control.** |
| Copy legibility of the changed string | **Checked.** "AI SEO is not included on this plan. Upgrade to Growth or higher to audit your pages." Two short sentences, plain language, names the exact plan, no jargon, no em or en dash, no banned vocabulary. It replaces a string of identical length class in the same slot, so no reflow or truncation risk at any viewport. |

I did **not** open a browser for this review. There was nothing to render: no
front-end file changed, and confirming the string appears would only re-verify an
existing surface. Stated as not checked rather than claimed as passed.

---

## 9. What was NOT checked

Explicit, because a reviewer who lists nothing here did not review.

1. **`npx tsc --noEmit`.** Not runnable: `node_modules` absent from this worktree,
   `npx --no-install tsc` refuses. Mitigation: no `.ts` or `.tsx` file is in the
   diff and `tsconfig.json` has `"include": ["src"]`, so it would not have read a
   changed file. **No baseline established, and none claimed.**
2. **`npm run build`.** Same cause, same mitigation, same honesty.
3. **Live HTTP.** I did not `curl` the deployed functions as a `radar` or
   `essentials` tenant. The change is uncommitted and undeployed, so there is nothing
   to call. The DB half of that gap is closed in section 5; the HTTP half remains and
   should be run after deploy (command in section 10).
4. **The two `typescript`-dependent tests were not made to pass**, only proven to
   fail for an environmental reason. I did not install `node_modules` to confirm they
   pass with it, and I did not check them out at `HEAD` to compare, because
   `git checkout` is forbidden against uncommitted work.
5. **Ayrshare-side behaviour for F1.** I proved the code path admits a Growth viewer
   and that two clients have a bound `profile_key`, from the database. I did **not**
   send a test post, so I have not observed a publish succeed end to end. F1's exploit
   path is traced through code and data, not executed.
6. **RLS policies.** Not re-audited. The three handlers use the service-key client,
   which bypasses RLS, and this change alters no query, table or filter.
7. **`_cost.js` engine, budget and cooldown mirrors.** Read only far enough to
   confirm they are a separate concern and out of scope. Their own drift is not
   assessed here.
8. **Whether Radar SHOULD be self-serve (F2).** That is a `bg-strategy` question and
   I did not answer it. I recorded only that the code cannot sell the tier today.
9. **The 27 legacy `pro` clients.** I confirmed their limits are unchanged by this
   diff. I did not assess whether `pro` mapping to `managed` numbers is still correct.
10. **Browser verification at any viewport.** See section 8.

---

## 10. Recommended sequence

This change is safe to commit as-is. Nothing below is a precondition.

1. **Commit it.** Suggested message:
   ```
   fix(api): one plan-limit mirror, and it fails closed

   seo-crawl.js, seo-draft.js and social-publish.js each carried a
   hand-written copy of the plan ladder and all three had drifted.
   seo-crawl.js read its cap with `?? 1`, so radar, which the ruling
   grants zero SEO, was handed a 1-page crawl by the fallback. The
   maxPages <= 0 test IS the entitlement gate in that file, so the
   fallback was the whole decision.

   PLAN_LIMITS in _plans.js is now the single server-side mirror of
   planConfig.ts's five limit tables, read through planLimit(), which
   returns 0 for any plan it does not recognise. tests/plan_limits_drift.test.js
   pins the mirror to planConfig.ts, 18 checks.

   Reviewed in docs/qa/plan-limits-drift-fix.md, PASS WITH FINDINGS.

   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
   ```
2. **After deploy, close the HTTP half of section 9 item 3.** As an admin, set a
   test client to `radar`, then from that client's viewer session POST to
   `/.netlify/functions/seo-crawl` and confirm the response is
   `{"error":"AI SEO is not included on this plan. Upgrade to Growth or higher to audit your pages."}`.
3. **Take the F1 ruling.** Checkpoint below.
4. **File F2, F4, F5, F6 as separate `bg-backend` packets.** None blocks this commit.
5. **Rule on F3** with a one-line answer, and amend whichever comment loses.

---

## HUMAN CHECKPOINT

```
=== HUMAN CHECKPOINT ===
NEED:      Is AI Social sold to Growth+ customers, or admin-only? The code and the
           product currently answer differently, and planConfig.ts documents a third
           answer that is false.
WHY:       ADMIN_ONLY_FEATURES makes AI Social coming-soon with no purchase path for
           every customer, while social-publish.js admits any non-admin viewer on
           Growth or above. Two live clients have a bound Ayrshare profile and three
           non-admin viewers sit on Growth+. Either fix revokes or grants a
           capability on live accounts, so it is your call, not mine.
OPTIONS:   A) Admin-only, as the UI says -> add { adminOnly: true } to
              social-publish.js:82 and the six other ungated social-*.js files.
              Revokes a path 3 live viewers can reach today. Makes
              planConfig.ts:417-419 true for the first time.
           B) Sold to Growth+ -> remove 'ai_social' from ADMIN_ONLY_FEATURES and set
              a real FEATURE_MIN_PLAN.ai_social. Ships an unfinished feature to
              paying customers, and needs a Stripe/pricing decision first.
           C) Leave it -> the UI keeps saying "nothing to buy today" while the API
              publishes for anyone who POSTs directly. A competitor holds a
              self-service account on this product.
DEFAULT:   Nothing changes. C is what ships if you say nothing. The plan-limit
           commit under review is unaffected either way.
TO RUN:    Nothing to run yet. On a ruling, this becomes a bg-backend packet against
           C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard\netlify\functions\social-publish.js
           and six siblings. Whichever you choose, planConfig.ts:417-419 must be
           corrected in the same commit, because it is false under both A and B.
TO VERIFY: After A, an authenticated non-admin POST to
           /.netlify/functions/social-publish must return 403, where it returns 200
           today.
=== END CHECKPOINT ===
```

---

*Reviewed by `bg-verify` (Opus 5), 2026-07-31. Report scope: `docs/qa/` write only.
No file under review was edited. No mutating git command was run. Supabase access
was read-only `SELECT`.*
