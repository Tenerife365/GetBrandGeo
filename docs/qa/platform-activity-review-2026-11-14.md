PASS WITH FINDINGS

# Platform activity: independent review (bg-verify, read only)

INTENT: review the Platform activity build (spec `docs/arch/platform-activity.md`) | SCOPE: `docs/qa/` (write), read only elsewhere | MODEL: opus | STOP AFTER: /verify

Date: 2026-11-14. Reviewer edited no reviewed file. No git command that changes state, no build, no vite, no browser.

**Counts: 0 BLOCKER, 0 MAJOR, 2 MEDIUM, 8 LOW, 6 INFO.**

The server function is the strong half: auth first, read only, every time table windowed above and below and capped, `meta` never forwarded, logs scrubbed, budget rule mirrors the gate, and three mutations of it were each caught by the test. The findings are on the page: it never renders the summary's `warnings`, and tile 4 turns red at 100 percent instead of 90.

---

## 1. Files reviewed

| File | State |
|---|---|
| `brandgeo-dashboard/netlify/functions/platform-activity.js` | new, 690 lines, read in full |
| `brandgeo-dashboard/netlify.toml` | +7 lines (`[functions."platform-activity"] timeout = 26`), diff read |
| `brandgeo-dashboard/tests/platform_activity.test.js` | new, 646 lines, read in full |
| `brandgeo-dashboard/src/lib/platformActivity.ts` | new, 527 lines, read in full |
| `brandgeo-dashboard/src/lib/platformActivityFixture.ts` | new, 146 lines, first 80 read plus grep |
| `brandgeo-dashboard/src/pages/PlatformActivity.tsx` | new, 342 lines, read in full |
| `brandgeo-dashboard/src/App.tsx` | +2 lines (lazy import, route), diff read |
| `brandgeo-dashboard/src/components/Layout.tsx` | +3/-1 (`Activity` icon, one admin nav entry), diff read |
| `brandgeo-dashboard/tests/platform_activity_source.test.js` | new, 207 lines, assertions listed and read |

## 2. Commands run (reproduced here)

```
node tests/platform_activity.test.js          -> platform_activity: 66 checks passed, exit 0
node tests/platform_activity_source.test.js   -> 14 passed, 0 failed, exit 0
node tests/ts_require_bundler.test.js         -> 5 passed, 0 failed, exit 0
node tests/tokens_sync.test.js                -> 115 passed, 0 failed, exit 0
npx tsc --noEmit -p .                         -> exit 0, no output
```

Exit codes were captured without a pipe (`node ... >/dev/null; echo $?`). No node segfault occurred.

Dash scan, `rg -n` with a class of the em and en dash code points (U+2014, U+2013) over the six new files: exit 1 (no match). Over the added lines of `netlify.toml`, `App.tsx`, `Layout.tsx`: exit 1. Positive control: the same pattern on a scratch file holding one em and one en dash printed the line, exit 0, so the scan fires.

Token scan, `rg "#[0-9a-fA-F]{3,8}\b|slate-|dark-[0-9]|white/|black/|bg-white|text-white"` over the page, lib and fixture: no match.

`git status --short -- src/components/ui src/index.css tailwind.config.js netlify/functions/_cost.js netlify/functions/_auth.js`: empty, so none of the forbidden files changed.

### Mutation proof

The function was copied to the scratchpad, sha256 before `9c7e9abac590c4cb6f893aa2630cd36872b3c118f2f1fad7efb91fe2275ba8ad`. Each mutation was applied, the test run, then the file restored from the copy.

| Mutation | Test result |
|---|---|
| signup detail gains `...meta` (raw meta forwarded) | exit 1, `feed: response contains @` |
| `.lte('created_at', generatedAt)` dropped from the summary `collection_runs` read | exit 1, `collection_runs: upper bound on created_at` |
| unknown plan coerced to `'free'` instead of `'essentials'` | exit 1, strictEqual on `budget_eur` |

sha256 after restore: `9c7e9abac590c4cb6f893aa2630cd36872b3c118f2f1fad7efb91fe2275ba8ad`, identical. The restored file passes 66 of 66.

---

