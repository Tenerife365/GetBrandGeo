---
id: 031
from: bg-orchestrator
to: built in the orchestrator session on 2026-10-14; bg-verify on Opus for the review after the first live push
status: CLOSED, deploy.php 1.2 LIVE and verified from outside on 2026-10-16
created: 2026-10-14
scope_write: brandgeo/web/deploy.php, brandgeo/web/.htaccess, docs/qa/deploy-pipeline-cpanel.md (amendment only), .claude/handoffs/031-*.md
scope_read: docs/qa/deploy-pipeline-cpanel.md, brandgeo/web/deploy.php, brandgeo/web/.htaccess, docs/TECH-STACK.md
model: opus (verify)
---

## Decision

Constantin, 2026-10-14: fix the three cPanel findings from
`docs/TECH-STACK.md` section 11 item 2, which are F2, F3 and F5 of
`docs/qa/deploy-pipeline-cpanel.md`: the webhook gives no success signal,
pushes over 20 commits under-deploy silently, and `deploy-secret.php`
sits in the public docroot. F1 (private files deployable), F4 (which
acknowledgement branch fired is unrecorded) and F6 (self-overwrite with no
guard) are closed in the same edit because they live in the same forty
lines and cost nothing extra.

## What changed

`brandgeo/web/deploy.php`:

1. **Secret outside the docroot, with a fallback.** The script now loads
   `/home/getbran1/repositories/deploy-secret.php` first (the directory
   that already holds `deploy.log`, outside the web root) and falls back
   to the copy next to the script. Which one loaded is written to the
   status file as `secret_location`. The fallback is what makes this push
   safe: nothing has to be moved before it, and the docroot copy can be
   moved afterwards at leisure. When the docroot copy is the one that
   loaded, the status file says `DOCROOT, move it`.
2. **Full file list when a push carries 20 or more commits.** GitHub caps
   the webhook's `commits[]` at 20. When the payload hits that cap the
   script now calls the public compare API
   (`/repos/{owner}/{repo}/compare/{before}...{after}`), which lists every
   file in the range regardless of commit count, and uses that list. If
   the API call fails it falls back to `commits[]` and records
   `truncated: true` so the under-deploy is visible instead of silent.
   Pushes under 20 commits behave exactly as before, no extra request.
3. **A public status file.** Every run writes `deploy-status.json` in the
   docroot: pushed sha, start and finish time, how many files were
   expected and deployed, the list of fetch or write failures, skipped
   private paths, the truncation flag, which finish function fired and the
   PHP SAPI name (F4), the secret location, and a rollback flag. It
   contains nothing secret: the sha is public on GitHub. A push is now
   verifiable from anywhere with one GET.
4. **Private paths never deploy.** `article-builder.html`, anything under
   `images/_staging/`, any `.bak`, and `deploy-secret.php` are skipped and
   listed under `skipped` (F1).
5. **Self-overwrite guard.** When `deploy.php` itself is in the push, the
   previous copy is saved to `/home/getbran1/repositories/deploy.php.prev`
   before the write. After the loop the script GETs its own URL: a healthy
   deployer answers `403 Forbidden` to an unsigned request, a broken one
   answers 500 or 200. Anything but 403 restores the backup and records
   `rollback: true` (F6).
6. Paths can be overridden by environment variables (`BRANDGEO_DEPLOYPATH`,
   `BRANDGEO_LOGFILE`, `BRANDGEO_SECRET_OUTSIDE`, `BRANDGEO_SELF_URL`) so
   the script can be exercised locally under PHP's built-in server. In
   production none is set and the defaults are the old constants.

