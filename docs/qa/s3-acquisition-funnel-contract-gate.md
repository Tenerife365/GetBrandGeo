# FAIL

Review of sprint task S3, four unpushed commits on `main`:
`660569a`, `fc97dbc`, `667099a`, `1741672`. Base `3d63afd`.
Reviewer: `bg-verify`. Date 2026-07-31. Livemode Stripe account, no test mode.

**The block is narrow and is about one item.** C2, F3, F5 and F6 are sound and
would pass on their own. The failing row is C3, the contract gate, and it fails
not because the code is wrong but because the criterion it claims to satisfy is
not satisfied: Stripe payment is still reachable today, by anyone, with no
acceptance recorded anywhere, and nothing on the receiving side notices. Moving
the links off the docroot is a real improvement and should ship. Recording C3 as
done is what must not happen.

Second blocking item, separate: the deploy sequence is not written down and the
obvious order takes self-serve revenue to zero. See F2.

---

## 1. Calibration

**1. Changed files vs declared scope.**

```
 CLAUDE.md                                          |  29 ++
 brandgeo-dashboard/netlify/functions/_terms_gate.js        | 152 ++++++
 brandgeo-dashboard/netlify/functions/accept-terms.js       | 106 ++++
 brandgeo-dashboard/netlify/functions/unlock-audit-report.js|  13 +-
 brandgeo-dashboard/src/lib/signupDomain.ts         |  99 ++++
 brandgeo-dashboard/src/pages/AuditReport.tsx       |  36 +-
 brandgeo-dashboard/src/pages/Signup.tsx            |  32 +-
 brandgeo-dashboard/src/pages/Welcome.tsx           |  36 +-
 brandgeo/web/index.html                            |  88 +++-
 brandgeo/web/site.js                               | 244 +++++++--
 db/supabase-prospect-leads-hubspot-error-migration.sql |  31 ++
 db/supabase-terms-acceptances-migration.sql        |  57 ++
 docs/ROADMAP.md                                    |  71 ++-
 docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md      |   6 +-
 docs/growth/outbound-infra.md                      | 574 +++++++++++++++++++++
 docs/qa/acquisition-funnel-audit.md                |  30 +-
 scripts/check-contract-gate.sh                     | 140 +++++
 scripts/check-funnel-accept-path.sh                | 141 +++++
 18 files changed, 1806 insertions(+), 79 deletions(-)
```

There is no handoff packet for S3, so there is no `scope_write` to check against.
That is itself a finding (P1). Measured against the AGENT-OS §1 roster, four
files sit outside the write scope of any builder that could have produced this
change: `CLAUDE.md` and `docs/ROADMAP.md` are `bg-orchestrator`'s,
`docs/growth/outbound-infra.md` belongs to no declared scope, and
`docs/qa/acquisition-funnel-audit.md` is `bg-verify`'s, meaning a builder edited
a reviewer's artifact. Not a security matter; recorded as P1 and P2.

**2. Secret scan.** 12 hits, all identifier names or prose in comments and
migration headers (`HUBSPOT_API_KEY`, `SUPABASE_SERVICE_KEY`, "password reset",
"app passwords"). **Zero secret values.** No key, token or connection string is
introduced by the diff.

**3. Acceptance criteria.** Taken from `docs/ROADMAP.md` Stream C as quoted
verbatim inside `_terms_gate.js:6-9`, since no packet exists:

> "the Stripe payment must be unreachable until the visitor has either opened
> and accepted the contract or ticked an explicit 'I have read and accept' box...
> The gate must be enforced server-side too, not only by a disabled button, or
> it is decorative."

Objectively checkable, and checked. C1b, C2, F3, F5, F6 are checkable as written.
**C3 is checkable and is not met.** See S1.

**4. Baseline before this change.** `npx tsc --noEmit` at `3d63afd`: the same
`src` tree compiles at HEAD with exit 0, and no `src` file in the diff introduces
an error, so there is no pre-existing tsc failure to attribute. `npm run build`
exit 0 at HEAD. Neither `_terms_gate.js` nor `accept-terms.js` is compiled by
either command (`tsconfig.json` has `"include": ["src"]`), so `node --check`
inside `check-contract-gate.sh` is the only syntax gate on them.

**5. Auth check guarding the most sensitive function touched.**
`accept-terms.js:38` is the most sensitive: it is the only thing that issues a
checkout URL. Its guard is
`if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return err(403, ...)`
against `_prospect_guard.js:19-25`. There is no JWT, no rate limit and no
`isInternalCaller`. An unauthenticated caller with no `Origin` header passes it.
See S2.

**6. Write access.** This session wrote exactly one file, this one. No reviewed
file was edited. Verified: the only `Write` call in this session targets
`docs/qa/s3-acquisition-funnel-contract-gate.md`.

`CALIBRATED` (with the scope irregularity recorded as P1/P2, not suppressed).

---

