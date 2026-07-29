# Channel production specs, 12 channels

**Compiled 2026-07-29. Every URL in this file was fetched on 2026-07-29 unless a
different date is stated inline.**

This is a production reference, not a strategy document. It exists so the asset
pipeline can emit a file that survives contact with the platform. Read the two
rules below before you use any number in it.

**Rule 1. Anything marked `[UNVERIFIED]` was NOT confirmed against
first-party documentation.** It is either widely repeated by aggregators, or
observed behaviour, or arithmetic derived from a first-party percentage. Do not
treat it as a spec. If an asset depends on an `[UNVERIFIED]` number and the
asset is expensive to remake, measure it on a real device first.

**Rule 2. Platform help centres and ad-spec pages disagree with each other
routinely, and both are first-party.** Where they disagree this file gives both
and says which one to build against. It never silently picks one.

A recurring pattern worth naming up front: for most of these platforms the
**organic** posting surface is barely documented, while the **advertising**
surface is documented to the pixel. So many numbers below come from ad-spec or
developer-API pages. Ad specs are a reliable floor for what the renderer accepts
and a reliable guide to crop behaviour, but ad text limits are usually SHORTER
than organic limits and must not be applied to organic posts.

---

## Brand constants that apply to every render

From `brandgeo/web/index.html` `:root`, read from the working tree 2026-07-29.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#090A0F` canvas per brief, `#0a0b0e` in the live file | See the note below |
| `--s` | `#101116` | Card surface |
| `--s2` | `#16171e` | Raised surface |
| `--bd` | `#23242b` | Hairline border |
| `--bd2` | `#32333c` | Stronger border |
| `--ac` | `#8b5cf6` | Primary violet. FILL only, 4.65:1 |
| `--ac-strong` | `#7c3aed` | CTA fill, 5.7:1 |
| `--ac-text` | `#a78bfa` | Accent WORDS, 7.23:1 |
| `--t` | `#e8e9ed` | Primary text, 16.22:1 |
| `--t2` | `#9ba1ac` | Secondary text, 7.58:1 |
| `--t3` | `#7d838f` | Muted text, 5.17:1 |
| `--ok` | `#34d399` | Positive |
| `--part` | `#fb923c` | Partial |
| `--bad` | `#f87171` | Negative |
| `--info` | `#c4b5fd` | Informational |
| `--warn` | `#fbbf24` | Risk, loss |
| Gradient | `#7c3aed` to `#6366f1` | Per brief |

**Canvas discrepancy, resolve before the first batch render.** The brief
specifies `#090A0F`. The live site's `--bg` is `#0a0b0e`. These are visually
indistinguishable but they are not the same value, and a pipeline that hardcodes
one while the site serves the other will produce assets that fail a byte-level
brand check later. Pick one and record it. This file uses the brief's `#090A0F`
in the render matrix and flags the site as the other candidate.

Rules that hold on every channel:

- Dark only. There is no light variant of a social asset. Never a white
  background, including no white letterboxing.
- `--ac` `#8b5cf6` is a fill. White text on it measures 4.23:1, which fails AA
  for body copy. Accent text is `--ac-text` `#a78bfa`.
- Social platforms recompress aggressively. Export PNG for anything with flat
  fields of `--bg` and violet, because JPEG blocks badly on near-black
  gradients. Where a platform accepts only JPEG (Instagram via API, see below),
  export at quality 95 or higher and accept the banding.
- Every video needs burned-in captions in addition to any sidecar caption file.
  Assume sound off. Assume the sidecar file is ignored.

---

## 1. Blog and website, getbrandgeo.com

Static HTML on cPanel. This is the only channel where BrandGEO controls the
renderer, so the constraints are self-imposed except for the link-preview card,
which is consumed by other platforms and is therefore governed by their rules.

### Images

| Asset | Pixels | Notes |
|---|---|---|
| Article hero | 1600 x 900 (16:9) | Matches existing `bg-*-hero.jpg` convention in `brandgeo/web/images/` |
| OG / link preview card | 1200 x 630 | 1.91:1. Governed by Facebook's spec, below |
| Inline diagram | 1200 wide, height free | Retina-safe at 600 CSS px |
| Favicon | 32 x 32, 180 x 180 apple-touch | |

**OG card, first-party:** "Use images that are at least 1200 x 630 pixels for
the best display on high resolution devices." Minimum allowed dimension is
200 x 200. "At the minimum, you should use images that are 600 x 315 pixels to
display link page posts with larger images." Aspect ratio as close to 1.91:1 as
possible. "The size of the image file must not exceed 8 MB."
Source: https://developers.facebook.com/docs/sharing/webmasters/images/ retrieved
2026-07-29.

The same 1200 x 630 file serves LinkedIn's and X's link cards. X's
`summary_large_image` card and LinkedIn's link unfurl both accept 1.91:1 without
a dedicated render. `[UNVERIFIED]` for X specifically: X's current first-party
card documentation was not reachable during this compilation (`docs.x.com` card
paths returned 404, `developer.x.com` returned 402). Treat 1200 x 630 as the
working value and confirm against a live post before relying on it for a
campaign.

### Text

No hard caps. Practical SEO targets, all `[UNVERIFIED]` because search engines
publish no character limit, only rendering behaviour:

- `<title>`: aim 50 to 60 characters before the SERP truncates.
- `<meta name="description">`: aim 150 to 160.
- H1: one per page.

### Posting constraints

Deploys via GitHub webhook to `brandgeo/web/deploy.php` on cPanel. Netlify is not
involved in the marketing site. Two known hazards documented in `CLAUDE.md`:
pushes over 20 commits silently under-deploy because GitHub caps the webhook
payload's `commits[]`, and deploy success is not observable from outside the
server. Verify any content push over HTTP before declaring it live.

**JSON-LD validation is mandatory on every page this pipeline emits.** Three
FAQPage schemas shipped invalid and were silently dropped by consumers before
anyone noticed. On a product whose thesis is being parsed correctly by AI
engines, this is not optional.

---

## 2. LinkedIn, personal profile and company page

The two surfaces differ in ways that matter for production. Personal profiles
get a different cover aspect ratio from company pages, and only company pages can
be posted to by a third-party scheduler through the official API without the
member's own token.

### Images

| Asset | Pixels | Verified? |
|---|---|---|
| Personal profile photo | 400 x 400 minimum, square | `[UNVERIFIED]` |
| Personal cover / background | 1584 x 396 | `[UNVERIFIED]` |
| Company page logo | 300 x 300 | `[UNVERIFIED]` |
| Company page cover | 1128 x 191 | `[UNVERIFIED]` |
| In-feed image, landscape | 1200 x 627 (1.91:1) | Derived, see below |
| In-feed image, square | 1200 x 1200 | Derived |
| In-feed image, portrait | 1080 x 1350 (4:5) | First-party max for 4:5 |
| Carousel / document slide | 1080 x 1350 | `[UNVERIFIED]` |
| Link preview card | 1200 x 627 | `[UNVERIFIED]` |

