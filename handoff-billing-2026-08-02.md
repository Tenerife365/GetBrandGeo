# Handoff, billing and invoicing, 2026-08-02

Written at the end of the billing session. Everything below was verified against
the repo, Stripe, Supabase, DNS or the live deploy at the time of writing, not
recalled. Where a claim could not be checked, it says so.

**This is NOT the main handoff.** `handoff.md` at the repo root belongs to a
different, parallel session (the content and acquisition track, committed at
`0469da0`) and was deliberately left untouched. Read that one for articles, the
newsroom and the site. Read this one for email, Stripe, provisioning and
invoicing. The two tracks touched disjoint paths except where section 5 says
otherwise.

---

## READ THIS FIRST: state at end of session, 2026-08-02

**The Stripe account migration is DONE and PROVEN. BrandGEO now bills from a
Spanish account, `acct_1Tzui063lspobjfO`.** The old Romanian account
`acct_1LHjKrKh2GaZE2B4` is superseded and awaiting close-out. Every claim below
was closed by a command, never by a report.

| Thing | State | Proven by |
|---|---|---|
| ES account | LIVE, ES, charges + payouts enabled, bank intact | `GET /v1/account`, external_accounts |
| Catalogue | 4 products, 7 prices, 7 links, all livemode | created and read back |
| Env vars + deploy | WORKING | live `POST accept-terms` returned the new account's link |
| Webhook under `dahlia` | WORKING | EUR 1 payment: plan provisioned, `client_events` 15 written |
| Client binding | HOLDS on the new account | payer `monica@talentwelove.com` mapped to no client, **no stray client created**, 37 total / 1 created |
| Radar yearly defect | FIXED and pushed | `node --check` + 6/6 period cases |

**Nothing in the code changed for the migration.** `STRIPE_CHECKOUT_LINKS`,
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` were swapped and the site
redeployed once. That is the entire Netlify cost.

### THE BPR INVOICE IS SENT. 2026-08-02.

**`in_1Tzx9q63lspobjfO3JPde2Do`, number `INV-35`, EUR 3.500,00, due 4 August
2026.** Constantin reviewed and sent it himself. Customer
`cus_UzwgTPWQfZtXOY` (Bucateperoate SRL, VAT RO15565836, `preferred_locales`
`['ro']`). The invoice is in Romanian throughout.

**The commercial terms, which are now a commitment because they are printed on
the document the client pays against:**

- 10 months of Growth PRO, 2 August 2026 to **2 June 2027**
- EUR 500 a month, **7 months billed (EUR 3,500), 3 months free**
- **Administration of 4 social media accounts, at 5 posts per week**
- Activation on payment confirmation
- Does NOT auto-renew; continuation is a standard subscription at list price

Seller block, TVA basis (Directiva 2006/112/CE art. 6 and art. 44), both parties'
bank accounts and the totals are in the footer and custom fields. Constantin's
NIE/NIF is **Y8060061R** and his **EU-VAT is genuinely N/A**, so
`default_account_tax_ids` being `null` is CORRECT and is not an outstanding item.
Account branding (logo, icon, `#875df5`) was uploaded and is live.

### What is left, in order

1. **PROVISION BPR BY HAND THE MOMENT IT IS PAID. Nothing does this
   automatically.** `invoice.paid` is not handled by `stripe-webhook.js`, which
   only handles `checkout.session.completed`, `customer.subscription.updated`
   and `customer.subscription.deleted`. On client **1**, set
   `plan = 'growth_pro'`, `plan_source = 'package'`,
   `plan_grant_until = '2027-06-02'`. Write a `client_events` row by hand too,
   or the audit trail has a EUR 3,500 hole in it.
2. **The 4th social channel will not connect.**
   `PLAN_SOCIAL_CHANNEL_LIMIT.growth_pro = 3` (`planConfig.ts:713`) and the
   invoice promises **4**. Work starts Monday. This is a sold commitment the
   platform currently refuses, so it needs a per-client override or a limit
   change BEFORE delivery, not after. Posts are fine: 5 a week is about 22 a
   month against `PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH.growth_pro = 30`.
3. **The catalogue's product descriptions say "five engines". Growth PRO has
   SEVEN** (`planConfig.ts:97`: chatgpt, gemini, claude, perplexity, google_ai,
   grok, ai_overview; the last two went live 2026-07-29). The descriptions
   created on the new account this morning inherited the stale claim from the
   old account. The INV-35 line item is correct and says 7; the products are not.
4. **A real 0% TVA row in the totals** is still only a custom field and a footer
   paragraph. No tax-rate operation is exposed to the connector, so this needs a
   0% tax rate created in the Dashboard and then the invoice rebuilt. Declined
   for INV-35, may matter for the next one.
5. **`card_payments.statement_descriptor_prefix` is `null`.** Set it to
   `BRANDGEO` before self-serve customers pay by card.

### Cleanup owed

- **Old account, and the checkout precondition is now MET so this is unblocked:**
  deactivate its 7 payment links (**the CLI's DEFAULT profile still points at the
  old account**, so this needs no repointing), refund the EUR 1
  (`cus_UztEDNeNwTyFmh`, `pi_3TztSRKh2GaZE2B40R9592q6`), let EUR 0.97 settle to
  Wise, disable webhook `we_1TrYG7Kh2GaZE2B4EVZuVHD3`, then close. Those links
  are permanent bearer URLs sitting in this repository's public git history, so
  until they are dead anyone can still pay into the abandoned account.
- **New account:** client **51** (`ZZ E2E TEST ES`), its EUR 1
  (`cus_UzwDgjcv3giVq3`), and the test product `prod_Uzw7U7kt29wlqW` are
  disposable after 2026-08-03. Its link self-deactivated at 1/1.
