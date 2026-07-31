# Outbound sending infrastructure and the GBP fix (S8)

Written 2026-07-31 for sprint task S8. Every step below is Constantin's to
execute: no agent can log into a registrar, a Google console, or a sending tool
(`docs/AUTONOMY.md` §4). This file is the instruction set and the verification
contract. Report results back into the S8 chat and the chat closes the loop.

**The warmup clock is the binding constraint.** A brand new domain needs 5 to 7
calendar days of warmup before it can carry real cold volume. Steps 1 to 5 need
to be done today (2026-07-31) or the sprint's Day 6 send date (Thu 2026-08-06)
slips, and every downstream number in `SPRINT-100-PLAN-30D.md` slips with it.
Step 6 (GBP) is independent and can be done any time today.

---

## 0. What was measured before writing this

Read from live DNS and from source on 2026-07-31, so no step below rests on
memory. `CLAUDE.md` and the `engine-lineup-seven` memory were both treated as
untrusted and re-derived.

| Fact | How it was checked | Value |
|---|---|---|
| Registrar and DNS host for `getbrandgeo.com` | `nslookup -type=NS` | `ns1` to `ns4.cyberfolks.ro`, so **CyberFolks** |
| Mail provider for `getbrandgeo.com` | `nslookup -type=MX` | `smtp.google.com` priority 1, so **Google Workspace** |
| Web server IP | `nslookup -type=A` | **91.200.121.45** (the cPanel box) |
| Existing SPF | `nslookup -type=TXT` | `v=spf1 include:_spf.google.com +a +mx +ip4:89.36.131.31 +ip4:185.236.86.239 ~all` |
| Existing DMARC | `nslookup -type=TXT _dmarc` | `v=DMARC1; p=none; rua=mailto:constantin@talentwelove.com` |
| `trybrandgeo.com` | `nslookup -type=NS` | no delegation exists, so almost certainly unregistered |
| `trygetbrandgeo.com` | `nslookup -type=NS` | no delegation, also free, rejected on naming grounds below |
| `getbrandgeo-outreach.com` | `nslookup -type=NS` | no delegation exists, so almost certainly unregistered |
| `brandgeo.com` | `nslookup -type=NS`, then `curl -I` | **registered and parked**, `ns1/ns2.atom.com`, 302s to `atom.com/name/BrandGEO`, **listed for sale at USD 9,995** |
| Engine lineup | `brandgeo-dashboard/src/lib/planConfig.ts` `PLAN_ENGINES` | see the table in step 6 |
| Free public audit engines | `netlify/functions/_prospect_engines.js:396` `FULL_ENGINES` | 5 engines, not 7 |

Two things this table settles that are easy to get wrong:

1. The existing SPF on `getbrandgeo.com` carries two `ip4` entries. Those are
   web servers, not mail servers. **Do not copy that SPF onto the new domain.**
   Every IP in an SPF record is an IP allowed to send as you, so a copied record
   authorises two machines that will never send outreach mail.
2. `getbrandgeo.com` is at DMARC `p=none`. That is fine for the primary domain
   and is not what the new domain should end at. See step 3 note D.

---

## The two decisions, and why

**Domain: `trybrandgeo.com`.** Constantin's suggestion, taken over the original
`trygetbrandgeo.com` on 2026-07-31, and over `getbrandgeo-outreach.com`.

- `getbrandgeo-outreach.com` is out because the word "outreach" inside a sending
  domain labels the mail as bulk before a human reads it, and it is 12
  characters longer in every From line.
- `trybrandgeo.com` beats `trygetbrandgeo.com` on reading. "try BrandGEO" is a
  verb plus the brand. "try get BrandGEO" stacks two verbs and stutters at the
  `try-get` seam. It is also 3 characters shorter, and it carries the brand name
  exactly as the signature, the LinkedIn profile and the S6 one-pagers spell it.