**Why so much is unverified here.** LinkedIn's help-centre pages for profile and
page image sizes are behind an interstitial that returns 403 to a plain client.
The numbers above are the ones every aggregator publishes and they are almost
certainly right, but this file will not present them as confirmed. If a
profile-level asset matters, upload it and look at it.

**What IS first-party.** From the Images API
(https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/images-api,
page dated `ms.date: 2026-06-19`, retrieved 2026-07-29):

- "Images with less than 36,152,320 pixels." That is a total pixel-count ceiling,
  not a dimension ceiling. 1080 x 1350 uses 1,458,000 of it, so it is not a
  practical constraint for social work.
- "JPG, GIF, and PNG formats."
- "GIF format supports up to 250 frames."
- `altText`: "Maximum length is 4,086 characters, recommended length is less than
  120 characters."

And from the Video Ads specifications
(https://www.linkedin.com/help/lms/answer/a424737, retrieved 2026-07-29), which
is the only first-party page giving LinkedIn pixel dimensions per aspect ratio:

| Aspect | Recommended | Minimum | Maximum |
|---|---|---|---|
| 16:9 horizontal | 1920 x 1080 or 1200 x 675 | 640 x 360 | 1920 x 1080 |
| 1:1 square | not stated | 360 x 360 | 1920 x 1920 |
| 4:5 vertical | 720 x 900 | 360 x 450 | 1080 x 1350 |
| 9:16 vertical | 720 x 1280 | 360 x 640 | 1080 x 1920 |

Build to the MAXIMUM column, not the recommended column. LinkedIn's recommended
values are conservative and downscaling is free.

### Video

First-party, two sources that disagree. Both are LinkedIn.

| Spec | Value | Source |
|---|---|---|
| Format | MP4 | Videos API and ad specs agree |
| Codec | H.264 or VP8 | Ad specs |
| Duration | 3 seconds to 30 minutes | Both agree |
| Frame rate | Less than 30 FPS | Ad specs |
| Audio | AAC or MPEG4, less than 64 kHz | Ad specs |
| Captions | SRT only, one file per video, English only | Videos API |
| File size | **Between 75 KB and 500 MB** | Videos API prose, and ad specs |
| File size | **"Maximum allowed Videos size is 5GB"** | Videos API schema, `initializeUpload.fileSizeBytes` field |

**The 500 MB versus 5 GB conflict.** Both statements are on the same Microsoft
Learn page. The 500 MB figure appears in the "Video File Size Specifications"
prose section and is corroborated by the separate ad-specs help article. The 5 GB
figure appears in the schema table as the description of the `fileSizeBytes`
field. **Build to 500 MB.** The prose section is corroborated by a second
independent first-party page; the schema field is most plausibly the API
gateway's own transport ceiling rather than the product's accepted maximum, and
exceeding 500 MB risks a `PROCESSING_FAILED` after a completed multipart upload,
which is the worst failure mode available. Source:
https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/videos-api,
page dated `ms.date: 2026-02-12`, retrieved 2026-07-29.

Uploads are multipart in 4 MB parts (`split -b 4194303`). Upload URLs expire
about 30 days after initialization.

**Safe area:** `[UNVERIFIED]`. LinkedIn publishes no safe-zone geometry for
vertical video. LinkedIn vertical video is a comparatively recent surface and the
UI chrome is not stable enough to design against. Recommendation: use the Meta
Reels safe zone (below) as a conservative proxy, since it is more aggressive than
anything LinkedIn currently overlays.

### Text

First-party, from the ad specs page:

| Field | Limit | Truncation |
|---|---|---|
| Introductory text | 3,000 characters | See below |
| Headline | 200 characters maximum | "Use up to 70 characters to avoid truncation on most devices" |
| Destination URL | 2,000 characters | |
| Ad name | 255 characters | |

The 3,000-character introductory-text limit is the ad surface. The organic
post-composer limit is widely reported as the same 3,000 and is almost certainly
identical, but that is `[UNVERIFIED]`.

**The "see more" fold on an organic LinkedIn feed post is the number that
actually governs copy, and it is `[UNVERIFIED]`.** LinkedIn publishes no figure.
Commonly cited: about 140 characters on mobile and about 210 on desktop before
"see more". Treat 140 as the working budget: the hook must land inside the first
140 characters or it is not read. The 70-character headline guidance above is the
only truncation number LinkedIn states in its own words, and it points the same
direction.

**Hashtags:** no published limit. Three to five is the conventional count on
LinkedIn and more reads as spam. `[UNVERIFIED]`.

### Links

Links are clickable in the post body. **Whether an outbound link suppresses reach
is `[UNVERIFIED]` and LinkedIn has never confirmed it.** The mitigation everyone
uses, link in the first comment, is folklore, and it costs a click either way.
Recommendation for BrandGEO: put the link in the post. The audience is B2B and
sending them hunting through comments for a URL costs more than any unproven
algorithmic penalty.

### Posting constraints

- Company pages: the Posts API supports scheduled third-party publishing with
  `w_organization_social`. The caller must have ADMIN or DSC permission on the
  page. Third-party schedulers post natively.
- Personal profiles: `w_member_social` is write-only. A token with only
  `w_member_social` cannot even `GET` its own images through the versioned
  gateway. Practical effect: personal-profile automation is more fragile than
  page automation, and most schedulers handle personal profiles worse.
- LinkedIn versions its Marketing APIs monthly (`Linkedin-Version: YYYYMM`) and
  sunsets old versions. Marketing Version 202507 is already sunset as of the
  retrieved page. Any integration will break on a schedule. Plan for it.

---

## 3. X, thread format

### Images

| Asset | Pixels | Verified? |
|---|---|---|
| Profile photo | 400 x 400 | `[UNVERIFIED]` |
| Header / banner | 1500 x 500 | `[UNVERIFIED]` |
| In-feed image | 1600 x 900 (16:9) or 1200 x 1200 (1:1) | Derived from aspect ratio limits |
| Link card, large | 1200 x 630 | `[UNVERIFIED]` |

First-party constraints, from
https://docs.x.com/x-api/media/quickstart/best-practices retrieved 2026-07-29:

- Formats: **JPG, PNG, GIF, WEBP**.
- Maximum file size: **5 MB** for standard images, **15 MB** for animated GIFs.
- Animated GIF maximum dimensions: **1280 x 1080**.
- Per post: **up to 4 photos, 1 animated GIF, or 1 video**. Not mixed.

There is no published maximum pixel dimension for static images. Aspect ratio is
what governs crop. Build in-feed images at 16:9 for a full-width uncropped card.

### Video

First-party, same source:

| Spec | Value |
|---|---|
| Max file size | 512 MB |
| Duration | Between 0.5 seconds and 140 seconds |
| Resolution range | Between 32 x 32 and 1280 x 1024 |
| Frame rate | 60 FPS or less |
| Aspect ratio | Between 1:3 and 3:1 |
| Video codec | H.264 High Profile |
| Audio codec | AAC with Low Complexity profile, mono or stereo, "not 5.1 or greater" |
| Pixel format | "Only YUV 4:2:0 is supported" |
| Minimum video bitrate | 5,000 kbps |
| Minimum audio bitrate | 128 kbps |
| Recommended landscape | 1280 x 720, 640 x 360, 320 x 180 |
| Recommended portrait | 720 x 1280, 360 x 640, 180 x 320 |
| Recommended square | 720 x 720, 480 x 480, 240 x 240 |

**Conflict, and it is a big one.** The API best-practices page caps resolution at
1280 x 1024 and duration at 140 seconds. X's own help centre states that Premium
subscribers can upload videos up to **4 hours** at **1080p**, that "videos
shorter than 4 hours (1080p) should not exceed 16GB", and that "subscribed users
can upload a 1080p video and get 1080p playback, while unsubscribed users can
upload a 720p video and get a 720p playback".
Source: https://help.x.com/en/using-x/premium-longer-videos via search 2026-07-29.

Resolution: **the 140-second / 1280 x 1024 / 512 MB limits govern anything posted
through the API.** The 4-hour / 16 GB / 1080p limits are a first-party consumer
feature of the x.com composer and X for iOS, available only to Premium
subscribers, and they are not reachable from a scheduler. Since BrandGEO's
pipeline posts programmatically, **build to 1280 x 720 and under 140 seconds.**
If a long-form cut is ever needed on X it must be posted by hand from the app.

**Safe area:** X does not publish one and the feed player does not overlay
persistent chrome on 16:9 video. `[UNVERIFIED]` but low risk. Keep captions out
of the bottom 12 percent to clear the scrubber.

### Text

- Standard post: **280 characters**. `[UNVERIFIED]` as a first-party citation in
  this pass, the `help.x.com` how-to-post page returned 403. It is not seriously
  in doubt.
- Premium: **"Longer posts can have up to 25,000 characters."** Source:
  https://help.x.com/en/using-x/x-premium via search 2026-07-29.
- **Notification cutoff, first-party and load-bearing for threads:** "If you
  mention an account in the first 280 characters of your post they will be
  notified. If you mention an account after the first 280 characters of your
  post, currently they will not be notified." Any @mention that matters must sit
  in the first 280 characters.
- Longer posts cannot be drafted or scheduled on web, per the same source. That
  makes 25,000-character posts effectively manual.

**Truncation.** A standard 280-character post does not truncate. A Premium longer
post collapses behind "Show more" at roughly the first 280 characters
`[UNVERIFIED]`. For BrandGEO the practical rule is the same either way: the first
280 characters are the whole ad.

**Thread structure.** No first-party limit on thread length. Practical guidance:
post 1 carries the hook and no link, posts 2 through N carry the argument, the
final post carries the link. `[UNVERIFIED]` as to whether that helps reach.

**Hashtags.** No limit. One or two, or zero. X hashtags no longer function as
discovery on this platform and read as dated.

### Links

Links are clickable. **Whether links suppress reach on X is `[UNVERIFIED]` and X
has made contradictory public statements about it.** The stable, defensible
practice is: no link in the first post of a thread, link in the last post. That
costs nothing if the penalty is imaginary and saves the thread if it is not.

### Posting constraints

The API is paid and tiered. Free tier is write-only at a very low volume. Any
real scheduling requires a paid tier. Third-party schedulers do post natively but
their per-account quota is the app's quota, not yours. Premium-only features
(25,000-character posts, 4-hour video) are not available through the API at all.

---

## 4. X, single post

Everything in section 3 applies. The differences that change production:

- **No thread means the entire argument is 280 characters.** There is no second
  post to carry nuance. This is a hook-only format.
- Media earns its place differently. In a thread, image posts are optional
  support. In a single post, the image IS the content and text is the caption.
  Build the single-post image to carry the claim standalone at 1600 x 900.
- Link placement has no good answer here. There is no last post to hide it in. If
  the post needs a link, it goes in the post.
- A quote-post of an existing high-performing post is a distinct single-post
  format and inherits the quoted post's card. Nothing to render.

---

## 5. Threads

The best-documented platform in this file, by a wide margin. Meta publishes
Threads media specs as an actual table.

All specs below from https://developers.facebook.com/docs/threads/posts retrieved
2026-07-29, and quota figures from
https://developers.facebook.com/docs/threads/troubleshooting retrieved 2026-07-29.

### Images

| Spec | Value |
|---|---|
| Formats | "JPEG and PNG image types are the officially supported formats" |
| Max file size | 8 MB |
| Aspect ratio limit | 10:1 |
| Minimum width | 320 px |
| Maximum width | 1440 px |
| Colour space | sRGB |

**The 1440 px maximum width is the single most important number on this
channel** and it is the one aggregators get wrong. Do not send a 2048 px asset.
Render Threads images at exactly **1440 x 1800** (4:5) or **1440 x 1440** (1:1).

Profile picture dimensions: `[UNVERIFIED]`. Threads inherits the Instagram
profile photo and Meta publishes no pixel spec for it. 320 x 320 minimum is safe
given the 320 px floor above.

### Video

| Spec | Value |
|---|---|
| Container | MOV or MP4 (MPEG-4 Part 14) |
| Video codec | HEVC or H264 |
| Audio codec | AAC, 48 kHz sample rate maximum |
| Max horizontal pixels | 1920 |
| Aspect ratio | Between 0.01:1 and 10:1 |
| Frame rate | 23 to 60 FPS |
| Max duration | 300 seconds (5 minutes) |
| Max bitrate | 100 Mbps |
| Max file size | 1 GB |

Aspect ratio 0.01:1 to 10:1 is effectively unconstrained. Build 1080 x 1920.

**Safe area:** not published. `[UNVERIFIED]`. Threads video plays inline in a
feed card rather than full-bleed, so UI overlay is much less aggressive than
Reels. Use the Meta Reels safe zone as a conservative proxy if the same master is
being reused.

### Carousels

- Minimum **2** children, maximum **20**. Threads allows twice Instagram's
  carousel length.
- A carousel counts as one publish against the quota.

### Text

- **500 characters.** Hard cap.
- **Emoji are "counted as the number of UTF-8 bytes."** A single emoji can cost
  4 characters, and a ZWJ sequence such as a multi-person family emoji can cost
  well over 20. **Do not budget Threads copy with a naive `.length` count.** This
  is a real failure mode: copy that measures 480 in a text editor can be rejected
  at 500 bytes.
- Truncation point: `[UNVERIFIED]`. Threads collapses long posts behind "More" at
  roughly 4 lines of rendered text, which is display-width dependent, not
  character-count dependent. Front-load regardless.
- Hashtags: Threads supports a single topic tag per post, not a hashtag block.
  `[UNVERIFIED]` as to the hard count. Treat it as one.

### Links

Links are clickable and Threads renders a link preview card. **No evidence of
reach suppression, and unlike X and LinkedIn, no folklore either.** Put the link
in the post.

### Posting constraints

Quotas per rolling 24 hours, first-party:

| Action | Quota |
|---|---|
| Publish post | 250 |
| Reply | 1,000 |
| Delete | 100 |
| Location search | 500 |

Third-party schedulers post natively through the Threads API. Fediverse sharing
is a per-account setting that affects distribution, not rendering.

---

## 6. Facebook

### Images

| Asset | Pixels | Verified? |
|---|---|---|
| Page profile picture | 170 x 170 displayed, upload 320 x 320 | `[UNVERIFIED]` |
| Page cover | 820 x 312 desktop, 640 x 360 mobile | `[UNVERIFIED]` |
| In-feed image, portrait | **1440 x 1800** (4:5) | First-party |
| In-feed image, landscape | 1200 x 630 (1.91:1) | Derived from OG spec |
| Link preview / OG card | **1200 x 630**, min 200 x 200, min 600 x 315 for the large card, max 8 MB | First-party |
| Carousel card | 1080 x 1080 (1:1) | `[UNVERIFIED]` |

Feed image spec, first-party, from
https://www.facebook.com/business/ads-guide/update/image/facebook-feed retrieved
2026-07-29:

- File type **JPG or PNG**
- Aspect ratio **4:5**, tolerance **3%**
- Resolution **1440 x 1800**
- Maximum file size **30 MB**
- Minimum width **600 px**

Note the 4:5 recommendation. Facebook's feed now prefers portrait, same as
Instagram's. A 1.91:1 landscape asset will render smaller and lose vertical
real estate. **Build Facebook feed images portrait unless the asset is a link
post, in which case it is the 1.91:1 OG card and you do not control the crop.**

OG card spec source:
https://developers.facebook.com/docs/sharing/webmasters/images/ retrieved
2026-07-29.

### Video, Facebook Reels

First-party, from https://developers.facebook.com/docs/video-api/guides/reels-publishing/
retrieved 2026-07-29:

| Spec | Value |
|---|---|
| File type | ".mp4 (recommended)" |
| Aspect ratio | 9:16 |
| Resolution | 1080 x 1920 recommended, minimum 540 x 960 |
| Frame rate | 24 to 60 FPS |
| Duration | 3 to 90 seconds |
| Video codec | H.264, H.265 (VP9, AV1 also supported) |
| Video settings | Chroma subsampling 4:2:0, closed GOP 2 to 5 seconds, fixed frame rate, progressive scan |
| Audio codec | AAC Low Complexity |
| Audio bitrate | 128 kbps or higher |
| Audio channels | Stereo |
| Sample rate | 48 kHz |

**Conflict.** The Facebook Reels ad-spec page
(https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels,
retrieved 2026-07-29) states resolution **1440 x 2560** and max file size
**4 GB**, and accepts MP4, MOV and GIF. The developer Reels-publishing guide
states 1080 x 1920 recommended and lists no file-size ceiling.

Resolution: **build 1080 x 1920 MP4.** The developer guide governs API publishing,
which is what the pipeline does. 1440 x 2560 is the ad renderer's higher ceiling
and there is no benefit to exceeding the organic recommendation, since Meta
transcodes down anyway. The **90-second maximum from the developer guide is the
constraint that actually bites** and the ad page's "no maximum duration" does not
apply to organic Reels.

**Safe area, first-party percentages.** Meta states: leave roughly **14% of the
top, 35% of the bottom, and 6% on each side** free of text, logos and key
creative, to avoid the profile icon and call-to-action covering them.
Source: https://www.facebook.com/business/help/980593475366490 via search
2026-07-29. The page itself returns only its title to a plain client, so the
percentages are quoted from Meta's own indexed summary rather than read off the
rendered page. Treat the percentages as first-party and the pixel arithmetic
below as derived.

Derived for a 1080 x 1920 master:

| Edge | Percentage | Pixels |
|---|---|---|
| Top | 14% | 269 px |
| Bottom | 35% | **672 px** |
| Left and right | 6% each | 65 px each |

**The 35% bottom inset is the number that breaks vertical video.** On a 1920 px
tall master, the bottom 672 pixels are covered. Burned-in captions placed at a
"comfortable" 200 px from the bottom sit under the caption text, the audio
attribution and the CTA button. The usable content band on a 1080 x 1920 Reel is
**y = 269 to y = 1248**, which is 979 px tall, roughly half the frame. Design for
that band, not for the frame.

### Text

| Field | Limit | Source |
|---|---|---|
| Feed ad primary text | "50 to 150 characters" recommended, headline 27 characters | Ads guide, first-party recommendation not a cap |
| Reels ad primary text | 40 characters, headline 55 characters | Ads guide |
| Organic post hard cap | 63,206 characters | `[UNVERIFIED]` |
| Organic truncation | about 477 characters before "See more" | `[UNVERIFIED]` |

The ad-guide numbers above are recommendations for ad copy and **must not be
applied to organic posts.** They are recorded here only because they are the only
first-party figures Facebook publishes, and because they are a useful signal of
where Facebook thinks attention runs out: 40 characters on Reels, 27 for a
headline.

The 63,206 hard cap and the 477-character fold are the two numbers every operator
uses and neither is documented by Meta. Budget organic Facebook copy to **125
characters before the fold** and it will be safe on every surface including
Reels.

Hashtags: no published limit, and hashtags do essentially nothing on Facebook.
Use zero to two.

### Links

Clickable. Link posts render the OG card and the card replaces the image, so a
link post and an image post are mutually exclusive. **Whether outbound links
suppress Facebook reach is `[UNVERIFIED]`**, though it is the most widely
believed of the three (X, LinkedIn, Facebook) and Facebook's own product
direction has consistently favoured on-platform content. For BrandGEO the link is
the point, so post the link and accept the cost.

### Posting constraints

Third-party schedulers post natively to Pages via the Graph API. **Personal
profiles cannot be posted to by third parties at all**, which is not a
limitation of any scheduler, it is Meta policy. Everything on this channel
assumes a Page.

---

## 7. Instagram, feed carousel

### Images

| Asset | Pixels | Verified? |
|---|---|---|
| Profile picture | 320 x 320 upload | `[UNVERIFIED]` |
| Feed, portrait | 1080 x 1350 (4:5) | Derived, see below |
| Feed, square | 1080 x 1080 (1:1) | Derived |
| Feed, landscape | 1080 x 566 (1.91:1) | Derived |
| Carousel slide | 1080 x 1350, all slides same ratio | Derived |

First-party constraints, from
https://developers.facebook.com/docs/instagram-platform/content-publishing
retrieved 2026-07-29:

- **"JPEG is the only image format supported. Extended JPEG formats such as MPO
  and JPS are not supported."** This is the API constraint and it is
  non-negotiable. **PNG will be rejected.** For BrandGEO's near-black canvas this
  is the worst constraint in this document: `#090A0F` fields with a violet
  gradient will band under JPEG. Mitigations: export at quality 95 or above,
  add a very low-amplitude dither or noise layer (about 1 to 2 percent) across
  gradient regions, and avoid large smooth gradients on Instagram assets
  specifically. Prefer flat fields and hard edges here.
- **"Carousels are limited to 10 images, videos, or a mix of the two."** Half of
  Threads' 20.
- **"Instagram accounts are limited to 100 API-published posts within a 24-hour
  moving period."** A carousel counts as one.
- Alt text is available on the media endpoint as of March 2025.

From https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/reference/media-requirements
retrieved 2026-07-29:

- Supported aspect ratios: **1:1, 1.91:1, 4:5, and anything between 1.91:1 and
  4:5.**
- Minimum width **600 px**, recommended **640 px or larger**.

The 1080-px-wide convention is not stated first-party anywhere I could reach; it
is derived from Instagram's long-standing display width. `[UNVERIFIED]` as an
exact figure, but 1080 x 1350 is inside every stated constraint and is the
safest single carousel size.

**All slides in a carousel must share one aspect ratio.** Mixed ratios get
centre-cropped to the first slide's ratio. `[UNVERIFIED]` as a documented rule,
reliable as observed behaviour.

### Text

- Caption: **2,200 characters** for ads targeting Instagram only, first-party
  from the media-requirements page above. The organic caption limit is the same
  2,200 and is universally reported as such, but Instagram's own help centre does
  not state it. `[UNVERIFIED]` for organic.
- **Hashtags: "You can use up to 30 tags on a post."** First-party, from
  https://help.instagram.com/351460621611097 via search 2026-07-29. Also
  first-party: numbers are allowed in hashtags; spaces and special characters
  such as `$` or `%` do not work.
- **Truncation: about 125 characters before "more".** `[UNVERIFIED]`, Instagram
  publishes nothing. This is the working budget. The first 125 characters must
  carry the hook and must not contain hashtags.

Recommended hashtag count for BrandGEO: 5 to 10, placed at the end of the caption
or in the first comment. Thirty is permitted and reads as spam.

### Links

**Links in Instagram captions are not clickable. Full stop.** This is the
defining constraint of the channel and it is not folklore, it is how the product
works. The link goes in the profile bio, or in a link-in-bio page, or in a Story
sticker if the account is eligible. Every Instagram caption BrandGEO writes must
end with an explicit pointer to the bio, because there is no other path.

### Posting constraints

Third-party schedulers post natively via the Content Publishing API, subject to
the 100-posts-per-24-hours ceiling. Requires an Instagram professional account
(Business or Creator) linked appropriately. Personal Instagram accounts cannot be
published to programmatically.

---

## 8. Instagram, Reels

Inherits Instagram's account-level constraints (100 API posts per 24 hours, JPEG
only for the cover image, links not clickable, 30 hashtags, 2,200-character
caption).

