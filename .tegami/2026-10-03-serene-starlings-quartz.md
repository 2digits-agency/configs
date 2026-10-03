---
packages:
  'npm:@2digits/eslint-config': patch
---

## Update `globals` from 17.12.0 to 17.13.0

Recognize `SpeechRecognitionAlternative`, `SpeechRecognitionResult`, and `SpeechRecognitionResultList` as read-only browser globals, avoiding undefined-global errors for these APIs.
