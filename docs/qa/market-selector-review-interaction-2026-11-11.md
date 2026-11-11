# Market selector review, lens A: interaction, accessibility, integration (2026-11-11)

PASS WITH FINDINGS

One MAJOR (F1) is a code-level defect on the core ask ("once I type the first letter it starts filtering"): on a mouse click into a field that already shows a label, the select-all is very likely lost, so the first key appends to the label instead of replacing it. It is not confirmed in a browser (this lane may not run one). If the orchestrator's browser check reproduces it, treat F1 as blocking for the push; the fix is one line.

Reviewer: bg-verify, lens A, read-only. Files read in full: `src/components/ui/Combobox.tsx`, `src/lib/comboboxFilter.ts`, `src/lib/marketOptions.tsx`, `src/components/ui/index.ts` (diff), `src/pages/Onboard.tsx` (diff plus handler and POST body), `src/components/Layout.tsx` (full diff against HEAD plus lines 490 to 530 and 840 to 960), `tests/markets_data.test.js` and `tests/combobox_filter.test.js` (run). No source file was edited.

## Commands run

```
node tests/combobox_filter.test.js   -> combobox_filter: 14 passed, 0 failed
node tests/markets_data.test.js      -> markets_data: 38 passed, 0 failed
git diff -U0 -- brandgeo-dashboard/src brandgeo-dashboard/netlify/functions/_enqueue.js | rg -n "^\+.*[<U+2014><U+2013>]"   -> exit 1 (no hits)
printf '+ control \xe2\x80\x94 here\n' | rg -n "[<U+2014><U+2013>]"                     -> 1:+ control ... here, exit 0 (positive control fires)
rg -n "[<U+2014><U+2013>]" Combobox.tsx comboboxFilter.ts marketOptions.tsx markets_data.test.js combobox_filter.test.js   -> exit 1
rg -n "motion|framer" Combobox.tsx marketOptions.tsx comboboxFilter.ts   -> only a comment (Combobox.tsx:18) and the class motion-reduce:transition-none (:165); no import
rg -n "#[0-9a-fA-F]{3,6}\b" Combobox.tsx marketOptions.tsx               -> exit 1 (no hex)
grep showAddMarket|setShowAddMarket|marketMenuRef|marketBtnRef|\bPlus\b Layout.tsx -> exit 1 (no leftover)
POST body of Onboard handleCreate diffed against HEAD                    -> identical
```

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | First letter filters at once; focus or click selects text; first match active | Not met on the mouse-click path (F1, code level, unconfirmed in browser). Met on keyboard focus and for the picker | `Combobox.tsx:153` selects in onFocus; `:154` onClick re-selects only when `!open`, which is already true after the focus handler's update is flushed; `:160` sets active 0 on non-empty input; filter tiers `comboboxFilter.ts:25-55` |
| A2 | WAI-ARIA 1.2 combobox plus listbox | Met with one LOW (F2) | `role="combobox"` :143, `aria-expanded` :146, `aria-controls` only when open :147 and the `ul id={listId}` exists only when open :177-179, `aria-activedescendant` only for a rendered index :148 with ids `optionId(i)` :195, `aria-autocomplete="list"` :145, options `role="option"` plus `aria-selected` :196-197. Names: Onboard `label htmlFor` plus `id` (`Onboard.tsx:271-272`, `:277-278`), Layout `ariaLabel` (`Layout.tsx:935`, `:953`). Onboard listboxes have no name (F2) |
| A3 | Keys | Met | ArrowDown/Up wrap and open when closed :101-110, :92-97; Home/End :111-116; Enter only when open and active, with preventDefault :117-118, and Onboard has no `<form>` and no wizard-level Enter handler (grep: only the alias, competitor and prompt inputs carry onKeyDown, `Onboard.tsx:301,331,365`); Escape when open closes, restores the label via `close()` and stops the native event so the Layout document handler (`Layout.tsx:220-227`) does not also close the mobile drawer (React 18.3, root listener runs before document); Escape when closed reaches the document and closes the drawer as before; Tab closes, value unchanged :129-131 |
| A4 | Value always an option; blur restores label; no stale query after an external change | Met | onChange is only called from `choose()` :87-90; `onBlur={close}` :155 resets `query` to null; label is derived from `value` each render :60, :63. Onboard market change: `handleMarketChange` (`Onboard.tsx:124-128`) sets regionId to `regions[0]` while focus is on the market input, so the region input's query is already null and it shows the new label |
| A5 | Mouse and touch selection without hover, input keeps focus | Met (code level) | `onMouseDown={e => e.preventDefault()}` on the listbox :182 keeps focus, selection on `onClick` :198, hover only moves the active row :199 |
| A6 | Picker mode | Met with one LOW (F3) | `selected` undefined when clearOnSelect :60, so `shown` is '' after `close()`; placeholder "Add market" `Layout.tsx:952`; options rebuilt from `availableMarkets` each render `Layout.tsx:949`. Adding the last market unmounts the focused input (F3) |
| A7 | Active option in view; height cap; placement top not clipped | Met at code level | `scrollIntoView({block:'nearest'})` on active change :66-69; `max-h-64 overflow-y-auto` :184. Ancestors of the sidebar block: Combobox `relative` div, card (overflow-hidden removed, `Layout.tsx:904`), market block `flex-shrink-0` with no overflow (`:858`), `<aside>` with no overflow (`:520`), root `flex h-screen overflow-hidden` (`:490`). The market block is NOT inside the `nav overflow-y-auto` (`:679`); it is a later sibling, so the upward popup (z-50, later in DOM) paints over the nav. Only the root's overflow-hidden and the viewport top can clip it, which needs the input to sit within 256 px of the top of the window (not measured, see below). Onboard: placement bottom inside `main overflow-auto` (`Layout.tsx:1109`); the Onboard card (`Onboard.tsx` step container) has no overflow class, so the list extends the scroll area |
| A8 | 44 px targets below 768, focus ring, tokens, no motion | Met with one LOW (F4) | `max-md:min-h-[44px]` on input :167 (min-height beats `h-7`) and rows :201; ring from the global `input:focus-visible:focus-visible` rule (`src/index.css:439-444`, accent-ink); classes are semantic tokens (`surface-2`, `edge`, `ink`, `ink-3`, `line-2`, `accent-ink`, `shadow-raised`, all present in `tailwind.config.js`); no hex, no motion import |
| A9 | Layout removals clean; only market block changed; Onboard only two selects; POST body unchanged | Met | Layout hunks: (1) `Plus` dropped from lucide import, (2) Combobox and marketOptions imports, (3) `showAddMarket` state, (4) `marketMenuRef`, (5) `marketBtnRef`, (6) pointerdown branch, (7) Escape branch, (8) effect deps, (9) client menu onClick `setShowAddMarket(false)` removed (`:718`), (10) market editor toggle (`:869`), (11) card `overflow-hidden` removed (`:904`), (12) region select to Combobox (`:926-936`), (13) Add market button and menu to Combobox (`:944-955`), (14) language button onClick (`:989`). Hunks 9, 10 and 14 are outside the market block but only drop the now-deleted setter. No leftover reference (grep exit 1). `Globe2` still used (`:887`, `:908`). Onboard: two selects replaced, labels gained `htmlFor`, imports and `MARKET_OPTIONS`; `handleMarketChange` unchanged; POST body identical to HEAD |
| A10 | No existing component props changed; no dashes | Met | `ui/index.ts` only adds two export lines; `Combobox` did not exist at HEAD. `Market` gained optional `aliases?` (`markets.ts:25`), a data type, not a component prop. Dash scan clean with a firing positive control |
| A11 | React correctness | Met | No setState during render; one effect with deps `[active, uid]`; ids from `useId`; keys `o.value` (unique ids per tests); no document listener in Combobox; `active` is clamped against `filtered.length` :62 so a rebuilt option array (Layout rebuilds it on every render) cannot point past the list |

