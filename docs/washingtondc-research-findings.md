# Washington DC AI Visibility Research — Findings

Client: `research-washingtondc` (client_id 36), plan `pro`, market `US` / region `DCA`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs, especially
the real estate and government contracting prompts, where multiple engines returned prose only; those gaps
are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the retired
**Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Washington DC
- ChatGPT: Regan Zambri Long PLLC #1, Patrick Malone & Associates #2, Chaikin Sherman Cammarata Siegel P.C.
  #3, Trombly & Singer, PLLC #4, Simeone & Miller, LLP #5, Mesirow & Associates, PLLC #6, Koonz McKenney #7
- Claude: Regan Zambri Long #1, Price Benowitz LLP #3, The Cochran Firm #4, Simeone & Miller, LLP #5, Patrick
  Malone & Associates, P.C. #6, Wingfield, Ginsburg & Lipp #7
- Gemini: Cohen & Cohen, P.C. #1, The Cochran Firm, DC #2, Nace Law Group #3, Patrick Malone & Associates
  #4, Donahoe Kearney, PLLC #5
- Google AI Mode: Regan Zambri Long PLLC #1, The Cochran Firm D.C. #3
- Perplexity: no structured extraction; prose references Avvo's DC directory generally

**Three firms reach 3/5: Regan Zambri Long** (ChatGPT #1, Claude #1, Google AI Mode #1 — unanimous #1 wherever
ranked), **Patrick Malone & Associates** (ChatGPT #2, Claude #6, Gemini #4), and **The Cochran Firm** (Claude
#4, Gemini #2, Google AI Mode #3).

### 2. Best real estate agents for buying a home in Washington DC
- ChatGPT: no structured extraction; prose #1 pick is Kimberly Cesta... (name cut off in the raw response)
- Claude: no structured extraction; prose #1 pick is the Jenn Smira Team at Compass Real Estate
- Gemini: no structured extraction; general prose about buyer-representation considerations
- Google AI Mode: names "Jenn Smira & Co. at Compass Real Estate, Coalition Properties Group, and Saydam
  Properties Group" as top-tier teams
- Perplexity: no structured extraction; references Washingtonian's "100 Best Agents" list generally

**The most fragmented category in the DC dataset at the individual level.** The only overlap: **Jenn Smira
(Team/Co.) at Compass**, named by both Claude's prose and Google AI Mode, 2/5. Consistent with every city
researched except Atlanta.

### 3. Top-rated property management companies in Washington DC
- ChatGPT: Nest DC #1, Columbia Property Management #2, Bay Property Management Group #3, Streamline
  Management #4, Flat Fee Landlord #5, Real Property Management Washington DC #6, Atlas Lane #7, Nomadic
  Real Estate #8
- Claude: prose #1 pick is Bay Property Management Group Washington DC; structured — Highland Realty #3,
  Pearson Smith Property Management #4, KC Realty Group #5
- Gemini: Nest DC #2, Columbia Property Management #3, Bay Property Management Group #4, Streamline
  Management #5, EJF Rentals #7, Fred A. Smith Management #8
- Google AI Mode: no structured extraction; prose describes "Full-Service & Residential Managers" without
  clean names in the captured snippet
- Perplexity: Keener Management Inc #1, Real Property Management DC Metro #2, Gordon James Realty #4,
  Longford Management #5, Renters Warehouse #6, Streamline Management #7, Flat Fee Landlord #8, Nest DC #9

**Three firms reach 3/5: Bay Property Management Group** (ChatGPT #3, Claude's prose #1 pick, Gemini #4),
**Nest DC** (ChatGPT #1, Gemini #2, Perplexity #9), and **Streamline Management** (ChatGPT #4, Gemini #5,
Perplexity #7). Property management continues its reliable-consensus pattern across every city researched.

### 4. Best immigration lawyers in Washington DC
- ChatGPT: Benach Pitney Reilly LLP #2, Fragomen #4, Clark Hill PLC #5
- Claude: prose #1 pick is Haynes Novick Kohn Immigration Law Firm; structured extraction captured only
  directory/ratings platforms — **Avvo #8, Martindale-Hubbell #9, Super Lawyers #10, Best Lawyers #11** —
  all four flagged and removed as noise below
- Gemini: no structured extraction; general prose
- Google AI Mode: structured extraction captured only Hacking Immigration Law, LLC #3; prose names "Haynes
  Novick Kohn Immigration, Beach-Oswald Immigration Law Associates, and Hacking Immigration Law" as top-rated
- Perplexity: no structured extraction; names individually-rated Avvo attorneys in prose

**Removed as noise:** "Avvo," "Martindale-Hubbell," "Super Lawyers," and "Best Lawyers" (Claude #8-11 — all
four are legal directories or rating services, not law firms).

**Fragmented, reverting to the pattern seen in New York, Los Angeles, Houston, and Dallas.** The only
overlap: **Haynes Novick Kohn**, named by both Claude's prose and Google AI Mode's prose, 2/5. This makes
Washington DC the fifth fragmented city for this category, evening the program-wide tally at 5 fragmented
(New York, Los Angeles, Houston, Dallas, DC) vs. 5 convergent (Chicago, Miami, Philadelphia, Atlanta,
Phoenix).

### 5. Best lobbying and government relations firms in Washington DC
- ChatGPT: Ballard Partners #1, Brownstein Hyatt Farber Schreck #2, BGR Government Affairs #3, Cornerstone
  Government Affairs #5, Holland & Knight #6, Hogan Lovells #7, Squire Patton Boggs #8, Alston & Bird #9,
  Thorn Run Partners #10
- Claude: prose #1 pick is Akin Gump Strauss Hauer & Feld LLP; structured — Brownstein Hyatt Farber Schreck
  LLP #2, BGR Government Affairs #3, Holland & Knight LLP #4, KDCR Partners #5, Forbes Tate Partners #6,
  Alpine Group #7
- Gemini: Ballard Partners #1, Brownstein Hyatt Farber Schreck LLP #2, BGR Group #3, Cornerstone Government
  Affairs #4, Holland & Knight LLP #5, Miller Strategies #6, Thorn Run Partners #8, Cassidy & Associates #9
- Google AI Mode: Ballard Partners LLC #1, Brownstein Hyatt Farber Schreck LLP #2, BGR Government Affairs LLC
  #3, Miller Strategies LLC #5, Thorn Run Partners #7, Holland & Knight LLP #8, Squire Patton Boggs #9,
  Covington & Burling LLP #10; prose separately cites Akin Gump Strauss Hauer & Feld as a leader per
  OpenSecrets federal lobbying-revenue data
- Perplexity: Brownstein Hyatt Farber Schreck #1, ArentFox Schiff #2, Capitol Counsel #3, Cornerstone
  Government Affairs #4, Mehlman Consulting #5, Mercury Public Affairs #6, Podesta Group #7, Bracewell #8,
  BGR Group #9, Cassidy & Associates #10

**The strongest category in the entire DC dataset, and one of the strongest measured in this research
program: two firms both reach full 5/5 unanimous presence. Brownstein Hyatt Farber Schreck** is named by
every one of the 5 engines, and 4 of the 5 agree on the exact same rank position (#2), with only Perplexity
ranking it #1 instead. **BGR (Government Affairs / Group)** is independently named by all 5 engines too, with
4 of 5 agreeing on rank #3. **Holland & Knight** also reaches 4/5, and **Ballard Partners** and **Cornerstone
Government Affairs** both reach 3/5. This category directly reflects Washington DC's real economic identity
as the seat of federal lobbying.

### 6. Best government contracting consultants in Washington DC
- ChatGPT: The Gormley Group #1, Federal Pricing Group #3, AMRA Consulting #4, Keystone Analytics #5
- Claude: Crowell GovCon Strategies #1, Watson & Associates, LLC #2, Forvis Mazars #3, The Gormley Group #4,
  Feds United, LLC #5, APCO Worldwide #6
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; prose describes categories of consultant without specific ranked
  names in the captured snippet
- Perplexity: declined to name any firm, citing no available search results

**The most fragmented category in the DC dataset**, likely reflecting a genuinely niche B2B consulting
category with limited public review/ranking data (as Perplexity's own decline suggests). The only overlap:
**The Gormley Group** (ChatGPT #1, Claude #4), 2/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Lobbying/government relations | **Brownstein Hyatt Farber Schreck, BGR** | 5/5 each, both near-unanimous on rank too |
| Property management | **Bay Property Management Group, Nest DC, Streamline Management** | 3/5 each |
| Personal injury law | **Regan Zambri Long, Patrick Malone & Associates, The Cochran Firm** | 3/5 each |
| Immigration law | Haynes Novick Kohn (loose) | 2/5, fragmented |
| Real estate agents | Jenn Smira at Compass (loose) | 2/5, most fragmented |
| Government contracting consultants | The Gormley Group (loose) | 2/5, most fragmented |

## Structural observations specific to Washington DC

1. **Lobbying and government relations produced two simultaneous 5/5 unanimous results**, directly reflecting
   DC's real economic identity as the seat of federal lobbying — the clearest example yet in this program of
   a city's strongest AI consensus mapping onto its actual economy (following Los Angeles/entertainment,
   Chicago/corporate law, Houston/energy, and Atlanta/logistics).

2. **Immigration law reverted to fragmentation here**, making Washington DC the fifth fragmented city for
   this category (joining New York, Los Angeles, Houston, and Dallas) and evening the program-wide tally at
   5 fragmented vs. 5 convergent (Chicago, Miami, Philadelphia, Atlanta, Phoenix).

3. **Property management and personal injury law both produced three separate firms at 3/5**, a solid,
   above-average consensus without one runaway leader, similar in shape to Phoenix's wide-spread result.

4. **Four legal-directory/ratings platforms were misidentified as law firms** ("Avvo," "Martindale-Hubbell,"
   "Super Lawyers," "Best Lawyers") and removed as noise, all in the same response.

5. **Government contracting consultants was the least AI-visible category measured**, with even Perplexity
   declining to answer, reflecting a genuinely niche B2B category with limited public ranking data.

6. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
