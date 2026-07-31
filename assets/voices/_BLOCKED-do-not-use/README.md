# Do not use these voices

Both were downloaded on 2026-07-29 and then quarantined after reading their
MODEL_CARDs. Neither can be used for BrandGEO, which is a commercial product.

- `en_US-ryan-high` - dataset RyanSpeech, **CC BY-NC-SA 4.0**. NC means
  NonCommercial. Marketing a paid SaaS is commercial use.
- `en_GB-alan-medium` - MODEL_CARD says "License: See URL" pointing at
  MycroftAI/mimic3-voices `en_UK/apope_low`. That directory carries its own
  LICENSE reading "Copyright 2022 Mycroft AI / All Rights Reserved", which
  overrides the repo's CC BY-SA 4.0 default. No grant of use at all.

They are kept rather than deleted so nobody re-downloads them and repeats the
check. Piper's own MIT code licence does NOT cover the voice models.