## Findings

### F1 MAJOR (PLAUSIBLE, needs a browser to confirm): a mouse click into a field showing a label does not leave the text selected, so the first key appends

- Where: `brandgeo-dashboard/src/components/ui/Combobox.tsx:153-154`.
- Scenario: Onboard step 1, "Default market" shows "Worldwide" (initial `marketId` is `WW`, `Onboard.tsx:28`). Click into the field with the mouse and type `s`. Sequence: mousedown focuses the input, `onFocus` calls `openList()` and `select()`. React 18 flushes the discrete focus update, so by the time `click` fires the rendered `onClick` closure sees `open === true` and skips its own `select()`. In Chromium and WebKit the caret placement of the same mouse gesture collapses a selection made in the focus handler (the long-standing select-on-focus problem), so the field holds a caret, not a selection. Typing `s` gives "Worldwides" (or "sWorldwide"), `filterComboboxOptions` returns nothing and the list reads "No match". Same for the sidebar region fields and for Default region. The keyboard path (Tab into the field) is not affected, and the Add market picker is not affected because its field is empty.
- Why it matters: this is exactly the behaviour the request asked for, on the most common entry path.
- Smallest fix: make the click path always select while the label is shown, for example `onClick={e => { if (!open) openList(); if (query === null) e.currentTarget.select() }}`. `click` fires after mouseup, so the selection survives.

### F2 LOW: the Onboard listboxes have no accessible name

- Where: `Combobox.tsx:181` (`aria-label={ariaLabel}`), `Onboard.tsx:272` and `:278` pass no `ariaLabel`.
- Scenario: a screen reader user opens "Default market"; the listbox (role listbox requires a name) is announced without one. The input itself is named by its `<label>`.
- Smallest fix: pass `ariaLabel="Default market"` and `ariaLabel="Default region"` in Onboard, or in Combobox fall back to `aria-labelledby` on the `ul` pointing at an id the caller supplies for its label.

### F3 LOW: adding the last available market unmounts the focused input and drops focus to the body

