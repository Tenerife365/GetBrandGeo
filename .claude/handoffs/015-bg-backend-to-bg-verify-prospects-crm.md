---
id: 015
from: bg-backend
to: bg-verify
status: READY
created: 2026-08-15
scope_write: docs/qa/
scope_read: db/supabase-prospects-migration.sql, db/supabase-prospects-backfill-2026-08-15.sql, brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/netlify.toml, brandgeo-dashboard/tests/prospects_admin_whitelist.test.js, brandgeo-dashboard/src/pages/Prospects.tsx, brandgeo-dashboard/src/types/index.ts
model: opus
---

## Decision

Built the data half of BrandGEO's own prospect CRM (`public.prospects`) while
`bg-app` built the UI in parallel against the same fixed contract. This touches
a new table's RLS and a new admin-only Netlify function, which makes this
`bg-verify` handoff mandatory (AGENT-OS: auth/RLS changes are never
self-certified). Migration is **applied** and the backfill is **run** against
production (duiyifepitvugyulobqm) -- both authorized exceptions per the
packet, not something `bg-verify` needs to run itself. No git command has
been run; everything is on the working tree.

## What changed

| File | Change |
|---|---|
| `db/supabase-prospects-migration.sql` | **NEW.** `public.prospects`, admin-only RLS (4 policies), `stage` CHECK, `updated_at` trigger. **APPLIED.** |
| `db/supabase-prospects-backfill-2026-08-15.sql` | **NEW.** 71-row backfill from `prospect_audits` + Drive qualification docs. **RUN.** |
| `netlify/functions/prospects-admin.js` | **NEW.** `requireAuth({ adminOnly: true })`, `list` / `update` actions, whitelist enforcement in a pure exported `validateUpdate()`. |
| `netlify.toml` | Added `[functions."prospects-admin"]` `timeout = 15`, same shape as `promotions-admin`. |
| `tests/prospects_admin_whitelist.test.js` | **NEW.** 15 assertions: write whitelist (pure function) + auth gate (real handler, no-network branches only). |

## Why the envelope matches `Prospects.tsx` exactly

The original packet specified the row shape and the writable-field list but
not the request/response envelope -- the orchestrator's own admitted
omission, relayed mid-build. Resolved to match `promotions-admin.js` /
`PromotionsPanel.tsx`, the app's one existing precedent:

```
POST { action: 'list', stage?, segment? }  -> 200 { prospects: Prospect[] }
POST { action: 'update', id, patch }       -> 200 { prospect: Prospect }
                                            -> 4xx { error: string }
```

`bg-app` built `Prospects.tsx` against this exact shape (confirmed by reading
its header comment and `src/types/index.ts` after both halves landed, not by
coordination alone): `Prospect` interface field-for-field matches
`prospects-admin.js`'s `SELECT_COLS`, and `PROSPECT_WRITABLE_FIELDS` is
byte-for-byte the same 7 fields as `WRITABLE_FIELDS` here, same order.

**One interop mismatch found, not fixed (out of `bg-backend`'s write scope,
`src/` is never touched):** `src/types/index.ts:111` types `tier` as
`string | null`. The column is `smallint` and PostgREST returns it as a JSON
number, so every live `tier` value the UI receives is actually `number | null`.
Harmless at runtime (TypeScript is erased, and the UI does not appear to do
string-only operations on it from a skim of `Prospects.tsx`), but it is a real
type-contract mismatch and `bg-app` or `bg-verify` should confirm nothing in
the UI's tier rendering assumes a string.

## Migration and RLS

`public.prospects`: admin-only RLS on all four verbs, `public.is_admin()`
(pre-existing, `supabase-multitenant-migration.sql`), same pattern as
`promotions-admin.js` / `supabase-promotions-migration.sql`. No `client_id`
column and no viewer policy exists at all -- there is no path by which a
non-admin JWT can read a row, matching the packet's "no client viewer may
ever read it."

Verified live 2026-08-15 (not asserted from the file):

```sql
select tablename, policyname, cmd, roles from pg_policies where tablename = 'prospects' order by cmd;
```
```
prospects | prospects_delete | DELETE | {authenticated}
prospects | prospects_insert | INSERT | {authenticated}
prospects | prospects_select | SELECT | {authenticated}
prospects | prospects_update | UPDATE | {authenticated}
```
All four `USING`/`WITH CHECK` call `public.is_admin()`; none is a bare
`qual = true`.

## Backfill: 71 rows, source-by-source, and where the sources disagreed

Full breakdown is in the separate report to Constantin (see this session's
final message); the numbers `bg-verify` should reproduce:

- 70 distinct domains from `prospect_audits where status = 'ready'`
  (Source 1) + 1 Drive-only domain (`getglossa.com`, never audited) = 71.
- `select stage, count(*) from public.prospects group by stage`:
  `audited` 9, `disqualified` 19, `new` 43.
- `select tier, count(*) from public.prospects group by tier`:
  `1` 17, `3` 3, `null` 51.
- `select source, count(*) from public.prospects group by source`:
  `inbound` 2, `outbound` 69.

**One unresolved source disagreement, deliberately not silently resolved:**
`revenuehunt.com`. The Drive qualification record (`60-evidence-run-2026-08-14.md`)
disqualified it at a measured `ai_score` of 54 (>= 50, fails D4) at 21:48 UTC.
A re-audit 3 minutes later, 21:51 UTC, scored 0 (would pass D4). The row is
stored `stage = 'disqualified'` (the documented human decision, kept as
recorded) with `ai_score = 0` (the latest ready audit, per this migration's
own "carry the latest row" rule) -- so the stored `ai_score` does not match
the stage's own stated reason, on purpose, with both facts and the conflict
spelled out in `disqualified_reason`. Flagged for Constantin, not resolved by
this migration. Please confirm this is the correct way to have handled it
rather than silently picking a side.

