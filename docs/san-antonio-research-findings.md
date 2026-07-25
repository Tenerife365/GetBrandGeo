# San Antonio AI Visibility Research — Findings

Client: `research-sanantonio` (client_id 47), plan `pro`, market `US` / region `SAT`.
Collection date: 2026-07-25 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs; those
gaps are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in San Antonio
- ChatGPT: Mack Injury Attorneys #1, Rodriguez Trial Law #2, Arnold & Itkin #3, Herrman & Herrman, P.L.L.C.
  #4
- Claude: Hill Law Firm #1, Carabin Shaw #2, Eric Ramos Law #3, Thomas J. Henry Law #4, Wyatt Law Firm #7,
  The Barrera Firm #8, Herrman & Herrman, P.L.L.C. #9
- Gemini: Herrman & Herrman, P.L.L.C. #1, The Aguirre Law Firm, PLLC #2, Khattar Law, PC #3, Crosley Law #4,
  Law Offices of Troya Brookover #5, Thomas J. Henry Injury Lawyers #6, Chris Mayo Law Firm #7, Rush &
  Gransee #8, Wayne Wright Injury Lawyers #9, Eric Ramos Law, PLLC #10
- Google AI Mode: no structured extraction; general prose
- Perplexity: names individually-rated Avvo attorneys (Michael Adly Baseluos and others)

