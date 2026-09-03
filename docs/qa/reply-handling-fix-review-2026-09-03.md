# PASS WITH FINDINGS

Independent re-review of packet `022` (`bg-backend` to `bg-verify`), the fix
round against `docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md`
(verdict FAIL).

Reviewer: `bg-verify`, Opus. Date 2026-09-03. Nothing was edited, committed,
deployed, or written to the database. Every number below was produced by running
the code, not by reading it.

**Why PASS WITH FINDINGS and not PASS.** One new defect (N1) was introduced by
the F7 fix and is demonstrated below: the per-page deadline that F6b round 2
established is not enforced across the new DNS phase, so `fetchPage` can run
five times its stated budget. It is a reliability regression on a function that
is already live. It must be fixed before this change set is deployed, but it
breaks no acceptance criterion and it does not reopen any finding.

**Why not FAIL.** Every item on the original review's own block list (F1, F2
server rule, F3, F6, F6b) is closed, and each was re-attacked with the technique
that produced it plus new ones. The two remaining reproductions that failed to
close (N2, N3) are residual weaknesses in the same functions, both LOW, and
neither is demonstrable end to end in this deployment.

---

## 1. Calibration

| Check | Result |
|---|---|
| `node --check` on the five changed function files | 5 of 5 OK |
| `tests/touches_record.test.js` | 29 assertions passed |
| `tests/prospects_admin_whitelist.test.js` | 84 assertions passed |
| `tests/contact_routes.test.js` | 67 assertions passed |
| `tests/contact_routes_host_match.test.js` | 54 assertions passed |
| `tests/poll_inbound_replies.test.js` | 14 assertions passed |
| `tests/contact_routes_fetch_guard.test.js` | 17 assertions passed |
| Total | **265 assertions, 0 failures**, exactly the counts packet `022` claims |
| Em and en dash scan | 0 hits. Positive control fired on both characters first, so the scan is proven live, not silently empty |

Dash scan coverage: the five untracked in-scope files whole
(`_touches.js`, `poll-inbound-replies.js`, `touches_record.test.js`,
`poll_inbound_replies.test.js`, `contact_routes_fetch_guard.test.js`) plus
`docs/arch/reply-handling.md` and the packet itself; and `git diff -U0` added
lines only for the five modified in-scope files. Scoped to the files under
review, per the CLAUDE.md note that a `src`-wide scan sweeps in another
session's `Revenue.tsx` and its 6 em dashes.

