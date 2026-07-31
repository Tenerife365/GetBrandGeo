# Denver AI Visibility Research — Findings

Client: `research-denver` (client_id 41), plan `pro`, market `US` / region `DEN`.
Collection date: 2026-07-24 (approx). 6 prompts × 5 engines (ChatGPT, Claude, Gemini, Google AI Mode,
Perplexity).

**Data-quality note applying to the whole run:** all 30 rows (6 prompts × 5 engines) returned `status: ok`,
no engine errors. Structured competitor extraction was incomplete for several engine/prompt pairs; those
gaps are cross-checked against prose per-category below. This run used **Google AI Mode** in place of the
retired **Meta AI** engine used in the earlier city pages.

## Category-by-category

### 1. Best personal injury law firms in Denver
- ChatGPT: Bachus & Schanker #1, The Wilhite Law Firm #3, Bendinelli Law Firm, P.C. #4, Matlin Injury Law
  #6, Schatten Law Firm #7
- Claude: prose #1 pick is Denver Personal Injury Lawyers®; structured — Bachus & Schanker #3, Gerash
  Steiner, P.C. #4, Front Range Injury Attorneys #6, Beem & Isley, P.C. #7, The Wilhite Law Firm #8
- Gemini: Harding & Associates, P.C. #1, Zaner Law Personal Injury Lawyers #2, Bachus & Schanker #3, Dan
  Caplis Law #4, Denver Trial Lawyers #5
- Google AI Mode: no structured extraction; general prose
- Perplexity: Denver Personal Injury Lawyers® #1, Ramos Law #2

