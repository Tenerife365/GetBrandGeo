# Google Business Profile product link pack

Lane: 1, static listing. Target: live this week.

**Read `docs/growth/outbound-infra.md` STEP 6 first, most of the GBP fix is
already instructed there** (delete two stale images naming Meta AI and "5 AI
engines," upload the two corrected replacements already rendered at
`docs/growth/CAMPAIGN-2026-07-30/google-business-profile/`). That work is
about the profile's photos and description being accurate. **This pack
covers what STEP 6 does not: the dedicated Products feature and the primary
website link**, which is the S23-specific ask (a product/service link, not
just a truthful photo).

---

## UTM link

```
https://getbrandgeo.com/?utm_source=gbp&utm_campaign=launch#free-audit
```

## 1. Primary website link (Edit profile → Business information → Contact)

```
https://getbrandgeo.com/?utm_source=gbp&utm_campaign=launch#free-audit
```

Confirm this is the live value: if the field currently holds a bare
`https://getbrandgeo.com` with no tag, replace it with the UTM version so GBP
traffic is attributable per `channel-attribution-spec.md`.

## 2. Products section (Edit profile → Products → Add product)

GBP's Products feature lists individual items with their own name, price,
description, and link, this is the part distinct from the general profile
photos/description STEP 6 already fixed. Add one product entry per self-serve
plan (skip Managed/Enterprise, those are done-for-you and not really "products
to buy" in this feature's sense):

**Product 1**
```
Name: BrandGEO Free
Price: EUR 0/month
Description: Check your brand's AI visibility on Gemini, free. See if you're
mentioned when people ask AI for recommendations in your category.
Link: https://getbrandgeo.com/?utm_source=gbp&utm_campaign=launch#free-audit
```

**Product 2**
```
Name: BrandGEO Radar
Price: EUR 29/month (launch price, EUR 39/month list)
Description: Weekly monitoring across ChatGPT... no, across Gemini and
Claude, 7 buyer prompts a week, 1 website. Built for a small business or
solo operator who wants ongoing visibility, not a one-time check.
Link: https://getbrandgeo.com/?utm_source=gbp&utm_campaign=launch#free-audit
```
(Note: Radar's engines are Gemini + Claude, NOT ChatGPT, corrected in the
draft above; do not paste a version that says ChatGPT for Radar, that would
misstate the tier per `planConfig.ts` PLAN_ENGINES.radar.)

**Product 3**
```
Name: BrandGEO Essentials
Price: EUR 99/month
Description: ChatGPT, Gemini, and Claude, 18 buyer prompts a week, 2
websites.
Link: https://getbrandgeo.com/?utm_source=gbp&utm_campaign=launch#free-audit
```

Add Growth (EUR 299) and Growth PRO (EUR 449) as additional product entries
if GBP's picker allows more than three, same pattern, engine counts and
prompt allowances from `planConfig.ts` PLAN_ENGINES / PLAN_PROMPTS (Growth: 5
engines, 35 prompts, 2 sites; Growth PRO: 7 engines, 56 prompts, 3 sites).

## Product images

GBP requires a square image per product. Use:

| Product | Image |
|---|---|
| Free / Radar / Essentials (shared, or pick per product if GBP allows only one image reused) | `docs/growth/brand-kit-2026-07-29/png/mark-square/brandgeo-mark-canvas-512.png` |

If a more specific per-tier image is wanted, none exists in the brand kit yet
, flag for design rather than reuse a mismatched asset.

---

## Walkthrough checklist

1. [ ] Complete `outbound-infra.md` STEP 6 first if not already done (delete
   the two stale images, upload the two corrected ones), this pack assumes
   that's either done or being done in the same session.
2. [ ] Update the primary website field to the UTM-tagged link.
3. [ ] Add the Free, Radar, and Essentials product entries exactly as drafted
   above (note the Radar engine correction: Gemini + Claude, not ChatGPT).
4. [ ] Add Growth and Growth PRO product entries if the picker supports more
   than three.
5. [ ] Upload the square product image to each entry.
6. [ ] Publish and confirm the Products tab is visible on the live public
   profile (not just the editor).
7. [ ] Report back the confirmed-live state for the S23 registry row.
