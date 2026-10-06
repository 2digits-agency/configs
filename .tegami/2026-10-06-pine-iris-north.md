---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Decode valid JSON before checking legacy error envelopes

- Restricted malformed legacy error parsing to complete envelopes after JSON decoding failed, preventing false errors from ordinary response strings.
