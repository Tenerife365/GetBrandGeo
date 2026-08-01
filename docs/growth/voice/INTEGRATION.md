# Integration

How a narration track reaches the existing video pipeline. Written 2026-07-31.

Everything in section 4 was **built and measured in this session against a real
delivered cut**, not designed on paper. Section 4.6 reports what came out.

---

## 1. What the pipeline actually is

Measured, not quoted from the notes.

Nine vertical runs exist under `docs/growth/CAMPAIGN-2026-07-30/`, rendered per
channel (TikTok, Instagram Reels, Facebook, YouTube Shorts) plus eight bilingual
cuts under `bilingual/`. Durations, probed from the TikTok masters:

```
20260729-2200  30.5 s      20260730-0216  34.0 s
20260729-2318  32.0 s      20260730-0313  33.0 s
20260730-0013  33.0 s      20260730-0413  31.0 s
20260730-0113  33.0 s      20260730-0513  31.0 s
                           20260730-0613  30.0 s
```

Every run ships as a pair. Probed on `20260730-0113-tiktok`:

| File | Streams | Audio | Duration |
|---|---|---|---|
| `-silent.mp4` | **1** | none at all | 33.000 s |
| `-scored.mp4` | 2 | AAC 48 kHz stereo | 33.000 s |

**The silent master has zero audio streams, not a silent audio track.** That is
what `-an` buys, and it matters because some platforms treat a silent track
differently from no track.

**The two files share a byte-identical video stream:**

```
silent  video MD5  67418da26d3e780917a3833c076d8fc0
scored  video MD5  67418da26d3e780917a3833c076d8fc0
```

This is the single most important fact for narration. The scored variant is built
by stream-copying the picture (`-c:v copy`) and attaching an audio track. **Adding
audio never re-encodes, never re-renders, and cannot change a single pixel.** Every
frame-accuracy, safe-zone and contrast measurement already recorded in the run
NOTES survives untouched. A narrated variant is the same operation with a
different audio track.

Music is `assets/audio/music/tension-minor.wav`, BrandGEO-composed, owned
outright, no attribution obligation, cleared for paid advertising. It is held
**constant** across all nine runs on purpose, because the hook is the variable
under test.

---

## 2. The variant model

Narration adds a **third** variant. It does not replace either existing one.

| Variant | Audio | Purpose |
|---|---|---|
| `-silent.mp4` | none | **Upload master for TikTok and Reels.** Unchanged. |
| `-scored.mp4` | music only | Paid, site embeds, decks. Unchanged. |
| `-narrated.mp4` | voice ducked over music | YouTube, LinkedIn, Facebook, paid, embeds. **New.** |

**Do not narrate over the silent master and do not retire it.** On TikTok,
in-app audio selection is a ranking input rather than a licensing convenience,
which is why the silent file is the upload master there. Shipping a narrated file
to TikTok trades a ranking signal for a voiceover, and that is a bad trade on a
platform where most viewing is muted anyway.

---

## 3. Two warnings before anyone narrates the nine cuts

### 3.1 Narration would break the running A/B test

The nine runs are an experiment in which the hook driver is the variable and
everything else is deliberately held still. Music is constant for exactly this
reason, and the reasoning is recorded in `assets/audio/ATTRIBUTION.md`: varying
the bed at the same time as the hook would leave a winning run with two candidate
explanations and no way to separate them.

**Narration is a much larger change than a music swap.** Adding it to some runs
and not others invalidates every comparison across the set.

So: **narrate all nine or none of them, and treat a narrated set as a new test
generation** with its own baseline, not as an improvement to the current one. If
the current test has not concluded, leave it alone and narrate the long-form piece
first.

### 3.2 The cuts were designed to work without a voice, and must continue to

The run NOTES are explicit that the short cuts carry "no connective tissue, hard
cuts only", with a 16 character maximum line length on TikTok. The on-screen text
is the whole argument, and it is legible with the sound off, which is how most of
the audience will see it.

