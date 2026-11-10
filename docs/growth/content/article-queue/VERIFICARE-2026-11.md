# VERIFICARE batch 1, 12 to 21 noiembrie 2026

Standard: `G:\My Drive\CST Ops\AUDIT\STANDARD.md` (a Fapte, b Directie, c Imagine, d Link, e CTA, f Limba). Verdicte: OK / MINOR / CRITIC. Verificat 2026-11-10. Nimic comis, nimic publicat, baza de date doar citita.

Note comune tuturor draft-urilor:
- c (imagine): imaginea OG o genereaza template-ul din dictionarul `og` al draftului, text in engleza, potrivit cu titlul. Neinspectata vizual, deci "neverificat vizual", nu OK.
- d (link): template-ul adauga butonul `/#free-audit` si link-ul din nav; linkurile interne nu poarta UTM. OK. Linkurile interne bg-NNN citate exista toate.
- e (CTA): `cta_h` si `cta_p` in engleza, public din afara Romaniei. OK.
- f: scanare dash (em/en) cu `rg`, control pozitiv reusit: 0 aparitii in toate cele 8 draft-uri.
- b: restrictiile proiectului respectate (niciun nume de persoana, fara buzzwords, noiembrie nu se amesteca cu iulie). Subiectele sunt cele din coada.

## 2026-11-12, Austin (client 58)
- a: **MINOR, corectat.** Propozitia veche: "many of its bold spans were ratings and review counts ("4.7 stars with 1,200+ reviews") or advice labels, not firms." Noua: "ChatGPT bolded the most, but not every bold span is a firm: 21 of its 164 contain a digit (a rating, a review count or a number inside a label), and others are advice labels." Reverificat in DB: lungimi medii 4394/2826/4295, spanuri bold 164/105/115.
- Neverificat (numarate de mana in draft, nerecalculabile din DB): 16 firme, 12 constructori, 38 constructori (23 de un singur motor), 2 administratori de proprietati, 2 firme de imigrari, "ChatGPT si Claude au impartit inca doi administratori pe care Gemini nu i-a mentionat".
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-13, ChatGPT search share
- a: **MINOR, corectat de doua ori:** am atenuat o afirmatie despre descrierea OpenAI si o propozitie despre utilizatorii saptamanali, care nu se sustineau exact de sursa. Sursele (Big Technology, BrightLocal) deschise si concordante. Cifrele din BG-106/107/108/109/111 se potrivesc cu HTML-ul publicat.
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-14, Portland (client 65)
- a: **MINOR, corectat.** Veche: "many of its bold spans were ratings, award names and advice labels, not firms." Noua: "...many of its bold spans were descriptive labels such as "IP litigation" or "IP boutique work", not firms." DB: lungimi 4924/2776/3699, spanuri 185/111/97, ChatGPT 56 spanuri in raspunsul IP.
- Inconsecventa ramasa, nereparata: nota de numarare manuala spune ca o firma are sufix "IP Group" intr-o linie bold, corpul spune trei firme Gemini cu acest sufix (datele sustin trei). Decide Constantin sau hubul care text e corect, nota e interna.
- Neverificat (numarat de mana): 14 firme, 21 berarii (4/7/10), 6 administratori de proprietati numiti de doua motoare, 2 firme PI in plus, 1 firma IP in plus (ChatGPT si Claude).
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-15, Search Console AI
- a: **OK cu rezerva.** Toate cele 4 surse (Google Search Central blog, ajutor Search Console 16984139, PDF CMA, Search Engine Journal) raspund HTTP 200 (2026-11-10). Linkurile bg-070, bg-099, bg-104 exista. "591 answers" concorda cu BG-106 pana la 113. Ce spune fiecare sursa am luat din tabelul de surse al draftului (citit 2026-11-06); continutul paginilor nu l-am recitit azi, doar codul HTTP. Neverificat deci: textul exact al surselor, la zi.
- Termen: draftul trebuie publicat pana pe 2 decembrie.
- Nicio modificare. b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-16, Engine scorecard
- a: **MINOR, corectat.** Toate cifrele (88/57/77/83/96/89/15/119/50/29, 15 din 20, 13 din 19, taxe 7/7/4/2/0, 14 din 20 Perplexity imigrari, 30 din 39 verificari de licenta ChatGPT, 21 raspunsuri Gemini cu interviu) coincid cu bg-106 pana la bg-113. Gresita era comparatia: "second only to ChatGPT's 30" amesteca doua metrici (30 e cifra pentru verificarea licentei, nu pentru interviu). Acum: "Gemini told the buyer to interview several firms in 21 answers (BG-111)."
- b OK, c neverificat vizual, d OK (bg-016, 106 pana la 113 exista), e OK, f OK.

