# Threads profile, BrandGEO

The account's identity. This file is the source for what the profile should say.
`SETUP.md` is the ordered list of actions that put it there.

Nothing here has been applied to any account. No login was performed, no
credential was entered anywhere, and no post was published or scheduled.

---

## 1. The trap, before anything else

**A Threads profile is not a standalone profile.** It is created from an
Instagram account and several of its fields are Instagram's, not Threads'.
Editing them in the wrong app either does nothing or changes Instagram too.

The field that matters most is the handle. **The Threads username is the
Instagram username.** There is no separate one. Renaming the account is an
Instagram action and it renames both surfaces at once, which also breaks every
link anyone has saved to either.

| Field | Where it is edited | What it affects | Confidence |
|---|---|---|---|
| Username / handle | **Instagram**, Edit profile > Username | Both apps, simultaneously | High |
| Category label under the name | **Instagram**, professional account settings | Shows on the Threads profile | Medium, verify in app |
| Profile photo | Threads, Edit profile | May write back to Instagram | **Medium, verify in app** |
| Display name | Threads, Edit profile | Threads only, unless imported | Medium-high |
| Bio | Threads, Edit profile | Threads only, unless imported | Medium-high |
| Link | Threads, Edit profile | Threads only, unless imported | Medium-high |

**"Import from Instagram" is a destructive button.** Threads offers to copy the
Instagram name, bio and link into the Threads profile. Pressing it after the
Threads bio below has been entered replaces it with whatever Instagram holds.
Set Instagram first, then Threads, then never press it again.

**Confidence is not certainty and this is a knowledge-cutoff problem, not a
research gap.** Meta has moved these fields between the two apps more than once
and this machine has no way to check a live app. The rows marked "verify in app"
are verified by Constantin in 60 seconds in step 6 of `SETUP.md`, and the app
wins over this table wherever they disagree.

---

## 2. Display name

```text
BrandGEO
```

Not "BrandGEO | AI Visibility Monitoring" and not "BrandGEO: Be the brand AI
recommends". The display name sits next to the handle in every feed row at
roughly 15px. A qualifier there is unreadable and reads as a keyword stuffing
attempt, which is the opposite of the account's register. The bio is where the
qualifier goes and it has 150 characters to do it in.

**Handle:** must be the Instagram username already attached to the account.
Target is `getbrandgeo`, matching the domain, if it was available when the
account was created. Constantin created the account, so the handle already
exists and this file does not get to choose it. Record the actual one in step 2
of `SETUP.md`.

---

## 3. Bio

**Ship this one.**

```text
We ask seven AI engines the buyer questions your customers ask, then publish what comes back. Including the runs where our own code got it wrong.
```

**Length: 145 characters, 145 UTF-8 bytes.** Counted programmatically, not
estimated. 5 characters of headroom under the 150 limit. Pure ASCII, so the
code-point count and the byte count are the same number and the emoji byte trap
in section 6 cannot bite.

Why this one. The first clause is the product in present tense and carries the
engine count, which is the one number on the profile. The second clause is the
concession, and the concession is what the published archives do that a
competitor's bio does not: it is the sentence a find-and-replace on the brand
name could not survive. It also sets the expectation that posts 2 and 4 in
`POSTS.md`, both of which are about bugs in BrandGEO's own scoring, are the
normal output of this account rather than an apology.

**Documented alternate, if the profile ever needs a direct ask:**

```text
We ask seven AI engines the questions your buyers ask, and publish what comes back. Dates and denominators attached. Free check on your own domain.
```

147 characters, 147 bytes. Trades the concession for a utility line. Do not run
both; the account has one bio.

**"Seven" is a present-tense product claim and is correct as of 2026-07-31.**
See section 7. It is not a claim about any published research run, all of which
were measured on fewer engines and keep the denominator they were measured with.

---

## 4. Link

Threads allows one link on the profile.

```text
https://getbrandgeo.com
```

Bare domain, no UTM, no path. Three reasons, in order of weight.

1. **A profile link is not a campaign link.** It is entered once and read for
   years by people arriving from posts, replies, search and screenshots. A UTM
   that encodes "threads-launch-2026-07" is wrong from about day 20 onward and
   nobody goes back to fix a bio.
2. `getbrandgeo.com` is the page carrying the free audit, which is the single
   next action the account is trying to earn. No deeper path outperforms it.
3. Threads renders the link as plain text on the profile, so a long URL with a
   query string is visible clutter in a 150-character-adjacent space.

**Attribution instead of UTM:** GA4 `G-9H6C2NSYPH` is live on the site and
records `threads.net` as a referrer without help. If a campaign-specific link is
ever wanted, put it in a post, not in the bio.

