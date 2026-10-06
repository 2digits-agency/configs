import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as PlatformError from 'effect/PlatformError';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { TestClock } from 'effect/testing';

import { OrbitAuthError } from '../src/oauth/session.js';
import { makeSessionStoreLayer, SessionStore } from '../src/oauth/store.js';

const TEMP_PREFIX = 'orbit-store-';

const PermissionDenied = Schema.TaggedStruct('PermissionDenied', {
  module: Schema.String,
  method: Schema.String,
});

describe('orbit scoped persistence and lock policy', () => {
  it.effect('rejects contention immediately and releases an interrupted owner', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: TEMP_PREFIX });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        const acquired = yield* Deferred.make<undefined>();

        const owner = yield* Effect.gen(function* () {
          yield* store.lock;

          yield* Deferred.succeed(acquired, undefined);

          return yield* Effect.never;
        }).pipe(Effect.scoped, Effect.forkScoped);

        yield* Deferred.await(acquired);

        const failure = yield* Effect.scoped(store.lock).pipe(Effect.flip);

        expect(failure.message).toContain('locked');

        expect((yield* fs.stat(`${directory}/session.lock`)).mode & 0o777).toBe(0o600);

        expect((yield* fs.stat(directory)).mode & 0o777).toBe(0o700);

        yield* Fiber.interrupt(owner);

        expect(yield* fs.exists(`${directory}/session.lock`)).toBeFalsy();

        yield* Effect.scoped(store.lock);

        expect(yield* fs.exists(`${directory}/session.lock`)).toBeFalsy();
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' })));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  it.effect('never steals an old lock or deletes it after failed acquisition', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: TEMP_PREFIX });

      const lockFile = `${directory}/session.lock`;

      yield* fs.writeFileString(lockFile, 'crashed-owner', { mode: 0o600 });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        yield* TestClock.adjust('1 day');

        const failure = yield* Effect.scoped(store.lock).pipe(Effect.flip);

        expect(failure.message).toContain('After a crash only');

        expect(yield* fs.readFileString(lockFile)).toBe('crashed-owner');
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' })));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  it.effect('reports permission failures without advising lock removal or retrying', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: TEMP_PREFIX });

      let attempts = 0;

      const filesystem = Layer.succeed(FileSystem.FileSystem, {
        ...fs,
        writeFileString: Effect.fn('Test.writeFileString')(function* () {
          attempts++;

          return yield* new PlatformError.PlatformError(
            new PlatformError.SystemError(
              PermissionDenied.make({
                module: 'FileSystem',
                method: 'writeFileString',
              }),
            ),
          );
        }),
      });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        const failure = yield* Effect.scoped(store.lock).pipe(Effect.flip);

        expect(failure.message).toContain('permissions');

        expect(failure.message).not.toContain('remove');

        expect(attempts).toBe(1);

        expect(yield* fs.exists(`${directory}/session.lock`)).toBeFalsy();
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' }).pipe(Layer.provide(filesystem))));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  it.effect('releases its lock when the protected operation fails', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: TEMP_PREFIX });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        const failure = yield* Effect.gen(function* () {
          yield* store.lock;

          return yield* OrbitAuthError.make({ message: 'protected operation failed' });
        }).pipe(Effect.scoped, Effect.flip);

        expect(failure.message).toBe('protected operation failed');

        expect(yield* fs.exists(`${directory}/session.lock`)).toBeFalsy();

        yield* Effect.scoped(store.lock);
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' })));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  it.effect('preserves credentials and removes scoped temporary files when atomic replacement fails', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: TEMP_PREFIX });

      yield* fs.writeFileString(`${directory}/session.json`, 'original', { mode: 0o600 });

      const filesystem = Layer.succeed(FileSystem.FileSystem, {
        ...fs,
        rename: Effect.fn('Test.rename')(function* () {
          return yield* new PlatformError.PlatformError(
            new PlatformError.SystemError(PermissionDenied.make({ module: 'FileSystem', method: 'rename' })),
          );
        }),
      });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        const failure = yield* store
          .save({ clientId: 'client', accessToken: Redacted.make('secret') })
          .pipe(Effect.flip);

        expect(failure.message).toContain('Could not persist');

        expect(yield* fs.readFileString(`${directory}/session.json`)).toBe('original');

        expect(yield* fs.readDirectory(directory)).toStrictEqual(['session.json']);
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' }).pipe(Layer.provide(filesystem))));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );
});
