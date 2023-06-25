import path from 'node:path';

import { ESLintUtils } from '@typescript-eslint/utils';
import { afterAll, describe, it } from 'vitest';

export function getFixturesRootDir() {
  return path.join(__dirname, 'fixtures');
}

const { RuleTester } = ESLintUtils;

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

export { RuleTester };
