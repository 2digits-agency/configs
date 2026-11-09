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
  /**
   * File name of the valid case, such as a `.spec.ts` file that the rule skips.
   */
  readonly validFilename?: string;
  readonly options?: RuleTester.ValidTestCase['options'];
  readonly output?: string | null;
  readonly suggestions?: Array<RuleTester.ErrorSuggestion> | null;
}

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

/**
 * Shared test hooks and TypeScript module defaults; JSX tests override languageOptions.
 *
 * @param config Overrides for this test matrix.
 */
export function createRuleTester(config: RuleTester.Config = {}): RuleTester {
  return new RuleTester({
    languageOptions: {
      parserOptions: { lang: 'ts' },
      sourceType: 'module',
    },
    ...config,
  });
}

const tester = createRuleTester();

export function testRule(name: RuleName, rule: Rule, ruleCase: RuleCase): void {
  const options = P.isUndefined(ruleCase.options) ? {} : { options: ruleCase.options };

  const languageOptions = P.isUndefined(ruleCase.globals) ? {} : { languageOptions: { globals: ruleCase.globals } };

  tester.run(name, rule, {
    valid: [{ code: ruleCase.valid, filename: ruleCase.validFilename ?? 'valid.ts', ...options, ...languageOptions }],
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
