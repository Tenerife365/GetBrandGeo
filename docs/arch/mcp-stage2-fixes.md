# MCP stage 2: agents work the Fix This list

Status: RULED 2026-11-06, Constantin: "Defaults, build it". All eight
defaults in section 7 apply. Build contracts are fixed in section 9. The
migration apply and the Netlify push stay his clicks.

Origin, Constantin 2026-11-06: "this would be a relevant moment to start
preparing our MCP connection as many users could login via MCP to push the
fixes with their agents". This changes packet 025's ruling 3 ("no write tools
in release one"), so the first write tool is specified here and the rulings
it needs are listed, not assumed.

Builds on: `docs/arch/mcp-access.md` (stage 1, LIVE: `mcp-server.js`, seven
read tools, bearer keys `bgmcp_<client>_<48 hex>`, Radar and up), and
`docs/arch/fix-states.md` (Fix This states LIVE in ebb79e3; "Copy as AI
prompt" built in section 11).

## 1. What an agent can do after stage 2

1. `list_fixes`: read the same Fix This list the client sees on AI
   Visibility, each fix with its stable id, its state, and the same
   agent-ready prompt the "Copy as AI prompt" button copies.
2. Do the work outside BrandGEO (pages, outreach), as the prompt instructs.
3. `mark_fix_done`: mark one fix done, exactly as the dashboard's "Mark as
   done" does, and get back the date from which BrandGEO re-checks it.

Nothing else changes: collection, cooldowns, budgets and the verdict rule stay
BrandGEO's own (ruling 5).

## 2. One implementation, three callers

The fix list is built today inside `AIVisibility.tsx` (the `fixItems`
builder). MCP must return the identical list and text, so stage 2 starts with
a refactor, shipped in the same build:

| Piece | Today | Stage 2 |
|---|---|---|
| Fix list | inline in `AIVisibility.tsx` | `src/lib/fixItems.ts`, pure: `buildFixItems(ctx, fixRows)` returns the ordered items with ids, metric keys, copy and the rival's name and rank |
| Prompt text | `src/lib/fixPrompt.ts` | unchanged, called by both |
| Ids, metrics, verdict | `src/lib/fixStates.ts` | unchanged, called by both |
| Result map | page builds it (newest ok row per prompt x engine, no-answer rows dropped, active engines only) | `buildScoreResultMap` in `aiVisibilityScore.ts` already has these semantics; the page and MCP both use it |

`mcp-server.js` already requires `src/lib/*.ts` through esbuild
(`node_bundler = "esbuild"` in `netlify.toml`), so these are plain requires.
A parity test feeds one fixture to the page's path and to the MCP tool and
asserts identical ids, order and prompt text. No sentence of fix copy may
exist in `netlify/functions/` (the `_plans.js` drift lesson).

**Card copy moves with it.** The P0 to P2 titles, descriptions and short fix
lines live in `aiVisibilityCopy.ts` and in the inline builder; both move behind
`buildFixItems` so MCP and the page cannot drift.

## 3. Tools

Rules 1 to 14 of `mcp-access.md` section 5.1 apply unless stated. Fix ids
are returned to the agent (it needs them to call `mark_fix_done`); they never
appear inside the `prompt` text, which stays identical to the clipboard copy.

### 3.1 `list_fixes` (read)

Arguments: `include_closed` boolean, default false; `limit` integer, default
20, max 50.

Data: the client row (name, website, `default_market_id`, plan,
`engines_enabled`), active prompts, the result map, and the client's
`fix_states` rows. **Scan:** newest first, keyset pages of 1,000 as in
section 5.1 rule 9, stopping when every active prompt x active engine cell
has its newest ok row or at the existing 25,000 row / 18 s ceiling. No date
window: the page has none, and a window would change which answer is
"latest" and so the list.

Returns:

```json
{
  "client_id": 57,
  "generated_at": "2026-11-20T09:00:00Z",
  "open": [
    {
      "fix_id": "prompt_gap:412",
      "priority": "P2",
      "status": "open",
      "title": "Not named for: ...",
      "summary": "No engine named <brand> in 7 answers; 7 of them named another brand instead.",
      "fix": "<the short fix line from the card>",
      "prompt": "<buildFixPrompt output, byte-identical to Copy as AI prompt>",
      "reopened": null
    }
  ],
  "closed": [
    {
      "fix_id": "engine_missing:claude",
      "status": "done",
      "title": "...",
      "marked_at": "2026-11-10T08:00:00Z",
      "recheck": { "state": "waiting", "ready_after": "2026-11-17T08:00:00Z" }
    }
  ],
  "truncated": false
}
```

`reopened` carries `{ marked_at, checked_at, before, after, metric }` when a
fix came back. `closed` is present only with `include_closed`. Annotations
`readOnlyHint: true`.

**Verdicts are not written by `list_fixes`.** It computes `recheck` with the
same `evaluateFix` and reports `{ "state": "verdict_due", "status":
"verified" | "reopened", "value": n }` when due; the dashboard records it on
the next page load, as today. Ruling 7 can change this.

### 3.2 `mark_fix_done` (write)

Arguments: `fix_id` string, required, matching the `fix_states` CHECK
`^[a-z_]{1,40}(:.{1,150})?$`; `note` optional string, at most 500 characters,
stored in the audit row only (section 5), never shown to other users.

Server steps, in order:

1. Key resolution, plan gate, rate limits as stage 1, plus the key's write
   scope (ruling 1) and the write plan gate (ruling 2). Failures are
   `isError: true` results with a plain sentence, not JSON-RPC errors.
2. Build the fix list (section 2). The `fix_id` must be in the current OPEN
   list (status open or reopened). Otherwise: "That fix is not open for this
   brand. Call list_fixes for the current ids." This stops an agent from
   inventing ids or writing rows for fixes that do not exist.
3. Baseline with `measureFix` on the same result map, exactly as the page.
4. Upsert `fix_states` on (`client_id`, `fix_id`) with `status = 'done'`,
   `title`, `metric_key`, `baseline_value`, `baseline_n`, and
   `marked_by_key` (section 4). Service role, so RLS is bypassed; the trigger
   still pins and stamps everything it does today.
5. One audit row (section 5).
6. Return:

```json
{
  "client_id": 57,
  "fix_id": "prompt_gap:412",
  "status": "done",
  "marked_at": "2026-11-20T09:01:12Z",
  "recheck_after": "2026-11-27T09:01:12Z",
  "baseline": { "metric": "Mention rate for \"...\"", "value": 0, "answers": 7 },
  "message": "Marked done. BrandGEO checks this again on the first collection after 27 November 2026."
}
```

Idempotent: marking a fix that is already done returns its existing row and
`already_done: true`, writes nothing and adds no audit row. Annotations
`readOnlyHint: false, destructiveHint: false, idempotentHint: true,
openWorldHint: false`.

Not in stage 2: dismiss, reopen, add prompt, run collection. Each is a later
tool with its own ruling.

## 4. Migration (stage 2, applied only on Constantin's go)

`db/supabase-mcp-fix-writes-<date>.sql`, additive:

1. `client_api_keys.scope text not null default 'read' check (scope in ('read','read_write'))`.
   Existing keys stay read only. The Account page asks at creation (ruling 1).
2. `fix_states.marked_by_key uuid null references client_api_keys(id)`.
3. `fix_states_guard()` amended: on the move into done or dismissed, when
   `auth.uid()` is null (service role, the MCP path) keep `new.marked_by_key`
   and leave `marked_by` null; when `auth.uid()` is set (dashboard) force
   `marked_by_key` to null; on every other update pin it to the old value.
   So a browser can never claim an MCP key, and MCP can never claim a user.
4. Read back as for `fix_states_2026_11_06`; the RLS probe repeats the
   viewer cases plus "viewer cannot set marked_by_key".

The dashboard's Done list shows "Marked done 20 Nov by an AI agent (key
<label>)" when `marked_by_key` is set; the key label comes from the client's
own `client_api_keys` rows, which the page already reads on Account.

