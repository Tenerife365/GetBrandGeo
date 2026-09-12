# Affiliate module: admin guide

Everything happens on `https://app.getbrandgeo.com/affiliates` (admin login,
sidebar entry "Affiliates"). Five tabs: Programs, Affiliates and
applications, Conversions and commissions, Payouts, Clicks and audit. The
strip at the top shows active affiliates, pending applications, total clicks,
open reconciliation flags and the commission totals per currency and status.

Every change to money or attribution is written to the audit log with your
user id. Nothing financial can be deleted from this page, by design.

## Programs

**New program.** Slug (lower case, becomes part of every referral link:
`/r/<slug>/<CODE>`), name, tagline and description (shown on the public page),
destination URL (where a referral click lands), brand colour and logo URL,
currency, and the rules:

- Lead commission: a fixed amount per **qualified lead**. A plain lead never
  pays; it only attributes the customer.
- Sale commission: none, fixed per sale, or a percentage.
- Recurring: a percentage of every renewal, for N months from the first sale
  (empty = unlimited).
- Attribution window (days a click holds the customer), attribution mode
  (last touch, or first touch), approval delay (days a commission stays
  pending; default 30, so a refund inside that window reverses it before it
  is ever payable), minimum payout, payout schedule text, terms (markdown or a
  URL) and terms version.

Status: `draft` (invisible, records nothing), `active`, `paused` (links still
redirect, nothing is recorded), `archived`. **Public** programs are listed on
getbrandgeo.com/affiliates.html and accept applications; private ones are
invitation only.

**Rotate API key.** For a program run by another project. The key is shown
once; copy it into that project's server secrets. Rotating again invalidates
the old key immediately. BrandGEO's own program needs no key: the signup and
the Stripe webhook are wired in.

**Resources.** Links, text snippets or file URLs shown to active members of
the program in their dashboard (pitch lines, landing pages, banners).

## Affiliates and applications

**Invite.** Email, name, one or more programs, an optional preferred code.
The affiliate row is created with status `invited`, one membership per
program (also `invited`), one link code per membership, and an invitation
email with a 7-day link. Without `RESEND_API_KEY` the page shows the join
link instead; send it yourself. **Resend invite** issues a fresh link.

**Applications** (from the public form). Approve creates the affiliate (or
reuses an existing one with that email), activates the membership, issues the
code you typed or a suggested one, and emails the affiliate a join link so
they can set up their login and payout details. Reject records your note and
emails it.

**Affiliate row.** Edit name, company, website, country, payout method and
details (only the fields that method needs), internal notes. **Suspend**
stops every link and hides the dashboard; **Reactivate** reverses it.

**Memberships.** Add an affiliate to another program, approve or reject a
pending application from the affiliate dashboard, suspend one program without
touching the others, and set **custom rules** for that affiliate in that
program (any subset of the rule keys, for example a 25% rate for one partner).

**Codes.** Each membership has one primary link code. Add extra link codes
(one per channel, if the affiliate wants to see which converts) or **coupon
codes**. A coupon code typed at checkout attributes the customer to the
affiliate even without a click, and beats an earlier link. For BrandGEO's
Stripe checkout, paste the Stripe promotion code id (`promo_...`) on the
coupon so a checkout that used it is attributed automatically. Codes are deactivated, not deleted.

**The referred customer's discount (ruled 2026-09-12).** The BrandGEO program
gives 20 in total: 10% of every payment to the affiliate for 12 months, and
10% off for the referred customer for their first 12 months while they stay
subscribed. The module pays the affiliate half. The customer half lives in
Stripe and is set up once per affiliate:

1. Stripe Dashboard, live mode, Product catalog, Coupons: one coupon,
   percentage 10, duration "Multiple months", 12 months. Create it once and
   reuse it for every affiliate.
2. On that coupon, one promotion code per affiliate whose code string equals
   the affiliate's own code, first-time orders only. Copy its id (`promo_...`).
3. In this page, on the affiliate's membership, add a coupon code with the same
   string and paste the `promo_...` id. A checkout that used the code is
   attributed to that affiliate, and every renewal follows the first sale.