- `.gitignore` for the skills install: `.agents/`, `.claude/skills/`,
  `.commandcode/`, `.continue/`, `.cortex/`, `.qwen/`, `skills-lock.json`.

### Two tool constraints the next session will hit

- **The Stripe MCP connector points at the NEW account
  (`acct_1Tzui063lspobjfO`). The Stripe CLI's DEFAULT profile still points at
  the OLD one, and profile `brandgeo-es` points at the new one.** That split is
  useful, it is how the old catalogue was read while the new one was written,
  but it means every CLI command needs `--project-name` AND `--live` or it
  silently hits the wrong account in the wrong mode.
- **The connector exposes no delete, no invoice update, no tax-rate create, and
  no account write.** The CLI's restricted key has no write on products, prices,
  payment links or invoices either. So deletions, invoice edits, tax rates and
  every account-level setting are Constantin's Dashboard clicks. An invoice
  cannot be patched after creation: build it complete or rebuild it.

### Two working rules this session earned

- **The Stripe CLI defaults to TEST mode.** `--live` is required on every
  command. An empty product list in test mode is indistinguishable from a new
  account and nearly caused a whole catalogue to be built in test mode with
  every call returning success.
- **Diagnose the layer before spending a build.** "Contact us, no link" looked
  exactly like a failed env var. One live POST proved the env was fine and the
  fault was a period the product does not sell, in a file that deploys free via
  cPanel. Guessing would have spent a Netlify build on a correct configuration.

---

## 0) SUPERSEDING RULING, 2026-08-02 later the same day

**Constantin ruled: move to a Spanish Stripe account.** This changes the
sequence in section 6 and makes parts of section 4 moot. Read this section
before acting on anything below it.

### The measurement that made the ruling cheap

Lifetime, live mode, `acct_1LHjKrKh2GaZE2B4`, read from the API not recalled:

- **2 customers**, both Constantin's own tests: `cus_UztEDNeNwTyFmh`
  ("Monica Goane", the EUR 1) and `cus_UzFUoUqjgjwolg` ("Constantin Goane",
  the EUR 0.50).
- **2 charges, EUR 1.50 total.**
- **1 subscription, `sub_1TzGzx`, status `canceled`**, the 2026-07-31 e2e test.
- **Balance EUR 0.97 pending, EUR -0.04 available.**

**There is not one real customer on this Stripe account.** BpR has not paid,
Ai Fy is free, nobody is subscribed. So the migration costs nothing today and
this is the cheapest it will ever be. The moment BpR pays EUR 3,500 the old
account acquires a real invoice and a settled transaction that has to be
reconciled across two accounts permanently.

### `account.country` cannot be changed, so "switch to ES" means a new account

Stripe fixes the country at activation. The documented remedy is a new account
in the correct country, onboarded again. There is no field to correct.

Consequence that governs section 6: **the BpR invoice must NOT be issued from
`acct_1LHjKr`.** A RO-established seller invoicing a RO-established buyer
(Bucateperoate SRL, RO15565836) is a DOMESTIC supply. Art. 44 and Art. 196
reverse charge do not apply between two establishments in the same member
state, and the honest treatment becomes 19% Romanian VAT on EUR 3,500. That is
the exposure section 4 suspected, made concrete. The ES to RO supply is what
makes reverse charge correct and the accountant's footer true.

### Section 4's account-field gaps are moot, and one theory in it was wrong

`individual.address` and `company.address` cannot be moved to ES on a RO-country
account: Stripe constrains the representative and business country to the
account country. On the new account they are simply typed correctly once.

**CONFIRMED IN THE UI 2026-08-02, do not re-test.** Constantin opened Edit on
the account representative under Management and ownership. Every address field
is editable and **the country dropdown is greyed out**. That is the account
country doing it. **Do NOT edit the street to Calle Adriatico while the country
stays RO**: it produces a Spanish street labelled Romania, which is the same
broken shape `company.address` already carries and is the most likely cause of
`verification_failed_keyed_identity` in the first place, since Stripe cannot
resolve a keyed address in the country it was told to search. Spreading it to a
second object makes verification less likely to clear, not more.

**And do not bother fixing verification on the old account.** Measured:
`charges_enabled: true`, `payouts_enabled: true`,
`requirements.disabled_reason: null`, `requirements.current_deadline: null`,
`future_requirements.currently_due: []`. The items are past due but nothing is
disabled and no clock is running. The only exposure is a future enforcement
trapping the balance, and the balance is EUR 0.97.

**Correction to section 6 step 2's causal theory.** The past due
`verification_failed_keyed_identity` is attached to the **`individual`** person,
whose address is a THIRD address this handoff never recorded:
**George Enescu 30J, Vila 2, Otopeni, 075100, RO**. That person's address is
internally consistent RO, so `company.address.country = RO` is not the obvious
cause. The likelier cause is that Otopeni does not match the identity document.
**Carry this to the new account:** onboard with the Tenerife address AND a
document showing Constantin's name at Calle Adriatico 64, or the same failure
repeats on day one.

Also, precision on section 4's table: `company.address.line1` DOES carry the
"64". It is `business_profile.support_address.line1` that is missing it, and
that is the field that prints.

### The connector cannot write to the account at all

The Stripe MCP exposes no account-write operation (`PostAccountsAccount` does
not exist) and no `/v1/tax_ids` operation. Account fields, the VAT id behind
`default_account_tax_ids`, bank details, the invoice number prefix and the
verification documents are Dashboard-only. **Section 6 step 2 was never an agent
task.** It is entirely Constantin's clicks, and always was.

