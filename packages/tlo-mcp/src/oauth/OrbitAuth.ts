/**
 * @effect-diagnostics unstableApiUsage:off
 */
import { OAuth, Pkce } from '@yielded/oauth';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Crypto from 'effect/Crypto';
import * as Effect from 'effect/Effect';
import * as Eq from 'effect/Equal';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import { FetchHttpClient, HttpClient, HttpClientRequest } from 'effect/http';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';

import { listenForLogin } from './callback.js';
import {
  authentication,
  needsRefresh,
  ORBIT_ORIGIN,
  ORBIT_RESOURCE,
  OrbitAuthError,
  updateSession,
} from './session.js';
import { SessionStore, SessionStoreLive } from './store.js';

const Registration = Schema.Struct({
  client_id: Schema.String.check(Schema.isMinLength(1)),
  client_secret: Schema.String.check(Schema.isMinLength(1)).pipe(Schema.RedactedFromValue, Schema.optionalKey),
});

export interface OrbitAuthShape {
  readonly login: Effect.Effect<void, OrbitAuthError>;
  readonly logout: Effect.Effect<void, OrbitAuthError>;
  readonly accessToken: Effect.Effect<Redacted.Redacted, OrbitAuthError>;
}

export class OrbitAuth extends Context.Service<OrbitAuth, OrbitAuthShape>()('@2digits/tlo-mcp/oauth/OrbitAuth') {}

