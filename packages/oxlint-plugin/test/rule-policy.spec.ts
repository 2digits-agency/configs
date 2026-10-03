import { describe, expect, it } from 'vite-plus/test';

import plugin, { recommendedRules, rules } from '../src';

describe('async runSync rule policy', () => {
  it('registers the rule without silently enabling it by default', () => {
    expect(Object.hasOwn(rules, 'no-async-constructor-in-run-sync')).toBeTruthy();
    expect(plugin).toHaveProperty('rules.no-async-constructor-in-run-sync');
    expect(Object.hasOwn(recommendedRules, '2digits/no-async-constructor-in-run-sync')).toBeFalsy();
  });
});
