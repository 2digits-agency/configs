## @2digits/cli@2.0.14

### Update `effect` to 4.0.0-rc.110



### Update `@effect/platform-node` to 4.0.0-rc.110

## @2digits/cli@2.0.13

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

## @2digits/cli@2.0.12

### Build Turborepo task config with Match

- Replaced the `switch` in `generateTaskConfig` with an `effect/Match` matcher, removing the implicit fallthrough between the `test`, `lint` and `typecheck` branches

## @2digits/cli@2.0.11

### Update @effect/platform-node to 0.108.1

## @2digits/cli@2.0.10

### Update nypm to 0.6.9



### Update @effect/cli to 0.77.0



### Update @effect/platform to 0.97.1



### Update effect to 3.22.1



### Update @effect/language-service to 0.87.1

## @2digits/cli@2.0.9

### Update Effect ecosystem dependencies

- Updated `@effect/platform` to 0.97.0

# @2digits/cli

## 2.0.8

### Patch Changes

- bfb16bd: Update Effect ecosystem dependencies

  - Updated `effect` to 3.22.0
  - Updated `@effect/cli` to 0.76.0, `@effect/platform` to 0.96.3, and `@effect/platform-node` to 0.108.0
  - Updated `@effect/ai` to 0.37.0, `@effect/experimental` to 0.61.0, and `@effect/rpc` to 0.76.0
  - Updated `@effect/language-service` to 0.87.0 and `@effect/vitest` to 0.30.0

## 2.0.7

### Patch Changes

- 7916d9c: Update @effect/language-service to 0.86.6

## 2.0.6

### Patch Changes

- 3103077: Update @effect/language-service to 0.86.4

## 2.0.5

### Patch Changes

- e88c38d: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.4
  - Updated `@effect/platform` to 0.96.2

- e88c38d: Update nypm to 0.6.8

## 2.0.4

### Patch Changes

- 433d415: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.3
  - Updated `@effect/cli` to 0.75.2
  - Updated `@effect/platform-node` to 0.107.0
  - Updated `@effect/ai` to 0.36.0
  - Added fully qualified Effect service and error tags in `@2digits/cli`

## 2.0.3

### Patch Changes

- cb2b172: Update @effect/language-service to 0.86.2
- 626d181: Update tinyexec to 1.2.2

## 2.0.2

### Patch Changes

- 158630a: Configure @effect/language-service plugin

  - Added `prepare` script to patch language service on install
  - Enabled refactors, diagnostics, quickinfo, completions, goto, and inlays
  - Configured key patterns for service and error targets

## 2.0.1

### Patch Changes

- 1389c83: Update @effect/language-service to 0.86.1

## 2.0.0

### Major Changes

- af1fdf7: Rename CLI binary from `2d` to `cli`

  - Changed package binary name from `2d` to `cli`

## 1.2.54

### Patch Changes

- 68924a9: Small internal performance refactors

## 1.2.53

### Patch Changes

- e1f712a: Update pkg-types to 2.3.1
- e1f712a: Update nypm to 0.6.6

## 1.2.52

### Patch Changes

- 44b9d5a: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.2
  - Updated `@effect/platform` to 0.96.1
  - Updated `@effect/rpc` to 0.75.1

## 1.2.51

### Patch Changes

- 8837219: Remove unnecessary type assertion in package manager detection

## 1.2.50

### Patch Changes

- 211e03f: Update Effect ecosystem dependencies

  - Updated `effect` to 3.21.1
  - Updated `@effect/cli` to 0.75.1

## 1.2.49

### Patch Changes

- 8be7864: Update @effect/language-service to 0.85.1

## 1.2.48

### Patch Changes

- 64ca9d5: Update @effect/language-service to 0.84.3

## 1.2.47

### Patch Changes

- cd7f884: Update @effect/language-service to 0.84.1
- 1b758b7: Update @effect/language-service to 0.84.2

## 1.2.46

### Patch Changes

- c5af9ba: Update @effect/language-service to 0.83.1

## 1.2.45

### Patch Changes

- 85ba774: Update @effect/language-service to 0.83.0
- 85ba774: Update TypeScript to 6.0.2

## 1.2.44

### Patch Changes

- 571f544: Update @effect/language-service to 0.81.0

## 1.2.43

### Patch Changes

- 48fa6c3: Update Effect ecosystem dependencies
  - Updated `effect` to 3.21.0
  - Updated `@effect/cli` to 0.75.0, `@effect/platform` to 0.96.0, `@effect/platform-node` to 0.106.0
  - Updated `@effect/ai` to 0.35.0, `@effect/experimental` to 0.60.0, `@effect/rpc` to 0.75.0
  - Updated `@effect/vitest` to 0.29.0