export const OrbitAuthLayer = Layer.effect(
  OrbitAuth,
  Effect.gen(function* () {
    const store = yield* SessionStore;

    const crypto = yield* Crypto.Crypto;

    const http = yield* HttpClient.HttpClient;

    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    const semaphore = yield* Semaphore.make(1);

    const discoverEndpoints = Effect.fn('OrbitAuth.discover')(
      function* () {
        const response = yield* HttpClient.withScope(http).get(
          `${ORBIT_ORIGIN}/.well-known/oauth-authorization-server`,
        );

        if (response.status !== 200) {
          return yield* OrbitAuthError.make({ message: 'Could not discover Orbit OAuth endpoints.' });
        }

        const metadata = yield* response.json.pipe(Effect.flatMap(Schema.decodeUnknownEffect(OAuth.Metadata)));

        if (
          metadata.issuer !== ORBIT_ORIGIN ||
          metadata.authorization_endpoint !== `${ORBIT_ORIGIN}/oauth2/Authorize` ||
          metadata.token_endpoint !== `${ORBIT_ORIGIN}/oauth2/access_token`
        ) {
          return yield* OrbitAuthError.make({ message: 'Unexpected Orbit endpoints; refusing to send credentials.' });
        }

        return metadata;
      },
      Effect.scoped,
      Effect.timeout('15 seconds'),
      Effect.mapError(() => OrbitAuthError.make({ message: 'Invalid or unavailable Orbit OAuth metadata.' })),
    );

    const discover = yield* discoverEndpoints().pipe(
      Effect.cachedWithTTL((exit) => (Exit.isSuccess(exit) ? Infinity : 0)),
    );

    const accessToken = Effect.fn('OrbitAuth.accessToken')(function* () {
      const session = yield* store.load;

      if (session === undefined) {
        return yield* OrbitAuthError.make({ message: 'Not authenticated. Run tlo-mcp login first.' });
      }

      const now = yield* Clock.currentTimeMillis;

      if (!needsRefresh(session, now)) {
        return session.accessToken;
      }

      if (session.refreshToken === undefined) {
        if (session.expiresAt === undefined) {
          return session.accessToken;
        }

        return yield* OrbitAuthError.make({
          message: 'Orbit session expired without a refresh token. Run tlo-mcp login.',
        });
      }

      const metadata = yield* discover;

      const client = yield* OAuth.make({
        metadata,
        clientId: session.clientId,
        authentication: authentication(session),
        timeoutMs: 15_000,
      });

      const tokens = yield* client
        .refreshGrant({ refreshToken: session.refreshToken, resources: [ORBIT_RESOURCE] })
        .pipe(Effect.flatMap(OAuth.tokens));

      const updated = updateSession(session, tokens, yield* Clock.currentTimeMillis);

      yield* store.save(updated);

      return updated.accessToken;
    });

    const register = Effect.fn('OrbitAuth.register')(
      function* (redirectUri: string) {
        const response = yield* HttpClientRequest.post(`${ORBIT_ORIGIN}/oauth2/register`).pipe(
          HttpClientRequest.bodyJson({
            client_name: '@2digits/tlo-mcp',
            redirect_uris: [redirectUri],
            response_types: ['code'],
            grant_types: ['authorization_code', 'refresh_token'],
            token_endpoint_auth_method: 'none',
          }),
          Effect.flatMap(HttpClient.withScope(http).execute),
        );

        if (response.status !== 200 && response.status !== 201) {
          return yield* OrbitAuthError.make({ message: `Orbit client registration failed (HTTP ${response.status}).` });
        }

        return yield* response.json.pipe(Effect.flatMap(Schema.decodeUnknownEffect(Registration)));
      },
      Effect.scoped,
      Effect.timeout('15 seconds'),
    );

    const openBrowser = Effect.fn('OrbitAuth.openBrowser')(
      function* (url: Redacted.Redacted) {
        const browser = yield* Match.value(process.platform).pipe(
          Match.when(
            'darwin',
            () =>
              ChildProcess.make({
                stdout: 'ignore',
                stderr: 'ignore',
                forceKillAfter: '1 second',
              })`open ${Redacted.value(url)}`,
          ),
          Match.when(
            'win32',
            () =>
              ChildProcess.make({
                stdout: 'ignore',
                stderr: 'ignore',
                forceKillAfter: '1 second',
              })`rundll32 url.dll,FileProtocolHandler ${Redacted.value(url)}`,
          ),
          Match.orElse(
            () =>
              ChildProcess.make({
                stdout: 'ignore',
                stderr: 'ignore',
                forceKillAfter: '1 second',
              })`xdg-open ${Redacted.value(url)}`,
          ),
        );

        return yield* browser.exitCode;
      },
      Effect.scoped,
      Effect.timeout('5 seconds'),
      Effect.filterOrFail(Eq.equals(ChildProcessSpawner.ExitCode(0)), () =>
        OrbitAuthError.make({ message: 'Could not open browser.' }),
      ),
      (effect, url) =>
        effect.pipe(
          Effect.catch(() =>
            Effect.sync(() => {
              process.stderr.write(`Open this URL in your browser:\n${Redacted.value(url)}\n`);
            }),
          ),
        ),
    );

    const login = Effect.fn('OrbitAuth.login')(function* () {
      const metadata = yield* discover;

      const state = yield* Pkce.random();

      const pkce = yield* Pkce.make();

      const callback = yield* state.pipe(Redacted.value, listenForLogin);

      const registration = yield* register(callback.redirectUri);

      const identity = {
        clientId: registration.client_id,
        ...(registration.client_secret === undefined ? {} : { clientSecret: registration.client_secret }),
      };

      const client = yield* OAuth.make({
        metadata,
        ...identity,
        authentication: authentication(identity),
        timeoutMs: 15_000,
      });

      const url = yield* client.authorizationUrl({
        redirectUri: callback.redirectUri,
        scopes: [],
        state,
        codeChallenge: pkce.challenge,
        resources: [ORBIT_RESOURCE],
      });

      yield* openBrowser(url);

      const code = yield* callback.code;

      const tokens = yield* client
        .codeGrant({
          code: Redacted.make(code),
          redirectUri: callback.redirectUri,
          pkceVerifier: pkce.verifier,
          resources: [ORBIT_RESOURCE],
        })
        .pipe(Effect.flatMap(OAuth.tokens));

      yield* store.save(updateSession(identity, tokens, yield* Clock.currentTimeMillis));

      yield* Effect.sync(() => {
        process.stderr.write('Orbit login complete.\n');
      });
    });

    const locked = Effect.fn('OrbitAuth.locked')(
      function* <T, E, R>(operation: Effect.Effect<T, E, R>) {
        yield* store.lock;

        return yield* operation;
      },
      Effect.scoped,
      semaphore.withPermit,
      Effect.provideService(HttpClient.HttpClient, http),
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.provideService(ChildProcessSpawner.ChildProcessSpawner, spawner),
      Effect.provideService(FetchHttpClient.RequestInit, { redirect: 'error' }),
      Effect.mapError((error) =>
        Schema.is(OrbitAuthError)(error)
          ? error
          : OrbitAuthError.make({
              message: 'Orbit authentication unavailable. Check connectivity or run tlo-mcp login again.',
            }),
      ),
    );

    return OrbitAuth.of({ accessToken: locked(accessToken()), login: locked(login()), logout: locked(store.clear) });
  }),
);

export const OrbitAuthLive = OrbitAuthLayer.pipe(Layer.provide(SessionStoreLive), Layer.provide(FetchHttpClient.layer));
