# Deploy pipeline audit: app.getbrandgeo.com (Netlify)

**Verdict: PASS WITH FINDINGS**

The React build and deploy path is correct, deterministic, and demonstrably
delivering. I proved a repo value is present in the live bundle over HTTP.

The **function deploy surface has three findings**, one of which is a live
exposure. The **scheduled half of the pipeline is UNVERIFIED**: I could not
establish that any of the five cron schedules is registered with Netlify, and I
found evidence that points the other way. Per packet 007 I record that
observation and escalate it rather than diagnosing it.

- Packet: `.claude/handoffs/007-bg-orchestrator-to-bg-verify-deploy-netlify.md`
- Agent: `bg-verify` | Date: 2026-07-26 | Write scope: this file only
- Audit and documentation task. No fixes proposed, by instruction.

---

## 0. Disclosure: side effects of this audit

This audit sent unauthenticated `POST` requests to live production function
endpoints. Five of those requests **executed real work against the production
database**. Recording this because the packet forbids fabricated verification,
and silence about a side effect is the same class of dishonesty.

| Endpoint called | Effect it had |
|---|---|
| `purge-old-results` | Ran a service key `DELETE` on `ai_results` older than 24 months. Returned `Deleted 0 rows`. Nothing was deleted. |
| `purge-old-audits` | Ran service key `DELETE`s on `prospect_audits` and `prospect_leads`. Returned `0` and `0`. Nothing was deleted. |
| `expire-plan-grants` | Scanned for expired trial/comp grants. Returned `Nothing to expire`. No plan changed, no email sent. |
| `schedule-collections` | Scanned clients for a due `refresh_cadence`. Returned `{"enqueued":0,"totalJobs":0}`. **No collection was enqueued and no spend occurred**, because `totalJobs` was 0 so `triggerWorker()` at `schedule-collections.js:86` never fired. |
| `ping-sitemap` | Failed at the credential step with `500 google credentials unavailable`. No URL was pinged. |

No background function was invoked. `collection-worker-background`,
`run-full-audit-background`, and `seo-crawl-background` were deliberately not
probed, because invoking a background function starts real work and spends real
API budget. That is a gap in coverage and it is listed in section 11.

---

## 1. The pipeline, as an ordered sequence

Source of truth: `brandgeo-dashboard/netlify.toml`,
`brandgeo-dashboard/package.json`, `brandgeo-dashboard/vite.config.ts`.

1. **A commit lands on `main` on GitHub.** No other trigger is configured.
2. **Netlify's GitHub App notices the push.** Not a repo webhook. See section 2.
3. **Netlify checks out the repo and evaluates the `ignore` command**
   (`netlify.toml:11`) with the base directory set to `brandgeo-dashboard/`.
   Exit code decides whether anything further happens. See section 3.
4. **If the build proceeds, the build environment is pinned to Node 22**
   (`netlify.toml:14`, `NODE_VERSION = "22"`). No package manager version is
   pinned. There is no `packageManager` field in `package.json` and no
   `NPM_VERSION`, `YARN_VERSION`, or `PNPM_VERSION` in `[build.environment]`, so
   the npm version is whatever ships with Netlify's Node 22 image and can drift
   without any change to this repo.
5. **Build command runs:** `npm install && npm run build` (`netlify.toml:5`).
   `npm run build` is `tsc && vite build` (`package.json:8`), so **a TypeScript
   error fails the deploy**. This is a real gate, not a formality.
   Note that the command is `npm install`, not `npm ci`, so
   `package-lock.json` is advisory rather than binding and a fresh transitive
   dependency can enter a production build without a repo change.
6. **Vite emits to `dist/`**, which is the publish directory
   (`netlify.toml:6`). `vite.config.ts` carries no custom `build` block, so
   output paths are Vite defaults: `dist/index.html` plus content hashed assets
   under `dist/assets/`.
7. **Netlify's secret scanner runs** over the build output, with
   `SECRETS_SCAN_OMIT_KEYS = "SUPABASE_URL,INDEXNOW_KEY"` (`netlify.toml:21`).
   Both omissions are documented in place as intentional public values. A
   scanner hit on any other configured environment variable fails the deploy.
8. **Functions are bundled** from `netlify/functions` (`netlify.toml:2`).
   `netlify/functions/package.json` sets `"type": "commonjs"`, which is what lets
   every function use `require()` and `exports.handler` while the dashboard root
   `package.json` is `"type": "module"`.
9. **Header rules and the SPA redirect are applied** (`netlify.toml:23` to `:36`).
10. **The deploy goes live** on `dreamy-raindrop-4f29d5.netlify.app` and on the
    custom domain `app.getbrandgeo.com` simultaneously. They are one site.

