import path from 'node:path';

import { RuleTester as _RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

export function getFixturesRootDir() {
  return path.join(__dirname, 'fixtures');
}

const RuleTester = _RuleTester;
RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

export { RuleTester };
