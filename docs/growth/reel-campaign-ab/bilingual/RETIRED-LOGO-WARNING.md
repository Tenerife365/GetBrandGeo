# Do not copy these files into the campaign package

**Dated 2026-07-31.**

Every video and cover in this folder carries the **retired** BrandGEO logo burned
into its pixels: the blue-to-violet `b` with a teardrop base and a dark navy disc
in the counter, plus the old `BrandGEO` wordmark.

The current mark is the flat violet monoline `b` with a plain ring counter. It is
what `brandgeo/web/logo.png` and `brandgeo-dashboard/public/logo.png` serve, and
it is what `docs/growth/brand-identity-2026-07-29/v3/` defines.

## Why this file exists

On 2026-07-31 the 24 bilingual assets in
`docs/growth/CAMPAIGN-2026-07-30/bilingual/` were re-rendered to replace the
retired mark. **The originals here were not touched**, because they are the A/B
run's own record and rewriting them would falsify it.

So these files and the campaign's files now differ in their logo. Copying
anything from this folder into the campaign package puts the retired mark back,
and it will not be obvious: the filenames are identical and the difference is a
few hundred pixels in one corner of a moving image.

## If you need a bilingual asset

Take it from `docs/growth/CAMPAIGN-2026-07-30/bilingual/`, never from here.

## The root cause, so it does not recur

`_shared/BRIEF.md` used to instruct renderers to take the logo from
`docs/growth/brand-kit-2026-07-29/`. That kit is dated inside rebrand week but
contains the RETIRED art; its own source file is named `source-art/mark-eye.png`,
and the eye is the retired mark's defining feature. The BRIEF now names
`brand-identity-2026-07-29/v3/` and the build script instead.

The package was internally inconsistent before the fix and nobody noticed:
TikTok cuts and Instagram Reels already carried the correct v3 mark while these
bilingual cuts carried the retired one, split along the line of which script
read from `_shared/logo/`.
