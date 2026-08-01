# -*- coding: utf-8 -*-
# Generates sidecars for: product/
#
# Each product image belongs to one field of one catalogue entry, so each gets
# the text for that field and nothing else:
#
#   stripe-<plan>-1024x1024.txt            Stripe product description
#   stripe-<plan>-1024x1024-name.txt       Stripe product name
#   gbp-<plan>-1440x1440.txt               GBP product description
#   gbp-<plan>-1440x1440-name.txt          GBP product name
#   gbp-<plan>-1440x1440-price.txt         GBP price field
#   gbp-<plan>-1440x1440-category.txt      GBP category field
#   promo-<plan>-<size>.txt                the short ad and DM line
#
# The four promo sizes are four crops of one promotion, so all four carry the
# same short line. The "longer paragraph, for a landing block" in COPY.md is
# body copy for a web page rather than a caption for an image, so it stays in
# COPY.md and no image is paired with it. That is a decision, recorded in
# product/PAIRING.md.

from _common import write

P = "product/"
PROMO_SIZES = ["1080x1080", "1080x1350", "1200x630", "1600x900"]


def plan(key, stripe_name, stripe_desc, gbp_name, gbp_category, gbp_price,
         gbp_desc, promo_short):
    write(P + "stripe-%s-1024x1024.txt" % key, stripe_desc)
    write(P + "stripe-%s-1024x1024-name.txt" % key, stripe_name)
    write(P + "gbp-%s-1440x1440.txt" % key, gbp_desc)
    write(P + "gbp-%s-1440x1440-name.txt" % key, gbp_name)
    write(P + "gbp-%s-1440x1440-category.txt" % key, gbp_category)
    write(P + "gbp-%s-1440x1440-price.txt" % key, gbp_price)
    for size in PROMO_SIZES:
        write(P + "promo-%s-%s.txt" % (key, size), promo_short)


plan(
    "free",
    "BrandGEO Free",
    "Track how Gemini answers when buyers ask for a company like yours. 5 buyer prompts, checked monthly, one engine. No card required. Start at getbrandgeo.com.",
    "BrandGEO Free",
    "AI visibility monitoring",
    "EUR 0",
    "See what Gemini says about your category. Free, no card. You get 5 buyer prompts, checked once a month, against one engine: Gemini. It is the smallest honest version of the product, not a trial that expires. Radar adds Claude and a weekly check for EUR 29. Start at getbrandgeo.com.",
    "Ask Gemini what it recommends in your category. BrandGEO Free checks 5 prompts a month against it, EUR 0, no card. getbrandgeo.com",
)

plan(
    "radar",
    "BrandGEO Radar",
    "Weekly AI visibility on Gemini and Claude. 7 buyer prompts, one website, with mention, position and sentiment per engine. EUR 29 a month launch price, EUR 39 list. getbrandgeo.com",
    "BrandGEO Radar",
    "AI visibility monitoring",
    "EUR 29 / mo",
    "Two AI engines, checked weekly: Gemini and Claude. You write up to 7 buyer prompts for one website, and we record whether each engine names you, where in the answer, and which competitors it names instead. EUR 29 a month for our first 100 customers, EUR 39 after. Subscribe at getbrandgeo.com.",
    "Two AI engines, 7 buyer prompts, checked every week. BrandGEO Radar is EUR 29 a month for our first 100 customers. getbrandgeo.com",
)

plan(
    "essentials",
    "BrandGEO Essentials",
    "AI visibility monitoring across ChatGPT, Gemini and Claude. 18 buyer prompts, refreshed weekly, with mention, position and sentiment per engine. EUR 99 per month. getbrandgeo.com",
    "BrandGEO Essentials",
    "AI visibility monitoring",
    "EUR 99 / mo",
    "Monitor three AI engines: ChatGPT, Gemini and Claude. You write up to 18 buyer prompts, we run them weekly and record whether each engine names you, where in the answer, and which competitors it names instead. EUR 99 per month. Subscribe at getbrandgeo.com.",
    "Three AI engines, 18 buyer prompts, refreshed weekly. BrandGEO Essentials is EUR 99 a month. getbrandgeo.com",
)

plan(
    "growth",
    "BrandGEO Growth",
    "AI visibility monitoring across five engines: ChatGPT, Gemini, Claude, Perplexity and Google AI Mode. 35 buyer prompts, refreshed weekly, plus AI SEO on 10 pages. EUR 299 per month. getbrandgeo.com",
    "BrandGEO Growth",
    "AI visibility monitoring",
    "EUR 299 / mo",
    "Five AI engines, weekly: ChatGPT, Gemini, Claude, Perplexity and Google AI Mode. 35 buyer prompts, competitor tracking, and AI SEO across 10 of your pages with one audit a week. Google AI Overviews and Grok start at Growth PRO. EUR 299 per month at getbrandgeo.com.",
    "Five AI engines including Perplexity and Google AI Mode, 35 prompts, weekly. BrandGEO Growth, EUR 299 a month. getbrandgeo.com",
)

plan(
    "growth_pro",
    "BrandGEO Growth PRO",
    "All seven collecting engines, adding Grok and Google AI Overviews to Growth. 56 buyer prompts, refreshed weekly, plus AI SEO on 30 pages. EUR 449 per month. getbrandgeo.com",
    "BrandGEO Growth PRO",
    "AI visibility monitoring",
    "EUR 449 / mo",
    "Seven AI engines, weekly. Growth PRO adds Grok, which reads live posts on X, and Google AI Overviews, the summary block on an ordinary Google results page. 56 buyer prompts, up from 35 on Growth. AI SEO covers 30 pages. EUR 449 per month at getbrandgeo.com.",
    "Growth PRO adds two engines Growth cannot see: Grok and Google AI Overviews. Seven in total, 56 prompts, EUR 449 a month. getbrandgeo.com",
)

plan(
    "managed",
    "BrandGEO Managed",
    "Done for you. All seven collecting engines, 200 buyer prompts, AI SEO on 100 pages, written and run by us. From EUR 1,500 per month. Sales assisted, talk to us at getbrandgeo.com.",
    "BrandGEO Managed",
    "Managed AI visibility service",
    "from EUR 1,500 / mo",
    "The same seven engines as Growth PRO, run for you rather than by you. 200 buyer prompts written and maintained on your behalf, AI SEO across 100 pages with three audits a week, and the reporting done. Priced from EUR 1,500 per month, quoted per account. Talk to us at getbrandgeo.com.",
    "Seven AI engines, 200 buyer prompts, all of it run for you. BrandGEO Managed, from EUR 1,500 a month. getbrandgeo.com",
)

plan(
    "enterprise",
    "BrandGEO Enterprise",
    "Seven collecting engines with no prompt ceiling and no refresh cooldown. AI SEO on 500 pages. Copilot and DeepSeek are reserved and do not collect yet. Custom pricing. getbrandgeo.com",
    "BrandGEO Enterprise",
    "Managed AI visibility service",
    "Custom",
    "Seven collecting engines with no published prompt ceiling and no refresh cooldown, AI SEO across 500 pages, and seven audits a week. Two further engines, Copilot and DeepSeek, are reserved on this tier and switch on the day they start collecting. Neither collects today. Priced per account at getbrandgeo.com.",
    "Seven AI engines, no prompt ceiling, no refresh cooldown. BrandGEO Enterprise is priced per account. getbrandgeo.com",
)

print("gen_product: done")
