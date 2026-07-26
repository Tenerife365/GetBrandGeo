# QA: getbrandgeo.com cPanel deploy pipeline

**Verdict: PASS WITH FINDINGS.**

The pipeline works and is currently delivering. Live content is byte exact against
the specific commits that deployed it, verified over HTTP. Seven findings are
recorded below, one of them a live exposure.

**The 10 second ceiling is CONTRADICTED up to 20 files per push, by measurement
rather than by reading.** Constantin authorised deployment mid-audit, so section
8's ladder was run against real content: 59 pages in batches of 2, 5, 12, 20 and
20, all 59 verified live byte for byte, nothing lost. Batch 1 is the case that
previously returned 504 and copied nothing; it now completes in about a second.

The reason is a line the code's own comments do not credit:
`ignore_user_abort(true)` at `:72` means PHP finishes the copy loop even when
GitHub hangs up, so "504 and copied nothing" is not reachable by the current code.
The real constraint is `set_time_limit(120)` against a loop running at about 0.25
seconds per file, which puts the practical limit above the 200 file cap at `:42`.

F7 is resolved by that deploy. F1 remains open and is the one live exposure.

| Field | Value |
|---|---|
| Packet | `006-bg-orchestrator-to-bg-verify-deploy-cpanel` |
| Agent | `bg-verify` (opus) |
| Date | 2026-07-26 |
| Subject | `brandgeo/web/deploy.php` at `d183c46`, working tree identical |
| Repo HEAD at audit time | `9ef5c6892397a86777f18ed698d838d1d36ac199` |
| Write scope | this file only |
| Nature | audit and documentation, no remediation, no fixes proposed |

Everything asserted as confirmed below was either read from a file in this repo at
a cited line, or observed over HTTP in this session with the output pasted.
Anything else is in "Could not verify".

---

## 1. What this pipeline is

`getbrandgeo.com` is static HTML served from a cPanel docroot on a LiteSpeed host.
It deploys by GitHub push webhook to a single PHP script,
`brandgeo/web/deploy.php`, which downloads changed files one at a time from
`raw.githubusercontent.com` and writes them into the docroot.

Netlify is not involved in this pipeline. `app.getbrandgeo.com` is a separate
pipeline owned by a different session and is out of scope here.

Server confirmed as LiteSpeed:

```
--- server ---
LiteSpeed
```

Shell access is disabled under CageFS, so PHP `shell_exec` and `exec` are not
available and no git-based or rsync-based deploy can run on this host. That
constraint is why the deployer is pure PHP plus HTTPS. This is stated in the
script header at `brandgeo/web/deploy.php:3-8` and is a starting fact from the
packet that I could not independently re-confirm without server access.

### Configuration, `deploy.php:37-42`

| Constant | Value | Line |
|---|---|---|
| `$OWNER_REPO` | `Tenerife365/GetBrandGeo` (public) | :38 |
| `$WEB_PREFIX` | `brandgeo/web/` | :39 |
| `$DEPLOYPATH` | the live docroot, trailing slash | :40 |
| `$LOGFILE` | a path outside the web root | :41 |
| `$MAX_FILES` | `200` per push | :42 |

Server paths are in the file and are not reproduced here beyond what is needed,
since the repo is public.

---

## 2. The pipeline as an ordered sequence

Line ranges are `brandgeo/web/deploy.php`.

| Step | Lines | What happens | Outcome on failure |
|---|---|---|---|
| 1 | :44-47 | Load `deploy-secret.php` from the script's own directory. | File missing: **500** `Not configured` |
| 2 | :48-50 | Require `DEPLOY_WEBHOOK_SECRET` to be defined and non-empty. | **500** `Not configured` |
| 3 | :53-55 | Read the raw request body and the `X-Hub-Signature-256` header. | Either empty: **403** `Forbidden` |
| 4 | :56-57 | Compute `sha256=` + `hash_hmac('sha256', payload, secret)` and compare with `hash_equals`. | Mismatch: **403** `Forbidden` |
| 5 | :60-63 | JSON decode, require `ref === 'refs/heads/main'`. | Any other ref, or non-array: **200** `Ignored` |
| 6 | :65-66 | Read `after`, require exactly 40 lowercase hex. | **200** `No commit` |
| 7 | :72-94 | Acknowledge: `ignore_user_abort(true)`, `set_time_limit(120)`, disable zlib compression, emit **202** with `Content-Type`, `Connection: close`, explicit `Content-Length`, write the body, drain up to 10 output buffers, `flush()`, then call `fastcgi_finish_request()` or `litespeed_finish_request()` if either exists. | See section 6 |
| 8 | :96-105 | Walk `commits[]`, collect `added` and `modified` paths that start with `brandgeo/web/`, deduplicated by path. | Empty set is legal, loop simply does not run |
| 9 | :107 | Open the log buffer with a UTC timestamp, the sha, and the file count. | |
| 10 | :109-128 | For each path: enforce the 200 file cap, strip the prefix, reject `..`, build the raw URL pinned to `after`, GET it, write to a `.tmp_<pid>` file, `rename()` into place. | Fetch non-200: `FETCH FAIL: <rel>` logged, file skipped. Write or rename failure: temp unlinked, `WRITE FAIL: <rel>` logged |
| 11 | :129-130 | Append the whole buffer to the log with `FILE_APPEND \| LOCK_EX`. | |
| 12 | :133 | `exit`. | |
| 13 | :136-159 | `httpGet()` helper: curl with `FOLLOWLOCATION`, 20s timeout, `SSL_VERIFYPEER => true`, returns the body only on HTTP 200; falls back to `allow_url_fopen` with a 20s stream timeout; returns `null` if neither is available. | |

Two details in step 10 that matter. The write is atomic: temp file then `rename()`
(`:120-121`), so a browser never reads a half-written file. And the fetch is
pinned to the push's `after` sha (`:114`), not to the individual commit that
changed the file. That second detail has a consequence, see section 4.

---

## 3. The trigger, exactly

