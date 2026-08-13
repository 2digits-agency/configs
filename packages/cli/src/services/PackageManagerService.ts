import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as Stream from 'effect/Stream';
import * as String from 'effect/String';
import * as ChildProcess from 'effect/unstable/process/ChildProcess';
import * as nypm from 'nypm';
import * as pkgTypes from 'pkg-types';

import { CurrentWorkingDirService } from './CurrentWorkingDirService';

class PackageManagerError extends Data.TaggedError('@2digits/cli/services/PackageManagerService/PackageManagerError')<{
  cause: unknown;
  message?: string;
}> {}

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

      const resolveRoot = Effect.fn('PackageManagerService.resolveRoot')(function* () {
        const cwd = yield* cwdService.cwd;

        return yield* Effect.tryPromise({
          try: () => pkgTypes.findWorkspaceDir(cwd),
          catch: (cause) => new PackageManagerError({ cause }),
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
          catch: (cause) => new PackageManagerError({ cause }),
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
          catch: (cause) => new PackageManagerError({ cause }),
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

        if (options.devDependencies !== undefined && options.devDependencies.length > 0) {
          const devDepsCmd = ChildProcess.make(
            nypm.addDependencyCommand(pm.name, options.devDependencies, { workspace, dev: true, short: true }),
            { shell: true },
          );

          const { exitCode, stderr } = yield* devDepsCmd.pipe(
            Effect.flatMap((childProcess) =>
              Effect.all({
                stdout: childProcess.stdout.pipe(
                  Stream.decodeText(),
                  Stream.tap((output) => Effect.logDebug(output)),
                  Stream.runFold(() => String.empty, String.concat),
                ),
                stderr: childProcess.stderr.pipe(
                  Stream.decodeText(),
                  Stream.tap((output) => Effect.logDebug(output)),
                  Stream.runFold(() => String.empty, String.concat),
                ),
                exitCode: childProcess.exitCode,
              }),
            ),
          );

          if (exitCode !== 0) {
            yield* Effect.logError(`Command failed with exit code ${exitCode}: ${devDepsCmd.toString()}`);

            return yield* new PackageManagerError({
              message: `Failed to add devDependencies: ${stderr}`,
              cause: exitCode,
            });
          }

          yield* Effect.logDebug(`Added devDependencies: ${options.devDependencies.join(', ')}`);
        }

        if (options.dependencies !== undefined && options.dependencies.length > 0) {
          const depsCmd = ChildProcess.make(
            nypm.addDependencyCommand(pm.name, options.dependencies, { workspace, short: true }),
            { shell: true },
          );

          const { exitCode, stderr } = yield* depsCmd.pipe(
            Effect.flatMap((childProcess) =>
              Effect.all({
                stdout: childProcess.stdout.pipe(
                  Stream.decodeText(),
                  Stream.tap((output) => Effect.logDebug(output)),
                  Stream.runFold(() => String.empty, String.concat),
                ),
                stderr: childProcess.stderr.pipe(
                  Stream.decodeText(),
                  Stream.tap((output) => Effect.logDebug(output)),
                  Stream.runFold(() => String.empty, String.concat),
                ),
                exitCode: childProcess.exitCode,
              }),
            ),
          );

          if (exitCode !== 0) {
            yield* Effect.logError(`Command failed with exit code ${exitCode}: ${depsCmd.toString()}`);

            return yield* new PackageManagerError({
              message: `Failed to add dependencies: ${stderr}`,
              cause: exitCode,
            });
          }

          yield* Effect.logDebug(`Added dependencies: ${options.dependencies.join(', ')}`);
        }
      }, Effect.scoped);

      const getPackageManager = Effect.fn('PackageManagerService.getPackageManager')(function* () {
        const root = yield* resolveRoot();

        const pm = yield* Effect.tryPromise({
          try: () => nypm.detectPackageManager(root),
          catch: (cause) => new PackageManagerError({ cause }),
        });

        if (pm === undefined) {
          return yield* new PackageManagerError({ cause: 'Could not detect package manager' });
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
