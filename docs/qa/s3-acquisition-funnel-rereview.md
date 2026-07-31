# PASS WITH FINDINGS

Re-review of S3 in whole, six commits, all pushed and live:
`660569a`, `fc97dbc`, `667099a`, `1741672`, `de645ae`, `167bac2`.
Supersedes the `FAIL` in `docs/qa/s3-acquisition-funnel-contract-gate.md`, which
keeps the detail and is not restated here.
Reviewer: `bg-verify`. Date 2026-07-31. Livemode Stripe, no test mode.

The verdict moves because my block was specific and is satisfied. It was "do not
record C3 as done"; C3 is now recorded as partly done with the exposure named,
in three places, one of which says the earlier commit message was wrong. It was
never "close the hole", which I agree is Constantin's call on a livemode account.
D1 is fixed and the replacements are traceable. F1 is closed with the assertion I
asked for and it negative-tests.

It does not move to `PASS`, for four reasons, one of which is a regression the
remediation introduced on the provisioning path.

---

## 1. Verification run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0, built in 11.28s |
| `scripts/check-contract-gate.sh` | `OK`, exit 0 |
| `scripts/check-funnel-accept-path.sh` | `OK`, exit 0 |
| F1 negative test (independent) | skewed `site.js` to `2026-09-01` in a `git archive` copy of HEAD: `FAIL: TERMS_VERSION disagrees: _terms_gate.js says 2026-07-13, brandgeo/web/site.js says 2026-09-01.` Caught. |
| `terms_acceptances.stripe_session_id`, `matched_email`, `matched_at` | present in production, `text/text/timestamptz` |
| Secret scan on `1741672..HEAD` | no values |

`grep -oP` in the new step 4 does resolve on this Git Bash (PCRE present), so the
script is not silently failing open here. Worth knowing that it would `note` and
fail rather than pass if it were absent on another machine, which is the right
direction.

---

## 2. The window when the FAILED version was live

**No buyer could have been harmed, and this is measured, not assumed.**

```
acceptances_total     0
matched               0
latest_acceptance     null
stripe_events_total   0
clients_created_3d    0
admin_events_all      1   (latest 2026-07-23 09:01, unrelated, predates S3)
checkout_without_acceptance  0
audits_3d             0
paying_clients        34
```

Nothing transacted. No checkout reached the webhook, no client was created, no
acceptance was recorded, and no audit was even run in the window. Your live
`accepted:false` probe returning 403 with no URL leak establishes the endpoint
was deployed, which is the other half: the F2 outage I flagged did not occur
either, because the Netlify side was already up when the cPanel side landed. The
hazard was real; this release got the lucky ordering.

**What that same table says, and it matters more than the window.**
`terms_acceptances` is at 0 and `stripe_events` is at 0. **The gate has never
been exercised end to end in production, and `checkContractAcceptance` has never
run against a real Stripe event.** Every claim about the webhook path in both
reviews, mine included, is from reading and from isolated execution. The first
real purchase is the test.

**What to check in production rather than assume**, in order:

1. **After the first real subscription**, confirm exactly one
   `terms_acceptances` row has `matched_at`, `stripe_session_id` and
   `matched_email` set, and that no `checkout_without_acceptance` event was
   raised alongside it. That single observation validates
   `withReference` → Stripe → `session.client_reference_id` → the lookup, four
   hops that have only ever been reasoned about.
2. **Confirm `client_reference_id` actually survives the Payment Link.** Appending
   it as a query parameter to a `buy.stripe.com` URL is documented behaviour, but
   it has not been observed on this account. If it does not survive, every
   legitimate purchase raises `checkout_without_acceptance` and the detection is
   worse than useless, because it will train you to ignore the alert.
3. **Record the deploy sequence for next time** (F2, unchanged): Netlify first,
   verify a 403 from an unaccepted POST, then cPanel. It is not written down
   anywhere I can find, and the next terms update needs it more than this release
   did.
4. Nothing to check about the FAILED window itself. It is closed and empty.

---

## 3. New findings from the remediation

### N1 — MEDIUM-HIGH. The acceptance check CAN interfere with provisioning, by timeout.

You asked directly whether it can interfere in any path. It can, in one, and it
is the same path that fires spuriously in N2.

