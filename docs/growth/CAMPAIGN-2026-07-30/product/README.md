# Product assets, CAMPAIGN-2026-07-30

Seven plans, six images each, plus the copy for every surface those images go on.

**Nothing has been created, modified or written in Stripe. Nothing has been
created in Google Business Profile.** Everything here is a draft for a human to
paste. Read-only Stripe calls were made to see what already exists, and what
they found is in section 5, which changes what you can do with these files.

---

## 0. Status of the Radar tier, 2026-07-31

**Read this before publishing any Radar file.** The set was first generated
2026-07-30 against a six plan ladder. Radar was added, and three other tiers
were corrected, on 2026-07-31.

### What is true, each line verified rather than inferred

| Claim | How it was checked | Result |
|---|---|---|
| Radar exists in the plan ladder | `planConfig.ts:42` `Plan` union, `:387` `PLAN_ORDER`, `:391` `PLAN_LABELS` | **live in code** |
| Radar runs Gemini and Claude | `planConfig.ts:82`, mirrored at `_cost.js:432` | **live in code** |
| Radar is 7 prompts, weekly | `planConfig.ts:531` `PLAN_PROMPTS`, `:550` `PLAN_COLLECTION_COOLDOWN_HOURS` | **live in code** |
| The database agrees | `select plan, prompt_cap from public.plan_prompt_caps` run against project `duiyifepitvugyulobqm` | **applied**, returns `free 5, radar 7, essentials 18, growth 35, growth_pro 56, managed 200, pro 200, enterprise 100000` |
| Radar is offered self-serve | `_terms_gate.js:141` `SELF_SERVE_CHECKOUT_PLANS` includes `radar` | **live in code** |
| Radar is on the public pricing page | `brandgeo/web/index.html:2856-2874`, card with `data-checkout="radar"` | **live on the site** |
| Free runs Gemini, not ChatGPT | `planConfig.ts:78-82` | **live in code** |

**So Radar is sellable and provisionable, and these assets are not ahead of the
product.** An earlier version of this section warned that they were. That
warning was wrong and has been removed rather than softened, because a false
"do not publish" is as expensive as a false "safe to publish": it holds back
assets a live tier needs.

**One stale artefact found while checking, worth fixing on its own.**
`db/supabase-plan-caps-2026-07-31-migration.sql` still carries a header reading
"NOT YET APPLIED". It has been applied. The query above is the evidence. Anyone
reading that file will believe the ladder is not in the database and may run it
again, which is harmless because it is idempotent, or may block on it, which is
not.

### What is still open, and one of them is a decision Constantin owns

**1. The price. Two are live at once and the images had to pick one.**

The ruling sets **EUR 39 list and EUR 29 launch for the first 100 subscribers**.
`Account.tsx:46` renders a bare `€29 / mo` with no qualifier. The live pricing
card does qualify it, with an eyebrow reading "Launch price" and a tag reading
"List €39/mo after launch".

**These images render `€29 / mo launch`, and that is a choice, not a
transcription.** A bare `€29` was rejected. These files go onto Stripe product
rows, a Google Business Profile listing and social posts, all of which outlive
the launch cohort and none of which carry the pricing card's eyebrow. Six images
publishing a bare EUR 29 would make the launch price the de facto list price,
and the later move to EUR 39 would read as a price rise rather than the end of
an introductory offer. The word "launch" costs one word and removes that.

**The alternative, which is Constantin's to take if he prefers it:** render
**EUR 39** as the price with EUR 29 as a launch flash. That is the more
conservative framing commercially, because it anchors on list and presents EUR
29 as a saving, and it makes the images correct on the day the launch price is
deactivated instead of wrong. It was not chosen here because it publishes a
number no customer is currently charged, and every other image in this set
prints what the buyer actually pays. **Either framing is defensible and the
choice is a pricing decision, not a design one.** To switch, change
`price_glyph` for `radar` in `_build/render_product_images.py` and re-run the
renderer and the verifier.

**Whichever is chosen, the images must be re-rendered when the EUR 29 price is
deactivated at the 100th subscription.** Nothing in the build will notice: the
renderer reads the price from `PLAN_FACTS`, which is a transcription, not a live
read of Stripe. This is recorded as note 6 in `COPY.md` as well.

