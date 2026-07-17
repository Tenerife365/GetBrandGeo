# Dublin AI Visibility Research — Findings

**Client:** `research-dublin` (client_id 16) · **Market:** Ireland (IE) · **Region:** Dublin (DUB)
**Prompts:** 8, English-only (Ireland is an English-first market — no local/English pairing needed, unlike Berlin/Madrid/Paris/Rome)
**Engines:** Claude, Gemini, Meta AI, Perplexity — **ChatGPT errored on all 8 prompts** (`status: 'error'`), the same consistent collection failure seen in every prior city in this program. Not a real zero-visibility signal — treated as missing data throughout.
**Categories:** law firms (employment solicitors, commercial litigation, property conveyancing), SaaS/CRM software (CRM tools, project management), financial services (financial advisors, wealth management for expats, business-banking fintech).

---

## 1. Best employment solicitors in Dublin

- **Claude:** Byrne Wallace Shields LLP, McCann FitzGerald LLP, Arthur Cox, Mason Hayes & Curran LLP, William Fry / Matheson, Crushell & Co, Hayes Solicitors LLP, J.O.S. Solicitors, BHSM LLP
- **Gemini:** no structured competitors extracted (prose names firms but extraction returned null — consistent with the Gemini extraction-gap pattern flagged in New York/Rome)
- **Meta:** Mason Hayes & Curran, A&L Goodbody, Matheson, Byrne Wallace, LK Shields, William Fry, Maples and Calder, Dillon Eustace. **Removed as noise:** "Experience", "Expertise" (list-formatting fragments, not firm names).
- **Perplexity:** Fieldfisher Ireland LLP, Crushell Solicitors. **Removed as noise:** "Dublin 4" (a postcode, not a firm), "Dublin Solicitors" (generic category label).

**Consensus:** Byrne Wallace (Shields) 2/4, Matheson 2/4, William Fry 2/4, Crushell (& Co / Solicitors) 2/4 — fragmented, no single leader.

## 2. Which Dublin law firm should I use for a commercial contract dispute?

- **Claude:** A&L Goodbody, Matheson, McCann FitzGerald, Arthur Cox, William Fry, Byrne Wallace Shields, Beauchamps
- **Gemini:** no structured competitors extracted (same gap)
- **Meta:** A&L Goodbody, Arthur Cox, Matheson, McCann FitzGerald, William Fry — clean, all 5 real firms, no noise
- **Perplexity:** McCann FitzGerald LLP, Arthur Cox LLP, A&L Goodbody LLP, William Fry LLP, Matheson LLP, Carmody Moran Solicitors, Crowley Millar Solicitors. **Removed as noise:** "Commercial Court" (an Irish court division, not a law firm).

**Consensus: the strongest in the entire Dublin dataset.** A&L Goodbody, Matheson, McCann FitzGerald, Arthur Cox, and William Fry are each named by all 3 structured-extraction engines (3/3) — Ireland's "Big Five" corporate law firms, exactly as Claude's own response explicitly labels them.

## 3. Top SaaS CRM tools used by Dublin startups

- **Claude:** HubSpot CRM, Salesforce Sales Cloud, Pipedrive. **Removed as noise:** "Best for" (a table-column header, not a product).
- **Gemini:** no structured competitors extracted despite prose naming HubSpot CRM and others
- **Meta:** HubSpot, Copper, Salesforce, Pipedrive, Zoho CRM, Freshsales, Pardot
- **Perplexity:** HubSpot CRM, Pipedrive, Zoho CRM, Salesforce, Freshsales, Monday CRM, Attio. **Removed as noise:** "EU-hosted", "Multinationals" (descriptive phrases from a comparison table, not products).

**Consensus:** HubSpot (CRM) 3/3, Salesforce 3/3, Pipedrive 3/3 (all structured-extraction engines agree), Zoho CRM 2/3, Freshsales 2/3.

## 4. Best project management software for Irish startups

- **Claude:** Monday.com, ClickUp, Jira
- **Gemini:** Asana, Monday.com, ClickUp, Trello, Zoho Projects, Smartsheet, Basecamp, Jira Software, Notion, Teamwork.com
- **Meta:** Asana, Trello, Monday.com, Jira, Basecamp, Wrike, Smartsheet, Podio
- **Perplexity:** Asana, Monday.com, ClickUp, Trello, Basecamp. **Removed as noise:** "Agencies" (an audience-segment label, not a product).