## 1.2.42

### Patch Changes

- 180fa00: Update Effect ecosystem dependencies
  - Updated `effect` to 3.20.0
  - Updated `@effect/cli` to 0.74.0, `@effect/platform` to 0.95.0, `@effect/platform-node` to 0.105.0
  - Updated `@effect/ai` to 0.34.0, `@effect/experimental` to 0.59.0, `@effect/rpc` to 0.74.0
  - Updated `@effect/vitest` to 0.28.0

## 1.2.41

### Patch Changes

- b6625c2: Update dependencies
  - Updated `tinyexec` to 1.0.4
  - Updated `unplugin-replace` to 0.8.0

## 1.2.40

### Patch Changes

- 175947e: Update @effect/language-service to 0.80.0

## 1.2.39

### Patch Changes

- 7355a63: Update @effect/language-service to 0.79.0

## 1.2.38

### Patch Changes

- 0eaa299: Update `unplugin-replace` to 0.7.0

## 1.2.37

### Patch Changes

- 706014f: Update @effect/language-service to 0.77.0

## 1.2.36

### Patch Changes

- d22e0ed: Update @effect/language-service to 0.76.0

## 1.2.35

### Patch Changes

- d643f5d: Update effect to 3.19.19 and @effect/language-service to 0.75.1
  - Updated `effect` to 3.19.19
  - Updated `@effect/language-service` to 0.75.1

## 1.2.34

### Patch Changes

- c81341c: Update @effect/language-service to 0.75.0

## 1.2.33

### Patch Changes

- f7712d5: Update @effect/language-service to 0.74.0
- a33b04c: Update Effect dependencies to latest patch versions
  - Updated `effect` to `3.19.18`
  - Updated `@effect/rpc` to `0.73.2`

## 1.2.32

### Patch Changes

- 590eea0: Update Effect dependencies to latest versions
  - Updated `effect` to 3.19.17
  - Updated `@effect/platform` to 0.94.5
  - Updated `@effect/rpc` to 0.73.1

## 1.2.31

### Patch Changes

- 13454b5: Update @effect/language-service to 0.73.1

## 1.2.30

### Patch Changes

- 6cf78c5: Update Effect dependencies
  - Updated `@effect/platform` to 0.94.4

## 1.2.29

### Patch Changes

- 1fcaa08: Disable tsgo for declaration file generation
  - Reverted to standard dts generation due to tsgo compatibility issues

## 1.2.28

### Patch Changes

- 0877a3c: Update @effect/language-service to 0.73.0
- 0877a3c: Update Effect dependencies
  - Updated `effect` to 3.19.16
  - Updated `@effect/cli` to 0.73.2
  - Updated `@effect/platform` to 0.94.3

## 1.2.27

### Patch Changes

- 6aec756: Update Effect dependencies
  - Updated `@effect/cli` to 0.73.1
  - Updated `@effect/platform` to 0.94.2
  - Updated `@effect/platform-node` to 0.104.1
  - Updated `effect` to 3.19.15

## 1.2.26

### Patch Changes

- 74fbec6: Enable tsgo for declaration file generation

  - Updated tsdown configs to use `dts: { tsgo: true }` for faster .d.ts generation

- 7b6ba6d: Update @effect/language-service to 0.72.0

## 1.2.25

### Patch Changes

- 91ee064: Update @effect/language-service to 0.71.2

## 1.2.24

### Patch Changes

- ba8d11a: Update nypm to 0.6.4
- ba8d11a: Update @effect/language-service to 0.71.1

## 1.2.23

### Patch Changes

- 730b63f: Update @effect/language-service to 0.71.0

## 1.2.22

### Patch Changes

- 4fb94d8: Migrate type checking from tsc to tsgo
  - Replaced `tsc --noEmit` with `tsgo --noEmit` in all package `types` scripts
  - Added `@typescript/native-preview` to devDependencies for tsgo binary

## 1.2.21

### Patch Changes

- 8e17255: Update @effect/language-service to 0.69.1

## 1.2.20

### Patch Changes

- a97ee7c: Updated tsdown and remove redundant main/module fields
  - Updated tsdown to 0.19.0
  - Removed `main` and `module` fields that duplicate the `exports` configuration
  - These fields are unnecessary for ESM-only packages with proper `exports` definitions

## 1.2.19

### Patch Changes

- 5aa0814: Update dependencies
  - Updated `@eslint-react/eslint-plugin` to 2.5.1
  - Updated `@typescript-eslint/*` packages to 8.52.0
  - Updated `typescript-eslint` to 8.52.0
  - Updated `eslint-plugin-turbo` to 2.7.3
  - Updated `renovate` to 42.71.2
  - Updated `@effect/language-service` to 0.64.1

