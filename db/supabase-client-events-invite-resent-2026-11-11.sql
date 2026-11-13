-- supabase-client-events-invite-resent-2026-11-11.sql
--
-- NOT YET APPLIED. Written 2026-11-11 by bg-backend; apply only on
-- Constantin's go, in the Supabase dashboard, SQL Editor, project
-- duiyifepitvugyulobqm.
--
-- Widens the CHECK on public.client_events.type by one value,
-- 'invite_resent', written by netlify/functions/resend-invite.js after an
-- admin resends an invite email (pending invites, 2026-11-11).
--
-- The function works WITHOUT this migration. Its audit insert is the last
-- step and is non-fatal: until this runs, the CHECK refuses the row, the
-- function logs the refusal and answers 200 with "audit_logged": false. The
-- invite email is sent either way. Applying this only starts keeping the
-- trail.
--
-- Additive: no row changes value. The constraint is rebuilt with the nine
-- values read live on 2026-11-11 plus the new one. Safe to re-run.
--
-- Earlier changes to the same constraint, same pattern:
--   db/supabase-client-events-type-check-2026-07-31.sql (the eight originals)
--   db/supabase-mcp-fix-writes-2026-11-06.sql step 4 ('mcp_fix_marked')
--
-- Insert site of the new value:
--   invite_resent   resend-invite.js, sendInvite(), after a successful
--                   auth.admin.inviteUserByEmail. meta carries
--                   { source, user_id, via } and never an email address.

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
    'invite_resent'
  ));

-- Read back after applying ----------------------------------------------------
--
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.client_events'::regclass
--     and conname = 'client_events_type_check';
--   -- EXPECT the nine earlier values plus 'invite_resent'.
--
--   select type, count(*) from public.client_events group by type order by type;
--   -- EXPECT the same counts as before applying (no row touched).
--
-- Proof inside a transaction that is ROLLED BACK (fill <CLIENT_ID> from a
-- read-only select of any existing client id first):
--
--   begin;
--   insert into public.client_events (client_id, type, meta)
--   values (<CLIENT_ID>, 'invite_resent', '{}'::jsonb) returning id;
--   -- EXPECT one id
--   rollback;

-- Rollback (by hand, only if the feature is withdrawn) ---------------------------
--
-- Only when no 'invite_resent' row exists (else keep the wider check, since
-- rebuilding without the value would fail on validation):
--
--   alter table public.client_events drop constraint if exists client_events_type_check;
--   alter table public.client_events
--     add constraint client_events_type_check
--     check (type in (
--       'plan_change', 'trial_grant', 'comp_grant', 'trial_expired', 'onboarded',
--       'signup', 'stripe_change', 'stripe_provision', 'mcp_fix_marked'
--     ));
