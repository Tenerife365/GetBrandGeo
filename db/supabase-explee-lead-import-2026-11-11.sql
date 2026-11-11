-- ============================================================================
-- supabase-explee-lead-import-2026-11-11.sql
--
-- Explee lead import: replied leads become set-up Free accounts.
-- Contract: docs/arch/explee-lead-import.md, revision 4, section 5.1.
--
-- NOT APPLIED BY ANY AGENT. HUMAN CHECKPOINT: apply only on the owner's go
-- (D13 step 2), in the Supabase dashboard, SQL Editor, project
-- duiyifepitvugyulobqm. Part A creates two tables, their RLS, the settings
-- row (mode 'dry_run', project_ids empty, so nothing is imported) and a
-- DISABLED watchdog row. Nothing reads them until the function deploys.
-- Part B (the cron job) stays commented out until D13 step 7.
--
-- Rollback of Part A:
--   drop table public.explee_leads, public.explee_import_settings;
--   delete from ops.watch_expectations where job = 'explee-import';
-- ============================================================================


-- ============================================================================
-- PART A: objects, no schedule
-- ============================================================================

create table if not exists public.explee_import_settings (
  id                       boolean primary key default true check (id),
  mode                     text not null default 'dry_run' check (mode in ('off','dry_run','live')),
  project_ids              integer[] not null default '{}',   -- empty = import NOTHING
  include_intents          text[] not null default array['hot_lead'],
  referral_intents         text[] not null default array['out_of_office','email_changed'],
  exclude_intents          text[] not null default array['not_interested','unsubscribe'],
  unknown_label_policy     text not null default 'hold' check (unknown_label_policy in ('hold','include')),
  max_creates_per_run      integer not null default 5   check (max_creates_per_run between 0 and 20),
  max_creates_per_day      integer not null default 30  check (max_creates_per_day between 0 and 200),
  max_referrals_per_run    integer not null default 1   check (max_referrals_per_run between 0 and 5),
  max_threads_per_run      integer not null default 100 check (max_threads_per_run between 1 and 1000),
  max_inbox_pages          integer not null default 50  check (max_inbox_pages between 1 and 500),
  max_dry_payloads_per_run integer not null default 5   check (max_dry_payloads_per_run between 0 and 20),
  max_reconcile_per_day    integer not null default 100 check (max_reconcile_per_day between 0 and 1000),
  note_enabled             boolean not null default true,
  follow_up_enabled        boolean not null default false,
  follow_up_body           text check (follow_up_body is null or length(follow_up_body) <= 4000),
  follow_up_delay_min      integer not null default 60 check (follow_up_delay_min between 0 and 2880),
  follow_up_max_age_hours  integer not null default 72 check (follow_up_max_age_hours between 1 and 720),   -- rev 3, L4
  max_follow_ups_per_run   integer not null default 5  check (max_follow_ups_per_run between 0 and 50),     -- rev 3, L4
  own_sender_domains       text[]  not null default array['getbrandgeo.com','trybrandgeo.com'],            -- rev 3, A3; rev 4, I-1: ADDS to the code constant OWN_SENDER_DEFAULTS, cannot remove it; effective list in rulesHash
  paused_until             timestamptz,
  last_summary_date        date,
  last_reconcile_date      date,
  last_dry_reconcile_date  date,                                                                           -- rev 3, F5
  last_me_at               timestamptz
);
insert into public.explee_import_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.explee_leads (
  person_id           text primary key check (person_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  project_id          integer not null,
  campaign_id         integer,
  state               text not null check (state in ('seen','processing','decided')),
  claim_token         uuid,
  claimed_at          timestamptz,
  decision            text check (decision in ('would_create','creating','created','skipped','failed')),
  reason              text,
  final               boolean not null default false,
  intent              text,
  intents_seen        text[] not null default '{}',
  lead_status         text,
  replied_at          timestamptz,               -- listing latest_reply_at, last seen
  decided_reply_at    timestamptz,               -- latest_reply_at the decision was taken on
  rules_hash          text,                      -- rulesHash(settings) the decision was taken under
  listing_seen_at     timestamptz,
  absent_since        timestamptz,               -- rev 3, M2: first absence from a complete listing; null when seen
  pending_slug        text,                      -- rev 3, auth I1 / L7: slug about to be inserted, written before each client insert
  invitee_source      text check (invitee_source in ('replier','referral')),
  email               text,
  email_sha256        text,
  brand_domain        text,
  email_domain        text,
  company_name        text,
  country             text check (country is null or country ~ '^[A-Z]{2}$'),
  market_id           text,
  region_id           text,
  would_payload       jsonb,
  reply_excerpt       text check (reply_excerpt is null or length(reply_excerpt) <= 280),
  client_id           integer references public.clients(id) on delete set null,
  user_id             uuid,
  reserved_at         timestamptz,
  invite_sent_at      timestamptz,               -- rev 4, V2: set when an invite email went out; never cleared by code; C2 window and D5 suppression
  created_at_account  timestamptz,
  attempts            integer not null default 0 check (attempts between 0 and 10),
  attempts_total      integer not null default 0 check (attempts_total between 0 and 10),   -- rev 4, N3: every failed write except email_rate_limited; final at 10
  collection_status   text check (collection_status in ('enqueued','blocked_budget','enqueue_failed')),
  collection_attempts integer not null default 0,
  note_status         text check (note_status in ('written','failed','skipped')),
  note_attempts       integer not null default 0,
  follow_up_status    text check (follow_up_status in ('sent','failed','skipped_answered','skipped_referral','skipped_blocked',
                                                       'skipped_declined','skipped_expired','gave_up',
                                                       'skipped_label')),   -- rev 3: F2, L4, L3; rev 4: V4
  follow_up_attempts  integer not null default 0,
  follow_up_at        timestamptz,
  erased_at           timestamptz,
  undone_at           timestamptz,
  reconciled_at       timestamptz,
  decided_at          timestamptz,
  first_seen_at       timestamptz not null,      -- written by the code from the injected clock, no default
  updated_at          timestamptz not null,      -- written by the code from the injected clock, no default
  check (decision is distinct from 'creating'
         or (email_sha256 is not null and brand_domain is not null and reserved_at is not null)),
  check (decision is distinct from 'created'
         or (created_at_account is not null
             and (email is not null or erased_at is not null or undone_at is not null)))
);

create unique index if not exists uq_explee_leads_identity_email
  on public.explee_leads (email_sha256) where decision in ('creating','created');
create unique index if not exists uq_explee_leads_identity_domain
  on public.explee_leads (brand_domain) where decision in ('creating','created');
create index if not exists idx_explee_leads_queue
  on public.explee_leads (project_id, final, replied_at);
create index if not exists idx_explee_leads_reserved
  on public.explee_leads (reserved_at) where decision in ('creating','created');
create index if not exists idx_explee_leads_invite_sent                       -- rev 4, V2: C2 window
  on public.explee_leads (invite_sent_at) where invite_sent_at is not null;

alter table public.explee_leads           enable row level security;
alter table public.explee_import_settings enable row level security;
drop policy if exists explee_leads_admin_read on public.explee_leads;
drop policy if exists explee_settings_admin_read on public.explee_import_settings;
create policy explee_leads_admin_read    on public.explee_leads           for select to authenticated using (public.is_admin());
create policy explee_settings_admin_read on public.explee_import_settings for select to authenticated using (public.is_admin());
revoke all on public.explee_leads, public.explee_import_settings from anon;
revoke insert, update, delete, truncate on public.explee_leads, public.explee_import_settings from authenticated;  -- rev 3, auth I3
-- no insert, update or delete policy: only the service role writes

insert into ops.watch_expectations (job, source, max_silence, consecutive, enabled, note)
values ('explee-import', 'job_runs', interval '2 hours', 2, false, 'enable when the cron job is scheduled')
on conflict (job) do nothing;


-- ============================================================================
-- READ BACK after Part A (read-only):
-- ============================================================================
-- select relname, relrowsecurity from pg_class
--  where relname in ('explee_leads', 'explee_import_settings');
-- select polname, polcmd from pg_policy
--  where polrelid in ('public.explee_leads'::regclass, 'public.explee_import_settings'::regclass);
-- select mode, project_ids from public.explee_import_settings;


-- ============================================================================
-- D13 step 5: the first dry pull, by hand (after the deploy and the key).
-- Judge it by its job_runs row, never by the HTTP answer (always 202).
-- ============================================================================
-- select net.http_post(
--   url := 'https://app.getbrandgeo.com/.netlify/functions/explee-import-background',
--   body := '{"mode":"dry_run"}'::jsonb,
--   headers := jsonb_build_object('Content-Type','application/json','X-Cron-Key',
--     (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--   timeout_milliseconds := 30000);
--
-- select ran_at, ok, detail->>'skipped' as skipped, detail->'projectsVisible' as projects
--   from public.job_runs where job = 'explee-import' order by ran_at desc limit 5;
--
-- The owner then lists the projects to import (his statement, not an agent's):
--   update public.explee_import_settings set project_ids = '{<id>}';


-- ============================================================================
-- D13 step 6: review SELECTs. Results are never written into docs/ or any
-- committed file.
-- ============================================================================
-- select decision, reason, count(*) from public.explee_leads
--  group by 1, 2 order by 1, 2;
--
-- select intent, count(*) from public.explee_leads group by 1 order by 2 desc;
--
-- select person_id, would_payload->>'brandName' as brand, would_payload->>'website' as website,
--        would_payload->>'marketId' as market, would_payload->>'inviteeMasked' as invitee,
--        would_payload->'prompts' as prompts, would_payload->>'error' as error
--   from public.explee_leads where decision = 'would_create' order by replied_at;
--
-- select person_id, reason, intent, reply_excerpt from public.explee_leads
--  where reason in ('unknown_intent', 'replied_by_other', 'auto_reply_no_referral');
--
-- Kill switch (effective before the next provisioning call of a running run):
--   update public.explee_import_settings set mode = 'off';
--
-- Rev 3, C3 (rev 4): a provisioning failure after the invite is final until a
-- human resets the row. The reset keeps invite_sent_at, so the daily window
-- keeps counting the invite that really went out until 24 hours have passed:
--   update public.explee_leads set state='seen', decision=null, reason=null,
--     final=false, attempts=0, attempts_total=0, reserved_at=null where person_id = '<id>';
--
-- Rev 3, grants read back (bg-verify, criterion 33), each must be false:
-- select has_table_privilege('authenticated', 'public.explee_leads', 'INSERT'),
--        has_table_privilege('authenticated', 'public.explee_leads', 'UPDATE'),
--        has_table_privilege('authenticated', 'public.explee_leads', 'DELETE'),
--        has_table_privilege('authenticated', 'public.explee_leads', 'TRUNCATE'),
--        has_table_privilege('authenticated', 'public.explee_import_settings', 'INSERT'),
--        has_table_privilege('authenticated', 'public.explee_import_settings', 'UPDATE'),
--        has_table_privilege('authenticated', 'public.explee_import_settings', 'DELETE'),
--        has_table_privilege('authenticated', 'public.explee_import_settings', 'TRUNCATE');


-- ============================================================================
-- PART B, commented out until D13 step 7 (then also enable the watch row):
--   update ops.watch_expectations set enabled = true where job = 'explee-import';
-- ============================================================================
-- select cron.schedule('explee-import', '35 * * * *', $job$ select net.http_post(
--   url := 'https://app.getbrandgeo.com/.netlify/functions/explee-import-background',
--   body := '{}'::jsonb,
--   headers := jsonb_build_object('Content-Type','application/json','X-Cron-Key',
--     (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--   timeout_milliseconds := 30000); $job$);
--
-- Rollback of Part B:
--   select cron.alter_job(job_id => <id>, active => false);
