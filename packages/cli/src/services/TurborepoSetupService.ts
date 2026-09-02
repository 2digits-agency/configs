import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Struct from 'effect/Struct';

import { type TurboConfig, TurboConfigJson } from '../schemas/TurboConfig';
import { PackageManagerService } from './PackageManagerService';
import { ProjectDetectionService } from './ProjectDetectionService';

class TurborepoSetupError extends Schema.TaggedError<TurborepoSetupError>()(
  '@2digits/cli/services/TurborepoSetupService/TurborepoSetupError',
  {
    operation: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

type TaskCategory = 'build' | 'test' | 'lint' | 'typecheck' | 'dev' | 'other';

/**
 * Categorize a task name into a known category.
 *
 * @param taskName - The task name to categorize.
 */
function categorizeTask(taskName: string): TaskCategory {
  const lower = taskName.toLowerCase();

  if (Arr.contains(['build', 'compile', 'bundle'], lower)) {
    return 'build';
  }

  if (lower === 'test' || lower.includes('spec') || lower.includes('vitest')) {
    return 'test';
  }

  if (lower === 'lint' || lower.includes('eslint')) {
    return 'lint';
  }

  if (Arr.contains(['typecheck', 'types', 'tsc'], lower)) {
    return 'typecheck';
  }

  if (Arr.contains(['dev', 'start', 'serve'], lower)) {
    return 'dev';
  }

  return 'other';
}

/**
 * Generate turbo task configuration based on category.
 *
 * @param category - The task category to generate a task configuration for.
 */
const generateTaskConfig = Match.type<TaskCategory>().pipe(
  Match.withReturnType<Record<string, unknown>>(),
  Match.when('build', () => ({ dependsOn: ['^build'], outputs: ['dist/**', 'build/**', '.next/**', 'out/**'] })),
  Match.when('test', () => ({ dependsOn: ['^build'] })),
  Match.when('lint', () => ({ dependsOn: ['^build'] })),
  Match.when('typecheck', () => ({ dependsOn: ['^build'] })),
  Match.when('dev', () => ({ persistent: true, cache: false })),
  Match.orElse(() => ({})),
);

/**
 * Merge tasks into turbo.json config.
 *
 * @param existingConfig - The existing turbo.json config.
 * @param detectedTasks - The set of detected tasks.
 */
function mergeTasks(existingConfig: TurboConfig, detectedTasks: Set<string>): TurboConfig {
  const tasks = { ...existingConfig.tasks };

  for (const taskName of detectedTasks) {
    if (P.isTruthy(tasks[taskName])) {
      continue;
    }

    const category = categorizeTask(taskName);

    tasks[taskName] = generateTaskConfig(category);
  }

  return {
    ...existingConfig,
    tasks,
  };
}

/**
 * Service for setting up Turborepo configuration in projects.
 */
export class TurborepoSetupService extends Context.Service<TurborepoSetupService>()(
  '@2digits/cli/services/TurborepoSetupService',
  {
    make: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const pm = yield* PackageManagerService;
      const projectDetect = yield* ProjectDetectionService;

      /**
       * Detect tasks from workspace package.json files.
       */
      const detectWorkspaceTasks = Effect.fn('TurborepoSetupService.detectWorkspaceTasks')(function* () {
        const workspaces = yield* projectDetect.discoverWorkspaces();

        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        const tasksPerWorkspace = yield* Effect.forEach(
          workspaces,
          Effect.fn('TurborepoSetupService.readWorkspaceTasks')(function* (workspacePath) {
            const packageJson = yield* pm.readPackageJson({ id: workspacePath });

            return Struct.keys(packageJson.scripts ?? {});
          }),
          { concurrency: 'unbounded' },
        );

        return new Set(Arr.flatten(tasksPerWorkspace));
      });

      /**
       * Read existing turbo.json configuration.
       */
      const readTurboConfig = Effect.fn('TurborepoSetupService.readTurboConfig')(function* () {
        const root = yield* pm.resolveRoot();
        const turboPath = path.join(root, 'turbo.json');

        const exists = yield* fs.exists(turboPath).pipe(Effect.orElseSucceed(() => false));

        if (!exists) {
          return Opt.none();
        }

        const content = yield* fs.readFileString(turboPath).pipe(
          Effect.mapError((cause) =>
            TurborepoSetupError.make({
              operation: 'readTurboConfig',
              message: 'Failed to read turbo.json',
              cause,
            }),
          ),
        );

        const config = yield* Schema.decodeEffect(TurboConfigJson)(content).pipe(
          Effect.mapError((cause) =>
            TurborepoSetupError.make({
              operation: 'readTurboConfig',
              message: 'Invalid JSON in turbo.json',
              cause,
            }),
          ),
        );

        return Opt.some(config);
      });

      /**
       * Write turbo.json configuration.
       */
      const writeTurboConfig = Effect.fn('TurborepoSetupService.writeTurboConfig')(function* (config: TurboConfig) {
        const root = yield* pm.resolveRoot();
        const turboPath = path.join(root, 'turbo.json');

        const content = yield* Schema.encodeEffect(TurboConfigJson)(config).pipe(
          Effect.mapError((cause) =>
            TurborepoSetupError.make({
              operation: 'writeTurboConfig',
              message: 'Failed to write turbo.json',
              cause,
            }),
          ),
        );

        yield* fs.writeFileString(turboPath, content).pipe(
          Effect.mapError((cause) =>
            TurborepoSetupError.make({
              operation: 'writeTurboConfig',
              message: 'Failed to write turbo.json',
              cause,
            }),
          ),
        );

        yield* Effect.logInfo('✅ Updated turbo.json');
      });

      /**
       * Merge detected tasks into turbo.json.
       */
      const mergeTurboConfig = Effect.fn('TurborepoSetupService.mergeTurboConfig')(function* (
        detectedTasks: Set<string>,
      ) {
        const turboConfigOption = yield* readTurboConfig();

        yield* Match.value(turboConfigOption).pipe(
          Match.tag(
            'Some',
            Effect.fn('TurborepoSetupService.mergeExistingTurboConfig')(function* ({
              value: existingConfig,
            }: Opt.Some<TurboConfig>) {
              yield* writeTurboConfig(mergeTasks(existingConfig, detectedTasks));
              yield* Effect.logInfo(`📦 Merged ${detectedTasks.size} detected task(s) into turbo.json`);
            }),
          ),
          Match.tag(
            'None',
            Effect.fn('TurborepoSetupService.createTurboConfig')(function* () {
              yield* writeTurboConfig(mergeTasks({}, detectedTasks));
              yield* Effect.logInfo(`✨ Created turbo.json with ${detectedTasks.size} task(s)`);
            }),
          ),
          Match.exhaustive,
        );
      });

      /**
       * Update root package.json scripts to use turbo run.
       */
      const updateRootScripts = Effect.fn('TurborepoSetupService.updateRootScripts')(function* (
        detectedTasks: Set<string>,
      ) {
        const root = yield* pm.resolveRoot();
        const packageJson = yield* pm.readPackageJson({ id: root });

        packageJson.scripts ??= {};
        const { scripts } = packageJson;

        let updated = false;

        for (const taskName of detectedTasks) {
          const turboCommand = `turbo run ${taskName}`;

          // eslint-disable-next-line unicorn/no-unreadable-object-destructuring
          const { [taskName]: existingScript } = scripts;

          if (existingScript === undefined || existingScript === '') {
            scripts[taskName] = turboCommand;
            updated = true;
            yield* Effect.logInfo(`✅ Added script: ${taskName}`);
          } else if (existingScript !== turboCommand && !existingScript.includes('turbo')) {
            // Only update if not already using turbo
            scripts[taskName] = turboCommand;
            updated = true;
            yield* Effect.logInfo(`✅ Updated script: ${taskName}`);
          }
        }

        yield* updated
          ? pm.writePackageJson({ id: root, content: packageJson })
          : Effect.logInfo('✅ Scripts already configured');
      });

      /**
       * Ensure turbo is installed as devDependency.
       */
      const ensureTurboInstalled = Effect.fn('TurborepoSetupService.ensureTurboInstalled')(function* () {
        yield* Effect.logInfo('Checking turbo installation...');
        const root = yield* pm.resolveRoot();
        const packageJson = yield* pm.readPackageJson({ id: root });

        if (R.has(packageJson.dependencies ?? {}, 'turbo') || R.has(packageJson.devDependencies ?? {}, 'turbo')) {
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
       * Main setup orchestration workflow.
       */
      const setup = Effect.fn('TurborepoSetupService.setup')(function* () {
        yield* Effect.logInfo('🚀 Setting up Turborepo...');

        // Detect project type by checking for workspaces in root package.json
        yield* Effect.logInfo('Detecting project type...');
        const root = yield* pm.resolveRoot();
        const rootPackageJson = yield* pm.readPackageJson({ id: root });
        const isMonorepo = rootPackageJson.workspaces !== undefined;

        if (!isMonorepo) {
          yield* Effect.logInfo('⚠️  Not a monorepo project - Turborepo requires monorepo structure');
          yield* Effect.logInfo('💡 Configure workspaces in package.json to enable monorepo features');

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
          `Found ${detectedTasks.size} unique task(s): ${Arr.join(Arr.fromIterable(detectedTasks), ', ')}`,
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
  },
) {
  static readonly Default = Layer.effect(this, this.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        NodeFileSystem.layer,
        NodePath.layer,
        PackageManagerService.Default,
        ProjectDetectionService.Default,
      ),
    ),
  );
}
