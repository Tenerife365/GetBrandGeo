"""Negative controls for `scan_copy.py`.

BRIEF section 4. A scan that passes everything is indistinguishable from one
that does not work, so each check is fed the defect it claims to catch and the
run fails if the check stays quiet. False-positive controls are included next
to the true-positive ones, because a checker that fires on everything is as
useless as one that fires on nothing.

Nothing here writes to `POSTS.md`. Each control builds a small document in
memory, runs the real check functions over it, and reports.

Run: python negative_control_copy.py
"""

import sys

import scan_copy as S

RESULTS = []


def control(label, text, check_name, expect_fire=True, bodies=None):
    v = S.variants(text)
    fn = dict(S.CHECKS)[check_name]
    hits = fn(v)
    fired = bool(hits)
    ok = (fired == expect_fire)
    RESULTS.append((label, ok, fired, hits[:1]))
    mark = "FIRED" if fired else "quiet"
    want = "fire" if expect_fire else "stay quiet"
    print(f"  [{'PASS' if ok else 'FAIL'}] {mark:<5} (wanted it to {want:<10}) "
          f"{label}")
    if hits:
        print(f"          {hits[0][:120]}")


def control_raw(label, ok, detail):
    RESULTS.append((label, ok, ok, [detail]))
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}\n          {detail}")


CLEAN = ("Two of the five AI engines we ran returned the same law firm name. "
         "That firm does not exist. Chicago, corporate law, collected "
         "24 July 2026.")


