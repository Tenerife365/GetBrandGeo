# Channel attribution: capture utm_source through to a paying customer

**Why this exists.** On 2026-08-02 LinkedIn was bringing roughly the same traffic
as Google. There is currently no way to tell which of them produces a customer,
and a four-week test across eight platforms starts 2026-08-03. Without this, the
31 August read gives visit counts and nothing else.

**What is already true, so nobody rebuilds it:**
- Plausible reads UTM parameters natively under Sources. Visit-level attribution
  needs no code at all. It works today.
- Every outbound link in the LinkedIn series and the campaign package is tagged.
  236 links, verified 2026-08-02.
- `prospect_leads` already has a `source` column, but it is hardcoded to
  `'instant_audit'` at `unlock-audit-report.js:65`. It records the mechanism, not
  the channel. Do not overload it; add new columns.

**What is missing.** The moment a visitor gives an email is the earliest point
they are identifiable. If the channel is not written on that row, it is gone.
Plausible knows a LinkedIn visitor arrived; it cannot know they later paid.

---

## The change, three parts

### 1. Database

New columns on `prospect_leads`, all nullable so old rows stay valid:

```sql
ALTER TABLE prospect_leads ADD COLUMN IF NOT EXISTS utm_source   TEXT;
ALTER TABLE prospect_leads ADD COLUMN IF NOT EXISTS utm_medium   TEXT;
ALTER TABLE prospect_leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE prospect_leads ADD COLUMN IF NOT EXISTS landing_referrer TEXT;
CREATE INDEX IF NOT EXISTS idx_prospect_leads_utm_source ON prospect_leads(utm_source);
```

`landing_referrer` is the fallback. Instagram and TikTok in-app browsers strip or
rewrite UTMs often enough that a referrer is worth keeping beside them, and it
costs one column.

Follow the existing pattern in `db/`: one migration file, safe to re-run, and it
becomes a record of a migration already applied.

### 2. Marketing site, `brandgeo/web/site.js`

On page load, read `utm_source`, `utm_medium`, `utm_campaign` from
`location.search` and persist to `sessionStorage`. **Persist, do not read at
submit time**, because the visitor may navigate from `bg-028.html` to the
homepage before running the audit, and the UTM is lost on the first hop.

Write once and do not overwrite on later pages in the same session, so the entry
channel wins rather than the last page viewed.

Then include them in the `unlock-audit-report` POST body, which today sends
`{ token, email, honeypot }`.

Cap each value at 100 characters and strip anything outside
`[A-Za-z0-9_-]` before sending. These land in a database from a URL a stranger
controls.

### 3. Function, `brandgeo-dashboard/netlify/functions/unlock-audit-report.js`

Accept the three fields, apply the same validation server-side (never trust the
client's sanitising), and add them to the existing insert at line 63. Leave
`source: 'instant_audit'` exactly as it is.

Missing fields must be `null`, never `'unknown'` or `'direct'`. A null means
nobody told us; a string means we measured something. Do not blur them.

---

## Deploy sequencing, and it matters

Three systems, two pipelines, and the order is not free:

1. **Migration first.** Additive and nullable, so it is safe while nothing writes
   to the new columns.
2. **Function second** (Netlify, `brandgeo-dashboard/`). It must tolerate a body
   with none of the new fields, because the old `site.js` is still live at this
   point and will not send them.
3. **`site.js` last** (cPanel, via the GitHub webhook). Only now does data start
   flowing.

Reversing 2 and 3 means the browser sends fields nothing reads, which is harmless
but proves nothing. Reversing 1 and 2 means an insert against a column that does
not exist, which fails the whole lead capture and loses the email.

**Netlify budget:** roughly two builds a day platform-wide. This needs one. The
cPanel and Supabase steps are free.

---

## The scoreboard

`docs/growth/SPRINT-100-SCOREBOARD.md` tracks emails sent, DMs, audit runs, free
signups, new paying and MRR daily, with **no channel column**. Add one,
`channel / utm_source`, before the mirror goes live on 2026-08-03. Filling it
faithfully for 30 days without that column still leaves the question unanswered.

Until part 3 ships, the paying column is filled by hand from Stripe and the link
back to a platform is inference, not record.

---

## What this still will not tell you

**Instagram feed, Reels, TikTok and Threads carry no link in their captions.**
Their only path is the bio link, which means one tagged URL per platform for the
whole four weeks. You will get platform-level attribution and nothing finer. No
per-post read on those four, by construction.

**Announcement posts and founder reposts carry no site link either**, so their
traffic arrives under `utm_medium=article`. LinkedIn as a platform stays
readable; the founder repost as an asset does not.
