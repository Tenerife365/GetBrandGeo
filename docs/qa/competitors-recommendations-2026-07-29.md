# Competitor detection and recommendation generation: correctness audit

**Date:** 2026-07-29
**Scope:** `netlify/functions/_analysis.js`, `_competitor_filter.js`, `generate-recommendations.js`,
`src/lib/competitorFilter.ts`, `src/pages/Competitors.tsx`, `src/pages/Recommendations.tsx`,
plus the two other surfaces that read the same column (`src/pages/AIVisibility.tsx`,
`src/pages/AuditReport.tsx`).
**Data:** live read only against Supabase project `duiyifepitvugyulobqm`. 1,077 `ai_results`
rows, 4,170 extracted competitor instances, 35 client rows, 58 `prospect_audits`.
**Out of scope by instruction:** the AI Visibility Score, the six dimensions, and the engine
status cards. Where a finding touches those, it is marked and left to the other reviewer.

**Overall verdict: BLOCK on the competitor read path.** The extraction pipeline is better
than its reputation and the two-stage design is sound. The read path is not. Three surfaces
read the same column with three different, mutually inconsistent aggregations, and the one a
paying customer sees first publishes a rank number that is arithmetically meaningless. This
is measured, not inferred, on a live managed account today.

---

## Findings

Every finding carries a severity, a verdict, and its evidence. Reasoning-only findings are
labelled as such.

---

### C1. `/ai-visibility` averages the prose sentinel into a displayed rank

**Severity: CRITICAL. Verdict: CONFIRMED (measured on production).**

`AIVisibility.tsx:402-425` builds its own competitor aggregation. It pushes every `pos` into
one array, including the `pos: 99` sentinel that `_analysis.js` writes for a prose-only
scan hit, and then averages the lot:

```
src/pages/AIVisibility.tsx:411   freq[key].positions.push(c.pos)
src/pages/AIVisibility.tsx:421-423
  avgPos: positions.length > 0
    ? Math.round(positions.reduce((s, p) => s + p, 0) / positions.length * 10) / 10
    : null
```

`src/lib/competitorFilter.ts:160` exists precisely to exclude 99 from that average
(`const ranked = v.positions.filter(p => p !== PROSE_POSITION_SENTINEL)`). `Competitors.tsx`
and `Recommendations.tsx` were migrated onto it on 2026-07-13. `AIVisibility.tsx` was not.

Measured for client 1 (Bucate pe Roate, managed tier), all rows to date:

| competitor | instances | ranked | correct avg pos | value rendered at `AIVisibility.tsx:1346` |
|---|---|---|---|---|
| elegant catering | 18 | 7 | #2.1 | **#61.3** |
| royal catering | 11 | 9 | #3.2 | **#20.6** |
| premier catering & events | 15 | 13 | #2.1 | **#15.0** |

Query used:

```sql
with x as (select lower(trim(j->>'name')) k, (j->>'pos')::int pos
           from ai_results r, lateral jsonb_array_elements(r.competitors_mentioned::jsonb) j
           where r.client_id=1 and r.competitors_mentioned is not null)
select k, count(*) total, count(*) filter (where pos<>99) ranked,
       round(avg(pos) filter (where pos<>99),1) correct,
       round(avg(pos),1) as rendered
from x group by 1 order by ranked desc;
```

The same number is then written into the headline "Fix This" card at
`AIVisibility.tsx:486`, so BpR's top P1 action currently reads, verbatim from the template,
`Outranked by Elegant catering (avg #61.3)`. "Elegant Catering" is the exact name
`CLIENT-HEALTH-BPR.md` recorded as the false leader, and `competitorFilter.ts` was built to
demote it. It is still promoted to the top of the page the customer opens first.

**Fix:** delete `competitorFreq` and `parseCompetitors` from `AIVisibility.tsx` and call
`aggregateCompetitors(rows, 8)` from `lib/competitorFilter.ts`. Render `avgPos` and
`rankedMentions`, and carry the `proseOnly` badge across, as `Competitors.tsx:477` already
does.

---

### C2. "Outranked by" is asserted without comparing a single position

**Severity: CRITICAL. Verdict: CONFIRMED (code).**

`AIVisibility.tsx:483`:

```js
if (competitorFreq[0] && gapCount > 0) {
  items.push({ priority: 'P1', title: `Outranked by ${competitorFreq[0].name} ...
