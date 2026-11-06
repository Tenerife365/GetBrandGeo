# MCP stage 3 copy deck: OAuth sign-in and the Claude connector directory

Date: 2026-11-06. Author: bg-copy. Binding spec: `docs/arch/mcp-stage3-oauth.md` (RULED 2026-11-06, all section 9 defaults). Also read: `docs/arch/mcp-stage2-fixes.md`, `docs/copy/mcp-access-2026-09-24.md`, `docs/qa/mcp-web-stage3-review-2026-09-24.md`, `brandgeo/web/mcp.html`, `brandgeo/web/privacy.html`, `brandgeo-dashboard/netlify/functions/mcp-server.js`, `brandgeo-dashboard/src/lib/aiVisibilityCopy.ts`.

Status of the claims: stage 3 is not built or deployed. Every sentence about signing in, consent, connected apps and the claude.ai connector is true only once the build ships and the test plan in spec section 8 passes. Nothing here says BrandGEO is listed in Claude's directory. Placeholders in curly braces, such as {appName}, are filled by the builder from data.

## 0. Voice check

1. Who speaks: BrandGEO, a founder-led product, plainly. First person plural where the product acts ("we"), second person for the reader.
2. To whom: a business owner or marketer who uses Claude, may not know what "MCP" or "OAuth" means, and is deciding whether to let an app read their brand data.
3. Knowledge level: assume no GEO vocabulary and no OAuth vocabulary. Say what the app can read, what it cannot do, where the user goes back to, and how to turn it off.

---

## 1. Consent screen (`/oauth/authorize`, spec 4.2 step 6)

Keys are stable identifiers for bg-app to map. Strings with {braces} are interpolated.

### 1.1 Main screen

| Key | Element | Text |
|---|---|---|
| `consent.loading` | Shown while signing in redirect or `check` runs | Checking your sign-in request... |
| `consent.heading` | H1 | Connect {appName} to BrandGEO |
| `consent.intro` | Line under H1 | {appName} is asking to read data from {brandName}, your BrandGEO account. |
| `consent.account_label` | Small label above the brand | BrandGEO account |
| `consent.redirect` | Line, normal redirect | After you choose, you will be sent back to {host}. |
| `consent.redirect_loopback` | Line, loopback redirect (localhost or 127.0.0.1) | After you choose, you will be sent back to an app on this computer. |
| `consent.loopback_warning` | Warning box, loopback only | {appName} is running on this computer. Continue only if you started this connection yourself, from an app you installed. A different program on this computer could be pretending to be {appName}. |
| `consent.read_heading` | List heading | With read access, {appName} can: |
| `consent.read_1` | List item | See your brand name, website and plan, and which AI engines BrandGEO tracks for you |
| `consent.read_2` | List item | See how often AI engines mention your brand |
| `consent.read_3` | List item | See the prompts BrandGEO tracks for you |
| `consent.read_4` | List item | Read what each AI engine answered to those prompts |
| `consent.read_5` | List item | See which competitors come up next to you |
| `consent.read_6` | List item | See how positive or negative the answers are |
| `consent.read_7` | List item | Read your latest BrandGEO recommendations |
| `consent.read_8` | List item | Read your Fix This list and which items are done |
| `consent.read_limits` | Line under the list | It cannot start a collection, change a setting, or see any other BrandGEO account. |
| `consent.write_label` | Checkbox label, shown only when write was requested, unticked by default | Also let it mark Fix This items done |
| `consent.write_helper` | Helper line under the checkbox | Off by default. Marking an item done tells BrandGEO to check it again later. It cannot change anything else. |
| `consent.allow` | Primary button | Allow |
| `consent.cancel` | Secondary button | Cancel |
| `consent.footnote` | Small footnote | You can disconnect {appName} at any time on your BrandGEO Account page, under MCP access. |
| `consent.sending` | Line after Allow or Cancel while navigating | Sending you back to {hostOrThisComputer}... |

`{hostOrThisComputer}` is the host name for a normal redirect and "your app" for a loopback redirect.

