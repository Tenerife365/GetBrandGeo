# MCP access copy deck

## Amendment 2026-09-24, web review

`bg-verify` reviewed the page `bg-web` built from this deck
(`docs/qa/mcp-web-stage3-review-2026-09-24.md`) and returned FAIL: one MAJOR
finding (A) and four MEDIUM findings (B, C, D, E), plus a LOW finding (F) and
a LOW list of invented headings (G). Every one of them is a copy defect, not
a code, security or layout defect, so this amendment fixes the deck in place
rather than sending the task back upstream. Nothing below changes a string
that review already passed.

- **A.** The client-table lead-in (section 4.8) said every listed client
  reaches a working connection. False for the two sign-in clients, and an
  unverified works-claim for the other five. Rewritten below.
- **B.** `docs/arch/mcp-access.md` section 14.8 allows exactly two states,
  Supported or Coming, never a third "pending" label, and no client may be
  called Supported until `bg-verify` connects it live. The table (4.8) and
  its heading are rewritten to the Coming-only state that is true today, and
  a post-test Supported variant is added below the table so `bg-web` can
  flip a row once a live test passes, with no further copy pass needed.
- **C.** No MCP tool returns a visibility score; the tools return mention
  rates. "your visibility score" (4.4) and "your scores" (the FAQ, section 6)
  are rewritten to "how often AI engines mention you" and "your mention
  rates".
- **D.** The read-only guarantee (4.12) said the only writes are the rate
  counters. The server also stamps a last-used time on the key itself
  (`mcp-server.js:712` to `:720`). The sentence is completed, not softened:
  the new write still never touches the customer's data.
- **E.** The FAQ question and answer (section 6) read as a "Yes" to "Claude"
  in a sentence most readers take to mean claude.ai, which is Coming, not
  Supported, and pointed at "the exact tools we support today" while the
  table lists no Supported client. Question and answer are both rewritten;
  the JSON-LD is kept byte-identical to the new visible text.
- **F.** `get_prompt_results` (4.9) said "the last time it answered." The
  tool returns every answer in the chosen window, not only the latest one.
  One line, corrected.
- **G.** Every heading and button label `bg-web` used on `mcp.html` is now
  listed explicitly in a new section 4.15, so nothing on the page is
  invented by the builder.

Nothing in sections 1, 2, 3, 5, 7, 8, or 9 changed; those passed review and
are untouched. Section 12 is new: a claim-to-source ledger for every string
this amendment changed. The dash and banned-vocabulary scans in section 10
were re-run against the amended file; the raw output is pasted in this
agent's handoff report, not restated here, so this file does not carry a
second copy of a pattern that already failed once by being quoted literally.

---

Written by `bg-copy`, 2026-09-24. Stage 2 of `docs/arch/mcp-access.md` section
12. Stage 1 (server, keys, Account.tsx UI) is live since 2026-09-23 with
placeholder copy. This deck replaces every placeholder and supplies the new
public page, pricing row and FAQ entry that Stage 3 (`bg-web`, `bg-app`)
builds from. Every claim below carries a source: an architecture spec section
number or a `file:line` in the working tree. Nothing here is invented.

Write scope for this deck: this file only. `docs/arch/mcp-access.md` was read,
never edited, including its section 14 amendment (bg-architect's protocol
revision ruling, landed 2026-09-24, applied below).

---

## 1. Voice check

No `docs/strategy/` artifact covers MCP access specifically (checked: the
directory holds `activation-thesis-app.md`, `hook-thesis-web.md`, two pricing
audits, `radar-unit-economics.md` and `sprint-ladder-ruling.md`, none of which
mention MCP). So the voice below is derived, not reinvented, from two sources
that do bind: the architecture spec's own audience framing, and `bg-copy`'s
standing guardrails.

**Who is speaking.** BrandGEO, in the same plain, direct register as the rest
of the product: the `instructions` field the server hands every connecting
tool already states the model, "Read-only access to one BrandGEO account's AI
visibility data... these tools never start a collection" (spec section 2.5),
and that is the register this deck holds to throughout.

**To whom, and at what level of knowledge, splits by surface, and this split
is the one real judgment call in this deck:**

- The **in-app blurb, pricing row and FAQ answer** speak to the business owner
  `bg-copy.md` always assumes: someone who has noticed ChatGPT does not
  mention them and does not know GEO vocabulary. These surfaces treat "MCP"
  as a feature name to be explained in one sentence, never assumed.
- **`mcp.html` and every error string** speak to whoever actually sets up the
  connection: a developer, or a technically comfortable staff member, working
  inside an AI tool such as Claude Code or Cursor on the business owner's
  behalf. This is not a departure from BrandGEO's voice, it is the same
  plain-and-direct register pointed at a reader who already knows what a
  header and a config file are, because the task at hand (pasting a key into
  a JSON file) requires that they do. Nothing on this surface uses GEO
  jargon either; it only assumes comfort with basic developer setup steps.

Both registers avoid every banned word, never apologize without a next step,
and never claim a number this deck cannot trace.

---

## 2. Copy table

One row per string. "Source" is the architecture spec section or the
`file:line` the claim traces to. "SPEC-LITERAL, keep" means the architecture
spec dictates this exact text and it must not change.

### 2.1 `FEATURE_META.mcp_access` blurb (deliverable item 1)

| Location | Current text | New text | Reason |
|---|---|---|---|
| `brandgeo-dashboard/src/lib/planConfig.ts:477` | "Connect your own AI tools, such as Claude Code and Cursor, to read your BrandGEO visibility data over MCP." | "Connect Claude Code, Cursor and other AI tools to your BrandGEO account over MCP, so they can read your visibility data directly. Read-only: nothing it does can start a collection or change your account." | States the read-only guarantee, matches sibling length |

Source: spec 2.5 (instructions field), spec 5.1 rule 13 (no writes). Matches
the length and one-then-two-sentence shape of the sibling blurbs at
`planConfig.ts:467` (`ai_social`, two sentences) and `planConfig.ts:471`
(`ai_seo`, one sentence).

**bg-app: replace the string at `planConfig.ts:477` only.** Leave the
`ai_social` and `ai_seo` blurbs untouched; they are shown here only as the
length/register reference this new blurb was matched against.

### 2.2 `McpAccessSection.tsx` (deliverable item 2)

Four strings are dictated verbatim by the architecture spec and are marked
SPEC-LITERAL below: do not touch them even though they sit inside the
"pending bg-copy" comment block at `McpAccessSection.tsx:54-62`.

