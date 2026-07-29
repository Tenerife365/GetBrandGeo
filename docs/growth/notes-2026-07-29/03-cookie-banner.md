# 03. Cookie banner: smaller and quieter, without weakening the consent gate

Request, verbatim: "cookies banner needs to be smaller and more discreet".

Measured element: `html > body > div.bg-cc`, **680 x 172 fixed**, top 723, viewport
1905 x 911. That is **18.9% of the viewport height** for a consent notice.

Verdict up front: the size complaint is valid and I can take about 30% off the
height. I am **refusing one part of "discreet"** and I am **adding one change
nobody asked for**, both explained in section 7. Everything else applies as a
literal find and replace.

---

## 1. Where this element actually lives

The banner is not in `index.html`. It has no markup in any HTML file. It is
built, styled and injected entirely by one external script.

**File: `brandgeo/web/ga4-init.js`** (245 lines, LF endings, ASCII, 10,647 bytes).

| What | Lines |
| --- | --- |
| Consent Mode defaults, all denied | 85 to 93 |
| `loadGa()`, the only place a Google script element is created | 96 to 110 |
| **`var CSS`, the entire stylesheet for the banner** | **112 to 130** |
| `showBanner()`, builds the DOM | 140 to 185 |
| `reopen()` and the footer "Cookie settings" link | 191 to 228 |
| `start()`, decides show or load or stay silent | 230 to 237 |

`grep -r "bg-cc"` across the whole repo returns exactly two files:
`brandgeo/web/ga4-init.js` and `docs/growth/local-preview/notes.json`. **No page
stylesheet touches `.bg-cc`.** There is one place to edit and no cascade to fight.

### 1.1 Current markup, as constructed

`showBanner()` at lines 140 to 185 produces this tree. Order matters and is
deliberate.

```
div.bg-cc            role="dialog" aria-modal="false" aria-label="Cookie choices"
  h2                 "Cookies"
  p                  notice text + <a href="/cookies.html">Read the cookie policy</a>
  div.bg-cc-row
    button.bg-cc-reject   "Reject"     <- first in DOM, receives focus at line 184
    button.bg-cc-accept   "Accept"
```

Notice text, 194 characters including the link label:

> We use Google Analytics to see which pages are useful. It sets cookies, so we
> only load it if you agree. Our privacy-friendly analytics runs either way and
> sets no cookies. Read the cookie policy.

### 1.2 Current CSS, lines 112 to 130 verbatim

```js
  var CSS =
    '.bg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
    'max-width:680px;margin:0 auto;background:var(--s,#101116);color:var(--t,#e8e9ed);' +
    'border:1px solid var(--bd,#23242b);border-radius:14px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.45);font-size:.9rem;line-height:1.6;}' +
    '.bg-cc h2{font-size:.95rem;font-weight:700;margin:0 0 6px;color:var(--t,#e8e9ed);}' +
    '.bg-cc p{margin:0 0 14px;color:var(--t2,#9ba1ac);font-size:.85rem;}' +
    '.bg-cc a{color:var(--ac-text,#a78bfa);text-decoration:underline;}' +
    '.bg-cc-row{display:flex;gap:10px;flex-wrap:wrap;}' +
    // Reject is the same size, weight and padding as Accept. Making refusal
    // harder than acceptance is the dark pattern the AEPD and CNIL enforce most
    // often, so the two differ only in fill.
    '.bg-cc button{flex:1 1 160px;padding:11px 18px;border-radius:9px;font:inherit;' +
    'font-weight:600;font-size:.86rem;cursor:pointer;border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    '.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--bd2,#32333c);}' +
    '.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc-reject:hover{border-color:var(--t2,#9ba1ac);}' +
    '@media(max-width:520px){.bg-cc{left:10px;right:10px;bottom:10px;padding:16px;}}';
```

### 1.3 Where the 172px goes, reconciled against the measurement

Root font size 16px. `line-height:1.6` is inherited by every child.

| Band | Arithmetic | px |
| --- | --- | --- |
| border top + bottom | 1 + 1 | 2.00 |
| padding top + bottom | 18 + 18 | 36.00 |
| `h2` line box | 0.95rem = 15.2 x 1.6 | 24.32 |
| `h2` margin-bottom | | 6.00 |
| `p`, **two** lines | 0.85rem = 13.6 x 1.6 x 2 | 43.52 |
| `p` margin-bottom | | 14.00 |
| button row | 13.76 x 1.6 + 22 padding + 2 border | 46.02 |
| **total** | | **171.86** |

