"""
Puts the current brand lockup into a bilingual cut, wherever the strip lives.

This file absorbs `relockup_bilingual.py`. There is now one tool, not two.

Why the merge, and why the old pair was unsafe
----------------------------------------------
The package ended up with two scripts that both "put the lockup into a
bilingual cut", and both went stale, for the same reason: each was written
against the exact state of the files on the day it ran, so each stopped working
the moment the files moved on.

`add_lockup.py` searched a hardcoded band, `y1430..1500`. Three cities carry the
strip at the BOTTOM and Paris carries it at the TOP, around y234, so Paris was
never in the band and was silently never processed. It also overwrote its input
in place, which makes a second run composite onto the output of the first, so it
defended itself with an `already_done()` guard that refused a second pass
outright. A tool that cannot be run twice cannot be used to change the logo,
which is exactly what was then needed, so `relockup_bilingual.py` was written to
do the job it could not.

`relockup_bilingual.py` then went stale the same way. It locates the strip by
RETIRED-BLUE pixels, and once it had run there was no retired blue left, so it
now exits with "no retired-blue pixels at t=". Two tools, both correct once,
both dead.

So the fix is not a third tool. It is to remove the two assumptions that killed
both: a hardcoded position, and an in-place edit that cannot be repeated.

The three properties this file guarantees
-----------------------------------------
**1. It never destroys its input.** The first time a cut is seen, a pristine
copy is taken into `_shared/_originals/` and never written again. Every run
rebuilds the delivered file FROM that pristine copy. The delivered `.mp4` is an
output, not a source.

**2. It is idempotent, by construction rather than by a guard.** Because every
run starts from the same untouched original and applies the same erase and the
same composite, run two produces the same bytes as run one. Compounding is not
prevented by a check that can be wrong; it is impossible, because the input to
the composite is never itself a composite. `already_done()` is gone, and with it
the reason a second pass had to be refused.

**3. It finds the strip wherever it is.** No band constant, no colour that only
one generation of the art happens to have. The mark is located by SHAPE: violet
pixels are grouped into connected components, each component is compared against
the real mark raster resized to that component's own box, and the match must
score at least `MARK_IOU`. Measured on the eight current cuts the true mark
scores 0.908 to 0.910 and the best decoy, a letterform in Paris's body copy,
scores 0.702, so the threshold sits in a wide empty gap rather than next to
anything. Exactly one component may qualify; two or none is a refusal, not a
guess. This is what lets one code path handle Paris at y234 and Rome at y1432
without being told which is which.

What is kept from `relockup_bilingual.py`, deliberately
-------------------------------------------------------
Every behaviour that file paid for is here:

  * the strip is located by measurement, per file, never assumed,
  * `trim()` crops on `alpha > 16`, NOT `getbbox()`. This is not a detail.
    `getbbox()` keeps alpha 1..16 of antialiasing, which rebuilt the retired
    strip 194px wide against the 203px actually burned into the video, and that
    9px shortfall left a visible sliver of the old wordmark on screen. The
    threshold here matches the one the strip was built with.
  * the ring around the strip is proven flat canvas before anything is erased,
    so the erase cannot eat a neighbour. Paris runs a vertical rail four pixels
    to the left of its strip, which is exactly what a generous erase box would
    have quietly removed,
  * the box must be identical across four sampled frames or the file is
    refused, so per-scene copy that happens to sit in the same columns cannot be
    mistaken for furniture,
  * scored cuts are NOT re-encoded. The new picture is copied bit for bit and
    the existing music bed is copied alongside it, so the stated relationship
    between the silent and scored pair survives and no generation is spent,
  * covers are re-extracted from frame 0, because they are frames of the video
    and carry whatever the video carries.

One thing is deliberately NOT kept. That file sized the erase box by REBUILDING
the old art and trusting the rebuild's width. This one measures the old strip's
real footprint out of the frame itself, mark plus wordmark ink, so there is no
rebuild to be wrong. The `alpha > 16` rule still governs building the NEW strip,
which is the part of that lesson that still bites.

Run:
    python add_lockup.py                 every city under bilingual/
    python add_lockup.py <dir> [<dir>..] named directories
    python add_lockup.py --dry-run       locate and report, write nothing
"""

