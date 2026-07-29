-- ============================================================================
-- supabase-tickets-migration.sql
-- A real ticketing system, replacing the fire-and-forget support email.
--
-- STATUS: NOT YET APPLIED. Run this by hand in the Supabase SQL Editor for
-- project duiyifepitvugyulobqm (Dashboard -> SQL Editor -> New query -> paste
-- -> Run). Safe to re-run: every CREATE is IF NOT EXISTS, every policy is
-- dropped before it is created, and the constraint additions are guarded.
--
-- WHY THIS EXISTS
--   support-request.js received a message from a signed-in dashboard user and
--   emailed it to support@getbrandgeo.com through Resend. It stored nothing.
--   No record, no status, no assignee, no history, no way to tell an answered
--   request from a dropped one, and no way to hand one agent's work to another.
--   The mailbox was the database, which meant there was no database.
--
--   Email is kept as a NOTIFICATION on top of this table. The row is the
--   record. support-request.js inserts first and mails second, so a Resend
--   outage costs a notification and never a customer request.
--
-- WHY ONE TABLE FOR TWO SOURCES
--   The owner's requirement is a single queue holding customer requests AND
--   BrandGEO's own pending work, so that triage happens in one place and an
--   internal follow-up raised off a customer ticket sits next to it rather
--   than in someone's head. `source` distinguishes them and `client_id`
--   carries the tenancy:
--     source = 'customer'  ->  client_id IS NOT NULL   (a tenant raised it)
--     source = 'internal'  ->  client_id IS NULL       (BrandGEO raised it)
--   That pairing is enforced by tickets_source_tenancy_check below, and it is
--   load-bearing for security, not just for tidiness. Every SELECT policy for
--   a customer is written as `client_id = get_my_client_id()`, and an internal
--   ticket has a NULL client_id, so NULL = <int> evaluates to NULL, which is
--   not true, so internal tickets can never match a viewer's policy. Without
--   the constraint, one internal ticket accidentally saved with a client_id
--   would become visible to that client.
--
-- DEPENDS ON public.is_admin() and public.get_my_client_id()
-- (supabase-multitenant-migration.sql). Both are already live.
--
-- RLS IS THE SECURITY BOUNDARY, NOT THE UI
--   The customer path reads and writes these tables directly over PostgREST
--   with the anon key and a user JWT, which is the established pattern in this
--   codebase for tenant-owned data (see supabase-prompts-own-client-writes-
--   migration.sql). That means these policies are the ONLY thing standing
--   between one tenant and another, and between a customer and the agents'
--   private notes. They are not defence in depth here. They are the defence.
--
--   The full matrix these policies produce is written out in the verification
--   block at the end of this file.
--
-- THREE DELIBERATE ASYMMETRIES, EACH ONE A DECISION
--
--   1. A customer has NO UPDATE POLICY ON tickets AT ALL.
--      The requirement is that a customer may not change status, priority or
--      assignee. Postgres RLS gates rows, not columns, so a policy that let a
--      customer update its own ticket could not stop it from setting
--      status = 'resolved' or assignee = <some admin>. Column privileges could
--      express it, but then the rule would live in two places (a GRANT and a
--      policy) and only one of them is visible in pg_policies. So a customer
--      updates nothing. It creates a ticket and it adds comments. Reopening a
--      resolved ticket is a comment, and an agent moves the status.
--
--   2. A customer's INSERT is pinned to a safe row shape.
--      status = 'open', priority = 'normal', assignee IS NULL,
--      resolved_at IS NULL, source = 'customer', created_by = auth.uid(),
--      client_id = get_my_client_id(). Without the status and priority pins,
--      "cannot change priority" would be trivially defeated by creating every
--      ticket at 'urgent'. Consequence, stated plainly: a customer cannot
--      declare urgency in a structured field. It goes in the body, and an
--      agent sets the real priority. If self-reported urgency is wanted later,
--      add a separate `reported_urgency` column so it stays advisory and can
--      never be confused with the triage priority that drives the queue.
--
--   3. ticket_comments.is_internal = true is invisible to a customer, by the
--      SELECT policy, not by a WHERE clause in the frontend. These are the
--      agent-to-agent notes. A SELECT policy that returned them to a viewer
--      would leak internal notes to the customer they are about, which is the
--      single worst outcome this table can produce, so the policy is written
--      to be readable at a glance and is asserted in the verification block.
--
-- NEITHER TABLE HAS A DELETE POLICY, for anyone, deliberately.
--   A support history that can be edited away is not a support history. Same
--   reasoning as the promotions table, which deactivates and never deletes.
--   tickets-admin.js exposes no delete action to match. The service key
--   (Netlify functions) still bypasses RLS if a row genuinely has to go.
--
-- WHAT THIS MIGRATION CANNOT BREAK
--   Nothing reads these tables today. Applying it adds two tables and cannot
--   change any existing behaviour, any customer's bill, or any collection run.
--   The only code that touches it ships alongside: support-request.js (insert)
--   and tickets-admin.js (admin triage).
--
-- ROLLBACK
--   DROP TABLE IF EXISTS public.ticket_comments;
--   DROP TABLE IF EXISTS public.tickets;
--   DROP FUNCTION IF EXISTS public.ticket_client_id(bigint);
--   DROP FUNCTION IF EXISTS public.tickets_set_updated_at();
--   Destructive: it discards every ticket. Only correct immediately after
--   applying, before any real ticket is filed.
-- ============================================================================


