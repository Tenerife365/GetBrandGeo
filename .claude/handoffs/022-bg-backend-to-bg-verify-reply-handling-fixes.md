---
id: 022
from: bg-backend
to: bg-verify
status: READY
created: 2026-09-03
scope_write: docs/qa/contact-routes-and-reply-handling-review-022.md
scope_read: brandgeo-dashboard/netlify/functions/_touches.js, brandgeo-dashboard/netlify/functions/poll-inbound-replies.js, brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/netlify/functions/resolve-contact-routes.js, brandgeo-dashboard/netlify/functions/_contact_routes.js, brandgeo-dashboard/tests/, docs/arch/reply-handling.md, docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md
model: opus
---

## Decision

The 2026-08-20 review returned FAIL. Every finding F1 to F14 was re-verified
against the tree on 2026-09-03; the open ones inside `bg-backend`'s scope are
closed in this change set. Nothing was committed, nothing was deployed, no
migration was run, and no schema, RLS, Stripe, plan or environment variable was
touched. `docs/arch/reply-handling.md` section 9 records the behaviour changes.

## State of every finding, as measured today

| # | State | Evidence |
|---|---|---|
| F1 | CLOSED here | `poll-inbound-replies.js:145-215` (`stripQuotedAndComments` + `parseFromAddress`) |
| F2 | CLOSED here | `_touches.js:160-176` (`nextActionAtFor` reply guard), call site `_touches.js:364` passing `repliedAtIso` |
| F3 | CLOSED here | bounds moved to `_touches.js:47-83` (`TOUCH_MIN_OCCURRED_AT`, `clampOccurredAt`), poller `occurredAtFrom` now delegates |
| F4 | OUT OF SCOPE | process finding about a moving tree and a `src/` tsc error; `bg-backend` does not write `src/` and was instructed not to run the build |
| F5 | CLOSED here | `resolve-contact-routes.js` `fetchPage` manual redirects, `_contact_routes.js` `checkFetchTarget` |
| F6 | ALREADY CLOSED | commit `551a6d1`, host-boundary `playListingMatches` via `hostMatchesDomain` |
| F6b | ALREADY CLOSED | commit `551a6d1`, `MAX_PROSPECTS_PER_CALL = 1` plus the real deadline in `resolveOne` |
| F7 | CLOSED here | `checkFetchTarget` + IP-literal reject in `normaliseDomain` |
| F8 | CLOSED here | contract block in `prospects-admin.js:22-48` now states `warning`, the four renamed 5xx codes and `external_id` |
| F9 | CLOSED here | `tests/touches_record.test.js`, new `F9` section (retry_of x3, refetch_failed) |
| F10 | CLOSED here | `isAutomated` plus two new `metadataHeaders` |
| F11 | CLOSED here | `ok = errors.length === 0 && complete`, `detail.complete` |
| F12 | CLOSED here | every chunk runs, dedupe, then cap, plus a per-hour rotation offset |
| F13 | OUT OF SCOPE | data and process, not code; the never-query CHECK was applied 2026-08-21 and `db/*.sql` is another session's |
| F14 | OUT OF SCOPE | `promote` handler, outside this packet's `prospects-admin.js` touch-handler scope |

## Claims to attack

1. **F1 cannot be walked around.** Find any `From` header that makes
   `parseFromAddress` return an address other than the true addr-spec. Try
   nested comments, an escaped backslash before the closing quote, a
   group-with-mailbox form, encoded-word display names, a display name
   containing `@` outside quotes, and CRLF folding.
2. **F1's refusal is not over-broad.** Confirm ordinary real-world headers from
   the mailbox still parse, so the fix does not silently stop logging replies.
3. **F2 holds at the database level, not just in the fake.** The proof here is
   control flow against a scripted Supabase. Reproduce the reviewer's own
   `begin; ... rollback;` on a real prospect: reply logged, then an outbound
   backfill dated before it, and assert `next_action_at` stays null.
4. **F2 does not over-skip.** An outbound touch after a reply must still
   schedule, and a prospect that has never replied must behave exactly as
   before.
5. **F3's floor is one constant.** Confirm `prospects-admin.js` and
   `_touches.js` cannot drift, and that the admin path still REJECTS (400)
   rather than clamping.