Rendered 172. The model reproduces the measurement to under a pixel, including
the top coordinate: 911 - 16 bottom offset - 172 = **723**, which is what was
measured. Everything predicted below rests on this model, not on a guess.

**The 194 characters wrap to exactly two lines at 638px of content box**
(680 - 40 padding - 2 border). Two lines of 638 is 1,276px of advance for a
string that measures about 1,271px, so it fits with roughly 5px to spare. This
is the single most important fact in the whole note, see section 4.

---

## 2. Compliance findings, stated plainly

### 2.1 Does it offer a reject control as prominent as accept?

**Structurally yes. Visually, not quite, and that is a real defect.**

What is already right, and I preserve all of it:

- Identical `flex` basis, identical `padding:11px 18px`, identical
  `border-radius`, identical `font-weight:600`, identical `font-size:.86rem`.
  Line 124 to 125 applies to `.bg-cc button`, so neither button can drift.
- **Reject is first in the DOM** (line 175 before line 176) and **Reject takes
  focus when the banner opens** (line 184, `reject.focus()`). Refusing is
  reachable in one Return key press. Accepting needs a Tab first. Refusal is
  currently *easier* than acceptance, which is the right side of the line.
- Nothing is pre-selected. There is no third "manage preferences" detour. There
  is no X, no auto-dismiss, no scroll-to-consent.

What is wrong: Accept is a **solid violet fill** and Reject is an **outline**,
so Reject's only visual boundary is its 1px border, currently `--bd2`.

| Reject border | vs card surface | ratio | WCAG 1.4.11 needs 3:1 |
| --- | --- | --- | --- |
| dark, `#32333c` on `#101116` | | **1.50:1** | fail |
| light, `#cfcfda` on `#ffffff` | | **2.47:1** | fail |

So the control the regulator cares most about has a boundary you can barely see,
while Accept is a 5.70:1 block of colour. `cookies.html` line 227 states the two
have "equal prominence". They have equal geometry. They do not have equal
salience. This is pre-existing, it is not caused by shrinking, and shrinking the
card would make it worse. **Fixed in the patch. See section 7.1.**

### 2.2 Does it block GA4, or only record a preference?

**It genuinely blocks it.** Verified from source, three ways.

1. The only `<script>` pointing at `googletagmanager.com` is created at runtime
   inside `loadGa()`, lines 99 to 102. There is no such tag in any HTML file:
   `grep -l "googletagmanager.com/gtag" *.html` returns **nothing** across all 79
   pages.
2. `loadGa()` has exactly two callers. Line 232, `start()`, which requires a
   stored choice whose `analytics` is true. Line 180, the Accept click handler.
   There is no other path.
3. Consent Mode defaults are queued at lines 85 to 93 before anything else, with
   `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` all
   `denied`. Accepting updates **only** `analytics_storage` (line 108). The
   advertising signals stay denied even for a visitor who accepts, so
   `ga-audiences` never fires. That matches what the policy claims.

Stored answer expires after `365 * 24 * 60 * 60 * 1000` ms (line 56), which is
the 12 months the policy promises. `VERSION = 1` (line 51) invalidates a stored
answer if the categories change.

**This is a real Article 5(3) ePrivacy gate, not a cosmetic preference toggle.
Nothing in this patch goes anywhere near it.**

### 2.3 What does `cookies.html` promise?

The claims that constrain any visual change:

| Where | Promise |
| --- | --- |
| line 227 | "Accept and Reject are presented with **equal prominence, identical size and weight**; declining is never made harder than accepting; nothing is pre-selected; and continuing to browse is **not** treated as consent." |
| line 170 | "Google Analytics is not loaded until you accept it... enforced by **blocking the script itself**, not merely by signalling a preference to Google." |
| line 228 | "You may withdraw or change your consent at any time, and it is **as easy to withdraw as it was to give**." |
| line 143 | `bg-consent` retention "12 months, then we ask again". |
| line 231 | "We ask again at least every 12 months." |
| line 229 | The "**Cookie settings** link in the footer of **any page** on getbrandgeo.com". |

