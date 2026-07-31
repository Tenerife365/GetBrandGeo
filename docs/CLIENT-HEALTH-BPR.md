# Client Health & Value Review — Bucate pe Roate (`bpr`, clients.id = 1)

**Reviewed:** 2026-07-11 · `Master-ClientHealth`, first pass
**Plan:** `managed` · **Onboarded:** 2026-07-02 · **Market:** RO / Bucharest (`RO`/`B`)
**Data reviewed:** all 36 `ai_results` rows (33 `ok`, 3 `error`), 3 prompts, 5 collection runs, 2026-07-07 → 2026-07-09
**Nothing was changed.** This is a read-only review. Every fix below is flagged to its owning chat.

---

## 0. Verdict in one paragraph

**The signal BrandGEO is measuring for BpR is real, accurate, and favourable — but what the dashboard
*shows* BpR is materially wrong, and wrong in the direction that understates their success.** On the two
well-formed prompts, BpR genuinely ranks #1–#2 on ChatGPT, Claude and Perplexity, and the engines cite
real, verifiable facts pulled from BpR's own website (500 m² kitchen, FSSC 22000, 4,100 portions/day at
Arena Națională). That is a genuine, defensible product win. But the client's configuration lists **BpR's
own premium sub-brand, Carte Blanche, as a competitor** — so when Perplexity named Carte Blanche as its
**#1 recommendation**, the platform recorded it as *"brand not mentioned, competitor won."* BpR is being
told it lost a query it won outright. Add a third of the prompt set that is mis-scoped (it retrieves
venues, not caterers), an engine (Gemini) with zero data ever, a competitor leaderboard whose top entry is
a measurement artifact, and two dashboard pages that compute the headline score from different row sets —
and the honest conclusion is: **BrandGEO is delivering real value to BpR that BrandGEO cannot currently
prove, because its own presentation layer is corrupting the evidence.** Roughly a day of config and
extraction work would flip this from "not defensible in a client conversation" to "genuinely
demonstrable." Nothing found here is architectural; it is all fixable.

**Health: 🟠 At risk — real underlying value, unreliable delivery.** Not churn-imminent (the client is
visibly engaged, see §5.3), but not yet worth €900/mo on the evidence the dashboard currently presents.

---

## 1. What the platform currently tells BpR

| | |
|---|---|
| Prompts tracked | **3** (2 of them near-duplicates — see §3.1) |
| Engines with any data | ChatGPT, Claude, Perplexity, Meta — **Gemini: zero rows, ever** |
| Rows collected | 36 total / 33 `ok` / 3 `quota_exceeded` |
| Collection runs | 5, all manual |
| Last collection | **2026-07-09 19:43 — 2 days stale at time of review** |
| Raw response text stored | **0 of 36 rows** |
| Mention rate (`ok` rows) | 23/33 = **70%** — ChatGPT 9/10, Claude 12/18, Perplexity 2/3, Meta 0/2 |
| Recommendations on file | **None — they are never persisted** (§6) |

**Headline AI Visibility Score:** Overview shows **~78**; the AI Visibility page shows **~80**. They are
supposed to be identical. See §4.6 — this is a real bug, not rounding.

---

## 2. Data-quality timeline (the §13.2 caveat, applied)

Every BpR row predates at least one accuracy fix. Mapping `checked_at` against the ship dates in
CLAUDE.md §8.5–§8.11:

| Run (`checked_at`) | Rows | Trustworthy? |
|---|---|---|
| 2026-07-07 14:25–14:26 | 6 | ❌ Pre-everything. Sentiment scored on the whole response; substring mention matching; sentence-index positions. **3 of these are `quota_exceeded` errors.** |
| 2026-07-08 16:46–16:48 | 5 | ❌ Same. Row 1544's `sentiment: negative` is almost certainly the pre-fix whole-document keyword scan misfiring. |
| 2026-07-09 10:09–10:10 | 5 | ⚠️ Partial. Sentiment clause-scoping (step 2) landing around here; RO lexicon (2b) not yet. |
| 2026-07-09 11:14–11:47 | 10 | ⚠️ Steps 2/2b/3 in. Position units (4) and Claude truncation (5) landing. |
| 2026-07-09 19:41–19:43 | 10 | ✅ **The only broadly trustworthy run.** Steps 2–5 all deployed. |