**Event.** Any HTTP POST carrying a valid `X-Hub-Signature-256` for the configured
secret. The `X-GitHub-Event` header is **never read**. What gates the request is
the payload shape, not the declared event type: `ref` must equal
`refs/heads/main` (`:61`) and `after` must be a 40 hex sha (`:66`). In practice
only a `push` event satisfies both.

**Branch filter.** `refs/heads/main` and nothing else, `:61`. A push to any other
branch, a tag push (`refs/tags/*`), or a branch delete all return **200 `Ignored`**
and copy nothing.

**Path filter.** `strpos($path, 'brandgeo/web/') === 0`, `:101`. Prefix match on the
repo-relative path. Nothing outside `brandgeo/web/` is ever fetched or written.

**The no-op case.** A push to `main` that touches no file under `brandgeo/web/`
still passes every gate and still returns **202**. `$changed` comes out empty
(`:97-105`), the loop at `:110` does not execute, and a log entry is written
recording `files=0` and `=== done: 0/0 file(s) ===`. Nothing is copied. This is
the normal outcome for every dashboard-only or docs-only commit, and it is
indistinguishable from a successful deploy when viewed from GitHub's delivery
list. See finding F2.

---

## 4. Copy versus no-copy, per file

| Payload field | Read? | Line | Effect |
|---|---|---|---|
| `commits[].added` | yes | :99 | file is fetched and written |
| `commits[].modified` | yes | :99 | file is fetched and written |
| `commits[].removed` | **no** | :99 | **deletion is never propagated** |
| `head_commit` | **no** | n/a | not consulted at all |

**Deletions.** `:99` iterates the literal list `['added', 'modified']`. `removed`
is never read anywhere in the file. Deleting a file from the repo leaves the live
copy in the docroot indefinitely. This is deliberate and documented at `:30-31`
as a safe default for a live site. It is intentional, not a defect, but it is
load-bearing for finding F1 below: a file that should never have been public
cannot be un-published by deleting it from the repo.

**A file changed in several commits within one push.** Handled exactly once.
`:101` writes into an associative array keyed by path (`$changed[$path] = true`),
so duplicates collapse; `:105` then takes `array_keys`. The file is fetched once,
at the push's `after` sha, which is the correct final state.

**A file modified in one commit and deleted in a later commit of the same push.**
It appears in `modified` and is therefore in `$changed`. The fetch at `:114-115`
is pinned to `after`, where the file no longer exists, so `raw.githubusercontent.com`
returns 404, `httpGet` returns `null` at `:149`, and `:116` logs `FETCH FAIL: <rel>`
and moves on. The live copy is left stale. No crash, no partial write, but a
silent stale file.

**Path safety.** `:113` rejects any relative path that is empty or contains `..`,
after the prefix check. `:114` percent-encodes the path and then restores `/`
separators.

**Volume cap.** `:111` stops after 200 files and logs `cap reached at 200`.
`$changed` is reindexed by `array_keys` at `:105`, so `$i` is a plain 0-based
integer and the comparison is correct.

**Commit cap, not handled.** GitHub truncates the `commits[]` array in a push
payload at 20 commits. `deploy.php` reads only `commits[]` (`:98`) and never
consults `head_commit` or the compare API. A push containing more than 20 commits
therefore silently omits every file changed only in the commits GitHub dropped.
See finding F5.

---

## 5. Does the pipeline deploy its own deployer?

**Yes. Confirmed.**

`deploy.php` lives at `brandgeo/web/deploy.php`, which begins with `brandgeo/web/`,
so it matches the prefix filter at `:101` exactly like any page. Nothing excludes
it. `$rel` becomes `deploy.php` and `$dest` becomes `<docroot>/deploy.php`.

Confirmed live. The script is present at the docroot root and is the active
webhook endpoint; an unsigned request hits the signature gate at `:55`:

```
/deploy.php                                -> 403
```

Control, to show 403 is a real response and not a generic catch-all:

```
--- control: definitely nonexistent paths ---
/definitely-not-a-real-file-xyz123.php         -> 404
/definitely-not-a-real-file-xyz123.html        -> 404
/nope-xyz123.txt                               -> 404
```

**Consequences, both directions.**

Mid-run self-overwrite is safe. PHP has already parsed and loaded the running
script into memory before the copy loop starts, and the write is temp-plus-rename
(`:120-121`), so the running process is unaffected and no reader sees a partial
file.

The next run is not safe. A push that lands a broken `deploy.php` overwrites the
working deployer in the docroot with the broken one. From that point the pipeline
cannot repair itself, because repairing it requires a webhook delivery that the
broken script must handle. Recovery would require manual cPanel or FTP upload.
There is no staging, no syntax check, and no backup of the previous copy anywhere
in the script.

`deploy-secret.php` is **not** in the repo and is not deployable by this pipeline.
It is git-ignored at `.gitignore:7` and `brandgeo/.gitignore:5`, is absent from
`git ls-files brandgeo/web/`, and is uploaded to the server by hand per `:33-34`.
That is correct. See finding F3 for where it sits.

---

## 6. The 10 second ceiling

**Verdict: CONTRADICTED, up to 20 files per push, measured.**

This was UNRESOLVED when the audit was written. It was settled the same day by
running the section 8 ladder against real content: 59 files in five batches of 2,
5, 12, 20 and 20, every one verified live byte for byte. Nothing timed out and
nothing was lost. See "The ladder, executed" below for the measurements.

The premise the ceiling story rested on, that reaching the copy loop costs about
9.9 seconds on this host (`deploy.php:19-20`), is contradicted. Observed copy loop
throughput is roughly **0.25 seconds per file**, and the dominant cost is a
variable 0 to 7 second delay before the loop starts, which is GitHub webhook
dispatch jitter and does not scale with file count.

### What the code actually relies on

The acknowledgement block added by `d183c46` sits at `:68-94` and stacks four
independent mechanisms:

1. `ignore_user_abort(true)` (`:72`) so PHP keeps executing after the client goes
   away, and `set_time_limit(120)` (`:73`) so the fetch loop is not killed at the
   default limit.
