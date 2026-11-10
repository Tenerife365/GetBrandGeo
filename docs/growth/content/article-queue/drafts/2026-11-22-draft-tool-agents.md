# Draft: from tracking to acting, the agent features in AI visibility tools

- Queue key: `draft-tool-agents`
- Publish on: 2026-11-22 (queue row `ready from 2026-11-22`)
- Type: comparison
- Written 2026-11-06 in a separate session. The brief marked this "after one check": read
  the Peec release itself. Result: the GlobeNewswire release (22 Oct 2026) answered 403 to
  our client, so it was not read. Peec's own launch post and its documentation were read
  instead, and they are the vendor's own pages, which is what the brief's angle asks for
  ("checked on each vendor's own page"). Trade coverage figures that appear only in
  secondary reports (a "30 skills" count, a four-category split of Actions) are left out;
  Peec's own post says three categories. Check passed on that basis.
- Every claim is a vendor claim and is labelled as one in the article. Nothing was tested.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | Peec AI blog, 21 Oct 2026: https://peec.ai/blog/turn-opportunities-into-impact-with-peec-agent-and-actions | primary (vendor) | agent in the sidebar; built-in and custom skills; more than 25 connections (project management, content publishing, CRM, analytics, outreach), named Linear, HubSpot, Customer.io, PostHog, Clay, lemlist; changes need approval first; included in every plan; actions in three categories (technical fixes, on-page, off-page); monthly agent credits shared across the company |
| 2 | Peec AI docs, Agent: https://docs.peec.ai/agent | primary (vendor) | read-only analysis needs no approval; changes need Approve; Auto toggle per chat; connector tools Always allow, Ask or Never, read-only ones start on Always allow; routines Read-only, Ask before changes, Change without asking; credits per month Starter 500, Pro or Essentials 750, Advanced or Growth 1,000, Scale 1,500, Comprehensive or Enterprise 3,000; unused credits do not roll over |
| 3 | Sitecore press release, 3 Jun 2026: https://www.sitecore.com/company/newsroom/press-releases/2026/06/sitecore-acquires-scrunch-to-help-brands-influence-discovery--and-buying-decisions | primary (vendor) | Scrunch's Agent Experience Platform (AXP); recommendations to be automated within SitecoreAI Content Management, Content Marketing and Digital Asset Management; connects directly to Sitecore workflows |
| 4 | Profound press release, 15 Sep 2026: https://www.tryprofound.com/newsroom/profound-raises-usd180m-series-d-at-usd1-8b-valuation-to-build-the-ai-platform-for-marketing-teams | primary (vendor) | AI Marketer, described as an agent that scans brand data, analyzes AI answers and surfaces opportunities, deploying sub-agents; finds earned media opportunities, refreshes stale content, runs competitive analysis, analyzes paid ad performance; Context Manager; Ads Studio across OpenAI, Google and Meta ad managers |

