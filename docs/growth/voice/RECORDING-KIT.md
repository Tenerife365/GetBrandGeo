# Recording kit

For Constantin. Written 2026-07-31.

**This extends `REFERENCE-SCRIPT.md` (2026-07-29) and does not replace it.** That
document's guidance on room, microphone and delivery is correct and is not
repeated here in full. What follows is the corrected script, the measurable
targets it was missing, and three findings that would have degraded the result if
the original had been recorded as written.

Read section 6 before you press record. Everything else can be read once.

---

## 1. Three corrections to the 2026-07-29 script

**1.1 The three minute target is at the wrong end of the range, and more is not
better.** The vendor documentation for instant cloning is explicit: minimum 1
minute, recommended 1 to 2 minutes, and going past 3 minutes "will yield little
improvement and can, in some cases, even be detrimental to the clone". The
original script targets about three minutes as one undifferentiated block, which
puts the whole take at the ceiling.

The fix is structural rather than shorter. This version splits the recording into
**a clone core of about 100 seconds** and **a narration bank** that is recorded in
the same sitting, in the same room, at the same level, but is never uploaded as
training material. You record roughly the same total. Only part of it becomes the
clone.

**1.2 The price list is out of date as of yesterday.** The ladder changed on
2026-07-31: a new **Radar** tier was added at EUR 39 list, EUR 29 for the first
100 customers, and the free tier moved from ChatGPT to Gemini. The original
Section 4 reads "Ninety nine euro. Two hundred and ninety nine euro. Four hundred
and forty nine euro" and is now missing the two numbers most likely to appear in
acquisition copy for the next month. Verified today against
`brandgeo-dashboard/src/lib/planConfig.ts` and `src/pages/Account.tsx`, not
against any document.

**1.3 There were no measurable targets, so there was no way to fail.** The
original says "quiet room" and "do not use AirPods", both correct, but nothing in
it could be checked before the file was built on. The vendor publishes a hard
spec: **RMS between -23 and -18 dB, true peak -3 dB, single speaker, no
background noise, no reverb.** Section 7 gives you two commands to check your own
file against that before you send it.

**Still open from the original, and I still need your ruling.** Section 4 below
asks you to say two words both ways. Nothing can be synthesised correctly until
you do, because the spelling does not determine the pronunciation and I would
otherwise be guessing in every script.

---

## 2. Environment

Unchanged from the original and still right. The short version:

- Smallest carpeted room you have, or a bedroom with the wardrobe open. Soft
  surfaces absorb the reflections that make a clone sound boxy.
- No kitchen, no bathroom, no hard floors, no bare walls.
- Window closed. Anything with a fan off, including the laptop if you can record
  on the phone instead.
- **Reverb is the one defect that cannot be removed later.** Noise can be gated,
  level can be normalised, a room cannot be un-heard.

## 3. Device and format

- A phone 15 to 20 cm from your mouth, angled slightly off axis so breath does
  not hit the capsule. Voice Memos on iPhone, Recorder on Android. This is
  genuinely fine.
- **Not AirPods, not earbuds, not the laptop's built-in microphone.** All three
  apply noise suppression that removes exactly the detail a clone trains on.
- WAV or lossless if offered. If the app only writes m4a, that is acceptable.
  If you can choose a bitrate, take the highest.
- **Mono. 48 kHz preferred, 44.1 kHz fine.**
- **Every clean-up feature off.** No noise reduction, no EQ, no compression, no
  "voice enhancement", no "voice isolation". Each one makes the clone worse.

## 3b. If you have a real microphone, use it. Windows setup.

Added 2026-08-01. Section 3 assumes a phone because that is the floor. A studio
condenser with a pop filter beats it, and it is what Constantin has, so this
section supersedes section 3 for him.

**Audio only. There is no video in this pipeline at any point.**

### The trap that will silently ruin the take

**Disconnect the Jabra headphones entirely, and turn Bluetooth off for the
session.**

This is not fussiness. When a Bluetooth headset is connected, Windows can switch
it into the hands-free profile, which drops BOTH input and output to 8 to 16 kHz
mono for the whole system. It can grab the input even when a USB microphone is
selected, and the recording will look fine in the meter while being telephone
quality. A clone trained on that inherits it permanently.

If you want to hear yourself, use WIRED headphones in the microphone's own
headphone jack if it has one. That is zero-latency monitoring and costs nothing.
Never monitor over Bluetooth, the delay makes you slow down mid-sentence.

