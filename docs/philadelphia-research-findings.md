# Philadelphia AI Visibility Research — Findings

Client: `research-philadelphia` (client_id 33), plan `pro`, market `US` / region `PHL`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs (Claude,
Gemini, Google AI Mode, and Perplexity each had at least one prompt with no structured list); those gaps are
cross-checked against prose per-category below. This run used **Google AI Mode** in place of the retired
**Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Philadelphia
- ChatGPT: Kline & Specter #1, Anapol Weiss #3, Cohen, Placitella & Roth PC #4, Saltz Mongeluzzi Bendesky
  #5, The Beasley Firm #9, Marrone Law Firm #10, The Duffy Firm #11
- Claude: Kline & Specter, P.C. #1, Reiff Law Firm #2, Fox Law, P.C. #3, Marino Associates #5, Kats, Jamison
  & Associates #6, Schrom, Shaffer & Botel, P.C. #7, The Levin Firm #8
- Gemini: Ross Feller Casey, LLP #1, The Levin Firm #2, Reiff Law Firm #3, Anapol Weiss #4, Lundy Law LLP #5
- Google AI Mode: structured extraction only captured MyPhillyLawyer #6; prose leads with "Kline & Specter,
  Ross Feller Casey, The Levin Firm, Philly Injury Attorneys (KaplunMarx), and MyPhillyLawyer"
- Perplexity: no structured extraction; prose references the "Best Law Firms" Philadelphia ranking generally

**Kline & Specter reaches 3/5 with a unanimous #1 rank wherever a rank was given** (ChatGPT #1, Claude #1,
named first in Google AI Mode's prose). **The Levin Firm** also reaches 3/5 (Claude #8, Gemini #2, named in
Google AI Mode's prose).

### 2. Best real estate agents for buying a home in Philadelphia
- ChatGPT: Rarity Real Estate Team #1, ERGO Real Estate #4, InTown Real Estate Group #5, Maria Quattrone &
  Associates #8
- Claude: no structured extraction; prose #1 pick is Val F. Nunnenkamp Jr.
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; prose references "Philly Home Collective"
- Perplexity: declined to name any agent, stating it lacks current search results to verify

**Zero overlap across any two engines, the most fragmented category in the Philadelphia dataset**, consistent
with every other city researched — individual real estate agents remain the hardest category for any single
name to achieve cross-engine consensus.

### 3. Top-rated property management companies in Philadelphia
- ChatGPT: Grow Property Management #1, Otter Property Management #2, Bay Property Management Group
  Philadelphia #3, Skyline Property Management #4, PhillyLiving Management Group #5, RPM Properties #6, Solo
  Real Estate #8
- Claude: TrustArt Realty #1, HomeRiver Group Philadelphia #2, Bay Property Management Group #3, Grow
  Property Management #4, Skyline Property Management #5, Otter Management #7
- Gemini: TrustArt Realty #1, Otter Property Management #2, TCS Management #3, HomeRiver Group #4, Bay
  Property Management Group Philadelphia #5, JG Real Estate #6, Skyline Property Management #7, Prosperity
  Property Management #8, Keyrenter Property Management Main Line #9
- Google AI Mode: no structured extraction; prose categorizes companies without a clean list in the captured
  snippet
- Perplexity: Otter Property Management #1, TrustArt Realty #2, Bay Property Management Group #3, Grow
  Property Management #4, **Zillow #6** (flagged as noise below), PhillyLiving Management Group #8, Solo Real
  Estate #9

