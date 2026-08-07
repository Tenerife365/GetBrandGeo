# Instagram Reel, script-only fallback, 2026-08-07 pass

**Not rendered.** Same reasoning as `facebook/reel/facebook-NOTES.md` in this
same day's folder: `ffmpeg` and Pillow are available in this container, but a
verified four-cut render across facebook, instagram, tiktok and youtube was
out of scope for a single pass covering five days across eight platforms.

**Hook driver:** concrete proof / brand-forward. Opens on "we found," framing
the exception as a discovery rather than the plainer factual framing used on
the Facebook cut of this same script.

## On-screen text, beat by beat

**Beat 1** (0 to 5s)
```
We found one category
where two languages
nearly agreed.
```

**Beat 2** (5 to 10s)
```
Rome real estate,
through Perplexity.
Nine of ten names
matched, Italian
and English.
```

**Beat 3** (10 to 15s)
```
Every other category
split hard. 82% of
the companies we found
appeared in only one
language.
```

**Beat 4** (15 to 21s)
```
What was different:
those firms were
documented the same way
in both, by sources
other than themselves.
```

**Beat 5** (21 to 27s)
```
Real pages in the
second language.
Structured data in the
right language. One
spelling of your name.
```

**Beat 6** (27 to 30s)
```
Check both languages.
getbrandgeo.com
```

Persistent, whole runtime: the BrandGEO wordmark, bottom left.

### Copy compliance

Same as the Facebook cut in this same day's folder: no em or en dashes, no
banned words, every figure traced to `brandgeo/web/bg-034.html` and
`brandgeo/web/bg-027.html`, unchanged from those sources.

## Target technical spec (not yet built against)

1080x1920, 9:16, 30fps, H.264, `yuv420p`. Safe-zone target for Instagram
Reels, per this runway's own already-verified figures elsewhere in this
pipeline: top 220px, bottom 420px (usable y up to 1500), right 180px. Not
verified against this cut, since nothing was rendered.

## Open items

Same as the Facebook cut: this script is shared across all four video slots
this day with only the hook line varied, and a future render pass should
write a fully independent script per platform instead. No cover PNG exists.
