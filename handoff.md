# Handoff — 2026-08-01

Written at the end of a long session. Everything below was verified against the
repo, the live Drive, or DNS at the time of writing, not recalled. Where a claim
could not be checked, it says so.

---

## 1) Goal

Three threads ran in this session, in this order of priority:

1. **Publish six content articles** (BG-020 and BG-022 through BG-025) to
   getbrandgeo.com via the free cPanel pipeline.
2. **Send the free-plan update email** to Ai Fy (client 26, the only live free
   account), BCC Constantin, telling them the free tier moved from ChatGPT to
   Gemini and introducing the new Radar tier at EUR 29.
3. **Get social and campaign media out of the git repo and onto a shared Google
   Drive**, in a structure that cofounders can browse and a future auto-poster
   can read.

A binding constraint landed mid-session and now governs everything:
**AUTONOMY section 7, the credit economy.** Dashboard work is committed per task
but pushed once per work block, target 2 Netlify builds per day across all
sessions. Per-change deploys had burned 2-3k credits in a day.

### Track B, a second session ran in parallel

Everything below marked **Track B** is a different workstream that shared the
repo and the same day. Its three goals:

1. **Close the dashboard UI/UX audit** (`docs/qa/dashboard-uiux-audit-2026-07-30.md`),
   then run a discovery pass for what that audit missed.
2. **Make the campaign package postable.** Constantin had already posted the
   first item on each channel and found they carried the **retired logo**, so
   everything from that point on had to be correct.
3. **Unblock the long-form YouTube video**, which had a script but no pipeline.

The two tracks touched almost disjoint paths. Where they collided it is recorded
in section 5.

---

## 2) Current state

- `origin/main` is `a988fec`. Local `main` is **0 ahead, 0 behind**. Nothing is
  waiting to push.
- **Netlify builds spent today: 2 of 2.** The second was the batch push
  `d99b722`, which carried four commits including a held dashboard test.
- **Uncommitted:** `docs/growth/voice/RECORDING-KIT.md` (modified, another
  session's) and `scripts/migrate_social_to_drive.py` (untracked, mine, see
  Next steps).

**Articles: DONE.** BG-020 and BG-022 through BG-026 are on `origin/main` and in
`brandgeo/web/`. cPanel picks them up from the GitHub webhook.

**Email: NOT SENT.** Blocked on one thing only, see Next steps. Ai Fy has not
been contacted.