## 3. Acceptance checklist (spec section 13)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `requireAuth(event, { adminOnly: true })` before anything else; own service client | PASS | `platform-activity.js:624-625` is the first statement of `handler`; `createClient(...SERVICE_KEY)` at `:640`, after method and body checks. Test 1: no token 401, viewer 403, foreign origin 403, and `queries.length === 0` on every rejected call (`test:262`). OPTIONS returns from `requireAuth` (`_auth.js:71-73`). |
| 2 | No insert, update, upsert, delete; only rpc is `sum_cost_eur` | PASS | `rg` shows no write method in the file; the only rpc path is `authMod.sumCostEur` at `:300`. Test 4 spies every builder: `writes` empty, `rpcNames` equals `['sum_cost_eur']`. |
| 3 | Every `ai_results`, `client_events`, `collection_runs`, `collection_jobs`, `admin_notifications` query has lower and upper time bounds and a limit or range | PASS | Summary: `:178-183` (runs gte/lte/limit), `:252-257` (ai_results gte/lte/range). Feed: `windowed()` `:494-496` applies gt/lte/order/limit to F1 to F5 (`:505-509`). Test 4 asserts it per recorded builder; mutation 2 above proves the assertion fires. `listUsers` loop bounded by `maxPages` and stops on a short page (`:137-148`). |
| 4 | Month read stops at 20 pages and sets `truncated.ai_results_month`; page shows the warning and "at least" | PARTIAL | Server PASS: `:250-295`, test 8 (1 page cap with 1,500 rows truncated and warned; 999 not; 2,500 at default read in 3 pages). Page: a `Notice tone="warn"` appears (`PlatformActivity.tsx:230-236`) whose text says "at least", but tile 4 and the table carry no "at least" prefix and the server's own warning sentence is never rendered. See M1. |
| 5 | `meta` never spread or returned; detail keys per badge equal table 3.4.1 | PASS | `eventDetail` builds each object field by field (`:439-475`); no spread of `meta` anywhere. Test 5 asserts exact key sets for all 11 types and 5 other sources; mutation 1 proves a spread is caught. |
| 6 | No `@`, email, website, note, Stripe id, auth user id or job error text in any response or log | PASS | `scrubClientName` `:83`, `scrubDetail` `:77`, `scrubLog` `:89`; job `error` read only into a boolean (`:564`); GoTrue objects reduced to `{ id, last_sign_in_at }` at `:144`; LOGIN id is a 12 hex sha256 prefix (`:478-481`). Test 3 `assertNoLeak` over both bodies with a forbidden list including all user ids, Stripe test ids, note texts and job error text, and `assertLogsClean` over captured console output in tests 3, 9 (rpc fault) and 13 (read faults with an address in the error message). |
| 7 | Budget lookup is the gate's two step rule using `_cost.js` constants; nothing redefined | PASS | `:324-325`; constants required at `:43`. Matches `_auth.js:246` plus the free fallback (`_auth.js:300` region). Test 9 reads `PLAN_MONTHLY_API_BUDGET_EUR` from the same module; mutation 3 caught. Edge divergence on prototype key names noted as L8. |
| 8 | Research clients excluded from tiles 1, 3, 4 and the customer part of tile 2 | PASS | `isCustomerId` gates tile 1 (`:216`), tile 2 (`:229`, `:286`), tile 3 (`:276`); tile 4 `!isResearch` (`:330`). Test 10: `active_users_24h` `{1,1}`, `runs_today.research` 1, health calls exclude the research call, research row sorted last. |
| 9 | No `.ts` require; `ts_require_bundler` passes | PASS | requires at `:40-43` are `crypto`, supabase-js, `./_auth`, `./_cost`. Test 5 of 5 pass. |
| 10 | `netlify.toml` has `timeout = 26` for `platform-activity` | PASS | diff `netlify.toml:239-240`. |
| 11 | Feed every 15 s, summary every 60 s, neither while hidden, both stop on 401/403, backoff caps at 120 s | PASS | Feed: `platformActivity.ts:160`, `:213-262`, source test (15000 ms timer, no fetch while hidden, delays `[30000, 60000, 120000, 120000, 120000]`, 401 and 403 stop with no timer, unsubscribe clears timer and visibility listener). Summary: `:343-421` read, same rules; no node test exercises `useSummaryPoll` (see section 9). Cross stop between the two pollers: I1. |
| 12 | `motion/react` imported only in `PlatformActivity.tsx`; entry +1.0 kB max; page chunk 30 kB max | PASS (sizes not reproduced) | Import: `PlatformActivity.tsx:10` only; `platformActivity.ts` and the fixture import no motion; nothing but the lazy `App.tsx` route imports the page; `Layout.tsx` adds only the `Activity` icon. Sizes: orchestrator measured entry 601,640 to 602,628 bytes (+988) and page chunk 19,451 bytes; a build was out of bounds for this review, so these are the orchestrator's numbers, not mine. |
| 13 | Only semantic tokens; no hex, `slate-*`, `dark-*`, `white/*`; light mode checked by screenshot | PASS | token scan above, no match. Screenshot `pa-light-1440.png` viewed: all text legible, sticky header, no sideways scroll. |
| 14 | `src/components/ui/*` unchanged | PASS | `git status --short -- src/components/ui` empty; tsc exit 0 with the page using existing props only. |
| 15 | Sidebar admin only; route wrapped like `/prospects`; demo renders fixture | PASS | `Layout.tsx` entry behind `isAdmin` (diff line 697); `App.tsx` route uses `PrivateRoute > OnboardGate > Layout > RouteView` exactly like `/prospects`; page gate `enabled = isAdmin || isDemoMode` (`PlatformActivity.tsx:124`) with fixture sources (`:126-133`); demo screenshots show the fixture. |
| 16 | New strings marked `copy: pending bg-copy`; no em or en dash | PASS | file headers declare every string pending (`PlatformActivity.tsx:6`, `platformActivity.ts:9`) plus inline marks on status words, login line, announcer and the nav entry. Dash scan with positive control above. |
| 17 | Live read after the push: 401 unauthenticated, entry chunk carries `Platform activity` | NOT CHECKED | Nothing is pushed; this row can only be checked after the push. It is owed to the orchestrator then. |

