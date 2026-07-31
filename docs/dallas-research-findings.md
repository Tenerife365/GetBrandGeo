# Dallas-Fort Worth AI Visibility Research — Findings

Client: `research-dallas` (client_id 31), plan `pro`, market `US` / region `DAL`.
Collection date: 2026-07-24. 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode, Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for Google AI Mode on 3 prompts and
ChatGPT/Gemini on isolated prompts; those gaps are cross-checked against prose per-category below. This run
used **Google AI Mode** in place of the retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Dallas
- ChatGPT: only Anderson Injury Lawyers #6 and Arnold & Itkin #7 captured structurally (extraction gap;
  prose likely names more further up the list)
- Claude: Hamilton Wingo, LLP #1, Mullen & Mullen Law Firm #2, Arnold & Itkin #3, Waters Kraus Paul & Siegel
  #4, Simon Greenstone Panatier PC #5, Varghese Summersett #6
- Gemini: Hamilton Wingo, LLP #1, Mullen & Mullen Law Firm #2, Aldous Law #3, Waters Kraus Paul & Siegel #4,
  Simon Greenstone Panatier PC #5, The Hernandez Law Group, P.C. #6, The Barber Law Firm #7, Crain Brogdon,
  LLP #8, Thomas J. Henry Law #9
- Google AI Mode: no structured extraction; prose describes "high-volume & award-winning powerhouses"
- Perplexity: Hamilton Wingo #1, Mullen & Mullen #2, Thompson Law #3, Anderson Injury Lawyers #4, Benton
  Accident & Injury Lawyers #5

**The cleanest consensus in the Dallas dataset: Hamilton Wingo, LLP and Mullen & Mullen Law Firm are named
#1 and #2, in that exact order, by all three engines that returned a full ranked list** (Claude, Gemini,
Perplexity) — 3/5 each, with identical rank agreement, not just presence. **Waters Kraus Paul & Siegel** and
**Simon Greenstone Panatier PC** both reach 2/5 (Claude, Gemini).

### 2. Best real estate agents for buying a home in Dallas-Fort Worth
- ChatGPT: no structured extraction; prose #1 pick references "HomeLight top-agent match" — flagged as
  noise below, a matching tool, not an agent
- Claude: prose #1 pick is Lily Moore – Lily Moore Realty (Dallas); structured extraction captured **Dave
  Ramsey RamseyTrusted #6** and **HomeLight #9** — both flagged as noise below
- Gemini: Van Poole Properties Group #2, The McDonald Group #3, Chandler Crouch Realtors #8
- Google AI Mode: Ebby Halliday Real Estate #1, Briggs Freeman Sotheby's International Realty #2, Keller
  Williams Realty #3, Century 21 Judge Fite #4
- Perplexity: The Lauren Mitchell Group #1, Richard Alderman #3, Megan & Scott Hargrove Team #4, North Texas
  Home Advisors #5

