# Acquisition funnel audit (C1)

Written 2026-07-31. Covers the path a stranger takes from the getbrandgeo.com
homepage to becoming a paying client: landing, audit run, results, and what they
can actually do next.

Every claim below carries either a `file:line` or a production query. Where I
could not determine something, it says so rather than guessing.

---

## 0. Method, and one thing I deliberately did not do

**I did not run a live audit.** The Instant Audit spends real LLM and SerpApi
credit (`prospect_audits.estimated_cost_eur` shows EUR 0.24 for the two most
recent public screening runs), and AUTONOMY §2 withholds spending money from the
loop. So the widget was never submitted.

That is a real limit on this audit and it is worth stating: I have not observed
the flow with my own eyes end to end. What I did instead:

- Read every file on the path, on `HEAD`.
- Compared the deployed `index.html` and `site.js` against the repo (md5 match
  on both, so the live site is exactly the code below).
- Confirmed the transport works without invoking it: CSP header, CORS preflight.
- Queried production for what the funnel has actually produced in 22 days.

The database is the load-bearing evidence here, not my reading. Where the two
disagree, the database wins.

---

## 1. The funnel as built

### Step 1: landing

`getbrandgeo.com` serves an audit widget in the hero: a domain field and a
button reading **"Check my visibility →"** (`brandgeo/web/index.html:2271`).
Live and byte-identical to the repo (`md5 6c88621e…` on both).

This is a good entry point. It asks for a domain, not an email, and it is the
first thing on the page. Nothing in this audit criticises step 1.

The homepage's other CTAs are `https://app.getbrandgeo.com/signup` (5 links) and
`#contact` (5 links). There is no third path.

### Step 2: the audit runs

`site.js:74` POSTs to `https://app.getbrandgeo.com/.netlify/functions/audit-domain`.
Public callers are forced to `screening` depth (`audit-domain.js:74`).

Transport verified without spending:

```
CSP connect-src on getbrandgeo.com  ->  includes https://app.getbrandgeo.com
OPTIONS audit-domain                ->  HTTP 204
Access-Control-Allow-Origin         ->  https://getbrandgeo.com
```

So the widget is wired correctly. Whatever is wrong here, it is not plumbing.

### Step 3: the result

On success `site.js:234` renders a score ring, the headline
"You're at N/100 AI Visibility", the domain, a one-line gap summary, and then an
email form whose button reads **"Email me the full breakdown →"**
(`site.js:261`).

The hero button steps down to "Check another →" (`site.js:233`).

### Step 4: the email gate

Submitting posts to `unlock-audit-report.js`, which:

1. marks `prospect_audits.unlocked = true` and stores the email (`:41-43`),
2. pushes the lead to HubSpot, best-effort (`:49`),
3. inserts a `prospect_leads` row (`:53`),
4. returns `{ ok: true, token }` (`:63`).

On success the widget replaces the entire result card with one line
(`site.js:297-299`):

> Check your inbox, the full AI Visibility report for **domain** is on its way.

### Step 5: there is no step 5

That message is the end of the visitor's session. No link, no button, no
redirect.

---

## 2. What production says

```sql
select count(*) audits, count(*) filter (where unlocked) unlocked,
       count(*) filter (where email is not null) with_email,
       count(distinct domain) domains
from prospect_audits;
```

| audits | reached ready | unlocked | email captured | distinct domains | spend |
|---|---|---|---|---|---|
| 58 | 58 | 56 | **1** | 38 | EUR 14.19 |

Split by origin, which is what makes it legible:

| created_via | depth | n | with email | first | last |
|---|---|---|---|---|---|
| internal | screening | 54 | 0 | 2026-07-16 | 2026-07-16 |
| public | screening | 2 (not unlocked) | 0 | 2026-07-26 | 2026-07-26 |
| public | screening | 1 (unlocked) | 1 | 2026-07-09 | 2026-07-09 |
| internal | full | 1 | 0 | 2026-07-09 | 2026-07-09 |

**Three members of the public have ever run an audit.** The other 55 are
BrandGEO's own prospecting runs. The last public audit was 2026-07-26, five days
before this was written.

And the single lead:

```sql
select domain, hubspot_synced, hubspot_contact_id is not null from prospect_leads;
-- getbrandgeo.com | false | false
```