### 1.2 Errors and refusals

Each names what happened, whether the user caused it, and the next step.

| Key | When | Heading | Body | Button |
|---|---|---|---|---|
| `error.not_signed_in` | No session | (none) | Use `consent.loading`. The page redirects to the login page and brings the user back. | (none) |
| `error.unknown_client` | Client id not known or not resolvable | We do not recognise this app | This sign-in request names an app BrandGEO does not know, so we did not continue. Nothing was shared. If you started this from Claude, go back to Claude and try again. If it keeps happening, write to support@getbrandgeo.com. | Go to your dashboard |
| `error.redirect_not_allowed` | Redirect not allowed for that client | We could not verify where to send you | The address this app asked us to return you to is not one we allow, so we stopped. Nothing was shared. This is not something you did. Go back to the app and start again. | Go to your dashboard |
| `error.request_expired` | Pending request older than 5 minutes or missing | This sign-in request expired | Requests last 5 minutes. Go back to {appName} and start the connection again. | Go to your dashboard |
| `error.admin_refused` | Admin login with no client (R6) | Use a viewer login for this | You are signed in with an administrator login, which is not tied to one brand, so there is nothing to connect. Sign in with the viewer login of the brand you want to connect, then start again. | Sign out |
| `error.plan_below_radar` | Plan fails the MCP gate (R8) | MCP access starts on the Radar plan | {brandName} is on the {planName} plan. Connecting an AI app is included from Radar up. Nothing was shared. | See plans |
| `error.research_account` | Research client | This account cannot be connected | {brandName} is a research account, and research accounts cannot be connected to AI apps. Sign in with a customer account instead. | Go to your dashboard |
| `error.invalid_request` | A page-shown parameter failure before the redirect is proven | This request is not valid | The request from {appName} is incomplete or malformed, so we stopped. This is not something you did. Go back to the app and try again. | Go to your dashboard |
| `error.generic` | Any other failure on `check` or `decide` | We could not finish connecting | Something failed on our side and nothing was shared. This is not something you did. Select Try again. If it fails again, write to support@getbrandgeo.com and tell us the time. | Try again |

### 1.3 Mapping note for bg-app

`error.plan_below_radar` needs the plan's display name; use the same plan label the Account page uses. "See plans" links to the existing pricing or plan page, builder's choice. The brand and plan are shown only after the user is signed in.

---

## 2. Connected apps (Account page, MCP section, spec 6.1)

| Key | Element | Text |
|---|---|---|
| `apps.heading` | Subheading under the keys list | Connected apps |
| `apps.helper` | One helper line | Apps you signed in to BrandGEO from, such as Claude. Disconnect one and it loses access at once. |
| `apps.col_app` | Column | App |
| `apps.col_redirect` | Column | Sends back to |
| `apps.col_access` | Column | Access |
| `apps.col_connected` | Column | Connected |
| `apps.col_last_used` | Column | Last used |
| `apps.access_read` | Cell | Read only |
| `apps.access_write` | Cell | Read and write |
| `apps.never_used` | Last used cell when empty | Not used yet |
| `apps.redirect_loopback` | Sends back to cell for loopback | An app on this computer |
| `apps.disconnect` | Row button | Disconnect |
| `apps.confirm` | Confirm text | Disconnect {appName}? It stops working at once. To use it again, connect it again and approve access. |
| `apps.confirm_yes` | Confirm button | Disconnect |
| `apps.confirm_no` | Cancel button | Keep connected |
| `apps.success` | Announcement (live region) | Disconnected {appName}. It can no longer read your BrandGEO data. |
| `apps.failure` | Announcement | We could not disconnect {appName}, and nothing changed. Try again. If it keeps failing, write to support@getbrandgeo.com. |
| `apps.empty` | Empty state | No apps connected yet. To connect Claude, add https://app.getbrandgeo.com/mcp as a connector in Claude and sign in when asked. |
| `apps.load_error` | List fails to load | We could not load your connected apps. This is not something you did. Reload the page. If it fails again, write to support@getbrandgeo.com. |

---

