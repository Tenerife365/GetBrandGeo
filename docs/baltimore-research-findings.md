# Baltimore AI Visibility Research — Findings

Client: `research-baltimore` (client_id 45), plan `pro`, market `US` / region `BAL`.
Collection date: 2026-07-25 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for a few engine/prompt pairs; those gaps
are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Baltimore
- ChatGPT: Belsky Weinberg & Horowitz LLC #2, Kerr McDonald LLP #4, Keilty Bonadio #5, Shugarman & Mehring
  #6, Pinder Plotkin Legal Team #7, Bekman Marder #8
- Claude: WGK Personal Injury Lawyers #1, Hyatt & Goldbloom #2, Hassan, Hassan & Tuchman, PA #3, Rice,
  Murtha & Psoras #4, Schochor, Staton, Goldberg and Cardea #5, Shugarman & Mehring #6, Jenner Law, P.C. #7
- Gemini: Silverman Thompson #1, Murphy, Falcon & Murphy #2, Ashcraft & Gerel #3, Hyatt & Goldbloom #4,
  Miller & Zois #5, Law Offices Alex Poberesky, P.A. #8
- Google AI Mode: no structured extraction; general prose
- Perplexity: Brown & Barron LLC #1, Silverman Thompson #2

**No firm reaches 3/5, fragmented.** The loosest overlaps: **Silverman Thompson** (Gemini #1, Perplexity
#2), **Hyatt & Goldbloom** (Claude #2, Gemini #4), and **Shugarman & Mehring** (ChatGPT #6, Claude #6, an
identical rank match between two engines) — all 2/5.

### 2. Best real estate agents for buying a home in Baltimore
- ChatGPT: no structured extraction; general prose
- Claude: prose #1 pick is Peter Boscas – Red Cedar Real Estate; structured extraction captured Cummings &
  Co. Realtors #10
- Gemini: no structured extraction; general prose
- Google AI Mode: names "Key Group of Cummings & Co. Realtors," The W Home Group, and SURE Group Real
  Estate as top options
- Perplexity: declined to name any agent, citing no live search results to verify

