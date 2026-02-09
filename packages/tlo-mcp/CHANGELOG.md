# @2digits/tlo-mcp

## 0.1.4

### Patch Changes

- 6cf78c5: Update Effect dependencies
  - Updated `@effect/platform` to 0.94.4

## 0.1.3

### Patch Changes

- 0877a3c: Update Effect dependencies
  - Updated `effect` to 3.19.16
  - Updated `@effect/cli` to 0.73.2
  - Updated `@effect/platform` to 0.94.3

## 0.1.2

### Patch Changes

- 6aec756: Update Effect dependencies
  - Updated `@effect/cli` to 0.73.1
  - Updated `@effect/platform` to 0.94.2
  - Updated `@effect/platform-node` to 0.104.1
  - Updated `effect` to 3.19.15

## 0.1.1

### Patch Changes

- 74fbec6: Enable tsgo for declaration file generation
  - Updated tsdown configs to use `dts: { tsgo: true }` for faster .d.ts generation

## 0.1.0

### Minor Changes

- bc95b2e: Add `get_board_todos` tool to search kanban board todos
  - Added `getBoardTodos` method to `BoardService` calling `/ajax/board/GetTodos` endpoint
  - New MCP tool `get_board_todos` with `boardId` (required), `query`, `boardListId`, and `limit` parameters
  - Query filter performs case-insensitive partial match on todo name (client-side)
  - Added `TodoSummary` schema and `todoSummaryFromRaw` transformer
  - Exported `TodoSummary`, `todoSummaryFromRaw`, and `GetBoardTodosParams` from package index

- ba8d11a: Add MCP server binary for Claude Desktop integration
  - Added `tlo-mcp` CLI binary using `@effect/cli` with stdio transport
  - Created 7 MCP tools: `get_projects`, `get_messages`, `set_task_state`, `get_week_activities`, `create_activity`, `update_activity`, `delete_activity`
  - Configuration via environment variables: `TLO_SESSION_TOKEN`, `TLO_BASE_URL`, `TLO_COOKIES`
  - Added `TloErrorSchema` union for tool failure responses with `failureMode: 'return'`
  - Added `@effect/experimental` and `@effect/rpc` dependencies for MCP server support

- ba8d11a: Refactor architecture and enable @effect/language-service build-time diagnostics
  - Extracted `TloConfig` and `TloHttpClient` into dedicated service modules
  - Added `TloConfigLive` layer with `TloConfigFromEnv` for configuration
  - Converted all imports to namespace style (`import * as Effect from 'effect/Effect'`)
  - Added `Effect.fn` span names to all service and handler methods for tracing
  - Enabled deterministic key patterns for service tags (e.g., `@2digits/tlo-mcp/services/BoardService`)
  - Added `prepare` script to patch TypeScript for build-time Effect diagnostics
  - Simplified `TloErrorSchema` to use tagged error classes directly
  - Removed `@typescript/native-preview` dependency

- ba8d11a: Add new MCP tools and improve tool descriptions for AI agents
  - Added 6 new tools: `get_project_details`, `get_tasks`, `get_tasks_for_user`, `get_todo_detail`, `move_todo`, `post_message`
  - Enhanced all 13 tool descriptions with workflow context, ID relationships, and usage hints
  - Added parameter examples (e.g., duration: 60=1h, 90=1.5h) and source references (e.g., "from get_projects")
  - Documented data hierarchy: FOLDER → PROJECT → TASK → ACTIVITY
  - Replaced incorrect CLI README with TLO-MCP documentation

### Patch Changes

- ba8d11a: Add TeamLeader Orbit API client package
  - Added Effect-based HTTP client for TLO's private AJAX API
  - Implemented `TimeService` with `getWeek`, `createActivity`, `updateActivity`, `deleteActivity`
  - Implemented `BoardService` with `getProjects`, `getMessages`, `setTaskState`
  - Created typed schemas for API requests/responses (`ActivityRaw`, `ProjectRaw`, `MessageRaw`)
  - Added tagged errors (`TloApiError`, `TloAuthError`, `TloNetworkError`, `TloParseError`)
  - Provided `TloLive` layer for easy service composition

- ba8d11a: Refactor internal implementation and simplify build config
  - Replaced custom `toUrlParams()` helper with `@effect/platform/UrlParams.fromInput()`
  - Fixed ternary expressions to follow preferred `x === undefined ? undefined : value` pattern
  - Simplified package.json exports to ESM-only shorthand
  - Removed unused dependencies (`@effect/cli`, `@effect/platform-node`, `nypm`, `pkg-types`, `unplugin-replace`)
  - Converted arrow functions to named functions for `mapHttpError()` and `mapParseError()`
  - Removed unused vitest setup file reference

- ba8d11a: Fix date parameter validation for MCP tools
  - Replaced `IsoDateString` (plain string) with `IsoDate` (`Schema.Date`) to validate ISO 8601 format at schema boundary
  - Invalid date strings like `"not-a-date"` now fail with clear error instead of producing `"NaN-NaN-NaN"` API requests
  - Removed redundant `new Date()` conversions in handlers since schema now provides `Date` objects
  - Affected tools: `get_tasks_for_user`, `get_week_activities`, `create_activity`, `update_activity`

- ba8d11a: Fix MCP server schema compatibility with @effect/ai
  - Replaced `Schema.optionalWith` with `Schema.optional` in tool definitions to avoid unsupported transformations
  - Added plain struct versions of error schemas for MCP tool failure responses
  - Applied defaults manually in handlers instead of schema layer
  - Wrapped array responses in object structures (`{ projects }`, `{ messages }`, `{ activities }`)

- ba8d11a: Simplify API response handling and add unit tests
  - Changed response parsing to expect raw data instead of `TloResponse` wrapper envelope
  - Added `isErrorResponse()` helper to detect API errors from response body
  - Fixed `ActivityRaw` schema to properly handle nullable fields with `Schema.NullOr()`
  - Added `RecordCount` optional field to `GetProjectsResponse`
  - Removed unused `SetTaskStateResponse` and `TloAuthError` from response handling
  - Replaced `tsx` dev dependency with `@effect/platform-node` for integration tests
  - Added unit tests for `BoardService`, `TimeService`, and error types
  - Added integration tests with real API calls