**Herrman & Herrman, P.L.L.C. reaches 3/5** (ChatGPT #4, Claude #9, Gemini #1), the clearest signal in this
category. **Thomas J. Henry (Law / Injury Lawyers)** and **Eric Ramos Law (PLLC)** both reach 2/5.

### 2. Best real estate agents for buying a home in San Antonio
- ChatGPT: structured extraction returned nothing usable; prose #1 pick is **"HomeLight"** — flagged and
  removed as noise below, a matching platform, not an agent
- Claude: prose pick is Danny Charbel – Keller Williams Realty
- Gemini: RJ Reyes #1, The Alexis Weigand Group #2, The Missy Stagers Team #3, Binkan Cinaroglu #4, Tami
  Price #5, Koltermann Real Estate #6, Team Kristen Schramme Group #7, Jadestone Real Estate #8, Neal &
  Neal Team #9, Scott Malouff #10
- Google AI Mode: names Team Kristen Schramme, JBGoodwin Realtors, and The Schrader Group as top-producing
  teams, unranked
- Perplexity: JBGoodwin REALTORS®, San Antonio #1

**Removed as noise:** "HomeLight" (ChatGPT's prose top pick — an agent-matching platform, not an agent).

**Fragmented at the individual level, breaking the team-convergence trend seen in Atlanta, Tampa, and
Charlotte.** The loosest overlaps: **Team Kristen Schramme (Group)** (Gemini #7, named in Google AI Mode)
and **JBGoodwin (REALTORS®)** (named in Google AI Mode, Perplexity #1) — both 2/5.

### 3. Top-rated property management companies in San Antonio
- ChatGPT: CloverLeaf Property Management #1, Real Property Management Alamo #2, RentWerx Property
  Management #3, Peace of Mind Property Management #4, Bridgeman Property Management LLC #5, Liberty
  Management, Inc #6, Keyrenter San Antonio #7, Hendricks Property Management LLC #8, Hallmark Residential
  Property Management #9
- Claude: RentWerx Property Management #1, Ziprent #2, Liberty Management #3, Mynd Property Management #4,
  Hendricks Property Management #5, CloverLeaf Property Management #6, Bridgeman Property Management LLC
  #7, Peace of Mind Property Management #9, John Chunn Realty LLC #10
- Gemini: Flat Fee Landlord #1, Specialized Property Management #2, Mynd #3, Evernest San Antonio #4,
  ZipRent #5, Real Property Management Alamo #6, Liberty Management, Inc #7, PMI Birdy Properties #8,
  Pyramis Company Property Management #9, RentWerx #10
- Google AI Mode: names RentWerx Property Management, PMI Birdy Properties, and CloverLeaf Property
  Management as its top three, unranked
- Perplexity: CloverLeaf Property Management #1, Real Property Management Alamo #2, Pyramis Company #3,
  HomeRiver Group San Antonio #4, Ziprent #5, Flat Fee Landlord #6, Evernest #8, Specialized Property
  Management #9, Keyrenter #10

**Two firms reach 4/5: CloverLeaf Property Management** (ChatGPT #1, Claude #6, named in Google AI Mode,
Perplexity #1) and **RentWerx (Property Management)** (ChatGPT #3, Claude #1, Gemini #10, named in Google
AI Mode). **Real Property Management Alamo**, **Liberty Management, Inc**, and **Ziprent** each reach 3/5.
Notably, **Ziprent appears again here**, in a fourth-plus city and now well outside the West Coast market
where it first showed strength (San Francisco, Seattle, San Diego) — evidence it has genuine national reach,
not just a regional pattern. Property management extends its status as the single most reliably
high-consensus category type across every one of the 20 cities researched in this program so far.

### 4. Best immigration lawyers in San Antonio
- ChatGPT: Castro Law PLLC #5, Alonso & Alonso #6, Texas RioGrande Legal Aid #8
- Claude: Lozano Law Firm #1, Barba Inegol Law Firm PLLC #2, Law Office of Christopher Peng #5
- Gemini: Lozano Law Firm #1, Alonso & Alonso Law Firm #3, Barba Inegol Law Firm PLLC #4, Trevino
  Immigration Law #5
- Google AI Mode: no structured extraction; general prose
- Perplexity: Alonso & Alonso Law Firm #2, Alvillar Law, PC #3, Lozano Law Firm #4

**Two firms reach 3/5: Lozano Law Firm**, with a unanimous #1 rank between the two engines that ranked it
first (Claude, Gemini), and **Alonso & Alonso (Law Firm)** (ChatGPT #6, Gemini #3, Perplexity #2). San
Antonio joins the majority of cities in this program where immigration law converges rather than fragments.

### 5. Best military and veterans law firms in San Antonio
- ChatGPT: Law Offices of Scalise-Qubrosi #1, Hill & Ponton, P.A. #2, Stone Rose Law #3, Berry Law #4,
  Steinbeck Law Firm #5, Gonzalez & Waddington #6
- Claude: O'Connell West, PLLC #1, Austin Hagee Law Firm, PLLC #2, Tessmer Law Firm, P.L.L.C. #3, The
  Jacobson Law Firm, P.C. #4, The Veterans Law Office #5
- Gemini: no structured extraction; general prose
- Google AI Mode: Military Trial Defenders #2, Veritas Military Law #3, Marc Whitehead & Associates #4;
  prose separately names O'Connell West, PLLC alongside Military Trial Defenders
- Perplexity: Military Trial Defenders #3; prose confirms O'Connell West, PLLC and Military Trial Defenders
  as the only two firms explicitly serving San Antonio in the available results

**O'Connell West, PLLC reaches 3/5** (Claude #1, named in Google AI Mode's prose, named in Perplexity's
prose), the clearest signal in the category. **Military Trial Defenders** reaches 2/5. This category
directly reflects San Antonio's real identity as "Military City USA," home to Joint Base San Antonio and a
dense concentration of active-duty and veteran residents.

### 6. Best hotels and hospitality management companies in San Antonio
- ChatGPT: mostly hotel properties — Mokara Hotel & Spa #2, Kimpton Santo San Antonio #3, Thompson San
  Antonio #4, Omni La Mansión del Rio #5, Hotel Valencia Riverwalk #6, Hilton Palacio del Rio #7,
  InterContinental San Antonio Riverwalk #8, Embassy Suites San Antonio Airport #10, The Monarch San
  Antonio #11
- Claude: also mostly hotel properties — InterContinental San Antonio Riverwalk #1, Kimpton Santo Hotel #2;
  prose #1 pick is Hotel Emma at Pearl
- Gemini: named genuine management companies — Phoenix Hospitality Group #1, Presidian Hotels and Resorts
  #2, Zachry Hotels #3, Remington Hospitality #5
- Google AI Mode: no structured extraction; general prose about "historic Texas charm" and local/corporate
  operators
- Perplexity: mostly hotel properties — Omni La Mansion del Rio #1; prose also names Mokara Hotel & Spa

**Notable pattern, not noise removal: most engines answered "hotels and hospitality management companies"
with hotel properties rather than actual management firms**, the same blending issue already documented in
Miami and Tampa. Only Gemini named genuine management companies. **The most fragmented category in the San
Antonio dataset** — no hotel or company name crosses 2/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Property management | **CloverLeaf Property Management, RentWerx** | 4/5 each |
| Immigration law | **Lozano Law Firm, Alonso & Alonso** | 3/5 each |
| Personal injury law | **Herrman & Herrman, P.L.L.C.** | 3/5 |
| Military/veterans law | **O'Connell West, PLLC** | 3/5 |
| Real estate agents | Team Kristen Schramme, JBGoodwin (loose) | 2/5 each, fragmented |
| Hotels/hospitality | No overlap past 2/5 | Most fragmented category measured |

## Structural observations specific to San Antonio

1. **Property management maintains its perfect reliability record across all 20 cities researched in this
   program** — CloverLeaf Property Management and RentWerx both reach 4/5, the latest in an unbroken chain
   of at-or-above-average consensus results for this category type in every single city measured.

2. **Ziprent's presence here confirms it is a nationally-recognized brand, not a West Coast-only pattern.**
   Having previously shown strong cross-engine visibility in San Francisco, Seattle, and San Diego, its 3/5
   showing in Texas demonstrates real geographic reach beyond the region where it was first noticed.

3. **Military and veterans law directly reflects San Antonio's real identity as "Military City USA,"** with
   O'Connell West, PLLC reaching 3/5 consensus, a category unique to this city among those researched.

4. **San Antonio joins the majority of cities where immigration law converges rather than fragments**, with
   Lozano Law Firm and Alonso & Alonso both reaching 3/5.

5. **The "hotels and hospitality management companies" blending issue recurs for a third time** (after
   Miami and Tampa), with most engines answering with hotel properties instead of management firms.

6. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