**One undocumented-but-real finding applied, not invented:** the 9 tier-2
domains in `51-qualification-recheck-2026-08-14.md` are recorded there as
"check 4 open" (category never measured). But `prospect_audits` now holds a
fresh ready row for all 9, timestamped in the same 2026-08-14 21:44-21:55
batch window the Drive doc DOES report for tier 1 -- undocumented in the
Drive markdown, which still describes resolving these 9 as EUR 2.02 of future
work. Applied the qualification bar's own stated D4 formula
(`ai_score < 50 AND competitor_flags non-empty AND NOT low_confidence`) to
that real data: 4 of 9 qualify (`easydvm.com`, `smilenotes.co.uk`,
`driveschoolpro.com`, `vibefam.com`), 5 fail (`unittrac.com`, `captainbook.io`,
`storeganise.com`, `getonstage.app`, `breww.com`). Please independently
re-derive at least 2 of these 9 from the raw `prospect_audits` rows and
confirm the D4 arithmetic, since this is the single largest inference this
backfill made beyond directly transcribing a human decision.

## Do

1. Reproduce the RLS policy query and the three `group by` counts above
   independently against production; paste output.
2. Re-run `node tests/prospects_admin_whitelist.test.js` yourself; paste
   output and exit code. Do not quote mine.
3. Independently confirm the auth-gate claim: a POST with no `Authorization`
   header to `prospects-admin.js` returns `401` and constructs no Supabase
   client (the test's structure proves this by construction -- `requireAuth`
   returns before `createClient` is ever called on that path; confirm by
   reading `_auth.js:84-96` alongside the test).
4. Confirm `validateUpdate()`'s whitelist rejection is a hard 400 on the
   WHOLE request for any non-whitelisted key (including `disqualified_reason`,
   which is intentionally not writable from the UI, per the coordinator's
   note that a UI-driven disqualify leaves it `null`), not a silent drop.
5. Re-derive at least 2 of the 9 tier-2 D4 outcomes above from raw
   `prospect_audits` data (domain, `ai_score`, `jsonb_array_length(competitor_flags)`,
   `low_confidence`) and confirm the arithmetic.
6. Spot check 3-5 backfilled rows' `disqualified_reason` / `notes` text
   against the cited Drive source file for accuracy (no invented facts).
7. Confirm no em dash (U+2014) or en dash (U+2013) anywhere in the 4
   new/changed files listed above. I ran a Python Unicode scan for those two
   code points, not `rg`, and got a clean result; independently reproduce
   with your own tool.
8. Standard checks: secret scan on the 4 files, `git diff --stat` (nothing is
   staged/committed), confirm write scope was `netlify/functions/` and `db/`
   only (`netlify.toml` edit is the one exception, matching the existing
   `promotions-admin` precedent in the same file).
9. Write the verdict report to `docs/qa/`.
10. If the verdict is `PASS` or `PASS WITH FINDINGS`, write the `git add` /
    `git commit` command yourself (same standing rule packets `006`/`011`/`012`
    established -- `bg-backend` does not draft its own commit command for
    something it built).

## Do not

- Do not edit `prospects-admin.js`, the two SQL files, or `netlify.toml`.
  Report; do not fix.
- Do not run any mutating SQL beyond what "Do" item 1/5 need (read-only
  `SELECT`s only).
- Do not run any git command.
- Do not touch `brandgeo-dashboard/src/` -- that is `bg-app`'s scope, flag
  the `tier` type mismatch above rather than fixing it.
- Do not put a secret value in the report, a commit, or any packet.

## Acceptance criteria

- [ ] Verdict (`PASS` / `PASS WITH FINDINGS` / `BLOCK`) is the first line.
- [ ] RLS policy query reproduced with pasted output, all four policies
      confirmed admin-gated.
- [ ] `node tests/prospects_admin_whitelist.test.js` reproduced independently,
      15/15 assertions, output pasted.
- [ ] Auth-gate no-network claim confirmed by reading `_auth.js` alongside
      the test, not merely by the test passing.
- [ ] Whitelist rejection confirmed to reject the WHOLE request (400), for
      at least `domain` and one audit-derived field, including
      `disqualified_reason` specifically.
- [ ] At least 2 of the 9 tier-2 D4 outcomes independently re-derived from
      raw `prospect_audits` data and confirmed.
- [ ] 3-5 backfilled rows spot-checked against their cited Drive source file.
- [ ] No em/en dash confirmed across the 4 files by an independent tool run.
- [ ] Secret scan clean; write scope confirmed correct.
- [ ] Report written to `docs/qa/`, filename recorded in `CLAUDE.md`.

## Open questions for Constantin

None blocking `bg-verify`'s review. Two things only Constantin can settle,
surfaced in the report to him directly, repeated here so `bg-verify` does not
independently try to resolve them:

1. `revenuehunt.com`'s conflicting measurements (54 disqualifying vs. 0
   three minutes later) -- keep disqualified as recorded, or re-open on the
   newer measurement?
2. The 22 "left new" domains from the 2026-07-16 batch (large SaaS platforms
   and unreferenced test-looking domains, never disqualified without
   stronger evidence than "same batch timing") -- worth a deliberate cleanup
   pass, or leave them in the queue for someone to triage by hand?
