# Storyboard, long-form brand introduction

Shot by shot for `SCRIPT.md`. 6 minutes 20 seconds, 34 shots.

**Format: fully produced, no camera.** Constantin does not appear. Every shot is
one of four kinds:

| Kind | Meaning | Who makes it |
|---|---|---|
| `REC` | Screen recording of the live product or the live site | **Constantin only.** No agent can log in. |
| `MG` | Motion graphic card, built from a script | An agent, with the Pillow renderer |
| `VIZ` | Data visualisation of a measured result | An agent, with the Pillow renderer |
| `STOCK` | Stock footage | **Not used. Zero stock shots in this video.** |

Stock is deliberately absent. A product whose claim is "these are our own
measurements" should not illustrate them with somebody else's footage, and every
frame here is either the real product or a card carrying a real figure.

**Every shot marked `NEW` needs an asset that does not exist yet.** There are 34
shots and 34 are `NEW`, because nothing has ever been built for long-form on this
channel. `ASSETS.md` splits them into what an agent can make and what only
Constantin can.

---

## Visual grammar, applied to every shot

- Canvas `#0a0b0e` on every frame. No white background at any point.
- Text `#e8e9ed`. Accent words `#a78bfa`. `#8b5cf6` is a fill only, never type.
- 1920x1080, 30fps, H.264, `yuv420p`. PNG intermediates, never JPEG.
- Logo lockup is **absent until 1:12** and persistent as a small top-left mark
  after that. Opening on a logo is the thing the skill's hook rule forbids, so
  the cold open carries no brand mark at all.
- Screen recordings are letterboxed onto the canvas, never full-bleed, so the
  product sits inside the brand frame rather than replacing it.
- **Every shot carrying a figure carries its date stamp in the same frame.**
  Bottom-left, Inter Medium 24, `#7d838f`. Not in a lower third that could be
  cropped, and never deferred to the description.

---

## Section 1. Cold open, 0:00 to 0:40

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 1 | 0:00 | `MG` `NEW` | Hard cut from black to full-frame card. `A LAW FIRM THAT DOES NOT EXIST`, Inter ExtraBold 96, centred. | **Frame 0 is the thumbnail source and must be at full opacity.** No fade up. The reel campaign lost an entire cover to a scene-1 fade and it is documented in the campaign brief. |
| 2 | 0:07 | `VIZ` `NEW` | Card splits into three labelled columns: `ChatGPT`, `Gemini`, `REALITY`. The first two each hold an identical firm name rendered as a solid violet block, glyphs suppressed. Third is empty. | **The name is never legible in any frame.** Redaction is a design element, not a blur applied later. Do not render the real string and cover it; do not render it at all. |
| 3 | 0:14 | `VIZ` `NEW` | Columns hold. Date stamp fades up bottom-left: `Collected 2026-07-24 / 5 engines fired / 5 returned usable data`. | Collection health is on screen because it is the thing that makes the anomaly interesting rather than a failed run. |
| 4 | 0:21 | `VIZ` `NEW` | Cut to a second identical column pair sliding in beside the first. Header above the new pair: `DIFFERENT CITY. DIFFERENT CATEGORY.` | The repeat is the payoff. Give the slide 0.6s so the eye registers that the violet blocks are the same width. |
| 5 | 0:30 | `VIZ` `NEW` | Both pairs on screen, thin violet rule connecting them. Caption bottom: `Source: our own published research, 2026-07-24. Firm name withheld.` | "Firm name withheld" is on screen on purpose. It is a fairness signal and it pre-empts the obvious question. |

## Section 2. The turn, 0:40 to 1:12

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 6 | 0:40 | `MG` `NEW` | Loop animation. A person glyph types, an answer block assembles from fragments, the block travels right to a second person glyph. | Abstract glyphs, not illustrated people. The skill's negative prompt list bans stock-photo people and this is the same failure in vector form. |
| 7 | 0:52 | `MG` `NEW` | Same animation with a third element: a panel labelled `YOUR ANALYTICS`, hairline border, permanently empty as the block travels past it. | The panel must not flicker or pulse. Its stillness is the point. |
| 8 | 1:02 | `MG` `NEW` | Hold on the empty panel. Overlay: `THE ANSWER IS THE PRODUCT NOW.` | Last shot before the brand appears. |