**2. Code-buyable is not the same as link-live, and this could not be
verified.** `SELF_SERVE_CHECKOUT_PLANS` containing `radar` means the contract
gate is willing to issue a Radar checkout. Whether a Radar payment link actually
exists is held in the `STRIPE_CHECKOUT_LINKS` Netlify environment variable,
which is not in the repo and cannot be read from here. Two pieces of indirect
evidence say it does: `site.js:705` carries the comment "`radar` added
2026-07-31, once its Stripe price and payment link existed", and `PLAN_LABELS`
in the same file gained a `radar` key, which is what decides whether the
Subscribe button reaches the gate at all rather than falling through to plain
`/signup`. **That is a comment and a code path, not a read of the variable.**
Click Subscribe on the live Radar card once before treating checkout as proven.
Note also that this variable has already breached AWS Lambda's 4KB environment
ceiling once, on 2026-07-31, which is why it now stores Stripe slugs rather than
full URLs (`_terms_gate.js:146-170`).

**3. The one website claim is data, not enforcement.** Radar's
`plan_prompt_caps.site_allowance` is **1**, confirmed by query. But
`site_allowance` appears nowhere in `brandgeo-dashboard/src` or
`netlify/functions`, so no application code reads it, and the multi-site feature
it exists for has not shipped. Every client on every tier holds exactly one site
today. The Radar copy says "one website" because the live pricing card publishes
"1 project" and the database row agrees, so it is true. **Do not let it harden
into a contractual-sounding entitlement** until something enforces it.

---

## 1. The files

42 PNGs, all dark canvas `#0a0b0e`, all rendered by
`_build/render_product_images.py`. Six per plan, where `<plan>` is one of
`free`, `radar`, `essentials`, `growth`, `growth_pro`, `managed`, `enterprise`.

| File | Surface | Dimensions | Brand art |
|---|---|---|---|
| `stripe-<plan>-1024x1024.png` | Stripe product image: Checkout, Dashboard, invoices | 1024 x 1024 | mark |
| `gbp-<plan>-1440x1440.png` | Google Business Profile product image | 1440 x 1440 | mark |
| `promo-<plan>-1080x1080.png` | square feed post | 1080 x 1080 | lockup |
| `promo-<plan>-1080x1350.png` | portrait feed post | 1080 x 1350 | lockup |
| `promo-<plan>-1200x630.png` | link preview, Open Graph | 1200 x 630 | lockup |
| `promo-<plan>-1600x900.png` | wide placement, deck slide, site hero | 1600 x 900 | lockup |

`_build/manifest.json` lists all 42 with their plan, surface and dimensions.
`_build/verify_product.py` check A opens every one and confirms the file on disk
matches the dimensions claimed.

**The six Radar files were measured, not assumed.** Every one was opened, its
size read back, and the bounding box of every non-canvas pixel computed to prove
no text is clipped at any edge:

| File | Measured size | Ink bounding box | Smallest margin to an edge |
|---|---|---|---|
| `stripe-radar-1024x1024.png` | 1024 x 1024 | 96, 96 to 719, 916 | 96 px |
| `gbp-radar-1440x1440.png` | 1440 x 1440 | 135, 135 to 1011, 1287 | 135 px |
| `promo-radar-1080x1080.png` | 1080 x 1080 | 79, 78 to 803, 1001 | 78 px |
| `promo-radar-1080x1350.png` | 1080 x 1350 | 79, 78 to 803, 1271 | 78 px |
| `promo-radar-1200x630.png` | 1200 x 630 | 45, 45 to 1091, 584 | 45 px |
| `promo-radar-1600x900.png` | 1600 x 900 | 65, 65 to 1455, 834 | 65 px |

**Nothing broke at 1200 x 630 or 1600 x 900**, which are the two crops where a
long tier name usually breaks this layout. "Radar" is the second shortest name
in the ladder, so the headline had slack that "Growth PRO" and "Enterprise" do
not. The longer string on those two crops is the price, `€29 / mo launch`, and
it is set by `fit_font` against a column of `w * 0.56`, so it shrinks to fit
rather than overrunning. At 1200 x 630 it did not need to shrink.

