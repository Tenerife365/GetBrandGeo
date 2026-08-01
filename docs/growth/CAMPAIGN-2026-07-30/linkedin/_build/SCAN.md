# Compliance scan and its negative controls

Output of `python scan_linkedin.py --control`. Runs on delivered bytes: the whole
of `POSTS.md` including its own headings, and `drawn_strings.json`, which the
renderer writes from inside its own `text()` call, so it is what was put on a
canvas rather than a table that could drift from the render.

**28 of 28 injections fired.** Two checks were blind on earlier runs. Both were
fixed rather than reported as passing.

1. **`image-size` was unreachable.** The control referenced a file that did not
   exist, so `image-missing` fired first and the loop moved on before reaching
   the size test. The control now writes a real 1000x1000 PNG named
   `...-1200x1200.png`, confirms the size check fires on it, and deletes it.
2. **`measured-subject` did not catch the two names it exists to catch.**
   Injecting `McDermott Will & Emery` and `McDermott Will & Schulte` passed
   clean while the all-lower-case `mcdermott will & schulte` fired, which is
   backwards. Cause: `split_camel`, added to defeat camel-case hashtags, turns
   `McDermott` into `Mc Dermott`, so a haystack that had only been camel-split
   cannot match any name carrying an internal capital. The check now matches two
   needle forms against two haystacks. A defence against one trap had opened a
   hole for another, and only the control found it.

Two harvester notes, both erring in the safe direction:

* The oracle originally required EVERY core token to be a word the corpus never
  writes lower case. That dropped `McDermott Will & Emery`, because `will`
  appears lower case, so a real name walked through a 202 name corpus
  undetected. One qualifying token is now enough, which raised the corpus to 445
  names.
* The corpus over-includes. `A Perfect Streak Hits` is a fragment of a page
  title, not a company. A false positive costs a re-read. A false negative puts
  someone's name in an advert.

Adjudicated by hand rather than auto-failed, per the refinement that a universal
is a claim quantifying over PEOPLE and not merely an absolute word appearing:
`cannot`, `every`, `never`, `any`. Each occurrence was checked individually.
`we cannot say whether the error is stable`, `every prompt`, `every other page in
the corpus`. None quantifies over people or businesses.

```
NEGATIVE CONTROLS
  FIRED   dash                   A line with an em dash — right here.
  FIRED   dash                   A line with an en dash – right here.
  FIRED   banned-vocab           A seamless and robust pipeline.
  FIRED   banned-vocab           We leverage the collection queue.
  FIRED   program-superlative    This is the first result of its kind anywhere in this re
  FIRED   program-superlative    The strongest consensus found in this program so far.
  FIRED   universal              Nobody does this by hand.
  FIRED   universal              Every business is invisible to AI.
  FIRED   retired-engine         We collect Meta AI results daily.
  FIRED   not-live-engine        Copilot and DeepSeek are included.
  FIRED   engine-count           We monitor five engines today.
  FIRED   image-missing          See feed/li-99-does-not-exist-1200x1200.png
  FIRED   image-size             See feed/li-98-control-1200x1200.png
  FIRED   word-count             (structural)
  FIRED   prefold                (structural)
  FIRED   question-opener        (structural)
  FIRED   dash                   —
  FIRED   banned-vocab           a seamless result
  FIRED   program-superlative    the first result anywhere in this research program
  FIRED   measured-subject       As seen with Beste Arbeitsrechtsanwälte.
  FIRED   measured-subject       As seen with Beste Arbeitsrechtsanwalte.
  FIRED   measured-subject       As seen with A Perfect Streak Hits.
  FIRED   measured-subject       As seen with #APerfectStreakHits.
  FIRED   measured-subject       As seen with Atlanta’s Justin Landis Group.
  FIRED   measured-subject       As reported by McDermott Will & Emery.
  FIRED   measured-subject       As reported by McDermott Will & Schulte.
  FIRED   measured-subject       As reported by mcdermott will & schulte.
  FIRED   measured-subject       As reported by Cheval Blanc Patrimoine.

28 of 28 injections fired

scanned: POSTS.md (292 lines), 12 rendered files (161 drawn strings), 12 image references
measured-subject corpus: 445 names harvested from 37 research pages
post word counts: Post 1=228, Post 2=216, Post 3=250, Post 4=239
soft absolutes present, adjudicated by hand not auto-failed: any, cannot, every, never

FINDINGS: 0
```
