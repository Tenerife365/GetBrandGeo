-- supabase-prompts-own-client-writes-migration.sql
-- SECURITY-AUDIT.md §0.5 — self-serve users could not manage their own prompts.
--
-- ✅ ALREADY APPLIED to the live project (duiyifepitvugyulobqm) on 2026-07-13 as
-- migration `prompts_own_client_writes`. Kept here as the source-of-truth record.
-- Safe to re-run (DROP ... IF EXISTS).
--
-- THE PROBLEM
--   prompts INSERT/UPDATE/DELETE were admin-only (my_role() = 'admin'). Every
--   self-serve account is provisioned as `viewer` — free signup (signup-client.js)
--   AND paying Essentials/Growth (stripe-webhook.js) — so a paying customer landed
--   on a dashboard they could not fill. A live gap on the revenue path.
--   NOT a security hole (no cross-tenant exposure), but a product-breaking one.
--
-- THE FIX
--   A user may manage prompts for THEIR OWN client only. Admins keep global access.
--   Cross-tenant writes remain impossible:
--     - INSERT: WITH CHECK pins the new row's client_id to the caller's own client.
--     - UPDATE: USING picks which rows are touchable, WITH CHECK stops the row being
--               *moved* to another tenant (both clauses required — USING alone would
--               let a viewer reassign client_id on a row they legitimately own).
--     - DELETE: USING limits deletion to the caller's own client.
--
--   Scoped to `authenticated` (was `public`, which also covered `anon`). anon has no
--   JWT, so get_my_client_id() is null and it could never have written anyway — this
--   just makes the intent explicit.
--
-- TRADE-OFF (accepted, deliberate)
--   Managed/done-for-you clients are also `viewer`, so they can now edit their own
--   prompts too. Harmless from a security standpoint — it's their own data — but it
--   does mean a Managed client could delete prompts BrandGEO set up for them.

DROP POLICY IF EXISTS prompts_insert ON public.prompts;
DROP POLICY IF EXISTS prompts_update ON public.prompts;
DROP POLICY IF EXISTS prompts_delete ON public.prompts;

CREATE POLICY prompts_insert ON public.prompts
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR client_id = get_my_client_id());

CREATE POLICY prompts_update ON public.prompts
  FOR UPDATE TO authenticated
  USING      (is_admin() OR client_id = get_my_client_id())
  WITH CHECK (is_admin() OR client_id = get_my_client_id());

CREATE POLICY prompts_delete ON public.prompts
  FOR DELETE TO authenticated
  USING (is_admin() OR client_id = get_my_client_id());

-- ── Verified live 2026-07-13 by impersonating a real viewer's JWT ─────────────
--   T1 viewer INSERT for own client      → ALLOWED  ✅
--   T2 viewer INSERT for another client  → BLOCKED  ✅
--   T3 viewer MOVES own prompt to another tenant (UPDATE client_id) → BLOCKED ✅
--   T4 viewer DELETE another tenant's prompts → 0 rows ✅
-- (run inside a DO block that raised at the end, so nothing was persisted)
