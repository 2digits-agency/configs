import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Cookies from 'effect/unstable/http/Cookies';
import * as HttpClient from 'effect/unstable/http/HttpClient';
import * as HttpClientRequest from 'effect/unstable/http/HttpClientRequest';

import { TloConfig } from './TloConfig.js';

interface TloHttpClientShape {
  readonly client: HttpClient.HttpClient;
}

export class TloHttpClient extends Context.Service<TloHttpClient, TloHttpClientShape>()(
  '@2digits/tlo-mcp/services/TloHttpClient',
) {}

export const TloHttpClientLive = Layer.effect(
  TloHttpClient,
  Effect.gen(function* () {
    const config = yield* TloConfig;
    const baseClient = yield* HttpClient.HttpClient;
    const cookieHeader = Cookies.toCookieHeader(config.cookies);

    const client = baseClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(config.baseUrl)),
      HttpClient.mapRequest(HttpClientRequest.setHeader('Cookie', cookieHeader)),
      HttpClient.filterStatusOk,
    );

    return TloHttpClient.of({ client });
  }),
);
