import { describe, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as P from 'effect/Predicate';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Cookies from 'effect/http/Cookies';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';

import { TeamLeaderClient, TeamLeaderClientLive } from '../src/services/TeamLeaderClient.js';
import { TloConfig } from '../src/services/TloConfig.js';
import { TloHttpClientLive } from '../src/services/TloHttpClient.js';

const ResponseSchema = Schema.Struct({ value: Schema.String });

const ENDPOINT = '/ajax/test';

type TestResponse = { readonly status: number; readonly body: string } | { readonly transportFailure: true };

function makeTestLayer(response: TestResponse) {
  const configLayer = Layer.succeed(
    TloConfig,
    TloConfig.of({
      baseUrl: 'https://teamleader.test',
      sessionToken: Redacted.make('secret'),
      cookies: Cookies.empty,
    }),
  );

  const httpClientLayer = Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make(
      Effect.fn('TeamLeaderClientAuthTest.request')(function* (request) {
        if ('transportFailure' in response) {
          return yield* new HttpClientError.HttpClientError({
            reason: new HttpClientError.TransportError({ request, description: 'Connection refused' }),
          });
        }

        return HttpClientResponse.fromWeb(request, new Response(response.body, { status: response.status }));
      }),
    ),
  );

  const tloHttpClientLayer = TloHttpClientLive.pipe(Layer.provide(httpClientLayer), Layer.provide(configLayer));

  return TeamLeaderClientLive.pipe(Layer.provide(tloHttpClientLayer), Layer.provide(configLayer));
}

describe('teamLeaderClient legacy authentication classification', () => {
  for (const body of ['{"MSG":"Session expired","err":1}', '<html>Unauthorized</html>']) {
    layer(makeTestLayer({ status: 401, body }))((it) => {
      it.effect(`classifies HTTP 401 as authentication failure before decoding ${body}`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloAuthError');
        }),
      );
    });
  }

  for (const status of [403, 500]) {
    layer(makeTestLayer({ status, body: '<html>Request rejected</html>' }))((it) => {
      it.effect(`preserves HTTP ${status} as a network failure`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloNetworkError');

          expect(error.message).toBe(`HTTP ${status}`);

          if (!P.isTagged(error, 'TloNetworkError')) {
            return;
          }

          expect(error.endpoint).toBe(ENDPOINT);

          expect(HttpClientError.isHttpClientError(error.cause)).toBeTruthy();
        }),
      );
    });
  }

  layer(makeTestLayer({ transportFailure: true }))((it) => {
    it.effect('preserves transport failures without a response as network failures', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloNetworkError');

        expect(error.message).toContain('Request failed: Transport: Connection refused');

        if (!P.isTagged(error, 'TloNetworkError')) {
          return;
        }

        expect(error.endpoint).toBe(ENDPOINT);

        expect(HttpClientError.isHttpClientError(error.cause)).toBeTruthy();
      }),
    );
  });

  for (const body of ['{"MSG":"Request rejected","err":1}', "{MSG:'Request rejected', err:1}"]) {
    layer(makeTestLayer({ status: 200, body }))((it) => {
      it.effect(`preserves API failures: ${body}`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloApiError');

          expect(error.message).toBe('Request rejected');
        }),
      );
    });
  }

  for (const body of ['not json', '{"value":123}']) {
    layer(makeTestLayer({ status: 200, body }))((it) => {
      it.effect(`preserves parse failures: ${body}`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloParseError');
        }),
      );
    });
  }

  layer(makeTestLayer({ status: 200, body: '{"value":"ok"}' }))((it) => {
    it.effect('preserves successful responses', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        expect(yield* client.post(ENDPOINT, {}, ResponseSchema)).toStrictEqual({ value: 'ok' });
      }),
    );
  });
});