### Preserved evidence, because the cleanup destroys it

`client_events.client_id` is **ON DELETE CASCADE**. Deleting client 50 cascades
away event id 14, the only durable proof that the client binding (`13bb92d`)
provisioned correctly against real money, on a feature `bg-verify` has still
never reviewed (open item 7). The row, recorded here before deletion:

```json
{ "id": 14, "client_id": 50, "type": "stripe_change",
  "from_plan": "free", "to_plan": "growth_pro",
  "created_at": "2026-08-02 07:05:29.960989+00",
  "meta": { "mode": "payment", "reason": "package_purchase",
    "source": "stripe-webhook", "email": "constantin@workfully.com",
    "price": "price_1TzsndKh2GaZE2B47jsC2IKU", "months": 1,
    "plan_source": "package", "refresh_cadence": "weekly",
    "plan_grant_until": "2026-09-02",
    "stripe_customer_id": "cus_UztEDNeNwTyFmh",
    "checkout_session": "cs_live_a1HNalxdm7kzNZc9sxHx6tWFDymMTzzC1Rn07b0933lU96QUhTj2nhL9fe",
    "previous_plan_source": null, "previous_grant_until": null,
    "stripe_subscription_id": null } }
```

The load bearing facts in it: `plan_source` became `package`, the grant landed
at `2026-09-02`, the payer's email belonged to no client, and **no new client
was created**. Under the pre-`13bb92d` code that payment would have created one.

**The EUR 1 refund is deliberately NOT taken.** The account is being abandoned
and the available balance is EUR -0.04 against EUR 0.97 pending, so a EUR 1.00
refund either fails for insufficient funds or debits the Wise account. Fold it
into the RO account close-out instead.

### Verified unchanged from the rest of this handoff

Checked by API and SQL this pass, not taken from the text above: exactly 7
active payment links and they are the correct 7 (the six `rotation=2026-07-31`
plus Radar `plink_1TzJXb`); the test link `plink_1Tzsno` self-deactivated at
`completed_sessions 1/1`; BpR is client 1, `growth_pro`, `plan_source` and
`plan_grant_until` both NULL, `stripe_customer_id` NULL, which is the silent
admin plan change defect still live; `stackedGrantUntil(10, null)` returns
**2027-06-02** and 10 is inside `MIN 1 / MAX 36`;
`settings.invoices.default_account_tax_ids` is `null` while
`company.vat_id_provided` is `true`; git is 0 ahead and 0 behind with only the
content session's `index.html` and `site.js` in the tree.

### One lever found this pass that section 4 did not have

`customer.tax_exempt = 'reverse'` makes Stripe render reverse-charge treatment
natively, and `customer.invoice_settings.footer` sits on the Customer. So the
accountant's footer is typed ONCE on the BpR Customer and every future BpR
invoice inherits it, rather than being retyped per invoice.

---

## 1) Goal

Three threads, in this order:

1. **Verify the 2026-08-01 handoff**, unblock `RESEND_API_KEY`, and send the free
   plan update to Ai Fy.
2. **Close the Stripe payment link exposure** left open by the 2026-07-31
   rotation.
3. **Build and prove a one off sale path for the founding client** (BpR, EUR
   3,500 for 10 months of Growth PRO) that provisions the right account no matter
   who pays, and produces an invoice an accountant will accept.

Thread 3 grew a fourth: the invoice Stripe generates today is **not compliant**
and would be rejected. That is where the session ended, and it is where the next
one starts.

---

## 2) Current state

- `origin/main` and local `main` are **identical, 0 ahead, 0 behind**, checked
  after `git fetch`. Working tree carries `brandgeo/web/index.html` and
  `site.js` modified by ANOTHER session; they are not mine, do not commit them.
- **Netlify builds spent today: 2.** `_email` at 22:02 UTC 2026-08-01 (pushed by
  another session's batch) and `stripe-webhook` at 06:46 UTC 2026-08-02 (mine,
  `13bb92d`). Both verified deployed by `commit_ref`, not assumed.

**Email plumbing: DONE and deployed. The Ai Fy email is STILL NOT SENT.**
`RESEND_API_KEY` is now in `brandgeo-dashboard/.env` and a `--self-test`
delivered successfully. The real `--send` was never run, and the template has
CHANGED since that self-test (logo, unsubscribe), so re-run `--self-test` before
sending. Ai Fy has still not been contacted about the Gemini move or Radar.

**Stripe link exposure: CLOSED.** Verified by API, not by report: exactly seven
active payment links remain, the six carrying `metadata.rotation = 2026-07-31`
plus the Radar link `plink_1TzJXb`. All six pre-rotation links are `active:
false`. This closes the item that had been open since 2026-07-31.

**Client binding: BUILT, DEPLOYED, AND PROVEN WITH REAL MONEY.** A package price
may now carry `metadata.client_id`; when it does, the payer's email is never
consulted. Proven end to end with a EUR 1 live payment.

**BpR invoice: NOT CREATED, deliberately.** The Stripe invoice format is not
compliant yet (section 4). Creating the link before fixing that would produce an
invoice their accountant rejects on a EUR 3,500 sale.

**A live defect found and NOT fixed:** an admin plan change from the dashboard
silently does nothing. Constantin moved BpR to Free; `clients.plan` is still
`growth_pro` and `client_events` has no row for it. `set-client-plan.js` writes
an audit row on every success, so the absence proves the write never happened.
The function itself is deployed and correctly gated (anonymous POST returns
`401`), so the failure is between the browser and the function. Same
silent-success class as the email script that hid an unsent email for an hour.

---