```

The trigger is "some competitor was named at all" AND "the brand was absent somewhere". It
never reads `brand_position`, never compares the competitor's positions to the brand's, and
has no `rankedMentions` floor. A name that appears only because the customer typed it into
their own seed list, and was never ranked by any engine, satisfies this condition and
produces the word "Outranked".

The generated `fix` string then instructs the customer to publish a comparison page against
that name and pitch it to trade publications. That is real spend directed by a signal that
was never checked.

The rule-based generator in `Recommendations.tsx:363` gets this right
(`if (topComp && topComp.rankedMentions >= 3)` over a `ranked` list filtered on
`!c.proseOnly`). `AIVisibility.tsx` never received that fix.

**Fix:** gate on `rankedMentions >= 3` and on `comp.avgPos < brandAvgPos`. If the comparison
cannot be made, title it "Named alongside you", not "Outranked by".

---

### C3. Roughly a third of stored positions are appearance order presented as rank

**Severity: HIGH. Verdict: CONFIRMED (code plus production distribution).**

`extractTopRankedResults` (`_analysis.js:120-134`) returns at most five items
(`.slice(0, 5)`) and only accepts `pos` in 1..10. Everything after that comes from the
bold/bullet pass at `_analysis.js:839-853`, which assigns `nextPos++`, an appearance index,
into the same `pos` field. The code comment at `:810-812` is honest that "there is no real
rank in prose". Nothing downstream knows that.

Production distribution of the 4,170 competitor instances:

```
pos  1: 616   pos  6: 375   pos 11: 16
pos  2: 591   pos  7: 322   pos 12:  4
pos  3: 578   pos  8: 253   pos 13:  2
pos  4: 525   pos  9: 195   pos 14:  1
pos  5: 505   pos 10: 153   pos 99: 34
```

1,298 instances (31.1 percent) sit at `pos` 6 or higher, which the numbered extractor can
never emit given the five-item slice. 23 of them exceed 10, which it can never emit at all.

Worse, the synthetic indices are not confined to 6 and up. When a response contains no
numbered list, `nextPos` starts at 0 and the bold names receive 1, 2, 3, which are
indistinguishable from engine-declared ranks. Reproduced against `_analysis.js` directly
with a Gemini-shaped bullet answer:

```
input:  "*   **Royal Catering** ...\n*   **Elegant Catering** ...\n*   **Salt & Pepper Catering** ..."
output: [{"pos":1,"name":"Royal Catering"},{"pos":2,"name":"Elegant Catering"},{"pos":3,"name":"Salt & Pepper Catering"}]
```

Gemini is the worst affected engine at 38.5 percent of its instances at `pos` 6 or higher,
which is consistent with the note at `_analysis.js:223-225` that Gemini structurally never
emits a numbered list. These values reach the customer as "Avg Position" in the
`Competitors.tsx:483` column and reach the recommendation model as `avg rank #N`
(`generate-recommendations.js:139`).

The system correctly refuses to fabricate `brand_position` from a prose mention
(`_analysis.js:750-752`, finding 1.2). It fabricates a competitor position from a prose
mention on the very next screenful.

**Fix:** add a discriminator to the stored object, for example
`{pos, name, ranked: true|false}`, set `ranked: false` on everything the bold/bullet pass
appends, and have `aggregateCompetitors` exclude unranked entries from `avgPos` exactly as
it already excludes 99. Old rows without the field can be treated as ranked only when
`pos <= 5`.

---

### C4. The semantic gate passed certification bodies as catering competitors, today

**Severity: HIGH. Verdict: CONFIRMED (measured).**

`_competitor_filter.js` is the designed answer to the unbounded denylist problem, and its
own header lists certifications as class one of what it should remove. Rows written at
`2026-07-29 13:05:42` for client 1 (prompt 243, which `CLAUDE.md` records as the HACCP /
ISO 22000 prompt):

| row | engine | stored competitor | pos |
|---|---|---|---|
| 3012 | perplexity | SGS Romania | 1 |
| 3012 | perplexity | TUV Austria Romania | 3 |
| 3012 | perplexity | TUV Romania | 4 |
| 3011 | claude | TUV Austria Romania | 4 |
| 3011 | claude | Bureau Veritas Romania | 6 |
| 3011 | claude | Lloyd's Register Romania | 7 |
| 3011 | claude | NOR Certification | 8 |

(Diacritics stripped in this table only; the stored values carry them.)

Row 3003, same run, stores `{"pos":1,"name":"Degustare"}`. "Degustare" is the Romanian noun
for a tasting. It is the number one competitor of a catering company, according to the
product, as of this afternoon.

