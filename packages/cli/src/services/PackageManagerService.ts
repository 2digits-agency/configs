import * as Array from 'effect/Array';
import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import type { PlatformError } from 'effect/PlatformError';
import * as Stream from 'effect/Stream';
import * as String from 'effect/String';
import * as ChildProcess from 'effect/unstable/process/ChildProcess';
import type { ChildProcessSpawner } from 'effect/unstable/process/ChildProcessSpawner';
import * as nypm from 'nypm';
import * as pkgTypes from 'pkg-types';

import { CurrentWorkingDirService } from './CurrentWorkingDirService';

/**
 * Failure while reading, writing, or installing package metadata.
 */
export class PackageManagerError extends Data.TaggedError(
  '@2digits/cli/services/PackageManagerService/PackageManagerError',
)<{
  readonly cause: unknown;
  readonly message?: string;
}> {}

/**
 * Options for installing project dependencies.
 */
interface AddDependenciesOptions {
  /**
   * Workspace receiving the dependencies, or the repository root when omitted.
   */
  readonly workspace?: string;
  /**
   * Runtime dependencies to install.
   */
  readonly dependencies?: Array<string>;
  /**
   * Development dependencies to install.
   */
  readonly devDependencies?: Array<string>;
}

/**
 * Operations exposed by the package manager service.
 */
export interface PackageManagerServiceShape {
  readonly resolveRoot: Effect.Effect<string, PackageManagerError>;
  readonly readPackageJson: (options?: {
    readonly id?: string;
  }) => Effect.Effect<pkgTypes.PackageJson, PackageManagerError>;
  readonly writePackageJson: (options: {
    readonly id?: string;
    readonly content: pkgTypes.PackageJson;
  }) => Effect.Effect<void, PackageManagerError>;
  readonly addDependencies: (
    options: AddDependenciesOptions,
  ) => Effect.Effect<void, PackageManagerError | PlatformError, ChildProcessSpawner>;
  readonly getPackageManager: Effect.Effect<
    nypm.PackageManager & { readonly warnings?: Array<string> },
    PackageManagerError
  >;
  readonly runScriptCommand: (options: {
    readonly script: string;
    readonly args?: Array<string>;
  }) => Effect.Effect<string, PackageManagerError>;
}

const make = Effect.gen(function* () {
  const path = yield* Path.Path;
  const cwdService = yield* CurrentWorkingDirService;

  const resolveRoot = Effect.gen(function* () {
    const cwd = yield* cwdService.cwd;

    return yield* Effect.tryPromise({
      try: () => pkgTypes.findWorkspaceDir(cwd),
      catch: (cause) => new PackageManagerError({ cause }),
    }).pipe(Effect.map(path.normalize));
  }).pipe(Effect.withSpan('PackageManagerService.resolveRoot'));

  const readPackageJson = Effect.fn('PackageManagerService.readPackageJson')(function* (options?: {
    /**
     * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from the
     * current working directory.
     *
     * @default `process.cwd()`
     */
    id?: string;
  }) {
    const cwd = yield* cwdService.cwd;
    const pkgPath = path.resolve(options?.id ?? cwd, 'package.json');

    return yield* Effect.tryPromise({
      try: () => pkgTypes.readPackageJSON(pkgPath),
      catch: (cause) => new PackageManagerError({ cause }),
    });
  });

  const writePackageJson = Effect.fn('PackageManagerService.writePackageJson')(function* (options: {
    /**
     * The root from which to resolve the package.json file. If not provided, it will be resolved automatically from the
     * current working directory.
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

  const addDependencies = Effect.fn('PackageManagerService.addDependencies')(function* (
    options: AddDependenciesOptions,
  ) {
    const pm = yield* getPackageManager;

    const workspace = options.workspace ?? true;

    if (options.devDependencies && Array.isArrayNonEmpty(options.devDependencies)) {
      const devDepsCommand = nypm.addDependencyCommand(pm.name, options.devDependencies, {
        workspace,
        dev: true,
        short: true,
      });
      const devDepsCmd = ChildProcess.make(devDepsCommand, { shell: true });

      const { exitCode, stderr } = yield* devDepsCmd.pipe(
        Effect.flatMap((process) =>
          Effect.all({
            stdout: process.stdout.pipe(
              Stream.decodeText(),
              Stream.tap((message) => Effect.logDebug(() => message)),
              Stream.runFold(() => String.empty, String.concat),
            ),
            stderr: process.stderr.pipe(
              Stream.decodeText(),
              Stream.tap((message) => Effect.logDebug(() => message)),
              Stream.runFold(() => String.empty, String.concat),
            ),
            exitCode: process.exitCode,
          }),
        ),
      );

      if (exitCode !== 0) {
        yield* Effect.logError(`Command failed with exit code ${exitCode}: ${devDepsCommand}`);

        return yield* new PackageManagerError({
          message: `Failed to add devDependencies: ${stderr}`,
          cause: exitCode,
        });
      }

      yield* Effect.logDebug(`Added devDependencies: ${options.devDependencies.join(', ')}`);
    }

    if (options.dependencies && Array.isArrayNonEmpty(options.dependencies)) {
      const dependenciesCommand = nypm.addDependencyCommand(pm.name, options.dependencies, {
        workspace,
        short: true,
      });
      const depsCmd = ChildProcess.make(dependenciesCommand, { shell: true });

      const { exitCode, stderr } = yield* depsCmd.pipe(
        Effect.flatMap((process) =>
          Effect.all({
            stdout: process.stdout.pipe(
              Stream.decodeText(),
              Stream.tap((message) => Effect.logDebug(() => message)),
              Stream.runFold(() => String.empty, String.concat),
            ),
            stderr: process.stderr.pipe(
              Stream.decodeText(),
              Stream.tap((message) => Effect.logDebug(() => message)),
              Stream.runFold(() => String.empty, String.concat),
            ),
            exitCode: process.exitCode,
          }),
        ),
      );

      if (exitCode !== 0) {
        yield* Effect.logError(`Command failed with exit code ${exitCode}: ${dependenciesCommand}`);

        return yield* new PackageManagerError({
          message: `Failed to add dependencies: ${stderr}`,
          cause: exitCode,
        });
      }

      yield* Effect.logDebug(`Added dependencies: ${options.dependencies.join(', ')}`);
    }
  }, Effect.scoped);

  const getPackageManager = Effect.gen(function* () {
    const root = yield* resolveRoot;

    const pm = yield* Effect.tryPromise({
      try: () => nypm.detectPackageManager(root),
      catch: (cause) => new PackageManagerError({ cause }),
    });

    if (!pm) {
      return yield* new PackageManagerError({ cause: 'Could not detect package manager' });
    }

    return pm;
  }).pipe(Effect.withSpan('PackageManagerService.getPackageManager'));

  const runScriptCommand = Effect.fn('PackageManagerService.runScriptCommand')(function* (options: {
    script: string;
    args?: Array<string>;
  }) {
    const pm = yield* getPackageManager;

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
});

export class PackageManagerService extends Context.Service<PackageManagerService, PackageManagerServiceShape>()(
  '@2digits/cli/services/PackageManagerService',
) {
  static readonly layer = Layer.effect(PackageManagerService, make).pipe(
    Layer.provide(Path.layer),
    Layer.provide(CurrentWorkingDirService.layer),
  );
}