-- ── 1. tickets ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tickets (
  id          bigserial PRIMARY KEY,
  -- NULL means an internal BrandGEO ticket. See the tenancy constraint below.
  client_id   integer REFERENCES public.clients(id),
  -- ON DELETE SET NULL, not CASCADE: losing the person must not lose the
  -- ticket. The history outlives the account.
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source      text NOT NULL DEFAULT 'customer',
  subject     text NOT NULL,
  body        text NOT NULL,
  status      text NOT NULL DEFAULT 'open',
  priority    text NOT NULL DEFAULT 'normal',
  assignee    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Where in the app it was raised, e.g. '/ai-visibility'. Free text: it is a
  -- triage hint, and pinning it to a route list would go stale on every new page.
  page        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_source_check') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_source_check
      CHECK (source IN ('customer', 'internal'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_status_check') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_status_check
      CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_priority_check') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;

  -- The pairing the RLS policies rely on. A customer ticket always has a
  -- tenant; an internal ticket never does. Read the header for why this is a
  -- security constraint and not a tidiness one.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_source_tenancy_check') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_source_tenancy_check
      CHECK (
        (source = 'customer' AND client_id IS NOT NULL)
        OR
        (source = 'internal' AND client_id IS NULL)
      );
  END IF;

  -- Empty subject or body makes a queue unusable and is never intentional.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_text_check') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_text_check
      CHECK (length(btrim(subject)) > 0 AND length(btrim(body)) > 0);
  END IF;
END $$;

-- Requested indexes. Each backs a filter the admin queue actually offers.
CREATE INDEX IF NOT EXISTS tickets_status_idx    ON public.tickets (status);
CREATE INDEX IF NOT EXISTS tickets_assignee_idx  ON public.tickets (assignee);
CREATE INDEX IF NOT EXISTS tickets_client_id_idx ON public.tickets (client_id);
-- Not requested, added because every list in both views is newest-first and
-- without it every page load is a full sort of the table.
CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON public.tickets (created_at DESC);


-- ── 2. ticket_comments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id          bigserial PRIMARY KEY,
  -- CASCADE here, unlike tickets.created_by: a comment has no meaning without
  -- its ticket, and there is no delete policy on tickets anyway, so this only
  -- fires for a deliberate service-key deletion.
  ticket_id   bigint NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body        text NOT NULL,
  -- true = agent-to-agent note. A customer must never see one. Enforced by the
  -- SELECT policy below, not by any frontend filter.
  is_internal boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_comments_body_check') THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_body_check
      CHECK (length(btrim(body)) > 0);
  END IF;
END $$;

-- Reading a ticket always means reading its whole thread in order.
CREATE INDEX IF NOT EXISTS ticket_comments_ticket_idx
  ON public.ticket_comments (ticket_id, created_at);


-- ── 3. updated_at trigger (and resolved_at, in the same place) ──────────────
--
-- resolved_at is maintained here rather than by the application because three
-- different callers can move a status (tickets-admin.js, a future automation,
-- a hand-run SQL fix) and only one place should own the derived timestamp.
-- Entering resolved or closed stamps it; leaving them (a reopen) clears it, so
-- the column always answers "when did this last become done" and never holds a
-- stale timestamp from a previous resolution.

CREATE OR REPLACE FUNCTION public.tickets_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at := now();
  ELSIF NEW.status NOT IN ('resolved', 'closed') AND OLD.status IN ('resolved', 'closed') THEN
    NEW.resolved_at := NULL;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tickets_touch_updated_at ON public.tickets;
CREATE TRIGGER tickets_touch_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.tickets_set_updated_at();


-- ── 4. RLS helper ───────────────────────────────────────────────────────────
--
-- ticket_comments policies need to know which tenant owns the parent ticket.
-- Doing that as a bare subquery inside the policy would make the subquery
-- subject to the tickets policies for whoever is asking, which is a second,
-- invisible layer of filtering inside a security rule. SECURITY DEFINER makes
-- the lookup unconditional and the policy mean exactly what it reads as. Same
-- shape and same reasoning as get_my_client_id() and is_admin() next door.
--
-- It leaks nothing: it returns only a client_id for a ticket id the caller
-- already had to guess, and every policy that calls it then compares that
-- value against the caller's own client_id.

CREATE OR REPLACE FUNCTION public.ticket_client_id(p_ticket_id bigint)
RETURNS integer LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT client_id FROM public.tickets WHERE id = p_ticket_id
$$;


-- ── 5. Row Level Security ───────────────────────────────────────────────────

ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Table privileges. RLS, not the GRANT, is the boundary: UPDATE is granted on
-- tickets but the update policy is is_admin() only, so a viewer holding the
-- privilege still changes zero rows. Granted explicitly rather than relying on
-- Supabase's default privileges so the intent is visible in this file, and
-- revoked from anon because no unauthenticated path touches either table.
REVOKE ALL ON public.tickets         FROM anon;
REVOKE ALL ON public.ticket_comments FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.tickets         TO authenticated;
GRANT SELECT, INSERT          ON public.ticket_comments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tickets_id_seq         TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.ticket_comments_id_seq TO authenticated;

DROP POLICY IF EXISTS tickets_select ON public.tickets;
DROP POLICY IF EXISTS tickets_insert ON public.tickets;
DROP POLICY IF EXISTS tickets_update ON public.tickets;
DROP POLICY IF EXISTS tickets_delete ON public.tickets;

-- SELECT. An admin sees every ticket including internal ones. A viewer sees
-- only its own tenant's tickets. The IS NOT NULL is redundant (NULL = <int> is
-- already NULL, not true) and is written anyway so that "internal tickets are
-- excluded" is legible in the policy text instead of being an inference about
-- three-valued logic.
CREATE POLICY tickets_select ON public.tickets
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (client_id IS NOT NULL AND client_id = public.get_my_client_id())
  );

-- INSERT. An admin may create anything, including an internal ticket
-- (client_id NULL, source 'internal') and a ticket on behalf of a client. A
-- viewer may only create a customer ticket, for its own tenant, authored by
-- itself, at the default status and priority, unassigned. See asymmetry 2 in
-- the header for why status and priority are pinned.
CREATE POLICY tickets_insert ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      source      = 'customer'
      AND client_id IS NOT NULL
      AND client_id = public.get_my_client_id()
      AND created_by = auth.uid()
      AND status    = 'open'
      AND priority  = 'normal'
      AND assignee IS NULL
      AND resolved_at IS NULL
    )
  );