## 3) Active files

| File | Why it matters |
|---|---|
| `brandgeo-dashboard/netlify/functions/stripe-webhook.js` | `resolveBoundClient()` plus the `boundClientId` / `targetClientId` branch. `exports.__test__` at the bottom is the test surface; Netlify routes on `exports.handler` only, so it adds no endpoint. |
| `scripts/check-package-client-binding.js` | The binding harness. 9/9, exit 0. **Proven to fail** at 4/9 with the binding disabled, so it discriminates. |
| `brandgeo-dashboard/netlify/functions/_package_checkout.js` | `resolvePackage`, `checkPackageLineItem`, `packageGrantUntil`, `stackedGrantUntil`. Unchanged this session, but every package decision runs through it. |
| `brandgeo-dashboard/netlify/functions/_email.js` | Now carries the mark on both grounds and `kind: 'marketing'`, which attaches BOTH the visible Unsubscribe button and the `List-Unsubscribe` header from one field. |
| `scripts/send-free-plan-update.js` | Sends the Ai Fy email. Runs LOCALLY, needs no deploy. `--dry-run`, `--self-test`, `--send`, `--status <id>`. |
| `brandgeo-dashboard/.env` | Gitignored. `RESEND_API_KEY` is now present. |
| `brandgeo/web/images/brandgeo-mark-white.png`, `-violet.png` | 102x128 transparent, rendered from `docs/growth/brand-identity-2026-07-29/v3/icon-mark.svg`. **NOT** from `brand-kit-2026-07-29/`, which holds the retired eye mark. |
| `scripts/deploy-status.ps1` | Answers "does pushing now cost a build?" Use the `.ps1`, not the `.sh`. |

**Reference data, all measured this session**

- BpR is `clients.id = 1`, `plan growth_pro`, `plan_source NULL`, `plan_grant_until NULL`.
- BpR's only account email is **`birou@bucateperoate.ro`** (viewer).
  `constantin@talentwelove.com` is ALSO on client 1, as admin.
- `constantin@getbrandgeo.com` is on **client 2, BrandGEO, plan `managed`**.
- Legal buyer data from the accepted invoice INV-22: **Bucateperoate SRL**, VAT
  **RO15565836**, Int. Muncii Nr. 23, Et. P, Sector 3, 031761, Bucuresti,
  Romania, contact Adrian Ungureanu.
- Stripe account `acct_1LHjKrKh2GaZE2B4`. Tax head office **ES**, but
  `account.country` and `company.address.country` are both **RO** with a Tenerife
  city and postcode. Bank on file is Wise BE, last4 9560.

---

## 4) Changes made

**Email: the key was never the mystery it looked like (`a30db86` lineage).**
`--self-test` reported `NOTHING WAS SENT`. `brandgeo-dashboard/.env` was last
modified 2026-07-24 and contained only the two Supabase vars: the edit had never
been saved. Fixed by appending the key. **Before that was known, two DNS
findings were produced and are still true but were NOT the cause**: the sending
domain `mail.getbrandgeo.com` publishes a Google Workspace SPF
(`include:_spf.google.com`) that does not authorise Resend, and it carries
`MX -> SMTP.GOOGLE.COM`. Resend DKIM at `resend._domainkey.mail.getbrandgeo.com`
does resolve. Deliverability risk, not a delivery blocker.

**Email template (on `origin/main`, deployed 2026-08-01 22:02 UTC).** The header
carries the white mark left of the wordmark; the outer footer carries the
gradient mark. Both are absolute HTTPS on the cPanel docroot, because an email
client will not load a relative path or a `data:` URI. There was no logo hosted
anywhere: `getbrandgeo.com/images/logo.png` returned **404** and no logo file
existed under `brandgeo/web/`.

`kind: 'marketing'` attaches the opt-out. Made a flag rather than a per-caller
option because the caller that forgets is the one that draws the spam report, and
the report lands on the sending domain. Default `transactional`, so
`expire-plan-grants`, `set-client-plan` and `_admin_notify` are unchanged and
correctly carry no opt-out. The target is a `mailto:` so it needs no endpoint and
no build. **`List-Unsubscribe-Post` is deliberately NOT sent**: RFC 8058 one
click is defined only over HTTPS, and a Post header pointing at a mailto is
malformed. It turns on with the endpoint, not before.

**BIMI was investigated and parked at Constantin's direction.** A logo beside the
sender name in Gmail is not a template change: it needs DMARC at `p=quarantine`
(currently `p=none`), an SVG Tiny-PS mark, and a Verified Mark Certificate at
roughly USD 1,000 to 1,500 a year.

**Stripe: six pre-rotation links deactivated by Constantin.** One trap was caught
before it bit: the Radar link `plink_1TzJXb` carries `metadata.created` and NOT
`metadata.rotation`, so a rule of "deactivate anything without
`rotation=2026-07-31`" would have killed the live Radar checkout.

**Client binding (`13bb92d`, deployed 06:46 UTC, verified by `commit_ref`).**
`price.metadata.client_id` binds a package to a named client. Fails closed: a
malformed or unknown id provisions NOTHING and raises
`reportUnprovisionedPackage`, rather than degrading into "create a new client
from the payer's email", which is the exact failure it exists to stop. Does not
repoint an existing `stripe_customer_id` on the bound path, because the payer is
a different Stripe Customer by design and `get-subscription.js` and
`set-client-plan.js` both read that field.

**Proven with real money.** EUR 1 paid from `constantin@workfully.com`, an
address attached to no client. Client 50 went `free -> growth_pro`,
`plan_source=package`, `plan_grant_until=2026-09-02`, `client_events` id 14
recorded it, and **no new client was created**. Under the old code that payment
would have created one.