**Why the two squares carry the mark and the four promos carry the lockup.**
BRIEF section 5 asks for the lockup on every image. The two squares deviate,
deliberately. A Stripe product image renders at roughly 40 to 50 pixels in a
Checkout line item and in an invoice row. At that scale the lockup's wordmark
is around two pixels tall, which is not a logo, it is noise sitting where the
tier name should be. The mark alone stays recognisable, and the word BrandGEO
is already in the product name on all three Stripe surfaces. The four promo
sizes are displayed large enough for the lockup to be read, so they carry it.

Neither asset is ever upscaled past its source raster: the mark file is 362 x
512 and the lockup file is 512 x 400, and `place_mark` and `place_lockup` both
clamp to those. The lockup sits at a margin at least equal to the mark's own
height on every side.

---

## 2. Dimension specs and where they came from

| Surface | Rendered | Spec found | Source | Status |
|---|---|---|---|---|
| Stripe product image | 1024 x 1024 | none published for `product.images` | `docs.stripe.com/api/products/create` documents `images` as "a list of up to 8 URLs" and states no pixel size | **[UNVERIFIED]** |
| Stripe, nearest published square spec | | square, minimum 128 x 128, PNG or JPG, maximum 512 KB | `docs.stripe.com/receipts#image-requirements` (this governs the branding logo and icon, not the product image) | verified |
| Stripe, nearest published product-image spec | | recommended minimum 800 x 800, JPEG or PNG | `docs.stripe.com/agentic-commerce/product-feed`, the `image_link` field | verified |
| Google Business Profile photo | 1440 x 1440 | recommended 720 px by 720 px, minimum 250 px by 250 px, JPG or PNG, between 10 KB and 5 MB | `support.google.com/business/answer/6103862` | verified |
| Google Business Profile **product** photo specifically | | not published separately | Google's product help pages could not be made to return a product-image spec; the pages reachable cover services, not products | **[UNVERIFIED]** |
| 1080 x 1080, 1080 x 1350, 1200 x 630, 1600 x 900 | as given | given in the task, not independently verified against any platform doc | | **[UNVERIFIED]** |

**What was assumed, and why.**

- **Stripe at 1024 x 1024.** Square, so it survives any square crop. It clears
  the 800 x 800 minimum from the only Stripe page that publishes a product image
  size at all, and clears the 128 x 128 minimum from the branding page by a wide
  margin, so it is valid for either interpretation of which spec applies. Every
  file is between 40 KB and 78 KB, well under the 512 KB branding ceiling, so
  the same file can be reused as a branding icon without re-export. The Radar
  square is 52 KB.
- **Google Business Profile at 1440 x 1440.** Exactly twice Google's documented
  720 x 720 recommendation, for high-density displays, and comfortably inside the
  10 KB to 5 MB range at 61 KB to 116 KB. The Radar file is 79 KB. Rendered
  separately from the 1080 x 1080 promo because a product image and a social post
  are different jobs: the product image carries the tier, the price and one fact,
  and no CTA.
- **The four promo sizes** were taken from the task as given. They are the
  common values for those placements but no platform documentation was consulted
  for them, so they are marked unverified rather than presented as sourced.

---

## 3. What makes the seven plans separable, and how that was tested

**Colour is not the discriminator.** All seven images use an identical palette.
If they were converted to greyscale, or viewed by someone with any form of colour
vision deficiency, nothing about the encoding would change, because there is no
hue difference between plans to lose.

The discriminator is a countable dial with three redundant shape channels.

| Plan | Filled segments | Centre numeral | Outer form |
|---|---|---|---|
| Free | 1 of 7 | 1 | none |
| **Radar** | **2 of 7** | **2** | none |
| Essentials | 3 of 7 | 3 | none |
| Growth | 5 of 7 | 5 | none |
| Growth PRO | 7 of 7 | 7 | none |
| Managed | 7 of 7 | 7 | continuous ring |
| Enterprise | 7 of 7 | 7 | 9 discrete pips, 7 solid and 2 hollow |

