import path from 'node:path';
import fs from 'node:fs/promises';

import { Effect } from 'effect';

import { PackageManagerService } from './PackageManagerService';
import { WorkspaceService } from './WorkspaceService';

export class ESLintSetupService extends Effect.Service<ESLintSetupService>()('ESLintSetupService', {
  effect: Effect.gen(function* () {
    const pm = yield* PackageManagerService;
    const ws = yield* WorkspaceService;

    const ensureEslintConfig = Effect.fn('ESLintSetupService.ensureEslintConfig')(function* (packageDir: string) {
      const configPath = path.resolve(packageDir, 'eslint.config.ts');
      const content = `import twoDigits from '@2digits/eslint-config';

export default twoDigits({ ts: true, turbo: true, pnpm: true });
`;

      yield* Effect.tryPromise({
        try: () => fs.writeFile(configPath, content, 'utf8'),
        catch: (cause) => cause,
      });
    });

    const ensureLintScripts = Effect.fn('ESLintSetupService.ensureLintScripts')(function* (packageDir: string) {
      const pkg = yield* pm.readPackageJson({ id: packageDir });
      pkg.scripts = pkg.scripts ?? {};
      if (!pkg.scripts.lint) pkg.scripts.lint = 'eslint .';
      if (!pkg.scripts['lint:fix']) pkg.scripts['lint:fix'] = 'eslint . --fix';
      yield* pm.writePackageJson({ id: packageDir, content: pkg });
    });

    const installDeps = Effect.fn('ESLintSetupService.installDeps')(function* () {
      yield* pm.addDependencies({ devDependencies: ['eslint', '@2digits/eslint-config'] });
    });

    const setup = Effect.fn('ESLintSetupService.setup')(function* () {
      yield* Effect.logInfo('🧹 Setting up ESLint across workspaces...');

      const packageDirs = yield* ws.listPackageDirs();
      for (const dir of packageDirs) {
        yield* ensureEslintConfig(dir);
        yield* ensureLintScripts(dir);
      }

      yield* installDeps();

      yield* Effect.logInfo('✅ ESLint setup complete');
    });

    return { setup };
  }),
  dependencies: [PackageManagerService.Default, WorkspaceService.Default],
}) {}