**Two hard consequences:**

1. **No BpR row has `response_text`.** The column shipped 2026-07-10 (§8.11 round 2); BpR has not been
   collected since. **Independent verification against raw engine output is impossible for every existing
   BpR row.** Everything in §4 below was verified against the ~300-char `response_snippet` instead — enough
   to prove the bugs, but a Force Refresh is required before any BpR number is defensible to the client.
2. **None of the §8.10 / §8.11 competitor-extraction fixes have ever touched BpR's data** — and round 3 is
   still uncommitted. BpR's Competitors page is showing pre-fix output today.

---

## 3. Configuration errors — highest value, fixable today

### 3.1 🔴 Carte Blanche is BpR's own brand, configured as a competitor

`clients.known_competitors` contains **"Carte Blanche"**. `brand_aliases` is
`["bucate pe roate", "bucateperoate", "bpr"]` — Carte Blanche is **not** in it.

**Carte Blanche is Bucate pe Roate's own premium sub-brand.** Verified directly on the client's website:

> "**Bucate pe Roate / Carte Blanche** s-a remarcat prin eleganță… **Sub divizia brandului nostru premium,
> Carte Blanche**, colaboram cu unele dintre cele mai prestigioase branduri internaționale: BVLGARI, Zenith,
> Lancôme, Zegna…"
> — [bucateperoate.ro](https://www.bucateperoate.ro/bucate-pe-roate-carte-blanche-catering-de-lux-pentru-evenimente-cu-stil/), which also links `carteblanche.ro` from its own footer.

**The consequence is not theoretical. Row 1588** (Perplexity, prompt 177, 2026-07-09 19:42) reads:

> "Pentru un eveniment corporate de 500 persoane cu invitați C-level… **cea mai recomandată opțiune de
> catering este Carte Blanche** (Luxury Catering & Events)"

Perplexity ranked BpR's own brand **first**. The platform stored `brand_mentioned = false` and filed
Carte Blanche as a **competitor** (5 appearances, all via the known-competitor prose scan). **The dashboard
is telling a paying client they lost a query they won at position #1.** This single misconfiguration
simultaneously suppresses the mention rate, deflates Reach/Consistency, and inflates the competitor radar.

**Fix:** move `Carte Blanche` out of `known_competitors` and into `brand_aliases` (add `carteblanche.ro`
handling too). One SQL statement — see §8.

### 3.2 🟠 Two of three prompts are the same question

| id | text |
|---|---|
| 172 | `CE FIRMA SA FOLOSESC PENTRU UN CATERING DE PESTE 1000 PERS IN BUCURESTI?` |
| 173 | `ce firma de catering ar fi potrivita pentru un eveniment de peste 1000 de persoane in Bucuresti?` |

Same buyer question, one in caps. A Managed client is therefore tracking **two distinct questions**, not
three — and the score's Consistency dimension (`% of prompts where ≥60% of engines mention you`) is being
computed over an effective n of 2.

### 3.3 🟠 Prompt 177 is mis-scoped — it retrieves venues, not caterers

> `Am nevoie sa organizez un eveniment in Bucuresti… 500 persoane… invitati C level… servicii impecabile de catering. Da-mi sugestii`

Because it leads with *"organize an event"*, every engine answers with **venues**: ZOOMA, Crowne Plaza,
Hotel CARO, Domeniile Săftica, Palatul Bragadiru, Le Chateau, Toya Concept, Aurrum Palace, JW Marriott,
InterContinental. BpR is recorded absent on this prompt in **every engine, in every run, without exception**
— presented to the client as a total visibility failure on their highest-value segment (C-level, 500 pax).

It is not a visibility failure. It is a prompt-design artifact. Two harms follow:

- **The client is shown a false weakness** on their most commercially important query.
- **The competitor radar is polluted with venues** — businesses BpR does not compete with and in several
  cases *partners with* (their own site has a "Parteneri si Locatii" page).

**Fix:** rewrite 177 to ask for a catering supplier, not event organisation. E.g. *"Ce firmă de catering
recomanzi pentru un eveniment corporate de 500 de persoane cu invitați C-level în București?"* Keep the old
one only if BpR genuinely wants to compete for the venue-selection query.

---

## 4. Pipeline defects found in BpR's live data

### 4.1 🔴 Gemini has never returned a single row

Managed includes Gemini (`PLAN_ENGINES.managed`). BpR has **zero Gemini rows — not even an error row**.
The engine renders on the dashboard, the client is paying for it, and it has never produced a data point.
No error row means this is a silent failure, consistent with §2.2 (a Netlify timeout kills the process
before the error row is written). **Reach is permanently capped at 3/5 engines**, dragging the headline
score down by ~6 points for a reason that has nothing to do with BpR's visibility.

### 4.2 🔴 Position detection breaks on a markdown H3 + emoji

Verified by direct comparison of three rows containing the *same* content shape:

| row | line the brand appears on | stored position |
|---|---|---|
| 1592 | `## 🥇 1. **Bucate pe Roate**` | **1** ✅ |
| 1581 | `## 🥇 1. BUCATE PE ROATE` | **1** ✅ |
| 1586 | `### 🥇 1. **Bucate pe Roate**` | **null** ❌ |

Root cause: `extractTopRankedResults`'s regex allows `[^\d\n]{0,6}` before the rank digit. `## 🥇 ` is
exactly 6 UTF-16 units (2 hashes + space + 2-unit emoji + space); `### 🥇 ` is **7** and fails to match.
Row 1586 is literally the #1 recommendation and is stored as *mentioned but unranked*. Any engine that
formats its list under an H3 silently loses its ranks.

### 4.3 🟠 Sentiment is heading-scoped and brittle

Row 1586: `### 🥇 1. **Bucate pe Roate**` … then, **as a separate sentence**, *"Aceasta este probabil cea mai
bună opțiune"* ("this is probably the best option"). Scored **neutral**. The clause-scoping fix (§8.6) only
looks at segments containing a brand alias — the praise sits in the *next* sentence, so it is excluded.
Row 1592 scored **positive** for identical praise only because `*(Recomandat #1…)*` happened to sit inside
the same heading line as the brand name. **Same praise, different markdown, opposite sentiment.** The RO
lexicon expansion (§8.6b) can't help here — the words never enter the scored window.

### 4.4 🟡 Competitor name variants — partly handled, partly not (CORRECTED)

**An earlier draft of this review claimed the leaderboard fails to case-fold. That was wrong.**
`Competitors.tsx:103` uses `rawName.toLowerCase().trim()` as the merge key, so `Premier Catering & Events`
(11) and `PREMIER CATERING & EVENTS` (4) **do** correctly merge to **15**. Same for Royal (8) and Maia (7).
`avgPos` also correctly excludes the `99` sentinel (line 122). Credit where due.

What is **not** merged — anything where the *decoration* differs, because it changes the key:

| entity | separate keys created |
|---|---|
| ZOOMA | `zooma`, `zooma events`, `zooma events & more`, `zooma / city grill group`, `🌿 zooma paradisul verde` |
| Crowne Plaza | `crowne plaza bucharest`, `🏨 crowne plaza bucharest`, `crowne plaza bucharest ⭐⭐⭐⭐⭐`, `crowne plaza bucharest catering` |
| Flavours | `flavours`, `flavours catering`, `flavours / stradale` |
| Royal Catering | + `royal catering – backup / ofertă comparativă` split off |

**Most of this is already fixed for future rows** — `cleanCandidateName` (§8.11 round 2) strips emoji and
star/medal residue at extraction time. BpR's data simply predates it. **A Force Refresh resolves the emoji
variants without any new code.** What remains after that (`flavours` vs `flavours catering`) is genuine
entity resolution — low priority, not worth building for now.

**Net effect on BpR's actual leaderboard today:** Premier 15, Elegant Catering 14, Royal 8, Maia 7, Zooma 6.
The ordering is roughly right — the real problem is the *second* entry, below.

### 4.5 🟠 The #1 "competitor" on BpR's radar is a measurement artifact

**Elegant Catering: 14 mentions — all 14 at `pos: 99`.** It has never once been *ranked* by any engine. The
`99` sentinel means it was matched in prose by `scanForKnownCompetitors` — i.e. it appears only because BpR
seeded it into `known_competitors` themselves. Same pattern: Flavours (3/3 at 99), Fratelli (1/1), Carte
Blanche (5/5 — and it isn't a competitor at all, §3.1).

**The mechanism:** `Competitors.tsx:128` sorts by `totalMentions`, and `totalMentions` counts `pos:99` prose
matches identically to genuinely-ranked appearances. (`avgPos` *does* correctly exclude 99s — line 122 — so
Elegant Catering shows **14 mentions and no average position at all**, which is exactly the tell.) It lands
at **#2 on BpR's leaderboard**, above Royal (8), Maia (7) and Zooma (6) — all of which engines actually rank.

The sort key rewards being on the client's own seed list. (§8.4 flagged this skew; here is the live instance.)

### 4.6 🔴 Overview and AI Visibility compute the headline score from different rows

CLAUDE.md §7.4 Phase 3.1 states that extracting `aiVisibilityScore.ts` means the two pages are *"guaranteed
to show the identical score… permanently."* **They are not**, because the shared function was extracted but
the **inputs** were not.

| | `Dashboard.tsx` (Overview) | `AIVisibility.tsx` |
|---|---|---|
| score query | line 118–120 — **no `.order()`, no status filter** | line 241 — `.order('checked_at', desc)` |
| error rows | **counted as real rows** (`brand_mentioned=false`) | **explicitly excluded** (line 256) |
| row kept per (prompt, engine) | whichever Postgres returns first — **undefined** | newest |

`buildScoreResultMap` is first-wins (line 125: `if (!llmMap.has(r.llm)) llmMap.set(...)`).

Two distinct bugs:

1. **Deterministic:** Overview counts BpR's 3 `quota_exceeded` rows as genuine non-mentions. Recognition is
   computed over 11 rows on Overview vs 10 on AI Visibility → **~78 vs ~80 today.** This directly violates
   CLAUDE.md §4.8's own rule (*"use `.neq('status','error')` on `ai_results` queries that should exclude
   API-failure rows"*). `Dashboard.tsx` does not contain the string `status` anywhere — its main KPI/chart
   query has the same hole.
2. **Non-deterministic:** with no `ORDER BY`, Postgres makes no ordering guarantee. I ran Overview's exact
   query and it happened to return newest-first — but a different plan or a re-clustered table returns
   oldest-first, in which case Overview would build its score from BpR's **2026-07-07/08 pre-fix rows
   (including the error rows) and display ≈65.** **The client's headline number depends on undefined
   database row ordering.**

### 4.7 🟡 Seven non-companies are on BpR's competitor list

`Plan logistic` · `Degustare înainte de contract` · `Transport și păstrare mâncare` ·
`Autorizații DSVSA / siguranță alimentară` · `Număr de ospătari / puncte de servire` ·
`Recomandări Top de Catering Impecabil` · `Sugestii de Pregătire și Costuri`

These are checklist items and section headings from the engines' own answers. **This is exactly what §8.11
round 3 fixes — and round 3 is code-complete but not committed.** Committing it plus a Force Refresh clears
these. (Note: the RO-language headings in rows 1588/1571 confirm §8.10's documented "non-EN/RO how-to lists
remain a gap" — worth checking round 3 catches `Recomandări Top de Catering Impecabil`, which has no leading
imperative verb.)

---

## 5. Is BrandGEO actually delivering value? (the part that argues *for* the product)

It would be dishonest to lead with the bugs and bury this.

### 5.1 The engines' picture of BpR matches reality — the measurement is sound at the mention level

Independently verified: BpR is a genuinely strong operator — S.C. Bucateperoate S.R.L. (J40/9146/2003),
50+ staff, 500 m² kitchen, FSSC 22000 (GFSI-recognised), ISO 9001/22000/HACCP, *Catering Company of the
Year* (Lux Life), 5+ years supplying the Gopo Awards, Carte Blanche clients including BVLGARI, Zegna and
Lancôme, and a Romanian Wikipedia page. **An AI engine ranking them #1–#2 for large Bucharest catering is
correct, not an artifact.** Every competitor name the engines produced is a real Bucharest caterer
(Privileg, Supa Dupa, In Bucate, Pastel Lab, Premier, Maia — all verified to exist). The engines are not
hallucinating; **only the extraction layer is failing.** That is a much better problem to have.

### 5.2 BpR's own content is demonstrably being retrieved and cited

The engines quote specifics traceable directly to bucateperoate.ro:

- Perplexity: *"capacitatea confirmată de a deservi peste **18.000 de invitați într-o singură zi**"*
- ChatGPT: *"în iunie 2026 au livrat **4.100 de porții/zi** la Arena Națională… bucătărie proprie de peste
  **500 mp**, certificare **FSSC 22000**"*

**This is the core BrandGEO thesis working, observably, for a real client.** It is also the single best
piece of case-study material this project has.

### 5.3 The client appears to be acting on GEO advice

BpR's blog has published, since onboarding (2026-07-02):

- *"Ce criterii trebuie să urmăresc când aleg o firmă de catering corporate?"* — **09/07/2026**
- *"Cum compari ofertele firmelor de catering pentru conferințe?"* — **07/07/2026**

These are buyer-question-shaped articles targeting exactly the prompts being tracked. That is textbook GEO
execution, published days after onboarding. **Whether BrandGEO caused it cannot be proven** — recommendations
are never persisted (§6) — but the timing is strongly suggestive and the client is clearly engaged.

### 5.4 One genuine, actionable finding the platform surfaced correctly

**Meta AI is BpR's real gap: 0 mentions out of 2.** Meta's answers name *Divine*, *Gault&Millau* and
*Catering Art* instead. Unlike ChatGPT/Claude/Perplexity, Meta answers from training data with no live
retrieval — so BpR's excellent website is invisible to it. That is a true, correctly-detected weakness and
exactly the kind of insight a Managed client should be paying for.

---

## 6. The recommendations engine

- **Recommendations are never persisted.** There is no `recommendations` table;
  `generate-recommendations.js` calls Claude Haiku on demand and returns JSON to the browser. **Nothing is
  stored.** So: no record of what BpR was ever told, no way to correlate advice with a visibility change, no
  audit trail for a Managed engagement whose *entire deliverable* is the advice. For a €900/mo done-for-you
  tier this is the most significant product gap in this review after §3.1.
- **It is fed the polluted competitor list.** `top_competitors` comes from the same extraction covered in
  §4.4/§4.5/§4.7 — so the model is being told BpR's top competitors include *"Transport și păstrare mâncare"*
  and *Elegant Catering* (a never-ranked seed artifact) and *Carte Blanche* (BpR itself). **Garbage in.**
- **The prompt primes fabrication.** Line 106 instructs by example: *"create a Trustpilot profile because
  {competitor} appears in ChatGPT responses immediately after their Trustpilot rating is cited."* It hands
  the model a template for a causal "why" it has no evidence for. §8.4 flagged this; confirmed in code.

---

## 7. Trend — there isn't one, and the dashboard shouldn't imply there is

Mention rate by run: **67% → 80% → 60% → 80% → 60%.**

This looks like volatility. It is not. The swings track **which engines happened to run**, not BpR's
visibility: the 07-09 19:00 run was the first to include Meta and Perplexity, and Meta's two non-mentions
alone pulled the rate down. With 3 prompts, 5 runs, 9 days, an inconsistent engine mix, and every run before
the last carrying known measurement bugs, **no trend claim is supportable in either direction.**

Compounding it: **collection is manual.** There is no scheduler (§2.8). BpR's data was 2 days stale at
review. A "managed" client's dashboard only updates when somebody remembers to click a button.

---

## 8. Recommended actions, by owner

### For Constantin — do these before the next BpR conversation

**1. Fix the Carte Blanche misconfiguration (§3.1) — highest value, 1 minute.**
```sql
update clients
set brand_aliases    = array['bucate pe roate','bucateperoate','bpr','carte blanche','carteblanche'],
    known_competitors = array_remove(known_competitors, 'Carte Blanche')
where id = 1;
```

**2. Fix the mis-scoped prompt (§3.3) and de-duplicate (§3.2).** Rewrite prompt 177 to ask for a *catering
supplier*, and either differentiate or retire prompt 172 (it duplicates 173). Then add prompts — 3 is far
too thin for a Managed client. Their own blog titles are a ready-made prompt list.

**3. Force Refresh BpR** once (1) and (2) are done, and once §8.11 round 3 is committed. This is the step
that makes BpR's data defensible: it populates `response_text` (currently 0/36 rows — nothing can be
independently verified without it) and re-runs every row through the fixed extraction.

**4. Investigate why Gemini has never collected for BpR (§4.1)** — zero rows, zero error rows, for an engine
on their plan.

**5. Expect ChatGPT to fail.** BpR already has 3 `quota_exceeded` rows, and `STATE-OF-PRODUCT.md` records
the OpenAI key as out of quota since 2026-07-07. Top up before the refresh or the run comes back with
ChatGPT missing.

### → `Master-DashboardDesign` (`brandgeo-dashboard/src/`)

- **§4.6 — the score divergence.** Add `.neq('status','error')` **and** `.order('checked_at', {ascending:
  false})` to `Dashboard.tsx`'s score query (line 118–120) and to its main query (line 108–113, which has the
  same hole — the file never references `status`). Better: change `buildScoreResultMap` to be
  explicitly newest-wins rather than relying on caller ordering, so the guarantee §7.4 Phase 3.1 claims is
  actually enforced in the shared module instead of assumed at two call sites.
