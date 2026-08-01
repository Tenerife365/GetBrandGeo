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
