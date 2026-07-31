# Rome AI Visibility Research — Findings

Client: `research-rome` (client_id 15), plan `pro`, market `IT` / region `Rome`.
Collection date: 2026-07-10. 4 categories × 2 languages (Italian / English) = 8 prompts × up to 5 engines
(ChatGPT, Gemini, Claude, Perplexity, Meta AI) — the same bilingual design as Berlin, Madrid, and Paris.

**Data-quality note applying to the whole run:** ChatGPT (`status: error`) failed on all 8 prompts — a
collection error, not a real zero-visibility signal. Gemini returned zero structured competitors on 5 of 8
prompts despite discussing brands in prose in most of them — the highest gap rate of any city in this
program so far. Meta AI also failed extraction entirely (both languages) on the hotel-near-Termini prompt,
despite its prose naming specific hotels by name.

## Category-by-category

### 1. Best boutique hotels near Rome's historic center (Italian and English)
**Italian (prompt 222):**
- Claude: Hotel Palazzo Manfredi #1, Singer Palace Hotel #2, Hotel Raphael #3, Nerva Boutique Hotel #4,
  JK Place Roma #5
- Gemini: Singer Palace Hotel #1, The First Roma Arte #2, Nerva Boutique Hotel #3, Charme Spagna Boutique
  Hotel #4, Hotel Travé #5, Eitch Borromini #6, Hotel Vilòn #7, Piazza di Spagna 9 #8, Otivm Hotel #9,
  Roma Boutique #10 (flagged — generic-sounding, uncertain whether a real named hotel or a mis-parsed
  category label)
- Meta: Hotel Raphael #1, Hotel Art #2, (position #3 missing from the list), Hotel Campo de' Fiori #4,
  Hotel Vico #5
- Perplexity: Lifestyle Suites Rome #1, Villa Spalletti Trivelli #2, The First Luxury Art Hotel #3,
  ~~"Piazza di Spagna" #4~~, ~~"Foro di Augusto" #5~~, ~~"Colosseo" #6~~ (all three removed as noise —
  Roman landmarks, not hotels)

**English (prompt 223):**
- Claude: Eitch Borromini #1, Casa Monti Roma #2, Portrait Roma #3, (position #4 missing), G-Rough #5
- Gemini: **no competitors extracted**, despite prose discussing several boutique hotels
- Meta: Hotel Art #1, G-Rough #2, Hotel Panda #3, Casa Fabbrini #4, The St. Regis Rome #5, Margutta 19 #6,
  Mario de' Fiori 37 #7
- Perplexity: Gigli D'Oro Suite #1, The First Luxury Art Hotel #2, Dharma Boutique Hotel & Spa #3, Singer
  Palace Hotel Roma #4, Hotel Artemide #5, Hotel San Anselmo #6

