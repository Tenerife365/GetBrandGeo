---
id: 005
from: bg-orchestrator
to: bg-backend
status: READY
created: 2026-07-26
scope_write: brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/netlify/functions/set-client-plan.js
scope_read: docs/qa/plans-divergence-b1.md, docs/arch/activation-path.md, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/netlify/functions/_cost.js, brandgeo-dashboard/netlify/functions/stripe-webhook.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/netlify/functions/_auth.js
model: opus
---

## Decision

B1 has run. `docs/qa/plans-divergence-b1.md` is the binding adjudication and its
§4 harness is the pass condition. Implement `docs/arch/activation-path.md` §3.4
items 1 to 3 as **one commit**. `planConfig.ts` is authoritative for the ladder
and `_cost.js` is authoritative for engines; `_plans.js` becomes a consumer of
both, never a third copy. Do not fix `isValidPlan` alone — B1 §5 is explicit that
doing so converts a latent defect into a sent email.

## Do

1. Regenerate `PLAN_ORDER`, `PLAN_LABELS` and `PLAN_BLURB` in `_plans.js` from
   `planConfig.ts:159` and `:161`-`:169`, with `growth_pro` at ladder position 3.
   The `growth_pro` blurb must not promise more engines than `planConfig.ts:50`
   grants.
2. Correct `PLAN_BLURB.growth` so it no longer claims a fifth engine
   (B1 F2). Growth gets four per `planConfig.ts:49` and `_cost.js:112`.
3. Delete `PLAN_ENGINES` from `_plans.js` and have `planUnlocks()` derive engines
   from `_cost.js`'s `PLAN_LIVE_ENGINES` via `require`. Both files are CommonJS.
   Do not re-sync a fourth hand-maintained copy.
4. Replace the hardcoded plan list in `set-client-plan.js:116`'s error string
   with one derived from `PLAN_ORDER`, or remove the enumeration.
5. Remove the literal em dash in `_plans.js:41` customer-facing email copy
   (B1 §6 item 1, in-scope because you are already editing the line's file and
   the project content rule prohibits it).
6. Run the `docs/qa/plans-divergence-b1.md` §4 harness against your edited files
   and paste its output verbatim into your completion note.

## Do not

- Do not touch `planConfig.ts`, `_cost.js`, `Account.tsx`, or anything under
  `brandgeo-dashboard/src/`. Those are `bg-app` scope and are not defective.
- Do not create a Stripe price, checkout link, or touch `stripe-webhook.js`.
  `growth_pro`'s missing price is a separate item with an external dependency and
  belongs to `bg-strategy` to sequence (`activation-path.md` §3.4 item 4).
- Do not change what any tier costs or includes. This packet corrects a mirror
  so it matches the authority; it decides no pricing.
- Do not run any git command. Hand Constantin the exact commit command.
- Do not edit `docs/qa/` or `docs/arch/`. If you believe B1 is wrong, write a
  BLOCKED packet; do not overrule it in place.

## Acceptance criteria

- [ ] The §4 harness in `docs/qa/plans-divergence-b1.md` prints `PASS`, with
      output pasted into the completion note.
- [ ] `isValidPlan(p)` returns `true` for every member of `planConfig.ts`'s
      `Plan` union, `growth_pro` included.
- [ ] `planUnlocks(p).engineLabels` equals `getActiveEngines(p, null)` for every
      `p` in `PLAN_ORDER`.
- [ ] `planRank` agrees between `_plans.js` and `planConfig.ts` for all plans
      (B1 F4).
- [ ] `PLAN_LABELS['growth_pro']` is defined, so `set-client-plan.js:150` no
      longer writes `plan_grant_note` as `"undefined trial"`.
- [ ] Grep proves `PLAN_ENGINES` no longer exists in `_plans.js` and no caller
      references it.
- [ ] No file outside `scope_write` was modified.

## Open questions for Constantin

None. Status is READY.