### The microphone

- **Pop filter on, two to three finger widths from the capsule.** That is what it
  is for and it is the difference between usable and re-recording.
- **20 cm from your mouth, angled slightly off axis.** Closer than 10 cm and
  proximity effect adds bass the clone bakes in permanently.
- **Cardioid**, if the mic has a pattern selector. Omni picks up the room.
- **Every built-in effect OFF.** Many USB mics ship with a gain knob plus some
  combination of noise gate, compressor, EQ presets, or a "voice" mode. Turn all
  of it off. The clone trains on whatever processing you apply and it cannot be
  removed afterwards. Raw is the goal, not clean.

### Windows, three settings that are on by default and should not be

1. `Settings > System > Sound`, click the microphone, set **Audio enhancements:
   Off**.
2. `More sound settings > Recording` tab, select the mic, `Properties >
   Advanced`, untick **Enable audio enhancements**.
3. Same dialog, `Levels` tab: if there is a **Microphone Boost**, set it to 0.
   It amplifies the noise floor along with you. Use the mic's own gain knob.

### The software: Audacity

Free, writes real WAV, and shows you a level meter, which the built-in Windows
Voice Recorder does not. Get it from `audacityteam.org`.

- **Audio Setup > Host: Windows WASAPI**
- **Audio Setup > Recording Device:** your microphone by name. Check this. If it
  says Jabra anything, stop and fix it.
- **Audio Setup > Recording Channels: 1 (Mono)**
- **Project Rate, bottom left: 48000 Hz**
- Record, and set the mic's gain so your **loudest peaks land around -6 dB and
  never touch 0**. Speech sits roughly 15 dB below its peaks, which puts you in
  the -23 to -18 dB RMS the vendor requires.
- Export with `File > Export Audio`, format **WAV**, encoding **Signed 16-bit
  PCM**, and leave the rate at 48000.

Do a ten-second test, export it, and run the ffmpeg check in section 7 BEFORE
reading the whole script. Two minutes spent there is the difference between one
session and two.

## 4. Delivery

This is the part that sets the tone of every video, so it matters more than the
microphone.

The clone copies how you sound in this file. Read it the way you want the videos
to sound, not the way you would read a document aloud.

- **Like you are telling a colleague something you just found out.** Direct,
  slightly clipped, mildly interested. Not presenting. Not selling.
- Slightly slower than your normal pace, and **hold that pace to the end**. Most
  people start energetic and drift flat, and the clone averages the two into
  something that sounds bored.
- Do not smile through it and do not push energy. BrandGEO sells measurement. An
  enthusiastic voice on a brand about not exaggerating reads wrong.
- **Leave a real half second at every full stop.** Pauses are data, and this
  particular pipeline gets its pacing from the gaps rather than from the speed.
- If you stumble: pause two full seconds, then repeat the whole sentence from the
  start. Do not stop the recording. I will cut it.

Full detail on why, and the reasoning behind the register, is in `VOICE-SPEC.md`.

---

## 5. What ruins a training set

In rough order of how often it happens and how unfixable it is.

| Mistake | Why it ruins it |
|---|---|
| **Splicing takes from two sittings** | Different room tone stitched into one file is the most common single cause of an artificial-sounding clone. One continuous take. |
| **Any reverb at all** | The clone learns the room and puts it on every future line. Unremovable. |
| **Noise suppression left on** | Strips the high-frequency detail the model trains on. Sounds fine to you, sounds synthetic once cloned. |
| **Drifting pace or energy** | The model averages the whole file. Start and end must match. |
| **Recording too much** | Past about 3 minutes for an instant clone, extra audio stops helping and can hurt. More is not better. |
| **Clipping** | Any sample at full scale is permanent distortion the clone reproduces. Aim for peaks around -6 dB, never touching 0. |
| **Sitting too close** | Under about 10 cm, proximity effect adds bass the clone bakes in, and plosives distort. |
| **Reading rather than talking** | The model learns "reading voice" and every video sounds like a document being read. |
| **Background bed** | Music, TV, traffic, a fridge compressor. Single speaker, nothing else. |
| **Editing before sending** | Do not normalise, de-noise, or de-ess it. Send the raw file. I will measure it first. |

---

## 6. The script

Read **sections A through E in one continuous take**, in order, without stopping.
Pause two full seconds between lettered sections.

