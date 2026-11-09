import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';
import * as Headers from 'effect/http/Headers';

describe('effect v4 endpoint header decoding', () => {
  it.effect('fails a required mixed-case key even when the header arrived', () =>
    Effect.gen(function* () {
      const endpoint = HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });

      const headers = endpoint.headers;

      expect(headers).toBeDefined();

      if (P.isUndefined(headers)) {
        return yield* Effect.die('Endpoint headers are missing');
      }

      // Rebuild the endpoint AST: this fixture contains only service-free string fields.
      const decoder = Schema.make<Schema.Codec<unknown, unknown>>(headers.ast);

      const result = yield* Effect.exit(Schema.decodeEffect(decoder)({ 'x-api-key': 'present' }));

      expect(Exit.isFailure(result)).toBeTruthy();
    }),
  );

  it.effect('decodes the same required header with a lowercase schema key', () =>
    Effect.gen(function* () {
      const endpoint = HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });

      const headers = endpoint.headers;

      expect(headers).toBeDefined();

      if (P.isUndefined(headers)) {
        return yield* Effect.die('Endpoint headers are missing');
      }

      // Rebuild the endpoint AST: this fixture contains only service-free string fields.
      const decoder = Schema.make<Schema.Codec<unknown, unknown>>(headers.ast);

      const result = yield* Schema.decodeEffect(decoder)({ 'x-api-key': 'present' });

      expect(result).toStrictEqual({ 'x-api-key': 'present' });
    }),
  );

  it('keeps header lookup case-insensitive', () => {
    const headers = Headers.fromInput({ 'X-Api-Key': 'present' });

    expect(Headers.get(headers, 'X-Api-Key')).toStrictEqual(Opt.some('present'));

    expect(Headers.has(headers, 'X-Api-Key')).toBeTruthy();
  });
});
