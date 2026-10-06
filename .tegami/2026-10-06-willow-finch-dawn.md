---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Classify legacy HTTP 401 responses as authentication failures

- Returned `TloAuthError` for HTTP 401 while preserving HTTP 403 and other failure classifications without replaying requests.
