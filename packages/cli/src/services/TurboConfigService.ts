import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import { type TurboConfig, TurboConfigJson } from '../schemas/TurboConfig';
import { PackageManagerService } from './PackageManagerService';

const decodeTurboConfigJson = Schema.decodeEffect(TurboConfigJson);

const encodeTurboConfigJson = Schema.encodeEffect(TurboConfigJson);

class TurboConfigError extends Schema.TaggedError<TurboConfigError, { readonly brand: unique symbol }>()(
  '@2digits/cli/services/TurboConfigService/TurboConfigError',
  {
    operation: Schema.String,
    message: Schema.String,
    cause: Schema.Defect().pipe(Schema.optional),
  },
) {}

/**
 * Service for reading and writing the `turbo.json` at the workspace root.
 */
export class TurboConfigService extends Context.Service<TurboConfigService>()(
  '@2digits/cli/services/TurboConfigService',
  {
    make: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const path = yield* Path.Path;

      const pm = yield* PackageManagerService;

      const turboPath = Effect.fn('TurboConfigService.turboPath')(function* () {
        const root = yield* pm.resolveRoot();

        return path.join(root, 'turbo.json');
      });

      /**
       * Read turbo.json, or `None` when the workspace has none.
       */
      const read = Effect.fn('TurboConfigService.read')(function* () {
        const configPath = yield* turboPath();

        const exists = yield* fs.exists(configPath).pipe(Effect.orElseSucceed(() => false));

        if (!exists) {
          return Opt.none();
        }

        const content = yield* fs
          .readFileString(configPath)
          .pipe(
            Effect.mapError((cause) =>
              TurboConfigError.make({ operation: 'readTurboConfig', message: 'Failed to read turbo.json', cause }),
            ),
          );

        const config = yield* decodeTurboConfigJson(content).pipe(
          Effect.mapError((cause) =>
            TurboConfigError.make({ operation: 'readTurboConfig', message: 'Invalid JSON in turbo.json', cause }),
          ),
        );

        return Opt.some(config);
      });

      /**
       * Write turbo.json, formatted the way Turborepo writes it.
       */
      const write = Effect.fn('TurboConfigService.write')(function* (config: TurboConfig) {
        const configPath = yield* turboPath();

        yield* encodeTurboConfigJson(config).pipe(
          Effect.flatMap((content) => fs.writeFileString(configPath, content)),
          Effect.mapError((cause) =>
            TurboConfigError.make({ operation: 'writeTurboConfig', message: 'Failed to write turbo.json', cause }),
          ),
        );
      });

      return {
        read,
        write,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, PackageManagerService.layer)),
  );
}
