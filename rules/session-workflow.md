# Session Workflow — One Feature Per Chat

## The rule

Each chat session builds exactly one scoped feature or fix (e.g. "refactor the
Faq component," "add Brand Sentiment page," "extract analyseResponse into
_analysis.js"). Once that feature is implemented, tested where possible, and
saved to disk, the session ends. The next task starts in a **fresh chat**
running Sonnet 5, following the same hybrid-routing rule for whether that
task itself needs Opus 4.8 partway through.

## Why

Long-running chat threads force Claude to re-read and compress the entire
conversation history on every new message. That compression is what burns
through the 5-hour and weekly usage limits fastest — not the actual work.
Short, single-purpose sessions keep each message cheap.

## CLAUDE.md is the bridge between sessions

`CLAUDE.md` (this repo's root) is the only thing carried forward between
sessions — a fresh chat has no memory of prior chats. That means:

- **Before ending a session:** update `CLAUDE.md` with what changed —
  move the task from "Planned"/"Pending" to "Completed" with its number,
  update any architecture sections (§1) that the change affected, add new
  limitations to §2 if any were introduced, and update the schema (§3) if
  the change touched the database.
- **At the start of a session:** read `CLAUDE.md` first, before touching
  code, to pick up full context without needing the old chat.
- **Never let CLAUDE.md drift.** If a session ends without updating it,
  the next session inherits a false picture of the codebase — treat an
  out-of-date CLAUDE.md as a bug, not a formality.

## Practical checklist per session

1. Read `CLAUDE.md` (and any relevant `.claude/rules/*.md`) before starting.
2. Confirm the one feature/fix in scope for this session.
3. Build it, following the hybrid-routing rule for Sonnet/Opus split within
   the session.
4. Save all files.
5. Update `CLAUDE.md`: task list, architecture notes, limitations, schema —
   whichever sections the change touched.
6. End the session. Start the next task in a new chat.