**Adding Radar cost the dial nothing, and that is the payoff from keying it to a
countable product fact instead of a colour.** Radar carries 2 live engines and
sits between Free at 1 and Essentials at 3, so the numeral sequence runs 1, 2, 3,
5, 7, 7, 7 and stays non-decreasing along `PLAN_ORDER`. A palette-keyed encoding
would have needed a seventh hue that was never reserved, and would have had to
prove that hue distinguishable from the other six.

Filled and empty segments are separated by **stroke weight**, not by tone: an
empty segment is drawn at 35 percent of the filled thickness. That is forced
rather than preferred, and the renderer prints the proof. `#8b5cf6` measures
4.65:1 on this canvas. For an empty-track colour to clear 3:1 against both the
canvas and that fill, its relative luminance plus 0.05 would have to be at once
above 0.16007 and below 0.08266, which is an empty interval. The only remaining
option is a colour brighter than 13.94:1 against the canvas, which would make
the empty slots outshine the filled ones and read backwards. So the distinction
is a thickness, which greyscale preserves exactly.

Enterprise's two hollow pips are Copilot and DeepSeek. They are reserved on that
tier and do not collect, and the copy says so.

**How it was tested.** `_build/verify_product.py` check B renders each plan's
Stripe square down to thumbnail size, **converts it to greyscale**, and computes
the pairwise RMS difference across all 21 pairs. Greyscale is the test surface,
not a variant of it, so passing is a statement about the greyscale case
directly. The floor is 6.0 RMS out of 255. Re-measured 2026-07-31 with Radar in
the set:

```
  24px  worst pair free/radar             RMS 10.76
  32px  worst pair radar/growth           RMS 13.16
  48px  worst pair essentials/growth      RMS 16.73
  64px  worst pair free/radar             RMS 19.06
  96px  worst pair free/radar             RMS 21.93
 128px  worst pair free/radar             RMS 23.52
```

**Radar is now the tightest pair at four of the six sizes, always against Free,
and that is exactly where it should be.** One filled segment against two is the
smallest step the encoding can express. It still clears the floor by 1.8x at
24 px and by 3.9x at 128 px. If an eighth tier is ever inserted next to Free,
this is the pair to re-measure first.

48 px is roughly what Stripe gives a Checkout line-item image. Honest caveat:
below about 64 px the arc segments themselves blur and the work is being done by
the centre numeral and the outer form, not by counting segments. That is what
the three redundant channels are for, and it is why the numeral exists at all.

Check C is the stronger test. It reads the rendered pixels back: it walks a
radial line at each of the seven segment mid-angles on the full-resolution
image, measures the stroke width, and counts how many are at full thickness.
It then asserts that count equals the plan's live engine count from
`planConfig.ts`. Filled segments measure 27 to 28 px and empty ones 9 to 10 px,
so the classification threshold is not close to anything. Radar reads back
`filled=2 expected=2`.

---

## 4. Verification

`_build/verify_product.py` has five checks and a negative control.

```
cd docs/growth/CAMPAIGN-2026-07-30/product/_build
python verify_product.py --selftest    # 21 of 21 injections fired
python verify_product.py               # all checks pass, exit 0
```

`--selftest` injects each defect the checker claims to catch, one at a time, and
fails loudly if the checker stays green. It found two real bugs in the checker
itself, both of which are the failure mode BRIEF section 4 exists to catch:

1. `FORBIDDEN_PRICES` matched `EUR\s?900` in uppercase against text the indexer
   had already casefolded, so the retired Managed price could never have been
   caught. Every pattern in that file is lowercase now, and there is a comment
   saying why.
2. The programme-superlative rule originally paired a bare `\bonly\b` with an
   allow-list containing the substring `only`, so every match found its own
   allowance in its own context and the rule could not fire. The bare word is
   gone and the rule matches the actual claim shapes.

Two rendering defects were found and fixed the same way:

3. The plan-name headlines were set with negative letter tracking, which makes
   the helper draw one glyph per call. On Inter ExtraBold at that size adjacent
   glyphs overlapped and gouged each other, visibly notching Enterprise between
   n/t and r/i/s. They are drawn untracked in a single call now.
