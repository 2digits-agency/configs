---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Fix Teamleader environment configuration with current Effect APIs

- Replaced `Config.string` and `Config.redacted` with `Config.String` and `Config.Redacted`, preserving default values and session-token redaction.
