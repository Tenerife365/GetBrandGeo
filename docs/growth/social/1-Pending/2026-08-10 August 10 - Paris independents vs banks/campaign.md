# August 10: Paris independents vs banks

Video cut 6, utility driver, run `20260730-0313`. Static: Facebook feed 2
(Madrid language split) and a new text-only Threads post, P9.

**Channels:** facebook (feed, reel), instagram (feed, reel), tiktok (video),
youtube (shorts), threads (feed), linkedin (feed), gbp (post), x (feed).

**Destination:** mostly `getbrandgeo.com/ai-visibility-for-denver.html` and
`/ai-visibility-for-madrid.html`, plus the bio link for Instagram, TikTok and
Threads (no in-caption link on those three).

**UTM campaign:** `campaign2607` on every link that predates this pass.
`pulse` on every link added in this pass (instagram feed, linkedin, gbp, x),
per this backfill's own convention: it is filling gaps in an existing dated
runway, not extending that runway, so its links are tagged separately for
attribution.

Per `docs/growth/PUBLISHING-PLAN.md`, week 2, Mon 08-10. Note: the plan names
Cut 5 for this day; the video files actually on disk here are Cut 6, one
weekday's worth of drift, see the session report for detail.

---

## Backfill pass, 2026-08-07

Added the four slots this day was missing against the brief's gap table,
confirmed against the actual files on disk (not the brief's own claims about
other days, some of which had drifted since it was written):

- **instagram/feed**: a static "screenshot the check" card companion to the
  existing utility Reel (run `20260730-0313`), same three-step method quoted
  verbatim from that Reel's on-screen text and NOTES.md, different execution
  (single static card vs. an 8-scene video). No image rendered this pass
  (PNG/JPG under `docs/growth/social/` are gitignored and this session's
  container is ephemeral, so a rendered file would not survive either way).
  `post.md` alt text is the full card description a render would follow.
- **linkedin/feed**: fresh single post, the Paris wealth management finding
  from `brandgeo/web/bg-027.html` (independent advisors in French, global
  private banks in English, six names in both). Not drawn from BG-033/034,
  since the folder's own title names Paris directly and bg-027 had this exact
  city example unused anywhere in the pipeline yet.
- **gbp/post**: `gbp-5`, the Radar plan (EUR 29/mo for the first 100
  customers, EUR 39 list after; Gemini + Claude; 7 prompts weekly). Next
  unclaimed number in the evergreen GBP series (`gbp-1` through `gbp-4`
  already used elsewhere in this pipeline). Radar had no GBP post of its own
  yet.
- **x/feed**: a 5-tweet thread, "Thread B: the language picked the
  shortlist," the same Paris finding as linkedin/feed but a different cut
  (both lists quoted in full, then the headline four-city stats), text-only
  since the two named lists carry the finding without an image. Character
  counts verified programmatically (URLs counted at the fixed 23-char t.co
  length). All five tweets clear 280 characters with margin.

All four new links use `utm_campaign=pulse`, per this pass's convention
above. Nothing pre-existing in this folder was edited.
