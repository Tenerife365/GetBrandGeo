# BrandGEO — Affiliate, Referral & Influencer Partnership Strategy

> **Status: research complete, no platform chosen, no code/integration built.** This is a
> decision document, not an implementation — nothing here is live. Written 2026-07-16
> in response to Constantin's request to research commission-based partner platforms
> (sales-only vs. sales+backlink), plus a two-stage roadmap for influencer partnerships
> and customer referral links. All platform/pricing facts below are from live 2026 web
> research, not assumed.

---

## 1. The three programs, kept structurally separate

Constantin's request actually names three different program types. They get confused in
casual conversation but are genuinely different mechanisms with different tooling and
different ideal partners — worth keeping distinct from day one so the commission
structure doesn't get muddled later:

| Program | Who | What they get | Typical tool |
|---|---|---|---|
| **Affiliate / partner** | External publishers, review sites, agencies, consultants | % commission per sale they drive | PartnerStack, Rewardful, Tolt, FirstPromoter, Reditus |
| **Influencer** | Individual creators with an audience (LinkedIn, YouTube, newsletter) | % commission per sale, sometimes + a flat fee for reach | Same tooling as affiliate — this is really a *sub-type* of affiliate, not a separate system |
| **Customer referral** | Your own existing users | % commission (or credit) for referring a friend/colleague | GrowSurf, Viral Loops, or the same affiliate tool if it has a referral mode |

Recommendation: **do not build three separate systems.** Nearly every modern tool in the
first row also handles referral links, and "influencer" is just an affiliate with a
recognizable name and a higher expected volume — same mechanism, same tracking, possibly
a different (better) commission rate. One tool, three partner *types* inside it, is the
right architecture — cheaper, and one dashboard to actually manage instead of three.

---

## 2. Affiliate/partner platform comparison

All Stripe-native or Stripe-compatible — relevant because BrandGEO already runs Stripe
Payment Links + a webhook auto-provisioning flow for Essentials/Growth (per CLAUDE.md
§10 in `brandgeo-dashboard`), so a Stripe-native tool plugs into existing checkout with
no new payment infrastructure.

| Platform | Pricing | Fit for BrandGEO today | Notes |
|---|---|---|---|
| **Reditus** | Free until $1,000 MRR from affiliates; then usage-based (never a cut of your commissions), free tier up to ~$12K generated ARR + B2B marketplace access | 🟢 **Best starting point** | Purpose-built for B2B SaaS, has its own affiliate marketplace (real people looking for SaaS products to promote), zero upfront cost while volume is low |
| **Tolt** | $49/mo (Basic) → $99/mo (Growth, adds auto-payouts) → $199/mo (Pro) → custom above $50K/mo affiliate revenue | 🟢 Strong alternative | 2-way Stripe sync (auto-detects subscribe/cancel/refund and adjusts commission), 0% transaction fees, "launch in 10 minutes" |
| **Rewardful** | Similar tier structure to Tolt, Stripe/Paddle native | 🟢 Strong alternative | 2,600+ teams use it; simplest setup for referral links + coupon-tracked discounts + recurring commissions — this is the one built closest to the exact "give a 20% discount code, track the sale, pay commission" flow being asked for |
| **FirstPromoter** | From $49/mo, 0% transaction fees | 🟡 Good if plan-change accuracy matters | Best-in-class for handling upgrades/downgrades/plan changes correctly in commission math — more relevant once BrandGEO has real plan-mix complexity (Essentials → Growth upgrades etc.) than it is today |
| **PartnerStack** | No public pricing — sales-quoted, effectively $500+/mo, industry reporting puts it at platform fee + % of partner-driven revenue | 🔴 **Not yet — revisit at scale** | The real prize here is its marketplace (100,000+ B2B-focused partners actively looking for SaaS products), but the price only makes sense once there's real commission volume to show; premature for a pre-revenue-scale program |

**Recommendation: start with Reditus (free while small) or Rewardful/Tolt (cheap, closest
match to the exact discount-code + commission mechanic described).** Move to PartnerStack
later specifically to tap its 100K-partner marketplace once there's a track record
(real commission payouts, a real conversion rate) to recruit affiliates with — nobody
joins an affiliate program with zero proof it converts.