`stripe-webhook.js:201` awaits `checkContractAcceptance` **before**
`listLineItems` and before every provisioning branch. On the no-acceptance path
that function calls `recordAdminEvent` (`:473`), which defaults to `email: true`
(`_admin_notify.js:27`), which calls `sendBrandedEmail`, which does a plain
`fetch` to Resend at `_email.js:75` with **no timeout and no AbortController**.
`netlify.toml:107-108` gives `stripe-webhook` a **15s** ceiling.

The chain: Resend hangs → the handler is killed by the platform at 15s → the
`catch` at `:140` that deletes the idempotency row **never runs, because a
platform timeout is not a JS throw** → Stripe retries → the row inserted at
`:118` is still there → `23505` → `:124` returns 200 `duplicate, already handled`
→ **the customer is never provisioned, and `reportUnprovisionedPackage` never
fires either**, so nothing tells you.

Your reasoning that it "cannot throw" is correct and I verified it:
`recordAdminEvent` catches the insert (`:30`) and the send (`:42`) separately, and
`checkContractAcceptance` wraps the lot. But not throwing is not the same as not
blocking, and blocking is what the 15s budget cannot absorb. This is a
regression: before `de645ae`, every `recordAdminEvent` call in this handler sat
on a terminal path (`:179`, `:193`, `:223`, `:236`, `:353`, `:375`, `:409`) where
nothing downstream was waiting. `:201` is the first one placed in front of
provisioning.

**Fix, smallest first.** Pass `email: false` in the `recordAdminEvent` call at
`stripe-webhook.js:473`. The feed row is what makes the bypass visible; the email
is what puts an unbounded third-party fetch on a money path. Separately, and
worth doing on its own, give `_email.js:75` an `AbortController` at 5s, since
every other caller of it inherits the same exposure on a longer leash.

### N2 — MEDIUM. The admin event fires on legitimate purchases, with text that is wrong for them.

You asked whether it can be triggered spuriously. Yes, structurally, in at least
two classes.

**Package purchases, every time.** `handleCheckoutCompleted` handles
`mode: 'payment'` as well as `'subscription'` (`:160-165`). Package links are
created by hand in the Stripe dashboard, as `:182-190` instructs, so they carry
no `client_reference_id` and cannot: `_terms_gate.js`'s `CHECKOUT_LINKS` knows
only the three subscription tiers. So **every package sale raises
`checkout_without_acceptance`** plus an admin email.

**Anything not self-serve.** The check at `:201` runs before plan resolution at
`:241` (`!SELF_SERVE_PLANS.includes(plan)`), so a Managed or Enterprise checkout,
or a purchase on one of the four previous payment links that the removed `site.js`
comment says are still active in Stripe on purpose, all raise it too. None of
those were ever eligible for the gate.

The comment at `:198-200` says the placement lets it "observe every checkout that
will be acted on". It observes more than that: it observes every checkout that
got past two early returns, which includes checkouts the gate was never meant to
cover.

Worse than the noise is the body text at `:476-480`, which asserts to the reader
that "a live Stripe payment link was used directly, which is possible because the
links are published in the public repository". For a package sale or a Managed
sale that is **false**, and it is the kind of false that sends someone rotating
links in response to a purchase that was fine.

**Fix.** Gate the event on the case it is actually about: skip when
`mode === 'payment'`, and move the call to after the plan resolves so it only
covers `SELF_SERVE_PLANS`. Then soften the body from an assertion to a question,
naming the possibilities rather than picking one.

### N3 — LOW. The 4s busy release can double-record an acceptance.

`site.js:849-856` releases `busy` and re-enables Continue 4s after a successful
navigation is initiated. The fix for F3 is right and the reasoning is right. The
side effect: a Stripe page that takes longer than 4s to paint leaves a live
"Continue to payment" button in front of a visitor who is already navigating. A
second click posts again, writes a second `terms_acceptances` row, and issues a
second URL. Only one can ever match a session.

That undercuts the reading the migration header now relies on: "All NULL means
the acceptance never led to a payment, which is the ordinary state of an
abandoned checkout and not a fault." After a double click, an all-NULL row also
means "the same buyer, counted twice". Not harmful, but the column comment is
now slightly wrong and the count of acceptances stops being a count of buyers.

**Fix.** Leave `busy` set and instead attach the release to `pagehide` /
`visibilitychange`, or keep the 4s timer but leave `continueEl` disabled and only
re-enable Cancel, so the panel is escapable without being re-submittable.

