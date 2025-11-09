# Design: ESLint CLI Auto-Setup

## Context

The CLI currently supports Prettier auto-setup via `PrettierSetupService`. ESLint setup is more complex due to:

1. **Multi-file configuration**: Root + workspace-specific `eslint.config.ts` files with different ignore patterns
2. **Turborepo integration**: Requires modifying `turbo.json` and multiple `package.json` files
3. **Project type variance**: Monorepo (with Turborepo) vs single-package projects
4. **Migration complexity**: Existing ESLint configs (`.eslintrc`, `eslint.config.js`, etc.) need safe replacement

**Stakeholders**: Developers using `@2digits` configs in new or existing projects

## Goals / Non-Goals

### Goals
- Automate ESLint setup matching RefConnect reference architecture (root config + workspace configs)
- Support both monorepo (Turborepo) and single-package projects
- Safely migrate existing non-@2digits ESLint configs with backup
- Follow existing CLI patterns (Effect services, PackageManagerService reuse)

### Non-Goals
- Custom ESLint rule configuration (always uses `@2digits/eslint-config` defaults)
- Interactive prompts for config options (use opinionated defaults)
- Migration of custom ESLint rules from old configs (clean slate approach)
- Support for Yarn PnP or other non-standard setups (rely on nypm detection)

## Decisions

### 1. Project Type Detection
**Decision**: Use `pkg-types.findWorkspaceDir()` + check for `turbo.json` existence

**Implementation**:
```typescript
const isMonorepo = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const root = yield* resolveRoot()
  const turboPath = path.join(root, "turbo.json")
  return yield* fs.exists(turboPath)
})
```

**Alternatives considered**:
- Check `pnpm-workspace.yaml` / `package.json` workspaces: Rejected - not all workspaces use Turborepo
- Heuristic (detect apps/ + packages/): Rejected - too fragile, false positives

**Rationale**: Turborepo presence is definitive signal for monorepo build orchestration requiring lint task integration

### 2. Configuration File Generation
**Decision**: Use template strings embedded in service code (not external template files)

**Implementation**:
```typescript
const generateRootConfig = (isMonorepo: boolean) =>
  isMonorepo
    ? `import twoDigits from '@2digits/eslint-config';\n\nexport default twoDigits({\n  ignores: {\n    ignores: ['apps/**', 'packages/**'],\n  },\n});`
    : `import twoDigits from '@2digits/eslint-config';\n\nexport default twoDigits();`
```

**Alternatives considered**:
- External `.ejs` or `.hbs` templates: Rejected - adds template engine dependency, overkill for simple configs
- JSON templates: Rejected - ESLint config is TypeScript/JavaScript, not JSON

**Rationale**: Configs are small (< 20 lines), template strings keep everything in one service file, easier to maintain

### 3. Workspace Discovery
**Decision**: Use Effect FileSystem to read `apps/` and `packages/` directories, filter by `package.json` presence

**Implementation**:
```typescript
const discoverWorkspaces = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const root = yield* resolveRoot()

  const dirs = yield* Effect.all([
    fs.readDirectory(path.join(root, "apps")).pipe(Effect.orElseSucceed(() => [])),
    fs.readDirectory(path.join(root, "packages")).pipe(Effect.orElseSucceed(() => []))
  ])

  // Filter entries that have package.json
  // Return array of workspace paths
})
```

**Alternatives considered**:
- Parse `pnpm-workspace.yaml`: Rejected - not all projects use pnpm, adds YAML parser dependency
- Use `npm workspaces` / `pnpm list`: Rejected - slower, requires package manager execution

**Rationale**: Direct filesystem read is fast, works regardless of package manager, aligns with Effect patterns

### 4. Migration Strategy (Existing ESLint Configs)
**Decision**: Detect existing configs, backup to `.eslintrc.backup`, replace with `eslint.config.ts`

**Backup files detected**:
- `.eslintrc`, `.eslintrc.json`, `.eslintrc.js`, `.eslintrc.cjs`, `.eslintrc.yaml`, `.eslintrc.yml`
- `eslint.config.js`, `eslint.config.cjs`, `eslint.config.mjs`

**Implementation**:
```typescript
const migrateExistingConfig = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const existingConfigs = yield* detectExistingConfigs()

  for (const config of existingConfigs) {
    yield* fs.copy(config, `${config}.backup`)
    yield* fs.remove(config)
  }

  yield* Console.log(`Backed up ${existingConfigs.length} existing config(s) to *.backup`)
})
```

