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

## 2026-07-31 14:0x — cycle 4 (day window, attended): the build was red for 4 hours

**Trigger:** Constantin pasted the Netlify history. Three Failed, three Canceled.

**Root cause:** `6d2196c` widened `featureUnlockPlan` from `Plan` to `Plan | null`
and added `ADMIN_ONLY_FEATURES`, without updating `FeatureLocked.tsx`, the only
consumer that indexes `PLAN_LABELS[plan]` with the result. Two TS2538 errors,
`tsc` exits 2, so `npm run build` fails.

Bisected by typechecking each commit from a clean `git archive`, not from the
working tree:

```
08514dd CLEAN   46b92fc CLEAN   b9d8a43 CLEAN   6d2196c FAILS   ff7cae3 FAILS
```

Fixed in `0bdb1d5`. Netlify deploy `6a6ca9a3` is `ready`, `error_message: null`,
57s, 76 functions, `commit_ref 0bdb1d5`.

Four things worth carrying, because the interesting part is not the type error.

7. **The Canceled rows were correct and the Failed rows were one bug, not
   three.** Netlify's `CACHED_COMMIT_REF` only advances on a SUCCESSFUL build,
   so every push after `6d2196c` re-diffed against the last good commit, rebuilt
   the same broken tree, and failed again. A docs-only commit appeared to fail
   the build. Do not debug the newest red build; find the first one.
8. **Production was never down.** It served the last good build (`46b92fc`) and
   silently ignored everything after. A red pipeline here does not page anyone,
   it just quietly stops shipping. Nobody noticed for about four hours.
9. **A green local build is not evidence.** `npm run build` passed on the
   working tree at the same commit where a clean checkout failed, because
   uncommitted work on disk supplied the fix. This is the working-tree trap from
   cycle 1 wearing different clothes, and I walked into it: my own build check on
   `46b92fc` was green for exactly this reason, even though that commit happened
   to be innocent.
   **Build from `git archive <sha>`, not from the tree, before believing green.**
10. **Fifth instance in three days of work that exists and never reached git.**
   The correct fix was already written in the working tree, matching what
   `6d2196c`'s own docstring asked for. It had simply never been committed.

**NEEDS CONSTANTIN:** nothing new from this cycle. The preventive worth adding
is a clean-checkout build check; filed in ROADMAP Stream B.

---

## 2026-08-01 07:4x-08:5x — cycle 5 (night window, unattended)

**Attempted:** prior-cycle re-checks, B2, B3. B4 not attempted (blocked on a
Sentry account, per the task brief). B1/B1a not attempted (closed and verified).
**Checks passed:** 6. **Checks failed:** 0. **Commits:** `80cd484`, `22e38af`.
**Not pushed, deliberately. See below.**

Prior claims all still hold: `check-logo-links.sh` 0, `check-funnel-accept-path.sh`
0, `check-contract-gate.sh` 0, `package_provisioning.test.js` 63 checks 0, and
`refresh_cadence.test.js` 17 assertions 0 (that last one is untracked, worth
committing by whoever owns it).

**B2 found nothing broken, and that is a real result rather than a weak one,**
because the check was made to fail first. `scripts/check-links.sh` did not
exist, so under the ground-truth rule B2 was unstartable; written first, then
run. It resolves three directions, not the one the item names: marketing to
dashboard routes against `App.tsx`'s Route table, dashboard to marketing against
files on disk, and internal `.html` links across all 84 marketing pages. Each
direction was deliberately broken and each break was caught by name.

**B3's premise was false, and the item's own check was the defect.** The
greeting reads `new Date().getHours()`, which is local, and it is the only
greeting in the repo. No UTC path exists, and no offset produces "Good evening"
at 11:30 anyway. Nothing was fixed. The roadmap's check grepped for
`getTimezoneOffset|toLocaleTimeString`, asserting an implementation rather than
behaviour, so the only way to make it pass was to add code that does nothing.
Replaced with a behavioural check and mutation-tested.

Carried forward:

11. **A check can be wrong in the other direction: it can demand a fix that is
   not needed.** Cycle 1 recorded checks weaker than their claim. B3 is the
   mirror: a check strong enough to pass only if you write dead code. Both come
   from writing the check against an imagined implementation instead of the
   behaviour the item actually asks for. When a check fails, first ask whether
   the check or the code is wrong.
12. **Two matches in B2 were false positives and were fixed in the matcher, not
   filed as findings.** A URL ending an English sentence carried the full stop
   into the match; `site.js` builds function endpoints from a base URL ending in
   a slash. A cycle that had reported those as broken links would have spent the
   next cycle "fixing" working code.
