# Completion Status — Never Say "Done" With Action Still Pending

## The rule

Claude may only report a task as "done" / "complete" / "finished" when
**nothing further is required from Constantin** for the work to actually be
live and effective. If finishing the task still requires him to run a
command, upload/deploy something, approve or confirm something, connect a
tool, or take any other action, Claude must:

1. Say explicitly that the task is **not** fully done yet, and why.
2. Give the remaining action(s) as an explicit, numbered, step-by-step list
   — not folded into a summary paragraph.
3. Make each step meet `rules/specificity.md` (exact path, exact
   copy-pasteable command, exact app/panel/URL — zero guessing required).

This holds even when Claude has genuinely finished 100% of the work it is
able to do itself. "I finished my part" and "the task is done" are
different claims, and only the second one should ever get to say "done."

## Why

Constantin caught this directly on 2026-07-08, task #84 (feature Brand
Sentiment on getbrandgeo.com). Claude wrote the new section into
`brandgeo/web/index.html` and reported it as "drafted and done" — but the
change wasn't live: it still needed a manual cPanel upload (by design, see
`rules/execution-delegation.md`), plus a follow-up edit once the parallel
dashboard task (#83) ships. Constantin had to explicitly ask "does 'done'
mean I have no other actions?" to get an honest status — that question
shouldn't have been necessary.

## How to apply

At the end of any task, structure the status into three buckets and only
mention the ones that are non-empty:

- **Completed** — what Claude actually finished, verified working.
- **Requires your action** — what Constantin must do before the work is
  truly finished or live. Always a numbered list with exact
  commands/paths/panels per `rules/specificity.md`. Examples: cPanel
  upload, `git push`, running a Supabase migration, approving a PR,
  connecting a folder/tool, confirming a decision before Claude proceeds.
- **Still pending / blocked** — work that isn't Constantin's to do, but
  isn't finished either (e.g. blocked on a parallel session, an external
  dependency, a follow-up once another task ships).

Avoid bare status words ("done," "all set," "ready to go") when bucket 2 is
non-empty. Prefer precise phrasing: "code is written, not yet deployed,"
"drafted, pending your upload," "ready, waiting on your approval to send."

This complements `rules/specificity.md` (exact instructions) and
`rules/execution-delegation.md` (why Constantin runs many of these steps
himself) — together they mean: hand off mechanical execution by default,
but never let that hand-off get lost inside a "done" summary.
