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

    gbp-1-free-audit-1200x900.png   the image
    gbp-1-free-audit-1200x900.txt   the post body

One image, one post, four of them.

The bodies are stored as a blockquote in `POSTS.md` because that is a markdown
file. The sidecars carry the same words with the `>` markers and the line
wrapping removed, because a composer would render both.

## Stays in POSTS.md

**The CTA button, and it is required.** Each post needs a button type and a
destination URL picked in the Google interface, which is a dropdown rather than
a paste, so it is not in the sidecar:

| Post | Button | Destination |
|---|---|---|
| 1 | Learn more | `https://getbrandgeo.com` |
| 2 | Sign up | `https://app.getbrandgeo.com/signup` |
| 3 | Learn more | `https://getbrandgeo.com` |
| 4 | Sign up | `https://app.getbrandgeo.com/signup` |

Also the product-truth source table, the crop-safe-area geometry, and the note
that two images live on the profile right now still advertising Meta AI.

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
