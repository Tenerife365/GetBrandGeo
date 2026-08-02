# BG-021 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-09-30, morning slot
**Cover image:** `brandgeo/web/images/bg-021-hero.png`, live at
`https://getbrandgeo.com/images/bg-021-hero.png`. **Measured 1600x900, ratio
1.778.** That is exactly LinkedIn's Article cover ratio (1920x1080 is the same
1.778), so this one crops nothing at all. No OG card exists for BG-021 and none
is needed for this purpose: the hero is a better Article cover than the eight
og-bg cards in this series, which are 1200x630 at ratio 1.905 and lose roughly
7% of their width. Upload as is.

**Suggested title:**
We Shipped Two AI Engines Today. The More Useful Story Is the Two We Turned Down.

**Alternative titles:**
- Engine Count Is the Easiest Number in This Category to Fake
- Why We Retired One Engine and Still Will Not Add Two Others

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

Every tool in this category advertises a number. Five engines, seven, twelve. The number is easy to raise and it is almost never the thing that determines whether your measurement is any good.

Here is the question that separates them: when that engine answered, did it go and look, or did it answer from memory? Those produce different answers to the same question, and only one of them tells you anything about today.

What an engine without retrieval is actually measuring

A large language model with no retrieval answers from its training data. Ask it which companies do commercial catering in a given city and it will give you a confident, fluent, well formatted list of what was true at some point before its training cutoff.

For brand visibility work that is close to useless, and worse, it is convincingly useless. A business that launched this year is invisible to it. A business that has been quietly winning for eighteen months is invisible to it. A competitor that shut down two years ago may still be ranked third. You get a clean number, a tidy chart, and a picture of the past. The failure is silent. Nothing in the output says this answer is from memory. It reads exactly like the engines that did go and look.

We retired an engine over this

BrandGEO monitored Meta AI until 16 July 2026. It is not in any plan now. The reason was retrieval. The Llama models we could reach ran training data only, with no web search available in that path. It kept producing answers that looked plausible and were structurally incapable of reflecting what had changed. For a product whose job is telling you what AI engines say about your brand right now, an engine that cannot see right now is not a feature. It is a number on a pricing page that makes the product worse. Removing it lowered our engine count. We did it anyway.

The same reasoning keeps DeepSeek out

DeepSeek comes up regularly. It is capable, it is cheap, and adding it would move our advertised number up by one. Every DeepSeek model available to us through OpenRouter is retrieval free. It would answer from training data only, the identical shape that got Meta AI retired, so adding it would mean reversing a decision we had just made, for the sole benefit of a larger number on a marketing page.

Copilot is out for a different reason. Microsoft ships no public API for it, so anyone claiming to monitor Copilot is either using an undocumented path or measuring something adjacent and calling it Copilot. We would rather say we do not cover it.

The standard, stated once: an engine earns a slot when we can query it with retrieval switched on, through a documented path, for every run that produces a customer's report. Capability is not enough. "The model supports web search" and "web search was enabled in our pipeline" are different claims, and only the second one is worth anything to you.

The first engine we added today: Grok

Grok went live on 29 July 2026, on Growth PRO and above. It passed the same test, but only just, and only because of a specific configuration choice. Grok on its own answers from training data. We run it with the web plugin enabled, which is what makes it a measurement instrument rather than a memory test. Had that not been available, Grok would have joined DeepSeek on the outside.

The second reason it earned a slot is that it reads something the others do not. Grok is xAI's model, and it has access to X. The rest see the open web: your site, your listings, publisher coverage, review sites. Plenty of brands have a strong web footprint and a thin social one, or the reverse. Those brands look different to Grok, and until now that gap was not something you could measure.

The second one is the one most tools are missing

We also added Google AI Overviews today, as a separate engine from Google AI Mode, which we have monitored since 16 July. That distinction is the point, and it gets collapsed constantly. They are two different Google products. AI Mode is a tab, and the searcher has to switch to it on purpose, reaching people who opted in. AI Overviews is the AI summary block at the top of an ordinary results page, and nobody opts in to see it, reaching a very large share of ordinary searches.

