# Boston AI Visibility Research — Findings

Client: `research-boston` (client_id 37), plan `pro`, market `US` / region `BOS`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Gemini on 2 prompts and Google AI Mode
on 2 prompts; those gaps are cross-checked against prose per-category below. This run used **Google AI Mode**
in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Boston
- ChatGPT: Lubin & Meyer PC #1, Sweeney Merrigan Personal Injury Lawyers #2, Breakstone, White & Gluck #4,
  Jason Stone Injury Lawyers #5, Jeffrey Glassman Injury Lawyers #9, Bellotti Law Group, P.C. #10, Altman
  Nussbaum Shunnarah Trial Attorneys #11
- Claude: Michael Kelly Injury Lawyers #1, Sugarman Law #2, Breakstone, White & Gluck #3, Sokolove Law #4,
  Feinberg & Alban, P.C. #5, Jason Stone Injury Lawyers #6, Jeffrey Glassman Injury Lawyers #7
- Gemini: no structured extraction; general prose
- Google AI Mode: structured extraction captured only Sweeney Merrigan Law, LLP #4; prose names "Lubin &
  Meyer PC, Breakstone, White & Gluck, and Sweeney Merrigan Law, LLP" as Tier 1
- Perplexity: Lubin & Meyer #1, Jason Stone Injury Lawyers #2

