# Execution Delegation — Let Constantin Run It When He Can

## The rule

For mechanical execution steps — shell/PowerShell/cmd commands, Supabase SQL
(especially anything that mutates data or schema), Netlify actions, cPanel
uploads, git operations — **default to handing Constantin the exact
copy-pasteable command or steps (per `rules/specificity.md`) and letting him
run it himself**, instead of Claude spending tool calls to execute it
directly.

This is not a ban on Claude executing things directly. It's a default:
prefer delegation for anything mutating, multi-step, or tool-call-heavy;
still fine to execute directly for cheap, single-call, read-only checks
(e.g. one SQL `SELECT` to verify a fix, fetching a URL to confirm an upload
landed) where writing out full manual instructions would cost more than
just doing it.

## Why

Constantin asked for this directly (2026-07-08) as a standing, "very
important" rule: he's willing and able to run commands himself, and every
tool call Claude makes costs tokens — offloading mechanical execution to him
reduces session cost without losing anything, since the outcome is the same
either way. This applies broadly, not just to BrandGEO: cmd/PowerShell,
Supabase, Netlify, and cPanel were the examples given, but the same logic
extends to any tool-call-heavy execution.

## How to apply

Before reaching for a tool that executes/mutates something (Desktop
Commander, Windows-MCP PowerShell, Supabase `execute_sql`/`apply_migration`,
Netlify deploy actions, etc.), ask: could Constantin just run this himself
from an exact command/instructions block? If yes, default to that — give
him:

- The exact command or SQL, copy-pasteable
- The exact application/panel/URL to run it in (e.g. "Supabase dashboard →
  SQL Editor" with the direct project URL, not just "in Supabase")
- What to check afterward to confirm it worked

Still use direct tool execution for:
- Read-only investigation needed to diagnose a problem or write accurate
  instructions in the first place (e.g. querying Supabase schema to find an
  issue, before handing over the fix)
- Quick, single-call verification after Constantin (or Claude) makes a change
- Genuinely large/repetitive operations where manual execution would be
  impractical or error-prone for a human (e.g. the `robocopy` folder move in
  [[brandgeo_restructuring_plan]] — that one was better done directly, since
  hand-running dozens of copy operations isn't realistic)

When in doubt, or when the operation mutates production (a live DB, a live
site, a git remote), lean toward delegating with exact instructions rather
than executing directly — same spirit as always confirming before touching
production, just now with an explicit cost angle too.

This complements [[feedback_specific_instructions]] (exact paths/commands)
and `rules/specificity.md` — delegation only works if the instructions are
precise enough to run with zero guessing.
