## 1. Service Implementation
- [x] 1.1 Create `TurborepoSetupService.ts` with Effect.Service boilerplate
- [x] 1.2 Implement `detectWorkspaceTasks()` - scan workspace package.json files
- [x] 1.3 Implement `categorizeTask()` - classify scripts (build/test/dev/etc)
- [x] 1.4 Implement `generateTaskConfig()` - create turbo task definitions
- [x] 1.5 Implement `readTurboConfig()` - read existing turbo.json if present
- [x] 1.6 Implement `mergeTurboConfig()` - intelligent merge logic
- [x] 1.7 Implement `writeTurboConfig()` - write merged config to disk
- [x] 1.8 Implement `updateRootScripts()` - add `turbo run` commands to root package.json
- [x] 1.9 Implement `ensureTurboInstalled()` - check and install turbo dependency
- [x] 1.10 Implement `setup()` orchestrator method - coordinate all operations

## 2. CLI Integration
- [x] 2.1 Add `turbo: Options.boolean('turbo')` to `Cli.ts` command options
- [x] 2.2 Add option description and default value (optional, none)
- [x] 2.3 Add conditional handler logic for `--turbo` flag
- [x] 2.4 Add TurborepoSetupService to MainLive layer in `bin.ts`
- [x] 2.5 Add debug logging for turbo setup flow

## 3. Testing
- [x] 3.1 Create test fixtures:
  - [x] `monorepo-no-turbo` - clean monorepo without turbo
  - [x] `monorepo-with-turbo` - monorepo with existing turbo.json
  - [x] `single-package` - non-monorepo project
- [x] 3.2 Write unit tests for `detectWorkspaceTasks()`
- [x] 3.3 Write unit tests for task categorization logic
- [x] 3.4 Write unit tests for `generateTaskConfig()`
- [x] 3.5 Write unit tests for `mergeTurboConfig()` merge logic
- [x] 3.6 Write integration test for full setup flow (no existing config)
- [x] 3.7 Write integration test for merge flow (existing config)
- [x] 3.8 Write test for non-monorepo skip behavior
- [x] 3.9 Write test for turbo installation when missing
- [x] 3.10 Verify tests pass with `pnpm test`

## 4. Documentation
- [x] 4.1 Add `--turbo` flag to CLI README usage section
- [x] 4.2 Add examples showing `2d --turbo` usage
- [x] 4.3 Document merge behavior and customization options
- [x] 4.4 Add JSDoc comments to TurborepoSetupService public methods

## 5. Validation
- [x] 5.1 Test CLI manually in test monorepo without turbo.json
- [x] 5.2 Test CLI manually in test monorepo with existing turbo.json
- [x] 5.3 Verify generated turbo.json matches detected tasks
- [x] 5.4 Verify root package.json scripts updated correctly
- [x] 5.5 Run `turbo run build` to confirm working configuration
- [x] 5.6 Verify merge doesn't break existing turbo configs