### Video

First-party, from Instagram's Reels specification as published by Meta
(https://developers.facebook.com/docs/instagram-platform/content-publishing and
the Reels specification table surfaced from developers.facebook.com, retrieved
2026-07-29):

| Spec | Value |
|---|---|
| Container | MOV or MP4 (MPEG-4 Part 14), no edit lists, `moov` atom at the front of the file |
| Video codec | HEVC or H264, progressive scan, closed GOP, 4:2:0 chroma subsampling |
| Frame rate | 23 to 60 FPS |
| Audio codec | AAC, 48 kHz sample rate maximum, 1 or 2 channels (mono or stereo) |
| Aspect ratio | "9:16 is recommended to avoid cropping or blank space" |

**The `moov` atom placement requirement is easy to miss and it silently fails
uploads.** Most encoders write `moov` at the end by default. Add `-movflags
+faststart` to any ffmpeg invocation that produces a Reel. This applies to
Facebook Reels and Threads video too.

**Numbers I could NOT verify first-party in this pass and will not guess:**

- `[UNVERIFIED]` Maximum Reel duration. Widely reported as 3 minutes for organic
  Reels since 2025, and 90 seconds before that. Meta's ads media-requirements
  page states 3 to 60 seconds, but that is the **ad** limit, not organic.
