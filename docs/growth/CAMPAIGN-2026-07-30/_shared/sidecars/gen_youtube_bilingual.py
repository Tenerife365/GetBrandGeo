# -*- coding: utf-8 -*-
# Generates sidecars for: youtube/shorts, bilingual/
#
# A YouTube upload has three text fields, so a Short gets three sidecars:
#   <base>.txt        the description
#   <base>-title.txt  the title
#   <base>-tags.txt   the tag field, comma separated, ready to paste
#
# -title and -tags sit beside the SILENT master only, because that is the file
# that gets uploaded (youtube/shorts/POSTS.md). The scored master is a paid,
# embed and deck copy, so it carries the description and nothing that would
# read as an instruction to upload it.
#
# The bilingual captions carry their own hashtags on the last line, so the
# fenced block is already the whole paste. Accented characters are correct and
# deliberate; only the five dash codepoints are banned.

from _common import write, unwrap

Y = "youtube/shorts/"
B = "bilingual/"


def short(stem, title, description, tags):
    body = unwrap(description)
    write(Y + stem + "-silent.txt", body)
    write(Y + stem + "-scored.txt", body)
    write(Y + stem + "-silent-title.txt", title)
    write(Y + stem + "-silent-tags.txt", tags)


def cut(folder, stem, caption):
    body = unwrap(caption)
    write(B + folder + "/" + stem + "-silent.txt", body)
    write(B + folder + "/" + stem + "-scored.txt", body)


# --------------------------------------------------- youtube shorts

short(
    "20260729-2200-youtube",
    "An AI answer costs you something your analytics does not report",
    """
Analytics is built around arrivals. Someone lands, a session opens, a source
gets attributed. Everything it reports starts at the moment a person reaches
you.

An AI answer happens before that. A buyer asks a question, reads a short reply
with a few businesses named in it, and picks one. If you were not among them,
nothing about that event reaches your reporting. There is no drop to
investigate and no line that goes down, which is what makes it easy to miss for
a long time.

The useful thing about it is that the answer itself is readable. You can put the
question your customers ask to an AI engine and see what comes back. What that
gives you is one point in time, on one wording, from one engine.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode on a schedule and keeps the record, so the comparison between
this month and last is already there when you want it.

https://getbrandgeo.com
""",
    "AI search, AI visibility, marketing analytics, ChatGPT, small business marketing",
)

short(
    "20260729-2318-youtube",
    "Your category already has a default answer in AI",
    """
A search result is a list you can move up. An AI answer is not shaped like
that. It names a few companies in a sentence or two, and whoever is in it is in
it.

That position is not awarded for spending. Engines assemble an answer from what
they can read about each company across the sources they trust, so the name that
keeps coming back tends to be the one described consistently in more than one
place. That is a different kind of work from advertising, and it is why the
answer often does not follow advertising spend.

It also means the position is not permanent. It moves when the material the
engines are reading changes.

Knowing whose name comes back today is the part that has to be measured rather
than assumed. BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude,
Perplexity and Google AI Mode and records who gets named, where in the answer,
and how it describes them.

https://getbrandgeo.com
""",
    "AI visibility, AI search, competitive strategy, Perplexity, brand strategy",
)

short(
    "20260730-0013-youtube",
    "We asked five AI engines the same question in three cities. One pattern held.",
    """
Three cities, one collection day, 24 July 2026. Six real buying questions in
each, put to ChatGPT, Claude, Gemini, Google AI Mode and Perplexity.

Ask for a property management company and the engines land on one name: 5 of 5
in Boston, 5 of 5 in Minneapolis, 4 of 5 in Detroit. Ask the same engines in the
same cities for a real estate agent and nothing gets past 2 of 5.

The city was held constant and the result still flipped, so what moved was the
category. Detroit shows it inside a single profession: seven law firms converge
on automotive and manufacturing law there, and the same names drop to loose
agreement the moment the question is about labour and employment law instead.

That distinction is worth more than it looks, because the two sides ask opposite
things of you. A converged category has an incumbent, and getting into the
answer means being documented better than they are. A fragmented one has no
incumbent yet, which is the cheaper position to be starting from.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and records who gets named, where in the answer, and how it
describes them.

https://getbrandgeo.com

The research this is drawn from:
https://getbrandgeo.com/ai-visibility-for-boston.html
https://getbrandgeo.com/ai-visibility-for-minneapolis.html
https://getbrandgeo.com/ai-visibility-for-detroit.html
""",
    "AI visibility, AI search, local SEO, market research, property management",
)

