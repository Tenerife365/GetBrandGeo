FAIL

# Review: "Copy as AI prompt" on the Fix This cards (fix-states.md section 11)

Reviewer: bg-verify (Opus), read-only. Date: 2026-11-06.
Scope: `src/lib/fixPrompt.ts` (new), `tests/fix_prompt.test.js` (new), the
`AIVisibility.tsx` and `aiVisibilityCopy.ts` hunks, spec
`docs/arch/fix-states.md` section 11. All uncommitted on main at `ebb79e3`.
Other dirty files in the tree (`unlock-audit-report.js`, `faq.html`,
`index.html`, `site.js` and others) belong to other sessions and were not
reviewed.

**Counts: 1 BLOCKER, 0 MAJOR, 3 MEDIUM, 5 LOW, 7 INFO.**

The builder is well shaped: pure, bundles under esbuild for node, loads under
`ts_require`, no leaks, no dashes, the card and the done controls are
untouched, and Constantin's example reads well. It fails on one false factual
claim that ships in every Claude fix prompt, and on three fix kinds whose
evidence block can come out empty or contradict the card it was copied from.

## 1. Findings, ranked

### B1 BLOCKER: the prompt tells the customer Claude does not search the web. It does.

- Where: `src/lib/fixPrompt.ts:105` (`ENGINE_HOW.claude`), `fixPrompt.ts:424-426`
  (the extra "Done when" line), the comment at `fixPrompt.ts:94-98`, and spec
  `docs/arch/fix-states.md` lines 222-223 and 253-255.
- Text shipped: "Claude answers these questions from what it learned in
  training, without searching the web, so new pages reach its answers only
  after a later model update." and "Claude's answers change only after a later
  model update, so expect that check to show little movement at first".
- Truth: `netlify/functions/_collect.js:418-424` states web search is ON and
  must stay on; `_collect.js:449-461` sends `anthropic-beta:
  web-search-2025-03-05`; `_collect.js:465` attaches
  `tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }]`.
  `collect-claude.js:19` and `collection-worker-background.js:29` both go
  through `collectEngines` in `_collect.js`, so every Claude row BrandGEO
  stores came from a run that could search the web.