2. `zlib.output_compression` forced off (`:76`) so the declared `Content-Length` is
   truthful. The comment at `:74-75` is correct: a compressed body under a
   plaintext length is exactly the hang this block exists to remove.
3. An explicit `Content-Length` (`:81`) plus `Connection: close` (`:79`), so a
   client that reads the declared number of bytes can consider the response
   complete without waiting for EOF.
4. `fastcgi_finish_request()` if it exists, else `litespeed_finish_request()` if
   that exists (`:90-94`).

Only mechanism 4 actually releases the connection at the server. Mechanisms 1 to 3
are necessary but not sufficient: `ignore_user_abort` governs what PHP does after
a disconnect, it does not cause one, and headers plus `flush()` only matter if the
web server forwards the bytes to the client before the script ends.

### Why the code cannot settle it

Under LiteSpeed the SAPI is `litespeed`, and whether `litespeed_finish_request()`
is exposed depends on the LSAPI build. Recent LSAPI also aliases
`fastcgi_finish_request()`, so checking that name first is not itself wrong. But
under CloudLinux `mod_lsapi`, which is what CageFS implies, the availability of
either name varies by build. The `elseif` at `:92` means only one is ever
attempted, and if neither exists both branches are skipped **silently**. There is
no `else`, no log line, and no error.

That silence is the core problem. Nothing anywhere in the script records
`php_sapi_name()`, which branch at `:90-94` was taken, or whether either function
existed. The log buffer opened at `:107` carries exactly one timestamp, computed
after the acknowledgement and before the fetch loop, and the whole buffer is
written in a single append at `:130` after the loop has finished. So the log
cannot distinguish "acknowledged at t=0.2s, loop ran until t=40s" from
"everything ran inline and GitHub waited the whole time". Both produce a log entry
that looks identical.

Reading `:68-94` tells you what the author intended. It cannot tell you what this
host does.

### What the git and HTTP record shows

Git commit times below are UTC, taken with `TZ=UTC git log`. All HTTP values are
from this session.

The last two commits touching `brandgeo/web/` were single-file commits, and each
reached the docroot in under four seconds:

| Commit | Web files | Committed (UTC) | Live `Last-Modified` | Latency |
|---|---|---|---|---|
| `662ea8e` | 1, `site.js` | 14:30:19 | 14:30:22 | **3s** |
| `4ed6a94` | 1, `index.html` | 14:31:43 | 14:31:45 | **2s** |

Both live bodies are byte exact against the specific commit that deployed them,
full body MD5 with line endings normalised, not just a first-line check:

```
/site.js
   live md5      = 086b65f3707fd2a1c8b694ef944ed89b
   commit 662ea8e = 086b65f3707fd2a1c8b694ef944ed89b   MATCH=YES
/index.html
   live md5      = 0fa116e988493565e19aebd629528770
   commit 4ed6a94 = 0fa116e988493565e19aebd629528770   MATCH=YES
```

This matters more than it first looks. `Last-Modified` records when the copy loop
wrote the file at `:121`, which happens **after** the acknowledgement at `:77`. So
those 2 and 3 seconds cover the whole chain: commit, push, GitHub webhook
dispatch, PHP start, HMAC, acknowledgement, one HTTPS fetch from
`raw.githubusercontent.com`, and one atomic write.

**That contradicts the premise the ceiling story rests on.** `deploy.php:19-20`
states that on this host the fixed cost of reaching the copy loop is already about
9.9 seconds. It is not. As of 2026-07-26 14:30 UTC the entire operation for one
file, copy included, is 2 to 3 seconds.

**Correction to an earlier reading in this audit.** Before pulling the git record I
noted the 83 second gap between the two `Last-Modified` values and called it
consistent with the ceiling still being in force. The structural half was right,
git confirms these were two separate single-file pushes. The interpretation was
wrong. The gap is just the 84 seconds between two commits, and what it actually
demonstrates is that each single-file deploy completed almost immediately. It is
not evidence of a ceiling.

The one figure I still cannot check is the packet's report that deliveries take
about 7.6 seconds after `d183c46`. The GitHub delivery list is not accessible to
me. Note that it sits oddly beside a 3 second commit-to-disk latency: if GitHub
were still waiting 7.6 seconds while the file landed at 3 seconds, that would
itself be evidence the connection is not being released.

### The 2026-07-26 sequence, reconstructed from git

| UTC | Commit | Web files | Note |
|---|---|---|---|
| 12:15:54 | `801732c` | 2, `index.html` + `site.js` | homepage hook rebuild |
| 12:22:45 | `d183c46` | 1, `deploy.php` | the acknowledgement fix itself |
| 12:23:32 | `68afbaa` | 2, `index.html` + `site.js` | build stamp added |
| 14:30:19 | `662ea8e` | 1, `site.js` | deployed in 3s |
| 14:31:43 | `4ed6a94` | 1, `index.html` | deployed in 2s |

The packet's "one-file push succeeded at 9.89s, two-file push in the same minute
returned 504 and copied nothing" maps onto `d183c46` and `68afbaa`. They are 47
seconds apart and have exactly those file counts. Nothing else in the history
fits.

If that mapping is right, the ordering is unkind to the fix. `d183c46` was itself
deployed by the OLD deployer, so the 9.89s belongs to the pre-fix code. `68afbaa`
was then the first push the new acknowledge-first code ever handled, and it 504'd
and copied nothing. On that reading the fix failed on its first outing.

Two hours later the same unchanged code was writing files three seconds after
commit. Nothing in `deploy.php` changed in between; `d183c46` is still the last
commit to touch it. The most plausible confound is warm state: `02293cc` and
`d183c46` were the first real uses of the pure-PHP deployer, with a cold opcache
and a cold CageFS mount, and by 14:30 the host was warm. That is a hypothesis, not
a measurement, and it is exactly what section 8 tests.

### The ladder, executed

Run 2026-07-26 between 21:18 and 21:23 UTC, deploying the em dash and en dash
removal pass across 59 customer-facing pages. Push time is when `git push`
returned; `Last-Modified` is read from the live site.

