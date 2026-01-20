import * as HttpClient from '@effect/platform/HttpClient';
import * as HttpClientRequest from '@effect/platform/HttpClientRequest';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { TloConfig } from './TloConfig.js';

export interface TloHttpClientShape {
  readonly client: HttpClient.HttpClient;
}

export class TloHttpClient extends Context.Tag('@2digits/tlo-mcp/services/TloHttpClient')<
  TloHttpClient,
  TloHttpClientShape
>() {}

function formatCookies(cookies: ReadonlyMap<string, string>): string {
  return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
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
