# Seattle AI Visibility Research — Findings

Client: `research-seattle` (client_id 39), plan `pro`, market `US` / region `SEA`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run — read before the category breakdowns:** Google AI Mode's
collection returned `status: error` on 5 of the 6 prompts (personal injury, real estate, property
management, immigration law, and technology/software law). This is a genuine collection failure, the same
kind of technical error documented for ChatGPT in the original New York dataset, not evidence Google AI
Mode has zero visibility for Seattle brands. Only the coffee-roasters prompt returned a usable Google AI
Mode response. Every consensus figure below for the first 5 categories is out of the 4 engines that actually
responded (ChatGPT, Claude, Gemini, Perplexity), not 5. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Seattle
- ChatGPT: Dubin Law Group #1, Davis Law Group #2, Pendergast Law #3, Herrmann Law Group #4, Pfau Cochran
  Vertetis Amala PLLC #5, Seattle Injury Law #6, Friedman Rubin #7
- Claude: Dubin Law Group #1, Davis Law Group #2, Adler Giersch PS #3, Pendergast Law #4, Elk + Elk #5,
  Sharpe Law Firm #6, Emerald City Law Group #7
- Gemini: Stritmatter Law #1, Dubin Law Group #2, Bernard Law Group #3, GLP Attorneys #4, Menzer Law Group
  #5, Schroeter Goldmark & Bender #6
- Google AI Mode: collection error, no data
- Perplexity: Stritmatter Kessler Koehler Moore #1, Dubin Law Group #2, Seattle Injury Law #3, Menzer Law #4

