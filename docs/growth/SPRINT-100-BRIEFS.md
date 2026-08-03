# SPRINT-100 morning briefs

Appended daily by the 03:00 council cycle (`SPRINT-100-DAILY-COUNCIL.md`).
Newest entry at the bottom. Each entry is readable in under two minutes.

---

## 2026-07-31, Day 0 (pre-sprint)

Baseline entry, written at setup, not by the cycle. Sprint window opens
2026-08-01. Registry, plan, protocol and scoreboard scaffolding are in
place; S1 to S15 all OPEN. First real brief lands 2026-08-01 03:00.

---

## 2026-08-02, Day 2 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** No
numeric gate is due until Day 5, but the instrument that will prove or
disprove that gate does not exist yet, one day after the plan called for it.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` does not exist (`test -f` fails). S9
  is still OPEN in the registry, unchanged since 2026-07-31. No baseline
  paying-subscriber count or MRR number was ever captured, so this cycle has
  no prior row to compare Day 1 against.
- Re-ran three checks behind recent DONE/shipped claims, all still pass, no
  regression: `sprint-ladder-ruling.md` carries 5 `DECIDED 2026` lines plus
  the separately-keyed `DECIDED 1b` line (S1's own criterion, met);
  `node brandgeo-dashboard/tests/package_provisioning.test.js`, 63 checks
  passed, exit 0; `scripts/check-funnel-accept-path.sh` and
  `scripts/check-contract-gate.sh`, both exit 0. The contract-gate check
  only exercises `_terms_gate.js` in-process (it deliberately simulates
  `STRIPE_CHECKOUT_LINKS` unset as one of its own test cases); it does not
  reach the live site, so it cannot confirm whether production checkout
  (reported DOWN in the registry as of 2026-07-31, blocked on a redeploy) is
  actually fixed yet.
- No network route from this environment to `getbrandgeo.com` or
  `app.getbrandgeo.com` (curl exit 56 on both), so live checkout status,
  mail-tester score, DNS records, and the GBP correction are all
  UNVERIFIABLE HERE.
- Day 1's commits (`a988fec` and ten others, all 2026-08-01) were CSA-seat
  registry work, brand-asset hosting, bilingual content BG-027 to BG-034,
  the Radar-announcement post, and infra/deploy fixes; none are outbound
  sends. Sends, DMs, replies, calls, audit runs, signups and new-paying for
  Day 1 have no source in the repo; they only exist once a chat is told to
  close the day.

**What the council changed:** no channel or cadence change. Every
pre-agreed trigger (reply rate under 5 percent, a CAC breach, a gate miss)
needs numbers that do not exist yet, and adapting on guesswork is exactly
what the protocol forbids. The one change made: Day 2's plan row now leads
with "S9 scoreboard + baseline capture, carried from Day 1, overdue" ahead
of S10/S6/S3/S12, so the instrument exists before Gate 1 needs it on Day 5.
Logged in `SPRINT-100-PLAN-30D.md`'s revision log, COO seat.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day" for 2026-08-01, and again
   tonight for 2026-08-02, so S9 gets built and the scoreboard's baseline
   row plus Day 1's real row get filled from Stripe/Supabase instead of
   staying blank.
2. Confirm whether production checkout is fixed: has `STRIPE_CHECKOUT_LINKS`
   been set in the Netlify UI (scoped to Functions) and has the site been
   redeployed since. S3's registry entry still reads BLOCKED/DOWN as of
   2026-07-31; if that is still true, no self-serve customer can pay right
   now, which outranks everything else on this list.
3. Create the Sentry account for S13, steps already written in that
   kickoff; it is blocked purely on this one action.

**Risks and unverifiables:** the sprint has now run a full day with zero
recorded acquisition data; a second missed day leaves Gate 1 (Day 5) with no
baseline to compare against. Live checkout, mail-tester/DNS, and GBP status
are all UNVERIFIABLE HERE (no network egress to either live domain from this
environment). `brandgeo-dashboard/node_modules` was absent and had to be
installed this session before any check would run; a future night session
should expect the same unless it gets committed or cached.

---

## 2026-08-03, Day 3 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** No
numeric gate is due until Day 5. Two instrument-health problems, not a
glidepath breach: the scoreboard is still missing (3rd consecutive day) and a
billing regression test check has flipped from pass to fail overnight.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` still fails `test -f` — missing for
  a third straight day (Day 1, Day 2, and now Day 3). S9 is still OPEN.