A tool that measures AI Mode and reports it as Google is describing the surface fewer people see and calling it the whole picture. We measure both, separately, because they disagree often enough that averaging them would hide the thing you need to know. If Google renders no AI Overview at all for a query, we record that as a measurement rather than a failed collection: whether an AI summary appears above the links for the questions your customers ask is itself a finding.

What the ladder looks like now

Free carries Gemini. Radar carries Gemini and Claude. Essentials carries ChatGPT, Gemini and Claude. Growth adds Perplexity and Google AI Mode. Growth PRO and above adds Grok and Google AI Overviews. Seven engines at the top, every one of them retrieving. That is not a coincidence of which models we happened to pick. It is the entry requirement, and it is why the list is seven and not twelve. Every paid plan refreshes weekly.

Four questions worth asking your current vendor

None of this is unique to us in principle. Any tool could adopt the same standard. Most do not publish enough for you to check, so ask directly. For each engine listed, was web search actually enabled when it was queried, not merely supported by the model. When a vendor says they monitor Google, which Google: AI Mode, AI Overviews, or one reported as though it were both. Which engines in the list have never actually returned a result for your account, since an engine can sit on a pricing page for months without collecting anything. And what is the standard for removing an engine: everyone has an add an engine story, but ask for the remove an engine story, because a list that only ever grows is a marketing artifact.

The uncomfortable version of this

This argument stops favouring us the moment a competitor runs eight engines with retrieval on. That is fine. It is the correct standard even when it costs us the comparison, and it is one we have already applied against our own interest twice, by retiring an engine we had shipped and by declining a cheap one we could have added this month. Engine count is the easiest number in this category to move and the least informative. Ask what was switched on.

Read the full piece: https://getbrandgeo.com/bg-021-retrieval-not-engine-count.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-021

See which of the seven mention your own brand: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-021#free-audit

---

## Subheads to bold after pasting

What an engine without retrieval is actually measuring · We retired an engine over this · The same reasoning keeps DeepSeek out · The first engine we added today: Grok · The second one is the one most tools are missing · What the ladder looks like now · Four questions worth asking your current vendor · The uncomfortable version of this

## Verification notes

Every figure and claim is taken from
`brandgeo/web/bg-021-retrieval-not-engine-count.html`: the 7 engine count, the
29 July 2026 additions (Grok, Google AI Overviews), the 16 July 2026 Meta AI
retirement and its stated reason, the DeepSeek and Copilot exclusions and their
separate reasons, the stated standard for earning a slot, the Grok web plugin
detail and its access to X, the Google AI Mode versus AI Overviews distinction
and the table describing each surface, the four vendor questions, and the
closing "uncomfortable version" admission. Nothing was recalculated or
invented.

**The plan ladder is the ONE thing here deliberately NOT copied from the
published article, and it must stay that way.** `bg-021-retrieval-not-engine-count.html`
was published 29 July 2026 and its visible body still reads "Free: ChatGPT".
That became false on 31 July 2026 under ruling decision 1b, which moved the free
tier to Gemini so a free signup could finish its own first collection inside the
EUR 0.30 budget. `planConfig.ts`, the source of truth, now reads
`free: ['gemini']`, and that same live page's own JSON-LD already carries the
corrected line, "Free includes Gemini; Radar includes Gemini and Claude;
Essentials includes ChatGPT, Gemini and Claude." So the page contradicts itself:
corrected in its structured data, stale in its visible copy.

Reproducing the stale ladder would have broadcast a false claim about our own
pricing to a LinkedIn audience. The ladder above is therefore taken from
`planConfig.ts` and matches the page's JSON-LD. Radar, which did not exist when
the article was written, is included for the same reason.

**Open item for the site, not for this asset:** the visible ladder in
`bg-021-retrieval-not-engine-count.html` needs the same correction. Until it is
fixed, do not quote that section of the page anywhere.
