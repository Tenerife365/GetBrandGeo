# MCP stage 3 design spec: consent page and Connected apps

Date: 2026-11-06. Author: bg-design. Status: ready for bg-app.
Binds: `docs/arch/mcp-stage3-oauth.md` sections 4.2 and 6.1 (RULED 2026-11-06, all section 9 defaults). Strings and keys: `docs/copy/mcp-stage3-oauth-2026-11-06.md` sections 1 to 3, used verbatim, not rewritten here.
Reads taken: `McpAccessSection.tsx`, `Login.tsx`, `tailwind.config.js`, `src/index.css`, `App.tsx`, `AIVisibility.tsx:1074`, `aiVisibilityCopy.ts:208`, `Skeleton.tsx`.
No new token, no new colour, no new dependency, no new motion library. Violet brand, no teal.

Contrast ratios below are computed from the token hex values (WCAG relative luminance), not estimated. Dark surfaces: `bg-dark-900` rgb(10 15 30), `bg-dark-800` rgb(15 23 42), `bg-dark-700` rgb(30 41 59), `border-dark-600` rgb(51 65 85). Light surfaces (`html.light`): dark-900 rgb(247 247 251), dark-800 white, dark-700 rgb(234 233 242), dark-600 rgb(216 214 230). Light text remaps come from `index.css` lines 166 to 216.

---

## 1. The one thing

On the consent page, the user must see what app is asking for what (app name, which brand, read access, where they return to) before the single decision, and nothing else on the page may compete with the Allow and Cancel pair.

## 2. The 10-second test

After 10 seconds a first-time user can say: which app is asking to connect, which of their BrandGEO accounts it is, that it can only read (and that marking fixes done is a separate box they have not ticked), and how to say no.

Current state: the page does not exist, so there is nothing to fail yet. Two traps in the existing code that would make a copy of it fail the test:
- `Login.tsx:65` uses `bg-brand-500` with white text for its primary button. That pair is 4.23:1 and fails 4.5:1 for 14 px text. Do not copy it. The consent Allow uses `bg-brand-600` (5.70:1), see section 5.
- `Login.tsx:71` card is `max-w-sm`; the consent content is longer, so this card is `max-w-md`.

Competing-element count (limit nine): BrandGEO mark, H1, intro with brand, redirect line, (warning box, loopback only), read list as one block, write checkbox as one block, button pair as one block, footnote. That is eight, nine with the warning. Within the limit.

---

## 3. Consent page `/oauth/authorize`

### 3.1 Placement and shell

