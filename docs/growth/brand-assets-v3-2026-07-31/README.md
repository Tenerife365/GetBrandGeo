# BrandGEO social profile and banner set, v3 mark, 2026-07-31

18 files. Every avatar and banner for the eight channels, built on the **v3
mark** (flat violet monoline `b`, plain ring counter, centre dot) and the
**Geist** wordmark.

This set replaces the retired blue-to-violet teardrop mark that is still live on
the profiles today. The previous kit, `docs/growth/brand-kit-2026-07-29/`, is a
dated record of that retired identity and is not touched by anything here.

Nothing has been uploaded. Every step below is yours to run.

- Build:  `python build/build_social.py`
- Verify: `python build/verify_social.py`  (writes `verification.json`, exits
  non-zero on any failure)

Use `python`, not `python3`. Only `python` has PIL on this machine.

---

## 1. Upload guide, by platform

Pick the **violet** file every time unless the row says otherwise. The reasoning
is in section 2.

### LinkedIn (company page)

| | |
|---|---|
| **Logo** | `png/linkedin/linkedin-logo-400-violet.png`, 400 x 400 |
| Where | Page admin view, click the pencil on the logo, or **Edit page > Page info > Logo** |
| Constraint | Minimum 268 x 268, recommended 400 x 400, PNG or JPEG, 3 MB cap. File is 16 KB. |
| **Cover** | `png/linkedin/linkedin-cover-4200x700.png`, 4200 x 700 |
| Where | **Edit page > Page info > Cover image** |
| Constraint | 4200 x 700 exactly. Same 3 MB cap. File is 137 KB. |

LinkedIn's cover spec changed. It is **4200 x 700**, not the 1128 x 191 that
most guides still print. All content sits in the middle third of the strip
because LinkedIn floats the page logo over the lower left on desktop and trims
the ends on narrow viewports.

`png/linkedin/linkedin-logo-1024-violet-master.png` is a 1024 master for
partner decks, press requests and anywhere a larger square is asked for. Do not
upload it to the logo slot; 400 is the stated recommendation.

### Google Business Profile

| | |
|---|---|
| **Logo** | `png/gbp/gbp-logo-720-violet.png`, 720 x 720 |
| Where | Business Profile > **Edit profile > Photos > Logo** |
| Constraint | Recommended 720 x 720, minimum 250 x 250, JPG or PNG, **between 10 KB and 5 MB**. File is 32 KB, so the 10 KB floor is cleared. |
| **Cover** | `png/gbp/gbp-cover-1024x576.png`, 1024 x 576 |
| Where | **Edit profile > Photos > Cover** |
| Constraint | Google publishes no cover-specific size. The same 250 x 250 minimum and 10 KB to 5 MB range apply. The cover renders 16:9, which is why this is 1024 x 576. |

`png/gbp/gbp-logo-720-white.png` is the white-background variant. Use it for
print, partner directories and any surface that expects a logo on white. **Do
not use it as the profile avatar**, see section 3.

### X

| | |
|---|---|
| **Profile** | `png/x/x-profile-400-violet.png`, 400 x 400 |
| Where | **Profile > Edit profile > camera icon on the avatar** |
| **Header** | `png/x/x-header-1500x500.png`, 1500 x 500 |
| Where | Same **Edit profile** panel, camera icon on the banner |
| Constraint | 2 MB cap on both. Files are 16 KB and 68 KB. |

X's own help pages return 403 to any non-browser client, so 400 x 400 and
1500 x 500 could not be confirmed first-party. See section 4.

The header's content sits high and right of centre. That is deliberate: X floats
the avatar circle over the lower left of the header, and anything placed there
is covered.

### Instagram (and Threads)

| | |
|---|---|
| **Profile** | `png/instagram/instagram-profile-1080-violet.png`, 1080 x 1080 |
| Where | **Edit profile > Change profile photo** |

Instagram has no banner. **Threads inherits this photo from the linked
Instagram account**, so changing it here changes Threads. There is nothing
separate to upload for Threads.

1080 is deliberately larger than anything Instagram displays. Instagram
re-encodes on upload, so giving it more pixels than it needs costs nothing and
protects against a future display-size change.

### TikTok

