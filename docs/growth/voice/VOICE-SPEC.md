# Voice spec

What BrandGEO sounds like out loud. Written 2026-07-31.

Written to be actionable twice over: a human reading a script can follow it, and
a synthesis backend can be configured from section 8 without interpretation.

This is the spoken extension of an existing written voice. It does not invent a
personality. Sections 1 and 2 derive from the published archives named in
`docs/growth/CAMPAIGN-2026-07-30/_shared/BRIEF.md` §7, which two agents extracted
independently, and from §2 of the growth skill.

---

## 1. The register in one paragraph

An operator telling a colleague something they just found out, before they have
decided how they feel about it. Not presenting. Not selling. Not explaining
something the listener already knows. The information is interesting enough that
it does not need help, and the speaker knows that, so the delivery gets out of
the way. When the news is bad for us, the delivery does not change.

If you need one instruction: **read it like you are reporting, not like you are
persuading.**

---

## 2. Reconciling the two source descriptions

The skill file calls the voice "direct, technical, slightly contrarian". The
published archives show a brand that "persuades by conceding", where "the
strongest line is usually an admission". Read carelessly those are opposites, and
a narrator handed both will land somewhere mushy in the middle.

They are not opposites. They apply to different objects.

| Object | Stance | Example |
|---|---|---|
| The category, the received wisdom, the tooling everyone uses | **Contrarian.** State the disagreement flatly. | "Rank and AI visibility are two different measurements." |
| Our own product, our own research, our own errors | **Conceding.** Volunteer the limit before anyone asks. | "The last two pieces of research we published were both about mistakes in our own product." |
| A measured finding | **Neither.** Report it and stop. | "Five of five engines named one company, property management, Chicago, July 24." |

**Never contrarian about our own results, and never conceding about the
category.** The first is bravado, the second is hedging, and the brand does
neither. This distinction is what keeps "slightly contrarian" from turning into
swagger, which is the failure mode a confident narrator drifts toward without
being told not to.

---

## 3. Pace

**Target: 140 to 160 words per minute measured end to end, including pauses.**

This is the number to hit, and it is not the number any synthesis default
produces. Measured on the voice currently in use, seven takes per setting, median
reported:

```
length_scale 1.00   233.4 wpm    run-to-run spread  8.7%
length_scale 1.15   214.1 wpm    run-to-run spread  6.0%
length_scale 1.30   203.3 wpm    run-to-run spread 10.5%
```

**The speed control cannot reach the target.** Even at the extreme the voice is
40 wpm too fast, and pushing further makes it sound drugged rather than
considered. So:

> **Pace comes from the silence between beats, not from the speed of the speech.**

Render each beat separately, at a natural speed, and place it on its own
timestamp with real silence in between. That is already how the existing pipeline
works and it is the correct architecture, not a workaround for a missing feature.
A 33 second cut at 80 words is 145 wpm end to end even though every individual
beat was spoken at 215.

For a human reading: speak at your normal considered pace and take the pauses
seriously. Do not slow the words down.

---

## 4. Pause grammar

Pauses carry more of this voice than any other single variable. They are the
difference between a report and a pitch.

| Position | Silence | Why |
|---|---|---|
| Comma | 120 to 180 ms | Ordinary breath. |
| Full stop | **400 to 600 ms** | The half second the original recording script asks for. Non-negotiable. |
| Paragraph or scene change | 700 to 1,000 ms | Lets the previous idea finish landing. |
| **Before a number that matters** | 500 to 700 ms | The pause does the emphasis so the voice does not have to. |
| **After an admission** | 600 to 900 ms | Do not rush past it. Rushing reads as embarrassment, and the concession is the strongest asset in the paragraph. |
| Before the closing line | 800 ms | One beat of separation, not a drum roll. |
| End of cut, after last word | **300 to 800 ms of picture** | Never end speech on the final frame. Measured on the two shipped tracks: speech ends at 27.621 s in a 28.000 s video, and 51.205 s in a 52.000 s video. |

---

## 5. Sentence construction

- **Target 8 to 14 words.** Under 6 reads clipped and staccato across a whole
  script. Over 20 cannot be delivered in one breath at this pace and will be
  broken badly by a synthesiser that does not know where the clause ends.
- **One idea per sentence.** If a sentence needs "and" to hold two facts, it is
  two sentences.
- **Open on the thing itself.** Flat and declarative. Never a tease, never a
  question, never scene-setting.
- **Plain verbs.** Is, does, has, ran, found, named, missed. Verbs that need an
  adverb to work are the wrong verbs.
- **Numbers arrive naked**, carrying their denominator, date and scope in the
  same breath as the finding. A figure that cannot carry them in the space
  available gets cut, not footnoted.
- **Close on a practical implication addressed to the listener's next decision**,
  not on a CTA verb. "If you have never checked, the audit takes about a minute"
  rather than "Sign up today".

---

## 6. Energy and emphasis

**Flat is the default, and flat is not the same as dull.** The energy comes from
the density of the information, not from the delivery. This is a brand whose
product is measurement, so a voice that sounds excited about its own numbers
undermines the thing being sold.

Specifically:

