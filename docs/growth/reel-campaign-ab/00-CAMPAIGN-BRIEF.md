# Reel / Shorts A-B campaign, shared brief

Hourly generation run. Each run produces four platform-native cuts of ONE
message so cross-platform performance is comparable, and each RUN changes the
hook so hooks can be tested over time.

Output root: `docs/growth/reel-campaign-ab/run-<YYYYMMDD-HHMM>/<platform>/`

Platforms: `instagram`, `facebook`, `tiktok`, `youtube`.

---

## Non-negotiables

**No voice.** No TTS, no narration, no voiceover file. The message is carried by
on-screen text alone. This is deliberate: it also means the video works with
sound off, which is how most of the feed watches.

**Music: UPDATED 2026-07-29 22:20. We compose our own.**

Constantin's call: generate original SaaS-style tracks in house, drawing on the
idiom other products use on these channels. That removes the licensing problem
entirely, because we are the author.

**The line that matters, and it is not a formality.** Genre conventions are not
copyrightable: tempo, key, instrument palette, a four-on-the-floor kick, a
sidechained pad, the general sound of a product-launch bed. Specific melodies,
basslines and hooks ARE. So compose original material in the style. Do not
transcribe, re-record or approximate any identifiable track from any real ad or
product video. If a phrase you have written is recognisable as a specific
existing song, rewrite it. "Inspired by" is a style instruction, not permission
to copy a tune.

Tracks live in `assets/audio/music/`, each with its own entry in
`assets/audio/ATTRIBUTION.md` recording that BrandGEO authored it and the date.
We hold the rights, so they are safe on any channel, in ads, and on the site.

**Still deliver BOTH cuts per platform, and the silent master is still primary
for organic posting.** Not for licensing reasons any more, but for distribution:
Instagram, Facebook, TikTok and YouTube each favour in-app audio in their own
feeds, and on TikTok it is a ranking input. The scored cut is the one to use for
paid, for site embeds, for decks, and anywhere the in-app libraries do not
exist.

There is no third-party licensed music in this repo and nothing is to be
downloaded to fix that.

So every platform folder ships two files:

1. `*-silent.mp4` — the master, no audio track at all. **This is the one to
   upload.** Instagram, Facebook, TikTok and YouTube each have an in-app
   commercial music library. Audio picked there is licensed for that platform
   AND is favoured by its distribution. A self-supplied track that is not
   cleared gets muted or region-blocked, which is a worse outcome than silence.
2. `*-bed.mp4` — the same video with a synthesized bed built in ffmpeg from
   `sine` and `aevalsrc`. We authored it, so it is licence-clean and safe
   anywhere, including a website embed or an ad account where the in-app
   libraries are not available.

Be honest in the report about how the bed actually sounds. A thin synthesized
bed is fine to ship as the fallback and bad to ship as the default.

Normalize any audio to `-16 LUFS` integrated, `-1.5 dBTP`, two-pass `loudnorm`.
Single-pass undershoots by about 0.9 LU.

---

## Canvas and safe zones

All four are 1080x1920, 9:16, 30fps, H.264, `yuv420p`.

Use PNG intermediates, not JPEG. JPEG forces `yuvj420p` (full range) and the
colour shifts on playback.

**Text outside the safe zone is the single most common failure.** Each platform
covers different edges with its own UI. Keep ALL text inside:

| Platform | Top reserve | Bottom reserve | Right reserve |
|---|---|---|---|
| Instagram Reels | 220 px | 420 px | 180 px |
| Facebook Reels | 220 px | 440 px | 180 px |
| TikTok | 200 px | 360 px | 200 px |
| YouTube Shorts | 180 px | 380 px | 180 px |

Verify by decoding an actual frame and checking the ink bounding box against
those numbers. Do not eyeball it.

## Measurement traps, learned from run 1

Each of these produced a real defect that a visual check at preview scale would
have missed. Read them before rendering.

**`drawbox` on a transparent RGBA source blends instead of writing alpha.** It
renders at alpha 0 and vanishes silently, with no error. Pass `replace=1`. In
run 1 the violet accent rule was missing from an entire build and only the ink
measurement caught it, because the measured layer top sat 60px below the
computed block top.