- The one thing `trygetbrandgeo.com` had going for it: it contains the full
  primary domain as a substring, so a suspicious recipient can see the
  relationship without a lookup. The root redirect in step 4 answers that
  question better and answers it for both candidates, so it is not worth the
  clumsier name.

**Checked before recommending it: `brandgeo.com` is not an operating business.**
It is parked marketplace inventory, `ns1/ns2.atom.com`, 302ing to
`atom.com/name/BrandGEO` with a USD 9,995 asking price. So `trybrandgeo.com`
sits next to a for-sale listing, not next to a live company that could be
confused with us or object. That is what makes it safe. Residual risk, small and
future: if someone buys `brandgeo.com` and operates in this category, the
adjacency stops being free. Accepted, and noted below as a decision owed.

**Never send cold from `getbrandgeo.com`.** That domain carries the company's
Google Workspace mail and the app's transactional mail: password resets, plan
change notices, audit unlock mail. A cold list produces spam complaints at a
rate transactional mail never does, and complaint rate is scored per domain. One
bad list on the primary domain and password reset emails start landing in spam
for paying customers. The secondary domain is a firebreak, and its whole job is
to be the thing that burns instead.

**And a subdomain is not that firebreak.** Asked and settled 2026-07-31:
`try.getbrandgeo.com` would be cheaper and would need no second registration,
but it is still `getbrandgeo.com` at the organisational level, which is the
level that matters here.

- Receiving systems score the organisational domain alongside the exact sending
  domain. Subdomain reputation is partly separate, not separate.
- Domain blocklists operate on domains. A listing that reaches the root takes
  transactional mail down with it, and you cannot abandon a subdomain without
  the root already carrying the damage. A separate domain you can genuinely
  throw away.
- DMARC couples the two. `getbrandgeo.com` publishes `p=none` with **no `sp=`
  tag**, so under RFC 7489 every subdomain inherits `none`. The outreach
  subdomain could not be moved to `p=quarantine` on Day 15 without either
  moving the primary too or adding a subdomain-specific record. A separate
  domain tunes independently, which is the whole point of a firebreak.
- The From line is read by a human. `constantin@try.getbrandgeo.com` looks
  machine generated to a small business owner. `constantin@trybrandgeo.com`
  looks like a company.
- The separate domain costs about EUR 12 for the year.

**The honest argument for a subdomain, and why it loses here.** A subdomain
inherits part of the parent's reputation, so it warms faster, roughly 3 to 5
days against 5 to 7. Warmup is this sprint's hardest physical constraint, so
that is a real advantage and not a small one. It loses anyway, because
inheritance is worth exactly what the parent's reputation is worth, and
`getbrandgeo.com` is a young, low volume sender: a small team's Google Workspace
mail plus the app's transactional mail. There is no large established good
reputation sitting there to borrow. The trade is the full downside, the primary
domain permanently inside the blast radius, for an upside proportional to
something the domain has not built yet.

The subdomain advice is sound and widely repeated, but it comes from bulk
marketing to opted-in lists, where consent exists, complaint rates sit near
zero, and the parent has years of volume behind it. Cold outreach to people who
never asked is a different risk profile and the advice does not carry over.

**When a subdomain would be right, and it will be later.** For opted-in mail,
a customer newsletter, product announcements, release notes, `mail.getbrandgeo.com`
is the correct answer and is what to use when that day comes. Different job,
different risk, and by then the reputation being inherited will be worth
something.

**Mailbox provider: a separate Google Workspace account for the new domain.**
Not a secondary domain added to the existing `getbrandgeo.com` Workspace. Google
suspends at the account level, not the domain level, so an alias domain sharing
the existing subscription puts the company's real mailbox one abuse report away
from suspension. A separate subscription costs two more seats and isolates that
risk completely.

**Sending tool: Instantly.** Recommended over Smartlead for this sprint on two
grounds: its warmup pool is the larger of the two, and its account setup path
for Google Workspace is OAuth rather than app passwords, which is one fewer
place to leak a credential.

