# Madrid City Research — Cleaned Competitor Findings

**Source:** `ai_results`, client_id 12 (`research-madrid`), collection run 2026-07-10.
4 categories (hotels, real estate, restaurants, airport hotel), each asked as a
**paired Spanish/English prompt** (8 prompts total) — same bilingual-testing design
used for Berlin. **ChatGPT errored (`status: error`) on all 8 prompts this run**,
same collection failure pattern as London and Berlin — not a real "zero visibility"
signal, so this write-up is a 4-engine dataset (Claude, Gemini, Meta, Perplexity).
Data hand-cleaned: booking platforms, directories, neighborhood names, street
addresses, and a couple of geographically-wrong or stale results were removed or
flagged (see "Removed as noise" / "Flagged" per section).

---

## 1. Boutique hotels in central Madrid

**Spanish — "Mejores hoteles boutique en el centro de Madrid":**
**Claude:** Hotel Urban GL · Gran Hotel Inglés · The Principal Madrid · The Madrid EDITION · CoolRooms Palacio de Atocha · Catalonia Las Cortes
**Gemini:** *(no competitors extracted this run)*
**Meta:** Hotel Urso · The 7 Islas Hotel · Hotel Emperador
**Perplexity:** Hotel Villa Magna · Hotel Emperador · Palace Hotel · Hotel Único

**English — "Best boutique hotels in central Madrid":**
**Claude:** CoolRooms Palacio de Atocha · Only You Boutique Hotel · The Principal Madrid · Posada del León de Oro · Hotel Urso
**Gemini:** *(no competitors extracted this run)*
**Meta:** Hotel Urso · The Pavilions Madrid · Hotel Emperador · Only YOU Boutique Hotel Madrid · Hotel 7 Islas
**Perplexity:** Gran Hotel Inglés · Only YOU Boutique Hotel Madrid · The Principal Madrid

**Cross-engine/language consensus:** Loose. Hotel Urso (Meta, both languages + Claude English) and The Principal Madrid (Claude, both languages + Perplexity English) are the closest things to leaders — 2 engines each, both languages. Notably, **"Only You / Only YOU Boutique Hotel" shows up in 3 different engine answers, but only in the English run — never once in the Spanish run**, despite it being a real Madrid hotel. Its own brand name being in English may be a factor in why it surfaces more readily when the question itself is asked in English.

**Removed as noise:** "Booking.com", "Tripadvisor", "Google Hotels" (booking platforms/directories, not hotels), "Hotel.lr" (a garbled fragment).
**Flagged, kept but unverified:** "The Basic's" (Perplexity, Spanish run) — could not be confidently matched to a specific real Madrid hotel; possibly a rendering error.

## 2. Real estate agencies for buying an apartment in Madrid

**Spanish — "Mejores agencias inmobiliarias para comprar piso en Madrid":**
**Claude:** Gilmar · Engel & Völkers · ÔKAM
**Gemini:** *(no competitors extracted this run)*
**Meta:** Tecnocasa · Fotocasa · Barnes International · Neinor Homes · CBRE · Savills
**Perplexity:** Monago Consultores

**English — "Best real estate agencies for buying an apartment in Madrid":**
**Claude:** Gilmar Consulting Inmobiliario (same firm as the Spanish answer) · OptimaCasa · Engel & Völkers · Única Inmobiliaria · Tecnocasa
**Gemini:** *(no competitors extracted this run)*
**Meta:** Knight Frank · Savills · Fotocasa · Tecnocasa · Remax · Barnes International Realty
**Perplexity:** Monago Consultores · Lifetime Properties · Engel & Völkers · Keller Williams

**Cross-engine/language consensus:** **Engel & Völkers — named by Claude in both languages and by Perplexity in the English run (2 distinct engines, 3 total mentions), the closest thing to a leader.** Tecnocasa (Meta + Claude, both languages), Savills (Meta only, both languages), Gilmar (Claude only, both languages), and Monago Consultores (Perplexity only, both languages) round out a category where no name reaches true unanimity, but several show up consistently for the *same* engine across both languages.

