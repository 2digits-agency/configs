import { homedir } from 'node:os';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import type * as Scope from 'effect/Scope';
import * as Stream from 'effect/Stream';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';

import { OrbitAuthError, Session } from './session.js';

const SessionJson = Schema.fromJsonString(Session);

const KEYCHAIN_SERVICE = '@2digits/tlo-mcp/orbit';

export interface SessionStoreShape {
  readonly load: Effect.Effect<Session | undefined, OrbitAuthError>;
  readonly save: (session: Session) => Effect.Effect<void, OrbitAuthError>;
  readonly clear: Effect.Effect<void, OrbitAuthError>;
  readonly lock: Effect.Effect<void, OrbitAuthError, Scope.Scope>;
}

export class SessionStore extends Context.Service<SessionStore, SessionStoreShape>()(
  '@2digits/tlo-mcp/oauth/store/SessionStore',
) {}

function quoteSecurity(value: string): string {
  const escaped = value.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);

  return `"${escaped}"`;
}

/**
 * Keychain on macOS; private atomic files elsewhere. Credentials never enter argv.
 *
 * @param options
 * @param options.directory
 * @param options.platform
 */
export function makeSessionStoreLayer(options: { readonly directory?: string; readonly platform?: string } = {}) {
  return Layer.effect(
    SessionStore,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const path = yield* Path.Path;

      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

      const platform = options.platform ?? process.platform;

      const directory = options.directory ?? path.join(homedir(), '.config', '2digits', 'tlo-mcp');

      const file = path.join(directory, 'session.json');

      const lockFile = path.join(directory, 'session.lock');

      const prepare = fs
        .makeDirectory(directory, { recursive: true, mode: 0o700 })
        .pipe(Effect.andThen(fs.chmod(directory, 0o700)));

      const security = Effect.fn('SessionStore.security')(function* (args: ReadonlyArray<string>, input?: string) {
        const handle = yield* spawner.spawn(
          ChildProcess.make('/usr/bin/security', args, {
            stdin: input === undefined ? 'ignore' : Stream.succeed(new TextEncoder().encode(input)),
            stderr: 'ignore',
          }),
        );

        return yield* Effect.all(
          {
            output: handle.stdout.pipe(Stream.decodeText(), Stream.mkString),
            exitCode: handle.exitCode,
          },
          { concurrency: 'unbounded' },
        );
      }, Effect.scoped);

      const load = Effect.fn('SessionStore.load')(
        function* () {
          let text: string;

          if (platform === 'darwin') {
            const result = yield* security(['find-generic-password', '-a', 'orbit', '-s', KEYCHAIN_SERVICE, '-w']);

            if (result.exitCode === 44) {
              return;
            }

            if (result.exitCode !== 0) {
              return yield* OrbitAuthError.make({ message: 'Could not read macOS Keychain.' });
            }

            text = result.output.trim();
          } else {
            const content = yield* fs
              .readFileString(file)
              .pipe(Effect.catchReason('PlatformError', 'NotFound', () => Effect.void));

            if (content === undefined) {
              return;
            }

            text = content;
          }

          return yield* Schema.decodeEffect(SessionJson)(text);
        },
        Effect.mapError(() => OrbitAuthError.make({ message: 'Could not read credentials. Run tlo-mcp login again.' })),
      );

      const save = Effect.fn('SessionStore.save')(
        function* (session: Session) {
          const text = yield* Schema.encodeEffect(SessionJson)(session);

          if (platform === 'darwin') {
            const result = yield* security(
              ['-q', '-i'],
              `add-generic-password -U -a orbit -s ${quoteSecurity(KEYCHAIN_SERVICE)} -w ${quoteSecurity(text)}\n`,
            );

            if (result.exitCode !== 0) {
              return yield* OrbitAuthError.make({ message: 'Could not save macOS Keychain credentials.' });
            }
          } else {
            yield* prepare;

            const temporaryDirectory = yield* fs.makeTempDirectoryScoped({ directory, prefix: 'session-' });

            const temporary = path.join(temporaryDirectory, 'session.json');

            yield* fs.writeFileString(temporary, text, { mode: 0o600 });

            yield* fs.rename(temporary, file);
          }
        },
        Effect.scoped,
        Effect.mapError(() =>
          OrbitAuthError.make({ message: 'Could not persist OAuth credentials. Run tlo-mcp login again.' }),
        ),
      );

      const clear = Effect.fn('SessionStore.clear')(
        function* () {
          if (platform === 'darwin') {
            const result = yield* security(['delete-generic-password', '-a', 'orbit', '-s', KEYCHAIN_SERVICE]);

            if (result.exitCode !== 0 && result.exitCode !== 44) {
              return yield* OrbitAuthError.make({ message: 'Could not remove Keychain credentials.' });
            }
          } else {
            yield* fs.remove(file, { force: true });
          }
        },
        Effect.mapError(() => OrbitAuthError.make({ message: 'Could not remove OAuth credentials.' })),
      );

      const lock = Effect.fn('SessionStore.lock')(
        function* () {
          yield* prepare;

          // Fail closed: an existing lock may belong to a live login or a crashed process.
          yield* Effect.acquireRelease(
            fs.writeFileString(lockFile, String(process.pid), { flag: 'wx', mode: 0o600 }).pipe(
              Effect.catchReason('PlatformError', 'AlreadyExists', () =>
                OrbitAuthError.make({
                  message: `OAuth credentials locked. Close other login/refresh processes. After a crash only, remove ${lockFile}.`,
                }),
              ),
            ),
            () => fs.remove(lockFile).pipe(Effect.orDie),
          );
        },
        Effect.mapError((error) =>
          Schema.is(OrbitAuthError)(error)
            ? error
            : OrbitAuthError.make({ message: 'Could not acquire OAuth credential lock. Check directory permissions.' }),
        ),
      );

      return SessionStore.of({ load: load(), save, clear: clear(), lock: lock() });
    }),
  );
}

export const SessionStoreLive = makeSessionStoreLayer();
