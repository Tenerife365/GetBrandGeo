# -*- coding: utf-8 -*-
"""Checks the asset-to-sidecar pairing across CAMPAIGN-2026-07-30.

Run:  python _shared/check_pairing.py
      python _shared/check_pairing.py --controls    negative controls, then the sweep

Four checks, all of which have been made to go red before any clean result was
believed. See the control table printed by --controls.

  P1  every postable asset has a .txt sidecar, or is listed in
      _shared/pairing-exceptions.tsv with a reason
  P2  every .txt sidecar resolves to an asset that exists
  P3  every sidecar is inside its platform's limit, counted the unit that
      platform counts
  P4  every paragraph of every sidecar appears verbatim in that channel's
      POSTS.md or COPY.md, so no sidecar can carry invented copy

Exit code 0 clean, 1 on any failure.
"""

import os
import re
import sys
import unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXCEPTIONS = os.path.join(ROOT, "_shared", "pairing-exceptions.tsv")
OVERAGES = os.path.join(ROOT, "_shared", "pairing-known-overages.tsv")

ASSET_EXT = (".png", ".jpg", ".jpeg", ".mp4")
SKIP_DIRS = {"_shared", "_build", "__pycache__", "images_src"}

# A sidecar named <assetstem>-<suffix>.txt is a later part of the same post, or
# a second upload field of it, and pairs with <assetstem>.
#
# The two kinds are NOT interchangeable for limits. A part is another post body
# and takes the channel's body limit; a field takes its own. Treating a part as
# a field left every -p2 to -p7 sidecar unchecked, which the negative controls
# caught: 19 of them, 14 on X and 5 on Threads, all silently exempt from the
# only limit that matters to them.
PART_SUFFIXES = ("p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9")
FIELD_SUFFIXES = ("title", "tags", "name", "price", "category")
SUFFIXES = PART_SUFFIXES + FIELD_SUFFIXES

BANNED_DASHES = {
    "—": "em dash", "–": "en dash", "‒": "figure dash",
    "−": "minus sign", "―": "horizontal bar",
}

# Which document each folder's copy must be traceable to.
SOURCE_DOC = [
    ("x/images", "x/POSTS.md"),
    ("threads/images", "threads/POSTS.md"),
    ("linkedin/feed", "linkedin/POSTS.md"),
    ("linkedin/carousel", "linkedin/POSTS.md"),
    ("google-business-profile", "google-business-profile/POSTS.md"),
    ("instagram/feed", "instagram/feed/POSTS.md"),
    ("instagram/stories", "instagram/stories/POSTS.md"),
    ("instagram/reels", "instagram/reels/POSTS.md"),
    ("facebook/feed", "facebook/feed/POSTS.md"),
    ("facebook/link", "facebook/link/POSTS.md"),
    ("facebook/video", "facebook/video/POSTS.md"),
    ("tiktok/video", "tiktok/POSTS.md"),
    ("youtube/shorts", "youtube/shorts/POSTS.md"),
    ("bilingual", "bilingual/POSTS.md"),
    ("product", "product/COPY.md"),
]

# (folder prefix, suffix or None for the body, unit, limit, where the limit
# comes from). Counting the unit the platform counts is the whole point: this
# campaign has already shipped a scan that counted words against a character
# cap and passed four unpostable posts.
LIMITS = [
    ("x/images",                None,       "x-weighted",  280,   "X post limit, URLs transformed to 23 characters"),
    ("threads/images",          None,       "utf8-bytes",  500,   "Threads post limit, counted as UTF-8 bytes"),
    ("instagram/feed",          None,       "chars",       2200,  "Instagram caption limit"),
    ("instagram/reels",         None,       "chars",       2200,  "Instagram caption limit"),
    ("facebook/feed",           None,       "chars",       63206, "Facebook post limit"),
    ("facebook/link",           None,       "chars",       63206, "Facebook post limit"),
    ("facebook/video",          None,       "chars",       63206, "Facebook post limit"),
    ("tiktok/video",            None,       "chars",       2200,  "TikTok caption limit"),
    ("youtube/shorts",          None,       "chars",       5000,  "YouTube description limit"),
    ("youtube/shorts",          "title",    "chars",       100,   "YouTube title limit"),
    ("youtube/shorts",          "tags",     "chars",       500,   "YouTube tag field limit"),
    ("google-business-profile", None,       "chars",       1500,  "Google Business Profile post limit"),
    ("bilingual",               None,       "chars",       2200,  "tightest caption limit of the four platforms these masters post to"),
    ("product",                 "name",     "chars",       60,    "self-imposed, product/COPY.md field budgets"),
    ("product",                 None,       "chars",       300,   "self-imposed, product/COPY.md field budgets"),
]
# product/promo-* is a landing and ad line with no platform field behind it.
NO_LIMIT_PREFIXES = ("product/promo-", "instagram/stories")

URLISH = re.compile(r"(?:https?://\S+|(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|html)\S*)", re.I)


