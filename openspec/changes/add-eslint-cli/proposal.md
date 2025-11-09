# Change: Add ESLint CLI Auto-Setup

## Why

Projects using `@2digits/eslint-config` currently require manual setup of ESLint configuration files, Turborepo tasks, and npm scripts across root and workspace directories. This manual process is error-prone, time-consuming, and leads to inconsistent setups across projects. An automated CLI tool (similar to the existing Prettier setup) will streamline ESLint adoption and ensure consistent configuration patterns.

## What Changes

- Add new `2d --eslint` CLI command for automated ESLint detection and setup
- Implement project type detection (monorepo with Turborepo vs single-package)
- Add ESLint configuration detection and validation
- Automate installation of `eslint` and `@2digits/eslint-config` dependencies
- Generate root `eslint.config.ts` with appropriate ignores for monorepos
- Generate workspace-specific `eslint.config.ts` files in apps/ and packages/
- Add Turborepo tasks (`lint`, `lint:fix`, `//#lint:root`, `//#lint:root:fix`) to `turbo.json`
- Add npm scripts (`lint`, `lint:fix`, `lint:root`, `lint:root:fix`) to package.json files
- **BREAKING**: Automatically migrate existing ESLint configurations not using `@2digits/eslint-config` by backing up and replacing with standardized setup

## Impact

- **Affected specs**: New capability `eslint-cli` (no existing specs to modify)
- **Affected code**:
  - `packages/cli/src/services/` - New EslintSetupService, ProjectDetectionService
  - `packages/cli/src/Cli.ts` - Add `--eslint` flag/subcommand
  - `packages/cli/package.json` - Possible new dependencies for template generation
- **User impact**: Developers can run `2d --eslint` in any project to auto-configure ESLint
- **Migration impact**: Existing non-standard ESLint configs will be replaced (with backup)