## 2. Acceptance criteria table

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Checkout URL absent from everything the browser is served | **PASS** | `rg -rln "buy\.stripe\.com" brandgeo/web/` returns nothing at HEAD; returns `brandgeo/web/site.js` at `3d63afd`. |
| 2 | Server refuses to issue a URL without acceptance | **PASS** | Executed `resolveCheckout` directly, 21 adversarial inputs. Every refusal returned `ok:false` and no `url`. Table in §4. |
| 3 | **Payment unreachable until the contract is accepted** | **FAIL** | The six URLs are permanent Stripe Payment Links published in the public repo at `_terms_gate.js:63-76` and in four committed docs, and `stripe-webhook.js` never reads `client_reference_id`. S1. |
| 4 | Gate enforced server-side, not only by a disabled button | **PASS** | `accept-terms.js:53-72` calls `resolveCheckout` and returns 403 before any Supabase call; the button state is never consulted server-side. |
| 5 | Acceptance recorded before a URL is issued | **PASS** | `accept-terms.js:75-82` inserts, `:84-92` returns 500 with no `url` on `insErr`. Order is insert-then-return, verified by reading the control flow. |
| 6 | `terms_acceptances` exists in production with deny-all RLS | **PASS** | `pg_class`: `terms_acceptances rls_enabled=true policy_count=0`. All 10 columns present per `information_schema.columns`. |
| 7 | `TERMS_VERSION` matches the effective date on `terms.html` | **PASS** | `_terms_gate.js:47` `'2026-07-13'`; `site.js:690` `'2026-07-13'`; `brandgeo/web/terms.html:169` `Effective date: 13 July 2026`. All three agree. Nothing enforces that they keep agreeing: F1. |
| 8 | C1b: the audit SUCCESS path offers a forward step | **PASS** | `site.js:302-305` renders `.audit-forward-link` inside `renderAuditResult`, above `function startAudit` at `:369`. Positional check in `check-funnel-accept-path.sh` confirms. |
| 9 | The forward step carries `?domain=` | **PASS** | `site.js:303` `href="' + signupUrl(domain) + '"`, `signupUrl` at `:103-107` appends `?domain=` + `encodeURIComponent`. |
| 10 | F5: report CTA is signup, not the marketing pricing anchor | **PASS** | `AuditReport.tsx:308-313` `<Link to={/signup?domain=...}>` carries `bg-brand-500 hover:bg-brand-400`; pricing survives at `:315-317` as an unstyled inline link. |
| 11 | `/signup` reads `?domain=` and stores it | **PASS** | `Signup.tsx:34-36`. |
| 12 | `/welcome` prefers the carried domain over the email heuristic | **PASS** | `Welcome.tsx:48-63`. Ordering holds; see §6(e). |
| 13 | `?domain=` is validated before storage and on read | **PASS** | `signupDomain.ts:52-56` on write via `rememberSignupDomain:64`, and again at `:73` on read. Allowlist regex at `:48`. |
| 14 | F6: `hubspot_error` records why a push failed | **PASS** | `unlock-audit-report.js:66`; column present in production, `text`, nullable. |
| 15 | `npx tsc --noEmit` | **PASS** | Exit 0, no output. |
| 16 | `npm run build` | **PASS** | Exit 0. `dist/assets/index-CkJ-HN8M.js 1,383.53 kB`, built in 6.93s. |
| 17 | `check-contract-gate.sh` fails at `3d63afd`, passes at HEAD | **PASS** (count misstated) | 5 failures at base, exit 1; `OK` and exit 0 at HEAD. The claim was 9. §5. |
| 18 | `check-funnel-accept-path.sh` fails at `3d63afd`, passes at HEAD | **PASS** (count misstated) | 9 failures at base, exit 1; `OK` and exit 0 at HEAD. The claim was 5. §5. |
| 19 | No em/en dash in new customer-facing copy | **PASS** | One hit across all added lines in `brandgeo/web/` and `src/`: `signupDomain.ts:2`, a JSDoc comment. Comment hits are not findings per the standing baseline. |
| 20 | Contrast for every new text-on-surface pair | **PASS** | 18 pairs computed, both themes, all ≥ 4.95:1. Table in §7. |
| 21 | Every new interactive element keyboard reachable, focus visible | **PARTIAL** | Reachable and focus-visible; no focus trap. A3. |
| 22 | New user-facing claims traceable | **FAIL** | "continuous tracking" / "keep watching" on a free signup, and "A copy is recorded". D1, D2. |
| 23 | No deploy-ordering hazard | **FAIL** | Two independent pipelines, wrong order kills all three Subscribe buttons. F2. |

---

## 3. Security findings

### S1 — HIGH, BLOCKING. Payment is reachable with no acceptance, and nothing detects it.

**Where.** `brandgeo-dashboard/netlify/functions/_terms_gate.js:63-76`,
and `brandgeo-dashboard/netlify/functions/stripe-webhook.js:132`.

**What.** The six URLs are Stripe **Payment Links**. A Payment Link is a
permanent, reusable, non-expiring URL: possession of the string is sufficient to
pay, an unlimited number of times, by an unlimited number of people. The change
removes them from the docroot, which stops a visitor reading them out of
view-source. It does not make them secret, because they are not secret:

