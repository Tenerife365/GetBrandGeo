# Affiliate module: test results, verification and limitations

Date: 2026-09-12. Everything below was measured in this session, not inferred.
Companion documents: `README.md` (setup, env vars, deploy order),
`INTEGRATION.md` (conversion API), `ADMIN-GUIDE.md`, `AFFILIATE-GUIDE.md`.

## 1. Automated tests

Run from `brandgeo-dashboard/`:

```bash
node tests/affiliate_core.test.js; node tests/affiliate_auth.test.js; node tests/affiliate_stripe.test.js; node tests/affiliate_flow.test.js
```

| File | Checks | Covers |
|---|---|---|
| `tests/affiliate_core.test.js` | 27 | integer money and basis points, commission rules (percent, fixed, per qualified lead, recurring window, custom per-affiliate rules, approve-after date, rule summaries), attribution policy (manual wins, converted customer locked, coupon beats link, last touch and first touch), self-referral detection, commission state machine, redirect URL building (`ref`, `bg_rid`, `ref_days`, the three UTMs, UTM preservation), code, slug and API key formats, conversion, program and custom-rule validation, payout details sanitising, CSV quoting and formula prefixing |
| `tests/affiliate_auth.test.js` | 16 | admin endpoint 401 (no token), 401 (unknown token), 403 (viewer), 403 (foreign origin), 204 (preflight), 200 (admin), no API key hash or plaintext in listings; portal 401, 403 for suspended and rejected affiliates, an auth user with no affiliate row gets an empty `me` and cannot update a profile; an affiliate sees only their own commissions, payouts and conversions with masked customer references and none of `customer_email`, `stripe_*`, `external_customer_id`, `ip_hash`, `idempotency_key`; document access is isolated per affiliate; conversion API 401 on missing, malformed and unknown keys, 400 on program mismatch, `X-Api-Key` accepted, commission computed server side; public form and list refuse foreign origins; public list shows only active public programs; redirect answers 405 to POST and 302 to GET |
| `tests/affiliate_stripe.test.js` | 17 | webhook 400 on unsigned and badly signed payloads; the four affiliate event types are in the webhook's handled set and the affiliate handler is called after idempotency; coupon checkout becomes a `sale` with source `coupon`, recurring window and Stripe ids stored on the attribution; the same invoice twice is a duplicate; a renewal inside the window pays `recurring` with the parent sale, outside the window records with `recurring_window_ended` and no commission; a zero invoice is ignored; partial refund flags, full refund reverses, an unmatched refund is ignored; `customer.subscription.deleted` ends recurring; the terms-acceptance path attributes a sale; a stored email-hash attribution keeps source `link` and gains the Stripe customer id; an organic buyer records nothing; a broken database never throws out of the webhook |
| `tests/affiliate_flow.test.js` | 44 | the whole lifecycle through the real handlers against an in-memory Supabase fake with a movable clock: programs (create, 409 on slug, 400 on rules, draft hidden), API key rotation, invitation with token hash, join preview and accept (single use, sanitised payout details), public application (honeypot, 404 for private program, 201, 409 duplicate, 429 after 5 per IP), approve and reject, membership invite and approve on the second program, click 302 with the full parameter set and a visit row (device family, referrer host, salted IP hash, no raw IP), case-insensitive codes, bots, HEAD, unknown and wrong-program codes untracked, 30 clicks per minute cap, lead and sale through the API with approve-after at +30 days, idempotency on key and on external id, client-sent commission ignored, cross-program isolation (422), qualified lead on the second program, coupon overriding a link with `duplicate_customer` flag and an `attribution.reassigned` audit row, converted-customer lock, last touch versus first touch, API and admin reversal (reason required), recurring at month 2 with parent and none at month 14, approve with skipped rows, maturing at the clock date, payout candidates with minimum, batch creation, CSV export, mark paid 400/200/409 with the admin as audit actor, refund after payout sets the reconciliation flag, batch cancel returns rows to approved, portal `me` with referral link and totals, document upload and attach, payout details update, apply to program 409/404, overview counts, audit filters, and the only DELETE ever issued is on `affiliate_payout_items` when a draft batch is cancelled |

Result on 2026-09-12, run twice (before and after the last frontend change):

| | |
|---|---|
| Affiliate checks | 104 of 104 pass |
| Whole `tests/` directory | every file passes except `tests/package_provisioning.test.js` |
| `npm run build` | exit 0 |

`package_provisioning.test.js` has failed at HEAD since 2026-08-02 (it asserts a `.select('plan_grant_until, plan_source')` that `stripe-webhook.js` no longer contains). It is recorded in `CLAUDE.md` under 2026-09-03 and is unrelated to this module.

