/* eslint-disable sonar/no-duplicate-string */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import { describe, expect, it } from '@effect/vitest';
import { strictEqual } from '@effect/vitest/utils';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { TurborepoSetupService, type TurboConfig } from '../../../src/services/TurborepoSetupService.js';
import {
  getExecutedCommands,
  MockCommandExecutor,
  MockCommandExecutorLayer,
} from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe('TurborepoSetupService', () => {
  const testLayer = Layer.mergeAll(
    TurborepoSetupService.Default,
    ProjectDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('detectWorkspaceTasks', () => {
    it.scoped('detects tasks from workspace package.json files', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-no-turbo');

        const service = yield* TurborepoSetupService;
        const tasks = yield* service.detectWorkspaceTasks();

        // Should detect build, dev, test, lint, typecheck from both packages
        expect(tasks.has('build')).toBe(true);
        expect(tasks.has('dev')).toBe(true);
        expect(tasks.has('test')).toBe(true);
        expect(tasks.has('lint')).toBe(true);
        expect(tasks.has('typecheck')).toBe(true);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns empty set for project without workspaces', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* TurborepoSetupService;
        const tasks = yield* service.detectWorkspaceTasks();

        strictEqual(tasks.size, 0);
      }).pipe(Effect.provide(testLayer)),
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
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns None when turbo.json does not exist', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-no-turbo');

        const service = yield* TurborepoSetupService;
        const configOption = yield* service.readTurboConfig();

        expect(configOption._tag).toBe('None');
      }).pipe(Effect.provide(testLayer)),
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
        const config = JSON.parse(content) as TurboConfig;

        expect(config.tasks).toBeDefined();
        expect(config.tasks?.build).toBeDefined();
        expect(config.tasks?.test).toBeDefined();
        expect(config.tasks?.dev).toBeDefined();
      }).pipe(Effect.provide(testLayer)),
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
        const existingTasks =
          configOptionBefore._tag === 'Some' ? Object.keys(configOptionBefore.value.tasks || {}) : [];

        const detectedTasks = new Set(['build', 'typecheck']);

        yield* service.mergeTurboConfig(detectedTasks);

        const root = yield* pm.resolveRoot();
        const turboPath = `${root}/turbo.json`;
        const content = yield* fs.readFileString(turboPath);
        const config = JSON.parse(content) as TurboConfig;

        // Should have both existing and new tasks
        for (const task of existingTasks) {
          expect(config.tasks?.[task]).toBeDefined();
        }

        expect(config.tasks?.build).toBeDefined();
        expect(config.tasks?.typecheck).toBeDefined();
      }).pipe(Effect.provide(testLayer)),
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
      }).pipe(Effect.provide(testLayer)),
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

        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.build = 'turbo run build';
        yield* pm.writePackageJson({ id: root, content: packageJson });

        const detectedTasks = new Set(['build']);

        yield* service.updateRootScripts(detectedTasks);

        const updatedPackageJson = yield* pm.readPackageJson({ id: root });

        expect(updatedPackageJson.scripts?.build).toBe('turbo run build');
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('ensureTurboInstalled', () => {
    it.scoped('installs turbo in root package.json when not present', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-no-turbo');

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
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('does not install turbo if already in root package.json', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-turborepo');

        const service = yield* TurborepoSetupService;
        const pm = yield* PackageManagerService;

        const rootBefore = yield* pm.resolveRoot();
        const rootPackageJsonBefore = yield* pm.readPackageJson({ id: rootBefore });

        expect(rootPackageJsonBefore.devDependencies?.turbo).toBeDefined();

        yield* service.ensureTurboInstalled();

        const executed = yield* getExecutedCommands.pipe(Effect.map(Array.map((e) => e.command)));

        expect(executed).toHaveLength(0);
      }).pipe(Effect.provide(testLayer)),
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
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('sets up turborepo for monorepo without turbo.json', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-no-turbo');

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

        expect(rootPackageJsonAfter.scripts?.build).toBe('turbo run build');
        expect(rootPackageJsonAfter.scripts?.test).toBe('turbo run test');
        expect(rootPackageJsonAfter.scripts?.dev).toBe('turbo run dev');
        expect(rootPackageJsonAfter.scripts?.lint).toBe('turbo run lint');
        expect(rootPackageJsonAfter.scripts?.typecheck).toBe('turbo run typecheck');
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
