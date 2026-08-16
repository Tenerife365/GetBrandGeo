---
id: 019
from: bg-orchestrator
to: bg-backend
status: READY
created: 2026-08-16
scope_write: brandgeo-dashboard/netlify/functions/resolve-contact-routes.js, brandgeo-dashboard/netlify/functions/_contact_routes.js, brandgeo-dashboard/tests/contact_routes.test.js, db/supabase-prospect-contact-candidates-2026-08-16.sql
scope_read: brandgeo-dashboard/netlify/functions/prospects-admin.js, brandgeo-dashboard/netlify/functions/_auth.js, docs/growth/outbound/founder-batch-01-2026-08-15.md, docs/growth/outbound/fire-pack-2026-08-16.md, docs/growth/outbound/channel-map-2026-08-15.md, db/supabase-prospect-channels-migration.sql
model: opus
---

## Decision

Build the contact route resolver, not the email sender. Constantin chose resolver
first on 2026-08-16 after a query proved **all 43 `stage='new'` prospects have
zero contact routes**: 0 email, 0 LinkedIn URL, 0 X URL, while 43 of 43 already
carry an `audit_token` and 40 of 43 carry named competitors. The evidence half is
paid for; only the address is missing. A sender built first would have nobody to
send to.

## Context that is load bearing

**Contact research is currently a manual hour per prospect.** The nine prospects
contacted on 2026-08-16 were the only rows in the table with any route, and that
research consumed most of a session. This function is what turns that into a
review pass.

**The provenance rule is non negotiable and is the reason this is worth
building.** `founder-batch-01-2026-08-15.md` section A holds the standard: no
address was inferred from a pattern, none came from a lead database, and every
one carries the URL where the literal string was seen. Reproduce that exactly. A
resolver that guesses `firstname@domain` is worse than no resolver, because it
launders a guess into a database column that later reads as fact.

**Verification stays human, and today proved why.** Three X accounts in the last
batch looked right and were impostors (`x.com/intellibill` is a Florida medical
biller, `x.com/vibefam` is a 2017 account called Vibe Clan,
`x.com/Harry_Sabharwal` is a Dublin consultant). Separately, a confident "this
LinkedIn is the wrong John Powell" finding was itself later overturned. Machines
can find candidate URLs. Deciding a URL belongs to a named person is a judgment
call and must not be automated.

## Do

1. **New migration `db/supabase-prospect-contact-candidates-2026-08-16.sql`.**
   Create `public.prospect_contact_candidates`: `id bigserial pk`,
   `prospect_id bigint not null references public.prospects(id) on delete
   restrict`, `kind text not null check (kind in ('email','linkedin','x'))`,
   `value text not null`, `source_url text not null`, `email_kind text check
   (email_kind in ('individual','role') or email_kind is null)`,
   `confidence text not null check (confidence in ('high','medium','low'))`,
   `promoted boolean not null default false`, `created_at timestamptz not null
   default now()`. Unique on `(prospect_id, kind, value)`.
   RLS enabled with exactly four admin only policies calling `public.is_admin()`,
   copied verbatim from the `prospect_touches` pattern in
   `db/supabase-prospect-channels-migration.sql`. `ON DELETE RESTRICT`, not
   CASCADE, for the same reason S3 changed it on `prospect_touches`.
2. **New `_contact_routes.js`** holding all pure logic, exported and testable
   with no network and no Supabase client. At minimum: `candidatePaths(domain)`,
   `extractEmails(html, sourceUrl)`, `extractProfileUrls(html, sourceUrl)`,
   `classifyEmailKind(localPart)`, `scoreConfidence(candidate)`,
   `isExcluded(value)`.
3. **`candidatePaths()` returns, in this order:** `/`, `/contact`, `/contact-us`,
   `/about`, `/about-us`, `/privacy`, `/privacy-policy`, `/privacy-statement`,
   `/terms`, `/help/contact`, `/help`. Fetch with a real browser User-Agent,
   follow redirects, hard cap 10 pages and 8 seconds per prospect, treat any non
   200 as a miss and continue rather than throwing.
4. **`extractEmails()`** must find both `mailto:` hrefs and bare addresses in
   text, and must also handle the **split string obfuscation** pattern found on
   `smilenotes.co.uk/privacy`, where the address is assembled in page script from
   published literals (`var em1 = "privacy"`, `var em2 = "@"`, `var em3 =
   "smilenotes.co.uk"`). Reassembling their own published literals is reading
   what they published; it is not guessing.
5. **`classifyEmailKind()`** returns `role` for local parts in
   `info, contact, hello, support, help, sales, admin, care, team, enquiries,
   inquiries, privacy, legal, gdpr, dpo, billing, accounts, press, marketing,
   careers, jobs, noreply, no-reply`, otherwise `individual`. Never infer a
   person's name from the local part.
