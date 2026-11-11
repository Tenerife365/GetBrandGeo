VERDICT: PASS WITH FINDINGS

# Invite link recovery, UX, accessibility and copy review (2026-11-11)

Reviewer: bg-verify, read-only. Lens: a cold lead on a phone who has never seen the product.
Subject: uncommitted change, `brandgeo-dashboard/src/pages/ResetPassword.tsx` (rewritten, 320 lines, +277 / -44) and new `brandgeo-dashboard/src/lib/authLinkState.ts` (72 lines).
Nothing was edited. No npm, tsc, vite, dev server or browser was run. No account, email or production auth call was made.

## 1. Summary

The page is no longer a dead end. Every stage that cannot finish (expired link, refused token, no session) now offers one field and one button that sends a new link, and the new link lands back on this page and works for an invited person who never confirmed. Copy matches the spec strings verbatim, no em or en dash, no AI-sounding phrase, the email is rendered as text in a `<strong>`, labels, `role="alert"`, focus-on-stage-change, 16 px inputs and 44 px targets on phones are all present. No blocker and no major. The findings are about three branches where a sentence can be untrue, and one label that reads wrong to a person who has never had a password.

## 2. Acceptance criteria (UX lens rows of the spec)

| Criterion | Result | Evidence |
|---|---|---|
| Stages checking, form, expired, sent, done exist | PASS | `ResetPassword.tsx:18`, render branches `:221` to `:302` |
| Error link goes to expired, no spinner first, address bar stripped | PASS | initial stage `:51-53`, strip `:87-90` |
| Token link goes to form with no network call on load | PASS | `:52`, `:87-90`; verifyOtp only in `handleSave` `:144-147` |
| Validation before any network call | PASS | `:137-138` before `:144` |
| Done card kept exactly | PASS | `:221-229` matches removed lines of the diff, plus `max-md:min-h-[44px]` and `aria-hidden` |
| document.title set and restored | PASS | `:79-82`, same pattern as `Login.tsx:40-41` |
| Copy strings verbatim (form, checking, both expired variants, sent, buttons, placeholders, labels) | PASS | `:233-235`, `:242-256`, `:265-281`, `:291-297`, compared word by word with the spec |
| Email rendered as text in `<strong>`, no dangerouslySetInnerHTML | PASS | `:293`; the file contains no `dangerouslySetInnerHTML` |
| Every input has id and label htmlFor | PASS | `:246-247`, `:250-251`, `:275-276` |
| Password inputs autoComplete new-password; email input type, inputMode, autoComplete, autoCapitalize, spellCheck | PASS | `:247`, `:251`, `:276` |
| Inputs `max-md:text-base`, buttons `max-md:min-h-[44px]` | PASS | `ic` `:203`, `primaryBtn` `:204`, `textLink` `:206`, done button `:227` |
| Error block `role="alert"`, icon hidden, meaning carried by text | PASS | `:208-212` |
| Focus moves to new h1 on stage change, not on first render | PASS | `:127-131`; every h1 has `ref`, `tabIndex={-1}`, `outline-none` |
| Send button disabled while sending | PASS | `:279`, plus `if (busy) return` `:181` |
| "try again" returns to expired with the address kept | PASS | `:297` calls `go('expired')`, `email` state untouched |
| "Back to sign in" is a react-router Link to /login | PASS | `:214-218` |
| No import from motion, no restyle of the shell | PASS | rg for `motion` in both files: no match; shell classes identical to `Login.tsx:71-74` and footer `:140` |
| No em or en dash in added lines | PASS | section 5 |

## 3. Findings

