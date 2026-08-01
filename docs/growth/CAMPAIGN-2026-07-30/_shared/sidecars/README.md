# The sidecar layer

Every postable asset in this campaign has a `.txt` file of the same name beside
it, holding exactly the copy that ships with it. Open one folder, see a pair,
post it. No cross-referencing at the moment of posting.

`POSTS.md` and `COPY.md` are untouched and remain the source. They carry the
reasoning, the sourcing, the limits on each claim, the counts and the posting
order. The sidecars are cut out of them.

---

## The naming contract

    <asset stem>.txt              the body: caption, description or post text
    <asset stem>-p2.txt … -p9     later parts of the same chained post, in order
    <asset stem>-title.txt        a title field
    <asset stem>-tags.txt         a tag field
    <asset stem>-name.txt         a product name field
    <asset stem>-price.txt        a price field
    <asset stem>-category.txt     a category field

A part is another post body and takes the channel's body limit. A field takes
its own limit. Conflating the two is a real defect and is described under
"What the controls caught" below.

## What a sidecar contains

Only what gets pasted. No headings, no character counts, no commentary, no
"post 3 of 4". Select all, copy, paste.

Anything that goes into a *different* field at a *different* moment stays in
`POSTS.md`: Instagram first comments and alt text, Facebook alt text, Google
Business Profile CTA buttons, TikTok on-screen sticker suggestions.

## Line wrapping

Copy stored in a markdown file is hard wrapped at about 78 columns. A composer
would render those breaks, so the sidecars unwrap them back to spaces and keep
only the paragraph breaks. **No word is changed**, and `check_pairing.py`
proves it by matching every sidecar paragraph against the source document with
whitespace collapsed on both sides.

## Video: one post, two masters

Where a cut has `-silent.mp4` and `-scored.mp4`, those are two masters of one
post, so **the same text sits beside both**. This is a deliberate call. The copy
does not change with the audio, and putting it beside the scored master means an
embed or a paid placement does not have to come back to `POSTS.md` for it.

Upload the `-silent.mp4` for anything organic. `-cover.png` is frame 0 of the
master, a cover picked inside the app rather than a post, so it has no sidecar.

## Assets with no sidecar

Listed one per line with a reason in `_shared/pairing-exceptions.tsv`, and the
check fails on any asset that is neither paired nor listed there. Three kinds:

| Kind | Count | Why |
|---|---|---|
| carousel and document pages after page 1 | 10 | pages of one post; the caption is on page 1 |
| video cover frames | 44 | frame 0, an in-app cover choice, not a post |
| YouTube custom thumbnails | 9 | an upload field of a Short, not a post |

## Rebuilding

    python _shared/sidecars/gen_x_threads_linkedin_gbp.py
    python _shared/sidecars/gen_instagram.py
    python _shared/sidecars/gen_facebook_tiktok.py
    python _shared/sidecars/gen_youtube_bilingual.py
    python _shared/sidecars/gen_product.py
    python _shared/sidecars/gen_exceptions.py
    python _shared/sidecars/gen_pairing_docs.py

Then, from the campaign root:

    python _shared/check_pairing.py
    python _shared/negative_control_pairing.py

## What the controls caught

Three defects, all found by making the check go red rather than by reading it.

1. **Chain parts were skipping the limit check entirely.** `-p2` to `-p7` were
   read as field suffixes rather than as post bodies, so 19 sidecars, 14 on X
   and 5 on Threads, were exempt from the only limit that applied to them. Found
   by a control that padded a Threads part past 500 bytes and watched the check
   stay quiet. Fixed by separating `PART_SUFFIXES` from `FIELD_SUFFIXES`. After
   the fix all 25 X and Threads measurements reproduce the counts published in
   their own `POSTS.md` exactly.
2. **A transcription error in a Facebook body.** The words "by language" were
   dropped from `20260730-0613-facebook`. Caught by the traceability check, not
   by proofreading.
3. **Two controls asserted an exact character count and the count was wrong**,
   so they reported silent when the check had actually fired. A control that is
   wrong about what it expects is indistinguishable from a check that does not
   work. Controls now assert the check that fired and the unit it counted, not
   the number.

There is also one control that passes by **staying silent**: re-wrapping a
sidecar to different line lengths with the same words must not fail the
traceability check. Without it, that check passing would be indistinguishable
from it being accidentally strict about layout.

Nothing in this campaign has been posted, scheduled or sent, and no git command
was run.
