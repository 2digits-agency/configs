/* eslint-disable unicorn/no-array-callback-reference */

import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as Array from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { EslintDetectionService } from './EslintDetectionService';
import { PackageManagerService } from './PackageManagerService';
import { ProjectDetectionService } from './ProjectDetectionService';

class EslintSetupError extends Data.TaggedError('EslintSetupError')<{
  message: string;
  cause?: unknown;
}> {}

interface TurboConfig {
  tasks?: Record<string, unknown>;
  globalPassThroughEnv?: Array<string>;
  ui?: string;
  [key: string]: unknown;
}

/**
 * Generate root ESLint configuration content
 */
function generateRootConfig(isMonorepo: boolean): string {
  if (isMonorepo) {
    return `import twoDigits from '@2digits/eslint-config';

export default twoDigits({
  ignores: {
    ignores: ['apps/**', 'packages/**'],
  },
});
`;
  }

  return `import twoDigits from '@2digits/eslint-config';

export default twoDigits();
`;
}

/**
 * Generate workspace ESLint configuration content
 */
function generateWorkspaceConfig(): string {
  return `import twoDigits from '@2digits/eslint-config';

export default twoDigits();
`;
}

/**
 * Merge lint tasks into turbo.json
 */
function mergeLintTasks(config: TurboConfig): TurboConfig {
  const tasks = config.tasks || {};

  // Only add tasks if they don't already exist
  if (!tasks.lint) {
    tasks.lint = {
      dependsOn: ['topo', '^build'],
      outputLogs: 'new-only',
    };
  }

  if (!tasks['lint:fix']) {
    tasks['lint:fix'] = {};
  }

  if (!tasks['//#lint:root']) {
    tasks['//#lint:root'] = {
      outputLogs: 'new-only',
    };
  }

  if (!tasks['//#lint:root:fix']) {
    tasks['//#lint:root:fix'] = {};
  }

  return {
    ...config,
    tasks,
  };
}

/**
 * Service for setting up ESLint configuration in projects.
 */
