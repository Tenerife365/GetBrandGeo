VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 0 medium, 2 low, 6 info)

# Invite link recovery, auth correctness and security lens, 2026-11-11

INTENT: review invite-link recovery (ResetPassword.tsx rewrite + authLinkState.ts)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify

Reviewer: bg-verify, auth lens only. Read-only on source. No npm, tsc, vite, browser, git write, account, email or production auth call was made.

## 1. What was reviewed

- `brandgeo-dashboard/src/pages/ResetPassword.tsx`, working tree, 320 lines (`git diff --stat`: 277 insertions, 44 deletions).
- `brandgeo-dashboard/src/lib/authLinkState.ts`, new, untracked, 72 lines.
- Read against: `node_modules/@supabase/auth-js/dist/main/GoTrueClient.js` (auth-js 2.110.0 per its package.json): `_initialize` (341 to 400), `_getSessionFromURL` (3167 to 3255), `_isImplicitGrantCallback` (3265), `_isPKCECallback` (3274), `verifyOtp` (1964 to 2000), `onAuthStateChange` and `_emitInitialSession` (3533 to 3590), `resetPasswordForEmail` (3648 to 3675); `lib/fetch.js` (network codes 32 to 34, error mapping 38 to 84); `lib/errors.js` (`AuthApiError`, `AuthRetryableFetchError`).
- Context read: `src/lib/supabase.ts` (default client options: `flowType` implicit, `detectSessionInUrl` true), `src/App.tsx` (route at 277 is outside `PrivateRoute`; the two app-level auth listeners at 180 and 207 only set an `authed` flag), `src/main.tsx` (StrictMode on), `src/lib/errors.ts` (`humanizeError`), `src/pages/Login.tsx:59-60` (Forgot password call and its `redirectTo` literal).

## 2. Acceptance criteria (auth relevant rows of the builder spec)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | parseAuthLink reads query and fragment, never throws, no window access, no imports | PASS | `authLinkState.ts:36-68`, whole body in try/catch, `new URL(href)` on a relative or garbage href throws and returns `none`; file has no import line |
| 2 | Any of error, error_code, error_description in either place returns kind error; code lower-cased and trimmed, fallback chain error_code, error, unknown; description capped 200 | PASS | `authLinkState.ts:46-54` |
| 3 | Error wins over token | PASS | error branch returns at `:53` before token read at `:56` |
| 4 | Token only when token_hash and type both present, type whitelisted, hash matches `^[A-Za-z0-9_-]{16,256}$` | PASS | `authLinkState.ts:19-20, 56-62`; split across query and fragment works through `pick` (`:28-34`) |
| 5 | Error link goes to expired and strips the address bar even with a session present | PASS | initial stage `ResetPassword.tsx:51-53`; strip `:87-90`; `noSessionRef` stays false so `onAuthStateChange` cannot lift it (`:111-117`) |
| 6 | Token link goes to form with no network call on load, then strips | PASS | `:51-53`, `:87-90`; no supabase call on that branch |
| 7 | No-link case uses getSession, does not strip | PASS | `:91-109` |
| 8 | onAuthStateChange lifts only checking or the no-session expired state; unsubscribes on unmount | PASS | `:111-122`; `go()` clears `noSessionRef` on any non-expired stage (`:74`) |
| 9 | Validation before any network call | PASS | `:137-138` precede `verifyOtp` at `:147` |
| 10 | verifyOtp once (ref flag), transport failure stays on form, 4xx goes to expired | PASS with F1 | `:144-164`, `isTransportFailure` `:26-35`; see F1 for 429 |
| 11 | updateUser failure stays on form, retry does not re-verify | PASS with F2 | `:163`, `:166-176` |
| 12 | Demo mode skips network on save and send | PASS | `:141`, `:187` |
| 13 | resetPasswordForEmail with the module constant equal to Login.tsx literal; trimmed, lower-cased; button disabled while sending | PASS | `:10`, `:182`, `:192`, `:279`; Login.tsx:60 carries the same URL |
| 14 | Sent wording identical whether or not the address has an account | PASS | single branch `:287-301`, no server signal is read |
| 15 | Email rendered as text inside strong, never as HTML | PASS | `:293`; `rg` for `dangerouslySetInnerHTML` in the file: 0 hits |
| 16 | No token, hash, password or email to console, title, URL or storage | PASS | `rg "console\.|localStorage|sessionStorage"` in the file: 0 hits; title is a fixed literal (`:80`); token kept in React state only |
| 17 | Error description from the URL is never rendered | PASS | `rg description` in ResetPassword.tsx: 0 hits; only `link.code` is consumed, through `isExpiredLinkCode` (`:55`) |
| 18 | No em or en dash in either file | PASS | `rg` with a class of the em dash and en dash characters over both files exit 1 (no match); positive control (a printf of an em dash escape) piped to the same pattern returned 1 |