---

## 4. Security findings

No finding. What was attacked and how it held:

- **Unauthenticated, viewer, foreign origin.** `requireAuth` runs first; test 1 proves 401, 403, 403, and that no Supabase query runs on a rejected call. A GET with an admin token is 405 after auth, so method probing reveals nothing to a non-admin.
- **Address or id leakage in a body.** Every outgoing string passes `scrubDetail` or `scrubClientName`; enumerated fields only. The whitelisted `meta.reason` values are enums in `stripe-webhook.js` (`subscription_updated`, `subscription_deleted`, `checkout_subscription`, `package_purchase`, read at `:437`, `:925`, `:1036`), so no Stripe id rides in it today. `account_type` is `company` or `personal` (`provision-account.js:90`). The LOGIN id hashes the user id and keeps 48 bits; it is not reversible from the response alone.
- **Leakage through logs or error text.** Every log line goes through `scrubLog`; the 500 body is a fixed sentence (`:72`, `:662`). Test 13 injects an address in both a PostgREST error and a GoTrue throw and asserts the log line reads `[redacted]`.
- **Unbounded reads.** All loops are bounded (`maxPages` 20 and 5) with short-page stops; feed sources are 50 each; clients and profiles capped.

## 5. Findings, ranked

### MEDIUM

**M1. The page never renders the summary `warnings`, and the "at least" prefix is missing.** `PlatformActivity.tsx:185-281` reads `data.truncated.ai_results_month` but never reads `data.warnings`. Failure scenario: the budget gate RPC fails (the function sets `rpc_total_eur: null` and adds `The budget gate total could not be read...`, `platform-activity.js:304`), or the paged total and the gate differ by more than EUR 1 (`:313`), or `listUsers` hits 5 pages so tile 1 undercounts sign ins (`:390`), or clients pass 2,000. In each case the admin sees normal looking tiles with no sign that a figure is incomplete or unverified. Separately, spec 3.3.1 asks that tile 4 and every table spend cell be prefixed "at least" when the month read is truncated; the page shows only its own Notice. Fix (bg-app): render `data.warnings` as one `Notice tone="warn"` list above the tiles (dedupe against the truncation Notice), and prefix tile 4's sub and the budget percent cell with "at least" when `truncated.ai_results_month`.