### N4 — MEDIUM. The free tier this funnel now routes to cannot finish its first collection.

Not introduced by S3, but S3 is what makes it the primary path, and it is
disclosed in `docs/ROADMAP.md` inside this same push:

> "5 prompts at EUR 0.108 of ChatGPT is **EUR 0.540 against a EUR 0.30 budget**,
> so `_auth.js:checkCollectionLimits` blocks after prompt 3 and the visitor sees
> a raw budget error where the product promised 5."

I confirmed the two constants and the gate independently: `planConfig.ts:445`
`PLAN_PROMPTS.free = 5`, `planConfig.ts:317`
`PLAN_MONTHLY_API_BUDGET_EUR.free = 0.30`, and `_auth.js:174`
`checkCollectionLimits(...) -> { blocked, reason?, message? }` is a real budget
gate, not advisory. I did **not** re-derive the €0.108 per-prompt figure; the
arithmetic is yours and is what the conclusion rests on.

The consequence for this change specifically: D1 was fixed by pointing the copy
honestly at a free account, and the copy is now accurate. The destination is not.
Every high-intent visitor the new forward step captures now lands on a tier that
errors out two thirds of the way through the thing it just promised. This is the
standing "free-tier activation has been silently broken before" pattern, present
again, and I am recording it against S3 because S3 is what aims traffic at it.

**Fix.** Not S3's to make. It is decision 1b plus the budget constant, already
owed in the sprint board. But **S3 should not be closed while its own funnel
terminates in a budget error**, and whoever closes S3 should say so.

---

## 4. Findings from the first review, restated

| # | Status |
|---|---|
| S1 payment reachable, webhook blind | **Half closed, honestly.** Detection built and works by construction; the hole is untouched and now correctly labelled. Rotation remains open and is Constantin's. |
| S2 `accept-terms.js` unauthenticated, origin-optional, unrate-limited | **Open, unaddressed.** `accept-terms.js:38` unchanged. With `terms_acceptances` at 0 rows the flood risk is theoretical today, and the table is exempt from every retention job by design, so it stays worth closing. |
| S3 null-body crash | **Open, unaddressed.** `accept-terms.js:44` unchanged. |
| F1 three copies of `TERMS_VERSION` | **Closed.** Asserted and negative-tested. |
| F2 deploy ordering | **Not triggered this time.** Still unwritten. See §2 item 3. |
| F3 gate locks itself open | **Closed**, with N3 as the new edge. |
| D1 untraceable free-tier claim | **Closed.** See §5. |
| D2 "a copy is recorded" | **Open, unaddressed.** `site.js` still says it; still only a date string is stored and there is still one un-versioned `terms.html`. |
| D3 carried domain has no expiry | **Closed.** 24h envelope, backwards-clock guard, expired entries removed rather than ignored, unparseable treated as absent. This is a better fix than the one I described. |
| A3 no focus trap | **Closed.** `site.js:795-822`. Re-runs `querySelectorAll` on every keydown, so Continue enters the cycle when it enables; `button:not([disabled])` correctly excludes it while disabled; `!gate.contains(document.activeElement)` recovers focus from outside. Reviewed by reading, not in a browser. |
| A1 ghost-button border 1.50:1 | **Open**, unchanged, still minor. |
| P1 no handoff packet, P2 builder edited `docs/qa/` | **Unchanged.** |

---

## 5. Are the replacement claims traceable? Yes.

- `site.js:308` "start a free account for {domain}" — states the tier, promises
  nothing about frequency or coverage. Traceable to the destination itself.
- `Signup.tsx:112` "See how AI answers name you, and add engines when you are
  ready" — "add engines" is true and specific: `planConfig.ts:54-57`, free is
  `['chatgpt']` and every paid tier is a superset.
- `AuditReport.tsx:313` "Want to keep track of this, and work through each gap?"
  — vague enough to be true of the free tier, which does show gaps.
- `AuditReport.tsx:325` "Free to start, no credit card. For every engine,
  automatic refreshes and fix recommendations, see the plans." — this is the good
  one. It moves the continuous claim onto the line that leads to the thing that
  delivers it, which is exactly the right repair, and "automatic refreshes"
  traces to `refresh_cadence` being non-manual only on paid tiers.