6. **F7's guard is wired into every fetch.** Grep for any `fetch(` in the
   resolver that does not go through `fetchPage`, and check the guard runs on
   hop 0 as well as on redirects.
7. **F7's address classifier.** Attack `ipv4Class` / `ipv6Class`: octal or
   hex-form IPv4 (`0177.0.0.1`, `0x7f000001`), integer-form (`2130706433`),
   NAT64 `64:ff9b::7f00:1`, and a hostname that resolves to both a public and
   a private address.
8. **F5's provenance is now true of the code.** Confirm no path can write a
   `source_url` whose host is neither the prospect's own domain nor
   `play.google.com`.
9. **F12's rotation cannot lose a message.** Check that the offset cannot skip
   an id permanently and that `deferred_over_cap` is honest.
10. **F11's `ok` is not now permanently false.** Confirm a normal, complete run
    still records `ok = true`.
11. **No regression in what already passed.** All six suites below must stay
    green, including the 54 assertions that guard F6 and F6b.

## Files changed (all uncommitted, working tree only)

- `brandgeo-dashboard/netlify/functions/_touches.js` (F2, F3)
- `brandgeo-dashboard/netlify/functions/poll-inbound-replies.js` (F1, F3, F10, F11, F12)
- `brandgeo-dashboard/netlify/functions/prospects-admin.js` (F3 constant import, F8 contract block)
- `brandgeo-dashboard/netlify/functions/resolve-contact-routes.js` (F5, F7)
- `brandgeo-dashboard/netlify/functions/_contact_routes.js` (F5, F7)
- `brandgeo-dashboard/tests/touches_record.test.js` (F2, F9; 20 to 29)
- `brandgeo-dashboard/tests/prospects_admin_whitelist.test.js` (F2, F3; 76 to 84)
- `brandgeo-dashboard/tests/contact_routes_host_match.test.js` (injected lookup stub; still 54)
- `brandgeo-dashboard/tests/poll_inbound_replies.test.js` (NEW, 14)
- `brandgeo-dashboard/tests/contact_routes_fetch_guard.test.js` (NEW, 17)
- `docs/arch/reply-handling.md` (section 9, dated 2026-09-03)

## Commands to reproduce

```
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard"
node --check netlify/functions/_touches.js
node --check netlify/functions/poll-inbound-replies.js
node --check netlify/functions/prospects-admin.js
node --check netlify/functions/resolve-contact-routes.js
node --check netlify/functions/_contact_routes.js
node tests/touches_record.test.js              # 29 assertions passed.
node tests/prospects_admin_whitelist.test.js   # 84 assertions passed.
node tests/contact_routes.test.js              # 67 assertions passed.
node tests/contact_routes_host_match.test.js   # 54 assertions passed.
node tests/poll_inbound_replies.test.js        # 14 assertions passed.
node tests/contact_routes_fetch_guard.test.js  # 17 assertions passed.
```

`npm run build` was deliberately not run (RAM cap on this machine, and
`tsconfig.json` includes only `src`, so none of these files is compiled by it).
The F4 `collectionContext.tsx` tsc error belongs to another session's work.

## Do not

- Do not commit, push, stash or check out anything. A second session is
  committing to this tree.
- Do not touch `_revenue.js`, `revenue-report.js`, `unlock-audit-report.js`,
  `src/pages/Revenue.tsx`, `brandgeo/web/site.js` or `db/*.sql`.
- Do not deploy, and do not schedule the poller. Section 7.1's order still
  stands: env vars, then deploy, then `pg_cron` at minute 20.

## Acceptance criteria

- [ ] Every claim above is independently attacked, with the technique stated.
- [ ] All six suites reproduce the assertion counts listed.
- [ ] F2 is proven against a real rolled-back transaction, not only the fake.
- [ ] The resolver's refusal messages are confirmed to reach the response
      `errors` array (they do not reach the UI banner: `Prospects.tsx` never
      reads `results[0].errors`, which is a known `bg-app` gap).
- [ ] Any finding judged NOT closed is stated with the evidence that reopens it.

## Open questions for Constantin

None from this packet. Two pre-existing decisions remain owed and are recorded
rather than re-argued here: the fate of candidate id 10 (F13) and whether the
read-only Gmail scope on the TalentWeLove Workspace is acceptable
(`docs/arch/reply-handling.md` section 5).
