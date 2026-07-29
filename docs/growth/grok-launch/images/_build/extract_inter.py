"""
Extract real Inter from the repo, no download required.

Inter is not installed as a system font on this machine (473 faces, zero
matches). It IS in the repo, as the Next.js `next/font/google` output under
`brandgeo-next/.next/static/media/`. Those are woff2, which Pillow cannot open,
and fontTools cannot decompress woff2 without the `brotli` wheel, which is not
installed.

Node 24 ships `zlib.brotliDecompressSync` in core, so `brotli.py` next to this
file shims the one function fontTools needs and routes it through node. The
latin subset `83afe278b6a6bb3c-s.p.*.woff2` carries full basic-latin coverage
and a 100 to 900 `wght` axis, so every weight used by the renders is a real
Inter instance rather than a synthetic emboldening.

Output: static TTFs in ./fonts/, which Pillow loads directly.
"""

import glob
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from fontTools.ttLib import TTFont          # noqa: E402
from fontTools.varLib import instancer      # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
MEDIA = os.path.join(REPO, "brandgeo-next", ".next", "static", "media")
OUT = os.path.join(HERE, "fonts")

# Every glyph any render in this package sets.
NEEDED = set(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "0123456789.,:;?!()[]'\"/%+= "
)

WEIGHTS = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}


def pick_source():
    best = None
    for path in sorted(glob.glob(os.path.join(MEDIA, "*.woff2"))):
        f = TTFont(path)
        if f["name"].getDebugName(1) != "Inter":
            continue
        if "fvar" not in f:
            continue
        cmap = f.getBestCmap()
        if any(ord(c) not in cmap for c in NEEDED):
            continue
        n = len(f.getGlyphOrder())
        if best is None or n > best[1]:
            best = (path, n)
    if best is None:
        raise SystemExit("no Inter woff2 in the repo covers the needed glyph set")
    return best[0]


def main():
    os.makedirs(OUT, exist_ok=True)
    src = pick_source()
    print("source:", os.path.basename(src))
    written = []
    for wght, label in WEIGHTS.items():
        font = TTFont(src)
        instancer.instantiateVariableFont(font, {"wght": wght}, inplace=True,
                                          updateFontNames=False)
        font.flavor = None
        dest = os.path.join(OUT, f"Inter-{label}.ttf")
        font.save(dest)
        written.append((dest, os.path.getsize(dest)))
    for path, size in written:
        print(f"  {os.path.basename(path):<24} {size:>8,} bytes")


if __name__ == "__main__":
    main()