| Batch | Files | Pushed (UTC) | First write | Last write | Loop span | Result |
|---|---|---|---|---|---|---|
| 1 | 2 | 21:18:20 | 21:18:20 | 21:18:21 | 1s | 2/2 live |
| 2 | 5 | 21:19:59 | 21:19:59 | 21:20:00 | 1s | 5/5 live |
| 3 | 12 | 21:20:20 | 21:20:27 | 21:20:30 | 3s | 12/12 live |
| 4 | 20 | 21:21:14 | 21:21:20 | 21:21:24 | 4s | 20/20 live |
| 5 | 20 | 21:22:42 | 21:22:42 | 21:22:47 | 5s | 20/20 live |

**59 of 59 verified live**, each by full-body MD5 against the exact commit that
deployed it, with cache busting, plus a zero-dash content assertion on the live
body. Batch 5 included two nested paths under `news/`, which also exercised the
`@mkdir` at `:118`. No `FETCH FAIL`, no partial batch, no stale file.

Batch 1 is the decisive one: **2 files is the exact count that previously returned
504 and copied nothing.** It now completes in about one second.

### Why it works, and it is probably not the mechanism the code comments credit

Section 6 spent its length on whether `fastcgi_finish_request()` or
`litespeed_finish_request()` fires at `:90-94`. That question is still formally
open, and F4 still stands, but the ladder shows it matters much less than assumed,
because of a line that received no attention:

```php
ignore_user_abort(true);          // :72
```

With that set, PHP continues executing after the client disconnects. So even if
GitHub abandons the delivery at 10 seconds and records a 504, the copy loop keeps
running to completion under the 120 second limit set at `:73`. **The "504 and
copied nothing" outcome is not reachable by the current code.** A 504 would now
mean only that GitHub stopped listening, not that the deploy failed.

That reframes the whole risk. The binding constraint is not GitHub's 10 second
clock at all, it is `set_time_limit(120)` at `:73` against a loop running at about
0.25 seconds per file. That implies a practical ceiling somewhere near 400 files,
comfortably above the `$MAX_FILES` cap of 200 at `:42`. The cap binds first, and it
binds safely, with a logged `cap reached at 200`.

This does not retire F4. Nothing still records which branch fired, and the
distinction would matter again if `ignore_user_abort` were ever removed.

### What would have settled it, retained for future changes

One observation, and only one: **the relationship between file count in a push and
GitHub's reported delivery duration.**

- If the early release works, duration is flat and independent of file count. A
  1 file push and a 12 file push both report roughly the same duration, and both
  copy everything.
- If it does not work, duration scales with file count and crosses 10 seconds at
  some N, producing a 504 in the delivery list and a docroot where nothing moved.

Section 8 is the procedure. A server-side probe printing `php_sapi_name()` and
`function_exists()` for both names would answer the mechanism question directly,
but that needs a file placed on the server, which is outside this audit and
outside what an agent may do.

---

## 7. Proving a commit is actually live

### What a successful deploy looks like, in observable terms

Not "GitHub shows 202". The script returns 202 at `:77`, before the copy loop has
run and regardless of whether it later succeeds. The script's own header says so
at `:24-26`. The delivery list tells you the signature and branch checks passed.
It tells you nothing about whether a single byte reached the docroot.

A deploy is successful when all three hold for each file the push touched:

1. `GET https://getbrandgeo.com/<file>` with cache busting returns content byte
   matching the repo at the pushed sha.
2. `Last-Modified` on that URL is at or after the push time.
3. The server log carries `deployed: <rel> (<n>b)` for that file and a closing
   `=== done: N/N file(s) ===` where the two numbers match. A `done: 0/2` or a
   `FETCH FAIL` line is a failed deploy that GitHub reported as 202.

Point 3 needs server access. Points 1 and 2 do not, and are the command below.

### The command

PowerShell on Windows. No server access. Cache busting is explicit: a fresh GUID
in the query string plus `Cache-Control: no-cache` and `Pragma: no-cache` request
headers, so neither a CDN nor the local WinINET cache can return a stale copy.

```powershell
$repo = "C:\Users\const\Constantin Daniel Goane\BrandGEO"
$commit = "9ef5c68"
$expected = (git -C $repo show "${commit}:brandgeo/web/site.js" | Select-Object -First 1).Trim()
$url = "https://getbrandgeo.com/site.js?cachebust=" + [guid]::NewGuid().ToString()
$resp = Invoke-WebRequest -Uri $url -Headers @{'Cache-Control'='no-cache';'Pragma'='no-cache'} -UseBasicParsing
$live = (($resp.Content -split "`n") | Select-Object -First 1).Trim()
"HTTP status : " + $resp.StatusCode
"Last-Modified: " + $resp.Headers['Last-Modified']
"EXPECTED (repo @ $commit): $expected"
"LIVE     (getbrandgeo.com): $live"
if ($expected -eq $live) { "RESULT: PASS - commit $commit is live" } else { "RESULT: FAIL - live site does not match commit $commit" }
```

Change `$commit` and the two `site.js` references to check any other file. The
comparison is first line against first line because `site.js` and `index.html`
both carry a build stamp on their first meaningful line; for a file with no
stamp, compare a hash of the full body instead.

### Deploy latency, the cheapest health signal available without server access

A refinement discovered while auditing, and the closest thing to a monitor that
exists today given F2. Compare the commit time against the live `Last-Modified`:

```bash
TZ=UTC git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" log --date=format-local:'%Y-%m-%d %H:%M:%S' --pretty='%h %cd %s' -3 -- brandgeo/web/site.js
```

Then read `Last-Modified` from the command above. The difference is end-to-end
pipeline latency, because the write at `:121` happens after the acknowledgement at
`:77`. Healthy, measured on 2026-07-26, is 2 to 3 seconds for one file. A latency
that climbs with file count is the ceiling reasserting itself. A `Last-Modified`
older than the commit means that file never deployed at all.

This works only if you commit and push together. If you commit and push later, the
gap measures your habits, not the pipeline.

**Pass condition.** `RESULT: PASS`, and `Last-Modified` is at or after the time
that commit was pushed.

**Fail condition.** `RESULT: FAIL`, meaning the docroot still holds an older
build. Also treat as a fail: `RESULT: PASS` with a `Last-Modified` older than the
push, which means the file happened to be identical across the two commits and
the run proved nothing about this deploy.

### Actual output, run against the live site in this session

```
HTTP status : 200
Last-Modified: Sun, 26 Jul 2026 14:30:22 GMT
EXPECTED (repo @ 9ef5c68): /* build: 2026-07-26 hook-rebuild */
LIVE     (getbrandgeo.com): /* build: 2026-07-26 hook-rebuild */
RESULT: PASS - commit 9ef5c68 is live
```

`index.html` confirmed the same way:

```
status=200
Last-Modified=Sun, 26 Jul 2026 14:31:45 GMT
build stamp line: <!-- build: 2026-07-26 hook-rebuild -->
site.js ref: site.js?v=2026-07-26b
```

`.htaccess` deployment confirmed indirectly, since the file itself is correctly
403 to the public. The live CSP response header is byte identical to
`brandgeo/web/.htaccess:34`, including `connect-src ... https://app.getbrandgeo.com`:

