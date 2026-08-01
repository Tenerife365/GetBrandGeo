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
