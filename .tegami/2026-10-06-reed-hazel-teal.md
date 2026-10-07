---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Validate the legacy base URL during configuration loading

- Rejected malformed `TLO_BASE_URL` values before sending requests, preserving the default URL and configured trailing slashes.