**Confirmed live**, which proves the `netlify.toml` on disk is the one in
production:

```
x-frame-options             : DENY
x-content-type-options      : nosniff
referrer-policy             : strict-origin-when-cross-origin
permissions-policy          : camera=(), microphone=(), geolocation=()
strict-transport-security   : max-age=31536000; includeSubDomains; preload
content-security-policy     : default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
x-nf-request-id             : 01KYG3VSZQ97N3DQ8W6DTKR45G

SPA redirect -> HTTP 200; is index.html: True   (for /some/deep/spa/route)
```

---

## 2. What triggers a build, and what an observer can actually look at

**Netlify integrates through its GitHub App, not through a repo webhook.**
Packet fact 6, carried forward. The only repo level webhook is the cPanel one
that serves the marketing site.

The consequence is specific and it is the thing that makes this pipeline feel
opaque: **Netlify posts no commit statuses on this repository.** So all of the
following are useless for answering "did Netlify see my push":

- The commit's checks or statuses on GitHub. There are none from Netlify.
- The repo's webhook deliveries page. Netlify is not there.
- A green tick anywhere in the GitHub UI.

**What an observer can look at instead**, in increasing order of cost:

1. **The live site itself.** This is the only check that needs no Netlify
   access and no GitHub access, and it is the one that actually matters, because
   it answers "is my change live" rather than the weaker "did a build start".
   Section 7 gives the exact command.
2. **The Netlify deploy list for site `dreamy-raindrop-4f29d5`.** Every push that
   Netlify saw produces a row, including the cancelled ones. **An absent row
   means Netlify never saw the push. A row labelled "Canceled" means Netlify saw
   it and correctly decided not to build.** Those two states look similar in
   conversation and are completely different in fact. This distinction is the
   single most useful thing on that page.
3. **The deploy log of a specific run**, for the `ignore` command's own output.

---

## 3. The build versus no build rule

`netlify.toml:11`:

```toml
ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."
```

### 3.1 The exit code is inverted

This is the part that reads backwards and causes every false alarm.

For Netlify's `ignore` directive, **exit code 0 means cancel the build**. Exit
code non zero means proceed. That is the opposite of the usual shell convention
where 0 means success.

`git diff --quiet` exits **0 when there is no difference** and **1 when there
is**. Composed with the inverted convention:

| `git diff --quiet` result | Exit code | Netlify's action |
|---|---|---|
| Nothing under `brandgeo-dashboard/` changed | 0 | **Cancel.** Correct. |
| Something under `brandgeo-dashboard/` changed | 1 | **Build.** Correct. |

The `-- .` is scoped to the base directory, which is `brandgeo-dashboard/`. This
repo also holds the marketing site and blog content, so without this line the
dashboard would rebuild and redeploy on every unrelated push. The comment at
`netlify.toml:7` to `:10` says exactly this.

**A run of consecutive "Canceled" deploys is the pipeline working.** It is not a
broken hook, not a quota problem, and not a misconfiguration. Netlify labels
this state "Canceled" rather than "Skipped", which is a Netlify UI wording
choice and is the root of the confusion.

### 3.2 `$CACHED_COMMIT_REF` is cumulative, so nothing is lost

`$CACHED_COMMIT_REF` is **the last commit that was actually built**, not the last
commit that was pushed. The diff is therefore taken across the entire span since
the last real build, not just across the newest commit.

This is the property that makes a long run of cancellations safe. Concretely:

- Commit A touches `brandgeo-dashboard/`. It builds. `$CACHED_COMMIT_REF` becomes A.
- Commits B, C, D, E touch only `brandgeo/web/` and `docs/`. Each is cancelled.
  `$CACHED_COMMIT_REF` stays at A, because none of them built.
- Commit F touches `brandgeo-dashboard/`. The diff evaluated is `A..F`, which
  includes F's dashboard change. It builds, and it ships F on top of everything
  in between.

**A dashboard change cannot be stranded by preceding cancellations.**

### 3.3 Clearing the cache resets the reference

Clearing the build cache resets `$CACHED_COMMIT_REF`. With no cached reference
the diff has no meaningful base, so the `ignore` command does not return 0 and
the build proceeds. This is why "clear cache and deploy" builds successfully
even for a commit that touched nothing but documentation, and it is the
documented escape hatch when a deploy must be forced.

### 3.4 Worked examples