Not run here by instruction: `tsc --noEmit`, `npm run build`, the node test suite. Those rows belong to the orchestrator and are listed in section 7.

## 3. Ordering against auth-js (the question asked explicitly)

**Can the page strip the address bar before auth-js reads a SUCCESS fragment? No.** The page strips only when `parseAuthLink` returns `error` or `token` (`ResetPassword.tsx:87-90`). A success redirect in the implicit flow carries `access_token, expires_in, refresh_token, token_type, type` and no `token_hash` and no `error*` key, so it parses to `none` and the page never touches the URL; auth-js `_getSessionFromURL` clears the hash itself after `_getUser` succeeds (`GoTrueClient.js` "window.location.hash = ''"). A PKCE success (`?code=`) also parses to `none`. So the success path is byte for byte the path the old page relied on.

**And for the two cases the page does strip:** for an error URL, auth-js `_isImplicitGrantCallback` is true on any `error*` key and `_getSessionFromURL` throws `AuthImplicitGrantRedirectError` before any session handling. If the strip won the race, auth-js would instead see no callback and run `_recoverAndRefresh`, which yields the same outcome (no new session, the stored one kept). The race is also unlikely in practice: the client is created at module load in `supabase.ts` and starts `initialize()` in its constructor, while ResetPassword is a lazy route chunk (`App.tsx:17`) that mounts after a network fetch. For a token URL, auth-js does not treat `token_hash` as a callback at all (needs `access_token`, an `error*` key, or `code` plus a stored verifier), so stripping it changes nothing for auth-js.

**What auth-js does to an existing session when the URL carries an error:** it keeps it. `_initialize` returns `{ error }` with the comment "Don't remove existing session on URL login failure", and does not clear the fragment on that path. The page then sits on `expired` with `noSessionRef` false, so the `INITIAL_SESSION` event that `onAuthStateChange` emits with that stored session is ignored by the guard at `:114`. A failed invite therefore never falls through to the password form of another account in the same browser. This is the defect class the spec targeted and it is closed.

## 4. Paths walked

| Path | Outcome | Verdict |
|---|---|---|
| Error in URL, another account signed in on this browser | expired, URL stripped, INITIAL_SESSION ignored, form never shown | correct |
| No parameters, valid session | getSession resolves after `initializePromise`, form; updateUser acts on that signed in user | correct (see F7, pre-existing) |
| No parameters, no session | expired, generic wording; a later SIGNED_IN (for example a broadcast from another tab) lifts it to form | correct per spec (see F4) |
| Token link | form at once, no call; on save verifyOtp, which saves the session and notifies subscribers before returning; page listener sees stage form and does nothing | correct |
| Token link, verifyOtp ok, updateUser fails, retry | `verifiedRef` true, retry calls updateUser only on the session verifyOtp stored | correct (see F2 for the message) |
| Token link, transport failure on verifyOtp | `fetch.js` maps a thrown fetch to `AuthRetryableFetchError` status 0 and 500 to 530 to retryable; `isTransportFailure` true; inline error, token unspent | correct |
| Token link, 429 on verifyOtp | `AuthApiError` status 429, not transport, goes to "This link has expired" | F1 |
| verifyOtp returns no data | auth-js throws a plain Error, caught at `:149`, no status, treated as transport | correct, conservative |
| Double submit | `busy` guard plus `disabled`; React 18 flushes discrete events synchronously, so the second submit sees the re-rendered disabled state | correct |
| Unmount during await | every post-await path checks `mountedRef` first (`:94`, `:104`, `:152`, `:173`, `:197`) | correct |
| StrictMode double effect (dev) | mount, cleanup, mount: first subscription unsubscribed, second live; `mountedRef` reset to true at `:85`; strip runs twice harmlessly; `link` survives in state | correct (see F5, dev only) |
| Subscription leak | `sub.subscription.unsubscribe()` in cleanup `:121` removes the emitter id | no leak |
| Invite link opened in time (regression) | parses to `none`, auth-js saves session, getSession returns it, form, updateUser | unchanged from today |
| Forgot password from Login.tsx (regression) | recovery redirect is the same implicit success shape, same path; PASSWORD_RECOVERY fires after form is already shown | unchanged from today |

## 5. Security findings (ranked)

