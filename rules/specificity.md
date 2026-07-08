# Specificity — Every Hand-off Gets Exact Paths

## The rule

Any time Claude asks Constantin to do something manually — run a command,
move a file, click through a UI, connect a folder — the instruction must
include:

- The **full absolute path** (never "the new folder," "the dashboard repo,"
  or "the project root" on its own — spell out the drive letter and every
  segment).
- The **exact, copy-pasteable command**, including which shell/directory to
  run it from (a `cd` line if needed).
- The **exact tool, app, or browser page** where a click-through step
  happens (e.g. "Cowork's folder settings panel," "GitHub Desktop →
  Repository → Repository Settings → Remote," not just "in the app").

A suggestion like "run `npm install` in the new location" or "point Cowork
at the new folder" is a **violation of this rule** even if technically
correct — it forces Constantin to go figure out the path himself, which is
exactly the kind of avoidable back-and-forth this rule exists to prevent.

## Why

Constantin asked for this directly as a standing rule (2026-07-08, during
the local-disk restructuring session) after Claude gave two hand-off
suggestions without paths: "run `npm install` inside the new
`brandgeo-dashboard\`" (without saying where that was) and "point Cowork's
connected folder at the new path" (without naming the new path or the old
one being replaced). Both required Constantin to reconstruct information
Claude already had.

## How to apply

Before sending any message that hands Constantin a manual step, check: could
he copy-paste this and act immediately, with zero lookup or guessing? If
not, add the missing path/command/location. Concretely:

- File/folder references → always the full path, e.g.
  `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard\`,
  never "the dashboard folder."
- Commands → the literal command block, plus which directory to `cd` into
  first if it matters.
- UI steps → name the specific app/panel/menu, not just "settings."
- If Claude genuinely doesn't know the exact UI path (e.g. Cowork's own
  folder-connection screen), say so honestly rather than inventing plausible
  menu names — and prefer doing the step directly with an available tool
  over describing it, when one exists (e.g. `request_cowork_directory` can
  connect a folder directly instead of telling Constantin to do it by hand).

This complements the existing `feedback_specific_instructions` memory (same
rule, captured in Claude's cross-session memory as well as here so it's
visible directly in the repo).
