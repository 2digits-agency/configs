---
'@2digits/tlo-mcp': minor
---

Add MCP server binary for Claude Desktop integration

- Added `tlo-mcp` CLI binary using `@effect/cli` with stdio transport
- Created 7 MCP tools: `get_projects`, `get_messages`, `set_task_state`, `get_week_activities`, `create_activity`, `update_activity`, `delete_activity`
- Configuration via environment variables: `TLO_SESSION_TOKEN`, `TLO_BASE_URL`, `TLO_COOKIES`
- Added `TloErrorSchema` union for tool failure responses with `failureMode: 'return'`
- Added `@effect/experimental` and `@effect/rpc` dependencies for MCP server support
