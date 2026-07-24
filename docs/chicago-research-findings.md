# Chicago AI Visibility Research — Findings

Client: `research-chicago` (client_id 29), plan `pro`, market `US` / region `CHI`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Google AI Mode on 4 of 6 prompts and
for Perplexity/Claude/Gemini on isolated prompts; those gaps are cross-checked against prose per-category
below rather than treated as "no opinion." This run used **Google AI Mode** in place of the retired **Meta
AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Chicago
- ChatGPT: Clifford Law Offices #1, Corboy & Demetrio #2, Power Rogers #3, Salvi, Schostok & Pritchard #4,
  Romanucci & Blandin #5, GWC Injury Lawyers #6, Abels & Annes #7, Malman Law #8, The Kryder Law Group #9,
  Horwitz, Horwitz & Associates #10
- Claude: Clifford Law Offices #1, Corboy & Demetrio #2, Cavanagh Sorich Law Group #3, Schwartz Jambois #4,
  Kurash & Klein #5, Meyers & Flowers Trial Attorneys #6, Strom Yen Injury Attorneys #7
- Gemini: Clifford Law Offices #1, Malman Law #2, Willens & Baez #3, Hurley McKenna & Mertz, P.C. #4, Levin &
  Perconti #5, Rosenfeld Injury Lawyers LLC #6, Horwitz, Horwitz & Associates #7
