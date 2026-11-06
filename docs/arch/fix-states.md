# Fix states: mark as done, re-check, next fixes

Status: APPROVED by Constantin 2026-11-06 with all five defaults; BUILT; migration
`fix_states_2026_11_06` APPLIED and read back the same day. Review:
`docs/qa/fix-states-review-2026-11-06.md` (PASS WITH FINDINGS; M1, M2, L1 to L6
and I6 closed in the build before handover, see section 10).
Owner of the build: bg-backend (migration), bg-app (UI), bg-verify (review)

## 1. The problem, measured in the code

The Fix This hub on AI Visibility (`src/pages/AIVisibility.tsx`, `fixItems`,
around line 800) is rebuilt from `ai_results` on every page load and stored
nowhere. It can produce at most six kinds of item, the page shows the first
three, and the only control is "Copy fix". So a client who did the work sees
the same three cards until the underlying number moves, which for a
training-data engine like Claude can take months, and never learns whether
what they did helped.

## 2. A stable id for each fix

Each item gets a `fix_id` built from its kind plus the one parameter that
makes it distinct. Text, counts and percentages are NOT part of the id, so
the id survives reloads and new collections.

| Kind (today's title) | fix_id | Measured by (the fix's own metric) |
|---|---|---|
| Named in under 25% of answers on every engine / Not named on any engine | `visibility:all` | mention rate across all active engines |
| Not named / low on one engine (P0 MISSING) | `engine_missing:<engine>` | that engine's mention rate |
| Low visibility in an engine (P1 PARTIAL) | `engine_low:<engine>` | that engine's mention rate |
| Outranked by a competitor | `outranked:<competitor, lowercased and trimmed>` | head to head: of the answers naming the brand or that competitor, the share naming the brand (0 when neither is named) |
| Inconsistent cross-prompt coverage | `consistency` | `dimensions.consistency` |
| Improve ranking position | `ranking` | `dimensions.knowledge` |
| NEW, see section 6: not named for one prompt | `prompt_gap:<prompt_id>` | mention rate on that prompt across active engines |

`engine_missing` and `engine_low` are separate ids on purpose: a fix done at
MISSING that moves the engine to PARTIAL is a success, and the PARTIAL item
that then appears is a new, different job.

## 3. Storage: `public.fix_states`

One row per client and fix id. Absence of a row means the fix is open.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity PK | |
| `client_id` | int not null, FK `clients(id)` on delete cascade | |
| `fix_id` | text not null, CHECK length 1 to 200 | |
| `status` | text not null, CHECK in `open, done, verified, reopened, dismissed` | |
| `title` | text | what the card said when marked, for the record and for admins |
| `metric_key` | text | e.g. `engine_rate:claude`; null for a manual fix |
| `baseline_value` | numeric | the metric when marked done |
| `baseline_n` | int | how many answers the baseline rested on |
| `marked_at` | timestamptz | set by trigger when status becomes `done` or `dismissed` |
| `marked_by` | uuid | set by trigger to `auth.uid()`, never trusted from the browser |
| `checked_at` | timestamptz | when the verdict was taken |
| `check_value` | numeric | the metric at the verdict |
| `check_n` | int | answers the verdict rested on |
| `updated_at` | timestamptz | trigger |

UNIQUE (`client_id`, `fix_id`). Index on (`client_id`).

**RLS**, same pattern as `recommendations` (`db/supabase-recommendations-migration.sql`):
SELECT, INSERT and UPDATE each `is_admin() or client_id = get_my_client_id()`,
with the same expression as WITH CHECK on INSERT and UPDATE so a row can
never be written into or moved to another tenant. **No DELETE policy:** a
fix is reopened by setting `status = 'open'`, so the history of what a client
said they did is never lost. A BEFORE UPDATE trigger pins `client_id` and
`fix_id` to their old values and stamps `marked_by`, `marked_at` and
`updated_at` server side.

**No new Netlify function.** The browser writes through the anon key under
RLS, exactly as `Recommendations.tsx` already moves a recommendation's status.
That keeps the scale note at zero new invocations: one extra read per AI
Visibility load (rows for one client, a handful at most) and one write per
click or per verdict.

Accepted limit, stated so it is not rediscovered: because the browser writes
the baseline and the verdict, a client could in principle write a false
"verified" on their own account. It only misleads themselves, the raw
`ai_results` stay untouched, and admins see `baseline_value` and
`check_value` next to each other. A server-side verdict is the upgrade path
if this table ever feeds a customer report.

## 4. What "check the fix" means

1. **Mark as done** stores the fix's metric right now as the baseline
   (value and answer count) and `status = 'done'`.
2. The card moves to a **Done** list with the date and "We check this after
   your next collection".
