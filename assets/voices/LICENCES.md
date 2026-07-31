# Voice model licences

Checked 2026-07-29 by reading each MODEL_CARD and, where it said "See URL",
following that URL to the actual licence file. Piper's own code is MIT. **That
does not cover the voice models.** Each one carries its own terms.

BrandGEO is a commercial product, so any NonCommercial licence is disqualifying.

## In use

**`en_US-libritts-high`, speaker 42.** CC BY 4.0, dataset
<http://www.openslr.org/60/>. 904 speakers, high quality tier, 22,050Hz.

Speaker 42 was chosen by measuring fundamental frequency across a spread of
speaker ids rather than by guessing: the map carries no gender field, so 20
speakers were synthesised and their median F0 measured by autocorrelation over
voiced frames. Nine landed in the male range of 85 to 165Hz. Speaker 42 measured
**95.0Hz**, the deepest of them; speaker 6 measured 113.1Hz and is the runner-up.

**CC BY 4.0 requires attribution, and that obligation travels with every
published asset.** One line in the video description satisfies it:

> Voice: LibriTTS (openslr.org/60), CC BY 4.0

This is the one operational cost of choosing it over a CC0 voice. It was accepted
because libritts-high is the ONLY high-quality-tier voice with a usable licence.
Every other commercially clean male English voice is medium tier.

## Also clean, kept as fallbacks

| Voice | Licence | Obligation |
|---|---|---|
| `en_US-joe-medium` | CC0 | none |
| `en_US-mike-medium` | CC0 | none |
| `en_US-john-medium` | public domain (LibriVox) | none |

`en_US-norman-medium` and `en_US-bryce-medium` are also public domain and
`en_US-sam-medium` is Apache 2.0, all fine, just not downloaded.

If the attribution line ever becomes awkward, `joe` is the drop-in replacement
and costs only the quality tier.

## Blocked

See `_BLOCKED-do-not-use/README.md`. Short version: `en_US-ryan-high` and
`en_US-hfc_male-medium` are CC BY-NC-SA 4.0, and `en_GB-alan-medium` traces to a
directory whose LICENSE reads "All Rights Reserved".

## No clean British male voice exists in Piper

The only one is `en_GB-northern_english_male-medium` at CC-BY-SA 4.0. Share-alike
on generated audio is legally unsettled and not worth testing on marketing
output. **If a British voice is wanted, Piper cannot supply it and the backend
has to change.**

## Note on where this is headed

This is an interim choice. The intent is to clone Constantin's own voice, which
removes the licence question entirely because the source recording is his. The
reference recording script is at `docs/growth/voice/REFERENCE-SCRIPT.md` and is
still valid for that.