## Section 3. What BrandGEO is, 1:12 to 2:08

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 9 | 1:12 | `MG` `NEW` | Logo lockup, centred, held 1.5s, then scales and moves to a persistent top-left mark. | First brand appearance in the video, at 1:12. |
| 10 | 1:20 | `REC` `NEW` | **`app.getbrandgeo.com/ai-visibility`.** Engine cards visible, per-engine result counts populated. | Capture C1 in `ASSETS.md`. Non-admin viewer account preferred. |
| 11 | 1:32 | `REC` `NEW` | Same route, cursor expands one prompt row to reveal the stored response text. | Capture C2. The stored response is the proof that "every answer is stored" is literal. |
| 12 | 1:44 | `MG` `NEW` | Seven engine marks build in sequence: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, Grok. Caption: `Growth PRO and above, as of 2026-07-31.` | **Seven, not five.** `CLAUDE.md` and several campaign docs say five and are stale. Source is `planConfig.ts` `PLAN_ENGINES.growth_pro`. Meta AI does not appear. |
| 13 | 1:56 | `MG` `NEW` | Seventh mark settles. Note below: `Google AI Mode is a tab a user opts into. AI Overviews is the summary on an ordinary results page.` | The two Google surfaces are adjacent so the distinction reads as deliberate rather than a duplicate entry. |

## Section 4. Results, 2:08 to 3:48

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 14 | 2:08 | `MG` `NEW` | Section card: `WHAT THE RECORD SHOWS SO FAR`. | Plain. No motion beyond a 0.3s fade. |
| 15 | 2:16 | `VIZ` `NEW` | Two horizontal bars, violet fill. `Property management` 5 of 5, second city 4 of 5. Date stamp `Collected 2026-07-24. 5 engines.` | Bars are 5-segment, so 5 of 5 reads as full and 4 of 5 as one short. Do not use a percentage. |
| 16 | 2:30 | `VIZ` `NEW` | Two more bars slide in below, each 2 of 5. Label `Individual agents`. Same axis, same segment width. | **Same axis is load-bearing.** The contrast only reads if the four bars share a scale. |
| 17 | 2:42 | `VIZ` `NEW` | All four bars held. Overlay: `COMPANIES CONVERGE. INDIVIDUALS FRAGMENT.` | Cities are not named on screen. Costs nothing and removes a whole class of objection. |
| 18 | 2:54 | `VIZ` `NEW` | Split screen. Left `ASKED IN FRENCH`, right `ASKED IN ENGLISH`. Four anonymised firm blocks each side, one shared, rendered as a connecting line. Date stamp `Collected 2026-07-10. 4 engines that day, a lineup since changed.` | The date stamp carries the correction inline, before the honest-limit card restates it. |
| 19 | 3:08 | `VIZ` `NEW` | One French-side block pulses violet once. Counter appears: `3 of 4 French answers. 0 English answers.` | One pulse, not a loop. |
| 20 | 3:18 | `VIZ` `NEW` | Columns separate horizontally. Overlay: `NOT A REORDER. A DIFFERENT SET.` | |
| 21 | 3:28 | `MG` `NEW` | Plain card, no motion: `That run used four engines, on 2026-07-10. One of them was Meta AI, which we have since retired. The finding keeps the lineup it was measured with.` | **This shot is the fairness proof and must not be cut for time.** It is also the only place Meta AI is named, and it is named as retired. |
| 22 | 3:40 | `VIZ` `NEW` | Return to shot 5's composition, both column pairs. | Reuses shot 5's render. No new asset. |