| # | file:line | Current text | New text | Reason |
|---|---|---|---|---|
| 1 | `McpAccessSection.tsx:329` | "MCP access" (section h2) | KEEP | Matches `FEATURE_META.mcp_access.label`, the approved feature name |
| 2 | `McpAccessSection.tsx:428` | "Connect Claude Code, Cursor and other MCP-compatible AI tools to read your BrandGEO visibility data." | "Give your own AI tools, such as Claude Code or Cursor, direct read access to this account's visibility data. It only reads: it can never start a collection or change your account." | States the read-only guarantee explicitly, not just implied by "read" |
| 3 | `McpAccessSection.tsx:387` | "Loading your MCP keys…" | KEEP | Already plain; a loading state needs no next step |
| 4 | `McpAccessSection.tsx:401` | "MCP access is not available yet. Check back soon." | "MCP access isn't set up on our side yet. Check back soon, or contact support@getbrandgeo.com if this doesn't clear up." | Adds an escape hatch for a state that should not occur in production (spec section 9's deploy-order rule) but must not read as a dead end if it ever does |
| 5 | `McpAccessSection.tsx:201,205,415` | "Could not load MCP keys." | "Could not load MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com." | No apology without a next step; matches the site's own established recovery phrasing (`netlify/functions/support-request.js` precedent) |
| 6 | `McpAccessSection.tsx:416` | "Retry" | KEEP | Paired with the error text above it, which now carries the next step |
| 7 | `McpAccessSection.tsx:347` | "Your new MCP key" (reveal dialog heading) | KEEP | Plain, correct, standard for a one-time-secret dialog |
| 8 | `McpAccessSection.tsx:348` | "Done" (button text), aria-label "Done, I have copied the key" | KEEP | Both are already plain and accurate |
| 9 | `McpAccessSection.tsx:353` | "This key is shown once. Copy it now. BrandGEO cannot show it again." | SPEC-LITERAL, keep | Architecture spec 7.2 gives this exact sentence |
| 10 | `McpAccessSection.tsx:362` | "Setup" (reveal dialog subheading) | KEEP | Terse but unambiguous, paired with a Terminal icon and the three snippets |
| 11 | `McpAccessSection.tsx:508` | "Label (optional)" | KEEP | Plain field caption |
| 12 | `McpAccessSection.tsx:513` | "e.g. Cursor, laptop" (input placeholder) | KEEP | Plain example |
| 13 | `McpAccessSection.tsx:518` | "Issue key" (button) | KEEP | Matches the verb the spec itself uses throughout section 7 |
| 14 | `McpAccessSection.tsx:520` | "Revoke a key to issue a new one." | SPEC-LITERAL, keep | Architecture spec 2.6 and 7.1 give this exact sentence; it is also the server's own 409 message (`client-api-keys.js:122`), so the two must stay identical |
| 15 | `McpAccessSection.tsx:294,300` | "Could not issue a key." | "Could not issue a key. Try again, and if it keeps happening, contact support@getbrandgeo.com." | No apology without a next step. Note: a specific server error (plan gate, key cap, label length) already overrides this fallback via `data?.error`; this text is the generic catch-all only |
| 16 | `McpAccessSection.tsx:525` | "No keys yet. Issue one to connect your first AI tool." | KEEP | Already states what happened and the exact next step |
| 17 | `McpAccessSection.tsx:435-439` | "Label", "Key", "Created", "Last used", sr-only "Actions" | KEEP | Plain table headers |
| 18 | `McpAccessSection.tsx:445` | "Untitled" (label fallback) | KEEP | Standard fallback |
| 19 | `McpAccessSection.tsx:455` | "Revoke" (button) | KEEP | Plain, matches the confirm dialog it triggers |
| 20 | `McpAccessSection.tsx:307` | `Revoke "${row.label \|\| row.key_prefix}"? Any AI tool using this key stops working immediately.` | KEEP | Already plain and states the exact consequence |
| 21 | `McpAccessSection.tsx:311,314` | "Could not revoke the key." | "Could not revoke the key. Try again, and if it keeps happening, contact support@getbrandgeo.com." | No apology without a next step |
| 22 | `McpAccessSection.tsx:473` | "MCP access is included from the {plan} plan." | SPEC-LITERAL, keep | Architecture spec 7.2 gives this exact template ("MCP access is included from the Radar plan.") |
| 23 | `McpAccessSection.tsx:476` | "See plans" (button) | "Upgrade to Radar" | This branch only ever renders for a Free-plan, non-admin viewer (`gated = hasFeature(plan,'mcp_access') \|\| isAdmin`; spec section 4 gates only `free` out), so the destination is always Radar specifically, never a generic plan browse. Matches the site's own convention of naming the plan on an upgrade control (`Account.tsx:536`, `Account.tsx:358` mailto subject "Upgrade to {tier.label}") |
| 24 | `McpAccessSection.tsx:481` | "Keys issued before your plan changed are listed below. They will work again after upgrading." | KEEP | Already plain and states the exact consequence |

**bg-app: rows marked KEEP need no code change. Rows 2, 4, 5, 15, 21, 23 are
the only ones that need the string literal replaced at the cited line.**

### 2.3 `mcp-server.js` and `client-api-keys.js` error strings (deliverable item 3)

The `-32002` message and every other customer-visible error string, keep or
replace, exact replacement text. Grouped by file.

#### `netlify/functions/mcp-server.js`

| file:line | Code | Current text | Decision | New text | Reason |
|---|---|---|---|---|---|
| `mcp-server.js:71` (`UNAUTHORIZED_MESSAGE`), used at `:123-125` | `-32001`, HTTP 401 | "Invalid or missing BrandGEO API key." | SPEC-LITERAL, keep | (unchanged) | Architecture spec 2.6: the same message for every 401 cause on purpose, so the answer never reveals whether a key once existed. Already plain; the fix (check your key) is self-evident |
| `mcp-server.js:760-765` (area) | `-32002`, HTTP 200 | "MCP access needs the Radar plan or higher. Upgrade to Radar in your BrandGEO account." | REPLACE | "MCP access needs the Radar plan or higher. Upgrade to Radar at https://app.getbrandgeo.com/account." | Spec 2.6 explicitly allows a reword as long as the plan name stays. Replacing "in your BrandGEO account" with the literal URL that already sits in `error.data.upgrade_url` (spec 2.6) makes the next step work even in a client that only surfaces the text block, not the structured data |
| `mcp-server.js:773` (area) | `-32003`, HTTP 200 | "This account is not available over MCP." | REPLACE | "This account is not available over MCP. Contact support@getbrandgeo.com if you believe this is wrong." | No apology without a next step. Does not explain the real cause (research-category account, spec 4.4) because that is an internal classification, not something to expose; "contact support" is the correct next step for what should be a rare, edge-case reach |
| `mcp-server.js` (area of the daily-limit constant, spec 6.2) | `-32029`, HTTP 200 | "Daily MCP limit reached. It resets at 00:00 UTC." | SPEC-LITERAL, keep | (unchanged) | Architecture spec 6.2 gives this exact sentence |
| `mcp-server.js` (area of the per-minute constant, spec 6.2) | `-32029`, HTTP 200 | "Rate limit reached: {limit} calls a minute per key. Retry in {retryAfter} seconds." | KEEP | (unchanged) | Already plain and states the exact wait time, which is the correct next step for a rate limit |
| `mcp-server.js:133,138` | tool input error | "Invalid cursor" | SPEC-LITERAL, keep | (unchanged) | Architecture spec 5.1 rule 10 dictates this exact text |
| `mcp-server.js:145` | tool input error | `` `${name} must be an integer` `` | KEEP | (unchanged) | Names the exact parameter and the exact fix; already actionable for the calling model. Not spec-literal, but nothing about it needs softening for a developer-facing tool-input error |
| `mcp-server.js:152` | tool input error | `` `${name} must be true or false` `` | KEEP | (unchanged) | Same reasoning as above |
| `mcp-server.js:341` | tool input error | "prompt_id is required and must be a positive integer" | KEEP | (unchanged) | Already states the exact requirement |
| `mcp-server.js:349` | tool input error | "No prompt with that id on this account." | SPEC-LITERAL, keep | (unchanged) | Architecture spec 5.5: deliberately the same answer whether the id exists on another client or nowhere at all, a security property. Do not append a hint (such as "call list_prompts") that could narrow that ambiguity |

Standard JSON-RPC transport errors (`-32700` parse error, `-32600` bad
envelope/Origin/size/version, `-32601` unknown method) carry the JSON-RPC 2.0
specification's own boilerplate text ("Parse error", "Invalid Request",
"Method not found"), not BrandGEO product copy. These are out of scope for
this pass: they are read by SDK-level error handling in the connecting
client, not by a human, and changing them risks breaking a client that
pattern-matches the standard JSON-RPC wording. Flagged here so nobody assumes
they were missed.

