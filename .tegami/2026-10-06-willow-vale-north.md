---
packages:
  'npm:@2digits/tlo-mcp': major
---

## Use the official Orbit proxy as the default MCP server

- Replaced the default cookie adapter with the OAuth-backed proxy. Run `tlo-mcp login` before starting `tlo-mcp`.
- Moved the previous cookie-based tools to `tlo-mcp legacy`; existing cookie configurations must add the `legacy` argument.
