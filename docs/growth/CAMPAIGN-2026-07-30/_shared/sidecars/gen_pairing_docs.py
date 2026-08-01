# -*- coding: utf-8 -*-
"""Writes a PAIRING.md into every channel folder.

Each one says the same three things in the folder's own terms: what the pair
is, what stays in POSTS.md, and what in that folder deliberately has no
sidecar.
"""

import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

HEAD = """# How the .txt files pair with the media

Every postable asset in this folder has a `.txt` file of the same name beside
it. Open the pair, upload the media, paste the whole `.txt`. Nothing has to be
looked up at posting time.

**A sidecar holds only what gets posted.** No headings, no character counts, no
"post 3 of 4". Select all, copy, paste, done.

**`POSTS.md` is still the source and it has not been touched.** It carries the
reasoning, the sourcing table, the limits on each claim, the counts and the
posting order. The sidecars are a convenience layer cut out of it, not a
replacement for it. Read `POSTS.md` before a batch goes out; use the sidecars
while it goes out.

"""

TAIL = """
---

## Checking it

From the campaign root:

    python _shared/check_pairing.py
    python _shared/negative_control_pairing.py

The first proves every asset has its text and every text has its asset, that
each sidecar is inside its platform's limit counted in that platform's own
unit, and that every paragraph of every sidecar appears verbatim in the source
document above, so no sidecar can carry copy that was invented here. The second
injects each of those defects one at a time and requires the check to go red
before any clean result is believed.

Nothing in this folder has been posted, scheduled or sent.
"""

