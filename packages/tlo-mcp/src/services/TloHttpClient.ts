import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as HttpClient from 'effect/unstable/http/HttpClient';
import * as HttpClientRequest from 'effect/unstable/http/HttpClientRequest';

import { TloConfig } from './TloConfig.js';

interface TloHttpClientShape {
  readonly client: HttpClient.HttpClient;
}

export class TloHttpClient extends Context.Service<TloHttpClient, TloHttpClientShape>()(
  '@2digits/tlo-mcp/services/TloHttpClient',
) {}

function formatCookies(cookies: ReadonlyMap<string, string>): string {
  return cookies
    .entries()
    .map(([key, value]) => `${key}=${value}`)
    .toArray()
    .join('; ');
}

export const TloHttpClientLive = Layer.effect(
  TloHttpClient,
  Effect.gen(function* () {
    const config = yield* TloConfig;
    const baseClient = yield* HttpClient.HttpClient;

    const client = baseClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(config.baseUrl)),
      HttpClient.mapRequest((req) => req.pipe(HttpClientRequest.setHeader('Cookie', formatCookies(config.cookies)))),
      HttpClient.filterStatusOk,
    );

    return TloHttpClient.of({ client });
  }),
);