| | |
|---|---|
| **Profile** | `png/tiktok/tiktok-profile-1080-violet.png`, 1080 x 1080 |
| Where | **Profile > Edit profile > Change photo** |

No banner exists on TikTok.

### Facebook (page)

| | |
|---|---|
| **Profile** | `png/facebook/facebook-profile-1080-violet.png`, 1080 x 1080 |
| Where | Page > **Edit > Profile picture** |
| **Cover** | `png/facebook/facebook-cover-1702x630.png`, 1702 x 630 |
| Where | Page > **Edit > Cover photo** |

1702 x 630 is 851 x 315 at 2x. Facebook crops the cover differently on desktop
and mobile: desktop shows the full 2.70:1 strip, mobile takes roughly a 16:9
slice from the centre, which inside this file is the central 1120 px. Every
pixel of content is inside that band, so nothing is lost on a phone. Proof:
`proof/safearea-facebook-facebook-cover-1702x630.png`.

### YouTube

| | |
|---|---|
| **Channel icon** | `png/youtube/youtube-icon-800-violet.png`, 800 x 800 |
| Where | YouTube Studio > **Customization > Branding > Picture** |
| Constraint | Renders at 98 x 98. JPG, GIF, BMP or PNG, no animated GIF, 15 MB cap. File is 36 KB. |
| **Banner** | `png/youtube/youtube-banner-2560x1440.png`, 2560 x 1440 |
| Where | YouTube Studio > **Customization > Branding > Banner image** |
| Constraint | Recommended 2560 x 1440, minimum 2048 x 1152 at 16:9, **text and logo safe area 1235 x 338**, 6 MB cap. File is 162 KB. |

YouTube is the one that catches people out, because a single upload is cropped
three different ways. TV shows the whole 2560 x 1440 frame, desktop shows a
wider centre slice, and mobile shows roughly the 1235 x 338 safe box. Anything
outside that box is not guaranteed to survive on any device.

Every piece of content in this banner sits inside the safe box with 325 px of
clearance left, 329 right, 30 top and 31 bottom, measured not estimated. The
violet field outside it is designed to be cropped. Proof:
`proof/safearea-youtube-youtube-banner-2560x1440.png`.

---

## 2. Why the files look the way they do

**Full bleed, not a rounded tile.** v3 already ships `icon-card-*` and
`icon-tile-*`, and neither is right here. Those are rounded rectangles built for
app-icon slots where the operating system supplies its own mask. Every social
platform in this list crops an avatar to a **circle**, so a rounded rectangle
would show four corners of whatever the platform's own background happens to be.
A full-bleed square crops to a clean circle and also removes the light-mode
versus dark-mode question, because there is no transparency for a platform to
composite against.

**The mark is bigger than in the app icons, on purpose.** `icon-card` shrinks
the mark to 83% for optical padding inside a squircle. Inside a circle that
shrink is wasted, and it costs stroke weight at the sizes that actually decide
whether the avatar reads. The mark is drawn at 110% instead. Stroke weight is
10.9% of the frame, so at a 16 px feed render that is 1.9 device px rather than
1.45. The mark's furthest ink still sits at 86.1% of the circle's radius, so
13.9% is left clear.

**Three background variants, and when to use each.**

| Variant | Use | Measured |
|---|---|---|
| `violet` | **Default. Use this everywhere.** Gradient field, light glyph. | 4.25:1, openness 0.94 at 32 px, 0.67 at 16 px |
| `dark` | Alternate for a light-heavy surface where a near-black square reads as a deliberate object. | 4.47:1, openness 0.98 at 32 px, 0.80 at 16 px |
| `white` | Print, partner directories, anywhere a logo on white is expected. **Not for avatars.** | 4.37:1, openness 0.79 at 32 px, **0.38 at 16 px** |

The `dark` variant measures slightly better than `violet` on the counter test.
`violet` is still the default because a near-black square on a dark feed reads
as a hole rather than a mark, which is the same reason v3's own build notes flag
the dark tile at 1.01:1 against the site canvas. `dark` files are supplied for
LinkedIn, X, Instagram and Facebook if a light-mode preference argues for them.

---

## 3. Constraints worth knowing before you upload

1. **The white variant is the weakest at feed size.** Its counter recovers only
   38% of the way back to the background at a 16 px downscale, against 67% for
   violet and 80% for dark. It clears the floor but it is the one file in the
   set with a thin margin. Keep it for large display, not for an avatar slot.
