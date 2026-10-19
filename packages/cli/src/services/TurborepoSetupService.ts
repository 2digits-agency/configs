import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';

import type { TurboConfig } from '../schemas/TurboConfig';
import { hasDependency, PackageManagerService } from './PackageManagerService';
import { ProjectDetectionService } from './ProjectDetectionService';
import { TurboConfigService } from './TurboConfigService';

type TaskCategory = 'build' | 'test' | 'lint' | 'typecheck' | 'dev' | 'other';

const taskCategoriesByName: ReadonlyMap<string, TaskCategory> = new Map([
  ['build', 'build'],
  ['compile', 'build'],
  ['bundle', 'build'],
  ['test', 'test'],
  ['lint', 'lint'],
  ['typecheck', 'typecheck'],
  ['types', 'typecheck'],
  ['tsc', 'typecheck'],
  ['dev', 'dev'],
  ['start', 'dev'],
  ['serve', 'dev'],
]);

/**
 * Categorize a task name into a known category.
 *
 * @param taskName - The task name to categorize.
 */
function categorizeTask(taskName: string): TaskCategory {
  const lower = Str.toLowerCase(taskName);

  return (
    taskCategoriesByName.get(lower) ??
    Match.value(lower).pipe(
      Match.withReturnType<TaskCategory>(),
      Match.when(
        (name) => name.includes('spec') || name.includes('vitest'),
        () => 'test',
      ),
      Match.when(Str.includes('eslint'), () => 'lint'),
      Match.orElse(() => 'other'),
    )
  );
}

/**
 * Generate turbo task configuration based on category.
 *
 * @param category - The task category to generate a task configuration for.
 */
const generateTaskConfig = Match.type<TaskCategory>().pipe(
  Match.withReturnType<Record<string, unknown>>(),
  Match.when('build', () => ({ dependsOn: ['^build'], outputs: ['dist/**', 'build/**', '.next/**', 'out/**'] })),
  Match.when(Match.is('test', 'lint', 'typecheck'), () => ({ dependsOn: ['^build'] })),
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
    if (!P.isTruthy(tasks[taskName])) {
      tasks[taskName] = generateTaskConfig(categorizeTask(taskName));
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
export class TurborepoSetupService extends Context.Service<TurborepoSetupService>()(
  '@2digits/cli/services/TurborepoSetupService',
  {
    make: Effect.gen(function* () {
      const pm = yield* PackageManagerService;

      const projectDetect = yield* ProjectDetectionService;

      const turboConfigService = yield* TurboConfigService;

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
       * Write turbo.json configuration.
       */
      const writeTurboConfig = Effect.fn('TurborepoSetupService.writeTurboConfig')(function* (config: TurboConfig) {
        yield* turboConfigService.write(config);

        yield* Effect.logInfo('✅ Updated turbo.json');
      });

      /**
       * Merge detected tasks into turbo.json.
       */
      const mergeTurboConfig = Effect.fn('TurborepoSetupService.mergeTurboConfig')(function* (
        detectedTasks: Set<string>,
      ) {
        const turboConfigOption = yield* turboConfigService.read();

        yield* Opt.match(turboConfigOption, {
          onNone: Effect.fn('TurborepoSetupService.createTurboConfig')(function* () {
            yield* writeTurboConfig(mergeTasks({}, detectedTasks));

            yield* Effect.logInfo(`✨ Created turbo.json with ${detectedTasks.size} task(s)`);
          }),
          onSome: Effect.fn('TurborepoSetupService.mergeExistingTurboConfig')(function* (existingConfig) {
            yield* writeTurboConfig(mergeTasks(existingConfig, detectedTasks));

            yield* Effect.logInfo(`📦 Merged ${detectedTasks.size} detected task(s) into turbo.json`);
          }),
        });
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
          const existingScript = scripts[taskName] ?? '';

          // Only update if not already using turbo
          if (existingScript.includes('turbo')) {
            continue;
          }

          scripts[taskName] = `turbo run ${taskName}`;

          updated = true;

          yield* Effect.logInfo(
            Str.isEmpty(existingScript) ? `✅ Added script: ${taskName}` : `✅ Updated script: ${taskName}`,
          );
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

        if (hasDependency(packageJson, 'turbo')) {
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
        readTurboConfig: turboConfigService.read,
        writeTurboConfig,
        mergeTurboConfig,
        updateRootScripts,
        ensureTurboInstalled,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(PackageManagerService.layer, ProjectDetectionService.layer, TurboConfigService.layer)),
  );
}