- `_terms_gate.js:63-76` publishes all six in a **public repository**
  (`origin  https://github.com/Tenerife365/GetBrandGeo.git`).
- Four committed docs publish them in prose:
  `docs/audit/homepage-live-2026-07-29.md`,
  `docs/audit/getbrandgeo-homepage-2026-07-28.md`,
  `docs/strategy/pricing-and-1000-customer-feasibility-2026-07-29.md`,
  `docs/growth/CAMPAIGN-2026-07-30/product/README.md`.
- `git log -S "5kQcN63yI6io6AcdcCdZ605" -- brandgeo/web/site.js` returns
  `222054e` and `667099a`: they are in the history of the marketing bundle and
  will remain there permanently.
- The live cPanel `site.js` still serves them until the deploy lands, and
  browser and CDN copies outlive that.

**Exploit path, concrete.** Open the public repo, copy
`_terms_gate.js:70` (`growth` monthly), paste it into a browser, pay €299.
Stripe fires `checkout.session.completed`. `stripe-webhook.js:132` handles it,
resolves the tier from `price.metadata.plan` (`:53-58`), and provisions
(`:241`). `client_reference_id` appears nowhere in
`stripe-webhook.js` — grep across `netlify/functions/` returns it only in
`accept-terms.js` and `_terms_gate.js`. So a payment carrying no acceptance
reference is provisioned identically to one that does, and no query, alert or
log distinguishes them. The competitor evaluating the product has read access to
all of the above.

Severity is HIGH because the criterion this whole stream exists to satisfy is
unmet, and because marking it done closes it in the ledger. It is not a new
exposure: this vector is unchanged from `3d63afd`. That is precisely why it must
not be recorded as fixed.

**Fix.** Three parts, in order.

1. Stop shipping the URLs. Move `CHECKOUT_LINKS` into a Netlify env var
   (`STRIPE_CHECKOUT_LINKS` as JSON), read it in `_terms_gate.js`, keep the
   module pure by injecting the map. Purge the six literals from the four docs.
   Git history cannot be purged, so this is only worth doing together with (2).
2. Rotate. `scripts/stripe-retire-catalogue.js` already exists for this: create a
   fresh catalogue, deactivate the six current links, and never commit the new
   ones. Every URL now in git history becomes dead.
3. Close the receiving side, which is the part that actually enforces C3.
   In `stripe-webhook.js` at the `checkout.session.completed` branch (`:132`),
   read `session.client_reference_id`, look it up in `terms_acceptances`, and
   when there is no match either refuse to provision or provision and write a
   flagged `client_events` row. Without this, any future link leak reopens the
   hole silently. This is the single highest-value line of the three.

Until all three land, the honest ROADMAP entry for C3 is "the in-page path is
closed; the link-possession path is not".

### S2 — MEDIUM. `accept-terms.js` is unauthenticated, origin-optional and unrate-limited.

**Where.** `brandgeo-dashboard/netlify/functions/accept-terms.js:38`.

**What.** The guard is
`if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin))`. A request with **no**
`Origin` header skips the check entirely. There is no JWT, no
`guardPublicRequest`, no `IP_RATE_LIMIT_PER_DAY`, no `checkGlobalHourlyLimit`,
none of which `_prospect_guard.js` is short of.

**Exploit path.** A shell loop posting
`{"plan":"growth","period":"monthly","accepted":true,"accepted_version":"2026-07-13"}`
with no `Origin` header receives a 200 and a URL on every request, and writes a
`terms_acceptances` row on every request. Two consequences, both real:

- Unbounded growth of a table that `db/supabase-terms-acceptances-migration.sql`
  deliberately exempts from `purge-old-audits.js`. It has no retention rule, by
  design, so nothing ever removes the flood.
- The legal artifact is diluted. Every row asserts a contract acceptance. If
  10,000 of them were machine-generated, the table stops being evidence of
  anything, which is the one job the migration header says it has.

The origin-optional pattern is copied from `guardPublicRequest:92`, where it is
defensible because the endpoint is explicitly for headless callers. This endpoint
is not.

**Fix.** In `accept-terms.js`, after the JSON parse: require the header
(`if (!origin || !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return err(403, ...)`)
and add a per-IP-hash cap on `terms_acceptances` in the last hour, using
`hashIp(event)` which the function already calls at `:80`. Ten per hour per IP
hash is generous for a human buyer and ends the flood.

### S3 — LOW. `accept-terms.js` crashes on a JSON body of literal `null`.

**Where.** `accept-terms.js:47` (`if (body.honeypot)`), reachable because
`JSON.parse("null")` returns `null` and the guard at `:44` is
`JSON.parse(event.body || '{}')`, which only defends against an empty body.

**Exploit path.** `POST` with body `null`. `body.honeypot` throws
`TypeError: Cannot read properties of null`. The throw is not caught, so Netlify
returns a platform 502 **with no CORS headers**, which the browser reports as a
network failure rather than as the error the endpoint meant to send. No URL is
issued and no row is written, so this is availability and diagnosability only,
not a bypass.