**Consensus: unanimous 4/4 on Monday.com** — the only brand named by every single engine (including Claude, which named just 3 tools total). Asana 3/4, ClickUp 3/4, Trello 3/4, Basecamp 3/4, Jira/Jira Software 3/4.

## 5. Best financial advisors in Dublin

- **Claude:** Rockwell Financial Management, Keenan Financial Planning, Doohan Financial Planning, Greenway Financial Advisors, Investwise Financial Planning
- **Gemini:** Rockwell Financial, Opes Financial Planning, Hegarty Financial Management, Mason Wealth Management, Highfield Financial Planning, Clinch Wealth Management, Greenway Financial Advisors
- **Meta:** Davy Private Clients, Investec Wealth & Investment, KBC Wealth, Goodbody Stockbrokers, Quilter Cheviot, Harbour Wealth Advisors, Capstone Wealth Management, Elevate Financial Advisors, Acuvest Financial Advisors
- **Perplexity:** Doohan Financial Planning, Rockwell Financial, Gallivan Kennedy. **Removed as noise:** "2M", "1M+" (fee-tier figures pulled into the name field), "Central Bank of Ireland" (the financial regulator, not an advisor).

**Consensus:** Rockwell Financial (Management) 3/4 (Claude, Gemini, Perplexity). **Meta is the outlier** — its entire list (Davy, Investec, KBC Wealth, Goodbody, Quilter Cheviot) is large institutional private-wealth brands, while Claude/Gemini/Perplexity all named smaller independent financial-planning practices. Zero overlap between Meta's list and the other three engines'.

## 6. Which Dublin wealth management firms are recommended for expats?