## Section 5. How it works, 3:48 to 5:06

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 23 | 3:48 | `REC` `NEW` | **`getbrandgeo.com`, free audit form.** A domain is typed into the field, character by character. | Capture C3. **No login needed.** Cheapest and safest shot in the video. Use a domain we own or an obvious placeholder, never a real prospect. |
| 24 | 3:56 | `REC` `NEW` | Same page, the result panel builds: score, per-engine breakdown. | Capture C4. If the live screening run is slow, capture it real and speed-ramp in the edit rather than faking the panel. |
| 25 | 4:06 | `REC` `NEW` | **`app.getbrandgeo.com/welcome`.** The prompt `What do you want to track in AI answers?` with its two fields. | Capture C5. This is a post-signup screen, so it needs an account but not an admin one. |
| 26 | 4:18 | `REC` `NEW` | **`/prompts`.** A prompt is typed and added to the list. | Capture C6. Type a full question, not a keyword, because the narration says exactly that. |
| 27 | 4:30 | `REC` `NEW` | **`/` (Overview)** with populated data. Slow vertical scroll, about 6 seconds. | Capture C7. Needs a tenant with real history. See the data-state warning in `ASSETS.md`. |
| 28 | 4:42 | `MG` `NEW` | Three panels: `1. A DOMAIN` / `2. TWO FIELDS` / `3. YOUR BUYERS' QUESTIONS`. Build left to right. | Recaps the three recordings just shown, so it earns its place instead of padding. |
| 29 | 4:52 | `REC` `NEW` | **`/competitors`.** The competitor view, populated. | Capture C8. |

## Section 6. Fairness, 5:06 to 5:58

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 30 | 5:06 | `MG` `NEW` | Section card: `WHAT WE WILL NOT TELL YOU`. | Deliberately plainer than section 4's card. |
| 31 | 5:14 | `MG` `NEW` | Card 1: `WE CANNOT PROMISE A POSITION.` | |
| 32 | 5:26 | `MG` `NEW` | Card 2: `ONE CHECK IS A SNAPSHOT.` | |
| 33 | 5:38 | `MG` `NEW` | Card 3: `TWO OF OUR ENGINES ARE NEW.` Sub-line: `Grok and Google AI Overviews went live 2026-07-29.` Then all three cards line up together at 5:50. | **No rate, no percentage, no count for either engine.** Grok has 5 rows and AI Overviews 6, from one day. The campaign brief forbids putting a figure from that on screen and it is right to. |

## Section 7. Close, 5:58 to 6:20

| # | Time | Kind | Shot | Notes |
|---|---|---|---|---|
| 34 | 5:58 | `REC` + `MG` `NEW` | Brief return to the audit form, domain typed, submit pressed. Cuts at 6:06 to a full-frame card: `getbrandgeo.com`, logo lockup below, small line `Free tier available. Paid plans from EUR 29 per month.` Lockup holds alone from 6:14. | Reuses capture C3's footage. End-screen elements are placed from 6:12, so the last 8 seconds must carry nothing that a YouTube end-screen card would cover. **Keep the bottom-right and lower-third clear from 6:12.** |

---

## Shots that need an asset that does not exist yet

All 34. Nothing for long-form has ever been built on this channel. Broken down:

- **8 screen recordings, C1 to C8.** Only Constantin can produce these. Full
  capture list with route, data state, viewport and exclusions is in `ASSETS.md`.
- **13 motion-graphic cards.** An agent can build these with the existing Pillow
  renderer at `docs/growth/grok-launch/images/_build/render_launch_images.py`.
- **12 data visualisations.** Same renderer. Shot 22 reuses shot 5, so 12 renders
  cover 13 slots.
- **1 audio bed and the voiceover.** Both open. See `OPEN-QUESTIONS.md`.

## The one shot with a real risk of being unshootable

**Shot 27, the Overview at `/`, needs a tenant with real collection history.**
Every other recording works on a fresh or lightly populated account. This one
does not: a zero-data tenant renders "0% AI VISIBILITY SCORE" across all six
dimensions, which is the documented first-run state, and putting that on screen
in a brand introduction would say the opposite of what the narration says.

If no non-admin account has usable history, the fallback is to cut shot 27 and
extend shot 29 (`/competitors`) by six seconds. The narration line at 4:30 works
over either. Do not stage fake data to fill it.