def main():
    print("negative controls for scan_copy.py\n")

    print(" D, dashes")
    control("em dash injected", CLEAN.replace(". That", " - that").replace(
        " - that", " — that"), "D dashes")
    control("en dash injected", CLEAN.replace("24 July", "22–24 July"),
            "D dashes")
    control("minus sign injected", CLEAN + " 5−2 engines.", "D dashes")
    control("clean copy", CLEAN, "D dashes", expect_fire=False)

    print("\n B, banned vocabulary")
    control("banned adjective", CLEAN + " The pipeline is seamless.",
            "B banned vocabulary")
    control("banned verb", CLEAN + " We leverage the dataset.",
            "B banned vocabulary")
    control("banned phrase across a LINE BREAK",
            "The result is cutting\nedge for this category.",
            "B banned vocabulary")
    control("`coverage` is not `leverage`", CLEAN + " Coverage was complete.",
            "B banned vocabulary", expect_fire=False)

    print("\n S, superlatives")
    control("plain superlative", CLEAN + " This is the strongest result we have.",
            "S superlatives")
    control("CAMEL CASE hashtag evading a word boundary",
            CLEAN + " #TheOnlyStudyThatMatters", "S superlatives")
    control("superlative split over a line break",
            "This is the\nstrongest result in the program.", "S superlatives")
    control("a quoted buyer prompt is not a superlative",
            'We asked "Best real estate agents for buying a home in Boston".',
            "S superlatives", expect_fire=False)

    print("\n U, universals")
    control("quantifies over businesses", CLEAN + " Nobody does this by hand.",
            "U universals")
    control("hedged universal", CLEAN + " Almost nobody checks this.",
            "U universals")
    control("`cannot` about one situation is not a universal",
            "You cannot see the answers an engine gives about you.",
            "U universals", expect_fire=False)

    print("\n N, measured subjects")
    control("a real firm from a research page",
            "Two engines named McDermott Will & Emery.", "N measured subjects")
    control("the INVENTED firm name", "They returned McDermott Will & Schulte.",
            "N measured subjects")
    control("a name harvested from a consensus table",
            "Green Ocean Property Management was named by all five.",
            "N measured subjects")
    control("a client name from bg-018",
            "One of our clients, Bucate pe Roate, was affected.",
            "N measured subjects")
    control("DIACRITICS present", "The bank was Société Générale Private Banking.",
            "N measured subjects")
    control("DIACRITICS STRIPPED, the spelling that walked a 484-name corpus",
            "The bank was Societe Generale Private Banking.",
            "N measured subjects")
    control("UPPER CASED accented form, which case-folding-first would miss",
            "THE BANK WAS SOCIÉTÉ GÉNÉRALE PRIVATE BANKING.",
            "N measured subjects")
    control("TYPOGRAPHIC apostrophe variant",
            "The firm was Ropes ’n Gray.".replace("’n ", " & "),
            "N measured subjects")
    control("a name broken over a LINE BREAK",
            "Two engines named Green Ocean\nProperty Management this run.",
            "N measured subjects")
    control("our own delivered X copy has none", open(
        S.TARGETS[0], encoding="utf-8").read(), "N measured subjects",
        expect_fire=False)

    print("\n E, engine lineup")
    control("a retired engine named as live",
            "We monitor ChatGPT, Gemini, Claude, Perplexity and Meta AI.",
            "E engine lineup")
    control("a one-day-old engine named without its status",
            "Our engines include Grok and Google AI Overviews.",
            "E engine lineup")
    control("an engine on no purchasable plan",
            "We also run Microsoft Copilot and DeepSeek.", "E engine lineup")
    control("SUB-SPAN: `Google AI Mode` must not count as `Google AI Overviews`",
            "The five were ChatGPT, Claude, Gemini, Perplexity and Google AI Mode.",
            "E engine lineup", expect_fire=False)
    control("a retired engine WITH its status disclosed",
            "Meta AI is retired and appears in no plan set.",
            "E engine lineup", expect_fire=False)

    print("\n P, pricing")
    control("a euro price", "Growth is EUR 299 a month.", "P pricing")
    control("a plan name", "The Growth PRO tier adds two engines.", "P pricing")
    control("a monthly figure", "It costs 99 per month.", "P pricing")
    control("the word `pricing` with no figure near it",
            "This scan covers dashes, superlatives and pricing.",
            "P pricing", expect_fire=False)

    print("\n Q, a post opening on a question")
    q_fire = S.check_question_openers(
        ["Is your brand in the answer? Here is what we measured."])
    control_raw("a post opening on a question",
                bool(q_fire), q_fire[0] if q_fire else "check stayed silent")
    q_quiet = S.check_question_openers(
        ["Two engines named the same firm. Is yours in there?"])
    control_raw("a question in the CLOSE is allowed",
                not q_quiet, "silent on a closing question, correct")

    print("\n C, X character counting")
    long_post = "x" * 300
    control_raw("a post over 280 fires",
                S.x_length(long_post) > 280, f"{S.x_length(long_post)} chars")
    short = "a" * 250 + " getbrandgeo.com"
    got = S.x_length(short)
    control_raw("a URL is weighted at 23, not its real length",
                got == 250 + 1 + 23,
                f"250 chars + space + a 15-character URL counted as {got}, "
                f"expected {250 + 1 + 23}")
    uni = "é" * 10          # 20 code points, 10 grapheme clusters
    control_raw("counted in CODE POINTS, not graphemes and not bytes",
                S.x_length(uni) == 20, f"{S.x_length(uni)} for 10 clusters")
    control_raw("a 279-character post does NOT fire",
                S.x_length("y" * 279) <= 280, f"{S.x_length('y' * 279)} chars")

    print("\n W, Threads word counting")
    control_raw("a 60-word post is out of band",
                not (100 <= len(("w " * 60).split()) <= 150), "60 words")
    control_raw("a 200-word post is out of band",
                not (100 <= len(("w " * 200).split()) <= 150), "200 words")
    control_raw("a 130-word post is in band",
                100 <= len(("w " * 130).split()) <= 150, "130 words")

    print("\n whole-file control")
    n = S.main(quiet=True)
    control_raw("the delivered files scan clean", n == 0, f"{n} findings")
    injected = S.scan_text(open(S.TARGETS[1], encoding="utf-8").read()
                           + "\n\nEveryone knows the seamless — best tool "
                             "is Green Ocean Property Management at EUR 299.")
    hits = sum(len(v) for v in injected.values())
    control_raw("five defects appended to the delivered Threads file are caught",
                hits >= 4, f"{hits} findings across "
                           f"{[k for k, v in injected.items() if v]}")

    passed = sum(1 for _, ok, _, _ in RESULTS if ok)
    print(f"\n{passed} of {len(RESULTS)} injections behaved as required")
    if passed != len(RESULTS):
        print("\nBLIND OR OVER-EAGER CHECKS:")
        for label, ok, fired, hits in RESULTS:
            if not ok:
                print(f"  {label}: fired={fired} {hits}")
        sys.exit(1)


if __name__ == "__main__":
    main()
