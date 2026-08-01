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

These are catalogue images rather than social posts, so each one pairs with the
text for the field it belongs to, and each `.txt` is one paste into one field:

    stripe-radar-1024x1024.png            the Stripe product image
    stripe-radar-1024x1024.txt            Stripe product description
    stripe-radar-1024x1024-name.txt       Stripe product name

    gbp-radar-1440x1440.png               the Google Business Profile product image
    gbp-radar-1440x1440.txt               GBP description
    gbp-radar-1440x1440-name.txt          GBP product name
    gbp-radar-1440x1440-price.txt         GBP price field
    gbp-radar-1440x1440-category.txt      GBP category field

    promo-radar-1080x1080.png             and the other three sizes
    promo-radar-1080x1080.txt             the short ad and DM line

## Two decisions worth knowing

**The four promo sizes all carry the same short line.** They are four crops of
one promotion, and nothing in `COPY.md` ties either promotion block to an aspect
ratio, so splitting them by size would have been a guess.

**The "longer paragraph, for a landing block" is not in any sidecar.** It is
body copy for a web page rather than a caption for an image, so pairing it to a
promo crop would have invented a relationship `COPY.md` does not claim. It stays
in `COPY.md`.

## One known overage, reported rather than shortened

`gbp-enterprise-1440x1440.txt` is 309 characters against the 300 character
budget `COPY.md` sets for a product description, and `COPY.md` prints both
numbers itself. It is pre-existing and was not introduced here. Google publishes
no character limit for that field, which `COPY.md` marks `[UNVERIFIED]`, so
nothing is known to be broken on the platform. It is recorded in
`_shared/pairing-known-overages.tsv`, pinned to its measured length so it cannot
quietly grow, and `check_pairing.py` prints it on every run.

## Stays in COPY.md

The per-block character counts, the source for every price and engine count, the
field-limit reasoning, and the six notes for whoever pastes this. **Note 6
matters most**: every Radar image carries the words "EUR 29 / mo launch", so
those files become false the moment list pricing resumes, and nothing in the
build will notice.

Nothing has been created in Stripe or on Google Business Profile.

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
