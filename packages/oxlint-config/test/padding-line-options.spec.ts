import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { PaddingLineOption } from '@2digits/oxlint-plugin';

import withTwoDigits, { type DummyRuleMap } from '../src';

describe('statement spacing configuration types', () => {
  it('accepts variadic policies through the public config builder', () => {
    const rules = {
      '2digits/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'any', prev: ['const', 'let'], next: { selector: 'ExpressionStatement', lineMode: 'singleline' } },
      ],
    } satisfies DummyRuleMap;

    const config = withTwoDigits({ rules });

    expect(config.rules?.['2digits/padding-line-between-statements']).toStrictEqual(
      rules['2digits/padding-line-between-statements'],
    );

    expectTypeOf<PaddingLineOption['blankLine']>().toEqualTypeOf<'always' | 'any' | 'never'>();
  });
});