**A pass with single-digit pixel headroom is a paper pass.** Run 1's TikTok
build cleared the right reserve by 1px. That is not a margin, it is a rounding
artefact, and one copy edit destroys it. Treat under 20px as a failure and
reshoot. Report the measured headroom, never just "passes".

**Justify the ink threshold, do not guess it.** Print the background's peak luma
first, then pick a threshold in the empty gap between it and the dimmest drawn
colour. Run 1 backgrounds peaked near 30 and text sat at 153 and 232, so
thresholds of 60 and 100 were both defensible and both were argued from a
measured control render, not chosen by feel.

**Never fade in the first scene from t=0.** The cover is frame 0. If scene 1
fades up, frame 0 renders at alpha 0 and the cover is a blank rectangle, which
is the thumbnail the feed shows. Run 1's Instagram build shipped exactly this
before measurement caught it. Hard-start scene 1 at full opacity and verify the
cover is byte-identical to frame 0 with an md5 over raw RGB.

**If furniture ALWAYS binds, the safe-zone pass is not testing your copy.**
Run 2's TikTok build had a progress bar setting x0, x1 and y1 on every single
frame, so its measured box described the bar and said nothing about whether the
text fit. Run 8 replaced it with a vertical left rail, and the type took
ownership of the right edge for the first time on that platform.

Report BOTH numbers: the union of everything drawn, which is what the platform
crops against, and the widest TYPE extent, which is what a copy edit moves. If
the two never differ, the layout has no headroom information in it and a longer
line will fail silently.

**Furniture counts as ink.** Progress bars, logos and rules are inside the safe
zone too. Run 1's Instagram type had 100px of right clearance while its progress
bar had 1px, so the binding constraint was furniture, not text. Measure the
union of everything drawn.

**Measure the DELIVERED file, not the intermediate.** Decode frames out of the
final encoded mp4. Encoding is where colour range and alpha problems surface.

**Cross-check with a second method when it is cheap.** Run 1's Facebook build
measured the ink box two independent ways, absolute threshold and per-frame diff
against a text-free control, and they agreed to one pixel. That is what makes a
number trustworthy.

**Always fade the music IN, not just out.** The tracks do not start at zero.
`tension-minor` opens at amplitude 0.025 and peaks at 0.206 inside its first
0.1s, so cutting it in at sample 0 produces an audible click. Use
`afade=t=in:st=0:d=0.08` alongside the fade out. Run 1's four scored cuts were
muxed without it and clicked at 0.052 in the first 64 samples; they were
re-muxed and now start at 0.002.

**`color=black@0.0` does not survive format negotiation, and the failure is
total and silent.** The lavfi source drops its `@alpha` and lands opaque, so a
subsequent `format=rgba` fills alpha with 255 and every text layer ships as a
full-frame black rectangle covering the background. Exit 0, no warning, and the
output is a black video. Use `format=rgba,colorchannelmixer=aa=0`, and add
`-update 1 -pix_fmt rgba` on the PNG write or alpha is dropped again one step
later. Found on run 4's YouTube build by the layer-alpha pass, which measured
all ten layers at `x 0..1079 y 0..1919` with drift exactly `-blockTop`. No pixel
threshold or control diff would have caught it, because the frame genuinely is
that colour.

**`overlay` rounds an odd `y` DOWN to even.** ffmpeg 8.1.2, on yuv420p, because
chroma is subsampled 2x2 and a plane cannot start on an odd row. A declared rect
computed from the y you asked for is then off by one against what actually
rendered, which matters when that rect is the only thing carrying a dark-on-dark
element through the safe-zone union. Compute declared rects from the EFFECTIVE
even y, not the requested one.

**A mux can exit 0 and be unreadable.** Run 2 produced a 4.7 MB scored file with
a success exit code that `ffprobe` reported as `Duration: N/A` with no streams.
Exit status is not proof. Always probe the DELIVERED file for duration and
stream count before calling a render done.

**`drawbox` cannot animate.** It has no `eval` option on ffmpeg 8.1.2
(`eval=frame` errors out) and evaluates `x/y/w/h` once at init, so an expression
like `w='680*min(1,t/28)'` silently renders frozen at its t=0 value with no
warning. To animate a bar, draw it as N static boxes gated by `enable`, then
verify on the delivered file that it actually moves.

