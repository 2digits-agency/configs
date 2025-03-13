import tsParser from '@typescript-eslint/parser';
import { run as _run, type RuleTesterInitOptions, type TestCasesOptions } from 'eslint-vitest-rule-tester';

export function run(options: TestCasesOptions & RuleTesterInitOptions) {
  return _run({
    parser: tsParser as never,
    ...options,
  });
}
