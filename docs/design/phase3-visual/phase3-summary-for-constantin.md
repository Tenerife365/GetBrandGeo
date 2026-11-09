# Dashboard visual upgrade: what changes, for your approval

Nothing is built until you say go. Full spec: `docs/design/phase3-visual/phase3-visual-spec.md`.

**Everywhere.** The app takes on the same dark and light colours as getbrandgeo.com, so the site and the dashboard look like one product. Purple stays the brand, used only for the button you should press, what is selected, and your own brand in charts. Every page opens with one big number and one plain sentence saying what it means. Red, orange and green stop being used for ordinary numbers, so the screen stops looking alarmed. Light mode is rebuilt properly underneath, so it no longer depends on 92 one-off patches. Brand-new accounts never see "0%" or "Needs work" before any data exists; each page shows one clear next step instead.

**Menu.** The left menu becomes calm and neutral, with a thin purple marker on the page you are on. On phones the bottom bar goes from 7 cut-off labels ("Overv...", "Reco...") to 5 readable ones: Overview, Visibility, Sentiment, Mentions, More.

**Overview.** The score ring loses its glow and gets a sentence beside it ("named in 48% of AI answers") plus how many checks it is based on. The 48% stops being orange.

**AI Visibility.** The best sentence on the page ("recommended in 9 of 20 prompts") moves from halfway down to the top. Long lists you rarely need (prompts where you do not appear yet, failed checks, the symbol key, competitors) fold away behind one-line summaries. The page gets roughly half as long.

**Sentiment.** Four boxes and a bar that all said the same thing become one block with one bar. The clipped chart labels are fixed. A brand-new account gets a button instead of a dead end.

**Mentions.** Three boxes become one headline; the green ranks turn plain; on phones the 9 filter buttons become one dropdown.

**Competitors.** Competitors stop being shown in red (they are a fact, not an error). The bar chart becomes a readable list, and the detailed charts fold away.

**Recommendations.** The actions move to the top, under one sentence saying where to start. The red alarm box and red chips go. The badge that overlapped Refresh on phones is fixed.

**Prompts.** 24 separate boxes become one clean list; edit and archive are always visible; the yellow limit banner gets quieter.

**Your six decisions** (default is yes to all): 1) new neutral background colours; 2) the new colour tokens; 3) three colours change: the Google AI Overviews engine (it reads as grey today), plus the positive and neutral sentiment colours (colour-blind users cannot tell positive from negative in light mode today); 4) the 5-slot phone menu, or swap Mentions for Recommendations; 5) the one-sentence answer on each page, final wording by the copy seat; 6) bold text capped one step lighter everywhere.

**Not design, found on the way:** the demo shows broken Romanian letters, the demo Sentiment page says 10 positive but lists none, and the demo Prompts page says "24 of 5". Those are data fixes for the builder.