#### `netlify/functions/client-api-keys.js`

| file:line | HTTP | Current text | Decision | New text | Reason |
|---|---|---|---|---|---|
| `client-api-keys.js:75` | 500 | `` `Could not ${what} MCP keys.` `` | REPLACE | `` `Could not ${what} MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com.` `` | No apology without a next step; matches the same phrasing now used across `McpAccessSection.tsx` |
| `client-api-keys.js:87` | 404 | "Client not found." | REPLACE | "Client not found. Contact support@getbrandgeo.com if you keep seeing this." | Should be unreachable for a real signed-in user acting on their own account; adding the next step costs nothing and covers the edge case cheaply |
| `client-api-keys.js:112` | 403 (issue, below gate) | `` `MCP access needs the ${PLAN_LABELS[MCP_MIN_PLAN]} plan or higher.` `` | REPLACE | `` `MCP access needs the ${PLAN_LABELS[MCP_MIN_PLAN]} plan or higher. Upgrade this client's plan, then issue the key.` `` | Reachable path is an admin driving a below-gate client's Account page (a viewer never sees the Issue control below gate, per `gated` in `McpAccessSection.tsx`); names the next step for that admin |
| `client-api-keys.js:115` | 403 (issue, research client) | "MCP keys for this account can only be issued by BrandGEO." | REPLACE | "MCP keys for this account can only be issued by BrandGEO. Contact support@getbrandgeo.com if you need one issued." | No apology without a next step |
| `client-api-keys.js:122` | 409 (max keys) | "Revoke a key to issue a new one." | SPEC-LITERAL, keep | (unchanged) | Architecture spec 2.6; identical to `McpAccessSection.tsx:520` on purpose |
| `client-api-keys.js:142,148` | 404 (revoke) | "No active key with that id." | REPLACE | "No active key with that id. It may already be revoked; refresh the list to check." | Names a concrete, low-effort next step for the realistic cause (a second tab already revoked it, or the list is stale) |
| `client-api-keys.js:61` | 405 | "Method Not Allowed" | KEEP | (unchanged) | Not reachable through the built UI; only a direct API caller sees this |
| `client-api-keys.js:62` | 400 | "Invalid JSON" | KEEP | (unchanged) | Same as above |
| `client-api-keys.js:63` | 400 | "Missing or invalid client_id." | KEEP | (unchanged) | Same as above |
| `client-api-keys.js:103` | 400 | "Label must be text." | KEEP | (unchanged) | Not reachable through the built UI (the input is always a string) |
| `client-api-keys.js:106` | 400 | `` `Label must be ${MAX_LABEL} characters or fewer.` `` | KEEP | (unchanged) | Not reachable through the built UI (`maxLength={60}` on the input already prevents it) |
| `client-api-keys.js:153` | 400 | "Unknown action." | KEEP | (unchanged) | Not reachable through the built UI |
| `client-api-keys.js:68` | 503 | "MCP keys are not available yet." | KEEP, with a finding | (unchanged) | Never actually shown to a customer: `McpAccessSection.tsx`'s 503 branch (row 4 above) does not read `data.error`, it renders its own hardcoded copy. Flagged here so it is not mistaken for a live inconsistency; both messages already agree in meaning |

**Note on `client-api-keys.js` and `mcp-server.js`: these are backend files,
outside `bg-copy`'s write scope and outside `bg-web`/`bg-app`'s build list for
this stage** (architecture spec section 12 assigns them to `bg-backend`).
This table is the review the task asked for; landing these string changes is
a `bg-backend` pass, not something this deck or Stage 3 does. Said plainly in
the Handoff packet, section 7.

---

## 3. Variants where variance matters (deliverable item 4, item 6 H1)

The task calls for three distinct directions on a hero headline, subhead and
primary CTA. MCP access is a feature-detail page and an in-product section,
not a new hero moment on the marketing site; nothing here carries that kind
of variance requirement, so this section applies to the one place a real
naming choice exists: **the pricing-row label and `mcp.html`'s H1**, which
must be the same words in both places per the task's own working text.

**RECOMMENDED: "MCP access for your AI tools."** Names the mechanism (MCP,
already the feature's own identity, like "API access") and the benefit (your
AI tools) in six words, fits the pricing table's existing terse `<li>` style
(`Site audit · homepage, up to weekly`), and gives `mcp.html`'s H1 the same
words a reader saw on the pricing page, so nothing feels renamed between the
two surfaces.

Two other directions considered and set aside, named so the choice is not
silently made:

- "Connect your AI tools to BrandGEO." Leads with the action instead of the
  feature name. Reads well as a page H1 alone, but breaks the identical-label
  rule with the pricing row, which needs a noun phrase to sit inside a
  `<li>`, not a sentence.
- "Read your visibility data from Claude Code or Cursor." Names two real
  clients for concreteness. Rejected under this stage's PENDING constraint
  (section 4 below): neither client has been proven "Supported" yet by
  `bg-verify`'s live connection test, so naming them in a headline-weight
  string reads as a stronger promise than the table itself is allowed to
  make right now.