| id | severity | file:line | what the person experiences | fix |
|---|---|---|---|---|
| U1 | LOW | `ResetPassword.tsx:214-218` | An invited lead who has never had a password sees "Back to sign in". "Back" suggests they came from there, and on /login they meet an email and password form they cannot use. They are not stuck (Login has "Forgot password?", which sends the same email), but it is one detour for exactly the person this page was rebuilt for. | Label it "Already have a password? Sign in", or show it only for `expiredReason === 'generic'`. Copy call for bg-copy. |
| U2 | LOW | `ResetPassword.tsx:26-35`, `:155-160` | A 429 from `verifyOtp` (the auth server rate limits token verification) is a 4xx, so the page says "This link has expired. The links in our emails work once..." while the token is in fact unspent. The sentence is false in that branch and the typed password is discarded. Rare (needs many attempts from one IP), and it follows the spec rule "4xx means expired" to the letter, so this goes to the spec author, not the builder. | Treat 429 like a transport failure: stay on the form with "Too many attempts. Please wait a minute and try again." |
| U3 | LOW, conditional | `ResetPassword.tsx:166-175`, `errors.ts:38-77` | If the Supabase project enforces a password rule beyond 8 characters (character classes, leaked password check), `updateUser` answers 422 with a sentence naming the rule; `humanizeError` swallows it into "Could not update your password. Please try again." The person retries the same password and gets the same line, a closed loop. Whether such a rule is on could not be checked (Dashboard setting). Behaviour unchanged from before this change. | Pass 422 `weak_password` messages through (wrap with `serverError`), or state the real rule in the form text. |
| U4 | LOW | `ResetPassword.tsx:293` | The new link comes in Supabase's recovery email. If that template still carries the default subject about resetting a password, a lead who never set one is told "a new link is on its way" and then receives a "reset your password" email, which reads like the wrong email and may be ignored. The template text could not be read from here. | Read the Recovery template in the Supabase Dashboard; either word it as "Set your BrandGEO password" or name the subject on this page. Owner's click. |
| U5 | LOW, PRE-EXISTING | `ResetPassword.tsx:226` | "Next, tell us what to track." For a lead invited through the admin Onboard wizard, prompts are already seeded (`onboard-client.js:186`), so Continue leads to an Overview that is already set up; the sentence promises a step that does not come. Kept exactly by the spec, so not a fault of this change. | bg-copy: "Your dashboard is ready." or branch the line. |
| U6 | LOW, PRE-EXISTING | `ResetPassword.tsx:203` (same classes as Login) | Input boundary `border-dark-600` against the card measures 1.50:1 dark and 1.55:1 light, under the 3:1 of WCAG 1.4.11 for a component boundary. The field fill (`bg-dark-700`) helps a little but is also low. Same in Login, not introduced here. | bg-design token call for the field edge. |
| U7 | INFO | `ResetPassword.tsx:206`, `:296-297` | "try again" is an inline-flex button with a 44 px minimum height inside a 12 px sentence, so on a phone that line grows to 44 px tall and the sentence looks split. Target size is good; appearance only. | Put "try again" on its own line on phones, or drop the min height for the inline case (2.5.8 exempts inline targets). |
| U8 | INFO | `ResetPassword.tsx:208-212`, inputs `:247`, `:251` | The error text is announced and visible, but not tied to the fields (`aria-describedby`, `aria-invalid`). WCAG 3.3.1 is met by the text; association would help a screen reader user who tabs back to the field. | Optional. |
| U9 | INFO | `ResetPassword.tsx:87-109` | Builder deviation 4: in demo mode, opening the page with no link lands on "We could not open this link". Demo only. | None needed, or a demo shortcut to 'form'. |
| U10 | INFO | `ResetPassword.tsx:266-271` | Someone who opens /reset-password from a bookmark with no link at all reads "We could not open this link. It may have been used already, or opened in a different browser." Slightly off (there was no link) but harmless, and the next step is right. | None. |
| U11 | INFO, out of scope | `Login.tsx` forgot form | Login's own fields have no `htmlFor` and are 14 px on a phone, so iOS zooms there. If U1 sends invited leads to Login, they meet that. | Separate packet for Login. |

No finding blocks. Nothing here is a security finding (this lens did not look for one).

## 4. Walkthrough by stage, as the lead on an iPhone

- Expired invite (the measured case): the page opens straight on "This link has expired", one sentence that says why and what to do, an email field that brings up the email keyboard without capitalisation, one button. Nothing is focused on load, so VoiceOver starts at the top as usual. Sending moves focus to "Check your inbox", which is announced. One reading is enough.
- Sent: the sentence is honest in both cases (address with or without an account), "It can take a minute or two" is hedged, "Please use the newest email we sent you" is advice, not a claim about older links, and the spam line plus "try again" covers the silent case. Not a dead end.
- New link opened: implicit recovery link gives a session, the page goes checking then form, focus moves to "Set your password". iOS offers a strong password because of `autoComplete="new-password"`. A typo is caught before any network call. Done card, Continue.
- Token link (dormant until the templates change): form at once, verify only on Save, so a mail scanner cannot spend it. A refused token leads to the expired stage with the right wording; a network failure keeps the form and the token.

Copy truth checked per branch: "work once and for a limited time" is true for both expiry and reuse (Supabase reports both as otp_expired). "It may have been used already, or opened in a different browser" is phrased as a possibility and fits the generic branch (no session, PKCE flow state missing in another browser). Only U2 and U4 are branches where a sentence can mislead. No AI-sounding phrases ("seamless", "unlock", "journey" and the like are absent). No exclamation marks.

## 5. Dash scan, exact commands and output

Run from `brandgeo-dashboard/`:

```
rg -n "[<U+2014><U+2013>]" src/pages/ResetPassword.tsx src/lib/authLinkState.ts        -> no output, exit 1
git diff -- src/pages/ResetPassword.tsx | rg -n "^\+.*[<U+2014><U+2013>]"              -> no output, exit 1
printf 'a \xe2\x80\x94 b\nc \xe2\x80\x93 d\n' | rg -n "[<U+2014><U+2013>]"            -> 1:a <U+2014> b / 2:c <U+2013> d, exit 0 (positive control fires on both characters)
rg -c "[<U+2014><U+2013>]" src/index.css                                               -> 16 (second control on a real file)
```

