// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from 'node:http';

import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as Arr from 'effect/Array';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Result from 'effect/Result';
import * as Str from 'effect/String';
import * as Mac from 'effect/crypto/Mac';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServer from 'effect/http/HttpServer';
import * as HttpServerRequest from 'effect/http/HttpServerRequest';
import * as HttpServerResponse from 'effect/http/HttpServerResponse';
import * as Url from 'effect/http/Url';

import { OrbitAuthError } from './session.js';

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

function soleParameter(url: URL, name: string): Opt.Option<string> {
  return Arr.matchLeft(url.searchParams.getAll(name), {
    onEmpty: Opt.none,
    onNonEmpty: (value, rest) => (Arr.isArrayEmpty(rest) ? Opt.some(value) : Opt.none()),
  });
}

/**
 * Reject unsolicited callbacks without consuming the legitimate login attempt.
 *
 * @param url
 * @param state
 */
export function validateCallback(url: URL, state: string): Result.Result<Opt.Option<string>, OrbitAuthError> {
  const encoder = new TextEncoder();

  const solicited =
    url.pathname === '/callback' &&
    Opt.exists(soleParameter(url, 'state'), (received) =>
      Mac.timingSafeEqual(encoder.encode(state), encoder.encode(received)),
    );

  if (!solicited) {
    return Result.succeed(Opt.none());
  }

  if (url.searchParams.has('error')) {
    return Result.fail(OrbitAuthError.make({ message: 'Orbit authorization was denied.' }));
  }

  return Result.succeed(Opt.filter(soleParameter(url, 'code'), Str.isNonEmpty));
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

  const handler = Effect.fn('OrbitAuth.handleCallback')(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;

    if (request.method !== 'GET' || request.headers.host !== host || (yield* Deferred.isDone(result))) {
      return invalid;
    }

    const callback = Result.match(Url.fromString(request.url, redirectUri), {
      onFailure: () => Result.succeed(Opt.none<string>()),
      onSuccess: (url) => validateCallback(url, state),
    });

    return yield* Result.match(callback, {
      onFailure: (error) => Deferred.fail(result, error).pipe(Effect.map((first) => (first ? denied : invalid))),
      onSuccess: Opt.match({
        onNone: () => Effect.succeed(invalid),
        onSome: (code) => Deferred.succeed(result, code).pipe(Effect.map((first) => (first ? accepted : invalid))),
      }),
    });
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
