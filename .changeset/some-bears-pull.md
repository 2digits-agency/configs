---
'@2digits/tlo-mcp': patch
---

Fix MCP server schema compatibility with @effect/ai

- Replaced `Schema.optionalWith` with `Schema.optional` in tool definitions to avoid unsupported transformations
- Added plain struct versions of error schemas for MCP tool failure responses
- Applied defaults manually in handlers instead of schema layer
- Wrapped array responses in object structures (`{ projects }`, `{ messages }`, `{ activities }`)