The only lead this funnel has ever produced is **BrandGEO auditing its own
domain**, and even that never reached HubSpot.

**Net: zero real leads in 22 days.**

---

## 3. Findings

### F1. CRITICAL. The product tells every converting visitor to check an inbox, and no email is ever sent.

`unlock-audit-report.js` contains no mail call of any kind. This is not an
inference from one grep. The codebase has exactly five files that touch a
mailer:

```
assistant-lead.js  resend-invite.js  support-request.js  _auth.js  _email.js
```

and exactly eight that touch a prospect audit or lead:

```
audit-domain.js  get-audit-report.js  run-full-audit-background.js
unlock-audit-report.js  _analysis.js  _hubspot.js  _prospect_engines.js
_prospect_guard.js
```

**The two sets are disjoint.** No code path that handles an audit ever sends an
email.

Meanwhile `site.js:298`, live right now, promises delivery. A visitor gives a
real email address at the single highest-intent moment in the funnel, is told
the report is on its way, and nothing arrives. Ever.

This is worse than a missing feature. It is a broken promise on a product whose
entire pitch is trustworthy measurement.

### F2. CRITICAL. The full report is built, deployed, working, and unreachable.

The report page exists at `/audit/:token` (`App.tsx:106`, `AuditReport.tsx`).
`get-audit-report.js` returns the complete payload once `unlocked = true`:
dimensions, per-engine states, top gaps, every per-prompt result.

At the moment the visitor submits their email, the audit **is** unlocked. The
report **is** ready. The URL **would** work.

They are never given the URL. No email carries it (F1) and the widget does not
link to it. The most persuasive asset the company owns for that prospect is
finished, correct, and sitting behind a token nobody hands over.

This is the fourth instance of this project's signature failure, and the most
expensive: work that exists and never reaches where it is needed.

### F3. HIGH. The funnel is inverted. Failing converts better than succeeding.

`redirectToSignup()` is defined at `site.js:95` and called in exactly one place:
`site.js:387`, inside the **error** handler.

```js
// The audit endpoint errored, timed out, or answered in a shape this
// widget does not recognise. Fall back to the pre-existing flow rather
// than leaving the visitor stuck on a dead button.
setAuditStatus('Taking you to the full audit…');
setTimeout(function() { redirectToSignup(val); }, 600);
```

So a visitor whose audit **fails** is carried to
`app.getbrandgeo.com/signup?domain=…`, prefilled, in one hop.

A visitor whose audit **succeeds** gets an email form and a dead end.

The better the product performs, the less the visitor is invited to do. The
failure path is the only one in the whole widget that reaches signup, and it was
written deliberately and reasoned about in a comment. Nobody chose this
inversion; it is what is left when the success path was never finished.

### F4. HIGH. Unlocking destroys the thing the visitor was looking at.

`site.js:297` overwrites `auditResult.innerHTML` wholesale. The score ring, the
headline, the category line and the gap summary are all replaced by a single
sentence.

The visitor pays with their email address and their screen gets emptier. Whatever
momentum the score created is deleted at the exact moment it should be spent.

### F5. MEDIUM. The terminal CTA on the full report points back at marketing, not at signup.

`AuditReport.tsx:302-307` is the only outbound CTA on the full report:

```jsx
<a href="https://getbrandgeo.com/#pricing">See BrandGEO plans</a>
```

For a reader who has just seen their gaps, that is a cross-domain hop to an
anchor on a marketing page, where they must then find and click the signup link
that the audit could have handed them directly, with `?domain=` prefilled, the
way the error path already does.

### F6. MEDIUM. HubSpot has never received a lead.

The one `prospect_leads` row has `hubspot_synced = false` and no contact id.
`_hubspot.js` is documented to degrade gracefully when `HUBSPOT_API_KEY` is
unset, so this is either an unset key or a failed push, and the row records no
error either way.

I cannot distinguish the two from here: reading the env var is withheld
(AUTONOMY §2). Whoever checks should also note that a silent `false` with no
error text is itself the defect, since it is indistinguishable from success at a
glance. Same shape as the `job_runs.ok` finding already on the roadmap.

### F7. LOW, but it is a standing rule. Em dash in live customer-facing copy.

`site.js:298` renders `&mdash;` in the audit success message. The no em dash
rule applies to all BrandGEO output, and this is the most-read sentence in the
funnel after the score itself.

