import { Path } from '@effect/platform';
import { Data, Effect } from 'effect';
import * as nypm from 'nypm';
import * as pkgTypes from 'pkg-types';

class PackageManagerError extends Data.TaggedError('PackageManagerError')<{
  cause: unknown;
}> {}

export class PackageManagerService extends Effect.Service<PackageManagerService>()('PackageManagerService', {
  effect: Effect.gen(function* () {
    const path = yield* Path.Path;

    const resolveRoot = Effect.fn('PackageManagerService.resolveRoot')(function* () {
      return yield* Effect.tryPromise({
        try: () => pkgTypes.findWorkspaceDir(),
        catch: (cause) => new PackageManagerError({ cause }),
      }).pipe(Effect.map((dir) => path.normalize(dir)));
    });

    const readPackageJson = Effect.fn('PackageManagerService.readPackageJson')(function* (
      options: {
        /**
         * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from the current working directory.
         *
         * @default `process.cwd()`
         */
        id?: string;
      } = {},
    ) {
      return yield* Effect.tryPromise({
        try: () => pkgTypes.readPackageJSON(`${options.id ?? process.cwd()}/package.json`),
        catch: (cause) => new PackageManagerError({ cause }),
      });
    });

    const writePackageJson = Effect.fn('PackageManagerService.writePackageJson')(function* (options: {
      /**
       * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from the current working directory.
       *
       * @default `process.cwd()`
       */
      id?: string;

      /**
       * The content of the `package.json` file to write.
       */
      content: pkgTypes.PackageJson;
    }) {
      return yield* Effect.tryPromise({
        try: () => pkgTypes.writePackageJSON(`${options.id ?? process.cwd()}/package.json`, options.content),
        catch: (cause) => new PackageManagerError({ cause }),
      });
    });

    const addDependencies = Effect.fn('PackageManagerService.addDependencies')(function* (options: {
      /**
       * The workspace to which the dependency should be added. If not provided, the dependency will be added to the root workspace.
       */
      workspace?: string;
      dependencies?: Array<string>;
      devDependencies?: Array<string>;
    }) {
      if (options.devDependencies) {
        const devDeps = yield* Effect.tryPromise({
          try: () => nypm.addDependency(options.devDependencies ?? [], { workspace: options.workspace, dev: true }),
          catch: (cause) => new PackageManagerError({ cause }),
        });

        yield* Effect.logDebug(`Added devDependencies: ${options.devDependencies.join(', ')}`, devDeps);
      }

      if (options.dependencies) {
        const deps = yield* Effect.tryPromise({
          try: () => nypm.addDependency(options.dependencies ?? [], { workspace: options.workspace }),
          catch: (cause) => new PackageManagerError({ cause }),
        });

        yield* Effect.logDebug(`Added dependencies: ${options.dependencies.join(', ')}`, deps);
      }
    });

    const getPackageManager = Effect.fn('PackageManagerService.getPackageManager')(function* () {
      const root = yield* resolveRoot();

      const pm = yield* Effect.tryPromise({
        try: () => nypm.detectPackageManager(root),
        catch: (cause) => new PackageManagerError({ cause }),
      });

      if (!pm) {
        return yield* new PackageManagerError({ cause: 'Could not detect package manager' });
      }

      return pm as nypm.PackageManager;
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
  dependencies: [Path.layer],
}) {}