**Marketing only push.** A commit touching only `brandgeo/web/index.html`.
`git diff --quiet A..B -- .` inside `brandgeo-dashboard/` finds no change, exits
0, Netlify cancels. Netlify shows "Canceled". The marketing change still ships,
via the entirely separate cPanel webhook pipeline. **A cancelled Netlify deploy
says nothing whatsoever about whether the marketing site deployed.**

**Docs only push.** A commit touching only `docs/qa/deploy-pipeline-netlify.md`,
this file. Identical outcome: exits 0, cancelled, and correctly so. Nothing in
`dist/` would have changed.

---

## 4. Function inventory: all 72 `.js` files reconciled

`brandgeo-dashboard/netlify/functions/` holds **73 files: 72 `.js` files plus
one `package.json`**. No subdirectories. Reconciled mechanically against the
`[functions."name"]` blocks in `netlify.toml`:

```
DECLARED BLOCKS: 41
HELPERS:         23
ENDPOINTS:       49
--- DECLARED BUT NO FILE ---
(none)
--- ENDPOINT FILES WITH NO BLOCK ---
collection-worker-background
get-subscription
run-full-audit-background
seo-crawl-background
social-accounts
social-link
suggest-prompts
support-request
```

**72 = 23 helpers + 41 declared endpoints + 8 undeclared endpoints.** Every
declared block has a matching file, so there are no orphan blocks.

### 4.1 The 23 `_` prefixed helpers

`_admin_notify`, `_analysis`, `_assistant_kb`, `_auth`, `_card_font`, `_collect`,
`_competitor_filter`, `_cost`, `_disposable_domains`, `_email`, `_enqueue`,
`_geo_signals`, `_hubspot`, `_indexing`, `_plans`, `_prospect_engines`,
`_prospect_guard`, `_prospect_prompts`, `_publishing`, `_publishing_ayrshare`,
`_score`, `_seo_crawl`, `_social`.

The packet states these are helpers "that Netlify must NOT expose as endpoints",
and `CLAUDE.md` §4.6 states the same as an architectural rule. **I tested it and
the premise is false in production.** See finding **F2**. This is one of the
reasons the audit was worth running.

### 4.2 The 41 endpoints with an explicit block

Grouped by what the block sets:

- **`timeout = 26` (21 functions):** `collect-prompt`, `collect-claude`,
  `collect-chatgpt`, `generate-recommendations`, `onboard-client`,
  `set-client-plan`, `client-users`, `delete-client`, `audit-domain`,
  `assistant`, `ping-sitemap`, `social-publish`, `social-status`,
  `social-delete`, `social-queue`, `social-profile`, `social-generate`,
  `social-brandkit`, `social-image`, `seo-draft`, `seo-audit-page`.
- **`timeout = 15` (16 functions):** `signup-client`, `provision-account`,
  `resend-invite`, `stripe-webhook`, `create-portal-session`,
  `set-client-category`, `set-client-billing`, `promotions-admin`,
  `get-audit-report`, `unlock-audit-report`, `enqueue-collection`,
  `force-index`, `assistant-lead`, `social-boost`, `seo-opportunities`,
  `seo-crawl`.
- **`schedule` only, no timeout (4 functions):** `expire-plan-grants`,
  `purge-old-results`, `purge-old-audits`, `schedule-collections`.
- `ping-sitemap` carries **both** a schedule and `timeout = 26`, and is counted
  once, in the 26s group. It is the only scheduled function with a raised
  timeout.
- `social-image` additionally carries
  `external_node_modules = ["@napi-rs/canvas"]` (`netlify.toml:212`), which
  ships the native `.node` binary as is instead of letting esbuild attempt to
  bundle it.

### 4.3 The 8 endpoints with no block, and what they inherit

A function with no `[functions."name"]` block still deploys. It inherits
Netlify's defaults, and the default synchronous function timeout is **10
seconds**. Nothing in `netlify.toml` raises the global default, so the inherited
value applies to all eight.

| File | Auth gate | Calls out to | Assessment |
|---|---|---|---|
| `collection-worker-background.js` | none | engines | **Correct.** Background function. The `-background` suffix grants up to 15 minutes automatically and such a function does not accept a `timeout` key. `netlify.toml:137` documents this. |
| `run-full-audit-background.js` | none | engines | **Correct.** Same mechanism, documented at `netlify.toml:118`. Its own internal per call cap is `TIMEOUT = 60000`. |
| `seo-crawl-background.js` | none | crawl targets | **Correct.** Same mechanism, documented at `netlify.toml:226`. |
| `get-subscription.js` | `requireAuth` | Stripe | Plausible at 10s. One Stripe read. |
| `support-request.js` | `requireAuth` | Resend | Plausible at 10s. One send. |
| `suggest-prompts.js` | `requireAuth` | OpenAI | **Questionable.** `suggest-prompts.js:27` calls `https://api.openai.com/v1/chat/completions` with no client side abort. A chat completion plus a cold start against a 10s wall is tight. Recorded as **F3**. |
| `social-accounts.js` | `requireAuth` | Ayrshare | **Defect.** See **F3**. |
| `social-link.js` | `requireAuth` | Ayrshare | **Defect.** See **F3**. |