import os
import shutil
import subprocess
import sys
from collections import deque

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
LOGO = os.path.join(HERE, "logo")
MARK = os.path.join(LOGO, "brandgeo-mark-transparent-h512.png")
WORD = os.path.join(LOGO, "brandgeo-wordmark-dark-transparent-w512.png")
ORIGINALS = os.path.join(HERE, "_originals")

# Strip proportions. Unchanged from the version that burned the current pixels,
# so the replacement carries the same visual weight as the thing it replaces.
MARK_H = 46
WORD_H = 24
GAP = 16

SAMPLES = (0.05, 0.30, 0.55, 0.80)
INK = 45                     # luma above which a pixel is ink, not canvas
MARK_IOU = 0.85              # true mark scores ~0.909, best decoy 0.702
RING_PAD = 8
RING_FLAT_STD = 3.0
WORD_GAP_MAX = 40            # px of canvas that may sit between mark and word
SCRATCH = os.environ.get("SCRATCH", ".")


# ------------------------------------------------------------------ art ------
def trim(path):
    """Crop on alpha > 16, which is what the strip was built with, NOT
    `getbbox()`. See the module docstring: `getbbox()` keeps 1..16 alpha and
    under-measured the retired strip by 9px."""
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    ys, xs = np.nonzero(a[..., 3] > 16)
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def build_strip(out=None):
    """Horizontal lockup: mark, gap, wordmark, optically centred on each other."""
    m, w = trim(MARK), trim(WORD)
    m = m.resize((max(1, round(m.width * MARK_H / m.height)), MARK_H), Image.LANCZOS)
    w = w.resize((max(1, round(w.width * WORD_H / w.height)), WORD_H), Image.LANCZOS)
    h = max(m.height, w.height)
    s = Image.new("RGBA", (m.width + GAP + w.width, h), (0, 0, 0, 0))
    s.alpha_composite(m, (0, (h - m.height) // 2))
    s.alpha_composite(w, (m.width + GAP, (h - w.height) // 2))
    if out:
        s.save(out)
    return s


def mark_template():
    """The mark alone, trimmed, used as the shape reference for the locator."""
    return trim(MARK)


# ------------------------------------------------------------- ffmpeg --------
def probe(path):
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path],
                       capture_output=True, text=True).stdout.strip()
    a = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                        "-show_entries", "stream=index", "-of", "csv=p=0", path],
                       capture_output=True, text=True).stdout.strip()
    return float(d), len([x for x in a.splitlines() if x.strip()])


def frame(path, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", path,
                    "-frames:v", "1", out], check=True)
    return np.asarray(Image.open(out).convert("RGB")).astype(int)


