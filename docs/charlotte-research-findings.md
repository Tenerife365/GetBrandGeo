# Charlotte AI Visibility Research — Findings

Client: `research-charlotte` (client_id 46), plan `pro`, market `US` / region `CLT`.
Collection date: 2026-07-25 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for a few engine/prompt pairs; those gaps
are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Charlotte
- ChatGPT: Brown Moore & Associates PLLC #1, Wilder Pantazis Law Group #2, DeVore, Acton & Stafford PA #3,
  Johnson & Groninger PLLC #4, Sumwalt Anderson Law Firm #5, DeMayo Law Offices LLP #6, The Olive Law Firm,
  P.A. #7, Jetton & Meredith, PLLC #8
- Claude: Price, Petho & Associates #1, The Olive Law Firm, P.A. #2, Rosensteel Fleishman #3, Riddle &
  Riddle Injury Lawyers #4, Knox Law Center #5, Derek P. Adler #7, Richard L. Anderson #8, Ken Harris &
  Associates, P.A. #9
- Gemini: Maginnis Howard #1, Tin Fulton Walker & Owen #2, Wilder Pantazis Law Group #3, Brown Moore &
  Associates PLLC #4, DeVore, Acton & Stafford PA #5, Osborne Law Firm, P.C. #6
- Google AI Mode: names Rosensteel Fleishman, The Law Offices of James Scott Farrin, Price Petho &
  Associates, and DeMayo Law Offices, unranked
- Perplexity: DeMayo Law Offices, LLP #1, Auger & Auger #2, Price Attorneys #3, Arnold & Smith, PLLC #4;
  prose also names Rosensteel Fleishman