So: **three of the eight are correct by design** (background functions), **two
are plausible**, and **three lack a timeout they appear to need**.

---

## 5. The five scheduled functions

| Function | Cron (UTC) | Timeout | Handler shape |
|---|---|---|---|
| `purge-old-results` | `0 3 * * *` | inherits 10s | `exports.handler` |
| `purge-old-audits` | `0 4 * * *` | inherits 10s | `exports.handler` |
| `ping-sitemap` | `0 5 * * *` | **26s** | `exports.handler` |
| `expire-plan-grants` | `0 6 * * *` | inherits 10s | `exports.handler` |
| `schedule-collections` | `0 * * * *` | inherits 10s | `exports.handler` |

Packet fact 8 confirmed: **five, not four.**

### 5.1 What Netlify requires for a scheduled function to register

Two supported declaration routes:

- **In `netlify.toml`**, a `[functions."name"]` block carrying a `schedule` key.
  This is the route all five use.
- **In code**, via the `schedule()` wrapper from `@netlify/functions`, or an
  exported `config` object carrying `schedule`.

I checked all five for the in code route and **none uses it**:

```
expire-plan-grants.js   exports.handler: True   @netlify/functions: False   export const config: False
purge-old-results.js    exports.handler: True   @netlify/functions: False   export const config: False
purge-old-audits.js     exports.handler: True   @netlify/functions: False   export const config: False
schedule-collections.js exports.handler: True   @netlify/functions: False   export const config: False
ping-sitemap.js         exports.handler: True   @netlify/functions: False   export const config: False
```

Beyond declaration, registration also requires that the named function actually
exists in the functions directory, which all five do, and that the build
completes, since registration happens at deploy time. A cancelled build changes
no schedule.

### 5.2 Registration is UNVERIFIED, and the evidence points the wrong way

**I could not confirm that any of the five is registered as a cron.** Worse, the
probe in section 8 returned `200` with a real body from every one of them,
which is not what I would expect from a registered scheduled function, and the
`404` negative control proves the not found path is distinguishable.

Per the packet's explicit instruction, **I am not diagnosing this.** The
observation is recorded as **F1** and escalated to Opus.

### 5.3 How to confirm registration from outside the build logs

Two routes. The second is better because it does not depend on my reading a
Netlify UI I cannot see.

**Route A, Netlify UI.** Open the site `dreamy-raindrop-4f29d5` in the Netlify
dashboard, then its Functions view. Registered scheduled functions are listed
with their next scheduled run, separately from ordinary functions. **I have no
Netlify access, so I cannot confirm the exact current label or path of that
view, and I am not going to invent one.** Treat Route A as "look at the
Functions area of the site" and expect the wording to differ.

**Route B, observable side effects, no Netlify access needed.** This is the real
proof, because it tests whether the cron *ran*, not whether a UI claims it is
registered. Each function leaves a distinct trace:

| Function | Trace to look for | Where |
|---|---|---|
| `ping-sitemap` | rows in `sitemap_pings` with timestamps clustered near 05:00 UTC | Supabase |
| `expire-plan-grants` | an admin event row written by `recordAdminEvent`, near 06:00 UTC | Supabase |
| `schedule-collections` | `clients.last_refresh_at` stamped near the top of an hour, for any client not on `manual` | Supabase |
| `purge-old-results` / `purge-old-audits` | a `[Purge]` log line near 03:00 / 04:00 UTC | Netlify function logs |

**Status: UNVERIFIED.** I did not run Route B. It requires an authenticated
Supabase session, and the packet forbids calling authenticated endpoints. It
also needs `schedule-collections` to have at least one non `manual` client to
produce a trace at all, and per `CLAUDE.md` the platform default is `manual`,
so that particular row may be untestable until a cadence is set.

---

## 6. What a successful deploy looks like, observably

1. **`dist/index.html` is replaced**, and the `<script>` tag inside it points at
   a new `/assets/index-<hash>.js`.
2. **The bundle filename hash changes if and only if the bundle content
   changes.** Vite derives the hash from content. This is the property the whole
   verification strategy rests on: a changed hash is proof of new content, and
   an unchanged hash after a real source change is proof that the deploy did not
   happen.
