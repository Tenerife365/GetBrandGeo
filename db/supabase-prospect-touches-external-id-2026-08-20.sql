-- ============================================================================
-- supabase-prospect-touches-external-id-2026-08-20.sql
--
-- Adds the idempotency key the inbound reply poller needs
-- (docs/arch/reply-handling.md section 4.4).
--
-- WHY A SEPARATE FILE rather than editing the base migration: the same reason
-- db/supabase-prospect-touches-restrict-2026-08-15.sql exists. The base
-- migration uses CREATE TABLE IF NOT EXISTS, which does NOT alter a table that
-- already exists, so production needs its own ALTER. The base file was also
-- amended so a fresh apply on a clean database gets this right the first time.
--
-- WHY IT IS NULLABLE AND THE INDEX IS PARTIAL: every touch logged by a human
-- through prospects-admin.js has no external id and never will. A NOT NULL
-- column would break the manual path, and a plain unique index would collapse
-- every manual touch into a single allowed NULL on some engines. Partial on
-- `where external_id is not null` leaves all existing rows and every future
-- manual touch completely unaffected, while making a second insert of the same
-- Gmail message id impossible.
--
-- FORMAT of the value is '<source>:<id>', e.g. 'gmail:18f2c9ab0e1d4c7a'. The
-- prefix exists so a second source later (a LinkedIn export, an IMAP poller)
-- cannot collide with a Gmail message id that happens to look the same.
-- ============================================================================

alter table public.prospect_touches
  add column if not exists external_id text;

comment on column public.prospect_touches.external_id is
  'Provider id of the message this touch was auto-logged from, as <source>:<id> (e.g. gmail:18f2...). NULL for every touch logged by a human. Unique when present, so a poller re-run cannot duplicate a reply.';

create unique index if not exists prospect_touches_external_id_key
  on public.prospect_touches (external_id)
  where external_id is not null;
