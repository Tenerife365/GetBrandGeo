# LinkedIn company page product link pack

Lane: 1, static listing. Target: live this week.

**The page already exists**, `https://www.linkedin.com/company/79409681`,
confirmed live and already referenced in `index.html`'s own `sameAs` JSON-LD
(per `docs/CRUNCHBASE-PROFILE.md`). This task is not "create a page," it's
"add the product link and bring the page copy current", LinkedIn retired the
old dedicated "Products" tab, so the two places a product link actually lives
on a modern Company Page are the primary **CTA button** and a **Featured**
section item.

---

## UTM link

```
https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
```

## 1. Primary CTA button (Admin view → Edit page → Buttons)

```
Button: Visit website
Destination URL: https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
```

If the page's current CTA points anywhere else (or nowhere), this is the
single highest-leverage edit on the whole page: every visitor sees this
button.

## 2. Featured section (Admin view → Edit page → Featured → Add a link)

```
Link: https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
Title: Check your brand's AI visibility, free
Description: See how visible your brand is across up to seven AI engines,
from ChatGPT and Gemini to Grok and Google AI Overviews. BrandGEO scores your
AI presence.
Thumbnail: docs/growth/brand-kit-2026-07-29/png/social/linkedin-logo-400-white.png
(or a live audit-flow screenshot, if Constantin prefers a product shot over
the logo tile: flagged as a choice, not decided here)
```

## 3. About / Overview section, bring current if stale

Check the page's current "Overview" text against these facts before leaving
it as-is. If it still says five engines or names Meta AI, it's stale the same
way the GBP profile was (see `gbp-live-assets-stale` memory), correct it to:

```
BrandGEO monitors how brands appear across up to seven AI engines: ChatGPT,
Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, and Grok.
Free to check your own visibility; paid plans start at EUR 29/month.
```

## 4. Website field (Admin view → Edit page → Overview → Website)

```
https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
```

## Assets

| Asset | Path |
|---|---|
| Logo (if the page logo needs refreshing) | `docs/growth/brand-kit-2026-07-29/png/mark-square/brandgeo-mark-canvas-512.png` |
| Cover image (1128x191, LinkedIn's banner spec) | **NEEDS CAPTURE/DESIGN**, no asset in the brand kit is sized for LinkedIn's banner ratio; flag for a design pass if the current banner is stale or generic |

---

## Walkthrough checklist

1. [ ] Log in as page admin, open Edit page.
2. [ ] Set the primary CTA button to "Visit website" pointing at the
   UTM-tagged link above.
3. [ ] Update the Website field (Overview tab) to the same UTM-tagged link.
4. [ ] Read the current Overview/About text; if it names Meta AI or "five
   engines," replace with the corrected copy above.
5. [ ] Add or update the Featured section item with the link, title,
   description above.
6. [ ] Check the cover banner; flag to design if stale (no ready asset exists
   at LinkedIn's exact banner ratio).
7. [ ] Confirm each change is live (refresh the public page view, not just
   the admin editor) and report back for the S23 registry row.
