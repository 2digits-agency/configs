import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Arr from 'effect/Array';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as R from 'effect/Record';

import type { TurboConfig } from '../schemas/TurboConfig';
import { EslintDetectionService } from './EslintDetectionService';
import { ensureScript, hasDependency, PackageManagerService } from './PackageManagerService';
import { ProjectDetectionService } from './ProjectDetectionService';
import { TurboConfigService } from './TurboConfigService';

const ESLINT_CONFIG_PACKAGE = '@2digits/eslint-config';

const DEFAULT_CONFIG = `import twoDigits from '${ESLINT_CONFIG_PACKAGE}';

export default twoDigits();
`;

const MONOREPO_ROOT_CONFIG = `import twoDigits from '${ESLINT_CONFIG_PACKAGE}';

export default twoDigits({
  ignores: {
    ignores: ['apps/**', 'packages/**'],
  },
});
`;

/**
 * Merge lint tasks into turbo.json.
 *
 * @param config - The base turbo config object.
 */
function mergeLintTasks(config: TurboConfig): TurboConfig {
  const tasks = { ...config.tasks };

  // Only add tasks if they don't already exist
  tasks.lint ??= {
    dependsOn: ['topo', '^build'],
    outputLogs: 'new-only',
  };

  tasks['lint:fix'] ??= {};

  tasks['//#lint:root'] ??= {
    outputLogs: 'new-only',
  };

  tasks['//#lint:root:fix'] ??= {};

  return {
    ...config,
    tasks,
  };
}

/**
 * Service for setting up ESLint configuration in projects.
 */
