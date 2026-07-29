# AI Visibility metrics correctness audit, 2026-07-29

**Verdict: BLOCK.** Four confirmed defects change a customer-visible number for
reasons that have nothing to do with the customer's brand. Two of them were
introduced today by the move to seven engines, one is a cost model that is
between 120% and 194% of its own hard budget cap, and one is a divergence
between the prospect-facing score and the paid dashboard score that runs in the
commercially wrong direction.

Scope: the AI Visibility tab (`src/pages/AIVisibility.tsx`) and everything that
feeds its numbers. Review only. No file outside this one was modified. No git
command was run. Supabase was read only.

Method note: production has very little data. Nine of 36 clients have any `ok`
row at all, three have a single brand mention between them, and `grok` and
`ai_overview` have six rows each, all belonging to client 1. Every finding below
is labelled either MEASURED (computed against production rows or by executing
the code) or REASONED FROM CODE. Nothing is presented as measured that was not.

---

## 1. Summary table

| # | Severity | Verdict | Finding | New today |
|---|---|---|---|---|
| F1 | HIGH | CONFIRMED | `reach` divides by engines requested, not engines heard from. Costs 4 points vs the audit engine on identical input | Yes, in effect |
| F2 | HIGH | CONFIRMED | `consistency` 60% threshold is a cliff that engine count alone moves. Measured 100 to 83 on a real client | Yes |
| F3 | HIGH | CONFIRMED | "Google rendered no AI Overview" is arithmetically identical to "your brand is invisible" in every aggregate | Yes |
| F4 | HIGH | CONFIRMED | Grok costs 14x its budgeted estimate. Weekly collection at the sold prompt allowance is 120% to 194% of the hard budget cap | Yes |
| F5 | MEDIUM | CONFIRMED | An engine with zero rows renders as a red `MISSING 0%`. Affects roughly 23 clients right now | Yes |
| F6 | MEDIUM | CONFIRMED | Competitor sort sentinel `pos: 99` is rendered to the customer as the rank "#99" and averaged into `avgPos` | Pre-existing, newly load-bearing |
| F7 | MEDIUM | CONFIRMED | `accuracy` counts a mention with no position as a top-3 placement. The two new engines structurally produce position-less mentions | Yes, in effect |
| F8 | MEDIUM | CONFIRMED | Grok timed out on 4 of its first 6 production calls | Yes |
| F9 | LOW | CONFIRMED | A monthly-capped engine's reading can be 30 days old under a "last checked today" header | Yes |
| F10 | LOW | CONFIRMED | `totalChecked` counts inactive and deleted prompts; the "P prompts x E engines" footer is arithmetically wrong | Pre-existing |
| F11 | LOW | CONFIRMED | `ENGINE_COST_EUR` comment contradicts itself and production on the SerpApi per-credit price | Yes |
| F12 | LOW | CONFIRMED | `serpApiCreditsPerMonth()` default cadence contradicts the monthly cap it exists to model | Yes |

Six claims I expected to confirm and could not are in section 4. Two of them are
the ones the brief flagged as most likely, so read that section before acting.

---

## 2. Findings

### F1. `reach` divides by engines requested, not engines heard from. HIGH, CONFIRMED

**Where.** `src/lib/aiVisibilityScore.ts:128-131`.

```
const enginesWithMention = activeLLMIds.filter(llmId =>
  promptIds.some(pid => results.get(pid)?.get(llmId)?.brand_mentioned)
).length
const reach = activeLLMIds.length > 0 ? Math.round((enginesWithMention / activeLLMIds.length) * 100) : 0
```

The denominator is the plan's engine count. An engine that has never returned a
row, or whose rows are all errors, still sits in it.

**Why this is not a style question.** `netlify/functions/_score.js:70-74` fixed
exactly this defect and the TypeScript copy never received the fix. The comment
there states the reasoning better than I can:

> the denominator is the engines we ACTUALLY HEARD FROM, not the engines we
> asked. Previously an engine that failed (quota, timeout, API error) still
> counted in the denominator, so our own outage silently deflated a prospect's
> score, telling them they have a visibility problem when what they really had
> was our billing problem.

That protection was given to prospects and withheld from paying customers.

**Evidence, MEASURED by execution.** Both implementations, identical input, two
prompts, five collected engines, `grok` and `ai_overview` requested but never
collected:

```
aiVisibilityScore.ts (dashboard) : {"recognition":70,"knowledge":69,"sentiment":86,"accuracy":71,"reach":71,"consistency":100} score 76
_score.js (instant audit)        : {"recognition":70,"knowledge":69,"sentiment":86,"accuracy":71,"reach":100,"consistency":100} score 80
AGREE? NO, differ by 4 points
```

`_score.js:10` claims the two are "deliberately byte-for-byte the same
formula/weights ... so an Instant Audit's score means the same thing as a real
client's AI Visibility Score". That claim is false, and the direction is the
commercially damaging one: a prospect is shown 80 on the free audit, pays, and
sees 76 for the same brand on the same data. There is a second divergence in the
same pair, noted at the end of this finding.

**Production exposure, MEASURED.** Only three clients have any mention at all,
and none currently shows the dilution, because for each of them every active
engine has produced at least one mention. So the defect is real in code and not
yet visible in the product. It becomes visible on the next scheduled run: `grok`
timed out on 4 of 6 calls today (F8), and if all of a prompt set's grok calls
error, grok leaves the map entirely and client 1's reach drops from 100 to 86
with no change in the brand's actual visibility.

**Fix.** Port `_score.js`'s `enginesWithResults()` into `aiVisibilityScore.ts`
and use it as the reach denominator. Two engines that were never successfully
asked belong in neither the numerator nor the denominator. Then delete
`_score.js` and have the audit path import the single implementation, or the
pair will diverge again; a hand-synced copy has now failed once.

**Second divergence in the same pair, CONFIRMED by reading.**
`aiVisibilityScore.ts:97-125` computes knowledge, sentiment and accuracy over
`scoped`, the `promptIds x activeLLMIds` population. `_score.js:33-59` iterates
the entire result map with `resultsByPromptEngine.forEach`. That is the exact
"hole 3" the TypeScript header comment (lines 26-32) documents as fixed. It does
not show in the differential above because the audit builds its map from only
the engines it ran, so the two populations coincide there. It is a latent trap,
not a live defect, but it means the files are not the same algorithm.

---

### F2. `consistency` is a cliff, and engine count alone moves a brand across it. HIGH, CONFIRMED

**Where.** `src/lib/aiVisibilityScore.ts:133-139`. A prompt counts as consistent
when at least 60% of the engines that returned a row for it mention the brand.

The denominator is per prompt and only counts engines with rows, so this
dimension is correctly immune to F1's problem. The defect is different: 60% of 5
is 3 engines, and 60% of 7 is 4.2, which rounds up to 5. A brand mentioned by
exactly 4 engines passes at 5 engines (0.80) and fails at 7 (0.571). The
dimension is binary per prompt, so the transition is a cliff, not a slope.

**Evidence, MEASURED against production.** Client 1, Bucate pe Roate, six active
prompts, real newest-per-pair `ok` rows pulled from `ai_results` today, scored
first over the five engines it had yesterday and then over the seven it has now:

```
dimension      5-engine  7-engine  delta
recognition        90        79     -11
knowledge          97        98        1
sentiment          85        85        0
accuracy          100       100        0
reach             100       100        0
consistency       100        83      -17
AI SCORE           95        90       -5
```

Nothing about the brand changed between those two columns. Two engines were
added.

**Refutation attempted.** I checked whether the drop is simply "two more engines
found fewer mentions", which would be a legitimate measurement rather than a
calibration failure. It is partly that, and F3 quantifies the illegitimate part.
But the consistency component specifically is not a measurement effect: the
prompt that flipped did so because the pass mark moved from 3 engines to 5, not
because a mention was lost.

**Fix.** This is a product decision, not a bug with an obvious patch. Either
express consistency as a continuous mean of per-prompt mention rates so it
degrades smoothly instead of flipping, or hold the threshold at a fixed engine
count rather than a fraction of a plan-dependent set. A threshold that a pricing
change can move is not a measurement of the brand.

---

### F3. A legitimate "no AI Overview was shown" is arithmetically a miss. HIGH, CONFIRMED

**Where.** `netlify/functions/_collect.js:588-589` writes the sentinel; the
aggregates in `aiVisibilityScore.ts` and `AIVisibility.tsx` never read it.

The decision to record "Google rendered no AI Overview" as a normal `ok` row with
`brand_mentioned = false` is well argued in `_collect.js:570-587`, and I agree
with two of its three reasons. The row must not be an error, and it must not be
filtered out. But the third step was never taken: nothing downstream
distinguishes the sentinel from a real miss, so it is counted as one.