```
default-src 'self'; script-src 'self' https://plausible.io https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://app.getbrandgeo.com https://plausible.io https://formsubmit.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com; form-action https://formsubmit.co 'self'; frame-ancestors 'none'
```

All four known-good facts in packet item 7 are therefore **CONFIRMED**.

---

## 8. Multi-file ceiling procedure

> **EXECUTED 2026-07-26, 21:18 to 21:23 UTC.** Constantin authorised deployment
> mid-audit, so this ladder was run against the real em dash removal content
> instead of throwaway markers. All five rounds passed, 59 of 59 files verified
> live. Results in section 6, "The ladder, executed". The procedure is retained
> below because it is the regression test to re-run after any change to
> `deploy.php`, `.htaccess`, the PHP version, or the hosting plan.

It is an escalating ladder, so it stops at the first failure instead of jumping
straight to a large push that tells you less. Budget about 15 minutes.

The test files are five blog articles. They are chosen because an HTML comment is
invisible to a reader, each is independently checkable over HTTP, and each is 30KB
or larger, which exercises the fetch loop realistically rather than with trivial
files. If a round fails and copies nothing, the only loss is that the marker is
absent, which is exactly the signal being measured.

**Round 1, two files.** This is the known-failing case from 2026-07-26 and is the
single most valuable data point.

1. Open PowerShell and run, exactly:

```powershell
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
foreach ($f in @("bg-005.html","bg-006.html")) {
  $p = "C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\$f"
  $c = Get-Content -Raw -Encoding UTF8 $p
  $c = $c -replace '<!-- ceiling-test [^>]*-->', ''
  $c = $c -replace '</body>', "<!-- ceiling-test $stamp --></body>"
  Set-Content -Path $p -Value $c -Encoding UTF8 -NoNewline
}
"marker = $stamp"
```

2. Write down the printed `marker` value. You need it in step 6.
3. Commit and push, one session only, no other git running:

```bash
git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" add brandgeo/web/bg-005.html brandgeo/web/bg-006.html
```

```bash
git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" commit -m "test(deploy): 2-file ceiling probe"
```

```bash
git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" push
```

4. Note the wall-clock time of the push to the second.
5. Open `https://github.com/Tenerife365/GetBrandGeo/settings/hooks`, click the
   webhook pointing at `getbrandgeo.com`, open the **Recent Deliveries** tab, and
   click the newest delivery. Record two things from the Response tab: the **HTTP
   status code** (202, or 504) and the **duration in seconds** shown next to the
   delivery. The duration is the measurement that matters.
6. Wait 60 seconds, then verify the copy loop actually ran, which the delivery
   list cannot tell you. Substitute your marker from step 2:

```powershell
$marker = "PASTE-THE-MARKER-FROM-STEP-2"
foreach ($f in @("bg-005.html","bg-006.html")) {
  $u = "https://getbrandgeo.com/$f" + "?cachebust=" + [guid]::NewGuid().ToString()
  $r = Invoke-WebRequest -Uri $u -Headers @{'Cache-Control'='no-cache';'Pragma'='no-cache'} -UseBasicParsing
  $hit = $r.Content -match ("ceiling-test " + [regex]::Escape($marker))
  "{0,-14} live={1}  Last-Modified={2}" -f $f, $hit, $r.Headers['Last-Modified']
}
```

**Reading round 1.** `live=True` on both files means all two copied. `live=False`
on both means the copy loop never reached them, and if the delivery still showed
202 that is finding F2 in action. A split result, one True one False, means the
loop started and was killed partway, which is the strongest possible evidence
that the connection was never released.

**Round 2, five files.** Only if round 1 came back all `True`. Repeat steps 1 to 6
with the file list `@("bg-005.html","bg-006.html","bg-007.html","bg-008.html","bg-009.html")`
in both the marker snippet and the verification snippet, and add all five to the
`git add` line.

**Round 3, twelve files.** Only if round 2 came back all `True`. Same shape, file
list `bg-005.html` through `bg-016.html`.

**How to read the ladder as a whole.** Record the delivery duration from step 5
for every round. If duration stays roughly flat as file count goes 2, 5, 12, the
early release is working and the ceiling is gone: the 10 second question resolves
to **CONTRADICTED**. If duration climbs roughly in proportion to file count and a
round returns 504 with `live=False`, the release is not taking effect on this SAPI
and the question resolves to **CONFIRMED**, with the ceiling landing at whatever N
first fails.

**Cleanup, after the last round.** Re-run the round 1 snippet with the regex
replacement only and an empty insert, or simply revert the test commits, then
push once more so the docroot loses the markers. If you push a revert, the marker
removal is itself a `modified` event and will deploy normally.

---

## 9. Failure modes

Each with its code evidence and how an observer recognises it after the fact.

