---
packages:
  'npm:@2digits/tlo-mcp': major
---

## Remove the legacy cookie adapter

- Removed the `legacy` command, hand-written cookie tools and their exported services, schemas and layers.
- Removed support for `TLO_SESSION_TOKEN`, `TLO_COOKIES` and `TLO_BASE_URL`. Existing integrations must run `tlo-mcp login`, start `tlo-mcp` without arguments and migrate to official Orbit tool names and schemas.
