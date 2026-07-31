# 06. TikTok

Four scripts, one per pillar, all TOFU, 25 to 45 seconds. Built against
`00-BRIEF.md` and `.claude/skills/growth-media-architect/SKILL.md`.

**Nothing here is scheduled or sent.** Drafts for review.

---

## Read before shooting

**These are not the Reels with a different filename.** The Reels in
`05-instagram.md` are narrated over graphics. Every script here is a person
talking to camera with graphics as support, cold open, mid-sentence, no bumper.
TikTok demotes content that reads as cross-posted, and the two formats are
different enough here that the same viewer could see both without noticing a
repeat. **Do not reuse a Reel voiceover on a TikTok cut.**

**Register.** Rougher and more direct than the Reels. Contractions are fine here
and are avoided on Instagram. Sentences can start with "and" or "so". The
argument does not get simpler, only less formal. The reader is still a founder or
a growth lead, so nothing gets explained twice.

**Safe area, 1080 x 1920 master.** Top 130 px, bottom 480 px, left 60 px, right
**250 px**. The right inset is larger than Meta's because TikTok's action rail is
taller and sits further in. All values are measurement-derived convention, not
documented; TikTok publishes none. Source:
`docs/growth/channel-specs-2026-07-29.md` §9.

**The caption changes the safe area.** A four-line caption pushes the bottom
inset up. Every caption below is under 100 characters, which is TikTok's own
recommendation and what keeps the 480 px figure honest.

**Burned-in captions throughout.** Auto-captions cannot be trusted with the
labels these scripts turn on, and in three of the four the label is the argument.

**Build target:** 1080 x 1920, H.264, 30 FPS, 8 to 12 Mbps, AAC stereo 128 kbps
48 kHz, MP4, `-movflags +faststart`. Matrix target R1, shared with Reels and
Shorts.

**Links.** No clickable link in a TikTok caption. Link in bio, and every script
below ends on a verbal instruction rather than an on-screen URL.

**Posting is manual and that is not a bug to fix.** Programmatic posting requires
the app to pass TikTok's audit; until it does, anything posted by an unaudited
client is restricted to private viewing. That is a review process with lead time.
Plan on posting these by hand.

**Existing assets** (real files):

| Path | Use |
|---|---|
| `docs/growth/brand-identity-2026-07-29/v3/png/mark-1024-on-dark.png` | End-card mark, all four scripts |
| `docs/growth/social-kit/tiktok/tiktok-profile-200x200.png` | Profile avatar, already built |
| `docs/growth/grok-launch/images/tiktok-cover-1080x1920.jpg` | Cover frame reference, P1 |
| `docs/growth/data-templates-2026-07-29/out/city-comparison_complete_story.png` | TT2, real rendered data at 1080 x 1920, already inside a safe band |
| `docs/growth/data-templates-2026-07-29/out/engine-comparison_bpr-2026-07-21_story.png` | TT3, real per-engine card at 1080 x 1920 |

**Note on the brief.** `00-BRIEF.md` puts P2's source at "bg-016.html plus the 37
city pages". The repository holds **27** city research pages plus 10 industry
pages and 1 index issue. No script below states a city-page count. Same flag as
`05-instagram.md`.

---
---

## TT1

**Pillar:** P1, two engines shipped and two turned down.
**Funnel:** TOFU.
**Hook driver:** Curiosity gap.
**Length:** 38 seconds.
**Source:** `brandgeo/web/bg-021-retrieval-not-engine-count.html`, the surface
comparison table and "An absent AI Overview is a result, not an error".

