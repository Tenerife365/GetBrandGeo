# Assets, long-form brand introduction

Everything needed to render `SCRIPT.md` against `STORYBOARD.md`. Three lists:
what already exists, what an agent must generate, and what only Constantin can
produce.

Nothing here has been rendered, posted, scheduled or uploaded.

---

## 1. Assets that already exist

Paths are absolute from the repo root unless shown as relative to this folder.

| Asset | Path | Use |
|---|---|---|
| Inter Regular, Medium, SemiBold, Bold, ExtraBold | `docs/growth/CAMPAIGN-2026-07-30/_shared/fonts/` | Every card. Inter is not a system font on this machine, so do not substitute and do not download. |
| Logo mark, wordmark, lockup, all transparent | `docs/growth/CAMPAIGN-2026-07-30/_shared/logo/` | Shot 9, the persistent top-left mark, and the end card. **Source raster tops out at 1033px wide for the lockup and 567px tall for the mark. Do not upscale past that.** |
| Card renderer, Pillow only | `docs/growth/grok-launch/images/_build/render_launch_images.py` | Base for every `MG` and `VIZ` render. 8x supersampled masks, Lanczos downsample. It already solves antialiasing and text metrics. Read it before writing a new one. |
| Thumbnail renderer with legibility assertions | `docs/growth/CAMPAIGN-2026-07-30/google-business-profile/_build/render_gbp_and_thumbnails.py` | Base for the 1280x720 thumbnail. It already asserts cap height in shelf pixels and luminance spread, which is what stops a too-small headline shipping. |
| Colour tokens, measured contrast ratios | `docs/growth/CAMPAIGN-2026-07-30/_shared/BRIEF.md` section 5 | All type colour decisions. |
| BrandGEO-composed music tracks | `assets/audio/music/`, catalogued in `assets/audio/ATTRIBUTION.md` | Candidate bed. We authored them, so they are licence-clean anywhere. See the warning in list 2. |
| Nine existing Shorts and their thumbnails | `../shorts/`, `../thumbnails/` | Not used in this video. Listed so nobody rebuilds a card that already exists. |
| Source research pages | `brandgeo/web/ai-visibility-for-{chicago,boston,houston,paris}.html` | The four pages every figure traces to. Read-only. |

**Nothing usable as-is.** Every existing asset is an input to a render, not a
frame. There is no long-form footage, no card, no bed and no voice track in the
repo today.

---

## 2. Assets that must be generated

An agent can make all of these. None needs credentials.

### 2.1 Motion-graphic and data cards, 25 renders covering 26 shots

| Render | Shots | Content | Notes |
|---|---|---|---|
| `01-cold-open` | 1 | `A LAW FIRM THAT DOES NOT EXIST` | **Frame 0 at full opacity, no fade.** This frame is the thumbnail source. |
| `02-columns-a` | 2 | Three columns, two redacted violet blocks, one empty `REALITY` | **Never render the real firm name.** Draw a filled rounded rect at the measured width of a plausible name. Do not render then cover. |
| `03-columns-a-dated` | 3 | Same, plus `Collected 2026-07-24 / 5 engines fired / 5 returned usable data` | |
| `04-columns-b` | 4 | Second pair sliding in, header `DIFFERENT CITY. DIFFERENT CATEGORY.` | |
| `05-columns-both` | 5, 22 | Both pairs, violet connecting rule, caption `Source: our own published research, 2026-07-24. Firm name withheld.` | One render, used twice. |
| `06-answer-travel` | 6 | Person glyph, answer assembling, travelling right | Abstract glyphs. No illustrated humans. |
| `07-empty-analytics` | 7 | Same plus permanently empty `YOUR ANALYTICS` panel | |
| `08-answer-is-product` | 8 | `THE ANSWER IS THE PRODUCT NOW.` | |
| `09-logo-reveal` | 9 | Lockup centred, then scaling to top-left | First brand appearance at 1:12. |
| `10-seven-engines` | 12 | Seven marks in sequence, caption `Growth PRO and above, as of 2026-07-31.` | **Seven. Verify against `planConfig.ts` `PLAN_ENGINES.growth_pro` before rendering.** No Meta AI. |
| `11-two-google-surfaces` | 13 | The AI Mode versus AI Overviews note | |
| `12-section-record` | 14 | `WHAT THE RECORD SHOWS SO FAR` | |
| `13-bars-companies` | 15 | Two 5-segment bars, 5 of 5 and 4 of 5, dated | Segments, not percentages. |
| `14-bars-all-four` | 16 | Plus two 2 of 5 bars, same axis | Shared axis is load-bearing. |
| `15-converge-fragment` | 17 | `COMPANIES CONVERGE. INDIVIDUALS FRAGMENT.` over the bars | No city named. |
| `16-language-split` | 18 | French / English split, four anonymised blocks each side, one connector, dated `Collected 2026-07-10. 4 engines that day, a lineup since changed.` | |
| `17-language-counter` | 19 | One block pulses, `3 of 4 French answers. 0 English answers.` | |
| `18-not-a-reorder` | 20 | `NOT A REORDER. A DIFFERENT SET.` | |
| `19-honest-limit` | 21 | The four-engine, Meta-retired correction card | **Do not cut this for runtime.** |
| `20-three-steps` | 28 | `1. A DOMAIN` / `2. TWO FIELDS` / `3. YOUR BUYERS' QUESTIONS` | |
| `21-section-fairness` | 30 | `WHAT WE WILL NOT TELL YOU` | |
| `22-no-promise` | 31 | `WE CANNOT PROMISE A POSITION.` | |
| `23-snapshot` | 32 | `ONE CHECK IS A SNAPSHOT.` | |
| `24-engines-new` | 33 | `TWO OF OUR ENGINES ARE NEW.` plus `Grok and Google AI Overviews went live 2026-07-29.` | **No rate, no count, no percentage for either engine.** |
| `25-end-card` | 34 | `getbrandgeo.com`, lockup, `Free tier available. Paid plans from EUR 29 per month.` | Keep bottom-right and lower-third clear from 6:12 for end-screen elements. |