**Therefore narration must be strictly additive.** Two rules follow:

- **Never read the on-screen text aloud.** A voice reciting the words already on
  screen is redundant, it fights the reading pace of the text, and it makes the
  cut worse for a hearing viewer without helping a muted one.
- **Narration carries the connective tissue the on-screen text had to drop.** The
  screens state the argument in fragments. The voice supplies the joins, the
  qualifier, and the denominator that would not fit on a 1.5 second screen. That
  is real added value and it is the only reason to add a voice to these at all.

Test: mute the narrated cut. If it is now worse than the silent master, the
narration was carrying something the picture should have carried.

---

## 4. The chain, built and verified

### 4.1 Word budget

Target pace is 140 to 160 wpm end to end including pauses, per `VOICE-SPEC.md` §3.
Narration starts about 0.5 s in so the opening frame lands visually first, and
ends 0.3 to 0.8 s before the last frame, matching the two tracks already shipped
(speech ends 27.621 s in a 28.000 s video, and 51.205 s in a 52.000 s video).

Usable window is duration minus about 1.0 s. At 145 wpm:

| Cut | Speech window | Budget |
|---|---|---|
| 30.0 s | 29.0 s | **70 words** |
| 31.0 s | 30.0 s | **72 words** |
| 32.0 s | 31.0 s | **75 words** |
| 33.0 s | 32.0 s | **77 words** |
| 34.0 s | 33.0 s | **80 words** |

Treat these as ceilings. Under-filling is free; over-filling forces either a rushed
read or a trim, and the existing pipeline has already had to shorten two lines for
exactly this reason.

### 4.2 Render beats, not takes

Synthesise each beat separately and place it on its own timestamp. Two measured
reasons:

- Pace has to come from the gaps. The voice cannot be slowed to 145 wpm by its own
  speed control; it stays above 200 wpm even at the extreme (`VOICE-SPEC.md` §3).
- The backend varies 6 to 10 percent in duration between runs on identical text and
  exposes no seed.

Render each beat 12 times and keep the shortest, which is what the existing
pipeline does. Measured this session at tone B:

```
b1  "You rank first in Google."                              1.22 s   5 words
b2  "That does not mean an answer engine names you."         1.90 s   9 words
b3  "Rank and AI visibility are two different measurements." 2.60 s   8 words
```

**Never time-stretch or resample a beat to fit.** Move the timestamp instead.

### 4.3 Place the beats on the timeline

```
ffmpeg -hide_banner -loglevel error -y -i b1.wav -i b2.wav -i b3.wav -filter_complex \
"[0:a]aresample=48000,adelay=500|500[a0];\
 [1:a]aresample=48000,adelay=4000|4000[a1];\
 [2:a]aresample=48000,adelay=9000|9000[a2];\
 [a0][a1][a2]amix=inputs=3:normalize=0,apad,atrim=0:33,aformat=channel_layouts=stereo[vo]" \
-map "[vo]" -c:a pcm_s24le voice_track.wav
```

`normalize=0` is load-bearing. `amix` defaults to dividing by the input count, so
the default would attenuate every beat by about 9.5 dB with three inputs and, worse,
would change the attenuation whenever a beat is added. `apad` then `atrim` pins the
track to the exact cut duration.

The voice model outputs 22,050 Hz, so `aresample=48000` is required on every beat.

### 4.4 Duck the music against the voice

```
ffmpeg -hide_banner -loglevel error -y -i mus_cut.wav -i voice_track.wav -filter_complex \
"[0:a][1:a]sidechaincompress=threshold=0.03:ratio=8:attack=5:release=300[duck];\
 [duck][1:a]amix=inputs=2:normalize=0:duration=first[mix]" \
-map "[mix]" -ar 48000 -c:a pcm_s24le mix_raw.wav
```

**Measured behaviour of that filter, isolated:**

