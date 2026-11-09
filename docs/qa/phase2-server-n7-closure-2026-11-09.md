PASS WITH FINDINGS: N7 and N2 are closed by PART A as amended (proven as a real viewer, an admin and anon in a rolled-back probe). One PRE-EXISTING live exposure found on the way, P1, needs a HUMAN CHECKPOINT: the prompt cap trigger is a no-op for viewers, and with the worker never re-checking budget, a viewer can make one enqueue spend without bound.

# Phase 2 server lens, N7 closure re-check, 2026-11-09

Reviewer: bg-verify (Opus), read only. Scope: N7 and N2 of `docs/qa/phase2-server-final2-2026-11-09.md` against the amended `db/supabase-prompts-delete-admin-only-2026-11-09.sql`. Writes: this file only. Database: `execute_sql` reads, plus two `DO` blocks that end in `raise exception` (rolled back). No migration applied, no git command run, no build.

```
INTENT: review N7 closure  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

---

## HUMAN CHECKPOINT (P1, PRE-EXISTING, live, not caused by this migration)

A viewer can add active prompts past its plan cap, and one manual enqueue then collects every one of them with no budget check per job. Proven part by probe, the rest by code. No client is over cap today (read live, 0 rows), so it has not been used yet. It does not block applying PART A, which is strictly an improvement. It does mean criterion C14 of final2 ("spend bounded per viewer") stays FAIL for a different reason than N7. Details under P1 below.

---

## Calibration

1. Diff and scope: not checked (no git allowed in this brief). I read the SQL file in full (147 lines). PART A is lines 82-110.
2. Secret scan: not run over a diff (no git). The SQL file and this report contain no credential; probe user ids are not written anywhere.
3. Criteria (from the brief): (a) N7 closed: no browser role can change `prompts.id`; (b) N2 closed: no viewer action makes the collector's `ai_results` insert fail after the engine call; (c) nothing the dashboard legitimately writes breaks; (d) live grants and policies unchanged after the probe. All four are objectively checkable.
4. Baseline: live state read before the probe (below). No tsc or build in scope; nothing under `src/` or `netlify/functions/` changed in this check.
5. Most sensitive check touched: the column privilege `UPDATE (text, category, is_active, position)` on `public.prompts` for `authenticated` (file lines 107-108), plus `prompts_delete` using `public.is_admin()` (lines 86-91).
6. Writes: only this file. No reviewed file edited.

CALIBRATED

---

## Live state before the probe (read 2026-11-09)

- `public.prompts`: RLS on, not forced, owner postgres. Table ACL `anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm`. No column ACLs. UPDATE on all seven columns for anon, authenticated, service_role.
- Policies: `prompts_delete` DELETE authenticated `(is_admin() OR has_client_access(client_id))`, plus `prompts_client_read`, `prompts_insert`, `prompts_select` (public), `prompts_update`, as in the file header.
- Triggers on `prompts`: only `trg_enforce_prompt_cap` BEFORE INSERT OR UPDATE. Triggers on `ai_results`: none. Rules on either: none.
- Constraints on `ai_results`: `ai_results_pkey`, `ai_results_client_id_fkey` (to clients), `ai_results_prompt_id_fkey` (to prompts, ON DELETE CASCADE, ON UPDATE NO ACTION). No CHECK. Columns: only `id`, `llm`, `status` are NOT NULL, all text or numeric without length limits.
- Tables referencing `prompts`: `ai_results` and `collection_jobs`, both ON DELETE CASCADE, ON UPDATE NO ACTION.
- `ai_results` RLS on; the only INSERT policy is `service_insert_ai_results` TO service_role. `service_role` has `rolbypassrls = true`; the collectors use `SUPABASE_SERVICE_KEY` (`collect-chatgpt.js:156`, same in claude and prompt).
- `clients`, `user_clients`, `user_profiles`, `collection_jobs`: RLS on, and none has any non-SELECT policy, so a viewer cannot write them.
- SECURITY DEFINER functions executable by anon or authenticated whose body mentions `prompts`: only `public.enforce_prompt_cap` (a trigger function, not callable as RPC). `pg_graphql` is not installed.
- `prompts_id_seq` last_value 603, max(id) 603.

---

## Probe 1: PART A applied, then attacked (one `DO` block, rolled back by its own `raise`)

PART A was applied verbatim (without its begin/commit). Then, as role `authenticated` with `request.jwt.claims.sub`: client 54's only viewer, then the one admin; then as `anon`. Collector inserts ran as `service_role`. All test rows used explicit ids at 2000000001 and up, so no live sequence was consumed.

```
PROBE_RESULT
 start_user postgres, end_user postgres, policy_in_txn "is_admin()"
 auth_upd_cols "category,is_active,position,text"   anon_upd_cols null
 auth_has_upd_id false   auth_has_upd_client false   auth_has_table_upd false
 viewer: v_is_admin false
   v_insert_fresh_explicit_id 1          (fresh prompt, no ai_results: the N7 precondition)
   v_renumber_fresh_err 42501            (N7 attack, refused)
   v_renumber_481_err 42501
   v_id_self_err 42501                   (SET id = id, refused)
   v_move_client_err 42501
   v_created_at_err 42501
   v_upsert_id_err 42501                 (INSERT ... ON CONFLICT DO UPDATE SET id)
   v_upsert_client_err 42501             (same, SET client_id)
   v_upsert_text 1
   v_delete_fresh 0   v_delete_481 0
   v_edit_text_cat 1   v_position 1   v_edit_481 1   v_archive_fresh 1
 service_role collector insert, after the viewer's attempts: svc_collector_insert_1 1
 service_role collector insert, after the viewer archived:   svc_collector_insert_after_archive 1
 anon: anon_update_text_err 42501   anon_update_id_err 42501
 admin: a_is_admin true
   a_edit_text 1   a_reactivate 1   a_renumber_err 42501   a_delete_fresh 1
   ai_fresh_after_admin_delete 0         (cascade intact)
 extra, explicit ids:
   v_insert_next_seq_id 1 (id 604 = next sequence value)
   v_bulk_inactive_500 500               (one statement)
   v_reactivate_over_cap 3               (see P1)
   temp_default_after_taken_err 23505    (see P2)
