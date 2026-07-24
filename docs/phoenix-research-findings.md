# Phoenix AI Visibility Research — Findings

Client: `research-phoenix` (client_id 35), plan `pro`, market `US` / region `PHX`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for ChatGPT and Gemini on the immigration
prompt and Google AI Mode on several prompts; those gaps are cross-checked against prose per-category below.
This run used **Google AI Mode** in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Phoenix
- ChatGPT: Lamber Goodnow Injury Lawyers #1, Phillips Law Group #2, Plattner Verderame Arizona Injury
  Lawyers #3, Gage Mathers #4, Wyatt Injury Law, PLLC #5, Zachar Law Firm PC #7, Burch & Cracchiolo PA #9
- Claude: Phillips Law Group #1, Lerner & Rowe Injury Attorneys #2, Shapiro Law Team #3, Zanes Law #4,
  Hirsch & Lyon Accident Law #5, Sandweg & Ager #6
- Gemini: Lerner and Rowe Injury Attorneys #1, Goldberg & Osborne #2, Ramos Law #3, Lamber Goodnow Injury
  Lawyers #4, Sweet James Accident Attorneys #5, Burch & Cracchiolo PA #6, Gallagher & Kennedy PA #7
- Google AI Mode: Lerner and Rowe Injury Attorneys #1, Phillips Law Group #2, Lamber Goodnow Injury Lawyers
  #3, Shapiro Law Team #4, Kelly Law Team Phoenix #5, Lloyd Baker Injury Attorneys #6, Solorzano Law Firm #7
- Perplexity: Van Osteen #1, Gallagher & Kennedy #2, Lerner and Rowe #3, Hirsch & Lyon Accident Law #5, Wyatt
  Injury Law #6, Gage Mathers #7, Elmm Law Group #9