### Cost

| Line | Monthly EUR | Note |
|---|---|---|
| `trybrandgeo.com` registration | about 1 | roughly EUR 12 for the year |
| Google Workspace Business Starter, 2 seats | about 14 to 17 | confirm the seat price at checkout |
| Instantly, Growth plan | about 40 to 47 | monthly billing costs more than annual; for a 30 day sprint take monthly |
| **Total** | **about 55 to 65** | ceiling is EUR 150, so a third and fourth inbox fit inside it |

**I cannot verify vendor pricing from here and did not try.** The figures above
are estimates for budgeting only. Confirm each at checkout before paying, and if
any line is materially different, say so in the chat and the budget line gets
rewritten rather than quietly exceeded.

---

## STEP 1. Register the domain

At CyberFolks, the same place `getbrandgeo.com` already lives, so that DNS for
both domains sits in one panel.

1. Sign in at `https://www.cyberfolks.ro/`.
2. Search the domain `trybrandgeo.com` and add it to the cart.
3. At checkout, turn **WHOIS privacy ON** and **auto renew ON**.
4. Leave the nameservers at the CyberFolks defaults (`ns1` to `ns4.cyberfolks.ro`),
   the same set `getbrandgeo.com` uses. Do not delegate this domain anywhere else.
5. Do **not** buy any bundled email, SSL, or "professional email" add-on. Mail is
   Google Workspace, step 2, and buying a second mail service on the same domain
   creates a conflicting MX record that is tedious to find later.

If `trybrandgeo.com` turns out to be taken at checkout, the fallback in order of
preference is `trygetbrandgeo.com` (also confirmed free today), then
`getbrandgeo.io`, then `brandgeo-audit.com`. Do not fall back to
`getbrandgeo-outreach.com`. Tell me which one you registered before doing
step 3, because every record in that step contains the domain name.

**Report back:** the domain you registered.

---

## STEP 2. Two inboxes on Google Workspace

A **new, separate** Google Workspace subscription for this domain. Not a
secondary domain on the existing one, for the suspension reason above.

1. Go to `https://workspace.google.com/`, choose **Business Starter**, and start
   the signup with the domain `trybrandgeo.com` when it asks whether you have
   a domain (choose "Yes, I have one I can use").
2. Create these two users. Use your real name on both. Real human names only:
   `sales@`, `info@`, `hello@` and other role addresses are filtered harder on
   cold traffic and cannot be personalised in a From line.

   | Mailbox | First name | Last name |
   |---|---|---|
   | `constantin@trybrandgeo.com` | Constantin | Goane |
   | `c.goane@trybrandgeo.com` | Constantin | Goane |

3. Create one alias for DMARC reports on the first user:
   `dmarc@trybrandgeo.com`. Admin console, Directory, Users, click the first
   user, User information, Alternate email addresses, add `dmarc`.
4. For **each** of the two mailboxes, sign in once at `https://mail.google.com/`
   and set: a profile photo (the same one you use on LinkedIn), and a plain text
   signature of exactly this shape, no logo image and no banner:

   ```
   Constantin Goane
   BrandGEO
   https://getbrandgeo.com
   ```

   An empty profile with no photo and no signature is one of the cheapest
   spam signals to fix, and warmup traffic starts flowing in step 5 today.
5. In each mailbox: Settings, See all settings, Forwarding and POP/IMAP, and set
   **IMAP access: Enable**. Instantly needs it even on the OAuth path.

**Report back:** both mailboxes created, and confirmation that you can send a
normal email from each one.

---

## STEP 3. DNS records

All of these go in the CyberFolks DNS zone editor for `trybrandgeo.com` (the
domain's DNS management / zone editor section, not the one for
`getbrandgeo.com`, check the domain name at the top of the page before you type
anything).

**Record 3 cannot be written here.** Google generates the DKIM key inside your
Admin console and it is unique to the account, so do step 3c first, then paste
what Google gives you.