No person's name: executives are not quoted.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 to 4. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-22", date_label="November 22, 2026", read=6,
    tags=["Tool Comparison", "AI Agents", "AI Visibility Tools"],
    title="From Tracking to Acting: What the Agent Features in AI Visibility Tools Say They Do",
    h1="From Tracking to Acting: <em>Agents</em> in AI Visibility Tools",
    h1_plain="From Tracking to Acting: Agents in AI Visibility Tools",
    subtitle="At least three AI visibility vendors now sell an agent, not just a dashboard: Peec AI, Scrunch under Sitecore, and Profound. We read each one's own pages and set out what each says its agent does, what it can change without asking, and what to ask before you let one near your site.",
    meta_desc="Peec Agent, Scrunch's AXP inside Sitecore and Profound's AI Marketer, compared from each vendor's own pages: what the agent does, what it changes, and what to ask.",
    og_desc="AI visibility tools are adding agents that act, not just report. What Peec, Scrunch and Profound say theirs do, and the approval settings that matter, from the vendors' own pages.",
    ld_desc="BrandGEO comparison of the agent features announced by AI visibility vendors Peec AI, Scrunch (a Sitecore company) and Profound in 2026, based only on each vendor's own published pages, with the questions a buyer should ask before using one.",
    keywords="peec agent, peec ai actions, scrunch axp sitecore, profound ai marketer, ai visibility tool agents, geo tool comparison 2026, ai search optimization agent",
    about=["AI Visibility Tools", "AI Agents", "Marketing Software", "Generative Engine Optimization"],
    findings=[("3", "AI visibility vendors compared here whose own pages describe an agent that acts, not only a dashboard that reports"),
              ("25+", "connections Peec says its agent can use, from project management to CRM and publishing"),
              ("500 to 3,000", "monthly agent credits by Peec plan, shared across a company, unused credits lost"),
              ("Approval first", "Peec's stated default before its agent makes a change; it can be switched to act without asking")],
    faq=[("What is an agent in an AI visibility tool?",
          "In the vendors' own words, it is a feature that goes past reporting how AI engines describe a brand and starts doing work on it: writing briefs, refreshing content, creating tasks in other tools or acting inside a content system."),
         ("Does Peec Agent change things without asking?",
          "By default, no. Peec says read-only analysis needs no approval and any change needs an approval click first. Users can turn on an Auto setting for a chat, and routines can be set to change things without asking."),
         ("What does Scrunch do now that Sitecore owns it?",
          "Sitecore's announcement says Scrunch's recommendations will be automated within SitecoreAI's content management, content marketing and digital asset management products, and that Scrunch connects directly to Sitecore workflows."),
         ("Does BrandGEO have an agent like these?",
          "No. BrandGEO runs the questions your buyers ask, stores what each engine answered and suggests what to fix. A person makes the change.")],
    related=[("/brandgeo-vs-peec.html", "Peec", "BrandGEO vs Peec AI",
              "How the two products differ, side by side."),
             ("/brandgeo-vs-scrunch.html", "Scrunch", "BrandGEO vs Scrunch",
              "How the two products differ, side by side."),
             ("/brandgeo-vs-profound.html", "Profound", "BrandGEO vs Profound",
              "How the two products differ, side by side.")],
    cta_h="Start by reading what the engines say",
    cta_p="Before any tool acts on your content, see what the engines say about you. Run the free audit on your own domain. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Tool Comparison",
        lines=[[("From Tracking", "w")], [("to ", "w"), ("Acting", "g")]],
        sub=["The agent features in AI visibility",
             "tools, from the vendors' own pages."],
        stats=[("3", "vendors compared, each selling an agent", "Peec, Scrunch, Profound"),
               ("25+", "connections Peec says its agent uses", "Peec AI, Oct 2026"),
               ("500 to 3,000", "monthly agent credits by Peec plan", "Peec docs"),
               ("Approval first", "Peec's default before a change", "Can be switched off")],
        footer="Ask Before It Acts",
    ),
    body="""  <p>For most of the short history of AI visibility tools, the product was a dashboard. It ran questions through ChatGPT, Gemini and the rest, recorded whether your brand came up, and showed you a chart. Over 2026 at least three vendors have started selling something else: an agent that takes the findings and does work with them.</p>

  <p>We read what Peec AI, Scrunch and Profound say about their agents on their own pages. This is not a test of any of them. It is a side by side of their claims, so you know what to ask.</p>

  <div class="callout">
    <div class="callout-label">Sources, and what they cannot tell you</div>
    <p>Everything below is a vendor claim, read on 6 November 2026 from <a href="https://peec.ai/blog/turn-opportunities-into-impact-with-peec-agent-and-actions" target="_blank" rel="noopener">Peec AI's launch post</a> (21 October 2026) and <a href="https://docs.peec.ai/agent" target="_blank" rel="noopener">its documentation</a>, <a href="https://www.sitecore.com/company/newsroom/press-releases/2026/06/sitecore-acquires-scrunch-to-help-brands-influence-discovery--and-buying-decisions" target="_blank" rel="noopener">Sitecore's announcement of its Scrunch acquisition</a> (3 June 2026), and <a href="https://www.tryprofound.com/newsroom/profound-raises-usd180m-series-d-at-usd1-8b-valuation-to-build-the-ai-platform-for-marketing-teams" target="_blank" rel="noopener">Profound's funding announcement</a> (15 September 2026). We used none of these products for this article. BrandGEO sells a competing product; read this with that in mind.</p>
  </div>

  <h2>The three, side by side</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>Peec AI</th><th>Scrunch (a Sitecore company)</th><th>Profound</th></tr></thead>
    <tbody>
      <tr><td>Name used</td><td>Peec Agent, with Actions</td><td>Agent Experience Platform (AXP)</td><td>AI Marketer</td></tr>
      <tr><td>What the vendor says it does</td><td>Answers questions about your Peec data, runs ready-made analyses it calls skills, and makes changes in Peec or in connected tools</td><td>Recommendations automated inside SitecoreAI's content tools</td><td>Scans brand data and AI answers, surfaces opportunities, sends sub-agents to do the work</td></tr>
      <tr><td>Where it acts</td><td>More than 25 connected tools: project management, publishing, CRM, analytics, outreach</td><td>Sitecore's content management, content marketing and asset management products</td><td>Earned media, content refreshes, competitive analysis, paid ads</td></tr>
      <tr><td>Approval</td><td>Changes need approval by default; can be switched to act without asking</td><td>Not stated in the announcement</td><td>Not stated in the announcement</td></tr>
      <tr><td>Pricing of the agent</td><td>Monthly credits by plan, 500 to 3,000</td><td>Not stated</td><td>Not stated</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Peec AI: the most detail on paper</h2>

  <p>Peec announced its agent in a post dated 21 October 2026, and its documentation is the most specific of the three. The agent sits in the sidebar of the app. It comes with built-in skills, which Peec describes as ready-made analyses, and lets you write your own. It connects to more than 25 outside tools; the launch post names Linear, HubSpot, Customer.io, PostHog, Clay and lemlist, and the documentation adds Notion, Lovable and Webflow.</p>

  <p>The recommendations it works from fall into three categories, in Peec's words: technical fixes, on-page improvements and off-page improvements.</p>

  <p>The approval settings are the part worth reading closely. Read-only analysis needs no approval. A change, such as creating a prompt or a topic, needs an approval click. An Auto toggle approves actions for the rest of a chat, and a setting can make Auto the default. Each connected tool can be set to always allow, ask, or never, and read-only tools start on always allow. Scheduled routines can run read-only, ask before changes, or change without asking.</p>

  <p>The agent runs on credits: 500 a month on Starter, 750 on Pro or Essentials, 1,000 on Advanced or Growth, 1,500 on Scale and 3,000 on the top tiers, shared across the company. Unused credits do not roll over.</p>

  <h2>Scrunch: an agent inside a content platform</h2>

  <p>Sitecore bought Scrunch in June 2026. Its announcement describes Scrunch's Agent Experience Platform and says Scrunch's recommendations will be automated within SitecoreAI's content management, content marketing and digital asset management products, with Scrunch connecting directly to Sitecore workflows. In practice that puts the agent next to the content itself, for companies already on Sitecore. The announcement says nothing about approval settings or pricing for the automation.</p>

  <h2>Profound: an agent called a marketer</h2>

  <p>Profound described its AI Marketer in its September 2026 funding announcement as an agent that scans a brand's data, analyzes AI answers and surfaces opportunities, then deploys sub-agents to act on them. The tasks listed are finding earned media opportunities, refreshing stale content, running competitive analysis and analyzing paid ad performance. The same announcement describes an Ads Studio for building and managing AI search campaigns across OpenAI, Google and Meta's ad managers. Approval and pricing for the agent are not covered there.</p>

  <h2>What to ask before you let one act</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td>What can it change without a click from me?</td><td>Defaults can be switched; know what "auto" covers</td></tr>
      <tr><td>Which of my accounts does it log into?</td><td>A connector to your site or CRM is write access</td></tr>
      <tr><td>Where is the log of what it did?</td><td>You need to undo a change you did not make</td></tr>
      <tr><td>What happens when credits run out mid-task?</td><td>A half-finished change can be worse than none</td></tr>
      <tr><td>What evidence does each suggestion rest on?</td><td>An agent acting on one odd AI answer can chase noise</td></tr>
    </tbody>
  </table>
  </div>

  <p>The last question matters most for AI visibility. AI answers vary from run to run and engine to engine. In our own 591 local answers, the same question got very different kinds of answer from each of five engines. An agent that rewrites a page because one engine said one thing once is acting on thin ground.</p>

  <h2>Where BrandGEO stands</h2>

  <p>BrandGEO does not have an agent that changes your website, content or ads. It runs the questions your buyers ask, stores what each engine answered, and suggests what to fix. A person decides and makes the change. That is a choice about where we are today, not a claim that the other approach is wrong.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you are trialling one of these agents, start it in read-only mode and keep approvals on. Read the evidence behind each suggestion before approving it, and check what the AI answers actually say about you before and after any change.</p>
    <p>Whatever tool you use, the ground truth is the answer itself. Read it.</p>
  </div>""",
))
```
