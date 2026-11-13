# Multi-location collection: one location per prompt

## 1. Status

2026-11-13. Approach RULED by the owner ("One country per prompt"); not reopened. **Pre-build review DONE**: bg-verify, verdict BLOCK, report `docs/qa/multi-location-prebuild-review-2026-11-13.md` (must fix M1 and M2, should fix S1 to S11). **Spec AMENDED the same day** (amendment log in section 16): M1 and M2 closed, the bundler flaw closed by a plain JavaScript market mirror, S1 to S8 and S11 applied, S9 and S10 recorded. Live database facts read by the orchestrator on 2026-11-13 are folded into sections 4.2, 6.7 and 15. **Builders may start** in the order of section 12. Nothing built, nothing applied, nothing committed. Author: bg-architect.

The seven owner questions of section 14 are unanswered on 2026-11-13; the build uses each recommended default, each kept as one constant or one branch.

Supersedes the draft "approach A" text handed to this run. Every fatal and serious reviewer finding is either closed below or listed as open in section 14 or 15 with the reason.

## 2. The request and the measured current state

The owner, verbatim (spoken): "I have a client potential client that is interested in multiple countries, so I can't select the multiple countries, unfortunately, because I can select only one market. And then multiple regions. So I need both of those selectors to be [multi] ... if I put market worldwide, but then locations I want to put four countries, I don't have that option. So I need to build it. We need to build it now."

Measured current state (read 2026-11-13 unless marked "from the map", which means taken from the read-only agent maps handed to this run and not re-read here):

