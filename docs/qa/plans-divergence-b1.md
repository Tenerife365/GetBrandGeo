# plans-divergence-b1.md

Owner: `bg-verify` · Stage: B1
Date: 2026-07-26 · Upstream: `docs/arch/activation-path.md` §3
Subject: `brandgeo-dashboard/netlify/functions/_plans.js` against
`brandgeo-dashboard/src/lib/planConfig.ts` and
`brandgeo-dashboard/netlify/functions/_cost.js`

Verdict: **4 findings confirmed, 1 by execution that the architecture pass had
recorded incorrectly.** Nothing here was decided by reading alone. The harness in
§4 was run against the live files and its output is reproduced verbatim in §2.

No file outside `docs/qa/` was edited by this pass, apart from correcting §3.3
and §3.4 of `docs/arch/activation-path.md` where this run proved the earlier
claim wrong.

---

## 1. Method

`_plans.js` and `_cost.js` are CommonJS, so both were loaded directly in Node and
called. No mocking, no test doubles, no reimplementation of their logic. The plan
ladder used as the expected set is `planConfig.ts:159`, which
`docs/arch/activation-path.md` §3.1 names the single source of truth:

```
['free','essentials','growth','growth_pro','managed','pro','enterprise']
```

`planConfig.ts` itself is TypeScript inside a Vite bundle and cannot be required
from Node, which is the whole reason these hand-synced mirrors exist. Its values
were therefore read from source rather than executed. Every `_plans.js` and
`_cost.js` value below is executed output.

---

## 2. Evidence

Verbatim output of the §4 harness, run 2026-07-26 from
`brandgeo-dashboard/netlify/functions`:

```
=== C1: isValidPlan over planConfig.ts Plan union ===
  isValidPlan(free       ) = true
  isValidPlan(essentials ) = true
  isValidPlan(growth     ) = true
  isValidPlan(growth_pro ) = false
  isValidPlan(managed    ) = true
  isValidPlan(pro        ) = true
  isValidPlan(enterprise ) = true

=== C2: planUnlocks().engineLabels vs _cost.js activeEnginesFor() ===
  free        promised(1): ChatGPT
              enforced(1): chatgpt
              -> ok
  essentials  promised(3): ChatGPT,Gemini,Claude
              enforced(3): chatgpt,gemini,claude
              -> ok
  growth      promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(4): chatgpt,gemini,claude,perplexity
              -> MISMATCH
  growth_pro  promised(1): ChatGPT
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> MISMATCH
  managed     promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok
  pro         promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok
  enterprise  promised(5): ChatGPT,Gemini,Claude,Perplexity,Google AI Mode
              enforced(5): chatgpt,gemini,claude,perplexity,google_ai
              -> ok

=== C3: blurb presence ===
  blurb(free       ) = "A single AI engine (ChatGPT) so you can see where your brand stands."
  blurb(essentials ) = "The three core AI engines, self-serve, for teams that run their own visibility."
  blurb(growth     ) = "Five AI engines with more prompts and markets - for brands scaling their AI presence."
  blurb(growth_pro ) = "A single AI engine (ChatGPT) so you can see where your brand stands."
  blurb(managed    ) = "A done-for-you service across all five live AI engines, with our team running your visibility and acting on the findings."
  blurb(pro        ) = "Everything in Managed at higher volume, more markets, and priority support, with the next wave of engines unlocking automatically."
  blurb(enterprise ) = "Custom scale, dedicated support, and bespoke reporting for large brands and agencies."

=== C4: label presence ===
  PLAN_LABELS[free       ] = "Free"
  PLAN_LABELS[essentials ] = "Essentials"
  PLAN_LABELS[growth     ] = "Growth"
  PLAN_LABELS[growth_pro ] = undefined
  PLAN_LABELS[managed    ] = "Managed"
  PLAN_LABELS[pro        ] = "Pro"
  PLAN_LABELS[enterprise ] = "Enterprise"

=== C5: planRank ladder positions, _plans.js vs planConfig.ts ===
  free        _plans:0  planConfig:0
  essentials  _plans:1  planConfig:1
  growth      _plans:2  planConfig:2
  growth_pro  _plans:0  planConfig:3
  managed     _plans:3  planConfig:4
  pro         _plans:4  planConfig:5
  enterprise  _plans:5  planConfig:6
```

