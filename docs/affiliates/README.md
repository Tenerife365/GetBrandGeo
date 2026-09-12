# BrandGEO affiliate module

An owned, multi-program affiliate system built into the existing platform.
No affiliate SaaS, no recurring cost, no automatic money movement. Written
2026-09-12; it replaces the PromoteKit plan in
`docs/PARTNERSHIP-AFFILIATE-STRATEGY.md`.

Sized for the real need: a handful of partners, roughly EUR 1,000 a month of
referred revenue, payouts done by hand from a CSV once a month.

**This is not legal or tax automation.** It records who referred whom and what
is owed under the program rules. Invoices, VAT, withholding and the decision to
pay stay with a human.

## What it does

- **Programs.** Any number of independent programs, each with its own slug,
  branding, destination URL, commission rules, attribution window, approval
  delay, minimum payout, terms and promotional resources. Public programs are
  listed on getbrandgeo.com/affiliates.html; private ones are invitation only.
  A project other than BrandGEO gets its own program and its own API key.
- **Affiliates.** Invited by an admin or applying through the public form.
  One affiliate can belong to several programs; membership is approved per
  program. Login is a Supabase magic link, no password.
- **Referral links.** `https://app.getbrandgeo.com/r/<program>/<CODE>` (and
  `getbrandgeo.com/r/...`, which forwards there). The click is recorded with an
  anonymous referral id and the visitor is sent to the program's destination
  with `ref`, `bg_rid`, `ref_days`, `utm_source=affiliate`,
  `utm_medium=referral`, `utm_campaign=<program>`. UTMs already on the link are
  kept.
- **Client snippet.** `brandgeo/web/affiliate-track.js` keeps the referral for
  the attribution window (a first-party cookie with analytics consent,
  session storage without), adds hidden fields to every form, decorates links
  into the app, and attaches it to the checkout request. Any site can use it.
- **Attribution.** Last touch by default, first touch per program, a coupon
  code overrides a link, an admin override beats everything, and a customer is
  locked to the affiliate who brought the first sale. Self-referrals and
  customers who switch affiliates are flagged, never silently dropped.
- **Conversions.** Lead, qualified lead, sale, recurring, custom. From the
  BrandGEO signup and Stripe webhook automatically, from any other project via
  `POST /api/affiliate/conversions`, or by hand from the admin page. The
  commission is always computed on the server from the program rules; an
  amount sent by a client is ignored.
- **Commissions.** Integer cents, original currency, pending until the
  approval delay passes, then approved, payable (in a batch), paid. Refunds
  reverse unpaid commissions and flag paid ones for reconciliation.
- **Payouts.** Select approved commissions, group per affiliate and currency,
  create a batch, export the CSV, pay through Wise, Revolut, PayPal or a bank
  transfer, mark the batch paid with the date and the transfer reference. The
  affiliate can attach an invoice to the batch.
- **Emails.** Invitation, application received, approved, rejected, new
  conversion, commission approved, payout completed. Through the existing
  Resend shell in `_email.js`; without `RESEND_API_KEY` they are silent no-ops.
- **Audit.** Every financial or attribution change writes
  `affiliate_audit_log` with the actor. Conversions, commissions, attributions,
  batches and items are never hard-deleted.

## Files

