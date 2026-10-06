import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import { FetchHttpClient } from 'effect/http';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import * as TestClock from 'effect/testing/TestClock';
import { vi } from 'vite-plus/test';

import { OrbitAuth, OrbitAuthLayer } from '../src/oauth/OrbitAuth.js';
import { listenForLogin } from '../src/oauth/callback.js';
import { ORBIT_ORIGIN, type Session } from '../src/oauth/session.js';
import { SessionStore } from '../src/oauth/store.js';

vi.mock(import('../src/oauth/callback.js'), () => ({ listenForLogin: vi.fn<typeof listenForLogin>() }));

const metadata = {
  issuer: ORBIT_ORIGIN,
  authorization_endpoint: `${ORBIT_ORIGIN}/oauth2/Authorize`,
  token_endpoint: `${ORBIT_ORIGIN}/oauth2/access_token`,
  token_endpoint_auth_methods_supported: ['none'],
};

describe('orbit browser and operation cleanup', () => {
  it.live('escalates cleanup when a native browser-like child ignores SIGTERM', () =>
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

      const handle = yield* Effect.gen(function* () {
        const child = yield* spawner.spawn(
          ChildProcess.make(
            process.execPath,
            ['-e', "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 1000);"],
            { forceKillAfter: '100 millis', stderr: 'ignore' },
          ),
        );

        yield* Stream.runHead(child.stdout);

        yield* child.exitCode.pipe(Effect.timeout('50 millis'), Effect.flip);

        return child;
      }).pipe(Effect.scoped);

      // oxlint-disable-next-line vitest/no-standalone-expect -- it.live is an Effect test.
      expect(yield* handle.isRunning).toBeFalsy();
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  for (const outcome of ['success', 'nonzero', 'timeout', 'interrupted']) {
    it.effect(`releases browser scope on ${outcome} without replaying registration or grants`, () =>
      Effect.gen(function* () {
        const started = yield* Deferred.make<undefined>();

        const callbackStarted = yield* Deferred.make<undefined>();

        const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

        const signals: Array<AbortSignal> = [];

        const commands: Array<ChildProcess.Command> = [];

        let released = 0;

        let lockReleased = 0;

        let saved: Session | undefined;

        let registrations = 0;

        let grants = 0;

        vi.mocked(listenForLogin).mockReturnValue(
          Effect.succeed({
            redirectUri: 'http://127.0.0.1:12345/callback',
            code: Deferred.succeed(callbackStarted, undefined).pipe(
              Effect.andThen(outcome === 'interrupted' ? Effect.never : Effect.succeed('auth-code')),
            ),
          }),
        );

        const fetchMock: typeof globalThis.fetch = (input, init) => {
          const url = input instanceof Request ? input.url : String(input);

          if (init?.signal) {
            signals.push(init.signal);
          }

          if (url.endsWith('/register')) {
            registrations++;
          }

          if (url.endsWith('/access_token')) {
            grants++;
          }

          const response = Response.json(
            url.endsWith('/register')
              ? { client_id: 'client' }
              : url.endsWith('/access_token')
                ? { access_token: 'access', token_type: 'Bearer', expires_in: 3600 }
                : metadata,
          );

          Object.defineProperty(response, 'url', { value: url });

          return Promise.resolve(response);
        };

        const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

        const browser = {
          ...spawner,
          spawn: Effect.fn('Test.browser')(function* (command: ChildProcess.Command) {
            commands.push(command);

            yield* Effect.acquireRelease(Deferred.succeed(started, undefined), () =>
              Effect.sync(() => {
                released++;
              }),
            );

            return ChildProcessSpawner.makeHandle({
              pid: ChildProcessSpawner.ProcessId(1),
              exitCode:
                outcome === 'timeout' || outcome === 'interrupted'
                  ? Effect.never
                  : Effect.succeed(ChildProcessSpawner.ExitCode(outcome === 'success' ? 0 : 1)),
              isRunning: Effect.succeed(true),
              kill: () => Effect.void,
              stdin: Sink.drain,
              stdout: Stream.empty,
              stderr: Stream.empty,
              all: Stream.empty,
              getInputFd: () => Sink.drain,
              getOutputFd: () => Stream.empty,
              unref: Effect.succeed(Effect.void),
            });
          }),
        };

        const store = Layer.succeed(
          SessionStore,
          SessionStore.of({
            load: Effect.sync(() => saved),
            save: Effect.fn('Test.save')((session) =>
              Effect.sync(() => {
                saved = session;
              }),
            ),
            clear: Effect.void,
            lock: Effect.acquireRelease(Effect.void, () =>
              Effect.sync(() => {
                lockReleased++;
              }),
            ),
          }),
        );

        const authLayer = OrbitAuthLayer.pipe(Layer.provide(store), Layer.provide(FetchHttpClient.layer));

        yield* Effect.gen(function* () {
          const auth = yield* OrbitAuth;

          const fiber = yield* auth.login.pipe(Effect.forkChild);

          yield* Deferred.await(started);

          if (outcome === 'timeout') {
            yield* TestClock.adjust('5 seconds');
          }

          yield* outcome === 'interrupted' ? Fiber.interrupt(fiber) : Fiber.join(fiber);

          expect({
            released,
            lockReleased,
            commands: commands.length,
            registrations,
            grants,
            aborted: signals.every((signal) => signal.aborted),
            access: saved?.accessToken.pipe(Redacted.value),
          }).toStrictEqual({
            released: 1,
            lockReleased: 1,
            commands: 1,
            registrations: 1,
            grants: outcome === 'interrupted' ? 0 : 1,
            aborted: true,
            access: outcome === 'interrupted' ? undefined : 'access',
          });

          const command = commands[0];

          expect(command?._tag).toBe('StandardCommand');

          if (command?._tag !== 'StandardCommand') {
            return;
          }

          expect(command.options).toMatchObject({ forceKillAfter: '1 second', stdout: 'ignore', stderr: 'ignore' });

          const url = new URL(command.args.at(-1) ?? '');

          expect({
            state: url.searchParams.get('state'),
            method: url.searchParams.get('code_challenge_method'),
            challenge: Boolean(url.searchParams.get('code_challenge')),
          }).toStrictEqual({
            state: vi.mocked(listenForLogin).mock.calls.at(-1)?.[0],
            method: 'S256',
            challenge: true,
          });

          const output = stderr.mock.calls.map(([text]) => String(text)).join('');

          expect(output.includes(`Open this URL in your browser:\n${url.href}\n`)).toBe(
            outcome === 'nonzero' || outcome === 'timeout',
          );
        }).pipe(
          Effect.provide(authLayer),
          Effect.provideService(ChildProcessSpawner.ChildProcessSpawner, browser),
          Effect.provideService(FetchHttpClient.Fetch, fetchMock),
          Effect.ensuring(Effect.sync(() => stderr.mockRestore())),
        );
      }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
    );
  }

  it.effect('times out a stalled registration body and permits later discovery after failure', () =>
    Effect.gen(function* () {
      const bodyStarted = yield* Deferred.make<boolean>();

      const signals: Array<AbortSignal> = [];

      let discoveries = 0;

      let registrations = 0;

      let released = 0;

      let saved: Session | undefined;

      vi.mocked(listenForLogin).mockReturnValue(
        Effect.succeed({
          redirectUri: 'http://127.0.0.1:12345/callback',
          code: Effect.never,
        }),
      );

      const fetchMock: typeof globalThis.fetch = (input, init) => {
        const url = input instanceof Request ? input.url : String(input);

        if (init?.signal) {
          signals.push(init.signal);
        }

        if (!url.endsWith('/register')) {
          discoveries++;

          return Promise.resolve(Response.json(discoveries === 1 ? {} : metadata));
        }

        registrations++;

        const response = Response.json({ client_id: 'client' });

        response.arrayBuffer = () => {
          Deferred.doneUnsafe(bodyStarted, Effect.succeed(true));

          return Promise.withResolvers<ArrayBuffer>().promise;
        };

        return Promise.resolve(response);
      };

      const store = Layer.succeed(
        SessionStore,
        SessionStore.of({
          load: Effect.sync(() => saved),
          save: Effect.fn('Test.save')((session) =>
            Effect.sync(() => {
              saved = session;
            }),
          ),
          clear: Effect.void,
          lock: Effect.acquireRelease(Effect.void, () =>
            Effect.sync(() => {
              released++;
            }),
          ),
        }),
      );

      yield* Effect.gen(function* () {
        const auth = yield* OrbitAuth;

        yield* auth.login.pipe(Effect.flip);

        const fiber = yield* auth.login.pipe(Effect.flip, Effect.forkChild);

        yield* Deferred.await(bodyStarted);

        yield* TestClock.adjust('15 seconds');

        yield* Fiber.join(fiber);

        expect(discoveries).toBe(2);

        expect(registrations).toBe(1);

        expect(released).toBe(2);

        expect(signals.every((signal) => signal.aborted)).toBeTruthy();
      }).pipe(
        Effect.provide(OrbitAuthLayer.pipe(Layer.provide(store), Layer.provide(FetchHttpClient.layer))),
        Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      );
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );
});