**M2. Tile 4 turns `alert` only at 100 percent, the spec says 90.** `PlatformActivity.tsx:276` uses `watch.over_100 > 0`; spec 5.1 item 4 says `alert` when `over_90 > 0`. The fixture shows it: Northwind Bakery sits at 94 percent (`budget_level: 'bad'`, red Meter in the table) while the tile in `pa-light-1440.png` and `pa-dark-390.png` shows the amber warn icon. A client at 95 percent of budget is days from being blocked by the gate, and the tile reads as a caution, not an alert. Fix (bg-app): `tone={watch && watch.over_90 > 0 ? 'alert' : watch && watch.over_80 > 0 ? 'warn' : 'neutral'}`, and add the spec's `<over_90> over 90%` to the sub line.

### LOW

**L1. Tile 2 sub drops the manual and scheduled split.** `PlatformActivity.tsx:255` prints `<engine_calls> engine calls, <research> research`; spec 5.1 item 2 is `<manual> manual, <scheduled> scheduled, <engine_calls> engine calls` plus research only when above 0. The server computes both counts (`platform-activity.js:231-232`) and the page discards them. Fix: follow the template.

**L2. Tile 3 sub is not `text-neg` when the level is bad.** `PlatformActivity.tsx:265-269`; spec 5.1 item 3 wraps the outage list and a bad rate line in `text-neg`. The Stat tone icon is the only red signal. Fix: wrap the sub in a span with `text-neg` when `health.level === 'bad'`; `Stat`'s `sub` is typed `ReactNode` (`Stat.tsx:15`), so no props change is needed.

**L3. Table cells differ from spec 5.1.** Engines (`:101-105`) shows the used engine names truncated with no `title` (visible as "ChatGPT, Gemini, Claude, P..." in `pa-light-1440.png`), where the spec asks `<used> of <entitled>` with labels in `title`; the Meter has no `valueLabel` of `<pct>% of EUR <budget>` (`:89-98`), so the euro budget and spend never appear on the page; an unknown plan prints `Unknown plan` (`:83`) instead of the raw value with `(unknown)`, which hides what the bad value is. Fix: follow 5.1; at minimum add a `title` to the truncated engines span.

**L4. At 390 px every tile label is cut.** `pa-dark-390.png`: "SIGNED IN, LAST 2...", "AI RUNS TODAY (U...", "ENGINE SUCCESS, ...", "CLIENTS OVER 80...". The cut removes the two qualifiers that carry meaning, "(UTC)" and "80%". Fix: let the label wrap on phones in the page's wrapper, or use shorter phone labels; do not change the `Stat` props.

**L5. The live announcer is imprecise.** `PlatformActivity.tsx:160`: "1 new events" for one row; the count includes research rows the default filter hides, so a screen reader hears "3 new events" and finds none; two consecutive batches of the same size set identical text and most screen readers do not re-announce it. Fix: count only visible rows, singular form, and clear the text before setting it (or append a counter).

**L6. Feed time has no full timestamp.** `PlatformActivity.tsx:54`; spec 5.1 asks the full ISO in `title`. A row from yesterday and today at the same clock time are indistinguishable. Fix: `title={row.at}`, or a `<time dateTime>` element.

**L7. A summary failure after a first success is silent.** `PlatformActivity.tsx:218` shows the error Notice only while `!data`, and the header status word follows the feed, not the summary. If the summary starts failing, tiles freeze with "Updated N min ago" as the only hint. Fix: show a muted line or the warn Notice whenever `summary.failed`.

**L8. Budget key lookup can map a prototype name.** `platform-activity.js:324` uses `PLAN_LIVE_ENGINES[plan] ? plan : 'essentials'` (prescribed verbatim by spec 3.3.1), while the gate uses `VALID_PLANS.includes(plan)` over own keys (`_auth.js:28`, `:246`). A `clients.plan` of `constructor` or `toString` would select a function as `budgetEur`, give `budget_pct` null and drop `budget_eur` from the JSON, where the gate would use the essentials budget. Reachable only if such a string is written to `clients.plan`, which has no CHECK constraint. Fix: use the already computed `planKnown` (own property check, `:321`) as the condition.