The structural pre-pass cannot catch any of these. Confirmed by calling `isCompanyName`
directly:

```
true   "TÜV Austria România"      true   "SGS România"
true   "Bureau Veritas România"   true   "Degustare"
true   "Lloyd's Register Romania" true   "NOR Certification"
false  "Plan logistic"
```

The certification bodies are genuine companies, so the only gate that could remove them is
the semantic one, and it did not. The likely cause is the context it is given: `_collect.js:963`
passes `snippet: row.response_snippet`, which is 300 characters centred on the brand mention
(`_analysis.js:796-801`), not the prompt and not the client's industry. Asked whether
"SGS Romania" competes with "bucate pe roate" with no industry stated, keeping it is a
defensible answer.

The same class reached the **public prospect audit**, which is the surface a stranger
evaluating the product sees. `prospect_audits.competitor_flags`, all dated 2026-07-16, three
days after the gate shipped:

```
"Personalize the Customer Experience"          perplexity, gemini
"Strategic Segmentation and Personalization"   gemini (x2)
"Segment and Personalize"                      perplexity (x2)
"Streamline the Checkout Process"              perplexity
"Automate and Centralize Documents"            perplexity
"Installation and Configuration"               gemini
"Best Advertising Platforms"                   perplexity
```

`AuditReport.tsx:270-272` renders these as
`ChatGPT named <name> instead of you`. A prospect is being told an AI engine named
"Personalize the Customer Experience" instead of their brand.

**Fix:** pass the prompt text and `clients.category` / a one-line industry descriptor into
`buildPrompt`, and give the model the brand's market explicitly rather than making it infer
one from a 300-character snippet. This is a prompt change inside an existing call, not new
architecture.

---

### C5. A client with empty `brand_aliases` is measured against itself

**Severity: HIGH. Verdict: CONFIRMED (production row plus reproduction).**

Client 24 ("Restaurante Transilvania", growth tier) has `brand_aliases = []` and
`brand_website = 'transilvaniatenerife.es'`. `buildBrandMatchers` (`_analysis.js`) builds
matchers only from aliases plus the bare domain, so the brand's own trading name matches
nothing. Consequences, both live:

- 0 of 10 rows have `brand_mentioned = true`. (Score impact belongs to the other reviewer;
  noted and dropped.)
- The competitor filter at `_analysis.js:804` is
  `.filter(item => !matchesAlias(item.name, matchers))`, so the brand cannot be removed from
  its own competitor list. `ai_results` for client 24 stores
  `{"pos":1,"name":"Restaurante Transilvania"}` and
  `{"pos":2,"name":"Restaurante Transilvania"}`, from gemini and perplexity.

Reproduced against the real config:

```
cfg = { brand_aliases: [], brand_website: 'transilvaniatenerife.es' }
text = "1. **Restaurante Transilvania** ...\n2. **Bambi Gourmet** ..."
=> brand_mentioned: false
=> competitors: [{"pos":1,"name":"Restaurante Transilvania"},{"pos":2,"name":"Bambi Gourmet"}]
```

Because the brand ranks first in its own answers, it will sort to the top of its own
competitor board and become `topComp` in `Recommendations.tsx:320`, which then advises the
customer to audit their own website for pages they do not have.

**Fix:** two guards, both cheap. In `buildBrandMatchers`, fall back to `clients.name` when
`brand_aliases` is empty. In onboarding and `set-client-*`, refuse to save a client with no
alias, since every downstream measurement is meaningless without one. Nothing in the current
code warns.

---

### C6. `/recommendations` throws for any client with zero visibility on AI Overviews

**Severity: HIGH. Verdict: CONFIRMED (code, deterministic).**

`Recommendations.tsx:331` reads `how: LLM_QUICK_WINS[s.llm]` with no fallback. Key inventory:

```
LLM_QUICK_WINS: chatgpt, gemini, claude, perplexity, meta, google_ai, copilot, deepseek, grok
LLM_SOURCE:     chatgpt, gemini, claude, perplexity, meta, google_ai, copilot, deepseek, grok, ai_overview
```

`ai_overview` went live today for Growth PRO and above (`planConfig.ts` PLAN_ENGINES). When a
client scores 0 percent on it, `zeroLLMs` includes it, the rec is built with
`how === undefined`, it sorts first (impact `critical`, `Recommendations.tsx:429-432`), and
`RecCard` is rendered with `defaultOpen={i === 0}` (`:1059`), which immediately evaluates
`rec.how.map(...)` at `:478`. There is no `ErrorBoundary` anywhere in `src/`
(grep for `ErrorBoundary|componentDidCatch` returns nothing), so this white-screens the page.

