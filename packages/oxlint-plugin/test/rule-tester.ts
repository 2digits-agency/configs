import { describe, it } from '@effect/vitest';
import type { Rule } from '@oxlint/plugins';
import { RuleTester } from 'oxlint/plugins-dev';

import type { RuleName } from '../src';

interface RuleCase {
  readonly invalid: string;
  readonly messageId: string;
  readonly globals?: Readonly<Record<string, 'readonly' | 'writable'>>;
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
  const languageOptions = ruleCase.globals === undefined ? {} : { languageOptions: { globals: ruleCase.globals } };

  tester.run(name, rule, {
    valid: [{ code: ruleCase.valid, filename: 'valid.ts', ...options, ...languageOptions }],
    invalid: [
      {
        code: ruleCase.invalid,
        filename: 'invalid.ts',
        ...options,
        ...languageOptions,
        errors: [{ messageId: ruleCase.messageId }],
        ...(ruleCase.output === undefined ? {} : { output: ruleCase.output }),
      },
    ],
  });
}