## 5. Audit

One `client_events` row per successful write (default, ruling 4):
`type = 'mcp_fix_marked'`, `client_id`, `actor = client_api_keys.created_by`
(the person who created the key), `meta = { key_id, fix_id, note }`. Refused
writes are not stored, only logged on the one-line request log
(`outcome=<code>`), which already never logs keys or bodies; `fix_id` is
added to the loggable arguments.

## 6. Rate limits

Writes count in the existing per-key (60 a minute) and per-client (5,000 a
day) counters, plus one new counter, default ruling 3:
`mcp:client:<id>:writes:hour`, 60 writes an hour per client. A Fix This list
has at most about 16 open items (six kinds plus ten per-prompt gaps), so 60
an hour never blocks a real agent and stops a loop.

## 7. Rulings owed (defaults apply if he says "defaults")

| # | Question | Default |
|---|---|---|
| 1 | Write access per key, or per client? | Per key: a "read only" or "read and write" choice when the key is created; every existing key stays read only. |
| 2 | Which plans get write tools? | The same plans as MCP itself: Radar and up. Writes cost no LLM spend. |
| 3 | Write rate limit | 60 writes an hour per client, on top of the existing limits. |
| 4 | Audit row per write | Yes: one `client_events` row, `type = 'mcp_fix_marked'`, no new table. |
| 5 | Can an agent trigger a re-check or a collection from MCP? | No. Collection stays BrandGEO's own (budget, cooldown and the 7-day rule). |
| 6 | OAuth 2.1 for the claude.ai and ChatGPT connectors | Not in stage 2. Bearer keys only, which Claude Code, Cursor, Windsurf and VS Code accept today. OAuth is stage 3, its own spec (mcp-access.md section 11 lists what it needs). |
| 7 | Does `list_fixes` record due verdicts? | No: it reports them; the dashboard records them on the next load. Revisit if agent-only clients appear. |
| 8 | Is `mark_fix_done` limited to fixes in the current open list? | Yes (section 3.2 step 2). |