short(
    "20260730-0113-youtube",
    "Ranking first in Google does not mean you exist in an AI answer",
    """
This is not an argument that search stopped working. A page one position is
real, it is measurable, and it is worth having. The claim is narrower than that:
a rank tells you where you sit in a list of links, and it tells you nothing
about whether an engine names you when a buyer asks it a buying question. Two
measurements, and one does not predict the other.

We ran an AI Visibility audit for a brand that sits on page one of Google in its
category without working hard at it. Twenty real customer questions, the kind a
prospect actually types, put to each engine identically. On Gemini, that brand
appeared zero times across all twenty.

The uncomfortable part is that a gap like that stays invisible until somebody
looks for it. It leaves no mark in a rank tracker, because the event happens
somewhere a rank tracker was not built to look.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and records who gets named, where in the answer, and how it
describes them.

https://getbrandgeo.com

The research this is drawn from:
https://getbrandgeo.com/bg-004.html
https://getbrandgeo.com/bg-001.html
""",
    "SEO, AI visibility, Gemini, search marketing, AI search",
)

short(
    "20260730-0216-youtube",
    "We asked five AI engines the same question and all five gave the same name",
    """
No argument in this one. Just the working.

On 24 July 2026 we ran a set of real buying questions through five AI engines,
using the same pipeline we run for paying clients. One of them was typed exactly
like this:

"Top-rated property management companies in Chicago"

It went once each to ChatGPT, Claude, Gemini, Perplexity and Google AI Mode. All
five returned usable data on every prompt in that run, so nothing here rests on
a failed collection or a partial denominator.

All five named the same company. They did not agree on where to put it: first
from ChatGPT and Claude, second from Perplexity, fourth from Gemini, and Google
AI Mode surfaced it by name without giving it a position at all. Agreement on
the name, disagreement on the order. Worth being precise about what that means,
which is not a statement about the company's quality, just that five systems
arrived at it independently.

The limits matter as much as the finding. One city, one question, one collection
run. It does not establish a trend and it is not being presented as one.

The full run is published with all six questions, every engine and the
data-quality notes:
https://getbrandgeo.com/ai-visibility-for-chicago.html

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and records who gets named, where in the answer, and how it
describes them.

https://getbrandgeo.com
""",
    "AI search, AI visibility, market research, Perplexity, local business",
)

short(
    "20260730-0313-youtube",
    "The ten second check that tells you if AI knows your business exists",
    """
A tool, not an argument. You can run it in the next minute and you do not need
us for it.

Open any engine you already use. Do not type your own name: that returns a
description of you, which tends to read fine and answers a question no buyer
asked. Type what a buyer types before they have heard of you, along the lines of
"best [what you sell] in [your city]".

Then read the answer for three things, in this order. Whether you are named at
all. Where you sit if you are. And how you are described, because an engine can
name you and still frame you as the cheap option.

If you are not in the answer, that is your result, and it is worth being blunt
about what it means. Not ranked lower. Absent. There is no position to climb
from, and it will not show up in a rank tracker.

Then ask a second engine the same question, because they agree less often than
you would expect. On 24 July 2026 we put a real estate agent question to five
engines in Denver and not one name repeated across any two of them. Checking one
engine would have suggested that category was settled. It was not.

That is also the honest limit of the check you just ran: one question, one day,
one wording. Engines reword and re-rank between runs, so a single answer is a
single data point and is worth treating as one.

The full Denver run, with all six questions and the data-quality notes:
https://getbrandgeo.com/ai-visibility-for-denver.html

The check is free and nothing above takes that back. The difference is shape:
one run is a snapshot, and a record over time is what tells you whether anything
moved. BrandGEO asks your buyers' questions across ChatGPT, Gemini, Claude,
Perplexity and Google AI Mode on a schedule and keeps that record.

https://getbrandgeo.com
""",
    "AI search, AI visibility, small business marketing, ChatGPT, how to",
)

