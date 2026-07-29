# 04. Nav CTA renders as a text link, not a button

**File:** `brandgeo/web/index.html`
**Element:** `body > nav > div > a.nav-cta`, text `Get started`, markup at `index.html:2036`
**Rule:** `index.html:315` to `:327`
**Date:** 2026-07-29
**Status:** spec only. No file was edited by this note.

Owner's report:

> this button show be in the colors of the theme to pop out like the violet style
> we use for the accept for cookies

The premise is correct, and it is correct for a reason stronger than taste. See
§7 for the one part of the framing that needs a correction.

---

## 1. What the element does today

Confirmed in source, not inferred. `index.html:313` to `:327`, exactly as it
appears on disk:

```css
    nav a { color: var(--t2); text-decoration: none; font-size: 0.88rem; font-weight: 500; margin-left: 28px; padding: 11px 0; transition: color .15s; }
    nav a:hover { color: var(--t); }
    /* Outline, not solid. homepage-hook.md §3.2: exactly one solid --ac-strong
       fill above the fold, and it belongs to the hero domain field. */
    .nav-cta {
      background: transparent !important;
      color: var(--t) !important;
      border: 1px solid var(--bd2);
      padding: 11px 18px;
      border-radius: 8px;
      font-weight: 700;
      margin-left: 16px !important;
      transition: border-color .15s, color .15s !important;
    }
    .nav-cta:hover { border-color: var(--ac); color: var(--t) !important; }
```

`background: transparent !important` at `:318` is the whole of it. The measured
`rgba(0, 0, 0, 0)` is not a cascade accident or an override from `site.js`; it is
the declared value, and no other rule anywhere in `index.html` or `site.js` sets
a background on `.nav-cta`. The measured 115x47 box comes from `padding: 11px
18px` plus the 1px border plus a 23px line box (0.88rem at `line-height: 1.6`).

**This was deliberate, and it is worth knowing before reversing it.**
`docs/design/homepage-hook.md` §3.2 demoted this element on purpose:

> **E4 is the primary CTA.** It is the domain input plus its run control, treated
> as one object. [...] Nothing else on the page above the pricing section may
> use a solid `--ac-strong` fill.

and §5.3 of the same document:

> `.nav-cta` is demoted per §3.2. It keeps its destination.

So the nav CTA previously carried `background: var(--ac-strong) !important`, the
same fill every other page still uses, and the hook rebuild took it away. The
owner is asking to put it back.

### 1.1 The measurable reason the owner is right

With no fill, the element's entire visual boundary is a 1px `--bd2` hairline.
Computed with the WCAG relative-luminance formula:

| Boundary | Colours | Ratio | WCAG 1.4.11 (3:1) |
|---|---|---|---|
| Dark | `--bd2` `#32333c` on `--bg` `#0a0b0e` | **1.57:1** | FAIL |
| Light | `--bd2` `#cfcfda` on `--bg` `#f7f7fc` | **1.45:1** | FAIL |

Both numbers agree with the `:root` block's own annotation at `index.html:184`
(`1.57:1 vs --bg`), which is a useful cross-check on the arithmetic below.

The label itself is fine today, 16.22:1 dark and 18.59:1 light, so this is not a
text-contrast defect. It is a non-text-contrast defect: the control has no
perceivable boundary, which is exactly why it reads as a link. Filling it fixes a
real 1.4.11 failure, it does not merely change a preference.

---

## 2. The reference treatment, quoted

The cookie banner is not in any HTML file. It is built and styled entirely by
`brandgeo/web/ga4-init.js`, which injects a `<style>` element with id
`bg-cc-css`. The relevant lines, `ga4-init.js:124` to `:129`, verbatim:

```js
    '.bg-cc button{flex:1 1 160px;padding:11px 18px;border-radius:9px;font:inherit;' +
    'font-weight:600;font-size:.86rem;cursor:pointer;border:1px solid transparent;}' +
    '.bg-cc-accept{background:var(--ac-strong,#7c3aed);color:#fff;}' +
    '.bg-cc-reject{background:transparent;color:var(--t,#e8e9ed);border-color:var(--bd2,#32333c);}' +
    '.bg-cc-accept:hover{filter:brightness(1.08);}' +
    '.bg-cc-reject:hover{border-color:var(--t2,#9ba1ac);}' +
```