### FM1. The 10 second webhook timeout

**Evidence.** `deploy.php:17-22` records it directly: a one file push at 9.89s
succeeded, a two file push in the same minute returned 504 and deployed nothing.
The fetch loop at `:110-128` is serial, one HTTPS round trip to
`raw.githubusercontent.com` per file (`:115`, `:136-159`), each with a 20 second
timeout of its own (`:141`, `:153`). Cost grows linearly with file count, and the
per-file timeout alone exceeds GitHub's whole budget.

**Recognition after the fact.** GitHub delivery shows 504. On the live site, none
of the pushed files changed, including the first one in the list, because the
whole request was torn down rather than truncated. Server log shows either no
`=== Deploy ===` block for that sha or a block whose `done: N/M` has N less than M.

### FM2. 202 returned regardless of outcome

**Evidence.** `:77` sets the 202 and `:82` writes the body, both before `$changed`
is even built at `:97-105`. The script says so at `:24-26`. There is no code path
that revises the status after the loop; `:132-133` notes the connection is
already closed.

**Recognition after the fact.** This is the one that hides the others. A green
delivery list with a stale live site. The only reliable tell is the HTTP check in
section 7, or the `done: N/M` line in the server log. Treat a 202 as "the request
was well formed", never as "the deploy happened".

### FM3. Silent per-file fetch failure

**Evidence.** `httpGet` returns `null` on any non-200 (`:149`) or on a curl error,
and `:116` logs `FETCH FAIL: $rel` then `continue`s. The push as a whole still
reports success at the HTTP layer. Triggers include a raw.githubusercontent
outage, the 20 second per-file timeout at `:141`, and the modified-then-deleted
case in section 4.

**Recognition after the fact.** One file stale while others from the same push
are current. `Last-Modified` on the stale file is older than its siblings. Server
log carries a `FETCH FAIL` line and a `done: N/M` with N less than M.

### FM4. Silent write failure

**Evidence.** `:121-127`. If `file_put_contents` or `rename` fails, for example on
a full disk or a permissions problem in a subdirectory created by `@mkdir` at
`:118`, the temp file is unlinked and `WRITE FAIL: $rel` is logged. The `@` on the
`mkdir` suppresses any error from directory creation itself.

**Recognition after the fact.** Same signature as FM3 from outside: one stale
file, healthy siblings. Distinguishable only in the server log, `WRITE FAIL`
rather than `FETCH FAIL`.

### FM5. Push with more than 20 commits

**Evidence.** `:98` reads `$event['commits']` only. GitHub truncates that array at
20 commits per push payload. `head_commit` is never consulted and there is no
compare-API fallback.

**Recognition after the fact.** Nearly invisible. Delivery 202, log shows a
plausible `done: N/N`, and the site is simply missing changes from the oldest
commits in the push. Most likely to bite after a long period of local work pushed
in one go, which is a realistic pattern in this repo.

### FM6. Broken deployer overwrites the working deployer

**Evidence.** Section 5. `deploy.php` matches its own prefix filter at `:101`, and
there is no exclusion, no syntax check, and no backup copy anywhere in the script.

**Recognition after the fact.** Every subsequent delivery returns 500 or a PHP
error page instead of 202, and nothing deploys until the file is replaced by hand
over cPanel or FTP.

### FM7. Files never touched by any post-webhook push are never deployed

**Evidence.** The pipeline is purely diff-driven off push payloads (`:98-104`).
There is no full-sync path, no manifest, and no reconciliation against the repo
tree. A file only reaches the docroot if some push after the webhook went live
listed it in `added` or `modified`.

**Recognition after the fact.** A file whose repo content and live content differ
with no recent failed delivery to explain it. This compounds FM1: the two files
from a 504'd push stay stale permanently, not until the next push, because the
next push will not mention them. This is the likeliest explanation for stale
content that nobody can trace to a specific failure.

---

## 10. Findings

Recorded with evidence and an owning agent. No fix is proposed here, per the
packet. Remediation belongs to later packets.

| ID | Severity | Finding | Owner |
|---|---|---|---|
| F1 | **High, live exposure** | Repo files never intended to be public are live in the docroot | `bg-web` |
| F2 | High | Deploy success is unobservable from GitHub; no health signal exists outside the server log | `bg-backend` |
| F3 | Medium, latent | `deploy-secret.php` sits inside the public docroot with no deny rule | `bg-backend` |
| F4 | Medium | No instrumentation to answer the section 6 question | `bg-backend` |
| F5 | Medium | Pushes over 20 commits silently under-deploy | `bg-backend` |
| F6 | Low | `deploy.php` can overwrite itself with a broken copy | `bg-backend` |
| F7 | **High, operational** | 59 uncommitted web files are queued behind a pipeline whose only recorded multi-file failure was at 2 files | `bg-web`, sequencing by Constantin |

### F1. Non-public repo files are live. Confirmed, not theoretical.

Packet item 5 asked whether files in the repo but deliberately not public can be
pushed into the docroot, and whether anything excludes them. **Nothing excludes
them.** The only filter is the `brandgeo/web/` prefix at `:101`. There is no
ignore list, no extension filter, and no allowlist anywhere in the script.

Confirmed live, all returning 200:

```
/article-builder.html                      -> 200  len=33209
/images/bg-004-hero-old-pil.png.bak        -> 200  len=250410
/images/_staging/n1.png                    -> 200  len=59855
```

Control, same session, showing that 404 is the genuine response for a missing
file so these 200s are real:

```
/definitely-not-a-real-file-xyz123.html        -> 404
```

`article-builder.html` is an internal tool. `CLAUDE.md` §6.4 step 6 records that
it and `images/bg-004-hero-old-pil.png.bak` were deliberately excluded from the
2026-07-08 manual cPanel upload precisely because they are not meant to be public.
Both are tracked in git under `brandgeo/web/`, so the webhook pipeline undoes that
decision automatically the moment either file is touched.

Scope of the exposure. `git ls-files brandgeo/web/` returns 134 tracked files.
Deployable and not intended as public content, at minimum:

