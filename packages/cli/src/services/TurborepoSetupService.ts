/* eslint-disable unicorn/no-array-callback-reference */

import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as Array from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { PackageManagerService } from './PackageManagerService';
import { ProjectDetectionService } from './ProjectDetectionService';

class TurborepoSetupError extends Data.TaggedError('TurborepoSetupError')<{
  message: string;
  cause?: unknown;
}> {}

export interface TurboConfig {
  tasks?: Record<string, unknown>;
  globalPassThroughEnv?: Array<string>;
  ui?: string;
  [key: string]: unknown;
}

type TaskCategory = 'build' | 'test' | 'lint' | 'typecheck' | 'dev' | 'other';

/**
 * Categorize a task name into a known category
 */
function categorizeTask(taskName: string): TaskCategory {
  const lower = taskName.toLowerCase();

  if (lower === 'build' || lower === 'compile' || lower === 'bundle') {
    return 'build';
  }

  if (lower === 'test' || lower.includes('spec') || lower.includes('vitest')) {
    return 'test';
  }

  if (lower === 'lint' || lower.includes('eslint')) {
    return 'lint';
  }

  if (lower === 'typecheck' || lower === 'types' || lower === 'tsc') {
    return 'typecheck';
  }

  if (lower === 'dev' || lower === 'start' || lower === 'serve') {
    return 'dev';
  }

  return 'other';
}

/**
 * Generate turbo task configuration based on category
 */
function generateTaskConfig(category: TaskCategory): Record<string, unknown> {
  switch (category) {
    case 'build': {
      return {
        dependsOn: ['^build'],
        outputs: ['dist/**', 'build/**', '.next/**', 'out/**'],
      };
    }
    case 'test':
    case 'lint':
    case 'typecheck': {
      return {
        dependsOn: ['^build'],
      };
    }
    case 'dev': {
      return {
        persistent: true,
        cache: false,
      };
    }
    default: {
      return {};
    }
  }
}

/**
 * Merge tasks into turbo.json config
 */
function mergeTasks(existingConfig: TurboConfig, detectedTasks: Set<string>): TurboConfig {
  const tasks = existingConfig.tasks || {};

  for (const taskName of detectedTasks) {
    if (!tasks[taskName]) {
      const category = categorizeTask(taskName);

      tasks[taskName] = generateTaskConfig(category);
    }
  }

  return {
    ...existingConfig,
    tasks,
  };
}

/**
 * Service for setting up Turborepo configuration in projects.
 */
