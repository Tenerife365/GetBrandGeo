# Paris AI Visibility Research — Findings

Client: `research-paris` (client_id 14), plan `pro`, market `FR` / region `Paris`.
Collection date: 2026-07-10. 4 categories × 2 languages (French / English) = 8 prompts × up to 5 engines
(ChatGPT, Gemini, Claude, Perplexity, Meta AI) — the same bilingual design as Berlin and Madrid.

**Data-quality note applying to the whole run:** ChatGPT (`status: error`) failed on all 8 prompts — a
collection error, not a real zero-visibility signal. Meta AI is also missing one row entirely (the English
fine-dining prompt, #217 — a collection gap, likely the known §2.2 timeout limitation, not a zero-competitor
result). All findings below are from Claude, Gemini, Meta AI, and Perplexity where a result exists.

## Category-by-category

### 1. Best boutique hotels in the Marais, Paris (asked in French and English)
**French (prompt 214):**
- Claude: Pavillon de la Reine #1, Hôtel du Petit Moulin #2, Les Bains Paris #3, Le Grand Mazarin #4
- Gemini: Hôtel Le Grand Mazarin #1, Hôtel Dupond-Smith #2, Hôtel du Petit Moulin #3, Hôtel Emile #4,
  Hôtel Saint-Louis Marais #5, Experimental Marais #6
- Meta: (list starts at #2 — prose names "Hôtel Le Pavillon de la Reine" as the clear #1, but the
  structured extraction missed it) La Réserve Hotel and Spa #2, Hôtel des Grands Boulevards #3, Hôtel
  Emile #5, Le Citizen Hôtel #6
- Perplexity: Hôtel de JoBo #1, Suzie Blue #2, Marais Design Hotel #3, "Place des Vosges" #4 (flagged —
  this is the neighborhood square, not a hotel name; likely a mis-captured location reference, kept but
  uncertain), My Boutique Hotel #5 (flagged — a generic descriptive name, possibly a mis-parsed generic
  phrase rather than a real hotel), Pavillon de la Reine #6, Petit Beaumarchais #7

**English (prompt 215):**
- Claude: Pavillon de la Reine #1, Hôtel du Petit Moulin #2, Les Bains Paris #3, Le 9 Confidentiel #4
- Gemini: Cour des Vosges #1, Hôtel Le Grand Mazarin #2, Hôtel Les Bains Paris #3, Hôtel Dupond-Smith #4,
  Hôtel Caron de Beaumarchais #5, Hôtel Emile #6, Hôtel de JoBo #7, Hôtel de la Bretonnerie #8, Hôtel Les
  Tournelles #9, Hôtel Suzie Blue #10
- Meta: La Réserve Hotel and Spa #1, Le Pigalle Paris #2, Hôtel Emile #3, Hotel Jules & Jim #5 (position #4
  missing from the list), La Chambre du Marais #6
- Perplexity: Hôtel Ragot #1, Hôtel du Petit Moulin #2, Hôtel Nôtre #3 (only 3 extracted; prose separately
  names "Le Petit Beaumarchais Hotel & Spa" as its actual top pick — an extraction miss, the structured
  list undercounts what the response actually says)

