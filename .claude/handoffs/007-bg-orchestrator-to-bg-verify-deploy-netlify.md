---
id: 007
from: bg-orchestrator
to: bg-verify
status: READY
created: 2026-07-26
scope_write: docs/qa/deploy-pipeline-netlify.md
scope_read: brandgeo-dashboard/netlify.toml, brandgeo-dashboard/package.json, brandgeo-dashboard/vite.config.ts, brandgeo-dashboard/netlify/functions/, docs/AGENT-OS.md, CLAUDE.md
model: sonnet
---

## Decision

Audit and document the `app.getbrandgeo.com` Netlify deploy pipeline end to end,
covering the React build AND every Netlify function, including the scheduled
ones. This is an AUDIT AND DOCUMENTATION task, not a fix task. Defects are
recorded with evidence and a named owner; you do not remediate them and you do
not propose patches inline. Your entire write surface is
`docs/qa/deploy-pipeline-netlify.md`.

## Known-good starting facts

Verified in the orchestration session on 2026-07-26. Confirm them; do not
rediscover them from scratch and do not assume them. If you cannot confirm one,
say so in the artifact.

1. `brandgeo-dashboard/netlify.toml` sets
   `ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."`.
2. Netlify's `ignore` directive INVERTS the usual convention: exit code 0 CANCELS
   the build. `git diff --quiet` exits 0 when nothing changed, so any push that
   does not touch `brandgeo-dashboard/` is cancelled on purpose and is displayed
   as "Canceled", not "Skipped". A run of cancelled deploys is normal and correct.
3. `$CACHED_COMMIT_REF` is the last commit actually BUILT, not the last commit
   pushed, so the diff is cumulative and a run of cancellations cannot lose a
   dashboard change.
4. Clearing the build cache resets `$CACHED_COMMIT_REF`, which is why a manual
   "clear cache and deploy" builds even for a docs-only commit.
5. The Netlify site's own name is `dreamy-raindrop-4f29d5`. `app.getbrandgeo.com`
   is a custom domain on that same site, confirmed by an identical served bundle
   hash.
6. Netlify integrates through its GitHub App, not through a repo webhook. The only
   repo-level webhook is the cPanel one. Netlify posts NO commit statuses on this
   repo, so a GitHub commit status cannot be used to tell whether Netlify saw a
   push.
7. Live at time of writing: served bundle is `index-DzC066bP.js`; its prices read
   0, 99, 299, 449, from 1500 EUR; an unauthenticated POST to
   `/.netlify/functions/promotions-admin` returns 401.
8. `netlify.toml` carries per-function timeout blocks and FIVE scheduled
   functions, not four. Confirmed by reading the file: `expire-plan-grants`
   (`0 6 * * *`), `purge-old-results` (`0 3 * * *`), `purge-old-audits`
   (`0 4 * * *`), `schedule-collections` (`0 * * * *`), `ping-sitemap`
   (`0 5 * * *`). Whether these actually deploy and run has NEVER been verified
   and is squarely in scope for you.
9. `brandgeo-dashboard/netlify/functions/` contains 72 `.js` files, while
   `netlify.toml` declares a per-function block for only a subset of them.
   Reconciling that gap is a required deliverable, not an aside.

## Do

1. Read `brandgeo-dashboard/netlify.toml` in full and write the pipeline as an
   ordered sequence: what triggers a build, what the `ignore` command evaluates,
   what the build command and publish directory are, what Node and package manager
   version are pinned if any, and what is produced.
2. State the trigger precisely, including the fact from item 6 above that there is
   no repo webhook and no commit status, and say what an observer CAN look at to
   tell whether Netlify saw a given push.
3. State the build-versus-no-build rule in full, including the inverted exit-code
   semantics, the cumulative `$CACHED_COMMIT_REF` behaviour, and the cache-clear
   reset. Give the concrete case of a marketing-only push and a docs-only push.
4. Enumerate every `.js` file in `brandgeo-dashboard/netlify/functions/`,
   separating: `_`-prefixed shared helpers that Netlify must NOT expose as
   endpoints, functions with an explicit `netlify.toml` block, and functions with
   no block at all. State what a function with no block inherits by default, and
   whether any function needing a raised timeout is missing one.