export class TurborepoSetupService extends Effect.Service<TurborepoSetupService>()('TurborepoSetupService', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pm = yield* PackageManagerService;
    const projectDetect = yield* ProjectDetectionService;

    /**
     * Detect tasks from workspace package.json files
     */
    const detectWorkspaceTasks = Effect.fn('TurborepoSetupService.detectWorkspaceTasks')(function* () {
      const workspaces = yield* projectDetect.discoverWorkspaces();
      const taskNames = new Set<string>();

      for (const workspacePath of workspaces) {
        const packageJson = yield* pm
          .readPackageJson({ id: workspacePath })
          .pipe(Effect.orElseSucceed(() => ({ scripts: {} })));

        if (packageJson.scripts) {
          for (const scriptName of Object.keys(packageJson.scripts)) {
            taskNames.add(scriptName);
          }
        }
      }

      return taskNames;
    });

    /**
     * Read existing turbo.json configuration
     */
    const readTurboConfig = Effect.fn('TurborepoSetupService.readTurboConfig')(function* () {
      const root = yield* pm.resolveRoot();
      const turboPath = path.join(root, 'turbo.json');

      const exists = yield* fs.exists(turboPath).pipe(Effect.orElseSucceed(() => false));

      if (!exists) {
        return Option.none();
      }

      const content = yield* fs
        .readFileString(turboPath)
        .pipe(Effect.mapError((cause) => new TurborepoSetupError({ message: 'Failed to read turbo.json', cause })));

      const config = yield* Effect.try({
        try: () => JSON.parse(content) as TurboConfig,
        catch: (cause) =>
          new TurborepoSetupError({
            message: 'Invalid JSON in turbo.json',
            cause,
          }),
      });

      return Option.some(config);
    });

    /**
     * Write turbo.json configuration
     */
    const writeTurboConfig = Effect.fn('TurborepoSetupService.writeTurboConfig')(function* (config: TurboConfig) {
      const root = yield* pm.resolveRoot();
      const turboPath = path.join(root, 'turbo.json');

      const content = JSON.stringify(config, undefined, 2);

      yield* fs
        .writeFileString(turboPath, content)
        .pipe(Effect.mapError((cause) => new TurborepoSetupError({ message: 'Failed to write turbo.json', cause })));

      yield* Effect.logInfo('✅ Updated turbo.json');
    });

    /**
     * Merge detected tasks into turbo.json
     */
    const mergeTurboConfig = Effect.fn('TurborepoSetupService.mergeTurboConfig')(function* (
      detectedTasks: Set<string>,
    ) {
      const turboConfigOption = yield* readTurboConfig();

      if (Option.isSome(turboConfigOption)) {
        const existingConfig = turboConfigOption.value;
        const mergedConfig = mergeTasks(existingConfig, detectedTasks);

        yield* writeTurboConfig(mergedConfig);
        yield* Effect.logInfo(`📦 Merged ${detectedTasks.size} detected task(s) into turbo.json`);
      } else {
        const newConfig = mergeTasks({}, detectedTasks);

        yield* writeTurboConfig(newConfig);
        yield* Effect.logInfo(`✨ Created turbo.json with ${detectedTasks.size} task(s)`);
      }
    });

    /**
     * Update root package.json scripts to use turbo run
     */
    const updateRootScripts = Effect.fn('TurborepoSetupService.updateRootScripts')(function* (
      detectedTasks: Set<string>,
    ) {
      const root = yield* pm.resolveRoot();
      const packageJson = yield* pm.readPackageJson({ id: root });

      packageJson.scripts = packageJson.scripts || {};

      let updated = false;

      for (const taskName of detectedTasks) {
        const turboCommand = `turbo run ${taskName}`;

        if (!packageJson.scripts[taskName]) {
          packageJson.scripts[taskName] = turboCommand;
          updated = true;
          yield* Effect.logInfo(`✅ Added script: ${taskName}`);
        } else if (packageJson.scripts[taskName] !== turboCommand) {
          // Only update if not already using turbo
          const existingScript = packageJson.scripts[taskName];

          if (!existingScript.includes('turbo')) {
            packageJson.scripts[taskName] = turboCommand;
            updated = true;
            yield* Effect.logInfo(`✅ Updated script: ${taskName}`);
          }
        }
      }

      yield* updated
        ? pm.writePackageJson({ id: root, content: packageJson })
        : Effect.logInfo('✅ Scripts already configured');
    });

    /**
     * Ensure turbo is installed as devDependency
     */
    const ensureTurboInstalled = Effect.fn('TurborepoSetupService.ensureTurboInstalled')(function* () {
      yield* Effect.logInfo('Checking turbo installation...');
      const packageJson = yield* pm.readPackageJson();
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if ('turbo' in deps) {
        yield* Effect.logInfo('✅ Turbo already installed');
      } else {
        yield* Effect.logInfo('Installing turbo...');
        yield* pm.addDependencies({
          devDependencies: ['turbo'],
        });
        yield* Effect.logInfo('✅ Installed turbo');
      }
    });

    /**
     * Main setup orchestration workflow
     */
    const setup = Effect.fn('TurborepoSetupService.setup')(function* () {
      yield* Effect.logInfo('🚀 Setting up Turborepo...');

      // Detect project type
      yield* Effect.logInfo('Detecting project type...');
      const isMonorepo = yield* projectDetect.isMonorepo();

      if (!isMonorepo) {
        yield* Effect.logInfo('⚠️  Not a monorepo project - Turborepo requires monorepo structure');
        yield* Effect.logInfo('💡 Create turbo.json to enable monorepo features');

        return;
      }

      yield* Effect.logInfo('✅ Detected monorepo project');

      // Ensure turbo is installed
      yield* ensureTurboInstalled();

      // Detect workspace tasks
      yield* Effect.logInfo('Scanning workspaces for tasks...');
      const detectedTasks = yield* detectWorkspaceTasks();

      if (detectedTasks.size === 0) {
        yield* Effect.logInfo('⚠️  No tasks detected in workspaces');

        return;
      }

      yield* Effect.logInfo(
        `Found ${detectedTasks.size} unique task(s): ${Array.fromIterable(detectedTasks).join(', ')}`,
      );

      // Merge tasks into turbo.json
      yield* mergeTurboConfig(detectedTasks);

      // Update root scripts
      yield* Effect.logInfo('Updating root package.json scripts...');
      yield* updateRootScripts(detectedTasks);

      // Completion
      const turboCmd = yield* pm.runScriptCommand({ script: 'build' });

      yield* Effect.logInfo('🎉 Turborepo setup complete!');
      yield* Effect.logInfo(`Run '${turboCmd}' to test the build pipeline`);
    });

    return {
      setup,
      detectWorkspaceTasks,
      readTurboConfig,
      writeTurboConfig,
      mergeTurboConfig,
      updateRootScripts,
      ensureTurboInstalled,
    };
  }),
  dependencies: [NodeFileSystem.layer, NodePath.layer, PackageManagerService.Default, ProjectDetectionService.Default],
}) {}
