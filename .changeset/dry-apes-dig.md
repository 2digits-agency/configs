---
'@2digits/tlo-mcp': minor
---

Add `get_board_todos` tool to search kanban board todos

- Added `getBoardTodos` method to `BoardService` calling `/ajax/board/GetTodos` endpoint
- New MCP tool `get_board_todos` with `boardId` (required), `query`, `boardListId`, and `limit` parameters
- Query filter performs case-insensitive partial match on todo name (client-side)
- Added `TodoSummary` schema and `todoSummaryFromRaw` transformer
- Exported `TodoSummary`, `todoSummaryFromRaw`, and `GetBoardTodosParams` from package index
