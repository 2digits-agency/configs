import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase } from 'eslint-vitest-rule-tester';

import { noNull, RULE_NAME } from '../../src/rules/no-null';

const typescript = String.raw;

const valids: Array<ValidTestCase> = [
  typescript`const x = undefined`,
  typescript`let x`,
  typescript`function foo() { return; }`,
  typescript`function foo() { return undefined; }`,

  typescript`Object.create(null)`,
  typescript`useRef(null)`,
  typescript`React.useRef(null)`,
  typescript`node.insertBefore(newNode, null)`,
];

const invalids: Array<InvalidTestCase> = [
  {
    code: typescript`const x = null`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`let x = null`,
    output: typescript`let x`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`var x = null`,
    output: typescript`var x`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`function foo() { return null; }`,
    output: typescript`function foo() { return; }`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`const foo = () => { return null; }`,
    output: typescript`const foo = () => { return; }`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`foo(null)`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`const arr = [null]`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`const obj = { x: null }`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`if (x == null) {}`,
    output: typescript`if (x == undefined) {}`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`if (x != null) {}`,
    output: typescript`if (x != undefined) {}`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`if (x === null) {}`,
    errors: [{ messageId: 'noNull' }],
  },
  {
    code: typescript`if (x !== null) {}`,
    errors: [{ messageId: 'noNull' }],
  },
];

await run({
  parser,
  parserOptions: {
    projectService: {
      allowDefaultProject: ['*.ts'],
    },
  },
  name: RULE_NAME,
  rule: noNull,
  valid: valids,
  invalid: invalids,
});
