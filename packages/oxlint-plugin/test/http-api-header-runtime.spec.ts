import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Schema from 'effect/Schema';
import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint';

const headerDecoder = Effect.fn('HttpApiHeaderRuntime.headerDecoder')(function* (headers: Schema.Top | undefined) {
  if (headers === undefined) {
    return yield* Effect.die('Endpoint headers are missing');
  }

  // Rebuild the endpoint AST: these fixtures contain only service-free string fields.
  return Schema.decodeEffect(Schema.make<Schema.Codec<unknown, unknown>>(headers.ast));
});

describe('effect v4 endpoint header decoding', () => {
  it.effect('fails a required mixed-case key even when the header arrived', () =>
    Effect.gen(function* () {
      const { headers } = HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });

      expect(headers).toBeDefined();

      const decode = yield* headerDecoder(headers);

      const result = yield* Effect.exit(decode({ 'x-api-key': 'present' }));

      expect(Exit.isFailure(result)).toBeTruthy();
    }),
  );

  it.effect('decodes the same required header with a lowercase schema key', () =>
    Effect.gen(function* () {
      const { headers } = HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });

      expect(headers).toBeDefined();

      const decode = yield* headerDecoder(headers);

      const result = yield* decode({ 'x-api-key': 'present' });

      expect(result).toStrictEqual({ 'x-api-key': 'present' });
    }),
  );

  it('keeps native header lookup case-insensitive', () => {
    const headers = new Headers({ 'X-Api-Key': 'present' });

    expect(headers.get('X-Api-Key')).toBe('present');

    expect(headers.has('X-Api-Key')).toBeTruthy();
  });
});