A first `ai_overview` run returning "not shown" is the common case, not the edge case:
`_collect.js` exports `AI_OVERVIEW_NOT_SHOWN` for exactly that outcome.

This is the "seven engines or five" question, answered. The **backend** is clean:
`generate-recommendations.js` iterates `Object.entries(engine_stats)` and hardcodes no engine
list, so it handles any number of engines. The gap is entirely front-end, in one map.

**Fix:** `how: LLM_QUICK_WINS[s.llm] ?? []` as the immediate stop-loss, then add a real
`ai_overview` entry. Better: derive the key set from `LIVE_ENGINES` and fail the build when a
live engine has no entry, which is the same lesson `LIVE_ENGINES` was added for this morning.

---

### C7. Read-time competitor identity is exact-string, so one company splits into several rows

**Severity: MEDIUM. Verdict: CONFIRMED (measured).**

`aggregateCompetitors` keys on `rawName.toLowerCase().trim()`
(`competitorFilter.ts:147`). Case folds; nothing else does. The domain-aware `dedupeKey`
folding in `_analysis.js:825-838` runs only within a single response, so variants that arrive
from different engines or different runs never meet.

Client 1, one hotel and one venue group, as stored:

| entity | stored variants | instances |
|---|---|---|
| Crowne Plaza | `Crowne Plaza Bucharest`, `Crowne Plaza Bucharest Catering`, `Crowne Plaza Bucharest` with a hotel emoji prefix, `Crowne Plaza Bucharest` with a star-rating suffix | 4 / 1 / 2 / 1 |
| ZOOMA | `Zooma / City Grill Group`, `ZOOMA`, `ZOOMA Events`, `ZOOMA Events & More`, `ZOOMA Paradisul Verde` with an emoji prefix | 3 / 1 / 1 / 1 / 2 |
| Domeniile Saftica | four spellings differing only by leading emoji or trailing stars | 1 each |

Effect: "Competitors tracked" on `Competitors.tsx:321` overcounts, the top-5 cut drops real
contenders in favour of a fragment of a bigger one, and `computeTrend`
(`Competitors.tsx:137`) matches on exact lowercase name so the fragments never merge in the
trend either.

**Fix:** apply `dedupeKey` semantics at read time. Port the function into
`competitorFilter.ts` and key the aggregation map on it, keeping the longest human-readable
variant as the display name.

---

### C8. `toDisplayName` mangles real company names, worst on non-ASCII

**Severity: MEDIUM. Verdict: CONFIRMED (reproduced).**

`competitorFilter.ts:69` is `name.replace(/\b\w/g, c => c.toUpperCase())` applied to a
lowercased key. `\w` is ASCII-only, so any non-ASCII letter creates a word boundary and the
next letter is capitalised mid-word:

```
stored "SGS România"          renders "Sgs RomâNia"
stored "TÜV Austria România"  renders "TüV Austria RomâNia"
stored "LOLYPOP SERV SRL"     renders "Lolypop Serv Srl"
stored "DevsData LLC"         renders "Devsdata Llc"
stored "BucateSavuroase.ro"   renders "Bucatesavuroase.Ro"
stored "CityGourmet"          renders "Citygourmet"
stored "monday.com"           renders "Monday.Com"
```

This is on `/competitors` (the table at `Competitors.tsx:470`, the bar chart labels, the
summary card at `:313`) and on the competitor chips in `Recommendations.tsx:896`. A product
that sells accuracy of measurement is printing "Sgs RomâNia" to a paying Romanian client.

Separately, `AIVisibility.tsx:419` uses a **different** transform
(`name.charAt(0).toUpperCase() + name.slice(1)`), so the same competitor renders differently
on two pages of the same dashboard.

**Fix:** stop normalising case at all. Keep the most frequent original spelling as the
display name and use the lowercase form only as the map key.

---

### C9. `competitorType()` injects a fabricated attribute into the model's evidence block

**Severity: MEDIUM. Verdict: CONFIRMED (reproduced against the shipped function).**

`generate-recommendations.js:46-53` classifies every competitor into
marketplace / agency / individual / boutique, from two hardcoded recruiting-vertical sets and
one two-capitalised-words regex. The label is written into `compLines` at `:144`
unconditionally, for company clients as well as individuals.

Calling the shipped function:

