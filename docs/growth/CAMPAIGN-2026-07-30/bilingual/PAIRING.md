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