**Renderer constraints inherited from the campaign, all of which cost somebody a
rebuild already:**

- PNG intermediates, never JPEG. JPEG forces `yuvj420p` and the colour shifts.
- `drawbox` on an RGBA source needs `replace=1` or it renders at alpha 0 and
  vanishes with no error.
- `color=black@0.0` does not survive format negotiation. Use
  `format=rgba,colorchannelmixer=aa=0`, and `-update 1 -pix_fmt rgba` on any PNG
  write.
- `overlay` rounds an odd `y` down to even on `yuv420p`. Compute declared rects
  from the effective even y.
- `drawbox` cannot animate. Draw N static boxes gated by `enable` and verify
  movement on the delivered file.
- Build the timeline as a numbered frame sequence at `-framerate 30`, not with
  `ffconcat`, which drifts on cumulative float durations.
- Probe the delivered file for duration and stream count. A mux can exit 0 and be
  unreadable.

### 2.2 Thumbnail

- **Spec:** 1280x720, PNG, under 2 MB, `#0a0b0e` canvas.
- **Headline:** `A FIRM THAT DOES NOT EXIST`. Six words, within the three to five
  word working ceiling used on the nine Shorts thumbnails once the two articles
  are discounted. Traces verbatim to shot 1.
- **No figure on it.** Not `5 of 5`, not `7 engines`, not a date. A figure needs
  its denominator, date and scope in the same breath and a thumbnail has no room.
  None of the nine existing thumbnails carries a digit and this one should not
  either.
- **No engine count on it,** for the same reason the Shorts thumbnails carry
  none: these findings were collected against five engines and the product now
  monitors seven.
- **Measure, do not eyeball.** Reuse the two assertions already in
  `render_gbp_and_thumbnails.py`: cap height in shelf pixels at 210px wide, floor
  about 10px, and luminance spread across the headline band after Lanczos, floor
  60/255. A long-form thumbnail is seen larger than a Shorts thumbnail, so the
  headline can be bigger than the existing set, not smaller.
- Logo lockup bottom-left, clear space at least the mark's own height on every
  side.

### 2.3 Audio bed

**Open, and do not assume the existing tracks work here.** The nine Shorts run
`tension-minor` at 27 to 44 seconds. This video is 380 seconds. A 30-second loop
run thirteen times will be audible as a loop and will fight a voiceover, which
none of the Shorts had.

Three options, in preference order:

1. Compose a new long-form bed, original, in the same idiom. Same licensing
   position as the existing tracks: we author it, so it is clean anywhere.
2. Extend `tension-minor` with real variation rather than looping it.
3. Ship with no bed. A voiceover-led product video with no music is a legitimate
   choice and it is what several measurement products do.