2. **All three variants pass at 32 px comfortably.** 16 px is where the spread
   opens up. 16 px is a real size: it is favicon scale and it is what some
   search and notification surfaces use.
3. **Do not upload the 1024 LinkedIn master to the logo slot.** LinkedIn states
   400 x 400 as the recommendation, and the master exists for decks and press.
4. **Threads has no separate upload.** It reads the Instagram photo.
5. **The dot inside the counter is the first thing to go at small size.** With
   the dot the 16 px counter-openness is 0.671; removing it lifts that to 0.786.
   The dot is kept because it is part of the mark, and because 0.671 is already
   comfortably above the floor. For a genuine 16 px slot such as a favicon, v3's
   existing no-dot asset remains the right file.

---

## 4. Which specs were confirmed at source, and which were not

Several of these changed in the last two years, so none were quoted from memory.

**Confirmed first-party:**

| Platform | Spec | Source |
|---|---|---|
| LinkedIn | logo min 268 x 268, recommended 400 x 400; cover 4200 x 700; PNG or JPEG; 3 MB | LinkedIn Help, "Image specifications for your LinkedIn Pages and Career Pages" |
| Google Business Profile | 720 x 720 recommended, 250 x 250 minimum, JPG or PNG, 10 KB to 5 MB | Google Business Profile Help, answer 6103862 |
| YouTube | icon renders 98 x 98, 15 MB, JPG/GIF/BMP/PNG no animation; banner 2560 x 1440 recommended, 2048 x 1152 minimum, safe area 1235 x 338, 6 MB | YouTube Help, "Manage your channel branding", answer 10456525 |

**`[UNVERIFIED]`, and what was assumed instead:**

| Platform | Assumed | Why it could not be confirmed |
|---|---|---|
| X | profile 400 x 400, header 1500 x 500, 2 MB | `help.x.com` returns HTTP 403 to any non-browser client. Both numbers are consistent across independent third-party guides, and both are long-standing, but neither was read from X. |
| Instagram | profile 1080 x 1080 uploaded | Instagram's help centre publishes post and Reel resolutions but no profile-photo dimension. 1080 is chosen to exceed any plausible display size rather than to match a stated one. |
| TikTok | profile 1080 x 1080 uploaded | TikTok's creator portal redirects to a page with no image specs. Same reasoning as Instagram. |
| Facebook | profile 1080 x 1080; cover 1702 x 630, mobile crop about 16:9 from centre | The Meta Business help page for cover dimensions renders client-side and returned no numbers. The 851 x 315 desktop figure and the mobile centre crop are third-party. The file is built so that a 16:9 centre crop loses no content, which makes the design correct under either reading. |

Where a spec is unverified the asset is built larger than any cited figure, so
the platform downscales rather than upscales. That is the safe direction under
uncertainty.

---

## 5. What was checked, and how

`build/verify_social.py` runs six checks. Every one is negative-controlled:
each detector is first shown **firing on a known-bad input** before its silence
on a shipped file is allowed to count. A checker that has never gone red is not
evidence.

| Check | What it asserts | Result |
|---|---|---|
| A | no retired-mark pixels | 18 of 18 |
| A-neg | the same detector fires on real retired assets | 4 of 4 |
| A-pos | and stays silent on v3 assets built by v3's own script | 3 of 3 |
| F | the shipped silhouette **is** the v3 mark, by IoU | 7 of 7 |
| F-neg | the retired mark's silhouette fails that test | 1 of 1 |
| B | no mark ink lost to a circular crop | 13 of 13 |
| B-neg | an oversized mark does lose ink | 1 of 1 |
| C | legible at 32 px and 16 px | 13 of 13 |
| C-neg | a hairline mark and a low-contrast mark both fail | 2 of 2 |
| D | mark against background at or above 3:1 | 13 of 13 |
| E | banner content inside the platform's safe box | 5 of 5 |
| E-neg | the same test against a tiny box fails | 1 of 1 |

Full per-file numbers are in `verification.json`.

### The retired-mark detector, and a correction to its stated rule

