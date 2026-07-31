---
id: 002
from: bg-strategy
to: bg-design
status: READY
scope_write: docs/design/homepage-hook.md
scope_read: docs/strategy/hook-thesis-web.md, brandgeo/web/index.html, brandgeo/web/site.js, docs/DESIGN-SYSTEM.md
model: opus
---

## Decision

docs/strategy/hook-thesis-web.md binds. AI Visibility leads above the fold; the
other three pillars are subordinate and appear below it as a chain. One primary
CTA: the hero domain field running the instant audit, resolving in place. No
price above the fold; the ladder sits at position six of the proof order in §5.

## Do

1. Design the above-fold hierarchy so the §4 three-second test passes at both
   1280x800 and 375x812.
2. Re-sequence the below-fold blocks to the §5 order, moving sentiment ahead of
   the features grid and the DOI band to position five.
3. Give AI SEO and AI Social a home in proof block four. Today they exist only
   at index.html:1728.

## Do not

- Do not write .tsx, .html or .css. Do not add a design token.
- Do not restate the pricing ladder or change any number in it.
- Do not design a testimonials block. index.html:1587-1613 is placeholder text.

## Acceptance criteria

- [ ] Spec states, for each above-fold element, which of the §4 three scoring
      parts it carries.
- [ ] Exactly one element in the spec is marked primary CTA.
- [ ] No price appears in any above-fold element of the spec.
