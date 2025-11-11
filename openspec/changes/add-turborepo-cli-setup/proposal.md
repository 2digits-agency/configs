# Change: Add Turborepo Auto-Setup to CLI

## Why
Monorepos using @2digits/config-monorepo currently require manual Turborepo configuration (turbo.json, package.json scripts, dependency installation). This manual setup is repetitive, error-prone, and doesn't follow the established patterns for automatic configuration that the CLI already provides for Prettier and ESLint.

## What Changes
- Add `--turbo` flag to existing `2d` CLI command for integrated setup workflow
- Create `TurborepoSetupService` following Effect service patterns used in `EslintSetupService` and `PrettierSetupService`
- Auto-install `turbo` as devDependency when not present
- Scan workspace package.json files to detect common tasks (build, test, lint, typecheck, dev)
- Generate turbo.json with intelligent task defaults based on detection
- Intelligently merge with existing turbo.json (preserve user tasks, add missing common ones)
- Update root package.json scripts to use `turbo run` commands
- Follow existing Effect/FileSystem/Path patterns for all operations

## Impact
- Affected specs: `cli-config-automation` (new capability)
- Affected code:
  - `packages/cli/src/Cli.ts` - add `turbo` option
  - `packages/cli/src/bin.ts` - integrate TurborepoSetupService layer
  - `packages/cli/src/services/TurborepoSetupService.ts` - new service
  - `packages/cli/test/unit/services/TurborepoSetupService.test.ts` - new tests
