import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Array from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Path from 'effect/Path';
import * as Record from 'effect/Record';

import { PackageManagerService } from './PackageManagerService';

const ESLINT_CONFIG_FILES = [
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
] as const;

/**
 * Service for detecting ESLint installation and configuration files.
 */
export class EslintDetectionService extends Context.Service<EslintDetectionService>()(
  '@2digits/cli/services/EslintDetectionService',
  {
    make: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const pm = yield* PackageManagerService;

      const findExistingConfigs = Effect.fn('EslintDetectionService.findExistingConfigs')(function* (
        targetDir: string,
        configFiles: ReadonlyArray<string>,
      ) {
        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        const configs = yield* Effect.forEach(
          configFiles,
          Effect.fn('EslintDetectionService.checkConfig')(function* (file) {
            const configPath = path.join(targetDir, file);

            return (yield* fs.exists(configPath)) ? Option.some(configPath) : Option.none();
          }),
          { concurrency: 'unbounded' },
        );

        return Array.getSomes(configs);
      });

      /**
       * Check if ESLint is installed in the project dependencies.
       */
      const isEslintInstalled = Effect.fn('EslintDetectionService.isEslintInstalled')(function* (
        packageJsonPath?: string,
      ) {
        const root = yield* pm.resolveRoot();
        const pkgPath = packageJsonPath ?? path.join(root, 'package.json');

        const packageJson = yield* pm.readPackageJson({ id: pkgPath });

        return (
          Record.has(packageJson.dependencies ?? {}, 'eslint') ||
          Record.has(packageJson.devDependencies ?? {}, 'eslint')
        );
      });

      /**
       * Check if any ESLint configuration file exists.
       */
      const hasEslintConfig = Effect.fn('EslintDetectionService.hasEslintConfig')(function* (dir?: string) {
        const root = yield* pm.resolveRoot();
        const targetDir = dir ?? root;

        const existingConfigs = yield* findExistingConfigs(targetDir, [...ESLINT_CONFIG_FILES, 'eslint.config.ts']);

        return Array.isReadonlyArrayNonEmpty(existingConfigs);
      });

      /**
       * Detect all existing ESLint configuration files.
       */
      const detectExistingConfigs = Effect.fn('EslintDetectionService.detectExistingConfigs')(function* (dir?: string) {
        const root = yield* pm.resolveRoot();
        const targetDir = dir ?? root;

        return yield* findExistingConfigs(targetDir, ESLINT_CONFIG_FILES);
      });

      /**
       * Check if the project uses @2digits/eslint-config.
       */
      const uses2DigitsConfig = Effect.fn('EslintDetectionService.uses2DigitsConfig')(function* (configPath?: string) {
        const root = yield* pm.resolveRoot();
        const targetPath = configPath ?? path.join(root, 'eslint.config.ts');

        const exists = yield* fs.exists(targetPath).pipe(Effect.orElseSucceed(() => false));

        if (!exists) {
          return false;
        }

        const content = yield* fs.readFileString(targetPath).pipe(Effect.orElseSucceed(() => ''));

        return content.includes('@2digits/eslint-config');
      });

      return {
        isEslintInstalled,
        hasEslintConfig,
        detectExistingConfigs,
        uses2DigitsConfig,
      };
    }),
  },
) {
  static readonly Default = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, PackageManagerService.Default)),
  );
}