Not a ruling, recorded: `brandgeo/web/mcp.html` is still unpublished (its
stage 3 copy review failed, `docs/qa/mcp-web-stage3-review-2026-09-24.md`).
Users can only find MCP from the Account page until that is fixed; writes
make that page more worth publishing.

## 8. Build order once ruled

1. `bg-architect` amends this spec with the rulings (one pass).
2. `bg-app` (Sonnet): `src/lib/fixItems.ts` refactor, page switched to it,
   parity test; no visible change.
3. `bg-backend` (Opus, it is a write path and a migration): migration file,
   `list_fixes`, `mark_fix_done`, key scope in `client-api-keys.js`, audit,
   counters, tests (parity, idempotency, refused ids, scope, plan gate, rate
   limit, log never contains `bgmcp_`).
4. Migration applied on Constantin's go, read back, RLS probe.
5. `bg-app`: scope choice on key creation, "by an AI agent" line in the Done
   list.
6. `bg-verify` (Opus): full review, live probe with a test key against a
   test client, every write rolled back or cleaned.
7. One Netlify build, `BATCH_PUSH=1`, on his word. Migration before push.

Scale: `list_fixes` costs one scan per call (as `get_visibility_summary`
does today), `mark_fix_done` one scan plus two writes. No cron, no LLM call,
no collection.

## 9. Build contracts (2026-11-06, after the ruling)

Fixed here so the three builders cannot diverge. Anything not stated follows
sections 2 to 6.

### 9.1 Shared modules (bg-app)

- `src/lib/keysetRead.ts` (added after review M1): `readAllById(build, opts)`
  reads every row a query matches in keyset pages of 1,000 by id. The page's
  `ai_results` read and `mcp-server.js` `scanAllResults` both use it, so both
  build Fix This from every answer; before, the page saw only PostgREST's
  newest 1,000 rows and differed from MCP on client 1 (3,543 rows).
- `src/lib/markets.ts`: the `MARKETS` array (and its `Market` type) moved out
  of `marketContext.tsx`, which imports React. `marketContext.tsx`
  re-exports it, so no other import changes. Pure, no React.
- `src/lib/fixItems.ts`, pure, no React, no Supabase:
  - `buildFixResultMap(rows, activeEngines)` returns `{ results, errorEngines }`.
    It is the page's current `load()` logic moved verbatim: rows newest
    first by `checked_at`, engines outside `activeEngines` skipped,
    `isNoAnswerRow` rows skipped, first ok row per (prompt_id, engine) wins,
    an engine with error rows and no ok row goes into `errorEngines`. Rows
    for inactive prompts stay in the map, as today (the competitor and gap
    numbers on the cards read them).
  - `buildFixItems(input)` returns the ordered `FixItem[]` the page renders
    today, byte for byte. `input` = `{ brandName, engines: {id,label}[],
    prompts: {id,text,position}[] (active only), results, errorEngines,
    stateOf: (fixId) => FixStatus | undefined }`. Everything the inline
    builder derives today (engine status cards, `competitorFreq`,
    `gapCount`, `dimensions`) is derived inside from `input`.
  - `FixItem` moves here with `competitor` and `competitorAvgRank`.
  - Copy stays in `aiVisibilityCopy.ts` (pure), imported by `fixItems.ts`.
- Engine labels on both sides come from `ENGINE_META` in `planConfig.ts`.
  `mcp-server.js` requires `planConfig.ts` for this; `_plans.js`
  `ENGINE_LABELS` is not used for fix text.
