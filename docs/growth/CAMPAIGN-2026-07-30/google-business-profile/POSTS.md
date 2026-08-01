# Google Business Profile, CAMPAIGN-2026-07-30

Four **update** posts. Google Business Profile is bottom of funnel, local and
transactional: the reader has already found the business and is deciding whether
to act. So there is no thought leadership here, no research narrative, and no
argument about the category. Each post names a price or the free audit path,
which is the one place in this campaign that should.

**Per post: 80 to 120 words, exactly one call to action.** The CTA is the final
sentence, and `getbrandgeo.com` appears nowhere else in the post, so a single CTA is
mechanically checkable rather than a matter of opinion.

Images render from `_build/render_gbp_and_thumbnails.py`. Every image is
1200x900, the 4:3 GBP post ratio.

**Crop safe area.** GBP crops a post image toward square in some surfaces and
toward landscape in others, so nothing load-bearing may sit outside the
intersection of both crops: a centred 1:1 crop is x 150 to 1050, a centred 16:9
crop is y 112 to 788, and the intersection is the centred **900x676** region.
Everything that carries meaning is kept inside a tighter **840x620** content box
(x 180 to 1020, y 140 to 760), and the renderer asserts it, per element, with a
real bounding box rather than a guessed one.

---

## Product truth used here, read from source 2026-07-30

| Fact | Source |
|---|---|
| Free EUR 0, Essentials EUR 99, Growth EUR 299, Growth PRO EUR 449, Managed from EUR 1,500, Enterprise custom | `brandgeo-dashboard/src/pages/Account.tsx:38-45` `PLAN_TIERS` |
| Free 1 engine, Essentials 3, Growth 5, Growth PRO and Managed **7** | `planConfig.ts` `PLAN_ENGINES` |
| Growth PRO engines: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok, Google AI Overviews | `planConfig.ts` `PLAN_ENGINES.growth_pro` |
| Grok and Google AI Overviews live 2026-07-29 | `planConfig.ts` `PLAN_ENGINES` comment, and `COMING_SOON_ENGINES` |
| Prompts: free 5, essentials 15, growth 35, growth_pro 35, managed 120 | `planConfig.ts` `PLAN_PROMPTS` |
| Refresh: free monthly (720h), every paid plan weekly (168h) | `planConfig.ts` `PLAN_COLLECTION_COOLDOWN_HOURS` |
| The **free public audit** runs 5 engines: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode | `netlify/functions/_prospect_engines.js:396` `FULL_ENGINES` |
| Free audit: instant, no credit card | `brandgeo/web/index.html` hero, "Results in under a minute", "No credit card required" |
| Self-serve signup provisions `plan: 'free'` | `netlify/functions/provision-account.js:162` |
| Per answer, stored: named, position, what the answer said, competitors alongside | `ai_results` columns `brand_mentioned`, `brand_position`, `response_snippet`, `competitors_mentioned` |

**The free audit covers five engines, not seven.** Growth PRO's Grok and Google
AI Overviews are not in the prospect path. No post here says otherwise.

**Meta AI is retired and appears nowhere.** The existing GBP asset set still
advertises it; see the note at the bottom.

---

## Post 1 of 4

**Image:** `gbp-1-free-audit-1200x900.png`
**Post type:** Update
**CTA button:** Learn more, to `https://getbrandgeo.com`

> BrandGEO checks whether AI engines name your brand when a customer asks about
> your category. The free audit puts your domain to five engines, ChatGPT,
> Gemini, Claude, Perplexity and Google AI Mode, and returns a score with a
> breakdown per engine. It takes under a minute and asks for no card. What you
> get back is one snapshot: one day, one set of questions. That is enough to see
> whether you are named at all. If you are not in the answer, that is your
> result. Not a lower rank. Absent. The audit is free and the plan behind it
> starts at EUR 0. Run it at getbrandgeo.com.

---

## Post 2 of 4

**Image:** `gbp-2-essentials-1200x900.png`
**Post type:** Update
**CTA button:** Sign up, to `https://app.getbrandgeo.com/signup`

