# Social upload kit

One folder per platform. Every filename says its exact pixel size, so there is
nothing to work out at upload time. Built 2026-07-29 from the v3 mark.

## What goes where

| Platform | Avatar | Cover / banner |
|---|---|---|
| X | `x/x-profile-400x400.png` | `x/x-header-1500x500.png` |
| Instagram | `instagram/instagram-profile-320x320.png` | none, Instagram has no cover |
| Facebook | `facebook/facebook-profile-500x500.png` | `facebook/facebook-cover-1640x624.png` |
| YouTube | `youtube/youtube-profile-800x800.png` | `youtube/youtube-banner-2560x1440.png` |
| TikTok | `tiktok/tiktok-profile-200x200.png` | none, TikTok has no cover |
| LinkedIn | `linkedin/linkedin-profile-300x300.png` | company `1128x191`, personal `1584x396` |

**LinkedIn is two banner files on purpose.** Company pages and personal profiles
use different dimensions and one image cannot serve both. Use the company one on
the BrandGEO page and the personal one on Constantin's profile.

## The avatar

Every avatar is the same artwork, the gradient tile with the light `b` and its
centred dot. That is deliberate: it is the same design as the site favicon, so
the browser tab and the social avatar are one object rather than two cousins.

Each is resized with LANCZOS from `_master-avatar-1024x1024.png` rather than
uploaded at 1024 everywhere, because every platform re-encodes on upload and
hitting the documented size beats letting their compressor guess.

**Circular crop is safe, and this was measured rather than eyeballed.** Every
platform crops avatars to a circle. The glyph's furthest ink from centre sits
142.8px from the middle of a 512 grid against an inscribed radius of 256, so
there is 113.2px of clearance. It also survives a 90% tight crop.

If the gradient ever feels heavy against a particular platform's UI, the
alternative is `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`,
the dark `#0B0C10` card with a gradient glyph.

## The banners

Verified, not assumed. The YouTube banner's readable content was checked by
decoding pixels: it lands at (764, 581) to (1792, 767), inside the 1544x423 rect
that survives on a TV. Lowest contrast pair on any asset is muted text on card
surface at 4.95:1.

All banners are set in real Inter, extracted from the woff2 subsets vendored in
this repo and instantiated as static TTFs. No font was downloaded and none is
substituted.

## What is NOT in here

Post images and videos. Those live in `docs/growth/grok-launch/images/` and
`docs/growth/grok-launch/video/` and are **gated**: `ai_results` still holds zero
rows for `grok` and `ai_overview`, so anything making a measurement claim about
those two engines waits on a collection run.

**Avatars and banners are not gated.** They carry brand, not claims. Upload them
whenever you like.

## One obligation, if you post the videos

The voiceover voice is CC BY 4.0. This exact line has to appear in the
description of every published video carrying it:

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

See `assets/audio/ATTRIBUTION.md`. That is a licence condition, not a courtesy.
