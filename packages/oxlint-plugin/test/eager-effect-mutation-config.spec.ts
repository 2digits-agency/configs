import { describe, expect, it } from 'vite-plus/test';

import plugin, { recommendedRules, rules } from '../src';

describe('opt-in timing diagnostic', () => {
  it('registers the timing diagnostic without enabling it by default or offering a fix', () => {
    expect(plugin).toHaveProperty('rules.no-eager-effect-mutation');
    expect(recommendedRules['2digits/no-eager-effect-mutation']).toBeUndefined();
    expect(rules['no-eager-effect-mutation'].meta?.docs).toMatchObject({ recommended: false });
    expect(rules['no-eager-effect-mutation'].meta?.fixable).toBeUndefined();
    expect(rules['no-eager-effect-mutation'].meta?.hasSuggestions).toBeUndefined();
  });
});