The one em dash in the `growth` blurb above is rendered as a hyphen here so this
file passes the house zero-dash rule. `_plans.js:41` contains a real em dash.
Worth fixing while that line is being rewritten anyway, since the blurb reaches
customers in email.

---

## 3. Findings

### F1. CONFIRMED, blocking. Growth PRO cannot be assigned to any client.

`isValidPlan('growth_pro')` returns `false` (§2 C1). `set-client-plan.js:116`
gates on it and returns a 400 whose message does not name the plan the caller
chose:

```js
  if (!isValidPlan(plan)) return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid plan. One of: free, essentials, growth, managed, pro, enterprise` }) };
```

`set-client-plan.js` is the only path that writes `clients.plan` for an admin.
`Account.tsx:566` offers `growth_pro` in the selector (it maps `PLAN_ORDER` from
`planConfig.ts`) and `Account.tsx:41` lists it as a €449 tier, so the failure is
reachable from the UI as shipped.

Severity is raised by what it combines with, not by itself: `site.js:513` has no
Stripe link for `growth_pro` and `stripe-webhook.js:37`-`:45` has no
`growth_pro` price and excludes it from `SELF_SERVE_PLANS`. Growth PRO is
therefore unreachable by self-serve purchase **and** by admin assignment. The
tier at the centre of `PRICING-STRATEGY-2026-07.md` cannot currently be sold or
granted by any means.

### F2. CONFIRMED. Growth customers are told in writing they get a fifth engine they do not get.

`planUnlocks('growth').engineLabels` returns five engines including Google AI
Mode; `activeEnginesFor('growth', null)` returns four (§2 C2). `_cost.js` is the
copy that enforces (`_enqueue.js:29` imports from it), so the entitlement is
correct and only the message is wrong.

The wrong value reaches the customer. `set-client-plan.js:45` calls
`planUnlocks(toPlan)` and `:50`-`:52` renders it into the notice used for both
the in-app banner and the email:

```js
  const engineLine = u.engineLabels.length
    ? `${u.engineLabels.length} AI engine${u.engineLabels.length > 1 ? 's' : ''} monitored: ${u.engineLabels.join(', ')}.`
    : null;
