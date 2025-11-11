# cli-config-automation Specification

## Purpose
TBD - created by archiving change add-turborepo-cli-setup. Update Purpose after archive.
## Requirements
### Requirement: Turborepo Setup via CLI Flag
The CLI SHALL provide a `--turbo` boolean flag that automatically configures Turborepo in monorepo projects.

#### Scenario: Setup in monorepo without existing turbo.json
- **WHEN** user runs `2d --turbo` in a monorepo directory without turbo.json
- **THEN** CLI SHALL install turbo as devDependency
- **AND** CLI SHALL scan all workspace package.json files for scripts
- **AND** CLI SHALL generate turbo.json with tasks matching detected scripts
- **AND** CLI SHALL add/update root package.json scripts to use `turbo run`
- **AND** CLI SHALL log completion message

#### Scenario: Setup in monorepo with existing turbo.json
- **WHEN** user runs `2d --turbo` in a monorepo with existing turbo.json
- **THEN** CLI SHALL preserve all existing task configurations
- **AND** CLI SHALL add only missing tasks detected from workspaces
- **AND** CLI SHALL NOT overwrite existing task properties
- **AND** CLI SHALL log merge summary

#### Scenario: Setup in non-monorepo project
- **WHEN** user runs `2d --turbo` in a non-monorepo project
- **THEN** CLI SHALL skip Turborepo setup
- **AND** CLI SHALL log warning that Turborepo requires monorepo structure

### Requirement: Workspace Task Detection
The service SHALL analyze workspace package.json files to detect common task patterns and generate appropriate turbo.json task configurations.

#### Scenario: Detect build tasks
- **WHEN** workspace package.json contains `build`, `compile`, or `bundle` script
- **THEN** turbo.json task SHALL include `dependsOn: ["^build"]`
- **AND** task SHALL include `outputs: ["dist/**", "build/**", ".next/**", "out/**"]`

#### Scenario: Detect test and lint tasks
- **WHEN** workspace contains `test`, `lint`, or `typecheck` scripts
- **THEN** corresponding turbo.json tasks SHALL include `dependsOn: ["^build"]`

#### Scenario: Detect development server tasks
- **WHEN** workspace contains `dev`, `start`, or `serve` scripts
- **THEN** turbo.json tasks SHALL include `persistent: true` and `cache: false`

### Requirement: Intelligent Configuration Merging
When existing turbo.json is present, the service SHALL merge configurations without overwriting user customizations.

#### Scenario: Preserve existing tasks
- **WHEN** turbo.json already contains a `build` task
- **THEN** service SHALL NOT modify existing `build` task properties
- **AND** service SHALL add other detected tasks not present in config

#### Scenario: Add missing common tasks
- **WHEN** workspace has `typecheck` script but turbo.json lacks `typecheck` task
- **THEN** service SHALL add `typecheck` task with default configuration

### Requirement: Effect Service Architecture
The TurborepoSetupService SHALL follow Effect service patterns consistent with existing CLI services.

#### Scenario: Service initialization with dependencies
- **WHEN** service is created
- **THEN** it SHALL depend on FileSystem, Path, PackageManagerService, ProjectDetectionService
- **AND** it SHALL be provided via `TurborepoSetupService.Default` layer

#### Scenario: Error handling
- **WHEN** setup operation fails (e.g., file write error, installation failure)
- **THEN** service SHALL yield TurborepoSetupError with descriptive message
- **AND** error SHALL include cause for debugging

### Requirement: Automatic Dependency Management
The service SHALL ensure turbo is installed as a devDependency before configuration.

#### Scenario: Install turbo when missing
- **WHEN** turbo is not in package.json dependencies
- **THEN** service SHALL install `turbo` as devDependency using PackageManagerService
- **AND** service SHALL use detected package manager (pnpm/npm/yarn)

#### Scenario: Skip installation when present
- **WHEN** turbo already exists in devDependencies
- **THEN** service SHALL proceed to configuration without reinstallation

