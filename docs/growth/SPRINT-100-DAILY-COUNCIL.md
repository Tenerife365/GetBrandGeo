# SPRINT-100 Daily Council cycle

Runs unattended every day at 03:00 local (02:00 UTC) as a cloud routine
against this repo. Purpose: measure yesterday against the plan, adapt today
and the remaining days, and leave Constantin a two-minute morning brief. This
file IS the protocol; the routine's prompt points here so the protocol can be
improved by editing this file, not the schedule.

## Standing constraints, non-negotiable

1. `docs/AUTONOMY.md` binds this cycle. 03:00 is the NIGHT window: docs-only.
   The council may edit ONLY files under `docs/growth/` and the sprint
   registry's status board. It never edits code, copy that ships to
   customers, billing, schema, or anything under `brandgeo/web/` or
   `brandgeo-dashboard/`.
2. Never spend money (no collection runs), never send anything to anyone,
   never print or touch a secret, never create Stripe objects at night.
   Anything needing those goes into the morning brief as a day action.
3. The ground-truth rule: no claim without a command. If a check cannot be
   run in this environment (needs credentials, network, or a local build),
   it is reported as UNVERIFIABLE HERE, never assumed either way.
4. No em dashes, no en dashes, no AI buzzwords in anything written.
5. Do not invent scoreboard data. An empty row is a finding, not a blank to
   fill.

## Inputs, read in this order

1. `docs/AUTONOMY.md` (authority and windows)
2. `docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md` (registry: status board,
   Part A gates, Part C pre-agreed rules)
3. `docs/growth/SPRINT-100-PLAN-30D.md` (the plan and its revision log)
4. `docs/growth/SPRINT-100-SCOREBOARD.md` (the data; may not exist until S9)
5. `docs/growth/SPRINT-100-BRIEFS.md` (yesterday's brief, for continuity)
6. `docs/ROADMAP.md` NEEDS CONSTANTIN section (do not duplicate items into
   the brief that already live there; reference them)

## How the scoreboard gets its data (the day side)

Constantin never edits the scoreboard by hand. During the day he works inside
council chats, and the chats are the instrument:

1. Any BrandGEO session, when told **"close the day"** (or when a working
   session notices the working day ending), runs the capture: pull paying
   subscribers and MRR from the Stripe MCP (read-only, active subscriptions
   plus live package grants), pull the day's audit runs and signups from
   Supabase (read-only SQL on prospect_audits and clients), then ask
   Constantin ONE line for the manual numbers: sends, DMs, replies, calls.
   "0" and "skip" are valid answers.
2. The session writes the row in `SPRINT-100-SCOREBOARD.md`, adds the
   one-line note, commits docs-only and pushes.
3. A day chat that learns a number mid-day (a new paying customer, a booked
   call) may update the row incrementally; the close-the-day pass finalizes.
4. Fridays the capture adds the CFO reconciliation line (Stripe subscriptions
   vs clients.plan). Mondays and Thursdays it records whether the real-card
   rehearsal ran.

## The cycle, in order

1. **Re-verify before trusting.** For every S-task marked DONE in the
   registry status board within the last 3 days, re-run its check command
   if it is runnable here (test -f, grep, node scripts with no credentials).
   A check that passed and now fails is the number one item in the brief.
   List unverifiable checks explicitly.
2. **Measure yesterday.** Read yesterday's scoreboard row, written by the
   day-side capture above. Compare against yesterday's plan row (sends, DMs,
   new paying) and the glidepath. Classify the day: GREEN (on plan), YELLOW
   (one metric off), RED (glidepath breach per the plan's rule). If the row
   is missing, the capture did not run: derive what is derivable from the
   repo itself (commits, registry state changes, briefs), mark acquisition
   metrics UNVERIFIABLE HERE, hold cadence steady, and put "tell any council
   chat to close the day" first in ACTIONS FOR CONSTANTIN. A missing row is
   never treated as zero activity.
3. **Apply the pre-agreed rules, do not re-debate them.** From registry Part
   A and Part C: reply rate below 5 percent for 5 sending days = segment
   change, never volume increase. Gate misses trigger the gate's written
   response (Day 15 under 20 = Path 2 fallback). CAC above EUR 30 on a paid
   channel at the entry rung = cut at next gate. Deliverability unproven =
   cold waits, DMs compensate. Anything outside a pre-agreed rule is a
   RECOMMENDATION in the brief, decided by Constantin, not enacted at night.
4. **Adapt the plan.** Edit today's row and any future rows in
   `SPRINT-100-PLAN-30D.md` that the measurement invalidates. Never touch
   past rows. Append one revision-log entry per change: date, measured
   trigger, change, council seat whose rule drove it (CGO for channel EV,
   CRO for offer, COO for cadence, CFO for cost, CMO for message, CTO for
   product blockers, CSA for infrastructure and capacity breakpoints, seat
   defined in registry Part C-0).
5. **Update the registry status board** only where a re-run check proves a
   state change, quoting the check output.
6. **Write the morning brief.** Append to `SPRINT-100-BRIEFS.md` a dated
   section, readable in under two minutes, in exactly this shape:
   - Day N of 30, cumulative paying vs glidepath, one-line verdict.
   - What was measured (3 to 6 lines, numbers not adjectives).
   - What the council changed in the plan (or "no change, on plan").
   - ACTIONS FOR CONSTANTIN TODAY: numbered, exact, copy-pasteable where a
     command exists. Day-window items the night could not do go here.
   - Risks and unverifiables (max 3 lines).
7. **Commit and push.** Docs-only commit, message:
   `docs(sprint): daily council day N, <GREEN|YELLOW|RED>, <one clause>`.
   If push is rejected, pull with rebase and retry once; if it still fails,
   include the entire brief verbatim in the session output so nothing is
   lost, and say the push failed at the top.

## Failure modes, decided in advance

- Scoreboard missing or stale 2+ days: the brief's top item is that the
  instrument is down; do not adapt the plan on guesswork, hold it steady.
- Registry and plan disagree: the registry status board wins for task
  states; the plan wins for cadence; note the conflict in the brief.
- Something looks catastrophically wrong (a check regression on billing, a
  live-site 404 observable without credentials): do NOT attempt a night
  fix; write it as the first action of the day with everything needed to
  act in one sitting.
- This protocol file itself found changed: follow the committed version in
  the checkout; that is the point of keeping it in the repo.