```
individual   "Elegant Catering"
individual   "Royal Catering"
individual   "Bambi Gourmet"
individual   "Chat Noir"
individual   "Google Alerts"
individual   "Sprout Social"
boutique     "Brand24"
boutique     "Tüv Austria România"
agency       "Egon Zehnder"        (correct, it is in the AGENCIES set)
```

Two problems. First, `MARKETPLACES` and `AGENCIES` are a hardcoded list of recruiting brands,
which is the Scalability Rule violation `CLAUDE.md` section 4.1 forbids: it produces a
meaningless label for every client outside one vertical. Second, for `type = 'individual'`
clients the persona block at `:177` instructs the model that a scarcity of `[individual]`
names "is the core insight". Since "Elegant Catering" and "Sprout Social" are labelled
`[individual]`, that core insight is computed from noise.

For a company client the label is worse than useless, because no part of the prompt explains
what it means, so the model is free to invent a reading of it.

**Fix:** drop `competitorType` from the company path entirely. For the individual path,
either classify with the same Haiku call that already runs, or drop the label and let the
model reason from names it can see.

---

### C10. Two of the ten `LLM_SOURCE` claims describe sources the product does not measure

**Severity: MEDIUM. Verdict: CONFIRMED for grok, PLAUSIBLE for gemini and chatgpt.**

`LLM_SOURCE` (`Recommendations.tsx:142-153`) is shown to customers as the "why this matters"
body of a critical recommendation (`:330`). Checked against how BrandGEO actually calls each
engine:

| engine | claim | assessment |
|---|---|---|
| grok | "uses real-time web data and X/Twitter"; quick win 1 is "Maintain an active presence on X (Twitter)" | **Not defensible as measured.** `_collect.js:776` calls `x-ai/grok-4.5` through OpenRouter with `{ web: true }`, which becomes `body.plugins = [{ id: 'web', ... }]` at `:225`. That is OpenRouter's generic web-search plugin, not X. Nothing in BrandGEO's grok path touches X, so an improvement in X presence cannot move the number the customer is looking at. |
| gemini | "Google Business Profile, Google Maps, and Google-indexed structured data are the fastest path to appearing here" | **Folklore.** Google documents no GBP input to Gemini ranking. It is plausible for local-intent prompts and simply wrong for a B2B SaaS client, and it is stated as fact with a superlative ("the fastest path"). |
| chatgpt | "sources from web crawl data and Bing search" | **Stale.** OpenAI's search now runs on its own crawler and index; Bing is no longer the accurate description. Directionally harmless, factually dated. |
| claude | "sources from high-quality web content" | **Defensible.** I expected this to contradict the collector and it does not, see R5 below. |
| perplexity, google_ai, ai_overview, copilot, deepseek | generic index/freshness claims | Defensible or unreachable. |

The three unreachable engines (`meta`, `copilot`, `deepseek`) still carry advice text. `meta`
can surface on historical rows. Harmless but dead weight.

**Fix:** rewrite the grok entry to describe web search, since that is what is measured, and
soften the gemini entry to remove the causal superlative. Anything that cannot be traced to a
vendor statement or to BrandGEO's own collector configuration should not be phrased as fact.

---

### C11. Priority is a hand-assigned literal on both generators

**Severity: MEDIUM. Verdict: CONFIRMED (code).**

Nothing in either priority scheme is derived from a measured effect.

Rule-based, `AIVisibility.tsx`: `P0` is a literal at `:467` (zero-visibility engine), `P1`
literals at `:476` and `:485`, `P2` literals at `:494` and `:503`. Fixed rank by generator
identity.

Rule-based, `Recommendations.tsx`: `impact: 'critical'` at `:326`, `'high'` at `:393` and
`:370`, `'medium'` at `:414`. One is conditional
(`impact: gapLLMs.length >= 2 ? 'critical' : 'high'`, `:345`), which is a count threshold, not
an impact estimate. `effort` and `timeEst` ("2-4h", "6-12h") are likewise literals attached to
the generator, not to the client's situation.

Model-generated: `generate-recommendations.js:244-246` gives the model a three-line rubric and
`:332` coerces anything unrecognised to `'medium'`.

The UI presents these as "High Impact" / "Medium Impact" with a sorted order
(`Recommendations.tsx:429`, `IMPACT_STYLE` at `:213`), which reads as a computed ranking. It
is not one, and the product has no outcome data to compute one from yet, since no client has
more than one collection day.

This is not a bug so much as an unearned claim. It is listed because it is exactly the class
of thing the brief asks about: a number presented as measurement that is not measurement.

