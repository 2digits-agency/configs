## @2digits/tlo-mcp@0.1.32

### Update `effect` to 4.0.0-rc.112



### Update `@effect/platform-node` to 4.0.0-rc.112

## @2digits/tlo-mcp@0.1.31

### Update `effect` to 4.0.0-rc.111



### Update `@effect/platform-node` to 4.0.0-rc.111

## @2digits/tlo-mcp@0.1.30

### Update `effect` to 4.0.0-rc.110



### Update `@effect/platform-node` to 4.0.0-rc.110

## @2digits/tlo-mcp@0.1.29

### Upgrade the Effect runtime to v4 RC 108

Both command-line applications now run on `effect`, `@effect/platform-node`, and `@effect/vitest` version
`4.0.0-rc.108`. The upgrade removes the former independently versioned Effect packages and adopts the consolidated
Effect v4 module layout.

### Update the 2DIGITS configuration CLI

- Migrate CLI commands and flags to Effect v4's consolidated CLI modules while preserving the existing command-line
  options and setup workflows.
- Run filesystem, path, terminal, and process operations through the Effect v4 Node services.
- Migrate package-manager command execution to the v4 child-process service, including streamed output, exit-code
  handling, and command failures.
- Structure setup and package-manager workflows as named generator-based Effect operations, with typed operation errors
  and exhaustive matching for setup choices and optional configuration.
- Use Effect's collection and predicate modules for dependency checks, workspace discovery, and task aggregation while
  preserving the CLI's existing public service methods.
- Preserve unknown `turbo.json` fields while decoding, updating, and formatting configuration through the v4 Schema
  APIs.
- Update service construction and layer wiring to Effect v4 without changing the setup behavior for Prettier, ESLint,
  project detection, or Turborepo.
- Update the test runtime and child-process test doubles for Effect v4; the CLI's 85 service tests continue to cover
  package-manager commands, configuration migration, workspace discovery, and generated scripts.
- Provide the process spawner and command recorder from one shared test layer so package-manager commands are spawned
  and observed through the same service instance.

### Update the Teamleader Orbit MCP server

- Migrate the MCP server, toolkit, tools, and standard-input transport to Effect v4's consolidated AI modules and
  current MCP protocol support.
- Migrate Teamleader HTTP requests to the v4 HTTP client modules while preserving session-token redaction, cookies,
  response decoding, and typed network/API/parse errors.
- Keep request, response-decoding, and error-classification business logic in named generator-based Effect operations,
  using exhaustive matching for Teamleader's normal and malformed error responses.
- Apply defaults in the board and time services instead of duplicating them in MCP transport handlers, and use Effect's
  collection, record, string, predicate, and matching modules for response transformations and request construction.
- Preserve ISO date input behavior and Teamleader's compact date conversion while moving schemas to the v4 Schema
  APIs.
- Reject non-finite numeric IDs, counts, budgets, durations, and pagination values at schema boundaries instead of
  allowing values that cannot be represented safely by the Teamleader JSON API.
- Construct decoded domain models and typed API errors through the v4 Schema class factories, preserving validation
  and Effect language-service support.
- Update service and layer construction for board, time, configuration, and HTTP services.
- Continue supporting the existing project, task, board, message, and time-entry tools with the same external MCP tool
  names and parameters.
- Add focused client-boundary coverage for successful responses, API failures, malformed Teamleader errors, and invalid
  JSON responses.

### Update Effect v4 to RC 109



### Adopt Effect's TypeScript tooling

- Switched type checking to the stable TypeScript 7 native compiler, patched once at the workspace root with `effect-tsgo`.
- Enabled the full Effect diagnostic profile, including stricter errors and test-specific overrides.

## @2digits/tlo-mcp@0.1.28

### Declare service shapes as properties

- Rewrote `BoardServiceShape`, `TimeServiceShape` and `TeamLeaderClientShape` members as `readonly` function properties, so their parameters type-check contravariantly
- Fixed `TimeServiceShape.getWeek` to return the `Activity` class type instead of `typeof Activity.Type`

## @2digits/tlo-mcp@0.1.27

### Update @effect/platform-node to 0.108.1



### Update @effect/rpc to 0.76.2

## @2digits/tlo-mcp@0.1.26

### Update @effect/cli to 0.77.0



### Update @effect/platform to 0.97.1



