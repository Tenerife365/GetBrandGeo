# MCP stage 2: agents work the Fix This list

Status: SPEC ONLY, 2026-11-06. Nothing is built. Build waits on Constantin's
rulings in section 7; every question there carries the default that applies if
he says "defaults".

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
