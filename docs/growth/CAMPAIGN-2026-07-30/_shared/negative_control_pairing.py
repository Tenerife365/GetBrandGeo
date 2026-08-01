# -*- coding: utf-8 -*-
"""Negative controls for check_pairing.py.

Each defect the checker claims to catch is injected into the real tree, the
checker is run, and the specific message is required to appear. The injection
is then reverted and the checker re-run to confirm it goes quiet.

One control passes by STAYING SILENT: a sidecar re-wrapped to different line
lengths with the same words must not fail P4, because line wrapping in a
markdown file is not part of the copy. Without that control, P4 passing would
be indistinguishable from P4 being accidentally strict.

Run: python _shared/negative_control_pairing.py
"""

import os
import shutil
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHECK = os.path.join(ROOT, "_shared", "check_pairing.py")

THREADS = "threads/images/threads-2-an-emoji-changed-the-score-1080x1350-p2.txt"
XPOST = "x/images/x-standalone-1-one-question-five-engines-1600x900.txt"
REEL = "instagram/reels/20260729-2200-instagram-silent.txt"
FBFEED = "facebook/feed/fb-feed-01-description-1440x1800.txt"
GBPENT = "product/gbp-enterprise-1440x1440.txt"
GBPMAN = "product/gbp-managed-1440x1440.txt"
EXC = "_shared/pairing-exceptions.tsv"
OVR = "_shared/pairing-known-overages.tsv"