export class EslintSetupService extends Effect.Service<EslintSetupService>()('EslintSetupService', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pm = yield* PackageManagerService;
    const projectDetect = yield* ProjectDetectionService;
    const eslintDetect = yield* EslintDetectionService;

    /**
     * Write ESLint configuration file
     */
    const writeEslintConfig = Effect.fn('EslintSetupService.writeEslintConfig')(function* (
      configPath: string,
      content: string,
    ) {
      yield* fs.writeFileString(configPath, content);
      yield* Effect.logInfo(`✅ Created ${configPath}`);
    });

    /**
     * Backup existing ESLint configuration files
     */
    const backupExistingConfigs = Effect.fn('EslintSetupService.backupExistingConfigs')(function* (dir?: string) {
      const root = yield* pm.resolveRoot();
      const targetDir = dir ?? root;

      const existingConfigs = yield* eslintDetect.detectExistingConfigs(targetDir);

      if (existingConfigs.length === 0) {
        return [];
      }

      const backups: Array<string> = [];

      for (const configPath of existingConfigs) {
        const backupPath = `${configPath}.backup`;

        // Check if backup already exists, append timestamp if needed
        const backupExists = yield* fs.exists(backupPath).pipe(Effect.orElseSucceed(() => false));

        const finalBackupPath = backupExists ? `${backupPath}.${Date.now()}` : backupPath;

        yield* fs.copy(configPath, finalBackupPath);
        backups.push(finalBackupPath);

        yield* Effect.logInfo(`📦 Backed up ${configPath} to ${finalBackupPath}`);
      }

      return backups;
    });

    /**
     * Remove old ESLint configuration files after backup
     */
    const removeOldConfigs = Effect.fn('EslintSetupService.removeOldConfigs')(function* (dir?: string) {
      const root = yield* pm.resolveRoot();
      const targetDir = dir ?? root;

      const existingConfigs = yield* eslintDetect.detectExistingConfigs(targetDir);

      for (const configPath of existingConfigs) {
        yield* fs.remove(configPath);
        yield* Effect.logInfo(`🗑️  Removed ${configPath}`);
      }
    });

    /**
     * Read turbo.json configuration
     */
    const readTurboConfig = Effect.fn('EslintSetupService.readTurboConfig')(function* () {
      const root = yield* pm.resolveRoot();
      const turboPath = path.join(root, 'turbo.json');

      const exists = yield* fs.exists(turboPath).pipe(Effect.orElseSucceed(() => false));

      if (!exists) {
        return Option.none();
      }

      const content = yield* fs
        .readFileString(turboPath)
        .pipe(Effect.mapError((cause) => new EslintSetupError({ message: 'Failed to read turbo.json', cause })));

      const config = yield* Effect.try({
        try: () => JSON.parse(content) as TurboConfig,
        catch: (cause) =>
          new EslintSetupError({
            message: 'Invalid JSON in turbo.json',
            cause,
          }),
      });

      return Option.some(config);
    });

    /**
     * Write turbo.json configuration
     */
    const writeTurboConfig = Effect.fn('EslintSetupService.writeTurboConfig')(function* (config: TurboConfig) {
      const root = yield* pm.resolveRoot();
      const turboPath = path.join(root, 'turbo.json');

      const content = JSON.stringify(config, undefined, 2);

      yield* fs
        .writeFileString(turboPath, content)
        .pipe(Effect.mapError((cause) => new EslintSetupError({ message: 'Failed to write turbo.json', cause })));

      yield* Effect.logInfo('✅ Updated turbo.json with lint tasks');
    });

    /**
     * Ensure required dependencies are installed
     */
    const ensureDependencies = Effect.fn('EslintSetupService.ensureDependencies')(function* () {
      yield* Effect.logInfo('Checking dependencies...');
      const eslintInstalled = yield* eslintDetect.isEslintInstalled();

      if (eslintInstalled) {
        const packageJson = yield* pm.readPackageJson();
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        if ('@2digits/eslint-config' in deps) {
          yield* Effect.logInfo('✅ Dependencies already installed');
        } else {
          yield* Effect.logInfo('Installing @2digits/eslint-config...');
          yield* pm.addDependencies({
            devDependencies: ['@2digits/eslint-config'],
          });
        }
      } else {
        yield* Effect.logInfo('Installing eslint and @2digits/eslint-config...');
        yield* pm.addDependencies({
          devDependencies: ['eslint', '@2digits/eslint-config'],
        });
      }
    });

    /**
     * Migrate existing ESLint configuration
     */
    const migrateExistingConfigs = Effect.fn('EslintSetupService.migrateExistingConfigs')(function* (root: string) {
      const hasExistingConfig = yield* eslintDetect.hasEslintConfig(root);

      if (hasExistingConfig) {
        yield* Effect.logInfo('Detected existing ESLint configuration, backing up...');
        yield* backupExistingConfigs(root);
        yield* removeOldConfigs(root);
      }
    });

    /**
     * Setup root ESLint configuration
     */
    const setupRootConfig = Effect.fn('EslintSetupService.setupRootConfig')(function* (
      root: string,
      isMonorepo: boolean,
    ) {
      yield* Effect.logInfo('Generating root ESLint configuration...');
      const rootConfigPath = path.join(root, 'eslint.config.ts');
      const rootConfigExists = yield* fs.exists(rootConfigPath).pipe(Effect.orElseSucceed(() => false));
      const uses2Digits = rootConfigExists ? yield* eslintDetect.uses2DigitsConfig(rootConfigPath) : false;

      if (!rootConfigExists || !uses2Digits) {
        const rootConfig = generateRootConfig(isMonorepo);

        yield* writeEslintConfig(rootConfigPath, rootConfig);
      } else {
        yield* Effect.logInfo('✅ Root config already uses @2digits/eslint-config');
      }
    });

    /**
     * Setup workspace ESLint configurations for monorepo
     */
    const setupWorkspaceConfigs = Effect.fn('EslintSetupService.setupWorkspaceConfigs')(function* () {
      yield* Effect.logInfo('Discovering workspaces...');
      const workspaces = yield* projectDetect.discoverWorkspaces();

      if (Array.isNonEmptyArray(workspaces)) {
        yield* Effect.logInfo(`Found ${workspaces.length} workspace(s)`);

        for (const workspacePath of workspaces) {
          const workspaceConfigPath = path.join(workspacePath, 'eslint.config.ts');
          const workspaceConfigExists = yield* fs.exists(workspaceConfigPath).pipe(Effect.orElseSucceed(() => false));

          if (workspaceConfigExists) {
            yield* Effect.logInfo(`⚠️  Skipping ${workspaceConfigPath} (already exists)`);
          } else {
            const workspaceConfig = generateWorkspaceConfig();

            yield* writeEslintConfig(workspaceConfigPath, workspaceConfig);
          }
        }
      } else {
        yield* Effect.logInfo('No workspaces found in apps/ or packages/');
      }
    });

    /**
     * Update turbo.json with lint tasks
     */
    const updateTurboConfig = Effect.fn('EslintSetupService.updateTurboConfig')(function* () {
      yield* Effect.logInfo('Updating turbo.json...');
      const turboConfigOption = yield* readTurboConfig();

      if (Option.isSome(turboConfigOption)) {
        const turboConfig = turboConfigOption.value;
        const hasLintTask = turboConfig.tasks && 'lint' in turboConfig.tasks;

        if (hasLintTask) {
          yield* Effect.logInfo('✅ Lint tasks already exist in turbo.json');
        } else {
          const mergedConfig = mergeLintTasks(turboConfig);

          yield* writeTurboConfig(mergedConfig);
        }
      } else {
        yield* Effect.logInfo('⚠️  turbo.json not found, skipping task configuration');
      }
    });

    /**
     * Validate setup and show completion message
     */
    const validateAndComplete = Effect.fn('EslintSetupService.validateAndComplete')(function* () {
      yield* Effect.logInfo('Validating setup...');
      const finalPackageJson = yield* pm.readPackageJson();
      const finalDeps = {
        ...finalPackageJson.dependencies,
        ...finalPackageJson.devDependencies,
      };

      if (!('eslint' in finalDeps) || !('@2digits/eslint-config' in finalDeps)) {
        yield* Effect.logError('⚠️  Warning: Dependencies may not be fully installed');
      }

      const lintCmd = yield* pm.runScriptCommand({ script: 'lint' });
      const lintFixCmd = yield* pm.runScriptCommand({ script: 'lint:fix' });

      yield* Effect.logInfo('🎉 ESLint setup complete!');
      yield* Effect.logInfo(`Run '${lintCmd}' to check linting`);
      yield* Effect.logInfo(`Run '${lintFixCmd}' to fix linting issues`);
    });

    /**
     * Add lint scripts to package.json
     */
    const addLintScripts = Effect.fn('EslintSetupService.addLintScripts')(function* (isMonorepo: boolean) {
      const root = yield* pm.resolveRoot();
      const packageJson = yield* pm.readPackageJson({ id: root });

      packageJson.scripts = packageJson.scripts || {};

      if (!packageJson.scripts.lint) {
        packageJson.scripts.lint = isMonorepo ? 'turbo run lint lint:root' : 'eslint .';
        yield* Effect.logInfo('✅ Added lint script');
      }

      if (!packageJson.scripts['lint:fix']) {
        packageJson.scripts['lint:fix'] = isMonorepo ? 'turbo run lint:fix lint:root:fix' : 'eslint . --fix';
        yield* Effect.logInfo('✅ Added lint:fix script');
      }

      if (isMonorepo) {
        if (!packageJson.scripts['lint:root']) {
          packageJson.scripts['lint:root'] = 'eslint .';
          yield* Effect.logInfo('✅ Added lint:root script');
        }

        if (!packageJson.scripts['lint:root:fix']) {
          packageJson.scripts['lint:root:fix'] = 'eslint . --fix';
          yield* Effect.logInfo('✅ Added lint:root:fix script');
        }
      }

      yield* pm.writePackageJson({ id: root, content: packageJson });
    });

    /**
     * Main setup orchestration workflow
     */
    const setup = Effect.fn('EslintSetupService.setup')(function* () {
      yield* Effect.logInfo('🚀 Setting up ESLint...');

      // Detect project type
      yield* Effect.logInfo('Detecting project type...');
      const isMonorepo = yield* projectDetect.isMonorepo();

      yield* isMonorepo
        ? Effect.logInfo('✅ Detected Turborepo monorepo')
        : Effect.logInfo('✅ Detected single-package project');

      // Install dependencies
      yield* ensureDependencies();

      // Migrate existing configurations
      const root = yield* pm.resolveRoot();

      yield* migrateExistingConfigs(root);

      // Setup configurations
      yield* setupRootConfig(root, isMonorepo);

      if (isMonorepo) {
        yield* setupWorkspaceConfigs();
        yield* updateTurboConfig();
      }

      // Add npm scripts
      yield* Effect.logInfo('Adding npm scripts...');
      yield* addLintScripts(isMonorepo);

      // Validate and complete
      yield* validateAndComplete();
    });

    return {
      setup,
    };
  }),
  dependencies: [
    NodeFileSystem.layer,
    NodePath.layer,
    PackageManagerService.Default,
    ProjectDetectionService.Default,
    EslintDetectionService.Default,
  ],
}) {}