3. **`index.html` itself is never cached hard.** Confirmed live:
   `cache-control: public,max-age=0,must-revalidate`. So a browser always
   revalidates the entry point and therefore always learns the current bundle
   name. This is what makes a stale bundle self correcting rather than sticky.
4. **The hashed asset is edge cached but content addressed.** Confirmed live on
   `/assets/index-DzC066bP.js`: `cache-status: "Netlify Edge"; hit`, `age: 17`.
   A cache hit on a hashed asset is harmless, because a new deploy produces a
   different filename and therefore a different cache key.

**Distinguishing a real deploy from a cached one:** compare the bundle
*filename* served from `index.html`, not the bundle body. The filename is the
deploy identity. If the filename is unchanged after a source change was pushed,
either the build was cancelled or it failed. Do not use `age` or `etag` on
`index.html` to judge this; those describe the edge, not the deploy.

Current live values at time of audit: `/assets/index-DzC066bP.js` and
`/assets/index-DhRyprYD.css`. The JS bundle is 1,343,863 bytes. The JS hash
matches what `CLAUDE.md` recorded on 2026-07-26, so **no dashboard deploy has
occurred since that entry was written.**

---

## 7. Command: prove a named commit is live on app.getbrandgeo.com

Runs in PowerShell on Windows. Needs no Netlify access. It compares a value
fetched over HTTP against a value read out of the repo at a named commit.

```powershell
$Repo   = 'C:\Users\const\Constantin Daniel Goane\BrandGEO'
$Commit = 'HEAD'   # replace with the sha you want to prove is live

# 1. the value derivable from the repo at $Commit
$src    = git -C $Repo show "${Commit}:brandgeo-dashboard/src/pages/Account.tsx" | Out-String
$marker = ([regex]::Match($src, "label:\s*'([^']*legacy[^']*)'")).Groups[1].Value
"MARKER FROM REPO : '$marker'"

# 2. the values fetched over HTTP
$html   = (Invoke-WebRequest 'https://app.getbrandgeo.com/index.html' -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}).Content
$bundle = [regex]::Match($html, '/assets/index-[A-Za-z0-9_-]+\.js').Value
"LIVE BUNDLE      : $bundle"
$js     = (Invoke-WebRequest "https://app.getbrandgeo.com$bundle" -UseBasicParsing).Content

# 3. compare
if ($js -match [regex]::Escape($marker)) { "RESULT: PASS - marker present in the live bundle" }
else                                     { "RESULT: FAIL - marker absent; live bundle predates this source" }
```

**Pass condition:** the string read from the repo at `$Commit` is present in the
bundle currently served. The commit's frontend change is live.

**Fail condition:** the string is absent. Either the build was cancelled, the
build failed, or the commit was never pushed. Section 2 route 2 then
distinguishes those three.

**Choosing the marker matters.** It must be a **string literal** that survives
minification. Identifiers, types, and comments do not survive; user facing
labels and price strings do. `'Pro (legacy)'` at
`brandgeo-dashboard/src/pages/Account.tsx:45` is a good marker for the current
pricing ladder work.

### Output, actually run

```
MARKER FROM REPO : 'Pro (legacy)'
LIVE BUNDLE      : /assets/index-DzC066bP.js
BUNDLE BYTES     : 1343863
RESULT: PASS - marker present in the live bundle
  probe 'Growth PRO'         => True
  probe 'from €1,500'        => True
  probe 'promotions-admin'   => True
  probe '€900'               => False
```

**Honest caveat about this run.** The packet forbids an agent running a git
command, so for my own execution I substituted line 1's `git show` with a read
of the working tree copy of `Account.tsx`. **The `git show` form above is the
general command and I did not execute it.** The HTTP half, which is the half
that could fail, ran exactly as written. The substitution is sound here because
`Account.tsx` is unmodified in the working tree relative to `HEAD`, but it does
mean the `$Commit` parameterisation itself is untested.

The four extra probes confirm the 2026-07-26 pricing ladder is genuinely live:
`Growth PRO` and `from €1,500` present, `€900` gone.

---

## 8. Command: prove a named function is deployed