## 3. Hub line when Claude marked a fix done through OAuth (spec section 5)

The stage 2 suffix in `aiVisibilityCopy.ts` is ` by an AI agent (label)` for keys. For OAuth the suffix uses the grant's app name:

| Case | Suffix after "Marked done {date}" | Example |
|---|---|---|
| OAuth grant, app name known | ` by {appName}` | Marked done 20 Nov by Claude |
| OAuth grant, name empty | ` by an AI agent` | Marked done 20 Nov by an AI agent |
| API key (unchanged) | ` by an AI agent ({keyLabel})` or ` by an AI agent` | Marked done 20 Nov by an AI agent (Cursor, laptop) |

Note for bg-app: the app name is shown as plain text, never as markup.

---

## 4. MCP server strings (`mcp-server.js`)

| Key | Where | Current | New |
|---|---|---|---|
| `mcp.unauthorized` | `UNAUTHORIZED_MESSAGE` (line 90) | Invalid or missing BrandGEO API key. | Invalid or missing BrandGEO credentials. (confirmed, spec 3.1) |
| `mcp.oauth_read_only` | New, for a `mark_fix_done` call on an OAuth connection without write | (spec 5 draft) This connection has read access only. Disconnect and connect again, ticking 'Also let it mark Fix This items done'. | This connection has read access only. In BrandGEO, open Account, MCP access, Connected apps and disconnect it. Then connect again and tick "Also let it mark Fix This items done". |
| `mcp.key_read_only` | `READ_ONLY_KEY_MESSAGE` (line 97) | unchanged | This key is read only. Create a read and write key on the BrandGEO Account page to let an agent mark fixes done. |
| `mcp.fix_not_open` | `FIX_NOT_OPEN_MESSAGE` (line 98) | unchanged | That fix is not open for this brand. Call list_fixes for the current ids. |

The tightened `mcp.oauth_read_only` names the exact place to go and the exact checkbox label, which is `consent.write_label`. If bg-backend keeps the spec 5 wording instead, nothing breaks, but the two checkbox strings must match.

---

## 5. `mcp.html` revision (full replacement deck)

Replaces the page deck in `docs/copy/mcp-access-2026-09-24.md` section 4. It fixes findings A, C, D and E of `docs/qa/mcp-web-stage3-review-2026-09-24.md` and the residual items G-r, N2 and N4. Layout and styling stay as in the current `mcp.html`; only strings change, plus the rows and sections named in 5.12.

Publishing rule for bg-web: publish only after the stage 3 test plan (spec section 8) has run. Set each client row's status from what was tested; Supported means connected live with a real key or a real sign-in, end to end. Use the lead-in variant that matches (5.9). Nothing on the page may say the connector is in Claude's directory.

### 5.1 Title tag

MCP access: connect Claude and other AI tools to BrandGEO

### 5.2 Meta description and `og:description` (identical)

Connect Claude and other AI tools to your BrandGEO account. Read your AI visibility data, and choose whether they can mark fixes done. From the Radar plan.

If the tests show claude.ai fails, use instead: "Connect AI tools to your BrandGEO account with an API key. Read your AI visibility data, and choose whether they can mark fixes done. From the Radar plan."

### 5.3 Hero badge, H1, subhead

- Badge: MCP
- H1: MCP access for your AI tools
- Subhead: Connect Claude and other AI tools to your BrandGEO account. They can read your visibility data, and you choose whether they can also mark fixes done. Included from the Radar plan.

### 5.4 What it is

BrandGEO can act as a remote MCP server. MCP is a standard way for an AI tool to ask another service for data. Connect Claude, Claude Code or Cursor to your BrandGEO account and you can ask them about your AI visibility in plain words: how often AI engines mention you, which prompts you are tracked on, what each engine said, which competitors come up next to you, and what BrandGEO recommends you fix.

Access is read only unless you choose otherwise. You can let a tool mark Fix This items done, which tells BrandGEO to check them again later. Nothing over this connection can start a collection or change a setting.

### 5.5 H2 "Connect from claude.ai" (new)

