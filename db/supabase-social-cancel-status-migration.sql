-- ============================================================================
-- supabase-social-cancel-status-migration.sql   (AI Social, 2026-07-21)
--
-- WHY. Canceling a scheduled post (via the provider's deletePost) needs a status
-- to record on each per-platform target. social_posts.status already allows
-- 'canceled' (it was in the original migration's check), but
-- social_post_targets.status did NOT -- its constraint was
-- ('pending','scheduled','published','failed','skipped'). Writing 'canceled' to a
-- target would fail the check constraint, so social-delete.js could cancel at the
-- provider but never mark the rows. This adds 'canceled' to the target constraint
-- so the two levels agree.
--
-- SAFE TO RE-RUN. Widening a CHECK constraint cannot invalidate existing rows:
-- every currently-allowed value stays allowed.
-- Run in the Supabase SQL editor, project duiyifepitvugyulobqm.
-- ============================================================================

alter table public.social_post_targets
  drop constraint if exists social_post_targets_status_check;
alter table public.social_post_targets
  add constraint social_post_targets_status_check check (status in (
    'pending','scheduled','published','failed','skipped','canceled'
  ));

-- ── Verification ────────────────────────────────────────────────────────────
--   select conrelid::regclass as tbl, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.social_post_targets'::regclass
--     and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%';
--   -- Expect the list to include 'canceled'.