Line 227 is the binding one. "Identical size and weight" means I may shrink both
buttons, but only by the same amount, and I may not change the weight of either.
The patch shrinks nothing about the buttons: they stay at 44px or above and both
carry the same `min-width` and `min-height`.

### 2.4 Two pre-existing findings I am not fixing here, recorded so they are not lost

**F1. The footer "Cookie settings" link is missing on three pages.**
`addFooterLink()` line 212 selects `footer a[href$="/cookies.html"]`. Three pages
have no such link in their footer, so the injection silently does nothing on
them: **`privacy.html`, `thanks.html`, `welcome.html`**. `cookies.html` itself is
covered by the `[data-cookie-settings]` button at its line 230. The policy at
line 229 says "any page". It is 76 of 79. Out of scope for this item, and it is
an HTML fix on three files, not a banner fix.

**F2. The banner ignores the light theme on 25 of 79 pages.** Detail and a
proposed follow-up patch in section 8.

---

## 3. Blast radius

**78 of 79 pages, checked, not assumed.**

```
grep -o 'src="ga4-init\.js[^"]*"' *.html | sort | uniq -c
     78 "ga4-init.js?v=20260729b"
```

Every one of the 78 uses the identical version-pinned query string. The only page
that does not load it is **`article-builder.html`**, which is an internal tool
deliberately excluded from the cPanel upload.

Consequences for whoever applies this:

1. **One file changes. 78 pages change behaviour.** There is no per-page opt out.
2. **`?v=20260729b` must be bumped**, on all 78 pages, or returning visitors keep
   the cached old CSS. Commit `59f3a19` exists precisely because this was learned
   the hard way. Suggested new value: `?v=20260729c`.
3. `deploy.php` copies changed files only, and `ga4-init.js` plus 78 HTML files is
   79 files in one push. That is over the 20-commit webhook payload cap noted in
   `docs/qa/deploy-pipeline-cpanel.md` F5 only if it is spread over 20+ commits.
   As **one** commit touching 79 files it is fine, the cap is on `commits[]`, not
   on files. Push it as a single commit.

Bump command, for the record, run from `brandgeo/web`:

```bash
grep -rl 'ga4-init\.js?v=20260729b' *.html | xargs sed -i 's/ga4-init\.js?v=20260729b/ga4-init.js?v=20260729c/g'
```

---

## 4. The counterintuitive constraint: do not narrow the card

The obvious way to make a 680px banner smaller is to make it narrower. **On this
banner that makes it taller.**

The notice text is 194 characters, about 1,271px of advance at 13.6px Inter. It
occupies two lines at the current 638px content box, with roughly 5px of slack.
Any reduction in width crosses into three lines.

| max-width | content box | lines | height at the new metrics |
| --- | --- | --- | --- |
| 680 (keep) | 646 | **2** | **121px** |
| 640 | 606 | 3 | 142px |
| 600 | 566 | 3 | 142px |
| 560 | 526 | 3 | 142px |

680 x 121 is 82,579 px². 600 x 142 is 85,200 px². The narrower card is bigger by
both measures. **Width stays at 680.** The saving comes from removing chrome.

The new content box is 646px rather than 638px because horizontal padding drops
from 20 to 16, so the two-line wrap gets *more* slack, not less. This direction
is monotonic and cannot regress.

---

## 5. The patch

One hunk. Replaces `ga4-init.js` lines 112 to 130 in full. Indentation is two
spaces on `var CSS =` and four spaces on every continuation line, matching the
file. Line endings are LF. No em dashes, no en dashes.

### FIND, exactly

```js
  var CSS =
    '.bg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
    'max-width:680px;margin:0 auto;background:var(--s,#101116);color:var(--t,#e8e9ed);' +
    'border:1px solid var(--bd,#23242b);border-radius:14px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.45);font-size:.9rem;line-height:1.6;}' +
    '.bg-cc h2{font-size:.95rem;font-weight:700;margin:0 0 6px;color:var(--t,#e8e9ed);}' +
    '.bg-cc p{margin:0 0 14px;color:var(--t2,#9ba1ac);font-size:.85rem;}' +
    '.bg-cc a{color:var(--ac-text,#a78bfa);text-decoration:underline;}' +
    '.bg-cc-row{display:flex;gap:10px;flex-wrap:wrap;}' +
    // Reject is the same size, weight and padding as Accept. Making refusal
    // harder than acceptance is the dark pattern the AEPD and CNIL enforce most
    // often, so the two differ only in fill.
    '.bg-cc button{flex:1 1 160px;padding:11px 18px;border-radius:9px;font:inherit;' +
    'font-weight:600;font-size:.86rem;cursor:pointer;border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    '.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--bd2,#32333c);}' +
    '.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc-reject:hover{border-color:var(--t2,#9ba1ac);}' +
    '@media(max-width:520px){.bg-cc{left:10px;right:10px;bottom:10px;padding:16px;}}';
```