Heading: Connect from Claude

Body:
In Claude, open Settings, then Connectors, and add a custom connector. Paste this address:

[endpoint box] https://app.getbrandgeo.com/mcp

Claude sends you to BrandGEO to sign in. Sign in with your usual BrandGEO login, read what the app can do, and select Allow. You come back to Claude connected. There is no key to copy.

Claude's own settings show whether custom connectors are available on your Claude plan.

Write access: the sign-in screen has a box, "Also let it mark Fix This items done". It is off unless you tick it. If you leave it off, the connection is read only.

Coming to Claude's connector directory. (Future only. Publish this line only if Constantin approves it and the page stays true if the listing is refused; otherwise omit.)

### 5.6 H2 "Endpoint"

[endpoint box] https://app.getbrandgeo.com/mcp

(Same address for Claude and for every key-based tool below.)

### 5.7 H2 "How to get a key"

For tools that take a key in a header, such as Claude Code or Cursor.

Open your BrandGEO Account page and find "MCP access" below your plan details. Select Issue key, name it if that helps you tell your tools apart later (for example "Cursor, laptop"), and choose Read only or Read and write. Copy the key when it appears. BrandGEO shows it once. If you lose it, revoke it from the same page and issue a new one.

Read only is the default. Read and write lets the tool mark Fix This items done. A key keeps the access it was created with. For a different access, issue a new key.

### 5.8 H2 "Setup"

Unchanged from the current page: the three snippets (Claude Code, Cursor, Claude Desktop) with their captions and the mcp-remote note, exactly as in `mcp.html` lines 212 to 241. Placeholder stays `Bearer <key>`. No key-shaped string on the page.

### 5.9 H2 "Connecting a client"

Table columns: Client, Status, How, per its own setup docs.

Rows and the "How" text:

| Client | How |
|---|---|
| Claude (claude.ai, Desktop and mobile) | Custom connector. You sign in to BrandGEO and approve access. No key. |
| Claude Code | Native HTTP transport. Key in a header, or sign in when it asks. |
| Cursor | `mcp.json` with a `url` and `headers`. |
| VS Code (agent mode) | `.vscode/mcp.json`, type `http`, with `headers`. |
| Windsurf | `mcp_config.json` with `serverUrl` and `headers`. |
| Claude Desktop with a key | A small local bridge, described above. |
| ChatGPT connectors | Connects by signing in. Not supported yet. |

Status for each row is set by bg-web from the test results: Supported, or Coming. Remove the earlier "Being tested live now." notes. ChatGPT stays Coming, because the spec accepts only claude.ai, Claude Code and keys in release one.

Lead-in, variant A (before tests finish, publishing not recommended): "None of the clients below is marked Supported yet. We only call a client Supported once we connect it ourselves with a real sign-in or key and confirm it works end to end."

Lead-in, variant B (after tests, at least one Supported): "A client is marked Supported only after we connected it ourselves, live, and confirmed it works end to end. Coming means we have not confirmed it yet."

H2 is "Supported clients" only if at least one row is Supported; otherwise "Connecting a client".

### 5.10 H2 "Tools"

Intro line: Nine tools. Eight read, one write.

Read tools:
- `get_brand_overview`: your plan, which AI engines are active, when your data last updated, and how many prompts you are tracking.
- `get_visibility_summary`: your mention rate, overall and by engine, over a time window you choose.
- `list_prompts`: the buyer prompts BrandGEO tracks for your brand.
- `get_prompt_results`: what each AI engine said about one specific prompt, over a time window you choose.
- `get_competitors`: which competitors AI engines mention alongside you, and how often.
- `get_sentiment_summary`: how positive, neutral or negative AI engines are when they mention you.
- `get_recommendations`: your latest BrandGEO recommendations for improving AI visibility.
- `list_fixes`: your Fix This list as the dashboard shows it, open items in priority order, each with a short brief an AI tool can act on.

Write tool, only on a read and write key or a connection with the box ticked:
- `mark_fix_done`: marks one open Fix This item done after the work is finished. BrandGEO stores the item's current number and checks it again on the first collection at least 7 days later. Marking an item that is already done changes nothing.

