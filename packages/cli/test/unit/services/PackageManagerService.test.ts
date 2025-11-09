/* eslint-disable sonar/no-duplicate-string */

import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, expect, it } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import {
  clearExecutedCommands,
  getExecutedCommands,
  MockCommandExecutor,
  MockCommandExecutorLayer,
} from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe('PackageManagerService', () => {
  const testLayer = Layer.mergeAll(
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('resolveRoot', () => {
    it.scoped('resolves workspace root', (ctx) =>
      Effect.gen(function* () {
        const dir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const service = yield* PackageManagerService;
        const root = yield* service.resolveRoot();

        assertTrue(root.includes(dir));
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('readPackageJson', () => {
    it.scoped('reads package.json from current directory', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* PackageManagerService;
        const pkg = yield* service.readPackageJson();

        expect(pkg).toMatchObject({
          name: 'test-single-package',
          version: '1.0.0',
        });
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('reads package.json from specified directory', (ctx) =>
      Effect.gen(function* () {
        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const service = yield* PackageManagerService;

        const pkg = yield* service.readPackageJson({
          id: tempDir,
        });

        expect(pkg).toMatchObject({
          name: 'test-monorepo',
          private: true,
        });
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('getPackageManager', () => {
    it.scoped('detects pnpm package manager', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* PackageManagerService;
        const pm = yield* service.getPackageManager();

        strictEqual(pm.name, 'pnpm');
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('addDependencies', () => {
    it.scoped('executes command to add dev dependencies', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');
        yield* clearExecutedCommands;

        const service = yield* PackageManagerService;

        yield* service.addDependencies({
          devDependencies: ['prettier', '@2digits/prettier-config'],
        });

        const executed = yield* getExecutedCommands;

        assertTrue(executed.length > 0);

        // Should have executed a pnpm add command
        const addCommand = executed.find((cmd) => cmd.command.includes('add') || cmd.shell === true);

        assertTrue(addCommand !== undefined);

        expect(executed.at(0)?.command).toMatchInlineSnapshot(
          `"pnpm add --workspace-root -D prettier @2digits/prettier-config"`,
        );
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('executes separate commands for dependencies and devDependencies', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');
        yield* clearExecutedCommands;

        const service = yield* PackageManagerService;

        yield* service.addDependencies({
          dependencies: ['effect'],
          devDependencies: ['vitest'],
        });

        const executed = yield* getExecutedCommands;

        // Should execute 2 commands (one for deps, one for devDeps)
        assertTrue(executed.length >= 2);

        expect(executed.map((e) => e.command)).toMatchInlineSnapshot(`
          [
            "pnpm add --workspace-root -D vitest",
            "pnpm add --workspace-root effect",
          ]
        `);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('runScriptCommand', () => {
    it.scoped('returns command string for running script', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* PackageManagerService;
        const cmd = yield* service.runScriptCommand({ script: 'test' });

        // Should return a pnpm command
        assertTrue(cmd.includes('pnpm'));
        assertTrue(cmd.includes('test'));

        expect(cmd).toMatchInlineSnapshot(`"pnpm run test"`);
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
