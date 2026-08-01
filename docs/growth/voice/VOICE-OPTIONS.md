# Voice options, costed and compared

Written 2026-07-31. Extends `REFERENCE-SCRIPT.md` in this folder, which is still
valid and is not superseded by anything here.

---

## Recommendation, three sentences

**Record Constantin against the script in `RECORDING-KIT.md` this week and buy
nothing yet.** It costs about 45 minutes of his time and EUR 0, because a 1 to 2
minute reference take is the one input no vendor can sell him later, it is
immediately usable as real narration on the long-form video, and it is the exact
asset an instant clone needs if we decide we want one. **What would change my
mind:** if short-form output goes past roughly one new script per day, the
per-video recording burden stops being payable and an instant clone at USD 6 to
22 a month becomes the cheaper path.

---

## First, a correction to the premise

The brief says BrandGEO has no voice asset today. That is not accurate, and the
inaccuracy matters because it changes what "doing nothing" costs.

**A licence-cleared synthetic voice already exists in this repo and has already
been rendered onto finished video.**

| Asset | Where | State |
|---|---|---|
| Piper voice model, `en_US-libritts-high` speaker 42 | `assets/voices/` | Downloaded, 136 MB, working |
| Three CC0 / public-domain fallback voices | `assets/voices/` | Downloaded, working |
| Two rendered voiceover tracks | `assets/audio/voiceover_*.wav` | 48 kHz mono, loudnorm'd, matched to two finished videos |
| Licence review of every model | `assets/voices/LICENCES.md` | Complete, each MODEL_CARD read and followed to source |
| Cloud clone connector, two backends | `scripts/cloud_voice_clone.py` | 458 lines, ElevenLabs and Gradio, two-stage sample gate |

Speaker 42 was not guessed. Twenty speakers were synthesised and their median
fundamental frequency measured by autocorrelation over voiced frames; speaker 42
measured 95.0 Hz, the deepest of the nine that landed in the male range.

**Verified working in this environment today**, not assumed:

```
python -c "import piper"            OK   (Python 3.14 site-packages)
piper synthesis, speaker 42          OK   (22,050 Hz mono, 3.204 s from 12 words)
ffmpeg                               8.1.2-full
sidechaincompress, loudnorm          both present
```

So the true starting position is: **BrandGEO has a working voice it does not
love, and does not have Constantin's.** The question is not "how do we get a
voice", it is "is it worth replacing the one we have, and with what".

---

## The routes

Five, not three. Instant and professional cloning are split because the
difference is 1 to 2 minutes of recording versus 30 to 180 minutes, which is the
single largest variable in the whole decision. The already-built local route is
included because ignoring it would make every other option look better than it is.

| # | Route | Cash cost | Constantin's time | Time to stand up | Whose voice |
|---|---|---|---|---|---|
| A | Instant clone of his voice | USD 6 to 22 / mo | 45 min, once | Same day | His |
| B | Professional clone of his voice | USD 22 / mo | 4 to 8 hours, once | 1 to 2 days | His |
| C | Licensed stock synthetic | USD 0 to 30 / mo | None | Half a day | Rented, shared |
| D | He narrates every video | EUR 0 | 30 to 60 min per script, forever | Immediate | His, genuinely |
| E | Local open weights (already built) | EUR 0 | None | Already done | Nobody's |

---

### Route A. Instant clone of Constantin's voice

**What it needs from him.** One clean recording, 1 to 2 minutes of usable speech.
Not more: the vendor documentation is explicit that going past 3 minutes "will
yield little improvement and can, in some cases, even be detrimental to the
clone". This is the route `RECORDING-KIT.md` is written for.

**Recording spec the vendor requires**, and this is a real constraint rather than
advice: RMS between -23 and -18 dB, true peak -3 dB, single speaker, no
background noise, no reverb, consistent tone throughout.

**Cost.** Instant Voice Cloning first appears on the Starter tier at USD 6 a
month. Verified from the vendor's own pricing page on 2026-07-31.

**Licensing position.** Paid plans carry a commercial licence and the customer
owns the generated audio, including after cancelling the subscription. The free
plan has no commercial licence and requires attribution, so it is disqualifying
for a paid product. Cloning is restricted to your own voice and a verification
step enforces it, which is the correct policy and is consistent with the
constraint that no third party's voice may be cloned here.

**The term that actually needs checking before anything is uploaded.** A
third-party summary states that uploading a voice grants the vendor a perpetual
licence to create derivatives of it for model improvement. **I could not verify
this from the primary source** and have marked it `[UNVERIFIED]` below. It is the
one clause that would make me hesitate, because it concerns the founder's own
voice rather than a rented one, and it is not reversible by cancelling.

**What it is good at.** Volume. Once the clone exists, a new 33 second script
costs a minute of machine time and nothing of Constantin's. That is the entire
argument for this route and it is a strong one if the cadence is high.