| Area | Files |
|---|---|
| Database | `db/supabase-affiliate-migration-2026-09-12.sql` (14 tables, 3 RPCs, RLS, storage bucket), `db/supabase-affiliate-seed-2026-09-12.sql`, `db/supabase-affiliate-cron-2026-09-12.sql` |
| Shared logic | `netlify/functions/_affiliate_core.js` (money, rules, attribution policy, validation, CSV), `_affiliate_service.js` (attribution and conversion writes), `_affiliate_auth.js` (affiliate JWT gate, program API key gate), `_affiliate_email.js`, `_affiliate_stripe.js` |
| Endpoints | `affiliate-redirect.js` (`/r/*`), `affiliate-programs-public.js`, `affiliate-apply.js`, `affiliate-conversions.js` (`/api/affiliate/conversions`), `affiliate-portal.js`, `affiliate-admin.js` |
| Hooks into existing code | `stripe-webhook.js` (calls the affiliate hook after provisioning), `accept-terms.js` (stores the referral beside the acceptance and prefills the affiliate's Stripe promotion code on the payment link), `provision-account.js` (records the signup lead) |
| Dashboard | `src/pages/AffiliatesAdmin.tsx` (`/affiliates`, admin), `src/pages/affiliate/AffiliatePortal.tsx` (`/affiliate`), `AffiliateLogin.tsx`, `AffiliateJoin.tsx`, `src/lib/affiliateApi.tsx`, `src/lib/affiliateRef.ts`, `src/types/affiliate.ts` |
| Marketing site | `brandgeo/web/affiliates.html`, `affiliates.js`, `affiliate-terms.html`, `affiliate-track.js`, `.htaccess` (`/r/*` forward), `cookies.html` (the `bg_ref` row) |
| Config | `netlify.toml` (`/r/*` and `/api/affiliate/conversions` rewrites, function timeouts) |
| Tests | `tests/affiliate_core.test.js`, `affiliate_flow.test.js`, `affiliate_auth.test.js`, `affiliate_stripe.test.js`, `tests/helpers/fake_supabase_mem.js`, `affiliate_test_env.js` |
| Docs | this folder: `ADMIN-GUIDE.md`, `AFFILIATE-GUIDE.md`, `INTEGRATION.md`, `TEST-RESULTS.md` |

## Environment variables

All on the Netlify site `brandgeo-dashboard`. Nothing new is required for the
module to run; the three affiliate-specific ones have defaults.

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | yes (existing) | all affiliate functions | service key stays server side |
| `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` | yes (existing) | `stripe-webhook.js` | signature verification protects the affiliate hook too |
| `RESEND_API_KEY` | existing, optional | `_affiliate_email.js` | missing: emails are skipped, everything else works |
| `IP_HASH_PEPPER` | existing, recommended | redirect, apply | salt for the IP hash; the redirect adds the UTC date so click hashes rotate daily |
| `AFFILIATE_CLICK_RATE_LIMIT` | no, default 30 | `affiliate-redirect.js` | recorded clicks per minute per hashed IP; the redirect itself is never blocked |
| `AFFILIATE_STRIPE_PROGRAM_SLUG` | no, default `brandgeo` | `_affiliate_stripe.js`, `provision-account.js` | which program BrandGEO's own Stripe payments and signups credit |
| `AFFILIATE_REPLY_TO` | no, default `support@getbrandgeo.com` | `_affiliate_email.js` | reply-to on affiliate emails |
| `ADMIN_ALERT_EMAIL` | existing, default `support@getbrandgeo.com` | `_affiliate_email.js` | receives "new application" notices |

## Setup and deploy, in order

1. **Apply the migration** in Supabase (project `duiyifepitvugyulobqm`) with
   the SQL editor or the MCP `apply_migration`:
   `db/supabase-affiliate-migration-2026-09-12.sql`. It is idempotent. It
   creates the tables, RLS, the three RPCs, adds three nullable columns to
   `terms_acceptances`, and the private storage bucket `affiliate-documents`.
   Applying it before the deploy is safe: nothing reads the tables until the
   functions exist.
2. **Seed the programs**: section A of
   `db/supabase-affiliate-seed-2026-09-12.sql` (the BrandGEO program, active
   and public; a private draft program for TalentWeLove; four resources).
   Section B is demo data and must not run on production.
3. **Deploy the dashboard** (push `brandgeo-dashboard/`, one Netlify build).
   Verify: `GET https://app.getbrandgeo.com/.netlify/functions/affiliate-programs-public`
   returns the BrandGEO program, and an unauthenticated
   `POST .../affiliate-admin` returns `401`.
4. **Stripe Dashboard, webhook endpoint for app.getbrandgeo.com**: add the
   events `invoice.paid` and `charge.refunded` to the endpoint. Without them
   Stripe never sends renewals or refunds and the affiliate hook for those never
   runs. `checkout.session.completed` and `customer.subscription.deleted` are
   already enabled.
5. **Upload the marketing files** to cPanel from `brandgeo/web/`:
   `affiliates.html`, `affiliates.js`, `affiliate-terms.html`,
   `affiliate-track.js`, `index.html`, `cookies.html`, `sitemap.xml`,
   `.htaccess`. Verify `https://getbrandgeo.com/r/brandgeo/TEST` answers `302`
   to `https://app.getbrandgeo.com/r/brandgeo/TEST` and that
   `https://getbrandgeo.com/affiliates.html` lists the program.
6. **Optional cron**: `db/supabase-affiliate-cron-2026-09-12.sql` (90-day
   click retention, daily maturation). The admin overview runs maturation on
   every load, so the second job is a convenience.
7. **First real partner**: admin page, Affiliates tab, Invite. Run the manual
   checklist in `TEST-RESULTS.md` once against production with your own link.

## Commission rules

Per program, all integers:

| Field | Meaning |
|---|---|
| `lead_commission_cents` | fixed amount per `qualified_lead` (a plain `lead` never pays) |
| `sale_commission_type` | `none`, `fixed` (`sale_commission_cents`) or `percent` (`sale_commission_bps`, 2000 = 20%) |
| `recurring_commission_bps` | percent of every `recurring` conversion; 0 = one-time only |
| `recurring_months` | months from the first sale during which renewals pay; empty = unlimited |
| `attribution_days` | how long a click holds the customer |
| `attribution_mode` | `last_touch` or `first_touch` |
| `approval_days` | pending until this many days after the conversion (default 30) |
| `min_payout_cents` | minimum per payout batch |

A membership's `custom_rules` JSON overrides any of these keys for one
affiliate. Percentages use `floor((amount * bps + 5000) / 10000)`: integer
arithmetic, half a cent rounds up. Currency is stored beside every amount and
never converted; a conversion in a different currency than the program is
recorded with a `currency_mismatch` flag for the admin to look at.

## Attribution

Every conversion is keyed on a customer identity per program:
`client:<id>`, `stripe_customer:<cus_...>`, `email:<sha256>` or the
`external_customer_id` a partner project supplies. The rules, in
`_affiliate_core.decideAttribution`:

1. An admin's manual attribution wins and cannot be displaced.
2. A customer who has already bought stays with the affiliate of that sale.
3. A coupon code beats a link, in both directions.
4. Otherwise last touch (the newest link) or, for a first-touch program, the
   first link until its window expires.

A switch between affiliates is flagged `duplicate_customer`. A customer whose
email matches the affiliate's own email, private domain or website domain is
flagged `self_referral` and the commission carries a review note; it is
created, not blocked, so the admin decides.

## Privacy and security

- **No raw IP anywhere.** Clicks store a SHA-256 of IP, `IP_HASH_PEPPER` and
  the UTC date, so it rate-limits today and joins to nothing tomorrow.
  Applications hash the IP the same way without the date (the hourly limit).
- **Customer emails are never stored on affiliate rows.** They are hashed for
  matching and masked (`j***@example.com`) for display. Affiliates see the
  masked reference, the date, the type, the status and the amount. Never the
  email, never order contents, never Stripe ids.
- **Consent-aware cookie.** `bg_ref` is set only with analytics consent
  (`bg-consent.analytics`). Without it the referral lives in session storage.
  `cookies.html` documents it.
- **Raw click rows expire after 90 days** (cron file); membership counts stay.
- **Payout details** keep only the fields a transfer needs, per method
  (`PAYOUT_DETAIL_FIELDS`). Passwords, card numbers and API credentials are
  dropped on write.
- **API keys** are shown once and stored as SHA-256; rotating replaces the
  hash. **Invitation tokens** are stored hashed, expire after 7 days, and are
  consumed on first use.
- **Authorization**: admin actions sit behind `requireAuth({ adminOnly })`;
  the portal verifies the JWT and loads only the caller's affiliate row; the
  conversion API requires a program key and can only touch that program.
- **Idempotency**: `idempotency_key` is unique per conversion, and the same
  `external_id` in the same program and type is a duplicate too.
- **Rate limits** in Postgres: 30 recorded clicks per minute per IP hash, 5
  applications per hour per IP hash, 3 per day per email hash.
- **CSV exports** neutralise spreadsheet formulas (`=`, `+`, `-`, `@` prefixes).
- **Stripe** events reach the affiliate hook only after
  `stripe.webhooks.constructEvent` and inside the existing `stripe_events`
  idempotency lock; a failure in the hook is logged and never fails the
  provisioning webhook.

## Out of scope (by decision)

Marketplace or affiliate discovery, multi-level or sub-affiliate commissions,
KYC or identity verification, automatic payouts, multi-touch attribution
models, machine-learning fraud detection, chat, a mobile app, gamification,
and BI dashboards.

## Running the tests

From `brandgeo-dashboard/`:

```bash
node tests/affiliate_core.test.js && node tests/affiliate_flow.test.js && node tests/affiliate_auth.test.js && node tests/affiliate_stripe.test.js
```

Results and limitations: `TEST-RESULTS.md`.
