import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as Url from '@effect/platform/Url';
import * as Effect from 'effect/Effect';
import * as Either from 'effect/Either';

/**
 * Creates a scoped temp directory and switches cwd to it.
 * Automatically cleans up temp dir and restores cwd when scope ends.
 *
 * @param prefix - Prefix for temp directory name
 * @returns Effect that yields the temp directory path
 */
export const withTempTestEnv = Effect.fn('withTempTestEnv')(function* (prefix: string) {
  const fs = yield* FileSystem.FileSystem;
  const tempDir = yield* fs.makeTempDirectoryScoped({ prefix: `test-${prefix}-` });

  // Change to temp directory within the same scope
  yield* Effect.acquireRelease(
    Effect.sync(() => {
      const originalCwd = process.cwd();

      process.chdir(tempDir);

      return originalCwd;
    }),
    (originalCwd) => Effect.sync(() => process.chdir(originalCwd)),
  );

  return tempDir;
});

export const fixturesBasePath = Effect.gen(function* () {
  const path = yield* Path.Path;

  const __filename = yield* path.fromFileUrl(Either.getOrThrow(Url.fromString(import.meta.url)));
  const __dirname = path.dirname(__filename);

  return path.join(__dirname, '../fixtures/');
});

type Fixture = 'existing-configs' | 'monorepo-turborepo' | 'single-package' | 'monorepo-no-turbo';

/**
 * Copies a fixture directory into the current working directory (temp dir).
 * Should be called after withTempTestEnv.
 *
 * @param fixtureName - Name of fixture directory in test/fixtures/
 * @returns Effect with void
 */
export const copyFixture = Effect.fn('copyFixture')(function* (fixtureName: Fixture) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const fixturesBaseDir = yield* fixturesBasePath;
  const fixtureDir = path.join(fixturesBaseDir, fixtureName);

  const fixtureDirExists = yield* fs.exists(fixtureDir);

  if (!fixtureDirExists) {
    return yield* Effect.fail(new Error(`Fixture not found: ${fixtureName} at ${fixtureDir}`));
  }

  const targetDir = process.cwd();

  yield* fs.copy(`${fixtureDir}/`, targetDir);
});