# ------------------------------------------------------------- locator -------
def violet_mask(a):
    """Pixels that can belong to the v3 violet ramp. Deliberately loose: this
    only nominates candidates, and the shape test decides."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (b > 140) & (r > 70) & (r >= g) & (b - g > 40)


def components(mask):
    """8-connected components over a sparse boolean mask.

    Written out rather than imported: scipy is not installed here, and neither
    is anything else that would do it. The masks are sparse, a few thousand
    pixels out of two million, so a BFS over the ON pixels is cheap.
    """
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        q = deque([(sy, sx)])
        seen[sy, sx] = True
        pts = []
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
        py = [p[0] for p in pts]
        px = [p[1] for p in pts]
        out.append((min(px), min(py), max(px), max(py), pts))
    return out


def find_mark(a, tmpl):
    """The mark's box, found by shape AND size. Exactly one match or nothing.

    Colour cannot do this on its own. These cuts set body copy and a progress
    rail in the same violet, and Paris's body copy contains letterforms whose
    bounding boxes are close to the mark's. So every violet component is
    rasterised against the real mark resized to that component's own box, and
    scored by intersection over union.

    Shape alone is not enough either, and that was found here rather than
    reasoned about: a first pass refused Berlin with "ambiguous mark, 2 shape
    matches", because these cuts also show the mark LARGE as scene art, 54x70 in
    Berlin at around t=0.3. It scores 0.909, the same as the real one, because
    it IS the same artwork. The two are separated by size, not by shape: the
    strip's mark is composited at exactly MARK_H, so the height gate is keyed to
    MARK_H and stays true if the strip spec changes. The tolerance is +/-4px,
    which covers encoding and antialiasing; every one of the eight cuts measures
    exactly 46.

    The refusal was the right behaviour and is kept. Two matches is a stop, not
    a pick-the-best.
    """
    cands = []
    for x0, y0, x1, y1, pts in components(violet_mask(a)):
        w, h = x1 - x0 + 1, y1 - y0 + 1
        if not (MARK_H - 4 <= h <= MARK_H + 4 and 20 <= w <= 60):
            continue
        cm = np.zeros((h, w), bool)
        for y, x in pts:
            cm[y - y0, x - x0] = True
        t = np.asarray(tmpl.resize((w, h), Image.LANCZOS))[..., 3] > 96
        inter = int((t & cm).sum())
        union = int((t | cm).sum())
        score = inter / max(1, union)
        if score >= MARK_IOU:
            cands.append((round(score, 4), x0, y0, x1, y1))
    if len(cands) > 1:
        raise SystemExit(f"ambiguous mark: {len(cands)} shape matches {cands}")
    return cands[0] if cands else None


def extend_over_wordmark(a, mark_box):
    """Grow the mark's box rightward across the wordmark ink.

    Walks right from the mark's right edge inside the mark's own row band and
    stops at the first run of blank columns longer than WORD_GAP_MAX. That is
    what separates the wordmark, which sits GAP px away, from whatever else
    shares those rows further right.
    """
    _, x0, y0, x1, y1 = mark_box
    h, w = a.shape[:2]
    band = slice(max(0, y0 - 4), min(h, y1 + 5))
    ink = (a[band].mean(axis=2) > INK)
    cols = ink.any(axis=0)
    x = x1 + 1
    last = x1
    blank = 0
    while x < w:
        if cols[x]:
            last = x
            blank = 0
        else:
            blank += 1
            if blank > WORD_GAP_MAX:
                break
        x += 1
    rows = ink[:, x0:last + 1].any(axis=1)
    idx = np.nonzero(rows)[0]
    ry0 = band.start + int(idx.min())
    ry1 = band.start + int(idx.max())
    return int(x0), int(min(y0, ry0)), int(last), int(max(y1, ry1))


def find_drawn_type(a):
    """Fallback for a cut that carries drawn `BRANDGEO` type and no mark at all.

    This is the pre-lockup state. Every delivered cut in this package has
    already been through the composite, so this path does not fire on them; it
    exists so a freshly rendered cut does not need a different tool. It looks
    for an isolated, text-height ink run in the lower or upper margin that
    carries pale ink and no violet mark.
    """
    h, w = a.shape[:2]
    lum = a.mean(axis=2)
    ink = lum > INK
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pale = (r > 180) & (g > 180) & (b > 180)
    rows = ink.any(axis=1)
    runs, start = [], None
    for i, v in enumerate(rows):
        if v and start is None:
            start = i
        if not v and start is not None:
            runs.append((start, i - 1))
            start = None
    if start is not None:
        runs.append((start, h - 1))
    hits = []
    for y0, y1 in runs:
        if not (8 <= y1 - y0 + 1 <= 40):
            continue
        cols = np.nonzero(ink[y0:y1 + 1].any(axis=0))[0]
        if len(cols) == 0:
            continue
        x0, x1 = int(cols.min()), int(cols.max())
        if pale[y0:y1 + 1, x0:x1 + 1].sum() < 60:
            continue
        hits.append((x0, y0, x1, y1))
    if len(hits) > 1:
        raise SystemExit(f"ambiguous drawn type: {hits}")
    return hits[0] if hits else None


def locate(path, dur, tmpl):
    """The strip's box, (x0, y0, x1, y1) inclusive, stable across time or bust."""
    seen, kinds = set(), set()
    for f in SAMPLES:
        a = frame(path, dur * f, os.path.join(SCRATCH, "_al.png"))
        mb = find_mark(a, tmpl)
        if mb is not None:
            seen.add(extend_over_wordmark(a, mb))
            kinds.add("lockup")
        else:
            dt = find_drawn_type(a)
            if dt is None:
                raise SystemExit(f"{path}: no lockup and no drawn type at t={f}")
            seen.add(dt)
            kinds.add("drawn-type")
    if len(seen) != 1:
        raise SystemExit(f"{path}: strip box moves across time: {seen}")
    if len(kinds) != 1:
        raise SystemExit(f"{path}: inconsistent strip kind across time: {kinds}")
    return seen.pop(), kinds.pop()


