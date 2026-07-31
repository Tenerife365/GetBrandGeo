# Queue: four-pillar distribution

**44 assets, 8 channel files, 4 Remotion components.** Nothing here has been
posted, scheduled or sent. Publication needs Constantin's explicit approval per
batch, and approving one batch is not approval of the next.

Pillars: **P1** engine count vs retrieval (bg-021) · **P2** cross-engine
consensus (bg-016 + 27 city pages) · **P3** measurement integrity (bg-018,
bg-019) · **P4** peer-archived research (bg-017, Zenodo).

---

## Verification, run 2026-07-30 before this queue was written

| Check | Result |
|---|---|
| Em, en, figure, minus dashes across all files | **0** |
| Banned vocabulary in prose | 0 (14 hits were `00-BRIEF.md` quoting its own prohibition list) |
| Grok or AI Overviews percentage | 0 (1 hit was the brief's example of what not to write) |
| Prices against `planConfig.ts` | clean, no figure outside 0 / 99 / 299 / 449 / 1,500 / 15,000 |
| Meta AI named without its retirement | 0 of 12 hits were real, every one carries 16 July 2026 |
| Copilot or DeepSeek sold as live | 0 |
| Vertical video scripts, three populated columns | 157 timed rows, **0** incomplete |
| Instagram carousel slides over 12 words | **0** |
| X posts at or over 280 characters | 0 of 31 stated counts |
| JSON-LD in `01-blog.md` parsed with `json.loads` | **12 of 12 valid** |

Two scanner false-positive classes worth remembering, both cost a re-check:
a brief that lists banned words trips a banned-word scan, and a Meta AI
qualifier often sits in the next clause rather than within 60 characters.

---

## Suggested order

Sequenced so each pillar's MOFU proof is live before the TOFU assets that point
at it. Blog first in every pillar, since three channels link to it.

### Wave 1, P4 authority (establishes the right to make claims)
| # | Channel | Asset | Funnel |
|---|---|---|---|
| 1 | Blog | Article 4, most AI search statistics cannot be checked | MOFU |
| 2 | LinkedIn | Post 4, peer-archived research | MOFU |
| 3 | X | Thread 4, 222 responses read by hand, published with a DOI | TOFU |
| 4 | Instagram | IG-C4 carousel + IG-R4 reel | MOFU / TOFU |
| 5 | TikTok | TT4 | TOFU |
| 6 | YouTube | Short 7d + long-form 7h | TOFU / MOFU |
| 7 | Short-form | X 1.4, Threads 2.4, Facebook 3.4 | TOFU / MOFU |
| 8 | GBP | 4.4 | BOFU |

### Wave 2, P3 measurement integrity (the differentiator)
Blog Article 3 → LinkedIn Post 3 → X Thread 3 → IG-C3 + IG-R3 → TT3 →
Short 7c + long-form 7g → X 1.3, Threads 2.3, Facebook 3.3 → GBP 4.3.

### Wave 3, P2 consensus (the dataset nobody else has)
Blog Article 2 → LinkedIn Post 2 → X Thread 2 → IG-C2 + IG-R2 → TT2 →
Short 7b + long-form 7f → X 1.2, Threads 2.2, Facebook 3.2 → GBP 4.2.

### Wave 4, P1 engine count vs retrieval (the sales argument)
Blog Article 1 → LinkedIn Post 1 → X Thread 1 → IG-C1 + IG-R1 → TT1 →
Short 7a + long-form 7e → X 1.1, Threads 2.1, Facebook 3.1 → GBP 4.1.

**Why P1 last rather than first.** It is the most directly commercial of the
four and it argues that a competitor's engine count is misleading. That reads as
marketing on its own and as an evidenced position after P4 and P3 have
established how BrandGEO handles its own numbers.

---

## Blockers before anything ships

1. **Every `datePublished` and `dateModified` in `01-blog.md` is a placeholder**,
   as are the hero image paths and the BG numbers. All four slugs are `bg-0XX`.
   `bg-021` is taken and the grok package also holds a draft awaiting a number.
   Assign real numbers and dates at publish time.
2. **Re-validate the JSON-LD after HTML conversion, by parsing.** It is valid in
   markdown now. Three live city pages already carry a `"}]` for `"}}]` typo in
   the last FAQ entry, which silently dropped the whole schema. That is the exact
   failure mode this content is about.
3. **`bg-016.html` contradicts itself**: its key-findings panel says the 20
   categories ran across four cities, its body names six. Every asset here cites
   the category count without attaching a city count, so nothing inherits it, but
   the page should be reconciled.
4. **`brandgeo-vs-athenahq.html:277`'s "$100 per 1,250 credits"** is
   secondary-sourced competitor pricing that is now permanently exempted from the
   claims checker, so nothing will re-flag it. Worth a first-party check.
5. **Captions are uncalibrated.** Constantin was asked for three or four posts he
   is happy with and has not sent them. The LinkedIn agent extracted a voice from
   the four published archives in `docs/` instead, and documented what it
   extracted, so this is mitigated rather than solved.

## Not in this queue

`10-remotion/*.tsx` are motion components, not posts. They compile against no
project in this repo (Remotion is not installed) and are specs for a future
render, not shippable assets.
