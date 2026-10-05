import { describe, expect, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { recommendedRules, rules } from '../../../src';

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

const runtimeFilename = 'src/runtime.ts';

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'no-service-constructor-imports',
  rules['no-service-constructor-imports'],
  {
    valid: [
      ...['src/service.test.ts', 'src/service.spec.tsx', 'src/service.test.mts', 'src/service.spec.cts'].map(
        (filename) => ({
          filename,
          code: 'import { makeIssueService } from "./issue-service.ts";',
        }),
      ),
      { filename: runtimeFilename, code: 'import { makeExecutionMemo } from "alchemy/Runtime/ExecutionMemo";' },
      {
        filename: runtimeFilename,
        code: 'import { issueServiceLayer } from "./issue-service.ts"; WorkspaceName.make("name");',
      },
      { filename: runtimeFilename, code: 'import { makeissueService } from "./issue-service.ts";' },
      { filename: runtimeFilename, code: 'import makeIssueService from "./issue-service.ts";' },
      { filename: runtimeFilename, code: 'import * as Service from "./issue-service.ts";' },
      { filename: runtimeFilename, code: 'import { makeIssueService } from "@/issue-service";' },
    ],
    invalid: [
      {
        filename: runtimeFilename,
        code: 'import { makeIssueService } from "./issue-service.ts";',
        errors: [{ messageId: 'serviceConstructorImport', data: { name: 'makeIssueService' } }],
      },
      {
        filename: runtimeFilename,
        code: 'import { makeIssueService as createIssueService } from "../issue-service.ts";',
        errors: [{ messageId: 'serviceConstructorImport', data: { name: 'makeIssueService' } }],
      },
      {
        filename: runtimeFilename,
        code: 'import { "makeIssueService" as createIssueService } from "../issue-service.ts";',
        errors: [{ messageId: 'serviceConstructorImport', data: { name: 'makeIssueService' } }],
      },
    ],
  },
);

describe('anti-slop public rules', () => {
  it('exports every adapted rule in the recommended set', () => {
    for (const name of [
      'no-manual-effect-error-tag',
      'no-manual-tag-comparison',
      'no-manual-tagged-construction',
      'no-service-constructor-imports',
      'prefer-effect-match',
    ] as const) {
      expect(rules[name]).toBeDefined();

      expect(recommendedRules[`2digits/${name}`]).toBe('error');
    }
  });
});
