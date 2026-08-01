---
id: 014
from: bg-orchestrator
to: bg-verify
status: READY
created: 2026-07-26
scope_write: docs/qa/deploy-pipeline-cpanel.md
scope_read: brandgeo/web/deploy.php, brandgeo/web/.htaccess, brandgeo/web/index.html, brandgeo/web/site.js, docs/AGENT-OS.md, CLAUDE.md
model: opus
---

## Decision

Audit and document the `getbrandgeo.com` cPanel deploy pipeline end to end. This
is an AUDIT AND DOCUMENTATION task, not a fix task. Defects are recorded with
evidence and a named owner; you do not remediate them and you do not propose
patches inline. Remediation becomes separate packets after this artifact lands.
Your entire write surface is `docs/qa/deploy-pipeline-cpanel.md`.

## Known-good starting facts

These were verified in the orchestration session on 2026-07-26. Treat them as
starting points to CONFIRM, not as things to rediscover from scratch and not as
things to assume. If you cannot confirm one, say so in the artifact rather than
repeating it.

1. `getbrandgeo.com` deploys via a GitHub push webhook to `brandgeo/web/deploy.php`.
   Netlify is not involved in this pipeline at all.
2. The host is `cloud608.c-f.ro` under CageFS with shell access DISABLED. PHP
   `shell_exec` and `exec` are unavailable, so no git-based or shell-based deploy
   can work there. This is why `deploy.php` is pure PHP.
3. `deploy.php` verifies the GitHub HMAC-SHA256 signature, acts only on pushes to
   `main`, reads `commits[].added` and `commits[].modified` from the payload, and
   for each changed file under `brandgeo/web/` downloads it from
   `raw.githubusercontent.com` at the after-sha and writes it to the docroot. The
   deploy is diff-based; only changed files move.
4. The repo clone on the server and the live docroot are DIFFERENT directories.
5. GitHub abandons a webhook delivery after 10 seconds. Reaching the copy loop
   costs roughly 8 to 10 seconds on this host. One recorded one-file push
   succeeded at 9.89s; a two-file push in the same minute returned 504 and copied
   NOTHING. Commit `d183c46` moved the 202 acknowledgement to just after the
   signature and branch checks, but deliveries still take about 7.6s, so the early
   connection release may not be taking effect under this LiteSpeed SAPI.
6. Because `deploy.php` now returns 202 whether or not the copy loop succeeded,
   the GitHub webhook delivery list is NOT evidence of a successful deploy.
7. Live at time of writing: `brandgeo/web/site.js` line 1 is
   `/* build: 2026-07-26 hook-rebuild */`, `index.html` carries the same stamp as
   its first `<body>` comment, `site.js?v=2026-07-26b` is the current reference,
   and CSP is a response HEADER emitted by `brandgeo/web/.htaccess` (not a meta
   tag) carrying `connect-src ... https://app.getbrandgeo.com`.

## Do

1. Read `brandgeo/web/deploy.php` in full and write the pipeline as an ordered
   sequence: what GitHub sends, what is verified, what is rejected and with which
   status code, what is downloaded, where it is written, and what is returned.
   Name the exact line ranges you are describing.
2. State the trigger precisely: which GitHub event, which branch filter, which
   path filter, and what happens to a push that touches no file under
   `brandgeo/web/`.
3. State what decides copy versus no-copy for each individual file, including
   how `commits[].removed` is handled (or not handled), and whether a file
   changed across several commits in one push is handled once or repeatedly.
4. Establish and state whether `deploy.php` itself sits under the path the copy
   loop acts on, and therefore whether the pipeline can overwrite its own
   deployer mid-run. Record the consequence either way.
5. Establish and state whether files that exist in the repo but are deliberately
   not public (for example `article-builder.html`, and any `.bak` artifacts under
   `brandgeo/web/images/`) can be pushed into the docroot by this pipeline, and
   whether anything excludes them.
6. Examine the 10-second ceiling, which is the single most important open
   question in this audit. Read the acknowledgement path added by `d183c46` and
   determine, from the code, exactly which mechanism is being relied on to release
   the connection early and whether that mechanism is one that a LiteSpeed SAPI
   honours. State the conclusion as CONFIRMED, CONTRADICTED, or UNRESOLVED, and
   say which observation would settle it.
7. Produce the exact copy-pasteable command that proves a given commit is live on
   `getbrandgeo.com`. It must work from PowerShell on Windows, must not require
   server access, and must compare a value fetched over HTTP against a value in
   the repo at a named commit. Cache-busting must be explicit. State what a pass
   looks like and what a fail looks like.
8. Produce the exact procedure for Constantin to test the multi-file ceiling,
   since you cannot push. It must specify how many files, which harmless files,
   what to look at in the GitHub webhook delivery list, and what to check on the
   live site afterward to prove the copy loop actually ran. Hand it over as a
   numbered list with full absolute paths.
9. Enumerate the known failure modes with the evidence for each: the 504 timeout,
   the 202-regardless-of-outcome acknowledgement, and anything else the code
   shows. For each, say how an observer would recognise it after the fact.
10. Write a plain, unhedged section listing everything you could NOT verify and
    the reason for each. Server-side facts you have no access to belong here, not
    in the confirmed section.

## Do not

- Do not edit `brandgeo/web/deploy.php`, `.htaccess`, or any file under
  `brandgeo/web/`. This audit is read-only outside `docs/qa/`.
- Do not write to `docs/qa/plans-divergence-b1.md` or `docs/qa/README.md`. They
  belong to other work. Your only output file is
  `docs/qa/deploy-pipeline-cpanel.md`.
- Do not touch `brandgeo-dashboard/` in any way. A parallel session owns the
  Netlify pipeline and will contradict you if you comment on it.
- Do not propose, draft, or sketch a fix for any defect you find, in code or in
  prose. Record the defect, the evidence, and the owning agent. Remediation is a
  later packet.
- Do not run any git command. Do not push, deploy, or upload anything.
- Do not put any secret, token, webhook secret value, or server credential in the
  artifact. The repo is public.
- Do not claim a check passed unless you ran it and saw the output. Paste the
  output.

## Acceptance criteria

- [ ] `docs/qa/deploy-pipeline-cpanel.md` exists and is the only file written.
- [ ] The trigger is stated: event, branch filter, path filter, and the no-op case.
- [ ] The copy-versus-no-copy decision is stated per file, including `removed` and
      the multi-commit-in-one-push case.
- [ ] What a successful deploy looks like is stated in observable terms, not in
      terms of what GitHub reported.
- [ ] A copy-pasteable PowerShell command is given that proves a named commit is
      live, with an explicit pass condition and fail condition, and its output is
      pasted from an actual run against the live site.
- [ ] The 10-second ceiling question is answered as CONFIRMED, CONTRADICTED, or
      UNRESOLVED, with the code evidence that supports the verdict.
- [ ] A numbered, absolute-path test procedure for Constantin to settle the
      multi-file ceiling is included.
- [ ] Every known failure mode is listed with its evidence and its post-hoc
      recognition signal.
- [ ] A section titled "Could not verify" lists each unverified item with its
      reason.
- [ ] Every defect found carries a named owning agent and no proposed fix.
- [ ] No secret value appears anywhere in the artifact.

## Open questions for Constantin

None. Item 8 produces a procedure for Constantin to run after this stage ends; it
does not block the artifact.
