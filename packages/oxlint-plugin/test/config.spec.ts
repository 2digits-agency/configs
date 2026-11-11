import { describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import * as R from 'effect/Record';

import plugin, { recommendedRules, rules } from '../src';

describe('recommended configuration', () => {
  it('keeps policy-dependent rules opt-in', () => {
    const optIn = Arr.map(
      Arr.filter(R.toEntries(rules), ([, rule]) => rule.meta?.docs?.recommended !== true),
      ([name]) => name,
    );

    expect(optIn).toStrictEqual(['padding-line-between-statements', 'prefer-effect-filesystem', 'prefer-effect-path']);
  });

  it('uses rule metadata for both recommended exports with one warning exception', () => {
    const recommended = Arr.map(
      Arr.filter(R.toEntries(rules), ([, rule]) => rule.meta?.docs?.recommended === true),
      ([name]) => name,
    );

    const errors = Arr.filter(recommended, (name) => name !== 'prefer-effect-http-status');

    expect(recommendedRules).toStrictEqual({
      ...R.fromEntries(Arr.map(errors, (name) => [`2digits/${name}`, 'error'])),
      '2digits/prefer-effect-http-status': 'warn',
    });

    expect(plugin.configs.recommended.rules).toStrictEqual({
      ...R.fromEntries(Arr.map(errors, (name) => [`@2digits/oxlint-plugin/${name}`, 'error'])),
      '@2digits/oxlint-plugin/prefer-effect-http-status': 'warn',
    });

    expect(plugin.configs.all.rules).toStrictEqual(
      R.fromEntries(Arr.map(R.keys(rules), (name) => [`@2digits/oxlint-plugin/${name}`, 'error'])),
    );
  });
});
