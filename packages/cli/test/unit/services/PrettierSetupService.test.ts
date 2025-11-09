import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import { describe, expect, it } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { PackageManagerService } from '../../../src/services/PackageManagerService.js';
import { PrettierSetupService } from '../../../src/services/PrettierSetupService.js';
import {
  clearExecutedCommands,
  getExecutedCommands,
  MockCommandExecutor,
  MockCommandExecutorLayer,
} from '../../helpers/MockCommandService.js';
import { copyFixture, withTempTestEnv } from '../../helpers/testEnv.js';

describe('PrettierSetupService', () => {
  const testLayer = Layer.mergeAll(
    PrettierSetupService.Default,
    PackageManagerService.Default,
    MockCommandExecutor.Default,
    MockCommandExecutorLayer,
    NodeFileSystem.layer,
    NodePath.layer,
  );

  describe('setup', () => {
    it.scoped('adds prettier config and scripts to package.json', (ctx) =>
      Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        const pm = yield* PackageManagerService;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        yield* clearExecutedCommands;

        // Run setup
        yield* service.setup();

        // Read updated package.json
        const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

        // Check prettier config was added
        strictEqual(updatedPkg.prettier, '@2digits/prettier-config');

        expect(updatedPkg.scripts).toMatchObject({
          format: 'prettier . --ignore-unknown --check --cache',
          'format:fix': 'prettier . --ignore-unknown --write --cache',
        });

        // Check that addDependencies was called
        const executed = yield* getExecutedCommands;

        assertTrue(executed.length > 0);

        expect(executed.at(0)?.command).toMatchInlineSnapshot(
          `"pnpm add --workspace-root -D prettier @2digits/prettier-config"`,
        );

        expect(updatedPkg).toMatchSnapshot();
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('preserves existing prettier config', (ctx) =>
      Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        const pm = yield* PackageManagerService;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('existing-configs');

        yield* clearExecutedCommands;

        // Run setup
        yield* service.setup();

        // Read updated package.json
        const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

        // Should preserve custom config
        strictEqual(updatedPkg.prettier, '@company/prettier-config');

        expect(updatedPkg.scripts).toMatchObject({
          'format:fix': 'prettier . --ignore-unknown --write --cache',
        });

        expect(updatedPkg.scripts).not.toMatchObject({
          format: 'prettier . --ignore-unknown --check --cache',
        });

        expect(updatedPkg).toMatchSnapshot();
      }).pipe(Effect.provide(testLayer)),
    );

    it.scoped('preserves existing scripts', (ctx) =>
      Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        const pm = yield* PackageManagerService;

        const tempDir = yield* withTempTestEnv(ctx.task.id);

        yield* copyFixture('single-package');

        const pkg = yield* pm.readPackageJson({ id: tempDir });

        pkg.scripts = { ...pkg.scripts };
        pkg.scripts.format = 'custom-format-command';

        yield* pm.writePackageJson({ id: tempDir, content: pkg });

        yield* clearExecutedCommands;

        // Run setup
        yield* service.setup();

        // Read updated package.json
        const updatedPkg = yield* pm.readPackageJson({ id: tempDir });

        // Should preserve existing format script
        strictEqual(updatedPkg.scripts?.format, 'custom-format-command');

        // Should preserve test script
        strictEqual(updatedPkg.scripts?.test, 'vitest');

        // Should still add format:fix if not present
        assertTrue(updatedPkg.scripts?.['format:fix'] !== undefined);

        expect(updatedPkg).toMatchSnapshot();
      }).pipe(Effect.provide(testLayer)),
    );
  });
});