Four things to carry across, and one not to.

1. The fill is **`--ac-strong`**, not `--ac`. This is the constraint that matters
   most, see §4.
2. The foreground is a literal **`#fff`**, not `var(--t)`. Deliberate: it does not
   flip with theme, because `--ac-strong` already flips underneath it.
3. `border: 1px solid transparent` keeps the box geometry identical to the
   outlined sibling. Carrying this preserves the nav CTA's measured 47px height
   exactly.
4. Hover is **`filter: brightness(1.08)`**, an opaque transform.

What not to carry: `padding:11px 18px` and `font-weight:600` are already matched
or deliberately different on the nav CTA (`font-weight: 700`). Leave those alone.
`border-radius` differs, 9px on the banner against 8px in the nav. Do not
harmonise it. 8px is the nav's own radius and `.search-btn` uses 10px, so there is
no single site radius to converge on and changing it gains nothing.

Note the banner's Reject button is a byte-for-byte match for the nav CTA's
current styling: `background:transparent`, `color:var(--t)`, `border-color:
var(--bd2)`. The primary navigation CTA is currently wearing the site's own
*decline* treatment. That is the clearest single statement of the defect.

---

## 3. Exact patch blocks

Two blocks, applied to `brandgeo/web/index.html`. They are independent: if block
B fails to apply, block A is still complete and correct on its own.

**Encoding warning for block B.** The find string contains one non-ASCII
character, the section sign `§` (UTF-8 `C2 A7`), inside `homepage-hook.md §3.2`.
The file is UTF-8. If a tool mangles it, apply block B by hand instead. Block A
is pure ASCII and has no such risk, which is why the two are separated.

### Block A, required. The rule itself.

FIND, exactly, 11 lines, four-space base indent:

```
    .nav-cta {
      background: transparent !important;
      color: var(--t) !important;
      border: 1px solid var(--bd2);
      padding: 11px 18px;
      border-radius: 8px;
      font-weight: 700;
      margin-left: 16px !important;
      transition: border-color .15s, color .15s !important;
    }
    .nav-cta:hover { border-color: var(--ac); color: var(--t) !important; }
```

REPLACE with:

```
    .nav-cta {
      background: var(--ac-strong) !important;
      color: #fff !important;
      border: 1px solid transparent;
      padding: 11px 18px;
      border-radius: 8px;
      font-weight: 700;
      margin-left: 16px !important;
      transition: filter .15s, background-color .15s !important;
    }
    .nav-cta:hover { filter: brightness(1.08); color: #fff !important; }
    .nav-cta:active { filter: brightness(.95); }
    /* The global a:focus-visible rule at :253 also sets border-radius: 6px, and
       at (0,1,1) it outranks .nav-cta at (0,1,0), so focusing this pill squares
       its corners by 2px. (0,2,0) puts the 8px back. */
    .nav-cta:focus-visible { border-radius: 8px; }
```

Line-by-line rationale for every changed declaration:

- `background` moves from `transparent` to `var(--ac-strong)`. The `!important`
  is kept, unchanged. It is redundant against anything in `index.html`, but
  `site.js` injects a `<style>` late in `<head>` that carries its own `.nav-cta`
  rule (`site.js:760`, the sub-380px padding override). A later stylesheet wins
  at equal specificity, so dropping `!important` here would change precedence for
  no gain. Every one of the other 77 pages uses `!important` on this same
  declaration; keep the pattern.
- `color` moves from `var(--t)` to `#fff`. **This is not optional and it is the
  trap in this patch.** In light mode `--t` is `#09090f`. Filling the background
  while leaving `color: var(--t)` gives near-black text on `#6d28d9` at
  **2.79:1**, which fails AA badly and would ship a worse defect than the one
  being fixed. Both declarations move together or neither does.