| id | severity | file:line | what breaks | how, and the fix |
|---|---|---|---|---|
| F1 | LOW | `ResetPassword.tsx:26-35`, `:155-159` | A rate-limited verify (HTTP 429) is treated as a refused token. The person is sent to "This link has expired" although the single-use token was never spent. | `fetch.js:84` raises `AuthApiError` with the response status; 429 is not in `NETWORK_ERROR_CODES` (`fetch.js:32-34`), so `isTransportFailure` returns false and the page calls `go('expired')`. Reachable when several people verify from one shared IP (an office NAT) inside the auth server's verify rate window. Recovery is still possible (request a new link), so no lockout. Fix: in `isTransportFailure` also return true for `status === 429`, so the person stays on the form with the inline retry message. |
| F2 | LOW | `ResetPassword.tsx:175`, `errors.ts` fallback | When the auth server refuses the password itself (a stricter project password policy, or the same password as before), the page shows "Could not update your password. Please try again." with no reason, so a retry with the same password fails the same way. Not a security defect; the token is already spent but the session is held, so the page still works once the person guesses a different password. | auth-js raises `AuthWeakPasswordError` (`fetch.js:72-76`) or `AuthApiError` 422; `humanizeError` matches neither and returns the fallback. Fix (bg-app, copy from bg-copy): map `name === 'AuthWeakPasswordError'` and the 422 same-password code to a plain sentence telling the person what to change. |
| F3 | INFO | `ResetPassword.tsx:144-164` | Login CSRF by a forwarded link: anyone can forward their own valid `?token_hash=...&type=recovery` link (once the templates change) and a recipient who saves a password is signed into the sender's account, never told which address it is. | Inherent to every emailed auth link, and equally true today for the implicit fragment link, so not introduced by this change. The recipient's password goes to an account they do not own and they could then type business data into it. A product decision, not a fix: whether the form, after verify, should show "Setting the password for <address>" before saving. Route to bg-strategy if wanted. |
| F4 | INFO | `ResetPassword.tsx:111-117` | In the no-session expired state, a sign-in in another tab of the same browser profile (any account) lifts this tab into the form for that account. | auth-js broadcasts session changes across tabs; the guard at `:114` accepts them while `noSessionRef` is true. Spec case e asks for exactly this, and it requires the same browser profile, so it is the same person. Recorded so nobody widens the guard to the error case. |
| F5 | INFO | `ResetPassword.tsx:128-131` | Dev only: under React StrictMode the focus effect runs twice on mount; the first run consumes `firstRenderRef`, the second focuses the heading on first render. Production renders once, so production behaves as specified. | Mention for anyone judging focus behaviour on the dev server. No fix needed. |
| F6 | INFO | `ResetPassword.tsx:39-45` | After the email templates move to `token_hash`, the hash still reaches the browser's own history store and Netlify access logs as a query parameter; `replaceState` cleans only the current history entry. The hash stays usable until it expires or is used. | Inherent to Supabase's documented scanner-safe template. Accepted residual; worth stating in the template change note that the link lifetime (`OtpExp`) bounds it. |
| F7 | INFO, PRE-EXISTING | `ResetPassword.tsx:91-97`, `:168` | Opening `/reset-password` with no parameters in a browser that already holds a session shows the form and changes that account's password without asking for the current one. | Same behaviour as the old page (`getSession` then `updateUser`). Only the signed in person can do it. Whether to require reauthentication is the project's "secure password change" setting, not page code. |
| F8 | INFO | `brandgeo-dashboard/tests/auth_link_state.test.js` | An untracked test file (152 lines, written 10:04:29Z, 13 seconds before `authLinkState.ts`) sits next to the change. The builder's write scope excluded tests, and the builder's report lists only the two source files. | Not part of the diff handed to this review and not reviewed here. The orchestrator should confirm who wrote it (most likely the orchestrator seat, as a test written ahead of the build) before it is committed with this change, so the scope record stays true. Not a block on the reviewed diff. |

**No open redirect.** Every navigation target is a literal: `navigate('/', { replace: true })` (`:227`), `Link to="/login"` (`:216`), `redirectTo: RESET_REDIRECT` (`:10`, `:192`). Nothing from the URL reaches a navigation, a `href`, the title or the DOM; `link.description` is parsed and never read.

**Hostile description string.** `?error_description=<script>...` yields `kind: 'error'`, the description is stored in state and never rendered. A crafted link can only choose between the two fixed expired headings (by sending `error_code=otp_expired` or not). It cannot place attacker text or an attacker address on the page; the only address ever rendered is the one the person typed (`:293`), as a React text child.

**Enumeration.** The page reads nothing from the `resetPasswordForEmail` answer except "error or not", and the sent wording is conditional ("If <address> has a BrandGEO account"). The one distinguishing signal is an error answer: a send rate limit could come back for an existing account and not for an unknown one. That would be server behaviour, reachable identically through Login.tsx "Forgot password?" and directly through the public API with the anon key, so the page adds nothing; the fallback copy on that branch names no account. I did not reproduce the server side (the Go source is not in this repo), so this is listed under section 7, not as a finding.

