-- Turn the never-query list from a standing instruction into a database guarantee.
--
-- WHY THIS EXISTS
-- `resolve-contact-routes.js` line 28 states the resolver never queries a lead
-- database: Hunter, Apollo, RocketReach, Clearbit and Snov are excluded by
-- standing instruction. That was a convention held in prose, and on
-- 2026-08-17 it was broken. Candidate id 10 (prospect 24, RunSensible) carries
-- source_url https://rocketreach.co/sahar-asadi-email_106199103 and stages a
-- named individual's personal LinkedIn profile. The resolver cannot emit that
-- URL, so the row was written from outside the resolver. Twelve minutes later
-- touch id 18 sent a real connection request to that named person on the back
-- of it. Review: docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md
-- finding F13.
--
-- The whole provenance design rests on one promise: a value in this table was
-- seen by us at the URL recorded beside it. A broker URL breaks that promise
-- while looking exactly like a kept one, which is why prose was not enough.
--
-- WHY `NOT VALID`, AND WHY THAT IS THE POINT
-- NOT VALID skips the one-time scan of existing rows, so candidate 10 SURVIVES
-- as the audit record of what happened. Deleting it would destroy the only
-- evidence of the incident. But NOT VALID still enforces on every INSERT and
-- every UPDATE, and `promote` updates the candidate row to set promoted = true.
-- So the database will now REFUSE to promote candidate 10. The row stays
-- readable as history and is permanently unpromotable, which is a stricter and
-- more honest outcome than deleting it.
--
-- Verified read-only against production before writing this file: of the 10
-- rows in the table, exactly 9 satisfy the predicate and only id 10 fails.
--
-- SCOPE NOTE, do not widen this by mistake
-- logo.clearbit.com is used legitimately elsewhere in this product, in
-- src/components/BrandLogo.tsx and netlify/functions/social-image.js, to fetch
-- a brand logo. That is a different use and is not affected: this constraint
-- applies only to prospect_contact_candidates.source_url, which is a contact
-- provenance URL and is never a logo. Do not turn this list into a global
-- outbound host block.
--
-- Idempotent. Safe to re-run.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'prospect_contact_candidates_source_not_lead_db'
      and conrelid = 'public.prospect_contact_candidates'::regclass
  ) then
    alter table public.prospect_contact_candidates
      add constraint prospect_contact_candidates_source_not_lead_db
      check (
        -- The host must actually parse out of an absolute URL. A source_url
        -- that is not a real absolute URL cannot prove provenance either, so
        -- refusing it is correct rather than incidental.
        substring(lower(source_url) from '^[a-z][a-z0-9+.-]*://(?:[^@/?#]*@)?([^/?#:]+)') is not null
        -- And that host must not be a contact-data broker, or a subdomain of
        -- one. Anchored on a host boundary so "notrocketreach.co" is not
        -- matched by accident and "www.rocketreach.co" is.
        and substring(lower(source_url) from '^[a-z][a-z0-9+.-]*://(?:[^@/?#]*@)?([^/?#:]+)')
            !~ '(^|\.)(rocketreach\.co|hunter\.io|apollo\.io|clearbit\.com|snov\.io)$'
      )
      not valid;
  end if;
end
$$;

comment on constraint prospect_contact_candidates_source_not_lead_db
  on public.prospect_contact_candidates is
  'Never-query list, enforced. A contact route may not cite a lead database as its provenance. NOT VALID by design so the 2026-08-17 RocketReach row (id 10) survives as the audit record while being permanently unpromotable. See F13 in docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md';
