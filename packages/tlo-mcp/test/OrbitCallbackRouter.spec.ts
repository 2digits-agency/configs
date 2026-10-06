import * as NodeHttpClient from '@effect/platform-node/NodeHttpClient';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { FetchHttpClient, HttpClient } from 'effect/http';
import * as TestClock from 'effect/testing/TestClock';

import { listenForLogin } from '../src/oauth/callback.js';

describe('orbit callback router', () => {
  it.effect('rejects unsolicited paths, methods and duplicate parameters without consuming login', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('secret');

      const http = yield* HttpClient.HttpClient;

      expect(new URL(callback.redirectUri).hostname).toBe('127.0.0.1');

      expect(Number(new URL(callback.redirectUri).port)).toBeGreaterThan(0);

      for (const url of [
        callback.redirectUri.replace('/callback', '/wrong?state=secret&code=valid'),
        `${callback.redirectUri}?code=valid`,
        `${callback.redirectUri}?state=wrong&code=valid`,
        `${callback.redirectUri}?state=secret&state=secret&code=valid`,
        `${callback.redirectUri}?state=secret&code=one&code=two`,
        `${callback.redirectUri}?state=secret&code=`,
        `${callback.redirectUri}?state=wrong&error=access_denied`,
      ]) {
        const response = yield* http.get(url);

        expect(response).toMatchObject({
          status: 400,
          headers: {
            'cache-control': 'no-store',
            'referrer-policy': 'no-referrer',
            'content-security-policy': "default-src 'none'",
            'content-type': 'text/plain; charset=utf-8',
          },
        });
      }

      const post = yield* http.post(`${callback.redirectUri}?state=secret&code=valid`);

      const head = yield* http.head(`${callback.redirectUri}?state=secret&code=valid`);

      const wrongHost = yield* http.get(`${callback.redirectUri}?state=secret&code=valid`, {
        headers: { host: 'attacker.example' },
      });

      expect([post.status, head.status, wrongHost.status]).toStrictEqual([400, 400, 400]);

      const good = yield* http.get(`${callback.redirectUri}?state=secret&code=valid`);

      expect([good.status, good.headers['cache-control'], yield* callback.code]).toStrictEqual([
        200,
        'no-store',
        'valid',
      ]);
    }).pipe(Effect.provide(NodeHttpClient.layerNodeHttp), Effect.scoped),
  );

  it.effect('accepts exactly one concurrent callback', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('secret');

      const http = yield* HttpClient.HttpClient;

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect traversal, not Array.forEach.
      const responses = yield* Effect.forEach(
        ['one', 'two'],
        (code) => http.get(`${callback.redirectUri}?state=secret&code=${code}`),
        { concurrency: 'unbounded' },
      );

      expect(responses.map((response) => response.status).toSorted((left, right) => left - right)).toStrictEqual([
        200, 400,
      ]);

      expect(['one', 'two']).toContain(yield* callback.code);
    }).pipe(Effect.provide(FetchHttpClient.layer), Effect.scoped),
  );

  it.effect('consumes a legitimate denial and rejects later success', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('secret');

      const http = yield* HttpClient.HttpClient;

      const denied = yield* http.get(`${callback.redirectUri}?state=secret&error=access_denied`);

      expect(denied.status).toBe(400);

      expect(yield* denied.text).toContain('Authorization denied');

      const error = yield* Effect.flip(callback.code);

      expect(error._tag).toBe('OrbitAuthError');

      expect(error.message).toContain('Login denied or timed out');

      const replay = yield* http.get(`${callback.redirectUri}?state=secret&code=valid`);

      expect(replay.status).toBe(400);
    }).pipe(Effect.provide(FetchHttpClient.layer), Effect.scoped),
  );

  it.effect('times out after three minutes', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('secret');

      const waiting = yield* callback.code.pipe(Effect.flip, Effect.forkChild);

      yield* TestClock.adjust('3 minutes');

      const error = yield* Fiber.join(waiting);

      expect(error._tag).toBe('OrbitAuthError');

      expect(error.message).toContain('Login denied or timed out');
    }).pipe(Effect.scoped),
  );

  it.effect('closes the socket when its owning scope ends', () =>
    Effect.gen(function* () {
      const callback = yield* listenForLogin('secret').pipe(Effect.scoped);

      const http = yield* HttpClient.HttpClient;

      const error = yield* http.get(callback.redirectUri).pipe(Effect.flip);

      expect(error.reason._tag).toBe('TransportError');
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  );
});
