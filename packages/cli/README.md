# @2digits/cli

CLI tool for setting up 2DIGITS development configurations in your project.

## Installation

```bash
npm install -g @2digits/cli
# or
pnpm add -g @2digits/cli
# or
npx @2digits/cli
```

## Usage

```bash
2d [options]
```

### Options

- `--prettier` - Setup Prettier with @2digits/prettier-config (default: true)
- `--no-prettier` - Skip Prettier setup
- `--eslint` - Setup ESLint with @2digits/eslint-config
- `--turbo` - Setup Turborepo configuration for monorepo projects

### Examples

#### Setup all configurations

```bash
2d --eslint --turbo
```

This will:

- Configure Prettier with @2digits/prettier-config
- Configure ESLint with @2digits/eslint-config
- Configure Turborepo for your monorepo

#### Setup only ESLint

```bash
2d --no-prettier --eslint
```

#### Setup only Turborepo

```bash
2d --no-prettier --turbo
```

## Features

### Prettier Setup

- Installs @2digits/prettier-config
- Creates .prettierrc configuration
- Adds format scripts to package.json

### ESLint Setup

- Installs eslint and @2digits/eslint-config
- Creates eslint.config.ts for root and workspaces (monorepo)
- Backs up existing ESLint configurations
- Adds lint tasks to turbo.json (monorepo)
- Adds lint scripts to package.json

### Turborepo Setup

**Monorepo projects only**

The CLI automatically:

1. **Installs turbo** as a devDependency if not already installed
2. **Scans workspace package.json files** to detect common tasks:
   - Build tasks: `build`, `compile`, `bundle`
   - Test tasks: `test`, `spec`, `vitest`
   - Lint tasks: `lint`, `eslint`
   - Type-check tasks: `typecheck`, `types`, `tsc`
   - Dev tasks: `dev`, `start`, `serve`
3. **Generates or merges turbo.json** with intelligent defaults:
   - Build tasks: Includes dependency ordering and output caching
   - Test/lint/typecheck tasks: Depends on build completion
   - Dev tasks: Marked as persistent, cache disabled
4. **Updates root package.json** scripts to use `turbo run` commands

#### Merge Behavior

When an existing `turbo.json` is present:

- **Preserves** all existing task configurations
- **Adds** only missing tasks detected from workspaces
- **Never overwrites** existing task properties

This allows you to maintain custom Turborepo configurations while getting sensible defaults for common tasks.

#### Task Configuration Defaults

**Build tasks:**

```json
{
  "dependsOn": ["^build"],
  "outputs": ["dist/**", "build/**", ".next/**", "out/**"]
}
```

**Test/lint/typecheck tasks:**

```json
{
  "dependsOn": ["^build"]
}
```

**Dev tasks:**

```json
{
  "persistent": true,
  "cache": false
}
```

## Requirements

- Node.js (version specified in package.json engines field)
- pnpm, npm, or yarn package manager
- For Turborepo setup: Monorepo structure with turbo.json or workspace configuration

## License

MIT