The rule handed over was "the retired ramp has G greater than R, the entire v3
violet ramp has R greater than or equal to G". Measured, that is very nearly but
not exactly true, and the exception shows up here for the first time.

Deriving it from the gradient stops rather than sampling: the v3 ramp runs
`#6366F1` to `#8B5CF6` to `#7C3AED`, so on the first leg `G - R = 3 - 50f` and
on the second `G - R = -47 - 19f`. **The most green-dominant colour v3 can
produce anywhere is +3**, at the pure `#6366F1` end.

It never surfaced on v3's own icons because there the ramp fills the mark, whose
ink begins at t=0.05, so pure `#6366F1` has no pixels. A full-bleed avatar puts
the ramp in the **background**, which does include the t=0 corner. The strict
form therefore fires on a few hundred entirely correct pixels.

The criterion used is stricter and better founded: **no pixel may exceed G - R
of +3**, meaning the asset contains nothing outside v3's own green-dominance
envelope. The worst pixel across all 18 files is exactly +3. The mildest retired
blue, `#032578`, is +34, and the retired assets measure up to +255. That is an
11x margin at the closest point.

### Legibility

A monoline mark fails small in one specific way: the counter fills in and the
ring fuses into a blob. So the metric is the counter, not the silhouette.

    openness = (L_counter - L_stroke) / (L_background - L_stroke)

1.0 means the gap between the dot and the ring still reads as pure background,
0.0 means it has fused with the stroke. Both are sampled from the **downscaled**
image, so the number reflects what the platform will actually show. Floors are
3.0:1 contrast (WCAG 1.4.11 for a non-text graphic) and 0.35 openness.

The two negative controls both go red: a hairline mark at 7 units of stroke
instead of 56 measures 1.37:1 and 0.15 openness, and a glyph one shade off its
own background measures 1.02:1.

---

## 6. Open items for whoever owns the v3 mark

Neither is a defect in this set. Both are inherited from v3 and are recorded
here because they were measured, not guessed.

1. **The mark is centred on its bounding box, not on its ink.** The ink centroid
   sits at (233.1, 284.4) in v3's 512-unit space against a bounding-box centre
   of (256, 252), so the mark's mass is 22.9 units left and 32.4 units below
   centre, which is 4.5% and 6.3% of the frame. Optical centring would shift it
   right and up by that much. This set deliberately does **not** apply that
   correction, because v3's favicon, app icons and maskable icon all centre the
   bounding box, and a social avatar that sat differently from the browser tab
   would be worse than one that is consistently slightly off. If it is worth
   fixing, fix it once in `render_v3.py` and rebuild everything, including this
   set.
2. **`v3/logo-full.svg` still carries a NOT PRODUCTION READY notice** saying the
   wordmark is live text that will fall back wherever Geist is missing. That is
   now out of date: Geist is installed at
   `docs/growth/CAMPAIGN-2026-07-30/_shared/fonts/Geist-Bold.ttf`, verified at
   usWeightClass 700 with full coverage of every character used here. The SVG
   still needs its text outlined before it is handed to a third party, but the
   blocking input is no longer missing.

---

## 7. Files

```
build/
  brandlib.py        mark, avatar, wordmark, lockup, backdrop
  checks.py          the detectors and their derivations
  build_social.py    the asset spec and the renderer
  verify_social.py   six checks, each negative-controlled
png/
  linkedin/   logo 400 violet + dark, 1024 master, cover 4200x700
  gbp/        logo 720 violet + white, cover 1024x576
  x/          profile 400 violet + dark, header 1500x500
  instagram/  profile 1080 violet + dark          (also serves Threads)
  tiktok/     profile 1080 violet
  facebook/   profile 1080 violet + dark, cover 1702x630
  youtube/    icon 800 violet, banner 2560x1440
proof/
  contact-sheet.png              every file at a glance
  small-size-simulation.png      128/64/48/32/16 px, square and circle cropped
  safearea-*.png                 safe box in red, actual content bounds in green
  negcontrol-*.png               the inputs the checkers were proven to reject
verification.json                per-file numbers behind every claim above
```

Geometry, palette and the gradient are imported from
`docs/growth/brand-identity-2026-07-29/v3/build/render_v3.py`. No brand number
is retyped here, so the mark on a LinkedIn banner is the same mark as the
favicon by construction rather than by inspection.