**Removed as noise:** "Piazza di Spagna," "Foro di Augusto," "Colosseo" (Perplexity IT #4–6).

**Strongest cross-engine name:** **Singer Palace Hotel** appears in Claude (IT #2), Gemini (IT #1), and
Perplexity (EN #4, as "Singer Palace Hotel Roma") — 3 of 4 engines, spanning both languages. **The First
Luxury Art Hotel** is Perplexity's own stable pick in both languages (IT #3, EN #2). **Hotel Art** is
Meta's consistent top pick in both languages (IT #2, EN #1).

### 2. Best restaurants for a business dinner in Rome (Italian and English)
**Italian (prompt 224):**
- Claude: Il Convivio Troiani #1, Orma Roma #2, Glass Hostaria #3, Ristorante Amedeo #4,
  ~~"Prassede Palace Hotel & Conference" #5~~, ~~"Hotel The Hive" #6~~ (both removed as noise — hotels, not
  restaurants), Osteria Fratelli Mori #7, Alla Bottega Trattoria de Santis #8
- Gemini: **no competitors extracted**, despite prose discussing venues
- Meta: La Rosetta #1, Il Pagliaccio #2, La Gensola #3, Il Convivio #4, La Campana #5, Supplizio #6,
  Trapizzino #7
- Perplexity: ~~"Pesce di Alta Qualità" #1~~ (a description, "high-quality fish," not a name), Ristorante
  Grazia Deledda #2, ~~"Hotel San Francesco" #3~~ (a hotel, not a restaurant), ~~"TheFork" #4~~ (a
  reservation platform, not a restaurant), ~~"Via Ermanno Wolf Ferrari, 252" #5~~, ~~"Via Portuense, 197"
  #6~~ (both street addresses, not names), ~~"Indirizzo" #7~~ (Italian for "address"), ~~"Contatti" #8~~
  (Italian for "contacts") — **the most heavily noise-corrupted single response encountered anywhere in
  this research program**; only 1 of 8 extracted entries was a genuine restaurant name

**English (prompt 225):**
- Claude: La Matriciana #1, Il Metropolitan #2, Capo Boi #3, Tribuna Campitelli #4
- Gemini: La Pergola #1, Aroma Restaurant #2, Enoteca la Torre #3, Pierluigi #4, Dal Bolognese #5,
  Salumeria Roscioli #6, Gusto #7, Osteria Sant'Uffizio #8, Modo Roma #9, ~~"Hotel The Hive" #10~~
  (removed as noise — a hotel, not a restaurant)
- Meta: La Rosetta #1, Il Pagliaccio #2, La Gensola #3, Il Convivio #4, La Campana #5
- Perplexity: ~~"Ornelli Black Angus" #1~~ (kept, plausible steakhouse name), Ristorante Grazia Deledda #2,
  ~~"Hotel The Hive" #3~~, ~~"Hotel San Francesco" #4~~ (both removed, hotels not restaurants),
  ~~"Via Alessio Baldovinetti, 8" #5~~, ~~"Via Fabio Massimo, 101" #6~~ (both removed, street addresses)

**Removed as noise:** "Prassede Palace Hotel & Conference," "Hotel The Hive" (×3 occurrences),
"Hotel San Francesco" (×2), "Pesce di Alta Qualità," "TheFork," two street addresses, "Indirizzo,"
"Contatti."

**The headline finding for this category: Meta AI gave a word-for-word identical, identically-ordered
5-restaurant list in both Italian and English** — La Rosetta, Il Pagliaccio, La Gensola, Il Convivio, La
Campana, in that exact order, both times. This is the strongest single-engine language-stability result
found anywhere in this research program to date — not just a stable top pick, but a fully-reproduced
ranked list. Ristorante Grazia Deledda is Perplexity's own stable secondary pick (#2 in both languages).
No cross-engine consensus exists beyond these within-engine repeats — Claude, Gemini, and Meta all name
completely different restaurants from one another.

### 3. Best real estate agencies for buying a home in Rome (Italian and English)
**Italian (prompt 226):**
- Claude: Homeplace Group #1, Quality Immobiliare Aniene #2, Saturno Immobiliare #3, Roma Immobiliare /
  Scotti Case #4, Studio Fori #5, Tecnocasa #6, Tempocasa #7, RockAgent #8, Engel & Völkers Roma #9,
  WONDERHOME Italian Luxury Real Estate #10
- Gemini: **no competitors extracted**
- Meta: Tecnocasa #1, Remax #2, Immobiliare Roma #3, Gruppo Gabetti #4, Beba Immobiliare #5, Colombo
  Immobiliare #6, Rinaudo Immobiliare #7
- Perplexity: MONDORE #1, Dominvest #2, Gruppo Immobiliare Coppedè #3, Chiavi di Roma #4, HouseDream #5,
  Studio Fori #6, Scotti Case #7, La Casa Capital #8, Rome Exclusive #9, Great Properties Real Estate #10

**English (prompt 227):**
- Claude: Engel & Völkers Roma #1, (position #2 missing), WRE #3, WONDERHOME Italian Luxury Real Estate #4,
  Great Properties #5, GC Immobiliare #6, Bovi RE #7, Alba Luxury #8, Immobiliare.it #9
- Gemini: **no competitors extracted**
- Meta: Century 21 Italy #1, Gruppo Romano Immobiliare #2, Teknekasa #3 (likely a typo of "Tecnocasa"),
  Immobiliare.it #4, Lacasadicentro #5, Pirelli Real Estate #6, Selezione Immobiliare #7,
  ~~"Centro Storico" #8~~, ~~"Monti" #9~~, ~~"Prati" #10~~ (all three removed as noise — Roman
  neighborhood names, not agencies)
- Perplexity: Roma Immobiliare #1, Scotti Case #2, Studio Fori #3, MondoRe #4, Dominvest #5, Gruppo
  Immobiliare Coppedè #6, Chiavi di Roma #7, HouseDream #8, La Casa Capital #9, Rome Exclusive #10