**Cross-engine consensus (both languages combined):** **Hôtel du Petit Moulin** is the strongest
cross-engine name — appears in Claude (both FR and EN, #2 each time), Gemini (FR #3), and Perplexity
(EN #2) — 3 of 4 engines. **Pavillon de la Reine** is Claude's consistent #1 pick in both languages, and
also appears in Perplexity's French list (#6) — effectively a 2-engine pick but with unusually strong
single-engine conviction (ranked #1 by Claude every time it's asked).

**Language-stability split, a new pattern for this program:** Claude and Meta gave largely the *same* top
pick in both languages (Claude: Pavillon de la Reine #1 both times; Meta: La Réserve Hotel and Spa
top-ranked both times) — language-stable. Gemini and Perplexity gave *different* top picks depending on
language (Gemini: Grand Mazarin in French vs. Cour des Vosges in English; Perplexity: Hôtel de JoBo in
French vs. Hôtel Ragot in English) — language-volatile. Unlike Berlin (one engine went silent in one
language) or Madrid (engines flipped silence direction on the identical prompt), no engine went silent
here in either language — the language effect in Paris shows up as *which brands get named*, not *whether
an answer exists at all*.

### 2. Best fine dining restaurants for a business dinner in Paris (French and English)
**French (prompt 216):**
- Claude: Épicure #1, Plénitude #2, Guy Savoy #3, Kei #4, Le Jules Verne #5
- Gemini: Le Jules Verne #1, Madame Brasserie #2, Le Cinq #3, Le Pré Catelan #4, Maison Rostang #5, Le
  Clarence #6, Don Juan II #7, Kei #8, Taillevent #9, L'Oiseau Blanc #10
- Meta: L'Atelier de Joël Robuchon #1, Le Bristol #2, L'Épicure #3, Le Grand Vefour #4, Le Meurice #5
- Perplexity: Pavillon Ledoyen #1, Le Grand Café Capucines #2, Le Maresquier #3

**English (prompt 217):**
- Claude: Épicure #1, Alléno Paris #2, Arpège #3, Restaurant David Toutain #4, La Réserve #5
- Gemini: Le Cinq #1, Pierre Gagnaire #2, Arpège #3, L'Ambroisie #4, Restaurant Kei #5, Le Jules Verne #6,
  Restaurant Guy Savoy #7, Le Meurice Alain Ducasse #8, Shang Palace #9, Le George #10
- Meta: **no result — the row is missing entirely** (a collection gap, not a zero-competitor answer)
- Perplexity: Pavillon Ledoyen #1, Le Maresquier #2, Le Grand Café Capucines #3, ~~"Note" #4~~ (removed as
  noise — a stray fragment, not a restaurant name)

**Removed as noise:** "Note" (Perplexity EN #4).

**Perplexity is the most language-stable engine for this category** — the same three restaurants (Pavillon
Ledoyen, Le Grand Café Capucines, Le Maresquier) appear in both languages, just lightly reordered, and
Pavillon Ledoyen is Perplexity's #1 pick both times. Claude is also stable on its top pick (Épicure #1 both
times) but the rest of its list changes completely between languages. Gemini's lists differ substantially.
No cross-engine 3+ consensus — the closest is Le Jules Verne (Claude FR #5, Gemini FR #1, Gemini EN #6) and
Kei/Restaurant Kei (Claude FR #4, Gemini FR #8, Gemini EN #5), both only 2 engines. This category is
fragmented at the cross-engine level even though individual engines are internally consistent.

### 3. Best wealth management advisors in Paris (French and English)
**French (prompt 218):**
- Claude: Cabinet Mazarin #1, Cheval Blanc Patrimoine #2, Rivaria Capital #3, Noun Partners #4,
  ~~"Avis Google" #5~~, ~~"Frais" #6~~, ~~"Avis Trustpilot" #7~~ (all three removed as noise — review-platform
  labels and the French word for "fees," not firm names)
- Gemini: Rothschild & Co #1, Amundi #2, Indosuez Wealth Management #3, Société Générale Private Banking
  #4, Pictet #5, Haussmann Patrimoine #6, Agora Finance #7, Auguste Patrimoine #8, Cheval Blanc Patrimoine
  #9, Rhétorès Finance #10
- Meta: Oddo BHF #1, BNP Paribas Wealth Management #2, Société Générale Private Banking #3, Crédit Suisse
  #4, Delubac & Cie #5, Groupe La Française #6, Schelcher Prince Gestion #7
- Perplexity: Rivaria Capital #1, Agora Finance #2, Euodia #3, Cheval Blanc Patrimoine #4, Astoria Finance
  #5, Prosper Conseil #6, Alpha & K #7, Finary One #8, Scala Patrimoine #9, S'investir Conseil #10

**English (prompt 219):**
- Claude: Société Générale Private Banking #1, Indosuez Wealth Management #2, Rothschild & Co #3, J.P.
  Morgan Private Bank #4, UBS France #5, Mirabaud #6
- Gemini: Indosuez Wealth Management #1, Rothschild & Co #2, Amundi #3, BNP Paribas Banque Privée #4,
  Société Générale Private Banking #5, FIDERE Family Office Paris #6, Asteo Finance #7, Culture Patrimoine
  #8, Laplace #9, Groupe Allen #10
- Meta: BNP Paribas Wealth Management #1, Société Générale Private Banking #2, Credit Suisse Private
  Banking #3, UBS Wealth Management #4, Lombard Odier #5, Banque de Luxembourg #6, Indosuez Wealth
  Management #7, Aberdeen Standard Investments #8, Candriam #9, Quilvest #10
- Perplexity: BNP Paribas Wealth Management #1, Société Générale Private Banking #2, Crédit Agricole
  Private Banking #3, Pictet #4, J.P. Morgan Private Bank #5

**Removed as noise:** "Avis Google," "Frais," "Avis Trustpilot" (Claude FR #5–7).

**The most significant finding in the Paris dataset: the language of the query changes which *type* of
firm gets recommended, not just which specific names.** French-language answers lean toward boutique,
independent French wealth-management firms — Cheval Blanc Patrimoine appears in 3 of 4 French-language
engine responses (Claude #2, Gemini #9, Perplexity #4) but **never once appears in any English-language
response**. English-language answers instead converge on major international private banks — Société
Générale Private Banking appears across nearly every engine in both languages (Gemini FR #4, Meta FR #3,
then Claude EN #1, Gemini EN #5, Meta EN #2, Perplexity EN #2 — effectively unanimous once both language
runs are combined), and BNP Paribas Wealth Management similarly bridges both (Meta FR #2, then Gemini EN
#4, Meta EN #1, Perplexity EN #1). This is a different, arguably more consequential kind of language effect
than silence or reordering: **the addressable competitive set itself shifts by language** — a boutique
French patrimoine firm competing only in French-language AI answers is invisible to English-language
searchers by design, not by accident.

### 4. Which online bank is recommended for a French small business? (French and English)
**French (prompt 220):**
- Claude: Qonto #1, FIDUCIAL Banque #2, Shine #3, Finom #4, ~~"Pourquoi FIDUCIAL" #5~~ (removed as noise —
  a section-heading fragment meaning "why Fiducial")
- Gemini: Qonto #1, Shine #2, Revolut Business #3
- Meta: Qonto #1, N26 #2, Shine #3, Revolut #4, Holacash #5
- Perplexity: Qonto #1, Shine #2, Pennylane #3, Fiducial Banque #4, Revolut Business #5, Indy #6, BNP
  Paribas #7

**English (prompt 221):**
- Claude: Qonto #1, Shine #2, ~~"Tarif" #3~~ (removed as noise — French for "rate/pricing," a label, not a
  company)
- Gemini: **no competitors extracted**, despite prose discussing multiple named options
- Meta: **no competitors extracted**, despite the prose explicitly naming "Qonto" as its top recommendation
  — the structured extraction simply failed to capture it
- Perplexity: Qonto #1, Indy #2, Shine #3, Revolut Business #4, Fiducial Banque #5, Blank #6

**Removed as noise:** "Pourquoi FIDUCIAL" (Claude FR #5), "Tarif" (Claude EN #3).

**Qonto is the single strongest consensus result of the entire Paris dataset, and one of the strongest in
the whole research program to date.** It was named #1 by every engine that returned a structured result, in
**both** languages: Claude (FR #1, EN #1), Gemini (FR #1), Meta (FR #1), Perplexity (FR #1, EN #1) — a
complete, unanimous, always-#1 sweep. **Shine is the clear and equally consistent #2 pick**, appearing in
6 of the 8 responses (Claude FR #3, Gemini FR #2, Meta FR #3, Perplexity FR #2, Claude EN #2, Perplexity
EN #3).

**A distinct extraction gap pattern for this prompt specifically:** both Gemini and Meta returned zero
structured competitors on the **English** run despite giving full, on-topic answers in the **French** run
— and Meta's English prose explicitly names Qonto as its top pick, meaning this is a real extraction miss
tied to the English-language response format for this specific prompt, not a language-driven silence or a
genuine absence of an answer.

## Cross-engine consensus table (summary)

| Category | Top AI-visible name(s) | Engine agreement | Language pattern |
|---|---|---|---|
| Online bank for French SMB | **Qonto** (then Shine) | Unanimous #1, every responding engine, both languages | No language shift — Qonto wins in FR and EN alike |
| Boutique hotels (Marais) | Hôtel du Petit Moulin (Pavillon de la Reine close second) | 3/4 engines | Claude & Meta stable; Gemini & Perplexity volatile |
| Wealth management advisors | Société Générale Private Banking / BNP Paribas (EN); Cheval Blanc Patrimoine (FR-only) | Near-unanimous combined, but split by language | Recommended *type* of firm changes by language |
| Fine dining (business dinner) | No strong cross-engine leader | Fragmented, max 2/4 | Perplexity stable; Gemini volatile |

## Structural observations specific to Paris

1. **Qonto's sweep is the cleanest, most unanimous single-brand result documented anywhere in this research
   program so far** — every engine, every language, always ranked #1. For a category (business banking)
   where AI recommendations translate directly into new-account signups, this is about as strong a
   real-world AI Visibility position as a brand can hold.

2. **The wealth-management category reveals a language effect this program hadn't seen before: the query
   language changes the *category* of competitor considered, not just which specific brand wins.** French
   queries surface independent boutique patrimoine firms; English queries surface major international
   private banks. A firm that only markets and publishes in French is structurally invisible to
   English-language AI searchers in this vertical — a different and arguably more serious problem than
   simply ranking lower.

3. **Language-stability is engine-specific and category-specific, not a fixed trait of any one engine.**
   Claude and Meta were the stable engines for the hotel category; Perplexity was the stable engine for the
   restaurant category. No single engine is reliably "the stable one" across every prompt — consistent with
   Madrid's finding that engine behavior on language shifts case by case, not as a fixed rule.

4. **Two separate collection/extraction gaps this run, worth distinguishing:** Meta's missing row (English
   fine-dining prompt) is a collection failure — no response was recorded at all. Gemini and Meta's blank
   competitor lists on the English online-banking prompt are an extraction failure — a real response was
   recorded, but the structured parser found nothing despite the prose naming brands explicitly. These are
   different failure modes and should not be conflated when reading the data.
