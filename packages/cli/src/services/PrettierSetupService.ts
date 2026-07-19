import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { type PlatformError } from 'effect/PlatformError';
import { type ChildProcessSpawner } from 'effect/unstable/process/ChildProcessSpawner';

import { type PackageManagerError, PackageManagerService } from './PackageManagerService';

/**
 * Operations exposed by the Prettier setup service.
 */
export interface PrettierSetupServiceShape {
  readonly setup: () => Effect.Effect<void, PackageManagerError | PlatformError, ChildProcessSpawner>;
}

/**
 * Service for configuring Prettier in a project.
 */
export class PrettierSetupService extends Context.Service<PrettierSetupService, PrettierSetupServiceShape>()(
  '@2digits/cli/services/PrettierSetupService',
  {
    make: Effect.gen(function* () {
      const pm = yield* PackageManagerService;

      const setup = Effect.fn('PrettierSetupService.setup')(function* () {
        yield* Effect.logInfo('🚀 Setting up Prettier...');

        const root = yield* pm.resolveRoot();

        const packageJson = yield* pm.readPackageJson({ id: root });

        if (!packageJson.prettier) {
          packageJson.prettier = '@2digits/prettier-config';
          yield* Effect.logInfo('✅ Added prettier config to package.json');
        }

        packageJson.scripts ??= {};
        if (!packageJson.scripts.format) {
          packageJson.scripts.format = 'prettier . --ignore-unknown --check --cache';
          yield* Effect.logInfo('✅ Added format script');
        }
        if (!packageJson.scripts['format:fix']) {
          packageJson.scripts['format:fix'] = 'prettier . --ignore-unknown --write --cache';
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
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(PackageManagerService.layer));
}
