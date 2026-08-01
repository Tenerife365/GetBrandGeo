# Run 20260730-0013

**Hook driver: #3, curiosity gap.** "We asked five engines the same question,
one pattern held." Next run advances to #4, contrarian.

**Music: `tension-minor`** on all four, held constant on purpose. The hook is the
variable under test.

**This is the first run carrying real evidence.** Drivers 1 and 2 made an
argument. This one shows a finding, every figure traced to a published page.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0018 |
| facebook | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0018 |
| tiktok | 33.000s | 33.000s | 0 | 25 to 40 s, yes | 0.0027 |
| youtube | 44.400s | 44.400s | 0 | 30 to 45 s, yes | 0.0019 |

Every scored cut is under the 0.005 click ceiling. All four fade in, which took
three runs to become automatic.

## Measured safe zones

| Platform | Reserves t/b/r | Headroom | Binding edge |
|---|---|---|---|
| instagram | 220/420/180 | 62 / 55 / 89 | bottom, furniture |
| facebook | 220/440/180 | 306 / 68 / 82 | bottom, logo declared rect |
| tiktok | 200/360/200 | 48 / 49 / 59 | top, furniture |
| youtube | 180/380/180 | 400 / 332 / 72 | right, evidence line |

**Evidence lines are wider than argument lines.** YouTube's binding edge fell to
72px from run 2's 95px purely because a sourced figure needs more characters
than a claim. Its NOTES flags a roughly 22 character ceiling. Driver #5,
concrete proof, will hit this harder than #3 did.

## What each cut proves, and where it comes from

- **instagram** Property management Boston 5 of 5, Houston 4 of 5. Real estate
  agents Boston 2 of 5, Houston 2 of 5. Closes on "companies converge,
  individuals fragment". Source: the Boston and Houston city pages.
- **facebook** One city, six categories, one where all five engines named the
  same two providers and one where no two engines named the same person.
  Source: the Philadelphia page.
- **tiktok** Property management consensus across twelve named cities, then
  Denver's zero real estate names repeating across any two engines. The city
  list is a deliberate misdirect: the reveal is that the city never mattered.
  Source: the Denver page, Houston corroborating.
- **youtube** Boston, Minneapolis and Detroit on property management, then the
  same cities on real estate agents, then Detroit's automotive law convergence
  against the same firms falling to 2 of 5 on employment law.

## Four data judgements made without being asked

Each of these cost the cut something and each is right.

1. **YouTube dropped Minneapolis from its real estate scene.** Its figure is
   2 of **4**, not 2 of 5, because Google AI Mode failed on 4 of 6 prompts
   there. Beside two 2-of-5s it would have read as a third matching result.
2. **Instagram rejected `bg-016.html`**, the obvious source for cross-engine
   consensus. Its dataset ran four engines including retired Meta AI, so its
   numbers under "we asked five engines" would attach the wrong engine set. The
   coordinator had pointed the YouTube agent at that page; the correction was
   sent mid-run and bg-016 was removed from its description.
3. **TikTok refused "27 cities"**, because the first seven city runs used
   retired Meta AI and the five-engine claim would be false for them. It also
   dropped New York's 3 of 4 for the denominator reason above.
4. **Facebook withheld two real hospital system names** it had legitimately
   sourced. Now campaign policy, see the brief: describe the pattern, never the
   party. A research page is a dated record with a right of reply. A video is
   not.

## Two measurement findings that changed the brief

**The "trust whichever finds more ink" rule was unsafe as written.** TikTok's
diff method, defined against a flat assumed canvas colour, returned
`x 0..1079, y 0..1513`, an apparent failure on every edge. Rows 0 and 1 of every
frame decode to `rgb(7,7,15)` against `rgb(7,8,13)`: a yuv420p frame-edge chroma
artefact that reproduces in a text-free control. It was measuring the codec.
Diff against a control rendered through the identical pipeline, never against an
assumed colour.

**`ffconcat` drifts frame boundaries.** Cumulative float durations put scene 18
on frame 694 instead of 693. Total duration and frame count were still exactly
right, so nothing about the container looked wrong. Replaced with a numbered
frame sequence, frame-exact by construction.

## Previous run verification, 20260729-2318

All four in band, silent masters at zero audio streams, scored cuts at exactly
one with matching container and audio durations, all scored starts at or under
0.0020. Seven em dashes found in `instagram/NOTES.md` and fixed. No banned
vocabulary, no Grok or AI Overviews percentage.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