Related and worth fixing in the same edit: `_terms_gate.js:96` documents "Never
throws", and `resolveCheckout(null)` does throw. Verified by execution:
`THREW [Cannot destructure property 'plan' of ... as it is null]`. The default
parameter `= {}` covers `undefined`, not `null`. Not reachable from
`accept-terms.js`, which always passes an object literal, but the module is
exported and the docstring is load-bearing for the next caller.

**Fix.** `accept-terms.js:44`, replace with
`body = JSON.parse(event.body || '{}'); if (!body || typeof body !== 'object') body = {}`.
`_terms_gate.js:98`, change the signature to
`function resolveCheckout(input) { const { plan, period, accepted, acceptedVersion } = input || {}; ... }`.

### S4 — INFORMATIONAL, no action. Prototype pollution through `plan` and `period` is closed.

`_terms_gate.js:117` uses `Object.prototype.hasOwnProperty.call`. Executed
against `__proto__`, `constructor`, `prototype`, `toString`, `hasOwnProperty` as
`plan`, and `__proto__` as `period`: all six refused, none returned a URL. The
`accepted !== true` strict comparison at `:99` rejected `1`, `"true"`, `{}` and
`new Boolean(true)`. This is correct and is the reason I could not find a way
through the module. Recorded so a later reader does not re-test it.

---

## 4. Claim (c) verified by execution, not by reading

`_terms_gate.js:88-90` claims "A refusal NEVER carries the URL, in any field."
I required the module into node and called `resolveCheckout` with 21 inputs,
serialising the whole response and searching it for `buy.stripe.com`:

```
     refused:unknown_plan     <- __proto__ plan
     refused:unknown_plan     <- constructor plan
     refused:unknown_plan     <- prototype plan
     refused:unknown_plan     <- toString plan
     refused:unknown_plan     <- hasOwnProperty plan
     refused:unknown_period   <- __proto__ period
LEAK ALLOWED                  <- array plan
LEAK ALLOWED                  <- object plan toString
     refused:not_accepted     <- new Boolean(true)
     refused:not_accepted     <- accepted 1
     refused:not_accepted     <- accepted {}
     refused:not_accepted     <- accepted 'true'
LEAK ALLOWED                  <- version array
LEAK ALLOWED                  <- version padded
LEAK ALLOWED                  <- version obj toString
LEAK ALLOWED                  <- plan padded
     refused:unknown_plan     <- plan uppercase
     refused:not_accepted     <- no args
     THREW                    <- null arg
     refused:unknown_plan     <- managed
     refused:unknown_plan     <- free
```

Reading of the six `LEAK` rows: every one is an `ALLOWED` result, where the URL
is present because the gate decided to issue it. `["growth"]`, `{toString:()=>"growth"}`
and `"  growth  "` all normalise to `growth` through `String(plan).trim()`, which
is correct and equivalent to sending the string. **No row is both a refusal and a
leak.** The claim holds. The one genuine defect the sweep found is the `THREW`
row, filed as S3.

`withReference` also verified: a UUID appends
`?client_reference_id=<uuid>`; `abc&foo=bar` fails the
`/^[A-Za-z0-9_-]{1,200}$/` test at `:141` and the URL is returned unchanged, so
no query injection into the Stripe link.

---

## 5. The two check scripts (question f)

Both reproduced. I extracted `3d63afd` with `git archive` into a scratch tree,
copied the two scripts in unchanged, and ran them there. No git write command was
run at any point.

**`check-contract-gate.sh` at `3d63afd`: 5 failures, exit 1.**

```
FAIL: a Stripe checkout URL is present in files served to the browser ... brandgeo/web/site.js
FAIL: brandgeo/web/site.js still declares a client-side STRIPE_LINKS map ...
FAIL: brandgeo-dashboard/netlify/functions/_terms_gate.js is missing ...
FAIL: brandgeo-dashboard/netlify/functions/accept-terms.js is missing ...
FAIL: db/supabase-terms-acceptances-migration.sql is missing ...
```

**`check-funnel-accept-path.sh` at `3d63afd`: 9 failures, exit 1.**

```
FAIL: brandgeo/web/site.js has no .audit-forward-link ...
FAIL: brandgeo/web/site.js has no signupUrl() builder ...
FAIL: brandgeo/web/site.js never calls signupUrl(domain) from the result render
FAIL: brandgeo/web/index.html defines no .audit-forward-link style ...
FAIL: brandgeo-dashboard/src/pages/AuditReport.tsx has no signup link carrying ?domain= (F5)
FAIL: brandgeo-dashboard/src/lib/signupDomain.ts is missing ...
FAIL: brandgeo-dashboard/src/pages/Signup.tsx does not use the shared signupDomain module
FAIL: brandgeo-dashboard/src/pages/Signup.tsx never reads a query parameter ...
FAIL: brandgeo-dashboard/src/pages/Welcome.tsx does not use the shared signupDomain module ...
```

**The counts are transposed.** The claim was "9 and 5 respectively" for
contract-gate and funnel; the measurements are 5 and 9. The scripts do what they
say; only the attribution is wrong. Correct it in the commit record.

