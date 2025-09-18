import fs from 'node:fs/promises';
import path from 'node:path';

import { Effect } from 'effect';

import { PackageManagerService } from './PackageManagerService';

export class TurboSetupService extends Effect.Service<TurboSetupService>()('TurboSetupService', {
  effect: Effect.gen(function* () {
    const pm = yield* PackageManagerService;

    const ensureRootScripts = Effect.fn('TurboSetupService.ensureRootScripts')(function* () {
      const root = yield* pm.resolveRoot();
      const rootPkg = yield* pm.readPackageJson({ id: root });
      rootPkg.scripts = rootPkg.scripts ?? {};
      rootPkg.scripts.types = rootPkg.scripts.types ?? 'turbo types';
      rootPkg.scripts.lint = rootPkg.scripts.lint ?? 'turbo run lint';
      rootPkg.scripts['lint:fix'] = rootPkg.scripts['lint:fix'] ?? 'turbo run lint -- --fix';
      yield* pm.writePackageJson({ id: root, content: rootPkg });
    });

    const ensureTurboJson = Effect.fn('TurboSetupService.ensureTurboJson')(function* () {
      const root = yield* pm.resolveRoot();
      const turboPath = path.resolve(root, 'turbo.json');
      const content = JSON.stringify(
        {
          tasks: {
            build: { dependsOn: ['^build'], outputs: ['dist/**'] },
            types: { dependsOn: ['^types', 'build', '^build'], outputs: ['tsconfig.tsbuildinfo'] },
            lint: {},
          },
        },
        null,
        2,
      ) + '\n';
      yield* Effect.tryPromise({
        try: () => fs.writeFile(turboPath, content, 'utf8'),
        catch: (cause) => cause,
      });
    });

    const installDeps = Effect.fn('TurboSetupService.installDeps')(function* () {
      yield* pm.addDependencies({ devDependencies: ['turbo'] });
    });

    const setup = Effect.fn('TurboSetupService.setup')(function* () {
      yield* Effect.logInfo('📦 Setting up Turborepo in root...');
      yield* ensureTurboJson();
      yield* ensureRootScripts();
      yield* installDeps();
      yield* Effect.logInfo('✅ Turborepo setup complete');
    });

    return { setup };
  }),
  dependencies: [PackageManagerService.Default],
}) {}

