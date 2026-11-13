PASS WITH FINDINGS

# Invite link 7 days: frontend and contract review

Reviewer: bg-verify (Opus), read-only on code, 2026-11-13. Lens: frontend and the contract between the dashboard and the two functions it calls. Spec: `docs/arch/invite-link-7-days.md` (sections 3, 4, 6.2, 6.3, 6.5, 6.6, 9, 10). The backend lens (auth, rotation, fallback internals, provisioning) is a separate review.

Counts: 0 BLOCKER, 0 MAJOR, 3 MEDIUM, 5 LOW, 8 INFO. Nothing here needs a revert; the three MEDIUM should be closed before the push, they are small edits in bg-app's own scope.

Files read in full: `src/lib/inviteLink.ts`, `src/pages/Invite.tsx`, `src/components/PendingInvitesPanel.tsx`, `tests/invite_link_client.test.js`, `netlify/functions/invite-redeem.js`, `src/pages/ResetPassword.tsx`, `src/lib/authLinkState.ts`; the diff of `App.tsx`, `Onboard.tsx`, `resend-invite.js`, `_provision_client.js`; the relevant parts of `_invite_link.js` (275-365), `App.tsx` (40-150), `Onboard.tsx` (108-136, 726-850), `src/index.css` tokens, `tailwind.config.js` colour map, `src/components/ui/Button.tsx`, `BrandGeoLogo.tsx`, and Vite 5.4.21's preload helper.

---

## 1. Acceptance criteria (spec 6.5, 6.6, 10 bg-app)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | `inviteLink.ts` has no imports, `INVITE_TOKEN_RE` equal to the server literal | PASS | `inviteLink.ts:10`; `_invite_link.js:34`; mirror check in `tests/invite_link_client.test.js:162-170` passed, with its positive control `:172-180` |
| A2 | `parseInviteToken` reads the fragment only, query `t` ignored, 42/44 chars, `+`, `/` refused, malformed URL null | PASS | `inviteLink.ts:13-23`; tests `:40-108` passed |
| A3 | `linkStateFromExpiry` unknown on null or unparseable, expired when `now >= t` | PASS | `inviteLink.ts:28-33`; tests `:123-152` (strict boundary `:143-145`) |
| A4 | `/invite` public lazy route beside `/reset-password`, no PrivateRoute, OnboardGate or Layout | PASS | `App.tsx:19`, `:282` |
| A5 | Mount: token read once, address bar stripped, ResetPassword chunk prefetched, no function call | PASS | `Invite.tsx:82`, `:101`, `:102-107`; one `fetch` in the file, inside `handleContinue` (`:139`), pinned by test `:214-219` |
| A6 | Continue: POST `invite-redeem`; type must be `invite` or `signup`; chunk awaited before `navigate(..., { replace: true })` | PASS, see M1 | `Invite.tsx:139-180` |
| A7 | 400 and 404 to `invalid`, 410 to its stage, 429, 503, non-JSON and network failure stay on `ready` with an inline error | PASS | `Invite.tsx:183-195`, `:151-154`; server statuses `invite-redeem.js:84`, `:120-138`, `:240`, `:252-253` |
| A8 | Hand-off lands on the ResetPassword `form` stage | PASS (by source) | GoTrue `hashed_token` is hex; `authLinkState.ts:20` accepts `[A-Za-z0-9_-]{16,256}`, `:19` lists `invite` and `signup`; server re-checks the same regex `invite-redeem.js:40`, `:253`; `ResetPassword.tsx:67-70` reads the query and starts on `form`, `:106-110` strips |
| A9 | Token never in storage, console or a log | PASS | static checks `tests/invite_link_client.test.js:198-212` passed; state only `Invite.tsx:82` |
| A10 | Demo mode: Continue goes to `/reset-password` with no token | PASS | `Invite.tsx:83`, `:120-123` |
| A11 | Focus moves to the heading on each stage change, not on load | PASS | `Invite.tsx:92`, `:112-116` |
| A12 | Panel types: new row fields, nullable `client_name` and `plan`, response and error code additions | PASS | `PendingInvitesPanel.tsx:40-60`, `:68-91`, `:93-96` against `resend-invite.js:294-300`, `:510-520`, `:463-470` |
| A13 | `linkState`, `FALLBACK_TTL_MINUTES`, ttl state gone; badge from `link_expires_at` only | PASS | `PendingInvitesPanel.tsx:212-221`; test `:221-228` |
| A14 | Valid badge shows time left (C-P1); "Continue pressed {age}" (C-P3) | PASS | `:163-174`, `:216-218`, `:229` |
| A15 | Row patched after a resend from the response; `link_last_pressed_at` cleared; C-P7 and C-P8 branching | PASS, see M3 | `:664-699` |
| A16 | Copy link: confirm (C-P5), `delivery: 'copy'`, read-only field, warning (C-P6), state only, cleared on close, reload, unmount, shares the 60 s lock | PASS, see M2, L1, L2 | `:394-421`, `:259-324`, `:577-589`, `:623`, `:686-689`, `:701-706` |
| A17 | `Onboard.tsx` text (C-O1) and comment | PASS, see I3 | `Onboard.tsx:729-733`, `:823-826` |
| A18 | `tests/invite_link_client.test.js` exists and passes | PASS | section 6 below: 33 passed, 0 failed |