### F8. Correction to the premise of this item.

The roadmap records Constantin's finding as "at the results step the only call to
action is Book a call."

**The string "Book a call" does not exist anywhere in this repository.** Checked
across `brandgeo/web/*.html` and all of `brandgeo-dashboard/src/`. The results
step's CTA is an email form, and the full report's CTA is "See BrandGEO plans".

**His conclusion was right and his label was wrong.** There is indeed no way to
accept and proceed. The audit above substantiates that more strongly than the
original observation did: it is not that the wrong CTA is offered, it is that the
success path offers no forward step at all while the failure path offers the
right one.

Recorded because inheriting a wrong detail into three downstream items is how the
2026-07-29 cycle was wasted.

---

## 4. What to fix, cheapest first

1. **Hand over the report URL.** After a successful unlock, send the visitor to
   `https://app.getbrandgeo.com/audit/<token>` or reveal the full report inline.
   The token is already in the unlock response (`unlock-audit-report.js:63`) and
   the page already works. This is close to a one-line change and it closes F2
   and F4 together. Do this before anything else on this list.
2. **Fix the promise or keep it.** Either send the email (real work: `_email.js`
   exists, a template does not) or change the copy so it stops promising one.
   Shipping step 1 makes the honest interim copy easy, because the report is
   then on screen and the email becomes a nice-to-have rather than the only
   delivery mechanism.
3. **Give the success path what the failure path already has:** signup with
   `?domain=` prefilled, as an explicit forward step. That is C2, and this audit
   is its evidence.
4. **Point the report's terminal CTA at signup**, not at a marketing anchor (F5).
5. **Diagnose HubSpot** (F6), and make a failed push record why.
6. **Remove the em dash** (F7).

Note what is NOT on this list: acquiring traffic. Three public audits in 22 days
is a small number and it is tempting to call this a marketing problem. It may
also be one. But sending more people into a funnel whose success path dead-ends
and whose promised email never arrives would waste that traffic, and the fixes
above are cheap enough to do first.

---

## 5. Check commands

```bash
# F1: OPEN BY DECISION 2026-07-31. See the note below before running this.
cd brandgeo-dashboard/netlify/functions && \
  grep -lq "_email\|resend\|sendgrid" unlock-audit-report.js && echo FIXED || echo "F1 OPEN"

# F2/F4: the unlock handler hands over the report
grep -q "app.getbrandgeo.com/audit/" brandgeo/web/site.js && echo FIXED || echo "F2 OPEN"

# F7: no em dash in site.js copy
grep -q "&mdash;" brandgeo/web/site.js && echo "F7 OPEN" || echo FIXED

# F3/F5 and roadmap C2: the success path carries the visitor forward
bash scripts/check-funnel-accept-path.sh

# Roadmap C3: payment is unreachable until the contract is accepted
bash scripts/check-contract-gate.sh
```

**F1 is OPEN BY DECISION as of 2026-07-31.** Constantin ruled that on-screen
delivery is the sprint's answer and the audit email is not being built yet. That
check will therefore print `F1 OPEN` and is expected to, which is why it is
labelled rather than left to read as an outstanding failure.

The reason this is a decision and not a deferral: the promise that made F1
critical is gone. `ceb3596` replaced "check your inbox" with a link to the report
and the button label with "Show me the full breakdown", so nothing in the funnel
claims an email any more. The remaining gap is a missing convenience, not a
broken promise, and it was ranked below the two dead ends fixed in this pass.

Re-open it as a build the moment any copy anywhere promises delivery again. The
two strings to watch are named in `site.js` beside `AUDIT_REPORT_URL`.

**F6 is closed differently from how the audit framed it.** The audit could not
distinguish an unset key from a failed push. It was the first: `HUBSPOT_API_KEY`
is not set on the dashboard site (confirmed 2026-07-31). Setting it is
Constantin's to do and is not code. What was fixed here is the half the audit
called "itself the defect": a failed push now records its reason on the
`prospect_leads` row (`hubspot_error`, migration in `db/`), so a silent `false`
is no longer indistinguishable from success.

Production counters, to re-measure rather than re-assume:

```sql
select created_via, count(*), count(*) filter (where unlocked) unlocked,
       count(*) filter (where email is not null) with_email
from prospect_audits group by created_via;

select domain, hubspot_synced from prospect_leads order by created_at desc;
```