| # | Type | Host / Name | Priority | Value | TTL |
|---|---|---|---|---|---|
| 1 | MX | `@` | `1` | `smtp.google.com` | 3600 |
| 2 | TXT | `@` | | `v=spf1 include:_spf.google.com ~all` | 3600 |
| 3 | TXT | `google._domainkey` | | `v=DKIM1; k=rsa; p=` plus the key from step 3c | 3600 |
| 4 | TXT | `_dmarc` | | `v=DMARC1; p=none; rua=mailto:dmarc@trybrandgeo.com; fo=1; adkim=r; aspf=r; pct=100` | 3600 |
| 5 | A | `@` | | `91.200.121.45` | 3600 |
| 6 | CNAME | `www` | | `trybrandgeo.com.` | 3600 |

### 3c. Generating the DKIM key

1. Go to `https://admin.google.com/`.
2. Apps, then Google Workspace, then Gmail, then **Authenticate email**.
3. Select `trybrandgeo.com` in the domain dropdown.
4. Set DKIM key bit length to **2048** and prefix selector to **google**, then
   **Generate new record**.
5. Google shows a DNS host name (`google._domainkey`) and a long TXT value
   starting `v=DKIM1; k=rsa; p=MIIBIj...`. Copy the **whole** value and paste it
   into record 3 above.
6. Only after record 3 resolves (verify with the command in step 7), come back
   to this same screen and click **Start authentication**.

### Notes that prevent the four common failures

**A. One SPF record only.** A domain may have exactly one TXT record starting
`v=spf1`. If CyberFolks pre-creates a default SPF when the domain is added,
**edit it** to the value in row 2, do not add a second. Two SPF records is a
permanent fail, not a warning, and it fails silently until a mail-tester run
catches it.

**B. Host fields append the domain.** Most zone editors append the domain to
whatever you type. If after saving you see
`google._domainkey.trybrandgeo.com.trybrandgeo.com`, you typed the full
name into a field that appends. Enter only `google._domainkey`, only `_dmarc`,
only `www`, and `@` (or a blank field, depending on the panel) for the root.

**C. The DKIM value may be split.** Some panels reject TXT values over 255
characters. The 2048-bit DKIM value is longer than that. If the panel refuses
it, split the value into quoted chunks on one line, which DNS concatenates:
`"v=DKIM1; k=rsa; p=MIIBIj..." "...rest of the key..."`. Do not drop to a
1024-bit key to make it fit.

**D. `rua` stays on this domain on purpose.** DMARC reports sent to an address
at a *different* domain require the receiving domain to publish an
authorisation record, or most reporters silently send nothing. So `rua` points
at `dmarc@trybrandgeo.com`, which needs no such record. If you ever want the
reports at `constantin@talentwelove.com` instead, `talentwelove.com` must first
publish `trybrandgeo.com._report._dmarc.talentwelove.com` TXT `"v=DMARC1"`.

**E. `p=none` is the starting value, not the final one.** It means "monitor and
report, enforce nothing", which is correct while records settle. On **Day 15
(2026-08-15)**, if the DMARC reports show no failures, change record 4's `p=none`
to `p=quarantine`. Leaving a sending domain at `p=none` for its whole life is a
deliverability handicap at Google and Microsoft, both of which now expect
enforcement from bulk senders.

**Report back:** all six records saved, and the output of the four verification
commands in step 7.1.

---

## STEP 4. Forward the root to https://getbrandgeo.com

A cold sending domain that serves nothing at its root looks disposable to both
a filter and a human prospect who types it in. Records 5 and 6 above point it
at the cPanel box, and this step makes it redirect.

In cPanel at `https://getbrandgeo.com:2083` (or whichever cPanel URL you use):

1. **Domains**, then **Create A New Domain**. Domain: `trybrandgeo.com`.
   **Uncheck "Share document root"**. Let it create its own document root at
   `/home/<your-cpanel-user>/trybrandgeo.com`.
