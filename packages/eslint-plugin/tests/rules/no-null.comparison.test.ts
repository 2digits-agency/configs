import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase } from 'eslint-vitest-rule-tester';

import { noNull, RULE_NAME } from '../../src/rules/no-null';

const typescript = String.raw;

const sharedInvalids: Array<InvalidTestCase> = [
  {
    name: 'const x = null is flagged',
    code: typescript`const x = null`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'foo(null) is flagged',
    code: typescript`foo(null)`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'return null → return (removes null)',
    code: typescript`function bar() { return null; }`,
    output: typescript`function bar() { return; }`,
    errors: [{ messageId: 'noNull' }],
  },
];

const enhancedFixInvalids: Array<InvalidTestCase> = [
  {
    name: 'let x = null → let x (removes initializer)',
    code: typescript`let x = null`,
    output: typescript`let x`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'var y = null → var y (removes initializer)',
    code: typescript`var y = null`,
    output: typescript`var y`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'x == null → x == undefined (loose equality)',
    code: typescript`if (x == null) {}`,
    output: typescript`if (x == undefined) {}`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'x != null → x != undefined (loose equality)',
    code: typescript`if (x != null) {}`,
    output: typescript`if (x != undefined) {}`,
    errors: [{ messageId: 'noNull' }],
  },
];

const strictEqualityInvalids: Array<InvalidTestCase> = [
  {
    name: 'x === null has suggestion but no auto-fix',
    code: typescript`if (x === null) {}`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    name: 'x !== null has suggestion but no auto-fix',
    code: typescript`if (x !== null) {}`,
    errors: [{ messageId: 'noNull' }],
  },
];

const allowedPatterns: Array<ValidTestCase> = [
  { name: 'Object.create(null)', code: typescript`Object.create(null)` },
  { name: 'useRef(null)', code: typescript`useRef(null)` },
  { name: 'React.useRef(null)', code: typescript`React.useRef(null)` },
  { name: 'node.insertBefore(x, null)', code: typescript`node.insertBefore(newNode, null)` },
];

await run({
  parser,
  parserOptions: {
    projectService: { allowDefaultProject: ['*.ts'] },
  },
  name: `${RULE_NAME}:comparison`,
  rule: noNull,
  valid: allowedPatterns,
  invalid: [...sharedInvalids, ...enhancedFixInvalids, ...strictEqualityInvalids],
});