Whatever ships, normalise two-pass `loudnorm` to `-16 LUFS` integrated,
`-1.5 dBTP`. Single-pass undershoots by about 0.9 LU. Fade the music **in** as
well as out, `afade=t=in:st=0:d=0.08`; the tracks do not start at zero and
cutting in at sample 0 clicks.

**Duck the bed under the voice.** Every Shorts cut carried text alone, so no
ducking pass exists in this campaign to copy.

---

## 3. Assets that require Constantin

Eight screen recordings. **No agent can produce any of these**, because logging
in is his standing ruling and none of these routes is public except C3 and C4.

### Standing rules for every capture

- **Viewport 1920x1080 exactly.** Set the browser window, not the screen. A
  1512-wide capture upscaled to 1080p is visibly soft on a 6-minute video.
- **Browser chrome cropped out in the edit**, so leave a clean margin. Do not
  use full-screen mode; the sidebar layout changes between 768 and 810px and it
  is easy to land in an awkward state.
- **Dark mode.** It is the default, so this is a check, not an action. If any
  capture comes back light-themed, stop and re-record: light mode is documented
  as unaudited and it will not match a single frame of the rest of this video.
- **30fps or 60fps. Do not record at 24.**
- **Mouse movement slow and deliberate.** Move, pause half a second, then click.
  Fast cursor movement is unusable at 6 minutes.
- **Nothing else on screen.** No notification banners, no other tabs' titles, no
  bookmarks bar, no clock showing a personal calendar.

### What must NOT be visible in any frame

This list is the reason these cannot be delegated and it applies to all eight.

- **Any real customer or client name.** Not in a client switcher, not in a
  dropdown, not in a page title, not in a browser tab title.
- **Any real email address.** Not the logged-in account's, not a client's.
- **Any real company found inside a result set.** The competitor and mention
  views render measured subjects by design, which is exactly what campaign copy
  is not allowed to name. See the per-capture note on C8.
- **Any admin-only surface.** No Usage, no Onboard, no Promotions, no client
  switcher, no "view as user" control, no Tickets.
- **Any URL bar showing a token.** `/audit/:token` in particular.

### The capture list

**Non-admin is preferred wherever it is possible, and it is possible for seven
of the eight.** A viewer account shows no client switcher, no admin nav and no
cross-tenant data, which removes most of the exclusion list above at the source
rather than in the edit. It is also fewer things for him to watch while
recording.

| # | Shot | Route | Account | Data state needed | Duration | Specific exclusions |
|---|---|---|---|---|---|---|
| **C1** | 10 | `app.getbrandgeo.com/ai-visibility` | **Viewer, not admin** | Engine cards populated, per-engine counts non-zero | 14 s | No client switcher in frame. If an admin account is used, the switcher sits in the header and must be cropped. |
| **C2** | 11 | `app.getbrandgeo.com/ai-visibility` | **Viewer** | Same, plus at least one prompt row with a stored response long enough to fill the panel | 14 s | The stored response text is a real AI answer and **may name real companies.** Choose a row whose visible text names none, or frame so the body text is soft. Check the frame before moving on. |
| **C3** | 23, 34 | `getbrandgeo.com`, audit form | **Logged out** | None | 10 s | Type a domain we own or an obvious placeholder. **Never a real prospect's domain.** |
| **C4** | 24 | `getbrandgeo.com`, audit result panel | **Logged out** | The screening run completing | 20 s raw | Capture the real run even if slow, then speed-ramp in the edit. Do not mock the panel. Same domain as C3. |
| **C5** | 25 | `app.getbrandgeo.com/welcome` | **A fresh non-admin account** | Pre-fill state, both fields empty | 12 s | This screen appears once per account. If it has been passed, a new throwaway account is the cheapest way to get it back. |
| **C6** | 26 | `app.getbrandgeo.com/prompts` | **Viewer** | Existing prompts listed, one being added | 14 s | Type a full buyer question, not a keyword, because the narration says exactly that. Nothing naming a real client. |
| **C7** | 27 | `app.getbrandgeo.com/` (Overview) | **Viewer** | **Real collection history.** See the warning below. | 12 s, slow scroll | Not a zero-data tenant. |
| **C8** | 29 | `app.getbrandgeo.com/competitors` | **Viewer** | Populated competitor view | 12 s | **This view renders measured subjects by name by design.** Either pick a tenant whose competitor set names nobody identifiable, or frame tight enough that names are not legible, or treat this capture as optional and cut shot 29. Flag it rather than shipping a legible name. |

