/* oxlint-disable unicorn/no-null -- A null sentinel is an intentional Effect Config value. */
import type * as Config from 'effect/Config';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { broadDefault, corrected, sentinel, typo, widened } from './fixtures/config-default-outside-literals/demo';

describe('independent Effect v4 type/runtime control', () => {
  it('infers widening without type errors', () => {
    expectTypeOf(typo).toEqualTypeOf<Config.Config<'debug' | 'info' | 'inof'>>();
    expectTypeOf(corrected).toEqualTypeOf<Config.Config<'debug' | 'info'>>();
    expectTypeOf(sentinel).toEqualTypeOf<Config.Config<'debug' | 'info' | null>>();
    expectTypeOf(broadDefault).toEqualTypeOf<Config.Config<string>>();
  });

  it('returns the unvalidated default on absent input', () => {
    const absent = ConfigProvider.fromUnknown({});

    expect(Effect.runSync(typo.parse(absent))).toBe('inof');
    expect(Effect.runSync(corrected.parse(absent))).toBe('info');
    expect(Effect.runSync(sentinel.parse(absent))).toBeNull();
    expect(Effect.runSync(widened.parse(absent))).toBe('legacy');
    expect(Effect.runSync(broadDefault.parse(absent))).toBe('legacy');
  });

  it('still validates supplied input', () => {
    expect(Effect.runSync(typo.parse(ConfigProvider.fromUnknown({ LEVEL: 'debug' })))).toBe('debug');
    expect(() => Effect.runSync(typo.parse(ConfigProvider.fromUnknown({ LEVEL: 'inof' })))).toThrow(
      /Expected "debug" \| "info"/,
    );
  });
});
