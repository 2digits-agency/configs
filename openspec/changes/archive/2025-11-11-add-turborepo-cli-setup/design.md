## Context
The CLI currently automates Prettier and ESLint setup. Turborepo is already listed in project tech stack (2.6.0) but requires manual configuration. Users need consistent, automated setup for complete monorepo tooling.

## Goals / Non-Goals
**Goals:**
- Fully automated Turborepo configuration via CLI flag
- Intelligent workspace task detection and turbo.json generation
- Safe merging with existing configurations
- Zero-config defaults that work for 80% of monorepos

**Non-Goals:**
- Advanced Turborepo features (remote cache, daemon config)
- Interactive prompts for task customization
- Migration from other monorepo tools
- Custom workspace layout detection beyond pnpm/npm/yarn

## Decisions

### Decision: Flag-based invocation (`--turbo`)
**Why**: Integrates with existing setup workflow, consistent with `--prettier` and `--eslint` patterns. Users can run `2d --turbo --eslint --prettier` for complete setup.

**Alternatives**:
- Standalone command (`2d turbo`) - separates concerns but fragments UX
- Always-on auto-setup - too opinionated, forces Turborepo on all users

### Decision: Auto-install turbo dependency
**Why**: Matches current behavior (CLI auto-installs eslint/prettier configs). Reduces friction.

**Alternatives**:
- Prompt before install - adds interaction, slows automation
- Skip installation - incomplete setup, user must manually install

### Decision: Intelligent merge strategy
**Why**: Respects existing user customizations while adding missing common tasks. Prevents overwrite frustration.

**Merge rules**:
1. Preserve all existing tasks in turbo.json
2. Add detected tasks only if key doesn't exist
3. Never modify existing task configurations

### Decision: Task detection from workspaces
**Why**: Dynamic detection ensures turbo.json matches actual project structure. Avoids hardcoded assumptions.

**Detection strategy**:
1. Scan all workspace `package.json` files
2. Extract unique script names
3. Categorize by pattern:
   - Build-like: `build`, `compile`, `bundle`
   - Test-like: `test`, `spec`, `vitest`
   - Lint-like: `lint`, `eslint`
   - Type-check: `typecheck`, `types`, `tsc`
   - Dev-like: `dev`, `start`, `serve`
4. Apply task defaults per category

### Decision: Effect Service architecture
**Why**: Consistent with existing services (EslintSetupService, PrettierSetupService). Provides dependency injection, error handling, testability.

**Dependencies**:
- `FileSystem` - read/write turbo.json, package.json
- `Path` - resolve file paths
- `PackageManagerService` - install turbo, detect workspaces, update scripts
- `ProjectDetectionService` - determine if monorepo

## Task Configuration Defaults

```typescript
// Build tasks
{
  dependsOn: ["^build"],
  outputs: ["dist/**", "build/**", ".next/**", "out/**"]
}

// Test/lint/typecheck tasks
{
  dependsOn: ["^build"]
}

// Dev tasks
{
  persistent: true,
  cache: false
}
```

## Risks / Trade-offs

**Risk**: Task detection misses custom script names
**Mitigation**: Focus on common patterns. Users can manually add custom tasks to turbo.json afterward.

**Risk**: Merge logic conflicts with complex existing configs
**Mitigation**: Simple merge strategy (add only if missing). Users with advanced setups likely manage turbo.json manually anyway.

**Trade-off**: Auto-install vs explicit control
- Auto-install simplifies workflow but adds dependency without ask
- Acceptable given CLI already does this for other tools

## Migration Plan
1. Add service + tests
2. Integrate flag in CLI
3. Document in CLI README
4. Optional: Add to existing project upgrade guide

No breaking changes. Feature is opt-in via flag.

## Open Questions
None - user clarifications provided:
- Invocation: flag-based ✓
- Existing config: intelligent merge ✓
- Dependency handling: auto-install ✓
- Task coverage: auto-detect + typecheck ✓