short(
    "20260730-0413-youtube",
    "An AI answer is a shortlist, and nothing tells you whether you were on it",
    """
A buyer asks an AI engine what to use in your category. It comes back with a
handful of names. That is a shortlist, not a page of links you can work your way
up, and it gets drawn before you are contacted.

What is lost at that point is not a visit. It is the chance to be considered,
which no landing page recovers later. And it happens upstream of everything you
actually control: your site, your ads, your reviews and your reputation all get
their turn after the answer has already been given.

The fair question is whether those answers are stable enough for any of that to
matter, or whether an engine simply says something different every time. So here
is one we measured. On 24 July 2026 we ran six real buying questions through
ChatGPT, Claude, Gemini, Google AI Mode and Perplexity in Washington DC. On the
lobbying and government relations question, two firms were named by all five
engines, and four of the five put them in the same rank order. Other categories
in the same run stayed fragmented, which is the other half of the finding.

The full Washington DC run, with every category and the data-quality notes:
https://getbrandgeo.com/ai-visibility-for-washingtondc.html

One run is a snapshot. What tells you whether anything moved is the record over
time. BrandGEO asks your buyers' questions on a schedule across ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode and keeps that record.

https://getbrandgeo.com
""",
    "AI search, AI visibility, demand generation, market research, Claude",
)

short(
    "20260730-0513-youtube",
    "An AI wrote a sentence about your company. You have not read it.",
    """
That sentence is not invented from nothing. An engine assembles it from material
it can find and match to your company: your own pages, directories, review
sites, press, forum threads, whatever it can read. Anything thin or years out of
date in that pile is material the answer gets built out of, and there is no
draft stage where you get to object.

The engines also read different sources and weight them differently, so each one
writes its own version. There is no single sentence to go and find and correct.

Two halves of the result, then, and they come apart. Whether an engine names you
is one measurement. What the answer says about you when it does is another, and
it is the one your buyer actually reads. You can appear in the answer and still
be the thing the recommendation is compared against.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and records both: whether you are named, and the wording that
comes back with your name on it.

https://getbrandgeo.com
""",
    "AI visibility, brand reputation, AI search, Claude, brand strategy",
)

short(
    "20260730-0613-youtube",
    "We asked AI the same question in two languages and got two different companies",
    """
In July 2026 we ran the same buyer questions twice: once in the local language,
once in English. Same categories, same day, same engines. Nothing changed
between the two runs except the language of the question.

In Berlin, two engines gave full multi-brand answers in German and returned
nothing usable for the identical question in English. Madrid was stranger. On
one prompt an engine answered in Spanish and went blank in English, while a
different engine did the exact reverse on the exact same prompt. There is no
rule here that English wins, or that the local language wins.

Paris is where it stops being a coverage problem. Asked in French about wealth
management advisors, the engines named independent local firms. Asked in
English, they named large international private banks. That is not the same
names reordered. It is a different competitive set, and a firm that showed up
repeatedly in the French answers was missing from the English ones altogether.
Not placed lower. Missing.

If you sell in more than one language, a result in one of them is weak evidence
about the other, and neither is something the engines report back to you.

BrandGEO runs the questions your buyers ask, in each language you sell in,
across ChatGPT, Gemini, Claude, Perplexity and Google AI Mode, and records who
gets named, where in the answer, and how it describes them.

https://getbrandgeo.com

The bilingual research this is drawn from, all collected 2026-07-10:
https://getbrandgeo.com/ai-visibility-for-berlin.html
https://getbrandgeo.com/ai-visibility-for-madrid.html
https://getbrandgeo.com/ai-visibility-for-paris.html
""",
    "AI search, AI visibility, international marketing, multilingual SEO, market research",
)

# ------------------------------------------------------- bilingual

cut("berlin", "berlin-de", """
Am 10. Juli 2026 haben wir Berlin zweisprachig erhoben: vier Kategorien, jede
zweimal gestellt, einmal auf Deutsch und einmal auf Englisch. Acht Fragen an
vier KI-Systeme, Claude, Gemini, Meta AI und Perplexity. Meta AI lief an dem Tag
mit und steht seit dem 16.07.2026 nicht mehr in unserem Set. ChatGPT fehlt in
dieser Erhebung, weil die Abfrage an dem Tag technisch fehlschlug. Das ist eine
Lücke in unseren Daten und keine Aussage über ChatGPT.

Was zurückkam: In einer Kategorie nannten 4 von 4 Systemen auf Deutsch dieselbe
Marke. In einer anderen gab es in beiden Sprachen keine Übereinstimmung. In
einer dritten antworteten zwei Systeme auf Deutsch ausführlich und lieferten auf
dieselbe Frage auf Englisch nichts Brauchbares.

Das Muster darunter ist unspektakulär. Kategorien, die auf wenigen gut
dokumentierten Produkten aufbauen, laufen auf eine kurze Liste zu. Kategorien
aus tausenden kleinen Kanzleien und Praxen zerfallen. Wer Berlin auf Deutsch und
auf Englisch bedient, deckt mit einer Messung genau eine dieser beiden Sprachen
ab.

Stand: 10.07.2026, erhoben mit unserer eigenen Pipeline. Die Auswertung steht
auf getbrandgeo.com.

#KISichtbarkeit #KISuche #Berlin #Startup #OnlineMarketing #GEO
""")