- `[UNVERIFIED]` Maximum file size for a Reel. The 8 MB figure that appears in
  some Meta-indexed summaries is the **cover-photo** limit, not the video limit,
  and treating it as the video limit will produce absurd encodes. Do not use it.
- `[UNVERIFIED]` Video bitrate ceiling and audio bitrate floor.

Build target: **1080 x 1920, H.264, 30 FPS, 8 to 12 Mbps, AAC stereo 128 kbps
48 kHz, under 90 seconds, under 250 MB.** Every one of those sits inside the
verified constraints and inside every reported unverified one. If a longer cut is
needed, test-post it before committing a batch.

**Cover photo:** 1080 x 1920 JPEG. The grid crop takes a 1:1 centre from it, so
anything that must survive the grid belongs in the centre square, roughly
y = 420 to y = 1500.

### Safe area

Instagram does not publish Reels safe-zone geometry separately from Meta's
Stories-and-Reels guidance. Use the Meta figures from section 6: **top 14% (269
px), bottom 35% (672 px), sides 6% (65 px each) on a 1080 x 1920 master.** Usable
band **y = 269 to y = 1248**.

That guidance is written for ads and therefore reserves space for a CTA button
that an organic Reel does not have. For organic Reels the bottom overlay is the
caption block, audio attribution and the action rail, which occupy less. But 35%
is the conservative number and there is no first-party organic figure, so build
to 35% and gain margin rather than build to a guess and lose captions.

