/* eslint-disable sonar/no-duplicate-string */

import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, expect, layer } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import {
  clearExecutedCommands,
  getExecutedCommands,
  MockCommandExecutor,
  MockCommandExecutorLayer,
} from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe(PackageManagerService, () => {
  const testLayer = Layer.mergeAll(
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  layer(testLayer)((it) => {
    describe('resolveRoot', () => {
      it.effect('resolves workspace root', () =>
        Effect.gen(function* () {
          const dir = yield* withTempTestEnv('PackageManagerService');

          yield* copyFixture('monorepo-turborepo');

          const service = yield* PackageManagerService;
          const root = yield* service.resolveRoot();

          assertTrue(root.includes(dir));
        }),
      );
    });

    describe('readPackageJson', () => {
      it.effect('reads package.json from current directory', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');

          const service = yield* PackageManagerService;
          const pkg = yield* service.readPackageJson();

          expect(pkg).toMatchObject({
            name: 'test-single-package',
            version: '1.0.0',
          });
        }),
      );

      it.effect('reads package.json from specified directory', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          yield* copyFixture('monorepo-turborepo');

          const service = yield* PackageManagerService;

          const pkg = yield* service.readPackageJson({
            id: tempDir,
          });

          expect(pkg).toMatchObject({
            name: 'test-monorepo',
            private: true,
          });
        }),
      );
    });

    describe('getPackageManager', () => {
      it.effect('detects pnpm package manager', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');

          const service = yield* PackageManagerService;
          const pm = yield* service.getPackageManager();

          strictEqual(pm.name, 'pnpm');
        }),
      );
    });

    describe('addDependencies', () => {
      it.effect('executes command to add dev dependencies', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
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
        }),
      );

      it.effect('executes separate commands for dependencies and devDependencies', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
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
        }),
      );
    });

    describe('runScriptCommand', () => {
      it.effect('returns command string for running script', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');

          const service = yield* PackageManagerService;
          const cmd = yield* service.runScriptCommand({ script: 'test' });

          // Should return a pnpm command
          assertTrue(cmd.includes('pnpm'));
          assertTrue(cmd.includes('test'));

          expect(cmd).toMatchInlineSnapshot(`"pnpm run test"`);
        }),
      );
    });

    describe('writePackageJson', () => {
      it.effect('writes package.json to current directory', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');

          const service = yield* PackageManagerService;

          yield* service.writePackageJson({
            content: {
              name: 'test-updated',
              version: '2.0.0',
              scripts: {
                test: 'vitest',
              },
            },
          });

          const pkg = yield* service.readPackageJson();

          strictEqual(pkg.name, 'test-updated');
          strictEqual(pkg.version, '2.0.0');
          strictEqual(pkg.scripts?.test, 'vitest');
        }),
      );

      it.effect('writes package.json to specified directory', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          yield* copyFixture('monorepo-turborepo');

          const service = yield* PackageManagerService;

          yield* service.writePackageJson({
            id: tempDir,
            content: {
              name: 'monorepo-updated',
              private: true,
              version: '1.0.0',
            },
          });

          const pkg = yield* service.readPackageJson({ id: tempDir });

          strictEqual(pkg.name, 'monorepo-updated');
          strictEqual(pkg.private, true);
        }),
      );

      it.effect('preserves existing fields when updating', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');

          const service = yield* PackageManagerService;
          const original = yield* service.readPackageJson();

          yield* service.writePackageJson({
            content: {
              ...original,
              scripts: {
                ...original.scripts,
                newScript: 'echo "new"',
              },
            },
          });

          const updated = yield* service.readPackageJson();

          strictEqual(updated.name, original.name);
          strictEqual(updated.version, original.version);
          strictEqual(updated.scripts?.newScript, 'echo "new"');
        }),
      );
    });

    describe('error handling', () => {
      it.effect('readPackageJson fails on missing file', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          const service = yield* PackageManagerService;

          const result = yield* Effect.result(service.readPackageJson({ id: tempDir }));

          expect(result._tag).toBe('Failure');
        }),
      );

      it.effect('writePackageJson fails on readonly file', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          yield* copyFixture('single-package');

          const path = yield* Path.Path;

          const pkgPath = path.join(tempDir, 'package.json');

          yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(pkgPath, 0o444)));

          const service = yield* PackageManagerService;
          const result = yield* Effect.result(
            service.writePackageJson({
              content: {
                name: 'should-fail',
                version: '1.0.0',
              },
            }),
          );

          yield* Effect.promise(() => import('node:fs/promises').then((fs) => fs.chmod(pkgPath, 0o644)));

          expect(result._tag).toBe('Failure');
        }),
      );

      it.effect('writePackageJson fails on invalid directory', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');

          const service = yield* PackageManagerService;
          const result = yield* Effect.result(
            service.writePackageJson({
              id: '/nonexistent/directory',
              content: {
                name: 'should-fail',
                version: '1.0.0',
              },
            }),
          );

          expect(result._tag).toBe('Failure');
        }),
      );

      it.effect('resolveRoot fails in non-workspace directory', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');

          const service = yield* PackageManagerService;
          const result = yield* Effect.result(service.resolveRoot());

          expect(result._tag).toBe('Failure');
        }),
      );
    });

    describe('edge cases', () => {
      it.effect('handles package.json with no scripts', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          yield* fs.writeFileString(
            path.join(tempDir, 'package.json'),
            yield* Schema.encodeUnknownEffect(Schema.fromJsonString(Schema.Unknown))({
              name: 'test-no-scripts',
              version: '1.0.0',
            }),
          );

          const service = yield* PackageManagerService;
          const pkg = yield* service.readPackageJson();

          strictEqual(pkg.scripts, undefined);
        }),
      );

      it.effect('handles package.json with empty scripts', () =>
        Effect.gen(function* () {
          const tempDir = yield* withTempTestEnv('PackageManagerService');

          const fs = yield* FileSystem.FileSystem;
          const path = yield* Path.Path;

          yield* fs.writeFileString(
            path.join(tempDir, 'package.json'),
            yield* Schema.encodeUnknownEffect(Schema.fromJsonString(Schema.Unknown))({
              name: 'test-empty-scripts',
              version: '1.0.0',
              scripts: {},
            }),
          );

          const service = yield* PackageManagerService;
          const pkg = yield* service.readPackageJson();

          expect(pkg.scripts).toStrictEqual({});
        }),
      );

      it.effect('addDependencies handles empty arrays', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('PackageManagerService');
          yield* copyFixture('single-package');
          yield* clearExecutedCommands;

          const service = yield* PackageManagerService;

          yield* service.addDependencies({
            dependencies: [],
            devDependencies: [],
          });

          const executed = yield* getExecutedCommands;

          strictEqual(executed.length, 0);
        }),
      );
    });
  });
});