**Fix:** either rename the badges to something that does not claim measurement ("Blocking",
"Recommended", "Optional"), or derive impact from something real, for example the count of
tracked prompts affected multiplied by the engine's share of collected rows. The second is a
small change and would make the ordering defensible.

---

### C12. The fail-open is completely unobservable

**Severity: LOW to MEDIUM. Verdict: CONFIRMED for the observability gap, NOT MEASURED for the
failure rate.**

`_competitor_filter.js` has five fail-open returns (`:81` no key, `:104` non-200, `:106`
API error body, `:109` unparseable, `:116` timeout or network). It contains zero `console`
statements (`grep -c "console\." _competitor_filter.js` returns 0), and `_collect.js:959-965`
records nothing about whether the gate ran. No column, no log line, no counter.

Consequence: "the gate ran and kept these names" and "the gate never ran" are
indistinguishable from the outside, including for this audit. I could not determine how often
it fails open in production, and I am not going to guess. The 8-second timeout at `:31` runs
inside functions that already sit at a 26-second Netlify ceiling with the LLM call ahead of
it, so timeout pressure is real, but that is reasoning, not measurement.

What I can say from data: the gate does not remove everything it should even when it does run,
per C4.

**Fix:** one `console.log` on each fail-open branch with the reason, and a boolean or reason
string recorded per row. Without it, no future audit can settle this either.

---

### C13. `scanForKnownCompetitors` matches on raw substrings

**Severity: LOW. Verdict: CONFIRMED (reproduced), low live impact.**

`_analysis.js:718-736` does `lower.includes(compLower)` with no word boundary, plus a
"short form" produced by stripping catering-specific words
(`CATERING_STRIP_RE = /\b(catering|events?|restaurant|&)\b/gi`, `:716`) and matching that as a
substring when it is 4 characters or longer. Reproduced with BpR's real seed list:

```
"We attended a royal wedding reception."      -> [{"pos":99,"name":"Royal Catering"}]
"Their flavoursome dishes were excellent."    -> [{"pos":99,"name":"Flavours"}]
"Elegant Catering Solutions Ltd was there."   -> [{"pos":99,"name":"Elegant Catering"}]
```

The strip regex is also single-vertical, so a client seeding "Design Events" gets the token
"design" matched against every response that discusses design.

Live impact today is small: only 34 of 4,170 instances carry `pos: 99`, and both
`competitorFilter.ts` and `Recommendations.tsx:319` correctly refuse to let a prose-only name
be called a win. It scales badly with seed-list length, and it is the mechanism that inflated
"Elegant Catering" to 18 instances, which is what makes C1 as visible as it is.

**Fix:** reuse `buildAliasRegex` (already in the file, already boundary-aware) for seed names
instead of `includes`, and delete the vertical-specific strip regex.

---

### C14. Multi-company strings are captured as a single competitor

**Severity: LOW. Verdict: CONFIRMED (production).**

Stored values that name three companies in one field:

```
"Talkwalker / Brandwatch / Meltwater"     chatgpt, client 2
"Talkwalker, Meltwater, Brandwatch"       chatgpt, client 2
"Zooma / City Grill Group"                chatgpt, client 1, 3 instances
"Malt & COMATCH"                          perplexity, client 20
"HCR Digital / Leo Tognetti"              chatgpt, client 20
```

`looksLikeBrandName` rejects any name containing `/` (`_analysis.js:153`), but that gate runs
only on the bold/bullet path (`:214`). The numbered path calls `isCompanyName` only, which has
no slash rule, so slashed strings from numbered lists pass. 15 slash-bearing instances, most
recent 2026-07-24.

**Fix:** apply the slash rejection in `isCompanyName` so both paths share it, or split on
` / ` and emit each side as its own candidate.

---

### C15. `Competitors.tsx` does not filter error rows, against the module's own contract

**Severity: LOW. Verdict: CONFIRMED (code).**

`competitorFilter.ts:116` states: pass only rows already filtered to `status <> 'error'`.
`Recommendations.tsx:634` does (`.neq('status', 'error')`). `Competitors.tsx:230-232` does not
select `status` and does not filter it.

Competitor counts are unaffected, because an error row has `competitors_mentioned = null`. But
`computeData` counts every row into `engineStats[llm].total` (`:73`), which is the denominator
of "% of prompts where each brand appears, per AI engine" (`:184-187`) and of "AI responses
analysed" (`:326`). An engine outage therefore depresses both the brand's and the
competitors' visibility percentages on this page, while `/recommendations` shows the correct,
error-excluded figures for the same client. Two pages, two different numbers.