2. **Redirects**. Set:
   - Type: **Permanent (301)**
   - https?://(www.)? : select `trybrandgeo.com`
   - Redirects to: `https://getbrandgeo.com`
   - **Redirect with or without www**: selected
   - Wild Card Redirect: leave **unchecked**
3. Click Add.

**Do not share the document root with `getbrandgeo.com`.** Sharing it would
serve the entire real marketing site on a second domain, which duplicates 111
pages for search engines and exposes a second copy of `deploy.php` on a domain
with no deploy secret expectation.

**Report back:** the output of the curl in step 7.2.

---

## STEP 5. Instantly: connect, warm up, cap

1. Sign up at `https://instantly.ai/` on the **Growth** plan, monthly billing.
   Note the actual price you were charged and report it.
2. **Accounts**, **Add new account**, **Google / Gmail**, and connect via OAuth.
   Do this for **both** mailboxes. If OAuth is blocked by a Workspace policy,
   the fix is in Admin console, Security, Access and data control, API controls,
   Manage third party app access. Prefer fixing that over falling back to app
   passwords.
3. For **each** of the two accounts, set:

   | Setting | Value |
   |---|---|
   | Warmup | **ON** |
   | Warmup emails per day | start **5**, increase by 5 every 2 days to a ceiling of **30** |
   | Reply rate | **30 percent** |
   | Warmup on weekends | **ON** (warmup traffic is pool traffic, it is safe every day) |
   | Daily campaign send limit | see the ramp table below |
   | Delay between sends | random, **60 to 180 seconds** |
   | Stop campaign on reply | **ON** |
   | Open tracking | **OFF** |
   | Link tracking | **OFF** |

   Open and link tracking both inject a redirect or a pixel on a domain with no
   reputation, which is a measurable deliverability cost. The scoreboard counts
   replies and calls, not opens, so nothing downstream needs them.

4. **Warmup starts today and runs untouched until Day 6.** Zero real sends
   before 2026-08-06 no matter how ready it looks. This is the 5 to 7 day clock.

### Daily send cap ramp, per the 30 day plan

Caps are **per inbox**. Set them in Instantly on the morning of each date.

| Sprint day | Date | Per inbox | Total cold sends | Plan target |
|---|---|---|---|---|
| 1 to 5 | 08-01 to 08-05 | 0 | 0 | warmup only |
| 6 | Thu 08-06 | 10 | 20 | 20 |
| 7 | Fri 08-07 | 15 | 30 | 30 |
| 8 to 9 | Sat 08-08, Sun 08-09 | 0 | 0 | 0, DMs only |
| 10 | Mon 08-10 | 0 | 0 | launch day, replies only |
| 11 | Tue 08-11 | 20 | 40 | 40 |
| 12 onward | Wed 08-12 | 25 | 50 | 50 |

**A capacity gap you need to act on by Day 12, not by Day 25.** 25 cold sends
per mailbox per day is the safe ceiling for a Google Workspace inbox, so two
inboxes cap out at 50. The plan asks for 55 on Day 25, 60 on Day 26, 65 on Day
27 and 70 on Day 28. Two inboxes cannot deliver that safely.

The fix is a **third and fourth mailbox created and warmed starting Day 12
(2026-08-12)**, which gives them 13 days of warmup before Day 25 needs them.
Four inboxes at 25 covers 100 per day with headroom. Cost is two more Workspace
seats, about EUR 14 to 17, and the total stays around EUR 75 per month, still
well inside the EUR 150 ceiling. Suggested addresses, same real-name rule:
`constantin.g@trybrandgeo.com` and `cgoane@trybrandgeo.com`.

The alternative, pushing 35 per inbox on two mailboxes, is how a domain gets
burned in week 4 of a 4 week sprint. Do not do that.

### Compliance line every cold email carries

