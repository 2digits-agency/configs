## 1. Service Implementation
- [ ] 1.1 Create `TurborepoSetupService.ts` with Effect.Service boilerplate
- [ ] 1.2 Implement `detectWorkspaceTasks()` - scan workspace package.json files
- [ ] 1.3 Implement `categorizeTask()` - classify scripts (build/test/dev/etc)
- [ ] 1.4 Implement `generateTaskConfig()` - create turbo task definitions
- [ ] 1.5 Implement `readTurboConfig()` - read existing turbo.json if present
- [ ] 1.6 Implement `mergeTurboConfig()` - intelligent merge logic
- [ ] 1.7 Implement `writeTurboConfig()` - write merged config to disk
- [ ] 1.8 Implement `updateRootScripts()` - add `turbo run` commands to root package.json
- [ ] 1.9 Implement `ensureTurboInstalled()` - check and install turbo dependency
- [ ] 1.10 Implement `setup()` orchestrator method - coordinate all operations

## 2. CLI Integration
- [ ] 2.1 Add `turbo: Options.boolean('turbo')` to `Cli.ts` command options
- [ ] 2.2 Add option description and default value (optional, none)
- [ ] 2.3 Add conditional handler logic for `--turbo` flag
- [ ] 2.4 Add TurborepoSetupService to MainLive layer in `bin.ts`
- [ ] 2.5 Add debug logging for turbo setup flow

## 3. Testing
- [ ] 3.1 Create test fixtures:
  - [ ] `monorepo-no-turbo` - clean monorepo without turbo
  - [ ] `monorepo-with-turbo` - monorepo with existing turbo.json
  - [ ] `single-package` - non-monorepo project
- [ ] 3.2 Write unit tests for `detectWorkspaceTasks()`
- [ ] 3.3 Write unit tests for task categorization logic
- [ ] 3.4 Write unit tests for `generateTaskConfig()`
- [ ] 3.5 Write unit tests for `mergeTurboConfig()` merge logic
- [ ] 3.6 Write integration test for full setup flow (no existing config)
- [ ] 3.7 Write integration test for merge flow (existing config)
- [ ] 3.8 Write test for non-monorepo skip behavior
- [ ] 3.9 Write test for turbo installation when missing
- [ ] 3.10 Verify tests pass with `pnpm test`

## 4. Documentation
- [ ] 4.1 Add `--turbo` flag to CLI README usage section
- [ ] 4.2 Add examples showing `2d --turbo` usage
- [ ] 4.3 Document merge behavior and customization options
- [ ] 4.4 Add JSDoc comments to TurborepoSetupService public methods

## 5. Validation
- [ ] 5.1 Test CLI manually in test monorepo without turbo.json
- [ ] 5.2 Test CLI manually in test monorepo with existing turbo.json
- [ ] 5.3 Verify generated turbo.json matches detected tasks
- [ ] 5.4 Verify root package.json scripts updated correctly
- [ ] 5.5 Run `turbo run build` to confirm working configuration
- [ ] 5.6 Verify merge doesn't break existing turbo configs
