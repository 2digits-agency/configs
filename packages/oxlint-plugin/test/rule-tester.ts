import { describe, it } from '@effect/vitest';
import type { Rule } from '@oxlint/plugins';
import { RuleTester } from 'oxlint/plugins-dev';

import type { RuleName } from '../src';

interface RuleCase {
  readonly invalid: string;
  readonly messageId: string;
  readonly valid: string;
  readonly options?: RuleTester.ValidTestCase['options'];
  readonly output?: string | null;
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
  const options = ruleCase.options === undefined ? {} : { options: ruleCase.options };

  tester.run(name, rule, {
    valid: [{ code: ruleCase.valid, filename: 'valid.ts', ...options }],
    invalid: [
      {
        code: ruleCase.invalid,
        filename: 'invalid.ts',
        ...options,
        errors: [{ messageId: ruleCase.messageId }],
        ...(ruleCase.output === undefined ? {} : { output: ruleCase.output }),
      },
    ],
  });
}
