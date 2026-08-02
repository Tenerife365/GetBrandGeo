# BG-034 / Asset 04 — Founder repost

**Channel:** Constantin's personal profile
**When:** Wednesday 2026-09-23, immediately after asset 03
**Mechanic:** repost the Article with commentary. Never a bare reshare.
**Voice:** first person singular. An opinion the company page cannot state.

---

## Repost commentary

Item three on this list is validate your structured data, because a broken FAQPage block fails silently and gets dropped entirely rather than misread.

We found three of those on our own site while writing this checklist. Weeks old, one missing brace each, quietly doing nothing the whole time.

I do not think that is embarrassing to say out loud. I think it would be far worse to publish a checklist telling other people to check something we had never bothered checking ourselves. The whole reason the item is on the list at number three, ahead of five other items that are arguably more interesting, is that it is cheap, it is binary, and it is the kind of mistake that sits there for weeks precisely because nothing visibly breaks.

The item I find hardest to sit with is the one at number four: write your own name the same way everywhere. We caught two spellings of the same hotel in our own study data, from the same company, in the same run. If a company can drift on its own name inside one dataset, I have no confidence most companies have ever actually checked.

None of the nine items on this list require a rebuild. Most of them require someone deciding to look.

---

## Notes

**Why this angle.** The company page can list the checklist neutrally. It
cannot say "we found this bug on our own site and are telling you about it
anyway," because that reads as an admission of fault, not a finding, and an
admission lands differently coming from a founder than from a brand account.

**Not a summary of 03.** Asset 03 leads with the machine translation example
(item 7). This leads with the structured data validation failure (item 3) and
the name consistency item (item 4), and neither appears in 03.

**No CTA, no audit link, no pricing, no hashtags.**

**Grounding.** The three silently invalid FAQPage blocks and the "Only You
Boutique Hotel" / "Only YOU Boutique Hotel Madrid" naming inconsistency are
both stated in `brandgeo/web/bg-034.html`, items 3 and 4 of its checklist. The
personal framing (finding it uncomfortable, judging it worth disclosing
anyway) is the founder's own commentary, not attributed to the article.
