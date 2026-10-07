import { describe, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as P from 'effect/Predicate';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Cookies from 'effect/http/Cookies';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';

import { TeamLeaderClient, TeamLeaderClientLive } from '../src/services/TeamLeaderClient.js';
import { TloConfig } from '../src/services/TloConfig.js';
import { TloHttpClientLive } from '../src/services/TloHttpClient.js';

const ENDPOINT = '/ajax/test';

const ResponseSchema = Schema.Struct({ value: Schema.String });

function makeTestLayer(client: HttpClient.HttpClient) {
  const configLayer = Layer.succeed(
    TloConfig,
    TloConfig.of({
      baseUrl: 'https://teamleader.test',
      sessionToken: Redacted.make('secret'),
      cookies: Cookies.empty,
    }),
  );

  const httpClientLayer = Layer.succeed(HttpClient.HttpClient, client);

  const tloHttpClientLayer = TloHttpClientLive.pipe(Layer.provide(httpClientLayer), Layer.provide(configLayer));

  return TeamLeaderClientLive.pipe(Layer.provide(tloHttpClientLayer), Layer.provide(configLayer));
}

function makeResponseClient(body: string, status = 200) {
  return HttpClient.make((request) =>
    Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status }))),
  );
}

const transportError = new HttpClientError.HttpClientError({
  reason: new HttpClientError.TransportError({
    request: HttpClientRequest.post(`https://teamleader.test${ENDPOINT}`),
    cause: new Error('Connection refused'),
  }),
});

describe('teamLeaderClient error translation', () => {
  layer(makeTestLayer(makeResponseClient('{"value":123}')))((it) => {
    it.effect('preserves schema-decoding failures as parse errors with their cause', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloParseError');

        expect(error.message).toBe('Failed to parse response');

        if (P.isTagged(error, 'TloParseError')) {
          expect(Schema.isSchemaError(error.cause)).toBeTruthy();
        }
      }),
    );
  });

  layer(makeTestLayer(HttpClient.make(() => Effect.fail(transportError))))((it) => {
    it.effect('translates transport errors while retaining the original cause and endpoint', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloNetworkError');

        expect(error.message).toBe(`Request failed: ${transportError.message}`);

        if (!P.isTagged(error, 'TloNetworkError')) {
          return;
        }

        expect(error.cause).toBe(transportError);

        expect(error.endpoint).toBe(ENDPOINT);
      }),
    );
  });

  layer(makeTestLayer(makeResponseClient('Service unavailable', 503)))((it) => {
    it.effect('translates rejected HTTP statuses before attempting JSON decoding', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloNetworkError');

        expect(error.message).toBe('HTTP 503');

        if (!P.isTagged(error, 'TloNetworkError')) {
          return;
        }

        expect(error.endpoint).toBe(ENDPOINT);

        expect(HttpClientError.isHttpClientError(error.cause)).toBeTruthy();

        if (HttpClientError.isHttpClientError(error.cause)) {
          expect(error.cause.response?.status).toBe(503);
        }
      }),
    );
  });
});
