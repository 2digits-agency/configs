---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Brand tagged errors and use namespace imports

- Added a unique brand to the `Schema.TaggedError` classes for gateway, OrbitClient, and OAuth session errors, so each error type is nominal and cannot be confused with a structurally identical error
- Switched Effect imports to namespace imports across source and tests; runtime behavior is unchanged
