-- supabase-agency-rls-group-b-2026-11-16.sql
--
-- NOT APPLIED. Written 2026-11-16 by bg-backend (Opus) for release P1 of
-- docs/arch/agency-multi-brand.md, revision 4. This file is step 3 of
-- section 13 of that spec.
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new),
-- pasted as one batch, run as the editor's role (postgres).
--
-- What it does
--   1. Rewrites the 36 Group B RLS policies (spec 1.1, 5.4) in place with
--      ALTER POLICY, so the command, the roles and PERMISSIVE never change and
--      there is no window without a policy:
--        client_id = get_my_client_id()                to has_client_access(client_id)
--        client_id = my_client_id()                    to has_client_access(client_id)
--        ticket_client_id(ticket_id) = get_my_client_id()
--                                                      to has_client_access(ticket_client_id(ticket_id))
--      35 are exactly that substitution. Every other conjunction (the ticket
--      guards, tickets_insert's null guard, my_role() on the two collection
--      tables) survives unchanged. The one exception is oauth_grants_select,
--      a per-user credential (review B, L1):
--        is_admin() or (user_id = auth.uid() and has_client_access(client_id))
--   2. Gives public.ticket_client_id(bigint) search_path = '' (its body was
--      read on 2026-11-16 and already schema-qualifies its only reference,
--      public.tickets; the body is kept verbatim). Its grants are not changed.
--   3. Rewrites client_events_type_check with its 11 live values verbatim
--      plus 'account_change' (the type every 4.6 function writes).
--   4. Rewrites client_invite_links_source_check with its 3 live values
--      verbatim plus 'agency-admin' (the source agency-admin.js writes, 9.1).
--
-- Why this is no widening for anyone today (spec 5.5): after the step 1+2
-- file every existing user holds exactly one user_clients row, on their own
-- default brand, and no 'account' or 'direct' row exists, so
-- has_client_access(x) equals x = get_my_client_id() for every user and every
-- x. The substitution is the identity until step 5 (the first agency).
--
-- ORDER RULE, NOT NEGOTIABLE
--   1. db/supabase-agency-accounts-2026-11-16.sql applied and read back (R1, R2).
--   2. This file, then its read-back below and section R3 of
--      db/supabase-agency-readback-2026-11-16.sql.
--   3. db/supabase-agency-watchdog-2026-11-16.sql.
--   4. Only then the dashboard push (step 4). Never the reverse.
--   Order trap (spec 13): step 5 (the first agency) must never precede this
--   file, or a staff member would see a client brand's AI results (Group A)
--   while its SEO, fix, notification and collection-job rows read empty.
--
-- Re-run safety: ALTER POLICY and CREATE OR REPLACE are idempotent; the two
-- constraints are dropped if they exist and re-added. A second run changes
-- nothing.
--
-- ============================================================================
-- PRE-APPLY CHECKS (read only). Run immediately before applying. A different
-- answer STOPS the apply: a policy or a constraint changed since 2026-11-16
-- and this file would overwrite that change.
-- ============================================================================
--
-- P1: the 36 Group B policies are exactly the text saved in the rollback
-- section of this file (md5 over every field, read 2026-11-16)
-- select count(*) as n,
--        md5(string_agg(tablename || '|' || policyname || '|' || cmd || '|' || roles::text || '|'
--                       || permissive || '|' || coalesce(qual, '') || '|' || coalesce(with_check, ''),
--                       E'\n' order by tablename, policyname)) as md5
--   from pg_policies
--  where schemaname = 'public'
--    and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'my_client_id\(';
--   -- EXPECT n = 36, md5 = 0c462086f2a2b55a1739398e12957e3c
--
-- P2: policies already on has_client_access (Group A)
-- select count(*) from pg_policies
--  where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'has_client_access\(';
--   -- EXPECT 15
--
-- P3: the two constraints are the live lists of 2026-11-16
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conname in ('client_events_type_check', 'client_invite_links_source_check') order by 1;
--   -- EXPECT client_events_type_check:
--   --   CHECK ((type = ANY (ARRAY['plan_change'::text, 'trial_grant'::text, 'comp_grant'::text,
--   --   'trial_expired'::text, 'onboarded'::text, 'signup'::text, 'stripe_change'::text,
--   --   'stripe_provision'::text, 'mcp_fix_marked'::text, 'invite_resent'::text, 'location_change'::text])))
--   -- EXPECT client_invite_links_source_check:
--   --   CHECK ((source = ANY (ARRAY['onboard-client'::text, 'explee-import'::text, 'resend-invite'::text])))
--   -- An extra value in either STOPS the apply: add it to step 3 or 4 below first.
--
-- P4: the step 1+2 file is in (has_client_access must see the backfill rows)
-- select count(*) from public.user_profiles p
--   left join public.user_clients uc on uc.user_id = p.id and uc.client_id = p.client_id
--  where p.client_id is not null and uc.user_id is null;                             -- EXPECT 0
--
-- ============================================================================
-- READ-BACK (read only). Run AFTER commit. Then section R3 of
-- db/supabase-agency-readback-2026-11-16.sql (the end-to-end function block).
-- ============================================================================
--
-- RB1: nothing mentions the default-brand helpers any more
-- select count(*) from pg_policies
--  where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'my_client_id\(';
--   -- EXPECT 0
--
-- RB2: Group A plus Group B on the membership predicate
-- select count(*) from pg_policies
--  where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'has_client_access\(';
--   -- EXPECT 51
--
-- RB3: total policies (142 on 2026-11-16, plus the 2 of the step 1+2 file)
-- select count(*) from pg_policies where schemaname = 'public';                   -- EXPECT 144
--
-- RB4: every rewritten policy, compared against the expected deparsed text
-- with exp(tbl, pol, q, w) as (values
--   ('client_api_keys',     'client_api_keys_select',      '(is_admin() OR has_client_access(client_id))', null),
--   ('client_notifications','client_notifications_select', '(is_admin() OR has_client_access(client_id))', null),
--   ('client_notifications','client_notifications_update', '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('collection_jobs',     'collection_jobs_select',      '((my_role() = ''admin''::text) OR has_client_access(client_id))', null),
--   ('collection_runs',     'collection_runs_select',      '((my_role() = ''admin''::text) OR has_client_access(client_id))', null),
--   ('fix_states',          'fix_states_insert',           null, '(is_admin() OR has_client_access(client_id))'),
--   ('fix_states',          'fix_states_select',           '(is_admin() OR has_client_access(client_id))', null),
--   ('fix_states',          'fix_states_update',           '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('oauth_grants',        'oauth_grants_select',         '(is_admin() OR ((user_id = auth.uid()) AND has_client_access(client_id)))', null),
--   ('seo_briefs',          'seo_briefs_delete',           '(is_admin() OR has_client_access(client_id))', null),
--   ('seo_briefs',          'seo_briefs_insert',           null, '(is_admin() OR has_client_access(client_id))'),
--   ('seo_briefs',          'seo_briefs_select',           '(is_admin() OR has_client_access(client_id))', null),
--   ('seo_briefs',          'seo_briefs_update',           '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('seo_crawls',          'seo_crawls_insert',           null, '(is_admin() OR has_client_access(client_id))'),
--   ('seo_crawls',          'seo_crawls_select',           '(is_admin() OR has_client_access(client_id))', null),
--   ('seo_pages',           'seo_pages_delete',            '(is_admin() OR has_client_access(client_id))', null),
--   ('seo_pages',           'seo_pages_insert',            null, '(is_admin() OR has_client_access(client_id))'),
--   ('seo_pages',           'seo_pages_select',            '(is_admin() OR has_client_access(client_id))', null),
--   ('seo_pages',           'seo_pages_update',            '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('social_accounts',     'social_accounts_delete',      '(is_admin() OR has_client_access(client_id))', null),
--   ('social_accounts',     'social_accounts_select',      '(is_admin() OR has_client_access(client_id))', null),
--   ('social_accounts',     'social_accounts_update',      '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('social_post_targets', 'social_targets_delete',       '(is_admin() OR has_client_access(client_id))', null),
--   ('social_post_targets', 'social_targets_insert',       null, '(is_admin() OR has_client_access(client_id))'),
--   ('social_post_targets', 'social_targets_select',       '(is_admin() OR has_client_access(client_id))', null),
--   ('social_post_targets', 'social_targets_update',       '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('social_posts',        'social_posts_delete',         '(is_admin() OR has_client_access(client_id))', null),
--   ('social_posts',        'social_posts_insert',         null, '(is_admin() OR has_client_access(client_id))'),
--   ('social_posts',        'social_posts_select',         '(is_admin() OR has_client_access(client_id))', null),
--   ('social_posts',        'social_posts_update',         '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('social_profiles',     'social_profiles_select',      '(is_admin() OR has_client_access(client_id))', null),
--   ('social_profiles',     'social_profiles_update',      '(is_admin() OR has_client_access(client_id))', '(is_admin() OR has_client_access(client_id))'),
--   ('ticket_comments',     'ticket_comments_insert',      null, '(is_admin() OR ((is_internal = false) AND (author = auth.uid()) AND (ticket_client_id(ticket_id) IS NOT NULL) AND has_client_access(ticket_client_id(ticket_id))))'),
--   ('ticket_comments',     'ticket_comments_select',      '(is_admin() OR ((is_internal = false) AND (ticket_client_id(ticket_id) IS NOT NULL) AND has_client_access(ticket_client_id(ticket_id))))', null),
--   ('tickets',             'tickets_insert',              null, '(is_admin() OR ((source = ''customer''::text) AND (client_id IS NOT NULL) AND has_client_access(client_id) AND (created_by = auth.uid()) AND (status = ''open''::text) AND (priority = ''normal''::text) AND (assignee IS NULL) AND (resolved_at IS NULL)))'),
--   ('tickets',             'tickets_select',              '(is_admin() OR ((client_id IS NOT NULL) AND has_client_access(client_id)))', null))
-- select e.tbl, e.pol, p.cmd, p.roles::text, p.permissive, p.qual, e.q as expected_qual, p.with_check, e.w as expected_with_check
--   from exp e
--   left join pg_policies p on p.schemaname = 'public' and p.tablename = e.tbl and p.policyname = e.pol
--  where p.policyname is null
--     or p.qual is distinct from e.q
--     or p.with_check is distinct from e.w
--     or p.roles::text <> '{authenticated}'
--     or p.permissive <> 'PERMISSIVE';
--   -- EXPECT 0 rows. (36 rows in exp: 35 substitutions plus oauth_grants_select.)
--
-- RB5: ticket_client_id now has an empty search_path, same body, same grants
-- select proconfig, prosecdef, provolatile,
--        btrim(replace(prosrc, E'\r', ''), E' \n') as body,
--        (select array_agg(a::text order by a::text) from unnest(proacl) a)::text as acl
--   from pg_proc where oid = 'public.ticket_client_id(bigint)'::regprocedure;
--   -- EXPECT {"search_path=\"\""}, t, s,
--   --        SELECT client_id FROM public.tickets WHERE id = p_ticket_id,
--   --        {=X/postgres,anon=X/postgres,authenticated=X/postgres,postgres=X/postgres,service_role=X/postgres}
--
-- RB6: the two constraints
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conname in ('client_events_type_check', 'client_invite_links_source_check') order by 1;
--   -- EXPECT client_events_type_check: the 11 values of P3 plus 'account_change'::text, last
--   -- EXPECT client_invite_links_source_check: the 3 values of P3 plus 'agency-admin'::text, last
--
-- ============================================================================
-- ROLLBACK (by hand). Only after the dashboard revert, and only while no
-- agency exists (after step 5, first run the step 4 rollback of spec 13:
-- detach every attached brand, then revert_agency_to_direct).
-- After the rollback, P1 above must answer n = 36 and the same md5,
-- 0c462086f2a2b55a1739398e12957e3c, which proves the 36 policies are back
-- byte for byte.
-- ============================================================================
--
-- The CURRENT text of the 36 policies, read from production 2026-11-16.
-- Every one is cmd as listed, roles {authenticated}, PERMISSIVE. ALTER POLICY
-- below restores qual and with_check; it never changed cmd, roles or
-- permissive, so this restores each policy exactly.
--
--   table                 policy                       cmd     qual / with_check
--   client_api_keys       client_api_keys_select       SELECT  qual
--   client_notifications  client_notifications_select  SELECT  qual
--   client_notifications  client_notifications_update  UPDATE  qual, with_check
--   collection_jobs       collection_jobs_select       SELECT  qual
--   collection_runs       collection_runs_select       SELECT  qual
--   fix_states            fix_states_insert            INSERT  with_check
--   fix_states            fix_states_select            SELECT  qual
--   fix_states            fix_states_update            UPDATE  qual, with_check
--   oauth_grants          oauth_grants_select          SELECT  qual
--   seo_briefs            seo_briefs_delete            DELETE  qual
--   seo_briefs            seo_briefs_insert            INSERT  with_check
--   seo_briefs            seo_briefs_select            SELECT  qual
--   seo_briefs            seo_briefs_update            UPDATE  qual, with_check
--   seo_crawls            seo_crawls_insert            INSERT  with_check
--   seo_crawls            seo_crawls_select            SELECT  qual
--   seo_pages             seo_pages_delete             DELETE  qual
--   seo_pages             seo_pages_insert             INSERT  with_check
--   seo_pages             seo_pages_select             SELECT  qual
--   seo_pages             seo_pages_update             UPDATE  qual, with_check
--   social_accounts       social_accounts_delete       DELETE  qual
--   social_accounts       social_accounts_select       SELECT  qual
--   social_accounts       social_accounts_update       UPDATE  qual, with_check
--   social_post_targets   social_targets_delete        DELETE  qual
--   social_post_targets   social_targets_insert        INSERT  with_check
--   social_post_targets   social_targets_select        SELECT  qual
--   social_post_targets   social_targets_update        UPDATE  qual, with_check
--   social_posts          social_posts_delete          DELETE  qual
--   social_posts          social_posts_insert          INSERT  with_check
--   social_posts          social_posts_select          SELECT  qual
--   social_posts          social_posts_update          UPDATE  qual, with_check
--   social_profiles       social_profiles_select       SELECT  qual
--   social_profiles       social_profiles_update       UPDATE  qual, with_check
--   ticket_comments       ticket_comments_insert       INSERT  with_check
--   ticket_comments       ticket_comments_select       SELECT  qual
--   tickets               tickets_insert               INSERT  with_check
--   tickets               tickets_select               SELECT  qual
--
-- The expression of each, verbatim as pg_policies printed it, inside the
-- statements that restore it:
--
-- begin;
-- alter policy client_api_keys_select on public.client_api_keys
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy client_notifications_select on public.client_notifications
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy client_notifications_update on public.client_notifications
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy collection_jobs_select on public.collection_jobs
--   using (((my_role() = 'admin'::text) OR (client_id = my_client_id())));
-- alter policy collection_runs_select on public.collection_runs
--   using (((my_role() = 'admin'::text) OR (client_id = my_client_id())));
-- alter policy fix_states_insert on public.fix_states
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy fix_states_select on public.fix_states
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy fix_states_update on public.fix_states
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy oauth_grants_select on public.oauth_grants
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_briefs_delete on public.seo_briefs
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_briefs_insert on public.seo_briefs
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_briefs_select on public.seo_briefs
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_briefs_update on public.seo_briefs
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_crawls_insert on public.seo_crawls
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_crawls_select on public.seo_crawls
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_pages_delete on public.seo_pages
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_pages_insert on public.seo_pages
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_pages_select on public.seo_pages
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy seo_pages_update on public.seo_pages
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_accounts_delete on public.social_accounts
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_accounts_select on public.social_accounts
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_accounts_update on public.social_accounts
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_targets_delete on public.social_post_targets
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_targets_insert on public.social_post_targets
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_targets_select on public.social_post_targets
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_targets_update on public.social_post_targets
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_posts_delete on public.social_posts
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_posts_insert on public.social_posts
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_posts_select on public.social_posts
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_posts_update on public.social_posts
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_profiles_select on public.social_profiles
--   using ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy social_profiles_update on public.social_profiles
--   using ((is_admin() OR (client_id = get_my_client_id())))
--   with check ((is_admin() OR (client_id = get_my_client_id())));
-- alter policy ticket_comments_insert on public.ticket_comments
--   with check ((is_admin() OR ((is_internal = false) AND (author = auth.uid()) AND (ticket_client_id(ticket_id) IS NOT NULL) AND (ticket_client_id(ticket_id) = get_my_client_id()))));
-- alter policy ticket_comments_select on public.ticket_comments
--   using ((is_admin() OR ((is_internal = false) AND (ticket_client_id(ticket_id) IS NOT NULL) AND (ticket_client_id(ticket_id) = get_my_client_id()))));
-- alter policy tickets_insert on public.tickets
--   with check ((is_admin() OR ((source = 'customer'::text) AND (client_id IS NOT NULL) AND (client_id = get_my_client_id()) AND (created_by = auth.uid()) AND (status = 'open'::text) AND (priority = 'normal'::text) AND (assignee IS NULL) AND (resolved_at IS NULL))));
-- alter policy tickets_select on public.tickets
--   using ((is_admin() OR ((client_id IS NOT NULL) AND (client_id = get_my_client_id()))));
--
-- -- ticket_client_id: back to no proconfig (pre-existing state, read 2026-11-16)
-- alter function public.ticket_client_id(bigint) reset search_path;
--
-- -- client_events_type_check: back to the 11 values. Only when no
-- -- 'account_change' row exists (check first:
-- --   select count(*) from public.client_events where type = 'account_change';  -- EXPECT 0
-- -- with rows present, keep the wider check: re-adding the narrow one fails validation).
-- alter table public.client_events drop constraint if exists client_events_type_check;
-- alter table public.client_events add constraint client_events_type_check
--   check (type in ('plan_change', 'trial_grant', 'comp_grant', 'trial_expired', 'onboarded',
--                   'signup', 'stripe_change', 'stripe_provision', 'mcp_fix_marked',
--                   'invite_resent', 'location_change'));
--
-- -- client_invite_links_source_check: back to the 3 values. Only when no
-- -- 'agency-admin' row exists (select count(*) from public.client_invite_links
-- -- where source = 'agency-admin'; EXPECT 0).
-- alter table public.client_invite_links drop constraint if exists client_invite_links_source_check;
-- alter table public.client_invite_links add constraint client_invite_links_source_check
--   check (source in ('onboard-client', 'explee-import', 'resend-invite'));
-- commit;

begin;
set local lock_timeout = '5s';  -- on a timeout the whole transaction aborts cleanly; this file is safe to run again

-- ============================================================================
-- 1. Group B, 36 policies (spec 5.4)
-- ============================================================================

alter policy client_api_keys_select on public.client_api_keys
  using (public.is_admin() OR public.has_client_access(client_id));

alter policy client_notifications_select on public.client_notifications
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy client_notifications_update on public.client_notifications
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy collection_jobs_select on public.collection_jobs
  using ((public.my_role() = 'admin'::text) OR public.has_client_access(client_id));
alter policy collection_runs_select on public.collection_runs
  using ((public.my_role() = 'admin'::text) OR public.has_client_access(client_id));

alter policy fix_states_insert on public.fix_states
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy fix_states_select on public.fix_states
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy fix_states_update on public.fix_states
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

-- the one exception: a grant is a per-user credential (review B, L1)
alter policy oauth_grants_select on public.oauth_grants
  using (public.is_admin() OR ((user_id = auth.uid()) AND public.has_client_access(client_id)));

alter policy seo_briefs_delete on public.seo_briefs
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_briefs_insert on public.seo_briefs
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_briefs_select on public.seo_briefs
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_briefs_update on public.seo_briefs
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy seo_crawls_insert on public.seo_crawls
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_crawls_select on public.seo_crawls
  using (public.is_admin() OR public.has_client_access(client_id));

alter policy seo_pages_delete on public.seo_pages
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_pages_insert on public.seo_pages
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_pages_select on public.seo_pages
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy seo_pages_update on public.seo_pages
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy social_accounts_delete on public.social_accounts
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_accounts_select on public.social_accounts
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_accounts_update on public.social_accounts
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy social_targets_delete on public.social_post_targets
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_targets_insert on public.social_post_targets
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy social_targets_select on public.social_post_targets
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_targets_update on public.social_post_targets
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy social_posts_delete on public.social_posts
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_posts_insert on public.social_posts
  with check (public.is_admin() OR public.has_client_access(client_id));
alter policy social_posts_select on public.social_posts
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_posts_update on public.social_posts
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

alter policy social_profiles_select on public.social_profiles
  using (public.is_admin() OR public.has_client_access(client_id));
alter policy social_profiles_update on public.social_profiles
  using (public.is_admin() OR public.has_client_access(client_id))
  with check (public.is_admin() OR public.has_client_access(client_id));

-- the ticket guards survive byte for byte; has_client_access(NULL) is not true,
-- so the IS NOT NULL guards keep their meaning (review A, C3)
alter policy ticket_comments_insert on public.ticket_comments
  with check (public.is_admin() OR ((is_internal = false) AND (author = auth.uid())
              AND (public.ticket_client_id(ticket_id) IS NOT NULL)
              AND public.has_client_access(public.ticket_client_id(ticket_id))));
alter policy ticket_comments_select on public.ticket_comments
  using (public.is_admin() OR ((is_internal = false)
         AND (public.ticket_client_id(ticket_id) IS NOT NULL)
         AND public.has_client_access(public.ticket_client_id(ticket_id))));

alter policy tickets_insert on public.tickets
  with check (public.is_admin() OR ((source = 'customer'::text) AND (client_id IS NOT NULL)
              AND public.has_client_access(client_id) AND (created_by = auth.uid())
              AND (status = 'open'::text) AND (priority = 'normal'::text)
              AND (assignee IS NULL) AND (resolved_at IS NULL)));
alter policy tickets_select on public.tickets
  using (public.is_admin() OR ((client_id IS NOT NULL) AND public.has_client_access(client_id)));

-- ============================================================================
-- 2. ticket_client_id: body verbatim (it already reads public.tickets), plus
-- search_path = '' (review A F-L7, review B L10). CREATE OR REPLACE keeps the
-- owner and the grants.
-- ============================================================================
create or replace function public.ticket_client_id(p_ticket_id bigint)
returns integer
language sql
stable
security definer
set search_path = ''
as $f$
  SELECT client_id FROM public.tickets WHERE id = p_ticket_id
$f$;

-- ============================================================================
-- 3. client_events_type_check: the 11 live values (read 2026-11-16) verbatim,
-- plus 'account_change'. Earlier changes to this constraint:
--   db/supabase-client-events-type-check-2026-07-31.sql (the eight originals)
--   db/supabase-mcp-fix-writes-2026-11-06.sql step 4 ('mcp_fix_marked')
--   db/supabase-client-events-invite-resent-2026-11-11.sql ('invite_resent')
--   db/supabase-client-locations-2026-11-13.sql step 7 ('location_change')
-- ============================================================================
alter table public.client_events drop constraint if exists client_events_type_check;
alter table public.client_events
  add constraint client_events_type_check
  check (type in (
    'plan_change',
    'trial_grant',
    'comp_grant',
    'trial_expired',
    'onboarded',
    'signup',
    'stripe_change',
    'stripe_provision',
    'mcp_fix_marked',
    'invite_resent',
    'location_change',
    'account_change'
  ));

-- ============================================================================
-- 4. client_invite_links_source_check: the 3 live values verbatim, plus
-- 'agency-admin' (spec 9.1, create_staff_login).
-- ============================================================================
alter table public.client_invite_links drop constraint if exists client_invite_links_source_check;
alter table public.client_invite_links
  add constraint client_invite_links_source_check
  check (source in ('onboard-client', 'explee-import', 'resend-invite', 'agency-admin'));

commit;