def run():
    # PYTHONIOENCODING is load-bearing: an injected em dash makes the child's
    # own report undecodable under the Windows console codepage, and a control
    # that cannot read the output reports every check as silent.
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    p = subprocess.run([sys.executable, CHECK], cwd=ROOT, env=env,
                       capture_output=True, text=True, encoding="utf-8")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def write(rel, text):
    with open(os.path.join(ROOT, rel), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


class Control:
    """Injects, asserts, always reverts."""

    def __init__(self, name, expect, fires=True):
        self.name, self.expect, self.fires = name, expect, fires
        self.saved = {}

    def save(self, *rels):
        for r in rels:
            path = os.path.join(ROOT, r)
            self.saved[r] = read(r) if os.path.exists(path) else None

    def restore(self):
        for r, content in self.saved.items():
            path = os.path.join(ROOT, r)
            if content is None:
                if os.path.exists(path):
                    os.remove(path)
            else:
                write(r, content)


results = []


def control(name, expect, inject, fires=True, touches=()):
    """expect is a list of substrings, ALL of which must appear.

    Split into fragments rather than one exact line so a control asserts the
    check that fired and the unit it counted, without being brittle about the
    exact number, which was wrong on two controls in the first pass here.
    """
    if isinstance(expect, str):
        expect = [expect]
    c = Control(name, expect, fires)
    c.save(*touches)
    try:
        inject()
        code, out = run()
        hit = all(frag in out for frag in expect)
        if fires:
            ok = hit and code == 1
        else:
            ok = (not hit) and code == 0
    finally:
        c.restore()
    results.append((name, ok, "FIRED" if hit else "silent"))
    return ok


# 1. an asset with no sidecar
control(
    "asset with no sidecar",
    "P1 asset with no sidecar and no exception: instagram/reels/20260729-2200-instagram-silent.mp4",
    lambda: os.remove(os.path.join(ROOT, REEL)),
    touches=(REEL,),
)

# 2. a sidecar with no asset
ORPHAN = "instagram/reels/20260729-9999-instagram-silent.txt"
control(
    "sidecar with no asset",
    "P2 sidecar with no asset: " + ORPHAN,
    lambda: write(ORPHAN, "Link in bio.\n"),
    touches=(ORPHAN,),
)

# 3. a Threads post past 500 bytes, pushed over by BYTES while its CHARACTER
#    count stays legal. This is the exact trap threads/POSTS.md documents.
def _bytes_trap():
    write(THREADS, read(THREADS).rstrip("\n") + " " + "€" * 10 + "\n")

control(
    "Threads post over 500 UTF-8 bytes, characters still legal",
    ["P3 " + THREADS + " is 511 utf8-bytes", "over the 500 cap"],
    _bytes_trap,
    touches=(THREADS,),
)

# 4. an X post past 280
control(
    "X post over 280",
    ["P3 " + XPOST + " is ", " x-weighted, over the 280 cap"],
    lambda: write(XPOST, read(XPOST).rstrip("\n") + " " + "x" * 60 + "\n"),
    touches=(XPOST,),
)

# 4b. an X thread CONTINUATION part over 280. This is the case the first
#     version of check_pairing.py skipped: a -p2 sidecar was read as a field
#     rather than as another post body and got no limit at all.
XPART = "x/images/x-thread-a-firm-that-does-not-exist-1600x900-p4.txt"
control(
    "X thread continuation part over 280",
    ["P3 " + XPART + " is ", " x-weighted, over the 280 cap"],
    lambda: write(XPART, read(XPART).rstrip("\n") + " " + "x" * 90 + "\n"),
    touches=(XPART,),
)

# 5. an em dash
control(
    "em dash in a sidecar",
    "P3 em dash in " + FBFEED,
    lambda: write(FBFEED, read(FBFEED).replace("two separate results", "two — separate results")),
    touches=(FBFEED,),
)

# 6. invented copy, i.e. a paragraph that is in no source document
control(
    "invented copy",
    "P4 " + REEL + " carries a paragraph not found in",
    lambda: write(REEL, read(REEL).rstrip("\n") + "\n\nNine of ten marketers say AI search is the future.\n"),
    touches=(REEL,),
)

# 7. a stale exception, naming an asset that is gone
control(
    "stale exception",
    "P1 stale exception, no such asset: facebook/video/does-not-exist-cover.png",
    lambda: write(EXC, read(EXC) + "facebook/video/does-not-exist-cover.png\tinvented\n"),
    touches=(EXC,),
)

# 8. an UNLISTED product description over budget. Proves the known-overage
#    list exempts one named file, not the check.
control(
    "unlisted product description over budget",
    ["P3 " + GBPMAN + " is ", " chars, over the 300 cap"],
    lambda: write(GBPMAN, read(GBPMAN).rstrip("\n") + " " + "word " * 12 + "\n"),
    touches=(GBPMAN,),
)

# 9. the LISTED overage growing past its recorded size. Proves the exemption is
#    pinned to a measurement and cannot quietly absorb a second breach.
control(
    "known overage growing past its recorded size",
    ["P3 " + GBPENT + " is ", " chars, over the 300 cap"],
    lambda: write(GBPENT, read(GBPENT).rstrip("\n") + " " + "word " * 12 + "\n"),
    touches=(GBPENT,),
)

# 10. a stale known-overage entry
control(
    "stale known-overage entry",
    "P3 stale known-overage entry, no such sidecar: product/gbp-nosuch-1440x1440.txt",
    lambda: write(OVR, read(OVR) + "product/gbp-nosuch-1440x1440.txt\t999\tinvented\n"),
    touches=(OVR,),
)

# 11. MUST STAY SILENT. Same words, different line wrapping. P4 compares words,
#     not layout, so re-wrapping a sidecar is not a defect.
def _rewrap():
    text = read(FBFEED)
    out = []
    for para in text.strip("\n").split("\n\n"):
        words = para.split()
        lines, cur = [], []
        for w in words:
            cur.append(w)
            if len(" ".join(cur)) > 34:
                lines.append(" ".join(cur))
                cur = []
        if cur:
            lines.append(" ".join(cur))
        out.append("\n".join(lines))
    write(FBFEED, "\n\n".join(out) + "\n")

control(
    "same words, different wrapping (must stay silent)",
    "P4 " + FBFEED,
    _rewrap,
    fires=False,
    touches=(FBFEED,),
)

# restored baseline
code, out = run()
baseline_ok = code == 0 and "PASS" in out

print()
print("%-58s %-8s %s" % ("control", "expected", "result"))
print("-" * 82)
for name, ok, observed in results:
    print("%-58s %-8s %s" % (name, "silent" if name.endswith("(must stay silent)") else "FIRED",
                             observed + ("  ok" if ok else "  MISS")))
print("-" * 82)
caught = sum(1 for _, ok, _ in results if ok)
print("%d of %d controls behaved as required" % (caught, len(results)))
print("restored baseline: %s" % ("PASS, exit 0" if baseline_ok else "NOT CLEAN"))

sys.exit(0 if caught == len(results) and baseline_ok else 1)
