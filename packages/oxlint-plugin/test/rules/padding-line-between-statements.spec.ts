/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable sonar/no-duplicate-string -- Keep exact source/fix fixtures readable. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules, type PaddingLineOption } from '../../src';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const always = { blankLine: 'always', prev: '*', next: '*' } satisfies PaddingLineOption;
const never = { blankLine: 'never', prev: '*', next: '*' } satisfies PaddingLineOption;
const rule = rules['padding-line-between-statements'];

tester.run('padding-line-between-statements', rule, {
  valid: [
    { code: 'foo();\nbar();' },
    { code: 'foo();\n\nbar();', options: [always] },
    { code: 'foo();\nbar();', options: [never] },
    { code: 'foo();\n\nbar();', options: [{ ...always, blankLine: 'any' }] },
    {
      code: 'const a = 1;\nconst b = 2;',
      options: [always, { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] }],
    },
    { code: 'foo();\n// comment\nbar();', options: [never] },
    { code: 'foo();\n\n// comment\nbar();', options: [always] },
    { code: 'function f() { return 1; }\n\nfunction g() { return 2; }', options: [always] },
    { code: 'const a = 1;\nreturnValue();', options: [{ ...always, next: 'return' }] },
    {
      code: 'const a = 1;\nfoo();',
      options: [{ ...always, next: { selector: 'ExpressionStatement', lineMode: 'multiline' } }],
    },
    { code: 'type A = { a: string; b: number };', options: [{ ...always, prev: 'ts-method', next: 'ts-method' }] },
  ],
  invalid: [
    {
      code: 'foo();\nfunction f() {\na();\nb();\n}\nbar();',
      output: 'foo();\nfunction f() {\na();\n\nb();\n}\nbar();',
      options: [{ ...always, prev: 'expression', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'if (x) {\na();\nb();\n}\nfoo();',
      output: 'if (x) {\na();\n\nb();\n}\n\nfoo();',
      options: [
        { ...always, prev: 'expression', next: 'expression' },
        { ...always, prev: { selector: 'BlockStatement' } },
        { ...always, prev: { selector: 'IfStatement:has(BlockStatement)' } },
      ],
      errors: [{ messageId: 'expectedBlankLine' }, { messageId: 'expectedBlankLine' }],
    },
    ...(
      [
        ['foo();\nbar();', 'foo();\n\nbar();'],
        ['foo(); bar();', 'foo();\n\n bar();'],
        ['foo()\nbar()', 'foo()\n\nbar()'],
        ['foo()\n;[1].forEach(bar)', 'foo()\n\n;[1].forEach(bar)'],
        ['foo(); // trailing\nbar();', 'foo(); // trailing\n\nbar();'],
        ['foo(); /* trailing */\n// leading\nbar();', 'foo(); /* trailing */\n\n// leading\nbar();'],
        ['foo();\n/** docs */\nfunction bar() {}', 'foo();\n\n/** docs */\nfunction bar() {}'],
        ['function f() {\nfoo();\nreturn 1;\n}', 'function f() {\nfoo();\n\nreturn 1;\n}'],
        ['class A { static {\nfoo();\nbar();\n} }', 'class A { static {\nfoo();\n\nbar();\n} }'],
        ['namespace A {\nfoo();\nbar();\n}', 'namespace A {\nfoo();\n\nbar();\n}'],
        ['switch (x) { case 1: foo();\nbar(); }', 'switch (x) { case 1: foo();\n\nbar(); }'],
        ['export type A = string;\nexport interface B {}', 'export type A = string;\n\nexport interface B {}'],
        ['interface A {\nfoo(): void;\nbar(): void;\n}', 'interface A {\nfoo(): void;\n\nbar(): void;\n}'],
        ['type A = {\nfoo(): void;\nbar(): void;\n}', 'type A = {\nfoo(): void;\n\nbar(): void;\n}'],
        [
          'function f(x: string): void;\nfunction f(x: string) {}',
          'function f(x: string): void;\n\nfunction f(x: string) {}',
        ],
        ['foo();\r\nbar();', 'foo();\n\r\nbar();'],
      ] satisfies Array<[string, string]>
    ).map(([code, output]) => ({
      code,
      output,
      options: [always],
      errors: [{ messageId: 'expectedBlankLine' }],
    })),
    ...(
      [
        ['foo();\n\n\nbar();', 'foo();\nbar();'],
        ['foo()\n\n;[1].forEach(bar)', 'foo()\n;[1].forEach(bar)'],
        ['foo(); // trailing\n\nbar();', 'foo(); // trailing\nbar();'],
        ['foo();\n\n// leading\nbar();', 'foo();\n// leading\nbar();'],
        ['foo();\r\n\r\nbar();', 'foo();\r\nbar();'],
      ] satisfies Array<[string, string]>
    ).map(([code, output]) => ({
      code,
      output,
      options: [never],
      errors: [{ messageId: 'unexpectedBlankLine' }],
    })),
    {
      code: 'foo();\n\n// comment\n\nbar();',
      options: [never],
      output: null,
      errors: [{ messageId: 'unexpectedBlankLine' }],
    },
    {
      code: 'const a = 1;\nlabel: returnValue();',
      output: 'const a = 1;\n\nlabel: returnValue();',
      options: [{ ...always, prev: 'const', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'const a = 1;\nfoo();',
      output: 'const a = 1;\n\nfoo();',
      options: [
        {
          ...always,
          next: { selector: 'ExpressionStatement[expression.type="CallExpression"]', lineMode: 'singleline' },
        },
      ],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'foo();\nbar();',
      output: 'foo();\n\nbar();',
      options: [{ ...always, prev: { selector: ':statement' }, next: { selector: ':statement' } }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'function f(x: string): void;\nfunction f(x: string) {}',
      output: 'function f(x: string): void;\n\nfunction f(x: string) {}',
      options: [{ ...always, prev: { selector: 'TSDeclareFunction' }, next: 'function' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: '"use strict";\nfoo();',
      output: '"use strict";\n\nfoo();',
      options: [{ ...always, prev: 'directive', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'const value = {\na: 1\n};\nfoo();',
      output: 'const value = {\na: 1\n};\n\nfoo();',
      options: [{ ...always, prev: 'multiline-const' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'const value = require("a");\nexports.value = value;',
      output: 'const value = require("a");\n\nexports.value = value;',
      options: [{ ...always, prev: 'require', next: 'exports' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: 'if (x) {}\nfoo();',
      output: 'if (x) {}\n\nfoo();',
      options: [{ ...always, prev: 'block-like' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
  ],
});

describe('statement spacing policy', () => {
  it('keeps statement spacing opt-in', () => {
    expect(Object.hasOwn(recommendedRules, '2digits/padding-line-between-statements')).toBeFalsy();
  });
});
