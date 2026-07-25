# San Diego AI Visibility Research — Findings

Client: `research-sandiego` (client_id 40), plan `pro`, market `US` / region `SAN`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs; those
gaps are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in San Diego
- ChatGPT: The McClellan Law Firm #1, Hulburt Law Firm APC #2, Harris Personal Injury Lawyers #3, Mission
  Personal Injury Lawyers #5, HHJ Trial Attorneys #6, Pines Salomon Injury Lawyers #7, Jurewitz #8
- Claude: The McClellan Law Firm #1, HHJ Trial Attorneys #2, Pines Salomon Injury Lawyers, APC #3, Jurewitz
  Law Group #5, Compass Law Group LLP #6, Kenneth M. Sigelman & Associates #7
- Gemini: Pines Salomon Personal Injury Lawyers #1, The McClellan Law Firm #2, Gomez Trial Attorneys #3,
  Singleton Schreiber #4, Phillips & Pelly #5, Ozols Law Firm #6
- Google AI Mode: names Gomez Trial Attorneys, The McClellan Law Firm, HHJ Trial Attorneys, Pines Salomon
  Personal Injury Lawyers, and Mission Personal Injury Lawyers, all unranked
- Perplexity: The Barnes Firm Injury Attorneys #1, Jurewitz Law Group #3; prose also names Mission Personal
  Injury Lawyers