**Alternatives considered**:
- Interactive prompt asking user: Rejected - user wants automatic migration
- Git-based backup (rely on VCS): Rejected - assumes git, may have uncommitted work
- Merge existing rules: Rejected - complex, defeats purpose of standardized config

**Rationale**: File backup is safe, reversible, doesn't require git, clear to users

### 5. Turborepo Task Configuration
**Decision**: Read existing `turbo.json`, merge lint tasks preserving existing tasks, write back

**Task structure** (from RefConnect):
```json
{
  "tasks": {
    "lint": {
      "dependsOn": ["topo", "^build"],
      "outputLogs": "new-only"
    },
    "lint:fix": {},
    "//#lint:root": {
      "outputLogs": "new-only"
    },
    "//#lint:root:fix": {}
  }
}
```

**Implementation**:
- Use `pkg-types.readPackageJSON()` pattern for JSON read/write
- Deep merge new tasks into existing `turbo.json`
- Preserve existing task configurations (don't overwrite)

**Alternatives considered**:
- Overwrite entire `turbo.json`: Rejected - destroys existing config
- JSON patching (RFC 6902): Rejected - overkill, adds dependency

**Rationale**: Simple object merge safe, preserves user customizations

### 6. Service Architecture
**Decision**: Create separate Effect services following existing patterns

**Services**:
1. `ProjectDetectionService`: Detect monorepo vs single-package, find workspaces
2. `EslintDetectionService`: Check ESLint installation, detect existing configs
3. `EslintSetupService`: Orchestrate full setup workflow (depends on above + PackageManagerService)

**Layer composition**:
```typescript
const EslintSetupServiceLive = Layer.effect(
  EslintSetupService,
  Effect.gen(function*() {
    const pm = yield* PackageManagerService
    const detect = yield* ProjectDetectionService
    const eslintDetect = yield* EslintDetectionService

    return {
      setup: () => Effect.gen(function*() {
        // Orchestration logic
      })
    }
  })
).pipe(
  Layer.provide(ProjectDetectionServiceLive),
  Layer.provide(EslintDetectionServiceLive),
  Layer.provide(PackageManagerServiceLive)
)
```

**Alternatives considered**:
- Single monolithic service: Rejected - violates separation of concerns, hard to test
- Functional module (no services): Rejected - inconsistent with existing CLI patterns

**Rationale**: Service pattern matches existing code (PrettierSetupService), provides dependency injection, easier unit testing

## Risks / Trade-offs

### Risk: Breaking existing ESLint configs
- **Mitigation**: Backup files to `*.backup`, log clearly what was replaced
- **Rollback**: User can manually restore from backups if needed

### Risk: Turborepo task conflicts
- **Mitigation**: Only add tasks if they don't exist, preserve existing tasks
- **Trade-off**: If user has custom `lint` task, won't be modified (may need manual merge)

### Risk: Workspace config overwrites
- **Mitigation**: Check if `eslint.config.ts` exists before writing, log warning
- **Trade-off**: Won't auto-update existing workspace configs (prevents accidental loss of customization)

### Risk: Performance with many workspaces
- **Mitigation**: Use Effect.all with parallelism for workspace processing
- **Trade-off**: Initial setup may take 5-10s on large monorepos (acceptable for one-time setup)

## Migration Plan

### For Users
1. Run `2d --eslint` in project root
2. Review logged changes (backups created, files written)
3. Verify lint works: `pnpm lint` or `npm run lint`
4. Commit new config files, add `*.backup` to `.gitignore`

### Rollback
If setup fails or produces bad config:
1. Restore backups: `cp .eslintrc.backup .eslintrc` (etc.)
2. Remove generated files: `rm eslint.config.ts apps/*/eslint.config.ts packages/*/eslint.config.ts`
3. Revert `turbo.json` and `package.json` from git

### Validation
- Run `eslint .` in root to verify root config works
- Run `eslint .` in a workspace to verify workspace config works
- Run `turbo lint` to verify Turborepo integration

## Open Questions

1. **Should workspace configs be customizable?** (e.g., gitIgnore patterns)
   - **Resolution**: Start with opinionated defaults (match RefConnect), add customization in future if needed

2. **How to handle partial failures?** (e.g., turbo.json write fails but deps installed)
   - **Resolution**: Use Effect error handling to rollback on any failure, ensure atomic operation

3. **Should CLI support dry-run mode?** (`--check` vs `--eslint`)
   - **Resolution**: Not in v1 - keep simple like Prettier setup, add if users request it
