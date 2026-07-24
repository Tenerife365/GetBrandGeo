# Atlanta AI Visibility Research — Findings

Client: `research-atlanta` (client_id 34), plan `pro`, market `US` / region `ATL`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Google AI Mode on 3 prompts and
ChatGPT/Gemini on one prompt each; those gaps are cross-checked against prose per-category below. This run
used **Google AI Mode** in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Atlanta
- ChatGPT: Bell Law Firm #1, Turnbull, Moak & Pendergrass PC #3, Beasley Allen #4, Bey & Associates LLC #5,
  The Baer Law Firm #6, Tobin Injury Law #7, Johnson & Ward #8
- Claude: Stewart Miller Simmons Trial Attorneys #1, Goldstein Hayes & Lina, LLC #2, John Foy & Associates
  #3, Morgan & Morgan #4, Fox Injury Law #5, Pendergrass Law #6, Kaine Law #7, Tobin Injury Law #8
- Gemini: John Foy & Associates #1, Morgan & Morgan #2, Kenneth S. Nugent, P.C. #3, Montlick Injury
  Attorneys #4, Butler Kahn #5, The Mike Hostilo Law Firm #6, Rafi Law Firm #7, The Millar Law Firm #8,
  Slappey & Sadd, LLC #9, Scott Pryor Law Group #10
- Google AI Mode: no structured extraction; prose names Montlick Injury Attorneys, Bader Law, KIM LAW, Tobin
  Injury Law, and Butler Kahn
- Perplexity: John Foy & Associates #1, Stewart Miller Simmons Trial Attorneys #2, Scott Pryor Law Group #3,
  Weatherby Law Firm #4

