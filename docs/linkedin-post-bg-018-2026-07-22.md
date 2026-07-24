# LinkedIn Post: BG-018, 2026-07-22

Companion post for `bg-018.html` ("We Fixed 5 Rounds of False Positives in Our
AI Visibility Scoring"), published and confirmed live on getbrandgeo.com
2026-07-22. Image: `marketing/linkedin-2026-07-22/bg018-false-positives.png`
(1200x627, same card style as `marketing/linkedin-company-2026-07-15/`).
Checked for em dashes with a direct grep on this file, zero found.

Two variants below, matching the established personal-vs-company voice split
(`linkedin-posts-2026-07-17.md`). Pick whichever profile you're posting from,
or use both across the two.

---

## PERSONAL PROFILE VERSION

Five different bugs. Same root problem: reading what an AI engine actually
says and turning it into a trustworthy number is harder than it looks from
the outside.

We found the fifth one last week. One of our clients got a recommendation
that scored a #1 ranking and positive sentiment under one heading style, and
no ranking at all with neutral sentiment under a slightly different one.
Same answer, same praise, different score, because a medal emoji sitting in
front of the heading happened to land right on the character budget our
extraction logic used to detect ranked lists.

We wrote up all five, in order: section headings mistaken for competitor
names, bolded field labels like "Pricing:" mistaken for brand names, that
emoji bug, and two language-specific misses in Romanian and English
checklist wording.

After the fifth one, patching a sixth rule stopped feeling like the right
instinct. So we added a small model that only gets to remove candidates from
an already-extracted list, never add one, and falls back to the original
rules if anything about the model call goes wrong.

If you're evaluating any AI visibility tool, not just ours, it's worth
asking whether they've found bugs like this in their own pipeline, and
whether they'll actually tell you about it.

Full writeup: https://getbrandgeo.com/bg-018.html

*Source: BrandGEO's own engineering log, five extraction accuracy fixes
shipped between July 9 and July 16, 2026, held in place by a 156-assertion
regression suite.*

---

## COMPANY PAGE VERSION

New from BrandGEO Research: "We Fixed 5 Rounds of False Positives in Our AI
Visibility Scoring."

Over six weeks, BrandGEO found and fixed five distinct false positive bugs
in its own AI response analysis pipeline: bolded section headings mistaken
for competitor names, colon-terminated field labels like "Best for:" and
"Pricing:" mistaken for brand names, a formatting quirk where an emoji's
character width silently changed a ranked recommendation's score, and two
language-specific misses in Romanian and English checklist wording.

Rather than add a sixth structural rule, BrandGEO layered a semantic
classifier on top of the existing filters: a small model that can only
remove already-extracted candidates, never add new ones, and fails open to
the original rules on any error or timeout.

Every fix is locked in by a 156-assertion regression suite built from real
production examples, not synthetic test cases.

Read the full methodology: https://getbrandgeo.com/bg-018.html

*Source: BrandGEO engineering log, documented fixes shipped July 9 to July
16, 2026.*