Only **B, C and D** are uploaded as clone training material, which is the
correction described in 1.1. **A** is level-setting and is discarded. **E** is
recorded for use as real narration and is deliberately kept out of the training
upload, because it would push the total past the useful ceiling.

Blockquoted text is what you say. Everything else is direction.

---

### A. Level and warm-up
*Discarded. Sets your recording level and gets the first-sentence stiffness out.*

> Testing, one two three. This is Constantin, recording a voice reference for
> BrandGEO on the thirty-first of July. The room is quiet and I am about twenty
> centimetres from the microphone.

*(pause two seconds)*

---

### B. The core read
*This is the most important 70 seconds in the file. If you re-record only one
section, re-record this one. It is written to be used as actual narration, so
nothing in it is filler, and every claim in it is true today.*

> Most people check whether they show up in ChatGPT, and then they stop looking.
>
> That is one engine. There are seven that matter, and they do not agree with
> each other. The same question, asked the same way, on the same day, gets a
> different answer from each of them. A brand that leads on two engines can be
> completely absent from the other five.
>
> You would not know. Nothing tells you. There is no ranking report for this and
> no console to log into. The only way to find out is to ask all of them and
> count what comes back.
>
> So that is what we built.
>
> Buyer questions, fired at every engine, on a schedule. Whether you were
> mentioned. Where you sat in the answer. Who got named instead of you. And
> whether any of that changed since the last run.
>
> We measure visibility, not vision. An answer engine either knows your brand or
> it does not, and the third possibility, that it half knows you, is the one that
> costs the most.
>
> If you have never checked, the free audit takes about a minute, and it does not
> ask for a card.

*(pause two seconds)*

---

### C. Sound coverage
*Short and deliberately awkward. It carries the sounds English synthesis gets
wrong most often. Read it at the same pace as B, not faster because it is a list.*

> Three years ago the question was ranking. Today it is retrieval, and that shift
> is not cosmetic. A page that ranks first and gets retrieved never is worth less
> than a page that ranks eighth and gets quoted every single time.
>
> Judge the usual measure of pleasure against a rough decision. Whether the
> thing works is a question worth thinking through.
>
> Good, bad, huge, tough, caught, boat, book, boot, bird, bite, about, employ,
> young, wrong, church, vision.

*(pause two seconds)*

---

### D. The names
*Every proper noun that will ever come out of the clone. Say each the way you
want it said in the videos, at conversational pace.*

**I need your ruling on two of these.** Say each one both ways where marked. I
have to spell them phonetically in every synthesis script and there is no way to
get it from the text.

> ChatGPT. Gemini. Claude. Perplexity. Grok. Google AI Mode. Google AI Overviews.
>
> Now in a sentence. We collect from ChatGPT, Gemini, Claude, Perplexity, Grok,
> Google AI Mode and Google AI Overviews. Seven engines.
>
> Now both ways, so I can hear which you use. BrandGEO. Brand G E O.
>
> And again. GEO. G E O. Generative engine optimisation.
>
> Get BrandGEO dot com.
>
> OpenAI. Anthropic. xAI. Bing. SEO. AI. LLM. API.
>
> Free. Radar. Essentials. Growth. Growth PRO. Managed. Enterprise.
>
> Constantin Goane. Bucharest. Euro.

*(pause two seconds)*

---

### E. Numbers and prices
*Recorded for narration use, not uploaded as clone training material. Read at the
same measured pace, and do not let excitement rise on the larger figures. A
number read with enthusiasm sounds like a sales pitch, which is the one thing
this brand's numbers must never sound like.*

*The prices below are the live ladder as of 2026-07-31. Recording a number is not
publishing it; these exist so a future cut does not need you back in the room.*

> Twenty nine euro. Thirty nine euro. Ninety nine euro. Two hundred and ninety
> nine euro. Four hundred and forty nine euro. One thousand five hundred euro.
>
> One engine. Two engines. Three engines. Five engines. Seven engines.
>
> One, two, three, four, five, six, seven, eight, nine, ten. Twenty. Fifty. One
> hundred. One thousand.
>
> Zero percent. Seventeen percent. Twenty five percent. Forty two percent. Fifty
> eight percent. Seventy five percent. Eighty three percent.
>
> Five out of five. Three of seven. Zero of twelve.
>
> Twenty twenty six. The thirty first of July. Point four. Point one five. Two
> point five seconds. Number one. Number two. Number four.

