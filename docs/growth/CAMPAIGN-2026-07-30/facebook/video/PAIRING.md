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
