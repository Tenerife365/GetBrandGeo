# Canva setup, 2026-07-29

Status of BrandGEO's brand identity inside Canva, what the Connect API can and
cannot do on this account, and the manual steps the owner must perform.

Everything below was executed against the live connector today. Errors are
quoted verbatim. Nothing was published, shared, or made public.

---

## 1. Headline finding

**The account is on Canva Free. Brand Kits cannot be created, and brand
templates are hard-blocked at the plan tier.**

The premise of the task, set up an identity so every future generated design
inherits it, is **not achievable on this account today**, by API or by UI. It
needs a paid plan first. Everything else in this document works around that.

Two independent confirmations:

Canva's own help service, asked directly whether a Brand Kit can be created
through the Connect API:

> Brand Kit creation and use is available on Canva Pro, Canva Teams, Canva
> Business, Canva Education, Canva Enterprise, and Canva for Nonprofits plans.
> It is not available on Canva Free.
>
> Brand Kits can only be created and managed in the Canva editor UI, not
> through the Canva Connect API.

And `search-brand-templates`, called with `dataset: any`, returned:

> Error getting brand template dataset: This feature requires a Canva paid plan
> (such as Canva Pro, Canva Teams, or Canva Enterprise). Upgrade at
> https://www.canva.com/pricing to unlock this capability.

There is **no `create-brand-kit` tool** in the connector's tool set. Its absence
is not a permissions gap, it is by design, because the capability does not exist
in the Connect API at all.

`list-brand-kits` returns `{"items":[]}` and does **not** raise a scope error, so
the `brandkit:read` scope is granted. The account genuinely has zero brand kits.
Reconnecting the connector will not change this. Only a plan upgrade will.

---

## 2. What exists in Canva now

Created today, all private, nothing shared.

**Folder: BrandGEO Brand Assets**
`FAHQwpiyz5c`, https://www.canva.com/folder/FAHQwpiyz5c

| Item | ID | Type | Dimensions | Source |
|---|---|---|---|---|
| BrandGEO Mark Tile 512 | `MAHQwgc0JeA` | image | 512 x 512 | `getbrandgeo.com/favicon-512x512.png` |
| BrandGEO Mark Vector | `MAHQwt1JTM0` | image | 512 x 512 | `getbrandgeo.com/favicon.svg` |
| BrandGEO Mark Transparent | `MAHQwp2jPuE` | image | 799 x 1024 | `getbrandgeo.com/logo.png` |
| BrandGEO Mark Maskable 512 | `MAHQwv_OAuE` | image | 512 x 512 | `getbrandgeo.com/icon-maskable-512.png` |
| BrandGEO OG Card Reference | `MAHQwmYqbMc` | image | 1200 x 630 | `getbrandgeo.com/images/og-home.png` |
| Test design, 4:5 | `DAHQwuIlTPI` | design | 1080 x 1350 | `generate-design` |
| Test design, 9:16 | `DAHQwgtJd9g` | design | 1080 x 1920 | `resize-design` of the above |

Edit and view URLs rotate on each API read, so find the designs through the
folder rather than bookmarking a link.

### How the assets were ingested, and why it was safe

`upload-asset-from-url` only accepts URLs that are **already public**. The
v3 asset directory in the repo is local and private, so uploading from there was
not an option, and publishing those files to a file host to manufacture a URL
would have exposed them to the open internet. That was not done.

Instead, every asset above was pulled from `getbrandgeo.com`, where it is
**already live** as part of the favicon and logo rollout in commit `e827fa0`. All
nine candidate files were checked over HTTP against the working tree first and
are byte-size identical, so nothing new was exposed.

`logo-full.svg` was **not** uploaded, per the brief. Its wordmark is live text
rather than outlined paths. `logo.png` at 799 x 1024 was uploaded instead and was
verified by eye to be the bare mark, the lowercase b with the location dot on
transparency, with **no wordmark**, so the live-text problem does not apply to it.

