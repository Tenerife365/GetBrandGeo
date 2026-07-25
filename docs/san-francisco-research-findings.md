# San Francisco AI Visibility Research — Findings

Client: `research-sanfrancisco` (client_id 38), plan `pro`, market `US` / region `SFO`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs
(especially the immigration and real-estate prompts); those gaps are cross-checked against prose
per-category below. This run used **Google AI Mode** in place of the retired **Meta AI** engine used in the
earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in San Francisco
- ChatGPT: Walkup, Melodia, Kelly & Schoenberger #1, The Veen Firm LLP #2, Dolan Law Firm PC #3, The Brandi
  Law Firm #4, Bostwick & Associates #5, Altair Law #7, Danko Meredith #8, Scarlett Law Group #9, Abramson
  Smith Waldsmith LLP #10
- Claude: Walkup, Melodia, Kelly & Schoenberger #1, Rouda Feder Tietjen & McGuinn #2, Coopers LLP #3, Hassell
  Law Group #4, Minami Tamaki LLP #5
- Gemini: no structured extraction; general prose
- Google AI Mode: names Walkup, Melodia, Kelly & Schoenberger, Dolan Law Firm, and Bostwick & Associates as
  its top three, unranked
- Perplexity: structured list starts at #2 (Hooshmand Law Group), #3 (The Hassell Law Group), #4 (Law
  Offices of J. Chrisp), #5 (Halavanau Law Office, P.C.) — the #1 pick is cut off in the raw response

**Walkup, Melodia, Kelly & Schoenberger reaches 3/5 with a unanimous #1 rank wherever ranked** (ChatGPT #1,
Claude #1, named first by Google AI Mode).

### 2. Best real estate agents for buying a home in San Francisco
- ChatGPT: no structured extraction; general prose
- Claude: prose #1 pick is Neal Ward, described as "the #1 individual agent per RealTrends"
- Gemini: Pacific Edge Real Estate #1, Compass Real Estate #2, The Krishnan Team #9
- Google AI Mode: names Ruth Krishnan, Danielle Lazier, and Christopher Lee as top-rated, all cited at a
  perfect 5.0-star rating
- Perplexity: names Danielle Lazier, Samantha Huang, Wilson Leung, Simon Shue, and Laura Kaufman from Yelp's
  "Top 10 Best Real Estate Agents" list

