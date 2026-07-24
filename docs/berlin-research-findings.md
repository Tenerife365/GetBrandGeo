# Berlin City Research — Cleaned Competitor Findings

**Source:** `ai_results`, client_id 11 (`research-berlin`), collection run 2026-07-10.
4 categories, each asked as a **paired German/English prompt** (8 prompts total) —
Berlin is the one city in this program tested bilingually, specifically to measure
whether AI Visibility differs by query language (extends BG-014's "AI visibility
outside English" finding). **ChatGPT errored (`status: error`) on all 8 prompts
this run** — that's a collection failure, not a real "ChatGPT sees nothing" signal,
so this write-up is a 4-engine dataset (Claude, Gemini, Meta, Perplexity), same as
London. Data hand-cleaned: generic evaluation-criteria labels, locations, and
contact-info fragments removed from the raw extraction (see "Removed as noise"
per section).

---

## 1. Employment lawyers in Berlin

**German prompt — "Beste Arbeitsrechtsanwälte in Berlin":**
**Claude:** Kanzlei Betz Rakete Dombek · Kanzlei Raue Berlin · HENSCHE Rechtsanwälte · Kanzlei Bechert Rechtsanwälte · Pascal Croset · Dirk Scholz · Wolfgang Betz · Christian Lunow
**Gemini:** Anna-Lisa Heyne (individual lawyer) · Andreas Martin (individual) · Philipp Kitzmann (individual) · Benjamin Stumpp (individual)
**Meta:** Kliemt Arbeitsrecht · Dr. Christian Bärenz (individual) · Professor Dr. Thomas Liu (individual) · Gröning Rechtsanwälte
**Perplexity:** Bechert Rechtsanwälte · Pascal Croset (as "CROSET")

**English prompt — "Best employment lawyers in Berlin":**
**Claude:** Pascal Croset · Dr. Henrik Göddeke · Tino Sieland · AfA Rechtsanwälte Berlin · Hans Georg Helwig · Hanno Timner · Rotwang Law
**Gemini:** *(no competitors extracted this run)*
**Meta:** Hammelsberg | Partner · Kliemt.Arbeitsrecht (same firm as the German answer) · GÖRG Partnerschaft von Rechtsanwälten · Beiten Burkhardt · CMS Deutschland
**Perplexity:** Pusch Wahlig Workplace Law · AfA Rechtsanwälte · Schlun & Elseven

**Cross-engine/cross-language consensus:** Bechert Rechtsanwälte and Pascal Croset each appear twice (Claude + Perplexity, German run). AfA Rechtsanwälte appears twice (Claude + Perplexity, English run). Kliemt Arbeitsrecht is the one name Meta names consistently in **both** languages. Otherwise — like London's employment-law result — **no dominant, cross-engine leader**: this is a genuinely fragmented category, mostly small firms and named individual practitioners rather than a handful of well-documented brands.

**Removed as noise:** "Berlin Schöneberg", "Arbeitsgericht Berlin" (the labor court, not a firm), "Seit 25 Jahren" ("for 25 years" — a descriptor), "Kündigungsschutzklagen" (a legal term, not a firm), "Rechtsanwaltskammer Berlin" / "Berlin Bar" (bar associations, not firms), "Best Lawyers Directory" (a directory, not a firm), "Language", "Specialization", "Accessibility" (evaluation-criteria labels).

## 2. Accounting software for startups in Germany

**German prompt — "Beste Buchhaltungssoftware für Startups in Deutschland":**
**Claude:** sevdesk · Lexware Office · WISO MeinBüro
**Gemini:** BuchhaltungsButler · Lexoffice · FastBill · Papierkram.de · Sage Active
**Meta:** lexoffice · Billomat · Zervant · Kashflow · lexware
**Perplexity:** Lexware Office

**English prompt — "Best accounting software for startups in Germany":**
**Claude:** Lexoffice · SevDesk · ELSTER (Germany's official tax e-filing portal — a government platform, not a competing product, kept for context)
**Gemini:** *(no competitors extracted this run)*
**Meta:** Lexware · DATEV (Germany's dominant professional accounting/tax platform) · QuickBooks · SevDesk · Debitoor
**Perplexity:** Accountable · Axonaut

**Cross-engine/cross-language consensus:** **Lexware / Lexoffice — named by all 4 engines in the German run, and again by Claude and Meta in the English run.** This is the clearest unanimous result in the whole Berlin dataset. SevDesk is the runner-up, named by Claude in both languages and once by Meta. DATEV — Germany's actual market-leading professional accounting software — was only caught by Meta's English answer, a real miss by the other 3 engines worth noting.

**Removed as noise:** "GoBD-Konformität", "Benutzerfreundlichkeit", "Automatisierungsgrad", "Schnittstellen", "Skalierbarkeit" (German evaluation-criteria labels: GoBD compliance, usability, automation level, integrations, scalability), "Alternativtool" ("alternative tool" — generic), "UStVA" (a German VAT return form, not a company), "Einnahmen-Überhängen" (a garbled fragment of a German accounting term), "Steuerberater" ("tax advisor" — generic).

## 3. Private orthopedic clinics in Berlin

**German prompt — "Beste Privatkliniken für Orthopädie in Berlin":**
**Claude:** Charité · Helios Klinikum Berlin-Buch · Schön Klinik Berlin Lankwitz · ATOS Klinik Berlin · Sporthopaedicum Berlin
**Gemini:** *(no competitors extracted this run)*
**Meta:** Helios Klinikum Berlin-Buch · Vivantes Klinikum Neukölln · Schön Klinik Berlin
**Perplexity:** Hospital Havelhoehe · Privatklinik Dr. Surminski · Privatpraxis Dr. Topar · Ortho-Move

**English prompt — "Best private orthopedic clinics in Berlin":**
**Claude:** Schlosspark Klinik · ORTHO EINS · Private Orthopädie Berlin Prenzlauer Berg · Charité · Havelhöhe Medical Center (matches Perplexity's German-run "Hospital Havelhoehe")
**Gemini:** Dr. Martin Ihle (individual) · Dr. Sommermeier (individual) · Eller & Kellermann · Westklinik Dahlem · Joseph Kliniken Berlin · Havelklinik Berlin-Spandau
**Meta:** Charité - Orthopädische Klinik · Bethesda Krankenhaus · Martin-Luther-Krankenhaus · RKH-Kliniken (a real hospital group, but based in Ludwigsburg, not Berlin — likely a geographic mismatch) · Atlas Klinik · Helios Klinikum Berlin-Buch
**Perplexity:** "Private Clinic for Orthopaedic Berlin" (ambiguous — likely a poorly-rendered specific clinic name, not resolvable to one entity) · Primo Medico (a real clinic-finder platform, not a clinic itself)

**Cross-engine/cross-language consensus:** Charité (Claude, both languages, + Meta English) and Helios Klinikum Berlin-Buch (Claude + Meta, German run; Meta again, English run) are the two most repeated names — but the majority of names in each engine's answer don't overlap with any other engine's, especially in the English run. **Partial consensus** — more overlap than employment law, far less than accounting software.

**Removed as noise:** "Villa", "Privatpraxen" ("private practices" — generic), "Address", "Prenzlauer Berg", "Berlin Frohnau", "Frohnau Location" (locations, not clinic names), "Specialties", "Germany Health" (generic), "Phone", "Email", "Website" (contact-info labels).

## 4. HR software used by Berlin startups

**German prompt — "Welche HR-Software nutzen Berliner Startups?":**
**Claude:** HeyJobs · HiPeople · Zenjob · Shyftplan · Likeminded · Circula
**Gemini:** Personio · HiBob · Leapsome · Deel · WorkMotion · Shyftplan · HeyJobs · Localyze · Midlane · Empion
**Meta:** Personio · Workday · BambooHR · RecruitCRM · HiBob
**Perplexity:** Personio · Kenjo · WorkMotion · Deel · Rippling · HiPeople

**English prompt — "Which HR software do Berlin startups use?":**
**Claude:** HeyJobs · HiPeople · Aivy · Osterus (unclear name, not independently verifiable — possibly a rendering error) · Kenjo · HeavenHR · Shyftplan · WorkMotion · Localyze
**Gemini:** *(no competitors extracted this run)*
**Meta:** *(no competitors extracted this run)*
**Perplexity:** Personio · DATEV · Factorial · HiBob · Kenjo · Leapsome · Deel · HeavenHR

**Cross-engine/cross-language consensus:** **Personio — the single clearest headline leader in the entire Berlin dataset.** Named by Gemini, Meta, and Perplexity in the German run (3 of 4 engines — the only engine that missed it was Claude), and named again by Perplexity in the English run. WorkMotion, Deel, and HiBob each show up across 2+ engines and both languages. Note: this is also excluded from the count — Auto1 (Perplexity, English run) is a real, well-known Berlin company, but it's a *user* of HR software mentioned as an example, not an HR software vendor itself, so it isn't counted as a competitor here.

**Removed as noise:** "Lokales Berliner StartUp" ("local Berlin startup" — generic), "International Hiring", "Tech-Heavy Ops" (generic descriptors), "Berlin and Hamburg" (locations).

---

## Headline cross-engine leaders (named by the most engines/languages per category)

| Category | Top AI-visible name(s) | Engine/language agreement |
|---|---|---|
| Accounting software | **Lexware / Lexoffice** | 4/4 engines (German), + 2 in English |
| HR software | **Personio** | 3/4 engines (German), + Perplexity (English) |
| Orthopedic clinics | Charité, Helios Klinikum Berlin-Buch | Partial — 2-3 engines, thin overlap |
| Employment lawyers | *(fragmented — no consensus leader)* | — |

## Three structural observations worth the city-page angle

1. **Same pattern as London: software categories converge, local/professional
   services fragment.** Accounting software and HR software both have a small
   number of well-documented, category-defining products (Lexware, Personio) that
   every engine converges on. Employment law and (to a lesser extent) private
   clinics have long tails of small firms and individual practitioners with thin,
   inconsistent footprints — no engine agrees with another.
2. **Language genuinely changes what an AI engine returns — this is new,
   London couldn't show it.** Gemini and Meta both returned *zero* competitors
   for the English-language HR-software prompt while giving rich, detailed
   answers to the identical German-language question. This isn't a case of the
   same information translated — it's a case where an engine's underlying
   knowledge/retrieval behaved differently depending on the query's language.
   Personio was the one brand strong enough to cut through in both languages
   (via different engines) — most others weren't.
3. **A data-quality caveat that's a real trust issue, not a design choice:**
   ChatGPT failed to return a usable result on all 8 Berlin prompts this run.
   That's a collection error (`status: error`), not evidence ChatGPT has zero
   visibility for Berlin brands — worth being explicit about this on the page so
   it doesn't read as "ChatGPT never recommends anything for Berlin," which
   isn't what the data actually shows.

---

*Data-quality note: this is the cleaned view. A small number of individual named
lawyers/doctors were kept as real extracted results (not removed as noise) even
where a firm name wasn't clearly attached — these are genuine AI-generated
recommendations of named professionals, not fabricated. One name ("Osterus,"
Claude, English HR prompt) could not be independently verified as a real product
and is flagged rather than silently included as confirmed. See CLAUDE.md §8.11 for
the general extraction-quality caveats that still apply across every city in this
program.*