Not legal advice. This is the shape the sending tool needs configured, and the
copy itself belongs to S11, not here. Every cold email must contain the sender's
real identity and a working one line opt out. Put this in the Instantly campaign
signature block so it cannot be forgotten per template:

```
Constantin Goane, BrandGEO. If you would rather not hear from me, reply with
"no thanks" and I will not write again.
```

A plain reply based opt out is honoured manually and beats an unsubscribe link,
which on a cold domain adds a tracked redirect for no benefit. Honour every one
the same day, and add the address to the Instantly blocklist.

---

## STEP 6. Fix the Google Business Profile

Independent of everything above, do it today. The profile is a live public claim
that contradicts the product, which is the exact failure BrandGEO sells a tool
to detect.

### 6.0 The lineup, read from `planConfig.ts` on 2026-07-31

This is the source of truth. Neither `CLAUDE.md` nor any memory file was
trusted for it.

| Plan | Engines | Which |
|---|---|---|
| Free | 1 | ChatGPT |
| Essentials | 3 | ChatGPT, Gemini, Claude |
| Growth | 5 | plus Perplexity, Google AI Mode |
| Growth PRO | 7 | plus Grok, Google AI Overviews |
| Managed | 7 | same seven |
| **Free public audit** | **5** | ChatGPT, Gemini, Claude, Perplexity, Google AI Mode |

Names are spelled exactly as `ENGINE_META` spells them: **Google AI Mode** and
**Google AI Overviews** are two different products and both spellings matter.
**Meta AI is retired** (2026-07-16) and appears in no plan set. It must not
appear anywhere on the profile.

The free audit is **five** engines, not seven. No text below says otherwise.

### 6.1 Where

Sign in to the Google account that owns the profile, then either go to
`https://business.google.com/` or search `my business` on Google while signed
in, and open the BrandGEO profile.

### 6.2 Business description

Field: **Edit profile**, tab **About**, field **Description**. Limit 750
characters. Select all existing text, delete it, paste this (678 characters,
counted, so it fits with room to spare):

```
BrandGEO shows you whether AI answer engines name your business when a customer asks about your category, and what they say when they do.

We put your own buyer questions to ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews and Grok. For every answer we record four things: whether you were named, where you sat in the list, what the answer said about you, and which competitors appeared alongside you. Answers are kept and refreshed weekly, so you can see whether something you changed moved the result.

Start with the free audit. It runs your domain against five engines and returns a score with a breakdown per engine, in under a minute, with no card.
```

### 6.3 Services

Field: **Edit profile**, tab **Services**. Delete every existing service that
mentions Meta AI or a fixed engine count, then add these five as custom
services. Service name limit is 120 characters, description limit is 300.

**Service 1**
- Name: `Free AI visibility audit`
- Description:
```
Put your domain to five AI answer engines, ChatGPT, Gemini, Claude, Perplexity and Google AI Mode, and get a score with a breakdown per engine. Under a minute, no card. One snapshot: one day, one set of questions. Enough to see whether you are named at all.
```

**Service 2**
- Name: `AI answer engine monitoring`
- Description:
```
Your own buyer questions, asked weekly against the engines your plan covers, from three engines on the entry tier up to seven: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews and Grok. Every answer is stored, so you get a direction and not just a point.
```

**Service 3**
- Name: `Competitor visibility tracking`
- Description:
```
See which businesses the engines name instead of you, and in what order. Every answer we collect records the competitors that appeared alongside you, so you can tell whether you are absent from the answer or simply lower in it. Those are different problems.
```

**Service 4**
- Name: `Brand sentiment in AI answers`
- Description:
```
Being named is not the same as being recommended. We record what each answer actually said about you, positive, neutral or negative, per engine and over time. Engines do not have to agree with each other, and your customer reads one of them.
```

**Service 5**
- Name: `Managed AI visibility`
- Description:
```
The done for you tier. We run the questions, read the answers, and hand you the work: what changed, what to publish, and what moved. For businesses that want the result without running the tool themselves.
```

### 6.4 Photos

