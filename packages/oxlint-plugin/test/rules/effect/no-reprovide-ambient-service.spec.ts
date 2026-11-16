import { describe, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules } from '../../../src';

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

const imports = `
  import { Effect } from 'effect'
  import * as HttpClient from 'effect/unstable/http/HttpClient'
`;

const error = { messageId: 'reprovideAmbientService', data: { service: 'HttpClient.HttpClient' } };

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'no-reprovide-ambient-service',
  rules['no-reprovide-ambient-service'],
  {
    valid: Arr.map(
      [
        `${imports}
        Effect.gen(function* () {
          yield* HttpClient.HttpClient
        })`,
        // A different service than the one yielded.
        `${imports}
        Effect.gen(function* () {
          const first = yield* FirstService
          return request.pipe(Effect.provideService(SecondService, first), Effect.provideService(request, Other, first))
        })`,
        // A genuinely different implementation built from the ambient one.
        `${imports}
        Effect.gen(function* () {
          const baseClient = yield* HttpClient.HttpClient
          const tenantClient = configureForTenant(baseClient)
          return request.pipe(Effect.provideService(HttpClient.HttpClient, tenantClient))
        })`,
        // The binding no longer holds the yielded service.
        `${imports}
        Effect.gen(function* () {
          let httpClient = yield* HttpClient.HttpClient
          httpClient = configureForTenant(httpClient)
          return request.pipe(Effect.provideService(HttpClient.HttpClient, httpClient))
        })`,
        // The provided value is a parameter that shadows the yielded binding.
        `${imports}
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return (httpClient: HttpClient.HttpClient) => Effect.provideService(request, HttpClient.HttpClient, httpClient)
        })`,
        `${imports}
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return Effect.provideService(HttpClient.HttpClient)(tenantClient)
        })`,
        // Service methods run after the layer is built: providing the captured service keeps their R channel empty.
        `${imports}
        const ServiceLive = Layer.effect(Service, Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          const locked = Effect.fn('Service.locked')(
            function* <A, E, R>(operation: Effect.Effect<A, E, R>) {
              return yield* operation
            },
            Effect.provideService(HttpClient.HttpClient, httpClient),
          )
          return Service.of({
            execute: () => request.pipe(Effect.provideService(HttpClient.HttpClient, httpClient)),
            locked: locked(request),
          })
        }))`,
        // Not Effect's Effect.
        `
        import { Effect } from 'other-library'
        Effect.gen(function* () {
          const service = yield* Service
          return request.pipe(Effect.provideService(Service, service))
        })`,
      ],
      (code) => ({ code, filename: 'valid.ts' }),
    ),
    invalid: Arr.map(
      [
        `${imports}
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return yield* request.pipe(Effect.provideService(HttpClient.HttpClient, httpClient))
        })`,
        `
        import * as Fx from 'effect/Effect'
        import * as HttpClient from 'effect/unstable/http/HttpClient'
        Fx.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return request.pipe(Fx.provideService(HttpClient.HttpClient, httpClient))
        })`,
        `${imports}
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return Effect.provideService(request, HttpClient.HttpClient, httpClient as HttpClient.HttpClient)
        })`,
        // Effect v4's curried form.
        `${imports}
        Effect.gen(function* () {
          const httpClient = yield* HttpClient.HttpClient
          return request.pipe(Effect.provideService(HttpClient.HttpClient)(httpClient))
        })`,
        `${imports}
        Effect.gen(function* () {
          let httpClient = yield* Effect.service(HttpClient.HttpClient)
          return Effect.provideService(HttpClient.HttpClient)(request, httpClient)
        })`,
      ],
      (code) => ({ code, filename: 'invalid.ts', errors: [error] }),
    ),
  },
);