### The one capture that may be impossible, and what to do

**C7.** A zero-data tenant renders "0% AI VISIBILITY SCORE" across all six
dimensions on the Overview. If no viewer account has real history, that is the
frame, and it says the opposite of what the narration says over it.

**Do not stage data to fix this.** The fallback is written into the storyboard:
cut shot 27 and extend shot 29 by six seconds. The narration line at 4:30 works
over either, and the video loses nothing an audience would notice.

---

## 4. Publishing metadata

Drafts. Nothing has been uploaded or scheduled.

### Title

```text
Two AI engines invented the same company. We have the dates.
```

Sixty characters. It states a result rather than a promise, it carries the
video's actual opening, and it makes no claim about the viewer's own visibility,
which is the fault that had to be corrected in two of the nine Shorts titles.

Rejected alternatives and why, so they are not re-proposed:

- `How BrandGEO works` states nothing and would earn nothing.
- `We monitor 7 AI engines so you do not have to` is a feature line a competitor
  can write tonight with a find-and-replace.
- Anything opening `Is your brand invisible in AI?` breaks the no-rhetorical-
  question rule and guesses at the viewer's numbers.

### Description

Timestamps assume the 6:20 cut. **Re-check every one against the delivered file
before this is pasted anywhere.**

```text
On 24 July 2026 we ran a set of buyer questions at five AI engines. Two of them
returned the name of a law firm that does not exist. Then, in a different city
and a different practice area, the same two engines returned the same invented
name again.

We published both results as they came back rather than correcting them
quietly, because an engine confidently inventing a company is a more useful
thing to know than a clean dataset.

This video is an introduction to BrandGEO: what it measures, how it is set up,
and three findings from our own published research. It also lists three things
the product does not do, because you would find them out anyway.

Chapters
0:00 A firm that does not exist
0:40 Why you never see the answer
1:12 What BrandGEO measures
2:08 Finding one, companies converge and individuals fragment
2:54 Finding two, the language changes the shortlist
3:48 Setting it up
5:06 What we will not tell you
5:58 Run it on your own domain

Every figure in this video carries its collection date and its denominator on
screen. The engine lineup differs between findings because it differs between
collection dates, and each finding keeps the lineup it was measured with.

Start a free audit: https://getbrandgeo.com

The research these findings come from:
https://getbrandgeo.com/ai-visibility-for-chicago.html
https://getbrandgeo.com/ai-visibility-for-boston.html
https://getbrandgeo.com/ai-visibility-for-houston.html
https://getbrandgeo.com/ai-visibility-for-paris.html
```

Two deliberate omissions. **No hashtag run**, because the description is written
for a person who paused on the video, which is the convention already set in
`../shorts/POSTS.md`. **No firm name**, in the description as well as on screen;
the linked pages carry it, which is the correct place for a record.

### Tags

Tag field, not the description. Four:

```text
generative engine optimization
AI search visibility
brand monitoring
LLM SEO
```

### End screen

YouTube end-screen elements need the last 5 to 20 seconds. Place them at **6:12**,
leaving 8 seconds.

| Element | Content | Position |
|---|---|---|
| Link | `getbrandgeo.com`, labelled `Run a free audit` | Left |
| Video | Best-performing Short, or "most recent upload" if nothing has data yet | Upper right |
| Subscribe | Channel mark | Lower right |

**Nothing has performance data**, since nothing on this channel has been posted.
So the video slot should be set to "most recent upload" rather than pinned to a
chosen Short, and revisited once there is a week of real data.

**The card layout constrains shot 34.** Keep the bottom-right and the lower third
of the frame clear from 6:12 onward, or the end-screen cards will sit on top of
the wordmark.

### Other upload settings

- **Not made for kids.**
- **Category:** Science and Technology.
- **Language:** English. No auto-dub for this cut. The Paris finding is about
  language changing the answer, and an auto-dubbed track discussing that is a bad
  look.
- **Captions:** upload a real `.srt` from the narration text rather than relying
  on auto-captions. The narration is already written out continuously in
  `SCRIPT.md`, so this is a timing pass and nothing more. Engine names and the
  dates are exactly what auto-captioning gets wrong.
- **Visibility:** the upload itself is Constantin's call and is not made here.