- Reproduction: `node tests/fix_prompt.test.js --print`, section `claude`;
  the test at `tests/fix_prompt.test.js` ("engine fix states how that engine
  answers") asserts the false phrase "without searching the web".
- Why it blocks: it is a false statement about how BrandGEO measures, in
  customer-facing output that MCP stage 2 will repeat byte for byte. It also
  does harm: it tells the customer and the agent to expect no movement and to
  favour outside mentions over the page, when a new indexed page can reach the
  Claude answer BrandGEO collects within one cycle.
- Likely cause: stale comments, both PRE-EXISTING: `collect-claude.js:7`
  ("training-data mode") and `_collect.js:19` and `:23` ("Do NOT re-add web
  search to Claude"), contradicted by the authority note at `_collect.js:418`.
- Fix (bg-app for the builder and test, bg-architect for the spec): replace the
  Claude sentence with something true of the collector, for example "Claude
  runs one web search when BrandGEO asks it these questions and otherwise
  answers from what it learned in training, so a page it can find and mentions
  on widely published, trusted sites both matter." Delete the Claude line in
  "Done when" or reword it without the "only after a model update" claim.
  Update the test assertion and spec section 11 point 5 and the "Built" note.
  Correct the two stale collector comments in a separate bg-backend chip.

### M1 MEDIUM: consistency and overall-visibility prompts can contradict their card and list no questions

- Where: `fixPrompt.ts:219-221` picks only questions with zero mentions for
  every kind except prompt gap, outranked and ranking; `fixPrompt.ts:297-299`
  renders the consistency result line. The card fires on
  `dimensions.consistency < 40` (`AIVisibility.tsx:954`), and consistency is
  the share of questions where at least 60% of engines name the brand
  (`aiVisibilityScore.ts:173-180`), a different quantity.
- Reproduction (scratch script, fictional data): 5 questions, 5 engines, each
  question named by exactly one engine. Score: recognition 20, consistency 0,
  so the card says "Brand appears in only 0% of prompts with consistent
  multi-engine coverage". The copied prompt says "BrandGEO was named in at
  least one answer for 5 of 5 questions", prints no question list, and step 1
  reads "For each question above, check whether a page ... answers it". The
  same data fires `visibility:all` (every engine at 20%, all MISSING), whose
  prompt also has no question list under "For each question above".
- Fix (bg-app): for consistency, list the questions that fail the 60% rule
  (named by fewer than 60% of the engines that answered), with "named by N of
  M engines", and state the result in those terms. For visibility, fall back
  to the questions with the lowest share named when none has zero. In every
  kind, when the list is empty, the steps must not say "above".

### M2 MEDIUM: ranking prompt can say "below the top three on 0 questions"

- Where: `fixPrompt.ts:217-218` keeps a question only when its BEST rank across
  engines is worse than 3; the card fires on `dimensions.knowledge` between 0
  and 50 (`AIVisibility.tsx:965`), which averages every mention's position
  (`aiVisibilityScore.ts:120-128`).
- Reproduction: 5 questions, 5 engines, brand ranked #1 by one engine and #5 by
  the other four on every question. Knowledge 36, card fires ("When mentioned,
  BrandGEO averages a lower position"). Prompt: "BrandGEO was named in 25 of 25
  answers, but below the top three on 0 questions", no list, step 1 "For each
  question above".
- Fix (bg-app): select by the share of answers per question ranked below the
  top three (or the average rank), and print "ranked below the top three in K
  of N answers, average rank #X" per question.

### M3 MEDIUM: outranked prompt can say the rival took 0 questions

- Where: `fixPrompt.ts:216` keeps only questions where the brand is absent and
  the rival is named; the card's rival is the most frequent ranked competitor
  over all rows and fires on any absent answer anywhere (`AIVisibility.tsx:940-941`).
  The case the title names, rival ranked above the brand in the same answer,
  is never listed.
- Reproduction: rival #1 and brand #3 in 24 of 25 answers, one unrelated answer
  without the brand. Prompt: "Peak Monitor was named in answers that left
  BrandGEO out on 0 questions", no list, and both the "Why" ("on the questions
  listed above") and steps 1 and 2 ("for the questions above") point at nothing.
- Fix (bg-app): also list questions where both are named and the rival ranks
  above the brand ("Peak Monitor #1, BrandGEO #3"); when the list is still
  empty, drop the "above" references.

### L1 LOW: a prompt gap with no answers renders an empty question

- Where: `fixPrompt.ts:205` drops unanswered questions, then `:279` and `:367`
  read `ev.questions[0]`. Repro: `prompt_gap:<id>` for an active prompt with no
  rows gives `Buyer question: ""`, "named in 0 of 0 answers" and step 1 with
  `answers "" directly`. Unreachable from the page (the card needs answers),
  reachable from an MCP caller. Fix: take the text from `promptList[0]`, and
  return null when there are no answers.

### L2 LOW: "Done when" compares with "today's" number; the baseline is taken when the fix is marked done

- Where: `fixPrompt.ts:420-423`. The baseline is written at mark time
  (`AIVisibility.tsx:1062`), and weekly collections can run between copying
  and marking. The verdict also waits for 80% of the cells in scope to be
  fresh (`fixStates.ts:42`, `:255-259`), not simply "the first collection",
  and is measured over every question in scope, while the prompt's list shows
  only the missing ones ("the same questions"). Fix: "compares it with the
  number at the moment you mark it done (today: 0 of 7)", and "once most of
  these answers have been re-checked at least 7 days later".

### L3 LOW: the rules close fabrication about the brand, not about outlets or the rival

- Where: `fixPrompt.ts:361-363` asks the reader to name publications and
  directories; `fixPrompt.ts:374` asks it to list the facts the rival states
  publicly. A chat assistant without browsing will produce plausible outlets
  and rival claims from memory. Fix: add a rule, "If you cannot open web
  pages, say so; name only outlets you can link to, and do not describe the
  competitor or any site from memory as if you had checked it."

### L4 LOW: the accessible name hides the "Copied" feedback

- Where: `AIVisibility.tsx:2429` sets a fixed `aria-label`, so for two seconds
  the visible text "Copied" is not in the accessible name (WCAG 2.5.3) and a
  screen reader user gets no confirmation. Fix: announce through the existing
  polite region at `AIVisibility.tsx:2346` (`setFixAnnounce('Prompt copied')`)
  or make the label follow the state.

### L5 LOW: engine-low prompts say "rarely" for an engine at up to 49%

- Where: `fixPrompt.ts:337`, applied to PARTIAL engines (25 to 49%,
  `AIVisibility.tsx:780`). "Rarely makes that connection" overstates at 45%.
  The pinned fixture shows 2 of 3 (67%) with "rarely", a state the page never
  produces. Fix: "does not make that connection in most answers" for
  `engine_low`, keep "rarely" for `engine_missing`, and a realistic fixture.

### INFO

- I1: `ENGINE_HOW.chatgpt` says ChatGPT "searches the web when it answers";
  the tool is attached without `tool_choice` (`_collect.js:370`), so it can
  search and usually does. "can search the web" is exact.
- I2: Gemini falls back to an ungrounded call (`_collect.js:126`, `:148`), so
  "grounds its answers in Google Search" is true of most rows, not all.
- I3: brands named instead exclude only the exact brand key; an alias such as
  "Brandgeo.com" in a competitor list would be printed as a rival (repro R6).
  Unlikely, since the alias would normally have counted as a mention.
- I4: the "Market" line is the client's default market
  (`AIVisibility.tsx:1018`); a manual run under another selected market is not
  reflected, and rows carry no market.
- I5: byte identity with MCP stage 2 holds only if `mcp-server.js` rebuilds the
  same cell map (active engines, `isNoAnswerRow` dropped, error rows skipped,
  newest ok row per cell) and passes the same `competitorAvgRank` (the card
  averages over every stored row, including inactive prompts).
- I6: the "Why" sentences for outranked and ranking state the engines'
  ranking mechanism as fact; they are reasonable GEO practice, not measured.
- I7: PRE-EXISTING: `copyFix` (`AIVisibility.tsx:1310-1315`) ignores a
  rejected clipboard write, so a failed copy shows nothing.

## 2. Acceptance criteria

| # | Criterion (from the brief and spec section 11) | Result | Evidence |
|---|---|---|---|
| 1 | One pure builder, no React or Supabase, MCP-bundleable | PASS | Only import is `./competitorFilter` (`fixPrompt.ts:20`), which imports nothing. `npx esbuild src/lib/fixPrompt.ts --bundle --platform=node --format=cjs` exit 0; the bundle loaded in node and returned a 2,975 character prompt. Loads under `tests/helpers/ts_require.js` (the test suite uses it). |
| 2 | Stands alone when pasted, explains why | FAIL for consistency, ranking, outranked and visibility edge cases | M1, M2, M3: empty evidence lists under "for each question above". Prompt gap, engine and the common cases pass (`--print` output read in full). |
| 3 | Every factual claim true of the data or of collection | FAIL | B1 (Claude). I1, I2 minor. Never claims BrandGEO read the site: checked, the steps say "check whether ... already has a page". |
| 4 | Evidence matches the card for the same data | PASS for prompt gap, engine missing, engine low, visibility counts; FAIL for consistency | Card `fixPromptGapLine` and the builder agree on 0 of 7 and 7 named instead (pinned test). Engine counts use the same active prompt by engine cells as `llmStats` (`AIVisibility.tsx:711-715`, `fixPrompt.ts:180-183`). Consistency: M1. |
| 5 | Brand never listed as named instead | PASS (exact name) | Test "the brand is never listed..." passes; alias case I3. |
| 6 | No euro, plan names, internal ids | PASS | Test "no internal ids, plan names or euro amounts" passes; `buildFixPrompt` never reads plan, cost or ids into text (`fixPrompt.ts:252-436`). |
| 7 | No em or en dash, even from client text; newlines folded | PASS | Scratch repro R7: dashes and newlines injected into brand, site, market, competitor, title and question; output has no dash and 47 lines (the template's own count). `rg -c "[EM EN]"` over added lines plus both new files: 0; positive control file: 1. |
| 8 | tsc exit 0 | PASS | `npx tsc --noEmit -p .` printed nothing, `TSC EXIT 0`. |
| 9 | Tests pass | PASS | `fix_prompt` 14 passed 0 failed; `fix_states` 28 passed 0 failed; `prompt_performance` 50 passed 0 failed. |
| 10 | Card short fix line unchanged | PASS | `{item.fix}` still rendered at `AIVisibility.tsx:2419`; diff touches only the copy button. |
| 11 | Mark as done, Not for us, Done list untouched | PASS | `git diff` of `AIVisibility.tsx` has 4 hunks: imports, `FixItem` fields, two fields on the outranked item, `fixPromptFor`, the copy button. No other control changed. |
| 12 | Button accessible name | PASS with L4 | `aria-label="Copy as AI prompt: <title>"` contains the visible label (2.5.3 passes in the idle state). |

## 3. Security

No finding. The builder only formats data already on the page for the signed-in
client; the clipboard text is produced on click (`AIVisibility.tsx:2428`) from
`results` loaded under RLS for `activeClientId`. No new endpoint, write, or
query. Secret scan over the diff and both new files: 0 matches.

## 4. Accessibility

- Contrast: no new text on surface pair; the button keeps its existing classes
  (`text-slate-400` on the card surface, ring `brand-400`, both measured in
  earlier reviews). Not re-measured.
- Keyboard: native `button`, reachable and operable; unchanged.
- Focus visibility: unchanged `focus-visible:ring-2 ring-brand-400`.
- Name: L4.
- Hit target: unchanged padding (`px-2.5 py-1.5 text-xs`), same as before.
- Heading order: no headings added.

## 5. Regression surface (grep)

- `fixPrompt.ts` is imported only by `src/pages/AIVisibility.tsx` and
  `tests/fix_prompt.test.js`.
- `FIX_COPY` is used only in `AIVisibility.tsx` (defined in `aiVisibilityCopy.ts`).
- `competitorFilter.ts` (dependency) is shared with `fixStates.ts`,
  `promptPerformance.ts`, `Competitors.tsx`, `Recommendations.tsx` and
  `netlify/functions/mcp-server.js`; not changed by this diff.
- Manual look owed: the Fix This card at phone width, since "Copy as AI
  prompt" is longer than "Copy fix" and the button is `whitespace-nowrap`
  inside the card's action column.

## 6. Data and claim integrity

- Counts traced: answers, named, named another brand, newest check, per
  question counts, all from the page's own `results` map over active prompts
  and active engines (`fixPrompt.ts:179-205`), the same population as
  `computeAiVisibilityScore` and `llmStats`.
- Outranked average rank: the card's own `topRanked.avgPos`
  (`AIVisibility.tsx:946`), so prompt and title agree.
- Engine sentences traced against `_collect.js`: ChatGPT web search tool
  (`:370`), Gemini Google Search grounding (`:148`), Perplexity via
  `perplexity/sonar` (`:875`), Google AI Mode via SerpApi `google_ai_mode`
  (`:588`), Claude web search ON (`:465`), which contradicts the text (B1).
- "Done when" traced against `fixStates.ts`: wait 7 days (`:38`), 80% fresh
  cells (`:42`), +10 points or any mention from none (`:230-233`), metric per
  kind (`metricKeys`, `:74-81`): names the right number per kind; timing and
  baseline wording L2.

## 7. Not checked

- Real browser: the button, the "Copied" state, the clipboard contents and the
  card layout at 375 px and 1280 px, light mode. No dev server by instruction.
- `npm run build` (by instruction); tsc is the type gate used.
- The text pasted into ChatGPT, Claude, Cursor or a coding agent and the
  answers they give.
- Whether the fixture names "Peak Monitor", "Signal Desk", "Lumen Watch" and
  "Orbit Scan" are trading names somewhere; no web search was run.
- Live data for any real client; all reproductions used fictional fixtures.
- `mcp-server.js` stage 2, which does not exist yet (I5 is a precondition).
- Screen reader behaviour (L4 is from the markup, not a session with a reader).
- The spec's other sections beyond what section 11 depends on.

## 8. Routing

- B1, M1, M2, M3, L1, L2, L3, L5: bg-app (builder and test, Opus not needed;
  Sonnet suffices). Spec section 11 wording for B1 and L2: bg-architect.
- L4: bg-app (page).
- Stale Claude comments in `collect-claude.js:7` and `_collect.js:19-23`:
  bg-backend, separate, comment-only.
- Re-review after the fix: re-run the scratch fixtures R1 to R5 below.

Reproduction script used (fictional data, run from `brandgeo-dashboard/`):
`C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\bc1b70f5-4f3c-4e0b-999a-86a0b20e6e0d\scratchpad\repro.js`
(R1 consistency and visibility, R2 ranking, R3 outranked, R4 prompt gap with no
answers, R5 Claude text, R6 alias, R7 dash and newline injection).


## Re-check 2026-11-06

**Verdict: FAIL.** B1 is closed and so are most findings, but two of the three
MEDIUM findings are only partly closed: on data the page can produce, the
consistency and outranked prompts still print an empty question list, steps
that say "for each question above", and in the outranked case a sentence that
the data does not support. Acceptance rows 2, 3 and 4 still fail on those
inputs. Both residuals are small guard clauses; no BLOCKER and no security
finding remains.

Scope of this re-check: the builder's closure claims in
`docs/arch/fix-states.md` section 12, checked by reproduction against the
working tree (uncommitted, on main at `ebb79e3`). Files read:
`src/lib/fixPrompt.ts`, `tests/fix_prompt.test.js`, the `AIVisibility.tsx`
and `aiVisibilityCopy.ts` hunks, spec sections 1, 8, 11 and 12, and as
references `src/lib/fixStates.ts`, `src/lib/aiVisibilityScore.ts` and
`netlify/functions/_collect.js`. No source file was edited, no git write, no
build, no dev server.

### R.1 Commands run

| Command (from `brandgeo-dashboard/`) | Result |
|---|---|
| `npx tsc --noEmit -p .` | no output, `TSC EXIT 0` |
| `node tests/fix_prompt.test.js` | `20 passed, 0 failed`, node exit 0 (was 14) |
| `node tests/fix_states.test.js` | `28 passed, 0 failed` |
| `node tests/prompt_performance.test.js` | `50 passed, 0 failed` |
| `node <scratchpad>/repro.js` (the first review's R1 to R7, unchanged) | R1 to R3 now list five questions each; R5 has no "training only" claim; R7 no dash, 48 lines |
| `node <scratchpad>/repro2.js cons, rank, out` | full evidence blocks for the M1 to M3 fixtures, read in full |
| `node <scratchpad>/repro3.js` | X1 to X3 below, the residuals |
| Secret pattern scan over the diff plus both new files | count 0 |
| Dash scan with a positive control | section R.6 |

Scratchpad: `C:/Users/const/AppData/Local/Temp/claude/12b463c33e04e536/bc1b70f5-4f3c-4e0b-999a-86a0b20e6e0d/scratchpad/`
(`repro.js`, `repro2.js`, `repro3.js`). All fixtures fictional.

### R.2 Per finding

| Finding | State | Evidence |
|---|---|---|
| B1 Claude described as answering without web search | CLOSED | `fixPrompt.ts` `ENGINE_HOW.claude` now reads "Claude can run a web search when it answers these questions and otherwise relies on what it learned in training". True of `_collect.js:465` (`web_search_20250305`, `max_uses: 1`) and `:422` ("ON and must stay on"). The "only after a later model update" line is gone from "Done when". R5 rerun prints the new sentence and no "model update". Test "review B1" asserts the phrase and asserts `!/without searching|model update/`. Spec section 1 no longer calls Claude a training-data engine; section 8 point 1 and section 11 point 5 corrected. |
| M1 consistency and visibility list no questions | PARTLY CLOSED, residual OPEN (MEDIUM, see X1) | R1 now lists five questions "(named in 1 of 5 answers)" under "fewer than 60 percent of the engines that answered", and the result line states the 60 percent rule. Visibility R1b lists the least-named questions. Residual: the builder counts only answered questions, while the card's `dimensions.consistency` divides by every active prompt (`aiVisibilityScore.ts:174-179`). X1 fires the card and prints an empty list. |
| M2 ranking can say "below the top three on 0 questions" | CLOSED | R2 now: "On 5 questions, its average rank where engines ranked it was below the top three", each "(average rank #4.2)". The list cannot be empty when the card fires: the card needs `knowledge < 50`; the per-row score `max(20, 120 - 20 * pos)` is convex, so a question with mean rank 3 or better scores at least 60 on average (Jensen), and if every question did, knowledge would be at least 60. Both sides skip a null or zero position the same way. |
| M3 outranked can say the rival took 0 questions | PARTLY CLOSED, residual OPEN (MEDIUM, see X2) | R3 now lists five questions (rival ranked above the brand in the same answer counts, `took()` in `buildFixEvidence`). Residual: the requested fallback "when the list is still empty, drop the 'above' references" was not built, and X2 shows the page can still produce an empty list. |
| L1 prompt gap with no answers prints an empty question | CLOSED (residual N3, INFO) | X3: `Buyer question: "Fictional question number 1?"`. The text now comes from the prompt list, so step 1 quotes it. The builder still renders "named in 0 of 0 answers" instead of returning null; reachable only from an MCP caller, not false. |
| L2 "Done when" baseline and wait wording | CLOSED in the builder; spec residual N4 (LOW) | Builder now says "Starting 7 days later, once at least 80 percent of the answers for ... have been collected again, BrandGEO measures ... and compares it with the number at the moment you marked the fix done." Traced: `VERDICT_WAIT_DAYS = 7`, `READY_SHARE = 0.8` (`fixStates.ts:38`, `:42`); baseline written at mark time from `measureFix` without a cutoff (`AIVisibility.tsx:1054`, `:1062`); the verdict measures fresh cells after the cutoff (`evaluateFix`); coverage for competitor and dimension fixes is every tracked question on every active engine, which the text states as "every tracked question on <engines>". Spec section 11 point 8 still says "the first collection at least 7 days after". |
| L3 rules close fabrication about the brand only | CLOSED | Rules now end with "Name only publications, directories and sources you can link to. If you cannot browse the web, say so and tell me what to look up instead of naming outlets or describing other brands from memory." Test "review L3". |
| L4 accessible name hides "Copied" | CLOSED (residual N1, LOW) | `copyFix` sets `setFixAnnounce(FIX_COPY.copiedAnnounce)` into the always mounted polite region (`AIVisibility.tsx`, `role="status" aria-live="polite"`), one of the two fixes the review offered. |
| L5 "rarely" for an engine at up to 49 percent | CLOSED | `engine_missing`: "rarely or never makes that connection"; `engine_low`: "makes that connection for <brand> on only some questions today". Test "missing vs low wording (review L5)". |
| I1 ChatGPT "searches" | CLOSED | "ChatGPT can search the web"; `_collect.js:370` attaches the tool without forcing it. |
| I2 Gemini always grounded | CLOSED | "Gemini usually grounds"; ungrounded fallback at `_collect.js:126`, `:148`. |
| I3 alias listed as a rival | ACCEPTED | R6 still prints "Brandgeo.com and Peak Monitor". Accepted in section 12 with a reason; an alias normally counts as a mention, so the row would not be in the absent set. |
| I4 Market is the default market | ACCEPTED | Unchanged (`MARKETS.find(... default_market_id)`). Rows carry no market, so nothing better exists. |
| I5 MCP byte identity precondition | ACCEPTED | Carried to MCP stage 2 section 2; no MCP code in this diff. |
| I6 mechanism stated as fact | CLOSED | Outranked and ranking "Why" now say "Engines tend to". |
| I7 refused clipboard write did nothing | CLOSED (residuals N2 LOW, N5 INFO) | `.catch` sets `fixNotice` to `copyFailed` and announces it. |
| Stale Claude comments, `collect-claude.js:7`, `_collect.js:19` (PRE-EXISTING) | OPEN, bg-backend chip | `_collect.js:19` still reads "training-data mode". Comment only, out of this diff, does not block. |

### R.3 Residuals reproduced (fictional data, `repro3.js`)

**X1, M1 residual, MEDIUM.** Five active questions, five engines. Question 1
answered by all five engines, all name the brand; questions 2 to 5 have no
answers yet (added since the last collection, or every engine errored).
Score: recognition 100, consistency 20, so the card fires ("Brand appears in
only 20% of prompts with consistent multi-engine coverage"). Copied prompt:

- "Result: on 1 of 1 question, at least 60 percent of the engines that
  answered named BrandGEO. Overall BrandGEO was named in 5 of 5 answers."
- no question list;
- "1. For each question above, check whether a page on ... answers it directly."

The card says 20 percent, the prompt reads as a full success, and the steps
point at nothing. In the broader case (some answered questions inconsistent)
the list is not empty, but the prompt's "on N of M questions" still uses a
different denominator from the card and from the score "Done when" re-checks,
which counts an unanswered question as not consistent.
Fix (bg-app): count every active question as the score does
(`questionsAnswered` becomes the number of active questions), list unanswered
questions too, noted "(no answers yet)", and when the list is empty, word the
steps and "Why" without "above".

**X2, M3 residual, MEDIUM.** Brand ranked #1 and the rival ranked #2 in 24 of
25 answers; one answer leaves the brand out and names only a third brand. The
page fires "Outranked by Peak Monitor (avg #2)" (`topRanked` exists and
`gapCount` is 1, `AIVisibility.tsx:940-941`). Copied prompt:

- "On 0 questions, at least one answer named Peak Monitor and left BrandGEO
  out, or ranked Peak Monitor above BrandGEO."
- no question list;
- "Why": "On the questions listed above, the engines found more of that for
  Peak Monitor than for BrandGEO." That sentence is not supported by the data:
  the rival never ranked above the brand;
- steps 1 and 2 "for the questions above".

Fix (bg-app): when `questionsTotal` is 0, drop the "On 0 questions" clause and
the "Why" comparison and word steps 1 and 2 without "above", or return null so
the button falls back to the short fix line. Better at the source, and
PRE-EXISTING: the card itself claims "Outranked" here although the rival never
ranked above the brand; gating the card on the builder's own `took()` test
(at least one answer where the rival is named and the brand is absent, or the
rival ranks above the brand) makes the empty case unreachable from the page.
The card gate is pre-existing and does not block this change on its own.

### R.4 New findings from this re-check

- **N1 LOW, repeat copies are not announced.** `copyFix` sets the same
  string, `FIX_COPY.copiedAnnounce`, every time. React skips a state update
  whose value is unchanged, so copying a second fix after the first changes
  nothing in the live region and a screen reader hears nothing for the second
  copy (the same applies to a second refusal). From the code, not a reader
  session. Fix: clear first (`setFixAnnounce('')`, then set the text in a
  `setTimeout`), or include the fix title in the announcement.
- **N2 LOW, a refusal notice outlives a later success.** The success branch of
  `copyFix` never calls `setFixNotice(null)`, so after one refused write and a
  successful retry the card shows "Copied" and, below it, "Your browser did not
  allow copying". Fix: `setFixNotice(null)` in the success branch.
- **N3 INFO.** X3: a prompt gap with no answers renders "named in 0 of 0
  answers", "on the AI engines checked", and the same in "Done when".
  MCP-only path; return null or say "not answered yet" before MCP stage 2.
- **N4 LOW, spec only.** `docs/arch/fix-states.md` section 11 point 8 still
  says the re-check runs "on the first collection at least 7 days after the
  fix is marked done"; the builder and `evaluateFix` use the 80 percent fresh
  rule. Section 8 point 1 carries the same older wording (pre-existing). Route
  bg-architect.
- **N5 INFO.** `copyFailed` tells the reader to "Select the fix text and copy
  it by hand", but the visible fix text is the short line, not the prompt, so a
  person whose browser refuses the clipboard cannot get the full prompt at
  all. A product decision whether that matters.
- **N6 INFO.** For count kinds, "Done when" says BrandGEO measures "how many
  of the new answers name" the brand; `measureFix` compares a share (percent),
  not a count, so with a different number of answers the two readings differ.
  "what share of the new answers name" is exact.

### R.5 No new false claim: checks run

- `ENGINE_HOW` against `_collect.js`: ChatGPT "can search the web" (tool
  attached without `tool_choice`, `:370`); Gemini "usually grounds" in Google
  Search (`:148`, ungrounded fallback `:126`); Google AI Mode "builds its
  answer from Google Search results" (SerpApi `engine=google_ai_mode`, `:588`,
  `:901`); Perplexity "searches the web ... and cites its sources"
  (`perplexity/sonar` via OpenRouter, `:875`, `:898`); Claude "can run a web
  search ... and otherwise relies on ... training" (`:465`, `max_uses: 1`).
  All five true of the collector. Engines not in the table get no sentence.
- "Done when" against `fixStates.ts`: 7 days, 80 percent fresh, baseline at
  mark time, scope per kind, metric per kind (`metricKeys`, `measureFix`):
  matches, with N6 as a wording nuance and N4 in the spec.
- Consistency rule against `aiVisibilityScore.ts:173-180`: the 60 percent per
  question rule matches; the denominator does not (X1).
- Outranked "Why" against the data: true whenever the list is non-empty;
  unsupported when it is empty (X2).
- No euro, plan name or internal id: test passes; R7 injection still clean.
- Fixtures: brand "BrandGEO", rivals "Peak Monitor", "Signal Desk", "Lumen
  Watch", "Orbit Scan", "Other Co"; no real person or client brand.

### R.6 Dash scan with positive control

The scan builds both characters with `String.fromCharCode(0x2013, 0x2014)`,
proves itself on a control string that contains one of each, then scans the
two new files, the two page hunks and this report. Result recorded in the
command output of this re-check: control 2, every scanned file 0.

### R.7 Not checked

- A real browser: the button, the live region, the notice, 375 px and 1280
  px, light mode. No dev server by instruction.
- A screen reader session (N1 is from React semantics and the markup).
- `npm run build` (by instruction).
- Pasting the prompts into ChatGPT, Claude or a coding agent.
- MCP stage 2, which does not exist yet.
- Live client data.

### R.8 Routing

- X1 (M1 residual), X2 (M3 residual), N1, N2: bg-app, Sonnet is enough.
- X2 card gate (PRE-EXISTING): bg-app, same pass, optional.
- N4: bg-architect (spec section 11 point 8 and section 8 point 1).
- Stale Claude comments: bg-backend, comment-only chip, still owed.
- Re-review: rerun `repro3.js` X1 and X2; both must show a non-empty list or
  no "above" anywhere in the prompt.