FOLDERS = {

"x": """## The naming

    x-thread-a-firm-that-does-not-exist-1600x900.png     the image
    x-thread-a-firm-that-does-not-exist-1600x900.txt     post 1, the one the image goes on
    x-thread-a-firm-that-does-not-exist-1600x900-p2.txt  post 2
    ...                                                  through -p7

Images are in `images/`. A thread is one image and seven posts, so the image
carries post 1 and `-p2` to `-p7` are the rest of the chain in order. Post the
`.txt` first with the image attached, then reply with `-p2`, and so on.

The two standalones are a single image and a single `.txt` each.

## Limits

Every one of the sixteen is measured against X's 280, with any URL counted as
23 characters the way X transforms it. All sixteen pass, and the measured
numbers reproduce the table `POSTS.md` publishes exactly.

## Stays in POSTS.md

The sourcing table, the seven restraints and the character-count table. None of
it is pasted anywhere.
""",

"threads": """## The naming

    images/threads-1-companies-converge-1080x1350.png     the image
    images/threads-1-companies-converge-1080x1350.txt     part 1a, the one the image goes on
    images/threads-1-companies-converge-1080x1350-p2.txt  part 1b

Posts 1 to 4 each exceed the 500 character cap and cannot be posted as single
posts, so `POSTS.md` splits them at a paragraph boundary into a chain. **One
sidecar per part.** Post the `.txt` with the image attached, press **+**, paste
`-p2`, and post the chain. Post 2 needs three parts, `-p2` and `-p3`.

**The image goes on the first part only.**

## Limits

All nine parts are measured as UTF-8 bytes against the 500 cap, which is the
unit Threads counts. Every part is pure ASCII, so bytes and characters agree,
and the measured numbers reproduce the table in `POSTS.md` exactly. The tightest
are 2b at 480 and 4a at 474. Do not paste either through an editor that turns a
straight apostrophe into a curly one: one U+2019 costs 3 bytes instead of 1.

## What has no sidecar here, and it is ten posts

`POSTS.md` posts **P5 to P14** are the account-launch set and have no asset in
this folder:

- P5, P6, P7, P8, P10, P13 are text only by design, several of them explicitly
  so, and need no pairing.
- P9 and P13 are marked `[NEEDS ASSET]` in `POSTS.md`. Still true.
- P11, P12 and P14 reuse an image owned by another channel
  (`instagram/feed/feed-04`, `linkedin/feed/li-03`, `linkedin/feed/li-02`).
  Those files already carry their own channel's caption, and a second, different
  caption cannot live on the same filename. Copy P11, P12 and P14 out of
  `POSTS.md` at posting time.

This is a gap in the assets, not in the pairing, and it is left visible rather
than papered over.
""",

"linkedin": """## The naming

    feed/li-01-same-wrong-name-1200x1200.png   the image
    feed/li-01-same-wrong-name-1200x1200.txt   the post

Posts 1, 2 and 3 are one image and one post each.

## Post 4 has two alternate media and one caption

Post 4 is the eight slide carousel in `carousel/`, with
`feed/li-04-what-five-of-five-counts-1200x1200.png` as a square fallback single
for a later repost. **Use one or the other, never both on the same post.**

The same caption therefore sits beside both:

    carousel/li-c-01-1080x1350.txt
    feed/li-04-what-five-of-five-counts-1200x1200.txt

`li-c-02` through `li-c-08` are pages 2 to 8 of one document post, not eight
posts, so they carry no caption. They are listed in
`_shared/pairing-exceptions.tsv` with that reason.

**The carousel still has to be assembled into a PDF** before it can be
uploaded, pages in filename order at 1080x1350. That has not been done and
`POSTS.md` explains why it cannot be verified from here.

## Stays in POSTS.md

The per-image format reasoning, the pre-fold character counts, the verbatim
slide-text table, the findings that were rejected, and the compliance notes.
""",

"google-business-profile": """## The naming

    gbp-1-free-audit-1200x900.png   the image
    gbp-1-free-audit-1200x900.txt   the post body

One image, one post, four of them.

The bodies are stored as a blockquote in `POSTS.md` because that is a markdown
file. The sidecars carry the same words with the `>` markers and the line
wrapping removed, because a composer would render both.

## Stays in POSTS.md

**The CTA button, and it is required.** Each post needs a button type and a
destination URL picked in the Google interface, which is a dropdown rather than
a paste, so it is not in the sidecar:

| Post | Button | Destination |
|---|---|---|
| 1 | Learn more | `https://getbrandgeo.com` |
| 2 | Sign up | `https://app.getbrandgeo.com/signup` |
| 3 | Learn more | `https://getbrandgeo.com` |
| 4 | Sign up | `https://app.getbrandgeo.com/signup` |

Also the product-truth source table, the crop-safe-area geometry, and the note
that two images live on the profile right now still advertising Meta AI.
""",

"instagram/feed": """## The naming

    feed-02-converge-fragment.png   the image
    feed-02-converge-fragment.txt   the caption, with the hashtags under it

Each sidecar is the caption then a blank line then the hashtags, which is one
paste into the caption box.

`POSTS.md` keeps caption and hashtags as separate blocks so the hashtags can be
moved into the first comment instead. If you are testing that, delete the last
line after pasting.

## Post 1 is a carousel

Upload `feed-01-invented-name-s1.png` through `-s4.png` in filename order. The
caption sits on `feed-01-invented-name-s1.txt`. Slides 2 to 4 are pages of one
post and carry no caption of their own; they are listed in
`_shared/pairing-exceptions.tsv`.

## Stays in POSTS.md

**The first comment and the alt text**, because each goes into a different
field at a different moment, and pasting either into the caption box would be
wrong. Also the posting order, which is 4, then 2, then 3, then 1.
""",

"instagram/stories": """## The naming

    story-01-invented-name.png   the frame
    story-01-invented-name.txt   the link sticker URL

**A story has no caption box, so the sidecar holds the one thing you paste.**
The headline is already drawn on the frame, and `POSTS.md` records that the
hashtag sticker is optional and costs nothing to skip. What is left is the link
sticker URL, which is what each `.txt` contains.

Put the sticker in the empty band directly under the violet `getbrandgeo.com`
pill, not on the pill.

## Stays in POSTS.md

The line already drawn on each frame, repeated there for reference, the optional
hashtag sticker text, the alt text, and the safe-zone geometry.

## Order

Post each story after its feed post is live. A story pointing at a post that
does not exist yet spends the reach for nothing.
""",

"instagram/reels": """## The naming

    20260729-2200-instagram-silent.mp4   upload this one
    20260729-2200-instagram-silent.txt   the caption, with the hashtags under it
    20260729-2200-instagram-scored.mp4   paid, embeds and decks
    20260729-2200-instagram-scored.txt   the same caption

**The silent and scored files are two masters of one post, so the same caption
sits beside both.** That is a deliberate call, not a duplication: the copy does
not change with the audio, and having it beside the scored master means an
embed or a paid placement does not have to come back here for it.

**Upload the `-silent.mp4` for anything organic.** It carries no audio stream at
all, so Instagram pairs it with its own in-app audio, which is what earns the
distribution.

`-cover.png` is frame 0 of the master. It is a cover picked inside the app
rather than a post, so it has no sidecar and is listed in
`_shared/pairing-exceptions.tsv`.

## Stays in POSTS.md

**The first comment and the alt text**, which go into different fields. Also the
hook driver behind each cut and the A/B spacing rule, which is that the two
passes of one driver must not be posted close together.
""",

"facebook/feed": """## The naming

    fb-feed-01-description-1440x1800.png   the image
    fb-feed-01-description-1440x1800.txt   the post body

Upload the PNG as a feed photo post and paste the whole `.txt` under it.

The bodies in `POSTS.md` are hard wrapped at 78 columns because that is a
markdown file. The sidecars carry the same words unwrapped, since those breaks
would be real line breaks in a composer. Paragraph breaks are kept.

## Stays in POSTS.md

The alt text, which is a separate field, plus the finding and source behind each
image, the mechanism table, the findings that were rejected, and the whole
verification section, which covers this folder and `../link/` together.

If you shorten a body, cut from the middle. The last line before the URL is the
only line doing CTA work, and the first sentence is written to stand alone under
Facebook's 125 character truncation.
""",

"facebook/link": """## The naming

    fb-link-01-description-1200x630.png   the card
    fb-link-01-description-1200x630.txt   the post body

These are `og:image` cards, not feed images. Each belongs to one
`getbrandgeo.com` URL, named under its filename in `POSTS.md`. Set it as that
page's `og:image` and `twitter:image`, and paste the matching `.txt` as the link
post. The URL sits on its own line at the end of the body, so Facebook renders
the preview from the post itself and there is no first-comment trick to run.

## Stays in POSTS.md

The alt text, the destination URL and the reasoning for it, which feed image
each card pairs with, and the destination checks run on 2026-07-30.
""",

"facebook/video": """## The naming

    20260729-2200-facebook-silent.mp4   upload this one
    20260729-2200-facebook-silent.txt   the post body
    20260729-2200-facebook-scored.mp4   paid, embeds and decks
    20260729-2200-facebook-scored.txt   the same body

**Silent and scored are two masters of one post, so the same body sits beside
both.** Upload the `-silent.mp4` for anything organic and pick a track from
Facebook's own library at upload.

`-cover.png` is frame 0 of the master, a cover rather than a post, so it has no
sidecar and is listed in `_shared/pairing-exceptions.tsv`.

## Stays in POSTS.md

The hook driver and the argument behind each cut. Every body already ends with
its own URL on its own line, so nothing else is needed at posting time.
""",

"tiktok": """## The naming

    video/20260729-2200-tiktok-silent.mp4   upload this one
    video/20260729-2200-tiktok-silent.txt   the caption, hashtags included
    video/20260729-2200-tiktok-scored.mp4   paid, embeds and decks
    video/20260729-2200-tiktok-scored.txt   the same caption

**Silent and scored are two masters of one post, so the same caption sits beside
both.** Upload the `-silent.mp4`, every time. It has zero audio streams, and
in-app audio is a ranking input on TikTok, so a self-supplied track competes
with distribution rather than helping it.

The hashtags are inside the caption and are counted in it. Every caption is 68
to 76 characters including them, which keeps the bottom inset valid. A long
TikTok caption pushes text over the video.

**The copy for this folder lives one level up, in `../POSTS.md`**, which is
where it was written. `-cover.png` is frame 0 and has no sidecar, listed in
`_shared/pairing-exceptions.tsv`.

## Stays in POSTS.md

The optional on-screen text sticker suggestions, which are added in-app and are
not part of the caption, the hook driver per cut, and the three cuts whose
on-screen claim could not be closed from their NOTES alone.
""",

"youtube/shorts": """## The naming

A YouTube upload has three text fields, so a Short has three sidecars:

    20260729-2200-youtube-silent.mp4         upload this one
    20260729-2200-youtube-silent.txt         the description
    20260729-2200-youtube-silent-title.txt   the title
    20260729-2200-youtube-silent-tags.txt    the tag field, comma separated
    20260729-2200-youtube-scored.mp4         paid, embeds and decks
    20260729-2200-youtube-scored.txt         the same description

Each file is one paste into one field.

**`-title` and `-tags` sit beside the silent master only**, because that is the
file that gets uploaded. The scored master carries the description and nothing
that would read as an instruction to upload it.

## Do not use `-cover.png` as the thumbnail

It is frame 0 of the master: 1080x1920, carrying a full sentence, and a grey
smear at shelf size. The real custom thumbnails are in `../thumbnails/`, one per
Short, matched by timestamp. Both the covers and the thumbnails are listed in
`_shared/pairing-exceptions.tsv`.

## Stays in POSTS.md

The hook driver per cut, and the record of which drafted title and description
was kept, trimmed or replaced and why. That record is the reasoning behind the
copy, not the copy.
""",

"youtube/thumbnails": """# How the .txt files pair with the media

**There are none in this folder, deliberately.**

These nine 1280x720 files are custom thumbnails. A thumbnail is an upload field
of a Short, not a post of its own, so it has no caption to pair with. Each one
is listed in `_shared/pairing-exceptions.tsv` with that reason.

The text that ships with each of these is beside the Short it belongs to, in
`../shorts/`, matched on the timestamp in the filename:

    thumb-20260729-2200-youtube-1280x720.png   this thumbnail
    ../shorts/20260729-2200-youtube-silent.txt        the description
    ../shorts/20260729-2200-youtube-silent-title.txt  the title
    ../shorts/20260729-2200-youtube-silent-tags.txt   the tags

`README.md` in this folder stays as it is. It carries the mapping table, the
210 pixel shelf legibility measurements and the reason no thumbnail here
carries a figure or an engine count.

Nothing in this folder has been posted, scheduled or sent.
""",

"bilingual": """## The naming

    berlin/berlin-de-silent.mp4   upload this one
    berlin/berlin-de-silent.txt   the caption in that cut's language, hashtags included
    berlin/berlin-de-scored.mp4   paid, embeds and decks
    berlin/berlin-de-scored.txt   the same caption

**Silent and scored are two masters of one post, so the same caption sits beside
both.** Eight cuts across four cities, two languages each, and **the caption is
in the language of its cut**. The German cut gets the German caption. They are
not translations of each other; each was written in its own language.

`-cover.png` is frame 0 of the master and is verified byte-identical to it, so
it is a cover rather than a post. No sidecar, listed in
`_shared/pairing-exceptions.tsv`.

**Accented characters in these sidecars are correct.** Only the five dash
codepoints are banned. Do not let an editor normalise them away.

## Stays in POSTS.md

The eight constraints that make this copy true, and they are the most important
prose in the campaign: all four cities are ONE collection on 2026-07-10 across
FOUR engines, one of which is now retired and one of which failed to collect.
Also the per-figure sourcing, the scene-by-scene description of each cut, the
duration-versus-platform fit per city, and the compliance scan.

**Read the constraints before reusing a single line of this anywhere else.**

## Where each cut fits

Duration decides it and it differs by city, so this is in `POSTS.md` per cut
rather than in a sidecar. Rome fits everywhere. Berlin sits exactly on the Reels
ceiling. Madrid and Paris sit outside it, and Paris is the only cut inside the
YouTube Shorts target.
""",

"product": """## The naming

These are catalogue images rather than social posts, so each one pairs with the
text for the field it belongs to, and each `.txt` is one paste into one field:

    stripe-radar-1024x1024.png            the Stripe product image
    stripe-radar-1024x1024.txt            Stripe product description
    stripe-radar-1024x1024-name.txt       Stripe product name

    gbp-radar-1440x1440.png               the Google Business Profile product image
    gbp-radar-1440x1440.txt               GBP description
    gbp-radar-1440x1440-name.txt          GBP product name
    gbp-radar-1440x1440-price.txt         GBP price field
    gbp-radar-1440x1440-category.txt      GBP category field

    promo-radar-1080x1080.png             and the other three sizes
    promo-radar-1080x1080.txt             the short ad and DM line

## Two decisions worth knowing

**The four promo sizes all carry the same short line.** They are four crops of
one promotion, and nothing in `COPY.md` ties either promotion block to an aspect
ratio, so splitting them by size would have been a guess.

**The "longer paragraph, for a landing block" is not in any sidecar.** It is
body copy for a web page rather than a caption for an image, so pairing it to a
promo crop would have invented a relationship `COPY.md` does not claim. It stays
in `COPY.md`.

## One known overage, reported rather than shortened

`gbp-enterprise-1440x1440.txt` is 309 characters against the 300 character
budget `COPY.md` sets for a product description, and `COPY.md` prints both
numbers itself. It is pre-existing and was not introduced here. Google publishes
no character limit for that field, which `COPY.md` marks `[UNVERIFIED]`, so
nothing is known to be broken on the platform. It is recorded in
`_shared/pairing-known-overages.tsv`, pinned to its measured length so it cannot
quietly grow, and `check_pairing.py` prints it on every run.

## Stays in COPY.md

The per-block character counts, the source for every price and engine count, the
field-limit reasoning, and the six notes for whoever pastes this. **Note 6
matters most**: every Radar image carries the words "EUR 29 / mo launch", so
those files become false the moment list pricing resumes, and nothing in the
build will notice.

Nothing has been created in Stripe or on Google Business Profile.
""",
}


