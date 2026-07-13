-- supabase-recommendations-migration.sql
-- Master-Recommendations · CLIENT-HEALTH-BPR.md §6 — persist the Managed deliverable.
--
-- ✅ ALREADY APPLIED to the live project (duiyifepitvugyulobqm) on 2026-07-13 as
-- migration `recommendations_persistence`. Kept here as the source-of-truth record.
-- Purely additive: two new tables, no existing table altered, no data touched.
-- Safe to re-run (create ... if not exists / drop policy if exists).
--
-- VERIFIED LIVE after applying, by impersonating a real viewer's JWT inside a DO block
-- that raised at the end (0 rows persisted — re-checked: both tables empty, trigger enabled):
--   pg_policies                                    → exactly 6 policies, all {authenticated},
--                                                    no qual:true, no UPDATE/DELETE on _runs  ✅
--   viewer SELECT own client's items               → visible                                  ✅
--   viewer SELECT another tenant's items / runs    → 0 rows                                   ✅
--   viewer UPDATE own item status → 'actioned'     → allowed, actioned_at auto-set            ✅
--   viewer rewrites title to "REWRITTEN BY CLIENT" → silently frozen back to the original     ✅
--   viewer moves own row to another tenant         → row does NOT move (trigger pins it)      ✅
--   ...same move with the trigger DISABLED         → BLOCKED by the UPDATE WITH CHECK         ✅
--                                                    (both layers hold independently)
--   viewer DELETE own item                         → 0 rows (admin-only)                      ✅
--
-- THE PROBLEM
--   generate-recommendations.js called Claude Haiku on demand, returned JSON to the
--   browser, and stored NOTHING. For a EUR 900/mo done-for-you tier whose entire
--   deliverable IS the advice, there was no record of what any client was ever told.
--   "Did they act on it, and did it move?" was structurally unanswerable. (BpR
--   published two buyer-question articles days after onboarding and we cannot prove
--   we caused it — CLIENT-HEALTH-BPR.md §5.3.)
--
-- THE SHAPE — two tables, deliberately
--   recommendation_runs  = the RECEIPT. One row per generation. Immutable.
--                          Carries input_snapshot: the exact engine_stats +
--                          top_competitors + snippets the model was actually fed, so
--                          any recommendation can always be re-explained later, even
--                          after the underlying ai_results have been force-refreshed
--                          and re-analysed. Without this the audit trail is worthless:
--                          the advice would survive but the evidence behind it would not.
--   recommendations      = the ITEMS. One row per recommendation. Mutable, but ONLY
--                          its workflow columns (status / actioned_at / notes).
--
-- TAMPER-RESISTANCE (the whole point)
--   RLS cannot restrict columns, so an UPDATE policy alone would let anyone with row
--   access rewrite title/insight/action — i.e. rewrite what they were told. A BEFORE
--   UPDATE trigger pins every content column to its OLD value. What was advised is
--   append-only. Only the response to it can change.
--
-- RLS
--   Written explicitly, never permissively. §6.4 step 7 of CLAUDE.md records a real
--   incident where leftover `qual: true` policies OR'd alongside the correct ones and
--   silently exposed every tenant's ai_results and prompts to every authenticated
--   user. Policies below are scoped to `authenticated` and gated on
--   is_admin() OR <client_id> = get_my_client_id(). Verify with pg_policies after
--   applying (query at the bottom of this file).
--
--   Netlify functions use the SERVICE KEY, which bypasses RLS — so the INSERT
--   policies below only govern the browser. They exist so an admin could seed a row
--   by hand; the normal write path is generate-recommendations.js.

-- ── 1. Tables ────────────────────────────────────────────────────────────────

create table if not exists public.recommendation_runs (
  id             bigserial   primary key,
  client_id      integer     not null references public.clients(id) on delete cascade,
  generated_at   timestamptz not null default now(),
  generated_by   uuid,                       -- auth.users.id of whoever clicked Generate
  model          text        not null,
  input_snapshot jsonb       not null,       -- engine_stats, top_competitors, snippets, prompts AS SENT
  rec_count      integer     not null default 0
);

comment on table  public.recommendation_runs is
  'One row per AI-recommendation generation. Immutable audit receipt. input_snapshot holds the exact data the model was fed so advice can be re-explained after ai_results are re-analysed.';
comment on column public.recommendation_runs.input_snapshot is
  'Verbatim payload sent to the model: engine_stats, top_competitors (with rankedMentions), mentioned/absent snippets, prompts, engines excluded for API errors.';