- **§6 — persist recommendations.** A `recommendations` table (client_id, generated_at, payload, dismissed/
  actioned) would make the Managed deliverable auditable and finally make "did they act on it, and did it
  move?" an answerable question.

### → `Master-Reasoning` (`netlify/functions/_analysis.js`)

- **§4.2 — position regex.** `[^\d\n]{0,6}` is too tight for `### 🥇 1.`; widen it and/or strip markdown
  heading/emoji prefixes before rank matching. BpR's #1 rankings are being dropped on the floor.
- **§4.3 — sentiment window.** Clause-scoping is too narrow when the brand is in a heading and the praise is
  in the following sentence. Consider extending the brand context to the sentence(s) immediately following a
  heading that names the brand.
- **§4.7 — commit round 3.** It is code-complete and uncommitted, and BpR's live data shows exactly the false
  positives it targets. Check it catches noun-initial RO headings (`Recomandări Top de Catering Impecabil`) —
  it has no leading imperative verb, so the round-3 rules may not fire on it.
- **§4.4 — no action needed.** Case-folding already works; `cleanCandidateName` (round 2) already strips
  emoji. A Force Refresh resolves BpR's variants without new code.

### → `Master-DashboardDesign` (second item — `Competitors.tsx`)

- **§4.5 — `pos: 99` in the sort key.** `Competitors.tsx:128` sorts by `totalMentions`, which counts
  never-ranked prose matches (`pos:99`) equally with real rankings — putting a client's own seed name at #2.
  Either exclude 99s from the sort key, or split "ranked by engines" from "mentioned in prose" in the UI.
  `avgPos` already handles 99s correctly (line 122) — copy that treatment into the sort.