- `border` moves from `1px solid var(--bd2)` to `1px solid transparent`. This
  preserves the 115x47 box exactly. Removing the border outright with
  `border: none` would shrink the pill to 113x45 and drop it 1px below the 44px
  hit-target floor that `homepage-hook.md` §9.3 already had to fix once on
  `.search-btn`. Keep the transparent border.
- `transition` moves from `border-color, color` to `filter, background-color`.
  Those two properties are what now change on hover and on theme flip, and the
  old two no longer change at all. `!important` kept for consistency with the
  surrounding declarations.
- `:hover` moves from `border-color: var(--ac)` to `filter: brightness(1.08)`,
  matching `.bg-cc-accept:hover`. See §5 for why brightness and not the
  `opacity: .9` used elsewhere in this file.
- `:active` and `:focus-visible` are new. See §5.

### Block B, required. The comment above the rule.

The comment at `:315` to `:316` states a design constraint this patch reverses.
Leaving it in place would leave the file asserting the opposite of what it does.

FIND, exactly, 2 lines (contains `§`):

```
    /* Outline, not solid. homepage-hook.md §3.2: exactly one solid --ac-strong
       fill above the fold, and it belongs to the hero domain field. */
```

REPLACE with:

```
    /* Solid fill, restored 2026-07-29 at the owner's direction, reversing the
       demotion in homepage-hook.md §3.2. The outlined version failed WCAG 1.4.11:
       its only boundary was a --bd2 hairline at 1.57:1 dark and 1.45:1 light,
       against a 3:1 floor. The fill must be --ac-strong and never --ac; white on
       --ac is 4.23:1 and fails AA, white on --ac-strong is 5.70:1 dark and
       7.11:1 light. The hero domain field keeps primacy through its gradient
       (:1792), its size and its position, not through being the only violet. */
```

### Nothing else changes

No new token. No change to either `:root` block. No light-mode override rule is
needed, and adding one would be wrong: `--ac-strong` is already declared in both
blocks (`:189` dark `#7c3aed`, `:223` light `#6d28d9`), so a single declaration
covers both themes correctly. The prior audit's finding that 76 pages never
override accent tokens in their light block does not apply here, because this
patch introduces no hardcoded colour except `#fff`, which is theme-invariant by
design and verified against both fills in §4.

---

## 4. Computed contrast

Every ratio below is computed with the WCAG relative-luminance formula, not
asserted. Method: linearise each sRGB channel with `c <= 0.03928 ? c/12.92 :
((c+0.055)/1.055)^2.4`, then `L = 0.2126R + 0.7152G + 0.0722B`, then
`(Lmax+0.05)/(Lmin+0.05)`.

The method was calibrated against five values this repo already documents, and
reproduced all five: `--bd2` 1.57:1, `--t` 16.22:1, `--t` light 18.59:1, `--ac`
4.65:1 against `--bg`, and white on `--ac` 4.23:1.

### 4.1 Label against fill, the AA text test

| State | Foreground | Background | Ratio | AA normal (4.5:1) |
|---|---|---|---|---|
| Dark, rest | `#ffffff` | `--ac-strong` `#7c3aed` | **5.70:1** | PASS |
| Dark, hover | `#ffffff` | `brightness(1.08)` = `rgb(134,63,255)` | **5.04:1** | PASS |
| Dark, active | `#ffffff` | `brightness(.95)` = `rgb(118,55,225)` | **6.17:1** | PASS |
| Light, rest | `#ffffff` | `--ac-strong` `#6d28d9` | **7.11:1** | PASS (also AAA) |
| Light, hover | `#ffffff` | `brightness(1.08)` = `rgb(118,43,234)` | **6.36:1** | PASS |
| Light, active | `#ffffff` | `brightness(.95)` = `rgb(104,38,206)` | **7.62:1** | PASS (also AAA) |

The label is 0.88rem at weight 700, which is 14.08px. That is below the 18.66px
large-bold threshold, so the 4.5:1 bar applies, not 3:1. Every state clears it,
worst case 5.04:1 on dark hover.