### REPLACE WITH, exactly

```js
  var CSS =
    // 2026-07-29 size pass. The notice measured 680x172 at 1905x911, about 19%
    // of the viewport height. It is about 121px now, a 29% cut. Every pixel
    // removed is chrome. Nothing about the choice itself moved, and the Reject
    // boundary got STRONGER, see the note above the button rules.
    //
    // WIDTH IS DELIBERATELY UNCHANGED. The notice is 194 characters, roughly
    // 1271px of advance at 13.6px, and it wraps to two lines at 638px of content
    // box with about 5px to spare. Narrowing the card pushes it to three lines,
    // so a 600px card is TALLER and larger in area than this one. Measured
    // against the live element, not estimated.
    //
    // box-sizing is pinned because min-width and min-height below have to mean
    // the same thing on all 78 pages. Most reset it to border-box, some do not,
    // and a touch target that is 44px on one page and 66px on another is not a
    // guarantee.
    '.bg-cc,.bg-cc *{box-sizing:border-box;}' +
    '.bg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;' +
    'max-width:680px;margin:0 auto;background:var(--s,#101116);color:var(--t,#e8e9ed);' +
    'border:1px solid var(--bd,#23242b);border-radius:12px;padding:12px 16px;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.32);font-size:.9rem;line-height:1.5;}' +
    // The heading read "Cookies" and nothing else, which the first sentence of
    // the notice already says with more information in it. It is hidden from
    // sight and kept in the accessibility tree, so the dialog still exposes a
    // heading to a screen reader and nothing a visitor needs in order to decide
    // has been taken away. 30px of the 51px saved is this.
    '.bg-cc h2{position:absolute;width:1px;height:1px;margin:-1px;padding:0;' +
    'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}' +
    '.bg-cc p{margin:0 0 10px;color:var(--t2,#9ba1ac);font-size:.85rem;}' +
    '.bg-cc a{color:var(--ac-text,#a78bfa);text-decoration:underline;}' +
    '.bg-cc-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;}' +
    // Reject is the same size, weight and padding as Accept. Making refusal
    // harder than acceptance is the dark pattern the AEPD and CNIL enforce most
    // often, so the two differ only in fill. min-width and min-height are set
    // on .bg-cc button, which both buttons share, so neither can be shrunk
    // without the other and neither can fall under the 44px touch floor. The
    // buttons no longer stretch to fill the row: they are content sized and
    // right aligned, which is most of the "discreet" in this change.
    '.bg-cc button{flex:0 1 auto;min-width:124px;min-height:44px;padding:11px 18px;' +
    'border-radius:9px;font:inherit;font-weight:600;font-size:.86rem;cursor:pointer;' +
    'border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    // Accept is a solid fill, Reject is an outline, so this border is the only
    // thing that makes Reject look like a control at all. It was --bd2, which
    // measures 1.50:1 against the card in dark and 2.47:1 in light, both under
    // the 3:1 that WCAG 1.4.11 asks of a control boundary. A card that is 29%
    // smaller cannot also have a Reject button you have to hunt for, so this
    // moved to --t3: 4.95:1 dark, 5.27:1 light. cookies.html section 6 claims
    // the two have equal prominence, and until now that was true of their
    // geometry but not of their visibility.
    '.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--t3,#7d838f);}' +
    '.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc-reject:hover{border-color:var(--t,#e8e9ed);}' +
    // Under 520px the buttons go back to filling the row. A thumb target that
    // spans half the width is easier to hit than a 124px one in the corner, and
    // on a phone there is no room for the notice to look loud anyway.
    '@media(max-width:520px){.bg-cc{left:10px;right:10px;bottom:10px;padding:12px 14px;}' +
    '.bg-cc-row{justify-content:flex-start;}.bg-cc button{flex:1 1 0;min-width:0;}}';
```

### What changed, line by line