---

## 2. Findings

### M1 MEDIUM: a failed ResetPassword chunk load on `/invite` reloads the page and throws the token away

Where: `src/App.tsx:81-85` (the global `vite:preloadError` listener) together with `src/pages/Invite.tsx:101-107` and `:166-176`.

Scenario, read from the installed Vite 5.4.21 preload helper (`node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js`, function `preload`): every dynamic `import()` in app code is wrapped, and `baseModule().catch(handlePreloadError)` dispatches `vite:preloadError` for a failure of the chunk ITSELF, not only of its CSS or dependency preloads. The listener in `App.tsx:82-84` then calls `reloadOnce()` (a real `window.location.reload()`) and `preventDefault()`, so the import promise RESOLVES with `undefined` instead of rejecting.

1. On mount, `Invite.tsx:101` strips the address bar to `/invite`, then `:104` starts the prefetch. If that GET fails (a phone dropping signal, a captive portal), the page reloads at `/invite` with no fragment, `parseInviteToken` returns null and the person sees "We could not open this invite. The link may be incomplete or no longer active. Ask the person who invited you to send a new one". The link is fine; the copy sends them to the admin for nothing. `Invite.tsx:105` (`p.catch`) never runs, because the promise resolved.
2. On Continue, after a 200 from redeem, if the fallback `loadResetPasswordChunk()` at `:167` or `:171` hits the same listener, `await pending` resolves with `undefined`, so the code at `:177-179` goes on to `navigate('/reset-password?token_hash=...')` while a reload has just been requested. What the browser then reloads (the `/invite` entry or the URL carrying `token_hash`, which would put the minted token in a CDN request log) depends on browser timing. NOT reproduced; recorded because the fix is the same.

Fix (bg-app, `App.tsx` is in its scope):
- In the listener at `App.tsx:82`, return early without reloading when `window.location.pathname === '/invite'`, so the rejection reaches `Invite.tsx`'s own catch, which keeps the token in memory and shows the inline retry error.
- In `Invite.tsx`, treat a resolved-but-empty module as a failure: `const mod = await pending; if (!mod) { fail('ready', MSG_GENERIC); return }` (and the same after the retry at `:171`), so a future listener change cannot let `navigate` run on a non-loaded chunk.

### M2 MEDIUM: keyboard focus drops to the page body after Cancel, Escape, Close and a failed Copy link

Where: `src/components/PendingInvitesPanel.tsx:351-359` and `:384`.

Scenario: `cancel()` calls `onCopyLinkCancel(row)` (a state update that renders later) and then, synchronously, `triggerRef.current?.focus()`. At that moment the trigger is still rendered with `disabled` because `confirming` is still true (`:384`, `Button.tsx:39` passes `disabled` to the native button), and a disabled button cannot take focus, so the call is a no-op; the focused Cancel button is then unmounted and focus falls to `<body>`. Every Cancel and every Escape (`:398`) does this. `closeLink()` (`:356-359`) does the same for the whole 60 s lock, because the trigger is disabled while `state.locked` (`:384`); this is the gap the builder noted. After Continue (`:407`), the confirm group unmounts; on success the new field takes focus (`:267-270`), but on a refusal (`link_unavailable`, `busy`) focus stays on `<body>` with only the polite live region speaking. WCAG 2.4.3.