5. For each of the five scheduled functions, state the cron, what Netlify requires
   for a scheduled function to register, and the exact way to confirm from outside
   the build logs that it is registered and has actually run. If confirmation
   requires the Netlify UI or API, produce the exact navigation path or the exact
   command, and mark the result as unverified until it is run.
6. State what a successful deploy looks like in observable terms: what changes on
   the live site, what the bundle filename does, and what distinguishes a genuinely
   deployed change from a cached one.
7. Produce the exact copy-pasteable command that proves a given commit is live on
   `app.getbrandgeo.com`. It must run from PowerShell on Windows, must not require
   Netlify UI access, and must compare a value fetched over HTTP against a value
   derivable from the repo at a named commit. State the pass condition and the
   fail condition, run it, and paste the output.
8. Produce a second copy-pasteable command that proves a named FUNCTION is
   deployed, using an unauthenticated request whose rejection proves the function
   exists. Explain precisely what such a check does and does not prove. Note that
   a 401 for a missing token is a weaker test than a 401 for an invalid token, and
   say so.
9. Enumerate the known failure modes with evidence: a legitimately cancelled
   build mistaken for a broken pipeline, a stale bundle served from cache, a
   function missing from `netlify.toml`, a scheduled function that silently never
   registers, and anything else the config shows. For each, give the post-hoc
   recognition signal.
10. Write a plain, unhedged section listing everything you could NOT verify and
    the reason for each.

## Do not

- Do not edit `netlify.toml`, any file under `brandgeo-dashboard/`, or any other
  source file. This audit is read-only outside `docs/qa/`.
- Do not write to `docs/qa/plans-divergence-b1.md` or `docs/qa/README.md`. Your
  only output file is `docs/qa/deploy-pipeline-netlify.md`.
- Do not touch `brandgeo/web/` in any way. A parallel session owns the cPanel
  pipeline and will contradict you if you comment on it.
- Do not audit the BUSINESS LOGIC of any function. You are auditing whether and
  how code reaches production, not whether the code is right. In particular do not
  re-open `_plans.js`, `_cost.js`, `planConfig.ts`, or plan gating; packet 005
  owns that and may be in flight.
- Do not propose, draft, or sketch a fix for any defect. Record the defect, the
  evidence, and the owning agent.
- Do not trigger a deploy, clear a build cache, run a git command, or call any
  authenticated endpoint. Unauthenticated existence probes only.
- Do not put any secret, token, service key, or environment variable VALUE in the
  artifact. Naming an environment variable is fine; printing its value is not.
- Do not claim a check passed unless you ran it and saw the output. Paste it.
- If you find a scheduled function that appears not to register, or any defect
  whose diagnosis needs a judgement call beyond reading config, do NOT diagnose
  it. Record the observation and write the finding as needing escalation to Opus.

## Acceptance criteria

- [ ] `docs/qa/deploy-pipeline-netlify.md` exists and is the only file written.
- [ ] The trigger is stated, including the absence of a repo webhook and of commit
      statuses, and what an observer can look at instead.
- [ ] The build-versus-no-build rule is stated with the inverted exit-code
      semantics, cumulative `$CACHED_COMMIT_REF`, and the cache-clear reset, with a
      worked marketing-only and docs-only example.
- [ ] All 72 `.js` files are accounted for, split into helpers, declared
      functions, and undeclared functions, with the count of each stated.
- [ ] All five scheduled functions are listed with cron, registration requirement,
      and an exact confirmation method.
- [ ] A copy-pasteable PowerShell command proving a named commit is live is
      included, with pass and fail conditions, and its real output is pasted.
- [ ] A second command proving a named function is deployed is included, with an
      explicit statement of what it does not prove.
- [ ] Every known failure mode is listed with evidence and a post-hoc recognition
      signal.
- [ ] A section titled "Could not verify" lists each unverified item with its
      reason.
- [ ] Every defect found carries a named owning agent and no proposed fix.
- [ ] No secret or environment variable value appears anywhere in the artifact.

## Open questions for Constantin

None.