Field: **Edit profile**, tab **Photos**. Two live images make claims the product
no longer supports (recorded in the `gbp-live-assets-stale` memory):

| Image | What it says | Action |
|---|---|---|
| `gbp-cover-1080x608.png` | "Monitor how visible your brand is across ChatGPT, Gemini, Claude, Perplexity, and **Meta AI**" | **Delete** |
| `gbp-product-2-engine-coverage.png` | "**5 AI engines**, one dashboard", "5/5 engines tracked live", lists **Meta AI** | **Delete** |
| `gbp-product-1-ai-visibility-score.png` | The AI Visibility Score, six dimensions | Keep, it is still accurate |
| the two logo tiles | no copy | Keep |

Replacements are already rendered and correct, at
`docs/growth/CAMPAIGN-2026-07-30/google-business-profile/`. Upload these two in
place of the deleted pair:

- `gbp-3-growth-pro-1200x900.png` (the seven engine card)
- `gbp-4-plan-ladder-1200x900.png` (the plan ladder)

Their post copy, if you also want to publish them as GBP posts, is in `POSTS.md`
in the same folder, already written and already checked against source.

### 6.5 Do not touch

Business name, primary category, address, phone, hours. Editing those puts the
profile back into Google review, which can take days and can suspend the listing
while it runs. This task changes text and photos only.

### 6.6 One thing that may change under you

If sprint task S1 rules the new entry tier ("Radar") into the ladder, service 2
becomes wrong at its lower bound (it says three engines). That is a one line
edit at the time, and S1 is not decided yet, so ship the text above now. No
price appears anywhere in the text above, deliberately, so a pricing ruling
cannot invalidate any of it.

**Report back:** a screenshot or the public URL of the profile after saving.

---

## STEP 7. The verification loop

Nothing below is optional and nothing is a self report. S8 is not done until
7.1, 7.3 and 7.4 all pass.

### 7.1 DNS resolves (run after step 3, wait 15 minutes first)

```bash
nslookup -type=MX trybrandgeo.com 8.8.8.8
```

```bash
nslookup -type=TXT trybrandgeo.com 8.8.8.8
```

```bash
nslookup -type=TXT google._domainkey.trybrandgeo.com 8.8.8.8
```

```bash
nslookup -type=TXT _dmarc.trybrandgeo.com 8.8.8.8
```

Pass condition: MX returns `smtp.google.com`; the second returns exactly one
`v=spf1` line and no more; the third returns a `v=DKIM1` line; the fourth
returns the `v=DMARC1` line. Paste all four outputs into the chat.

### 7.2 The root redirect works

```bash
curl -sSI https://trybrandgeo.com | head -5
```

Pass condition: `HTTP/... 301` and a `location:` header of
`https://getbrandgeo.com`.

### 7.3 mail-tester scores 9 or higher

Do this on **Day 5 (2026-08-05)**, after four days of warmup, and before the
first real send on Day 6.

1. Open `https://www.mail-tester.com/` and copy the address it shows.
2. From `constantin@trybrandgeo.com` in the Gmail web interface, send to that
   address. **Use a realistic email**, roughly the length and shape of the real
   first touch, with a subject line and a signature. A message reading "test"
   scores badly for reasons that will not apply to real mail and wastes the run.
3. Wait 60 seconds, click "Then check your score".
4. Repeat the whole thing for `c.goane@trybrandgeo.com` on a **fresh**
   mail-tester address. Each address is single use.

Pass condition: **9.0 or higher out of 10 on both inboxes.** Paste the score and
the SPF, DKIM and DMARC lines from the report. If either scores below 9, do not
send on Day 6: paste the full report into the chat and the gap gets diagnosed
before any volume goes out. `SPRINT-100-PLAN-30D.md` already binds this: if
deliverability is not proven by Day 6, cold volume waits and DM volume rises
instead. Never burn the domain to keep a number.

### 7.4 Instantly's own checker is green

