---
channel: threads
format: feed
asset: threads-4-an-empty-field-1080x1350.png
link: https://getbrandgeo.com/?utm_source=threads&utm_medium=bio#free-audit
alt: "Dark card headed HOW OUR SCORER REPORTS A RANK, reading 'A number only appears when the engine claimed one. Otherwise the field is empty.' A panel titled WHAT COUNTS AS A CLAIMED RANK lists: a real numbered list, a list with ordering words, a superlative tied to the name, each marked rank; and a brand seen partway down, marked null."
scheduled: 2026-08-21T08:00:00Z
posted_at:
posted_url:
---
We took a fallback out of our own scoring in July and the product got quieter on purpose.

If an AI answer says "here are the top three, in order", that's a rank. If it says "here are a few good options" and then bullets them, it isn't one. To a parser counting bullet points those two look identical, and our older scorer treated them identically. It also treated a brand mentioned in the third sentence as rank 3, which isn't a rank at all, it's a position in a paragraph.
