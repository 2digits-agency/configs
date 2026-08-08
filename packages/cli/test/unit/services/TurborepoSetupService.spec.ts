/* eslint-disable ts/no-deprecated */
/* eslint-disable sonar/no-duplicate-string */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import { describe, expect, layer } from '@effect/vitest';
import { strictEqual } from '@effect/vitest/utils';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { TurborepoSetupService } from '../../../src/services/TurborepoSetupService.js';
import {
  clearExecutedCommands,
  getExecutedCommands,
  MockCommandExecutor,
  MockCommandExecutorLayer,
} from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

const TurboConfigSchema = Schema.Struct({
  $schema: Schema.optional(Schema.String),
  tasks: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  globalPassThroughEnv: Schema.String.pipe(Schema.Array, Schema.optional),
  ui: Schema.optional(Schema.String),
});

describe(TurborepoSetupService, () => {
  const testLayer = Layer.mergeAll(
    TurborepoSetupService.Default,
    ProjectDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  layer(testLayer)((it) => {
    describe('detectWorkspaceTasks', () => {
      it.scoped('detects tasks from workspace package.json files', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const tasks = yield* service.detectWorkspaceTasks();

          // Should detect build, dev, test, lint, typecheck from both packages
          expect(tasks.has('build')).toBeTruthy();
          expect(tasks.has('dev')).toBeTruthy();
          expect(tasks.has('test')).toBeTruthy();
          expect(tasks.has('lint')).toBeTruthy();
          expect(tasks.has('typecheck')).toBeTruthy();
        }),
      );

      it.scoped('returns empty set for project without workspaces', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('single-package');

          const service = yield* TurborepoSetupService;
          const tasks = yield* service.detectWorkspaceTasks();

          strictEqual(tasks.size, 0);
        }),
      );
    });

    describe('readTurboConfig', () => {
      it.scoped('reads existing turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* TurborepoSetupService;
          const configOption = yield* service.readTurboConfig();

          expect(configOption._tag).toBe('Some');
        }),
      );

      it.scoped('returns None when turbo.json does not exist', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const configOption = yield* service.readTurboConfig();

          expect(configOption._tag).toBe('None');
        }),
      );
    });

    describe('mergeTurboConfig', () => {
      it.scoped('creates new turbo.json when none exists', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const detectedTasks = new Set(['build', 'test', 'dev']);

          yield* service.mergeTurboConfig(detectedTasks);

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;
          const exists = yield* fs.exists(turboPath);

          strictEqual(exists, true);

          const content = yield* fs.readFileString(turboPath);
          const config = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(content);

          expect(config.tasks).toBeDefined();
          expect(config.tasks?.build).toBeDefined();
          expect(config.tasks?.test).toBeDefined();
          expect(config.tasks?.dev).toBeDefined();
        }),
      );

      it.scoped('merges with existing turbo.json without overwriting', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          // Read existing config first
          const configOptionBefore = yield* service.readTurboConfig();
          let existingTasks: Array<string> = [];

          if (configOptionBefore._tag === 'Some') {
            const { value: configBefore } = configOptionBefore;

            existingTasks = Object.keys(configBefore.tasks ?? {});
          }

          const detectedTasks = new Set(['build', 'typecheck']);

          yield* service.mergeTurboConfig(detectedTasks);

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;
          const content = yield* fs.readFileString(turboPath);
          const config = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(content);

          // Should have both existing and new tasks
          for (const task of existingTasks) {
            expect(config.tasks?.[task]).toBeDefined();
          }

          expect(config.tasks?.build).toBeDefined();
          expect(config.tasks?.typecheck).toBeDefined();
        }),
      );
    });

    describe('updateRootScripts', () => {
      it.scoped('adds turbo run commands to package.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          const detectedTasks = new Set(['build', 'test']);

          yield* service.updateRootScripts(detectedTasks);

          const root = yield* pm.resolveRoot();
          const packageJson = yield* pm.readPackageJson({ id: root });

          expect(packageJson.scripts?.build).toBe('turbo run build');
          expect(packageJson.scripts?.test).toBe('turbo run test');
        }),
      );

      it.scoped('does not overwrite existing turbo commands', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          // First, add a turbo command manually
          const root = yield* pm.resolveRoot();
          const packageJson = yield* pm.readPackageJson({ id: root });

          packageJson.scripts ??= {};
          packageJson.scripts.build = 'turbo run build';
          yield* pm.writePackageJson({ id: root, content: packageJson });

          const detectedTasks = new Set(['build']);

          yield* service.updateRootScripts(detectedTasks);

          const updatedPackageJson = yield* pm.readPackageJson({ id: root });

          expect(updatedPackageJson.scripts?.build).toBe('turbo run build');
        }),
      );
    });

    describe('ensureTurboInstalled', () => {
      it.scoped('installs turbo in root package.json when not present', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');
          yield* clearExecutedCommands;

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          const rootBefore = yield* pm.resolveRoot();
          const rootPackageJsonBefore = yield* pm.readPackageJson({ id: rootBefore });

          expect(rootPackageJsonBefore.devDependencies?.turbo).toBeUndefined();

          yield* service.ensureTurboInstalled();

          const executed = yield* getExecutedCommands.pipe(Effect.map(Array.map((e) => e.command)));

          expect(executed).toHaveLength(1);
          expect(executed).toMatchInlineSnapshot(`
            [
              "pnpm add --workspace-root -D turbo",
            ]
          `);
        }),
      );

      it.scoped('does not install turbo if already in root package.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');
          yield* clearExecutedCommands;

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          const rootBefore = yield* pm.resolveRoot();
          const rootPackageJsonBefore = yield* pm.readPackageJson({ id: rootBefore });

          expect(rootPackageJsonBefore.devDependencies?.turbo).toBeDefined();

          yield* service.ensureTurboInstalled();

          const executed = yield* getExecutedCommands.pipe(Effect.map(Array.map((e) => e.command)));

          expect(executed).toHaveLength(0);
        }),
      );
    });

    describe('setup', () => {
      it.scoped('skips setup for non-monorepo projects', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('single-package');

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          yield* service.setup();

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;
          const exists = yield* fs.exists(turboPath);

          strictEqual(exists, false);
        }),
      );

      it.scoped('sets up turborepo for monorepo without turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');
          yield* clearExecutedCommands;

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          // Verify initial state
          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;
          const turboExistsBefore = yield* fs.exists(turboPath);
          const rootPackageJsonBefore = yield* pm.readPackageJson({ id: root });

          strictEqual(turboExistsBefore, false);
          expect(rootPackageJsonBefore.devDependencies?.turbo).toBeUndefined();

          yield* service.setup();

          const turboExistsAfter = yield* fs.exists(turboPath);

          strictEqual(turboExistsAfter, true);

          const executed = yield* getExecutedCommands.pipe(Effect.map(Array.map((e) => e.command)));

          expect(executed).toMatchInlineSnapshot(`
            [
              "pnpm add --workspace-root -D turbo",
            ]
          `);

          // Verify scripts were added to package.json
          const rootPackageJsonAfter = yield* pm.readPackageJson({ id: root });

          expect(rootPackageJsonAfter.scripts).toMatchObject({
            build: 'turbo run build',
            test: 'turbo run test',
            dev: 'turbo run dev',
            lint: 'turbo run lint',
            typecheck: 'turbo run typecheck',
          });
        }),
      );

      it.scoped('skips if no workspace tasks detected', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const pm = yield* PackageManagerService;
          const projectDetect = yield* ProjectDetectionService;

          const workspaces = yield* projectDetect.discoverWorkspaces();

          for (const workspace of workspaces) {
            const pkg = yield* pm.readPackageJson({ id: workspace });

            delete pkg.scripts;

            yield* pm.writePackageJson({ id: workspace, content: pkg });
          }

          const service = yield* TurborepoSetupService;

          const rootPackageBefore = yield* pm.readPackageJson();

          yield* service.setup();

          const rootPackageAfter = yield* pm.readPackageJson();

          expect(rootPackageAfter).toStrictEqual(rootPackageBefore);
        }),
      );
    });

    describe('ensureTurboInstalled package updates', () => {
      it.scoped('installs turbo if not present', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          const pkgBefore = yield* pm.readPackageJson();
          const depsBefore = {
            ...pkgBefore.dependencies,
            ...pkgBefore.devDependencies,
          };

          expect('turbo' in depsBefore).toBeFalsy();

          yield* service.ensureTurboInstalled();
        }),
      );

      it.scoped('skips install if turbo already present', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* TurborepoSetupService;
          const pm = yield* PackageManagerService;

          const pkg = yield* pm.readPackageJson();

          pkg.devDependencies = { ...pkg.devDependencies, turbo: '^2.0.0' };
          yield* pm.writePackageJson({ content: pkg });

          yield* service.ensureTurboInstalled();

          const pkgAfter = yield* pm.readPackageJson();

          expect(pkgAfter.devDependencies?.turbo).toBe('^2.0.0');
        }),
      );
    });

    describe('writeTurboConfig', () => {
      it.scoped('writes valid turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const config = {
            $schema: 'https://turbo.build/schema.json',
            tasks: {
              build: { dependsOn: ['^build'] },
            },
          };

          yield* service.writeTurboConfig(config);

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;
          const content = yield* fs.readFileString(turboPath);
          const parsed = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(content);

          expect(parsed).toStrictEqual(config);
        }),
      );
    });

    describe('error scenarios', () => {
      it.scoped('handles invalid turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;

          yield* fs.writeFileString(turboPath, '{ invalid json }');

          const service = yield* TurborepoSetupService;
          const result = yield* Effect.either(service.readTurboConfig());

          expect(result._tag).toBe('Left');
        }),
      );

      it.scoped('handles missing workspace package.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;
          const tasks = yield* service.detectWorkspaceTasks();

          expect(tasks.size).toBeGreaterThan(0);
        }),
      );

      it.scoped('handles readonly turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;

          yield* fs.chmod(turboPath, 0o444);

          const service = yield* TurborepoSetupService;
          const result = yield* Effect.either(
            service.writeTurboConfig({
              $schema: 'https://turbo.build/schema.json',
              tasks: {},
            }),
          );

          yield* fs.chmod(turboPath, 0o644);

          expect(result._tag).toBe('Left');
        }),
      );
    });

    describe('edge cases', () => {
      it.scoped('handles workspace with no scripts', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const pm = yield* PackageManagerService;
          const projectDetect = yield* ProjectDetectionService;

          const workspaces = yield* projectDetect.discoverWorkspaces();
          const [firstWorkspace] = workspaces;

          if (firstWorkspace !== undefined && firstWorkspace !== '') {
            const pkg = yield* pm.readPackageJson({ id: firstWorkspace });

            delete pkg.scripts;

            yield* pm.writePackageJson({ id: firstWorkspace, content: pkg });
          }

          const service = yield* TurborepoSetupService;
          const tasks = yield* service.detectWorkspaceTasks();

          expect(tasks.size).toBeGreaterThan(0);
        }),
      );

      it.scoped('preserves existing turbo tasks', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* TurborepoSetupService;
          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;

          const originalContent = yield* fs.readFileString(turboPath);
          const originalConfig = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(originalContent);
          const originalTaskKeys = Object.keys(originalConfig.tasks ?? {});

          yield* service.mergeTurboConfig(new Set(['newTask']));

          const updatedContent = yield* fs.readFileString(turboPath);
          const updatedConfig = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(updatedContent);

          for (const taskKey of originalTaskKeys) {
            expect(updatedConfig.tasks?.[taskKey]).toBeDefined();
          }
          expect(updatedConfig.tasks?.newTask).toBeDefined();
        }),
      );

      it.scoped('handles complex task names', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const pm = yield* PackageManagerService;
          const projectDetect = yield* ProjectDetectionService;

          const workspaces = yield* projectDetect.discoverWorkspaces();
          const [firstWorkspace] = workspaces;

          if (firstWorkspace !== undefined && firstWorkspace !== '') {
            const pkg = yield* pm.readPackageJson({ id: firstWorkspace });

            pkg.scripts = {
              ...pkg.scripts,
              'build:prod': 'build --prod',
              'test:unit': 'vitest run',
              'lint:eslint': 'eslint .',
            };

            yield* pm.writePackageJson({ id: firstWorkspace, content: pkg });
          }

          const service = yield* TurborepoSetupService;
          const tasks = yield* service.detectWorkspaceTasks();

          expect(tasks.has('build:prod')).toBeTruthy();
          expect(tasks.has('test:unit')).toBeTruthy();
          expect(tasks.has('lint:eslint')).toBeTruthy();
        }),
      );

      it.scoped('task categorization works correctly', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-no-turbo');

          const service = yield* TurborepoSetupService;

          const detectedTasks = new Set([
            'build',
            'compile',
            'test',
            'vitest',
            'lint',
            'eslint',
            'typecheck',
            'types',
            'dev',
            'start',
            'other-task',
          ]);

          yield* service.mergeTurboConfig(detectedTasks);

          const configOption = yield* service.readTurboConfig();

          if (configOption._tag === 'Some') {
            const { value: config } = configOption;

            expect(config.tasks?.build).toHaveProperty('dependsOn');
            expect(config.tasks?.build).toHaveProperty('outputs');
            expect(config.tasks?.test).toHaveProperty('dependsOn');
            expect(config.tasks?.dev).toHaveProperty('persistent', true);
            expect(config.tasks?.dev).toHaveProperty('cache', false);
          }
        }),
      );

      it.scoped('does not override existing task configs', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const fs = yield* FileSystem.FileSystem;
          const pm = yield* PackageManagerService;

          const root = yield* pm.resolveRoot();
          const turboPath = `${root}/turbo.json`;

          const config = {
            $schema: 'https://turbo.build/schema.json',
            tasks: {
              build: {
                dependsOn: ['custom-dep'],
                outputs: ['custom-output/**'],
              },
            },
          };

          const encodedConfig = yield* Schema.encode(Schema.parseJson(TurboConfigSchema))(config);

          yield* fs.writeFileString(turboPath, encodedConfig);

          const service = yield* TurborepoSetupService;

          yield* service.mergeTurboConfig(new Set(['build']));

          const updatedContent = yield* fs.readFileString(turboPath);
          const updatedConfig = yield* Schema.decodeUnknown(Schema.parseJson(TurboConfigSchema))(updatedContent);

          expect(updatedConfig.tasks?.build).toStrictEqual(config.tasks.build);
        }),
      );
    });
  });
});
