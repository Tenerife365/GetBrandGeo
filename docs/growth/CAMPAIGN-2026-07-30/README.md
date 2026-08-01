# BrandGEO campaign package, 2026-07-30

Everything for every channel, in one folder. Media and the exact text that goes
with it live side by side, so nothing has to be assembled at posting time.

Nothing here has been posted, scheduled, or sent. Releasing a batch is your
call, and approving one batch is not approving the next.

---

## Where things are

| Folder | Holds | Text file |
|---|---|---|
| `instagram/reels/` | 9 vertical cuts, silent and scored, plus covers | `POSTS.md` |
| `instagram/feed/` | static feed images | `POSTS.md` |
| `instagram/stories/` | static story frames | `POSTS.md` |
| `facebook/video/` | 9 vertical cuts | `POSTS.md` |
| `facebook/feed/` | static feed images | `POSTS.md` |
| `facebook/link/` | link preview cards | `POSTS.md` |
| `tiktok/video/` | 9 vertical cuts | `../POSTS.md` |
| `youtube/shorts/` | 9 vertical cuts | `POSTS.md` |
| `youtube/thumbnails/` | real 16:9 thumbnails | `README.md` |
| `linkedin/` | feed images and a carousel | `POSTS.md` |
| `x/` | thread and standalone images | `POSTS.md` |
| `threads/` | images | `POSTS.md` |
| `google-business-profile/` | update post images | `POSTS.md` |
| `product/` | per-plan product images for Stripe, GBP and promotion | `COPY.md` |
| `bilingual/` | 4 cities, 8 cuts, two languages each | `POSTS.md` |
| `_shared/` | fonts, logo files, music beds, the binding brief | `BRIEF.md` |

Every `POSTS.md` is keyed to exact filenames and every copy block is fenced, so
it can be copied in one click without picking words out of prose.

---

## The pair: media and its text, same filename

**Every postable asset has a `.txt` file of the same name beside it, holding
exactly the copy that ships with it.** Open one folder, see the pair, upload the
media and paste the whole `.txt`. Nothing has to be looked up while posting.

    facebook/feed/fb-feed-01-description-1440x1800.png
    facebook/feed/fb-feed-01-description-1440x1800.txt

    instagram/reels/20260729-2200-instagram-silent.mp4
    instagram/reels/20260729-2200-instagram-silent.txt

A sidecar holds only what gets pasted. No headings, no counts, no commentary.
Anything that goes into a different field stays in `POSTS.md`: first comments,
alt text, CTA buttons, sticker suggestions.

Suffixes carry the rest: `-p2` to `-p7` are later parts of a chained post in
order, and `-title`, `-tags`, `-name`, `-price` and `-category` are other upload
fields. Each file is one paste into one field.

**`POSTS.md` stays, and none of them were changed.** They carry the reasoning,
the sourcing, the limits on each claim and the posting order, and the sidecars
are cut out of them rather than replacing them. Read `POSTS.md` before a batch
goes out; use the sidecars while it goes out. Each folder has a `PAIRING.md`
saying which is which there.

Assets that deliberately carry no sidecar, being carousel pages, video cover
frames or YouTube thumbnails, are listed with a reason in
`_shared/pairing-exceptions.tsv`. Full contract and the build and check
commands: `_shared/sidecars/README.md`.

    python _shared/check_pairing.py
    python _shared/negative_control_pairing.py

---

## The one rule that governs uploading

**Upload the `-silent.mp4`, not the `-scored.mp4`.**

The silent masters carry no audio stream at all, not a silent one, so the
platform pairs them with its own in-app audio. That is what earns distribution
on Reels, TikTok and Shorts. The scored cuts carry an original music bed and are
for paid placements, embeds and decks, where in-app audio does not exist.

Covers named `-cover.png` are the video's own first frame, not a designed
thumbnail. For YouTube use the files in `youtube/thumbnails/` instead.

---

## What the videos are

Nine hourly runs, each producing one cut per platform, testing six hook drivers.
Runs 1 to 6 walked the drivers once; runs 7 onward are a second, deliberately
different execution of each, so the data can separate "this driver works" from
"that particular cut worked".

`run-<id>` in a filename maps to a run folder under
`docs/growth/reel-campaign-ab/`, whose `RUN.md` records what that hour tested
and what it found. The per-cut `NOTES.md` files are copied in here alongside the
media and hold the sourcing table for every claim on screen.

**A per-cut comparison of run 1 against run 7 is not a like-for-like copy test.**
It confounds driver, copy and visual device together. The interpretable question
is whether both runs of a driver beat the other five drivers.

**Decide which metric judges the cycle before looking at any results.** A
utility asset asks for almost nothing, so it will probably lose on click-through
and win on saves. Picking the metric after seeing the numbers means the winner
is whichever metric was looked at first.

---

## Things that are true and easy to get wrong

**The engine lineup changed the day before this campaign.** Grok and Google AI
Overviews went live 2026-07-29, so Growth PRO and above now monitor seven
engines. `CLAUDE.md` still says five and is stale. Meta AI is retired and is in
no plan set.

**A measurement keeps the denominator it was measured with.** The Madrid and
Paris cuts report a 2026-07-10 run on four engines, one of which was Meta AI,
with ChatGPT's collection failing. That is a fact about that run, not a claim
about today's product. Never restate a historical count as the current lineup.

**Four of the bilingual cuts sit outside the Instagram Reels 20 to 30 second
band.** Rome fits everywhere. Berlin sits exactly on the ceiling at 30.0s.
Madrid at 31.0s and Paris at 33.4s do not, and Paris is the only cut inside
YouTube Shorts' 30 to 45 second target. Comparing Reels numbers city against
city is not apples to apples.

**Some claims on published city pages are known to be wrong and were
deliberately not used.** Several pages assert a program-wide superlative about
themselves, and they contradict each other, so a page asserting a maximum is not
a source for it. `bg-004.html` names a contradictory engine lineup and is
unusable for any engine count. These are open defects on the site, not
style choices here.

---

## What still needs a human

1. **Nothing has been created in Stripe or on Google Business Profile.** The
   `product/` folder holds assets and copy for setting them up. Read its
   `README.md` before touching either.
2. **The LinkedIn carousel needs assembling into a PDF.** LinkedIn document
   posts take PDF, and whether a given PDF renders correctly in their viewer
   cannot be checked from here.
3. **Releasing any batch.** Every asset here is a draft until you say otherwise.