---

## 5. Category

```text
Software company
```

Set on **Instagram**, not on Threads. Instagram professional account >
Edit profile > Category. It then renders as a grey label under the display name
on the Threads profile.

"Software company" over the alternatives on purpose. "Internet company" is true
of every account on the platform and says nothing. "Marketing agency" is false
and would attract the wrong replies, and the product is a subscription tool with
a self-serve ladder rather than a service. "Science, Technology & Engineering"
is a parent bucket that reads as unset.

**If the account is still a personal Instagram account, there is no category
field at all.** Converting to a professional account is step 3 of `SETUP.md` and
is a prerequisite for this field existing, for the category to render, and for
any third-party scheduler to reach the account later.

---

## 6. Avatar, exact spec

| Spec | Value | Source |
|---|---|---|
| Shape | Square file, **rendered as a circle** | Platform behaviour |
| Upload size | **512 x 512 px** | See below |
| Documented minimum | 320 x 320 px | `channel-specs-2026-07-29.md` line 413 |
| Format | PNG or JPEG | Threads supported formats, same file |
| Colour space | sRGB | Same file |
| Rendered size in feed | roughly 40 px | Not published, `[UNVERIFIED]` |

**512 x 512, not 320 x 320.** Meta publishes no profile-photo pixel spec for
Threads at all, which `channel-specs-2026-07-29.md` line 413 records as
`[UNVERIFIED]`. 320 is the documented floor for any Threads image, not a
recommendation. 512 is the largest square the brand kit holds without upscaling
the source raster, and uploading above the display size is the safe direction
when the display size is unknown.

### Use this existing asset. It is verified, not assumed.

```
docs/growth/brand-kit-2026-07-29/png/mark-square/brandgeo-mark-canvas-512.png
```

512 x 512, RGB, background measured at `#0a0b0e`, which is the campaign canvas
token exactly.

**It survives the circular crop, and this was measured rather than eyeballed.**
The file was loaded, the art separated from the background by difference
threshold, and every art pixel's distance from centre computed:

- Art pixels: 72,852
- Art pixels falling outside the inscribed circle: **0**
- Furthest actual art pixel from centre: **238.8 px** against a crop radius of
  256.0 px
- Clearance: 17.2 px, **6.7%** of the radius

A bounding-box check on the same file reports a corner at 255.3 px and looks
like a near miss. That is a false alarm: the mark is tall and narrow, so its
bounding-box corners hold no art. The pixel-level count is the real answer and
it is zero clipping.

**Do not use `brandgeo-mark-transparent-512.png` for this.** Same art, no
background. Threads composites an unknown colour behind a transparent avatar and
the mark is drawn for `#0a0b0e`. The canvas variant removes the question.

**No new asset is needed for the avatar.**

---

## 7. Header, and why there is no spec for one

**Threads profiles have no header, cover, or banner image.** There is no field,
so there is no pixel spec to give, and any spec quoted for one would be
invented. Instagram has no profile banner either, so nothing upstream supplies
one.

This is worth stating flatly because every other channel in this package has
one, and a launch checklist that silently omits it looks like an oversight.

**What actually occupies that role on a Threads profile**, in the order a
visitor reads it:

1. **The avatar**, section 6. Verified asset, no work needed.
2. **The display name and bio**, sections 2 and 3. This is the entire
   above-the-fold identity and it is why the bio is worth counting to the
   character.
3. **The most recent posts**, in reverse order. On a brand-new account the first
   two or three posts are the header. This is the argument for the Day 1 and
   Day 2 order in `LAUNCH-PLAN.md` rather than opening on whichever post is
   best in isolation.
4. **The pinned post.** Threads allows pinning one post to the top of the
   profile. `LAUNCH-PLAN.md` section 6 says which one and when, and it is not
   the Day 1 post.

**No header asset is needed because no header exists.** If a visual identity gap
is felt after launch, it is a gap in posts 1 to 3, not in a banner.

---

## 8. Product truth this profile asserts, verified against source

Read from `brandgeo-dashboard/src/lib/planConfig.ts` on 2026-07-31, not from
`CLAUDE.md` and not from the growth skill file, both of which are stale on the
engine lineup.

### Engines, `PLAN_ENGINES`

| Plan | Engines | Count |
|---|---|---|
| Free | Gemini | 1 |
| Radar | Gemini, Claude | 2 |
| Essentials | ChatGPT, Gemini, Claude | 3 |
| Growth | + Perplexity, Google AI Mode | 5 |
| Growth PRO | + Grok, Google AI Overviews | **7** |
| Managed | same as Growth PRO | 7 |
| Enterprise | + Copilot, DeepSeek, both `COMING_SOON` | 7 live |