13. **Git was not serialized and the loop was not the only writer.** A second
   session committed to `main` twice DURING this cycle and is holding
   uncommitted work in `brandgeo/web/index.html`. That edit was inspected before
   anything was staged, and left alone. Every commit here was path-scoped to the
   exact files written.

**Nothing was pushed.** `main` is 7 ahead and 7 behind `origin/main` (local:
email sender, AI SEO cap, keyboard nav; origin: content articles BG-020 to
BG-026). The two sets look disjoint and would probably merge cleanly, but
merging a diverged branch against a dirty tree while another committer is live
is what corrupted `.git/index` before (CLAUDE.md §6.5). Filed under NEEDS
CONSTANTIN with the exact sequence rather than attempted at 3am.

**NEEDS CONSTANTIN:** resolve the `main`/`origin/main` divergence once the other
session is finished; create the Sentry account so B4 can be wired.

---

## 2026-08-01 22:50-23:00 — cycle 6 (night window, unattended)

**Attempted:** re-run of prior checks, B2/B3/B4 status re-check per the task
brief, the packet-id-006 hygiene item from Carried Over. **Checks passed:** 7
(5 script/test checks re-verified with no regression, plus the new dedup
check, plus the resolved-divergence check). **Checks failed:** 0. **Commit:**
this cycle's, pending below. **Not pushed** — see below.

**No new build work this cycle.** Every candidate the task brief named was
already closed by cycle 5 (B2, B3) or is genuinely blocked (B4: no Sentry
account, no confirmation `VITE_SENTRY_DSN` exists in Netlify — the brief is
explicit this must not be attempted without that confirmation). Everything
else on the board is Stream A/C, tagged `day-only` because it is billing or
customer-facing copy, so this cycle correctly found little to build and spent
its time on verification and one piece of hygiene instead of manufacturing
work.

**Re-verified, no regressions:** `check-logo-links.sh`, `check-links.sh`,
`check-greeting-clock.sh`, `check-funnel-accept-path.sh`,
`check-contract-gate.sh`, `package_provisioning.test.js` (63 checks),
`refresh_cadence.test.js` (17 assertions). All exit 0, same as claimed.

**Found and closed: the packet-id-006 collision** flagged in `CLAUDE.md` and
carried in ROADMAP's "Carried over" section with no check command. Wrote one
(`grep -h "^id:" .claude/handoffs/*.md | sort | uniq -d`, empty means clean),
confirmed it failed first (two files both read `id: 006`), then renamed
`006-bg-orchestrator-to-bg-verify-deploy-cpanel.md` to `014-...md` (next free
id) and updated its frontmatter. Mechanical, done directly, no agent spawned
per AUTONOMY §7.6.

**Found: two architecture docs the roadmap still listed as open already exist
and are committed.** `docs/arch/multi-site-tenancy.md` (D1, `08514dd`, 2,053
lines) and `docs/arch/custom-entitlements.md` (A2, `eee3f9a`, 141 lines) both
satisfy their literal `test -f` checks. Recorded in ROADMAP with an explicit
caveat: the check only covers the architecture stage, and both items' next
phases (`bg-verify` on the auth boundary, then backend build) are billing or
auth work and stay day-only. Not claiming D1/A2 closed, only that a future
cycle should not re-run `bg-architect` on a question already answered.

**A live collision was avoided, not caused.** 87 files under `brandgeo/web/`
(a CTA copy/link swap across every city and industry page) were modified and
unstaged when this cycle started, newest mtime 6 minutes old — an active
second session, not an abandoned one. The cycle left every one of those files
alone: no `git add`, no stash, no push, exactly the caution AUTONOMY §1 and
CLAUDE.md §6.5 ask for. By the time this cycle went to commit its own work,
the other session had committed and pushed them as `8bccdb3`, and
`origin/main` was fully caught up (`0` ahead, `0` behind — the 7/7 divergence
NEEDS CONSTANTIN had carried from cycle 5 is gone on its own). This cycle's
own commit is scoped to exactly the two paths it touched
(`.claude/handoffs/014-...md`, `docs/ROADMAP.md`) and nothing from the other
session's working tree.

**Not pushed.** Only docs and a handoff rename changed — zero
`brandgeo-dashboard/` files — so this push would cost nothing against the
Netlify build budget (AUTONOMY §7). Held anyway: the other session just
pushed moments ago and a second push run back-to-back is exactly the kind of
concurrent git activity the serialization rule exists to avoid, with no
benefit to landing docs-only changes at 3am over the next work block. Queued
for the next batch push.

**NEEDS CONSTANTIN:** nothing new. Create the Sentry account so B4 can be
wired (carried from cycle 5, unchanged).
