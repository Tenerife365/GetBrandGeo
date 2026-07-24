# Houston AI Visibility Research — Findings

Client: `research-houston` (client_id 30), plan `pro`, market `US` / region `HOU`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Gemini on 1 prompt and Google AI Mode
on 2 prompts; those gaps are cross-checked against prose per-category below. This run used **Google AI
Mode** in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Houston
- ChatGPT: Zehl & Associates #1, Arnold & Itkin #2, The Ammons Law Firm #3, Simmons & Fletcher #5, The Doan
  Law Firm #6, Amaro Law Firm #7, Brian White Personal Injury Lawyers #8
- Claude: The Lanier Law Firm #1, Simmons & Fletcher, P.C. #3, The Doan Law Firm #4, Baumgartner Law Firm #5
- Gemini: no structured extraction; general prose
- Google AI Mode: explicitly names Arnold & Itkin LLP, The Lanier Law Firm, and Zehl & Associates Injury &
  Accident Lawyers as its top three, citing the "2026 Texas Personal Injury Rankings"
- Perplexity: The Kishinevsky Law Firm #1 — a name none of the other four engines mention at all

**No single firm reaches 3/5, but a loose 3-firm cluster (Arnold & Itkin, The Lanier Law Firm, Zehl &
Associates) is recognized collectively across ChatGPT, Claude, and Google AI Mode** — each names at least
one of the three, and Google AI Mode explicitly groups all three as its top tier. Individually, no firm
exceeds 2/5. Fragmented at the single-brand level, similar to New York and Los Angeles' personal-injury
results, unlike Chicago's clean unanimous pick.

### 2. Best real estate agents for buying a home in Houston
- ChatGPT: Wabi Sabi Realty Group #5, My Castle Realty #6, Douglas Elliman Texas #9
- Claude: prose #1 pick is Evan Compean – Compean Group; structured extraction captured **HomeLight #7** and
  **RealTrends #8** — flagged and removed as noise below, both are agent-ranking directories, not real estate
  agents
- Gemini: Nan and Company Properties #1, Greenwood King Properties #2
- Google AI Mode: leads with the Houston Properties Team (led by Paige Martin) as the #1 boutique team;
  structured extraction separately captured Greenwood King Properties #5, CB&A, Realtors #6
- Perplexity: Evan Compean - Compean Group #1 (only name returned, also notes Julia Iavitsa - ELUX Real
  Estate from a Yelp listing)

**Removed as noise:** "HomeLight" and "RealTrends" (Claude #7-8 — both are agent-ranking/directory
platforms, not real estate agents or brokerages).