**Right-edge note:** the action rail (like, comment, share, more, audio disc)
runs up the right side. Meta's 6% side inset (65 px) does not clear it. Keep
anything critical out of the right **180 px** on a 1080-wide master.
`[UNVERIFIED]`, measured convention, not documented.

---

## 9. TikTok

### Video

First-party, from
https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide/
retrieved 2026-07-29:

| Spec | Value |
|---|---|
| Containers | MP4 (recommended), WebM, MOV |
| Video codecs | H.264 (recommended), H.265, VP8, VP9 |
| Frame rate | Minimum 23 FPS, maximum 60 FPS |
| Resolution | Minimum 360 px, maximum 4096 px, on both height and width |
| Duration | 3 minutes for all creators; some have 5 or 10 minutes. **Maximum via API: 10 minutes** |
| Max file size | 4 GB |
| Chunked upload | 5 MB minimum per chunk, 64 MB maximum except the final chunk |

### Photos

First-party, same source:

| Spec | Value |
|---|---|
| Formats | WebP, JPEG |
| Resolution | Maximum 1080p |
| Max file size | 20 MB per image |

Note TikTok photo posts accept **WebP**, which none of the other channels here
do. There is no reason to use it; JPEG at 1080 x 1920 is fine.

### Ad-surface specs, for reference