- `brandgeo/web/article-builder.html`, internal tool, 33KB, live
- `brandgeo/web/images/bg-004-hero-old-pil.png.bak`, backup artifact, 250KB, live
- `brandgeo/web/images/_staging/`, 10 candidate and staging images, at least one
  confirmed live
- `brandgeo/web/deploy.php`, correct to be live, but only because it is the
  endpoint

Two aggravating factors. `Options -Indexes` at `.htaccess:47` prevents directory
listing, so this is not trivially discoverable by browsing, but every one of these
paths is public in the git history of a public repo, so obscurity is worth
nothing here. And because `removed` is never propagated (section 4), deleting
these from the repo will **not** remove them from the live site.

**How they got there, now settled by the git record.** They did not arrive via this
pipeline. Two independent proofs:

1. `article-builder.html` and `faq.html` both carry `Last-Modified: Fri, 24 Jul
   2026 10:02:19 GMT`, to the second. The current pure-PHP deployer was committed
   at `02293cc`, `2026-07-24 10:06:42 UTC`, four minutes and twenty three seconds
   **after** those files were written. Code that did not exist yet cannot have
   written them.
2. `article-builder.html` has only two commits in its entire history, the most
   recent being `4de0358`, `2026-07-17 23:10:29 UTC`. No push touched it on
   2026-07-24 at all.

So a bulk operation on 2026-07-24 around 10:02 UTC, either a manual cPanel or FTP
upload or one of the two earlier deployer attempts (`01c2e56` at 06:46:46 UTC,
`aef0729` at 08:29:48 UTC), placed the whole tree including these files.

This changes the provenance, not the finding. F1 stands unchanged: nothing in the
current `deploy.php` excludes these paths, so the next push that touches any of
them re-publishes it, and `removed` is never propagated so deleting them from the
repo will not take them down. The `_staging/` images and the `.bak` were likewise
last committed in `4de0358` and `4122a03` respectively, neither recent.

### F2. Deploy success is unobservable outside the server

Section 9 FM2. The 202 at `:77` precedes all work, so GitHub's delivery list
cannot distinguish success, partial copy, and total failure. The only
authoritative signal is `$LOGFILE` at `:41`, which lives outside the web root and
is therefore unreadable without cPanel File Manager or FTP. There is no status
endpoint, no deployed-sha marker file, and no notification on failure. Every
routine verification currently requires either a human opening cPanel or the
manual HTTP check in section 7.

### F3. The webhook secret file sits in the public docroot

`deploy-secret.php` is required from `__DIR__` at `:45`, and `__DIR__` is the
docroot because `deploy.php` deploys to the docroot root (section 5). The file is
therefore web-reachable by path.

It is not currently leaking. Confirmed: PHP executes it and it emits nothing,
because it only defines a constant.

```
--- GET deploy-secret.php: body length + first bytes ---
status=200  rawContentLength=0
body starts with php open tag? False
body length chars = 0
```

The 200 rather than 404 confirms the file exists at that path, since missing files
404 on this host per the control above. No value was read and none appears here.

The exposure is conditional, which is why this is Medium and latent rather than
High. Protection rests entirely on PHP execution staying enabled for that exact
path. Any change that stops PHP handling it, a PHP version switch that leaves the
handler unmapped, a handler edit in cPanel, or an `.htaccess` change, causes
LiteSpeed to serve the raw source and disclose the webhook secret to anyone who
requests the URL. `brandgeo/web/.htaccess` contains no `<Files>` or `<FilesMatch>`
deny rule for it; the file has security headers, an HTTPS redirect, and
`Options -Indexes`, and nothing else.

### F4. Nothing records which acknowledgement branch fired

Section 6. The `elseif` chain at `:90-94` has no `else`, and neither branch logs.
The log buffer at `:107` holds one timestamp and is flushed once at `:130`, so
elapsed time inside the loop is not recoverable. `php_sapi_name()` is never
called. This is why section 6 is UNRESOLVED rather than decided, and it is the
reason a human push is needed to answer a question the code should be able to
answer about itself.

### F5. Pushes over 20 commits under-deploy silently

Section 9 FM5. `:98` reads only `commits[]`, which GitHub caps at 20.

### F6. Self-overwrite with no guard

Section 5. Deploying the deployer is by design here, but there is no syntax check,
no backup of the prior copy, and no recovery path that does not involve manual
upload.

### F7. A 59 file push queued against an untested multi-file ceiling. RESOLVED.

> **RESOLVED 2026-07-26 21:23 UTC.** Deployed in five batches of 2, 5, 12, 20 and
> 20, every file verified live byte for byte. The working tree under
> `brandgeo/web/` is now clean apart from the untracked `bg-018.html` and its
> hero image, noted below. The finding is kept in full because the reasoning is
> the reason the batching happened, and because it is the template for the next
> large content pass.

Found by pulling the working tree state, and it was the most immediately
actionable item in this report.

```
=== uncommitted changes under brandgeo/web/ ===
--- total ---
61
```

```
 59 files changed, 1210 insertions(+), 1190 deletions(-)
```

61 porcelain entries, 59 of them content changes, spanning the city and vertical
landing pages, the `bg-*` articles, `terms.html`, `support.html`, `welcome.html`,
and `thanks.html`. None of it is live. None of it can be live, because the
pipeline only ever acts on paths named in a push payload (section 9, FM7).

The risk is the shape of the eventual push, not the changes themselves. Committing
and pushing all 59 in one go produces a 59 file push against a pipeline whose only
recorded multi-file outcome is a 2 file push that returned 504 and copied nothing.
The `$MAX_FILES` cap at `:42` is 200, so the cap is not the constraint; time is.
The serial fetch loop at `:110-128` makes one HTTPS round trip per file.

Three ways this lands badly, all consistent with the code:

1. The push 504s and copies nothing, and because deletions and non-mentions are
   never revisited (FM7), those 59 files stay stale until each is touched again.
