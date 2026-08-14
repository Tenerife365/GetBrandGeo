# The daily acquisition pipeline

Ruled by Constantin 2026-08-14, after the sprint's first two days produced
optimization and zero client acquisition. This file is the operating spec for
a waterfall that runs EVERY DAY and ends in real contact with real prospects.

**This file overrides the standing rule that agents never send.** `AUTONOMY.md`
§2 withholds "sending anything to a real customer" and `GTM-TEAM.md` says the
last mile is Constantin. Constantin overrode both in writing on 2026-08-14, on
one condition: **he confirms the prospects, confirms the audits, and confirms
the send, and only then does anything leave the machine.** Nothing sends on a
schedule without that confirmation. Any session reading the older rule should
read this paragraph as the newer ruling.

---

## The waterfall, in order

Each stage hands to the next. A stage never starts on stale input.

| # | Stage | Seat | Output | Gate |
|---|---|---|---|---|
| 0 | Warm the ground | `gtm-content` + the pulse | recent public posts in the segment being targeted TOMORROW | none, it runs a day ahead |
| 1 | Research and qualify | `gtm-outbound` | 20 named prospects, verified domains, reachable channel | Constantin confirms the list |
| 2 | Evidence | audit runner | 20 real audits, one public report URL each | Constantin confirms the reports |
| 3a | LinkedIn | `gtm-outbound` (founder voice) | 20 connection requests with notes | Constantin confirms, then sends |
| 3b | Email | `gtm-outbound` | 20 one-to-one emails | BLOCKED until the domain is warm, see below |
| 3c | X | `gtm-demand` | replies and DMs into live conversations | Constantin confirms |
| 4 | Close the day | this session | three numbers | none |

**Stage 2 spends real money.** About EUR 0.224 per audit, so 20 audits is
roughly EUR 4.50 a day and about EUR 67 across the rest of the sprint.
Constantin confirmed the budget on 2026-08-14 and confirmed credits are topped
up for daily runs through month end. The prospecting spend shares a cap with
the public homepage audit, so if the free audit ever starts returning 429 to
visitors, stage 2 is what to pause first.

---

## Channel readiness, and the one that is not ready

| Channel | Ready | Why |
|---|---|---|
| LinkedIn | TODAY | Constantin's own profile, founder approach, no warmup needed |
| X | TODAY | public replies, no warmup needed |
| Email from `trybrandgeo.com` | **2026-08-19 at the earliest** | warmup started 2026-08-14 and needs 5 to 7 days; SPF, MX and DMARC are still unpublished at CyberFolks, so mail today fails SPF and routes through a self-pointing MX |
| Email from `getbrandgeo.com` | NEVER for cold | `outbound-infra.md` rule: the primary domain runs the product and receives customer mail; burning it is unrecoverable |

**Do not start the email lane early to save a day.** A brand new domain's
reputation is set by its first sends. Sending before SPF, DKIM and DMARC all
resolve, and before mail-tester scores 9 or higher, spends the asset rather
than using it.

---

## Stage 0: warm the ground before you knock

Ruled by Constantin 2026-08-14. People respond to familiarity, recognition and
trust. A cold message from a profile with no recent activity is a stranger
knocking. A message from someone whose post about their exact problem they saw
two days ago is a different conversation, and it costs nothing extra because
the content is being produced anyway.

**So the GTM lane and the content lane are not separate teams. They share the
target segment, one day apart.**

1. The research seat publishes TOMORROW's target segment at the end of each
   run, in one line, to `docs/growth/sprint17/daily-log.md`. Example: "tomorrow
   is legal practice management software".
2. The content seat reads that line and makes the next day's posts speak to
   that segment: the finding, the vertical, the language those buyers use. Our
   own research already carries per-segment measurements, so this is selection
   rather than new production.
3. Constantin's personal LinkedIn and X must carry recent, relevant, public
   activity BEFORE the outreach lands, because the first thing a prospect does
   with an unfamiliar name is open their profile. An empty profile costs the
   reply.
4. Where a prospect has recently posted publicly, engage with that FIRST, in
   public and genuinely, and let the outreach follow. Never engage as a pretext,
   and never reference their post in the outreach as if it were a coincidence.

**The GTM seats must ask the content seat for support rather than working
around a gap.** If a segment has no usable asset, that is a request to the
content lane, logged in the daily log, not a reason to send a weaker message.

---

## Founder voice, binding on every message

Constantin's ruling: the founder approach is the most effective motion we have,
so every message is from him personally, not from a company.

1. First person, his name, no company voice and no marketing register.
2. **Lead with THEIR result, never with our product.** The first line names
   something an AI engine actually said about their brand.
3. One link: their own audit report URL. Never a generic homepage link.
4. No pitch in message one. The audit is the message.
5. Never claim customers we do not have. One committed client, anonymized.
6. No em dashes, no en dashes, no AI buzzwords.
7. A true zero is stated plainly, not softened, and never as "you are failing".

---

## Volume, per day

| Channel | Volume | Ceiling and why |
|---|---|---|
| Audits | 20 | budget and the shared prospecting cap |
| LinkedIn | 20 | check the personalized-invite limit on the account first; free accounts are capped far below this and Sales Navigator is the unlock |
| Email | 20 | once warm. 25 per mailbox per day is the safe ceiling |
| X | as the conversation allows | no fixed number, quality only |

---

## The daily schedule

Runs at 08:00 local, weekdays. Weekend runs research only, since outreach on a
Saturday reads worse than no outreach.

1. **08:00** research produces the day's 20, fresh, never a repeat of a prospect
   already contacted. A contacted-list is maintained so nobody is touched twice.
2. Constantin confirms the list. One line is enough.
3. Audits run on the confirmed domains.
4. Constantin confirms the reports are worth sending. Any audit that failed or
   looks wrong is dropped, not sent.
5. Messages are drafted per channel and shown to him in full.
6. On his confirmation, sends execute **one at a time, spaced**, never in bulk.
7. **Close the day**: touches, replies from a named human, customers signed.

---

## What the pipeline must never do

- Send anything before Constantin's explicit confirmation on that day's batch.
- Send in bulk, or fast enough to look automated.
- Contact the same person twice without a deliberate follow-up decision.
- Invent a company, a contact, a statistic, or a customer.
- Use `getbrandgeo.com` for cold email.
- Continue if replies show the message is landing badly. Two hostile replies in
  one day stops the lane and the copy gets rewritten before it resumes.