cut("berlin", "berlin-en", """
On 10 July 2026 we collected Berlin bilingually: four categories, each asked
twice, once in German and once in English. Eight prompts across four engines,
Claude, Gemini, Meta AI and Perplexity. Meta AI ran that day and left our
lineup on 2026-07-16. ChatGPT is missing from this run because its collection
failed that day, which is a hole in our data rather than a reading about
ChatGPT.

What came back: in one category, 4 of 4 engines named the same brand in German.
In another there was no agreement in either language. In a third, two engines
answered at length in German and returned nothing usable for the identical
question in English.

The mechanism underneath is ordinary. Categories built on a handful of well
documented products converge on a short list, because there is one consistent
signal for each engine to land on. Categories made of thousands of small firms
fragment. If you serve Berlin in German and in English, one measurement tells
you about one of those two languages.

As measured 2026-07-10 with our own collection pipeline. The write up is on
getbrandgeo.com.

#AIVisibility #AISearch #Berlin #GEO #MultilingualSEO #BrandVisibility
""")

cut("madrid", "madrid-es", """
El 10 de julio de 2026 medimos Madrid en dos idiomas: 4 categorías, cada una
preguntada una vez en español y una vez en inglés, en cuatro motores. Claude,
Gemini, Meta AI y Perplexity. Meta AI corría ese día y desde el 16/07/2026 ya no
forma parte de nuestro conjunto. ChatGPT no entró en esta recogida porque su
consulta falló ese día, así que es un hueco en nuestros datos y no una lectura
sobre ChatGPT.

En la pregunta del hotel de aeropuerto, un motor respondió en inglés y se quedó
en blanco en español. Otro hizo justo lo contrario. Lo que aparece al juntar las
dos pasadas es lo que más nos llamó la atención: los 4 motores que devolvieron
una respuesta utilizable nombraron el mismo hotel. La diferencia no estaba en
qué hotel decían. Estaba en si contestaban o no, y eso dependía del idioma.

En otra categoría el patrón cambió de forma: un motor repitió casi la misma
lista corta en los dos idiomas mientras otros dos daban listas que apenas se
solapaban entre sí. Eso ocurrió en esa pregunta concreta y no es un rasgo fijo
de ese motor.

Datos del 10/07/2026, recogidos con nuestra propia canalización. El desglose
está en getbrandgeo.com.

#VisibilidadIA #BusquedaIA #Madrid #MarketingDigital #SEO #GEO
""")

cut("madrid", "madrid-en", """
On 10 July 2026 we measured Madrid in two languages: 4 categories, each asked
once in Spanish and once in English, across four engines. Claude, Gemini, Meta
AI and Perplexity. Meta AI ran that day and left our set on 2026-07-16. ChatGPT
was excluded from this collection because its query failed that day, so that is
a gap in our data rather than a reading about ChatGPT.

On the airport hotel prompt, one engine answered in English and went blank in
Spanish. Another did the reverse. The part worth sitting with shows up when you
combine the two runs: the 4 engines that returned a usable answer named the same
hotel. The disagreement was not about which hotel. It was about whether the
engine answered at all, and that turned on the language of the question.

A second category showed a different shape. One engine repeated nearly the same
shortlist in both languages while two others produced lists that barely
overlapped. That held on that one prompt and is not a fixed trait of that
engine, which is worth saying because it would be easy to read it as one.

Collected 2026-07-10 with our own pipeline. The breakdown is on
getbrandgeo.com.

#AIVisibility #AISearch #Madrid #GEO #SEO #BrandVisibility
""")

