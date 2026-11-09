FAIL

# Phase 2 frontend final review (results layer, six pages)

```
INTENT: final review Phase 2 frontend after the N1 to N4 fix round  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, frontend lens, 2026-11-09. Prior: `docs/qa/phase2-frontend-rereview-2026-11-09.md`
(FAIL). Binding spec: `docs/arch/phase2-results-layer-spec.md`. Nothing reviewed was edited. No
git command other than `git show HEAD:<path>`, no build, no browser, no database write (one
read-only SELECT). Probes, mutant runner and outputs live in
`C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\final\`;
mutants ran in a scratch copy of `src` and `tests` there (`repo\`, `node_modules` by junction),
never in the repo.

## Verdict in one paragraph

Everything the re-review asked for that a user can see is now fixed and reproduced fixed:
`reload` returns `Promise<boolean>` and AI Visibility releases the Reload button and Check now
on `false` (N1), the Mentions feed shows the spec 9 skeleton and drops the chip count while its
history loads (N2), the Overview Refresh is a quiet reload (F4), and the phase1 fixture line is
in (suite 65 passed, 0 failed). tsc exits 0, all 46 test files exit 0, no dash was added, the
protected modules are byte identical to HEAD. It still fails on one item, the same binding rule
as last round: N3 is only partly closed. The client tag guards, the provider guard and the N1
and F4 wiring are now killed by tests, but the four F2 sequence guards (`Mentions.tsx:96`,
`BrandSentiment.tsx:115`, `Competitors.tsx:243` and `:262`) still have no test that fails
without them. Four on-disk mutants removing them survive the whole suite, and the hooks-runtime
probe shows what they protect: without `Competitors.tsx:262` client 1's manual competitor is
listed under client 2 at the end of the switch, and without any of the other three client 2's
feed or trend is lost for good. One new LOW (a false "did not load" notice after a client
switch during a Reload). Release preconditions outside this lens are unchanged: the RPC
`client_results_latest` is still absent in production, and the backend lane's N2 (C10 spend
bound) waits on Constantin.

## 1. Prior findings

| Id | Status | Evidence |
|---|---|---|
| N1 MEDIUM, `reload` returned void | CLOSED | `resultsContext.tsx:111-114` returns `loader.loadOk(...)`; `resultsLoader.ts:185-188` resolves `committedOk(state, key)` (`resultsGuards.ts:31-33`: ready, no loadError, same key). `AIVisibility.tsx:496-504` and `:993-1000` await it and on `false` clear `reloading` / `checkAwaiting` and show a `role="status"` notice (`:1690-1695`). Tests: 5 N1 checks in `results_loader.test.js:205-238` (committed true, failed quiet false with snapshot kept, non-quiet failure false, no interest false, superseded key false). Mutants G4 (committedOk ignores loadError) and G5 (loadOk always true) fail 1 and 4 checks; A1 and A2 (page ignores `false`) fail the wiring check. Matches spec 3.2 (`spec:489`). |
| N2 LOW, Mentions feed no skeleton, chip "(0)" | CLOSED | `Mentions.tsx:140` `historyLoading = history === null && !historyFailed`; `:243` renders `<Skeleton className="h-[220px] w-full rounded-lg" />`; `:205` drops the count while loading. The strip regex `/\s*\(\{n\}\)/` matches all 8 locale strings (`i18nContext.tsx:257,396,535,674,813,952,1091,1230`, each ends `({n})`). Mutants N2a and N2b fail the wiring check. Not seen in a browser. |
| N3 MEDIUM, guards without a test | PARTLY CLOSED, still OPEN | Closed: provider guard (`visibleSnapshot`) and the three page client tags (`ownRows`, `isOwn`) are pure functions in `resultsGuards.ts`, unit tested and wired (`client_switch_guards.test.js`, 14 checks). Open: the four F2 sequence guards, see section 3 and finding R1. |
| F4 open, Overview Refresh non-quiet | CLOSED | `Dashboard.tsx:273` `void reload({ quiet: true }); void loadHistory(true)`; failed quiet refresh shows the banner at `:278` instead of the full error card (spec 9.2). Mutant D1 fails the wiring check. |
| Re-review section 6, phase1 fixture line | CLOSED | `tests/phase1_server_hardening.test.js:259`. Repo: 65 passed, 0 failed. Scratch copy with only that line removed (`p1_noline.test.js`): 59 passed, 6 failed. |
| Re-review section 8, 3.3 prompts reads | UNCHANGED, ruling owed | Provider probe rerun: `NAV: page to page x3 -> snapshot reads 1, prompts reads 1; after /prompts and back -> prompts reads 2`. Still needs bg-architect on whether 3.3 should read 1. |

## 2. Evidence run

| Check | Result |
|---|---|
| `npx tsc --noEmit` (repo) | exit 0 |
| `node tests/<f>.test.js`, all 46 files | 46 exit 0, 0 exit 1. No pre-existing failure left (`phase1_server_hardening` was the only red one last round). Phase 2 files: `client_switch_guards` 14, `results_loader` 21, `views_a` 37, `views_b` 17, `metrics` 27, `csv` 11, `history_read` 3, `phase2_collector_gate` 48, `phase2_prompt_ownership` 87, `phase1_server_hardening` 65; spec 10.4 set: `fix_items` 24, `prompt_performance` 50, `no_answer_rows` pass, `keyset_read` 5, `mcp_server` 83, `reach_parity` 5, `competitor_aggregate` 16; all 0 failed. Full list: `scratchpad\final\tests_run.txt`. |
| Protected modules vs `git show HEAD:` (CR stripped, md5) | IDENTICAL: `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts`, `fixItems.ts`, `promptPerformance.ts`, `collectionContext.tsx`, `clientContext.tsx`, `planConfig.ts`, `useCollectionLanded.ts`, `_score.js`, `_plans.js`, `stripe-webhook.js`, `accept-terms.js`, `_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`. Exported signatures of the four named modules are therefore unchanged. |
| Changed set vs HEAD | New (22): `src/lib/{csv,historyRead,metrics,resultsContext,resultsGuards,resultsLoader}.ts(x)`, six `src/lib/views/*.ts`, `tests/{client_switch_guards,csv,history_read,metrics,phase2_collector_gate,phase2_prompt_ownership,results_loader,views_a,views_b}.test.js`, `tests/fixtures/results-fixture.js`. Modified (13): `App.tsx`, `Layout.tsx`, six pages, `phase1_server_hardening.test.js`, three collectors, and `unlock-audit-report.js`. The last is another session's attribution work (dirty since 2026-09-12 per CLAUDE.md, references `docs/growth/channel-attribution-spec.md`), not Phase 2, not reviewed, must stay out of the Phase 2 commit. |
| Dash scan, added lines | 5,344 lines: added lines of the 12 Phase 2 modified files (HEAD vs working copy) plus every line of the 22 new files. `rg -c "[\x{2014}\x{2013}]"`: 0 hits. Control file with one em and one en dash on one line: `rg -c` returns 1. |
| Secret scan, same lines | 10 hits, all identifiers: `client_api_keys` table name (`AIVisibility.tsx:543`, `views_a.test.js:180`), `Bearer` header parsing and a `token` argument in two test fakes. 0 value-shaped matches (`sk-`, `pk_live_`, JWT). |
| Personal names in fixtures | none (`Acme Co`, `Beta Ltd`, `best sample tool`, `best dentist near me`, `admin probe text`). |
| Live, read only | `pg_proc` has 0 `client_results_latest`; `ai_results` 6,119 rows; `prompts` carries 1 DELETE policy (context for the backend N2). |

## 3. N3 mutants, run on disk (`run_mutants.js`, `run_mutants2.js`, output `mutants_out.txt`)

Each mutant edits the scratch copy, runs 10 frontend suites (`client_switch_guards`,
`results_loader`, `views_a`, `views_b`, `metrics`, `csv`, `history_read`, `fix_items`,
`prompt_performance`, `no_answer_rows`), then restores. Baseline and restored runs all exit 0.

| Mutant | Result |
|---|---|
| G1 `visibleSnapshot` passthrough | KILLED, 2 checks |
| G2 `ownRows` ignores client | KILLED, 1 |
| G3 `isOwn` always true | KILLED, 2 |
| G4 `committedOk` ignores loadError | KILLED, 2 (guards and loader) |
| G5 `loadOk` always true | KILLED, 4 |
| P1 provider `const seen = state` | KILLED, wiring check |
| L1 loader seq guard on the full read removed | KILLED, 2 |
| M1 Mentions tag removed | KILLED, wiring |
| S1 Sentiment `isOwn` and `ownRows` removed | KILLED, wiring |
| C1 Competitors trend tag removed | KILLED, wiring |
| D1, A1, A2, N2a, N2b | KILLED, wiring |
| prior loader mutants `oldPending`, `noSeqGuard`, `revalidateIsLoad` (`rr\mut_loader.js`) | all exit 1 |
| **M2 Mentions `if (mine !== historySeq.current) return` removed** | **SURVIVED** |
| **S2 Sentiment `if (mine !== seq.current) return` removed** | **SURVIVED** |
| **C2 Competitors `if (mine !== trendSeq.current) return` removed** | **SURVIVED** |
| **C3 Competitors `if (mine !== manualSeq.current) return` removed** | **SURVIVED** |
| P2 provider `reload` returns true after any load | SURVIVED (see INFO I2) |
| M3 Mentions uses `historyState.rows`, keeps a dead `ownRows(historyState, activeClientId, null)` call | SURVIVED (see INFO I1) |
| R1 `Recommendations.tsx:618` seq guard removed; D2 `Dashboard.tsx:117` seq guard removed | SURVIVED (new Phase 2 code, not in the N3 list; recorded under R1) |

What the survivors protect, from the real pages under the hooks-runtime probe
(`page_switch_probe2.js`, the re-review probe with mutant patterns updated to the extracted
guards; output `page_probe_out.txt`). Sequence: page open on client 1 with its read in flight,
admin switches to client 2, client 2's read lands, then client 1's.

```
Mentions       REAL  B-then-A / A-then-B / A-settled-first: leakedRenders 0, final ids 201,202
BrandSentiment REAL  (same three orders): leakedRenders 0, final ids 201,202
Competitors    REAL  (same three orders): leakedRenders 0, final ids 201,202, client 2 manual list shown
Mentions       MUTANT noSeq B-then-A:        final ids ""  (client 2's feed lost, skeleton stays)
BrandSentiment MUTANT noSeq B-then-A:        final ids ""
Competitors    MUTANT trendNoSeq B-then-A:   final ids ""
Competitors    MUTANT manualNoSeq B-then-A:  textHasClient1 true, textHasManual2 false
               (client 1's manual competitor listed under client 2 at rest)
```

The provider probe (`provider_switch_probe2.js`) still shows 0 renders exposing client 1's
snapshot after a switch, in flight or idle, and 1 such render with the guard mutated out.

## 4. Findings, ranked

### R1, MEDIUM (binding rule, N3 residual): the F2 sequence guards have no test that fails without them

What. The packet's rule: every fix gets a test that FAILS without it. The four F2 guards
`Mentions.tsx:96`, `BrandSentiment.tsx:115`, `Competitors.tsx:243`, `Competitors.tsx:262` are new
in Phase 2 (0 sequence guards in the HEAD copies of the three pages). Removing any one leaves
all 46 test files green (section 3). `client_switch_guards.test.js` checks the client tags only.

Exploit path, from the probe above. An admin on `/competitors` for client 1 switches to client 2
while client 1's manual-competitors read is slow: client 1's read lands last and, without
`:262`, `setManualComps` writes client 1's manual competitors into client 2's page, and they
stay there. This list has no client tag behind it (`setManualComps(manual ?? [])`), so the seq
guard is its only protection. Without the other three, client 2's feed or trend is overwritten
by client 1's rows, which the tag then hides, leaving client 2 on a permanent skeleton or empty
trend until the next reload. Both cases are admin switcher paths; a viewer has one client.

Fix (bg-app). Either move `page_switch_probe2.js`'s hooks runtime into `tests/` with the REAL
and `noSeq` cases above as assertions (final ids `201,202`, client 2's manual competitor shown,
client 1's never), or extract a small pure sequencer (`createSeq()` with `next()` and
`isCurrent(n)`) into `resultsGuards.ts`, unit test it, and add wiring checks for each call site.
The first proves behaviour, the second only proves the call is present (see I1). Also tag
`manualComps` with its client id and read it through `ownRows`, like the other three, so the
seq guard is not its only line. `Dashboard.tsx:117` and `Recommendations.tsx:618` take the same
treatment in the same pass.

### R2, LOW (new): "Your results did not load" shows on a client that loaded, after a switch during Reload

What. `loadOk` correctly resolves `false` for a key that was superseded
(`results_loader.test.js:234`). `onReloadClick` (`AIVisibility.tsx:496-504`) and `checkFixNow`
(`:993-1000`) treat any `false` as a failure of the page that is now on screen, and
`reloadFailed` is never reset on a client switch (the reset effect at `:481-490` clears the
other notices, not this one).

Reproduced (`switch_mid_reload_probe.js`, real loader):

```
client 1 ready, version 1
client 1 reload resolves false | state now: key u:2 status ready loadError false
=> AIVisibility onReloadClick runs setReloadFailed(true) while client 2 is on screen and loaded
```

Exploit path. Admin clicks Reload on client 1, switches to client 2 before it lands: client 2
renders its fresh data under an amber "Your results did not load" line, which stays until the
next Reload. Same if a real failure on client 1 is followed by a switch. Misleading, not a data
exposure.

Fix (bg-app A). Capture `activeClientId` at click and ignore the result when it changed, and
add `setReloadFailed(false)` (and `setCheckAwaiting(null)`) to the client-switch effect at
`:481-490`.

### I1, INFO: the wiring checks are text matches

`client_switch_guards.test.js:57-87` asserts the guard call text is present, not that its result
is used. Mutant M3 keeps a dead `ownRows(historyState, activeClientId, null)` and renders
`historyState.rows`; it survives. Acceptable as a tripwire against accidental deletion, not as
proof of behaviour. The R1 harness would cover it.

### I2, INFO: the provider's `reload` mapping is untested

Mutant P2 (`reload` awaits `loader.load` then returns `true`) survives; `loadOk` itself is
tested at loader level. One wiring check `/return loader\.loadOk\(key, activeClientId/` would
close it.

## 5. Accessibility, new UI this round

| Element | Check |
|---|---|
| AI Visibility reload notice (`AIVisibility.tsx:1690-1695`), `text-amber-300` | Dark: #fcd34d on page `--dark-900` #0a0f1e 13.24:1. Light: `index.css:214` remaps to rgb(180 83 9) #b45309, on #f7f7fb 4.70:1, passes 4.5:1. `role="status"`, icon `aria-hidden`. Computed from tokens, not observed in a browser. |
| Mentions feed skeleton | Decorative, no text; `index.css` stops `animate-pulse` under reduced motion. |
| Mentions All engines chip | Same control, label shorter while loading; `aria-pressed` unchanged. |
| New interactive elements | None this round. No new headings. |

## 6. Remaining `ai_results` reads in `src` (grep `ai_results` and `.rpc(`, comments excluded)

| Site | Paged | Feeds | Class |
|---|---|---|---|
| `lib/resultsContext.tsx:37` RPC `client_results_latest` | yes, `readAllById` | every snapshot number on the six pages | OK (RPC absent in production, see release conditions) |
| `lib/historyRead.ts:37` | yes, `readAllById`, `neq('status','error')`, `client_id` | trends, feeds, Checks tile | OK |
| `pages/AIVisibility.tsx:641` `id, cost_eur` this month, `client_id` | yes, `readAllById` | budget meter | OK, error rows kept on purpose (spec 5.2) |
| `pages/Revenue.tsx:923` `client_id, llm, cost_eur` | no | admin per-client cost totals | PRE-EXISTING, identical to HEAD, out of scope by spec 12. With 6,119 rows and no window it sums at most the first 1,000. Admin only, not an exposure; owner bg-backend. |

No other `from('ai_results')` or `.rpc(` in `src/lib`, `src/components`, `src/pages`.

## 7. Regression surface

- `reload` type changed `void` to `Promise<boolean>`: callers are the six pages; all compile
  (tsc 0); floating calls at `AIVisibility.tsx:431,438,458,475`, `Recommendations.tsx:643`,
  and the error cards are fire-and-forget by design.
- `ResultsLoader` gained `loadOk` (additive); `resultsLoader.ts` and `resultsGuards.ts` import
  each other (type-only on the guards side, erased at compile, loads fine under node).
- `resultsGuards.ts` consumers: `resultsContext.tsx`, `resultsLoader.ts`, `Mentions.tsx`,
  `BrandSentiment.tsx`, `Competitors.tsx`.
- Manual look needed: admin switcher on all six pages (R1, R2), Reload with the network
  throttled to fail (N1 path), `/mentions` on client 1 (N2 skeleton), Overview Refresh failing.

## 8. Release conditions outside this lens (unchanged, not frontend findings)

1. `client_results_latest` is absent (`pg_proc` 0, read 2026-11-09). The bundle cannot ship
   before spec section 11 step 2; until then every results page shows its load error card.
2. Backend lane N2 (viewer-controlled delete race, C10 spend bound FAIL) waits on Constantin's
   ruling; backend N1 and N4 are closed by that lane's own suite (87 passed here) but were not
   reviewed by this lens.
3. The Phase 2 commit must exclude `unlock-audit-report.js` and include the
   `phase1_server_hardening.test.js:259` line, or dashboard-ci goes red.

## 9. What was not checked

- A real browser or React's own scheduler: the probes run the real page and provider source
  under a minimal hooks runtime. Skeleton visuals, the notice, light mode, focus, request counts
  (acceptance 3.3, 6.2), demo-mode network silence (3.5), bundle budgets (6.3), time filter
  (7.2, 7.3), CSV in a spreadsheet (8.3).
- Anything that needs the RPC applied (spec 2.2 to 2.5).
- The collector code and the backend findings (separate lens); I ran their tests only.
- Spec 10.1 (`git diff --name-only` per builder): needs git; the HEAD comparison in section 2
  is the closest I could do, and it matches the two builders' declared files plus earlier
  rounds' files and the unrelated `unlock-audit-report.js`.
- `Revenue.tsx` beyond its select.

## 10. Block list and routing

1. R1: tests that fail without each of the four F2 sequence guards (plus `Dashboard.tsx:117`
   and `Recommendations.tsx:618`), and a client tag on `manualComps`. bg-app. Re-verify with
   `run_mutants.js` (M2, S2, C2, C3 must be KILLED) and `run_mutants2.js` (R1, D2).
2. R2: LOW, may ride the same pass. bg-app A.
3. I1, I2: optional, same pass.

Re-verify by rerunning, from the scratchpad `final\` folder, `node run_mutants.js`,
`node run_mutants2.js`, `node page_switch_probe2.js`, `node provider_switch_probe2.js`,
`node switch_mid_reload_probe.js` (copy `src` and `tests` into `final\repo\` fresh first), plus
tsc and all of `tests/`.