export class EslintSetupService extends Context.Service<EslintSetupService>()(
  '@2digits/cli/services/EslintSetupService',
  {
    make: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const path = yield* Path.Path;

      const pm = yield* PackageManagerService;

      const projectDetect = yield* ProjectDetectionService;

      const eslintDetect = yield* EslintDetectionService;

      const turboConfigService = yield* TurboConfigService;

      /**
       * Write ESLint configuration file.
       */
      const writeEslintConfig = Effect.fn('EslintSetupService.writeEslintConfig')(function* (
        configPath: string,
        content: string,
      ) {
        yield* fs.writeFileString(configPath, content);

        yield* Effect.logInfo(`✅ Created ${configPath}`);
      });

      /**
       * Backup existing ESLint configuration files.
       */
      const backupExistingConfigs = Effect.fn('EslintSetupService.backupExistingConfigs')(function* (dir?: string) {
        const root = yield* pm.resolveRoot();

        const targetDir = dir ?? root;

        const existingConfigs = yield* eslintDetect.detectExistingConfigs(targetDir);

        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        return yield* Effect.forEach(
          existingConfigs,
          Effect.fn('EslintSetupService.backupConfig')(function* (configPath) {
            const backupPath = `${configPath}.backup`;

            // Check if backup already exists, append timestamp if needed
            const backupExists = yield* fs.exists(backupPath).pipe(Effect.orElseSucceed(() => false));

            const finalBackupPath = backupExists ? `${backupPath}.${yield* Clock.currentTimeMillis}` : backupPath;

            yield* fs.copy(configPath, finalBackupPath);

            yield* Effect.logInfo(`📦 Backed up ${configPath} to ${finalBackupPath}`);

            return finalBackupPath;
          }),
        );
      });

      /**
       * Remove old ESLint configuration files after backup.
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
       * Write turbo.json configuration.
       */
      const writeTurboConfig = Effect.fn('EslintSetupService.writeTurboConfig')(function* (config: TurboConfig) {
        yield* turboConfigService.write(config);

        yield* Effect.logInfo('✅ Updated turbo.json with lint tasks');
      });

      /**
       * Ensure required dependencies are installed.
       */
      const ensureDependencies = Effect.fn('EslintSetupService.ensureDependencies')(function* () {
        yield* Effect.logInfo('Checking dependencies...');

        const root = yield* pm.resolveRoot();

        const packageJson = yield* pm.readPackageJson({ id: root });

        if (!hasDependency(packageJson, 'eslint')) {
          yield* Effect.logInfo(`Installing eslint and ${ESLINT_CONFIG_PACKAGE}...`);

          yield* pm.addDependencies({
            devDependencies: ['eslint', ESLINT_CONFIG_PACKAGE],
          });
        } else if (hasDependency(packageJson, ESLINT_CONFIG_PACKAGE)) {
          yield* Effect.logInfo('✅ Dependencies already installed');
        } else {
          yield* Effect.logInfo(`Installing ${ESLINT_CONFIG_PACKAGE}...`);

          yield* pm.addDependencies({
            devDependencies: [ESLINT_CONFIG_PACKAGE],
          });
        }
      });

      /**
       * Migrate existing ESLint configuration.
       */
      const migrateExistingConfigs = Effect.fn('EslintSetupService.migrateExistingConfigs')(function* (root: string) {
        const hasExistingConfig = yield* eslintDetect.hasEslintConfig(root);

        if (!hasExistingConfig) {
          return;
        }

        yield* Effect.logInfo('Detected existing ESLint configuration, backing up...');

        yield* backupExistingConfigs(root);

        yield* removeOldConfigs(root);
      });

      /**
       * Setup root ESLint configuration.
       */
      const setupRootConfig = Effect.fn('EslintSetupService.setupRootConfig')(function* (
        root: string,
        isMonorepo: boolean,
      ) {
        yield* Effect.logInfo('Generating root ESLint configuration...');

        const rootConfigPath = path.join(root, 'eslint.config.ts');

        const rootConfigExists = yield* fs.exists(rootConfigPath).pipe(Effect.orElseSucceed(() => false));

        const uses2Digits = rootConfigExists && (yield* eslintDetect.uses2DigitsConfig(rootConfigPath));

        yield* uses2Digits
          ? Effect.logInfo(`✅ Root config already uses ${ESLINT_CONFIG_PACKAGE}`)
          : writeEslintConfig(rootConfigPath, isMonorepo ? MONOREPO_ROOT_CONFIG : DEFAULT_CONFIG);
      });

      /**
       * Setup workspace ESLint configurations for monorepo.
       */
      const setupWorkspaceConfigs = Effect.fn('EslintSetupService.setupWorkspaceConfigs')(function* () {
        yield* Effect.logInfo('Discovering workspaces...');

        const workspaces = yield* projectDetect.discoverWorkspaces();

        if (Arr.isReadonlyArrayEmpty(workspaces)) {
          yield* Effect.logInfo('No workspaces found in apps/ or packages/');

          return;
        }

        yield* Effect.logInfo(`Found ${workspaces.length} workspace(s)`);

        for (const workspacePath of workspaces) {
          const workspaceConfigPath = path.join(workspacePath, 'eslint.config.ts');

          const workspaceConfigExists = yield* fs.exists(workspaceConfigPath).pipe(Effect.orElseSucceed(() => false));

          yield* workspaceConfigExists
            ? Effect.logInfo(`⚠️  Skipping ${workspaceConfigPath} (already exists)`)
            : writeEslintConfig(workspaceConfigPath, DEFAULT_CONFIG);
        }
      });

      /**
       * Update turbo.json with lint tasks.
       */
      const updateTurboConfig = Effect.fn('EslintSetupService.updateTurboConfig')(function* () {
        yield* Effect.logInfo('Updating turbo.json...');

        const turboConfigOption = yield* turboConfigService.read();

        yield* Opt.match(turboConfigOption, {
          onNone: () => Effect.logInfo('⚠️  turbo.json not found, skipping task configuration'),
          onSome: (turboConfig) =>
            R.has(turboConfig.tasks ?? {}, 'lint')
              ? Effect.logInfo('✅ Lint tasks already exist in turbo.json')
              : writeTurboConfig(mergeLintTasks(turboConfig)),
        });
      });

      /**
       * Validate setup and show completion message.
       */
      const validateAndComplete = Effect.fn('EslintSetupService.validateAndComplete')(function* () {
        yield* Effect.logInfo('Validating setup...');

        const root = yield* pm.resolveRoot();

        const finalPackageJson = yield* pm.readPackageJson({ id: root });

        if (!hasDependency(finalPackageJson, 'eslint') || !hasDependency(finalPackageJson, ESLINT_CONFIG_PACKAGE)) {
          yield* Effect.logError('⚠️  Warning: Dependencies may not be fully installed');
        }

        const lintCmd = yield* pm.runScriptCommand({ script: 'lint' });

        const lintFixCmd = yield* pm.runScriptCommand({ script: 'lint:fix' });

        yield* Effect.logInfo('🎉 ESLint setup complete!');

        yield* Effect.logInfo(`Run '${lintCmd}' to check linting`);

        yield* Effect.logInfo(`Run '${lintFixCmd}' to fix linting issues`);
      });

      /**
       * Add lint scripts to package.json.
       */
      const addLintScripts = Effect.fn('EslintSetupService.addLintScripts')(function* (isMonorepo: boolean) {
        const root = yield* pm.resolveRoot();

        const packageJson = yield* pm.readPackageJson({ id: root });

        packageJson.scripts ??= {};

        const { scripts } = packageJson;

        yield* ensureScript(scripts, 'lint', isMonorepo ? 'turbo run lint lint:root' : 'eslint .');

        yield* ensureScript(scripts, 'lint:fix', isMonorepo ? 'turbo run lint:fix lint:root:fix' : 'eslint . --fix');

        if (isMonorepo) {
          yield* ensureScript(scripts, 'lint:root', 'eslint .');

          yield* ensureScript(scripts, 'lint:root:fix', 'eslint . --fix');
        }

        yield* pm.writePackageJson({ id: root, content: packageJson });
      });

      /**
       * Main setup orchestration workflow.
       */
      const setup = Effect.fn('EslintSetupService.setup')(function* () {
        yield* Effect.logInfo('🚀 Setting up ESLint...');

        // Detect project type
        yield* Effect.logInfo('Detecting project type...');

        const isMonorepo = yield* projectDetect.isMonorepo();

        yield* Effect.logInfo(isMonorepo ? '✅ Detected Turborepo monorepo' : '✅ Detected single-package project');

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
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        NodeFileSystem.layer,
        NodePath.layer,
        PackageManagerService.layer,
        ProjectDetectionService.layer,
        EslintDetectionService.layer,
        TurboConfigService.layer,
      ),
    ),
  );
}