def canvas_ring(a, box, pad=RING_PAD):
    """The flat colour around the strip, and proof that it IS flat. Erasing into
    a gradient would leave a visible patch."""
    x0, y0, x1, y1 = box
    h, w = a.shape[:2]
    ring = np.concatenate([
        a[max(0, y0 - pad):y0, max(0, x0 - pad):min(w, x1 + pad)].reshape(-1, 3),
        a[y1 + 1:min(h, y1 + 1 + pad), max(0, x0 - pad):min(w, x1 + pad)].reshape(-1, 3),
        a[y0:y1 + 1, x1 + 1:min(w, x1 + 1 + pad)].reshape(-1, 3),
    ])
    if ring.std(axis=0).max() > RING_FLAT_STD:
        raise SystemExit("area around the strip is not flat, refusing to erase")
    c = ring.mean(axis=0).round().astype(int)
    return "0x%02x%02x%02x" % tuple(c)


# ------------------------------------------------------------- originals -----
def original_for(path):
    """The pristine pre-composite copy. Taken once, then read-only forever.

    This is what makes the whole thing idempotent: the composite always reads
    this file, never the delivered one, so it can never composite onto its own
    output.
    """
    rel = os.path.relpath(os.path.abspath(path), PKG)
    dst = os.path.join(ORIGINALS, rel)
    if not os.path.exists(dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(path, dst)
        return dst, True
    return dst, False


# --------------------------------------------------------------- compose -----
def compose(src, out, box, colour, strip_path, sw, sh):
    """Erase the old strip out of `src` and composite the new one, to `out`."""
    x0, y0, x1, y1 = box
    ex0, ey0 = x0 - 3, y0 - 4
    ew, eh = (x1 - x0 + 1) + 6, (y1 - y0 + 1) + 8
    assert sw <= ew and sh <= eh, (
        f"new strip {sw}x{sh} does not fit the {ew}x{eh} box being cleared")
    cy = (y0 + y1) // 2
    ly = cy - sh // 2
    ly -= ly % 2                  # overlay rounds an odd y DOWN under yuv420p

    fc = (f"[0:v]drawbox=x={ex0}:y={ey0}:w={ew}:h={eh}:color={colour}:t=fill[c];"
          f"[1:v]format=rgba[lg];[c][lg]overlay={x0}:{ly}:format=auto[v]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-i", strip_path,
                    "-filter_complex", fc, "-map", "[v]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
                   check=True)
    return dict(erase=(ex0, ey0, ew, eh), lockup=(x0, ly, sw, sh))


def rebuild_scored(silent, scored, orig_scored):
    """New picture, COPIED not re-encoded, plus the bed from the pristine copy."""
    d0, na0 = probe(orig_scored)
    assert na0 == 1, f"{orig_scored}: expected one audio stream, found {na0}"
    # The suffix must keep a .mp4 extension: ffmpeg picks the muxer from it, and
    # a bare ".tmp" fails with "Unable to choose an output format".
    tmp = scored + ".tmp-scored.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", orig_scored,
                    "-map", "0:v:0", "-map", "1:a:0", "-c", "copy",
                    "-movflags", "+faststart", tmp], check=True)
    d1, na1 = probe(tmp)
    if abs(d1 - d0) > 0.05 or na1 != 1:
        os.remove(tmp)
        raise SystemExit(f"{scored}: duration or audio changed, {d0}/{na0} to {d1}/{na1}")
    os.replace(tmp, scored)
    return d1


