import type { Rule } from '@oxlint/plugins';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import type { RuleName } from '../src';

interface RuleCase {
  readonly invalid: string;
  readonly messageId: string;
  readonly valid: string;
}

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

export function testRule(name: RuleName, rule: Rule, ruleCase: RuleCase): void {
  tester.run(name, rule, {
    valid: [{ code: ruleCase.valid, filename: 'valid.ts' }],
    invalid: [
      {
        code: ruleCase.invalid,
        filename: 'invalid.ts',
        errors: [{ messageId: ruleCase.messageId }],
      },
    ],
  });
}
