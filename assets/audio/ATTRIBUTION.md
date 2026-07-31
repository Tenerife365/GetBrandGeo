# Attribution, required

The synthetic voice in every file in this directory comes from the Piper voice
model `en_US-libritts-high` (speaker 42), which is licensed **CC BY 4.0**. That
licence requires credit, and the obligation travels with every published asset
made from it. See `assets/voices/LICENCES.md` for the full licence review.

**This exact line must appear in the description of every published video that
carries this voiceover:**

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

Channels this applies to: YouTube (description), Instagram (caption or first
comment), TikTok (caption), LinkedIn and Facebook (post body). Anywhere the video
is embedded on getbrandgeo.com, the line goes in the surrounding page copy.

This is the one operational cost of choosing libritts over a CC0 voice. It was
accepted knowingly because libritts-high is the only high-quality-tier Piper voice
with a licence usable in a commercial product. If the credit line ever becomes
awkward, `en_US-joe-medium` is CC0 and is the drop-in replacement, at the cost of
the quality tier.

## Files

| File | Video | Speech ends | Video length |
|---|---|---|---|
| `voiceover_ig-reel_20260729-185020.wav` | `brandgeo-ig-reel-seven-engines-1080x1920.mp4` | 27.621s | 28.000s |
| `voiceover_yt-short_20260729-184355.wav` | `brandgeo-yt-short-seven-engines-1080x1920.mp4` | 51.205s | 52.000s |

Both are 48kHz mono PCM, padded with silence to exactly the video length, and
two-pass loudnorm'd toward -16 LUFS / -1.5 dBTP.

The TikTok and LinkedIn/Facebook cuts have **no voiceover**. Their shared script
runs **46.15 seconds against a 38.000 second edit** and needs about 34 words cut,
which is a scripting decision rather than a render problem.

## How these were rendered

`en_US-libritts-high`, `speaker_id=42`, tone A (`length_scale` 1.00,
`noise_scale` 0.75, `noise_w_scale` 0.85), matching the approved sample
`assets/samples/sample_C_libritts_sp42.wav`.

Rendered **per beat**, not as one take, so each line lands on its scripted
timestamp. Piper varies about 11% in duration between runs on identical text and
`SynthesisConfig` exposes no seed, so every beat was synthesised 12 times and the
shortest take kept. Nothing was time-stretched or resampled to fit.

Two lines were shortened because the untrimmed read ran past the end of its
video. Both trims are recorded in the delivery report; the source scripts in
`docs/growth/2026-07-29-grok-sixth-engine/` still carry the original wording and
should be reconciled by whoever owns that package.
