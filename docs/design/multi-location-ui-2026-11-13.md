# Multi-location UI: binding design spec (packet 2)

Author: bg-design. Date: 2026-11-13. Status: READY for bg-app rows 4, 5 and 6 of `docs/arch/multi-location-collection.md` section 12. Nothing in this file was built, rendered or measured: every pixel figure below is a target for the builder and a check for the orchestrator, not a result.

Inputs read: `docs/arch/multi-location-collection.md` (sections 2, 3, 5.3, 7, 8, 14), `src/components/ui/Combobox.tsx`, `src/lib/comboboxFilter.ts` (exports only), `src/lib/marketOptions.tsx`, `src/components/Layout.tsx:495-1030`, `src/pages/Prompts.tsx:260-655`, `src/pages/Account.tsx:404-563`, `src/pages/AIVisibility.tsx` (header `:1604-1650`, row render `:1397-1500`, "Your prompts" `:2229-2375`), `src/pages/Onboard.tsx:236-395` (read only), `src/components/ui/` (Badge, Button, Card, Chip, ChipGroup, DataList, Disclosure, IconButton, Notice, PageHeader, SectionHeader, SegmentedControl, skeletons, tableClasses), `tailwind.config.js`, `src/index.css` (token triplets, `.label-caps`, `.side-row`, `.skeleton`, focus ring), `docs/design/phase3-visual/phase3-visual-spec.md` sections 13.1 to 13.3. The phase 4 and phase 5 specs were not re-read here; their binding rules are the ones restated in the brief and in CLAUDE.md (the 682 px and 1,158 px "Your prompts" positions are from the CLAUDE.md entry of 2026-11-10, measured by the orchestrator then, not by me).

The ruling "One country per prompt" is not reopened. The seven owner questions of arch section 14 are unanswered; this design ships each default and names the one place where it lives on the client.

---

## 1. The one thing

A client sees every place its questions are asked from, chosen once, and can narrow the dashboard to one or several of them; a client with one location sees what it sees today.

Everything else yields to two constraints: nothing tall is added above "Your prompts" on AI Visibility, and a one-location client gets no new control outside the Account page.

## 2. The 10-second test

Falsifiable statements, judged in headless Chrome by the orchestrator:

- **T1 (multi).** A first-time viewer of a client with three locations, landing on AI Visibility at 1440 x 900, can say within 10 seconds which locations exist and whether the numbers are for all of them or one, without opening anything. Evidence: the sidebar "Locations" block lists the three rows plus "All locations" in its collapsed state, and the page header badge reads the current scope.
- **T2 (single).** A viewer of a client with one location sees no "All locations" row, no location filter, no location badge on prompt rows, no "Split by location" control and no scope sentence on any insight page. The only visible difference from today is the sidebar label reading "Locations" instead of "Collection market" and an Account page section.
- **T3 (prompts reachable).** On AI Visibility the top of the "Your prompts" `section` moves by 0 px against the pre-build build for a one-location client, and by at most 20 px at 1440 and at most 44 px at 390 for a multi-location client (the scope sentence in the subtitle), Fix this closed.

Where the current design fails T1 today: the sidebar block is titled "Collection market" (`Layout.tsx:861`) and its Edit label says it is "Used for collections you start from this browser" (`Layout.tsx:872`), which after the build is false; the AI Visibility header badges (`AIVisibility.tsx:1606-1618`) render browser selections that no longer steer anything.

## 3. Shared rules for every surface

### 3.1 The one predicate

`isMulti = locations.length >= 2`, exported from `src/lib/locationsContext.tsx` as part of the context value. Every "hidden when one location" rule below reads this one boolean. It counts live rows only (the list never returns archived ones).

### 3.2 What a one-location client sees (hidden list)