- Re-ran every S-task check for items marked DONE in the last 3 days.
  `sprint-ladder-ruling.md` (S1): still 5 `DECIDED 2026` lines + 1
  `DECIDED 1b`, no regression. `check-funnel-accept-path.sh` and
  `check-contract-gate.sh` (S3): both exit 0, no regression (yesterday's
  `contract-gate` failure was `node_modules` missing in this sandbox, not a
  real fault; reproduced and confirmed the same today, then fixed with
  `npm install` in `brandgeo-dashboard/`).
- **Regression: `node brandgeo-dashboard/tests/package_provisioning.test.js`
  (S10's harness) now exits 1.** 62 of 63 checks pass, then it crashes on
  `assert.match(hook, /\.select\('plan_grant_until, plan_source'\)/)`.
  Root cause, confirmed via `git show 13bb92d`: `stripe-webhook.js:492`
  legitimately grew a third column, `.select('plan_grant_until, plan_source,
  stripe_customer_id')`, shipped 2026-08-02 for the package-can-name-its-
  client feature. The test's exact-string assertion was never updated to
  match. `cur?.plan_source`/`cur?.plan_grant_until` are still read two lines
  later, and the new `scripts/check-package-client-binding.js` (9/9, tests
  the same branch behaviorally, not by source regex) is clean — this reads
  as a stale assertion, not a functional break, but that is unconfirmed
  until a day session fixes the regex and gets a clean 63/63. Logged on
  S10's registry row.
- `scripts/check-seo-audit-path.js` (23/23) and
  `scripts/check-social-channel-override.js` (25/25), both shipped
  2026-08-02, re-run clean, no regression.
- No network route from this environment to `getbrandgeo.com` or
  `app.getbrandgeo.com` (curl exit 56, same as yesterday), so live checkout,
  mail-tester/DNS, and GBP status stay UNVERIFIABLE HERE. Notably,
  `CLAUDE.md` CURRENT STATE (2026-08-02) states checkout was fixed and
  verified end to end on the new Spanish Stripe account (a live
  `accept-terms` POST returned the new account's link), which would mean
  S3's registry line still reading "checkout is DOWN" is stale — but that
  claim comes from a different session's live check, not one this cycle
  could reproduce, so the registry row was deliberately left unedited per
  the ground-truth rule (no state change without this cycle's own check
  output). Needs day-side confirmation.
- Day 2's commits (2026-08-02, ~30 of them) were the Stripe account
  migration to Spain, the affiliate program (S20), SEO/content fixes, and
  the client-naming billing feature — no outbound sends, DMs, or signups
  have any source in the repo; those only exist once a chat is told to
  close the day.

**What the council changed:** no cadence or channel change; no measured
trigger exists to justify one. Day 3's plan row now leads with "S9
scoreboard + baseline capture, STILL overdue" ahead of S2/S4/S12, per the
same COO-seat rule applied on Day 2 (the instrument keeps bubbling to the
top of the plan until it's built). Logged in `SPRINT-100-PLAN-30D.md`'s
revision log.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day" for 2026-08-01, 08-02, and
   08-03 so S9 finally gets built and three days of scoreboard rows (plus
   the baseline) get filled from Stripe/Supabase instead of staying blank.
   This is now blocking Gate 1 on Day 5.
2. Have a day session fix `package_provisioning.test.js`'s stale
   `.select('plan_grant_until, plan_source')` regex (now three columns) and
   confirm 63/63 passes again — S10's revert-gate proof is unverifiable
   until this is clean.
3. Confirm live whether `getbrandgeo.com` checkout is actually fixed (per
   CLAUDE.md's 2026-08-02 claim) or still down (per S3's registry line);
   whichever it is, update the S3 registry row with the live check output,
   since the two currently disagree.
4. From yesterday, still open: confirm `STRIPE_CHECKOUT_LINKS`/Netlify
   redeploy status if not covered by item 3, and the Sentry account for S13.

**Risks and unverifiables:** scoreboard down 3 days running, Gate 1 (Day 5)
has no baseline to compare against if this continues. Live checkout,
mail-tester/DNS, and GBP status stay UNVERIFIABLE HERE (no network egress).
S10's harness cannot currently prove its own closed items stay closed.