### → `Master-Writer`

**Yes — BpR is worth a case study, but not yet.** §5.1/§5.2 are strong, verifiable material (a real brand,
real awards, engines citing their real content, #1–#2 rankings). **Do not write it until the Force Refresh in
step 3 is done** — the current numbers would not survive a prospect checking them, and the Carte Blanche bug
means the "before" baseline is wrong. After the refresh, this is the best case-study candidate the project
has.

---

## 9. Reusable checklist — reviewing any Managed+ client

Run this end-to-end. It is ordered so the cheapest, highest-yield checks come first — §A found the single
biggest issue in this review in about two minutes.

### A. Configuration sanity (do this first — it invalidates everything downstream if wrong)

- [ ] **Read `brand_aliases` and `known_competitors` side by side, then look up every name.** Sub-brands,
      trading names, parent companies, product lines, acquired brands, common misspellings, the domain with
      and without TLD. **Is anything in `known_competitors` actually owned by the client?** (This is the BpR
      trap. It silently inverts wins into losses.)
- [ ] **Read each prompt out loud and ask: does this retrieve the client's category?** Paste it into an engine
      if unsure. A prompt that returns venues when the client sells catering will report a permanent 0% that
      is not a visibility problem. Check the extracted competitors — **if they're not the client's
      competitors, the prompt is mis-scoped.**
- [ ] **Are any prompts duplicates of each other?** Check the effective n, not the row count.
- [ ] **Is the prompt count remotely appropriate for the plan?** (BpR: 3, on Managed.)

### B. Coverage and freshness

- [ ] **Which plan engines have zero rows?** Zero rows *and* zero error rows = a silent failure, not an
      absence of visibility. It still drags the score down.
- [ ] **How stale is the last collection?** There is no scheduler — check, don't assume.
- [ ] **What's the `status='error'` count, by engine and error_code?** Quota exhaustion is currently a
      live, project-wide risk.
- [ ] **Do the rows have `response_text`?** If not, **you cannot verify anything** — schedule a Force Refresh
      before drawing conclusions.

### C. Data-quality timeline (CLAUDE.md §13.2)

- [ ] **Map every row's `checked_at` against the accuracy-fix ship dates (§8.5–§8.11).** State plainly which
      runs are trustworthy. **Never present a pre-fix row to a client as fact.**
- [ ] **Check for uncommitted fixes** that would change this client's data (round 3 was sitting uncommitted
      during this review, and BpR's data showed exactly the bug it fixes).

### D. Verify the analysis against the raw text — don't trust the derived fields

- [ ] **Read `response_snippet`/`response_text` for every row where `brand_mentioned = false`.** This is
      where false negatives hide, and false negatives are the ones that damage the client relationship —
      you are telling them they lost.
- [ ] **Read them for every `sentiment: neutral` on a mentioned row too.** Under-scored praise is common when
      the brand sits in a heading.
- [ ] **Check `brand_position: null` on mentioned rows.** Is the brand actually ranked #1 in the raw text?
- [ ] **Scan the extracted competitor list for things that are not companies** — checklist items, section
      headings, field labels, venues, the client's own brands.
- [ ] **Check for case/emoji/suffix variants of the same competitor** being counted separately.
- [ ] **Check what share of competitor mentions are `pos: 99`** — those were never ranked, only prose-matched
      from the client's own seed list. A leaderboard topped by a 99-only entry is an artifact.

### E. Cross-check against the real world (independent of the AI engines)

- [ ] **Look the client up properly** — site, reviews, Wikipedia, awards, registry. Is a #1 AI ranking
      *plausible*? If a weak operator is ranking #1, suspect the measurement. If a strong one is invisible,
      suspect the prompt.
- [ ] **Verify a sample of named competitors exist.** If they don't, the engines are hallucinating (a very
      different problem from bad extraction).
