# Minneapolis AI Visibility Research — Findings

Client: `research-minneapolis` (client_id 42), plan `pro`, market `US` / region `MSP`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run — read before the category breakdowns:** Google AI Mode's
collection returned `status: error` on 4 of the 6 prompts (personal injury, real estate, immigration law,
and medical device/healthcare law). This is a genuine collection failure, the same kind of technical error
already documented for Google AI Mode in Seattle's dataset, not evidence of zero AI visibility. Only the
property management and corporate law prompts returned usable Google AI Mode responses. Consensus figures
for the first, second, fourth, and fifth categories below are scored out of the 4 engines that actually
responded. This run used **Google AI Mode** in place of the retired **Meta AI** engine used in the earlier
city pages.

## Category-by-category

### 1. Best personal injury law firms in Minneapolis
- ChatGPT: Robins Kaplan LLP #1, Schwebel, Goetz & Sieben, P.A. #2, Lindell & Lavoie, LLP #3, Keller, Woods
  & Thompson, P.A. #4, Michael Schultz Law Firm #5, The Conlin Law Firm #6
- Claude: Schwebel, Goetz & Sieben, P.A. #1, Hall Law Personal Injury Attorneys #3, Nicolet Law #4,
  Meshbesher & Associates #5
- Gemini: Schwebel, Goetz & Sieben, P.A. #1, Goldenberg Lauricella, PLLC #2, SiebenCarey #3, Meshbesher &
  Spence #4, TSR Injury Law #5
- Google AI Mode: collection error, no data
- Perplexity: Schwebel, Goetz & Sieben, P.A. #1, Morgan & Morgan #2; prose also names Nicolet Law