## 1.2.18

### Patch Changes

- 3bbd30d: Updated dependencies

## 1.2.17

### Patch Changes

- bf25506: Update `tsdown` to 0.18.4
- bf25506: Updated dependencies

## 1.2.16

### Patch Changes

- 806698a: Updated dependencies

## 1.2.15

### Patch Changes

- 65b489b: Updated dependencies

## 1.2.14

### Patch Changes

- 5a36102: Updated dependencies
- bb1223d: Fixed default param in readPackageJson

## 1.2.13

### Patch Changes

- e42299e: Bumped packages to force release

## 1.2.12

### Patch Changes

- be22273: Updated dependencies

## 1.2.11

### Patch Changes

- 7df2a2b: Updated dependencies

## 1.2.10

### Patch Changes

- 21458cc: Updated dependencies

## 1.2.9

### Patch Changes

- e542a19: Updated dependencies

## 1.2.8

### Patch Changes

- 6151000: Updated dependencies

## 1.2.7

### Patch Changes

- f3fe438: Updated package.json repository.url to have the correct git+https url
- 2bcbdd0: Updated tsdown
- b667174: Updated dependencies
- 92d4bcd: Enabled attw and publint during build

## 1.2.6

### Patch Changes

- 5a4ff7d: Updated dependencies

## 1.2.5

### Patch Changes

- 7679d2b: Updated dependencies

## 1.2.4

### Patch Changes

- 6bd32e6: Updated dependencies

## 1.2.3

### Patch Changes

- d5ad954: Updated dependencies

## 1.2.2

### Patch Changes

- 2256882: Updated dependencies

## 1.2.1

### Patch Changes

- 82af422: Updated dependencies

## 1.2.0

### Minor Changes

- 3d711e8: Added automatic turborepo setup

### Patch Changes

- 9eef6d8: Updated dependencies
- 5e2b2be: Updated dependencies

## 1.1.0

### Minor Changes

- 8903e25: Added eslint setup
- c1b806e: Updated formatting package.json scripts

### Patch Changes

- 2dec480: Updated dependencies

## 1.0.24

### Patch Changes

- 9a39932: Updated dependencies

## 1.0.23

### Patch Changes

- a839f24: Updated dependencies

## 1.0.22

### Patch Changes

- 1df59a3: Updated dependencies

## 1.0.21

### Patch Changes

- b726d7a: Updated dependencies

## 1.0.20

### Patch Changes

- db900bc: Updated dependencies

## 1.0.19

### Patch Changes

- 60f2878: Updated dependencies

## 1.0.18

### Patch Changes

- 75a4e83: Updated dependencies

## 1.0.17

### Patch Changes

- 06373ea: Updated dependencies

## 1.0.16

### Patch Changes

- 49dbe02: Sync pnpm workspace catalog: bump the cataloged `@effect/language-service` dev dependency to the newer catalog version (keeps the CLI dev deps up to date).

## 1.0.15

### Patch Changes

- 74ce116: Updated dependencies

## 1.0.14

### Patch Changes

- cd8a68d: Updated dependencies

## 1.0.13

### Patch Changes

- 786f0f4: Updated dependencies

## 1.0.12

### Patch Changes

- b8d3716: Updated dependencies

## 1.0.11

### Patch Changes

- 7ba67b4: Updated dependencies

## 1.0.10

### Patch Changes

- 361364f: Updated dependencies

## 1.0.9

### Patch Changes

- 19e99a8: Updated dependencies
- 2a9fbab: Deduplicated dependencies

## 1.0.8

### Patch Changes

- bd13468: Updated dependencies

## 1.0.7

### Patch Changes

- 1a8b7d1: Updated dependencies

## 1.0.6

### Patch Changes

- 533a04f: Updated dependencies
- 1ef7e50: Updated dependencies

## 1.0.5

### Patch Changes

- 79eb56d: Updated dependencies
- 1aa6127: Updated dependencies

## 1.0.4

### Patch Changes

- f6f3ecf: Updated dependencies

## 1.0.3

### Patch Changes

- 69689ad: Updated dependencies
- ca321d4: Fixed tsdown builds by using the new --config-loader option

## 1.0.2

### Patch Changes

- 5c6df5d: Added basic format script logs to the output
- c45815b: Enable prettier cli option by default
- 136e668: Patched tsdown
- 2ac942a: Moved installing dependencies to use @effect/platform's Command and CommandExecutor
- 681265d: Updated dependencies

## 1.0.1

### Patch Changes

- 622d002: Set cli to private for now
- 85cbac2: Updated dependencies
