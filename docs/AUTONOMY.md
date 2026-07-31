# AUTONOMY.md — the operating constitution for the BrandGEO orchestrator loop

Authored 2026-07-30. Binding on every scheduled cycle and every agent a cycle
spawns. Where this file and `AGENT-OS.md` disagree, this file wins for anything
a LOOP does; `AGENT-OS.md` still governs manually-run waterfalls.

---

## 1. The ground-truth rule

**An item is not done until a command says so.**

Every roadmap item carries a `check:` line: one shell command that exits 0 when
the item is genuinely complete and non-zero when it is not. No item may be moved
to Done on the strength of an agent's report, a build passing, or a commit
existing.

This is not process for its own sake. It is the direct lesson of three failures
in a single evening on 2026-07-29/30:

- A vendor's own onboarding assistant stated the support widget was live. The
  config endpoint returned 404 at that exact moment.
- An agent (me) concluded the fault was a missing allowed-origin and told
  Constantin to go fix it in a vendor console. The real fault was a swapped app
  id in our own repo. The advice was confident, specific, and wrong.
- On 2026-07-29 an agent was dispatched to build an IndexNow fix **that already
  existed in the commit history**, because a prose backlog entry was believed
  over `git log`.

A loop that accepts self-reports does not stall when it is wrong. It reports
success and moves on, and the error is found weeks later by a customer. The
check command is the only thing standing between an autonomous loop and
confident, compounding false victories.

Corollary: **the first act of every cycle is to re-run the check commands of the
previous cycle's completed items.** Not the current work. The previous claims.
A check that passed once and fails now is the highest-priority item in the queue.

---

## 2. Authority

Granted durably by Constantin on 2026-07-30. An agent may do these WITHOUT
asking, in either window:

- Push code to `main` (this auto-deploys the marketing site via the cPanel
  webhook and the dashboard via Netlify)
- Upload to cPanel
- Apply Supabase migrations
- Write to Stripe: create prices, coupons, products
- Configure any other platform we already use

WITHHELD. An agent must stop and queue these for Constantin:

- **Spending money.** Triggering collection runs, or any action that bills LLM
  or SerpApi credit. Deliberately not granted; it was the one autonomy option
  left unticked.
- **Anything that exposes a secret.** Including printing an env var, committing
  a key, or moving a credential between systems.
- **Sending anything to a real customer.** Offers, invoices, payment links,
  quotes, marketing email. Creating the Stripe price is reversible; a customer
  paying against a wrong one is not. This line was added by the orchestrator,
  not requested, and stands until Constantin overrides it in writing.
- **Deleting customer data**, or any destructive action with no restore path.
- **Anything behind a login the agent does not already hold.** See §4.

Two standing constraints that are not authority questions:

- **Git is serialized.** One committer at a time across all sessions, per
  `rules/parallel-task-scoping.md`. Parallel agents must have disjoint write
  scopes AND must not run git; the orchestrator commits.
- **Every migration ships a down path**, or it is not night-safe.

---

## 3. Windows

Constantin monitors 07:00-20:00 his local time and is away outside that. There
is also a rolling 5-hour usage limit, so the night window exists partly to use
capacity that would otherwise be idle.

**NIGHT (20:00-07:00 local) — unattended.** Only items tagged `night-safe`.
An item is night-safe when all four hold:

1. It has a check command that fully determines success.
2. It is reversible by a single revert or a documented down path.
3. It touches no billing, no auth, no customer-visible copy, and no schema that
   customer data already depends on.
4. Its scope does not overlap any other item running in the same cycle.

If a night cycle finds itself wanting to do something not night-safe, it writes
the item to the day queue and moves on. It never escalates its own permissions.

**DAY (07:00-20:00 local) — monitored.** Everything else: billing, auth,
schema, public copy, anything customer-facing, and anything the night cycle
parked. Constantin is reachable, so an agent may ask.

Cron is UTC. **CONFIRMED 2026-07-31, and the earlier assumption was wrong by two
hours.** The machine reports `GMT Standard Time`, offset `+01:00` (BST), not
Europe/Bucharest UTC+3:

```
Get-Date -Format "yyyy-MM-dd HH:mm zzz"   ->  2026-07-31 10:15 +01:00
(Get-TimeZone).Id                         ->  GMT Standard Time
```

**So the night window is 19:00-06:00 UTC, not 17:00-04:00.** Every schedule in
`.claude/` was written against the wrong offset and has to be re-derived before
`brandgeo-night-cycle` is re-enabled, or the first two hours of each night cycle
run while Constantin is still monitoring and the last two run past his morning.
This is the same offset error that made cycle 1 believe 07:19 was evening.

Note the offset is read from the machine, which is on London time. If Constantin
is physically on a different clock, the machine is what cron follows regardless,
so re-derive from the machine and not from where he happens to be.

---

## 4. The human queue, and why the loop must never block

No agent can log into a vendor console, the Stripe dashboard, or the product
itself. On 2026-07-30 the orchestrator only reached the askmywebsiteai console
because Constantin handed over a logged-in Chrome, and even then the last step
was a control that does not exist in that product's UI.

So: an item that needs a human is not a blocked loop. It is moved to
`ROADMAP.md` under **NEEDS CONSTANTIN**, with the exact action and, where
possible, the check command he can run to confirm it worked. The cycle then
continues with the next item. A cycle that ends with "waiting for Constantin"
and nothing else attempted has failed.

---

## 5. What a cycle does, in order

1. Re-run check commands for everything marked Done in the last 3 cycles.
   Any regression goes to the top of the queue.
2. Read `ROADMAP.md`. Pick items valid for the current window.
3. Before building anything, run `git log -- <the files involved>`. The
   2026-07-29 wasted cycle happened because this step did not exist.
4. Spawn agents in parallel, disjoint write scopes, per `AGENT-OS.md` §1.
5. Verify each result with its check command. A failed check means the item is
   not done; record what the check actually printed, not a summary of it.
6. Commit serially. One agent's work per commit, message states the check
   command and its result.
7. Update `ROADMAP.md`: move items, append new findings, refresh NEEDS
   CONSTANTIN.
8. Append a short entry to `docs/loop-log.md`: cycle time, items attempted,
   checks passed, checks failed, anything queued for a human.

---

## 6. Reporting

Constantin reads one thing in the morning: the NEEDS CONSTANTIN section of
`ROADMAP.md`, plus the overnight entries in `loop-log.md`. Both must be
readable in under two minutes. If the loop cannot express a night's work that
briefly, it did too many things at once.

Report failures plainly and keep the evidence. A cycle that reports only
successes is not a good cycle, it is an unverified one.