- [ ] **Check whether the engines' factual claims trace back to the client's own content.** If they do,
      the client's GEO is working — that is the product's whole thesis, and it is your best proof.
- [ ] **Check the client's site for recent buyer-question content.** Are they acting on the advice?

### F. Trend — and the discipline to say "there isn't one"

- [ ] **Before claiming a trend, check whether the engine mix changed between runs.** A mention-rate drop
      caused by adding a weak engine is not a decline.
- [ ] **Count the runs and the prompts.** With single-digit prompts and a handful of runs, **say "no trend is
      supportable"** rather than narrating noise. This is a credibility issue: a client who is told their
      score "dropped 20 points" and later learns it was an engine-mix artifact will not trust the next number.

### G. Recommendations

- [ ] **Check what the client was actually told.** (Today: impossible — nothing is persisted. Fix that.)
- [ ] **Check what the recommendation engine was *fed*.** If the competitor list is polluted, the advice is
      built on it.
- [ ] **Read the advice for fabricated causal claims** ("X ranks because of their Trustpilot rating").

### H. Verdict

- [ ] **Separate three questions, and answer each explicitly:**
      **(1) Is the underlying signal real?** (Is the brand genuinely visible/invisible?)
      **(2) Is the platform measuring it correctly?** (Config + extraction.)
      **(3) Is the client being shown the truth?** (Presentation + score computation.)
      *These can and do diverge.* BpR is **yes / mostly / no** — and that combination is the most dangerous
      one, because it undersells a client who is actually winning.
- [ ] **State health as: 🟢 delivering · 🟠 real value, unreliable delivery · 🔴 not delivering.**
- [ ] **Flag every fix to its owning chat** — never patch shared product code from a client-review session.
- [ ] **Flag case-study candidacy**, but gate it on the data being clean first.