**Angle, and why it is not the Grok package's angle.** The existing P1 package at
`docs/growth/2026-07-29-grok-sixth-engine/` runs entirely on retrieval: engine
count is vanity, ask which of your engines actually searched. Its TikTok script
is a person arguing that a memory-based engine is worthless. This one takes the
beat BG-021 files second, that Google ships two separate AI answer surfaces and
most tools measure the one fewer people see, and gives it the whole runtime. It
also closes on the absent-overview finding, which the earlier package never
touched at all.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Person already mid-sentence, no intro, handheld. Text slams on at 1.0s: **"there are two Googles"** | "There are two Googles and your visibility tool is probably only watching one." |
| 1.5-6s | Person continues. A small wireframe floats bottom-left showing a tab bar with one tab lit. Label: **AI MODE**. | "The first one is AI Mode. It's a tab. Somebody has to actively click into it, and most people never do." |
| 6-12s | Second wireframe slides in above the first: an ordinary results page with the top block ringed violet. Label: **AI OVERVIEWS**. First wireframe dims. | "The second one is AI Overviews. That's the summary block sitting above the links on a normal search. Nobody opts into it. It's just there." |
| 12-19s | Cut to screen recording. Same question typed twice. Two ranked answer lists populate side by side, labelled **AI MODE** and **AI OVERVIEWS**. Three names differ. Differences circled live. | "Same question, both surfaces, and you don't get the same answer. Different products, different results." |
| 19-26s | Back to person. Text: **"one column. labelled Google."** A single dashboard row animates in behind them showing one Google entry. | "So when a tool gives you one row labelled Google, ask which one that is. Because if it's the tab, that's the smaller room, and it's being reported to you as the whole thing." |
| 26-33s | Screen recording. A query is run and no summary block appears at all. A result card fills in reading **"no AI Overview rendered"**, marked as a measurement, not an error. | "And here's the bit people find weird. Sometimes Google shows no AI summary at all for a query. We record that as a result, not a failed collection. Whether the block shows up for your customers' questions is a finding on its own." |
| 33-38s | Person, direct to camera. `mark-1024-on-dark.png` lower third. Text: **"ask which Google"** | "So go ask whoever sells you this. Which Google. Watch how long that takes." |

**Caption, 79 characters including hashtags:**

> there are two Googles and your tool is probably watching the wrong one
> #ai #seo

**Notes.** The 12 to 19 second beat is the proof and it needs a real screen
capture, not a mock. If a genuine side-by-side is not available before the send
gate clears, hold this script rather than staging the panels; a faked comparison
in a piece arguing that other tools misreport their sources is the worst possible
asset for this brand. Both panel labels go in the upper half of the frame, above
the action rail's reach and clear of the right 250 px. The 26 to 33 second beat
is the one nobody else in the category is publishing and it should be cut with
room rather than rushed to fit the runtime.

### Visual brief V-TT1, serves TT1

```
ENGINE: sora
SUBJECT: Talking-head piece, handheld, natural room. Support graphics are two
         abstract search-surface wireframes floating as small inset cards, never
         full-frame until the screen recording. Screen recording sections are
         real capture, treated only for contrast, not restyled. No real Google
         UI is reproduced in the illustrated sections.
COMPOSITION: 1080 x 1920, 9:16. Speaker framed left of centre so support cards
         and text can live on the right without colliding with the action rail;
         every graphic still stops at x = 830. All burned-in text between
         y = 130 and y = 1440. Screen recordings crop to a single readable
         column rather than showing a full page at unreadable scale.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Practical room light on the speaker, one soft key, visible falloff.
         Deliberately not a studio look. Graphics carry the violet; the person
         does not sit in coloured light.
MOOD: Someone explaining a thing they are slightly annoyed nobody mentions.
         Direct, unpolished, not performed.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, Google logos or
          trade dress, staged office backdrops, ring-light beauty lighting,
          jump-cut zoom punches on every line, countdown timers, subscribe
          animations
ASPECT: 9:16
```

---
---

## TT2

**Pillar:** P2, cross-engine consensus.
**Funnel:** TOFU.
**Hook driver:** Status threat.
**Length:** 41 seconds.
**Source:** `brandgeo/web/bg-016.html` for the consensus split, and
`docs/growth/data-templates-2026-07-29/data/city-comparison.json` for the US city
figures. Both are cited on screen.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Person mid-sentence, already talking. At 1.1s the frame behind them fills with a 4-by-5 grid of 20 cells snapping to half violet, half hollow, in one beat. | "In half of these categories somebody has already won and it isn't you." |
| 1.5-7s | Grid holds behind the speaker. Labels appear on the two halves: **AGREED** and **DID NOT**. | "We took twenty buyer categories across four cities, ran them past five AI engines, and read every single answer by hand." |
| 7-14s | Violet half fills the frame. Text: **"10 of 20: three or more engines, same brand"** | "In ten of them, three or more engines independently came back with the same brand. Different engines, same day, same name at the top." |
| 14-20s | Hollow half fills instead. Five columns populate with completely different name sets, no overlap anywhere. | "In the other ten, five engines gave five different answers and shared nothing." |
| 20-27s | Cut to the real chart, `city-comparison_complete_story.png`, held on screen. Caption bar beneath it: **"17 US cities, 5 engines, 4 identical questions each"** | "Here's the same shape in our US data. Seventeen cities, same four questions in each, and in Atlanta alone the engines named seventy five different companies. Sixty two of those got named exactly once." |
| 27-34s | Chart holds. One bar segment highlights. Text: **"most-named brand in any city: 4 of 20 answers"** | "The most-named company in any of those cities showed up in four answers out of twenty. Nobody owns these categories yet. Nobody." |
| 34-41s | Back to person. `mark-1024-on-dark.png` lower third. Text: **"which half are you in"** | "So your category is one of two things. Settled, and you have to go take it off somebody. Or wide open, and it's yours if you move first. Either way you'd want to know which, and right now most people don't." |

