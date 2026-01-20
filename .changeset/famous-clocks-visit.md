---
'@2digits/tlo-mcp': patch
---

Add TeamLeader Orbit API client package

- Added Effect-based HTTP client for TLO's private AJAX API
- Implemented `TimeService` with `getWeek`, `createActivity`, `updateActivity`, `deleteActivity`
- Implemented `BoardService` with `getProjects`, `getMessages`, `setTaskState`
- Created typed schemas for API requests/responses (`ActivityRaw`, `ProjectRaw`, `MessageRaw`)
- Added tagged errors (`TloApiError`, `TloAuthError`, `TloNetworkError`, `TloParseError`)
- Provided `TloLive` layer for easy service composition