| Surface | Shown when `isMulti` | Shown when one location |
|---|---|---|
| Sidebar collapsed | "All locations" row, up to 3 filter rows, "+N more", primary marker | one static line (flag, label) exactly as today, not a button |
| Sidebar expanded (Edit) | rows with prompt counts, archive, primary marker | the one row with its prompt count, no archive (it is the primary), Add location |
| Prompts page | location column badge, location filter, "Ask in" in Add form and AI Discover, edit-mode note | none of these; Add inserts with no `location_id` key (trigger fills the primary) |
| AI Visibility | scope badge(s), scope sentence, row location chip, "Split by location" | the single location badge (same shape as today's market badge) |
| Other insight pages | scope sentence in the subtitle, "Location not recorded" on old feed items | nothing new |
| Account | Locations section (list, add, archive, Make primary) | Locations section with the one primary row and Add location |
| Onboard | "Ask in" per prompt, prompt counter in location terms | "Other locations" empty block (always shown, it is how a second one is added), no "Ask in" |

### 3.3 Tokens only

Every colour below is a semantic class: `bg-canvas`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `border-line-2`, `border-edge`, `text-accent-ink`, `bg-accent-tint`, `bg-accent-strong`, `text-on-accent`, `text-neg`, `bg-neg-tint`, `text-warn`, `bg-warn-tint`, `shadow-raised`, `shadow-card`, `rounded-control` (8), `rounded-badge` (6), `rounded-card` (12). No `slate-*`, `brand-*`, `dark-*`, `white` class and no hex in any new element, including inside `Onboard.tsx` and `Account.tsx`, which still carry legacy classes around them. Violet appears only as: the primary action button (`bg-accent-strong`), a selected option or filter row (`bg-accent-tint`, `text-accent-ink`, a checked box in `bg-accent-strong`), and nothing else. "Primary location" is a neutral marker, never violet.

### 3.4 Type

Only these roles: `text-heading` (15/22, 600) for section titles, `text-body` (14/20) for rows and fields, `text-meta` (12/16, 500) for counts, helper lines and badges, `.label-caps` for the sidebar block title, `text-value` (20/28, 600) for the split table's rate only. Phone fields use `max-md:text-base` (16 px) as `Combobox` does. Weight never above 600.

### 3.5 Motion

No new animation. Hover and selection colour changes use the existing `transition-colors duration-[180ms] ease-out motion-reduce:transition-none`. Lists open and close instantly, like `Combobox`. `MultiCombobox.tsx`, `locationsContext.tsx` and `locations.ts` import nothing from `motion` or `framer-motion`, because `Layout.tsx` imports them. `Disclosure` is not used in the sidebar (it imports `Collapse`, not checked for a motion import; avoid it there). AI Visibility keeps its existing motion for the split table only through the existing `.reveal-row` class (CSS, frozen under reduced motion), job: guide the eye to the new rows when the split opens.

### 3.6 Focus, targets, live text

- Focus ring is the global `:focus-visible` (2 px `--accent-ink`, offset 2). Never removed.
- At 768 and up every control is at least 24 x 24; below 768 at least 44 x 44, by real height or by an `after:` inset where the visible control is smaller (the pattern of `IconButton`, `Chip`, `Layout.tsx:870`). Two extended hit areas never overlap.
- Each surface owns one polite live region (`<p className="sr-only" aria-live="polite">`) for confirmations and one inline error slot (`role="alert"`, `text-meta text-neg`) for failures. Errors never use `window.alert` or `window.confirm`.

### 3.7 Icons for a location

New exported component `LocationFlag` in `src/lib/locationsContext.tsx` (row 4 scope; `locations.ts` stays JSX free for node tests). Props: `{ marketId: string; size?: 12 | 16 }`. Known market with `flagCode !== 'un'`: `<img src="https://flagcdn.com/w20/<flagCode>.png" alt="" loading="lazy" className="w-4 h-auto rounded-sm flex-shrink-0">` (`w-3` at size 12). `WW`: `Globe2` from lucide, `text-ink-2`, aria-hidden. Unknown market id: `MapPin`, `text-ink-3`, aria-hidden. The flag is always decorative; the label carries the name.

### 3.8 Labels

Every rendered location name comes from `locationLabel(loc)` in `src/lib/locations.ts` (arch 7.1). Never compose a label in a page. Where width is short, truncate with CSS (`truncate`) and put the full label in `title`.

### 3.9 Error mapping, one table for every surface

Implemented once as `locationErrorMessage(status: number, code: string | undefined, ctx: { limit?: number; isAdmin: boolean }): string` in `src/lib/locations.ts` (pure, testable). Strings are in section 11.

| Response | Message key | Then |
|---|---|---|
| 400 `invalid_request` | E_INVALID_REQUEST | keep the form as typed |
| 400 `invalid_location` | E_INVALID_LOCATION | clear the region picker |
| 403 `location_limit_reached` | E_LIMIT (uses `limit`) | refetch the list |
| 409 `location_exists` | E_EXISTS | refetch the list |
| 409 `location_in_use` | E_IN_USE | refetch the list (counts may have changed) |
| 409 `location_is_primary` | E_IS_PRIMARY | none |
| 404 `not_found` | E_NOT_FOUND | refetch the list |
| 403 `forbidden` | E_FORBIDDEN | refetch the list |
| 500 `server_error`, any other 5xx, network failure, timeout | E_SAVE_FAILED | keep the form |
| 401 (no code) | E_SESSION | none |
| 403 with no code | E_NO_ACCESS | none |

The Prompts page insert errors (database trigger tokens, matched with `error.message.includes`): `location_archived` maps to E_PROMPT_LOC_ARCHIVED and refetches the list; `location_invalid` maps to E_PROMPT_LOC_INVALID and refetches; `prompt_cap_reached` keeps its current branch at `Prompts.tsx:289-295` unchanged.

### 3.10 Constants that hold an owner default on the client

| Owner Q | Client constant | Place | Default |
|---|---|---|---|
| 1 | `PLAN_LOCATION_LIMIT` (new export, read only for display; the server decides) | `src/lib/planConfig.ts` | arch 10 values |
| 3 | `VIEWERS_MAY_EDIT_LOCATIONS_UI = true` | `src/lib/locationsContext.tsx` | true; when false, Add and Archive are hidden for a viewer and one meta line E_VIEWER_READ_ONLY shows instead. The server's `VIEWER_MAY_EDIT_LOCATIONS` stays the gate; this only spares a viewer a 403. |
| 6 | `DEFAULT_VIEW = 'all'` | `src/lib/locationsContext.tsx` (arch 7.2) | all |
| none | `SIDEBAR_VISIBLE_LOCATIONS = 3`, `LOCATION_CHIP_MAX = 6` | `src/lib/locationsContext.tsx` | 3 and 6 |

---

## 4. MultiCombobox (`src/components/ui/MultiCombobox.tsx`, new)

### 4.1 Props

```ts
import type { ComboboxOption } from './Combobox'

export interface MultiComboboxProps {
  options: ComboboxOption[]                 // same shape as Combobox, same filter
  values: string[]                          // selected option values, in selection order
  onChange: (values: string[]) => void
  ariaLabel: string                         // required: names the input and the listbox
  id?: string
  placeholder?: string                      // shown only while no chip is selected
  size?: 'md' | 'sm'                        // md field min 40, sm field min 28
  placement?: 'bottom' | 'top'
  exclusiveValue?: string                   // 'ALL' for regions: choosing it clears the rest; choosing another clears it
  disabledReasons?: Record<string, string>  // value -> short reason; option shown, not selectable
  maxSelected?: number                      // when reached, unselected options become disabled with maxReason
  maxReason?: string
  emptyText?: string                        // default 'No match' (same as Combobox)
  invalid?: boolean                         // sets aria-invalid and the neg border
  describedBy?: string                      // id of a helper or error line
  className?: string
}
```

`Combobox.tsx` is not edited. `MultiCombobox` reuses `filterComboboxOptions` and `normalizeForSearch` from `comboboxFilter.ts` and copies the `scrollTop` effect of `Combobox.tsx:70-79` verbatim (never `scrollIntoView`). Export it from `src/components/ui/index.ts`.

### 4.2 Layout

```
+--------------------------------------------------------------+
| [Madrid x] [Barcelona x] [Valencia x] type to search...   v  |   field
+--------------------------------------------------------------+
+--------------------------------------------------------------+
| [ ] All regions                                              |   listbox
| [x] Barcelona                                                |
| [ ] Bilbao                              Already added        |   disabled with reason
| [x] Madrid                                                   |
+--------------------------------------------------------------+
```

- **Field** (the outer `div`, not the input): `relative flex flex-wrap items-center gap-1.5 w-full rounded-control bg-surface-2 border border-edge px-1.5 py-1 hover:border-line-2 transition-colors duration-[180ms] ease-out motion-reduce:transition-none`; `md`: `min-h-10`; `sm`: `min-h-7`; phone: `max-md:min-h-[44px] max-md:gap-y-3`. `focus-within` draws the ring on the field: `focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[rgb(var(--accent-ink))]`, and the input itself sets `outline-none` (the one place a child drops its own ring, because the field shows it). `invalid`: `border-neg`.
- **Chips** (selected values, in `values` order): each chip is one `button type="button"`, `relative inline-flex items-center gap-1 h-6 max-md:h-8 max-w-full px-2 rounded-badge bg-surface-3 ring-1 ring-inset ring-line-2 text-meta text-ink`, content: label `span.truncate` (max width `max-w-[12rem]`, full label in `title`), then `X` size 12 `text-ink-3` aria-hidden. Phone hit area: `max-md:after:absolute max-md:after:content-[''] max-md:after:inset-x-0 max-md:after:-inset-y-1.5` (32 + 12 = 44 high; no horizontal extension, so neighbours never overlap; `max-md:gap-y-3` keeps rows 12 apart) and `min-w-[44px]` below 768. On `sm` at 768 and up the chip is 20 high (`md:h-5`) so a 28 px field holds one row.
- **Input**: `flex-1 min-w-[6rem] bg-transparent border-0 text-ink placeholder:text-ink-3 outline-none`, `text-body` (`sm`: `text-xs` as `Combobox` sm), `max-md:text-base`, height `h-7` (`sm`: `h-5`), `max-md:min-h-[32px]`. The placeholder shows only while `values` is empty.
- **Chevron**: `ChevronDown` 16 (`sm`: 12), `text-ink-3`, `pointer-events-none`, `ml-auto` as the last flex item, aria-hidden.
- **Listbox**: identical box to `Combobox.tsx:235-238`: `absolute left-0 right-0 z-50 max-h-64 overflow-y-auto bg-surface border border-line-2 rounded-control shadow-raised`, `top-full mt-1` or `bottom-full mb-1`.
- **Option row**: `flex items-center gap-2 px-3 min-h-9 max-md:min-h-[44px] cursor-pointer text-body`; active: `bg-surface-2 text-ink`; idle: `text-ink-2`. Leading check box, 16 x 16, aria-hidden: unselected `rounded-[4px] border border-edge bg-surface`; selected `rounded-[4px] bg-accent-strong border border-accent-strong` holding `Check` 12 `text-on-accent`. Then the `icon` if given, then the label `flex-1 truncate`. Disabled: `cursor-not-allowed text-ink-3`, box `border-line-2`, the reason right aligned in `text-meta text-ink-3 shrink-0`.
- **Exclusive option** (`exclusiveValue`), when present in `options`, is rendered first, followed by a 1 px `border-t border-line` divider row (`role="presentation"`, `aria-hidden`), then the rest.
- **Count line** (only when `values.length > 3` and the list is closed): chips beyond the third collapse into one non-interactive `span` "+N" (`text-meta text-ink-2 px-1`), so a `sm` field in the sidebar stays one or two rows. Opening the list (focus) shows every chip again.

### 4.3 States

| State | Rendering |
|---|---|
| Empty selection | placeholder in the input; no chip |
| Selection | chips in order |
| Typing, no match | one `li role="option" aria-disabled="true" aria-selected="false"` with `emptyText` (as `Combobox.tsx:241`) |
| At `maxSelected` | every unselected option disabled with `maxReason`; selected options stay toggleable |
| Disabled option | listed, not toggleable, reason visible (not only in a tooltip, a phone has none) |
| `invalid` | `border-neg`, `aria-invalid="true"`, the caller renders the error line and passes its id in `describedBy` |
| Whole control disabled | not supported in release one; a caller that must block hides the control and shows the reason text instead |

### 4.4 Keyboard and pointer model

Focus order inside the control: each chip button in order, then the input. The listbox options are never tab stops (active descendant).

| Key or action | Where | Effect |
|---|---|---|
| Focus or click on input | input | open the list with every option; active option = first selected, else none; query empty |
| Type | input | filter (same ranking as `Combobox`); active = first match |
| ArrowDown / ArrowUp | input | open if closed; else move active, wrapping |
| Home / End | input, list open | first / last option |
| Enter | input, active option | toggle it; list stays open; query is KEPT (so "san" can toggle several matches); disabled option: nothing |
| Click or tap option | list | toggle; list stays open; focus stays in the input (`mousedown` preventDefault on the list, as `Combobox.tsx:234`) |
| Backspace | input, query empty, at least one chip | remove the last chip; announce it |
| Enter, Space, Backspace, Delete | chip | remove that chip; focus moves to the next chip, else the input |
| Escape | input, list open | close the list, clear the query, `preventDefault` and `e.nativeEvent.stopPropagation()` (the phone drawer stays open, as `Combobox.tsx:166-172`) |
| Escape | input, list closed | nothing, the event propagates (lets the drawer close) |
| Tab, blur | input | close, clear the query; NEVER commit typed text (selection already happened on toggle) |
| Exclusive rule | any toggle | toggling `exclusiveValue` on sets `values = [exclusiveValue]`; toggling any other value on removes `exclusiveValue`; removing the last value leaves `[]` (the caller decides whether empty is allowed) |

### 4.5 ARIA

- Input: `role="combobox"`, `aria-label={ariaLabel}`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` (the listbox id while open), `aria-activedescendant`, `aria-describedby` = the selection summary id plus `describedBy`, `aria-invalid` when invalid, `autoComplete="off"`, `spellCheck={false}`.
- Listbox: `role="listbox"`, `aria-multiselectable="true"`, `aria-label={ariaLabel}`.
- Option: `role="option"`, `aria-selected` true or false, `aria-disabled="true"` when disabled. The visible reason is inside the option, so it is read with it.
- Chips: wrapped in `ul role="list" aria-label={"Selected: " + ariaLabel}` with `li` per chip (`display: contents` is not used; the `ul` is `contents` free and simply `flex` inline with the input). Chip `aria-label` = "Remove " + label.
- Selection summary: `span id={summaryId} className="sr-only"` reading "N selected" (copy key MC_SELECTED_N) or "None selected".
- Live region: `sr-only aria-live="polite"` announcing "<label> added", "<label> removed", and, for the exclusive rule, "All regions replaces the regions you picked" (MC_EXCLUSIVE).

### 4.6 Phone

Same component; no bottom sheet in release one. `placement="top"` callers in the sidebar keep the list inside the drawer. Field and options reach 44 px; field text 16 px.

---

## 5. Sidebar "Locations" block (`Layout.tsx`, replaces `:856-958`)

Same `aside`, same position (after the client switcher or brand identity, before the bottom actions), same wrapper `px-3 py-3 border-t border-line space-y-2 flex-shrink-0`. Hidden in affiliate mode as today. Data: `useLocations()` from `locationsContext.tsx` (`locations`, `limit`, `used`, `isMulti`, `status`, `selected`, `setSelected`, `add`, `archive`, `refresh`). `useMarket()` is no longer read by this block.

### 5.1 Header row

- Left: `span.label-caps` "Locations" (LOC_TITLE). Literal string, not an i18n key, for the same reason as `Layout.tsx:860`.
- Right: the existing text button pattern of `Layout.tsx:868-876` kept exactly (classes, the `after:[inset:-14px_-8px]` hit area, the chevron) with text "Edit" / "Done", `aria-expanded`, and `aria-label` "Manage locations" / "Done managing locations" (LOC_EDIT_ARIA, LOC_DONE_ARIA). The "this browser" wording is gone.
- The Edit button is hidden while `status` is `loading` or `error`.

### 5.2 Collapsed, one location

One static line, unchanged from today's markup at `Layout.tsx:885-894` except the source: `div.flex items-center gap-2 px-1 py-1 text-sm text-ink-2` with `LocationFlag` and `locationLabel`. No button role, no marker, no count.

### 5.3 Collapsed, two or more locations (the view filter)

```
LOCATIONS                                   Edit v
[=] All locations                            12      <- selected when no filter
[ES] Spain                       *           5
[ES] Spain . Madrid                          4
[FR] France                                  3
    + 2 more
```

- Container: `div role="group" aria-label="Show results for"` (LOC_FILTER_GROUP), `space-y-0.5`.
- **Row** (one `button type="button"` each, `aria-pressed`): `relative flex items-center gap-2 w-full h-8 max-md:min-h-[44px] px-2 rounded-control text-body text-left transition-colors duration-[180ms] ease-out motion-reduce:transition-none`.
  - Idle: `text-ink-2 hover:bg-surface-2 hover:text-ink`.
  - Selected: `bg-accent-tint text-ink`, trailing `Check` 14 `text-accent-ink` aria-hidden in place of the count.
  - Content: `LocationFlag` (16), label `span.flex-1 min-w-0 truncate` with `title`, the primary marker, then the count `span.text-meta text-ink-3 tabular-nums` = `active_prompts`.
  - Primary marker: `Star` size 12, `text-ink-3`, aria-hidden, `title="Primary location"`, plus `span.sr-only` ", primary" (LOC_PRIMARY_SR) inside the button so the name reads "Spain, primary, 5 prompts".
  - Accessible name: label, primary suffix, then "N prompts" via an `sr-only` span (LOC_PROMPTS_N); the visible count is `aria-hidden`.
- **"All locations" row**: first, same row class, icon `Layers` 16 `text-ink-3`, label "All locations" (LOC_ALL), count = sum of `active_prompts`. `aria-pressed` is true when `selected` is empty.
- **Order**: All, then primary, then the list order the server returns (primary first, position, id).
- **Visible rows**: All plus the first `SIDEBAR_VISIBLE_LOCATIONS` (3) locations. If more exist, a fourth line `button type="button"` `h-8 max-md:min-h-[44px] px-2 text-meta text-ink-3 hover:text-ink-2` "+N more" (LOC_MORE_N) with `aria-expanded`; activating it shows every row and becomes "Show fewer" (LOC_FEWER). A selected location beyond the third is always shown (the visible set is the first three plus every selected one, in list order), so the current scope is never hidden.
- **Rows list height**: when expanded past 8 rows, the rows wrapper gets `max-h-[288px] overflow-y-auto` (8 x 36) so the nav above keeps its space; the wrapper is not `overflow-hidden` anywhere else.
- **Filter behaviour**: activating a location row while the filter is empty selects only that location; while a filter is active it toggles that location in or out; removing the last selected one returns to empty (All). Activating "All locations" clears the filter. The change applies at once (no Apply button) and is announced in the block's live region: "Showing Spain" / "Showing 2 locations" / "Showing all locations" (LOC_SHOWING_ONE, LOC_SHOWING_N, LOC_SHOWING_ALL).
- **Keyboard**: rows are ordinary buttons in tab order (Tab, Shift+Tab, Enter, Space). No roving tabindex: the list is short and a tab stop per row matches the nav above.
- **Phone drawer**: identical; rows 44 high; activating a row does NOT close the drawer (it is a filter, not navigation), so the user can pick several.

### 5.4 Expanded (Edit)

```
LOCATIONS                                   Done ^
+------------------------------------------------+
| [ES] Spain                 Primary   5 prompts |
+------------------------------------------------+
| [ES] Spain . Madrid                  4 prompts  x |
+------------------------------------------------+
| [FR] France                          0 prompts  x |
+------------------------------------------------+
[ Add location                                 v ]   <- Combobox sm, clearOnSelect, placement top
  3 of 5 locations on Growth
```

- **Rows wrapper**: `space-y-1`, with `max-h-[240px] overflow-y-auto` once there are more than 5 rows. The Add picker sits OUTSIDE this wrapper so its upward popup is never clipped.
- **Row**: `flex items-center gap-2 px-3 py-2 rounded-control bg-surface-2` (today's chip box at `Layout.tsx:904-906`), content: `LocationFlag` (16), label `span.flex-1 min-w-0 truncate text-sm text-ink-2` with `title`, then:
  - primary: `span.text-meta text-ink-3` "Primary" (LOC_PRIMARY), no archive control;
  - every row: `span.text-meta text-ink-3 tabular-nums whitespace-nowrap` "N prompts" (LOC_PROMPTS_N; "1 prompt" singular);
  - non-primary: archive button, the existing remove-button classes of `Layout.tsx:915` (`relative p-1.5 text-ink-3 hover:text-ink-2 ... max-md:after:[inset:-10px]`), icon `X` 12, `aria-label` "Archive <label>" (LOC_ARCHIVE_ARIA).
- **Archive with active prompts**: the button stays focusable with `aria-disabled="true"` and `text-ink-3 opacity-60 cursor-not-allowed` (no `disabled` attribute, so a keyboard or screen reader user can reach it and learn why). Activating it does not call the server; it shows under the row, in the block's error slot, E_ARCHIVE_HAS_PROMPTS ("Archive its N prompts first. Locations are only removed when empty."), and links "Open prompts" (LOC_OPEN_PROMPTS) to `/prompts`, which also sets the filter to that location.
- **Archive with 0 prompts**: one click archives (no confirm: an empty location holds no data and can be added again). Pending: the X becomes `Loader2` 12 `animate-spin motion-reduce:animate-none`, `aria-busy`. Success: row removed, focus moves to the next row's archive button, else the Add input; live region "Archived <label>" (LOC_ARCHIVED). If the removed location was in the view filter, it is dropped from the filter.
- **Add location**, step 1: `Combobox size="sm" placement="top" clearOnSelect`, `placeholder` "Add location" (LOC_ADD_PH), `ariaLabel` "Add a location" (LOC_ADD_ARIA), options = `buildMarketOptions(markets)` filtered to drop a market only when every one of its regions is already a live pair (a market with only ALL drops once ALL is live). Choosing a market:
  - whose `regions.length === 1` (ALL only): calls `add` with `region_ids: ['ALL']` at once; the input shows `Loader2` at its right in place of the chevron during the call (wrapper overlay `absolute right-2`), `aria-busy` on the field wrapper.
  - with more regions: shows step 2 directly under the picker.
- **Add location**, step 2 (inside a `div.rounded-control bg-surface-2 p-2 space-y-2`):
  - a meta line with `LocationFlag` and the market label;
  - `MultiCombobox size="sm" placement="top"`, `ariaLabel` "Regions of <market>" (LOC_REGIONS_ARIA), options `buildRegionOptions(market)`, `exclusiveValue="ALL"`, initial `values` = `['ALL']` when the ALL pair is not live, else `[]`, `disabledReasons` = every live region of this market mapped to "Added" (LOC_ALREADY_ADDED), `maxSelected` = for a viewer `min(25, limit - used)`, for an admin 25, `maxReason` "Limit reached" (LOC_LIMIT_SHORT);
  - a row `flex gap-2`: `Button variant="primary" size="sm"` "Add" (LOC_ADD_BTN, label "Add N" LOC_ADD_N_BTN when N > 1), disabled while `values` is empty, `loading` during the call; `Button variant="ghost" size="sm"` "Cancel" (LOC_CANCEL).
  - Success: step 2 closes, focus returns to the Add input, live region "Added N locations" (LOC_ADDED_N).
- **Counter line** under the picker: `p.text-meta text-ink-3 px-1` "U of L locations on <Plan>" (LOC_COUNT_OF), only for a viewer and only when `limit` is finite.
- **At the limit (viewer, `used >= limit`)**: the Add picker is not rendered. In its place one line `flex items-center justify-between gap-2 px-1`: `span.text-meta text-ink-2` "Location limit reached" (LOC_LIMIT_REACHED) and a `NavLink to="/account"` `text-meta text-accent-ink hover:underline underline-offset-2` "See plans" (LOC_SEE_PLANS) with the `after:` 44 px extension below 768. For a Free client (limit 1) the line is the same.
- **Admin at or over the limit**: the picker stays; the counter line reads "U of L on <Plan>. Admin can add more." (LOC_ADMIN_OVER) in `text-meta text-ink-3`.
- **Viewer when `VIEWERS_MAY_EDIT_LOCATIONS_UI` is false**: rows without archive buttons, no picker, one line E_VIEWER_READ_ONLY.
- **Demo mode**: picker and archive buttons hidden; one meta line "Not available in the demo" (LOC_DEMO). No network call.

### 5.5 Loading, error, empty

- **Loading** (first fetch for a client): the header row renders (title only), then two placeholder lines, each `div.h-8 flex items-center px-2` holding `SkeletonBlock` `h-3.5 w-full` and `h-3.5 w-2/3`. Same total height as two rows, so nothing jumps when one or two locations land.
- **Error**: one static line built from `activeClient.default_market_id` and `default_region_id` through `locationLabel` and `LocationFlag` (as 5.2), then `div.flex items-center gap-2 px-1`: `span.text-meta text-ink-3` "Could not load locations." (LOC_LOAD_FAILED) and a text button "Retry" (LOC_RETRY) `text-meta text-accent-ink` with the 44 px phone extension. The view filter is treated as All. Collection is unaffected (server resolved).
- **Empty list** (should not happen: `list` ensures a primary): render as Error.
- **Refetch after a client switch**: the block shows Loading again; the previous client's rows never render under the new client name.

### 5.6 Focus order (whole block)

Edit/Done, then (collapsed) All, location rows, "+N more"; or (expanded) each row's archive button, Add picker input, step 2 MultiCombobox chips and input, Add, Cancel, "See plans" link. Then the bottom actions as today.

---

## 6. Onboard wizard (`Onboard.tsx`, row 6, starts only after the other session's edits are committed)

The wizard keeps its steps (1 company, 2 aliases, 3 competitors, 4 prompts, 5 invite and submit, 6 collecting). New elements use semantic tokens even though the file around them still uses legacy classes; that visual seam is accepted for this build (recorded in section 13).

### 6.1 Step 1: "Primary location"

- Replace the "Default market" and "Default region" labels (`Onboard.tsx:272, 278`) by one `fieldset` with `legend` "Primary location" (ONB_PRIMARY_LEGEND, `text-meta text-ink-2 mb-1`), holding the two existing `Combobox` fields unchanged in props, labels "Country" (ONB_COUNTRY) and "Region" (ONB_REGION). Placeholders stay "Type to search markets" and "Type to search regions" (already live copy).
- The "Plan" select stays where it is. The market field moves out of the plan grid into the fieldset (grid: `grid grid-cols-1 sm:grid-cols-2 gap-3`, country left, region right; phone one column).
- The paragraph at `Onboard.tsx:282-286` is replaced by ONB_PRIMARY_HELP: "New prompts are asked from here unless you choose other locations."

### 6.2 Step 1: "Other locations"

Directly under the primary fieldset, a second `fieldset` legend "Other locations (optional)" (ONB_OTHER_LEGEND).

- **Picker**: `Combobox size="md" clearOnSelect`, `ariaLabel` "Add another location" (ONB_ADD_ARIA), placeholder "Add a country" (ONB_ADD_PH). Options: all markets, minus markets whose every region is already the primary or a listed pair.
- **Market with ALL only**: adds the pair `<market>:ALL` at once.
- **Market with regions**: opens the same step 2 block as the sidebar (5.4) at `md` size: `MultiCombobox size="md"`, `exclusiveValue="ALL"`, initial `['ALL']` unless ALL is the primary or listed, `disabledReasons` for the primary pair ("Primary", ONB_IS_PRIMARY) and listed pairs ("Added", LOC_ALREADY_ADDED), `maxSelected` 25; `Button primary size="sm"` "Add" and `ghost` "Cancel".
- **List of chosen pairs**: `ul role="list" aria-label="Other locations"` `space-y-1.5`; each `li` `flex items-center gap-2 h-10 px-3 rounded-control bg-surface-2 border border-line`: `LocationFlag`, `span.flex-1 truncate text-body text-ink`, `IconButton icon={X} label={"Remove " + label}` (32 visible, 44 on phone). Removing a pair also removes it from every prompt's "Ask in" (6.3); a prompt left with none falls back to the primary and the live region says "1 prompt moved to the primary location" (ONB_PROMPT_FALLBACK_N).
- **Empty**: `p.text-meta text-ink-3` "Only the primary location. Add more if this client sells in several places." (ONB_OTHER_EMPTY).
- **Counter and limit**: `p.text-meta text-ink-2 tabular-nums` "N of L locations on <Plan>" (ONB_LOC_COUNT) where N counts the primary, L = `PLAN_LOCATION_LIMIT[plan]`. Over L: the line turns `text-warn` and reads "N locations, above the L on <Plan>. Allowed because you are an admin; it is recorded." (ONB_LOC_OVER). Never blocks (the server passes admin with `p_limit = null`).
- **Changing the primary** to a pair already in the list removes it from the list and says so in the live region (ONB_PRIMARY_DEDUPED). This mirrors the server dedupe (arch 5.4 step 2) so the admin sees what will be stored.
- **Next** stays governed by the existing name and slug rules only.

### 6.3 Step 4: prompts with "Ask in"

When the wizard has one location (no other pairs), step 4 is unchanged. With two or more:

```
Initial prompts
[ e.g. Best catering companies in Bucharest        ] [Add]
Ask new prompts in: [All 5 locations v]                         <- default for the next prompt

1. Best family lawyer near me                                   x
   Ask in [Spain x][France x][Germany x] +2                     <- MultiCombobox sm
2. ...

12 prompts of 35 on Growth. 7 questions fit in all 5 locations.
```

- **Default for new prompts**: one `MultiCombobox size="sm"` labelled "Ask new prompts in" (ONB_ASK_NEW), over every chosen location (primary first, labelled with "(primary)"), initial value = every location (the owner's use case). It does not change prompts already in the list.
- **Prompt row**: replaces the `span` at `Onboard.tsx:373-376` with `li.rounded-control border border-line bg-surface-2 p-3 space-y-2`: line 1 `flex items-start gap-2` number `text-meta text-ink-3 tabular-nums`, text `text-body text-ink flex-1 min-w-0 break-words`, `IconButton X` "Remove prompt: <first 40 chars>"; line 2 `flex items-center gap-2`: `span.text-meta text-ink-2 shrink-0` "Ask in" (ONB_ASK_IN, also the `ariaLabel` "Ask this prompt in"), `MultiCombobox size="sm" className="flex-1 min-w-0"`.
- **Empty "Ask in"**: allowed while editing, but the field shows `invalid` and the line "Pick at least one location" (ONB_ASK_EMPTY, `text-meta text-neg`, id passed as `describedBy`); Next is disabled while any prompt has none.
- **Counter** (`p` with `aria-live="polite"`, `text-meta tabular-nums`): K = sum over prompts of their location count. Text "K prompts of CAP on <Plan>." (ONB_PROMPTS_OF) followed by "Q questions fit in all N locations." (ONB_FIT) with Q = `floor(CAP / N)`. CAP = `PLAN_PROMPTS[plan]` (display only; the server reads `plan_prompt_caps`). Below cap: `text-ink-2`. Above: `text-neg` plus a second line ONB_OVER_WHY "Each location of a question uses one prompt."
- **Over cap**: Next is disabled, and a checkbox appears under the counter: `label.flex items-start gap-2 text-meta text-ink-2` with a native `input type="checkbox"` (`h-4 w-4 accent-[rgb(var(--accent-strong))]`, 44 px label row on a phone) "Go over the plan limit for this client (admin, recorded)" (ONB_OVERRIDE). Ticked: Next enables and the payload carries `allow_over_cap: true`. Unticking or getting back under the cap clears it.
- **Payload**: when the wizard has no other locations, `prompts` stays `string[]` (today's shape). Otherwise every prompt is `{ text, location_keys }` with `'primary'` for the primary and `'MARKET:REGION'` for the others, in the order shown. `locations` is the list of 6.2 grouped by market: `{ market_id, region_ids }[]`.

### 6.4 Step 5 summary (no review step exists today)

The arch asks for a review step listing locations and prompts per location. The wizard has none; this design puts a read-only summary at the top of step 5, above the invite fields, only when the wizard has two or more locations:

- `section aria-labelledby` with `h3` "What will be created" (ONB_SUMMARY_TITLE, `text-heading text-ink`), then `ul` `max-h-48 overflow-y-auto space-y-1`: one `li.flex items-center gap-2 text-body text-ink-2` per location: `LocationFlag`, label, `span.ml-auto text-meta text-ink-3 tabular-nums` "N prompts". Then `p.text-meta text-ink-3` "K prompt rows in total." (ONB_SUMMARY_TOTAL).

### 6.5 Submit errors

The submit handler maps 400 `invalid_location` to ONB_ERR_LOCATION and 400 `prompt_cap_exceeded` to ONB_ERR_CAP, shown where today's submit error shows, then moves the user back to step 1 or step 4 respectively with focus on the step heading.

---

## 7. Prompts page (`Prompts.tsx`, row 5)

### 7.1 Location badge per row (only when `isMulti`)

- Desktop (`sm` and up): a column after the category badge: `span.hidden md:flex w-40 shrink-0 min-w-0` holding `Badge tone="neutral" className="max-w-full"` with `glyph={<LocationFlag size={12}/>}` and the label in `span.truncate` with `title`. Between `sm` and `md` the badge moves into the phone line below (the row would be too tight for two fixed columns).
- Phone and `sm`: in the existing badge line (`Prompts.tsx:619`), now `md:hidden mt-1 flex flex-wrap gap-1.5`, after the category badge.
- When the view filter selects exactly one location, the badge is hidden (redundant), and the page subtitle names it instead (7.3).
- A prompt whose `location_id` is null (only possible in demo) maps to the primary through `promptLocationId`.

### 7.2 Location filter

- The page uses the GLOBAL view filter from `locationsContext` (one source with the sidebar). Selecting Spain in the sidebar and opening Prompts shows Spain's prompts; changing it here changes the sidebar.
- `isMulti` and `locations.length <= LOCATION_CHIP_MAX` (6): a `ChipGroup label="Location"` (PR_LOC_FILTER) placed ABOVE the category ChipGroup: `Chip` "All" with the total count, then one `Chip` per location (label, count = active prompts in that location; no flag, `Chip` has no icon slot and its props are frozen). Selection behaviour exactly as the sidebar rows (5.3).
- More than 6 locations: in place of the chips, a `MultiCombobox size="md" className="w-full sm:w-80"`, `ariaLabel` "Show prompts from" (PR_LOC_FILTER_ARIA), placeholder "All locations" (LOC_ALL), values = selected ids; an empty value means All.
- Category counts and the category filter apply to the location-filtered list.

### 7.3 Subtitle and empty state

- With a filter on one location, the `PageHeader` subtitle (today `fmt(t.pr_titleCount)` when the meter is hidden) becomes "N prompts in <location>" (PR_COUNT_IN); with several, "N prompts in K locations" (PR_COUNT_IN_K). With the meter shown (subtitle hidden today), nothing changes.
- **Empty filtered location** (the location has 0 active prompts): in place of the list, the existing `EmptyState` inside `Card pad="feature"` with title "No prompts in <location> yet" (PR_EMPTY_LOC), body PR_EMPTY_LOC_BODY, and `Button variant="primary" icon={Plus}` "Add a prompt here" (PR_ADD_HERE) that opens the Add form with "Ask in" preset to that location.

### 7.4 Add form

```
+----------------------------------------------------------------+
| [ New prompt text ................................ ]  [v] [x]  |
| Ask in [Spain x]                                    v           |   only when isMulti
| Each location makes its own copy and uses one prompt of your plan.
+----------------------------------------------------------------+
```

- Inside the existing `Card` (`Prompts.tsx:553`), under the input, only when `isMulti`: `label` "Ask in" (PR_ASK_IN, `text-meta text-ink-2`, `htmlFor` the MultiCombobox id) and `MultiCombobox size="md"`, options = live locations (primary first, `icon` = `LocationFlag`, `keywords` = market id), initial value = the filtered locations if a filter is active, else the primary. Then the helper line PR_ASK_HELP replacing the category sentence (the category sentence moves to the `title` of the input, it is secondary).
- **Cap**: K = number of selected locations. A viewer with `remaining < K`: the MultiCombobox gets `maxSelected = remaining`, `maxReason` "Plan limit" (PR_PLAN_LIMIT_SHORT), and the helper line becomes "R prompts left on your plan." (PR_LEFT_N) in `text-warn`. An admin is not limited; when K exceeds remaining the helper reads "Goes over the plan limit. Allowed for admins." (PR_ADMIN_OVER).
- **Insert**: one `insert([...])` of K rows (arch 8), each with `location_id`; with one location (or no "Ask in" shown) the row carries no `location_id` key. On success: `refresh()` on `locationsContext` so sidebar counts update; the form clears and closes as today; live region "Added in K locations" (PR_ADDED_K) when K > 1.
- **Errors**: section 3.9 tokens; shown through the existing `showNotice` path (one `Notice` per route, `tone="neg"`).
- **Empty "Ask in"**: the Add IconButton is disabled; MultiCombobox `invalid` with "Pick at least one location" (ONB_ASK_EMPTY, shared key).

### 7.5 Edit and archive

- Edit mode (`Prompts.tsx:600-614`) cannot change location. When `isMulti`, a line under the input: `p.text-meta text-ink-3` "Asked in <location>. To move it, archive it and add it again." (PR_EDIT_LOC).
- Archive (viewer) and delete (admin) keep their current behaviour; after either, call `refresh()` on `locationsContext` (counts and the sidebar archive rule depend on it).

### 7.6 AI Discover

When `isMulti`, one `MultiCombobox size="sm"` "Ask suggestions in" (PR_DISCOVER_ASK) sits in the suggestions header row (`Prompts.tsx:506-513`), left of "Add all", default as 7.4. Each suggestion's add and "Add all" use it. "Add all" takes `floor(remaining / K)` suggestions for a viewer (replacing `.slice(0, remaining)` at `:320`). On a phone the header row wraps (`flex-wrap gap-2`), the MultiCombobox full width.

---

## 8. Account page: "Locations" section (`Account.tsx`, row 5)

### 8.1 Placement and frame

After "Plan & billing" (`Account.tsx:552`), before `McpAccessSection`. A `Card pad="feature"` (semantic tokens; the page's legacy `bg-dark-800` boxes are left alone) `className="mb-6"`, as `section aria-labelledby="acct-locations-h"`.

- Header: `SectionHeader level={2}` title "Locations" (ACCT_LOC_TITLE) with `count={used}`, description ACCT_LOC_DESC "Where your prompts are asked from. U of L on <Plan>." (the "U of L" part only when `limit` is finite). Shown to admin and viewer, in every case including one location.

### 8.2 List

`ul role="list"` with the `DataList` look (`divide-y divide-line rounded-card border border-line bg-surface`, but a plain `ul` because each row holds its own controls and an inline confirm). Row `li.min-h-[56px] px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2`:

- `LocationFlag` (16), label `span.text-body text-ink flex-1 min-w-0 truncate` with `title`;
- primary: `Badge tone="neutral"` "Primary" (LOC_PRIMARY);
- `span.text-meta text-ink-2 tabular-nums whitespace-nowrap` "N prompts";
- actions `div.flex items-center gap-1 shrink-0 ml-auto`:
  - admin, non-primary: `Button variant="tertiary" size="sm"` "Make primary" (ACCT_MAKE_PRIMARY), `aria-label` "Make <label> the primary location";
  - non-primary (admin, or viewer while `VIEWERS_MAY_EDIT_LOCATIONS_UI`): `IconButton icon={Archive}` label "Archive <label>"; with active prompts it is `aria-disabled` and activating it shows E_ARCHIVE_HAS_PROMPTS under the row plus a `Link` "Open prompts" to `/prompts` with the filter set to that location (same rule as 5.4).
- Phone: actions wrap to a second line, full row width, `justify-end`; the tertiary button reaches 44 px through `Button`'s own `max-md:min-h-[44px]`.

### 8.3 Make primary (admin only)

- Activating "Make primary" expands an inline confirm under that row (no modal): `div.w-full mt-1 rounded-control bg-surface-2 border border-line p-3 space-y-2`, `role="group" aria-labelledby` its text: `p.text-body text-ink` ACCT_PRIMARY_CONFIRM "New prompts will be asked from <label> by default. Existing prompts keep their location." then `flex gap-2`: `Button variant="primary" size="sm"` "Make primary" (ACCT_PRIMARY_GO, `loading` during the call) and `Button variant="ghost" size="sm"` "Cancel".
- Focus moves to the confirm's primary button when it opens. Escape or Cancel closes it and returns focus to the row's "Make primary". Only one confirm open at a time.
- Success: the list refetches (the server orders primary first), the confirm closes, focus moves to the new primary row (`tabIndex={-1}` on the `li`, focused once), live region "<label> is now the primary location" (ACCT_PRIMARY_DONE). `activeClient` defaults are refreshed through `clientContext` if it exposes a refresh; otherwise this is a known staleness until reload (recorded in 13).

### 8.4 Add location

Below the list, `div.mt-4 space-y-2`: the same two-step add as the sidebar (5.4) at `md` size: `Combobox size="md" clearOnSelect` labelled by a visible `label` "Add a location" (LOC_ADD_ARIA as visible text), then the region `MultiCombobox size="md"` block with Add and Cancel. Same limit rules: viewer at the limit sees in place of the picker `div.flex flex-wrap items-center gap-3` with `p.text-body text-ink-2` "Location limit reached on <Plan>." (ACCT_LIMIT) and `Button variant="secondary" size="sm"` "Upgrade" (ACCT_UPGRADE) calling the page's existing `upgradeTo` for the next tier in `displayedTiers`. Admin over the limit: the counter line LOC_ADMIN_OVER.

### 8.5 States

| State | Rendering |
|---|---|
| Loading | header renders, then two 56 px rows each with `SkeletonBlock h-4 w-1/2` |
| Error | `Notice tone="neg"` is NOT used (one Notice per route, and the page may need it); instead an inline `div.flex items-center gap-3 rounded-control border border-line p-3`: `AlertTriangle` 16 `text-warn`, `span.text-body text-ink` LOC_LOAD_FAILED, `Button variant="secondary" size="sm"` "Retry" |
| One location | the one primary row, no archive, no Make primary (it is the primary), Add location |
| Archived | never listed (the server returns live rows only); after archive the row leaves and the live region says LOC_ARCHIVED |
| Demo | list shown, Add, Archive and Make primary hidden, LOC_DEMO line |
| Mutation error | inline error slot under the section header, `role="alert"`, section 3.9 |

---

## 9. AI Visibility (`AIVisibility.tsx`, row 5)

### 9.1 Header scope badges (replace `:1606-1618`)

Rendered in `PageHeader`'s `badge` slot, which already sits on the h1 baseline, so no height is added on desktop.

- One location: one `Badge tone="neutral"` with `LocationFlag size={12}`, market id, and `span.text-ink-3` "· <region label>" unless ALL (today's exact look; the middle dot is today's character and is kept).
- Multi, no filter: one `Badge tone="neutral"` with `Layers` 11 aria-hidden and "All N locations" (AIV_SCOPE_ALL_N).
- Multi, filtered: one badge per selected location (flag + `locationLabel`, `max-w-[14rem] truncate`), at most 3, then a neutral badge "+N" (AIV_SCOPE_MORE_N).
- The badges sit inside the h1 (existing pattern), so the heading reads "AI Visibility All 4 locations". Each badge group is preceded by `span.sr-only` "Showing" (AIV_SCOPE_SR) for a clean accessible name.

### 9.2 Scope sentence

When `isMulti` and the filter is empty, the `PageHeader` `subtitle` gains one sentence after `t.aiv_subtitle`, same `p`: "Combined across N locations, weighted by prompt count." (SCOPE_COMBINED_N). With a filter: "Showing K of N locations." (SCOPE_FILTERED). The string comes from one pure helper `locationScopeLine(n, k)` in `src/lib/locations.ts`, so the four other insight pages (Overview, Brand Sentiment, Competitors, Mentions) append the same sentence to their own subtitles with no layout change. Recommendations is not touched (not in any row; it inherits the filtered snapshot only).

### 9.3 Location chip on prompt rows

When `isMulti` and the filter is not exactly one location: in the chip line of every row variant (narrow `:1438-1442`, wide appear `:1480-1489`, and the other two wide variants at `:1517` and around), after `categoryChip(prompt)`, a chip with the page's own `NEUTRAL_CHIP` classes plus `gap-1 max-w-[10rem]`: `LocationFlag size={12}`, `span.truncate` label, `title` full label. In the wide grid the chip line is `whitespace-nowrap`; the location chip truncates before the ratio chip does (`min-w-0` on the location chip, `shrink-0` stays on the ratio chip).

### 9.4 "Split by location"

- **Control**: only when `isMulti`. A `Button variant="secondary" size="sm"` with icon `Columns3` (lucide) "Split by location" (AIV_SPLIT), `aria-pressed={split}`, placed in the "Your prompts" toolbar (`:2271`) before Export CSV. Pressed: the button keeps `secondary` and adds `bg-accent-tint text-accent-ink border-accent-ink` (selection, a permitted violet use). Phone: full width in the column stack, 44 high via `Button`.
- **What it shows**: inside the "Your prompts" section, after the toolbar and before the legend and sections, a block `div.mb-4` with `h3.sr-only` "Results by location" (AIV_SPLIT_TITLE) and a real table using `tableClasses`:

| Column | Header (`th scope="col"`) | Cell |
|---|---|---|
| Location | "Location" | `button type="button"` `inline-flex items-center gap-2 text-body text-ink hover:underline underline-offset-2 min-h-[44px] md:min-h-0` with `LocationFlag`, label (truncate, `max-w-[16rem]`), primary marker as 5.3; `aria-label` "Show only <label>"; sets the filter to that location |
| Prompts | "Prompts" (right) | `tdRight`, active prompts |
| Mentioned | "Mentioned" (right) | `tdRight`, `text-value text-ink` rate as "42%", or `text-body text-ink-3` "Not checked yet" (AIV_NOT_CHECKED) when the location has no answered row |
| Bar | `th` with `span.sr-only` "Mention rate bar" | `hidden md:table-cell`, existing `Meter` (value = rate, aria-hidden, the number is in the previous cell), width 120 |

  - Rows: one per live location, list order. Reads `allRows` and `allActivePrompts` (arch 7.1), so all locations show even under a filter; a row in the current filter carries `bg-accent-tint` on the `tr` and a `Check` 12 `text-accent-ink` before the label, plus `aria-current="true"` on the row button.
  - Rate = the existing mention-rate definition from `metrics.ts` applied to that location's prompts; no new metric. Same rounding as the page's headline rate.
  - Rows animate in with `.reveal-row` and `--i` (CSS only, frozen under reduced motion). Job: guide the eye to the new rows.
- **Grouping**: while split is on, inside each existing result section (appear, not yet, unchecked) the rows are ordered by location (list order), then by the current sort within a location, and a group label row precedes each location's first row: `div.px-3 pt-3 pb-1 label-caps` with the location label (`role="presentation"` is not used; it is an `h4` styled `label-caps` so screen reader users can jump by heading). The location chip of 9.3 is hidden while grouping (the group label says it).
- **State**: local `useState(false)`, reset to off on client switch; not persisted.
- **Effect on prompt position**: none, because the block is inside "Your prompts", after its header.

### 9.5 Fix this

No layout change. Fix titles append " · <location>" when two active prompts share the same text (arch 7.4; copy key FIX_TITLE_LOC). Fix verdicts read `allRows`.

### 9.6 States

| State | Rendering |
|---|---|
| Loading locations | header badge slot renders nothing (no skeleton: it is inline in the h1 and its absence moves nothing); no split button until loaded |
| Locations error | page renders as one location (no scope line, no split), sidebar shows its own Retry |
| Filter selects a location with no prompts | existing "No prompts yet" empty state in "Your prompts", body AIV_EMPTY_LOC "No prompts in <location> yet." with action "Add prompts" to `/prompts` |
| Location with prompts but no answers yet | normal first-run states of the page apply under the filter |

### 9.7 Other insight pages (Overview, Brand Sentiment, Competitors, Mentions)

- Subtitle sentence per 9.2 when `isMulti`.
- Feeds that list individual answers (Mentions feed, Sentiment feed): each item gains a meta line part "Asked from <location>" (FEED_ASKED_FROM) from `asked_market_id` and `asked_region_id`, or "Location not recorded" (FEED_LOC_UNKNOWN) when null, only when `isMulti`. Placement: appended to the item's existing date or engine meta line, separated by the existing separator of that line; no new row.

---

## 10. Data legibility

- Counts are integers with `tabular-nums`; "1 prompt" singular, otherwise "N prompts".
- Rates: whole percent, same rounding helper as the page's headline; never a decimal in the split table.
- A location with zero answered rows shows "Not checked yet", never "0%".
- The split table is a table, not a chart: with 2 to 25 rows of one number each, a sorted list with a bar is the right form. No new chart.
- "All N locations" combines by prompt count (owner question 6 default); the scope sentence says so in words.

## 11. New user-facing strings (all "copy: pending bg-copy")

Builders put `{/* copy: pending bg-copy */}` beside each. Placeholders in angle brackets are filled by code. No dashes in any string.

| Key | Where | Draft text |
|---|---|---|
| LOC_TITLE | sidebar | Locations |
| LOC_EDIT_ARIA | sidebar | Manage locations |
| LOC_DONE_ARIA | sidebar | Done managing locations |
| LOC_FILTER_GROUP | sidebar | Show results for |
| LOC_ALL | sidebar, filters | All locations |
| LOC_PRIMARY | sidebar, account | Primary |
| LOC_PRIMARY_SR | sidebar | , primary |
| LOC_PROMPTS_N | sidebar, account | <n> prompts / 1 prompt |
| LOC_MORE_N | sidebar | + <n> more |
| LOC_FEWER | sidebar | Show fewer |
| LOC_SHOWING_ONE | live region | Showing <location> |
| LOC_SHOWING_N | live region | Showing <n> locations |
| LOC_SHOWING_ALL | live region | Showing all locations |
| LOC_ARCHIVE_ARIA | sidebar, account | Archive <location> |
| LOC_ARCHIVED | live region | Archived <location> |
| LOC_OPEN_PROMPTS | sidebar, account | Open prompts |
| LOC_ADD_PH | sidebar | Add location |
| LOC_ADD_ARIA | sidebar, account | Add a location |
| LOC_REGIONS_ARIA | add flow | Regions of <market> |
| LOC_ALREADY_ADDED | add flow | Added |
| LOC_LIMIT_SHORT | add flow | Limit reached |
| LOC_ADD_BTN | add flow | Add |
| LOC_ADD_N_BTN | add flow | Add <n> |
| LOC_CANCEL | add flow | Cancel |
| LOC_ADDED_N | live region | Added <n> locations / Added <location> |
| LOC_COUNT_OF | sidebar | <used> of <limit> locations on <plan> |
| LOC_LIMIT_REACHED | sidebar | Location limit reached |
| LOC_SEE_PLANS | sidebar | See plans |
| LOC_ADMIN_OVER | sidebar, account | <used> of <limit> on <plan>. Admin can add more. |
| LOC_DEMO | sidebar, account | Not available in the demo |
| LOC_LOAD_FAILED | sidebar, account | Could not load locations. |
| LOC_RETRY | sidebar, account | Retry |
| E_ARCHIVE_HAS_PROMPTS | sidebar, account | Archive its <n> prompts first. A location is removed only when it is empty. |
| E_VIEWER_READ_ONLY | sidebar, account | Ask your account admin to change locations. |
| E_INVALID_REQUEST | all | That request was not valid. Try again. |
| E_INVALID_LOCATION | all | That location is not in our list. |
| E_LIMIT | all | Your plan allows <limit> locations. |
| E_EXISTS | all | That location is already on the list. |
| E_IN_USE | all | Archive the prompts in this location first. |
| E_IS_PRIMARY | all | The primary location cannot be archived. |
| E_NOT_FOUND | all | That location no longer exists. The list is up to date now. |
| E_FORBIDDEN | all | Only an admin can do that. |
| E_SAVE_FAILED | all | Could not save. Try again. |
| E_SESSION | all | Your session ended. Sign in again. |
| E_NO_ACCESS | all | You do not have access to this account. |
| E_PROMPT_LOC_ARCHIVED | prompts | One of those locations was archived. Pick again. |
| E_PROMPT_LOC_INVALID | prompts | That location is not on this account. Pick again. |
| MC_SELECTED_N | MultiCombobox | <n> selected / None selected |
| MC_EXCLUSIVE | MultiCombobox | All regions replaces the regions you picked |
| ONB_PRIMARY_LEGEND | onboard | Primary location |
| ONB_COUNTRY | onboard | Country |
| ONB_REGION | onboard | Region |
| ONB_PRIMARY_HELP | onboard | New prompts are asked from here unless you choose other locations. |
| ONB_OTHER_LEGEND | onboard | Other locations (optional) |
| ONB_ADD_ARIA | onboard | Add another location |
| ONB_ADD_PH | onboard | Add a country |
| ONB_IS_PRIMARY | onboard | Primary |
| ONB_OTHER_EMPTY | onboard | Only the primary location. Add more if this client sells in several places. |
| ONB_LOC_COUNT | onboard | <n> of <limit> locations on <plan> |
| ONB_LOC_OVER | onboard | <n> locations, above the <limit> on <plan>. Allowed because you are an admin; it is recorded. |
| ONB_PRIMARY_DEDUPED | live region | <location> is the primary now, so it left the other locations |
| ONB_PROMPT_FALLBACK_N | live region | <n> prompts moved to the primary location |
| ONB_ASK_NEW | onboard | Ask new prompts in |
| ONB_ASK_IN | onboard, prompts | Ask in |
| ONB_ASK_EMPTY | onboard, prompts | Pick at least one location |
| ONB_PROMPTS_OF | onboard | <k> prompts of <cap> on <plan>. |
| ONB_FIT | onboard | <q> questions fit in all <n> locations. |
| ONB_OVER_WHY | onboard | Each location of a question uses one prompt. |
| ONB_OVERRIDE | onboard | Go over the plan limit for this client (admin, recorded) |
| ONB_SUMMARY_TITLE | onboard | What will be created |
| ONB_SUMMARY_TOTAL | onboard | <k> prompt rows in total. |
| ONB_ERR_LOCATION | onboard | One of the locations is not valid. Check step 1. |
| ONB_ERR_CAP | onboard | Too many prompts for this plan. Remove some or tick the override. |
| PR_LOC_FILTER | prompts | Location |
| PR_LOC_FILTER_ARIA | prompts | Show prompts from |
| PR_COUNT_IN | prompts | <n> prompts in <location> |
| PR_COUNT_IN_K | prompts | <n> prompts in <k> locations |
| PR_EMPTY_LOC | prompts | No prompts in <location> yet |
| PR_EMPTY_LOC_BODY | prompts | Add a question to see how AI answers it from this location. |
| PR_ADD_HERE | prompts | Add a prompt here |
| PR_ASK_IN | prompts | Ask in |
| PR_ASK_HELP | prompts | Each location makes its own copy and uses one prompt of your plan. |
| PR_PLAN_LIMIT_SHORT | prompts | Plan limit |
| PR_LEFT_N | prompts | <r> prompts left on your plan. |
| PR_ADMIN_OVER | prompts | Goes over the plan limit. Allowed for admins. |
| PR_ADDED_K | live region | Added in <k> locations |
| PR_EDIT_LOC | prompts | Asked in <location>. To move it, archive it and add it again. |
| PR_DISCOVER_ASK | prompts | Ask suggestions in |
| ACCT_LOC_TITLE | account | Locations |
| ACCT_LOC_DESC | account | Where your prompts are asked from. <used> of <limit> on <plan>. |
| ACCT_MAKE_PRIMARY | account | Make primary |
| ACCT_PRIMARY_CONFIRM | account | New prompts will be asked from <location> by default. Existing prompts keep their location. |
| ACCT_PRIMARY_GO | account | Make primary |
| ACCT_PRIMARY_DONE | live region | <location> is now the primary location |
| ACCT_LIMIT | account | Location limit reached on <plan>. |
| ACCT_UPGRADE | account | Upgrade |
| AIV_SCOPE_SR | AI Visibility | Showing |
| AIV_SCOPE_ALL_N | AI Visibility | All <n> locations |
| AIV_SCOPE_MORE_N | AI Visibility | + <n> |
| SCOPE_COMBINED_N | insight pages | Combined across <n> locations, weighted by prompt count. |
| SCOPE_FILTERED | insight pages | Showing <k> of <n> locations. |
| AIV_SPLIT | AI Visibility | Split by location |
| AIV_SPLIT_TITLE | AI Visibility | Results by location |
| AIV_NOT_CHECKED | AI Visibility | Not checked yet |
| AIV_EMPTY_LOC | AI Visibility | No prompts in <location> yet. |
| FIX_TITLE_LOC | AI Visibility | <fix title> · <location> |
| FEED_ASKED_FROM | Mentions, Sentiment | Asked from <location> |
| FEED_LOC_UNKNOWN | Mentions, Sentiment | Location not recorded |

## 12. Acceptance criteria (headless Chrome over CDP, demo mode unless stated)

**Measurement prerequisite.** Demo mode builds one synthetic location (arch 7.5), so multi-location states cannot be rendered in demo as specified. Two ways, the orchestrator picks one: (a) the 2026-11-11 method, a temporary, never committed harness that mounts `LocationsProvider` with a three-location fixture around the real components; or (b) a demo-only constant in `locationsContext.tsx`, read only when `isDemoMode` is true and the URL carries `?demo_locations=3`, building three synthetic locations (`WW/ALL` primary, `ES/ALL`, `FR/ALL`) with mock prompts spread across them. (b) touches shipping code; it is recorded as an open question, and (a) needs no code. Viewports: 1440 x 900, 1280 x 620, 1024 x 768, 390 x 844, 390 x 560. Both themes where colour is asserted.

| # | Criterion | How |
|---|---|---|
| AC-1 | No horizontal page scroll at 390, 1024, 1280, 1440 on `/`, `/ai-visibility`, `/prompts`, `/account`, and with the drawer open at 390 | `window.scrollTo(600,0)` then `scrollX === 0`; with the split on and with 25 locations in the fixture |
| AC-2 | One-location client: "Your prompts" `section` top on `/ai-visibility` equals the pre-build value at 1440 and 390 (tolerance 0 px), Fix this closed | `getBoundingClientRect().top + scrollY`, against a pre-build reading taken the same day |
| AC-3 | Multi-location client: the same top grows by at most 20 px at 1440 and 44 px at 390 versus the one-location reading | same |
| AC-4 | One-location client: zero elements match `[aria-label="Show results for"]`, `[aria-pressed][data-loc-filter]`, the split button, the location ChipGroup, and any element with the text "All locations" on `/ai-visibility` and `/prompts` | DOM query; builders add `data-loc-filter` on filter rows and `data-loc-split` on the split button for this test |
| AC-5 | Every interactive element added (filter rows, archive, add picker, MultiCombobox field, chips, options, Make primary, split button, split row buttons, "+N more", "See plans") has a hit box of at least 44 x 44 at 390 and at least 24 x 24 at 1440, counting the `::after` extension | `elementFromPoint` sampling at the four corners inset 1 px of the computed hit box; no two hit boxes overlap (pairwise rect intersection of extensions is empty) |
| AC-6 | MultiCombobox list opens inside the viewport at 1440 x 900, 1280 x 620, 390 x 844, 390 x 560 (sidebar `placement="top"`), every visible option is hittable | list rect within `innerWidth` and `innerHeight`; `elementFromPoint` at each option centre returns that option |
| AC-7 | Keyboard: in the sidebar region MultiCombobox, typing "ma" then Enter toggles Madrid and the list stays open (`aria-expanded="true"`), Backspace with empty query removes the last chip, Escape closes the list and the drawer stays open at 390 | CDP key events, read `aria-expanded`, chip count, drawer `inert` absent |
| AC-8 | After keyboard navigation through 20 options, no ancestor with `overflow: hidden` has `scrollTop` or `scrollLeft` other than 0 | walk ancestors of the list after ArrowDown x20 |
| AC-9 | Listbox has `aria-multiselectable="true"`; every option has `aria-selected`; a selected option reads `aria-selected="true"` | DOM |
| AC-10 | Choosing "All regions" leaves exactly one chip; choosing a city afterwards leaves exactly the city chip | DOM chip count |
| AC-11 | Archive control of a location with active prompts has `aria-disabled="true"`, is focusable (`tabIndex >= 0`), and activating it sends no request to `client-locations` | CDP network log empty for that action |
| AC-12 | Filter: activating the "Spain" row sets `aria-pressed="true"` on it and false on "All locations"; activating "All locations" resets every row to false | DOM |
| AC-13 | Sidebar collapsed with 6 locations shows exactly 4 rows plus "+2 more" (All plus 3) | DOM |
| AC-14 | Contrast, both themes, axe `color-contrast` and `non-text-contrast` 0 violations on the four routes with the sidebar expanded and a MultiCombobox open | axe in the page |
| AC-15 | The entry chunk contains no `motion-dom` and no `framer-motion` module that it did not contain before; entry size grows by under 8 kB raw | Vite build output read by the orchestrator (no build is run by any agent in this packet) |
| AC-16 | No raw colour class: `rg -n "(slate|brand|dark|violet|purple|white)-[0-9]" src/components/ui/MultiCombobox.tsx src/lib/locationsContext.tsx` returns 0, and the added lines of the five pages return 0 | ripgrep on the diff |
| AC-17 | Every added user-facing string sits beside a `copy: pending bg-copy` comment and contains no U+2013 or U+2014 | ripgrep with a positive control |
| AC-18 | Phone field text: computed `font-size` of every new input at 390 is 16 px | `getComputedStyle` |

Expected values in AC-2 and AC-3 are relative to a reading taken by the orchestrator; I measured nothing.

## 13. Accepted trade-offs and known limits

- New elements in `Onboard.tsx` and `Account.tsx` use semantic tokens while the surrounding legacy boxes do not; a small visual seam remains until those pages are migrated.
- "Make primary" may leave `activeClient.default_market_id` stale in memory until reload if `clientContext` has no refresh; nothing reads it for collection after this build, only the sidebar error fallback.
- The split table and the scope sentence describe the RPC's client-wide engine window limitation only implicitly; arch 7.2 records it.
- `Chip` has no icon slot and its props are frozen, so the Prompts page location chips carry no flag.

## 14. Reference frames

- Sidebar filter rows: Linear's sidebar views, borrowing a single click to scope, the count at the row's right, and selection by tint plus check, not by colour alone.
- MultiCombobox: Linear's label picker, borrowing toggle-and-stay-open with a typed filter and chips that never commit on blur.
- Split table: Stripe's per-segment table, borrowing one number per row with a bar beside it in place of a chart.
- Make primary inline confirm: Vercel's project settings, borrowing an inline confirm that states the consequence in one sentence.

## 15. Handoff packets

**Row 4, bg-app (Sonnet), parallel with row 3.** Write scope (from arch 12): `src/lib/locations.ts`, `src/lib/locationsContext.tsx`, `src/lib/marketContext.tsx`, `src/lib/collectionContext.tsx`, `src/lib/resultsContext.tsx`, `src/lib/planConfig.ts` (new export only), `src/lib/i18nContext.tsx`, `src/types/index.ts`, `src/components/ui/MultiCombobox.tsx`, `src/components/ui/index.ts`, `src/components/Layout.tsx`, `src/App.tsx`, `tests/locations_view.test.js`. This spec: sections 3, 4, 5, plus from 3.9 the helper `locationErrorMessage` and from 9.2 the helper `locationScopeLine` (both in `locations.ts`, both covered by `tests/locations_view.test.js`), and `LocationFlag`, `isMulti`, `VIEWERS_MAY_EDIT_LOCATIONS_UI`, `SIDEBAR_VISIBLE_LOCATIONS`, `LOCATION_CHIP_MAX`, `refresh()` in `locationsContext.tsx`.

**Row 5, bg-app (Sonnet).** Write scope: `src/pages/Prompts.tsx`, `src/pages/Account.tsx`, `src/pages/AIVisibility.tsx`, `src/pages/Competitors.tsx`, `src/pages/Mentions.tsx`, `src/pages/BrandSentiment.tsx`, `src/pages/Dashboard.tsx`, `src/lib/views/aiVisibilityView.ts`, `src/lib/views/competitorsView.ts`, `tests/views_a.test.js`. This spec: sections 7, 8, 9, 10.

**Row 6, bg-app (Sonnet), only after the other session's `Onboard.tsx` work is committed.** Write scope: `src/pages/Onboard.tsx`. This spec: section 6.

Every row: no git, no npm or build, `node tests/<own file>.test.js` and `node tests/ts_require_bundler.test.js` only; no dash characters; strings marked as in section 11.