`brandgeo/web/.htaccess`: a `<Files "deploy-secret.php">` deny rule, so
even a stale docroot copy is never served as text if PHP handling ever
changes (F3's conditional exposure), plus deny rules for
`article-builder.html` and `*.bak`, which closes F1 for the copies already
live (deletions are never propagated, so a deny rule is the only way to
take them down without cPanel access).

## Verified before commit

- `php -l` clean on PHP 8.4.24 (local).
- Five signed-payload runs under `php -S` against a temp docroot and a local
  throwaway secret: bad signature answers 403; a 20-commit payload over the
  real range `843fe72...9f33835` takes the compare path and lands all 4 web
  files byte-identical to git, status `source: compare`; the private paths and
  a `..` path are skipped and listed; a failed self-overwrite write leaves the
  live copy in place with no rollback; `httpStatus()` reads 403 from the
  running deployer and 0 from a closed port. The F6 success branch cannot run
  on Windows (file lock, single worker) and is proven by this very push.
  Full record: `docs/qa/deploy-pipeline-cpanel.md` section 14.

## Requires Constantin, in order

1. Push (web files only, Netlify cancels its build):
   `$env:BATCH_PUSH=1; git push origin main`
2. Within two minutes, `GET https://getbrandgeo.com/deploy-secret.php` and
   `GET https://getbrandgeo.com/article-builder.html` must both answer 403.
   That proves the OLD deployer copied the new `.htaccess` (and, in the same
   loop, the new `deploy.php`). The old code is the one running during this
   push, so no status file exists yet. If the two GETs still answer 200 or
   404 after five minutes, the old deployer failed on this push: upload
   `brandgeo/web/deploy.php` and `brandgeo/web/.htaccess` by hand in cPanel
   File Manager to `/home/getbran1/getbrandgeo.com/`.
2b. The NEXT push of anything to `main` (docs count: the webhook fires on
   every push and the new code writes a status file even with zero web
   files) creates `https://getbrandgeo.com/deploy-status.json`. Open it: its
   `sha` must be that push's commit and `secret_location` will read
   `DOCROOT, move it` until step 3 is done.
3. In cPanel File Manager, copy `/home/getbran1/getbrandgeo.com/deploy-secret.php`
   to `/home/getbran1/repositories/deploy-secret.php`, then delete the
   docroot copy. The next push's status file must then read
   `secret_location: outside docroot`.

## Then

bg-verify on Opus reviews the live result against F1 to F6 and the
attack surface of the new compare request (a payload cannot make the
script fetch an arbitrary host: owner, repo and the sha pattern are fixed
in the script) and writes `docs/qa/cpanel-deploy-hardening-031-review.md`.

## Not in scope

Propagating deletions, a status endpoint beyond the JSON file, moving the
site off shared hosting, any Netlify change.

## Progress 2026-10-16

Constantin pushed `ca31195` on 2026-10-16. Measured from outside the server
the same morning: `deploy-secret.php` answered 403 and `article-builder.html`
403 within two minutes, so the old deployer copied the new `.htaccess` and
`deploy.php` (step 2 done). He then moved `deploy-secret.php` to
`/home/getbran1/repositories/` in cPanel File Manager (step 3 done):
`deploy-secret.php` now answers 404, `article-builder.html` still 403, an
unsigned GET on `deploy.php` 403, `deploy-status.json` 404 until the next
push. The commit carrying this note is that next push; its status file must
read `secret_location: "outside docroot"` and `sha` equal to this commit.

## Review 2026-10-16 and version 1.2

bg-verify returned FAIL: R1 MAJOR (the 20-commit premise was wrong, GitHub
sends up to 2048 commits, and the compare API caps at 300 files, so 1.1 could
drop files on a big push), R2 MINOR (`images/_staging/` still served), R3
MINOR (self-overwrite installed even without a backup). All three are fixed
in `deploy.php` 1.2 and `.htaccess`, tested locally (QA doc section 15), and
ride the next push. R4 to R6 (INFO) are recorded in the review, not fixed.
Owed after that push: `https://getbrandgeo.com/images/_staging/n1.png` must
answer 403, the status file must carry `self_check`, and the push after that
one, if it ever carries `deploy.php`, proves the rollback branch.

## Closed 2026-10-16

Constantin pushed `1c3fdc2`. Read over HTTP from outside the server within
a minute: `deploy-status.json` sha `1c3fdc27...`, before `1612cc9...`,
expected 2, deployed 2, failed [], skipped [], truncated false, source
commits, commits_in_payload 1, secret_location "outside docroot", sapi
litespeed, finish_fn litespeed_finish_request, rollback false. That run was
1.1 overwriting itself with 1.2: backup written, self-check GET answered
403, no rollback, so the F6 success branch is proven live. The `self_check`
field is written by 1.2 and appears from the next push. `images/_staging/`
403, unsigned `deploy.php` 403, `deploy-secret.php` 404, `deploy.php.prev`
404. Nothing is owed on this packet. R4 to R6 stay recorded in the review.