Instantly, **Accounts**, click each connected inbox, and open its DNS or
deliverability panel. Pass condition: **SPF, DKIM and DMARC all showing pass or
green on both accounts.** Screenshot both.

### 7.5 Warmup health, Day 5

Instantly, Accounts, the warmup tab per inbox. Pass condition: warmup emails are
sending and landing in inbox rather than spam, with an inbox rate at or above 90
percent. Screenshot. This is a health signal, not a gate: a low rate on Day 5
means extend warmup, not cancel the sprint.

### 7.6 GBP is corrected in public

After saving step 6, open the profile in a **logged out** browser (a private
window) and confirm: no "Meta AI" anywhere, no "5 AI engines" claim, the
description matches 6.2, and the five services match 6.3. Screenshot or paste
the public URL.

### 7.7 Optional but free, and worth 10 minutes

Add `trybrandgeo.com` to Google Postmaster Tools at
`https://postmaster.google.com/`. It needs one TXT verification record and then
reports real Gmail-side domain reputation and spam rate, which is the only
first-party view of how Gmail actually sees you. Do it once warmup is running.

---

## What is blocked on what

| Step | Depends on | Deadline |
|---|---|---|
| 1 register | nothing | **today, 2026-07-31** |
| 2 inboxes | step 1 | today |
| 3 DNS | steps 1 and 2 (DKIM comes from the Workspace account) | today |
| 4 redirect | records 5 and 6 in step 3 | today |
| 5 warmup ON | steps 2 and 3 | **today, this is the clock** |
| 6 GBP | nothing | today, independent of all the above |
| 7.1, 7.2 | step 3, step 4 | today plus 15 minutes |
| 7.3 mail-tester | 4 days of warmup | Day 5, 2026-08-05 |
| first real send | 7.3 passing | Day 6, 2026-08-06 |
| inboxes 3 and 4 | nothing, but warmup takes 13 days | create Day 12, 2026-08-12 |
| DMARC to `p=quarantine` | 14 days of clean reports | Day 15, 2026-08-15 |

---

## A decision owed, found while checking the name

**`brandgeo.com` is for sale at USD 9,995** (about EUR 9,200) on Atom.com, the
marketplace its nameservers point at. Found 2026-07-31 while confirming that
`trybrandgeo.com` would not sit next to a live competitor.

This is the exact-match .com for the brand. `getbrandgeo.com` exists because it
was the available alternative, and the `get` prefix is the reason every asset
has to say "getbrandgeo" where a reader would type "brandgeo".

**Recommendation: not now, and this is not the S8 chat's call.** EUR 9,200 in
the week before a sprint whose entire purpose is the first 100 paying customers
is the wrong use of cash, and nothing in the outbound plan needs it. Marketplace
asking prices are also usually negotiable, so 9,995 is a ceiling rather than a
number.

What is worth doing now, because it costs nothing: note that the risk is
one-directional. The domain does not get cheaper if BrandGEO succeeds, and a
competitor in this category buying it would be genuinely awkward. Revisit at the
Day 30 close-out with real revenue on the table, or sooner if Atom shows the
listing moving. Recorded here so it is not rediscovered at a worse moment.

---

## Standing rules for this infrastructure

1. **The primary domain never sends cold mail.** Not one message, not a test,
   not a "just this one warm intro through Instantly".
2. **Volume never rises to hit a scoreboard number.** The cap table is a
   ceiling, not a target. A number missed is a number missed; a burned domain
   costs 7 days that a 30 day sprint does not have.
3. **Every opt out is honoured the same day**, manually, and the address goes on
   the blocklist.
4. **No collection runs are triggered by any of this.** Spending authority is
   withheld (`docs/AUTONOMY.md` §2). Outbound evidence comes from rows already
   collected, via S6.
5. If a mail-tester score drops below 9 at any point in the sprint, stop cold
   sending that day and diagnose. It is a leading indicator; reply rate is a
   lagging one.