**Evidence that the row is well-formed, MEASURED by execution.**

```
analyseResponse(AI_OVERVIEW_NOT_SHOWN, cfg)
{ brand_mentioned: false, brand_position: null, sentiment: "neutral",
  response_snippet: "[no_ai_overview] No AI Overview block was rendered ...",
  competitors_mentioned: null }
```

Exactly as the comment promises. No false mention, no phantom competitor.

**Evidence of the distortion, MEASURED against production.** Client 1 has six
`ai_overview` rows, four of which are sentinels (`prompt_id` 240, 243, 244 and
one more), confirmed by `response_text LIKE '[no_ai_overview]%'`. Re-scoring the
same client with only those four rows removed:

```
7-engine, as shipped                    : recognition 79, consistency  83, score 90
7-engine, sentinel rows excluded        : recognition 88, consistency 100, score 94
```

Four of the five points client 1 lost today are attributable to rows that say
Google displayed no AI Overview at all. On the tab, that is currently presented
as a brand problem.

**The customer-visible consequence.** For a client whose queries mostly do not
trigger an overview, `AIVisibility.tsx:465-472` will emit a P0 fix item reading
"Not found in Google AI Overviews. <brand> appears in 0 of N Google AI Overviews
responses. You have no presence here", with remediation advice about schema.org
markup and directory submissions. None of that advice can change the outcome,
because Google rendered no overview for the query. The product is charging a
customer for work that cannot move the number it is complaining about.

**Partial mitigation, verified.** The sentinel string is the row's
`response_snippet`, so a customer who expands the prompt row does see the literal
text. The truth is one click away. It is in no aggregate, no engine card, no
score and no fix item.