- The page calls `buildFixResultMap` in `load()` and `buildFixItems` for the
  hub. Visible behaviour unchanged.
- Test `tests/fix_items.test.js`: fixture rows through `buildFixResultMap`
  and `buildFixItems` pin ids, order, titles and descriptions for every kind;
  a parity case asserts the page's old inline result equals the new one on
  the same fixture (copy the old builder into the test as the oracle).

### 9.2 Database (bg-backend writes the file; Constantin applies it)

`db/supabase-mcp-fix-writes-2026-11-06.sql`, exactly section 4: `scope` on
`client_api_keys` (default `read`), `marked_by_key uuid` on `fix_states`
referencing `client_api_keys(id)`, the amended `fix_states_guard()`. Plus
the read-back queries in the file. Nothing else.

Amended 2026-11-06 (review I4): one more change was needed and is in the
file. `client_events` carries a CHECK on `type` with eight values and no
`mcp_fix_marked`, so section 5's audit insert would have been refused; the
CHECK is rebuilt with the same eight plus `mcp_fix_marked`. No row changes.
The FK is NO ACTION, as section 4 says, not ON DELETE SET NULL: the guard
pins `marked_by_key` on update, which would leave a SET NULL row pointing at
a deleted key.

### 9.3 `client-api-keys.js` (bg-backend)

- `issue` accepts `scope`: `'read'` (default when absent) or
  `'read_write'`; anything else is 400 "Scope must be read or read_write.".
- `list` and `issue` return `scope` on every key row. An existing key's
  scope never changes; a different scope means a new key.

### 9.4 `mcp-server.js` (bg-backend)

- Key resolution also selects `scope` and `created_by`.
- `tools/list`: `list_fixes` for every gated key; `mark_fix_done` only when
  the key's scope is `read_write`. Write gate = the MCP plan gate (Radar and
  up), ruling 2.
- `tools/call mark_fix_done` with a read key: `isError: true`, "This key is
  read only. Create a read and write key on the BrandGEO Account page to let
  an agent mark fixes done."
- Data path for both tools: the client row (`name, brand_website,
  default_market_id, plan, engines_enabled, category, known_competitors`),
  active prompts (`id, text, position`), the client's `ai_results` (no
  window; newest first, keyset pages of 1,000, stop at 25,000 rows or 18 s,
  `truncated` in the output), `fix_states` for the client, then
  `buildFixResultMap`, `buildFixItems`, `buildFixPrompt` (market label from
  `markets.ts`), `evaluateFix`, `measureFix`. No fix sentence, id rule or
  metric is written in `netlify/functions/`.
- Write counter `mcp:client:<id>:writes:hour`, 3,600 s, 60, counted on
  `mark_fix_done` calls after the scope and plan gates.
- Upsert as the page does (`onConflict: 'client_id,fix_id'`, `status:
  'done'`, `title`, `metric_key`, `baseline_value`, `baseline_n`) plus
  `marked_by_key: key.id`. Already done: return the row with
  `already_done: true`, no write, no audit.
- Audit: `client_events` insert `{ client_id, actor: key.created_by, type:
  'mcp_fix_marked', meta: { key_id, fix_id, note } }`. A failed audit insert
  is logged and does not undo the mark.
- Log line adds `fix_id` to the loggable arguments; still never a key,
  prefix, hash, header, body or `note`.
- Tests in `tests/mcp_server.test.js` style with the in-memory fake: list
  parity with `buildFixItems` on a fixture, prompt text identical to
  `buildFixPrompt`, scope gate, plan gate, refused unknown or closed id,
  idempotency, write counter, audit row, log never contains `bgmcp_` or the
  note.

### 9.5 UI (bg-app, after 9.1)

- `McpAccessSection.tsx`: on issue, a choice "Read only" (default) or "Read
  and write (lets an agent mark fixes done)"; the key list shows each key's
  access. Existing keys read "Read only".
- AI Visibility Done list: when `marked_by_key` is set, "Marked done <date>
  by an AI agent (<key label>)"; the label is read from the client's own
  `client_api_keys` row (RLS already allows it), "an AI agent" alone when it
  cannot be read. `FIX_SELECT` gains `marked_by_key`.

### 9.6 Order

9.1, then 9.2 to 9.4 and 9.5 in parallel (disjoint files), then bg-verify,
then Constantin applies the migration (read back here), then one push with
`BATCH_PUSH=1` on his word. The page tolerates the migration not being
applied yet (a missing `marked_by_key` column fails the fix_states read,
which falls back to all open), but the push still waits for the migration.
