# Run 20260729-2200

**Hook driver: #1, loss aversion.** "You are already losing answers you cannot see."
Next run advances to #2, status threat.

Four platforms, same driver so the run is comparable, copy written natively per
platform.

---

## Status

| Platform | Silent master | Audio streams | In band | Scored cut |
|---|---|---|---|---|
| instagram | 27.400s | 0 | 20 to 30 s, yes | bed, rejected |
| facebook | 28.000s | 0 | 20 to 30 s, yes | bed, rejected |
| tiktok | 30.500s | 0 | 25 to 40 s, yes | bed, rejected |
| youtube | 41.400s | 0 | 30 to 45 s, yes | bed, rejected |

All four silent masters verified with `ffprobe` to carry **zero audio streams**,
not a muted one. That distinction matters: a muted track can block a platform's
in-app music picker, which is the whole point of shipping silent.

## Verified

**tiktok-silent.mp4**, 30.500000s, 915 frames, `nb_streams=1`. Genuinely no
audio track rather than a silent one, which matters because a muted track can
block a platform's in-app music picker.

Safe zone measured by decoding 18 frames from the ENCODED file and taking the
ink bounding box at luma > 24 (canvas sits near 10, so antialiased glyph edges
count and the method can only over-report):

```
union    x 96..847    y 240..1505
headroom top 40   bottom 55   right 33      target 200/360/200
```

Worth recording: the first build passed with **1px of right headroom**. That is
a paper pass, not a pass. The column was narrowed to 752px and the headline
dropped 80px to 76px for a real 33px buffer. Any future run that reports single
digit headroom should be treated as a failure.

Three visual state changes inside the first 1.5s, confirmed by hashing decoded
frames at 0.0, 0.5, 1.0 and 1.5s and getting four distinct hashes.

## The audio bed is rejected

The agent that built it reported honestly that it is not music: a flat A drone
(110/165/220Hz) unchanged for the full 30.5s, a 55Hz thump every second, a
1320Hz tick at 120 BPM, entirely mono so it images as a centre point with no
width, and the tick runs at fixed 2Hz while cuts follow reading time, so the two
drift. Measured LRA 1.50 LU, which is the number that says "static".

Loudnorm itself was correct: two-pass, measured I -13.79 / TP -1.43 / LRA 1.50,
output verified at I -16.00 exactly.

**Resolved 2026-07-29 23:40.** Four original tracks composed
(`scripts/compose_music.py`, output in `assets/audio/music/`). All four
`*-bed.mp4` files were DELETED and replaced with `*-scored.mp4` cut from
`tension-minor`, which suits a loss-aversion hook.

Verified independently, not taken from the composer's report:

| | rejected bed | tension-minor |
|---|---|---|
| LRA | 1.50 LU | **7.0 LU** |
| stereo | mono, L == R everywhere | **L != R on 100.00% of samples**, corr 0.859 |
| chords | one root held 30.5s | changes every bar, 5-chord cycle |
| integrated | -16.00 LUFS | -16.0 LUFS |

Re-mux checked per platform: container duration and audio stream duration match
exactly on all four, with a 1.5s fade out.

The music library also carries `build-resolve` (curiosity gap), `clean-utility`
(utility and concrete proof) and `contrarian-drive` (contrarian). Future runs
pick the track matching that run's hook driver and record the choice here.

## Rights position, decided this run

Constantin offered his Suno account. It is on the **Free plan**, which states
"No commercial use" in Suno's own feature list. Pro and Premier grant commercial
rights for songs made while subscribed. Since this campaign is commercial and
may run in paid ads, nothing was generated there. No third-party or AI-service
audio is in this campaign.

In-house composition means we own the tracks outright: safe on every channel, in
ads, on the site, with no subscription dependency.

## Post-run verification, done by run 20260729-2318

| Check | Result |
|---|---|
| All 8 mp4s readable by ffprobe | pass |
| Silent masters carry 0 audio streams | pass, all four |
| Scored cuts carry exactly 1 audio stream | pass, all four |
| Container duration == audio duration on scored cuts | pass, all four |
| Durations inside platform bands | pass, all four |
| Covers and NOTES.md present | pass, all four |
| Grok or AI Overviews percentage anywhere | none found |
| Banned vocabulary in prose | none found |
| Em or en dashes | 3 found, all FIXED |

**The dashes, and one false positive worth recording.** `facebook/NOTES.md`
tripped the banned-word scan on all thirteen terms at once. That was the
agent's own compliance checklist naming the words it had checked for, at lines
84 and 85, not prose. A scanner that flags a checklist for containing the words
it checks is measuring the wrong thing, and deleting them would have destroyed
the evidence the check was run. Left as written.

Two real em dashes were fixed: `instagram/NOTES.md` (a heading and a table cell
using an em dash to mean "not applicable", now `n/a`), and this file, which had
one in the tiktok verification line. Both were mine or an agent's internal
notes rather than on-screen copy, so nothing published was affected, but the
rule covers NOTES.md deliberately: the habit is what leaks into copy later.

## Upload guidance

**Upload the silent masters for organic posts.** All four platforms favour
audio picked from their own in-app library, and on TikTok that is a ranking
input. The scored cuts are for paid, site embeds and decks, where the in-app
libraries do not exist.