**Fix.** Distinguish three states, not two. "Overview shown, brand absent" is a
miss. "No overview shown" is not a measurement of the brand and should be
excluded from recognition, from the consistency denominator, and from the
reach numerator and denominator, exactly as F1 excludes an engine never heard
from. Surface it on the engine card as its own count ("no overview rendered for
N of M queries"), which is a genuinely useful finding in its own right: it tells
the customer which queries Google does not summarise, and that is actionable in
a way the current red card is not. `error_code` is free on an `ok` row, or add a
dedicated column; do not pattern-match the sentinel string in the frontend.

---

### F4. Grok costs 14x its budgeted estimate, and the seven-engine plan does not fit its own budget cap. HIGH, CONFIRMED

**Where.** `src/lib/planConfig.ts:332-378` (the `PLAN_PROMPTS` derivation table),
`netlify/functions/_cost.js:226` (the grok fallback), `_auth.js:225-247` (the
gate that enforces the cap).

**Evidence, MEASURED from production rows.** The two successful grok rows carry
`cost_eur` of 0.17407 and 0.15645, metered from OpenRouter's own reported cost
via `estimateCostEur`'s provider-cost-wins branch (`_cost.js:262-264`). The
budgeted fallback is `grok: 0.012`, derived in the comment at `_cost.js:220-225`
from "~EUR 0.0045 tokens plus two web results at $0.004 each". The real figure is
about 14x that. The metered value is the trustworthy one: it is what OpenRouter
says it charged, including the web plugin fee.

**Evidence that the plan model is stale, CONFIRMED by reading.** The derivation
table at `planConfig.ts:366-372` models Growth PRO and Managed as **six** engine
plans. Both have seven. `ai_overview` at EUR 0.069 is absent from the table
entirely, and grok is in it at 0.012.

**Recomputation from the repository's own constants:**

```
growth_pro  75 prompts   cap EUR 67.35
  fallback grok 0.012    EUR/prompt 0.249  EUR/run  18.68  EUR/mo  80.92  = 120% of cap
  measured grok 0.165    EUR/prompt 0.402  EUR/run  30.17  EUR/mo 130.72  = 194% of cap

managed    250 prompts   cap EUR 225.00
  fallback grok 0.012    EUR/prompt 0.249  EUR/run  62.25  EUR/mo 269.73  = 120% of cap
  measured grok 0.165    EUR/prompt 0.402  EUR/run 100.56  EUR/mo 435.75  = 194% of cap

planConfig.ts:366-372 claims: growth_pro EUR 11.78/run, 51.02/mo, 11.4% of price
                              managed    EUR 39.25/run, 170.07/mo, 11.3% of price
```

Scheduled weekly collection at the sold prompt allowance exceeds the hard budget
ceiling on both seven-engine tiers even using the code's own understated grok
constant. `_auth.js`'s `checkCollectionLimits` will hard-block collection partway
through every month.

**Why this belongs in a metrics audit.** Two numbers on this tab depend on it.
The admin "Monthly API budget" meter (`AIVisibility.tsx:681-688`) will show an
overrun that reads as a usage anomaly rather than a pricing model error. And the
customer-facing "Included runs: Weekly, about 4 per month"
(`AIVisibility.tsx:193-200`) is derived from `PLAN_COLLECTION_COOLDOWN_HOURS`,
which is a cooldown and not a statement of affordability. The budget will cut
collection off before four runs happen, so that label is a promise the system
cannot keep. It is also the reason the score will go stale mid-month, which
feeds F9.

There is a second ceiling underneath the euro one that is tighter still.
`_cost.js:181-184` puts the SerpApi pool at 500 credits per month platform wide,
shared by every client, with `google_ai` at 1 credit per check and `ai_overview`
at 1 to 2. `_cost.js`'s own note computes one Growth PRO client at 187 credits
per month and one Managed client at 625 under the monthly cap. One Managed client
exceeds the entire platform pool. Three clients on any seven-engine tier do.

**Fix.** Three separate actions, in order. First, true up `ENGINE_COST_EUR.grok`
from the metered rows, in both `_cost.js` and `planConfig.ts`. Second, rebuild
the `PLAN_PROMPTS` derivation at seven engines including `ai_overview`, and
either cut the prompt allowances or raise the cap, because the current pair is
not satisfiable. Third, decide the SerpApi credit question explicitly, because it
binds before the euro budget does and it is the one ceiling a per-client cap
cannot protect. All three are pricing decisions and belong to `bg-strategy`, not
to a builder.

---

### F5. An engine with zero rows renders as a red `MISSING 0%`. MEDIUM, CONFIRMED

**Where.** `src/pages/AIVisibility.tsx:441-445`.

```
const isUnavailable = errorEngines.has(s.id) && s.checked === 0
const status = isUnavailable ? 'UNAVAILABLE'
  : s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
```

`UNAVAILABLE` requires an *error row*. An engine that has simply never been asked
has no rows of any kind, so `errorEngines` does not contain it, `checked` is 0,
`pct` is 0, and it falls through to `MISSING`: a red card reading `0%` and
`0/0 prompts`.

`_score.js:124-137` gets this right and says why:

> zero rows means WE FAILED TO ASK, not "this engine doesn't know you" ... This
> used to report 'missing', i.e. it told a prospect an AI engine had never heard
> of them when the truth was our quota ran out. Never again.

Same lesson, same fix, applied to the prospect path only. Executed side by side,
`_score.js` returns `unavailable` for both new engines where the dashboard
returns `MISSING`.

**Production exposure, MEASURED.** All six `grok` rows and all six `ai_overview`
rows belong to client 1. Every other client on a seven-engine plan (`managed` or
`pro`, which resolves to seven active engines because `copilot` and `deepseek`
are in `COMING_SOON_ENGINES`) therefore has zero rows for both. That is clients
2, 5, 19 and the twenty `Research` clients, roughly 23 accounts, each currently
showing two red `MISSING` cards for engines that have never been asked a
question.

**Mitigating detail, verified.** The P0 fix item is guarded by `e.checked > 0`
(`AIVisibility.tsx:465`), so no false remediation advice is generated. The damage
is confined to the card.

**Fix.** Add the `checked === 0` case to the status ladder as a fourth state
distinct from both `MISSING` and `UNAVAILABLE`, worded as not yet collected.
Ideally import the ladder from the shared module rather than reimplementing it,
since the thresholds also disagree (dashboard 50/25, audit 60/0).

---

### F6. A sort sentinel is displayed to the customer as a rank. MEDIUM, CONFIRMED

**Where.** `netlify/functions/_analysis.js:714,732`.

```
* Assigned pos=99 so they sort after numbered-list entries.
...
found.push({ pos: 99, name: comp })
```

`scanForKnownCompetitors` assigns `pos: 99` as an internal ordering sentinel.
That value is written into `ai_results.competitors_mentioned` and rendered
verbatim.

**Evidence, MEASURED in production.** Client 1, `prompt_id` 173, `ai_overview`:

```
competitors_mentioned = [{"pos":99,"name":"Premier Catering & Events"}]
```

Three consumers on this tab read it as a rank:

1. `AIVisibility.tsx:1185-1189`, the not-mentioned cell, renders
   `#{topComp.pos} {topComp.name}`, that is, the literal text
   "#99 Premier Catering & Events".
2. `AIVisibility.tsx:1203-1241`, the expanded "AI Top Results" list, sorts by
   `pos` and prints `#99`.
3. `AIVisibility.tsx:402-425`, `competitorFreq`, pushes 99 into `positions[]` and
   averages it into `avgPos`, which then appears in the Fix This hub title at
   line 486 as "Outranked by Premier Catering & Events (avg #99)".

**Why this is newly load-bearing rather than merely pre-existing.** The sentinel
only surfaces when a competitor is found by prose scan rather than by numbered
list. `ai_overview` is flattened to bullets by construction
(`_collect.js:602-615`) and `grok` returns web-sourced prose, so for both new
engines the prose scan is frequently the only source. The row above is real and
was written today.

**Fix.** Use `null` for an unranked prose mention and sort nulls last, rather
than encoding "unranked" as the number 99. The UI already handles a null brand
position correctly and should handle a null competitor position the same way.

---

### F7. `accuracy` treats a position-less mention as a top-3 placement. MEDIUM, CONFIRMED

**Where.** `src/lib/aiVisibilityScore.ts:117-125`.

```
if (!r.brand_position || r.brand_position <= 3) topThree++
```

A mention with no extracted rank is counted as if it landed in the top three. On
five engines that was a defensible default. On seven it is a systematic bias,
because the two new engines produce position-less mentions structurally rather
than occasionally:

- `ai_overview` is flattened to markdown bullets specifically so that
  `extractTopRankedResults` cannot read a rank (`_collect.js:596-601`). A position
  is only ever derived when the lead-in declares an ordering.
- `grok` returns web-plugin prose. Verified by execution: a representative grok
  response yields `brand_mentioned: true, brand_position: null`, and the two real
  grok `ok` rows in production both have `brand_position` null.

**Evidence, MEASURED by execution.** In the seven-engine simulation where both
new engines mention the brand with no position, accuracy rises from 75 to 83
while nothing about placement improved. Adding an engine that cannot report a
rank makes the "Top-3 placement" dimension go up.

**Refutation attempted, and it partly succeeded.** I expected to find that AI
Overviews can never produce a position. That is false, and the guard works better
than the concern assumed. See R1 in section 4. The bias in this finding is
real but it is narrower than "AI Overviews never ranks".

**Fix.** Exclude position-less mentions from the accuracy denominator rather than
crediting them, the same treatment `knowledge` already gives them
(`aiVisibilityScore.ts:99`). The label on the tab reads "Top-3 placement"
(`AIVisibility.tsx:524`), which is a claim about rank, so a row with no rank has
no business in it either way.

---

### F8. Grok timed out on 4 of its first 6 production calls. MEDIUM, CONFIRMED

**Evidence, MEASURED.** All six grok rows, written 2026-07-29 13:05 to 13:06:

```
2 x status ok      (cost_eur 0.17407, 0.15645)
4 x status error   error_code timeout, response_text "timeout after 45000ms"
```

45000ms is `ENGINE_TIMEOUT_MS_WORKER.grok` (`_collect.js:818`). A 67% first-day
timeout rate is an operational reliability problem, and it is also the trigger
that makes F1 visible: an engine whose rows are all errors leaves the result map
entirely and then sits in the reach denominator contributing nothing.

Note the interaction with F4. The error rows are billed the flat 0.012 fallback
(`costForRow` charges full cost for `timeout`, deliberately, per
`_cost.js:229-240`), but if OpenRouter completed the generation server side the
real cost of a timed-out grok call is closer to the 0.165 the successful rows
show. Timeouts on this engine may be materially under-billed against the budget
gate.

**Fix.** Raise the worker timeout for grok, or reduce `max_results` on the web
plugin (`_collect.js:225`, currently 2), and re-measure. Owner is `bg-backend`.

---

### F9. A reading up to 30 days old is presented under a "last checked today" header. LOW, CONFIRMED

`google_ai` and `ai_overview` are in `MONTHLY_CAPPED_ENGINES` with
`MONTHLY_CAP_DAYS = 30` (`_cost.js:495-496`), enforced on both the scheduled path
(`_enqueue.js:113-168`) and the manual path (`collect-prompt.js:80-92`). The other
five run weekly.

The header's `lastChecked` (`AIVisibility.tsx:292-319`) is the maximum
`checked_at` across all engines, so a page whose ChatGPT reading is an hour old
and whose AI Overviews reading is 29 days old displays a single freshness
timestamp of one hour. Per-engine recency is visible only by expanding a prompt
row.

This is a disclosure defect, not an arithmetic one. See R3 in section 4 for why
the differing cadence does **not** weight the aggregates, which was the form of
this concern I was asked to check.

**Fix.** Show per-engine `checked_at` on the engine card, or qualify the header
timestamp as the most recent of any engine.

---

### F10. `totalChecked` counts prompts the customer has deleted. LOW, CONFIRMED

**Where.** `AIVisibility.tsx:427-437`. `totalChecked` and `gapCount` sum over the
entire `results` map, which is keyed by every `prompt_id` the `ai_results` query
returned. That query (`AIVisibility.tsx:286`) has no `is_active` filter, while
`prompts` (line 285) does.

**Evidence, MEASURED.** Client 1 has `ok` rows for 6 active prompts and 2
inactive or deleted ones.

Consequences: the competitor banner at line 1327 reads "absent X of Y checks"
with an inflated Y; `competitorFreq` counts competitors from prompts the customer
no longer tracks; and the Category Breakdown footer at line 1374 reads
"{totalChecked} total checks across {prompts.length} prompts x {activeLLMs.length}
engines", where the stated product is wrong on both factors. For client 1 that
line will read roughly "44 total checks across 6 prompts x 7 engines", and 6 x 7
is 42.

The score itself is **not** affected: `computeAiVisibilityScore` iterates
`promptIds` from the active list only, which is precisely the "hole 3" fix
documented at `aiVisibilityScore.ts:26-32`. The fix was applied to the score and
not to the surrounding widgets.

**Fix.** Filter the results map to active prompt ids once, at the end of `load()`,
and derive every widget from that. Or stop asserting a product that is not one:
the footer should state the actual check count, not `prompts x engines`.

---

### F11. The SerpApi per-credit price comment contradicts itself and production. LOW, CONFIRMED

`planConfig.ts:236-241` states the ai_overview cost "is 1 for an inline overview
(EUR 0.023) and 2 when Google defers it behind a page_token (EUR 0.046)", then
sets the blended fallback to `0.069` and calls it "1.5 SerpApi credits on
average". Those cannot both be true: 1.5 credits at EUR 0.023 is EUR 0.0345.

Production settles it. Sentinel rows (1 search) carry `cost_eur` 0.04600 and
two-search rows carry 0.09200, so the real rate is EUR 0.046 per credit, matching
`_cost.js:178` `SERPAPI_COST_PER_SEARCH_EUR = 0.046`. The blended 0.069 is
correct; the per-credit figures in the comment are half the real price. The
identical stale figure appears in `_cost.js:157-163`.

This is comment-only today, but it is the kind of stale figure that gets copied
into the next budget calculation, which is how F4 happened.

---

### F12. `serpApiCreditsPerMonth()` defaults to the cadence the monthly cap exists to prevent. LOW, CONFIRMED

`_cost.js:191` signs as `serpApiCreditsPerMonth(plan, prompts, runsPerMonth = 4.333)`.
The capped engines run at most once per 30 days, so their correct
`runsPerMonth` is 1. The prose immediately above (lines 172-176) computes the
post-cap figures of 187 and 625 credits, which requires `runsPerMonth = 1`, but a
caller using the default gets the pre-cap 812. The function currently has no
callers, so this is latent. Give it the cap-aware default before it acquires one.

---

## 3. Answers to the six questions asked

**1. Do the two score implementations still agree at seven engines?** No.
Measured 4-point divergence on identical input, entirely in `reach`, plus a
latent population divergence in three more dimensions. F1.

**Are the six dimensions genuinely computed or placeholders?** All six are
genuinely computed from row data. None is a stub. `sentiment` has one synthetic
fallback: when nothing is mentioned but `knowledge > 0` it returns the literal
constant 55 (`aiVisibilityScore.ts:115`). That branch is unreachable in practice,
since `knowledge > 0` requires a mention.

**Does engine count alone move the score?** Yes, three of the six dimensions.
`reach` directly, by denominator (F1). `consistency` by threshold cliff (F2).
`accuracy` upward, by admitting position-less mentions (F7). `recognition`
changes with engine count but that is a legitimate measurement effect, except for
the part F3 identifies. `knowledge` and `sentiment` are correctly scale
invariant: both are means over mentioned rows and neither has an engine-count
denominator. Measured net effect on a real client: 95 to 90.

**2. Does the AI Overviews legitimate empty distort the metrics?** Yes, and it is
the largest single contributor. Measured: 4 of the 5 points client 1 lost today.
It reads as "your brand is invisible" when the truthful reading is "Google
displayed no overview for this query", and it generates remediation advice that
cannot possibly change the outcome. F3.

**3. Are the per-engine panel denominators right?** The denominators themselves
are correct: `checked` counts prompts with a row for that engine, which is the
right base. Two defects sit around them. Zero-row engines are labelled `MISSING`
rather than not-collected (F5), and the status thresholds disagree with the audit
implementation's. On the specific concern about the monthly cap weighting weekly
engines four to one: it does not, and the reasoning is in R3. That was the
strongest form of the concern and it does not survive contact with the code.

**4. Does the bullet flattening hold, and does grok produce sensible positions?**
The flattening guard holds and is better engineered than the brief credits. See
R1. Grok produces `brand_position: null` on prose, which is correct behaviour and
not garbage, but it feeds F7. The real position defect is on the competitor side,
not the brand side: F6.

**5. Is the cost attribution what the row carries?** On the display path, yes.
`Usage.tsx:113-118` sums `cost_eur` per row and only falls back to the flat
estimate for legacy NULL rows, which it labels. The AI Visibility budget meter
(`AIVisibility.tsx:369`) sums `cost_eur` with `|| 0` and matches `_auth.js:229`
exactly, so the meter shows what the gate enforces, which is what an admin needs.
The defect is not in the display. It is that the underlying grok constant is 14x
wrong and the plan model was never re-derived at seven engines. F4.

**6. Anything else unstable at seven engines?** F6, F8, F9, F10, F12. Plus one
cosmetic item: the expanded prompt row's grid is
`repeat(Math.min(activeLLMs.length, 5), 1fr)` (`AIVisibility.tsx:1199`), so at
seven engines two panels wrap to a second row while the table header above them
stays at seven columns. Not a correctness issue, noted so it is not rediscovered.

---

## 4. Claims I could not confirm, and claims I disproved

Recording these because two of them were the brief's leading hypotheses, and
because inheriting an unverified claim is how this repository has previously
wasted a build cycle.

**R1. "AI Overviews bullets could fabricate a brand position." REFUTED.** The
guard works, and it is more discriminating than a blanket suppression. Executed
against unordered bullets with the brand third in the list, `brand_position`
returns `null`. Executed against the same bullets under a lead-in reading "Here
are the top 5 caterers", it returns `3`, because `looksRankedList` found an
explicit ordering cue. Production agrees and shows the subtler case: client 1's
`prompt_id` 239 `ai_overview` row carries `brand_position: 1`, arrived at via
`detectSuperlativeRank` on a stated superlative ("Cele mai apreciate ... sunt"),
which is a rank Google declared rather than one the parser inferred. That is
correct on every count. Do not add a suppression here.

**R2. "The sentinel string could register a false mention or a phantom
competitor." REFUTED.** Executed: `brand_mentioned false`, `brand_position null`,
`sentiment neutral`, `competitors_mentioned null`. The deliberate avoidance of
brand-like words in the sentinel wording (`_collect.js:584-587`) does what it
claims.

**R3. "The 4:1 row count ratio silently weights the weekly engines four to one in
the aggregates." REFUTED for this tab.** `load()` orders by `checked_at desc` and
keeps the first row per `(prompt, llm)` (`AIVisibility.tsx:293-310`), and
`buildScoreResultMap` does the same newest-wins de-duplication. Every engine
therefore contributes at most one row per prompt regardless of how many times it
ran, and no time filter is applied (deliberately, per `aiVisibilityScore.ts:34-37`).
So the cadence difference does not propagate into recognition, reach,
consistency, the engine cards or the category breakdown. What it does produce is
staleness, which is F9, and it will affect any time-bucketed trend chart, which
lives on `Competitors.tsx` and `Dashboard.tsx` and is outside this scope. Someone
should check those separately; I did not.

**R4. "The budget meter on this tab disagrees with the server gate." REFUTED.**
Both use `(cost_eur || 0)` over the current calendar month.
`AIVisibility.tsx:357-369` and `_auth.js:225-229` are consistent. `Usage.tsx`
differs by estimating NULL rows, but it discloses that in its own subtitle and it
is answering a different question.

**R5. "The reach dilution is hurting customers now." NOT CONFIRMED.** Only three
clients have any brand mention, and for each of them every active engine has
produced at least one mention, so measured reach is 100 under both formulas. The
defect is real in code and unexposed in data. I flag it HIGH anyway because the
grok timeout rate makes exposure imminent, not because it is currently visible.

**R6. Growth PRO specifically.** No client is on `growth_pro`. The seven-engine
clients in production are on `managed` and `pro`. Everything in this report about
seven-engine behaviour was verified against those, and applies identically to
`growth_pro` because `PLAN_ENGINES.growth_pro` and `PLAN_ENGINES.managed` are the
same list (`planConfig.ts:65-66`).

---

## 5. What was not checked

- **The browser.** Every UI claim in this report is read from source and traced to
  a line, not observed in a running page. I did not open the dashboard. Nothing
  here depends on a rendered measurement, so the transition and viewport traps
  did not arise, but neither did I verify visually that the red `MISSING` cards
  in F5 look the way the code says they do.
- **Light mode.** Untouched, as in every prior audit.
- **`Dashboard.tsx`, `Competitors.tsx`, `Recommendations.tsx`, `Sentiment`.** Out
  of scope. They share `aiVisibilityScore.ts`, so F1, F2 and F7 reach the Overview
  hero unchanged. The time-bucketed trend charts on Competitors and Dashboard are
  the one place R3's cadence argument does not protect, and they need their own
  pass.
- **The Instant Audit end to end.** I executed `_score.js` directly. I did not
  exercise the prospect audit function that calls it, so the 4-point divergence is
  proven at the function boundary and not through the live audit path.
- **Whether the grok timeouts are billed by OpenRouter.** F8 raises the
  possibility of under-billing on timeout. Settling it needs the OpenRouter
  dashboard, which no agent has.
- **Statistical significance of anything.** Six prompts on one client is not a
  sample. The 95-to-90 measurement is arithmetically exact for that client's
  current rows and is not a population estimate.
- **`checked_at` timezone handling** in the month-boundary budget query.
- **Competitor name quality** from the new engines beyond the `pos: 99` defect.

---

## 6. Ranked fix list

Owners follow the AGENT-OS write scopes. Nothing below was fixed by this review.

| Rank | Fix | Owner | Blocking? |
|---|---|---|---|
| 1 | Rebuild the seven-engine cost model: true grok up from metered rows, add `ai_overview`, re-derive `PLAN_PROMPTS` against a satisfiable cap, and settle the 500-credit SerpApi ceiling (F4, F11) | `bg-strategy`, then `bg-backend` | Yes. Pricing decision, needs the owner |
| 2 | Exclude the AI Overviews "no overview rendered" state from recognition, reach and consistency; surface it as its own count on the engine card (F3) | `bg-architect`, then `bg-backend` + `bg-app` | Yes |
| 3 | Port `enginesWithResults()` into `aiVisibilityScore.ts`, then collapse the TS/CJS pair into one implementation (F1) | `bg-app` + `bg-backend` | Yes |
| 4 | Decide and implement a consistency measure that a pricing change cannot move (F2) | `bg-strategy`, then `bg-app` | Yes |
| 5 | Add a not-yet-collected engine card state distinct from `MISSING` and `UNAVAILABLE` (F5) | `bg-app` | No, but 23 clients see it today |
| 6 | Stop encoding "unranked" as `pos: 99`; use null and sort last (F6) | `bg-backend`, then `bg-app` | No |
| 7 | Drop position-less mentions from the accuracy denominator (F7) | `bg-app` | No |
| 8 | Diagnose the grok timeout rate; raise the cap or cut `max_results` (F8) | `bg-backend` | No |
| 9 | Per-engine freshness on the engine card (F9) | `bg-app` | No |
| 10 | Filter the results map to active prompts; fix the category breakdown footer (F10) | `bg-app` | No |
| 11 | Cap-aware default on `serpApiCreditsPerMonth()` (F12) | `bg-backend` | No |

Ranks 1 through 4 are the block. Each one changes a number a customer pays to
trust, and none can be settled by a builder without a ruling.