**Invoice compliance analysed against the accepted INV-22.** The gaps, each
traced to the setting that causes it:

| | INV-22 (accepted) | Stripe today | Cause |
|---|---|---|---|
| Seller | Constantin Daniel Goane | "GetBrandGEO" | `business_profile.name` is the trade name; `company.name` is never printed |
| Seller address | Calle Adriatico **64** | Calle Adriatico, no number | `support_address.line1` is missing the number and that is the field that prints |
| Seller VAT | "EU-VAT Number: N/A" | absent | `settings.invoices.default_account_tax_ids` is `null` despite `vat_id_provided: true` |
| Buyer | Bucateperoate SRL, RO15565836 | **Monica Goane**, a private address | `tax_id_collection` disabled; a Payment Link invoices the CARDHOLDER |
| Tax line | "0% Standard VAT 0.00 EUR" | nothing at all | `automatic_tax` off, no footer |
| Supply date, bank details, note | present | absent | not set |

Also: the test product name carries an em dash, breaking the project's own
no-dashes content rule.

**The structural finding, and it is the load bearing one: a Payment Link
invoices whoever holds the card.** The EUR 1 test proved it by accident, billing
"Monica Goane". If BpR's accounts payable pays a link, the invoice is addressed
to that individual and is rejected. **Ruled: BpR gets a Stripe Invoice against a
pre-created Customer, not a Payment Link.** The buyer block is then fixed by us
and cannot be typed wrong. Cost: an invoice payment fires `invoice.paid`, which
the webhook does not handle, so provisioning is manual for this one sale.

**Stripe Tax researched, and it must NOT be switched on for BpR.** Three reasons,
all from Stripe's own docs:
- Stripe's excluded-territories table lists Spain as **Ceuta and Melilla only**,
  implying a Canary Islands buyer is charged **21% IVA instead of 7% IGIC**. But
  the Manual Rules page lists `ES / CN / Canary Islands` as a distinct regime.
  **The two pages contradict each other and this must be tested, not assumed.**
- **Manual rules fallback is in private preview**, not a switch.
- **The account says `country: RO` while Tax head office says `ES`.** If Stripe
  reads the business as Romanian, the BpR sale is DOMESTIC, reverse charge does
  not apply, and it would compute **19% Romanian VAT** on EUR 3,500.

**Invoice localisation confirmed as built in.** `customer.preferred_locales`
(RFC-4646) localises Stripe-generated emails and PDFs per customer. It
translates Stripe's own furniture, NOT the line item text or the footer, which
still have to be written per language. Confirm `ro` is on Stripe's supported
list; if not it silently falls back to English.

---

## 5) Failed attempts

**A PowerShell regex rewrite corrupted a billing file's encoding.**
`Get-Content -Raw` read `stripe-webhook.js` as ANSI and `Set-Content -Encoding
utf8` wrote it back with a BOM, mangling 92 non-ASCII comment characters and
flipping CRLF to LF. `git checkout --` is blocked as destructive, so it was
repaired in place by reversing the codepage roundtrip, with the wrinkle that
.NET maps bytes 0x80 to 0x9F that Python's `cp1252` leaves undefined. **Never
use PowerShell string rewriting on source files here. Use the Edit tool.**

**Two runtime defects nearly shipped in the binding, both invisible to
`node --check` AND to reading the diff.** `profile` was left referenced outside
the block it had just been scoped into, which was a `ReferenceError` on EVERY
checkout, bound or not. And `existingUser` was dereferenced on the bound path
where it is null, which threw AFTER the clients row was updated, so the outer
catch would delete the idempotency row, Stripe would redeliver, re-apply and
throw again: a provisioned customer presenting as a permanently failing webhook.
**This is why the harness exists.** A green checker proves nothing until it has
been seen to fail: with the binding disabled it drops to 4/9 with exactly the
five binding checks red.

**The batching premise was wrong.** The email change was held for a batch so it
would share a build with the binding. Another session pushed it first, so it
consumed its own build and the binding needed a second one. **Holding work for a
batch only saves a build if you also own the batch.**

**`git commit -m @'...'@` breaks on embedded quotes** and silently split a commit
message into pathspecs. Use `git commit -F <file>`. And `git commit -- <paths>`
is the safe form while another session has staged work in the index.

**Checking for my own commits by sha failed twice**, because two other sessions
rebased `main` underneath this one. `686ace9` and `4d8cb08` both vanished from
`git log` while being fully present. **Verify by content**:
`git show origin/main:<path> | Select-String "<marker>"`.

**Cross-session collision.** `handoff.md` was overwritten by the content session
mid-way through this one, and `brandgeo/web/index.html` and `site.js` are
modified in the working tree by that session right now. Nothing was lost because
every commit here used explicit paths.

---

## 6) Next steps

> ⚠️ **Steps 1 to 6 below are SUPERSEDED by section 0's ES ruling.** Step 2 is
> not doable at all (the country is immutable and the connector cannot write to
> the account), and steps 3 and 4 must not run against `acct_1LHjKr`. The live
> sequence is section 6A. The text below is kept because the citations in step 1
> and the grant arithmetic in step 3 are still correct and still needed.

### 6A) The live sequence, after the ES ruling

**Constantin's, and no agent can do any of it.** Creating accounts, completing
identity verification and moving API keys are all withheld under AUTONOMY §2.

0. **Create the ORGANISATION first.** Account picker, Create, Create
   organization. Add TalentWeLove and BrandGEO RO. Not Mercor. See the corrected
   note below: doing this first is what unlocks the copy step in the next
   step, and it cannot be obtained afterwards.
