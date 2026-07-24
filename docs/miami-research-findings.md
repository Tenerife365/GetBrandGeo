# Miami AI Visibility Research — Findings

Client: `research-miami` (client_id 32), plan `pro`, market `US` / region `MIA`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Gemini on 2 prompts and Google AI Mode
on 1 prompt; those gaps are cross-checked against prose per-category below. This run used **Google AI Mode**
in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Miami
- ChatGPT: Leesfield & Partners #1, Hickey Law Firm #2, Freidin Brown, P.A. #3, Goldberg & Rosen #4, Pita
  Weber Del Prado #5, Rossman, Baumberger, Reboso & Spier #6, Panter, Panter & Sampedro #7, Morgan & Morgan #8
- Claude: Panter, Panter & Sampedro #1, Hickey Law Firm, P.A. #2, Gerson & Schwartz, P.A. #3, Goldberg &
  Rosen #4, Pita Weber Del Prado #5, Morgan & Morgan #6, Perkins Law Offices #7
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; prose describes evaluation criteria (Super Lawyers, Martindale-
  Hubbell ratings) without naming a clear top pick in the captured snippet
- Perplexity: Schwed, Adams & McGinley, P.A. #1 (prose also separately names Gerson & Schwartz Accident &
  Injury Lawyers)

**A striking two-engine match, but not full cross-engine consensus:** ChatGPT and Claude both name **Hickey
Law Firm** (#2 each), **Goldberg & Rosen** (#4 each), and **Pita Weber Del Prado** (#5 each) at identical rank
positions, and both separately name **Panter, Panter & Sampedro** and **Morgan & Morgan**. Since Gemini and
Google AI Mode returned no structured list and Perplexity named an entirely different firm, none of these
reach beyond 2/5 by engine count, but the ChatGPT/Claude rank-position agreement is unusually tight.

### 2. Best real estate brokers for buying a condo in Miami
- ChatGPT: Cervera Real Estate #1, Fortune International Realty #2, Compass Miami #4
- Claude: The Carroll Group (Compass) #1 (only name returned)
- Gemini: Fortune International Realty #3, The Jills Zeder Group #9
- Google AI Mode: Compass Florida #2 (only structured name); prose separately names The Jills Zeder Group at
  Coldwell Banker, David Siddons Group at Douglas Elliman, and Blackbook Properties
- Perplexity: names Dora Puig specifically, described as "Miami Beach's #1 agent" and ranked No. 1 in
  Miami-Dade 2017-2026 by RealTrends Verified

**No individual broker or team name crosses 2/5, the most fragmented category in the Miami dataset at the
individual level.** But the **Compass brokerage brand** has real institutional presence across 3 of 5
engines, just under different local team names (ChatGPT's "Compass Miami," Google AI Mode's "Compass
Florida," and Claude's "The Carroll Group (Compass)") — the same institutions-over-individuals pattern
already documented in New York and Los Angeles, here showing up as one brand name wearing three different
local labels.

### 3. Top-rated property management companies in Miami
- ChatGPT: Pristine Property Management #1, Bahia Property Management #2, Real Property Management Miami
  Metro #3, Threshold Management #4, Allied Property Group #5, Courtesy Property Management #6, FirstService
  Residential #7, Campbell Property Management #8
- Claude: Pristine Property Management #1, RPM Dade #2, Iron Property Management #3, FirstService
  Residential #4, Income Realty Corporation #5
- Gemini: HomeRiver Group #2, PMI Sunshine State #4, Kinetic Property Management, LLC #7, Marquis
  Association Management #9, Trident Management #10
- Google AI Mode: names Pristine Property Management, Threshold Management, Keyrenter Property Management
  Miami West, and Novel Management, without explicit ranks
- Perplexity: Pristine Property Management #1, Luxury Property Care #2, Belong #3, HomeRiver Group #4, Miami
  Property Management LLC #5, FirstService Residential #6

**Pristine Property Management reaches 4/5**, named #1 by both ChatGPT and Claude, #1 by Perplexity, and
listed by name in Google AI Mode. **FirstService Residential** reaches 3/5 (ChatGPT #7, Claude #4,
Perplexity #6). Property management continues to be the single most reliable high-consensus category type
across every city researched in this program.

### 4. Best immigration lawyers in Miami
- ChatGPT: prose #1 pick is Kurzban Kurzban Tetzeli & Pratt (name partially cut off in the raw response);
  structured — De Wit Immigration Law, P.A. #2, Fragomen #3
- Claude: Kurzban Kurzban Tetzeli & Pratt #1, Saleh & Associates #2, Arias Villa Law #3, Pozo Goldstein Law
  Firm #4, Wildes & Weinberg, P.C. #5, Revilla Law Firm, P.A. #6, Gallardo Law Firm #7
- Gemini: Kurzban Kurzban Tetzeli & Pratt #1, Wildes & Weinberg, P.C. #2, Arce Immigration Law #3, Arias Villa
  Law #4, Pozo Goldstein, LLP #5, Revilla Law Firm, P.A. #6, Immigration Lawyers USA, LLC #7, Fraser
  Immigration Law, PLLC #8
- Google AI Mode: names Arce Immigration Law, Pozo Goldstein, LLP, Kurzban Kurzban Tetzeli & Pratt, and
  Immigration Lawyers USA, without explicit ranking
- Perplexity: takes a different approach entirely, naming individually-rated attorneys via Avvo (Andrey I.
  Plaksin and others), no firm-level pick

**Miami is only the second city in this research program (after Chicago) where immigration law shows strong
consensus instead of fragmenting: Kurzban Kurzban Tetzeli & Pratt reaches 4/5** (ChatGPT's prose #1 pick,
Claude #1, Gemini #1, named in Google AI Mode). **Pozo Goldstein** reaches 3/5 (Claude #4, Gemini #5, Google
AI Mode). New York, Los Angeles, Houston, and Dallas all showed immigration law as one of their most
fragmented categories — Miami and Chicago are the two exceptions found so far.

### 5. Best international business law firms in Miami
- ChatGPT: Greenberg Traurig #1, Holland & Knight #2, Akerman LLP #3, DLA Piper #4, Hogan Lovells #5, Bilzin
  Sumberg #6, Berger Singerman #7, Diaz Reus International Law Firm #8, Concepción Global PLLC #9
- Claude: Holland & Knight #1, Hogan Lovells #2, Winston & Strawn #3, Shutts & Bowen LLP #4, Markowicz
  International Law #5, Reichard & Tornes, PLLC #6
- Gemini: no structured extraction; prose describes Miami's role as a gateway to Latin America
- Google AI Mode: Baker McKenzie #1, White & Case LLP #2, Greenberg Traurig, LLP #4, Holland & Knight LLP #5,
  Diaz Reus International Law Firm #9, Harper Meyer LLP #10
- Perplexity: Baker McKenzie LLP #1, DLA Piper LLP #2, Diaz Reus International Law Firm #3, Gunster #4

**Two firms reach 3/5: Holland & Knight** (ChatGPT #2, Claude #1, Google AI Mode #5) and **Diaz Reus
International Law Firm** (ChatGPT #8, Google AI Mode #9, Perplexity #3). This category directly reflects
Miami's real economic identity as the "Gateway to the Americas" for cross-border Latin American business.

### 6. Best hotels and hospitality management companies in Miami
- ChatGPT: mostly named hotel properties rather than management companies — Faena Hotel Miami Beach #2, The
  Setai, Miami Beach #3, Acqualina Resort & Residences #4, 1 Hotel South Beach #5, The Miami Beach EDITION
  #6, W South Beach #7, Loews Miami Beach Hotel #8, Four Seasons Hotel Miami #9, EAST Miami #10,
  InterContinental Miami #11
- Claude: also mostly hotel properties — The Setai Miami Beach #1, Four Seasons Hotel Miami #2, Faena Hotel
  Miami Beach #3, Mandarin Oriental, Miami #4, The Ritz-Carlton South Beach #5, 1 Hotel South Beach #6, Miami
  Beach EDITION #7, Kimpton EPIC Hotel #8, East Miami #9, Loews Miami Beach Hotel #10
- Gemini: no structured extraction; prose names "Sound Hospitality Management" as a genuine management
  company
- Google AI Mode: names AIC Hotel Group #1, a genuine hospitality management company
- Perplexity: also hotel properties — St. Regis Bal Harbour #1, Generator Miami #2, Eden Roc Miami Beach #3,
  Loews Miami Beach Hotel #4, The Biltmore Hotel #5

**Notable pattern, not noise removal: 4 of 5 engines answered a "hotels and hospitality management
companies" prompt almost entirely with hotel properties, not actual management companies.** Only Gemini
(Sound Hospitality Management) and Google AI Mode (AIC Hotel Group) named genuine management firms. Kept as
reported since the named businesses are all real, but this is a genuine prompt-interpretation quirk, similar
to Dallas's real-estate/relocation blending. Among the hotel properties, **Loews Miami Beach Hotel** is the
strongest overlap at 3/5 (ChatGPT #8, Claude #10, Perplexity #4).

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Property management | **Pristine Property Management** | 4/5 |
| Immigration law | **Kurzban Kurzban Tetzeli & Pratt** | 4/5 |
| International business law | **Holland & Knight, Diaz Reus** | 3/5 each |
| Hotels/hospitality | Loews Miami Beach Hotel (loose) | 3/5, category itself blended two meanings |
| Personal injury law | ChatGPT/Claude 2-engine match (loose) | 2/5, fragmented overall |
| Real estate brokers | Compass brand across 3 local team names (loose) | 3/5 as a brand, 0/5 per individual |

## Structural observations specific to Miami

1. **Miami is the second city in this program (after Chicago) where immigration law shows strong consensus
   rather than fragmenting.** Kurzban Kurzban Tetzeli & Pratt reached 4/5, a genuinely different result from
   New York, Los Angeles, Houston, and Dallas, where immigration law was consistently among the most
   fragmented categories.

2. **Property management remains the single most reliable high-consensus category type across every city
   researched so far** (New York 3/4, Los Angeles 4/5, Chicago 5/5, Houston 4/5 twice, Dallas 3/5 three
   times, Miami 4/5) — a structural pattern of the research program, not a one-off.

3. **The "hotels and hospitality management companies" prompt revealed a genuine engine-interpretation
   quirk**: 4 of 5 engines answered almost entirely with hotel properties rather than management companies,
   a similar blending issue to Dallas's real-estate/relocation confusion, worth watching in future city runs.

4. **Real estate brokers fragment at the individual level but show institutional brand presence**: no
   individual agent or team crosses 2/5, but the Compass brokerage brand appears across 3 of 5 engines under
   three different local team names, extending the institutions-over-individuals pattern from New York and
   Los Angeles.

5. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
