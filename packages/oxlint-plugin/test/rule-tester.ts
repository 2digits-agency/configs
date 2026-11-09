import { describe, it } from '@effect/vitest';
import type { Rule } from '@oxlint/plugins';
import * as P from 'effect/Predicate';
import { RuleTester } from 'oxlint/plugins-dev';

import type { RuleName } from '../src';

interface RuleCase {
  readonly invalid: string;
  readonly messageId: string;
  readonly data?: Readonly<Record<string, string>>;
  readonly globals?: Readonly<Record<string, 'readonly' | 'writable'>>;
  readonly valid: string;
  readonly options?: RuleTester.ValidTestCase['options'];
  readonly output?: string | null;
  readonly suggestions?: Array<RuleTester.ErrorSuggestion> | null;
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
  const options = P.isUndefined(ruleCase.options) ? {} : { options: ruleCase.options };

  const languageOptions = P.isUndefined(ruleCase.globals) ? {} : { languageOptions: { globals: ruleCase.globals } };

  tester.run(name, rule, {
    valid: [{ code: ruleCase.valid, filename: 'valid.ts', ...options, ...languageOptions }],
    invalid: [
      {
        code: ruleCase.invalid,
        filename: 'invalid.ts',
        ...options,
        ...languageOptions,
        errors: [
          {
            messageId: ruleCase.messageId,
            ...(P.isUndefined(ruleCase.data) ? {} : { data: ruleCase.data }),
            ...(P.isUndefined(ruleCase.suggestions) ? {} : { suggestions: ruleCase.suggestions }),
          },
        ],
        ...(P.isUndefined(ruleCase.output) ? {} : { output: ruleCase.output }),
      },
    ],
  });
}
