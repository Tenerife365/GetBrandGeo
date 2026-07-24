# BG-023 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-023
**Title:** How We Audit a Site for AI-Readiness Without a Paid Crawling API
**Date:** July 28, 2026
**Status:** Ready (publishes via scheduled cloud routine)

---

## 1️⃣ Image Brief (1200×1200)

Hero generated at `/images/bg-023-hero.png` via the in-house PIL generator, same system as BG-018–022.

---

## 2️⃣ LinkedIn Post

Our AI SEO crawler doesn't use a paid crawling API or a headless browser.

Here's exactly what it does instead, and the one real limit that comes with it.

---

Discovery is sitemap-first: we check /sitemap.xml, walk nested sitemap indexes up to 2 levels deep, and fall back to homepage links if no sitemap exists at all. Every URL gets filtered for same-host, robots.txt compliance, and deduped, capped at 25 pages per audit.

Each page fetch is bounded: 8 seconds, 1.5MB (larger pages get truncated, not dropped). We extract og:title-first titles, meta descriptions, and five structural signals that actually matter for GEO: JSON-LD schema, FAQ schema, tables, lists, H1 count.

---

The real limit: this is a server-side fetch, not a browser. It reads the HTML a server sends — it doesn't execute JavaScript. A client-side-rendered site with no server-rendered content will crawl thin.

We didn't design around that limit quietly. The crawler's entry point is built as a swappable provider specifically so a JS-rendering option can drop in later without any caller changing. Until then, we tell you the limit exists rather than let you find out from an inexplicably low score.

---

A free, sitemap-based crawl and a paid, headless-browser crawl solve different problems. Neither is universally better — the question worth asking any vendor is whether their method matches your site's actual architecture, and whether they've told you where it falls short.

Full breakdown: **BrandGEO Research BG-023**
Link in first comment ↓

#AISEO #GEO #AIVisibility #WebCrawling #GenerativeEngineOptimization #BrandGEO

---

## 3️⃣ First Comment

Full breakdown, including the exact fetch bounds and the JS-rendering limit we disclose upfront: https://getbrandgeo.com/bg-023.html

Same series as our last piece on search-engine notification honesty: https://getbrandgeo.com/bg-022.html

---

## 4️⃣ AI Social — Cross-Platform Post

Our AI SEO crawler runs on a sitemap and a plain server-side fetch — no paid crawling API, no headless browser.

25 pages per audit, 8s timeout per page, 5 structural signals detected (JSON-LD, FAQ schema, tables, lists, H1). The real limit: it can't render JS-heavy sites, and we tell you that upfront instead of letting a low score explain itself.

Full breakdown → getbrandgeo.com/bg-023.html

#AISEO #GEO #BrandGEO

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-023 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform / AI SEO |
| **Primary concept** | Free, sitemap-based AI-readiness site crawling |
| **Supporting concepts** | GEO content audit, structured data, JSON-LD, FAQ schema, robots.txt |
| **Target entities** | CMOs, Marketing Directors, SEO/content leads evaluating AI SEO tools |
| **Canonical URL** | https://getbrandgeo.com/bg-023.html |

---

## 6️⃣ CTA

> Get an AI-readiness audit that tells you what it can and can't see. Request your free AI Visibility audit.

**Alternative CTAs:**
- "Is your site server-rendered or client-side? It matters more than you'd think for AI crawlers."
- "Would you trust a crawler more if it told you its own limits upfront?"

---

## Verification notes (not for publishing)

- **Sitemap discovery depth (2), page cap (25), fetch bounds (8s/1.5MB/14000 chars), 5 signals, Firecrawl provider slot** — all confirmed directly in `_seo_crawl.js`'s constants and function bodies (`crawlSite`, `sitemapCrawl`, `collectSitemapUrls`, `detectSignals`, `fetchAndExtract`).
