---
packages:
  'npm:@2digits/cli': patch
  'npm:@2digits/tlo-mcp': patch
---

## Upgrade the Effect runtime to v4 RC 108

Both command-line applications now run on `effect`, `@effect/platform-node`, and `@effect/vitest` version
`4.0.0-rc.108`. The upgrade removes the former independently versioned Effect packages and adopts the consolidated
Effect v4 module layout.

### Update the 2DIGITS configuration CLI

- Migrate CLI commands and flags to Effect v4's consolidated CLI modules while preserving the existing command-line
  options and setup workflows.
- Run filesystem, path, terminal, and process operations through the Effect v4 Node services.
- Migrate package-manager command execution to the v4 child-process service, including streamed output, exit-code
  handling, and command failures.
- Preserve unknown `turbo.json` fields while decoding, updating, and formatting configuration through the v4 Schema
  APIs.
- Update service construction and layer wiring to Effect v4 without changing the setup behavior for Prettier, ESLint,
  project detection, or Turborepo.
- Update the test runtime and child-process test doubles for Effect v4; the CLI's 85 service tests continue to cover
  package-manager commands, configuration migration, workspace discovery, and generated scripts.

### Update the Teamleader Orbit MCP server

- Migrate the MCP server, toolkit, tools, and standard-input transport to Effect v4's consolidated AI modules and
  current MCP protocol support.
- Migrate Teamleader HTTP requests to the v4 HTTP client modules while preserving session-token redaction, cookies,
  response decoding, and typed network/API/parse errors.
- Preserve ISO date input behavior and Teamleader's compact date conversion while moving schemas to the v4 Schema
  APIs.
- Reject non-finite numeric IDs, counts, budgets, durations, and pagination values at schema boundaries instead of
  allowing values that cannot be represented safely by the Teamleader JSON API.
- Construct decoded domain models and typed API errors through the v4 Schema class factories, preserving validation
  and Effect language-service support.
- Update service and layer construction for board, time, configuration, and HTTP services.
- Continue supporting the existing project, task, board, message, and time-entry tools with the same external MCP tool
  names and parameters.