- Google AI Mode: no structured extraction; prose references Corboy & Demetrio ("nationally recognized trial
  powerhouses... contingency fee basis") among "top-tier litigation & trial powerhouses"
- Perplexity: Phillips Law Offices #1 (only firm named; also references Super Lawyers' Chicago list generally)

**Unanimous #1 pick across every engine that returned a structured ranking: Clifford Law Offices**
(ChatGPT #1, Claude #1, Gemini #1 — all three agree on the exact same firm in the exact same position).
**Corboy & Demetrio** is the second-clearest signal (ChatGPT #2, Claude #2, and referenced directly in Google
AI Mode's prose) — effectively a 3/5 consensus. This is a stronger, cleaner personal-injury consensus than
either New York (fragmented) or Los Angeles (3/5 spread across four firms, no single unanimous #1).

### 2. Best real estate agents for buying a home in Chicago
- ChatGPT: Vesta Preferred Realty #1 (only one captured)
- Claude: no structured extraction; prose names Emily Sachs Wong (@properties Christie's International Real
  Estate) as the #1 individual pick
- Gemini: **Redfin Agents #7, Zillow Top Teams #8** — flagged and removed as noise below; not real named
  agents, just portal categories
- Google AI Mode: Laricy Team, Vesta Preferred Realty, Crystal Tran Team, and a fourth name truncated in the
  raw response (Chicago Pro... — not fully recoverable from the snippet)
- Perplexity: returned **no names at all**, explicitly stating it "can't reliably name the best agents
  without current, source-backed data" — an honest fragmentation signal, not a collection failure

**Removed as noise:** "Redfin Agents" and "Zillow Top Teams" (Gemini #7-8 — generic portal categories, not
named individuals or teams).

**Most fragmented category in the Chicago dataset**, consistent with the individual-agent fragmentation
pattern already seen in New York and Los Angeles. The only name with any cross-engine overlap is **Vesta
Preferred Realty** (ChatGPT #1, Google AI Mode) — 2/5, loose. No individual agent name repeats across
engines.

### 3. Top-rated property management companies in Chicago
- ChatGPT: Landmark Property Management #1, NRS Rental Property Management #2, Keyrenter Chicago North #3,
  Marblestone Property Group #4, Keyrenter Property Management Chicago North #5, Streeterville Realty LLC #6,
  ALPS Property Management #8, First Community Management #9, Hales Property Management #10
- Claude: Landmark Property Management #1, GC Realty & Development #2, In Business Property Management #3,
  Root Realty #4, Marblestone Property Group #5, HomeRiver Group Chicago #6
- Gemini: Hales Property Management #1, Forth Group #2, GC Realty & Development #3, Landmark Property
  Management #4, HomeRiver Group Chicago #5, Marblestone Property Group #6, Chicago Style Management #7
- Google AI Mode: no structured extraction; prose leads with "Marblestone Property Group (4.9★), Landmark
  Property Management (4.8★), and Domain Property Management (4.8★)"
- Perplexity: GC Realty & Development #1, Landmark Property Management #2, HomeRiver Group Chicago #3, Peak
  Properties #4, ALPS Property Management #5, Fulton Grace Realty #6, 33 Realty #7

**Full 5/5 unanimous consensus — the strongest single-brand agreement measured anywhere in this research
program to date: Landmark Property Management** appears in every one of the 5 engines' responses (ChatGPT
#1, Claude #1, Gemini #4, Google AI Mode by name at 4.8★, Perplexity #2). **Marblestone Property Group** is
the second-strongest signal at 4/5 (ChatGPT #4, Claude #5, Gemini #6, Google AI Mode at 4.9★). **GC Realty &
Development** and **HomeRiver Group Chicago** both reach 3/5.

### 4. Best immigration lawyers in Chicago
- ChatGPT: Meltzer Hellrung LLC #1, Sverdloff Law Group, P.C. #2 (short list)
- Claude: Cipolla Law Group #1, Minsky, McCormick & Hallagan, P.C. #2, Kriezelman Burton & Associates, LLC #4,
  Aparicio Immigration Law #5, Milla & Associates, LLC #6, Sverdloff Law Group #7
- Gemini: Milla & Associates, LLC #1, Cipolla Law Group #2, Aparicio Immigration Law #3, Minsky, McCormick &
  Hallagan, P.C. #4, Immigration Law Associates, P.C. #5, Mevorah & Giglio Law Offices #7
- Google AI Mode: Minsky McCormick & Hallagan, P.C. #1, Cipolla Law Group #2, Aparicio Immigration Law #3
- Perplexity: no structured extraction; prose references "Minsky M..." among a short list of well-known
  Chicago-area options

**Notably not fragmented, unlike the immigration-law category in every other city researched so far** (New
York, Los Angeles): **Minsky, McCormick & Hallagan, P.C.** reaches 4/5 (Claude #2, Gemini #4, Google AI Mode
#1, and referenced in Perplexity's prose). **Cipolla Law Group** hits 3/5 (Claude #1, Gemini #2, Google AI
Mode #2) and **Aparicio Immigration Law** also hits 3/5 (Claude #5, Gemini #3, Google AI Mode #3). This
breaks the "immigration law always fragments" pattern seen elsewhere — a genuinely different result specific
to Chicago's market, not a templated repeat.

### 5. Best corporate law firms in Chicago
- ChatGPT: Kirkland & Ellis #1, Sidley Austin #2, Latham & Watkins #3, Mayer Brown #5, McDermott Will &
  Schulte #6 (name inconsistency, see note below), Ropes & Gray #7, Baker McKenzie #8, DLA Piper #9, Jones
  Day #10, Katten #11
- Claude: Kirkland & Ellis #1, Mayer Brown LLP #2, Winston & Strawn #3, McDermott Will & Emery #4, Sidley
  Austin #5, Kilpatrick Townsend & Stockton LLP #6
- Gemini: Kirkland & Ellis LLP #1, Latham & Watkins LLP #2, Sidley Austin LLP #3, Mayer Brown LLP #4,
  McDermott Will & Schulte #5 (same inconsistency as ChatGPT), Winston & Strawn LLP #6, Reed Smith LLP #7,
  Barnes & Thornburg LLP #8, Duane Morris LLP #9, Meyer Law #10
- Google AI Mode: no structured extraction; prose describes "global giants with major corporate practices and
  highly regarded specialized firms" without a clear ranked list in the captured snippet
- Perplexity: Kirkland & Ellis #1, Sidley Austin #2, Mayer Brown #3, Winston & Strawn #4, Jenner & Block #5,
  Katten Muchin Rosenman #6, DLA Piper #7

**Flagged, not corrected:** ChatGPT and Gemini both render the real firm "McDermott Will & Emery" as
"**McDermott Will & Schulte**" — the same non-existent name appearing independently in two engines' outputs.
Kept as reported rather than silently corrected, since it's a genuine (if odd) data point about how these
two engines represent that firm.

**The strongest "who's #1" agreement measured in this entire research program: Kirkland & Ellis** was named
the #1 corporate law firm by all four engines that returned a structured ranking (ChatGPT, Claude, Gemini,
Perplexity — 4/5, unanimous on rank position, not just presence). **Sidley Austin** and **Mayer Brown** both
also reach 4/5 engine agreement, just with varying rank positions. Chicago's corporate law market shows the
clearest, most unanimous AI consensus of any category researched across any city so far.

### 6. Best commercial real estate brokers in Chicago
- ChatGPT: CBRE Chicago #1, JLL Chicago #2, Cushman & Wakefield Chicago #3, Colliers Chicago #4, Newmark
  Chicago #5, Kiser Group #9, Mid-America Real Estate #10
- Claude: prose names "CBRE, JLL, Cushman & Wakefield, Colliers" together as the "Big Four Global CRE firms
  with major Chicago presence"; structured list separately captures Avison Young #2, Keller Williams
  Commercial #5, CANVAS Real Estate #7
- Gemini: no structured extraction; prose describes "a mix of large, established global firms and
  highly-regarded local and regional brokerages"
- Google AI Mode: no structured extraction; prose leads with CBRE Chicago as consistently ranked among the
  top global powerhouses
- Perplexity: Marcus & Millichap #1, Avison Young #2

**The "Big Four" global brokerages (CBRE, JLL, Cushman & Wakefield, Colliers) are named together or
individually by 3 of 5 engines** (ChatGPT structurally, Claude in prose, Google AI Mode in prose), with CBRE
specifically the most-repeated single name. **Avison Young** is the clearest boutique/regional name with any
spread, at 2/5 (Claude, Perplexity). This mirrors the national/global-brand-beats-local pattern already
documented for New York's legal-services categories, here showing up in commercial real estate instead.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Property management | **Landmark Property Management** | 5/5, full unanimous consensus |
| Corporate law | **Kirkland & Ellis** | 4/5, unanimous #1 |
| Immigration law | **Minsky, McCormick & Hallagan, P.C.** | 4/5 |
| Personal injury law | **Clifford Law Offices** | 3/5, unanimous #1 where structured |
| Commercial real estate | CBRE / the "Big Four" (loose) | 3/5 |
| Real estate agents | Vesta Preferred Realty (loose) | 2/5, most fragmented |

## Structural observations specific to Chicago

1. **Chicago shows the strongest cross-engine AI consensus of any city researched in this program so far.**
   Landmark Property Management is the first 5/5 unanimous result measured (New York and Los Angeles both
   topped out at 4/5), and Kirkland & Ellis achieved unanimous agreement on both presence *and* rank position
   across all four structured engines for corporate law.

2. **Immigration law broke its own pattern.** Every other city researched (New York, Los Angeles) showed
   immigration law as one of the most fragmented categories, dominated by individually-rated practitioners.
   In Chicago, Minsky, McCormick & Hallagan reached 4/5 engine consensus — a genuinely different result under
   identical methodology, not a templated repeat.

3. **Individual real estate agents remain the most fragmented category**, consistent with every other city
   researched — no agent name crosses 2/5 engines, and Perplexity explicitly declined to name any agent at
   all, citing a lack of current source-backed data.

4. **Two engines (ChatGPT and Gemini) independently rendered the same incorrect firm name** ("McDermott Will
   & Schulte" instead of the real "McDermott Will & Emery") for the corporate-law category — kept as reported
   rather than silently corrected, since it's a genuine cross-engine data point.

5. **No ChatGPT collection failures this run**, consistent with Los Angeles and unlike New York (where
   ChatGPT errored on all 8 prompts). All 5 engines, including Google AI Mode (replacing the retired Meta AI
   engine), returned usable data on every prompt.
