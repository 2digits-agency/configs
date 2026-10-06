import { describe, expect, it } from '@effect/vitest';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';

import { TloConfigFromEnv } from '../src/layers/TloConfigLive.js';

function loadConfig(baseUrl?: string) {
  return Effect.provide(
    TloConfigFromEnv,
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        TLO_SESSION_TOKEN: 'secret-token',
        ...(baseUrl === undefined ? {} : { TLO_BASE_URL: baseUrl }),
      }),
    ),
  );
}

describe('tlo base URL validation', () => {
  it.effect('keeps the default URL without an added trailing slash', () =>
    Effect.gen(function* () {
      const config = yield* loadConfig();

      expect(config.baseUrl).toBe('https://socialbrothers.orbit.teamleader.eu');
    }),
  );

  it.effect('uses the default when the provider treats an empty string as missing', () =>
    Effect.gen(function* () {
      const config = yield* loadConfig('');

      expect(config.baseUrl).toBe('https://socialbrothers.orbit.teamleader.eu');
    }),
  );

  for (const baseUrl of [
    'https://teamleader.test',
    'https://teamleader.test/',
    'http://localhost:8080/api',
    'https://teamleader.test/api/',
    'https://teamleader.test/api?tenant=example#section',
    'https://TEAMLEADER.test:443/api/../',
    ' https://teamleader.test/ ',
  ]) {
    it.effect(`preserves the configured URL ${baseUrl}`, () =>
      Effect.gen(function* () {
        const config = yield* loadConfig(baseUrl);

        expect(config.baseUrl).toBe(baseUrl);
      }),
    );
  }

  for (const baseUrl of ['not-a-url', '/api', 'https://']) {
    it.effect(`rejects invalid URL ${JSON.stringify(baseUrl)} instead of using the default`, () =>
      Effect.gen(function* () {
        const error = yield* Effect.flip(loadConfig(baseUrl));

        expect(error._tag).toBe('ConfigError');

        expect(error.message).toContain('TLO_BASE_URL');
      }),
    );
  }
});