- Where: `Layout.tsx:944` (`availableMarkets.length > 0 &&`), with the selection made while the input has focus (`Combobox.tsx:182` keeps focus on purpose).
- Scenario: an admin with 60 markets selected picks the 61st with Enter. `addSelection` empties `availableMarkets`, the Combobox unmounts while focused, focus falls to `document.body`; a keyboard user in the mobile drawer loses their place. Practically rare given 61 markets.
- Smallest fix: when the list is empty render a disabled field ("All markets added") instead of nothing, or move focus to the Done button after the last add.

### F4 LOW: the Add market field is a 12 px text input on phones, which iOS Safari zooms into on focus

- Where: `Combobox.tsx:166` (`size === 'sm'` gives `text-xs`), used at `Layout.tsx:946` and `:927`; viewport meta has no maximum-scale (`index.html:17`).
- Scenario: on an iPhone, open the drawer, tap "Add market": Safari zooms the page because the input font is under 16 px, and the drawer stays zoomed after the choice. The region field was already a 12 px select (pre-existing); the Add market control was a button before and did not zoom, so this part is new. Onboard (14 px `text-body`) behaves as the old selects did.
- Smallest fix: `max-md:text-base` on the input.

### F5 INFO: a typed, fully matching query is discarded on Tab or blur

- Where: `Combobox.tsx:129-131`, `:155`.
- Scenario: type "south korea" in Default market (South Korea is active), then click Next. The field restores "Worldwide" and the client is created on Worldwide. The label visibly reverts, and the brief asked for exactly this ("Tab closes, value unchanged"), so this is recorded, not a defect. If leads are onboarded in a hurry, consider committing on blur when the query matches exactly one option.

## What I did not check

- Nothing was rendered: no browser, no tsc, no build. F1 rests on documented browser behaviour of select() inside a focus handler during a mouse gesture, not on an observation.
- iOS Safari support for `select()` on tap (it may need `setSelectionRange`), real touch scrolling inside the 256 px list, and whether the emulated mousedown on a tap keeps focus on every mobile browser.
- Clipping of the upward popup on short viewports (for example a phone in landscape at 375 px tall with the market editor open): reasoned from the code only; the root `h-screen overflow-hidden` is the only clipping ancestor.
- Screen reader output (NVDA, VoiceOver) for active descendant changes and the "No match" row.
- Light mode colours and contrast of `text-ink-3` placeholder and the active row on `bg-surface-2`.
- Bundle impact: Onboard imports Combobox through the `components/ui` barrel; I did not check whether that barrel pulls `motion` into the Onboard chunk (Layout imports Combobox directly, so the entry chunk is not affected by the barrel).
- Data lanes (market list content, ISO codes, `_enqueue.js` COUNTRY_NAMES, SerpApi support): other lenses.

## Amendment 2026-11-11, written from the orchestrator seat, not by the reviewer

The literal dash characters in the scan commands above were replaced by their code points so this report carries no dash; nothing else in the reviewer's text was changed. After this review returned, the orchestrator changed `Combobox.tsx` and `Onboard.tsx` itself and exercised the result in headless Chrome over CDP with real mouse and key events, in demo mode. No second `bg-verify` run was made on these edits.

- F1, closed and now measured: the field records a mousedown that gives it focus and cancels that one mouseup, then selects the whole label; a click on an already focused, closed field selects too; after a choice the new label is selected on the next frame. Measured: after a mouse click the selection is [0, 9] on "Worldwide", the next key gives the value "s" with Saudi Arabia, Singapore and Slovakia first, and typing after a choice replaces the label.
- F2, closed: Onboard passes `ariaLabel="Default market"` and `ariaLabel="Default region"`; the listbox name read back as "Default market".
- F4, closed: the input carries `max-md:text-base`; measured 16 px at 390 wide in both sizes.
- F5, changed on purpose: leaving the field with typed text now commits it when it names exactly one option (a single match, or a label typed in full), and restores the label otherwise. The picker in the sidebar never commits on leave. Measured: "singapore" then a click on Next commits SG; "zzz" restores; "s" (28 matches) does not commit.
- F3, open: adding the 61st market still unmounts the focused field.
- One more defect, found by the orchestrator in a screenshot and fixed: the active option was kept in view with `scrollIntoView`, which scrolls every ancestor including the overflow-hidden app shell. The list now scrolls only itself (`scrollTop` on the listbox). After every scenario no overflow-hidden element had a non-zero scroll offset.

Measured, 72 of 72 assertions pass: the Onboard fields in a harness (the wizard is behind the admin gate, which demo mode never opens, so the two fields were mounted outside it from the same components and option builders) at 1440 by 900 and 390 by 844; the real sidebar market block at 1440 by 900, 1280 by 620, 390 by 844 and 390 by 560. Lists open inside the viewport and every visible option is hittable (not clipped) in all four sidebar views; Escape closes the list and leaves the phone drawer open; sizes are 40 and 36 px on desktop (28 px for the sidebar field), 44 px on a phone; no sideways page scroll; no console error from our code.

Not checked by anyone: the real Onboard page signed in as an admin, iOS Safari and Android Chrome on a device (touch was not emulated, clicks were mouse events), a screen reader, Firefox, light mode contrast by measurement (one light screenshot was looked at).
