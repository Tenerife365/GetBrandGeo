# 07. YouTube

Shorts plus long-form. The Short is a standalone argument, not a trailer for the
long-form.

---

## 7a. Shorts, 52 seconds (TOFU)

**Driver:** Curiosity gap.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-2s | Black. One line of white text snaps on: **"Which of these 7 engines is lying to you?"** Seven engine marks fade up beneath it. | "One of these seven is not doing what you think it is." |
| 2-8s | Marks arrange in a grid. A magnifier icon appears over six of them. The seventh stays bare. | "Six of them go and search the web when you ask a question. One answers from memory." |
| 8-16s | Split panel. Same prompt, two answers, ranked lists that differ at positions 2 and 4. Differences circled in violet. | "Ask both the same question and you get two different rankings. The one answering from memory is describing the market as it was before its training cutoff." |
| 16-24s | Card slides in: "OPENED MARCH 2026". It greys out and falls off the right panel. | "A business that opened this year does not exist to it. It cannot. It was never in the training data." |
| 24-33s | Second card: "CLOSED 2024" glowing at rank 3 on the right panel. | "And a competitor that shut down two years ago can still be sitting at number three, being recommended to your customers." |
| 33-42s | Full frame text: **"we removed one from our own product"**. Counter ticks 6 to 5. | "We build one of these tools. On the sixteenth of July we removed an engine from our own product for exactly this. Our advertised engine count went down." |
| 42-48s | Counter ticks 5 to 7. Grok and AI Overviews marks resolve, each with a check. | "Today two went in. Grok, which reads X as well as the web, and Google AI Overviews, the summary sitting above the links on an ordinary search. Seven engines. All seven retrieve." |
| 48-52s | End card: **"Ask your tool which of theirs do."** Small URL beneath. | "Ask your tool which of theirs do." |

**Title:** `Which of your 7 AI engines is answering from memory?`
**Note:** the title is a question, which the competitive teardown found that zero
of ten competitors use in a headline. That finding was about landing page
headlines where a yes/no answer lets the reader leave. On a Short the question is
the retention mechanism, so it stands. Do not carry this pattern to a landing page.

---

## 7b. Long-form, 8 to 10 minutes (MOFU)

**Driver:** Concrete proof.

**Title:** `We removed an AI engine from our own product. Here is the test it failed.`

**Hook script, first 30 seconds, written out because this is the only part that
decides watch time:**

> On the sixteenth of July we deleted an engine from our own pricing page.
>
> Not deprecated. Not moved to a lower tier. Removed, from every plan, including
> the ones people were already paying for.
>
> It was Meta AI, it had been in the product since we launched, and the reason we
> cut it is a problem that I think is sitting inside most of the AI visibility
> reports being sold right now. Including, possibly, the one you are looking at.
>
> So I want to show you the test it failed, run the same test against the five
> engines we kept and the two we shipped today, and give you the four questions to
> put to whoever sells you this.

**Outline:**

| Section | Minutes | Content |
|---|---|---|
| 1. The deletion | 0:00-1:00 | Hook above. Show the actual commit and the actual pricing page diff. |
| 2. What retrieval means | 1:00-2:30 | Same prompt, one engine with search on, one off. Two rankings side by side. No slides, screen recording. |
| 3. Why the failure is silent | 2:30-3:30 | The two outputs look identical. This is the section that earns the rest of the video. |
| 4. The Meta AI decision | 3:30-5:00 | Why the models reachable in that path were training-data only. What replaced it: Google AI Mode, which is what Google users actually see. |
| 5. The two we turned down | 5:00-6:30 | DeepSeek: every model reachable through OpenRouter is retrieval-free. Copilot: no public API, so anyone claiming coverage is measuring something adjacent. |
| 6. Why Grok got in | 6:30-7:15 | It fails the test alone and passes with the web plugin on. Plus the X access, which none of the others have. |
| 6b. AI Mode is not AI Overviews | 7:15-8:00 | The distinction most tools collapse. One is a tab you opt into, the other is the block above the links that nobody opts into. Show both surfaces side by side on a real query. Note that "no AI Overview rendered" is recorded as a result, not an error. |
| 7. The four questions | 8:00-9:30 | Straight to camera, no graphics. Was search on. When you say Google, which Google. Which engines have never returned a row. What is your removal standard. |
| 8. The uncomfortable part | 9:30-10:00 | This argument stops favouring us the moment a competitor runs eight with retrieval on, and it is still the right standard. No CTA card over this. Audit link in description. |

**Description first two lines, the only part visible unexpanded:**
> On 16 July 2026 we removed Meta AI from BrandGEO because it answered from
> training data with no web search. Here is the test it failed, and the four
> questions to ask any AI visibility vendor.

**Chapters:** use the section table above verbatim as timestamps.

---

## Notes

- **Safe area on the Short.** Use the YouTube Shorts insets from
  `docs/growth/channel-specs-2026-07-29.md`, not Meta's. They differ, and the
  Short is not a re-crop of the Reel even though both are 1080x1920. The 33 to 42
  second full-frame text card and the 48 to 52 second end card are the two beats
  that will collide with UI chrome.
- **Encoding:** `-movflags +faststart` on every export.
- Section 2 needs a real screen recording of a real side-by-side. **If that
  capture does not exist by the time the send gate clears, cut the long-form and
  ship the Short alone.** A reconstructed comparison in a video whose whole
  argument is about honest measurement is not a trade worth making.
- No end-screen CTA card over section 8. It undercuts the point.
- **Hold both until the send gate clears.**
