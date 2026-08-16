-- ============================================================================
-- supabase-prospect-touches-restrict-2026-08-15.sql
-- Amends db/supabase-prospect-channels-migration.sql. bg-verify S3
-- (docs/qa/prospect-channels-review-2026-08-15.md): the original migration
-- created prospect_touches.prospect_id as
--   references prospects(id) on delete cascade
-- which is the wrong default for this table. prospects holds commercial
-- judgement and is disposable (a row can be deleted for being a bad fit, a
-- duplicate domain, or a list cleanup); prospect_touches holds what was
-- actually said to a named human, a record that may need to be produced
-- later and cannot be reconstructed. Coupling the lifetime of the evidence
-- to the lifetime of the opinion means a routine prospect cleanup would
-- silently erase the audit trail with no warning, no archive, no count
-- returned.
--
-- RULING (Constantin, via bg-verify's flagged decision, acted on 2026-08-15):
-- restrict, not cascade. A prospect referenced by any touch can no longer be
-- deleted until its touches are dealt with first -- this is the intended
-- behaviour going forward, not a bug to work around later. If a GDPR erasure
-- need arises, that should be a deliberate, logged action (delete the
-- touches first, or a dedicated erasure procedure), not a side effect of an
-- ordinary prospect delete.
--
-- REACHABILITY AT THE TIME OF THIS CHANGE: confirmed by bg-verify via grep,
-- there is no delete affordance on prospects anywhere in
-- brandgeo-dashboard/src or brandgeo-dashboard/netlify/functions.
-- prospects-admin.js exposes only list/update/touch. The cascade (now
-- restrict) FK was reachable only by direct SQL or the Supabase dashboard,
-- both Constantin by hand, so this change carries no application-code risk.
--
-- Safe to re-run: the DO block only acts if the live constraint still says
-- CASCADE, so a second run against an already-restricted table is a no-op.
-- ============================================================================

do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'prospect_touches_prospect_id_fkey'
      and confdeltype = 'c'  -- 'c' = cascade; only act if still on the old behaviour
  ) then
    alter table public.prospect_touches
      drop constraint prospect_touches_prospect_id_fkey;

    alter table public.prospect_touches
      add constraint prospect_touches_prospect_id_fkey
      foreign key (prospect_id) references public.prospects(id)
      on delete restrict;
  end if;
end $$;

-- ============================================================================
-- VERIFICATION (run after applying):
--   select conname, pg_get_constraintdef(oid) as def
--   from pg_constraint
--   where conrelid = 'public.prospect_touches'::regclass and contype = 'f';
--   -- Expect: prospect_touches_prospect_id_fkey ...
--   -- FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE RESTRICT
-- ============================================================================