Fix: move focus in an effect after the render, never in the handler. Keep a `returnFocusRef` set by `cancel`, `closeLink` and the copy failure, and in a `useEffect` on `[confirming, url, state.locked, state.busy]` focus the Copy link trigger when it is enabled, else the Resend button when enabled, else a fallback element in the row (the action container with `tabIndex={-1}`). Alternatively keep the trigger focusable while confirming and locked by using `aria-disabled` with a no-op click instead of `disabled`.

### M3 MEDIUM: a failed resend or copy leaves the row's badge claiming the earlier link is valid when the server has already killed it

Where: `src/components/PendingInvitesPanel.tsx:707-714`.

Scenario, traced through the server as built: `_invite_link.js:303-311` supersedes the active row BEFORE the insert and the send. Then (a) copy delivery with an insert error returns `link_unavailable` (`:317-318`), and (b) email delivery whose Resend send is refused falls back (`:359-365`) and, if the fallback answers 429 or another error, `resend-invite.js:463-470` answers 429 `rate_limited` or 502 `invite_failed`. In both cases the earlier 7 day link now answers 410 `replaced` (`invite-redeem.js:130`), but the panel only reloads on `already_accepted` (`:710-713`), so the row keeps "Link valid, 6 days left" until a manual Refresh. The spec's requirement is that the panel shows the real state of the link; an admin reading that badge tells the person to use a link that is dead.

Fix: in the failure branch, call `void load()` for every server answer except `bad_request` and a network failure (at least `rate_limited`, `invite_failed`, `link_unavailable`, `busy`, `orphan_created`, `not_found`), keeping the row's error sentence. `load()` already drops shown links, which is right here too.

### L1 LOW: after "Copy link" the Resend button reads "Sent" although no email went out

Where: `PendingInvitesPanel.tsx:376` with `:686`. A copy sets `locked: true`, and the label is `state.locked ? 'Sent' : 'Resend invite'`. Fix: record the last successful kind (`lastKind: InviteDelivery`) in `RowActionState` and render "Link created" (copy: pending bg-copy) when it was a copy.

### L2 LOW: an email resend leaves an earlier copied link on screen after the server killed it

Where: `PendingInvitesPanel.tsx:660`. After the 60 s lock, Resend is enabled while the copy field is still shown; a successful email resend supersedes that link, but `copyUrl` stays with its "Anyone with this link can set up this login until ..." warning, so the admin can paste a dead link. Fix: add `copyUrl: null, copyExpiresAt: null` to the patch at `:660` when `delivery === 'email'`.

### L3 LOW: several new literals are not marked "copy: pending bg-copy", while the file header says every one is

Where: `PendingInvitesPanel.tsx:21-22` (the claim) against `:308` ("Copied", "Copy"), `:311` ("Close"), `:318` (the C-P6 variant without a date), `:320-321` ("Link copied", the two "Could not copy" sentences), `:410`, `:413` ("Continue", "Cancel"), and the new `aria-label` sentences at `:298`, `:306`, `:310`, `:386`, `:397`, `:408`, `:412`. `Invite.tsx` is covered by its header (`:14`) plus the marked constants, but its JSX literals at `:216-217`, `:226`, `:206-207`, `:237` carry no marker of their own. Fix: add the marker to each, or one marker comment per JSX block, so a grep for the marker finds every sentence bg-copy owns.

### L4 LOW: the C-P8 caution is styled as a success

Where: `PendingInvitesPanel.tsx:424`, `:681`, `:687`. "The previous email link may still work for up to 24 hours." is a warning and renders in `text-pos-ink` (green), and on a copy it is the only message shown. Fix: carry it in its own field (`caution`) rendered with `text-warn` (11.3:1 dark, 8.7:1 light on `bg-surface`, computed below).

### L5 LOW: `formatTimeLeft` has no test