1. **Then create the new account INSIDE the organisation, registered in SPAIN.**
   Account picker, Create new account, "Create a new account in your
   organization". **Copy the payout bank account only.** Business address,
   individual address and support address all
   **Calle Adriatico 64, El Rosario, 38109, Santa Cruz de Tenerife, ES**, typed
   fresh. Legal name `Constantin Daniel Goane`, not the `GetBrandGEO` trade
   name, because `business_profile.name` is what prints and `company.name`
   never does.
2. **Complete verification with a document showing that address.** See section
   0: the RO account failed on exactly this and the cause travels.
3. **Add the VAT id under invoice settings and set it as default**, so
   `default_account_tax_ids` stops being `null`. Also set the bank details and
   an invoice number prefix while on that page.
4. **Put the new `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` into Netlify**
   and recreate the webhook endpoint at the same URL. An agent must never see
   or move these.
5. **Reconnect the Stripe MCP connector to the new account**, or the next
   session is still pointed at `acct_1LHjKr` and will silently write to the
   wrong one.

**How the new account is created. CORRECTED 2026-08-02: the ORGANISATION comes
first, and the order is load bearing.**

An earlier version of this runbook said "account switcher, New account". That
works and it is the worse route. Stripe's *Build an organization* page documents
two non-equivalent creation flows:

- **Create an account OUTSIDE an organization:** name, country, done. Every
  business field is typed by hand.
- **Create a new account IN your organization:** name, country, and then an
  extra step, *"Select a legal entity, business details, or payout bank account
  information you want to copy from existing accounts within your
  organization."*

**That copy step exists only inside an org and cannot be obtained
retroactively.** So: create the organisation first, then create the ES account
inside it. Constantin's case is the first example in Stripe's own use-case
table, "Global expansion: create separate Stripe accounts for each country or
region to take advantage of local acquiring."

**TRAP in the copy step. Copy the payout bank account ONLY.** Copying the legal
entity or business details forward imports the Otopeni representative address,
the Tenerife street labelled RO, and the support address missing the "64", which
are the exact defects this migration exists to leave behind, including the one
currently failing verification. The Wise details (`TRWIBEB1`, last4 `9560`) are
unambiguously correct and the most tedious to retype, so copy those and type
every address fresh.

**Target structure:**

```
Organization
├── BrandGEO ES     <- create INSIDE the org, copy bank only
├── TalentWeLove    <- add as existing
└── BrandGEO RO     <- add, remove after close-out
Mercor              <- stays OUTSIDE
```

The Mercor account is a contractor payout account from a job application, not a
business line. An organisation's whole value is clean consolidated reporting and
folding unrelated personal income into it defeats that. Check it for balance and
history before anyone considers closing it.

**Connect is the wrong tool** and must not be used: it would make BrandGEO a
payments platform with itself as a connected merchant, for no gain. Stripe's own
comparison is that a Connect platform IS an account that processes payments,
while an organisation conducts no business and is a container only.

**Two things the org does NOT change.** Organisation API keys (`sk_org`, with a
`Stripe-Context` header per request) exist, but Stripe's guidance is explicit:
"Don't use an organization API key if you need to access only one account." The
Netlify functions touch one account, so this stays an account-level key and no
integration changes, only the value. And the org creator must be Super
Administrator on every account added, which Constantin is automatically on all
three because he created them.

Other constraints read from the docs: up to 75 accounts per org; an account
belongs to only one org; removing every account from an org permanently closes
it; India accounts are ineligible.

The doc is also blunt on why a second account is mandatory rather than optional:
"You can only associate each account with the tax ID and legal entity of one
business."

**Values to re-enter by hand, all read off `acct_1LHjKr` this session:**

| Setting | Value |
|---|---|
| Country at creation | **Spain**, one shot, no undo |
| Legal name | `Constantin Daniel Goane`, NOT the `GetBrandGEO` trade name |
| All three addresses | Calle Adriatico 64, El Rosario, 38109, Santa Cruz de Tenerife |
| Support email / phone | `support@getbrandgeo.com` / `+34647732414` |
| Business URL | `https://www.getbrandgeo.com` |
| Product description | `AI Visibility platform` |
| MCC | `5734` |
| Statement descriptor | `WWW.GETBRANDGEO.COM` |
| Card descriptor prefix | `BRANDGEO` |
| Payout descriptor | `BrandGEO` |
| Payout schedule | daily, `delay_days 7` |
| Bank | Wise, `TRWIBEB1`, last4 `9560` |
| Dashboard display name | `BrandGEO` |
| Logo / icon | re-upload from `docs/growth/brand-identity-2026-07-29/v3/png/`: `icon-tile-512.png` for the icon, `logo-full.svg` or `mark-1024-on-dark.png` for the logo. **NOT** `brand-kit-2026-07-29/`, which holds the retired eye mark. File ids do not transfer between accounts. |
| VAT id | add under invoice settings and **set as default** |

**Fix while retyping:** branding colour on the old account is `#7a60f4`, which
matches neither the site accent `#8b5cf6` nor the button fill `#7c3aed`. Use
`#7c3aed` so hosted checkout matches the button the visitor clicked.

**The product catalogue is NOT worth migrating faithfully.** 16 active products,
audited this session: two are both literally named `Essentials Annual`
(`prod_Ur3ZwGg4E1uxD9` and `prod_Ur3Xe8o6s2iBqu`); `Launch`
(`prod_LzizqMCmBWfyGv`) dates from July 2022; two generations of the same ladder
are live side by side, the 2026-07-09 set with no `metadata.plan` and the
2026-07-26 set with it; and six names carry em dashes, breaking the project's
own content rule on documents customers receive. Recreating is the cleanup, not
a loss. Build one correct set matching `planConfig.ts`.

