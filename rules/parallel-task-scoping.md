# Parallel Task Scoping — Non-Overlapping Ownership

## The rule

When more than one BrandGEO chat session is running at the same time (see
the parallel-work window in `CLAUDE.md` §0), every task in flight must be
assigned a **distinct, non-overlapping scope** before it starts — both at
the file level and at the git level. Two rules, not one:

1. **File scope:** no two sessions may plan to edit the same file at the
   same time. Before starting, check what the other in-flight tasks are
   touching (their entries in `CLAUDE.md` §5 "Pending", tagged `Scope:`)
   and pick a task whose files don't intersect with anything already
   running.
2. **Git scope:** even with non-overlapping files, `git commit`/`git push`/
   `git stash` touch repo-wide state (`.git/index`, `.git/index.lock`) that
   isn't partitionable by file path. Only one session should run a git
   command at any given moment, regardless of which files it touched.

## Why

On 2026-07-08, three sessions ran in parallel: #83 (this dashboard feature,
touching `Layout.tsx`/`App.tsx`/`i18nContext.tsx`), #72 (a read-only
dashboard audit), and #84 (a website `index.html` edit). File-level
scoping worked exactly as intended — #72 and #84 both deliberately avoided
`Layout.tsx`/`App.tsx` while #83 was using them. But a `git stash`/
`git status` from one session still collided with another session's git
operation and corrupted `.git/index` (`bad signature 0x00000000`, plus a
leftover `.git/index.lock`). File-scope non-overlap alone did not prevent
this — git operations are a shared resource that sits outside the file
system's per-path isolation. Full incident writeup: `CLAUDE.md` §5, task
#83 entry.

## How to apply

- **Before queuing multiple tasks for parallel execution:** tag each
  pending task in `CLAUDE.md` §5 with a `Scope:` line listing the
  files/folders it touches (e.g. `Scope: brandgeo-dashboard/src/pages/,
  brandgeo-dashboard/src/lib/i18nContext.tsx`, or `Scope: brandgeo/web/
  only`, or `Scope: Supabase only, no local files`). Only launch tasks in
  parallel whose `Scope:` lines don't intersect.
- **Natural partition boundaries** that tend not to overlap: dashboard
  React app (`brandgeo-dashboard/src/`), Netlify functions
  (`brandgeo-dashboard/netlify/functions/`), website
  (`brandgeo/web/` + `brandgeo-signup/`), Python collector/backend,
  Supabase-only changes (no local files touched), docs/research-only
  (`CLAUDE.md` read + a standalone `.md` deliverable).
- **Git is always serialized, never partitioned.** Before running any git
  command (`commit`, `push`, `stash`, `reset`, even read-only `status` if
  another session might be mid-operation), confirm with Constantin that no
  other BrandGEO chat is currently doing the same. Per the
  execution-delegation rule, prefer handing git commands to Constantin to
  run himself — this doubles as natural serialization, since he can only
  run one command at a time.
- **`CLAUDE.md` itself is a special case:** every session edits it near
  the end, so a "file has been modified since read" error from the Edit
  tool is expected and is the safety net working correctly — re-read the
  file and re-apply the edit against the current content. Never force an
  overwrite of a stale read.
- **If a collision happens anyway:** don't try to fix `.git` state from
  the sandbox. Confirm no other session is still mid-operation, then hand
  Constantin the exact recovery command (see the git-index-corruption
  example in `CLAUDE.md` §5, task #83).