### 5.11 H2 "Plan and limits", "What it can and cannot do", "Revoke"

Plan and limits (two fact boxes, unchanged plus one):
- Included from the Radar plan up. Not available on Free.
- 60 calls a minute, per key or connected app. 5,000 calls a day, per account.
- Marking fixes done: up to 60 an hour, per account.

H2 "What it can and cannot do" (replaces "Read-only guarantee"):

Reading never changes anything. The one thing a tool can write is marking a Fix This item done, and only when you gave it write access: a read and write key, or the box ticked when you signed in. A tool cannot start a collection, change a setting, add or remove a prompt, or dismiss a fix. It only ever sees your own account.

Besides that, an MCP request can cause two small writes: the counters that keep the limits above, and a last-used time stamped on the key or connected app itself. Neither touches your data.

H2 "Revoke a key or disconnect an app":

Open your Account page and find "MCP access". To stop a key, select Revoke next to it. To stop a connected app such as Claude, select Disconnect under Connected apps. Either one stops working at once. A disconnected app asks you to connect again before it can read anything.

### 5.12 CTA and FAQ

CTA paragraph: Open your BrandGEO Account page to issue a key, or add the address above to Claude to connect.
CTA button: Open Account &rarr; (unchanged)

FAQ entry (replaces the current one; the visible text and the FAQPage JSON-LD must be identical):
- Question: Can I connect my AI tools to BrandGEO?
- Answer, paragraph 1: Yes, from the Radar plan up. You can connect Claude by adding BrandGEO as a connector and signing in, or connect tools that take an API key in a header, such as Claude Code or Cursor.
- Paragraph 2: Access is read only by default. You can let a tool mark Fix This items done by choosing write access when you connect or when you create a key. You can disconnect or revoke at any time.
- Paragraph 3: See our MCP setup page for which clients connect today and how.

### 5.13 Changes to the structure (for bg-web)

Add the H2 "Connect from Claude" before "Endpoint". Move "How to get a key" below it. Drop `.pending` CSS (N4). Add `role="region"` to the scrollable `pre` blocks and the table wrapper (N1). Every other style is unchanged. The headings added or renamed here are inventoried in 5.14 so a reviewer can trace them.

### 5.14 Heading inventory (finding G)

Badge: MCP. H1: MCP access for your AI tools. H2s: Connect from Claude; Endpoint; How to get a key; Setup; Connecting a client (or Supported clients); Tools; Plan and limits; What it can and cannot do; Revoke a key or disconnect an app. Button: Open Account.

---

## 6. Privacy paragraph for `privacy.html`

LEGAL WORDING, Constantin approves before bg-web publishes. Status: NEEDS_HUMAN.

Placement: a new subsection under "What Data We Collect" or after it, titled "AI tools you connect to BrandGEO".

> **AI tools you connect to BrandGEO.** If you connect an AI tool such as Claude to your BrandGEO account, using the MCP connection described at getbrandgeo.com/mcp.html, that tool can read your account's AI visibility data: your brand name, the prompts we track, the answers AI engines gave, competitor names, sentiment, recommendations and your Fix This list. If you choose write access, it can also mark Fix This items done. We give the tool a sign-in token or an API key, never your password. Tokens and keys are stored only as one-way hashes. When you disconnect an app or revoke a key, access stops at once. We keep a record of each connection, when it was made and when it was last used, for audit and security. We do not receive your conversation with the AI tool, only the requests it makes to BrandGEO for your data. What the tool does with the data it reads is governed by that tool's own terms and privacy policy.

Notes for Constantin:
- "One-way hashes" is true per spec 6.2 (sha256). "Record of each connection kept for audit" is spec 6.2 ("Grants are kept for audit").
- Expired tokens and sign-in codes are removed by the pruning job (R9), which runs only after Constantin starts it. The paragraph does not promise a deletion period, so it stays true either way.
- The last sentence about the tool's own terms is a statement of fact about third parties, not a promise. Delete it if counsel prefers.