## 6. Regression surface (by grep)

- `rg "reset-password|ResetPassword"` in `src`: `App.tsx:17,277` (route), `Login.tsx:60` (Forgot password redirect), `Onboard.tsx:393`, `Signup.tsx:171`, `signupDomain.ts:15` (comments that describe the flow). None imports from the page; nothing else imports `authLinkState.ts`.
- Server side that feeds the page: `netlify/functions/onboard-client.js` (invite `redirectTo`). Not changed.
- Other `onAuthStateChange` subscribers that fire during `verifyOtp` on this page: `App.tsx:180` and `:207` (set a flag only, routes are not mounted on `/reset-password`), `clientContext.tsx:249`, `resultsContext.tsx:70`. They now fire at save time rather than at load time for a token link. Worth a manual look at `clientContext.tsx:249` once the templates change: it reacts to SIGNED_IN while the person is still on the form, before the password is saved.

## 7. What was not checked

- `tsc --noEmit`, `npm run build`, `node tests/auth_link_state.test.js`: not run by instruction. The orchestrator owns these rows.
- Any browser, including iPhone Safari, the real redirect from Supabase Auth, focus and screen reader output, and the 16 px input rule. Accessibility and copy are other lenses.
- The token_hash path end to end: dormant until the email templates are changed in the Supabase Dashboard. `verifyOtp` with `type: 'invite'` was read in auth-js, not exercised.
- Server behaviour of `/recover` and `/verify` (send rate limit per address, verify rate limit per IP, whether recovery confirms an unconfirmed invitee). Taken from the brief, not read here; the Go source is not in this repo.
- Whether `https://app.getbrandgeo.com/reset-password` is on the project's redirect allow list. Unchanged literal, already used by Login.tsx.
- The untracked test file in F8.
- `git diff -U0` keyword scan: 54 matching lines, all the words "password" and "token" in identifiers, labels and comments; I read each file in full and no key, secret or credential value is present.

## Amendment 2026-11-11, written from the orchestrator seat, not by the reviewer

After this review returned, the orchestrator changed `ResetPassword.tsx` itself and re-ran the checks. No second `bg-verify` run was made on these edits.

- F1, closed: `isTransportFailure` also returns true for status 429, and a 429 from `verifyOtp` shows "Too many attempts. Please wait a minute and try again." on the form. The token is not spent and the person is not sent to the expired screen.
- F2, closed: a password the auth server refuses (`AuthWeakPasswordError`, or code `weak_password` or `same_password`) shows the server's own sentence, capped at 300 characters and rendered as text, instead of the generic fallback.
- F5, closed: the heading focus effect compares the stage it last focused for (`focusedStageRef`) instead of spending a first-render flag, so React StrictMode on the dev server no longer focuses the heading on load. Measured on the dev server: `document.activeElement` is BODY after load on the expired screen.
- F8, answered: `tests/auth_link_state.test.js` was written by the orchestrator while the builder ran, not by the builder. 18 checks, all pass against the builder's parser unchanged.
- F3, F4, F6, F7: unchanged, recorded.

Checks on the final state, run by the orchestrator: `tsc --noEmit` exit 0, `node tests/auth_link_state.test.js` 18 of 18, `npm run build` exit 0 (entry chunk 580.13 kB, the same as before this change; lazy chunk ResetPassword 10.08 kB), 51 of 53 node test files pass. The two that fail are `affiliate_flow` and `affiliate_stripe`: they mix a fixed test clock of 2026-09-12 10:00 UTC with the real clock, and a 60 day attribution window in the fixture ran out at 2026-11-11 10:00 UTC. They passed at 08:20 UTC the same day and no affiliate file changed. Node itself was unstable on this machine during the run (segmentation faults in about half of the heavy processes, the same command passing on a retry), so every figure above is from a run that exited 0.

Measured in headless Chrome over CDP, demo mode, 390 by 844 and 1440 by 900, 52 of 52 assertions: the exact redirect Supabase sends for an expired invite opens "This link has expired" with the address bar reduced to `/reset-password`; one labelled email field, 16 px and 46 px tall on the phone, a 44 px send button; an address typed with capitals and spaces is shown trimmed and lower case on "Check your inbox", focus on the heading; "try again" returns with the address kept; no parameters gives "We could not open this link"; a description carrying markup injects nothing; a token link opens the form with the address bar stripped, catches a mismatch and a short password before any network call, and reaches the done card through the demo shortcut; a token of the wrong shape is not treated as a token; no sideways scroll by a real scroll attempt; no console error from our code.

Not checked by anyone: the real Supabase redirect in a browser, a real iPhone or Android device, the token link against the real auth server (dormant until the email templates change), a screen reader, light mode.