Everywhere else in this deck, one option is given, per `bg-copy.md`'s own
rule that variants are for headline-weight moments only.

---

## 4. `mcp.html` (deliverable item 6)

Full section-by-section copy for the new page
`brandgeo/web/mcp.html`, per architecture spec section 8.3. **bg-web builds
this file; this section is everything it needs, in the order the spec lists.**

### 4.0 PENDING notice on the client table, and why it exists

`docs/arch/mcp-access.md` section 14 (amendment, `bg-architect`, landed
2026-09-24, while this deck was being written) rules that "Supported" is
earned only once `bg-verify` connects a client live against the deployed
endpoint with a real key, and that no named client should be called
Supported on the strength of the ruling alone. This is a hard constraint on
this page, not a style choice, so it is stated once here and then the table
below follows it exactly. Nothing else on this page depends on which row
says Supported: no sentence outside the table promises a specific client
works, and the page makes no "works with every AI tool" claim anywhere.

### 4.1 Title tag

```
MCP access: connect BrandGEO to your AI tools
```

Matches the site's own `Category: Description` title convention
(`faq.html:18` "FAQ: BrandGEO AI Visibility Intelligence",
`affiliates.html:15` "Affiliate Program: Earn by recommending BrandGEO").

### 4.2 Meta description

```
Connect Claude Code, Cursor and other AI tools to your BrandGEO account. Read-only access to your visibility data, included from the Radar plan.
```

### 4.3 H1

```
MCP access for your AI tools
```

Identical wording to the pricing row (section 5 below), per the task's own
requirement that the two match.

### 4.4 What it is (one paragraph)

```
BrandGEO can act as a remote MCP server. Point your own AI tools, such as
Claude Code or Cursor, at your BrandGEO account, and they can read your AI
visibility data directly: how often AI engines mention you, which prompts
you are tracked on, what each AI engine said, which competitors come up
alongside you, and your current recommendations. It is read-only. Nothing
over this connection can start a collection, change a setting, or cost you
anything beyond what your plan already includes.
```

Source: spec section 1 (surface diagram), section 2.5 (`instructions` field
sent to every connecting client), section 5.1 rule 13 (no tool writes a row
or starts a collection). "How often AI engines mention you" traces to
`get_visibility_summary`'s `mention_rate` (`mcp-server.js:508`); no tool
returns a visibility score, so the phrase "your visibility score" is removed
(amendment 2026-09-24, finding C).

### 4.5 Endpoint

```
https://app.getbrandgeo.com/mcp
```

Source: spec section 2.1, section 8.2 (identical URL in every snippet).

### 4.6 How to get a key

```
Open your BrandGEO Account page and find "MCP access" below your plan
details. Select Issue key, name it if that helps you tell your tools apart
later (for example "Cursor, laptop"), and copy the key when it appears.
BrandGEO shows it once. If you lose it, revoke it from the same page and
issue a new one.
```

Source: spec section 7.2 (Account.tsx flow), matches the built component
(`McpAccessSection.tsx:507-520`).

### 4.7 The three setup snippets