### The new account is BUILT. Catalogue ids, 2026-08-02

**`acct_1Tzui063lspobjfO`**, country **ES**, `charges_enabled` and
`payouts_enabled` both true, `details_submitted` true, Wise bank copied intact
(`ba_1Tzui763lspobjfOMdgEgpwN`, TRANSFERWISE EUROPE SA/NV, BE, EUR, last4 9560).
Verification passed on creation, so the `verification_failed_keyed_identity` that
dogged the old account did not follow.

Created through the MCP connector, every object read back, all `livemode: true`:

| Plan | Product | Price monthly | Price annual |
|---|---|---|---|
| essentials | `prod_UzvlFTnW6bABSk` | `price_1TzvuS63lspobjfO0O9hq776` 9900 | `price_1TzvuW63lspobjfOpF7bl6Qa` 99000 |
| growth | `prod_UzvlxjmdB6Idcq` | `price_1Tzvua63lspobjfOxHUMZHxX` 29900 | `price_1Tzvue63lspobjfOY9KGPFhi` 299000 |
| growth_pro | `prod_UzvlfrHiEwNF5V` | `price_1Tzvuh63lspobjfOlYPtHpHZ` 44900 | `price_1Tzvul63lspobjfOOxAJjHPM` 449000 |
| radar | `prod_UzvlUFXpVdx5gH` | `price_1Tzvuo63lspobjfOmBR8DARu` 2900 | none, by design |

**The seven payment link URLs are deliberately NOT in this file.** They are
payable bearer URLs and this repository is public. They live only in
`STRIPE_CHECKOUT_LINKS` on Netlify. The link IDs, which are not payable, are
`plink_1Tzvv7`, `1TzvvA`, `1TzvvD`, `1TzvvG`, `1TzvvK`, `1TzvvO`, `1TzvvR`.

**All seven links carry uniform `metadata.migration = "2026-08-02-es"`**, plus
`plan` and `interval`. Deliberate: on the old account six carried `rotation` and
Radar carried `created`, so a cleanup rule of "deactivate anything without
`rotation`" would have killed the live Radar checkout. Uniform metadata removes
that trap. Keep it uniform on any future rotation.

**Verified by running the shipped gate, not by inspection.** The new catalogue
was fed to the real `_terms_gate.js` with the env value set: **11/11 pass, exit
0**. Seven tiers each resolved to a payable URL, and all four refusal paths still
refused: acceptance absent, stale contract version, a plan nobody may self-serve
(`managed`), and `radar/annual`, which must refuse because that price does not
exist. The env value is **301 bytes** in slug form, well inside the 4KB Lambda
ceiling that broke every function on 2026-07-31.

**Not carried across, deliberately:** the five add-on products, the duplicate
second `Essentials Annual`, and `Launch` from July 2022. Nothing sells them.
16 active products became 4.

**Still open on the new account at the time of writing:** branding is empty
(`icon: ""`, `logo: null`, no colours), `card_payments.statement_descriptor_prefix`
is `null`, and `settings.invoices.default_account_tax_ids` is `null`. The
statement descriptor reads `BRANDGEO GLOBAL`, NOT `TALENTWELOVE`, so the
inherited-descriptor risk flagged earlier did not materialise. **The public
business details could not be verified from here**: the dahlia account object no
longer exposes `business_profile`, so whether the DBA name, URL and industry
inherited from TalentWeLove is unknown and must be checked in the Dashboard.

### The API version jump is unavoidable, and here is exactly what it touches

**The webhook endpoint on the OLD account, read live:**

```
we_1TrYG7Kh2GaZE2B4EVZuVHD3
api_version : 2020-08-27
events      : checkout.session.completed
              customer.subscription.updated
              customer.subscription.deleted
url         : https://app.getbrandgeo.com/.netlify/functions/stripe-webhook
```

Those three events are the only ones `stripe-webhook.js` handles. Subscribe to
exactly those on the new endpoint, scope **"Your account"**, never "Connected
accounts": there are no connected accounts (`GET /v1/accounts` returns an empty
list) and an organisation does NOT create them, so that scope would receive
nothing forever while every payment silently failed to provision.

**A new account offers only its current version or a preview.** The dropdown gave
`2026-07-29.dahlia` (current) and `2026-06-24.preview`. `2020-08-27` is not
available. **Take `dahlia`, never the preview** on a money path. So the migration
carries the version jump whether or not anyone wants it, and the job is to verify
against it rather than avoid it.

**Measured, and it shrinks the exposure a long way.** The code pins no API
version anywhere (every function is a bare `require('stripe')(key)`), but the
installed SDK does:

```
brandgeo-dashboard/node_modules/stripe   17.7.0
exports.ApiVersion = '2025-02-24.acacia'
```

stripe-node sends that as `Stripe-Version` on every outbound request, so
**outbound calls are unaffected by the new account's default version.** In
particular `get-subscription.js:40` reads `sub.current_period_end` off the
subscription top level, which moved onto the subscription ITEM in
`2025-03-31.basil`; `acacia` predates basil, so that line keeps working. An
earlier draft of this handoff flagged it as a likely breakage. It is not one.

**What remains is only the INBOUND payload shape**, on those three events.
`constructEvent` verifies the signature and returns the payload as Stripe sent
it; it does not reshape to the SDK version. So `stripe-webhook.js` will parse
`dahlia` objects having only ever seen `2020-08-27` ones. The fields it actually
reads are the stable ones (`session.id`, `customer`, `customer_details.email`,
`mode`, `metadata`, and the customer id on subscription events) and it reads no
`current_period_*` inbound, so this is expected to be fine.

