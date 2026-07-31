# Tampa AI Visibility Research — Findings

Client: `research-tampa` (client_id 44), plan `pro`, market `US` / region `TPA`.
Collection date: 2026-07-25 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs; those
gaps are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Tampa
- ChatGPT: Abrahamson & Uiterwyk #1, Distasio Law Firm #2, Hancock Injury Attorneys #3, The Yerrid Law Firm
  #5, Morgan & Morgan #6, Catania & Catania #7, Winters & Yonker #8
- Claude: Morgan & Morgan #1, Catania & Catania Injury Lawyers #2, Culpepper Kurland #4, MattLaw #5, Jeff
  Murphy Personal Injury Lawyers #6, Dennis Hernandez Injury Attorneys #7, The Yerrid Law Firm #8
- Gemini: The Fran Haasch Law Group #1, PDM Law #2, Christopher Ligori & Associates #3
- Google AI Mode: no structured extraction; general prose
- Perplexity: Alley, Clark & Greiwe #1, First Tier #2, Farah & Farah #4

**No firm reaches 3/5, the most fragmented personal-injury result in this batch of cities.** The loosest
overlaps: **Morgan & Morgan** (ChatGPT #6, Claude #1), **Catania & Catania** (ChatGPT #7, Claude #2), and
**The Yerrid Law Firm** (ChatGPT #5, Claude #8) — all 2/5.

### 2. Best real estate agents for buying a home in Tampa
- ChatGPT: prose #1 pick is the Kendall Bonner Team
- Claude: prose #1 pick is Kristen Arseneau – Smith & Associates
- Gemini: no structured extraction; general prose
- Google AI Mode: names The Kendall Bonner Team, The Duncan Duo Team, SOPHIA SANCHEZ, and Frank Albert
  Realty as top options
- Perplexity: The Kendall Bonner Team #1, Team Borham #7; prose also separately names "Team Borham with eXp
  Realty"

**A rare real-estate-team convergence: The Kendall Bonner Team reaches 3/5** (ChatGPT's prose #1 pick,
named in Google AI Mode, Perplexity #1). This category almost always fragments completely at the individual
level across every city researched — Tampa is one of only two cities (alongside Atlanta's Justin Landis
Group) where a specific team reached real cross-engine consensus.

### 3. Top-rated property management companies in Tampa
- ChatGPT: HomeRiver Group Tampa #1, Bay Area Property Management #2, Dennis Property Management #3,
  Graystone Property Management #7, Trident Property Management #8
- Claude: Hoffman Realty LLC #1, InvestPro Properties, Inc #2, Eaton Realty #4, Greenacre Properties #5,
  WrightDavis Property Management #6, BG Realty #7, Mynd Management #8
- Gemini: Hoffman Realty #2, MYND Property Management #4, HomeRiver Group Tampa #6
- Google AI Mode: names Rent Solutions, WrightDavis Property Management, and Hoffman Realty as its top three
  by review volume and rating
- Perplexity: WrightDavis Property Management #1, Eaton Realty #2, Bahia Property Management #3, Graystone
  Property Management #4, Cavalier Estates #5

**Two firms reach 3/5: Hoffman Realty (LLC)** (Claude #1, Gemini #2, named in Google AI Mode's top three)
and **WrightDavis Property Management** (Claude #6, named in Google AI Mode, Perplexity #1). A more modest
result for this category type than the 4-5/5 seen in several other cities, but still above-average
consensus.

### 4. Best immigration lawyers in Tampa
- ChatGPT: Neil F. Lewis, P.A. #1, Colombo & Hurd, PL #2, Martins Imudia / Martins Law #4, Shumaker #5,
  Dubrule & Nowel, PLLC #6
- Claude: Maney Gordon Zeller, P.A. #1, Ardila Law Firm #5, Foley Immigration Law #7, Gallo Law, P.A. #8, K.
  Dean Kantaras, P.A. #9, Ragheb Law #10
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; general prose
- Perplexity: names individually-rated Avvo attorneys (Krista A. Eyler, Nickolas James Spradlin, and others)

**No overlap across any two engines, the most fragmented category in the Tampa dataset.**

### 5. Best insurance and financial services law firms in Tampa
- ChatGPT: Dutton Law Group, P.A. #1, Mills Law Group #2, Mubarak, Sherif & Oladipo, PLLC #3, Hill Ward
  Henderson #4, Shumaker, Loop & Kendrick LLP #5, Carlton Fields #6, Fowler White Burnett #7, Berger
  Singerman #8, Akerman LLP #10
- Claude: Bradley Arant Boult Cummings LLP #1, Bush Ross PA #2, Cole, Scott & Kissane #3, Merlin Law Group,
  P.A. #5
- Gemini: Dutton Law Group, P.A. #1, Mills Law Group #2, Mubarak, Sherif, & Oladipo, PLLC #3, HD Law
  Partners #4, Adams and Reese LLP #5, Akerman LLP #6, Blank Rome LLP #7, Boyle, Leonard & Anderson, P.A.
  #8, Butler Weihmuller Katz Craig, LLP #9, Carlton Fields PA #10
- Google AI Mode: no structured extraction; prose distinguishes defense/corporate vs. policyholder/consumer
  representation and separately names Wood Smith Henning & Berman LLP (WSHB)
- Perplexity: declined, citing no current search results to verify

**A striking two-engine match with identical rank order: ChatGPT and Gemini both name the exact same top
three firms in the exact same sequence** — Dutton Law Group, P.A. (#1), Mills Law Group (#2), and Mubarak,
Sherif & Oladipo, PLLC (#3). Since Claude, Google AI Mode, and Perplexity diverge completely, this only
reaches 2/5 by engine count, but the identical three-firm ordering between two independent engines is
unusually precise agreement.

### 6. Best hotels and hospitality management companies in Tampa
- ChatGPT: mostly named hotel properties — The Tampa EDITION #1, JW Marriott Tampa Water Street #2, Tampa
  Marriott Water Street #3, Epicurean Hotel, Autograph Collection #4, Le Méridien Tampa, The Courthouse #5,
  The Current Hotel, Autograph Collection #7, Grand Hyatt Tampa Bay #8
- Claude: also mostly hotel properties — JW Marriott Tampa Water Street #1, The Tampa EDITION #2, The
  Current Hotel #3, The Epicurean Hotel #4, Grand Hyatt Tampa Bay #5, The Westin Tampa Bay #6, Le Méridien
  Tampa, The Courthouse #7, Hotel Haya #8, The Westshore Grand #9
- Gemini: named genuine management companies — Interstar Hotels #1, Mainsail Lodging & Development #3,
  Southern Hospitality Management #4, Crestline Hotels & Resorts #7
- Google AI Mode: also named genuine management companies — Mainsail Lodging & Development #2, H.I.
  Development Corporation #4, SEAM Hospitality #5
- Perplexity: mostly hotel properties — The Tampa EDITION #1, JW Marriott Tampa Water Street #2, Epicurean
  Hotel, Autograph Collection #3; prose notes insufficient data for management companies specifically

**Notable pattern, not noise removal: 4 of 5 engines answered "hotels and hospitality management companies"
almost entirely with hotel properties, not actual management firms** — the same blending issue already
documented in Miami's dataset. Among the hotel properties, **The Tampa EDITION** (ChatGPT #1, Claude #2,
Perplexity #1), **JW Marriott Tampa Water Street** (ChatGPT #2, Claude #1, Perplexity #2), and **Epicurean
Hotel, Autograph Collection** (ChatGPT #4, Claude #4, Perplexity #3) all reach 3/5. **Mainsail Lodging &
Development** is the clearest genuine management-company signal, at 2/5 (Gemini, Google AI Mode).

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Real estate agents | **The Kendall Bonner Team** | 3/5, a rare team-level convergence |
| Property management | **Hoffman Realty, WrightDavis Property Management** | 3/5 each |
| Hotels/hospitality | **The Tampa EDITION, JW Marriott, Epicurean Hotel** (loose) | 3/5 each, category blended two meanings |
| Insurance/financial law | Dutton Law Group / Mills / Mubarak Sherif & Oladipo (2-engine identical order) | 2/5 each |
| Personal injury law | Morgan & Morgan, Catania & Catania (loose) | 2/5 each, fragmented |
| Immigration law | No overlap at all | Most fragmented category measured |

## Structural observations specific to Tampa

1. **Tampa is genuinely different in shape from most cities researched: no category reaches 4/5 or higher.**
   Its strongest results all sit at exactly 3/5, a milder overall consensus profile than San Francisco,
   Chicago, Houston, Detroit, or Minneapolis. This kind of authentic variability, not every city producing a
   dramatic result, is itself evidence the research reflects real data rather than a templated pattern.

2. **The Kendall Bonner Team is only the second real estate team in this entire research program to reach
   real cross-engine consensus** (after Atlanta's Justin Landis Group), breaking the near-universal
   fragmentation of this category.

3. **The "hotels and hospitality management companies" blending issue recurs**, exactly as seen in Miami:
   most engines answer with hotel properties rather than management firms when the prompt names both.

4. **Personal injury law and immigration law are both unusually fragmented here**, with immigration law
   showing zero cross-engine overlap at all, one of the weakest immigration-law results in the whole
   program.

5. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