**One real defect was found by the tests and fixed before anything shipped.** A Stripe sale matched through a stored attribution (a buyer who had arrived through a link and signed up earlier) was recorded with `source = 'manual'` because `recordConversion` hard-coded the source on the membership branch. `_affiliate_service.js` now keeps the caller's source and `_affiliate_stripe.js` passes `coupon`, `stripe`, or the stored attribution's own source. The Stripe test asserts the attribution keeps `source = 'link'` and gains `stripe_customer_id`.

### How the tests isolate the code

- `tests/helpers/affiliate_test_env.js` replaces `_auth.js` in `require.cache` with a mock that reproduces its contract (204 preflight, 403 foreign origin, 401 missing or unknown token, 403 non-admin when `adminOnly`), because the real module opens a Supabase client at load and reads `user_profiles`.
- `tests/helpers/fake_supabase_mem.js` emulates the PostgREST builder (`select`, `insert`, `update`, `delete`, `eq`, `in`, `is`, `gte`, `lte`, `like`, `order`, `range`, `limit`, `single`, `maybeSingle`), the three RPCs (`affiliate_record_visit`, `affiliate_rate_check`, `affiliate_mature_commissions`), unique constraints (23505), `auth.admin`, and storage.
- `stripe-webhook.js` is loaded with placeholder env values; only the bad-signature 400 path runs end to end offline. The event handlers are exercised directly against the fake.

## 2. Production database verification (project `duiyifepitvugyulobqm`)

Migrations applied and named `affiliate_module_2026_09_12` and
`affiliate_function_hardening_2026_09_12`. Read back with SQL afterwards:

| Check | Result |
|---|---|
| `affiliate_*` tables | 14 |
| RLS enabled | 14 of 14 |
| Policies | 48, of which DELETE policies: 0 |
| Functions | 5, all with `search_path = public` after hardening |
| Triggers | 7 |
| Storage bucket `affiliate-documents` | present, private |
| `terms_acceptances` new columns | 3 (`affiliate_ref`, `affiliate_visit`, `affiliate_program`), 12 existing rows untouched |
| RPC execute grants | `postgres` and `service_role` only; `affiliate_my_id()` also `authenticated` (the RLS policies call it) |
| `cron.job` affiliate entries | 0 (the cron file is optional and has not been run) |
| Seed section A | 2 programs (`brandgeo` active public, `talentwelove` draft private), 4 resources |

Supabase advisors after hardening: the only affiliate-related items are
`affiliate_rate_limits` having RLS with no policy (INFO, intended: only the
service key touches it) and `affiliate_my_id()` being executable by
`authenticated` (required by the policies, same class as the existing
`is_admin()`). Pre-existing project-wide findings are unchanged.

The first apply failed with `relation "public.affiliates" does not exist`:
`apply_migration` validates `LANGUAGE sql` function bodies at creation, and the
helper was defined before its table. The file was reordered (section 2b) and
applied cleanly.

## 3. Manual end-to-end checklist (14 steps, to run against production once deployed)

Nothing below has been run against production yet; the code path of every
step is covered by `affiliate_flow.test.js` against the fake.

1. Admin page, Programs: two programs exist (`brandgeo` active public, `talentwelove` draft private). Set `talentwelove` to active if you want to test both.
2. Affiliates tab, Invite: your own second email, both programs, a code. The invitation email arrives (or the join link is shown when `RESEND_API_KEY` is unset).
3. Open the join link, accept the terms, choose a payout method. You land on `/affiliate` signed in. In the admin page the memberships show one `active` and, if you left it, one `pending`; approve or reject the second.
4. In a private window open `https://app.getbrandgeo.com/r/brandgeo/<CODE>`: you land on getbrandgeo.com with `ref`, `bg_rid`, `ref_days` and the three UTMs; Clicks & audit shows the visit with a device family and no IP.
5. Accept analytics on the banner, sign up on the dashboard from that window: Conversions shows a `lead` from source `link` with a masked email and no commission.
6. Pay with a Stripe Payment Link from the same account (or a EUR 1 test product): `checkout.session.completed` and the first `invoice.paid` produce one `sale`, source `stripe`, a `pending` commission at the program's sale rate (10 percent since Constantin's 2026-09-12 edit; the seed said 20), approval date +30 days.
7. Affiliate dashboard: the sale appears with a masked reference, the commission reads `pending`, the email "new conversion" arrived.
8. Refund the charge in the Stripe Dashboard: the conversion turns `refunded`, the commission `reversed`, the audit log holds `conversion.reversed`.
9. Second sale (new checkout): a second `sale` and `pending` commission.
10. Commissions tab: approve it by hand (or wait for the approval delay; "Mature pending" runs the same function). The affiliate receives the "commission approved" email.
11. Payouts tab: the affiliate appears under Ready to pay with the total and the minimum check. Create the batch; the commission moves to `payable`; export the items CSV.
12. Pay through Wise, Revolut, PayPal or your bank, outside the platform.
13. Mark paid with the date and the transfer reference: commissions become `paid`, the affiliate receives the payout email, the audit row carries your user id and the reference.
14. Affiliate dashboard: the payout shows with its reference; attach an invoice; the admin can open it through a signed URL. Check that the affiliate sees nothing of the other affiliate, and that the customer's email never appears unmasked.

