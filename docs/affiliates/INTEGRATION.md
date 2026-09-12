# Integrating a project with the affiliate module

Two audiences: another product that wants its own affiliate program (a
"program" here, tracked by the same code and admin page), and a developer
wiring conversions into it. BrandGEO itself is integrated already
(signup lead, Stripe sales, renewals, refunds).

## 1. Create the program

Admin page `https://app.getbrandgeo.com/affiliates`, Programs tab, New
program. Pick a slug (`talentwelove`), a destination URL (where a referral
link lands), the commission rules, and whether the program is public (listed
on getbrandgeo.com/affiliates.html and open to applications) or private
(invitation only). Save it as `draft` until the site is ready, then set it to
`active`.

Then **Rotate API key**. The key is shown once:

```
bgaff_talentwelove_9f3c...48 hex characters
```

Store it as a server-side secret in the other project. It identifies the
program; every conversion posted with it lands in that program and nowhere
else.

## 2. Referral links

Every active affiliate of the program has a primary code. The link is

```
https://app.getbrandgeo.com/r/<program-slug>/<CODE>
```

(`https://getbrandgeo.com/r/...` forwards there.) The redirect validates the
program and code, records the click, and sends the visitor to the program's
destination URL with these query parameters added:

| Parameter | Value |
|---|---|
| `ref` | the affiliate code, upper case |
| `bg_rid` | an anonymous referral id for this click (the "visit token") |
| `ref_days` | the program's attribution window in days |
| `utm_source` | `affiliate` |
| `utm_medium` | `referral` |
| `utm_campaign` | the program slug (kept if the link already carried one) |

Any UTM the affiliate appended to the link is preserved. A paused affiliate
or a dead code still redirects to the destination; it just records nothing.

## 3. Keep the referral on your site

Copy `brandgeo/web/affiliate-track.js` to your site and load it on every page
(it has no BrandGEO-specific selectors). It:

- reads `ref`, `bg_rid`, `ref_days` and the program slug off the landing URL;
- stores them for `ref_days` days as a first-party cookie `bg_ref` when
  `localStorage['bg-consent']` says `{ "analytics": true }`, otherwise in
  session storage only (adapt `hasConsent()` to your consent banner);
- injects hidden inputs `affiliate_ref`, `affiliate_visit`,
  `affiliate_program` into every `<form>`;
- exposes `window.BrandGEOAffiliate.getRef()`, `.query()` (a query-string
  fragment to append to a link), `.fields()` (an object for a JSON body) and
  `.clear()`.

If you do not want the script, read the three query parameters yourself and
keep them wherever you keep UTMs. What the server needs later is either the
`bg_rid` value or the `ref` code.

## 4. Post conversions

```
POST https://app.getbrandgeo.com/api/affiliate/conversions
Authorization: Bearer bgaff_<program>_<key>        (or X-Api-Key: ...)
Content-Type: application/json
```

Body:

| Field | Required | Meaning |
|---|---|---|
| `idempotency_key` | yes | your unique id for this event (`order_1234`, `lead_88`). Repeating it returns the original and writes nothing. Global across programs. |
| `conversion_type` | yes | `lead`, `qualified_lead`, `sale`, `recurring`, `custom` |
| `referral_id` | one of these three, at least once per customer | the `bg_rid` from the landing URL |
| `affiliate_code` | | the `ref` code, or a coupon code the customer typed |
| `external_customer_id` / `customer_email` | | a customer you already sent: the stored attribution is reused |
| `external_id` | recommended | your order, invoice or lead id. The same id, same type, same program is a duplicate. |
| `external_customer_id` | recommended | your stable customer id. Without it the customer is keyed on the hashed email, then on the referral id. |
| `customer_email` | optional | hashed for matching and self-referral checks, masked for display, never stored raw |
| `customer_ref` | optional | a label the affiliate may see instead (`Company 12`) |
| `amount` or `amount_cents` | for sales | `"299.00"` or `29900`. Never floats in cents. |
| `currency` | optional | 3-letter code, default the program currency |
| `status` | optional | `confirmed` (default), `refunded` or `cancelled` (recorded and immediately reversed) |
| `occurred_at` | optional | ISO timestamp, default now |
| `metadata` | optional | up to 4 KB, stored as sent |

Anything named `commission` in the body is ignored. The commission is computed
from the program rules on the server.

Responses:

| Status | Meaning |
|---|---|
| `201` | recorded: `{ ok, duplicate: false, conversion, commission }` (`commission` is `null` when the rules pay nothing for this type, for example a plain `lead`) |
| `200` | duplicate: `{ ok, duplicate: true, conversion, commission }` |
| `400` | validation (`error`, `errors[]`) or `program` in the body does not match the key |
| `401` | missing or unknown key |
| `422` | nobody to attribute: no valid `referral_id`, `affiliate_code`, or known customer |
| `500` | write failed; safe to retry with the same key |

