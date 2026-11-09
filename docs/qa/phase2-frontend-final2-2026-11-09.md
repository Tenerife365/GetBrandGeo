PASS WITH FINDINGS

# Phase 2 frontend final review, round 2 (R1, R2, I1, I2 and the ruling 1 Prompts archive UI)

```
INTENT: review Phase 2 frontend after the R1/R2 fix round and ruling 1  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, frontend lens, 2026-11-09. Prior: `docs/qa/phase2-frontend-final-2026-11-09.md`
(FAIL on R1). Rulings: `docs/arch/phase2-dashboard-plan-2026-11-08.md`, "Rulings made 2026-11-09".
Nothing reviewed was edited. No build, no browser, no database write (two read-only SELECTs).
Mutants ran in a fresh scratch copy of `src`, `tests` and `netlify` with `node_modules` by
junction:
`C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\final2\`
(`run_mutants.js`, `mutants_out.txt`, `page_switch_probe3.js`, `page_probe_out.txt`,
`tests_run.txt`, `added.txt`). Delete `final2\repo\node_modules` with `rmdir`, it is a junction
into the repo.

## Verdict in one paragraph

Every item the prior FAIL named is closed and reproduced closed. All eight named mutants
(M2, S2, C2, C3, R1, D2, M3, P2) are now KILLED, as are 22 more this round, including variants
that keep the guard text alive but defeat it, the sequencer itself, R2, and the archive branch:
30 of 30 killed, baseline and restore clean. The behavioural probe on the real pages agrees:
correct pages show client 2's rows only, and each removed guard loses client 2's feed, trend or
manual list. R2 is fixed in the page. Ruling 1 is wired correctly: a non-admin never reaches a
`prompts` delete, an admin keeps hard delete, the archive copy is traced claim by claim to the
enqueue filter, the collectors and the `enforce_prompt_cap` trigger, and demo mode stays
network-silent. tsc exits 0, all 49 test files exit 0, no dash was added, and the protected
modules are byte-identical to HEAD. What is left is one LOW (archive copy still owes bg-copy
sign-off) and two INFO. The release preconditions outside this lens are unchanged and still
hold the ship: `client_results_latest` is absent in production, and the `prompts_delete`
migration is written but not applied.

## 1. Acceptance criteria

| # | Criterion (from the task packet) | Result | Evidence |
|---|---|---|---|
| 1 | Re-run M2 (Mentions seq guard) against the current tree | PASS, KILLED | `mutants_out.txt`: `page_sequencing.test.js` 2 fails ("drops stale results with isStale", "guard sits after its await"). Target `Mentions.tsx:96` `if (isStale(historySeq, mine)) return`. |
| 2 | Re-run S2 (Sentiment seq guard) | PASS, KILLED | 2 fails, same two checks. Target `BrandSentiment.tsx:115`. |
| 3 | Re-run C2 (Competitors trend seq) | PASS, KILLED | 2 fails. Target `Competitors.tsx:251`. |
| 4 | Re-run C3 (Competitors manual seq) | PASS, KILLED | 2 fails. Target `Competitors.tsx:270`. |
| 5 | Re-run R1 (Recommendations seq) | PASS, KILLED | 2 fails. Target `Recommendations.tsx:619`. |
| 6 | Re-run D2 (Dashboard seq) | PASS, KILLED | 2 fails. Target `Dashboard.tsx:118`. |
| 7 | Re-run M3 (dead `ownRows` call, raw rows rendered) | PASS, KILLED | 1 fail, "pages never render the raw tagged state (I1)" (`page_sequencing.test.js`). |
| 8 | Re-run P2 (provider `reload` resolves true always) | PASS, KILLED | 1 fail, "provider reload returns loader.loadOk for the active key (I2)". Target `resultsContext.tsx` `return loader.loadOk(key, activeClientId, { quiet: opts?.quiet, force: true })`. |
| 9 | Verify R2 | PASS | `AIVisibility.tsx:495-500` keeps `activeClientRef` current and resets `reloadFailed` and `checkAwaiting` on `[activeClientId]`; `:510-514` and `:1006-1011` capture `startedFor` and call `shouldReportReloadFailure(ok, startedFor, activeClientRef.current)` (`resultsGuards.ts:56-58`, `!ok && startedFor === currentClient`). The loader still resolves `false` for a superseded key (rerun of `switch_mid_reload_probe.js`: "client 1 reload resolves false, state now key u:2 ready"), which the page now drops because `shouldReportReloadFailure(false, 1, 2)` is `false` (unit check in `page_sequencing.test.js`). Mutants R2a (ignore client), R2b (no reset on switch), R2c (compare against `startedFor`) all KILLED. |
| 10 | Prompts archive: a viewer never calls delete | PASS | `promptRemoval.ts:13-15` `removalMode(isAdmin)`; `Prompts.tsx:239-245` the only `from('prompts').delete()` in `src` sits behind `write.op === 'delete'`. Grep of `src` for `.delete(` finds no other `prompts` delete; grep of `netlify/functions` finds no function that deletes `prompts`. Mutants "viewer deletes", "page always deletes", "page passes true for mode", "second delete in another file" all KILLED. |
| 11 | Prompts archive: an admin keeps hard delete | PASS | `removalMode(true)` is `'delete'`, `removalWrite('delete')` is `{ op: 'delete' }`, the confirm keeps today's wording (`promptRemoval.ts:22-23`). Mutant "admin archives" KILLED. |
| 12 | Prompts archive: copy is honest | PASS | Each claim traced, section 3. Mutant "confirm says deleted for archive" KILLED. Copy deck sign-off still owed (finding L1). |
| 13 | Prompts archive: demo mode | PASS | `Prompts.tsx:241` the write sits inside `if (!isDemoMode)`; demo filters the local list only, as at HEAD. In demo `isAdmin` is never set, so demo shows Archive with the archive copy, which matches what demo does (local removal, nothing deleted). |
| 14 | `npx tsc --noEmit` | PASS | exit 0 (repo). |
| 15 | Every node test in `tests/` | PASS | 49 files, 49 exit 0 (`tests_run.txt`). New or changed: `page_sequencing` 29, `prompts_archive` 8, `client_switch_guards` 14, `phase2_prompt_ownership` 99, `phase2_schedule_worker_trigger` 11, `phase2_collector_gate` 48, `phase1_server_hardening` 65, `refresh_cadence` 17, `enqueue_history` 23; all 0 failed. |
| 16 | Dash scan with positive control | PASS | 3,608 lines: lines added vs `git show HEAD:` in the 14 modified files (seven pages, `App.tsx`, `Layout.tsx`, three collectors, `schedule-collections.js`, `phase1_server_hardening.test.js`) plus every line of 11 new files (`resultsGuards.ts`, `promptRemoval.ts`, `resultsContext.tsx`, `resultsLoader.ts`, four new or changed tests, both SQL files). `rg -c "[\x{2014}\x{2013}]"`: 0. Control file with one em and one en dash on one line: 1. |
| 17 | Exported signatures vs `git show HEAD` | PASS | CR-stripped md5 IDENTICAL for `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts`, and for `_plans.js`, `_cost.js` (holds `PLAN_LIVE_ENGINES`), `planConfig.ts` (holds `PLAN_ORDER`), `stripe-webhook.js`, `accept-terms.js`, `_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`, `clientContext.tsx`, `collectionContext.tsx`. |

## 2. Mutant run (`final2\run_mutants.js`, output `mutants_out.txt`)

Each mutant edits the scratch copy, runs 12 frontend suites (`page_sequencing`,
`prompts_archive`, `client_switch_guards`, `results_loader`, `views_a`, `views_b`, `metrics`,
`csv`, `history_read`, `fix_items`, `prompt_performance`, `no_answer_rows`), and if all stay
green it runs every test file before calling it a survivor. Then it restores. Baseline and
restored runs: 12 of 12 exit 0.

| Mutant | Result |
|---|---|
| M2, S2, C2, C3, R1, D2 (the six seq guards removed) | KILLED, 2 checks each |
| M3, P2 | KILLED, 1 check each |
| M2v guard compares to `historySeq.current` instead of the ticket | KILLED, 2 |
| M2w guard moved before the await | KILLED, 1 (ordering check) |
| S2v Sentiment demo branch writes without `isStale` | KILLED, 1 |
| G6 `isStale` always false | KILLED, 3 (behavioural sequencer checks) |
| G7 `nextSeq` does not advance | KILLED, 3 |
| C4 `manualComps` read without `ownRows` | KILLED, 1 |
| R2a, R2b, R2c | KILLED, 1 each |
| G1, G2, G4, M1, S1, C1 (prior set, re-pointed) | KILLED, 1 to 2 each |
| Archive: viewer deletes, admin archives, patch keeps `is_active` true, page always deletes, page passes `true`, archive copy says "deleted", a second `prompts` delete in another file | KILLED, 1 to 2 each |

30 of 30 killed, 0 survivors.

Behaviour, not only wiring (`page_switch_probe3.js`, the prior hooks-runtime probe with its
mutant patterns re-pointed to the `isStale` guards; runs the real page source, reads only).
Order: page open on client 1 with its read in flight, admin switches to client 2, client 2's
read lands, then client 1's.

```
Mentions       REAL  B-then-A / A-then-B / A-settled-first: leakedRenders 0, finalIds 201,202
BrandSentiment REAL  (same three orders): leakedRenders 0, finalIds 201,202
Competitors    REAL  (same three orders): leakedRenders 0, finalIds 201,202, textHasManual2 true, textHasClient1 false
Mentions       MUTANT noSeq B-then-A:            finalIds ""  (client 2 feed lost)
BrandSentiment MUTANT noSeq B-then-A:            finalIds ""
Competitors    MUTANT trendNoSeq B-then-A:       finalIds ""
Competitors    MUTANT manualNoSeq B-then-A:      textHasManual2 false (client 2 manual list lost; the new tag hides client 1's)
Competitors    MUTANT manualNoSeqNoTag B-then-A: textHasClient1 true (client 1 manual shown under client 2, the prior R1 leak)
```

So the `manualComps` tag now closes the cross-client display on its own, and the seq guard is
still needed to keep client 2's own list. The provider probe rerun is unchanged: 0 renders
expose client 1's snapshot after a switch, 1 with the guard mutated out.

## 3. Ruling 1, archive copy traced

| Claim (`promptRemoval.ts:24`, cap hints `Prompts.tsx:263,290,291,440,467`) | Source |
|---|---|
| "It stops being checked" | `_enqueue.js:113-117` selects `is_active = true` only; `collect-claude.js:75-87` (same in the other two collectors) returns `skip: 'prompt_inactive'` for a non-admin on an inactive prompt. |
| "no longer counts toward your plan" / "Archive one to add another" | Live `enforce_prompt_cap()` (read 2026-11-09): returns early when `new.is_active` is not true, and counts `is_active is true` rows only. Reactivation (inactive to active) is re-checked against the cap, so an archived prompt cannot be re-activated past the cap through the API. |
| "The answers already collected for it are kept" | The viewer path is an `UPDATE` of `is_active` (`removalWrite`); the `ON DELETE CASCADE` to `ai_results` fires only on delete. |
| A viewer can perform the archive | Live `prompts_update`: `USING` and `WITH CHECK` `(is_admin() OR has_client_access(client_id))`, role `authenticated`. Backend lane's rolled-back probe: viewer UPDATE on prompt 481 = 1 row. Not re-probed here. |

Live `prompts_delete` still reads `(is_admin() OR has_client_access(client_id))`: the admin-only
migration is not applied, as expected. The new bundle works under both policies.

## 4. Security findings

None. The change reduces what a viewer can do (no hard delete from the UI) and adds no new
read or write surface. Secret scan over the 3,608 added lines: 14 hits, all identifiers or
placeholders (`client_api_keys` table name, `Bearer` parsing in test fakes,
`test-cron-secret-placeholder`, "no new secret" comments, `service_role` grants in SQL). 0
value-shaped matches. No UUIDs or personal names in the added lines.

## 5. Findings, ranked

### L1, LOW: archive copy not yet signed off by bg-copy

What. `promptRemoval.ts:24` and `:30` and the "Archive one to add another" cap hints are new
customer-facing text written by the builder, not from the copy deck. Section 3 traces every
claim and finds them true, so this is process, not a false claim. Fix: bg-copy reviews the
three strings before the build; no code change unless it rewords them, and then
`prompts_archive.test.js` "verbs and copy differ and are honest" must be updated with it.

### I1, INFO: the archive control still looks destructive

`Prompts.tsx:698` keeps HEAD's `hover:text-red-400 hover:bg-red-500/10` for the Archive icon,
a red hover on an action that loses nothing. Not a defect, a design call for bg-design.

### I2, INFO: process deviations, both read-only

The bg-app builder reports one `git diff -U0` run. This review ran one `git cat-file -e` per new
file to confirm it was untracked. Both are read-only, neither changed anything, and both break
the "no git except `git show HEAD:<path>`" rule. Recorded for honesty.

## 6. Accessibility, new UI this round

| Element | Check |
|---|---|
| Archive icon button (`Prompts.tsx:698`) | Same classes as HEAD's delete button: `aria-label` "Archive prompt: <text>" for a non-admin, "Delete prompt: <text>" for an admin; hit target 26px plus the `after:[inset:-9px]` overlay, 44px; focus by the global `:focus-visible` rule (`index.css:633`). Icon colour `text-slate-500` is unchanged from HEAD (remapped in dark mode, `index.css:146-151`). Not observed in a browser. |
| Cap notice copy | Text only changed (Delete to Archive for a viewer); same container and colours as HEAD. |
| New headings | None. |

## 7. Regression surface

- `resultsGuards.ts` gained `nextSeq`, `isStale`, `shouldReportReloadFailure` (additive).
  Importers: `Mentions.tsx`, `BrandSentiment.tsx`, `Competitors.tsx`, `Dashboard.tsx`,
  `Recommendations.tsx`, `AIVisibility.tsx`, `resultsContext.tsx`, `resultsLoader.ts`.
- `promptRemoval.ts` is imported by `Prompts.tsx` only.
- `Prompts.tsx` now imports `Archive` from `lucide-react` (existing dependency).
- Manual look still needed: admin switcher on all six pages while a read is slow, Reload then
  switch on AI Visibility, viewer Archive on `/prompts` against the live database, an admin in
  "view as customer" (sees Archive, by design), and light mode for the Archive icon.

## 8. Release conditions outside this lens (unchanged)

1. `client_results_latest` is absent in production (`pg_proc`, read 2026-11-09). The bundle
   cannot ship before spec section 11 step 2.
2. `db/supabase-prompts-delete-admin-only-2026-11-09.sql` is written, proven in a rolled-back
   transaction by the backend lane, and NOT applied. Order: the build carrying this
   `Prompts.tsx` first, then the migration on Constantin's go, or the live bundle's viewer
   delete silently affects 0 rows and the row comes back on reload. HUMAN CHECKPOINT stays
   with the backend lane's review (RLS).
3. The Phase 2 commit must exclude `netlify/functions/unlock-audit-report.js` (modified,
   another session's work, md5 differs from HEAD) and include
   `tests/phase1_server_hardening.test.js`.
4. Spec 3.3 (prompts read twice after `/prompts` and back) still needs bg-architect's ruling;
   provider probe rerun shows the same 1 then 2.

## 9. What was not checked

- A real browser, React's own scheduler, light mode, visual rendering of the Archive control.
- A viewer UPDATE probe of my own: I read the live policies and trigger by SELECT and relied
  on the backend lane's rolled-back probe for the row count.
- Behavioural (hooks-runtime) probes of `Dashboard.tsx` and `Recommendations.tsx`: their guards
  are covered by the sequencer unit tests and wiring checks only.
- The backend changes (`schedule-collections.js` worker trigger, collector I1 and I2, both SQL
  files) beyond running their tests and the dash and secret scans: separate lens.
- `refresh_cadence.test.js` inside the scratch copy (it reads files outside the copied tree and
  fails there); it passes in the repo and was excluded from mutant judgement.
- Anything requiring the RPC applied (spec 2.2 to 2.5), request counts, bundle budgets.