The new file is untracked, so the first command (whole file) covers it.

## 6. Contrast, computed (WCAG 2.x relative luminance)

Resolved through `tailwind.config.js` (textColor bridge to `--br-text-*`, `dark.*` to `--dark-*`, `accent.strong`, `on-accent`) and the values in `src/index.css` `:root` (dark) and `html.light`. Script kept in the scratchpad, positive control white on black = 21.00.

| pair | dark | light |
|---|---|---|
| h1 `text-white` on card `bg-dark-800` | 18.85 | 17.85 |
| body and labels `text-slate-400` on card | 7.35 | 7.58 |
| links `text-brand-400` on card | 6.93 | 7.10 |
| error `text-red-400` on `bg-red-500/10` over card | 6.26 | 5.91 |
| button `text-on-accent` on `bg-accent-strong` | 5.70 | 7.10 |
| same on hover | 7.10 | 8.98 |
| input text on `bg-dark-700` | 16.57 | 15.19 |
| placeholder `--ink-3` on `bg-dark-700` | 4.97 | 5.13 |
| footer `text-slate-600` on page `bg-dark-900` | 7.68 | 7.10 |
| footer links `text-slate-500` on page | 7.68 | 5.64 |
| focus ring `--accent-ink` against card (1.4.11) | 6.93 | 7.10 |
| input border `border-dark-600` against card (1.4.11) | 1.50 | 1.55 (U6) |
| CheckCircle `text-emerald-400` on card (decorative, aria-hidden) | 9.81 | 5.48 |

All text pairs pass 4.5:1 in both themes. Not computed: the red border of the error block (decorative, the text and icon carry it), the disabled button at 60 percent opacity (exempt as inactive), the logo (separate component, unchanged).

## 7. Keyboard, focus, structure, layout

- Tab order per stage is linear: logo link, fields, submit, then "Back to sign in" or "try again", then footer links. "try again" is a real `<button type="button">`, Enter and Space work.
- Focus: `firstRenderRef` skips the first run, so an error link opened cold does not steal focus. Later stage changes (checking to form, form to done, expired to sent, sent to expired) focus the new h1. The global `:focus-visible` rule in `index.css:427` sits after the utilities, so after a keyboard submit the heading may show the violet ring despite `outline-none`; that is acceptable and arguably useful.
- One h1 per stage, no skipped levels.
- 390 px wide: `px-4` plus `max-w-sm` gives a 358 px card, 24 px padding (`--card-pad-feature`), 310 px of content. The address in the sent sentence carries `break-all`, so a long address wraps instead of overflowing. Buttons are `w-full`. Nothing has a fixed width, so no sideways scroll by reading.
- Phone inputs 16 px below 768 px (`max-md:text-base`). A tablet at 768 px or wider gets 14 px; iPadOS Safari in desktop mode does not zoom in practice, not measured.

## 8. Consistency

Shell identical to `Login.tsx:71-74` and footer `Login.tsx:140`. Same `BrandGeoMark` wrapper. Error block classes identical to the old page. `RESET_REDIRECT` is the same literal Login uses. No import from motion. This page is now ahead of Login on labels and phone sizing (U11).

## 9. What was not checked

- Compilation, the test suite and the build (orchestrator runs them). No claim is made that the file compiles.
- Any real rendering: no browser, no headless Chrome, no iPhone, no Android, no VoiceOver or TalkBack output. Every layout and focus statement above is from reading classes and code.
- The Supabase Dashboard: email template subjects and bodies (U4), password policy (U3), OTP expiry length, rate limits (U2).
- The live end to end path: an actual expired invite, an actual recovery email, an actual session landing.
- Light mode was computed from tokens, not seen.
- Security, data integrity and regression lenses are other reviewers' lanes.

## Amendment 2026-11-11, written from the orchestrator seat, not by the reviewer

The literal dash characters in the scan commands above were replaced by their code points so this report carries no dash; nothing else in the reviewer's text was changed. After this review returned, the orchestrator changed `ResetPassword.tsx` itself. No second `bg-verify` run was made on these edits.

- U1, closed: the line under the form and under the sent card now reads "Already have a password? Sign in", with only "Sign in" as the link to /login.
- U2, closed: a 429 from `verifyOtp` keeps the person on the form with "Too many attempts. Please wait a minute and try again."
- U3, closed: a password refused by the auth server shows the server's sentence, which names what to change.
- U7, closed: "try again" is a plain inline text button without the 44 px minimum height, followed by a full stop; the sentence no longer splits on a phone.
- U4, open, the owner's check: the new link arrives in the Recovery email template. Its subject and text were not read from here.
- U5, U6, U8, U9, U10, U11: unchanged, recorded. U5 ("Next, tell us what to track." on the done card) is a copy call for an account whose prompts are already seeded.

The checks and browser measurements on the final state are listed in the amendment of `invite-link-recovery-review-auth-2026-11-11.md`.