## 2026-11-17, Las Vegas (client 64), lungit
- Cuvinte corp: 769 -> circa 938. Adaugat doua sectiuni din datele de mana deja in draft: "Gaming law against event planning, side by side" (tabel: nume 15/30; comune celor trei motoare 5 (33%)/1 (3%); doua motoare 1/8; un singur motor 9 (60%)/21 (70%); 5+1+9=15, 1+8+21=30) si "Immigration: no overlap at all". Nicio cifra noua.
- a: OK pe ce am adaugat; cifrele de baza raman numarate de mana (neverificate independent). b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-20, Orlando (client 66), lungit
- Cuvinte corp: 775 -> circa 904 (peste 900 la limita).
- a: **MINOR, corectat.** (1) Explicatia diferentei 3 vs 6 (nepusa pe date) inlocuita cu ce sustin cifrele pe intrebare: "The difference is in three questions: the three spellings of Casiola, one real estate agent and one timeshare law firm, each of which an exact match on bold text did not connect across the three answers." (2) "many of its bold spans were ratings, fee labels and questions to ask a manager" atenuat la "a bold span is not always a firm: fee labels, ratings and advice were removed by hand." Adaugat tabel potrivire exacta vs citire manuala pe intrebare (exact 1,0,2,0,0,0 = 3; manual 1,1,2,0,1,1 = 6) si "How much of the property management list was shared" (2 din 22 = 9%, 5 = 23%, 15 = 68%).
- Neverificat: de ce potrivirea exacta a ratat agentul si firma de timeshare (dedus doar din numaratori).
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-21, immigration languages (clienti 28 pana la 47, colectat 24 si 25 iulie)
- Cuvinte corp: 663 -> 914. Adaugat din cifrele deja in draft: procente pe motor (Google AI Mode 83%, Gemini 65%, Claude 55%, ChatGPT 16%, Perplexity 0%; total 42 din 97 = 43%), sectiunea "From a word match to a hand read" (54 potriviri de cuvant, 12 eliminate: 11 Perplexity, 1 Google AI Mode; randurile 2872 si 2631 din notele draftului), tabel spaniola vs alta limba pe motor (31 si 19; 31 din 42 = 74%) si "Is it just the stored text length?" (plafon Claude circa 3.800 caractere; mediana ChatGPT circa 4.700 caractere, citata din bg-112, verificat in HTML-ul publicat).
- a: OK pe ce am adaugat (aritmetica: 3+8+10+10=31, 8+8+3=19, 3+11+13+15=42, 54-42=12). Neverificat: cele 42 de citiri manuale, facute inainte de mine. Avertisment pe pagina: coloanele spaniola/alta limba se suprapun, spus in text.
- b OK (iulie nu e amestecat cu noiembrie), c neverificat vizual, d OK, e OK, f OK.

## BATCH 2, verificat 2026-11-10

Draft-urile 17 (Las Vegas), 20 (Orlando) si 21 (limbi imigrare) au deja verdict complet pe fiecare criteriu in sectiunile de mai sus (batch 1), nu doar lungire. Nimic de refacut.

## 2026-11-18, SafeGEO
- a: **OK.** Sursele (EMNLP 2026 pe ACL Anthology, BrightLocal 97%, blogul Google din 17 nov 2025) raspund 200 si cifrele din abstract se potrivesc. Draftul spune ca a citit doar listarea si abstractul si nu pretinde mai mult. Cifrele din bg-082, 083, 108 (186 din 591, 86%) si 112 (329 din 591) se potrivesc. Neverificat: formularea ca aparari "nu au refacut performanta", care sta pe o singura fraza din abstract.
- Nicio modificare. b OK, c neverificat vizual, d OK, e OK, f OK (0 dash).

## 2026-11-19, consumers ask AI
- a: **MINOR, corectat.** "267 ratings quoted" a devenit "267 distinct ratings quoted", ca in bg-108 (229 din 267 la 4.5 sau peste). Toate cifrele BrightLocal verificate pe pagina sursa (1.002 adulti, 455 utilizatori AI, 45% vs 6%, 31%, 23%, 64%, 24%, 71% vs 83%, 63%, 10%, 53%, 88%, 51%, 37%, 97%, 42%, 23/59/18). Cifrele din bg-108/109/111 se potrivesc. Data lucrului pe teren nu e afirmata de draft, corect.
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-22, tool agents (Peec, Scrunch, Profound)
- a: **OK.** Toate cele 4 surse deschise azi si confirmate: Peec blog (21 oct 2026, peste 25 de conexiuni, Linear/HubSpot/Customer.io/PostHog/Clay/lemlist, aprobare inainte de schimbari, trei categorii de recomandari, credite partajate, inclus in fiecare plan), Peec docs (Auto per chat si ca implicit, Always allow/Ask/Never, rutine read-only/Ask/fara intrebare, credite 500/750/1.000/1.500/3.000, fara report, Notion/Lovable/Webflow), Sitecore (3 iunie 2026, AXP, SitecoreAI), Profound (15 sep 2026, AI Marketer, Ads Studio). Paginile brandgeo-vs-peec, scrunch, profound exista. Draftul isi declara interesul (BrandGEO vinde un produs concurent) si ca BrandGEO nu are agent.
- Nicio modificare. b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-23, geo survey (arXiv 2607.14035)
- a: **MINOR, corectat.** Abstractul arXiv citit din nou: titlu, 15 iul 2026, cs.IR, 45 studii, relevanta si pozitia in context, euristici generice, competitie, rescrieri pentru citare, vector de vizibilitate, ierarhie de dovezi, protocol: confirmate. Trei corectii: (1) abstractul spune "low source overlap", fara "across platforms"; am scos "across platforms" din corp, findings, og si nota de surse; (2) og avea "6 steps", dar abstractul numeste mai multi pasi (si prominence, factual absorption, fidelity); statul din og e acum "Chain of steps", iar textul spune ca tabelul condenseaza la sase pasi; (3) greseala de gramatica "It that reviews". Cifrele proprii (BG-107: patru motoare au numit o firma de fiecare data, Perplexity niciuna in 15 din 120) confirmate in bg-107; bg-082, 067, 016 exista.
- b OK, c neverificat vizual, d OK, e OK, f OK (0 dash).

