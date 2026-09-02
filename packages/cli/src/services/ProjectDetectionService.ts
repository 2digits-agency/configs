import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';

import { PackageManagerService } from './PackageManagerService';

export class ProjectDetectionService extends Context.Service<ProjectDetectionService>()(
  '@2digits/cli/services/ProjectDetectionService',
  {
    make: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const pm = yield* PackageManagerService;

      const discoverWorkspaceDirectory = Effect.fn('ProjectDetectionService.discoverWorkspaceDirectory')(function* (
        directoryPath: string,
      ) {
        const exists = yield* fs.exists(directoryPath);

        if (!exists) {
          return [];
        }

        const entries = yield* fs.readDirectory(directoryPath).pipe(Effect.orElseSucceed(() => []));
        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        const workspaces = yield* Effect.forEach(
          entries,
          Effect.fn('ProjectDetectionService.inspectWorkspace')(function* (entry) {
            const entryPath = path.join(directoryPath, entry);
            const packageJsonPath = path.join(entryPath, 'package.json');
            const [stat, hasPackageJson] = yield* Effect.all([
              fs.stat(entryPath).pipe(Effect.orElseSucceed(() => undefined)),
              fs.exists(packageJsonPath).pipe(Effect.orElseSucceed(() => false)),
            ]);

            return hasPackageJson && stat?.type === 'Directory' ? Opt.some(entryPath) : Opt.none();
          }),
          { concurrency: 'unbounded' },
        );

        return Arr.getSomes(workspaces);
      });

      /**
       * Check if the project is a monorepo with Turborepo.
       */
      const isMonorepo = Effect.fn('ProjectDetectionService.isMonorepo')(function* () {
        const root = yield* pm.resolveRoot();
        const turboPath = path.join(root, 'turbo.json');

        return yield* fs.exists(turboPath);
      });

      /**
       * Check if the project uses Turborepo.
       */
      const isTurborepoProject = Effect.fn('ProjectDetectionService.isTurborepoProject')(function* () {
        return yield* isMonorepo();
      });

      /**
       * Discover workspace directories in apps/ and packages/
       */
      const discoverWorkspaces = Effect.fn('ProjectDetectionService.discoverWorkspaces')(function* () {
        const root = yield* pm.resolveRoot();
        const workspaceDirectories = yield* Effect.all(
          Arr.map([path.join(root, 'apps'), path.join(root, 'packages')], discoverWorkspaceDirectory),
          { concurrency: 'unbounded' },
        );

        return Arr.flatten(workspaceDirectories);
      });

      /**
       * Get the package.json path for a workspace.
       *
       * @param workspacePath - The path to the workspace directory.
       */
      function getWorkspacePackageJsonPath(workspacePath: string) {
        return path.join(workspacePath, 'package.json');
      }

      return {
        isMonorepo,
        isTurborepoProject,
        discoverWorkspaces,
        getWorkspacePackageJsonPath,
      };
    }),
  },
) {
  static readonly Default = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, PackageManagerService.Default)),
  );
}
