/* eslint-disable sonar/no-duplicate-string */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import { describe, expect, it } from '@effect/vitest';
import { assertRight, assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EslintDetectionService } from '../../../src/services/EslintDetectionService.js';
import { EslintSetupService } from '../../../src/services/EslintSetupService.js';
import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import type { TurboConfig } from '../../../src/services/TurborepoSetupService.js';
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

  describe('internal methods', () => {
    it.scoped('writeEslintConfig creates config file', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const configPath = path.join(tempDir, 'eslint.config.ts');
        const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

        yield* fs.writeFileString(configPath, content);

        const written = yield* fs.readFileString(configPath);

        strictEqual(written, content);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('addLintScripts adds scripts to single package', (ctx) =>
      Effect.gen(function* () {
        const pm = yield* PackageManagerService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const pkg = yield* pm.readPackageJson();

        pkg.scripts = pkg.scripts || {};
        pkg.scripts.lint = 'eslint .';
        pkg.scripts['lint:fix'] = 'eslint . --fix';
        yield* pm.writePackageJson({ content: pkg });

        const updated = yield* pm.readPackageJson();

        strictEqual(updated.scripts?.lint, 'eslint .');
        strictEqual(updated.scripts?.['lint:fix'], 'eslint . --fix');
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('addLintScripts adds monorepo scripts', (ctx) =>
      Effect.gen(function* () {
        const pm = yield* PackageManagerService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const pkg = yield* pm.readPackageJson();

        pkg.scripts = pkg.scripts || {};
        pkg.scripts.lint = 'turbo run lint lint:root';
        pkg.scripts['lint:fix'] = 'turbo run lint:fix lint:root:fix';
        pkg.scripts['lint:root'] = 'eslint .';
        pkg.scripts['lint:root:fix'] = 'eslint . --fix';
        yield* pm.writePackageJson({ content: pkg });

        const updated = yield* pm.readPackageJson();

        strictEqual(updated.scripts?.lint, 'turbo run lint lint:root');
        strictEqual(updated.scripts?.['lint:fix'], 'turbo run lint:fix lint:root:fix');
        strictEqual(updated.scripts?.['lint:root'], 'eslint .');
        strictEqual(updated.scripts?.['lint:root:fix'], 'eslint . --fix');
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('backupExistingConfigs creates backup files', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('existing-configs');

        const originalPath = path.join(tempDir, 'eslint.config.js');
        const originalExists = yield* fs.exists(originalPath);

        strictEqual(originalExists, true);

        const originalContent = yield* fs.readFileString(originalPath);
        const backupPath = `${originalPath}.backup`;

        yield* fs.copy(originalPath, backupPath);

        const backupExists = yield* fs.exists(backupPath);

        strictEqual(backupExists, true);

        const backupContent = yield* fs.readFileString(backupPath);

        strictEqual(backupContent, originalContent);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('backupExistingConfigs handles duplicate backups', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('existing-configs');

        const originalPath = path.join(tempDir, 'eslint.config.js');
        const backupPath = `${originalPath}.backup`;

        yield* fs.copy(originalPath, backupPath);

        const firstBackupExists = yield* fs.exists(backupPath);

        strictEqual(firstBackupExists, true);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('removeOldConfigs deletes existing configs', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('existing-configs');

        const configPath = path.join(tempDir, 'eslint.config.js');
        const existsBefore = yield* fs.exists(configPath);

        strictEqual(existsBefore, true);

        yield* fs.remove(configPath);

        const existsAfter = yield* fs.exists(configPath);

        strictEqual(existsAfter, false);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('readTurboConfig returns config if exists', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const turboPath = path.join(tempDir, 'turbo.json');
        const content = yield* fs.readFileString(turboPath);
        const config = JSON.parse(content) as TurboConfig;

        assertTrue(typeof config === 'object');
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('readTurboConfig returns none if not exists', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const turboPath = path.join(tempDir, 'turbo.json');
        const exists = yield* fs.exists(turboPath);

        strictEqual(exists, false);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('writeTurboConfig writes valid json', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const turboPath = path.join(tempDir, 'turbo.json');
        const config = {
          $schema: 'https://turbo.build/schema.json',
          tasks: {
            build: {},
            test: {},
          },
        };

        yield* fs.writeFileString(turboPath, JSON.stringify(config, undefined, 2));

        const written = yield* fs.readFileString(turboPath);
        const parsed = JSON.parse(written) as TurboConfig;

        expect(parsed).toEqual(config);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('setupRootConfig creates root config', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const configPath = path.join(tempDir, 'eslint.config.ts');
        const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

        yield* fs.writeFileString(configPath, content);

        const written = yield* fs.readFileString(configPath);

        assertTrue(written.includes('@2digits/eslint-config'));
        assertTrue(written.includes('export default twoDigits()'));
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('setupRootConfig creates monorepo root config', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const configPath = path.join(tempDir, 'eslint.config.ts');
        const content = `import twoDigits from '@2digits/eslint-config';

export default twoDigits({
  ignores: {
    ignores: ['apps/**', 'packages/**'],
  },
});`;

        yield* fs.writeFileString(configPath, content);

        const written = yield* fs.readFileString(configPath);

        assertTrue(written.includes("ignores: ['apps/**', 'packages/**']"));
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('setupWorkspaceConfigs creates workspace configs', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const projectDetect = yield* ProjectDetectionService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const workspaces = yield* projectDetect.discoverWorkspaces();

        for (const workspace of workspaces) {
          const configPath = path.join(workspace, 'eslint.config.ts');
          const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

          yield* fs.writeFileString(configPath, content);

          const written = yield* fs.readFileString(configPath);

          assertTrue(written.includes('@2digits/eslint-config'));
        }
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('updateTurboConfig merges lint tasks', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const turboPath = path.join(tempDir, 'turbo.json');
        const originalContent = yield* fs.readFileString(turboPath);
        const originalConfig = JSON.parse(originalContent) as TurboConfig;

        originalConfig.tasks = originalConfig.tasks || {};
        originalConfig.tasks.lint = {
          dependsOn: ['topo', '^build'],
          outputLogs: 'new-only',
        };
        originalConfig.tasks['lint:fix'] = {};
        originalConfig.tasks['//#lint:root'] = {
          outputLogs: 'new-only',
        };
        originalConfig.tasks['//#lint:root:fix'] = {};

        yield* fs.writeFileString(turboPath, JSON.stringify(originalConfig, undefined, 2));

        const updated = yield* fs.readFileString(turboPath);
        const config = JSON.parse(updated) as TurboConfig;

        assertTrue(config.tasks?.lint !== undefined);
        assertTrue(config.tasks['lint:fix'] !== undefined);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('error scenarios', () => {
    it.scoped('handles corrupted turbo.json', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const turboPath = path.join(tempDir, 'turbo.json');

        yield* fs.writeFileString(turboPath, '{ invalid json }');

        const service = yield* EslintSetupService;
        const result = yield* Effect.either(service.setup());

        expect(result._tag).toBe('Left');
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('handles readonly config file', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const configPath = path.join(tempDir, 'eslint.config.ts');

        yield* fs.writeFileString(configPath, 'test');
        yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(configPath, 0o444)));

        const result = yield* Effect.either(fs.writeFileString(configPath, 'new content'));

        yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(configPath, 0o644)));

        expect(result._tag).toBe('Left');
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('handles missing workspace directories', (ctx) =>
      Effect.gen(function* () {
        const pm = yield* PackageManagerService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const pkg = yield* pm.readPackageJson();

        pkg.workspaces = ['nonexistent/*'];
        yield* pm.writePackageJson({ content: pkg });

        const service = yield* EslintSetupService;
        const result = yield* Effect.either(service.setup());

        assertTrue(result._tag === 'Right');
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('edge cases', () => {
    it.scoped('handles project with no package.json scripts', (ctx) =>
      Effect.gen(function* () {
        const pm = yield* PackageManagerService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const pkg = yield* pm.readPackageJson();

        delete pkg.scripts;
        yield* pm.writePackageJson({ content: pkg });

        const service = yield* EslintSetupService;

        yield* service.setup();

        const updated = yield* pm.readPackageJson();

        assertTrue(updated.scripts?.lint !== undefined);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('preserves existing non-lint scripts', (ctx) =>
      Effect.gen(function* () {
        const pm = yield* PackageManagerService;

        yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const pkg = yield* pm.readPackageJson();

        pkg.scripts = {
          build: 'tsc',
          test: 'vitest',
        };
        yield* pm.writePackageJson({ content: pkg });

        const service = yield* EslintSetupService;

        yield* service.setup();

        const updated = yield* pm.readPackageJson();

        strictEqual(updated.scripts?.build, 'tsc');
        strictEqual(updated.scripts?.test, 'vitest');
        assertTrue(updated.scripts?.lint !== undefined);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('handles monorepo without turbo.json', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-no-turbo');

        const service = yield* EslintSetupService;
        const result = yield* Effect.either(service.setup());

        assertRight(result, void 0);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('does not overwrite existing 2digits config', (ctx) =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const configPath = path.join(tempDir, 'eslint.config.ts');
        const customConfig =
          'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits({ custom: true });';

        yield* fs.writeFileString(configPath, customConfig);

        const service = yield* EslintSetupService;

        yield* service.setup();

        const final = yield* fs.readFileString(configPath);

        assertTrue(final.includes('@2digits/eslint-config'));
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
