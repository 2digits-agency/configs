import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules, type RuleName } from '../src';

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

/**
 * Runs a registered rule against RuleTester cases.
 *
 * @param name - Rule name in the plugin registry.
 * @param tests - Valid and invalid cases; either list may be omitted.
 */
export function testRule(name: RuleName, tests: Partial<RuleTester.TestCases>): void {
  tester.run(name, rules[name], { valid: [], invalid: [], ...tests });
}