4. The dial's empty track was originally `#32333c`, which measures 1.57:1
   against the canvas. It was effectively invisible, which meant the dial read
   as "some segments" rather than "5 of 7". See section 3.

### Check E, added 2026-07-31, and the defect that forced it

**Checks A to D were all green on a `COPY.md` whose Free block said "ChatGPT
only" on the day `PLAN_ENGINES.free` became `['gemini']`.** That is worth
stating plainly because it is the exact failure this file's own docstring exists
to prevent. Check C reads the dial and counts segments, and Free's engine count
did not move, so the image and the count agreed with each other and both agreed
with source. The wrong thing was the engine's **name**, and no check here could
see a name.

Check E closes it with two rules, both scoped to a single plan's `## <Label>`
section in `COPY.md`:

- **E1.** An engine named inside a plan's section must be one that plan runs,
  unless the sentence naming it marks it as absent. The exemption is
  sentence-scoped, not section-scoped, because Growth legitimately writes
  "Google AI Overviews and Grok start at Growth PRO" and Enterprise legitimately
  writes that Copilot and DeepSeek are "reserved". A section-wide ban would
  forbid both of those true sentences.
- **E2.** A prompt count written as "N prompts" in a plan's section must be that
  plan's own allowance. This is what catches Essentials still reading 15 after
  `PLAN_PROMPTS` moved to 18.

Three injections were added to the negative control for it, and the first one
reproduces the real 2026-07-30 defect by putting ChatGPT back into the Free
section. All three fire.

One further hazard was removed while doing this. `selftest()` held a **hardcoded
literal list of six plan keys**, so adding Radar to `PLAN_FACTS` would have left
the new tier outside the negative control entirely while every line still
printed PASS. It is derived from `PLAN_FACTS` now.

---

## 5. What Stripe actually has today

**The Stripe MCP connected to this session is not BrandGEO's Stripe account.**
It is `acct_1TxtkGQAKgm0Dugx`, display name Talentwelove. Its live catalogue is
seven TalentWeLove products plus two Stripe CLI test artefacts. **There is
no BrandGEO product in it.** Every BrandGEO price id in this repo ends
`Kh2GaZE2B4`; every price in the connected account ends `QAKgm0Dugx`. So
BrandGEO's Stripe catalogue could not be read directly and everything below
comes from the repo, not from the API.

**From source, the Growth PRO gap is closed.** It was real and it is fixed.
`scripts/stripe-create-catalogue.js` built a three-product catalogue on
2026-07-28, and both of these are committed:

- `netlify/functions/stripe-webhook.js` maps six current price ids, including
  `price_1Ty5a7Kh2GaZE2B4vQhoTktV` for Growth PRO at EUR 449 monthly and
  `price_1Ty5a9Kh2GaZE2B4ibycxUST` at EUR 4,490 annual.
- `SELF_SERVE_PLANS` at `stripe-webhook.js:66` includes `growth_pro`, and the
  comment above it records that it was added deliberately before the prices
  existed, so a paid checkout could never land on a tier the webhook would refuse
  to provision.

**Radar's position in Stripe, stated at the precision the evidence supports.**
`_terms_gate.js:141` lists `radar` in `SELF_SERVE_CHECKOUT_PLANS`, and
`site.js:710` lists it in `PLAN_LABELS`, which is what decides whether the
Subscribe button reaches the contract gate at all. The comment at `site.js:705`
says the key was added "once its Stripe price and payment link existed". **The
link itself lives in the `STRIPE_CHECKOUT_LINKS` environment variable and could
not be read from the repo**, so end-to-end checkout is unproven from here. See
section 0 item 2.

**The checkout links moved and must not move back.** They are no longer in
`site.js`. They live in `_terms_gate.js` and are issued one at a time by
`accept-terms.js` after an acceptance row is written. Never put a checkout URL
back into a browser-served file.

**What is still missing, and it is a copy defect rather than a plumbing one.**
The three products were created with descriptions that are now wrong by two
engine launches. `scripts/stripe-create-catalogue.js` lines 59 and 66 describe
Growth with an engine count of 4 when it has 5, and Growth PRO with a count of 5
when it has 7. Grok and Google AI Overviews both went live 2026-07-29, the day
after that catalogue was written. `COPY.md` replaces both. That script also has
no Radar entry, so it is now one tier short of the catalogue it claims to build.