### The SVG was rasterized, treat it as a raster

`favicon.svg` uploaded without error, but the response reported
`"type": "image"` with `"width": 512, "height": 512`, identical metadata and
identical smart tags to the PNG upload. Canva flattened it on ingest. There is no
editable vector in the account. **The largest usable mark in Canva is the
799 x 1024 PNG.** That is enough for a corner logo on a 1080-wide canvas but it
is not enough to scale a mark large as a hero element on a 1920 px render.

---

## 3. What the API can do, verified

Every row below was executed successfully today.

| Capability | Tool | Result |
|---|---|---|
| List brand kits | `list-brand-kits` | Works, returns empty, scope granted |
| Create folders | `create-folder` | Works |
| Upload assets from a public URL | `upload-asset-from-url` | Works, PNG and SVG both accepted, SVG rasterized |
| Organise items | `move-item-to-folder`, `list-folder-items` | Works |
| Generate designs | `generate-design` | Works, returns 4 candidates |
| Save a candidate | `create-design-from-candidate` | Works, creates a private design |
| Inspect a design | `read-design` | Works, returns metadata, page dimensions, text, thumbnails |
| Resize to custom pixels | `resize-design` | Works, **but metered, see below** |
| List export formats | `get-export-formats` | Returns pdf, jpg, png, pptx, gif, mp4 |
| Export a render | `export-design` | Works, exact pixels, no watermark |

**Export is the strongest capability here.** A PNG export of the 1080 x 1350
design returned a signed download URL, and the downloaded file measured exactly
1080 x 1350 with no watermark. If a brand-consistent design ever exists in this
account, the API can pull production files out of it reliably.

---

## 4. What the API cannot do

| Blocked | Reason |
|---|---|
| Create a Brand Kit | No such tool exists. Canva help confirms UI-only and paid-only |
| Create or search brand templates | Paid-plan error, quoted in section 1 |
| Create a brand template draft | `create-brand-template-draft` needs an existing `brand_template_id`. None can be obtained, because the search that would return one is plan-blocked. Not called, as there is no valid input to pass |
| Publish a brand template | Would publish. Not attempted, per the no-publish rule |
| Set arbitrary canvas dimensions at generation time | `generate-design` takes a fixed `design_type` enum with no width or height parameter |
| Upload an editable vector | SVG is accepted but flattened on ingest |

### resize-design is a metered trial, and one use remains

The resize to 1080 x 1920 succeeded, and the response carried:

> `"trial_information": {"uses_remaining": 1, "upgrade_url": "..."}`

**One use remains on the account.** I deliberately stopped there and did not
spend it. The resized output was not good enough to be worth the last credit,
for the reason in section 5, and burning it would have left the owner with none
and a second unusable artifact. That call is the owner's to make, not mine.

### Dimension coverage against the four priority renders

| Render | Pixels | Route | State |
|---|---|---|---|
| R2 | 1080 x 1350 | `design_type: instagram_post` | **Verified.** Native, no resize needed |
| R1 | 1080 x 1920 | `design_type: your_story`, or resize | Produced via resize. `your_story` is documented as a vertical story format but its exact pixel output was **not verified** |
| R3 | 1200 x 630 | No enum. Resize only | **Not produced.** Would consume the last trial use |
| R5 | 1080 x 1080 | No enum. Resize only | **Not produced.** No trial uses would remain |

Only 1080 x 1350 comes out of the API natively at a correct BrandGEO size.

---

## 5. The generate-design quality test, honestly

Run once, as instructed, on a real BrandGEO subject at 1080 x 1350. The prompt
carried the full brand rules: exact hex tokens, dark-only, Inter, no stock
photography, no faces, no emoji, editorial layout, and the uploaded mark passed
in `asset_ids`.

**What it got right**

- Correct dimensions, exactly 1080 x 1350.
- Dark background. It never went near white.
- The copy is placed verbatim and is not garbled.
- It used a violet.