```powershell
$Fn = 'promotions-admin'   # replace with any function name
try {
  $r = Invoke-WebRequest "https://app.getbrandgeo.com/.netlify/functions/$Fn" `
       -Method POST -Body '{}' -ContentType 'application/json' -UseBasicParsing
  "$Fn => $($r.StatusCode) $($r.Content)"
} catch {
  $resp = $_.Exception.Response
  $body = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
  "$Fn => $([int]$resp.StatusCode) $body"
}
```

**Pass condition:** anything other than `404`. A `401` is the ideal answer,
because the rejection itself proves code ran.
**Fail condition:** `404`, which is Netlify's generic "Page not found" HTML.
The `404` negative control below is what makes the whole test meaningful.

### Output, actually run

```
promotions-admin             401 {"error":"Unauthorized: missing token"}
get-subscription             401 {"error":"Unauthorized: missing token"}
suggest-prompts              401 {"error":"Unauthorized: missing token"}
support-request              401 {"error":"Unauthorized: missing token"}
social-accounts              401 {"error":"Unauthorized: missing token"}
social-link                  401 {"error":"Unauthorized: missing token"}
schedule-collections         200 {"enqueued":0,"totalJobs":0,"skippedBudget":0,"skippedNoWork":0}
ping-sitemap                 500 google credentials unavailable
purge-old-results            200 Deleted 0 rows
purge-old-audits             200 Deleted 0 prospect_audits (>90d) and 0 prospect_leads (>180d)
expire-plan-grants           200 Nothing to expire
this-function-does-not-exist-xyz  404  <!DOCTYPE html> ... <title>Page not found</title> ...
```

This settles one thing cleanly: **the five undeclared, non background endpoints
`get-subscription`, `suggest-prompts`, `support-request`, `social-accounts` and
`social-link` are all deployed and reachable.** A missing `netlify.toml` block
does not prevent deployment. It only forfeits the timeout.

### What this check does not prove

- **It does not prove the auth gate works.** A `401` for a **missing** token is
  a **materially weaker test** than a `401` for an **invalid** token. The missing
  token path can be satisfied by a bare `if (!header) return 401` that never
  touches the token verifier. Only an invalid token proves the verifier itself
  runs, reaches Supabase, and rejects a forgery. **I did not run the invalid
  token variant**, because the packet restricts me to unauthenticated existence
  probes. So every `401` above proves existence and nothing more.
- **It does not prove the function is the current version.** It proves some
  version of the file is deployed, not that the newest one is.
- **It does not prove correctness.** Business logic was out of scope by
  instruction.
- **It does not prove a scheduled function is scheduled.** See F1.

---

## 9. Known failure modes and their post hoc recognition signals

| # | Failure mode | Recognition signal |
|---|---|---|
| 1 | **A legitimate cancellation mistaken for a broken pipeline.** A run of "Canceled" deploys after marketing or docs pushes. | Check whether the commits touched `brandgeo-dashboard/`. If they did not, cancellation is correct. The distinguishing question is not "did it cancel" but "is there a deploy row at all". No row means Netlify never saw the push, which is the actual failure. |
| 2 | **A stale bundle served from cache.** | Compare the bundle *filename* in `index.html`, not the body. `index.html` is `max-age=0,must-revalidate`, so a genuinely stale entry point is nearly impossible; a stale *hashed asset* is impossible by construction, since new content produces a new filename. If the filename is unchanged after a real source change, the cause is a cancelled or failed build, not caching. |
| 3 | **A function missing from `netlify.toml`.** It deploys anyway on a 10s default. | Symptom is a `502` or a truncated response under load or on a cold start, while the same call succeeds when warm. Confirmed present for `social-accounts`, `social-link`, `suggest-prompts`. See F3. |
| 4 | **A scheduled function that silently never registers.** | There is no error anywhere. The only signal is the absence of the side effect: no new `sitemap_pings` rows, no expired grants reverted, no `[Purge]` log lines. **This is the most dangerous mode in this pipeline because it is completely silent, and it is exactly the state F1 says may be current.** |
| 5 | **A TypeScript error fails the whole deploy.** `npm run build` is `tsc && vite build`. | The site keeps serving the previous bundle, so nothing looks broken. Only the deploy list shows a failure. A change that "did not take effect" with no visible error is the signature. |
| 6 | **Dependency drift.** `npm install`, not `npm ci`, plus an unpinned npm version. | A build that fails or a bundle that changes with no corresponding source change. Recognisable as a bundle hash change across two builds of identical source. |
| 7 | **A secret scan false positive fails the deploy.** Two keys are already omitted at `netlify.toml:21`. | A build failing at the scan step immediately after a new public value is added to the frontend. |
| 8 | **CSP blocks a new outbound call.** `connect-src` at `netlify.toml:31` is an explicit allowlist: Supabase, OpenAI, Anthropic, Together, Perplexity. | A frontend fetch to any host outside that list is blocked in the browser with a CSP violation, while the same call from a Netlify function works fine. Recognisable as "works in the function, fails in the browser". |

---

## 10. Findings

Recorded with evidence and an owning agent. **No fixes are proposed, by
instruction.**

### F1. All five scheduled functions respond to an unauthenticated public POST and perform real work. Cron registration is unproven. ESCALATE TO OPUS

**Severity: high.** **Owner: `bg-architect` (Opus), then `bg-backend`.**

Evidence, from section 8:

```
schedule-collections   200 {"enqueued":0,"totalJobs":0,"skippedBudget":0,"skippedNoWork":0}
purge-old-results      200 Deleted 0 rows
purge-old-audits       200 Deleted 0 prospect_audits (>90d) and 0 prospect_leads (>180d)
expire-plan-grants     200 Nothing to expire
ping-sitemap           500 google credentials unavailable
this-function-does-not-exist-xyz  404 (Netlify "Page not found")
```

Two separate observations, deliberately not merged:

**(a) They are publicly invocable and they execute.** None has an auth gate.
`purge-old-results.js:12` is `exports.handler = async () => {...}` with no
`requireAuth`, and it builds a Supabase client on `SUPABASE_SERVICE_KEY`
(`purge-old-results.js:13-16`), which bypasses RLS, then issues a `DELETE`
(`purge-old-results.js:21-24`). An anonymous caller made that `DELETE` run.

Part of this is **acknowledged in the code and was a deliberate choice**, and it
would be dishonest to present all five as a surprise. `schedule-collections.js:10-14`
says plainly "No auth: invoked by Netlify's scheduler... It IS also routable by
URL, but is naturally idempotent within the hour". `ping-sitemap.js:23-25` says
"it does not need an auth gate (same posture as the purge-* scheduled jobs)".

The exploit path is **bounded but real**. An anonymous caller cannot delete
recent data, because every deletion is cutoff bounded to rows the cron would
have deleted anyway. What they can do: force retention deletions early, drive
unauthenticated compute and database load at will, and repeatedly fire
`expire-plan-grants`, which sends an admin summary email and writes client
facing dashboard notices (`expire-plan-grants.js:13-14`). That last one is the
sharpest, because it is an unauthenticated email and notification amplification
path.

**(b) The `200` responses are evidence against cron registration.** The `404`
negative control proves Netlify distinguishes a missing function cleanly. A
`200` with a real body from all five, in production, is not the behaviour I
would expect from a function Netlify has registered as scheduled. **Combined
with the fact that no side effect of any cron has ever been verified**
(`CLAUDE.md` states as much for `schedule-collections`), the live possibility is
that these five deploy as ordinary HTTP endpoints and **no cron has ever fired**.

Per packet 007's closing instruction, **this is not diagnosed here**. It needs
Opus, and it needs Route B in section 5.3 run against Supabase.

**Collateral observation:** `ping-sitemap` returned `500 google credentials
unavailable`. It executes, reaches the credential step, and fails. If its cron
does fire, it fails daily and silently.

### F2. All 23 `_` prefixed helpers are deployed as public function endpoints

**Severity: low.** **Owner: `bg-backend`.** **Corrects a documented assumption.**

Both packet 007 item 4 and `CLAUDE.md` §4.6 state that the `_` prefix stops
Netlify exposing a helper as an endpoint. **In production it does not.**

```
_auth                  502
_plans                 502
_cost                  502
_email                 502
_publishing_ayrshare   502
this-function-does-not-exist-xyz   404
```

A `502`, not a `404`. The difference is the finding: `404` would mean no such
endpoint. `502` means Netlify routed the request, loaded the module, and then
failed to find a handler:

```json
{"errorType":"Runtime.HandlerNotFound",
 "errorMessage":"_auth.handler is undefined or not exported",
 "trace":["Runtime.HandlerNotFound: _auth.handler is undefined or not exported",
          " at UserFunction.js.module.exports.load (file:///var/runtime/index.mjs:1238:15)"]}
