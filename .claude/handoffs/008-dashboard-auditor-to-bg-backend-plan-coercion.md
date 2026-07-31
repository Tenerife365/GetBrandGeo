---
id: 008
from: dashboard-auditor
to: bg-backend
status: READY
created: 2026-07-26
scope_write: brandgeo-dashboard/netlify/functions/onboard-client.js
scope_read: brandgeo-dashboard/netlify/functions/_cost.js, brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/set-client-plan.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/src/pages/Onboard.tsx, docs/qa/dashboard-audit-2026-07-26.md, docs/arch/activation-path.md, docs/qa/plans-divergence-b1.md
model: opus
---

## Decision

`onboard-client.js` silently downgrades any client onboarded on Growth or Growth
PRO to Essentials. `VALID_PLANS` (line 44) is a fourth hardcoded copy of the plan
ladder missing both tiers, and line 67 coerces instead of rejecting. The wizard
offers those tiers (`Onboard.tsx:242` maps `PLAN_ORDER`), so the two disagree with
no error surfaced anywhere. Fix: derive the list from `_cost.js`, the enforcing
mirror, and reject unknown plans. This is billing, so Opus, and `bg-verify` runs
after.

## Do

1. Replace the hardcoded `VALID_PLANS` array at `onboard-client.js:44` with a list
   derived from `_cost.js`, matching the pattern `promotions-admin.js` and
   `_auth.js:28` already use. Do not hand-copy a fifth list.
2. Change line 67 from silent coercion to rejection. An unrecognised `plan` must
   return `400` with an error naming the rejected value and the accepted set. The
   admin filling the form has to see it fail. Keep the existing `VALID_ROLES`
   coercion on line 68 as it is — role defaulting to `viewer` is fail-safe;
   plan defaulting to Essentials is fail-open against revenue.
3. Write a `client_events` row on successful provisioning, recording the plan the
   client was created with. Follow the shape already used at
   `set-client-plan.js:166` and `expire-plan-grants.js:47`. Reason: today
   provisioning leaves no audit trail, so a coerced row is indistinguishable from
   a genuine Essentials client and this defect cannot be detected in the database
   after the fact.
4. Re-read the rollback chain in this function and confirm the new `client_events`
   insert cannot leave a half-created client if it fails. Logging must never be
   the thing that breaks provisioning.

## Do not

- Do not touch `_plans.js`. Its drift (C1 to C4) is packet `005`'s subject and is
  still open; two packets editing that file will collide.
- Do not touch `set-client-plan.js`, `planConfig.ts`, `_cost.js`, or any frontend
  file. `Onboard.tsx` is already correct — it offers the real ladder.
- Do not add a Stripe price, checkout link, or any billing wiring for Growth PRO.
  That is an external dependency sequenced by `bg-strategy` per
  `activation-path.md` §5.5.
- Do not invent a migration or backfill for existing rows. Which clients were
  affected cannot be determined from the database (see Open questions).

## Acceptance criteria

- [ ] `grep -n "VALID_PLANS" onboard-client.js` shows a list derived from
      `_cost.js`, not a literal array.
- [ ] Posting `plan: "growth_pro"` provisions a client whose `clients.plan` reads
      `growth_pro`. Posting `plan: "growth"` yields `growth`.
- [ ] Posting an unrecognised plan returns `400` and creates no client row, no
      auth user, and no `user_profiles` row.
- [ ] A successful onboard writes exactly one `client_events` row naming the plan.
- [ ] A forced failure of the `client_events` insert still yields a fully created,
      usable client — logging failure does not roll back provisioning.
- [ ] No file outside `scope_write` is modified.

## Open questions for Constantin

**CHECKPOINT — needed before this fix is considered complete, not before it starts.**

Existing mis-provisioned clients cannot be found in Supabase. A coerced row reads
`essentials` and is byte-identical to a real Essentials customer, and
`onboard-client.js` writes no audit trail today (that is what item 3 fixes, going
forward only).

Detection requires cross-referencing Stripe subscriptions against `clients.plan`:
any customer on a Growth (€299) or Growth PRO (€449) subscription whose row reads
`essentials` was under-provisioned and was served fewer engines than they paid
for. Constantin reported running this comparison on 2026-07-26; the result was not
recorded here. Record the outcome in this packet before closing it, and if any
client was affected, that remediation is a separate packet — it involves a refund
or credit decision, which is not `bg-backend`'s call.