- New route `<Route path="/oauth/authorize" element={<OAuthAuthorize />} />` in `App.tsx`, placed with the other unauthenticated-shell routes (next to `/login` and `/audit`). It is NOT wrapped in `PrivateRoute`, `OnboardGate` or `Layout`: the page handles its own session check (arch 4.2 step 2: no session sends to `/login?next=<full URL>`). No sidebar, no top bar, no client switcher, no time filter. The Netlify rewrite for `/*` already serves the SPA here (arch section 3).
- Outer: `min-h-screen bg-dark-900 flex items-center justify-center px-4 py-8` (Login's outer plus `py-8` so a tall card on a short phone scrolls instead of clipping).
- Inner column: `w-full max-w-md`. At 375 px the card is 375 minus 32 = 343 px wide. No fixed width anywhere inside, so no horizontal page scroll at 375, 768 or 1280.
- Card: `bg-dark-800 border border-dark-700 rounded-card p-card-feature` (same as `Login.tsx:71`; gets the elevation from `index.css` lines 604 and 614 in both themes).
- Document title: set on mount and restore on unmount, same pattern as `Login.tsx:36`. String missing from the copy deck, see section 11.

### 3.2 Layout order, top to bottom

1. **Mark.** The `BrandGeoMark` component, `size="xl"` as Login. Unlike Login it is NOT a link: omit `href` (the component renders a non-link when `href` is absent, `BrandGeoLogo.tsx:220`), so a user cannot leave the consent mid-decision by clicking the logo. Wrapper `flex items-center justify-center mb-8`. Decorative for AT beside the H1; give the wrapper `aria-hidden="true"` only if the component renders a text label that duplicates the H1 (builder checks).
2. **Heading.** `consent.heading`: `<h1 ref tabIndex={-1} className="text-lg font-semibold text-white mb-2 outline-none">`. White: 17.85:1 on dark-800; light remap `text-white` to rgb(15 23 42) is 17.85:1 on white. The app name inside is plain text, never markup, clipped to 60 characters by the server; add `break-words` so a long unspaced name cannot overflow at 375.
3. **Intro and account.** `consent.account_label` as `text-[10px] uppercase tracking-wide text-slate-500` (same label style as `McpAccessSection.tsx:522`), then the brand name `text-sm font-medium text-slate-200`, grouped in a `rounded-lg bg-dark-700/60 border border-dark-700 px-3 py-2 mb-4` chip. `consent.intro` sits above the chip as `text-sm text-slate-400 mb-3`. Text pairs: slate-400 6.96:1 on dark-800 (dark remaps slate-500 to the same value, so the 10 px label is also 6.96:1); light slate-400 rgb(71 85 105) is 7.58:1 on white and slate-500 rgb(85 100 121) is 6.03:1.
4. **Redirect line.** `consent.redirect` (or `consent.redirect_loopback`) as `text-xs text-slate-400 mb-4`. The host is wrapped in `<span className="font-medium text-slate-200 break-all">` so a long host wraps at 375. Slate-200 on dark-800 is about 14:1; light rgb(30 41 59) on white about 14:1.
5. **Loopback warning box**, only when the redirect host is `localhost` or `127.0.0.1`. A caution box, not red, using existing amber tokens as `Login.tsx:102` does for demo mode: `mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5`. Icon `AlertTriangle size={14}` `text-amber-300 shrink-0 mt-0.5` (aria-hidden). Heading-less; body `consent.loopback_warning` as `text-xs text-slate-300`. Ratios: amber-300 icon and any amber text 10.58:1, slate-300 body 10.28:1 on the composite surface rgb(38 37 39); light mode: `bg-amber-500/10` remaps to #fffbeb (`index.css:314`), `text-amber-300` remaps to rgb(180 83 9) at 4.84:1 on #fffbeb (icon only, passes 3:1; the body text is slate-300, remapped to rgb(51 65 85), 9.99:1). The box border is decorative; the warning is identified by icon and text, not border contrast. Role: plain `div` (the live region announces state changes, section 3.5; the warning is static content read in order).
6. **Read access block.** `consent.read_heading` as `text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2` (matches `McpAccessSection.tsx:373`), then `<ul className="space-y-1.5 mb-3">` of `consent.read_1` to `consent.read_8`. Each item: `flex items-start gap-2 text-sm text-slate-300`, with `Check size={14} className="text-brand-300 shrink-0 mt-0.5"` (aria-hidden; the list is a real `ul`/`li` so AT announces "list, 8 items"). Slate-300 12.02:1 dark, 9.99:1 light; brand-300 icon 9.67:1 dark, light remap rgb(109 40 217) 7.10:1 on white. Under the list, `consent.read_limits` as `text-xs text-slate-400 mb-5`. All eight items stay visible: this is informed consent, so no progressive disclosure here.
7. **Write opt-in**, only when write was requested (the server returns `write_requested: true`). A bordered group so the box reads as a separate decision from the read list: `mb-5 rounded-lg border border-dark-600 bg-dark-700/40 p-3`. Inside: a real `<input type="checkbox" id="oauth-write">` with `<label htmlFor="oauth-write">`, the whole label row `flex items-start gap-3 min-h-[44px] cursor-pointer`. Checkbox `h-5 w-5 mt-0.5 shrink-0 accent-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400` (same `accent-brand-500` approach as the access radios at `McpAccessSection.tsx:545`). Label text `consent.write_label` as `text-sm font-medium text-slate-200`. Helper `consent.write_helper` as `text-xs text-slate-400 mt-1 ml-8` wired with `aria-describedby="oauth-write-help"`. Default `checked={false}`; state is not persisted and resets on every load. Control contrast: native unchecked box border is drawn by the browser (about 4.5:1 or better in Chrome and Firefox, not token-controlled); checked fill brand-500 is 4.22:1 against dark-800 (passes 3:1) and 4.23:1 against white in light mode. The group border `border-dark-600` is 1.72:1 dark and 1.43:1 light and is NOT relied on to identify the control; the checkbox itself and its label do that. Do not give the group `role="group"`; a single checkbox needs none.
8. **Buttons**, stacked at every width (card is narrow, stacking removes any wrap decision): `flex flex-col gap-2`.
   - Allow (primary): `w-full min-h-[44px] bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2`. White on brand-600 is 5.70:1 (dark and light; `index.css:240` keeps it white in light), hover brand-700 is 7.10:1. This deliberately differs from Login's brand-500 (4.23:1).
   - Cancel (ghost): `w-full min-h-[44px] rounded-lg text-sm font-medium bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed` (the existing `ghostBtn` look at button size). Slate-200 on dark-700 about 11.8:1; hover on dark-600 about 8:1. Light remap: slate-200 to rgb(30 41 59) on rgb(234 233 242) 8.60:1. The ghost's border is 1.72:1 dark and 1.43:1 light, decorative only: the button is identified by its label text (well above 4.5:1) and its fill, the same way every existing `ghostBtn` in the app is.
   - Order in the DOM: checkbox, Allow, Cancel. Allow is first because it is the primary action and the visual order matches the Tab order.
9. **Footnote.** `consent.footnote` as `text-xs text-slate-500 mt-4 text-center`. Dark remap to slate-400 6.96:1; light rgb(85 100 121) 6.03:1 on white.
10. Below the card (outside it, as Login does): `text-center text-xs text-slate-600 mt-3` © BrandGEO with Terms and Privacy links copied from `Login.tsx:136` to `141` (open in a new tab, `rel="noopener noreferrer"`). These are the same links; they count as footer chrome, not competing elements.

### 3.3 State inventory (consent page)

Each state is the card's body swapped in place; the mark and the card frame never move, so nothing reflows.

| State | Trigger | What renders | Focus after | Announcement |
|---|---|---|---|---|
| Loading (checking) | Mount, session lookup, redirect to login, `check` in flight | Card with skeleton matching the final layout: `Skeleton` blocks for H1 (`h-6 w-3/4`), chip (`h-14 w-full`), redirect line (`h-4 w-2/3`), five list rows (`h-4 w-full` each at 8px gaps), two button blocks (`h-11 w-full`). Plus visible `consent.loading` as `text-xs text-slate-400 text-center mt-4`. | None moved (nothing to land on yet) | `consent.loading` is in the live region (3.5) |
| Ready | `check` returned a valid request | Section 3.2 | The H1 (programmatic, `tabIndex={-1}`) | None (the focus move announces the H1) |
| Deciding | Allow or Cancel pressed | Checkbox, Allow, Cancel all `disabled` (and `aria-disabled`). The pressed button shows `Loader2 size={16} className="animate-spin motion-reduce:animate-none"` before its label; the other stays plain. Label text unchanged (no reflow). | Focus stays on the pressed button (disabled buttons keep programmatic focus in modern browsers; if lost, move to the H1) | Live region: deciding string, see section 11 |
| Done (redirecting) | `decide` returned the redirect URL | Buttons and checkbox replaced by a single centered line `consent.sending` with the spinner (`Loader2 size={16}` as above), same height block as the button pair (`min-h-[100px]`) so the card does not jump. Then `window.location.assign(url)`. | None (the page is leaving) | `consent.sending` in the live region |
| Error: not signed in | No session | Renders the Loading state while redirecting to `/login?next=...`; never an error card | n/a | `consent.loading` |
| Error: unknown client, redirect not allowed, request expired, invalid request, research account | `check` refusal | Error body (3.4) with the copy deck heading and body; no Allow, no checkbox. One button. | The error H1 | None extra (focus move announces it) |
| Refusal: admin login | R6 | Same error body, button "Sign out" | The error H1 | same |
| Refusal: plan below Radar | R8 | Same error body, button "See plans" | The error H1 | same |
| Error: generic | Any other `check` or `decide` failure | Same error body, button "Try again" | The error H1; Try again re-runs `check` (or `decide` if the failure was in decide) and returns to Loading | same |
| Partial | Not applicable: `check` is all or nothing | n/a | n/a | n/a |
| Locked-by-plan | The plan refusal above | n/a | n/a | n/a |
| Success | After redirect the page is gone; Claude shows its own state | n/a | n/a | n/a |

Cancel is not an error: it posts `decide` with `allow:false`, shows the Done state ("Sending you back to..."), and the server redirects with `error=access_denied`. Cancel is therefore also the "back to Claude" route for every state where the redirect is proven; the error states before the redirect is proven (unknown client, redirect not allowed) have no way back to the app, so their only button is "Go to your dashboard", per the copy deck.

### 3.4 Error card layout

Same card frame. In place of sections 2 to 9:
- Icon row, centered: a `h-10 w-10 rounded-full` tile with `AlertTriangle size={20}` (aria-hidden). Refusals where nothing is wrong on our side (unknown client, redirect not allowed, expired, invalid request, admin, plan, research account) use `bg-amber-500/10 text-amber-300`. `error.generic` (our side failed) uses `bg-red-500/10 text-red-400` with `AlertCircle` as Login does. Amber-300 on its tile 10.58:1; red-400 on red tile 5.92:1; light remaps give amber rgb(180 83 9) on #fffbeb 4.84:1 and red rgb(185 28 28) on #fef2f2 5.91:1. Icons are decorative with text beside them, so the 3:1 non-text floor applies and is met.
- H1 (the error heading) `text-lg font-semibold text-white text-center mt-4 mb-2 outline-none`, `tabIndex={-1}`, receives focus.
- Body `text-sm text-slate-400 text-center mb-6`. In `error.request_expired`, `{appName}` falls back to "the app" if the request is missing; string missing, see section 11. `support@getbrandgeo.com` inside bodies is a `mailto:` link: `text-brand-400 hover:text-brand-300 underline underline-offset-2` (brand-400 6.56:1 dark; light remap rgb(109 40 217) 7.10:1). Underline so it is not colour only.
- One button, full width, `min-h-[44px]`. "Try again" and "See plans" use the primary style (3.2 item 8). "Go to your dashboard" and "Sign out" use the ghost style. Hrefs: dashboard is an `<a>` styled as the button, `to="/"`. "See plans" is an `<a>` to the existing plan target the Account page uses (`onUpgrade` logic), builder's choice per the copy deck. "Sign out" calls `supabase.auth.signOut()` then navigates to `/login?next=<this URL>` so the viewer login brings them straight back.

### 3.5 Keyboard, focus, live region

- **Tab order:** (Ready) checkbox if shown, Allow, Cancel, then the two footer links. (Error) the single button, then footer links. No positive `tabindex` anywhere.
- **Focus on load:** when `check` resolves, call `headingRef.current?.focus()` once (H1 in Ready, error H1 in error states). Allow is never auto-focused and never has `autoFocus`. Escape does nothing (this is not a modal; an accidental Escape must not cancel a consent).
- **Focus ring:** the global `:focus-visible` rule (`index.css:633`) applies unchanged: 2 px solid `--rail-active` with 2 px offset. Dark: brand-400, 6.56:1 on dark-800, 7.02:1 on dark-900. Light: brand-600, 5.70:1 on white, 4.73:1 on dark-700. Inside the warning box: 5.50:1 light. All exceed 3:1. The H1 uses `outline-none` because it is only ever focused by script, the same decision as `McpAccessSection.tsx:340`.
- **Live region:** one persistent element at the top of the card, rendered in every state so it exists before it speaks: `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">`. It receives, in order: `consent.loading` while checking; the deciding string while posting; `consent.sending` when done. It does NOT repeat the content of a focused H1 (the focus move already announces it). No `role="alert"` on error cards, to avoid a double announcement with the focus move.
- **Checkbox semantics:** native input, a real label, `aria-describedby` to the helper. Checked state is announced by the browser. Nothing in the page uses a div-as-checkbox.
- **Heading order:** one H1 per state, no skipped levels; the read-access heading is a styled `p` or `h2`. Use `h2` (`consent.read_heading`) so the page has a navigable structure: H1, then H2.
- **Hit targets:** Allow, Cancel, error button and the checkbox label row are all at least 44 by 44 px at every width (WCAG 2.5.8 AA asks 24; the brief and the rest of the mobile shell ask 44, `Layout.tsx:535`). Footer links are inline text and exempt.
- **Zoom and reflow:** at 320 CSS px (400 percent zoom) the card is 288 px, all text wraps, `break-words` and `break-all` on the user-controlled strings keep the layout inside the viewport.

### 3.6 Motion

| Element | Trigger | Property | Duration | Easing | Stagger | Job | Reduced motion |
|---|---|---|---|---|---|---|---|
| Spinner on pressed button or on the redirecting line | Deciding, Done | rotate (Tailwind `animate-spin`) | 1000 ms linear loop (Tailwind default) | linear | none | Confirms the click registered and masks the server round trip | `motion-reduce:animate-none`; the label text already says what is happening, so nothing is lost |
| Loading skeleton | Loading state | opacity pulse (existing `animate-pulse`) | Tailwind default | Tailwind default | none | Holds the final layout while `check` runs, prevents reflow | Existing rule at `index.css:723` freezes it at 0.6 opacity |

No entrance animation on the card or the list: the user arrived by redirect and the consent is a decision, not a reveal. Nothing else moves. (`animate-spin` is not covered by the existing reduced-motion block in `index.css`; the `motion-reduce:` variant on each spinner is therefore required.)

### 3.7 Both themes

No class on this page is dark-only. Every colour is an existing Tailwind utility that `index.css` already remaps for `html.light` (text-white, slate-200 to 500, brand-300 and 400, amber-300, red-400, bg-amber-500/10, bg-red-500/10, border-dark-600 and 700). Builder must NOT introduce a raw hex, an inline style colour or a `dark:` prefix.

---

## 4. Connected apps (Account page, MCP section)

### 4.1 Placement

Inside the existing MCP card in `McpAccessSection.tsx`, after the keys list and before the closing `</div>` of the gated and partial branches. Visually separated by `mt-6 pt-6 border-t border-dark-700`. Heading `<h3 className="text-sm font-semibold text-slate-300 mb-1">` with `apps.heading`, then `apps.helper` as `text-xs text-slate-500 mb-3`. (The card H2 is "MCP access"; this is the next level down.) Make it a small local component `ConnectedApps` in the same file (the file already holds helpers) or a sibling `McpConnectedApps.tsx`; builder's choice, one file.

Data: `client-api-keys.js` actions `list_grants` and `revoke_grant` (arch 6.1), same `callKeysFn` helper and auth as the keys list. Loaded in the same effect as the keys but independent: a grants failure never hides the keys, and a keys failure never hides the grants.

Grant row fields (from arch 6.1): `id`, `client_name`, `redirect_host`, `scope`, `created_at`, `last_used_at`. Derived: `isLoopback` (host is `localhost` or `127.0.0.1`), access = `scope` includes `mcp:write` ? write : read.

### 4.2 Columns and cells

| Column (copy key) | Cell | Style |
|---|---|---|
| App (`apps.col_app`) | `client_name`, or the fallback (section 11) when empty | `text-slate-200 break-words` (about 14:1 dark, 14:1 light) |
| Sends back to (`apps.col_redirect`) | `redirect_host`, or `apps.redirect_loopback` when loopback | `text-slate-400` (6.96:1 dark, 7.58:1 light), host in `font-mono text-[11px] break-all` |
| Access (`apps.col_access`) | `apps.access_read` or `apps.access_write` | `text-slate-300`, plain text, exactly as the keys list (`scopeLabel`, `McpAccessSection.tsx:460`). The stage 2 key scope has no badge, only this text; reuse that function's wording and class, do not invent a pill. Export `scopeLabel` or add `grantAccessLabel` beside it so both lists share the wording. Slate-300 12.02:1 dark, 9.99:1 light. |
| Connected (`apps.col_connected`) | `fmtDT(created_at)` | `text-slate-400` |
| Last used (`apps.col_last_used`) | `fmtDT(last_used_at)` or `apps.never_used` | `text-slate-400` |
| (sr-only "Actions") | Disconnect button | below |

Header cells copy the keys table: `text-left text-slate-500 uppercase tracking-wide text-[10px]` (dark remap 6.96:1, light 6.03:1).

### 4.3 Desktop (md and up) table

Mirror `KeysTable` markup exactly (`McpAccessSection.tsx:442` to `478`): `<div className="mt-4 overflow-x-auto"><table className="w-full text-xs">`, rows `border-t border-dark-700`, cells `py-2 pr-4`. Wrap the table in `hidden md:block`. Six columns fit at 768 px (card inner width about 700 px); the `overflow-x-auto` is the same safety net the keys table has. Disconnect cell: the destructive ghost button below.

### 4.4 Phone (below md) cards

Wrap in `md:hidden`. A vertical list `space-y-3 mt-4`. Each card: `rounded-lg border border-dark-700 bg-dark-700/30 p-3`. Layout inside: app name as the first line (`text-sm font-medium text-slate-200`), then a `dl` as `grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mt-2` with `dt` (`text-slate-500`) and `dd` (`text-slate-300`) pairs for Sends back to, Access, Connected, Last used (same cell styles as the table), then the Disconnect button full width at the bottom (`mt-3 w-full justify-center min-h-[44px]`). The labels reuse the `apps.col_*` strings. At 375 px the card is the section width minus the card padding (about 295 px); `dd` values wrap and `break-all` on hosts prevents overflow. The page itself never scrolls horizontally; only the desktop table can scroll inside its own box, and it is hidden on phone.

The keys list stays as is (a scrolling table, outside this scope). Recommended later alignment, not part of this build: give keys the same card variant.

### 4.5 Disconnect button and inline confirm

- **Button (destructive ghost):** the existing `ghostBtn` shape with red text: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 text-red-400 border border-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`, icon `Unlink` or `Trash2 size={12}` (existing import), label `apps.disconnect`. Red-400 on dark-700 is 5.29:1; light remap rgb(185 28 28) on rgb(234 233 242) about 5.4:1. On phone add `max-md:min-h-[44px]`. Desktop height is about 28 px, above the 24 px AA floor. `aria-label="Disconnect {appName}"` so a screen reader on the table hears which app (string missing, section 11).
- **Not `window.confirm()`.** Pressing Disconnect sets `confirmId = grant.id` and swaps in the confirm block for that row only; one confirm open at a time (opening another closes the first).
- **Confirm block, desktop:** a second `<tr>` directly under the row, `<td colSpan={6}>` with `bg-red-500/10 border border-red-500/20 rounded-lg p-3`, containing `apps.confirm` as `text-xs text-slate-300` and two buttons: confirm (`apps.confirm_yes`) in the destructive style but filled for weight: `bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20` (red-400 on the red tint 5.92:1 dark; light #fef2f2 with rgb(185 28 28) 5.91:1), and `apps.confirm_no` as the plain ghost. Buttons side by side with `gap-2`.
- **Confirm block, phone:** replaces the card's Disconnect button area, same text and buttons stacked full width, 44 px tall each.
- **Focus:** opening the confirm moves focus to `apps.confirm_no` ("Keep connected", the safe choice, never the destructive button). Escape closes it and returns focus to that row's Disconnect button. Confirm yes: button disables with a spinner, request runs; on success the row is removed from state, focus moves to the `apps.heading` H3 (`tabIndex={-1}`, `outline-none`), because the row that held focus no longer exists. On failure the confirm closes, focus returns to that row's Disconnect button, and the row shows `apps.failure` below it in `text-xs text-red-400` (also in the live region).
- **Hub guard:** while a request is in flight, all Disconnect buttons stay enabled for other rows only if the builder keeps per-row `disconnectingId`; the simple rule is one request at a time (`disabled` on all Disconnect buttons while one runs), matching the keys list `revokingId` behaviour.

### 4.6 State inventory (Connected apps)

| State | When | What renders | Announcement |
|---|---|---|---|
| Loading | `list_grants` in flight | Heading and helper render at once. Below: two skeleton rows. Desktop: two `Skeleton h-8 w-full` blocks; phone: two `Skeleton h-28 w-full rounded-lg` blocks. Matches the final row and card heights so the section does not jump when data lands. | Live region (section 4.7) says nothing while loading; the visible skeleton is enough, and the keys list above already announces its own load |
| Empty | Success, zero grants, gate open | `apps.empty` as `text-xs text-slate-500 mt-3`. The endpoint URL inside is plain text styled `font-mono text-slate-300`, with a small `CopyBtn` beside it (existing component) so the user can paste it into Claude. | None |
| Success (list) | One or more grants | Table (md up) or cards (below md) | None on load |
| Partial | Gate closed (downgraded plan) but live grants survive | Same list and working Disconnect, plus a note above the list in the same style as `McpAccessSection.tsx:494`: `text-[11px] text-slate-600 mt-4`. Dark remap makes slate-600 6.96:1; light rgb(71 85 105) 6.29:1. String missing, see section 11. | None |
| Locked-by-plan | Gate closed, zero grants | Render nothing for Connected apps. The keys block above already carries the upgrade prompt; a second one would be a duplicate. | n/a |
| Error | `list_grants` failed (not 503) | `apps.load_error` in `text-xs text-red-400 flex items-center gap-1.5` with `AlertTriangle size={13}`, plus a `Retry` ghost button (the same one the keys error uses, `McpAccessSection.tsx:428`) | Live region: `apps.load_error` |
| Unavailable | `list_grants` answered 503 (migration not applied) | Render nothing; the keys block above already shows its neutral unavailable line, and grants live in the same migration | n/a |
| Confirming | Disconnect pressed | Section 4.5 | Live region: `apps.confirm` is read by moving focus; no extra announcement |
| Disconnecting | Confirm yes pressed | Confirm button disabled with spinner, label unchanged | Live region: disconnecting string, section 11 |
| Disconnect success | Server ok | Row gone, focus to H3 | Live region: `apps.success` |
| Disconnect failure | Server error | `apps.failure` under the row | Live region: `apps.failure` |

### 4.7 Live region and motion

- One persistent `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">` inside the Connected apps block, rendered always, written to on disconnect progress, success, failure and load error.
- Motion: spinners only, with `motion-reduce:animate-none`; skeleton uses the existing `animate-pulse` (frozen by `index.css:723`). Row removal is instant, no exit animation: the job is accuracy of the announcement and focus, not decoration.

---

## 5. Token application (everything named, nothing new)

| Use | Token or class | Exists at |
|---|---|---|
| Page canvas | `bg-dark-900` | `tailwind.config.js:30`, `index.css:7` |
| Card | `bg-dark-800 border border-dark-700 rounded-card p-card-feature` | `index.css:604, 753, 757` |
| Chip, ghost fill, elevated row | `bg-dark-700`, `bg-dark-700/60`, `bg-dark-700/40`, `bg-dark-700/30` | `index.css:9` |
| Control hover | `bg-dark-600` | `index.css:10` |
| Primary | `bg-brand-600` hover `bg-brand-700`, `text-white` | `tailwind.config.js:23, 24`; `index.css:240` |
| Accent text, icons | `text-brand-300`, `text-brand-400` | `index.css:194, 195` |
| Checkbox accent | `accent-brand-500` | used at `McpAccessSection.tsx:545` |
| Caution | `bg-amber-500/10`, `border-amber-500/30`, `text-amber-300` | `index.css:213, 214, 314` |
| Failure | `bg-red-500/10`, `border-red-500/20`, `border-red-500/30`, `text-red-400` | `Login.tsx:91`; `index.css:212, 307` |
| Text | `text-white`, `text-slate-200` to `500` | `index.css:151, 166 to 190` |
| Focus ring | global `:focus-visible` (`--rail-active`) and `focus-visible:ring-brand-400` on the checkbox | `index.css:633` |
| Motion | `animate-spin motion-reduce:animate-none`, `animate-pulse` | Tailwind; `index.css:723` |
| Skeleton | `<Skeleton className="...">` | `components/Skeleton.tsx` |

No amendment to `docs/DESIGN-SYSTEM.md` is needed. Observed existing defect, not fixed here: the repo's `ghostBtn` and every card/control border use `border-dark-600`, 1.72:1 on dark-800 and 1.43:1 on white, below the 3:1 non-text floor; every such control is identified by its label text, so this spec relies on that. Recommend `bg-verify` log it as a system-wide finding; do not change it in this build.

## 6. Data legibility

- Dates: `fmtDT` as the keys list (day, short month, year, locale). Never show a time or relative text.
- App name: plain text, clipped at 60 characters by the server, `break-words`.
- Hosts: shown as received, lowercase, no scheme, no path. Loopback is never shown as a host in the apps list; it reads `apps.redirect_loopback`.
- Access: exactly two values. The scope string (`mcp:read mcp:write offline_access`) is never shown to the user.
- A chart is never needed here; every datum is a label.

## 7. Hub line

Same style as the existing "by an AI agent" line; nothing visual changes.
- Code location: `brandgeo-dashboard/src/pages/AIVisibility.tsx:1074`, where `doneFixLine` builds `by` from `row.marked_by_key` through `fixByAgent(keyLabels.get(...))` (`aiVisibilityCopy.ts:208`).
- Change (for bg-app, per copy deck section 3): add `fixByApp(appName?: string | null): string` beside `fixByAgent`, returning ` by ${appName}` or ` by an AI agent` when empty. In `doneFixLine`: `const by = row.marked_by_grant ? fixByApp(grantNames.get(row.marked_by_grant)) : row.marked_by_key ? fixByAgent(...) : ''`. The result flows through the same `fixMarkedOn`, `fixDoneWaiting` and `fixDismissedLine` helpers, so the text style, size and colour are unchanged. App name rendered as plain text only (React text node, never `dangerouslySetInnerHTML`).
- Data dependency to flag for bg-backend and bg-app: the line must still read "by Claude" after the grant is disconnected, but arch 6.1 lists only live grants. The hub therefore needs the grant's `client_name` for revoked grants too, either through a `list_grants` flag that includes revoked rows for name lookup, or a name stored on `fix_states`. If the name cannot be read, the copy deck's fallback applies (" by an AI agent"), which is correct but loses the name. Needs a decision from bg-architect, see section 11.

## 8. Accessibility floor (non-negotiable, for bg-verify)

| Pair | Dark | Light |
|---|---|---|
| H1 `text-white` on dark-800 | 17.85:1 | 17.85:1 (remap rgb(15 23 42) on white) |
| Body `text-slate-300` on dark-800 | 12.02:1 | 9.99:1 on #fffbeb, 10.35:1 on white |
| `text-slate-400` on dark-800 | 6.96:1 | 7.58:1 |
| `text-slate-500` (muted labels, footnote) | 6.96:1 (remapped) | 6.03:1 |
| `text-slate-600` (footer) | 6.96:1 (remapped) | 6.29:1 |
| `text-brand-300` on dark-800 | 9.67:1 | 7.10:1 (remap rgb(109 40 217)) |
| `text-brand-400` link on dark-800 | 6.56:1 | 7.10:1 |
| Allow: white on brand-600 / hover brand-700 | 5.70 / 7.10:1 | 5.70 / 7.10:1 |
| Cancel: slate-200 on dark-700 | about 11.8:1 | 8.60:1 |
| Warning text slate-300 on amber tint | 10.28:1 | 9.99:1 |
| Warning icon amber-300 on amber tint | 10.58:1 | 4.84:1 (passes 3:1 non-text) |
| `text-red-400` on dark-700 / red tint | 5.29 / 5.92:1 | about 5.4 / 5.91:1 |
| Focus ring on dark-800 / dark-900 | 6.56 / 7.02:1 | 5.70:1 on white, 4.73:1 on dark-700 |
| Checked checkbox fill brand-500 vs surface | 4.22:1 | 4.23:1 |

Control borders (`border-dark-600`) fail 3:1 and are not relied on; every control has a visible text label of at least 4.5:1 (see section 5 note). Heading order: H1, then H2. Hit targets 44 px on the consent page and on phone in Connected apps, 24 px AA on desktop table buttons. Focus ring never removed; only the H1 uses `outline-none` because script-only focus. Reduced motion: section 3.6 and 4.7. 200 percent zoom and 320 px reflow: no horizontal scroll, section 3.5.

## 9. Reference frames

- **Consent card:** Stripe's Connect OAuth screen (one centered card, app name and what it can do before the buttons). Borrowed attribute: the permissions list reads as plain-language sentences, not scope strings.
- **Write opt-in box:** Linear's scoped integration prompts. Borrowed attribute: a separate, quieter bordered group so extra power is visibly a second decision.
- **Connected apps list:** Vercel's Integrations settings list. Borrowed attribute: name, last activity, one destructive action per row with an inline confirm, nothing else.

## 10. Build checklist for bg-app

Files in scope: `brandgeo-dashboard/src/pages/OAuthAuthorize.tsx` (new), `src/App.tsx` (one route), `src/pages/Login.tsx` (honour `next` only when it starts with `/oauth/authorize?`, arch 4.2 step 2), `src/components/McpAccessSection.tsx` (Connected apps), `src/pages/AIVisibility.tsx` and `src/lib/aiVisibilityCopy.ts` (hub line), `src/types/` if a grant type is shared. Backend contract (`oauth-authorize.js`, `client-api-keys.js list_grants/revoke_grant`) is bg-backend's.

Consent page
- [ ] Route `/oauth/authorize` outside `PrivateRoute`, `OnboardGate`, `Layout`.
- [ ] Shell and card classes as 3.1; `max-w-md`; no horizontal scroll at 375, 768, 1280.
- [ ] Mark without `href`; H1 `tabIndex={-1}`, focused once after `check` resolves; Allow has no `autoFocus`.
- [ ] All strings by copy key, verbatim; `{appName}` and `{brandName}` as text nodes, `break-words`.
- [ ] Loopback variant: host test for `localhost` and `127.0.0.1`, `consent.redirect_loopback`, amber warning box.
- [ ] Eight read items as a real `ul`; `consent.read_limits` below.
- [ ] Write group only when requested; real checkbox with label, `aria-describedby`, unticked on every load, 44 px label row.
- [ ] Allow `bg-brand-600 hover:bg-brand-700` (not brand-500); Cancel ghost; both `min-h-[44px]`, stacked.
- [ ] Loading skeleton matching the final layout; `consent.loading` visible and in live region.
- [ ] Deciding: all controls disabled, spinner on pressed button with `motion-reduce:animate-none`, no label change.
- [ ] Done: `consent.sending` line in a block of the same height; redirect via `window.location.assign`.
- [ ] Nine error and refusal states with the copy deck headings, bodies and one button each; amber icon for refusals, red for `error.generic`; admin refusal signs out to `/login?next=`.
- [ ] Persistent `role="status"` sr-only live region; no `role="alert"`; Escape does nothing.
- [ ] No raw hex, no `dark:`, no inline colour.

Connected apps
- [ ] `list_grants` loaded independently of the keys; error and 503 handled as 4.6.
- [ ] Desktop table (`hidden md:block`) and phone cards (`md:hidden`), columns and styles as 4.2 to 4.4.
- [ ] Access text only, no pill; shared wording with keys.
- [ ] Destructive ghost Disconnect with `aria-label`, 44 px on phone; inline confirm row/block (no `window.confirm`), focus to "Keep connected", Escape cancels and restores focus.
- [ ] On success remove the row, focus the H3; `apps.success` and `apps.failure` in the live region.
- [ ] States: loading skeleton, empty, list, partial note, locked (render nothing), error with Retry.
- [ ] `Connected apps` block hidden entirely when unavailable (503) or locked with no grants.

Hub line
- [ ] `fixByApp` in `aiVisibilityCopy.ts`; `AIVisibility.tsx:1074` prefers `marked_by_grant`; plain text; fallback " by an AI agent".

Checks
- [ ] Both themes visually checked; `rg "[\x{2013}\x{2014}]"` on added lines returns nothing; `tsc` and build exit 0; keyboard walkthrough of both surfaces.

## 11. Missing from the copy deck (bg-copy to supply, keys proposed)

1. `consent.title` (document title), proposed "Connect an app · BrandGEO" (matches `Login.tsx:37` pattern).
2. `consent.deciding`, live region and visually hidden text while Allow or Cancel posts. Without it the deciding state is silent.
3. `consent.app_fallback`, name used when the app name is empty or the request is missing (for `{appName}` in `consent.heading`, `consent.intro`, `error.request_expired`, `apps.confirm`, `apps.success`, `apps.failure`). Proposed "the app".
4. `apps.loading`, live region or visible line while grants load. Optional, since the skeleton is visible.
5. `apps.disconnecting`, live region while the request runs.
6. `apps.disconnect_aria`, "Disconnect {appName}", the accessible name of each row's Disconnect button.
7. `apps.col_actions`, sr-only column header (keys list uses plain "Actions").
8. `apps.partial_note`, shown above the list when the plan no longer passes the gate but grants survive (parallel to the keys list note at `McpAccessSection.tsx:494`).
9. `apps.name_fallback`, the app cell when `client_name` is empty (the hub line already has " by an AI agent"; the table needs its own).
10. `error.generic` retry button is "Try again"; the buttons "Go to your dashboard", "See plans", "Sign out" exist only inside the section 1.2 table, not as keys. Assign keys `error.btn_dashboard`, `error.btn_plans`, `error.btn_signout`, `error.btn_retry`.
11. Retry button on `apps.load_error`: reuse "Retry" from the keys error, or add `apps.retry`.

Decision for bg-architect (not copy): the hub needs the app name for revoked grants (section 7).

## 12. Verification of this document

Dash scan, `rg "[\x{2013}\x{2014}]"` on this file: result recorded in the handback report together with a positive control.