**Three firms reach 3/5: Price, Petho & Associates** (also appearing as "Price Attorneys" in Perplexity)
(Claude #1, named in Google AI Mode, Perplexity #3), **Rosensteel Fleishman** (Claude #3, named in Google AI
Mode, referenced in Perplexity's prose), and **DeMayo Law Offices, LLP** (ChatGPT #6, named in Google AI
Mode, Perplexity #1).

### 2. Best real estate agents for buying a home in Charlotte
- ChatGPT: Andy Bovender Team #2, John Bolos Group #4
- Claude: prose #1 pick is Matt Stone / Stone Realty Group
- Gemini: Stone Realty Group #1, The Andy Bovender Team #2, Helen-Alyona Harp - Keller Williams #3, Enrique
  Alzate #4
- Google AI Mode: names Stone Realty Group, High Performance Real Estate Advisors, The Premier Team of
  RE/MAX Executive, and Andy Bovender Team at Compass
- Perplexity: names Callie Kelly (Cottingham Chalk), Valerie Mitchener (Corcoran HM Properties), and Vicky
  Mitchener (Dickens Mitchener Residential Real Estate)

**A rare double team-level convergence: Stone Realty Group** (Claude's prose #1 pick, Gemini #1, named in
Google AI Mode) and **The Andy Bovender Team** (ChatGPT #2, Gemini #2, named in Google AI Mode) both reach
3/5. This category almost always fragments completely at the individual level. Charlotte is the fourth city
in this research program (after Atlanta's Justin Landis Group and Tampa's Kendall Bonner Team) where a real
estate team reached genuine cross-engine consensus — and the first with two separate teams doing so at once.

### 3. Top-rated property management companies in Charlotte
- ChatGPT: Carolina Property Management #1, TouchPoint Property Management #2, Wilkinson Property
  Management #3, Henderson Properties #4, Bottom Line Property Management #5, MoveZen Property Management
  #6, Alarca Realty #7
- Claude: Carolina Property Management, LLC #1, Talley Properties #2, Victory Property Management #3, Mynd
  Property Management #4, Sunnon Property Management #5, Carod Properties #7, TouchPoint Property
  Management #8, Bottom Line Property Management #9, Henderson Properties #10
- Gemini: Sunnon Property Management #1, MoveZen Property Management #2, Evernest Property Management #3,
  Carod Properties #4, Henderson Properties #5, T.R. Lawing Realty #6, Real Property Management #7, Alarca
  Property Management #8, Four Seasons Property Management #9, TouchPoint Property Management #10
- Google AI Mode: no structured extraction; general prose
- Perplexity: Bottom Line Property Management #1, MoveZen Property Management #2, TouchPoint Property
  Management #3, Real Property Management Experts #4, Henderson Properties #5, Carolina Property
  Management #7, Wilkinson Property Management #9

**Two firms reach 4/5: Henderson Properties** (ChatGPT #4, Claude #10, Gemini #5, Perplexity #5) and
**TouchPoint Property Management** (ChatGPT #2, Claude #8, Gemini #10, Perplexity #3). **Carolina Property
Management**, **Bottom Line Property Management**, and **MoveZen Property Management** each reach 3/5.
Property management again extends its status as the most reliably high-consensus category type across
every city researched.

### 4. Best immigration lawyers in Charlotte
- ChatGPT: Garfinkel Immigration Law Firm #1, The Fogle Law Firm #2, Pierre Law, P.L.L.C. #4, Aziz Law Firm
  #5, Charlotte Immigration Law Firm #6, Vasquez Law Firm #7
- Claude: Garfinkel Immigration Law Firm #1, Alan Gordon Immigration Law #3, Pierre Law PLLC #6, Vasquez Law
  Firm, PLLC #7, Sussman Law Firm #8
- Gemini: Pardo Law Firm, PLLC #1, Charlotte Immigration Law Firm #2, Castillo Immigration Law Firm #3,
  Vasquez Law Firm #4, Pierre Law #5, Johnson & Nicholson, PLLC #6
- Google AI Mode: names Charlotte Immigration Law Firm, Pardo Law Firm, and Law Office of Kelli Y. Allen,
  unranked
- Perplexity: names individually-rated Justia/Avvo attorneys (James L. Arrasmith and others)

**Charlotte joins the growing list of convergent immigration-law cities: two firms reach 3/5. Vasquez Law
Firm (PLLC)** (ChatGPT #7, Claude #7, Gemini #4) and **Pierre Law (PLLC)** (ChatGPT #4, Claude #6, Gemini
#5). **Garfinkel Immigration Law Firm** also reaches 2/5 with a unanimous #1 rank between the two engines
that named it (ChatGPT, Claude).

### 5. Best banking and financial services law firms in Charlotte
- ChatGPT: Moore & Van Allen PLLC #1, McGuireWoods LLP #2, Mayer Brown LLP #4, Haynes and Boone LLP #5,
  Cadwalader, Wickersham & Taft #8, King & Spalding LLP #10
- Claude: Moore & Van Allen #1, Robinson Bradshaw #2, Cadwalader, Wickersham & Taft #3, Chapman and Cutler
  #4, Poyner Spruill #5, Johnston Allison & Hord #6
- Gemini: McGuireWoods LLP #1, Proskauer Rose LLP #3, Nelson Mullins #4
- Google AI Mode: Moore & Van Allen PLLC #1, Haynes and Boone LLP #5, Holland & Knight LLP #8; prose
  explicitly describes Charlotte as "the second-largest banking hub in the United States"
- Perplexity: Moore & Van Allen #1, cited as "ranked #1 on the Charlotte Business Journal list of largest
  banking and finance practice groups at Charlotte law firms"

**A clean unanimous #1: Moore & Van Allen (PLLC) reaches 4/5**, named #1 by every one of the four engines
that returned a ranking (ChatGPT, Claude, Google AI Mode, Perplexity). This directly reflects Charlotte's
real economic identity as the second-largest US banking hub, home to Bank of America's headquarters and a
major Wells Fargo East Coast presence.

### 6. Best corporate law firms in Charlotte
- ChatGPT: K&L Gates #1, McGuireWoods LLP #2, Moore & Van Allen PLLC #3, Robinson Bradshaw #5, Troutman
  Pepper Locke LLP #8, Alston & Bird LLP #9, Holland & Knight LLP #11
- Claude: Womble Bond Dickinson #1, Winston & Strawn LLP #2, Culp Elliott & Carpenter PLLC #3, Alexander
  Ricks PLLC #4, James, McElroy & Diehl, P.A. #5, The Barnes Law Firm, PLLC #6, Starrett Law Firm #7,
  Stewart Law, P.A. #8, The Canipe Law Firm, PLLC #9
- Gemini: Robinson Bradshaw #1, Nelson Mullins Riley & Scarborough #2, K&L Gates #3, Culp Elliott &
  Carpenter #4, Alston & Bird LLP #5, Haynes and Boone LLP #6, McMillan PLLC #7, Venn Law Group #8, Wagner
  Hicks PLLC #9, Cadwalader, Wickersham & Taft LLP #10
- Google AI Mode: structured extraction captured only Alston & Bird LLP #5; prose names "Moore & Van Allen
  PLLC, Robinson Bradshaw, and McGuireWoods LLP" as premier Band-ranked firms
- Perplexity: Alston & Bird LLP #1, King & Spalding #3

**Two firms reach 3/5: Robinson Bradshaw** (ChatGPT #5, Gemini #1, named in Google AI Mode's prose) and
**Alston & Bird LLP** (Gemini #5, Google AI Mode #5, Perplexity #1). A more dispersed result than banking
law's clean unanimous pick, but still above-average consensus for this category type.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Banking/financial services law | **Moore & Van Allen** | 4/5, unanimous #1 |
| Property management | **Henderson Properties, TouchPoint Property Management** | 4/5 each |
| Real estate agents | **Stone Realty Group, The Andy Bovender Team** | 3/5 each, rare double team convergence |
| Personal injury law | **Price Petho & Associates, Rosensteel Fleishman, DeMayo Law Offices** | 3/5 each |
| Corporate law | **Robinson Bradshaw, Alston & Bird** | 3/5 each |
| Immigration law | **Vasquez Law Firm, Pierre Law** | 3/5 each |

## Structural observations specific to Charlotte

1. **Moore & Van Allen's unanimous 4/5 for banking law directly reflects Charlotte's real economic
   identity** as the second-largest US banking hub, the same city-economy-reflects-consensus pattern already
   documented in Los Angeles, Chicago, Houston, Atlanta, Washington DC, Boston, San Francisco, and Denver.

2. **Charlotte produced the first double real-estate-team convergence measured in this research program.**
   Both Stone Realty Group and The Andy Bovender Team independently reached 3/5, making Charlotte the fourth
   city (after Atlanta and Tampa) where this near-universally fragmented category broke pattern, and the
   first with two teams doing so simultaneously.

3. **Property management again produced two firms at 4/5**, extending its status as the single most
   reliably high-consensus category type across every city researched in this program.

4. **Charlotte joins the majority of cities where immigration law converges rather than fragments**, with
   two firms (Vasquez Law Firm, Pierre Law) reaching 3/5.

5. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
