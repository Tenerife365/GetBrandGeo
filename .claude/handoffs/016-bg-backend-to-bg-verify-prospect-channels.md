---
id: 016
from: bg-backend
to: bg-verify
status: READY
created: 2026-08-15
scope_write: docs/qa/
scope_read: db/supabase-prospect-channels-migration.sql, db/supabase-prospects-migration.sql, brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/tests/prospects_admin_whitelist.test.js
model: opus
---

## Decision

Extend `public.prospects` (RLS admin-only) with 6 new outreach-channel
columns and add `public.prospect_touches` (new table, RLS admin-only) so
`prospects-admin.js` can log a real outreach event per channel (email,
LinkedIn, X) and update `last_contacted_at`/`replied_at` from it atomically.
`bg-app` is building the UI against the same envelope in parallel; this
packet reviews the data half only.

## Do

1. Confirm `public.prospects` carries exactly these 6 new columns, with the
   types and defaults below, and that no other column changed:
   `contact_email text`, `contact_email_source text`,
   `contact_email_kind text` (CHECK `individual`/`role`/null),
   `x_url text`, `x_verified boolean not null default false`,
   `linkedin_verified boolean not null default false`.
2. Confirm `public.prospect_touches` exists with columns
   `id, prospect_id (FK -> prospects.id on delete cascade), channel, direction,
   occurred_at, subject, body, note, created_at`, CHECK constraints
   restricting `channel` to `email`/`linkedin`/`x` and `direction` to
   `out`/`in`, and indexes on `prospect_id` and `occurred_at`.
3. Confirm RLS is enabled on `prospect_touches` with exactly 4 policies
   (select/insert/update/delete), all scoped to `{authenticated}`, all
   `USING`/`WITH CHECK` calling `public.is_admin()`, no bare `qual = true` --
   the exact pattern `prospects` itself uses. Query:
   `select tablename, policyname, cmd, roles, qual, with_check from
   pg_policies where tablename = 'prospect_touches' order by cmd;`
4. Confirm `prospects-admin.js`'s new `action: 'touch'` is behind the same
   `requireAuth({ adminOnly: true })` gate as `list`/`update` -- reproduce the
   two auth-gate tests in `tests/prospects_admin_whitelist.test.js` (missing
   token -> 401, disallowed origin -> 403) and, if you have an admin JWT,
   prove the positive case: a valid admin token can log a touch and a valid
   non-admin (viewer) token is rejected 403 -- the existing test suite
   cannot prove either half of that, same caveat as `revenue_report.test.js`
   documents for `requireAuth`'s role check.
5. Confirm `WRITABLE_FIELDS` for `action: 'update'` is UNCHANGED (still
   exactly `stage, notes, owner, next_action_at, last_contacted_at,
   replied_at, reply_note`) and that all 6 new columns
   (`contact_email*`, `x_url`, `x_verified`, `linkedin_verified`) are
   rejected if sent in an `update` patch -- they are research/server-written
   only, never UI-writable. `node tests/prospects_admin_whitelist.test.js`
   from `brandgeo-dashboard/` reproduces this without a database.
6. Confirm `action: 'touch'` never writes `stage`, and that an `out`
   direction sets `last_contacted_at` while an `in` direction sets
   `replied_at`, in the same handler invocation as the `prospect_touches`
   insert -- read `prospects-admin.js`'s touch branch directly, the test
   suite proves this at the `validateTouch()` pure-function level
   (`direction` round-trips verbatim) but not against a live DB write.
7. Confirm no row in `public.prospects` (71 before this change) or any
   other table was mutated by the migration -- only schema changed. Query:
   `select count(*) from public.prospects;` should still read 71 (or higher
   only if `gtm-outbound` has since backfilled real data through a separate,
   already-authorized channel).

## Do not

- Touch `prospect_leads` or `unlock-audit-report.js`.
- Widen any RLS policy on `prospects` or `prospect_touches`.
- Treat a passing local test run as proof of the auth-gate's admin/non-admin
  branches -- those need a real JWT, per item 4.

## Acceptance criteria

- [ ] The 6 new `prospects` columns exist with the stated types/defaults/CHECK.
- [ ] `prospect_touches` exists with the stated shape, CHECK constraints, and indexes.
- [ ] `prospect_touches` RLS: enabled, exactly 4 policies, all admin-gated, no bare `true`.
- [ ] `touch` action requires `requireAuth({ adminOnly: true })`; 401/403 reproduced locally, admin/non-admin JWT case reported as confirmed or as a stated gap.
- [ ] `WRITABLE_FIELDS` for `update` is unchanged at 7 fields; all 6 new columns are rejected in an `update` patch.
- [ ] `touch` never sets `stage`; direction correctly maps to `last_contacted_at` (out) or `replied_at` (in).
- [ ] `prospects` row count unchanged by the migration itself (71, or higher only via a separately authorized data write).

## Open questions for Constantin

None. Status is READY, not NEEDS_HUMAN.
