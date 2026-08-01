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

    images/threads-1-companies-converge-1080x1350.png     the image
    images/threads-1-companies-converge-1080x1350.txt     part 1a, the one the image goes on
    images/threads-1-companies-converge-1080x1350-p2.txt  part 1b

Posts 1 to 4 each exceed the 500 character cap and cannot be posted as single
posts, so `POSTS.md` splits them at a paragraph boundary into a chain. **One
sidecar per part.** Post the `.txt` with the image attached, press **+**, paste
`-p2`, and post the chain. Post 2 needs three parts, `-p2` and `-p3`.

**The image goes on the first part only.**

## Limits

All nine parts are measured as UTF-8 bytes against the 500 cap, which is the
unit Threads counts. Every part is pure ASCII, so bytes and characters agree,
and the measured numbers reproduce the table in `POSTS.md` exactly. The tightest
are 2b at 480 and 4a at 474. Do not paste either through an editor that turns a
straight apostrophe into a curly one: one U+2019 costs 3 bytes instead of 1.

## What has no sidecar here, and it is ten posts

`POSTS.md` posts **P5 to P14** are the account-launch set and have no asset in
this folder:

- P5, P6, P7, P8, P10, P13 are text only by design, several of them explicitly
  so, and need no pairing.
- P9 and P13 are marked `[NEEDS ASSET]` in `POSTS.md`. Still true.
- P11, P12 and P14 reuse an image owned by another channel
  (`instagram/feed/feed-04`, `linkedin/feed/li-03`, `linkedin/feed/li-02`).
  Those files already carry their own channel's caption, and a second, different
  caption cannot live on the same filename. Copy P11, P12 and P14 out of
  `POSTS.md` at posting time.

This is a gap in the assets, not in the pairing, and it is left visible rather
than papered over.

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