6. **`isExcluded()`** must reject, and the test must prove each: any address whose
   domain is a known ESP or analytics vendor, `noreply`/`no-reply` local parts,
   image and asset filenames that regex as addresses, and the literal
   `zajifewluapda@gmail.com`, which sits in the raw HTML of `glood.ai/contact` as
   a form artifact or spam trap and must never be mailed.
7. **`scoreConfidence()`**: `high` when the value appears on two or more distinct
   source URLs on the company's own domain, `medium` when it appears once on
   their own domain, `low` when it came from anywhere else. Confidence describes
   how well sourced the string is. It never describes whether a profile belongs
   to a person.
8. **New `resolve-contact-routes.js`**, `POST`, behind
   `requireAuth({ adminOnly: true })`, same gate and envelope precedent as
   `prospects-admin.js`. Accepts `{prospect_ids: number[]}` capped at 10 per call,
   or `{prospect_id: number}`. Returns `{results: [{prospect_id, candidates:
   Candidate[], pages_fetched, errors: string[]}]}`.
9. **The function writes ONLY to `prospect_contact_candidates`.** It must never
   write `prospects.contact_email`, `contact_email_source`, `contact_email_kind`,
   `linkedin_url`, `x_url`, `x_verified` or `linkedin_verified`. Promotion from
   candidate to prospect column is a separate, human confirmed action and is out
   of scope for this packet.
10. **`tests/contact_routes.test.js`**, pure, no network, following the existing
    style of `tests/prospects_admin_whitelist.test.js`. Use fixture HTML captured
    from the real pages named above. Must assert every exclusion in item 6, both
    extraction modes in item 4, every classification bucket in item 5, and the
    full confidence ladder in item 7.

## Do not

- Do not query Hunter, Apollo, RocketReach, Clearbit, Snov, or any lead database.
  Excluded by standing instruction, and none of their results were used in the
  batch this replaces.
- Do not generate an address from a pattern. No `firstname@`, no `f.last@`, no
  permutation and no MX probing to test a guess. If the company does not publish
  it, the correct output is no candidate.
- Do not set `x_verified` or `linkedin_verified` to true anywhere, ever.
- Do not write to `prospects`, `prospect_touches`, or any file outside
  `scope_write`.
- Do not send anything, submit any form, or open any contact form.
- Do not run `git add`, `commit` or `push`. Hand Constantin the exact command.
- Do not use an em dash or an en dash in any file you touch.

## Acceptance criteria

- [ ] Migration applies clean to production and is verified by query afterwards,
      not assumed from the file: table exists with all columns and both CHECK
      constraints, RLS enabled, exactly four policies, every one calling
      `is_admin()`, FK reads `ON DELETE RESTRICT` via `pg_get_constraintdef`.
- [ ] `prospects` row count is 71 before and after, and `prospect_touches` is 9
      before and after. This packet changes no existing row.
- [ ] An unauthenticated `POST` to `/.netlify/functions/resolve-contact-routes`
      returns 401. A viewer token returns 403. Both checked live, not from source.
- [ ] Run against the 9 already contacted prospects as a control. The resolver
      must independently rediscover `nithy@pagelightprime.com`,
      `sales@pureclarity.com`, `care@easydvm.com`, `support@lawcus.com`,
      `contact@vibefam.com` and `privacy@smilenotes.co.uk` **with the same source
      URLs recorded by hand** in `founder-batch-01-2026-08-15.md` section B. Any
      mismatch is a resolver defect, not a documentation defect.
- [ ] `zajifewluapda@gmail.com` is not returned for Glood.AI.
- [ ] Run against all 43 `stage='new'` prospects. Report how many gained at least
      one candidate of each kind. State the number plainly, including if it is
      low. A resolver that finds routes for 12 of 43 is a useful result and must
      not be dressed up as more.
- [ ] All tests pass, count stated, and `node tests/contact_routes.test.js` exits 0.
- [ ] Zero em dashes and zero en dashes, verified by ripgrep against the files on
      disk after writing, not by eye.

## Open questions for Constantin

None blocking. One decision is deferred to the sender packet, not this one:
today's five emails went from `constantin@getbrandgeo.com` per his 2026-08-14
ruling, and that identity is part of why the message lands, since the sender
built the tool being described. `trybrandgeo.com` is now fully stood up as a
dedicated cold sending domain (Google Workspace MX, SPF, Google DKIM published,
DMARC `rua` on its own domain so reports actually arrive). Moving volume there
protects the primary domain but weakens the "I built this" signal. That trade is
his to make when the sender is built, and it does not affect this packet.
