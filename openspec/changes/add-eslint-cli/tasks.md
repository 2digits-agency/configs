# Implementation Tasks: ESLint CLI Auto-Setup

## 1. Project Detection Service
- [x] 1.1 Create `src/services/ProjectDetectionService.ts`
- [x] 1.2 Implement `isMonorepo()` - Check for `turbo.json` existence
- [x] 1.3 Implement `isTurborepoProject()` - Validate Turborepo setup
- [x] 1.4 Implement `discoverWorkspaces()` - Find apps/ and packages/ directories
- [x] 1.5 Implement `getWorkspacePackageJsonPath()` - Helper for workspace package.json paths
- [ ] 1.6 Add unit tests for project detection logic

## 2. ESLint Detection Service
- [x] 2.1 Create `src/services/EslintDetectionService.ts`
- [x] 2.2 Implement `isEslintInstalled()` - Check for eslint in dependencies
- [x] 2.3 Implement `hasEslintConfig()` - Detect any ESLint config file
- [x] 2.4 Implement `detectExistingConfigs()` - Find all ESLint config files (.eslintrc.*, eslint.config.*)
- [x] 2.5 Implement `uses2DigitsConfig()` - Check if @2digits/eslint-config is referenced
- [ ] 2.6 Add unit tests for detection logic

## 3. ESLint Setup Service (Core)
- [x] 3.1 Create `src/services/EslintSetupService.ts`
- [x] 3.2 Implement `setup()` - Main orchestration workflow
- [x] 3.3 Implement `generateRootConfig()` - Create root eslint.config.ts template
- [x] 3.4 Implement `generateWorkspaceConfig()` - Create workspace-specific config template
- [x] 3.5 Implement `writeEslintConfig()` - Write config file to disk
- [x] 3.6 Add dependency injection for ProjectDetectionService, EslintDetectionService, PackageManagerService

## 4. Migration & Backup
- [x] 4.1 Implement `backupExistingConfigs()` - Copy existing configs to .backup files
- [x] 4.2 Implement `removeOldConfigs()` - Delete original config files after backup
- [x] 4.3 Add logging for backup/migration operations
- [x] 4.4 Add error handling for backup failures (rollback if needed)

## 5. Turborepo Integration
- [x] 5.1 Implement `readTurboConfig()` - Read existing turbo.json
- [x] 5.2 Implement `mergeLintTasks()` - Add lint tasks to turbo.json preserving existing
- [x] 5.3 Implement `writeTurboConfig()` - Write updated turbo.json
- [x] 5.4 Add validation for turbo.json structure
- [x] 5.5 Handle missing turbo.json gracefully (skip for non-Turborepo projects)

## 6. Package.json Script Management
- [x] 6.1 Implement `addLintScripts()` - Add lint, lint:fix, lint:root, lint:root:fix scripts
- [x] 6.2 Update root package.json with scripts
- [x] 6.3 Skip workspace package.json script updates (workspaces use turbo)
- [x] 6.4 Preserve existing scripts (don't overwrite custom scripts)

## 7. Workspace Configuration Generation
- [x] 7.1 Implement workspace loop to generate configs for each app/package
- [x] 7.2 Determine workspace-specific ignores (e.g., Payload CMS patterns, React Native configs)
- [x] 7.3 Write eslint.config.ts to each workspace directory
- [x] 7.4 Add logging for each workspace configured

## 8. Dependency Installation
- [x] 8.1 Use PackageManagerService.addDependencies() to install eslint + @2digits/eslint-config
- [x] 8.2 Install as devDependencies in root (monorepo) or current package (single-package)
- [x] 8.3 Handle installation errors gracefully

## 9. CLI Command Integration
- [x] 9.1 Update `src/Cli.ts` to add `--eslint` flag (boolean option)
- [x] 9.2 Add subcommand handler for eslint setup
- [x] 9.3 Provide EslintSetupService layer in CLI runtime
- [x] 9.4 Add help text documenting --eslint flag

## 10. Error Handling & Validation
- [x] 10.1 Add custom error types (EslintSetupError, ConfigWriteError, etc.)
- [x] 10.2 Implement rollback logic on partial failures
- [x] 10.3 Add validation for generated config files (syntax check)
- [x] 10.4 Log clear error messages with recovery instructions

## 11. Testing
- [ ] 11.1 Write unit tests for ProjectDetectionService
- [ ] 11.2 Write unit tests for EslintDetectionService
- [ ] 11.3 Write integration tests for EslintSetupService.setup()
- [ ] 11.4 Test monorepo scenario (with Turborepo)
- [ ] 11.5 Test single-package scenario
- [ ] 11.6 Test migration scenario (existing ESLint config)
- [ ] 11.7 Test error scenarios (permission errors, invalid paths, etc.)

## 12. Documentation
- [ ] 12.1 Update CLI README with --eslint usage examples
- [ ] 12.2 Add inline code documentation (JSDoc for public methods)
- [ ] 12.3 Document migration/rollback process for users
- [ ] 12.4 Add troubleshooting guide for common setup issues
