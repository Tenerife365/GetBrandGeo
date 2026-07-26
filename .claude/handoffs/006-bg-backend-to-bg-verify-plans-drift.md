---
id: 006
from: bg-backend
to: bg-verify
status: READY
created: 2026-07-26
scope_write: docs/qa/
scope_read: brandgeo-dashboard/netlify/functions/_plans.js, brandgeo-dashboard/netlify/functions/set-client-plan.js, brandgeo-dashboard/src/lib/planConfig.ts, brandgeo-dashboard/netlify/functions/_cost.js, brandgeo-dashboard/netlify/functions/stripe-webhook.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/expire-plan-grants.js, docs/qa/plans-divergence-b1.md, docs/arch/activation-path.md
model: opus
---

## Decision

`bg-backend` implemented `activation-path.md` §3.4 items 1-3 against the B1
adjudication (`docs/qa/plans-divergence-b1.md`), per packet `005`. Both files
are edited on the working tree, **uncommitted** — no git command has been run.
`bg-backend`'s own self-run of the §4 harness printed `PASS`. Per
`bg-backend.md`'s OBJECTIVE #5, a handoff to `bg-verify` is mandatory here
because the change touches plan gating. This packet is that handoff. Nothing
should be committed until this review lands.

## Do

1. Run the `docs/qa/plans-divergence-b1.md` §4 harness yourself, independently,
   against the working tree. Do not trust `bg-backend`'s pasted output alone —
   reproduce it.
2. Re-check every acceptance criterion from packet `005` against the actual
   diff: `isValidPlan` coverage of the full `Plan` union, `planUnlocks(p)
   .engineLabels` equals `getActiveEngines(p, null)` for every `p` in
   `PLAN_ORDER`, `planRank` agreement with `planConfig.ts`, `PLAN_LABELS
   ['growth_pro']` defined, `PLAN_ENGINES` fully removed with no remaining
   caller, no file outside `scope_write` touched.
3. Trace the full request path for a `growth_pro` assignment: admin call →
   `set-client-plan.js` → `isValidPlan` → the Supabase write → every downstream
   read (`_auth.js`'s budget check, `promotions-admin.js`'s plan validation) —
   confirm nothing downstream still special-cases the old `PLAN_ORDER` /
   `PLAN_ENGINES` shape now that `_plans.js` derives from `_cost.js`.
4. Run the standard checks: `git diff --stat`, the secret scan, and the
   AI-tell scan (`rg "[—–]"`) on the two changed files.
5. Confirm the cost-note claim (no per-run or per-model-call delta) by
   confirming no `collect-*.js` file imports `_plans.js`.
6. Write the verdict report to `docs/qa/`.
7. If the verdict is `PASS` or `PASS WITH FINDINGS`, hand Constantin the exact
   `git add` / `git commit` command. `bg-backend` drafted one in its completion
   note — verify it still matches the final diff before repeating it; do not
   just copy it forward unchecked.

## Do not

- Do not edit `_plans.js`, `set-client-plan.js`, `planConfig.ts`, `_cost.js`,
  or anything under `brandgeo-dashboard/src/`.
- Do not run any git command yourself.
- Do not touch or amend `docs/arch/activation-path.md`. If you disagree with
  B1's adjudication, write a `BLOCKED` packet; do not overrule it in place.

## Acceptance criteria

- [ ] Verdict (`PASS` / `PASS WITH FINDINGS` / `BLOCK`) is the first line of
      the report.
- [ ] All 7 acceptance criteria from packet `005` independently re-verified
      with pasted evidence, not re-asserted from `bg-backend`'s note.
- [ ] Full request-path trace for `growth_pro` assignment is documented.
- [ ] Secret scan and AI-tell scan output pasted, counts only.
- [ ] Report written to `docs/qa/`, filename recorded in `CLAUDE.md`.

## Open questions for Constantin

None. Status is READY.
