-- =============================================================================
-- supabase-prompts-delete-admin-only-2026-11-09.sql
--
-- Phase 2, ruling 1 of 2026-11-09 (docs/arch/phase2-dashboard-plan-2026-11-08.md,
-- "Rulings made 2026-11-09"). NOT APPLIED. Written by bg-backend, to be run by
-- Constantin on his go in the Supabase dashboard, SQL Editor, project
-- duiyifepitvugyulobqm. Idempotent: safe to re-run.
--
-- WHAT IT CHANGES. Exactly one policy: prompts_delete on public.prompts goes
-- from `is_admin() OR has_client_access(client_id)` to `is_admin()`. Admins
-- keep hard delete. A viewer retires a prompt by archiving it, an UPDATE of
-- is_active = false, which prompts_update still allows. prompts_client_read,
-- prompts_select, prompts_insert and prompts_update are not touched. Service
-- key paths (delete-client.js, onboard-client.js) bypass RLS and are not
-- affected.
--
-- WHY.
--   1. Closes N2 of docs/qa/phase2-server-rereview-2026-11-09.md, the
--      viewer-controlled delete race. A viewer could insert a prompt, POST a
--      collect with its real id, and delete the prompt while the engine was
--      answering. The engine call was billed, then the ai_results insert
--      failed on ai_results_prompt_id_fkey, and every spend gate
--      (_auth.js checkCollectionLimits) counts inserted rows only, so the
--      loop bought unbounded engine calls with no counted row. Without DELETE
--      a viewer cannot remove the parent row mid-call, so the insert lands
--      and the call is counted.
--   2. Stops a viewer erasing its own answer history: ai_results_prompt_id_fkey
--      and collection_jobs_prompt_id_fkey are both ON DELETE CASCADE (read
--      live 2026-11-09), so a viewer delete took every collected row for that
--      prompt with it. Archive keeps the rows.
--
-- PREREQUISITE, already in the working tree: src/pages/Prompts.tsx sends a
-- viewer's Remove as an UPDATE of is_active (removalMode / removalWrite), and
-- only an admin as a DELETE. Without that, a viewer's delete would silently
-- affect 0 rows after this policy lands. Ship the dashboard build that carries
-- it in the same window as this migration.
--
-- LIVE STATE THIS FILE WAS WRITTEN AGAINST (read 2026-11-09, read only):
--   RLS on public.prompts (not forced). Five policies:
--     prompts_client_read  SELECT authenticated  using (is_admin() OR has_client_access(client_id))
--     prompts_delete       DELETE authenticated  using (is_admin() OR has_client_access(client_id))
--     prompts_insert       INSERT authenticated  check (is_admin() OR has_client_access(client_id))
--     prompts_select       SELECT public         using ((my_role() = 'admin') OR has_client_access(client_id))
--     prompts_update       UPDATE authenticated  using and check (is_admin() OR has_client_access(client_id))
--   public.is_admin(): SQL, STABLE, SECURITY DEFINER, search_path '', true
--   when user_profiles.role = 'admin' for auth.uid(), else false.
--
-- PROVEN BEFORE WRITING (one execute_sql, begin; ... rollback;, the exact
-- statements of PART A, then impersonation of a real viewer of client 54 and
-- of a real admin, both as role authenticated with request.jwt.claims sub):
--   viewer DELETE of one of client 54's prompts           -> 0 rows
--   viewer UPDATE is_active = false on the same prompt    -> 1 row
--   admin  DELETE of the same prompt                      -> 1 row
-- Control, same viewer, live policy, no change applied:
--   viewer DELETE of the same prompt                      -> 1 row
-- Everything rolled back; the five live policies read back unchanged, and the
-- probed prompt still active with its 12 ai_results rows.
--
-- PROVEN AGAIN 2026-11-09 with the column-grant change (N7), one DO block
-- applying all of PART A, then raising to roll back. Same viewer and an admin:
--   viewer UPDATE id                 -> refused 42501
--   viewer UPDATE client_id          -> refused 42501
--   viewer DELETE                    -> 0 rows
--   viewer UPDATE text               -> 1 row
--   viewer UPDATE category, position -> 1 row
--   viewer UPDATE is_active = false  -> 1 row
--   admin  UPDATE text               -> 1 row
--   admin  UPDATE id                 -> refused 42501 (no caller does this)
--   admin  DELETE                    -> 1 row
-- Read back after: prompts_delete and the authenticated UPDATE grant are the
-- live ones (all seven columns), prompt still active with its 12 rows.
--
-- COST: zero model calls, no data touched, no table shape changed.
-- =============================================================================