```

## Probe 2: the cap trigger, unchanged live policy (rolled back)

```
PROBE_RESULT {"plan":"growth_pro","cap":56,"active_before":55,
  "fn_owner":"postgres","fn_secdef":true,
  "v_insert_active_1":1,...,"v_insert_active_5":1,"active_after":60}
```

## Read back after both probes (2026-11-09 07:01:52Z)

Five `prompts` policies byte-identical to before, `prompts_delete` still `(is_admin() OR has_client_access(client_id))`. Table ACL identical, no column ACLs, UPDATE on all seven columns for anon, authenticated and service_role (that is the live state; PART A is not applied). `prompts_id_seq` 603. Probe rows in `prompts` (id >= 2000000000 or 604): 0. Probe rows in `ai_results`: 0. Client 54 active prompts 55. Prompt 481 active, text unchanged, 12 `ai_results` rows.

---

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | N7: a viewer cannot change `prompts.id` | PASS | `v_renumber_fresh_err 42501` on a prompt with no rows, `v_renumber_481_err 42501`, `v_id_self_err 42501`, `v_upsert_id_err 42501`; `has_column_privilege(authenticated, id, UPDATE)` false in the transaction. |
| A2 | N2: a viewer cannot delete the parent row | PASS | `v_delete_fresh 0`, `v_delete_481 0`; `policy_in_txn is_admin()`. |
| A3 | No other viewer write makes the collector insert fail after the engine call | PASS | Moving `client_id` refused (42501, direct and by upsert); `created_at` refused. After every viewer attempt and after an archive, the service-role `ai_results` insert succeeded (`svc_collector_insert_1 1`, `..._after_archive 1`). The only FK on `ai_results` that a browser role could affect is `prompt_id`; `client_id` references `clients`, which a viewer cannot write (no write policy). No trigger on `ai_results`; no CHECK; no length limits; RLS bypassed by service_role. A text edit mid call changes nothing in the inserted row (the row carries no prompt text; `collect-chatgpt.js:227-235`). |
| A4 | anon cannot update any column | PASS | `anon_update_text_err 42501`, `anon_update_id_err 42501`, `anon_upd_cols null`. |
| A5 | Dashboard writes keep working | PASS | `Prompts.tsx:210` update `{text, category}`: `v_edit_text_cat 1`, `v_edit_481 1`, admin `a_edit_text 1`. `Prompts.tsx:245` update `{is_active:false}` (`promptRemoval.ts:34-35`): `v_archive_fresh 1`. `Prompts.tsx:244` admin delete: `a_delete_fresh 1`. `Prompts.tsx:275` insert `{text, category, position, client_id}`: INSERT privilege untouched by PART A, `v_insert_fresh_explicit_id 1`. Position reorder: `v_position 1`. |
| A6 | Server writers unaffected | PASS | Every other writer uses the service key: `onboard-client.js:130` then `:204` insert, `delete-client.js:52` then `:96` delete, `collection-worker-background.js:98` (ai_results). service_role grants are not touched by PART A. |
| A7 | Live grants and policies unchanged after the probe | PASS | Read back above. |

## Regression surface (by grep)

`rg "from\('prompts'\)"` and `rg "'prompts'"` over `src` and `netlify/functions`: browser writers are `Prompts.tsx:210`, `:244`, `:245`, `:275` only. Everything else under `netlify/functions` that touches `prompts` reads (`collect-*.js:76`, `_auth.js:250`, `_enqueue.js:114`, `_geo_signals.js:49`, `mcp-server.js:289/347/349/415/438/580`) or writes with the service key (`onboard-client.js`, `delete-client.js`). No `.upsert` on `prompts` anywhere; no raw `rest/v1/prompts` path. Manual look still needed: an admin editing and archiving in the real UI after PART A ships.

---

## Findings, by severity

**P1, MAJOR, PRE-EXISTING, live: the plan prompt cap is never enforced for a viewer, and one enqueue then collects every active prompt with no per-job budget check.**
- What: `public.enforce_prompt_cap()` is `SECURITY DEFINER`, owned by `postgres`. Inside it `current_user` is the owner, so its early return `if current_user in ('service_role', 'postgres') then return new;` fires for every caller, viewers included. The cap check below it never runs.
- Proof: Probe 2, client 54's real viewer, plan growth_pro, cap 56, 55 active: five single-row active inserts all succeeded, 60 active after. Probe 1: `v_reactivate_over_cap 3` (re-activation past the cap also passes).
- Why it is a spend path: `_enqueue.js:113-118` selects every active prompt with no limit and `:238-250` writes one job per prompt. `enqueue-collection.js:68` checks the budget once, before enqueue; the worker runs jobs without any budget or limit check (`collection-worker-background.js:78-99`; final2's INFO S1 already notes this). `checkCollectionLimits`' hourly ceiling is `max(floor, activePrompts * engines)` (`_auth.js:249-258`), so it grows with the same N.
- Exploit path: (1) a viewer, for example a free self-serve signup, bulk inserts N active prompts through PostgREST with its own JWT and the public anon key (one statement took 500 rows in Probe 1); the UI cap in `Prompts.tsx` is bypassed by calling the API directly. (2) It POSTs `enqueue-collection` once (allowed once per plan cooldown). (3) Budget passes because it has spent nothing yet. (4) N jobs times every plan engine run, all billed, all counted only after the fact. N has no upper bound.
- Not shown: the real enqueue and engine spend (would cost money and write rows). The steps after the insert are traced from code.
- Live impact today: no client has more active prompts than its cap (read live, 0 rows), so it has not been used.
- Fix (owner bg-backend on Opus, then bg-verify): in `enforce_prompt_cap`, decide the bypass on the request, not on `current_user`, for example `auth.role()` (or `request.jwt.claims ->> 'role'`) being `service_role`, or no JWT at all for the SQL editor; keep the `is_admin()` bypass. Prove as a viewer in begin/rollback: insert at cap gives 23514 `prompt_cap_reached`, re-activation at cap gives 23514, archive and text edit still 1 row, service key insert still passes. As a second layer, cap the jobs per enqueue in `_enqueue.js` at the plan's `PLAN_PROMPTS`, or re-check the client budget per job in the worker.

**P2, MEDIUM, PRE-EXISTING: a viewer can insert prompts with any explicit id, and can take the sequence's next values.**
- Proof: `v_insert_next_seq_id 1` with id 604 (next value of `prompts_id_seq`); `v_bulk_inactive_500 500` in one statement (inactive rows skip the cap by design). Mechanism shown on a temp sequence and table in the same rolled-back block: a later default insert gets `23505`.
- Exploit path: a viewer inserts a block of inactive rows at ids 604 upward. Every later default insert into `prompts` platform-wide (another customer's `Prompts.tsx:275`, `onboard-client.js:204`) takes the next value, hits a taken id and fails with 23505; each failure burns one value, so a large block blocks prompt creation and onboarding (which rolls back the whole new client, `onboard-client.js:205-208`) for everyone until it is passed. Not tested live, because it would consume the live sequence.
- Not a spend path and not N2: the collector insert is unaffected.
- Fix: in the same migration, `revoke insert on public.prompts from anon, authenticated; grant insert (text, category, position, client_id, is_active) on public.prompts to authenticated;`. `Prompts.tsx:275` sends only text, category, position, client_id. Prove: viewer insert with explicit id gives 42501, viewer insert without id gives 1 row. Inactive row volume per client is separately unbounded (storage only); worth a count limit in the same trigger once P1 is fixed.

**INFO I1: the ROLLBACK block leaves column ACL entries behind.** `grant update on public.prompts to anon, authenticated` (file line 137) restores table-level UPDATE, but the four column grants from PART A stay in `pg_attribute.attacl`. Effect is identical (all seven columns updatable), but the state is not byte-identical to today, where `attacl` is null on every column. To restore exactly, add `revoke update (text, category, is_active, position) on public.prompts from authenticated;` before the grant.

**INFO I2: not a finding.** After PART A, `authenticated` still holds TRUNCATE, TRIGGER and REFERENCES on `prompts` (Supabase default grants). None is reachable through PostgREST, no RPC exposes them, and `pg_graphql` is not installed.

---

## Data and claim integrity

- File header lines 59-71, "PROVEN AGAIN": viewer UPDATE id 42501, client_id 42501, DELETE 0, text 1, category and position 1, archive 1; admin text 1, id 42501, DELETE 1. All reproduced independently (A1 to A5).
- File line 99, "enforce_prompt_cap returns early on an id change": true, and more broadly true than stated: P1 shows it returns early for every viewer write.
- File line 102-105, "the four columns the dashboard writes": matches the grep (text and category at `:210`, is_active at `:245`); position has no current browser update, kept for reordering, harmless.
- Builder header line 25-26 (carried from before), "Without DELETE a viewer cannot remove the parent row mid-call": true now that UPDATE of `id` is also gone.

## What was not checked

- Real HTTP through PostgREST (`PATCH /rest/v1/prompts`); proven at the database level under the same role and JWT claim PostgREST sets.
- Real engine timing, a real enqueue, and real spend for P1.
- P2 against the live sequence (would consume values).
- Any git diff, diff stat, or whether files outside the migration changed.
- The dashboard in a browser after PART A ships, and the Python collector or any writer outside `brandgeo-dashboard/`.
- `prompts_select TO public` for anon (unchanged by PART A).
