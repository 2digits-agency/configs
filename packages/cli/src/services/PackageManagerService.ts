/* eslint-disable unicorn/no-array-callback-reference */
import { Command, FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Array, Data, Effect, Stream, String } from 'effect';
import * as nypm from 'nypm';
import * as pkgTypes from 'pkg-types';

class PackageManagerError extends Data.TaggedError('PackageManagerError')<{
  cause: unknown;
  message?: string;
}> {}

export class PackageManagerService extends Effect.Service<PackageManagerService>()('PackageManagerService', {
  accessors: true,
  effect: Effect.gen(function*() {
    const path = yield* Path.Path

    const resolveRoot = Effect.fn('PackageManagerService.resolveRoot')(function*() {
      return yield* Effect.tryPromise({
        try: () => pkgTypes.findWorkspaceDir(),
        catch: (cause) => new PackageManagerError({ cause }),
      }).pipe(Effect.map(path.normalize))
    })

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
      const pkgPath = path.resolve(options.id ?? process.cwd(), 'package.json');

      return yield* Effect.tryPromise({
        try: () => pkgTypes.readPackageJSON(pkgPath),
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
      const pkgPath = path.resolve(options.id ?? process.cwd(), 'package.json');

      return yield* Effect.tryPromise({
        try: () => pkgTypes.writePackageJSON(pkgPath, options.content),
        catch: (cause) => new PackageManagerError({ cause }),
      });
    });

    interface AddDependenciesOptions {
      /**
       * The workspace to which the dependency should be added. If not provided, the dependency will be added to the root workspace.
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

      if (options.devDependencies && Array.isNonEmptyArray(options.devDependencies)) {
        const devDepsCmd = Command.make(
          nypm.addDependencyCommand(pm.name, options.devDependencies, { workspace, dev: true, short: true }),
        ).pipe(Command.runInShell(true));

        const { exitCode, stderr } = yield* Command.start(devDepsCmd).pipe(
          Effect.flatMap((process) =>
            Effect.all({
              stdout: process.stdout.pipe(
                Stream.decodeText(),
                Stream.tap(Effect.logDebug),
                Stream.runFold(String.empty, String.concat),
              ),
              stderr: process.stderr.pipe(
                Stream.decodeText(),
                Stream.tap(Effect.logDebug),
                Stream.runFold(String.empty, String.concat),
              ),
              exitCode: process.exitCode,
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

      if (options.dependencies && Array.isNonEmptyArray(options.dependencies)) {
        const depsCmd = Command.make(
          nypm.addDependencyCommand(pm.name, options.dependencies, { workspace, short: true }),
        ).pipe(Command.runInShell(true));

        const { exitCode, stderr } = yield* Command.start(depsCmd).pipe(
          Effect.flatMap((process) =>
            Effect.all({
              stdout: process.stdout.pipe(
                Stream.decodeText(),
                Stream.tap(Effect.logDebug),
                Stream.runFold(String.empty, String.concat),
              ),
              stderr: process.stderr.pipe(
                Stream.decodeText(),
                Stream.tap(Effect.logDebug),
                Stream.runFold(String.empty, String.concat),
              ),
              exitCode: process.exitCode,
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

    /**
     * Reads and parses a gitignore-style file, returning the patterns
     */
    const readIgnoreFile = (filePath: string) =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        const exists = yield* fs.exists(filePath)
        if (!exists) {
          return []
        }

        const content = yield* fs.readFileString(filePath)

        // Parse patterns (remove comments and empty lines)
        const patterns = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))

        return patterns
      })

    /**
     * Finds the git repository root by walking up the directory tree
     */
    const findGitRoot = (startDir: string) =>
      Effect.gen(function*() {
        const fs = yield* FileSystem.FileSystem
        let currentDir = path.resolve(startDir)

        while (true) {
          const gitPath = path.join(currentDir, ".git")
          const exists = yield* fs.exists(gitPath)

          if (exists) {
            return currentDir
          }

          const parentDir = path.dirname(currentDir)

          // If we've reached the filesystem root, stop
          if (parentDir === currentDir) {
            return null
          }

          currentDir = parentDir
        }
      })

    /**
     * Loads ignore patterns from both current directory and git root
     */
    const loadAllIgnorePatterns = (directory: string) =>
      Effect.gen(function*() {
        const allPatterns: Array<string> = []

        // Load patterns from current directory
        const currentDirPatterns = yield* readIgnoreFile(path.join(directory, ".gitignore"))
        for (const pattern of currentDirPatterns) {
          allPatterns.push(pattern)
        }

        // Find and load patterns from git root (if different from current dir)
        const gitRoot = yield* findGitRoot(directory)
        if (gitRoot && gitRoot !== directory) {
          const gitRootPatterns = yield* readIgnoreFile(path.join(gitRoot, ".gitignore"))
          for (const pattern of gitRootPatterns) {
            allPatterns.push(pattern)
          }
        }

        return allPatterns
      })

    return {
      resolveRoot,
      readPackageJson,
      writePackageJson,
      addDependencies,
      getPackageManager,
      runScriptCommand,
      readIgnoreFile,
      findGitRoot,
      loadAllIgnorePatterns,
    };
  }),
  dependencies: [NodePath.layer, NodeFileSystem.layer],
}) {}
