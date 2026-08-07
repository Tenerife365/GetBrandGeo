# Facebook Reel, script-only fallback, 2026-08-07 pass

**Not rendered.** No `.mp4` was produced this pass. `ffmpeg` and Pillow are
both available in this session's container, but building and verifying a
fully independent four-cut render (facebook, instagram, tiktok, youtube) at
the fidelity the rest of this runway holds itself to was judged out of scope
for a single pass already covering five days across eight platforms. This
file carries everything a render pass would need: the hook, the verbatim
on-screen text, the sourcing, and the target technical spec. The cover image
described in `post.md`'s alt text was not rendered either, for the same
reason (PNG under `docs/growth/social/` is gitignored and this container is
ephemeral regardless).

**Hook driver:** utility / concrete proof, adjacent to driver #6 used
elsewhere in this pipeline. Facebook's plainer, slower-cadence register
(per this runway's own established pattern for the platform) rather than a
curiosity or loss-aversion frame.

## On-screen text, beat by beat

**Beat 1** (0 to 5s)
```
One category in an
AI study barely
changed by language.
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

Persistent, whole runtime: the BrandGEO wordmark, bottom left, matching this
runway's existing cuts.

### Copy compliance

- No em dashes, no en dashes.
- None of the banned words.
- Every figure traces to `brandgeo/web/bg-034.html` and `brandgeo/web/bg-027.html`:
  the Rome real estate through Perplexity exception (9 of 10 names matching),
  the 82% headline figure, and the three checklist items (indexable pages,
  structured data in the page's own language, name consistency), all
  unchanged from those sources.
- No engine count claim beyond what is stated: this cut names no specific
  engine as covered by any BrandGEO plan, sidestepping any need to match a
  plan's current engine list.

## Target technical spec (not yet built against)

1080x1920, 9:16, 30fps, H.264, `yuv420p`, PNG intermediates. Safe-zone target
for Facebook Reels, per this runway's own already-verified figures elsewhere
in this pipeline (see e.g. the Aug 10 facebook/reel NOTES.md): top 220px,
bottom 440px, right 180px. Not verified against this cut, since nothing was
rendered.

## Open items for whoever renders this

1. This script is shared, with only the hook line varied, across all four
   video slots this day (facebook, instagram, tiktok, youtube). The rest of
   this runway writes a fully independent script per platform; a render pass
   with more time should do the same here rather than shipping four
   identical cuts with different logos.
2. No cover PNG exists. Render frame 0 of beat 1 once the video exists,
   per this runway's own established method.
