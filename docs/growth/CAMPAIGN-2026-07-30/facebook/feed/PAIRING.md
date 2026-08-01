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
