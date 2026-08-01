# Retired logo art, kept for the record

These three files are the logo the 2026-07-30 campaign package was originally
rendered with. **They are the wrong logo.** They are kept, not deleted, so the
first render of the package stays explicable.

## What they are

A blue-to-violet `b` with a teardrop base and a dark navy disc at the centre of
the counter, plus a `BrandGEO` wordmark whose `GEO` runs blue into violet. They
came byte for byte out of `docs/growth/brand-kit-2026-07-29/png/`, which is
itself built from `brand-kit-2026-07-29/source-art/`, where the mark file is
literally named `mark-eye.png`.

MD5, so the provenance can be rechecked without trusting this note:

| File | MD5 |
|---|---|
| `brandgeo-lockup-dark-transparent-w512.png` | `5bfd9a70443c1b94920bbbf75ff0916c` |
| `brandgeo-mark-transparent-h512.png` | `1d87e238933895ea22a983f3e3589f8b` |
| `brandgeo-wordmark-dark-transparent-w512.png` | `c265f7b2f5e30f55b80fa189083cccca` |

The first and third hashes match `brand-kit-2026-07-29/png/lockup/` and
`png/wordmark/` exactly. The second matches `png/mark/brandgeo-mark-transparent-h512.png`
and, at a different size, `source-art/mark-eye.png`.

## Why they were replaced

They are not the logo BrandGEO ships. The live art on both properties is the v3
mark in `docs/growth/brand-identity-2026-07-29/v3/`: a flat violet monoline `b`,
a plain ring counter, no navy centre, no teardrop. That is what
`brandgeo/web/logo.png` and `brandgeo-dashboard/public/logo.png` serve today,
and it is what `v3/build/rollout.py` writes to both.

The campaign proved the split against itself. Its own video pipeline was already
using the correct v3 mark, visible in every TikTok cut and every Instagram Reel,
while the static renderers and the video lockup compositor read these three
files. One package, two logos.

## What replaced them

`_shared/build_logo_v3.py` regenerates all three from v3 geometry. The mark is
drawn from the numbers in `v3/build/render_v3.py`, the wordmark is set in
`_shared/fonts/Inter-Bold.ttf` with the colour split from `v3/logo-full.svg`.

## Do not restore these

If a renderer is producing the old art, the cause is a stale copy somewhere
else, not a missing file here. `_shared/check_logo.py` finds the retired art by
its pixels and will name the file.
