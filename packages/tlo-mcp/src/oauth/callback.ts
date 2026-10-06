// Native boundaries: Effect Crypto has no constant-time equality; NodeHttpServer requires a server factory.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { timingSafeEqual } from 'node:crypto';
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from 'node:http';

import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from 'effect/http';

import { OrbitAuthError } from './session.js';

/**
 * Reject unsolicited callbacks without consuming the legitimate login attempt.
 *
 * @param url
 * @param state
 */
export function validateCallback(url: URL, state: string): string | undefined {
  const received = url.searchParams.get('state');

  if (received === null || url.pathname !== '/callback' || url.searchParams.getAll('state').length !== 1) {
    return undefined;
  }

  const expectedBytes = Buffer.from(state);

  const receivedBytes = Buffer.from(received);

  if (expectedBytes.length !== receivedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes)) {
    return undefined;
  }

  if (url.searchParams.has('error')) {
    throw new Error('Orbit authorization was denied.');
  }

  const code = url.searchParams.get('code');

  if (code === null || code.length === 0 || url.searchParams.getAll('code').length !== 1) {
    return undefined;
  }

  return code;
}

export const listenForLogin = Effect.fn('OrbitAuth.listenForLogin')(function* (state: string) {
  const result = yield* Deferred.make<string, OrbitAuthError>();

  const nativeServer = yield* Effect.sync(createServer);

  const server = yield* NodeHttpServer.make(() => nativeServer, { port: 0, host: '127.0.0.1' }).pipe(
    Effect.mapError(() => OrbitAuthError.make({ message: 'Could not bind OAuth callback.' })),
  );

  if (!P.isTagged(server.address, 'InetAddressV4')) {
    return yield* OrbitAuthError.make({ message: 'Could not bind OAuth callback.' });
  }

  const host = `127.0.0.1:${server.address.port}`;

  const redirectUri = `http://${host}/callback`;

  const headers = {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'",
  };

  const invalid = HttpServerResponse.text('Invalid callback.', { status: 400, headers });

  const accepted = HttpServerResponse.text('Authorization received. Return to your terminal to complete login.', {
    headers,
  });

  const denied = HttpServerResponse.text('Authorization denied. Return to your terminal.', { status: 400, headers });

  const handler = Effect.fn('OrbitAuth.handleCallback')(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;

    if (request.method !== 'GET' || request.headers.host !== host || (yield* Deferred.isDone(result))) {
      return invalid;
    }

    return yield* Effect.try({
      try: () => validateCallback(new URL(request.url, redirectUri), state),
      catch: () => OrbitAuthError.make({ message: 'Orbit authorization was denied.' }),
    }).pipe(
      Effect.matchEffect({
        onFailure: (error) => Deferred.fail(result, error).pipe(Effect.map((first) => (first ? denied : invalid))),
        onSuccess: (code) =>
          code === undefined
            ? Effect.succeed(invalid)
            : Deferred.succeed(result, code).pipe(Effect.map((first) => (first ? accepted : invalid))),
      }),
    );
  });

  // Route every request through validation so invalid paths/methods retain safe 400 responses.
  const app = yield* HttpRouter.toHttpEffect(HttpRouter.add('*', '*', handler()));

  yield* HttpServer.serveEffect(app).pipe(Effect.provideService(HttpServer.HttpServer, server));

  // OAuth owns a short-lived listener, not a gracefully draining application server.
  yield* Effect.addFinalizer(() => Effect.sync(() => nativeServer.closeAllConnections()));

  return {
    redirectUri,
    code: Deferred.await(result).pipe(
      Effect.timeout('3 minutes'),
      Effect.mapError(() => OrbitAuthError.make({ message: 'Login denied or timed out. Run tlo-mcp login again.' })),
    ),
  };
});
