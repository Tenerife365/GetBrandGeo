# 024: orchestrator to the next session (new subscription, same machine), status and pending list

Written 2026-09-10 because the subscription that ran sessions up to this date
expires within a day and was at its weekly limit. The next sessions run on a
different Claude account on the same Windows machine and the same repo. This
packet is the cold start. Read it, then `CLAUDE.md` CURRENT STATE (newest entry
first), then the memory index. Nothing in the conversation history of the old
account carries over; everything below does.

**Kickoff line for the first session on the new account:**

```
Read .claude/handoffs/024-bg-orchestrator-to-next-session-status-and-pending-2026-09-10.md and continue from its pending list, top item first.
```

## 0. What survives the account switch, and what does not

| Thing | Survives? | Where |
|---|---|---|
| This packet, `CLAUDE.md`, all `docs/`, `.claude/agents/`, `.claude/handoffs/` | yes, in git | repo root `C:\Users\const\Constantin Daniel Goane\BrandGEO` |
| Auto memory (about 50 one-fact files plus `MEMORY.md` index) | yes, it is keyed by Windows user and project path, not by Claude account | `C:\Users\const\.claude\projects\C--Users-const-Constantin-Daniel-Goane-BrandGEO\memory\` |
| Git-ignored outbound packs (they name real people) | yes, on disk only | `docs/growth/outbound/**`, `docs/growth/qa/**` |
| Stripe CLI login | on disk, but the stored key is DEAD (section 2) | `stripe config --list`, profile `talentwelove` |
| Session transcripts, workflow journals, scratchpad | no | not needed |
| MCP connectors (Supabase, Gmail, Netlify, Slack, etc.) | must be re-authorised on the new account | claude.ai connector settings |

If the memory directory turns out to be empty on the new account, the binding
rules are repeated in section 5 of this packet so nothing is lost.

## 1. The goal, in one paragraph

BrandGEO (`getbrandgeo.com`, app at `app.getbrandgeo.com`) is a GEO / AI
visibility SaaS: it fires commercial buyer prompts at ChatGPT, Gemini, Claude,
Perplexity and Google AI Mode and shows a client whether and how it is
mentioned. The product is built, deployed, reviewed and billing from a Spanish
Stripe account. **The problem is acquisition, not product.** Sprint 17
(2026-08-13 to 2026-09-03) closed with ONE new free subscriber and roughly
three organic free signups in total, Constantin's own network excluded. The
target that stands: revenue of EUR 2,900 MRR-equivalent (G1), 100 activated
free accounts (G2), three channels firing daily (G3), none met yet. The current
lever is a 30 day deals and affiliates campaign, 50% off monthly plans for
the first 3 months, one Stripe promotion code per venue across the top 50 deal,
coupon, affiliate and launch venues, starting with Uneed (`UNEED50`). The
delegation for that campaign is packet 023. In parallel, founder-led outbound
to 13 contacted prospects continues by hand, with automatic reply detection
built but not yet configured.

## 2. Where things stand on 2026-09-10 (measured, not remembered)

**Git.** `origin/main` is `1f99649`. Two local commits are NOT pushed:
`c8e2880` (the deal-code PowerShell script) and `0d27081` (packet 023 path
fix), plus whatever this packet's commit is. All docs and scripts, no
dashboard code, so a push spends no Netlify build (the `ignore` rule cancels
it). Ten dirty files belong to OTHER sessions and must never be swept into a
commit: `Revenue.tsx`, `_revenue.js`, `revenue-report.js`,
`unlock-audit-report.js`, `brandgeo/web/site.js`,
`db/supabase-prospect-channels-migration.sql`, `.claude/agents/gtm-outbound.md`,
`docs/growth/GTM-TEAM.md`, `docs/growth/channel-attribution-spec.md`,
`docs/growth/sprint17/loop-log.md`. Always commit by pathspec.

**Stripe, live account `acct_1Tzui063lspobjfO`.** Read back on 2026-09-08:

| Object | State |
|---|---|
| Growth PRO monthly link `plink_1TzvvK63lspobjfOp4kSb2Ab` | `allow_promotion_codes` is now TRUE (done) |
| Radar, Essentials, Growth monthly links | already accepted codes |
| All four annual links | do not accept codes, by design |
| Coupon `UNEED50` | NOT created |
| Promotion code `UNEED50` | NOT created (list shows only `BPRFREE` active and `LAUNCH10` inactive) |
| Stripe CLI key | DEAD: every call answers `The API key for profile "talentwelove" has expired`, even though `stripe config --list` still shows a key ending `khKm` with expiry 2026-12-07 |

History of the failure, so it is not re-diagnosed: the first CLI key
(`...coBN`, id `mk_1Tzv9K63lspobjfOLmk1vZ7W`) had read scopes only. Constantin
then logged the CLI in with a second key (`...khKm`, id
`mk_1UDWzh63lspobjfOOZCtwIMi`) that had Payment Links write but Coupons at
None, which is why the link flag landed and the coupon did not. He then set
Coupons, Promotion codes and Payment Links to Write, after which the CLI's key
was rejected outright, most likely rolled or deleted during the edit, or a
different key was edited. Agents cannot write to live Stripe at all (the
permission classifier refuses it), so every Stripe write is Constantin's.

**Reply handling / poller.** Code deployed (`poll-inbound-replies` answers
401 unauthenticated). The four `GMAIL_*` variables are NOT set in Netlify (a
probe returned `503 gmail not configured`). No `cron.job` entry exists, on
purpose. Order is fixed: variables, redeploy, then the `cron.schedule` in
`docs/arch/reply-handling.md` section 7.1 at minute 20. Constantin authorised
running that SQL once the first two are done.

**Outbound.** 13 prospects at `stage='contacted'`, 0 replies logged, follow-up
cards written 2026-09-03 in the git-ignored files under `docs/growth/outbound/`.
Wave 1 (touch 2) was due 2026-09-04 and wave 2 (touch 3, closes) 2026-09-11;
neither is confirmed sent. Batch 02 prep: 17 named prospects with zero contact
routes, resolver click list in `docs/growth/outbound/batch-02-prep-2026-09-03.md`.

**Known red, untouched:** `tests/package_provisioning.test.js` fails at HEAD
since the 2026-08-02 billing migration; 226 pre-existing em or en dash lines
in older comments and copy.

## 3. Pending list, in order

1. **Stripe key and the Uneed objects (Constantin, about five minutes).**
   Dashboard, Developers, API keys, Create restricted key named `deals-cli`:
   Coupons Write, Promotion codes Write, Payment Links Write, Products Read,
   Prices Read, everything else None. Then, in PowerShell at the repo root:
   ```
   stripe login --interactive --project-name=talentwelove
   ```
   paste the key at the prompt (never into chat), then
   ```
   .\scripts\stripe-deal-code.ps1 -Code UNEED50 -Channel uneed -CreateCoupon
   ```
   The link switch is omitted because that flag is already live. The agent
   then reads back `stripe coupons retrieve UNEED50 --live` and
   `stripe promotion_codes list --live` and only after that Constantin saves
   the Uneed deal form with "50% off monthly plans for 3 months", code
   `UNEED50`. Alternative if the CLI keeps failing: create the coupon (id
   `UNEED50`, 50%, repeating 3 months, applies to the four products) and the
   code (first-time customers, 100 redemptions, no expiry) in the Dashboard UI.
   Every later venue is one line: `.\scripts\stripe-deal-code.ps1 -Code <CODE>
   -Channel <venue>`.
2. **Push the docs commits.** From the repo root:
   ```
   $env:BATCH_PUSH=1; git push origin main
   ```
   No Netlify build results (docs and scripts only).
3. **Launch packet 023 stage A** in a fresh session:
   `Read .claude/handoffs/023-bg-orchestrator-to-gtm-lead-deals-and-affiliates-30-day-campaign.md and run stage A now.`
   Output: `docs/growth/deals/venues-2026-09-08.md`, the ranked 50 venues.
   Concurrency 2, no builds or browsers inside agents (32 GB RAM).
4. **Rulings owed by Constantin before stage D fills days 15 to 30** (packet
   023 section "open questions"): paid placement budget; lifetime deal
   marketplaces (recommended OUT); code expiry (currently none); whether the
   shared coupon id should be venue neutral before other codes hang off it
   (today the coupon id is `UNEED50` and every venue's code attaches to it).
5. **Poller credentials.** Constantin sets `GMAIL_CLIENT_ID`,
   `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER` in Netlify (site
   `d51674f3-9579-4208-8b1b-90fc16d64df4`), triggers a redeploy, confirms the
   function no longer answers 503 through the vault-keyed `net.http_post`
   probe, then the agent runs the section 7.1 `cron.schedule` (minute 20).
   Still unruled: the read-only Gmail scope reaches unrelated TalentWeLove
   mail.
6. **Outbound waves.** Gmail gate at the top of
   `docs/growth/outbound/sequence/followups-2026-09-03.md` (replies and
   mailer-daemon bounces on the 2026-08-16/17 sends), then wave 1 and wave 2,
   each touch logged on the Prospects page so `next_action_at` advances. Check
   whether the Lawcus and Vibefam LinkedIn invitations were accepted (decides
   6 of the 16 email cards).
7. **Batch 02 routes.** Click Find contact routes on the 17 named prospects,
   zero-score rows first. A site that redirects off its own domain yields no
   candidate and an `errors` entry; fix `prospects.domain`, never widen the
   guard.
8. **Stage C of packet 023** (product): C2 the `?promo=` deep link through
   `site.js` and `_terms_gate.js`, C3 promotions-admin wired to Stripe coupons
   with attribution in `client_events`, C4 the scoreboard. Dashboard code, so
   it spends Netlify builds: batch with anything else pending, max about two
   builds a day.
9. **Housekeeping, not urgent:** `tests/package_provisioning.test.js`
   (billing file, owed to `bg-backend` on Opus with `bg-verify`); the two
   August chips already closed; Revenue page work from the other session
   (about 805 lines, 65 em dashes to strip before it ships).

## 4. Where the detail lives

- `CLAUDE.md` CURRENT STATE, newest entry first, is the running record.
- `docs/AGENT-OS.md` is the constitution; agents in `.claude/agents/`.
- Deals campaign: packet 023 and `scripts/stripe-deal-code.ps1`.
- Reply handling: `docs/arch/reply-handling.md`,
  `docs/qa/reply-handling-fix-review-2026-09-03.md`.
- Sprint 17 record: `docs/growth/sprint17/`, `docs/audit/product-reaudit-2026-09-03.md`.
- Billing migration: `handoff-billing-2026-08-02.md`.

## 5. Binding rules (also in memory; repeated here in case memory is missing)

- No em or en dashes anywhere in output, code, docs or commits. Scan with
  `rg -n '\x{2014}|\x{2013}'` on the changed files and prove the pattern
  fires with a positive control. Never `grep -P` on Git Bash.
- Agents never send, post, submit, create accounts or credentials, or write
  to live Stripe. The last mile is Constantin. Hand him one exact
  copy-pasteable command per object, with ids resolved.
- Credential values (Stripe keys, `GMAIL_*`) never pass through chat.
- Never query Hunter, Apollo, RocketReach, Clearbit or Snov for contact
  routes (a database constraint enforces it on candidates).
- No real person's name, address or profile slug in any committed file. The
  repo is public. Name-scan staged files before every commit.
- Commit by pathspec only. Never `git reset --hard`. Git commands serialized,
  one session at a time. Dashboard pushes need `$env:BATCH_PUSH=1` and cost a
  Netlify build; about two builds a day platform wide.
- Never call an LLM API or trigger a collection or audit from an agent.
- Workflow concurrency 2, no builds or browsers inside agents; the machine
  has 32 GB RAM and no GPU.
- Stripe CLI: `--live` on every command; the CLI defaults to test mode.
- Poller deploy order: env vars, redeploy, then `pg_cron`, never reversed.
- Judge a Netlify deploy by `published_deploy.commit_ref` or a unique string
  in the live bundle, never by a local `dist/` hash.
- Cheaper tiers when they will do: builders on Sonnet, reviewers on Opus,
  the top tier only for auth, billing, RLS or race verification.
- Session-only crons do not survive an idle desktop session; hand over the
  script path instead of promising a timed follow-up.
