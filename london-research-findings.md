# London City Research — Cleaned Competitor Findings

**Source:** `ai_results`, client_id 10 (`research-london`), latest run 2026-07-10
(post competitor-extraction round 3). 8 commercial-buyer prompts × up to 5 AI
engines. Data hand-cleaned by Master-Reasoning: the raw extraction is now
strong, but a residual tail of bold-emphasis noise was removed by hand (see
"Removed as noise" per section). **Consensus** = number of distinct engines
that named a firm for that prompt (a proxy for AI-visibility prominence — a
firm named by 3–4 engines is far more "AI-visible" than one named by 1).

> Note: Gemini did not return usable rows for prompts 182 (employment) and 183
> (commercial dispute) this run — those two are 3-engine (Claude/Meta/Perplexity).
> All others are 4-engine (Claude/Gemini/Meta/Perplexity).

---

## 1. Best employment law firms in London (3 engines)

**Claude:** Freshfields Bruckhaus Deringer · Linklaters · Clifford Chance · Baker McKenzie · Travers Smith · Addleshaw Goddard · GQ Littler · Mishcon de Reya · DLA Piper · Eversheds Sutherland
**Meta:** Lewis Silkin · GQ Employment Law · BDBF · Gowling WLG · CMS · Pinsent Masons · DAC Beachcroft · Fox Williams · Herrick & Froomberg · Lawson-West
**Perplexity:** Leigh Day · Thompsons · Bates Wells · Cole Khan Solicitors LLP · Penningtons Manches Cooper LLP · Slater and Gordon Lawyers

**Cross-engine consensus:** GQ Littler ≈ GQ Employment Law (Claude + Meta — same firm). Otherwise the three engines recommend **almost entirely different** employment firms — a highly fragmented category with no dominant AI-visible name. Note the split: Claude/Meta lean corporate/City firms; Perplexity leans claimant/union firms (Leigh Day, Thompsons, Slater and Gordon).

**Removed as noise:** "Employment".

## 2. London law firm for a commercial contract dispute (3 engines)

**Claude:** Clifford Chance · Slaughter and May · Latham & Watkins · Baker McKenzie · Kingsley Napley · RPC · Russell-Cooke · Saunders Law
**Meta:** Linklaters · Clifford Chance · Allen & Overy · Freshfields Bruckhaus Deringer · Herbert Smith Freehills · Stewarts Law · Enyo Law · Kobre & Kim
**Perplexity:** Slaughter and May · Clifford Chance · Freshfields · Quinn Emanuel · Latham & Watkins · Allen & Overy · Debevoise & Plimpton · RPC · Kennedys · Clyde & Co

**Cross-engine consensus:** **Clifford Chance — named by all 3 (clear leader).** Slaughter and May (2), Latham & Watkins (2), RPC (2), Allen & Overy (2), Freshfields (2).

**Removed as noise:** none.

## 3. Best UK-based CRM software for a small business in London (4 engines)

**Claude:** Capsule CRM · Prospect CRM · Workbooks
**Gemini:** Capsule CRM · HubSpot CRM · Freshsales · Act! (Act)
**Meta:** Capsule CRM · Really Simple Systems · Workbooks · Sage CRM · Zoho CRM
**Perplexity:** Capsule CRM · Pipedrive · Freshsales · Zoho CRM · HubSpot

**Cross-engine consensus:** **Capsule CRM — named by all 4 (dominant answer).** Workbooks (2), HubSpot (2), Freshsales (2), Zoho CRM (2).

**Removed as noise:** "UK-native", "Sales Pipeline Focus", "All-in-One & Free Start", "Overall Best Features", "Best Value" (all Perplexity section labels). "Act" kept = **Act! CRM** (real product).

## 4. Top project management SaaS tools used by London startups (4 engines)

**Claude:** Linear · Notion · Asana · ClickUp · Trello
**Gemini:** Asana · Trello · Monday.com · ClickUp · Jira · Wrike · Zoho Projects · Basecamp · Sheetify Projects · Ayoa
**Meta:** Trello · Asana · Basecamp · Monday.com · Jira · Wrike · Notion · Podio · Airtable · ClickUp
**Perplexity:** Monday.com · Asana · ClickUp · Trello · Notion · Jira · Linear · Basecamp · Xero¹ · HubSpot¹

**Cross-engine consensus:** **Asana, Trello, ClickUp — all 4 engines each.** Notion (3), Jira (3), Monday.com (3), Basecamp (3), Wrike (2), Linear (2). The most consistent category in the whole run.

**Removed as noise:** none. ¹Xero (accounting) and HubSpot (CRM/marketing) are real brands but adjacent, not core PM tools — Perplexity mentioned them as integrations.

## 5. Best independent financial advisors in London (4 engines)

**Claude:** DGS Chartered Financial Planners · Off-Piste Wealth · Westminster Wealth Management · Ascot Lloyd · Octopus Money · Evelyn Partners · Wren Sterling
**Gemini:** VouchedFor² · Unbiased² · DGS Chartered Financial Planners · First Wealth · Investment Quorum · First Sentinel Wealth · Aventur Wealth · Tanager Wealth Management LLP
**Meta:** Saunderson House · Koda Capital · Charles Stanley · Killik & Co · Tilney · Hoxton Capital Management · Ascot Lloyd · LGFP · Clear Partners · Margetts
**Perplexity:** Unbiased² · VouchedFor²