**Cummings & Co. Realtors reaches 2/5** (Claude #10, named in Google AI Mode), the only overlap in an
otherwise fragmented category, consistent with nearly every city researched.

### 3. Top-rated property management companies in Baltimore
- ChatGPT: Astoria Charm Property Management #1, Bay Property Management Group #2, Frank Property
  Management #3, Premier Property Management Investment, LLC #4, Canton Management Co #5, Blue Phoenix
  Property Management #6
- Claude: HomeRiver Group #1, Bay Property Management Group #2, Premier Property Management #3, Real
  Property Management #4, Home365 #5, HomeWorks Property Management #7
- Gemini: HomeRiver Group Baltimore #1, Bay Property Management Group #2, Chesapeake Property Management
  #3, HomeWorks Property Management #4, Blue Phoenix Property Management #5, Astoria Charm Property
  Management #6, Goddard Properties #7, Frank Property Management #8, Home365 #9, WPM Real Estate
  Management #10
- Google AI Mode: names Bay Property Management Group, RPR Property Management, LLC, and Port City
  Management as its top three by review volume
- Perplexity: Bay Property Management Group #1, Tidewater Property Management Inc #2, Morgan Properties #3,
  WPM Real Estate Management #4, Pelican Property Management Co #5, Thornhill Properties #6, HomeRiver
  Group Baltimore #7, Canton Management Co #8, Goddard Properties #9

**Full 5/5 unanimous presence: Bay Property Management Group** appears in every one of the 5 engines'
answers (ChatGPT #2, Claude #2, Gemini #2, named first in Google AI Mode's top three, Perplexity #1) — the
category's latest full-consensus result in a program where property management has now produced this
outcome repeatedly. **HomeRiver Group (Baltimore)** reaches 3/5.

### 4. Best immigration lawyers in Baltimore
- ChatGPT: Murthy Law Firm #1, Griffith Immigration Law #2, Patel Law Group #3, Collazo-Dingle Law #4, Nieto
  Law Office #6
- Claude: prose #1 pick is the Law Office of Raymond O. Griffith (Griffith Immigration Law); structured —
  Whitaker Legal #3, Silmi Law #5, Canto Legal #6, Puyang & Wu, LLC #7, Sheri Hoidra Law Office #8, Law
  Office of Maria Colon #9
- Gemini: Minikon Law, LLC #1, Griffith Immigration Law #2, Sheri Hoidra Law Office, LLC #3, Puyang & Wu,
  LLC #5, Nieto Law Office #6, St. Laurent & Associates #7, Romero Law, Inc #8
- Google AI Mode: names Griffith Immigration Law, Collazo-Dingle Law, LLC, and Molina Immigration Legal
  Services, LLC, unranked
- Perplexity: names individually-rated Avvo attorneys (Susan K. Han, Sandhya Tulshyan, and others)

**Griffith Immigration Law reaches 4/5** (ChatGPT #2, Claude's prose #1 pick, Gemini #2, named in Google AI
Mode) — Baltimore joins the growing list of cities where immigration law converges into real consensus
rather than fragmenting.

### 5. Best hospital systems in Baltimore
- ChatGPT: Johns Hopkins Medicine #1, University of Maryland Medical System #2, MedStar Health #3, GBMC
  HealthCare #4, LifeBridge Health #5
- Claude: Johns Hopkins Hospital #1, University of Maryland Medical Center #2, Johns Hopkins Bayview Medical
  Center #3, UM St. Joseph Medical Center #4, MedStar Union Memorial Hospital #5, Mercy Medical Center #7,
  Ascension St. Agnes Hospital #9
- Gemini: University of Maryland Medical Center #1, Mercy Medical Center #2, MedStar Union Memorial Hospital
  #3, Johns Hopkins Bayview Medical Center #4, Greater Baltimore Medical Center #5
- Google AI Mode: The Johns Hopkins Hospital #1, MedStar Union Memorial Hospital #2, MedStar Good Samaritan
  Hospital #4, Mercy Medical Center #5
- Perplexity: Johns Hopkins Medicine #1, University of Maryland Medical System #2, MedStar Health #3,
  MedStar Union Memorial Hospital #6, Johns Hopkins Bayview Medical Center #7, Greater Baltimore Medical
  Center #8, Mercy Medical Center #9

**The densest single-category result in the Baltimore dataset, and one of the strongest measured in this
research program: four separate health systems all reach 4/5 or higher.** **Johns Hopkins (Medicine /
Hospital)** is named #1 by ChatGPT, Claude, Google AI Mode, and Perplexity, with Gemini separately naming
its Bayview subsidiary — effectively 5/5. **University of Maryland Medical (System / Center)** reaches 4/5
(ChatGPT #2, Claude #2, Gemini #1, Perplexity #2). **MedStar** (via its Health brand or Union Memorial
Hospital subsidiary) appears across all 5 engines in some form. **Mercy Medical Center** reaches 4/5 (Claude
#7, Gemini #2, Google AI Mode #5, Perplexity #9). This directly and powerfully reflects Baltimore's real
identity as home to Johns Hopkins, one of the most globally recognized healthcare and research institutions.

### 6. Best biotech and life sciences law firms in Baltimore
- ChatGPT: DLA Piper #1, Hogan Lovells #2, Gordon Feinblatt LLC #3, Covington & Burling #9, Arnold & Porter
  #10
- Claude: Hogan Lovells #1, Saul Ewing LLP #2, Gordon Feinblatt LLC #3, Venable LLP #4, Miles & Stockbridge
  #5
- Gemini: DLA Piper #1, Hogan Lovells US LLP #2, Gordon Feinblatt LLC #3, Duane Morris LLP #4, Baker
  Donelson #5
- Google AI Mode: DLA Piper #1, Hogan Lovells #3, Miles & Stockbridge PC #4, Ballard Spahr #5, Venable LLP #6
- Perplexity: Gordon Feinblatt LLC #1, WilmerHale #3

**Two firms reach 4/5: Hogan Lovells** (ChatGPT #2, Claude #1, Gemini #2, Google AI Mode #3) and **Gordon
Feinblatt LLC** (ChatGPT #3, Claude #3, Gemini #3, Perplexity #1). **DLA Piper** reaches 3/5 with a unanimous
#1 rank wherever ranked (ChatGPT, Gemini, Google AI Mode). This category reflects Baltimore's real biotech
and life-sciences economy, closely tied to the Johns Hopkins research ecosystem.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Hospital systems | **Johns Hopkins, University of Maryland Medical System, MedStar, Mercy Medical Center** | 4-5/5 each |
| Property management | **Bay Property Management Group** | 5/5, full unanimous presence |
| Biotech/life sciences law | **Hogan Lovells, Gordon Feinblatt LLC** | 4/5 each |
| Immigration law | **Griffith Immigration Law** | 4/5 |
| Real estate agents | Cummings & Co. Realtors (loose) | 2/5, fragmented |
| Personal injury law | Silverman Thompson, Hyatt & Goldbloom (loose) | 2/5 each, fragmented |

## Structural observations specific to Baltimore

1. **Baltimore is one of the strongest overall cities measured in this research program.** Hospital
   systems, property management, biotech law, and immigration law all produced 4/5 or higher results,
   the densest multi-category strength seen in any city so far.

2. **The hospital-systems category shows the most extraordinary density measured**: four separate health
   systems (Johns Hopkins, University of Maryland Medical System, MedStar, and Mercy Medical Center) all
   reach 4/5 or higher simultaneously, directly reflecting Baltimore's real identity as home to one of the
   most globally recognized healthcare and research institutions in the world.

3. **Biotech and life sciences law also shows strong, multi-firm consensus** (two firms at 4/5, one more at
   3/5), reflecting the biotech ecosystem tied to the Johns Hopkins research corridor — a second category in
   the same city reflecting the same underlying economic strength.

4. **Baltimore joins the growing list of cities where immigration law converges into real consensus**
   rather than fragmenting, with Griffith Immigration Law reaching 4/5.

5. **Individual real estate agents and personal injury law remain the most fragmented categories**,
   consistent with the majority of cities researched.

6. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
