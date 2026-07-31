# LinkedIn Posts: Batch, 2026-07-17

Weekly draft from the automated Friday LinkedIn content step. No Monday roadmap or Wednesday content run has happened yet this week (both are new tasks, first scheduled runs are 2026-07-20 and 2026-07-22 per CLAUDE.md §9.23) and no new ROADMAP-*.md file exists at the repo root, so this batch falls back to a direct CLAUDE.md read, per the documented fallback for this exact gap week.

Nothing new published to the site this week beyond what already has its own LinkedIn content: BG-017 and the published Zenodo paper (2026-07-16) already got a native Article plus two teaser posts (`linkedin-article-published-paper-2026-07-16.md`, `linkedin-teaser-posts-published-paper-2026-07-16.md`), all confirmed live. So this batch draws on real, already-published-but-not-yet-featured-on-LinkedIn material, following the "pick the next thing in the sequence" fallback: the Dublin city study (the 7th and final city in the research program, published 2026-07-10 but never covered on LinkedIn), BG-014 (the multilingual AI visibility gap), BG-015 (measurement methodology), and one behind-the-scenes engineering/trust story each for personal and company voice.

Eight posts total, split into two sections below. Every post cites its real source. Checked for em dashes with a direct grep on the finished file, zero found.

---

## PERSONAL PROFILE POSTS

Human founder voice, first person, matching the reference tone in `linkedin-posts-2026-07-14.md`.

### Post 1: Dublin closes out the 7-city research program

We just finished the last city in our research program: Dublin.

Seven cities now. London, Berlin, Madrid, New York, Paris, Rome, and now Dublin. Same method every time: real prompts, fed to real AI engines, compared directly.

Dublin gave us the strongest consensus we've seen anywhere in the whole program. Ask which project management tool startups should use, and every single engine says Monday.com. Ask about business banking, and every engine says Revolut. Both unanimous, 4 out of 4.

Compare that to Rome, the other end of the spectrum, where we found zero categories with any real agreement at all.

But the finding that actually surprised me was smaller and stranger. One engine, Meta AI, kept giving the same answer regardless of what was actually asked. Ask for boutique, independent financial advisors and ask for large institutional wealth managers, and Meta gave us almost the same list both times. The other three engines clearly told the difference apart. One didn't.

That is not a visibility problem for a brand. That is a reasoning gap in the engine itself, and it is the kind of thing you only find by actually running the queries and reading what comes back.

Full findings: [link to /ai-visibility-for-dublin.html]

*Source: BrandGEO's own City Research Program, Dublin dataset (client research-dublin), 8 real prompts across 4 engines, July 2026.*

### Post 2: Most AI training data is in English. That is a real problem if your brand isn't.

Here is a number that should worry any brand outside the English-speaking world: roughly 90 percent of the pretraining data behind Llama 2 was in English.

We wrote about what that actually means for AI visibility, and one stat from that research stuck with me. The same query, asked in English versus Spanish, can produce up to a 5x swing in which brands get cited, based on a 3.25 billion citation study across 7 models and 14 countries.

We saw this ourselves in our own city research. In Berlin, we asked the identical HR software question in German and in English. One engine answered fully in German and returned nothing usable in English. A different engine did the exact opposite on the same question.

If your product is genuinely global, "we're visible to AI" is not one number. It is a number per language, and right now most tools measuring AI visibility don't even ask the question that way.

Full research: [link to /bg-014.html]

*Source: Meta's own published Llama 2 training data composition; Profound's cross-language citation study; BrandGEO's own Berlin city research, both cited in BG-014.*

### Post 3: The same data can give you two completely different AI visibility scores

I found this uncomfortable when I first read the research, so I want to share it directly.

Depending on how you define "AI visibility," the exact same underlying data can swing by 11 points. Mention-based scoring, position-weighted scoring, and citation-based scoring are three genuinely different measurements, not three names for the same thing.

There's also this: only around 30 percent of brands stay visible if you re-run the identical prompt against the same engine a second time. And ChatGPT and Perplexity only agree on which domains they cite about 11 percent of the time, for the same queries.

If a tool hands you one number and doesn't tell you which of those methodologies produced it, or how stable that number is on a re-run, you should ask. We built our own scoring around six separate dimensions specifically because a single number was hiding too much.

Full breakdown: [link to /bg-015.html]

*Source: LLM Pulse methodology comparison and cross-engine domain-overlap research, both cited in BG-015.*

### Post 4: We found a bug where our own advice engine could lie to a paying client

This one is a bit uncomfortable to admit publicly, but I think it matters more than the wins.

We generate AI-written recommendations for clients on our done-for-you plans. Real, actionable advice on what to fix. Except we found the underlying data feeding those recommendations could include API errors counted as real failures, and prose mentions of a competitor's name counted as if that competitor had actually outranked our client, when they'd never been ranked once.

Worse: nothing we ever told a client was actually saved anywhere. If someone asked "what did you tell me to do three weeks ago, and did it work," we genuinely could not have answered that question.

We fixed both. The inputs are now cleaned before they ever reach the model that writes the advice. And every single recommendation we generate now gets permanently recorded, timestamped, with the exact data snapshot that produced it, in a system built so the content can never be silently edited after the fact.

If you are paying someone for AI-generated advice and they cannot show you a record of what they told you and when, that is worth asking about.

