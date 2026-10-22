---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Model the Orbit session as a schema class

- Changed `Session` from a `Schema.Struct` to a `Schema.Class`, so sessions are now created with `Session.make` instead of a plain object literal
- Moved `updateSession` and `needsRefresh` onto the class as the `Session.update` and `Session.needsRefresh` static methods