---

## 7. Directory listing text

All limits from spec section 7. Counts measured, characters including spaces.

### 7.1 Name

BrandGEO (9 characters, limit 100). Slug `brandgeo`, permanent once published (R10).

### 7.2 One-liner

> Ask Claude how often AI engines mention your brand, which competitors they name, and what to fix next. Read only by default. Needs the Radar plan or above.

Count: 155 characters (limit 200).

### 7.3 Description

> BrandGEO measures whether AI engines such as ChatGPT, Gemini, Claude and Perplexity mention your brand when people ask buying questions. This connector lets Claude read that data from your own BrandGEO account, so you can ask about it in plain words.
>
> Ask how often AI engines mention you, overall and by engine. Ask what each engine said to one of your tracked prompts. See which competitors come up next to you, how positive or negative the answers are, and what BrandGEO recommends you fix. Ask for your Fix This list in priority order, with a short brief for each item that Claude can help you act on.
>
> Access is read only by default. If you choose, you can also let Claude mark a Fix This item done once the work is finished. That is the only change it can make. It cannot start a collection, change a setting, add or remove a prompt, or see any other account.
>
> Sign in with your usual BrandGEO login. You see what the app can do before you allow it, and the write option is a box that is off unless you tick it. You can disconnect the app at any time on the BrandGEO Account page, and access stops at once.
>
> You need a BrandGEO account on the Radar plan or above. Free accounts cannot connect.
>
> BrandGEO never receives your conversation with Claude. It only sees the requests Claude makes for your data.

Count: 1309 characters (limit 2,000).

### 7.4 Use cases (5)

1. Ask which of your tracked prompts AI engines answer without naming your brand.
2. See which competitors AI engines name next to you, and how often.
3. Pull your mention rate by engine over the last 30 days.
4. Get your Fix This list in priority order, each item with a brief you can hand to Claude.
5. Mark a Fix This item done once the work is finished (only if you allowed write access).

### 7.5 What users need

A BrandGEO account on the Radar plan or above. Free accounts cannot connect.

### 7.6 Reads and writes

Reads: your own brand's AI visibility data (mention rates, prompts, engine answers, competitors, sentiment, recommendations, Fix This list). Writes: one, marking a Fix This item done, and only if the user ticks "Also let it mark Fix This items done" when connecting. It cannot start collections, change settings or see other accounts.

---

## 8. Category proposal (note to Constantin)

We do not know the portal's category list. Please read the list in the portal at https://claude.ai/directory/manage and send it back, or choose yourself. As a hint only, the likely fits are marketing and analytics. Pick one to five. Do not choose a category that implies BrandGEO does something it does not (for example sales or customer support).

---

## 9. Claim ledger (for bg-verify)