**Can either pass without fixing the defect? Yes, four ways.** None of these is a
reason to reject the scripts, which are better than nothing and did catch the
regression. They are the honest limits.

1. `check-contract-gate.sh:47` greps `brandgeo/web/` for the literal
   `buy\.stripe\.com`. `var u = 'https://buy.' + 'stripe.com/7sY3cw...'` passes
   it while shipping the link to every visitor.
2. `check-contract-gate.sh:57` matches `STRIPE_LINKS\s*=`. Renaming the map to
   `var LINKS = {...}` passes it.
3. `check-contract-gate.sh:126-129` verifies `accept-terms.js` only by grepping
   for the strings `_terms_gate` and `terms_acceptances`. An endpoint that
   requires the module, ignores the decision and returns the URL unconditionally
   passes every assertion in this script. The node harness exercises
   `_terms_gate.js` in isolation and never exercises the endpoint that consumes
   it, which is where the enforcement actually has to happen.
4. `check-contract-gate.sh:135` greps `index.html` for `terms.html`. The site
   footer links `terms.html` on every page, so this assertion has passed
   continuously since long before the gate existed and will pass if the gate is
   deleted.

**The most valuable assertion is the one that is missing.** Nothing compares
`TERMS_VERSION` in `_terms_gate.js:47` against `site.js:690` against the
effective date in `terms.html:169`. That triple is what F1 is about, it is the
one failure mode that refuses paying customers, and it is a three-line node check
in a script that already runs node.

---

## 6. Correctness and reliability findings

### F1 — MEDIUM. `TERMS_VERSION` lives in three files with nothing keeping them in step.

`_terms_gate.js:47`, `site.js:690`, `brandgeo/web/terms.html:169`. All three read
2026-07-13 today, verified. `_terms_gate.js:127` refuses on mismatch, and the
refusal is correct in the case it was designed for, a stale browser tab.

It is wrong in the case that will actually happen. The two files are deployed by
**two independent pipelines**. On the next terms update, whichever pipeline lands
second leaves a window in which every buyer receives `version_mismatch` and is
told, by `site.js:800`, "Please refresh and accept the current version." Refreshing
cannot fix a server-to-server version skew, so the message sends the buyer into a
loop and self-serve revenue is zero for the length of the window.

**Fix.** Add the triple-compare to `check-contract-gate.sh` (see §5), and add to
the header of `_terms_gate.js` the sequencing rule: on a terms change, deploy
Netlify first, verify `accept-terms` refuses the old version, then upload cPanel.

### F2 — HIGH, BLOCKING. The deploy order is unwritten, and the obvious order is a revenue outage.

`brandgeo/web/` deploys via the GitHub webhook to cPanel. `accept-terms.js`
deploys via Netlify. One push, two pipelines, no ordering guarantee.

If `site.js` lands first, all three Subscribe buttons `fetch` a function that
does not exist yet, get a 404, fall into `site.js:797` and show "We could not
open checkout just now." Every self-serve purchase fails for the length of the
gap. The old `site.js` had no such dependency, so this risk is new.

The reverse order is harmless: functions deployed early are simply unused.

**Fix.** Put this in the commit message and the ROADMAP entry, in this order:
push, confirm the Netlify deploy of `accept-terms` is live by observing a 403
from an unaccepted POST, and only then let the cPanel upload of `index.html` and
`site.js` go. This is a sequencing instruction for Constantin, not a code change.

### F3 — LOW. The gate can lock itself open with no way out.

`site.js:773` `closeGate()` returns early while `busy`. `busy` is cleared in both
the failure branch (`:794`) and the catch (`:805`), but not on the success branch
(`:790`), which is correct only if the assignment to `window.location.href`
always navigates. If it does not, the panel is stuck showing "Opening checkout…"
with Cancel and Escape both inert and no way to dismiss it short of a reload. The
Cancel button still looks enabled while doing nothing.

**Fix.** Start a 10s timer on the success branch that restores the button and
sets the error text, or disable Cancel visibly while `busy` so it does not lie.

### F4 — LOW, PRE-EXISTING. `hubspot_error` writes `'unknown'` where `_hubspot.js` returns `'already_exists'`.

`unlock-audit-report.js:66` writes `hubspotResult.reason || 'unknown'` whenever
`synced` is false. `already_exists` is a success from a lead-capture point of
view but arrives with `synced: false`, so it lands in the error column and in the
`where hubspot_error is not null` retry backlog the migration header describes.
Small, and better than the `false` with no reason it replaces. Worth a follow-up
rather than a fix now.

### (e) Welcome.tsx prefill ordering — holds. No finding.

`Welcome.tsx:48-52` reads localStorage synchronously and sets both fields;
`:54-63` resolves later off `supabase.auth.getUser()` and writes through
functional updaters, `setAccountType((prev) => prev ?? 'company')` and
`setBrandWebsite((prev) => prev || domain)`. Because both updaters inspect the
current value rather than closing over a stale one, the outcome is independent of
which resolves first, so there is no race even in principle. It also correctly
preserves a choice the user made manually while the promise was in flight: a user
who clicked "A personal brand" first keeps `'personal'`.