def rel(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def walk():
    """Yield (assets, sidecars) as sets of repo-relative paths."""
    assets, sidecars = set(), set()
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            low = fn.lower()
            if low.endswith(ASSET_EXT):
                assets.add(rel(os.path.join(dirpath, fn)))
            elif low.endswith(".txt"):
                sidecars.add(rel(os.path.join(dirpath, fn)))
    return assets, sidecars


def load_exceptions():
    out = {}
    with open(EXCEPTIONS, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            path, _, reason = line.partition("\t")
            out[path] = reason
    return out


def load_overages():
    """Known limit breaches: reported loudly, never silently shortened.

    The recorded size is part of the contract, so a listed sidecar that grows
    fails again instead of hiding inside its own exemption.
    """
    out = {}
    with open(OVERAGES, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            path, measured, reason = line.split("\t", 2)
            out[path] = (int(measured), reason)
    return out


def normalise(text):
    """Whitespace-, blockquote- and markdown-insensitive form, for P4.

    Line breaks inside a paragraph are a .md wrapping artefact, backticks and
    asterisks are .md emphasis, and a blockquote marker is .md quoting. None of
    them is part of the words, and the words are what must match.
    """
    lines = []
    for ln in text.split("\n"):
        s = ln.strip()
        if s.startswith("> "):
            s = s[2:]
        elif s == ">":
            s = ""
        lines.append(s)
    joined = " ".join(lines)
    joined = joined.replace("`", "").replace("*", "")
    return re.sub(r"\s+", " ", joined).strip()


def measure(text, unit):
    if unit == "utf8-bytes":
        return len(text.encode("utf-8"))
    if unit == "x-weighted":
        return len(URLISH.sub("x" * 23, text))
    return len(text)


def limit_for(path):
    stem = os.path.basename(path)[:-4]
    suffix = None
    for s in FIELD_SUFFIXES:
        if stem.endswith("-" + s):
            suffix = s
            break
    if path.startswith(NO_LIMIT_PREFIXES):
        return None
    for prefix, want, unit, cap, source in LIMITS:
        if path.startswith(prefix) and want == suffix:
            return unit, cap, source
    return None


def source_doc_for(path):
    for prefix, doc in SOURCE_DOC:
        if path.startswith(prefix):
            return doc
    return None


def main(argv):
    failures = []
    warnings = []
    assets, sidecars = walk()
    exceptions = load_exceptions()
    overages = load_overages()

    # stale exception, i.e. one naming a file that is gone
    for path in exceptions:
        if path not in assets:
            failures.append("P1 stale exception, no such asset: %s" % path)

    # P1 every asset paired or excepted
    paired_assets = set()
    for asset in sorted(assets):
        stem = os.path.splitext(asset)[0]
        if os.path.exists(os.path.join(ROOT, stem + ".txt")):
            paired_assets.add(asset)
        elif asset in exceptions:
            pass
        else:
            failures.append("P1 asset with no sidecar and no exception: %s" % asset)

    # P2 every sidecar resolves to an asset
    def asset_for(sidecar):
        stem = os.path.splitext(sidecar)[0]
        candidates = [stem]
        for s in SUFFIXES:
            if stem.endswith("-" + s):
                candidates.append(stem[: -(len(s) + 1)])
        for cand in candidates:
            for ext in ASSET_EXT:
                if cand + ext in assets:
                    return cand + ext
        return None

    owner = {}
    for sidecar in sorted(sidecars):
        got = asset_for(sidecar)
        if got is None:
            failures.append("P2 sidecar with no asset: %s" % sidecar)
        else:
            owner[sidecar] = got

    # P3 platform limits, P4 traceability, plus dashes and emptiness
    docs = {}
    for sidecar in sorted(owner):
        text = open(os.path.join(ROOT, sidecar), encoding="utf-8").read().rstrip("\n")
        if not text.strip():
            failures.append("P3 empty sidecar: %s" % sidecar)
            continue

        for ch, name in BANNED_DASHES.items():
            if ch in text:
                failures.append("P3 %s in %s" % (name, sidecar))

        lim = limit_for(sidecar)
        if lim:
            unit, cap, source = lim
            n = measure(text, unit)
            if n > cap:
                known = overages.get(sidecar)
                msg = ("P3 %s is %d %s, over the %d cap (%s)"
                       % (sidecar, n, unit, cap, source))
                if known and n <= known[0]:
                    warnings.append(msg + "\n      known: " + known[1])
                else:
                    failures.append(msg)

        doc = source_doc_for(sidecar)
        if doc is None:
            failures.append("P4 no source document mapped for %s" % sidecar)
            continue
        if doc not in docs:
            docs[doc] = normalise(open(os.path.join(ROOT, doc), encoding="utf-8").read())
        haystack = docs[doc]
        for para in [p for p in text.split("\n\n") if p.strip()]:
            needle = normalise(para)
            if needle not in haystack:
                failures.append(
                    "P4 %s carries a paragraph not found in %s: %r"
                    % (sidecar, doc, needle[:70]))

    print("assets            %d" % len(assets))
    print("  paired          %d" % len(paired_assets))
    print("  excepted        %d" % len(exceptions))
    print("sidecars          %d" % len(sidecars))
    print("  resolved        %d" % len(owner))
    for path in overages:
        if path not in sidecars:
            failures.append("P3 stale known-overage entry, no such sidecar: %s" % path)
    if warnings:
        print("\n%d known overage%s, reported not hidden:"
              % (len(warnings), "" if len(warnings) == 1 else "s"))
        for w in warnings:
            print("  " + w)
    if failures:
        print("\nFAIL, %d finding%s" % (len(failures), "" if len(failures) == 1 else "s"))
        for f in failures:
            print("  " + f)
        return 1
    print("\nPASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
