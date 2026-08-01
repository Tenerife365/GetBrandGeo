# Contrast, measured

Output of `python render_linkedin_images.py`. Every foreground and background
pair is registered by `reg()` at the point it is drawn, so this table is what the
twelve files actually contain rather than a palette the design intended. sRGB
relative luminance, 4.5:1 for body text, 3.0:1 for large text and for non-text
indicators. The script exits non-zero if any pair fails, so a clean render is
itself the assertion.

`#8b5cf6` appears only as a fill, never as a text colour. Accent words use
`#a78bfa`.

One pair failed on the first render and was fixed rather than excused: the
redaction bars on `li-01` were drawn in `#32333c` on `#101116`, which measures
**1.50:1** against a 3:1 floor for a meaningful non-text indicator. They are
`#7d838f` now, 4.95:1.

The lockup clear-space assertion is in the same script and is a pixel
measurement, not a declared-rect list. It failed on four layouts before they were
tightened, including one that cleared by 0.6px, which is a rounding artefact
rather than a margin.

```
rendered 12 files
  feed\li-01-same-wrong-name-1200x1200.png                   1200x1200  97759 bytes
  feed\li-02-language-picked-the-list-1080x1350.png          1080x1350  104240 bytes
  feed\li-03-pages-contradict-1200x1200.png                  1200x1200  93641 bytes
  feed\li-04-what-five-of-five-counts-1200x1200.png          1200x1200  82507 bytes
  carousel\li-c-01-1080x1350.png                             1080x1350  68340 bytes
  carousel\li-c-02-1080x1350.png                             1080x1350  80463 bytes
  carousel\li-c-03-1080x1350.png                             1080x1350  66090 bytes
  carousel\li-c-04-1080x1350.png                             1080x1350  71827 bytes
  carousel\li-c-05-1080x1350.png                             1080x1350  55213 bytes
  carousel\li-c-06-1080x1350.png                             1080x1350  83115 bytes
  carousel\li-c-07-1080x1350.png                             1080x1350  71286 bytes
  carousel\li-c-08-1080x1350.png                             1080x1350  95891 bytes
drawn strings written for 12 files, 161 strings total

CONTRAST, sRGB relative luminance, measured on the pairs actually drawn
fg        bg          ratio   need  verdict used for
#8b5cf6   #0a0b0e      4.65    3.0  PASS   accent bar fill
#7d838f   #101116      4.95    4.5  PASS   card label
#7d838f   #101116      4.95    3.0  PASS   redaction bar
#7d838f   #0a0b0e      5.17    4.5  PASS   ChatGPT's collection failed on eve
#f87171   #16171e      6.46    4.5  PASS   chip NO SUCH FIRM
#f87171   #101116      6.82    4.5  PASS   verdict label
#a78bfa   #101116      6.93    4.5  PASS   panel value
#a78bfa   #0a0b0e      7.23    3.0  PASS   h1 accent
#9ba1ac   #101116      7.26    4.5  PASS   card body
#9ba1ac   #101116      7.26    3.0  PASS   verdict body
#9ba1ac   #0a0b0e      7.58    4.5  PASS   No other engine returned that list
#9ba1ac   #0a0b0e      7.58    3.0  PASS   16 of our 27 city pages carry a cl
#fb923c   #101116      8.33    3.0  PASS   big count
#34d399   #16171e      9.29    4.5  PASS   verdict label
#c4b5fd   #101116     10.21    3.0  PASS   big count
#e8e9ed   #16171e     14.73    3.0  PASS   verdict body
#e8e9ed   #101116     15.54    3.0  PASS   city name
#e8e9ed   #101116     15.54    4.5  PASS   panel value
#e8e9ed   #0a0b0e     16.22    3.0  PASS   figure
#e8e9ed   #0a0b0e     16.22    4.5  PASS   city
pairs measured: 20, failures: 0
```
