import path from 'node:path';
import fs from 'node:fs/promises';

import { Path } from '@effect/platform';
import fg from 'tinyglobby';
import { Array, Data, Effect, Option, String } from 'effect';

import { PackageManagerService } from './PackageManagerService';

class WorkspaceError extends Data.TaggedError('WorkspaceError')<{
  cause: unknown;
  message?: string;
}> {}

export class WorkspaceService extends Effect.Service<WorkspaceService>()('WorkspaceService', {
  effect: Effect.gen(function* () {
    const pm = yield* PackageManagerService;
    const effPath = yield* Path.Path;

    const readFileIfExists = (filePath: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            return await fs.readFile(filePath, 'utf8');
          } catch (error) {
            return undefined;
          }
        },
        catch: (cause) => new WorkspaceError({ cause }),
      });

    const getWorkspaceGlobs = Effect.fn('WorkspaceService.getWorkspaceGlobs')(function* () {
      const root = yield* pm.resolveRoot();

      const pkg = yield* pm.readPackageJson({ id: root });

      let globs: Array<string> = [];

      // yarn/npm style workspaces in package.json
      if (Array.isArray((pkg as any).workspaces)) {
        globs = (pkg as any).workspaces as Array<string>;
      } else if (typeof (pkg as any).workspaces === 'object' && Array.isArray((pkg as any).workspaces?.packages)) {
        globs = (pkg as any).workspaces.packages as Array<string>;
      }

      // pnpm style workspaces in pnpm-workspace.yaml
      if (Array.isEmptyArray(globs)) {
        const yamlContent = yield* readFileIfExists(path.resolve(root, 'pnpm-workspace.yaml'));

        if (yamlContent) {
          const lines = yamlContent.split('\n');
          const collected: Array<string> = [];
          let inPackages = false;
          for (const raw of lines) {
            const line = raw.trimEnd();
            if (line.startsWith('packages:')) {
              inPackages = true;
              continue;
            }
            if (inPackages) {
              const trimmed = line.trim();
              if (trimmed.startsWith('- ')) {
                const glob = trimmed.slice(2).trim();
                if (glob && !glob.startsWith('#')) collected.push(glob);
              } else if (!trimmed || trimmed.startsWith('#')) {
                // continue
              } else if (!line.startsWith(' ')) {
                // left the packages block
                inPackages = false;
              }
            }
          }
          if (Array.isNonEmptyArray(collected)) globs = collected;
        }
      }

      if (Array.isEmptyArray(globs)) {
        // fallbacks commonly used in monorepos
        globs = ['packages/*', 'apps/*'];
      }

      return { root, globs } as const;
    });

    const listPackageDirs = Effect.fn('WorkspaceService.listPackageDirs')(function* () {
      const { root, globs } = yield* getWorkspaceGlobs();

      const patterns = globs.map((g) => path.join(g, 'package.json'));

      const files = yield* Effect.tryPromise({
        try: () => fg(patterns, { cwd: root, onlyFiles: true, dot: true }),
        catch: (cause) => new WorkspaceError({ cause }),
      });

      const dirs = files
        .map((f) => path.resolve(root, path.dirname(f)))
        .filter((p) => p !== root);

      return Array.dedupeWith(dirs, (a, b) => String.Eq.equals(a, b));
    });

    return {
      getWorkspaceGlobs,
      listPackageDirs,
    };
  }),
  dependencies: [PackageManagerService.Default, Path.layer],
}) {}