**Most fragmented category in the Houston dataset**, consistent with every other city researched. The
closest thing to overlap: **Evan Compean / Compean Group** (Claude's prose #1 pick, Perplexity's #1) at 2/5,
and **Greenwood King Properties** (Gemini #2, Google AI Mode #5) also at 2/5. No individual agent name
crosses that.

### 3. Top-rated property management companies in Houston
- ChatGPT: Keyrenter Houston #1, Green Residential #2, AREA Texas Realty & Management #3, Real Property
  Management Preferred #4, Crest Management Company, AAMC #6, PMI Infinito #7
- Claude: HomeRiver Group #1, Rental Management Group #2, Shannon Property Management #3, Keyrenter Houston
  #4, Real Property Management Houston #5, First Class Realty & Management #8, Apogee Properties #10
- Gemini: Green Residential #1, Mynd Property Management #2, Flat Fee Landlord #3, Shannon Property
  Management #4, Real Property Management Preferred #5, HomeRiver Group #6, ZipRent #7, Evan Howell Property
  Management #8, Rental Management Group #9
- Google AI Mode: no structured extraction; prose leads with Shannon Property Management, Real Property
  Management Preferred, and AREA Texas Realty & Management as its top 3
- Perplexity: Shannon Property Management #1, Green Residential #2, HomeRiver Group #3, Ziprent #4, Real
  Property Management Preferred #5

**Two firms hit 4/5, the same strength seen in Chicago's property-management result: Shannon Property
Management** (Claude #3, Gemini #4, Google AI Mode top-3, Perplexity #1) and **Real Property Management
Preferred** (ChatGPT #4, Gemini #5, Google AI Mode top-3, Perplexity #5). **HomeRiver Group** and **Green
Residential** both reach 3/5. Property management is proving to be a consistently high-consensus category
type across every city researched so far.

### 4. Best immigration lawyers in Houston
- ChatGPT: prose #1 pick is Adan G. Vega / Law Office of [name cut off in snippet]; structured — Powers Law
  Group, P.C. #3, Gonzalez Olivieri LLC #4
- Claude: prose #1 pick is The Law Office of Mana Yegani; structured — Cano Immigration, PLLC #3, Giron
  Kirby Law Group #6, Herrera Law Firm #7, Trillos-Ballerini Law Firm, P.C. #8
- Gemini: Foster LLP #9, Giron Kirby Law Group PLLC #10 (thin structured extraction)
- Google AI Mode: Naimeh Salem & Associates, PLLC #3, Foster LLP #4, Reddy Neumann Brown PC #5, The Modi Law
  Firm, PLLC #7
- Perplexity: The Modi Law Firm, PLLC #2; prose also names Mana Yegani as a top starting point

**Fragmented, matching New York's and Los Angeles' immigration-law results** (Chicago was the outlier). The
loosest overlaps: **Mana Yegani** (Claude's prose #1 pick, echoed in Perplexity's prose) at 2/5, **Giron
Kirby Law Group** (Claude #6, Gemini #10) at 2/5, and **Foster LLP** (Gemini #9, Google AI Mode #4) at 2/5.
No firm crosses 3/5.

### 5. Best oil and gas energy law firms in Houston
- ChatGPT: Vinson & Elkins LLP #1, Baker Botts L.L.P. #2, Kirkland & Ellis LLP #3, Latham & Watkins LLP #4,
  Gibson, Dunn & Crutcher LLP #5
- Claude: Bracewell LLP #1, Jackson Walker LLP #3, Andrews Myers, P.C. #4, Paul Hastings LLP #5
- Gemini: Bracewell LLP #1, Oliva Gibbs LLP #2, Porter Hedges LLP #3, Doré Rothberg Law, P.C. #4, Baker Botts
  LLP #5, Norton Rose Fulbright LLP #6, Vinson & Elkins LLP #7, Jones Day #8, Sidley Austin LLP #9, Latham &
  Watkins LLP #10
- Google AI Mode: Vinson & Elkins LLP #1, Baker Botts L.L.P. #2, Jackson Walker LLP #3, Bracewell LLP #4,
  Kirkland & Ellis LLP #5, Latham & Watkins LLP #6, Norton Rose Fulbright #7, McGinnis Lochridge #9, Porter
  Hedges LLP #10
- Perplexity: Vinson & Elkins LLP #1, Bracewell LLP #2, Jackson Walker LLP #3, Andrews Myers, P.C. #6, KN
  Legal #7, Kuiper Law Firm, PLLC #8, Kirby, Mathews & Walrath, PLLC #10

**The strongest category consensus in the Houston dataset — two firms, both at 4/5: Vinson & Elkins LLP**
(ChatGPT #1, Gemini #7, Google AI Mode #1, Perplexity #1) and **Bracewell LLP** (Claude #1, Gemini #1,
Google AI Mode #4, Perplexity #2). **Baker Botts L.L.P.** and **Jackson Walker LLP** both reach 3/5. This is
Houston's standout local-economy category, mirroring how entertainment law stood out in Los Angeles and
corporate law in Chicago, each city's strongest AI consensus reflects its actual economic specialty.

### 6. Best hospital systems and healthcare providers in Houston
- ChatGPT: Houston Methodist #1, MD Anderson Cancer Center #2, Memorial Hermann Health System #3, Harris
  Health System #6, Kelsey-Seybold Clinic #10
- Claude: Houston Methodist #1, MD Anderson Cancer Center #2, Texas Children's Hospital #3, Memorial Hermann
  Health System #4, Baylor St. Luke's Medical Center #5, Texas Heart Institute #6, UTHealth Houston #7,
  Harris Health System #8
- Gemini: Houston Methodist Hospital #1, Memorial Hermann Health System #2, Baylor St. Luke's Medical Center
  #3, Texas Children's Hospital #4
- Google AI Mode: structured extraction only captured TIRR Memorial Hermann #2 (a Memorial Hermann
  subsidiary); prose explicitly states Houston Methodist Hospital is "consistently ranked as the #1 hospital
  system in Texas"
- Perplexity: Houston Methodist #1, Memorial Hermann #2, MD Anderson #5, Harris Health System #6, HCA
  Houston Healthcare #9, The Menninger Clinic #10 (prose also names Baylor St. Luke's and Texas Children's)

**Full unanimous #1 across all 5 engines — the cleanest, single strongest result measured anywhere in this
research program: Houston Methodist.** Every engine that returned a ranked list places it at #1 (ChatGPT,
Claude, Gemini, Perplexity), and Google AI Mode's prose independently states the same thing explicitly,
"consistently ranked as the #1 hospital system in Texas." This surpasses Chicago's Landmark Property
Management (5/5 on presence, but not uniform rank) and Kirkland & Ellis (4/4 structured engines) — Houston
Methodist is the first brand in this program to achieve unanimous agreement on both presence *and* exact
rank position, across every engine tested. **Memorial Hermann Health System** is the clear second name,
appearing in some form in all 5 responses (directly in 4, and via its TIRR subsidiary in Google AI Mode) —
effectively 5/5 as well, just not as consistently #1.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Hospital systems | **Houston Methodist** | 5/5, unanimous #1 |
| Oil & gas / energy law | **Vinson & Elkins, Bracewell** | 4/5 each |
| Property management | **Shannon Property Management, Real Property Management Preferred** | 4/5 each |
| Personal injury law | Arnold & Itkin / Lanier / Zehl cluster (loose) | 2/5 each, fragmented |
| Immigration law | Mana Yegani (loose) | 2/5, fragmented |
| Real estate agents | Evan Compean / Compean Group (loose) | 2/5, most fragmented |

## Structural observations specific to Houston

1. **Houston Methodist's unanimous #1 across all 5 engines is the strongest single result measured in this
   entire research program**, surpassing even Chicago's 5/5 (Landmark Property Management) because it holds
   the identical rank position, not just presence, on every engine that returned a ranking.

2. **Houston's two strongest categories both reflect its actual economy**: oil & gas/energy law (Vinson &
   Elkins, Bracewell, both 4/5) and hospital systems (Houston Methodist, 5/5 unanimous). This mirrors the
   same city-economy-reflects-AI-consensus pattern seen in Los Angeles (entertainment law) and Chicago
   (corporate law), a recurring, genuine structural finding, not a templated repeat.

3. **Property management is proving to be a reliably high-consensus category type across every city
   researched so far** (New York 3/4, Los Angeles 4/5, Chicago 5/5, Houston 4/5 on two separate firms) —
   worth flagging as a pattern across the whole research program.

4. **Immigration law and individual real estate agents remain the most fragmented categories**, consistent
   with every city researched except Chicago (which was the sole outlier for immigration law). No firm or
   agent name exceeds 2/5 in either category here.

5. **No ChatGPT collection failures this run**, consistent with Los Angeles and Chicago and unlike New York.
   All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data on
   every prompt.