`npm run build` was NOT run (RAM cap, per this run's instructions). See F4.

**Scope note.** Packet `022` declares `scope_write:
docs/qa/contact-routes-and-reply-handling-review-022.md`. This run was
dispatched to write `docs/qa/reply-handling-fix-review-2026-09-03.md` instead.
One file, named exactly, so the AGENT-OS section 1 rule holds either way; the
discrepancy is recorded rather than silently resolved.

---

## 2. Per-finding table

| # | Verdict | Evidence |
|---|---|---|
| **F1** sender spoofing | **CLOSED**, residual N2 | All four of the review's reproductions now return the true addr-spec. 31 hostile headers fed to `parseFromAddress`; see section 3.1 |
| **F2** backfill re-arms a replied prospect | **CLOSED** server side. Client half OPEN, out of scope | `_touches.js:161-173` reply guard; `recordTouch` scripted through the exact production reproduction, no `next_action_at` write issued. `src/pages/Prospects.tsx:196-201` still never reads `replied_at` |
| **F3** S1 floor missing on the poller path | **CLOSED** | `TOUCH_MIN_OCCURRED_AT` is now one constant in `_touches.js:60`, imported by `prospects-admin.js:194`. Identity check between the two modules returns `true`. All four hostile `Date` headers clamp to now; admin path still REJECTS with 400 |
| **F4** build fails, tree moving | **NOT CHECKED** | Build not run by instruction. The named TS2322 is repaired in committed code (`collectionContext.tsx:96-105` stubs now return the result shapes). `git status` still shows `src/pages/Revenue.tsx` dirty from another session, so a green build still cannot be certified for this tree |
| **F5** `source_url` provenance | **CLOSED by construction** | Exactly one `fetch(` exists in the resolver, at `resolve-contact-routes.js:216`, inside `fetchPage`. Every `source_url` traces to a `fetchPage` return (`:303`, `:304`, `:348`, `:388`), and every hop including hop 0 passes `checkFetchTarget` at `:212` |
| **F6** `playListingMatches` substring | **CLOSED** (commit `551a6d1`) | All four original rows reproduced: `casepacer.com` true, `pacer.com` false, `acer.com` false, `case.com` false. The escaped-JSON Play form matches |
| **F6b** invocation budget vs 26s | **CLOSED** (commits `551a6d1`, `f11e8d9`) | `MAX_PROSPECTS_PER_CALL = 1` at `resolve-contact-routes.js:123`; `remaining()` is a real deadline clamping every fetch at `:293`, `:343`, `:356`, `:375`. `netlify.toml:143` timeout 26 |
| **F7** SSRF | **CLOSED** for every reproduced case, residual N3 | `redirect: 'manual'` at `:217`; all six of the review's reproduced hosts refused; 20 guard cases in section 3.3 |
| **F8** undeclared contract changes | **CLOSED** | `prospects-admin.js:22-48` now states `warning`, all four renamed 5xx codes, and `external_id` on `TOUCH_COLS` |
| **F9** `retry_of` untested | **CLOSED** | `tests/touches_record.test.js:310, :316, :324` cover `retry_not_found`, `retry_lookup_failed`, `refetch_failed` with `touch_id` |
| **F10** `isAutomated` misses Exchange | **CLOSED** | `poll-inbound-replies.js:242-245` adds the two Exchange headers plus `AUTO_SUBJECT_RE`; both are also requested as `metadataHeaders` at `:427-428`, so the headers actually arrive |
| **F11** budget-stopped run reports ok | **CLOSED** | `:491` `complete = budgetStopped === 0 && deferred === 0`; `:522` `ok = errors.length === 0 && complete`. A normal complete run still records `ok = true` |
| **F12** cap starves addresses past 25 | **CLOSED** | The chunk loop at `:346-357` has no early break, so every chunk is queried. Cap applied after dedupe at `:385`, plus an hourly rotation offset at `:394`. An id at index i is included for 40 of every `unlogged.length` hours, so nothing is permanently skipped, and `deferred > 0` forces `complete = false` |
| **F13** candidate id 10 provenance | **OUT OF SCOPE, still owed** | Data and process, not code. Needs Constantin's decision on candidate 10 and on touch 18. Not re-queried this run (SELECT-only budget); CLAUDE.md 2026-08-21 records the never-query CHECK as applied and behaviourally proven |
| **F14** `promote` validates provenance, not format | **OUT OF SCOPE, unchanged** | `prospects-admin.js:437-444` still writes `candidate.value` verbatim after a non-empty string check. INFO, as ranked |

---

## 3. How each attack was run

### 3.1 F1, hostile `From` headers

`parseFromAddress` now blanks quoted strings and comments first
(`stripQuotedAndComments`, `:145`), then requires exactly one angle token.
31 headers fed in. The load-bearing rows:

```
ORIGINAL F1 a  "<lead@hoowla.com>" <attacker@evil.example>          -> attacker@evil.example
ORIGINAL F1 b  "Lead <lead@hoowla.com>" <attacker@evil.example>     -> attacker@evil.example
ORIGINAL F1 c  "reply-to <sales@casepacer.com>" <spoof@mailer...>   -> spoof@mailer.example
comment holds address  (sales@casepacer.com) <spoof@mailer.example> -> spoof@mailer.example
nested comment ((a (sales@casepacer.com)) x) <spoof@mailer.example> -> spoof@mailer.example
comment AFTER addr     <spoof@...> (sales@casepacer.com)            -> spoof@mailer.example
escaped quote in quote "Lead \" <lead@hoowla.com>" <spoof@...>      -> spoof@mailer.example
display name with @ unquoted  lead@hoowla.com <spoof@mailer...>     -> spoof@mailer.example
encoded-word display   =?utf-8?B?PHNhbGVzQGNhc2VwYWNlci5jb20+?= <spoof@...> -> spoof@mailer.example
two mailboxes          A <sales@...>, B <spoof@...>                 -> null (refuses rather than guesses)
route addr             <@relay.example:lead@hoowla.com>             -> null
unterminated quote     "Lead <lead@hoowla.com>                      -> null
```

Refusal is not over-broad. Ordinary headers still parse: bare address,
`Lead <lead@hoowla.com>`, uppercase, CRLF folded, leading and trailing
whitespace, plus-addressing, a subdomain address, and a unicode display name all
return the correct address.

### 3.2 F2, `recordTouch` scripted against the production reproduction

Seven scenarios through a scripted Supabase that records every write it is asked
to make. The `next_action_at` column is what the finding is about:

```
F2 EXPLOIT   replied 08-19, outbound BACKFILL 08-18   -> NO WRITE ISSUED (skip)   [was 2026-08-25]
CONTROL      replied 08-19, outbound 08-20            -> 2026-08-24T09:00:00.000Z
CONTROL      never replied, 1st outbound              -> 2026-08-24T09:00:00.000Z
BOUNDARY     outbound occurred_at === replied_at      -> NO WRITE ISSUED (skip)
CONTROL      inbound reply                            -> null (CLEAR, not skip)
CONTROL      terminal stage disqualified              -> NO WRITE ISSUED (skip, existing date preserved)
CONTROL      3rd outbound, never replied              -> null (sequence exhausted)
```

The exploit row is the one that mattered: the final state now keeps
`replied_at = 2026-08-19` with `next_action_at` still null, where the review
measured it pushed back out to 2026-08-25. It does not over-skip: an outbound
touch after the reply still schedules, and a prospect that never replied behaves
exactly as before, including the skip-versus-clear distinction.

**Not proven at the database level.** Packet `022`'s acceptance criterion asks
for a real `begin; ... rollback;`. This run is forbidden from writing to the
database, so that was not done. The gap is smaller than it looks: the fix makes
`nextActionAtFor` return `{ skip: true }`, so the schedule UPDATE is never
issued at all, which is a pure control-flow property the scripted run proves
directly. The database-level guarantee the fix relies on (the forward-only stamp
filter) is unchanged and was already proven against a rolled-back transaction on
2026-08-15. Recorded here so nobody reads this as a full database proof.

### 3.3 F7 and F5, the fetch guard

Exactly one `fetch(` in the resolver, at `resolve-contact-routes.js:216`, with
`redirect: 'manual'`. The loop at `:188` runs `checkFetchTarget` on every hop
from hop 0, up to `MAX_REDIRECT_HOPS = 3`.

```
own domain, public addr          ALLOW casepacer.com
www of own domain                ALLOW www.casepacer.com
sub of own domain                ALLOW help.casepacer.com
play store                       ALLOW play.google.com
REDIRECT to foreign host         REFUSE not the prospect's own domain
REDIRECT to metadata IP          REFUSE (169.254.169.254)
REDIRECT to loopback             REFUSE (127.0.0.1:8080)
REDIRECT to private              REFUSE (10.0.0.5)
REDIRECT to link-local v6        REFUSE ([fe80::1])
metadata.google.internal         REFUSE internal name
own domain BUT resolves private  REFUSE resolves to non-public address 10.0.0.5
own domain, split public+private REFUSE resolves to non-public address 127.0.0.1
own domain, NO address           REFUSE no resolved address
file:// scheme                   REFUSE refused scheme file
gopher:// scheme                 REFUSE refused scheme gopher
no ownDomain -> play only        REFUSE (stricter than skipping, as documented)
lookalike suffix evilcasepacer   REFUSE
userinfo trick casepacer.com@evil.example  REFUSE (host reads as evil.example)
play.google.com.evil.example     REFUSE
```

All six of the review's reproduced F7 hosts are now refused, and the two
attacks I added (userinfo authority confusion, Play Store suffix lookalike) are
refused too.

Address classifier, the cases packet `022` claim 7 asked for:

```
0177.0.0.1   normaliseDomain keeps it, but dns.lookup throws ENOTFOUND -> refused
0x7f000001   normaliseDomain -> null (rejected outright)
2130706433   normaliseDomain -> null (rejected outright)
127.0.0.1 / 169.254.169.254 / 10.0.0.5 / 192.168.1.1:8080 / ::1  -> normaliseDomain null
::ffff:127.0.0.1  blocked      ::ffff:8.8.8.8  public
172.16.0.1 blocked             172.32.0.1 public   (boundary correct both ways)
100.64.0.1 / 198.18.0.1 / 224.0.0.1 / 0.0.0.0 / 255.255.255.255  blocked
fd00::1 / fe80::1 / ff02::1 / 2001:db8::1  blocked
```

Refusals reach the caller. `resolve-contact-routes.js:299` pushes
`` `${page.url}: ${page.error}` `` into `errors`, which the response carries.
Better than packet `022` assumed: `src/pages/Prospects.tsx:1119-1142` now DOES
read `result.errors`, distinguishes a fatal, a time-budget truncation and an
unread-page count, and says so in the banner. That `bg-app` gap has been closed
by another session since the packet was written.

---

## 4. New defects introduced by these fixes

### N1. MEDIUM. The new DNS phase is outside the deadline it was added under

**What.** `fetchPage` computes `deadline = Date.now() + timeoutMs`, checks
`left <= 0`, and then does `await lookup(host)` with no timeout of its own. The
`AbortController` that enforces the budget is created afterwards, at `:213`, so
the whole DNS resolution runs unbounded.

**Where.** `brandgeo-dashboard/netlify/functions/resolve-contact-routes.js:200-206`.

**Demonstrated**, with an injected lookup that takes 5 seconds:

```
timeoutMs asked for : 1000
elapsed actual      : 5070 ms
result              : {"url":"https://casepacer.com/contact","error":"timeout"}
```

The verdict is right and arrives 5 times late.

**Failure path.** `resolveOne` fires `MAX_PAGES_PER_PROSPECT = 12` fetches in
parallel at `:293`, each doing its own `getaddrinfo`. Node's default thread pool
is 4, so 12 lookups against a slow or hanging resolver serialise into three
waves. Add up to 1 Play listing fetch and 6 search-discovered listing fetches,
each sequential and each with its own unbounded lookup, plus one more per
redirect hop. `PER_PROSPECT_BUDGET_MS` and `INVOCATION_BUDGET_MS` are both blind
to all of it. The invocation exceeds the 26s `netlify.toml` ceiling, is killed,
and returns nothing, which is exactly the failure the header comment at
`:66-74` says the budgets exist to prevent and which the design says reads
identically to "this company publishes no address".

This is the F6b defect one layer down: a budget enforced as a pre-check rather
than as a deadline. F6b was closed for `fetch`; the fix for F7 added a second
blocking call in front of it and did not extend the deadline over it.

**Fix.** Race the lookup against what is left, and report a refusal like any
other, so the caller still sees it in `errors`:

```js
const dnsBudget = Math.max(1, deadline - Date.now())
let addresses
try {
  addresses = await Promise.race([
    lookup(host),
    new Promise((_, rej) => setTimeout(() => rej(new Error('dns timeout')), dnsBudget)),
  ])
} catch (e) {
  return { url: current, error: `refused: dns lookup failed for ${host}` }
}
```

### N2. LOW. A malformed `From` with unbalanced angle brackets still misparses

**What.** After stripping, `parseFromAddress` counts `<...>` tokens but does not
check for leftover stray brackets, so a header with an unbalanced bracket has
exactly one well-formed token and that token is trusted.

**Where.** `brandgeo-dashboard/netlify/functions/poll-inbound-replies.js:196-198`.

**Reproduced.** All four return `sales@casepacer.com`, a real prospect address:

```
<<sales@casepacer.com>@evil.example>
<sales@casepacer.com>>@evil.example
x> <sales@casepacer.com>
<a<sales@casepacer.com>
```

**Why LOW and not a reopen of F1.** F1's exploit used a header that is legal RFC
5322, which is what made it credible. Every string above is malformed, and I
cannot demonstrate that Gmail accepts, delivers and then reports such a `From`
verbatim through the metadata API, nor that DMARC would let it through. The
parser is wrong; the end-to-end exploit is not shown. Reported as a residual
rather than as a live finding, per the rule against speculative findings.

**Fix, one line.** After choosing `raw`, reject if what is left still contains a
bracket: `if (angled.length === 1 && /[<>]/.test(stripped.replace(angled[0], ''))) return null`.

### N3. LOW. NAT64 and 6to4 IPv6 forms embedding private IPv4 classify as public

**What.** `ipv6Class` handles IPv4-mapped and IPv4-compatible forms by extracting
the embedded address, but not the NAT64 well-known prefix `64:ff9b::/96`
(RFC 6052), the local-use NAT64 prefix `64:ff9b:1::/48` (RFC 8215), or 6to4
`2002::/16`.

**Where.** `brandgeo-dashboard/netlify/functions/_contact_routes.js:775-786`.

**Reproduced.**

```
64:ff9b::7f00:1      (embeds 127.0.0.1)       -> public
64:ff9b::a00:5       (embeds 10.0.0.5)        -> public
64:ff9b::a9fe:a9fe   (embeds 169.254.169.254) -> public
64:ff9b:1::7f00:1                             -> public
2002:7f00:1::1       (6to4 of 127.0.0.1)      -> public
```

**Why LOW.** Reaching loopback this way needs an AAAA record on the prospect's
own domain (the only host the guard admits besides `play.google.com`) AND a
NAT64 or 6to4 route on the runtime. AWS Lambda does not provide DNS64 or NAT64
outside an opt-in IPv6-only subnet, so I can demonstrate the classifier is wrong
but not that the packet arrives. Named because packet `022` claim 7 asked for
exactly this attack and it is the one case that survived it.

**Fix.** In `ipv6Class`, before the `fc00::/7` test, add: if
`n[0] === 0x0064 && n[1] === 0xff9b` and (`n[2..4]` are zero, or
`n[1+1] === 0x0001`), extract `n[6]`/`n[7]` as a dotted quad and return
`ipv4Class` of it; same treatment for `n[0] === 0x2002` using `n[1]`/`n[2]`.

---

## 5. Regression surface, found by grep not intuition

- `_touches.js` is required by exactly two callers,
  `netlify/functions/prospects-admin.js:195` and
  `netlify/functions/poll-inbound-replies.js:51`. No third consumer.
- `TOUCH_MIN_OCCURRED_AT` and `TOUCH_MAX_FUTURE_MS` are re-exported from
  `prospects-admin.js:738-739` for the existing suite. Identity between the two
  modules verified at runtime, so the F3 floor cannot drift.
- `_contact_routes.js` gained 201 lines and 9 new exports
  (`PLAY_STORE_HOST`, `ipv4Class`, `ipv6Class`, `expandIpv6`, `addressIsPublic`,
  `checkFetchTarget` and the host helpers). Only `resolve-contact-routes.js`
  imports the new ones.
- Nothing in `brandgeo-dashboard/src/` reads the 5xx `code` strings, so F8's
  rename still breaks no live caller.
- `src/pages/Prospects.tsx` is the only UI consumer of the resolver and of the
  `touch` action. It now reads `results[0].errors` (`:1119`), so the new
  `refused: ...` messages surface. It still does not read `replied_at` in
  `isActionableNow` (`:196-201`).

**Needs a manual look:** `src/pages/Prospects.tsx:1119-1142`. Every guard
refusal now increments the banner's "N pages could not be read" counter. A
prospect whose `/contact` legitimately redirects to a third-party form (HubSpot,
Typeform, a rebranded domain) will start reporting unread pages where it
previously read them. That is the intended trade for provenance by construction,
but it is a visible behaviour change on a live screen and nobody has looked at
it against a real site.

---

## 6. Data and claim integrity

Every user-facing number in the change set traces to a constant in the file that
prints it: `MAX_PROSPECTS_PER_CALL = 1`, `MAX_PAGES_PER_PROSPECT = 12`,
`PER_PAGE_TIMEOUT_MS = 6000`, `PER_PROSPECT_BUDGET_MS = 18000`,
`INVOCATION_BUDGET_MS = 22000`, against `netlify.toml` timeout 26. The banner
counts (`found`, `pages`, `unread`) are all derived from the response, not
asserted. `FOLLOW_UP_STEPS_DAYS = [4, 7]` matches Constantin's 2026-08-20 ruling
recorded in `docs/arch/reply-handling.md`. No new user-facing copy makes a
factual claim about the world. Nothing untraceable found.

---

## 7. What was NOT checked

1. **`npm run build` and `tsc --noEmit`.** Forbidden this run (RAM cap). F4's
   build half therefore stays open. `tsconfig.json` includes only `src`, so none
   of the eleven reviewed files is compiled by it either way.
2. **F2 against a real rolled-back transaction.** Database writes forbidden this
   run. See section 3.2 for what was proven instead and what that leaves open.
3. **F13.** Not re-queried. Candidate id 10 and touch 18 still need Constantin's
   decision; no code change can close them.
4. **The poller against real Gmail.** It has never run. Everything about it here
   is control flow against injected data. The four `GMAIL_*` variables are not
   set, so the live behaviour of the OAuth exchange, the `q` query, and the
   `metadataHeaders` request is unproven.
5. **DNS rebinding.** The guard's own header states the time-of-check to
   time-of-use gap honestly. Not closable without a socket-pinning agent, and not
   attempted.
6. **Accessibility.** No new interactive element, no new text-on-surface pair,
   and no `.tsx` file in this change set. Nothing to measure. The one UI file
   that changed behaviour (`Prospects.tsx` banner text) belongs to another
   session and another packet.
7. **The resolver against a live site.** No network call was made to any
   prospect domain.
8. **RLS and the `promote` path.** Unchanged by this packet and covered by the
   2026-08-20 review.

---

## 8. What must still happen before deploy

In this order. The first item is new and is the only thing this review adds to
the list.

0. **Fix N1**, the unbounded DNS phase in `fetchPage`. Four lines. It is a
   regression on `resolve-contact-routes`, which is already live, and it
   reintroduces the exact class of defect F6b was raised for.
1. **Set the four `GMAIL_*` environment variables** on Netlify. Consent must be
   granted on the TalentWeLove account. `poll-inbound-replies.js:277-281` fails
   closed without them.
2. **Get the scope ruling from Constantin.** A read-only Gmail scope on the
   TalentWeLove Workspace reaches unrelated company mail.
   `docs/arch/reply-handling.md` section 5 records this as unresolved and it is
   still unresolved. This is a decision, not a fix.
3. **`netlify.toml` is already correct.** `poll-inbound-replies` timeout 26 at
   `:153-154`, `resolve-contact-routes` timeout 26 at `:142-143`. Nothing owed
   here beyond deploying it.
4. **Deploy, and only then schedule `pg_cron` at minute 20.** Not minute 10,
   which is `schedule-collections`. Scheduling before the deploy writes an
   hourly `ok = false` row into `job_runs` forever, because the function 404s
   until it exists.

Also worth doing while the files are open, none of it blocking: **N2** (one line
in `parseFromAddress`), **N3** (the NAT64 and 6to4 branches in `ipv6Class`), and
**F2's client half** in `src/pages/Prospects.tsx:196-201`, which belongs to
`bg-app` and is now defence in depth rather than a live hole, since the server
rule removes the only mechanism that armed the date.

Unchanged and still owed a decision from Constantin, not a fix: **F13**.

---

## Orchestrator amendment, 2026-09-03, after this review

N1, N2 and N3 were closed in the same working tree before the commit, by the
orchestrator rather than a fresh bg-backend run, because each fix is a few
lines against a finding this report already demonstrated:

- N1: `fetchPage` now awaits the lookup through `withDeadline()`, a race
  against the same deadline the fetch honours. A lookup slower than the page
  budget returns `timeout` at the deadline and never reaches `fetch`
  (`tests/contact_routes_fetch_guard.test.js`, N1 section: 200ms budget,
  1500ms lookup, result within 1200ms, fetch not called).
- N2: `parseFromAddress` refuses a header that leaves any bracket outside its
  one well-formed `<...>` token. All four reproductions above now return
  `null`; an ordinary name-addr still parses
  (`tests/poll_inbound_replies.test.js`, N2 section).
- N3: `ipv6Class` classifies the NAT64 well-known prefix `64:ff9b::/96` and
  6to4 `2002::/16` as the embedded IPv4 address, and blocks the local-use
  NAT64 prefix `64:ff9b:1::/48` outright. The reproductions above are now
  `blocked`; a NAT64 or 6to4 literal embedding a public address stays public
  (`tests/contact_routes_fetch_guard.test.js`, N3 section).

After the fixes: `node --check` 5 of 5, 270 assertions across the six files
(poller 16, fetch guard 20, the other four unchanged), no em or en dash in any
changed file with a firing positive control.

Also changed in this file and in two test fixtures before the commit: a real
prospect's personal address and a named individual's RocketReach profile slug
were replaced with neutral strings. This repository is public, and every
finding here is about the parser or the guard, not about the person.