**Pixel measurement is BLIND to dark-on-dark furniture, and both methods share
the blind spot.** Run 2's YouTube logo card differs from the background by 4 of
255 in Y at its edge. The absolute threshold cannot see it, and neither can a
per-frame diff against a control. Only knowing the declared rect finds it. So
for any element drawn near the canvas value, fold its declared geometry into the
union explicitly rather than trusting the measured box. A safe-zone pass that
reports only what it can see is not a safe-zone pass.

**When two methods disagree, trust the one that finds MORE ink, but ONLY after
confirming both are measuring ink.** Run 2's Facebook build had a 17px
disagreement that turned a claimed 69px of bottom headroom into a real 49px, and
taking the larger number was right there.

**Corrected 2026-07-30, the earlier version of this rule was unsafe.** A diff
method defined as "any channel differing from the canvas by more than 2" returned
`x 0..1079, y 0..1513` on run 3's TikTok build, an apparent failure on every
edge. Rows 0 and 1 of every frame decode to `rgb(7,7,15)` against `rgb(7,8,13)`
elsewhere: a **yuv420p frame-edge chroma artefact** that reproduces in a
text-free control where nothing is drawn. Taking the larger number there would
have meant reshooting a passing video forever.

So: always diff against a TEXT-FREE CONTROL rendered through the identical
pipeline, never against a flat assumed canvas colour. The control cancels codec
artefacts because it carries them too. If a method reports ink at the literal
frame edge, suspect the codec before the layout.

**But a control does NOT cancel noise that the text itself creates, and my
earlier wording was wrong about this.** Adding text changes libx264's rate
control across the WHOLE frame, so the control differs from the render even in
regions where nothing is drawn. Run 5's Facebook build hit a false failure on
every edge at a diff threshold of 6. It did not adjust by feel: it measured the
noise floor in three regions empty by design and found a max diff of exactly 7
in all three, then set the threshold above it.

So: measure the noise floor in a known-empty region of the DELIVERED file and
set the threshold above it. Never pick a diff threshold by eye, and never assume
a control makes the diff noise-free. A control cancels artefacts it SHARES; it
cannot cancel the encoder's response to content it does not have.

**A control diff answers "was this drawn", never "which of two overlapping
things was drawn."** Run 5's Instagram bar-animation check reported the bar
frozen at full width, a false failure, because the diff sees the progress TRACK,
drawn full width on frame 0, exactly as it sees the fill sliding across it.
Separate overlapping elements with a luma threshold between their two values,
not by difference from the background.

Match the tool to the question. Control diff for presence. Absolute threshold
for identity between overlapping elements. Declared rects for anything within
about 10 luma of the canvas, which no pixel method can see. Every false result
in this campaign came from asking one method a question it could not answer.

**Do not build the timeline with ffconcat.** Cumulative float durations drift:
70/30 = 2.333333 put a scene cut a third of a microsecond past a frame edge and
landed scene 18 on frame 694 instead of 693. Total duration and frame count were
still exactly right, so nothing about the container looked wrong. Use a numbered
frame sequence at `-framerate 30`, which is frame-exact by construction.

**Frame hashing does not detect scene changes in an encoded H.264 file.**
Identical pictures get different quantisation noise, so hashes differ where
nothing changed and can collide where it did. Count ink pixels per frame
instead and look for step changes.

**Diff SCENE STREAMS, not individual drawtext layers, and set the n-gram floor
at 2.** Two separate bugs, both found by negative-controlling the diff itself,
both of which let verbatim reuse through:

- Run 9's TikTok diff compared n-grams inside each `drawtext`. A scene that
  draws one sentence as four stacked layers never forms a long n-gram, so a
  seven-word reuse passed. That is precisely how the run 8 reuse got in.
  Concatenate a scene's layers in draw order first.
- Run 9's Instagram diff used a 3-gram floor. A verbatim previous line passed
  because the earlier pass had rendered `Companies` and `converge.` on separate
  lines. Floor lowered to 2, with a closed-class function-word exemption.