| Property | Was | Now | Height saved |
| --- | --- | --- | --- |
| `box-sizing` on the subtree | page dependent | pinned `border-box` | 0, correctness |
| `.bg-cc` padding | `18px 20px` | `12px 16px` | 12.00 |
| `.bg-cc` line-height | 1.6 | 1.5 | 2.72 via `p` |
| `.bg-cc` border-radius | 14px | 12px | 0, quieter |
| `.bg-cc` box-shadow | `0 18px 50px rgba(0,0,0,.45)` | `0 8px 24px rgba(0,0,0,.32)` | 0, much quieter |
| `.bg-cc h2` | visible, 0.95rem | visually hidden, still in the a11y tree | 30.32 |
| `.bg-cc p` margin-bottom | 14px | 10px | 4.00 |
| `.bg-cc-row` | stretch | `justify-content:flex-end` | 0, buttons stop spanning 314px each |
| `.bg-cc button` flex | `1 1 160px` | `0 1 auto` + `min-width:124px` | 0 |
| `.bg-cc button` | no height floor | `min-height:44px` | 1.38 |
| `.bg-cc-reject` border | `--bd2` | `--t3` | 0, accessibility |
| media query padding | `16px` | `12px 14px` | 8.00 on mobile |

**Nothing else in `ga4-init.js` changes. `showBanner()` is untouched, so the DOM,
the reject-first order, the initial focus on Reject, the `role`, the
`aria-label`, both click handlers and every line of the gate itself are byte for
byte what shipped in `399723c` and `97d420a`.**

---

## 6. Predicted geometry

### 6.1 Desktop, 1905 x 911, the measured case

| | Now | After | Delta |
| --- | --- | --- | --- |
| width | 680 | 680 | 0 |
| height | 172 | **121** | **-30%** |
| top | 723 | **774** | 51px lower |
| share of viewport height | 18.9% | **13.3%** | -5.6 points |
| area | 116,960 px² | 82,579 px² | -29.4% |

Height derivation, same method as section 1.3:

| Band | Arithmetic | px |
| --- | --- | --- |
| borders | 1 + 1 | 2.00 |
| padding | 12 + 12 | 24.00 |
| `h2` | out of flow | 0.00 |
| `p`, two lines | 13.6 x 1.5 x 2 | 40.80 |
| `p` margin-bottom | | 10.00 |
| button row | max(13.76 x 1.5 + 22 + 2, 44) = 44.64 | 44.64 |
| **total** | | **121.44** |

Buttons: 124px wide each plus a 10px gap, right aligned, so the row is 258px of
the 646px content box instead of two 314px slabs filling it. That change alone
accounts for most of the "discreet".

### 6.2 375px wide, where a fixed banner does the most damage

The `max-width:520px` branch applies: offsets drop to 10px, padding to
`12px 14px`. Card width 355, content box 325. The notice takes **four** lines at
this width both before and after, so the saving is chrome only.

| | Now | After |
| --- | --- | --- |
| width | 355 | 355 |
| height | 211 | **162** |
| `p` lines | 4 | 4 |
| buttons | 155.5 x 46.0 each, one row | 157.5 x 44.6 each, one row |
| share of a 375 x 667 viewport | **31.7%** | **24.3%** |
| share of a 375 x 812 viewport | 26.0% | **20.0%** |

Height derivation: 2 border + 24 padding + (13.6 x 1.5 x 4 = 81.6) + 10 margin +
44.64 row = **162.24**.

On mobile the buttons revert to `flex:1 1 0`, so each is 157.5 x 44.6. Right
aligning 124px buttons on a phone would strand them in a corner and is worse for
thumb reach, which is why the media query overrides it.

### 6.3 Touch targets, verified against the 44 x 44 floor

`box-sizing:border-box` is pinned in the patch, so `min-height:44px` means 44px
of total box on every page, not 44px of content box plus padding on some pages.

| Viewport | Button width | Button height | 44 x 44 |
| --- | --- | --- | --- |
| 1905 | 124.0 | 44.64 | pass |
| 768 | 124.0 | 44.64 | pass |
| 520 | 145.0 | 44.64 | pass |
| 375 | 157.5 | 44.64 | pass |
| 320 | 130.0 | 44.64 | pass |