**Drive: DONE for the July 30 batch.** `G:\My Drive\BrandGEO Social Media`
holds 77 posts, 294 files, 146 MB, in `1-Pending\July-30-2026-launch-week\`.

**Radar landing-page audit: BUILT AND DEPLOYED.** Radar and Essentials now get a
1-page AI SEO crawl of the landing page specifically.

### Track B

**Dashboard: DONE.** Every audit finding closed. Final sweep across 11 routes x 2
themes x 3 widths (320, 375, 1440): **0 contrast failures, 0 rendered dashes, 0
overflow measured on `<main>`**. `tsc` 0, build 0. A separate discovery pass
found three HIGH defects, all fixed: the skip link shifted the whole shell 137px
the moment it was focused (first Tab stop on every route), the closed off-canvas
sidebar kept **17 controls in the tab order** below 768px, and a route change was
announced to assistive technology by nothing at all.

**Campaign: POSTABLE.** Correct v3 logo on every asset, wordmark now in real
Geist. All 226 assets have a `.txt` sidecar under the same filename holding only
the copy to paste. Ready now: X, LinkedIn, GBP, Instagram feed/reels/stories,
Facebook feed/video/link, TikTok, YouTube Shorts, bilingual.

**Video: PIPELINE EXISTS.** Remotion installed and rendering. 29 compositions
render clean, 4 vertical pillars plus 25 long-form cards covering 26 of 34 shots.

**Blocked on Constantin only:** 8 screen recordings, one voice take, Threads
account setup, 18 profile and banner uploads.

---

## 3) Active files

| File | Why it matters |
|---|---|
| `scripts/send-free-plan-update.js` | Sends the Ai Fy email. Runs LOCALLY, needs no deploy. Reads `RESEND_API_KEY` from `brandgeo-dashboard/.env`. |
| `brandgeo-dashboard/netlify/functions/_email.js` | Shared Resend wrapper. Now supports `bcc`, `secondaryCta`, a signature block, and returns Resend's message id. |
| `brandgeo-dashboard/.env` | **Gitignored.** Where `RESEND_API_KEY` must go. |
| `.githooks/pre-push` | Blocks any push containing `brandgeo-dashboard/` files unless `BATCH_PUSH=1`. Mode 100755, armed. |
| `scripts/deploy-status.ps1` | Answers "does pushing now cost a build?" Use this one, not the `.sh`. |
| `scripts/migrate_social_to_drive.py` | Copies finished posts from the repo to the Drive. **Untracked.** |
| `brandgeo-dashboard/src/lib/planConfig.ts` | Source of truth for the plan ladder. `PLAN_SEO_PAGE_CAP` and `FEATURE_MIN_PLAN` changed here. |
| `brandgeo-dashboard/netlify/functions/_seo_crawl.js` | Crawl queue now seeds the homepage first. |
| `.gitignore` | Now excludes `docs/growth/CAMPAIGN-*/`, `docs/growth/reel-campaign-ab/`, `assets/audio/music/`. |

### Track B

**Read these first**

| File | Why it matters |
|---|---|
| `docs/growth/CAMPAIGN-2026-07-30/youtube/longform/CONSTANTIN-CAPTURE-AND-VOICE.md` | The two things only he can do. OBS setup, all 8 captures, what is fixable in post, and the voice session. |
| `docs/growth/voice/RECORDING-KIT.md` | The clone script, sections A to E. **§3b added 2026-08-01** for his studio mic and the Windows setup. Currently the one uncommitted file. |
| `docs/qa/dashboard-discovery-2026-07-31.md` | D1 to D10. D6 and D8 are still open and need a decision, not a patch. |
| `docs/qa/dashboard-uiux-audit-2026-07-30.md` | The original audit, plus four corrections to my own measurements. |

**Built this session**

- `brandgeo-video/` — Remotion project. `src/longform/cards.tsx` holds the 25
  long-form cards, `tools/` holds four checkers with their negative controls.
- `docs/growth/brand-assets-v3-2026-07-31/` — 18 profile and banner files, README
  gives the exact upload target per platform.
- `docs/growth/CAMPAIGN-2026-07-30/threads/SETUP.md` — 17 numbered steps.

**Do not touch**

- `docs/growth/brand-kit-2026-07-29/` — holds the RETIRED mark. Kept
  deliberately as the "before" record of the rebrand.
- `docs/growth/reel-campaign-ab/bilingual/` — 24 originals with the retired logo
  burned into their pixels, filenames identical to the corrected copies. See
  `RETIRED-LOGO-WARNING.md` in that folder before copying anything out of it.

---

## 4) Changes made

**Articles (`c0a8d1e`, pushed).** `bg-025-publish` was 226 commits behind and its
push was correctly rejected: the branch predated `bg-018.html`, so pushing its
tip would have **deleted a live article**. Merged instead. Found a hard
collision: `BG-021` was already taken by `bg-021-retrieval-not-engine-count.html`
(the Grok launch piece) with its own `bg-021-hero.png`. The branch's BG-021 was a
different article with a same-named hero. **Renumbered to BG-026** throughout.
`blog.html` and `sitemap.xml` were rebuilt from main's copies plus the six new
entries rather than hand-merged, because a mis-resolved hunk in an interleaved
card list silently drops live articles.

**Radar landing-page audit (`7d9ca14`, deployed).** `PLAN_SEO_PAGE_CAP` radar and
essentials to 1, `FEATURE_MIN_PLAN.ai_seo` from `growth` to `radar`. Essentials
moved too because radar 1 with essentials 0 is a ladder inversion (EUR 29 gets
what EUR 99 does not). **The number alone would not have delivered the ruling:**
`_seo_crawl.js` reads the client's sitemap and takes the first N URLs, so
`max_pages = 1` meant "whatever the sitemap lists first". The queue now seeds the
homepage. Also caught one commit from going live: `seo-draft.js` had
`essentials: 2` drafts against planConfig's 0, harmless only while the feature
gate was shut. Lowering the gate would have shipped two free LLM drafts a month.

**Email plumbing (`3968508`, `a8c01a3`, deployed).** `bcc`, `secondaryCta`, a
signature with photo and two buttons, and a local sender script. Then hardened:
the key check runs first and prints a boxed `NOTHING WAS SENT`, the key is read
from `.env`, and `--status <id>` traces a send.

**Batching enforcement (`9b935b0`, `7b65dca`, pushed).** `.githooks/pre-push`
plus `deploy-status.ps1`.

**Media out of the repo (`833ca45`, `d99b722`, pushed).** 616 files untracked,
all kept on disk. 551 MB of renders plus the 192 PNGs and briefs. Scanned first:
no credential-shaped strings in any of the 836 files, `.mcp.json` carries no key.

**Drive migration (run, not yet committed).** 77 posts. Silent variants dropped,
carousels collapsed to one post, threads collapsed to one post with
`thread_parts`, YouTube thumbnails attached to their shorts, GBP
name/category/price became `fields{}`. 314 build-system files skipped.

### Track B

**Dashboard, 3 commits, pushed.** AI Social made admin-only on the server: seven
of eleven `social-*.js` functions had no admin check at all, so any authenticated
viewer could call them for any client they could authenticate for. `social-image`
wrote arbitrary PNGs into a **public** bucket unmetered, `social-delete` removed
an already-published post from a live network. Then keyboard navigation, focus
management, 320px overflow, and text nobody could read.

**Marketing site (`49a13f4`).** `index.html` claimed five AI engines in four
places, two meta tags and two JSON-LD blocks. The product monitors seven.
Corrected to "up to seven", JSON-LD re-validated. The 34 city research pages were
deliberately left alone: their engine lists are dated MEASUREMENTS, and rewriting
them to today's lineup would falsify the record.

**Logo, root cause found.** `_shared/BRIEF.md` told every renderer to take the
logo from `brand-kit-2026-07-29`, a folder dated inside rebrand week that holds
the RETIRED art (its own source file is named `mark-eye.png`, and the eye is the
retired mark's defining feature). 104 files re-rendered. The package had been
internally inconsistent and nobody had noticed: TikTok and Instagram Reels
already carried the correct mark while the bilingual cuts did not.

**Geist installed (`1593ae7`).** From the official `geist@1.7.2` package, Vercel,
SIL OFL 1.1. The wordmark had been silently falling back to Inter everywhere.

**Remotion installed.** The first render immediately exposed a stale plan ladder:
Free showed ChatGPT (now Gemini) and Radar was missing entirely. Four
compositions had been written 2026-07-29 and never rendered, because Remotion was
never installed. They were specs pretending to be assets.

**End card (`771e816`).** The EUR 29 versus EUR 39 question resolved as
**neither**. Both expire, the video does not. It reads "Free tier available." and
the narration loses one sentence, permanently.

**Four false notices corrected (`9590584`)**, each of which had already misled
someone: the growth skill's arithmetically impossible Threads word target, a
migration header saying NOT YET APPLIED when it had been applied, the v3 SVG
saying Geist was missing, and a new warning on the contaminated bilingual
originals.

---

## 5) Failed attempts

**`git reset --hard` destroyed another session's work.** Trying to reorder two
commits so a free push would not drag a dashboard test along, I reset to an
absolute sha. In the seconds between reading the log and running it, another
session committed `a21064c` and `771e816`. **The reset destroyed both and deleted
615 files from disk.** Recovered from reflog and
`git checkout <sha> -- <path>` + `git restore --staged`. The saving at stake was
one Netlify build. **Never use `reset --hard` or reorder commits in this repo.**
Push a specific sha instead: `git push origin <sha>:main`. Recorded in memory as
`never-reset-hard-parallel-sessions`.

**An hour was spent diagnosing an email that was never sent.** `--send` printed
"RESEND_API_KEY is not set" quietly, below its own to/bcc/subject banner, and
exited 1. That read like success. I then built DNS theories about spam filtering
and BCC misrouting for a message that never left the machine. **Never treat "the
command returned well" as evidence; ask for the last line of output.** The script
now fails loudly.

**Checking for my own commits by sha after a rebase gave a false negative.**
`pull --rebase` rewrites every sha, so `git merge-base --is-ancestor <old-sha>`
returned false for work that was fully present. It read as seven lost commits.
Verify by content: `git show origin/main:<path> | grep -q "<marker>"`.

**Two structural claims I made about the campaign content were wrong**, and
Constantin agreed to a plan built on them before the data was checked:
- I said the nine timestamped reel runs were variants. **They are nine different
  posts** with nine distinct arguments. Keeping only the last would have
  destroyed eight.
- I said the campaign split into four topic campaigns. **The channels do not
  share topics at all** (Instagram has four, Facebook four completely different,
  Threads four more). It migrated as one legacy campaign instead.

**The pre-push hook shipped disarmed.** `chmod +x` does not reach the git index
on Windows; the blob went in at 100644 and git skips a hook it cannot execute,
silently. The first push after install appeared to pass the check and never ran
it. Fixed with `git update-index --chmod=+x`.

**`deploy-status.sh` could not run where it was needed.** Written as POSIX sh for
a machine whose shell is PowerShell, where `sh` is not a command. Hence the
`.ps1`.

### Track B

Recorded because every one of these looked like a pass.

**My overflow checker measured the wrong element.** It read
`documentElement.scrollWidth`. The scroll container is `<main>`, which carries
`overflow-x: auto`. The negative control injected a 3000px child into `body`, so
it went red and green exactly on cue while being structurally incapable of
seeing the real case. **A negative control only proves a checker catches the
defect you thought to inject.** Re-measured on `<main>`, it then found a real
375px overflow on `/recommendations` that this session had itself introduced.

**My contrast census scored `sr-only` text.** It flagged 1.03:1 on text clipped
to `rect(0,0,0,0)` that is never painted. The size test rejected anything under
1px, and `1 < 1` is false.

**A skip-link test that proved nothing.** Focused and unfocused geometry came
back byte-identical, which reads as "no shift, fixed". In fact
`document.hasFocus()` is false in this browser pane, so `:focus` never matched
and neither competing rule ever applied. Proven at the cascade level instead.

**I gave three agents a wrong discriminator.** "The v3 violet ramp has R>=G"
fails on v3's own `#6366F1` stop, which gives G-R of +3. Corrected to a +3
envelope: worst v3 pixel +3, mildest retired blue +34.

