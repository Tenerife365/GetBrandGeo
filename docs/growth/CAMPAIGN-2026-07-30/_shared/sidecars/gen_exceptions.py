# -*- coding: utf-8 -*-
# Writes _shared/pairing-exceptions.tsv: the assets that deliberately carry no
# sidecar, each with the reason. check_pairing.py reads this file; anything not
# listed here and not paired is a failure.
#
# Every exception is one of three kinds:
#   1. a page of a multi-page post (carousel slide 2 onward)
#   2. a cover frame, which is an in-app thumbnail choice, not a post
#   3. an upload-field image (YouTube custom thumbnail), not a post

import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "_shared", "pairing-exceptions.tsv")

rows = []

# 1. multi-page posts. The caption sits on page 1.
for n in (2, 3, 4):
    rows.append((
        "instagram/feed/feed-01-invented-name-s%d.png" % n,
        "slide %d of the 4 slide carousel that is Instagram feed post 1; the "
        "caption is on feed-01-invented-name-s1.txt" % n,
    ))
for n in range(2, 9):
    rows.append((
        "linkedin/carousel/li-c-%02d-1080x1350.png" % n,
        "page %d of the 8 page document post that is LinkedIn post 4; the "
        "caption is on li-c-01-1080x1350.txt" % n,
    ))

# 2. cover frames. Frame 0 of the master, picked inside the app if at all.
covers = []
for stem in ("20260729-2200", "20260729-2318", "20260730-0013", "20260730-0113",
             "20260730-0216", "20260730-0313", "20260730-0413", "20260730-0513",
             "20260730-0613"):
    covers.append("instagram/reels/%s-instagram-cover.png" % stem)
    covers.append("facebook/video/%s-facebook-cover.png" % stem)
    covers.append("tiktok/video/%s-tiktok-cover.png" % stem)
    covers.append("youtube/shorts/%s-youtube-cover.png" % stem)
for city, langs in (("berlin", ("de", "en")), ("madrid", ("en", "es")),
                    ("paris", ("en", "fr")), ("rome", ("en", "it"))):
    for lang in langs:
        covers.append("bilingual/%s/%s-%s-cover.png" % (city, city, lang))
for c in sorted(covers):
    rows.append((
        c,
        "frame 0 of the video master, a cover selection inside the app rather "
        "than a post of its own; the caption is on the matching -silent.txt",
    ))

# 3. upload-field images.
for stem in ("20260729-2200", "20260729-2318", "20260730-0013", "20260730-0113",
             "20260730-0216", "20260730-0313", "20260730-0413", "20260730-0513",
             "20260730-0613"):
    rows.append((
        "youtube/thumbnails/thumb-%s-youtube-1280x720.png" % stem,
        "custom thumbnail for the Short of the same timestamp, an upload field "
        "rather than a post; title, description and tags are the "
        "%s-youtube-silent sidecars" % stem,
    ))

missing = [r[0] for r in rows if not os.path.exists(os.path.join(ROOT, r[0]))]
if missing:
    raise SystemExit("exception listed for a file that does not exist:\n  " +
                     "\n  ".join(missing))

with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
    fh.write("# asset\treason it carries no sidecar\n")
    for path, reason in rows:
        fh.write("%s\t%s\n" % (path, reason))

print("gen_exceptions: %d exceptions written" % len(rows))