| Fact | Evidence |
|---|---|
| The sidebar keeps a list of `{market, region}` per client, but only in that browser's localStorage | `src/lib/marketContext.tsx:61, 123-129` (from the map) |
| Manual runs collect only the first selection | `netlify/functions/enqueue-collection.js:75-81` keeps `markets[0]` (read) |
| Single cell refresh sends only `markets?.[0]` | `src/lib/collectionContext.tsx:361-364` (from the map) |
| Scheduled runs use `clients.default_market_id` at country level, `region_label = null`, and `default_region_id` is selected but ignored | `netlify/functions/_enqueue.js:107, 145-155` (read) |
| Labels for manual runs come from the browser unvalidated; scheduled labels come from `COUNTRY_NAMES` | `enqueue-collection.js:78-80`, `collect-prompt.js:152`, `collect-claude.js:134`, `collect-chatgpt.js:134`, `_enqueue.js:57-71` (read) |
| `ai_results` stores no location; the results RPC partitions on `(prompt_id, llm)` and returns no location column | `db/supabase-client-results-latest-rpc-2026-11-08.sql:74-93, 109-110, 121-122` (read) |
| Onboarding takes one default market and one default region | `src/pages/Onboard.tsx:29-30, 150-151` (from the map; the file carries another session's uncommitted edits) |
| `buildSystemContext(cfg, marketLabel, regionLabel)` builds "You are a user based in X", with a website TLD fallback when no market label | `netlify/functions/_collect.js:39-69` (read) |

So today a second sidebar market changes nothing that is collected, and no stored answer says where it was asked from.

## 3. The decision

**Ruling (owner, 2026-11-13): one country per prompt.** Each prompt belongs to exactly one location. A location is one `(market_id, region_id)` pair from `src/lib/markets.ts`, region `ALL` meaning the whole market. "The same question in four countries" is four prompt rows created in one action. Cost per prompt is unchanged, and the plan's prompt cap stays the spend bound.

What it means in practice:

1. A client gets a server-side list of locations in a new table `public.client_locations`. Exactly one live row is the **primary**. `clients.default_market_id` and `clients.default_region_id` stay as a mirror of the primary, so every existing reader and the do-not-touch writers keep working.
2. Every prompt carries a `location_id` that is **set once and never changes**. A prompt inserted without one (old bundle, Explee import, self signup, Stripe provisioning) gets the client's primary at insert time, filled by a database trigger. Changing which location is primary moves a flag; it never re-geos an existing prompt. This closes the "mutable pointer" fatal finding: one `prompt_id` can never hold answers asked from two places after this ships.
3. Every collection path asks each prompt from its own location, resolved on the server from ids. Browser labels are ignored.
4. Every `(prompt, engine)` mechanism stays correct with no location key, because a location is a prompt: month skip (`_enqueue.js:203-216`), 30 day SerpApi cap (`_enqueue.js:165-176`), force delete (`_enqueue.js:183-197`), the worker's `onConflict 'run_id,prompt_id,llm'` with `ignoreDuplicates` (`collection-worker-background.js:96-98`), and the RPC partition.
5. The sidebar block stops steering collection. It becomes the list of locations and the dashboard's view filter.

**Declined alternative (offered, refused, not to be reopened):** every prompt runs in every selected location. Cost and SerpApi credits multiply by the number of locations against fixed per-client budgets, and every `(prompt, engine)` key above would need a location key added: the unique index, the month skip, the SerpApi cap, the force delete and the RPC partition. With the per-prompt monthly figures in section 9, a Growth PRO client at its 56 prompt cap in four countries would cost about 4 x EUR 31.68 = EUR 126.70 a month at the fallback constants against a EUR 67.35 budget (`_cost.js:545`), so collection would block mid-month.

## 4. Data model and migration

File: `db/supabase-client-locations-2026-11-13.sql`. Additive, idempotent, one transaction. Applied by the owner in the SQL Editor and read back BEFORE the dashboard push.

### 4.1 Objects

- `public.client_locations`: one row per location of a client, including the primary.
- `prompts.location_id bigint NOT NULL`, composite FK `(location_id, client_id)` to `client_locations (id, client_id)`, ON DELETE NO ACTION.
- `collection_jobs.location_id`, `collection_jobs.region_id` (nullable).
- `ai_results.location_id`, `ai_results.asked_market_id`, `ai_results.asked_region_id` (nullable, no FK, the stamp of where the answer was asked). Null means asked before this change.
- Functions, all SECURITY DEFINER with `search_path = ''`: `ensure_primary_client_location`, `add_client_locations`, `archive_client_location`, `set_primary_client_location` (EXECUTE for `service_role` only), and trigger function `enforce_prompt_location`.
- Trigger `trg_prompt_location` on `prompts`, BEFORE INSERT OR UPDATE OF `location_id, is_active, client_id`.

Why the primary is a row (reviewer 2 graft): a nullable "null means current primary" made a prompt's geography change whenever the primary changed, while the RPC and history reads key on `prompt_id` only. A concrete row per prompt makes every answer under one `prompt_id` come from one place.

Why the trigger and RPCs are SECURITY DEFINER (reviewer 1 graft): an INVOKER `exists(...)` check fails open when the caller cannot see the row. The definer check matches by `(id, client_id)` and fails closed.

Read policy predicate: `is_admin() OR has_client_access(client_id)`, the same family as the live `prompts` policies. Live read 2026-11-13: `public.is_admin()`, `public.has_client_access(cid integer)` and `public.my_client_id()` exist, all SECURITY DEFINER; the live `prompts` policies are `prompts_client_read` (SELECT, authenticated, `is_admin() OR has_client_access(client_id)`), `prompts_select` (SELECT, role public, `my_role() = 'admin' OR has_client_access(client_id)`), `prompts_insert` (INSERT, authenticated, WITH CHECK `is_admin() OR has_client_access(client_id)`), `prompts_update` (UPDATE, authenticated, same predicate in USING and WITH CHECK) and `prompts_delete` (DELETE, authenticated, `is_admin()`). `has_client_access` still has no definition in `db/`; its body was not read.

### 4.2 Pre-apply checks (read only, run first)

```sql
-- P1: helper functions exist
select proname from pg_proc where pronamespace = 'public'::regnamespace
  and proname in ('is_admin','has_client_access');                 -- EXPECT 2 rows
-- P2: every default_market_id fits the location shape (null is fine, it becomes WW)
select id, default_market_id from public.clients
  where default_market_id is not null and default_market_id !~ '^[A-Z]{2}$';   -- EXPECT 0 rows
select id, default_region_id from public.clients
  where default_region_id is not null and char_length(default_region_id) not between 1 and 40; -- EXPECT 0
-- P3: behaviour-change census (section 6.7), keep the output
select default_market_id, default_region_id, count(*) from public.clients
  group by 1, 2 order by 3 desc;
-- P4: prompts table size, to judge the NOT NULL scan
select count(*) from public.prompts;
```

Results of the orchestrator's live read, 2026-11-13 (production, read only). The owner re-runs P1 to P4 immediately before applying; a different answer stops the apply.

| Check | Live answer |
|---|---|
| Version | PostgreSQL 17.6, so `hashtextextended` exists |
| P1 | `is_admin`, `has_client_access`, `my_client_id` exist, all SECURITY DEFINER; a policy also calls `my_role()` |
| P2 | 0 clients with a `default_market_id` failing `^[A-Z]{2}$`; 0 with a `default_region_id` outside 1 to 40 characters; `default_region_id` is NULL on 6 clients, all `WW` |
| P3 | see the census in section 6.7 |
| P4 | 545 prompts, 474 active; 68 clients, 66 with prompts; 0 prompts with a null `client_id` or a `client_id` without a client row |
| Triggers | `public.prompts` has exactly one user trigger, `trg_enforce_prompt_cap` BEFORE INSERT OR UPDATE FOR EACH ROW; no user trigger on `clients`, `ai_results` or `collection_jobs` |
| Grants on `prompts` | `authenticated`: table SELECT and DELETE, column INSERT on `(category, client_id, is_active, position, text)`, column UPDATE on `(category, is_active, position, text)`. `anon` also holds table SELECT and DELETE (pre-existing; RLS still applies; not changed here) |
| Existing objects | `public.plan_prompt_caps` exists; `public.client_locations` and `prompts.location_id` do not |
| 2026-11-09 migrations | both applied; their file headers saying otherwise are stale |

So the backfill touches 66 clients (66 primary rows) and one UPDATE over 545 prompt rows; the NOT NULL scan is trivial.

### 4.3 Migration SQL

```sql
begin;

-- 1. Table
create table if not exists public.client_locations (
  id          bigint generated always as identity primary key,
  client_id   integer not null references public.clients(id) on delete cascade,
  market_id   text    not null check (market_id ~ '^[A-Z]{2}$'),
  region_id   text    not null default 'ALL' check (char_length(region_id) between 1 and 40),
  is_primary  boolean not null default false,
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  constraint client_locations_id_client_uq unique (id, client_id),
  constraint client_locations_primary_live check (not (is_primary and archived_at is not null))
);
create unique index if not exists uq_client_locations_live
  on public.client_locations (client_id, market_id, region_id) where archived_at is null;
create unique index if not exists uq_client_locations_primary
  on public.client_locations (client_id) where is_primary and archived_at is null;
create index if not exists idx_client_locations_client on public.client_locations (client_id);

alter table public.client_locations enable row level security;
revoke all on public.client_locations from anon, authenticated;
grant select on public.client_locations to authenticated;
grant select on public.client_locations to service_role;  -- explicit, not left to default privileges (S4)
drop policy if exists client_locations_read on public.client_locations;
create policy client_locations_read on public.client_locations
  for select to authenticated
  using (public.is_admin() or public.has_client_access(client_id));
-- No insert, update or delete policy. Only SECURITY DEFINER functions and the service role write.

-- 2. Primary resolver (creates the primary from the clients defaults when absent)
create or replace function public.ensure_primary_client_location(p_client_id integer)
returns bigint language plpgsql security definer set search_path = '' as $f$
declare v_id bigint; v_m text; v_r text;
begin
  select id into v_id from public.client_locations
   where client_id = p_client_id and is_primary and archived_at is null;
  if v_id is not null then return v_id; end if;
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  select id into v_id from public.client_locations
   where client_id = p_client_id and is_primary and archived_at is null;
  if v_id is not null then return v_id; end if;
  select coalesce(default_market_id, 'WW'), coalesce(nullif(default_region_id, ''), 'ALL')
    into v_m, v_r from public.clients where id = p_client_id;
  if not found then
    raise exception 'client_not_found: %', p_client_id using errcode = 'foreign_key_violation';
  end if;
  update public.client_locations set is_primary = true
   where client_id = p_client_id and market_id = v_m and region_id = v_r and archived_at is null
   returning id into v_id;
  if v_id is null then
    insert into public.client_locations (client_id, market_id, region_id, is_primary, position)
    values (p_client_id, v_m, v_r, true, 0) returning id into v_id;
  end if;
  return v_id;
end $f$;

-- 3. prompts.location_id, backfill, NOT NULL, FK
alter table public.prompts add column if not exists location_id bigint;

select public.ensure_primary_client_location(c.id)
  from public.clients c
 where exists (select 1 from public.prompts p where p.client_id = c.id);

update public.prompts p
   set location_id = l.id
  from public.client_locations l
 where p.location_id is null
   and l.client_id = p.client_id and l.is_primary and l.archived_at is null;

alter table public.prompts alter column location_id set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'prompts_location_fk') then
    alter table public.prompts add constraint prompts_location_fk
      foreign key (location_id, client_id) references public.client_locations (id, client_id)
      on delete no action;
  end if;
end $$;
create index if not exists idx_prompts_location on public.prompts (location_id);
grant insert (location_id) on public.prompts to authenticated;   -- no update grant, on purpose

-- 4. Prompt trigger: default, immutability, live check (created AFTER the backfill)
create or replace function public.enforce_prompt_location()
returns trigger language plpgsql security definer set search_path = '' as $f$
declare v_archived timestamptz; v_client integer;
begin
  if tg_op = 'UPDATE' and old.location_id is not null
     and new.location_id is distinct from old.location_id then
    raise exception 'location_immutable: a prompt keeps its location; archive it and add a new one'
      using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' and new.location_id is null then
    new.location_id := public.ensure_primary_client_location(new.client_id);
  end if;
  if coalesce(new.is_active, true) is not true then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_active, true) is true
     and old.client_id is not distinct from new.client_id then
    return new;
  end if;
  select archived_at, client_id into v_archived, v_client
    from public.client_locations where id = new.location_id for share;
  if not found or v_client is distinct from new.client_id then
    raise exception 'location_invalid: location % does not belong to this client', new.location_id
      using errcode = 'foreign_key_violation';
  end if;
  if v_archived is not null then
    raise exception 'location_archived: this location is archived' using errcode = 'check_violation';
  end if;
  return new;
end $f$;
drop trigger if exists trg_prompt_location on public.prompts;
create trigger trg_prompt_location
  before insert or update of location_id, is_active, client_id on public.prompts
  for each row execute function public.enforce_prompt_location();

-- 5. Add (atomic limit), archive (race safe), set primary (flag move plus mirror)
create or replace function public.add_client_locations(
  p_client_id integer, p_pairs jsonb, p_limit integer, p_created_by uuid)
returns setof public.client_locations language plpgsql security definer set search_path = '' as $f$
declare v_used integer; v_new integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  perform public.ensure_primary_client_location(p_client_id);
  select count(*) into v_used from public.client_locations
   where client_id = p_client_id and archived_at is null;
  v_new := jsonb_array_length(p_pairs);
  if p_limit is not null and v_used + v_new > p_limit then
    raise exception 'location_limit_reached: % used, % requested, limit %', v_used, v_new, p_limit
      using errcode = 'check_violation';
  end if;
  return query
    insert into public.client_locations (client_id, market_id, region_id, position, created_by)
    select p_client_id, e ->> 'market_id', coalesce(e ->> 'region_id', 'ALL'), v_used + t.ord::int, p_created_by
      from jsonb_array_elements(p_pairs) with ordinality as t(e, ord)
    returning *;
end $f$;

create or replace function public.archive_client_location(p_client_id integer, p_location_id bigint)
returns text language plpgsql security definer set search_path = '' as $f$
declare v_row public.client_locations%rowtype;
begin
  select * into v_row from public.client_locations
   where id = p_location_id and client_id = p_client_id for update;
  if not found then return 'not_found'; end if;
  if v_row.archived_at is not null then return 'already_archived'; end if;
  if v_row.is_primary then return 'location_is_primary'; end if;
  -- New statement, new snapshot: sees any prompt committed while we waited for the row lock.
  if exists (select 1 from public.prompts where location_id = p_location_id and is_active) then
    return 'location_in_use';
  end if;
  update public.client_locations set archived_at = now() where id = p_location_id;
  return 'archived';
end $f$;

create or replace function public.set_primary_client_location(p_client_id integer, p_location_id bigint)
returns text language plpgsql security definer set search_path = '' as $f$
declare v_row public.client_locations%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('client_locations:' || p_client_id::text, 0));
  perform public.ensure_primary_client_location(p_client_id);
  select * into v_row from public.client_locations
   where id = p_location_id and client_id = p_client_id and archived_at is null for update;
  if not found then return 'not_found'; end if;
  if v_row.is_primary then return 'already_primary'; end if;
  update public.client_locations set is_primary = false
   where client_id = p_client_id and is_primary and archived_at is null;
  update public.client_locations set is_primary = true where id = p_location_id;
  update public.clients set default_market_id = v_row.market_id, default_region_id = v_row.region_id
   where id = p_client_id;
  return 'primary_set';
end $f$;

revoke all on function public.ensure_primary_client_location(integer) from public, anon, authenticated;
revoke all on function public.add_client_locations(integer, jsonb, integer, uuid) from public, anon, authenticated;
revoke all on function public.archive_client_location(integer, bigint) from public, anon, authenticated;
revoke all on function public.set_primary_client_location(integer, bigint) from public, anon, authenticated;
revoke all on function public.enforce_prompt_location() from public, anon, authenticated;
grant execute on function public.ensure_primary_client_location(integer) to service_role;
grant execute on function public.add_client_locations(integer, jsonb, integer, uuid) to service_role;
grant execute on function public.archive_client_location(integer, bigint) to service_role;
grant execute on function public.set_primary_client_location(integer, bigint) to service_role;

-- 6. Stamps and job columns (nullable, no default: metadata only, no rewrite)
alter table public.collection_jobs add column if not exists location_id bigint;
alter table public.collection_jobs add column if not exists region_id   text;
alter table public.ai_results      add column if not exists location_id     bigint;
alter table public.ai_results      add column if not exists asked_market_id text;
alter table public.ai_results      add column if not exists asked_region_id text;

commit;
```

Notes on correctness, each to be probed by bg-verify:

- Trigger order. PostgreSQL fires BEFORE row triggers by name; `trg_enforce_prompt_cap` (`db/supabase-prompt-cap-migration.sql:155-157`, the only existing user trigger on `prompts`, live read 2026-11-13) runs before `trg_prompt_location`. Neither depends on the other. The cap trigger is unchanged.
- Re-activation bypass (reviewer 1 fatal) closed: `is_active` is updatable by a viewer (`db/supabase-prompts-delete-admin-only-2026-11-09.sql:108`), and the trigger now fires on that update and refuses an archived location.
- Archive race closed in both orders: an insert holds FOR SHARE on the location row until commit, so archive's FOR UPDATE waits and its next statement sees the prompt; an archive that locks first makes the insert's FOR SHARE wait, after which it reads `archived_at`.
- Delete account: `delete-client.js:96` deletes prompts before `:102` deletes the client (read), so the cascade to `client_locations` meets no referencing prompt. NO ACTION is used instead of RESTRICT anyway, so the check runs at statement end.
- `ensure_primary_client_location` inside the prompts trigger means Stripe (`stripe-webhook.js:1110`) and self signup (`provision-account.js:190`), which write only `default_market_id 'WW'`, need no change: the primary appears on the client's first prompt insert or first `list` call.
- A client with `default_market_id` null would get a WW primary (the live read found none). The 6 live clients with `WW` and a NULL `default_region_id` get `WW / ALL`.
- Multi-row insert against the cap: the claim that a K row insert with fewer than K free slots fails as one statement rests on PostgreSQL visibility rules for a VOLATILE trigger function; it was NOT in the 2026-11-09 proof. bg-verify probes it.
- Recorded, not fixed (S9, INFO): a viewer insert carrying another client's `client_id` runs `ensure_primary_client_location` for that client inside the BEFORE trigger before RLS rejects the row. Everything rolls back, but the error text differs (`client_not_found` versus an RLS refusal), so a viewer can learn whether a client id exists. Client ids are small serial integers and leak nothing else; a later fix is to check `has_client_access` at the top of the trigger for non-service callers.
- Recorded, no fix needed (S10, INFO): for a client with no committed primary, `set_primary_client_location` (advisory lock, then row locks) and a multi-row prompt insert (row locks through the trigger, then the advisory lock inside `ensure_primary_client_location`) can deadlock. PostgreSQL aborts one side; the caller retries. After the backfill every client with prompts has a primary, so the window is a new client's first moments only.

### 4.4 Read-back set (run after commit)

```sql
select column_name, data_type, is_nullable from information_schema.columns
 where table_schema = 'public' and table_name in ('client_locations','prompts','collection_jobs','ai_results')
   and column_name in ('location_id','region_id','asked_market_id','asked_region_id','is_primary','market_id','archived_at')
 order by table_name, column_name;                              -- prompts.location_id NOT NULL
select count(*) from public.prompts where location_id is null;   -- EXPECT 0
select count(*) from public.clients c
 where exists (select 1 from public.prompts p where p.client_id = c.id)
   and not exists (select 1 from public.client_locations l where l.client_id = c.id and l.is_primary and l.archived_at is null); -- EXPECT 0
select count(*) from public.prompts p join public.client_locations l on l.id = p.location_id
 where l.client_id <> p.client_id;                               -- EXPECT 0
select policyname, cmd, qual from pg_policies where tablename = 'client_locations';   -- EXPECT 1 row, SELECT
select privilege_type, column_name from information_schema.column_privileges
 where table_name = 'prompts' and grantee = 'authenticated' order by 1, 2;
   -- INSERT: category, client_id, is_active, location_id, position, text; UPDATE: category, is_active, position, text
select tgname from pg_trigger where tgrelid = 'public.prompts'::regclass and not tgisinternal; -- includes both triggers
select proname, prosecdef, proconfig from pg_proc
 where proname in ('ensure_primary_client_location','add_client_locations','archive_client_location',
                   'set_primary_client_location','enforce_prompt_location');      -- all prosecdef true
select routine_name, grantee from information_schema.routine_privileges
 where routine_name like '%client_location%';                    -- service_role only
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'client_locations' order by 1, 2;
   -- authenticated SELECT; service_role SELECT (plus whatever default privileges add); no anon row
```

Rolled-back probe block (bg-verify writes it in the style of the 2026-11-09 proof, as a real viewer and a real admin): viewer insert into an archived location (refused, `location_archived`); viewer re-activation of a prompt whose location is archived (refused); viewer insert with another client's `location_id` (refused, 23503 or `location_invalid`); viewer insert with no `location_id` (gets the primary); 4 row insert with 2 free cap slots (whole statement refused); viewer UPDATE of `location_id` (refused by grant); archive with an active prompt (`location_in_use`); set primary then confirm no prompt's `location_id` changed.

### 4.5 Order and what happens if it is wrong

The migration MUST be applied and read back before the push. If the dashboard deploy lands first (corrected 2026-11-13, final review, per server review I1 in `docs/qa/multi-location-review-server-2026-11-13.md` and regression review R10 in `docs/qa/multi-location-review-regression-2026-11-13.md`):

- The three collectors select `location_id` in `loadPromptForCollect` (`collect-prompt.js:97` and its copies), so a manual or single cell run answers 500 "Prompt lookup failed" BEFORE any engine call; nothing is billed on that path.
- `_enqueue.js:110-117` ignores the prompts read error and answers "no active prompts", and `schedule-collections.js:198` then stamps `last_refresh_at`, so every due scheduled client silently loses its cycle.
- The money loss is in the worker: jobs pending from before the deploy hit an upsert with unknown columns, throw, and are retried up to `MAX_ATTEMPTS` 3 (`collection-worker-background.js:35, 124-138`), each attempt billing the engines with nothing saved.
- Every client, not only multi-location ones, depends on the migration: the Mentions and Brand Sentiment feeds always request `asked_market_id, asked_region_id` (`Mentions.tsx:30`, `BrandSentiment.tsx:54`) and fail; every MCP prompt and fix tool reads `client_locations` and throws on a read error (`mcp-server.js:439-445`); provisioning (the wizard and the Explee import) reads `plan_prompt_caps` before any write and refuses on a read error (`_provision_client.js:232-277`).
- `client-locations.js` answers 500; a browser prompt insert with `location_id` fails.

Recovery is to apply the migration at once; nothing is corrupted, but missed scheduled cycles are not re-run by themselves and worker retries spend money on unsaved answers in the meantime. The order rule stands: migration first, read back, then push.

If the migration sits applied under the old bundle: safe. The old bundle never sends `location_id`; the trigger fills the primary; old collectors never write the new columns; the old sidebar keeps steering manual runs (old behaviour) until the push.

### 4.6 Rollback (after the code is reverted)

```sql
begin;
drop trigger if exists trg_prompt_location on public.prompts;
drop function if exists public.enforce_prompt_location();
drop function if exists public.set_primary_client_location(integer, bigint);
drop function if exists public.archive_client_location(integer, bigint);
drop function if exists public.add_client_locations(integer, jsonb, integer, uuid);
revoke insert (location_id) on public.prompts from authenticated;
alter table public.prompts drop constraint if exists prompts_location_fk;
alter table public.prompts drop column if exists location_id;
drop function if exists public.ensure_primary_client_location(integer);
alter table public.ai_results drop column if exists location_id, drop column if exists asked_market_id, drop column if exists asked_region_id;
alter table public.collection_jobs drop column if exists location_id, drop column if exists region_id;
drop table if exists public.client_locations;
commit;
```

Loses: every stamp, and the location of every non-primary prompt (those prompts silently become primary prompts). Archive non-primary prompts first if their answers must not be read as primary.

## 5. Server behaviour

### 5.1 New `netlify/functions/_country_names.js`
Pure module, exports `COUNTRY_NAMES`, moved verbatim from `_enqueue.js:57-71`. `_enqueue.js` re-exports it, so `explee-import-background.js:37` and `tests/markets_data.test.js` keep working. This breaks the require cycle reviewer 3 found (`_locations.js` must not require `_enqueue.js`). The two tests that stub `COUNTRY_NAMES` as `{}` (`enqueue_force_gate.test.js:77`, `phase2_schedule_worker_trigger.test.js:96`, from the map) must stub the new module instead.

### 5.2 New `netlify/functions/_locations.js` (pure apart from Supabase reads passed in)
`_locations.js` requires only plain JavaScript: `./_country_names` and the new `./_market_regions`. **Bundler rule (M1, binding on every packet):** no file under `netlify/functions` that is reachable from a function without `node_bundler = "esbuild"` may require a `.ts` file, directly or through a helper. `mcp-server.js:53-60` and `explee-import-background.js:142` may require `.ts` only because `netlify.toml` gives them esbuild (`netlify.toml:279-280`, `:424-426`); the default bundler ships a `.ts` file as it is, and on 2026-11-11 such a function made no database call at all in production (`tests/ts_require_bundler.test.js:8-11`). `_locations.js` is reached from `_enqueue.js` (so `enqueue-collection`, `schedule-collections`), from the three collectors, from `collection-worker-background` and from `_provision_client.js` (so `onboard-client`), none of which is esbuild, so it must stay `.ts` free. `netlify.toml` is in no packet's write scope and no function gains a bundler entry.

New `netlify/functions/_market_regions.js`: data only, CommonJS, no `require`. `module.exports = { MARKET_REGIONS }`, where `MARKET_REGIONS` is an array of `{ id, label, regions: [{ id, label }] }` in the exact order of `MARKETS` in `src/lib/markets.ts` (61 markets, 253 regions on 2026-11-11), and nothing else (no flag, flagCode or aliases). `validatePair` and `resolveLocation` read `MARKET_REGIONS`, never `MARKETS`. `src/lib/markets.ts` is not edited. `tests/market_regions_mirror.test.js` (row 1) loads `markets.ts` through `tests/helpers/ts_require.js` (as `tests/markets_data.test.js:11-14` does) and asserts
`assert.deepStrictEqual(MARKET_REGIONS, MARKETS.map(m => ({ id: m.id, label: m.label, regions: m.regions.map(r => ({ id: r.id, label: r.label })) })))`.
Because `markets.ts` is append only, a market added later fails this test until the mirror gains it; the same holds for `COUNTRY_NAMES` today. Writing the mirror is mechanical (copy the ids and labels).

```ts
type LocationRow = { id: number; client_id: number; market_id: string; region_id: string;
                     is_primary: boolean; position: number; archived_at: string | null }
type ResolvedLocation = { location_id: number; market_id: string; region_id: string;
                          market_label: string | null; region_label: string | null }
export const PLAN_LOCATION_LIMIT: Record<string, number>   // values: section 10 defaults; owner question 1 unanswered, this object is the one place to change them server side
export function locationLimitFor(plan: string | null): number      // unknown plan -> 1, never unlimited
export function validatePair(marketId: unknown, regionId: unknown):
  { ok: true; market_id: string; region_id: string } | { ok: false; error: 'invalid_location' }
export function resolveLocation(row: LocationRow): ResolvedLocation
```

`resolveLocation` rules: `market_label` is `COUNTRY_NAMES[market_id]`; for `WW` it is `'Worldwide'`. `region_label` is the region's label from `MARKET_REGIONS`, or null when `region_id` is `ALL`. A region id not found in `MARKET_REGIONS` resolves to null (country level) and logs a warning; it never fails a run. `validatePair` requires the market in `MARKET_REGIONS` and the region in that market's `regions`.

Unknown stored region ids (S6). The research workspaces carry region ids that are not in `markets.ts`, for example `AUS`, `SJC`, `JAX`, `CMH`, `IND`, `BNA`, `LAS`, `PDX`, `MCO`, `SMF` (`db/supabase-research-cities-batch2-2026-11-06.sql:19-55`; the July workspaces were not read). The backfill copies them into `client_locations` as they are (`US / AUS`), because the table checks only the length. `resolveLocation` then gives country level, which is what those clients get today (`marketContext.tsx:92` resolves an unknown region to none). `validatePair` refuses to add such a pair again (`invalid_location`), and `locationLabel` on the dashboard renders it without throwing (section 7.1). All of these clients are on manual cadence.

`locationLimitFor(plan)` takes the plan only from the `clients` row the caller read with the service key, never from a request body (S3).

### 5.3 New endpoint `netlify/functions/client-locations.js`
POST, `requireAuth(event, { clientId })` with `client_id` parsed first (the Phase 1 pattern), then the service key. **Every location id is used only together with the authorised `client_id`** (all four RPCs take `p_client_id` and match `(id, client_id)`), which closes the IDOR reviewer 1 found. The plan for `limit` comes from one service-key read of `clients.plan` for that `client_id`, never from the body (S3). Logs as `[ClientLocations/invId]`. Viewer permission to add and archive (owner question 3, default yes) is one branch: `const VIEWER_MAY_EDIT_LOCATIONS = true` at the top of the file.

The compact contract a frontend builder codes against:

```text
POST /.netlify/functions/client-locations
Headers: Authorization: Bearer <supabase access token>; Content-Type: application/json
Body is one JSON object; client_id is a positive integer the caller may access.

list        {action:'list', client_id}
  200       {locations: ClientLocation[], limit, used}
add         {action:'add', client_id, market_id, region_ids: string[1..25]}
            region_ids ['ALL'] means the whole market; 'ALL' with other ids is invalid_location;
            duplicate ids in the array are invalid_request
  200       {added: ClientLocation[], limit, used}
archive     {action:'archive', client_id, location_id}
  200       {archived: true, location_id}
set_primary {action:'set_primary', client_id, location_id}            admin only
  200       {primary_id}                                                 (already primary also answers 200)

ClientLocation = {id: number, market_id: string, region_id: string, is_primary: boolean,
                  position: number, archived_at: null, active_prompts: number}
  list returns live rows only (archived_at null), primary first, then position, then id;
  exactly one row has is_primary true. limit = locationLimitFor(clients.plan);
  used = number of live rows including the primary. No label field: the client renders
  labels with locationLabel from src/lib/locations.ts.

Errors from this function: {error: string, code: ErrCode} with the HTTP status of the table below.
Errors from requireAuth (401 missing or bad token, 403 origin, profile, client mismatch):
  {error: string} with no code field.
```

```ts
type Req =
  | { action: 'list';        client_id: number }
  | { action: 'add';         client_id: number; market_id: string; region_ids: string[] }   // 1..25 ids
  | { action: 'archive';     client_id: number; location_id: number }
  | { action: 'set_primary'; client_id: number; location_id: number }                        // admin only

type ClientLocation = { id: number; market_id: string; region_id: string; is_primary: boolean;
                        position: number; archived_at: string | null; active_prompts: number }
type ListRes   = { locations: ClientLocation[]; limit: number; used: number }  // used = live rows incl. primary
type AddRes    = { added: ClientLocation[]; limit: number; used: number }
type ArchiveRes = { archived: true; location_id: number }
type PrimaryRes = { primary_id: number }
type ErrRes    = { error: string; code: ErrCode }
```

| Code | HTTP | When |
|---|---|---|
| `invalid_request` | 400 | bad action, non-integer id, `region_ids` not an array of 1 to 25 strings |
| `invalid_location` | 400 | market not in `MARKETS`, region not in that market, or `ALL` mixed with specific regions |
| `location_limit_reached` | 403 | RPC raised it (viewer only; admin passes `p_limit = null`, recorded) |
| `location_exists` | 409 | unique violation 23505 |
| `location_in_use` | 409 | archive of a row with an active prompt |
| `location_is_primary` | 409 | archive of the primary |
| `not_found` | 404 | location not of this client |
| `forbidden` | 403 | `set_primary` by a viewer; `add` or `archive` by a viewer while `VIEWER_MAY_EDIT_LOCATIONS` is false |
| `server_error` | 500 | anything else; fixed message, real error logged |

`list` calls `ensure_primary_client_location` first, so a client provisioned by Stripe or self signup always shows a primary. `active_prompts` is one grouped count over `prompts` for the client. `add` by an admin passes `p_limit = null` (admin may exceed, like the cap trigger's admin bypass at `supabase-prompt-cap-bypass-fix-2026-11-09.sql:77-80`) and writes one `client_events` row naming the override. `set_primary` writes one `client_events` row with the old and new pair (the pattern CLAUDE.md attributes to `set-client-plan.js:166`, not re-read). Viewers may `list`, `add`, `archive` (owner question 3). Netlify timeout: default 10 s is enough (two to three queries); no `netlify.toml` entry needed.

### 5.4 `onboard-client.js` and `_provision_client.js` (admin only, gate at `onboard-client.js:72` unchanged)
Request, additive:

```ts
{ ...existing,
  default_market_id: string, default_region_id: string,             // the primary, as today
  locations?: { market_id: string; region_ids: string[] }[],        // extra locations
  prompts: string[] | { text: string; location_keys: string[] }[],  // 'primary' or 'MARKET:REGION'
  allow_over_cap?: boolean }
```
Response adds `locations_created: number`.

**Validation, all of it BEFORE the clients insert** (so nothing is refused after the invite mail at `_provision_client.js:226` has gone out):
1. Every pair, the primary included, through `validatePair` (closes the gap at `_provision_client.js:183-184` where nothing checked the region belongs to the market). Refusal: 400 `invalid_location`.
2. **Deduplicate (S7):** expand `locations` into `(market_id, region_id)` pairs, drop every pair equal to the primary, drop repeats, keep first-seen order. A duplicate would otherwise raise 23505 inside `add_client_locations` after the invite. `ALL` mixed with specific regions of the same market: 400 `invalid_location`.
3. Every `location_keys` entry must be `'primary'` or a `'MARKET:REGION'` key present in the deduplicated set or equal to the primary (the primary's own key maps to `'primary'`). Unknown key: 400 `invalid_location`.
4. **Server cap check (reviewer 1 and 3 fatal, S8):** the number of prompt rows to insert (a string prompt is one row, an object prompt is one row per distinct key) against the cap read from `plan_prompt_caps` for the plan, else the `free` row, else a hard fallback of **5**, matching the trigger (`supabase-prompt-cap-bypass-fix-2026-11-09.sql:92-94`). Over the cap answers 400 `prompt_cap_exceeded` unless `allow_over_cap === true`, which is recorded in the `client_events` meta. Explee generates the free count (`_explee_rules.js:19` mirrors `PLAN_PROMPTS.free`), so it stays inside; not run, bg-verify confirms.

**Order inside `_provision_client.js` after validation:** clients insert (key set unchanged, so `tests/provision_client.test.js:215` holds), invite, user profile; then **only when the deduplicated set is not empty** one `add_client_locations` call with `p_limit = null` (admin) and one read of the client's primary row id; then one prompts insert. A row for the primary carries **no `location_id` key at all** (the trigger fills the primary); a row for an extra location carries that location's id. So a call with no extra locations, which is every Explee call (`explee-import-background.js:1033-1036`) and every string-only call, makes no new RPC and sends the same prompt row shape as today; `tests/explee_import.test.js` and the in-memory fake need no RPC for it (S1). Then the event. Rollback chain extended: the client delete cascades `client_locations`.

### 5.5 MCP (`mcp-server.js`)
Outputs only, no new required input. `list_prompts` and `get_prompt_results` add `location: { id, market_id, region_id, label }` per prompt (one extra read of the client's `client_locations`). The fix context passes the label of the fixed prompt's location to `buildFixPrompt` (signature unchanged, `market?: string`). Metric tools keep merging all locations, as they merge all prompts today.

### 5.6 `_geo_signals.js`
Reads active prompts and `ai_results` per client with no location split (`_geo_signals.js:48-56`, read). Release one keeps pooling and adds a comment saying so. Its consumer was not read.

## 6. Collection behaviour

### 6.1 Manual run
`enqueue-collection.js` still accepts `body.markets` and ignores it (an old tab does not 400) and passes `market: null`. `_enqueue.js`:
- prompts select becomes `'id, text, location_id'` (`_enqueue.js:124-129`);
- one read of `client_locations` for the client where `id in (location ids)`, archived included;
- per job at `_enqueue.js:249-259`: `market_id`, `market_label`, `region_label`, `region_id`, `location_id` from `resolveLocation`, replacing the per-run block at `:145-155`;
- a prompt whose `location_id` is null, or whose location row is not returned, is **asked as today** and logged as a warning: `market_id` from `clients.default_market_id`, `market_label` from `COUNTRY_NAMES`, `region_label` null, `region_id` null, `location_id` null on the job (the exact current block at `_enqueue.js:145-155`). Under the NOT NULL column and the FK this cannot happen in production; it keeps `tests/explee_import.test.js`, which runs the real `_enqueue.js` against `tests/helpers/fake_supabase_mem.js` with no trigger and no `client_locations` rows, producing the same jobs as before (S1). The `client_locations` read is skipped when no prompt has a `location_id`;
- one run, one cooldown check (`checkCollectionCooldown`, `_enqueue.js:299-325`, unchanged), one job per prompt.

The `opts.market` parameter stays in the signature for compatibility and is ignored.

Worker (`collection-worker-background.js:78-90`) passes `asked: { location_id, market_id, region_id }` from the job into `collectEngines`, and `buildResultRow` (`_collect.js:986`) writes the three stamp columns when `asked` is given. No engine caller changes: chatgpt `user_location`, google_ai `gl` and ai_overview `gl` and `location` already take one scalar location (backend map, `_collect.js:331-340, 584-592, 742-777`).

### 6.2 Single cell refresh
`loadPromptForCollect` in all three collectors (`collect-prompt.js:92-105` and its copies) selects `'id, text, client_id, is_active, location_id'` and returns `locationId`. The handler reads that one `client_locations` row by `(id, client_id)`, resolves it, and ignores `market_label`, `region_label`, `market_id` from the body (`collect-prompt.js:152`). A null `locationId` or a missing row falls back to the client's `default_market_id` at country level, as in 6.1. The `ctxGeo` string the collectors put in their response (`collect-prompt.js:304-306` and its copies) is built from the resolved labels, never from the ignored body labels (S11). Rows keep `run_id` null but now carry the stamp. `tests/phase2_prompt_ownership.test.js` must still see the three copies agree. Pre-existing and unchanged: an admin refresh sends the body text to the engines (`collect-prompt.js:104`), and the body `client_config` reaches `collectEngines` (`collect-prompt.js:152, 283`). Recorded in section 15, not fixed here.

### 6.3 Scheduled run
`schedule-collections.js` unchanged; it calls `enqueueClientCollection` with no market (backend map, `:175-194`), so every prompt is asked from its own location. `replaceExisting` stays false for scheduled (`_enqueue.js:99-102`, read), so history accumulates.

### 6.4 Force, skip, cap, history
- Force delete (`_enqueue.js:183-197`) is keyed on `prompt_id`; it can never delete another location's rows. It still erases the re-run prompts' history, as today.
- Month skip (`_enqueue.js:203-216`): a location's prompt is skipped only when that prompt has an OK row this month.
- SerpApi cap (`_enqueue.js:165-176`): each location's prompt gets google_ai and ai_overview once per 30 days.
- Churn: archive and re-add yields a new `prompt_id`, which resets the month skip and the SerpApi window. This exists today; the UI now names "archive and re-add" as the way to move a question, so the only backstop is the per-client EUR budget (`_auth.js:276` onward, from the map). Owner question 7 covers the platform SerpApi guard.

### 6.5 Hourly limit and budget
Unchanged. Hourly ceiling is `max(150, active prompts x live engine count)` (`_auth.js:254-257`, read); four country prompts are four active prompts. Monthly EUR budget per client unchanged (`_cost.js:532-549`).

### 6.6 Worldwide
A location `WW / ALL` resolves to `market_label 'Worldwide'`, `region_label null`. ChatGPT gets no `user_location`, google_ai and ai_overview get no `gl` (backend map). `buildSystemContext` (`_collect.js:39-69`) gains one branch, no signature change: when `marketLabel === 'Worldwide'` and no specific region, the system text drops the location sentence and keeps only "Respond in the same language as the question." (copy pending bg-copy). Today it would read "You are a user based in Worldwide." A `WW` continent region (for example `EU`, label `Europe`, `markets.ts:31-41` read) reads "You are a user based in Europe, Worldwide", as today. "Worldwide plus four countries" is five locations: one WW plus four country rows (either one may be primary).

The Worldwide branch is the one place owner question 2 lives: a single `if` in `buildSystemContext`, guarded by `const WORLDWIDE_NEUTRAL = true` at the top of `_collect.js`. With it false, a `WW` location with no specific region keeps the website TLD fallback, as today.

### 6.7 Behaviour changes on deploy day (census of the live read, 2026-11-13)

Primary census, market / region: clients (of which on a non-manual refresh cadence). 68 clients in all.

| Pair | Clients (scheduled) | Today's scheduled geo | After deploy | Case |
|---|---|---|---|---|
| WW / null | 6 (3) | website TLD fallback | `WW / ALL`, neutral worldwide text | (c) |
| WW / ALL | 1 (1) | website TLD fallback | neutral worldwide text | (c) |
| WW / OCE | 2 (2) | website TLD fallback | "Oceania, Worldwide" | (d) |
| WW / NA | 1 (1) | website TLD fallback | "North America, Worldwide" | (d) |
| WW / APAC | 1 (1) | website TLD fallback | "Asia Pacific, Worldwide" | (d) |
| WW / EU | 1 (1) | website TLD fallback | "Europe, Worldwide" | (d) |
| RO / ALL | 5 (5) | Romania | Romania | none |
| RO / B | 2 (1) | Romania | Bucharest, Romania | (b) |
| ES / TF | 1 (1) | Spain | the TF region of Spain | (b) |
| DK, SE, US / ALL | 2 (2) each | country | country | none |
| NL, IS, CA, IT, IL / ALL | 1 (1) each | country | country | none |
| US or EU city, research | about 38 (0) | manual only | manual runs from the prompt's location: city level only when the stored region id exists in `markets.ts`; otherwise country level, as section 5.2 and `_locations.js:95-100` say, which is what these clients get today (amended 2026-11-13, final review) | (a) |

(a) Manual runs stop following the browser sidebar chip and use each prompt's location; this touches every client run by hand, including about 38 research workspaces that sit on one city each. (b) 2 scheduled clients (one `RO / B`, one `ES / TF`) move scheduled answers from country level to city level; the second `RO / B` client is manual. (c) 4 scheduled `WW / ALL` primaries (3 with a null region plus 1 with `ALL`) move from the website TLD fallback (`_enqueue.js:153` gives a null label, `_collect.js:51-61` then maps the TLD) to the neutral worldwide text, subject to owner question 2. (d) 5 scheduled clients on a `WW` continent (`OCE` 2, `NA` 1, `APAC` 1, `EU` 1) move from the website TLD fallback to "You are a user based in Oceania, Worldwide" and so on (`_collect.js:50`); ChatGPT still gets no `user_location` (`_collect.js:338`, `WW` is not a country); ai_overview gets `location` set to the continent name without `gl` (`_collect.js:758-759`). Whether SerpApi accepts a continent as `location` was not checked; owner question 2 also rules the continent wording. 16 scheduled clients on a country `ALL` pair see no change. Trend lines of the 11 clients in (b), (c) and (d) may step on the deploy date; old rows carry null stamps so the step is explainable.

## 7. Dashboard behaviour

### 7.1 Results RPC and shared layer
`client_results_latest` needs no change: its cell partition `(prompt_id, llm)` is per location because a location is a prompt, and every `prompt_id` now has one fixed location. `resultsContext.tsx` already loads all prompts of the client (from the map, `:30-50`), so a row's location is `prompt.location_id`, joined client side, no extra request.

New pure module `src/lib/locations.ts` (imports only `markets.ts`, loadable by node tests like `metrics.ts`):

```ts
export type ClientLocation = { id: number; market_id: string; region_id: string; is_primary: boolean;
                               position: number; archived_at: string | null; active_prompts: number }
export function locationLabel(loc: Pick<ClientLocation,'market_id'|'region_id'>): string
export function promptLocationId(p: { location_id?: number | null }, primaryId: number | null): number | null
export function filterPromptsByLocation<P extends { location_id?: number | null }>(
  prompts: P[], selected: ReadonlySet<number> | null, primaryId: number | null): P[]   // null = all
```

**The filter is applied once, inside `src/lib/resultsContext.tsx` (row 4) (M2).** No page computes its own location filter. `buildSnapshotView` (`metrics.ts:161-182`, read) computes `errorEngines`, `partialErrorEngines` and `latestChecked` over every row passed to it (`:166-179`), and its six callers (`BrandSentiment.tsx:158`, `Competitors.tsx:106`, `Recommendations.tsx:547`, `views/aiVisibilityView.ts:62`, `views/dashboardView.ts:130`, `views/mentionsView.ts:57`) all take ids from `useResults().snapshot.activePrompts`; so filtering both the ids and the rows at the source covers every caller, including `Recommendations.tsx`, `dashboardView.ts` and `mentionsView.ts`, with no scope change and no `metrics.ts` change.

Contract of `useResults().snapshot` after this change. The type is a new `LocationFilteredSnapshot`, declared in `resultsContext.tsx` as `ResultsSnapshot & { ... }`, so `src/lib/resultsLoader.ts` and `tests/results_loader.test.js` stay untouched:

```ts
type LocationFilteredSnapshot = ResultsSnapshot & {
  // ResultsSnapshot fields, re-bound under a filter:
  //   rows          rows whose prompt_id belongs to a prompt (active or not) in a selected location
  //   activePrompts active prompts in a selected location, same order as before
  //   prompts       UNCHANGED, every prompt of the client (lookups by id stay complete)
  //   version       UNCHANGED, the loader's counter
  allRows: ResultRow[]            // unfiltered rows
  allActivePrompts: Prompt[]      // unfiltered active prompts
  locationPromptIds: ReadonlySet<number> | null  // ids of all prompts in the selected locations; null = no filter
  filterKey: string               // '' when unfiltered, else the sorted selected location ids joined by ','
}
```

Rules: with no filter ("All locations", or a client with one location) `rows === allRows` and `activePrompts === allActivePrompts`, so today's numbers are unchanged. A row whose `prompt_id` is not among the client's prompts is dropped under a filter and kept without one. The memo that builds the value depends on the loader snapshot and the selected set, so a filter change yields a new snapshot object; a page that memoises on `version` alone (`AIVisibility.tsx:951` keys the fix verdict effect on it) must use `version` plus `filterKey`, or read `allRows`. **Fix verdict checks and the AI Visibility "Split by location" view read `allRows` and `allActivePrompts`**; the Prompts page reads `prompts`. History pages (Competitors, Mentions, BrandSentiment, Dashboard) filter rows returned by `readResultHistory` (`historyRead.ts:32-46`, read) client side with `locationPromptIds`; no long `IN` list. The results cache key is unchanged (filtering after fetch). Under a filter, `latestChecked` and the engine error sets are per location. `tests/locations_view.test.js` asserts, on a two-location fixture, that the filtered snapshot gives a different mention rate and a different `latestChecked` than the unfiltered one, and that "All locations" gives arrays identical to the loader's.

`locationLabel` never throws: a known pair renders the market label, plus the region label unless `ALL`; a region id not in `markets.ts` (the research ids of section 5.2) renders the market label followed by the raw region id in parentheses (copy: pending bg-copy); an unknown market id renders the raw id.

### 7.2 Defaults, filter, split
- Default view: "All locations". A location with more prompts weighs more (owner question 6). One line on each insight page says so when the client has more than one location.
- Filter: owned by the new `src/lib/locationsContext.tsx`; persisted per viewer per client in localStorage as a convenience, every read and write in try/catch; renders correctly when storage is empty. `resultsContext.tsx` reads the selected set from it, so `App.tsx` mounts `LocationsProvider` outside `ResultsProvider`. A stored selection naming a location that is no longer live is dropped on read; an empty result means "All locations". The default (owner question 6) is one constant in `locationsContext.tsx`, `DEFAULT_VIEW = 'all'`.
- AI Visibility: "Split by location" toggle, one row per location with the existing mention rate computed over that location's prompts. The prompts table shows a location badge (existing `Badge`, tone neutral, inside the page's `renderRow`) and can group by location.
- Engine error state on tiles: `errorEngines` and `partialErrorEngines` are computed by `buildSnapshotView` from the filtered rows (7.1), so they follow the filter. Which rows the RPC returns is still decided by its client-wide windows (`w_eng partition by llm`, SQL:110); any effect of that window on a filtered view is a recorded limitation, not re-derived here.
- CSV exports on AI Visibility and Competitors gain a Location column (`src/lib/views/aiVisibilityView.ts`, `src/lib/views/competitorsView.ts`); `tests/views_a.test.js` pins the header (grep hit, assertion not read) and is updated in the same lane.
- Budget meter (`AIVisibility.tsx:652-656`, from the map) stays client-wide.

### 7.3 Old rows
Rows collected before the change belong to prompts backfilled to the primary, so aggregates count them under the primary. Their `asked_market_id` is null. Where a page lists individual answers from history reads (Mentions feed, Sentiment feed), the columns string passed to `readResultHistory` adds `asked_market_id`, and a null shows "Location not recorded". The RPC row shape is unchanged, so the AI Visibility cell drill-down shows the prompt's location only. This replaces the draft's contradictory claim.

### 7.4 Fix prompts
`AIVisibility.tsx:839` (from the map) passes the label of the fixed prompt's location to `buildFixPrompt`; for fixes not tied to one prompt, the labels of the filtered locations joined with ", ". Signature unchanged. Where two active prompts share the same text, the fix title appends the location label (reviewer 3).

### 7.5 Demo mode
`locationsContext.tsx` makes no network call when `isDemoMode`: one synthetic primary location built from the demo client's default, or WW when there is none. Mock prompts have no `location_id`; `promptLocationId` maps undefined or null to the primary. `marketContext.tsx`'s hardcoded RO fallback (`:98-102`, from the map) becomes WW. No Retry error in demo.

### 7.6 `marketContext.tsx` compatibility
Keeps its exports (`selections`, `primaryMarket`, `primaryRegion`, add, remove, update) so no consumer breaks in the same build. `selections` derive from the server list; writes go through `client-locations.js`; the localStorage keys `brandgeo_markets_v2_<clientId>` and the legacy global key are no longer read or written. `collectionContext.tsx` stops sending `markets` (the server ignores it either way).

## 8. UI contract (for bg-design and bg-app)

Constraints that bind: `Combobox` (`src/components/ui/Combobox.tsx:33-45`) keeps its props exactly; multi-select is a NEW `src/components/ui/MultiCombobox.tsx`. Nothing `Layout.tsx` imports may import `motion`. Copy strings are marked "copy: pending bg-copy".

**MultiCombobox:** same filter (`comboboxFilter.ts`), listbox with `aria-multiselectable` and `aria-selected` per option; Enter or click toggles and keeps the list open; selections shown as removable chips; Backspace on an empty input removes the last chip; never commits on blur; Escape closes and stops propagation (phone drawer stays open, as `Combobox.tsx:166-172`); active option kept in view with `scrollTop` only, never `scrollIntoView`; 44 px targets on a phone; "All regions" is exclusive with specific regions.

**Onboard wizard (admin):** "Primary location" (existing single market and region Comboboxes). "Other locations": add a market with the existing Combobox in `clearOnSelect` mode; a market with more than the ALL region opens a MultiCombobox of its regions; each pair becomes one chip line; duplicates of the primary or of a chip are not offered. Prompts step: each prompt carries a MultiCombobox "Ask in" over the chosen locations; when more than one location exists the default is every chosen location (the owner's use case), else the primary; a live counter reads "K prompts of CAP" and states how many questions fit (`floor(cap / locations)`); Next is disabled past the cap with one line explaining that each location of a question uses one prompt; the server still refuses past cap unless the admin ticks an explicit override (section 5.4). Review step lists locations and prompts per location. **Onboard.tsx carries another session's uncommitted edits: its lane starts only after that work is committed.**

**Sidebar block** (`Layout.tsx:856-958`, the same aside as the phone drawer): title "Locations". Collapsed: up to three lines (flag, country, region unless All), then "+N more"; the primary carries a small marker. Expanded: one row per location with its active prompt count; archive X on non-primary rows, disabled with a reason while the row has active prompts; "Add location" as in Onboard. At the limit, Add is replaced by "Location limit reached" plus a link to `/account`. Tapping rows toggles the view filter; an "All locations" row resets. This is a viewing choice, not a collection setting; the Edit aria-label no longer mentions "this browser". Loading: skeleton lines. Error: the primary from `clientContext` plus Retry; collection keeps working because it is server resolved.

**Prompts page:** location badge per row; filter by location; Add form with MultiCombobox "Ask in" (default primary), K locations create K rows in one insert, and the `prompt_cap_reached` match at `Prompts.tsx:290` (from the map) is unchanged; new error tokens `location_archived` and `location_invalid` mapped to friendly lines; edit cannot change location ("Archive and add again to move it"); the AI Discover add path gets the same "Ask in" selector; empty state per filtered location.

**Account page:** Locations section, same list and add and archive; admin sees "Make primary" on a non-primary row, with a confirm that says it changes the default for new prompts and changes no existing prompt.

**AI Visibility:** header badges (`AIVisibility.tsx:1606-1618`, from the map) show the current filter; "Split by location" toggle.

## 9. Cost

Constants, all from `netlify/functions/_cost.js` (read): per-check fallback `ENGINE_COST_EUR` claude 0.033 (`:218`), chatgpt 0.014 (`:235`), perplexity 0.005 (`:236`), grok 0.020 (`:247`), gemini 0.032 (`:249`), google_ai 0.046 (`:250`), ai_overview 0.069 (`:257`). Engines per plan `PLAN_LIVE_ENGINES` (`:408-451`). Weekly cadence on every paid plan (`:606-615`), 4.333 runs a month (`:209`). google_ai and ai_overview at most once per prompt per 30 days (`MONTHLY_CAP_DAYS = 30`, `:693`). gpt-5.5 at roughly 0.084 a call for paid plans (`:227-228`); growth and up run gpt-5.5, essentials gpt-4o-mini (`_collect.js:318-326`). Budgets `PLAN_MONTHLY_API_BUDGET_EUR` (`:532-549`). Prompt caps `PLAN_PROMPTS` (`src/lib/planConfig.ts:562-565`); the live `plan_prompt_caps` table was not read. SerpApi credits per check google_ai 1, ai_overview 1.5 (`:202`), pool 500 a month platform wide (`:201`).

Per prompt per month at one location (unchanged by this design): radar 0.065 x 4.333 = EUR 0.2816; essentials 0.079 x 4.333 = EUR 0.3423; growth 0.084 x 4.333 + 0.046 = EUR 0.4100 (EUR 0.7133 with chatgpt at 0.084); growth_pro and managed 0.104 x 4.333 + 0.046 + 0.069 = EUR 0.5656 (EUR 0.8689 with chatgpt at 0.084).

Table: the most questions per location the cap allows, `floor(cap / N)` questions times N locations. Euros per month, fallback constants, then with chatgpt at the gpt-5.5 figure.

| Plan (cap, budget) | 1 location | 2 locations | 4 locations | SerpApi credits a month |
|---|---|---|---|---|
| radar (7, 4.35) | 7 prompts, 1.97 | 6 prompts, 1.69 | 4 prompts, 1.13 | 0 |
| essentials (18, 14.85) | 18 prompts, 6.16 | 18 prompts, 6.16 | 16 prompts, 5.48 | 0 |
| growth (35, 44.85) | 35, 14.35 / 24.96 | 34, 13.94 / 24.25 | 32, 13.12 / 22.83 | 35 / 34 / 32 |
| growth_pro (56, 67.35) | 56, 31.68 / 48.66 | 56, 31.68 / 48.66 | 56, 31.68 / 48.66 | 140 |
| managed (200, 225.00) | 200, 113.13 / 173.79 | 200, 113.13 / 173.79 | 200, 113.13 / 173.79 | 500 |

Reading: the bound is the cap, not the number of locations, so no figure exceeds what the same plan can spend today at full cap. Spend rises only for clients who today use fewer prompts than their cap. Worst case: `_cost.js:220-221` records a measured gpt-5.5 range of 0.078 to 0.174 per call; at 0.174 a full managed client is (0.174 + 0.090) x 4.333 + 0.115 = EUR 1.2589 per prompt, x 200 = EUR 251.78, above the 225.00 budget, so late-month runs would be blocked rather than overspent (this is true today at full cap, not new). SerpApi: one full managed client uses the whole 500 credit pool; nothing in code enforces the pool (owner question 7). `serpApiCreditsPerMonth` (`_cost.js:209-213`) multiplies by runs and ignores the 30 day cap, so it overstates; not changed here.

## 10. Plan gating

Unchanged spend gates: cap trigger (`supabase-prompt-cap-bypass-fix-2026-11-09.sql:96-109`), hourly ceiling and monthly budget (`_auth.js`), engine set re-gated per plan (`_enqueue.js:115-120`). Nothing in `PLAN_ORDER`, `_plans.js`, `PLAN_LIVE_ENGINES`, `stripe-webhook.js`, `accept-terms.js`, `_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`, or the exported signatures of `aiVisibilityScore.ts`, `competitorFilter.ts`, `fixPrompt.ts`, `keysetRead.ts` changes.

Location count is packaging, not spend: `PLAN_LOCATION_LIMIT` in `_locations.js`, mirrored as a NEW export in `src/lib/planConfig.ts` (existing tables untouched), equality asserted by `tests/locations_view.test.js` in row 4, which runs after row 1 has written `_locations.js` (S2). It counts live rows including the primary, enforced atomically in `add_client_locations` under a per-client advisory lock (closes the check-then-insert race). Recommended values, pending owner question 1: free 1, radar 3, essentials 5, growth 5, growth_pro 8, managed 25, pro 25, enterprise 100. Unknown plan: 1. Admin may exceed, recorded. On a downgrade, existing extra locations keep collecting inside the lower prompt cap; only adding is blocked (owner question 5). That default needs no code: no downgrade hook is written.

## 11. Tests

New:
- `tests/market_regions_mirror.test.js` (bg-backend, row 1): `MARKET_REGIONS` from `_market_regions.js` is deeply equal to `MARKETS` from `markets.ts` reduced to ids, labels and region order (exact assertion in section 5.2); `_market_regions.js` and `_locations.js` contain no `require` of a `.ts` file.
- `tests/locations_resolve.test.js` (bg-backend): `resolveLocation` labels for a country, a city, `ALL`, `WW`, a WW continent, an unknown region such as `US / AUS` (null, no throw); `validatePair` refusals, including the unknown research region; `locationLimitFor` unknown plan is 1; every `MARKET_REGIONS` id except WW has a `COUNTRY_NAMES` entry through `_country_names.js`. (The `PLAN_LOCATION_LIMIT` equality moved to `tests/locations_view.test.js`, S2.)
- `tests/client_locations_endpoint.test.js` (bg-backend): auth gate; viewer of client A passing a location id of client B gets 404 and zero rows change; `set_primary` by a viewer 403; error code mapping for each RPC outcome and 23505; admin add passes `p_limit = null` and writes an event.
- `tests/enqueue_locations.test.js` (bg-backend): per-job geo from each prompt's location; WW job has no market id geo; body `markets` ignored; one run, one job per prompt; scheduled path uses prompt locations; a prompt with a null `location_id` is asked at the client's default country (the S1 fallback); stamp reaches the worker rows.
- `tests/provision_locations.test.js` (bg-backend): locations created, prompts mapped per key, string prompts map to primary and carry no `location_id` key, no `add_client_locations` call when there are no extra locations, extra locations equal to the primary or to each other are dropped before the clients insert (S7), every refusal (`invalid_location`, `prompt_cap_exceeded`) happens before the clients insert and before any invite, the cap falls back to the free row then to 5 (S8), `allow_over_cap` recorded.
- `tests/build_system_context.test.js` (bg-backend, row 3): WW neutral text, WW continent ("Oceania, Worldwide"), country, city, TLD fallback when no label, and the TLD fallback for `WW / ALL` when `WORLDWIDE_NEUTRAL` is false.
- `tests/locations_view.test.js` (bg-app, row 4): `locationLabel` for a known pair, an unknown research region and an unknown market (no throw); `promptLocationId` null to primary; `filterPromptsByLocation`; the M2 assertions of section 7.1 (different mention rate and different `latestChecked` under a one-location filter on a two-location fixture, identical arrays under "All locations"); `PLAN_LOCATION_LIMIT` in `src/lib/planConfig.ts` deeply equals the one in `netlify/functions/_locations.js` (S2).

Updated: `tests/enqueue_history.test.js` (fixture prompts gain `location_id`, a `client_locations` stub), `tests/phase2_prompt_ownership.test.js` (new select), `tests/enqueue_force_gate.test.js` and `tests/phase2_schedule_worker_trigger.test.js` (stub `_country_names`), `tests/provision_client.test.js` (fake gains `client_locations` and the RPC; `:215` key set unchanged), `tests/mcp_server.test.js` (`:738-767` fix label source, prompt outputs), `tests/views_a.test.js` (CSV header).

Updated only if needed, row 1 owns them: `tests/explee_import.test.js` (expected to pass untouched because of the S1 design in 5.4 and 6.1; if it pins the exact job row shape, only its expectations of the two new job keys change) and `tests/helpers/fake_supabase_mem.js` (additive only, for example an `add_client_locations` rpc branch for `provision_locations.test.js`; no existing branch or default changes, because 14 other test files use it). Row 3 tests seed `client_locations` rows with the fake's existing `seed()` and need no helper change.

Must keep passing untouched: `tests/ts_require_bundler.test.js` **with `netlify.toml` unchanged** (acceptance for rows 1 and 3: `node tests/ts_require_bundler.test.js` passes, and its check that `onboard-client` and `schedule-collections` are not flagged still holds), `tests/markets_data.test.js`, `tests/combobox_filter.test.js`, `tests/fix_prompt.test.js`, `tests/fix_items.test.js`, `tests/engine_routing.test.js`, `tests/phase1_server_hardening.test.js`, `tests/phase2_collector_gate.test.js`, `tests/prompts_archive.test.js`, `tests/refresh_cadence.test.js`, `tests/results_loader.test.js`, `tests/history_read.test.js`, `tests/explee_rules.test.js`, `tests/tokens_sync.test.js`, and the rest of the 52 files.

## 12. Build plan

At most two agents at a time, disjoint write scopes, no git inside any agent, one Netlify build at the end.

Paths are relative to the repository root. `D` below stands for `brandgeo-dashboard/`.

| # | Agent | Write scope | Depends on |
|---|---|---|---|
| 0 | bg-verify (Opus), read only | `docs/qa/multi-location-prebuild-review-2026-11-13.md` | DONE 2026-11-13, BLOCK, closed by the amendment of section 16 |
| 1 | bg-backend (Opus) | `db/supabase-client-locations-2026-11-13.sql`; `D/netlify/functions/_country_names.js`, `D/netlify/functions/_market_regions.js`, `D/netlify/functions/_locations.js`, `D/netlify/functions/client-locations.js`, `D/netlify/functions/_enqueue.js`, `D/netlify/functions/enqueue-collection.js`, `D/netlify/functions/onboard-client.js`, `D/netlify/functions/_provision_client.js`; `D/tests/market_regions_mirror.test.js`, `D/tests/locations_resolve.test.js`, `D/tests/client_locations_endpoint.test.js`, `D/tests/enqueue_locations.test.js`, `D/tests/provision_locations.test.js`, `D/tests/enqueue_history.test.js`, `D/tests/enqueue_force_gate.test.js`, `D/tests/phase2_schedule_worker_trigger.test.js`, `D/tests/provision_client.test.js`, `D/tests/explee_import.test.js` (only if it fails, expectations only), `D/tests/helpers/fake_supabase_mem.js` (additive only) | 0 |
| 2 | bg-design (Opus), parallel with 1 | `docs/design/multi-location-ui-2026-11-13.md` | 0 |
| 3 | bg-backend (Opus) | `D/netlify/functions/collection-worker-background.js`, `D/netlify/functions/_collect.js`, `D/netlify/functions/collect-prompt.js`, `D/netlify/functions/collect-claude.js`, `D/netlify/functions/collect-chatgpt.js`, `D/netlify/functions/mcp-server.js`, `D/netlify/functions/_geo_signals.js`; `D/tests/build_system_context.test.js`, `D/tests/phase2_prompt_ownership.test.js`, `D/tests/mcp_server.test.js` | 1 (requires `_locations.js`) |
| 4 | bg-app (Sonnet), parallel with 3 | `D/src/lib/locations.ts`, `D/src/lib/locationsContext.tsx`, `D/src/lib/marketContext.tsx`, `D/src/lib/collectionContext.tsx`, `D/src/lib/resultsContext.tsx`, `D/src/lib/planConfig.ts` (new export only), `D/src/lib/i18nContext.tsx`, `D/src/types/index.ts`, `D/src/components/ui/MultiCombobox.tsx`, `D/src/components/ui/index.ts`, `D/src/components/Layout.tsx`, `D/src/App.tsx`, `D/tests/locations_view.test.js` | 1 (endpoint contract, `_locations.js` for the S2 equality test), 2 |
| 5 | bg-app (Sonnet) | `D/src/pages/Prompts.tsx`, `D/src/pages/Account.tsx`, `D/src/pages/AIVisibility.tsx`, `D/src/pages/Competitors.tsx`, `D/src/pages/Mentions.tsx`, `D/src/pages/BrandSentiment.tsx`, `D/src/pages/Dashboard.tsx`, `D/src/lib/views/aiVisibilityView.ts`, `D/src/lib/views/competitorsView.ts`, `D/tests/views_a.test.js` | 4 |
| 6 | bg-app (Sonnet), parallel with 5, only once the other session's `Onboard.tsx` work is committed | `D/src/pages/Onboard.tsx` | 4 |
| 7 | bg-verify (Opus), read only, with the rolled-back probe block of 4.4 | `docs/qa/multi-location-review-2026-11-13.md` | 3, 5, 6 |
| 8 | Owner | apply the migration in the SQL Editor, run 4.4 read-back, then one push with `$env:BATCH_PUSH=1` | 7 |

Disjointness, re-checked 2026-11-13 after the amendment: every path above appears in exactly one row; no path appears under two `#`. Row 1 is the only writer of `_locations.js` and `_market_regions.js`; rows 3 and 4 only read them. `planConfig.ts` (row 4) and `_locations.js` (row 1) hold the two mirrors of `PLAN_LOCATION_LIMIT`; the equality test lives in row 4 (S2). `src/pages/Recommendations.tsx`, `src/lib/views/dashboardView.ts`, `src/lib/views/mentionsView.ts`, `src/lib/metrics.ts` and `src/lib/resultsLoader.ts` are in no row and are not edited: the M2 filter in `resultsContext.tsx` covers them.

**Not in any packet's scope, by rule:** `D/netlify.toml` (it carries another session's uncommitted hunk, and no function gains a bundler entry: the bundler rule of 5.2 makes none necessary), `src/lib/markets.ts`, `D/netlify/functions/stripe-webhook.js`, `D/netlify/functions/provision-account.js`, `D/netlify/functions/signup-client.js`, `D/netlify/functions/explee-import-background.js`, `D/netlify/functions/resend-invite.js`, `D/netlify/functions/unlock-audit-report.js`, `D/src/components/PendingInvitesPanel.tsx`, `D/tests/resend_invite.test.js`, anything under `brandgeo/web`, `docs/growth` or `.claude`.

Acceptance shared by rows 1 and 3: `node tests/ts_require_bundler.test.js` passes from `brandgeo-dashboard` with `netlify.toml` unchanged, and `node --check` passes on every changed function file. bg-copy is optional between 2 and 4; strings stay marked pending otherwise. If row 6 cannot start, the build waits: shipping the sidebar and collection without the wizard would spend a second Netlify build.

Mechanical rows for a cheaper model (`/cheap`): `_market_regions.js` (copy ids and labels from `markets.ts`; the mirror test proves it) and `_country_names.js` (move verbatim). Everything else touches RLS, triggers, auth or plan gating and stays on the named model.

## 13. Scale note for 1,000 clients

- Reads added: manual and scheduled enqueue, one `client_locations` read per run; single cell refresh, one per call per collector (up to three); `list` on dashboard load, two reads (ensure plus list with a grouped count); MCP prompt tools, one read; prompt insert trigger, one indexed row lookup per inserted row.
- Writes added: the three stamp columns on rows already written; two columns on job rows already written; `client_locations` rows only on admin or viewer action. One backfill at migration time: one primary row per client with prompts, one UPDATE over `prompts`.
- Function invocations: one new endpoint, invoked on dashboard load and on location edits. No new cron, no new scheduled invocation. Job count per run is unchanged per prompt; total jobs scale with prompts, which the cap bounds.
- `ai_results` growth per client is unchanged at a given prompt count.

## 14. Open questions for the owner

**State on 2026-11-13: questions 1 to 7 are UNANSWERED.** The ruling "One country per prompt" stands and is not one of them. The build proceeds on the recommended default of each question, and each default lives in exactly one place:

| Q | Default the build ships | The one place to change it |
|---|---|---|
| 1 | limits free 1, radar 3, essentials 5, growth 5, growth_pro 8, managed 25, pro 25, enterprise 100 | `PLAN_LOCATION_LIMIT` in `_locations.js` and its mirror export in `planConfig.ts` (the equality test keeps them together) |
| 2 | neutral text for `WW / ALL` | `WORLDWIDE_NEUTRAL` in `_collect.js` (section 6.6) |
| 3 | viewers may add and archive | `VIEWER_MAY_EDIT_LOCATIONS` in `client-locations.js` (section 5.3) |
| 4 | admin over cap only with the explicit `allow_over_cap` tick | the `allow_over_cap` branch in `_provision_client.js` (section 5.4) |
| 5 | keep collecting after a downgrade, block adding only | no code: no downgrade hook exists |
| 6 | all locations combined | `DEFAULT_VIEW` in `locationsContext.tsx` (section 7.2) |
| 7 | no platform SerpApi guard in this build | nothing built; the guard is a separate artifact if ruled |

1. **Location limit per plan.** Default: free 1, radar 3, essentials 5, growth 5, growth_pro 8, managed and pro 25, enterprise 100; "Worldwide plus four countries" then fits from Essentials up. Cost to change later: two constants and one test, one dashboard build; no data change.
2. **What a Worldwide location measures.** Default: a neutral question with no location given to any engine, also for existing WW clients, whose scheduled answers today use the website's country. Alternative: keep the website-country fallback for a WW primary. Cost to change later: one branch in `buildSystemContext`, one build, plus a second step in trend lines.
3. **Can customers add and archive locations themselves?** Default: yes, within the limit; adding a location costs nothing until prompts are added. Cost to change later: one role check in `client-locations.js`.
4. **May an admin onboard above the prompt cap?** Default: refused unless the admin ticks an explicit override, recorded per client. Cost to change later: one flag.
5. **On a downgrade, extra locations above the new limit.** Default: keep collecting inside the lower prompt cap; only adding is blocked. Alternative: archive their prompts. Cost to change later: a downgrade hook, touching billing code, so decide before a downgrade happens.
6. **Dashboard default with several locations.** Default: all locations combined, weighted by prompt count, with a visible filter and a split on AI Visibility. Alternative: one location at a time, or equal weight per location. Cost to change later: view logic only, one build.
7. **Platform SerpApi pool (500 credits a month, not enforced in code).** Multi-country selling pushes clients to their caps; one full Growth PRO client uses 140 credits, one full Managed client all 500. Default: before selling, measure the current month's google_ai and ai_overview row count, then build a platform guard that drops those two engines from a run once the pool is projected to run out, with a visible reason. Alternative: raise the pool. Cost to change later: if nothing is done, every Growth-and-up client loses Google AI Mode at once when the pool empties.

## 15. Not checked

Settled by the orchestrator's live read of 2026-11-13 and removed from this list: the PostgreSQL version (17.6, `hashtextextended` available); that `is_admin`, `has_client_access` and `my_client_id` exist and are SECURITY DEFINER; the live `prompts` policies and grants; that both 2026-11-09 migrations are applied; the triggers on `prompts`, `clients`, `ai_results` and `collection_jobs`; the shape of every `default_market_id` and `default_region_id`; the absence of orphan prompts; that `plan_prompt_caps` exists and `client_locations` and `prompts.location_id` do not.

Still not checked:

- Live database: the bodies of `has_client_access`, `my_role` and `is_admin`; the live `clients` and `ai_results` policies; the live `plan_prompt_caps` values; live default privileges for `service_role` (now made explicit by the grant in step 1, S4); the live definition of `claim_collection_jobs` (repo file only) and the live type of `prompts.client_id` (from a code comment); any index on `ai_results.llm` (relevant to question 7).
- Nothing in this spec was executed: no SQL, no rolled-back probe, no node test, no build. The multi-row insert against the cap trigger, `RETURN QUERY INSERT ... RETURNING`, the archive race, FOR SHARE versus FOR UPDATE ordering and the S10 deadlock are reasoned from PostgreSQL semantics only.
- The region ids of the July research workspaces (clients 28 to 47); only the 2026-11-06 batch file was read.
- SerpApi acceptance of continent names as `location` (case (d) of section 6.7).
- How `tests/enqueue_force_gate.test.js` and `tests/phase2_schedule_worker_trigger.test.js` stub modules beyond their `installModule` lines; whether `tests/explee_import.test.js` pins the exact job row shape; whether `tests/phase2_collector_gate.test.js` passes untouched once the collectors read `client_locations` (the 6.2 fallback is designed so it does).
- `src/pages/Onboard.tsx`, `marketContext.tsx`, `collectionContext.tsx`, `resultsContext.tsx`, `metrics.ts`, `AIVisibility.tsx`, `Prompts.tsx`, `Layout.tsx`: line citations marked "from the map" were not re-read here.
- `_collect.js` engine callers beyond `buildSystemContext`, `CHATGPT_MODEL_BY_PLAN`, `buildResultRow`'s signature and `collectEngines` setup.
- `set-client-plan.js:166` event pattern; `_auth.js` beyond `:245-262`; `schedule-collections.js`; `explee-import-background.js` prompt counts; `generate-recommendations.js` and `fixItems.ts` per-location behaviour; the consumer of `_geo_signals.js`.
- `tests/views_a.test.js` assertions; whether any test pins the AI Visibility CSV header text beyond that grep hit.
- SerpApi acceptance of `gl` and `location` for every market and city (pre-existing, CLAUDE.md 2026-11-11).
- Pre-existing, not fixed here: an admin single cell refresh sends the body prompt text and body `client_config` (`collect-prompt.js:104, 152, 283`), so an admin refresh can store an answer to different text under a prompt; the UK `gl=gb` question; Singapore's only region read as a city.

## 16. Amendment log, 2026-11-13 (after the pre-build review)

Source: `docs/qa/multi-location-prebuild-review-2026-11-13.md`, verdict BLOCK. Each finding was checked against source before it was accepted.

| Finding | Verified against | Change |
|---|---|---|
| M1 bundler | `tests/ts_require_bundler.test.js:49-62, 94-97, 105-109`; `netlify.toml:279-280, 424-426`; the only `.ts` requires under `netlify/functions` are `mcp-server.js:53-60` and `explee-import-background.js:142` | 5.2 bundler rule; new `_market_regions.js`; `tests/market_regions_mirror.test.js`; section 11 acceptance; section 12 rows 1 and 3 and the `netlify.toml` exclusion |
| M2 filter at the source | `metrics.ts:161-182`; `resultsLoader.ts:15-29, 101-109`; `resultsContext.tsx:118-127`; the six `buildSnapshotView` callers | 7.1 rewritten: one filter in `resultsContext.tsx`, `LocationFilteredSnapshot` contract, `allRows` for fix verdicts and the split view; 7.2 provider order; test in 11 |
| S1 fake has no rpc or trigger | `fake_supabase_mem.js:301-345` (unknown rpc errors at `:344`), `explee_import.test.js:21, 35-37` | 5.4 calls the RPC only with extra locations and omits `location_id` for primary rows; 6.1 and 6.2 fall back to today's country-level geo; row 1 owns the fake (additive) and the explee test (only if it fails) |
| S2 test order | section 12 dependency | equality test moved to `tests/locations_view.test.js`, row 4 |
| S3 plan source | design | 5.2 and 5.3 |
| S4 service_role grant | design | step 1 grant plus a read-back query in 4.4 |
| S5 WW continents | census | case (d) in 6.7, with counts |
| S6 unknown research regions | `markets.ts:28-41` read; batch file cited by the review | 5.2 and 7.1 |
| S7 dedupe | `_provision_client.js:183-184, 226, 291` | 5.4 validation step 2, all validation before the clients insert |
| S8 cap fallback 5 | review citation of the cap fix file | 5.4 validation step 4 |
| S9, S10 | reasoning only | recorded in 4.3 notes, no change |
| S11 ctxGeo | review citation | 6.2 |

Also changed: 4.2 carries the live read; 6.6 names `WORLDWIDE_NEUTRAL`; section 14 records that questions 1 to 7 are unanswered and where each default lives; section 15 drops what the live read settled.

**Review findings not accepted:** none. One count corrected: the review called the `WW` continent primaries "four"; they are four region ids covering five clients (`OCE` 2, `NA` 1, `APAC` 1, `EU` 1), all scheduled. The review's S1 offered two options; this amendment takes the second (no RPC without extra locations) and adds the enqueue and collector fallback, and also gives row 1 the fake helper for the new provision test.

**Open after this amendment:** owner questions 1 to 7 (defaults ship); S9 (client id existence leak through error text, INFO); S10 (rare deadlock, PostgreSQL resolves it); SerpApi acceptance of continent names; the pre-existing admin single cell refresh issue of section 15; the RPC's client-wide `w_eng` window under a location filter (7.2, recorded limitation).