def cover(video, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-frames:v", "1",
                    "-update", "1", out], check=True)


# ------------------------------------------------------------------ main -----
def process(silent, strip_path, sw, sh, tmpl, dry):
    orig, fresh = original_for(silent)
    dur, nau = probe(orig)
    assert nau == 0, f"{orig}: expected a silent master, found {nau} audio streams"
    box, kind = locate(orig, dur, tmpl)
    a = frame(orig, dur * SAMPLES[0], os.path.join(SCRATCH, "_al.png"))
    colour = canvas_ring(a, box)
    if dry:
        return dict(box=box, kind=kind, colour=colour, dur=dur,
                    captured=fresh, dry=True)

    tmp = silent + ".tmp-lockup.mp4"      # .mp4 required, see rebuild_scored()
    r = compose(orig, tmp, box, colour, strip_path, sw, sh)
    d2, na2 = probe(tmp)
    if abs(d2 - dur) > 0.05 or na2 != 0:
        os.remove(tmp)
        raise SystemExit(f"{silent}: duration or audio changed, {dur}/0 to {d2}/{na2}")
    os.replace(tmp, silent)

    out = dict(box=box, kind=kind, colour=colour, dur=dur, captured=fresh, **r)

    scored = silent.replace("-silent.mp4", "-scored.mp4")
    if os.path.exists(scored):
        orig_scored, _ = original_for(scored)
        rebuild_scored(silent, scored, orig_scored)
        out["scored"] = os.path.basename(scored)

    cov = silent.replace("-silent.mp4", "-cover.png")
    cover(silent, cov)
    out["cover"] = os.path.basename(cov)
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    os.makedirs(SCRATCH, exist_ok=True)

    strip_path = os.path.join(SCRATCH, "lockup-strip.png")
    s = build_strip(strip_path)
    sw, sh = s.size
    tmpl = mark_template()
    print(f"strip {sw}x{sh}  mark_h={MARK_H} word_h={WORD_H} gap={GAP}"
          f"{'   [DRY RUN]' if dry else ''}")

    dirs = args or sorted(
        os.path.join(PKG, "bilingual", d)
        for d in os.listdir(os.path.join(PKG, "bilingual"))
        if os.path.isdir(os.path.join(PKG, "bilingual", d)))

    n_v = n_c = 0
    for d in dirs:
        for f in sorted(os.listdir(d)):
            if not f.endswith("-silent.mp4"):
                continue
            r = process(os.path.join(d, f), strip_path, sw, sh, tmpl, dry)
            tag = " (original captured)" if r.get("captured") else ""
            if dry:
                print(f"  {f}: {r['kind']} at {r['box']} bg {r['colour']}{tag}")
                continue
            n_v += 1
            print(f"  {f}: {r['kind']} {r['box']} erased {r['erase']} "
                  f"bg {r['colour']} -> lockup at {r['lockup']}{tag}")
            if r.get("scored"):
                n_v += 1
                print(f"  {r['scored']}: picture copied from the new master, bed kept")
            if r.get("cover"):
                n_c += 1
    if not dry:
        print(f"\n{n_v} videos rewritten, {n_c} covers re-extracted")


if __name__ == "__main__":
    main()
