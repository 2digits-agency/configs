import * as NodeCrypto from '@effect/platform-node/NodeCrypto';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as UserDirectories from 'effect/persistence/UserDirectories';

// NodeServices no longer includes crypto; keep application and test runtimes aligned.
export const PlatformLive = Layer.mergeAll(
  NodeServices.layer,
  NodeCrypto.layerDigest,
  NodeCrypto.layerSecureRandom,
  UserDirectories.layer,
);

/**
 * The `tlo-mcp` directory inside the platform config directory. Versions before `UserDirectories` used
 * `~/.config/2digits/tlo-mcp`; while `file` exists only there, keep using that directory so upgrades keep the gateway
 * key and Orbit session.
 *
 * @param file
 */
export const configDirectory = Effect.fn('TloMcp.configDirectory')(function* (file: string) {
  const fs = yield* FileSystem.FileSystem;

  const path = yield* Path.Path;

  const dirs = yield* UserDirectories.UserDirectories;

  const config = yield* dirs.config('2digits');

  const home = yield* dirs.home;

  const current = path.join(config, 'tlo-mcp');

  const legacy = path.join(home, '.config', '2digits', 'tlo-mcp');

  const currentExists = yield* fs.exists(path.join(current, file));

  const legacyExists = yield* fs.exists(path.join(legacy, file));

  return !currentExists && legacyExists ? legacy : current;
});