**Caption, 79 characters including hashtags:**

> in half of these categories a competitor is already the default answer
> #ai #seo

**Notes.** The 20 to 34 second stretch is the strongest evidence in this entire
four-pillar campaign because the chart is rendered from BrandGEO's own measured
rows and cannot be copied by a competitor. It comes with two constraints. The
US 20-city dataset and BG-016's four European cities are **different datasets
running different prompt sets**, so the voiceover must step between them
audibly, which is why the line at 20 seconds opens with "here's the same shape in
our US data" rather than continuing the count. Second, these are BrandGEO's US
**research tenants**, not customers and not any single brand, and nothing on
screen or in the voiceover may imply otherwise. The on-screen caption bar exists
to make the method visible rather than leaving it to the audio.

Regenerate the chart rather than editing it: `python city_comparison.py --all` in
`docs/growth/data-templates-2026-07-29/`. The generator reads a JSON extract and
never touches the database, so a re-render cannot trigger a collection or spend
budget.

### Visual brief V-TT2, serves TT2

```
ENGINE: sora
SUBJECT: Talking-head piece with a full-frame grid device behind the speaker,
         then a real rendered data chart held on screen for a third of the
         runtime. The chart is an existing asset and is not generated: it is
         city-comparison_complete_story.png at 1080 x 1920, horizontal stacked
         bars, one row per city, two lightness steps of one hue.
COMPOSITION: 1080 x 1920, 9:16. Speaker framed left of centre. Grid sits behind
         at 30 percent opacity while they talk and comes forward when they stop.
         Chart is held full-frame with the speaker out; the existing render is
         already composed inside a safe band, so overlay only the caption bar
         and keep it above y = 1440 and left of x = 830.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Practical room light on the speaker, one soft key. The chart is flat
         and must not be regraded; its two-step lightness ramp is the only thing
         separating the two bar segments and a grade would collapse it.
MOOD: Competitive and specific. Someone showing you a scoreboard you did not
         know existed.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, world maps,
          national flags, city skylines, third-party engine logos, animated
          counters spinning up from zero, pie charts, chart bars that grow on
          entry and obscure the final value
ASPECT: 9:16
```

---
---

## TT3

**Pillar:** P3, measurement integrity.
**Funnel:** TOFU.
**Hook driver:** Loss aversion.
**Length:** 36 seconds.
**Source:** `brandgeo/web/bg-018.html` for the five false positives and the
regression suite, `brandgeo/web/bg-019.html` for the null-rank rule.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Person already talking, no intro. At 1.0s a score chip slams into frame beside them reading **#1**, then flips to **null** and turns red. | "Your AI visibility score is probably guessing and you'd never be able to tell." |
| 1.5-7s | Person continues. Two identical answer cards fade up behind them, one scored #1, one scored null. Text: **"same answer"** | "These are the same answer. Same brand, same praise, scored two completely different ways. By our own pipeline." |
| 7-14s | Cut to screen. Two markdown headings stacked, one `##` and one `###`, each with a medal emoji. The extra hash rings violet. A ruler animates across and the emoji lands exactly on the last tick, flashing red. | "The difference was one extra hash. The emoji counts as two units and it sat right on the character budget our rank detection used. That's it. That's the whole bug." |
| 14-21s | Back to person. Four more cards stack in behind the first. Text: **"5 of these. in six weeks."** | "That was the third of five we found in six weeks. Section headings getting counted as competitor names. Bolded field labels like Pricing colon getting counted as brands. Two more that worked in English and broke in Romanian." |
| 21-28s | Screen. A bulleted list appears under the lead-in "here are a few good options". A rank badge tries to attach to bullet one and is rejected, resolving to **null**. | "And here's the one people don't think about. A few good options is not a ranking. If your tool scores bullet one as rank one there, it just invented a number the engine never claimed." |
| 28-32s | Counter resolves to **156**. Label: **"assertions. real answers. not synthetic."** | "We published all five and there are a hundred and fifty six assertions from real production answers standing behind the fix now." |
| 32-36s | Person, direct to camera. `mark-1024-on-dark.png` lower third. Text: **"never found one? never looked."** | "So ask any tool in this space, ours included, what they've caught in their own pipeline. If the answer is nothing, they haven't looked." |

