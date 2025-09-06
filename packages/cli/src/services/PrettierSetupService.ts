import { Effect } from 'effect';

import { PackageManagerService } from './PackageManagerService';

export class PrettierSetupService extends Effect.Service<PrettierSetupService>()('PrettierSetupService', {
  effect: Effect.gen(function* () {
    const pm = yield* PackageManagerService;

    const setup = Effect.fn('PrettierSetupService.setup')(function* () {
      yield* Effect.logInfo('🚀 Setting up Prettier...');

      const root = yield* pm.resolveRoot();

      const packageJson = yield* pm.readPackageJson({ id: root });

      if (!packageJson.prettier) {
        packageJson.prettier = '@2digits/prettier-config';
        yield* Effect.logInfo('✅ Added prettier config to package.json');
      }

      packageJson.scripts = packageJson.scripts || {};
      if (!packageJson.scripts.format) {
        packageJson.scripts.format =
          'prettier "**/*" --ignore-unknown --ignore-path .gitignore --ignore-path .prettierignore --check';
        yield* Effect.logInfo('✅ Added format script');
      }
      if (!packageJson.scripts['format:fix']) {
        packageJson.scripts['format:fix'] =
          'prettier "**/*" --ignore-unknown --ignore-path .gitignore --ignore-path .prettierignore --write';
        yield* Effect.logInfo('✅ Added format:fix script');
      }

      yield* pm.writePackageJson({ id: root, content: packageJson });

      yield* pm.addDependencies({
        devDependencies: ['prettier', '@2digits/prettier-config'],
      });

      const formatCmd = yield* pm.runScriptCommand({ script: 'format' });
      const formatFixCmd = yield* pm.runScriptCommand({ script: 'format:fix' });

      yield* Effect.logInfo('🎉 Prettier setup complete!');
      yield* Effect.logInfo(`Run '${formatCmd}' to check formatting`);
      yield* Effect.logInfo(`Run '${formatFixCmd}' to fix formatting issues`);
    });

    return {
      setup,
    };
  }),
  dependencies: [PackageManagerService.Default],
}) {}
