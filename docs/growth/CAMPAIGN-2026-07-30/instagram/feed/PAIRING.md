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
