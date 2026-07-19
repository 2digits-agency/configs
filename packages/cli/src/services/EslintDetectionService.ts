import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';

import { PackageManagerService } from './PackageManagerService';

/**
 * Service for detecting ESLint installation and configuration files.
 */
const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const pm = yield* PackageManagerService;

  /**
   * Check if ESLint is installed in the project dependencies.
   */
  const isEslintInstalled = Effect.fn('EslintDetectionService.isEslintInstalled')(function* (packageJsonPath?: string) {
    const root = yield* pm.resolveRoot();
    const pkgPath = packageJsonPath ?? path.join(root, 'package.json');

    const packageJson = yield* pm.readPackageJson({ id: pkgPath });

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return 'eslint' in deps;
  });

  /**
   * Check if any ESLint configuration file exists.
   */
  const hasEslintConfig = Effect.fn('EslintDetectionService.hasEslintConfig')(function* (dir?: string) {
    const root = yield* pm.resolveRoot();
    const targetDir = dir ?? root;

    const configFiles = [
      '.eslintrc',
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      'eslint.config.js',
      'eslint.config.cjs',
      'eslint.config.mjs',
      'eslint.config.ts',
    ];

    const checks = yield* Effect.all(
      configFiles.map((file) => fs.exists(path.join(targetDir, file)).pipe(Effect.map((exists) => ({ file, exists })))),
      { concurrency: 'unbounded' },
    );

    return checks.some((check) => check.exists);
  });

  /**
   * Detect all existing ESLint configuration files.
   */
  const detectExistingConfigs = Effect.fn('EslintDetectionService.detectExistingConfigs')(function* (dir?: string) {
    const root = yield* pm.resolveRoot();
    const targetDir = dir ?? root;

    const configFiles = [
      '.eslintrc',
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      'eslint.config.js',
      'eslint.config.cjs',
      'eslint.config.mjs',
    ];

    const checks = yield* Effect.all(
      configFiles.map((file) => fs.exists(path.join(targetDir, file)).pipe(Effect.map((exists) => ({ file, exists })))),
      { concurrency: 'unbounded' },
    );

    return checks.filter((check) => check.exists).map((check) => path.join(targetDir, check.file));
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
});

export class EslintDetectionService extends Context.Service<EslintDetectionService, Effect.Success<typeof make>>()(
  '@2digits/cli/services/EslintDetectionService',
) {
  static readonly layer = Layer.effect(EslintDetectionService, make).pipe(
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(NodePath.layer),
    Layer.provide(PackageManagerService.layer),
  );
}