### INFO

**I1.** A 401 or 403 on one poller does not stop the other (`PlatformActivity.tsx:184` only merges the display). Each stops on its own 401 within at most 60 s, so the effect matches spec 3.6 in practice.

**I2.** With exactly 20,000 rows the month read reports `truncated` though nothing was cut (`platform-activity.js:288-289`). Conservative, harmless.

**I3.** React StrictMode is on (`src/main.tsx:10`). Read through: the feed source survives the double mount because `start()` clears `stopped` and the first in-flight response is accepted into the second subscription with no duplicate request; `useSummaryPoll` fires two requests on mount in development only.

**I4.** When the feed is stopped by a 401 before any batch, `!feedLoaded && !stopped` falls through to "No activity in the last 24 h." under the admin notice (`PlatformActivity.tsx:304-307`), which reads as data. Cosmetic.

**I5.** Feed rows are rendered in `font-mono text-meta`; at 390 px the detail wraps under the badge (screenshot), which is readable. Chip toggles are 28 px high on desktop and 32 px below 768 (`Chip.tsx:2`), under 44 px; existing primitive, not this change.

**I6.** PRE-EXISTING, not a live exposure: `requireAuth` lets an empty `Origin` through (`_auth.js:79`) and relies on the token. This page adds nothing to that.

## 6. Accessibility

| Check | Result | Evidence |
|---|---|---|
| Contrast, new text pairs (WCAG relative luminance from `src/index.css` triplets) | PASS | dark: `text-ink` on `surface` 15.54:1, `ink-2` 7.26:1, `ink-3` (feed time) 5.66:1; light: 19.86:1, 7.38:1, 6.03:1. Live dot `pos` on `surface` 9.54:1 dark, 4.30:1 light (non-text, 3:1 floor). Badge, Meter, Notice and Stat pairs are existing primitives, not recomputed. |
| Keyboard reach of new interactive elements | PASS by reading | two `Chip` toggles (buttons with `aria-pressed`, `Chip.tsx:23`), Retry `Button`, the restricted-page `Link`. The feed `ol` scrolls (`max-h-[480px] overflow-y-auto`) but is not focusable, so its overflow is not keyboard scrollable; rows are text only. Recorded under not checked for a real keyboard run. |
| Focus visibility | not changed | only existing primitives carry focus. |
| Heading order | PASS by reading | `PageHeader` title then two `SectionHeader` titles labelled by `aria-labelledby`. |
| Table | PASS | `th scope="col"` on all five headers (`:70-74`); sticky header from `tableClasses.th`. |
| Live region | PARTIAL | `aria-live="off"` on the list and one `role="status"` announcer (`:310`, `:318`), per spec; precision issues in L5. |
| Hit targets | INFO | Chip 28 px desktop (I5). |

## 7. Regression surface (grep)

- `src/App.tsx`: one lazy import and one route; the route table is shared by every page, so a typo would break routing app wide. tsc exit 0 and the orchestrator's demo render at `/platform-activity` cover it.
- `src/components/Layout.tsx`: imported by every routed page; the change adds one lucide icon and one `isAdmin` entry in the Manage group. Needs a manual look as a real admin: the sidebar order (Affiliates, Platform activity, Revenue, Onboard) and that the mobile bottom bar is unchanged.
- `netlify.toml`: one new function block between `revenue-report` and `audit-domain`; no other block touched.
- `netlify/functions/platform-activity.js`: imported by nothing. `rg -l "platform-activity" netlify src tests` returns only `App.tsx` and `Layout.tsx` (route path), `PlatformActivity.tsx`, the function itself and its test; the fetch URL lives in `platformActivity.ts` as `/.netlify/functions/platform-activity`. It reads `_auth.js` (`requireAuth`, `sumCostEur`, `monthStartIso`) and `_cost.js` read only.
- `src/lib/platformActivity.ts` and the fixture: imported only by `PlatformActivity.tsx`.

## 8. Data and claim integrity

