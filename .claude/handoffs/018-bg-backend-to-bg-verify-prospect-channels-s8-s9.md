---
id: 018
from: bg-backend
to: bg-verify
status: READY
created: 2026-08-15
scope_write: docs/qa/
scope_read: brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/tests/prospects_admin_whitelist.test.js, docs/qa/prospect-channels-review-2026-08-15.md
model: opus
---

## Decision

Packet 017's re-review (section R6 in `docs/qa/prospect-channels-review-2026-08-15.md`)
returned PASS, safe to push, with two new findings: S8 (MEDIUM, an
unconditional stamp lets a touch move `last_contacted_at`/`replied_at`
backwards) and S9 (INFO, a comment describes a payload the validator
rejects). Constantin wanted S8 closed before push, since the window it opens
starts the moment real touches begin. This packet closes both, plus the
already-flagged `validateUpdate()` id looseness (free while in the file, per
the coordinator's explicit allowance, not an expansion of scope).

## Do

1. Confirm S8: the stamp UPDATE (`prospects-admin.js`, in the `touch`
   branch) is now conditional -- `buildAdvanceOnlyFilter(field, newIso)`
   produces `field.is.null,field.lt.newIso`, applied via `.or()` alongside
   `.eq('id', prospect_id)` in the SAME `.update()` call as the `SET`, so the
   compare-and-swap is one Postgres statement, not a separate read then
   write. Confirm the older touch is still inserted into `prospect_touches`
   unconditionally (only the derived field is clamped).
2. Confirm S8 at the database level, not only the filter string: this
   session ran two transactions, each `begin; ... rollback;`, against
   production, inserting a same-day touch then an older backfill touch for
   a real prospect id and applying both the OLD unconditional technique and
   the NEW conditional technique. Reproduce or accept the pasted evidence
   below. Both were rolled back; `prospect_touches` = 0 and
   `last_contacted_at`/`replied_at` are null on every row afterward,
   confirmed by direct query.
3. Confirm the rpc()-vs-endpoint decision is stated, not silently made: the
   inline comment at the stamp UPDATE and the header comment's new
   "THE STAMP IS FORWARD-ONLY" section both explain why an `rpc()` was
   judged not worth taking this round (a new SECURITY DEFINER function
   writing `prospects`/`prospect_touches`, if it inherited this project's
   existing default EXECUTE grants the way `is_admin()` and others do,
   would let any authenticated caller bypass admin-only RLS via the
   function owner's privileges -- an RLS-widening risk requiring the same
   rollback-probe verification bg-verify used for table containment, judged
   Opus-tier work not to rush into this round). Judge whether this reasoning
   holds or whether the rpc is owed sooner than "next round".
4. Confirm S9: the comment previously at `prospects-admin.js:466-467` no
   longer claims a retry may omit `channel`/`direction`/`occurred_at`. It
   now states plainly that `channel` and `direction` are required
   regardless of `retry_of` (validated before `retry_of` is parsed), and
   that `occurred_at` alone genuinely defaults. Confirm this against
   `validateTouch()`'s actual order of checks, not only against the comment.
5. Confirm `validateUpdate()`'s `id` now routes through `parseId()` (same
   fix as S5, applied here per the coordinator's explicit "route it through
   parseId() only if free" allowance) -- `true`, `[1]`, `"1e0"`, `" 1 "` are
   all rejected as `id` now, where they previously coerced to `1`.
6. Confirm no row was written by this round. Query:
   `select (select count(*) from public.prospects) as prospects,
   (select count(*) from public.prospect_touches) as touches,
   (select count(*) from public.prospects where last_contacted_at is not null) as contacted,
   (select count(*) from public.prospects where replied_at is not null) as replied;`
   -- expect `71, 0, 0, 0`.
7. `node tests/prospects_admin_whitelist.test.js` from `brandgeo-dashboard/`
   -- expect 49 assertions, exit 0 (up from 41).

## Do not

- Touch `prospect_leads` or `unlock-audit-report.js`.
- Widen any RLS policy.
- Fix S4 or S7 -- still out of scope, S4 is Constantin's data-model decision
  (now overdue per R5, not this packet's to close) and S7 is pre-existing.
- Build the `rpc()` this round -- deliberately deferred, reasoning stated in
  the code comments per item 3 above.

## Acceptance criteria

- [ ] S8: `buildAdvanceOnlyFilter()` produces the correct OR-filter for both `last_contacted_at` and `replied_at`.
- [ ] S8: database-level proof (via rollback probe or reproduced independently) that logging an older touch after a newer one does NOT rewind the stamp, while both touches remain in `prospect_touches`.
- [ ] S8: an unconditional-update reproduction (the pre-fix behavior) is shown, for comparison, to actually rewind the stamp under the same inputs.
- [ ] S9: the corrected comment matches `validateTouch()`'s actual validation order.
- [ ] `validateUpdate()`'s `id` rejects `true`, `[1]`, `"1e0"`, `" 1 "`.
- [ ] `prospects` = 71, `prospect_touches` = 0, both stamps null everywhere, after this round.
- [ ] No em or en dash in any changed file.
- [ ] `node tests/prospects_admin_whitelist.test.js` exits 0, 49 assertions.

## Open questions for Constantin

None. Status is READY, not NEEDS_HUMAN.