Height is `max(13.76 x 1.5 + 22 + 2, 44)` = `max(44.64, 44)` = 44.64. The
content-driven value already clears the floor, and `min-height` is a guard in
case anyone later touches the font size. Line-height is unitless so it scales
with font-size and does not depend on Inter having loaded.

Both buttons carry identical `min-width` and `min-height` from the shared
`.bg-cc button` rule. There is no selector anywhere that can size one without the
other, which is what keeps `cookies.html` line 227 true.

---

## 7. Computed contrast

Every ratio below is computed from the WCAG 2.x relative luminance formula, not
copied from a token comment. Both `:root` blocks are covered: the dark default
and the `[data-theme="light"]` override, which exist as a pair on 77 of 79 pages.

### 7.1 The one thing I changed the colour of: the Reject border

This is the change nobody asked for. Justification: the request is to make the
banner quieter, and the Reject control was already too quiet to satisfy WCAG
1.4.11 or the "equal prominence" sentence in the published policy. Shrinking the
card without this would have made a bad ratio worse in effect.

| | Value | Against | Ratio | 3:1 floor |
| --- | --- | --- | --- | --- |
| **was**, dark | `--bd2` `#32333c` | `--s` `#101116` | **1.50:1** | fail |
| **was**, light | `--bd2` `#cfcfda` | `--s` `#ffffff` | **2.47:1** | fail |
| **now**, dark | `--t3` `#7d838f` | `--s` `#101116` | **4.95:1** | pass |
| **now**, light | `--t3` `#6b6b75` | `--s` `#ffffff` | **5.27:1** | pass |

`--t3` is defined on exactly the same 54 pages as `--s`, `--t`, `--t2`, `--bd2`
and the accent tokens, so the token is present wherever the others are. On the
other 25 pages every one of these falls back to the hardcoded hex, and
`#7d838f` on `#101116` is 4.95:1 there too. There is no page where the fallback
lands somewhere unmeasured.

Hover changes from `--t2` to `--t`, so hover is still a visible step up from the
new resting state (15.54:1 dark, 19.86:1 light).

### 7.2 Text whose size or line-height I touched, confirmed still AA

I did not change any text colour and I did not reduce any font size. The notice
stays at 0.85rem = 13.6px and the buttons at 0.86rem = 13.76px. Only
`line-height` moved, 1.6 to 1.5, which cannot affect contrast. Recorded anyway
because this is consent text and the claim needs a number behind it.

| Element | Colour | On | Dark | Light |
| --- | --- | --- | --- | --- |
| Notice text | `--t2` `#9ba1ac` / `#55555e` | `--s` `#101116` / `#ffffff` | **7.26:1** | **7.38:1** |
| Policy link | `--ac-text` `#a78bfa` / `#6d28d9` | same | **6.93:1** | **7.10:1** |
| Reject label | `--t` `#e8e9ed` / `#09090f` | same | **15.54:1** | **19.86:1** |
| Accept label | `#ffffff` | `--ac-strong` `#7c3aed` / `#6d28d9` | **5.70:1** | **7.10:1** |

AA for normal text is 4.5:1. The lowest figure anywhere on the banner is Accept's
own label at 5.70:1. Nothing is close to the line.

Two notes on the numbers. The `--t2` figure is 7.26:1 and not the 7.58:1 written
in `index.html` line 203, because that comment measures against `--bg` `#0a0b0e`
while the banner sits on `--s` `#101116`. And the 5.70:1 for Accept matches the
5.7:1 already recorded for `--ac-strong` in `CLAUDE.md`, which is a useful
cross-check that the method here agrees with the one used in the July 28 colour
work.

---

## 8. Follow-up, deliberately NOT in this patch

**The banner ignores light mode on 25 of 79 pages.** The CSS reads `--s`, `--t`,
`--t2`, `--bd`, `--bd2`, `--ac-text` and `--ac-strong`. Exactly 54 pages define
those. The other 25 predate that naming and use `--surface`, `--text`, `--muted`,
`--border`, `--accent`, `--accent-text`, `--accent-strong`:

```
bg-001 .. bg-019, blog.html, glossary.html, cookies.html, privacy.html,
thanks.html, article-builder.html
```

On those 25 the banner falls through to its hardcoded dark hexes **in both
themes**, so a visitor reading `cookies.html` in light mode gets a dark banner on
a white page. Every ratio still passes, since the fallbacks are the dark set on a
dark surface. It is a theme mismatch, not a contrast failure.

