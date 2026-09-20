# Needs and gaps checklist

Internal. Never sent to the client.

Client: ______________________  Date: ____________  Run by: ____________

Run this after the intake, with the screening audit open beside you. Budget
about ninety minutes. The output is a ranked list where every row carries the
thing that proves it.

**A row is not complete until it carries evidence: a URL, a query, a line in
the report, or a screenshot. "Assumed" is not a status.** Work that starts from
an assumption is where a report gets a fact wrong in front of a client.

## How to fill it in

| Column | Meaning |
|---|---|
| Status | Pass, Gap, Blocked, or Not applicable. Never blank |
| Evidence | Where you saw it. A URL, a query, a report field |
| Severity | 1 costs them money now. 2 costs them money this quarter. 3 is hygiene |
| Owner | Us, them, or a named third party |
| Effort | Hours, days, or weeks. Round up |

Rank the finished list by severity, then by effort ascending, so the first
three rows are the things that hurt most and move fastest. Those three rows
become the one-pager.

---

## G1. Can they be measured at all

Nothing downstream is trustworthy until this group passes.

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 1.1 | Brand name extracted from the homepage. Low confidence flag is false | | | 1 | | |
| 1.2 | Alias list from A2 covers the forms that appear in real answers | | | 1 | | |
| 1.3 | Category detected by the engines matches what they said in A4 | | | 2 | | |
| 1.4 | Enough distinct buyer questions from C1 to fill the plan's prompt allowance | | | 2 | | |
| 1.5 | Markets from B1 fit inside the plan's site and market allowance | | | 2 | | |
| 1.6 | Second domain, if any, does not outrank the main one | | | 3 | | |

If 1.1 fails, stop. A score written on an unextracted brand name is a false
zero and it will be wrong in front of the client.

---

## G2. What the measurement actually said

Transcribe, do not summarise. These rows are the raw material of the one-pager.

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 2.1 | Score recorded, with the date and the list of engines asked | | | 1 | | |
| 2.2 | Per engine state recorded: know, partial, missing, or unavailable | | | 1 | | |
| 2.3 | Unavailable rows kept separate from missing rows | | | 1 | | |
| 2.4 | Top three gaps captured with the exact question and the competitor named instead | | | 1 | | |
| 2.5 | Competitors named that the client did not list in D1 | | | 2 | | |
| 2.6 | Engines disagreed with each other. Which, on what | | | 2 | | |
| 2.7 | Sentiment of the mentions that did happen | | | 2 | | |

Row 2.3 is the one people collapse. "We could not reach the engine" and "the
engine answered and did not name you" are different facts and only one of them
is a finding.

---

## G3. The pages an engine reads to answer

The commonest cause of absence is that nothing exists to cite.

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 3.1 | A page that answers C3 directly, in the buyer's words | | | 1 | | |
| 3.2 | Comparison or alternatives page exists and names real competitors | | | 1 | | |
| 3.3 | Pricing is public, or the reason it is not is deliberate | | | 2 | | |
| 3.4 | FAQ covers the five questions from C1 | | | 2 | | |
| 3.5 | The about page says what the company is in one sentence, near the top | | | 2 | | |
| 3.6 | Organization and Product or Service schema present, valid, and honest | | | 2 | | |
| 3.7 | Something published in the last 90 days | | | 3 | | |
| 3.8 | Claims on the site are attributed and checkable | | | 2 | | |

Validate the schema rather than reading it. Invalid JSON-LD is dropped
silently, so a page can carry a perfect looking block that no engine ever sees.

---

## G4. Can an engine reach the pages

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 4.1 | robots.txt does not block the AI crawlers they care about | | | 1 | | |
| 4.2 | The pages that answer buyer questions render without JavaScript | | | 1 | | |
| 4.3 | sitemap.xml is current and lists those pages | | | 2 | | |
| 4.4 | No cookie wall or interstitial in front of the content | | | 2 | | |
| 4.5 | Pages return 200, no redirect chain, canonical is right | | | 3 | | |
| 4.6 | Site is reachable from the markets in B1 | | | 3 | | |

---

## G5. The places engines quote from

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 5.1 | Present on the review and directory sites that appeared in the audit snippets | | | 1 | | |
| 5.2 | Present where D3 said buyers compare them | | | 1 | | |
| 5.3 | Google Business Profile claimed and current, where location matters | | | 2 | | |
| 5.4 | Third party descriptions of them are accurate and current | | | 2 | | |
| 5.5 | Any page describing them that is wrong, and who owns it | | | 2 | | |

Read the snippets in the report before filling this group in. The sources an
engine quoted for a competitor are the shortlist of places the client is
missing from.

---

## G6. Commercial fit

Fill this in before quoting. It is the difference between a price and a guess.

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 6.1 | Prompts needed from section C against the plan's allowance | | | 1 | | |
| 6.2 | Markets and sites needed from section B against the allowance | | | 1 | | |
| 6.3 | Engines the client named against the engines the plan includes | | | 1 | | |
| 6.4 | Refresh expectation against the plan's cadence | | | 2 | | |
| 6.5 | Anything promised in the call that no plan delivers | | | 1 | | |

Row 6.5 is the row that saves a relationship. Write it down the day it is said,
not the month the client asks where it is.

---

## G7. Can the work actually land

| # | Check | Status | Evidence | Sev | Owner | Effort |
|---|---|---|---|---|---|---|
| 7.1 | A named person from F1 can publish a change this week | | | 1 | | |
| 7.2 | Analytics and Search Console access granted, or refused on purpose | | | 2 | | |
| 7.3 | The success sentence from G3 is written down in their words | | | 1 | | |
| 7.4 | Anything we cannot measure is written down and will be said out loud | | | 1 | | |
| 7.5 | Approval path from G1 recorded | | | 2 | | |

---

## The three that go in the one-pager

| Rank | Row | Why it is first | Effort |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## What we will not claim

List here everything that could not be measured or verified. Each line goes
into the limits paragraph of the one-pager, in plain words.

- 
- 
- 