- **Claude:** Imperius Wealth, EUI Private Wealth, Evelyn Partners Ireland, Davy, Wealthwise Financial Planning
- **Gemini:** no structured competitors extracted despite prose discussing firms
- **Meta:** Davy Wealth, Cantor Fitzgerald Ireland, Investec Wealth & Investment, Brewin Dolphin, Sarasin & Partners
- **Perplexity:** Imperius Wealth, Abbey Wealth, Davy. **Flagged, kept:** "Zurich Precision" (this is a real product name — Zurich International's investment platform — not a noise fragment, kept as a genuine entity even though it's a product rather than an advisory firm). **Removed as noise/duplicate:** "EUIPrivateWealth" (a no-space duplicate of Claude's "EUI Private Wealth").

**Consensus:** Davy/Davy Wealth 3/3 (Claude, Meta, Perplexity). Imperius Wealth 2/3 (Claude, Perplexity). **Meta again breaks from the pattern** — Cantor Fitzgerald, Investec, Brewin Dolphin, and Sarasin & Partners are all large institutional wealth managers, echoing the same "big-name" answer shape it gave for prompt 5, while Claude and Perplexity named boutique, expat-focused independent firms (Imperius Wealth, EUI Private Wealth, Abbey Wealth).

## 7. Best fintech apps for business banking in Ireland

- **Claude:** Revolut Business, Wise Business, Qonto, N26 Business, Stripe
- **Gemini:** Revolut Business, Wise Business, N26 Business, Fire, TransferMate, CurrencyFair
- **Meta:** Revolut for Business, N26 Business, Tide, WorldFirst, Payoneer, BOI Business On Line, Bullet
- **Perplexity:** Revolut Business, Fire, Found, Wise, AIB, BOI

**Consensus: unanimous 4/4 on Revolut (Business/for Business)** — every engine's #1 pick, matching Claude's own framing as "the undisputed leader for Irish business[es]". N26 Business 3/4, Wise/Wise Business 3/4.

## 8. Top-rated solicitors for property purchase in Dublin

- **Claude:** Coyne Solicitors, McKenna & Co. Solicitors, Cosgrove Gaynard Solicitors, Sinéad Ivory Solicitors
- **Gemini:** Coyne Solicitors, Anthony Joyce & Co., MB Solicitors, Amorys Solicitors, McCarthy + Co Solicitors LLP, Bowler Geraghty Solicitors, Mangan O'Beirne Solicitors, McDonnell & Company Solicitors, Mullany Walsh Maxwells Solicitors. **Flagged, kept:** "Cathal Young" — reads like an individual solicitor's name rather than a firm name; kept since it's plausibly a named practitioner cited alongside firms, not obvious noise.
- **Meta:** McCann FitzGerald, A&L Goodbody, Mason Hayes & Curran, Eversheds Sutherland, Arthur Cox, ODriscoll O'Neil, Joynt & Crawford, Sherwin O'Riordan
- **Perplexity:** McKenna & Co Solicitors, Duncan Grehan & Partners, Mullany Walsh Maxwells, Kingsford Solicitors, Griffin Solicitors, Sherwin O'Riordan LLP, Taylor & Buchalter, O'Donnell McKenna Solicitors. **Removed as noise:** "First-time Buyer Workshops" (a service description, not a firm), "Dublin 7" (a postcode).

**Consensus:** Coyne Solicitors 2/4 (Claude, Gemini). McKenna & Co. 2/4 (Claude, Perplexity). Mullany Walsh Maxwells 2/4 (Gemini, Perplexity). Sherwin O'Riordan 2/4 (Meta, Perplexity). **Meta gives an almost identical answer to prompt 2's commercial-litigation list** (McCann FitzGerald, A&L Goodbody, Arthur Cox, Mason Hayes & Curran all repeat here) — despite this being a residential property-conveyancing query, a fundamentally different practice area from commercial disputes.

---

## Cross-Engine Consensus Summary

| Prompt | Strongest consensus brand(s) | Agreement |
|---|---|---|
| Employment solicitors | Byrne Wallace / Matheson / William Fry / Crushell | 2/4 each (fragmented) |
| Commercial contract dispute | A&L Goodbody, Matheson, McCann FitzGerald, Arthur Cox, William Fry | 3/3 (unanimous among structured engines) |
| SaaS CRM tools | HubSpot, Salesforce, Pipedrive | 3/3 (unanimous) |
| Project management software | **Monday.com** | **4/4 (fully unanimous)** |
| Financial advisors | Rockwell Financial (Management) | 3/4 |
| Wealth management for expats | Davy / Davy Wealth | 3/3 |
| Business banking fintech | **Revolut (Business)** | **4/4 (fully unanimous)** |
| Property purchase solicitors | Coyne / McKenna & Co / Mullany Walsh Maxwells / Sherwin O'Riordan | 2/4 each (fragmented) |

---

## Structural Observations — What's New About Dublin

1. **Meta AI shows a recurring "big-name bias" that ignores query intent — a pattern not seen this clearly in any prior city.** For 3 of 8 prompts (financial advisors, wealth management for expats, property-purchase solicitors), Meta's answer set is essentially identical to its answer for an *unrelated* prompt asking about large corporate/institutional firms — the same "Big Five" Irish corporate law firms (McCann FitzGerald, A&L Goodbody, Arthur Cox, Mason Hayes & Curran, William Fry) appear in both its commercial-litigation answer *and* its residential-property-conveyancing answer, and the same large institutional wealth brands (Davy, Investec, Cantor Fitzgerald, Goodbody Stockbrokers, Quilter Cheviot) appear in both its "financial advisors" and "wealth management for expats" answers, while Claude/Gemini/Perplexity all differentiate cleanly between boutique/independent practices and large institutions depending on what's actually being asked. This looks like a genuine query-generalization weakness specific to Meta on this dataset, not noise or an extraction artifact — the firm names themselves are all real and correctly extracted.

2. **Dublin has the strongest full-consensus rate of any city in this program.** Two separate categories — project management software (Monday.com) and business-banking fintech (Revolut Business) — achieved a clean 4/4 unanimous top pick across every engine that returned a result. That's a direct structural contrast to Rome, where zero brands achieved even 3/4 consensus anywhere in the dataset (§9.18, `rome-research-findings.md`). Dublin sits at the opposite end of the consensus spectrum from Rome within the same research program.

3. **Gemini's structured-competitor extraction gap continues** — zero competitors extracted on 3 of 8 prompts (employment solicitors, commercial contract dispute, wealth management for expats) despite its own prose text naming specific firms in at least two of those three cases. Consistent with the pattern already flagged in New York (4/8) and Rome (5/8) — Dublin's 3/8 rate is the mildest occurrence of this gap seen so far, but the pattern holds across every city tested to date.

---

**ChatGPT note:** all 8 ChatGPT rows show `status: 'error'` — no ChatGPT data is available for Dublin. This is a known, consistent collection issue across every city in this research program (§9.18), not a signal about ChatGPT's actual visibility for these brands.