The obvious fix is a `var()` chain, `var(--s,var(--surface,#101116))` and so on.
**I did not include it, and applying it naively would introduce a real AA
failure.** `cookies.html` and `privacy.html` define `--accent` but not
`--accent-text`, and `thanks.html` defines none of the six. So a chain that
switched the surface to white in light mode while the link colour still fell back
to `#a78bfa` would put the policy link at **2.72:1 on white**, a fail, on the
Cookie Policy page itself. The chain has to be
`var(--ac-text,var(--accent-text,var(--accent,#a78bfa)))` and every one of the 25
pages has to be checked for the token it actually has. That is its own task with
its own verification pass, not a rider on a size change.

Also open from section 2.4: the "Cookie settings" footer link is absent on
`privacy.html`, `thanks.html` and `welcome.html`, against a policy that says
"any page".

---

## 9. What I refused, and why

1. **I will not shrink, outline-only, grey out, reorder or otherwise reduce the
   Reject button relative to Accept.** Article 7(3) GDPR and the EDPB's deceptive
   design guidelines make unequal prominence the single most enforced consent
   defect, `cookies.html` line 227 publishes a promise of equal prominence, and a
   published promise the code contradicts is worse than no promise. Both buttons
   keep one shared size rule. I went the other way and raised the Reject border
   from 1.50:1 to 4.95:1.

2. **I will not reduce the notice text below 13.6px.** Consent must be informed
   and presented in an intelligible, easily accessible form. Two lines of 13.6px
   is already the compact end. Shrinking type is the version of "discreet" that
   attacks the informing, and it is the cheapest looking saving on the table,
   which is exactly why it is the wrong one. The saving came from padding, a
   redundant heading and a shadow instead.

3. **I will not delete or shorten the notice text or the policy link.** All three
   sentences do work: what the tool is, that it stores something, and that
   nothing loads without a yes. The link is the "easily accessible" half of
   informed consent.

4. **I will not make it dismissable by scrolling, by clicking outside, or with an
   X.** Continuing to browse is not consent, `cookies.html` line 227 says so, and
   an X that resolves to anything other than an explicit choice is ambiguous
   consent under Article 4(11).

5. **I will not add a "Manage preferences" step that turns Reject into two
   clicks.** One-click accept against two-click reject is the exact asymmetry the
   AEPD fines for.

6. **I will not auto-dismiss on a timer, and I will not let either control fall
   under 44 x 44.** A consent control that disappears on its own has recorded no
   choice, and the smallest button in the patch is 124 x 44.6.

7. **I did not remove the `h2` from the DOM, only from view.** Deleting it would
   have taken the dialog's heading out of the accessibility tree for the sake of
   30 pixels a sighted visitor gets back from the paragraph anyway. Visually
   hidden costs nothing and keeps the structure.

   If even that is too far, the conservative variant keeps the heading visible at
   a smaller size. Swap the `.bg-cc h2` rule in the patch for:

   ```js
    '.bg-cc h2{font-size:.85rem;font-weight:700;margin:0 0 4px;color:var(--t,#e8e9ed);}' +
   ```

   Resulting geometry: **680 x 146** desktop (16.0% of a 911 viewport instead of
   13.3%), **355 x 187** at 375 wide. Still a 15% cut rather than 30%. Everything
   else in the patch is unaffected.

---

## 10. Apply and verify

1. Apply the single hunk in section 5 to `brandgeo/web/ga4-init.js`.
2. Bump the cache buster on all 78 pages, `20260729b` to `20260729c`, command in
   section 3.
3. Push as **one** commit touching 79 files.
4. Verify, in this order:
   - `div.bg-cc` measures about **680 x 121** at 1905 x 911, top about **774**.
   - Clear `localStorage['bg-consent']` to make the banner reappear.
   - Reject still has focus the moment the banner opens.
   - Both buttons measure at least 44px tall and at least 124px wide at 1280, and
     at least 44 x 130 at 320.
   - The Reject outline is clearly visible in **both** themes. This is the point
     of the change and it is the one thing a screenshot at a glance will confirm.
   - `document.querySelectorAll('script[src*="googletagmanager"]').length` is
     **0** before clicking anything, and **1** only after clicking Accept.
   - At 375 wide the two buttons still sit on one row and each fills about half
     the card.