**Removed as noise:** "HomeLight" (ChatGPT prose, Claude #9 — an agent-matching platform, not an agent) and
"Dave Ramsey RamseyTrusted" (Claude #6 — a referral/endorsement program, not an agent or brokerage itself).

**The most fragmented category measured in the Dallas dataset — no individual agent or brokerage name
repeats across any two engines.** Every one of the 5 engines names a completely different set of agents and
teams, a more extreme fragmentation than seen in New York, Los Angeles, Chicago, or Houston's equivalent
categories.

### 3. Top-rated property management companies in Dallas
- ChatGPT: Evernest Dallas #1, Specialized Property Management #2, JoGip Property Management #3, CW Sparks
  Management #4, Flat Fee Landlord #5, PMI DFW Properties #6, Uptown Dallas Properties #7, SBB Management
  Company #8
- Claude: Ashoka Lion Property Management #1, Westrom Group Property Management #2, JoGip Property
  Management #3, Keyrenter Uptown Dallas #4, McCaw Property Management #5, Blue Crown Properties #6, Butler
  Property Co #7, Common Ground Capital #8, M&D Real Estate #9
- Gemini: Real Property Management Meridian #2, Mynd #3, ZipRent #4, Evernest Dallas #5, Specialized
  Property Management #6, Keyrenter Uptown Dallas #7, Cole Group Property Management #8, Davis Property
  Management #9, JoGip Property Management #10
- Google AI Mode: names Keyrenter Uptown Dallas Property Management, AC Property Management LLC, Rent On
  Your Terms, and Real Property Management Ideal, without explicit ranks
- Perplexity: Evernest #1, ALNA Management #2, Real Property Management Ideal #3, Dallas Luxury Realty #4

**Three firms reach 3/5:** **JoGip Property Management** (ChatGPT #3, Claude #3, Gemini #10), **Evernest**
(ChatGPT #1, Gemini #5, Perplexity #1), and **Keyrenter Uptown Dallas** (Claude #4, Gemini #7, named in
Google AI Mode). Weaker than Chicago (5/5) and Houston (4/5), but still a real, above-average consensus for
this category type, extending the pattern seen across every city researched.

### 4. Best immigration lawyers in Dallas
- ChatGPT: Chavez & Valko, LLP #1, Pollak PLLC #2, The Presti Law Firm #3, Tidwell, Swaim & Farquhar, P.C. #4
- Claude: Davis & Associates #1, Huddleston Law Group #2, Song Law Firm #3, Verdin Law Firm #5, Law Office
  of Ify Ononogbu #6
- Gemini: only M Mathew Law Firm, PLLC #6 and Christensen Immigration Attorneys #7 captured (extraction gap)
- Google AI Mode: Akula & Associates P.C. #1, Badmus & Associates #2, Foster LLP #3, Law Office of Yovanna
  Vargas #4, Alonso & Alonso Law Firm #5, Mark E. Jacobs, P.C. #6; prose separately names "Davis & Associates,
  Chavez & Valko LLP, and Reina & Associates" as Tier 1 regionally-ranked firms
- Perplexity: declined to name any firm, stating it lacks current sourced data to responsibly do so

**Fragmented, consistent with every city researched except Chicago.** The loosest overlap: **Davis &
Associates** (Claude #1, corroborated in Google AI Mode's prose Tier-1 list) and **Chavez & Valko, LLP**
(ChatGPT #1, also in Google AI Mode's Tier-1 list) — both effectively 2/5. No firm reaches 3/5 in structured
form.

### 5. Best corporate relocation consultants in Dallas-Fort Worth
- ChatGPT: IMS Relocation #1, Beltmann Moving & Storage #2, Ward North American #3, Dallas Hub #6, VIP
  Transport #7
- Claude: Suddath #1, CENTURY 21 Mike Bowman, Inc #3 (a real estate brokerage, not a relocation firm — see
  note below), Black Tie Moving #4, Beltmann Moving and Storage #5, Condor Moving Systems #6, AB Moving &
  Storage #7, Craddock Moving & Storage #8
- Gemini: Allie Beth Allman & Associates #2 and Briggs Freeman Sotheby's International Realty #4 (both real
  estate brokerages, not relocation firms — same pattern as Claude), Beltmann Moving and Storage #6, Black
  Tie Moving #8, Dallas Moving #9, IMS Relocation #10
- Google AI Mode: names Corporate Relocation International (CRI), Suddath Relocation Systems, and Ebby
  Halliday's Corporate Real Estate Services division
- Perplexity: Suddath #1 (only firm named)

**Notable pattern, not noise removal: two engines (Claude, Gemini) blend luxury real estate brokerages into
"corporate relocation consultant" answers**, rather than sticking to moving/relocation-logistics companies.
Kept as reported since these are real, correctly-named businesses, just a genuine category-interpretation
difference between engines worth flagging. **Suddath** is the clearest consensus pick at 3/5 (Claude #1,
named in Google AI Mode, Perplexity #1). **Beltmann Moving & Storage** also reaches 3/5 (ChatGPT #2, Claude
#5, Gemini #6).

### 6. Best home builders in Dallas
- ChatGPT: Alford Homes #1, Winston Custom Homes #2, Fred Parker Company #3, Drees Custom Homes #5
- Claude: Desco Fine Homes #1, S&R Development #2, Southgate Homes #3, Shaddock Homes #4, C. Bowen Custom
  Homes #5, Dave R. Williams Homes #6, Double Door Custom Homes #7, J.D. Smith Custom Homes #8, Joe Kain
  Homes #9, Larry Hartman Construction #10
- Gemini: no structured extraction; general prose
- Google AI Mode: no structured extraction; prose describes categories of builder without specific names in
  the captured snippet
- Perplexity: names Toll Brothers, Shaddock Homes, Highland Homes, David Weekley Homes, and Hawkins-Welwood
  Homes together, without explicit ranking

**The most fragmented builder category measured (alongside Los Angeles' luxury home builders).** The only
overlap: **Shaddock Homes** (Claude #4, named by Perplexity) at 2/5. No other name repeats across any two
engines.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Personal injury law | **Hamilton Wingo, Mullen & Mullen** | 3/5 each, identical #1/#2 rank order |
| Property management | **JoGip, Evernest, Keyrenter Uptown Dallas** | 3/5 each |
| Corporate relocation | **Suddath, Beltmann Moving & Storage** | 3/5 each |
| Immigration law | Davis & Associates, Chavez & Valko (loose) | 2/5 each, fragmented |
| Home builders | Shaddock Homes (loose) | 2/5, most fragmented |
| Real estate agents | No overlap at all | 0/5 cross-engine repeats, most fragmented |

## Structural observations specific to Dallas-Fort Worth

1. **Dallas shows real, above-average consensus (3/5) across three separate categories, but nothing at the
   4-5/5 level seen in Chicago or Houston.** Personal injury law is the standout, with Hamilton Wingo and
   Mullen & Mullen agreeing not just on presence but on exact #1/#2 rank order across three engines.

2. **Real estate agents for buying a home is the single most fragmented category measured across every city
   researched so far in this program** — zero names repeat across any two engines, a more extreme
   fragmentation than New York, Los Angeles, Chicago, or Houston's equivalent categories.

3. **Two engines conflated real estate brokerages with "corporate relocation consultants"** (Claude, Gemini
   both named Allie Beth Allman & Associates / Briggs Freeman Sotheby's / CENTURY 21 Mike Bowman, all real
   estate agencies, not moving/relocation-logistics firms). Kept as reported since the businesses themselves
   are real, but flagged as a genuine engine-behavior quirk worth watching in future runs.

4. **Property management remains a reliably above-average consensus category across every city researched**
   (New York 3/4, Los Angeles 4/5, Chicago 5/5, Houston 4/5 twice, Dallas 3/5 three times), reinforcing this
   as a structural pattern of the research program rather than a one-off result.

5. **No ChatGPT collection failures this run**, consistent with Los Angeles, Chicago, and Houston, and
   unlike New York. All 5 engines, including Google AI Mode (replacing the retired Meta AI engine), returned
   usable data on every prompt.
