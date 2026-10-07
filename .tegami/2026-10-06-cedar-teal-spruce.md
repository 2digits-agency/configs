---
packages:
  'npm:@2digits/tlo-mcp': minor
---

## Authenticate with Orbit using local OAuth

- Added `tlo-mcp login` with browser authorization, PKCE and automatic token refresh, plus `tlo-mcp logout` to remove local credentials.
- Bounded browser startup and registration timeouts, and allowed later discovery attempts after temporary failures.
