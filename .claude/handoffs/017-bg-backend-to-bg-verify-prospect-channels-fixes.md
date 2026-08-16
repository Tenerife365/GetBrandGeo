---
id: 017
from: bg-backend
to: bg-verify
status: READY
created: 2026-08-15
scope_write: docs/qa/
scope_read: db/supabase-prospect-touches-restrict-2026-08-15.sql, db/supabase-prospect-channels-migration.sql, brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/tests/prospects_admin_whitelist.test.js, docs/qa/prospect-channels-review-2026-08-15.md
model: opus
---

## Decision

Fix `docs/qa/prospect-channels-review-2026-08-15.md` findings S1 (blocking),
S2, S3, S5, S6 in this round, per Constantin's condition that S1 must close
before any real touch is logged. Also close a shape inconsistency `bg-app`
found while building against packet 016's contract (`update`/`touch`
returned a prospect with no `touches` key while `list` nested it). S4 and S7
are explicitly out of scope for this round (S4 is a data-model question with
a later deadline; S7 is pre-existing and recorded).

## Do

1. Confirm S1: `validateTouch()` rejects non-string `occurred_at` outright
   (`0`, `1`, `true`, `false`, arrays, objects) and clamps a valid ISO string
   to `[TOUCH_MIN_OCCURRED_AT (2026-01-01), now + TOUCH_MAX_FUTURE_MS (24h)]`.
   Reproduce the exact six values from the original review
   (`0`, `1`, `true`, `false`, `"3026-01-01"`, a year-0001 date) and confirm
   all six are now rejected. `node tests/prospects_admin_whitelist.test.js`
   section "bg-verify S1" covers this; 41/41 assertions pass.
2. Confirm S2: the header comment (`prospects-admin.js:91-103`) no longer
   claims the two writes are atomic or "can never disagree" -- it now states
   plainly that they are two separate PostgREST calls. Confirm the handler's
   `touch` branch returns a structured `touch_id` field (not only
   interpolated into the message string) on a partial failure, and that a
   retry carrying `retry_of: <touch_id>` skips the insert and re-uses the
   existing touch row (`prospects-admin.js` touch branch, ~line 428 onward)
   rather than performing an rpc/transaction. State whether this design
   (structured error + idempotent retry_of) is judged sufficient in place of
   a true `rpc()` transaction, per the packet's own "either is acceptable"
   framing.
3. Confirm S3: `public.prospect_touches.prospect_id`'s FK is now
   `ON DELETE RESTRICT` in production (query below), and that
   `db/supabase-prospect-channels-migration.sql`'s own `CREATE TABLE` DDL was
   updated to match so a fresh apply on a clean database does not
   reintroduce CASCADE. New file
   `db/supabase-prospect-touches-restrict-2026-08-15.sql` documents the
   amendment and was applied via the Supabase MCP, not by hand.
4. Confirm S5: `prospect_id` (and the new optional `retry_of`) use a new
   `parseId()` (module scope, exported) that rejects `true`, `[1]`, `"1e0"`
   and `" 1 "` -- reproduce the reviewer's exact four values against
   `validateTouch()`. Test section "bg-verify S5".
5. Confirm S6: `fail500()` is now a module-scope, exported function that
   never places `error.message` in the response body -- it returns a fixed
   string plus a `code` field, and logs the real error server side. Confirm
   every one of the five original 5xx call sites the review cited
   (`:244, :261, :291, :317, :335` in the pre-fix file) now routes through
   `fail500()`. Test section "bg-verify S6".
6. Confirm the uniform-response-shape fix: `update` and `touch` now both
   call `attachTouches()` before returning, so their `prospect` object
   carries `touches: Touch[]` identically to `list`. This is a genuine
   envelope extension beyond packet 016's original contract (additive only,
   no field renamed or removed) -- confirm `bg-app`'s already-shipped client
   side merge logic is unaffected by the addition (it should be, since it
   only added a key that previously did not exist).
7. Confirm no row was written by this round. Query:
   `select (select count(*) from public.prospects) as prospects,
   (select count(*) from public.prospect_touches) as touches,
   (select count(*) from public.prospects where last_contacted_at is not null) as contacted,
   (select count(*) from public.prospects where replied_at is not null) as replied;`
   -- expect `71, 0, 0, 0`.
8. Reproduce the before/after evidence: this session captured BEFORE output
   from a standalone reconstruction of the pre-fix `occurred_at`/
   `prospect_id`/error-response logic (not committed, run from `/tmp` and
   deleted afterward) showing all six S1 values accepted, all four S5 values
   coerced to `1`, and the raw driver string leaked for S6. AFTER output
   from the actual fixed module shows all rejected / rejected / not leaked.
   Full before/after console output is in this session's transcript; you may
   independently re-derive the BEFORE state from
   `docs/qa/prospect-channels-review-2026-08-15.md` section 4 (S1/S5/S6),
   which already documents the exact same measured pre-fix behavior.

## Do not

- Touch `prospect_leads` or `unlock-audit-report.js`.
- Widen any RLS policy.
- Fix S4 or S7 -- explicitly out of scope this round, per the coordinator.
- Fix the sibling type-looseness in `validateUpdate()`'s `id` field
  (`Number(body.id)`, same class of bug as S5 but not named in the review).
  Flagged here rather than silently fixed: the review's S5 finding cited
  only `validateTouch`'s `prospect_id` at the pre-fix line numbers
  `:176-177`. Recommend a follow-up finding if this is wanted closed too.

## Acceptance criteria

- [ ] S1: all six of the review's exact values (`0`, `1`, `true`, `false`, `"3026-01-01"`, year 0001) are rejected by `validateTouch()`.
- [ ] S1: a value at exactly `TOUCH_MIN_OCCURRED_AT` is accepted (no off-by-one).
- [ ] S2: header comment no longer claims atomicity; `touch_id` is a structured field on the partial-failure 500; `retry_of` prevents a duplicate touch row on retry.
- [ ] S3: `prospect_touches_prospect_id_fkey` is `ON DELETE RESTRICT` in production; migration file DDL matches.
- [ ] S5: `true`, `[1]`, `"1e0"`, `" 1 "` are all rejected as `prospect_id`.
- [ ] S6: no 5xx response body contains `error.message`'s raw text; all five original call sites route through `fail500()`.
- [ ] Uniform shape: `update` and `touch` responses carry `touches` identically to `list`.
- [ ] `prospects` = 71 rows, `prospect_touches` = 0 rows, `last_contacted_at`/`replied_at` both null on every row, `stage='contacted'` count = 0.
- [ ] No em or en dash in any changed file.
- [ ] `node tests/prospects_admin_whitelist.test.js` exits 0 (41 assertions at time of writing).

## Open questions for Constantin

None. Status is READY, not NEEDS_HUMAN. If bg-verify judges the S2 fix
(structured error + idempotent retry_of) insufficient versus a true `rpc()`
transaction, that is a finding for the next round, not a blocker recorded
here.
