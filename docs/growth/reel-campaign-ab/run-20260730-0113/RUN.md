# Run 20260730-0113

**Hook driver: #4, contrarian.** "Ranking first in Google does not mean you
exist in an AI answer." Next run advances to #5, concrete proof.

**Music: `tension-minor`** on all four, held constant. The hook is the variable
under test. Note `ATTRIBUTION.md` maps `contrarian-drive` to this exact driver;
three agents saw that and correctly did not use it.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0018 |
| facebook | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0018 |
| tiktok | 33.000s | 33.000s | 0 | 25 to 40 s, yes | 0.0018 |
| youtube | 43.600s | 43.600s | 0 | 30 to 45 s, yes | 0.0017 |

## Measured safe zones

| Platform | Reserves t/b/r | Headroom | Binding |
|---|---|---|---|
| instagram | 220/420/180 | 62 / 55 / 89 | furniture, all three |
| facebook | 220/440/180 | 306 / 68 / 96 | logo declared rect |
| tiktok | 200/360/200 | 56 / 60 / 56 | even |
| youtube | 180/380/180 | 402 / 362 / 123 | right |

**Right margins recovered this run**: YouTube 72px to 123px, Facebook 82px to
96px. Argument lines are cheaper than ratio lines. Driver #5, concrete proof,
reverses this and will be the tightest run of the cycle.

## Every agent independently refused the same number

`bg-004.html` publishes "#1 on three AI engines" out of five. All four agents
reached for it and all four declined it, separately:

- **instagram** replaced "three of five" with "several"
- **youtube** used only the Gemini leg, the one engine it could name correctly
- **facebook** stated no denominator at all
- **tiktok** ran both counts denominator-free and did not name the zero engine

Reason, found independently each time: bg-004's methodology names Meta AI as its
fifth engine while its body names Microsoft Copilot as one of the three. Copilot
is on no purchasable plan and Meta AI is retired, so the engine set cannot be
stated correctly at all. Putting "3 of 5" beside a scene listing today's five
would attach the wrong lineup, which is the fault that ruled out `bg-016` in
run 3.

**tiktok found the exception and used it**: `ai-visibility-for-chicago.html`,
2026-07-24, ran Google AI Mode in place of retired Meta AI and all five engines
returned data, so its 5 of 5 has a genuinely verified denominator. That is the
difference between a number you can show and a number you cannot.

## Two rules of mine were wrong and are now fixed

**"Never name a real third-party brand" was imprecise.** Facebook flagged that
"Google" appears on screen and supplied a revert rather than deciding alone. But
every cut in this campaign names ChatGPT, Gemini, Claude and Perplexity by
design, so a blanket ban would forbid the product from describing itself. The
rule now distinguishes the ENGINE OR PLATFORM being measured, which is allowed,
from the SUBJECT of a measurement, which is not. Test: if the name were removed,
would the claim still stand? Ruled the Facebook cut correct as rendered.

**"Trace to a published bg page" had a loophole.** `bg-005.html` publishes a 48%
AI Overviews figure and a 93% zero-click figure that are third-party, inside a
page that is otherwise ours. Both PASS that test while tracing to no BrandGEO
measurement. Three agents declined them anyway. The check now runs on the
FIGURE, not the page it sits in.

## Two new rendering traps

**`color=black@0.0` does not survive format negotiation, and fails totally and
silently.** The lavfi source drops its alpha and lands opaque, so `format=rgba`
fills alpha with 255 and every text layer ships as a full-frame black rectangle
over the background. Exit 0, no warning, black video. No pixel threshold or
control diff can catch it because the frame genuinely is that colour; only the
layer-alpha pass found it. Fix: `format=rgba,colorchannelmixer=aa=0` plus
`-update 1 -pix_fmt rgba` on the PNG write.

**A flat-canvas diff is unusable on any design with glow or dither.** On
instagram's build it returns the entire frame, `x 0..1079 y 0..1919`, and so
does the text-free control with nothing drawn on it. Almost no pixel equals the
nominal canvas value. Diff only against a control through the identical
pipeline. tiktok confirmed the same control cancels run 3's yuv420p row-0 chroma
artefact exactly: residual noise in its known-empty band is 0.

## Content defect found, filed, not fixed here

`bg-004.html` claims "5 AI engines" while naming six across the page: Gemini,
Perplexity, ChatGPT, Claude, Copilot, Meta AI. It also presents Meta AI in the
present tense as an engine we run today. Second research page with an internal
contradiction after `bg-016`'s four-versus-six cities. Filed as a task, with an
explicit instruction NOT to falsify the record by deleting engines that really
were in that run: state the lineup accurately and date it.

An agent that spawned a duplicate chip for the same file withdrew it rather than
risk two sessions editing `bg-004.html` at once.

## Previous run verification, 20260730-0013

All four in band, silent masters at zero audio streams, scored cuts at one with
matching durations, all scored starts 0.0018 to 0.0019, covers and NOTES present.
No dashes, no Grok or AI Overviews percentage. One banned-word hit was a wrapped
compliance checklist, a false positive, left as written.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