3. **The verdict** is taken on page load, client side, from data already
   loaded (no extra query). It is taken only when at least 80 percent of the
   cells in the fix's scope (prompt x engine; the whole page for competitor
   and score fixes) have a successful answer checked after `marked_at` plus
   the wait in section 8, question 1, and the number is measured over those
   fresh cells only. 80, not 100, so one engine that keeps failing cannot
   hold a verdict back forever. Until then the card says which date it is
   waiting for. A fix whose prompt was deactivated or whose engine left the
   plan reads "no longer tracked" and offers no check. Rates are kept to one
   decimal so a single mention across more than 200 answers still counts.
   - Metric now is higher than the baseline by at least 10 points, or the
     brand went from 0 to any mention: **verified**. The card closes for good
     and reads "Verified 12 Nov: Claude 0% to 40%".
   - Otherwise: **reopened**. The card returns to the open list with
     "You marked this done on 6 Nov. After the collection on 13 Nov,
     Claude is still 0% (was 0%)." It can be marked done again, which takes a
     new baseline.
4. **Check now** runs the same verdict on demand. It never starts a
   collection (that costs money and has its own cooldown); when there is no
   newer data it says so and names the next collection date.
5. **Manual fixes**: anything without a measurable condition (today only the
   AI insights on Recommendations, see section 7) is final when marked done:
   no check, the card reads "Marked done 6 Nov, not measurable".
6. **Dismiss** hides a fix the client will not do. It sits in the Done list
   as "Dismissed" with **Restore**.

Every non-open card in the Done list has a **Reopen** control.

## 5. Next fixes when done ones leave room

The hub shows open and reopened items only, ordered as today (P0, P1, P2),
first three visible. Done, verified and dismissed items leave the top three,
so the fourth and later items move up. A collapsed "Done (N)" section under
the list holds the rest. When nothing is open, the hub says "All current
fixes are done" and points at the Done list, instead of disappearing.

## 6. New supply of fixes (proposed)

Today the hub can produce at most six items, so for most clients "next
fixes" would run out after one round. Proposed: one P2 item per prompt where
the brand is absent on every engine that answered, `prompt_gap:<prompt_id>`,
titled "Not named for: <prompt text>", with the fix "Publish a page that
answers this question directly, with your brand in the title and H1, and
link it from your main service page." Ordered by how many engines named a
competitor for that prompt (most contested first). These are measurable per
prompt and give a real backlog: a client with 20 prompts and 12 gaps has 12
concrete next jobs.

## 7. Recommendations page

`Recommendations.tsx` already persists AI insights with a status workflow
(`new`, `acknowledged`, `actioned`, `dismissed`) in `recommendations`, writable
by the client's own users. Those are free text with no metric, so they are
"manual" in this design and need no re-check. Proposed: leave that page
unchanged in this build. Its rule-based cards (`generateRecs`) overlap the hub
heavily; giving them done states would be a second, phase 2 change using the
same table with a `rec:` id prefix.

## 8. Open questions, with the default that applies if silent

1. **Wait before the verdict.** Search-grounded engines need days to re-crawl
   and Claude answers from training data, so a check the next morning will
   almost always reopen. Default: the verdict waits for the first collection
   at least **7 days** after marking done; Check now respects the same wait.
2. **Improvement threshold.** Default: **+10 points**, or any mention where
   there were none.
3. **Supply of new fixes (section 6).** Default: **build it**.
4. **Recommendations page.** Default: **unchanged** in this build.
5. **Who can mark.** Default: the client's own users (viewer) and admins,
   like recommendation status today.

## 9. Build and ship order

1. `db/supabase-fix-states-migration-2026-11-06.sql`, applied only on
   Constantin's go, read back (columns, CHECKs, 3 policies, no DELETE,
   trigger).
2. `src/lib/fixStates.ts` (id, metric, verdict, pure and unit-testable) plus
   the hub UI in `AIVisibility.tsx` and copy in `aiVisibilityCopy.ts`.
3. bg-verify: RLS probe as a real viewer (own rows only, cannot move a row,
   cannot spoof `marked_by`, cannot delete), verdict tests, regression on the
   hub.
4. `npm run build` exit 0, then one push with `BATCH_PUSH=1` on his word. The
   migration must be applied BEFORE the push, or the page's first write fails.

## 10. Review findings closed before handover (2026-11-06)

- M1: the verdict and every write check that rows and results belong to the
  client on screen (`resultsClientId`, `clientRef`, `row.client_id`), so an
  admin client switch can no longer write a verdict onto the wrong client.
- M2: the competitor metric is head to head and never borrows the overall
  rate, so before and after are always the same quantity.
- L1: rates keep one decimal. L3: `untracked` state. L4: focus moves to the
  hub toggle and a polite live region announces the move. L5: Check now
  carries the fix title in its accessible name. L6: the waiting text says the
  check runs on the first collection after the date, scheduled or by hand.
- I6: a verdict that matched no row re-reads the rows.
- Not changed, accepted: I1 (title and metric_key writable on the client's
  own row), I3 (one save at a time), I4, I5.