Hover values assume the CSS `brightness()` shorthand operates on sRGB channel
values, per the Filter Effects spec's shorthand definition. `brightness(1.08)`
on `#7c3aed` clamps blue at 255, which is why dark hover loses more contrast than
light hover gains; it is still 0.54 above the bar.

### 4.2 Fill against page, the 1.4.11 non-text test

| Theme | Component | Adjacent | Ratio | 1.4.11 (3:1) |
|---|---|---|---|---|
| Dark, before | `--bd2` `#32333c` | `--bg` `#0a0b0e` | 1.57:1 | FAIL |
| Dark, after | `--ac-strong` `#7c3aed` | `--bg` `#0a0b0e` | **3.45:1** | PASS |
| Light, before | `--bd2` `#cfcfda` | `--bg` `#f7f7fc` | 1.45:1 | FAIL |
| Light, after | `--ac-strong` `#6d28d9` | `--bg` `#f7f7fc` | **6.65:1** | PASS |

Caveat on the "after" dark figure. The nav backdrop is `--nav`
`rgba(10,11,14,.85)` with a 16px backdrop blur, not `--bg` itself, so the real
adjacent colour depends on what has scrolled under the sticky bar. At scroll
position 0 it is `--bg` and 3.45:1 is exact. The 15% bleed-through can move it in
either direction; 3.45:1 leaves 0.45 of headroom, which is thin. This is a reason
to prefer the opaque `filter` hover over an `opacity` hover, see §5.1, not a
reason to reject the patch: the before state fails at 1.57:1 regardless of what
is behind it.

### 4.3 The trap, recorded so nobody rediscovers it

| Variant | Foreground | Background | Ratio | Verdict |
|---|---|---|---|---|
| Fill applied, `color` left as `var(--t)`, light | `#09090f` | `#6d28d9` | **2.79:1** | FAIL, worse than today |
| Fill applied as `--ac` instead of `--ac-strong`, dark | `#ffffff` | `#8b5cf6` | **4.23:1** | FAIL |

---

## 5. Hover, focus and active

### 5.1 Hover

Today: `border-color: var(--ac)` with the label colour unchanged. On a
transparent control that is the only hover affordance there is, and it is a
1px hairline moving from 1.57:1 to 4.65:1 against the page.

Proposed: `filter: brightness(1.08)`, copied from `.bg-cc-accept:hover`.

`index.html` has its own idiom for filled violet CTAs, `opacity: .9`, used by
`.audit-email-btn:hover` (`:796`), `.btn-plan` (`:1431`), `.submit-btn:hover`
(`:1589`) and `.search-btn:hover` (`:670`). **Do not use it here.** The nav is
`position: sticky` over a translucent `--nav` background. A partially transparent
button on a partially transparent bar composites over whatever page content
happens to be scrolling beneath it, so both the fill and the 5.70:1 label
contrast become a function of scroll position and cease to be measurable.
`filter: brightness()` is opaque and deterministic, which is why the cookie
banner, the one other control in this codebase that floats over arbitrary
content, already uses it. The owner named that button as the reference, so this
also happens to be the literal instruction.

### 5.2 Focus

**A focus ring already exists.** `index.html:253` to `:262`:

```css
    a:focus-visible,
    button:focus-visible,
    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible,
    [tabindex]:focus-visible {
      outline: 2px solid var(--ac);
      outline-offset: 2px;
      border-radius: 6px;
    }
```

`.nav-cta` is an `<a>`, so it inherits this. There is no keyboard-accessibility
failure to fix, and no `.nav-cta`-specific focus rule needs to be added for
visibility. The ring survives the patch intact and still measures:

| Theme | Ring | Adjacent (across the 2px offset gap) | Ratio | 1.4.11 |
|---|---|---|---|---|
| Dark | `--ac` `#8b5cf6` | `--bg` `#0a0b0e` | **4.65:1** | PASS |
| Light | `--ac` `#7c3aed` | `--bg` `#f7f7fc` | **5.34:1** | PASS |

