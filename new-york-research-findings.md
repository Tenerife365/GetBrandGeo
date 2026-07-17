# New York AI Visibility Research — Findings

Client: `research-newyork` (client_id 13), plan `pro`, market `US` / region `New York City`.
Collection date: 2026-07-10. 8 prompts × up to 5 engines (ChatGPT, Gemini, Claude, Perplexity, Meta AI).

**Data-quality note applying to the whole run:** ChatGPT (`status: error`) failed on all 8 prompts — a
collection error, not a real zero-visibility signal. All findings below are from Claude, Gemini, Meta AI,
and Perplexity only. Separately, **Gemini returned zero structured competitor extractions on 4 of 8
prompts** (real estate brokers, property management, CRM software, payroll software) despite its prose
clearly naming/discussing brands in those same responses — a known extraction-pipeline gap (bold/bullet
list capture), not evidence Gemini has nothing to say about those categories. This gap rate is higher than
prior cities in this program and is called out per-prompt below rather than silently treated as "Gemini has
no opinion."

## Category-by-category

### 1. Best personal injury law firms in New York City
- Claude: Kramer Dillof Livingston & Moore #1 (list likely mis-started — the response's own prose
  names "Gair, Gair, Conason..." as the #1 pick, but the structured extraction begins at what reads
  like a second-tier entry; flagged, not corrected), Block O'Toole & Murphy #2, Gersowitz Libo & Korek #3,
  Jaroslawicz & Jaros #4
- Gemini: Hecht, Kleeger & Damashek #1, The Barnes Firm #2, Weitz & Luxenberg #3, Gersowitz Libo & Korek #4,
  Edelman & Edelman #5, Fellows Hymowitz Rice #6, The Perecman Firm #7, The Jacob Fuchsberg Law Firm #8,
  Simonson Goodman Platzer #9, Chopra & Nocerino #10
- Perplexity: Edelman & Edelman #1, The Barnes Firm #2, Kramer, Dillof, Livingston & Moore #3, The Perecman
  Firm #4, Gair, Gair, Conason #5, ~~Forbes #6~~ (removed as noise — not a firm), Rosenbaum & Rosenbaum #7,
  Giordano Law Offices #8, Fellows Hymowitz Rice #9, The Platta Law Firm #10
- Meta: no result this prompt

**Removed as noise:** "Forbes" (Perplexity #6 — a media outlet, not a law firm).

No 3-engine consensus. Best overlap is 2/4 each for: Gair Gair Conason, Kramer Dillof Livingston & Moore,
The Barnes Firm, Gersowitz Libo & Korek, Edelman & Edelman, and Fellows Hymowitz Rice. This category is
fragmented — matches the same pattern seen in London/Madrid for boutique/practitioner-heavy legal
categories.

### 2. Which NYC law firm should I use for a startup incorporation?
- Claude: Cooley LLP #1, Fenwick & West #2, Lowenstein Sandler #3, Buchwald & Associates #4, Romano Law #5,
  Cohen Schneider Law #6
- Gemini: Cohen Schneider Law #1, Gunderson Dettmer #2, Fenwick & West #3, Orrick, Herrington & Sutcliffe #4,
  Phillips Lytle #5, McCarter & English #6, DLA Piper #7, Fridman Law Firm #8, Romano Law #9, Dilendorf Law
  Firm #10
- Meta: Wilson Sonsini Goodrich & Rosati #1, Fenwick & West #2, DLA Piper #3, Goodwin Procter #4, Cooley #5,
  Kleinberg, Kaplan, Wolff & Cohen #6, Reitler Kailas & Rosenblatt #7, Parisi, Mirabella & McDermott #8
- Perplexity: Cohen Schneider Law #1, Gunderson Dettmer #2, ~~"Full-service" #3~~ (removed as noise — a
  descriptor, not a firm), Fridman Law Firm #4, Cooley #5, Lowenstein Sandler #6