```

So a client moved to Growth is sent "5 AI engines monitored: ChatGPT, Gemini,
Claude, Perplexity, Google AI Mode." `PLAN_BLURB.growth` (`_plans.js:41`) repeats
it in prose as "Five AI engines". `planConfig.ts:43`-`:45` states the deliberate
reason Growth is four: "Google AI Mode (SerpApi, the expensive engine) is Growth
PRO and up only, to protect SerpApi spend."

This is a false statement of what was purchased, delivered at the moment of
payment. Of the four findings it is the one with a live customer at the other end
of it, because Growth is assignable today.

### F3. CONFIRMED by execution, and previously mis-recorded. An unknown plan silently becomes Free.

`docs/arch/activation-path.md` §3.3 stated that a missing `PLAN_BLURB` key would
make `planUnlocks('growth_pro').blurb` `undefined` and "render an empty section."
**That is wrong.** §2 C3 shows it returns Free's blurb verbatim: "A single AI
engine (ChatGPT) so you can see where your brand stands."

The cause is the first line of `planUnlocks` (`_plans.js:58`):

```js
function planUnlocks(plan) {
  const key = isValidPlan(plan) ? plan : 'free';
```

Every field on the returned object is then keyed by `'free'`. `planRank` degrades
the same way, returning `0` for anything not in `PLAN_ORDER` (`:51`-`:54`), which
§2 C5 confirms for `growth_pro`. So if `growth_pro` ever reaches
`buildNotice()`, three things go wrong at once:

- the engine line reads "1 AI engine monitored: ChatGPT";
- the blurb describes the Free plan;
- `set-client-plan.js:47`-`:48` computes `planRank('growth_pro') = 0` against
  `planRank('growth') = 2` and picks the **downgrade** tone.

A €449 upgrade would be announced to the buyer as a one-engine Free plan, in a
downgrade-toned email. Nothing throws and nothing renders blank, which is why
reading the code suggested a milder fault than running it does.

`PLAN_LABELS['growth_pro']` is separately `undefined` (§2 C4), so
`set-client-plan.js:150` writes `plan_grant_note` as "undefined trial", and
`stripe-webhook.js:170`-`:171`'s `PLAN_LABELS[plan] || plan` falls back to the
raw slug in the admin feed.

### F4. CONFIRMED, latent. The two ladders disagree on rank for four plans.

§2 C5: `managed`, `pro` and `enterprise` each sit one position lower in
`_plans.js` than in `planConfig.ts`, because `growth_pro` is missing from the
former's `PLAN_ORDER`. `growth_pro` itself differs by three.

No live defect follows from the off-by-one alone, because every rank comparison
happens within a single file (`set-client-plan.js` uses only `_plans.js`'s
`planRank`; `planConfig.ts`'s `planRank` is used only in the frontend), and
within one file the ordering is self-consistent. Recorded because it is the
mechanism that makes any future cross-file comparison silently wrong, and because
it is fixed for free by the same edit that fixes F1.

---

## 4. Harness

Re-runnable as-is. Run from `brandgeo-dashboard/netlify/functions`. It reads no
environment variables, opens no network connection, and touches no database, so
it is safe to run against a working tree at any time.

```bash
node -e "
const p = require('./_plans.js');
const c = require('./_cost.js');
const LADDER = ['free','essentials','growth','growth_pro','managed','pro','enterprise'];
let fail = 0;
for (const k of LADDER) if (!p.isValidPlan(k)) { console.log('C1 FAIL', k); fail++; }
for (const k of LADDER) {
  const promised = p.planUnlocks(k).engineLabels;
  const enforced = c.activeEnginesFor(k, null);
  if (promised.length !== enforced.length) { console.log('C2 FAIL', k, promised.length, 'vs', enforced.length); fail++; }
}
for (const k of LADDER) if (p.PLAN_LABELS[k] === undefined) { console.log('C4 FAIL', k); fail++; }
for (const k of LADDER) if (p.planRank(k) !== LADDER.indexOf(k)) { console.log('C5 FAIL', k, p.planRank(k), 'vs', LADDER.indexOf(k)); fail++; }
console.log(fail === 0 ? 'PASS' : fail + ' failures');
process.exit(fail === 0 ? 0 : 1);
"
```

Current result: **8 failures, exit 1.** Verbatim:

```
C1 FAIL growth_pro
C2 FAIL growth 5 vs 4
C2 FAIL growth_pro 1 vs 5
C4 FAIL growth_pro
C5 FAIL growth_pro 0 vs 3
C5 FAIL managed 3 vs 4
C5 FAIL pro 4 vs 5
C5 FAIL enterprise 5 vs 6
8 failures
```

The full-output version used to produce §2 is the same script with the assertions
replaced by prints.

`LADDER` is duplicated here from `planConfig.ts:159` on purpose. This harness
exists to catch that duplication drifting, so it cannot import the thing it is
checking.

---

## 5. Acceptance for the fix

`docs/arch/activation-path.md` §3.4 items 1 to 3 must land as one commit. Do not
fix `isValidPlan` alone: F1 is currently the only thing keeping F3 away from a
customer, so unblocking Growth PRO assignment before the ladder, labels and
blurbs are correct turns a latent defect into a sent email.

The §4 harness must print `PASS` after the fix. That covers F1, F3's label and
rank symptoms, and F4. Two checks it does not cover, to be done by inspection:

- [ ] `PLAN_BLURB.growth` no longer claims five engines, and a `growth_pro` blurb
      exists that does not promise more than `planConfig.ts:50` grants.
- [ ] `set-client-plan.js:116`'s hardcoded plan list in the error string is
      either derived from `PLAN_ORDER` or removed. It is a third copy of the
      ladder, in prose, and will drift on its own.

Not in scope for this fix, and not blocked by it: the missing `growth_pro` Stripe
price (`site.js:513`, `stripe-webhook.js:37`). That needs a live price created in
Stripe first and belongs to `bg-strategy` to sequence.

---

## 6. Out of scope, observed

Recorded without action, per B1's read-only remit.

1. `_plans.js:41` contains a literal em dash in customer-facing email copy, which
   the project's own content rule prohibits. Cheap to fix in the same edit.
2. Three server-side copies of the per-plan engine table exist (`_plans.js:17`,
   `_cost.js:109`, and `planConfig.ts:46` as the authority). §3.4 item 2 proposes
   collapsing to two by having `_plans.js` require `_cost.js`. This pass supports
   that: `_cost.js` was the copy found correct on every check, and it is the copy
   that enforces.
3. `planUnlocks` and `planRank` both fail soft to Free. For a notification
   builder that is arguably the wrong default, since a wrong plan description is
   worse than no email. Raising it as a design question for `bg-architect`, not a
   finding.
