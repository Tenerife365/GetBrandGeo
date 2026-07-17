# BrandGEO Hero Image Generation Guide

**Method: programmatic composition (Pillow), NOT AI image generation.**
This produced the approved BG-012–015 heroes (2026-07-10, see CLAUDE.md
§9.18 D). AI image generators (Canva AI, DALL-E, Midjourney, etc.) were
tried first and failed 14/14 candidates — they *approximate* brand colors
and invent off-brand elements (stock photos, wrong palettes, fabricated
quotes). Code hits the exact hex values and uses the real logo file,
deterministically. Any Claude model that can write Python can follow this
guide — route to **Sonnet 5** (implementation work per the hybrid-routing
rule); no special model needed.

## The working generator

`hero_image_generator.py` (repo root) is the exact script that produced
bg-012–015-hero.png. To make a new hero: copy the script, replace the
four `make(...)` calls at the bottom with one for the new article, run
with Python 3 + Pillow. Each `make()` call is pure data:

```
make("bg-0XX-hero.png",
    "BG-0XX · <Topic Kicker>",                      # teal kicker line
    [[("word ", 'w'), ("keyword", 'g')], [...]],    # headline lines; 'w'=white, 'g'=gradient
    ["subline 1", "subline 2"],                     # gray subheadline, pre-wrapped
    [(num, label, source), x4],                     # 4 stat cards
    "<Short Topic>")                                # footer-right label
```

## Non-negotiable brand rules (all encoded in the script — do not change)

- Canvas: 1149×1369 px (established bg-article hero ratio).
- Background: `#08080f` (site `--bg`), with soft violet glow top-left +
  teal glow bottom-right (GaussianBlur'd ellipses).
- Logo: the REAL `brandgeo/web/logo.png`, top-left, ~74px tall. Never a
  drawn/approximated logo.
- Wordmark: "Brand" in white + "GEO" filled with the site's gradient
  `#3B82F6 → #8B5CF6`. Tagline "The AI Visibility Platform" below.
- Badge top-right: "BrandGEO Research™" pill, teal `#00d4aa` text/border.
- Headline: Liberation Sans Bold ~84px (closest sandbox font to Inter),
  white, with ONE key word/phrase in the blue→violet gradient.
- Stat cards: 2×2 grid, rounded 18px, fill `#11111c`, 1px border
  `rgba(255,255,255,.10)`; big number alternating teal/violet; every
  stat MUST come from the article's own sourced findings — never invent
  numbers (rules/content-integrity.md), and each card carries its
  "Source: X" line.
- Pillar pill row above footer: Measure AI Visibility · Track Citations ·
  Analyze Competitors · Optimize AI Presence (auto-shrinks to fit margins).
- Footer: divider line, `getbrandgeo.com` in teal left, topic label right.
- 60px side margins everywhere; nothing may touch the canvas edge.

## Workflow for a new hero

1. Read the target article's HTML — pull its 3–4 strongest *sourced*
   stats (findings bar / body). No stat without a named source.
2. Fill in one `make()` call; keep headline ≤ 2 lines (check width —
   the script does not auto-wrap headlines).
3. Run, then VIEW the output with the Read tool (it renders images) —
   check: nothing overflows card/canvas edges, gradient keyword reads
   clearly, sources present. Iterate until clean; it's seconds per run.
4. Save directly to `brandgeo/web/images/bg-0XX-hero.png` (the filename
   articles already reference).
5. Remind Constantin: cPanel upload must include the `images/` subfolder
   explicitly (nested-folder misses happened twice — CLAUDE.md §9.13),
   then browser-check the article + blog.html.

## Variants

- **Homepage og-image**: same script, canvas 1200×630, drop the stat
  grid to a single row of 3, bigger wordmark — still pending as of
  2026-07-10 (CLAUDE.md §9.6 item 3 caveat).
- **City-page heroes** (upcoming, §9.18): same layout; kicker
  "City Research · <City>", stats from that city's own pipeline data.
- **LinkedIn/social sizes**: 1200×627 landscape or 1080×1080 square,
  same rules.

## Environment notes

- Sandbox path to web folder:
  `/sessions/<session>/mnt/Constantin Daniel Goane--BrandGEO/brandgeo/web`
  (check the session's own mount map — the session slug changes).
- Pillow is preinstalled; fonts: use
  `/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf` (+
  `-Regular`). Inter is not available in the sandbox.
- Writing PNGs to the mounted folder via Python works; deleting files
  does not (known mount limitation) — overwrite instead of delete.
