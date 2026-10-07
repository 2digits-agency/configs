import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import { FetchHttpClient, HttpClient } from 'effect/http';
import { TestClock } from 'effect/testing';

import { OrbitAuth, OrbitAuthLayer } from '../src/oauth/OrbitAuth.js';
import { listenForLogin, validateCallback } from '../src/oauth/callback.js';
import { needsRefresh, ORBIT_ORIGIN, Session, updateSession } from '../src/oauth/session.js';
import { makeSessionStoreLayer, SessionStore } from '../src/oauth/store.js';

const fixture: Session = {
  clientId: 'test-client',
  accessToken: Redacted.make('access'),
  refreshToken: Redacted.make('refresh'),
  expiresAt: 0,
};

const NEW_ACCESS = 'new-access';

describe('orbit OAuth', () => {
  it('preserves unrotated refresh tokens and replaces expiry', () => {
    const updated = updateSession(
      fixture,
      { tokenType: 'bearer', accessToken: Redacted.make(NEW_ACCESS), expiresIn: 120 },
      1000,
    );

    expect(Redacted.value(updated.accessToken)).toBe(NEW_ACCESS);

    expect(updated.refreshToken).toBe(fixture.refreshToken);

    expect(updated.expiresAt).toBe(121_000);

    expect(needsRefresh(updated, 60_999)).toBeFalsy();

    expect(needsRefresh(updated, 61_000)).toBeTruthy();
  });

  it('retains rotated refresh tokens but never invents an expiry', () => {
    const updated = updateSession(
      fixture,
      { tokenType: 'bearer', accessToken: Redacted.make('new'), refreshToken: Redacted.make('rotated') },
      1000,
    );

    expect(updated.expiresAt).toBeUndefined();

    expect(updated.refreshToken?.pipe(Redacted.value)).toBe('rotated');

    expect(needsRefresh(updated, 1000)).toBeTruthy();

    expect(JSON.stringify(updated)).not.toContain('rotated');
  });

  it('rejects wrong, missing, duplicate state and malformed callback codes', () => {
    for (const query of [
      'code=x',
      'state=wrong&code=x',
      'state=secret&state=secret&code=x',
      'state=secret&code=',
      'state=secret&code=x&code=y',
    ]) {
      expect(validateCallback(new URL(`http://127.0.0.1/callback?${query}`), 'secret')).toBeUndefined();
    }

    expect(validateCallback(new URL('http://127.0.0.1/wrong?state=secret&code=x'), 'secret')).toBeUndefined();

    expect(validateCallback(new URL('http://127.0.0.1/callback?state=secret&code=x'), 'secret')).toBe('x');

    expect(() =>
      validateCallback(new URL('http://127.0.0.1/callback?state=secret&error=access_denied'), 'secret'),
    ).toThrow('denied');
  });

  it.effect('accepts one loopback callback after rejecting unsolicited requests', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('test-state');

      const http = yield* HttpClient.HttpClient;

      const bad = yield* http.get(`${callback.redirectUri}?state=wrong&code=bad`);

      expect(bad.status).toBe(400);

      const good = yield* http.get(`${callback.redirectUri}?state=test-state&code=valid`);

      expect(good.status).toBe(200);

      expect(yield* callback.code).toBe('valid');

      const replay = yield* http.get(`${callback.redirectUri}?state=test-state&code=valid`);

      expect(replay.status).toBe(400);
    }).pipe(Effect.provide(FetchHttpClient.layer), Effect.scoped),
  );

  it.effect('times out callback waiting with virtual time and closes the listener', () =>
    Effect.gen(function* () {
      const redirectUri = yield* Effect.scoped(
        Effect.gen(function* () {
          const callback = yield* listenForLogin('timeout-state');

          const pending = yield* callback.code.pipe(Effect.forkScoped);

          yield* TestClock.adjust('3 minutes');

          const error = yield* Fiber.join(pending).pipe(Effect.flip);

          expect(error._tag).toBe('OrbitAuthError');

          expect(error.message).toContain('timed out');

          return callback.redirectUri;
        }),
      );

      const http = yield* HttpClient.HttpClient;

      const failure = yield* http.get(redirectUri).pipe(Effect.flip);

      expect(failure._tag).toBe('HttpClientError');
    }).pipe(Effect.provide(FetchHttpClient.layer), Effect.scoped),
  );

  it.effect('closes the callback listener when its owning fiber is interrupted', () =>
    Effect.gen(function* () {
      const ready = yield* Deferred.make<string>();

      const login = yield* Effect.scoped(
        Effect.gen(function* () {
          const callback = yield* listenForLogin('interrupt-state');

          yield* Deferred.succeed(ready, callback.redirectUri);

          return yield* callback.code;
        }),
      ).pipe(Effect.forkScoped);

      const redirectUri = yield* Deferred.await(ready);

      yield* Fiber.interrupt(login);

      expect(Exit.hasInterrupts(yield* Fiber.await(login))).toBeTruthy();

      const http = yield* HttpClient.HttpClient;

      const failure = yield* http.get(redirectUri).pipe(Effect.flip);

      expect(failure._tag).toBe('HttpClientError');
    }).pipe(Effect.provide(FetchHttpClient.layer), Effect.scoped),
  );

  it.effect('persists private files, rejects concurrent locks and releases its lock', () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const directory = yield* fs.makeTempDirectoryScoped({ prefix: 'tlo-oauth-' });

      yield* Effect.gen(function* () {
        const store = yield* SessionStore;

        expect(yield* store.load).toBeUndefined();

        yield* store.save(fixture);

        const loaded = yield* store.load;

        expect(loaded?.accessToken.pipe(Redacted.value)).toBe('access');

        const stat = yield* fs.stat(`${directory}/session.json`);

        expect(stat.mode & 0o777).toBe(0o600);

        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* store.lock;

            const failure = yield* store.lock.pipe(Effect.flip);

            expect(failure.message).toContain('locked');
          }),
        );

        yield* Effect.scoped(store.lock);

        yield* store.clear;

        expect(yield* store.load).toBeUndefined();
      }).pipe(Effect.provide(makeSessionStoreLayer({ directory, platform: 'linux' })));
    }).pipe(Effect.provide(NodeServices.layer), Effect.scoped),
  );

  it.effect('serializes concurrent refreshes and persists rotation before returning tokens', () =>
    Effect.gen(function* () {
      const context = yield* Effect.context();

      const stored = yield* Ref.make(fixture);

      const tokenStarted = yield* Deferred.make<undefined>();

      const allowToken = yield* Deferred.make<undefined>();

      const saveStarted = yield* Deferred.make<undefined>();

      const allowSave = yield* Deferred.make<undefined>();

      const secondStarted = yield* Deferred.make<undefined>();

      let refreshes = 0;

      const fetchMock: typeof globalThis.fetch = (input, init) => {
        const url = input instanceof Request ? input.url : String(input);

        const isToken = url.endsWith('/access_token');

        if (isToken) {
          refreshes++;

          const bodyText =
            init?.body instanceof Uint8Array
              ? new TextDecoder().decode(init.body)
              : typeof init?.body === 'string'
                ? init.body
                : '';

          const parameters = new URLSearchParams(bodyText);

          expect(Object.fromEntries(parameters)).toMatchObject({
            grant_type: 'refresh_token',
            resource: `${ORBIT_ORIGIN}/mcp`,
            refresh_token: 'refresh',
          });
        }

        const response = Response.json(
          isToken
            ? {
                access_token: NEW_ACCESS,
                refresh_token: 'rotated',
                token_type: 'Bearer',
                expires_in: 3600,
              }
            : {
                issuer: ORBIT_ORIGIN,
                authorization_endpoint: `${ORBIT_ORIGIN}/oauth2/Authorize`,
                token_endpoint: `${ORBIT_ORIGIN}/oauth2/access_token`,
                token_endpoint_auth_methods_supported: ['none'],
              },
        );

        Object.defineProperty(response, 'url', { value: url });

        return isToken
          ? Effect.runPromiseWith(context)(
              Deferred.succeed(tokenStarted, undefined).pipe(
                Effect.andThen(Deferred.await(allowToken)),
                Effect.as(response),
              ),
            )
          : Promise.resolve(response);
      };

      const store = Layer.succeed(
        SessionStore,
        SessionStore.of({
          load: Ref.get(stored),
          save: Effect.fn('SessionStore.save')((session) =>
            Deferred.succeed(saveStarted, undefined).pipe(
              Effect.andThen(Deferred.await(allowSave)),
              Effect.andThen(Ref.set(stored, session)),
            ),
          ),
          clear: Effect.void,
          lock: Effect.void,
        }),
      );

      const auth = OrbitAuthLayer.pipe(Layer.provide(store), Layer.provide(FetchHttpClient.layer));

      yield* Effect.gen(function* () {
        const service = yield* OrbitAuth;

        const first = yield* service.accessToken.pipe(Effect.forkScoped);

        yield* Deferred.await(tokenStarted);

        const second = yield* Deferred.succeed(secondStarted, undefined).pipe(
          Effect.andThen(service.accessToken),
          Effect.forkScoped,
        );

        yield* Deferred.await(secondStarted);

        yield* Deferred.succeed(allowToken, undefined);

        yield* Deferred.await(saveStarted);

        expect(Redacted.value((yield* Ref.get(stored)).accessToken)).toBe('access');

        expect([first.pollUnsafe(), second.pollUnsafe()]).toStrictEqual([undefined, undefined]);

        yield* Deferred.succeed(allowSave, undefined);

        const tokens = yield* Effect.all([Fiber.join(first), Fiber.join(second)]);

        expect(tokens.map((element) => Redacted.value(element))).toStrictEqual([NEW_ACCESS, NEW_ACCESS]);

        expect(refreshes).toBe(1);

        expect((yield* Ref.get(stored)).refreshToken?.pipe(Redacted.value)).toBe('rotated');
      }).pipe(
        Effect.provide(auth.pipe(Layer.provide(NodeServices.layer))),
        Effect.provideService(FetchHttpClient.Fetch, fetchMock),
        Effect.scoped,
      );
    }).pipe(Effect.scoped),
  );

  it.effect('rejects invalid stored token shapes without exposing their content', () =>
    Schema.decodeEffect(Session)({ clientId: 'client', accessToken: '' }).pipe(
      Effect.flip,
      Effect.tap((error) =>
        Effect.sync(() => {
          expect(error).toBeDefined();
        }),
      ),
      Effect.asVoid,
    ),
  );
});