Every number on the page is a field of the function response, computed from production tables: tile 1 from `auth.users.last_sign_in_at` joined to viewer `user_profiles`; tile 2 from `collection_runs` and `ai_results` since UTC midnight; tile 3 from `ai_results` status over 24 h; tile 4 and the Meter from `ai_results.cost_eur` against `PLAN_MONTHLY_API_BUDGET_EUR`; "Last active" from sign ins and own-viewer manual runs. Each is traced to `platform-activity.js` lines in section 3. The cross check against the gate's RPC is computed but its result is not shown (M1). New copy makes no factual claim. Demo fixture names are invented (`Northwind Bakery`, `Harbor Clinic`, `Lumen Studio`, `Pinecrest Legal`, `Kestrel Logistics`, `Research City Batch A`), and the test fixtures use `@example.com` and `Test` names only.

## 9. What was not checked

- Production build, entry and page chunk sizes (orchestrator's numbers used, not reproduced).
- The page in a browser by me; only the orchestrator's four screenshots were viewed (`pa-light-1440.png`, `pa-dark-390.png` in full; the other two not opened).
- A real admin session against a deployed function; real GoTrue `listUsers` paging behaviour and response shape beyond the fake.
- `useSummaryPoll` under test: no node test exercises it; its hidden, backoff and stop rules were checked by reading only.
- Real keyboard and screen reader passes; Firefox; reduced motion behaviour (relies on the existing `MotionConfig reducedMotion="user"`).
- Function latency against the p50 budgets in spec section 6.
- Live read after the push (checklist row 17).
- Remaining 66 lines of the fixture were grepped, not read line by line.

## 10. Amendment, 2026-11-14, orchestrator seat (not a second bg-verify run)

Closed after this review, re-checked from the orchestrator seat only:

- M1: the page renders `summary.warnings` as one warn Notice above the tiles (the page adds its own truncation line only if the server sentence is missing), and tile 4's sub line and every table percent cell carry "at least" when `truncated.ai_results_month` is true.
- M2: tile 4 is `alert` when `over_90 > 0`, `warn` when `over_80 > 0`; the sub line reads `<over_90> over 90%, <measured> measured`.
- L1: tile 2 sub follows spec 5.1 (manual, scheduled, engine calls, research runs only when above 0).
- L2: tile 3 sub is wrapped in `text-neg` when the level is bad; outage reads `<engines> failing`.
- L3: engines cell shows `<used> of <entitled>` with names in `title`; the percent cell carries `EUR spent of EUR budget` in `title`; an unknown plan prints the raw value plus `(unknown)`. The Meter keeps no `valueLabel` (the percent sits beside it); deviation accepted.
- L4: tiles use short labels below `sm` (`Sign ins, 24 h`, `Runs (UTC)`, `Success, 24 h`, `Budget 80%+`) with the full label for screen readers; no Stat props change. Measured at 390 px: no label cut.
- L5: the announcer counts only rows visible under the research filter, uses the singular for one, and alternates a zero width character so equal messages are re-announced.
- L6: feed time is a `<time dateTime title>` element with the full ISO.
- L7: a summary failure after a first success shows a muted line above the tiles.
- L8: the budget key uses the own property check (`planKnown`). Closing it found a worse sibling: `_cost.js` `activeEnginesFor` also uses a truthy lookup, so a `clients.plan` of `toString` threw and failed the whole summary with 500. The function now passes the already resolved key to `activeEnginesFor`; `_cost.js` is untouched (do-not-touch list). New check in `tests/platform_activity.test.js` fails before the fix (500) and passes after. The same truthy lookup in `_cost.js` is recorded, not fixed: it is reachable from the collectors only through a `clients.plan` value that no code writes.
- I4: a feed stopped by 401 before any batch renders nothing under the admin notice.
- Demo fixture: engines entitled corrected so used never exceeds entitled.

Re-run after the fixes: 70 of 70 node test files pass (platform_activity 67 checks, platform_activity_source 14), `tsc` exit 0, `npm run build` exit 0, entry chunk 602,628 bytes against 601,640 at the same tree before the change (+988, budget +1,000), page chunk 21.05 kB. Headless Chrome over CDP, demo mode, `/platform-activity` at 1440 and 390 wide, dark and light: real `scrollTo(600, 0)` leaves `scrollX` 0, no overflow-hidden element scrolled, sticky table header, 7 feed rows, 5 table rows, no em or en dash in the rendered text.
