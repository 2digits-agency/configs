import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, expect, it } from '@effect/vitest';
import { deepStrictEqual, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { ProjectDetectionService } from '../../../src/services/ProjectDetectionService.js';
import { MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe(ProjectDetectionService, () => {
  const testLayer = Layer.mergeAll(
    ProjectDetectionService.layer,
    PackageManagerService.layer,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('isMonorepo', () => {
    it.effect('detects monorepo with turbo.json', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-turborepo');

        const service = yield* ProjectDetectionService;
        const result = yield* service.isMonorepo;

        strictEqual(result, true);
      }).pipe(Effect.provide(testLayer)),
    );

    it.effect('does not detect monorepo without turbo.json', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* ProjectDetectionService;
        const result = yield* service.isMonorepo;

        strictEqual(result, false);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('isTurborepoProject', () => {
    it.effect('is an alias for isMonorepo', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('monorepo-turborepo');

        const service = yield* ProjectDetectionService;
        const result = yield* service.isTurborepoProject;

        strictEqual(result, true);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('discoverWorkspaces', () => {
    it.effect('discovers workspaces in packages/ directory', (ctx) =>
      Effect.gen(function* () {
        const testDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('monorepo-turborepo');

        const service = yield* ProjectDetectionService;
        const workspaces = yield* service.discoverWorkspaces;

        // Should find the packages/app workspace
        strictEqual(workspaces.length, 1);
        strictEqual(workspaces[0]?.includes('packages/app'), true);

        expect(workspaces.at(0)).toMatch(`${testDir}/packages/app`);
      }).pipe(Effect.provide(testLayer)),
    );

    it.effect('returns empty array for single package project', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* ProjectDetectionService;
        const workspaces = yield* service.discoverWorkspaces;

        deepStrictEqual(workspaces, []);
      }).pipe(Effect.provide(testLayer)),
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
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