**What it trades away.** It is a clone, so it inherits whatever is wrong with the
reference take and cannot be coached out of it later without re-cloning. And the
voice now lives on someone else's servers under someone else's terms.

---

### Route B. Professional clone of his voice

**Why it is listed separately.** The training requirement is 30 minutes minimum,
2 to 3 hours recommended, against Route A's 1 to 2 minutes. Verified from the
vendor's own documentation on 2026-07-31.

**What that actually means in his calendar.** Thirty minutes of *usable* audio is
not thirty minutes of recording. With re-takes, water breaks and the inevitable
first-twenty-minutes-are-stiff problem, 30 usable minutes is a 60 to 90 minute
session, and the recommended 2 to 3 hours is a full day split across two or three
sessions. The vendor also recommends an XLR microphone into an interface, a pop
filter and an acoustically treated room, none of which BrandGEO has.

**Cost.** First available on the Creator tier at USD 22 a month. Training takes 3
to 6 hours and can take up to 24. A verification recording is required before
submission.

**My read.** Not now. The quality gain over Route A is real but it is bought with
roughly forty times the recording burden, at a point where nobody has confirmed
that a cloned voice is even the right answer. Route A is the cheap experiment
that tells you whether Route B is worth running.

---

### Route C. Licensed stock synthetic

**The finding that reframes this whole comparison: at BrandGEO's actual volume,
synthesis is close to free, so cost is not the deciding axis.**

A 33 second cut carries roughly 80 words, about 450 characters. The nine vertical
cuts together are about 4,050 characters.

| Vendor tier | Price | Nine cuts | An 8 minute long-form script |
|---|---|---|---|
| Neural | USD 16 / 1M chars | USD 0.06 | USD 0.11 |
| Generative | USD 30 / 1M chars | USD 0.12 | USD 0.20 |
| Long-form | USD 100 / 1M chars | USD 0.41 | USD 0.67 |

Free tier is 100,000 generative characters a month for the first 12 months, which
covers about 220 short cuts a month at zero cost. Verified from the vendor's
pricing page on 2026-07-31.

**Licensing position, and it is the cleanest of any route.** Output belongs to the
customer, there are no restrictions on storing or reusing generated speech, no
per-replay fees, and the vendor does not retain submitted text. The one stated
obligation is that you must hold the rights to the text you submit, which
BrandGEO does.

**What it trades away, and this is why it is not my recommendation despite being
the cheapest and legally cleanest.** A stock voice is rented and shared. Any
competitor can license the identical voice, including Peec AI, Profound or
Otterly. For a brand whose entire thesis is that being the same as everyone else
in an answer is the failure mode, fronting the product with a voice a competitor
can buy is a poor fit. It is a perfectly good answer to "we need narration by
Friday" and a poor answer to "what should BrandGEO sound like".

---

### Route D. He narrates every video

**Do not dismiss this, and the brief is right that it has real advantages.**

**Cost.** EUR 0 in cash, forever. No account, no vendor, no terms of service, no
attribution line, no clause about derivatives, no dependency that can be
repriced or withdrawn.

**Licensing position.** Unimprovable. He owns the recording outright, on every
channel, in perpetuity, with no third party in the chain at all. This is the same
position BrandGEO already deliberately chose for its music, and for the same
reason: `scripts/compose_music.py` exists specifically because the Suno free tier
forbids commercial use, so the tracks were composed from oscillators instead. The
argument that produced the music library applies to voice unchanged.

**What it is genuinely better at.** Authenticity that cannot be synthesised. A
founder saying "we got this wrong and here is what we found" in his own voice is
the single strongest asset the brand has, and it maps exactly onto the published
voice, where the strongest line is usually an admission. A clone reading that
sentence is a founder-shaped performance of an admission. The real recording is
an admission.

**Where it breaks, and it does break.** The nine vertical cuts are an A/B test in
which the hook is the variable and a new run ships roughly hourly. Copy changes
per run by design. Re-recording nine narration tracks every time a hook is
rewritten converts a 20 minute render into a half-day of studio work, and the
test stops running. Route D does not scale to iteration, and iteration is what
the short-form pipeline is for.

**So the honest verdict is a split, not a winner.** Route D is correct for the
long-form YouTube piece, where there is one script, it changes rarely, it is
minutes long rather than seconds, and founder authenticity is the actual product.
It is wrong for the nine short cuts.

---

### Route E. Local open weights, already built

**Cost.** EUR 0. No account, no API key, no network call, no rate limit. Runs on
this machine today.

**Licensing position.** `en_US-libritts-high` is CC BY 4.0, which requires a
credit line that travels with every published asset:

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