No new untraceable claim. The one qualification is N4: the claims are honest
about what the free tier *offers*, and the free tier does not currently *deliver*
its five prompts.

## 6. Do the doc corrections read honestly to a cold reader? Yes.

I read `docs/ROADMAP.md`, `CLAUDE.md` and the sprint board as someone who had not
seen my report. The ROADMAP entry does the three things that make a correction
real: it states the residual in concrete terms ("permanent, reusable, and enough
on their own to pay"), it names what would actually close it ("rotating the six
links, and keeping the replacements in env vars"), and it says the previous claim
was wrong rather than quietly restating ("an earlier commit message here claimed
the gate was real and it was not"). Attributing it to `bg-verify` returning FAIL
is the part that makes it auditable later.

One gap: none of the three says the webhook detection **has never fired against a
real event**, and `checkout_without_acceptance` reads, to a cold reader, like a
working alarm. Add one line: it is untested in production until the first real
purchase.

## 7. The two grep evasions I would not close

You are right to have left them, and I would not spend the cycle.

String-concatenating the URL past the literal grep, and renaming `STRIPE_LINKS`,
are both unfalsifiable in a grep-based check in the general case: anyone who
wants to smuggle a URL past a text search can. But the threat model here is not
an adversary, it is a future contributor doing the obvious thing, and the obvious
thing is to paste the URL literally. The literal grep catches that, which is the
case worth catching, and the map-name check is largely redundant with it.

The robust version of this check is not a grep at all. It is the webhook-side
detection you just built, plus rotation: once a payment that skipped the gate is
visible in `admin_notifications`, it stops mattering how the URL got into a page,
because you find out either way. That is the better place to spend the next hour,
not on a cleverer regex.

Two things in the script that *are* worth an hour, in order:

1. **Step 3 never exercises the allow path.** It invokes the handler with four
   refusals, which closes the evasion I named, and it is a real improvement. But
   an `accept-terms.js` that returns the URL **without** inserting the row still
   passes every assertion, and that is the exact failure the endpoint exists to
   prevent. It cannot be tested without a database, so the honest move is a
   comment in the script saying so, rather than leaving a reader to assume the
   allow path is covered.
2. **Nothing asserts the webhook consumes `client_reference_id`.** The whole S1
   remediation is one function that no check script mentions. A grep for
   `client_reference_id` in `stripe-webhook.js` would at least fail loudly if
   someone refactored it away.

---

## 8. What was not checked

1. **The webhook has never been run**, here or in production. `stripe_events` is
   empty. N1 and N2 are reasoned from source and from `netlify.toml`, not observed.
2. **No Stripe API call was made.** Whether `client_reference_id` survives a
   Payment Link on this account is unverified. §2 item 2.
3. **The focus trap was not exercised in a browser.** I read it and traced DOM
   order; I did not press Tab. Your in-browser verification is the only evidence
   that exists for it and I am relying on it.
4. **No live call to `accept-terms.js` in production.** The script's invocation is
   in-process and stops before the Supabase client is constructed.
5. **The €0.108 ChatGPT per-prompt figure in N4 is not mine.** I confirmed the
   two constants and the gate; the arithmetic between them is from `docs/ROADMAP.md`.
6. **`docs/strategy/sprint-ladder-ruling.md`** (796 lines) was read only where it
   intersects the free tier. It is S1's artifact, not S3's.
7. **Light mode** on `AuditReport`, `Signup`, `Welcome` remains UNAUDITED.
8. **The email round trip** `signupDomain.ts` exists to survive, including the new
   24h envelope's behaviour across it, was not performed.

---

## 9. Open list

Blocking nothing, since it is live. Ordered by what I would fix first.

1. **N1.** `email: false` at `stripe-webhook.js:473`. One argument, removes an
   unbounded third-party fetch from in front of provisioning.
2. **N2.** Skip `mode === 'payment'`, move the call after plan resolution, soften
   the body text from an assertion to a question.
3. **N4.** Free-tier budget vs 5 prompts. Not S3's, but S3 should not be marked
   closed while its funnel ends in a budget error.
4. **S2.** Require the `Origin` header and rate-limit `accept-terms.js`.
5. **S1 residual.** Rotate the six links, replacements in env vars. Constantin's.
6. **§6 gap.** One line in the docs saying the detection is untested in production.
7. **D2, S3(null body), N3, A1.** Small, and none of them is urgent.