cut("rome", "rome-it", """
Roma, 10 luglio 2026. Quattro categorie, ognuna chiesta una volta in italiano e
una volta in inglese, su quattro motori: Claude, Gemini, Meta AI e Perplexity.
Meta AI girava quel giorno e dal 16/07/2026 è fuori dal nostro set. ChatGPT non
era nella raccolta perché la sua interrogazione fallì quel giorno, quindi è un
buco nei nostri dati e non una lettura su ChatGPT.

Sul 5 su 5, perché non venga letto male: sono 5 ristoranti su 5, da 1 motore, in
2 lingue. Non sono cinque motori d'accordo fra loro. Con quattro motori nella
raccolta, un accordo a cinque non è nemmeno aritmeticamente disponibile.

Il resto della raccolta va nella stessa direzione. Un secondo motore ha
restituito quasi lo stesso gruppo di 9 agenzie immobiliari nelle due lingue.
Nessun marchio ha raggiunto l'accordo di 3 o 4 motori in questa raccolta. E un
motore non ha estratto alcun concorrente strutturato in 5 degli 8 prompt, pur
parlando di marchi nel testo della risposta.

Una misura datata resta leggibile anche quando il motore che l'ha prodotta non
c'è più. Dati del 10/07/2026, raccolti con la nostra pipeline. Il dettaglio è su
getbrandgeo.com.

#VisibilitaIA #RicercaIA #Roma #MarketingDigitale #SEO #GEO
""")

cut("rome", "rome-en", """
Rome, 10 July 2026. Four categories, each asked once in Italian and once in
English, across four engines: Claude, Gemini, Meta AI and Perplexity. Meta AI
ran that day and left our set on 2026-07-16. ChatGPT was not in the run, its
collection failed that cycle, so that is a gap in our data rather than a reading
about ChatGPT.

About the 5 of 5, so it cannot be misread: that is 5 restaurants out of 5, from
1 engine, across 2 languages. It is not five engines agreeing with each other.
With four engines in the run, a five engine agreement is not arithmetically
available on this data.

The rest of the collection points the same way. A second engine returned
essentially the same set of 9 real estate agencies in both languages. No brand
reached 3 or 4 engine agreement in this collection at all. And one engine
extracted zero structured competitors on 5 of the 8 prompts, while still
discussing brands in the prose of its answers.

A dated measurement stays readable after the engine that produced it is gone.
That is much of the argument for writing the date on the result. Collected
2026-07-10 with our own pipeline. The detail is on getbrandgeo.com.

#AIVisibility #AISearch #Rome #GEO #SEO #BrandVisibility
""")

cut("paris", "paris-fr", """
Paris, collecte du 10 juillet 2026. Quatre catégories, chacune posée une fois en
français et une fois en anglais, sur quatre moteurs : Claude, Gemini, Meta AI et
Perplexity. Meta AI tournait ce jour-là et a été retiré de notre dispositif le
16/07/2026. ChatGPT ne figurait pas dans cette collecte, sa récupération ayant
échoué ce jour-là. C'est un trou dans nos données et pas une lecture sur
ChatGPT.

La gestion de patrimoine n'était qu'une des quatre catégories, et les trois
autres ont donné trois formes différentes. Sur les hôtels, deux moteurs ont gardé
les mêmes têtes de liste dans les deux langues pendant que les deux autres
changeaient d'avis. Sur la restauration gastronomique, aucun nom ne s'est imposé
d'un moteur à l'autre. Sur la banque en ligne, les 4 moteurs ont placé le même
établissement en tête, dans les deux langues.

Ce dernier résultat mérite sa nuance et nous la publions. Sur la version anglaise
de cette question, deux moteurs ont renvoyé une liste de concurrents vide alors
que le texte de l'un d'eux citait bien l'établissement. C'est un défaut
d'extraction de notre côté et pas une absence d'opinion. Un moteur a également
perdu une réponse entière sur la question restauration en anglais.

Données du 10/07/2026, collectées avec notre propre chaîne. Le détail est sur
getbrandgeo.com.

#VisibiliteIA #RechercheIA #Paris #MarketingDigital #SEO #GEO
""")

cut("paris", "paris-en", """
Paris, collected 10 July 2026. Four categories, each asked once in French and
once in English, across four engines: Claude, Gemini, Meta AI and Perplexity.
Meta AI ran that day and left our set on 2026-07-16. ChatGPT was not in this
collection because its retrieval failed that day, so that is a hole in our data
rather than a reading about ChatGPT.

Wealth management was one of four categories, and the other three came back in
three different shapes. On hotels, two engines held the same top picks across
both languages while two others changed their minds. On fine dining, no name
carried from one engine to another. On online banking, the 4 engines put the
same provider at the top in both languages.

That last result deserves its caveat and we are publishing it. On the English
version of that prompt, two engines returned an empty competitor list even
though the prose of one of them named the provider. That is an extraction miss
on our side rather than an absence of opinion. One engine also lost a full
response on the English fine dining prompt.

Collected 2026-07-10 with our own pipeline. The detail is on getbrandgeo.com.

#AIVisibility #AISearch #Paris #GEO #MultilingualSEO #BrandVisibility
""")

print("gen_youtube_bilingual: done")