```
music alone, under speech    -20.99 dBFS
ducked,      under speech    -29.44 dBFS
GAIN REDUCTION                 8.45 dB
music alone, speech absent   -19.10 dBFS
ducked,      speech absent   -19.10 dBFS
RECOVERY GAP                   0.00 dB
```

8.45 dB of separation with complete recovery between beats. From a bed normalised
to -16 LUFS that puts the music near -24.5 LUFS under speech, which is the range
where a bed supports a voice without competing with it.

`release=300` ms is deliberately slow. Faster release makes the bed pump audibly
between short beats, and these scripts are all short beats.

### 4.5 Normalise the mix, then mux

The mix must be normalised **as a whole**. A -16 LUFS voice summed with a -16 LUFS
bed does not produce a -16 LUFS mix.

```
# pass 1, measure
ffmpeg -hide_banner -i mix_raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply, linear
ffmpeg -hide_banner -loglevel error -y -i mix_raw.wav -af \
"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.33:measured_TP=-2.85:measured_LRA=4.60:\
measured_thresh=-26.37:offset=-1.05:linear=true" -ar 48000 -c:a pcm_s24le mix_norm.wav

# mux, picture stream-copied
ffmpeg -hide_banner -loglevel error -y -i <run>-silent.mp4 -i mix_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart <run>-narrated.mp4
```

`linear=true` is required, for the same reason the music library uses it. Dynamic
mode reshapes the envelope, which would partly undo the ducking that was just
applied and would flatten the deliberate dynamic contour.

The `measured_*` values above are from this session's test cut. **Re-measure per
cut.** Copying another cut's pass-1 numbers into pass 2 produces a silently wrong
result, because pass 2 trusts them without checking.

### 4.6 What the delivered file measured

Built against the real `20260730-0113-tiktok-silent.mp4`:

```
narrated.mp4    nb_streams 2      duration 33.000000
video MD5       67418da26d3e780917a3833c076d8fc0
                identical to BOTH the silent and scored originals
verified        input_i  -16.01 LUFS      input_tp  -2.64 dBTP
```

Integrated lands on -16.01 against a -16 target. True peak is -2.64 dBTP, under the
-1.5 ceiling with 1.1 dB spare. **The picture hash is unchanged**, which is the
proof that narration is additive.

**Honest limit: nobody has listened to it.** Everything above is measurement, the
same standing caveat that applies to the music library and the existing voiceovers.
A human should hear one narrated cut before nine are made.

The test artifacts were written to the session scratchpad, not into the repo.

---

## 5. Verify before shipping

A mux can exit 0 and be unreadable, so probe the delivered file rather than
trusting the exit code:

```
ffprobe -v error -show_entries format=nb_streams,duration -of default=nw=1 <file>
ffmpeg  -v error -i <file> -map 0:v:0 -f md5 -
ffmpeg  -hide_banner -i <file> -af loudnorm=print_format=json -f null -
```

| Check | Expected |
|---|---|
| `nb_streams` | 2 |
| `duration` | exactly the silent master's |
| video MD5 | **identical to the silent master's** |
| `input_i` | -16.0 ±0.3 LUFS |
| `input_tp` | at or below -1.5 dBTP |
| Speech end | 0.3 to 0.8 s before last frame |

The MD5 check is the one that catches the worst failure mode, which is an
accidental re-encode. If it differs, `-c:v copy` was dropped and every measurement
in that run's NOTES needs redoing.

---

## 6. The long-form YouTube video

**Checked 2026-07-31: `docs/growth/CAMPAIGN-2026-07-30/youtube/longform/` does not
exist yet.** Only `youtube/shorts/` and `youtube/thumbnails/` are present. Nothing
was read, created or modified there, per the brief. What follows is what changes
structurally, to be reconciled against that agent's script when it lands.

**The one difference that drives all the others: the dependency inverts.**

In the short cuts the picture was locked first, frame-exactly, at 30 to 34 seconds,
and narration has to fit a grid that already exists. In long form the narration is
written first and the picture is cut to it. That is the normal way round and it
removes most of the constraints above.

