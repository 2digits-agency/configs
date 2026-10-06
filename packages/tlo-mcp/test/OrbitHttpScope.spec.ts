import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Redacted from 'effect/Redacted';
import { FetchHttpClient } from 'effect/http';
import * as TestClock from 'effect/testing/TestClock';

import { OrbitClient, OrbitClientLive } from '../src/mcp/OrbitClient.js';
import { OrbitAuth } from '../src/oauth/OrbitAuth.js';

const auth = Layer.succeed(
  OrbitAuth,
  OrbitAuth.of({ accessToken: Effect.succeed(Redacted.make('test-token')), login: Effect.void, logout: Effect.void }),
);

describe('orbit HTTP request scopes', () => {
  it.effect('closes every request before the next one, including unread notification bodies', () => {
    const signals: Array<AbortSignal> = [];

    const fetchMock: typeof globalThis.fetch = (_input, init) => {
      expect(signals.every((signal) => signal.aborted)).toBeTruthy();

      if (init?.signal) {
        expect(init.signal.aborted).toBeFalsy();

        signals.push(init.signal);
      }

      const id = signals.length;

      if (id === 2) {
        return Promise.resolve(new Response('unread notification body', { status: 202 }));
      }

      const result = Match.value(id).pipe(
        Match.when(1, () => ({
          protocolVersion: '2025-06-18',
          capabilities: {},
          serverInfo: { name: 'Orbit', version: '1' },
          instructions: 'Keep official instructions',
        })),
        Match.when(3, () => ({ tools: [] })),
        Match.orElse(() => ({ content: [{ type: 'text', text: 'original result' }], isError: true })),
      );

      return Promise.resolve(Response.json({ jsonrpc: '2.0', id, result }));
    };

    return Effect.gen(function* () {
      const client = yield* OrbitClient;

      expect({
        instructions: client.instructions,
        requests: signals.length,
        closed: signals.every((s) => s.aborted),
      }).toStrictEqual({ instructions: 'Keep official instructions', requests: 3, closed: true });

      const result = yield* client.callTool('WriteProject', {});

      expect(result).toMatchObject({ content: [{ type: 'text', text: 'original result' }], isError: true });

      expect(signals).toHaveLength(4);

      expect(signals.every((signal) => signal.aborted)).toBeTruthy();
    }).pipe(
      Effect.provide(OrbitClientLive.pipe(Layer.provide(auth))),
      Effect.provideService(FetchHttpClient.Fetch, fetchMock),
      Effect.scoped,
    );
  });

  for (const { status, message } of [
    { status: 401, message: 'authorization rejected' },
    { status: 403, message: 'authorization rejected' },
    { status: 429, message: 'Retry after 17' },
    { status: 500, message: 'Orbit HTTP 500' },
    { status: 307, message: 'Orbit HTTP 307' },
  ]) {
    it.effect(`closes HTTP ${status} without consuming its body or replaying`, () => {
      const signals: Array<AbortSignal> = [];

      let bodyReads = 0;

      const fetchMock: typeof globalThis.fetch = (_input, init) => {
        if (init?.signal) {
          signals.push(init.signal);
        }

        const response = new Response('unread error body', {
          status,
          headers: { 'retry-after': '17' },
        });

        response.json = () => {
          bodyReads++;

          return Promise.reject(new Error('error body must not be consumed'));
        };

        return Promise.resolve(response);
      };

      return Effect.gen(function* () {
        const error = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(auth))).pipe(Effect.flip);

        expect(error.message).toContain(message);

        expect(bodyReads).toBe(0);

        expect(signals).toHaveLength(1);

        expect(signals.every((signal) => signal.aborted)).toBeTruthy();
      }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetchMock), Effect.scoped);
    });
  }

  it.effect('closes a response when JSON decoding fails without replaying', () => {
    const signals: Array<AbortSignal> = [];

    const fetchMock: typeof globalThis.fetch = (_input, init) => {
      if (init?.signal) {
        signals.push(init.signal);
      }

      return Promise.resolve(new Response('{malformed JSON', { headers: { 'content-type': 'application/json' } }));
    };

    return Effect.gen(function* () {
      const error = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(auth))).pipe(Effect.flip);

      expect(error.message).toBe('Orbit connection or response failed. Request not replayed.');

      expect(signals).toHaveLength(1);

      expect(signals.every((signal) => signal.aborted)).toBeTruthy();
    }).pipe(Effect.provideService(FetchHttpClient.Fetch, fetchMock), Effect.scoped);
  });

  for (const completion of ['interruption', 'timeout']) {
    it.effect(`aborts an in-flight request on ${completion} without replaying`, () =>
      Effect.gen(function* () {
        const started = yield* Deferred.make<AbortSignal>();

        const services = yield* Effect.context();

        let requests = 0;

        const fetchMock: typeof globalThis.fetch = (_input, init) => {
          requests++;

          return Effect.runPromiseWith(services)(
            Effect.gen(function* () {
              if (init?.signal) {
                yield* Deferred.succeed(started, init.signal);
              }

              return yield* Effect.never;
            }),
            { signal: init?.signal ?? undefined },
          );
        };

        const fiber = yield* Layer.build(OrbitClientLive.pipe(Layer.provide(auth))).pipe(
          Effect.provideService(FetchHttpClient.Fetch, fetchMock),
          Effect.scoped,
          Effect.forkChild,
        );

        const signal = yield* Deferred.await(started);

        expect(signal.aborted).toBeFalsy();

        if (completion === 'interruption') {
          yield* Fiber.interrupt(fiber);
        } else {
          yield* TestClock.adjust('120 seconds');

          const error = yield* Fiber.join(fiber).pipe(Effect.flip);

          expect(error.message).toBe('Orbit connection or response failed. Request not replayed.');
        }

        expect(signal.aborted).toBeTruthy();

        expect(requests).toBe(1);
      }),
    );
  }
});