-- UPDATE. Admins only, both clauses. There is deliberately no viewer branch:
-- status, priority and assignee are triage fields and triage is not the
-- customer's job. WITH CHECK repeats the condition so an admin cannot be the
-- vector for moving a row into a state the policy would not have allowed.
CREATE POLICY tickets_update ON public.tickets
  FOR UPDATE TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- No DELETE policy, for anyone. See the header.

DROP POLICY IF EXISTS ticket_comments_select ON public.ticket_comments;
DROP POLICY IF EXISTS ticket_comments_insert ON public.ticket_comments;
DROP POLICY IF EXISTS ticket_comments_update ON public.ticket_comments;
DROP POLICY IF EXISTS ticket_comments_delete ON public.ticket_comments;

-- SELECT. The is_internal test comes FIRST in the viewer branch so the rule
-- reads as what it is: a customer sees public comments, on its own tenant's
-- tickets, and nothing else. An internal note on a customer's own ticket is
-- excluded by the same clause that excludes another tenant's thread entirely.
CREATE POLICY ticket_comments_select ON public.ticket_comments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_internal = false
      AND public.ticket_client_id(ticket_id) IS NOT NULL
      AND public.ticket_client_id(ticket_id) = public.get_my_client_id()
    )
  );

-- INSERT. A viewer may reply on its own tenant's ticket, as itself, and can
-- never mark its own comment internal. `author = auth.uid()` stops a viewer
-- writing a comment attributed to an agent.
CREATE POLICY ticket_comments_insert ON public.ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      is_internal = false
      AND author = auth.uid()
      AND public.ticket_client_id(ticket_id) IS NOT NULL
      AND public.ticket_client_id(ticket_id) = public.get_my_client_id()
    )
  );

-- No UPDATE and no DELETE policy on comments, for anyone. A thread that can be
-- silently rewritten after the fact is not evidence of anything.


-- ============================================================================
-- 6. VERIFICATION. All read-only. Run after the block above and read the
--    output against the expectations in each comment.
-- ============================================================================

-- 6.1 Both tables exist with the expected columns.
--     EXPECT 13 rows for tickets, 5 for ticket_comments.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('tickets', 'ticket_comments')
ORDER BY table_name, ordinal_position;

-- 6.2 CHECK constraints landed.
--     EXPECT 5 on tickets (source, status, priority, source_tenancy, text)
--     and 1 on ticket_comments (body).
SELECT rel.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public'
  AND rel.relname IN ('tickets', 'ticket_comments')
  AND con.contype = 'c'
