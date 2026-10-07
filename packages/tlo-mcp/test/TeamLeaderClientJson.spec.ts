import { describe, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Cookies from 'effect/http/Cookies';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';

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
    HttpClient.make((request) =>
      Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status: 200 }))),
    ),
  );

  const tloHttpClientLayer = TloHttpClientLive.pipe(Layer.provide(httpClientLayer), Layer.provide(configLayer));

  return TeamLeaderClientLive.pipe(Layer.provide(tloHttpClientLayer), Layer.provide(configLayer));
}

describe('teamLeaderClient JSON-first decoding', () => {
  const value = "{MSG:'Not an API error', err:1}";

  layer(makeTestLayer(JSON.stringify({ value })))((it) => {
    it.effect('preserves legacy-looking strings in valid JSON', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const response = yield* client.post(ENDPOINT, {}, ResponseSchema);

        expect(response).toStrictEqual({ value });
      }),
    );
  });

  layer(makeTestLayer(" \n{MSG:'Legacy rejection', err:1}\n "))((it) => {
    it.effect('accepts a complete legacy envelope with surrounding whitespace', () =>
      Effect.gen(function* () {
        const client = yield* TeamLeaderClient;

        const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

        expect(error._tag).toBe('TloApiError');

        expect(error).toMatchObject({ message: 'Legacy rejection', endpoint: ENDPOINT });
      }),
    );
  });

  for (const body of ["prefix {MSG:'Legacy rejection', err:1}", "{MSG:'Legacy rejection', err:1} suffix", 'not json']) {
    layer(makeTestLayer(body))((it) => {
      it.effect(`rejects invalid JSON without a complete legacy envelope: ${body}`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloParseError');

          expect(error.message).toBe('Invalid JSON response');
        }),
      );
    });
  }

  for (const body of [JSON.stringify({ value: 42, note: value }), "{MSG:'No error', err:0}"]) {
    layer(makeTestLayer(body))((it) => {
      it.effect(`keeps response schema validation separate from body decoding: ${body}`, () =>
        Effect.gen(function* () {
          const client = yield* TeamLeaderClient;

          const error = yield* Effect.flip(client.post(ENDPOINT, {}, ResponseSchema));

          expect(error._tag).toBe('TloParseError');

          expect(error.message).toBe('Failed to parse response');
        }),
      );
    });
  }
});
