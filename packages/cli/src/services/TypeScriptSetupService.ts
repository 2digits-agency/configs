import path from 'node:path';
import fs from 'node:fs/promises';

import { Effect, Option } from 'effect';

import { PackageManagerService } from './PackageManagerService';
import { WorkspaceService } from './WorkspaceService';

export class TypeScriptSetupService extends Effect.Service<TypeScriptSetupService>()('TypeScriptSetupService', {
  effect: Effect.gen(function* () {
    const pm = yield* PackageManagerService;
    const ws = yield* WorkspaceService;

    const ensureTsconfigForPackage = Effect.fn('TypeScriptSetupService.ensureTsconfigForPackage')(function* (
      packageDir: string,
    ) {
      const tsconfigPath = path.resolve(packageDir, 'tsconfig.json');
      const template = {
        extends: '@2digits/tsconfig/tsconfig.json',
        compilerOptions: {
          plugins: [{ name: '@effect/language-service' }],
        },
        include: ['**/*.ts', '**/*.tsx'],
        exclude: ['dist', 'node_modules'],
      } as const;

      // read & update/overwrite
      const content = JSON.stringify(template, null, 2) + '\n';
      yield* Effect.tryPromise({
        try: () => fs.writeFile(tsconfigPath, content, 'utf8'),
        catch: (cause) => cause,
      });
    });

    const ensureTypesScript = Effect.fn('TypeScriptSetupService.ensureTypesScript')(function* (packageDir: string) {
      const pkg = yield* pm.readPackageJson({ id: packageDir });
      pkg.scripts = pkg.scripts ?? {};
      if (!pkg.scripts.types) {
        pkg.scripts.types = 'tsc --noEmit';
      }
      yield* pm.writePackageJson({ id: packageDir, content: pkg });
    });

    const installDeps = Effect.fn('TypeScriptSetupService.installDeps')(function* () {
      yield* pm.addDependencies({ devDependencies: ['typescript', '@2digits/tsconfig', '@effect/language-service'] });
    });

    const setup = Effect.fn('TypeScriptSetupService.setup')(function* () {
      yield* Effect.logInfo('🛠️ Setting up TypeScript across workspaces...');

      const packageDirs = yield* ws.listPackageDirs();

      for (const dir of packageDirs) {
        yield* ensureTsconfigForPackage(dir);
        yield* ensureTypesScript(dir);
      }

      // Root tsconfig for references or tooling consistency
      const root = yield* pm.resolveRoot();
      const rootTsConfigPath = path.resolve(root, 'tsconfig.json');
      const rootTemplate = {
        extends: '@2digits/tsconfig/tsconfig.json',
        compilerOptions: {
          plugins: [{ name: '@effect/language-service' }],
        },
        include: ['**/*.ts', '**/*.tsx'],
        exclude: ['dist', 'node_modules'],
      } as const;
      yield* Effect.tryPromise({
        try: () => fs.writeFile(rootTsConfigPath, JSON.stringify(rootTemplate, null, 2) + '\n', 'utf8'),
        catch: (cause) => cause,
      });

      yield* installDeps();

      yield* Effect.logInfo('✅ TypeScript setup complete');
    });

    return { setup };
  }),
  dependencies: [PackageManagerService.Default, WorkspaceService.Default],
}) {}