**Free is Gemini, not ChatGPT.** Changed 2026-07-31, decision 1b in the ladder
ruling: five ChatGPT prompts bill about EUR 0.540 against a EUR 0.30 free
budget, so a free signup hit a billing error partway through its own first
collection. This matters to the profile only in that no post may claim the free
tier runs ChatGPT.

**Grok and Google AI Overviews went live 2026-07-29**, which is why "seven" is
correct today and was not correct in any research run this campaign draws on.
Google AI Mode and Google AI Overviews are two different Google products and are
measured separately: one is a tab the user opts into, the other is the summary
block on an ordinary results page.

**Meta AI is retired.** It sits in `COMING_SOON_ENGINES` with Copilot and
DeepSeek and is in no plan set. It is never listed as live, anywhere.

### The Radar tier, checked because it was flagged as possibly absent

**Radar IS in `planConfig.ts`.** It was added 2026-07-31 and is fully wired, so
it is not the "ruled but not built" case the task allowed for:

- `Plan` union type includes `'radar'` (line 42)
- `PLAN_ENGINES.radar = ['gemini', 'claude']` (line 82)
- `PLAN_ORDER` places it directly after `free` (line 387), which the file's own
  comment marks as load-bearing because `planRank()` and `hasFeature()` derive
  from the index
- `PLAN_LABELS.radar = 'Radar'` (line 391)
- `PLAN_PROMPTS.radar = 7` (line 531)
- `PLAN_MONTHLY_API_BUDGET_EUR.radar = 4.35` (line 374)
- `PLAN_COLLECTION_COOLDOWN_HOURS.radar = 168`, weekly (line 550)
- `pages/Account.tsx` line 46: `{ id: 'radar', label: 'Radar', price: '€29 / mo' }`
- `netlify/functions/_terms_gate.js` line 141 includes `radar` in
  `SELF_SERVE_CHECKOUT_PLANS`
- `brandgeo/web/index.html` line 95 publishes it in the JSON-LD offers block at
  EUR 29, and line 2856 renders a Radar pricing card

Price: **EUR 39 list, EUR 29 launch for the first 100 customers.** Two engines,
Gemini and Claude, deliberately a strict superset of Free so nobody pays EUR 29
and loses an engine. 7 prompts, weekly refresh, 1 site.

**Radar appears in no post in `POSTS.md` and in no slot in `LAUNCH-PLAN.md`, and
that is deliberate.** The campaign brief section 3 rule 9 forbids pricing on a
TOFU asset, and every Day 1 to Day 14 slot is TOFU or MOFU. The tier is
documented here so that whoever writes the first BOFU Threads post has the
verified numbers and does not have to re-derive them.

**One thing about Radar this machine could not verify:** whether a Stripe
checkout link for `radar` is actually present in the `STRIPE_CHECKOUT_LINKS`
environment variable on Netlify. `_terms_gate.js` reads that catalogue at
runtime from an env var, so the code permitting Radar checkout does not prove a
link exists behind it. Flagged in the report, not assumed either way.

### Prices, for reference only

Free EUR 0, Radar EUR 39 list and EUR 29 launch, Essentials EUR 99, Growth
EUR 299, Growth PRO EUR 449, Managed from EUR 1,500, Enterprise custom. `pro` is
legacy and is never offered.

---

## 9. The link preview card, and a live defect it will expose

The Day 7 post in `LAUNCH-PLAN.md` is the account's first link post. Threads
renders a preview card from the destination's Open Graph tags, so what the card
says is decided by `brandgeo/web/index.html`, not by the post copy.

Checked on 2026-07-31:

| Tag | Value |
|---|---|
| `og:title` | "BrandGEO: Be the brand AI recommends" |
| `og:image` | `https://getbrandgeo.com/images/og-home.png`, present, 1200 x 630, RGB |
| `twitter:card` | `summary_large_image` |
| `og:description` | "See how visible your brand is across **ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode**. BrandGEO monitors, scores, and tracks your AI presence." |

**The `og:description` is a present-tense product claim naming five engines, and
it is stale.** The lineup has been seven since 2026-07-29. So the Day 7 post
would say seven in the copy and render a card underneath it saying five, in the
same feed row, which is the one contradiction this account cannot afford given
what its bio promises.

This is a defect in `brandgeo/web/index.html`, which is outside this task's
write scope and belongs to `bg-web`. It is not fixed here. `SETUP.md` step 14
records it as a blocker on the Day 7 slot and `LAUNCH-PLAN.md` gives the
fallback if it is not fixed in time.