---

## 3. The sales-only vs. sales+backlink question — answered directly, not softened

**Short answer: treat this as sales-only. Do not select or design the program around
backlink/SEO value — that's not how it legitimately works, and reaching for it risks
violating both Google's policies and BrandGEO's own standing rules.**

Verified against Google's current (2026) developer documentation and recent SEO
analysis:

- Google explicitly requires that **any link involving a commercial relationship —
  including affiliate links — be marked `rel="sponsored"`** (or `rel="nofollow"` as a
  fallback). This isn't optional guidance, it's Google's stated spam policy.
- Google's own systems are **designed to not pass PageRank/ranking authority through a
  correctly-tagged sponsored link.** A properly-run affiliate program, by design,
  produces links that carry **zero SEO backlink value** — that's the intended behavior of
  the ecosystem, not a loophole to route around.
- Chasing do-follow links *specifically because* they're affiliate placements is, at
  best, asking partners to violate Google's disclosure rules on your behalf, and at
  worst is exactly the kind of link-manipulation scheme this project's own standing rule
  (`rules/content-integrity.md`, CLAUDE.md §0) has repeatedly and explicitly refused to
  build — see §9.15/§9.18/§9.19's documented refusals of link-injection requests. Using
  the new affiliate program as a backdoor into that same pattern would undo that
  standing, and it's also just bad SEO practice at this point (Google actively watches
  for it).