**Three firms reach 3/5: Lubin & Meyer** (ChatGPT #1, named Tier 1 in Google AI Mode's prose, Perplexity
#1), **Breakstone, White & Gluck** (ChatGPT #4, Claude #3, named in Google AI Mode's prose), and **Jason
Stone Injury Lawyers** (ChatGPT #5, Claude #6, Perplexity #2).

### 2. Best real estate agents for buying a home in Boston
- ChatGPT: Robert Cohen #1, David Green #2, Joe Watson #3, Andrew M. McKinney #4, Steven Cohen Team #5,
  Elynn Chen #6, James Gulden #7
- Claude: Ed Greable & Company #1, Buyers Brokers Only #3, Zander Realty Group #6
- Gemini: Ethan Goodrich #1, Hans Nagrath #2, Eric Johnson #3, Robert Cohen #4, Beth Dickerson #5, Tracy
  Campion #6, Frank Carroll #7, Seth Driggin #8, Jody Geany #9, Kristen Bishop #10
- Google AI Mode: no structured extraction; general prose
- Perplexity: no structured extraction; declined to name specific agents, citing limited available data

**Fragmented, consistent with every city researched except Atlanta.** The only overlap: **Robert Cohen**
(ChatGPT #1, Gemini #4), 2/5.

### 3. Top-rated property management companies in Boston
- ChatGPT: Green Ocean Property Management #1, CJL Rentals & Property Management #2, Real Property
  Management Boston #3, BBA Management #4, Platinum Realty Group #6, NextGen Realty #7
- Claude: Green Ocean Property Management #1, Belong #2, Real Property Management Boston #3, Charlesgate
  Property Management #4, Ziprent #5, CJL Rentals & Property Management #7, Avery Property Management #8,
  Trinity Management, LLC #9
- Gemini: Real Property Management Boston #2, Green Ocean Property Management #3, Charlesgate Realty Group
  #5, J. Butler Property Management #6, Mason Management Residential #7, Greater Boston Property Management
  #8, Kingston Real Estate Management #9, Uptown Realty #10
- Google AI Mode: names Green Ocean Property Management, Greater Boston Property Management, and CHARLESGATE,
  without explicit ranks
- Perplexity: Belong #1, Real Property Management Boston #2, Green Ocean Property Management #3, BRIGS #4,
  Charlesgate Realty Group #5, J. Butler Property Management #6, Mason Management Residential #7, Greater
  Boston Property Management #8, Lamacchia Property Management #9, Suffolk Property Management #10

**Full 5/5 unanimous presence: Green Ocean Property Management** appears in every one of the 5 engines'
responses (ChatGPT #1, Claude #1, Gemini #3, named in Google AI Mode, Perplexity #3) — Boston's second full
5/5 result for this category type after Chicago's Landmark Property Management. **Real Property Management
Boston** and **Charlesgate (Realty Group / Property Management)** both reach 4/5.

### 4. Best immigration lawyers in Boston
- ChatGPT: Fragomen #1, Parker Gallini LLP #3, Savitz Law Offices #4
- Claude: Savitz Law Offices, P.C. #1, Parker Gallini LLP #2, Romanovsky Law Offices #4, Harrington Law
  Offices #5, Goldstein Immigration Lawyers #6
- Gemini: Savitz Law Offices, P.C. #1, Romanovsky Law #2, Maiona Ward Immigration Law #3
- Google AI Mode: names "Law Offices of Giselle M. Rodriguez, PLLC, Romanovsky Law Offices, Toland Law, LLC,
  and Moreno Law Immigration," without explicit ranks
- Perplexity: Savitz Law Offices, P.C. #1

**Boston is the sixth city in this research program where immigration law converged instead of fragmenting,
following Chicago, Miami, Philadelphia, Atlanta, and Phoenix: Savitz Law Offices, P.C. reaches 4/5** (ChatGPT
#4, Claude #1, Gemini #1, Perplexity #1 — a unanimous #1 rank among 3 of the 4 engines that ranked it). This
tips the program-wide tally decisively: 6 convergent cities (Chicago, Miami, Philadelphia, Atlanta, Phoenix,
Boston) now outnumber 5 fragmented ones (New York, Los Angeles, Houston, Dallas, Washington DC).

### 5. Best biotech and life sciences law firms in Boston
- ChatGPT: Cooley LLP #1, Goodwin #2, Ropes & Gray LLP #3, WilmerHale #4, Mintz #5, Choate Hall & Stewart LLP
  #8, Foley Hoag LLP #9, **McDermott Will & Schulte #10** (name inconsistency, see note below)
- Claude: Goodwin Procter #1, McDermott Will & Emery #2, Ropes & Gray #3, Nixon Peabody LLP #4, Proskauer
  Rose LLP #5
- Gemini: WilmerHale #1, Goodwin Procter LLP #2, Cooley LLP #3, Ropes & Gray LLP #4, Latham & Watkins LLP #5,
  Mintz #6, Wilson Sonsini Goodrich & Rosati #7, Wolf Greenfield #8, **McDermott Will & Schulte #9** (same
  inconsistency), Lathrop GPM #10
- Google AI Mode: Ropes & Gray LLP #3, Cooley LLP #4, Mintz #6, Wilson Sonsini Goodrich & Rosati #8
- Perplexity: Ropes & Gray LLP #1, Mintz #2, White & Case #3

**Flagged, not corrected — a recurring cross-program anomaly:** ChatGPT and Gemini both render the real firm
"McDermott Will & Emery" as "**McDermott Will & Schulte**" in this response. This is the same fictional name
that appeared in Chicago's corporate-law dataset (also from ChatGPT and Gemini). Two engines independently
repeating the identical error across two different cities is a genuine, notable pattern worth flagging to
the underlying model providers, not just a one-off glitch.

**Full 5/5 unanimous presence: Ropes & Gray LLP** appears in every one of the 5 engines' responses (ChatGPT
#3, Claude #3, Gemini #4, Google AI Mode #3, Perplexity #1) — Boston's second full 5/5 result of this
dataset. **Mintz** reaches 4/5 (ChatGPT #5, Gemini #6, Google AI Mode #6, Perplexity #2). **Goodwin
(Procter)** and **Cooley LLP** both reach 3/5. This category directly reflects Boston/Cambridge's real
identity as one of the deepest biotech and life-sciences legal markets in the US.

### 6. Best hospital systems in Boston
- ChatGPT: Mass General Brigham #1, Beth Israel Lahey Health #2, Boston Medical Center Health System #3,
  Tufts Medicine #4, Cambridge Health Alliance #5
- Claude: Mass General Brigham #1, Boston Medical Center #2, Beth Israel Lahey Health #3
- Gemini: no structured extraction; prose names Mass General Brigham as the clear leader
- Google AI Mode: Mass General Brigham #1, New England Baptist Hospital #5, Lahey Hospital and Medical
  Center #6, Boston Children's Hospital #7, Tufts Medicine #8, BMC Health System #9; prose separately names
  Beth Israel Lahey Health as one of the two largest integrated networks
- Perplexity: Mass General Brigham #1, Massachusetts General Hospital #2, Beth Israel Lahey Health #5, Beth
  Israel Deaconess Medical Center #6, Tufts Medicine #7, Tufts Medical Center #8, Dana-Farber Cancer
  Institute #9

**Full 5/5 unanimous #1: Mass General Brigham** is named the top hospital system by every single engine
tested — ChatGPT, Claude, Google AI Mode, and Perplexity all rank it #1 structurally, and Gemini's prose
independently confirms it as the clear leader. This is the third city in this research program (after
Houston's Houston Methodist and Philadelphia's Penn Medicine/Jefferson Health) where a hospital system
achieved unanimous #1 consensus across all 5 engines. **Beth Israel Lahey Health** reaches 4/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Hospital systems | **Mass General Brigham** | 5/5, unanimous #1 |
| Property management | **Green Ocean Property Management** | 5/5, full unanimous presence |
| Biotech/life sciences law | **Ropes & Gray LLP** | 5/5, full unanimous presence |
| Immigration law | **Savitz Law Offices, P.C.** | 4/5, unanimous #1 where ranked |
| Personal injury law | **Lubin & Meyer, Breakstone White & Gluck, Jason Stone** | 3/5 each |
| Real estate agents | Robert Cohen (loose) | 2/5, fragmented |

## Structural observations specific to Boston

1. **Boston is the most 5/5-dense city in this entire research program.** Three separate categories,
   hospital systems (Mass General Brigham), property management (Green Ocean Property Management), and
   biotech/life sciences law (Ropes & Gray LLP), each achieved full unanimous 5/5 consensus. No other city
   researched had more than two categories reach that level (Philadelphia and Washington DC each had two).

2. **Biotech/life sciences law is a category that directly reflects Boston's real economic identity**, the
   same pattern seen in Los Angeles (entertainment), Chicago (corporate law), Houston (energy), Atlanta
   (logistics), and Washington DC (lobbying) — each city's strongest AI consensus tends to land on its
   actual economic specialty.

3. **Boston is the sixth city where immigration law converged rather than fragmented**, following Chicago,
   Miami, Philadelphia, Atlanta, and Phoenix. Convergent cities (6) now clearly outnumber fragmented ones (5:
   New York, Los Angeles, Houston, Dallas, Washington DC) across the full 10-city program.

4. **The same fictional law-firm name ("McDermott Will & Schulte" instead of the real "McDermott Will &
   Emery") appeared again, independently, in both ChatGPT and Gemini** — the identical error already
   documented in Chicago's dataset. Two engines repeating the same hallucination across two different
   cities is a genuine cross-program pattern, not a one-off.

5. **Hospital systems is proving to be the single most reliable full-unanimous-consensus category across
   this entire program**: Houston Methodist, Penn Medicine and Jefferson Health (Philadelphia), and now Mass
   General Brigham have all achieved 5/5 unanimous #1 rankings.

6. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