Example: a signup that came through a link, then a sale, then a renewal:

```bash
curl -X POST https://app.getbrandgeo.com/api/affiliate/conversions \
  -H "Authorization: Bearer $AFFILIATE_API_KEY" -H "Content-Type: application/json" \
  -d '{"idempotency_key":"lead:acct_501","conversion_type":"lead","referral_id":"<bg_rid>","external_customer_id":"acct_501","customer_email":"buyer@example.com"}'
```

```bash
curl -X POST https://app.getbrandgeo.com/api/affiliate/conversions \
  -H "Authorization: Bearer $AFFILIATE_API_KEY" -H "Content-Type: application/json" \
  -d '{"idempotency_key":"order_1001","conversion_type":"sale","external_id":"order_1001","external_customer_id":"acct_501","amount":"299.00","currency":"EUR"}'
```

```bash
curl -X POST https://app.getbrandgeo.com/api/affiliate/conversions \
  -H "Authorization: Bearer $AFFILIATE_API_KEY" -H "Content-Type: application/json" \
  -d '{"idempotency_key":"invoice_2002","conversion_type":"recurring","external_id":"invoice_2002","external_customer_id":"acct_501","amount":"299.00","occurred_at":"2026-10-12T09:00:00Z"}'
```

The second and third calls carry no referral: the customer id was attributed
by the first call and the attribution is reused, then locked by the sale.

### Refunds and cancellations

```bash
curl -X POST https://app.getbrandgeo.com/api/affiliate/conversions \
  -H "Authorization: Bearer $AFFILIATE_API_KEY" -H "Content-Type: application/json" \
  -d '{"action":"reverse","idempotency_key":"order_1001","status":"refunded","reason":"customer refund"}'
```

Returns `200 { ok, conversion, commissions }`. A pending, approved or payable
commission becomes `reversed` (and leaves its draft payout batch). A paid
commission stays paid and is flagged for reconciliation; the admin decides on
a clawback by hand. Reversing twice is harmless. Only the key of the program
that owns the conversion can reverse it.

### Recurring

A `recurring` conversion pays `recurring_commission_bps` of its amount while
the customer's first sale is less than `recurring_months` old and the
subscription has not been marked ended. Outside that window it is still
recorded (so the affiliate's history is complete) with
`metadata.no_commission_reason`.

## 5. Coupon codes

The admin can add a `coupon` code to a membership (Programs tab, codes). A
conversion posted with that code as `affiliate_code` is attributed to the
affiliate even without a click, and a coupon beats an earlier link. For
BrandGEO's own checkout, set `stripe_promotion_code_id` on the code: a Stripe
checkout that used that promotion code is attributed automatically.

## 6. Manual attribution

When a customer was referred but nothing was recorded (a phone call, a
screenshot), the admin uses Conversions, Manual attribution, with the customer
identity, the affiliate and a reason. It beats every other rule and is
audited with the admin id. A manual conversion (Conversions, Add manual)
records a lead or sale the same way.

## 7. How BrandGEO itself is wired

- `brandgeo/web/affiliate-track.js` on every marketing page, loaded after
  `site.js`. It decorates links to `app.getbrandgeo.com` with the referral,
  adds hidden fields to forms and attaches the referral to the `accept-terms`
  request.
- `src/pages/Signup.tsx` stores the referral from the URL; `Welcome.tsx` sends
  it to `provision-account.js`, which records a `lead` keyed on the hashed
  email. No commission yet: a free account earns nothing.
- `accept-terms.js` stores the referral beside the terms acceptance.
- `stripe-webhook.js` hands every verified event to `_affiliate_stripe.js`:
  `checkout.session.completed` and the first `invoice.paid` become one `sale`
  (keyed on the invoice id), renewals (`billing_reason: subscription_cycle`)
  become `recurring`, `charge.refunded` reverses (a partial refund only
  flags), `customer.subscription.deleted` ends recurring. Attribution order:
  the promotion code on the payment, the terms acceptance
  (`client_reference_id`), the stored attribution for the provisioned client,
  the stored attribution for the hashed email.
- The audit widget path in `site.js` (`redirectToSignup`) does not carry the
  referral yet; the tracker covers links and forms, so a visitor who signs up
  from the audit widget is attributed by their hashed email only if the same
  email was captured through a decorated form first. Follow-up: append
  `window.BrandGEOAffiliate.query()` inside `signupUrl` in `site.js`.