**Caption, 68 characters including hashtags:**

> our own score lied to us five times. we published all five.
> #ai #seo

**Notes.** The 7 to 14 second beat carries the piece and the difference between
`##` and `###` is one glyph. Set it in a real mono face at a size that survives
TikTok's re-encode, and if it does not read on a phone at 1080, stack the two
headings vertically and lose the ruler rather than shrinking the type. The 21 to
28 second beat pulls from BG-019 rather than BG-018 and is the only place in this
campaign where the null-rank rule appears in video; it is worth the seven
seconds because it is the failure a viewer can check in their own tool tonight.
Red appears twice and nowhere else.

`docs/growth/data-templates-2026-07-29/out/engine-comparison_bpr-2026-07-21_story.png`
is available as an optional insert at 28 to 32 seconds. It is a real card from a
real client day. If it is used, note that its Claude row reads 5 of 7 because a
prompt was collected twice that day, which is the measured answer count and not a
rate, and nothing spoken over it may treat it as one.

### Visual brief V-TT3, serves TT3

```
ENGINE: sora
SUBJECT: Talking-head piece cutting to real code and markdown. Answer cards are
         abstract renderings of an AI response with a heading line, three body
         lines and a score chip, all text real and legible. Markdown passages
         and the ruler are the only technical imagery; no terminal windows, no
         scrolling code.
COMPOSITION: 1080 x 1920, 9:16. Speaker framed left of centre. Card pairs sit
         behind at 380 px wide. Screen beats crop tight to the two heading lines
         and fill the band between y = 130 and y = 1440, staying left of
         x = 830. Score chips never fall below y = 1440.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Practical room light on the speaker. Flat card surfaces with a 1 px
         violet border. The only glow in the piece is behind the 156 numeral,
         which is the single moment the tone lifts.
MOOD: A confession delivered without apology. The person is not embarrassed and
         should not be shot as though they are.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, bug or insect
          iconography, red warning triangles, magnifying glass overlays,
          terminal windows, fake code scroll, error dialog boxes, sad-face or
          facepalm reaction shots
ASPECT: 9:16
```

---
---

## TT4

**Pillar:** P4, peer-archived research.
**Funnel:** TOFU.
**Hook driver:** Contrarian.
**Length:** 43 seconds.
**Source:** `brandgeo/web/bg-017.html` and the record at
`doi.org/10.5281/zenodo.21395598`.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Person already talking, holding a printed page. At 1.2s they turn it to camera and a violet highlight sweeps one line: **"56 responses excluded"**. | "We published a research paper and the first thing on page one is our own data collection failing." |
| 1.5-8s | Page held in frame, pulls to reveal the title block and the DOI beneath it. | "This is a real empirical paper. Fifty six buyer questions, seven cities, every answer read by a person. And on page one it says one of our five engines fell over on a quota error mid-collection." |
| 8-15s | Cut to screen. Three figures step down: **280** struck through, **278** struck through, **222** solid. Labels: designed, recorded, analysed. | "We designed for two hundred eighty engine responses. Two seventy eight actually recorded. The set we analysed is two hundred twenty two, and we say exactly where each gap went." |
| 15-22s | Back to person. Text: **"we could have just deleted the engine"** | "We could have dropped that engine from the writeup and nobody would have known. Or worse, left its silence in and let it read as a finding about that engine. Both were on the table." |
| 22-29s | Screen. The Zenodo record page, DOI in mono, **CC BY 4.0** badge visible. | "Instead the whole thing is archived on Zenodo with a permanent DOI and an open licence. No paywall, no account, no email. Anyone can pull it apart, including the AI systems the paper's about." |
| 29-36s | Text card, full frame: **"archived, not peer reviewed"**. Held, no motion. | "And to be exact, because this matters. It's archived and it's citable. It is not peer reviewed. I'd rather say that than let you assume it." |
| 36-43s | Person, direct to camera. `mark-1024-on-dark.png` lower third. Text: **"check it yourself"** | "That's the whole point. A paper you can go and check beats one that just sounds authoritative. The DOI's in the bio. Go and find something wrong with it." |

