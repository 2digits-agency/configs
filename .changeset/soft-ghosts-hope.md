---
'@2digits/tlo-mcp': patch
---

Fix date parameter validation for MCP tools

- Replaced `IsoDateString` (plain string) with `IsoDate` (`Schema.Date`) to validate ISO 8601 format at schema boundary
- Invalid date strings like `"not-a-date"` now fail with clear error instead of producing `"NaN-NaN-NaN"` API requests
- Removed redundant `new Date()` conversions in handlers since schema now provides `Date` objects
- Affected tools: `get_tasks_for_user`, `get_week_activities`, `create_activity`, `update_activity`