**Cross-engine consensus:** DGS Chartered Financial Planners (Claude + Gemini), Ascot Lloyd (Claude + Meta), Unbiased & VouchedFor (Gemini + Perplexity). Fragmented — no single dominant advisor.

**Removed as noise:** "Spear's Magazine", "Chartered Status", "Specialisation". ²Unbiased & VouchedFor are advisor-**directories**, not advisors — Perplexity effectively answered "use a directory" rather than naming firms.

## 6. London wealth management firms recommended for expats (4 engines)

**Claude:** MASECO Private Wealth · Tanager Wealth Management · LGT Wealth Management · Rathbones · First Sentinel Wealth · Titan Wealth International
**Gemini:** UBS Wealth Management UK · Titan Wealth International · James Hambro & Partners LLP · Canaccord Genuity Wealth · Quilter Cheviot · LGT Wealth Management · W1M Wealth & Investment Management · RBC Brewin Dolphin · Harrison Brook · Blevins Franks
**Meta:** St. James's Place · Charles Stanley · Cazenove Capital · Killik & Co · Julius Baer · UBS Wealth Management · Nedbank Private Wealth
**Perplexity:** Chase Buchanan · Titan Wealth International · HSBC Expat · Stonehage Fleming · Cazenove Capital · Evelyn Partners · Saltus

**Cross-engine consensus:** **Titan Wealth International — named by 3 (Claude/Gemini/Perplexity), the leader.** LGT Wealth Management (2), UBS Wealth Management (2), Cazenove Capital (2).

**Removed as noise:** "Geographic Focus", "Tax & Pension Complexity", "Financial Conduct Authority" (regulator, not a firm).

## 7. Best fintech apps for business banking in the UK (4 engines)

**Claude:** Starling Bank · Monzo Business · Revolut Business · Tide · Wise Business
**Gemini:** Starling Bank · Revolut Business · Tide · Monzo Business · OFX · Wise Business · Airwallex · ANNA Money
**Meta:** Starling Bank · Monzo Business · Tide · Revolut for Business · Countingup · Barclays Pingit · HSBC Kinetic
**Perplexity:** Revolut Business · Monzo Business · Starling Bank

**Cross-engine consensus:** **Starling Bank, Monzo, Revolut — all 4 engines each (unanimous top 3).** Tide (3), Wise Business (2). The most decisive category — every engine agrees on the same top three.

**Removed as noise:** "Best for", "Fees", "Integration".

## 8. Top-rated solicitors for property purchase in London (4 engines)

**Claude:** Osbornes Law · Bishopsgate Law · Markand & Co Solicitors · Bird & Co Solicitors · Ashworths Solicitors
**Gemini:** Boodle Hatfield LLP · Farrer & Co LLP · Forsters LLP · Keystone Law · Mishcon de Reya LLP · Charles Russell Speechlys LLP · Maurice Turnor Gardner LLP · Wedlake Bell LLP · Druces LLP · Cripps
**Meta:** Forsters · Farrer & Co · Charles Russell Speechlys · Seddons · Gibson Dunn · Macfarlanes · Bircham Dyson Bell · Hunters
**Perplexity:** Winston Solicitors · Poole Alcock LLP · Leonard Gray LLP · Manak Solicitors · Elite Law Solicitors Limited · Druces · Wedlake Bell · Farrer & Co

**Cross-engine consensus:** **Farrer & Co — named by 3 (Gemini/Meta/Perplexity), the leader.** Forsters (2), Charles Russell Speechlys (2), Wedlake Bell (2), Druces (2). Note Claude's list is entirely disjoint from the other three (smaller high-street/conveyancing firms vs. the private-client/prime-property firms the others name).

---

## Headline cross-engine leaders (named by the most engines per vertical)

| Vertical | Top AI-visible name(s) | Engines |
|---|---|---|
| Commercial contract dispute | **Clifford Chance** | 3/3 |
| CRM software | **Capsule CRM** | 4/4 |
| Project management SaaS | **Asana, Trello, ClickUp** | 4/4 each |
| Fintech business banking | **Starling Bank, Monzo, Revolut** | 4/4 each |
| Wealth management (expats) | **Titan Wealth International** | 3/4 |
| Property solicitors | **Farrer & Co** | 3/4 |
| Employment law | *(fragmented — no consensus leader)* | — |
| Independent financial advisors | *(fragmented — no consensus leader)* | — |

## Two structural observations worth a city-page angle

1. **Consensus varies wildly by category.** Fintech, CRM, and PM tools show
   near-unanimous AI recommendations (a handful of brands own the answer);
   employment law and IFAs are fragmented (every engine names a different set)
   — meaning in those verticals *no one owns the AI narrative yet*, which is
   exactly the gap BrandGEO sells against.
2. **Engines have distinct "personalities."** Perplexity leans claimant/
   directory answers; Claude/Meta lean established City firms; for property,
   Claude surfaces smaller conveyancing firms while the others surface
   prime-property specialists. A brand can be highly visible on one engine and
   invisible on another.

---

*Data-quality note: this is the cleaned view. The raw extraction still leaks a
small number of bold-emphasis fragments (mostly Perplexity section labels like
"Best Value", "Geographic Focus", and verb-prepended brands like "Use
Unbiased") that can't be filtered structurally without risking real brand names
— see CLAUDE.md §8.11. All such items were removed by hand above.*