One narrow edge, not worth a fix: a user who types into the website field and
then clears it leaves `prev === ''`, which the email heuristic will then fill.

### (d) signupDomain.ts — safe, with one lifetime problem.

Validation is an allowlist at `signupDomain.ts:48`, applied on the way in
(`:64` via `:52`) and again on the way out (`:73`), which is the right shape
because localStorage is user-writable. `javascript:alert(1)` fails the regex on
the colon and the parenthesis; every value is rendered by React as text
(`Signup.tsx:105`, `Welcome.tsx:147`), never into an `href`, `dangerouslySetInnerHTML`
or a `src`. The value reaches only `provision-account` as a form field the user
could have typed anyway. Nothing authorises on it. No XSS path found.

**D3 — LOW.** The stored value has no expiry and is cleared only on a successful
provision (`Welcome.tsx:102`). A visitor who arrives at `/signup?domain=acme.com`
and abandons leaves `bgSignupDomain` in that browser indefinitely. The next
person to sign up on that machine gets `acme.com` prefilled into their company
setup, and if they do not notice, their client row is created pointing at someone
else's domain. **Fix.** Store `{v, ts}` and treat anything older than 24h as
absent in `readSignupDomain`.

---

## 7. Accessibility

**Contrast, computed.** WCAG 2.1 AA, ratios against the actual surface each
element sits on, not against `--bg`. `.terms-gate-panel` is `var(--s)`;
`.terms-gate-accept` sets its own `var(--s2)`; `.audit-result` is `var(--s)`
(`index.html:757`). All pass.

| Pair | Dark | Light |
|---|---|---|
| `.terms-gate-title` `--t` on `--s` | 15.54 | 19.86 |
| `.terms-gate-plan` `--t2` on `--s` | 7.26 | 7.38 |
| `.terms-gate-accept` `--t` on `--s2` | 14.73 | 18.14 |
| `.terms-gate-accept a` `--ac-text` on `--s2` | 6.56 | 6.49 |
| `.terms-gate-version` `--t3` on `--s` | 4.95 | 5.27 |
| `.terms-gate-btn` `#fff` on `--ac-strong` | 5.70 | 7.10 |
| `.terms-gate-btn.ghost` `--t2` on `--s` | 7.26 | 7.38 |
| `.terms-gate-error` `--bad` on `--s` | 6.82 | 6.47 |
| `.audit-forward` `--t2` on `--s` | 7.26 | 7.38 |
| `.audit-forward-link` `--ac-text` on `--s` | 6.90 | 6.60 |

The choice of `--ac-text` over `--ac2` for `.audit-forward-link`
(`index.html:854`) is right and the reasoning in the comment is right: `--ac2` is
declared POSITIVE-only at `index.html:195` and a navigation choice is not a good
outcome.

**A1 — LOW, non-text contrast.** `.terms-gate-btn.ghost` takes its border from
`--bd2`, which is **1.50:1** against `--s` in dark and 1.55:1 in light. WCAG 1.4.11
wants 3:1 for a control boundary. The button is still identifiable by its text
label, so this is minor, and it is the same token the rest of the page already
uses for hairlines. Recorded rather than blocked.

**Keyboard reachability.** All five new controls are natively focusable: the
checkbox `#termsGateAccept`, the `terms.html` link inside the label, Cancel,
Continue, and the `.audit-forward-link` anchor. No `div` handlers, no positive
`tabindex`.

**Focus visibility.** Covered by the global rule at `index.html:258-263`, which
lists `a`, `button` and `input:focus-visible`. Nothing in the new CSS overrides
it. Verified by reading the cascade; no rule in the `.terms-gate` block sets
`outline`.

**Hit targets.** `.terms-gate-accept` is padded 12px around an 18px checkbox and
the whole label is the target via `for=`, so roughly 42px. Both buttons are
11px padding on 0.9rem text, roughly 40px. Both clear WCAG 2.2 SC 2.5.8 (24px).

**Heading order.** The panel introduces one `h2` (`index.html:3212`) at the end
of `body`. Standard placement for a dialog and does not disturb the document
outline in any way a reader encounters, since it is `[hidden]` until opened.

### A3 — MEDIUM. No focus trap. My judgement: fix it, do not block on it.

The implementation has the parts that are usually missing and is missing the
part that is usually present. It restores focus to the trigger on close
(`site.js:779`), moves focus into the panel on open (`:797`), closes on Escape
(`:815`) and on backdrop click (`:813`). It does not trap Tab, does not mark the
background `inert` or `aria-hidden`, and does not lock body scroll.

The concrete failure: a keyboard user presses Tab past Continue and focus moves
to elements behind a `rgba(10,11,14,.78)` scrim they cannot see. Focus is
visible, but on content that is visually obscured, so the user has no idea where
they are. `aria-modal="true"` at `index.html:3211` tells a screen reader the
background is inert while it is not, so the two user agents disagree about what
exists.