*Source: internal product audit, documented in full in CLAUDE.md §14 of BrandGEO's own engineering log.*

---

## COMPANY PAGE POSTS

Distinct copy from the personal posts above, more official and product-and-data-forward, matching the reference tone in `linkedin-company-posts-2026-07-15.md`. Never a verbatim reshare of the personal section, even where the underlying finding overlaps.

### Post 1: Dublin completes BrandGEO's 7-city AI Visibility Research Program

BrandGEO has completed research in Dublin, the seventh and final city in its ongoing AI Visibility Research Program, following London, Berlin, Madrid, New York, Paris, and Rome.

Dublin produced the strongest cross-engine agreement recorded anywhere in the program: a unanimous 4-of-4 engine consensus on Monday.com for project management software, and an equally unanimous 4-of-4 consensus on Revolut Business for business banking. That places Dublin at the opposite end of the consensus spectrum from Rome, where the same research method found zero categories with meaningful engine agreement.

The research also surfaced a distinct engine-level pattern not seen as clearly in prior cities: one engine, Meta AI, repeatedly returned near-identical answers for genuinely different queries, for example collapsing "boutique, independent financial advisors" and "large institutional wealth managers" into the same recommendation set, where the other three engines tested consistently differentiated between them.

Full Dublin findings: [link to /ai-visibility-for-dublin.html]

*Source: BrandGEO's own City Research Program, Dublin dataset, 8 commercial-buyer prompts across 4 AI engines, July 2026.*

### Post 2: New research: the AI visibility gap between languages

New research from BrandGEO: "Why Your Brand Might Be Invisible to AI Outside English."

The starting point is a real number from Meta's own published documentation: roughly 90 percent of the training data behind Llama 2 was in English. Independent research from Profound, covering 3.25 billion citations across 7 models and 14 countries, found the same query can produce up to a 5x swing in brand citations depending on the language it was asked in.

BrandGEO's own multi-city research corroborates this directly. In Berlin, the identical HR-software query was answered fully in German by one engine, and returned nothing usable in English from that same engine, while a different engine showed the reverse pattern on the same question.

For any brand operating outside a single, English-only market, this means AI visibility is not one number. It needs to be measured per language and per market, which is a core part of how BrandGEO's own monitoring is built.

Full research: [link to /bg-014.html]

*Source: Meta's published Llama 2 training data composition; Profound's cross-language citation study; BrandGEO's own Berlin city research, all cited in BG-014.*

### Post 3: Behind the product, monitoring now runs independent of your browser

A real infrastructure upgrade worth sharing, not just a research finding.

Until recently, running an AI visibility collection at BrandGEO meant keeping a browser tab open for the full duration, sometimes well over an hour for a client tracking a large prompt set. That does not scale, and it is not how a monitoring product should work.

BrandGEO's collection pipeline now runs entirely server-side through a scheduled queue and background worker. A client (or an admin on their behalf) starts a collection run, the browser polls for progress, and the actual work continues even if the tab is closed. The same upgrade also added real spend guardrails: hourly ceilings scaled to each plan, and monthly budget caps enforced automatically, both platform-wide and per client.

It is the kind of change that does not show up in a screenshot, but it is what makes a "daily refresh" or a "weekly refresh" plan actually mean what it says.

*Source: BrandGEO engineering log, collection queue architecture shipped and verified live July 15, 2026.*

### Post 4: New research, the AI visibility number that changes depending on how you define it

New research from BrandGEO: "Beyond 'Are We Mentioned?': The AI Visibility KPIs That Actually Matter."

The core finding is uncomfortable for anyone relying on a single AI visibility score: the same underlying dataset can swing by 11 points depending on whether it is measured by raw mention rate, position-weighted ranking, or citation frequency. These are three genuinely different methodologies, not interchangeable labels for one metric.

Two supporting findings compound the problem. Re-running an identical prompt against the same engine shows only around 30 percent of brands staying visible from one run to the next. And ChatGPT and Perplexity agree on which domains they cite for the same query only about 11 percent of the time.

This is the direct rationale behind BrandGEO's own 6-dimension scoring model rather than a single headline number: a single metric hides too much of what is actually happening underneath it.

Full research: [link to /bg-015.html]

*Source: LLM Pulse methodology comparison and cross-engine domain-citation-overlap research, both cited in BG-015.*

---

## LINKEDIN NEWSLETTER ISSUE

Skipped this week. No new AI Visibility Index issue published (Issue #1, from 2026-07-14, is still the only one; CLAUDE.md's own note on the Index is explicit that a new issue should only be drafted once roughly 30 days have passed and there is genuine new trend data, never just because a scheduled task ran). Nothing to adapt into a Newsletter issue this week.

## NATIVE LINKEDIN ARTICLE

Skipped this week. The most recent native LinkedIn Article, covering the published Zenodo/arXiv paper, went live just one day before this run (2026-07-16, `linkedin-article-published-paper-2026-07-16.md`). Per the "roughly every 3-4 weeks, not every single week" cadence, republishing another BG-article as a native Article this soon would be premature. Next candidate, once due: BG-016 ("Cross-Engine Consensus, When AI Engines Agree, and When They Don't") is the strongest unpublished-as-native-Article candidate, since it is the direct plain-language basis for the peer-reviewable paper already covered.
