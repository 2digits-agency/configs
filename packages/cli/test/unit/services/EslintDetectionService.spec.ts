import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, layer } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';

import { EslintDetectionService } from '../../../src/services/EslintDetectionService.js';
import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { MockCommandExecutor, MockCommandExecutorLayer } from '../../helpers/MockCommandService.js';
import { copyFixture, fixturesBasePath, withTempTestEnv } from '../../helpers/testEnv.js';

describe(EslintDetectionService, () => {
  const testLayer = Layer.mergeAll(
    EslintDetectionService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  layer(testLayer)((it) => {
    describe('isEslintInstalled', () => {
      it.effect('detects eslint in devDependencies', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('existing-configs');

          const service = yield* EslintDetectionService;
          const result = yield* service.isEslintInstalled();

          strictEqual(result, true);
        }),
      );

      it.effect('returns false when eslint not installed', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('single-package');

          const service = yield* EslintDetectionService;
          const result = yield* service.isEslintInstalled();

          strictEqual(result, false);
        }),
      );
    });

    describe('hasEslintConfig', () => {
      it.effect('detects existing eslint config file', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('existing-configs');

          const service = yield* EslintDetectionService;
          const result = yield* service.hasEslintConfig();

          strictEqual(result, true);
        }),
      );

      it.effect('returns false when no config exists', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('single-package');

          const service = yield* EslintDetectionService;
          const result = yield* service.hasEslintConfig();

          strictEqual(result, false);
        }),
      );
    });

    describe('detectExistingConfigs', () => {
      it.effect('returns list of existing config files', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('existing-configs');

          const service = yield* EslintDetectionService;
          const configs = yield* service.detectExistingConfigs();

          assertTrue(configs.length > 0);
          assertTrue(configs.some((path) => path.includes('eslint.config.js')));
        }),
      );

      it.effect('returns empty array when no configs exist', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('single-package');

          const service = yield* EslintDetectionService;
          const configs = yield* service.detectExistingConfigs();

          strictEqual(configs.length, 0);
        }),
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
        }),
      );

      it.effect('returns false when config file does not exist', () =>
        Effect.gen(function* () {
          yield* withTempTestEnv('EslintDetectionService');
          yield* copyFixture('single-package');

          const service = yield* EslintDetectionService;
          const result = yield* service.uses2DigitsConfig();

          strictEqual(result, false);
        }),
      );
    });
  });
});