**Bachus & Schanker reaches 3/5** (ChatGPT #1, Claude #3, Gemini #3), the clearest signal in this category.
**Denver Personal Injury Lawyers®** reaches 2/5 (Claude's prose #1 pick, Perplexity #1).

### 2. Best real estate agents for buying a home in Denver
- ChatGPT: Wisdom Real Estate #1, Ed Prather Real Estate #5
- Claude: structured extraction captured only **Agent Pronto #5** — flagged and removed as noise below, a
  matching service, not an agent; prose #1 pick is Thomas Ullrich – RE/MAX Masters Inc.
- Gemini: no structured extraction; general prose
- Google AI Mode: structured extraction captured only LIV Sotheby's International Realty #7; prose names
  "The Schlichter Team (Compass)"
- Perplexity: declined to name any agent, referencing Yelp's directory generally

**Removed as noise:** "Agent Pronto" (Claude #5 — an agent-matching service, not a real estate agent).

**No overlap across any two engines, the most fragmented category in the Denver dataset**, consistent with
nearly every city researched.

### 3. Top-rated property management companies in Denver
- ChatGPT: Keyrenter Property Management Denver #2, Colorado Realty and Property Management #3, Great
  Denver Rentals #4, Integrity Realty & Management #5, Real Property Management Colorado #6, Whole Property
  Management #7, Nomad Lease Denver #8
- Claude: Grace Property Management #1, Colorado Realty and Property Management #2, Pioneer Property
  Management #3, Aggus Realty #5, My Haven #6, Northpoint Asset Management #7
- Gemini: Keyrenter Property Management Denver #1, Pioneer Property Management #2, PMI Elevation Denver
  Property Management #3, Mynd Property Management #4, Evernest Property Management #8, Whole Property
  Management #9, Real Property Management Colorado #10
- Google AI Mode: names Pioneer Property Management, Whole Property Management, and Real Property
  Management Colorado, without explicit ranks
- Perplexity: My Haven #1, Nomad #2, Pioneer Property Management #4, Evernest Denver #5, Real Property
  Management Colorado #6

**Two firms reach 4/5: Pioneer Property Management** (Claude #3, Gemini #2, named in Google AI Mode,
Perplexity #4) and **Real Property Management Colorado** (ChatGPT #6, Gemini #10, named in Google AI Mode,
Perplexity #6). **Whole Property Management** also reaches 3/5. Property management extends its status as
the single most reliably high-consensus category type across every city researched.

### 4. Best immigration lawyers in Denver
- ChatGPT: Hernandez & Associates, P.C. #1, Meyer Law Office, P.C. #2, MyRights Immigration Law Firm #3,
  Moro Legal LLC #4, Ramos Immigration Law #5, Novo Legal Group #6
- Claude: prose #1 pick is Shawn D. Meade, an individual attorney; structured — Reed Immigration LLC #3,
  Shaftel Law #4, Moro Legal LLC #5, Novo Legal Group #7, Hernandez & Associates, P.C. #9
- Gemini: Joseph & Hall P.C. #1, Palmer Polaski PC #2, Moro Legal, LLC #3, Alma Immigration #4
- Google AI Mode: names Palmer Polaski PC, My Rights Immigration Law Firm, and The Law Office of Michael J.
  McCarroll, unranked
- Perplexity: names individually-rated Avvo attorneys (Andrew Steven Trexler, Alyssa C. Reed, and others)

**Moro Legal LLC reaches 3/5** (ChatGPT #4, Claude #5, Gemini #3), the clearest single signal. No other name
crosses 2/5.

### 5. Best energy and natural resources law firms in Denver
- ChatGPT: Brownstein Hyatt Farber Schreck #1, Womble Bond Dickinson #2, Holland & Knight #3, Greenberg
  Traurig #4, Holland & Hart #5, Davis Graham #7, Gibson Dunn #10
- Claude: Davis Graham & Stubbs LLP #1, Beatty & Wozniak, P.C. #2, Williams, Weese, Pepple & Ferguson #3,
  Womble Bond Dickinson #4, Jones & Keller, P.C. #5, Fairfield and Woods, P.C. #6, Lewis Ringelman P.C. #7,
  Snell & Wilmer L.L.P. #8
- Gemini: Davis Graham & Stubbs LLP #1, Holland & Hart LLP #2, BakerHostetler #3, Bryan Cave Leighton
  Paisner LLP #4, Greenberg Traurig, LLP #5, Gibson, Dunn & Crutcher LLP #6, Haynes and Boone LLP #7, Squire
  Patton Boggs #8, Steptoe & Johnson PLLC #9, Jost Energy Law P.C. #10
- Google AI Mode: Davis Graham & Stubbs LLP #1, Holland & Hart LLP #3, BakerHostetler LLP #4, Womble Bond
  Dickinson US LLP #5
- Perplexity: Brownstein Hyatt Farber Schreck LLP #1, Kaplan Kirsch LLP #2, Williams, Weese, Pepple &
  Ferguson #3, Jost Energy Law PC #4

**A dense three-way consensus reflecting Denver's real energy economy: Davis Graham & Stubbs LLP** reaches
3/5 with a unanimous #1 rank wherever ranked (Claude, Gemini, Google AI Mode), **Womble Bond Dickinson**
reaches 3/5 (ChatGPT #2, Claude #4, Google AI Mode #5), and **Holland & Hart (LLP)** reaches 3/5 (ChatGPT #5,
Gemini #2, Google AI Mode #3). No single firm dominates, but three separate names all land at the same
consensus level.

### 6. Best cannabis business law firms in Denver
- ChatGPT: Vicente LLP #1, Holland & Hart LLP #3, Greenspoon Marder LLP #4, McAllister Law Office #11
- Claude: Vicente LLP #1, Harris Sliwoski #2, Thorburn Law Group #3, Fairfield and Woods #4, Red Law #5
- Gemini: Fortis Law Partners LLC #1, Newburn Law, P.C. #2, Burnham Law #3, Baker Law Group, PLLC #4, Harris
  Sliwoski LLP #5, Vicente LLP #6, Greenspoon Marder LLP #7, Holland & Hart LLP #8
- Google AI Mode: names Vicente LLP prominently ("widely regarded as a..."), Holland & Hart LLP #2, Messner
  Reeves LLP #4, Fairfield and Woods PC #6
- Perplexity: names Harris Sliwoski's Denver Cannabis Law & Business Litigation team as the strongest result
  (only firm named)

**Vicente LLP reaches 4/5** (ChatGPT #1, Claude #1, Gemini #6, prominently named in Google AI Mode), the
standout category in the Denver dataset — Vicente LLP is a genuine Denver-headquartered firm and one of the
most nationally recognized cannabis-law practices, directly reflecting Colorado's real cannabis-industry
identity. **Holland & Hart LLP** and **Harris Sliwoski** both reach 3/5.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Cannabis business law | **Vicente LLP** | 4/5 |
| Property management | **Pioneer Property Management, Real Property Management Colorado** | 4/5 each |
| Energy/natural resources law | **Davis Graham & Stubbs, Womble Bond Dickinson, Holland & Hart** | 3/5 each |
| Personal injury law | **Bachus & Schanker** | 3/5 |
| Immigration law | **Moro Legal LLC** | 3/5 |
| Real estate agents | No overlap at all | Most fragmented category measured |

## Structural observations specific to Denver

1. **Denver's real economy shows up in two separate categories at once**: cannabis business law (Vicente
   LLP, 4/5) directly reflects Colorado's cannabis-industry identity, and energy/natural resources law
   (three firms at 3/5) reflects the state's real energy economy. This is the second city (after San
   Francisco, which had three startup-economy categories converge) to show this level of economy-reflects-
   consensus alignment across multiple categories.

2. **Property management again produced two firms at 4/5**, extending its status as the single most
   reliable high-consensus category type across every city researched in this program.

3. **Individual real estate agents remain the most fragmented category**, consistent with nearly every city
   researched — no name crosses any two engines here.

4. **No ChatGPT collection failures this run**, consistent with most cities researched. All 5 engines,
   including Google AI Mode (replacing the retired Meta AI engine), returned usable data on every prompt.
