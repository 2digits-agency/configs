import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { HttpClient as BarrelClient } from 'effect/http';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientError from 'effect/http/HttpClientError';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import { describe, expect, it } from 'vite-plus/test';

describe.for(['pipeable', 'data-first'] as const)('effect 4.0.0 retryTransient (%s)', (arity) => {
  const retry: (
    client: HttpClient.HttpClient,
    options: { retryOn: 'response-only' | 'errors-only'; times: number; while: () => boolean },
  ) => HttpClient.HttpClient =
    arity === 'pipeable'
      ? (client, options) => client.pipe(BarrelClient.retryTransient<HttpClientError.HttpClientError>(options))
      : (client, options) => HttpClient.retryTransient(client, options);

  it('ignores while for responses but invokes it for a non-transient error', async () => {
    expect(BarrelClient.retryTransient).toBe(HttpClient.retryTransient);
    let attempts = 0;
    let whileCalls = 0;
    const base = HttpClient.make((request) => {
      attempts++;

      return Effect.succeed(HttpClientResponse.fromWeb(request, new Response('', { status: 503 })));
    });
    const responseOptions = {
      retryOn: 'response-only' as const,
      times: 2,
      while() {
        whileCalls++;

        return false;
      },
    };
    const responses = retry(base, responseOptions);
    const response = await Effect.runPromise(responses.get('https://audit.invalid'));

    expect(response.status).toBe(503);
    expect({ attempts, whileCalls }).toStrictEqual({ attempts: 3, whileCalls: 0 });

    let errorAttempts = 0;
    let errorWhileCalls = 0;
    const errors = HttpClient.make((request) => {
      errorAttempts++;

      return Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.InvalidUrlError({ request, cause: 'invalid' }),
        }),
      );
    });
    const errorOptions = {
      retryOn: 'errors-only' as const,
      times: 2,
      while: () => {
        errorWhileCalls++;

        return false;
      },
    };
    const retriedErrors = retry(errors, errorOptions);
    const exit = await Effect.runPromiseExit(retriedErrors.get('https://audit.invalid'));

    expect(Exit.isFailure(exit)).toBeTruthy();
    expect({ errorAttempts, errorWhileCalls }).toStrictEqual({ errorAttempts: 1, errorWhileCalls: 1 });
  });
});