**Two firms reach 4/5: The McClellan Law Firm** (ChatGPT #1, Claude #1, Gemini #2, named in Google AI Mode)
and **Pines Salomon (Injury Lawyers / Personal Injury Lawyers)** (ChatGPT #7, Claude #3, Gemini #1, named in
Google AI Mode). **HHJ Trial Attorneys**, **Jurewitz (Law Group)**, and **Mission Personal Injury Lawyers**
each reach 3/5.

### 2. Best real estate agents for buying a home in San Diego
- ChatGPT: structured extraction captured only **Expertise.com #4** — flagged and removed as noise below, a
  directory site, not an agent; prose otherwise recommends checking directories rather than naming agents
- Claude: Kimberly Schmidt & Associates #1, The GreenHouse Group #2, Whissel Beer Group #4, The Comiskey
  Group #7, Wannebo Real Estate Group #8, The Lund Team #9
- Gemini: Team Forss Realty Group #1, John Reeves Team #7
- Google AI Mode: Whissel Beer Group #6 (kept as reported — the same name independently produced by Claude)
- Perplexity: declined to name any agent, citing no current search results to verify

**Removed as noise:** "Expertise.com" (ChatGPT #4 — a review/directory platform, not a real estate agent).

**Fragmented at the individual level, consistent with nearly every city researched.** The only overlap:
**"Whissel Beer Group"** (Claude #4, Google AI Mode #6) — two engines independently producing the identical
unusual name is notable, though it's unclear from the raw data whether this reflects the firm's actual name
or a shared transcription quirk; kept as reported.

### 3. Top-rated property management companies in San Diego
- ChatGPT: Good Life Property Management #1, Utopia Management #2, GoldenWest Management #4, Mynd
  Management #5, Reynolds Property Management #6
- Claude: Ziprent #1, Realty Management Group #2, Good Life Property Management #3, Beyond Property
  Management #4, Penny Realty, Inc #5, Elevate SD Properties #6, Mynd Property Management #7, Utopia
  Management #8
- Gemini: Good Life Property Management #1, Priority One Property Management #2, WeLease Property
  Management #3, Vickery Properties #4, Penny Realty Property Management #6, Ziprent SD #7, HomeShield
  Property Management #8, BridgeHaus Property Managers #9, San Diego Professional Property Management #10
- Google AI Mode: names Good Life Property Management, Keyrenter San Diego, Penny Realty, and WeLease
  Property Management, without explicit ranks
- Perplexity: FBS Property Management #1, Harland Property Management #2, San Diego Premier Property
  Management #3, Good Life Property Management #4, Penny Realty #5, Seabreeze Management Company #7,
  Gables Residential #8, Ziprent #9, Doorstead #10

**Full 5/5 unanimous presence: Good Life Property Management** appears in every one of the 5 engines'
answers (ChatGPT #1, Claude #3, Gemini #1, named in Google AI Mode, Perplexity #4). **Penny Realty** reaches
4/5 (Claude #5, Gemini #6, named in Google AI Mode, Perplexity #5). **Ziprent** reaches 3/5 (Claude #1,
Gemini #7, Perplexity #9) — the third consecutive West Coast city (after San Francisco and Seattle) where
Ziprent shows real, independent AI visibility for property management, no longer a single-city coincidence.

### 4. Best immigration lawyers in San Diego
- ChatGPT: no structured extraction; prose recommends attorney directories rather than naming firms directly
- Claude: prose #1 pick is Law Offices of Jacob J. Sapochnick; structured — Jacobs & Schlesinger LLP #3,
  Rodriguez Law Firm #4, The Cruz Law Office #5, Behar International Counsel, PLC #6
- Gemini: Hurwitz Holt, APLC #1, Rodriguez Law Firm #3, Nasseri Legal #8
- Google AI Mode: names Kazmi & Sakata, Feldman Feldman & Associates, and the Law Offices of Jacob J.
  Sapochnick as top-rated for 2026, unranked
- Perplexity: structured extraction captured **Justia #1** and **Avvo #2** — both flagged and removed as
  noise below, attorney-rating directories, not law firms

**Removed as noise:** "Justia" and "Avvo" (Perplexity #1-2).

**Fragmented.** The loosest overlaps: **Law Offices of Jacob J. Sapochnick** (Claude's prose #1 pick, named
in Google AI Mode) and **Rodriguez Law Firm** (Claude #4, Gemini #3) — both 2/5. No firm reaches 3/5.

### 5. Best biotech and life sciences law firms in San Diego
- ChatGPT: Cooley LLP #1, Wilson Sonsini Goodrich & Rosati #2, Fish & Richardson P.C. #3, Jones Day #4,
  Mintz #7, Foley & Lardner LLP #8, Pillsbury Winthrop Shaw Pittman LLP #9, Barnes & Thornburg LLP #10
- Claude: no structured list; prose #1 pick is Wilson Sonsini Goodrich & Rosati
- Gemini: Cooley LLP #1, Eversheds Sutherland #2, Fish & Richardson PC #3, Jones Day #4, Knobbe Martens #5,
  Perkins Coie LLP #6, Rimon PC #7, Torrey Pines Law Group #8, Wilson Sonsini Goodrich & Rosati #9
- Google AI Mode: names Cooley and Latham & Watkins as "elite global firms" and Wilson Sonsini as a
  "dominant powerhouse practice," unranked
- Perplexity: Perkins Coie LLP #1, cited with a "Law Firm of the Year Award for 2025" from Best Law Firms

**Wilson Sonsini Goodrich & Rosati reaches 4/5** (ChatGPT #2, Claude's prose #1 pick, Gemini #9, named in
Google AI Mode). **Cooley (LLP)** reaches 3/5 (ChatGPT #1, Gemini #1, named in Google AI Mode). This
category reflects San Diego's real identity as a major US biotech hub.

### 6. Best craft breweries in San Diego
- ChatGPT: North Park Beer Co #1, Pure Project #2, Pizza Port #3, AleSmith Brewing Company #4, Societe
  Brewing #5, Burgeon Beer Co #7, McIlhenney Brewing #8, Kairoa Brewing Company #9, Eppig Brewing Waterfront
  Biergarten #10
- Claude: AleSmith Brewing Company #1, Ballast Point Brewing #3, Societe Brewing Company #4, Karl Strauss
  Brewing Company #5, Coronado Brewing Company #7, North Park Beer Company #8, Pure Project #9, Half Door
  Brewing #10
- Gemini: only North Park Beer Company #1 captured structurally; general prose otherwise
- Google AI Mode: names AleSmith Brewing Company and Pure Project North Park, unranked
- Perplexity: Pizza Port Brewing Company #1, AleSmith Brewing Company #2; prose also names Stone Brewing
  World Bistro & Gardens

**AleSmith Brewing Company reaches 4/5** (ChatGPT #4, Claude #1, named in Google AI Mode, Perplexity #2).
**North Park Beer Co(mpany)** and **Pure Project** both reach 3/5. A fun, genuine reflection of San Diego's
real identity as a major US craft-beer capital (the city that popularized the West Coast IPA style).

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Property management | **Good Life Property Management** | 5/5, full unanimous presence |
| Personal injury law | **The McClellan Law Firm, Pines Salomon** | 4/5 each |
| Biotech/life sciences law | **Wilson Sonsini Goodrich & Rosati** | 4/5 |
| Craft breweries | **AleSmith Brewing Company** | 4/5 |
| Immigration law | Jacob J. Sapochnick (loose) | 2/5, fragmented |
| Real estate agents | "Whissel Beer Group" (loose) | 2/5, most fragmented |

## Structural observations specific to San Diego

1. **Ziprent's West Coast pattern is now a three-city trend, not a coincidence.** It reached full presence
   among responding engines in San Francisco and Seattle's property-management categories, and reaches 3/5
   here in San Diego, a consistent regional brand with real cross-city AI visibility.

2. **San Diego's real economy shows up clearly in two categories**: biotech/life sciences law (Wilson
   Sonsini Goodrich & Rosati, 4/5) and craft breweries (AleSmith Brewing Company, 4/5), both directly
   reflecting the city's actual identity as a biotech hub and a craft-beer capital.

3. **Personal injury law produced two firms at 4/5 simultaneously**, one of the stronger results for this
   category type across the whole program.

4. **Real estate agents and immigration law remain the most fragmented categories**, consistent with the
   majority of cities researched.

5. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
