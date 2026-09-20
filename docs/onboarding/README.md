# Client onboarding pack

A reusable pack for taking on a GEO client, from the first call to a findings
one-pager that is ready to send. Written 2026-09-20.

Three files do the work:

| File | Who reads it | When |
|---|---|---|
| `01-intake-questionnaire.md` | The client, with you | The kickoff call, or sent ahead of it |
| `02-needs-and-gaps-checklist.md` | You only. Never sent | After intake, alongside the screening audit |
| `03-findings-one-pager.md` | The client | Within three working days of the call |

`04-findings-one-pager-example.md` is a filled illustration of the template.
Its numbers are invented. It exists to show the tone and it is never sent to
anybody.

---

## The sequence

| Day | What happens | Output |
|---|---|---|
| 0, before the call | Run a screening audit on their domain. Fill section 0 of the intake yourself | A score, a category, the first competitor named |
| 0, the call | Work through the intake. Sections A, C and D are the ones worth the hour | A completed intake |
| 1 | Run the gaps checklist against the audit and their site | A ranked list with evidence on every row |
| 2 | Write the one-pager from the template | A draft |
| 2 | Show the draft to the client owner and get a yes | Approval |
| 3 | Send | A dated record of what was sent |

Nothing goes to a client before the person who owns the relationship has read
it and said yes. That rule covers the one-pager, the proposal and any email
that carries a number.

---

## Four rules the pack is built on

**1. Never ask a client something you can measure.** Section 0 of the intake
is filled in before the call from a screening audit. An hour of a client's
attention is worth more than a form.

**2. The number shown is their real measured result, or no number is shown.**
No sample score, no illustrative report, no "companies like yours usually".
If the audit fails or comes back low confidence, say so and re-run. A low
confidence row means the brand name could not be extracted and the score may
be a false zero.

**3. State the instrument with the number, every time.** The date, the engines
asked, and how many questions. A measurement without its window and its
instrument is a claim.

**4. "Could not reach the engine" is not "the engine did not name you".** The
product keeps those two apart in code and the one-pager keeps them apart in
words. Collapsing them turns an outage into a finding.

---

## House style for anything a client reads

- No em dashes and no en dashes. Use a comma, a colon or a full stop.
- Banned words: delve, leverage, seamless, robust, unlock, elevate, game
  changing, cutting edge, revolutionise, fast paced, in today's, supercharge,
  effortlessly, the future of.
- Every factual claim traces to something you can show: a URL, a query, a
  screenshot, a line in the report.
- Lead with the finding. The method goes underneath it.

Check before sending:

```
rg -n "[\u2014\u2013]" <the file you are about to send>
rg -ni "delve|leverag|seamless|robust|unlock|elevate|game.chang|cutting.edge|revolutioni|fast-paced|in today.s|supercharge|effortlessly|the future of" <the file you are about to send>
```

Both should return nothing. Run them against the filled document, not against
this pack: the list above is itself a list of the words, so it matches itself.
Use `rg`, not `grep`. The Git Bash `grep` on the work machine is not in a UTF-8
locale and its dash check either errors out or returns false positives on box
drawing characters, which reads exactly like a clean pass.

---

## A note on this repository

This repository is public. The pack holds templates only. A filled intake, a
completed checklist and a sent one-pager all name a real company and often a
real person, so they belong in the client folder, not here.
