# Specification: ESLint CLI Auto-Setup

## ADDED Requirements

### Requirement: Project Type Detection

The CLI MUST detect whether the current project is a monorepo with Turborepo or a single-package project.

#### Scenario: Monorepo with Turborepo detected

- **WHEN** the project root contains a `turbo.json` file
- **THEN** the project SHALL be identified as a Turborepo monorepo
- **AND** the CLI SHALL enable monorepo-specific setup features (workspace configs, Turborepo task integration)

#### Scenario: Single-package project detected

- **WHEN** the project root does not contain a `turbo.json` file
- **THEN** the project SHALL be identified as a single-package project
- **AND** the CLI SHALL skip monorepo-specific features (no workspace traversal, no Turborepo tasks)

#### Scenario: No package.json found

- **WHEN** no `package.json` exists in the current directory or parent directories
- **THEN** the CLI SHALL report an error indicating the command must be run from within a valid Node.js project
- **AND** the setup process SHALL terminate without making changes

### Requirement: Workspace Discovery

For monorepo projects, the CLI MUST discover all workspace packages in `apps/` and `packages/` directories.

#### Scenario: Workspaces found in apps/ and packages/

- **WHEN** the monorepo contains `apps/web/package.json` and `packages/auth/package.json`
- **THEN** both `apps/web` and `packages/auth` SHALL be identified as workspaces
- **AND** each workspace SHALL receive its own `eslint.config.ts` file

#### Scenario: Empty workspace directories

- **WHEN** `apps/` or `packages/` directories exist but contain no subdirectories with `package.json`
- **THEN** those directories SHALL be skipped
- **AND** no workspace configs SHALL be generated for them

#### Scenario: Missing workspace directories

- **WHEN** neither `apps/` nor `packages/` directories exist in a monorepo
- **THEN** only root ESLint configuration SHALL be created
- **AND** workspace-specific setup SHALL be skipped

### Requirement: ESLint Installation Detection

The CLI MUST detect whether ESLint and `@2digits/eslint-config` are installed in the project.

#### Scenario: ESLint not installed

- **WHEN** `eslint` is not present in `dependencies` or `devDependencies`
- **THEN** the CLI SHALL install `eslint` as a devDependency
- **AND** the CLI SHALL install `@2digits/eslint-config` as a devDependency

#### Scenario: ESLint already installed

- **WHEN** `eslint` exists in `devDependencies` but `@2digits/eslint-config` does not
- **THEN** the CLI SHALL only install `@2digits/eslint-config`
- **AND** the existing `eslint` version SHALL be preserved

#### Scenario: Both packages already installed

- **WHEN** both `eslint` and `@2digits/eslint-config` exist in `devDependencies`
- **THEN** the CLI SHALL skip dependency installation
- **AND** proceed directly to configuration generation

### Requirement: Existing Configuration Detection

The CLI MUST detect existing ESLint configuration files before setup.

#### Scenario: Legacy .eslintrc file found

- **WHEN** a `.eslintrc`, `.eslintrc.json`, `.eslintrc.js`, or similar file exists
- **THEN** the CLI SHALL identify it as an existing configuration
- **AND** trigger migration workflow

#### Scenario: Flat config file found

- **WHEN** an `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.cjs` file exists
- **THEN** the CLI SHALL identify it as an existing configuration
- **AND** trigger migration workflow

#### Scenario: No existing config found

- **WHEN** no ESLint configuration files exist in the project root
- **THEN** the CLI SHALL proceed with fresh configuration generation
- **AND** skip migration steps

### Requirement: Configuration File Backup

When existing ESLint configuration files are detected, the CLI MUST backup those files before modification.

#### Scenario: Backup existing config files

- **WHEN** existing ESLint config files are found (`.eslintrc.json`, `eslint.config.js`, etc.)
- **THEN** each file SHALL be copied to `<filename>.backup`
- **AND** the CLI SHALL log the backup location for each file
- **AND** original files SHALL be removed after successful backup

#### Scenario: Backup file already exists

