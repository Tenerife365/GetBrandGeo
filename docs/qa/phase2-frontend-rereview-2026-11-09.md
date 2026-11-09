FAIL

# Phase 2 frontend re-review (results layer, six pages)

```
INTENT: re-review Phase 2 frontend after the F1 to F8 fix round  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, frontend lens, 2026-11-09. Prior review:
`docs/qa/phase2-frontend-review-2026-11-08.md` (BLOCK). Binding spec:
`docs/arch/phase2-results-layer-spec.md`. Nothing reviewed was edited. No git command other
than `git show HEAD:<path>`, no build, no browser, no database write (one read-only SELECT).
Every probe lives in the session scratchpad under
`C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\rr\`.

## Verdict in one paragraph

The two MAJOR findings are closed and reproduced closed: after a client switch the provider
hands every page `snapshot: null, status: 'loading'` on the very first render, in flight or
idle, and a late response from the previous client never reaches Mentions, Sentiment or the
Competitors trend. F3, F5, F6 and F7 are closed. It still fails, for four reasons, all small:
(1) acceptance 9.2 still fails on the Overview Refresh button (`Dashboard.tsx:273`, F4 left
open, outside both builders' scope); (2) a new MEDIUM regression from the F4 fix: `reload`
returns `void` instead of the spec's `Promise<boolean>`, so a failed quiet reload leaves the AI
Visibility Reload button disabled and spinning and a "Check now" waiting forever; (3) the
binding rule "every fix gets a test that fails without it" is not met for the F2 page guards
and the F1 provider guard (mutants survive the repo suite); (4) the shared suite is red,
`tests/phase1_server_hardening.test.js` 59 passed, 6 failed, caused by this round's collector
change (backend lane), fixed by one fixture line nobody owns yet. Independently of this
verdict, `client_results_latest` is still absent in production (read 2026-11-09), so the
bundle cannot ship before spec section 11 step 2.

## 1. Evidence run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `node tests/<f>.test.js`, all 45 files | 44 exit 0, 1 exit 1. Failing: `phase1_server_hardening` 59 passed, 6 failed (section 6). Phase 2 files: results_loader 16, views_a 37, views_b 17, metrics 27, csv 11, history_read 3, phase2_collector_gate 48, phase2_prompt_ownership 53, all 0 failed. Spec 10.4 set: fix_items 24, prompt_performance 50, no_answer_rows pass, keyset_read 5, mcp_server 83, reach_parity 5, competitor_aggregate 16. Full list in `tests_run.txt`. |
| Protected modules vs `git show HEAD:` (CR stripped) | `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts`, `fixItems.ts`, `promptPerformance.ts`, `netlify/functions/_score.js`, `collectionContext.tsx`, `clientContext.tsx`, `planConfig.ts`, `useCollectionLanded.ts`: all IDENTICAL, so every exported signature is unchanged. |
| Dash scan, added lines | 4,866 lines: added lines of the 11 modified files (diff of `git show HEAD:` against the working copy) plus every line of the 19 new src and test files. `rg '[\x{2014}\x{2013}]'`: 0 hits. Control file with one em and one en dash on one line: `rg -c` returns 1, so the scan fires. The em dashes visible in `BrandSentiment.tsx`, `Dashboard.tsx` and `AIVisibility.tsx` comments are in HEAD lines, not added. |
| Secret scan, same 4,866 lines | 10 pattern hits, all identifiers (`client_api_keys` table name, `Bearer` header assembly in two test fakes). No value. |
| Personal names in fixtures | none (`Acme Co`, `Beta Ltd`, `best sample tool`, `best dentist near me`). |
| Live, read only | `pg_proc` has 0 `client_results_latest`; `ai_results` 6,119 rows; client 1 has 1,928 mentioned non-error rows. |

## 2. Prior findings

| Id | Status | Evidence |
|---|---|---|
| F1 MAJOR, A's snapshot under B | CLOSED | Loader: `resultsLoader.ts:157-163` starts a different-key load at once, `run` bumps `seq` and emits `null/loading` (`:109-112`). Provider: `resultsContext.tsx:116-120` hides any snapshot whose key is not the current key. Reproduced in section 3.1 and 3.2. Defence in depth: `Recommendations.tsx:649` returns unless `snapshot.clientId === activeClientId`. Test gap recorded as N3. |
| F2 MAJOR, Mentions race | CLOSED | `Mentions.tsx:64-97` seq guard plus a client tag on the rows; same pattern in `BrandSentiment.tsx:82-132` and `Competitors.tsx:214-249`, `loadManual` guarded at `:252-266`. Reproduced in section 3.3. Test gap recorded as N3. |
| F3 MEDIUM, prompts revalidation | CLOSED | `loader.revalidate` `resultsLoader.ts:182-188`, called on consumer mount `resultsContext.tsx:95-102`; promptsOnly during a same-key flight dropped `:165`. Tests: 3 new in `results_loader.test.js`; a mutant making `revalidate` a plain `load` fails 2 of them (`mut_loader.js`). Provider probe: leaving for `/prompts` and coming back makes a second prompts read (section 3.2). |
| F4 MEDIUM, non-quiet Reload buttons | OPEN (1 of 4 sites) | Closed: `AIVisibility.tsx:498` Reload, `:2392` stale retry, `:991` Check now, `Mentions.tsx:153` stale retry. Open: `Dashboard.tsx:273` Refresh button still `reload()`. `verify_probe.js` rerun: a no-option reload emits `NULL,kept`, so the Overview drops to its skeleton on Refresh, and a failed Refresh replaces the data with the full error card. Acceptance 9.2 still fails here. |
| F5 LOW, trend counts inactive engines | CLOSED | `competitorsView.ts:84-89` `trendEligibleRows`, used at `Competitors.tsx:365`; `response_snippet` added to `TREND_COLUMNS` `:173`. `views_b` check "F5: trend drops inactive engines and no-answer rows". |
| F6 LOW, fix side reads waterfall | CLOSED | `AIVisibility.tsx:536-540`, one `Promise.all` of `fix_states` (with its step-down loop), `client_api_keys` and `oauth_grants`, both side reads by `client_id`, select `id, label` and `id, client_name` only. Source check in `views_a`. |
| F7 LOW, CSV columns | CLOSED | `aiVisibilityView.ts:117-158`: `yes`/`no` only for answered cells, sentiment only when mentioned, `toDisplayName` on names, Last answer at from `results`. Each column asserted in `views_a`. Caller passes `results` at `AIVisibility.tsx:789-794`. |
| F8 INFO, residual arithmetic | PARTLY CLOSED, accepted | Closed: engine band and best position read from `engineRates` (`AIVisibility.tsx:659-694`); `resultsKey` keyed on `snapshot.version` (`:933`). Open: `Competitors.tsx:355-356` recomputes `brandEngineIds`, which equals `engineCoverage(p).withMention` (`metrics.ts:308-317`) by construction; no number differs. Accepted as INFO. |

## 3. Reproductions

### 3.1 F1, loader (real `resultsLoader.ts`, `verify_probe.js` rerun)

```
after A load: key u:1
right after switch to B: snapshot.key = null status = loading
after A in-flight settles (B requested): snapshot.key = null status = loading fetches so far = 3
final: snapshot.key = u:2
```

Before the fix the second line read `snapshot.key = u:1 status = ready`. Mutants of the loader
run against the repo test file (`mut_loader.js`): restoring the old "queue as pending" branch
fails "F1: switch A to B with A in flight" (`1 !== 2`); removing the seq guard fails it and
"stale result is discarded after clear". The second F1 test ("A idle") passes against the old
loader, because the idle exposure lives in the provider, not the loader (see N3).

### 3.2 F1, provider (real `ResultsProvider` plus real loader, `provider_switch_probe.js`)

The provider runs under a minimal hooks runtime with supabase, `useClient` and `useCollection`
mocked; the value it hands the pages is read on every render. Sequence: client 1 loaded, a
collection lands (quiet forced reload of client 1 in flight), admin switches to client 2,
client 1's read lands late, then client 2's.

```
REAL, client 1 reload in flight at switch: renders exposing client 1 snapshot 0, first render after switch {"clientId":2,"snapKey":null,"status":"loading"}, final {"snapKey":"u:2"}
REAL, nothing in flight at switch:         renders exposing client 1 snapshot 0, first render after switch {"clientId":2,"snapKey":null,"status":"loading"}
MUTANT provider guard removed, in flight:  renders exposing client 1 snapshot 1, first render after switch {"clientId":2,"snapKey":"u:1","status":"ready"}
MUTANT provider guard removed, idle:       renders exposing client 1 snapshot 1
NAV: page to page x3 -> snapshot reads 1, prompts reads 1; after /prompts and back -> prompts reads 2
```

Spec 3.3 items 4, 5 and 9 hold. The NAV line is recorded under section 8.

### 3.3 F2, pages (real `Mentions.tsx`, `BrandSentiment.tsx`, `Competitors.tsx`, `page_switch_probe.js`)

Same hooks runtime; the page's own state, seq guards and client tags are the code under
test, `readResultHistory` returns gated promises. The probe is deliberately stricter than the
app: it hands the page client 2's snapshot on the first render after the switch (the real
provider hands `null`, so the page shows its skeleton for that render). Sequence: page open on
client 1 with the history read in flight, switch to client 2, client 2's read lands, then
client 1's (`B-then-A`, the prior review's exploit); also the reverse order, and client 1's
rows already loaded at the switch (`A-settled-first`).

```
Mentions       REAL  B-then-A / A-then-B / A-settled-first: leakedRenders 0, final ids 201,202
BrandSentiment REAL  B-then-A / A-then-B / A-settled-first: leakedRenders 0, final ids 201,202
Competitors    REAL  B-then-A / A-then-B / A-settled-first: leakedRenders 0, final ids 201,202
Mentions       MUTANT seq guard and client tag removed, B-then-A: final ids 101,102 (client 1's feed under client 2)
Mentions       MUTANT client tag removed, A-settled-first: 1 render with client 1 rows
Mentions       MUTANT seq guard removed, B-then-A: final ids empty (client 2's feed lost)
BrandSentiment MUTANT seq guard and client tag removed, B-then-A: final ids 101,102
Competitors    MUTANT trend seq guard and tag removed, B-then-A: final ids 101,102
Competitors    MUTANT manual seq guard removed, B-then-A: client 1's manual competitor listed under client 2 at the end
```

The real Competitors page renders client 1's manual competitors for one render after the
switch in the probe (`setManualComps([])` runs in an effect); in the real composition that
render is the provider's `null` snapshot, which returns `<RouteSkeleton />` before the list
(`Competitors.tsx:329-337`), so it is not reachable and is not a finding.

## 4. New findings, ranked

### N1, MEDIUM: `reload` returns void, so a failed quiet reload hangs the Reload button and Check now

What. Spec 3.2 fixes the contract as `reload(opts?): Promise<boolean>`, "resolves true when a
load committed without error", and 10.3 says the AI Visibility Reload button flashes when it
resolves true. `resultsContext.tsx:109-112` returns `void`. The page instead watches the
snapshot version: `AIVisibility.tsx:500-510` ends `reloading` only on `status === 'error'` or
a new version; `:994-1002` releases a Check now only on the same signals. A failed quiet
reload produces neither: the loader keeps the snapshot, same version, `status 'ready'`,
`loadError true` (`resultsLoader.ts:129`).

Reproduced (`quiet_fail_probe.js`, real loader, conditions copied from the page):

```
after failed quiet reload: status ready loadError true version 1
Reload button effect sees landed = false (false keeps reloading=true: button disabled and spinning)
Check now effect clears or proceeds = false (false leaves the check waiting with no notice)
```

Exploit path. On AI Visibility, click Reload while the RPC times out or the network drops for
one request. The Reload button (`:1674`, `disabled={loading || reloading}`) stays disabled with
a spinning icon until some later load succeeds; the only way out is the stale-note retry
(`:2386-2397`). A Check now click in the same condition never gives a verdict or a notice. This
became reachable this round: before F4 the button ran a non-quiet reload whose failure set
`status 'error'`.

Fix (bg-app foundation, then A). Make `reload` return `loader.load(...)` mapped to a boolean
(true when the state after settle is `ready` without `loadError` for the same key), per spec
3.2; in `AIVisibility.tsx` `await` it in `onReloadClick` and `checkFixNow` and clear
`reloading` / `checkAwaiting` on false with a notice. Test: a results_loader or provider
check that a failed quiet reload resolves false.

### N2, LOW: Mentions feed has no loading skeleton and shows "All engines (0)" while history loads

What. Spec 9: "the trend card or feed shows a `<Skeleton className="h-[220px] w-full rounded-lg" />`
until its history arrives". `Mentions.tsx` imports no `Skeleton`; while `history === null` the
feed area is empty (the empty state is gated on `history !== null`, `:296`) and the All
engines chip renders `fmt(t.men_allEngines, { n: mentions.length })` with `n = 0` (`:199`),
because `buildMentionsView` gets `history ?? []` (`:112`).

Exploit path. Open `/mentions` on client 1: 1,928 mentioned rows, two keyset pages. For the
whole read the summary cards show the real count while the chip says 0 engines' worth of
mentions and the list is blank with no loading signal. Same after every client switch.
Not introduced this round; missed by the first pass.

Fix (bg-app A). When `history === null` and not failed, render the spec 9 skeleton in place of
the feed and omit the count from the All engines chip.

### N3, MEDIUM (process, binding rule): the F1 provider guard and the F2 page guards have no test

What. The packet's binding rule: "Every fix gets a test that fails without it where testable."
No repo test touches `resultsContext.tsx` or the page guards (`rg "historySeq|mineNow|trendSeq|manualSeq|resultsContext" tests/`: 0 hits). Section 3.2 and 3.3 show both are testable in
plain node, and that removing the provider guard or any page guard leaks client 1's data while
all 45 repo test files stay as they are. The loader test "F1: switch A to B with A idle"
passes against the pre-fix loader, so it does not cover the idle exposure either.

Fix (bg-app foundation and A/B). Either extract the guards as pure functions (for example a
`visibleSnapshot(state, key)` used by the provider and an `ownRows(state, clientId)` used by
the three pages) and unit test them, or add the hooks-runtime harness of `page_switch_probe.js`
and `provider_switch_probe.js` to `tests/` with the REAL and MUTANT cases above.

### N4, INFO: the Overview Refresh button is also outside every builder scope this round

`Dashboard.tsx` belonged to neither app builder this round (app1: loader, provider, Mentions,
Sentiment, Competitors; app2: AI Visibility, Recommendations), which is why F4 stayed open
there. Route it explicitly: `onClick={() => { reload({ quiet: true }); void loadHistory(true) }}`.

## 5. Remaining `ai_results` reads in `src` (grep for `ai_results` and `.rpc(`, comments excluded)

| Site | Paged | Feeds | Class |
|---|---|---|---|
| `lib/resultsContext.tsx:36` RPC `client_results_latest` | yes, `readAllById` | every snapshot number on the six pages | OK |
| `lib/historyRead.ts:37` | yes, `readAllById`, `neq('status','error')` | trends, feeds, Checks tile | OK |
| `pages/AIVisibility.tsx:636` `id, cost_eur` this month | yes, `readAllById` | budget meter | OK, error rows kept on purpose (5.2) |
| `pages/Revenue.tsx:923` `client_id, llm, cost_eur` | no | admin per-client cost and row totals | PRE-EXISTING, unchanged (identical to HEAD), out of scope by spec 12. Live table is 6,119 rows, so with no window the admin totals sum at most the first 1,000. Admin only; not a security exposure; owner bg-backend per spec 12. |

No other `from('ai_results')` or `.rpc(` in `src/lib`, `src/components`, `src/pages`.

## 6. Test suite regression from the backend lane (not a frontend finding, a release condition)

`tests/phase1_server_hardening.test.js`: 59 passed, 6 failed (growth fast set, free asking
google_ai, client lookup error 500, both viewer force checks, admin force). It passed in the
first review. Cause: the new `loadPromptForCollect` read in the three collectors meets the
test's `promptDb` fake, which answers `{data:null}` for `prompts`, so the handler returns 404
before the code those checks exercise. The builder's scratch copy
(`...\scratchpad\p1\tests\phase1_server_hardening.test.js`) differs from the repo file only by
its absolute `FN` path and one line,
`if (st.table === 'prompts') return { data: { id: 7, text: 'best dentist near me', client_id: 42, is_active: true }, error: null }`,
and runs 65 passed, 0 failed here. That line must land in the same commit as the collector
changes; the file is outside every builder's scope this round, so the orchestrator has to
assign it. The collector changes themselves belong to the backend lens and were not reviewed
here beyond their two test files passing.

## 7. Regression surface (grep and probes)

- Client switch: provider and the three history pages proven above; `AIVisibility.tsx` fix
  reads drop a reply for a client no longer on screen (`clientRef.current !== cid`, `:542`);
  `Recommendations.tsx` history has a seq guard (`:605-619`) and clears on switch (`:633-640`);
  `Dashboard.tsx` history has a seq guard (`:99-120`) and is behind the provider's null
  snapshot on the first render.
- Demo mode: every changed read checks `isDemoMode` first (`AIVisibility.tsx:516`,
  `Mentions.tsx:81`, `BrandSentiment.tsx:94`, `Competitors.tsx:226,258`); provider branches at
  `resultsContext.tsx:32,40,66`. By reading; network not observed.
- Error and loading: full-error cards on all six pages call `reload()` with no snapshot
  (correct per 3.4); stale notes call `reload({ quiet: true })`; N1 and N2 are the gaps.
- `useResults` consumers: the six pages only; `ResultsProvider` once in `App.tsx:267`.
- New loader member `revalidate` is additive; `buildAiVisibilityCsvRows` gained a required
  `results` input with one caller.
- Manual look needed: the admin switcher on all six pages, Reload with the network throttled
  to fail (N1), `/mentions` on client 1 (N2), Overview Refresh (F4).

## 8. What was not checked

- Anything needing the RPC applied (it is absent): spec 2.2 to 2.5.
- A real browser: request counts (acceptance 3.3, 6.2). The provider probe models React's
  batching and shows page-to-page navigation makes 1 prompts read, not the 3 the spec's 3.3
  acceptance expects, because the consumer count goes 1 to 0 to 1 inside one commit and the
  mount effect never sees a rise; `/prompts` and back does revalidate. Not a correctness
  defect for F3's path; needs the network panel and a ruling from bg-architect on whether 3.3
  should read 1.
- Demo mode network silence (3.5), bundle budgets (6.3), time filter behaviour (7.2, 7.3),
  CSV opened in a spreadsheet (8.3), focus, contrast and light mode of any new control.
- React timing in a real renderer: the probes use a minimal hooks runtime, not React itself;
  they run the real page and provider source but not React's scheduler.
- The backend lane's collector code (`collect-prompt.js`, `collect-claude.js`,
  `collect-chatgpt.js`) and its findings, which carry the backend review's own numbering; the
  F2 reaper ruling it mentions is a backend item.
- `Revenue.tsx` behaviour beyond reading the select (out of scope, spec 12).

## 9. Block list and routing

1. F4: `Dashboard.tsx:273` to `reload({ quiet: true })`. Owner: assign (outside both app scopes).
2. N1: `reload` returns `Promise<boolean>` per spec 3.2; AI Visibility awaits it. bg-app foundation then A.
3. N3: tests for the provider guard and the three page guards that fail without them. bg-app foundation, A, B.
4. Section 6: the one `promptDb` line in `tests/phase1_server_hardening.test.js`, same commit as the collectors. Owner: assign.
5. N2: Mentions feed skeleton and chip count. bg-app A. LOW, may ride the same pass.

Re-verify by rerunning `mut_loader.js`, `provider_switch_probe.js`, `page_switch_probe.js` and
`quiet_fail_probe.js` from the scratchpad folder above (each loads the working-tree source),
tsc, and all of `tests/`.
