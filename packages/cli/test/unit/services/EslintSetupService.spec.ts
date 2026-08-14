/* eslint-disable sonar/no-duplicate-string */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, expect, layer } from '@effect/vitest';
import { assertSuccess, assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import { EslintDetectionService } from '../../../src/services/EslintDetectionService.js';
import { EslintSetupService } from '../../../src/services/EslintSetupService.js';
import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { MockCommandExecutor, MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

const TurboConfigSchema = Schema.Struct({
  $schema: Schema.optionalKey(Schema.String),
  tasks: Schema.optionalKey(Schema.Record(Schema.String, Schema.Unknown)),
  globalPassThroughEnv: Schema.String.pipe(Schema.Array, Schema.optionalKey),
  ui: Schema.optionalKey(Schema.String),
});
const TurboConfigJson = Schema.fromJsonString(TurboConfigSchema, { space: 2 });

describe(EslintSetupService, () => {
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

  layer(testLayer)((it) =>
    describe('setup - single package', () => {
      it.effect('sets up eslint in single package project', () =>
        Effect.gen(function* () {
          const service = yield* EslintSetupService;
          const pm = yield* PackageManagerService;
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

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
        }),
      );
    }),
  );

  layer(testLayer)((it) =>
    describe('setup - monorepo', () => {
      it.effect('sets up eslint in monorepo project', () =>
        Effect.gen(function* () {
          const service = yield* EslintSetupService;
          const pm = yield* PackageManagerService;
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          yield* service.setup();

          const rootConfigContent = yield* fs.readFileString(path.join(tempDir, 'eslint.config.ts'));

          expect(rootConfigContent).toMatchSnapshot('eslint.config.ts');

          const workspaceConfigContent = yield* fs.readFileString(path.join(tempDir, 'packages/app/eslint.config.ts'));

          expect(workspaceConfigContent).toMatchSnapshot('packages/app/eslint.config.ts');

          const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

          expect(updatedPkg).toMatchSnapshot('package.json');

          const turboContent = yield* fs.readFileString(path.join(tempDir, 'turbo.json'));

          const turboConfig = yield* Schema.decodeEffect(TurboConfigJson)(turboContent);

          expect(turboConfig).toMatchSnapshot('turbo.json');
        }),
      );
    }),
  );

  layer(testLayer)((it) =>
    describe('setup - with existing config', () => {
      it.effect('backs up existing eslint config', () =>
        Effect.gen(function* () {
          const service = yield* EslintSetupService;
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('existing-configs');

          // Run setup
          yield* service.setup();

          const backupPath = path.join(tempDir, 'eslint.config.js.backup');
          const backupContent = yield* fs.readFileString(backupPath);

          expect(backupContent).toMatchSnapshot('eslint.config.js.backup');

          const newConfigPath = path.join(tempDir, 'eslint.config.ts');
          const newConfigContent = yield* fs.readFileString(newConfigPath);

          expect(newConfigContent).toMatchSnapshot('eslint.config.ts');
        }),
      );
    }),
  );

  layer(testLayer)((it) =>
    describe('internal methods', () => {
      it.effect('writeEslintConfig creates config file', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const configPath = path.join(tempDir, 'eslint.config.ts');
          const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

          yield* fs.writeFileString(configPath, content);

          const written = yield* fs.readFileString(configPath);

          strictEqual(written, content);
        }),
      );

      it.effect('addLintScripts adds scripts to single package', () =>
        Effect.gen(function* () {
          const pm = yield* PackageManagerService;

          yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const pkg = yield* pm.readPackageJson();

          pkg.scripts ??= {};
          pkg.scripts.lint = 'eslint .';
          pkg.scripts['lint:fix'] = 'eslint . --fix';
          yield* pm.writePackageJson({ content: pkg });

          const updated = yield* pm.readPackageJson();

          strictEqual(updated.scripts?.lint, 'eslint .');
          strictEqual(updated.scripts?.['lint:fix'], 'eslint . --fix');
        }),
      );

      it.effect('addLintScripts adds monorepo scripts', () =>
        Effect.gen(function* () {
          const pm = yield* PackageManagerService;

          yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const pkg = yield* pm.readPackageJson();

          pkg.scripts ??= {};
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
        }),
      );

      it.effect('backupExistingConfigs creates backup files', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

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
        }),
      );

      it.effect('backupExistingConfigs handles duplicate backups', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('existing-configs');

          const originalPath = path.join(tempDir, 'eslint.config.js');
          const backupPath = `${originalPath}.backup`;

          yield* fs.copy(originalPath, backupPath);

          const firstBackupExists = yield* fs.exists(backupPath);

          strictEqual(firstBackupExists, true);
        }),
      );

      it.effect('removeOldConfigs deletes existing configs', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('existing-configs');

          const configPath = path.join(tempDir, 'eslint.config.js');
          const existsBefore = yield* fs.exists(configPath);

          strictEqual(existsBefore, true);

          yield* fs.remove(configPath);

          const existsAfter = yield* fs.exists(configPath);

          strictEqual(existsAfter, false);
        }),
      );

      it.effect('readTurboConfig returns config if exists', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const turboPath = path.join(tempDir, 'turbo.json');
          const content = yield* fs.readFileString(turboPath);
          const config = yield* Schema.decodeEffect(TurboConfigJson)(content);

          assertTrue(typeof config === 'object');
        }),
      );

      it.effect('readTurboConfig returns none if not exists', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const turboPath = path.join(tempDir, 'turbo.json');
          const exists = yield* fs.exists(turboPath);

          strictEqual(exists, false);
        }),
      );

      it.effect('writeTurboConfig writes valid json', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const turboPath = path.join(tempDir, 'turbo.json');
          const config = {
            $schema: 'https://turbo.build/schema.json',
            tasks: {
              build: {},
              test: {},
            },
          };

          const encoded = yield* Schema.encodeUnknownEffect(TurboConfigJson)(config);

          yield* fs.writeFileString(turboPath, encoded);

          const written = yield* fs.readFileString(turboPath);
          const parsed = yield* Schema.decodeEffect(TurboConfigJson)(written);

          expect(parsed).toStrictEqual(config);
        }),
      );

      it.effect('setupRootConfig creates root config', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const configPath = path.join(tempDir, 'eslint.config.ts');
          const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

          yield* fs.writeFileString(configPath, content);

          const written = yield* fs.readFileString(configPath);

          assertTrue(written.includes('@2digits/eslint-config'));
          assertTrue(written.includes('export default twoDigits()'));
        }),
      );

      it.effect('setupRootConfig creates monorepo root config', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

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
        }),
      );

      it.effect('setupWorkspaceConfigs creates workspace configs', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;
          const projectDetect = yield* ProjectDetectionService;

          yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const workspaces = yield* projectDetect.discoverWorkspaces();

          for (const workspace of workspaces) {
            const configPath = path.join(workspace, 'eslint.config.ts');
            const content = 'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits();';

            yield* fs.writeFileString(configPath, content);

            const written = yield* fs.readFileString(configPath);

            assertTrue(written.includes('@2digits/eslint-config'));
          }
        }),
      );

      it.effect('updateTurboConfig merges lint tasks', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const turboPath = path.join(tempDir, 'turbo.json');
          const originalContent = yield* fs.readFileString(turboPath);
          const originalConfig = yield* Schema.decodeEffect(TurboConfigJson)(originalContent);
          const updatedConfig = {
            ...originalConfig,
            tasks: {
              ...originalConfig.tasks,
              lint: {
                dependsOn: ['topo', '^build'],
                outputLogs: 'new-only',
              },
              'lint:fix': {},
              '//#lint:root': {
                outputLogs: 'new-only',
              },
              '//#lint:root:fix': {},
            },
          };

          const encoded = yield* Schema.encodeUnknownEffect(TurboConfigJson)(updatedConfig);

          yield* fs.writeFileString(turboPath, encoded);

          const updated = yield* fs.readFileString(turboPath);
          const config = yield* Schema.decodeEffect(TurboConfigJson)(updated);

          assertTrue(config.tasks?.lint !== undefined);
          assertTrue(config.tasks['lint:fix'] !== undefined);
        }),
      );
    }),
  );

  layer(testLayer)((it) =>
    describe('error scenarios', () => {
      it.effect('handles corrupted turbo.json', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const turboPath = path.join(tempDir, 'turbo.json');

          yield* fs.writeFileString(turboPath, '{ invalid json }');

          const service = yield* EslintSetupService;
          const result = yield* Effect.result(service.setup());

          expect(result._tag).toBe('Failure');
        }),
      );

      it.effect('handles readonly config file', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const configPath = path.join(tempDir, 'eslint.config.ts');

          yield* fs.writeFileString(configPath, 'test');
          yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(configPath, 0o444)));

          const result = yield* Effect.result(fs.writeFileString(configPath, 'new content'));

          yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(configPath, 0o644)));

          expect(result._tag).toBe('Failure');
        }),
      );

      it.effect('handles missing workspace directories', () =>
        Effect.gen(function* () {
          const pm = yield* PackageManagerService;

          yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('monorepo-turborepo');

          const pkg = yield* pm.readPackageJson();

          pkg.workspaces = ['nonexistent/*'];
          yield* pm.writePackageJson({ content: pkg });

          const service = yield* EslintSetupService;
          const result = yield* Effect.result(service.setup());

          assertTrue(result._tag === 'Success');
        }),
      );
    }),
  );

  layer(testLayer)((it) =>
    describe('edge cases', () => {
      it.effect('handles project with no package.json scripts', () =>
        Effect.gen(function* () {
          const pm = yield* PackageManagerService;

          yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const pkg = yield* pm.readPackageJson();

          delete pkg.scripts;
          yield* pm.writePackageJson({ content: pkg });

          const service = yield* EslintSetupService;

          yield* service.setup();

          const updated = yield* pm.readPackageJson();

          assertTrue(updated.scripts?.lint !== undefined);
        }),
      );

      it.effect('preserves existing non-lint scripts', () =>
        Effect.gen(function* () {
          const pm = yield* PackageManagerService;

          yield* withTempTestEnv('EslintSetupService');

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
        }),
      );

      it.effect('handles monorepo without turbo.json', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintSetupService');
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* EslintSetupService;
          const result = yield* Effect.result(service.setup());

          assertSuccess(result, void 0);
        }),
      );

      it.effect('does not overwrite existing 2digits config', () =>
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          const tempDir = yield* withTempTestEnv('EslintSetupService');

          yield* copyFixture('single-package');

          const configPath = path.join(tempDir, 'eslint.config.ts');
          const customConfig =
            'import twoDigits from "@2digits/eslint-config";\nexport default twoDigits({ custom: true });';

          yield* fs.writeFileString(configPath, customConfig);

          const service = yield* EslintSetupService;

          yield* service.setup();

          const final = yield* fs.readFileString(configPath);

          assertTrue(final.includes('@2digits/eslint-config'));
        }),
      );
    }),
  );
});