Where: `PendingInvitesPanel.tsx:163-174`. The boundaries the panel promises (just sent reads 7 days, 23 h 59 m reads 23 hours, under an hour, zero and negative, null, unparseable) are pure and exported but untested; the one hour slack (`:172`) makes 47 h read "2 days left", which is deliberate but should be pinned. Fix: move `formatTimeLeft` and `formatAge` into `src/lib/inviteLink.ts` (no imports there) and add cases to `tests/invite_link_client.test.js`.

### I1 INFO: C-P5 promises more than the server guarantees in one branch

`PendingInvitesPanel.tsx:123` (spec C-P5): "The link in the last invite email stops working." True for a 7 day link (superseded at once). For a Supabase link it holds only when the rotation succeeds; when it fails the server sends `previous_link_revoked: false` and the panel adds C-P8, which corrects it after the fact. Spec copy, not a builder defect: route to bg-copy (for example "usually stops working at once").

### I2 INFO: "valid for 7 days" in the wizard is not true on the fallback path

`Onboard.tsx:732` shows 7 days for a viewer. When `channelReady` is false (kill switch, no Resend key, table missing) or Resend refuses, a viewer gets the Supabase 24 hour invite (`_provision_client.js` diff, `useLink`). The builder's role branch is already more accurate than spec C-O1. bg-copy may want "up to 7 days".

### I3 INFO: the wizard's own "Resend invite" does not refresh the panel

`Onboard.tsx:115-136` posts the legacy `{ email }` form, which now issues a 7 day link with rotation (`resend-invite.js` `resendByEmail`), but `PendingInvitesPanel` reloads only on `refreshKey` (`Onboard.tsx:849`), so the row below keeps the old expiry until Refresh. Pre-existing pattern; the cheap fix is to bump a counter into `refreshKey` after a successful wizard resend.

### I4 INFO: "Copied" breaks label-in-name for voice control

`PendingInvitesPanel.tsx:306-308`: visible "Copied", accessible name "Copy invite link for ...". The status region (`:320`) covers screen readers. WCAG 2.5.3, admin only.

### I5 INFO: "press Ctrl+C" is wrong on a Mac

`PendingInvitesPanel.tsx:321`. bg-copy: "copy it with your keyboard".

### I6 INFO: a deploy preview origin gets a permanent generic error on Continue

`invite-redeem.js:78` answers 403 to an Origin outside `ALLOWED_ORIGINS`; `Invite.tsx:195` maps it to "Something went wrong. Please try again." with a working button that can never succeed. Production is unaffected (same origin). Worth knowing before testing `/invite` on a Netlify preview URL.

### I7 INFO: the `used` stage shows one link, not two

`Invite.tsx:236-239`: C-I7 asks for "Sign in" and "Forgot your password?" under every dead end; on `used` the builder drops the second "Sign in" because C-I5's button already is one. Sensible, recorded so it is not re-flagged.

### I8 INFO: legacy `dark-*`, `text-white`, `text-slate-*` classes on `Invite.tsx` are acceptable

They are not raw colours: `tailwind.config.js:113-121` maps `text-white` and `text-slate-*` to `--br-text-*`, and `src/index.css:40-43` and `:208-211` redefine `--dark-*` for `html.light` (`:230-236` for the text values). So the page flips with the theme exactly like `ResetPassword.tsx`, whose shell it copies. The semantic tokens would be preferable for new code (`bg-canvas`, `bg-surface`, `border-line`, `text-ink`, `text-ink-2`); not required for this release, since the page must match the form it hands off to.

---

## 3. Contract check, field by field

`invite-redeem` (as built) against `Invite.tsx`:

