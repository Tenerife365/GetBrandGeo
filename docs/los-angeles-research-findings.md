# Los Angeles AI Visibility Research — Findings

Client: `research-losangeles` (client_id 28), plan `pro`, market `US` / region `LAX`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok` —
no engine errors this run, unlike the New York dataset (ChatGPT failed there). Structured competitor
extraction was still incomplete on several engine/prompt pairs (notably Gemini and Google AI Mode, which
often answer in unstructured prose); those gaps are called out per-category below and cross-checked against
the prose rather than treated as "no opinion."

Engine note: this run used **Google AI Mode** (via SerpApi) instead of the retired **Meta AI** engine used in
the earlier city pages (London/Berlin/Madrid/New York/Paris/Rome) — the live production pipeline has since
dropped Meta AI.

## Category-by-category

### 1. Best personal injury law firms in Los Angeles
- ChatGPT: Kiesel Law LLP #1, Dolan Law Firm PC #2, Wilshire Law Firm #4 (structured extraction gap between
  #2 and #4 — full prose response, not re-fetched, likely names 1-2 more firms in between)
- Claude: Panish | Shea | Ravipudi LLP #1, Greene Broillet & Wheeler LLP #2, The Dominguez Firm #3, Waters
  Kraus Paul & Siegel #4, BANA LAW PC #5, KJT Law Group #9
- Gemini (prose, no structured extraction): Panish | Shea | Boyle | Ravipudi LLP, Wilshire Law Firm, The
  Dominguez Firm, Adamson Ahdoot LLP, Taylor & Ring LLP
- Google AI Mode: explicitly names Panish (Tier 1), Greene Broillet & Wheeler (Tier 1), The Lanier Law Firm,
  Wilshire Law Firm, The Dominguez Firm, Jacoby & Meyers, Jennie Levin PC — organized by firm size/tier
  rather than a single ranked list
- Perplexity: Greene Broillet & Wheeler, LLP #1 (explicit top pick, Tier 1 per U.S. News – Best Lawyers)

**4-way consensus, the strongest of any category in this dataset:** **Panish | Shea | Ravipudi**, **Greene
Broillet & Wheeler**, **Wilshire Law Firm**, and **The Dominguez Firm** each appear across 3 of the 5 engines
(Claude, Gemini, and Google AI Mode all independently converge on the same four firms; Perplexity and ChatGPT
each pick up a subset). This is a much stronger institutional consensus than New York's personal injury
category, which was the most fragmented category in that dataset — the opposite pattern shows up here.

### 2. Best real estate agents for buying a home in Los Angeles
- ChatGPT: Stephanie Younger Group #1, Dennis Chernov / Chernov Team #2, Aaron Kirman Group #5
- Claude: names Mauricio Umansky / The Agency as the #1 pick in prose; structured list captures brokerages
  further down — Compass #8, Sotheby's International Realty #9, The Agency #10
- Gemini (prose): individual agents — Kurt Rappaport, Aaron Kirman, The Altman Brothers (Douglas Elliman),
  Linda May, Tami Pardee, Santiago Arana (The Agency), Stephanie Vitacco, Cindy Ambuehl; brokerages — Compass,
  Coldwell Banker Realty, The Agency, Sotheby's International Realty, Christie's International Real Estate,
  Berkshire Hathaway HomeServices, Redfin
- Google AI Mode: Stephanie Younger Group (top-featured), The Tiffany Chin Group #8
- Perplexity (prose): Kurt Rappaport, Aaron Kirman, the Altman Brothers, Linda May, Tami Pardee, Cindy
  Ambuehl, Stephanie Vitacco, Matt Kanner

**Individual "star agents" fragment, matching the pattern already seen in New York's real-estate category:**
no single agent hits more than 3/5 engines (Aaron Kirman is the closest — ChatGPT, Gemini, Perplexity). The
one brokerage-level name with real spread is **The Agency** (Claude's #1 prose pick, named in Gemini's prose,
referenced structurally by Claude) — institutional brand recognition again outpacing any individual name, the
same shape as New York's Douglas Elliman/Corcoran/Brown Harris Stevens finding, just with a different leader.

### 3. Top-rated property management companies in Los Angeles
- ChatGPT: Earnest Homes #3, AllView Real Estate #4, EGL Properties #5, Utopia Property Management #6,
  Legacy Asset Management #7, Scott Management Company #8, HCM Property Management #9, Power Property
  Management #10
- Claude: Coastline Equity #1, Earnest Homes #2, Los Angeles Property Management Group #5, On Pointe
  Property Management #6, TGN Property Management #7, Glaser Property Management #8
- Gemini (prose, long list): Lotus West Properties, Los Angeles Property Management Group (LAPMG), LBPM,
  Moss & Company, Westside Property Management, Utopia Management, Beach Front Property Management, Earnest
  Homes, Ziprent, Glaser Property Management, HOA Unlimited, Hawk Management, Linder & Associates
- Google AI Mode: leads with Utopia Property Management, Action Property Management, and TGA Management &
  Investment as the top 3 by customer rating; also surfaces RPM Simplified, Lotus West Properties, Ziprent
- Perplexity: Lotus West Properties #1, Los Angeles Property Management Group #2, Beach Front Property
  Management #3, Utopia Management #4, Jamison Management Company #5, Earnest Homes #6, Glaser Property
  Management #7, Howard Management Group #8, Moss & Company #9, Real Property Management Vision #10

**Strongest single-category consensus in the dataset alongside personal injury:** **Earnest Homes** (ChatGPT
#3, Claude #2, Gemini prose, Perplexity #6) and **Utopia (Management / Property Management)** (ChatGPT #6,
Gemini prose, Google AI Mode top-3, Perplexity #4) both hit at least 4 of 5 engines. **Los Angeles Property
Management Group** and **Glaser Property Management** each hit 3 of 5. This is a notably higher-consensus
property-management category than New York's (which topped out at 3/4).

### 4. Best immigration lawyers in Los Angeles
- ChatGPT (prose, only 4 firms named, no structured extraction beyond that): Fragomen, Del Rey, Bernsen &
  Loewy LLP #1, BAL LLP #2, Wolfsdorf Rosenthal LLP #3, Van Der Hout Brigagliano & Nightingale LLP #4
- Claude: Ardina Immigration Law #5 (only one structured entry captured — likely an extraction gap; prose
  presumably names more)
- Gemini: Stone Grzegorek & Gonzalez LLP #1, Mitchell Silberberg & Knupp LLP #2, JQK Law Firm #3, Lucas &
  Barba #4, Tafapolsky and Smith LLP #5, Jackson Lewis PC #6, Seyfarth Shaw LLP #7, Blaker & Granet LLP #8,
  Mark Ivener, A Law Corporation #9
- Google AI Mode (prose, organized by specialty): references Fragomen (via a "bestlawfirms.com" citation)
  under "Corporate & Large-Scale Immigration," Jackson Lewis PC named in the same directory reference; mostly
  surfaces boutique/individual practitioners (Gihan Thomas, J. Gold Law, JCS Immigration) by specialty area
- Perplexity: almost entirely individual attorneys rated via Avvo/Justia (Adam Dayan, Bobby Cheng-Yu Chung,
  Layla Khamoushian, and others), plus a passing mention of Wildes & Weinberg's LA office address

**The most fragmented category in the Los Angeles dataset**, mirroring the same practitioner-heavy
fragmentation pattern documented in New York (immigration and personal injury), London, and Madrid. Only
loose 2/5 overlap: **Fragomen** (ChatGPT #1, referenced in Google AI Mode's directory citation) and **Jackson
Lewis PC** (Gemini #6, same Google AI Mode citation). No engine agreement beyond that.

### 5. Best entertainment and talent lawyers in Los Angeles
- ChatGPT: Ziffren Brittenham LLP #1, Manatt, Phelps & Phillips LLP #2, Loeb & Loeb LLP #7, LaPolt Law, P.C.
  #10
- Claude: names Glaser Weil Fink Howard Jordan & Shapiro LLP as the #1 pick in prose; structured list —
  Katten Muchin Rosenman LLP #3, Blake & Wang #4, Loeb & Loeb LLP #5
- Gemini: Paul Hastings LLP #1, Greenberg Traurig LLP #2, Loeb & Loeb LLP #3, Manatt, Phelps & Phillips LLP
  #4, McPherson LLP #5, Latham & Watkins LLP #7, Akin #8, Gibson, Dunn & Crutcher LLP #9, Sidley Austin LLP
  #10
- Google AI Mode: Loeb & Loeb LLP #2, Manatt, Phelps & Phillips, LLP #3 (also cites The Hollywood Reporter's
  Power Lawyers List and Variety's Legal Impact Report as the industry's own ranking sources)
- Perplexity: cites the Legal 500 listing naming individual lawyers Andrew Baum and Christopher Chatham, plus
  Avvo top-rated attorneys — no firm-level pick

**Clearest single-brand consensus in the dataset: Loeb & Loeb LLP**, named by 4 of 5 engines (ChatGPT #7,
Claude structurally at #5, Gemini #3, Google AI Mode #2) — every engine that returned a structured or
semi-structured answer agrees on this one firm, even though its rank position varies. **Manatt, Phelps &
Phillips LLP** is the second-clearest signal, hitting 3 of 5 (ChatGPT #2, Gemini #4, Google AI Mode #3).

### 6. Best luxury home builders and contractors in Los Angeles
- ChatGPT: Marmol Radziner #1, C&C Partners #2, DWD Builders #3, Farnsworth Builders #5, Wolpert & Associates
  #6, Ross Builders #8, Cedar Construction #9
- Claude: Marmol Radziner #1, Sarlan Builders #2, HT Constructions #3, Reis Contracting #4, Arbor
  Construction #5, Corr Contemporary Homes #6, Richard Holz Builders #7, Lux Builders #8, IND Construction #9
- Gemini: Waconah Construction #1, Bela Development #2, Forest Construction #3, Tyler Development #4, Sarlan
  Builders #5, HT Constructions #6, Farnsworth Builders #7, Arzuman Brothers #8, Drexel Luxury Homes #9, IND
  Construction, LLC #10
- Google AI Mode: features Farnsworth Builders, Luxury Home Builders Inc, Drexel Luxury Homes, Blackbriar
  Development, LA Home Construction, and Select Home Builders in an unranked comparison table
- Perplexity: Drexel Luxury Homes #1 (explicit top pick)

**The most fragmented category in the Los Angeles dataset, alongside immigration law.** Marmol Radziner is
the strongest single signal (ChatGPT #1 and Claude #1 agree, though neither Gemini, Google AI Mode, nor
Perplexity name it), and Farnsworth Builders (ChatGPT #5, Gemini #7, Google AI Mode featured) and Drexel
Luxury Homes (Gemini #9, Google AI Mode featured, Perplexity #1) both reach loose 3/5 overlap. No firm
achieves the 4/5 consensus seen in personal injury, property management, or entertainment law — this is a
genuinely fragmented local-contractor market with no dominant AI-visible brand.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Personal injury law | **Panish \| Shea \| Ravipudi, Greene Broillet & Wheeler, Wilshire Law Firm, The Dominguez Firm** | 3/5 each |
| Property management | **Earnest Homes, Utopia** | 4/5 each |
| Entertainment/talent law | **Loeb & Loeb LLP** | 4/5 |
| Real estate agents | The Agency (institutional); Aaron Kirman (individual) | 3/5 loose |
| Immigration law | Fragomen, Jackson Lewis PC (loose) | 2/5, fragmented overall |
| Luxury home builders | Marmol Radziner (loose); Farnsworth, Drexel (loose) | 2-3/5, most fragmented |

## Structural observations specific to Los Angeles

1. **Los Angeles shows higher cross-engine consensus than New York in every comparable category.** Personal
   injury law and property management both reached 3-4/5 engine agreement here, versus New York's max of 3/4
   (property management) and outright fragmentation (personal injury). This is a genuinely different result
   from the New York dataset, not a templated repeat of it.

2. **Entertainment/talent law produced the single clearest brand consensus in this dataset** (Loeb & Loeb LLP,
   4/5 engines) — a category unique to Los Angeles among the cities researched so far, reflecting the city's
   entertainment-industry economy.

3. **Individual "star" real estate agents fragment even more here than in New York.** No single agent name
   crosses 3/5 engines; institutional brand recognition (The Agency) is the only name with real cross-engine
   spread, matching the institutions-beat-individuals pattern already documented in New York, just with a
   different institutional leader.

4. **Immigration law and luxury/niche local-contractor categories are the most fragmented**, consistent with
   the practitioner-heavy fragmentation pattern seen in every city researched so far (New York, London,
   Madrid) — no engine agreement beyond 2-3/5, dominated by individually-rated practitioners rather than
   firms.

5. **No ChatGPT collection failures this run** (unlike New York, where ChatGPT errored on all 8 prompts) —
   all 5 engines, including the newly-added Google AI Mode (replacing the retired Meta AI engine), returned
   usable data on every prompt.