**Removed as noise:** "Zillow" (Perplexity #6 — a listing platform, not a property manager).

**Two firms reach 4/5, another strong result for this category type: Otter Property Management** (ChatGPT
#2, Claude #7, Gemini #2, Perplexity #1) and **Bay Property Management Group** (ChatGPT #3, Claude #3, Gemini
#5, Perplexity #3). **TrustArt Realty** and **Grow Property Management** both reach 3/5.

### 4. Best immigration lawyers in Philadelphia
- ChatGPT: Palladino, Isbell & Casazza, LLC #1, Rosa Barreca / Barreca Law #4
- Claude: prose #1 pick is Elise A. Fialkowski; structured — Palladino, Isbell & Casazza, LLC #2, Hunter Yost
  Law #3, MC Law Group, LLC #8
- Gemini: only Klasko Immigration Law Partners, LLP #10 captured (extraction gap)
- Google AI Mode: no structured extraction; prose names "Palladino, Isbell & Casazza, LLC, Law Offices of
  Dizengoff and Yost, and Getson & Schatz PC"
- Perplexity: structured extraction captured **Justia #2** and **Avvo #3** — flagged as noise below, both are
  attorney-review directories, not law firms; prose separately names individual attorneys (Peter J. Thompson,
  Christopher Michael Casazza, and others)

**Removed as noise:** "Justia" and "Avvo" (Perplexity #2-3 — attorney-rating directories, not law firms).

**Philadelphia is the third city in this research program (after Chicago and Miami) where immigration law
shows real consensus instead of fragmenting: Palladino, Isbell & Casazza, LLC reaches 3/5** (ChatGPT #1,
Claude #2, named first in Google AI Mode's prose). The emerging pattern across the whole program is now
roughly split: New York, Los Angeles, Houston, and Dallas show fragmentation, while Chicago, Miami, and
Philadelphia show real convergence.

### 5. Best hospital systems in Philadelphia
- ChatGPT: Penn Medicine #1, Jefferson Health #2, Main Line Health #3, Temple Health #4, CHOP #5, Penn
  Presbyterian Medical Center #6, Pennsylvania Hospital #7, Chester County Hospital #8, Princeton Medical
  Center #9, Thomas Jefferson University Hospital #10
- Claude: prose #1 pick is Penn Medicine (University of Pennsylvania Health System); structured — Jefferson
  Health #2, Children's Hospital of Philadelphia #3, Main Line Health #4, Temple Health #5, **Healthgrades
  #7** (flagged as noise below, a ratings site, not a hospital)
- Gemini: Penn Medicine #1, Thomas Jefferson University Hospitals-Jefferson Health #2, Temple University
  Hospital #3, Fox Chase Cancer Center #4, Children's Hospital of Philadelphia #5, Riddle Hospital #6, Paoli
  Hospital #7, Lankenau Medical Center #9, Bryn Mawr Hospital #10
- Google AI Mode: structured extraction captured Jefferson Health #1 and Temple Health #2; prose explicitly
  states "the top hospital systems in Philadelphia are Penn Medicine, Jefferson Health, and Temple Health"
  and that "Hospital of the University of Pennsylvania-Penn Presbyterian is ranked as the #1 hospital in both
  Philadelphia and Pennsylvania"
- Perplexity: Penn Medicine #1, Jefferson Health #2, Main Line Health #3

**Removed as noise:** "Healthgrades" (Claude #7 — a hospital-ratings website, not a hospital system).

**The strongest result in this entire research program: two brands simultaneously reach full 5/5 unanimous
consensus. Penn Medicine** is named #1 by ChatGPT, Gemini, and Perplexity, is Claude's explicit #1 prose
pick, and is confirmed by name in Google AI Mode's prose as the #1-ranked hospital in Philadelphia and
Pennsylvania — appearing in all 5 responses. **Jefferson Health** is independently named by all 5 engines
too (ChatGPT #2, Claude #2, Gemini #2, Google AI Mode #1 structurally, Perplexity #2). This surpasses Houston
Methodist's single-brand 5/5 result (the previous strongest measured) by achieving it for *two* brands in
the same category at once. **Temple Health** also reaches 4/5.

### 6. Best university admissions consultants in Philadelphia
- ChatGPT: only C. McManus Consulting #5 and Empowerly #8 captured (extraction gap)
- Claude: Solomon Admissions Consulting #1, College Transitions #2, Quad Education Group #3, IvySummit
  College Consulting #4, Club Z! Tutoring of Philadelphia #5, Legacy College & Career Prep #6
- Gemini: Solomon Admissions Consulting #1, Bentham Admissions #2, Quad Education #3, College Transitions
  #4, Ivy Summit College Consulting #5, My Admissions Sherpa #6, Ivy Experience #7
- Google AI Mode: Premier College Prep #1, My Admissions Sherpa, LLC #2, Legacy College & Career Prep #3,
  Solomon Admissions Consulting #5, IvySummit #6
- Perplexity: Bentham Admissions #1, Legacy College and Career Prep #2, My Admissions Sherpa #3

**Solomon Admissions Consulting reaches 3/5**, named #1 by both Claude and Gemini and present in Google AI
Mode's list. **IvySummit College Consulting** and **My Admissions Sherpa** both also reach 3/5. A solid
consensus result for a niche local-services category.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Hospital systems | **Penn Medicine, Jefferson Health** | 5/5 each, both fully unanimous |
| Property management | **Otter Property Management, Bay Property Management Group** | 4/5 each |
| Personal injury law | **Kline & Specter** | 3/5, unanimous #1 where ranked |
| Immigration law | **Palladino, Isbell & Casazza, LLC** | 3/5 |
| University admissions consultants | **Solomon Admissions Consulting, IvySummit, My Admissions Sherpa** | 3/5 each |
| Real estate agents | No overlap at all | 0/5, most fragmented |

## Structural observations specific to Philadelphia

1. **The hospital-systems result is the strongest measured in this entire research program.** Two brands
   (Penn Medicine and Jefferson Health) both reached full 5/5 unanimous consensus in the same category
   simultaneously, surpassing Houston Methodist's single-brand 5/5 result (previously the strongest found).

2. **Philadelphia is the third city where immigration law converged rather than fragmented**, following
   Chicago and Miami. The program-wide pattern for this category is now close to an even split: New York,
   Los Angeles, Houston, and Dallas show fragmentation; Chicago, Miami, and Philadelphia show real
   consensus.

3. **Property management again produced two firms at 4/5**, extending its status as the single most
   reliable high-consensus category type across every city researched so far in this program.

4. **Two directory/ratings platforms were misidentified as businesses** in this run: "Zillow" (property
   management prompt) and "Justia" / "Avvo" (immigration-law prompt), all flagged and removed as noise.

5. **No ChatGPT collection failures this run**, consistent with every other US city researched except New
   York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data
   on every prompt.
