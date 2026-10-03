import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules, type RuleName } from '../src';

describe('rule registration', () => {
  it('registers stale Struct.evolve keys as an opt-in rule without fixes', () => {
    const name: RuleName = 'no-stale-struct-evolve-keys';

    expect(rules[name]).toBeDefined();
    expect(rules[name].meta?.docs).toMatchObject({
      recommended: false,
      url: 'https://github.com/Effect-TS/tsgo/issues/488',
    });
    expect(rules[name].meta?.fixable).toBeUndefined();
    expect(rules[name].meta?.hasSuggestions).toBeUndefined();
    expect(recommendedRules['2digits/no-stale-struct-evolve-keys']).toBeUndefined();
  });
});