From https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads retrieved
2026-07-29. These are the ad renderer's floors, useful as a sanity check:

- Vertical (recommended): 9:16, at least **540 x 960**
- Horizontal: 16:9, at least **960 x 540**
- Square: 1:1, at least **640 x 640**
- Formats: `.mp4, .mov, .mpeg, .3gp, .avi`
- File size: 500 MB or less
- Bitrate: 516 kbps or more
- Duration: up to 10 minutes

### Safe area

**TikTok publishes no safe-zone pixel values in text.** First-party, from the
in-feed ad specs page: "safe zone size is determined by the dimension (vertical,
horizontal, or square), ad caption length, and any additional formats used", and
TikTok directs advertisers to **download safe-zone template files** rather than
publishing numbers. Also first-party from the same page: the ad caption displays
a **maximum of 4 lines including emojis**, and TikTok recommends keeping captions
within **50 characters for CN/JP/KR or 100 characters in other languages** to
avoid being covered by the "See more" message.

Working values, all `[UNVERIFIED]`, for a 1080 x 1920 master:

| Edge | Pixels | What it clears |
|---|---|---|
| Top | 130 px | Following/For You tabs and search |
| Bottom | 480 px | Caption block, username, audio ticker, progress bar |
| Left | 60 px | |
| Right | 250 px | Action rail: avatar, like, comment, bookmark, share, spinning disc |

These are the numbers to use, but they are measurement-derived convention, not
documented. **The right-side inset is larger on TikTok than on Reels** because
TikTok's action rail is taller and sits further from the edge. If an asset must
be perfect, download TikTok's own safe-zone template from the ad specs page and
overlay it.

**The caption interacts with the safe zone**, which is why TikTok will not
publish one number: a 4-line caption pushes the bottom inset up. A short caption
buys back vertical space. For BrandGEO, keep TikTok captions **under 100
characters** and the 480 px bottom inset holds.

### Text

- Caption / title maximum: **"The maximum length is 2200 in UTF-16 runes."**
  First-party, https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
  retrieved 2026-07-29.
- **UTF-16 runes, not characters.** As with Threads, emoji and non-BMP characters
  cost more than one. Count in code units, not glyphs.
- Truncation: 4 lines, and TikTok's own recommendation of 100 characters. Treat
  **100 characters** as the real budget.
- Hashtags: no published limit; they count against the 2,200. Three to five is
  the working convention. `[UNVERIFIED]`.

### Links

**Not clickable in the caption.** Link goes in the bio. Same structural
constraint as Instagram. Business accounts can add a website field to the
profile.

### Posting constraints

Three first-party constraints that will shape the whole workflow:

1. **"Each user access_token is limited to 6 requests per minute."**
2. **"All content posted by unaudited clients will be restricted to private
   viewing mode."** Attempting a public post from an unaudited app returns
   `unaudited_client_can_only_post_to_private_accounts`. **Until the app passes
   TikTok's audit, every programmatic post is private and invisible.** This is
   the single largest gate on automating TikTok and it needs to be resolved
   before any TikTok content is produced at volume.
3. `privacy_level` must match a value returned by `/creator_info/query/` at post
   time. It cannot be hardcoded.

Source: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
retrieved 2026-07-29.

---

## 10. YouTube Shorts

### Video

First-party, from https://support.google.com/youtube/answer/12779649 retrieved
2026-07-29:

- **"Up to 3 minutes"**, "with a square or vertical aspect ratio".
- Up to 15 short videos can be selected at a time in one upload session.

Also first-party, from
https://support.google.com/youtube/answer/15424877 via search 2026-07-29: videos
uploaded on or after **15 October 2024** with a square or vertical aspect ratio
up to three minutes are categorised as Shorts.

**Classification is automatic and there is no "post as a Short" switch.** A
vertical or square upload of 3 minutes or less becomes a Short. A 16:9 upload
does not, regardless of length. This means the ONLY thing separating a Short from
a normal upload in the pipeline is the aspect ratio and duration of the file.

Google Ads guidance, first-party, from
https://support.google.com/google-ads/answer/16041697 via search 2026-07-29:
"Vertical videos with a 9:16 aspect ratio are best suited for the Shorts format
and deliver better performance compared to landscape assets", and video assets of
less than 60 seconds are recommended for the Shorts feed.

Container and codec: inherits the main YouTube upload pipeline. YouTube's
first-party guidance on that page is only "Use the H.264 codec to compress your
video file size while maintaining the video quality for YouTube."
Source: https://support.google.com/youtube/answer/71673 retrieved 2026-07-29.
A full first-party list of accepted containers was not reachable in this pass;
`[UNVERIFIED]` beyond MP4/H.264, which is certainly accepted.

Build target: **1080 x 1920, MP4, H.264, 30 FPS, AAC stereo, under 60 seconds.**

### Safe area

**YouTube publishes no Shorts safe-zone geometry.** `[UNVERIFIED]`.

Working values for 1080 x 1920:

| Edge | Pixels | What it clears |
|---|---|---|
| Top | 100 px | Search and Shorts label |
| Bottom | 380 px | Title, channel handle, subscribe button, progress bar |
| Right | 200 px | Like, dislike, comment, share, remix, audio |
| Left | 50 px | |

Shorts' bottom chrome is less aggressive than TikTok's and much less than Meta's
ad guidance. But since none of it is documented, **a single 1080 x 1920 master
built to the Meta 35% bottom inset (672 px) is safe on all four vertical
channels** and is what the render matrix assumes. Only relax that if a channel is
getting its own dedicated cut.

### Text

- Title: **100 characters.** Confirmed across YouTube Help articles via search
  2026-07-29 (`support.google.com/youtube/answer/57404`). The specific page did
  not render to a plain client in this pass; the figure is corroborated and not
  in doubt, but strictly `[UNVERIFIED]` as a direct quote.
- Description: **5,000 characters.** Same provenance.
- **Truncation on the Shorts player is severe.** The title shows roughly one to
  two lines over the video. `[UNVERIFIED]`. Budget **40 characters** for the
  Shorts title.
- Hashtags in the title are rendered above it and are clickable. First three
  hashtags from the description also surface. `[UNVERIFIED]` on the count. Use
  one to three.

### Links

Description links are clickable but are largely hidden behind the description
drawer on the Shorts player. Pinned comments are the more reliable placement.
`[UNVERIFIED]` as to relative click-through. Do both.

### Posting constraints