- **No rising excitement on larger numbers.** Seventy five percent gets exactly
  the same delivery as seventeen percent. This is the most common failure and it
  is the one that most damages credibility.
- **No smile in the voice.** Warmth comes from being straightforward, not from
  brightness.
- **No upward inflection at the end of a statement.** Every full stop falls.
- **Emphasis by isolation, not by volume.** To stress a word, put silence before
  it. Do not push it louder or higher.
- **Dynamic range stays narrow.** The loudest and quietest lines should be within
  a few dB. A voice that swoops is performing.

---

## 7. What it never does

1. **Never opens with a rhetorical question.** A question may close a piece.
2. **Never explains what an LLM or ChatGPT is.** The listener is a founder, head
   of growth, or SEO lead. Explaining the basics insults them and signals the
   product is not for them.
3. **Never uses the banned vocabulary**, spoken or written: delve, unlock,
   unleash, elevate, harness, leverage as a verb, game-changer, supercharge,
   revolutionize, seamless, robust, cutting-edge, transformative, "dive in", "in
   today's fast-paced world", "it's not just X, it's Y".
4. **Never states a superlative about the research program.** No first, only,
   strongest, cleanest, most unanimous. Several published pages assert these
   about themselves and contradict each other, so no page is a source for a
   program-wide maximum.
5. **Never universalises.** "Nobody does this by hand" is refuted by one
   counterexample. "You do not get a copy" is a true statement about how answer
   engines work and is fine.
6. **Never names a real measured company.** The research pages do. Campaign audio
   does not.
7. **Never reads a price on a top-of-funnel asset**, and never closes a
   bottom-of-funnel asset without one.
8. **Never performs an admission.** State it and move on. A concession delivered
   with gravity becomes a humblebrag.
9. **Never says a number without its denominator, date and scope.**
10. **Never sounds urgent.** No countdown energy, no scarcity in the delivery.

---

## 8. Machine-actionable configuration

### 8.1 Ruling: use tone B, not tone A

`scripts/cloud_voice_clone.py` defines two tone configurations and the gate always
compares them. **The two voiceover tracks currently rendered in `assets/audio/`
were made with tone A, "energetic operator".** That is the wrong one for this
brand, and it is a live inconsistency rather than a hypothetical.

| | Tone A "energetic operator" | Tone B "deep analytical" |
|---|---|---|
| Status | **Currently shipped** | **Correct per this spec** |
| Cloud speed | 1.00 | 0.95 |
| Cloud stability | 0.38 | **0.62** |
| Cloud style | 0.45 | **0.20** |
| Piper `length_scale` | 1.00 | 1.05 |
| Piper `noise_scale` | 0.75 | **0.55** |
| Piper `noise_w_scale` | 0.85 | **0.70** |

Lower noise reads flatter and steadier, and higher stability suppresses the
expressive variation that reads as selling. Both move toward section 6.

**Recommended change:** re-render the two existing tracks under tone B and compare
before adopting. That is a cheap A/B and it costs nothing but machine time. I have
not made this change, because the two tracks are matched to finished videos and
re-rendering them is outside a planning task.

### 8.2 Parameter block, current local backend

```
voice          en_US-libritts-high
speaker_id     42               (median F0 95.0 Hz, measured by autocorrelation)
length_scale   1.05
noise_scale    0.55
noise_w_scale  0.70
```

Render **per beat, not per script**, and place each beat on its own timestamp.
Two reasons, both measured: pace has to come from the gaps (section 3), and this
backend varies 6 to 10 percent in duration between runs on identical text with no
seed available. The existing pipeline synthesises each beat 12 times and keeps the
shortest take. Keep doing that.

### 8.3 Loudness, all voice output

```
integrated   -16 LUFS
true peak    -1.5 dBTP
channels     mono
rate         48 kHz
method       two-pass loudnorm, linear=true
```

`linear=true` is load-bearing. Dynamic mode reshapes the envelope, which flattens
exactly the dynamic contour section 6 is trying to control, and it is the same
reason the music library is normalised linearly.

### 8.4 If a human is reading

Give the reader section 1, section 4, section 6 and section 7. Those four are the
whole instruction. The rest is for whoever assembles the file.

---

## 9. Applying this to Constantin's own voice

Everything above is about the read, not the voice, so it applies unchanged to a
recording of a real person. Two additions specific to him:

- **The reference recording defines the ceiling.** A clone cannot be coached
  later. Whatever register is on the reference take is the register of every
  future video, so the take has to be right rather than merely clean. This is why
  `RECORDING-KIT.md` section 4 spends more words on delivery than on equipment.
- **His natural pace is probably faster than the target**, because almost
  everyone's is when reading their own material. The half-second-at-every-full-stop
  instruction exists to bring the end-to-end rate down to 140 to 160 wpm without
  asking him to speak unnaturally slowly, which never survives past the first
  paragraph.

**Unmeasured, and worth measuring when the take arrives:** his median fundamental
frequency, so the synthetic fallback voice can be chosen to sit near it rather
than clash with it if both ever appear in one campaign. Speaker 42 measures
95.0 Hz. If his voice sits far from that, the two are not interchangeable and the
fallback should be re-selected from the models already downloaded.
