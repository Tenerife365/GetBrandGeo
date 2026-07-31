# End-to-end payment test, and the link rotation

Written 2026-07-31. Everything here is against the LIVE Stripe account
(`acct_1LHjKrKh2GaZE2B4`, `livemode: true`). There is no test mode.

---

## 1. The cheap real-subscriber test

**Constantin asked for EUR 0.10. Stripe refuses it:** the minimum charge for EUR
is EUR 0.50 (`The Checkout Session's total amount due must add up to at least
€0.50 EUR`). The test is EUR 0.50, the cheapest a live card payment can be.

**It is hidden by never being published, not by any access control.** A Stripe
Payment Link cannot be password protected. This one is not on any page, not in
`STRIPE_CHECKOUT_LINKS`, and not reachable from the gate. It must be
**deactivated the moment the test is done** (step 5), because until then it sells
Essentials for EUR 0.50 a month to anyone holding the URL.

| | |
|---|---|
| Product | `prod_UzFFI2hqJm3PZo` "BrandGEO Internal End-to-End Test" |
| Price | `price_1TzGlqKh2GaZE2B41PgbiNwS`, EUR 0.50/month, `metadata.plan = essentials` |
| Payment link | `plink_1TzGlyKh2GaZE2B48LnghDoN` |
| Acceptance reference | `65ae0d80-f08d-4377-86d3-9d24d917bf8c` (a real row, written by the live gate) |

**The URL to pay, with the acceptance attached:**

```
https://buy.stripe.com/5kQcN66KU8qwcYAgoOdZ60h?client_reference_id=65ae0d80-f08d-4377-86d3-9d24d917bf8c
```

`metadata.plan = essentials` is deliberate: `stripe-webhook.js` resolves the tier
from it, so this exercises the real provisioning path and will create a real
Essentials client for whichever email pays. That is the point, and it is also why
step 5 exists.

### What it proves that nothing else can

`client_reference_id` survives a Stripe Payment Link **on this account**. That is
currently an assumption, and the whole S1 remediation rests on it: if it does not
survive, every legitimate purchase raises `checkout_without_acceptance` and the
alert becomes noise within a week.

### After paying, check exactly this

```sql
-- 1. The acceptance was matched to the payment it authorised.
select reference, plan, matched_at, matched_email, stripe_session_id
from terms_acceptances
where reference = '65ae0d80-f08d-4377-86d3-9d24d917bf8c';
-- EXPECT: matched_at, matched_email and stripe_session_id all NON-NULL.

-- 2. No false alarm was raised.
select type, title, created_at from admin_notifications
where type = 'checkout_without_acceptance' order by created_at desc limit 5;
-- EXPECT: nothing new. A row here means client_reference_id did NOT survive,
-- which is the single most important thing this test can tell us.

-- 3. The customer was actually provisioned.
select id, name, plan, plan_source, stripe_subscription_id
from clients order by created_at desc limit 3;
-- EXPECT: a new client on essentials.
```

### Step 5, the cleanup, which is not optional

1. Cancel the subscription in Stripe (Customers, find the payment, cancel).
2. Deactivate the payment link `plink_1TzGlyKh2GaZE2B48LnghDoN`.
3. Archive the price `price_1TzGlqKh2GaZE2B41PgbiNwS` and the product.
4. Delete or downgrade the client the webhook created, so it does not sit in the
   roster as a paying Essentials customer (`delete-client` or set plan to free).
5. Delete the `terms_acceptances` row above, or leave it as the record of the
   test. Leaving it is fine and arguably better.

A second price, `price_1TzGksKh2GaZE2B4lp6FYZiH` at EUR 0.10, was created before
the minimum was known and is **already archived**. It was never payable.

---

## 2. The link rotation (roadmap C3, review finding S1)

Six new payment links were created against the **same prices**. No price, amount,
currency or `metadata.plan` changed, so the catalogue is identical and nothing
about what a customer is charged moved.

| plan / period | new link id |
|---|---|
| essentials monthly | `plink_1TzGZ2Kh2GaZE2B4tPOXVvdi` |
| essentials annual | `plink_1TzGZEKh2GaZE2B4x7F2Iz9c` |
| growth monthly | `plink_1TzGZKKh2GaZE2B4PBoSmG2k` |
| growth annual | `plink_1TzGZRKh2GaZE2B49CuHG0rm` |
| growth_pro monthly | `plink_1TzGZeKh2GaZE2B4CCCBgDEM` |
| growth_pro annual | `plink_1TzGZmKh2GaZE2B4LTb92NIK` |

The URLs are in `STRIPE_CHECKOUT_LINKS` on the Netlify project and deliberately
not written down here. This file is in the public repo, which is the entire
reason the rotation happened.

The six OLD links (`plink_1Ty5ZzKh…` through `plink_1Ty5aAKh…`) are **still
active on purpose**, see below.

### SEQUENCING, and it is the whole risk

`_terms_gate.js` reading from the env var is **committed and pushed (`ff7cae3`)
but was NOT deployed** as of writing: Netlify's current deploy is still
`31f8dc0`, ~15 minutes after the push, and the live gate therefore still issues
the OLD links.

**Do not deactivate the old links until the new code is live.** Doing it now
sends every buyer to a dead Stripe page. Order:

1. Confirm the deploy has landed:
   ```bash
   curl -s -X POST https://app.getbrandgeo.com/.netlify/functions/accept-terms \
     -H "Content-Type: application/json" -H "Origin: https://getbrandgeo.com" \
     -d '{"plan":"growth","period":"monthly","accepted":true,"accepted_version":"2026-07-13"}'
   ```
   The returned `url` must be the NEW growth-monthly link, not
   `…/7sY3cw9X6ayEf6IegGdZ607`. **Each call writes a terms_acceptances row**, so
   delete them afterwards rather than polling this in a loop (twenty rows were
   created and deleted this way while waiting).
2. Only then deactivate the six old links.
3. Re-run `bash scripts/check-contract-gate.sh`.

Until step 2, the exposure the rotation exists to close is still open, because
the old URLs remain payable and are still in git history.