- **WHEN** a backup file (e.g., `.eslintrc.json.backup`) already exists
- **THEN** the CLI SHALL append a timestamp to the backup filename (e.g., `.eslintrc.json.backup.1699564800`)
- **AND** proceed with backup without overwriting the existing backup

#### Scenario: Backup operation fails

- **WHEN** the CLI cannot write backup files due to permissions or disk errors
- **THEN** the setup process SHALL terminate immediately
- **AND** no original configuration files SHALL be modified or removed
- **AND** an error message SHALL be logged explaining the failure

### Requirement: Root ESLint Configuration Generation

The CLI MUST generate a root `eslint.config.ts` file with appropriate configuration.

#### Scenario: Monorepo root config

- **WHEN** the project is a monorepo
- **THEN** the root `eslint.config.ts` SHALL import from `@2digits/eslint-config`
- **AND** SHALL include ignores for `apps/**` and `packages/**` directories
- **AND** SHALL be written to the project root

#### Scenario: Single-package root config

- **WHEN** the project is a single-package project
- **THEN** the root `eslint.config.ts` SHALL import from `@2digits/eslint-config`
- **AND** SHALL use default configuration without custom ignores
- **AND** SHALL be written to the project root

#### Scenario: Root config already exists using @2digits

- **WHEN** a root `eslint.config.ts` exists and imports `@2digits/eslint-config`
- **THEN** the CLI SHALL skip root config generation
- **AND** log a message indicating the existing config is already correct

### Requirement: Workspace ESLint Configuration Generation

For monorepo projects, the CLI MUST generate workspace-specific `eslint.config.ts` files.

#### Scenario: Generate workspace configs

- **WHEN** workspaces are discovered in `apps/web` and `packages/auth`
- **THEN** `apps/web/eslint.config.ts` SHALL be created importing `@2digits/eslint-config`
- **AND** `packages/auth/eslint.config.ts` SHALL be created importing `@2digits/eslint-config`
- **AND** each config SHALL use default settings (no custom ignores)

#### Scenario: Workspace config already exists

- **WHEN** a workspace already has an `eslint.config.ts` file
- **THEN** the CLI SHALL skip config generation for that workspace
- **AND** log a warning indicating the existing config was preserved

#### Scenario: Workspace config write fails

- **WHEN** the CLI cannot write to a workspace directory due to permissions
- **THEN** the CLI SHALL log an error for that specific workspace
- **AND** continue processing remaining workspaces
- **AND** report partial success at the end

### Requirement: Turborepo Task Integration

For monorepo projects with Turborepo, the CLI MUST add ESLint tasks to `turbo.json`.

#### Scenario: Add lint tasks to turbo.json

- **WHEN** a `turbo.json` file exists and does not contain `lint` tasks
- **THEN** the following tasks SHALL be added to the `tasks` object:
  - `"lint": { "dependsOn": ["topo", "^build"], "outputLogs": "new-only" }`
  - `"lint:fix": {}`
  - `"//#lint:root": { "outputLogs": "new-only" }`
  - `"//#lint:root:fix": {}`
- **AND** existing tasks SHALL be preserved

#### Scenario: Lint tasks already exist

- **WHEN** `turbo.json` already contains a `lint` task
- **THEN** the CLI SHALL skip adding lint tasks
- **AND** log a message indicating tasks already exist

#### Scenario: Invalid turbo.json structure

- **WHEN** `turbo.json` exists but contains invalid JSON or unexpected structure
- **THEN** the CLI SHALL report an error
- **AND** skip Turborepo task integration
- **AND** continue with other setup steps (scripts, configs)

### Requirement: Package.json Script Management

The CLI MUST add ESLint-related npm scripts to the root `package.json`.

#### Scenario: Add lint scripts to root package.json

- **WHEN** the root `package.json` does not contain `lint` scripts
- **THEN** the following scripts SHALL be added:
  - `"lint": "turbo run lint lint:root"` (monorepo) or `"lint": "eslint ."` (single-package)
  - `"lint:fix": "turbo run lint:fix lint:root:fix"` (monorepo) or `"lint:fix": "eslint . --fix"` (single-package)
  - `"lint:root": "eslint ."` (monorepo only)
  - `"lint:root:fix": "eslint . --fix"` (monorepo only)
