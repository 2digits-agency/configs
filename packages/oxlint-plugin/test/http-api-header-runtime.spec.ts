import * as Effect from 'effect-httpapi-rc/Effect';
import * as Exit from 'effect-httpapi-rc/Exit';
import * as Schema from 'effect-httpapi-rc/Schema';
import * as HttpApiEndpoint from 'effect-httpapi-rc/unstable/httpapi/HttpApiEndpoint';
import { describe, expect, it } from 'vite-plus/test';

// The test-only alias pins the independently reproduced v4 API to Effect 4.0.0-rc.117.
describe('effect v4 endpoint header decoding (rc.117)', () => {
  it('fails a required mixed-case key even when the header arrived', () => {
    const endpoint = HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });

    // Endpoint erases decoder services; these literal field schemas need none.
    const headers = endpoint.headers as unknown as Schema.ConstraintDecoder<unknown>;

    const result = Effect.runSyncExit(Schema.decodeUnknownEffect(headers)({ 'x-api-key': 'present' }));

    expect(result._tag).toBe('Failure');
  });

  it('decodes the same required header with a lowercase schema key', () => {
    const endpoint = HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });

    const headers = endpoint.headers as unknown as Schema.ConstraintDecoder<unknown>;

    const result = Effect.runSyncExit(Schema.decodeUnknownEffect(headers)({ 'x-api-key': 'present' }));

    expect(result).toStrictEqual(Exit.succeed({ 'x-api-key': 'present' }));
  });

  it('keeps native header lookup case-insensitive', () => {
    const headers = new Headers({ 'X-Api-Key': 'present' });

    expect(headers.get('X-Api-Key')).toBe('present');

    expect(headers.has('X-Api-Key')).toBeTruthy();
  });
});
