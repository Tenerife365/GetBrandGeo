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
