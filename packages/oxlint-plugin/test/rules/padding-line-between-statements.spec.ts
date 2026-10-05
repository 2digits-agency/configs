/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable sonar/no-duplicate-string -- Keep exact source/fix fixtures readable. */
import { describe, expectTypeOf, it } from '@effect/vitest';
import ts from 'dedent';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules, type PaddingLineOption } from '../../src';

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

const always = { blankLine: 'always', prev: '*', next: '*' } satisfies PaddingLineOption;

const never = { blankLine: 'never', prev: '*', next: '*' } satisfies PaddingLineOption;

const declarationMatchers: readonly ['const', 'let'] = ['const', 'let'];

describe('padding-line-between-statements types', () => {
  it('accepts readonly non-empty matchers without widening statement names', () => {
    type MatcherOption = PaddingLineOption['prev'];

    expectTypeOf<typeof declarationMatchers>().toExtend<MatcherOption>();

    expectTypeOf<readonly []>().not.toExtend<MatcherOption>();

    expectTypeOf<ReadonlyArray<string>>().not.toExtend<MatcherOption>();

    expectTypeOf<'unknown-statement'>().not.toExtend<MatcherOption>();
  });
});

const rule = rules['padding-line-between-statements'];

tester.run('padding-line-between-statements', rule, {
  valid: [
    {
      code: ts`
        foo();
        bar();
      `,
    },
    {
      code: ts`
        foo();

        bar();
      `,
      options: [always],
    },
    {
      code: ts`
        foo();
        bar();
      `,
      options: [never],
    },
    {
      code: ts`
        foo();

        bar();
      `,
      options: [{ ...always, blankLine: 'any' }],
    },
    {
      code: ts`
        const a = 1;
        const b = 2;
      `,
      options: [always, { blankLine: 'any', prev: [...declarationMatchers], next: [...declarationMatchers] }],
    },
    {
      code: ts`
        foo();
        // comment
        bar();
      `,
      options: [never],
    },
    {
      code: ts`
        foo();

        // comment
        bar();
      `,
      options: [always],
    },
    {
      code: ts`
        function f() { return 1; }

        function g() { return 2; }
      `,
      options: [always],
    },
    {
      code: ts`
        const a = 1;
        returnValue();
      `,
      options: [{ ...always, next: 'return' }],
    },
    {
      code: ts`
        const a = 1;
        foo();
      `,
      options: [{ ...always, next: { selector: 'ExpressionStatement', lineMode: 'multiline' } }],
    },
    { code: ts`type A = { a: string; b: number };`, options: [{ ...always, prev: 'ts-method', next: 'ts-method' }] },
  ],
  invalid: [
    ...(
      [
        [
          'singleline-block-like',
          ts`
          if (x) {}
          foo();
        `,
        ],
        [
          'multiline-block-like',
          ts`
          if (x) {
            bar();
          }
          foo();
        `,
        ],
        [
          'singleline-expression',
          ts`
          bar();
          foo();
        `,
        ],
        [
          'multiline-expression',
          ts`
          bar(
            1
          );
          foo();
        `,
        ],
        [
          'singleline-return',
          ts`
          function f() {
            return 1;
            foo();
          }
        `,
        ],
        [
          'multiline-return',
          ts`
          function f() {
            return (
              1
            );
            foo();
          }
        `,
        ],
        [
          'singleline-export',
          ts`
          export const a = 1;
          foo();
        `,
        ],
        [
          'multiline-export',
          ts`
          export const a = {
            b: 1
          };
          foo();
        `,
        ],
        [
          'singleline-var',
          ts`
          var a = 1;
          foo();
        `,
        ],
        [
          'multiline-var',
          ts`
          var a = {
            b: 1
          };
          foo();
        `,
        ],
        [
          'singleline-let',
          ts`
          let a = 1;
          foo();
        `,
        ],
        [
          'multiline-let',
          ts`
          let a = {
            b: 1
          };
          foo();
        `,
        ],
        [
          'singleline-const',
          ts`
          const a = 1;
          foo();
        `,
        ],
        [
          'multiline-const',
          ts`
          const a = {
            b: 1
          };
          foo();
        `,
        ],
        [
          'singleline-using',
          ts`
          using a = resource;
          foo();
        `,
        ],
        [
          'multiline-using',
          ts`
          using a = acquire(
            resource
          );
          foo();
        `,
        ],
        [
          'singleline-type',
          ts`
          type A = string;
          foo();
        `,
        ],
        [
          'multiline-type',
          ts`
          type A = {
            a: string
          };
          foo();
        `,
        ],
      ] satisfies Array<[PaddingLineOption['prev'], string]>
    ).map(([prev, code]) => ({
      code,
      output: code.replace(/\n(\s*foo\(\);)/u, '\n\n$1'),
      options: [{ ...always, prev }],
      errors: [{ messageId: 'expectedBlankLine' }],
    })),
    {
      code: ts`
        foo();
        function f() {
          a();
          b();
        }
        bar();
      `,
      output: ts`
        foo();
        function f() {
          a();

          b();
        }
        bar();
      `,
      options: [{ ...always, prev: 'expression', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        if (x) {
          a();
          b();
        }
        foo();
      `,
      output: ts`
        if (x) {
          a();

          b();
        }

        foo();
      `,
      options: [
        { ...always, prev: 'expression', next: 'expression' },
        { ...always, prev: { selector: 'BlockStatement' } },
        { ...always, prev: { selector: 'IfStatement:has(BlockStatement)' } },
      ],
      errors: [{ messageId: 'expectedBlankLine' }, { messageId: 'expectedBlankLine' }],
    },
    ...(
      [
        [
          ts`
          foo();
          bar();
        `,
          ts`
          foo();

          bar();
        `,
        ],
        ['foo(); bar();', 'foo();\n\n bar();'],
        [
          ts`
          foo()
          bar()
        `,
          ts`
          foo()

          bar()
        `,
        ],
        [
          ts`
          foo()
          ;[1].forEach(bar)
        `,
          ts`
          foo()

          ;[1].forEach(bar)
        `,
        ],
        [
          ts`
          foo(); // trailing
          bar();
        `,
          ts`
          foo(); // trailing

          bar();
        `,
        ],
        [
          ts`
          foo(); /* trailing */
          // leading
          bar();
        `,
          ts`
          foo(); /* trailing */

          // leading
          bar();
        `,
        ],
        [
          ts`
          foo();
          /** docs */
          function bar() {}
        `,
          ts`
          foo();

          /** docs */
          function bar() {}
        `,
        ],
        [
          ts`
          function f() {
            foo();
            return 1;
          }
        `,
          ts`
          function f() {
            foo();

            return 1;
          }
        `,
        ],
        [
          ts`
          class A { static {
            foo();
            bar();
          } }
        `,
          ts`
          class A { static {
            foo();

            bar();
          } }
        `,
        ],
        [
          ts`
          namespace A {
            foo();
            bar();
          }
        `,
          ts`
          namespace A {
            foo();

            bar();
          }
        `,
        ],
        [
          ts`
          switch (x) { case 1: foo();
            bar(); }
        `,
          ts`
          switch (x) { case 1: foo();

            bar(); }
        `,
        ],
        [
          ts`
          export type A = string;
          export interface B {}
        `,
          ts`
          export type A = string;

          export interface B {}
        `,
        ],
        [
          ts`
          interface A {
            foo(): void;
            bar(): void;
          }
        `,
          ts`
          interface A {
            foo(): void;

            bar(): void;
          }
        `,
        ],
        [
          ts`
          type A = {
            foo(): void;
            bar(): void;
          }
        `,
          ts`
          type A = {
            foo(): void;

            bar(): void;
          }
        `,
        ],
        [
          ts`
            function f(x: string): void;
            function f(x: string) {}
          `,
          ts`
            function f(x: string): void;

            function f(x: string) {}
          `,
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
        [
          ts`
          foo();


          bar();
        `,
          ts`
          foo();
          bar();
        `,
        ],
        [
          ts`
          foo()

          ;[1].forEach(bar)
        `,
          ts`
          foo()
          ;[1].forEach(bar)
        `,
        ],
        [
          ts`
          foo(); // trailing

          bar();
        `,
          ts`
          foo(); // trailing
          bar();
        `,
        ],
        [
          ts`
          foo();

          // leading
          bar();
        `,
          ts`
          foo();
          // leading
          bar();
        `,
        ],
        ['foo();\r\n\r\nbar();', 'foo();\r\nbar();'],
      ] satisfies Array<[string, string]>
    ).map(([code, output]) => ({
      code,
      output,
      options: [never],
      errors: [{ messageId: 'unexpectedBlankLine' }],
    })),
    {
      code: ts`
        foo();

        // comment

        bar();
      `,
      options: [never],
      output: null,
      errors: [{ messageId: 'unexpectedBlankLine' }],
    },
    {
      code: ts`
        const a = 1;
        label: returnValue();
      `,
      output: ts`
        const a = 1;

        label: returnValue();
      `,
      options: [{ ...always, prev: 'const', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        const a = 1;
        foo();
      `,
      output: ts`
        const a = 1;

        foo();
      `,
      options: [
        {
          ...always,
          next: { selector: 'ExpressionStatement[expression.type="CallExpression"]', lineMode: 'singleline' },
        },
      ],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        foo();
        bar();
      `,
      output: ts`
        foo();

        bar();
      `,
      options: [{ ...always, prev: { selector: ':statement' }, next: { selector: ':statement' } }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        function f(x: string): void;
        function f(x: string) {}
      `,
      output: ts`
        function f(x: string): void;

        function f(x: string) {}
      `,
      options: [{ ...always, prev: { selector: 'TSDeclareFunction' }, next: 'function' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        "use strict";
        foo();
      `,
      output: ts`
        "use strict";

        foo();
      `,
      options: [{ ...always, prev: 'directive', next: 'expression' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        const value = {
          a: 1
        };
        foo();
      `,
      output: ts`
        const value = {
          a: 1
        };

        foo();
      `,
      options: [{ ...always, prev: 'multiline-const' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        const value = require("a");
        exports.value = value;
      `,
      output: ts`
        const value = require("a");

        exports.value = value;
      `,
      options: [{ ...always, prev: 'require', next: 'exports' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
    {
      code: ts`
        if (x) {}
        foo();
      `,
      output: ts`
        if (x) {}

        foo();
      `,
      options: [{ ...always, prev: 'block-like' }],
      errors: [{ messageId: 'expectedBlankLine' }],
    },
  ],
});