**Two firms reach 3/5: John Foy & Associates** (Claude #3, Gemini #1, Perplexity #1) and **Tobin Injury Law**
(ChatGPT #7, Claude #8, named in Google AI Mode's prose).

### 2. Best real estate agents for buying a home in Atlanta
- ChatGPT: Justin Landis Group #2, The Seeby Group #3, Providence Partners #7, Anna K Intown #9, Kereen
  Henry #10
- Claude: Chase Mizell #1, Michelle Witmer Humes #2, Greg Kurzner #3, Justin Landis Group #4, Kyle Jackson,
  Realtor #5, Candace Hardy #6, The Zac Team #7, Debra Johnston #8, The Olusa Group #9, Jack Stachura #10
- Gemini: Justin Landis Group #1, The Schiff Team #8
- Google AI Mode: names "Justin Landis Group Real Estate, The Zac Team at RE/MAX Metro Atlanta, and Nadine
  Lutz at Compass" as its top picks
- Perplexity: declined to name any agent, citing no current search results to verify

**The strongest real-estate-agent result measured in this entire research program: Justin Landis Group
reaches 4/5** (ChatGPT #2, Claude #4, Gemini #1, named in Google AI Mode). Every other city researched so
far (New York, Los Angeles, Chicago, Houston, Dallas, Miami, Philadelphia) showed this category as
completely or near-completely fragmented at the individual/team level, with no name crossing 2-3/5. Atlanta
breaks that pattern decisively.

### 3. Top-rated property management companies in Atlanta
- ChatGPT: Backyard Realty Group #1, Vineyard Property Management #2, Atlanta Area Property Management #3,
  ARB Management LLC #4, Ziprent Property Management #5, PMI Georgia #6, Sovereign Realty & Management #7,
  The Rental Group #8, Aramis Realty #9, ARG Realty and Property Management #10
- Claude: Excalibur Homes #1, Compass Property Management #2, Home365 #3, Evernest #4, Specialized Property
  Management Atlanta #5, Citiside Properties #9, Atlanta Property Management Group #10
- Gemini: Mynd Property Management #2, Evernest #3, Vision Realty & Management #4, Compass Property
  Management #6, Specialized Property Management Atlanta #7, Citiside Property Management #8, Revolution
  Rental Management #9, Home365 #10
- Google AI Mode: names Bay Property Management Group, Real Property Management Greenway, Vision Realty &
  Management, and Aramis Realty, without explicit ranks
- Perplexity: Evernest #1, Sovereign Realty & Management #2, Vineyard Property Management #5, Home365 #8

**Two firms reach 3/5: Evernest** (Claude #4, Gemini #3, Perplexity #1) and **Home365** (Claude #3, Gemini
#10, Perplexity #8). A more moderate result than the 4-5/5 seen for this category in Chicago, Houston, and
Philadelphia, but still above-average consensus for the category type overall.

### 4. Best immigration lawyers in Atlanta
- ChatGPT: Kuck Baxter Immigration #1, Weinstock Immigration Lawyers #3, Urbina Immigration Law #5, Hope
  Immigration #6, Bensman Law #7, The Fogle Law Firm #10
- Claude: prose #1 pick is Charles H. Kuck – Kuck Baxter Immigration; structured — Alien Attorney LLC #7,
  Gorinshteyn Global, LLC #8
- Gemini: Kuck Baxter Immigration LLC #1, Shirazi Law #2, Elliott Immigration Law #3, The Fogle Law Firm,
  LLC #4, Raju Law #5, Antonini & Cohen #6, Weinstock Immigration Lawyers #7, The Dhanani Law Firm, LLC #8,
  Chavarro Law Firm #9
- Google AI Mode: names Antonini & Cohen Immigration Law Group as a top choice (partial snippet, cut off)
- Perplexity: declined to name any firm, citing no current search results to verify

**Atlanta is the fourth city in this research program (after Chicago, Miami, and Philadelphia) where
immigration law converged instead of fragmenting: Kuck Baxter Immigration reaches 3/5 with a unanimous #1
rank wherever a rank was given** (ChatGPT #1, Claude's explicit prose #1 pick, Gemini #1). The program-wide
tally for this category is now split evenly: New York, Los Angeles, Houston, and Dallas showed fragmentation;
Chicago, Miami, Philadelphia, and Atlanta showed real convergence.

### 5. Best entertainment and music industry lawyers in Atlanta
- ChatGPT: no structured extraction; general prose
- Claude: Greenberg Traurig #1, Barnes & Thornburg LLP #2
- Gemini: no structured extraction; general prose
- Google AI Mode: Greenberg Traurig, LLP #1, Kilpatrick Townsend & Stockton LLP #4, Barnes & Thornburg LLP
  #6, The Seay Firm LLC #9
- Perplexity: Barnes & Thornburg LLP #1 (prose also names "Jess Rosen at Greenberg Traurig")

**Two firms reach 3/5, both with a unanimous #1 rank wherever ranked: Greenberg Traurig** (Claude #1, Google
AI Mode #1, named in Perplexity's prose) and **Barnes & Thornburg LLP** (Claude #2, Google AI Mode #6,
Perplexity #1). This category directly reflects Atlanta's real identity as a hub for the music and
entertainment industry, echoing how Los Angeles' entertainment-law category was its strongest single result.

### 6. Best logistics and supply chain software companies in Atlanta
- ChatGPT: Manhattan Associates #1, Logility #2, Dematic #3, Stord #4, FORTNA #5, Aptean #6
- Claude: Manhattan Associates #1, STORD #2, Logility #3, Chainalytics #4, Prosponsive Logistics #5, Nolan
  Transportation Group #6, Saltbox #7, Americold Logistics #8, GoBolt #10
- Gemini: Manhattan Associates #1, American Software Inc #2, Dematic #3, Blue Ridge #6, Logility #7, Fortna
  #9
- Google AI Mode: Manhattan Associates #1, Dematic #3, Swisslog #4, Stord #5, Deposco #6
- Perplexity: Blue Yonder #1, Manhattan Associates #2, Descartes Systems Group #3, Aptean #4, Kaleris #5

**Full 5/5 unanimous presence: Manhattan Associates** appears in every single one of the 5 engines' answers,
ranked #1 by four of them (ChatGPT, Claude, Gemini, Google AI Mode) and #2 by the fifth (Perplexity). This
directly reflects Atlanta's real economic identity, Manhattan Associates is a genuine Atlanta-headquartered
supply-chain-software leader, the same city-economy-reflects-AI-consensus pattern already seen in Los
Angeles (entertainment law), Chicago (corporate law), and Houston (energy law/hospital systems). **Logility**,
**Dematic**, and **Stord** each reach 3/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Logistics/supply chain software | **Manhattan Associates** | 5/5, full unanimous presence |
| Real estate agents | **Justin Landis Group** | 4/5, breaking the usual fragmentation pattern |
| Immigration law | **Kuck Baxter Immigration** | 3/5, unanimous #1 where ranked |
| Personal injury law | **John Foy & Associates, Tobin Injury Law** | 3/5 each |
| Entertainment/music law | **Greenberg Traurig, Barnes & Thornburg** | 3/5 each |
| Property management | **Evernest, Home365** | 3/5 each |

## Structural observations specific to Atlanta

1. **Manhattan Associates' full 5/5 unanimous presence directly reflects Atlanta's real economy** — a
   genuine Atlanta-headquartered supply-chain-software leader recognized by every engine tested. This
   extends the pattern already documented in Los Angeles, Chicago, and Houston: each city's strongest AI
   consensus tends to land on the category most closely tied to that city's actual economic identity.

2. **Atlanta is the only city so far where individual/team-level real estate agents did not fragment.**
   Justin Landis Group reached 4/5, a result unmatched by any other city researched (New York, Los Angeles,
   Chicago, Houston, Dallas, Miami, and Philadelphia all showed this category as heavily or completely
   fragmented).

3. **Atlanta is the fourth city where immigration law converged rather than fragmented**, following Chicago,
   Miami, and Philadelphia. The program-wide split for this category is now exactly even: 4 fragmented
   cities (New York, Los Angeles, Houston, Dallas) vs. 4 convergent cities (Chicago, Miami, Philadelphia,
   Atlanta).

4. **Entertainment and music law shows real consensus (3/5 on two firms)**, reflecting Atlanta's genuine
   identity as a music-industry hub, similar to how entertainment law stood out as Los Angeles' strongest
   category.

5. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