> Essentials is EUR 99 a month. It monitors ChatGPT, Gemini and Claude against
> 15 of your own buyer questions, refreshed weekly, and keeps every answer it
> collects. The paid tier is not a bigger number on day one. A single audit
> gives you a point. A weekly record gives you a direction, which is what tells
> you whether something you changed moved anything. The free plan stays
> free: one engine, five questions, refreshed monthly. Move up when the snapshot
> has told you what it can. Pick a plan at getbrandgeo.com.

---

## Post 3 of 4

**Image:** `gbp-3-growth-pro-1200x900.png`
**Post type:** Update
**CTA button:** Learn more, to `https://getbrandgeo.com`

> Growth PRO is EUR 449 a month and monitors seven engines: ChatGPT, Gemini,
> Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews. Grok and
> Google AI Overviews went live on 29 July 2026. Google AI Mode and Google AI
> Overviews are two different products. One is a tab a person opts into. The
> other is the summary block on an ordinary results page. Growth, at EUR 299 a
> month, covers five of them. If your customers reach you through ordinary
> Google results, that is the difference between the two tiers. Compare them at
> getbrandgeo.com.

---

## Post 4 of 4

**Image:** `gbp-4-plan-ladder-1200x900.png`
**Post type:** Update
**CTA button:** Sign up, to `https://app.getbrandgeo.com/signup`

> For every answer an engine gives, BrandGEO records four things: whether your
> brand was named, where it sat in the list, what the answer said about you, and
> which competitors appeared alongside you. Engines do not have to agree. Each
> writes its own version, and your customer reads one of them. You are not sent
> a copy. Plans run from Free at EUR 0 through Essentials at EUR 99, Growth at
> EUR 299 and Growth PRO at EUR 449, up to Managed from EUR 1,500, which is the
> done-for-you tier. Start on the free plan at getbrandgeo.com.

---

## What the existing GBP asset set already says

`marketing/google-business-profile-2026-07-15/` holds five PNGs and a `gen.py`,
and **no post copy at all**, so nothing above repeats a published GBP post. It
does repeat nothing from the images either. What those images say:

| File | Says |
|---|---|
| `gbp-cover-1080x608.png` | "Be the brand AI recommends." plus "Monitor how visible your brand is across ChatGPT, Gemini, Claude, Perplexity, and Meta AI." |
| `gbp-product-1-ai-visibility-score.png` | "The AI Visibility Score", "6 dimensions tracked per brand", "Recognition, Knowledge, Sentiment, Accuracy, Reach, Consistency." |
| `gbp-product-2-engine-coverage.png` | "5 AI engines, one dashboard", "5/5 engines tracked live", "ChatGPT, Gemini, Claude, Perplexity, and Meta AI." |
| `gbp-logo-720-transparent.png`, `gbp-logo-720-white-bg.png` | profile logo tiles, no copy |

Three things follow, and two of them are problems that are **live on the
profile right now** and are outside this task's write scope:

1. **Two of those five images advertise Meta AI as a live engine.** Meta AI was
   retired on 2026-07-16 and is in no plan set. The cover and the engine
   coverage card are both stale and should be replaced or removed. Flagged, not
   fixed: `marketing/` is not in this task's scope.
2. **"5 AI engines" is now wrong in both directions.** Growth PRO monitors
   seven. Essentials monitors three.
3. Those images use a teal `#00d4aa` and blue `#3B82F6` accent that predates the
   current token system, and set Liberation Sans, not Inter. The four new images
   are on the campaign tokens and on Inter.

**Deliberately not repeated here:** the "Be the brand AI recommends" line, the
AI Visibility Score six-dimension framing, and the engine-count-as-headline
angle. Those are the three things the channel has already said.

---

## Verification

`_build/verify_gbp_and_thumbnails.py`, run against this file, the thumbnail
README, and all 13 rendered images. Every check is negative-controlled: the
defect it claims to catch is injected, the check is confirmed to fire, then the
injection is reverted. A check that has not been seen going red is not evidence.
