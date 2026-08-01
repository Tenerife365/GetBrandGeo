# How the .txt files pair with the media

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

## The naming

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
