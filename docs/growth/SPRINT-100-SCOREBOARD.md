# SPRINT-100 scoreboard

Built by the night council 2026-08-05 (Day 5, Gate 1), because `test -f` on
this file had failed for 5 consecutive mornings (Day 1 through Day 5) and Gate
1 falls today with nothing to check it against. This is the structure S9
specifies. It carries no acquisition numbers: this environment has no Stripe
or Supabase access (no MCP connector, no network egress), so every data cell
below is `TBD`, never a guessed or zeroed value. A missing number is a missing
number, not zero activity.

## Capture rule

Rows are written by council chats, never by hand. Constantin says "close the
day" in whatever chat is open; that chat pulls paying subscribers and MRR
from the Stripe MCP (read-only, active subscriptions plus live package
grants), pulls the day's audit runs and signups from Supabase (read-only SQL
on `prospect_audits` and `clients`), then asks Constantin ONE line for the
manual numbers: sends, DMs, replies, calls. "0" and "skip" are valid answers.
The session writes the row, adds the one-line note, commits docs-only and
pushes. A day chat that learns a number mid-day may update the row
incrementally; the close-the-day pass finalizes it. Fridays add the CFO
reconciliation line (Stripe subscriptions vs `clients.plan`) as a note on
that day's row. Mondays and Thursdays record whether the real-card rehearsal
ran, also as a note.

Full protocol: `SPRINT-100-DAILY-COUNCIL.md`.

## The gates

- **Day 5.** All foundation S-task checks green, or the gap named. Baseline
  paying/MRR recorded.
- **Day 15.** At or above 30 paying. Under 20 triggers the pre-agreed
  fallback from Path 1 cadence to Path 2 (`SPRINT-100-PLAN-30D.md` note: sends
  drop to 40/day, DMs to 15, Sundays off).
- **Day 22.** At or above 55, plus a CFO check on churn and upgrades.
- **Day 30.** Close-out, and the Day 31 memo.

## Row zero: baseline

| Date | Cumulative paying | MRR EUR | Note |
|---|---|---|---|
| 2026-07-31 | TBD | TBD | Baseline never captured. Needs a Stripe MCP read from a day-side chat before Gate 1 can be scored against anything. |

## Daily table

| Date | Emails sent | DMs sent | Replies | Calls booked | Audit runs | Free signups | New paying | Cumulative paying | MRR EUR | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-08-01 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Not captured. |
| 2026-08-02 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Not captured. |
| 2026-08-03 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Not captured. |
| 2026-08-04 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Not captured. |
| 2026-08-05 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | GATE 1 day. Not captured yet. |
| 2026-08-06 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-07 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-08 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-09 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-10 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | LAUNCH day. |
| 2026-08-11 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-12 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-13 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-14 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-15 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | GATE 2 day. |
| 2026-08-16 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-17 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-18 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-19 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-20 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-21 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-22 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | GATE 3 day. |
| 2026-08-23 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-24 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | LAUNCH30 expiry announced. |
| 2026-08-25 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-26 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-27 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-28 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-29 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | |
| 2026-08-30 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | Close-out. Target 100. |

## Channel EV budget (registry Part C-5, for reference at each gate)

| Channel | Volume assumption | EV paying subs |
|---|---|---|
| Cold email, warmed | 50/day from day 7, about 1,100 sends | 30 to 40 |
| LinkedIn DMs | 20 to 25/day, about 550 | 25 to 35 |
| Audit funnel inbound | 37 CTAs, posts, launch traffic | 15 to 25 |
| Agency closes | 10 pitched, 2 to 3 closed | 8 to 15 |
| Founding prepay packages | warm network, S14 | 8 to 12 |
| Referral loop | from first customers, S15 | 5 to 10 |
| Launch day | one coordinated moment | 5 to 10 |
