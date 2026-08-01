# Run 20260730-0831

**PAUSED BY CONSTANTIN MID-RUN, 2026-07-30 09:25.** The hourly cron `ddfe451d`
was cancelled at the same time. This run is **three quarters complete**. Nothing
here is broken by the pause except Instagram, which is genuinely unusable and is
described below.

**Hook driver: #4, contrarian, SECOND PASS.** "Ranking first in Google does not
mean you exist in an AI answer." First pass was `run-20260730-0113`. When the
campaign resumes, the next run advances to **#5, concrete proof, second pass**.

**Music: `tension-minor`** on all four, held constant for all ten runs.

---

## Status

| Platform | Silent | Scored | Audio silent/scored | Band | Ink box | Headroom T/B/R | Verdict |
|---|---|---|---|---|---|---|---|
| instagram | 27.000 | 27.000 | 0 / 1 | 20 to 30, yes | x130..1014 y400..1663 | 180 / **-163** / **-114** | **UNUSABLE** |
| facebook | 25.400 | 25.400 | 0 / 1 | 20 to 30, yes | x100..802 y300..1235 | 80 / 245 / 98 | OK |
| tiktok | 30.000 | 30.000 | 0 / 1 | 25 to 40, yes | x88..770 y270..1449 | 70 / 111 / 110 | OK |
| youtube | 43.800 | 43.800 | 0 / 1 | 30 to 45, yes | x158..733 y270..1143 | 90 / 397 / 167 | OK |

Every silent master carries **zero audio streams**, not a muted track. Every
scored cut carries exactly one. Durations match within 50ms on all four. The
control region reports 0 ink on every cut, which is what makes the headroom
numbers mean anything.

## Instagram is unusable and was being fixed when the pause landed

Its ink runs **163px into the bottom reserve and 114px into the right reserve**.
On Instagram that puts copy under the caption and action rail, which is the
failure mode the safe-zone check exists to prevent.

This is not a pause artefact. The agent had already found it and was mid-fix:
its last message was that the `x>=760` region it had been using as an
empty-by-design reference **stopped being empty once the CTA line grew to
x=776**, which inflated its own noise floor to 232 and hid the breach from its
first measurement. It was correcting the region set and re-rendering.

**Do not upload `instagram-silent.mp4` from this run.** There is no `NOTES.md`
for Instagram, which is the other tell that the cut never finished.

## Upload set, three of four

- `facebook/facebook-silent.mp4`
- `tiktok/tiktok-silent.mp4`
- `youtube/youtube-silent.mp4`

Pair each with the platform's own in-app audio. The scored cuts are for paid,
embeds and decks.

## Verification of the previous run, 20260730-0613

All four platforms PASS. Full table in that run's `RUN.md`. Every dash and
banned-word hit was a false positive: they sit inside the agents' own
negative-control injection tables, which contain `seamless`, `SEAMLESS AND
ROBUST`, `delve into it` and em dashes on purpose as proof their scanners fire.
One genuine use of `unlock` in YouTube's prose was fixed.

**The same false positive recurred on this run**, on Facebook and YouTube, from
the same cause, and was checked rather than assumed: Facebook's hit is
`inject 'A seamless answer' -> FIRED`, YouTube's are
`("a seamless and robust pipeline")` and `("we leverage this to elevate
results")`. Both notes are clean. Any future checker over this campaign must
exclude injection tables, or it will report an agent's proof of correctness as a
defect.

No Grok or AI Overviews percentage anywhere in this run.

## When this resumes

1. Re-render Instagram against the same driver, or re-run the whole of driver #4
   pass two if a three-platform run is not comparable enough to be worth keeping.
2. Advance to driver #5, concrete proof, second pass.
3. The cron is cancelled, not paused. It has to be recreated.
