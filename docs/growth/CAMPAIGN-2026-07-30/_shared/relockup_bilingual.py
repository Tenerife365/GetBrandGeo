"""
MERGED INTO `add_lockup.py` on 2026-07-31. This file is a signpost, not a tool.

It existed because `add_lockup.py` could not be run a second time: that script
searched a hardcoded `y1430..1500` band, which misses Paris entirely, and its
`already_done()` guard refused a second pass outright. Rather than repair it,
this file was written to do the one job it could not.

That was the mistake. Two tools for one job meant two things to keep current,
and both went stale within a day of each other. This one located the strip by
RETIRED-BLUE pixels, so the moment it had done its work there was no retired
blue left and it began failing with "no retired-blue pixels at t=". It has been
unrunnable ever since, on exactly the files it was written for.

Everything it earned is now in `add_lockup.py` and is exercised there:

  * the strip is located per file by measurement, never assumed, and now by
    SHAPE rather than by a colour that belongs to one generation of the art, so
    it keeps working after the art changes,
  * `trim()` still crops on `alpha > 16` rather than `getbbox()`, the rule that
    stopped a 9px-short erase box leaving a sliver of old wordmark on screen,
  * the ring around the strip is still proven flat before anything is erased,
    which is what protects Paris's rail four pixels to the left,
  * the box must still be identical across four sampled frames,
  * scored cuts are still remuxed, never re-encoded,
  * covers are still re-extracted from frame 0.

Two things changed in the move. The erase box is now measured from the real
footprint in the frame instead of from a rebuild of the old art, so there is no
rebuild left to be wrong. And the delivered `.mp4` is now an output rather than
a source: the pristine cut is kept in `_shared/_originals/` and every run
rebuilds from it, which is what makes repeat runs safe instead of forbidden.

Use:
    python add_lockup.py
"""

import os
import sys

MSG = __doc__.strip()

if __name__ == "__main__":
    print(MSG, file=sys.stderr)
    print("\nNothing was done. Run `python add_lockup.py` instead.", file=sys.stderr)
    sys.exit(2)
