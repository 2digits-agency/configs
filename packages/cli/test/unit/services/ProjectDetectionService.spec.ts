/* eslint-disable ts/no-deprecated */
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Path from '@effect/platform/Path';
import { describe, expect, layer } from '@effect/vitest';
import { deepStrictEqual, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { MockCommandExecutor, MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe(ProjectDetectionService, () => {
  const testLayer = Layer.mergeAll(
    ProjectDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  layer(testLayer)((it) => {
    describe('isMonorepo', () => {
      it.scoped('detects monorepo with turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* ProjectDetectionService;
          const result = yield* service.isMonorepo();

          strictEqual(result, true);
        }),
      );

      it.scoped('does not detect monorepo without turbo.json', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('single-package');

          const service = yield* ProjectDetectionService;
          const result = yield* service.isMonorepo();

          strictEqual(result, false);
        }),
      );
    });

    describe('isTurborepoProject', () => {
      it.scoped('is an alias for isMonorepo', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('monorepo-turborepo');

          const service = yield* ProjectDetectionService;
          const result = yield* service.isTurborepoProject();

          strictEqual(result, true);
        }),
      );
    });

    describe('discoverWorkspaces', () => {
      it.scoped('discovers workspaces in packages/ directory', (ctx) =>
        Effect.gen(function* () {
          const testDir = yield* withTempTestEnv(ctx.task.id);

          yield* copyFixture('monorepo-turborepo');

          const service = yield* ProjectDetectionService;
          const workspaces = yield* service.discoverWorkspaces();

          // Should find the packages/app workspace
          strictEqual(workspaces.length, 1);
          strictEqual(workspaces[0]?.includes('packages/app'), true);

          expect(workspaces.at(0)).toMatch(`${testDir}/packages/app`);
        }),
      );

      it.scoped('returns empty array for single package project', (ctx) =>
        Effect.gen(function* () {
          yield* withTempTestEnv(ctx.task.id);
          yield* copyFixture('single-package');

          const service = yield* ProjectDetectionService;
          const workspaces = yield* service.discoverWorkspaces();

          deepStrictEqual(workspaces, []);
        }),
      );
    });

    describe('getWorkspacePackageJsonPath', () => {
      it.effect('returns correct package.json path', () =>
        Effect.gen(function* () {
          const service = yield* ProjectDetectionService;
          const path = yield* Path.Path;

          const workspacePath = '/root/packages/app';
          const result = service.getWorkspacePackageJsonPath(workspacePath);

          const expected = path.join(workspacePath, 'package.json');

          strictEqual(result, expected);
        }),
      );
    });
  });
});
