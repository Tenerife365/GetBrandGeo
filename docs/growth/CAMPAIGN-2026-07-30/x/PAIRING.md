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