The YouTube Data API v3 supports programmatic upload. **The default quota is
10,000 units per day and a single video insert costs 1,600 units**, which caps a
default project at 6 uploads per day. `[UNVERIFIED]` in this pass; the quota page
was not fetched. Verify before planning any high-volume Shorts cadence, because
this is the constraint most likely to stop it.

---

## 11. YouTube, long-form

### Video

First-party, from https://support.google.com/youtube/answer/71673 retrieved
2026-07-29:

- **Maximum file size: "256 GB or 12 hours, whichever is less."**
- Accounts must be verified to upload longer than 15 minutes.
- "Use the H.264 codec to compress your video file size while maintaining the
  video quality for YouTube."

From https://support.google.com/youtube/answer/6375112 retrieved 2026-07-29:
standard 16:9 aspect ratio for computer playback; recommended resolutions run
240p through 8K; the player adapts to device.

Build target: **1920 x 1080 16:9, MP4, H.264, 30 FPS (or 24 for cinematic cuts),
AAC stereo 48 kHz.** 4K (3840 x 2160) if the source supports it, since YouTube
serves a better bitrate to 4K uploads even at 1080p playback. `[UNVERIFIED]` on
the bitrate claim, widely observed.

### Images

| Asset | Pixels | Source |
|---|---|---|
| Custom thumbnail | **3840 x 2160 recommended, minimum width 640 px**, 16:9 | First-party |
| Thumbnail file size | **2 MB on mobile, 50 MB on desktop** (10 MB / 50 MB for podcasts) | First-party |
| Thumbnail formats | **JPG, GIF, PNG** | First-party |
| Channel banner | **Minimum 2048 x 1152, 16:9. Recommended 2560 x 1440. Maximum 6 MB** | First-party |
| Banner safe area | **1235 x 338** at the minimum dimension | First-party |
| Profile picture | Square or round, no pixel spec published | `[UNVERIFIED]`, use 800 x 800 |

Thumbnail source: https://support.google.com/youtube/answer/72431 retrieved
2026-07-29.
Banner source and safe area: https://support.google.com/youtube/answer/10456525
via search 2026-07-29, corroborated by
https://support.google.com/youtube/answer/12950272 retrieved 2026-07-29, which
states "at least 2560x1440 px to achieve the best display on all devices" and
"Do not include any additional file embellishments (e.g. shadows, borders, and
frames)."

**The 1235 x 338 banner safe area is the most brutal crop in this document.**
Uploading 2560 x 1440 and putting the logo anywhere but a 1235 x 338 rectangle
centred in the frame means it is invisible on mobile. On a 2560 x 1440 upload
that safe rectangle scales to about 1544 x 423, centred: **x = 508 to 2052,
y = 509 to 932.** Everything outside it is decoration that only desktop and TV
viewers see.

**Thumbnail conflict worth knowing:** first-party, "vertical videos with 16:9
custom thumbnails will be replaced by an auto-generated 4:5 thumbnail" on certain
YouTube pages, though the custom version remains on watch feeds and non-mobile
platforms. Not relevant to a 16:9 long-form upload, relevant if a long-form cut
is ever uploaded vertical.

Practical thumbnail note for BrandGEO: **3840 x 2160 is overkill and costs upload
time.** 1920 x 1080 is inside spec (well above the 640 px minimum width), renders
identically at every display size YouTube uses, and keeps the file under the 2 MB
mobile limit without aggressive compression, which matters for a near-black
canvas.

### Text

- Title: **100 characters** `[UNVERIFIED]` as a direct quote, corroborated.
- Description: **5,000 characters** `[UNVERIFIED]` as a direct quote,
  corroborated.
- **Truncation: the description collapses after roughly 3 lines, about 157
  characters, behind "Show more".** `[UNVERIFIED]`. The link and the one-line
  pitch must be above that fold.
- Hashtags: first three from the description render above the title.
  `[UNVERIFIED]`.
- Captions: YouTube auto-generates them, but upload an SRT. Auto-captions
  mangle "GEO", "BrandGEO" and every engine name in this product's vocabulary.

### Links

Description links are clickable, no suppression, and this is the only video
channel in this document where that is true. Pinned comment as a secondary
placement. Cards and end screens are additional clickable surfaces; end screens
require the last 5 to 20 seconds of the video to leave room, so **build every
long-form cut with a 20-second end-screen-safe outro** where nothing important
occupies the right half or the lower third.

### Posting constraints

Data API v3 upload, subject to the same quota concern flagged in section 10.
Third-party schedulers post natively. Verified account required for anything over
15 minutes.

---

## 12. Google Business Profile

The odd one out. Not a social channel, and its constraints are almost entirely
about local search rather than engagement.

### Images

First-party, from https://support.google.com/business/answer/6103862 retrieved
2026-07-29:

| Spec | Value |
|---|---|
| Formats | JPG or PNG |
| File size | Between **10 KB and 5 MB** |
| Recommended resolution | **720 px tall, 720 px wide** |
| Minimum resolution | **250 px tall, 250 px wide** |
| Quality | "In focus and well lit, and have no significant alterations or excessive use of filters" |

**The 10 KB minimum is real and it will bite this brand.** A flat `#090A0F`
canvas with a small violet mark compresses extremely well and a 720 x 720 PNG of
mostly-black can land under 10 KB and be rejected. Add texture, a gradient, or
export at a higher resolution to clear the floor.

Cover photo and logo: Google states these help recognition but explicitly does
not guarantee placement. First-party: "in some instances, this action doesn't
guarantee the cover photo will show up as the first image for your business", and
if the logo does not display, ensure the profile has a name, street address,
categories, phone number and business hours. Low-quality cover photos may be
replaced by user-submitted alternatives. **No pixel spec is published for cover
or logo.** `[UNVERIFIED]`. Working values: cover 1024 x 576 (16:9), logo
720 x 720 (1:1).

**Processing delay, first-party: 24 to 48 hours before photos and videos appear.**
Do not schedule a GBP asset as part of a same-day launch.

### Video

First-party, same source:

| Spec | Value |
|---|---|
| Duration | Up to **30 seconds** |
| Resolution | **720p or higher** |
| File size | Up to **75 MB** |

30 seconds and 75 MB is the tightest video budget of any channel here. A 1080p
30-second H.264 clip at 12 Mbps is 45 MB, so 1080p fits comfortably. Build
16:9 1920 x 1080.

### Text

- Post text limit: **1,500 characters** `[UNVERIFIED]`. Google does not publish
  it on the help pages reachable in this pass; the figure is consistent across
  community threads on `support.google.com` and matches the composer's own
  counter, but a community thread is not documentation.
- **Truncation: roughly the first 80 to 100 characters** before "Read more" in
  the Search and Maps card. `[UNVERIFIED]`. This is the tightest fold in this
  document. The first sentence is the entire post for most viewers.