ORDER BY rel.relname, con.conname;

-- 6.3 RLS is ON for both tables. EXPECT relrowsecurity = true on both rows.
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE oid IN ('public.tickets'::regclass, 'public.ticket_comments'::regclass);

-- 6.4 The policy set. THIS IS THE ONE THAT MATTERS.
--     EXPECT exactly 5 rows:
--       tickets          tickets_select          SELECT
--       tickets          tickets_insert          INSERT
--       tickets          tickets_update          UPDATE
--       ticket_comments  ticket_comments_select  SELECT
--       ticket_comments  ticket_comments_insert  INSERT
--     EXPECT no DELETE policy on either table, and no UPDATE policy on
--     ticket_comments. If a sixth row appears, something else created it and
--     the matrix below no longer holds.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('tickets', 'ticket_comments')
ORDER BY tablename, cmd, policyname;

-- 6.5 Indexes. EXPECT tickets_status_idx, tickets_assignee_idx,
--     tickets_client_id_idx, tickets_created_at_idx, ticket_comments_ticket_idx
--     plus the two primary keys.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('tickets', 'ticket_comments')
ORDER BY tablename, indexname;

-- 6.6 Trigger. EXPECT one row: tickets_touch_updated_at, BEFORE UPDATE.
SELECT tgname, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.tickets'::regclass AND NOT tgisinternal;

-- 6.7 Helper function is SECURITY DEFINER. EXPECT prosecdef = true.
SELECT proname, prosecdef, provolatile
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('ticket_client_id', 'tickets_set_updated_at');

-- ----------------------------------------------------------------------------
-- 6.8 THE MATRIX these policies produce, derived from the policy text above
--     and from what is absent. Read 6.4's output against it.
--
--   TABLE tickets
--     op      admin                      viewer
--     SELECT  every row, incl. internal  own client_id only; internal rows are
--                                        unreachable (client_id IS NULL)
--     INSERT  any row, any source        source='customer', own client_id,
--                                        created_by=self, status='open',
--                                        priority='normal', assignee NULL
--     UPDATE  any row, any column        NOTHING. No policy exists, so every
--                                        UPDATE affects 0 rows regardless of
--                                        which column it targets. This is how
--                                        "cannot change status, priority or
--                                        assignee" is actually enforced.
--     DELETE  nothing (no policy)        nothing (no policy)
--
--   TABLE ticket_comments
--     op      admin                      viewer
--     SELECT  every comment, incl.       is_internal=false comments on its own
--             is_internal=true           client's tickets ONLY. Internal notes
--                                        are invisible.
--     INSERT  any comment, may set       is_internal=false only, author=self,
--             is_internal=true           on its own client's tickets only
--     UPDATE  nothing (no policy)        nothing (no policy)
--     DELETE  nothing (no policy)        nothing (no policy)
--
--   In every row above, "viewer" means any authenticated user whose
--   user_profiles.role is not 'admin'. is_admin() returns false for a missing
--   profile (it COALESCEs to false), so a JWT with no profile row gets the
--   viewer column with a NULL client_id, which matches nothing.
--
--   The service key used by Netlify functions bypasses all of this by design.
--   That is why support-request.js pins client_id from the caller's own
--   profile and why tickets-admin.js sits behind requireAuth({ adminOnly:true }).
-- ----------------------------------------------------------------------------

-- 6.9 OPTIONAL live proof, in the shape used by
--     supabase-prompts-own-client-writes-migration.sql. Runs as a real viewer
--     and rolls everything back, so nothing is persisted. Replace the two
--     placeholders before running:
--       <VIEWER_UUID>  a user_profiles.id whose role = 'viewer'
--       <OTHER_CLIENT> a clients.id that viewer does NOT belong to
--
-- BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claims = '{"sub":"<VIEWER_UUID>","role":"authenticated"}';
--
--   -- T1 viewer INSERT for own client            -> EXPECT 1 row
--   -- T2 viewer INSERT for <OTHER_CLIENT>        -> EXPECT policy violation
--   -- T3 viewer INSERT with priority='urgent'    -> EXPECT policy violation
--   -- T4 viewer INSERT with source='internal'    -> EXPECT policy violation
--   -- T5 viewer UPDATE own ticket SET status     -> EXPECT UPDATE 0
--   -- T6 viewer SELECT an internal ticket        -> EXPECT 0 rows
--   -- T7 viewer SELECT a comment with
--   --    is_internal = true on its OWN ticket    -> EXPECT 0 rows
--   -- T8 viewer INSERT comment is_internal=true  -> EXPECT policy violation
--   -- T9 viewer DELETE own ticket                -> EXPECT DELETE 0
-- ROLLBACK;