**What it got wrong, and this is the important part**

1. **Exact brand hex values were not honoured.** A colour census of the exported
   PNG found the canvas is not a flat brand black but **seven different
   near-blacks**, `#08090e` at 48%, `#07090e` at 26%, `#07090d` at 16%, then
   `#08090d`, `#07080d`, `#05070d`, `#06080d`. None of them is `#0a0b0e` and none
   is `#090A0F`. Canva applied its own subtle gradient texture over the canvas.
2. **The violet is wrong.** The only accent in the render measures `#6f4bf7`.
   That is neither `--ac-strong` `#7c3aed` nor `--ac` `#8b5cf6`. It is a
   different violet.
3. **The supplied mark was silently ignored.** The asset ID was accepted without
   error and the mark appears nowhere in the output.
4. **The layout is unusable.** Type is tiny, roughly 15% of canvas width, and
   floats in a sea of dead space. It would be illegible at feed scale.
5. **The call-to-action button is an empty violet rectangle with no label.** The
   accent occupies 1,862 pixels, 0.13% of the canvas.
6. The headline wraps badly, orphaning "Google." onto its own line.

**Resizing made it worse.** The 1080 x 1920 resize did not relayout. It kept the
same small cluster and re-centred it in a taller canvas, producing even more dead
space, and it placed content with no regard for the 672 px bottom inset that
`channel-specs-2026-07-29.md` identifies as the constraint that breaks vertical
video on Meta surfaces.

**Verdict.** `generate-design` on this account is not fit for producing
final BrandGEO renders. It approximates a brand rather than applying one, and
without a Brand Kit there is no mechanism to force exact values. It is usable at
most for rough layout ideation that a human then rebuilds. A Brand Kit would fix
items 1 and 2. It would not fix items 3, 4, 5 or the resize behaviour.

**Side note worth recording.** Open item 1 in `channel-specs-2026-07-29.md` asks
whether the canvas should be `#090A0F` or `#0a0b0e`. That decision still matters
for the render pipeline, but it does **not** bind Canva output, which produced
neither.

---

## 6. Recommendation

Do not build the social render pipeline on Canva's generative tools.

The pipeline needs exact hex fidelity, exact safe-area control, and repeatable
output across eleven render sizes. Canva Free delivers none of these, and a Pro
upgrade would fix only the colour fidelity. The existing SVG and Python render
path in `docs/growth/brand-identity-2026-07-29/v3/build/` already produces
pixel-exact assets and is the better foundation.

Where Canva is genuinely worth paying for, if the owner wants it:

- A Brand Kit as the **single source of truth for humans** editing by hand, so
  ad-hoc one-off designs stay on brand.
- Brand templates as **locked layouts** for recurring formats, so a non-designer
  can fill in text without breaking the design.
- `export-design`, which is reliable and exact, as the way to pull finished files
  out of hand-built templates.

Upgrading is a real decision with a real cost. It is not required for anything
currently on the roadmap, so it should be made deliberately.

---

## 7. Manual steps for the owner, in the Canva UI

Steps 1 to 3 require a paid plan. Steps 4 onward assume the upgrade is done.
Stop after step 3 if the upgrade is not happening.

1. **Decide on the plan.** Go to https://www.canva.com/pricing and choose Canva
   Pro if this is a single operator, or Canva Teams if anyone else will edit
   BrandGEO assets. Brand Kit and brand templates both require one of these.
   Nothing in steps 2 onward is possible on Free.

2. **Create the Brand Kit.** From the Canva homepage, click **Brand** in the
   left sidebar, then **Brand Kits**, then the **Add new** button. Name it
   `BrandGEO`.