**I told an agent Radar was not in the code.** It had shipped in `f71a9b1`
earlier the same day, a commit I had read in the log and failed to connect. The
agent checked source rather than trusting the brief, and caught it.

**Same failure class inside the agents' own work:** a checker exempting 19
sidecars from the only limit that applied to them, a bare JSX comment rendering
as eight lines of visible source code with `tsc` clean and exit 0, and a
negative-control injection pointing at a font file commented "does not exist"
until I installed Geist and silently turned it into a no-op. Its words: *"It had
not started passing, it had stopped testing."*

**Cross-track collision.** Track A's `git reset --hard` destroyed `a21064c` and
`771e816` seconds after they were committed here. Both recovered from reflog.
See Track A's account above; the rule is in memory as
`never-reset-hard-parallel-sessions`.

---

## 6) Next steps

**BLOCKING, and it is one line.**

1. Copy `RESEND_API_KEY` from Netlify (Site configuration, Environment
   variables) into `brandgeo-dashboard/.env`:
   ```
   RESEND_API_KEY=re_your_value_here
   ```
   That file is gitignored, verified. Then:
   ```
   node scripts/send-free-plan-update.js --self-test
   ```
   If it lands, run again with `--send`. Neither costs a build.

**Decisions owed by Constantin.**

2. **Where `product/` lives.** 21 listings across `gbp-`, `promo-` and `stripe-`
   families for all 7 plans. It is a reusable asset library, not campaign
   content, so it was deliberately NOT migrated. Suggestion: a sibling top-level
   `Product Assets\` folder on the Drive, outside the campaign tree.
3. **Council item D-6**, scheduled collection destroys history.
   `_enqueue.js:144-150` deletes prior `ai_results` with no date filter, so
   weekly automatic collection erases last week. This is the Radar business case,
   not an abstract bug.

**Work queued.**

4. **Commit `scripts/migrate_social_to_drive.py`.** Untracked, and it is the only
   record of the migration rules. Free push.
5. **The 486 MB of mp4 renders are still only on this machine.** The finished
   posts (146 MB) are on Drive now; the raw renders are not backed up anywhere.
6. **Deactivate the six old Stripe payment links** (those without
   `metadata.rotation = 2026-07-31`). Stripe UI, no deploy. Until then the
   exposure the rotation was meant to close stays open.
7. **Fix the DMARC `rua`.** `_dmarc.getbrandgeo.com` points at
   `constantin@talentwelove.com` with no cross-domain authorization record, so
   BrandGEO has **never received a single aggregate report**. Change to
   `constantin@getbrandgeo.com`. One DNS record at CyberFolks.
8. **Auto-post function.** Explicitly deferred by Constantin ("auto-post later,
   I am just organizing now"). When it starts, it needs OAuth apps for Meta,
   LinkedIn, TikTok, YouTube and X, none of which an agent can create. Meta's
   review takes longest, so start there. The Drive structure already supports it:
   read `2-Posted` for history, `1-Pending` for the queue, `post.json` for the
   payload, `caption.txt` for the words.

### Track B

**Constantin, blocking. Nothing downstream can move without these.**

9. **Record the voice kit.** About **3 minutes of reading**, not 45. Sections A
   to E of `RECORDING-KIT.md`. The 45 minutes is setup and retakes. Recording
   MORE makes the clone worse: past 3 minutes the vendor's own docs say it "can
   be detrimental". Send the raw file before buying anything; measuring it is
   free and decides whether a clone is worth USD 6.
10. **Say "GEO" and "BrandGEO" aloud, both ways, on that recording.** Open since
    2026-07-29. Nothing can be synthesised correctly until it is settled.
11. **The 8 screen recordings.** Full spec in
    `CONSTANTIN-CAPTURE-AND-VOICE.md`. C7 needs a tenant with real collection
    history and C8 may have to be skipped; both have written fallbacks, so send
    what you get rather than staging data.
12. **Threads setup** (`threads/SETUP.md`), then the 18 profile and banner
    uploads. The avatars are still the retired mark on every account.

**Decisions owed, no work possible until they land.**

13. **D6:** the global time filter renders on 10 routes and only 3 files import
    `useTimeFilter`. Wire it up, or scope the bar to the routes that honour it.
14. **D8:** the muted-text ladder has collapsed. In dark, `text-slate-400`,
    `-500` and `-600` resolve to one identical colour across 547 elements. Needs
    new values, not new names.
15. **Remotion licence.** Free for individuals and companies up to 3 employees,
    paid above. Unlike Geist's OFL this is a commercial condition. Confirm, or
    it should come back out.

**Open, unassigned.**

16. 36 reel cuts carry no logo mark at all. That is their original state, not a
    regression introduced here.
17. `add_lockup.py`'s drawn-type fallback is unexercised: no pre-lockup file
    exists to test it against, so it cannot be claimed to work.

**Rules now in force, do not relearn them.**

- Commit per task; do not push if it touches `brandgeo-dashboard/`. One batch
  push per block, target 2 builds/day. Only a live billing/auth/signup defect
  ships alone.
- Social and campaign media never enters git or Netlify. **But articles under
  `brandgeo/web/` MUST be committed: git IS the cPanel deploy mechanism.**
- One agent per department per block, briefed with the full change list.
  Mechanical edits are done in-session, never delegated.