- **AND** existing scripts SHALL be preserved

#### Scenario: Lint scripts already exist

- **WHEN** the `package.json` already has a `lint` script
- **THEN** the CLI SHALL skip adding that specific script
- **AND** preserve the existing script definition

#### Scenario: Package.json write fails

- **WHEN** the CLI cannot write to `package.json` due to permissions or disk errors
- **THEN** the setup process SHALL report an error
- **AND** continue with other setup steps where possible
- **AND** indicate to the user that manual script addition is required

### Requirement: Dependency Installation

The CLI MUST install required ESLint dependencies using the detected package manager.

#### Scenario: Install with npm

- **WHEN** the project uses npm (detected via `package-lock.json`)
- **THEN** the CLI SHALL execute `npm install --save-dev eslint @2digits/eslint-config`
- **AND** wait for installation to complete before proceeding

#### Scenario: Install with pnpm

- **WHEN** the project uses pnpm (detected via `pnpm-lock.yaml`)
- **THEN** the CLI SHALL execute `pnpm add -D eslint @2digits/eslint-config`
- **AND** wait for installation to complete before proceeding

#### Scenario: Install with yarn

- **WHEN** the project uses yarn (detected via `yarn.lock`)
- **THEN** the CLI SHALL execute `yarn add --dev eslint @2digits/eslint-config`
- **AND** wait for installation to complete before proceeding

#### Scenario: Installation fails

- **WHEN** the package manager installation command fails
- **THEN** the CLI SHALL log the error output from the package manager
- **AND** terminate the setup process
- **AND** indicate to the user that dependencies must be installed manually

### Requirement: Setup Validation

After completing setup, the CLI MUST validate that the configuration works correctly.

#### Scenario: Validate root config syntax

- **WHEN** the root `eslint.config.ts` has been generated
- **THEN** the CLI SHALL attempt to import/parse the config file
- **AND** report any syntax errors to the user

#### Scenario: Validate dependencies installed

- **WHEN** setup completes
- **THEN** the CLI SHALL verify `eslint` and `@2digits/eslint-config` appear in `package.json` devDependencies
- **AND** confirm packages are present in `node_modules`

#### Scenario: Validation fails

- **WHEN** post-setup validation detects issues (missing dependencies, syntax errors)
- **THEN** the CLI SHALL log detailed error information
- **AND** provide recovery instructions to the user
- **AND** indicate setup may be incomplete

### Requirement: User Feedback and Logging

The CLI MUST provide clear feedback during the setup process.

#### Scenario: Log setup steps

- **WHEN** the setup process runs
- **THEN** the CLI SHALL log each major step:
  - "Detecting project type..."
  - "Installing dependencies..."
  - "Generating configurations..."
  - "Updating turbo.json..."
  - "Adding npm scripts..."
  - "Setup complete!"

#### Scenario: Log successful completion

- **WHEN** setup completes without errors
- **THEN** the CLI SHALL display a success message
- **AND** show next steps (e.g., "Run 'pnpm lint' to verify setup")

#### Scenario: Log partial success

- **WHEN** some setup steps succeed but others fail
- **THEN** the CLI SHALL clearly indicate which steps succeeded
- **AND** which steps failed with specific error details
- **AND** provide instructions for manual completion of failed steps

### Requirement: Idempotency

The CLI setup process MUST be idempotent, allowing safe re-execution.

#### Scenario: Re-run setup on configured project

- **WHEN** ESLint setup has already been completed
- **AND** the user runs `2d --eslint` again
- **THEN** the CLI SHALL detect existing configuration
- **AND** skip already-completed steps
- **AND** log messages indicating "Already configured" for each existing component

#### Scenario: Resume after partial failure

- **WHEN** a previous setup attempt failed partway through
- **AND** the user runs `2d --eslint` again
- **THEN** the CLI SHALL detect completed steps
- **AND** skip those steps
- **AND** complete remaining steps that were not finished