**Also missing:** no Stripe product carries an image. Every product read back
has `"images": []`. That is the gap these files fill.

---

## 6. What a human has to do

Nothing below has been done. All of it needs an account owner.

### Stripe

1. Sign in to BrandGEO's Stripe account, which is **not** the account this
   session's MCP is connected to. Go to Products.
2. For **BrandGEO Essentials**, **BrandGEO Growth** and **BrandGEO Growth PRO**,
   which already exist: click into each, click the image slot, and upload
   `stripe-essentials-1024x1024.png`, `stripe-growth-1024x1024.png` and
   `stripe-growth_pro-1024x1024.png` respectively.
3. For **BrandGEO Radar**, first settle the price question in section 0 item 1,
   because the image carries the answer. Then upload
   `stripe-radar-1024x1024.png` and paste the Radar description from `COPY.md`.
   While you are on that screen, confirm the Radar payment link exists, which is
   the check section 0 item 2 could not do from here.
4. On the same screen, replace each product's **description** with the Stripe
   description from `COPY.md`. The two paid descriptions currently in Stripe
   undercount the engines. This is the part that is actually wrong on a live
   customer-facing surface, not just missing.
5. Do **not** create Stripe products for Free, Managed or Enterprise. Free is
   provisioned at signup and Managed and Enterprise are sales assisted and route
   to contact. Their images and copy exist so those tiers render correctly if
   they ever appear on a quote, an invoice line or a pricing table.
6. Do **not** let the launch coupon apply to Radar. Radar's EUR 29 is already
   the discount and the ruling scopes the coupon to Essentials and up.

### Google Business Profile

7. Open the BrandGEO Business Profile, go to Products, and add one product per
   tier using the name, category, price and description from `COPY.md`, with
   `gbp-<plan>-1440x1440.png` as the image. There are seven now, not six.
8. Google publishes no character limit for these fields that could be found, so
   the descriptions here are held under 310 characters with the first 90
   characters written to stand alone, because the listing view truncates hard.
   Check how each one actually truncates in the live listing and trim if needed.

### Direct promotion

9. The four `promo-` sizes and the two promotion copy blocks per plan are ready
   to schedule. Nothing has been posted or scheduled.

### Before any of it

10. Re-run `python _build/verify_product.py` if you edit `COPY.md`. Check D
    verifies every stated character count against the block it labels and check E
    verifies every engine name and prompt number against `PLAN_FACTS`, so an
    edited block with a stale count or a stale engine fails the build rather than
    shipping.

### When the launch cohort fills

11. At the 100th live Radar subscription, deactivate the EUR 29 Stripe price,
    raise `PLAN_MONTHLY_API_BUDGET_EUR.radar` from 4.35 to 5.85 in the same
    commit, change `price_glyph` for `radar` in
    `_build/render_product_images.py`, re-render, re-verify, and re-upload the
    six Radar images. Nothing automates any of this and nothing will warn.

---

## 7. Product truth, and where each number came from

Read from source on 2026-07-30 and **re-read on 2026-07-31** after the sprint
ladder ruling landed in code. `CLAUDE.md` is stale on the engine lineup and was
not used.

| Plan | Price | Live engines | Prompts | Manual refresh | AI SEO pages |
|---|---|---|---|---|---|
| Free | EUR 0 | 1 (Gemini) | 5 | monthly | 0 |
| **Radar** | **EUR 29 / mo launch, EUR 39 list** | **2 (Gemini, Claude)** | **7** | **weekly** | **0** |
| Essentials | EUR 99 / mo | 3 | **18** | weekly | 0 |
| Growth | EUR 299 / mo | 5 | 35 | weekly | 10 |
| Growth PRO | EUR 449 / mo | 7 | **56** | weekly | 30 |
| Managed | from EUR 1,500 / mo | 7 | **200** | weekly | 100 |
| Enterprise | Custom | 7 live, 2 reserved | no published ceiling | no cooldown | 500 |

