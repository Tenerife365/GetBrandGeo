# Packet 020: contact route resolver and promotion path

**From:** `bg-backend` (and the `bg-app` half, built in the same session)
**To:** `bg-verify`, Opus
**Date:** 2026-08-16
**State:** READY, not yet run
**Mandatory:** yes. This adds a new table with RLS, a new public function
endpoint that fetches third-party sites, and a NEW WRITE PATH to columns that
`prospects-admin.js` has always hard-rejected.

## What shipped

Packet `019` asked for a contact route resolver, because all 43 prospects at
`stage='new'` had zero contact routes while 43 of 43 already carried an audit
token and a score. This packet is what was built, plus the promotion half that
`019` left to `bg-app`.

| File | State |
|---|---|
| `db/supabase-prospect-contact-candidates-2026-08-16.sql` | Applied to production, verified by query |
| `netlify/functions/_contact_routes.js` | New, pure, no network |
| `netlify/functions/resolve-contact-routes.js` | New, admin gated |
| `netlify/functions/prospects-admin.js` | New `promote` action, `candidates` on every response |
| `netlify.toml` | New `resolve-contact-routes` timeout entry |
| `src/types/index.ts` | `ContactCandidate` and friends |
| `src/pages/Prospects.tsx` | Resolve button, candidate list, promote control |
| `tests/contact_routes.test.js` | New, 61 assertions passing |
| `tests/prospects_admin_whitelist.test.js` | 49 to 63 assertions, passing |

Nothing is committed. Nothing is deployed.

## The claims to attack

Ranked by what it would cost to be wrong.

1. **`promote` cannot be used to write an arbitrary value.** It accepts only
   `candidate_id`; the value comes from the candidate row. Try to defeat this.
   In particular check that `promotionPatch()` can never emit a key outside
   the five it is supposed to, and that a candidate row written by something
   other than the resolver (direct PostgREST with an admin JWT, which RLS
   permits) cannot smuggle a key in through `email_kind` or `source_url`.
2. **`promote` never sets `x_verified` or `linkedin_verified`.** Asserted for
   both kinds. Confirm no other code path in this change set can.
3. **`update`'s whitelist is unchanged.** `WRITABLE_FIELDS` is still the same
   7. Confirm `contact_email`, `linkedin_url` and `x_url` are still hard
   rejected by `update`, and that the two write surfaces stay disjoint.
4. **RLS on `prospect_contact_candidates`.** 4 policies, all `is_admin()`.
   This is the same role-scoped rollback-probe work you did on
   `prospect_touches`; the table holds contact details for named people.
5. **The resolver never guesses and never queries a lead database.** Read
   `_contact_routes.js` adversarially. A single pattern-generating branch
   would invalidate the provenance claim the whole design rests on.
6. **The Play Store fallback cannot attach a stranger's address.** A name
   search returned twelve apps for "PageLightPrime", eleven unrelated. The
   guard is `playListingMatches()`: accept a listing only if it references
   the prospect's own domain. Try to defeat that with a substring collision.
7. **Fetch safety.** The resolver requests URLs derived from
   `prospects.domain` and from links found in fetched HTML (the Play link).
   Check for SSRF: can a crafted page make it fetch an internal address? Note
   `redirect: 'follow'` is set.

## Known gaps, stated rather than hidden

- **No database-level proof of the promote path.** The Supabase MCP returned
  503 on every attempt this session, so the `begin; ... rollback;` probe used
  for the S8 forward-only stamp was not run. Run it.
- **The adminOnly branch is unproven live** on both new endpoints. The test
  suite exercises only the missing-token and bad-origin branches, which
  return before any network call. Same caveat every admin function carries.
- **A deploy blocker was found late and fixed:** `resolve-contact-routes` had
  no `netlify.toml` entry and would have inherited the 10s default while
  budgeting 20s per prospect. Now 26s platform, 18s per prospect, 22s per
  invocation, batch cap 3. Check the arithmetic holds and that a skipped
  prospect is reported by name rather than dropped.
- **`promoted` is flagged in a second write** after the prospect row is
  updated. A failure there returns 200 with a `warning`, not a 500, because
  the meaningful write already succeeded and the UI derives "in use" by
  comparing values rather than reading the flag. Judge whether that is the
  right call.
- **False positives are real and were measured.** A live sweep of 43
  prospects surfaced role addresses misclassified as individual and addresses
  belonging to other companies entirely, scraped from testimonials. Both are
  fixed with regression tests, but the individual-address count after those
  fixes was never re-measured. Anything you find here is a live defect, not a
  hypothetical.

## Do not

- Do not edit the code you are reviewing.
- Do not run `git`.
- Do not promote a candidate against production, or write to `prospects`.
- Do not set any `verified` flag.
