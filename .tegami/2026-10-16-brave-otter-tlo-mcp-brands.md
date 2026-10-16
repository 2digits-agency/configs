---
packages:
  'npm:@2digits/cli': patch
  'npm:@2digits/tlo-mcp': patch
---

## Brand tagged errors

- Added unique brands to CLI setup and package-manager errors, and to MCP gateway, Orbit client, and OAuth session errors, preventing structurally identical values from satisfying those error types