**Fragmented, consistent with almost every city researched (Atlanta remains the sole full exception).** The
loosest overlaps: **Danielle Lazier** (Google AI Mode, Perplexity) and the **Krishnan name** (Gemini's "The
Krishnan Team," Google AI Mode's "Ruth Krishnan") — both 2/5.

### 3. Top-rated property management companies in San Francisco
- ChatGPT: Ziprent #1, George Goodwin Realty #2, Jackson Group #3, Tenant Planet #4, Extramile Property
  Management Company #5
- Claude: BanCal Property Management #1, Gordon Property Management #2, Chandler Properties #3, Leading
  Properties #4, Azari Property Management #7, PMI San Francisco #8, GBA Realty #9, Axis Property
  Management #10
- Gemini: Ziprent Property Management #1, MarinOak Management #2, KeyOpp Property Management #4, The SF
  Property Management #5, Azari Property Management #8, Doorstead #9
- Google AI Mode: no structured extraction; prose focuses on rent-control/eviction-protection compliance
- Perplexity: Ziprent #1, Azari Property Management #2, Advent Properties, Inc #3, Gordon Property
  Management #4, KeyOpp Property Management & Investments #5, ReLISTO #6, Omni Real Estate #7, Doorstead #8,
  Tishman Speyer #9, Seabreeze Management Company #10

**Two firms reach 3/5: Ziprent** (ChatGPT #1, Gemini #1, Perplexity #1 — unanimous #1 wherever ranked) and
**Azari Property Management** (Claude #7, Gemini #8, Perplexity #2). Property management continues its
reliable-consensus pattern across every city researched in this program.

### 4. Best immigration lawyers in San Francisco
- ChatGPT: no structured extraction; prose recommends the SF Bar Association's Lawyer Referral Service as a
  first stop rather than naming firms directly
- Claude: prose #1 pick is Sharon M. Dulberg, an individual attorney
- Gemini: no structured extraction; general prose
- Google AI Mode: Van Der Hout LLP #1 (structured); prose separately names "KPB Immigration Law Firm, Van
  Der Hout LLP, and The Law Offices of Robert Jobe"
- Perplexity: names individually-rated Avvo attorneys (John Qumars Khosravi, Flomy Javier Diza, Wilson
  Purves, and others)

**The most fragmented category in the San Francisco dataset** — no firm or attorney name repeats across any
two engines, and ChatGPT didn't name any specific practitioner at all.

### 5. Best venture capital and startup law firms in San Francisco
- ChatGPT: Cooley #1, Wilson Sonsini Goodrich & Rosati #2, Fenwick & West #3, Gunderson Dettmer #4, Goodwin
  Procter #5, Orrick #6, Morrison Foerster #7, DLA Piper #8, Perkins Coie #9, WilmerHale #10
- Claude: Cooley LLP #1, Fenwick & West #2, Goodwin Procter #3, Inventus Law #5
- Gemini: Cooley LLP #1, Wilson Sonsini Goodrich & Rosati #2, Fenwick & West LLP #3, Goodwin Procter LLP #4,
  Silicon Legal Strategy #5
- Google AI Mode: structured extraction captured only Fenwick & West #5; prose describes "Elite BigLaw &
  Technology Powerhouses" as a category
- Perplexity: Gunderson Dettmer #1, Wilson Sonsini Goodrich & Rosati #2, Cooley LLP #3, Silicon Legal
  Strategy #4, **Avvo #5** (flagged and removed as noise below, a directory site, not a law firm)

**Removed as noise:** "Avvo" (Perplexity #5).

**San Francisco's standout category, alongside startup accounting: two firms both reach 4/5. Cooley (LLP)**
is named by ChatGPT #1, Claude #1, Gemini #1, and Perplexity #3 — a near-unanimous #1 pick. **Fenwick &
West** is independently named by ChatGPT #3, Claude #2, Gemini #3, and Google AI Mode #5. **Wilson Sonsini
Goodrich & Rosati** and **Goodwin Procter** both reach 3/5. This category directly reflects San Francisco/
Silicon Valley's real identity as the center of US startup and venture-capital legal work.

### 6. Best startup accounting and tax firms in San Francisco
- ChatGPT: Kruze Consulting #1, Burkland #2, Gillingham CPA #5, Asnani CPA #6
- Claude: Kruze Consulting #1, BPM LLP #3, Gillingham CPA #4, Asnani CPA Tax & Accounting #5, Startup Tandem
  #6, Basta & Company #7
- Gemini: Kruze Consulting #1, Asnani CPA Tax & Accounting #2, Safe Harbor LLP #3, Gillingham CPA #4, Advise
  LLP, CPA Firm #5, KB Financial Advisors #6
- Google AI Mode: names Kruze Consulting explicitly as "the best startup accounting and tax firm in San
  Francisco," described as "100% dedicated to venture capital-backed startups" and managing "over 800
  companies"
- Perplexity: Kruze Consulting #1, Punch Financial #2

**Full 5/5 unanimous #1 — the cleanest, single strongest result measured in this expanded research program
so far: Kruze Consulting.** Every one of the 5 engines names it #1, with no exceptions and no competing #1
pick from any engine. This is the third full-unanimous-#1 result found across the whole city-research
series (after Houston Methodist and Mass General Brigham), and the first in a non-healthcare category.
**Gillingham CPA** and **Asnani CPA (Tax & Accounting)** both reach 3/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Startup accounting/tax | **Kruze Consulting** | 5/5, unanimous #1 |
| VC/startup law | **Cooley, Fenwick & West** | 4/5 each |
| Property management | **Ziprent, Azari Property Management** | 3/5 each |
| Personal injury law | **Walkup, Melodia, Kelly & Schoenberger** | 3/5, unanimous #1 where ranked |
| Real estate agents | Danielle Lazier / Krishnan name (loose) | 2/5, fragmented |
| Immigration law | No overlap at all | Most fragmented category measured |

## Structural observations specific to San Francisco

1. **San Francisco's startup economy is exceptionally well reflected in AI consensus** — three related
   categories (startup accounting, and two views into VC/startup law) all produced top-tier results: Kruze
   Consulting's full 5/5 unanimous #1, and Cooley/Fenwick & West both at 4/5. This is the strongest
   economy-reflects-consensus alignment found in this research program, more concentrated than any single
   city measured so far (Los Angeles/entertainment, Chicago/corporate law, Houston/energy, Atlanta/logistics,
   DC/lobbying, Boston/biotech each had one standout category; San Francisco effectively has three).

2. **Kruze Consulting's result is the first full-unanimous-#1 consensus found outside healthcare** in this
   entire program (Houston Methodist and Mass General Brigham were the prior two, both hospital systems).

3. **Immigration law and individual real estate agents remain the most fragmented categories**, consistent
   with the majority of cities researched.

4. **No ChatGPT collection failures this run**, consistent with every US city researched except New York.
   All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned usable data on
   every prompt.