Why it is not a block: nothing is lost, no money moves, Escape always works, and
the worst outcome is a confused Tab excursion the user recovers from with
Shift+Tab or Escape. Why it should still be fixed: this is the last screen before
a payment, it is the screen where a legal acceptance is captured, and a
keyboard-only buyer who cannot confidently operate it is a buyer who does not
buy.

**Fix.** In `openGate` (`site.js:783`), collect
`gate.querySelectorAll('a[href], button:not([disabled]), input')`, and in the
existing `keydown` listener at `:814` handle `Tab` by wrapping from last to
first and `Shift+Tab` from first to last. Add `document.body.style.overflow =
'hidden'` on open and restore it in `closeGate`. Roughly 12 lines, no new
dependency.

---

## 8. Data and claim integrity

### D1 — MEDIUM. "Continuous tracking" and "keep watching" are promised to free signups that do not receive it.

Three new strings, all pointing a visitor at a free account:

- `site.js:304` "set up continuous tracking for {domain}" → `/signup`
- `AuditReport.tsx:312` "Start tracking {domain}" under the pre-existing line
  "Want this monitored **continuously**, with recommendations to fix each gap?"
  (`:309`), and `:316` "Free to start."
- `Signup.tsx:110` "Free to start, no credit card required. We will **keep
  watching** how AI answers name you."

Traced: `db/supabase-collection-queue-migration.sql:85` sets
`refresh_cadence text DEFAULT 'manual'`, and
`db/supabase-scheduled-jobs-migration.sql:155` records that the hourly
`schedule-collections` cron is inert for `manual`. `planConfig.ts:54` gives
`free` a single engine, ChatGPT. `CLAUDE.md` still carries the open decision
"whether `free` clients get a non-manual `refresh_cadence`". So a free account
gets one engine and no scheduled re-collection: not continuous, and not watching.

This is created by the change, not inherited. The `AuditReport.tsx` CTA
previously pointed at `getbrandgeo.com/#pricing`, where "monitored continuously"
was a description of what you were about to buy. Repointing the button at a free
signup leaves the sentence above it promising something the destination does not
deliver, which is the AGENT-OS §7.2 rule on unverifiable product claims.