**Caption, 78 characters including hashtags:**

> we published the paper with our own collection failure on page 1
> #ai #research

**Notes.** The 29 to 36 second card is the reason this script exists, not a
disclaimer stapled to the end, and it holds with no motion for a full seven
seconds on purpose. Cutting it short is the one edit that would break the asset.
The page in the opening must be the real document printed from
`doi.org/10.5281/zenodo.21395598`; a prop page in a piece arguing that
checkability beats authority would refute itself in the first frame. The closing
line is an invitation to find an error and it should be delivered as one, not as
a rhetorical flourish. Caption uses `#research` rather than `#seo` because this
is the one script in the set that is not making a search claim.

**Do not add a peer-review claim anywhere in the edit.** Zenodo is a CERN-run
open archive, not a journal, and this pillar's whole value rests on that
distinction being made by us rather than found by someone else.

### Visual brief V-TT4, serves TT4

```
ENGINE: sora
SUBJECT: Talking-head piece with a real printed paper as a physical prop in the
         opening, then screen capture of the actual Zenodo record. Middle
         section is a flat three-figure step-down. Closing section is a single
         full-frame type card with no motion at all.
COMPOSITION: 1080 x 1920, 9:16. Speaker framed left of centre, page held at
         chest height and angled into the key light so the highlighted line is
         legible without a graphic overlay. Screen sections crop to one readable
         column between y = 130 and y = 1440, left of x = 830. Final type card
         is optically centred in the same band, not the frame.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Practical room light on the speaker. The printed page is the only
         light-coloured surface anywhere in the four-pillar campaign and that is
         deliberate: it reads as a physical object rather than a graphic. Screen
         captures render at high contrast on the near-black canvas.
MOOD: Plain and slightly stubborn. Confidence coming from the document being
         legible, not from the treatment.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, laurel wreaths,
          academic caps, university crests, journal or peer-review badges,
          award ribbons, page-turn animations, library or bookshelf backdrops,
          Zenodo or CERN logos, stamp or certification graphics
ASPECT: 9:16
```

---
---

## Sequencing and gates

**One script per week, in order TT1, TT2, TT3, TT4.** TT2 carries the strongest
proof and TT4 the strongest credibility, so they should not sit adjacent to each
other in the calendar; the order above already spaces them.

**Pair with the Instagram assets, do not duplicate them.** Each TikTok is the
TOFU sibling of the matching Reel in `05-instagram.md`, and the carousel for that
pillar runs a week later as MOFU. Running the TikTok and the Reel in the same
week on the same day is the one combination to avoid, since the argument is the
same even though the delivery is not.

**TT1 carries a live gate.** `docs/growth/social-kit/README.md` records that
`ai_results` held zero rows for `grok` and `ai_overview` when the asset kit was
built. TT1 is written to stay inside that: it asserts that two Google surfaces
exist and are measured separately, which is true of the code and of
`bg-021.html`, and attaches no rate, no count and no result to either new engine.
The 26 to 33 second beat describes how an absent AI Overview is recorded, which
is a method claim, not a measurement claim. If a later edit puts a number on
either engine, the gate applies again.

**TT2 carries a data-attribution constraint**, restated because it is the easiest
thing in this file to get wrong in an edit: the US city figures come from
BrandGEO's **research tenants**, not customers, and they are a different dataset
from BG-016's four European cities. Never attribute them to a named brand and
never merge the two counts.

**Voice attribution is a licence condition, not a courtesy.** If any script uses
the existing voiceover voice rather than the on-camera speaker, this exact line
goes in the description of every published video carrying it:

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

See `docs/growth/social-kit/README.md` and `assets/audio/ATTRIBUTION.md`.

**Nothing in this file is scheduled, queued, or sent.**
