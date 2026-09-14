---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Keep MCP diagnostics on stderr with current Effect APIs

- Replaced the removed `consolePretty` stderr option with `Logger.LogToStderr`, keeping stdout reserved for MCP protocol messages.
