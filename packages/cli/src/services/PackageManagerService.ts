import * as Array from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import * as ChildProcess from 'effect/unstable/process/ChildProcess';
import * as nypm from 'nypm';
import * as pkgTypes from 'pkg-types';

import { CurrentWorkingDirService } from './CurrentWorkingDirService';

class PackageManagerError extends Schema.TaggedError<PackageManagerError>()(
  '@2digits/cli/services/PackageManagerService/PackageManagerError',
  {
    operation: Schema.String,
    cause: Schema.Unknown,
    message: Schema.optional(Schema.String),
  },
) {}

type BasePackageJson = pkgTypes.PackageJson;

export interface PackageJson extends BasePackageJson {
  prettier?: unknown;
}

export class PackageManagerService extends Context.Service<PackageManagerService>()(
  '@2digits/cli/services/PackageManagerService',
  {
    make: Effect.gen(function* () {
      const path = yield* Path.Path;
      const cwdService = yield* CurrentWorkingDirService;

      const runAddCommand = Effect.fn('PackageManagerService.runAddCommand')(
        function* (
          command: ChildProcess.Command,
          dependencyType: 'dependencies' | 'devDependencies',
          dependencies: ReadonlyArray<string>,
        ) {
          const childProcess = yield* command;
          const { exitCode, stderr } = yield* Effect.all({
            stdout: childProcess.stdout.pipe(
              Stream.decodeText(),
              Stream.tap((output) => Effect.logDebug(output)),
              Stream.mkString,
            ),
            stderr: childProcess.stderr.pipe(
              Stream.decodeText(),
              Stream.tap((output) => Effect.logDebug(output)),
              Stream.mkString,
            ),
            exitCode: childProcess.exitCode,
          });

          if (exitCode !== 0) {
            yield* Effect.logError(`Command failed with exit code ${exitCode}: ${command.toString()}`);

            return yield* PackageManagerError.make({
              operation: 'addDependencies',
              message: `Failed to add ${dependencyType}: ${stderr}`,
              cause: exitCode,
            });
          }

          yield* Effect.logDebug(`Added ${dependencyType}: ${Array.join(dependencies, ', ')}`);
        },
        Effect.scoped,
        (effect, _command, dependencyType) =>
          effect.pipe(
            Effect.mapError((cause) =>
              Match.value(cause).pipe(
                Match.when(Schema.is(PackageManagerError), (error) => error),
                Match.orElse((cause) =>
                  PackageManagerError.make({
                    operation: 'addDependencies',
                    message: `Failed to run package manager command for ${dependencyType}`,
                    cause,
                  }),
                ),
              ),
            ),
          ),
      );

      const resolveRoot = Effect.fn('PackageManagerService.resolveRoot')(function* () {
        const cwd = yield* cwdService.cwd;

        return yield* Effect.tryPromise({
          try: () => pkgTypes.findWorkspaceDir(cwd),
          catch: (cause) => PackageManagerError.make({ operation: 'resolveRoot', cause }),
        }).pipe(Effect.map(path.normalize));
      });

      const readPackageJson = Effect.fn('PackageManagerService.readPackageJson')(function* (options?: {
        /**
         * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from
         * the current working directory.
         *
         * @default `process.cwd()`
         */
        id?: string;
      }) {
        const cwd = yield* cwdService.cwd;
        const pkgPath = path.resolve(options?.id ?? cwd, 'package.json');

        const packageJson: PackageJson = yield* Effect.tryPromise({
          try: () => pkgTypes.readPackageJSON(pkgPath),
          catch: (cause) => PackageManagerError.make({ operation: 'readPackageJson', cause }),
        });

        return packageJson;
      });

      const writePackageJson = Effect.fn('PackageManagerService.writePackageJson')(function* (options: {
        /**
         * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from
         * the current working directory.
         *
         * @default `process.cwd()`
         */
        id?: string;

        /**
         * The content of the `package.json` file to write.
         */
        content: pkgTypes.PackageJson;
      }) {
        const cwd = yield* cwdService.cwd;
        const pkgPath = path.resolve(options.id ?? cwd, 'package.json');

        return yield* Effect.tryPromise({
          try: () => pkgTypes.writePackageJSON(pkgPath, options.content),
          catch: (cause) => PackageManagerError.make({ operation: 'writePackageJson', cause }),
        });
      });

      interface AddDependenciesOptions {
        /**
         * The workspace to which the dependency should be added. If not provided, the dependency will be added to the
         * root workspace.
         */
        workspace?: string;
        dependencies?: Array<string>;
        devDependencies?: Array<string>;
      }

      const addDependencies = Effect.fn('PackageManagerService.addDependencies')(function* (
        options: AddDependenciesOptions,
      ) {
        const pm = yield* getPackageManager();

        const workspace = options.workspace ?? true;
        const devDependencies = options.devDependencies ?? [];
        const dependencies = options.dependencies ?? [];

        if (Array.isReadonlyArrayNonEmpty(devDependencies)) {
          const devDepsCmd = ChildProcess.make(
            nypm.addDependencyCommand(pm.name, devDependencies, { workspace, dev: true, short: true }),
            { shell: true },
          );

          yield* runAddCommand(devDepsCmd, 'devDependencies', devDependencies);
        }

        if (Array.isReadonlyArrayNonEmpty(dependencies)) {
          const depsCmd = ChildProcess.make(
            nypm.addDependencyCommand(pm.name, dependencies, { workspace, short: true }),
            { shell: true },
          );

          yield* runAddCommand(depsCmd, 'dependencies', dependencies);
        }
      });

      const getPackageManager = Effect.fn('PackageManagerService.getPackageManager')(function* () {
        const root = yield* resolveRoot();

        const pm = yield* Effect.tryPromise({
          try: () => nypm.detectPackageManager(root),
          catch: (cause) => PackageManagerError.make({ operation: 'getPackageManager', cause }),
        });

        if (pm === undefined) {
          return yield* PackageManagerError.make({
            operation: 'getPackageManager',
            cause: 'Could not detect package manager',
          });
        }

        return pm;
      });

      const runScriptCommand = Effect.fn('PackageManagerService.runScriptCommand')(function* (options: {
        script: string;
        args?: Array<string>;
      }) {
        const pm = yield* getPackageManager();

        return nypm.runScriptCommand(pm.name, options.script, { args: options.args });
      });

      return {
        resolveRoot,
        readPackageJson,
        writePackageJson,
        addDependencies,
        getPackageManager,
        runScriptCommand,
      };
    }),
  },
) {
  static readonly Default = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(Path.layer, CurrentWorkingDirService.Default)),
  );
}
