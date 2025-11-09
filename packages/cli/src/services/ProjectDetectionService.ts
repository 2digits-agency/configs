import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as Effect from 'effect/Effect';

import { PackageManagerService } from './PackageManagerService';

export class ProjectDetectionService extends Effect.Service<ProjectDetectionService>()('ProjectDetectionService', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const pm = yield* PackageManagerService;

    /**
     * Check if the project is a monorepo with Turborepo
     */
    const isMonorepo = Effect.fn('ProjectDetectionService.isMonorepo')(function* () {
      const root = yield* pm.resolveRoot();
      const turboPath = path.join(root, 'turbo.json');

      return yield* fs.exists(turboPath);
    });

    /**
     * Check if the project uses Turborepo (alias for isMonorepo)
     */
    const isTurborepoProject = isMonorepo;

    /**
     * Discover workspace directories in apps/ and packages/
     */
    const discoverWorkspaces = Effect.fn('ProjectDetectionService.discoverWorkspaces')(function* () {
      const root = yield* pm.resolveRoot();
      const appsPath = path.join(root, 'apps');
      const packagesPath = path.join(root, 'packages');

      const [appsExists, packagesExists] = yield* Effect.all([fs.exists(appsPath), fs.exists(packagesPath)]);

      const workspaceDirs: Array<string> = [];

      if (appsExists) {
        const appsEntries = yield* fs.readDirectory(appsPath).pipe(Effect.orElseSucceed(() => []));

        for (const entry of appsEntries) {
          const entryPath = path.join(appsPath, entry);
          const packageJsonPath = path.join(entryPath, 'package.json');

          const stat = yield* fs.stat(entryPath).pipe(Effect.orElseSucceed(() => undefined));
          const isDirectory = stat?.type === 'Directory';
          const hasPackageJson = yield* fs.exists(packageJsonPath).pipe(Effect.orElseSucceed(() => false));

          if (isDirectory && hasPackageJson) {
            workspaceDirs.push(entryPath);
          }
        }
      }

      if (packagesExists) {
        const packagesEntries = yield* fs.readDirectory(packagesPath).pipe(Effect.orElseSucceed(() => []));

        for (const entry of packagesEntries) {
          const entryPath = path.join(packagesPath, entry);
          const packageJsonPath = path.join(entryPath, 'package.json');

          const stat = yield* fs.stat(entryPath).pipe(Effect.orElseSucceed(() => undefined));
          const isDirectory = stat?.type === 'Directory';
          const hasPackageJson = yield* fs.exists(packageJsonPath).pipe(Effect.orElseSucceed(() => false));

          if (isDirectory && hasPackageJson) {
            workspaceDirs.push(entryPath);
          }
        }
      }

      return workspaceDirs;
    });

    /**
     * Get the package.json path for a workspace
     */
    const getWorkspacePackageJsonPath = (workspacePath: string) => path.join(workspacePath, 'package.json');

    return {
      isMonorepo,
      isTurborepoProject,
      discoverWorkspaces,
      getWorkspacePackageJsonPath,
    };
  }),
  dependencies: [NodeFileSystem.layer, NodePath.layer, PackageManagerService.Default],
}) {}