*(pause two seconds, then stop the recording)*

---

## 7. Check your own file before sending it

Both commands are read-only and will not modify the recording. Run them from the
folder the file is in. `ffmpeg` is already installed on this machine.

**Level and clipping:**

```
ffmpeg -hide_banner -i take.wav -af volumedetect -f null -
```

Read the two lines it prints at the end:

| Reading | Target | If it fails |
|---|---|---|
| `mean_volume` | between -23 and -18 dB | Below -23: move closer or raise input gain. Above -18: back off. |
| `max_volume` | at or below -3 dB, never 0.0 | At 0.0 dB you have clipped. Re-record, do not fix in software. |

**Noise floor and true peak:**

```
ffmpeg -hide_banner -i take.wav -af loudnorm=print_format=json -f null -
```

`input_tp` is the true peak and should be at or below -3.0. If `input_i` is above
about -16, the take is hot.

**Send me the raw file either way.** If it fails the spec I would rather measure
it and tell you which section to redo than have you re-record all of it blind. I
will report noise floor, RMS, true peak, clipping count and any detected room
reverb before anything is built on it.

Save it anywhere. It will end up at:

```
docs/growth/voice/reference/constantin-reference-2026-07-31.wav
```

---

## 8. Phonetic coverage, and how it was ensured

A clone reproduces the sounds it heard and approximates the ones it did not. So
the script was checked against the full phoneme inventory of General American
English rather than assumed to cover it by being long enough.

**Method.** Every consonant and vowel phoneme was listed, then a carrier word for
each was located in sections B, C and D, which are the sections that become
training material. Where a phoneme had no carrier, a sentence was rewritten to
introduce one from real product language rather than a nonsense word. Section C
exists only to absorb the phonemes that ordinary product copy does not naturally
contain.

**All 24 consonants, with the carrier word in the script:**

| | | | |
|---|---|---|---|
| /p/ page | /b/ brand | /t/ tells | /d/ day |
| /k/ count | /g/ good | /tʃ/ ChatGPT, church | /dʒ/ judge, engine |
| /f/ find | /v/ visibility, vision | /θ/ three, thinking | /ð/ whether, the |
| /s/ same | /z/ engines, years | /ʃ/ shift, question | /ʒ/ measure, pleasure, vision |
| /h/ how | /m/ most | /n/ never | /ŋ/ ranking, wrong, young |
| /l/ look | /r/ retrieval | /j/ young, usual | /w/ worth, works |

The four that break synthesis most often are covered deliberately and more than
once each: **/ʒ/** in *measure, pleasure, vision, usual*; **/θ/** in *three,
thinking, worth*; **/ð/** in *whether, the, that*; **/ŋ/** in *ranking, wrong,
young, thinking*.

**Vowels and diphthongs**, carried by the closing list in section C, which is
ordered to walk the vowel space rather than to sound natural:

| | | | |
|---|---|---|---|
| /i/ three | /ɪ/ bit, visibility | /eɪ/ page, day | /ɛ/ bed, engine |
| /æ/ bad, brand | /ɑ/ caught, wrong | /ɔ/ tough, about | /oʊ/ boat |
| /ʊ/ book | /u/ boot | /ʌ/ young, tough | /ɜr/ bird, worth |
| /ə/ about | /aɪ/ bite | /aʊ/ about, how | /ɔɪ/ employ |

**Coverage the phoneme table does not capture, and which matters as much:**

- **Consonant clusters**, which are where clones slur: *strongest*, *asked*,
  *thinks*, *engines*, *twelfth* class sequences appear in B and C naturally.
- **The proper nouns**, in section D, both in isolation and inside a sentence.
  Isolation alone teaches the wrong prosody, because a name in a list is stressed
  differently from a name mid-sentence, so both are recorded.
- **Numbers in spoken form**, in section E, because digits are where synthetic
  voices most obviously break and almost every BrandGEO video is numbers.
- **Sentence-final falling intonation**, which the half-second pause instruction
  in section 4 exists to preserve. A clone trained on run-on delivery cannot
  produce a full stop.

**One honest limit.** Coverage was verified by inspection against a phoneme
inventory, not by running a forced aligner over a recording, because no recording
exists yet. Once the take arrives I can align it and report actual realised
coverage, which is the check that would catch a phoneme present in the text but
swallowed in delivery.
