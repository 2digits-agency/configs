/* eslint-disable sonar/no-duplicate-string */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import { describe, expect, it } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EslintDetectionService } from '../../../src/services/EslintDetectionService.js';
import { EslintSetupService } from '../../../src/services/EslintSetupService.js';
import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { MockCommandExecutor, MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe('EslintSetupService', () => {
  const testLayer = Layer.mergeAll(
    EslintSetupService.Default,
    EslintDetectionService.Default,
    ProjectDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('setup - single package', () => {
    it.scoped('sets up eslint in single package project', (ctx) =>
      Effect.gen(function* () {
        const service = yield* EslintSetupService;
        const pm = yield* PackageManagerService;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        // Run setup
        yield* service.setup();

        // Check eslint.config.ts was created
        const configPath = path.join(tempDir, 'eslint.config.ts');
        const configExists = yield* fs.exists(configPath);

        strictEqual(configExists, true);

        // Check config content
        const configContent = yield* fs.readFileString(configPath);

        assertTrue(configContent.includes('@2digits/eslint-config'));
        assertTrue(configContent.includes('export default twoDigits()'));

        // Check package.json was updated
        const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

        assertTrue(updatedPkg.scripts?.lint !== undefined);
        assertTrue(updatedPkg.scripts['lint:fix'] !== undefined);
        strictEqual(updatedPkg.scripts.lint, 'eslint .');
        strictEqual(updatedPkg.scripts['lint:fix'], 'eslint . --fix');
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('setup - monorepo', () => {
    it.scoped('sets up eslint in monorepo project', (ctx) =>
      Effect.gen(function* () {
        const service = yield* EslintSetupService;
        const pm = yield* PackageManagerService;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        yield* service.setup();

        const rootConfigContent = yield* fs.readFileString(path.join(tempDir, 'eslint.config.ts'));

        expect(rootConfigContent).toMatchSnapshot('eslint.config.ts');

        const workspaceConfigContent = yield* fs.readFileString(path.join(tempDir, 'packages/app/eslint.config.ts'));

        expect(workspaceConfigContent).toMatchSnapshot('packages/app/eslint.config.ts');

        const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

        expect(updatedPkg).toMatchSnapshot('package.json');

        const turboContent = yield* fs.readFileString(path.join(tempDir, 'turbo.json'));

        expect(JSON.parse(turboContent)).toMatchSnapshot('turbo.json');
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('setup - with existing config', () => {
    it.scoped('backs up existing eslint config', (ctx) =>
      Effect.gen(function* () {
        const service = yield* EslintSetupService;
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('existing-configs');

        // Run setup
        yield* service.setup();

        const backupPath = path.join(tempDir, 'eslint.config.js.backup');
        const backupContent = yield* fs.readFileString(backupPath);

        expect(backupContent).toMatchSnapshot('eslint.config.js.backup');

        const newConfigPath = path.join(tempDir, 'eslint.config.ts');
        const newConfigContent = yield* fs.readFileString(newConfigPath);

        expect(newConfigContent).toMatchSnapshot('eslint.config.ts');
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