for folder, body in FOLDERS.items():
    path = os.path.join(ROOT, folder, "PAIRING.md")
    if folder == "youtube/thumbnails":
        text = body
    else:
        text = HEAD + body + TAIL
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text.strip("\n") + "\n")

# youtube/longform is a script, not a postable asset set.
with open(os.path.join(ROOT, "youtube", "longform", "PAIRING.md"),
          "w", encoding="utf-8", newline="\n") as fh:
    fh.write("""# No sidecars in this folder, and that is correct

`youtube/longform/` holds `SCRIPT.md`, `STORYBOARD.md`, `ASSETS.md` and
`OPEN-QUESTIONS.md`. There is no rendered video, no thumbnail and no image here,
so there is no postable asset for a `.txt` to sit beside.

A sidecar exists to remove the lookup between a file you upload and the words
you paste with it. A script has neither half of that: it is the input to a
production that has not happened, not an asset waiting on a caption.

When a long-form cut is rendered, it pairs the same way a Short does, with a
description, a `-title.txt` and a `-tags.txt` beside the master.

`OPEN-QUESTIONS.md` is the thing to read before anyone starts that production.

Nothing in this folder has been posted, scheduled or sent.
""")

print("gen_pairing_docs: %d folders" % (len(FOLDERS) + 1))