- Post lifespan, first-party: **"Posts older than 6 months are archived unless a
  date range is set."** Source:
  https://support.google.com/business/answer/7342169 retrieved 2026-07-29.

### Call to action buttons

First-party, from https://developers.google.com/my-business/content/posts-data
retrieved 2026-07-29. Exactly six action types:

`BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`, `CALL`.

For BrandGEO the correct button is **`LEARN_MORE`** pointing at the relevant
page, or **`SIGN_UP`** pointing at the signup flow. Offers automatically get a
"View Offer" button and do not take a custom one.

### Links

The CTA button is the link and it is clickable. **Plain URLs in the post body are
not reliably linkified** `[UNVERIFIED]`. Always use the button. Google's policy
explicitly blocks links to malware, viruses, phishing or pornographic material.

### Posting constraints

- The Google My Business API's post surface is **not open to general
  registration.** Access requires an approved quota request, and Google has been
  granting it narrowly for years. Most third-party schedulers that claim GBP
  support are either using a partner-level grant or are not posting natively.
  `[UNVERIFIED]` on the current approval posture, but plan for **manual posting**
  until an API grant is confirmed in writing.
- First-party: "Product Posts cannot be created via the Google My Business API at
  this time."
- Photos take 24 to 48 hours to appear regardless of posting method.

**Practical conclusion: treat GBP as a manual channel.** One post per week,
written to land in 80 characters, with a `LEARN_MORE` button, a 720 x 720 or
1024 x 576 image over 10 KB, posted by hand.

---

## Consolidated render matrix

The deduplicated set of unique output sizes. Twelve channels collapse to
**eleven renders**, and four of them cover everything that matters.

### Core set, produce these for every campaign

| # | Pixels | Ratio | Feeds | Format | Notes |
|---|---|---|---|---|---|
| R1 | **1080 x 1920** | 9:16 | IG Reels, TikTok, YouTube Shorts, FB Reels, LinkedIn 9:16, Threads video | MP4 H.264, and JPEG for covers | Build to the 672 px bottom inset. One master, five channels |
| R2 | **1080 x 1350** | 4:5 | IG feed, IG carousel, LinkedIn portrait, Threads (see R2a) | JPEG for IG, PNG elsewhere | The default still image |
| R3 | **1200 x 630** | 1.91:1 | Blog OG card, FB link post, LinkedIn link unfurl, X large card | PNG | One card serves four consumers |
| R4 | **1920 x 1080** | 16:9 | YouTube long-form, X in-feed video, LinkedIn 16:9, blog hero, GBP video | MP4 H.264 / PNG | |

### Channel-specific, produce only when that channel is in the plan

| # | Pixels | Ratio | Feeds | Notes |
|---|---|---|---|---|
| R2a | **1440 x 1800** | 4:5 | Threads image, Facebook feed image | Threads caps at **1440 px wide**, Facebook recommends **1440 x 1800**. Same file. Do NOT send this to Instagram, and do not send R2 to Threads at a larger width |
| R5 | **1080 x 1080** | 1:1 | FB carousel card, LinkedIn square, X square, IG square | Only when a square is deliberate |
| R6 | **1600 x 900** | 16:9 | X in-feed image, blog article hero | X's feed card. R4 downscales to this, so R6 is optional if the pipeline resizes |
| R7 | **2560 x 1440** | 16:9 | YouTube channel banner | Content confined to a centred **1544 x 423** rectangle |
| R8 | **1920 x 1080** | 16:9 | YouTube thumbnail | Same pixels as R4, different design. Keep under 2 MB |
| R9 | **1024 x 576** | 16:9 | GBP cover | Must exceed 10 KB |
| R10 | **720 x 720** | 1:1 | GBP photo, GBP logo | Must exceed 10 KB |
| R11 | **800 x 800** | 1:1 | Profile pictures, all channels | Downscales to every platform's avatar |

### Which channels share a render

- **R1 (1080 x 1920) is the highest-leverage file in the pipeline.** It serves
  Instagram Reels, TikTok, YouTube Shorts, Facebook Reels, LinkedIn vertical and
  Threads video. Six surfaces, one export, PROVIDED it is built to the most
  conservative safe area of the group, which is Meta's 672 px bottom inset. Build
  it to TikTok's or Shorts' looser chrome and it breaks on Reels.
- **R3 (1200 x 630) serves four link-preview consumers** with one file. The blog
  emits it as `og:image` and Facebook, LinkedIn and X all read it. No
  per-platform card render is needed.
- **R4 (1920 x 1080) serves four video surfaces.** X caps playback at 1280 x 1024
  so it downscales, but uploading 1920 x 1080 to X is accepted and harmless.
- **R2 and R2a look like duplicates and are not.** Both are 4:5. Instagram wants
  1080 wide and only accepts JPEG. Threads hard-caps at 1440 wide. Facebook
  recommends 1440 x 1800. Sending a 1440-wide file to Instagram is fine but
  wasteful; sending a 2048-wide file to Threads is rejected. Keeping them as two
  renders costs one export and removes a class of failure.
- **R4 and R8 are the same dimensions and must not be the same file.** A
  YouTube thumbnail is a poster, a video frame is a frame. They collide in any
  naming scheme that keys on dimensions alone, so key on purpose.

### Format matrix

| Render | Instagram | Everywhere else |
|---|---|---|
| Any still | **JPEG only**, quality 95+, dithered gradients | PNG |
| Any video | MP4, H.264, `-movflags +faststart` | Same |

The JPEG-only Instagram constraint and the `moov`-atom-first requirement are the
two encoder settings most likely to cause a silent failure. Set both globally.

---

## Open items, in priority order

1. **Resolve the canvas value.** `#090A0F` per the brief, `#0a0b0e` in the live
   `:root`. Pick one before the first batch render.
2. **TikTok app audit.** Until the app is audited, every programmatic TikTok post
   is private. This blocks the channel entirely, and it is a review process with
   a lead time, not a code change.
3. **YouTube Data API quota.** Verify the daily upload ceiling before planning a
   Shorts cadence. If it is 6 per day at default quota, that is the plan's cap.
4. **Verify the four vertical safe areas on real devices.** Meta's 14/35/6
   percentages are first-party but written for ads. TikTok's and Shorts' are
   entirely undocumented. One afternoon with a phone and a test render replaces
   every `[UNVERIFIED]` in the vertical section, and vertical is where the
   pipeline spends most of its output.
5. **Confirm the LinkedIn 500 MB versus 5 GB video ceiling** with one test upload
   before any long-form LinkedIn video is produced.
6. **Confirm the GBP 1,500-character post limit** and whether API posting access
   is obtainable, or accept GBP as permanently manual.
7. **Get first-party confirmation of the X link card spec.** `docs.x.com` card
   paths 404 and `developer.x.com` returns 402 to a plain client, so 1200 x 630
   is currently an assumption on the one channel where the card is the whole
   post.