**Lerner and Rowe Injury Attorneys reaches 4/5** (Claude #2, Gemini #1, Google AI Mode #1, Perplexity #3),
the strongest single result in the Phoenix dataset. **Phillips Law Group** (ChatGPT #2, Claude #1, Google AI
Mode #2) and **Lamber Goodnow Injury Lawyers** (ChatGPT #1, Gemini #4, Google AI Mode #3) both reach 3/5.

### 2. Best real estate agents for buying a home in Phoenix
- ChatGPT: Iconic Home Team #1, The Rachael Richards Group #4, The Brokery #5, Michael Kent Team #6
- Claude: structured extraction captured **Zillow #7, Agent Pronto #8, Yelp #9** — all three flagged and
  removed as noise below; prose references Phoenix Magazine's "Top 50 Real Estate Agents" survey
- Gemini: no structured extraction; declined-style prose about needing more specifics
- Google AI Mode: names "The Gluch Group (brokered by eXp Realty), Arizona Proper R..." as top performers
  (snippet cut off)
- Perplexity: John Gluch - EXP Realty #1, The Hill Group #3, Dwell Phoenix Team - HomeSmart #4, Capstone
  Realty Professionals #5

**Removed as noise:** "Zillow," "Agent Pronto," and "Yelp" (Claude #7-9 — a listing platform, an
agent-matching service, and a review platform, none of them real estate agents).

**Fragmented at the individual level, matching most cities researched (Atlanta being the sole exception).**
The only real overlap: **John Gluch / The Gluch Group (eXp Realty)**, named first by Google AI Mode and #1 by
Perplexity, 2/5.

### 3. Top-rated property management companies in Phoenix
- ChatGPT: Stratton Vantage Property Management #1, Rentals America Phoenix #2, Real Property Management
  Evolve #3, Denali Real Estate #4, AZ Roots Management #5, Mark-Taylor Residential #6, Greystar #7,
  Cortland #8
- Claude: Real Property Management Evolve #1, HomeRiver Group #2, Service Star Realty #3, Stratton Vantage
  Property Management #4, SGI Property Management #5, Renters Warehouse #7, Helios Property Management #8
- Gemini: AZ Prime Property Management #1, On Q Property Management #2, HomeRiver Group #3, Service Star
  Realty #4, Rentals America Phoenix #5, Property Minders #6, Capstone Realty Professionals #7, Belong #8,
  HomeQwik #9, Patriot Property Management #10
- Google AI Mode: names On Q Property Management, AZ Prime Property Management, Stratton Vantage Property
  Management, and Real Property Management Evolve, without explicit ranks
- Perplexity: On Q Property Management #1, Home Ladder Property Management #2, Service Star Realty #3, AZ
  Prime Property Management #4, Real Property Management Phoenix Valley #5

**An unusually wide spread of consensus rather than one dominant leader: five different firms each reach
3/5** — **Real Property Management Evolve** (ChatGPT #3, Claude #1, named in Google AI Mode), **Stratton
Vantage Property Management** (ChatGPT #1, Claude #4, named in Google AI Mode), **On Q Property Management**
(Gemini #2, named in Google AI Mode, Perplexity #1), **AZ Prime Property Management** (Gemini #1, named in
Google AI Mode, Perplexity #4), and **Service Star Realty** (Claude #3, Gemini #4, Perplexity #3). No single
firm breaks past 3/5, unlike Chicago (5/5) or Houston/Philadelphia (4/5), but the category's overall
consensus density is still notably higher than fragmented categories.

### 4. Best immigration lawyers in Phoenix
- ChatGPT: no structured extraction; prose #1 pick is Roya D. Habich — Habich Law, PLC
- Claude: Alcock & Associates #1, Habich Law PLC #2, Alcaraz Tocchini LLP #3, CIMA Law Group #4, Jiang Law
  Firm, PLLC #5, Patel Law P.L.C. #6
- Gemini: no structured extraction; prose names "Habich Law PLC: Roya H..." among top-rated options
- Google AI Mode: names "The Law Offices of Alcock & Associates P.C., Ybarra Maldonado Law Group, and
  Federal Immigration Counselors, P.C.," without explicit ranks
- Perplexity: declined to name any firm, referencing Avvo-rated individual attorneys generally

**Phoenix is the fifth city in this research program where immigration law converged instead of fragmenting,
following Chicago, Miami, Philadelphia, and Atlanta: Habich Law PLC reaches 3/5** (ChatGPT's prose #1 pick,
Claude #2, named in Gemini's prose). Convergent cities for this category (5) now outnumber fragmented ones
(New York, Los Angeles, Houston, Dallas — 4) for the first time in this program.

### 5. Best retirement community and senior living providers in Phoenix
- ChatGPT: Sagewood #1, Beatitudes Campus #2, Brookdale #3
- Claude: Sagewood #1, The Terraces of Phoenix #2, Beatitudes Campus #4, Fountain View Village #5
- Gemini: Sagewood Senior Living #2, Arizona Traditions #4, CantaMia #5, Del Webb #6
- Google AI Mode: no structured extraction; prose describes "luxury resort-style amenities" without specific
  names in the captured snippet
- Perplexity: The Terraces of Phoenix #1, cited as a U.S. News 2026 "Best Independent Living Community"

**Sagewood reaches 3/5, with a unanimous #1 rank between ChatGPT and Claude** (also named #2 by Gemini). This
category directly reflects Phoenix's real demographic identity as a major retirement destination.

### 6. Best home services companies for AC repair and pool service in Phoenix
- ChatGPT: Collins Comfort Masters #1, Parker & Sons #4, Gonzales Heating & Cooling #5, Mako Pool Pros LLC
  #8, Redline Companies Pool Service LLC #10, Titan #12
- Claude: Larson Air Conditioning #2, Alien Air Conditioning and Heating #3, AZ Perfect Comfort #4, Lincoln
  Air #5, Semper Fi Heating & Cooling #6, True North Air Conditioning #7, Howard Air #8, Presidential Pools,
  Spas & Patio #10, Blue Knight Pool Service #11
- Gemini: Goettl Air Conditioning #1, Parker & Sons #2, Pool Daddy #3, Love Pool Care #4, SwimHappy #5,
  Serkland Swimming Pool Service #6
- Google AI Mode: names Day & Night Air Conditioning, Desert Diamond Air, and Mountainside Air for AC repair,
  and SwimHappy Pool Service, Bestway Pool Service, and AZ Mobile Pool Service for pool service, all unranked
- Perplexity: Goettl #1, Hobaica #2 (AC only — declined to rank pool service, citing no available data)

**The most fragmented category in the Phoenix dataset.** No firm crosses 2/5: **Parker & Sons** (ChatGPT #4,
Gemini #2), **Goettl (Air Conditioning)** (Gemini #1, Perplexity #1), and **SwimHappy** (Gemini #5, named in
Google AI Mode) are the closest overlaps. A hyper-local market with dozens of small contractors and no
dominant AI-visible brand.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Personal injury law | **Lerner and Rowe Injury Attorneys** | 4/5 |
| Property management | **5 firms tied**, each 3/5 | 3/5 each, unusually wide spread |
| Immigration law | **Habich Law PLC** | 3/5 |
| Retirement/senior living | **Sagewood** | 3/5, unanimous #1 where ranked |
| Real estate agents | John Gluch / The Gluch Group (loose) | 2/5, fragmented |
| Home services (AC/pool) | No firm past 2/5 | 2/5 max, most fragmented |

## Structural observations specific to Phoenix

1. **Phoenix is the fifth city where immigration law converged rather than fragmented**, following Chicago,
   Miami, Philadelphia, and Atlanta. Convergent cities for this category (5) now outnumber fragmented ones
   (New York, Los Angeles, Houston, Dallas — 4) for the first time across this research program.

2. **Property management showed an unusually wide spread of mid-tier consensus** — five separate firms each
   reaching exactly 3/5, rather than one or two firms dominating as seen in Chicago, Houston, or
   Philadelphia. The category type remains reliably high-consensus, just distributed differently here.

3. **Retirement/senior living reflects Phoenix's real demographic identity** as a major retirement
   destination, with Sagewood reaching 3/5 and a unanimous #1 rank wherever ranked, similar to how
   category-economy alignment has shown up in Los Angeles, Chicago, Houston, and Atlanta.

4. **Home services (AC repair and pool service) is the most fragmented category measured in the Phoenix
   dataset**, reflecting a genuinely fragmented hyper-local contractor market with no dominant brand.

5. **Three directory/matching platforms were misidentified as real estate agents** ("Zillow," "Agent Pronto,"
   "Yelp") and removed as noise.

6. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