create table if not exists public.recommendations (
  id                bigserial   primary key,
  run_id            bigint      not null references public.recommendation_runs(id) on delete cascade,
  client_id         integer     not null references public.clients(id) on delete cascade,  -- denormalised for RLS + fast filter (CLAUDE.md §4.8)
  position          integer     not null default 0,
  title             text        not null,
  insight           text,
  action            text,
  engines           text[]      not null default '{}',
  priority          text        not null default 'medium'
                    check (priority in ('critical','high','medium')),
  status            text        not null default 'new'
                    check (status in ('new','acknowledged','actioned','dismissed')),
  status_changed_at timestamptz,
  actioned_at       timestamptz,
  notes             text,
  created_at        timestamptz not null default now()
);

comment on table public.recommendations is
  'One row per recommendation item. Content columns are immutable (enforced by trigger); only status / actioned_at / notes may change.';

create index if not exists idx_recommendation_runs_client
  on public.recommendation_runs (client_id, generated_at desc);
create index if not exists idx_recommendations_client
  on public.recommendations (client_id, created_at desc);
create index if not exists idx_recommendations_run
  on public.recommendations (run_id);
create index if not exists idx_recommendations_status
  on public.recommendations (client_id, status);

-- ── 2. Immutability trigger ──────────────────────────────────────────────────
-- Content is append-only. An UPDATE may only move the workflow columns.
-- Applies to service_role too (triggers are not bypassed by RLS bypass) — deliberate:
-- generate-recommendations.js only ever INSERTs, so nothing legitimate is blocked.

create or replace function public.recommendations_freeze_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.run_id     := old.run_id;
  new.client_id  := old.client_id;
  new.position   := old.position;
  new.title      := old.title;
  new.insight    := old.insight;
  new.action     := old.action;
  new.engines    := old.engines;
  new.priority   := old.priority;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    new.status_changed_at := now();
    if new.status = 'actioned' and new.actioned_at is null then
      new.actioned_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists recommendations_freeze_content_trg on public.recommendations;
create trigger recommendations_freeze_content_trg
  before update on public.recommendations
  for each row execute function public.recommendations_freeze_content();

-- The run receipt is fully immutable: no UPDATE, no DELETE, ever (except cascade
-- from clients). No trigger needed — simply no policy grants it.

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

alter table public.recommendation_runs enable row level security;
alter table public.recommendations     enable row level security;

drop policy if exists recommendation_runs_select on public.recommendation_runs;
drop policy if exists recommendation_runs_insert on public.recommendation_runs;
drop policy if exists recommendations_select     on public.recommendations;
drop policy if exists recommendations_insert     on public.recommendations;
drop policy if exists recommendations_update     on public.recommendations;
drop policy if exists recommendations_delete     on public.recommendations;

-- Runs: read your own, admins read all. Insert admin-only (normal path is service key).
-- No UPDATE and no DELETE policy → the receipt cannot be altered from the browser.
create policy recommendation_runs_select on public.recommendation_runs
  for select to authenticated
  using (is_admin() or client_id = get_my_client_id());

create policy recommendation_runs_insert on public.recommendation_runs
  for insert to authenticated
  with check (is_admin());

-- Items: read your own, admins read all.
create policy recommendations_select on public.recommendations
  for select to authenticated
  using (is_admin() or client_id = get_my_client_id());

create policy recommendations_insert on public.recommendations
  for insert to authenticated
  with check (is_admin());

-- UPDATE needs BOTH clauses. USING alone would let a viewer reassign client_id on a
-- row they legitimately own — i.e. move it into another tenant. (Same lesson as
-- supabase-prompts-own-client-writes-migration.sql. The freeze trigger also pins
-- client_id, so this is belt-and-braces — keep both.)
create policy recommendations_update on public.recommendations
  for update to authenticated
  using      (is_admin() or client_id = get_my_client_id())
  with check (is_admin() or client_id = get_my_client_id());

-- Deleting advice would defeat the audit trail. Admin only.
create policy recommendations_delete on public.recommendations
  for delete to authenticated
  using (is_admin());

-- ── 4. Verify after applying ─────────────────────────────────────────────────
--
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where tablename in ('recommendations','recommendation_runs')
--   order by tablename, cmd;
--
-- EXPECT exactly 6 policies, all roles = {authenticated}, NO policy with qual = true.
-- EXPECT no UPDATE or DELETE policy on recommendation_runs.
--
-- Tenant-isolation check (impersonate a real viewer's JWT inside a DO block that
-- raises at the end, so nothing persists — the method used in SECURITY-AUDIT.md):
--   - viewer SELECT own client's recommendations        → rows returned
--   - viewer SELECT another client's recommendations    → 0 rows
--   - viewer UPDATE own item's status                   → allowed
--   - viewer UPDATE own item's title                    → silently ignored (frozen)
--   - viewer UPDATE own item's client_id → other tenant → blocked