The affiliate's commission is computed on the amount Stripe reports as paid,
so on a discounted invoice it is 10% of the discounted price. Every payment
link, monthly and annual, must have "Allow promotion codes" enabled or the
customer cannot type the code at checkout.
## Conversions and commissions

**Conversions** are what happened: lead, qualified lead, sale, recurring,
custom, with amount, currency, source (link, coupon, form, api, stripe,
manual), the masked customer reference and flags. Filter by program,
affiliate, type, status and dates.

Flags to look at: `self_referral` (the customer's email or domain matches
the affiliate's), `duplicate_customer` (the customer switched affiliates),
`currency_mismatch`, `partial_refund`, `membership_not_active` (recorded, no
commission).

**Add manual.** Record something the tracking missed. Pick the program and
the affiliate membership, type, amount, an external id, a customer reference
and a reason. The commission is computed from the rules like any other.
Manual conversions carry the admin id and the reason forever.

**Manual attribution.** Assign a customer identity (their client id, Stripe
customer id, or `email:<hash>` as it appears on the conversion list) to an
affiliate in a program, with a reason. It beats every automatic rule and is
never displaced by a later click or coupon.

**Reverse** a conversion (refund or cancellation) with a reason. Its unpaid
commission becomes `reversed`; a paid one is flagged for reconciliation.

**Commissions** move through `pending` (approval delay running), `approved`
(matures automatically after the delay, or by hand), `payable` (in a draft
payout batch), `paid`, `rejected` (with a reason) or `reversed` (the
conversion was refunded). Select several rows and approve, reject, reverse or
reopen them at once; rows that cannot make the move are listed as skipped.
Approving emails the affiliate one summary per program.

The table `COMMISSION_TRANSITIONS` in `_affiliate_core.js` is the whole state
machine. `paid` is final: a refund after payout sets `reconciliation_flag`
and a note, and the clawback decision is yours.

## Payouts

1. **Candidates** lists every affiliate with approved commissions, grouped
   by currency, with the total, the strictest program minimum, whether it is
   met, and whether payout details exist.
2. **Create batch** for one affiliate and currency. The batch snapshots the
   payout method and details at that moment, and the commissions move to
   `payable`. A batch can be **cancelled** while draft; its rows return to
   `approved`.
3. **Export** the CSV (batches or items) and pay through Wise, Revolut,
   PayPal or your bank. Nothing here moves money.
4. **Mark paid** with the date and the transfer reference (required). Every
   commission in the batch becomes `paid`, the affiliate gets the payout
   email, the audit log records the reference.
5. **Documents.** The affiliate can attach an invoice to the batch from their
   dashboard; you can attach documents too and open them through a short
   lived signed URL. Files live in the private bucket `affiliate-documents`.

Monthly routine: open Payouts, review candidates against the reconciliation
flags on the commissions tab, create one batch per affiliate, export, pay,
mark paid. Fifteen minutes for two affiliates.

## Exports

CSV for affiliates, memberships, clicks, conversions, commissions, payout
batches and payout items, with the same filters as the lists. Column names
are stable (`EXPORT_COLUMNS` in `_affiliate_core.js`) so a spreadsheet or an
accountant's import does not break between months. Cells starting with `=`,
`+`, `-` or `@` are prefixed with a quote so they cannot execute as formulas.

## Clicks and audit

Raw clicks (program, affiliate, code, UTM, landing path, referrer host,
device family, time) are kept for 90 days; the lifetime count and last click
stay on the membership. The audit log lists every action with actor, entity,
before, after and reason; filter by entity or affiliate.

## What to check when something looks wrong

- **A partner says a sale is missing.** Conversions tab, filter by program.
  If the customer bought through Stripe, search the audit log for
  `conversion.recorded`; if nothing, the payment carried no coupon and the
  buyer's email or client had no stored attribution (they did not arrive
  through the link, or consent was refused and the session ended before
  signup). Add it manually with a reason if the partner can show the referral.
- **A commission is flagged self-referral.** Look at the customer reference
  and the affiliate's website. Reject with a reason, or approve if it is a
  legitimate customer on the same domain.
- **The public page shows no program.** The program is not `active` or not
  public. The list is cached five minutes at the edge.
- **Renewals or refunds are not arriving.** The Stripe endpoint must have
  `invoice.paid` and `charge.refunded` enabled (README, deploy step 4).
