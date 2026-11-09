BLOCK

# Phase 2 frontend review (results layer, six pages, Layout)

```
INTENT: review Phase 2 frontend lanes (foundation, page A, page B)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, frontend lens, 2026-11-09. Binding spec:
`docs/arch/phase2-results-layer-spec.md`. Nothing reviewed was edited. No git command
other than `git show HEAD:<path>` was run. No build, no browser, no database write.

## Verdict in one paragraph

The metric layer is sound: every snapshot number on the six pages now comes from
`metrics.ts` over population P, the protected modules are byte-identical to HEAD, tsc
exits 0, all 44 node test files pass, and no capped `ai_results` select feeds a total on
the six pages. It is BLOCKED on spec acceptance 3.4 ("Switching client never renders the
previous client's numbers"), which fails and is reproduced below against the real
`resultsLoader.ts`, plus a page-level race in `Mentions.tsx` that can leave client A's
mention feed under client B permanently. Two MEDIUM items (non-quiet Reload buttons, the
unwired prompts revalidation) should go back in the same builder pass. The RPC is not yet
applied in production (read 2026-11-09: `pg_proc` has 0 `client_results_latest`), so this
bundle must not ship before step 2 of spec section 11 regardless.

## 1. Evidence run

| Check | Result |
|---|---|
| `npx tsc --noEmit` (brandgeo-dashboard) | exit 0 |
| `node tests/<f>.test.js` for all 44 files in `tests/` | 44 of 44 exit 0. New: csv 11, history_read 3, metrics 27, results_loader 11, views_a 26, views_b 16, phase2_collector_gate 36. Existing named in spec 10.4: fix_items 24, prompt_performance 50, no_answer_rows pass, keyset_read 5, mcp_server 83, reach_parity 5, competitor_aggregate 16. No failure to attribute. |
| Protected modules vs `git show HEAD:` (CR stripped) | `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts`, `fixItems.ts`, `promptPerformance.ts`, `netlify/functions/_score.js`: all IDENTICAL, so exported signatures are unchanged. `collectionContext.tsx`, `useCollectionLanded.ts`, `planConfig.ts`, `clientContext.tsx` also IDENTICAL. |
| Dash scan, added lines | 902 lines added across the 8 modified frontend files (diff of `git show HEAD:` against the working copy), plus every new file under `src/lib` and the new tests: `rg` for the two characters U+2014 and U+2013: 0 hits. Positive control file with one em and one en dash: `rg -c` returns 2, so the scan fires. |
| Live, read only | `client_results_latest` absent (0 rows in `pg_proc`); FK `recommendations_run_id_fkey` present, so the embedded reads at `Recommendations.tsx:612-616` and `Dashboard.tsx:150-155` are valid; client 1: 3,829 rows, 1,928 mentioned. |
| Probe script | `C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\verify_probe.js`, loads the real `resultsLoader.ts` and `csv.ts`; output quoted below. |

## 2. Acceptance criteria

| Criterion (spec) | Result | Evidence |
|---|---|---|
| 1.2 no row arithmetic greps in the six pages | PASS | `rg "brand_mentioned\)\.length\|reduce\(\(s, r\) => s \+ \(r\.brand_position\|aggregateCompetitors\("` on the six pages: 0 hits |
| 1.3 / 4.5 mentionRate equals recognition | PASS | covered in `tests/metrics.test.js`, 27 passed |
| 1.4 protected modules unchanged | PASS | section 1 table |
| 3.1 loader unit tests | PASS | `tests/results_loader.test.js` 11 passed |
| 3.3 item 4 and 5, a snapshot of another key is never exposed | FAIL | F1 |
| 3.3 item 6 consumer-mount revalidation (promptsOnly) | FAIL | F3 |
| 3.3 item 9 stale guard checks key equals current key | FAIL | F1, `resultsLoader.ts:115-119` commits whatever key was in flight |
| 3.3 item 12 demo mode never calls supabase | PASS (by reading) | `resultsContext.tsx:32-43` branches on `isDemoMode` before `rpc` and `from`; auth effect returns early `:66`; every page-local read checks `isDemoMode` first (`Dashboard.tsx:101,146`, `AIVisibility.tsx:515,622`, `Mentions.tsx:73`, `BrandSentiment.tsx:91`, `Competitors.tsx:219,247`, `Recommendations.tsx:608`). Network not observed. |
| 3.3 item 13 mount point | PASS | `App.tsx:266-268` and `:317-319`: CollectionProvider, ResultsProvider, TimeFilterProvider in that order |
| 3.4 switching client never renders previous client's numbers | FAIL | F1, F2 |
| 5.2 no `from('ai_results')` in five pages, one paged in AIVisibility | PASS | section 4 |
| 5.3 history consumers have their own sequence guard | FAIL for Mentions | F2; Dashboard `:99,117`, Sentiment `:88,110`, Competitors `:214,233` have one |
| 6.1 waterfalls | PASS WITH DEVIATION | F6 (fix side reads still depend on fix rows) |
| 7.1 time filter routes and label | PASS (by reading) | `Layout.tsx:415` four routes, `:1101-1102` label span plus `role="group"` `aria-labelledby` |
| 8.1 CSV escaping and guard | PASS | probe output section 6 |
| 8.2 AI Visibility CSV columns | PASS WITH DEVIATION | F7 |
| 9.1 no `text-sm animate-pulse` in the six pages | PASS | rg 0 hits |
| 9.2 a quiet reload never shows a skeleton | FAIL for the Reload buttons | F4 |
| 10.2 tsc, 10.3 and 10.4 tests | PASS | section 1 |
| 2.2 to 2.5, 3.3 (request counts), 3.5, 6.2, 6.3, 7.2, 7.3, 8.3 | NOT CHECKED | need the applied RPC, a browser or the service key; see section 8 |

## 3. Findings, ranked

### F1, MAJOR: client A's snapshot is rendered under client B after a switch (fails 3.4)

What. `resultsContext.tsx:106` exposes `state.snapshot` with no check that
`snapshot.key === key`. `resultsLoader.ts:135-138`: when a load for a new key arrives
while another key is in flight, it only records `pending` and emits nothing, so the old
client's snapshot stays in state with `status 'ready'`; `run` (`:115-119`) then commits
the old client's response because only `seq` is compared, never the key.

Reproduced (real module, `verify_probe.js`):

```
after A load: key u:1
right after switch to B: snapshot.key = u:1 status = ready
after A in-flight settles (B requested): snapshot.key = null status = loading fetches so far = 3
final: snapshot.key = u:2
```

Exploit path. Admin on client A's AI Visibility or Recommendations page; a collection
lands (provider fires a quiet forced load, `resultsContext.tsx:96-99`) or they press a
quiet reload; within the RPC round trip (spec measured 507.6 ms as a viewer) they pick
client B in the switcher (`clientContext.tsx:282-290` sets id and client synchronously,
so `ready` is true at once). For the whole flight the pages render A's rows with B's
name, B's `activeEngines` and B's header. No page compares `snapshot.clientId` with
`activeClientId` (grep of the six pages: only `AIVisibility.tsx:948` does, for fix
checks). Worst consequence: `Recommendations.tsx:649-662` builds the Generate payload
from `snapshot`-derived stats and sends `client_id: activeClientId`, so a Generate click
in that window stores advice computed on A's data in B's history. Even with nothing in
flight, the first render after a switch still shows A's snapshot until the provider's
effect (`:92-94`) emits null.

Fix (bg-app, foundation lane). In the provider expose
`snapshot: state.snapshot && state.snapshot.key === key ? state.snapshot : null` and
`status: 'loading'` when the keys differ. In the loader, when a request arrives for a key
different from `inFlightKey`, bump `seq`, emit `{ snapshot: null, status: 'loading' }`
and start the new load at once (the stale response is then dropped by the seq guard),
which is what spec 3.3 items 5 and 9 say. Add a results_loader test for exactly the
sequence above. As defence in depth, `generateAiInsights` should return early unless
`snapshot.clientId === activeClientId`.

### F2, MAJOR: Mentions feed has no sequence guard; A's feed can stay under B (fails 5.3)

What. `Mentions.tsx:72-90` `loadHistory` awaits `readResultHistory` and calls
`setHistory(res.rows)` with no sequence number and no client check.

Exploit path. Admin opens `/mentions` on client 1 (1,928 mention rows, two sequential
keyset pages) and switches to a small client before it finishes. The small client's
single page lands first, then client 1's read lands and overwrites `history`, so client
1's response snippets and positions are listed under the other client until the next
reload; prompt text resolves to empty because `snapshot.prompts` is the new client's
(`mentionsView.ts:67-71`). The pre-change page had the same race (HEAD `Mentions.tsx`
`load`), but the spec made the guard mandatory and paging widened the window.

Same class, transient only (seq guards exist, final state correct):
`BrandSentiment.tsx:89` keeps `prev.rows` on a non-quiet load and
`Competitors.tsx:216` keeps `trendRows`, so on a client switch the sentiment feed, its
trend and the competitor trend render A's rows under B until B's history lands
(`historyLoading` and `trendLoading` are false because rows are non-empty,
`BrandSentiment.tsx:190`, `Competitors.tsx:350`). `Competitors.tsx:246-258`
`loadManual` has no guard either, and its list carries a delete button by id (`:297`).

Fix (bg-app A for Mentions, B for the others). Add `const mine = ++seq.current` and drop
a stale response, as `Dashboard.tsx:99,117`; on a client change clear rows before the
read (non-quiet branch), keep them only on a quiet reload of the same client.

### F3, MEDIUM: prompts revalidation on consumer mount is not wired (fails 3.3 item 6)

What. `rg "markDirty|promptsOnly" src` finds only `resultsContext.tsx:97`. On mount the
provider calls `loader.load(key, cid)` (`:93`), which returns without any fetch when the
snapshot is younger than 60 s (`resultsLoader.ts:131-134`).

Exploit path. On Overview, go to `/prompts`, deactivate a prompt (no collection runs),
return to AI Visibility within 60 s: the deactivated prompt is still in
`snapshot.activePrompts`, so it still counts in P, the mention rate, the score and the
table. A newly added prompt is missing for the same 60 s.

Fix (bg-app foundation). When `consumers` goes from 0 to 1 and a fresh snapshot exists
for the key, call `load(key, cid, { quiet: true, promptsOnly: true })`, as the spec says.

### F4, MEDIUM: Reload and stale-retry buttons run a non-quiet load (fails 9.2)

What. `reload()` with no options becomes `{ quiet: undefined, force: true }`
(`resultsContext.tsx:101-104`); `run` then emits `snapshot: null`
(`resultsLoader.ts:104-105`). Probe: `reload() without quiet, snapshot states emitted:
NULL,kept`. Callers: `AIVisibility.tsx:497` (Reload button; the spec 10.3 text says
`reload({ quiet: true })`), `AIVisibility.tsx:2402` (stale-data retry),
`Dashboard.tsx:273` (Refresh button), `Mentions.tsx:145` (stale-data retry).

Exploit path. Click Reload on AI Visibility with data on screen: the page early-returns
the skeleton (`AIVisibility.tsx:1062`), tearing down expanded rows and scroll position for
the round trip; if that reload fails, the page goes to the full error card
(`:1053-1059`) and the data the user had is gone, the opposite of the stale-note design
in spec 3.4.

Fix (bg-app A). Pass `{ quiet: true }` at all four call sites. The full-error retries
(`snapshot === null`) can stay non-quiet.

### F5, LOW: Competitors trend counts inactive engines (regression)

What. `Competitors.tsx:349` feeds `trendRows` to `computeTrend` unfiltered; the HEAD
version filtered with `activeEngines.includes(r.llm)` before computing. Spec 1.1 says
history rows are active engines only.

Exploit path. Live, read only: clients 10, 11, 12, 15 and 16 each hold 8 non-error
`meta` rows (engine retired 2026-07-16). With the window on "All", their trend counts
brand and competitor mentions from Meta while the table above it excludes Meta.

Fix (bg-app B). `trendRows.filter(r => activeEngines.includes(r.llm))` before
`computeTrend`, and add `response_snippet` to `TREND_COLUMNS` so no-answer rows can be
dropped as for the other history views.

### F6, LOW: AI Visibility fix side reads are still a second round trip (6.1 deviation)

`AIVisibility.tsx:520-571`: `fix_states` first, then `client_api_keys` and
`oauth_grants` only when a fix was marked by one, filtered by the ids just read. Spec 6.1
asks for one `Promise.all` with both side reads unconditional by `client_id`. Depth stays
within the 6.3 budget of 2, so this is a deviation, not a breach. Owner bg-app A, or
bg-architect accepts it in the spec.

### F7, LOW: AI Visibility CSV deviates from 8.2 in four columns

`aiVisibilityView.ts:129-151`: Brand mentioned prints `Yes`/`No` (spec `yes`/`no`);
Sentiment is printed for absent cells too (spec: mentioned only; absent rows carry the
default neutral, so the export reports a sentiment for an answer that never named the
brand); Competitors named skips `toDisplayName` (`competitorFilter.ts:194`); Last answer
at uses `previousOk` for an error cell and is empty for a no_answer cell, where the spec
wants the usable row's `checked_at` from `results`. Owner bg-app A.

### F8, INFO: residual page-side arithmetic and keys

`AIVisibility.tsx:690-705` recomputes the engine band and best position inline instead of
reading `rates[i].band` and `rates[i].bestPosition` (same thresholds, same result today);
`Competitors.tsx:344-345` recomputes engine coverage instead of `engineCoverage`;
`AIVisibility.tsx:943` keys `resultsKey` on row count, not `snapshot.version` as 10.3
says. None changes a number now; each is a second definition waiting to drift.

## 4. Security

No new finding beyond F1 and F2, which are integrity issues reachable by an admin only
(viewers have one client). Reads stay under RLS: the RPC is SECURITY INVOKER per the spec
and every page read filters `client_id`. The CSV formula guard holds (section 6). No
secret in the diff (no key, token or service-role string added; the dash and secret
patterns were scanned over the same 902 added lines).

## 5. Remaining `ai_results` reads in `src` (grep, comments excluded)

| Site | Paged | Feeds | Class |
|---|---|---|---|
| `lib/resultsContext.tsx:36` RPC | yes, `readAllById` | every snapshot number | OK |
| `lib/historyRead.ts:37` | yes, `readAllById` | trends, feeds, Checks | OK |
| `pages/AIVisibility.tsx:641` cost sum | yes, `readAllById` | budget meter | OK, error rows kept on purpose |
| `pages/Revenue.tsx:923` | no | admin cost sums | PRE-EXISTING, out of scope (spec 12), capped at 1,000 |

No other `from('ai_results')` or `.rpc(` in `src/lib`, `src/components` or `src/pages`.

## 6. CSV probe output (real `csv.ts`)

```
"=SUM(A1)" -> "'=SUM(A1)"     "+1" -> "'+1"     "-1" -> "'-1"     "@x" -> "'@x"
"\tx" -> "'\tx"     "\rx" -> "\"'\rx\""     "a,b" -> "\"a,b\""
"say \"hi\"" -> "\"say \"\"hi\"\"\""     "line\nbreak" -> "\"line\nbreak\""
"=HYPERLINK(...)" -> quoted and guarded     number -1 -> "-1"
BOM first char code feff, ends CRLF true
brandgeo-competitors-client-7-2026-11-08.csv   (slug "---" falls back)
```

## 7. Regression surface (grep)

`useResults` is consumed only by the six pages; `ResultsProvider` mounts once in
`App.tsx`. `metrics.ts` is imported by the six views, the six pages, `historyRead.ts`
and `resultsContext.tsx`; it imports the protected modules read-only. `mcp-server.js`
bundles the protected modules, which are unchanged, so MCP output cannot have moved
(mcp_server 83 passed). Manual look needed: the admin client switcher on all six pages
(F1, F2), and `/prompts` followed by a results page (F3).

## 8. What was not checked

- Anything that needs the RPC applied: spec 2.2 to 2.5 (grants, INVOKER, viewer probe,
  parity against a full export, EXPLAIN under 700 ms). The SQL file is the server lane's
  and was not reviewed here.
- A real browser: request counts and depths (3.3, 6.2), demo mode network silence (3.5),
  bundle budgets (6.3), the time filter behaviour (7.2, 7.3), CSV opened in a spreadsheet
  with accents (8.3), focus and contrast of the new Export buttons and the time filter
  label, light mode.
- The collector gate lane (`collect-claude.js`, `collect-chatgpt.js`, reaper SQL) beyond
  its test file passing; it belongs to the backend lens.
- React timing of the one-render exposure in F1 when nothing is in flight; the in-flight
  case is reproduced, the idle case is shown by reading `resultsContext.tsx:92-106`.

## 9. Routing

F1 and F3 to the foundation builder (bg-app); F2 Mentions, F4, F7, F8 to Builder A;
F2 Sentiment, Competitors, F5 to Builder B; F6 to Builder A or a spec amendment by
bg-architect. Re-verify by rerunning `verify_probe.js` (the switch must show
`snapshot.key = null` right after the switch) and the full test set.
