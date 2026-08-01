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

    fb-link-01-description-1200x630.png   the card
    fb-link-01-description-1200x630.txt   the post body

These are `og:image` cards, not feed images. Each belongs to one
`getbrandgeo.com` URL, named under its filename in `POSTS.md`. Set it as that
page's `og:image` and `twitter:image`, and paste the matching `.txt` as the link
post. The URL sits on its own line at the end of the body, so Facebook renders
the preview from the post itself and there is no first-comment trick to run.

## Stays in POSTS.md

The alt text, the destination URL and the reasoning for it, which feed image
each card pairs with, and the destination checks run on 2026-07-30.

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