Because `outline-offset: 2px` leaves a 2px gap of page background between the
pill and the ring, the ring's adjacent colour is the nav backdrop, not the new
fill. Ring against fill directly would only be 1.35:1 dark and 1.25:1 light, so
the offset is doing real work here and must not be removed.

One genuine wart, which Block A fixes as a byproduct. That shared rule also sets
`border-radius: 6px`. `a:focus-visible` has specificity (0,1,1) and `.nav-cta`
has (0,1,0), so the shared rule wins and the pill's corners snap from 8px to 6px
whenever it is focused. Invisible-ish today on a hairline outline, obvious once
the shape is filled violet. `.nav-cta:focus-visible { border-radius: 8px; }` is
(0,2,0) and restores it. This is a one-line fix inside the element already being
patched, not scope creep.

### 5.3 Active

**No `:active` state exists anywhere in `index.html`.** `grep ":active"` returns
zero matches across the whole file, and `.bg-cc-accept` has none either. So there
is no existing convention to match and nothing to preserve.

Block A adds `filter: brightness(.95)`, computed at 6.17:1 dark and 7.62:1 light,
both comfortably above AA. It gives touch and pointer users a press
acknowledgement on a control whose destination is an off-site navigation to
`app.getbrandgeo.com/signup`, where the page will not repaint for a moment. This
is the one addition in this note that is a judgement call rather than a
correction. It is one line and it is trivially revertible if unwanted.

---

## 6. Blast radius

**This patch touches `brandgeo/web/index.html` only. Zero pages other than the
homepage change.** There is no shared stylesheet; every page carries its own
inline `<style>` block with its own `.nav-cta` rule.

Counted across `brandgeo/web/`:

| | Count |
|---|---|
| HTML files (including `news/` subdirectories) | 82 |
| Files declaring a `.nav-cta` rule | 78 |
| Of those, `background: var(--ac) !important` | 55 |
| Of those, `background: var(--accent)` | 22 |
| Of those, `background: transparent !important` | **1, `index.html`** |

The homepage is the sole outlier. Every other page already ships a solid violet
nav CTA, which means this patch does not introduce a new pattern, it returns the
homepage to the site's existing one. That is an additional argument for the
owner's request that the request itself did not make.

`site.js` is shared and does reference `.nav-cta`, at `:719`, `:744` and `:760`.
None of the three sets a background or a colour: `:719` is a selector for the
mobile drawer wrap, `:744` hides the non-CTA nav links under 640px, `:760` trims
horizontal padding under 380px. `site.js` is unaffected and must not be edited.

### 6.1 A larger defect found while counting, deliberately NOT fixed here

Those 55 `var(--ac)` pages and 22 `var(--accent)` pages all set `color: #fff`,
and all of them define the dark-mode token as `#8b5cf6` (spot-checked in
`faq.html:67`, `blog.html:38`, `ai-visibility-for-boston.html:76`,
`brandgeo-vs-peec.html:51`). White on `#8b5cf6` is **4.23:1** and fails AA.

So **77 pages ship a nav CTA whose label fails AA in dark mode**, and the
homepage is the only one that does not, purely because it has no fill at all.
Their light blocks redefine `--ac` to `#7c3aed`, so light mode is fine at 5.70:1;
this is a dark-mode-only failure.

That is a 77-file mechanical find-and-replace of `var(--ac)` to `var(--ac-strong)`
and `var(--accent)` to `var(--accent-strong)` in one declaration. It is out of
scope for this note, it is not what the owner asked for, and shipping it inside
this patch would make a one-line homepage fix into a site-wide change reviewed as
if it were a one-line homepage fix. **File it as its own task.**

---

## 7. Where the framing needs correcting

The task framing states that `--ac` `#8b5cf6` "measures 4.65:1 with white text".
That is two different measurements collapsed into one, and the file itself
(`index.html:185` to `:186`) collapses them the same way:

> Brand. Two values on purpose: --ac is 4.65:1 and is a FILL behind white
> button text; --ac-text is 7.23:1 and is what accent WORDS use.

Computed:

- `#8b5cf6` against `--bg` `#0a0b0e` is **4.65:1**. This is a non-text,
  component-against-background measurement. It clears 1.4.11's 3:1.
- `#ffffff` against `#8b5cf6` is **4.23:1**. This is the text measurement. It
  fails AA's 4.5:1.

The 4.65 figure is real but it is not the white-text figure. This does not weaken
the constraint, it strengthens it: the actual white-on-`--ac` number is 4.23:1,
worse than the 4.65:1 stated, so the instruction not to reintroduce `--ac` as a
fill behind white text stands and stands harder. `CLAUDE.md` already records
4.23:1 correctly, and so does the comment at `index.html:781`. The `:185` comment
is the one that is loose. Not changed here, see §8.

Everything else in the report is accurate. `rgba(0, 0, 0, 0)` is the declared
value, the element does read as a text link, and the cookie Accept button is the
right reference.

---

## 8. Deliberately not changed

1. **`--ac`, `--ac-strong`, and both `:root` blocks.** Untouched. The patch
   consumes existing tokens and introduces no new ones. `--ac-strong` is already
   correct in both themes.
2. **`border-radius`.** Stays 8px, not harmonised to the banner's 9px or
   `.search-btn`'s 10px. There is no single site radius to converge on and
   changing it would alter the measured geometry for no accessibility or
   consistency gain.
3. **`font-weight: 700`.** Stays. The banner uses 600, but 700 matches this nav's
   own scale and the homepage's other CTAs.
4. **The `!important` flags.** Kept exactly where they are today, on `background`,
   `color`, `margin-left` and `transition`. `site.js` injects a late `<style>`
   carrying its own `.nav-cta` rule, so at equal specificity the injected sheet
   wins; removing `!important` would change precedence for no benefit. This is
   also the pattern all 77 sibling pages use.
5. **The other 77 pages' AA failure.** Documented in §6.1, left for its own task.
   Not bundled here.
6. **The loose comment at `index.html:185` to `:186`.** It conflates
   component-against-background contrast with text contrast, per §7. It is a
   comment, not a defect, it sits 130 lines from anything this patch touches, and
   another agent is working in this file concurrently. Correcting prose in a
   shared file for no behavioural gain is how patches collide. File separately if
   it matters.
7. **`homepage-hook.md` §3.2 and §5.3.** They now state a rule the homepage no
   longer follows. This note is not authorised to edit `docs/design/`. Block B
   records the reversal at the point of use, inside `index.html`, which is where
   the next person reading the CSS will look. Someone should reconcile the design
   spec afterwards.
8. **The hero domain field.** Untouched. It remains the primary CTA and it keeps
   its distinction through a gradient fill (`index.html:1792`,
   `linear-gradient(135deg, var(--ac-strong), #6366f1) !important`), roughly four
   times the area, and its position in the visitor's reading order. The honest
   cost of this patch is that there are now two violet fills above the fold where
   the design spec wanted one. Flat pill against large gradient block is a
   readable hierarchy, but it is a hierarchy by degree rather than by kind, and
   that is a real trade the owner is making knowingly.

---

## 9. Verification for whoever applies this

Both blocks are literal find-and-replace. Block A is ASCII. Block B contains one
`§`.

After applying, check in the browser at 1280px in **both** themes:

1. The pill is filled violet, not transparent. `getComputedStyle` on
   `a.nav-cta` returns `rgb(124, 58, 237)` in dark and `rgb(109, 40, 217)` in
   light for `background-color`, and `rgb(255, 255, 255)` for `color` in both.
2. Box is still 115x47 at top 14. If it reads 113x45, the transparent border was
   dropped.
3. Tab to it. The 2px `--ac` ring appears with a 2px gap, and the corners stay at
   8px rather than snapping to 6px.
4. Hover brightens rather than fading, and nothing behind the sticky nav shows
   through the pill while the page is scrolled.
5. Scroll the page so content passes under the nav, then re-check the pill is
   still fully opaque.

Anything else on the page changing is a sign one of the other three patches in
this directory collided with this one.