That line has to appear in the YouTube description, the Instagram caption or
first comment, the TikTok caption, the LinkedIn and Facebook post body, and in
the surrounding page copy anywhere the video is embedded on getbrandgeo.com. It
is a small tax, but it is a permanent one and it is easy to forget on a channel
handover. Three CC0 and public-domain fallbacks are already downloaded and carry
no obligation at all, at the cost of dropping from the high quality tier to
medium.

**Measured weakness, and it is the one that matters.** I measured the delivered
speech rate across seven takes per setting:

```
length_scale 1.00   median  9.25 s   233.4 wpm   run-to-run spread  8.7%
length_scale 1.15   median 10.09 s   214.1 wpm   run-to-run spread  6.0%
length_scale 1.30   median 10.62 s   203.3 wpm   run-to-run spread 10.5%
```

Considered narration sits around 140 to 160 wpm. **This voice cannot be slowed to
that pace with `length_scale` alone**, and it stays above 200 wpm even at the
extreme. Pace has to come from silence inserted between beats instead, which is
what the existing per-beat render already does. That is a workable answer and it
is documented in `INTEGRATION.md`, but it is a workaround, and the voice will
always read as brisker than the brand voice asks for.

Run-to-run duration varies by 6 to 10 percent on identical text and identical
config, because `SynthesisConfig` exposes no seed. The existing pipeline handles
this by synthesising each beat 12 times and keeping the shortest take. Any timing
plan has to assume that variance rather than a nominal duration.

---

## Uncertainty register

Everything below is a thing I could not confirm and am not going to state as
fact.

| Item | Why unverified |
|---|---|
| `[UNVERIFIED]` Whether uploading a voice grants the vendor a perpetual derivative licence for model improvement | Comes from a third-party legal summary. The vendor's own help article returned HTTP 403 to an unauthenticated fetch. **Check this before any upload; it is the highest-stakes term in the whole decision.** |
| `[UNVERIFIED]` Whether EEA terms differ from the terms I read | The terms document surfaced in search is labelled "non-EEA". Constantin operates from the EU, so a different contract may govern. |
| `[UNVERIFIED]` VAT treatment and the real EUR cost of the USD prices | Prices are listed in USD. An EU business buying a US SaaS subscription may face reverse-charge VAT. Not modelled. |
| `[UNVERIFIED]` Pricing and terms for any vendor beyond the two checked | Only two vendors were priced. Cartesia, Play.ht, Speechify, Azure and Google were not checked at all. |
| `[UNVERIFIED]` Whether an instant clone from a 2 minute phone recording is actually good enough | Nobody has heard one. This is unknowable without recording, which is the argument for recording first. |
| `[UNVERIFIED]` Whether the Piper voice sounds acceptable to Constantin | Stated plainly in `ATTRIBUTION.md` as well: nobody has listened to the rendered files. Every claim about them is measurement. |

**A note on scope.** I did not create an account, did not enter any credential,
did not upload any audio or text to any service, and did not clone any voice. The
vendor facts above come from reading public pricing and documentation pages only.

---

## Decision triggers

Do not re-argue this from scratch. Revisit when one of these fires.

1. **Short-form cadence passes roughly one new script per day.** Route D stops
   being payable. Move the short cuts to Route A.
2. **The reference recording comes back and sounds wrong.** If his read does not
   carry the register in `VOICE-SPEC.md`, cloning it just industrialises the
   problem. Fix the read before cloning it.
3. **The CC BY credit line is missed on a published asset.** That is a licence
   breach on a paid product. If it happens once, switch Route E to a CC0 fallback
   the same day, or drop Route E.
4. **Someone hears a competitor using the same stock voice.** Kills Route C
   outright.
5. **A long-form channel becomes the main acquisition surface.** Strengthens
   Route D and justifies real recording equipment.

---

## What I would actually do, in order

1. Constantin records `RECORDING-KIT.md`, one sitting, about 45 minutes. This is
   the only step with a hard dependency on him and it unblocks A, B and D at once.
2. I measure the take (noise floor, RMS, true peak, clipping) and report before
   anything is built on it. If it fails the spec, he re-records the bad section
   only, and nothing has been spent.
3. The usable portion becomes real narration on the long-form YouTube piece.
4. The nine short cuts stay on Route E until either the cadence trigger or the
   quality trigger fires.
5. Only if trigger 1 fires: he checks the derivative-licence clause, and if it is
   acceptable, he creates the account himself and runs the instant clone. **I
   cannot create that account or enter that key.**

Sources for the vendor facts, all read 2026-07-31:
[ElevenLabs pricing](https://elevenlabs.io/pricing),
[Instant Voice Cloning docs](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning),
[Professional Voice Cloning docs](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning),
[Amazon Polly pricing](https://aws.amazon.com/polly/pricing/),
[Amazon Polly re:Post on output ownership](https://repost.aws/questions/QU1slb0Zf6R5unDpAp9UCT7A/amazon-polly-s-voice-license).