The per-engine percentage itself is adjacent to the other reviewer's scope; the divergence
between the two pages is recorded here because it originates in this file's query.

**Fix:** add `.neq('status', 'error')` and a separate error-count query, mirroring
`Recommendations.tsx:627-646`.

---

### C16. The trend chart draws four competitor lines in one identical colour

**Severity: LOW. Verdict: CONFIRMED (code).**

`Competitors.tsx:273` is
`const colorForKey = (key) => key === brandName ? chart.railActive : chart.sentimentNeutral`.
For the grouped bar chart at `:408-410` this is a coherent "you versus the field" choice, since
bars are separated by position. For the `LineChart` at `:585-603` it is not: four competitor
series are drawn with the same stroke, the same width, and `dot={false}`, and the legend lists
four names against one swatch. Once two lines cross, nothing in the chart says which is which.

The trend section is unreachable today (`trendData.length < 2` for every client, since no
client has two collection periods), so this is latent rather than live.

**Fix:** keep the brand in `railActive` and give competitors distinguishable neutrals or
dash patterns, or reduce the trend chart to brand versus top competitor only.

---

### C17. `_competitor_filter.js` documents a renumbering it does not perform

**Severity: LOW. Verdict: CONFIRMED (code).**

The comment at `:111-113` says kept competitors are renumbered 1..n by original order. The
code at `:113-114` is `const kept = candidates.filter(...); return kept`, which preserves the
original `pos` and leaves gaps.

Keeping the original positions is the **correct** behaviour, because renumbering would
manufacture ranks the engine never expressed. The comment is what is wrong. It matters because
it invites the next maintainer to "fix" the code to match the comment, which would be a
regression, and because gapped positions in production (rows 3011, 3012) are otherwise easy to
misread as a bug.

**Fix:** correct the comment. Do not change the code.

---

## What I tried to refute, and what fell over

Two audits in this repo earned their keep by disproving inherited claims. These are mine.

**R1. REFUTED: "`Competitors.tsx:258` carries a fourth independent palette assigned by array
index."** Inherited from the earlier dashboard audit, and no longer true. The file now resolves
colour at render time from `useChartTheme()` via `colorForKey` (`:273`), and the header comment
at `:151-159` records the index-keyed arrays as removed under F-22. There are no hardcoded hex
values and no index-keyed colour arrays left in the file. The real remaining chart problem is
C16, which is the opposite defect: too few colours, not too many.

**R2. REFUTED: comma-bearing competitor names are an extraction defect.** 268 instances
carry commas, which looked like list-joining. Sampling them shows they are almost entirely
real law firm names from the research tenants: `Greenberg Traurig, LLP`,
`Gibson, Dunn & Crutcher LLP`, `Schwebel, Goetz & Sieben, P.A`, `Panter, Panter & Sampedro`.
Not a finding. Any fix that splits on commas would break these.

**R3. REFUTED as current: emoji-prefixed competitor names.** 26 instances exist
(`Le Chateau` with a medal emoji, `Toya Concept Events` with a tent emoji). All were written on
or before 2026-07-10. `cleanCandidateName`'s leading strip (`_analysis.js:67`) handles them now.
This is legacy data that the read path still displays, not an active extraction bug. It is
folded into C7, since the variants fragment the aggregation.

**R4. REFUTED: "the recommendation logic silently assumes five engines."** Half true only.
`generate-recommendations.js` iterates `Object.entries(engine_stats)` and hardcodes no engine
list anywhere, so the backend is engine-count agnostic and handles seven as well as five.
`Recommendations.tsx` derives `LLM_LABEL` from `ENGINE_META` and imports `LIVE_ENGINES`, so the
labels are safe too. The one genuine gap is `LLM_QUICK_WINS`, and it is a crash rather than a
silent omission, which is C6. `AuditReport.tsx:56-58` does still hardcode five engine labels,
but that page has its own engine set from `_prospect_engines.js`, so it is a separate question
and I did not pursue it.

**R5. REFUTED: "the Claude quick-wins contradict the collector."** I expected the advice to
improve web content for Claude to contradict `CLAUDE.md` section 1.2, which says Claude runs
in "training-data mode (no web search)". Reading the code instead of the doc:
`_collect.js:360` sends `tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }]`
with the `anthropic-beta: web-search-2025-03-05` header, and the comment at `:350-352`
explicitly says not to remove it. **`CLAUDE.md` section 1.2 is stale**, the collector is right,
and the Claude advice string is fine. Worth correcting in `CLAUDE.md` on its own account.