## 4. Screenshots and preview routes

Captured from `vite --mode demo` (fixtures, `@example.com` addresses, no
production data) with headless Chrome at 1280 px, saved in
`docs/affiliates/screenshots/`:

| File | Route |
|---|---|
| `01-public-affiliates-page.png` | `getbrandgeo.com/affiliates.html` (full page) |
| `02-public-affiliate-terms.png` | `getbrandgeo.com/affiliate-terms.html` |
| `03-affiliate-login.png` | `app.getbrandgeo.com/affiliate/login` |
| `04-affiliate-join.png` | `app.getbrandgeo.com/affiliate/join/<token>` |
| `05-affiliate-portal.png` | `app.getbrandgeo.com/affiliate` |
| `06-admin-programs.png` | `app.getbrandgeo.com/affiliates` |
| `07-admin-affiliates.png` | `.../affiliates#affiliates` |
| `08-admin-conversions.png` | `.../affiliates#conversions` |
| `09-admin-payouts.png` | `.../affiliates#payouts` |
| `10-admin-clicks-audit.png` | `.../affiliates#activity` |

To preview locally: `npm run dev -- --mode demo` in `brandgeo-dashboard/`,
then set `sessionStorage.demo_logged_in = 'true'` in the browser console. The
admin page lets demo mode through its admin gate; production never does.

## 5. Limitations and what is not verified

- **Live Stripe path.** The webhook handlers ran only against the fake. The
  first real `invoice.paid` and `charge.refunded` are the test of the two
  event types that must be enabled on the endpoint in the Stripe Dashboard
  (README, deploy step 4). Until then renewals and refunds do not arrive.
- **Emails.** `sendBrandedEmail` is a no-op without `RESEND_API_KEY`, so the
  tests prove the calls, not the delivery.
- **Postgres semantics.** The fake emulates the builder, the unique
  constraints and the three RPCs; it does not run the RLS policies or the SQL
  functions. The policies were verified by reading `pg_policies` back, not by
  querying as an affiliate user. A role-scoped probe (sign in as an affiliate,
  select another affiliate's rows through the anon key, expect zero rows) is
  the remaining check and needs a real affiliate login.
- **Audit widget path.** `site.js` (`redirectToSignup`) does not append the
  referral, so a visitor who signs up from the audit widget is attributed only
  if the same email came through a decorated form first. `site.js` was dirty
  from another session and was not edited; the one-line follow-up is in
  `INTEGRATION.md` section 7.
- **Audit report unlock.** `unlock-audit-report.js` does not record a lead;
  same reason, same fix direction (read `affiliate_visit` from the request and
  call `recordConversion` with `conversion_type: 'lead'`).
- **Retention.** The 90-day click purge and the daily maturing job are in
  `db/supabase-affiliate-cron-2026-09-12.sql` and are not scheduled. Without
  them, raw clicks accumulate and pending commissions mature only when an admin
  opens the page. The `data_retention_policies` register does not list the
  affiliate tables yet.
- **Cross-domain referral.** The redirect lands on `getbrandgeo.com` with the
  referral in the URL and the tracker keeps it there; when the visitor moves to
  `app.getbrandgeo.com` the referral travels in the decorated link and the
  hidden form fields, never in a shared cookie. A visitor who types the app URL
  by hand after clicking a link is attributed only by email hash at signup.
- **Currencies.** One currency per program; no conversion. A conversion posted
  in another currency is recorded with a `currency_mismatch` flag and no
  commission.
- **Not legal or tax automation.** Nothing here computes VAT, withholding or
  invoices; the affiliate uploads their own invoice and the admin keeps the
  record.
- **No money moves.** Payout batches, CSV, mark paid and reference are the
  whole workflow by design.

## 6. Dash scan

`rg` over every new file and over the added lines of every modified file for
U+2013 and U+2014, with a positive control (a scratch file containing one em
dash matched, exit 0). No em or en dash in the added content. Pre-existing
occurrences in untouched lines of `index.html`, `cookies.html` and
`netlify.toml` comments were not counted and not changed.