**Schwebel, Goetz & Sieben, P.A. reaches every one of the 4 responding engines** (ChatGPT #2, Claude #1,
Gemini #1, Perplexity #1), with a unanimous #1 rank among 3 of the 4 — the strongest single result in the
Minneapolis dataset.

### 2. Best real estate agents for buying a home in Minneapolis
- ChatGPT: Kris Lindahl Real Estate #2, Real Estate Simplified #4
- Claude: prose #1 pick is Artemisa Boston; structured — Kris Lindahl Real Estate #5
- Gemini: no structured extraction; general prose
- Google AI Mode: collection error, no data
- Perplexity: declined to name any agent, citing no current search results to verify

**Kris Lindahl Real Estate reaches 2/4**, the only overlap in an otherwise fragmented category, consistent
with nearly every city researched.

### 3. Top-rated property management companies in Minneapolis
- ChatGPT: Residential Property Management, Inc #1, DRG #2, Kleinman Property Management #3, Bigos
  Management #4, Lohn/Paulno Property Management #5, Minnestay #6, FuzeRE Property Management #7
- Claude: Kleinman Property Management #1, Home Rental Systems #2, Rental Management Guys #3
- Gemini: Guardian Property Management #1, UpDown Property Management #2, FirstService Residential #3, Real
  Property Management Viking #5, Kleinman Property Management #6
- Google AI Mode: names Guardian Property Management, UpDown Property Management, and Kleinman Property
  Management as its top three, unranked
- Perplexity: Guardian Property Management #1, Kleinman Property Management #2, DRG Property Management #3,
  Home Rental Systems #4, Level 10 Property Management #5, FirstService Residential Minneapolis #6

**Full 5/5 unanimous presence: Kleinman Property Management** appears in every one of the 5 engines'
responses (ChatGPT #3, Claude #1, Gemini #6, named in Google AI Mode, Perplexity #2) — the category's
umpteenth full-consensus result across this research program. **Guardian Property Management** reaches 3/5.

### 4. Best immigration lawyers in Minneapolis
- ChatGPT: Mai N. Moua Law #3, KB Law PLLC #4, Davis Immigration Lawyers #5, Wilson Law Group #6, Immigrant
  Law Center of Minnesota #7, Mid-Minnesota Legal Aid #8, Volunteer Lawyers Network #9
- Claude: prose #1 pick is Scott M. Borene – Borene Law Firm, P.A.; structured — Davis & Goldfarb
  Immigration Lawyers #3, Steven C. Thal, P.A. #4, AMA Law Group PLLC #6
- Gemini: Wilson Law Group #8, Davis Immigration Lawyers, PLLC #9, Ostrom Law Office #10
- Google AI Mode: collection error, no data
- Perplexity: structured extraction captured **Justia #3** and **Avvo #4** — both flagged and removed as
  noise below; prose names individually-rated Avvo attorneys instead

**Removed as noise:** "Justia" and "Avvo" (Perplexity #3-4 — attorney-rating directories, not law firms).

**Fragmented among the 4 responding engines.** The loosest overlaps: **Wilson Law Group** (ChatGPT #6,
Gemini #8) and **Davis Immigration Lawyers** (ChatGPT #5, Gemini #9) — both 2/4.

### 5. Best medical device and healthcare law firms in Minneapolis
- ChatGPT: DuVal & Associates #1, Thompson PLLC #2, Faegre Drinker #3, Maslon LLP #4, Bowman and Brooke #5,
  Nelson Mullins #6, Norton Rose Fulbright #7, Stinson LLP #8, Winthrop & Weinstine #9, Fox Rothschild #10
- Claude: Stinson LLP #1, Foley & Lardner LLP #2, Meshbesher & Spence #3, Blackwell Burke P.A. #4, Meagher +
  Geer #5, Kelley, Wolter & Scott, P.A. #6
- Gemini: Bassford Remele #1, Dorsey & Whitney LLP #2, Fredrikson & Byron PA #3, Fox Rothschild LLP #4,
  Hogan Lovells US LLP #5, Jones Day #6, Lathrop GPM LLP #7, Stinson LLP #8, Winthrop & Weinstine PA #9,
  Taft #10
- Google AI Mode: collection error, no data
- Perplexity: declined, citing insufficient search results (the only relevant hit was a general product-
  liability attorney page)

**Stinson LLP reaches 3/4** (ChatGPT #8, Claude #1, Gemini #8), the clearest signal in this category —
Stinson is a genuine Minneapolis-based firm, and this result reflects the city's dense medtech/healthcare
corporate legal market.

### 6. Best corporate law firms in Minneapolis
- ChatGPT: Dorsey & Whitney LLP #1, Fredrikson & Byron, P.A. #3, Ballard Spahr LLP #4, Taft #5, Stinson LLP
  #6, Lathrop GPM #7, Winthrop & Weinstine, P.A. #8, Maslon LLP #9, Henson Efron #10
- Claude: Taft Law #1, Lockridge Grindal Nauen P.L.L.P. #2, Lommen Abdo Law Firm #3, Fabyanske Westra Hart &
  Thomson #4, Felhaber Larson #5, Madigan, Dahl & Harlan, P.A. #6, Greenberg Traurig, LLP #7, Engelmeier &
  Umanah #9
- Gemini: Dorsey & Whitney LLP #1, Fredrikson & Byron, P.A. #2, Cozen O'Connor #3, Taft #4, Ballard Spahr
  LLP #5, Stinson LLP #6, Maslon LLP #7, Barnes & Thornburg #8, Lathrop GPM #9, Fafinski, Mark & Johnson,
  P.A. #10
- Google AI Mode: Dorsey & Whitney LLP #1, Faegre Drinker #2, Fredrikson & Byron, P.A. #3, Ballard Spahr LLP
  #4, Taft #5, Maslon LLP #7
- Perplexity: Barnes & Thornburg LLP #1 (only firm named, with a general reference to Best Law Firms'
  20-firm Minneapolis corporate-law ranking)

**The densest multi-firm consensus measured in this research program: five separate firms all reach 3/5 or
higher.** **Taft** leads at 4/5 (ChatGPT #5, Claude #1, Gemini #4, Google AI Mode #5). **Dorsey & Whitney
LLP** reaches 3/5 with a unanimous #1 rank wherever ranked (ChatGPT, Gemini, Google AI Mode). **Fredrikson &
Byron, P.A.**, **Ballard Spahr LLP**, and **Maslon LLP** each independently reach 3/5 too. This directly
reflects Minneapolis's real identity as one of the densest Fortune 500 headquarters markets in the US
(Target, UnitedHealth Group, Best Buy, 3M, U.S. Bancorp, and General Mills are all headquartered in the
metro area).

## Cross-engine consensus table (summary)

Note: categories 1, 2, 4, and 5 are scored out of 4 engines (Google AI Mode's collection failed on those
prompts); categories 3 and 6 are scored out of 5.

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Property management | **Kleinman Property Management** | 5/5, full unanimous presence |
| Corporate law | **Taft** (plus 4 more firms at 3/5) | 4/5 |
| Personal injury law | **Schwebel, Goetz & Sieben, P.A.** | 4/4 of responding engines |
| Medical device/healthcare law | **Stinson LLP** | 3/4 of responding engines |
| Immigration law | Wilson Law Group, Davis Immigration Lawyers (loose) | 2/4 each, fragmented |
| Real estate agents | Kris Lindahl Real Estate (loose) | 2/4, most fragmented |

## Structural observations specific to Minneapolis

1. **Corporate law is the densest multi-firm consensus category measured anywhere in this research
   program** — five separate firms (Taft, Dorsey & Whitney, Fredrikson & Byron, Ballard Spahr, and Maslon)
   all reach 3/5 or higher simultaneously, directly reflecting Minneapolis's unusually high concentration of
   Fortune 500 headquarters.

2. **Kleinman Property Management's full 5/5 unanimous presence extends property management's status** as
   the single most reliably high-consensus category type across every city researched in this program.

3. **Google AI Mode's collection failed on 4 of 6 prompts this run**, a genuine technical error disclosed
   directly rather than treated as "no opinion," matching how Seattle's Google AI Mode failure was handled.

4. **Two directory/rating platforms were misidentified as law firms** ("Justia," "Avvo") and removed as
   noise.

5. **Individual real estate agents and immigration law remain the most fragmented categories**, consistent
   with nearly every city researched.