2. The loop is killed partway, leaving some pages on new markup and others on old.
   Given these are cross-linked landing pages sharing nav and footer, a partial
   deploy is a visibly inconsistent site, not a neutral one.
3. It works fine, and nobody learns anything, because success at 59 files was
   never verified beforehand.

In the event, outcome 3 is what happened, except that the ladder was run first, so
something was learned: the ceiling is not where it was thought to be, and
`ignore_user_abort` makes the feared failure mode unreachable. See section 6.

**New, found during the deploy.** `brandgeo/web/bg-018.html` and
`brandgeo/web/images/bg-018-hero.png` are **untracked in git but live on the site**
(both return 200). `bg-018.html` is linked from `bg-017.html`, `bg-019.html`, and
`blog.html`, and appears in `sitemap.xml`. They reached the docroot the same way
`article-builder.html` did, via the 2026-07-24 bulk upload, and this pipeline has
never seen them. Consequence: the live copies are the only copies. There is no
version history, and a docroot loss would not be recoverable from the repo. Not
deployed in this pass, because publishing new content is a different decision from
a copy cleanup. Owner: `bg-web`.

---

## 11. Could not verify

Plainly, with the reason for each. None of these should be read as passing.

1. **Contents of the server deploy log** at the path in `:41`. No server access,
   and the path is outside the web root by design so it is not fetchable. Every
   claim in this document about `deployed:`, `FETCH FAIL`, `WRITE FAIL`, and
   `done: N/M` lines describes what the code writes at `:116`, `:122`, `:126`, and
   `:129`, not lines I have read.
2. **Which of `fastcgi_finish_request` or `litespeed_finish_request` exists on
   this host.** Needs `php_sapi_name()` and `function_exists()` executed
   server-side. This is the crux of section 6.
3. **That shell access and `exec`/`shell_exec` are genuinely disabled.** Taken
   from `:3-8` and from the packet. Not independently confirmed.
4. **That the host is `cloud608.c-f.ro` and runs under CageFS.** From the packet.
   I confirmed only `Server: LiteSpeed` from the response header.
5. **The configured webhook URL.** A 403 from `/deploy.php` proves the script is
   live at that path and that its signature gate works. It does not prove GitHub
   is pointed there rather than at another path or another host.
6. **That the GitHub webhook secret matches `DEPLOY_WEBHOOK_SECRET` on the
   server.** Neither value is readable, and neither should be. The pipeline
   delivering current content is indirect evidence they match.
7. **The 9.89s, 504, and 7.6s delivery figures.** All from the packet and from
   `:17-22`. The GitHub webhook delivery list is not accessible in this session,
   so I re-observed none of them directly. Section 6 does identify which commits
   the 9.89s and 504 figures almost certainly belong to (`d183c46` and `68afbaa`,
   47 seconds apart with matching file counts), and contradicts the 9.9 second
   fixed-cost claim by measurement. The 7.6 second figure remains unchecked.
8. **Whether the 200 file cap at `:42` has ever been reached.** Needs the log.
9. **Whether files exist in the docroot that are not in the repo.**
   `Options -Indexes` at `.htaccess:47` blocks listing, and I probed only specific
   paths. There could be orphans from manual uploads or from files since deleted
   from the repo, which section 4 shows would never be cleaned up.
10. **Whether the server-side repo clone is used by anything.** Packet item 4
    states the clone and the docroot are different directories. `deploy.php` never
    references a clone; it fetches from `raw.githubusercontent.com` at `:114`. So
    the clone is unused by this pipeline, but whether something else uses it is
    unknown.
11. ~~How `article-builder.html` and the `_staging/` images reached the docroot.~~
    **RESOLVED by the git record, see below.**
12. **Behaviour on a force push, a merge push, or a branch creation.** Not
    exercised. The code reads `after` and `commits[]` and is agnostic to all
    three, but this was not tested.

---

## 12. What was not checked

Deliberately out of scope for this packet, listed so nobody reads their absence as
a pass.

- `brandgeo-dashboard/` and the Netlify pipeline. A parallel session owns it.
- The correctness, accessibility, or content of any page this pipeline deploys.
  This audit is about transport only.
- The CSP policy's own adequacy. I confirmed that the live header matches
  `.htaccess:34` byte for byte. Whether that policy is the right policy was not
  assessed.
- Any security property of `app.getbrandgeo.com`.
- Whether `robots.txt` or `sitemap.xml` exclude the F1 files from indexing. Worth
  checking as part of F1's remediation, not part of this audit.
- Load, concurrency, and what two near-simultaneous pushes do to each other.
  `LOCK_EX` at `:130` protects the log; nothing serialises the copy loops, and two
  overlapping runs writing the same file are saved from corruption only by the
  temp-plus-rename at `:120-121` and by distinct pids in the temp name at `:120`.

---

## 13. Handover

Nothing in this document is a fix and nothing has been applied. Remediation splits
into separate packets by owner:

- ~~F7 and section 8.~~ **DONE 2026-07-26.** 59 files deployed and verified live,
  ceiling measured, section 6 updated.
- **F1 to `bg-web`, now the top item.** The one live exposure.
  `article-builder.html`, `images/bg-004-hero-old-pil.png.bak`, and
  `images/_staging/` are publicly reachable. Deleting them from the repo will not
  take them down, per section 4, so this needs a docroot action as well as a repo
  decision. Also covers the inverse case found during the deploy: `bg-018.html`
  and its hero image are live but untracked, so the live copy is the only copy.
- **F2, F3, F4, F5, F6 to `bg-backend`.** All are `deploy.php` and `.htaccess`
  changes. F3 touches the secret's protection and F2 touches deploy integrity, so
  per AGENT-OS §2 that is Opus work, not Sonnet. F4 is now lower priority: the
  ladder answered the operational question that F4's missing instrumentation was
  blocking, though the instrumentation gap itself is real.

Operating guidance, measured rather than assumed: batches of up to 20 files deploy
reliably in about 5 seconds of copy loop. Verify with section 7 rather than with
the GitHub delivery list, which stays uninformative per F2.

No secret value, token, or credential appears anywhere in this document.