3. **Add the brand colours.** Inside the BrandGEO Brand Kit, find the **Brand
   Colours** section and click **Add new**, then **Add your own**. Enter each hex
   below by typing it into the hex field. Create them as separate named groups
   using the **+ Add group** control if you want the grouping to survive.

   Core:
   - `0A0B0E` canvas
   - `101116` card surface
   - `16171E` raised surface
   - `23242B` hairline border
   - `32333C` stronger border

   Brand:
   - `6366F1` gradient start
   - `8B5CF6` primary violet, fill only
   - `7C3AED` CTA fill, and gradient end
   - `A78BFA` accent text

   Text:
   - `E8E9ED` primary
   - `9BA1AC` secondary
   - `7D838F` muted

   Status:
   - `34D399` positive
   - `FB923C` partial
   - `F87171` negative
   - `C4B5FD` informational
   - `FBBF24` risk

   Note the canvas value. `0A0B0E` is what the live site serves. The brief says
   `090A0F`. Pick one here and record the choice against open item 1 in
   `channel-specs-2026-07-29.md`.

4. **Add the logo.** In the Brand Kit, find the **Logos** section and click
   **Add new**. Upload from the local repo, not from the website, so you get the
   full-resolution files:
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-1024-on-dark.png`
   and
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-1024.png`

   **Do not upload `logo-full.svg`.** Its wordmark is live text, not outlined
   paths, so it will render with substituted fonts on any machine without Inter.

5. **Try the vector mark, and check the result.** Still in **Logos**, click
   **Add new** and upload
   `...\v3\icon-mark.svg`. A paid plan should keep it as an editable vector.
   Confirm by placing it on a canvas and scaling it up. If it goes soft, it was
   rasterized, so fall back to the 1024 px PNG from step 4.

6. **Set the fonts.** In the Brand Kit, find the **Brand Fonts** section. Set
   both heading and body to **Inter**. If Inter is not in the list, click
   **Upload a font** and supply the Inter static TTFs. Optionally add
   **Instrument Serif** as a display face, used only for hero display, matching
   the homepage.

7. **Build the four base templates.** For each size below, go to the Canva
   homepage, click **Custom size** at the top right, enter the pixels, and click
   **Create new design**. Set the page background to the canvas colour from your
   Brand Kit first, before adding anything else.

   1. `1080 x 1920` vertical, R1. Keep all content out of the **bottom 672 px**,
      the top 250 px, and 65 px on each side. This is the tightest safe area of
      any channel and it is what breaks Meta Reels.
   2. `1080 x 1350` portrait, R2. The default still image.
   3. `1200 x 630` link preview, R3. One card serves the blog OG tag, Facebook,
      LinkedIn and X.
   4. `1080 x 1080` square, R5.

8. **Publish each one as a brand template.** With the design open, click **Share**
   at the top right, then **More**, then **Brand template**, then **Publish as
   brand template**. This makes it reusable inside your own team only. It does
   **not** make it public. Name them `BrandGEO R1 9x16`, `BrandGEO R2 4x5`,
   `BrandGEO R3 Link Card`, `BrandGEO R5 Square`.

9. **Tell me when step 8 is done.** Once brand templates exist,
   `search-brand-templates` will start returning IDs, and the API can then create
   drafts from them, tag fields for autofill, and export finished renders
   automatically. That is the point at which this becomes a real pipeline rather
   than a manual process.

10. **Optional cleanup.** The two test designs in the **BrandGEO Brand Assets**
    folder are throwaway output from the quality test in section 5. Delete
    `Dark-mode social post with centered card layout`, both copies. Keep the five
    uploaded image assets.

---

## 8. Open questions for the owner

1. **Upgrade or not.** Section 6 argues Canva is not the right renderer for the
   pipeline. If you agree, skip steps 1 to 9 entirely and keep Canva for one-off
   manual designs. The five assets and the folder are already in place for that.
2. **The last resize credit.** One `resize-design` use remains. It is currently
   unspent, deliberately.
3. **Canvas hex.** `#0A0B0E` or `#090A0F`. Still unresolved, still blocking a
   clean brand check later.