Both diffs reported CLEAN before their controls were written. Assume any diff
that has not been controlled is reporting clean because it cannot see.

**On a replication run, DIFF the drawn strings against the previous pass. Intent
to differ is not evidence of difference.** Run 8's YouTube agent wrote its cut
deliberately not to reuse run 2, read both files, and still shipped a seven-word
run from run 2's product beat into a rendered layer, plus a collided list
header. Reading did not catch it. An n-gram diff of its own drawn strings
against run 2's rendered lines did, and both were rewritten and re-rendered.

Run the diff on the `textfile=` bytes of both passes, not on the notes or the
briefs. Residual overlap should be only the engine list and the URL.

**A name scanner that matches RAW BYTES silently fails on diacritics.** Found by
run 9's Facebook agent, and only because its negative control tried a spelling
variant. `Engel & Völkers` fired; `Engel & Volkers` passed clean. Any company
name written without its diacritic walked through a 484-name corpus undetected.

Normalise BOTH sides before matching: NFKD, strip combining marks, then
case-fold in that order. Case-folding first lets an upper-cased accented form
through. Language-specific traps that normalisation alone does NOT fix: the
German eszett and the ae/oe/ue transliterations, the French oe and ae ligatures,
and typographic versus ASCII apostrophes, which Italian names use constantly.

Control it by injecting a real name in EVERY spelling variant you can construct,
not just the one printed on the source page.

**EVERY scanner needs a negative control, because a scan that passes everything
is indistinguishable from one that works.** This is the most important rule in
this section. Before trusting any compliance check, INJECT the thing it is
supposed to catch, confirm it fires, then restore and re-run.

Run 8's Instagram measured-subject scanner initially returned 34 false positives
(`That`, `Your`, `Answer`). Fixing those surfaced two real harvester bugs that
had been letting genuine candidates through. The agent then injected an actual
company name from a city page, confirmed the scan caught it, restored, and
re-ran to exit 0. Without that step it would have shipped a scanner that had
been silently broken in both directions.

Applies to the dash scan, the superlative scan, the universal scan, the
measured-subject scan and the engine-lineup check equally. An exit code of 0
proves nothing on its own.

**Take the FLOOR of a plateau centre, never the round.** An even-width plateau
has no integer centre, so rounding produces a uniform +1 frame offset on every
cut, which reads exactly like timeline drift. Run 8's Instagram detector showed
the offset at ink thresholds 90 and 150 and exact centres at 70 and 120. **The
tell that it was the detector and not the render: the offset disappeared at 120
and reappeared at 150.** A render fault cannot come and go with the measurement
threshold. With floor, 35 of 35 boundaries were exact across four thresholds.

**A boundary detector that is wrong is wrong UNIFORMLY, which looks exactly
like a render defect.** Three separate runs hit this. A step detector fires on
the fade-out ramp and reports every cut 5 to 6 frames early. A local-minimum
detector returns the first frame of a zero-ink plateau and reports every cut 2
frames early. A threshold set too low lets intra-scene quantisation noise exceed
the quietest real boundary. Each produces a consistent offset across every cut,
which reads as drift in the timeline rather than a fault in the measurement.

The correct answer is the PLATEAU CENTRE, and the way to confirm it is to sweep
the ink threshold: the plateau WIDTH changes with threshold, the centre does
not. If a reported offset is identical on every cut, suspect the detector before
the render.

**Do not use `-ss` to sample a frame near a cut.** Seeking lands on the
neighbouring scene often enough to make a boundary check meaningless. Decode
the frames sequentially in one pass and index them.

**`-shortest` prevents AAC drift.** A 1024-sample quantised audio tail pushes the
container past the exact cut length. Run 1's YouTube bed would have landed at
41.4187s and `-shortest` trimmed it to exactly 41.400.

## Duration

| Platform | Target |
|---|---|
| Instagram Reels | 20 to 30 s |
| Facebook Reels | 20 to 30 s |
| TikTok | 25 to 40 s |
| YouTube Shorts | under 60 s, aim 30 to 45 s |

Container duration drifts past the exact cut length because AAC quantises to
1024-sample frames. On a silent master there is no audio stream, so the video
duration is exact. Check the bed variant with `ffprobe` and state the real
duration, do not assume.

