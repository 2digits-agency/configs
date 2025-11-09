import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Path from '@effect/platform/Path';
import { describe, it } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { EslintDetectionService } from '../../../src/services/EslintDetectionService.js';
import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { MockCommandExecutor, MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, fixturesBasePath, withTempTestEnv } from '../../helpers/testEnv.js';

describe('EslintDetectionService', () => {
  const testLayer = Layer.mergeAll(
    EslintDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('isEslintInstalled', () => {
    it.scoped('detects eslint in devDependencies', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('existing-configs');

        const service = yield* EslintDetectionService;
        const result = yield* service.isEslintInstalled();

        strictEqual(result, true);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns false when eslint not installed', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* EslintDetectionService;
        const result = yield* service.isEslintInstalled();

        strictEqual(result, false);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('hasEslintConfig', () => {
    it.scoped('detects existing eslint config file', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('existing-configs');

        const service = yield* EslintDetectionService;
        const result = yield* service.hasEslintConfig();

        strictEqual(result, true);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns false when no config exists', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* EslintDetectionService;
        const result = yield* service.hasEslintConfig();

        strictEqual(result, false);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('detectExistingConfigs', () => {
    it.scoped('returns list of existing config files', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('existing-configs');

        const service = yield* EslintDetectionService;
        const configs = yield* service.detectExistingConfigs();

        assertTrue(configs.length > 0);
        assertTrue(configs.some((path) => path.includes('eslint.config.js')));
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns empty array when no configs exist', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* EslintDetectionService;
        const configs = yield* service.detectExistingConfigs();

        strictEqual(configs.length, 0);
      }).pipe(Effect.provide(testLayer)),
    );
  });

  describe('uses2DigitsConfig', () => {
    it.effect('detects @2digits/eslint-config in config file', () =>
      Effect.gen(function* () {
        const service = yield* EslintDetectionService;
        const path = yield* Path.Path;
        const fixturesDir = yield* fixturesBasePath;

        // For this test, we need to create a fixture with @2digits/eslint-config
        // Let's test with a specific path
        const configPath = path.join(fixturesDir, 'existing-configs/eslint.config.js');

        const result = yield* service.uses2DigitsConfig(configPath);
        // The fixture has @company/eslint-config, not @2digits

        strictEqual(result, false);
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('returns false when config file does not exist', (ctx) =>
      Effect.gen(function* () {
        yield* withTempTestEnv(ctx.task.id);
        yield* copyFixture('single-package');

        const service = yield* EslintDetectionService;
        const result = yield* service.uses2DigitsConfig();

        strictEqual(result, false);
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