| | Short cuts | Long form |
|---|---|---|
| Locked first | Picture | **Narration** |
| Word budget | Hard ceiling, 70 to 80 | Set by the script |
| Beat placement | Fixed grid, `adelay` per beat | Natural, picture follows |
| Music | Bed at -16, ducked 8.45 dB | **Bed at -28 to -30 LUFS, duck 3 to 4 dB** |
| Silent variant | Required, is the TikTok master | Not needed |
| Reading on-screen text | Forbidden | Not applicable, little on-screen text |

**Ducking must be gentler, and this is the practical trap.** The short-cut settings
assume sparse speech with real gaps. Under near-continuous narration a
`ratio=8` sidechain pumps audibly on every breath. For long form, drop the bed to
a static -28 to -30 LUFS and use `ratio=2` to `3` with `release=800`, or skip the
sidechain entirely and ride a static bed. Verify by ear, not by measurement alone.

Everything else carries over unchanged: 48 kHz, mono voice source, two-pass linear
`loudnorm` to -16 LUFS and -1.5 dBTP, `-c:v copy` on the mux, probe the delivered
file. YouTube normalises toward roughly -14 LUFS on playback, so delivering -16 is
conservative and correct; do not master hotter to compensate.

Also: chapters need the narration timestamps, so whoever writes the script should
emit beat timings alongside it rather than as an afterthought.

---

## 7. Traps inherited from this pipeline

Each of these has already cost a build in this repo. They apply to the narration
work unchanged.

1. **Drive letters break filtergraphs on Windows.** A colon inside a filtergraph
   option value terminates the option even when quoted, so `fontfile=C:/...` fails
   to parse. Set ffmpeg's working directory to the build folder and reference files
   by bare filename.
2. **`amix` attenuates by default.** Always `normalize=0`.
3. **Never copy another cut's `measured_*` values into pass 2.** Re-measure.
4. **No `ffconcat`.** Cumulative float durations drifted a scene by one frame on a
   previous run while total duration still looked correct. Not needed for audio,
   but do not reintroduce it for narration timing either; use explicit `adelay`.
5. **Frame hashes are not a comparison tool for pictures.** H.264 gives visually
   identical frames different quantisation noise. Stream-level MD5 as used in
   section 5 is fine because it compares the same encoded bytes.
6. **Cutting audio at sample 0 clicks.** The music source peaks at 0.061709 in its
   first 64 samples. Keep the 0.08 s fade in.

---

## 8. Attribution obligation

**If the narration comes from the current local voice, every published narrated
asset carries a credit line:**

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

It goes in the YouTube description, the Instagram caption or first comment, the
TikTok caption, the LinkedIn and Facebook post body, and in the surrounding page
copy wherever the video is embedded on getbrandgeo.com.

**This obligation attaches to the file, not to the campaign**, so it travels with
any re-upload, any repost and any handover to a contractor. It is the easiest thing
in this document to lose.

Three consequences worth planning around:

- The nine short cuts currently have **no** audio obligation, because BrandGEO owns
  the music outright. Narrating them with the CC BY voice **creates** an obligation
  where none existed. That is a real cost of narration, not a footnote.
- Recording Constantin removes the obligation entirely, which is one of the
  strongest arguments in `VOICE-OPTIONS.md` for Route D.
- If the credit line ever becomes awkward, `en_US-joe-medium` is CC0, already
  downloaded, and is a drop-in replacement at the cost of the quality tier.

**A per-channel caption template should be written before the first narrated asset
ships**, not after, so the line cannot be forgotten at posting time. That template
does not exist yet.

---

## 9. What was not done here

- Nothing under `CAMPAIGN-2026-07-30/` was modified. No existing cut was narrated,
  re-rendered or replaced.
- The test artifacts live in the session scratchpad and were not written into the
  repo.
- `youtube/longform/` was checked for existence only. Nothing there was read,
  created or changed.
- No git command was run.
- Nothing was posted, scheduled or uploaded anywhere.
