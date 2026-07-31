# Free plan update email: ChatGPT to Gemini

Drafted 2026-07-31 on Constantin's instruction. **NOT SENT.** AUTONOMY §2
withholds sending anything to a real customer from the loop, and that line has
not been overridden in writing. Constantin sends this, or authorises it
explicitly.

Audience today: **one recipient**, Ai Fy, the only live free account. Written so
the same body works as a template the moment there are more (see the merge
fields at the bottom, and motion D-5 in the sprint pack for the machinery).

---

## 1. Every claim in this email, and its evidence

Checked against production before a word was written, because this is customer
copy on a product whose whole pitch is honest measurement.

| Claim | Evidence |
|---|---|
| The free plan now runs Gemini, not ChatGPT | `planConfig.ts:60` `free: ['gemini']`, shipped in `6d2196c` |
| We re-ran their prompts on Gemini | `ai_results`: 2 gemini rows, 2026-07-31 14:41, EUR 0.064 |
| It covered ALL of their prompts | they have exactly **2 active prompts**; both were collected |
| It cost them nothing | free plan, no charge exists |
| Results are live in the dashboard now | rows are `status = ok` and queryable |

**Two things this email deliberately does NOT say.**

1. **No price and no date for the new tier.** The lower-priced tier (working
   name Radar) is signed in `docs/strategy/sprint-ladder-ruling.md` but **does
   not exist in `planConfig.ts`**. Naming EUR 29 to a customer before the tier
   is built turns a live pricing decision into a promise. The email teases that
   something smaller is coming and invites them to reply if they want it early,
   which is also the cheapest possible demand signal.
2. **No refund window, no guarantee, no SLA.** Standing rule, ROADMAP warning
   block. BrandGEO promises no refund trigger and none may be invented in copy.

## 2. Send parameters

```
from:      BrandGEO <noreply@mail.getbrandgeo.com>   (_email.js FROM, DKIM/SPF/DMARC verified)
reply_to:  contact@getbrandgeo.com                   (see note below)
to:        the free client's login email
subject:   Your free plan just got better, and we re-ran your results
```

**On reply_to.** `sendBrandedEmail` already takes `replyTo`, so a no-reply
sender and a real reply address are both satisfied at once, which is what a
feedback request needs. Use `contact@getbrandgeo.com`: it is the address already
published on getbrandgeo.com, so it is the one a recipient can verify belongs to
us. `support@getbrandgeo.com` is the admin ALERT mailbox and mixing customer
replies into an alert feed is how replies get missed. **Constantin's call, but
do not leave it unset**: without `replyTo` this email asks for feedback from an
address that discards it.

## 3. The email

**Subject:** Your free plan just got better, and we re-ran your results

**Heading:** Your free plan now runs on Gemini

**Body:**

> Hi {{first_name}},
>
> Small update on your free BrandGEO account, and a bit of good news attached to
> it.
>
> We have moved the free plan from ChatGPT to Google Gemini. The reason is
> simple: on the free tier the old setup ran out of budget partway through your
> first collection, so some accounts never saw a complete result. Gemini fits
> comfortably, which means every free account now finishes every run.
>
> We did not want you to have to wait for your weekly refresh to see the
> difference, so **we have already re-run all {{prompt_count}} of your prompts on
> Gemini, at no cost to you and without using your refresh**. Your results are
> live in your dashboard now.
>
> What that shows you is where {{brand_name}} does and does not come up when
> someone asks Gemini the questions your buyers actually ask. If you are missing
> from an answer, that is the gap worth closing, and it is the thing we are built
> to track.
>
> **We would genuinely like your feedback.** You are one of the first people
> using this, so what you find confusing or missing carries real weight right
> now. Just reply to this email and it reaches us directly.
>
> One more thing, since you are early: we are close to launching a smaller paid
> tier that sits between the free plan and Essentials, for people who want more
> engines and more prompts without jumping to a full plan. If that sounds like
> what you need, reply and say so. We are deciding the final shape this month and
> the people already using the product get the loudest vote.

**CTA:** `View your results` → `https://app.getbrandgeo.com`

**Footer note:** `You are receiving this because you have a free BrandGEO
account. Reply to this email if you would prefer not to receive product updates.`

## 4. Why it is shaped this way

The hook is not "we changed an engine", which is our news and not theirs. The
hook is **we already did the work and it is waiting for you**. The engine change
is the reason, the free re-run is the gift, and the gap in their results is the
argument for paying. In that order.

The tier tease is placed last and framed as a question rather than an
announcement, so it reads as consultation rather than a sales push, and it
returns a demand signal either way. A recipient who replies "yes, I want that"
is worth more than the email.

**On the em dash rule:** there are none here, and none in the merge fields. The
same rule binds every variant of this email.

## 5. Merge fields

Kept minimal on purpose. Every one of these must resolve from data we hold, or
the send is blocked, because `Hi ,` is worse than no email at all.

| Field | Source | Fallback |
|---|---|---|
| `{{first_name}}` | login email local part, or the contact name if we ever store one | `there` |
| `{{brand_name}}` | `clients.name` | required, no send without it |
| `{{prompt_count}}` | count of active prompts | required, no send without it |

For Ai Fy today: `brand_name` = Ai Fy, `prompt_count` = 2, and `first_name` has
no reliable source (the address is a personal Gmail), so **use the `there`
fallback rather than guessing a name from the address.**

## 6. To send it

There is no admin send UI yet; that is motion D-5. Today this is one call to the
existing helper, run by Constantin:

```bash
node -e "require('./brandgeo-dashboard/netlify/functions/_email').sendBrandedEmail({ to:'RECIPIENT', replyTo:'contact@getbrandgeo.com', subject:'...', heading:'...', paragraphs:[...], cta:{label:'View your results',url:'https://app.getbrandgeo.com'} })"
```

It needs `RESEND_API_KEY` in the environment. **The loop must not run this**: it
sends to a real customer, which is withheld, and it needs a secret, which is
also withheld.