**Removed as noise:** "Full-service" (Perplexity #3).

**Clearest consensus in the New York dataset:** **Fenwick & West** (Claude #2, Gemini #3, Meta #2 — 3 of 4
engines) and **Cooley** (Claude #1, Meta #5, Perplexity #5 — 3 of 4 engines). Both are national venture-law
firms, not NYC boutiques — the pattern already seen elsewhere: well-documented national/international
brands converge across engines, local/independent practices fragment.

### 3. Best real estate brokers for buying a condo in Manhattan
- Claude: Hudson Advisory Team #1, Fredrik Eklund & John Gomes #2, Deborah Kern #3, Alexa Lampert #4,
  Janice Chang Team #5, Madeline Hult Elghanayan #6, Compass #7, Corcoran Group #8, Douglas Elliman #9,
  Brown Harris Stevens #10
- Gemini: **no competitors extracted** (bold/bullet-list gap — prose discusses named firms/brokers)
- Meta: Douglas Elliman #1, Corcoran Group #2, Brown Harris Stevens #3, Halstead Property #4, StreetEasy
  Experts #5 (flagged — plausibly a generic descriptor rather than a real named team, kept but uncertain),
  Stribling & Associates #6, Warburg Realty #7, Core NYC #8, Keller Williams NYC #9
- Perplexity: Corcoran #1, Compass #2, Douglas Elliman #3, Brown Harris Stevens #4, Sotheby's International
  Realty #5

**3-engine consensus — the strongest single result of this category type in the dataset:** **Douglas
Elliman** (Claude #9, Meta #1, Perplexity #3), **Corcoran / Corcoran Group** (Claude #8, Meta #2,
Perplexity #1), and **Brown Harris Stevens** (Claude #10, Meta #3, Perplexity #4) — the three legacy NYC
brokerages all hit 3/4 engines. Individual "star broker" names (Hudson Advisory Team, Fredrik Eklund & John
Gomes) appear only once each — no cross-engine agreement at the individual-agent level, only at the
brokerage-firm level.

### 4. Top-rated property management companies in New York
- Claude: (list appears to start mid-ranking — prose says "FirstService retained its top spot," but the
  structured list begins at #4) Rose Associates #4, XL Real Property Management #5, Daisy Property
  Management #6, Choice New York Management #7, Sky Management #8, FirstService Residential #9, AKAM
  Associates #10, Douglas Elliman Property Management #11, Newport Property Management #12
- Gemini: **no competitors extracted** (same bold/bullet-list gap)
- Meta: Douglas Elliman Property Management #1, Rose Associates #2, Halstead Property Management #3, MJM
  Property Management #4, FirstService Residential #5, Maxons Management #6
- Perplexity: FirstService Residential #1, AKAM Associates #2, Douglas Elliman Property Management #3,
  Rose Associates #4, Metro Management Development #5, ~~"Highest Customer Ratings" #6~~ (removed as
  noise — a criteria label, not a company), Atlas NYC Property Management #7, XL Real Property Management
  #8, Batra Group Real Estate #9, Belong #10

**Removed as noise:** "Highest Customer Ratings" (Perplexity #6).

**3-engine consensus:** **FirstService Residential** (Claude, Meta #5, Perplexity #1 — and per Claude's own
prose, actually the #1 pick despite the mis-started numbered extraction), **Douglas Elliman Property
Management** (Claude, Meta #1, Perplexity #3), and **Rose Associates** (Claude, Meta #2, Perplexity #4) all
hit 3/4 engines.

### 5. Best CRM software for small businesses in the US
- Claude: HubSpot CRM #1, Salesforce #2, Pipedrive #3, ~~"Best for" #4~~ (removed as noise)
- Gemini: **no competitors extracted** (same gap)
- Meta: HubSpot #1, Zoho CRM #2, Freshsales #3, Pipedrive #4, Copper #5, ~~"Customization" #6~~,
  ~~"Integration" #7~~ (both removed as noise — evaluation-criteria labels, not products)
- Perplexity: Salesforce #1 (prose also names "monday CRM" but it wasn't captured in the structured list)

**Removed as noise:** "Best for" (Claude), "Customization" and "Integration" (Meta).

Loose 2-engine overlap: HubSpot (Claude #1, Meta #1 — both rank it #1), Salesforce (Claude #2, Perplexity
#1), Pipedrive (Claude #3, Meta #4). Not a national-consumer-software category this program hasn't already
covered (see BG-008/BG-012 for the broader SaaS pattern), but consistent with it — HubSpot and Salesforce
are the two names that surface most.

### 6. Which payroll software do New York startups recommend?
- Claude: Gusto #1, Rippling #2, Deel #3, Justworks #4, QuickBooks Payroll #5
- Gemini: **no competitors extracted**, though prose clearly discusses several by name
- Meta: **no competitors extracted**, though the prose explicitly says "One of the top recommendations is
  Gusto" — a clear extraction miss, not a real absence
- Perplexity: Gusto #1, Rippling #2, Warp #3, Justworks #4, ~~"PEO" #5~~ (removed as noise — an acronym for
  a service category, not a company), OnPay #6, Square Payroll #7, Patriot #8, Wave Payroll #9

**Removed as noise:** "PEO" (Perplexity #5).

**Gusto is the clearest single-brand signal in this dataset**, even though only 2/4 engines structurally
extracted it (Claude #1, Perplexity #1 — both rank it #1): Meta's prose names it explicitly as its top
recommendation, and Gemini's prose describes payroll options generally without extractable structure. Reading
the responses qualitatively (not just the structured extraction), Gusto is effectively a 3-4 engine
consensus pick.

### 7. Best immigration lawyers in New York
- Claude: Wildes & Weinberg #1 (position #2 is missing from the list — likely an extraction gap, not a
  real skip), Raisa Cohen #3, Suzanne B. Seltzer #4, Kats Immigration Law #5, ~~Chambers & Partners #6~~
  (removed as noise — a legal-rankings directory, not a law firm)
- Gemini: Wildes & Weinberg #1, Feiner & Lavy #2, HSF Kramer #3, Rakhel Milstein #4, Radu C. Vasilescu #5,
  Gary J. Yerman #6, Kellisia J. Hazlewood #7, Maria-Costanza Barducci #8, Robert Tsigler #9, Sharon
  Khunkhun #10
- Meta: Cyrus Mehta & Associates #2 only (position #1 was cut off mid-name in the raw response, likely
  "Fragomen" based on partial text — not confidently recoverable from the snippet alone)
- Perplexity: Paul O'Dwyer #1, Dan Schwarz #2, Ian Edmund Scott #3, Victoria Ledeneva #4, Irene Vaisman #5,
  Evans Legros #6, Fragomen LLP #7, HSF Kramer #8

**Removed as noise:** "Chambers & Partners" (Claude #6 — a legal-industry ranking/directory service, not a
law firm).

Only loose 2-engine overlap: Wildes & Weinberg (Claude #1, Gemini #1 — both rank it #1) and HSF Kramer
(Gemini #3, Perplexity #8). Highly fragmented — the most individual-practitioner-heavy category in the New
York set, and the least cross-engine agreement, matching the fragmentation pattern already seen in
London/Madrid for employment law and independent financial advisors.

### 8. Best rental listing platforms for apartments in NYC
- Claude: StreetEasy #1, TransparentCity #2 (uncommon name, kept but flagged as uncertain), RentHop #3,
  Zumper #4, Zillow #5
- Gemini: **no competitors extracted** despite prose clearly naming StreetEasy and others
- Meta: StreetEasy #1, Zillow #2, Craigslist #3 (typo "Craiglist" in the source, corrected here), UrbanEdge
  #4 (flagged — not a recognizable NYC listing platform, possibly a fabrication), RentHop #5, NYC Housing
  Connect #6 (a real NYC government housing site, kept), Douglas Elliman #7, Paddington Properties #8
  (flagged, uncommon), Apartments.com #9, HotPads #10
- Perplexity: StreetEasy #1, Zillow #2, Zumper #3, PropertyClub #4, Craigslist #5, Facebook #6, "Realt.com &
  NewYorkCityApartments.com" #7 (a merged/messy entry, kept as reported), RentHop #8

**Flagged, not removed (uncertain but not clearly fabricated):** "TransparentCity" (Claude #2), "UrbanEdge"
(Meta #4), "Paddington Properties" (Meta #8).

**Unanimous #1 pick — the strongest single-brand consensus in the entire New York dataset:** **StreetEasy**
was named #1 by every engine that returned a usable result (Claude, Meta, Perplexity — 3/4, with Gemini's
gap being an extraction miss, not disagreement). **Zillow** (Claude #5, Meta #2, Perplexity #2) and
**RentHop** (Claude #3, Meta #5, Perplexity #8) also both hit 3/4 engines.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Rental listing platforms | **StreetEasy** | 3/4, unanimous #1 among responders |
| Real estate brokers (condo) | **Douglas Elliman, Corcoran, Brown Harris Stevens** | 3/4 each |
| Property management | **FirstService Residential, Douglas Elliman PM, Rose Associates** | 3/4 each |
| Startup incorporation law | **Fenwick & West, Cooley** | 3/4 each |
| Payroll software | **Gusto** | 2/4 structural, effectively 3-4 by prose |
| CRM software | HubSpot, Salesforce | 2/4 each |
| Personal injury law | No clear leader | Fragmented, max 2/4 |
| Immigration law | Wildes & Weinberg (loose) | 2/4, fragmented overall |

## Structural observations specific to New York

1. **Legacy NYC brokerages dominate real estate categories at the firm level, not the individual-agent
   level.** Douglas Elliman, Corcoran, and Brown Harris Stevens each hit 3/4 engine consensus across both
   the condo-broker and property-management prompts. Individual "star" agents and boutique teams (Hudson
   Advisory Team, Fredrik Eklund & John Gomes) never achieve cross-engine agreement — AI engines converge on
   the century-old institutional names, not the personalities.

2. **National venture-law firms outrank NYC-specific boutiques for startup legal services.** Fenwick & West
   and Cooley (both national, Silicon-Valley-rooted firms) hit 3/4 consensus for "which NYC law firm for
   startup incorporation" — ahead of any NYC-only boutique. This mirrors the SaaS/national-brand pattern
   already documented in BG-008/BG-012, now confirmed in a services category, not just software.

3. **Gemini's competitor-extraction gap is unusually pronounced in this city's dataset** — zero structured
   competitors on 4 of 8 prompts (real estate brokers, property management, CRM, payroll), despite each of
   those responses discussing named brands in prose. This is higher than the gap rate observed in
   London/Berlin/Madrid and is worth flagging to Master-Reasoning as a possible pattern: the affected
   prompts are the more generic/national-service categories (software, brokers, management), while
   Gemini extracted normally on the more traditional numbered-list-style legal/local prompts. May indicate
   Gemini's answer *format* (bold-prose vs. numbered list) correlates with prompt type, not just engine
   behavior in general.

4. **Personal injury and immigration law remain the most fragmented categories**, consistent with the
   practitioner-heavy fragmentation pattern already seen in London (employment law) and Madrid
   (independent financial advisors) — no engine agreement beyond 2/4, and several individually-named
   attorneys appear on only one engine each.
