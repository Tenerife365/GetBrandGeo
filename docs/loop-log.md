# loop-log.md

One entry per orchestrator cycle. Newest first. Kept short on purpose: the
morning read is this file plus NEEDS CONSTANTIN in `ROADMAP.md`, and both are
meant to take under two minutes together.

---

## 2026-07-31 07:20 — cycle 1 (day window, attended, run inline)

Run on request rather than on the schedule, so the 21:17 task was disabled to
avoid a collision and needs re-enabling for tonight.

**Attempted:** B1 (logo destinations).
**Checks passed:** 1. **Checks failed:** 0. **Commits:** `b130bf6`.

Found the fix already written and never committed, so `check-logo-links.sh`
passed against the working tree while production still served four inert
logos. Committed, typechecked, built, pushed.

Two things worth carrying forward:

1. **A check that reads the working tree can pass while production is broken.**
   Future cycles should confirm a fix is in `HEAD`, not just on disk. This
   nearly produced a false Done on the first item of the first cycle.
2. **The check was weaker than the item.** It proved each logo links somewhere;
   B1 asked that it link to the right place. Reading the call sites by hand
   found B1a, which the script cannot see. When a check is cheaper than the
   claim it is standing in for, say so rather than trusting it.

**Corrected during the cycle:** the night window in `AUTONOMY.md` §3 assumed a
timezone that turned out to be wrong. Real local time was 07:19 when the cycle
believed it was evening. Schedules need re-deriving from a confirmed offset.

**NEEDS CONSTANTIN:** re-enable `brandgeo-night-cycle`; confirm the UTC offset;
decide B1a.

---

## 2026-07-31 08:5x — cycle 2 (day window, attended)

**Attempted:** B1a + logo completeness, AI Overviews scoring, A1 package payments.
**Checks passed:** 4. **Checks failed:** 0.
**Commits:** `14e0b26`, `a55eec4`, `19449ad`.

AI Overviews was the one that was costing money. Google renders an overview
for some queries and not others; the empty case arrives as `status='ok'`,
`brand_mentioned=false`, indistinguishable from a real absence. Production on
BpR: 3 of 6 `ai_overview` rows were unanswerable, so the client was shown 33%
where the true rate was 67%. Exactly half.

The exclusion already existed, inlined in `AIVisibility.tsx` and nowhere else,
so that page and the Overview headline reported different numbers for the same
client at the same instant. Now shared in `buildScoreResultMap`.

A1 was built by `bg-backend` and reviewed by `bg-verify`, PASS WITH FINDINGS.
Shipped with a named gate rather than silently: S1 (an existing subscriber who
buys a package gets reverted while Stripe keeps charging) must close before the
first grant date. `MIN_PACKAGE_MONTHS = 1` is what buys that runway.

Carried forward, third instance in one day of the same failure shape:

3. **Work that exists but never reaches where it is needed.** The logo fix was
   written and never committed. The AI Overviews exclusion was written in one
   of two places. Dashboard's score query would have omitted the one column the
   new predicate reads, making the whole fix silently inert. None of these are
   logic errors and none would fail a build. Cycles should ask "does this reach
   production, and does it reach every consumer" as a separate step from "is it
   correct".
4. **The reviewer could not check its own scope.** `bg-verify` runs no git, so
   it could not confirm which files actually changed. The orchestrator must
   close that gap with `git status` every time, not assume the builder's list.

---

## 2026-07-31 10:0x-11:1x — cycle 3 (day window, attended)

**Attempted:** prior-cycle re-checks, the uncommitted dashboard work, roadmap
correction, C1.
**Checks passed:** 6. **Checks failed:** 1 (askmywebsiteai, vendor side).
**Commits:** `46b92fc`, `67a3cf4`, plus this one.

Prior claims all still hold: `check-logo-links.sh` 0, the A1 webhook guard 0,
the package harness 63 checks 0.

**Nine dashboard files had been sitting uncommitted since 2026-07-30**, so
production served none of the light-mode contrast work. Found by running
`git status` while reporting queue state, not by any check, because no check
covers it. Shipped as `46b92fc` and verified live by md5 against the served
bundle, not by trusting Netlify.

**Four roadmap entries claimed open work that was already done** (A1-S1/S6/S2/S3
by `3c3f003`, B1a by `14e0b26`). That is the 2026-07-29 wasted-cycle shape,
regrown in two streams inside four days. Corrected in place rather than deleted.

**The UTC offset was wrong by two hours.** The machine is `+01:00` GMT Standard
Time, not Europe/Bucharest `+03:00`. Night window is 19:00-06:00 UTC. Every
schedule in `.claude/` needs re-deriving before the night cycle is re-enabled.

**C1 found the acquisition funnel does not connect.** The full audit report is
built, deployed, working and unreachable: no email is ever sent, and the widget
does not link to the report it just unlocked. `redirectToSignup` is called only
on the FAILURE path, so a failing audit converts better than a succeeding one.
Zero real leads in 22 days; the only lead row is BrandGEO auditing itself.

Carried forward:

5. **A staleness claim about production must be measured against production.**
   The BpR ChatGPT refresh was closed with no spend: every active prompt was
   already fresh, and the stale rows belonged to two inactive prompts. Two
   NEEDS CONSTANTIN items dissolved on measurement this cycle rather than being
   worked.
6. **Report what the code does, not what the item says it does.** C1's premise
   named a "Book a call" CTA that does not exist anywhere in the repo. The
   conclusion drawn from it was still correct, which is exactly why inheriting
   the detail would have been easy and wrong.

**NEEDS CONSTANTIN:** re-derive the `.claude/` schedules for +01:00; create the
Sentry account so B4 can be wired; say whether the C1a handover fix ships today.