| Server | Page |
|---|---|
| 200 `{ ok: true, token_hash, type }` (`invite-redeem.js:272`), `type` in `invite`, `signup` (`:252`), hash matches `[A-Za-z0-9_-]{16,256}` (`:253`) | checks `ok === true`, string hash, type again (`Invite.tsx:157-164`) |
| 400 `bad_request` (`:81-84`) | `invalid` (`:191`) |
| 404 `invalid` (`:120`, `:125`, `:131`, `:167`, `:181`, `:247`, `:285`) | `invalid` (`:191`) |
| 410 `replaced`, `used`, `expired` (`:130`, `:132`, `:138`, `:187`, `:235`, `:294`) | own stages; an unknown 410 code reads `invalid` (`:184-189`) |
| 429 `rate_limited` (`:103-104`, `:240`) | `ready` plus C-I6 first sentence (`:192`) |
| 503 `unavailable` | `ready` plus generic sentence (`:195`) |
| 403 `{ error }`, 405 text | generic sentence, see I6 |
| Headers `Cache-Control: no-store`, `Referrer-Policy: no-referrer` on every answer (`:68-72`) | nothing to read |

`resend-invite` (as built) against `PendingInvitesPanel.tsx`:

| Server | Panel |
|---|---|
| list row `link_channel`, `link_expires_at`, `link_last_pressed_at`, `invited_at` from the row when active (`resend-invite.js:263-300`) | typed `:55-59`, read `:213`, `:224` |
| list read error: every row `unknown`, expiry null (`:219-240`, `:270`) | "Link state unknown" (`:220`) |
| top level `invite_link_days`, `link_ttl_minutes` | typed, not used for display (`:71-74`) |
| resend 200 `invited_at`, `channel`, `delivery`, `link_expires_at`, `previous_link_revoked` on brandgeo only, `invite_url` on copy only with `Cache-Control: no-store` (`:505-521`) | success test on `invited_at` (`:664`), patch `:671-679`, C-P7 by channel (`:695-697`), C-P8 only on `=== false` (`:681`), url only from `invite_url` (`:683`) |
| Supabase fallback 200: `channel 'supabase'`, `link_expires_at = invited_at + 1440 min` (`:504`, `:507`) | "Invite sent. The link works for 24 hours." |
| refusals `{ error, code }`: `busy` 409, `link_unavailable` 503, `already_accepted` 409, `rate_limited` 429, `invite_failed` 502, `orphan_created` 500, race guard 409 `not_found` (`:463-470`, raceGuard) | server sentence shown as sent (`:563-566`); `already_accepted` also reloads (`:710-713`); see M3 for the others |
| legacy `{ email }` with `delivery 'copy'`: 400 | the panel never sends it |

No field name, status code or shape mismatch found.

---

## 4. Security notes (frontend lens)

No security finding. Checked and holding: the token is read from the fragment only (`inviteLink.ts:16-17`); the query is ignored even when it holds a different token (test `:56-59`); the address bar is stripped before the only request the page makes on load (`Invite.tsx:101` then `:104`), and a fragment never travels in a Referer or a request line anyway; no storage, console or cookie access in the page, the lib or the panel (static tests); the logo is an inline SVG (`BrandGeoLogo.tsx:141`), so rendering `/reset-password` with the query present fetches no image; the minted hash is URI-encoded and the type is checked before it reaches the address bar (`Invite.tsx:161`, `:179`); the copied link lives in component state, is dropped on Refresh (`:623`), Close (`:733`) and unmount, and is written only to the clipboard (`:275`, pinned by test `:230-236`). The one path that can break the "chunk loaded before navigate" rule is M1. Sentry is inert today (no DSN, per CLAUDE.md 2026-11-01); if it is switched on, its navigation breadcrumbs would record the `replaceState` from `/invite#t=...`, which `observability.ts:64` strips of `?` and `#` before sending, so that stays clean.

---

## 5. Accessibility

Contrast, every new text-on-surface pair, computed from the token values in `src/index.css` (dark `:13-35`, light `:181-203`, legacy text `:85-97`, `:230-242`):