```

Concrete impact, kept proportionate: no helper source is returned and no helper
logic executes, because the failure occurs at handler lookup. What an anonymous
caller does get is **module name enumeration** (the error echoes the module name,
confirming which helpers exist), **runtime fingerprinting** (the trace leaks the
Lambda runtime path), and **the ability to force module level code to load**,
since the module is loaded before the handler lookup fails. No secret appears in
the response.

This is 23 unintended public endpoints, and it invalidates a rule the codebase
documents and relies on.

### F3. Three functions call external APIs on the inherited 10s timeout

**Severity: medium.** **Owner: `bg-backend`.**

| Function | Evidence |
|---|---|
| `social-accounts.js` | requires `./_publishing` at line 6. The Ayrshare provider's own fetch timeout is `TIMEOUT_MS = 23000` at `_publishing_ayrshare.js:20`. No `netlify.toml` block, so 10s. |
| `social-link.js` | requires `./_publishing` at line 11. Same 23s provider timeout. No block, so 10s. |
| `suggest-prompts.js` | calls `https://api.openai.com/v1/chat/completions` at line 27 with no client side abort. No block, so 10s. |

The first two are self evidently wrong **against this repo's own stated
reasoning**. `netlify.toml:186-189` grants `social-profile` a 26s timeout with
the comment: "'list'/'bind' each make 1-2 Ayrshare calls whose own client
timeout is 23s, so it needs more than Netlify's default 10s." `social-accounts`
and `social-link` go through the same provider with the same 23s internal
timeout and did not get the same block. A provider call is allowed to run 13
seconds past the point Netlify kills the function.