**Fix.** Either say what the free tier is ("Start tracking {domain} free, ChatGPT
coverage, refresh on demand") or make the free tier match the sentence, which is
the open `refresh_cadence` decision and is Constantin's call, not a copy edit.
Owner `bg-copy` for the first, `bg-strategy` for the second.

### D2 — LOW. "A copy is recorded with your subscription" is not what happens.

`site.js:764` renders "Terms version 2026-07-13. A copy is recorded with your
subscription." What is recorded is `terms_acceptances.terms_version`, the string
`'2026-07-13'`. There is exactly one `terms.html` in `brandgeo/web/` and no
archived versions, so if the document is edited in place there is no snapshot
anywhere of what the buyer accepted, only a date and whatever git history
happens to hold. For a contract artifact that is a meaningful difference.

**Fix.** Either change the copy to "The version you accept is recorded with your
subscription", or archive the document per version as
`brandgeo/web/terms-2026-07-13.html` and store that path in the row. The second
is what makes the table worth having.

### Traced and correct

- Prices: no price string is introduced anywhere in the diff.
  `_terms_gate.js` carries plan keys and periods only; `site.js:694`
  `PLAN_LABELS` is display names only, with the reasoning stated at `:692`.
  That is the right call and removes a fourth drift site.
- `SELF_SERVE_CHECKOUT_PLANS` (`_terms_gate.js:147`) derives from
  `Object.keys(CHECKOUT_LINKS)` = `['essentials','growth','growth_pro']`, exactly
  matching `_package_checkout.js:63` `SELF_SERVE_PLANS`. Verified by reading both.
- `TERMS_VERSION` traced to `terms.html:169`. See criterion 7.

---

## 9. Regression surface, found by grep

- **`data-checkout`** appears in exactly three places, all `index.html:2815`,
  `:2837`, `:2860`. `rg -c "data-checkout" brandgeo/web/*.html` returns
  `index.html:3` and nothing else. No other page has a Subscribe button, so
  no other page is affected by the handler move.
- **`btn-plan`**: `rg -l "btn-plan" brandgeo/web/*.html` returns `index.html`
  only.
- **`site.js` version pinning**: `rg -o "site\.js\?v=[0-9a-z-]+" brandgeo/web/*.html`
  returns one result, `site.js?v=2026-07-31a`. Every other page loads `site.js`
  unpinned, so they receive the new bundle. On those pages
  `initContractGate` returns at `site.js:707` because `#termsGate` is absent, and
  nothing else in the new code runs. No regression.
- **`applyCheckoutLinks` / `STRIPE_LINKS`**: zero remaining references anywhere
  in the repo. Nothing else called either.
- **`billingYearly`**: hoisted to `site.js:699`, and the declaration inside the
  billing-toggle block was deleted. The toggle at `:855` now assigns the outer
  binding, which the gate reads at `:823`. Correct, and there is no second
  declaration to shadow it.
- **`client_reference_id`**: appears only in `accept-terms.js` and
  `_terms_gate.js`. Nothing consumes it. That is S1(3).
- **`prospect_leads` writers**: `unlock-audit-report.js` is the only one. The new
  column is nullable with no default, so nothing else breaks.
- **`readSignupDomain` / `clearSignupDomain` / `rememberSignupDomain`**: consumed
  only by `Signup.tsx` and `Welcome.tsx`. No third consumer.

**Paths that need a manual look before the push**, because grep cannot settle
them: `brandgeo/web/index.html` pricing section at 375px with the gate open
(the panel is `position: fixed` with 20px padding and `max-width: 460px`, so it
should be fine, but no viewport was exercised), and the live behaviour of the
gate against a real `accept-terms` deploy.

---

## 10. Process findings

**P1.** No handoff packet exists for S3, so there was no `scope_write` to review
against and no acceptance criteria other than the ones the builder quoted into
its own source. AGENT-OS §4 makes the packet the only thing that crosses a
session boundary; §8 makes checking the packet the point of calibration. This
review had to reconstruct the criteria from `_terms_gate.js:6-9` and
`docs/ROADMAP.md`, which means the builder wrote the standard it was measured by.

**P2.** `docs/qa/acquisition-funnel-audit.md` was edited by the builder in
`fc97dbc`. `docs/qa/` is `bg-verify`'s write scope and no other agent's
(AGENT-OS §1). The edits are honest status annotations, so no harm was done, but
a builder marking items closed in a reviewer's ledger is the exact loop the
builder/reviewer separation exists to break.

**P3, on the six em-dash removals carried in `fc97dbc`.** Carrying them was the
right call, narrowly. They are all in `AuditReport.tsx` rendered strings
(`:122`, `:155`, `:169`, `:174`, `:245`, `:255`), they are customer-facing, they
enforce a standing guardrail (AGENT-OS §7.3), they are disclosed in the commit
message, and every one is a punctuation substitution with no semantic change,
which I verified line by line in the diff. Against that: they are unrelated to
S3, they came from an uncommitted session with no review of their own, and they
enlarge the diff of a file on the money path. The disclosure is what makes it
acceptable. Had they been silent, this would be a finding rather than a note.

---

## 11. What was not checked

1. **No live HTTP call to `accept-terms.js`.** The function is not deployed and
   calling it would write a `terms_acceptances` row. Every claim about the
   endpoint in this report comes from reading its control flow or from executing
   `_terms_gate.js` in isolation. **The endpoint itself has never been run.**
2. **No browser was opened.** Every accessibility judgement is computed or read
   from source. Nothing was measured at a viewport. Specifically unverified:
   whether the panel actually renders at 375px, whether the focus ring is visible
   against `--s2` on the checkbox in practice, and whether the Tab excursion
   described in A3 behaves as predicted.
3. **The Stripe side was not touched.** I did not confirm via the Stripe API
   that the six links are active, that their `metadata.plan` is set, or that
   `client_reference_id` arrives on the session. S1's exploit path is reasoned
   from `stripe-webhook.js` source and from Stripe Payment Link semantics, not
   observed. It should be confirmed against one real session before the fix is
   designed.
4. **Light mode of the dashboard pages** (`AuditReport`, `Signup`, `Welcome`) was
   not exercised. It remains UNAUDITED per the standing note in `CLAUDE.md`. The
   marketing-site light mode contrast in §7 is computed from tokens, not
   observed.
5. **The email round trip** that `signupDomain.ts` exists to survive was not
   performed. Whether the value actually persists through Google SSO's redirect
   and through the `/reset-password` hop is untested; both are same-origin so it
   should, but "should" is not evidence.
6. **`docs/growth/outbound-infra.md`** (574 added lines) was not reviewed. It is
   unrelated to S3, carries no code, and was out of the review's scope.
7. **`prospect_leads` and `terms_acceptances` row contents** were not read. Only
   schema, RLS state and policy counts were queried.
8. **Load and abuse behaviour** of `accept-terms` was not tested. S2 is reasoned
   from the absence of a rate limit in the source, not from a flood.
9. **`purge-old-audits.js`** was not re-read to confirm it does not touch
   `terms_acceptances`. The migration says it does not; I did not verify it.

---

## 12. Block list

Must be resolved before this reaches production:

1. **S1.** Do not record C3 as done. Either land the three-part fix, or amend the
   ROADMAP entry to state that the link-possession path remains open. The single
   most valuable line is reading `client_reference_id` in `stripe-webhook.js`.
2. **F2.** Write the deploy order into the commit message and the ROADMAP entry:
   Netlify first, verify a 403 from an unaccepted POST, then cPanel.
3. **D1.** Fix the free-tier claim, or get Constantin's ruling on the
   `refresh_cadence` decision it depends on.

Should be fixed in the same pass, not blocking:

4. **S2** origin and rate limit on `accept-terms.js`.
5. **F1** triple-compare of `TERMS_VERSION` in `check-contract-gate.sh`.
6. **A3** focus trap and scroll lock.
7. **S3** null-body crash.
8. Correct the transposed failure counts in the `1741672` commit record.
