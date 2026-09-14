import { describe, expect, it } from '@effect/vitest';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';
import * as Cookies from 'effect/unstable/http/Cookies';

import { TloConfigFromEnv } from '../src/layers/TloConfigLive.js';

function provideConfig(values: unknown) {
  return Effect.provide(TloConfigFromEnv, ConfigProvider.layer(ConfigProvider.fromUnknown(values)));
}

describe('tlo environment configuration', () => {
  it.effect('loads configured URL, token, and cookies', () =>
    Effect.gen(function* () {
      const config = yield* provideConfig({
        TLO_BASE_URL: 'https://teamleader.test',
        TLO_COOKIES: 'session=abc123; preference=compact',
        TLO_SESSION_TOKEN: 'secret-token',
      });

      expect(config.baseUrl).toBe('https://teamleader.test');
      expect(Cookies.toRecord(config.cookies)).toStrictEqual({ session: 'abc123', preference: 'compact' });
      expect(Redacted.value(config.sessionToken)).toBe('secret-token');
      expect(Redacted.isRedacted(config.sessionToken)).toBeTruthy();
    }),
  );

  it.effect('uses the default URL and empty cookies', () =>
    Effect.gen(function* () {
      const config = yield* provideConfig({ TLO_SESSION_TOKEN: 'secret-token' });

      expect(config.baseUrl).toBe('https://socialbrothers.orbit.teamleader.eu');
      expect(Cookies.toRecord(config.cookies)).toStrictEqual({});
    }),
  );

  it.effect('fails when the required session token is missing', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(provideConfig({}));

      expect(error.message).toContain('TLO_SESSION_TOKEN');
    }),
  );
});
