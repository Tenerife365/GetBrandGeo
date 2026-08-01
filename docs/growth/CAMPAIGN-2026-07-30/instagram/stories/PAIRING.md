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