**What's real and worth wanting instead:** an affiliate/review-site placement can still
carry genuine value that has nothing to do with link equity — being **named and
recommended in real, independently-written content** (a "best AI visibility tools"
roundup, a genuine comparison article, a creator's honest review) is exactly the kind of
organic mention that both traditional search *and* AI engines pick up on, and it's
literally the exact signal BrandGEO's own product measures and sells. That value comes
from being a genuinely good, genuinely recommended product — not from a link tag. Worth
saying to affiliates plainly: "mark your links per Google's disclosure rules, we're not
asking for anything else" — it's the correct policy and it costs nothing, since the real
value was never going to be the backlink anyway.

**Bottom line for the structure decision:** size commissions purely against expected
customer LTV and conversion likelihood (§4), not against any assumed SEO upside. There
isn't one to price in.

---

## 4. Proposed structure — the "20% discount + commission" mechanic

This is the standard, well-supported pattern (Rewardful/Tolt/FirstPromoter/Reditus all
do this natively via a tracked coupon code): the affiliate gets a unique referral
link/code, the buyer gets a discount when they use it, the affiliate gets a commission
on the resulting sale, tracked automatically through Stripe.

**Benchmarks found in research** (B2B SaaS norms, 2026):
- Standard recurring commission range: **20–40%** of the subscription value, for as
  long as the customer stays subscribed (this is what makes SaaS affiliate programs
  attractive to partners — Semrush, HubSpot and similar all run in this range).
- Some programs pay **first-payment-only** commission instead of ongoing recurring —
  simpler to reason about, cheaper long-run, but a weaker incentive for an affiliate to
  send *retained* customers rather than one-time signups.
- Cookie/attribution windows are typically 30–90 days.

**Concrete options mapped to BrandGEO's real pricing tiers** (per `PRICING-SPEC.md`) —
not a final decision, a starting menu for Constantin to pick from:

| Option | Buyer discount | Affiliate commission | Applies to |
|---|---|---|---|
| A — simple, first payment only | 20% off first invoice | 20% of first payment | Essentials, Growth |
| B — recurring, matches SaaS norm | 20% off first invoice | 25% recurring, first 6 months | Essentials, Growth |
| C — aggressive launch incentive | 20% off first invoice | 30% recurring, first 3 months, then 15% ongoing | Essentials, Growth |

**A real constraint worth flagging before picking a number:** per `SCALE-SPEC.md`'s own
9%-of-plan-price API cost budget (CLAUDE.md §12.2/§12.4), Essentials (€99) already
carries real marginal API cost (~€9/mo). Stacking a 20% buyer discount *and* a 20–30%
affiliate commission on top of an already cost-constrained tier means the **net margin
on an Essentials sale through this channel could go negative in the first month.** This
isn't a reason not to do it — customer acquisition cost is normal to eat upfront — but
it should be a **deliberate, sized decision**, not a default. Worth running the actual
numbers per tier before locking a %.

**Recommendation on scope:** launch this on **Essentials and Growth only** (self-serve,
Stripe-checkout tiers — the affiliate flow is native to how these already sell).
Managed/Pro/Enterprise are sales-assisted, manually onboarded (`onboard-client.js`, per
CLAUDE.md §5) — an affiliate commission on a deal that closes through a human sales
conversation is a different motion (closer to a referral fee/finder's fee than an
automated affiliate flow) and would need its own manual process, not the automated tool.

---

## 5. Stage 2 — Influencer partnerships

No separate platform needed at launch. An influencer is simply a higher-profile
affiliate — same tool, same tracked link, same commission mechanic — the only real
differences are (a) recruitment is direct outreach rather than the tool's open
marketplace, and (b) the commission offer may reasonably be sweetened (a flat bonus on
top of the standard %, or a higher tier reserved for named partners) to reflect their
reach.

**Sequencing recommendation:** don't start here. Launch the standard affiliate program
first (§2–4), get real conversion data (does a 20%-off code from an affiliate actually
convert, at what rate), then use that data as the pitch when approaching specific
GEO/AEO/marketing creators — "our affiliates convert at X%, average commission paid is
€Y" is a real, credible pitch; approaching influencers with a program that has zero
track record is a much harder sell.

---

## 6. Stage 3 — Customer referral program

Distinct audience (existing paying customers referring people they know) from external
affiliates, but often the same tooling. Two paths:

1. **Use the affiliate tool's own referral mode** — Rewardful and Tolt both explicitly
   support "referral links" as a built-in feature alongside affiliate tracking, so if
   one of those is chosen in §2, this may already be covered with zero extra
   integration.
2. **A dedicated tool** — GrowSurf (developer-friendly, JS SDK/REST API/webhooks, built
   for product-led-growth SaaS) or Viral Loops (template-driven, $49/mo, faster to
   launch with no engineering) if a genuinely separate, more polished in-app referral
   experience is wanted later.

**Recommendation:** don't build this separately at launch — confirm whether the §2 tool
choice already covers referral links (Rewardful/Tolt likely do), and only evaluate
GrowSurf/Viral Loops as a dedicated upgrade once there's a reason to want a more
custom in-app referral UI than the affiliate tool's default portal provides.

---

## 7. Recommended sequencing

1. **Pick one tool from §2** (Reditus or Rewardful/Tolt — all three are low-cost/free
   at BrandGEO's current volume and Stripe-native).
2. **Decide the commission structure** (§4) — needs Constantin's sign-off on the actual
   %, since it's a real margin decision, not something to default silently.
3. **Launch on Essentials + Growth only.** Confirm the discount-code flow works
   end-to-end against the live Stripe Payment Links already wired up
   (`brandgeo-dashboard/netlify/functions/stripe-webhook.js`, per CLAUDE.md §10) —
   this is the one piece of actual integration work, and it's small since the chosen
   tools are built for exactly this Stripe setup.
4. **Run it for real for 4–8 weeks**, get actual conversion/payout numbers.
5. **Only then** start direct outreach to influencers/creators (§5), using real
   numbers as the pitch, and only then consider PartnerStack's marketplace (§2) or a
   dedicated referral tool (§6) if the volume justifies the extra cost.

---

## 8. Open decisions for Constantin — not defaulted, need an explicit answer

1. **Which tool** from §2 (Reditus vs. Rewardful vs. Tolt vs. FirstPromoter)?
2. **Commission %** and whether it's first-payment-only or recurring, and for how long
   (§4 options A/B/C, or a different number)?
3. **Confirm scope = Essentials/Growth only** at launch, Managed+ excluded (§4)?
4. Who **builds/owns the integration** — this doc doesn't assume a chat/owner; per
   CLAUDE.md's existing convention this would likely be a `Master-Billing` or
   `Master-DashboardDesign` continuation once a tool is chosen, since it touches the
   same Stripe/webhook surface as the existing billing work.

Nothing above has been built. This is the research and structure Constantin asked for —
the next step is his decision on §8, then a scoped implementation session.
