import { describe, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Cookies from 'effect/unstable/http/Cookies';
import * as HttpClient from 'effect/unstable/http/HttpClient';
import * as HttpClientResponse from 'effect/unstable/http/HttpClientResponse';

import { TeamLeaderClient, TeamLeaderClientLive } from '../src/services/TeamLeaderClient.js';
import { TloConfig } from '../src/services/TloConfig.js';
import { TloHttpClientLive } from '../src/services/TloHttpClient.js';

const ResponseSchema = Schema.Struct({ value: Schema.String });
const ENDPOINT = '/ajax/test';

function makeTestLayer(body: string) {
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
      Effect.fn('TeamLeaderClientTest.request')(function* (request) {
        return yield* Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status: 200 })));
      }),
    ),
  );
  const tloHttpClientLayer = TloHttpClientLive.pipe(Layer.provide(httpClientLayer), Layer.provide(configLayer));

  return TeamLeaderClientLive.pipe(Layer.provide(tloHttpClientLayer), Layer.provide(configLayer));
}

describe(TeamLeaderClient, () => {
  layer(makeTestLayer('{"value":"ok"}'))((it) => {
    it.effect('decodes successful JSON responses', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;
        const response = yield* client.post(ENDPOINT, {}, ResponseSchema);

        expect(response).toStrictEqual({ value: 'ok' });
      }),
    );
  });

  layer(makeTestLayer('{"MSG":"Request rejected","err":1}'))((it) => {
    it.effect('returns typed API errors from JSON responses', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;
        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));
        const endpoint = Match.value(error).pipe(
          Match.tag('TloApiError', (error) => error.endpoint),
          Match.orElse(() => undefined),
        );

        expect(error._tag).toBe('TloApiError');
        expect(error.message).toBe('Request rejected');
        expect(endpoint).toBe(ENDPOINT);
      }),
    );
  });

  layer(makeTestLayer("{MSG:'Malformed rejection', err:1}"))((it) => {
    it.effect('returns typed API errors from malformed Teamleader responses', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;
        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloApiError');
        expect(error.message).toBe('Malformed rejection');
      }),
    );
  });

  layer(makeTestLayer('not json'))((it) => {
    it.effect('returns typed parse errors for invalid JSON', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;
        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloParseError');
        expect(error.message).toBe('Invalid JSON response');
      }),
    );
  });
});