| Pair | Dark | Light |
|---|---|---|
| `text-warn` on `bg-surface` (C-P6) | 11.3:1 | 8.7:1 |
| `text-neg` on `bg-surface` (copy failure) | 7.0:1 | 8.0:1 |
| `text-ink-2` on `bg-surface` (C-P5, C-P3) | 7.3:1 | 7.3:1 |
| `text-ink-2` on `bg-surface-2` (C-P3 on a phone card) | 6.9:1 | 6.7:1 |
| `text-ink` on `bg-surface-2` (link field) | 14.6:1 | about 18:1 |
| `border-edge` on `bg-surface` (field border, non-text) | 3.5:1 | 3.7:1 |
| `text-pos-ink` on `bg-surface` (C-P7, and C-P8 per L4) | 9.5:1 | 7.1:1 |
| Invite heading `text-white` on `bg-dark-800` | about 18.9:1 | about 17.8:1 |
| Invite body `text-slate-400` on `bg-dark-800` | 7.3:1 | 7.6:1 |
| Invite links `text-brand-400` on `bg-dark-800` | 6.9:1 | 7.1:1 |
| Invite error `text-red-400` on `bg-red-500/10` over `dark-800` | 6.3:1 | 5.9:1 |
| Invite button `text-on-accent` on `bg-accent-strong` | 5.7:1 | 7.1:1 |
| Invite footer `text-slate-600` on `bg-dark-900` | 7.7:1 | 7.1:1 |

Keyboard: every new control is a native button, link or input; all reachable by Tab. Focus visibility: `Button` carries its ring; the Invite button adds `focus-visible:ring-2 ring-brand-400`; the link field has its own ring. Focus order: M2. Heading order: `Invite.tsx` has one `h1` per stage; the panel adds no heading. Hit targets: Invite button about 40 px, 44 px on a phone; panel `sm` buttons 28 px desktop, 44 px phone (`Button.tsx:21`); link field 28 px, 44 px phone. Live regions: `role="status"` for Opening, the copy result and the list notice, `role="alert"` for the Invite error, `aria-live="polite"` per row.

---

## 6. Reproduced

```
node tests/invite_link_client.test.js
  first run: crashed inside node_modules/typescript/lib/typescript.js with a garbled source line (the machine's memory, as warned)
  rerun:     invite_link_client: 33 passed, 0 failed   exit=0
node tests/auth_link_state.test.js
  auth_link_state: 18 passed, 0 failed   exit=0
```

Dash scan on every added line of the tracked diff (`invite-diff.patch`), `rg -n "^\+.*[em dash or en dash class]"`: 0 hits; positive control on a line holding an em dash: 1 hit. The three new client files are scanned by the test itself (`:241-252`, with its own control).

Vite helper read from `node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js` (version 5.4.21): `return baseModule().catch(handlePreloadError)`, the basis of M1.

Regression surface, by grep: `PendingInvitesPanel` is imported only by `src/pages/Onboard.tsx:15`; `PendingInvitesList`, the removed `linkState`, `LinkState` and the removed `linkTtlMinutes` prop have no other importer in `src/` or `tests/`; `src/lib/inviteLink.ts` is imported by `Invite.tsx:21` and `PendingInvitesPanel.tsx:27` only; `Invite` by `App.tsx:19` only (lazy). No `motion` import, no `scrollIntoView`, no new dependency (`Link2` is from `lucide-react`, already used) in the new or changed client files. No props change to any component under `src/components/ui/`. Paths worth a manual look after the build: Onboard (the panel), `/invite`, `/reset-password` reached from `/invite`.

## 7. Not checked

- `tsc`, the build, the chunk sizes of section 11 and every browser check: forbidden from this seat; the orchestrator runs them. Nothing in the reviewed TypeScript looked likely to be refused (`React.ReactNode` without a React import matches `ResetPassword.tsx:242`, which compiles today).
- The real hand-off in a browser: that React Router's `navigate` writes the query before the lazy `ResetPassword` renders, that no request leaves while the query is in the address bar, and that the page lands on `form`. Traced by source only.
- The browser outcome of M1 point 2 (which URL a reload requested during `navigate` lands on).
- StrictMode double effects at run time (read: `Invite.tsx:99-109` and `:92` are written for it).
- Light mode, phone width, a screen reader, Firefox, Safari's clipboard permission.
- The server tests (`invite_link.test.js`, `invite_redeem.test.js`, `resend_invite.test.js`, the provisioning suites): backend lens.
- The email copy C-E1 to C-E6 and `_invite_link.js` beyond lines 275 to 365.
- The live Resend tracking settings, the migration, GoTrue's real `hashed_token` shape on the deployed version (relied on as hex from the spec's source reading).