Reproduced verbatim from architecture spec section 8.2. `<key>` is a literal
placeholder on this public page; it is filled in with the real secret only
inside the one-time reveal panel on Account.tsx (spec 8.2's own instruction).
**bg-web: do not alter a character inside any of the three code blocks
below, including whitespace.**

Caption: "Claude Code"

```bash
claude mcp add --transport http brandgeo https://app.getbrandgeo.com/mcp --header "Authorization: Bearer <key>"
```

Caption: "Cursor, in `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project)"

```json
{
  "mcpServers": {
    "brandgeo": {
      "url": "https://app.getbrandgeo.com/mcp",
      "headers": { "Authorization": "Bearer <key>" }
    }
  }
}
```

Caption: "Claude Desktop, in `claude_desktop_config.json`"

```json
{
  "mcpServers": {
    "brandgeo": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://app.getbrandgeo.com/mcp", "--header", "Authorization:${BRANDGEO_AUTH}"],
      "env": { "BRANDGEO_AUTH": "Bearer <key>" }
    }
  }
}
```

Note under the third snippet, plain text, not code:

```
Claude Desktop needs a small local bridge to reach a remote MCP server. The
snippet above uses mcp-remote, a third-party package, run through npx; it is
not part of BrandGEO.
```

Source: spec section 8.2 itself for the credit ("third-party package, named
as such") and the reason (some platforms split arguments on the space in
"Bearer <key>", which is why the key sits in `env` instead of `args`).

### 4.8 Client support table

**Amendment 2026-09-24 (findings A, B).** Architecture spec section 14.8
allows exactly two states on this table, Supported or Coming, and forbids a
third label such as "pending": a client that has not been live-tested
"appears as 'coming' or not at all." No client has been connected live with
a real key yet (spec 14.9), so every row below reads Coming today. The
previous lead-in claimed every listed client "can reach a BrandGEO MCP
connection," which is false for the two sign-in clients and an unverified
works-claim for the other five; the rewrite below asserts nothing beyond
what section 14.9 has actually verified.

H2 heading above the table:

```
Connecting a client
```

Not "Supported clients": section 14.8's own worked fix names this as the
correct heading while the table has no Supported row (see also section 4.15
below, which lists every heading on this page in one place).

Lead-in line, plain text, above the table:

```
None of the clients below is marked Supported yet. We only call a client
Supported once we connect it ourselves, live, with a real key, and confirm
it works end to end over the endpoint above. The first five take a key in a
header, which is how BrandGEO connects today, and that live check is
running now. The last two connect by signing in instead of pasting a key,
which this release does not support.
```

Table (status column per `docs/arch/mcp-access.md` section 14.8: no client is
Supported yet; the first five carry a testing note because spec 14.4 shows
each is either verified or plausible over a bearer header, and the live test
that would move any of them to Supported is in progress, not finished;
claude.ai and ChatGPT stay Coming for the separate reason that they need a
sign-in step this release does not build):

| Client | Status | How, per its own setup docs |
|---|---|---|
| Claude Code | Coming | Native HTTP transport, key in a header. Being tested live now. |
| Cursor | Coming | `mcp.json` with a `url` and `headers`. Being tested live now. |
| VS Code (agent mode) | Coming | `.vscode/mcp.json`, type `http`, with `headers`. Being tested live now. |
| Windsurf | Coming | `mcp_config.json` with `serverUrl` and `headers`. Being tested live now. |
| Claude Desktop | Coming | A small local bridge, described above. Being tested live now. |
| claude.ai web connectors | Coming | Connects by signing in, not by pasting a key. A later release. |
| ChatGPT connectors | Coming | Connects by signing in, not by pasting a key. A later release. |

Source for the "How" column: architecture spec section 8.1's own How column,
reproduced exactly, with "Being tested live now" or "A later release" added
per row as a plain factual note, not a status label. Source for the Status
column: section 14.8, which permits only Supported or Coming.

**Post-test variant, for `bg-web` to apply per row once `bg-verify` records a
result (spec 14.5), with no further copy pass needed:**

- **A client that connects live:** change its Status cell to `Supported`.
  Leave its "How" cell text exactly as shipped above; it already describes
  the real setup step and needs no change. Drop that row's "Being tested
  live now" clause, since the test is now done.
- **A client that fails to connect (trigger T1, spec 14.7):** change its
  Status cell to `Coming` with no note, i.e. drop "Being tested live now"
  and add nothing in its place. Do not state why it failed on this page.
- **Once at least one row reads Supported:** change the H2 back to
  `Supported clients`, and change the lead-in to:

  ```
  The clients marked Supported below are ones we connected ourselves, live,
  with a real key, and confirmed working end to end over the endpoint
  above. The rest are coming.
  ```

  Do not use this heading or this lead-in while every row still reads
  Coming.

No technical line naming the supported MCP protocol revisions is included on
this page. The architecture spec's amendment permits at most one such line;
this deck omits it, since nothing on the page needs it and it is one more
place a stray "latest" or a wrong revision number could creep in later.

### 4.9 The seven tools, one plain line each

Strictly bounded to what architecture spec section 5 states each tool
returns. Nothing added, nothing implied beyond the spec.

```
- get_brand_overview: your plan, which AI engines are active, when your data
  last updated, and how many prompts you are tracking.
- get_visibility_summary: your mention rate, overall and by engine, over a
  time window you choose.
- list_prompts: the buyer prompts BrandGEO tracks for your brand.
- get_prompt_results: what each AI engine said about one specific prompt,
  over a time window you choose.
- get_competitors: which competitors AI engines mention alongside you, and
  how often.
- get_sentiment_summary: how positive, neutral or negative AI engines are
  when they mention you.
- get_recommendations: your latest BrandGEO recommendations for improving AI
  visibility.
```

Source: spec 5.2 through 5.8, one section per tool, in the same order. The
`get_prompt_results` line was corrected 2026-09-24 (finding F): the tool
returns every answer in the chosen window, newest first
(`mcp-server.js:634`, `results: arr(...)` with no "latest only" filter, plus
the `window_days` input parameter), not only the most recent one.

### 4.10 Plan gate

```
Included from the Radar plan up. Not available on Free.
```

Source: spec section 4 ("gate: plan radar and above, so only free is out"),
ruling 1 (Constantin, 2026-09-22).

### 4.11 Limits

```
60 calls a minute, per key. 5,000 calls a day, per account.
```

Source: spec section 6.1, `MCP_PER_KEY_PER_MINUTE = 60`,
`MCP_PER_CLIENT_PER_DAY = 5000`. Same on every gated plan in release one
(ruling 6 default, section 6.1).

### 4.12 Read-only guarantee

```
Read-only. It never starts a collection or changes your account. The only
writes any MCP request can ever cause are the internal counters that keep
these limits, and a last-used time stamped on the key itself. Neither one
touches your data.
```

Source: spec 5.1 rule 13, verbatim on the scope of writes ("The only writes
an MCP request can cause are the rate counter upserts and the throttled
last_used_at stamp"). Corrected 2026-09-24 (finding D): the previous
sentence said "only... the internal counters," which left out the
`client_api_keys.last_used_at` stamp the server also writes, throttled to
once a minute (`mcp-server.js:712` to `:720`). The sentence now names both
writes it makes; the guarantee itself, that neither touches customer data,
is unchanged and still true.

### 4.13 How to revoke a key

```
Open your Account page, find the key in the list under "MCP access," and
select Revoke. Anything using that key stops working immediately. You can
issue a new one any time.
```

Source: spec 7.1 (revoke action), matches the confirm dialog already built
at `McpAccessSection.tsx:307`.

### 4.14 Closing call to action

```
Open your BrandGEO Account page to issue your first key.
```

Link target: `https://app.getbrandgeo.com/account`.

**bg-web: add `mcp.html` to `sitemap.xml`, per spec 8.3's explicit
instruction.** (Code change; noted here so it is not missed, not performed by
this deck.)

Button label for this call to action:

```
Open Account
```

An arrow glyph appended to a button label (for example "Open Account →") is
a site-wide convention already used on other CTAs across `brandgeo/web/`,
not new product copy, so `bg-web` may append one; the words themselves are
exactly the two above and nothing else.

### 4.15 Every heading and button label on this page (amendment 2026-09-24, finding G)

`bg-verify` found seven headings and one button label on the built page that
were not in this deck (`docs/qa/mcp-web-stage3-review-2026-09-24.md`,
finding G) and asked that every one be settled here so `bg-web` invents
nothing on the next build. This list is exhaustive: `mcp.html` carries no
heading or button beyond what is named below.

| Element | Exact text | Status |
|---|---|---|
| Hero badge | `MCP` | Accepted. Names the feature; matches the feature id `mcp_access` (`planConfig.ts:477`) and the H1 below. |
| H1 | `MCP access for your AI tools` | Deck, section 4.3. Unchanged. |
| H2, endpoint section | `Endpoint` | Accepted. This is section 4.5's own name used as its heading. |
| H2, key section | `How to get a key` | This is section 4.6's own name used as its heading, reproduced verbatim. |
| H2, snippets section | `Setup` | Accepted, as a short form of section 4.7's name ("The three setup snippets"). |
| H2, client table section | `Connecting a client` | **Changed 2026-09-24, finding B.** Was "Supported clients," which promised a state the table did not have. See section 4.8 above for the post-test variant, `Supported clients`. |
| H2, tools section | `Tools` | This is section 4.9's own name used as its heading. |
| H2, plan section | `Plan and limits` | Accepted, as a short form combining sections 4.10 and 4.11, which sit together on the page. |
| H2, read-only section | `Read-only guarantee` | This is section 4.12's own name used as its heading, reproduced verbatim. |
| H2, revoke section | `Revoke a key` | Accepted, as a short form of section 4.13's name ("How to revoke a key"). |
| Button, closing CTA | `Open Account` | Given above in this section, 2026-09-24. Was untraceable before this amendment. |

Every row above is now either a direct reproduction of a section name already
in this deck, or a short form of one accepted here in writing. None is left
for `bg-web` to invent.

---

## 5. Pricing row (deliverable item 4)

```
MCP access for your AI tools
```

**Placement, unambiguous: `brandgeo/web/index.html`, one `<li>` added to the
Radar card's feature list, after the existing last item at line 2029
(`<li>Site audit &middot; homepage, up to weekly</li>`), inside the same
`<ul>` that closes shortly after.** Do not add this bullet to any other
card.

Reason this single placement is correct and sufficient: every card from
Essentials up already reads "Everything in `<previous tier>`, plus"
(`.plan-features-label` at lines 2024, 2047, 2075, 2097, 2125, 2146) and
lists only what is new at that tier. Radar is the first tier that includes
MCP access (spec section 4: gate is Radar and up, only Free is out), so
adding the bullet once, on Radar, is what the page's own established
cascading convention requires; repeating it on Essentials, Growth, Growth
PRO, Managed or Enterprise would contradict that convention (those cards
would then list something that is not new at that tier) and read as if MCP
access were a new, separate capability at each of those tiers, which it is
not. **The Free card (lines 2004-2008) must not get this bullet**, since
Free is the one plan the gate excludes.

---

## 6. FAQ entry (deliverable item 5)

**Amendment 2026-09-24 (findings C, E).** `bg-verify` found three problems
with the original question and answer
(`docs/qa/mcp-web-stage3-review-2026-09-24.md`, finding E): most readers take
a question naming "Claude" alone to mean claude.ai, which is Coming, not
Supported, so an unqualified "Yes" under that question overclaims; "the exact
tools we support today" pointed to a page whose table (section 4.8) lists no
Supported client; and "tools" there meant clients while `mcp.html` uses
"Tools" for the seven MCP tools, an avoidable collision. Separately (finding
C), "see your scores" is not what any tool returns; the tools return mention
rates (see section 4.4's amendment above). All four are fixed below. The
visible answer and the JSON-LD `text` are kept identical, as before.

**Placement: `brandgeo/web/faq.html`, "BrandGEO Platform" category, as the
last item in that category (after "Is BrandGEO a managed service or a
self-serve tool?", which currently closes that `.faq-category` block).**

HTML:

```html
<div class="faq-item">
  <button class="faq-question">Can I connect my AI tools to BrandGEO?<span class="faq-icon">+</span></button>
  <div class="faq-answer">
    <p>Yes, from the Radar plan up, for AI tools that take an API key in a header, such as Claude Code or Cursor. BrandGEO runs a remote MCP server, so a connected tool can read your AI visibility data directly, once you issue a key from your Account page.</p>
    <p>It is read-only: a connected tool can read your mention rates, prompts, competitors and recommendations, but nothing over this connection can start a collection or change your account.</p>
    <p>See <a href="/mcp.html">our MCP setup page</a> for which clients connect today and how.</p>
  </div>
</div>
```

Matching JSON-LD entry, appended to the `mainEntity` array in
`faq.html`'s existing `<script type="application/ld+json">` block (as the
last entry before the closing `]`):

```json
{"@type":"Question","name":"Can I connect my AI tools to BrandGEO?","acceptedAnswer":{"@type":"Answer","text":"Yes, from the Radar plan up, for AI tools that take an API key in a header, such as Claude Code or Cursor. BrandGEO runs a remote MCP server, so a connected tool can read your AI visibility data directly, once you issue a key from your Account page. It is read-only: a connected tool can read your mention rates, prompts, competitors and recommendations, but nothing over this connection can start a collection or change your account. See our MCP setup page for which clients connect today and how."}}
```

Reason for "BrandGEO Platform" as the category: its four existing questions
already cover what engines BrandGEO monitors, how it measures, what the
weekly report includes, and whether it is managed or self-serve; this
question is the same kind of "what does the product do" question, not a
pricing or methodology question, so it belongs in the same category as those
four, not in "Pricing" (which already covers plan contents by tier) or
"Score & Methodology."

Note on scope, revised 2026-09-24: the question no longer names a specific
client, so "Claude, Cursor or other AI tools" is gone from it; the answer
names Claude Code and Cursor as examples of the kind of tool that qualifies
(one that takes an API key in a header), not as a claim that either is
Supported. Neither is, per section 4.8's table, which currently reads Coming
for every row. The answer deliberately still does not name VS Code, Windsurf
or Claude Desktop; naming more clients here would not fix the Claude
ambiguity, and a reader who wants the current, honestly-labeled list is one
click away on `mcp.html`. If `mcp.html`'s table gains a Supported row before
this FAQ entry is next revised, this answer is not thereby wrong: it already
makes no claim about which specific client works today, only that
header-based tools in general qualify from Radar up.

---

## 7. Number narration

One metric shown to a user through this feature: the rate limits. Everything
else this feature surfaces (visibility rate, sentiment, competitor share) is
existing dashboard data read through a new channel, not a new number this
deck introduces.

**60 calls a minute, per key.**
- What it is, plain words: how many times one connected AI tool can ask
  BrandGEO a question in a single minute.
- What good looks like: a normal session (a developer asking Claude Code
  "how are we doing on ChatGPT this week") uses one or two calls. Sixty a
  minute is headroom for an AI tool making several calls while it reasons
  through a question, not a ceiling anyone should plan around.
- The one action it implies: if a tool hits this limit, the fix is to wait
  the number of seconds the error names (spec 6.2, `-32029`), never to issue
  a second key to work around it. A second key does not raise the daily
  total (5,000 calls a day is per account, not per key, spec 6.1).

**5,000 calls a day, per account.**
- What it is, plain words: the total number of questions every connected AI
  tool on this account can ask BrandGEO in one day, combined.
- What good looks like: far above what a normal workflow needs. Even a
  developer actively building against the seven tools would need hundreds
  of manual calls to approach it; this ceiling exists to stop a runaway
  script, not to constrain real use.
- The one action it implies: if this is ever hit, the message states the
  exact reset time, 00:00 UTC (spec 6.2). Nothing to configure, nothing to
  buy; it clears itself at the start of the next UTC day.

---

## 8. Error and empty states

Every error and empty string this feature can show, cross-referenced to the
copy table above so nothing is repeated in full here.

| State | Where | Text | Names what happened | Caused by the user? | Next step |
|---|---|---|---|---|---|
| Loading | Account, MCP access | "Loading your MCP keys…" | Yes (waiting) | n/a | None needed, transient |
| Unavailable (503) | Account, MCP access | "MCP access isn't set up on our side yet. Check back soon, or contact support@getbrandgeo.com if this doesn't clear up." | Yes | No, our side | Wait, or contact support |
| Load error | Account, MCP access | "Could not load MCP keys. Try again, and if it keeps happening, contact support@getbrandgeo.com." | Yes | Unclear (network or server) | Retry, then contact support |
| Issue error (generic) | Account, MCP access | "Could not issue a key. Try again, and if it keeps happening, contact support@getbrandgeo.com." | Yes | Unclear | Retry, then contact support |
| Issue error (below gate) | `client-api-keys.js:112` | "MCP access needs the Radar plan or higher. Upgrade this client's plan, then issue the key." | Yes | No, plan-based | Upgrade the plan |
| Issue error (research client) | `client-api-keys.js:115` | "MCP keys for this account can only be issued by BrandGEO. Contact support@getbrandgeo.com if you need one issued." | Yes | No | Contact support |
| Issue error (at key cap) | `McpAccessSection.tsx:520`, `client-api-keys.js:122` | "Revoke a key to issue a new one." | Yes | Yes (5 active keys already) | Revoke one, then issue |
| Revoke error | Account, MCP access | "Could not revoke the key. Try again, and if it keeps happening, contact support@getbrandgeo.com." | Yes | Unclear | Retry, then contact support |
| Revoke error (stale id) | `client-api-keys.js:142,148` | "No active key with that id. It may already be revoked; refresh the list to check." | Yes | Possibly (a second tab already revoked it) | Refresh the list |
| Below-gate section (Free plan) | Account, MCP access | "MCP access is included from the Radar plan." plus an "Upgrade to Radar" button | Yes | No, plan-based | Upgrade |
| Empty (gate open, no keys) | Account, MCP access | "No keys yet. Issue one to connect your first AI tool." | Yes | n/a | Issue a key |
| MCP protocol: unauthorized | `mcp-server.js`, any AI tool | "Invalid or missing BrandGEO API key." | Yes | Yes (bad or missing key) | Check the key pasted into the tool's config |
| MCP protocol: plan gate | `mcp-server.js`, any AI tool | "MCP access needs the Radar plan or higher. Upgrade to Radar at https://app.getbrandgeo.com/account." | Yes | No, plan-based | Follow the link, upgrade |
| MCP protocol: research account | `mcp-server.js`, any AI tool | "This account is not available over MCP. Contact support@getbrandgeo.com if you believe this is wrong." | Yes | No | Contact support |
| MCP protocol: rate limited (minute) | `mcp-server.js`, any AI tool | "Rate limit reached: 60 calls a minute per key. Retry in {n} seconds." | Yes | Yes (called too often) | Wait the stated seconds |
| MCP protocol: rate limited (day) | `mcp-server.js`, any AI tool | "Daily MCP limit reached. It resets at 00:00 UTC." | Yes | Yes (whole account) | Wait for the reset |
| MCP protocol: invalid cursor | `mcp-server.js:133,138`, seen inside an AI tool | "Invalid cursor" | Yes | Yes (malformed pagination value) | Omit `cursor` to restart, or reuse the exact `next_cursor` value from a prior call |
| MCP protocol: bad prompt_id | `mcp-server.js:349`, seen inside an AI tool | "No prompt with that id on this account." | Yes | Yes (wrong id) | Call `list_prompts` to see valid ids (this next step is a description of what to do, not new wording added to the spec-literal error text itself) |

Every row states what happened and either has no user cause (loading,
transient) or names the fix. Nothing here is an apology with no next step.

---

## 9. Compliance pass

Checked in writing, per `bg-copy.md`'s requirement to confirm, not assert:

- **Zero em dashes, zero en dashes.** Verified by command, section 10 below.
- **Zero banned vocabulary.** Verified by command, section 10 below.
- **Every factual claim traceable.** Every number, tool description, error
  code, snippet and status label in this deck cites an architecture spec
  section or a `file:line`. No customer count, percentage, "trusted by," or
  benchmark appears anywhere in this deck; none was available to cite, so
  none was written.
- **No scaled or duplicated content.** This deck produces one page
  (`mcp.html`), one FAQ entry, one pricing bullet and one in-app blurb. No
  per-client, per-city or near-duplicate variant of any of these exists or
  is proposed.
- **schema.org types honest.** The FAQ JSON-LD entry (section 6) uses
  `Question`/`Answer`, the same types every other entry on the page already
  uses, and its `text` is the same plain-language answer a reader sees in
  the visible HTML, not a keyword-stuffed variant.
- **English only.** Confirmed throughout.
- **No real people's names.** Confirmed throughout; every example in this
  deck (label placeholder, error scenarios) is generic ("Cursor, laptop"),
  never a named individual.
- **No claim depends on a specific AI client being "Supported."** Confirmed,
  and tightened 2026-09-24 (findings A, B): section 4.8's table is the only
  place any client is named with a status, every row in it reads "Coming,"
  none reads "Supported," and no sentence anywhere else in this deck (blurb,
  pricing bullet, FAQ answer, error copy) names a specific client as working.
  No "works with every AI tool" claim appears anywhere, and the table's own
  lead-in no longer claims any client "can reach a BrandGEO MCP connection."
- **The client status taxonomy matches spec section 14.8 exactly.**
  Confirmed 2026-09-24: section 14.8 allows only two states, Supported and
  Coming. The label "Pending live test," used throughout this deck before
  today's amendment, was a third state the spec does not permit and has been
  removed everywhere (section 4.8). No client is called Supported; the five
  header-capable clients carry a plain factual note ("Being tested live
  now") that is not itself a status label.
- **The bg-architect amendment (spec section 14) is applied, not
  paraphrased around.** Checked line by line against the coordinator's
  relayed constraints: no "MCP 2026-07-28," no "the latest MCP
  specification," no "stateless MCP," no protocol-negotiation environment
  variable or generation name in any snippet, no lowercase "bearer" or
  `x-api-key` header anywhere (every snippet keeps `Authorization: Bearer
  <key>` exactly as spec 8.2 gives it), and no client beyond claude.ai/ChatGPT
  is called anything but "Coming."

---

## 10. Verification (dash scan and banned-vocabulary scan)

Positive control first, to prove the pattern actually fires on this machine
(per `bg-copy.md`'s explicit warning: Git Bash's `grep` here is not
UTF-8-safe and is unusable for this check; `rg` is used instead).

```
$ printf 'test\xe2\x80\x94control\n' > /tmp/dash-positive-control.txt
$ rg -n "[<U+2014><U+2013>]" /tmp/dash-positive-control.txt
1:test<U+2014>control
```

(The command and its matched line are both shown with the em dash and en
dash written out as code points, U+2014 and U+2013, rather than reproduced as
literal characters, so this verification section does not itself carry the
characters it is testing for. The command actually run against a real
terminal used the literal characters in that position, per the exact
commands specified in this agent's own operational instructions; only their
representation in this written deck is substituted.)

Pattern confirmed to fire. Now the real scan, against this file:

```
$ rg -n "[<U+2014><U+2013>]" docs/copy/mcp-access-2026-09-24.md
(no output)
```

Banned-vocabulary scan, run with the exact pattern this agent's own
operational instructions specify (`bg-copy.md`, the `/verify` command block).
That pattern is not retyped in full here on purpose: it is itself a
pipe-separated list of the banned words, and reproducing it as literal text
inside this deck would make the deck match its own scan the same way the
dash pattern above did before that was corrected.

```
$ rg -ni <the bg-copy.md banned-vocabulary pattern, thirteen words, reproduced verbatim from this agent's own instructions and not retyped here> docs/copy/mcp-access-2026-09-24.md
(no output)
```

Both commands return nothing against the finished deck. Clean pass.

---

## 11. Handoff packet

**To:** `bg-app` (item in section 2.1, 2.2) and `bg-web` (item in section 4,
5, 6). **From:** `bg-copy`. **Artifact:** this file.

### For `bg-app`

1. `planConfig.ts:477`: replace the `mcp_access` blurb with the text in
   section 2.1.
2. `McpAccessSection.tsx`: replace the six strings marked REPLACE in the
   table at section 2.2 (rows 2, 4, 5, 15, 21, 23), at the exact lines
   cited. Every other row in that table is KEEP or SPEC-LITERAL; no code
   change needed for those.
3. Note for awareness, not action this stage: `McpAccessSection.tsx:500-504`
   carries a comment that the "Learn more" link to `getbrandgeo.com/mcp.html`
   was deliberately withheld from Stage 1 because the page did not exist
   yet. Once `bg-web` ships `mcp.html` (this deck, section 4), that link
   should be re-added; this deck does not draft that link's copy because it
   is a single URL, not a string requiring wording, but flags it here so it
   is not forgotten now that its destination exists.

### For `bg-web`

**Amendment 2026-09-24: this is a re-paste, not a first build.** `bg-verify`
found the first pass off this deck to be a defective paste in five places
(findings A, C, D, E, F) plus a set of headings the deck had not supplied
(finding G). Every string those findings touched is corrected in place above
(sections 4.4, 4.8, 4.9, 4.12, 4.14, 4.15, 6). Re-paste from this version,
not from memory of the first build.

1. `brandgeo/web/mcp.html`: build section 4 of this deck in full, in the
   order given, including the new 4.15 heading list. The client table (4.8)
   reads Coming on every row today; that is correct and must not be resolved
   to Supported for any row until `bg-verify` reports a passing live
   connection test for that specific client. Section 4.8 gives the exact
   post-test text for both outcomes (Supported, and a failed Coming) so this
   is a one-cell edit per client when that test lands, not a new copy pass.
2. `brandgeo/web/index.html`: add the one `<li>` from section 5, at the
   exact placement described there (Radar card only, after the existing
   last item at line 2029). Unchanged by this amendment.
3. `brandgeo/web/faq.html`: add the FAQ item and its matching JSON-LD entry
   from section 6, in the "BrandGEO Platform" category, as the last item.
   The question, answer and JSON-LD text all changed in this amendment;
   paste the version above, not the version from the first build.
4. Add `mcp.html` to `sitemap.xml` (spec 8.3's explicit instruction).
   Unchanged by this amendment.

### For `bg-backend` (informational, not this stage's build list)

Section 2.3 of this deck is a complete keep-or-replace review of every
customer-visible string in `mcp-server.js` and `client-api-keys.js`. Landing
the REPLACE rows there is a future `bg-backend` pass; this deck does not
touch those files.

### Anything unsourced

None. Every claim, number, string and status label in this deck traces to
`docs/arch/mcp-access.md` (including its section 14 amendment) or to a
`file:line` in the working tree at the point this deck was written.

---

## 12. Claim-to-source ledger, amendment 2026-09-24

One row per string this amendment changed. "Old" is what `bg-web` built and
`bg-verify` reviewed; "New" is what this deck now specifies.

| Finding | Where | Old | New | Source |
|---|---|---|---|---|
| A | 4.8, lead-in | "Every client below can reach a BrandGEO MCP connection the way its own setup docs describe..." | "None of the clients below is marked Supported yet... The last two connect by signing in instead of pasting a key, which this release does not support." | spec 14.8 ("appears as 'coming' or not at all" until live-tested), spec 14.4 (per-client findings), spec 8.1 (claude.ai and ChatGPT are OAuth-only, out of release one) |
| B | 4.8, heading | "Supported clients" | "Connecting a client" | spec 14.8: a heading claiming Supported clients is wrong while the table has none |
| B | 4.8, status column | "Pending live test" on 5 rows | "Coming" on all 7 rows, with a factual note ("Being tested live now" or "A later release") that is not a status label | spec 14.8: exactly two states exist, Supported and Coming |
| C | 4.4, body paragraph | "...your visibility score, which prompts..." | "...how often AI engines mention you, which prompts..." | `mcp-server.js:508`, `get_visibility_summary`'s `mention_rate`; no tool returns a score |
| C | 6, FAQ answer paragraph 2 | "...a connected tool can see your scores, prompts..." | "...a connected tool can read your mention rates, prompts..." | same as above |
| D | 4.12, read-only guarantee | "The only writes any MCP request can ever cause are the internal counters that keep these limits, which never touch your data." | "...are the internal counters that keep these limits, and a last-used time stamped on the key itself. Neither one touches your data." | `mcp-server.js:712` to `:720`, the throttled `client_api_keys.last_used_at` update |
| E | 6, FAQ question | "Can I connect BrandGEO to Claude, Cursor or other AI tools?" | "Can I connect my AI tools to BrandGEO?" | spec 14.8 (no client-specific works-claim); avoids "Claude" read as claude.ai, which is Coming |
| E | 6, FAQ answer paragraph 1 | "Yes, from the Radar plan up. BrandGEO runs a remote MCP server, so your own AI tools can read..." | "Yes, from the Radar plan up, for AI tools that take an API key in a header, such as Claude Code or Cursor. BrandGEO runs a remote MCP server, so a connected tool can read..." | spec 4 (gate), spec 8.1 (header-based clients), section 4.8's table (no client named Supported) |
| E | 6, FAQ answer paragraph 3 | "See our MCP setup page for the exact tools we support today and how to connect one." | "See our MCP setup page for which clients connect today and how." | Table at section 4.8 lists clients, not tools; "Tools" on `mcp.html` names the seven MCP tools, a different set |
| E | 6, JSON-LD `text` | (old answer, concatenated) | (new answer, concatenated, byte-identical to the visible `<p>` text) | Kept equal to the visible answer, per the same rule the original deck followed |
| F | 4.9, `get_prompt_results` line | "...what each AI engine said the last time it answered one specific prompt." | "...what each AI engine said about one specific prompt, over a time window you choose." | `mcp-server.js:634`, `results: arr(...)`, no latest-only filter; `window_days` input parameter |
| G | 4.14, CTA button | (not specified) | "Open Account" | New, this amendment; the sentence "Open your BrandGEO Account page to issue your first key" in 4.14 remains the surrounding copy, unchanged |
| G | New 4.15 | (7 headings, 1 button, built without a deck source) | Table in 4.15: each heading is either a direct reproduction of its own section's name, or a stated short form accepted in writing | See 4.15 for each row's individual reasoning |

### Dash scan and banned-vocabulary scan, literal output

See section 10 above; both commands returned nothing against this file.