**Expected is not checked. CHECK BEFORE BPR PAYS:** make one small real payment
on the new account and confirm the whole chain, event received, signature
verified, `clients` row updated, `client_events` row written.
`scripts/check-package-client-binding.js` cannot cover this: it feeds synthetic
payloads, so it exercises the logic and never the wire format. Refund that test
together with the EUR 1 at close-out.

**Then an agent can run, in this order.**

6. **Recreate products, prices and the seven payment links** on the new account,
   and update `_terms_gate.js` to the new URLs. Dashboard-touching, so it
   COMMITS per task and batches per AUTONOMY §7. Keep
   `restrictions.completed_sessions.limit = 1` on every test link, which is what
   made `plink_1Tzsno` deactivate itself.
7. **Then the BpR Customer and invoice**, per the old step 3 below, which is
   still correct in every detail except which account it runs against. Add
   `tax_exempt: 'reverse'` and put the footer on
   `invoice_settings.footer` so it inherits (section 0).
8. **Close out `acct_1LHjKr`**: refund the EUR 1, let the balance settle to
   Wise, then close. Not before, see section 0 on the balance.

**Still blocking step 7, unchanged.** The accountant's footer wording. It is no
longer the front of the queue, the ES account is, but it is the long pole so it
should be started now.

### 6B) Superseded text, kept for its citations and arithmetic

**Blocking, and it needs Constantin, not an agent.**

1. **The invoice footer wording, signed off by the accountant.** It goes on every
   invoice, so it cannot be drafted and shipped unilaterally. The citations that
   fit the case: **Council Directive 2006/112/EC Art. 44** (place of supply is
   where the customer is established) and **Art. 196** (customer liable, reverse
   charge); **Art. 6** for the Canary Islands sitting outside the EU VAT
   territory; **Ley 20/1991** for IGIC. Constantin asked for a EUR-Lex link
   rather than blunt text. Get the sentence, then step 3 can run.

**Then, in this order.**

2. **Fix the Stripe account before issuing anything.** `company.address.country`
   is `RO` with a Tenerife city and postcode, which is also the likely cause of
   the past due `individual.verification.additional_document` and
   `proof_of_liveness` with error `verification_failed_keyed_identity`. Then the
   account level invoice fields, which apply to every invoice ever issued: legal
   name `Constantin Daniel Goane`, the missing **64** in `support_address.line1`,
   the VAT id printed via `default_account_tax_ids`, bank details, and an invoice
   number prefix.
3. **Create the BpR Customer and invoice.** Customer: Bucateperoate SRL, VAT
   RO15565836, Int. Muncii 23, Sector 3, 031761 Bucuresti, `birou@bucateperoate.ro`,
   `preferred_locales: ['ro']`. Then a EUR 3,500 invoice, tax off, 0% stated,
   footer from step 1, description naming the service and the period. Grant runs
   to **2027-06-02** (`stackedGrantUntil(10, null)`, computed, not guessed).
   **Sending stays Constantin's click** (AUTONOMY section 2).
4. **Provision BpR manually once it is paid**, because `invoice.paid` is not
   handled. Set `plan=growth_pro`, `plan_source=package`,
   `plan_grant_until=2027-06-02`.

**Cleanup owed from the EUR 1 test.**

5. **Refund the EUR 1** (`cus_UztEDNeNwTyFmh`, session
   `cs_live_a1HNalxdm7kzNZc9sxHx6tWFDymMTzzC1Rn07b0933lU96QUhTj2nhL9fe`).
6. **Delete client 50**, `ZZ E2E TEST - delete after 2026-08-02`, and decide
   whether to keep `price_1TzsndKh2GaZE2B47jsC2IKU` and `prod_UzsYhWZdyN87pr` as
   a reusable test fixture. The link `plink_1Tzsno` **already deactivated
   itself** when it hit `completed_sessions.limit = 1`, which is worth keeping on
   every future test link.

**Open, not blocking.**

7. **`bg-verify` has never reviewed the binding.** It is billing code that is
   live and has taken real money. No agent was spawned because none was asked
   for.
8. **Add `invoice.paid` to the webhook** when custom offers stop being one offs.
   That is what makes step 4 unnecessary.
9. **Stripe Tax as its own project**, only after step 2. Test a Canary Islands, a
   Romanian and a US address before it touches a customer, and resolve the
   documentation contradiction empirically.
10. **The silent admin plan change** (section 2). Reproduce with DevTools open on
    the `set-client-plan` call.
11. **Send the Ai Fy email.** Re-run `--self-test` first, the template changed.
12. **A dedicated `unsubscribe@getbrandgeo.com` alias.** The opt-out currently
    points at `constantin@getbrandgeo.com` because that address is PROVEN to
    receive. Create the alias, then switch the constant. Not before: an opt-out
    that bounces is worse than no button.
13. **DMARC `rua`** still points at `constantin@talentwelove.com` with no
    cross-domain authorisation, so BrandGEO has never received an aggregate
    report. Carried over from 2026-08-01, still true, checked by DNS today.

**Rules that bit this session, do not relearn them.**

- Commit per task; a push touching `brandgeo-dashboard/` costs a build. Check
  with `.\scripts\deploy-status.ps1` first. `BATCH_PUSH=1` is the deliberate
  override.
- Never rewrite source files with PowerShell string operations.
- A checker is worthless until it has been observed to fail.
- Verify commits by content, never by sha. Other sessions rebase `main`.
- Use `git commit -F <file>` and `git commit -- <paths>`.