### Update effect to 3.22.1



### Update @effect/experimental to 0.61.1



### Update @effect/rpc to 0.76.1



### Update @effect/language-service to 0.87.1

## @2digits/tlo-mcp@0.1.25

### Update Effect ecosystem dependencies

- Updated `@effect/platform` to 0.97.0

# @2digits/tlo-mcp

## 0.1.24

### Patch Changes

- bfb16bd: Update Effect ecosystem dependencies

  - Updated `effect` to 3.22.0
  - Updated `@effect/cli` to 0.76.0, `@effect/platform` to 0.96.3, and `@effect/platform-node` to 0.108.0
  - Updated `@effect/ai` to 0.37.0, `@effect/experimental` to 0.61.0, and `@effect/rpc` to 0.76.0
  - Updated `@effect/language-service` to 0.87.0 and `@effect/vitest` to 0.30.0

## 0.1.23

### Patch Changes

- 7916d9c: Update @effect/language-service to 0.86.6

## 0.1.22

### Patch Changes

- 3103077: Update @effect/language-service to 0.86.4

## 0.1.21

### Patch Changes

- e88c38d: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.4
  - Updated `@effect/platform` to 0.96.2

## 0.1.20

### Patch Changes

- 433d415: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.3
  - Updated `@effect/cli` to 0.75.2
  - Updated `@effect/platform-node` to 0.107.0
  - Updated `@effect/ai` to 0.36.0
  - Added fully qualified Effect service and error tags in `@2digits/cli`

## 0.1.19

### Patch Changes

- cb2b172: Update @effect/language-service to 0.86.2

## 0.1.18

### Patch Changes

- 44b9d5a: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.2
  - Updated `@effect/platform` to 0.96.1
  - Updated `@effect/rpc` to 0.75.1

## 0.1.17

### Patch Changes

- 211e03f: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.1
  - Updated `@effect/cli` to 0.75.1

## 0.1.16

### Patch Changes

- 8be7864: Update @effect/language-service to 0.85.1

## 0.1.15

### Patch Changes

- cd7f884: Update @effect/language-service to 0.84.1
- 1b758b7: Update @effect/language-service to 0.84.2

## 0.1.14

### Patch Changes

- c5af9ba: Update @effect/language-service to 0.83.1

## 0.1.13

### Patch Changes

- 85ba774: Update @effect/language-service to 0.83.0
- 85ba774: Update TypeScript to 6.0.2

## 0.1.12

### Patch Changes

- 48fa6c3: Update Effect ecosystem dependencies
  - Updated `effect` to 3.21.0
  - Updated `@effect/cli` to 0.75.0, `@effect/platform` to 0.96.0, `@effect/platform-node` to 0.106.0
  - Updated `@effect/ai` to 0.35.0, `@effect/experimental` to 0.60.0, `@effect/rpc` to 0.75.0
  - Updated `@effect/vitest` to 0.29.0

## 0.1.11

### Patch Changes

- 180fa00: Update Effect ecosystem dependencies
  - Updated `effect` to 3.20.0
  - Updated `@effect/cli` to 0.74.0, `@effect/platform` to 0.95.0, `@effect/platform-node` to 0.105.0
  - Updated `@effect/ai` to 0.34.0, `@effect/experimental` to 0.59.0, `@effect/rpc` to 0.74.0
  - Updated `@effect/vitest` to 0.28.0

## 0.1.10

### Patch Changes

- 7355a63: Update @effect/language-service to 0.79.0

## 0.1.9

### Patch Changes

- 706014f: Update @effect/language-service to 0.77.0

## 0.1.8

### Patch Changes

- d22e0ed: Update @effect/language-service to 0.76.0

## 0.1.7

### Patch Changes

- d643f5d: Update effect to 3.19.19 and @effect/language-service to 0.75.1
  - Updated `effect` to 3.19.19
  - Updated `@effect/language-service` to 0.75.1

## 0.1.6

### Patch Changes

- a33b04c: Update Effect dependencies to latest patch versions
  - Updated `effect` to `3.19.18`
  - Updated `@effect/rpc` to `0.73.2`

## 0.1.5

### Patch Changes

- 590eea0: Update Effect dependencies to latest versions
  - Updated `effect` to 3.19.17
  - Updated `@effect/platform` to 0.94.5
  - Updated `@effect/rpc` to 0.73.1

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
