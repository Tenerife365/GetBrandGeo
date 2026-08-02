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