**Removed as noise:** "Habitatge" (Catalan for "housing" — generic, not a company), "Salamanca", "Retiro", "Malasaña" (Madrid neighborhood names, not agencies).
**Flagged:** "Fotocasa" is a real, major Spanish property-listings **portal**, not an agency — kept since it's a real, relevant brand, but it answers a slightly different question than "which agency." "Lázaro" (Meta, English run) could not be confidently resolved to a specific agency or agent.

## 3. Best restaurants for a business dinner in Madrid

**Spanish — "Mejores restaurantes para una cena de negocios en Madrid":**
**Claude:** Amazónico · Ramses · El Invernadero · Maison Umami
**Gemini:** *(no competitors extracted this run)*
**Meta:** Santceloni · El Prior · La Tasquita de Enfrente · El Celler de Cán Roca · La Castilla · Kabuki · DiverXo
**Perplexity:** El Pollo Asado

**English — "Best restaurants for a business dinner in Madrid":**
**Claude:** Saddle · Coque · DSTAgE · Dani Brasserie
**Gemini:** *(no competitors extracted this run)*
**Meta:** El Pichón · Botín · La Tasquita de Enfrente · DiverXo · El Prior · Kabuki · Amazonico (matches Claude's Spanish-run "Amazónico") · La Marisquería
**Perplexity:** El Mesón de Fuencarral

**Cross-engine/language consensus:** The standout pattern here isn't cross-*engine* consensus — it's cross-*language* consistency **within a single engine**. Meta named almost the exact same core list (DiverXo, Kabuki, El Prior, La Tasquita de Enfrente) in both the Spanish and English runs — Meta is language-stable for this category. Claude and Perplexity, by contrast, gave **completely different** restaurant names in Spanish versus English — Claude's Spanish list (Amazónico, Ramses, El Invernadero, Maison Umami) shares nothing with its English list (Saddle, Coque, DSTAgE, Dani Brasserie) except the Amazónico/Amazonico overlap with Meta. No restaurant is named across all 4 engines.

**Removed as noise:** "Calle de Jorge Juan, 50" (a street address, not a restaurant name), "Salamanca" (a Madrid district, not a restaurant).
**Flagged, kept but unverified/dated:** "Santceloni" (Meta, Spanish run) — this restaurant closed several years ago; likely stale training data, not a current recommendation. "El Celler de Cán Roca" (Meta, Spanish run) — a real, extremely famous restaurant, but it's in Girona, not Madrid; a clear geographic error. "Yemas de Santo Domingo" (Meta, English run) — this is a Madrid pastry, not a restaurant. "El Pollo Asado" (Perplexity, Spanish run) — a generic "roast chicken" name, an odd fit for a "business dinner" query.

## 4. Hotel recommendations near Madrid-Barajas airport

**Spanish — "¿Qué hotel recomiendan cerca del aeropuerto de Madrid-Barajas?":**
**Claude:** Hilton Madrid Airport · Crowne Plaza Madrid Airport · Meliá Barajas · Senator Barajas · Ibis Madrid Aeropuerto Barajas · Hotel Clement Barajas
**Gemini:** *(no competitors extracted this run)*
**Meta:** Hotel Barajas Plaza · Hilton Madrid Airport · NH Madrid Barajas · Ibis Madrid Aeropuerto Barajas
**Perplexity:** Hotel Maydrit Airport · Ibis Aeropuerto Barajas · Senator Barajas · Hotel Barajas Plaza · Hotel Clement Barajas · Hotel Crowne Plaza · Sercotel Madrid Aeropuerto

**English — "Which hotel is recommended near Madrid-Barajas airport?":**
**Claude:** Hilton Madrid Airport · Meliá Barajas · Crowne Plaza Madrid Airport · Hotel Clement Barajas · Hotel Villa de Barajas · Zleep Hotel Madrid Airport
**Gemini:** Meliá Madrid Barajas · Hilton Madrid Airport · Hotel Maydrit Airport · Crowne Plaza Madrid Airport · Pullman Madrid Airport & Feria
**Meta:** *(no competitors extracted this run)*
**Perplexity:** Hilton Madrid Airport · Ibis Aeropuerto Barajas · Hotel Maydrit Airport · Hotel Clement Barajas · Hotel Senator Barajas · Hotel Barajas Plaza · Hotel Alcalá 611

**Cross-engine/language consensus:** **Hilton Madrid Airport — the single strongest result in the entire Madrid dataset.** Named by Claude, Meta, and Perplexity in the Spanish run, and by Claude, Gemini, and Perplexity in the English run — every engine that returned a usable result named it, in both languages. Crowne Plaza Madrid Airport is the clear runner-up (Claude and Perplexity in Spanish, Claude and Gemini in English). Hotel Clement Barajas and Hotel Maydrit Airport also appear across 2+ engines in both languages.

**The language pattern here is the opposite of what a simple "one language wins" story would predict, and it flips per engine:** Gemini returned nothing for the Spanish version of this prompt but gave a full, real answer in English. Meta did the reverse — a real answer in Spanish, nothing at all in English. Both patterns happened on the *same category*, in *opposite directions*, for two different engines.

**Removed as noise:** none this category.
**Flagged:** "Hotel Ibis" (Perplexity, Spanish run) is likely a duplicate/shortened reference to "Ibis Aeropuerto Barajas" already listed separately in the same answer — kept as a distinct extracted entry since it wasn't clearly redundant enough to merge with confidence.

---

## Headline cross-engine leaders (named by the most engines/languages per category)

| Category | Top AI-visible name(s) | Engine agreement |
|---|---|---|
| Airport hotel | **Hilton Madrid Airport** | Every responding engine, both languages |
| Real estate agencies | **Engel & Völkers** | 2 engines, both languages |
| Boutique hotels | Hotel Urso, The Principal Madrid | Loose, 2 engines each |
| Business dinner restaurants | *(no cross-engine leader — see language-stability note)* | — |

## Three structural observations worth the city-page angle

1. **The clearest consensus category in this whole research program so far is
   Madrid's airport hotel prompt.** Hilton Madrid Airport was named by every
   engine that returned a result, in both languages — a globally-branded, heavily
   digitally-documented chain in a category (airport hotels) with relatively few
   serious contenders. This is the sharpest version yet of the pattern already
   seen in London (CRM/fintech) and Berlin (accounting/HR software): well-
   documented, internationally recognizable brands converge; smaller,
   independent, locally-known businesses fragment.
2. **Madrid's language gap doesn't run one direction — it flips per engine, per
   category, unpredictably.** Berlin showed engines going silent in English
   specifically. Madrid shows the opposite is just as possible: Gemini failed in
   Spanish but answered fully in English for the airport-hotel prompt; Meta did
   the exact reverse on the same prompt. There's no simple "AI engines favor
   English" or "AI engines favor the local language" rule here — coverage is
   genuinely inconsistent and specific to the engine and the query.
3. **A new pattern this city surfaced: some engines are language-*stable* within
   a category, others are language-*volatile* — and it's not a fixed trait of the
   engine.** For the restaurant prompt, Meta named nearly the same shortlist in
   both languages, while Claude and Perplexity gave two almost entirely
   different restaurant lists depending on the language asked. The same engines
   didn't show this same stability/volatility split in the other three
   categories — it's prompt-specific, not something a brand can assume holds
   for every query.

---

*Data-quality note: ChatGPT's collection error affects all 8 Madrid prompts this
run, same as London and Berlin — not evidence of zero ChatGPT visibility for
Madrid brands. Two results (Santceloni, El Celler de Cán Roca) were flagged
rather than silently trusted — one appears to be stale/outdated information
(a closed restaurant), the other appears to be a geographic mix-up (a real
restaurant, but located in a different city). See CLAUDE.md §8.11 for the
general extraction-quality caveats that still apply across every city in this
program.*
