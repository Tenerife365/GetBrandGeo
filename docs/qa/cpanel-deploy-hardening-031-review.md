FAIL

# cPanel deployer hardening, packet 031, live review

```
INTENT: review packet 031  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

- Reviewer: `bg-verify`, 2026-10-16
- Subject: `brandgeo/web/deploy.php` (`BrandGEO-Deploy/1.1`) and `brandgeo/web/.htaccess` as committed in `1330dbe`, live since the push of `ca31195`; `origin/main` is `1612cc9`.
- Method: line-by-line read of the working tree copies, `php -l`, GET-only probes of getbrandgeo.com, GET-only calls to the public GitHub REST API and GitHub's own docs. No git command, no POST, no webhook send, no cPanel access, no file edited except this report.

## Verdict in one paragraph

The hardening works for every push this repository has actually made, and it is better than what it replaced on F1, F2, F3 and F4. It FAILS on F5, and not by leaving it open: it regresses it. The premise of F5 ("GitHub caps the webhook payload's `commits[]` at 20") is wrong; GitHub documents a webhook cap of 2048 commits. The new code abandons a complete `commits[]` list at 20 commits and replaces it with the compare API's file list, which GitHub caps at 300 files for the whole comparison, then records `source: compare, truncated: false`. Measured on a real range of this repository below: `brandgeo/web/index.html` and `brandgeo/web/sitemap.xml` changed inside the range and are absent from what the deployer would fetch, with a status file claiming a complete deploy. That is the exact silent under-deploy class this packet was opened to remove. **Do not revert**: the live deployer is correct for any push under 20 commits, which covers every push so far. Do not close packet 031 until R1 is fixed and re-verified. Interim rule until then: no push of 20 or more commits.

## Calibration

1. **Diff under review.** `git diff --stat` was not run: the caller forbade every git command. Substitute evidence, the public compare API for `073b1f8...1330dbe` (one commit), returns exactly four files: `.claude/handoffs/031-bg-orchestrator-cpanel-deploy-hardening.md` (added), `brandgeo/web/.htaccess`, `brandgeo/web/deploy.php`, `docs/qa/deploy-pipeline-cpanel.md` (modified). All four are inside the packet's `scope_write`. No file outside scope.
2. **Secret scan.** Run over the added lines of that commit's patch, as fetched from the API. Pattern hits: handoff 14, `.htaccess` 2, `deploy.php` 16, QA doc 6. Every hit is a variable, constant or file name (`DEPLOY_WEBHOOK_SECRET`, `deploy-secret.php`, `$SECRET_OUTSIDE`); added `define(` calls: 0 in every file. Token-like strings of 32 or more characters: 11, all of them server paths, repo paths or a comment rule; 0 opaque values. The secret file `brandgeo/web/deploy-secret.php` is git-ignored (`.gitignore:7`) and the API returns 0 commits ever touching that path and 404 for it at `main`. No value was read or printed.
3. **Criteria.** The packet carries no numbered acceptance list. Its "What changed" items 1 to 5 plus findings F1 to F6 are used as the criteria. All are objectively checkable; the F6 success branch is checkable only on a future push that carries `deploy.php` and is marked NOT CHECKED below, not passed.
4. **Baseline.** `tsc` and `npm run build` are not applicable: no file under `brandgeo-dashboard/` is in the commit (point 1). The relevant baseline is PHP: `php -l brandgeo/web/deploy.php` on PHP 8.4.24 prints `No syntax errors detected`.
5. **Auth check guarding the most sensitive function.** The HMAC-SHA256 gate at `deploy.php:95-99`: empty body or header answers 403 at `:97`, `hash_equals` over `sha256=` plus `hash_hmac` at `:98-99`. Nothing below `:99` runs for an unsigned caller; the live unsigned GET answers `403`, body length 9, matching `exit('Forbidden')`.
6. **Write access.** This report is the only file written. No reviewed file was edited.

CALIBRATED

## Acceptance table

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | F3: secret loads from outside the docroot, docroot copy is a fallback | PASS | `deploy.php:80-92`. Live `deploy-status.json` reads `"secret_location": "outside docroot"`. `GET /deploy-secret.php` answers 404 with length 796, identical to the control `GET /definitely-not-a-real-file-xyz123.html` (404, 796). Secret never in git history (calibration 2). |
| 2 | F5: a push of 20 or more commits deploys every changed web file | **FAIL** | See R1. Webhook cap is 2048, compare cap is 300, measured omission of `index.html` and `sitemap.xml`. |
| 3 | F2: every run writes a public status file that proves the deploy from outside | PASS | `deploy.php:244-264`. Live `GET /deploy-status.json` 200: `sha 1612cc9428a38acf5b75aad6a7df4351259016b0` (the API lists it as the head of `main`), `before ca31195...`, `expected 0, deployed 0, failed [], skipped []`, `truncated false`, `source commits`, `commits_in_payload 1`, `rollback false`. Response `Last-Modified: Fri, 16 Oct 2026 11:51:33 GMT` equals the `finished` field to the second. The file did not exist before the 1.1 code ran, so it is also proof that 1.1 is the running deployer. |
| 4 | F4: which acknowledgement branch fired is recorded | PASS | `deploy.php:134-141`, `:257-258`. Live: `"sapi": "litespeed"`, `"finish_fn": "litespeed_finish_request"`. This also settles the open question of section 6 of `deploy-pipeline-cpanel.md`: on this host the connection is released by `litespeed_finish_request`, not by `fastcgi_finish_request` and not by the headers alone. |
| 5a | F1, deployer half: private paths are never fetched | PASS (code and local run) | `deploy.php:72-77` and `:191-195`, patterns anchored on the docroot-relative path. Exercised locally in `deploy-pipeline-cpanel.md` section 14 run 3. Not exercised live: no push since `ca31195` named a private path. |
| 5b | F1, live half: private copies already in the docroot stop being served | **PARTIAL** | `GET /article-builder.html` 403, `GET /images/bg-004-hero-old-pil.png.bak` 403, `GET /.htaccess` 403. `GET /images/_staging/n1.png` **200, 59855 bytes**, unchanged since the original audit. See R2. |
| 6 | F6: a broken self-overwrite is rolled back | **NOT CHECKED** live, code read with one MINOR | `deploy.php:202-238`. The success branch has never run in production: the push of `ca31195` carried the new `deploy.php` through the OLD deployer, and `1612cc9` carried no web file (`expected 0`). Packet line 81 ("is proven by this very push") is therefore not true as written; section 14 states it correctly. See R3 and "What was not checked". |
| 7 | The compare request cannot be steered to another host, repo or path | PASS | See "Attack on the compare request" below. |
| 8 | `.htaccess` deny rules work on both access-control syntaxes | PASS (both written), effective on this host | `.htaccess:71-97`: each block carries `Require all denied` inside `IfModule mod_authz_core.c` and `Order allow,deny` plus `Deny from all` inside `IfModule !mod_authz_core.c`. Live 403s in row 5b prove the active branch works on LiteSpeed. The `deploy-secret.php` block cannot be re-probed now that the file is gone (404); the packet records a 403 on 2026-10-16 before the move, which is the owner's measurement, not mine. |
| 9 | Status file leaks nothing sensitive | PASS | Fields at `deploy.php:244-260`: two public shas, two timestamps, counts, repo-relative path lists, a boolean, a fixed-vocabulary location label, SAPI and function names. No absolute path, no IP, no header, no secret. `Server: LiteSpeed` is already in every response header, so `sapi` adds nothing an outsider lacks. |
| 10 | Compare failure or rate limit falls back and says so | PASS | `deploy.php:152-171`: `compareFiles` returns `null` on any non-200 (`:282`, `:336`), including GitHub's 403 rate-limit answer; `$truncated = true` at `:160`, `$source` stays `commits`, and the `commits[]` loop at `:163-171` runs, so the deploy proceeds. Section 14 run 2 observed exactly this before the local CA bundle was configured. (Under R1's corrected premise this flag is a false alarm for pushes under 2048 commits: R4.) |
| 11 | No em or en dash added | PASS | `rg -n '\x{2014}\|\x{2013}'` positive control on a scratch file with one of each: 1 hit, exit 0. On `deploy.php`, `.htaccess`, the QA doc and packet 031: 3 hits, all in `.htaccess` comments at lines 1, 25 and 33, outside the new block at `:65-97` and older than this change (the CSP and header comments). Comment hits are not findings. 0 hits in the other three files. |
| 12 | `php -l` clean | PASS | `No syntax errors detected in brandgeo/web/deploy.php`, PHP 8.4.24. |

## Security and reliability findings, ranked

### R1. MAJOR. The F5 fix replaces a complete file list with one capped at 300, and reports it as complete

**What.** `deploy.php:71` sets `$COMMIT_CAP = 20` and `:152-162` switch to the compare API whenever `commits[]` holds 20 or more entries, discarding `commits[]` entirely when the compare call succeeds. Two premises behind that are false:

- GitHub's webhook documentation, fetched 2026-10-16 (`/en/webhooks/webhook-events-and-payloads`, push event, `commits`): "The array includes a maximum of 2048 commits." The 20 figure in `deploy-pipeline-cpanel.md` FM5 and F5, in the packet, and in the code comment at `deploy.php:35-39` is not GitHub's webhook limit. So the pre-change code already received the full list for any push under 2048 commits.
- GitHub's compare documentation, same day (`/en/rest/commits/commits`, "Working with large comparisons"): "The list of changed files is only shown on the first page of results, and it includes up to 300 changed files for the entire comparison." The packet's claim that the compare API "lists every file in the range regardless of commit count" is false.

`compareFiles()` at `:277-292` never compares `count($data['files'])` against 300, so a capped list is indistinguishable from a complete one, and `$truncated` stays `false`.

**Where.** `brandgeo/web/deploy.php:71`, `:152-162`, `:277-292`; false claim in the comment at `:35-39`.

**Demonstrated, not inferred.** GET-only, the exact URL shape the script builds at `:280`:

```
compare 6d2117bff813eac036abb3a23ec6060816a7b47b...1612cc9428a38acf5b75aad6a7df4351259016b0?per_page=250
  commits 99, total_commits 99, files 300
  first .claude/agents/gtm-analyst.md   last brandgeo/web/images/og/og-bg-087.png
  web files in the list: 187
commit 721a0d4e8c913d562bb72fd897570900fe4ec83e (inside that range)
  brandgeo/web/bg-105.html   IN compare list
  brandgeo/web/blog.html     IN compare list
  brandgeo/web/index.html    MISSING from 300-file compare list
  brandgeo/web/sitemap.xml   MISSING from 300-file compare list
```

The list is in path order and cut at 300, so every web path sorting after the cut is dropped. Because `.claude/`, `brandgeo-dashboard/` and the `brandgeo/web/` files before it sort first, the files cut are typically `index.html`, `sitemap.xml`, `site.js`, `news/` and later: the homepage and the sitemap.

**How it breaks.** Any single push of 20 or more commits whose range changes more than 300 files repo-wide. The deployer fetches the first-300 subset, writes `"source": "compare", "truncated": false, "expected": N, "deployed": N`, and the site silently keeps the old homepage and sitemap. The status file, which is now the success signal, affirms the under-deploy. The pre-change deployer would have fetched all of them from `commits[]`. No attacker is involved; this is a correctness regression reachable by the repository's own batched-push habit.

**Fix direction.** Make the compare list additive and honest: (a) set `$COMMIT_CAP` to 2048, GitHub's documented webhook cap, so the compare path runs only when `commits[]` really is a prefix; (b) in the compare branch, take the union of the compare list and every `added` and `modified` path in `commits[]`, never the compare list alone; (c) in `compareFiles()`, report a cap hit when `count($data['files']) >= 300` and set `truncated: true`; (d) correct the comment at `:35-39`, FM5 and F5 in `deploy-pipeline-cpanel.md`, and the packet text. Re-verify with a signed local run over the range above, asserting that `index.html` and `sitemap.xml` land. Owner: `bg-backend` (packet `scope_write` lists `deploy.php` under the orchestrator; route through `bg-orchestrator` for the packet).

**Interim mitigation, for the owner, PowerShell, run from the repository root:** before any push, count what will go out and split if it is 20 or more.

```powershell
git fetch origin; git rev-list --count origin/main..HEAD
```

### R2. MINOR. F1 is still live for `images/_staging/`

**What.** The deny rules added at `.htaccess:71-97` cover `article-builder.html` and `.bak`/`.prev`, but nothing covers `images/_staging/`, which the original audit listed as confirmed live. The deployer will not re-publish it (`deploy.php:74`), and deletions are never propagated, so the copies already in the docroot stay public.

**Where.** `brandgeo/web/.htaccess:65-97`. Live: `GET https://getbrandgeo.com/images/_staging/n1.png` 200, 59855 bytes. The local directory holds ten files (`n1.png` to `n4.png`, five `_cand_bg012_*` images, one more).

**How it breaks.** Anyone requesting a staging path gets an unpublished candidate image. Severity is MINOR, not higher, because the same files are in the public repository's history, so nothing confidential is disclosed; it is a stated closure that did not happen.

**Fix direction.** Inside the existing `<IfModule mod_rewrite.c>` block, which LiteSpeed already honours on this site, add `RewriteRule ^images/_staging/ - [F,L]`; then probe that `GET /images/_staging/n1.png` answers 403. Owner: `bg-web`.

### R3. MINOR. A failed backup turns the F6 guard off silently

**What.** At `deploy.php:202-207` a failed `copy()` to `deploy.php.prev` leaves `$backedUp` false; the new `deploy.php` is still written at `:209-211`, and because `:215` arms the self-check only when `$backedUp` is true, no self-check runs. The status file has no field for this; only the server log line at `:206` records it. Separately, `rollback: false` means both "no rollback needed" and "rollback attempted and failed" (`:234-236`); only the `failed[]` entry `deploy.php (self-check)` tells them apart.

**How it breaks.** If `/home/getbran1/repositories/` is ever unwritable (quota, permissions), a broken `deploy.php` is installed with no check and no backup, the public status file shows a clean `deployed` count, and the next push fails with no automatic recovery: FM6 exactly, with a status file that says otherwise.

**Fix direction.** Do not write `deploy.php` when the backup failed (count it under `failed` with reason `no backup`), and add a `self_check` field with a fixed vocabulary: `none`, `ok`, `rolled_back`, `rollback_failed`, `skipped_no_backup`. Owner: `bg-backend`.

### R4. INFO. The rate-limit fallback raises a false alarm

`deploy.php:160` and `:164` set `truncated: true` whenever a push of 20 or more commits cannot reach the compare API (60 unauthenticated requests an hour per outbound IP, and a shared host's IP is shared with other tenants). Under the 2048 cap, `commits[]` was complete, so this is a false truncation report, not an under-deploy. Closed for free by R1 (a).

### R5. INFO. A deletion of `main` writes a status file with a zero sha

A push event that deletes `refs/heads/main` carries `after` as forty zeros, which passes `/^[0-9a-f]{40}$/` at `:108`. The run fetches nothing (`commits` empty) and overwrites the status file with `sha` of forty zeros. Harmless and requires the owner to delete `main`; fix by rejecting an all-zero `after` beside the existing all-zero check for `before` at `:110`.

### R6. INFO, PRE-EXISTING. Two overlapping runs can leave the older one in place

Nothing serialises runs. Two pushes landing within one run's duration execute concurrently; each fetch is pinned to its own sha (`:196`), so whichever writes a shared file last wins, and the older run can finish last and overwrite both newer files and the status file. The status file now makes this visible (its `sha` would be the older commit), which it was not before. Fix direction: an `flock` on a lock file under `/home/getbran1/repositories/`, held for the whole loop.

## Attack on the compare request, and on the write path

Every item below was checked against the code; none yields a finding.

- **Host and repo are fixed.** `compareFiles()` builds `https://api.github.com/repos/$ownerRepo/compare/$before...$after?per_page=250` at `:280`; `$ownerRepo` is the constant at `:62`; `$after` must match `/^[0-9a-f]{40}$/` at `:108`; `$before` must match the same pattern or becomes `''` at `:110`, and `''` disables the compare call at `:152`. No payload byte reaches the host, the repo segment, or the query string. Cross-repository compare syntax (`owner:branch`) cannot pass the hex pattern.
- **Raw fetch is fixed.** `:196` builds `https://raw.githubusercontent.com/$OWNER_REPO/$sha/` plus `rawurlencode($path)` with only `%2F` turned back into `/`. `?` and `#` are encoded, so the path cannot add a query or fragment; a literal `%2F` in a filename is encoded to `%252F` first and is not affected by the replace.
- **Redirects.** `httpGet` follows redirects (`:328`), but only the first hop is chosen by this script, and it is always a GitHub host; a redirect is GitHub's answer, not the payload's.
- **Path traversal and writing outside the docroot.** `$rel` is the path minus `brandgeo/web/`; any `..` substring is refused at `:186` before any fetch or write, and the destination is `$DEPLOYPATH . $rel` at `:199`. A leading slash would produce a double slash inside the docroot, not an absolute path. Compare-API filenames are real git paths of this repository, which cannot contain a `..` component or a NUL; a backslash is a literal character on Linux. A compare filename therefore cannot write outside the docroot.
- **Renames do not delete.** `compareFiles()` keeps only `filename` for `renamed` and `copied` (`:288-289`) and never reads `previous_filename`; `removed` is excluded. On the `commits[]` path only `added` and `modified` are read (`:166`). The old name of a renamed file stays live, as designed.
- **Non-main refs.** Anything other than exactly `refs/heads/main` answers 200 `Ignored` at `:103-104`, before the acknowledgement and before any write, so no status file is written for a branch or tag push.
- **Environment overrides.** `getenv('BRANDGEO_*')` at `:64-68` cannot be set by a request: request headers reach the SAPI environment only with an `HTTP_` prefix. Not observable from outside whether any is set in production; the status file's `outside docroot` is consistent with the defaults.

Residual risk, not a finding because it needs the secret: the HMAC is the only trust anchor, and the signature covers the body with no timestamp or nonce, so a holder of the secret, or of a captured genuine delivery, can direct a deploy at any commit GitHub will serve under this repository's raw path. Treat the secret as equivalent to write access to the live site. It was moved out of the docroot today and has never been in git; rotating it is cheap if any doubt ever arises.

## Accessibility

Not applicable: no rendered page, style or interactive element changed. The only served artefact added is `deploy-status.json`, a machine-read file.

## Regression surface

Found by `rg` over the working tree, not by intuition.

- `.htaccess` applies to every page on getbrandgeo.com. The new rules are additive `<Files>` and `<FilesMatch>` blocks; the CSP, headers, HTTPS redirect and `/r/` forward at `:1-63` are unchanged in content. No served file links to `article-builder.html` or `_staging` (`rg -l "article-builder|_staging" brandgeo/web` excluding `deploy.php`: 0 files). The only `.bak` under `brandgeo/web/` is the backup image; no `.prev` file exists there.
- `deploy-status.json` and `deploy.php` are referenced outside the deployer only in prose: `CLAUDE.md`, `docs/TECH-STACK.md`, `docs/ROADMAP.md`, several `docs/growth/` notes, and comments in `docs/growth/local-preview/pick-element.js:9` and `devserver.py:10`. No code consumes the status file yet; packet 030's planned `health.js` would be the first and should read it with a cache-busting query.
- Manual look owed: the first push that carries `deploy.php` itself (F6 success branch), and the first push of 20 or more commits after R1 is fixed.

## Data and claim integrity

| Claim | Where | Traced to | Result |
|---|---|---|---|
| GitHub caps the webhook `commits[]` at 20 | `deploy.php:35-36`, packet item 2, `deploy-pipeline-cpanel.md` FM5 and F5 | GitHub webhook docs: 2048 | **False** (R1) |
| The compare API lists every file regardless of commit count | packet item 2 | GitHub compare docs: up to 300 files | **False** (R1) |
| The `.htaccess` deny rules close F1 for copies already live | packet, `.htaccess` section | Live probes | **Partial** (R2) |
| The F6 success branch "is proven by this very push" | packet line 81 | Push `ca31195` ran the old deployer; `1612cc9` carried no web file | **False as written**; section 14 of the QA doc states the correct order |
| The compare URL cannot be steered to another host or path | `deploy.php:278-279`, packet "Then" | Code trace above | True |
| Status file carries no secret | `deploy.php:52-54` | Live file and code | True |
| Live status values quoted by the caller | caller brief | My own GET at review time | Identical, field for field |

## What was not checked

- The F6 success branch: write succeeds, self-GET answers 403, backup kept. It has never run in production and cannot be run without a push that carries `deploy.php`.
- Whether PHP opcache on this host could serve the previous compiled `deploy.php` to the self-GET for a few seconds after the rename, which would make the self-check test the old copy. Not observable without server access.
- Whether a LiteSpeed entry-process limit could answer the self-GET with 503 or 508 while the deploying process still holds a worker, which would roll back a healthy deployer. The retry at `:230` covers only a failed request (`0`), not a wrong status.
- The self-check proves only that the new file parses, loads the secret and reaches the signature gate; a logic error after `:99` would pass it. Design limit, recorded so it is not mistaken for a full health check.
- The live `deploy-secret.php` deny rule (file absent, 404); the server-side `deploy.log`; whether the docroot holds stray `*.tmp_<pid>` files from any interrupted write; the outbound IP's share of GitHub's unauthenticated rate limit.
- Whether `raw.githubusercontent.com` serves a commit that exists only in a fork under this repository's path. Relevant only to a holder of the secret (residual risk above); not tested, because testing it means creating a fork commit.
- Caching of `deploy-status.json`: the response carries `Last-Modified` and no `Cache-Control`; no stale read was observed, but an observer should compare `sha` and `Last-Modified`, or add a query string.
- `git diff --stat` and every git-derived check: forbidden by the caller; substituted with the public compare API for the commit.

## What is still owed

1. **R1 fix and re-verify** (`bg-backend`, then `bg-verify`): union, 2048 cap, 300-file truncation flag, corrected comments and audit text. Until then, no push of 20 or more commits (command under R1).
2. **R2** (`bg-web`): one `RewriteRule` line, then probe `images/_staging/n1.png` for 403.
3. **R3** (`bg-backend`): refuse to install `deploy.php` without a backup; add the `self_check` field. Can ride in the same edit as R1.
4. **The first push that carries `deploy.php`** under the 1.1 code (it will be the R1 fix itself). Afterwards the owner checks, in PowerShell:

```powershell
(Invoke-WebRequest -Uri ("https://getbrandgeo.com/deploy-status.json?t=" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) -UseBasicParsing).Content
```

   Expected: `sha` equal to that push's commit, `rollback` false, `failed` empty, and (after R3) `self_check` `ok`. Anything else is a rollback or a failure and comes back here.
5. **Deletions are not propagated**, unchanged by design: a file removed from the repo stays live until removed by hand in cPanel or denied in `.htaccess`. R2 is one instance of this.
6. Correct `deploy-pipeline-cpanel.md` FM5 and F5 (the 20-commit premise) so the next reader does not rebuild on it.