- Engines: `planConfig.ts` `PLAN_ENGINES` line 53, minus `COMING_SOON_ENGINES`
  line 85. Confirmed identical in the copy that actually enforces it,
  `netlify/functions/_cost.js` `PLAN_LIVE_ENGINES` line 425.
- Prices: `planConfig.ts` `PLAN_LABELS` line 390, and `src/pages/Account.tsx`
  `PLAN_TIERS` line 38, which is the display ladder. Radar's second price is from
  the live pricing card, `brandgeo/web/index.html:2862`, and from
  `docs/strategy/sprint-ladder-ruling.md` decision 1.
- Prompts: `planConfig.ts` `PLAN_PROMPTS` line 530, cross-checked against the
  Supabase table `public.plan_prompt_caps` **by query on 2026-07-31**, not by
  reading a migration file. The table agrees on all eight rows.
- Refresh: `PLAN_COLLECTION_COOLDOWN_HOURS` line 549. 720 hours on Free, 168 on
  every paid tier including Radar, 0 on Enterprise.
- AI SEO: `PLAN_SEO_PAGE_CAP` line 664. Radar is 0, and `FEATURE_MIN_PLAN.ai_seo`
  is `growth`, so Radar's position directly after Free in `PLAN_ORDER` excludes
  it with no separate edit.

**Four numbers in this table changed on 2026-07-31 and every one of them made an
already-rendered asset or an already-written block wrong.** Free's engine, which
went from ChatGPT to Gemini; Essentials 15 to 18; Growth PRO 35 to 56; Managed
120 to 200. The whole set was re-rendered rather than only the new tier.

**AI Social is not claimed anywhere in this package.** `FEATURE_MIN_PLAN`
sets `ai_social` to `enterprise` while the feature is being finished, and the
three `social-*.js` functions are gated `adminOnly`. The
`PLAN_SOCIAL_CHANNEL_LIMIT` table shows 1 channel on Growth and 3 on Growth PRO,
but the feature gate above it means no customer on those tiers can reach it.
Selling it on those tiers would be selling something the server refuses.

---

## 8. Where the ladder is thinner than the copy would like

Recorded rather than papered over, per BRIEF section 8.

1. **Growth PRO is a less thin step than it was, and the earlier version of this
   note is superseded.** On 2026-07-30 the move from EUR 299 to EUR 449 bought
   two engines and AI SEO depth and nothing else, because the prompt allowance
   was 35 on both tiers. The ruling raised Growth PRO to 56. The step is now two
   engines, 21 more prompts and AI SEO from 10 pages to 30. The manual refresh
   cooldown is still 168 hours on both, so cadence is still not a differentiator
   and no copy treats it as one.

2. **Radar's step over Free is engines and cadence, not volume.** 7 prompts
   against 5 is two more. What the buyer is paying for is a second engine and a
   move from monthly to weekly, which takes them from 5 checks a month to about
   60, and gives them a trend line that a monthly cadence cannot produce because
   one run a month is one data point. The ruling records this as a real product
   and a thin sales line, and the Radar copy in `COPY.md` argues the trend line
   rather than the prompt count, because the prompt count is the weaker of the
   two true arguments.

3. **`PLAN_PROMPTS` no longer contradicts the comment above it**, which was
   finding 3 in the 2026-07-30 version of this section. The stale derivation
   block that tabulated 20, 50, 75 and 250 was replaced when the ruling shipped.
   Worth noting that the ruling explicitly ordered it replaced rather than
   amended, because it was costed against a ChatGPT price that no longer exists.

4. **Managed and Growth PRO have an identical engine set.** Seven each. The step
   from EUR 449 to EUR 1,500 is prompt volume, AI SEO depth and the service, and
   the copy says so plainly. There is nothing to inflate there and nothing was.

5. **Enterprise's prompt cap is 100000 in code**, which is a sentinel meaning
   uncapped rather than a real allowance. It is written as "no published prompt
   ceiling" rather than as a number, because publishing 100,000 would invite
   somebody to test it. The ruling notes the real ceiling is about 1,541 prompts,
   where the EUR 1,500 budget binds first.

6. **Radar's website allowance is recorded but not enforced.** See section 0
   item 3. `site_allowance` is 1 in the database and absent from every line of
   application code.
