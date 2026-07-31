# Detroit AI Visibility Research — Findings

Client: `research-detroit` (client_id 43), plan `pro`, market `US` / region `DET`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs; those
gaps are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Detroit
- ChatGPT: Christensen Law #1, McKeen & Associates PC #2, Ven Johnson Law #3, Michigan Auto Law #4, Joel B.
  Sklar Law #5, Mike Morse Law Firm #6
- Claude: Mike Morse Law Firm #1, Buckfire Law #2, Michigan Auto Law #3, Sam Bernstein Law #4, Neumann Law
  Group #5, Fieger Law #6, Sommers Schwartz #7
- Gemini: Goodman & Acker P.C. #1, Ernst & Marko Law #2, Johnson Law PLC #3, Buckfire & Buckfire, P.C. #4,
  Mike Morse Law Firm #5, Sommers Schwartz, P.C. #6
- Google AI Mode: names Michigan Auto Law, Mike Morse Law Firm, and Buckfire Law as top-rated, unranked
- Perplexity: Buckfire & Buckfire, P.C. #1

**Two firms reach 4/5: Mike Morse Law Firm** (ChatGPT #6, Claude #1, Gemini #5, named in Google AI Mode)
and **Buckfire (Law / & Buckfire, P.C.)** (Claude #2, Gemini #4, named in Google AI Mode, Perplexity #1).
**Michigan Auto Law** reaches 3/5.

### 2. Best real estate agents for buying a home in Detroit
- ChatGPT: structured extraction captured **Zillow Agent Finder #1** and **Expertise.com / ThreeBestRated
  #5** — both flagged and removed as noise below, directory/review platforms, not real estate agents
- Claude: prose #1 pick is Garrett Blair – Berkshire Hathaway HomeServices; structured — Monzo Group #3,
  Match Realty, LLC #4, Munoz Realty Inc #5
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; general prose about neighborhood-specific expertise
- Perplexity: Match Realty LLC #1

**Removed as noise:** "Zillow Agent Finder" and "Expertise.com / ThreeBestRated" (ChatGPT #1, #5).

**Fragmented, consistent with nearly every city researched.** The only overlap: **Match Realty LLC** (Claude
#4, Perplexity #1), 2/5.

### 3. Top-rated property management companies in Detroit
- ChatGPT: JMZ Management #1, Marketplace Homes #3, NuHome Property Management #4, BRS Property Management
  #5, Evernest Property Management Detroit #6, Basic Property Management #7, Bedrock Detroit #8
- Claude: JLL #1, Evernest Property Management #2, JMZ Management #3, Taimerica Properties #5, R and B
  Property Management #6
- Gemini: F.B.P. Property Management LLC #1, JMZ Management #2, Nelson Property Management #3, Palladium
  Property Management #5, Real Property Management Metro Detroit #6, Reserve Management Company #7, Simply
  Managed #9
- Google AI Mode: names Modern Property Management, 311 Property Management, and Alvara Property
  Management LLC, unranked
- Perplexity: Nelson Property Management #1, Evernest #2, JMZ Property Management #3, Simply Managed
  Property Management #5, Sterling Group #7, D Land Group Property Management #8

**JMZ Management reaches 4/5** (ChatGPT #1, Claude #3, Gemini #2, Perplexity #3), extending property
management's status as the single most reliably high-consensus category type across every city researched
in this program. **Evernest (Property Management)** reaches 3/5.

### 4. Best immigration lawyers in Detroit
- ChatGPT: no structured extraction; prose #1 pick is cut off in the raw response ("Dagher K...")
- Claude: Jeelani Law Firm, PLC #1, Alan Reiter, PLLC #3, Antone, Casagrande & Adwers PC #5, Butzel Long #6
- Gemini: Jeelani Law Firm, PLC #1, Butzel Long #2, Immigration Law PLLC #3, Kerr, Russell and Weber PLC #4,
  Honigman LLP #5, Clark Hill PLC #6, J. Pernas Law, PLC #7
- Google AI Mode: names De Armas and De Armas Law, Law Office of Carine Saleh, and Walker & Associates,
  unranked
- Perplexity: names individually-rated Avvo attorneys (Nadia Langworthy, Michael Kasprzynski, Stanley K.
  Cheng, and others)

**Jeelani Law Firm, PLC reaches 2/5 with a unanimous #1 rank between the two engines that named it** (Claude,
Gemini). No firm reaches 3/5 — otherwise fragmented.

### 5. Best automotive and manufacturing law firms in Detroit
- ChatGPT: Dykema Gossett PLLC #1, Honigman LLP #2, Butzel Long #3, Foley & Lardner LLP #4, Bodman PLC #5,
  Miller Canfield #6, Clark Hill PLC #7, Jones Day #8, Bowman and Brooke LLP #9, Kotz Sangster Wysocki P.C.
  #10
- Claude: Butzel Long #1, Miller Canfield #2, Dickinson Wright #3, Honigman #4, Demorest Law Firm, PLLC #5,
  Miller Law Firm #6, Warner Norcross + Judd LLP #7, Olsman Mueller #8
- Gemini: Miller Canfield #1, Butzel Long #2, Foley & Lardner LLP #3, Dickinson Wright PLLC #4, Bodman PLC
  #5, Dykema Gossett PLLC #6, Varnum LLP #7
- Google AI Mode: names Miller Canfield, Butzel Long, Dykema Gossett, Honigman LLP, and Dickinson Wright as
  "preeminent" firms; structured extraction separately captured Foley & Lardner LLP #5, Clark Hill PLC #6,
  Bodman PLC #7
- Perplexity: declined to give a broader answer, naming only Michigan Auto Law (an auto-*accident* firm, not
  relevant to this B2B automotive/manufacturing category)

**The densest multi-firm consensus measured in this entire research program — seven separate firms all
reach 3/5 or higher at once. Butzel Long** leads at 4/5 (ChatGPT #3, Claude #1, Gemini #2, named
prominently in Google AI Mode). **Miller Canfield**, **Dykema Gossett (PLLC)**, **Honigman (LLP)**, **Bodman
PLC**, **Dickinson Wright (PLLC)**, and **Foley & Lardner LLP** each independently reach 3/5. This surpasses
Minneapolis's five-firm corporate-law consensus (the previous densest result) and directly reflects
Detroit's real identity as the historic center of the American automotive industry.

### 6. Best labor and employment law firms in Detroit
- ChatGPT: Butzel Long #1, Miller Canfield #3, Clark Hill #4, Ogletree Deakins #5
- Claude: Croson, Taub & Michaels, PLLC #1, NachtLaw #2, Joel B. Sklar Law #3, Wright Beamer #4, Kotz
  Sangster Wysocki P.C. #5, Sommers Schwartz, P.C. #6, Morgan & Morgan #7, Meroueh & Hallman LLP #8
- Gemini: Sommers Schwartz, P.C. #2, Foster Swift #3, Miller Johnson #4
- Google AI Mode: Miller Canfield #1, Butzel Long #4, Ogletree Deakins #6, Littler Mendelson P.C. #8,
  Honigman LLP #10
- Perplexity: declined a broader ranking, naming only Barris, Sott, Denn & Driker PLLC from Best Law Firms'
  rankings

**Fragmented, in sharp contrast to the automotive/manufacturing category despite overlapping firm names.**
The loosest overlaps: **Miller Canfield** (ChatGPT #3, Google AI Mode #1), **Butzel Long** (ChatGPT #1,
Google AI Mode #4), and **Ogletree Deakins** (ChatGPT #5, Google AI Mode #6) — all 2/5. This shows category
specificity matters more than firm prestige alone: the same firms that converge strongly for automotive/
manufacturing work show almost no agreement for general labor and employment work.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Automotive/manufacturing law | **Butzel Long** (plus 6 more firms at 3/5) | 4/5 |
| Personal injury law | **Mike Morse Law Firm, Buckfire** | 4/5 each |
| Property management | **JMZ Management** | 4/5 |
| Immigration law | Jeelani Law Firm, PLC (loose) | 2/5, fragmented |
| Labor/employment law | Miller Canfield, Butzel Long (loose) | 2/5 each, fragmented |
| Real estate agents | Match Realty LLC (loose) | 2/5, most fragmented |

## Structural observations specific to Detroit

1. **Automotive and manufacturing law is the densest multi-firm consensus category measured in this entire
   research program**, surpassing Minneapolis's five-firm corporate-law consensus. Seven separate firms
   (Butzel Long, Miller Canfield, Dykema Gossett, Honigman, Bodman, Dickinson Wright, and Foley & Lardner)
   all independently reach 3/5 or higher, directly reflecting Detroit's real identity as the historic center
   of the American automotive industry.

2. **The same firms that dominate automotive/manufacturing law show almost no consensus for general labor
   and employment law**, despite significant overlap in the named firms — a clear demonstration that
   category specificity, not just firm prestige, drives cross-engine AI consensus.

3. **Property management again produced a 4/5 result** (JMZ Management), extending its status as the
   single most reliably high-consensus category type across every city researched in this program.

4. **Two directory/review platforms were misidentified as real estate agents** ("Zillow Agent Finder,"
   "Expertise.com / ThreeBestRated") and removed as noise.

5. **Individual real estate agents and immigration law remain the most fragmented categories**, consistent
   with the majority of cities researched.

6. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
