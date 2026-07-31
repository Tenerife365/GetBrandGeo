# 08. Google Business Profile (BOFU)

**Driver:** Utility. **128 words. One CTA.**
Paired visual: **V6**.

This is the only asset in the package permitted to carry a price. No thought
leadership, no contrarian framing, no argument about the category. GBP is local
and transactional and the reader is closer to buying than anyone else in this
package.

---

**Post type:** Update
**CTA button:** `Sign up`
**Button URL:** `https://getbrandgeo.com`

> **We now monitor seven AI engines**
>
> BrandGEO tracks whether AI engines recommend your business when customers ask
> for one. As of today we monitor seven: ChatGPT, Gemini, Claude, Perplexity,
> Google AI Mode, Google AI Overviews and Grok. All seven run with live web
> search, and we refresh every week on every paid plan.
>
> Two of those are new today. Google AI Overviews is the AI summary Google puts
> above the links on an ordinary search, which is a different surface from AI
> Mode. Grok is the only one that reads X as well as the web. Both are included
> on Growth PRO at EUR 449 a month.
>
> Want to see where you stand first? Run a free audit on your own domain. No card
> needed.

---

## Notes

- Prompt caps are deliberately absent. The GBP audience does not buy on prompt
  volume and the number is currently in dispute between the site and the code.
  See `00-strategy.md` §5.
- **EUR 449 is the only price in this package.** If the Growth PRO price moves,
  this asset is the only one that needs a rewrite.
- GBP posts have a visible truncation point well before the character limit. The
  first line has to carry the whole offer. Verify the exact fold against
  `docs/growth/channel-specs-2026-07-29.md` before scheduling.
- **This is a manual channel. Post it by hand.** API post access needs a narrowly
  granted quota approval, and Product Posts cannot be created through the API at
  all. Do not plan any automation around this asset.
- **V6 has a 10 KB minimum file size problem.** GBP rejects files under 10 KB, and
  a 720x720 card that is mostly near-black with one line of text is exactly the
  shape that compresses below it. Check the byte size after export and pad with
  texture or dither if it lands short. Both details are in the channel spec sheet.
- **Hold until the send gate clears.** GBP is indexed and a launch claim here is
  harder to walk back than a social post.
