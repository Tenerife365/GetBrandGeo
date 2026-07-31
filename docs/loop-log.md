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