**Dubin Law Group reaches every one of the 4 responding engines** (ChatGPT #1, Claude #1, Gemini #2,
Perplexity #2) — full presence among the engines that returned usable data, the strongest result in the
Seattle dataset.

### 2. Best real estate agents for buying a home in Seattle
- ChatGPT: structured extraction captured only Every Door Real Estate #7; prose #1 pick is "Every Door Real
  Estate / Every Door Team"
- Claude: prose #1 pick is Matt Stark – Windermere Real Estate
- Gemini: Lucas Pinto Real Estate Group #3, Sankari Realty #9
- Google AI Mode: collection error, no data
- Perplexity: declined to name any agent, citing no current search results to verify

**No overlap across any two engines, the most fragmented category in the Seattle dataset**, consistent with
almost every city researched.

### 3. Top-rated property management companies in Seattle
- ChatGPT: Real Property Associates #1, SJA Property Management #2, Ziprent #4, Seattle Property Management
  Associates #5, Pillar Properties #6, Security Properties #7, Equity Residential #8, AvalonBay #9, AMLI
  Residential #10, CWS Apartment Homes #11
- Claude: Ziprent #1, Ballard Realty & Property Management #2, GPS Renting #3, Maple Leaf Property
  Management #6, RPA Property Management #7, The Joseph Group #8, AHC Property Management #9
- Gemini: SJA Property Management #1, Brink Property Management #2, Emerald Door Property Management #3,
  Haven Property Management #4, Mynd Property Management #5, Ziprent Property Management #6, Lori Gill &
  Associates #7, Real Property Associates #8, GPS Renting #9, Belong #10
- Google AI Mode: collection error, no data
- Perplexity: Ziprent #1, Maple Leaf Property Management #2, Full Service Property Management #3, SJA
  Property Management #4, Dwellings Seattle Property Management #5, Belong #7

**Ziprent reaches every one of the 4 responding engines** (ChatGPT #4, Claude #1, Gemini #6, Perplexity #1),
the same full-presence result already seen for Ziprent in the San Francisco dataset — this brand is proving
to have real West Coast-wide AI visibility, not just a single-city result. **SJA Property Management** also
reaches 3/4 (ChatGPT #2, Gemini #1, Perplexity #4).

### 4. Best immigration lawyers in Seattle
- ChatGPT: Gibbs Houston Pauw #1, Watson Immigration Law #2, Orbit Law / Kripa Upadhyay #4, ERM Immigration
  Law #5, Stroupe Law #6
- Claude: Gibbs Houston Pauw #1, Rosche Immigration Law #5, Erin Cipolla Immigration Law #6, Metz Law Group
  PLLC #7, Carney & Marchi, P.S. #8
- Gemini: only Cowan Miller & Lederman PS #9 and Gibbs Houston Pauw #10 captured (extraction gap)
- Google AI Mode: collection error, no data
- Perplexity: names individually-rated Avvo attorneys (Jerilynn Gonzales, Charles Learned Ala Medina, Kevin
  Lederman, Devin T. Theriot-Orr, Diyora Ismailova)

**Gibbs Houston Pauw reaches 3/4**, with a unanimous #1 rank between ChatGPT and Claude (also present,
though ranked lower, in Gemini). No other overlap — otherwise fragmented, consistent with most cities
researched.

### 5. Best technology and software law firms in Seattle
- ChatGPT: Perkins Coie LLP #1, Davis Wright Tremaine LLP #2, Wilson Sonsini Goodrich & Rosati #3, Fenwick
  #4, Knobbe Martens #5, K&L Gates LLP #6, Shook, Hardy & Bacon LLP #7, Summit Law Group PLLC #8, Hintze
  Law PLLC #9, Matesky Law #10
- Claude: Perkins Coie LLP #1, Davis Wright Tremaine LLP #2, Wilson Sonsini Goodrich & Rosati #3, Cooley LLP
  #4, K&L Gates #5, Hintze Law PLLC #9, Knobbe Martens #10
- Gemini: a very different, more generalist list — Harris Bricken #1, Van Ness Feldman LLP #2, Foster
  Garvey PC #3, Buchalter #4
- Google AI Mode: collection error, no data
- Perplexity: Davis Wright Tremaine LLP #2 (only firm captured)

**Davis Wright Tremaine LLP reaches 3/4 with an identical #2 rank across all three engines that named it**
(ChatGPT, Claude, Perplexity). **Perkins Coie LLP** reaches 2/4 but with a unanimous #1 rank between ChatGPT
and Claude. Both firms are genuine Seattle-headquartered anchors, reflecting the city's real technology
legal market — Gemini's very different, more generalist answer stands out as an outlier here.

### 6. Best coffee roasters and cafes in Seattle
- ChatGPT: Elm Coffee Roasters #1, Espresso Vivace #2, Herkimer Coffee #3, Lighthouse Roasters #4, Olympia
  Coffee #5
- Claude: Victrola Coffee Roasters #1, Lighthouse Roasters #2, Herkimer Coffee #3, Anchorhead Coffee #7,
  Monorail Espresso #8
- Gemini: Victrola Coffee Roasters #1, Espresso Vivace #2, Zoka Coffee #3, Anchorhead Coffee #4, Herkimer
  Coffee #5, Slate Coffee Roasters #6, Caffè Vita #7, Analog Coffee #8, Milstead & Co #9, Ghost Alley
  Espresso #10
- Google AI Mode: no structured extraction (the only prompt where Google AI Mode actually returned data
  this run); prose describes Seattle's "vibrant specialty coffee scene" generally
- Perplexity: Elm Coffee Roasters #1, Victrola Coffee Roasters #2, Espresso Vivace #3, Fulcrum Coffee #4,
  Onda #5

**The only category this run where Google AI Mode returned usable data, and a genuinely dense three-way
consensus: Victrola Coffee Roasters** (Claude #1, Gemini #1, Perplexity #2 — unanimous #1 between Claude and
Gemini), **Espresso Vivace** (ChatGPT #2, Gemini #2, Perplexity #3), and **Herkimer Coffee** (ChatGPT #3,
Claude #3, Gemini #5) all reach 3/5. A fun, genuine reflection of Seattle's real coffee-culture identity.

## Cross-engine consensus table (summary)

Note: categories 1-5 are scored out of 4 engines (Google AI Mode's collection failed); category 6 is scored
out of 5 (the only prompt where it responded).

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Personal injury law | **Dubin Law Group** | 4/4 (of responding engines) |
| Property management | **Ziprent** | 4/4 (of responding engines) |
| Coffee roasters/cafes | **Victrola Coffee Roasters, Espresso Vivace, Herkimer Coffee** | 3/5 each |
| Immigration law | **Gibbs Houston Pauw** | 3/4 (of responding engines) |
| Technology/software law | **Davis Wright Tremaine LLP** | 3/4 (of responding engines), identical rank |
| Real estate agents | No overlap at all | Most fragmented category measured |

## Structural observations specific to Seattle

1. **Google AI Mode's collection failed on 5 of 6 prompts this run** — a genuine technical error, disclosed
   here rather than treated as "no opinion," the same handling New York's ChatGPT failure received in the
   original city-research series.

2. **Ziprent shows real cross-city AI visibility on the West Coast**, reaching full presence among
   responding engines in both San Francisco and Seattle's property-management categories — not a
   single-city fluke but a genuine regional pattern worth tracking.

3. **Seattle's real technology-law economy shows up clearly**: Perkins Coie and Davis Wright Tremaine, both
   genuine Seattle-headquartered firms, are the two clearest signals in the technology/software law
   category, ahead of the national names (Wilson Sonsini, Cooley, Fenwick) that also appear.

4. **Coffee roasters and cafes is a fun, genuinely dense consensus category**, reflecting Seattle's real
   coffee-culture identity — three separate names all reaching 3/5 in the one category where all data
   collected cleanly.

5. **Individual real estate agents remain the most fragmented category**, consistent with nearly every city
   researched.