## BATCH 3, verificat 2026-11-10

## 2026-11-25, AI Overviews local studies
- a: **OK.** Cifrele Whitespark si Local Falcon confirmate pe sursele deschise azi (studii din primavara 2025, draftul spune ca nu sunt reproduse de noi). Linkurile bg-078, 099, 083, 108, 109 exista; "77 of 111" concorda cu bg-109. Neverificat: nimic in plus.
- Nicio modificare. b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-26, AI Mode booking
- a: **MINOR, corectat.** Doua formulari nesustinute de sursa: (1) lista "party size, seats or price" nu e in postul Google, acum "with your needs and preferences"; (2) "names hotel and airline partners" nu e confirmat, acum "describes flight and hotel booking as coming later". Restul confirmat pe blogul Google (17 nov 2025, zece parteneri, restaurante fara Labs, bilete si programari pentru utilizatorii Labs din SUA) si pe pagina de ajutor (AI Pro/Ultra, 18+, cont personal, Workspace exclus, Incognito oprit). bg-108 (57 din 111) si bg-109 (77 din 111) concorda. Draftul declara ca cele doua pagini Google se contrazic.
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-28, tool ownership
- a: **MINOR, corectat.** "In the past year" nu acopera acordul HubSpot din 2025: schimbat in "Since late 2025" in corp, titlu, subtitlu si og. Cifra "2 of 3" din findings reformulata ca descriere (unul prin achizitie, unul prin acord). Comentariul de antet al draftului actualizat in consecinta.
- Declarat in draft: BrandGEO concureaza cu toate trei instrumentele.
- b OK, c neverificat vizual, d OK, e OK, f OK (0 dash).

## 2026-11-29, roundup oct-nov
- a: **MINOR, corectat.** Trei formulari atenuate: (1) clicurile din functiile AI "nu apar in acel raport azi" (SEJ: sunt amestecate in raportul standard); (2) "cut harmful target promotion by as much as 39.2 points but did not restore the agent's performance without the attacks" (abstract SafeGEO); (3) raportul de conformitate catre CMA: scoasa perioada "June to December", care nu s-a putut confirma (PDF trunchiat); ramane "is due" conform SEJ (3 ian 2027).
- Neverificat: perioada exacta a raportului CMA.
- b OK, c neverificat vizual, d OK, e OK, f OK.

## 2026-11-30, year-end checks
- a: **MINOR, corectat.** Toate cifrele (66%, Super Lawyers 125, Best Lawyers 101, Avvo 89, Justia 65, AILA 44, Zillow 39 din 98, RealTrends 20, FastExpert 19, HomeLight 18, Expertise 28, BBB 24, Google reviews 23, Yelp 21, 186 din 591, 86%, 5 din 267, 65 din 99, 77 din 111, 0 din 120, 2 din 120, 4 telefoane, 35 din 98, 25 din 591, 20, 64 si 3, 17 din 20, 269 din 591, mediana 30 ani, 51 din 98, 46 din 98, 32 din 99, 83 din 120, 8 din 111) concorda cu bg-106 pana la bg-113. Corectat in ld_desc "five published studies" (corpul citeaza sase): acum "published BrandGEO studies". Linkurile bg-081, 103, 106, 108, 109, 110, 112, 113 exista.
- b OK, c neverificat vizual, d OK, e OK, f OK (0 dash).

## Rezumat
- OK sau MINOR corectat: toate cele 17 (batch 1: 8, batch 2: 4, batch 3: 5). CRITIC: niciunul gasit.
- Cifre numarate de mana, nerecalculabile din DB, deci "neverificat" in toate draft-urile de oras (Austin, Portland, Las Vegas, Orlando) si in cel pe limbi.
- Fisiere modificate, toate sub `docs/growth/content/article-queue/drafts/` plus acest log. Nimic comis.