**Removed as noise:** "Centro Storico," "Monti," "Prati" (Meta EN #8–10).

**A second, even cleaner full-list stability result: Perplexity named essentially the identical set of 9
agencies in both Italian and English, just reordered** — MONDORE/Dominvest/Gruppo Immobiliare Coppedè/
Chiavi di Roma/HouseDream/Studio Fori/Scotti Case/La Casa Capital/Rome Exclusive appear in both language
runs, with only the ranking shuffled. Claude and Meta, by contrast, swap large portions of their lists
between languages — Claude promotes Engel & Völkers Roma from #9 (Italian) to #1 (English); Meta's Italian
list (Tecnocasa, Remax, Immobiliare Roma...) and English list (Century 21 Italy, Gruppo Romano
Immobiliare...) share only a possible Tecnocasa/Teknekasa overlap. Gemini extracted nothing in either
language.

### 4. Which hotel is recommended near Termini station in Rome? (Italian and English)
**Italian (prompt 228):**
- Claude: NH Collection Roma Palazzo Cinquecento #1, Starhotels Metropole #2, Bettoja Hotel Mediterraneo
  #3, UNA Hotels Decò Roma #4, Hotel Diocleziano #5, Hotel Aphrodite #6
- Gemini: **no competitors extracted**
- Meta: **no competitors extracted**, despite the prose explicitly recommending "Hotel Panda" by name
- Perplexity: Hotel Charter #1, Bettoja Hotel Mediterraneo #2, Hotel Diocleziano #3, Starhotels Metropole
  #4, MEININGER Roma Termini #5, Hotel Milani #6, Hotel Morgana #7

**English (prompt 229):**
- Claude: NH Collection Palazzo Cinquecento #1, Anantara Palazzo Naiadi Rome Hotel #2, St. Regis Rome #3,
  Hotel Artemide #4, iQ Hotel Roma #5, Hotel Diocleziano #6, Best Western Plus Hotel Universo #7
- Gemini: **no competitors extracted**
- Meta: **no competitors extracted**, despite the prose explicitly recommending "Hotel Art" by name
- Perplexity: NH Collection Roma Palazzo Cinquecento #1, Bettoja Hotel Mediterraneo #2, Hotel Diocleziano
  #3, The Romehello #4, Raeli Hotel Siracusa #5, Varese Hotel #6

**The most severe extraction gap of the Rome dataset:** Gemini and Meta both failed to extract any
structured competitors on this prompt, in **both** languages — 4 of the 4 possible Gemini/Meta responses
came back blank, despite Meta's own prose explicitly naming specific hotels (Hotel Panda in Italian, Hotel
Art in English) each time. Only Claude and Perplexity produced usable data for this prompt.

**Among the two engines that did extract data:** **NH Collection (Roma) Palazzo Cinquecento** was ranked
#1 every time it appeared (Claude IT, Claude EN, Perplexity EN). **Hotel Diocleziano** was the single most
consistently-named hotel overall — it appears in all 4 of the responses that produced structured lists
(Claude IT #5, Perplexity IT #3, Claude EN #6, Perplexity EN #3) — though never as the top pick.
**Bettoja Hotel Mediterraneo** also appears 3 times (Claude IT #3, Perplexity IT #2, Perplexity EN #2).

## Cross-engine consensus table (summary)

| Category | Strongest result | Pattern |
|---|---|---|
| Business dinner restaurants | **Meta: identical 5-restaurant ranked list, both languages** | Within-engine full-list stability, no cross-engine agreement |
| Real estate agencies | **Perplexity: same 9-agency set, both languages, reordered** | Within-engine full-list stability, no cross-engine agreement |
| Boutique hotels (historic center) | Singer Palace Hotel | 3/4 engines, spans both languages |
| Hotel near Termini station | NH Collection Palazzo Cinquecento (top pick); Hotel Diocleziano (most frequent) | 2/4 engines (only Claude & Perplexity extracted usable data) |

## Structural observations specific to Rome

1. **Rome's headline pattern is fundamentally different from every prior city in this program: no single
   brand achieved a clean 3-or-4-engine cross-engine consensus the way StreetEasy (New York), Qonto
   (Paris), or Hilton (Madrid) did.** Instead, the striking result is *within-engine* language stability —
   Meta reproduced an identical ranked restaurant list in two languages, and Perplexity reproduced an
   almost-identical real-estate agency set. Rome's AI Visibility landscape looks less like "one engine
   agrees with another" and more like "each engine has its own stable, internally-consistent worldview that
   doesn't transfer to other engines."

2. **Gemini's extraction gap is the worst of any city in this program** — zero structured competitors on 5
   of 8 prompts, despite discussing brands in prose for most of them. Combined with New York's earlier
   4-of-8 gap rate, this reinforces the pattern flagged there: Gemini's answer format (bold prose / loosely
   structured lists) appears to correlate with prompt type in ways the current extraction pipeline doesn't
   fully capture — worth Master-Reasoning's attention as a cross-city pattern, not a one-off.

3. **Meta failed completely (both languages) on one specific prompt (hotel near Termini station) despite
   explicitly naming hotels in its own prose** — the most severe single-prompt extraction failure recorded
   in this program, since it affected both language variants of the same question for the same engine.

4. **Data quality varied unusually widely within a single response** on the Italian business-dinner prompt
   — Perplexity's answer mixed one genuine restaurant name with seven non-restaurant fragments (street
   addresses, generic Italian labels like "Indirizzo"/"Contatti," a reservation platform, and hotel names).
   This is the messiest single extracted response encountered in the research program to date and is a
   useful concrete example for any future extraction-pipeline hardening work.