---

## What I did not check

Stated plainly, because a review that lists nothing here did not review.

1. **The failure rate of the Haiku semantic gate.** Structurally unmeasurable from outside,
   see C12. I have no evidence about how often it fails open, and I have not asserted any.
2. **Re-running `analyseResponse` over production `response_text` at scale.** The column
   exists and is populated on 966 of 999 successful rows, which would allow a precise
   precision/recall measurement of the extractor against real answers. There is no service key
   available in this environment and the anon key is behind RLS, so I could not pull the corpus.
   Every claim about extractor **mechanism** in this report comes from direct calls into
   `_analysis.js`; every claim about **outcome** comes from stored rows. I have not mixed them.
3. **A defensible overall false-positive rate.** I can name confirmed false-positive classes
   with dated production instances, and I can bound one of them (31.1 percent of positions are
   synthetic). I cannot give a single trustworthy FP percentage over 2,834 distinct names
   without validating each against a company register, which I did not do. Anyone quoting a
   headline FP rate from this report would be quoting something I did not measure.
4. **False negatives entirely.** Measuring what the extractor missed requires the full response
   text, see item 2. Unknown.
5. **The 27 research tenants' competitor names.** Sampled for shape, not validated as real
   firms one by one.
6. **Anything in the browser.** No page was rendered. Every UI claim is traced to a line of
   source and, where a number is quoted, to a SQL result that feeds that line.
7. **The AI Visibility Score, the six dimensions, and the engine status cards.** Excluded by
   instruction. Three adjacencies noted and dropped: `_score.js:153` reads
   `competitors_mentioned` into scoring; client 24's zero mentions (C5) will read as a zero
   score; and the error-row denominator in C15.
8. **`prospect_audits` row content beyond `competitor_flags`.** Counted and sampled that one
   column only.
9. **Whether any customer has actually seen the `/recommendations` crash in C6.** No error
   telemetry was consulted. The crash is deterministic from the code; its occurrence rate is not
   established.

---

## Ranked fix list

Ordered by customer-visible harm per unit of work.

| # | Finding | Fix | Effort |
|---|---|---|---|
| 1 | C1 | Replace `competitorFreq`/`parseCompetitors` in `AIVisibility.tsx` with `aggregateCompetitors` from `lib/competitorFilter.ts`. Removes a wrong number from the first page a customer opens. | Small |
| 2 | C6 | `LLM_QUICK_WINS[s.llm] ?? []`, then add a real `ai_overview` entry. Stops a white screen on Growth PRO. | Trivial |
| 3 | C2 | Gate the "Outranked by" card on `rankedMentions >= 3` and an actual position comparison; rename it when the comparison is unavailable. | Small |
| 4 | C5 | Fall back to `clients.name` in `buildBrandMatchers`; reject alias-less clients at onboarding. | Small |
| 5 | C4 | Pass the prompt text and the client's industry into `_competitor_filter.js`'s prompt instead of a brand-centred snippet. | Small |
| 6 | C3 | Add `ranked: false` to bold/bullet-appended competitors; exclude them from `avgPos` in `competitorFilter.ts`. | Medium |
| 7 | C12 | Log every fail-open branch and record whether the gate ran. Prerequisite for ever closing C4 properly. | Trivial |
| 8 | C8 | Stop case-normalising display names; keep the most frequent original spelling. | Trivial |
| 9 | C7 | Move `dedupeKey` folding to read time in `aggregateCompetitors`. | Small |
| 10 | C9 | Delete `competitorType` from the company path; classify individuals with the existing Haiku call or not at all. | Small |
| 11 | C10 | Rewrite the grok source line to describe web search; remove the causal superlative from gemini. | Trivial |
| 12 | C15 | Add `.neq('status','error')` to the `Competitors.tsx` query. | Trivial |
| 13 | C13 | Use `buildAliasRegex` for seed names; delete the catering-specific strip regex. | Small |
| 14 | C14 | Move the slash rejection into `isCompanyName` so both extraction paths share it. | Trivial |
| 15 | C11 | Either rename the impact badges so they stop claiming measurement, or derive impact from prompts-affected times engine share. | Small |
| 16 | C16 | Differentiate the trend chart's competitor series. Latent until a client has two periods. | Small |
| 17 | C17 | Correct the renumbering comment in `_competitor_filter.js`. Do not change the code. | Trivial |

Items 1 through 5 are all small and all remove something currently wrong on a live customer
screen. Item 6 is the one that requires a decision about the stored schema and should not be
rushed into the same change set.