---

## Brand

- Canvas `#090A0F`. Violet `#8B5CF6`. Gradient `#7C3AED` to `#6366F1`.
- Text ink `#E8E9ED`. Accent text `#A78BFA` (never `#8B5CF6` for text on dark,
  it measures 4.2:1 and fails).
- Font: `docs/growth/grok-launch/images/_build/fonts/Inter-*.ttf`. Real Inter,
  already vendored. Do not substitute and do not download a font.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`.
- Dark only. Never a white background.

**No AI tells in on-screen text.** No em dashes, no en dashes. Banned: delve,
unlock, unleash, elevate, harness, leverage, game-changer, supercharge,
revolutionize, seamless, robust, cutting-edge, transformative.

---

## Factual limits

Ground truth is `brandgeo-dashboard/src/lib/planConfig.ts`.
Free 0, Essentials 99, Growth 299, Growth PRO 449, Managed from 1,500,
Enterprise unpublished. Engines: Growth 5, Growth PRO and Managed 7. Copilot and
DeepSeek are live on no purchasable plan. Meta AI is retired.

**Do not put a Grok or AI Overviews percentage on screen.** Both went live
2026-07-29 and have 5 and 6 rows respectively, from one day. A rate from that is
worthless, and a company selling measurement cannot publish it.

Numbers on screen are illustrative shapes unless they trace to a published page
under `brandgeo/web/bg-*.html`. If illustrative, they must not be framed as a
measurement or a result.

**The brief itself is a vector for bad claims, so every check must run on the
DRAWN BYTES, not on the intent.** Run 6's brief told all four agents that
BrandGEO does "the part nobody does by hand". That is a universal claim about
every business on earth, refuted by one counterexample, and it was written by
the coordinator, not by any agent. A faithful agent following instructions would
have rendered it. Two caught it independently and rewrote it; the others had
already built past it.

So: banned-word, superlative and universal checks belong in a script that reads
the strings ffmpeg actually draws, run after the render, exiting non-zero. Not
in a reviewer's memory, and not on the brief's own wording. An instruction is
not evidence of what shipped.

Universals are the same species as superlatives and are banned on the same
grounds: nobody, no one, everyone, everybody, always, never, every business,
anyone.

**Refinement, 2026-07-30, after the rule started catching correct copy.** The
test is whether the word QUANTIFIES OVER PEOPLE, not whether it appears. "Nobody
does this by hand" is a claim about every business and one counterexample kills
it. "The answers you cannot see" is a situational fact about one viewer's
position and is simply true, since AI answers about you are not reported to you.
Both contain an absolute; only the first is a universal.

Keep the scanner strict, because a scanner that needs judgement is not a
scanner, but treat a hit on `cannot`, `never` or `always` as a prompt to check
which kind it is rather than an automatic rewrite. If it quantifies over people
or businesses, rewrite it. If it describes one situation, it can stay. Run 7's
Facebook agent rewrote correctly on `first` (ordinal, not a ranking claim, but
rewriting cost nothing) and flagged this distinction rather than silently
applying it. Hedging to "almost nobody" or "hardly anyone" is the same
claim with deniability. State it as a property of the METHOD instead: "one check
is a snapshot, the record is the work" asserts nothing about people and cannot
be refuted.

**A SUPERLATIVE cannot be verified by reading the page it appears on.** Added
2026-07-30 after a false claim reached two rendered cuts. Any "first", "only",
"most", "never", "biggest" or "the first time" is a claim about every OTHER page
in the corpus, so the page asserting it is the one source that cannot confirm it.
Grep the whole corpus before putting one on screen.

This is the gap the rule below does NOT cover. Provenance-on-the-figure catches
a borrowed third-party statistic. It does not catch our own page asserting
something false about our own research. `ai-visibility-for-chicago.html` claims
"the first fully unanimous result (5 of 5 engines) measured anywhere in this
research program" four times, including inside its FAQPage JSON-LD, while
`ai-visibility-for-boston.html`, collected the SAME DAY, claims "the most
5/5-dense city measured in this research program" and reports three of them.
Two agents quoted Chicago faithfully and both had to re-render.

Safest default: do not put a superlative on screen at all. The underlying result
is almost always strong enough without one, and a ranking claim ages badly every
time a new city is collected.

**The provenance check runs on the FIGURE, not on the page it sits in.**
Added 2026-07-30 after the run 4 Facebook agent found the loophole. `bg-005.html`
publishes a 48% AI Overviews figure and a 93% zero-click figure that are
third-party, inside a page that is otherwise ours. Both PASS a naive "traces to
a published bg page" test while tracing to no BrandGEO measurement whatsoever.
A campaign built on being checkable cannot borrow someone else's statistic to
make its own point. Ask where the number was MEASURED, not where you read it.

**An engine count is a claim about the lineup on the day of collection, not a
property of the finding.** Same source, same trap in the other direction:
`bg-004`'s body names its five engines, and one of them is Microsoft Copilot,
not today's Growth five. An agent skimming for a count will find one and it will
be wrong. `bg-016` has the same problem with retired Meta AI, and the first
seven city runs likewise. Either verify the lineup on the collection date or
state no count at all. "Three engines named it, one did not" is exact and needs
no denominator.

TOFU asset. Soft CTA only. No pricing on screen.

## Never name a MEASURED SUBJECT on screen

**Refined 2026-07-30. The earlier heading said "never name a real third-party
brand", which was imprecise and the run 4 Facebook agent was right to flag the
collision.** Every cut in this campaign names ChatGPT, Gemini, Claude,
Perplexity and Google AI Mode on screen by design. Those are third-party brands.
A blanket ban would forbid the product from describing what it does.

The line is what role the name plays:

**Allowed, the ENGINE or PLATFORM being measured.** ChatGPT, Gemini, Claude,
Perplexity, Google AI Mode, and Google itself as the referent for a belief
("coming up first on Google"). These are the instruments and the category. Not
naming them would make the product undescribable. They are also not harmed by
appearing: the claim is about our measurement, not about them.

**Forbidden, the SUBJECT of a measurement.** Any company, firm or person that
turned up inside a result set. A hospital system that five engines converged on,
a property manager, a named agent, a client. These parties never agreed to
appear in advertising, the finding is *about* them, and naming them uses their
reputation as our commercial proof.

The test: if the name were removed, would the claim still stand? "All five
engines named the same two providers" survives. "We measure ChatGPT" does not.
Remove the ones that survive.

Everything below still holds.

### Original rule, still binding for measured subjects

Decided 2026-07-30, raised by the run 3 Facebook agent, which found a sourced
finding naming two real hospital systems and withheld them rather than shipping
them.

Publishing a measured result on a research page and putting a company's name in
paid advertising are different acts. The research page is a record. An ad is
commercial use of someone else's name, it implies a relationship that does not
exist, and the named party never agreed to appear in it. The finding survives
without them: "all five engines named the same two providers" carries the same
weight as naming them, and is the version that cannot be objected to.

This applies to competitors too. A comparison PAGE is a considered, dated,
sourced surface with a right of reply. A 30 second video is not.

Describe the pattern, never the party. If a finding cannot be stated without
naming someone, pick a different finding.

---

## Per-run variation

Each hourly run picks the NEXT hook driver in this cycle and records which it
used in `run-<stamp>/RUN.md`:

1. Loss aversion, "you are already losing answers you cannot see"
2. Status threat, "your competitor is the default answer"
3. Curiosity gap, "we asked five engines the same question"
4. Contrarian, "ranking first in Google does not mean you exist in AI"
5. Concrete proof, "here is the exact prompt and the exact answer"
6. Utility, "check your own domain in ten seconds"

Same driver across all four platforms within a run, so the run is comparable.
The COPY still has to be native per platform. TikTok is blunter than YouTube.
Do not paste the same words into four files.

---

## Deliverables per platform folder

```
<platform>-silent.mp4     the upload master, no audio
<platform>-bed.mp4        same cut, synthesized licence-clean bed
<platform>-cover.png      1080x1920 first-frame cover
NOTES.md                  hook driver, on-screen text, duration, safe-zone
                          measurement, exact ffmpeg command used
```

Nothing is posted. This produces files for review.