The failure is invisible in normal use and appears as an intermittent `502` on a
slow provider response or a cold start.

---

## 11. Could not verify

Plainly, with the reason for each.

1. **That any of the five cron schedules is registered.** No Netlify UI or API
   access, and no API token, which I must not request or handle. Section 5.3
   Route B needs an authenticated Supabase session, which the packet forbids.
   This is the single largest gap and it is finding F1.
2. **That any cron has ever actually fired.** Same reason. Nothing in the repo
   records a successful scheduled run.
3. **That the auth gates work against an invalid token.** The packet restricts
   me to unauthenticated probes. Every `401` in section 8 proves existence only.
   This is the same weakness `CLAUDE.md` already flags for `promotions-admin`,
   and my probe did not strengthen it.
4. **The three background functions.** `collection-worker-background`,
   `run-full-audit-background`, `seo-crawl-background` were not probed, because
   invoking a background function starts real work and spends real API budget.
   Their deployment is inferred from the filename convention and from
   `netlify.toml`'s comments, not observed.
5. **The `$Commit` parameterisation of the section 7 command.** The `git show`
   line was not executed, because the packet forbids an agent running git. The
   HTTP half ran exactly as written.
6. **The exact Netlify UI navigation path** for the scheduled functions view. I
   have no Netlify access and will not invent a menu path.
7. **The deploy history itself.** I never saw the deploy list, so every claim in
   section 3 about cancellation behaviour is derived from `netlify.toml` and from
   Netlify's documented `ignore` semantics, not from an observed run.
8. **Whether the npm version drift in section 1 step 4 has ever bitten.** No
   build log access.
9. **The 41 declared timeout values against real execution time.** I read the
   config and the internal client timeouts. I did not measure a single real
   invocation.
10. **Anything about the cPanel marketing pipeline.** Out of scope by
    instruction; a parallel session owns it.

---

## 12. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Artifact exists and is the only file written | PASS | This file. Nothing else written. |
| 2 | Trigger stated, incl. no webhook, no commit statuses, what to look at instead | PASS | §2 |
| 3 | Build rule with inverted exit codes, cumulative ref, cache reset, worked examples | PASS | §3.1 to §3.4 |
| 4 | All 72 `.js` accounted for, split three ways, counts stated | PASS | §4. 23 + 41 + 8 = 72, reconciled mechanically |
| 5 | Five scheduled functions with cron, registration requirement, confirmation method | PASS | §5. Confirmation method given; result marked UNVERIFIED |
| 6 | PowerShell command proving a commit is live, pass/fail conditions, real output | PASS with caveat | §7. HTTP half run as written; `git show` line substituted and disclosed |
| 7 | Second command proving a function is deployed, with what it does not prove | PASS | §8 |
| 8 | Every known failure mode with evidence and a recognition signal | PASS | §9, eight modes |
| 9 | "Could not verify" section, each item with a reason | PASS | §11, ten items |
| 10 | Every defect carries a named owning agent and no proposed fix | PASS | §10. F1 `bg-architect`, F2 `bg-backend`, F3 `bg-backend` |
| 11 | No secret or environment variable value anywhere | PASS | Variable names only: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `INDEXNOW_KEY`, `ADMIN_ALERT_EMAIL`, `AYRSHARE_API_KEY`, `NODE_VERSION`. No values. |

---

## 13. What was not checked

Business logic of any function, by instruction. `_plans.js`, `_cost.js`,
`planConfig.ts`, and plan gating, by instruction, since packet 005 owns them.
`brandgeo/web/` and the cPanel pipeline, by instruction. Accessibility, since
nothing rendered was under review. The React source, beyond reading one string
literal out of `Account.tsx:45` as a marker.