| # | Claim | Source |
|---|---|---|
| 1 | Nine tools, eight read and one write | `mcp-server.js` TOOLS 777 to 910, `list_fixes` at 910, `mark_fix_done` at 939 |
| 2 | Tool descriptions in 5.10 | `mcp-server.js` descriptions at 779, 796, 812, 832, 859, 882, 897, 912, 941 |
| 3 | `mark_fix_done` only for a read and write key | `mcp-server.js` 968 to 971, 1155 to 1156; stage 2 spec 3.2 |
| 4 | Re-check on first collection at least 7 days later | `mcp-server.js` 941 (description), stage 2 spec 3.2 step 6 |
| 5 | Already done changes nothing | `mcp-server.js` 941; stage 2 spec 3.2 |
| 6 | Cannot start a collection | `mcp-server.js` INSTRUCTIONS (94); stage 2 spec ruling 5 |
| 7 | Cannot change settings, add or remove a prompt, or dismiss a fix | stage 2 spec 3.2 ("Not in stage 2: dismiss, reopen, add prompt, run collection"); no such tool in the TOOLS list |
| 8 | Cannot see other accounts | stage 1 spec (every query filtered by client id), stage 3 spec 4 and 5 |
| 9 | Radar plan and up, Free refused | stage 3 spec 4.2 step 4 and R8; `_plans.js` `mcpAllowedFor` |
| 10 | 60 calls a minute, 5,000 a day | `mcp-server.js` lines 42 and 43 |
| 11 | 60 writes an hour per account | `mcp-server.js` line 60, stage 2 spec 6 |
| 12 | Counters and a last-used time are the only other writes | `mcp-server.js` line 717 and `affiliate_rate_check` (QA review 2026-09-24 D) |
| 13 | Sign-in goes to BrandGEO, no key to copy | stage 3 spec 4.2 |
| 14 | Checkbox "Also let it mark Fix This items done", off by default | stage 3 spec 4.2 step 6, R2 |
| 15 | Disconnect stops access at once, app asks to connect again | stage 3 spec 6.1 |
| 16 | Tokens and keys stored as hashes | stage 3 spec 6.2; stage 1 key storage |
| 17 | Grants kept for audit | stage 3 spec 6.2 |
| 18 | Request lasts 5 minutes | stage 3 spec 4.2 step 5 |
| 19 | A key keeps its scope; new scope needs new key | stage 2 spec 9.3 |
| 20 | Hub line suffix pattern | `aiVisibilityCopy.ts` 208 to 210; stage 3 spec 5 |
| 21 | Engine names in the listing (ChatGPT, Gemini, Perplexity) | `planConfig.ts` ENGINE_META; which engines apply depends on plan |

Unverified or needing a decision (could not be traced to code or spec):
- "Claude's own settings show whether custom connectors are available on your Claude plan": a statement about Claude, not checked. Safe to cut.
- `error.research_account` wording: spec says only "refused as in stage 1 section 4.4". The wording is mine; bg-backend should confirm research clients are the only case it covers.
- The Settings, then Connectors path inside Claude comes from spec 8 step 2, written 2026-11-06. Claude's menus change; bg-verify should re-check on the day.
- "Coming to Claude's connector directory": a future statement, deliberately conditional. Constantin decides whether to publish it.
- support@getbrandgeo.com: spec 7 says Constantin confirms the mailbox is read.
- Whether the connector works for Claude Desktop, mobile and Cowork depends on the Anthropic-held credential path (spec 4.1) and is untested. Row 1 of the client table says "claude.ai, Desktop and mobile" from spec 1 item 4 ("Used by claude.ai web, Desktop, mobile and Cowork"); set it to claude.ai only if the test covers only that.

---

## 10. Compliance pass

- Zero em dashes, zero en dashes: see `/verify` output below.
- Banned vocabulary: see `/verify` output below.
- Every factual claim is listed in section 9 with a source, or flagged as unverified.
- No scaled content: one deck, one page, one listing.
- No invented numbers, customers or features. The only numbers are the limits and times from the spec and code.
- No claim that BrandGEO is listed in the directory. The one forward-looking line is conditional and flagged.
- schema.org: the only structured data is the FAQPage block, and its visible text matches the JSON-LD.

### /verify output (real, 2026-11-06)

Dash scan: rg -n with a character class holding the en dash and em dash code points (U+2013, U+2014), run on this file. No output, exit 1 (no match).

Positive control: a scratch file holding one em dash. The same pattern printed the matching line, exit 0. So the scan fires.

Banned vocabulary scan (rg -ni with the full banned list from the bg-copy brief plus three extra tells), run on this file: no output, exit 1.

Counts, measured with String.length: one-liner 155 of 200; description 1,309 of 2,000; name 9 of 100.

---

## 11. Handoff packet

- To bg-app (Sonnet): sections 1 to 3. Keys are stable. Paste, do not rewrite. Interpolate {appName} as plain text.
- To bg-backend (Opus): section 4 strings. Confirm the research-account wording and the `mcp.oauth_read_only` text.
- To bg-web (Sonnet): sections 5 and 6, after Constantin approves section 6 and after the test plan runs. Re-check by bg-verify before publishing.
- To Constantin: section 6 (legal wording), the unverified items in section 9, the category list in section 8, the portal fields in section 7.
