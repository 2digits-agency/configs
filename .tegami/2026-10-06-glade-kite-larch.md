---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Encode week requests in the requested timezone

- Aligned `getWeek` dates with the supplied timezone, defaulting to `Europe/Amsterdam` instead of the host timezone.