-- =============================================================================
-- PART A. The change. One transaction so the table is never without a DELETE
-- policy for admins between the drop and the create.
-- =============================================================================

begin;

drop policy if exists prompts_delete on public.prompts;

create policy prompts_delete
  on public.prompts
  as permissive
  for delete
  to authenticated
  using (public.is_admin());

comment on policy prompts_delete on public.prompts is
  'Admin only since 2026-11-09 (ruling 1, closes server re-review N2). Viewers archive with is_active = false through prompts_update. db/supabase-prompts-delete-admin-only-2026-11-09.sql';

-- Added 2026-11-09 after docs/qa/phase2-server-final2-2026-11-09.md N7.
-- Removing DELETE alone does not close the race: authenticated held UPDATE on
-- every column, including prompts.id, the FKs from ai_results and
-- collection_jobs are ON UPDATE NO ACTION, and enforce_prompt_cap returns early
-- on an id change. So a viewer could renumber a prompt mid-call and the
-- collector's ai_results insert failed with 23503 after the engine had billed.
-- From here the browser roles may update only the four columns the dashboard
-- writes (src/pages/Prompts.tsx: text and category on edit, is_active on
-- archive; position is kept for reordering). id, client_id and created_at are
-- no longer updatable from the browser. anon loses UPDATE entirely; it never
-- had a policy that let it through. service_role is not touched.
revoke update on public.prompts from anon, authenticated;
grant update (text, category, is_active, position) on public.prompts to authenticated;

-- Added 2026-11-09 after docs/qa/phase2-server-n7-closure-2026-11-09.md P2
-- (pre-existing). A viewer could INSERT prompts with explicit ids, taking ids
-- ahead of prompts_id_seq so that later default inserts (every customer's
-- prompt creation, onboarding) fail with 23505. The browser insert in
-- src/pages/Prompts.tsx writes text, category, position and client_id only;
-- is_active is granted for completeness. id and created_at come from their
-- defaults. anon loses INSERT entirely (no policy ever let it through).
revoke insert on public.prompts from anon, authenticated;
grant insert (text, category, position, client_id, is_active) on public.prompts to authenticated;

commit;


-- =============================================================================
-- PART B. Read back. Expect five rows; prompts_delete reads
-- `DELETE {authenticated} using: is_admin()`, the other four unchanged from
-- the live state listed in the header.
-- =============================================================================

-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'prompts'
--  order by policyname;


-- =============================================================================
-- ROLLBACK. Restores the policy exactly as it was read live on 2026-11-09.
-- =============================================================================

-- begin;
-- drop policy if exists prompts_delete on public.prompts;
-- create policy prompts_delete
--   on public.prompts
--   as permissive
--   for delete
--   to authenticated
--   using (public.is_admin() or public.has_client_access(client_id));
-- revoke update (text, category, is_active, position) on public.prompts from authenticated;
-- revoke insert (text, category, position, client_id, is_active) on public.prompts from authenticated;
-- grant update, insert on public.prompts to anon, authenticated;
-- commit;
--
-- Read back the column grants too:
-- select grantee, string_agg(column_name, ',' order by column_name)
--   from information_schema.column_privileges
--  where table_schema = 'public' and table_name = 'prompts'
--    and privilege_type = 'UPDATE' and grantee in ('anon', 'authenticated')
--  group by grantee;
-- Expect after PART A: authenticated category,is_active,position,text and no anon row.
